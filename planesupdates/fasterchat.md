
**Do not wait. Add the agent architecture now — but use it to move heavy PDF work out of the chat pipeline.**

The real problem is probably this:

```text
Student asks a question
  -> app talks to Supabase
  -> app searches PDF chunks
  -> app builds a large RAG prompt
  -> model starts late
  -> frontend receives huge streamed answer
  -> browser/PC gets overloaded
```

Your current plan already says the RAG/PDF communication is slow and that the app uses OpenRouter SDK. Also, the current chat route retrieves citations before creating the AI stream, so the user waits for Supabase/RAG work before the model starts answering. The same route uses `priority: "cost"` for tutor chat, which is not ideal for real-time speed.

Here is the corrected markdown section:

```markdown
---

# Emergency Fix — PDF Pipeline Is Too Heavy and Can Crash the PC

## Problem

The Mentora chatbox is not only slow. The current PDF/RAG pipeline can become so heavy that it freezes or crashes the local machine.

This means we must stop treating the problem as only a model-speed issue.

The real issue is probably a combination of:

- Heavy PDF processing.
- Slow Supabase communication.
- RAG retrieval before streaming starts.
- Too much PDF context being sent to the model.
- Too many chunks or citations.
- Too much work happening during chat time.
- Frontend rendering too many streamed updates.
- No background queue for heavy PDF jobs.
- No memory/concurrency limits.

Main rule:

```text
The chat route must not process heavy PDF work directly.
The chat route should only retrieve already-prepared knowledge.
```

---

# New Decision

Do not postpone agents.

Start the agent architecture now, but use it correctly:

```text
Agents should process PDFs in the background.
Agents should not all run during every chat message.
```

Correct architecture:

```text
PDF Upload
  -> Background Agent Pipeline
  -> Store clean chunks, summaries, diagrams, metadata, and citations in Supabase
  -> Mark document ready

Student Chat
  -> Fast retrieval from prepared data
  -> Stream answer immediately
```

Wrong architecture:

```text
Student Chat
  -> Read PDF
  -> OCR PDF
  -> Chunk PDF
  -> Summarize PDF
  -> Verify PDF
  -> Generate diagrams
  -> Then answer
```

That wrong architecture will make the app even slower and can crash the PC again.

---

# Phase 0 — Emergency Safety Limits

* [x] Add maximum PDF file size limit.

Recommended:

```text
Max PDF size: 20 MB for local/dev
Max PDF size: 50 MB for production after optimization
```

* [x] Add maximum page count limit.

Recommended:

```text
Max pages local/dev: 40 pages
Max pages production: 100 pages
```

* [x] Add maximum chunks per document.

Recommended:

```text
Max chunks per document: 300
```

* [x] Add maximum citations per chat request.

Recommended:

```text
Max citations per answer: 4 to 6
```

* [x] Add maximum citation text length.

Recommended:

```text
Max characters per citation: 800 to 1200
```

* [x] Add timeout for PDF processing.

Recommended:

```text
PDF processing timeout: 2 to 5 minutes
```

* [x] Add timeout for RAG retrieval.

Recommended:

```text
RAG retrieval timeout: 3 to 5 seconds
```

* [x] Add timeout for chat first token.

Recommended:

```text
First token timeout: 15 to 20 seconds
```

* [x] If any limit is exceeded, stop safely and show a friendly message.

Example:

```text
This PDF is too large to process on the current system. Please upload a smaller file or process it in background mode.
```

---

# Phase 1 — Stop Heavy PDF Work During Chat

## Goal

The chat should not read, parse, OCR, chunk, summarize, or fully analyze PDFs while the student is waiting for an answer.

* [x] Inspect the chat route.

```text
src/app/api/chat/route.ts
```

* [x] Confirm what work happens before `streamGroundedText`.
* [x] Move all heavy document processing out of `/api/chat`.
* [x] The chat route should only do:

```text
auth
parse message
light mode detection
optional fast retrieval
start model streaming
save message
log usage
```

* [x] The chat route should not do:

```text
PDF parsing
OCR
full document summary
full document verification
large diagram generation
full file read
large Supabase document scans
```

* [x] If a document is not ready, return quickly:

```text
Your PDF is still being processed. You can ask general questions now, or wait until the document is ready.
```

---

# Phase 2 — Add Background PDF Agent Pipeline Now

## Goal

Use agents immediately, but for background PDF processing.

Create this folder structure:

```text
src/lib/ai/agents/
  pdf-intake-agent.ts
  pdf-reader-agent.ts
  pdf-chunking-agent.ts
  embedding-agent.ts
  source-verification-agent.ts
  summary-agent.ts
  diagram-agent.ts
  quiz-agent.ts
  retrieval-agent.ts
  answer-agent.ts
  orchestrator-agent.ts
