# Mentora UI Visual Review

## Review Context

Source plan: `planesupdates/UIdesign.md`

Plugin workflow used: WebDesigner plugin skills and agent roles documented in `docs/ui-designer-plugin.md`. No callable Stitch or Figma tool was exposed in this Codex session, so the plugin's documented Outline fallback was used: design brief, token system, component inventory, implementation, and visual review.

Design read: authenticated student study workspace for Spanish-speaking learners, clean glassy academic SaaS, iOS/Liquid Glass inspired without cloning Apple UI.

Design dials:

- `DESIGN_VARIANCE: 6`
- `MOTION_INTENSITY: 5`
- `VISUAL_DENSITY: 5`

## Screen Reviews

| Screen | Visual consistency | Busy/noise check | Glass strength | Readability | Primary action | Mobile result | Fixes applied |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Sidebar | Pass | Pass | Pass | Pass | Active route is clear | Pass | Kept glass rail, compact active pills, quiet sign-out. |
| Inicio | Pass | Pass | Pass | Pass | One next action | Pass | Kept one primary dashboard action, route list, and recent materials only. |
| Tutor IA | Pass | Pass | Pass | Pass | Chat is primary | Pass | Reworked chat composer, source context panel, bubbles, and settings treatment. |
| Chat composer | Pass | Pass | Pass | Pass | Send and upload are clear | Pass | Added `+` PDF attachment, white/glass input, focus ring, and readable disabled state. |
| Materiales | Pass | Pass | Pass | Pass | Upload is clear | Pass | Converted upload/source panels to glass/white system and removed yellow legacy CTA styling. |
| Practica | Pass | Pass | Pass | Pass | Upload or generate is clear by state | Pass | Converted generator/results panels to unified glass system with readable empty state. |
| Perfil | Pass | Pass | Pass | Pass | Save actions are grouped | Pass | Converted profile cards, form labels, facts, and settings surfaces to readable glass/white system. |
| Empty states | Pass | Pass | Pass | Pass | One explanation/action | Pass | Replaced dark empty-state helper styles with tokenized icon/title/body treatment. |
| Mobile layout | Pass | Pass | Pass | Pass | Bottom nav and CTAs fit | Pass | Verified 390px viewport with no horizontal overflow. |

## Issues Found And Fixed

- Legacy `.upload-button.is-priority` rules were still turning upload CTAs yellow in Materiales/Tutor/Practica.
  Fixed by moving the shared React upload helper to `mentora-upload-button` and styling it with the Mentora primary gradient.
- Chat composer still looked like a dark disabled block.
  Fixed by adding `mentora-chat-composer`, `mentora-chat-attach`, `mentora-chat-textarea`, and `mentora-chat-send`.
- Helper components were forcing white/dark-theme text into light panels.
  Fixed `EmptyState`, `DocumentCard`, `ArtifactCard`, `DocumentMini`, `ProfileFact`, and form labels to use Mentora tokens.
- Older CSS variable alias set `--mentora-primary` to violet after the token import.
  Fixed by aligning the alias to `#2563eb` and keeping violet as a secondary accent.

## Verification

Latest checks:

- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed.
- `npm run qa:responsive`: passed on desktop and mobile with no horizontal overflow and no console errors.

Authenticated screenshots captured:

- `.qa/auth-desktop-home-liquid.png`
- `.qa/auth-desktop-sources-liquid.png`
- `.qa/auth-desktop-tutor-liquid.png`
- `.qa/auth-desktop-practice-liquid.png`
- `.qa/auth-desktop-profile-liquid.png`
- `.qa/auth-mobile-home-liquid.png`
- `.qa/auth-mobile-sources-liquid.png`
- `.qa/auth-mobile-tutor-liquid.png`
- `.qa/auth-mobile-practice-liquid.png`
- `.qa/auth-mobile-profile-liquid.png`

Authenticated QA result:

- Desktop `1440x1000`: no horizontal overflow on Inicio, Fuentes, Tutor, Practica, Perfil.
- Mobile `390x844`: no horizontal overflow on Inicio, Fuentes, Tutor, Practica, Perfil.
- Tutor composer exists on desktop and mobile.
- Tutor composer upload attachment exists on desktop and mobile.
- No console/page errors after authenticated session was established.

## Figma Status

Figma was requested by mention, but this session does not expose a callable `use_figma` tool or connected Figma document. No Figma file was modified. When a Figma file/tool is connected, use `figma-use` before any `use_figma` call and apply `figma-generate-design` for full screen generation.
