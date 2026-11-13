import { describe, expect, it } from 'vitest'
import { backupFileName, serializeBackup } from './backup'
import { CURRENT_SCHEMA_VERSION, emptyData } from './storage'

describe('backup export', () => {
  it('wraps data with app marker and timestamp', () => {
    const data = emptyData()
    const parsed = JSON.parse(serializeBackup(data, new Date('2026-01-02T03:04:05Z')))
    expect(parsed.app).toBe('gymtracker')
    expect(parsed.exportedAt).toBe('2026-01-02T03:04:05.000Z')
    expect(parsed.data.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
    expect(parsed.data).toEqual(data)
  })

  it('builds a dated file name', () => {
    expect(backupFileName(new Date(2026, 0, 5))).toBe('gymtracker-2026-01-05.json')
  })
})