```

---

## Agent 1 — PDF Intake Agent

* [x] Validate PDF file.
* [x] Check file size.
* [x] Check page count if possible.
* [x] Store file metadata.
* [x] Create document record.
* [x] Set document status to `pending`.
* [x] Start background processing.

---

## Agent 2 — PDF Reader Agent

* [x] Extract text page by page.
* [x] Never load unnecessary full PDF data repeatedly.
* [x] Store extracted page text.
* [x] Detect scanned/empty pages.
* [x] Mark pages needing OCR.

Safety:

```text
Process pages in small batches.
Do not process all pages in unlimited parallel mode.
```

Recommended:

```text
Batch size: 3 to 5 pages
Concurrency: 1 to 2 jobs locally
```

---

## Agent 3 — OCR / Vision Agent

* [x] Run only on pages that need OCR.
* [x] Do not OCR every page by default.
* [x] Add per-page timeout.
* [x] Save OCR result.
* [x] Skip unreadable pages safely.

---

## Agent 4 — Chunking Agent

* [x] Split PDF content into semantic chunks.
* [x] Preserve page numbers.
* [x] Preserve headings.
* [x] Keep chunks small enough for fast retrieval.
* [x] Remove duplicated chunks.
* [x] Remove useless chunks.

Recommended:

```text
Chunk size: 500 to 900 tokens
Overlap: 80 to 120 tokens
```

---

## Agent 5 — Embedding Agent

* [x] Generate embeddings after chunking.
* [x] Process embeddings in batches.
* [x] Save embeddings to Supabase.
* [x] Mark failed chunks without crashing whole document.
* [x] Do not run embeddings during chat.

Recommended:

```text
Embedding batch size: 16 to 64 chunks
```

---

## Agent 6 — Source Verification Agent

* [x] Check if chunks are readable.
* [x] Check page numbers.
* [x] Detect duplicate or broken chunks.
* [x] Mark low-quality chunks.
* [x] Store quality score.

---

## Agent 7 — Summary Agent

* [x] Generate short summary.
* [x] Generate detailed summary.
* [x] Generate key concepts.
* [x] Generate glossary.
* [x] Store in `generated_artifacts`.

Important:

```text
When the user asks "summarize this PDF", use the stored summary first.
Do not summarize the whole PDF from zero every time.
```

---

## Agent 8 — Diagram Agent

* [x] Generate Mermaid concept map.
* [x] Generate flowchart if document has process structure.
* [x] Generate timeline if document has historical sequence.
* [x] Generate comparison table if document compares concepts.
* [x] Store diagram artifacts.

---

## Agent 9 — Quiz / Flashcard Agent

* [x] Generate flashcards.
* [x] Generate quizzes.
* [x] Generate exam questions.
* [x] Store artifacts.
* [x] Reuse existing Mentora quiz/flashcard system if available.

---

# Phase 3 — Add Job Queue / Background Worker

## Goal

The browser and local dev server should not crash because of PDF processing.

Recommended options:

```text
Option A: Supabase Edge Function
Option B: Vercel background/queue system
Option C: Inngest
Option D: Trigger.dev
Option E: Simple internal worker for MVP
```

For MVP:

* [x] Add a simple processing queue table in Supabase.

Example:

```sql
create table if not exists public.document_processing_jobs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  study_space_id uuid not null,
  document_id uuid not null,
  status text not null default 'pending',
  current_step text,
  error_message text,
  attempts integer not null default 0,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);
