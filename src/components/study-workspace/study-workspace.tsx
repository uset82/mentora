"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react";
import { BookOpen, BrainCircuit, GripVertical, PanelLeftClose, Sparkles } from "lucide-react";
import type { ChatMessageData } from "../chat/chat-message";
import type { DocumentRecord, GeneratedArtifact, MaterialType, Profile, StudyNote, StudySpace, ToolKind } from "@/lib/types";
import { StudyChatPanel } from "./study-chat-panel";
import { StudySourcesPanel } from "./study-sources-panel";
import { StudyStudioPanel } from "./study-studio-panel";
import { StudyTopbar, type ThemeMode } from "./study-topbar";

type MobilePanel = "sources" | "chat" | "studio";
type ResizeTarget = "left" | "right";
type PanelWidths = { left: number; right: number };

const COLLAPSED_PANEL_WIDTH = 64;
const DEFAULT_PANEL_WIDTHS: PanelWidths = { left: 340, right: 400 };
const PANEL_WIDTH_STORAGE_KEY = "mentora-study-panel-widths";
const MIN_SOURCES_PANEL_WIDTH = 260;
const MIN_CHAT_PANEL_WIDTH = 320;
const MIN_STUDIO_PANEL_WIDTH = 300;
const KEYBOARD_RESIZE_STEP = 24;

type StudyWorkspaceProps = {
  activeArtifacts: GeneratedArtifact[];
  activeDocuments: DocumentRecord[];
  activeNotes: StudyNote[];
  activeSpace: StudySpace | null;
  busy: string | null;
  error: string | null;
  messages: ChatMessageData[];
  onAddLink: (url: string) => Promise<boolean> | boolean;
  onCreateSpace: (name: string) => Promise<string | null>;
  onCreateNote: (text: string, selectedDocumentIds?: string[]) => Promise<boolean> | boolean;
  onCreateSourceNote: (text: string) => Promise<boolean> | boolean;
  onDeleteDocument: (documentId: string) => Promise<boolean> | boolean;
  onDeleteNote: (noteId: string) => Promise<boolean> | boolean;
  onGenerate: (kind: ToolKind, selectedDocumentIds?: string[]) => Promise<GeneratedArtifact | null>;
  onOpenProfile: () => void;
  onOpenProgress: () => void;
  onSelectSpace: (spaceId: string) => void;
  onSend: (message: string, selectedDocumentIds?: string[]) => void;
  onSignOut: () => void;
  onUpdateNote: (noteId: string, patch: { title?: string; content?: string }) => Promise<boolean> | boolean;
  onUpload: (file: File, materialType: MaterialType) => Promise<boolean> | boolean;
  profile: Profile | null;
  generatorReadyDocuments: DocumentRecord[];
  readyDocuments: DocumentRecord[];
  spaces: StudySpace[];
  t: Record<string, string>;
};

