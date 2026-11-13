import { describe, expect, it } from 'vitest'
import { monthGrid, trainingDays } from './calendar'

describe('monthGrid', () => {
  it('starts on Monday and pads to full weeks', () => {
    // February 2026: 1st is a Sunday, 28 days.
    const cells = monthGrid(2026, 1)
    expect(cells.length % 7).toBe(0)
    expect(cells.slice(0, 6)).toEqual([null, null, null, null, null, null])
    expect(cells[6]).toBe(1)
    expect(cells.filter((c) => c !== null)).toHaveLength(28)
  })

  it('needs no leading blanks when the month starts on Monday', () => {
    // June 2026 starts on a Monday.
    expect(monthGrid(2026, 5)[0]).toBe(1)
  })
})

describe('trainingDays', () => {
  it('collects local day keys, one per day', () => {
    const at = (y: number, m: number, d: number, h: number) => new Date(y, m, d, h).toISOString()
    const workouts = [
      { id: 'a', startedAt: at(2026, 0, 10, 8) },
      { id: 'b', startedAt: at(2026, 0, 10, 19) },
      { id: 'c', startedAt: at(2026, 1, 10, 23) },
    ]
    expect([...trainingDays({ workouts })].sort()).toEqual(['2026-01-10', '2026-02-10'])
  })
})