```

* [x] When PDF is uploaded, create one job.
* [x] Worker picks up pending jobs.
* [x] Worker processes one document at a time locally.
* [x] Worker updates progress after each agent.
* [x] If job fails, mark as `failed` instead of crashing the app.

Recommended local rule:

```text
Only process 1 PDF job at a time in local development.
```

---

# Phase 4 — Add Document Processing Status

## Goal

Students should see what Mentora is doing instead of the app freezing.

Add statuses:

```text
pending
reading_pdf
ocr_processing
chunking
embedding
verifying
summarizing
generating_diagrams
ready
failed
```

Tasks:

* [x] Add status field if missing.
* [x] Update status after every agent step.
* [x] Show status in the UI.
* [x] Disable PDF-grounded chat until status is `ready`.
* [x] Allow normal general chat while PDF is processing.

UI message:

```text
Your PDF is being processed. You can still use Fast Chat while Mentora prepares the document.
```

---

# Phase 5 — Make Chat Fast Again

## Goal

The chat should feel like ChatGPT.

* [x] Default chat mode should be `Fast Chat`.
* [x] Fast Chat should not call RAG.
* [x] PDF Tutor mode should call RAG only when document is ready.
* [x] Smart Agent mode should call tools only when necessary.

Chat modes:

```text
Fast Chat
PDF Tutor
Smart Agent
```

---

## Fast Chat

Runs:

```text
Answer Agent only
```

Does not run:

```text
RAG
PDF reading
OCR
summary generation
diagram generation
```

---

## PDF Tutor

Runs:

```text
Retrieval Agent -> Answer Agent
```

Does not run:

```text
PDF reading
OCR
full summarization from zero
```

---

## Smart Agent

Runs only needed agents:

```text
Orchestrator Agent
  -> Retrieval Agent if needed
  -> Verification Agent if needed
  -> Diagram Agent if needed
  -> Summary Agent if existing summary is missing
  -> Answer Agent
```

---

# Phase 6 — Add Agent Orchestrator

## Goal

The orchestrator decides what is needed instead of always running everything.

Create:

```text
src/lib/ai/agents/orchestrator-agent.ts
```

Responsibilities:

* [x] Detect if the question is general.
* [x] Detect if the question is about uploaded PDFs.
* [x] Detect if the user asks for summary.
* [x] Detect if the user asks for diagram.
* [x] Detect if the user asks for citations.
* [x] Decide which tools/agents to call.
* [x] Avoid unnecessary Supabase calls.
* [x] Avoid unnecessary model calls.

Routing examples:

```text
"Explain Newton's laws"
-> Answer Agent only

"Summarize this PDF"
-> Load stored summary if available
-> Otherwise Retrieval Agent + Summary Agent

"Make a diagram from my PDF"
-> Retrieval Agent + Diagram Agent

