import type { SupabaseClient } from "@supabase/supabase-js";
import { retrieveRelevantContext } from "./retrieval-agent";
import type { Citation } from "@/lib/types";

export type ChatIntent = "general" | "summary" | "diagram" | "rag_qa";

export interface OrchestrationResult {
  intent: ChatIntent;
  citations: Citation[];
  contentStream?: string;
  precomputedText?: string;
}

/**
 * Detects intent using fast regex heuristics
 */
export function classifyIntent(message: string): ChatIntent {
  const normalized = message.toLowerCase().trim();
  const normalizedAscii = normalized.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Short greetings or small talk
  if (/^(hola|hi|hello|hey|buenos dias|buenas tardes|buenas noches|gracias|thank you|thanks|bye|adios)$/i.test(normalized)) {
    return "general";
  }

  // Summary intent detection
  if (
    /\b(resumen|resumir|sintetiza|sintetizar|resuma|summary|summarize|summarise|overview|key points|puntos clave|thesis|tesis)\b/i.test(
      normalized
    )
    || /\b(de que se trata|sobre que trata|tema principal|idea principal|main idea|what(?:'s| is).+about)\b/i.test(normalizedAscii)
  ) {
    return "summary";
  }

  // Diagram intent detection
  if (
    /\b(diagrama|mapa|esquema|flujo|organizador|diagram|mind\s*map|flowchart|concept\s*map|chart|graph)\b/i.test(
      normalized
    )
  ) {
    return "diagram";
  }

  return "rag_qa";
}

function isDocumentQuestion(message: string) {
  const normalized = message
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  return /\b(pdf|documento|document|archivo|file|material|apuntes|notes|fuente|source|lectura|reading|texto|text)\b/.test(
    normalized,
  );
}

function localizedMessage(locale: "es" | "en", es: string, en: string) {
  return locale === "es" ? es : en;
}

/**
 * Orchestrator Agent
 * Routes the query depending on intent. Retrieves precomputed summary/diagram artifacts
 * from Supabase to avoid runtime LLM calls, or coordinates retrieval for document QA.
 */
export async function orchestrateChat({
  service,
  tenantId,
  studySpaceId,
  message,
  mode,
  locale,
}: {
  service: SupabaseClient;
  tenantId: string;
  studySpaceId: string;
  message: string;
  mode: "fast" | "tutor" | "agent";
  locale: "es" | "en";
}): Promise<OrchestrationResult> {
  const documentQuestion = isDocumentQuestion(message);

  // Fast Chat should stay fast for general messages, but questions that explicitly
  // mention the uploaded PDF/material should still use available document context.
  if (mode === "fast" && !documentQuestion) {
    return { intent: "general", citations: [] };
  }

  // Retrieve space documents to verify status
  const { data: documents } = await service
    .from("documents")
    .select("id, file_name, processing_status, metadata")
    .eq("study_space_id", studySpaceId);

  const allDocuments = documents ?? [];
  const readyDocuments = allDocuments.filter((d) => d.processing_status === "ready");

  // If the user asked about their PDF, do not let the general prompt claim there
  // is no uploaded material. Return the true document state instead.
  if (readyDocuments.length === 0) {
    if (documentQuestion && allDocuments.length > 0) {
      return {
        intent: "rag_qa",
        citations: [],
        precomputedText: localizedMessage(
          locale,
          "Tu PDF todavia se esta preparando. Cuando el estado cambie a Fuentes listas, podre responder sobre su contenido con citas. Mientras tanto puedes hacer preguntas generales.",
          "Your PDF is still being prepared. Once it changes to Sources ready, I can answer about its content with citations. In the meantime, you can ask general questions.",
        ),
      };
    }

    if (documentQuestion) {
      return {
        intent: "rag_qa",
        citations: [],
        precomputedText: localizedMessage(
          locale,
          "No encuentro un PDF en este espacio de estudio. Sube un PDF primero y espera a que aparezca como fuente lista.",
          "I cannot find a PDF in this study space. Upload a PDF first and wait until it appears as a ready source.",
        ),
      };
    }

    return { intent: "general", citations: [] };
  }

  const intent = classifyIntent(message);

  // Intent 1: Precomputed Summary
  if (intent === "summary") {
    // Check if we have a summary artifact in generated_artifacts
    const { data: summaryArtifact } = await service
      .from("generated_artifacts")
      .select("content, citations")
      .eq("study_space_id", studySpaceId)
      .eq("kind", "apa_summary")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (summaryArtifact) {
      console.log("[Orchestrator Agent] Found precomputed summary artifact. Returning instantly.");
      return {
        intent: "summary",
        citations: (summaryArtifact.citations ?? []) as Citation[],
        precomputedText: summaryArtifact.content,
      };
    }
  }

  // Intent 2: Precomputed Diagram
  if (intent === "diagram") {
    interface DocumentMetadata {
      precomputed_diagram?: string;
    }
    // Look for the precomputed diagram in document metadata
    const docWithDiagram = readyDocuments.find((d) => {
      const meta = d.metadata as DocumentMetadata | null;
      return meta && typeof meta === "object" && meta.precomputed_diagram;
    });
    if (docWithDiagram) {
      console.log("[Orchestrator Agent] Found precomputed diagram in document metadata. Returning instantly.");
      const meta = docWithDiagram.metadata as DocumentMetadata;
      const mermaidCode = meta.precomputed_diagram ?? "";
      const formattedResponse = 
        `Aquí tienes el diagrama conceptual del documento **${docWithDiagram.file_name}**:\n\n` +
        `\`\`\`mermaid\n${mermaidCode}\n\`\`\`\n\nPuedes usar este mapa para visualizar las relaciones clave del tema.`;
      
      return {
        intent: "diagram",
        citations: [],
        precomputedText: formattedResponse,
      };
    }
  }

  // Intent 3: Grounded PDF QA
  if (intent === "rag_qa" || mode === "tutor") {
    const citations = await retrieveRelevantContext({
      service,
      tenantId,
      studySpaceId,
      query: message,
    });

    // If retrieval failed even though ready documents exist, explain the retrieval issue
    // instead of sending the user to a general prompt that says it cannot access PDFs.
    if (citations.length === 0) {
      console.log("[Orchestrator Agent] Ready documents exist, but no document context was retrieved.");
      return {
        intent: "rag_qa",
        citations: [],
        precomputedText: localizedMessage(
          locale,
          "Veo que hay un PDF listo, pero no pude recuperar fragmentos legibles para responder esta pregunta. Intenta reformularla o vuelve a subir un PDF con texto seleccionable.",
          "I can see a ready PDF, but I could not retrieve readable excerpts for this question. Try rephrasing it or upload a text-based PDF.",
        ),
      };
    }

    return { intent: "rag_qa", citations };
  }

  return { intent: "general", citations: [] };
}
