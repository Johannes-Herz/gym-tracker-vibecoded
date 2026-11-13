import { describe, expect, it } from 'vitest'
import { emptyData } from '../../storage/storage'
import { formatLoad } from '../exercises/bodyweight'
import type { AppData } from '../../types'
import {
  axisLabels,
  bestSet,
  chartSeries,
  cellKey,
  comparisonColumns,
  heatmapData,
  sessionsFor,
  trendSeries,
  type Session,
} from './exerciseStats'

const now = new Date(2026, 10, 13, 20)
const at = (m: number, d: number) => new Date(2026, m, d, 18).toISOString()

function data(): AppData {
  const d = emptyData()
  d.workouts.push(
    { id: 'w3', startedAt: at(10, 12) },
    { id: 'w1', startedAt: at(9, 1) },
    { id: 'w2', startedAt: at(10, 5) },
  )
  let n = 0
  const set = (workoutId: string, weight: number, reps: number, exerciseId = 'builtin-bench-press') =>
    d.sets.push({ id: `s${++n}`, workoutId, exerciseId, order: n, weight, reps })
  set('w1', 70, 8)
  set('w1', 75, 6)
  set('w2', 75, 6)
  set('w2', 75, 7)
  set('w2', 75, 5)
  set('w2', 80, 3, 'builtin-squat')
  set('w3', 80, 5)
  set('w3', 75, 8)
  return d
}

describe('sessionsFor', () => {
  it('returns sessions with this exercise inside the range, oldest first', () => {
    expect(sessionsFor(data(), 'builtin-bench-press', { key: 'all' }, now).map((s) => s.workoutId)).toEqual(['w1', 'w2', 'w3'])
    expect(sessionsFor(data(), 'builtin-bench-press', { key: '2w' }, now).map((s) => s.workoutId)).toEqual(['w2', 'w3'])
    expect(sessionsFor(data(), 'builtin-bench-press', { key: 'custom', from: '2026-01-01', to: '2026-01-31' }, now)).toEqual([])
  })
})

describe('heatmapData', () => {
  it('collects best reps and all sets per weight and session, heaviest weight first', () => {
    const { weights, cells } = heatmapData(sessionsFor(data(), 'builtin-bench-press', { key: 'all' }, now))
    expect(weights).toEqual([80, 75, 70])
    expect(cells.get(cellKey(75, 'w2'))).toEqual({ best: 7, reps: [6, 7, 5] })
    expect(cells.get(cellKey(75, 'w1'))).toEqual({ best: 6, reps: [6] })
    expect(cells.has(cellKey(80, 'w1'))).toBe(false)
  })

  it('puts bodyweight, added and assisted sets in one table, heaviest first', () => {
    const s: Session[] = [{
      workoutId: 'a',
      startedAt: at(10, 1),
      sets: [0, 5, -20, 5].map((weight, i) => ({ id: `${i}`, workoutId: 'a', exerciseId: 'builtin-pull-up', order: i, weight, reps: 6 + i })),
    }]
    const { weights, cells } = heatmapData(s)
    expect(weights).toEqual([5, 0, -20])
    expect(weights.map((w) => formatLoad(w, true))).toEqual(['+5 kg', 'BW', '−20 kg'])
    expect(cells.get(cellKey(5, 'a'))).toEqual({ best: 9, reps: [7, 9] })
  })
})

describe('axisLabels', () => {
  const sessions = (dates: string[]): Session[] => dates.map((startedAt, i) => ({ workoutId: `w${i}`, startedAt, sets: [] }))

  it('shows day labels for up to 8 sessions', () => {
    expect(axisLabels(sessions([at(10, 9), at(10, 12)]))).toEqual(['9.11.', '12.11.'])
  })

  it('shows month labels on the first session of each month beyond 8', () => {
    const dates = [1, 8, 15, 22, 29].map((d) => at(9, d)).concat([1, 5, 9, 12].map((d) => at(10, d)))
    expect(axisLabels(sessions(dates))).toEqual(['Okt', '', '', '', '', 'Nov', '', '', ''])
  })
})

