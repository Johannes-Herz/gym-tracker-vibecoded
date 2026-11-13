import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { _resetLang, setLang } from '../i18n'
import {
  formatDate,
  formatDateTime,
  formatDayMonth,
  formatMonthYear,
  formatNumber,
  formatWeekdayDayMonth,
  weekdayNamesMonday,
} from './format'

// Wednesday, 12 November 2025, 18:30 local time.
const D = new Date(2025, 10, 12, 18, 30)

describe('formatting follows the UI language', () => {
  beforeEach(() => _resetLang())
  afterEach(() => setLang('de'))

  it('numbers: decimal comma in German, decimal point in English', () => {
    setLang('de')
    expect(formatNumber(82.5)).toBe('82,5')
    expect(formatNumber(1.25)).toBe('1,25')
    expect(formatNumber(10000)).toBe('10000')
    setLang('en')
    expect(formatNumber(82.5)).toBe('82.5')
    expect(formatNumber(1.25)).toBe('1.25')
    expect(formatNumber(10000)).toBe('10000')
    expect(formatNumber(-20)).toBe('-20')
  })

  it('dates and weekdays per language', () => {
    setLang('de')
    expect(formatWeekdayDayMonth(D)).toBe('Mi, 12.11.')
    expect(formatDate(D)).toBe('12.11.2025')
    expect(formatDayMonth(D)).toBe('12.11.')
    expect(formatMonthYear(D)).toBe('November 2025')
    expect(formatDateTime(D.toISOString())).toContain('12.11.2025')
    setLang('en')
    expect(formatWeekdayDayMonth(D)).toBe('Wed, Nov 12')
    expect(formatDate(D)).toBe('Nov 12, 2025')
    expect(formatDayMonth(D)).toBe('Nov 12')
    expect(formatMonthYear(D)).toBe('November 2025')
    expect(formatDateTime(D.toISOString())).toContain('Nov 12, 2025')
  })

  it('weekday header starts on Monday in both languages', () => {
    setLang('de')
    expect(weekdayNamesMonday()).toEqual(['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'])
    setLang('en')
    expect(weekdayNamesMonday()).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
  })
})
