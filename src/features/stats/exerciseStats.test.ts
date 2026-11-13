import { describe, expect, it } from 'vitest'
import { emptyData } from '../../storage/storage'
import { formatLoad } from '../exercises/bodyweight'
import type { AppData } from '../../types'
import {
  axisLabels,
  bestSet,
  cellKey,
  compareWithPrevious,
  heatmapData,
  sessionsFor,
  trend,
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
    expect(weights.map((w) => formatLoad(w, true))).toEqual(['+5', 'KG', '−20'])
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

describe('compareWithPrevious', () => {
  const all = () => sessionsFor(data(), 'builtin-bench-press', { key: 'all' }, now)
  const deltas = (r: ReturnType<typeof compareWithPrevious>) => r!.rows.map((x) => [x.weightDelta, x.repsDelta])

  it('compares weight and reps per set with the previous session', () => {
    // w2: 75×6, 75×7, 75×5  →  w3: 80×5, 75×8
    const r = compareWithPrevious(all(), all())!
    expect([r.last.workoutId, r.prev?.workoutId]).toEqual(['w3', 'w2'])
    expect(deltas(r)).toEqual([
      ['up', 'down'],
      ['same', 'up'],
    ])
  })

  it('detects lighter weight, equal values and sets without counterpart', () => {
    // w1: 70×8, 75×6  →  w2: 75×6, 75×7, 75×5
    const s = all()
    expect(deltas(compareWithPrevious(s, s.slice(0, 2)))).toEqual([
      ['up', 'down'],
      ['same', 'up'],
      ['new', 'new'],
    ])
    // reversed order: w2 → w1 means lighter first set
    const reversed = [s[1], s[0]]
    expect(deltas(compareWithPrevious(reversed, reversed))[0]).toEqual(['down', 'up'])
  })

  it('uses the previous session even if it is outside the range', () => {
    const inRange = sessionsFor(data(), 'builtin-bench-press', { key: 'custom', from: '2026-11-10' }, now)
    expect(inRange.map((x) => x.workoutId)).toEqual(['w3'])
    expect(compareWithPrevious(all(), inRange)!.prev?.workoutId).toBe('w2')
  })

  it('compares added weight for bodyweight and handles a first session', () => {
    const mk = (id: string, day: number, weights: number[]): Session => ({
      workoutId: id,
      startedAt: at(10, day),
      sets: weights.map((weight, i) => ({ id: id + i, workoutId: id, exerciseId: 'p', order: i, weight, reps: 6 })),
    })
    const sessions = [mk('a', 1, [5, 0]), mk('b', 2, [10, 0, -20])]
    expect(compareWithPrevious(sessions, sessions)!.rows.map((x) => x.weightDelta)).toEqual(['up', 'same', 'new'])
    const first = compareWithPrevious(sessions.slice(0, 1), sessions.slice(0, 1))!
    expect(first.prev).toBeNull()
    expect(first.rows.every((x) => x.weightDelta === 'new' && x.repsDelta === 'new')).toBe(true)
    expect(compareWithPrevious(sessions, [])).toBeNull()
  })
})

describe('trend', () => {
  it('is total reps per session for bodyweight and best e1RM for strength', () => {
    const s = sessionsFor(data(), 'builtin-bench-press', { key: 'all' }, now)
    expect(trend(s, true).map((p) => p.value)).toEqual([14, 18, 13])
    expect(trend(s, false)[0].value).toBe(90) // 75×6 beats 70×8 (88.7)
  })
})
