import { MUSCLE_GROUPS, type Exercise } from '../../types'

interface Props {
  exercises: Exercise[]
  onEdit: (exercise: Exercise) => void
  onDelete: (exercise: Exercise) => void
}

export default function ExerciseList({ exercises, onEdit, onDelete }: Props) {
  return (
    <>
      {MUSCLE_GROUPS.map((group) => {
        const items = exercises
          .filter((e) => e.muscleGroup === group)
          .sort((a, b) => a.name.localeCompare(b.name, 'de'))
        if (items.length === 0) return null
        return (
          <section key={group}>
            <h2 className="group-title">{group}</h2>
            <ul className="list">
              {items.map((e) => (
                <li key={e.id} className="list-item">
                  <div className="grow">
                    <div>{e.name}</div>
                    {e.category && <div className="muted small">{e.category}</div>}
                  </div>
                  <button type="button" className="btn" onClick={() => onEdit(e)}>
                    Bearbeiten
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger-text"
                    aria-label={`${e.name} löschen`}
                    onClick={() => onDelete(e)}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </>
  )
}
