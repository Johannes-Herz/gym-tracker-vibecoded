import { useState } from 'react'
import ConfirmDialog from '../components/ConfirmDialog'
import PageHeader from '../components/PageHeader'
import ExerciseForm from '../features/exercises/ExerciseForm'
import ExerciseList from '../features/exercises/ExerciseList'
import { exercises as repo, type ExerciseInput } from '../storage/repo'
import { useStore } from '../storage/store'
import { matchesQuery } from '../features/exercises/search'
import { EQUIPMENT, MUSCLE_GROUPS, type Equipment, type Exercise, type MuscleGroup } from '../types'

type Mode = { kind: 'idle' } | { kind: 'new' } | { kind: 'edit'; exercise: Exercise }

export default function ExercisesPage() {
  const { exercises } = useStore()
  const [mode, setMode] = useState<Mode>({ kind: 'idle' })
  const [toDelete, setToDelete] = useState<Exercise | null>(null)

  const [query, setQuery] = useState('')
  const [group, setGroup] = useState<MuscleGroup | ''>('')
  const [equipment, setEquipment] = useState<Equipment | ''>('')
  const [showHidden, setShowHidden] = useState(false)

  const categories = [...new Set(exercises.map((e) => e.category).filter(Boolean))].sort()
  const inUse = toDelete ? repo.isInUse(toDelete.id) : false
  const hiddenCount = exercises.filter((e) => e.hidden).length
  const visible = exercises.filter(
    (e) =>
      (showHidden || !e.hidden) &&
      (!group || e.muscleGroup === group) &&
      (!equipment || e.equipment === equipment) &&
      matchesQuery(e, query),
  )

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
          lockKind={mode.kind === 'edit' && repo.isInUse(mode.exercise.id)}
          onSubmit={handleSubmit}
          onCancel={() => setMode({ kind: 'idle' })}
        />
      )}

      <div className="form filters">
        <input
          type="search"
          placeholder="Suchen (auch englisch)…"
          aria-label="Übungen suchen"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="chips" role="group" aria-label="Muskelgruppe">
          {(['', ...MUSCLE_GROUPS] as const).map((g) => (
            <button
              key={g || 'all'}
              type="button"
              className={group === g ? 'chip active' : 'chip'}
              aria-pressed={group === g}
              onClick={() => setGroup(g)}
            >
              {g || 'Alle'}
            </button>
          ))}
        </div>
        <div className="filter-row">
          <select
            aria-label="Gerät"
            value={equipment}
            onChange={(e) => setEquipment(e.target.value as Equipment | '')}
          >
            <option value="">Alle Geräte</option>
            {EQUIPMENT.map((eq) => (
              <option key={eq}>{eq}</option>
            ))}
          </select>
          {hiddenCount > 0 && (
            <label className="check">
              <input type="checkbox" checked={showHidden} onChange={(e) => setShowHidden(e.target.checked)} />
              Ausgeblendete anzeigen ({hiddenCount})
            </label>
          )}
        </div>
      </div>

      {visible.length === 0 && <p className="muted">Keine passenden Übungen.</p>}

      <ExerciseList
        exercises={visible}
        onEdit={(e) => setMode({ kind: 'edit', exercise: e })}
        onDelete={setToDelete}
        onToggleHidden={(e) => repo.setHidden(e.id, !e.hidden)}
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
