import type { SetValues } from '../../storage/repo'
import { isCardio, type AppData, type Exercise, type WorkoutSet } from '../../types'

export type { SetValues }

/** Copies only the value fields that are set, so strength sets stay free of cardio keys. */
function valuesOf(s: WorkoutSet): SetValues {
  const v: SetValues = { weight: s.weight, reps: s.reps }
  if (s.durationMin !== undefined) v.durationMin = s.durationMin
  if (s.distanceKm !== undefined) v.distanceKm = s.distanceKm
  return v
}

export const CARDIO_DEFAULT_MIN = 20

/** Prefill, or sensible defaults for a first entry of this exercise. */
export function initialValues(data: AppData, workoutId: string, exercise: Exercise): SetValues {
  return (
    prefillFor(data, workoutId, exercise.id) ??
    (isCardio(exercise) ? { weight: 0, reps: 0, durationMin: CARDIO_DEFAULT_MIN } : { weight: 0, reps: 0 })
  )
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
    return valuesOf(own[own.length - 1])
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
  return valuesOf(prev[prev.length - 1])
}
