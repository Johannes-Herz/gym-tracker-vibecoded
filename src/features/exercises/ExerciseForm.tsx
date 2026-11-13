import { useState, type FormEvent } from 'react'
import { t } from '../../i18n'
import { equipmentLabel, muscleLabel } from '../../i18n/labels'
import type { ExerciseInput } from '../../storage/repo'
import { EQUIPMENT, MUSCLE_GROUPS, isCardio, type Equipment, type MuscleGroup } from '../../types'

interface Props {
  initial?: ExerciseInput
  categories: string[]
  /** The exercise already has sets: it can't switch between strength and cardio. */
  lockKind?: boolean
  onSubmit: (input: ExerciseInput) => void
  onCancel: () => void
}

export default function ExerciseForm({ initial, categories, lockKind = false, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>(initial?.muscleGroup ?? MUSCLE_GROUPS[0])
  const [category, setCategory] = useState(initial?.category ?? '')
  const [equipment, setEquipment] = useState<Equipment | ''>(initial?.equipment ?? '')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({ name, muscleGroup, category, equipment: equipment || undefined })
  }

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <label>
        {t('ex.name')}
        <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
      </label>
      <label>
        {t('ex.muscleGroup')}
        <select value={muscleGroup} onChange={(e) => setMuscleGroup(e.target.value as MuscleGroup)}>
          {MUSCLE_GROUPS.filter(
            (g) => !lockKind || !initial || isCardio({ muscleGroup: g }) === isCardio(initial),
          ).map((g) => (
            <option key={g} value={g}>
              {muscleLabel(g)}
            </option>
          ))}
        </select>
        {lockKind && (
          <span className="small">{t('ex.lockedKind')}</span>
        )}
      </label>
      <label>
        {t('ex.equipment')}
        <select value={equipment} onChange={(e) => setEquipment(e.target.value as Equipment | '')}>
          <option value="">–</option>
          {EQUIPMENT.map((eq) => (
            <option key={eq} value={eq}>
              {equipmentLabel(eq)}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t('ex.category')}
        <input value={category} onChange={(e) => setCategory(e.target.value)} list="category-options" />
        <datalist id="category-options">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </label>
      <div className="row">
        <button type="button" className="btn" onClick={onCancel}>
          {t('common.cancel')}
        </button>
        <button type="submit" className="btn btn-primary">
          {t('common.save')}
        </button>
      </div>
    </form>
  )
}
