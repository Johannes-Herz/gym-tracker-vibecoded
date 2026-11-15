import type { FileApi } from './nativeStorage'

/** In-memory file system. `failOn` makes matching operations throw, to simulate crashes. */
export function fakeFiles(initial: Record<string, string> = {}) {
  const disk = new Map<string, string>(Object.entries(initial))
  const log: string[] = []
  const fail = { on: (_op: string, _path: string) => false }
  const check = (op: string, path: string) => {
    log.push(`${op} ${path}`)
    if (fail.on(op, path)) throw new Error(`simulated failure: ${op} ${path}`)
  }
  const api: FileApi = {
    async read(path) {
      check('read', path)
      const v = disk.get(path)
      if (v === undefined) throw new Error(`not found: ${path}`)
      return v
    },
    async write(path, text) {
      check('write', path)
      disk.set(path, text)
    },
    async rename(from, to) {
      check('rename', from)
      const v = disk.get(from)
      if (v === undefined) throw new Error(`not found: ${from}`)
      disk.delete(from)
      disk.set(to, v)
    },
    async remove(path) {
      check('remove', path)
      disk.delete(path)
    },
    async list(dir) {
      return [...disk.keys()].filter((p) => p.startsWith(dir + '/')).map((p) => p.slice(dir.length + 1))
    },
  }
  return { api, disk, log, fail }
}
