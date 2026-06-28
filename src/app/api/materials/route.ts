import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { validateAndIntake } from "@/lib/ai/agents/pdf-intake-agent";
import { embedAndStore } from "@/lib/ai/agents/embedding-agent";
import { enqueueDocumentProcessing } from "@/lib/ai/background-worker";
import { getAuthedProfile } from "@/lib/supabase/service";
import { getPdfMaxBytes, SAFETY_LIMITS } from "@/lib/limits";
import { chunkTextByPage } from "@/lib/rag/chunk";
import type { MaterialType } from "@/lib/types";
import {
  ApiError,
  enforceContentLength,
  errorResponse,
  isPdfBuffer,
  jsonError,
  jsonResponse,
  parseJsonBody,
  rateLimit,
  rateLimitKey,
  requireOwnedStudySpace,
  safeErrorMessage,
} from "@/app/api/_shared/security";

export const runtime = "nodejs";

const DOCUMENTS_BUCKET = "documents";
const MAX_TEXT_CHARS = 180_000;
const MAX_LINK_BYTES = 1_500_000;
const studySpaceIdSchema = z.string().uuid();
const materialTypeSchema = z.enum(["pdf", "image", "document", "link", "text"]);
const jsonMaterialSchema = z.object({
  studySpaceId: z.string().uuid(),
  materialType: z.enum(["link", "text"]),
  url: z.string().url().max(2048).optional(),
  text: z.string().trim().min(1).max(MAX_TEXT_CHARS).optional(),
});

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "text/plain",
  "text/markdown",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

type InsertedDocument = { id: string };

