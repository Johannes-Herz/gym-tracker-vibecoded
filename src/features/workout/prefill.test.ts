import { describe, expect, it } from 'vitest'
import { emptyData } from '../../storage/storage'
import { prefillFor } from './prefill'

const set = (id: string, workoutId: string, order: number, weight: number, reps: number) => ({
  id,
  workoutId,
  exerciseId: 'e1',
  order,
  weight,
  reps,
})

describe('prefillFor', () => {
  it('returns null without history', () => {
    expect(prefillFor(emptyData(), 'w1', 'e1')).toBeNull()
  })

  it('uses the last set of the current workout first', () => {
    const data = emptyData()
    data.workouts.push({ id: 'w1', startedAt: '2026-02-01T10:00:00Z' })
    data.sets.push(set('a', 'w1', 0, 50, 10), set('b', 'w1', 1, 55, 8))
    expect(prefillFor(data, 'w1', 'e1')).toEqual({ weight: 55, reps: 8 })
  })

  it('falls back to the most recent earlier workout', () => {
    const data = emptyData()
    data.workouts.push(
      { id: 'old', startedAt: '2026-01-01T10:00:00Z' },
      { id: 'prev', startedAt: '2026-01-10T10:00:00Z' },
      { id: 'w1', startedAt: '2026-02-01T10:00:00Z' },
    )
    data.sets.push(set('a', 'old', 0, 40, 12), set('b', 'prev', 0, 60, 6), set('c', 'prev', 1, 62.5, 5))
    expect(prefillFor(data, 'w1', 'e1')).toEqual({ weight: 62.5, reps: 5 })
  })
})
