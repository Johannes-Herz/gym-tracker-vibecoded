import { describe, expect, it } from 'vitest'
import { defaultStartFor } from './newWorkout'

describe('defaultStartFor', () => {
  const now = new Date(2026, 10, 13, 18, 42)

  it('uses now without a date or for today', () => {
    expect(defaultStartFor(null, now)).toBe(now.toISOString())
    expect(defaultStartFor('2026-11-13', now)).toBe(now.toISOString())
  })

  it('uses the given day at the current time of day', () => {
    expect(defaultStartFor('2026-10-02', now)).toBe(new Date(2026, 9, 2, 18, 42).toISOString())
  })

  it('falls back to now for invalid dates', () => {
    expect(defaultStartFor('gestern', now)).toBe(now.toISOString())
  })
})
