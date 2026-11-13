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
    // Cardio entries never count towards strength metrics.
    const sets = data.sets.filter(
      (s) => s.workoutId === w.id && s.exerciseId === exerciseId && s.durationMin === undefined,
    )
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

export interface CardioPoint {
  workoutId: string
  startedAt: string
  durationMin: number
  distanceKm: number
}

/** Total duration and distance per workout for a cardio exercise, oldest first. */
export function cardioProgress(data: AppData, exerciseId: string): CardioPoint[] {
  const points: CardioPoint[] = []
  for (const w of data.workouts) {
    const entries = data.sets.filter(
      (s) => s.workoutId === w.id && s.exerciseId === exerciseId && s.durationMin !== undefined,
    )
    if (entries.length === 0) continue
    points.push({
      workoutId: w.id,
      startedAt: w.startedAt,
      durationMin: round1(entries.reduce((sum, s) => sum + (s.durationMin ?? 0), 0)),
      distanceKm: round1(entries.reduce((sum, s) => sum + (s.distanceKm ?? 0), 0)),
    })
  }
  return points.sort((a, b) => a.startedAt.localeCompare(b.startedAt))
}
