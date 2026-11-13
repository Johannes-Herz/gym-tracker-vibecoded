import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { exercises } from './repo'
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
