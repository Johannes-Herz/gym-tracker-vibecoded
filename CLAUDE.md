# Gym Tracker

Mobile-first Gym-Tracker als Web-App. UI-Sprache: Deutsch. Code, Bezeichner und Kommentare: Englisch.

## Git
- Entwicklung nur auf Branch `dev`. Nie direkt auf `main` committen, mergen oder pushen – das macht der User (oder vorher fragen).
- Kleine, thematisch getrennte Commits.

## Stack
Vite + React 18 + TypeScript, `react-router-dom` (HashRouter, wegen GitHub Pages), plain CSS (Variablen in `src/styles/base.css`), Vitest.
Vite `base` ist `/gym-tracker-vibecoded/`. Deployment: GitHub Actions (`.github/workflows/deploy.yml`) bei Push auf `main`.

## Befehle
- `npm run dev` – Dev-Server
- `npm run build` – Typecheck + Build
- `npm test` – Vitest

## Konventionen
- Persistenz ausschließlich über `src/storage/` (localStorage, Key `gymtracker:v1`, mit `schemaVersion`). UI-Code greift nie direkt auf localStorage zu.
- Schema-Änderung = `schemaVersion` erhöhen + Migration in `storage.ts` + Test.
- IDs via `crypto.randomUUID()`, Zeiten als ISO-Strings, Gewicht in kg.
- Mobile-first: Touch-Targets ≥ 44px, Safe-Area beachten.
- Wenige Dependencies; neue nur mit guter Begründung.
- Schlichtes Design, keine UI-Library.
