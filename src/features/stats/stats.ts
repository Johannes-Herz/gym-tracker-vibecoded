import type { AppData } from '../../types'

/** Epley estimate; a single rep counts as the weight itself. */
export function estimate1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0
  return reps === 1 ? weight : weight * (1 + reps / 30)
}

const round1 = (n: number) => Math.round(n * 10) / 10

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
