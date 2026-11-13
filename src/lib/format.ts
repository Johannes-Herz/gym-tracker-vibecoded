import { LOCALES, getLang } from '../i18n'
import type { Language } from '../i18n'

/**
 * Language-aware formatting. Everything reads the current UI language at call
 * time; formatters are cached per language.
 */
const cache = new Map<string, Intl.DateTimeFormat | Intl.NumberFormat>()

function dateFormat(kind: string, options: Record<Language, Intl.DateTimeFormatOptions>): Intl.DateTimeFormat {
  const lang = getLang()
  const key = `${kind}:${lang}`
  let f = cache.get(key) as Intl.DateTimeFormat | undefined
  if (!f) {
    f = new Intl.DateTimeFormat(LOCALES[lang], options[lang])
    cache.set(key, f)
  }
  return f
}

/** "Mi., 12.11.2026, 18:30" / "Wed, Nov 12, 2026, 6:30 PM" */
export function formatDateTime(iso: string): string {
  return dateFormat('dateTime', {
    de: { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' },
    en: { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' },
  }).format(new Date(iso))
}

/** "November 2026" */
export function formatMonthYear(d: Date): string {
  const o: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' }
  return dateFormat('monthYear', { de: o, en: o }).format(d)
}

/** "12.11.2026" / "Nov 12, 2026" */
export function formatDate(d: Date): string {
  return dateFormat('date', {
    de: { day: '2-digit', month: '2-digit', year: 'numeric' },
    en: { day: 'numeric', month: 'short', year: 'numeric' },
  }).format(d)
}

/** "9.11." / "Nov 9" (chart axes) */
export function formatDayMonth(d: Date): string {
  return dateFormat('dayMonth', {
    de: { day: 'numeric', month: 'numeric' },
    en: { day: 'numeric', month: 'short' },
  }).format(d)
}

/** "Okt" / "Oct" (calendar-style month axis labels) */
export function formatMonthShort(d: Date): string {
  const o: Intl.DateTimeFormatOptions = { month: 'short' }
  return dateFormat('monthShort', { de: o, en: o }).format(d).replace(/\.$/, '')
}

/** "Mi, 12.11." / "Wed, Nov 12" */
export function formatWeekdayDayMonth(d: Date): string {
  return dateFormat('weekdayDayMonth', {
    de: { weekday: 'short', day: 'numeric', month: 'numeric' },
    en: { weekday: 'short', month: 'short', day: 'numeric' },
  })
    .format(d)
    .replace(/^(\p{L}+)\./u, '$1')
}

/** Short weekday names, Monday first ("Mo".."So" / "Mon".."Sun"). The week starts on Monday in both languages. */
export function weekdayNamesMonday(): string[] {
  const f = dateFormat('weekday', { de: { weekday: 'short' }, en: { weekday: 'short' } })
  // 2024-01-01 was a Monday.
  return Array.from({ length: 7 }, (_, i) => f.format(new Date(2024, 0, 1 + i)).replace(/\.$/, ''))
}

/** 82.5 -> "82,5" (German) / "82.5" (English). No grouping, up to 3 decimals. */
export function formatNumber(n: number): string {
  const lang = getLang()
  const key = `number:${lang}`
  let f = cache.get(key) as Intl.NumberFormat | undefined
  if (!f) {
    f = new Intl.NumberFormat(LOCALES[lang], { useGrouping: false, maximumFractionDigits: 3 })
    cache.set(key, f)
  }
  return f.format(n)
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** ISO string -> value for <input type="datetime-local"> (local time). */
export function toLocalInput(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** <input type="datetime-local"> value -> ISO string; null if invalid. */
export function fromLocalInput(value: string): string | null {
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

/** Local calendar day as YYYY-MM-DD. */
export function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
