import { useState } from 'react'
import ConfirmDialog from '../components/ConfirmDialog'
import PageHeader from '../components/PageHeader'
import ExerciseForm from '../features/exercises/ExerciseForm'
import ExerciseList from '../features/exercises/ExerciseList'
import { exercises as repo, type ExerciseInput } from '../storage/repo'
import { useStore } from '../storage/store'
import type { Exercise } from '../types'

type Mode = { kind: 'idle' } | { kind: 'new' } | { kind: 'edit'; exercise: Exercise }

export default function ExercisesPage() {
  const { exercises } = useStore()
  const [mode, setMode] = useState<Mode>({ kind: 'idle' })
  const [toDelete, setToDelete] = useState<Exercise | null>(null)

  const categories = [...new Set(exercises.map((e) => e.category).filter(Boolean))].sort()
  const inUse = toDelete ? repo.isInUse(toDelete.id) : false

  function handleSubmit(input: ExerciseInput) {
    if (mode.kind === 'edit') repo.update(mode.exercise.id, input)
    else repo.add(input)
    setMode({ kind: 'idle' })
  }

  function confirmDelete() {
    if (toDelete && !inUse) repo.remove(toDelete.id)
    setToDelete(null)
  }

  return (
    <>
      <PageHeader
        title="Übungen"
        action={
          mode.kind === 'idle' && (
            <button type="button" className="btn btn-primary" onClick={() => setMode({ kind: 'new' })}>
              + Neu
            </button>
          )
        }
      />

      {mode.kind !== 'idle' && (
        <ExerciseForm
          key={mode.kind === 'edit' ? mode.exercise.id : 'new'}
          initial={mode.kind === 'edit' ? mode.exercise : undefined}
          categories={categories}
          onSubmit={handleSubmit}
          onCancel={() => setMode({ kind: 'idle' })}
        />
      )}

      {exercises.length === 0 && mode.kind === 'idle' && (
        <p className="muted">Noch keine Übungen. Lege deine erste Übung mit „+ Neu“ an.</p>
      )}

      <ExerciseList
        exercises={exercises}
        onEdit={(e) => setMode({ kind: 'edit', exercise: e })}
        onDelete={setToDelete}
      />

      {toDelete && (
        <ConfirmDialog
          title={inUse ? 'Übung wird verwendet' : 'Übung löschen?'}
          confirmLabel={inUse ? 'OK' : 'Löschen'}
          danger={!inUse}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        >
          {inUse
            ? `„${toDelete.name}“ kommt in Trainings vor und kann nicht gelöscht werden.`
            : `„${toDelete.name}“ wird endgültig gelöscht.`}
        </ConfirmDialog>
      )}
    </>
  )
}
