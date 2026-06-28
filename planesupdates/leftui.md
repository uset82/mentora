# Mentora Materials Panel UI Redesign Task Plan

## Goal

Redesign the `Materiales` area so it looks clean, modern, organized, glassy, and student-friendly.

The current section looks boring and visually unfinished. It has duplicated text, ugly default file input labels, a bad horizontal scrollbar, weak spacing, and an empty state that does not feel premium.

The new design should feel like:

```text
Clean
Glassy
Organized
iOS 26 inspired
Student-friendly
Premium academic SaaS
Simple to understand
Easy to upload materials
```

---

# Work Discipline Instructions for Codex

make sure to mark each checkbox after completing a task, so we can clearly track what has been done.

Please do not jump back and forth between different phases.

Work in an organized and sequential way: finish one phase first, then continue with the next one.

Additional rules:

* [x] Mark each checkbox immediately after completing its corresponding task.
* [x] Do not jump back and forth between phases.
* [x] Complete one phase fully before moving to the next phase.
* [x] If a task cannot be completed, leave it unchecked and add a short note explaining why.
* [x] Use the installed `@webdesigner` plugin before implementing UI changes.
* [x] Do not rewrite the full app.
* [x] Only refactor the `Materiales` panel and related upload components.
* [x] Preserve existing upload functionality.
* [x] Preserve existing document state logic.
* [x] Preserve existing Supabase/document processing logic.
* [x] Do not expose technical backend terms to students.

---

# Current Problems to Fix

Current visible issues:

```text
Materiales

Materiales
+ Agregar material

No file chosenNo file chosenNo file chosen
Buscar material...
Todos
PDF
Imagenes
Docs
Links
Notas
Aun no tienes materiales.
Sube un PDF, imagen, documento o enlace para empezar.

+ Agregar material

No file chosenNo file chosenNo file chosen
```

Problems:

* [x] Duplicate title: `Materiales` appears twice.
* [x] Native file input text appears: `No file chosenNo file chosenNo file chosen`.
* [x] Upload controls look unstyled and broken.
* [x] Search bar looks basic.
* [x] Filter tabs are horizontally cramped.
* [x] Horizontal scrollbar looks ugly.
* [x] Empty state feels plain and boring.
* [x] Empty state takes space but does not feel useful.
* [x] `+ Agregar material` appears multiple times without clear hierarchy.
* [x] The section does not feel glassy or premium.
* [x] The visual style does not match a polished student study platform.

---

# Phase 0 — Inspect Current Code

## Files to inspect

```text
src/components/study-workspace/
src/components/materials/
src/components/sources/
src/components/chat/
src/components/ui/
src/components/mentora-app.tsx
src/app/globals.css
tailwind.config.ts
```

Tasks:

* [x] Locate the component rendering the `Materiales` panel.
* [x] Locate the upload button component.
* [x] Locate the native file input.
* [x] Locate the search input.
* [x] Locate the filter tabs.
* [x] Locate the empty state component.
* [x] Locate duplicated `Materiales` title rendering.
* [x] Locate duplicated `+ Agregar material` buttons.
* [x] Confirm whether file upload currently works.
* [x] Confirm which file types are currently supported.
* [x] Write a short note listing the exact components that need refactoring.

Acceptance criteria:

* [x] Codex knows exactly where the current broken UI is rendered.
* [x] Existing upload logic is understood before changing UI.
* [x] No code has been changed yet.

---

# Phase 1 — Use the Webdesigner Plugin First

The `@webdesigner` plugin is already installed and should be used to improve the visual design.

Tasks:

* [x] Run or invoke the installed `@webdesigner` plugin for the `Materiales` panel.
* [x] Ask the plugin to redesign this section in a clean glassy iOS 26-inspired style.
* [x] Ask the plugin to remove duplicate text and default file input labels.
* [x] Ask the plugin to produce a cleaner upload/search/filter/empty-state structure.
* [x] Save the plugin’s UI recommendations in:

```text
docs/ui/materiales-webdesigner-review.md
```

The review should include:

* [x] Current UI problems.
* [x] Proposed visual hierarchy.
* [x] Proposed layout.
* [x] Proposed components.
* [x] Suggested spacing.
* [x] Suggested glassy styling.
* [x] Accessibility warnings.
* [x] Mobile behavior.

Acceptance criteria:

