# Mentora UI Design System

Forked from `E:\Kipia\Mentora\UI\mentora_ui_design_instructions_for_codex.md` and adapted into the active Mentora implementation direction.

## Product Direction

Mentora is a premium, high-tech, friendly EdTech web app for LATAM college, university, and institute students. The UI should feel youthful, motivating, polished, and trustworthy. It must not feel like a generic SaaS dashboard or a mock app shell.

## Active Visual Style & Design Dials

Mentora uses the following core Design Dials to guide its interface layouts and interactive elements:
- **`DESIGN_VARIANCE: 6`** (balanced asymmetry, clean layout rails, no generic repeating lists)
- **`MOTION_INTENSITY: 5`** (calm page entries, smooth spring-based hover states, no perpetual animation noise)
- **`VISUAL_DENSITY: 5`** (tidy, high-hierarchy panels for a unified cockpit layout)

### Color System
- **Light background:** `#f7f9ff`
- **Main text (ink):** `#071038`
- **Secondary text:** `#4c5a7a`
- **Primary gradient:** `#4f46e5 -> #2563eb -> #06b6d4` (use sparingly on landing heroes and main CTAs, never on simple labels)
- **Accent colors:** Violet `#a855f7`, Coral `#ff6b8a`, Mint `#16c7a3`, Yellow `#f9c74f`
- **Palette lock:** Pick one active accent for the page and stick to it. Do not mix competing accents on the same screen.

### Materiality & Assets
- **Surfaces:** Clean glass panels or white cards with subtle, tint-matched borders.
- **Cards:** Rounded 16-24px, soft hue-tinted shadows, and tactile scale-down interactive hover lifting.
- **Typography:** Display headlines should use Geist sans (`var(--font-geist-sans)`) with a tight type-scale (`tracking-tighter leading-none`). Keep subtext focused and clean.
- **Icons:** Standardized line-weight icons from Phosphor or Tabler families. Do not place every icon in a different color container—use negative space and subtle labels.
- **Visuals:** High-quality diagrams, clean layout previews, and minimal SVG monograms. Avoid generic "div-built mockups" or generic stock placeholders.

### Implementation Integrity
- **Utility CSS:** Adjust styling directly in the React component tree using Tailwind utilities. Do not write thousands of lines of overrides using `!important` in `globals.css` as it disables Tailwind class responsiveness and customizability.

## Required Screens

1. Landing page:
   - Navbar with Mentora logo, links, language, and CTA.
   - Hero headline: "Estudia mejor con IA".
   - Product mockup with laptop, upload card, tutor card, flashcards, progress, mascot, and trust badges.
   - University/social proof strip.
   - Six feature cards.
   - Four-step "Así funciona Mentora" section.
   - Student testimonials.
   - Dark blue footer.

2. Onboarding / learning profile:
   - Friendly, non-clinical learning preference setup.
   - Required dropdown/select answers.
   - Visual progress and recommendations.
   - Mentora must not diagnose, label, or clinically classify students.

3. Student dashboard:
   - Left sidebar.
   - Greeting / study workspace.
   - Upload and ask actions.
   - Courses/materials/progress/recommendation cards.
   - Study pulse and quick tools.

4. Study workspace:
   - Left sidebar.
   - Central study/document area.
   - Right Tutor IA panel.
   - OpenRouter model selector and free/paid gating.
   - Tools for summaries, flashcards, quiz, APA, and notes.

## Functional Rules

- Every student must log in before accessing private data.
- Each user can only access their own spaces, documents, tools, chat, and profile.
- Chat must use OpenRouter when configured.
- Mentora only provides free model access; paid models require the student to connect their own account.
- Upload processing, source retrieval, citations, and learning-profile personalization remain core functionality.
- UI changes must not break Supabase auth, OpenRouter model loading, document ingestion, or private row-level access.
