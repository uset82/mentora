
```markdown
# GitHub Reference Repositories for Mentora Chat Upgrade

## Purpose

Use these repositories as technical references for improving Mentora’s chatbox, message formatting, Markdown rendering, tables, code blocks, diagrams, and production-grade chat UX.

Important rule:

- Do not blindly copy entire projects.
- Study the structure, components, and patterns.
- Reuse ideas, architecture, and small compatible patterns.
- Check licenses before copying code directly.
- Keep Mentora’s current stack: Next.js, React, TypeScript, Supabase, OpenAI/OpenRouter, RAG, and custom study spaces.

---

## Work Discipline Instructions

- [x] Mark each checkbox immediately after completing its corresponding task, so progress can be tracked clearly.
- [x] Do not jump back and forth between different phases.
- [x] Work in an organized and sequential way.
- [x] Complete one phase fully before moving to the next phase.
- [x] If a task cannot be completed, leave it unchecked and add a short note explaining why.

# Phase X — Clone Reference Projects Locally

- [x] Create a local references folder.

```bash
mkdir references
```

* [x] Add `references/` to `.gitignore` so these projects are not committed.

```bash
echo "references/" >> .gitignore
```

---

## 1. assistant-ui — Best reference for modern AI chat UX

GitHub:

```text
https://github.com/assistant-ui/assistant-ui
```

Clone:

```bash
git clone --depth 1 https://github.com/assistant-ui/assistant-ui.git references/assistant-ui
```

Use it to study:

* [x] Modern AI chat interface
* [x] Message bubbles
* [x] Thread layout
* [x] Streaming message UX
* [x] Retry/regenerate patterns
* [x] Markdown rendering
* [x] Attachment patterns
* [x] Keyboard shortcuts
* [x] Accessibility
* [x] Clean React component architecture

Codex instruction:

```text
Study assistant-ui as the main UI/UX reference for Mentora’s chat interface. Do not fully migrate Mentora to assistant-ui yet. Instead, extract compatible design ideas for message layout, streaming state, retry UX, and clean chat component structure.
```

---

## 2. Vercel Chatbot — Best reference for Next.js + AI SDK architecture

GitHub:

```text
https://github.com/vercel/chatbot
```

Clone:

```bash
git clone --depth 1 https://github.com/vercel/chatbot.git references/vercel-chatbot
```

Use it to study:

* [x] Next.js AI chatbot architecture
* [x] AI SDK streaming
* [x] Model provider switching
* [x] Chat persistence
* [x] Message rendering
* [x] Artifacts
* [x] File/message organization
* [x] Production deployment patterns

Codex instruction:

```text
Study Vercel Chatbot as the main architecture reference for a production Next.js AI chatbot. Compare its streaming, message persistence, and component organization with Mentora’s current /api/chat route and MentoraApp component. Adapt only what fits Mentora’s Supabase and RAG architecture.
```

---

## 3. Chatbot UI — Reference for complete open-source chat product UX

GitHub:

```text
https://github.com/mckaywrigley/chatbot-ui
```

Clone:

```bash
git clone --depth 1 https://github.com/mckaywrigley/chatbot-ui.git references/chatbot-ui
```

Use it to study:

* [x] Conversation list
* [x] Chat history
* [x] Message formatting
* [x] Prompt input UX
* [x] Settings/model selection UX
* [x] Clean user/assistant message layout

Codex instruction:

```text
Use Chatbot UI as an additional UX reference for chat history, sidebar conversations, message layout, and prompt input behavior. Do not replace Mentora’s app structure. Only adapt useful patterns.
```

---

## 4. react-markdown — Reference for Markdown rendering in React

GitHub:

```text
https://github.com/remarkjs/react-markdown
```

Clone:

```bash
git clone --depth 1 https://github.com/remarkjs/react-markdown.git references/react-markdown
```

Install in Mentora:

```bash
npm install react-markdown remark-gfm rehype-sanitize
```

Use it to implement:

* [x] Markdown headings
* [x] Bullet lists
* [x] Numbered lists
* [x] Tables
* [x] Inline code
* [x] Code blocks
* [x] Links
* [x] Safe rendering

Codex instruction:

```text
Use react-markdown with remark-gfm and rehype-sanitize to replace or improve Mentora’s current custom RichChatContent renderer. The goal is to support clean Markdown, tables, and code blocks safely.
```

---

## 5. Mermaid — Reference for diagrams generated from AI responses

GitHub:

```text
https://github.com/mermaid-js/mermaid
```

Clone:

```bash
git clone --depth 1 https://github.com/mermaid-js/mermaid.git references/mermaid
```

Install in Mentora:

```bash
npm install mermaid
```

Use it to implement:

* [x] Flowcharts
* [x] Study diagrams
* [x] Process diagrams
* [x] Sequence diagrams
* [x] Concept maps
* [x] Architecture diagrams

Codex instruction:

```text
Use Mermaid to render diagrams when the AI returns a mermaid code block. Add safe client-side rendering and fallback behavior if the diagram syntax is invalid.
```

---

# Phase X — Search Inside Reference Projects

* [x] Search for message components.

```bash
find references -iname "*message*" -o -iname "*chat*" -o -iname "*markdown*"
```

* [x] Search for Markdown rendering examples.

```bash
grep -R "react-markdown\|remark-gfm\|markdown" references -n --exclude-dir=node_modules
```

* [x] Search for code block rendering examples.

```bash
grep -R "code block\|CodeBlock\|syntax" references -n --exclude-dir=node_modules
```

* [x] Search for Mermaid examples.

```bash
grep -R "mermaid" references -n --exclude-dir=node_modules
```

* [x] Search for streaming message logic.

```bash
grep -R "stream\|useChat\|textStream\|delta" references -n --exclude-dir=node_modules
```

---

# Phase X — Decide What to Adapt

## From assistant-ui

* [x] Message bubble layout
* [x] Thread/chat container structure
* [x] Loading and thinking state
* [x] Retry/regenerate UX
* [x] Better input behavior
* [x] Accessibility ideas

## From Vercel Chatbot

* [x] Next.js route organization
* [x] AI SDK streaming patterns
* [x] Artifact-style responses
* [x] Chat history logic
* [x] Model provider abstraction

## From Chatbot UI

* [x] Sidebar conversation UX
* [x] User/assistant message styling
* [x] Prompt input layout
* [x] Settings/model selector inspiration

## From react-markdown

* [x] Markdown renderer
* [x] GFM table support
* [x] Custom component mapping
* [x] Safe rendering with sanitize

## From Mermaid

* [x] Mermaid diagram rendering
* [x] Error fallback
* [x] Client-only rendering strategy

---

# Phase X — Recommended Implementation Strategy

* [x] Do not migrate Mentora fully to another chat framework yet.
* [x] Keep Mentora’s current backend:
  * `/api/chat`
  * Supabase conversations
  * Supabase messages
  * RAG citations
  * OpenAI/OpenRouter provider logic
* [x] Upgrade the current frontend chat instead of replacing the full app.
* [x] Create new reusable components:

```text
src/components/chat/chat-message.tsx
src/components/chat/chat-input.tsx
src/components/chat/markdown-message.tsx
src/components/chat/code-block.tsx
src/components/chat/mermaid-diagram.tsx
src/components/chat/chat-mode-badge.tsx
```

* [x] Gradually move chat logic out of `src/components/mentora-app.tsx`.
* [x] Keep old behavior working while improving the UI.

---

# Phase X — Codex Main Instruction

```text
Use these GitHub repositories as references:

