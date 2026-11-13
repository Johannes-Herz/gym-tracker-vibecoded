/** Rounds to 2 decimals, enough for 1.25 kg steps and avoids float noise. */
export function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/** value + delta, rounded, never below min. */
export function stepValue(value: number, delta: number, min = 0): number {
  return Math.max(min, round2(value + delta))
}

/** Parses user input with comma or dot as decimal separator; null if not a number. */
export function parseDecimal(text: string): number | null {
  const trimmed = text.trim()
  if (trimmed === '') return null
  const n = Number(trimmed.replace(',', '.'))
  return Number.isFinite(n) ? round2(n) : null
}
