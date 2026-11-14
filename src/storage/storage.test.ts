import { beforeEach, describe, expect, it } from 'vitest'
import { BUILTIN_EXERCISES } from '../data/builtinExercises'
import {
  BACKUP_KEY,
  CURRENT_SCHEMA_VERSION,
  STORAGE_KEY,
  emptyData,
  ensureBuiltins,
  load,
  migrate,
  save,
} from './storage'

class MemoryStorage implements Storage {
  private map = new Map<string, string>()
  get length() {
    return this.map.size
  }
  clear() {
    this.map.clear()
  }
  getItem(k: string) {
    return this.map.get(k) ?? null
  }
  key(i: number) {
    return [...this.map.keys()][i] ?? null
  }
  removeItem(k: string) {
    this.map.delete(k)
  }
  setItem(k: string, v: string) {
    this.map.set(k, v)
  }
}

describe('storage', () => {
  let storage: MemoryStorage
  beforeEach(() => {
    storage = new MemoryStorage()
  })

  it('returns empty data when nothing is stored', () => {
    expect(load(storage)).toEqual(emptyData())
  })

  it('round-trips data', () => {
    const data = emptyData()
    data.workouts.push({ id: 'w1', startedAt: '2026-01-01T10:00:00.000Z' })
    data.sets.push({ id: 's1', workoutId: 'w1', exerciseId: 'builtin-squat', order: 0, weight: 100, reps: 5 })
    save(data, storage)
    expect(load(storage)).toEqual(data)
  })

  it('falls back to empty data and keeps a backup for corrupt JSON', () => {
    storage.setItem(STORAGE_KEY, '{not json')
    expect(load(storage)).toEqual(emptyData())
    expect(storage.getItem(BACKUP_KEY)).toBe('{not json')
    expect(storage.getItem(STORAGE_KEY)).toBe('{not json')
  })

  it('rejects data from a newer schema version', () => {
    const future = JSON.stringify({ schemaVersion: CURRENT_SCHEMA_VERSION + 1 })
    storage.setItem(STORAGE_KEY, future)
    expect(load(storage)).toEqual(emptyData())
    expect(storage.getItem(BACKUP_KEY)).toBe(future)
  })
})

