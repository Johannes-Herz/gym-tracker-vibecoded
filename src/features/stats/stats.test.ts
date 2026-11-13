import { describe, expect, it } from 'vitest'
import { estimate1RM } from './stats'

describe('estimate1RM', () => {
  it('uses Epley and handles edge cases', () => {
    expect(estimate1RM(100, 1)).toBe(100)
    expect(estimate1RM(60, 10)).toBeCloseTo(80)
    expect(estimate1RM(0, 5)).toBe(0)
    expect(estimate1RM(50, 0)).toBe(0)
  })
})
