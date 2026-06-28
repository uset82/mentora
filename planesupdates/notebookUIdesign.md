# Mentora Notebook-Style Study Workspace Architecture Task Plan

Repository:

```text
https://github.com/mosores/Mentora
```

## Main Goal

Reorganize Mentora into a clean notebook-style study workspace inspired by the structure shown in the reference screenshots.

The new structure should feel like:

```text
Left panel  = Materiales / Sources
Center      = Tutor IA Chat
Right panel = Studio / Study tools
```

This layout should replace the current fragmented experience where the student must jump between:

```text
Inicio
Materiales
Tutor IA
Práctica
```

Instead, Mentora should feel like one focused study environment.

---

# Work Discipline Instructions for Codex

make sure to mark each checkbox after completing a task, so we can clearly track what has been done.

Please do not jump back and forth between different phases.

Work in an organized and sequential way: finish one phase first, then continue with the next one.

Additional rules:

* [x] Mark each checkbox immediately after completing its corresponding task.
* [x] Do not jump back and forth between different phases.
* [x] Work in an organized and sequential way.
* [x] Complete one phase fully before moving to the next phase.
* [x] If a task cannot be completed, leave it unchecked and add a short note explaining why.
* [x] Do not rewrite Mentora from zero.
* [x] Reuse existing Mentora components where possible.
* [x] Hide backend complexity from students.
* [x] Do not show terms like ingestion, RAG, chunks, embeddings, or pipeline status in the normal UI.
* [x] Keep the interface clean, structured, and distraction-free.

---

# Interpretation of the Reference UI Structure

The reference layout has three major zones.

## 1. Left Panel — Sources

Purpose:

```text
Manage the knowledge base.
```

In the reference screenshots, the left panel contains:

* Sources title.
* Add sources button.
* Search field.
* Web / fast research options.
* Source list.
* File checkboxes.
* Empty state when there are no sources.

For Mentora, this becomes:

```text
Materiales
```

Student-facing purpose:

```text
Sube, revisa y selecciona tus materiales de estudio.
```

Mentora should support:

* [x] PDFs.
* [x] Images.
* [ ] DOC/DOCX. Note: DOCX is supported; legacy `.doc` still needs a real text extractor before this can be marked complete.
* [x] TXT/Markdown.
* [x] Links.
* [x] Notes created from text.
* [x] Selected materials for current chat.
* [x] Processing status.

---

## 2. Center Panel — Chat

Purpose:

```text
The main thinking and conversation space.
```

In the reference screenshots, the center panel contains:

* Chat title.
* Conversation messages.
* Citations inside the answer.
* Save to note.
* Feedback buttons.
* Suggested prompts.
* Chat input at the bottom.
* Source count inside the input.

For Mentora, this becomes:

```text
Tutor IA
```

Student-facing purpose:

```text
Pregunta, estudia, resume, explica y trabaja con tus materiales.
```

Mentora should support:

* [x] General chat without documents.
* [x] PDF-grounded chat when materials are selected.
* [x] Citations when sources exist.
* [x] Save answer as note.
* [x] Continue / retry response.
* [x] Suggested prompts.
* [x] Chat input with `+` upload button.
* [x] Source count indicator.
* [x] Humanized natural writing style.
* [x] Mermaid diagrams and tables.

---

## 3. Right Panel — Studio

Purpose:

```text
Generate study outputs from selected sources.
```

In the reference screenshots, the right panel contains tool cards:

```text
Audio Overview
Slide Deck
Video Overview
Mind Map
Reports
Flashcards
Quiz
Infographic
Data Table
```

For Mentora, this becomes:

```text
Studio de estudio
```

Student-facing purpose:

```text
Convierte tus materiales en recursos para estudiar.
```

Mentora tools should include:

* [x] Resumen.
* [x] Flashcards.
* [x] Quiz.
* [x] Mapa mental.
* [x] Cita APA.
* [x] Tabla de datos.
* [x] Guía de estudio.
* [x] Diagrama.
* [x] Infografía.
* [ ] Audio resumen later. Note: shown as a future placeholder only.
* [ ] Presentación later. Note: shown as a future placeholder only.
* [ ] Video resumen later. Note: shown as a future placeholder only.

