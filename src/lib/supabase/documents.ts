import type { SupabaseClient } from "@supabase/supabase-js";
import type { MaterialType } from "@/lib/types";

export type InsertedDocument = { id: string };

export type DocumentInsertInput = {
  fileName: string;
  materialType: MaterialType;
  metadata: Record<string, unknown>;
  mimeType: string;
  sourceUrl?: string;
  status: "pending" | "processing" | "ready" | "failed";
  storagePath: string;
  studySpaceId: string;
  tenantId: string;
  userId: string;
};

export async function insertDocumentRecord(service: SupabaseClient, input: DocumentInsertInput) {
  const metadata = {
    ...input.metadata,
    material_type: input.materialType,
    mime_type: input.mimeType,
    source_url: input.sourceUrl ?? null,
  };

  const insertPayload = {
    study_space_id: input.studySpaceId,
    tenant_id: input.tenantId,
    user_id: input.userId,
    file_name: input.fileName,
    storage_path: input.storagePath,
    material_type: input.materialType,
    mime_type: input.mimeType,
    source_url: input.sourceUrl ?? null,
    processing_status: input.status,
    metadata,
  };

  const { data, error } = await service
    .from("documents")
    .insert(insertPayload)
    .select("id")
    .single<InsertedDocument>();

  if (!error && data) {
    return data;
  }

  if (!isLegacyMaterialColumnError(error)) {
    throw error ?? new Error("Unable to create material record.");
  }

  const { data: legacyData, error: legacyError } = await service
    .from("documents")
    .insert({
      study_space_id: input.studySpaceId,
      tenant_id: input.tenantId,
      user_id: input.userId,
      file_name: input.fileName,
      storage_path: input.storagePath,
      processing_status: input.status,
      metadata,
    })
    .select("id")
    .single<InsertedDocument>();

  if (legacyError || !legacyData) {
    throw legacyError ?? new Error("Unable to create material record.");
  }

  return legacyData;
}

function isLegacyMaterialColumnError(error: unknown) {
  const message = String((error as { message?: unknown } | null)?.message ?? "").toLowerCase();
  const code = String((error as { code?: unknown } | null)?.code ?? "").toLowerCase();

  return (
    code === "pgrst204" ||
    code === "42703" ||
    message.includes("material_type") ||
    message.includes("mime_type") ||
    message.includes("source_url")
  );
}
