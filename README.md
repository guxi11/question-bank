# Question Bank

A web-based quiz training application that parses `.docx` files into structured question sets and supports interactive practice sessions.

**Live Demo → [guxi11.com/question-bank](https://guxi11.com/question-bank/)**

---

## Features

- **DOCX parsing** — import question banks directly from `.docx` files; supports single-choice, multiple-choice, true/false, and fill-in-the-blank question types, with difficulty levels, correct answers, and explanations
- **Random exam generation** — shuffle and sample questions to create unique practice sets every time
- **Interactive answering** — real-time feedback, automatic scoring, and answer explanations on submission
- **History & bookmarks** — review past sessions and bookmark questions for focused review
- **Mobile-friendly** — responsive layout optimized for phone screens
- **Local persistence** — all data stored in the browser; no server or account required
- **Static deployment** — runs entirely on GitHub Pages with no backend

## Tech Stack

- **React 18** + TypeScript
- **Vite 6** for bundling
- **Tailwind CSS 4** for styling
- **mammoth.js** for `.docx` parsing
- **React Router 6** for client-side routing

## Getting Started

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

## Deployment

The app is a fully static SPA and can be deployed to any static host. The live instance runs on **GitHub Pages** at [`guxi11.com/question-bank/`](https://guxi11.com/question-bank/).

To deploy your own fork:

1. Set the `base` option in `vite.config.ts` to match your repo path (e.g. `/question-bank/`)
2. Run `npm run build`
3. Push the `dist/` output to the `gh-pages` branch (or configure GitHub Actions)

## Input File Format

See [`DOC.md`](./DOC.md) for the expected `.docx` question format.

## License

MIT
