# Plan

## Phase 1 (MVP) — DONE
- [x] Project setup, GitHub Pages deploy, CLAUDE.md
- [x] Manage exercises (name, muscle group, category)
- [x] Log workouts (date + time, exercises, sets with weight/reps, prefill from last set)
- [x] Workout history (view/edit/delete)
- [x] Bottom navigation

## Phase 2 — DONE
- [x] Statistics page: progress per exercise (max weight, estimated 1RM, volume over time)
- [x] Aggregation per muscle group and category
- [x] Body weight tracker with chart
- [x] Calendar view

## Phase 3 — DONE
- [x] Settings page with JSON export
- [x] Import with validation
- [x] Delete all data (with confirmation)
- [x] PWA: manifest, service worker, home screen icon, offline use

## Phase 4: Built-in standard exercises — DONE
- [x] 56 preloaded exercises (German name + English alias, muscle group, category, equipment)
- [x] Schema v2: `source` (builtin/custom), `equipment`, `hidden`; stable IDs `builtin-*`
- [x] Migration: seed built-ins, merge matching custom exercises into built-ins (sets repointed)
- [x] Built-ins can only be hidden/unhidden, never edited or deleted; old workouts keep working
- [x] Exercise list: search, muscle group + equipment filter, "Standard" badge, show hidden
- [x] Exercise picker: search incl. alias, recently used on top, grouped by muscle group

## Phase 5: Demo data — DONE
- [x] Seeded, deterministic generator: ~10 weeks of push/pull/legs, 3–4 workouts per week, ending today
- [x] Built-in + custom exercises, progressive overload with fluctuations and bad days, body weight trend
- [x] "Demo-Daten laden" in Settings; confirm + replace if data exists (current data backed up), built-ins/hidden state kept

## Phase 6: Calendar in Verlauf — DONE
- [x] Move the calendar from Statistik into Verlauf; remove the Statistik calendar tab
- [x] Verlauf toggle "Liste" / "Kalender", last view remembered per device (via `src/storage/`)

## Phase 7: Workout logging rework — DONE
- [x] Set rows use the full card width (weight stepper, reps typed)
- [x] Weight steps of 1.25 kg
- [x] Training tab removed: "+" in Verlauf (list and calendar), draft until first exercise, delete in editor

## Phase 8: Fixes, cardio, stats cleanup — DONE
- [x] Kalender: only the floating "+" creates workouts (text button removed)
- [x] No empty workouts: removed when leaving the editor; schema v3 prunes existing ones
- [x] Muscle group statistics removed
- [x] Cardio: muscle group "Cardio", entries with duration (min) + optional distance (km), 6 built-ins
- [x] Cardio in editor, exercise list/picker, per-exercise stats and demo data

## Phase 9: Exercise stats page, bodyweight, exercise search — DONE
- [x] Bodyweight exercises (equipment "Körpergewicht"): added/assisted weight, shown as KG / KG ± x kg
- [x] Full-screen exercise search with chips, recently used and create-from-search
- [x] Time range filter (2 W / 1 M / 3 M / 1 J / Alle / Zeitraum), remembered per device
- [x] Per-exercise stats page: KPIs, rep heatmap, last vs. previous, compact trend; cardio variant
- [x] Demo data with bodyweight exercises

## Phase 10: Logging and stats refinements — DONE
- [x] Compact bodyweight labels ("KG", "+10", "−20") everywhere
- [x] Editor: −/+ for reps, wider inputs
- [x] Heatmap: 30px cells, continuous teal gradient with legend
- [x] "Letztes Training" vs. "Davor": two columns per set number, each color-coded against the session before it (arrows + colors)
- [x] Trend chart with switchable metrics (strength / bodyweight / cardio), remembered per device
- [x] Demo data: straight, pyramid, back-off and warm-up patterns; mixed bodyweight sets

## Phase 11: Labels, chart units, tab memory — DONE
- [x] Bodyweight labels "BW", "+5 kg", long form "Körpergewicht + 5 kg"; one formatter
- [x] Trend charts show units on axis and tooltip (German number format; Volumen in t from 10 000 kg)
- [x] Each tab remembers its last route, scroll position and view state for the session

## Phase 12: Workout templates — DONE
Templates are a starting point only: a name plus an ordered list of exercises (no sets/weights). The result is a normal workout.

### Decisions
- **Suggestions rule:** a set the app fills in (template start, "+ Satz", "+ Übung") is a *suggestion* (`WorkoutSet.suggested: true`), shown greyed out with a ✓. Sets the user types values into are real. Confirm via ✓ per set or by editing weight/reps.
- Template start: each exercise gets the sets of its last session as suggestions; no history = one empty set (becomes real once a value is entered).
- "+ Übung": one suggestion (last set of the last session). "+ Satz": one suggestion (copy of the previous set).
- Suggestions are not real data: ignored by stats, history counts, prefill and "last session" lookups (one shared selector). A workout without confirmed sets counts as empty (not saved / pruned).
- Unconfirmed sets survive a reload and are deleted when leaving the editor.
- Template management: "Übungen | Vorlagen" toggle in the Übungen tab (no new bottom-nav tab); edit page `/uebungen/vorlage/:id`.
- "+" in Verlauf opens a small sheet ("Leeres Training" / templates); with no templates it goes straight to the empty workout.
- Hidden exercises stay in templates and are still used when starting a workout. A custom exercise used only by a template cannot be deleted (like exercises with sets).
- Workout stores `templateId?` and `templateName?` (name copied, survives rename/delete); shown as a label in the editor and the Verlauf list.
- Editing a workout (add/remove/reorder exercises and sets) never changes the template.
- Template names are unique (trimmed, case-insensitive). Saving under an existing name asks for confirmation and overwrites that template, from "Als Vorlage speichern" as well as from the Vorlagen page; renaming onto another name merges into it.

