import { describe, expect, it } from 'vitest'
import { emptyData } from '../../storage/storage'
import type { AppData } from '../../types'
import { cardioProgress, estimate1RM, exerciseProgress } from './stats'

function sample(): AppData {
  const d = emptyData()
  d.exercises.push(
    { id: 'bench', name: 'Bankdrücken', muscleGroup: 'Brust', category: 'Push', createdAt: '', source: 'custom' },
    { id: 'squat', name: 'Kniebeuge', muscleGroup: 'Beine', category: '', createdAt: '', source: 'custom' },
  )
  d.workouts.push(
    { id: 'w2', startedAt: '2026-02-10T12:00:00' },
    { id: 'w1', startedAt: '2026-01-10T12:00:00' },
  )
  const set = (id: string, workoutId: string, exerciseId: string, weight: number, reps: number) => ({
    id,
    workoutId,
    exerciseId,
    order: 0,
    weight,
    reps,
  })
  d.sets.push(
    set('a', 'w1', 'bench', 60, 10),
    set('b', 'w1', 'bench', 70, 5),
    set('c', 'w2', 'bench', 75, 5),
    set('d', 'w2', 'squat', 100, 5),
  )
  return d
}

describe('estimate1RM', () => {
  it('uses Epley and handles edge cases', () => {
    expect(estimate1RM(100, 1)).toBe(100)
    expect(estimate1RM(60, 10)).toBeCloseTo(80)
    expect(estimate1RM(0, 5)).toBe(0)
    expect(estimate1RM(50, 0)).toBe(0)
  })
})

describe('exerciseProgress', () => {
  it('returns one point per workout, oldest first', () => {
    const p = exerciseProgress(sample(), 'bench')
    expect(p.map((x) => x.workoutId)).toEqual(['w1', 'w2'])
    expect(p[0]).toMatchObject({ maxWeight: 70, volume: 950 })
    expect(p[0].est1RM).toBeCloseTo(81.7, 1)
  })

  it('is empty for unused exercises', () => {
    expect(exerciseProgress(sample(), 'nope')).toEqual([])
  })
})

describe('hidden exercises', () => {
  it('still show their progress', () => {
    const d = sample()
    d.exercises = d.exercises.map((e) => ({ ...e, hidden: true }))
    expect(exerciseProgress(d, 'bench')).toEqual(exerciseProgress(sample(), 'bench'))
  })
})

describe('cardio stats', () => {
  function withCardio(): AppData {
    const d = sample()
    d.exercises.push({ id: 'run', name: 'Laufband', muscleGroup: 'Cardio', category: 'Cardio', createdAt: '', source: 'custom' })
    d.sets.push(
      { id: 'c1', workoutId: 'w1', exerciseId: 'run', order: 9, weight: 0, reps: 0, durationMin: 20, distanceKm: 3.2 },
      { id: 'c2', workoutId: 'w1', exerciseId: 'run', order: 10, weight: 0, reps: 0, durationMin: 5 },
      { id: 'c3', workoutId: 'w2', exerciseId: 'run', order: 9, weight: 0, reps: 0, durationMin: 25, distanceKm: 4.1 },
    )
    return d
  }

  it('sums duration and distance per workout, oldest first', () => {
    const points = cardioProgress(withCardio(), 'run')
    expect(points.map((p) => [p.durationMin, p.distanceKm])).toEqual([
      [25, 3.2],
      [25, 4.1],
    ])
  })

  it('keeps cardio out of strength metrics', () => {
    expect(exerciseProgress(withCardio(), 'run')).toEqual([])
    expect(exerciseProgress(withCardio(), 'bench')).toEqual(exerciseProgress(sample(), 'bench'))
    expect(cardioProgress(sample(), 'bench')).toEqual([])
  })
})
