import { BUILTIN_EXERCISES, type BuiltinExercise } from '../data/builtinExercises'
import type { AppData, Exercise } from '../types'

export const STORAGE_KEY = 'gymtracker:v1'
export const BACKUP_KEY = 'gymtracker:backup'
export const CURRENT_SCHEMA_VERSION = 5

/** Fixed creation time for built-ins, so seeding is deterministic. */
export const BUILTIN_CREATED_AT = '2026-01-01T00:00:00.000Z'

/** Fresh data: no workouts, but all built-in exercises. */
export function emptyData(): AppData {
  return ensureBuiltins({
    schemaVersion: CURRENT_SCHEMA_VERSION,
    exercises: [],
    workouts: [],
    sets: [],
    bodyWeights: [],
    templates: [],
  })
}

function fromCatalog(b: BuiltinExercise): Omit<Exercise, 'createdAt' | 'hidden'> {
  return {
    id: b.id,
    name: b.name,
    aliasEn: b.aliasEn,
    ...(b.aliases.length > 0 && { aliases: [...b.aliases] }),
    muscleGroup: b.muscleGroup,
    category: b.category,
    equipment: b.equipment,
    source: 'builtin',
  }
}

/**
 * Adds missing built-ins and refreshes catalog fields of existing ones
 * (keeping `hidden` and `createdAt`). Custom exercises are never touched.
 */
export function ensureBuiltins(
  data: AppData,
  catalog: readonly BuiltinExercise[] = BUILTIN_EXERCISES,
): AppData {
  const byId = new Map(catalog.map((b) => [b.id, b]))
  const present = new Set<string>()
  const exercises = data.exercises.map((e) => {
    const b = byId.get(e.id)
    if (!b) return e
    present.add(e.id)
    return { ...e, ...fromCatalog(b) }
  })
  for (const b of catalog) {
    if (!present.has(b.id)) exercises.push({ ...fromCatalog(b), createdAt: BUILTIN_CREATED_AT })
  }
  return { ...data, exercises }
}

/** Removes workouts without any sets (a workout only exists once it has content). */
export function pruneEmptyWorkouts(data: AppData): AppData {
  const used = new Set(data.sets.map((s) => s?.workoutId))
  const workouts = data.workouts.filter((w) => used.has(w?.id))
  return workouts.length === data.workouts.length ? data : { ...data, workouts }
}

const normalize = (s: string) => s.trim().toLocaleLowerCase('de')

/**
 * v1 -> v2: marks existing exercises as custom and merges custom exercises
 * whose name matches a built-in (German name or English alias) into that
 * built-in: their sets are repointed, the custom exercise is removed.
 */
function migrateV1toV2(data: AppData): AppData {
  const builtinByName = new Map<string, string>()
  for (const b of BUILTIN_EXERCISES) {
    builtinByName.set(normalize(b.name), b.id)
    builtinByName.set(normalize(b.aliasEn), b.id)
    // Previous German names (e.g. "Bankdrücken") must still merge v1 exercises.
    for (const a of b.aliases) builtinByName.set(normalize(a), b.id)
  }
  const repoint = new Map<string, string>()
  const exercises: Exercise[] = []
  for (const e of data.exercises) {
    const target = typeof e?.name === 'string' ? builtinByName.get(normalize(e.name)) : undefined
    if (target) repoint.set(e.id, target)
    else exercises.push({ ...e, source: 'custom' })
  }
  const sets = data.sets.map((s) => {
    const target = repoint.get(s?.exerciseId)
    return target ? { ...s, exerciseId: target } : s
  })
  return { ...data, exercises, sets }
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

  const arr = (v: unknown) => (Array.isArray(v) ? v : [])
  let data: AppData = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    exercises: arr(obj.exercises),
    workouts: arr(obj.workouts),
    sets: arr(obj.sets),
    bodyWeights: arr(obj.bodyWeights),
    // v4: workout templates (absent in older data).
    templates: arr(obj.templates),
  }
  if (version < 2) data = migrateV1toV2(data)
  // v5: SZ-Stange equipment, built-in `aliases`, renamed built-ins. All arrive via
  // ensureBuiltins below (by stable id); custom exercises, hidden state and workout
  // data are not touched. A custom exercise named like a new built-in is kept as is.
  // v3: empty workouts are no longer allowed; pruned on every load as a safety net.
  return ensureBuiltins(pruneEmptyWorkouts(data))
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
