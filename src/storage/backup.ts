import { MIN_ASSISTED_KG, isBodyweight } from '../features/exercises/bodyweight'
import { EQUIPMENT, MUSCLE_GROUPS, isCardio, type AppData } from '../types'
import { BACKUP_KEY, CURRENT_SCHEMA_VERSION, emptyData, migrate } from './storage'
import { getState, update } from './store'

export const BACKUP_APP_ID = 'gymtracker'

export interface BackupFile {
  app: typeof BACKUP_APP_ID
  exportedAt: string // ISO
  data: AppData
}

export function createBackup(data: AppData, now: Date = new Date()): BackupFile {
  return { app: BACKUP_APP_ID, exportedAt: now.toISOString(), data }
}

export function serializeBackup(data: AppData, now: Date = new Date()): string {
  return JSON.stringify(createBackup(data, now), null, 2)
}

export function backupFileName(now: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `gymtracker-${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}.json`
}

export type ImportResult = { ok: true; data: AppData } | { ok: false; error: string }

const fail = (error: string): ImportResult => ({ ok: false, error })

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
const isId = (v: unknown): v is string => typeof v === 'string' && v.length > 0
const isIso = (v: unknown): v is string => typeof v === 'string' && !Number.isNaN(Date.parse(v))
const isDay = (v: unknown): v is string =>
  typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v))
const isNonNeg = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0

function checkUniqueIds(name: string, items: { id: string }[]): string | null {
  const seen = new Set<string>()
  for (const item of items) {
    if (seen.has(item.id)) return `${name}: doppelte ID.`
    seen.add(item.id)
  }
  return null
}

/** Parses and validates the text of a backup file. Never throws. */
export function parseImport(text: string): ImportResult {
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    return fail('Die Datei ist keine gültige JSON-Datei.')
  }
  if (!isObj(json) || json.app !== BACKUP_APP_ID) {
    return fail('Die Datei ist kein Gym-Tracker-Backup.')
  }
  const raw = json.data
  if (!isObj(raw)) return fail('Das Backup enthält keine Daten.')
  if (typeof raw.schemaVersion !== 'number') return fail('Schema-Version fehlt.')
  if (raw.schemaVersion > CURRENT_SCHEMA_VERSION) {
    return fail('Das Backup stammt aus einer neueren App-Version.')
  }
  for (const key of ['exercises', 'workouts', 'sets', 'bodyWeights']) {
    if (!Array.isArray(raw[key])) return fail(`Feld „${key}“ fehlt oder ist ungültig.`)
  }

  const data = migrate(raw)
  if (!data) return fail('Die Daten konnten nicht migriert werden.')

  for (const e of data.exercises) {
    if (
      !isObj(e) ||
      !isId(e.id) ||
      typeof e.name !== 'string' ||
      !e.name.trim() ||
      !(MUSCLE_GROUPS as readonly unknown[]).includes(e.muscleGroup) ||
      typeof e.category !== 'string' ||
      !isIso(e.createdAt) ||
      (e.source !== 'builtin' && e.source !== 'custom') ||
      (e.aliasEn !== undefined && typeof e.aliasEn !== 'string') ||
      (e.equipment !== undefined && !(EQUIPMENT as readonly unknown[]).includes(e.equipment)) ||
      (e.hidden !== undefined && typeof e.hidden !== 'boolean')
    ) {
      return fail('Übungen: ungültiger Eintrag.')
    }
  }
  for (const w of data.workouts) {
    if (!isObj(w) || !isId(w.id) || !isIso(w.startedAt) || (w.note !== undefined && typeof w.note !== 'string')) {
      return fail('Trainings: ungültiger Eintrag.')
    }
  }
  for (const s of data.sets) {
    if (
      !isObj(s) ||
      !isId(s.id) ||
      !isId(s.workoutId) ||
      !isId(s.exerciseId) ||
      !isNonNeg(s.order) ||
      typeof s.weight !== 'number' ||
      !Number.isFinite(s.weight) ||
      !isNonNeg(s.reps) ||
      (s.durationMin !== undefined && !(isNonNeg(s.durationMin) && s.durationMin > 0)) ||
      (s.distanceKm !== undefined && !isNonNeg(s.distanceKm))
    ) {
      return fail('Sätze: ungültiger Eintrag.')
    }
  }
  for (const b of data.bodyWeights) {
    if (!isObj(b) || !isId(b.id) || !isDay(b.date) || !isNonNeg(b.weightKg)) {
      return fail('Körpergewicht: ungültiger Eintrag.')
    }
  }

  const dup =
    checkUniqueIds('Übungen', data.exercises) ??
    checkUniqueIds('Trainings', data.workouts) ??
    checkUniqueIds('Sätze', data.sets) ??
    checkUniqueIds('Körpergewicht', data.bodyWeights)
  if (dup) return fail(dup)

  const exerciseById = new Map(data.exercises.map((e) => [e.id, e]))
  const exerciseIds = new Set(exerciseById.keys())
  const workoutIds = new Set(data.workouts.map((w) => w.id))
  for (const s of data.sets) {
    if (!workoutIds.has(s.workoutId) || !exerciseIds.has(s.exerciseId)) {
      return fail('Sätze verweisen auf fehlende Trainings oder Übungen.')
    }
  }
  for (const s of data.sets) {
    // Cardio entries need a duration; strength sets must not carry one.
    const exercise = exerciseById.get(s.exerciseId)!
    if (isCardio(exercise) !== (s.durationMin !== undefined)) {
      return fail('Sätze passen nicht zum Übungstyp (Kraft/Cardio).')
    }
    // Negative weight = assisted, only allowed for bodyweight exercises.
    const minWeight = isBodyweight(exercise) ? MIN_ASSISTED_KG : 0
    if (s.weight < minWeight) return fail('Sätze: ungültiges Gewicht.')
  }

  return { ok: true, data }
}

/**
 * Replaces all data. The previous data is kept under BACKUP_KEY so a bad
 * import can be recovered manually.
 */
export function replaceAllData(data: AppData, storage: Storage = localStorage): void {
  try {
    storage.setItem(BACKUP_KEY, JSON.stringify(getState()))
  } catch {
    // ignore: backup is best effort
  }
  update(() => data)
}

/** Deletes all app data (exercises, workouts, sets, body weights). */
export function deleteAllData(): void {
  update(() => emptyData())
}
