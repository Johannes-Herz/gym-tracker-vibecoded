import type { AppData } from '../../types'

export interface SetValues {
  weight: number
  reps: number
}

/**
 * Values to pre-fill a new set: the last set of this exercise in the current
 * workout, otherwise the last set from the most recent earlier workout.
 */
export function prefillFor(data: AppData, workoutId: string, exerciseId: string): SetValues | null {
  const byOrder = (a: { order: number }, b: { order: number }) => a.order - b.order
  const forExercise = data.sets.filter((s) => s.exerciseId === exerciseId)

  const own = forExercise.filter((s) => s.workoutId === workoutId).sort(byOrder)
  if (own.length > 0) {
    const last = own[own.length - 1]
    return { weight: last.weight, reps: last.reps }
  }

  const startedAt = new Map(data.workouts.map((w) => [w.id, w.startedAt]))
  let bestWorkout: string | null = null
  for (const s of forExercise) {
    const t = startedAt.get(s.workoutId)
    if (t === undefined) continue
    if (bestWorkout === null || t > (startedAt.get(bestWorkout) ?? '')) bestWorkout = s.workoutId
  }
  if (bestWorkout === null) return null

  const prev = forExercise.filter((s) => s.workoutId === bestWorkout).sort(byOrder)
  const last = prev[prev.length - 1]
  return { weight: last.weight, reps: last.reps }
}
