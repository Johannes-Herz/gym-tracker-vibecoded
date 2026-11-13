import { describe, expect, it } from 'vitest'
import { emptyData } from '../../storage/storage'
import { searchSections } from './search'

const all = emptyData().exercises
const names = (sections: ReturnType<typeof searchSections>) => sections.flatMap((s) => s.items.map((e) => e.name))

describe('searchSections', () => {
  it('matches German and English names case-insensitively in one flat section', () => {
    const r = searchSections(all, { query: 'BENCH' })
    expect(r).toHaveLength(1)
    expect(r[0].title).toBeNull()
    expect(names(r)).toContain('Bankdrücken')
    expect(names(searchSections(all, { query: 'kniebeu' }))).toEqual(['Frontkniebeuge', 'Kniebeuge'])
  })

  it('returns nothing when nothing matches (caller offers create)', () => {
    expect(searchSections(all, { query: 'xyz' })).toEqual([])
  })

  it('without a query: recently used first, then groups including Cardio', () => {
    const r = searchSections(all, { query: '', recentIds: ['builtin-squat', 'gone', 'builtin-bench-press'] })
    expect(r[0]).toMatchObject({ title: 'Zuletzt verwendet' })
    expect(r[0].items.map((e) => e.id)).toEqual(['builtin-squat', 'builtin-bench-press'])
    expect(r.map((s) => s.title)).toContain('Cardio')
  })

  it('narrows to the selected muscle group chip', () => {
    const r = searchSections(all, { query: '', group: 'Cardio', recentIds: ['builtin-squat'] })
    expect(r.map((s) => s.title)).toEqual(['Cardio'])
    expect(names(searchSections(all, { query: 'press', group: 'Beine' }))).toEqual(['Beinpresse'])
  })

  it('only lists what the caller passes (hidden are filtered by the caller)', () => {
    const visible = all.filter((e) => e.id !== 'builtin-squat')
    expect(names(searchSections(visible, { query: 'kniebeuge' }))).toEqual(['Frontkniebeuge'])
  })
})
