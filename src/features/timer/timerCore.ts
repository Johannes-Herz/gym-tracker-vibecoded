/**
 * Rest timer logic. Pure functions: `now` is always passed in, so everything is
 * testable and stays correct after the app was in the background (the remaining
 * time is derived from an end timestamp, never from counting ticks).
 */

export const PRESETS_SEC = [60, 120, 180, 300, 600] as const
export const ADJUST_MS = 30_000

export type TimerState =
  /** Nothing running; `durationMs` is a pending duration set with ±30 s (0 = none). */
  | { status: 'idle'; durationMs: number }
  | { status: 'running'; endAt: number }
  | { status: 'paused'; remainingMs: number }
  /** Reached 0:00; stays until stopped or restarted. */
  | { status: 'finished' }

export const initialTimer: TimerState = { status: 'idle', durationMs: 0 }

/** Starts immediately with the given duration (preset buttons). */
export function start(durationMs: number, now: number): TimerState {
  if (durationMs <= 0) return initialTimer
  return { status: 'running', endAt: now + durationMs }
}

/** Remaining milliseconds, never below 0. */
export function remaining(state: TimerState, now: number): number {
  switch (state.status) {
    case 'idle':
      return state.durationMs
    case 'running':
      return Math.max(0, state.endAt - now)
    case 'paused':
      return state.remainingMs
    case 'finished':
      return 0
  }
}

/** −30 s / +30 s: before, while running and while paused. Never below 0. */
export function adjust(state: TimerState, deltaMs: number, now: number): TimerState {
  switch (state.status) {
    case 'idle':
      return { status: 'idle', durationMs: Math.max(0, state.durationMs + deltaMs) }
    case 'finished':
      return { status: 'idle', durationMs: Math.max(0, deltaMs) }
    case 'running':
      return { status: 'running', endAt: Math.max(now, state.endAt + deltaMs) }
    case 'paused':
      return { status: 'paused', remainingMs: Math.max(0, state.remainingMs + deltaMs) }
  }
}

export function pause(state: TimerState, now: number): TimerState {
  if (state.status !== 'running') return state
  return { status: 'paused', remainingMs: remaining(state, now) }
}

/** Continues a paused timer, or starts the pending duration of an idle one. */
export function resume(state: TimerState, now: number): TimerState {
  if (state.status === 'paused') return start(state.remainingMs, now)
  if (state.status === 'idle') return start(state.durationMs, now)
  return state
}

/** Stop / reset. */
export function stop(): TimerState {
  return initialTimer
}

/** Moves a running timer to `finished` once its end time has passed. */
export function tick(state: TimerState, now: number): TimerState {
  if (state.status === 'running' && now >= state.endAt) return { status: 'finished' }
  return state
}

/** "1:24", "10:00", "0:05" (rounded up, so the display reaches 0:00 exactly at the end). */
export function formatRemaining(ms: number): string {
  const total = Math.ceil(Math.max(0, ms) / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
