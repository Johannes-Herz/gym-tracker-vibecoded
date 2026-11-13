import { newId } from '../lib/id'
import type { Exercise, MuscleGroup, Workout, WorkoutSet } from '../types'
import { getState, update } from './store'

export type ExerciseInput = {
  name: string
  muscleGroup: MuscleGroup
  category: string
}

export const exercises = {
  add(input: ExerciseInput): Exercise {
    const exercise: Exercise = {
      id: newId(),
      name: input.name.trim(),
      muscleGroup: input.muscleGroup,
      category: input.category.trim(),
      createdAt: new Date().toISOString(),
    }
    update((d) => ({ ...d, exercises: [...d.exercises, exercise] }))
    return exercise
  },
  update(id: string, input: ExerciseInput): void {
    update((d) => ({
      ...d,
      exercises: d.exercises.map((e) =>
        e.id === id
          ? { ...e, name: input.name.trim(), muscleGroup: input.muscleGroup, category: input.category.trim() }
          : e,
      ),
    }))
  },
  isInUse(id: string): boolean {
    return getState().sets.some((s) => s.exerciseId === id)
  },
  /** Returns false (and deletes nothing) if the exercise is used by any set. */
  remove(id: string): boolean {
    if (exercises.isInUse(id)) return false
    update((d) => ({ ...d, exercises: d.exercises.filter((e) => e.id !== id) }))
    return true
  },
}

export const workouts = {
  add(startedAt: string = new Date().toISOString()): Workout {
    const workout: Workout = { id: newId(), startedAt }
    update((d) => ({ ...d, workouts: [...d.workouts, workout] }))
    return workout
  },
  update(id: string, patch: Partial<Pick<Workout, 'startedAt' | 'note'>>): void {
    update((d) => ({
      ...d,
      workouts: d.workouts.map((w) => (w.id === id ? { ...w, ...patch } : w)),
    }))
  },
  /** Deletes the workout and all of its sets. */
  remove(id: string): void {
    update((d) => ({
      ...d,
      workouts: d.workouts.filter((w) => w.id !== id),
      sets: d.sets.filter((s) => s.workoutId !== id),
    }))
  },
}

export const bodyWeights = {
  /** One entry per date: saving an existing date overwrites its weight. */
  save(date: string, weightKg: number): void {
    update((d) => {
      const existing = d.bodyWeights.find((b) => b.date === date)
      return {
        ...d,
        bodyWeights: existing
          ? d.bodyWeights.map((b) => (b.id === existing.id ? { ...b, weightKg } : b))
          : [...d.bodyWeights, { id: newId(), date, weightKg }],
      }
    })
  },
  remove(id: string): void {
    update((d) => ({ ...d, bodyWeights: d.bodyWeights.filter((b) => b.id !== id) }))
  },
}

export const sets = {
  add(input: { workoutId: string; exerciseId: string; weight: number; reps: number }): WorkoutSet {
    const order = getState().sets.filter((s) => s.workoutId === input.workoutId).length
    const set: WorkoutSet = { id: newId(), order, ...input }
    update((d) => ({ ...d, sets: [...d.sets, set] }))
    return set
  },
  update(id: string, patch: Partial<Pick<WorkoutSet, 'weight' | 'reps'>>): void {
    update((d) => ({
      ...d,
      sets: d.sets.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }))
  },
  remove(id: string): void {
    update((d) => ({ ...d, sets: d.sets.filter((s) => s.id !== id) }))
  },
}
