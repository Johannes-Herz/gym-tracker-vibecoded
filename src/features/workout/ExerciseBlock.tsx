import { initialValues } from './prefill'
import SetRow from './SetRow'
import { sets as setsRepo } from '../../storage/repo'
import { getState } from '../../storage/store'
import type { Exercise, WorkoutSet } from '../../types'

interface Props {
  workoutId: string
  exercise: Exercise
  sets: WorkoutSet[]
}

export default function ExerciseBlock({ workoutId, exercise, sets }: Props) {
  function addSet() {
    const values = initialValues(getState(), workoutId, exercise)
    setsRepo.add({ workoutId, exerciseId: exercise.id, ...values })
  }

  return (
    <section className="card">
      <h2 className="block-title">
        {exercise.name} <span className="muted small">{exercise.muscleGroup}</span>
      </h2>
      <div className="muted small set-row set-legend" aria-hidden="true">
        <span />
        <span>Gewicht (kg)</span>
        <span>Wdh.</span>
        <span />
      </div>
      {sets.map((s, i) => (
        <SetRow key={s.id} set={s} index={i} />
      ))}
      <button type="button" className="btn add-set" onClick={addSet}>
        + Satz
      </button>
    </section>
  )
}
