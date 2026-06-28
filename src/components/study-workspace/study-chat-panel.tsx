"use client";

import { ArrowRight, BrainCircuit, Clipboard, Maximize2, MessageSquareText, NotebookPen, RotateCcw, ThumbsDown, ThumbsUp } from "lucide-react";
import type { ReactNode } from "react";
import type { DocumentRecord, MaterialType } from "@/lib/types";
import { ChatInput } from "../chat/chat-input";
import { ChatMessage, type ChatMessageData } from "../chat/chat-message";

type StudyChatPanelProps = {
  busy: string | null;
  documents: DocumentRecord[];
  messages: ChatMessageData[];
  onAddLink: (url: string) => Promise<boolean> | boolean;
  onCreateNote: (text: string) => Promise<boolean> | boolean;
  onFocusChat: () => void;
  onSend: (message: string) => void;
  onUpload: (file: File, materialType: MaterialType) => Promise<boolean> | boolean;
  selectedMaterials: DocumentRecord[];
  t: Record<string, string>;
};

export function StudyChatPanel({
  busy,
  documents,
  messages,
  onAddLink,
  onCreateNote,
  onFocusChat,
  onSend,
  onUpload,
  selectedMaterials,
  t,
}: StudyChatPanelProps) {
  const readySelectedCount = selectedMaterials.filter((document) => document.processing_status === "ready").length;
  const hasPreparingSelection = selectedMaterials.some((document) => document.processing_status !== "ready" && document.processing_status !== "failed");
  const preparingCount = documents.filter((document) => document.processing_status !== "ready" && document.processing_status !== "failed").length;
  const prompts =
    selectedMaterials.length > 0
      ? ["Resume los materiales seleccionados.", "Hazme 10 preguntas tipo examen.", "Crea un mapa mental.", "Explicame los puntos mas importantes con citas."]
      : ["Que tema quieres estudiar hoy?", "Crea un plan de estudio de 25 minutos.", "Explicame un concepto paso a paso.", "Sube un PDF y hazme un resumen."];

  function focusComposer() {
    document.querySelector<HTMLTextAreaElement>(".mentora-chat-textarea")?.focus();
  }

  return (
    <section className="flex h-full min-h-0 flex-col bg-white">
      <header className="border-b border-slate-200 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-blue-700">
              <BrainCircuit size={14} />
              Tutor IA
            </p>
            <h2 className="truncate text-lg font-bold leading-tight text-slate-950">Chat de estudio</h2>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700">
              {sourceLabel(selectedMaterials.length, preparingCount)}
            </span>
            <button
              className="hidden h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 sm:inline-flex"
              onClick={onFocusChat}
              type="button"
            >
              <Maximize2 size={13} />
              Enfocar
            </button>
            {readySelectedCount > 0 && (
              <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700">
                {readySelectedCount} listos
              </span>
            )}
          </div>
        </div>

        {selectedMaterials.length > 0 && (
          <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
            {selectedMaterials.slice(0, 5).map((document) => (
              <span key={document.id} className="max-w-44 shrink-0 truncate rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800">
                {document.file_name}
              </span>
            ))}
          </div>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/80 p-3">
        {messages.length === 0 ? (
          <div className="mx-auto flex h-full max-w-xl flex-col justify-center py-10">
            <div className="rounded-lg border border-slate-200 bg-white p-4 text-center shadow-sm">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                <MessageSquareText size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-950">Pregunta algo o sube material para estudiar.</h3>
              <p className="mt-1 text-sm leading-5 text-slate-600">Mentora puede ayudarte con o sin materiales.</p>
              <button
                className="mt-3 inline-flex h-9 items-center justify-center rounded-lg bg-blue-600 px-3 text-sm font-bold text-white transition hover:bg-blue-700"
                onClick={focusComposer}
                type="button"
              >
                Escribir pregunta
              </button>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {prompts.map((prompt) => (
                <button
                  key={prompt}
                  className="rounded-lg border border-slate-200 bg-white p-3 text-left text-sm font-semibold leading-5 text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800"
                  onClick={() => onSend(prompt)}
                  type="button"
                >
                  {prompt}
                </button>
              ))}
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

      <div className="border-t border-slate-200 bg-white p-3">
        {selectedMaterials.length > 0 && (
          <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
            {selectedMaterials.map((document) => (
              <span key={document.id} className="max-w-52 shrink-0 truncate rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                {document.file_name}
              </span>
            ))}
          </div>
        )}
        {hasPreparingSelection && (
          <p className="mb-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
            Estoy preparando este material.
          </p>
        )}
        <div className="mb-2 flex items-center justify-between gap-2 text-xs font-semibold text-slate-500">
          <span>{selectedMaterials.length} materiales seleccionados</span>
          <span>Chat libre disponible</span>
        </div>
        <ChatInput
          attachmentLabel={sourceLabel(selectedMaterials.length, preparingCount)}
          buttonLabel={t.send ?? "Enviar"}
          disabled={busy === "chat"}
          loading={busy === "chat"}
          onAddLink={onAddLink}
          onCreateNote={onCreateNote}
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
      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
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
    return "Preparando material";
  }
  if (selectedCount === 0) {
    return "Sin material";
  }
  if (selectedCount === 1) {
    return "1 material";
  }
  return `${selectedCount} materiales`;
}
