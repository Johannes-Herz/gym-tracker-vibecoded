import type { WorkoutSet } from '../types'

/** Exercise ids of a workout in display order: order of first appearance by set order. */
export function exerciseOrder(sets: Pick<WorkoutSet, 'exerciseId' | 'order'>[]): string[] {
  const ids: string[] = []
  for (const s of [...sets].sort((a, b) => a.order - b.order)) {
    if (!ids.includes(s.exerciseId)) ids.push(s.exerciseId)
  }
  return ids
}

/**
 * New `order` per set id after moving an exercise block up (-1) or down (+1).
 * Sets keep their relative order within an exercise. Returns null if the move is impossible.
 */
export function moveExercise(
  sets: Pick<WorkoutSet, 'id' | 'exerciseId' | 'order'>[],
  exerciseId: string,
  delta: -1 | 1,
): Map<string, number> | null {
  const ids = exerciseOrder(sets)
  const from = ids.indexOf(exerciseId)
  const to = from + delta
  if (from < 0 || to < 0 || to >= ids.length) return null
  ;[ids[from], ids[to]] = [ids[to], ids[from]]
  const sorted = [...sets].sort((a, b) => a.order - b.order)
  const result = new Map<string, number>()
  let n = 0
  for (const id of ids) {
    for (const s of sorted) if (s.exerciseId === id) result.set(s.id, n++)
  }
  return result
}
