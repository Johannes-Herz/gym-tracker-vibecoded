import { beforeEach, describe, expect, it, vi } from 'vitest'
import { emptyData } from './storage'

const writeFile = vi.fn()
const share = vi.fn()
vi.mock('@capacitor/filesystem', () => ({
  Directory: { Documents: 'DOCUMENTS', Cache: 'CACHE' },
  Encoding: { UTF8: 'utf8' },
  Filesystem: { writeFile: (o: unknown) => writeFile(o) },
}))
vi.mock('@capacitor/share', () => ({ Share: { share: (o: unknown) => share(o) } }))

const { saveBackupToDocuments, shareBackupNative } = await import('./nativeExport')
const now = new Date(2026, 10, 5, 9, 0, 0)

beforeEach(() => {
  writeFile.mockReset().mockResolvedValue({ uri: 'file:///cache/share/x.json' })
  share.mockReset().mockResolvedValue({})
})

describe('native export', () => {
  it('saves the backup into Documents/GymTracker', async () => {
    const name = await saveBackupToDocuments(emptyData(), now)
    expect(name).toBe('gym-tracker-backup-2026-11-05.json')
    const call = writeFile.mock.calls[0][0]
    expect(call.path).toBe('GymTracker/gym-tracker-backup-2026-11-05.json')
    expect(call.directory).toBe('DOCUMENTS')
    expect(JSON.parse(call.data).app).toBe('gymtracker')
  })

  it('shares a cache file through the share sheet', async () => {
    expect(await shareBackupNative(emptyData(), now)).toBe('shared')
    expect(writeFile.mock.calls[0][0].directory).toBe('CACHE')
    expect(share).toHaveBeenCalledWith({ title: 'gym-tracker-backup-2026-11-05.json', url: 'file:///cache/share/x.json' })
  })

  it('treats a dismissed share sheet as cancelled and rethrows other errors', async () => {
    share.mockRejectedValueOnce(new Error('Share canceled'))
    expect(await shareBackupNative(emptyData(), now)).toBe('cancelled')
    share.mockRejectedValueOnce(new Error('boom'))
    await expect(shareBackupNative(emptyData(), now)).rejects.toThrow('boom')
  })
})
