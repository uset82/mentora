import { z } from "zod";
import { enqueueDocumentProcessing } from "@/lib/ai/background-worker";
import { getAuthedProfile } from "@/lib/supabase/service";
import {
  ApiError,
  errorResponse,
  isPdfBuffer,
  jsonResponse,
  parseJsonBody,
  rateLimit,
  rateLimitKey,
  safeErrorMessage,
} from "@/app/api/_shared/security";

export const runtime = "nodejs";

const DOCUMENTS_BUCKET = "documents";
const retrySchema = z.object({
  documentId: z.string().uuid(),
});

type RetryDocumentRow = {
  id: string;
  study_space_id: string;
  tenant_id: string;
  user_id: string;
  file_name: string;
  storage_path: string;
  metadata: Record<string, unknown> | null;
};

export async function POST(request: Request) {
  try {
    const { profile, service } = await getAuthedProfile(request.headers.get("authorization"));
    const body = await parseJsonBody(request, retrySchema);
    const limit = rateLimit(rateLimitKey(request, profile.id, "materials-retry"), 6);
    if (!limit.ok) {
      throw new ApiError(429, "Too many retry requests. Please wait a minute and try again.");
    }

    const { data: document, error: documentError } = await service
      .from("documents")
      .select("id, study_space_id, tenant_id, user_id, file_name, storage_path, metadata")
      .eq("id", body.documentId)
      .eq("tenant_id", profile.tenant_id)
      .eq("user_id", profile.id)
      .maybeSingle<RetryDocumentRow>();

    if (documentError) {
      throw documentError;
    }
    if (!document) {
      throw new ApiError(404, "Material not found.");
    }

    const { data: fileBlob, error: downloadError } = await service.storage
      .from(DOCUMENTS_BUCKET)
      .download(document.storage_path);

    if (downloadError || !fileBlob) {
      throw downloadError ?? new ApiError(404, "Stored material file not found.");
    }

    const fileBuffer = Buffer.from(await fileBlob.arrayBuffer());
    if (!isPdfBuffer(fileBuffer)) {
      throw new ApiError(400, "Only stored PDF materials can be retried right now.");
    }

    await service.from("document_chunks").delete().eq("document_id", document.id);
    await service
      .from("document_processing_jobs")
      .update({
        status: "failed",
        current_step: "retrying",
        error_message: "Superseded by manual retry.",
        completed_at: new Date().toISOString(),
      })
      .eq("document_id", document.id)
      .in("status", ["pending", "processing"]);

    const metadata = isRecord(document.metadata) ? document.metadata : {};
    await service
      .from("documents")
      .update({
        processing_status: "pending",
        error_message: null,
        metadata: {
          ...metadata,
          chunk_count: 0,
          generator_ready: false,
          retried_at: new Date().toISOString(),
        },
      })
      .eq("id", document.id);

    enqueueDocumentProcessing({
      service,
      tenantId: document.tenant_id,
      userId: document.user_id,
      studySpaceId: document.study_space_id,
      documentId: document.id,
      fileName: document.file_name,
      fileBuffer,
    });

    return jsonResponse({ documentId: document.id, status: "pending", message: "Material retry started." });
  } catch (error) {
    return errorResponse(error, safeErrorMessage(error, "Unable to retry material."));
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
