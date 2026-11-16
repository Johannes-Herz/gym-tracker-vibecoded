/**
 * Flushes pending writes when the app leaves the foreground, so killing the app right after a
 * change loses nothing. Native-only module (imported lazily by `initStorage`).
 *
 * Three signals, because none is fully reliable alone on Android: the page becoming hidden,
 * `pagehide`, and the native `pause` / `appStateChange` events of the Capacitor App plugin.
 */

interface EventSource {
  addEventListener(type: string, listener: () => void): void
}

export interface LifecycleTargets {
  doc: EventSource & { visibilityState: string }
  win: EventSource
  /** The Capacitor App plugin (or a fake). */
  app: { addListener(event: string, listener: (state?: { isActive?: boolean }) => void): unknown }
}

export function flushOnBackground(flush: () => void, { doc, win, app }: LifecycleTargets): void {
  doc.addEventListener('visibilitychange', () => doc.visibilityState === 'hidden' && flush())
  win.addEventListener('pagehide', flush)
  void app.addListener('pause', flush)
  void app.addListener('appStateChange', (state) => state?.isActive === false && flush())
}
