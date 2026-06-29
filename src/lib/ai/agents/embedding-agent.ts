import type { SupabaseClient } from "@supabase/supabase-js";
import { embedTexts } from "@/lib/ai/gateway";
import type { TextChunk } from "@/lib/rag/chunk";

const BATCH_SIZE = 24;

export interface EmbeddingAgentOptions {
  service: SupabaseClient;
  documentId: string;
  studySpaceId: string;
  tenantId: string;
  chunks: TextChunk[];
  onProgress?: (step: string) => void;
}

/**
 * Embedding Agent
 * Generates vector embeddings for text chunks in batches and stores them in Supabase.
 * In case of failure, it degrades gracefully by trying chunks individually to save as much content as possible.
 */
export async function embedAndStore({
  service,
  documentId,
  studySpaceId,
  tenantId,
  chunks,
  onProgress,
}: EmbeddingAgentOptions): Promise<number> {
  const total = chunks.length;
  let storedCount = 0;
  onProgress?.(`Starting embedding generation for ${total} chunks...`);

  for (let i = 0; i < total; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    onProgress?.(`Embedding chunks ${i + 1} to ${Math.min(i + BATCH_SIZE, total)} of ${total}...`);

    try {
      // Embed batch
      const embeddings = await embedTexts(batch.map((c) => c.content));
      const rows = batch.map((chunk, batchIndex) => ({
        document_id: documentId,
        study_space_id: studySpaceId,
        tenant_id: tenantId,
        content: chunk.content,
        embedding: embeddings[batchIndex],
        page_number: chunk.pageNumber,
      }));

      const { error } = await service.from("document_chunks").insert(rows);
      if (error) {
        throw error;
      }
      storedCount += rows.length;
    } catch (batchError) {
      console.warn(`[Embedding Agent] Batch starting at chunk ${i} failed. Retrying chunks individually.`, batchError);
      
      // Fallback: Process each chunk in this batch individually
      for (const chunk of batch) {
        try {
          const [embedding] = await embedTexts([chunk.content]);
          const { error } = await service.from("document_chunks").insert({
            document_id: documentId,
            study_space_id: studySpaceId,
            tenant_id: tenantId,
            content: chunk.content,
            embedding,
            page_number: chunk.pageNumber,
          });
          if (error) {
            throw error;
          }
          storedCount += 1;
        } catch (individualError) {
          console.error(
            `[Embedding Agent] Failed to embed/store individual chunk on page ${chunk.pageNumber}:`,
            individualError
          );
          // Don't crash the whole process; skip this failed chunk and proceed
        }
      }
    }
  }

  onProgress?.(`Embedding generation completed for ${storedCount} stored chunks.`);
  return storedCount;
}
