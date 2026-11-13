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
  const ex = { id: 'e1', name: 'Bankdrücken', muscleGroup: 'Brust', category: 'Langhantel', createdAt: '2026-01-01T10:00:00.000Z' }
  const wo = { id: 'w1', startedAt: '2026-01-02T10:00:00.000Z' }
  const set = { id: 's1', workoutId: 'w1', exerciseId: 'e1', order: 0, weight: 80, reps: 8 }
  const bw = { id: 'b1', date: '2026-01-02', weightKg: 80.5 }
  const valid = () => ({
    app: 'gymtracker',
    exportedAt: '2026-01-03T00:00:00.000Z',
    data: { schemaVersion: CURRENT_SCHEMA_VERSION, exercises: [ex], workouts: [wo], sets: [set], bodyWeights: [bw] },
  })
  const parse = (v: unknown) => parseImport(JSON.stringify(v))
  const mutate = (fn: (b: ReturnType<typeof valid>) => void) => {
    const b = valid()
    fn(b)
    return parse(b)
  }

  it('round-trips an export', () => {
    const data = valid().data
    const result = parseImport(serializeBackup(data as AppData))
    expect(result).toEqual({ ok: true, data })
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
