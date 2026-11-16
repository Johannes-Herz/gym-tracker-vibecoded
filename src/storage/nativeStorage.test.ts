import { describe, expect, it } from 'vitest'
import { runAdapterContract } from './adapterContract'
import { fakeFiles } from './fakeFiles'
import { openNativeStorage, STORE_DIR } from './nativeStorage'

runAdapterContract('native (mocked Filesystem)', () => {
  const { api } = fakeFiles()
  return () => openNativeStorage(api)
})

describe('native storage files', () => {
  it('writes one file per key via a temp file and leaves no temp file behind', async () => {
    const { api, disk, log } = fakeFiles()
    const s = await openNativeStorage(api)
    s.storage.setItem('gymtracker:v1', 'data')
    await s.flush()
    expect(disk.get(`${STORE_DIR}/gymtracker.v1.dat`)).toBe('data')
    expect([...disk.keys()].some((k) => k.endsWith('.tmp'))).toBe(false)
    expect(log.indexOf(`write ${STORE_DIR}/gymtracker.v1.dat.tmp`)).toBeLessThan(
      log.indexOf(`rename ${STORE_DIR}/gymtracker.v1.dat.tmp`),
    )
  })

  it('a crash while writing the temp file keeps the previous content', async () => {
    const { api, disk, fail } = fakeFiles({ [`${STORE_DIR}/gymtracker.v1.dat`]: 'old' })
    const s = await openNativeStorage(api)
    fail.on = (op, p) => op === 'write' && p.endsWith('.tmp')
    s.storage.setItem('gymtracker:v1', 'new')
    await s.flush()
    expect(s.writeErrors()).toHaveLength(1)
    expect(disk.get(`${STORE_DIR}/gymtracker.v1.dat`)).toBe('old')
    // The next app start sees the old, intact data.
    const again = await openNativeStorage(api)
    expect(again.storage.getItem('gymtracker:v1')).toBe('old')
  })

  it('retries a failed write on the next write', async () => {
    const { api, disk, fail } = fakeFiles()
    const s = await openNativeStorage(api)
    fail.on = () => true
    s.storage.setItem('k', 'v1')
    await s.flush()
    expect(s.writeErrors()).toHaveLength(1)
    fail.on = () => false
    s.storage.setItem('other', 'x')
    await s.flush()
    expect(s.writeErrors()).toHaveLength(0)
    expect(disk.get(`${STORE_DIR}/k.dat`)).toBe('v1')
  })

  it('recovers from the temp file if the main file is missing (crash between delete and rename)', async () => {
    const { api } = fakeFiles({ [`${STORE_DIR}/gymtracker.v1.dat.tmp`]: 'complete new' })
    const s = await openNativeStorage(api)
    expect(s.storage.getItem('gymtracker:v1')).toBe('complete new')
  })

  it('prefers the main file over a leftover temp file', async () => {
    const { api } = fakeFiles({
      [`${STORE_DIR}/gymtracker.v1.dat`]: 'good',
      [`${STORE_DIR}/gymtracker.v1.dat.tmp`]: 'partial wri',
    })
    const s = await openNativeStorage(api)
    expect(s.storage.getItem('gymtracker:v1')).toBe('good')
  })

  it('moves an unreadable file aside instead of overwriting it', async () => {
    const { api, disk, fail } = fakeFiles({ [`${STORE_DIR}/gymtracker.v1.dat`]: 'precious' })
    fail.on = (op, p) => op === 'read' && p.endsWith('gymtracker.v1.dat')
    const s = await openNativeStorage(api)
    fail.on = () => false
    expect(s.storage.getItem('gymtracker:v1')).toBeNull()
    expect(disk.get(`${STORE_DIR}/gymtracker.v1.dat.unreadable`)).toBe('precious')
  })

  it('removing a key deletes its files', async () => {
    const { api, disk } = fakeFiles({ [`${STORE_DIR}/k.dat`]: 'v' })
    const s = await openNativeStorage(api)
    s.storage.removeItem('k')
    await s.flush()
    expect([...disk.keys()]).toEqual([])
  })

  it('rejects keys that cannot be mapped to a file name', async () => {
    const s = await openNativeStorage(fakeFiles().api)
    expect(() => s.storage.setItem('../evil', 'x')).toThrow()
    expect(() => s.storage.setItem('a.b', 'x')).toThrow()
  })
})
