"use client";

import { FileImage, FileText, Link2, NotebookPen, Paperclip, Plus } from "lucide-react";
import { useRef, useState } from "react";
import type { MaterialType } from "@/lib/types";

type UploadHandler = (file: File, materialType: MaterialType) => void;

export function AttachmentMenu({
  disabled,
  onAddLink,
  onCreateNote,
  onUpload,
}: {
  disabled: boolean;
  onAddLink?: (url: string) => void;
  onCreateNote?: (text: string) => void;
  onUpload?: UploadHandler;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"link" | "note" | null>(null);
  const [value, setValue] = useState("");
  const pdfRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const documentRef = useRef<HTMLInputElement>(null);

  function close() {
    setOpen(false);
    setMode(null);
    setValue("");
  }

  function handleFiles(fileList: FileList | null, materialType: MaterialType) {
    const file = fileList?.[0];
    if (file && onUpload) {
      onUpload(file, materialType);
      close();
    }
  }

  function submitInline() {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }
    if (mode === "link") {
      onAddLink?.(trimmed);
    }
    if (mode === "note") {
      onCreateNote?.(trimmed);
    }
    close();
  }

  return (
    <div className="attachment-menu">
      <button
        aria-expanded={open}
        aria-label="Agregar material"
        className="mentora-chat-attach"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <Plus size={18} />
      </button>

      {open && (
        <div className="attachment-menu-popover" role="menu">
          {!mode ? (
            <>
              <button onClick={() => pdfRef.current?.click()} role="menuitem" type="button">
                <FileText size={16} />
                <span>Subir PDF</span>
              </button>
              <button onClick={() => imageRef.current?.click()} role="menuitem" type="button">
                <FileImage size={16} />
                <span>Subir imagen</span>
              </button>
              <button onClick={() => documentRef.current?.click()} role="menuitem" type="button">
                <Paperclip size={16} />
                <span>Subir documento</span>
              </button>
              <button onClick={() => setMode("link")} role="menuitem" type="button">
                <Link2 size={16} />
                <span>Pegar enlace</span>
              </button>
              <button onClick={() => setMode("note")} role="menuitem" type="button">
                <NotebookPen size={16} />
                <span>Crear nota</span>
              </button>
            </>
          ) : (
            <div className="attachment-inline-form">
              <label>
                <span>{mode === "link" ? "Enlace" : "Nota"}</span>
                {mode === "link" ? (
                  <input
                    autoFocus
                    onChange={(event) => setValue(event.target.value)}
                    placeholder="https://..."
                    value={value}
                  />
                ) : (
                  <textarea
                    autoFocus
                    onChange={(event) => setValue(event.target.value)}
                    placeholder="Escribe o pega tus apuntes..."
                    rows={4}
                    value={value}
                  />
                )}
              </label>
              <div>
                <button onClick={() => setMode(null)} type="button">
                  Cancelar
                </button>
                <button disabled={!value.trim()} onClick={submitInline} type="button">
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
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          handleFiles(event.target.files, "pdf");
          event.currentTarget.value = "";
        }}
        type="file"
      />
      <input
        ref={imageRef}
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          handleFiles(event.target.files, "image");
          event.currentTarget.value = "";
        }}
        type="file"
      />
      <input
        ref={documentRef}
        accept=".docx,.txt,.md,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          handleFiles(event.target.files, "document");
          event.currentTarget.value = "";
        }}
        type="file"
      />
    </div>
  );
}
