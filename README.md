# Gym Tracker

Mobile-first gym tracker. One codebase, two targets: a PWA on GitHub Pages and an Android app (Capacitor).
Stack: Vite, React 18, TypeScript, plain CSS, Vitest. See `CLAUDE.md` for conventions and `docs/PLAN.md` for the history.

## Branches
- `main`: deployed to GitHub Pages by `.github/workflows/deploy.yml`. Only the user merges into it.
- `dev`: day-to-day work, including the Android app.

## PWA
```
npm install
npm run dev        # dev server (open the URL it prints, e.g. http://localhost:5173/gym-tracker-vibecoded/)
npm test           # Vitest
npm run build      # typecheck + production build into dist/ (base /gym-tracker-vibecoded/, with service worker)
npm run preview    # serve dist/ locally
```

## Android app (debug APK)
Prerequisites: Node, **JDK 21** (e.g. Temurin 21) and the **Android SDK** (install Android Studio; default path `%LOCALAPPDATA%\Android\Sdk`).
`scripts/apk-debug.mjs` finds both on Windows; elsewhere set `JAVA_HOME` and `ANDROID_HOME` (or `sdk.dir` in `android/local.properties`, gitignored).
```
npm run build:android   # Android web build into dist-android/ (base ./, no service worker) + cap sync
npm run apk:debug       # Gradle assembleDebug
```
Output: `android/app/build/outputs/apk/debug/app-debug.apk`. Copy it to the phone, open it in the Files app and allow installing from that source. Debug signing only; no Play Store. The app requests no storage permission.

## Storage
All persisted data goes through the storage adapter (`src/storage/adapter.ts`); the UI never touches `localStorage` directly.

| | PWA | Android app |
|---|---|---|
| Data, active training, settings | `localStorage` (keys `gymtracker:v1`, `gymtracker:session`, `gymtracker:prefs`, `gymtracker:backup`) | One file per key in the app-private folder (`store/gymtracker.v1.dat`, ...). Written atomically (temp file + rename); recovered on start if a write was interrupted |
| Pending writes | immediate | queued immediately; flushed when the app goes to the background (`pause`, `visibilitychange`, `pagehide`) |
| Automatic backups | none | `Documents/GymTracker/gym-tracker-backup-YYYY-MM-DD-HHmmss.json`, 3 s after a change and on background, last 3 kept; survives uninstall |
| Manual export | browser download | file in `Documents/GymTracker` |
| Share | Web Share API if the browser supports it | Android share sheet |
| Not persisted (by design) | tab memory, scroll positions, rest timer | same |

Moving data from the PWA to the app: Settings → Export in the PWA, copy the file to the phone, Settings → Import in the app.