export function StudyWorkspace({
  activeArtifacts,
  activeDocuments,
  activeNotes,
  activeSpace,
  busy,
  error,
  messages,
  onAddLink,
  onCreateSpace,
  onCreateNote,
  onCreateSourceNote,
  onDeleteDocument,
  onDeleteNote,
  onGenerate,
  onOpenProfile,
  onOpenProgress,
  onSelectSpace,
  onSend,
  onSignOut,
  onUpdateNote,
  onUpload,
  profile,
  generatorReadyDocuments,
  readyDocuments,
  spaces,
  t,
}: StudyWorkspaceProps) {
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("chat");
  const [leftCollapsed, setLeftCollapsed] = useLocalPanelState("mentora-study-left-collapsed", false);
  const [rightCollapsed, setRightCollapsed] = useLocalPanelState("mentora-study-right-collapsed", false);
  const [panelWidths, setPanelWidths] = useLocalPanelWidths();
  const [resizingPanel, setResizingPanel] = useState<ResizeTarget | null>(null);
  const [themeMode, setThemeMode] = useLocalThemeState();
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.dataset.mentoraTheme = themeMode;
  }, [themeMode]);

  useEffect(() => {
    function normalizePanelWidths() {
      setPanelWidths((current) => clampPanelWidthsForGrid(current, gridRef.current, leftCollapsed, rightCollapsed));
    }

    normalizePanelWidths();
    window.addEventListener("resize", normalizePanelWidths);
    return () => window.removeEventListener("resize", normalizePanelWidths);
  }, [leftCollapsed, rightCollapsed, setPanelWidths]);

  useEffect(() => {
    if (!resizingPanel) {
      return;
    }

    const target = resizingPanel;
    const previousCursor = document.documentElement.style.cursor;
    const previousUserSelect = document.body.style.userSelect;
    document.documentElement.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    function handlePointerMove(event: PointerEvent) {
      const nextWidth = panelWidthFromPointer(target, event.clientX, gridRef.current);
      if (nextWidth === null) {
        return;
      }

      setPanelWidths((current) =>
        clampPanelWidthsForGrid(
          {
            ...current,
            [target]: nextWidth,
          },
          gridRef.current,
          leftCollapsed,
          rightCollapsed,
        ),
      );
    }

    function handlePointerUp() {
      setResizingPanel(null);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });
    window.addEventListener("pointercancel", handlePointerUp, { once: true });

    return () => {
      document.documentElement.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [leftCollapsed, resizingPanel, rightCollapsed, setPanelWidths]);

  useEffect(() => {
    function handleFocusShortcut(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "f") {
        event.preventDefault();
        setLeftCollapsed(true);
        setRightCollapsed(true);
        setMobilePanel("chat");
      }
    }

    window.addEventListener("keydown", handleFocusShortcut);
    return () => window.removeEventListener("keydown", handleFocusShortcut);
  }, [setLeftCollapsed, setRightCollapsed]);

  const selectedMaterials = useMemo(
    () => activeDocuments.filter((document) => selectedMaterialIds.includes(document.id)),
    [activeDocuments, selectedMaterialIds],
  );
  const generatorReadyDocumentIds = useMemo(
    () => new Set(generatorReadyDocuments.map((document) => document.id)),
    [generatorReadyDocuments],
  );
  const selectedGeneratorReadyMaterialIds = useMemo(
    () => selectedMaterials.filter((document) => generatorReadyDocumentIds.has(document.id)).map((document) => document.id),
    [generatorReadyDocumentIds, selectedMaterials],
  );
  const generationMaterialIds = selectedGeneratorReadyMaterialIds.length > 0 ? selectedGeneratorReadyMaterialIds : [];
  const hasReadyMaterial = generatorReadyDocuments.length > 0;
  const blockedReadySourceCount = Math.max(0, readyDocuments.length - generatorReadyDocuments.length);

  function toggleMaterial(documentId: string) {
    setSelectedMaterialIds((current) =>
      current.includes(documentId) ? current.filter((id) => id !== documentId) : [...current, documentId],
    );
  }

  async function deleteDocument(documentId: string) {
    const deleted = await onDeleteDocument(documentId);
    if (deleted) {
      setSelectedMaterialIds((current) => current.filter((id) => id !== documentId));
    }
    return deleted;
  }

  function sendArtifactToChat(artifact: GeneratedArtifact) {
    onSend(`Sigamos estudiando con este recurso:\n\n${artifact.content}`, selectedMaterialIds);
    setMobilePanel("chat");
  }

  function startResize(target: ResizeTarget) {
    setResizingPanel(target);
  }

  function resizeWithKeyboard(target: ResizeTarget, direction: -1 | 1) {
    const signedStep = target === "left" ? direction * KEYBOARD_RESIZE_STEP : direction * -KEYBOARD_RESIZE_STEP;
    setPanelWidths((current) =>
      clampPanelWidthsForGrid(
        {
          ...current,
          [target]: current[target] + signedStep,
        },
        gridRef.current,
        leftCollapsed,
        rightCollapsed,
      ),
    );
  }

  function handleResizeKeyDown(event: ReactKeyboardEvent<HTMLDivElement>, target: ResizeTarget) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
      return;
    }

    event.preventDefault();
    resizeWithKeyboard(target, event.key === "ArrowRight" ? 1 : -1);
  }

  return (
    <section className={`notebook-workspace flex h-[calc(100dvh-1rem)] min-h-0 flex-col overflow-hidden lg:h-[calc(100dvh-1.5rem)] ${resizingPanel ? "is-resizing" : ""}`}>
      <StudyTopbar
        activeSpace={activeSpace}
        documents={activeDocuments}
        onCreateSpace={onCreateSpace}
        onOpenProfile={onOpenProfile}
        onOpenProgress={onOpenProgress}
        onSelectSpace={onSelectSpace}
        onSignOut={onSignOut}
        onThemeModeChange={setThemeMode}
        profile={profile}
        readyCount={readyDocuments.length}
        spaces={spaces}
        themeMode={themeMode}
      />

      <div
        ref={gridRef}
        className="notebook-workspace-grid grid min-h-0 flex-1 grid-cols-1 gap-3 px-3 pb-3 lg:grid-cols-[var(--study-left)_minmax(0,1fr)_var(--study-right)] lg:gap-4 lg:px-4 lg:pb-4"
        style={{
          "--study-left": leftCollapsed ? `${COLLAPSED_PANEL_WIDTH}px` : `${panelWidths.left}px`,
          "--study-right": rightCollapsed ? `${COLLAPSED_PANEL_WIDTH}px` : `${panelWidths.right}px`,
        } as CSSProperties}
      >
        <div className={`notebook-panel-slot ${mobilePanel === "sources" ? "block" : "hidden"} h-full min-h-0 lg:block`}>
          {leftCollapsed ? (
            <>
              <div className="hidden h-full lg:block">
                <CollapsedPanel icon={<BookOpen size={18} />} label="Sources" onClick={() => setLeftCollapsed(false)} />
              </div>
              <div className="h-full lg:hidden">
                <StudySourcesPanel
                  busy={busy}
                  documents={activeDocuments}
                  onAddLink={onAddLink}
                  onCreateNote={onCreateSourceNote}
                  onDeleteDocument={deleteDocument}
                  onToggleMaterial={toggleMaterial}
                  onUpload={onUpload}
                  selectedMaterialIds={selectedMaterialIds}
                />
              </div>
            </>
          ) : (
            <StudySourcesPanel
              busy={busy}
              documents={activeDocuments}
              onAddLink={onAddLink}
              onCreateNote={onCreateSourceNote}
              onDeleteDocument={deleteDocument}
              onToggleMaterial={toggleMaterial}
              onUpload={onUpload}
              selectedMaterialIds={selectedMaterialIds}
            />
          )}
          {!leftCollapsed && (
            <PanelToggle
              ariaLabel="Collapse sources"
              className="right-3 top-3"
              icon={<PanelLeftClose size={15} />}
              onClick={() => setLeftCollapsed(true)}
            />
          )}
          {!leftCollapsed && (
            <PanelResizeHandle
              active={resizingPanel === "left"}
              ariaLabel="Resize Sources and Chat panels"
              onKeyDown={(event) => handleResizeKeyDown(event, "left")}
              onPointerDown={() => startResize("left")}
              value={panelWidths.left}
            />
          )}
        </div>

        <div className={`notebook-panel-slot ${mobilePanel === "chat" ? "block" : "hidden"} h-full min-h-0 lg:block`}>
          <StudyChatPanel
            activeSpaceTitle={activeSpace?.name ?? "Untitled notebook"}
            busy={busy}
            documents={activeDocuments}
            messages={messages}
            onAddLink={onAddLink}
            onCreateNote={(text) => onCreateNote(text, selectedMaterialIds)}
            onCreateSourceNote={onCreateSourceNote}
            onFocusChat={() => {
              setLeftCollapsed(true);
              setRightCollapsed(true);
              setMobilePanel("chat");
            }}
            onSend={(message) => onSend(message, selectedMaterialIds)}
            onUpload={onUpload}
            selectedMaterials={selectedMaterials}
            t={t}
          />
          {!rightCollapsed && (
            <PanelResizeHandle
              active={resizingPanel === "right"}
              ariaLabel="Resize Chat and Studio panels"
              onKeyDown={(event) => handleResizeKeyDown(event, "right")}
              onPointerDown={() => startResize("right")}
              value={panelWidths.right}
            />
          )}
        </div>

        <div className={`notebook-panel-slot ${mobilePanel === "studio" ? "block" : "hidden"} h-full min-h-0 lg:block`}>
          {rightCollapsed ? (
            <>
              <div className="hidden h-full lg:block">
                <CollapsedPanel icon={<Sparkles size={18} />} label="Studio" onClick={() => setRightCollapsed(false)} />
              </div>
              <div className="h-full lg:hidden">
                <StudyStudioPanel
                  artifacts={activeArtifacts}
                  busy={busy}
                  error={error}
                  hasReadyMaterial={hasReadyMaterial}
                  notes={activeNotes}
                  blockedReadySourceCount={blockedReadySourceCount}
                  onCollapse={() => setRightCollapsed(true)}
                  onCreateNote={(text) => onCreateNote(text, selectedMaterialIds)}
                  onDeleteNote={onDeleteNote}
                  onGenerate={(kind) => onGenerate(kind, generationMaterialIds)}
                  onSendToChat={sendArtifactToChat}
                  onUpdateNote={onUpdateNote}
                  readySourceCount={generatorReadyDocuments.length}
                  selectedCount={selectedGeneratorReadyMaterialIds.length}
                  t={t}
                />
              </div>
            </>
          ) : (
            <StudyStudioPanel
              artifacts={activeArtifacts}
              busy={busy}
              error={error}
              hasReadyMaterial={hasReadyMaterial}
              notes={activeNotes}
              blockedReadySourceCount={blockedReadySourceCount}
              onCollapse={() => setRightCollapsed(true)}
              onCreateNote={(text) => onCreateNote(text, selectedMaterialIds)}
              onDeleteNote={onDeleteNote}
              onGenerate={(kind) => onGenerate(kind, generationMaterialIds)}
              onSendToChat={sendArtifactToChat}
              onUpdateNote={onUpdateNote}
              readySourceCount={generatorReadyDocuments.length}
              selectedCount={selectedGeneratorReadyMaterialIds.length}
              t={t}
            />
          )}
        </div>
      </div>

      <nav className="notebook-mobile-tabs grid grid-cols-3 lg:hidden" aria-label="Paneles de estudio">
        <MobileTab active={mobilePanel === "sources"} icon={<BookOpen size={16} />} label="Sources" onClick={() => setMobilePanel("sources")} />
        <MobileTab active={mobilePanel === "chat"} icon={<BrainCircuit size={16} />} label="Chat" onClick={() => setMobilePanel("chat")} />
        <MobileTab active={mobilePanel === "studio"} icon={<Sparkles size={16} />} label="Studio" onClick={() => setMobilePanel("studio")} />
      </nav>
    </section>
  );
}

