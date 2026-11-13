import { useState } from 'react'
import ConfirmDialog from '../../components/ConfirmDialog'
import { initialValues } from './prefill'
import SetRow from './SetRow'
import { isBodyweight } from '../exercises/bodyweight'
import { sets as setsRepo } from '../../storage/repo'
import { getState } from '../../storage/store'
import { isCardio, type Exercise, type WorkoutSet } from '../../types'

interface Props {
  workoutId: string
  exercise: Exercise
  sets: WorkoutSet[]
  canMoveUp: boolean
  canMoveDown: boolean
}

export default function ExerciseBlock({ workoutId, exercise, sets, canMoveUp, canMoveDown }: Props) {
  const [removing, setRemoving] = useState(false)
  const cardio = isCardio(exercise)
  const bodyweight = isBodyweight(exercise)

  function addSet() {
    const values = initialValues(getState(), workoutId, exercise)
    setsRepo.add({ workoutId, exerciseId: exercise.id, ...values, suggested: true })
  }

  function remove() {
    setRemoving(false)
    setsRepo.removeExercise(workoutId, exercise.id)
  }

  return (
    <section className="card exercise-block">
      <div className="block-head">
        <h2 className="block-title">
          {exercise.name} <span className="muted small">{exercise.muscleGroup}</span>
        </h2>
        <div className="block-actions">
          <button
            type="button"
            className="btn"
            aria-label={`${exercise.name} nach oben`}
            disabled={!canMoveUp}
            onClick={() => setsRepo.moveExercise(workoutId, exercise.id, -1)}
          >
            ↑
          </button>
          <button
            type="button"
            className="btn"
            aria-label={`${exercise.name} nach unten`}
            disabled={!canMoveDown}
            onClick={() => setsRepo.moveExercise(workoutId, exercise.id, 1)}
          >
            ↓
          </button>
          <button
            type="button"
            className="btn btn-danger-text"
            aria-label={`${exercise.name} entfernen`}
            onClick={() => (sets.every((s) => s.suggested) ? remove() : setRemoving(true))}
          >
            ✕
          </button>
        </div>
      </div>
      <div className={cardio ? 'muted small set-row cardio set-legend' : 'muted small set-row set-legend'} aria-hidden="true">
        <span />
        <span>{cardio ? 'Dauer (min)' : bodyweight ? 'Zusatz (kg)' : 'Gewicht (kg)'}</span>
        <span>{cardio ? 'Distanz (km)' : 'Wdh.'}</span>
        <span />
      </div>
      {sets.map((s, i) => (
        <SetRow key={s.id} set={s} index={i} cardio={cardio} bodyweight={bodyweight} />
      ))}
      <button type="button" className="btn add-set" onClick={addSet}>
        {cardio ? '+ Eintrag' : '+ Satz'}
      </button>
      {removing && (
        <ConfirmDialog
          title="Übung entfernen?"
          confirmLabel="Entfernen"
          danger
          onConfirm={remove}
          onCancel={() => setRemoving(false)}
        >
          „{exercise.name}“ und alle Sätze dieser Übung werden aus dem Training entfernt.
        </ConfirmDialog>
      )}
    </section>
  )
}
