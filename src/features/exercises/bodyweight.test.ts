import { describe, expect, it } from 'vitest'
import { BUILTIN_EXERCISES } from '../../data/builtinExercises'
import { formatLoad, formatSet, isBodyweight } from './bodyweight'

describe('isBodyweight', () => {
  it('marks built-ins with equipment Körpergewicht, but not cardio', () => {
    const bw = BUILTIN_EXERCISES.filter(isBodyweight).map((e) => e.name)
    expect(bw).toEqual(
      expect.arrayContaining(['Klimmzüge', 'Dips', 'Liegestütze', 'Rückenstrecker', 'Crunches', 'Ab Wheel']),
    )
    expect(bw).not.toContain('Seilspringen')
    expect(bw).not.toContain('Bankdrücken')
  })

  it('works for custom exercises via equipment', () => {
    expect(isBodyweight({ muscleGroup: 'Beine', equipment: 'Körpergewicht' })).toBe(true)
    expect(isBodyweight({ muscleGroup: 'Beine', equipment: undefined })).toBe(false)
  })
})

describe('formatLoad / formatSet', () => {
  it('never shows 0 kg for bodyweight', () => {
    expect(formatLoad(0, true)).toBe('KG')
    expect(formatSet(0, 12, true)).toBe('KG×12')
  })

  it('shows added and assisted weight', () => {
    expect(formatLoad(10, true)).toBe('KG + 10 kg')
    expect(formatLoad(-20, true)).toBe('KG − 20 kg')
    expect(formatSet(2.5, 8, true)).toBe('KG+2,5×8')
    expect(formatSet(-20, 6, true)).toBe('KG−20×6')
  })

  it('formats plain strength sets', () => {
    expect(formatLoad(82.5, false)).toBe('82,5 kg')
    expect(formatSet(82.5, 5, false)).toBe('82,5×5')
    expect(formatLoad(0, false)).toBe('0 kg')
  })
})