describe('bestSet', () => {
  it('uses the highest estimated 1RM for strength', () => {
    const best = bestSet(sessionsFor(data(), 'builtin-bench-press', { key: 'all' }, now), false)!
    expect([best.weight, best.reps]).toEqual([75, 8]) // 95 vs 80×5 = 93.3
  })

  it('uses highest load, then most reps for bodyweight', () => {
    const s: Session[] = [
      { workoutId: 'a', startedAt: at(10, 1), sets: [{ id: '1', workoutId: 'a', exerciseId: 'p', order: 0, weight: 0, reps: 12 }] },
      { workoutId: 'b', startedAt: at(10, 2), sets: [
        { id: '2', workoutId: 'b', exerciseId: 'p', order: 0, weight: 2.5, reps: 6 },
        { id: '3', workoutId: 'b', exerciseId: 'p', order: 1, weight: 2.5, reps: 7 },
      ] },
    ]
    expect(bestSet(s, true)).toMatchObject({ weight: 2.5, reps: 7 })
    expect(bestSet([], true)).toBeNull()
  })
})

describe('comparisonColumns', () => {
  const mk = (id: string, day: number, sets: [number, number][]): Session => ({
    workoutId: id,
    startedAt: at(10, day),
    sets: sets.map(([weight, reps], i) => ({ id: id + i, workoutId: id, exerciseId: 'x', order: i, weight, reps })),
  })
  const deltas = (col: { cells: ({ weightDelta: string; repsDelta: string } | undefined)[] } | null) =>
    col!.cells.map((c) => (c ? [c.weightDelta, c.repsDelta] : null))

  // Mon → Tue → Wed
  const mon = mk('mon', 10, [[80, 8], [80, 6]])
  const tue = mk('tue', 11, [[82.5, 8], [80, 5], [70, 10]])
  const wed = mk('wed', 12, [[80, 9], [80, 5]])
  const all = [mon, tue, wed]

  it('colors "Letztes Training" against "Davor" and "Davor" against the session before it', () => {
    const r = comparisonColumns(all, all)!
    expect(r.last.session.workoutId).toBe('wed')
    expect(r.prev?.session.workoutId).toBe('tue')
    expect(r.rows).toBe(3)
    // Wed vs Tue: lighter & more reps, equal weight & equal reps, no third set
    expect(deltas(r.last)).toEqual([['down', 'up'], ['same', 'same'], null])
    // Tue vs Mon: heavier & equal reps, equal weight & fewer reps, set 3 is new
    expect(deltas(r.prev)).toEqual([['up', 'same'], ['same', 'down'], ['new', 'new']])
  })

  it('shows a single neutral column when there is only one session', () => {
    const r = comparisonColumns([wed], [wed])!
    expect(r.prev).toBeNull()
    expect(r.rows).toBe(2)
    expect(deltas(r.last)).toEqual([['none', 'none'], ['none', 'none']])
  })

  it('leaves "Davor" neutral when there are only two sessions', () => {
    const r = comparisonColumns([tue, wed], [tue, wed])!
    expect(deltas(r.last)).toEqual([['down', 'up'], ['same', 'same'], null])
    expect(deltas(r.prev)).toEqual([['none', 'none'], ['none', 'none'], ['none', 'none']])
  })

  it('uses sessions before the range for "Davor" and its comparison', () => {
    const r = comparisonColumns(all, [wed])!
    expect(r.prev?.session.workoutId).toBe('tue')
    expect(deltas(r.prev)[0]).toEqual(['up', 'same'])
    expect(comparisonColumns(all, [])).toBeNull()
  })

  it('compares added weight for bodyweight', () => {
    const a = mk('a', 1, [[5, 6], [0, 10]])
    const b = mk('b', 2, [[10, 6], [0, 9], [-20, 8]])
    const r = comparisonColumns([a, b], [a, b])!
    expect(deltas(r.last)).toEqual([['up', 'same'], ['same', 'down'], ['new', 'new']])
  })
})

