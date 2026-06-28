"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { DocumentRecord, MaterialType } from "@/lib/types";
import { MaterialCard } from "./material-card";
import { MaterialEmptyState } from "./material-empty-state";
import { MaterialSearch } from "./material-search";
import { MaterialsHeader } from "./materials-header";
import { MaterialUploadMenu } from "./material-upload-menu";

export type MaterialsPanelProps = {
  busy: string | null;
  documents: DocumentRecord[];
  onAddLink: (url: string) => Promise<boolean> | boolean;
  onCreateNote: (text: string) => Promise<boolean> | boolean;
  onToggleMaterial: (documentId: string) => void;
  onUpload: (file: File, materialType: MaterialType) => Promise<boolean> | boolean;
  selectedMaterialIds: string[];
};

export function MaterialsPanel({
  busy,
  documents,
  onAddLink,
  onCreateNote,
  onToggleMaterial,
  onUpload,
  selectedMaterialIds,
}: MaterialsPanelProps) {
  const [query, setQuery] = useState("");
  const uploadBusy = busy === "upload";

  const filteredDocuments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return documents.filter((document) => {
      const matchesQuery = !normalizedQuery || document.file_name.toLowerCase().includes(normalizedQuery);
      return matchesQuery;
    });
  }, [documents, query]);

  return (
    <aside className="materials-glass-shell flex h-full min-h-0 flex-col overflow-hidden border-r border-slate-200 bg-white text-[var(--mentora-text)]">
      <div className="border-b border-slate-200 px-4 py-3">
        <MaterialsHeader />

        <div className="grid gap-3 pt-2">
          <MaterialUploadMenu
            align="left"
            disabled={uploadBusy}
            label="Agregar material"
            onAddLink={onAddLink}
            onCreateNote={onCreateNote}
            onUpload={onUpload}
            variant="bar"
          />
          <MaterialSearch onChange={setQuery} value={query} />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {documents.length === 0 ? (
          <MaterialEmptyState />
        ) : filteredDocuments.length > 0 ? (
          <div className="grid gap-1">
            {filteredDocuments.map((document) => (
              <MaterialCard
                key={document.id}
                document={document}
                onToggle={onToggleMaterial}
                selected={selectedMaterialIds.includes(document.id)}
              />
            ))}
          </div>
        ) : (
          <NoResults query={query} />
        )}
      </div>
    </aside>
  );
}

function NoResults({ query }: { query: string }) {
  return (
    <div className="grid min-h-[16rem] place-items-center px-6 text-center text-sm font-medium text-slate-500">
      <div className="grid max-w-[14rem] justify-items-center gap-2">
        <Search size={17} aria-hidden="true" />
        <p>No hay resultados.</p>
        {query.trim() && <p className="text-xs leading-5 text-slate-400">Prueba con otra búsqueda.</p>}
      </div>
    </div>
  );
}
