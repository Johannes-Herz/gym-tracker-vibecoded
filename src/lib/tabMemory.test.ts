import { beforeEach, describe, expect, it } from 'vitest'
import { _resetTabMemory, navTarget, rememberPath, saveScroll, savedScroll, parentOf, tabOf } from './tabMemory'

describe('tab memory', () => {
  beforeEach(() => _resetTabMemory())

  it('maps paths to their tab', () => {
    expect(tabOf('/statistik')).toBe('/statistik')
    expect(tabOf('/statistik/uebung/builtin-squat')).toBe('/statistik')
    expect(tabOf('/verlauf/neu')).toBe('/verlauf')
    expect(tabOf('/verlaufx')).toBeNull()
    expect(tabOf('/')).toBeNull()
  })

  it('returns to the last route of another tab, including search params', () => {
    rememberPath('/statistik/uebung/builtin-squat')
    rememberPath('/verlauf/neu', '?datum=2026-11-12')
    expect(navTarget('/statistik', '/verlauf')).toBe('/statistik/uebung/builtin-squat')
    expect(navTarget('/verlauf', '/statistik')).toBe('/verlauf/neu?datum=2026-11-12')
    expect(navTarget('/uebungen', '/verlauf')).toBe('/uebungen')
  })

  it('resets the current tab to its overview', () => {
    rememberPath('/statistik/uebung/builtin-squat')
    expect(navTarget('/statistik', '/statistik/uebung/builtin-squat')).toBe('/statistik')
  })

  it('remembers scroll positions per route', () => {
    saveScroll('/statistik/uebung/x', 420)
    expect(savedScroll('/statistik/uebung/x')).toBe(420)
    expect(savedScroll('/verlauf')).toBe(0)
  })
})

describe("template routes", () => {
  it("belong to the Uebungen tab and go up level by level", () => {
    expect(tabOf("/uebungen/vorlagen/abc")).toBe("/uebungen")
    expect(parentOf("/uebungen/vorlagen/abc")).toBe("/uebungen/vorlagen")
    expect(parentOf("/uebungen/vorlagen/neu")).toBe("/uebungen/vorlagen")
    expect(parentOf("/uebungen/vorlagen")).toBe("/uebungen")
  })
})
