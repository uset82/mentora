# Mentora Clean Study Navigation Plan

## Design Read

Reading this as an in-product student study workspace for Spanish-speaking learners. The interface should feel like a calm university cockpit: clear next step, fewer repeated choices, and no distracting duplicate action clusters.

Mentora dials:

- `DESIGN_VARIANCE: 6`
- `MOTION_INTENSITY: 5`
- `VISUAL_DENSITY: 5`

## Current UX Diagnosis

The visible sidebar is not wrong, but the same student intents appear in too many places:

- `Inicio / Resumen de estudio` acts as a destination, but the home screen also repeats study plan, tools, tutor recommendations, upload, and start-study actions.
- `Mis materiales / 0 fuentes` is both navigation and status, while the active-space card also repeats the empty source message.
- `Tutor IA / Chat con fuentes` is clear, but tutor entry is repeated from the hero CTA, tutor recommendation card, plan list, and nav.
- `Herramientas / Quiz, tarjetas y APA` is a destination, but the dashboard also repeats quick tools, recommended sessions, and plan actions that all go to the same place.
- `Espacio activo / Sin espacio` occupies a large sidebar card while the empty-state explanation is also shown elsewhere.

Main issue: the app gives the student several buttons that feel different but often lead to the same outcome. The student needs one obvious next step per state.

## Target Structure

Recommended navigation model:

| Current label | Proposed role | Suggested label | Purpose |
| --- | --- | --- | --- |
| Inicio | Primary overview | Resumen | Show state, progress, and one next action. |
| Mis materiales | Source library | Fuentes | Upload, process, and manage study sources. |
| Tutor IA | Chat workspace | Tutor | Ask questions and use cited context. |
| Herramientas | Practice/output workspace | Practica | Generate quiz, flashcards, and APA summary. |
| Espacio activo | Context selector | Compact space switcher | Select or create a study space without becoming a full CTA card. |

Interaction rule: the sidebar should be a map, not a second dashboard.

## Markable Task Plan

### Phase 0 - Audit and framing

- [x] Review the provided screenshot and identify the confusing repeated options.
- [x] Locate the real implementation files: `src/components/mentora-app.tsx` and `src/lib/i18n.ts`.
- [x] Identify the main repetition zones: `NavigationRail`, `RealStudentDashboard`, `TutorStudio`, and `ToolStudio`.
- [x] Make a final decision on labels: keep current labels or rename to `Resumen`, `Fuentes`, `Tutor`, and `Practica`.
- [x] Confirm whether the sidebar should show helper subtitles on desktop, or only labels plus compact status badges.

### Phase 1 - Information architecture cleanup

- [x] Define the four top-level destinations and write a short purpose for each one.
- [x] Separate UI elements into four categories: destination, primary action, secondary action, and status.
- [x] Remove actions from the sidebar except `create space` if it remains necessary there.
- [x] Convert document counts and source readiness into compact badges instead of full subtitle paragraphs where possible.
- [x] Make `Espacio activo` a compact selector/card, not a large empty-state explanation panel.
- [x] Ensure sign out/profile/settings stay visually secondary and do not compete with study actions.

### Phase 2 - One-primary-action dashboard

- [x] Define dashboard states:
  - [x] No space.
  - [x] Space exists but no sources.
  - [x] Sources processing.
  - [x] Sources ready.
  - [x] Generated study material exists.
- [x] For each state, assign exactly one primary CTA:
  - [x] No space or no sources: `Subir PDF` or `Crear espacio`.
  - [x] Processing: `Ver estado de fuentes`.
  - [x] Sources ready: `Preguntar al Tutor`.
  - [x] Artifacts exist: `Continuar practica` or `Ver resultados`.
- [x] Remove duplicate dashboard actions that send the user to the same view with different wording.
- [x] Consolidate `Plan de estudio`, `Herramientas rapidas`, and `Siguiente accion` into one guided next-step area.
- [x] Keep secondary actions visible but quieter, using text links or compact chips rather than full competing cards.
- [x] Replace English `Start Study` copy with Spanish copy consistent with the rest of the UI.

### Phase 3 - Sidebar simplification

- [x] Shorten nav labels and subtitles:
  - [x] `Inicio / Resumen de estudio` -> `Resumen`.
  - [x] `Mis materiales / 0 fuentes` -> `Fuentes` plus count badge.
  - [x] `Tutor IA / Chat con fuentes` -> `Tutor`.
  - [x] `Herramientas / Quiz, tarjetas y APA` -> `Practica` or `Crear`.
- [x] Keep active state visually strong, but reduce the pill/card size so it does not dominate the rail.
- [x] Remove repeated empty-space instructional copy from the sidebar.
- [x] Show `Sin espacio` as a compact state, then put the real explanation in the main content area.
- [x] Check mobile/tablet behavior so the navigation does not become a long list of repeated CTAs.

