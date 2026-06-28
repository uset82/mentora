"use client";

import { Check, FileImage, FileText, Globe2, NotebookPen, Paperclip } from "lucide-react";
import type { DocumentRecord, MaterialType } from "@/lib/types";

type MaterialCardProps = {
  document: DocumentRecord;
  onToggle: (documentId: string) => void;
  selected: boolean;
};

export function MaterialCard({ document, onToggle, selected }: MaterialCardProps) {
  return (
    <article
      className={`group rounded-xl border px-2.5 py-2 transition ${
        selected
          ? "border-[rgba(37,99,235,0.18)] bg-[rgba(37,99,235,0.06)]"
          : "border-transparent bg-transparent hover:border-slate-200 hover:bg-slate-50"
      }`}
    >
      <div className="grid min-h-9 grid-cols-[26px_minmax(0,1fr)_24px] items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center text-[var(--mentora-primary)]">{materialIcon(document.material_type)}</span>
        <p className="min-w-0 truncate text-[13px] font-medium leading-5 text-slate-950">{document.file_name}</p>
        <button
          aria-label={selected ? "Quitar material del chat" : "Usar material en el chat"}
          aria-pressed={selected}
          className={`flex h-5 w-5 items-center justify-center rounded border transition focus-visible:outline-none focus-visible:shadow-[var(--mentora-focus-ring)] ${
            selected ? "border-slate-300 bg-slate-200 text-slate-700" : "border-slate-200 bg-slate-100 text-transparent hover:text-slate-500"
          }`}
          onClick={() => onToggle(document.id)}
          type="button"
        >
          <Check size={14} strokeWidth={2.4} />
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
