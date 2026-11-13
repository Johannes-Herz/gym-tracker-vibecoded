import { beforeEach, describe, expect, it } from 'vitest'
import {
  BACKUP_KEY,
  CURRENT_SCHEMA_VERSION,
  STORAGE_KEY,
  emptyData,
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
    expect(migrate({ schemaVersion: 1, exercises: [{ id: 'e' }] })).toMatchObject({
      exercises: [{ id: 'e' }],
      workouts: [],
      sets: [],
      bodyWeights: [],
    })
  })

  it('returns null for invalid input', () => {
    expect(migrate(null)).toBeNull()
    expect(migrate('x')).toBeNull()
    expect(migrate({})).toBeNull()
  })
})
