"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { BookOpen, BrainCircuit, PanelLeftClose, Sparkles } from "lucide-react";
import type { ChatMessageData } from "../chat/chat-message";
import type { DocumentRecord, GeneratedArtifact, MaterialType, Profile, StudyNote, StudySpace, ToolKind } from "@/lib/types";
import { StudyChatPanel } from "./study-chat-panel";
import { StudySourcesPanel } from "./study-sources-panel";
import { StudyStudioPanel } from "./study-studio-panel";
import { StudyTopbar, type ThemeMode } from "./study-topbar";

type MobilePanel = "sources" | "chat" | "studio";

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
  onDeleteNote: (noteId: string) => Promise<boolean> | boolean;
  onGenerate: (kind: ToolKind, selectedDocumentIds?: string[]) => void;
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
  const [themeMode, setThemeMode] = useLocalThemeState();
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);

  useEffect(() => {
    document.documentElement.dataset.mentoraTheme = themeMode;
  }, [themeMode]);

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

  function sendArtifactToChat(artifact: GeneratedArtifact) {
    onSend(`Sigamos estudiando con este recurso:\n\n${artifact.content}`, selectedMaterialIds);
    setMobilePanel("chat");
  }

  return (
    <section className="notebook-workspace flex h-[calc(100dvh-1rem)] min-h-0 flex-col overflow-hidden lg:h-[calc(100dvh-1.5rem)]">
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
        className="notebook-workspace-grid grid min-h-0 flex-1 grid-cols-1 gap-3 px-3 pb-3 lg:grid-cols-[var(--study-left)_minmax(0,1fr)_var(--study-right)] lg:gap-4 lg:px-4 lg:pb-4"
        style={{
          "--study-left": leftCollapsed ? "64px" : "320px",
          "--study-right": rightCollapsed ? "64px" : "360px",
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
                  onCreateNote={(text) => onCreateNote(text, selectedMaterialIds)}
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
              onCreateNote={(text) => onCreateNote(text, selectedMaterialIds)}
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
        </div>

        <div className={`notebook-panel-slot ${mobilePanel === "chat" ? "block" : "hidden"} h-full min-h-0 lg:block`}>
          <StudyChatPanel
            activeSpaceTitle={activeSpace?.name ?? "Untitled notebook"}
            busy={busy}
            documents={activeDocuments}
            messages={messages}
            onAddLink={onAddLink}
            onCreateNote={(text) => onCreateNote(text, selectedMaterialIds)}
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
