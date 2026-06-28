"use client";

import { BarChart3, BookOpen, ChevronDown, LogOut, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Plus, Settings2, Share2, UserRound } from "lucide-react";
import { useState } from "react";
import type { DocumentRecord, Profile, StudySpace } from "@/lib/types";

type StudyTopbarProps = {
  activeSpace: StudySpace | null;
  documents: DocumentRecord[];
  leftCollapsed: boolean;
  onCreateSpace: (name: string) => Promise<string | null>;
  onOpenProfile: () => void;
  onOpenProgress: () => void;
  onSelectSpace: (spaceId: string) => void;
  onSignOut: () => void;
  onToggleLeft: () => void;
  onToggleRight: () => void;
  profile: Profile | null;
  readyCount: number;
  rightCollapsed: boolean;
  spaces: StudySpace[];
};

export function StudyTopbar({
  activeSpace,
  documents,
  leftCollapsed,
  onCreateSpace,
  onOpenProfile,
  onOpenProgress,
  onSelectSpace,
  onSignOut,
  onToggleLeft,
  onToggleRight,
  profile,
  readyCount,
  rightCollapsed,
  spaces,
}: StudyTopbarProps) {
  const title = activeSpace?.name ?? "Espacio personal";
  const studentName = profile?.full_name ?? profile?.email ?? "Estudiante";
  const initials = studentName.slice(0, 2).toUpperCase();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  async function createSpace() {
    const name = window.prompt("Nombre del nuevo espacio");
    if (name?.trim()) {
      await onCreateSpace(name.trim());
    }
  }

  async function shareWorkspace() {
    const shareData = { title: "Mentora", text: title, url: window.location.href };
    if (navigator.share) {
      await navigator.share(shareData).catch(() => undefined);
      return;
    }
    await navigator.clipboard?.writeText(window.location.href);
  }

  return (
    <header className="relative flex min-h-14 items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-2 lg:px-4">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div className="hidden shrink-0 items-center gap-2 pr-2 sm:flex">
          <span className="text-2xl font-black leading-none text-blue-600">M</span>
          <span className="text-base font-black leading-none text-slate-950">Mentora</span>
        </div>
        <button
          aria-label={leftCollapsed ? "Mostrar materiales" : "Ocultar materiales"}
          className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 lg:inline-flex"
          onClick={onToggleLeft}
          type="button"
        >
          {leftCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
        </button>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
          <BookOpen size={18} />
        </div>
        <div className="min-w-0 shrink">
          <p className="text-[11px] font-bold uppercase tracking-wide text-blue-700">Estudio</p>
          <h1 className="truncate text-base font-bold leading-tight text-slate-950 sm:text-lg">{title}</h1>
        </div>
        {spaces.length > 1 && activeSpace && (
          <label className="hidden min-w-36 max-w-56 shrink items-center rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs font-bold text-slate-700 transition focus-within:border-blue-300 focus-within:bg-white md:flex">
            <span className="sr-only">Cambiar espacio</span>
            <select
              className="h-9 min-w-0 flex-1 bg-transparent outline-none"
              onChange={(event) => onSelectSpace(event.target.value)}
              value={activeSpace.id}
            >
              {spaces.map((space) => (
                <option key={space.id} value={space.id}>
                  {space.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <button
          className="hidden h-9 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-xs font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 md:inline-flex"
          onClick={createSpace}
          type="button"
        >
          <Plus size={15} />
          <span className="hidden xl:inline">Nuevo espacio</span>
        </button>
      </div>

      <div className="flex min-w-0 shrink-0 items-center gap-1.5">
        <button
          className="hidden h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-xs font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 xl:inline-flex"
          onClick={onOpenProgress}
          type="button"
        >
          <BarChart3 size={15} />
          Progreso
        </button>
        <button
          aria-label="Compartir"
          className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 sm:inline-flex"
          onClick={() => void shareWorkspace()}
          type="button"
        >
          <Share2 size={15} />
        </button>
        <button
          aria-label="Ajustes"
          className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 md:inline-flex"
          onClick={onOpenProfile}
          type="button"
        >
          <Settings2 size={15} />
        </button>
        <span className="hidden rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 sm:inline-flex">
          {documents.length} materiales
        </span>
        <span className="hidden rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 sm:inline-flex">
          {readyCount} listos
        </span>
        <button
          aria-label={rightCollapsed ? "Mostrar Studio" : "Ocultar Studio"}
          className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 lg:inline-flex"
          onClick={onToggleRight}
          type="button"
        >
          {rightCollapsed ? <PanelRightOpen size={17} /> : <PanelRightClose size={17} />}
        </button>
        <button
          aria-expanded={profileMenuOpen}
          className="flex h-9 min-w-0 items-center gap-2 rounded-lg border border-slate-200 px-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          onClick={() => setProfileMenuOpen((current) => !current)}
          title={studentName}
          type="button"
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-50 text-[10px] font-black text-blue-700 sm:hidden">
            {initials}
          </span>
          <UserRound className="hidden sm:block" size={16} />
          <span className="hidden max-w-32 truncate lg:inline">{studentName}</span>
          <ChevronDown className="hidden sm:block" size={14} />
        </button>
      </div>
      {profileMenuOpen && (
        <div className="absolute right-3 top-[calc(100%-4px)] z-50 w-64 rounded-lg border border-slate-200 bg-white p-2 text-sm shadow-[0_18px_50px_rgba(15,23,42,0.14)]">
          <div className="border-b border-slate-100 px-2.5 py-2">
            <p className="truncate font-bold text-slate-950">{studentName}</p>
            <p className="truncate text-xs font-medium text-slate-500">{profile?.email}</p>
          </div>
          <button
            className="mt-2 flex h-9 w-full items-center gap-2 rounded-lg px-2.5 text-left text-xs font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
            onClick={() => {
              setProfileMenuOpen(false);
              onOpenProfile();
            }}
            type="button"
          >
            <Settings2 size={15} />
            Perfil y ajustes
          </button>
          <button
            className="flex h-9 w-full items-center gap-2 rounded-lg px-2.5 text-left text-xs font-bold text-rose-700 transition hover:bg-rose-50"
            onClick={() => {
              setProfileMenuOpen(false);
              onSignOut();
            }}
            type="button"
          >
            <LogOut size={15} />
            Cerrar sesion
          </button>
        </div>
      )}
    </header>
  );
}
