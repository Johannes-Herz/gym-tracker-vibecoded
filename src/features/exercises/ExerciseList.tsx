import { MUSCLE_GROUPS, type Exercise } from '../../types'
import { byName } from './search'

interface Props {
  exercises: Exercise[]
  onEdit: (exercise: Exercise) => void
  onDelete: (exercise: Exercise) => void
  onToggleHidden: (exercise: Exercise) => void
}

function details(e: Exercise): string {
  return [e.aliasEn !== e.name ? e.aliasEn : undefined, e.equipment, e.source === 'custom' ? e.category : undefined]
    .filter(Boolean)
    .join(' · ')
}

export default function ExerciseList({ exercises, onEdit, onDelete, onToggleHidden }: Props) {
  return (
    <>
      {MUSCLE_GROUPS.map((group) => {
        const items = exercises.filter((e) => e.muscleGroup === group).sort(byName)
        if (items.length === 0) return null
        return (
          <section key={group}>
            <h2 className="group-title">{group}</h2>
            <ul className="list">
              {items.map((e) => (
                <li key={e.id} className={e.hidden ? 'list-item is-hidden' : 'list-item'}>
                  <div className="grow">
                    <div>
                      {e.name}
                      {e.source === 'builtin' && <span className="badge">Standard</span>}
                    </div>
                    {details(e) && <div className="muted small">{details(e)}</div>}
                  </div>
                  {e.source === 'builtin' ? (
                    <button type="button" className="btn" onClick={() => onToggleHidden(e)}>
                      {e.hidden ? 'Einblenden' : 'Ausblenden'}
                    </button>
                  ) : (
                    <>
                      <button type="button" className="btn" onClick={() => onEdit(e)}>
                        Bearbeiten
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger-text"
                        aria-label={`${e.name} löschen`}
                        onClick={() => onDelete(e)}
                      >
                        ✕
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </>
  )
}
