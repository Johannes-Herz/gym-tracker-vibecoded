import { t } from '../../i18n'
import type { Exercise } from '../../types'
import ExerciseSearch from './ExerciseSearch'

interface Props {
  exercises: Exercise[]
  recentIds: string[]
  onPick: (exercise: Exercise) => void
  onClose: () => void
}

/** Full-screen exercise search for adding an exercise to a workout. Hidden exercises are left out. */
export default function ExerciseSearchSheet({ exercises, recentIds, onPick, onClose }: Props) {
  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label={t('ex.addTitle')}>
      <div className="sheet-head">
        <h2>{t('ex.addTitle')}</h2>
        <button type="button" className="btn" onClick={onClose}>
          {t('timer.close')}
        </button>
      </div>
      <div className="sheet-body">
        <ExerciseSearch
          exercises={exercises.filter((e) => !e.hidden)}
          recentIds={recentIds}
          onPick={onPick}
          allowCreate
          autoFocus
        />
      </div>
    </div>
  )
}