"Is this answer supported by the PDF?"
-> Retrieval Agent + Citation Verification Agent
```

---

# Phase 7 — Use Agents Without Making Chat Slower

Important rule:

```text
Agents must reduce runtime work, not increase it.
```

* [x] Agents that run after PDF upload:
  * [x] PDF Intake Agent
  * [x] PDF Reader Agent
  * [x] OCR Agent
  * [x] Chunking Agent
  * [x] Embedding Agent
  * [x] Source Verification Agent
  * [x] Summary Agent
  * [x] Diagram Agent
  * [x] Quiz Agent
* [x] Agents that may run during chat:
  * [x] Orchestrator Agent
  * [x] Retrieval Agent
  * [x] Answer Agent
  * [x] Optional Citation Verification Agent
* [x] Agents that must never run during normal chat:
  * [x] Full PDF Reader Agent
  * [x] Full OCR Agent
  * [x] Full Embedding Agent
  * [x] Full Summary Agent for entire document

---

# Phase 8 — Supabase Optimization

## Goal

Reduce slow communication with PDF data.

* [x] Measure Supabase query time.
* [x] Add timing logs around `retrieveCitations`.
* [x] Add timing logs around document chunk queries.
* [x] Ensure vector index exists.
* [x] Ensure filters use indexed columns:
  * [x] `tenant_id`
  * [x] `study_space_id`
  * [x] `document_id`
  * [x] `status`
* [x] Retrieve only top 4–6 chunks.
* [x] Do not retrieve full document text during chat.
* [x] Cache recent retrieval results.
* [x] Store precomputed document summaries.
* [x] Store precomputed diagram artifacts.

---

# Phase 9 — Crash Protection

* [x] Add try/catch around every PDF agent step.
* [x] Add per-step timeout.
* [x] Add memory-safe batching.
* [x] Add max concurrency.
* [x] Add max PDF size.
* [x] Add max page count.
* [x] Add failed-job recovery.
* [x] Add retry limit.

Recommended:

```text
Max retries per job: 2
After 2 failures: mark document failed
```

* [x] Do not retry forever.
* [x] Do not process multiple large PDFs at the same time locally.

---

# Phase 10 — OpenRouter Agent SDK Integration

Use this for smart orchestration, not heavy PDF work during chat.

GitHub:

```text
https://github.com/OpenRouterTeam/typescript-agent
```

Tasks:

* [x] Clone reference:

```bash
git clone --depth 1 https://github.com/OpenRouterTeam/typescript-agent.git references/openrouter-typescript-agent
```

* [x] Install SDK if selected:

```bash
npm install @openrouter/agent
```

* [x] Build `Smart Agent` mode.
* [x] Give it tools:
  * [x] `retrieveDocumentContext`
  * [x] `loadStoredSummary`
  * [x] `loadStoredDiagram`
  * [x] `verifyCitations`
  * [x] `generateStudyPlan`
* [x] Keep `Fast Chat` as default.
* [x] Benchmark speed before making Smart Agent default.

---

# Phase 11 — Google ADK as Worker Option

Use Google ADK if we want a serious multi-agent backend worker.

Important:

```text
Google ADK should run outside the Next.js app as a Python worker/service.
```

Use ADK for:

* [x] PDF processing workflow.
* [x] Multi-agent academic analysis.
* [x] Verification agent.
* [x] Diagram agent.
* [x] Study plan agent.
* [x] Quiz generation agent.

Do not use ADK directly inside every chat request until benchmarked.

Reason:

```text
ADK can be powerful, but if it is placed in the real-time chat path without caching, it can make the app even slower.
```

---

# Phase 12 — Benchmark Before and After

Measure before changing:

* [x] PDF upload time.
* [x] PDF processing time.
* [x] Time until document ready.
* [x] RAG retrieval time.
* [x] First token latency.
* [x] Full answer latency.
* [x] Browser memory usage.
* [x] CPU usage.
* [x] Whether PC freezes.

Measure after changes:

* [x] PDF upload time.
* [x] Background processing time.
* [x] Chat first-token latency.
* [x] PDF Tutor first-token latency.
* [x] Smart Agent first-token latency.
* [x] Browser memory usage.
* [x] CPU usage.
* [x] Whether PC remains stable.

Target:

```text
The PC must not freeze.
The chat must start streaming quickly.
PDF processing must happen in background.
The student must see processing status.
```

---

# Final Emergency Acceptance Criteria

* [x] Uploading a PDF does not crash the PC.
* [x] PDF processing runs in background.
* [x] Only one heavy local PDF job runs at a time.
* [x] Chat works while PDF is processing.
* [x] General chat does not call RAG.
* [x] PDF chat only works when document is ready.
* [x] RAG retrieval is timed and limited.
* [x] The model starts streaming faster.
* [x] Frontend streaming does not overload React.
* [x] Agents are used to organize work, not to make every chat request heavier.
* [x] Supabase calls are measured.
* [x] Large PDFs fail safely instead of crashing the app.
* [x] `npm run lint` passes.
* [x] `npm run typecheck` passes.
* [x] `npm run build` passes.

```

In simple terms: **yes, add agents now**, but make them work like a factory line. The PDF agents prepare the material first. Then the chat answers fast from prepared material instead of trying to process the whole PDF while the student is waiting.
```


```markdown
---

# GitHub Reference Projects Codex Must Study First

## Purpose

Before writing new code from scratch, Codex must inspect real GitHub projects that already solve similar problems:

- PDF RAG
- Supabase + pgvector document search
- Next.js AI chat
- OpenRouter streaming
- Agent orchestration
- Background jobs
- PDF extraction
- ChatGPT-like UI
- Tool-based agents

Important rule:

```text
Do not blindly copy entire repositories.
Study their architecture, identify useful patterns, and adapt only what fits Mentora.
```

Create a local reference folder:

```bash
mkdir references
```

Add it to `.gitignore`:

```bash
echo "references/" >> .gitignore
```

---

# Reference 1 — Supabase Next.js OpenAI Document Search

GitHub:

```text
https://github.com/supabase-community/nextjs-openai-doc-search
```

Clone:

```bash
git clone --depth 1 https://github.com/supabase-community/nextjs-openai-doc-search.git references/supabase-nextjs-openai-doc-search
```

