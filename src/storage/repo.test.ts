import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { exercises, sets, templates, workouts } from './repo'
import { _resetCache, getState } from './store'

const byId = (id: string) => getState().exercises.find((e) => e.id === id)

describe('exercise rules', () => {
  beforeEach(() => {
    const mem = new Map<string, string>()
    ;(globalThis as { localStorage?: unknown }).localStorage = {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => void mem.set(k, v),
      removeItem: (k: string) => void mem.delete(k),
    }
    _resetCache()
  })

  afterEach(() => {
    delete (globalThis as { localStorage?: unknown }).localStorage
    _resetCache()
  })

  it('hides and unhides built-ins without removing them', () => {
    expect(exercises.setHidden('builtin-bench-press', true)).toBe(true)
    expect(byId('builtin-bench-press')?.hidden).toBe(true)
    expect(exercises.setHidden('builtin-bench-press', false)).toBe(true)
    expect(byId('builtin-bench-press')?.hidden).toBe(false)
  })

  it('blocks editing and deleting built-ins', () => {
    const before = byId('builtin-squat')
    expect(exercises.update('builtin-squat', { name: 'X', muscleGroup: 'Bauch', category: '' })).toBe(false)
    expect(exercises.remove('builtin-squat')).toBe(false)
    expect(byId('builtin-squat')).toEqual(before)
  })

  it('creates, edits and deletes custom exercises, but never hides them', () => {
    const e = exercises.add({ name: ' Eigene ', muscleGroup: 'Bauch', category: 'Core', equipment: 'Maschine' })
    expect(byId(e.id)).toMatchObject({ name: 'Eigene', source: 'custom', equipment: 'Maschine' })
    expect(exercises.setHidden(e.id, true)).toBe(false)
    expect(exercises.update(e.id, { name: 'Neu', muscleGroup: 'Bauch', category: '' })).toBe(true)
    expect(byId(e.id)).toMatchObject({ name: 'Neu', equipment: undefined })
    expect(exercises.remove(e.id)).toBe(true)
    expect(byId(e.id)).toBeUndefined()
  })
})

describe('workout rules', () => {
  beforeEach(() => {
    const mem = new Map<string, string>()
    ;(globalThis as { localStorage?: unknown }).localStorage = {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => void mem.set(k, v),
      removeItem: (k: string) => void mem.delete(k),
    }
    _resetCache()
  })

  afterEach(() => {
    delete (globalThis as { localStorage?: unknown }).localStorage
    _resetCache()
  })

  it('creates a workout only together with its first set', () => {
    const w = workouts.createWithFirstExercise('2026-11-13T18:00:00.000Z', 'builtin-squat', { weight: 100, reps: 5 })
    const state = getState()
    expect(state.workouts).toEqual([w])
    expect(state.sets).toEqual([
      { id: expect.any(String), workoutId: w.id, exerciseId: 'builtin-squat', order: 0, weight: 100, reps: 5 },
    ])
  })

  it('removeIfEmpty deletes a workout whose last set was removed, but keeps filled ones', () => {
    const empty = workouts.createWithFirstExercise('2026-11-12T18:00:00.000Z', 'builtin-squat', { weight: 100, reps: 5 })
    const filled = workouts.createWithFirstExercise('2026-11-13T18:00:00.000Z', 'builtin-squat', { weight: 100, reps: 5 })
    sets.remove(getState().sets.find((s) => s.workoutId === empty.id)!.id)
    workouts.removeIfEmpty(empty.id)
    workouts.removeIfEmpty(filled.id)
    expect(getState().workouts.map((w) => w.id)).toEqual([filled.id])
  })

  it('deleting a workout removes it and its sets, leaving others untouched', () => {
    const a = workouts.createWithFirstExercise('2026-11-12T18:00:00.000Z', 'builtin-squat', { weight: 100, reps: 5 })
    sets.add({ workoutId: a.id, exerciseId: 'builtin-squat', weight: 100, reps: 5 })
    const b = workouts.createWithFirstExercise('2026-11-13T18:00:00.000Z', 'builtin-bench-press', { weight: 80, reps: 8 })
    workouts.remove(a.id)
    const state = getState()
    expect(state.workouts.map((w) => w.id)).toEqual([b.id])
    expect(state.sets.every((s) => s.workoutId === b.id)).toBe(true)
    expect(state.sets).toHaveLength(1)
  })
})

