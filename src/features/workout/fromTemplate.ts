import { realSets } from '../../lib/realSets'
import { isCardio, type AppData, type Template } from '../../types'
import { CARDIO_DEFAULT_MIN, valuesOf, type SetValues } from './prefill'

export interface TemplateEntry {
  exerciseId: string
  sets: SetValues[]
}

/** Sets of the most recent workout (by start time) that has real sets of this exercise, in order. */
export function lastSessionSets(data: AppData, exerciseId: string): SetValues[] {
  const startedAt = new Map(data.workouts.map((w) => [w.id, w.startedAt]))
  const forExercise = realSets(data.sets).filter(
    (s) => s.exerciseId === exerciseId && startedAt.has(s.workoutId),
  )
  let best: string | null = null
  for (const s of forExercise) {
    if (best === null || startedAt.get(s.workoutId)! > startedAt.get(best)!) best = s.workoutId
  }
  if (best === null) return []
  return forExercise
    .filter((s) => s.workoutId === best)
    .sort((a, b) => a.order - b.order)
    .map(valuesOf)
}

/**
 * Per template exercise (in template order): the sets of its last session, or one
 * empty set if it has no history. Exercises that no longer exist are skipped;
 * hidden ones are kept.
 */
export function templateEntries(data: AppData, template: Template): TemplateEntry[] {
  const entries: TemplateEntry[] = []
  for (const exerciseId of template.exerciseIds) {
    const exercise = data.exercises.find((e) => e.id === exerciseId)
    if (!exercise) continue
    const last = lastSessionSets(data, exerciseId)
    const empty: SetValues = isCardio(exercise)
      ? { weight: 0, reps: 0, durationMin: CARDIO_DEFAULT_MIN }
      : { weight: 0, reps: 0 }
    entries.push({ exerciseId, sets: last.length > 0 ? last : [empty] })
  }
  return entries
}
