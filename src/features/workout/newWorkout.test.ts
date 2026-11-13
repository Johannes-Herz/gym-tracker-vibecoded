import { describe, expect, it } from 'vitest'
import { defaultStartFor, newWorkoutPath } from './newWorkout'

describe('newWorkoutPath', () => {
  it('presets the selected day, or none', () => {
    expect(newWorkoutPath('2026-10-02')).toBe('/verlauf/neu?datum=2026-10-02')
    expect(newWorkoutPath(null)).toBe('/verlauf/neu')
    expect(newWorkoutPath()).toBe('/verlauf/neu')
  })
})

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
