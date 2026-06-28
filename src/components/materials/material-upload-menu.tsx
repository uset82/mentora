"use client";

import { ChevronLeft, FileImage, FileText, Link2, NotebookPen, Paperclip, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ReactNode, RefObject } from "react";
import type { MaterialType } from "@/lib/types";

type UploadHandler = (file: File, materialType: MaterialType) => Promise<boolean> | boolean;

type MaterialUploadMenuProps = {
  align?: "left" | "right";
  disabled: boolean;
  label?: string;
  onAddLink?: (url: string) => Promise<boolean> | boolean;
  onCreateNote?: (text: string) => Promise<boolean> | boolean;
  onUpload?: UploadHandler;
  variant?: "primary" | "secondary" | "bar";
};

export function MaterialUploadMenu({
  align = "right",
  disabled,
  label = "Agregar material",
  onAddLink,
  onCreateNote,
  onUpload,
  variant = "primary",
}: MaterialUploadMenuProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"link" | "note" | null>(null);
  const [value, setValue] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const documentRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        close();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        close();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function close() {
    setOpen(false);
    setMode(null);
    setValue("");
  }

  function handleFiles(fileList: FileList | null, materialType: MaterialType) {
    const file = fileList?.[0];
    if (file && onUpload) {
      void onUpload(file, materialType);
      close();
    }
  }

  function chooseFile(inputRef: RefObject<HTMLInputElement | null>) {
    inputRef.current?.click();
    setOpen(false);
    setMode(null);
    setValue("");
  }

  function submitInline() {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }

    if (mode === "link") {
      void onAddLink?.(trimmed);
    }

    if (mode === "note") {
      void onCreateNote?.(trimmed);
    }

    close();
  }

  const triggerClass =
    variant === "bar"
      ? "inline-flex min-h-8 w-full items-center justify-center gap-2 rounded-full border border-[rgba(15,23,42,0.12)] bg-white px-3 text-[13px] font-semibold text-slate-950 shadow-none transition hover:border-[rgba(37,99,235,0.22)] hover:bg-slate-50 focus-visible:outline-none focus-visible:shadow-[var(--mentora-focus-ring)] disabled:cursor-not-allowed disabled:opacity-60"
      : variant === "primary"
      ? "mentora-primary-button h-11 shrink-0 px-3 whitespace-nowrap"
      : "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[rgba(37,99,235,0.14)] bg-white px-3 text-sm font-black text-[var(--mentora-primary)] shadow-[0_14px_30px_rgba(42,64,128,0.1)] transition hover:-translate-y-0.5 hover:border-[rgba(37,99,235,0.26)] hover:bg-[#f7faff] focus-visible:outline-none focus-visible:shadow-[var(--mentora-focus-ring)] disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div ref={rootRef} className={variant === "bar" ? "relative flex w-full" : "relative inline-flex"}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        className={triggerClass}
        disabled={disabled || !onUpload}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <Plus size={17} />
        <span>{label}</span>
      </button>

      {open && (
        <div
          className={`materials-glass-popover absolute top-[calc(100%+10px)] z-50 grid w-[min(280px,calc(100vw-2rem))] gap-1 rounded-[22px] border border-[rgba(37,99,235,0.14)] bg-white/95 p-2 text-[var(--mentora-text)] shadow-[0_24px_54px_rgba(25,46,98,0.18)] backdrop-blur-xl ${
            align === "right" ? "right-0" : "left-0"
          }`}
          role="menu"
        >
          {!mode ? (
            <>
              <MenuButton icon={<FileText size={16} />} label="Subir PDF" onClick={() => chooseFile(pdfRef)} />
              <MenuButton icon={<FileImage size={16} />} label="Subir imagen" onClick={() => chooseFile(imageRef)} />
              <MenuButton icon={<Paperclip size={16} />} label="Subir documento" onClick={() => chooseFile(documentRef)} />
              <MenuButton disabled={!onAddLink} icon={<Link2 size={16} />} label="Pegar enlace" onClick={() => setMode("link")} />
              <MenuButton disabled={!onCreateNote} icon={<NotebookPen size={16} />} label="Crear nota" onClick={() => setMode("note")} />
            </>
          ) : (
            <div className="grid gap-3 p-1">
              <div className="flex items-center justify-between gap-2">
                <button
                  className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-[var(--mentora-muted)] transition hover:bg-[rgba(37,99,235,0.08)] hover:text-[var(--mentora-primary)]"
                  onClick={() => {
                    setMode(null);
                    setValue("");
                  }}
                  type="button"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="min-w-0 flex-1 text-sm font-black text-[var(--mentora-text)]">
                  {mode === "link" ? "Pegar enlace" : "Crear nota"}
                </span>
                <button
                  aria-label="Cerrar menu"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-[var(--mentora-muted)] transition hover:bg-[rgba(37,99,235,0.08)] hover:text-[var(--mentora-primary)]"
                  onClick={close}
                  type="button"
                >
                  <X size={15} />
                </button>
              </div>

              <label className="grid gap-1.5 text-xs font-extrabold text-[var(--mentora-muted)]">
                <span>{mode === "link" ? "Enlace" : "Nota"}</span>
                {mode === "link" ? (
                  <input
                    autoFocus
                    className="min-h-11 rounded-2xl border border-[rgba(37,99,235,0.14)] bg-white px-3 text-sm font-semibold text-[var(--mentora-text)] outline-none transition placeholder:text-slate-400 focus:border-[rgba(37,99,235,0.34)] focus:shadow-[var(--mentora-focus-ring)]"
                    onChange={(event) => setValue(event.target.value)}
                    placeholder="https://..."
                    value={value}
                  />
                ) : (
                  <textarea
                    autoFocus
                    className="min-h-28 resize-none rounded-2xl border border-[rgba(37,99,235,0.14)] bg-white px-3 py-2.5 text-sm font-semibold leading-6 text-[var(--mentora-text)] outline-none transition placeholder:text-slate-400 focus:border-[rgba(37,99,235,0.34)] focus:shadow-[var(--mentora-focus-ring)]"
                    onChange={(event) => setValue(event.target.value)}
                    placeholder="Escribe o pega tus apuntes..."
                    value={value}
                  />
                )}
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  className="min-h-10 rounded-2xl border border-[rgba(37,99,235,0.12)] bg-white text-xs font-black text-[var(--mentora-muted)] transition hover:bg-[#f7faff]"
                  onClick={() => {
                    setMode(null);
                    setValue("");
                  }}
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  className="min-h-10 rounded-2xl bg-[var(--mentora-primary)] text-xs font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-200 disabled:text-slate-500"
                  disabled={!value.trim()}
                  onClick={submitInline}
                  type="button"
                >
                  Guardar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <input
        ref={pdfRef}
        accept="application/pdf"
        aria-label="Seleccionar PDF"
        aria-hidden="true"
        className="hidden"
        disabled={disabled}
        onChange={(event) => {
          handleFiles(event.target.files, "pdf");
          event.currentTarget.value = "";
        }}
        tabIndex={-1}
        type="file"
      />
      <input
        ref={imageRef}
        accept="image/png,image/jpeg,image/webp"
        aria-label="Seleccionar imagen"
        aria-hidden="true"
        className="hidden"
        disabled={disabled}
        onChange={(event) => {
          handleFiles(event.target.files, "image");
          event.currentTarget.value = "";
        }}
        tabIndex={-1}
        type="file"
      />
      <input
        ref={documentRef}
        accept=".docx,.txt,.md,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        aria-label="Seleccionar documento"
        aria-hidden="true"
        className="hidden"
        disabled={disabled}
        onChange={(event) => {
          handleFiles(event.target.files, "document");
          event.currentTarget.value = "";
        }}
        tabIndex={-1}
        type="file"
      />
    </div>
  );
}

function MenuButton({
  disabled = false,
  icon,
  label,
  onClick,
}: {
  disabled?: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="grid min-h-11 grid-cols-[32px_minmax(0,1fr)] items-center gap-2 rounded-2xl border-0 bg-transparent px-2 text-left text-sm font-extrabold text-[var(--mentora-text)] transition hover:bg-[rgba(37,99,235,0.08)] hover:text-[var(--mentora-primary)] focus-visible:outline-none focus-visible:shadow-[var(--mentora-focus-ring)] disabled:cursor-not-allowed disabled:opacity-45"
      disabled={disabled}
      onClick={onClick}
      role="menuitem"
      type="button"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[rgba(37,99,235,0.08)] text-[var(--mentora-primary)]">
        {icon}
      </span>
      <span className="min-w-0 truncate">{label}</span>
    </button>
  );
}
