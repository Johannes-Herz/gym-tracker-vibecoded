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
    expect(names(r)).toContain('Langhantel-Bankdrücken')
    expect(names(searchSections(all, { query: 'kniebeu' }))).toEqual([
      'Bulgarian Split Squat', // alias "Bulgarische Kniebeuge"
      'Frontkniebeuge',
      'Kniebeuge',
    ])
  })

  it('finds the SZ-Stange exercises by German name, English name and aliases', () => {
    const has = (q: string, name: string) => expect(names(searchSections(all, { query: q }))).toContain(name)
    has('sz-curls', 'SZ-Curls')
    has('ez curl', 'SZ-Curls')
    has('EZ-Bar', 'SZ-Curls')
    has('stirndrücken', 'French Press')
    has('skull crusher', 'French Press')
    has('skullcrusher', 'French Press')
    has('scottcurls', 'Scott-Curls')
    has('preacher', 'Scott-Curls')
    has('upright row', 'Aufrechtes Rudern')
    has('reverse curls', 'SZ-Reverse-Curls')
    has('trizepsdrücken über kopf', 'Überkopf-Trizepsstrecken (SZ)')
    expect(names(searchSections(all, { query: 'ez' }))).toEqual(expect.arrayContaining(['SZ-Curls', 'French Press']))
  })

  it('still finds renamed exercises by their old names', () => {
    expect(names(searchSections(all, { query: 'Langhantelrudern' }))).toContain('Langhantel-Rudern')
    expect(names(searchSections(all, { query: 'rudern am kabel' }))).toContain('Kabel-Rudern')
    expect(names(searchSections(all, { query: 'latzug' }))).toContain('Latziehen')
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
    expect(names(searchSections(visible, { query: 'kniebeuge' }))).toEqual(['Bulgarian Split Squat', 'Frontkniebeuge'])
  })
})