describe('trendSeries', () => {
  const strength = () => sessionsFor(data(), 'builtin-bench-press', { key: 'all' }, now)
  const values = (sessions: Session[], m: Parameters<typeof trendSeries>[1]) => trendSeries(sessions, m).map((p) => p.value)

  it('computes 1RM, max weight and volume per session for strength', () => {
    expect(values(strength(), 'e1rm')).toEqual([90, 92.5, 95]) // 75×6, 75×7, 75×8
    expect(values(strength(), 'maxWeight')).toEqual([75, 75, 80])
    expect(values(strength(), 'volume')).toEqual([1010, 1350, 1000])
  })

  it('computes max reps, total reps and max added weight for bodyweight (incl. assisted)', () => {
    const mk = (id: string, sets: [number, number][]): Session => ({
      workoutId: id,
      startedAt: at(10, 1),
      sets: sets.map(([weight, reps], i) => ({ id: id + i, workoutId: id, exerciseId: 'p', order: i, weight, reps })),
    })
    const s = [mk('a', [[0, 10], [0, 8]]), mk('b', [[5, 6], [0, 9]]), mk('c', [[-20, 7]])]
    expect(values(s, 'maxReps')).toEqual([10, 9, 7])
    expect(values(s, 'totalReps')).toEqual([18, 15, 7])
    expect(values(s, 'maxAdded')).toEqual([0, 5, -20])
  })

  it('computes duration, distance and pace for cardio, skipping sessions without distance', () => {
    const mk = (id: string, entries: [number, number | undefined][]): Session => ({
      workoutId: id,
      startedAt: at(10, 1),
      sets: entries.map(([durationMin, distanceKm], i) => ({
        id: id + i, workoutId: id, exerciseId: 'builtin-treadmill', order: i, weight: 0, reps: 0, durationMin, distanceKm,
      })),
    })
    const s = [mk('a', [[20, 3], [10, 1.5]]), mk('b', [[15, undefined]])]
    expect(values(s, 'duration')).toEqual([30, 15])
    expect(values(s, 'distance')).toEqual([4.5])
    expect(values(s, 'pace')).toEqual([9])
  })
})

describe('chartSeries', () => {
  const mk = (id: string, sets: Partial<Session['sets'][number]>[]): Session => ({
    workoutId: id,
    startedAt: at(10, 1),
    sets: sets.map((x, i) => ({ id: id + i, workoutId: id, exerciseId: 'x', order: i, weight: 0, reps: 0, ...x })),
  })

  it('returns the unit of every metric', () => {
    const s = [mk('a', [{ weight: 80, reps: 5, durationMin: 20, distanceKm: 3 }])]
    const units = (['e1rm', 'maxWeight', 'volume', 'maxReps', 'totalReps', 'maxAdded', 'duration', 'distance', 'pace'] as const).map(
      (m) => chartSeries(s, m).unit,
    )
    expect(units).toEqual(['kg', 'kg', 'kg', 'Wdh.', 'Wdh.', 'kg', 'min', 'km', 'km/h'])
  })

  it('shows Volumen in t once the largest value reaches 10 000 kg', () => {
    const small = [mk('a', [{ weight: 100, reps: 10 }]), mk('b', [{ weight: 100, reps: 99 }])] // 1000, 9900
    expect(chartSeries(small, 'volume')).toEqual({ unit: 'kg', points: [expect.objectContaining({ value: 1000 }), expect.objectContaining({ value: 9900 })] })
    const big = [mk('a', [{ weight: 100, reps: 10 }]), mk('b', [{ weight: 125, reps: 100 }])] // 1000, 12500
    const r = chartSeries(big, 'volume')
    expect(r.unit).toBe('t')
    expect(r.points.map((p) => p.value)).toEqual([1, 12.5])
  })
})