Why this matters for Mentora:

This is the most relevant reference for Supabase + document search + embeddings.

Use it to study:

* [x] Supabase document storage.
* [x] Embedding generation.
* [x] pgvector search.
* [x] Document chunk retrieval.
* [x] RAG architecture.
* [x] How to separate document ingestion from chat.
* [x] How to structure SQL functions for vector search.

Codex instruction:

```text
Study this repository first for Supabase + pgvector RAG patterns. Compare it with Mentora’s current document_chunks, retrieveCitations, and Supabase communication. Adapt only the parts that improve PDF retrieval speed and stability.
```

---

# Reference 2 — OpenRouter AI SDK Provider

GitHub:

```text
https://github.com/OpenRouterTeam/ai-sdk-provider
```

Clone:

```bash
git clone --depth 1 https://github.com/OpenRouterTeam/ai-sdk-provider.git references/openrouter-ai-sdk-provider
```

Why this matters for Mentora:

Mentora already uses `@openrouter/ai-sdk-provider`.

Use it to study:

* [x] Correct `createOpenRouter` usage.
* [x] OpenRouter + Vercel AI SDK integration.
* [x] Streaming model responses.
* [x] Error handling.
* [x] Model selection.
* [x] Provider configuration.

Codex instruction:

```text
Use this repository to verify Mentora’s OpenRouter integration. Do not replace the current OpenRouter provider unless there is a proven performance reason. First optimize the existing OpenRouter/Vercel AI SDK pipeline.
```

---

# Reference 3 — OpenRouter TypeScript Agent SDK

GitHub:

```text
https://github.com/OpenRouterTeam/typescript-agent
```

Clone:

```bash
git clone --depth 1 https://github.com/OpenRouterTeam/typescript-agent.git references/openrouter-typescript-agent
```

Why this matters for Mentora:

This is the best first reference for adding agent behavior without leaving the TypeScript/Next.js stack.

Use it to study:

* [x] TypeScript agent architecture.
* [x] Tool calling.
* [x] Agent orchestration.
* [x] Streaming agent responses.
* [x] Multi-step workflows.
* [x] How to build an agent that can choose tools.

Codex instruction:

```text
Use this repository as the first agentic reference. Mentora is already a TypeScript app, so prefer this before introducing a separate Python ADK service. Build Smart Agent mode using tools like retrieveDocumentContext, loadStoredSummary, verifyCitations, and generateDiagram.
```

---

# Reference 4 — Vercel AI SDK

GitHub:

```text
https://github.com/vercel/ai
```

Clone:

```bash
git clone --depth 1 https://github.com/vercel/ai.git references/vercel-ai
```

Why this matters for Mentora:

Mentora uses the Vercel AI SDK for streaming.

Use it to study:

* [x] `streamText`.
* [x] AI streaming best practices.
* [x] Tool calling.
* [x] Provider abstraction.
* [x] Fast response streaming.
* [x] Token stream handling.
* [x] How to avoid blocking the UI.

Codex instruction:

```text
Use Vercel AI SDK patterns to improve Mentora’s fast chat path. The fast path must remain available even if Smart Agent mode is added.
```

---

# Reference 5 — Vercel Chatbot

GitHub:

```text
https://github.com/vercel/chatbot
```

Clone:

```bash
git clone --depth 1 https://github.com/vercel/chatbot.git references/vercel-chatbot
```

Why this matters for Mentora:

This is a strong production-style Next.js AI chatbot reference.

Use it to study:

* [x] Chat streaming architecture.
* [x] Message persistence.
* [x] AI SDK usage.
* [x] Frontend message rendering.
* [x] Chat history.
* [x] Model/provider handling.
* [x] User experience for long streaming messages.

Codex instruction:

```text
Use Vercel Chatbot as the production Next.js chat reference. Compare its chat route, streaming behavior, and frontend message updates with Mentora’s src/app/api/chat/route.ts and src/components/mentora-app.tsx.
```

---

# Reference 6 — Assistant UI

GitHub:

```text
https://github.com/assistant-ui/assistant-ui
```

Clone:

```bash
git clone --depth 1 https://github.com/assistant-ui/assistant-ui.git references/assistant-ui
```

Why this matters for Mentora:

Mentora should feel like a polished ChatGPT-style academic assistant.

