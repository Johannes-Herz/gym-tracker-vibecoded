import { localDateKey } from '../../lib/format'
import type { AppData } from '../../types'

/** Local days (YYYY-MM-DD) with at least one workout. */
export function trainingDays(data: Pick<AppData, 'workouts'>): Set<string> {
  return new Set(data.workouts.map((w) => localDateKey(new Date(w.startedAt))))
}

/**
 * Cells for a month grid starting on Monday. Leading/trailing blanks are null,
 * days are 1-based. `month` is 0-based like Date.
 */
export function monthGrid(year: number, month: number): (number | null)[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const offset = (new Date(year, month, 1).getDay() + 6) % 7 // Monday = 0
  const cells: (number | null)[] = Array(offset).fill(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}