### Steps
- [x] 1. Schema v4: `templates`, `Workout.templateId/templateName`, `WorkoutSet.suggested`; migration (`templates: []`) + test, backup export/import validation + test
- [x] 2. Template repo (CRUD, exercise-in-use check) + tests
- [x] 3. Suggestion logic: shared selector, stats/history/prefill ignore suggestions, empty-workout rules, cleanup on leaving the editor + tests
- [x] 4. Editor: suggested styling + ✓, "+ Satz"/"+ Übung" as suggestions, move up/down for exercises
- [x] 5. Start from template: "+" sheet in Verlauf (list and calendar), prefill per exercise (cardio, bodyweight, hidden, no history) + tests
- [x] 6. Template management: Vorlagen toggle in Übungen, edit page (rename, add via search picker, reorder, remove, delete with confirmation)
- [x] 7. "Als Vorlage speichern" from a workout; template label in editor and Verlauf
- [x] 8. Demo data: Push / Pull / Beine templates, some demo workouts labeled
- [x] 9. Phone-width check (~360px), mark phase done

## Phase 13: SZ-Stange exercises and German naming — DONE (pending phone-width check)
EZ bar exercises ("SZ-Stange" is the common German gym term) plus a consistent naming pass over the built-in catalog.

### Decisions
- New equipment value `SZ-Stange` (filter, form, backup validation all use `EQUIPMENT`).
- Built-ins get optional `aliases: string[]` (German variants, "EZ", previous names); search matches name, `aliasEn`, aliases and muscle group.
- Naming: equipment prefix with hyphen for simple compounds (`Kabel-Rudern`), equipment in parentheses for phrase names (`Enges Bankdrücken (SZ)`); gym anglicisms stay (`Face Pulls`, `Cable Crossover`).
- Renamed built-ins keep their IDs and list the old name as an alias. The v1 -> v2 merge also matches aliases.
- "French Press" and "Scott-Curls" converted in place to equipment SZ-Stange (same IDs).
- Schema v5: no data rewrite; `ensureBuiltins` adds the 8 new built-ins and refreshes names/aliases by ID. Custom exercises, hidden state, workouts and templates are untouched.
- A custom exercise named like a new built-in (e.g. own "SZ-Curls") is kept next to it, no automatic merge.

### Steps
- [x] 1. Types: `SZ-Stange`, `aliases`, backup validation + test
- [x] 2. Catalog: 8 new SZ-Stange exercises, conversions, renames, aliases
- [x] 3. Search matches aliases + tests
- [x] 4. Schema v5 + migration test
- [x] 5. Demo data uses SZ-Curls and French Press
- [ ] 6. Phone-width check of the equipment filter (6 values)

## Phase 14: Rest timer in the workout editor — DONE
A quick rest timer: not saved, not part of the workout data or the export, not linked to an exercise.

### Decisions
- UI: a docked 48 px bar directly above the bottom nav (only in the workout editor; the page gets extra bottom padding so it never covers content) and a bottom sheet with presets (1/2/3/5/10 min, start immediately), large mm:ss, −30 s / +30 s (before, during and paused; never below 0), Pause/Weiter, Stopp/Zurücksetzen. Closing the sheet keeps the timer running; the bar then shows the remaining time.
- Logic is timestamp based (`endAt` from `Date.now()`), so it is correct after the app was in the background. On return after the end it shows 0:00 and the flash immediately; the beep is skipped if the end was more than 10 s ago.
- State lives in a module-level store (`src/features/timer/timerStore.ts`, `useSyncExternalStore`). Leaving the editor keeps the timer running silently; sound/vibration fire only while an editor is mounted.
- Signal at 0:00: flashing bar/display (reduced-motion: static color), a generated beep (WAV data URI in an `<audio>` element, unlocked silently by the Start tap; not muted by the iOS silent switch, to be verified on device), `navigator.vibrate` where available. Screen Wake Lock while a timer runs (best effort).
- Will NOT work: sound, vibration or flash while the phone is locked or the app is in the background; vibration on iPhone; no notifications (would need a push server and permission).

### Steps
- [x] 1. Pure timer logic (`timerCore.ts`) + tests
- [x] 2. Store, generated beep, vibration, wake lock + tests
- [x] 3. Docked bar and bottom sheet, CSS, mounted in `WorkoutEditor`
- [x] 4. Phone-width check (360 px, light and dark, headless Chrome); device checks still to do by hand: iOS silent switch, Android vibration, wake lock in the installed iOS PWA
