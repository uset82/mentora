import type { SupabaseClient } from "@supabase/supabase-js";
import { validateAndIntake } from "./agents/pdf-intake-agent";
import { readPdf } from "./agents/pdf-reader-agent";
import { chunkPages } from "./agents/pdf-chunking-agent";
import { embedAndStore } from "./agents/embedding-agent";
import { verifySource } from "./agents/source-verification-agent";
import { generateAndStoreSummary } from "./agents/summary-agent";
import { generateAndStoreDiagram } from "./agents/diagram-agent";
import { generateQuizAndFlashcards } from "./agents/quiz-agent";

// Sequential promise queue to guarantee single-job execution locally
let localJobQueue: Promise<void> = Promise.resolve();

export interface BackgroundWorkerOptions {
  service: SupabaseClient;
  tenantId: string;
  userId: string;
  studySpaceId: string;
  documentId: string;
  fileName: string;
  fileBuffer: Buffer;
}

/**
 * Queues a document processing job to be executed sequentially in the background.
 */
export function enqueueDocumentProcessing(options: BackgroundWorkerOptions) {
  localJobQueue = localJobQueue.then(() =>
    runJob(options).catch((err) => {
      console.error(`[Background Worker] Critical error processing document ${options.documentId}:`, err);
    })
  );
}

/**
 * Runs a single document processing job through all agent phases.
 */
async function runJob({
  service,
  tenantId,
  userId,
  studySpaceId,
  documentId,
  fileName,
  fileBuffer,
}: BackgroundWorkerOptions): Promise<void> {
  console.log(`[Background Worker] Starting job for document ${documentId} (${fileName})`);
  
  let jobId: string | null = null;

  try {
    // 1. Create a job record in the database
    const { data: job, error: jobError } = await service
      .from("document_processing_jobs")
      .insert({
        tenant_id: tenantId,
        study_space_id: studySpaceId,
        document_id: documentId,
        status: "processing",
        current_step: "reading_pdf",
        attempts: 1,
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (jobError || !job) {
      throw jobError ?? new Error("Failed to create document processing job record.");
    }
    jobId = job.id;

    // Helper to update progress status
    const updateProgress = async (step: string) => {
      console.log(`[Background Worker] Job ${documentId} progress: ${step}`);
      
      // Update job progress step
      await service
        .from("document_processing_jobs")
        .update({ current_step: step })
        .eq("id", jobId);
    };

    // --- AGENT 1: INTAKE & VALIDATION ---
    await updateProgress("intake_validating");
    const intakeResult = await validateAndIntake(fileBuffer, fileName);
    if (!intakeResult.ok) {
      throw new Error(intakeResult.error ?? "Failed PDF intake validation.");
    }

    // --- AGENT 2: PDF READER & EXTRACTOR ---
    await updateProgress("reading_pdf");
    const pages = await readPdf(fileBuffer, (progressMsg) => {
      console.log(`[Background Worker] [Reader Agent] ${progressMsg}`);
    });

    if (pages.length === 0) {
      throw new Error("No readable text or images found in the PDF.");
    }

    // --- AGENT 3: CHUNKING ---
    await updateProgress("chunking");
    const chunks = chunkPages(pages);
    if (chunks.length === 0) {
      throw new Error("Deduplicated chunks returned empty content.");
    }

    // --- AGENT 4: EMBEDDING & STORAGE ---
    await updateProgress("embedding");
    const storedChunkCount = await embedAndStore({
      service,
      documentId,
      studySpaceId,
      tenantId,
      chunks,
      onProgress: (progressMsg) => {
        console.log(`[Background Worker] [Embedding Agent] ${progressMsg}`);
      },
    });
    if (storedChunkCount <= 0) {
      throw new Error("No readable source chunks were stored for this document.");
    }

    await mergeDocumentMetadata(service, documentId, {
      chunk_count: storedChunkCount,
      extracted_chunk_count: chunks.length,
      generator_ready: true,
    });

    // --- AGENT 5: SOURCE VERIFICATION ---
    await updateProgress("verifying");
    const verifyResult = await verifySource(service, documentId, chunks);
    if (!verifyResult.isVerified) {
      console.warn(
        `[Background Worker] Source verification warnings for ${fileName}:`,
        verifyResult.warnings
      );
    }

    // Mark the source ready as soon as readable chunks exist. Pre-generated
    // study tools are useful extras, but they must not block Studio eligibility.
    await updateProgress("ready");
    await service
      .from("documents")
      .update({
        processing_status: "ready",
        error_message: null,
      })
      .eq("id", documentId);

    await service
      .from("document_processing_jobs")
      .update({
        status: "completed",
        current_step: "ready",
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    // --- AGENT 6: SUMMARIZATION ---
    try {
      await generateAndStoreSummary({
        service,
        tenantId,
        userId,
        studySpaceId,
        documentId,
        fileName,
        chunks,
        onProgress: (progressMsg) => {
          console.log(`[Background Worker] [Summary Agent] ${progressMsg}`);
        },
      });
    } catch (summaryErr) {
      console.error("[Background Worker] Summary generation failed (non-blocking):", summaryErr);
    }

    // --- AGENT 7: DIAGRAMS CONCEPT MAP ---
    await updateProgress("generating_diagrams");
    try {
      await generateAndStoreDiagram({
        service,
        documentId,
        fileName,
        chunks,
        onProgress: (progressMsg) => {
          console.log(`[Background Worker] [Diagram Agent] ${progressMsg}`);
        },
      });
    } catch (diagErr) {
      console.error("[Background Worker] Diagram generation failed (non-blocking):", diagErr);
      // Non-blocking: continue even if diagram generation failed
    }

    // --- AGENT 8: QUIZ & FLASHCARDS ---
    await updateProgress("generating_study_tools");
    try {
      await generateQuizAndFlashcards({
        service,
        tenantId,
        userId,
        studySpaceId,
        documentId,
        fileName,
        chunks,
        onProgress: (progressMsg) => {
          console.log(`[Background Worker] [Quiz Agent] ${progressMsg}`);
        },
      });
    } catch (quizErr) {
      console.error("[Background Worker] Quiz/Flashcards generation failed (non-blocking):", quizErr);
      // Non-blocking: continue even if study tools generation failed
    }

    // --- COMPLETE ---
    console.log(`[Background Worker] Job successfully completed for document ${documentId}`);

  } catch (error) {
    console.error(`[Background Worker] Job failed for document ${documentId}:`, error);
    const errorMessage = error instanceof Error ? error.message : "Unknown background worker error.";

    if (jobId) {
      await service
        .from("document_processing_jobs")
        .update({
          status: "failed",
          error_message: errorMessage,
          completed_at: new Date().toISOString(),
        })
        .eq("id", jobId);
    }

    await service
      .from("documents")
      .update({
        processing_status: "failed",
        error_message: errorMessage,
      })
      .eq("id", documentId);
  }
}

async function mergeDocumentMetadata(
  service: SupabaseClient,
  documentId: string,
  patch: Record<string, unknown>,
) {
  const { data } = await service
    .from("documents")
    .select("metadata")
    .eq("id", documentId)
    .single();

  const currentMetadata = isRecord(data?.metadata) ? data.metadata : {};
  await service
    .from("documents")
    .update({
      metadata: {
        ...currentMetadata,
        ...patch,
      },
    })
    .eq("id", documentId);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