Use it to study:

* [x] Chat thread UI.
* [x] Message bubble design.
* [x] Streaming message UX.
* [x] Loading state.
* [x] Retry/regenerate behavior.
* [x] Composer/input UX.
* [x] Accessibility.
* [x] Smooth chat rendering.

Codex instruction:

```text
Use assistant-ui as a UI/UX reference only. Do not fully migrate Mentora unless explicitly decided. Adapt useful patterns for smoother streaming, cleaner message layout, retry buttons, and better input behavior.
```

---

# Reference 7 — Chatbot UI

GitHub:

```text
https://github.com/mckaywrigley/chatbot-ui
```

Clone:

```bash
git clone --depth 1 https://github.com/mckaywrigley/chatbot-ui.git references/chatbot-ui
```

Why this matters for Mentora:

This is another useful ChatGPT-like UI reference.

Use it to study:

* [x] Chat sidebar.
* [x] Conversation history.
* [x] Prompt input layout.
* [x] User/assistant message formatting.
* [x] Model selector UX.
* [x] Settings UX.

Codex instruction:

```text
Use Chatbot UI as a secondary UI reference. Adapt only small compatible UX patterns. Do not replace Mentora’s current application structure.
```

---

# Reference 8 — LangGraph JS

GitHub:

```text
https://github.com/langchain-ai/langgraphjs
```

Clone:

```bash
git clone --depth 1 https://github.com/langchain-ai/langgraphjs.git references/langgraphjs
```

Why this matters for Mentora:

LangGraph JS is useful for understanding agent workflows, graph-based routing, and multi-step orchestration in TypeScript.

Use it to study:

* [x] Agent graph architecture.
* [x] Routing between agents.
* [x] State machines for AI workflows.
* [x] Tool-based decision flows.
* [x] Multi-step workflows.
* [x] How to avoid running unnecessary steps.

Codex instruction:

```text
Use LangGraph JS as an architecture reference for the Mentora Orchestrator Agent. Do not introduce LangGraph as a dependency unless clearly needed. First study its patterns for routing tasks between agents.
```

---

# Reference 9 — LangChain Next.js Template

GitHub:

```text
https://github.com/langchain-ai/langchain-nextjs-template
```

Clone:

```bash
git clone --depth 1 https://github.com/langchain-ai/langchain-nextjs-template.git references/langchain-nextjs-template
```

Why this matters for Mentora:

This provides Next.js AI app patterns that may help with RAG and chat routing.

Use it to study:

* [x] Next.js AI route patterns.
* [x] Streaming responses.
* [x] LangChain-style retrieval.
* [x] Tool usage.
* [x] Chat structure.
* [x] Server/client separation.

Codex instruction:

```text
Use this only as a reference for RAG/chat architecture. Do not rewrite Mentora into LangChain unless there is a clear reason. Mentora’s current Supabase/OpenRouter stack should remain the base.
```

---

# Reference 10 — Unstructured

GitHub:

```text
https://github.com/Unstructured-IO/unstructured
```

Clone:

```bash
git clone --depth 1 https://github.com/Unstructured-IO/unstructured.git references/unstructured
```

Why this matters for Mentora:

This is useful for understanding robust PDF/document extraction.

Use it to study:

* [x] PDF text extraction.
* [x] Document partitioning.
* [x] Table extraction ideas.
* [x] Handling scanned documents.
* [x] Separating document elements.
* [x] Avoiding weak chunks.

Codex instruction:

```text
Use Unstructured as a document-processing reference. Do not automatically add it as a dependency unless needed. First inspect how it separates PDF elements and think how similar logic can improve Mentora’s PDF Reader Agent and Chunking Agent.
```

---

# Reference 11 — Inngest

GitHub:

```text
https://github.com/inngest/inngest
```

Clone:

```bash
git clone --depth 1 https://github.com/inngest/inngest.git references/inngest
```

Why this matters for Mentora:

The current problem may come from heavy PDF work happening in the wrong place. Inngest is useful for background jobs and durable workflows.

Use it to study:

* [x] Background job architecture.
* [x] Durable function patterns.
* [x] Step-based workflows.
* [x] Retry behavior.
* [x] Long-running PDF processing.
* [x] How to avoid crashing the local app.

Codex instruction:

