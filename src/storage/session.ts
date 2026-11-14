import { useSyncExternalStore } from 'react'
import type { SetValues } from './repo'

/**
 * The active training session: everything about the running training that must
 * NOT be part of the real data yet. The real workout (in `gymtracker:v1`) only
 * contains confirmed sets; unconfirmed suggestions live here and nowhere else,
 * so they can never reach history, statistics or export.
 *
 * At most one session exists. It is persisted on every change.
 */
export const SESSION_KEY = 'gymtracker:session'
export const SESSION_SCHEMA_VERSION = 1

/** A session without any change for this long is over (the phone is forgotten in the gym bag). */
export const SESSION_TIMEOUT_MS = 12 * 60 * 60 * 1000

/** An unconfirmed (suggested) set. `order` shares its number space with the real sets of the workout. */
export type PendingSet = { id: string; exerciseId: string; order: number } & SetValues

export interface Session {
  schemaVersion: number
  startedAt: string // ISO, date/time of the workout
  updatedAt: string // ISO, last change (drives the timeout)
  note?: string
  templateId?: string
  templateName?: string
  /** Id of the real workout; set once the first set is confirmed. */
  workoutId?: string
  pending: PendingSet[]
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const isStr = (v: unknown): v is string => typeof v === 'string' && v.length > 0
const isIso = (v: unknown): v is string => typeof v === 'string' && !Number.isNaN(Date.parse(v))
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const optStr = (v: unknown) => v === undefined || typeof v === 'string'

function parsePending(v: unknown): PendingSet | null {
  if (!isObj(v)) return null
  if (!isStr(v.id) || !isStr(v.exerciseId) || !isNum(v.order) || !isNum(v.weight) || !isNum(v.reps)) return null
  if (v.durationMin !== undefined && !isNum(v.durationMin)) return null
  if (v.distanceKm !== undefined && !isNum(v.distanceKm)) return null
  const set: PendingSet = { id: v.id, exerciseId: v.exerciseId, order: v.order, weight: v.weight, reps: v.reps }
  if (v.durationMin !== undefined) set.durationMin = v.durationMin as number
  if (v.distanceKm !== undefined) set.distanceKm = v.distanceKm as number
  return set
}

/** Validates raw parsed data. Returns null if it is not a usable session (or from a newer version). */
export function parseSession(raw: unknown): Session | null {
  if (!isObj(raw)) return null
  if (!isNum(raw.schemaVersion) || raw.schemaVersion > SESSION_SCHEMA_VERSION) return null
  if (!isIso(raw.startedAt) || !isIso(raw.updatedAt) || !Array.isArray(raw.pending)) return null
  if (![raw.note, raw.templateId, raw.templateName, raw.workoutId].every(optStr)) return null
  const session: Session = {
    schemaVersion: SESSION_SCHEMA_VERSION,
    startedAt: raw.startedAt,
    updatedAt: raw.updatedAt,
    pending: raw.pending.map(parsePending).filter((p): p is PendingSet => p !== null),
  }
  for (const key of ['note', 'templateId', 'templateName', 'workoutId'] as const) {
    if (typeof raw[key] === 'string') session[key] = raw[key] as string
  }
  return session
}

export function isExpired(session: Pick<Session, 'updatedAt'>, now: number = Date.now()): boolean {
  return now - Date.parse(session.updatedAt) > SESSION_TIMEOUT_MS
}

/** Reads the stored session; unreadable, invalid or expired sessions count as none. */
export function loadSession(storage: Storage = localStorage, now: number = Date.now()): Session | null {
  try {
    const text = storage.getItem(SESSION_KEY)
    if (text === null) return null
    const session = parseSession(JSON.parse(text))
    if (session && !isExpired(session, now)) return session
    storage.removeItem(SESSION_KEY)
  } catch {
    // unreadable: treat as no session
  }
  return null
}

export function saveSession(session: Session | null, storage: Storage = localStorage): void {
  if (session === null) storage.removeItem(SESSION_KEY)
  else storage.setItem(SESSION_KEY, JSON.stringify(session))
}

// In-memory cache + subscribers, like the data store.
let current: Session | null = null
let loaded = false
const listeners = new Set<() => void>()

export function getSession(): Session | null {
  if (!loaded) {
    current = loadSession()
    loaded = true
  }
  return current
}

function commit(next: Session | null): void {
  current = next
  loaded = true
  saveSession(next)
  listeners.forEach((l) => l())
}

/** Starts a session, replacing any existing one. */
export function startSession(session: Omit<Session, 'schemaVersion' | 'updatedAt'>): void {
  commit({ ...session, schemaVersion: SESSION_SCHEMA_VERSION, updatedAt: new Date().toISOString() })
}

/** Applies a change to the active session (no-op without one) and persists it. Any change resets the timeout. */
export function updateSession(fn: (session: Session) => Session): void {
  const cur = getSession()
  if (cur) commit({ ...fn(cur), updatedAt: new Date().toISOString() })
}

/** Ends the session: pending sets are dropped, the real workout is untouched. */
export function clearSession(): void {
  if (getSession() !== null) commit(null)
}

/** Ends the session if it timed out. Returns true if it did. */
export function expireSession(now: number = Date.now()): boolean {
  const cur = getSession()
  if (!cur || !isExpired(cur, now)) return false
  commit(null)
  return true
}

/** For tests: drop the in-memory cache so the next read reloads from storage. */
export function _resetSessionCache(): void {
  current = null
  loaded = false
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useSession(): Session | null {
  return useSyncExternalStore(subscribe, getSession, getSession)
}
