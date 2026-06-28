"use client";

import React from "react";
import { BrainCircuit, UserRound, Loader2, FileText } from "lucide-react";
import { MarkdownMessage } from "./markdown-message";

export type Citation = {
  fileName: string;
  pageNumber: number | null;
  content: string;
};

export type ChatMessageData = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
};

interface ChatMessageProps {
  message: ChatMessageData;
  t: Record<string, string>;
}

export function ChatMessage({ message, t }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <article 
      className={`chat-bubble ${isUser ? "is-user" : "is-assistant"} p-4 rounded-2xl border transition-all duration-200 ${
        isUser 
          ? "bg-slate-800/40 border-white/5 ml-auto max-w-[85%]" 
          : "bg-slate-900/30 border-white/10 mr-auto max-w-[90%]"
      }`}
    >
      <div className="mb-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
        {isUser ? (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400">
            <UserRound size={12} />
          </span>
        ) : (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400">
            <BrainCircuit size={12} />
          </span>
        )}
        <span>{isUser ? t.you : t.mentor}</span>
      </div>

      <div className="chat-message-content">
        {message.content ? (
          <MarkdownMessage content={message.content} />
        ) : (
          <div className="flex items-center gap-2 py-1 text-sm text-cyan-200">
            <Loader2 className="animate-spin" size={14} />
            <span>{t.thinking || "Pensando..."}</span>
          </div>
        )}
      </div>

      {message.citations && message.citations.length > 0 && (
        <div className="mt-4 border-t border-white/5 pt-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Citas y materiales:</p>
          <div className="flex flex-wrap gap-2">
            {message.citations.slice(0, 5).map((citation, index) => (
              <div 
                key={`${citation.fileName}-${index}`} 
                className="citation-chip flex items-center gap-1.5 rounded-lg border border-white/5 bg-slate-950/40 px-2.5 py-1 text-xs text-slate-300 transition-all hover:bg-slate-950/80 hover:text-white"
                title={citation.content}
              >
                <FileText size={12} className="text-cyan-400/80" />
                <span className="max-w-[120px] truncate font-medium">{citation.fileName}</span>
                {citation.pageNumber !== null && (
                  <span className="rounded bg-white/5 px-1 py-0.2 font-mono text-[10px] text-slate-400">
                    p. {citation.pageNumber}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
