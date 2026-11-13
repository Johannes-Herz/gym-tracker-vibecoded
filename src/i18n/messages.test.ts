import { afterEach, describe, expect, it } from 'vitest'
import { buildDemoData } from '../demo/demoData'
import { formatLoadLong } from '../features/exercises/bodyweight'
import { parseImport } from '../storage/backup'
import { emptyData } from '../storage/storage'
import { setLang } from './index'

afterEach(() => setLang('de'))

describe('messages outside components follow the language', () => {
  it('import errors', () => {
    expect(parseImport('{nope')).toEqual({ ok: false, error: 'Die Datei ist keine gültige JSON-Datei.' })
    setLang('en')
    expect(parseImport('{nope')).toEqual({ ok: false, error: 'The file is not valid JSON.' })
    expect(parseImport('{"app":"other"}')).toEqual({ ok: false, error: 'The file is not a Gym Tracker backup.' })
  })

  it('long bodyweight label', () => {
    expect(formatLoadLong(5)).toBe('Körpergewicht + 5 kg')
    setLang('en')
    expect(formatLoadLong(5)).toBe('Bodyweight + 5 kg')
    expect(formatLoadLong(-20)).toBe('Bodyweight − 20 kg')
  })

  it('demo data is created in the current language and then stays as created', () => {
    const builtins = emptyData().exercises.filter((e) => e.source === 'builtin')
    const de = buildDemoData({ builtins })
    expect(de.templates.map((t) => t.name)).toEqual(['Push Tag', 'Pull Tag', 'Beine'])
    setLang('en')
    const en = buildDemoData({ builtins })
    expect(en.templates.map((t) => t.name)).toEqual(['Push Day', 'Pull Day', 'Legs'])
    // Switching the language later does not rename user content.
    setLang('de')
    expect(en.templates.map((t) => t.name)).toEqual(['Push Day', 'Pull Day', 'Legs'])
  })
})
