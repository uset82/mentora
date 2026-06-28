"use client";

import { Search, X } from "lucide-react";

type MaterialSearchProps = {
  onChange: (value: string) => void;
  value: string;
};

export function MaterialSearch({ onChange, value }: MaterialSearchProps) {
  return (
    <label className="materials-glass-control group flex min-h-12 items-center gap-2 rounded-[18px] border border-[rgba(37,99,235,0.12)] bg-white/[0.82] px-3 text-sm text-[var(--mentora-muted)] shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_12px_28px_rgba(42,64,128,0.06)] backdrop-blur-xl transition focus-within:border-[rgba(37,99,235,0.34)] focus-within:bg-white focus-within:shadow-[var(--mentora-focus-ring),0_12px_28px_rgba(42,64,128,0.06)]">
      <Search className="shrink-0 text-slate-500 transition group-focus-within:text-[var(--mentora-primary)]" size={17} />
      <input
        aria-label="Buscar material"
        className="min-w-0 flex-1 bg-transparent font-semibold text-[var(--mentora-text)] outline-none placeholder:text-slate-400"
        onChange={(event) => onChange(event.target.value)}
        placeholder="Buscar materiales..."
        value={value}
      />
      {value && (
        <button
          aria-label="Limpiar busqueda"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-[rgba(37,99,235,0.08)] hover:text-[var(--mentora-primary)] focus-visible:outline-none focus-visible:shadow-[var(--mentora-focus-ring)]"
          onClick={() => onChange("")}
          type="button"
        >
          <X size={15} />
        </button>
      )}
    </label>
  );
}
