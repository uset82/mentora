"use client";

import { Check, FileImage, FileText, Globe2, Loader2, NotebookPen, Paperclip, Trash2 } from "lucide-react";
import type { DocumentRecord, MaterialType } from "@/lib/types";
import { chunkCountForDocument } from "@/lib/materials/readiness";

type MaterialCardProps = {
  deleting: boolean;
  document: DocumentRecord;
  onDelete: (documentId: string) => Promise<boolean> | boolean;
  onToggle: (documentId: string) => void;
  selected: boolean;
};

export function MaterialCard({ deleting, document, onDelete, onToggle, selected }: MaterialCardProps) {
  const status = sourceStatus(document);

  return (
    <article
      className={`notebook-source-card group rounded-[16px] border px-3 py-2.5 transition ${selected ? "is-selected" : ""}`}
    >
      <div className="grid min-h-11 grid-cols-[32px_minmax(0,1fr)_26px_26px] items-center gap-2">
        <span className="notebook-source-icon flex h-8 w-8 items-center justify-center rounded-[12px]">{materialIcon(document.material_type)}</span>
        <div className="min-w-0">
          <p className="min-w-0 truncate text-[13px] font-semibold leading-5">{document.file_name}</p>
          <div className="mt-0.5 flex min-w-0 items-center gap-2 text-[11px] font-medium">
            <span className={`notebook-source-status ${status.className}`}>{status.label}</span>
            <span className="notebook-source-type truncate">{materialLabel(document.material_type)}</span>
          </div>
        </div>
        <button
          aria-label={selected ? "Quitar material del chat" : "Usar material en el chat"}
          aria-pressed={selected}
          className="notebook-source-check flex h-6 w-6 items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:shadow-[var(--mentora-focus-ring)]"
          onClick={() => onToggle(document.id)}
          type="button"
        >
          <Check size={14} strokeWidth={2.4} />
        </button>
        <button
          aria-label={`Eliminar ${document.file_name}`}
          className="notebook-source-delete flex h-6 w-6 items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:shadow-[var(--mentora-focus-ring)]"
          disabled={deleting}
          onClick={() => {
            if (window.confirm(`Eliminar "${document.file_name}"?`)) {
              void onDelete(document.id);
            }
          }}
          type="button"
        >
          {deleting ? <Loader2 className="animate-spin" size={13} /> : <Trash2 size={13} strokeWidth={2.2} />}
        </button>
      </div>
    </article>
  );
}

function materialIcon(type: MaterialType) {
  switch (type) {
    case "image":
      return <FileImage size={18} />;
    case "link":
      return <Globe2 size={18} />;
    case "text":
      return <NotebookPen size={18} />;
    case "document":
      return <Paperclip size={18} />;
    case "pdf":
    default:
      return <FileText size={18} />;
  }
}

function materialLabel(type: MaterialType) {
  switch (type) {
    case "image":
      return "Image";
    case "link":
      return "Website";
    case "text":
      return "Note";
    case "document":
      return "Document";
    case "pdf":
    default:
      return "PDF";
  }
}

function sourceStatus(document: DocumentRecord) {
  if (document.processing_status === "ready" && chunkCountForDocument(document) <= 0) {
    return { className: "is-processing", label: "No readable text" };
  }

  if (document.processing_status === "ready") {
    return { className: "is-ready", label: "Ready" };
  }

  if (document.processing_status === "failed") {
    return { className: "is-failed", label: "Failed" };
  }

  return { className: "is-processing", label: "Preparing" };
}
