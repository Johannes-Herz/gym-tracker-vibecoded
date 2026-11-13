import { describe, expect, it } from 'vitest'
import { parseImport, serializeBackup } from '../storage/backup'
import { emptyData } from '../storage/storage'
import { buildDemoData, DEMO_DAYS, hasUserData } from './demoData'

const TODAY = new Date(2026, 10, 13, 21, 0) // local time, after any evening workout
const DAY_MS = 24 * 60 * 60 * 1000

function counter() {
  let n = 0
  return () => `id-${++n}`
}

function build(opts: { seed?: number; builtins?: ReturnType<typeof emptyData>['exercises'] } = {}) {
  return buildDemoData({ builtins: opts.builtins ?? emptyData().exercises, today: TODAY, seed: opts.seed, newId: counter() })
}

describe('buildDemoData', () => {
  const data = build()
  const kind = new Map(data.exercises.map((e) => [e.id, e.source]))

  it('produces valid data', () => {
    const result = parseImport(serializeBackup(data))
    expect(result.ok).toBe(true)
  })

  it('is deterministic for a fixed seed', () => {
    expect(build()).toEqual(data)
    expect(build({ seed: 1 })).not.toEqual(data)
  })

  it('uses both built-in and custom exercises', () => {
    const used = new Set(data.sets.map((s) => kind.get(s.exerciseId)))
    expect(used).toEqual(new Set(['builtin', 'custom']))
    expect(data.exercises.filter((e) => e.source === 'custom')).toHaveLength(2)
  })

  it('spans ~10 weeks with 3–4 workouts per week, none in the future', () => {
    expect(data.workouts.length).toBeGreaterThanOrEqual(30)
    expect(data.workouts.length).toBeLessThanOrEqual(40)
    const start = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() - (DEMO_DAYS - 1))
    const perWeek = new Array(DEMO_DAYS / 7).fill(0)
    for (const w of data.workouts) {
      const t = new Date(w.startedAt)
      expect(t.getTime()).toBeLessThanOrEqual(TODAY.getTime())
      expect(t.getTime()).toBeGreaterThanOrEqual(start.getTime())
      perWeek[Math.floor((t.getTime() - start.getTime()) / (7 * DAY_MS))]++
    }
    for (const n of perWeek) expect([3, 4]).toContain(n)
  })

  it('has 4–5 strength exercises with 3–4 sets each per workout', () => {
    for (const w of data.workouts) {
      const sets = data.sets.filter((s) => s.workoutId === w.id && s.durationMin === undefined)
      const byExercise = new Map<string, number>()
      for (const s of sets) byExercise.set(s.exerciseId, (byExercise.get(s.exerciseId) ?? 0) + 1)
      expect([4, 5]).toContain(byExercise.size)
      for (const n of byExercise.values()) expect([3, 4]).toContain(n)
    }
  })

  it('shows progressive overload on bench press', () => {
    const startedAt = new Map(data.workouts.map((w) => [w.id, new Date(w.startedAt).getTime()]))
    const bench = data.sets.filter((s) => s.exerciseId === 'builtin-bench-press')
    const avg = (from: number, to: number) => {
      const xs = bench.filter((s) => {
        const age = (TODAY.getTime() - startedAt.get(s.workoutId)!) / DAY_MS
        return age >= from && age < to
      })
      return xs.reduce((sum, s) => sum + s.weight, 0) / xs.length
    }
    expect(avg(0, 14)).toBeGreaterThan(avg(DEMO_DAYS - 14, DEMO_DAYS))
  })

  it('adds 1–2 cardio sessions per week with improving distance', () => {
    const start = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() - (DEMO_DAYS - 1))
    const startedAt = new Map(data.workouts.map((w) => [w.id, new Date(w.startedAt).getTime()]))
    const cardio = data.sets.filter((s) => s.durationMin !== undefined)
    const perWeek = new Array(DEMO_DAYS / 7).fill(0)
    for (const s of cardio) {
      expect(['builtin-treadmill', 'builtin-cross-trainer']).toContain(s.exerciseId)
      expect(s).toMatchObject({ weight: 0, reps: 0 })
      perWeek[Math.floor((startedAt.get(s.workoutId)! - start.getTime()) / (7 * DAY_MS))]++
    }
    for (const n of perWeek) expect([1, 2]).toContain(n)

    const runs = cardio
      .filter((s) => s.exerciseId === 'builtin-treadmill')
      .sort((a, b) => startedAt.get(a.workoutId)! - startedAt.get(b.workoutId)!)
    const pace = (s: (typeof runs)[number]) => s.distanceKm! / s.durationMin!
    const avg = (xs: typeof runs) => xs.reduce((sum, s) => sum + pace(s), 0) / xs.length
    expect(avg(runs.slice(-3))).toBeGreaterThan(avg(runs.slice(0, 3)))
  })

  it('includes bodyweight exercises with and without added weight, never assisted', () => {
    const pullUps = data.sets.filter((s) => s.exerciseId === 'builtin-pull-up')
    const dips = data.sets.filter((s) => s.exerciseId === 'builtin-dips')
    expect(pullUps.length).toBeGreaterThan(0)
    expect(pullUps.some((s) => s.weight === 0)).toBe(true)
    expect(pullUps.some((s) => s.weight > 0)).toBe(true)
    expect(dips.length).toBeGreaterThan(0)
    expect(dips.every((s) => s.weight > 0)).toBe(true)
    expect(data.sets.every((s) => s.weight >= 0)).toBe(true)
  })

  it('keeps built-ins and their hidden state', () => {
    const builtins = emptyData().exercises.map((e) => (e.id === 'builtin-squat' ? { ...e, hidden: true } : e))
    const result = build({ builtins })
    expect(result.exercises.find((e) => e.id === 'builtin-squat')?.hidden).toBe(true)
    expect(result.exercises.filter((e) => e.source === 'builtin')).toEqual(builtins)
  })

  it('adds plausible body weight entries with unique dates', () => {
    expect(data.bodyWeights.length).toBeGreaterThanOrEqual(25)
    expect(new Set(data.bodyWeights.map((b) => b.date)).size).toBe(data.bodyWeights.length)
    for (const b of data.bodyWeights) {
      expect(b.weightKg).toBeGreaterThanOrEqual(60)
      expect(b.weightKg).toBeLessThanOrEqual(110)
    }
  })
})

describe('hasUserData', () => {
  it('ignores built-ins and their hidden state', () => {
    const d = emptyData()
    d.exercises[0] = { ...d.exercises[0], hidden: true }
    expect(hasUserData(d)).toBe(false)
  })

  it('detects workouts and custom exercises', () => {
    expect(hasUserData({ ...emptyData(), workouts: [{ id: 'w', startedAt: TODAY.toISOString() }] })).toBe(true)
    const d = emptyData()
    d.exercises.push({ id: 'c', name: 'X', muscleGroup: 'Bauch', category: '', createdAt: '', source: 'custom' })
    expect(hasUserData(d)).toBe(true)
  })
})
