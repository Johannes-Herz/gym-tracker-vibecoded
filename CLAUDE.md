# Gym Tracker

Mobile-first gym tracker as a web app.

## Language
- Write everything in English: code, comments, identifiers, commit messages, branch names, documentation (.md files, plans, README) and conversation with the user's tooling artifacts.
- The only exception is the app's UI text (labels, buttons, messages shown to the user), which stays in German.

## Git
- Develop only on branch `dev`. Never commit, merge or push directly to `main` – the user does that (or ask first).
- Small, thematically separate commits.

## Stack
Vite + React 18 + TypeScript, `react-router-dom` (HashRouter, because of GitHub Pages), plain CSS (variables in `src/styles/base.css`), Vitest.
Vite `base` is `/gym-tracker-vibecoded/`. Deployment: GitHub Actions (`.github/workflows/deploy.yml`) on push to `main`.

## Commands
- `npm run dev` – dev server
- `npm run build` – typecheck + build
- `npm test` – Vitest

## Conventions
- Persistence goes exclusively through `src/storage/` (localStorage, key `gymtracker:v1`, with `schemaVersion`). UI code never accesses localStorage directly.
- Schema change = bump `schemaVersion` + migration in `storage.ts` + test.
- IDs via `crypto.randomUUID()`, times as ISO strings, weight in kg.
- Mobile-first: touch targets ≥ 44px, respect safe areas.
- Few dependencies; add new ones only with good justification.
- Simple design, no UI library.
