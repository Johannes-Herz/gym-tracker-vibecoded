import { useSyncExternalStore } from 'react'
import { beep, holdWakeLock, releaseWakeLock, unlockAudio, vibrate } from './signals'
import {
  ADJUST_MS,
  adjust,
  initialTimer,
  pause,
  remaining,
  resume,
  start,
  stop,
  tick,
  type TimerState,
} from './timerCore'

/** Not persisted and not part of the workout data or the export. */

const TICK_MS = 250
/** If the timer ended longer ago than this when the app comes back, don't beep. */
export const LATE_SIGNAL_MS = 10_000

export interface TimerSnapshot {
  state: TimerState
  now: number
  remainingMs: number
}

export interface TimerEffects {
  /** Called inside the tap that starts the timer (audio unlock). */
  unlock(): void
  /** Sound + vibration at 0:00. */
  finish(): void
  holdScreen(): void
  releaseScreen(): void
}

export interface TimerDeps {
  now: () => number
  effects: TimerEffects
  setInterval: (fn: () => void, ms: number) => unknown
  clearInterval: (handle: unknown) => void
}

export function createTimerStore(deps: TimerDeps) {
  let state: TimerState = initialTimer
  let active = false // an editor is mounted: only then the finish signal fires
  let interval: unknown = null
  let snapshot = makeSnapshot()
  const listeners = new Set<() => void>()

  function makeSnapshot(): TimerSnapshot {
    const now = deps.now()
    return { state, now, remainingMs: remaining(state, now) }
  }

  function emit() {
    snapshot = makeSnapshot()
    listeners.forEach((l) => l())
  }

  /** Re-evaluates the end time, manages interval and wake lock, then notifies. */
  function sync() {
    const now = deps.now()
    const before = state
    state = tick(state, now)
    if (before.status === 'running' && state.status === 'finished') {
      const lateMs = now - before.endAt
      if (active && lateMs < LATE_SIGNAL_MS) deps.effects.finish()
    }
    if (state.status === 'running') {
      deps.effects.holdScreen()
      if (interval === null) interval = deps.setInterval(sync, TICK_MS)
    } else {
      deps.effects.releaseScreen()
      if (interval !== null) {
        deps.clearInterval(interval)
        interval = null
      }
    }
    emit()
  }

  function apply(fn: (s: TimerState, now: number) => TimerState) {
    state = fn(tick(state, deps.now()), deps.now())
    sync()
  }

  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    /** Preset buttons: starts immediately. */
    start(durationSec: number) {
      deps.effects.unlock()
      apply((_s, now) => start(durationSec * 1000, now))
    },
    adjust(deltaMs: number) {
      apply((s, now) => adjust(s, deltaMs, now))
    },
    pause: () => apply(pause),
    /** Continue after pause, or start the pending duration. */
    resume() {
      deps.effects.unlock()
      apply(resume)
    },
    stop: () => apply(() => stop()),
    /** The editor mounts/unmounts it; outside the editor the timer runs silently. */
    setActive(value: boolean) {
      active = value
      sync()
    },
    /** App came back to the foreground (or any other reason to re-check the clock). */
    refresh: sync,
  }
}

export const timerStore = createTimerStore({
  now: () => Date.now(),
  effects: {
    unlock: unlockAudio,
    finish() {
      beep()
      vibrate()
    },
    holdScreen: holdWakeLock,
    releaseScreen: releaseWakeLock,
  },
  setInterval: (fn, ms) => window.setInterval(fn, ms),
  clearInterval: (h) => window.clearInterval(h as number),
})

if (typeof document !== 'undefined') {
  // Timers are throttled or frozen in the background: re-check the clock on return
  // (this also re-acquires the wake lock, which the browser drops while hidden).
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') timerStore.refresh()
  })
}

export function useTimer(): TimerSnapshot {
  return useSyncExternalStore(timerStore.subscribe, timerStore.getSnapshot)
}

export { ADJUST_MS }
