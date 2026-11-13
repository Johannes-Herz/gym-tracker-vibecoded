import { useSyncExternalStore } from 'react'
import { DEFAULT_LANGUAGE, loadLanguage, saveLanguage, type Language } from '../storage/preferences'
import { de } from './de'
import { en } from './en'

export type { Language }
export type MessageKey = keyof typeof de
/** Keys that have `<base>_one` and `<base>_other` variants. */
export type PluralKey = MessageKey extends infer K ? (K extends `${infer B}_one` ? B : never) : never
export type Params = Record<string, string | number>

const dictionaries: Record<Language, Record<MessageKey, string>> = { de, en }

/** Language names are always shown in their own language. */
export const LANGUAGE_NAMES: Record<Language, string> = { de: 'Deutsch', en: 'English' }

/** BCP 47 locales for Intl (dates, numbers, collation). */
export const LOCALES: Record<Language, string> = { de: 'de-DE', en: 'en-US' }

let current: Language | null = null
const listeners = new Set<() => void>()

export function getLang(): Language {
  if (current === null) {
    try {
      current = loadLanguage()
    } catch {
      current = DEFAULT_LANGUAGE // no localStorage (tests, blocked storage)
    }
  }
  return current
}

/** Applies immediately (no reload) and remembers the choice on this device. */
export function setLang(lang: Language): void {
  current = lang
  try {
    saveLanguage(lang)
  } catch {
    // ignore
  }
  if (typeof document !== 'undefined') document.documentElement.lang = lang
  listeners.forEach((l) => l())
}

/** For tests: forget the cached language so the next read reloads it. */
export function _resetLang(): void {
  current = null
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useLang(): Language {
  return useSyncExternalStore(subscribe, getLang)
}

function fill(template: string, params?: Params): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (m, name: string) => (name in params ? String(params[name]) : m))
}

export function translate(key: MessageKey, params?: Params, lang: Language = getLang()): string {
  return fill(dictionaries[lang][key], params)
}

/** Plural by count: uses `<key>_one` for 1 and `<key>_other` otherwise; `{n}` is the count. */
export function translatePlural(key: PluralKey, n: number, params?: Params, lang: Language = getLang()): string {
  const variant = (n === 1 ? `${key}_one` : `${key}_other`) as MessageKey
  return fill(dictionaries[lang][variant], { n, ...params })
}

/**
 * Components call `t` / `tp` directly. They read the current language at render
 * time; `App` remounts the tree when the language changes, so every screen
 * updates immediately without a reload.
 */
export const t = (key: MessageKey, params?: Params): string => translate(key, params)
export const tp = (key: PluralKey, n: number, params?: Params): string => translatePlural(key, n, params)

export interface Translator {
  lang: Language
  t: (key: MessageKey, params?: Params) => string
  tp: (key: PluralKey, n: number, params?: Params) => string
}

/** Re-renders the component when the language changes. */
export function useT(): Translator {
  const lang = useLang()
  return {
    lang,
    t: (key, params) => translate(key, params, lang),
    tp: (key, n, params) => translatePlural(key, n, params, lang),
  }
}

export { dictionaries }
