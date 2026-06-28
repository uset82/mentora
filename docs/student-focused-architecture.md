# Mentora Student-Focused Architecture

Mentora is a student study assistant, not an admin pipeline dashboard. The primary product action is always studying: ask Tutor IA, upload material, or create practice.

## Navigation

The student navigation is:

- Estudio as the default workspace canvas.
- Perfil from the topbar profile menu.

`Materiales`, `Tutor IA`, and `Studio` live inside `Estudio` as panels. The desktop app shell should not render a repeated full-height sidebar for profile, Estudio, and active space cards; those controls belong in the workspace topbar. `Progreso` should stay as a shortcut only until real progress analytics exist. Do not expose backend state as navigation.

## Primary Flow

1. A new student lands in Estudio and sees one workspace: Materiales, Tutor IA, and Studio.
2. Tutor IA works without material and becomes grounded when selected material is ready.
3. Materiales stores uploaded PDFs, images, DOCX, TXT/Markdown documents, links, and notes.
4. Studio shows useful tools at all times, disabled only when selected material is required.

## Implementation Notes

- `src/components/mentora-app.tsx` still owns app state for now.
- `src/components/study-workspace/` owns the notebook-style workspace panels.
- `src/components/ui/` contains shared UI primitives extracted during the workspace refactor.
- Chat upload is handled by `src/components/chat/chat-composer.tsx` and `/api/materials`.
- PDF remains the most complete backend path.
- Text, Markdown, notes, links, and DOCX extract readable text into chunks.
- Images are stored and shown immediately; OCR can be added later.
