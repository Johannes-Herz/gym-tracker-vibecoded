import { newId as defaultNewId } from '../lib/id'
import { CURRENT_SCHEMA_VERSION, ensureBuiltins } from '../storage/storage'
import type { AppData, BodyWeightEntry, Exercise, Workout, WorkoutSet } from '../types'
import { createRandom, type Random } from './random'

export const DEMO_SEED = 20261113
export const DEMO_DAYS = 70 // 10 weeks, ending today

/** True if there is anything besides built-in exercises (and their hidden state). */
export function hasUserData(data: AppData): boolean {
  return (
    data.workouts.length > 0 ||
    data.sets.length > 0 ||
    data.bodyWeights.length > 0 ||
    data.exercises.some((e) => e.source !== 'builtin')
  )
}

interface Template {
  id: string
  /** Start weight in kg; 0 = body weight exercise (reps progress instead). */
  start: number
  /** Weight gain per week in kg. */
  perWeek: number
  /** Rounding step in kg. */
  step: number
  /** Body weight exercises (start 0): base reps, rep gain per week, week from which +2.5 kg appears. */
  bw?: { reps: number; perWeek: number; addedFromWeek?: number }
}

const t = (id: string, start: number, perWeek: number, step = 2.5): Template => ({ id, start, perWeek, step })
const bw = (id: string, reps: number, perWeek: number, addedFromWeek?: number): Template => ({
  id,
  start: 0,
  perWeek: 0,
  step: 2.5,
  bw: { reps, perWeek, addedFromWeek },
})

interface Options {
  builtins: Exercise[]
  today?: Date
  seed?: number
  newId?: () => string
}

