# Materiales WebDesigner Review

## Current UI Problems

- The panel repeats `Materiales` as both eyebrow and title without adding hierarchy.
- The upload action is split between text, icon, and a small plus control, which makes the primary action feel accidental.
- The empty state repeats the upload action too close to the header and still feels plain.
- Filter chips sit in a cramped horizontal row with a visible browser scrollbar.
- The search field reads as a default input instead of part of the glass workspace.
- Spanish copy is missing accents in `Aún` and `Imágenes`.

## Proposed Visual Hierarchy

1. A single glass panel container with one clear header.
2. Small uppercase label `MATERIALES`, main title `Materiales`, and a short student-facing subtitle.
3. One primary `Agregar material` action in the header.
4. Search and filters as compact controls below the header.
5. Empty state as a stronger white glass card with a document/upload icon and one secondary action.
6. Material cards with icon, file name, type/status metadata, and a selectable state.

## Proposed Layout

- Use a full-height left panel with a translucent white surface, subtle blue border, and no heavy gray blocks.
- Header should use a responsive two-column layout on desktop and stack on narrow widths.
- Search should occupy the full panel width.
- Filter chips should wrap into multiple rows at normal panel width; if the panel becomes too narrow, allow hidden-scroll horizontal overflow with no visible scrollbar.
- Empty state should be compact and intentional, not vertically oversized.

## Proposed Components

- `MaterialsPanel` owns filtering/search state and document rendering.
- `MaterialsHeader` owns title, subtitle, and primary upload trigger.
- `MaterialUploadMenu` wraps the existing upload/link/note behavior with a custom trigger.
- `MaterialSearch` owns the search input, icon, focus state, and clear button.
- `MaterialFilterTabs` owns accessible chip buttons.
- `MaterialEmptyState` owns empty copy and secondary upload trigger.
- `MaterialCard` owns document row display and selection.
- `MaterialStatusChip` maps backend processing state into student-friendly Spanish labels.

## Suggested Spacing

- Panel padding: 14-16px.
- Header gap: 12px.
- Search height: 46px.
- Filter chip minimum height: 34px.
- Empty state padding: 18px with a max-width-free layout that fits a 300px panel.
- Material card padding: 12px and icon size 38-42px.

## Suggested Glass Styling

- Use existing Mentora tokens: `--mentora-surface`, `--mentora-surface-strong`, `--mentora-border`, `--mentora-primary`, and `--mentora-focus-ring`.
- Use white translucent surfaces with `backdrop-filter: blur(18px) saturate(145%)`.
- Keep one primary blue/lavender accent for active chips, focus rings, and upload actions.
- Avoid extra purple glow wrappers and random accent colors.
- Include reduced-transparency and unsupported-backdrop fallbacks.

## Accessibility Warnings

- Hidden file inputs must remain keyboard/screen-reader reachable through a real button trigger.
- Search needs an accessible label.
- Filter chips should be `button` elements with `aria-pressed`.
- Upload menu needs `aria-expanded`, `aria-haspopup`, `role="menu"`, and `role="menuitem"` on menu options.
- Focus states must remain visible on all controls.
- Empty-state icon should be decorative unless it adds information.

## Mobile Behavior

- Header stacks title and upload button cleanly.
- Upload button text remains one line.
- Search remains full width.
- Filter chips wrap first; on very narrow panels, hidden-scroll overflow is acceptable without a visible scrollbar.
- Popover width should clamp to the viewport and align inside the left panel.
- No horizontal page overflow or clipped Spanish labels.
