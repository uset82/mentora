import { retrieveCitations } from "@/lib/rag/search";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Citation } from "@/lib/types";

export interface RetrievalOptions {
  service: SupabaseClient;
  tenantId: string;
  studySpaceId: string;
  query: string;
  selectedDocumentIds?: string[];
}

/**
 * Retrieval Agent
 * Performs semantic vector search on document chunks in Supabase using the query embedding.
 * Automatically handles timeout racing and returns an empty list under latency spikes.
 */
export async function retrieveRelevantContext({
  service,
  tenantId,
  studySpaceId,
  query,
  selectedDocumentIds,
}: RetrievalOptions): Promise<Citation[]> {
  const start = Date.now();
  console.log(`[Retrieval Agent] Querying semantic context for: "${query.substring(0, 60)}..."`);

  try {
    const citations = await retrieveCitations({
      service,
      tenantId,
      studySpaceId,
      query,
      selectedDocumentIds,
    });

    const elapsed = Date.now() - start;
    console.log(
      `[Retrieval Agent] Completed vector retrieval in ${elapsed}ms. Retrieved ${citations.length} citations.`
    );
    return citations;
  } catch (error) {
    console.error(`[Retrieval Agent] Failed or timed out in ${Date.now() - start}ms:`, error);
    return [];
  }
}
