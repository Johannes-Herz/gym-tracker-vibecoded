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

  it('is idempotent', () => {
    const once = migrate(v1())!
    expect(migrate(JSON.parse(JSON.stringify(once)))).toEqual(once)
  })

  it('seeds newly added catalog entries and preserves hidden state', () => {
    const data = emptyData()
    data.exercises = data.exercises.map((e) =>
      e.id === 'builtin-squat' ? { ...e, hidden: true, name: 'Alter Name' } : e,
    )
    const extra = { id: 'builtin-new', name: 'Neu', aliasEn: 'New', muscleGroup: 'Beine', category: 'Legs', equipment: 'Maschine' } as const
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
