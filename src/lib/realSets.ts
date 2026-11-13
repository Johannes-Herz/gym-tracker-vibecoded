import type { WorkoutSet } from '../types'

/** A set the user has confirmed or typed; suggested (prefilled, unconfirmed) sets are not real data. */
export function isReal(s: Pick<WorkoutSet, 'suggested'>): boolean {
  return !s.suggested
}

/** Only the sets that count as real data (for stats, history, prefill, "recent"). */
export function realSets<T extends Pick<WorkoutSet, 'suggested'>>(sets: T[]): T[] {
  return sets.filter(isReal)
}
