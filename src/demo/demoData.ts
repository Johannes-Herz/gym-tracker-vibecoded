import { newId as defaultNewId } from '../lib/id'
import { CURRENT_SCHEMA_VERSION, ensureBuiltins } from '../storage/storage'
import type { AppData, BodyWeightEntry, Exercise, Template as WorkoutTemplate, Workout, WorkoutSet } from '../types'
import { createRandom, type Random } from './random'

export const DEMO_SEED = 20261113
export const DEMO_DAYS = 70 // 10 weeks, ending today

/** True if there is anything besides built-in exercises (and their hidden state). */
export function hasUserData(data: AppData): boolean {
  return (
    data.workouts.length > 0 ||
    data.sets.length > 0 ||
    data.bodyWeights.length > 0 ||
    data.templates.length > 0 ||
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
  bw?: {
    reps: number
    perWeek: number
    /**
     * Sets with added weight: 'top' = 1–2 heavier sets first, then pure bodyweight (from `fromWeek`);
     * 'main' = one bodyweight warm-up set, then all sets with added weight.
     */
    added?: { style: 'top' | 'main'; start: number; perWeek: number; fromWeek: number }
  }
}

const t = (id: string, start: number, perWeek: number, step = 2.5): Template => ({ id, start, perWeek, step })
const bw = (id: string, reps: number, perWeek: number, added?: NonNullable<Template['bw']>['added']): Template => ({
  id,
  start: 0,
  perWeek: 0,
  step: 2.5,
  bw: { reps, perWeek, added },
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
      extras: [t('builtin-lateral-raise', 8, 0.2, 2), t('builtin-triceps-pushdown', 25, 0.5), t('builtin-skull-crusher', 30, 0.4), t(arnoldId, 16, 0.3, 2), bw('builtin-dips', 10, 0.3, { style: 'main', start: 5, perWeek: 0.75, fromWeek: 0 })],
    },
    {
      // Pull (deadlift is added on every other pull day)
      core: [t('builtin-lat-pulldown', 55, 0.8), t('builtin-barbell-row', 60, 1)],
      extras: [t('builtin-face-pull', 20, 0.4), t('builtin-ez-curl', 27.5, 0.5), t('builtin-hammer-curl', 12, 0.25, 2), bw('builtin-pull-up', 6, 0.35, { style: 'top', start: 2.5, perWeek: 0.4, fromWeek: 2 })],
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

  // One template per split day, in the order a session usually runs.
  const templateDefs: { name: string; exerciseIds: string[] }[] = [
    {
      name: 'Push Tag',
      exerciseIds: ['builtin-bench-press', 'builtin-overhead-press', 'builtin-incline-dumbbell-press', 'builtin-lateral-raise', 'builtin-triceps-pushdown'],
    },
    {
      name: 'Pull Tag',
      exerciseIds: ['builtin-lat-pulldown', 'builtin-barbell-row', 'builtin-face-pull', 'builtin-ez-curl'],
    },
    {
      name: 'Beine',
      exerciseIds: ['builtin-squat', 'builtin-romanian-deadlift', 'builtin-leg-press', 'builtin-leg-curl', 'builtin-standing-calf-raise'],
    },
  ]
  const templates: WorkoutTemplate[] = templateDefs.map((d) => ({
    id: newId(),
    name: d.name,
    exerciseIds: d.exerciseIds,
    createdAt: start.toISOString(),
    updatedAt: start.toISOString(),
  }))

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

    const planIndex = splitIndex % split.length
    // The second half of the demo period was started from templates, so the label shows up.
    const label = day >= DEMO_DAYS / 2 ? templates[planIndex] : undefined
    const workout: Workout = {
      id: newId(),
      startedAt: startedAt.toISOString(),
      ...(label && { templateId: label.id, templateName: label.name }),
    }
    workouts.push(workout)

    const plan = split[planIndex]
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
    templates,
  })
}

type SetValue = { weight: number; reps: number }

const roundTo = (x: number, step: number) => Math.round(x / step) * step

/**
 * Sets for one exercise in one session. Strength exercises use a seeded mix of
 * straight sets, pyramids, back-off sets and a warm-up set around the
 * progressing working weight; bodyweight exercises mix pure and added-weight sets.
 */
function generateSets(rnd: Random, ex: Template, weeks: number, badDay: boolean): SetValue[] {
  if (ex.bw) return bodyweightSets(rnd, ex.bw, weeks, badDay)

  const working = (ex.start + weeks * ex.perWeek + (rnd.next() - 0.5) * ex.step) * (badDay ? 0.9 : 1)
  const W = Math.max(ex.step, roundTo(working, ex.step))
  const at = (steps: number) => Math.max(ex.step, W + steps * ex.step)
  const base = rnd.int(8, 10) - (badDay ? 1 : 0)
  const reps = (n: number) => Math.max(3, n)

  const straight = (count: number, weight: number, start: number): SetValue[] => {
    const out: SetValue[] = []
    let r = start
    for (let i = 0; i < count; i++) {
      out.push({ weight, reps: reps(r) })
      r -= rnd.int(0, 1)
    }
    return out
  }

  const pattern = rnd.next()
  if (pattern < 0.4) return straight(rnd.int(3, 4), W, base)
  if (pattern < 0.65) {
    // Pyramid: weight up, reps down.
    const sets = [
      { weight: at(-2), reps: reps(base + 2) },
      { weight: at(-1), reps: reps(base + 1) },
      { weight: W, reps: reps(base - 1) },
    ]
    if (rnd.chance(0.4)) sets.push({ weight: at(1), reps: reps(base - 2) })
    return sets
  }
  if (pattern < 0.85) {
    // Back-off: one heavy top set, then lighter volume sets.
    return [{ weight: at(1), reps: reps(base - 3) }, ...straight(rnd.int(2, 3), at(-2), base + 1)]
  }
  // Lighter warm-up set, then straight sets.
  const warmup = Math.max(ex.step, roundTo(W * 0.6, ex.step))
  return [{ weight: warmup, reps: rnd.int(10, 12) }, ...straight(3, W, base)]
}

function bodyweightSets(rnd: Random, bw: NonNullable<Template['bw']>, weeks: number, badDay: boolean): SetValue[] {
  const base = bw.reps + Math.floor(weeks * bw.perWeek) + rnd.int(-1, 1) - (badDay ? 2 : 0)
  const pure = (count: number, start: number): SetValue[] => {
    const out: SetValue[] = []
    let r = start
    for (let i = 0; i < count; i++) {
      out.push({ weight: 0, reps: Math.max(3, r) })
      r -= rnd.int(0, 1)
    }
    return out
  }
  const added = bw.added
  if (!added || weeks < added.fromWeek) return pure(rnd.int(3, 4), base)

  const extra = Math.max(2.5, roundTo(added.start + (weeks - added.fromWeek) * added.perWeek, 2.5))
  if (added.style === 'top') {
    // 1–2 heavier sets with added weight first, then pure bodyweight sets with more reps.
    const top = rnd.int(1, 2)
    const heavy = Array.from({ length: top }, (_, i) => ({ weight: extra, reps: Math.max(3, base - 2 - i) }))
    return [...heavy, ...pure(rnd.int(2, 3), base)]
  }
  // One bodyweight warm-up set, then the work sets with added weight.
  const work: SetValue[] = []
  let r = base - 3
  for (let i = 0, n = rnd.int(2, 3); i < n; i++) {
    work.push({ weight: extra, reps: Math.max(3, r) })
    r -= rnd.int(0, 1)
  }
  return [{ weight: 0, reps: base }, ...work]
}

function dayKey(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
