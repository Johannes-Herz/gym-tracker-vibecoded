import type { AppData } from '../types'
import { serializeBackup } from './backup'
import type { FileApi } from './nativeStorage'

/** Folder inside Documents that holds the automatic backups. */
export const BACKUP_DIR = 'GymTracker'
/** Number of automatic backups that are kept. */
export const BACKUP_KEEP = 3
export const BACKUP_DEBOUNCE_MS = 3000

// Only these files are ever rotated; manual exports (`…-YYYY-MM-DD.json`) are never touched.
const AUTO_NAME = /^gym-tracker-backup-\d{4}-\d{2}-\d{2}-\d{6}\.json$/

export function autoBackupFileName(now: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  const day = `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`
  return `gym-tracker-backup-${day}-${p(now.getHours())}${p(now.getMinutes())}${p(now.getSeconds())}.json`
}

/** Nothing worth saving yet. Backing this up would only push real backups out of the rotation. */
export function hasUserData(data: AppData): boolean {
  return (
    data.workouts.length > 0 ||
    data.templates.length > 0 ||
    data.bodyWeights.length > 0 ||
    data.exercises.some((e) => e.source === 'custom')
  )
}

export interface AutoBackupOptions {
  files: FileApi
  getData: () => AppData
  keep?: number
  debounceMs?: number
  now?: () => Date
  dir?: string
}

export interface AutoBackup {
  /** Data changed: write a backup after a quiet period. */
  notify(): void
  /** Write now if something changed (app going to the background). Resolves when done. */
  flush(): Promise<void>
}

export function createAutoBackup(options: AutoBackupOptions): AutoBackup {
  const { files, getData } = options
  const keep = options.keep ?? BACKUP_KEEP
  const debounceMs = options.debounceMs ?? BACKUP_DEBOUNCE_MS
  const now = options.now ?? (() => new Date())
  const dir = options.dir ?? BACKUP_DIR

  let timer: ReturnType<typeof setTimeout> | null = null
  let lastWritten: string | null = null
  let running: Promise<void> = Promise.resolve()

  async function rotate(): Promise<void> {
    const names = (await files.list(dir)).filter((n) => AUTO_NAME.test(n)).sort()
    for (const name of names.slice(0, Math.max(0, names.length - keep))) {
      try {
        await files.remove(`${dir}/${name}`)
      } catch {
        // e.g. a file from a previous installation that this install may not delete
      }
    }
  }

  async function write(): Promise<void> {
    const data = getData()
    if (!hasUserData(data)) return
    const fingerprint = JSON.stringify(data)
    if (fingerprint === lastWritten) return
    const date = now()
    const name = autoBackupFileName(date)
    try {
      await files.write(`${dir}/${name}.tmp`, serializeBackup(data, date))
      await files.rename(`${dir}/${name}.tmp`, `${dir}/${name}`)
      lastWritten = fingerprint
      await rotate()
    } catch {
      // Best effort: the next change tries again; the primary data is stored separately.
    }
  }

  function run(): Promise<void> {
    running = running.then(write)
    return running
  }

  return {
    notify() {
      if (timer !== null) clearTimeout(timer)
      timer = setTimeout(() => {
        timer = null
        void run()
      }, debounceMs)
    },
    flush() {
      if (timer === null) return running
      clearTimeout(timer)
      timer = null
      return run()
    },
  }
}
