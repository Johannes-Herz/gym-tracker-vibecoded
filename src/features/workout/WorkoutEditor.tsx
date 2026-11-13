import { useState } from 'react'
import { fromLocalInput, toLocalInput } from '../../lib/format'
import { sets as setsRepo, workouts } from '../../storage/repo'
import { getState, useStore } from '../../storage/store'
import type { Exercise, WorkoutSet } from '../../types'
import ExerciseBlock from './ExerciseBlock'
import ExercisePicker from './ExercisePicker'
import { prefillFor } from './prefill'
import { recentExerciseIds } from './recent'

export default function WorkoutEditor({ workoutId }: { workoutId: string }) {
  const data = useStore()
  const [picking, setPicking] = useState(false)

  const workout = data.workouts.find((w) => w.id === workoutId)
  if (!workout) return <p className="muted">Training nicht gefunden.</p>

  // Exercises in order of first appearance within this workout.
  const workoutSets = data.sets.filter((s) => s.workoutId === workoutId).sort((a, b) => a.order - b.order)
  const groups = new Map<string, WorkoutSet[]>()
  for (const s of workoutSets) groups.set(s.exerciseId, [...(groups.get(s.exerciseId) ?? []), s])

  function addExercise(exercise: Exercise) {
    setPicking(false)
    const values = prefillFor(getState(), workoutId, exercise.id) ?? { weight: 0, reps: 0 }
    setsRepo.add({ workoutId, exerciseId: exercise.id, ...values })
  }

  return (
    <>
      <div className="card form">
        <label>
          Datum und Uhrzeit
          <input
            type="datetime-local"
            value={toLocalInput(workout.startedAt)}
            onChange={(e) => {
              const iso = fromLocalInput(e.target.value)
              if (iso) workouts.update(workoutId, { startedAt: iso })
            }}
          />
        </label>
      </div>

      {[...groups.entries()].map(([exerciseId, sets]) => {
        const exercise = data.exercises.find((e) => e.id === exerciseId)
        if (!exercise) return null
        return <ExerciseBlock key={exerciseId} workoutId={workoutId} exercise={exercise} sets={sets} />
      })}

      <button type="button" className="btn btn-primary wide" onClick={() => setPicking(true)}>
        + Übung hinzufügen
      </button>

      <div className="card form note">
        <label>
          Notiz
          <textarea
            rows={2}
            value={workout.note ?? ''}
            onChange={(e) => workouts.update(workoutId, { note: e.target.value })}
          />
        </label>
      </div>

      {picking && (
        <ExercisePicker
          exercises={data.exercises}
          recentIds={recentExerciseIds(data)}
          onPick={addExercise}
          onClose={() => setPicking(false)}
        />
      )}
    </>
  )
}
