import type { AppData } from '../types'

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
