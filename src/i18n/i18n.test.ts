import { beforeEach, describe, expect, it, vi } from 'vitest'
import { _resetLang, dictionaries, getLang, setLang, translate, translatePlural, type MessageKey } from './index'

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()

describe('dictionaries', () => {
  const keys = Object.keys(dictionaries.de) as MessageKey[]

  it('have exactly the same keys in both languages', () => {
    expect(Object.keys(dictionaries.en).sort()).toEqual([...keys].sort())
  })

  it('have no empty values and the same placeholders in both languages', () => {
    for (const k of keys) {
      expect(dictionaries.de[k].trim(), k).not.toBe('')
      expect(dictionaries.en[k].trim(), k).not.toBe('')
      expect(placeholders(dictionaries.en[k]), k).toEqual(placeholders(dictionaries.de[k]))
    }
  })

  it('define both plural variants for every plural key', () => {
    for (const k of keys) {
      if (k.endsWith('_one')) expect(keys, k).toContain(k.replace(/_one$/, '_other'))
      if (k.endsWith('_other')) expect(keys, k).toContain(k.replace(/_other$/, '_one'))
    }
  })
})

describe('language switch', () => {
  beforeEach(() => _resetLang())

  it('defaults to German when nothing is stored (or storage is unavailable)', () => {
    expect(getLang()).toBe('de')
  })

  it('applies immediately and notifies, without reload', () => {
    expect(translate('settings.language')).toBe('Sprache')
    setLang('en')
    expect(getLang()).toBe('en')
    expect(translate('settings.language')).toBe('Language')
    setLang('de')
    expect(translate('settings.language')).toBe('Sprache')
  })
})

describe('placeholders and plurals', () => {
  it('translate fills named params and leaves unknown ones', () => {
    vi.spyOn(dictionaries.de, 'settings.language' as never, 'get').mockReturnValue('Hallo {name} {x}' as never)
    expect(translate('settings.language', { name: 'Welt' }, 'de')).toBe('Hallo Welt {x}')
    vi.restoreAllMocks()
  })

  it('translatePlural picks one/other by count', () => {
    const d = dictionaries.de as Record<string, string>
    d['t.sets_one'] = '{n} Satz'
    d['t.sets_other'] = '{n} Sätze'
    expect(translatePlural('t.sets' as never, 1, undefined, 'de')).toBe('1 Satz')
    expect(translatePlural('t.sets' as never, 3, undefined, 'de')).toBe('3 Sätze')
    delete d['t.sets_one']
    delete d['t.sets_other']
  })
})