function CollapsedPanel({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      className="notebook-collapsed-panel flex h-full w-full flex-col items-center gap-2 px-2 py-4 text-xs font-bold uppercase tracking-wide transition"
      onClick={onClick}
      type="button"
    >
      <span className="notebook-collapsed-icon flex h-9 w-9 items-center justify-center rounded-full">{icon}</span>
      <span className="[writing-mode:vertical-rl]">{label}</span>
    </button>
  );
}

function readGridColumnGap(grid: HTMLDivElement) {
  const parsed = Number.parseFloat(window.getComputedStyle(grid).columnGap);
  return Number.isFinite(parsed) ? parsed : 16;
}

function clampPanelWidthsForGrid(
  widths: PanelWidths,
  grid: HTMLDivElement | null,
  leftCollapsed: boolean,
  rightCollapsed: boolean,
): PanelWidths {
  if (!grid) {
    return {
      left: clamp(widths.left, MIN_SOURCES_PANEL_WIDTH, 640),
      right: clamp(widths.right, MIN_STUDIO_PANEL_WIDTH, 720),
    };
  }

  const gap = readGridColumnGap(grid);
  const availableWidth = Math.max(0, grid.clientWidth - gap * 2);
  let left = clamp(widths.left, MIN_SOURCES_PANEL_WIDTH, availableWidth);
  let right = clamp(widths.right, MIN_STUDIO_PANEL_WIDTH, availableWidth);

  if (!leftCollapsed) {
    const fixedRight = rightCollapsed ? COLLAPSED_PANEL_WIDTH : right;
    const maxLeft = Math.max(MIN_SOURCES_PANEL_WIDTH, availableWidth - fixedRight - MIN_CHAT_PANEL_WIDTH);
    left = clamp(left, MIN_SOURCES_PANEL_WIDTH, maxLeft);
  }

  if (!rightCollapsed) {
    const fixedLeft = leftCollapsed ? COLLAPSED_PANEL_WIDTH : left;
    const maxRight = Math.max(MIN_STUDIO_PANEL_WIDTH, availableWidth - fixedLeft - MIN_CHAT_PANEL_WIDTH);
    right = clamp(right, MIN_STUDIO_PANEL_WIDTH, maxRight);
  }

  return { left: Math.round(left), right: Math.round(right) };
}

