import type { Exercise } from '../../types'

/** Case-insensitive match on German name, English alias and muscle group. */
export function matchesQuery(e: Exercise, query: string): boolean {
  const q = query.trim().toLocaleLowerCase('de')
  if (!q) return true
  return [e.name, e.aliasEn ?? '', e.muscleGroup].some((s) => s.toLocaleLowerCase('de').includes(q))
}

export function byName(a: Exercise, b: Exercise): number {
  return a.name.localeCompare(b.name, 'de')
}
