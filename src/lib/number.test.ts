import { describe, expect, it } from 'vitest'
import { formatNumber } from './format'
import { parseDecimal, stepValue } from './number'

describe('stepValue', () => {
  it('steps by 1.25 kg without float drift', () => {
    let v = 0
    const seen: number[] = []
    for (let i = 0; i < 3; i++) seen.push((v = stepValue(v, 1.25)))
    expect(seen).toEqual([1.25, 2.5, 3.75])
    expect(stepValue(33.75, -1.25)).toBe(32.5)
    expect(stepValue(0.1, 0.2)).toBe(0.3)
  })

  it('never goes below min', () => {
    expect(stepValue(1, -1.25)).toBe(0)
    expect(stepValue(20, -1, 20)).toBe(20)
  })
})

describe('parseDecimal', () => {
  it('accepts comma and dot', () => {
    expect(parseDecimal('33,75')).toBe(33.75)
    expect(parseDecimal(' 33.75 ')).toBe(33.75)
    expect(parseDecimal('33,755')).toBe(33.76)
  })

  it('returns null for empty or invalid input', () => {
    expect(parseDecimal('')).toBeNull()
    expect(parseDecimal('abc')).toBeNull()
  })
})

describe('formatNumber', () => {
  it('uses a German decimal comma', () => {
    expect(formatNumber(33.75)).toBe('33,75')
    expect(formatNumber(32.5)).toBe('32,5')
    expect(formatNumber(80)).toBe('80')
  })
})
