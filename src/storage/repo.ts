import { moveExercise } from '../lib/exerciseOrder'
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
  /**
   * Creates a workout together with its first set in one update, so a new
   * workout is only ever saved once it has content.
   */
  createWithFirstExercise(
    startedAt: string,
    exerciseId: string,
    values: SetValues,
    suggested?: true,
  ): Workout {
    const workout: Workout = { id: newId(), startedAt }
    const set: WorkoutSet = {
      id: newId(),
      workoutId: workout.id,
      exerciseId,
      order: 0,
      ...values,
      ...(suggested && { suggested }),
    }
    update((d) => ({ ...d, workouts: [...d.workouts, workout], sets: [...d.sets, set] }))
    return workout
  },
  /** Deletes the workout if it has no sets (called when leaving the editor). */
  removeIfEmpty(id: string): void {
    if (getState().sets.some((s) => s.workoutId === id)) return
    if (!getState().workouts.some((w) => w.id === id)) return
    update((d) => ({ ...d, workouts: d.workouts.filter((w) => w.id !== id) }))
  },
  /**
   * Creates a workout from a template: all sets are suggestions, and the template
   * name is stored as label. Returns null (saving nothing) if there are no sets.
   */
  createFromTemplate(
    startedAt: string,
    template: Pick<Template, 'id' | 'name'>,
    entries: { exerciseId: string; sets: SetValues[] }[],
  ): Workout | null {
    const workout: Workout = {
      id: newId(),
      startedAt,
      templateId: template.id,
      templateName: template.name,
    }
    const created: WorkoutSet[] = []
    for (const entry of entries) {
      for (const values of entry.sets) {
        created.push({
          id: newId(),
          workoutId: workout.id,
          exerciseId: entry.exerciseId,
          order: created.length,
          ...values,
          suggested: true,
        })
      }
    }
    if (created.length === 0) return null
    update((d) => ({ ...d, workouts: [...d.workouts, workout], sets: [...d.sets, ...created] }))
    return workout
  },
  /**
   * Drops all unconfirmed (suggested) sets and the workouts that have no sets
   * left. Called when the Verlauf list opens, i.e. when no editor is open.
   */
  discardSuggestions(): void {
    const d = getState()
    if (!d.sets.some((s) => s.suggested)) return
    update((cur) => {
      const sets = cur.sets.filter((s) => !s.suggested)
      const used = new Set(sets.map((s) => s.workoutId))
      // Only workouts that actually lost sets are candidates; other empty ones are not touched here.
      const touched = new Set(cur.sets.filter((s) => s.suggested).map((s) => s.workoutId))
      return {
        ...cur,
        sets,
        workouts: cur.workouts.filter((w) => used.has(w.id) || !touched.has(w.id)),
      }
    })
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
  add(input: { workoutId: string; exerciseId: string; suggested?: true } & SetValues): WorkoutSet {
    const order = getState().sets.filter((s) => s.workoutId === input.workoutId).length
    const set: WorkoutSet = { id: newId(), order, ...input }
    update((d) => ({ ...d, sets: [...d.sets, set] }))
    return set
  },
  /** Moves an exercise block up (-1) or down (+1) within its workout. */
  moveExercise(workoutId: string, exerciseId: string, delta: -1 | 1): void {
    const orders = moveExercise(
      getState().sets.filter((s) => s.workoutId === workoutId),
      exerciseId,
      delta,
    )
    if (!orders) return
    update((d) => ({ ...d, sets: d.sets.map((s) => (orders.has(s.id) ? { ...s, order: orders.get(s.id)! } : s)) }))
  },
  /** Removes all sets of one exercise from a workout. */
  removeExercise(workoutId: string, exerciseId: string): void {
    update((d) => ({
      ...d,
      sets: d.sets.filter((s) => !(s.workoutId === workoutId && s.exerciseId === exerciseId)),
    }))
  },
  /** Editing a value confirms a suggested set. */
  update(id: string, patch: Partial<SetValues>): void {
    update((d) => ({
      ...d,
      sets: d.sets.map((s) => {
        if (s.id !== id) return s
        const { suggested: _suggested, ...rest } = s
        return { ...rest, ...patch }
      }),
    }))
  },
  /** Accepts a suggested set as it is. */
  confirm(id: string): void {
    update((d) => ({
      ...d,
      sets: d.sets.map((s) => {
        if (s.id !== id) return s
        const { suggested: _suggested, ...rest } = s
        return rest
      }),
    }))
  },
  remove(id: string): void {
    update((d) => ({ ...d, sets: d.sets.filter((s) => s.id !== id) }))
  },
}
