import type { RangeSelection } from '../../storage/preferences'
import type { AppData, WorkoutSet } from '../../types'
import { inRange } from './range'
import { estimate1RM } from './stats'

export interface Session {
  workoutId: string
  startedAt: string
  sets: WorkoutSet[] // sets of this exercise, in logged order
}

/** Sessions (workouts) with this exercise inside the range, oldest first. */
export function sessionsFor(
  data: AppData,
  exerciseId: string,
  range: RangeSelection,
  now: Date = new Date(),
): Session[] {
  return data.workouts
    .filter((w) => inRange(w.startedAt, range, now))
    .map((w) => ({
      workoutId: w.id,
      startedAt: w.startedAt,
      sets: data.sets
        .filter((s) => s.workoutId === w.id && s.exerciseId === exerciseId)
        .sort((a, b) => a.order - b.order),
    }))
    .filter((s) => s.sets.length > 0)
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt))
}

export interface HeatCell {
  best: number // best reps at this weight in this session
  reps: number[] // all sets at this weight, in order
}

export const cellKey = (weight: number, workoutId: string) => `${weight}|${workoutId}`

/** Weights that occur (heaviest first) and one cell per weight × session that was used. */
export function heatmapData(sessions: Session[]): { weights: number[]; cells: Map<string, HeatCell> } {
  const cells = new Map<string, HeatCell>()
  const weights = new Set<number>()
  for (const session of sessions) {
    for (const s of session.sets) {
      weights.add(s.weight)
      const key = cellKey(s.weight, session.workoutId)
      const cell = cells.get(key) ?? { best: 0, reps: [] }
      cell.reps.push(s.reps)
      cell.best = Math.max(cell.best, s.reps)
      cells.set(key, cell)
    }
  }
  return { weights: [...weights].sort((a, b) => b - a), cells }
}

const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']

