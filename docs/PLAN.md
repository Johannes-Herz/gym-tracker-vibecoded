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
