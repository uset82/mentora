"use client";

import { ArrowRight, BookOpen, BrainCircuit, Clipboard, ClipboardList, FileText, Layers3, Loader2, MessageSquareText, Pencil, RefreshCw, Sparkles, Table2, Trash2 } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";
import type { GeneratedArtifact, StudyNote, ToolKind } from "@/lib/types";
import { MarkdownMessage } from "../chat/markdown-message";

type StudyStudioPanelProps = {
  artifacts: GeneratedArtifact[];
  busy: string | null;
  error: string | null;
  hasSelectedReadyMaterial: boolean;
  notes: StudyNote[];
  onCreateNote: (text: string) => Promise<boolean> | boolean;
  onDeleteNote: (noteId: string) => Promise<boolean> | boolean;
  onGenerate: (kind: ToolKind) => void;
  onSendToChat: (artifact: GeneratedArtifact) => void;
  onUpdateNote: (noteId: string, patch: { title?: string; content?: string }) => Promise<boolean> | boolean;
  selectedCount: number;
  t: Record<string, string>;
};

const tools: Array<{ kind: ToolKind; label: string; helper: string; icon: ReactNode }> = [
  { kind: "summary", label: "Resumen", helper: "Ideas principales", icon: <BookOpen size={17} /> },
  { kind: "quiz", label: "Quiz", helper: "Preguntas de practica", icon: <ClipboardList size={17} /> },
  { kind: "flashcards", label: "Flashcards", helper: "Repaso rapido", icon: <Layers3 size={17} /> },
  { kind: "mind_map", label: "Mapa mental", helper: "Conexiones clave", icon: <BrainCircuit size={17} /> },
  { kind: "apa_summary", label: "Cita APA", helper: "Formato academico", icon: <FileText size={17} /> },
  { kind: "data_table", label: "Tabla", helper: "Conceptos ordenados", icon: <Table2 size={17} /> },
  { kind: "study_guide", label: "Guia de estudio", helper: "Plan de repaso", icon: <BookOpen size={17} /> },
  { kind: "diagram", label: "Diagrama", helper: "Flujo visual", icon: <BrainCircuit size={17} /> },
  { kind: "infographic", label: "Infografia", helper: "Version visual", icon: <Sparkles size={17} /> },
];

const futureTools = [
  { label: "Audio resumen", helper: "Proximamente", icon: <Sparkles size={17} /> },
  { label: "Presentacion", helper: "Proximamente", icon: <FileText size={17} /> },
  { label: "Video resumen", helper: "Proximamente", icon: <Sparkles size={17} /> },
];

