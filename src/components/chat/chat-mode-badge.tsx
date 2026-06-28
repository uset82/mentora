"use client";

import { CheckCircle2, Sparkles, Zap } from "lucide-react";

interface ChatModeBadgeProps {
  hasSources: boolean;
  readyCount: number;
  locale: "es" | "en";
  mode: "fast" | "tutor" | "agent";
}

export function ChatModeBadge({ hasSources, readyCount, locale, mode }: ChatModeBadgeProps) {
  const isEs = locale === "es";

  if (mode === "fast") {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-700 select-none">
        <Zap size={13} />
        <span>
          {hasSources
            ? isEs
              ? `Chat rapido - ${readyCount} material listo`
              : `Fast chat - ${readyCount} ready material`
            : isEs
              ? "Chat rapido sin material"
              : "Fast chat without material"}
        </span>
      </div>
    );
  }

  if (hasSources) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 select-none">
        <CheckCircle2 size={13} />
        <span>
          {mode === "agent"
            ? isEs
              ? `Agente con material (${readyCount})`
              : `Agent with material (${readyCount})`
            : isEs
              ? `Tutor IA (${readyCount} material${readyCount > 1 ? "es" : ""})`
              : `AI Tutor (${readyCount} material${readyCount > 1 ? "s" : ""})`}
        </span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 select-none">
      <Sparkles size={13} />
      <span>{isEs ? "Tutor IA libre" : "General AI Tutor"}</span>
    </div>
  );
}