describe('templates', () => {
  beforeEach(() => {
    const mem = new Map<string, string>()
    ;(globalThis as { localStorage?: unknown }).localStorage = {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => void mem.set(k, v),
      removeItem: (k: string) => void mem.delete(k),
    }
    _resetCache()
  })

  afterEach(() => {
    delete (globalThis as { localStorage?: unknown }).localStorage
    _resetCache()
  })

  it('creates a template with trimmed name and de-duplicated ordered exercises', () => {
    const t = templates.add(' Push Tag ', ['builtin-squat', 'builtin-bench-press', 'builtin-squat'])
    expect(getState().templates).toEqual([t])
    expect(t.name).toBe('Push Tag')
    expect(t.exerciseIds).toEqual(['builtin-squat', 'builtin-bench-press'])
  })

  it('renames, reorders and deletes; other templates stay untouched', () => {
    const a = templates.add('A', ['builtin-squat'])
    const b = templates.add('B', ['builtin-bench-press'])
    templates.rename(a.id, ' Beine ')
    templates.setExercises(a.id, ['builtin-bench-press', 'builtin-squat'])
    const [ta, tb] = getState().templates
    expect(ta).toMatchObject({ name: 'Beine', exerciseIds: ['builtin-bench-press', 'builtin-squat'] })
    expect(ta.updatedAt >= a.updatedAt).toBe(true)
    expect(tb).toEqual(b)
    templates.remove(a.id)
    expect(getState().templates).toEqual([b])
  })

  it('blocks deleting a custom exercise that only a template uses', () => {
    const e = exercises.add({ name: 'Eigene', muscleGroup: 'Bauch', category: '' })
    const t = templates.add('T', [e.id])
    expect(exercises.isInTemplate(e.id)).toBe(true)
    expect(exercises.remove(e.id)).toBe(false)
    templates.remove(t.id)
    expect(exercises.remove(e.id)).toBe(true)
  })

  it('finds templates by name: trimmed and case-insensitive, ignoring the edited one', () => {
    const t = templates.add('Push Tag', ['builtin-squat'])
    expect(templates.findByName('  push tag ')?.id).toBe(t.id)
    expect(templates.findByName('Pull Tag')).toBeUndefined()
    expect(templates.findByName('Push Tag', t.id)).toBeUndefined()
  })

  it('save creates a new template when the name is free', () => {
    const t = templates.save(' Beine ', ['builtin-squat'])
    expect(getState().templates).toEqual([t])
    expect(t.name).toBe('Beine')
  })

  it('save overwrites the template with the same name instead of adding a second one', () => {
    const a = templates.add('Push Tag', ['builtin-squat'])
    const saved = templates.save('push tag', ['builtin-bench-press', 'builtin-squat', 'builtin-deadlift'])
    const all = getState().templates
    expect(all).toHaveLength(1)
    expect(saved.id).toBe(a.id)
    expect(all[0]).toMatchObject({
      name: 'push tag',
      exerciseIds: ['builtin-bench-press', 'builtin-squat', 'builtin-deadlift'],
      createdAt: a.createdAt,
    })
  })

  it('editing keeps the template, renaming onto another name merges into that one', () => {
    const a = templates.add('A', ['builtin-squat'])
    const b = templates.add('B', ['builtin-bench-press'])
    templates.save('A2', ['builtin-deadlift'], a.id)
    expect(getState().templates.map((t) => [t.id, t.name])).toEqual([[a.id, 'A2'], [b.id, 'B']])
    const merged = templates.save('B', ['builtin-deadlift', 'builtin-squat'], a.id)
    const all = getState().templates
    expect(all).toHaveLength(1)
    expect(merged.id).toBe(b.id)
    expect(all[0].exerciseIds).toEqual(['builtin-deadlift', 'builtin-squat'])
  })

  it('keeps hidden exercises in a template', () => {
    const t = templates.add('T', ['builtin-squat'])
    exercises.setHidden('builtin-squat', true)
    expect(getState().templates[0].exerciseIds).toEqual(['builtin-squat'])
    expect(t.id).toBe(getState().templates[0].id)
  })
})
