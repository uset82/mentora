# Mentora Implementation Checklist

- [x] Phase 1 Foundation: scaffold, env validation, Supabase clients, auth surface, tenant-aware schema, RLS baseline, and app shell.
- [x] Phase 2 Knowledge Ingestion: PDF upload, parsing, chunking, embeddings, status handling, and document recovery.
- [x] Phase 3 RAG Tutor: citation retrieval, grounded tutoring, streaming UX, and conversation persistence.
- [x] Phase 4 Study Tools: quiz, flashcards, APA summary, artifact saving, and usage logging.
- [x] Phase 5 Product Guardrails: settings/profile, bilingual polish, errors/retries, documentation, and verification.
- [x] Operational Completeness: Supabase storage policies, auth/profile trigger notes, per-page PDF chunking, 1536-dimension embedding enforcement, API error responses, OpenRouter free-router documentation, and local verification commands.
- [x] Post-Agent Security Hardening: profile column update grants, stricter storage policies, CSP headers, safer PDF validation, no raw client Supabase errors, and user-scoped rate-limit keys.
- [x] Post-Agent Operational Hardening: public/server env split, persisted chat history loading, in-app study-space creation, responsive QA failure checks, and refreshed desktop/mobile browser verification.
- [x] June 16 Verification Pass: local Next 16 docs reviewed before code decisions, typecheck/lint/build passed, responsive QA passed on desktop/mobile, and localhost browser verification passed with no console errors.
- [x] June 18 Verification Pass: tightened PDF content-quality detection for Unicode text, fixed mobile landing mockup flow, made responsive QA wait for settled UI instead of network idle, and revalidated typecheck/lint/build/responsive QA.
- [x] June 23 Verification Pass: completed the Miro-aligned interface, added OpenRouter free/paid model selection with in-memory BYOK verification, classified connection failures correctly, tightened interaction targets and transitions, and revalidated typecheck/lint/build/responsive QA plus desktop/mobile browser behavior.