describe('migrate', () => {
  it('fills missing collections', () => {
    const data = migrate({ schemaVersion: 1, exercises: [{ id: 'e', name: 'Eigene Übung' }] })!
    expect(data.exercises[0]).toEqual({ id: 'e', name: 'Eigene Übung', source: 'custom' })
    expect(data).toMatchObject({ workouts: [], sets: [], bodyWeights: [] })
  })

  it('seeds all built-ins into empty data', () => {
    const data = emptyData()
    expect(data.exercises).toHaveLength(BUILTIN_EXERCISES.length)
    expect(data.exercises.every((e) => e.source === 'builtin' && !e.hidden)).toBe(true)
  })

  const v1 = () => ({
    schemaVersion: 1,
    exercises: [
      { id: 'c1', name: ' bankdrücken ', muscleGroup: 'Brust', category: '', createdAt: '2025-05-01T00:00:00.000Z' },
      { id: 'c2', name: 'Lat Pulldown', muscleGroup: 'Rücken', category: '', createdAt: '2025-05-01T00:00:00.000Z' },
      { id: 'c3', name: 'Meine Spezialübung', muscleGroup: 'Bauch', category: 'X', createdAt: '2025-05-01T00:00:00.000Z' },
    ],
    workouts: [{ id: 'w1', startedAt: '2025-06-01T10:00:00.000Z', note: 'Gut' }],
    sets: [
      { id: 's1', workoutId: 'w1', exerciseId: 'c1', order: 0, weight: 80, reps: 8 },
      { id: 's2', workoutId: 'w1', exerciseId: 'c2', order: 1, weight: 50, reps: 10 },
      { id: 's3', workoutId: 'w1', exerciseId: 'c3', order: 2, weight: 0, reps: 20 },
    ],
    bodyWeights: [{ id: 'b1', date: '2025-06-01', weightKg: 82 }],
  })

  it('keeps v1 workouts, body weights and non-matching custom exercises intact', () => {
    const before = v1()
    const data = migrate(before)!
    expect(data.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
    expect(data.workouts).toEqual(before.workouts)
    expect(data.bodyWeights).toEqual(before.bodyWeights)
    expect(data.exercises.find((e) => e.id === 'c3')).toEqual({ ...before.exercises[2], source: 'custom' })
    expect(data.sets.map((s) => [s.id, s.weight, s.reps])).toEqual(before.sets.map((s) => [s.id, s.weight, s.reps]))
  })

  it('merges custom exercises matching a built-in name or alias and repoints their sets', () => {
    const data = migrate(v1())!
    expect(data.exercises.some((e) => e.id === 'c1' || e.id === 'c2')).toBe(false)
    expect(data.sets.find((s) => s.id === 's1')!.exerciseId).toBe('builtin-bench-press')
    expect(data.sets.find((s) => s.id === 's2')!.exerciseId).toBe('builtin-lat-pulldown')
    expect(data.sets.find((s) => s.id === 's3')!.exerciseId).toBe('c3')
  })

  it('removes empty workouts and keeps everything else', () => {
    const before = {
      schemaVersion: 2,
      exercises: [],
      workouts: [
        { id: 'empty', startedAt: '2026-11-01T10:00:00.000Z' },
        { id: 'full', startedAt: '2026-11-02T10:00:00.000Z' },
      ],
      sets: [{ id: 's1', workoutId: 'full', exerciseId: 'builtin-squat', order: 0, weight: 100, reps: 5 }],
      bodyWeights: [{ id: 'b1', date: '2026-11-01', weightKg: 80 }],
    }
    const data = migrate(before)!
    expect(data.workouts.map((w) => w.id)).toEqual(['full'])
    expect(data.sets).toEqual(before.sets)
    expect(data.bodyWeights).toEqual(before.bodyWeights)
  })

  it('v3 -> v4 adds empty templates and leaves existing data untouched', () => {
    const before = {
      schemaVersion: 3,
      exercises: [],
      workouts: [{ id: 'w1', startedAt: '2026-11-02T10:00:00.000Z', note: 'x' }],
      sets: [{ id: 's1', workoutId: 'w1', exerciseId: 'builtin-squat', order: 0, weight: 100, reps: 5 }],
      bodyWeights: [{ id: 'b1', date: '2026-11-01', weightKg: 80 }],
    }
    const data = migrate(before)!
    expect(data.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
    expect(data.templates).toEqual([])
    expect(data.workouts).toEqual(before.workouts)
    expect(data.sets).toEqual(before.sets)
    expect(data.bodyWeights).toEqual(before.bodyWeights)
  })

  it('v4 -> v5 adds SZ-Stange built-ins and renames by id without touching user data', () => {
    const before = {
      schemaVersion: 4,
      exercises: [
        // old catalog state: old name, no aliases, hidden by the user
        { id: 'builtin-bench-press', name: 'Bankdrücken', aliasEn: 'Bench Press', muscleGroup: 'Brust', category: 'Push', equipment: 'Langhantel', source: 'builtin', createdAt: '2026-01-01T00:00:00.000Z', hidden: true },
        { id: 'builtin-skull-crusher', name: 'French Press', aliasEn: 'Skull Crusher', muscleGroup: 'Trizeps', category: 'Push', equipment: 'Langhantel', source: 'builtin', createdAt: '2026-01-01T00:00:00.000Z' },
        { id: 'c1', name: 'SZ-Curls', muscleGroup: 'Bizeps', category: 'Pull', source: 'custom', createdAt: '2026-02-01T00:00:00.000Z' },
      ],
      workouts: [{ id: 'w1', startedAt: '2026-11-02T10:00:00.000Z', templateId: 't1', templateName: 'Push' }],
      sets: [{ id: 's1', workoutId: 'w1', exerciseId: 'builtin-bench-press', order: 0, weight: 100, reps: 5 }],
      bodyWeights: [{ id: 'b1', date: '2026-11-01', weightKg: 80 }],
      templates: [{ id: 't1', name: 'Push', exerciseIds: ['builtin-bench-press'], createdAt: '2026-03-01T00:00:00.000Z' }],
    }
    const data = migrate(structuredClone(before))!
    expect(data.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
    const bench = data.exercises.find((e) => e.id === 'builtin-bench-press')!
    expect(bench.name).toBe('Langhantel-Bankdrücken')
    expect(bench.aliases).toContain('Bankdrücken')
    expect(bench.hidden).toBe(true)
    const fp = data.exercises.find((e) => e.id === 'builtin-skull-crusher')!
    expect(fp).toMatchObject({ name: 'French Press', equipment: 'SZ-Stange' })
    expect(fp.aliases).toContain('Stirndrücken')
    expect(data.exercises.find((e) => e.id === 'builtin-ez-curl')).toMatchObject({ name: 'SZ-Curls', source: 'builtin' })
    // custom exercise with the same name is kept next to the built-in, unchanged
    expect(data.exercises.find((e) => e.id === 'c1')).toEqual(before.exercises[2])
    expect(data.workouts).toEqual(before.workouts)
    expect(data.sets).toEqual(before.sets)
    expect(data.bodyWeights).toEqual(before.bodyWeights)
    expect(data.templates).toEqual(before.templates)
  })

  it('v5 -> v6 drops legacy suggested sets and the workouts that only held suggestions', () => {
    const before = {
      schemaVersion: 5,
      exercises: [],
      workouts: [
        { id: 'only-suggestions', startedAt: '2026-11-01T10:00:00.000Z', templateName: 'Push' },
        { id: 'mixed', startedAt: '2026-11-02T10:00:00.000Z' },
      ],
      sets: [
        { id: 's1', workoutId: 'only-suggestions', exerciseId: 'builtin-squat', order: 0, weight: 100, reps: 5, suggested: true },
        { id: 's2', workoutId: 'mixed', exerciseId: 'builtin-squat', order: 0, weight: 100, reps: 5 },
        { id: 's3', workoutId: 'mixed', exerciseId: 'builtin-squat', order: 1, weight: 100, reps: 5, suggested: true },
      ],
      bodyWeights: [],
      templates: [],
    }
    const data = migrate(structuredClone(before))!
    expect(data.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
    expect(data.sets.map((s) => s.id)).toEqual(['s2'])
    expect(data.workouts.map((w) => w.id)).toEqual(['mixed'])
  })

  it('is idempotent', () => {
    const once = migrate(v1())!
    expect(migrate(JSON.parse(JSON.stringify(once)))).toEqual(once)
  })

  it('seeds newly added catalog entries and preserves hidden state', () => {
    const data = emptyData()
    data.exercises = data.exercises.map((e) =>
      e.id === 'builtin-squat' ? { ...e, hidden: true, name: 'Alter Name' } : e,
    )
    const extra = { id: 'builtin-new', name: 'Neu', aliasEn: 'New', aliases: [], muscleGroup: 'Beine', category: 'Legs', equipment: 'Maschine' } as const
    const result = ensureBuiltins(data, [...BUILTIN_EXERCISES, extra])
    const squat = result.exercises.find((e) => e.id === 'builtin-squat')!
    expect(squat.hidden).toBe(true)
    expect(squat.name).toBe('Kniebeuge')
    expect(result.exercises.find((e) => e.id === 'builtin-new')).toMatchObject({ source: 'builtin', name: 'Neu' })
    expect(result.exercises).toHaveLength(BUILTIN_EXERCISES.length + 1)
  })

  it('returns null for invalid input', () => {
    expect(migrate(null)).toBeNull()
    expect(migrate('x')).toBeNull()
    expect(migrate({})).toBeNull()
  })
})
