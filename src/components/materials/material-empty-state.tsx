"use client";

import { FileText } from "lucide-react";

export function MaterialEmptyState() {
  return (
    <section className="grid min-h-[22rem] place-items-center px-6 text-center">
      <div className="grid max-w-[15rem] justify-items-center gap-2 text-slate-500">
        <FileText size={22} strokeWidth={1.8} aria-hidden="true" />
        <p className="text-[13px] font-semibold text-slate-600">Tus materiales aparecerán aquí</p>
        <p className="text-xs font-medium leading-5 text-slate-400">Agrega fuentes para empezar a estudiar.</p>
      </div>
    </section>
  );
}