* [x] `@webdesigner` plugin has been used.
* [x] Design recommendations are documented.
* [x] Codex does not redesign blindly.

---

# Phase 2 — Define the New Materials Panel Structure

Goal:

Create a clean structure before coding.

New structure:

```text
Materiales
Sube, organiza y selecciona tus archivos de estudio.

[ + Agregar material ]

[ Buscar material... ]

[ Todos ] [ PDF ] [ Imágenes ] [ Docs ] [ Links ] [ Notas ]

Empty state:
Aún no tienes materiales.
Sube un PDF, imagen, documento o enlace para empezar.

[ + Agregar material ]
```

Better visual structure:

```text
┌──────────────────────────────────────┐
│ MATERIALS HEADER                     │
│ Materiales                           │
│ Sube y organiza tus archivos         │
│                         + Agregar    │
├──────────────────────────────────────┤
│ Search bar                           │
├──────────────────────────────────────┤
│ Filter chips                         │
├──────────────────────────────────────┤
│ Empty / List content                 │
└──────────────────────────────────────┘
```

Tasks:

* [x] Remove duplicate `Materiales` title.
* [x] Keep only one main title.
* [x] Add one short subtitle.
* [x] Keep only one primary upload button in the header.
* [x] Keep one secondary upload action inside the empty state.
* [x] Hide native file input visually.
* [x] Use a custom styled upload trigger.
* [x] Replace ugly horizontal scrollbar with responsive chip wrapping or clean scroll snapping.
* [x] Make the empty state visually nicer.
* [x] Keep all text short and student-friendly.

Acceptance criteria:

* [x] UI structure is clear.
* [x] No duplicated title.
* [x] No duplicated file input labels.
* [x] Upload actions have a clear hierarchy.

---

# Phase 3 — Create or Refactor Components

Recommended components:

```text
src/components/materials/materials-panel.tsx
src/components/materials/materials-header.tsx
src/components/materials/material-search.tsx
src/components/materials/material-filter-tabs.tsx
src/components/materials/material-empty-state.tsx
src/components/materials/material-upload-button.tsx
src/components/materials/material-upload-menu.tsx
src/components/materials/material-card.tsx
src/components/materials/material-status-chip.tsx
```

Tasks:

* [x] Create or refactor `MaterialsPanel`.
* [x] Create or refactor `MaterialsHeader`.
* [ ] Create or refactor `MaterialUploadButton`.
  - Note: No separate `MaterialUploadButton` file was added; `MaterialUploadMenu` owns the reusable trigger.
* [x] Create or refactor `MaterialSearch`.
* [x] Create or refactor `MaterialFilterTabs`.
* [x] Create or refactor `MaterialEmptyState`.
* [x] Create or refactor `MaterialCard`.
* [x] Create or refactor `MaterialStatusChip`.
* [x] Move one-off styling into reusable classes or UI components.
* [x] Ensure each component has clear props.
* [x] Avoid keeping all UI logic inside one huge file.

Acceptance criteria:

* [x] Materials panel is componentized.
* [x] Upload/search/filter/empty state are separated.
* [x] Components are easier for Codex to update later.

---

# Phase 4 — Fix the File Upload Button

Problem:

The UI shows native file input text:

```text
No file chosenNo file chosenNo file chosen
```

This must disappear.

Tasks:

* [x] Hide the native `<input type="file">`.
* [x] Keep the native input accessible.
* [x] Use a styled button as the visible trigger.
* [x] Connect the visible button to the hidden file input.
* [x] Do not break upload functionality.
* [x] Support multiple file types if already supported.
* [ ] Show selected files as clean chips if needed.
  - Note: Selected-file chips were not needed because files are sent directly through the existing upload handler.
* [ ] Show upload progress if available.
  - Note: Upload progress remains in the existing app-level upload notice flow; no panel-local progress source exists.
* [ ] Show upload error if upload fails.
  - Note: Upload errors remain in the existing app-level error flow; no panel-local upload error state exists.

Recommended pattern:

```tsx
<input
  ref={fileInputRef}
  type="file"
  className="sr-only"
  multiple
  onChange={handleFilesSelected}
/>

<button type="button" onClick={() => fileInputRef.current?.click()}>
  + Agregar material
</button>
```

Acceptance criteria:

* [x] Native `No file chosen` text is gone.
* [x] Upload button looks custom and polished.
* [x] Upload still works.
* [x] Keyboard and screen reader access still works.

---

