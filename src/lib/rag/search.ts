import type { SupabaseClient } from "@supabase/supabase-js";
import { embedTexts } from "@/lib/ai/gateway";
import type { Citation } from "@/lib/types";
import { SAFETY_LIMITS } from "@/lib/limits";

type MatchRow = {
  id: string;
  document_id: string;
  file_name: string;
  content: string;
  page_number: number | null;
  similarity: number;
};

type ReadyDocumentRow = {
  id: string;
  file_name: string;
};

type ChunkRow = {
  id: string;
  document_id: string;
  content: string;
  page_number: number | null;
};

export async function retrieveCitations({
  service,
  tenantId,
  studySpaceId,
  query,
  limit = SAFETY_LIMITS.MAX_CITATIONS_PER_ANSWER,
  selectedDocumentIds,
}: {
  service: SupabaseClient;
  tenantId: string;
  studySpaceId: string;
  query: string;
  limit?: number;
  selectedDocumentIds?: string[];
}): Promise<Citation[]> {
  try {
    return await withTimeout(
      doRetrieveCitations({ service, tenantId, studySpaceId, query, limit, selectedDocumentIds }),
      SAFETY_LIMITS.RAG_RETRIEVAL_TIMEOUT
    );
  } catch (error) {
    console.warn("[Mentora] RAG retrieval timed out or failed:", error);
    try {
      return await withTimeout(
        retrieveRecentReadyChunks({ service, tenantId, studySpaceId, limit, selectedDocumentIds }),
        Math.min(1500, SAFETY_LIMITS.RAG_RETRIEVAL_TIMEOUT)
      );
    } catch (fallbackError) {
      console.warn("[Mentora] Recent ready chunk fallback failed:", fallbackError);
      return [];
    }
  }
}

async function doRetrieveCitations({
  service,
  tenantId,
  studySpaceId,
  query,
  limit,
  selectedDocumentIds,
}: {
  service: SupabaseClient;
  tenantId: string;
  studySpaceId: string;
  query: string;
  limit: number;
  selectedDocumentIds?: string[];
}): Promise<Citation[]> {
  const [embedding] = await embedTexts([query]);
  const { data, error } = await service.rpc("match_document_chunks", {
    query_embedding: embedding,
    match_tenant_id: tenantId,
    match_study_space_id: studySpaceId,
    match_count: selectedDocumentIds?.length ? Math.max(limit * 6, limit) : limit,
  });

  if (error) {
    throw error;
  }

  const selectedIdSet = new Set(selectedDocumentIds ?? []);
  const semanticMatches = ((data ?? []) as MatchRow[])
    .filter((row) => selectedIdSet.size === 0 || selectedIdSet.has(row.document_id))
    .filter((row) => row.similarity >= 0.12)
    .map(rowToCitation)
    .slice(0, limit);

  if (semanticMatches.length > 0) {
    return semanticMatches;
  }

  return retrieveRecentReadyChunks({ service, tenantId, studySpaceId, limit, selectedDocumentIds });
}

function rowToCitation(row: MatchRow): Citation {
  return {
    chunkId: row.id,
    documentId: row.document_id,
    fileName: row.file_name ?? "Uploaded document",
    pageNumber: row.page_number,
    content: row.content.slice(0, SAFETY_LIMITS.MAX_CHARACTERS_PER_CITATION),
  };
}

async function retrieveRecentReadyChunks({
  service,
  tenantId,
  studySpaceId,
  limit,
  selectedDocumentIds,
}: {
  service: SupabaseClient;
  tenantId: string;
  studySpaceId: string;
  limit: number;
  selectedDocumentIds?: string[];
}): Promise<Citation[]> {
  let documentQuery = service
    .from("documents")
    .select("id, file_name")
    .eq("tenant_id", tenantId)
    .eq("study_space_id", studySpaceId)
    .eq("processing_status", "ready");

  if (selectedDocumentIds?.length) {
    documentQuery = documentQuery.in("id", selectedDocumentIds);
  }

  const { data: documents, error: documentError } = await documentQuery
    .order("created_at", { ascending: false })
    .limit(3);

  if (documentError) {
    throw documentError;
  }

  const readyDocuments = (documents ?? []) as ReadyDocumentRow[];
  if (readyDocuments.length === 0) {
    return [];
  }

  const targetCount = Math.max(limit, 10);
  const perDocumentLimit = Math.max(3, Math.ceil(targetCount / readyDocuments.length));
  const chunkGroups = await Promise.all(
    readyDocuments.map(async (document) => {
      const { data: chunks, error: chunkError } = await service
        .from("document_chunks")
        .select("id, document_id, content, page_number")
        .eq("tenant_id", tenantId)
        .eq("study_space_id", studySpaceId)
        .eq("document_id", document.id)
        .order("page_number", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true })
        .limit(perDocumentLimit);

      if (chunkError) {
        throw chunkError;
      }

      return ((chunks ?? []) as ChunkRow[]).map((chunk) => ({
        chunkId: chunk.id,
        documentId: chunk.document_id,
        fileName: document.file_name,
        pageNumber: chunk.page_number,
        content: chunk.content.slice(0, SAFETY_LIMITS.MAX_CHARACTERS_PER_CITATION),
      }));
    }),
  );

  return chunkGroups.flat().slice(0, targetCount);
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeout = setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms.`)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}
