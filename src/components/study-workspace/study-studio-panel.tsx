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
  PanelRightClose,
  Pencil,
  RefreshCw,
  Sparkles,
  Table2,
  Trash2,
  Video,
  Volume2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { KeyboardEvent, MouseEvent, ReactNode } from "react";
import type { GeneratedArtifact, StudyNote, ToolKind } from "@/lib/types";
import { parseFlashcards } from "@/lib/study-content";
import { MarkdownMessage } from "../chat/markdown-message";

type StudyStudioPanelProps = {
  artifacts: GeneratedArtifact[];
  busy: string | null;
  error: string | null;
  hasReadyMaterial: boolean;
  notes: StudyNote[];
  onCreateNote: (text: string) => Promise<boolean> | boolean;
  onCollapse?: () => void;
  onDeleteNote: (noteId: string) => Promise<boolean> | boolean;
  onGenerate: (kind: ToolKind) => Promise<GeneratedArtifact | null>;
  onSendToChat: (artifact: GeneratedArtifact) => void;
  onUpdateNote: (noteId: string, patch: { title?: string; content?: string }) => Promise<boolean> | boolean;
  readySourceCount: number;
  blockedReadySourceCount: number;
  selectedCount: number;
  t: Record<string, string>;
};

const tools: Array<{ kind: ToolKind; label: string; helper: string; icon: ReactNode; tone: string }> = [
  { kind: "summary", label: "Summary", helper: "Key ideas", icon: <BookOpen size={17} />, tone: "notebook-tone-sand" },
  { kind: "quiz", label: "Quiz", helper: "Practice questions", icon: <ClipboardList size={17} />, tone: "notebook-tone-cyan" },
  { kind: "flashcards", label: "Flashcards", helper: "Fast review", icon: <Layers3 size={17} />, tone: "notebook-tone-red" },
  { kind: "mind_map", label: "Mind Map", helper: "Concept links", icon: <BrainCircuit size={17} />, tone: "notebook-tone-pink" },
  { kind: "apa_summary", label: "APA Summary", helper: "Academic format", icon: <FileText size={17} />, tone: "notebook-tone-green" },
  { kind: "data_table", label: "Data Table", helper: "Structured view", icon: <Table2 size={17} />, tone: "notebook-tone-blue" },
  { kind: "study_guide", label: "Study Guide", helper: "Review plan", icon: <BarChart3 size={17} />, tone: "notebook-tone-sand" },
  { kind: "diagram", label: "Diagram", helper: "Flow view", icon: <BrainCircuit size={17} />, tone: "notebook-tone-green" },
  { kind: "infographic", label: "Infographic", helper: "Visual brief", icon: <Sparkles size={17} />, tone: "notebook-tone-pink" },
];

const futureTools = [
  { label: "Audio Overview", helper: "Coming soon", icon: <Volume2 size={17} />, tone: "notebook-tone-blue" },
  { label: "Slide Deck", helper: "Coming soon", icon: <FileText size={17} />, tone: "notebook-tone-sand" },
  { label: "Video Overview", helper: "Coming soon", icon: <Video size={17} />, tone: "notebook-tone-green" },
  { label: "Reports", helper: "Coming soon", icon: <BarChart3 size={17} />, tone: "notebook-tone-sand" },
];

