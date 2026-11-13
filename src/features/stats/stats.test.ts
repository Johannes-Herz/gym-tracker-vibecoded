import { describe, expect, it } from 'vitest'
import { emptyData } from '../../storage/storage'
import type { AppData } from '../../types'
import { aggregateBy, estimate1RM, exerciseProgress, trainingDays } from './stats'

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

describe('aggregateBy', () => {
  it('sums by muscle group, biggest volume first', () => {
    const r = aggregateBy(sample(), 'muscleGroup')
    expect(r.map((x) => x.key)).toEqual(['Brust', 'Beine'])
    expect(r[0]).toMatchObject({ sets: 3, volume: 1325 })
  })

  it('labels empty categories and respects since', () => {
    const r = aggregateBy(sample(), 'category', '2026-02-01T00:00:00')
    expect(r.map((x) => x.key).sort()).toEqual(['Ohne Kategorie', 'Push'])
    expect(r.find((x) => x.key === 'Push')).toMatchObject({ sets: 1, volume: 375 })
  })
})

describe('trainingDays', () => {
  it('collects local day keys', () => {
    expect([...trainingDays(sample())].sort()).toEqual(['2026-01-10', '2026-02-10'])
  })
})
