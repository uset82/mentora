import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { getAuthedProfile } from "@/lib/supabase/service";
import { validateAndIntake } from "@/lib/ai/agents/pdf-intake-agent";
import { enqueueDocumentProcessing } from "@/lib/ai/background-worker";
import { getPdfMaxBytes } from "@/lib/limits";
import {
  ApiError,
  enforceContentLength,
  errorResponse,
  isPdfBuffer,
  jsonError,
  jsonResponse,
  rateLimit,
  rateLimitKey,
  requireOwnedStudySpace,
  safeErrorMessage,
} from "@/app/api/_shared/security";

export const runtime = "nodejs";

const studySpaceIdSchema = z.string().uuid();
const DOCUMENTS_BUCKET = "documents";

export async function POST(request: Request) {
  let documentId: string | null = null;
  let service: SupabaseClient | null = null;
  let uploadedStoragePath: string | null = null;

  try {
    const authContext = await getAuthedProfile(request.headers.get("authorization"));
    const { profile } = authContext;
    service = authContext.service;

    const limit = rateLimit(rateLimitKey(request, profile.id, "ingest"), 6);
    if (!limit.ok) {
      return jsonError("Too many uploads. Please wait a minute and try again.", 429);
    }

    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("multipart/form-data")) {
      throw new ApiError(415, "Content-Type must be multipart/form-data.");
    }

    const maxBytes = getPdfMaxBytes();
    // Allow slightly larger form payload to account for metadata
    const maxFormBytes = maxBytes + 1024 * 1024;
    enforceContentLength(request, maxFormBytes, true);

    const formData = await request.formData();
    const file = formData.get("file");
    const studySpaceId = formData.get("studySpaceId");

    if (!(file instanceof File) || typeof studySpaceId !== "string") {
      throw new ApiError(400, "PDF file and studySpaceId are required.");
    }

    const parsedStudySpaceId = studySpaceIdSchema.safeParse(studySpaceId);
    if (!parsedStudySpaceId.success) {
      throw new ApiError(400, "studySpaceId must be a valid UUID.");
    }

    if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) {
      throw new ApiError(400, "Only PDF uploads are supported.");
    }

    if (file.size <= 0 || file.size > maxBytes) {
      const sizeMb = (maxBytes / (1024 * 1024)).toFixed(0);
      throw new ApiError(400, `PDF must be between 1 byte and ${sizeMb} MB.`);
    }

    await requireOwnedStudySpace(service, profile, parsedStudySpaceId.data);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (!isPdfBuffer(buffer)) {
      throw new ApiError(400, "Uploaded file is not a valid PDF.");
    }

    // --- SINK CHIPS: Run Intake Agent Synchronously for Fast Constraints Check ---
    const intakeResult = await validateAndIntake(buffer, file.name);
    if (!intakeResult.ok) {
      throw new ApiError(400, intakeResult.error ?? "Failed PDF validation.");
    }

    const safeName = file.name.replace(/[^\w.\-]+/g, "_").replace(/^_+/, "").slice(0, 120) || "document.pdf";
    const storagePath = `${profile.tenant_id}/${profile.id}/${parsedStudySpaceId.data}/${crypto.randomUUID()}-${safeName}`;

    await ensureDocumentsBucket(service, maxBytes);

    const { error: uploadError } = await service.storage.from(DOCUMENTS_BUCKET).upload(storagePath, buffer, {
      contentType: "application/pdf",
      upsert: false,
    });

    if (uploadError) {
      throw uploadError;
    }
    uploadedStoragePath = storagePath;

    // Create the document record with 'pending' status
    const { data: document, error: insertError } = await service
      .from("documents")
      .insert({
        study_space_id: parsedStudySpaceId.data,
        tenant_id: profile.tenant_id,
        user_id: profile.id,
        file_name: file.name,
        storage_path: storagePath,
        material_type: "pdf",
        mime_type: "application/pdf",
        processing_status: "pending",
        metadata: {
          byte_size: file.size,
          page_count: intakeResult.pageCount,
        },
      })
      .select("id")
      .single();

    if (insertError || !document) {
      throw insertError ?? new Error("Unable to create document record.");
    }

    documentId = document.id;

    // --- ENQUEUE BACKGROUND PROCESSING ---
    enqueueDocumentProcessing({
      service,
      tenantId: profile.tenant_id,
      userId: profile.id,
      studySpaceId: parsedStudySpaceId.data,
      documentId: document.id,
      fileName: file.name,
      fileBuffer: buffer,
    });

    return jsonResponse({
      documentId: document.id,
      status: "pending",
      message: "Background processing has started successfully.",
    });
  } catch (error) {
    if (documentId && service) {
      try {
        await service.from("document_chunks").delete().eq("document_id", documentId);
        await service
          .from("documents")
          .update({
            processing_status: "failed",
            error_message: safeErrorMessage(error, "Unknown ingestion error."),
          })
          .eq("id", documentId);
      } catch {
        // Keep original error visible
      }
    } else if (uploadedStoragePath && service) {
      try {
        await service.storage.from(DOCUMENTS_BUCKET).remove([uploadedStoragePath]);
      } catch {
        // Keep original error visible
      }
    }

    return errorResponse(error, "Unable to process document.");
  }
}

async function ensureDocumentsBucket(service: SupabaseClient, maxBytes: number) {
  const { error } = await service.storage.getBucket(DOCUMENTS_BUCKET);
  if (!error) {
    return;
  }

  const message = safeErrorMessage(error, "").toLowerCase();
  const statusCode = Number((error as { statusCode?: unknown; status?: unknown }).statusCode ?? (error as { status?: unknown }).status);
  if (statusCode !== 404 && !message.includes("not found") && !message.includes("does not exist")) {
    throw error;
  }

  const { error: createError } = await service.storage.createBucket(DOCUMENTS_BUCKET, {
    allowedMimeTypes: [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/webp",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    fileSizeLimit: maxBytes,
    public: false,
  });

  if (createError && !safeErrorMessage(createError, "").toLowerCase().includes("already exists")) {
    throw createError;
  }
}
