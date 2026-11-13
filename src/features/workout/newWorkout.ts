/** Route of the new-workout draft, optionally preset to a local day (YYYY-MM-DD). */
export function newWorkoutPath(dateKey?: string | null): string {
  return dateKey ? `/verlauf/neu?datum=${dateKey}` : '/verlauf/neu'
}

/**
 * Start time for a new workout: now for today (or no date), otherwise the
 * given local day (YYYY-MM-DD) at the current time of day.
 */
export function defaultStartFor(dateKey: string | null, now: Date = new Date()): string {
  const match = dateKey ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey) : null
  if (!match) return now.toISOString()
  const d = new Date(now)
  d.setFullYear(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return d.toISOString()
}
