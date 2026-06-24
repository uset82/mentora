"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";

interface ChatInputProps {
  disabled: boolean;
  loading: boolean;
  placeholder: string;
  buttonLabel: string;
  onSend: (message: string) => void;
}

export function ChatInput({
  disabled,
  loading,
  placeholder,
  buttonLabel,
  onSend,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow textarea height
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(200, textarea.scrollHeight)}px`;
  }, [value]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!value.trim() || disabled || loading) return;

    onSend(value.trim());
    setValue("");

    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-white/10 bg-slate-950/20 p-3 sm:p-4"
    >
      <div className="relative flex items-end gap-2 rounded-2xl border border-white/10 bg-slate-900/60 p-1.5 focus-within:border-cyan-500/50 focus-within:ring-2 focus-within:ring-cyan-500/10 transition-all duration-200">
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="min-h-[40px] max-h-[200px] w-full resize-none bg-transparent py-2.5 pl-3.5 pr-12 text-sm leading-relaxed text-slate-100 placeholder-slate-500 outline-none focus:ring-0 focus:outline-none disabled:opacity-55 font-sans"
          style={{ height: "auto" }}
        />
        <button
          type="submit"
          disabled={disabled || loading || !value.trim()}
          className="absolute right-2.5 bottom-2.5 flex h-9 items-center justify-center rounded-xl bg-cyan-500 px-3.5 text-xs font-bold text-slate-950 transition-all hover:bg-cyan-400 active:scale-95 disabled:pointer-events-none disabled:bg-slate-800 disabled:text-slate-500 disabled:opacity-50"
          aria-label={buttonLabel}
        >
          {loading ? (
            <Loader2 className="animate-spin" size={15} />
          ) : (
            <>
              <Send size={15} className="mr-1.5" />
              <span className="hidden sm:inline">{buttonLabel}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
