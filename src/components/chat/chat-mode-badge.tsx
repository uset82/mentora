"use client";

import React from "react";
import { Sparkles, CheckCircle2, Zap } from "lucide-react";

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
      <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-400 select-none animate-in fade-in duration-300">
        <Zap size={13} className="text-cyan-400" />
        <span>
          {hasSources
            ? isEs
              ? `Chat rapido · ${readyCount} PDF listo`
              : `Fast Chat · ${readyCount} ready PDF`
            : isEs
              ? "Chat rapido sin PDF"
              : "Fast Chat without PDF"}
        </span>
      </div>
    );
  }

  if (hasSources) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 select-none animate-in fade-in duration-300">
        <CheckCircle2 size={13} className="text-emerald-400" />
        <span>
          {mode === "agent"
            ? isEs
              ? `Agente con PDF (${readyCount} fuente${readyCount > 1 ? "s" : ""})`
              : `Agent with PDF (${readyCount} source${readyCount > 1 ? "s" : ""})`
            : isEs
              ? `Tutor en PDF (${readyCount} fuente${readyCount > 1 ? "s" : ""} lista${readyCount > 1 ? "s" : ""})`
              : `PDF Grounded Tutor (${readyCount} ready source${readyCount > 1 ? "s" : ""})`}
        </span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400 select-none animate-in fade-in duration-300">
      <Sparkles size={13} className="text-amber-400" />
      <span>
        {isEs ? "Tutor General de IA (Modo libre)" : "General AI Tutor (Unrestricted)"}
      </span>
    </div>
  );
}
