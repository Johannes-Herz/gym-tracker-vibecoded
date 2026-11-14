import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  SESSION_KEY,
  SESSION_TIMEOUT_MS,
  _resetSessionCache,
  clearSession,
  expireSession,
  getSession,
  loadSession,
  parseSession,
  startSession,
  updateSession,
} from './session'

let mem: Map<string, string>

beforeEach(() => {
  mem = new Map()
  ;(globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => void mem.set(k, v),
    removeItem: (k: string) => void mem.delete(k),
  }
  _resetSessionCache()
})
afterEach(() => {
  delete (globalThis as { localStorage?: unknown }).localStorage
  _resetSessionCache()
})

const base = { startedAt: '2026-11-14T10:00:00.000Z', pending: [{ id: 'p1', exerciseId: 'builtin-squat', order: 0, weight: 100, reps: 5 }] }

describe('session storage', () => {
  it('persists on start and on every update, and reloads identically', () => {
    startSession({ ...base, templateId: 't1', templateName: 'Push' })
    updateSession((s) => ({ ...s, note: 'felt good' }))
    const stored = JSON.parse(mem.get(SESSION_KEY)!)
    expect(stored).toMatchObject({ schemaVersion: 1, templateName: 'Push', note: 'felt good', pending: base.pending })
    _resetSessionCache()
    expect(getSession()).toEqual(stored)
  })

  it('has at most one session: starting replaces it', () => {
    startSession(base)
    startSession({ ...base, startedAt: '2026-11-14T12:00:00.000Z', pending: [] })
    expect(getSession()!.startedAt).toBe('2026-11-14T12:00:00.000Z')
  })

  it('clearSession removes it from memory and storage', () => {
    startSession(base)
    clearSession()
    expect(getSession()).toBeNull()
    expect(mem.has(SESSION_KEY)).toBe(false)
  })

  it('rejects unusable data: wrong shape, newer version, garbage text', () => {
    expect(parseSession(null)).toBeNull()
    expect(parseSession({ schemaVersion: 99, startedAt: base.startedAt, updatedAt: base.startedAt, pending: [] })).toBeNull()
    expect(parseSession({ schemaVersion: 1, startedAt: 'x', updatedAt: base.startedAt, pending: [] })).toBeNull()
    mem.set(SESSION_KEY, '{nope')
    expect(loadSession()).toBeNull()
  })

  it('drops malformed pending entries but keeps the session', () => {
    const s = parseSession({ schemaVersion: 1, startedAt: base.startedAt, updatedAt: base.startedAt, pending: [base.pending[0], { id: 1 }] })
    expect(s!.pending).toEqual(base.pending)
  })
})

describe('session timeout', () => {
  it('expires after the timeout without changes, not before', () => {
    startSession(base)
    const t0 = Date.parse(getSession()!.updatedAt)
    expect(expireSession(t0 + SESSION_TIMEOUT_MS - 1000)).toBe(false)
    expect(getSession()).not.toBeNull()
    expect(expireSession(t0 + SESSION_TIMEOUT_MS + 1000)).toBe(true)
    expect(getSession()).toBeNull()
    expect(mem.has(SESSION_KEY)).toBe(false)
  })

  it('a change resets the timeout', () => {
    startSession(base)
    const stale = { ...getSession()!, updatedAt: new Date(Date.now() - SESSION_TIMEOUT_MS + 60_000).toISOString() }
    mem.set(SESSION_KEY, JSON.stringify(stale))
    _resetSessionCache()
    updateSession((s) => s)
    expect(expireSession(Date.now() + SESSION_TIMEOUT_MS - 60_000)).toBe(false)
  })

  it('an expired stored session is gone after an app restart', () => {
    const old = { schemaVersion: 1, ...base, updatedAt: new Date(Date.now() - SESSION_TIMEOUT_MS - 1000).toISOString() }
    mem.set(SESSION_KEY, JSON.stringify(old))
    expect(getSession()).toBeNull()
    expect(mem.has(SESSION_KEY)).toBe(false)
  })
})
