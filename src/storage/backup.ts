import { MIN_ASSISTED_KG, isBodyweight } from '../features/exercises/bodyweight'
import { translate } from '../i18n'
import { EQUIPMENT, MUSCLE_GROUPS, isCardio, type AppData } from '../types'
import { BACKUP_KEY, CURRENT_SCHEMA_VERSION, emptyData, migrate } from './storage'
import { clearSession } from './session'
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

type Section = 'exercises' | 'workouts' | 'sets' | 'bodyWeights' | 'templates'
const sectionName = (section: Section) => translate(`backup.section.${section}`)
const invalidEntry = (section: Section) => fail(translate('backup.entryInvalid', { section: sectionName(section) }))

function checkUniqueIds(section: Section, items: { id: string }[]): string | null {
  const seen = new Set<string>()
  for (const item of items) {
    if (seen.has(item.id)) return translate('backup.duplicateId', { section: sectionName(section) })
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
    return fail(translate('backup.notJson'))
  }
  if (!isObj(json) || json.app !== BACKUP_APP_ID) {
    return fail(translate('backup.notBackup'))
  }
  const raw = json.data
  if (!isObj(raw)) return fail(translate('backup.noData'))
  if (typeof raw.schemaVersion !== 'number') return fail(translate('backup.noSchema'))
  if (raw.schemaVersion > CURRENT_SCHEMA_VERSION) {
    return fail(translate('backup.tooNew'))
  }
  for (const key of ['exercises', 'workouts', 'sets', 'bodyWeights']) {
    if (!Array.isArray(raw[key])) return fail(translate('backup.fieldInvalid', { key }))
  }
  // Templates exist from schema v4 on; older backups simply have none.
  if (raw.schemaVersion >= 4 && !Array.isArray(raw.templates)) {
    return fail(translate('backup.fieldInvalid', { key: 'templates' }))
  }

  const data = migrate(raw)
  if (!data) return fail(translate('backup.migrateFailed'))

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
      (e.aliases !== undefined &&
        (!Array.isArray(e.aliases) || !e.aliases.every((a: unknown) => typeof a === 'string'))) ||
      (e.equipment !== undefined && !(EQUIPMENT as readonly unknown[]).includes(e.equipment)) ||
      (e.hidden !== undefined && typeof e.hidden !== 'boolean')
    ) {
      return invalidEntry('exercises')
    }
  }
  for (const w of data.workouts) {
    if (
      !isObj(w) ||
      !isId(w.id) ||
      !isIso(w.startedAt) ||
      (w.note !== undefined && typeof w.note !== 'string') ||
      (w.templateId !== undefined && !isId(w.templateId)) ||
      (w.templateName !== undefined && typeof w.templateName !== 'string')
    ) {
      return invalidEntry('workouts')
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
      return invalidEntry('sets')
    }
  }
  for (const b of data.bodyWeights) {
    if (!isObj(b) || !isId(b.id) || !isDay(b.date) || !isNonNeg(b.weightKg)) {
      return invalidEntry('bodyWeights')
    }
  }

  for (const t of data.templates) {
    if (
      !isObj(t) ||
      !isId(t.id) ||
      typeof t.name !== 'string' ||
      !t.name.trim() ||
      !Array.isArray(t.exerciseIds) ||
      !t.exerciseIds.every(isId) ||
      !isIso(t.createdAt) ||
      !isIso(t.updatedAt)
    ) {
      return invalidEntry('templates')
    }
  }

  const dup =
    checkUniqueIds('exercises', data.exercises) ??
    checkUniqueIds('workouts', data.workouts) ??
    checkUniqueIds('sets', data.sets) ??
    checkUniqueIds('bodyWeights', data.bodyWeights) ??
    checkUniqueIds('templates', data.templates)
  if (dup) return fail(dup)

  const exerciseById = new Map(data.exercises.map((e) => [e.id, e]))
  const exerciseIds = new Set(exerciseById.keys())
  // Templates may only reference existing exercises; unknown ones are dropped.
  data.templates = data.templates.map((t) => ({
    ...t,
    exerciseIds: t.exerciseIds.filter((id) => exerciseIds.has(id)),
  }))
  const workoutIds = new Set(data.workouts.map((w) => w.id))
  for (const s of data.sets) {
    if (!workoutIds.has(s.workoutId) || !exerciseIds.has(s.exerciseId)) {
      return fail(translate('backup.setsMissingRefs'))
    }
  }
  for (const s of data.sets) {
    // Cardio entries need a duration; strength sets must not carry one.
    const exercise = exerciseById.get(s.exerciseId)!
    if (isCardio(exercise) !== (s.durationMin !== undefined)) {
      return fail(translate('backup.setsWrongType'))
    }
    // Negative weight = assisted, only allowed for bodyweight exercises.
    const minWeight = isBodyweight(exercise) ? MIN_ASSISTED_KG : 0
    if (s.weight < minWeight) return fail(translate('backup.setsBadWeight'))
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
  clearSession() // a running training refers to the replaced data
}

/** Deletes all app data (exercises, workouts, sets, body weights). */
export function deleteAllData(): void {
  update(() => emptyData())
  clearSession()
}
