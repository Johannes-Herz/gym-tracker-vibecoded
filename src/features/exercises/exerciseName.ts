import { LOCALES, getLang, type Language } from '../../i18n'
import type { Exercise } from '../../types'

/**
 * Display name in the UI language. Built-ins have a German `name` and an English
 * name (`aliasEn`), looked up by their stable id via the stored fields; custom
 * exercises always show exactly what the user typed.
 */
export function exerciseName(e: Pick<Exercise, 'name' | 'aliasEn' | 'source'>, lang: Language = getLang()): string {
  return lang === 'en' && e.source === 'builtin' && e.aliasEn ? e.aliasEn : e.name
}

/** The name in the other language (shown as a small hint next to built-ins), if different. */
export function otherName(e: Pick<Exercise, 'name' | 'aliasEn' | 'source'>, lang: Language = getLang()): string | undefined {
  if (e.source !== 'builtin' || !e.aliasEn) return undefined
  const other = lang === 'en' ? e.name : e.aliasEn
  return other !== exerciseName(e, lang) ? other : undefined
}

/** Sort by display name using the UI language's collation. */
export function byDisplayName(a: Exercise, b: Exercise): number {
  const lang = getLang()
  return exerciseName(a, lang).localeCompare(exerciseName(b, lang), LOCALES[lang])
}
