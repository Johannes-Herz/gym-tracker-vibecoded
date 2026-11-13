import { formatNumber } from '../../lib/format'
import { isCardio, type Exercise } from '../../types'

/** Lower bound for assisted bodyweight sets (negative = assistance). */
export const MIN_ASSISTED_KG = -200

/** Bodyweight exercise: weight is *added* weight; 0 = bodyweight only, negative = assisted. */
export function isBodyweight(e: Pick<Exercise, 'muscleGroup' | 'equipment'>): boolean {
  return !isCardio(e) && e.equipment === 'Körpergewicht'
}

/** Short label for pure bodyweight ("bodyweight"), so it can't be confused with "kg". */
export const BW_LABEL = 'BW'

const signed = (weight: number) => `${weight > 0 ? '+' : '−'}${formatNumber(Math.abs(weight))} kg`

/** "82,5 kg", or for bodyweight the added weight: "BW", "+5 kg", "−20 kg". */
export function formatLoad(weight: number, bodyweight: boolean): string {
  if (!bodyweight) return `${formatNumber(weight)} kg`
  return weight === 0 ? BW_LABEL : signed(weight)
}

/** Spelled out where there is room: "Körpergewicht", "Körpergewicht + 5 kg", "Körpergewicht − 20 kg". */
export function formatLoadLong(weight: number): string {
  if (weight === 0) return 'Körpergewicht'
  return `Körpergewicht ${weight > 0 ? '+' : '−'} ${formatNumber(Math.abs(weight))} kg`
}

/** One set: "82,5 kg × 5", "BW × 12", "+5 kg × 8", "−20 kg × 6". */
export function formatSet(weight: number, reps: number, bodyweight: boolean): string {
  return `${formatLoad(weight, bodyweight)} × ${reps}`
}
