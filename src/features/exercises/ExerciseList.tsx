import { t } from '../../i18n'
import { equipmentLabel, muscleLabel } from '../../i18n/labels'
import { MUSCLE_GROUPS, type Exercise } from '../../types'
import { exerciseName, otherName } from './exerciseName'
import { byName } from './search'

interface Props {
  exercises: Exercise[]
  onEdit: (exercise: Exercise) => void
  onDelete: (exercise: Exercise) => void
  onToggleHidden: (exercise: Exercise) => void
}

function details(e: Exercise): string {
  return [otherName(e), e.equipment ? equipmentLabel(e.equipment) : undefined, e.source === 'custom' ? e.category : undefined]
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
            <h2 className="group-title">{muscleLabel(group)}</h2>
            <ul className="list">
              {items.map((e) => (
                <li key={e.id} className={e.hidden ? 'list-item is-hidden' : 'list-item'}>
                  <div className="grow">
                    <div>
                      {exerciseName(e)}
                      {e.source === 'builtin' && <span className="badge">{t('ex.badge')}</span>}
                    </div>
                    {details(e) && <div className="muted small">{details(e)}</div>}
                  </div>
                  {e.source === 'builtin' ? (
                    <button type="button" className="btn" onClick={() => onToggleHidden(e)}>
                      {e.hidden ? t('ex.show') : t('ex.hide')}
                    </button>
                  ) : (
                    <>
                      <button type="button" className="btn" onClick={() => onEdit(e)}>
                        {t('ex.edit')}
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger-text"
                        aria-label={t('ex.deleteLabel', { name: exerciseName(e) })}
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
