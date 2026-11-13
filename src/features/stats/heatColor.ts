/** Rep counts at which the palette colors sit; values in between are interpolated. */
export const HEAT_ANCHORS = [5, 8, 12, 13] as const

const LIGHT = ['#ccfbf1', '#5eead4', '#0d9488', '#134e4a'] as const
const DARK = ['#99f6e4', '#2dd4bf', '#0f766e', '#042f2e'] as const

export function heatPalette(dark: boolean): readonly string[] {
  return dark ? DARK : LIGHT
}

type RGB = [number, number, number]

function toRgb(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function toHex([r, g, b]: RGB): string {
  return `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`
}

/** WCAG relative luminance. */
export function luminance(hex: string): number {
  const [r, g, b] = toRgb(hex).map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/**
 * Cell colors for a rep count: a continuous teal gradient (few reps light, many dark)
 * and black or white text, whichever contrasts more (always at least 4.5:1).
 */
export function heatColor(reps: number, dark: boolean): { bg: string; fg: string } {
  const palette = heatPalette(dark)
  const r = Math.min(Math.max(reps, HEAT_ANCHORS[0]), HEAT_ANCHORS[HEAT_ANCHORS.length - 1])
  let i = 0
  while (i < HEAT_ANCHORS.length - 2 && r > HEAT_ANCHORS[i + 1]) i++
  const t = (r - HEAT_ANCHORS[i]) / (HEAT_ANCHORS[i + 1] - HEAT_ANCHORS[i])
  const a = toRgb(palette[i])
  const b = toRgb(palette[i + 1])
  const bg = toHex([0, 1, 2].map((k) => a[k] + (b[k] - a[k]) * t) as RGB)
  const fg = contrastRatio(bg, '#000000') >= contrastRatio(bg, '#ffffff') ? '#000000' : '#ffffff'
  return { bg, fg }
}

/** CSS gradient for the legend bar, with stops at the anchor positions. */
export function heatGradientCss(dark: boolean): string {
  const min = HEAT_ANCHORS[0]
  const span = HEAT_ANCHORS[HEAT_ANCHORS.length - 1] - min
  const stops = heatPalette(dark).map((c, i) => `${c} ${((HEAT_ANCHORS[i] - min) / span) * 100}%`)
  return `linear-gradient(to right, ${stops.join(', ')})`
}