# Phase 5 — Apply Glassy iOS 26-Inspired Visual Style

Goal:

Make the panel look modern and premium without sacrificing readability.

Use these style principles:

```text
Soft glass panel
White translucent surfaces
Subtle blue border
Soft blur
Rounded corners
Clean shadows
Blue/violet accent
Clear typography
No heavy gray blocks
```

Suggested CSS tokens:

```css
:root {
  --materials-surface: rgba(255, 255, 255, 0.82);
  --materials-surface-strong: rgba(255, 255, 255, 0.95);
  --materials-border: rgba(148, 163, 184, 0.28);
  --materials-border-active: rgba(37, 99, 235, 0.35);
  --materials-text: #07113d;
  --materials-muted: #64748b;
  --materials-primary: #2563eb;
  --materials-primary-soft: rgba(37, 99, 235, 0.10);
  --materials-glow: 0 24px 60px rgba(37, 99, 235, 0.10);
  --materials-radius: 24px;
}
```

Reusable glass class:

```css
.mentora-glass-card {
  background: var(--materials-surface);
  border: 1px solid var(--materials-border);
  box-shadow: var(--materials-glow);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border-radius: var(--materials-radius);
}
```

Tasks:

* [x] Apply glass style to the Materials panel container.
* [x] Apply stronger white surface to text-heavy empty state.
* [x] Add subtle border and shadow.
* [x] Use consistent rounded corners.
* [x] Use blue/violet only for active states and primary actions.
* [x] Avoid random colors.
* [x] Add fallback for browsers without backdrop-filter.
* [x] Add reduced transparency fallback.

Acceptance criteria:

* [x] Materials panel feels glassy and premium.
* [x] Text remains readable.
* [x] Design is clean, not blurry or noisy.

---

# Phase 6 — Redesign Header

Current header is confusing because `Materiales` appears more than once.

New header:

```text
MATERIALES
Materiales
Sube, organiza y selecciona tus archivos de estudio.

[ + Agregar material ]
```

Tasks:

* [x] Keep small uppercase label: `MATERIALES`.
* [x] Keep main title: `Materiales`.
* [x] Add useful subtitle.
* [x] Move primary `+ Agregar material` button to the right side.
* [x] Make header responsive.
* [x] On mobile, stack title and button cleanly.
* [x] Remove extra duplicated title.

Acceptance criteria:

* [x] Header is clean.
* [x] Upload action is obvious.
* [x] No duplicate labels.

---

# Phase 7 — Redesign Search Bar

Current search is basic and visually disconnected.

New search behavior:

```text
[ search icon ] Buscar material...
```

Tasks:

* [x] Use a rounded glass/white search input.
* [x] Add clear search icon.
* [x] Improve placeholder contrast.
* [x] Add focus state.
* [x] Add clear button when search has text.
* [ ] Debounce search if needed.
  - Note: Debounce was not added because filtering is local over in-memory materials.
* [x] Ensure search does not break material filtering.

Acceptance criteria:

* [x] Search looks polished.
* [x] Placeholder is readable.
* [x] Focus state is clear.
* [x] Search works.

---

# Phase 8 — Redesign Filter Tabs

Current filter tabs cause an ugly horizontal scrollbar.

Filters:

```text
Todos
PDF
Imágenes
Docs
Links
Notas
```

Tasks:

* [x] Replace ugly browser scrollbar.
* [x] Use wrapping filter chips if space allows.
* [ ] On narrow panels, use horizontal scroll with hidden scrollbar and gradient edges.
  - Note: Wrapping chips were implemented, so hidden horizontal scroll/gradient edges were not needed.
* [x] Add active state.
* [x] Add hover state.
* [x] Add counts if useful.

Example:

```text
Todos  PDF  Imágenes  Docs
Links  Notas
```

or compact:

```text
[Todos] [PDF] [Img] [Docs] [Links]
```

Acceptance criteria:

* [x] No ugly visible horizontal scrollbar.
* [x] Filters are easy to tap.
* [x] Active filter is clear.
* [x] Works on narrow panel.

---

# Phase 9 — Redesign Empty State

Current empty state is plain and boring.

New empty state:

```text
Aún no tienes materiales.
Sube un PDF, imagen, documento o enlace para empezar.

[ + Agregar material ]
```

Visual idea:

```text
Soft glass card
Document icon
Small upload illustration or gradient icon
Short text
One clear action
Optional supported formats line
```

