import { useState } from 'react'
import ConfirmDialog from '../../components/ConfirmDialog'
import { exerciseOrder } from '../../lib/exerciseOrder'
import { fromLocalInput, toLocalInput } from '../../lib/format'
import { sets as setsRepo, templates, workouts } from '../../storage/repo'
import { getState, useStore } from '../../storage/store'
import type { Exercise, WorkoutSet } from '../../types'
import ExerciseBlock from './ExerciseBlock'
import ExerciseSearchSheet from '../exercises/ExerciseSearchSheet'
import RestTimer from '../timer/RestTimer'
import { initialValues } from './prefill'
import { recentExerciseIds } from './recent'

export default function WorkoutEditor({ workoutId }: { workoutId: string }) {
  const data = useStore()
  const [picking, setPicking] = useState(false)
  const [namingTemplate, setNamingTemplate] = useState<string | null>(null)
  const [savedAs, setSavedAs] = useState<string | null>(null)
  const [overwriting, setOverwriting] = useState<string | null>(null)

  const workout = data.workouts.find((w) => w.id === workoutId)
  if (!workout) return <p className="muted">Training nicht gefunden.</p>

  // Exercises in order of first appearance within this workout.
  const workoutSets = data.sets.filter((s) => s.workoutId === workoutId).sort((a, b) => a.order - b.order)
  const groups = new Map<string, WorkoutSet[]>()
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
    const values = initialValues(getState(), workoutId, exercise)
    setsRepo.add({ workoutId, exerciseId: exercise.id, ...values, suggested: true })
  }

  return (
    <>
      <RestTimer />
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
        {workout.templateName && <p className="muted small">Vorlage: {workout.templateName}</p>}
      </div>

      {[...groups.entries()].map(([exerciseId, sets], i) => {
        const exercise = data.exercises.find((e) => e.id === exerciseId)
        if (!exercise) return null
        return (
          <ExerciseBlock
            key={exerciseId}
            workoutId={workoutId}
            exercise={exercise}
            sets={sets}
            canMoveUp={i > 0}
            canMoveDown={i < orderIds.length - 1}
          />
        )
      })}

      <button type="button" className="btn btn-primary wide" onClick={() => setPicking(true)}>
        + Übung hinzufügen
      </button>

      <button
        type="button"
        className="btn wide"
        disabled={groups.size === 0}
        onClick={() => setNamingTemplate(workout.templateName ?? '')}
      >
        Als Vorlage speichern
      </button>
      {savedAs && <p className="muted small">Vorlage „{savedAs}“ gespeichert.</p>}

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

      {namingTemplate !== null && (
        <ConfirmDialog
          title="Als Vorlage speichern"
          confirmLabel="Speichern"
          onConfirm={saveAsTemplate}
          onCancel={() => setNamingTemplate(null)}
        >
          <div className="form">
            <label>
              Name der Vorlage
              <input
                autoFocus
                value={namingTemplate}
                maxLength={60}
                placeholder="z. B. Push Tag"
                onChange={(e) => setNamingTemplate(e.target.value)}
              />
            </label>
          </div>
        </ConfirmDialog>
      )}

      {overwriting !== null && (
        <ConfirmDialog
          title="Vorlage überschreiben?"
          confirmLabel="Überschreiben"
          danger
          onConfirm={() => writeTemplate(overwriting)}
          onCancel={() => setOverwriting(null)}
        >
          Die Vorlage „{overwriting}“ existiert bereits und wird mit den Übungen dieses Trainings überschrieben.
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
