import { describe, expect, it } from 'vitest'
import { exerciseOrder, moveExercise } from './exerciseOrder'

const s = (id: string, exerciseId: string, order: number) => ({ id, exerciseId, order })
const sets = [s('1', 'a', 0), s('2', 'b', 1), s('3', 'a', 2), s('4', 'c', 3)]

describe('exerciseOrder', () => {
  it('orders by first appearance', () => {
    expect(exerciseOrder(sets)).toEqual(['a', 'b', 'c'])
  })

  it('moves an exercise block down, keeping set order inside the block', () => {
    const m = moveExercise(sets, 'a', 1)!
    const next = sets.map((x) => ({ ...x, order: m.get(x.id)! }))
    expect(exerciseOrder(next)).toEqual(['b', 'a', 'c'])
    expect(next.filter((x) => x.exerciseId === 'a').sort((x, y) => x.order - y.order).map((x) => x.id)).toEqual(['1', '3'])
  })

  it('moves up and refuses moves past the ends', () => {
    const m = moveExercise(sets, 'c', -1)!
    expect(exerciseOrder(sets.map((x) => ({ ...x, order: m.get(x.id)! })))).toEqual(['a', 'c', 'b'])
    expect(moveExercise(sets, 'a', -1)).toBeNull()
    expect(moveExercise(sets, 'c', 1)).toBeNull()
  })
})
