import { describe, expect, it } from 'vitest'
import { recentExerciseIds } from './recent'

const set = (id: string, workoutId: string, exerciseId: string, order: number) => ({
  id,
  workoutId,
  exerciseId,
  order,
  weight: 0,
  reps: 1,
})

describe('recentExerciseIds', () => {
  const data = {
    workouts: [
      { id: 'old', startedAt: '2026-01-01T10:00:00.000Z' },
      { id: 'new', startedAt: '2026-02-01T10:00:00.000Z' },
    ],
    sets: [
      set('1', 'old', 'a', 0),
      set('2', 'old', 'b', 1),
      set('3', 'new', 'c', 0),
      set('4', 'new', 'a', 1),
      set('5', 'new', 'a', 2),
      set('6', 'gone', 'z', 0),
    ],
  }

  it('orders by newest workout, then set order, without duplicates', () => {
    expect(recentExerciseIds(data)).toEqual(['c', 'a', 'b'])
  })

  it('respects the limit and ignores sets of unknown workouts', () => {
    expect(recentExerciseIds(data, 2)).toEqual(['c', 'a'])
    expect(recentExerciseIds({ workouts: [], sets: data.sets })).toEqual([])
  })
})
