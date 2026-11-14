import { useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import BackToHistory from '../components/BackToHistory'
import { t } from '../i18n'
import PageHeader from '../components/PageHeader'
import ExerciseSearchSheet from '../features/exercises/ExerciseSearchSheet'
import { defaultStartFor } from '../features/workout/newWorkout'
import { initialValues } from '../features/workout/prefill'
import { recentExerciseIds } from '../features/workout/recent'
import { ACTIVE_ID, startTraining } from '../features/workout/training'
import { fromLocalInput, toLocalInput } from '../lib/format'
import { useSession } from '../storage/session'
import { getState, useStore } from '../storage/store'
import type { Exercise } from '../types'

/** Draft for a new workout: picking the first exercise starts the training session (nothing is saved to history yet). */
export default function NewWorkoutPage() {
  const data = useStore()
  const session = useSession()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [startedAt, setStartedAt] = useState(() => defaultStartFor(params.get('datum')))
  const [picking, setPicking] = useState(false)

  function addFirstExercise(exercise: Exercise) {
    const values = initialValues(getState(), '', exercise)
    startTraining({ startedAt, entries: [{ exerciseId: exercise.id, sets: [values] }] })
    navigate(`/verlauf/${ACTIVE_ID}`, { replace: true })
  }

  // Never replace a running training from here: continue it instead.
  if (session) return <Navigate to={`/verlauf/${ACTIVE_ID}`} replace />

  return (
    <>
      <PageHeader title={t('new.title')} action={<BackToHistory />} />
      <div className="card form">
        <label>
          {t('workout.date')}
          <input
            type="datetime-local"
            value={toLocalInput(startedAt)}
            onChange={(e) => {
              const iso = fromLocalInput(e.target.value)
              if (iso) setStartedAt(iso)
            }}
          />
        </label>
      </div>
      <button type="button" className="btn btn-primary wide" onClick={() => setPicking(true)}>
        {t('workout.addExercise')}
      </button>
      <p className="muted small">{t('new.hint')}</p>
      {picking && (
        <ExerciseSearchSheet
          exercises={data.exercises}
          recentIds={recentExerciseIds(data)}
          onPick={addFirstExercise}
          onClose={() => setPicking(false)}
        />
      )}
    </>
  )
}
