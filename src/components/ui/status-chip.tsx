"use client";

import type { DocumentRecord } from "@/lib/types";

type StatusChipProps = {
  status: DocumentRecord["processing_status"];
};

export function StatusChip({ status }: StatusChipProps) {
  const ready = status === "ready";
  const failed = status === "failed";
  const label = ready ? "Listo" : failed ? "Error" : "Preparando";
  const tone = ready
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : failed
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-amber-200 bg-amber-50 text-amber-700";

  return <span className={`rounded-md border px-1.5 py-0.5 text-[11px] font-bold ${tone}`}>{label}</span>;
}
