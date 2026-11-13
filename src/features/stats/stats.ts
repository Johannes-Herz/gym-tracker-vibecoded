import { localDateKey } from '../../lib/format'
import type { AppData } from '../../types'

/** Epley estimate; a single rep counts as the weight itself. */
export function estimate1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0
  return reps === 1 ? weight : weight * (1 + reps / 30)
}

const round1 = (n: number) => Math.round(n * 10) / 10

export interface ExercisePoint {
  workoutId: string
  startedAt: string
  maxWeight: number
  est1RM: number
  volume: number
}

/** One point per workout that contains the exercise, oldest first. */
export function exerciseProgress(data: AppData, exerciseId: string): ExercisePoint[] {
  const points: ExercisePoint[] = []
  for (const w of data.workouts) {
    const sets = data.sets.filter((s) => s.workoutId === w.id && s.exerciseId === exerciseId)
    if (sets.length === 0) continue
    points.push({
      workoutId: w.id,
      startedAt: w.startedAt,
      maxWeight: Math.max(...sets.map((s) => s.weight)),
      est1RM: round1(Math.max(...sets.map((s) => estimate1RM(s.weight, s.reps)))),
      volume: round1(sets.reduce((sum, s) => sum + s.weight * s.reps, 0)),
    })
  }
  return points.sort((a, b) => a.startedAt.localeCompare(b.startedAt))
}

export interface GroupTotal {
  key: string
  sets: number
  volume: number
}

/**
 * Totals per muscle group or category, optionally only for workouts starting
 * at or after `since` (ISO). Empty categories are grouped as "Ohne Kategorie".
 */
export function aggregateBy(
  data: AppData,
  by: 'muscleGroup' | 'category',
  since?: string,
): GroupTotal[] {
  const exercises = new Map(data.exercises.map((e) => [e.id, e]))
  const included = new Set(
    data.workouts.filter((w) => !since || w.startedAt >= since).map((w) => w.id),
  )
  const totals = new Map<string, GroupTotal>()
  for (const s of data.sets) {
    if (!included.has(s.workoutId)) continue
    const ex = exercises.get(s.exerciseId)
    if (!ex) continue
    const key = (by === 'muscleGroup' ? ex.muscleGroup : ex.category) || 'Ohne Kategorie'
    const t = totals.get(key) ?? { key, sets: 0, volume: 0 }
    t.sets += 1
    t.volume += s.weight * s.reps
    totals.set(key, t)
  }
  return [...totals.values()]
    .map((t) => ({ ...t, volume: round1(t.volume) }))
    .sort((a, b) => b.volume - a.volume)
}

/** Local days (YYYY-MM-DD) with at least one workout. */
export function trainingDays(data: AppData): Set<string> {
  return new Set(data.workouts.map((w) => localDateKey(new Date(w.startedAt))))
}
