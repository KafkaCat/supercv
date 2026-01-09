# SuperCV (Local Resume Builder)

[![中文](https://img.shields.io/badge/README-中文-blue)](README.zh-CN.md)

A local resume editor built with React + Vite + Tailwind CSS, featuring real-time preview, PDF export, and version history.

## Features
- **WYSIWYG editing**: Edit on the left, preview A4 layout in real time.
- **Local-first storage**: All data stays in your browser (IndexedDB) for privacy; works offline.
- **Version history**: Save snapshots anytime, view and restore previous versions.
- **PDF export**: Generate a high-quality PDF with one click.
- **Smart Fit (One Page)**: Auto-adjust font size and line height to fit a single page.
- **Minimal design**: Focus on content with a distraction-free editing experience.

## Tech Stack
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Zustand (state management)
- Dexie.js (IndexedDB)
- React-Quill (rich text editor)
- html2pdf.js (PDF export)

## Getting Started
1. Install dependencies
```bash
npm install
```

2. Start the dev server
```bash
npm run dev
```

3. Build for production
```bash
npm run build
```

## Usage
1. **Edit**: Fill in each module on the left. Rich text is supported.
2. **Save**: Click “Save” in the top-right to store a new snapshot.
3. **New**: Click “New” to clear current content (recommended to save first).
4. **Restore**: Click “History” to open the sidebar and restore any snapshot.
5. **Export**: Click “Export PDF” to download your resume as a PDF.
