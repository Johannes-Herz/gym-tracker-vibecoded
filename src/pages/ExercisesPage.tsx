import { useState } from 'react'
import ConfirmDialog from '../components/ConfirmDialog'
import { t } from '../i18n'
import { equipmentLabel, muscleLabel } from '../i18n/labels'
import { exerciseName } from '../features/exercises/exerciseName'
import PageHeader from '../components/PageHeader'
import ExerciseViewToggle from '../features/templates/ExerciseViewToggle'
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
  const inTemplate = toDelete ? repo.isInTemplate(toDelete.id) : false
  const blocked = inUse || inTemplate
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
    if (toDelete && !blocked) repo.remove(toDelete.id)
    setToDelete(null)
  }

  return (
    <>
      <PageHeader
        title={t('nav.exercises')}
        action={
          mode.kind === 'idle' && (
            <button type="button" className="btn btn-primary" onClick={() => setMode({ kind: 'new' })}>
              {t('common.new')}
            </button>
          )
        }
      />

      <ExerciseViewToggle view="exercises" />

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
          placeholder={t('ex.pageSearchPlaceholder')}
          aria-label={t('ex.pageSearchLabel')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="chips" role="group" aria-label={t('ex.muscleGroup')}>
          {(['', ...MUSCLE_GROUPS] as const).map((g) => (
            <button
              key={g || 'all'}
              type="button"
              className={group === g ? 'chip active' : 'chip'}
              aria-pressed={group === g}
              onClick={() => setGroup(g)}
            >
              {g ? muscleLabel(g) : t('ex.all')}
            </button>
          ))}
        </div>
        <div className="filter-row">
          <select
            aria-label={t('ex.equipment')}
            value={equipment}
            onChange={(e) => setEquipment(e.target.value as Equipment | '')}
          >
            <option value="">{t('ex.allEquipment')}</option>
            {EQUIPMENT.map((eq) => (
              <option key={eq} value={eq}>
                {equipmentLabel(eq)}
              </option>
            ))}
          </select>
          {hiddenCount > 0 && (
            <label className="check">
              <input type="checkbox" checked={showHidden} onChange={(e) => setShowHidden(e.target.checked)} />
              {t('ex.showHidden', { n: hiddenCount })}
            </label>
          )}
        </div>
      </div>

      {visible.length === 0 && <p className="muted">{t('ex.none')}</p>}

      <ExerciseList
        exercises={visible}
        onEdit={(e) => setMode({ kind: 'edit', exercise: e })}
        onDelete={setToDelete}
        onToggleHidden={(e) => repo.setHidden(e.id, !e.hidden)}
      />

      {toDelete && (
        <ConfirmDialog
          title={blocked ? t('ex.inUseTitle') : t('ex.deleteTitle')}
          confirmLabel={blocked ? t('common.ok') : t('common.delete')}
          danger={!blocked}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        >
          {blocked
            ? t(inUse ? 'ex.blockedWorkouts' : 'ex.blockedTemplates', { name: exerciseName(toDelete) })
            : t('ex.deleteText', { name: exerciseName(toDelete) })}
        </ConfirmDialog>
      )}
    </>
  )
}
