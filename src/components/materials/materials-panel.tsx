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
  onDeleteDocument: (documentId: string) => Promise<boolean> | boolean;
  onToggleMaterial: (documentId: string) => void;
  onUpload: (file: File, materialType: MaterialType) => Promise<boolean> | boolean;
  selectedMaterialIds: string[];
};

export function MaterialsPanel({
  busy,
  documents,
  onAddLink,
  onCreateNote,
  onDeleteDocument,
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
    <aside className="notebook-panel notebook-sources-panel flex h-full min-h-0 flex-col overflow-hidden text-[var(--nb-text)]">
      <div className="notebook-panel-header px-5 py-4">
        <MaterialsHeader />

        <div className="grid gap-3 pt-2">
          <MaterialUploadMenu
            align="left"
            disabled={uploadBusy}
            label="Add sources"
            onAddLink={onAddLink}
            onCreateNote={onCreateNote}
            onUpload={onUpload}
            variant="bar"
          />
          <MaterialSearch onChange={setQuery} value={query} />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {documents.length === 0 ? (
          <MaterialEmptyState />
        ) : filteredDocuments.length > 0 ? (
          <div className="grid gap-2">
            {filteredDocuments.map((document) => (
              <MaterialCard
                key={document.id}
                document={document}
                deleting={busy === "delete-material"}
                onDelete={onDeleteDocument}
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
    <div className="notebook-empty-state grid min-h-[16rem] place-items-center px-6 text-center text-sm font-medium">
      <div className="grid max-w-[14rem] justify-items-center gap-2">
        <Search size={17} aria-hidden="true" />
        <p>No hay resultados.</p>
        {query.trim() && <p className="text-xs leading-5">Prueba con otra busqueda.</p>}
      </div>
    </div>
  );
}
