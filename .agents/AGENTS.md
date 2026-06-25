<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Mentora UI Visual Taste & Design Guidelines

To prevent generic AI "slop" interfaces and make Mentora a premium, high-taste visual workspace, all agents must adhere to the following strict frontend guidelines.

## 1. Aesthetic Dials for Mentora
Every layout and motion decision should align with these calibrated dials:
*   **`DESIGN_VARIANCE: 6`** (1 = Perfect Symmetry, 10 = Artsy Chaos). Lean towards calm, clean, but asymmetric/balanced workspaces.
*   **`MOTION_INTENSITY: 5`** (1 = Static, 10 = Cinematic/Physics). Use micro-interactions, stable page loads, and smooth spring physics via Framer Motion/React. Never use continuous re-renders or infinite loops.
*   **`VISUAL_DENSITY: 5`** (1 = Art Gallery/Airy, 10 = Cockpit/Packed Data). Maintain a tidy, readable university cockpit layout where information is logically grouped, not cluttered.

## 2. Typography & Fonts
*   **Font Family:** Use Geist (`var(--font-geist-sans)`/`var(--font-geist-mono)`) as configured in `src/app/layout.tsx`. Do not fallback to standard `Inter` unless requested.
*   **Headlines:** Keep headlines tight with `tracking-tighter leading-[1.1]`.
*   **Italics:** When using display italics, ensure descender letters (`y, g, j, p, q`) are cleared without clipping by applying a minimum of `leading-[1.1]` and proper bottom padding.

## 3. Color & Calibration
*   **Color Lock:** Choose one primary accent color for the page (e.g., Mentora Blue/Lavender) and maintain it consistently across all components. Do not introduce arbitrary color values.
*   **Contrast Safety:** All interactive text, CTAs, tags, and inline errors must pass WCAG AA contrast rules (4.5:1 ratio min for body text).
*   **Anti-Purple Glows:** Avoid standard "AI gradient glow" wrappers on every card. Gradients should be used sparingly for primary landing CTAs or subtle header backgrounds.

## 4. Layout & Spacing
*   **Viewport Bounds:** Ensure the primary page hero fits cleanly in the initial viewport height (`min-h-[100dvh]` or structured bounds) so the primary CTA is visible without scrolling.
*   **Bento Grids:** Bento or card layouts must match the content exactly—no empty tiles or filler containers. Vary bento cell sizes (e.g., 2/3 + 1/3 splits) to create rhythm.
*   **No Duplicate CTAs:** Do not place multiple buttons with the same intent (e.g., "Sign Up" and "Get Started") on the same page section. Select one active label and use it consistently.
*   **CTA Wrapping:** CTA text must remain on a single line at desktop. If a label wraps to 2 or 3 lines, shorten it or widen the button bounds.

## 5. CSS & Utility Class Integrity
*   **Avoid Important Overrides:** Do not write huge lists of custom CSS overrides with `!important` in `globals.css` to fix layouts. Instead, adjust the React components directly using Tailwind utility classes.
*   **Responsive Collapsibility:** Every multi-column grid must specify explicit layout scaling for tablet/mobile viewports (`grid-cols-1 md:grid-cols-3` instead of hoping flexbox handles it).
