import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import type { AppData } from '../types'
import { BACKUP_DIR } from './autoBackup'
import { backupFileName, serializeBackup } from './backup'

/** Manual export in the native app: the file lands next to the automatic backups. */
export async function saveBackupToDocuments(data: AppData, now: Date): Promise<string> {
  const name = backupFileName(now)
  await Filesystem.writeFile({
    path: `${BACKUP_DIR}/${name}`,
    data: serializeBackup(data, now),
    directory: Directory.Documents,
    encoding: Encoding.UTF8,
    recursive: true,
  })
  return name
}

/** Writes the backup to the cache folder and opens the Android share sheet for it. */
export async function shareBackupNative(data: AppData, now: Date): Promise<'shared' | 'cancelled'> {
  const name = backupFileName(now)
  const { uri } = await Filesystem.writeFile({
    path: `share/${name}`,
    data: serializeBackup(data, now),
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
    recursive: true,
  })
  try {
    await Share.share({ title: name, url: uri })
    return 'shared'
  } catch (e) {
    if (/cancel/i.test((e as { message?: string } | null)?.message ?? '')) return 'cancelled'
    throw e
  }
}
