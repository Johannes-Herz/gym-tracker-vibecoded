import { afterEach, describe, expect, it } from 'vitest'
import { BUILTIN_EXERCISES } from '../../data/builtinExercises'
import { setLang } from '../../i18n'
import { equipmentLabel, muscleLabel } from '../../i18n/labels'
import { emptyData } from '../../storage/storage'
import type { Exercise } from '../../types'
import { byDisplayName, exerciseName, otherName } from './exerciseName'
import { searchSections } from './search'

afterEach(() => setLang('de'))

const all = emptyData().exercises
const bench = all.find((e) => e.id === 'builtin-bench-press')!
const custom: Exercise = { id: 'c1', name: 'Meine Übung', muscleGroup: 'Brust', category: '', createdAt: '2026-01-01T00:00:00.000Z', source: 'custom' }
const found = (q: string) => searchSections(all, { query: q }).flatMap((s) => s.items.map((e) => e.id))

describe('exercise names', () => {
  it('built-ins switch language, looked up by the stored fields (ids and stored names untouched)', () => {
    expect(exerciseName(bench)).toBe('Langhantel-Bankdrücken')
    setLang('en')
    expect(exerciseName(bench)).toBe('Barbell Bench Press')
    expect(bench.id).toBe('builtin-bench-press')
    expect(bench.name).toBe('Langhantel-Bankdrücken')
  })

  it('custom exercises never change', () => {
    setLang('en')
    expect(exerciseName(custom)).toBe('Meine Übung')
    expect(otherName(custom)).toBeUndefined()
    // Even if a custom exercise is named like a built-in.
    expect(exerciseName({ ...custom, name: 'Bankdrücken' })).toBe('Bankdrücken')
  })

  it('shows the name of the other language as a hint', () => {
    expect(otherName(bench)).toBe('Barbell Bench Press')
    setLang('en')
    expect(otherName(bench)).toBe('Langhantel-Bankdrücken')
  })

  it('every built-in has a distinct English name', () => {
    const names = BUILTIN_EXERCISES.map((e) => e.aliasEn.toLowerCase())
    expect(new Set(names).size).toBe(names.length)
  })

  it('sorts by the display name of the UI language', () => {
    const a = all.find((e) => e.id === 'builtin-squat')! // Kniebeuge / Barbell Squat
    const b = all.find((e) => e.id === 'builtin-bench-press')! // Langhantel-Bankdrücken / Barbell Bench Press
    expect(byDisplayName(a, b)).toBeLessThan(0) // K < L
    setLang('en')
    expect(byDisplayName(a, b)).toBeGreaterThan(0) // Barbell S… > Barbell B…
  })
})

describe('labels', () => {
  it('translate stored muscle group and equipment values, unknown ones pass through', () => {
    expect(muscleLabel('Brust')).toBe('Brust')
    expect(equipmentLabel('Körpergewicht')).toBe('Körpergewicht')
    setLang('en')
    expect(muscleLabel('Brust')).toBe('Chest')
    expect(equipmentLabel('SZ-Stange')).toBe('EZ bar')
    expect(muscleLabel('Selbst gemacht')).toBe('Selbst gemacht')
  })
})

describe('search finds built-ins in both languages whatever the UI language', () => {
  it.each(['de', 'en'] as const)('UI language %s', (lang) => {
    setLang(lang)
    expect(found('bankdrücken')).toContain('builtin-bench-press')
    expect(found('barbell bench')).toContain('builtin-bench-press')
    expect(found('skull crusher')).toContain('builtin-skull-crusher')
    expect(found('french press')).toContain('builtin-skull-crusher')
    expect(found('chest')).toContain('builtin-bench-press') // muscle group, English
    expect(found('brust')).toContain('builtin-bench-press') // muscle group, German
    expect(found('ez bar')).toContain('builtin-ez-curl')
  })
})
