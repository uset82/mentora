"use client";

import {
  ArrowRight,
  BarChart3,
  BookOpen,
  BrainCircuit,
  Clipboard,
  ClipboardList,
  FileText,
  Layers3,
  Loader2,
  MessageSquareText,
  Pencil,
  RefreshCw,
  Sparkles,
  Table2,
  Trash2,
  Video,
  Volume2,
} from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";
import type { GeneratedArtifact, StudyNote, ToolKind } from "@/lib/types";
import { MarkdownMessage } from "../chat/markdown-message";

type StudyStudioPanelProps = {
  artifacts: GeneratedArtifact[];
  busy: string | null;
  error: string | null;
  hasReadyMaterial: boolean;
  notes: StudyNote[];
  onCreateNote: (text: string) => Promise<boolean> | boolean;
  onDeleteNote: (noteId: string) => Promise<boolean> | boolean;
  onGenerate: (kind: ToolKind) => void;
  onSendToChat: (artifact: GeneratedArtifact) => void;
  onUpdateNote: (noteId: string, patch: { title?: string; content?: string }) => Promise<boolean> | boolean;
  readySourceCount: number;
  selectedCount: number;
  t: Record<string, string>;
};

const tools: Array<{ kind: ToolKind; label: string; helper: string; icon: ReactNode; tone: string }> = [
  { kind: "summary", label: "Summary", helper: "Key ideas", icon: <BookOpen size={17} />, tone: "tone-sand" },
  { kind: "quiz", label: "Quiz", helper: "Practice questions", icon: <ClipboardList size={17} />, tone: "tone-cyan" },
  { kind: "flashcards", label: "Flashcards", helper: "Fast review", icon: <Layers3 size={17} />, tone: "tone-red" },
  { kind: "mind_map", label: "Mind Map", helper: "Concept links", icon: <BrainCircuit size={17} />, tone: "tone-pink" },
  { kind: "apa_summary", label: "APA Summary", helper: "Academic format", icon: <FileText size={17} />, tone: "tone-green" },
  { kind: "data_table", label: "Data Table", helper: "Structured view", icon: <Table2 size={17} />, tone: "tone-blue" },
  { kind: "study_guide", label: "Study Guide", helper: "Review plan", icon: <BarChart3 size={17} />, tone: "tone-sand" },
  { kind: "diagram", label: "Diagram", helper: "Flow view", icon: <BrainCircuit size={17} />, tone: "tone-green" },
  { kind: "infographic", label: "Infographic", helper: "Visual brief", icon: <Sparkles size={17} />, tone: "tone-pink" },
];

const futureTools = [
  { label: "Audio Overview", helper: "Coming soon", icon: <Volume2 size={17} />, tone: "tone-blue" },
  { label: "Slide Deck", helper: "Coming soon", icon: <FileText size={17} />, tone: "tone-sand" },
  { label: "Video Overview", helper: "Coming soon", icon: <Video size={17} />, tone: "tone-green" },
  { label: "Reports", helper: "Coming soon", icon: <BarChart3 size={17} />, tone: "tone-sand" },
];