/** "9.11." */
export function dayMonth(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate()}.${d.getMonth() + 1}.`
}

/** Column labels: dates for up to 8 sessions, otherwise the month on its first session. */
export function axisLabels(sessions: Session[]): string[] {
  if (sessions.length <= 8) return sessions.map((s) => dayMonth(s.startedAt))
  let lastMonth = -1
  return sessions.map((s) => {
    const d = new Date(s.startedAt)
    const month = d.getFullYear() * 12 + d.getMonth()
    if (month === lastMonth) return ''
    lastMonth = month
    return MONTHS[d.getMonth()]
  })
}

/** Strength: highest estimated 1RM (heavier wins ties). Bodyweight: highest load, then most reps. */
export function bestSet(sessions: Session[], bodyweight: boolean): WorkoutSet | null {
  let best: WorkoutSet | null = null
  const score = (s: WorkoutSet): [number, number] =>
    bodyweight ? [s.weight, s.reps] : [estimate1RM(s.weight, s.reps), s.weight]
  for (const session of sessions) {
    for (const s of session.sets) {
      if (!best) {
        best = s
        continue
      }
      const [a1, a2] = score(s)
      const [b1, b2] = score(best)
      if (a1 > b1 || (a1 === b1 && a2 > b2)) best = s
    }
  }
  return best
}

/**
 * Change of a value against the same set number of the session before:
 * 'new' = that session had no such set, 'none' = there is no session before.
 */
export type Delta = 'up' | 'down' | 'same' | 'new' | 'none'

export interface ComparisonCell {
  weight: number
  reps: number
  weightDelta: Delta
  repsDelta: Delta
}

export interface ComparisonColumn {
  session: Session
  /** One entry per set number up to the table's row count; undefined = no such set. */
  cells: (ComparisonCell | undefined)[]
}

function delta(now: number, before: number | undefined, hasBase: boolean): Delta {
  if (!hasBase) return 'none'
  if (before === undefined) return 'new'
  return now > before ? 'up' : now < before ? 'down' : 'same'
}

/**
 * Two columns: the newest session in the range ("Letztes Training") and the
 * session before it ("Davor", regardless of the range). Each column is compared,
 * set by set, with the session directly before *it*. For bodyweight the added
 * weight is compared. Null when the range has no session.
 */
export function comparisonColumns(
  allSessions: Session[],
  rangeSessions: Session[],
): { rows: number; last: ComparisonColumn; prev: ComparisonColumn | null } | null {
  const lastSession = rangeSessions[rangeSessions.length - 1]
  if (!lastSession) return null
  const at = allSessions.findIndex((s) => s.workoutId === lastSession.workoutId)
  const before = (i: number) => (i > 0 ? allSessions[i - 1] : null)
  const prevSession = before(at)
  const rows = Math.max(lastSession.sets.length, prevSession?.sets.length ?? 0)

  const column = (session: Session, base: Session | null): ComparisonColumn => ({
    session,
    cells: Array.from({ length: rows }, (_, i) => {
      const s = session.sets[i]
      if (!s) return undefined
      const b = base?.sets[i]
      return {
        weight: s.weight,
        reps: s.reps,
        weightDelta: delta(s.weight, b?.weight, base !== null),
        repsDelta: delta(s.reps, b?.reps, base !== null),
      }
    }),
  })

  return {
    rows,
    last: column(lastSession, prevSession),
    prev: prevSession ? column(prevSession, before(at - 1)) : null,
  }
}

export type ExerciseKind = 'strength' | 'bodyweight' | 'cardio'

export const TREND_METRICS = {
  strength: [
    { key: 'e1rm', label: '1RM', unit: 'kg' },
    { key: 'maxWeight', label: 'Max. Gewicht', unit: 'kg' },
    { key: 'volume', label: 'Volumen', unit: 'kg' },
  ],
  bodyweight: [
    { key: 'maxReps', label: 'Max. Wdh.', unit: 'Wdh.' },
    { key: 'totalReps', label: 'Wdh. gesamt', unit: 'Wdh.' },
    { key: 'maxAdded', label: 'Max. Zusatz', unit: 'kg' },
  ],
  cardio: [
    { key: 'duration', label: 'Dauer', unit: 'min' },
    { key: 'distance', label: 'Distanz', unit: 'km' },
    { key: 'pace', label: 'Tempo', unit: 'km/h' },
  ],
} as const

export type TrendMetric = (typeof TREND_METRICS)[ExerciseKind][number]['key']

const round1 = (n: number) => Math.round(n * 10) / 10
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)

function metricValue(sets: WorkoutSet[], metric: TrendMetric): number | null {
  const withDistance = sets.filter((s) => s.distanceKm !== undefined)
  switch (metric) {
    case 'e1rm':
      return Math.max(...sets.map((s) => estimate1RM(s.weight, s.reps)))
    case 'maxWeight':
    case 'maxAdded':
      return Math.max(...sets.map((s) => s.weight))
    case 'volume':
      return sum(sets.map((s) => s.weight * s.reps))
    case 'maxReps':
      return Math.max(...sets.map((s) => s.reps))
    case 'totalReps':
      return sum(sets.map((s) => s.reps))
    case 'duration':
      return sum(sets.map((s) => s.durationMin ?? 0))
    case 'distance':
      return withDistance.length ? sum(withDistance.map((s) => s.distanceKm ?? 0)) : null
    case 'pace': {
      const minutes = sum(withDistance.map((s) => s.durationMin ?? 0))
      if (!withDistance.length || minutes <= 0) return null
      return sum(withDistance.map((s) => s.distanceKm ?? 0)) / (minutes / 60)
    }
  }
}

/** One point per session for the chosen metric; sessions without a value (e.g. no distance) are skipped. */
export function trendSeries(sessions: Session[], metric: TrendMetric): { startedAt: string; value: number }[] {
  const points: { startedAt: string; value: number }[] = []
  for (const s of sessions) {
    const value = metricValue(s.sets, metric)
    if (value !== null && Number.isFinite(value)) points.push({ startedAt: s.startedAt, value: round1(value) })
  }
  return points
}