function panelWidthFromPointer(target: ResizeTarget, clientX: number, grid: HTMLDivElement | null) {
  if (!grid) {
    return null;
  }

  const rect = grid.getBoundingClientRect();
  const gap = readGridColumnGap(grid);
  if (target === "left") {
    return clientX - rect.left;
  }

  return rect.right - clientX - gap;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function PanelResizeHandle({
  active,
  ariaLabel,
  onKeyDown,
  onPointerDown,
  value,
}: {
  active: boolean;
  ariaLabel: string;
  onKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => void;
  onPointerDown: () => void;
  value: number;
}) {
  return (
    <div
      aria-label={ariaLabel}
      aria-orientation="vertical"
      aria-valuenow={Math.round(value)}
      className={`notebook-resize-handle ${active ? "is-active" : ""}`}
      onKeyDown={onKeyDown}
      onPointerDown={(event) => {
        event.preventDefault();
        onPointerDown();
      }}
      role="separator"
      tabIndex={0}
    >
      <span className="notebook-resize-grip" aria-hidden="true">
        <GripVertical size={16} strokeWidth={2.4} />
      </span>
    </div>
  );
}

function PanelToggle({
  ariaLabel,
  className,
  icon,
  onClick,
}: {
  ariaLabel: string;
  className: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={ariaLabel}
      className={`notebook-panel-toggle absolute z-20 hidden h-8 w-8 items-center justify-center rounded-full transition lg:inline-flex ${className}`}
      onClick={onClick}
      type="button"
    >
      {icon}
    </button>
  );
}

function MobileTab({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-current={active ? "page" : undefined}
      className={`notebook-mobile-tab flex h-14 items-center justify-center gap-1.5 text-sm font-bold ${active ? "is-active" : ""}`}
      onClick={onClick}
      type="button"
    >
      {icon}
      {label}
    </button>
  );
}

function useLocalThemeState() {
  const [value, setValue] = useState<ThemeMode>(() => {
    try {
      if (typeof window !== "undefined") {
        const stored = window.localStorage.getItem("mentora-theme-mode");
        return stored === "dark" ? "dark" : "light";
      }
    } catch {}
    return "light";
  });

  useEffect(() => {
    try {
      window.localStorage.setItem("mentora-theme-mode", value);
    } catch {}
  }, [value]);

  return [value, setValue] as const;
}

function useLocalPanelWidths() {
  const [value, setValue] = useState<PanelWidths>(() => {
    try {
      if (typeof window !== "undefined") {
        const stored = window.localStorage.getItem(PANEL_WIDTH_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Partial<PanelWidths>;
          const left = Number(parsed.left);
          const right = Number(parsed.right);
          if (Number.isFinite(left) && Number.isFinite(right)) {
            return {
              left: clamp(left, MIN_SOURCES_PANEL_WIDTH, 720),
              right: clamp(right, MIN_STUDIO_PANEL_WIDTH, 820),
            };
          }
        }
      }
    } catch {}
    return DEFAULT_PANEL_WIDTHS;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(PANEL_WIDTH_STORAGE_KEY, JSON.stringify(value));
    } catch {}
  }, [value]);

  return [value, setValue] as const;
}

function useLocalPanelState(key: string, defaultValue: boolean) {
  const [value, setValue] = useState(() => {
    try {
      if (typeof window !== "undefined") {
        const stored = window.localStorage.getItem(key);
        if (stored) {
          return stored === "true";
        }
      }
    } catch {}
    return defaultValue;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, String(value));
    } catch {}
  }, [key, value]);

  return [value, setValue] as const;
}
