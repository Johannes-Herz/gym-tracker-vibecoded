import { useNavigate } from 'react-router-dom'
import { t, tp } from '../../i18n'
import { getState } from '../../storage/store'
import type { Template } from '../../types'
import { defaultStartFor, newWorkoutPath } from './newWorkout'
import { templateEntries } from './fromTemplate'
import { ACTIVE_ID, startTraining } from './training'

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
    if (!startTraining({ startedAt: defaultStartFor(dateKey), template, entries })) return
    navigate(`/verlauf/${ACTIVE_ID}`)
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="dialog" role="dialog" aria-modal="true" aria-label={t('start.title')} onClick={(e) => e.stopPropagation()}>
        <h2>{t('start.title')}</h2>
        <div className="start-options">
          <button type="button" className="btn btn-primary" onClick={() => navigate(newWorkoutPath(dateKey))}>
            {t('start.empty')}
          </button>
          {templates.map((tpl) => {
            const count = templateEntries(getState(), tpl).length
            return (
              <button key={tpl.id} type="button" className="btn start-template" disabled={count === 0} onClick={() => start(tpl)}>
                <span>{tpl.name}</span>
                <span className="muted small">{count === 0 ? t('common.noExercises') : tp('count.exercises', count)}</span>
              </button>
            )
          })}
        </div>
        <div className="dialog-actions">
          <button type="button" className="btn" onClick={onClose}>
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}
