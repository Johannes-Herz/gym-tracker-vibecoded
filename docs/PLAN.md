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

## Phase 4: Built-in standard exercises — IN PROGRESS
- [ ] 56 preloaded exercises (German name + English alias, muscle group, category, equipment)
- [ ] Schema v2: `source` (builtin/custom), `equipment`, `hidden`; stable IDs `builtin-*`
- [ ] Migration: seed built-ins, merge matching custom exercises into built-ins (sets repointed)
- [ ] Built-ins can only be hidden/unhidden, never edited or deleted; old workouts keep working
- [ ] Exercise list: search, muscle group + equipment filter, "Standard" badge, show hidden
- [ ] Exercise picker: search incl. alias, recently used on top, grouped by muscle group