export function StudyStudioPanel({
  artifacts,
  busy,
  error,
  hasReadyMaterial,
  notes,
  onCreateNote,
  onCollapse,
  onDeleteNote,
  onGenerate,
  onSendToChat,
  onUpdateNote,
  readySourceCount,
  blockedReadySourceCount,
  selectedCount,
  t,
}: StudyStudioPanelProps) {
  const [lastTool, setLastTool] = useState<ToolKind | null>(null);
  const [activeArtifact, setActiveArtifact] = useState<GeneratedArtifact | null>(null);

  useEffect(() => {
    if (!activeArtifact) {
      return;
    }

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveArtifact(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeArtifact]);

  function addNote() {
    const text = window.prompt("Escribe o pega tu nota");
    if (text?.trim()) {
      void onCreateNote(text.trim());
    }
  }

  async function runTool(kind: ToolKind) {
    setLastTool(kind);
    const artifact = await onGenerate(kind);
    if (artifact) {
      setActiveArtifact(artifact);
    }
  }

  function preventTileSelection(event: MouseEvent<HTMLElement>) {
    event.preventDefault();
  }

  function handleOutputCardKeyDown(event: KeyboardEvent<HTMLElement>, artifact: GeneratedArtifact) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setActiveArtifact(artifact);
    }
  }

  return (
    <aside className="notebook-panel notebook-studio-panel flex h-full min-h-0 flex-col">
      <header className="notebook-panel-header px-5 py-4">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-[20px] font-medium leading-none text-[var(--nb-text)]">Studio</h2>
            <p className="mt-2 text-sm leading-5 text-[var(--nb-muted)]">
              {selectedCount > 0
                ? `${selectedCount} selected readable sources`
                : readySourceCount > 0
                  ? `${readySourceCount} readable sources available`
                  : blockedReadySourceCount > 0
                    ? "Ready files found, but no readable chunks yet."
                    : "Add a readable source to generate study outputs."}
            </p>
          </div>
          {onCollapse && (
            <button
              aria-label="Collapse studio"
              className="notebook-studio-collapse-button hidden h-8 w-8 shrink-0 items-center justify-center rounded-full transition lg:inline-flex"
              onClick={onCollapse}
              type="button"
            >
              <PanelRightClose size={15} />
            </button>
          )}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <div className="notebook-tool-grid grid grid-cols-2 gap-2">
          {tools.map((tool) => {
            const loading = busy === tool.kind;
            const disabled = !hasReadyMaterial || loading;
            const helper = loading
              ? "Generating..."
              : !hasReadyMaterial
                ? blockedReadySourceCount > 0
                  ? "No readable chunks"
                  : "Add a readable source"
                : selectedCount > 0
                  ? tool.helper
                  : "Use all ready sources";
            return (
              <button
                key={tool.kind}
                aria-label={`${tool.label}: ${helper}`}
                className={`notebook-tool-tile ${tool.tone} group grid min-h-[70px] grid-cols-[22px_minmax(0,1fr)_24px] items-center gap-2 rounded-[12px] p-3 text-left transition ${disabled ? "is-disabled" : ""}`}
                disabled={disabled}
                onMouseDown={preventTileSelection}
                onClick={() => void runTool(tool.kind)}
                type="button"
              >
                <span aria-hidden="true" className="notebook-tool-icon flex h-6 w-6 shrink-0 items-center justify-center">
                  {loading ? <Loader2 className="animate-spin" size={17} /> : tool.icon}
                </span>
                <span aria-hidden="true" className="min-w-0">
                  <span className="block truncate text-[13px] font-semibold">{tool.label}</span>
                  <span className="block truncate text-[11px] font-medium opacity-75">
                    {helper}
                  </span>
                </span>
                <ArrowRight aria-hidden="true" size={16} className="notebook-tool-arrow shrink-0 transition group-hover:translate-x-0.5" />
              </button>
            );
          })}

          {futureTools.map((tool) => (
            <button
              key={tool.label}
              aria-disabled="true"
              aria-label={`${tool.label}: ${tool.helper}`}
              className={`notebook-tool-tile ${tool.tone} is-coming-soon grid min-h-[70px] grid-cols-[22px_minmax(0,1fr)_24px] items-center gap-2 rounded-[12px] p-3`}
              disabled
              onMouseDown={preventTileSelection}
              type="button"
            >
              <span aria-hidden="true" className="notebook-tool-icon flex h-6 w-6 shrink-0 items-center justify-center">{tool.icon}</span>
              <span aria-hidden="true" className="min-w-0">
                <span className="block truncate text-[13px] font-semibold">{tool.label}</span>
                <span className="block truncate text-[11px] font-medium opacity-75">{tool.helper}</span>
              </span>
              <ArrowRight aria-hidden="true" size={16} className="notebook-tool-arrow shrink-0" />
            </button>
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
                onClick={() => void runTool(lastTool)}
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
                <article
                  key={artifact.id}
                  className="notebook-output-card is-clickable rounded-[14px] border p-3"
                  onClick={() => setActiveArtifact(artifact)}
                  onKeyDown={(event) => handleOutputCardKeyDown(event, artifact)}
                  role="button"
                  tabIndex={0}
                >
                  <p className="text-[11px] font-semibold uppercase text-[var(--nb-accent)]">{studioArtifactLabel(artifact, t)}</p>
                  <h4 className="mt-1 text-sm font-semibold text-[var(--nb-text)]">{artifact.title}</h4>
                  <div className="mt-2 max-h-40 overflow-hidden text-sm text-[var(--nb-text)]">
                    <MarkdownMessage content={artifact.content} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <button
                      className="notebook-message-action inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold transition"
                      onClick={(event) => {
                        event.stopPropagation();
                        void navigator.clipboard?.writeText(artifact.content);
                      }}
                      type="button"
                    >
                      <Clipboard size={13} />
                      Copy
                    </button>
                    <button
                      className="notebook-message-action inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold transition"
                      onClick={(event) => {
                        event.stopPropagation();
                        onSendToChat(artifact);
                      }}
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
      {activeArtifact && (
        <StudioArtifactModal
          artifact={activeArtifact}
          onClose={() => setActiveArtifact(null)}
          onCopy={() => void navigator.clipboard?.writeText(activeArtifact.content)}
          onSendToChat={() => {
            onSendToChat(activeArtifact);
            setActiveArtifact(null);
          }}
          t={t}
        />
      )}
    </aside>
  );
}

function StudioArtifactModal({
  artifact,
  onClose,
  onCopy,
  onSendToChat,
  t,
}: {
  artifact: GeneratedArtifact;
  onClose: () => void;
  onCopy: () => void;
  onSendToChat: () => void;
  t: Record<string, string>;
}) {
  return (
    <div className="notebook-artifact-modal-backdrop" role="presentation">
      <section
        aria-labelledby="notebook-artifact-modal-title"
        aria-modal="true"
        className="notebook-artifact-modal"
        role="dialog"
      >
        <header className="notebook-artifact-modal-header">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase text-[var(--nb-accent)]">{studioArtifactLabel(artifact, t)}</p>
            <h2 id="notebook-artifact-modal-title" className="mt-1 truncate text-xl font-semibold text-[var(--nb-text)]">
              {artifact.title}
            </h2>
          </div>
          <button aria-label="Close Studio output" className="notebook-icon-button h-10 w-10 rounded-full" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </header>

        <div className="notebook-artifact-modal-body">
          <StudioArtifactBody artifact={artifact} t={t} />
        </div>

        <footer className="notebook-artifact-modal-footer">
          <button className="notebook-message-action inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold transition" onClick={onCopy} type="button">
            <Clipboard size={15} />
            Copy
          </button>
          <button className="notebook-add-note-button inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition" onClick={onSendToChat} type="button">
            <MessageSquareText size={15} />
            Use in chat
          </button>
        </footer>
      </section>
    </div>
  );
}

function StudioArtifactBody({ artifact, t }: { artifact: GeneratedArtifact; t: Record<string, string> }) {
  if (artifact.kind === "flashcards") {
    const cards = parseFlashcards(artifact.content);
    if (cards.length > 0) {
      return <NotebookFlashcards cards={cards} t={t} />;
    }
  }

  return (
    <div className={`notebook-artifact-rich-body is-${artifact.kind}`}>
      <MarkdownMessage content={artifact.content} />
    </div>
  );
}

function NotebookFlashcards({
  cards,
  t,
}: {
  cards: Array<{ front: string; back: string; hint?: string; source?: string }>;
  t: Record<string, string>;
}) {
  const [index, setIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const card = cards[index];

  return (
    <div className="notebook-flashcard-view">
      <div className="notebook-flashcard-toolbar">
        <span>{t.flashcards ?? "Flashcards"} {index + 1}/{cards.length}</span>
        <div className="flex gap-2">
          <button
            className="notebook-message-action inline-flex h-9 items-center rounded-full px-3 text-xs font-semibold"
            disabled={index === 0}
            onClick={() => {
              setIndex((current) => Math.max(0, current - 1));
              setShowBack(false);
            }}
            type="button"
          >
            {t.previous ?? "Previous"}
          </button>
          <button
            className="notebook-message-action inline-flex h-9 items-center rounded-full px-3 text-xs font-semibold"
            disabled={index === cards.length - 1}
            onClick={() => {
              setIndex((current) => Math.min(cards.length - 1, current + 1));
              setShowBack(false);
            }}
            type="button"
          >
            {t.next ?? "Next"}
          </button>
        </div>
      </div>

      <button className="notebook-flashcard-stage" onClick={() => setShowBack((current) => !current)} type="button">
        <span className="notebook-flashcard-label">{showBack ? t.flashcardBack ?? "Back" : t.flashcardFront ?? "Front"}</span>
        <strong>{showBack ? card.back : card.front}</strong>
        <span>{showBack ? card.hint || card.source || "" : card.hint || t.flashcardHint || "Click to reveal the answer."}</span>
        {card.source && <small>{card.source}</small>}
      </button>
    </div>
  );
}

function studioArtifactLabel(artifact: GeneratedArtifact, t: Record<string, string>) {
  return t[artifact.kind] ?? artifact.kind.replace(/_/g, " ");
}