export async function POST(request: Request) {
  let documentId: string | null = null;
  let service: SupabaseClient | null = null;
  let uploadedStoragePath: string | null = null;

  try {
    const authContext = await getAuthedProfile(request.headers.get("authorization"));
    const { profile } = authContext;
    service = authContext.service;

    const limit = rateLimit(rateLimitKey(request, profile.id, "materials"), 10);
    if (!limit.ok) {
      return jsonError("Too many uploads. Please wait a minute and try again.", 429);
    }

    const contentType = request.headers.get("content-type") ?? "";
    const isMultipart = contentType.toLowerCase().includes("multipart/form-data");

    if (!isMultipart) {
      const body = await parseJsonBody(request, jsonMaterialSchema, MAX_TEXT_CHARS + 4096);
      await requireOwnedStudySpace(service, profile, body.studySpaceId);

      if (body.materialType === "link") {
        if (!body.url) {
          throw new ApiError(400, "URL is required.");
        }
        const extracted = await extractLinkText(body.url);
        const document = await createTextMaterial({
          service,
          tenantId: profile.tenant_id,
          userId: profile.id,
          studySpaceId: body.studySpaceId,
          title: extracted.title || body.url,
          materialType: "link",
          sourceUrl: body.url,
          text: extracted.text,
          mimeType: extracted.mimeType,
        });
        return jsonResponse({ documentId: document.id, status: "ready", message: "Material added." });
      }

      if (!body.text) {
        throw new ApiError(400, "Text is required.");
      }

      const document = await createTextMaterial({
        service,
        tenantId: profile.tenant_id,
        userId: profile.id,
        studySpaceId: body.studySpaceId,
        title: "Nota",
        materialType: "text",
        text: body.text,
        mimeType: "text/plain",
      });
      return jsonResponse({ documentId: document.id, status: "ready", message: "Material added." });
    }

    const maxBytes = getPdfMaxBytes();
    enforceContentLength(request, maxBytes + 1024 * 1024, true);

    const formData = await request.formData();
    const file = formData.get("file");
    const studySpaceId = formData.get("studySpaceId");
    const rawMaterialType = formData.get("materialType");

    if (!(file instanceof File) || typeof studySpaceId !== "string") {
      throw new ApiError(400, "File and studySpaceId are required.");
    }

    const parsedStudySpaceId = studySpaceIdSchema.safeParse(studySpaceId);
    if (!parsedStudySpaceId.success) {
      throw new ApiError(400, "studySpaceId must be a valid UUID.");
    }

    const parsedMaterialType = materialTypeSchema.safeParse(rawMaterialType || inferMaterialType(file));
    if (!parsedMaterialType.success || parsedMaterialType.data === "link" || parsedMaterialType.data === "text") {
      throw new ApiError(400, "Unsupported file material type.");
    }

    const materialType = parsedMaterialType.data;
    await requireOwnedStudySpace(service, profile, parsedStudySpaceId.data);

    if (file.size <= 0 || file.size > maxBytes) {
      const sizeMb = (maxBytes / (1024 * 1024)).toFixed(0);
      throw new ApiError(400, `Material must be between 1 byte and ${sizeMb} MB.`);
    }

    if (!isAllowedMime(file.type, materialType, file.name)) {
      throw new ApiError(400, "This material type is not supported yet.");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const safeName = sanitizeFileName(file.name, materialType);
    const storagePath = `${profile.tenant_id}/${profile.id}/${parsedStudySpaceId.data}/${crypto.randomUUID()}-${safeName}`;

    await ensureDocumentsBucket(service, maxBytes);
    const { error: uploadError } = await service.storage.from(DOCUMENTS_BUCKET).upload(storagePath, buffer, {
      contentType: file.type || fallbackMimeType(materialType),
      upsert: false,
    });

    if (uploadError) {
      throw uploadError;
    }
    uploadedStoragePath = storagePath;

    if (materialType === "pdf") {
      if (!isPdfBuffer(buffer)) {
        throw new ApiError(400, "Uploaded file is not a valid PDF.");
      }

      const intakeResult = await validateAndIntake(buffer, file.name);
      if (!intakeResult.ok) {
        throw new ApiError(400, intakeResult.error ?? "Failed PDF validation.");
      }

      const document = await insertDocument(service, {
        tenantId: profile.tenant_id,
        userId: profile.id,
        studySpaceId: parsedStudySpaceId.data,
        fileName: file.name,
        storagePath,
        materialType,
        mimeType: "application/pdf",
        status: "pending",
        metadata: {
          byte_size: file.size,
          page_count: intakeResult.pageCount,
        },
      });

      documentId = document.id;
      enqueueDocumentProcessing({
        service,
        tenantId: profile.tenant_id,
        userId: profile.id,
        studySpaceId: parsedStudySpaceId.data,
        documentId: document.id,
        fileName: file.name,
        fileBuffer: buffer,
      });

      return jsonResponse({ documentId: document.id, status: "pending", message: "Material is preparing." });
    }

    if (materialType === "document") {
      const text = await extractDocumentText(buffer, file);
      const document = await createTextMaterial({
        service,
        tenantId: profile.tenant_id,
        userId: profile.id,
        studySpaceId: parsedStudySpaceId.data,
        title: file.name,
        materialType,
        text,
        mimeType: file.type || fallbackMimeType(materialType),
        storagePath,
        byteSize: file.size,
      });
      documentId = document.id;
      return jsonResponse({ documentId: document.id, status: "ready", message: "Material added." });
    }

    const document = await insertDocument(service, {
      tenantId: profile.tenant_id,
      userId: profile.id,
      studySpaceId: parsedStudySpaceId.data,
      fileName: file.name,
      storagePath,
      materialType,
      mimeType: file.type || fallbackMimeType(materialType),
      status: "ready",
      metadata: {
        byte_size: file.size,
        stored_only: materialType === "image",
      },
    });
    documentId = document.id;

    return jsonResponse({ documentId: document.id, status: "ready", message: "Material added." });
  } catch (error) {
    if (documentId && service) {
      try {
        await service.from("document_chunks").delete().eq("document_id", documentId);
        await service
          .from("documents")
          .update({
            processing_status: "failed",
            error_message: safeErrorMessage(error, "Unable to prepare material."),
          })
          .eq("id", documentId);
      } catch {}
    } else if (uploadedStoragePath && service) {
      try {
        await service.storage.from(DOCUMENTS_BUCKET).remove([uploadedStoragePath]);
      } catch {}
    }

    return errorResponse(error, "Unable to add material.");
  }
}

async function createTextMaterial({
  byteSize,
  materialType,
  mimeType,
  service,
  sourceUrl,
  storagePath,
  studySpaceId,
  tenantId,
  text,
  title,
  userId,
}: {
  byteSize?: number;
  materialType: MaterialType;
  mimeType: string;
  service: SupabaseClient;
  sourceUrl?: string;
  storagePath?: string;
  studySpaceId: string;
  tenantId: string;
  text: string;
  title: string;
  userId: string;
}) {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length < 20) {
    throw new ApiError(400, "This material does not contain enough readable text.");
  }

  const chunks = chunkTextByPage(trimmed.slice(0, MAX_TEXT_CHARS)).slice(0, SAFETY_LIMITS.MAX_CHUNKS_PER_DOC);
  if (chunks.length === 0) {
    throw new ApiError(400, "This material does not contain enough readable text.");
  }

  const document = await insertDocument(service, {
    tenantId,
    userId,
    studySpaceId,
    fileName: title.slice(0, 160),
    storagePath: storagePath ?? `${materialType}/${crypto.randomUUID()}`,
    materialType,
    mimeType,
    sourceUrl,
    status: "processing",
    metadata: {
      byte_size: byteSize ?? Buffer.byteLength(trimmed, "utf8"),
      text_length: trimmed.length,
    },
  });

  try {
    await embedAndStore({
      service,
      documentId: document.id,
      studySpaceId,
      tenantId,
      chunks,
    });

    await service
      .from("documents")
      .update({
        processing_status: "ready",
        metadata: {
          byte_size: byteSize ?? Buffer.byteLength(trimmed, "utf8"),
          chunk_count: chunks.length,
          text_length: trimmed.length,
        },
      })
      .eq("id", document.id);
  } catch (error) {
    await service
      .from("documents")
      .update({
        processing_status: "failed",
        error_message: safeErrorMessage(error, "Unable to prepare material."),
      })
      .eq("id", document.id);
    throw error;
  }

  return document;
}

