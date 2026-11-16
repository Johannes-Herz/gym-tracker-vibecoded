import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { emptyData } from './storage'
import { autoBackupFileName, BACKUP_DIR, createAutoBackup, hasUserData } from './autoBackup'
import { fakeFiles } from './fakeFiles'
import { parseImport } from './backup'
import type { AppData } from '../types'

const withWorkout = (n: number): AppData => ({
  ...emptyData(),
  bodyWeights: [{ id: `bw${n}`, date: '2026-01-01', weightKg: 80 + n }] as AppData['bodyWeights'],
})

let clock: number
const now = () => new Date(2026, 0, 1, 12, 0, clock++)
const names = (disk: Map<string, string>) => [...disk.keys()].map((k) => k.slice(BACKUP_DIR.length + 1)).sort()

beforeEach(() => {
  vi.useFakeTimers()
  clock = 0
})
afterEach(() => vi.useRealTimers())

describe('auto backup', () => {
  it('names files by local time', () => {
    expect(autoBackupFileName(new Date(2026, 10, 5, 9, 4, 7))).toBe('gym-tracker-backup-2026-11-05-090407.json')
  })

  it('writes one backup after a quiet period, in the export format', async () => {
    const { api, disk } = fakeFiles()
    const data = withWorkout(1)
    const backup = createAutoBackup({ files: api, getData: () => data, now })
    backup.notify()
    backup.notify()
    backup.notify()
    expect(disk.size).toBe(0)
    await vi.advanceTimersByTimeAsync(3000)
    expect(disk.size).toBe(1)
    const text = [...disk.values()][0]
    const parsed = parseImport(text)
    expect(parsed.ok && parsed.data.bodyWeights).toHaveLength(1)
  })

  it('keeps only the last 3 backups and never touches manual exports', async () => {
    const manual = `${BACKUP_DIR}/gym-tracker-backup-2025-12-24.json`
    const { api, disk } = fakeFiles({ [manual]: 'manual' })
    let data = withWorkout(0)
    const backup = createAutoBackup({ files: api, getData: () => data, now })
    for (let i = 1; i <= 5; i++) {
      data = withWorkout(i)
      backup.notify()
      await vi.advanceTimersByTimeAsync(3000)
    }
    const auto = names(disk).filter((n) => n.endsWith('.json') && n.includes('-1200'))
    expect(auto).toEqual([
      'gym-tracker-backup-2026-01-01-120002.json',
      'gym-tracker-backup-2026-01-01-120003.json',
      'gym-tracker-backup-2026-01-01-120004.json',
    ])
    expect(disk.get(manual)).toBe('manual')
    expect([...disk.keys()].some((k) => k.endsWith('.tmp'))).toBe(false)
  })

  it('skips identical data and empty data', async () => {
    const { api, disk } = fakeFiles()
    let data = emptyData()
    const backup = createAutoBackup({ files: api, getData: () => data, now })
    expect(hasUserData(data)).toBe(false)
    backup.notify()
    await vi.advanceTimersByTimeAsync(3000)
    expect(disk.size).toBe(0)

    data = withWorkout(1)
    backup.notify()
    await vi.advanceTimersByTimeAsync(3000)
    backup.notify()
    await vi.advanceTimersByTimeAsync(3000)
    expect(disk.size).toBe(1)
  })

  it('flush writes immediately', async () => {
    const { api, disk } = fakeFiles()
    const backup = createAutoBackup({ files: api, getData: () => withWorkout(1), now })
    backup.notify()
    await backup.flush()
    expect(disk.size).toBe(1)
  })

  it('survives write and delete failures', async () => {
    const { api, disk, fail } = fakeFiles()
    const backup = createAutoBackup({ files: api, getData: () => withWorkout(1), now })
    fail.on = (op) => op === 'write'
    backup.notify()
    await expect(vi.advanceTimersByTimeAsync(3000)).resolves.not.toThrow()
    expect(disk.size).toBe(0)
    // After the failure it tries again on the next change.
    fail.on = () => false
    backup.notify()
    await vi.advanceTimersByTimeAsync(3000)
    expect(disk.size).toBe(1)
  })

  it('keeps going when old files cannot be deleted', async () => {
    const old = (i: number) => `${BACKUP_DIR}/gym-tracker-backup-2025-01-0${i}-120000.json`
    const { api, disk, fail } = fakeFiles({ [old(1)]: 'a', [old(2)]: 'b', [old(3)]: 'c' })
    fail.on = (op) => op === 'remove'
    const backup = createAutoBackup({ files: api, getData: () => withWorkout(1), now })
    backup.notify()
    await vi.advanceTimersByTimeAsync(3000)
    expect(disk.size).toBe(4) // new file written, rotation failed quietly
  })
})