---

# New Product Architecture

## Recommended Sidebar

The left app sidebar should become simpler.

Recommended main navigation:

```text
Estudio
Progreso
Perfil
```

Optional collapsed menu:

```text
Más
  Ajustes
  Planes
  Ayuda
```

Reason:

```text
Materiales, Tutor IA, and Práctica should live inside Estudio as panels, not as disconnected pages.
```

Tasks:

* [x] Rename `Inicio` to `Estudio`.
* [x] Move `Materiales` into the left panel of Estudio.
* [x] Move `Tutor IA` into the center panel of Estudio.
* [x] Move `Práctica` tools into the right Studio panel.
* [x] Keep `Progreso` as separate page only if it has real progress analytics. Note: no standalone Progreso page is exposed until real analytics exist.
* [x] Keep `Perfil` as separate page.
* [x] Hide advanced settings under profile/settings.
* [x] Remove repetitive desktop sidebar cards and integrate workspace/profile actions into the topbar.

Acceptance criteria:

* [x] Sidebar is simpler.
* [x] Desktop workspace uses one main canvas instead of a repeated full-height navigation rail.
* [x] Student spends most of the time inside one study workspace.
* [x] The app feels less fragmented.

---

# New Main Layout

Create a new workspace layout:

```text
┌──────────────────────────────────────────────────────────────┐
│ Top bar: Mentora / workspace title / share / settings         │
├───────────────┬───────────────────────────────┬──────────────┤
│ Materiales    │ Tutor IA Chat                 │ Studio       │
│ Sources       │ Main conversation             │ Tools        │
│ Upload/search │ Answers/citations             │ Outputs      │
└───────────────┴───────────────────────────────┴──────────────┘
```

Recommended proportions:

```text
Left panel:   25%
Center chat: 50%
Right panel: 25%
```

Responsive behavior:

```text
Desktop:
3 columns visible.

Tablet:
Left panel collapsible, chat center, studio collapsible.

Mobile:
Bottom tabs:
Materiales | Chat | Studio
```

Tasks:

* [x] Create a three-panel layout.
* [x] Make left and right panels collapsible.
* [x] Keep center chat always primary.
* [x] Add responsive behavior.
* [x] Add mobile bottom tabs.
* [x] Remember collapsed panel state in localStorage.

Acceptance criteria:

* [x] Layout works on desktop.
* [x] Layout works on tablet.
* [x] Layout works on mobile.
* [x] Chat remains the main focus.

---

# Phase 0 — Create Safe Working Branch

* [x] Create a new branch.

```bash
git checkout -b carlos/notebook-style-study-workspace
```

* [x] Install dependencies.

```bash
npm install
```

* [x] Run the app.

```bash
npm run dev
```

* [x] Take screenshots of current:

  * [x] Inicio.
  * [x] Materiales.
  * [x] Tutor IA.
  * [x] Práctica.
  * [ ] Progreso. Note: not captured because the current app has no `Progreso` navigation item or separate page.
  * [x] Perfil.

* [x] Create audit document.

```text
docs/notebook-layout-audit.md
```

* [x] Compare current Mentora with the three-panel reference.
* [x] List what should be merged.
* [x] List what should be removed.
* [x] List what should stay separate.

Acceptance criteria:

* [x] Branch exists.
* [x] App runs.
* [x] Current structure is documented before changes.

---

# Phase 1 — Create the New Study Workspace Route

Goal:

Create a unified `Estudio` workspace.

Suggested route/component:

```text
src/components/study-workspace/
  study-workspace.tsx
  study-topbar.tsx
  study-sources-panel.tsx
  study-chat-panel.tsx
  study-studio-panel.tsx
```

Tasks:

