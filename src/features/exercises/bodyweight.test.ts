import { describe, expect, it } from 'vitest'
import { BUILTIN_EXERCISES } from '../../data/builtinExercises'
import { formatLoad, formatLoadLong, formatSet, isBodyweight } from './bodyweight'

describe('isBodyweight', () => {
  it('marks built-ins with equipment Körpergewicht, but not cardio', () => {
    const bw = BUILTIN_EXERCISES.filter(isBodyweight).map((e) => e.name)
    expect(bw).toEqual(
      expect.arrayContaining(['Klimmzüge', 'Dips', 'Liegestütze', 'Rückenstrecker', 'Crunches', 'Ab-Wheel']),
    )
    expect(bw).not.toContain('Seilspringen')
    expect(bw).not.toContain('Langhantel-Bankdrücken')
  })

  it('works for custom exercises via equipment', () => {
    expect(isBodyweight({ muscleGroup: 'Beine', equipment: 'Körpergewicht' })).toBe(true)
    expect(isBodyweight({ muscleGroup: 'Beine', equipment: undefined })).toBe(false)
  })
})

describe('formatLoad / formatSet', () => {
  it('labels pure bodyweight as BW, never 0 kg or KG', () => {
    expect(formatLoad(0, true)).toBe('BW')
    expect(formatSet(0, 12, true)).toBe('BW × 12')
  })

  it('shows added and assisted weight with unit', () => {
    expect(formatLoad(10, true)).toBe('+10 kg')
    expect(formatLoad(12.5, true)).toBe('+12,5 kg')
    expect(formatLoad(-20, true)).toBe('−20 kg')
    expect(formatSet(2.5, 8, true)).toBe('+2,5 kg × 8')
    expect(formatSet(-20, 6, true)).toBe('−20 kg × 6')
  })

  it('spells out the long form', () => {
    expect(formatLoadLong(0)).toBe('Körpergewicht')
    expect(formatLoadLong(5)).toBe('Körpergewicht + 5 kg')
    expect(formatLoadLong(-20)).toBe('Körpergewicht − 20 kg')
  })

  it('formats plain strength sets', () => {
    expect(formatLoad(82.5, false)).toBe('82,5 kg')
    expect(formatSet(82.5, 5, false)).toBe('82,5 kg × 5')
    expect(formatLoad(0, false)).toBe('0 kg')
  })
})
