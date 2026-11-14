import type { SetValues } from '../../storage/repo'
import { isCardio, type AppData, type Exercise, type WorkoutSet } from '../../types'

export type { SetValues }

/** Copies only the value fields that are set, so strength sets stay free of cardio keys. */
export function valuesOf(s: SetValues): SetValues {
  const v: SetValues = { weight: s.weight, reps: s.reps }
  if (s.durationMin !== undefined) v.durationMin = s.durationMin
  if (s.distanceKm !== undefined) v.distanceKm = s.distanceKm
  return v
}

export const CARDIO_DEFAULT_MIN = 20

/** Prefill, or sensible defaults for a first entry of this exercise. */
export function initialValues(
  data: AppData,
  workoutId: string,
  exercise: Exercise,
  pending: PendingLike[] = [],
): SetValues {
  return (
    prefillFor(data, workoutId, exercise.id, pending) ??
    (isCardio(exercise) ? { weight: 0, reps: 0, durationMin: CARDIO_DEFAULT_MIN } : { weight: 0, reps: 0 })
  )
}

/** An unconfirmed set of the current training (not part of the data yet). */
export type PendingLike = Pick<WorkoutSet, 'exerciseId' | 'order'> & SetValues

/**
 * Values to pre-fill a new set: the last set of this exercise in the current
 * workout (confirmed or still pending), otherwise the last set from the most
 * recent earlier workout.
 */
export function prefillFor(
  data: AppData,
  workoutId: string,
  exerciseId: string,
  pending: PendingLike[] = [],
): SetValues | null {
  const byOrder = (a: { order: number }, b: { order: number }) => a.order - b.order
  const realForExercise = data.sets.filter((s) => s.exerciseId === exerciseId)

  const own = [
    ...realForExercise.filter((s) => s.workoutId === workoutId),
    ...pending.filter((s) => s.exerciseId === exerciseId),
  ].sort(byOrder)
  if (own.length > 0) {
    return valuesOf(own[own.length - 1])
  }

  const startedAt = new Map(data.workouts.map((w) => [w.id, w.startedAt]))
  let bestWorkout: string | null = null
  for (const s of realForExercise) {
    const t = startedAt.get(s.workoutId)
    if (t === undefined) continue
    if (bestWorkout === null || t > (startedAt.get(bestWorkout) ?? '')) bestWorkout = s.workoutId
  }
  if (bestWorkout === null) return null

  const prev = realForExercise.filter((s) => s.workoutId === bestWorkout).sort(byOrder)
  return valuesOf(prev[prev.length - 1])
}
