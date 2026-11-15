import { afterEach, describe, expect, it } from 'vitest'
import { createWebStorage, getStorage, setStorage } from './adapter'
import { runAdapterContract } from './adapterContract'

function fakeLocalStorage(map: Map<string, string>) {
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, String(v)),
    removeItem: (k: string) => void map.delete(k),
  }
}

afterEach(() => {
  setStorage(null)
  delete (globalThis as { localStorage?: unknown }).localStorage
})

// Web adapter: localStorage, reopened over the same "browser profile".
runAdapterContract('web (localStorage)', () => {
  const profile = new Map<string, string>()
  return async () => {
    ;(globalThis as { localStorage?: unknown }).localStorage = fakeLocalStorage(profile)
    return { storage: createWebStorage(), flush: async () => {} }
  }
})

describe('getStorage', () => {
  it('defaults to localStorage and can be overridden', () => {
    const profile = new Map<string, string>()
    ;(globalThis as { localStorage?: unknown }).localStorage = fakeLocalStorage(profile)
    getStorage().setItem('a', '1')
    expect(profile.get('a')).toBe('1')

    const other = new Map<string, string>()
    setStorage(fakeLocalStorage(other))
    getStorage().setItem('a', '2')
    expect(other.get('a')).toBe('2')
    expect(profile.get('a')).toBe('1')
  })
})