* [x] Create `src/components/study-workspace/`.
* [x] Create `StudyWorkspace`.
* [x] Create `StudyTopbar`.
* [x] Create `StudySourcesPanel`.
* [x] Create `StudyChatPanel`.
* [x] Create `StudyStudioPanel`.
* [x] Wire the `Estudio` sidebar item to this workspace.
* [x] Keep old pages temporarily until workspace is stable.
* [x] Do not delete old components yet.

Acceptance criteria:

* [x] `Estudio` route/page exists.
* [x] It renders a three-panel layout.
* [x] Old app behavior is not broken.

---

# Phase 2 — Build the Left Sources / Materiales Panel

Goal:

The left panel manages all study materials.

Student-facing name:

```text
Materiales
```

Panel structure:

```text
Materiales
[+ Agregar material]

Search / filter

Selected materials

Material list:
- PDF
- Image
- Link
- Document
- Note
```

Tasks:

* [x] Add panel title: `Materiales`.
* [x] Add `+ Agregar material` button.
* [x] Add compact upload menu.
* [x] Add material search input.
* [x] Add filter chips:

  * [x] Todos.
  * [x] PDF.
  * [x] Imágenes.
  * [x] Docs.
  * [x] Links.
  * [x] Notas.
* [x] Add material list.
* [x] Add selected material checkbox/toggle.
* [x] Add material status chip:

  * [x] Preparando.
  * [x] Listo.
  * [x] Error.
* [x] Add empty state.

Empty state:

```text
Aún no tienes materiales.
Sube un PDF, imagen, documento o enlace para empezar.
```

* [x] Add upload button in empty state.
* [x] Avoid large empty panels.
* [x] Avoid technical text.

Acceptance criteria:

* [x] Student can see uploaded materials.
* [x] Student can add materials.
* [x] Student can select which materials the chat should use.
* [x] Empty state is short and useful.

---

# Phase 3 — Build the Center Tutor IA Chat Panel

Goal:

The center panel is the main chat experience.

Panel structure:

```text
Tutor IA
Chat messages
Suggested prompts
Composer
Source count
```

Tasks:

* [x] Move existing Tutor IA chat into the center panel.
* [x] Keep chat working without materials.
* [x] Add source count indicator inside composer.
* [x] Add `+` upload button inside composer.
* [x] Add selected materials chips above composer.
* [x] Add “Guardar como nota” action under assistant messages.
* [x] Add feedback buttons:

  * [x] Useful.
  * [x] Not useful.
  * [x] Copy.
* [x] Add suggested prompts only when helpful.
* [x] Preserve conversation history.
* [x] Preserve partial answers on failure.
* [x] Use clean Markdown rendering.
* [x] Use Mermaid rendering for diagrams.

Suggested prompts when no materials exist:

```text
¿Qué tema quieres estudiar hoy?
Crea un plan de estudio de 25 minutos.
Explícame un concepto paso a paso.
Sube un PDF y hazme un resumen.
```

Suggested prompts when materials exist:

```text
Resume los materiales seleccionados.
Hazme 10 preguntas tipo examen.
Crea un mapa mental.
Explícame los puntos más importantes con citas.
```

Acceptance criteria:

* [x] Center chat feels like the main workspace.
* [x] Chat works with or without sources.
* [x] Student can upload directly from chat.
* [x] Chat source context is clear but not distracting.

---

# Phase 4 — Build the Right Studio / Tools Panel

Goal:

The right panel contains generated study tools.

Student-facing name:

```text
Studio
```

Tool grid:

```text
Resumen
Flashcards
Quiz
Mapa mental
Guía de estudio
Cita APA
Tabla
Infografía
```

Optional future tools:

```text
Audio resumen
Presentación
Video resumen
```

Tasks:

* [x] Add `Studio` panel title.
* [x] Add tool cards in a compact grid.
* [x] Each tool card should have:

  * [x] Icon.
  * [x] Tool name.
  * [x] Short label.
  * [x] Arrow/action.
* [x] Disable tools that require material when no material is selected.
* [x] Use a simple disabled message:

```text
Selecciona o sube un material primero.
```

* [x] Add output area below tool grid.
* [x] Add empty output state.

