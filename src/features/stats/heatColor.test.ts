import { describe, expect, it } from 'vitest'
import { contrastRatio, heatColor, heatGradientCss, heatPalette, luminance } from './heatColor'

describe('heatColor', () => {
  it('hits the palette exactly at the anchors and clamps outside', () => {
    for (const dark of [false, true]) {
      const p = heatPalette(dark)
      expect([5, 8, 12, 13].map((r) => heatColor(r, dark).bg)).toEqual(p)
      expect(heatColor(1, dark).bg).toBe(p[0])
      expect(heatColor(20, dark).bg).toBe(p[3])
    }
  })

  it('gives every rep value from 5 to 13 its own, darker shade', () => {
    for (const dark of [false, true]) {
      const shades = [5, 6, 7, 8, 9, 10, 11, 12, 13].map((r) => heatColor(r, dark).bg)
      expect(new Set(shades).size).toBe(shades.length)
      const lum = shades.map(luminance)
      for (let i = 1; i < lum.length; i++) expect(lum[i]).toBeLessThan(lum[i - 1])
    }
  })

  it('keeps text readable (≥ 4.5:1) on every shade in both modes', () => {
    for (const dark of [false, true]) {
      for (let r = 0; r <= 20; r++) {
        const { bg, fg } = heatColor(r, dark)
        expect(contrastRatio(bg, fg)).toBeGreaterThanOrEqual(4.5)
      }
    }
    expect(heatColor(5, false).fg).toBe('#000000')
    expect(heatColor(13, false).fg).toBe('#ffffff')
  })

  it('builds a legend gradient with stops at the anchors', () => {
    expect(heatGradientCss(false)).toBe(
      'linear-gradient(to right, #ccfbf1 0%, #5eead4 37.5%, #0d9488 87.5%, #134e4a 100%)',
    )
  })
})