### Phase 4 - Empty-state flow

- [x] Design one clean no-space empty state in the main workspace.
- [x] Make the empty state explain the order clearly: create/select space -> upload source -> ask or practice.
- [x] Use only one prominent action in the no-space state.
- [x] Hide or disable tutor/tools affordances with calm explanatory copy until sources exist.
- [x] Ensure disabled states do not look like errors or broken buttons.

### Phase 5 - Tutor IA cleanup

- [x] Keep the Tutor page focused on the conversation first.
- [x] Move advanced controls such as model and mode selection into a quieter header area or collapsible settings treatment.
- [x] Keep source readiness visible as status, not as another CTA.
- [x] Avoid repeating upload controls if the page already has a clear source-status path.
- [x] Ensure `Tutor IA`, `Consola del tutor`, and `Chat con fuentes` do not all compete as headings for the same concept.

### Phase 6 - Tools and practice cleanup

- [x] Decide whether `Herramientas` should become `Practica`, because the student outcome is practice/review, not generic tools.
- [x] Group quiz, flashcards, and APA summary under one generator surface instead of presenting many separate dashboard buttons.
- [x] Use a segmented control or tabs for `Resumen`, `Tarjetas`, and `Quiz`.
- [x] Keep APA summary as part of `Resumen` or an advanced output option if it is too academic for the first-level choice.
- [x] Show generated artifacts as results/history, not as another call-to-action cluster.
- [x] If no sources are ready, show one upload/source CTA and suppress all generator buttons.

### Phase 7 - Copy and language pass

- [x] Make Spanish copy consistent and student-centered.
- [x] Remove mixed-language labels such as `Start Study`.
- [x] Prefer outcome labels over feature labels:
  - [x] `Practicar` instead of `Herramientas rapidas`.
  - [x] `Preguntar al Tutor` instead of generic `Start Study`.
  - [x] `Subir fuente` or `Subir PDF` instead of multiple upload variants.
- [x] Ensure no section repeats the same instruction sentence already shown in the same viewport.
- [x] Keep helper copy short enough that the sidebar does not feel like documentation.

### Phase 8 - Visual hierarchy and accessibility

- [x] Verify only one element per screen has primary-button visual weight.
- [x] Use Mentora blue/lavender accent consistently and avoid extra arbitrary colors.
- [x] Keep all interactive text WCAG AA contrast compliant.
- [x] Keep CTA labels on one line at desktop.
- [x] Maintain Geist typography and tight but readable headings.
- [x] Use motion only for state changes and hover/tap feedback, not constant animation.

### Phase 9 - Implementation and verification

- [x] Update `src/lib/i18n.ts` with final labels and helper copy.
- [x] Update `NavigationRail` in `src/components/mentora-app.tsx`.
- [x] Update `RealStudentDashboard` to enforce one primary next action.
- [x] Update `TutorStudio` to reduce competing controls.
- [x] Update `ToolStudio` to group practice generators.
- [x] Review `src/app/globals.css` only for targeted class cleanup; avoid large `!important` overrides.
- [x] Run lint/typecheck/build or the closest available project checks.
- [x] Run responsive QA for mobile and desktop.
- [ ] Capture before/after screenshots for the sidebar and dashboard.
- [x] Mark completed checklist items in this file after implementation.

### Phase 10 - Duplicate surface removal

- [x] Remove the duplicate authenticated top title from the utility command bar.
- [x] Remove the old `WorkspaceHeader` panel that repeated page title, model selector, upload, metrics, and readiness.
- [x] Remove the home right-rail study pulse panel that repeated dashboard progress and recent activity.
- [x] Keep model selection only inside the Tutor and Practice work areas where the choice affects the task.
- [x] Keep upload as the primary source action in dashboard/source states instead of repeating it in a page header.
- [x] Remove unused component helpers from the deleted panels so the older structure cannot reappear accidentally.
- [x] Compress the sidebar active-space area into a context row instead of repeating the no-space explanation.
- [x] Remove duplicate no-source helper copy from the Practice generator header.

## Run Notes

- [x] `npm run typecheck` passed.
- [x] `npm run lint` passed.
- [x] `npm run build` passed.
- [x] `npm run qa:responsive` passed on desktop and mobile with no horizontal overflow and no console errors.
- [x] Contrast sanity check passed for the new interactive foreground/background pairs.
- [ ] Authenticated dashboard screenshots are still pending because no local authenticated session was available during this pass.
- [ ] Re-run checks after duplicate surface removal.

## Non-goals

- Do not remove the core features: sources, tutor chat, quiz, flashcards, and APA summary.
- Do not introduce a new visual system or a new accent palette.
- Do not redesign the entire app shell before the navigation/action hierarchy is solved.
- Do not add more dashboard cards to solve the problem; reduce and consolidate first.
