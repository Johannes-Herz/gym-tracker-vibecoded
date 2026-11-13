import { equipmentLabelsAll, muscleLabelsAll } from '../../i18n/labels'
import { MUSCLE_GROUPS, type Equipment, type Exercise, type MuscleGroup } from '../../types'
import { byDisplayName } from './exerciseName'

/**
 * Case-insensitive match on German name, English name, extra aliases and the
 * muscle group / equipment in both languages: independent of the UI language.
 */
export function matchesQuery(e: Exercise, query: string): boolean {
  const q = query.trim().toLocaleLowerCase('de')
  if (!q) return true
  const terms = [
    e.name,
    e.aliasEn ?? '',
    ...(e.aliases ?? []),
    ...muscleLabelsAll(e.muscleGroup),
    ...(e.equipment ? equipmentLabelsAll(e.equipment as Equipment) : []),
  ]
  return terms.some((s) => s.toLocaleLowerCase('de').includes(q))
}

/** Sort by name in the UI language. */
export const byName = byDisplayName

export interface SearchSection {
  title: string | null
  items: Exercise[]
}

/**
 * Sections for the exercise search. With a query: one flat list of matches.
 * Without: recently used first, then one section per muscle group.
 * `group` (a muscle group chip) narrows both.
 */
export function searchSections(
  exercises: Exercise[],
  opts: { query: string; group?: MuscleGroup | null; recentIds?: string[] },
): SearchSection[] {
  const pool = exercises.filter((e) => !opts.group || e.muscleGroup === opts.group)
  if (opts.query.trim()) {
    const items = pool.filter((e) => matchesQuery(e, opts.query)).sort(byName)
    return items.length ? [{ title: null, items }] : []
  }
  const sections: SearchSection[] = []
  const recent = (opts.recentIds ?? [])
    .map((id) => pool.find((e) => e.id === id))
    .filter((e): e is Exercise => e !== undefined)
  if (recent.length) sections.push({ title: 'Zuletzt verwendet', items: recent })
  for (const g of MUSCLE_GROUPS) {
    const items = pool.filter((e) => e.muscleGroup === g).sort(byName)
    if (items.length) sections.push({ title: g, items })
  }
  return sections
}