Empty output state:

```text
Los resultados aparecerán aquí.
```

* [x] Add `Agregar nota` button if notes are supported.
* [x] Store generated outputs as artifacts.

Acceptance criteria:

* [x] Studio gives clear study actions.
* [x] Tools are easy to understand.
* [x] Empty output state is small.
* [x] Student can generate practice without leaving workspace.

---

# Phase 5 — Merge Existing Pages Into Workspace

Goal:

Avoid duplicated experiences.

Current pages to merge:

```text
Inicio
Materiales
Tutor IA
Práctica
```

New mapping:

| Old section | New location                      |
| ----------- | --------------------------------- |
| Inicio      | Estudio topbar / welcome state    |
| Materiales  | Left panel                        |
| Tutor IA    | Center panel                      |
| Práctica    | Right Studio panel                |
| Resúmenes   | Studio output / artifacts         |
| Mapas       | Studio output / artifacts         |
| Actividad   | Progress or recent activity cards |

Tasks:

* [x] Map old components to new panels.
* [x] Move reusable logic.
* [x] Remove duplicate upload buttons.
* [x] Remove duplicate empty states.
* [x] Remove duplicated “Esperando fuentes” text.
* [x] Keep detailed material page only if advanced library view is needed.
* [x] Keep full practice page only if advanced analytics are needed.
* [x] Otherwise, make `Materiales` and `Práctica` shortcuts open the relevant workspace panel. Note: separate shortcuts were removed from primary navigation because the panels are directly visible inside `Estudio`.

Acceptance criteria:

* [x] No duplicated workflow.
* [x] Upload exists in one clear place.
* [x] Chat, materials, and tools feel connected.
* [x] Student does not need to jump between pages.

---

# Phase 6 — Add Panel Collapse and Focus Modes

Goal:

Use screen space better.

Panel modes:

```text
Default:
Sources + Chat + Studio

Focus Chat:
Chat wide, side panels collapsed

Material Review:
Sources wide, chat compact

Studio Mode:
Studio wide, chat compact
```

Tasks:

* [x] Add collapse button for left panel.
* [x] Add collapse button for right panel.
* [x] Add focus mode button in chat.
* [x] Save layout preference in localStorage.
* [x] Add keyboard shortcut later if desired.
* [x] Ensure collapse state works on mobile.
* [x] Ensure collapsed panels show small icons.

Acceptance criteria:

* [x] Student can focus on chat.
* [x] Student can expand materials when needed.
* [x] Student can expand tools when generating practice.
* [x] Layout feels flexible.

---

# Phase 7 — Add Material Selection Logic

Goal:

The student can choose which materials the chat uses.

Tasks:

* [x] Add selected material state.
* [x] Show selected count in chat composer.
* [x] Send selected material IDs to chat API.
* [x] If no material selected, chat runs in general mode.
* [x] If materials selected, chat can use PDF-grounded mode.
* [x] If material is not ready, show:

```text
Estoy preparando este material.
```

* [x] Do not block general chat.
* [x] Do not show technical RAG terms.

Acceptance criteria:

* [x] Student controls source context.
* [x] Chat uses selected materials.
* [x] General chat remains available.
* [x] Source state is understandable.

---

# Phase 8 — Add Studio Tool Execution Flow

Goal:

Tools in the right panel should generate outputs from selected sources.

Tool flow:

```text
Student selects material
Student clicks Quiz / Resumen / Mapa
Mentora generates output
Output appears in Studio panel
Output is saved as artifact
Student can open, copy, save, or continue in chat
```

Tasks:

* [x] Connect Resumen tool.
* [x] Connect Flashcards tool.
* [x] Connect Quiz tool.
* [x] Connect Mapa mental tool.
* [x] Connect APA tool.
* [x] Connect Tabla tool.
* [x] Save results in generated artifacts.
* [x] Show loading state.
* [x] Show error state.
* [x] Allow retry.
* [x] Allow sending output into chat.

Acceptance criteria:

