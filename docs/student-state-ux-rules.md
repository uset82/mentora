# Student State UX Rules

Student UI may show only simple learning states:

- `Preparando`
- `Listo`
- `No se pudo preparar`
- `Sin material`

Never show backend terms in student-facing surfaces:

- ingestion
- chunks
- RAG
- embedding
- processing_status
- pipeline
- indexation

## Empty States

Each empty state must have:

- short title
- one sentence
- one primary action
- optional secondary action

Examples:

- Tutor: `Empieza a estudiar` plus `Preguntale algo a Mentora o usa + para subir material.`
- Materiales: `Sin materiales` plus `Sube tu primer material para estudiar con Tutor IA y practica.`
- Practica: visible disabled tool cards plus `Sube un material para activar esta herramienta.`
