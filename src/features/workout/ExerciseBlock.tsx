import { useState } from 'react'
import ConfirmDialog from '../../components/ConfirmDialog'
import { t } from '../../i18n'
import { muscleLabel } from '../../i18n/labels'
import { exerciseName } from '../exercises/exerciseName'
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
  const name = exerciseName(exercise)

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
          {name} <span className="muted small">{muscleLabel(exercise.muscleGroup)}</span>
        </h2>
        <div className="block-actions">
          <button
            type="button"
            className="btn"
            aria-label={t('block.moveUp', { name })}
            disabled={!canMoveUp}
            onClick={() => setsRepo.moveExercise(workoutId, exercise.id, -1)}
          >
            ↑
          </button>
          <button
            type="button"
            className="btn"
            aria-label={t('block.moveDown', { name })}
            disabled={!canMoveDown}
            onClick={() => setsRepo.moveExercise(workoutId, exercise.id, 1)}
          >
            ↓
          </button>
          <button
            type="button"
            className="btn btn-danger-text"
            aria-label={t('block.remove', { name })}
            onClick={() => (sets.every((s) => s.suggested) ? remove() : setRemoving(true))}
          >
            ✕
          </button>
        </div>
      </div>
      <div className={cardio ? 'muted small set-row cardio set-legend' : 'muted small set-row set-legend'} aria-hidden="true">
        <span />
        <span>{cardio ? t('block.duration') : bodyweight ? t('block.added') : t('block.weight')}</span>
        <span>{cardio ? t('block.distance') : t('block.reps')}</span>
        <span />
      </div>
      {sets.map((s, i) => (
        <SetRow key={s.id} set={s} index={i} cardio={cardio} bodyweight={bodyweight} />
      ))}
      <button type="button" className="btn add-set" onClick={addSet}>
        {cardio ? t('block.addEntry') : t('block.addSet')}
      </button>
      {removing && (
        <ConfirmDialog
          title={t('block.removeTitle')}
          confirmLabel={t('common.remove')}
          danger
          onConfirm={remove}
          onCancel={() => setRemoving(false)}
        >
          {t('block.removeText', { name })}
        </ConfirmDialog>
      )}
    </section>
  )
}
