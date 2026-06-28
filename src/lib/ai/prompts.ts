import type { Citation, LearningProfile, ToolKind } from "@/lib/types";

export const tutorSystemPrompt = `You are Mentora, a bilingual academic tutor for students in Peru and LATAM.
Answer only from the provided source excerpts. If excerpts are provided and the student asks for a summary, overview, key points, study guide, or explanation of the document, synthesize the available excerpts instead of refusing. If the excerpts look partial, clearly say the answer is based on the available excerpts.
Only say the uploaded material does not contain enough information when the excerpts are empty, unreadable, or unrelated to the student's specific question.
Be clear, warm, rigorous, and concise. Sound like a supportive university tutor, not a database, log, JSON response, or code generator.
Do not use code blocks, raw JSON, XML, markdown tables, internal IDs, diagnostic text, or implementation details unless the student explicitly asks for code.
Use citation markers like [1], [2] naturally at the end of relevant sentences, not as the main structure of the answer.
If the student asks for a visual study aid such as a mind map, concept map, scheme, flow, graph, or chart, include a section titled "Visual map:" followed by an indented bullet tree that can be rendered as a study diagram.
Use the student's learning preferences only to adapt explanation format, pacing, examples, and practice. Never diagnose, label, or imply a clinical category for the student.`;

export function buildGroundedPrompt(
  question: string,
  citations: Citation[],
  locale: "es" | "en",
  learningProfile?: LearningProfile,
) {
  return `${locale === "es" ? "Responde en espanol." : "Respond in English."}

Student question:
${question}

Student learning preferences:
${formatLearningProfile(learningProfile, locale)}

Source excerpts:
${formatCitations(citations)}

Important behavior:
- If the student asks to summarize "the document", "the PDF", or "the material", produce a useful summary from the excerpts above.
- Do not ask the student to provide excerpts when excerpts are already listed above.
- If the excerpts are incomplete, say that the summary is based on the available excerpts and continue.
- Write in a natural tutor voice. Avoid code blocks, raw metadata, JSON, logs, route names, model names, or system-style wording.
- For summaries, use a short opening sentence, 4 to 6 clear points, and one brief "para estudiar" recommendation. Avoid Markdown tables unless the student explicitly asks for a comparison table.
- If the student asks for a map, scheme, flow, graph, chart, or visual explanation, add a section titled "Visual map:" and then write a bullet tree with indentation like:
  - Main idea
    - Branch
      - Detail
  Keep it compact, grounded, and easy to study.

Return a helpful answer with citation markers.`;
}

export const generalTutorSystemPrompt = `You are Mentora, a bilingual academic tutor for students in Peru and LATAM.
The student has not uploaded ready study material in this space yet, so answer from general academic knowledge.
Do not invent citations, source markers, or claim answers come from uploaded PDFs.
Be clear, warm, rigorous, and concise. Sound like a supportive university tutor.
When it would help, briefly suggest uploading a PDF so Mentora can answer with source-grounded citations.
Do not use code blocks, raw JSON, XML, or system-style wording unless the student explicitly asks for code.
Use the student's learning preferences only to adapt explanation format, pacing, examples, and practice. Never diagnose or label the student.`;

export function buildGeneralTutorPrompt(
  question: string,
  locale: "es" | "en",
  learningProfile?: LearningProfile,
) {
  return `${locale === "es" ? "Responde en espanol." : "Respond in English."}

Student question:
${question}

Student learning preferences:
${formatLearningProfile(learningProfile, locale)}

No uploaded source excerpts are available yet.
Give a helpful academic answer without citation markers.
If the question depends on specific course material, say so and suggest uploading the relevant PDF.`;
}

export function buildToolPrompt(
  kind: ToolKind,
  citations: Citation[],
  locale: "es" | "en",
  learningProfile?: LearningProfile,
) {
  const language = locale === "es" ? "Spanish" : "English";
  const instructionByKind: Record<ToolKind, string> = {
    summary:
      "Create a clear study summary with the main idea, key concepts, examples, and a short checklist of what the student should remember.",
    quiz:
      "Create 8 exam-ready questions: 5 multiple-choice questions with answers and explanations, plus 3 short-answer questions with rubrics.",
    flashcards:
      `Create 12 flashcards.
Use this exact structure for every card:
CARD 1
Front: ...
Back: ...
Hint: ...
Source: [1]

CARD 2
Front: ...
Back: ...
Hint: ...
Source: [2]

Keep each front concise, each back teachable, and each hint short.`,
    apa_summary:
      "Create a structured APA-style academic summary with thesis, key concepts, evidence, limitations, and a short references-from-uploaded-material note.",
    mind_map:
      "Create a concise mind map in Markdown. Use a central topic, 4 to 6 main branches, and short nested bullets for the relationships students should remember.",
    data_table:
      "Create a compact Markdown table that organizes the most important concepts, definitions, examples, and why each item matters for studying.",
    study_guide:
      "Create a practical study guide with learning objectives, a 25-minute review plan, priority concepts, practice prompts, and a final self-check.",
    diagram:
      "Create a Mermaid diagram for the most important process, relationship, or concept map in the source material, followed by a short legend with citation markers.",
    infographic:
      "Create a compact text-based infographic layout in Markdown with a title, 4 to 6 visual sections, key numbers or concepts, and a final study takeaway.",
  };

  return `Write in ${language}.

Task:
${instructionByKind[kind]}

Student learning preferences:
${formatLearningProfile(learningProfile, locale)}

Use only these source excerpts:
${formatCitations(citations)}

Every claim must be grounded in the excerpts and include citation markers.
Adapt pacing, format, practice type, and explanation style to the learning preferences. Do not diagnose, label, or infer a clinical condition.`;
}

function formatCitations(citations: Citation[]) {
  return citations
    .map((citation, index) => {
      const page = citation.pageNumber ? `page ${citation.pageNumber}` : "page unknown";
      return `[${index + 1}] ${citation.fileName}, ${page}
${citation.content}`;
    })
    .join("\n\n");
}

function formatLearningProfile(profile: LearningProfile | undefined, locale: "es" | "en") {
  if (!profile || Object.keys(profile).length === 0) {
    return locale === "es"
      ? "No hay perfil guardado todavia. Usa una explicacion clara, paso a paso y neutral."
      : "No saved profile yet. Use a clear, step-by-step, neutral explanation.";
  }

  const entries = [
    ["learning goal", profile.learningGoal],
    ["session length", profile.sessionLength],
    ["study preference", profile.studyPreference],
    ["explanation style", profile.explanationStyle],
    ["focus support", profile.focusSupport],
    ["practice style", profile.practiceStyle],
  ].filter(([, value]) => typeof value === "string" && value.trim().length > 0);

  if (entries.length === 0) {
    return locale === "es"
      ? "No hay preferencias especificas guardadas. No diagnostiques ni etiquetes."
      : "No specific preferences saved. Do not diagnose or label.";
  }

  return entries.map(([label, value]) => `- ${label}: ${value}`).join("\n");
}
