import { describe, expect, it } from 'vitest'
import { EQUIPMENT, MUSCLE_GROUPS } from '../types'
import { BUILTIN_EXERCISES } from './builtinExercises'

describe('built-in exercise catalog', () => {
  it('has unique ids with the builtin- prefix', () => {
    const ids = BUILTIN_EXERCISES.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.every((id) => /^builtin-[a-z0-9-]+$/.test(id))).toBe(true)
  })

  it('has unique names (case-insensitive)', () => {
    const names = BUILTIN_EXERCISES.map((e) => e.name.toLowerCase())
    expect(new Set(names).size).toBe(names.length)
  })

  it('uses valid muscle groups and equipment and covers every group', () => {
    for (const e of BUILTIN_EXERCISES) {
      expect(MUSCLE_GROUPS).toContain(e.muscleGroup)
      expect(EQUIPMENT).toContain(e.equipment)
    }
    for (const g of MUSCLE_GROUPS) {
      expect(BUILTIN_EXERCISES.some((e) => e.muscleGroup === g)).toBe(true)
    }
    expect(BUILTIN_EXERCISES).toHaveLength(70)
  })

  it('keeps the ids of renamed exercises stable and lists old names as aliases', () => {
    const byId = new Map(BUILTIN_EXERCISES.map((e) => [e.id, e]))
    expect(byId.get('builtin-bench-press')?.name).toBe('Langhantel-Bankdrücken')
    expect(byId.get('builtin-bench-press')?.aliases).toContain('Bankdrücken')
    expect(byId.get('builtin-barbell-row')?.aliases).toContain('Langhantelrudern')
    expect(byId.get('builtin-seated-cable-row')?.aliases).toContain('Rudern am Kabel')
  })

  it('has the SZ-Stange exercises, incl. converted French Press and Scott-Curls', () => {
    const sz = BUILTIN_EXERCISES.filter((e) => e.equipment === 'SZ-Stange')
    expect(sz).toHaveLength(10)
    expect(sz.map((e) => e.id)).toEqual(
      expect.arrayContaining(['builtin-skull-crusher', 'builtin-preacher-curl', 'builtin-ez-curl']),
    )
  })

  it('has no redundant aliases (same as name or English alias, or repeated)', () => {
    for (const e of BUILTIN_EXERCISES) {
      const aliases = e.aliases.map((s) => s.toLowerCase())
      expect(new Set(aliases).size).toBe(aliases.length)
      expect(aliases).not.toContain(e.name.toLowerCase())
      expect(aliases).not.toContain(e.aliasEn.toLowerCase())
    }
  })
})
