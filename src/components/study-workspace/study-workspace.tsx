"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { BookOpen, BrainCircuit, Sparkles } from "lucide-react";
import type { ChatMessageData } from "../chat/chat-message";
import type { DocumentRecord, GeneratedArtifact, MaterialType, Profile, StudyNote, StudySpace, ToolKind } from "@/lib/types";
import { StudyChatPanel } from "./study-chat-panel";
import { StudySourcesPanel } from "./study-sources-panel";
import { StudyStudioPanel } from "./study-studio-panel";
import { StudyTopbar } from "./study-topbar";

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
  readyDocuments,
  spaces,
  t,
}: StudyWorkspaceProps) {
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("chat");
  const [leftCollapsed, setLeftCollapsed] = useLocalPanelState("mentora-study-left-collapsed", false);
  const [rightCollapsed, setRightCollapsed] = useLocalPanelState("mentora-study-right-collapsed", false);
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);

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
  const hasSelectedReadyMaterial = selectedMaterials.some((document) => document.processing_status === "ready");

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
    <section className="flex h-[calc(100dvh-1rem)] min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)] lg:h-[calc(100dvh-2rem)] lg:min-h-[720px]">
      <StudyTopbar
        activeSpace={activeSpace}
        documents={activeDocuments}
        leftCollapsed={leftCollapsed}
        onCreateSpace={onCreateSpace}
        onOpenProfile={onOpenProfile}
        onOpenProgress={onOpenProgress}
        onSelectSpace={onSelectSpace}
        onSignOut={onSignOut}
        onToggleLeft={() => setLeftCollapsed((value) => !value)}
        onToggleRight={() => setRightCollapsed((value) => !value)}
        profile={profile}
        readyCount={readyDocuments.length}
        rightCollapsed={rightCollapsed}
        spaces={spaces}
      />

      <div
        className={`grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[var(--study-left)_minmax(0,1fr)_var(--study-right)]`}
        style={{
          "--study-left": leftCollapsed ? "64px" : "300px",
          "--study-right": rightCollapsed ? "64px" : "320px",
        } as CSSProperties}
      >
        <div className={`${mobilePanel === "sources" ? "block" : "hidden"} h-full min-h-0 lg:block`}>
          {leftCollapsed ? (
            <>
              <div className="hidden h-full lg:block">
                <CollapsedPanel icon={<BookOpen size={18} />} label="Materiales" onClick={() => setLeftCollapsed(false)} />
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
        </div>

        <div className={`${mobilePanel === "chat" ? "block" : "hidden"} h-full min-h-0 lg:block`}>
          <StudyChatPanel
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

        <div className={`${mobilePanel === "studio" ? "block" : "hidden"} h-full min-h-0 lg:block`}>
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
                  hasSelectedReadyMaterial={hasSelectedReadyMaterial}
                  notes={activeNotes}
                  onCreateNote={(text) => onCreateNote(text, selectedMaterialIds)}
                  onDeleteNote={onDeleteNote}
                  onGenerate={(kind) => onGenerate(kind, selectedMaterialIds)}
                  onSendToChat={sendArtifactToChat}
                  onUpdateNote={onUpdateNote}
                  selectedCount={selectedMaterials.length}
                  t={t}
                />
              </div>
            </>
          ) : (
            <StudyStudioPanel
              artifacts={activeArtifacts}
              busy={busy}
              error={error}
              hasSelectedReadyMaterial={hasSelectedReadyMaterial}
              notes={activeNotes}
              onCreateNote={(text) => onCreateNote(text, selectedMaterialIds)}
              onDeleteNote={onDeleteNote}
              onGenerate={(kind) => onGenerate(kind, selectedMaterialIds)}
              onSendToChat={sendArtifactToChat}
              onUpdateNote={onUpdateNote}
              selectedCount={selectedMaterials.length}
              t={t}
            />
          )}
        </div>
      </div>

      <nav className="grid grid-cols-3 border-t border-slate-200 bg-white lg:hidden" aria-label="Paneles de estudio">
        <MobileTab active={mobilePanel === "sources"} icon={<BookOpen size={16} />} label="Materiales" onClick={() => setMobilePanel("sources")} />
        <MobileTab active={mobilePanel === "chat"} icon={<BrainCircuit size={16} />} label="Chat" onClick={() => setMobilePanel("chat")} />
        <MobileTab active={mobilePanel === "studio"} icon={<Sparkles size={16} />} label="Studio" onClick={() => setMobilePanel("studio")} />
      </nav>
    </section>
  );
}

function CollapsedPanel({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      className="flex h-full w-full flex-col items-center gap-2 border-x border-slate-200 bg-slate-50 px-2 py-4 text-xs font-bold uppercase tracking-wide text-slate-500 transition hover:bg-blue-50 hover:text-blue-700"
      onClick={onClick}
      type="button"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-sm">{icon}</span>
      <span className="[writing-mode:vertical-rl]">{label}</span>
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
      className={`flex h-14 items-center justify-center gap-1.5 text-sm font-bold ${
        active ? "bg-blue-50 text-blue-700" : "text-slate-500"
      }`}
      onClick={onClick}
      type="button"
    >
      {icon}
      {label}
    </button>
  );
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