export function StudyStudioPanel({
  artifacts,
  busy,
  error,
  hasReadyMaterial,
  notes,
  onCreateNote,
  onDeleteNote,
  onGenerate,
  onSendToChat,
  onUpdateNote,
  readySourceCount,
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
    <aside className="notebook-panel notebook-studio-panel flex h-full min-h-0 flex-col">
      <header className="notebook-panel-header px-5 py-4">
        <h2 className="text-[20px] font-medium leading-none text-[var(--nb-text)]">Studio</h2>
        <p className="mt-2 text-sm leading-5 text-[var(--nb-muted)]">
          {selectedCount > 0
            ? `${selectedCount} selected sources`
            : readySourceCount > 0
              ? `${readySourceCount} ready sources available`
              : "Add a ready source to generate study outputs."}
        </p>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <div className="notebook-tool-grid grid grid-cols-2 gap-2">
          {tools.map((tool) => {
            const loading = busy === tool.kind;
            const disabled = !hasReadyMaterial || loading;
            const helper = loading
              ? "Generating..."
              : !hasReadyMaterial
                ? "Add a ready source first"
                : selectedCount > 0
                  ? tool.helper
                  : "Use all ready sources";
            return (
              <button
                key={tool.kind}
                className={`notebook-tool-tile ${tool.tone} group grid min-h-[70px] grid-cols-[22px_minmax(0,1fr)_24px] items-center gap-2 rounded-[12px] p-3 text-left transition ${disabled ? "is-disabled" : ""}`}
                disabled={disabled}
                onClick={() => runTool(tool.kind)}
                type="button"
              >
                <span className="notebook-tool-icon flex h-6 w-6 shrink-0 items-center justify-center">
                  {loading ? <Loader2 className="animate-spin" size={17} /> : tool.icon}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-semibold">{tool.label}</span>
                  <span className="block truncate text-[11px] font-medium opacity-75">
                    {helper}
                  </span>
                </span>
                <ArrowRight size={16} className="notebook-tool-arrow shrink-0 transition group-hover:translate-x-0.5" />
              </button>
            );
          })}

          {futureTools.map((tool) => (
            <div
              key={tool.label}
              aria-disabled="true"
              className={`notebook-tool-tile ${tool.tone} is-coming-soon grid min-h-[70px] grid-cols-[22px_minmax(0,1fr)_24px] items-center gap-2 rounded-[12px] p-3`}
            >
              <span className="notebook-tool-icon flex h-6 w-6 shrink-0 items-center justify-center">{tool.icon}</span>
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-semibold">{tool.label}</span>
                <span className="block truncate text-[11px] font-medium opacity-75">{tool.helper}</span>
              </span>
              <ArrowRight size={16} className="notebook-tool-arrow shrink-0" />
            </div>
          ))}
        </div>

        <section className="notebook-studio-output mt-5 border-t pt-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-[var(--nb-text)]">Studio output</h3>
            <div className="flex items-center gap-1.5">
              <button
                className="notebook-add-note-button inline-flex min-h-9 items-center gap-2 rounded-full px-4 text-xs font-semibold transition"
                onClick={addNote}
                type="button"
              >
                <Clipboard size={14} />
                Add note
              </button>
              <span className="notebook-output-count rounded-full px-2.5 py-1 text-xs font-semibold">{artifacts.length}</span>
            </div>
          </div>
          {error && lastTool && (
            <div className="notebook-error-row mb-3 rounded-[14px] p-3">
              <p className="text-sm font-semibold">Could not generate.</p>
              <p className="mt-1 text-xs leading-5">{error}</p>
              <button
                className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold transition"
                onClick={() => runTool(lastTool)}
                type="button"
              >
                <RefreshCw size={13} />
                Retry
              </button>
            </div>
          )}
          {artifacts.length === 0 ? (
            <div className="notebook-studio-empty grid min-h-[18rem] place-items-center text-center">
              <div className="grid max-w-[18rem] justify-items-center gap-3">
                <Sparkles size={30} />
                <div>
                  <p className="text-sm font-semibold text-[var(--nb-text)]">Studio output will be saved here.</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--nb-muted)]">
                    After adding sources, click to add Audio Overview, Study Guide, Mind Map, and more.
                  </p>
                </div>
                <button className="notebook-add-note-button inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold" onClick={addNote} type="button">
                  <Clipboard size={15} />
                  Add note
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {artifacts.slice(0, 4).map((artifact) => (
                <article key={artifact.id} className="notebook-output-card rounded-[14px] border p-3">
                  <p className="text-[11px] font-semibold uppercase text-[var(--nb-accent)]">{t[artifact.kind] ?? artifact.kind}</p>
                  <h4 className="mt-1 text-sm font-semibold text-[var(--nb-text)]">{artifact.title}</h4>
                  <div className="mt-2 max-h-40 overflow-hidden text-sm text-[var(--nb-text)]">
                    <MarkdownMessage content={artifact.content} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <button
                      className="notebook-message-action inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold transition"
                      onClick={() => void navigator.clipboard?.writeText(artifact.content)}
                      type="button"
                    >
                      <Clipboard size={13} />
                      Copy
                    </button>
                    <button
                      className="notebook-message-action inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold transition"
                      onClick={() => onSendToChat(artifact)}
                      type="button"
                    >
                      <MessageSquareText size={13} />
                      Use in chat
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
          {notes.length > 0 && (
            <div className="mt-3 space-y-2">
              <h3 className="text-sm font-semibold text-[var(--nb-text)]">Notes</h3>
              {notes.map((note) => (
                <article key={note.id} className="notebook-output-card rounded-[14px] border p-3">
                  <h4 className="text-sm font-semibold text-[var(--nb-text)]">{note.title}</h4>
                  <p className="mt-1 line-clamp-3 text-xs leading-5 text-[var(--nb-muted)]">{note.content}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <button
                      className="notebook-message-action inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold transition"
                      onClick={() => {
                        const nextTitle = window.prompt("Note title", note.title);
                        if (nextTitle?.trim()) {
                          void onUpdateNote(note.id, { title: nextTitle.trim() });
                        }
                      }}
                      type="button"
                    >
                      <Pencil size={13} />
                      Rename
                    </button>
                    <button
                      className="notebook-message-action is-danger inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold transition"
                      onClick={() => {
                        if (window.confirm("Delete this note?")) {
                          void onDeleteNote(note.id);
                        }
                      }}
                      type="button"
                    >
                      <Trash2 size={13} />
                      Delete
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
