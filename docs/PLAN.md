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

## Phase 7: Workout logging rework — IN PROGRESS
- [ ] Set rows use the full card width (weight stepper, reps typed)
- [ ] Weight steps of 1.25 kg
- [ ] Training tab removed: "+" in Verlauf (list and calendar), draft until first exercise, delete in editor
