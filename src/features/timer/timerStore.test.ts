import { describe, expect, it, vi } from 'vitest'
import { makeBeepWav } from './signals'
import { LATE_SIGNAL_MS, createTimerStore } from './timerStore'

function setup(active = true) {
  let now = 1_000_000
  let tickFn: (() => void) | null = null
  const effects = { unlock: vi.fn(), finish: vi.fn(), holdScreen: vi.fn(), releaseScreen: vi.fn() }
  const clear = vi.fn()
  const store = createTimerStore({
    now: () => now,
    effects,
    setInterval: (fn) => {
      tickFn = fn
      return 1
    },
    clearInterval: clear,
  })
  store.setActive(active)
  return {
    store,
    effects,
    clear,
    advance(ms: number, ticks = true) {
      now += ms
      if (ticks) tickFn?.()
    },
  }
}

describe('timer store', () => {
  it('starts a preset, unlocks audio in the tap and keeps the screen on', () => {
    const t = setup()
    t.store.start(60)
    expect(t.effects.unlock).toHaveBeenCalledTimes(1)
    expect(t.effects.holdScreen).toHaveBeenCalled()
    expect(t.store.getSnapshot().state.status).toBe('running')
    expect(t.store.getSnapshot().remainingMs).toBe(60_000)
    t.advance(20_000)
    expect(t.store.getSnapshot().remainingMs).toBe(40_000)
  })

  it('fires the finish signal exactly once at 0:00 and releases the screen', () => {
    const t = setup()
    t.store.start(60)
    t.advance(59_000)
    expect(t.effects.finish).not.toHaveBeenCalled()
    t.advance(1_000)
    t.advance(1_000)
    expect(t.effects.finish).toHaveBeenCalledTimes(1)
    expect(t.store.getSnapshot().state.status).toBe('finished')
    expect(t.effects.releaseScreen).toHaveBeenCalled()
    expect(t.clear).toHaveBeenCalled()
  })

  it('shows the finished state immediately after a long gap, without a late beep', () => {
    const t = setup()
    t.store.start(60)
    t.advance(60_000 + LATE_SIGNAL_MS + 1, false) // app was in the background, no ticks ran
    t.store.refresh() // visibilitychange
    expect(t.store.getSnapshot().state.status).toBe('finished')
    expect(t.store.getSnapshot().remainingMs).toBe(0)
    expect(t.effects.finish).not.toHaveBeenCalled()
  })

  it('still signals when the app returns shortly after the end', () => {
    const t = setup()
    t.store.start(60)
    t.advance(63_000, false)
    t.store.refresh()
    expect(t.effects.finish).toHaveBeenCalledTimes(1)
  })

  it('finishes silently while no editor is mounted', () => {
    const t = setup(false)
    t.store.start(60)
    t.advance(60_000)
    expect(t.store.getSnapshot().state.status).toBe('finished')
    expect(t.effects.finish).not.toHaveBeenCalled()
  })

  it('pause stops the clock and releases the screen; resume continues', () => {
    const t = setup()
    t.store.start(120)
    t.advance(30_000)
    t.store.pause()
    expect(t.effects.releaseScreen).toHaveBeenCalled()
    t.advance(500_000)
    expect(t.store.getSnapshot().remainingMs).toBe(90_000)
    t.store.resume()
    expect(t.store.getSnapshot().state.status).toBe('running')
    t.advance(10_000)
    expect(t.store.getSnapshot().remainingMs).toBe(80_000)
  })

  it('±30 s works before the start and the pending time then starts via resume', () => {
    const t = setup()
    t.store.adjust(30_000)
    t.store.adjust(30_000)
    expect(t.store.getSnapshot().remainingMs).toBe(60_000)
    t.store.adjust(-120_000)
    expect(t.store.getSnapshot().remainingMs).toBe(0)
    t.store.adjust(30_000)
    t.store.resume()
    expect(t.store.getSnapshot().state.status).toBe('running')
    expect(t.store.getSnapshot().remainingMs).toBe(30_000)
  })

  it('stop resets everything', () => {
    const t = setup()
    t.store.start(60)
    t.store.stop()
    expect(t.store.getSnapshot().state).toEqual({ status: 'idle', durationMs: 0 })
  })

  it('notifies subscribers', () => {
    const t = setup()
    const listener = vi.fn()
    const off = t.store.subscribe(listener)
    t.store.start(60)
    expect(listener).toHaveBeenCalled()
    off()
    listener.mockClear()
    t.store.stop()
    expect(listener).not.toHaveBeenCalled()
  })
})

describe('generated beep', () => {
  it('is a valid mono 16-bit PCM WAV of about one second', () => {
    const wav = makeBeepWav()
    const text = (o: number, n: number) => String.fromCharCode(...wav.slice(o, o + n))
    expect(text(0, 4)).toBe('RIFF')
    expect(text(8, 4)).toBe('WAVE')
    expect(text(36, 4)).toBe('data')
    const view = new DataView(wav.buffer)
    expect(view.getUint32(4, true)).toBe(wav.length - 8)
    expect(view.getUint32(40, true)).toBe(wav.length - 44)
    expect(wav.length).toBeLessThan(60_000)
    expect(wav.some((b, i) => i >= 44 && b !== 0)).toBe(true)
  })
})
