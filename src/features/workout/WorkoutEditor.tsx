import { useState } from 'react'
import ConfirmDialog from '../../components/ConfirmDialog'
import { t } from '../../i18n'
import { exerciseOrder } from '../../lib/exerciseOrder'
import { fromLocalInput, toLocalInput } from '../../lib/format'
import { templates } from '../../storage/repo'
import { useStore } from '../../storage/store'
import type { Exercise } from '../../types'
import ExerciseBlock from './ExerciseBlock'
import ExerciseSearchSheet from '../exercises/ExerciseSearchSheet'
import RestTimer from '../timer/RestTimer'
import { recentExerciseIds } from './recent'
import { addExercise as addExerciseTo, setNote, setStartedAt, useTraining, type EditorSet, type Scope } from './training'

/** Editor for the active training session (`scope` null) or a past workout (`scope` = its id). */
export default function WorkoutEditor({ scope }: { scope: Scope }) {
  const data = useStore()
  const { sets: workoutSets, meta } = useTraining(scope)
  const [picking, setPicking] = useState(false)
  const [namingTemplate, setNamingTemplate] = useState<string | null>(null)
  const [savedAs, setSavedAs] = useState<string | null>(null)
  const [overwriting, setOverwriting] = useState<string | null>(null)

  if (!meta) return <p className="muted">{t('workout.notFound')}</p>

  // Exercises in order of first appearance within this workout (confirmed sets and suggestions together).
  const groups = new Map<string, EditorSet[]>()
  for (const s of workoutSets) groups.set(s.exerciseId, [...(groups.get(s.exerciseId) ?? []), s])
  const orderIds = [...groups.keys()]

  function writeTemplate(name: string) {
    templates.save(name, exerciseOrder(workoutSets))
    setNamingTemplate(null)
    setOverwriting(null)
    setSavedAs(name)
  }

  function saveAsTemplate() {
    const name = (namingTemplate ?? '').trim()
    if (!name) return
    // The name identifies a template: ask before replacing an existing one.
    if (templates.findByName(name)) setOverwriting(name)
    else writeTemplate(name)
  }

  function addExercise(exercise: Exercise) {
    setPicking(false)
    addExerciseTo(scope, exercise)
  }

  return (
    <>
      <RestTimer />
      <div className="card form">
        <label>
          {t('workout.date')}
          <input
            type="datetime-local"
            value={toLocalInput(meta.startedAt)}
            onChange={(e) => {
              const iso = fromLocalInput(e.target.value)
              if (iso) setStartedAt(scope, iso)
            }}
          />
        </label>
        {meta.templateName && <p className="muted small">{t('workout.template', { name: meta.templateName })}</p>}
      </div>

      {[...groups.entries()].map(([exerciseId, sets], i) => {
        const exercise = data.exercises.find((e) => e.id === exerciseId)
        if (!exercise) return null
        return (
          <ExerciseBlock
            key={exerciseId}
            scope={scope}
            exercise={exercise}
            sets={sets}
            canMoveUp={i > 0}
            canMoveDown={i < orderIds.length - 1}
          />
        )
      })}

      <button type="button" className="btn btn-primary wide" onClick={() => setPicking(true)}>
        {t('workout.addExercise')}
      </button>

      <button
        type="button"
        className="btn wide"
        disabled={groups.size === 0}
        onClick={() => setNamingTemplate(meta.templateName ?? '')}
      >
        {t('workout.saveAsTemplate')}
      </button>
      {savedAs && <p className="muted small">{t('workout.templateSaved', { name: savedAs })}</p>}

      <div className="card form note">
        <label>
          {t('workout.note')}
          <textarea
            rows={2}
            value={meta.note ?? ''}
            onChange={(e) => setNote(scope, e.target.value)}
          />
        </label>
      </div>

      {namingTemplate !== null && (
        <ConfirmDialog
          title={t('workout.saveAsTemplate')}
          confirmLabel={t('common.save')}
          onConfirm={saveAsTemplate}
          onCancel={() => setNamingTemplate(null)}
        >
          <div className="form">
            <label>
              {t('workout.templateName')}
              <input
                autoFocus
                value={namingTemplate}
                maxLength={60}
                placeholder={t('workout.templateNamePlaceholder')}
                onChange={(e) => setNamingTemplate(e.target.value)}
              />
            </label>
          </div>
        </ConfirmDialog>
      )}

      {overwriting !== null && (
        <ConfirmDialog
          title={t('workout.overwriteTitle')}
          confirmLabel={t('workout.overwriteConfirm')}
          danger
          onConfirm={() => writeTemplate(overwriting)}
          onCancel={() => setOverwriting(null)}
        >
          {t('workout.overwriteText', { name: overwriting })}
        </ConfirmDialog>
      )}

      {picking && (
        <ExerciseSearchSheet
          exercises={data.exercises}
          recentIds={recentExerciseIds(data)}
          onPick={addExercise}
          onClose={() => setPicking(false)}
        />
      )}
    </>
  )
}
