import { describe, expect, it } from 'vitest'
import { PREFS_KEY, loadHistoryView, saveHistoryView } from './preferences'

function memoryStorage(): Storage {
  const map = new Map<string, string>()
  return {
    get length() {
      return map.size
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    key: (i) => [...map.keys()][i] ?? null,
    removeItem: (k) => void map.delete(k),
    setItem: (k, v) => void map.set(k, v),
  }
}

const throwing = {
  getItem: () => {
    throw new Error('blocked')
  },
  setItem: () => {
    throw new Error('blocked')
  },
} as unknown as Storage

describe('history view preference', () => {
  it('defaults to the list view', () => {
    expect(loadHistoryView(memoryStorage())).toBe('list')
  })

  it('remembers the chosen view', () => {
    const storage = memoryStorage()
    saveHistoryView('calendar', storage)
    expect(loadHistoryView(storage)).toBe('calendar')
    saveHistoryView('list', storage)
    expect(loadHistoryView(storage)).toBe('list')
  })

  it('falls back to the list view for corrupt or unknown values', () => {
    const storage = memoryStorage()
    storage.setItem(PREFS_KEY, '{nope')
    expect(loadHistoryView(storage)).toBe('list')
    storage.setItem(PREFS_KEY, JSON.stringify({ historyView: 'grid' }))
    expect(loadHistoryView(storage)).toBe('list')
  })

  it('survives a storage that throws', () => {
    expect(loadHistoryView(throwing)).toBe('list')
    expect(() => saveHistoryView('calendar', throwing)).not.toThrow()
  })
})
