import { useState } from 'react'
import { t } from '../../i18n'
import { muscleLabel } from '../../i18n/labels'
import { exercises as repo, type ExerciseInput } from '../../storage/repo'
import { MUSCLE_GROUPS, type Exercise, type MuscleGroup } from '../../types'
import ExerciseForm from './ExerciseForm'
import { exerciseName, otherName } from './exerciseName'
import { searchSections } from './search'

interface Props {
  exercises: Exercise[]
  recentIds?: string[]
  onPick: (exercise: Exercise) => void
  /** Offer to create a custom exercise (named like the query) when nothing matches. */
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
          placeholder={t('ex.searchPlaceholder')}
          aria-label={t('ex.search')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus={autoFocus}
          enterKeyHint="search"
        />
      </div>
      <div className="chips" role="group" aria-label={t('ex.muscleGroup')}>
        {([null, ...MUSCLE_GROUPS] as const).map((g) => (
          <button
            key={g ?? 'all'}
            type="button"
            className={group === g ? 'chip active' : 'chip'}
            aria-pressed={group === g}
            onClick={() => setGroup(g)}
          >
            {g ? muscleLabel(g) : t('ex.all')}
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
                    {exerciseName(e)}
                    {otherName(e) && <span className="muted small"> · {otherName(e)}</span>}
                  </span>
                  <span className="muted small">{muscleLabel(e.muscleGroup)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {sections.length === 0 && (
        <div className="search-empty">
          <p className="muted">{t('ex.notFound')}</p>
          {allowCreate && term && (
            <button type="button" className="btn btn-primary wide" onClick={() => setCreating(true)}>
              {t('ex.create', { term })}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
