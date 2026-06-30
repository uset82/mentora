"use client";

import {
  ArrowRight,
  Clipboard,
  Maximize2,
  MessageSquareText,
  MoreVertical,
  NotebookPen,
  RotateCcw,
  SlidersHorizontal,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import type { ReactNode } from "react";
import type { DocumentRecord, MaterialType } from "@/lib/types";
import { ChatInput } from "../chat/chat-input";
import { ChatMessage, type ChatMessageData } from "../chat/chat-message";

type StudyChatPanelProps = {
  activeSpaceTitle: string;
  busy: string | null;
  documents: DocumentRecord[];
  messages: ChatMessageData[];
  onAddLink: (url: string) => Promise<boolean> | boolean;
  onCreateNote: (text: string) => Promise<boolean> | boolean;
  onCreateSourceNote: (text: string) => Promise<boolean> | boolean;
  onFocusChat: () => void;
  onSend: (message: string) => void;
  onUpload: (file: File, materialType: MaterialType) => Promise<boolean> | boolean;
  selectedMaterials: DocumentRecord[];
  t: Record<string, string>;
};

export function StudyChatPanel({
  activeSpaceTitle,
  busy,
  documents,
  messages,
  onAddLink,
  onCreateNote,
  onCreateSourceNote,
  onFocusChat,
  onSend,
  onUpload,
  selectedMaterials,
  t,
}: StudyChatPanelProps) {
  const readySelectedCount = selectedMaterials.filter((document) => document.processing_status === "ready").length;
  const hasPreparingSelection = selectedMaterials.some((document) => document.processing_status !== "ready" && document.processing_status !== "failed");
  const preparingCount = documents.filter((document) => document.processing_status !== "ready" && document.processing_status !== "failed").length;
  const notebookDate = new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(new Date());

  function focusComposer() {
    document.querySelector<HTMLTextAreaElement>(".mentora-chat-textarea")?.focus();
  }

  return (
    <section className="notebook-panel notebook-chat-panel flex h-full min-h-0 flex-col">
      <header className="notebook-panel-header px-5 py-4">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <h2 className="truncate text-[20px] font-medium leading-none text-[var(--nb-text)]">Chat</h2>
          <div className="flex shrink-0 items-center gap-2">
            <button className="notebook-light-button hidden h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold sm:inline-flex" onClick={onFocusChat} type="button">
              <SlidersHorizontal size={15} />
              Customize
            </button>
            <button aria-label="Focus chat" className="notebook-icon-button hidden h-10 w-10 items-center justify-center rounded-full sm:inline-flex" onClick={onFocusChat} type="button">
              <Maximize2 size={15} />
            </button>
            <button aria-label="Chat options" className="notebook-icon-button h-10 w-10 rounded-full" type="button">
              <MoreVertical size={18} />
            </button>
          </div>
        </div>

        {selectedMaterials.length > 0 && (
          <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
            {selectedMaterials.slice(0, 5).map((document) => (
              <span key={document.id} className="notebook-selected-chip max-w-44 shrink-0 truncate rounded-full px-2.5 py-1 text-xs font-semibold">
                {document.file_name}
              </span>
            ))}
            {readySelectedCount > 0 && (
              <span className="notebook-ready-chip shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold">
                {readySelectedCount} ready
              </span>
            )}
          </div>
        )}
      </header>

      <div className="notebook-chat-scroll min-h-0 flex-1 overflow-y-auto p-5">
        {messages.length === 0 ? (
          <div className="notebook-chat-empty mx-auto flex h-full max-w-2xl flex-col justify-center py-12">
            <div className="grid justify-items-start gap-6">
              <button className="notebook-empty-notebook" onClick={focusComposer} type="button" aria-label="Start typing">
                <MessageSquareText size={25} />
              </button>
              <div>
                <h3 className="text-3xl font-medium leading-[1.1] text-[var(--nb-text)] sm:text-4xl">{activeSpaceTitle}</h3>
                <p className="mt-2 text-base font-medium text-[var(--nb-muted)]">
                  {documents.length} sources - {notebookDate}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-3">
            {messages.map((message, index) => (
              <div key={message.id ?? `${message.role}-${index}`}>
                <ChatMessage message={message} t={t} />
                {message.role === "assistant" && message.content && (
                  <div className="mt-2 flex flex-wrap gap-1.5 pl-2">
                    <MessageAction icon={<Clipboard size={13} />} label="Copiar" onClick={() => void navigator.clipboard?.writeText(message.content)} />
                    <MessageAction icon={<NotebookPen size={13} />} label="Guardar como nota" onClick={() => void onCreateNote(message.content)} />
                    <MessageAction icon={<ThumbsUp size={13} />} label="Util" />
                    <MessageAction icon={<ThumbsDown size={13} />} label="No util" />
                    <MessageAction icon={<ArrowRight size={13} />} label="Continuar" onClick={() => onSend("Continua con el siguiente punto.")} />
                    <MessageAction icon={<RotateCcw size={13} />} label="Reintentar" onClick={() => onSend("Intenta responder otra vez con mas claridad.")} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="notebook-chat-footer p-5 pt-3">
        {selectedMaterials.length > 0 && (
          <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
            {selectedMaterials.map((document) => (
              <span key={document.id} className="notebook-selected-chip max-w-52 shrink-0 truncate rounded-full px-2.5 py-1 text-xs font-semibold">
                {document.file_name}
              </span>
            ))}
          </div>
        )}
        {hasPreparingSelection && (
          <p className="notebook-warning-row mb-2 rounded-[14px] px-3 py-2 text-xs font-semibold">
            Estoy preparando este material.
          </p>
        )}
        <div className="mb-2 flex items-center justify-between gap-2 text-xs font-semibold text-[var(--nb-muted)]">
          <span>{sourceLabel(selectedMaterials.length, preparingCount)}</span>
          <span>Free chat available</span>
        </div>
        <ChatInput
          attachmentLabel={sourceLabel(selectedMaterials.length, preparingCount)}
          buttonLabel={t.send ?? "Enviar"}
          disabled={busy === "chat"}
          loading={busy === "chat"}
          onAddLink={onAddLink}
          onCreateNote={onCreateSourceNote}
          onSend={onSend}
          onUpload={onUpload}
          placeholder="Pregunta lo que quieras o sube material..."
          uploadDisabled={busy === "upload"}
          uploadLoading={busy === "upload"}
        />
      </div>
    </section>
  );
}

function MessageAction({ icon, label, onClick }: { icon: ReactNode; label: string; onClick?: () => void }) {
  return (
    <button
      className="notebook-message-action inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold transition"
      onClick={onClick}
      type="button"
    >
      {icon}
      {label}
    </button>
  );
}

function sourceLabel(selectedCount: number, preparingCount: number) {
  if (selectedCount === 0 && preparingCount > 0) {
    return "Preparing sources";
  }
  if (selectedCount === 0) {
    return "0 sources";
  }
  if (selectedCount === 1) {
    return "1 source";
  }
  return `${selectedCount} sources`;
}
