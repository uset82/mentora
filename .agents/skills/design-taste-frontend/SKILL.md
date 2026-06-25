---
name: design-taste-frontend
description: Anti-slop frontend skill for landing pages, portfolios, and redesigns. The agent reads the brief, infers the right design direction, and ships interfaces that do not look templated. Real design systems when applicable, audit-first on redesigns, strict pre-flight check.
---

# tasteskill: Anti-Slop Frontend Skill

> Landing pages, portfolios, and redesigns. Not dashboards, not data tables, not multi-step product UI.
> Every rule below is **contextual**. None of it fires automatically. First read the brief, then pull only what fits.

---

## 0. BRIEF INFERENCE (Read the Room Before Anything Else)

Before touching code or tweaking dials, **infer what the user actually wants**. Most LLM design output is bad because the model jumps to a default aesthetic instead of reading the room.

### 0.A Read these signals first
1. **Page kind** - landing (SaaS / consumer / agency / event), portfolio (dev / designer / creative studio), redesign (preserve vs overhaul), editorial / blog.
2. **Vibe words** the user used - "minimalist", "calm", "Linear-style", "Awwwards", "brutalist", "premium consumer", "Apple-y", "playful", "serious B2B", "editorial", "agency-y", "glassy", "dark tech".
3. **Reference signals** - URLs they linked, screenshots they pasted, products they named, brands they're competing with.
4. **Audience** - B2B procurement panel vs. design-conscious consumer vs. recruiter scanning a portfolio. The audience picks the aesthetic, not your taste.
5. **Brand assets that already exist** - logo, color, type, photography. For redesigns, these are starting material, not optional input.
6. **Quiet constraints** - accessibility-first audiences, public-sector, regulated industries, trust-first commerce, kids' products. These constraints OVERRIDE aesthetic preference.

### 0.B Output a one-line "Design Read" before generating
Before any code, state in one line: **"Reading this as: <page kind> for <audience>, with a <vibe> language, leaning toward <design system or aesthetic family>."**

Example reads:
- *"Reading this as: B2B SaaS landing for technical buyers, with a Linear-style minimalist language, leaning toward Tailwind utilities + Geist + restrained motion."*
- *"Reading this as: solo designer portfolio for hiring managers, with an editorial / kinetic-type language, leaning toward native CSS + scroll-driven animation + custom typography."*

### 0.C If the brief is ambiguous, ask one question, do not guess
Ask exactly **one** clarifying question - never a multi-question dump - and only when the design read genuinely diverges. Example: *"Should this feel closer to Linear-clean or Awwwards-experimental?"*

If you can confidently infer from context, **do not ask**. Just declare the design read and proceed.

### 0.D Anti-Default Discipline
Do not default to: AI-purple gradients, centered hero over dark mesh, three equal feature cards, generic glassmorphism on everything, infinite-loop micro-animations everywhere, Inter + slate-900. These are the LLM defaults. Reach past them deliberately based on the design read.

---

## 1. THE THREE DIALS (Core Configuration)

After the design read, set three dials. Every layout, motion, and density decision below is gated by these.

* **`DESIGN_VARIANCE: 6`** - 1 = Perfect Symmetry, 10 = Artsy Chaos (Default: 6 for Mentora)
* **`MOTION_INTENSITY: 5`** - 1 = Static, 10 = Cinematic / Physics (Default: 5 for Mentora)
* **`VISUAL_DENSITY: 4`** - 1 = Art Gallery / Airy, 10 = Cockpit / Packed Data (Default: 4 for Mentora)

### 1.A Dial Inference (design read → dial values)
| Signal | VARIANCE | MOTION | DENSITY |
|---|---|---|---|
| "minimalist / clean / calm / editorial / Linear-style" | 5-6 | 3-4 | 2-3 |
| "premium consumer / Apple-y / luxury / brand" | 7-8 | 5-7 | 3-4 |
| "playful / wild / Dribbble / Awwwards / experimental / agency" | 9-10 | 8-10 | 3-4 |
| "landing page / portfolio / marketing site (default)" | 7-9 | 6-8 | 3-5 |
| "trust-first / public-sector / regulated / accessibility-critical" | 3-4 | 2-3 | 4-5 |

---

## 2. BRIEF → DESIGN SYSTEM MAP

Once you have the design read (Section 0) and dials (Section 1), pick the right foundation. Do not invent CSS for things that have an official package.

* **Radix UI Primitives / Themes:** Modern accessible React foundation.
* **shadcn/ui:** Great customizable baseline; tailwind-driven. Never ship default styles unaltered.
* **Tailwind v4:** Standard utilities, theme bindings. Use native CSS custom properties for dynamic configuration.

---

## 3. DEFAULT ARCHITECTURE & CONVENTIONS

* **Framework:** Next.js with React Server Components (RSC) and Client Component isolation for interactive layers.
* **Animation:** framer-motion or motion/react. Keep timing stable and standard. Use spring-driven physics (`stiffness`, `damping`, `mass`) instead of hardcoded millisecond curves where dynamic tactile feedback is required.
* **Fonts:** Geist or Outfit/Satoshi display faces. Avoid fallback to plain `Inter` unless requested.
* **Icons:** `@phosphor-icons/react` or `@tabler/icons-react`. Standardize stroke-width and size.

---

## 4. DESIGN ENGINEERING DIRECTIVES (Anti-Slop Guidelines)

### 4.1 Typography Scale
* **Display Type:** Use clean, tight letter-spacing for large display heads (`tracking-tighter leading-none`).
* **Serif restriction:** Do not reach for serifs unless explicitly justified. Prefer modern, polished sans display fonts.
* **Descender space:** Add space below display italics (`leading-[1.1]` min) to prevent text clipping.

### 4.2 Color calibration
* **Contrast safety:** Ensure WCAG AA contrast rules are met on every button, tag, and inline notification.
* **The Lila rule:** Banish standard "AI-purple glows." Select single-hue high-saturation accent colors calibrated on clean neutral bases (Zinc, Slate, Cool Gray).
* **Palette consistency:** Do not mix warm and cool grays. Maintain a locked, coherent palette across all pages.

### 4.3 Layout rules
* **No viewport overflow:** Heroes must fit within a single viewport height (`min-h-[100dvh]` or structured bounds).
* **Responsive structure:** Multi-column layouts must collapse correctly for screens `< 768px`.
* **Zero empty slots in grids:** Bento grids should possess exact grids fitting only the content available.
* **CTA Button Wrap:** Buttons must fit their text on one line. No multi-line CTA wrapping.
* **No duplicate CTA intent:** Don't put "Get started", "Try free", and "Sign up" on the same page section. Select one active label.

### 4.4 Materiality and Shadows
* Use custom box-shadows tinted slightly with the background color to avoid harsh black borders.
* Avoid heavy borders or complex CSS gradients when negative space achieves the same logical hierarchy.
