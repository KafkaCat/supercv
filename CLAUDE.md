# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WonderCV is a local-first, privacy-focused resume editor. All data stays in the browser (IndexedDB). No backend — the AI integration in `src/services/ai.ts` and `LandingPage.tsx` is currently mock/simulated.

## Commands

```bash
npm run dev       # Start Vite dev server
npm run build     # TypeScript check + Vite production build
npm run preview   # Preview production build locally
```

There are no test or lint commands configured.

## Architecture

**No router.** `App.tsx` uses a state machine (`appMode: 'landing' | 'editor'`) to switch between `LandingPage` and `Layout` (the editor). Navigation is via callbacks, not URL-based routing.

**State management:** Single Zustand store in `src/store/useResumeStore.ts`. This is the central hub — it holds the current resume, UI state, AI panel state, and all mutation logic (CRUD, reorder, translate, changelog, auto-save).

**Persistence:** Dexie.js wraps IndexedDB (`src/db.ts`). Two tables: `resumes` and `archives`. Auto-saves every 5 minutes. `appLanguage` and `sectionOrder` live in localStorage.

**Data model:** `src/types.ts` defines the `Resume` interface and all sub-types. Rich text fields (summary, descriptions, skills, custom sections) store HTML strings from React-Quill.

**i18n:** i18next with two locale files (`src/i18n/locales/en.json`, `zh.json`). Keys are namespaced: `common.*`, `sections.*`, `fields.*`, `header.*`, `resume.*`, `ai.*`, `archive.*`, `messages.*`. The app also has a separate concept of resume *content* language (`resume.language: 'zh' | 'en'`) distinct from the UI language.

## Key Patterns

- **Section ordering** is dynamic via `sectionOrder` array in the store. Sections are rendered by iterating this array, not hardcoded order.
- **Drag-and-drop** uses @dnd-kit for both section reordering and item reordering within sections.
- **Editors** (`src/components/editor/`) each handle one resume section. They read/write through the Zustand store's `updateProfile`, `updateSection`, `reorderItems` actions.
- **ResumePreview** (`src/components/preview/ResumePreview.tsx`) renders a scaled A4 page. Layout properties (fontSize, lineHeight, margin) are per-resume and optionally per-language.
- **PDF import** (`src/utils/pdfImport.ts`) uses pdfjs-dist for text extraction with Tesseract.js OCR as fallback for scanned documents.
- **PDF export** uses html2pdf.js to convert the preview DOM to PDF.
- **Changelog** tracking is built into the store — `logChange()` records snapshots, `restoreFromLog()` reverts.

## Styling

Tailwind CSS with a dark theme. Custom values in `tailwind.config.js`: `primary` color (#2563eb), `slate-850` (#151e2e). Print styles for PDF export are in `src/index.css` under `@media print`.

## PWA

Configured via `vite-plugin-pwa` in `vite.config.ts` with auto-update registration. Assets in `public/` include PDF.js worker and CMap files for offline PDF rendering.

## Deployment

Vercel with SPA rewrite rule (`vercel.json`). Build output goes to `dist/`.

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health
