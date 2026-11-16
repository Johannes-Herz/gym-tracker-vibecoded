import type { OpenedStorage } from './adapterContract'

/**
 * File-backed storage for the native app. Reads are served from memory (hydrated once at
 * startup), writes are persisted asynchronously, one file per key, atomically: the new content
 * goes to `<file>.tmp` first and is then renamed over `<file>`.
 */

/** The few file operations the adapter needs; implemented with Capacitor Filesystem and with a fake in tests. */
export interface FileApi {
  /** Reads a text file; throws if it does not exist or cannot be read. */
  read(path: string): Promise<string>
  /** Writes a text file (parent folders are created). */
  write(path: string, text: string): Promise<void>
  /** Renames `from` to `to`, replacing `to` if it exists. */
  rename(from: string, to: string): Promise<void>
  /** Deletes a file; no error if it does not exist. */
  remove(path: string): Promise<void>
  /** File names (not paths) inside a folder; empty if the folder does not exist. */
  list(dir: string): Promise<string[]>
}

export const STORE_DIR = 'store'
const EXT = '.dat'
const TMP = '.tmp'
const UNREADABLE = '.unreadable'

const VALID_KEY = /^[A-Za-z0-9:_-]+$/

/** `gymtracker:v1` → `gymtracker.v1.dat`. Reversible because keys never contain a dot. */
export function fileNameForKey(key: string): string {
  if (!VALID_KEY.test(key)) throw new Error(`Invalid storage key: ${key}`)
  return key.replace(/:/g, '.') + EXT
}

function keyForFileName(name: string): string | null {
  if (!name.endsWith(EXT)) return null
  const key = name.slice(0, -EXT.length).replace(/\./g, ':')
  return VALID_KEY.test(key) ? key : null
}

export interface NativeStorage extends OpenedStorage {
  /** Errors from background writes that have not succeeded yet (retried on the next write). */
  readonly writeErrors: () => unknown[]
}

/**
 * Loads all keys and returns the adapter. Recovery per key: use `<file>`; if it is missing or
 * unreadable but `<file>.tmp` is complete (a crash between delete and rename), use that.
 * A file that cannot be read at all is renamed to `<file>.unreadable` so it is never overwritten.
 */
export async function openNativeStorage(files: FileApi, dir: string = STORE_DIR): Promise<NativeStorage> {
  const cache = new Map<string, string>()
  const names = new Set(await files.list(dir))
  const path = (name: string) => `${dir}/${name}`

  const keys = new Set<string>()
  for (const name of names) {
    const base = name.endsWith(TMP) ? name.slice(0, -TMP.length) : name
    const key = keyForFileName(base)
    if (key !== null) keys.add(key)
  }

  for (const key of keys) {
    const name = fileNameForKey(key)
    let value: string | null = null
    if (names.has(name)) {
      try {
        value = await files.read(path(name))
      } catch {
        value = null
      }
    }
    if (value === null && names.has(name + TMP)) {
      try {
        value = await files.read(path(name + TMP))
      } catch {
        value = null
      }
    }
    if (value !== null) cache.set(key, value)
    else if (names.has(name)) {
      try {
        await files.rename(path(name), path(name + UNREADABLE))
      } catch {
        // best effort
      }
    }
  }

  // Dirty keys, persisted by a single worker so writes never overlap.
  const dirty = new Set<string>()
  let worker: Promise<void> | null = null
  let errors: unknown[] = []

  async function persist(key: string): Promise<void> {
    const name = fileNameForKey(key)
    const value = cache.get(key)
    if (value === undefined) {
      await files.remove(path(name + TMP))
      await files.remove(path(name))
    } else {
      await files.write(path(name + TMP), value)
      await files.rename(path(name + TMP), path(name))
    }
  }

  async function drain(): Promise<void> {
    errors = []
    for (const key of [...dirty]) {
      dirty.delete(key)
      try {
        await persist(key)
      } catch (e) {
        errors.push(e)
        dirty.add(key) // retried on the next write
      }
    }
    // Writes that arrived while draining (keys already handled, or newly dirtied).
    if (dirty.size > 0 && errors.length === 0) await drain()
  }

  function schedule(key: string): void {
    dirty.add(key)
    if (worker === null) {
      worker = Promise.resolve()
        .then(drain)
        .finally(() => {
          worker = null
        })
    }
  }

  return {
    storage: {
      getItem: (key) => cache.get(key) ?? null,
      setItem: (key, value) => {
        fileNameForKey(key) // validates
        cache.set(key, String(value))
        schedule(key)
      },
      removeItem: (key) => {
        if (cache.delete(key)) schedule(key)
      },
    },
    async flush() {
      while (worker !== null) await worker
    },
    writeErrors: () => errors,
  }
}
