import { newId } from '../lib/id'
import type { Equipment, Exercise, MuscleGroup, Template, Workout, WorkoutSet } from '../types'
import { getState, update } from './store'

/** Value fields of a set: weight × reps for strength, duration/distance for cardio. */
export type SetValues = Pick<WorkoutSet, 'weight' | 'reps' | 'durationMin' | 'distanceKm'>

export type ExerciseInput = {
  name: string
  muscleGroup: MuscleGroup
  category: string
  equipment?: Equipment
}

function isBuiltin(id: string): boolean {
  return getState().exercises.some((e) => e.id === id && e.source === 'builtin')
}

function fromInput(input: ExerciseInput) {
  return {
    name: input.name.trim(),
    muscleGroup: input.muscleGroup,
    category: input.category.trim(),
    equipment: input.equipment || undefined,
  }
}

export const exercises = {
  add(input: ExerciseInput): Exercise {
    const exercise: Exercise = {
      id: newId(),
      ...fromInput(input),
      createdAt: new Date().toISOString(),
      source: 'custom',
    }
    update((d) => ({ ...d, exercises: [...d.exercises, exercise] }))
    return exercise
  },
  /** Built-ins cannot be edited; returns false for them. */
  update(id: string, input: ExerciseInput): boolean {
    if (isBuiltin(id)) return false
    update((d) => ({
      ...d,
      exercises: d.exercises.map((e) => (e.id === id ? { ...e, ...fromInput(input) } : e)),
    }))
    return true
  },
  /** Hides or shows a built-in. Custom exercises are deleted instead; returns false for them. */
  setHidden(id: string, hidden: boolean): boolean {
    if (!isBuiltin(id)) return false
    update((d) => ({
      ...d,
      exercises: d.exercises.map((e) => (e.id === id ? { ...e, hidden } : e)),
    }))
    return true
  },
  isInUse(id: string): boolean {
    return getState().sets.some((s) => s.exerciseId === id)
  },
  isInTemplate(id: string): boolean {
    return getState().templates.some((t) => t.exerciseIds.includes(id))
  },
  /** Returns false (and deletes nothing) for built-ins and exercises used by any set or template. */
  remove(id: string): boolean {
    if (isBuiltin(id) || exercises.isInUse(id) || exercises.isInTemplate(id)) return false
    update((d) => ({ ...d, exercises: d.exercises.filter((e) => e.id !== id) }))
    return true
  },
}

export const templates = {
  /** Creates a template; duplicate exercise ids are dropped (keeping the first). */
  add(name: string, exerciseIds: string[] = []): Template {
    const now = new Date().toISOString()
    const template: Template = {
      id: newId(),
      name: name.trim(),
      exerciseIds: [...new Set(exerciseIds)],
      createdAt: now,
      updatedAt: now,
    }
    update((d) => ({ ...d, templates: [...d.templates, template] }))
    return template
  },
  rename(id: string, name: string): void {
    patch(id, { name: name.trim() })
  },
  /** Replaces the ordered exercise list. */
  setExercises(id: string, exerciseIds: string[]): void {
    patch(id, { exerciseIds: [...new Set(exerciseIds)] })
  },
  remove(id: string): void {
    update((d) => ({ ...d, templates: d.templates.filter((t) => t.id !== id) }))
  },
  /** The template with this name (the name is the identity: trimmed, case-insensitive), ignoring `exceptId`. */
  findByName(name: string, exceptId?: string): Template | undefined {
    const key = normalizeName(name)
    return getState().templates.find((t) => t.id !== exceptId && normalizeName(t.name) === key)
  },
  /**
   * Saves a template under a unique name. If another template already has the
   * name, it is overwritten (name casing and exercises replaced). `editingId` is
   * the template being edited, if any: it is renamed in place, or removed when
   * its new name belongs to another template (the two merge into that one).
   */
  save(name: string, exerciseIds: string[], editingId?: string): Template {
    const now = new Date().toISOString()
    const trimmed = name.trim()
    const ids = [...new Set(exerciseIds)]
    const existing = templates.findByName(trimmed, editingId)
    const targetId = existing?.id ?? editingId
    const saved: Template = {
      id: targetId ?? newId(),
      name: trimmed,
      exerciseIds: ids,
      createdAt: existing?.createdAt ?? getState().templates.find((t) => t.id === editingId)?.createdAt ?? now,
      updatedAt: now,
    }
    update((d) => {
      const without = d.templates.filter((t) => t.id !== editingId || t.id === targetId)
      const found = without.some((t) => t.id === saved.id)
      return {
        ...d,
        templates: found ? without.map((t) => (t.id === saved.id ? saved : t)) : [...without, saved],
      }
    })
    return saved
  },
}

const normalizeName = (name: string) => name.trim().toLocaleLowerCase('de')

function patch(id: string, changes: Partial<Pick<Template, 'name' | 'exerciseIds'>>): void {
  const updatedAt = new Date().toISOString()
  update((d) => ({
    ...d,
    templates: d.templates.map((t) => (t.id === id ? { ...t, ...changes, updatedAt } : t)),
  }))
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
  /** Deletes the workout if it has no sets (a workout only exists with content). */
  removeIfEmpty(id: string): void {
    if (getState().sets.some((s) => s.workoutId === id)) return
    if (!getState().workouts.some((w) => w.id === id)) return
    update((d) => ({ ...d, workouts: d.workouts.filter((w) => w.id !== id) }))
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
  add(input: { workoutId: string; exerciseId: string } & SetValues): WorkoutSet {
    const order = getState().sets.filter((s) => s.workoutId === input.workoutId).length
    const set: WorkoutSet = { id: newId(), order, ...input }
    update((d) => ({ ...d, sets: [...d.sets, set] }))
    return set
  },
  /**
   * Stores a confirmed set. `newWorkout` is created in the same update, so a
   * workout is only ever saved together with its first confirmed set.
   */
  addConfirmed(set: WorkoutSet, newWorkout?: Workout): void {
    update((d) => ({
      ...d,
      workouts: newWorkout ? [...d.workouts, newWorkout] : d.workouts,
      sets: [...d.sets, set],
    }))
  },
  /** Applies new `order` values (by set id), e.g. after moving an exercise block. */
  setOrders(orders: Map<string, number>): void {
    if (orders.size === 0) return
    update((d) => ({ ...d, sets: d.sets.map((s) => (orders.has(s.id) ? { ...s, order: orders.get(s.id)! } : s)) }))
  },
  /** Removes all sets of one exercise from a workout. */
  removeExercise(workoutId: string, exerciseId: string): void {
    update((d) => ({
      ...d,
      sets: d.sets.filter((s) => !(s.workoutId === workoutId && s.exerciseId === exerciseId)),
    }))
  },
  update(id: string, patch: Partial<SetValues>): void {
    update((d) => ({ ...d, sets: d.sets.map((s) => (s.id === id ? { ...s, ...patch } : s)) }))
  },
  remove(id: string): void {
    update((d) => ({ ...d, sets: d.sets.filter((s) => s.id !== id) }))
  },
}
