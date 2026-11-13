import { useSyncExternalStore } from 'react'
import type { AppData } from '../types'
import { load, save } from './storage'

let state: AppData | null = null
const listeners = new Set<() => void>()

export function getState(): AppData {
  if (state === null) state = load()
  return state
}

/** Applies an immutable update, persists it and notifies subscribers. */
export function update(fn: (data: AppData) => AppData): void {
  state = fn(getState())
  save(state)
  listeners.forEach((l) => l())
}

/** For tests: drop the in-memory cache so the next read reloads from storage. */
export function _resetCache(): void {
  state = null
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useStore(): AppData {
  return useSyncExternalStore(subscribe, getState)
}