export function buildDemoData({ builtins, today = new Date(), seed = DEMO_SEED, newId = defaultNewId }: Options): AppData {
  const rnd = createRandom(seed)
  const arnoldId = newId()
  const sissyId = newId()

  const split: { core: Template[]; extras: Template[] }[] = [
    {
      // Push
      core: [t('builtin-bench-press', 70, 1.25), t('builtin-overhead-press', 42.5, 0.6), t('builtin-incline-dumbbell-press', 24, 0.4, 2)],
      extras: [t('builtin-lateral-raise', 8, 0.2, 2), t('builtin-triceps-pushdown', 25, 0.5), t(arnoldId, 16, 0.3, 2), t('builtin-dips', 5, 0.75)],
    },
    {
      // Pull (deadlift is added on every other pull day)
      core: [t('builtin-lat-pulldown', 55, 0.8), t('builtin-barbell-row', 60, 1)],
      extras: [t('builtin-face-pull', 20, 0.4), t('builtin-barbell-curl', 30, 0.5), t('builtin-hammer-curl', 12, 0.25, 2), bw('builtin-pull-up', 6, 0.35, 6)],
    },
    {
      // Legs
      core: [t('builtin-squat', 90, 1.5), t('builtin-romanian-deadlift', 80, 1.25), t('builtin-leg-press', 140, 3)],
      extras: [t('builtin-leg-curl', 40, 0.6), t('builtin-standing-calf-raise', 60, 1), bw(sissyId, 12, 0.6)],
    },
  ]
  const deadlift = t('builtin-deadlift', 110, 2)

  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const start = new Date(end)
  start.setDate(start.getDate() - (DEMO_DAYS - 1))

  const workouts: Workout[] = []
  const sets: WorkoutSet[] = []
  const bodyWeights: BodyWeightEntry[] = []
  let splitIndex = 0
  let pullDays = 0
  let saturday = false
  let weighDays = new Set<number>()
  let cardioCount = 0

  for (let day = 0; day < DEMO_DAYS; day++) {
    const date = new Date(start)
    date.setDate(start.getDate() + day)
    if (day % 7 === 0) {
      saturday = rnd.chance(0.5)
      weighDays = new Set(rnd.shuffle([0, 1, 2, 3, 4, 5, 6]).slice(0, 3))
    }

    if (weighDays.has(day % 7)) {
      const kg = 80 + (1.5 * day) / (DEMO_DAYS - 1) + (rnd.next() - 0.5) * 0.8
      bodyWeights.push({ id: newId(), date: dayKey(date), weightKg: Math.round(kg * 10) / 10 })
    }

    const weekday = date.getDay()
    if (!(weekday === 1 || weekday === 3 || weekday === 5 || (weekday === 6 && saturday))) continue

    const startedAt = new Date(date)
    const evening = rnd.chance(0.6)
    startedAt.setHours(evening ? rnd.int(18, 20) : 7, rnd.int(0, evening ? 59 : 30))
    if (startedAt > today) continue

    const workout: Workout = { id: newId(), startedAt: startedAt.toISOString() }
    workouts.push(workout)

    const plan = split[splitIndex % split.length]
    if (splitIndex % split.length === 1) pullDays++
    splitIndex++
    const core = plan === split[1] && pullDays % 2 === 1 ? [deadlift, ...plan.core] : plan.core
    const count = rnd.int(4, 5)
    const exercises = [...core, ...rnd.shuffle(plan.extras).slice(0, Math.max(0, count - core.length))]

    const badDay = rnd.chance(0.07)
    let order = 0
    for (const ex of exercises) {
      for (const s of generateSets(rnd, ex, day / 7, badDay)) {
        sets.push({ id: newId(), workoutId: workout.id, exerciseId: ex.id, order: order++, ...s })
      }
    }

    // Cardio finisher: every Monday, plus Friday in every other week (1–2 per week).
    if (weekday === 1 || (weekday === 5 && Math.floor(day / 7) % 2 === 0)) {
      const treadmill = cardioCount++ % 2 === 0
      const durationMin = rnd.int(20, 30)
      const kmh = (treadmill ? 9 : 7.5) + (day / 7) * (treadmill ? 0.1 : 0.08) + (rnd.next() - 0.5) * 0.3
      sets.push({
        id: newId(),
        workoutId: workout.id,
        exerciseId: treadmill ? 'builtin-treadmill' : 'builtin-cross-trainer',
        order: order++,
        weight: 0,
        reps: 0,
        durationMin,
        distanceKm: Math.round(((durationMin / 60) * kmh) * 10) / 10,
      })
    }
  }

  const firstWorkout = workouts[0]?.startedAt ?? today.toISOString()
  const custom: Exercise[] = [
    { id: arnoldId, name: 'Arnold Press', muscleGroup: 'Schultern', category: 'Push', equipment: 'Kurzhantel', createdAt: firstWorkout, source: 'custom' },
    { id: sissyId, name: 'Sissy Squat', muscleGroup: 'Beine', category: 'Legs', equipment: 'Körpergewicht', createdAt: firstWorkout, source: 'custom' },
  ]

  return ensureBuiltins({
    schemaVersion: CURRENT_SCHEMA_VERSION,
    exercises: [...builtins, ...custom],
    workouts,
    sets,
    bodyWeights,
  })
}

function generateSets(rnd: Random, ex: Template, weeks: number, badDay: boolean) {
  const count = rnd.int(3, 4)
  let reps = rnd.int(8, 10) - (badDay ? 1 : 0)
  let weight = 0
  if (ex.bw) {
    reps = ex.bw.reps + Math.floor(weeks * ex.bw.perWeek) + rnd.int(-1, 1) - (badDay ? 2 : 0)
    // Later on, some days with a little added weight (and a rep less).
    if (ex.bw.addedFromWeek !== undefined && weeks >= ex.bw.addedFromWeek && rnd.chance(0.5)) {
      weight = 2.5
      reps -= 1
    }
  } else if (ex.start > 0) {
    const raw = (ex.start + weeks * ex.perWeek + (rnd.next() - 0.5) * ex.step) * (badDay ? 0.9 : 1)
    weight = Math.max(ex.step, Math.round(raw / ex.step) * ex.step)
  }

  const out: { weight: number; reps: number }[] = []
  for (let i = 0; i < count; i++) {
    out.push({ weight, reps: Math.max(4, reps) })
    reps -= rnd.int(0, 1)
  }
  return out
}

function dayKey(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
