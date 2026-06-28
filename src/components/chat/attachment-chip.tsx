"use client";

import { CheckCircle2, Loader2, XCircle } from "lucide-react";

export type AttachmentChipStatus = "preparing" | "ready" | "error";

export function AttachmentChip({
  label,
  onRemove,
  status,
}: {
  label: string;
  onRemove?: () => void;
  status: AttachmentChipStatus;
}) {
  const icon =
    status === "preparing" ? (
      <Loader2 className="animate-spin" size={14} />
    ) : status === "ready" ? (
      <CheckCircle2 size={14} />
    ) : (
      <XCircle size={14} />
    );

  const statusLabel =
    status === "preparing" ? "Preparando..." : status === "ready" ? "Listo" : "Error";

  return (
    <span className={`attachment-chip is-${status}`}>
      {icon}
      <span className="attachment-chip-name">{label}</span>
      <span className="attachment-chip-status">{statusLabel}</span>
      {onRemove && (
        <button aria-label={`Quitar ${label}`} onClick={onRemove} type="button">
          <XCircle size={14} />
        </button>
      )}
    </span>
  );
}
