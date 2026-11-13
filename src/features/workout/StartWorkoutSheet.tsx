import { useNavigate } from 'react-router-dom'
import { workouts } from '../../storage/repo'
import { getState } from '../../storage/store'
import type { Template } from '../../types'
import { defaultStartFor, newWorkoutPath } from './newWorkout'
import { templateEntries } from './fromTemplate'

interface Props {
  templates: Template[]
  /** Local day (YYYY-MM-DD) preset from the calendar, if any. */
  dateKey: string | null
  onClose: () => void
}

/** Choice after tapping "+": an empty workout or one of the templates. */
export default function StartWorkoutSheet({ templates, dateKey, onClose }: Props) {
  const navigate = useNavigate()

  function start(template: Template) {
    const entries = templateEntries(getState(), template)
    const workout = workouts.createFromTemplate(defaultStartFor(dateKey), template, entries)
    if (!workout) return
    navigate(`/verlauf/${workout.id}`)
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="dialog" role="dialog" aria-modal="true" aria-label="Training starten" onClick={(e) => e.stopPropagation()}>
        <h2>Training starten</h2>
        <div className="start-options">
          <button type="button" className="btn btn-primary" onClick={() => navigate(newWorkoutPath(dateKey))}>
            Leeres Training
          </button>
          {templates.map((t) => {
            const count = templateEntries(getState(), t).length
            return (
              <button key={t.id} type="button" className="btn start-template" disabled={count === 0} onClick={() => start(t)}>
                <span>{t.name}</span>
                <span className="muted small">{count === 0 ? 'Keine Übungen' : `${count} Übungen`}</span>
              </button>
            )
          })}
        </div>
        <div className="dialog-actions">
          <button type="button" className="btn" onClick={onClose}>
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  )
}
