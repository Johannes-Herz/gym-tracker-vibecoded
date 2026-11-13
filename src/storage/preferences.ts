// Device-local UI preferences. Kept separate from app data: no schema
// version, not part of export/import, untouched by "delete all data".

export const PREFS_KEY = 'gymtracker:prefs'

export type HistoryView = 'list' | 'calendar'

export const RANGE_KEYS = ['2w', '1m', '3m', '1y', 'all', 'custom'] as const
export type RangeKey = (typeof RANGE_KEYS)[number]

/** Time range for exercise statistics. `from`/`to` are local days (YYYY-MM-DD), only for 'custom'. */
export interface RangeSelection {
  key: RangeKey
  from?: string
  to?: string
}

export const DEFAULT_RANGE: RangeSelection = { key: '1m' }

export type Language = 'de' | 'en'
export const LANGUAGES: readonly Language[] = ['de', 'en']
export const DEFAULT_LANGUAGE: Language = 'de'

interface Prefs {
  language?: unknown
  historyView?: HistoryView
  statsRange?: unknown
  trendMetric?: unknown
}

function read(storage: Storage): Prefs {
  try {
    const parsed: unknown = JSON.parse(storage.getItem(PREFS_KEY) ?? '{}')
    return typeof parsed === 'object' && parsed !== null ? (parsed as Prefs) : {}
  } catch {
    return {}
  }
}

export function loadHistoryView(storage: Storage = localStorage): HistoryView {
  return read(storage).historyView === 'calendar' ? 'calendar' : 'list'
}

export function saveHistoryView(view: HistoryView, storage: Storage = localStorage): void {
  try {
    storage.setItem(PREFS_KEY, JSON.stringify({ ...read(storage), historyView: view }))
  } catch {
    // Preferences are a convenience; ignore storage failures.
  }
}

const isDay = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)

export function loadStatsRange(storage: Storage = localStorage): RangeSelection {
  const raw = read(storage).statsRange
  if (typeof raw !== 'object' || raw === null) return DEFAULT_RANGE
  const { key, from, to } = raw as Record<string, unknown>
  if (!(RANGE_KEYS as readonly unknown[]).includes(key)) return DEFAULT_RANGE
  if (key !== 'custom') return { key: key as RangeKey }
  return { key: 'custom', from: isDay(from) ? from : undefined, to: isDay(to) ? to : undefined }
}

export function saveStatsRange(range: RangeSelection, storage: Storage = localStorage): void {
  try {
    storage.setItem(PREFS_KEY, JSON.stringify({ ...read(storage), statsRange: range }))
  } catch {
    // Preferences are a convenience; ignore storage failures.
  }
}

function trendMetrics(prefs: Prefs): Record<string, unknown> {
  const t = prefs.trendMetric
  return typeof t === 'object' && t !== null ? (t as Record<string, unknown>) : {}
}

/** Last chosen trend metric for an exercise kind; falls back to the first allowed one. */
export function loadTrendMetric<T extends string>(kind: string, allowed: readonly T[], storage: Storage = localStorage): T {
  const stored = trendMetrics(read(storage))[kind]
  return (allowed as readonly unknown[]).includes(stored) ? (stored as T) : allowed[0]
}

export function saveTrendMetric(kind: string, metric: string, storage: Storage = localStorage): void {
  try {
    const prefs = read(storage)
    storage.setItem(PREFS_KEY, JSON.stringify({ ...prefs, trendMetric: { ...trendMetrics(prefs), [kind]: metric } }))
  } catch {
    // Preferences are a convenience; ignore storage failures.
  }
}

/** UI language of this device. German unless English was chosen explicitly. */
export function loadLanguage(storage: Storage = localStorage): Language {
  const stored = read(storage).language
  return (LANGUAGES as readonly unknown[]).includes(stored) ? (stored as Language) : DEFAULT_LANGUAGE
}

export function saveLanguage(language: Language, storage: Storage = localStorage): void {
  try {
    storage.setItem(PREFS_KEY, JSON.stringify({ ...read(storage), language }))
  } catch {
    // Preferences are a convenience; ignore storage failures.
  }
}
