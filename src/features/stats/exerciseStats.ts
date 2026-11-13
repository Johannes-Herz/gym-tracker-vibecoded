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

export type Delta = 'up' | 'down' | 'same' | 'new'

export interface ComparisonRow {
  index: number
  weight: number
  reps: number
  weightDelta: Delta
  repsDelta: Delta
}

const delta = (now: number, before: number | undefined): Delta =>
  before === undefined ? 'new' : now > before ? 'up' : now < before ? 'down' : 'same'

/**
 * The newest session in the range, set by set against the session directly
 * before it (regardless of the range). For bodyweight the added weight is compared.
 */
export function compareWithPrevious(
  allSessions: Session[],
  rangeSessions: Session[],
): { last: Session; prev: Session | null; rows: ComparisonRow[] } | null {
  const last = rangeSessions[rangeSessions.length - 1]
  if (!last) return null
  const at = allSessions.findIndex((s) => s.workoutId === last.workoutId)
  const prev = at > 0 ? allSessions[at - 1] : null
  const rows = last.sets.map((s, index) => {
    const p = prev?.sets[index]
    return {
      index,
      weight: s.weight,
      reps: s.reps,
      weightDelta: delta(s.weight, p?.weight),
      repsDelta: delta(s.reps, p?.reps),
    }
  })
  return { last, prev, rows }
}

/** Trend per session: best estimated 1RM for strength, total reps for bodyweight. */
export function trend(sessions: Session[], bodyweight: boolean): { startedAt: string; value: number }[] {
  return sessions.map((s) => ({
    startedAt: s.startedAt,
    value: bodyweight
      ? s.sets.reduce((sum, x) => sum + x.reps, 0)
      : Math.round(Math.max(...s.sets.map((x) => estimate1RM(x.weight, x.reps))) * 10) / 10,
  }))
}
