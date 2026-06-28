"use client";

import type { DocumentRecord } from "@/lib/types";

type MaterialStatusChipProps = {
  status: DocumentRecord["processing_status"];
};

export function MaterialStatusChip({ status }: MaterialStatusChipProps) {
  const failed = status === "failed";
  const ready = status === "ready";
  const label = ready ? "Listo" : failed ? "Error" : "Preparando";
  const tone = ready
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : failed
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-blue-200 bg-blue-50 text-blue-700";

  return (
    <span className={`inline-flex min-h-6 items-center rounded-full border px-2 text-[11px] font-black ${tone}`}>
      {label}
    </span>
  );
}
