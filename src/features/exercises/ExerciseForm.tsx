import { useState, type FormEvent } from 'react'
import type { ExerciseInput } from '../../storage/repo'
import { MUSCLE_GROUPS, type MuscleGroup } from '../../types'

interface Props {
  initial?: ExerciseInput
  categories: string[]
  onSubmit: (input: ExerciseInput) => void
  onCancel: () => void
}

export default function ExerciseForm({ initial, categories, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>(initial?.muscleGroup ?? MUSCLE_GROUPS[0])
  const [category, setCategory] = useState(initial?.category ?? '')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({ name, muscleGroup, category })
  }

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <label>
        Name
        <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
      </label>
      <label>
        Muskelgruppe
        <select value={muscleGroup} onChange={(e) => setMuscleGroup(e.target.value as MuscleGroup)}>
          {MUSCLE_GROUPS.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
      </label>
      <label>
        Kategorie (z. B. Push, Pull, Legs)
        <input value={category} onChange={(e) => setCategory(e.target.value)} list="category-options" />
        <datalist id="category-options">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </label>
      <div className="row">
        <button type="button" className="btn" onClick={onCancel}>
          Abbrechen
        </button>
        <button type="submit" className="btn btn-primary">
          Speichern
        </button>
      </div>
    </form>
  )
}
