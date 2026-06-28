
# UI Designer Plugin, Agents, Skills, and Glassy Clean iOS 26 Style

## Purpose

Mentora already has a UI designer plugin installed with agents and design skills that can help Codex improve the visual quality of the platform.

Codex must use this installed UI designer plugin as part of the implementation process instead of manually guessing UI styles.

The goal is to make the platform look:

```text
Clean
Glassy
Modern
Soft
Academic
Student-friendly
iOS 26 / Liquid Glass inspired
Easy to read
Not overloaded
Not generic AI UI
````

Important:

```text
Use iOS 26 / Liquid Glass as inspiration, not as a direct copy.
Mentora must keep its own identity as an academic study platform.
```

---

# UI Designer Plugin Rule

The UI designer plugin has already been installed.

Codex must not ignore it.

Tasks:

* [x] Detect the installed UI designer plugin.
* [x] Identify what agents, skills, commands, or configuration files the plugin provides.
* [x] Document the plugin usage in:

```text
docs/ui-designer-plugin.md
```

* [x] Use the plugin before redesigning major UI sections.

* [x] Use the plugin to review:

  * [x] Dashboard layout.
  * [x] Sidebar.
  * [x] Tutor IA chat.
  * [x] Chat composer.
  * [x] Materiales page.
  * [x] PrÃ¡ctica page.
  * [x] Profile page.
  * [x] Empty states.
  * [x] Buttons.
  * [x] Cards.
  * [x] Mobile layout.

* [x] Do not reinstall the plugin unless it is missing.

* [x] If the plugin exposes commands, list them in `docs/ui-designer-plugin.md`.

* [x] If the plugin exposes agents, define when each agent should be used.

* [x] If the plugin exposes skills, map each skill to the relevant UI task.

Acceptance criteria:

* [x] Codex confirms the UI designer plugin is available.
* [x] Codex documents how to use the plugin.
* [x] Codex uses the plugin before implementing visual redesign.
* [x] UI decisions are not random or improvised.

---

# UI Design Agents to Use

Codex should use the installed UI designer plugin as if it contains specialized agents.

If the plugin has similar agents or skills, map them to these roles.

## 1. Visual Design Agent

Purpose:

```text
Create the overall look and feel of Mentora.
```

Use for:

* [x] Color palette.
* [x] Glassy surfaces.
* [x] Card hierarchy.
* [x] Shadows.
* [x] Gradients.
* [x] Backgrounds.
* [x] Visual consistency.

Output expected:

```text
A clear visual direction before coding.
```

---

## 2. UX Simplification Agent

Purpose:

```text
Remove distractions and make the app easier for students.
```

Use for:

* [x] Removing unnecessary panels.
* [x] Simplifying â€œRuta sugeridaâ€.
* [x] Replacing â€œContexto vivoâ€.
* [x] Making Tutor IA chat-first.
* [x] Reducing empty-state noise.
* [x] Improving navigation.

Output expected:

```text
A simpler screen-by-screen UX proposal.
```

---

## 3. Component System Agent

Purpose:

```text
Convert visual design into reusable components.
```

Use for:

* [x] Buttons.
* [x] Cards.
* [x] Inputs.
* [x] Sidebar items.
* [x] Chat bubbles.
* [x] Upload chips.
* [x] Badges.
* [x] Empty states.
* [x] Modal/dialog design.

Output expected:

```text
A reusable component system that avoids one-off styling.
```

---

## 4. Accessibility Agent

Purpose:

```text
Make the glassy UI readable and usable.
```

Use for:

* [x] Text contrast.
* [x] Focus states.
* [x] Keyboard navigation.
* [x] Reduced transparency mode.
* [x] Motion reduction.
* [x] Disabled states.
* [x] Mobile readability.

Output expected:

```text
A glassy UI that still remains readable and accessible.
```

---

## 5. Mobile Layout Agent

Purpose:

```text
Make Mentora work well on phones and tablets.
```

Use for:

* [x] Responsive sidebar.
* [x] Bottom navigation if needed.
* [x] Chat composer on mobile.
* [x] Upload menu on mobile.
* [x] Material cards on mobile.
* [x] Avoiding horizontal overflow.

Output expected:

```text
A clean mobile-first version of the main study flow.
```

---

# Glassy Clean iOS 26 / Liquid Glass Direction

## Design Inspiration

Mentora should use a controlled â€œLiquid Glass inspiredâ€ style.

Inspired by:

```text
iOS 26 Liquid Glass
visionOS-like depth
Soft frosted panels
Rounded translucent controls
Subtle refraction-like highlights
Layered cards
Clean academic SaaS layout
```

But Mentora must avoid:

```text
Over-transparent panels
Low text contrast
Hard-to-read glass effects
Too many reflections
Too much blur
Decorative glass that distracts from studying
Fake Apple UI cloning
```

Core rule:

```text
Glass is for surfaces and hierarchy.
Content must stay readable.
```

---

# Visual Style Rules

## Background

Use a calm academic canvas:

```text
Soft blue-white background
Subtle grid or gradient
Very light depth
No noisy patterns
```

Recommended:

```css
--mentora-bg: #f6f9ff;
--mentora-bg-grid: rgba(37, 99, 235, 0.045);
--mentora-bg-glow-blue: rgba(59, 130, 246, 0.14);
--mentora-bg-glow-violet: rgba(124, 58, 237, 0.12);
```

Tasks:

* [x] Replace noisy or inconsistent backgrounds.
* [x] Keep the grid subtle.
* [x] Use soft gradients only to create depth.
* [x] Avoid heavy decorative backgrounds behind text.

---

## Glass Panels

Use glass panels for important containers:

```text
Sidebar
Dashboard cards
Tutor IA panel
Chat composer
Material cards
Upload menu
Modal dialogs
```

Recommended tokens:

```css
--glass-bg: rgba(255, 255, 255, 0.72);
--glass-bg-strong: rgba(255, 255, 255, 0.88);
--glass-border: rgba(148, 163, 184, 0.28);
--glass-shadow: 0 20px 60px rgba(15, 23, 42, 0.08);
--glass-blur: 18px;
--glass-radius: 24px;
```

Example utility class:

```css
.mentora-glass {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border-radius: var(--glass-radius);
}
```

Tasks:

* [x] Create a reusable glass panel class.
* [x] Apply glass style consistently.
* [x] Do not manually duplicate glass styles in every component.
* [x] Use stronger white background for text-heavy cards.
* [x] Use lighter transparency only for decorative cards.

Acceptance criteria:

* [x] Panels feel glassy and modern.
* [x] Text remains readable.
* [x] The UI looks clean, not blurry or messy.

---

## Buttons

Primary actions should feel modern, bright, and tactile.

Recommended:

```css
--button-primary-bg: linear-gradient(135deg, #4f46e5, #2563eb);
--button-primary-hover: linear-gradient(135deg, #4338ca, #1d4ed8);
--button-primary-text: #ffffff;
--button-secondary-bg: rgba(255, 255, 255, 0.76);
--button-secondary-border: rgba(148, 163, 184, 0.32);
```

Tasks:

* [x] Use gradient only for primary actions.
* [x] Use glass white buttons for secondary actions.
* [x] Use clear hover states.
* [x] Use clear active states.
* [x] Use clear disabled states.
* [x] Do not use ugly gray disabled buttons.

Acceptance criteria:

* [x] Primary action is always obvious.
* [x] Disabled buttons do not look broken.
* [x] Buttons feel consistent across the platform.

---

## Chat Composer

The chat composer is one of the most important UI elements.

Target:

```text
Clean ChatGPT-style composer
White/glass surface
+ attachment button
Readable placeholder
Clear send button
No dead gray block
```

Recommended structure:

```text
[ + ]  Pregunta lo que quieras o sube material...             [ Send ]
```

Tasks:

* [x] Apply glassy clean style to chat composer.
* [x] Add `+` attachment button.
* [x] Use soft white background.
* [x] Add subtle border.
* [x] Add visible focus ring.
* [x] Add clear send button.
* [x] Add loading/cancel state.
* [x] Add attachment chips above the input.
* [x] Avoid dark gray disabled input.
* [x] Show disabled reason only when needed.

Acceptance criteria:

* [x] Chat composer looks premium.
* [x] Students can upload files from the composer.
* [x] Composer does not look disabled by default.
* [x] Composer is readable on desktop and mobile.

---

## Sidebar

The sidebar should feel like a clean iOS-style navigation surface.

Tasks:

* [x] Use glassy white surface.
* [x] Use soft shadows.
* [x] Use rounded active navigation pills.
* [x] Use consistent icon size.
* [x] Use compact labels.
* [x] Remove unnecessary secondary text unless useful.
* [x] Keep student name/profile clean.
* [x] Make logout less visually dominant.

Recommended active item:

```css
.sidebar-item-active {
  background: rgba(37, 99, 235, 0.10);
  border: 1px solid rgba(37, 99, 235, 0.18);
  color: #1d4ed8;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.8);
}
```

Acceptance criteria:

* [x] Sidebar is visually calm.
* [x] Active section is clear.
* [x] Logout no longer dominates the UI.
* [x] Navigation feels premium and simple.

---

## Cards

Cards should use one consistent design.

Tasks:

* [x] Create shared `GlassCard` component.
* [x] Create shared `ActionCard` component.
* [x] Create shared `EmptyStateCard` component.
* [x] Create shared `MetricCard` component.
* [x] Replace one-off card styling.
* [x] Use consistent padding.
* [x] Use consistent radius.
* [x] Use consistent border.
* [x] Use consistent shadow.

Acceptance criteria:

* [x] Dashboard cards look like one system.
* [x] Material cards match practice cards.
* [x] Empty states match the rest of the UI.

---

# Phase UI-A â€” Use UI Designer Plugin Before Each Screen

Before redesigning each screen, Codex must run the UI designer plugin or consult its agents/skills.

Screens:

* [x] Inicio.
* [x] Tutor IA.
* [x] Materiales.
* [x] PrÃ¡ctica.
* [x] Progreso.
* [x] Perfil.
* [x] Upload menu.
* [x] Empty states.
* [x] Mobile layout.

For each screen, Codex must produce:

```text
1. Current problem
2. Student goal
3. Simplified layout
4. Visual treatment
5. Components to reuse
6. Accessibility risks
7. Implementation steps
```

Acceptance criteria:

* [x] No screen is redesigned blindly.
* [x] UI designer plugin is used consistently.
* [x] Each screen follows the same glassy academic style.

---

# Phase UI-B â€” Create Glassy Design Tokens

Create or update:

```text
src/app/globals.css
src/styles/tokens.css
tailwind.config.ts
DESIGN.md
```

Tasks:

* [x] Add glass color tokens.
* [x] Add blur tokens.
* [x] Add border tokens.
* [x] Add radius tokens.
* [x] Add shadow tokens.
* [x] Add focus ring tokens.
* [x] Add disabled state tokens.
* [x] Add reduced transparency fallback.
* [x] Add dark mode fallback if supported.

Recommended CSS:

```css
:root {
  --mentora-canvas: #f6f9ff;
  --mentora-surface: rgba(255, 255, 255, 0.82);
  --mentora-surface-strong: rgba(255, 255, 255, 0.94);
  --mentora-border: rgba(148, 163, 184, 0.28);
  --mentora-text: #07113d;
  --mentora-muted: #64748b;

  --mentora-primary: #2563eb;
  --mentora-primary-2: #4f46e5;
  --mentora-violet: #7c3aed;
  --mentora-cyan: #06b6d4;
  --mentora-yellow: #ffd02f;

  --mentora-glass-blur: 18px;
  --mentora-glass-radius: 24px;
  --mentora-glass-shadow: 0 24px 70px rgba(15, 23, 42, 0.10);
  --mentora-focus-ring: 0 0 0 4px rgba(37, 99, 235, 0.18);
}
```

Reduced transparency fallback:

```css
@media (prefers-reduced-transparency: reduce) {
  .mentora-glass {
    background: #ffffff;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
}

@supports not ((backdrop-filter: blur(12px)) or (-webkit-backdrop-filter: blur(12px))) {
  .mentora-glass {
    background: #ffffff;
  }
}
```

Acceptance criteria:

* [x] Glass tokens exist.
* [x] Glass effect has fallback.
* [x] Accessibility is considered.
* [x] Components do not hardcode random colors.

---

# Phase UI-C â€” Apply Glassy UI Screen by Screen

Important:

```text
Do not redesign every screen randomly.
Refactor one screen at a time.
Mark checkboxes after each screen is complete.
```

Order:

* [x] Sidebar and app shell first.
* [x] Tutor IA second.
* [x] Chat composer third.
* [x] Dashboard / Inicio fourth.
* [x] Materiales fifth.
* [x] PrÃ¡ctica sixth.
* [x] Perfil seventh.
* [x] Mobile polish last.

## Sidebar and App Shell

* [x] Apply glassy sidebar.
* [x] Apply soft canvas background.
* [x] Apply clean page container.
* [x] Reduce visual noise.
* [x] Make active navigation clear.

## Tutor IA

* [x] Remove large â€œContexto vivoâ€ panel by default.
* [x] Add compact material context chips.
* [x] Apply glassy chat panel.
* [x] Improve message bubbles.
* [x] Keep chat readable.

## Chat Composer

* [x] Replace gray input.
* [x] Add glassy white composer.
* [x] Add `+` upload button.
* [x] Add clean send button.
* [x] Add attachment chips.

## Dashboard / Inicio

* [x] Reduce oversized hero.
* [x] Add command bar.
* [x] Add clean next-action card.
* [x] Use glass cards.
* [x] Hide zero-value metrics if not useful.

## Materiales

* [x] Simplify upload card.
* [x] Use clean material cards.
* [x] Use compact empty state.
* [x] Add clear upload action.

## PrÃ¡ctica

* [x] Replace large empty panel.
* [x] Add glassy tool cards.
* [x] Add clear disabled explanation.
* [x] Show results grid when available.

## Perfil

* [x] Reduce empty horizontal space.
* [x] Use clean glass form cards.
* [x] Group settings logically.
* [x] Add save feedback.

Acceptance criteria:

* [x] Each screen uses the same visual system.
* [x] No screen looks like the old UI mixed with new UI.
* [x] Glass style is clean and controlled.
* [x] Student focus is preserved.

---

# Phase UI-D â€” Accessibility and Readability Guardrails

Because glassy UI can reduce readability, Codex must enforce these rules.

Tasks:

* [x] Text-heavy areas must use `--mentora-surface-strong`.
* [x] Chat messages must not be overly transparent.
* [x] Inputs must have clear borders.
* [x] Placeholder text must pass contrast checks.
* [x] Buttons must be readable.
* [x] Disabled controls must not look like active controls.
* [x] Focus states must be visible.
* [x] Avoid blur behind small text.
* [x] Avoid glass effects behind long paragraphs.
* [x] Add reduced transparency fallback.
* [x] Test on mobile.
* [x] Test in bright mode.
* [x] Test in low-contrast situations.

Acceptance criteria:

* [x] UI looks glassy but remains readable.
* [x] Accessibility is not sacrificed for style.
* [x] Students can study comfortably for long periods.

---

# Phase UI-E â€” Visual QA With UI Designer Plugin

After each screen, Codex must ask the UI designer plugin/agents to review:

* [x] Is this screen visually consistent?
* [x] Is the UI too busy?
* [x] Is the glass effect too strong?
* [x] Is text readable?
* [x] Is the primary action clear?
* [x] Are there unnecessary panels?
* [x] Does this feel like a premium student app?
* [x] Does this look like one product?
* [x] Does this work on mobile?

Codex must document results in:

```text
docs/ui-visual-review.md
```

Acceptance criteria:

* [x] Visual review document exists.
* [x] Every redesigned screen has a review note.
* [x] Issues found by the plugin are fixed before moving to the next phase.

---

# Add This to the PR Description

```markdown
## UI Designer Plugin and Glassy iOS 26-Inspired Design

This PR uses the already-installed UI designer plugin with agents and skills to improve Mentoraâ€™s interface.

### Visual direction

Mentora now follows a clean glassy academic SaaS style inspired by iOS 26 / Liquid Glass, while keeping its own student-focused identity.

### Design principles

- Glassy surfaces are used for hierarchy, not decoration.
- Text-heavy areas remain readable.
- The chat composer is clean and ChatGPT-like.
- The sidebar, cards, dashboard, Tutor IA, Materiales, PrÃ¡ctica, and Perfil follow one visual system.
- Reduced transparency fallbacks are included.
- The UI designer plugin is used to review major screens.

### Important

This is not a direct Apple UI clone.  
It is a Mentora-native academic SaaS design inspired by modern glass UI patterns.
```

---

# Final Acceptance Criteria Addition

* [x] UI designer plugin is documented.
* [x] Codex used the installed UI designer plugin before redesigning screens.
* [x] UI designer agents/skills are mapped to specific tasks.
* [x] Mentora has a glassy clean iOS 26-inspired visual direction.
* [x] Glass effects are used consistently.
* [x] Text remains readable.
* [x] Reduced transparency fallback exists.
* [x] Sidebar looks clean and premium.
* [x] Tutor IA looks clean and chat-first.
* [x] Chat composer no longer looks gray or disabled.
* [x] Dashboard no longer feels overloaded.
* [x] Materiales page feels simple.
* [x] PrÃ¡ctica page feels useful even when empty.
* [x] Perfil page is cleaner.
* [x] The entire platform looks like one unified product.

```

Yo lo integrarÃ­a como una **fase visual obligatoria**, no como â€œextraâ€. La plataforma puede estar muy bien estructurada, pero si sigue mezclando estilos antiguos con tarjetas nuevas, el estudiante va a sentir que la app estÃ¡ incompleta.
```

[1]: https://en.wikipedia.org/wiki/Liquid_Glass?utm_source=chatgpt.com "Liquid Glass"
