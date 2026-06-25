# Mentora

Mentora is a production-oriented AI study platform built with Next.js, Supabase, pgvector, OpenAI, and optional OpenRouter testing models.

## What Works

- Supabase Auth sign-up/sign-in.
- Tenant/profile creation through a Supabase trigger.
- Student study spaces with RLS isolation.
- Private PDF upload to Supabase Storage.
- Server-side PDF text extraction, chunking, OpenAI embeddings, and pgvector storage.
- Citation-backed tutor chat scoped to the active study space.
- Quiz, flashcard, and APA summary generation saved as artifacts.
- AI usage logging by tenant, user, task, provider, model, tokens, and latency.
- Spanish/English UI switching.
- OpenRouter text-generation mode for free or low-cost LLM testing.

## Setup

1. Create a Supabase project and run `supabase/migrations/0001_mentora_core.sql` in the SQL editor or through the Supabase CLI.
2. Confirm the migration created the private `documents` storage bucket, storage object policies, auth profile trigger, and `match_document_chunks` RPC.
3. In Supabase Auth, enable email/password. If email confirmations are on, users must confirm before the app can load their generated profile.
4. Copy `.env.example` to `.env.local` and fill in Supabase and model credentials.
5. For production OpenAI routing, keep `AI_PROVIDER=openai`.
6. For OpenRouter testing, set:

```bash
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=openrouter/free
```

OpenRouter's current docs describe `openrouter/free` as the free models router; availability and rate limits can change. Chat can run through OpenRouter with `AI_PROVIDER=openrouter` and `OPENROUTER_API_KEY`. Document ingestion uses OpenAI embeddings when `OPENAI_API_KEY` is present; otherwise Mentora falls back to local 1536-dimension search embeddings so PDFs can still become ready and support grounded retrieval. Keep `OPENAI_EMBEDDING_DIMENSIONS=1536` unless you also change the `document_chunks.embedding vector(1536)` migration.

## Operational Notes

- New users get an individual tenant and profile through the `on_auth_user_created` trigger.
- PDFs are uploaded through `/api/ingest`, stored privately in the `documents` bucket, parsed per page, embedded in batches, and marked `ready` or `failed`.
- Tutor chat streams newline-delimited JSON from `/api/chat`; quiz, flashcard, and APA summary outputs are persisted in `generated_artifacts` through `/api/tools`.
- Local API calls require a Supabase bearer token. Browser flows obtain it from Supabase Auth automatically.
- If a pre-existing Auth user was created before the migration, create a matching row in `profiles` or ask the user to sign up again after the migration is installed.

## Development

```bash
npm.cmd run dev
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
```

If `npm` is blocked by PowerShell execution policy on Windows, use `npm.cmd`.
