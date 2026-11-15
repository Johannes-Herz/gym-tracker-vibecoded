import { describe, expect, it } from 'vitest'
import type { StorageAdapter } from './adapter'

export interface OpenedStorage {
  storage: StorageAdapter
  /** Waits until all writes are persisted to the backing medium. */
  flush(): Promise<void>
}

/** `makeMedium()` creates a fresh empty backing medium and returns a function that opens it (again). */
export type MediumFactory = () => () => Promise<OpenedStorage>

/** The behaviour every storage adapter must have, run against each implementation. */
export function runAdapterContract(name: string, makeMedium: MediumFactory): void {
  describe(`storage adapter contract: ${name}`, () => {
    it('returns null for a missing key', async () => {
      const { storage } = await makeMedium()()
      expect(storage.getItem('missing')).toBeNull()
    })

    it('reads back what was written, synchronously', async () => {
      const { storage } = await makeMedium()()
      storage.setItem('gymtracker:v1', '{"a":1}')
      expect(storage.getItem('gymtracker:v1')).toBe('{"a":1}')
    })

    it('overwrites an existing value', async () => {
      const { storage } = await makeMedium()()
      storage.setItem('k', 'one')
      storage.setItem('k', 'two')
      expect(storage.getItem('k')).toBe('two')
    })

    it('removes a key and tolerates removing a missing one', async () => {
      const { storage } = await makeMedium()()
      storage.setItem('k', 'v')
      storage.removeItem('k')
      expect(storage.getItem('k')).toBeNull()
      expect(() => storage.removeItem('never-existed')).not.toThrow()
    })

    it('keeps keys independent (keys with colons included)', async () => {
      const { storage } = await makeMedium()()
      storage.setItem('gymtracker:v1', 'data')
      storage.setItem('gymtracker:prefs', 'prefs')
      storage.setItem('gymtracker:session', 'session')
      storage.removeItem('gymtracker:prefs')
      expect(storage.getItem('gymtracker:v1')).toBe('data')
      expect(storage.getItem('gymtracker:prefs')).toBeNull()
      expect(storage.getItem('gymtracker:session')).toBe('session')
    })

    it('persists across a reopen (app restart), including unicode and large values', async () => {
      const open = makeMedium()
      const first = await open()
      const big = JSON.stringify({ text: 'non-ascii: ' + String.fromCharCode(0xe4, 0xf6, 0xfc, 0x2013, 0xd83d, 0xdcaa), rows: Array.from({ length: 5000 }, (_, i) => i) })
      first.storage.setItem('gymtracker:v1', big)
      first.storage.setItem('gymtracker:prefs', 'p')
      first.storage.removeItem('gymtracker:prefs')
      await first.flush()

      const second = await open()
      expect(second.storage.getItem('gymtracker:v1')).toBe(big)
      expect(second.storage.getItem('gymtracker:prefs')).toBeNull()
    })

    it('persists only the latest value after many quick writes', async () => {
      const open = makeMedium()
      const first = await open()
      for (let i = 0; i < 50; i++) first.storage.setItem('k', `v${i}`)
      await first.flush()
      expect((await open()).storage.getItem('k')).toBe('v49')
    })
  })
}
