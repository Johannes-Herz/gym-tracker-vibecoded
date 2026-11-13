import { localDateKey } from '../../lib/format'
import type { RangeKey, RangeSelection } from '../../storage/preferences'

export const RANGE_CHIPS: { key: RangeKey; label: string }[] = [
  { key: '2w', label: '2 W' },
  { key: '1m', label: '1 M' },
  { key: '3m', label: '3 M' },
  { key: '1y', label: '1 J' },
  { key: 'all', label: 'Alle' },
  { key: 'custom', label: 'Zeitraum' },
]

/** First and last local day (YYYY-MM-DD, inclusive) of a selection; null = open end. */
export function rangeDays(sel: RangeSelection, now: Date = new Date()): { from: string | null; to: string | null } {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const back = (days: number, months = 0, years = 0) =>
    localDateKey(new Date(today.getFullYear() - years, today.getMonth() - months, today.getDate() - days))
  switch (sel.key) {
    case '2w':
      return { from: back(13), to: null }
    case '1m':
      return { from: back(0, 1), to: null }
    case '3m':
      return { from: back(0, 3), to: null }
    case '1y':
      return { from: back(0, 0, 1), to: null }
    case 'all':
      return { from: null, to: null }
    case 'custom':
      return { from: sel.from ?? null, to: sel.to ?? null }
  }
}

export function inRange(startedAt: string, sel: RangeSelection, now: Date = new Date()): boolean {
  const { from, to } = rangeDays(sel, now)
  const day = localDateKey(new Date(startedAt))
  return (!from || day >= from) && (!to || day <= to)
}
