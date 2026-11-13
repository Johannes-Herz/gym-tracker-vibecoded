import type { AppData } from '../../types'

/** IDs of the most recently used exercises, newest workout first, without duplicates. */
export function recentExerciseIds(data: Pick<AppData, 'workouts' | 'sets'>, limit = 5): string[] {
  const startedAt = new Map(data.workouts.map((w) => [w.id, w.startedAt]))
  const sets = [...data.sets]
    .filter((s) => startedAt.has(s.workoutId))
    .sort(
      (a, b) =>
        startedAt.get(b.workoutId)!.localeCompare(startedAt.get(a.workoutId)!) || a.order - b.order,
    )
  const ids: string[] = []
  for (const s of sets) {
    if (!ids.includes(s.exerciseId)) ids.push(s.exerciseId)
    if (ids.length === limit) break
  }
  return ids
}
