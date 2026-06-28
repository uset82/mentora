"use client";

import { Loader2, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import type { MaterialType } from "@/lib/types";

import { AttachmentChip, type AttachmentChipStatus } from "./attachment-chip";
import { AttachmentMenu } from "./attachment-menu";

type PendingAttachment = {
  id: string;
  label: string;
  status: AttachmentChipStatus;
};

export interface ChatComposerProps {
  attachmentLabel?: string;
  buttonLabel: string;
  disabled: boolean;
  loading: boolean;
  onAddLink?: (url: string) => Promise<boolean> | boolean;
  onCreateNote?: (text: string) => Promise<boolean> | boolean;
  onSend: (message: string) => void;
  onUpload?: (file: File, materialType: MaterialType) => Promise<boolean> | boolean;
  placeholder: string;
  uploadDisabled?: boolean;
  uploadLoading?: boolean;
}

export function ChatComposer({
  attachmentLabel,
  buttonLabel,
  disabled,
  loading,
  onAddLink,
  onCreateNote,
  onSend,
  onUpload,
  placeholder,
  uploadDisabled = false,
  uploadLoading = false,
}: ChatComposerProps) {
  const [value, setValue] = useState("");
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(200, textarea.scrollHeight)}px`;
  }, [value]);

  function submit(event?: FormEvent) {
    event?.preventDefault();
    if (!value.trim() || disabled || loading) {
      return;
    }

    onSend(value.trim());
    setValue("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  async function trackAttachment(label: string, action: () => Promise<boolean> | boolean) {
    const id = crypto.randomUUID();
    setAttachments((current) => [...current, { id, label, status: "preparing" }]);

    try {
      const ok = await action();
      setAttachments((current) =>
        current.map((item) => (item.id === id ? { ...item, status: ok ? "ready" : "error" } : item)),
      );
    } catch {
      setAttachments((current) =>
        current.map((item) => (item.id === id ? { ...item, status: "error" } : item)),
      );
    }
  }

  const attachmentDisabled = disabled || uploadDisabled || uploadLoading;

  return (
    <form className="mentora-chat-composer" onSubmit={submit}>
      {attachments.length > 0 && (
        <div className="attachment-chip-row">
          {attachments.map((attachment) => (
            <AttachmentChip
              key={attachment.id}
              label={attachment.label}
              onRemove={() => setAttachments((current) => current.filter((item) => item.id !== attachment.id))}
              status={attachment.status}
            />
          ))}
        </div>
      )}

      <div className="mentora-chat-composer-shell">
        <AttachmentMenu
          disabled={attachmentDisabled || !onUpload}
          onAddLink={
            onAddLink
              ? (url) => void trackAttachment(url, () => onAddLink(url))
              : undefined
          }
          onCreateNote={
            onCreateNote
              ? (text) => void trackAttachment("Nota", () => onCreateNote(text))
              : undefined
          }
          onUpload={
            onUpload
              ? (file, materialType) => void trackAttachment(file.name, () => onUpload(file, materialType))
              : undefined
          }
        />

        {attachmentLabel && (
          <span className="mentora-composer-source-count">
            {attachmentLabel}
          </span>
        )}

        <textarea
          ref={textareaRef}
          className="mentora-chat-textarea"
          disabled={disabled}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          style={{ height: "auto" }}
          value={value}
        />

        <button
          aria-label={buttonLabel}
          className="mentora-chat-send"
          disabled={disabled || loading || !value.trim()}
          type="submit"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={15} />
          ) : (
            <>
              <Send className="mr-1.5" size={15} />
              <span className="hidden sm:inline">{buttonLabel}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
