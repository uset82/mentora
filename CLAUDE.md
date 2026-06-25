# Mentora Developer Guidelines & Project Commands

This file defines the project commands, building protocols, and guidelines for Claude Code and other agent workflows.

## Project Environment Commands

- **Development Server:** `npm run dev` (Starts next dev server)
- **Production Build:** `npm run build` (Compiles Next.js application)
- **Linter Check:** `npm run lint` (Runs eslint rules)
- **TypeScript Typecheck:** `npm run typecheck` (Runs tsc type checks)
- **Responsive QA Test:** `npm run qa:responsive` (Runs local responsive checks)
- **Content QA Test:** `npm run qa:study-content` (Runs study workspace QA checks)
- **Playwright E2E Tests:** `npx playwright test` (Runs end-to-end integration tests)

## Code Quality & Style Guidelines

### 1. TypeScript & React
- Use **Next.js 16 App Router** conventions.
- Place shared layout and application controls inside `src/components/mentora-app.tsx`.
- Use React Server Components (RSC) by default for static UI, and isolate interactive layers or Framer Motion structures into leaf Client Components (`"use client"`).
- Define all component parameters and props with exact TypeScript interfaces.

### 2. Styling (Tailwind CSS v4)
- Styling is implemented using **Tailwind CSS v4** utility classes directly in React components.
- Do NOT append huge blocks of custom CSS overrides with `!important` inside `src/app/globals.css`. Keep layout styling inline.
- Design responsive layouts explicitly using standard tailwind breakpoints (`sm`, `md`, `lg`, `xl`).

### 3. Visual Taste & Animation
- Follow the visual dials configured in `AGENTS.md` (`DESIGN_VARIANCE: 6`, `MOTION_INTENSITY: 5`, `VISUAL_DENSITY: 5`).
- Use smooth spring physics for micro-animations and hover transitions via Framer Motion.
- Ensure all interactive elements pass WCAG AA contrast guidelines (4.5:1 ratio minimum).
- Keep display headlines tight (`tracking-tighter leading-[1.1]`) using Geist sans fonts.
