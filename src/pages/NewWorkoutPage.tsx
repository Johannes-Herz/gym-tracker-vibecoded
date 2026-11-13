import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import BackToHistory from '../components/BackToHistory'
import PageHeader from '../components/PageHeader'
import ExercisePicker from '../features/workout/ExercisePicker'
import { defaultStartFor } from '../features/workout/newWorkout'
import { prefillFor } from '../features/workout/prefill'
import { recentExerciseIds } from '../features/workout/recent'
import { fromLocalInput, toLocalInput } from '../lib/format'
import { workouts } from '../storage/repo'
import { getState, useStore } from '../storage/store'
import type { Exercise } from '../types'

/** Draft for a new workout: nothing is saved until the first exercise is picked. */
export default function NewWorkoutPage() {
  const data = useStore()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [startedAt, setStartedAt] = useState(() => defaultStartFor(params.get('datum')))
  const [picking, setPicking] = useState(false)

  function addFirstExercise(exercise: Exercise) {
    const values = prefillFor(getState(), '', exercise.id) ?? { weight: 0, reps: 0 }
    const workout = workouts.createWithFirstExercise(startedAt, exercise.id, values)
    navigate(`/verlauf/${workout.id}`, { replace: true })
  }

  return (
    <>
      <PageHeader title="Neues Training" action={<BackToHistory />} />
      <div className="card form">
        <label>
          Datum und Uhrzeit
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
        + Übung hinzufügen
      </button>
      <p className="muted small">Das Training wird gespeichert, sobald du die erste Übung hinzufügst.</p>
      {picking && (
        <ExercisePicker
          exercises={data.exercises}
          recentIds={recentExerciseIds(data)}
          onPick={addFirstExercise}
          onClose={() => setPicking(false)}
        />
      )}
    </>
  )
}