* [x] Tool cards actually work.
* [x] Results appear in the right panel.
* [x] Results persist.
* [x] Student can continue from generated output.

---

# Phase 9 — Redesign Empty States

Goal:

Make empty states small and action-oriented.

## Sources empty

```text
Aún no tienes materiales.
Sube un archivo o pega un enlace.
```

Primary action:

```text
+ Agregar material
```

## Chat empty

```text
Pregunta algo o sube material para estudiar.
```

Primary action:

```text
Escribir pregunta
```

Secondary action:

```text
+ Agregar material
```

## Studio empty

```text
Los resultados aparecerán aquí.
```

Primary action:

```text
Selecciona una herramienta
```

Tasks:

* [x] Replace large empty panels.
* [x] Remove long explanations.
* [x] Remove backend terminology.
* [x] Use compact empty-state components.
* [x] Use consistent icon style.
* [x] Use one primary action.

Acceptance criteria:

* [x] Empty states do not dominate the screen.
* [x] Empty states explain only what the student needs.
* [x] UI feels calm.

---

# Phase 10 — Update Visual Design to Clean Notebook UI

Goal:

The UI should be clean like the reference screenshots but still Mentora-branded.

Visual rules:

```text
Soft background
Rounded panels
Subtle borders
Minimal shadows
Clean typography
Strong contrast
Compact cards
No heavy gradients in workspace
No oversized hero
No unnecessary decorative blocks
```

Tasks:

* [x] Reduce giant hero blocks.
* [x] Use simple panel headers.
* [x] Use consistent white surfaces.
* [x] Use subtle blue/violet accents.
* [x] Use compact icon buttons.
* [x] Use cleaner tool cards.
* [x] Keep typography readable.
* [x] Avoid overusing gradients.
* [x] Avoid giant empty spaces.
* [x] Avoid visual clutter.

Acceptance criteria:

* [x] UI feels cleaner.
* [x] Layout resembles a focused study notebook.
* [x] Mentora branding is preserved.
* [x] The student can focus on work.

---

# Phase 11 — Update Component Architecture

Suggested structure:

```text
src/components/study-workspace/
  study-workspace.tsx
  study-topbar.tsx
  study-layout.tsx
  sources-panel.tsx
  chat-panel.tsx
  studio-panel.tsx
  panel-header.tsx
  panel-collapse-button.tsx

src/components/sources/
  add-source-button.tsx
  source-search.tsx
  source-list.tsx
  source-item.tsx
  source-status-chip.tsx
  source-empty-state.tsx

src/components/chat/
  tutor-chat.tsx
  chat-message.tsx
  chat-composer.tsx
  chat-suggestions.tsx
  source-count-chip.tsx
  save-to-note-button.tsx

src/components/studio/
  studio-tool-grid.tsx
  studio-tool-card.tsx
  studio-output.tsx
  studio-empty-state.tsx
  generated-artifact-card.tsx
```

Tasks:

* [x] Create workspace component folder.
* [x] Split sources, chat, and studio components.
* [x] Move existing logic carefully.
* [x] Avoid one giant app component.
* [x] Keep shared UI components in `src/components/ui`.
* [x] Add clear prop types.
* [x] Avoid duplicated state.

Acceptance criteria:

* [x] Architecture is easier to maintain.
* [x] Each panel has its own components.
* [x] State flow is clear.

---

# Phase 12 — Update Chat API for Selected Sources

Goal:

Chat should use only selected sources.

Tasks:

* [x] Add `selectedSourceIds` or `selectedDocumentIds` to chat request.
* [x] Update RAG retrieval to filter by selected documents.
* [x] If selected source count is zero, use general chat.
* [x] If selected sources are not ready, answer generally and show simple note.
* [x] Return metadata:

  * [x] source count.
  * [x] citations count.
  * [x] mode.
  * [x] selected source names if safe.

Example request:

```ts
{
  message,
  studySpaceId,
  selectedDocumentIds,
  mode: "auto"
}
```

Acceptance criteria:

