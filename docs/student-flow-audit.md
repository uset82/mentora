# Student Flow Audit

Use this checklist before shipping UI changes.

## Must Pass

- Inicio does not render persistent `Ruta sugerida`.
- Tutor IA does not render an empty `Contexto vivo` panel.
- Tutor IA can send a message with no material.
- The chat composer has a `+` menu for upload choices.
- Materiales is understandable with zero materials.
- Practica shows tools with zero materials and explains why they are disabled.
- Student UI does not show ingestion, chunks, RAG, embedding, or processing status terms.
- Mobile Tutor keeps the composer reachable and has no horizontal overflow.

## Manual Scenarios

1. New student opens app.
2. New student opens Tutor IA.
3. Student asks a general question.
4. Student uploads a PDF from chat.
5. Student opens Materiales with zero materials.
6. Student opens Practica with zero materials.
7. Student uploads one PDF and sees `Preparando`, then `Listo`.
