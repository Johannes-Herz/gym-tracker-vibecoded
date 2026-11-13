import { formatNumber } from '../../lib/format'
import { isCardio, type Exercise } from '../../types'

/** Lower bound for assisted bodyweight sets (negative = assistance). */
export const MIN_ASSISTED_KG = -200

/** Bodyweight exercise: weight is *added* weight; 0 = bodyweight only, negative = assisted. */
export function isBodyweight(e: Pick<Exercise, 'muscleGroup' | 'equipment'>): boolean {
  return !isCardio(e) && e.equipment === 'Körpergewicht'
}

/** "82,5 kg", or for bodyweight "KG", "KG + 10 kg", "KG − 20 kg". */
export function formatLoad(weight: number, bodyweight: boolean): string {
  if (!bodyweight) return `${formatNumber(weight)} kg`
  if (weight === 0) return 'KG'
  return `KG ${weight > 0 ? '+' : '−'} ${formatNumber(Math.abs(weight))} kg`
}

/** Compact set: "82,5×5", "KG×12", "KG+10×8", "KG−20×6". */
export function formatSet(weight: number, reps: number, bodyweight: boolean): string {
  if (!bodyweight) return `${formatNumber(weight)}×${reps}`
  if (weight === 0) return `KG×${reps}`
  return `KG${weight > 0 ? '+' : '−'}${formatNumber(Math.abs(weight))}×${reps}`
}
