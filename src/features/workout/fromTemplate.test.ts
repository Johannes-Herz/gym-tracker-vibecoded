import { describe, expect, it } from 'vitest'
import { emptyData } from '../../storage/storage'
import type { Template } from '../../types'
import { lastSessionSets, templateEntries } from './fromTemplate'

const template = (exerciseIds: string[]): Template => ({
  id: 't1',
  name: 'Push Tag',
  exerciseIds,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
})

const set = (id: string, workoutId: string, exerciseId: string, order: number, weight: number, reps: number, extra = {}) => ({
  id, workoutId, exerciseId, order, weight, reps, ...extra,
})

const data = () => {
  const d = emptyData()
  d.workouts.push(
    { id: 'w1', startedAt: '2026-01-01T10:00:00Z' },
    { id: 'w2', startedAt: '2026-01-08T10:00:00Z' },
    { id: 'w3', startedAt: '2026-01-15T10:00:00Z' },
  )
  d.sets.push(
    set('1', 'w1', 'builtin-bench-press', 0, 70, 8),
    set('2', 'w2', 'builtin-bench-press', 1, 80, 8),
    set('3', 'w2', 'builtin-bench-press', 0, 75, 10),
    set('4', 'w2', 'builtin-squat', 2, 100, 5),
  )
  return d
}

describe('templateEntries', () => {
  it('uses the last session per exercise, in set order', () => {
    expect(lastSessionSets(data(), 'builtin-bench-press')).toEqual([
      { weight: 75, reps: 10 },
      { weight: 80, reps: 8 },
    ])
  })

  it('keeps template order, gives history-less exercises one empty set and cardio a default duration', () => {
    const d = data()
    const cardio = d.exercises.find((e) => e.muscleGroup === 'Cardio')!
    const entries = templateEntries(d, template(['builtin-squat', cardio.id, 'builtin-bench-press', 'builtin-deadlift']))
    expect(entries.map((e) => e.exerciseId)).toEqual(['builtin-squat', cardio.id, 'builtin-bench-press', 'builtin-deadlift'])
    expect(entries[0].sets).toEqual([{ weight: 100, reps: 5 }])
    expect(entries[1].sets).toEqual([{ weight: 0, reps: 0, durationMin: 20 }])
    expect(entries[2].sets).toHaveLength(2)
    expect(entries[3].sets).toEqual([{ weight: 0, reps: 0 }])
  })

  it('skips deleted exercises but keeps hidden ones', () => {
    const d = data()
    d.exercises = d.exercises.map((e) => (e.id === 'builtin-squat' ? { ...e, hidden: true } : e))
    const entries = templateEntries(d, template(['gone', 'builtin-squat']))
    expect(entries.map((e) => e.exerciseId)).toEqual(['builtin-squat'])
  })

  it('carries bodyweight and cardio fields from the last session', () => {
    const d = emptyData()
    d.workouts.push({ id: 'w', startedAt: '2026-01-01T10:00:00Z' })
    d.sets.push(set('1', 'w', 'builtin-squat', 0, 0, 12), set('2', 'w', 'builtin-squat', 1, 0, 10, { distanceKm: 1 }))
    expect(lastSessionSets(d, 'builtin-squat')).toEqual([
      { weight: 0, reps: 12 },
      { weight: 0, reps: 10, distanceKm: 1 },
    ])
  })
})
