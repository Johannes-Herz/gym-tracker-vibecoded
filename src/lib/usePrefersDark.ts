import { useSyncExternalStore } from 'react'

const QUERY = '(prefers-color-scheme: dark)'

function subscribe(onChange: () => void): () => void {
  const mql = window.matchMedia(QUERY)
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}

/** True while the system is in dark mode; updates live. */
export function usePrefersDark(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches)
}