export function StudyStudioPanel({
  artifacts,
  busy,
  error,
  hasSelectedReadyMaterial,
  notes,
  onCreateNote,
  onDeleteNote,
  onGenerate,
  onSendToChat,
  onUpdateNote,
  selectedCount,
  t,
}: StudyStudioPanelProps) {
  const [lastTool, setLastTool] = useState<ToolKind | null>(null);

  function addNote() {
    const text = window.prompt("Escribe o pega tu nota");
    if (text?.trim()) {
      void onCreateNote(text.trim());
    }
  }

  function runTool(kind: ToolKind) {
    setLastTool(kind);
    onGenerate(kind);
  }

  return (
    <aside className="flex h-full min-h-0 flex-col border-l border-slate-200 bg-white">
      <header className="border-b border-slate-200 p-3">
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-blue-700">
          <Sparkles size={14} />
          Studio
        </p>
        <h2 className="text-lg font-bold leading-tight text-slate-950">Recursos de estudio</h2>
        <p className="mt-1 text-sm leading-5 text-slate-600">
          {selectedCount > 0 ? `${selectedCount} materiales seleccionados.` : "Selecciona o sube un material primero."}
        </p>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-1 gap-2">
          {tools.map((tool) => {
            const loading = busy === tool.kind;
            const disabled = !hasSelectedReadyMaterial || loading;
            return (
              <button
                key={tool.kind}
                className={`group flex min-h-16 items-center gap-2 rounded-lg border p-2.5 text-left transition ${
                  disabled
                    ? "border-slate-200 bg-slate-50 text-slate-400"
                    : "border-slate-200 bg-white text-slate-800 hover:border-blue-200 hover:bg-blue-50"
                }`}
                disabled={disabled}
                onClick={() => runTool(tool.kind)}
                type="button"
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${disabled ? "bg-white" : "bg-blue-50 text-blue-700"}`}>
                  {loading ? <Loader2 className="animate-spin" size={17} /> : tool.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold">{tool.label}</span>
                  <span className="block truncate text-xs font-medium opacity-75">
                    {loading ? "Generando..." : disabled ? "Selecciona o sube un material primero." : tool.helper}
                  </span>
                </span>
                <ArrowRight size={15} className="shrink-0 opacity-50 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
              </button>
            );
          })}

          {futureTools.map((tool) => (
            <div key={tool.label} className="flex min-h-16 items-center gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-2.5 text-slate-400">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white">{tool.icon}</span>
              <span className="min-w-0">
                <span className="block text-sm font-bold">{tool.label}</span>
                <span className="block text-xs font-medium">{tool.helper}</span>
              </span>
            </div>
          ))}
        </div>

        <section className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-950">Resultados</h3>
            <div className="flex items-center gap-1.5">
              <button
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                onClick={addNote}
                type="button"
              >
                Agregar nota
              </button>
              <span className="rounded-md bg-white px-2 py-1 text-xs font-bold text-slate-600">{artifacts.length}</span>
            </div>
          </div>
          {error && lastTool && (
            <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm font-bold text-red-800">No se pudo generar.</p>
              <p className="mt-1 text-xs leading-5 text-red-700">{error}</p>
              <button
                className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-200 bg-white px-2.5 text-xs font-bold text-red-700 transition hover:bg-red-100"
                onClick={() => runTool(lastTool)}
                type="button"
              >
                <RefreshCw size={13} />
                Reintentar
              </button>
            </div>
          )}
          {artifacts.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-200 bg-white p-3 text-sm font-medium text-slate-600">
              Los resultados apareceran aqui.
            </p>
          ) : (
            <div className="space-y-2">
              {artifacts.slice(0, 4).map((artifact) => (
                <article key={artifact.id} className="rounded-lg border border-slate-200 bg-white p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-blue-700">{t[artifact.kind] ?? artifact.kind}</p>
                  <h4 className="mt-1 text-sm font-bold text-slate-950">{artifact.title}</h4>
                  <div className="mt-2 max-h-40 overflow-hidden text-sm">
                    <MarkdownMessage content={artifact.content} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <button
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                      onClick={() => void navigator.clipboard?.writeText(artifact.content)}
                      type="button"
                    >
                      <Clipboard size={13} />
                      Copiar
                    </button>
                    <button
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                      onClick={() => onSendToChat(artifact)}
                      type="button"
                    >
                      <MessageSquareText size={13} />
                      Usar en chat
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
          {notes.length > 0 && (
            <div className="mt-3 space-y-2">
              <h3 className="text-sm font-bold text-slate-950">Notas</h3>
              {notes.map((note) => (
                <article key={note.id} className="rounded-lg border border-slate-200 bg-white p-3">
                  <h4 className="text-sm font-bold text-slate-950">{note.title}</h4>
                  <p className="mt-1 line-clamp-3 text-xs leading-5 text-slate-600">{note.content}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <button
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                      onClick={() => {
                        const nextTitle = window.prompt("Titulo de la nota", note.title);
                        if (nextTitle?.trim()) {
                          void onUpdateNote(note.id, { title: nextTitle.trim() });
                        }
                      }}
                      type="button"
                    >
                      <Pencil size={13} />
                      Editar titulo
                    </button>
                    <button
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                      onClick={() => {
                        if (window.confirm("Eliminar esta nota?")) {
                          void onDeleteNote(note.id);
                        }
                      }}
                      type="button"
                    >
                      <Trash2 size={13} />
                      Eliminar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </aside>
  );
}
