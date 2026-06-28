# UI Designer Plugin Usage

## Plugin Availability

The installed UI designer plugin is available at:

`C:\Users\carlo\.codex\plugins\cache\webdesigner-repo-marketplace\webdesigner\1.0.0`

Plugin manifest:

- Name: `webdesigner`
- Version: `1.0.0`
- Display name: `WebDesigner Core`
- Capabilities: `Read`, `Write`
- Skills path: `.antigravity/skills/`
- MCP server config: `./.mcp.json`

No reinstall is required.

## Exposed Commands

The plugin package exposes the `wd` CLI command through `dist/cli/index.js`.

Package scripts:

- `npm run build`: compile the plugin TypeScript.
- `npm run start`: run `node dist/cli/index.js`.
- `npm run mcp`: run `node dist/mcp/server.js`.
- `npm run dev:cli`: run the source CLI through `tsx`.
- `npm run dev:mcp`: run the source MCP server through `tsx`.

The active Codex session does not expose a callable Stitch or `use_figma` tool. For this Mentora task, WebDesigner's documented fallback path is used: design brief, design tokens, component inventory, code implementation, and visual review artifacts.

## WebDesigner Agents

| Agent | Plugin stage | Mentora usage |
| --- | --- | --- |
| Architect Agent | `plan` | Normalize `UIdesign.md` into a phased implementation plan and preserve the existing Next.js/Supabase stack. |
| Designer Agent | `design` | Define the clean glassy academic visual direction, tokens, surface hierarchy, component inventory, and motion rules. |
| Builder Agent | `build` | Convert the approved direction into Next.js/React/CSS changes inside this workspace. |
| Reviewer Agent | `review` | Check readability, visual consistency, mobile behavior, primary action clarity, and reduced-transparency fallbacks. |
| Security Agent | `security` | Not used for this visual pass because no auth/RLS/security behavior is being redesigned. |
| Deploy Agent | `deploy` | Not used for this local UI pass. |

## Skill Mapping

| WebDesigner skill | Role | Mentora task mapping |
| --- | --- | --- |
| `stitch-design` | Design stage | Used through the Outline fallback to define the visual thesis, design tokens, component inventory, and screen-level treatment. |
| `code-generator` | Build stage | Used as implementation guidance for preserving tokens, layout hierarchy, and desktop/mobile verification. |
| `figma-use` | Figma Plugin API prerequisite | Only applicable when a Figma file/tool is connected. Not callable in this session. |
| `figma-generate-design` | Full screen generation in Figma | Blocked until a Figma document/tool is available. |
| `figma-generate-library` | Figma token/component library generation | Blocked until a Figma document/tool is available. |
| `framework-selector` | Stack planning | Not required; the app already uses Next.js 16 App Router, React 19, Tailwind 4 CSS, Supabase, and OpenRouter. |
| `project-scaffolder` | New generated workspace | Not required; this is an existing repo. |
| `security-audit` | Security stage | Out of scope for visual-only UI polish. |
| `deploy-advisor` | Deployment stage | Out of scope for this local UI pass. |

## Design Direction From Plugin Workflow

Reading this as: an authenticated academic study workspace for Spanish-speaking students, with a clean glassy iOS/Liquid Glass inspired surface language, leaning toward a Mentora-native academic SaaS product rather than an Apple clone.

Design dials:

- `DESIGN_VARIANCE: 6`
- `MOTION_INTENSITY: 5`
- `VISUAL_DENSITY: 5`

Visual thesis:

Mentora should feel like a calm study desk made of readable white glass: soft blue-white canvas, frosted navigation and panels, strong white surfaces for text-heavy content, one primary action per screen, and compact study status signals.

Interaction thesis:

Motion should be tactile and local: hover lift, focus rings, accordion expansion, loading states, and no ambient/infinite effects.

Accessibility thesis:

Glass is used for hierarchy, not for long paragraphs. Text-heavy cards use strong white surfaces, visible borders, AA-safe contrast, and reduced transparency fallbacks.

## Screen-by-Screen Agent Review

| Screen | Current problem | Student goal | Simplified layout | Visual treatment | Components to reuse | Accessibility risks | Implementation steps |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Inicio | Dashboard had mixed old/new card systems and duplicated progress surfaces. | Know the next study action quickly. | Greeting hero, one next-action panel, study path, recent materials. | Strong glass hero plus readable white panels. | `mentora-glass`, `mentora-action-card`, upload control, path row. | Hero contrast and mobile CTA reachability. | Keep one primary CTA and collapse to one column on mobile. |
| Sidebar | Navigation could feel like a second dashboard. | Move between study spaces and views without distraction. | Compact profile, primary nav tabs, compact space switcher, quiet sign out. | Frosted vertical rail, active blue pill, mobile bottom glass tabs. | `liquid-nav`, `liquid-tab`, `liquid-space-card`. | Small mobile labels and focus states. | Use short labels, badges, and visible focus rings. |
| Tutor IA | Chat competed with a large context panel and old dark composer styling. | Ask a question and see source context only when useful. | Chat-first panel, compact source context, advanced settings tucked away. | White/glass chat panel, readable bubbles, blue status chips. | `student-chat-panel`, `mentora-chat-composer`, `chat-bubble`. | Composer placeholder contrast, disabled state clarity. | Add `+` attachment, readable input, clear send state. |
| Chat composer | Input looked dark/disabled and lacked attachment affordance. | Type, upload a PDF, send. | `+` attachment, textarea, send button in one frosted composer. | Strong white glass with blue focus ring. | `ChatInput`, upload chip, send button. | Hidden file input focus and disabled contrast. | Add label-based upload button and focus-visible styling. |
| Materiales | Upload and library used mixed dark/light surfaces. | Upload PDFs and understand processing status. | Compact upload panel beside source grid. | Glass upload card, white document cards, soft status chips. | `UploadControl`, `DocumentCard`, `EmptyState`. | White text classes on white cards. | Retune helper component text colors and empty states. |
| Practica | Empty/results panels mixed old dark cards with new light generator. | Generate quiz, flashcards, or summaries from ready PDFs. | Generator card plus results/history panel. | Glass generator, segmented controls, white result cards. | `practice-generator-panel`, `ArtifactCard`, `EmptyState`. | Disabled buttons should not look broken. | Keep upload CTA when no sources and visible disabled explanation. |
| Perfil | Profile used older dark Tailwind classes and wide empty surfaces. | Save personal and learning settings confidently. | Compact identity card plus grouped settings. | Strong white glass cards, readable form controls, clear save buttons. | `profile-hero-card`, `profile-settings-card`, `ProfileFact`, form fields. | Low-contrast labels and disabled controls. | Move helper text to dark ink/muted tokens and maintain focus rings. |
| Empty states | Several empty cards looked dark or generic. | Know exactly what is missing and the next action. | Compact explanation with one action. | Dashed glass inset, readable icon tile. | `EmptyState`, upload CTA. | Too much transparent text. | Use strong surface backgrounds and muted ink. |
| Mobile layout | Desktop panels could stack with cramped controls. | Complete the upload/chat/practice flow on phone. | Bottom nav, one-column cards, sticky composer-safe spacing. | Rounded glass bottom tabs and full-width CTAs. | responsive CSS blocks. | Horizontal overflow and wrapped CTA labels. | Test 390px viewport and public responsive QA. |