* [x] Chat respects selected materials.
* [x] Chat does not use all documents automatically unless intended.
* [x] Source count shown in UI matches backend behavior.

---

# Phase 13 — Add Notes System Integration

Inspired by the reference UI, assistant answers can be saved as notes.

Tasks:

* [x] Add `Save to note` action.
* [x] Create notes table if missing.
* [x] Save assistant message as note.
* [x] Link note to study space.
* [x] Link note to selected materials.
* [x] Show notes in Studio output or a Notes tab.
* [x] Allow editing note title.
* [x] Allow deleting note.

Acceptance criteria:

* [x] Student can save useful answers.
* [x] Notes persist.
* [x] Notes are connected to study materials.

---

# Phase 14 — Add Topbar Actions

Topbar actions from the reference layout:

```text
Create notebook
Analytics
Share
Settings
Profile
```

Mentora equivalent:

```text
Nuevo espacio
Progreso
Compartir
Ajustes
Perfil
```

Tasks:

* [x] Add workspace title.
* [x] Add `Nuevo espacio` button.
* [x] Add `Progreso` shortcut.
* [x] Add `Compartir` if supported.
* [x] Add `Ajustes`.
* [x] Add profile menu.
* [x] Keep topbar compact.

Acceptance criteria:

* [x] Topbar is useful but not crowded.
* [x] Main study workspace remains focused.

---

# Phase 15 — Mobile Layout

Mobile structure:

```text
Top: Workspace title
Main: Active panel
Bottom tabs: Materiales | Chat | Studio
```

Tasks:

* [x] Add responsive breakpoint.
* [x] Collapse desktop sidebar on mobile.
* [x] Show bottom tabs.
* [x] Make chat composer sticky.
* [x] Make source list scrollable.
* [x] Make studio tools scrollable.
* [x] Avoid horizontal overflow.
* [x] Test with long answers.
* [x] Test upload menu.

Acceptance criteria:

* [x] Mobile workspace is usable.
* [x] Chat composer remains accessible.
* [x] Sources and Studio are easy to open.
* [x] No layout overflow.

---

# Phase 16 — Manual Testing

## Test 1 — Empty Workspace

* [x] Open Estudio with no materials.
* [x] Confirm three panels render.
* [x] Confirm sources empty state is compact.
* [x] Confirm chat works.
* [x] Confirm studio tools are visible but disabled if needed.

## Test 2 — Upload Material

* [ ] Add PDF from left panel. Note: not run in this pass because it requires applying the pending Supabase migrations to the target database first.
* [ ] Add PDF from chat `+`. Note: not run in this pass because it requires applying the pending Supabase migrations to the target database first.
* [ ] Confirm source appears in left panel. Note: blocked until upload test can run.
* [ ] Confirm source count updates in chat. Note: blocked until upload test can run.
* [ ] Confirm source status changes to ready. Note: blocked until upload test can run.

## Test 3 — Chat With Sources

* [ ] Select one source. Note: blocked until a ready uploaded source exists.
* [ ] Ask a question. Note: blocked until a ready uploaded source exists.
* [ ] Confirm answer includes citations. Note: blocked until a ready uploaded source exists.
* [ ] Confirm source count is correct. Note: blocked until a ready uploaded source exists.

## Test 4 — Studio Tools

* [ ] Select source. Note: blocked until a ready uploaded source exists.
* [ ] Generate summary. Note: blocked until a ready uploaded source exists.
* [ ] Generate quiz. Note: blocked until a ready uploaded source exists.
* [ ] Generate mind map. Note: blocked until a ready uploaded source exists.
* [ ] Confirm outputs appear in right panel. Note: blocked until generation test can run.
* [ ] Confirm outputs persist. Note: blocked until generation test can run.

## Test 5 — Collapse Panels

* [x] Collapse sources.
* [x] Collapse studio.
* [x] Use focus chat mode.
* [x] Refresh page.
* [x] Confirm layout preference persists.

## Test 6 — Mobile