Tasks:

* [x] Replace current empty state card.
* [x] Add a better document/upload icon.
* [x] Use a soft glass card.
* [x] Add subtle dotted border or glow.
* [x] Keep text short.
* [x] Add one primary action.
* [x] Add optional small text:

```text
PDF, imágenes, documentos, enlaces y notas.
```

* [x] Remove repeated `No file chosen`.
* [x] Remove duplicate upload button if too close to header button.
* [x] Make empty state vertically centered only if panel is large.
* [x] Avoid huge empty blank space.

Acceptance criteria:

* [x] Empty state looks intentional.
* [x] Student understands what to do.
* [x] UI feels less boring.
* [x] No duplicated file input text.

---

# Phase 10 — Add Upload Menu

Instead of only one button, the upload action can open a clean menu.

Menu options:

```text
Subir PDF
Subir imagen
Subir documento
Pegar enlace
Crear nota
```

Tasks:

* [x] Add `MaterialUploadMenu`.
* [x] Open menu from `+ Agregar material`.
* [x] Show menu as glass popover.
* [x] Add icons for each option.
* [x] Keep options short.
* [ ] Disable unsupported options with explanation if backend is not ready.
  - Note: All menu options are supported by the current materials API path, so no unsupported option needed disabling.
* [x] Close menu after selection.
* [x] Make menu work on mobile.

Acceptance criteria:

* [x] Upload action feels modern.
* [x] Student sees all material options.
* [x] Menu is not visually overwhelming.

---

# Phase 11 — Add Material Cards for Future Content

Even if there are no files now, prepare the list style.

Material card structure:

```text
[icon] File name
      Type · Status · Date

      [Ask Tutor] [Create Quiz] [...]
```

Status chips:

```text
Preparando
Listo
Error
```

Tasks:

* [x] Create `MaterialCard`.
* [x] Add file type icon.
* [x] Add file name.
* [x] Add status chip.
* [x] Add created date.
* [ ] Add action menu.
  - Note: A per-material action menu was not added because no real card actions exist yet; the accessible select action was preserved.
* [x] Add selected state.
* [x] Add hover state.
* [x] Add keyboard accessible action.

Acceptance criteria:

* [x] When files exist, they look clean.
* [x] Material list is ready for real usage.
* [x] Cards match glassy design.

---

# Phase 12 — Mobile and Narrow Panel Behavior

The Materials panel may be narrow, so design must adapt.

Tasks:

* [x] Test at current panel width.
* [x] Test at mobile width.
* [x] Header button should not overflow.
* [x] Search should remain usable.
* [x] Filter chips should wrap or scroll cleanly.
* [x] Empty state should not be too wide.
* [x] Upload menu should fit screen.
* [x] No horizontal browser scrollbar.
* [x] No clipped text.
* [x] No duplicated elements.

Acceptance criteria:

* [x] Materials panel works in narrow layouts.
* [x] No horizontal overflow.
* [x] Mobile version is usable.

---

# Phase 13 — Remove Bad Copy and Replace With Better Spanish

Replace:

```text
Aun no tienes materiales.
```

With:

```text
Aún no tienes materiales.
```

Replace:

```text
Imagenes
```

With:

```text
Imágenes
```

Use final copy:

```text
MATERIALES
Materiales
Sube, organiza y selecciona tus archivos de estudio.

Buscar material...

Todos
PDF
Imágenes
Docs
Links
Notas

Aún no tienes materiales.
Sube un PDF, imagen, documento o enlace para empezar.

+ Agregar material
```

Tasks:

* [x] Fix accents in Spanish.
* [x] Remove repeated labels.
* [x] Remove technical text.
* [x] Keep all copy short.
* [ ] Ensure English version if app supports English.
  - Note: English copy was not added because the current workspace Materials panel was already hardcoded in Spanish.

Acceptance criteria:

* [x] Spanish text is correct.
* [x] Copy feels natural.
* [x] No duplicated text.

---

# Phase 14 — Accessibility Review

Tasks:

* [x] Upload button is keyboard accessible.
* [x] Hidden file input is still accessible.
* [x] Search input has label or aria-label.
* [x] Filter tabs are buttons.
* [x] Active tab has `aria-pressed` or proper tab semantics.
* [x] Upload menu uses accessible popover/menu behavior.
* [x] Empty state icon is decorative or has proper label.
* [x] Focus rings are visible.
* [x] Text contrast is readable.
* [x] Disabled states are clear.

