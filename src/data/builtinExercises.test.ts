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
    expect(BUILTIN_EXERCISES).toHaveLength(62)
  })
})
