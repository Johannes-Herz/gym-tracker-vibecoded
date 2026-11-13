import { describe, expect, it } from 'vitest'
import {
  ADJUST_MS,
  PRESETS_SEC,
  adjust,
  formatRemaining,
  initialTimer,
  pause,
  remaining,
  resume,
  start,
  stop,
  tick,
} from './timerCore'

const T0 = 1_000_000

describe('presets and start', () => {
  it('offers 1, 2, 3, 5 and 10 minutes', () => {
    expect(PRESETS_SEC).toEqual([60, 120, 180, 300, 600])
  })

  it('starts immediately with the full duration', () => {
    const s = start(60_000, T0)
    expect(s).toEqual({ status: 'running', endAt: T0 + 60_000 })
    expect(remaining(s, T0)).toBe(60_000)
    expect(remaining(s, T0 + 15_000)).toBe(45_000)
  })

  it('ignores a zero duration', () => {
    expect(start(0, T0)).toEqual(initialTimer)
  })
})

describe('±30 s', () => {
  it('adjusts a running timer', () => {
    const s = adjust(start(60_000, T0), ADJUST_MS, T0 + 10_000)
    expect(remaining(s, T0 + 10_000)).toBe(80_000)
    expect(remaining(adjust(s, -ADJUST_MS, T0 + 10_000), T0 + 10_000)).toBe(50_000)
  })

  it('never goes below 0 while running', () => {
    const s = adjust(start(60_000, T0), -ADJUST_MS, T0 + 50_000) // 10 s left, −30 s
    expect(remaining(s, T0 + 50_000)).toBe(0)
    expect(tick(s, T0 + 50_000).status).toBe('finished')
  })

  it('never goes below 0 while paused', () => {
    const p = pause(start(60_000, T0), T0 + 50_000)
    const s = adjust(p, -ADJUST_MS, T0 + 60_000)
    expect(s).toEqual({ status: 'paused', remainingMs: 0 })
  })

  it('sets a pending duration before starting, floored at 0, then starts it', () => {
    let s = adjust(initialTimer, -ADJUST_MS, T0)
    expect(remaining(s, T0)).toBe(0)
    s = adjust(adjust(s, ADJUST_MS, T0), ADJUST_MS, T0)
    expect(s).toEqual({ status: 'idle', durationMs: 60_000 })
    expect(resume(s, T0)).toEqual({ status: 'running', endAt: T0 + 60_000 })
  })

  it('adjusting after the end begins a fresh pending duration', () => {
    const finished = tick(start(60_000, T0), T0 + 60_000)
    expect(adjust(finished, ADJUST_MS, T0 + 70_000)).toEqual({ status: 'idle', durationMs: 30_000 })
    expect(adjust(finished, -ADJUST_MS, T0 + 70_000)).toEqual({ status: 'idle', durationMs: 0 })
  })
})

describe('pause / resume / stop', () => {
  it('freezes the remaining time while paused and continues from it', () => {
    const p = pause(start(120_000, T0), T0 + 30_000)
    expect(p).toEqual({ status: 'paused', remainingMs: 90_000 })
    expect(remaining(p, T0 + 999_999)).toBe(90_000)
    const r = resume(p, T0 + 100_000)
    expect(r).toEqual({ status: 'running', endAt: T0 + 190_000 })
  })

  it('pause only affects a running timer; resume only a paused or idle one', () => {
    expect(pause(initialTimer, T0)).toEqual(initialTimer)
    const running = start(60_000, T0)
    expect(resume(running, T0 + 1)).toBe(running)
  })

  it('stop resets to idle', () => {
    expect(stop()).toEqual({ status: 'idle', durationMs: 0 })
  })
})

describe('end detection and background time jumps', () => {
  it('finishes exactly at the end time, not before', () => {
    const s = start(60_000, T0)
    expect(tick(s, T0 + 59_999)).toBe(s)
    expect(tick(s, T0 + 60_000)).toEqual({ status: 'finished' })
  })

  it('is correct after a long background gap without any tick in between', () => {
    const s = start(180_000, T0)
    // App suspended for 2 minutes: the remaining time is right when it comes back.
    expect(remaining(s, T0 + 120_000)).toBe(60_000)
    expect(tick(s, T0 + 120_000)).toBe(s)
    // App suspended for 10 minutes: ended long ago, shows 0 and finishes immediately.
    expect(remaining(s, T0 + 600_000)).toBe(0)
    expect(tick(s, T0 + 600_000)).toEqual({ status: 'finished' })
  })

  it('does not run out while paused, even across a long gap', () => {
    const p = pause(start(60_000, T0), T0 + 10_000)
    expect(tick(p, T0 + 3_600_000)).toBe(p)
  })

  it('finished stays finished with 0 remaining', () => {
    const f = tick(start(1_000, T0), T0 + 5_000)
    expect(tick(f, T0 + 9_000)).toBe(f)
    expect(remaining(f, T0 + 9_000)).toBe(0)
  })
})

describe('formatRemaining', () => {
  it('formats mm:ss and rounds up to whole seconds', () => {
    expect(formatRemaining(84_000)).toBe('1:24')
    expect(formatRemaining(600_000)).toBe('10:00')
    expect(formatRemaining(5_000)).toBe('0:05')
    expect(formatRemaining(4_200)).toBe('0:05')
    expect(formatRemaining(0)).toBe('0:00')
    expect(formatRemaining(-50)).toBe('0:00')
  })
})
