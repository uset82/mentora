# FinalMasterPlanMentora

Mentora is a fully functional, production-oriented learning web app for college and university students. This is not an MVP or mock shell. Every student must create an account and log in before accessing study spaces, documents, chat, generated tools, or profile settings.

## Non-Negotiable Product Rules

- Authentication is required before the app loads private learning data.
- Each user can only access their own tenant, study spaces, documents, document chunks, conversations, messages, generated tools, and profile.
- Admin-only pages must remain restricted to admin users for KPIs, user administration, and user counts.
- Uploaded PDFs must be processed into readable study text, chunks, embeddings, and citations before the tutor can answer from them. A document must not be marked ready if extraction only produced page markers, empty text, or unusable fragments.
- PDF ingestion must include an OCR/vision fallback for scanned, image-based, slide-heavy, or visually rendered PDFs so the tutor, summaries, flashcards, quizzes, and study cards can use the actual document content whenever a readable page image exists.
- Chat models run through OpenRouter when `AI_PROVIDER=openrouter` and `OPENROUTER_API_KEY` is configured.
- PDF ingestion must remain operational without `OPENAI_API_KEY`; when OpenAI embeddings are unavailable, Mentora uses local 1536-dimension search embeddings so documents can still become ready and support grounded retrieval.
- The tutor must answer coherently from uploaded sources, cite evidence, and avoid duplicated or generic fallback responses.
- Mentora must ask learning preference questions after account creation/sign-in so each student receives a customized study experience.
- Learning preference questions must use required dropdown/select options instead of free text so students cannot skip the profile or enter unusable answers.
- Mentora never diagnoses, labels, or categorizes students clinically. The learning profile only captures preferences and support needs such as pacing, examples, focus support, and practice style, including neurodivergent-friendly options without naming or assigning labels.

## Functional Scope

- Account creation, login, logout, and profile loading through Supabase Auth.
- Private tenant/profile creation for every new user.
- Per-user study spaces with strict row-level isolation.
- Private PDF upload to Supabase Storage.
- Server-side PDF validation, text extraction, OCR/vision fallback, content-quality checks, chunking, OpenAI or local embeddings, pgvector indexing, and ready/failed document status.
- Source-grounded chat through the selected AI provider with citations from uploaded material.
- Study tools from ready sources: quizzes, flashcards, and APA-style summaries.
- Learning preference profile with questions for goal, session length, explanation style, focus support, and practice style.
- Premium, light, minimalistic student-facing UI for university workflows.
- Admin KPI and user management surfaces restricted to admin role.

## Learning Profile Requirements

The first-run profile asks how the student prefers to learn through required dropdown selections. Required fields include learning goal, ideal session length, explanation style, focus support, practice style, and study preference. Free-text answers are avoided in this first-run profile to reduce skipped, ambiguous, or unusable responses.

This is not a psychological test and must never be presented as one. The profile is an academic learning-preference model accurate enough to help Mentora adapt explanations, study tools, pacing, examples, quiz style, flashcards, summaries, review rhythm, and focus support. The UI copy must make it explicit that Mentora does not diagnose or label students.

The saved `profiles.learning_profile` must be injected into tutor prompts and study-tool generation prompts so chat answers, quizzes, flashcards, and summaries adapt to the student instead of remaining generic.

## Student-first UI/UX Design System

The active design source is `DESIGN.md` in the Mentora project folder. It supersedes older Quizlet-style and broad visual notes so there is no confusion.

Visual direction: Mentora uses the active light premium EdTech design in `DESIGN.md`, adapted from the June 9 UI/UX mockups. The product should feel like a polished LATAM university study platform: soft blue/violet/cyan gradients, rounded glass cards, friendly AI mascot visuals, strong CTA buttons, student dashboard widgets, and clear study workflows. The old cinematic monochrome direction is no longer active.

First-page requirement: the landing page must look like a real premium product page, not an app shell. It includes navbar, "Estudia mejor con IA" hero, laptop/product mockup, floating upload/tutor/flashcard/progress cards, university proof strip, six feature cards, "Así funciona Mentora" steps, testimonials, account access, and footer. The login/create-account area remains on the public page, but no private study data or tools are accessible until authentication.

UI principles: Preserve existing functionality, data contracts, OpenRouter model gating, upload behavior, privacy rules, and learning profile requirements. Use youthful but trustworthy visuals: rounded cards, soft shadows, gradient CTAs, colorful icon containers, clear progress states, and student-friendly Spanish copy.

Animation principles: Use Framer Motion and lightweight CSS animations for hero entrance, floating cards, hover lift, progress polish, and onboarding microinteractions. Respect reduced-motion preferences.

Component style guidelines: Cards use 24-32px radius, white/glass surfaces, soft indigo borders, and generous padding. Buttons use blue/violet/cyan gradients. Inputs are rounded, readable, and keyboard friendly. The private workspace should align with the same premium light dashboard language.

Recommended libraries: Continue using the existing stack: Tailwind CSS, Framer Motion, and Lucide React. Do not add heavy animation, 3D, Aceternity UI, or Magic UI unless a future requirement clearly justifies a lightweight isolated component.

Accessibility and responsive rules: Maintain strong contrast, real labels, keyboard-accessible buttons, visible focus states, readable mobile layouts, and responsive spacing for desktop, tablet, and phone.

Fun but not childish: Use energy through cinematic typography, product visuals, progress cues, and elegant motion. Avoid cartoonish visuals, noisy decoration, over-saturated UI gradients, or language that feels unserious for college-level learners.

## Deployment Readiness

Before deployment, the app must pass typecheck, lint, production build, and responsive QA. Environment variables for Supabase and the configured chat provider must be present. OpenAI embeddings are optional; they improve semantic retrieval, while local search embeddings keep the app functional when OpenAI is not configured.
