# Gym Tracker

Mobile-first gym tracker as a web app.

## Language
- Write everything in English: code, comments, identifiers, commit messages, branch names, documentation (.md files, plans, README) and conversation with the user's tooling artifacts.
- The only exception is the app's UI text (labels, buttons, messages shown to the user): it is translated, German (default) and English, via `src/i18n` (`de.ts` is the source of truth for keys, `en.ts` must have the same keys). Never hardcode UI text in components; add a key to both files.

## Git
- Never commit, merge or push to `main` – the user merges to `main` themselves.
- Commit on `dev`, or on the feature branch the user is working on (currently `capacitor-experiment`, the Android app; it is merged into `dev` by the user). Run `git branch --show-current` before every commit; if it is `main`, stop.
- Small, thematically separate commits, one per completed step.

## Stack
Vite + React 18 + TypeScript, `react-router-dom` (HashRouter, because of GitHub Pages), plain CSS (variables in `src/styles/base.css`), Vitest.
One source, two targets:
- **PWA** (GitHub Pages): Vite `base` is `/gym-tracker-vibecoded/`, service worker, localStorage. Deployment: GitHub Actions (`.github/workflows/deploy.yml`) on push to `main`; it builds only the PWA.
- **Android app** (Capacitor, `android/`): `vite build --mode android` (base `./`, no service worker, output `dist-android/`), file-backed storage.

## Commands
- `npm run dev` – dev server
- `npm run build` – typecheck + PWA build (`dist/`)
- `npm test` – Vitest
- `npm run build:android` – typecheck + Android web build + `cap sync android`
- `npm run apk:debug` – debug APK at `android/app/build/outputs/apk/debug/app-debug.apk` (needs JDK 21 + Android SDK, see README)

## Conventions
- Persistence goes exclusively through `src/storage/` (key `gymtracker:v1`, with `schemaVersion`). UI code never accesses storage directly. **All persisted data and settings go through the storage adapter** (`getStorage()` in `storage/adapter.ts`): localStorage on the web, files in the app-private folder in the Android app. Never use `localStorage`/`sessionStorage` anywhere else (a test enforces this). Purely in-memory UI state (tab memory, timer) is not persisted on purpose.
- **Keep the PWA bundle free of native code.** Capacitor/native modules are only reached through dynamic `import()` behind `__NATIVE_BUILD__` (false in the PWA build, see `vite.config.ts`) and `isNative()`. Never import `@capacitor/*` statically from code the PWA loads. `src/build.test.ts` fails if Capacitor code ends up in the PWA build. Platform checks live only in `storage/adapter.ts`, `storage/backup.ts` (export/share) and the settings page hint.
- **Respect safe areas in new UI** (the Android app draws edge-to-edge): use `var(--safe-top|right|bottom|left)` from `base.css`, never raw `env(safe-area-inset-*)` (a test enforces this). Fixed/sticky elements and full-screen sheets need them; keep touch targets ≥ 44px.
- Schema change = bump `schemaVersion` + migration in `storage.ts` + test.
- IDs via `crypto.randomUUID()`, times as ISO strings, weight in kg.
- Mobile-first: touch targets ≥ 44px, respect safe areas.
- Few dependencies; add new ones only with good justification.
- Simple design, no UI library.