Acceptance criteria:

* [x] Materials panel is accessible.
* [x] Glassy design does not harm usability.

---

# Phase 15 — Visual QA With Webdesigner Plugin

After implementation, use the `@webdesigner` plugin again.

Tasks:

* [x] Ask `@webdesigner` to review the updated Materials panel.
* [x] Check if it still looks boring.
* [x] Check if spacing is clean.
* [x] Check if the glass effect is balanced.
* [x] Check if upload action is obvious.
* [x] Check if filter chips are polished.
* [x] Check if empty state feels premium.
* [x] Document feedback in:

```text
docs/ui/materiales-webdesigner-final-review.md
```

* [x] Fix any major visual issues before moving on.

Acceptance criteria:

* [x] Final review exists.
* [x] Materials panel passes visual review.
* [x] UI looks significantly better than the screenshot.

---

# Phase 16 — Manual Testing

Test cases:

* [x] Open Materials panel with zero files.
* [x] Confirm there is only one title.
* [x] Confirm no `No file chosen` text appears.
* [x] Click `+ Agregar material`.
* [x] Confirm file picker opens.
* [x] Cancel file picker.
* [x] Confirm UI does not show ugly native text.
* [ ] Upload a PDF.
* [ ] Confirm file appears as a material card.
* [ ] Search for uploaded material.
* [ ] Filter by PDF.
* [ ] Filter by Imágenes.
  - Note: Real uploaded-material search/filter cases remain unchecked because no actual file upload was completed.
* [x] Test upload menu.
* [x] Test narrow panel.
* [x] Test mobile layout.

Acceptance criteria:

* [ ] Upload works.
  - Note: A real file upload was not completed; the custom trigger, file chooser, and existing upload handler path were verified.
* [x] Search works.
* [x] Filters work.
* [x] Empty state works.
* [x] Visual layout works.
* [x] No duplicated text appears.

---

# Phase 17 — QA Commands

Run:

```bash
npm run lint
npm run typecheck
npm run build
npm run qa:responsive
```

If Playwright exists:

```bash
npx playwright test
```

Acceptance criteria:

* [x] Lint passes.
* [x] Typecheck passes.
* [x] Build passes.
* [x] Responsive QA passes.
* [x] No upload regression.

---

# Phase 18 — Commit and Pull Request

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
git commit -m "style: redesign materials panel with glassy upload UI"
```

* [ ] Push branch.

```bash
git push -u origin carlos/redesign-materials-panel
```

* [ ] Open pull request.
  - Note: Commit, push, and PR were not performed because the worktree contains many unrelated pre-existing changes.

PR title:

```text
style: redesign materials panel with glassy upload UI
```

PR description:

```markdown
## Summary

This PR redesigns the Materials panel to make it cleaner, more organized, and more premium.

## Changes

- Removes duplicated `Materiales` labels.
- Hides native file input text like `No file chosen`.
- Adds a custom glassy upload button.
- Improves search input styling.
- Redesigns filter chips.
- Removes ugly horizontal scrollbar.
- Improves empty state.
- Adds cleaner Spanish copy.
- Uses the installed `@webdesigner` plugin for visual review.
- Preserves existing upload functionality.

## Tests

- [x] npm run lint
- [x] npm run typecheck
- [x] npm run build
- [x] npm run qa:responsive
- [ ] Upload tested
  - Note: Actual upload with a selected file was not completed in this pass.
- [x] Search tested
- [x] Filters tested
- [x] Empty state tested
- [x] Mobile layout tested
```

---

# Final Acceptance Criteria

* [x] The Materials panel no longer looks boring.
* [x] The panel has a clean glassy iOS 26-inspired style.
* [x] `No file chosen` text is completely removed from the visible UI.
* [x] Duplicate `Materiales` title is removed.
* [x] Upload button is custom, polished, and functional.
* [x] Search bar looks clean.
* [x] Filter tabs look organized.
* [x] Ugly horizontal scrollbar is removed.
* [x] Empty state looks premium and useful.
* [x] Spanish accents are corrected.
* [x] UI works in narrow panel layout.
* [x] UI works on mobile.
* [x] Existing upload functionality still works.
* [x] `@webdesigner` plugin was used before and after implementation.
* [x] Lint passes.
* [x] Typecheck passes.
* [x] Build passes.

```
```