1. assistant-ui/assistant-ui
   https://github.com/assistant-ui/assistant-ui

2. vercel/chatbot
   https://github.com/vercel/chatbot

3. mckaywrigley/chatbot-ui
   https://github.com/mckaywrigley/chatbot-ui

4. remarkjs/react-markdown
   https://github.com/remarkjs/react-markdown

5. mermaid-js/mermaid
   https://github.com/mermaid-js/mermaid

Do not rewrite Mentora’s chat system from zero.

First, inspect Mentora’s current files:
- src/components/mentora-app.tsx
- src/app/api/chat/route.ts
- src/lib/ai/prompts.ts
- src/lib/study-content.ts
- package.json

Then inspect the reference repositories for reusable patterns.

Main tasks:
1. [x] Make Mentora chat available without requiring uploaded PDFs.
2. [x] Preserve PDF-grounded RAG chat when documents exist.
3. [x] Improve chat UI using patterns from assistant-ui, Vercel Chatbot, and Chatbot UI.
4. [x] Add Markdown rendering using react-markdown.
5. [x] Add table support using remark-gfm.
6. [x] Add safe diagram support using Mermaid.
7. [x] Keep Supabase auth, study spaces, conversations, messages, citations, and AI usage logs working.
8. [x] Run lint, typecheck, and build before finishing.

Do not blindly copy large files. Adapt only compatible components and patterns.
This is the missing GitHub reference block. It should go **before the implementation phases**, so Codex first studies existing open-source projects and then adapts the best parts into Mentora.
```
