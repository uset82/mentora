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


## Mentora Liquid Workspace

The authenticated student dashboard uses a restrained iOS-inspired Liquid Glass direction. Liquid materials are reserved for navigation, command surfaces, and primary action controls; content cards stay mostly solid/translucent for readability.

This direction now applies to the full student platform: Sidebar, Inicio, Tutor IA, Chat composer, Materiales, Practica, Perfil, empty states, and mobile navigation. The implementation source of truth is `planesupdates/UIdesign.md`, with plugin usage documented in `docs/ui-designer-plugin.md`.

### Liquid Tokens
- **Background:** `#f7f9ff` with subtle blue/cyan radial light only.
- **Ink:** `#071038`; **body copy:** `#17224a`; **muted:** `#4c5a7a`.
- **Active accent:** Mentora blue/cyan only (`#2563eb` / `#06b6d4`) for dashboard navigation, focus, progress, and primary actions.
- **Glass tint:** white at `0.58-0.90` alpha with `blur(20px-26px)` and `saturate(150%)`.
- **Rim/border:** blue-tinted borders around `rgba(37, 99, 235, 0.09-0.18)` plus white inset highlights.
- **Shadow:** soft blue-tinted depth (`rgba(42, 64, 128, 0.06-0.13)`), never heavy black shadows.
- **Radius:** `18px` for controls, `26-30px` for shell cards and glass containers.
- **Motion:** spring-based hover/press only; no infinite shimmer, no constant ambient loops.

### Reusable Materials
- **`GlassNav`:** rounded vertical tab rail with active liquid capsule, compact tablet mode, and mobile bottom tab bar.
- **`GlassToolbar`:** sticky command bar with current space, current view, one primary `Start Study` CTA, language/help/sign-out utilities.
- **`LiquidButton`:** animated glassy primary button with shine layer, spring hover/press, disabled state, and reduced-motion fallback.
- **`SolidContentCard`:** readable white/translucent cards for materials, plans, tutor guidance, and quick tools.
- **`MutedInset`:** quiet inset rows for lists, progress, study plan steps, and recent material activity.
- **`mentora-glass`:** reusable frosted glass panel from `src/styles/tokens.css`.
- **`mentora-glass-strong`:** stronger text-safe glass surface for chat, cards, forms, and panels with long copy.
- **`mentora-action-card`:** unified action/card material for source rows, empty states, and practice/results surfaces.
- **`mentora-primary-button`:** blue/lavender primary action with clear hover, disabled, and focus states.

### Accessibility Guardrails
- Text-heavy surfaces must use `--mentora-surface-strong` or solid white.
- Frosted blur should not sit behind long paragraphs or small body text unless the background is strong enough for contrast.
- Focus states use `--mentora-focus-ring`.
- Reduced transparency is handled in `src/styles/tokens.css` through `prefers-reduced-transparency` and `@supports not backdrop-filter` fallbacks.
- Disabled controls remain readable and visibly inactive; they should not look broken or like active controls.

### Dashboard Rules
- Keep one dominant action: `Start Study`. Upload, materials, and tools are secondary chips.
- Use glass for controls and navigation, not every content surface.
- Preserve WCAG AA contrast, visible keyboard focus, and `prefers-reduced-motion` behavior.
- Mobile must use a purpose-built bottom glass tab bar instead of squeezing the desktop sidebar.
- Do not add new dashboard styling by piling more `!important` overrides into `globals.css`; prefer component classes and small reusable material classes.

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
