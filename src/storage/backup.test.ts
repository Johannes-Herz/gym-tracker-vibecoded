import { describe, expect, it } from 'vitest'
import type { AppData } from '../types'
import { backupFileName, deleteAllData, parseImport, serializeBackup } from './backup'
import { _resetCache, getState, update } from './store'
import { CURRENT_SCHEMA_VERSION, emptyData } from './storage'

describe('backup export', () => {
  it('wraps data with app marker and timestamp', () => {
    const data = emptyData()
    const parsed = JSON.parse(serializeBackup(data, new Date('2026-01-02T03:04:05Z')))
    expect(parsed.app).toBe('gymtracker')
    expect(parsed.exportedAt).toBe('2026-01-02T03:04:05.000Z')
    expect(parsed.data.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
    expect(parsed.data).toEqual(data)
  })

  it('builds a dated file name', () => {
    expect(backupFileName(new Date(2026, 0, 5))).toBe('gymtracker-2026-01-05.json')
  })
})

describe('parseImport', () => {
  const ex = { id: 'e1', name: 'Eigene Übung', muscleGroup: 'Brust', category: 'Push', createdAt: '2026-01-01T10:00:00.000Z', source: 'custom', equipment: 'Kurzhantel' }
  const wo = { id: 'w1', startedAt: '2026-01-02T10:00:00.000Z' }
  const set = { id: 's1', workoutId: 'w1', exerciseId: 'e1', order: 0, weight: 80, reps: 8 }
  const tpl = { id: 't1', name: 'Push Tag', exerciseIds: ['e1', 'builtin-squat'], createdAt: '2026-01-02T10:00:00.000Z', updatedAt: '2026-01-02T10:00:00.000Z' }
  const bw = { id: 'b1', date: '2026-01-02', weightKg: 80.5 }
  // Deep copy so mutations in one test never leak into the shared fixtures.
  const valid = () =>
    structuredClone({
      app: 'gymtracker',
      exportedAt: '2026-01-03T00:00:00.000Z',
      data: { schemaVersion: CURRENT_SCHEMA_VERSION, exercises: [ex], workouts: [wo], sets: [set], bodyWeights: [bw], templates: [tpl] },
    })
  const parse = (v: unknown) => parseImport(JSON.stringify(v))
  const mutate = (fn: (b: ReturnType<typeof valid>) => void) => {
    const b = valid()
    fn(b)
    return parse(b)
  }

  it('round-trips an export, including hidden built-ins', () => {
    const builtins = emptyData().exercises.map((e) => (e.id === 'builtin-squat' ? { ...e, hidden: true } : e))
    const data = { ...valid().data, exercises: [...builtins, ex] } as AppData
    const result = parseImport(serializeBackup(data))
    expect(result).toEqual({ ok: true, data })
  })

  it('accepts v3 backups without templates and imports templates from v4', () => {
    const v3 = valid()
    v3.data.schemaVersion = 3
    delete (v3.data as { templates?: unknown }).templates
    const old = parse(v3)
    expect(old.ok && old.data.templates).toEqual([])
    const v4 = parse(valid())
    expect(v4.ok && v4.data.templates).toEqual([tpl])
  })

  it('rejects invalid or duplicate templates and drops unknown exercise references', () => {
    expect(mutate((b) => { b.data.templates[0].name = ' ' }).ok).toBe(false)
    expect(mutate((b) => { b.data.templates.push({ ...tpl }) }).ok).toBe(false)
    expect(mutate((b) => { delete (b.data as { templates?: unknown }).templates }).ok).toBe(false)
    const result = mutate((b) => { b.data.templates[0].exerciseIds.push('gone') })
    expect(result.ok && result.data.templates[0].exerciseIds).toEqual(['e1', 'builtin-squat'])
  })

  it('migrates v1 backups: seeds built-ins and merges matching custom exercises', () => {
    const b = valid()
    const v1Ex = { id: 'old', name: 'Bankdrücken', muscleGroup: 'Brust', category: '', createdAt: '2025-01-01T00:00:00.000Z' }
    const result = parse({ ...b, data: { ...b.data, schemaVersion: 1, exercises: [v1Ex], sets: [{ ...set, exerciseId: 'old' }] } })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.sets[0].exerciseId).toBe('builtin-bench-press')
    expect(result.data.exercises.some((e) => e.id === 'old')).toBe(false)
  })

  it('validates cardio entries against the exercise type', () => {
    const cardioSet = { id: 'c1', workoutId: 'w1', exerciseId: 'builtin-treadmill', order: 1, weight: 0, reps: 0, durationMin: 25, distanceKm: 4 }
    const withSet = (s: object) => mutate((b) => { (b.data.sets as object[]).push(s) })
    expect(withSet(cardioSet).ok).toBe(true)
    expect(withSet({ ...cardioSet, distanceKm: undefined }).ok).toBe(true)
    expect(withSet({ ...cardioSet, durationMin: undefined }).ok).toBe(false)
    expect(withSet({ ...cardioSet, durationMin: 0 }).ok).toBe(false)
    expect(withSet({ ...cardioSet, distanceKm: -1 }).ok).toBe(false)
    expect(withSet({ ...set, id: 's2', durationMin: 10 }).ok).toBe(false)
  })

  it('allows negative (assisted) weight only for bodyweight exercises', () => {
    const pullUp = { id: 'p1', workoutId: 'w1', exerciseId: 'builtin-pull-up', order: 1, weight: -20, reps: 6 }
    const withSet = (s: object) => mutate((b) => { (b.data.sets as object[]).push(s) })
    expect(withSet(pullUp).ok).toBe(true)
    expect(withSet({ ...pullUp, weight: 10 }).ok).toBe(true)
    expect(withSet({ ...pullUp, weight: -250 }).ok).toBe(false)
    expect(withSet({ ...pullUp, exerciseId: 'builtin-bench-press' }).ok).toBe(false)
  })

  it('rejects invalid new exercise fields', () => {
    expect(mutate((b) => { (b.data.exercises[0] as { source: unknown }).source = 'x' }).ok).toBe(false)
    expect(mutate((b) => { (b.data.exercises[0] as unknown as { equipment: unknown }).equipment = 'Hantel' }).ok).toBe(false)
    expect(mutate((b) => { (b.data.exercises[0] as unknown as { equipment: unknown }).equipment = 'SZ-Stange' }).ok).toBe(true)
    expect(mutate((b) => { (b.data.exercises[0] as unknown as { aliases: unknown }).aliases = ['a', 'b'] }).ok).toBe(true)
    expect(mutate((b) => { (b.data.exercises[0] as unknown as { aliases: unknown }).aliases = 'a' }).ok).toBe(false)
    expect(mutate((b) => { (b.data.exercises[0] as unknown as { aliases: unknown }).aliases = [1] }).ok).toBe(false)
  })

  it('accepts valid data', () => {
    expect(parse(valid()).ok).toBe(true)
  })

  it('rejects corrupt JSON', () => {
    expect(parseImport('{nope').ok).toBe(false)
  })

  it('rejects files without app marker', () => {
    expect(parse({ ...valid(), app: 'other' }).ok).toBe(false)
    expect(parse([]).ok).toBe(false)
  })

  it('rejects newer schema versions', () => {
    expect(mutate((b) => { b.data.schemaVersion = CURRENT_SCHEMA_VERSION + 1 }).ok).toBe(false)
  })

  it('rejects missing arrays', () => {
    expect(mutate((b) => { delete (b.data as Partial<typeof b.data>).sets }).ok).toBe(false)
  })

  it('rejects wrong field types', () => {
    expect(mutate((b) => { (b.data.sets[0] as { weight: unknown }).weight = '80' }).ok).toBe(false)
    expect(mutate((b) => { (b.data.sets[0] as { reps: unknown }).reps = -1 }).ok).toBe(false)
    expect(mutate((b) => { (b.data.exercises[0] as { muscleGroup: unknown }).muscleGroup = 'Nacken' }).ok).toBe(false)
    expect(mutate((b) => { b.data.workouts[0].startedAt = 'gestern' }).ok).toBe(false)
    expect(mutate((b) => { b.data.bodyWeights[0].date = '02.01.2026' }).ok).toBe(false)
  })

  it('rejects dangling references', () => {
    expect(mutate((b) => { b.data.sets[0].exerciseId = 'missing' }).ok).toBe(false)
    expect(mutate((b) => { b.data.sets[0].workoutId = 'missing' }).ok).toBe(false)
  })

  it('rejects duplicate ids', () => {
    expect(mutate((b) => { b.data.exercises.push({ ...ex }) }).ok).toBe(false)
  })
})

describe('deleteAllData', () => {
  it('empties the store', () => {
    const mem = new Map<string, string>()
    ;(globalThis as { localStorage?: unknown }).localStorage = {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => void mem.set(k, v),
      removeItem: (k: string) => void mem.delete(k),
    }
    _resetCache()
    update((d) => ({ ...d, bodyWeights: [{ id: 'b1', date: '2026-01-02', weightKg: 80 }] }))
    expect(getState().bodyWeights).toHaveLength(1)
    deleteAllData()
    expect(getState()).toEqual(emptyData())
    expect(JSON.parse(mem.get('gymtracker:v1')!)).toEqual(emptyData())
    delete (globalThis as { localStorage?: unknown }).localStorage
    _resetCache()
  })
})
