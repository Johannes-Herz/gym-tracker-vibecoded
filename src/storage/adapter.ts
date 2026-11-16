/**
 * The storage seam. All persistence code takes a `Storage`-shaped object and defaults to
 * `getStorage()`. On the web that is `localStorage`; the native app installs a file-backed
 * adapter at startup (`initStorage`).
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

/**
 * True inside the Capacitor app. The one place that asks; everything else calls this.
 * `__NATIVE_BUILD__` is false in the PWA production build, so Rollup drops every native branch
 * (and the lazily imported native modules) from it. Capacitor's native bridge injects
 * `window.Capacitor` before the page scripts run, so no Capacitor import is needed here.
 */
export function isNative(): boolean {
  if (!__NATIVE_BUILD__) return false
  const cap = (globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
  return cap?.isNativePlatform?.() === true
}

export function getStorage(): Storage {
  return (override ?? createWebStorage()) as Storage
}

export function setStorage(adapter: StorageAdapter | null): void {
  override = adapter
}

/**
 * Call once before rendering. Web: nothing to do. Native app: loads the data files into memory
 * and installs the file-backed adapter. The native code is imported lazily, so it never ends
 * up in the PWA's startup path.
 */
export async function initStorage(): Promise<void> {
  if (__NATIVE_BUILD__ && isNative()) await initNativeStorage()
}

async function initNativeStorage(): Promise<void> {
  const [{ Directory }, { App }, { capacitorFiles }, { openNativeStorage }, { createAutoBackup }, { flushOnBackground }, store] =
    await Promise.all([
      import('@capacitor/filesystem'),
      import('@capacitor/app'),
      import('./capacitorFiles'),
      import('./nativeStorage'),
      import('./autoBackup'),
      import('./lifecycle'),
      import('./store'),
      ])
  const opened = await openNativeStorage(capacitorFiles(Directory.Data))
  setStorage(opened.storage)

  // Automatic backups into the user-visible Documents/GymTracker folder (native only).
  const backup = createAutoBackup({ files: capacitorFiles(Directory.Documents), getData: store.getState })
  store.subscribe(backup.notify)

  // Persist pending writes and backups when the app goes to the background.
  flushOnBackground(
    () => {
      void opened.flush()
      void backup.flush()
    },
    { doc: document, win: window, app: App },
  )
}
