import { useState } from 'react'
import { exercises as repo, type ExerciseInput } from '../../storage/repo'
import { MUSCLE_GROUPS, type Exercise, type MuscleGroup } from '../../types'
import ExerciseForm from './ExerciseForm'
import { searchSections } from './search'

interface Props {
  exercises: Exercise[]
  recentIds?: string[]
  onPick: (exercise: Exercise) => void
  /** Offer "Übung „…“ erstellen" when nothing matches. */
  allowCreate?: boolean
  autoFocus?: boolean
}

export default function ExerciseSearch({ exercises, recentIds, onPick, allowCreate = false, autoFocus = false }: Props) {
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState<MuscleGroup | null>(null)
  const [creating, setCreating] = useState(false)

  const sections = searchSections(exercises, { query, group, recentIds })
  const term = query.trim()

  function create(input: ExerciseInput) {
    onPick(repo.add(input))
  }

  if (creating) {
    const categories = [...new Set(exercises.map((e) => e.category).filter(Boolean))].sort()
    return (
      <ExerciseForm
        initial={{ name: term, muscleGroup: group ?? MUSCLE_GROUPS[0], category: '' }}
        categories={categories}
        onSubmit={create}
        onCancel={() => setCreating(false)}
      />
    )
  }

  return (
    <div className="exercise-search">
      <div className="form">
        <input
          type="search"
          placeholder="Übung suchen (auch englisch)…"
          aria-label="Übung suchen"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus={autoFocus}
          enterKeyHint="search"
        />
      </div>
      <div className="chips" role="group" aria-label="Muskelgruppe">
        {([null, ...MUSCLE_GROUPS] as const).map((g) => (
          <button
            key={g ?? 'all'}
            type="button"
            className={group === g ? 'chip active' : 'chip'}
            aria-pressed={group === g}
            onClick={() => setGroup(g)}
          >
            {g ?? 'Alle'}
          </button>
        ))}
      </div>

      {sections.map((s) => (
        <section key={s.title ?? 'results'}>
          {s.title && <h3 className="group-title">{s.title}</h3>}
          <ul className="list">
            {s.items.map((e) => (
              <li key={e.id}>
                <button type="button" className="btn picker-item" onClick={() => onPick(e)}>
                  <span>
                    {e.name}
                    {e.aliasEn && e.aliasEn !== e.name && <span className="muted small"> · {e.aliasEn}</span>}
                  </span>
                  <span className="muted small">{e.muscleGroup}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {sections.length === 0 && (
        <div className="search-empty">
          <p className="muted">Nichts gefunden.</p>
          {allowCreate && term && (
            <button type="button" className="btn btn-primary wide" onClick={() => setCreating(true)}>
              Übung „{term}“ erstellen
            </button>
          )}
        </div>
      )}
    </div>
  )
}
