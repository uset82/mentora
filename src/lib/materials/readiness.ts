import type { DocumentRecord, MaterialType } from "@/lib/types";

const READABLE_MATERIAL_TYPES = new Set<MaterialType>(["pdf", "document", "link", "text"]);

export function chunkCountForDocument(document: Pick<DocumentRecord, "metadata">) {
  const rawValue = document.metadata?.chunk_count;

  if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
    return Math.max(0, Math.floor(rawValue));
  }

  if (typeof rawValue === "string") {
    const parsed = Number(rawValue);
    return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
  }

  return 0;
}

export function isGeneratorReadyDocument(document: DocumentRecord) {
  return (
    document.processing_status === "ready" &&
    READABLE_MATERIAL_TYPES.has(document.material_type) &&
    chunkCountForDocument(document) > 0
  );
}

export function normalizeMaterialType(value: unknown, fallbackName = ""): MaterialType {
  if (value === "pdf" || value === "image" || value === "document" || value === "link" || value === "text") {
    return value;
  }

  const normalizedName = fallbackName.toLowerCase();
  if (normalizedName.endsWith(".png") || normalizedName.endsWith(".jpg") || normalizedName.endsWith(".jpeg") || normalizedName.endsWith(".webp")) {
    return "image";
  }
  if (normalizedName.endsWith(".txt") || normalizedName.endsWith(".md")) {
    return "document";
  }
  if (normalizedName.endsWith(".docx")) {
    return "document";
  }

  return "pdf";
}