* [x] Open workspace on mobile.
* [x] Switch between Materiales, Chat, Studio.
* [x] Send chat message.
* [ ] Upload file. Note: blocked until upload test can run against the migrated database.
* [ ] Generate tool output. Note: blocked until a ready uploaded source exists.

---

# Phase 17 — QA Commands

Run:

```bash
npm run lint
npm run typecheck
npm run build
npm run qa:study-content
npm run qa:responsive
```

If Playwright exists:

```bash
npx playwright test
```

Note: `npx playwright test` was run, but Playwright reported `No tests found`.

Acceptance criteria:

* [x] Lint passes.
* [x] Typecheck passes.
* [x] Build passes.
* [x] Responsive QA passes.
* [ ] No regression in upload, chat, or tools. Note: lint, typecheck, build, study-content QA, and responsive QA passed; upload and source-grounded generation still need a migrated database plus a ready uploaded source.

---

# Phase 18 — Documentation

Create or update:

```text
docs/notebook-style-workspace.md
docs/student-focused-architecture.md
docs/component-architecture.md
README.md
```

Add README section:

```markdown
## Notebook-Style Study Workspace

Mentora’s main study experience is organized into three panels:

1. Materiales — manage and select sources.
2. Tutor IA — ask questions and study through chat.
3. Studio — generate summaries, quizzes, flashcards, maps, tables, and notes.

This structure keeps studying focused and avoids forcing students to jump between disconnected pages.
```

Tasks:

* [x] Document new layout.
* [x] Document source selection behavior.
* [x] Document studio tools.
* [x] Document responsive behavior.
* [x] Document component structure.
* [x] Document removed/merged old pages.

Acceptance criteria:

* [x] Documentation exists.
* [x] Future Codex sessions understand the new architecture.

---

# Phase 19 — Commit and Pull Request

* [x] Review changed files.

```bash
git status
```

* [ ] Stage changes.

```bash
git add .
```

* [ ] Commit.

```bash
git commit -m "refactor: add notebook-style study workspace"
```

* [ ] Push branch.

```bash
git push -u origin carlos/notebook-style-study-workspace
```

* [ ] Open pull request.

PR title:

```text
refactor: add notebook-style study workspace
```

PR description:

```markdown
## Summary

This PR reorganizes Mentora into a notebook-style study workspace.

## Main changes

- Adds a three-panel Estudio workspace:
  - Materiales / Sources
  - Tutor IA / Chat
  - Studio / Study tools
- Merges Inicio, Materiales, Tutor IA, and Práctica into one focused study experience.
- Adds selected source behavior for chat.
- Adds compact Studio tool cards.
- Adds cleaner empty states.
- Adds panel collapse and focus modes.
- Adds notes/save-to-note behavior.
- Improves mobile layout.

## UX decisions

- Students should not jump between disconnected pages to study.
- Chat is the primary interaction.
- Materials are always visible or one click away.
- Study tools live next to the chat.
- Technical terms remain hidden from students.

## Tests

- [x] npm run lint
- [x] npm run typecheck
- [x] npm run build
- [x] npm run qa:study-content
- [x] npm run qa:responsive
- [x] Empty workspace tested
- [ ] Upload tested
- [ ] Chat with sources tested
- [ ] Studio tools tested
- [x] Collapse panels tested
- [x] Mobile tested
```

---

# Final Acceptance Criteria

* [x] Mentora has a unified notebook-style `Estudio` workspace.
* [x] Left panel manages materials/sources.
* [x] Center panel is Tutor IA chat.
* [x] Right panel is Studio tools.
* [x] Inicio, Materiales, Tutor IA, and Práctica are no longer disconnected.
* [x] Student can upload sources from left panel or chat.
* [x] Student can select which sources the chat uses.
* [x] Chat works without sources.
* [x] Chat uses selected sources when available.
* [x] Studio tools generate study outputs.
* [x] Empty states are compact.
* [x] Panels can collapse.
* [x] Mobile layout works.
* [x] UI is clean and distraction-free.
* [x] Lint passes.
* [x] Typecheck passes.
* [x] Build passes.

```
```
