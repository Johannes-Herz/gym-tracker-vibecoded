/**
 * The storage seam. All persistence code takes a `Storage`-shaped object and defaults to
 * `getStorage()`. On the web that is `localStorage`; the native app installs a file-backed
 * adapter at startup (`setStorage`, see `initStorage` in `nativeStorage.ts`).
 *
 * Reads and writes stay synchronous: native adapters serve reads from memory and persist
 * writes asynchronously, so callers never need to know which adapter is active.
 */
export type StorageAdapter = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

let override: StorageAdapter | null = null

/** The web adapter: plain localStorage, resolved lazily so tests can stub it. */
export function createWebStorage(): StorageAdapter {
  return localStorage
}

export function getStorage(): Storage {
  return (override ?? createWebStorage()) as Storage
}

export function setStorage(adapter: StorageAdapter | null): void {
  override = adapter
}
