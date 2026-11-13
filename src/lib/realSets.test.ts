import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { recentExerciseIds } from '../features/workout/recent'
import { prefillFor } from '../features/workout/prefill'
import { sessionsFor } from '../features/stats/exerciseStats'
import { sets, workouts } from '../storage/repo'
import { emptyData } from '../storage/storage'
import { _resetCache, getState } from '../storage/store'
import { isReal, realSets } from './realSets'

const s = (id: string, workoutId: string, order: number, suggested?: true) => ({
  id,
  workoutId,
  exerciseId: 'e1',
  order,
  weight: 100,
  reps: 5,
  ...(suggested && { suggested }),
})

describe('suggested sets are not real data', () => {
  const data = () => {
    const d = emptyData()
    d.workouts.push({ id: 'old', startedAt: '2026-01-01T10:00:00Z' }, { id: 'new', startedAt: '2026-02-01T10:00:00Z' })
    d.sets.push(s('1', 'old', 0), s('2', 'new', 0, true))
    return d
  }

  it('filters', () => {
    expect(isReal(s('x', 'w', 0, true))).toBe(false)
    expect(realSets([s('a', 'w', 0), s('b', 'w', 1, true)]).map((x) => x.id)).toEqual(['a'])
  })

  it('stats sessions ignore them', () => {
    const sessions = sessionsFor(data(), 'e1', { key: 'all' })
    expect(sessions.map((x) => x.workoutId)).toEqual(['old'])
  })

  it('prefill and recent ignore them (last session = last real session)', () => {
    const d = data()
    expect(prefillFor(d, 'other', 'e1')).toEqual({ weight: 100, reps: 5 })
    d.sets = [s('2', 'new', 0, true)]
    expect(prefillFor(d, 'other', 'e1')).toBeNull()
    expect(recentExerciseIds(d)).toEqual([])
  })
})

describe('suggested sets in the repo', () => {
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

  it('editing or confirming a suggested set makes it real', () => {
    const w = workouts.createWithFirstExercise('2026-02-01T10:00:00Z', 'builtin-squat', { weight: 100, reps: 5 }, true)
    const a = getState().sets[0]
    expect(a.suggested).toBe(true)
    sets.update(a.id, { reps: 6 })
    expect(getState().sets[0]).not.toHaveProperty('suggested')
    const b = sets.add({ workoutId: w.id, exerciseId: 'builtin-squat', weight: 100, reps: 5, suggested: true })
    sets.confirm(b.id)
    expect(getState().sets.every(isReal)).toBe(true)
    expect(getState().sets[1]).toMatchObject({ weight: 100, reps: 5 })
  })

  it('discardSuggestions removes unconfirmed sets and workouts left empty, keeps the rest', () => {
    const untouched = workouts.createWithFirstExercise('2026-02-01T10:00:00Z', 'builtin-squat', { weight: 0, reps: 0 }, true)
    const mixed = workouts.createWithFirstExercise('2026-02-02T10:00:00Z', 'builtin-squat', { weight: 100, reps: 5 })
    sets.add({ workoutId: mixed.id, exerciseId: 'builtin-squat', weight: 100, reps: 5, suggested: true })
    workouts.discardSuggestions()
    const d = getState()
    expect(d.workouts.map((w) => w.id)).toEqual([mixed.id])
    expect(d.workouts.some((w) => w.id === untouched.id)).toBe(false)
    expect(d.sets).toHaveLength(1)
    expect(d.sets[0].suggested).toBeUndefined()
  })
})
