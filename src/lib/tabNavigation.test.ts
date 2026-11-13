import { beforeEach, describe, expect, it } from 'vitest'
import {
  _resetTabMemory,
  navTarget,
  parentOf,
  recordNavigation,
  rememberPath,
  tabSteps,
  upSteps,
  type NavStep,
  type TabRoot,
} from './tabMemory'

describe('parentOf', () => {
  it('maps every page with a back arrow to its parent within the tab', () => {
    expect(parentOf('/verlauf/neu')).toBe('/verlauf')
    expect(parentOf('/verlauf/abc-123')).toBe('/verlauf')
    expect(parentOf('/statistik/uebung/builtin-squat')).toBe('/statistik')
  })

  it('has no parent for tab overviews', () => {
    for (const root of ['/verlauf', '/uebungen', '/statistik', '/einstellungen']) expect(parentOf(root)).toBeNull()
  })
})

/**
 * Minimal browser-history model that applies NavSteps like react-router does and
 * records each navigation the way useTabMemory does.
 */
class FakeHistory {
  private entries: { key: string; pathname: string }[] = []
  private index = -1
  private n = 0

  constructor(start: string) {
    this.go({ to: start, replace: true }, 'POP')
  }

  get current() {
    return this.entries[this.index]
  }

  get path() {
    return this.current.pathname
  }

  get length() {
    return this.entries.length
  }

  get atStart() {
    return this.index === 0
  }

  private go(step: NavStep, forceType?: 'POP') {
    const prev = this.current ? { ...this.current } : null
    if ('back' in step) {
      this.index--
      recordNavigation('POP', this.current.key, prev)
    } else {
      const entry = { key: `k${++this.n}`, pathname: step.to }
      if (step.replace || forceType) this.entries[Math.max(this.index, 0)] = entry
      else {
        this.entries = this.entries.slice(0, this.index + 1).concat(entry)
      }
      if (!step.replace && !forceType) this.index++
      if (this.index < 0) this.index = 0
      recordNavigation(forceType ?? (step.replace ? 'REPLACE' : 'PUSH'), entry.key, prev, step.below)
    }
    if (!('back' in step && step.transient)) rememberPath(this.path)
  }

  run(steps: NavStep[]) {
    steps.forEach((s) => this.go(s))
  }

  /** Normal in-app link (push). */
  open(pathname: string) {
    this.go({ to: pathname })
  }

  tab(root: TabRoot) {
    this.run(tabSteps(root, this.current.key, this.path))
  }

  up() {
    this.run(upSteps(this.current.key, this.path))
  }

  /** Phone/browser back button. */
  back() {
    this.go({ back: true })
  }
}

describe('tab navigation', () => {
  beforeEach(() => _resetTabMemory())

  it('runs the reported scenario without ping-pong', () => {
    const h = new FakeHistory('/verlauf')
    h.tab('/statistik')
    expect(h.path).toBe('/statistik')
    h.open('/statistik/uebung/builtin-squat')
    h.tab('/verlauf')
    expect(h.path).toBe('/verlauf')
    h.open('/verlauf/w1')
    h.tab('/statistik')
    expect(h.path).toBe('/statistik/uebung/builtin-squat') // restored exercise
    h.up()
    expect(h.path).toBe('/statistik') // up stays in the tab
    h.tab('/verlauf')
    expect(h.path).toBe('/verlauf/w1') // restored workout
    h.up()
    expect(h.path).toBe('/verlauf')
    // Going up updated the remembered state: Statistik now opens on its overview.
    h.tab('/statistik')
    expect(h.path).toBe('/statistik')
    // Tab switches did not pile up history.
    expect(h.length).toBeLessThanOrEqual(2)
  })

  it('never lets the phone back button alternate between tabs', () => {
    const h = new FakeHistory('/verlauf')
    h.tab('/statistik')
    h.open('/statistik/uebung/x')
    h.tab('/verlauf')
    h.open('/verlauf/w1')
    h.tab('/statistik')
    expect(h.path).toBe('/statistik/uebung/x')
    h.back()
    expect(h.path).toBe('/statistik')
    expect(h.atStart).toBe(true) // next back leaves the app instead of jumping to Verlauf
  })

  it('keeps the detail directly on its overview, so the phone back button goes up', () => {
    const h = new FakeHistory('/verlauf')
    h.tab('/statistik')
    h.open('/statistik/uebung/x')
    h.tab('/verlauf')
    h.tab('/statistik') // restored: overview replaced in, detail pushed on top
    expect(h.path).toBe('/statistik/uebung/x')
    h.back()
    expect(h.path).toBe('/statistik')
  })

  it('steps back when the entry below is the parent, otherwise replaces', () => {
    const h = new FakeHistory('/verlauf')
    h.open('/verlauf/w1')
    expect(upSteps(h.current.key, h.path)).toEqual([{ back: true }])
    // Deep link / reload: nothing known below.
    const deep = new FakeHistory('/statistik/uebung/x')
    expect(upSteps(deep.current.key, deep.path)).toEqual([{ to: '/statistik', replace: true }])
    deep.up()
    expect(deep.path).toBe('/statistik')
  })

  it('keeps the parent below when the new-workout draft is replaced by the workout', () => {
    const h = new FakeHistory('/verlauf')
    h.open('/verlauf/neu')
    h.run([{ to: '/verlauf/w9', replace: true }])
    expect(upSteps(h.current.key, h.path)).toEqual([{ back: true }])
  })

  it('tapping the active tab resets it to its overview', () => {
    const h = new FakeHistory('/statistik')
    h.open('/statistik/uebung/x')
    h.tab('/statistik')
    expect(h.path).toBe('/statistik')
    expect(navTarget('/statistik', '/verlauf')).toBe('/statistik')
    expect(tabSteps('/statistik', h.current.key, '/statistik')).toEqual([])
  })
})
