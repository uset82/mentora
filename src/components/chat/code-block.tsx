"use client";

import React, { useState } from "react";
import { Check, Copy } from "lucide-react";

interface CodeBlockProps {
  language: string;
  value: string;
}

export function CodeBlock({ language, value }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn("Failed to copy text: ", err);
    }
  };

  return (
    <div className="my-4 overflow-hidden rounded-xl border border-white/10 bg-slate-900 shadow-lg">
      <div className="flex items-center justify-between border-b border-white/10 bg-slate-950/80 px-4 py-2 text-xs text-slate-400">
        <span className="font-mono font-medium lowercase tracking-wider">{language || "text"}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded bg-white/5 px-2.5 py-1 text-slate-300 transition hover:bg-white/10 hover:text-white active:scale-95"
          type="button"
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <Check size={13} className="text-emerald-400" />
              <span className="text-emerald-400">Copiado</span>
            </>
          ) : (
            <>
              <Copy size={13} />
              <span>Copiar</span>
            </>
          )}
        </button>
      </div>
      <div className="overflow-x-auto p-4">
        <pre className="font-mono text-sm leading-relaxed text-slate-100 selection:bg-cyan-500/30">
          <code className={`language-${language}`}>{value}</code>
        </pre>
      </div>
    </div>
  );
}
