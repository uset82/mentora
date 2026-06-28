# Notebook Layout Audit

Date: 2026-06-27
Branch: `carlos/notebook-style-study-workspace`

## Current Screens Captured

- Inicio: `docs/audit-screenshots/inicio.png`
- Materiales: `docs/audit-screenshots/materiales.png`
- Tutor IA: `docs/audit-screenshots/tutor-ia.png`
- Practica: `docs/audit-screenshots/practica.png`
- Perfil: `docs/audit-screenshots/perfil.png`
- Progreso: not captured because the current app has no `Progreso` navigation item or separate page.

## Current Structure

Mentora currently uses a left navigation rail with disconnected views:

- `Inicio`
- `Materiales`
- `Tutor IA`
- `Practica`
- `Perfil`

The main app component switches between those views inside `src/components/mentora-app.tsx`. This creates a fragmented study flow: students move between separate screens for materials, chat, and practice instead of staying inside one focused workspace.

## Comparison With Three-Panel Reference

The reference layout keeps the study loop visible at once:

- Left panel: sources and material selection.
- Center panel: chat as the main thinking surface.
- Right panel: study tools and generated outputs.

Mentora already has the core pieces, but they are split across separate sections. The next architecture should merge them into one `Estudio` workspace with `Materiales`, `Tutor IA`, and `Studio` visible together on desktop and available through bottom tabs on mobile.

## What Should Be Merged

- `Inicio` greeting and primary next action should become the `Estudio` topbar or welcome state.
- `Materiales` should become the left sources panel.
- `Tutor IA` should become the center chat panel.
- `Practica` should become the right Studio tools panel.
- Recent material state, upload actions, and practice generation should share the same selected-material context.

## What Should Be Removed

- Separate page hopping for normal study flow.
- Duplicate upload entry points that compete visually.
- Large empty sections that do not help the student act.
- Student-facing backend language such as ingestion, RAG, chunks, embeddings, or pipeline status.
- Persistent route/status explanations that make the app feel like an internal dashboard.

## What Should Stay Separate

- `Perfil`, because it is account and learning-preference management.
- `Progreso`, but only once real analytics exist.
- Advanced settings, which should stay behind profile/settings instead of the main study workspace.
- Full advanced library or practice pages only if later analytics or bulk-management workflows require them.
