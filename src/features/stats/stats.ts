/** Epley estimate; a single rep counts as the weight itself. */
export function estimate1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0
  return reps === 1 ? weight : weight * (1 + reps / 30)
}
