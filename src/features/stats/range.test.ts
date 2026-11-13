import { describe, expect, it } from 'vitest'
import { PREFS_KEY, loadStatsRange, saveStatsRange } from '../../storage/preferences'
import { inRange, rangeDays } from './range'

const now = new Date(2026, 10, 13, 9, 0) // 13.11.2026
const at = (y: number, m: number, d: number, h = 12) => new Date(y, m, d, h).toISOString()

describe('rangeDays / inRange', () => {
  it('computes preset start days, open end', () => {
    expect(rangeDays({ key: '2w' }, now)).toEqual({ from: '2026-10-31', to: null })
    expect(rangeDays({ key: '1m' }, now)).toEqual({ from: '2026-10-13', to: null })
    expect(rangeDays({ key: '3m' }, now)).toEqual({ from: '2026-08-13', to: null })
    expect(rangeDays({ key: '1y' }, now)).toEqual({ from: '2025-11-13', to: null })
    expect(rangeDays({ key: 'all' }, now)).toEqual({ from: null, to: null })
  })

  it('includes the boundary days', () => {
    expect(inRange(at(2026, 9, 31, 0), { key: '2w' }, now)).toBe(true)
    expect(inRange(at(2026, 9, 30, 23), { key: '2w' }, now)).toBe(false)
    expect(inRange(at(2026, 10, 13, 22), { key: '1m' }, now)).toBe(true)
  })

  it('handles custom ranges inclusive, and custom without dates as all', () => {
    const sel = { key: 'custom', from: '2026-10-01', to: '2026-10-10' } as const
    expect(inRange(at(2026, 9, 1, 0), sel, now)).toBe(true)
    expect(inRange(at(2026, 9, 10, 23), sel, now)).toBe(true)
    expect(inRange(at(2026, 9, 11), sel, now)).toBe(false)
    expect(inRange(at(2020, 0, 1), { key: 'custom' }, now)).toBe(true)
  })

  it('can produce an empty range', () => {
    const sel = { key: 'custom', from: '2026-10-10', to: '2026-10-01' } as const
    expect(inRange(at(2026, 9, 5), sel, now)).toBe(false)
  })
})

describe('stats range preference', () => {
  function memory(): Storage {
    const map = new Map<string, string>()
    return { getItem: (k: string) => map.get(k) ?? null, setItem: (k: string, v: string) => void map.set(k, v) } as unknown as Storage
  }

  it('defaults to 1 month and round-trips', () => {
    const s = memory()
    expect(loadStatsRange(s)).toEqual({ key: '1m' })
    saveStatsRange({ key: 'custom', from: '2026-10-01', to: '2026-10-10' }, s)
    expect(loadStatsRange(s)).toEqual({ key: 'custom', from: '2026-10-01', to: '2026-10-10' })
  })

  it('falls back for invalid values and keeps other preferences', () => {
    const s = memory()
    s.setItem(PREFS_KEY, JSON.stringify({ historyView: 'calendar', statsRange: { key: '5y' } }))
    expect(loadStatsRange(s)).toEqual({ key: '1m' })
    saveStatsRange({ key: '3m' }, s)
    expect(JSON.parse(s.getItem(PREFS_KEY)!)).toEqual({ historyView: 'calendar', statsRange: { key: '3m' } })
  })
})
