import type { AppData } from '../types'

export const STORAGE_KEY = 'gymtracker:v1'
export const BACKUP_KEY = 'gymtracker:backup'
export const CURRENT_SCHEMA_VERSION = 1

export function emptyData(): AppData {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    exercises: [],
    workouts: [],
    sets: [],
    bodyWeights: [],
  }
}

/**
 * Brings raw parsed data to the current schema. Returns null if the data
 * is not usable (not an object, unknown/newer version).
 */
export function migrate(raw: unknown): AppData | null {
  if (typeof raw !== 'object' || raw === null) return null
  const obj = raw as Record<string, unknown>
  const version = obj.schemaVersion
  if (typeof version !== 'number' || version > CURRENT_SCHEMA_VERSION) return null

  // Future: if (version < 2) { ...transform...; } step by step.
  const arr = (v: unknown) => (Array.isArray(v) ? v : [])
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    exercises: arr(obj.exercises),
    workouts: arr(obj.workouts),
    sets: arr(obj.sets),
    bodyWeights: arr(obj.bodyWeights),
  }
}

export function load(storage: Storage = localStorage): AppData {
  let text: string | null = null
  try {
    text = storage.getItem(STORAGE_KEY)
  } catch {
    return emptyData()
  }
  if (text === null) return emptyData()
  try {
    const migrated = migrate(JSON.parse(text))
    if (migrated) return migrated
  } catch {
    // fall through to backup
  }
  // Unreadable data: keep a copy so it is never silently lost.
  try {
    storage.setItem(BACKUP_KEY, text)
  } catch {
    // ignore
  }
  return emptyData()
}

export function save(data: AppData, storage: Storage = localStorage): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function reset(storage: Storage = localStorage): void {
  storage.removeItem(STORAGE_KEY)
}