```text
Use Inngest as a reference for moving PDF processing into background jobs. Mentora should not process heavy PDFs inside the chat request. For MVP, a simpler internal queue may be enough, but study Inngest patterns before designing the queue.
```

---

# Reference 12 — Trigger.dev

GitHub:

```text
https://github.com/triggerdotdev/trigger.dev
```

Clone:

```bash
git clone --depth 1 https://github.com/triggerdotdev/trigger.dev.git references/trigger-dev
```

Why this matters for Mentora:

Trigger.dev is another reference for background tasks and long-running jobs.

Use it to study:

* [x] Long-running job handling.
* [x] Background task design.
* [x] Retry and failure handling.
* [x] Progress tracking.
* [x] PDF processing workflows.
* [x] How to keep the UI responsive.

Codex instruction:

```text
Use Trigger.dev as another background-job reference. Compare it with Inngest. Choose the simpler architecture for Mentora’s MVP.
```

---

# Reference 13 — Google ADK Python

GitHub:

```text
https://github.com/google/adk-python
```

Clone:

```bash
git clone --depth 1 https://github.com/google/adk-python.git references/google-adk-python
```

Why this matters for Mentora:

Google ADK can be useful for serious multi-agent PDF processing, but it should run as a separate Python worker/service.

Use it to study:

* [x] Python agent architecture.
* [x] `LlmAgent`.
* [x] Multi-agent orchestration.
* [x] Tools.
* [x] Sessions.
* [x] Agent runners.
* [x] Worker-style agent service.

Codex instruction:

```text
Use Google ADK as an optional Python worker architecture reference. Do not put ADK directly into the Next.js chat route. If used, ADK should process PDFs in the background or run as a separate internal service.
```

---

# Reference 14 — Google ADK Samples

GitHub:

```text
https://github.com/google/adk-samples
```

Clone:

```bash
git clone --depth 1 https://github.com/google/adk-samples.git references/google-adk-samples
```

Why this matters for Mentora:

These samples help design multi-agent workflows.

Use it to study:

* [x] Sub-agent design.
* [x] Agent teams.
* [x] Tool usage.
* [x] Workflow routing.
* [x] Multi-agent examples.
* [x] How agents communicate.

Codex instruction:

```text
Use Google ADK samples to design PDF Reader Agent, Verification Agent, Summary Agent, Diagram Agent, and Study Planner Agent. Keep ADK experimental until benchmarked.
```

---

# Reference 15 — LiteLLM

GitHub:

```text
https://github.com/BerriAI/litellm
```

Clone:

```bash
git clone --depth 1 https://github.com/BerriAI/litellm.git references/litellm
```

Why this matters for Mentora:

Google ADK can use LiteLLM to connect to OpenRouter models.

Use it to study:

* [x] OpenRouter model routing.
* [x] `openrouter/...` model prefix.
* [x] API base configuration.
* [x] Provider fallback.
* [x] Multi-provider model routing.
* [x] Error handling.

Codex instruction:

```text
Use LiteLLM only for the Google ADK worker experiment. Mentora’s main TypeScript chat path should continue using OpenRouter/Vercel AI SDK unless benchmarks prove another path is better.
```

---

# Reference 16 — MuscleAI ADK + OpenRouter Example

GitHub:

```text
https://github.com/mattia33011/MuscleAI
```

Clone:

```bash
git clone --depth 1 https://github.com/mattia33011/MuscleAI.git references/muscle-ai-adk-openrouter
```

Why this matters for Mentora:

This is a small example of ADK + OpenRouter multi-agent workflow.

Use it to study:

* [x] ADK + OpenRouter setup.
* [x] Multi-agent structure.
* [x] Specialized agents.
* [x] LiteLLM connection.
* [x] Agent team design.

Codex instruction:

```text
Use MuscleAI only as an experimental ADK + OpenRouter reference. Do not copy its domain logic. Study the agent-team structure and adapt the idea to academic PDF processing.
```

---

# Reference Search Commands for Codex

After cloning references, run these searches.

## Search for OpenRouter usage

```bash
grep -R "createOpenRouter\|OpenRouter\|openrouter" references -n --exclude-dir=node_modules --exclude-dir=.git
```

## Search for Vercel AI SDK streaming

```bash
grep -R "streamText\|useChat\|textStream\|toDataStreamResponse\|StreamingTextResponse" references -n --exclude-dir=node_modules --exclude-dir=.git
```