async function insertDocument(
  service: SupabaseClient,
  input: {
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
  },
) {
  const { data, error } = await service
    .from("documents")
    .insert({
      study_space_id: input.studySpaceId,
      tenant_id: input.tenantId,
      user_id: input.userId,
      file_name: input.fileName,
      storage_path: input.storagePath,
      material_type: input.materialType,
      mime_type: input.mimeType,
      source_url: input.sourceUrl ?? null,
      processing_status: input.status,
      metadata: input.metadata,
    })
    .select("id")
    .single<InsertedDocument>();

  if (error || !data) {
    throw error ?? new Error("Unable to create material record.");
  }

  return data;
}

async function extractDocumentText(buffer: Buffer, file: File) {
  const normalizedName = file.name.toLowerCase();
  if (file.type === "text/plain" || file.type === "text/markdown" || normalizedName.endsWith(".txt") || normalizedName.endsWith(".md")) {
    return buffer.toString("utf8");
  }

  if (
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.name.toLowerCase().endsWith(".docx")
  ) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  throw new ApiError(400, "Export this document as PDF, DOCX, or TXT and upload it again.");
}

async function extractLinkText(url: string) {
  const parsed = new URL(url);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new ApiError(400, "Only http and https links are supported.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "MentoraBot/1.0" },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new ApiError(400, "This link could not be opened.");
    }

    const mimeType = response.headers.get("content-type")?.split(";")[0]?.trim() || "text/html";
    const raw = (await response.text()).slice(0, MAX_LINK_BYTES);
    const title = raw.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, " ").trim() ?? parsed.hostname;
    const text = mimeType === "text/plain" ? raw : htmlToText(raw);
    return { mimeType, text, title };
  } finally {
    clearTimeout(timeout);
  }
}

function htmlToText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

async function ensureDocumentsBucket(service: SupabaseClient, maxBytes: number) {
  const bucket = await service.storage.getBucket(DOCUMENTS_BUCKET);

  if (!bucket.error) {
    const { error } = await service.storage.updateBucket(DOCUMENTS_BUCKET, {
      allowedMimeTypes: ALLOWED_MIME_TYPES,
      fileSizeLimit: maxBytes,
      public: false,
    });
    if (error) {
      throw error;
    }
    return;
  }

  const message = safeErrorMessage(bucket.error, "").toLowerCase();
  const statusCode = Number((bucket.error as { statusCode?: unknown; status?: unknown }).statusCode ?? (bucket.error as { status?: unknown }).status);
  if (statusCode !== 404 && !message.includes("not found") && !message.includes("does not exist")) {
    throw bucket.error;
  }

  const { error: createError } = await service.storage.createBucket(DOCUMENTS_BUCKET, {
    allowedMimeTypes: ALLOWED_MIME_TYPES,
    fileSizeLimit: maxBytes,
    public: false,
  });

  if (createError && !safeErrorMessage(createError, "").toLowerCase().includes("already exists")) {
    throw createError;
  }
}

function inferMaterialType(file: File): MaterialType {
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    return "pdf";
  }
  if (file.type.startsWith("image/")) {
    return "image";
  }
  return "document";
}

function isAllowedMime(mimeType: string, materialType: MaterialType, fileName = "") {
  const normalizedName = fileName.toLowerCase();
  if (materialType === "image") {
    return ["image/png", "image/jpeg", "image/webp"].includes(mimeType);
  }
  if (materialType === "pdf") {
    return mimeType === "application/pdf";
  }
  if (materialType === "document") {
    return [
      "text/plain",
      "text/markdown",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ].includes(mimeType) || normalizedName.endsWith(".txt") || normalizedName.endsWith(".md") || normalizedName.endsWith(".docx");
  }
  return false;
}

function fallbackMimeType(materialType: MaterialType) {
  if (materialType === "pdf") {
    return "application/pdf";
  }
  if (materialType === "image") {
    return "image/png";
  }
  return "text/plain";
}

function sanitizeFileName(fileName: string, materialType: MaterialType) {
  const extension = materialType === "pdf" ? ".pdf" : materialType === "image" ? "" : ".txt";
  return fileName.replace(/[^\w.\-]+/g, "_").replace(/^_+/, "").slice(0, 120) || `material${extension}`;
}