## Search for PDF processing

```bash
grep -R "pdf\|PDF\|pdf-parse\|partition_pdf\|extract" references -n --exclude-dir=node_modules --exclude-dir=.git
```

## Search for Supabase vector search

```bash
grep -R "pgvector\|match_documents\|embedding\|similarity\|document_chunks" references -n --exclude-dir=node_modules --exclude-dir=.git
```

## Search for background jobs

```bash
grep -R "queue\|job\|background\|retry\|workflow\|step.run" references -n --exclude-dir=node_modules --exclude-dir=.git
```

## Search for agent/tool patterns

```bash
grep -R "agent\|tool\|orchestrator\|workflow\|sub_agents" references -n --exclude-dir=node_modules --exclude-dir=.git
```

## Search for chat UI streaming

```bash
grep -R "setMessages\|delta\|append\|reload\|regenerate\|retry" references -n --exclude-dir=node_modules --exclude-dir=.git
```

---

# What Codex Should Reuse From These References

## From Supabase Document Search

* [x] pgvector query design.
* [x] Document chunk retrieval.
* [x] Embedding storage pattern.
* [x] SQL function ideas.
* [x] RAG separation from chat.

## From OpenRouter AI SDK Provider

* [x] Correct OpenRouter provider usage.
* [x] Streaming model calls.
* [x] Model configuration.
* [x] Provider errors.

## From OpenRouter TypeScript Agent

* [x] Smart Agent mode.
* [x] Tool calling.
* [x] Agent orchestration.
* [x] TypeScript-native agent design.

## From Vercel AI SDK

* [x] Fast streaming.
* [x] Token stream handling.
* [x] Tool calls.
* [x] Provider abstraction.

## From Vercel Chatbot / Assistant UI / Chatbot UI

* [x] ChatGPT-style UI.
* [x] Smoother message rendering.
* [x] Retry/regenerate behavior.
* [x] Better input UX.
* [x] Model selector UX.

## From Inngest / Trigger.dev

* [x] Background PDF processing.
* [x] Durable jobs.
* [x] Retry limits.
* [x] Step-based workflows.
* [x] Progress tracking.

## From Unstructured

* [x] Better PDF parsing ideas.
* [x] Document element separation.
* [x] Table/diagram extraction ideas.
* [x] Cleaner chunking strategy.

## From Google ADK / LiteLLM

* [x] Optional multi-agent Python worker.
* [x] PDF processing agent teams.
* [x] Agent routing.
* [x] OpenRouter through LiteLLM.

---

# Codex Master Instruction

```text
Before implementing new code, inspect the GitHub reference repositories inside the references/ folder.

Do not build everything from scratch.

Primary references:
1. supabase-community/nextjs-openai-doc-search
2. OpenRouterTeam/ai-sdk-provider
3. OpenRouterTeam/typescript-agent
4. vercel/ai
5. vercel/chatbot
6. assistant-ui/assistant-ui

Secondary references:
7. mckaywrigley/chatbot-ui
8. langchain-ai/langgraphjs
9. langchain-ai/langchain-nextjs-template
10. Unstructured-IO/unstructured
11. inngest/inngest
12. triggerdotdev/trigger.dev
13. google/adk-python
14. google/adk-samples
15. BerriAI/litellm
16. mattia33011/MuscleAI

Implementation priority:
1. Stop heavy PDF work from happening during chat.
2. Move PDF processing into background jobs.
3. Add safety limits so PDFs cannot crash the PC.
4. Optimize Supabase RAG retrieval.
5. Keep Fast Chat as the default.
6. Add Smart Agent mode using OpenRouter TypeScript Agent SDK.
7. Use Google ADK only as a separate worker experiment if needed.

Do not remove:
- Supabase auth
- Study spaces
- Documents
- Document chunks
- Conversations
- Messages
- Citations
- AI usage logs
- Existing OpenRouter/Vercel AI SDK fast chat pipeline

The goal is not to rewrite Mentora.
The goal is to stabilize and accelerate Mentora by reusing proven patterns.
```

---

```

Small note: I would put **Supabase document search + OpenRouter AI SDK + Vercel AI SDK** as the first references Codex studies. Then use **Inngest/Trigger.dev** to solve the crash problem by moving PDF work into a background pipeline.
```
