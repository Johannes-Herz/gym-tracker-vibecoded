import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Exercise } from '../../types'

interface Props {
  exercises: Exercise[]
  onPick: (exercise: Exercise) => void
  onClose: () => void
}

export default function ExercisePicker({ exercises, onPick, onClose }: Props) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const matches = exercises
    .filter((e) => e.name.toLowerCase().includes(q) || e.muscleGroup.toLowerCase().includes(q))
    .sort((a, b) => a.name.localeCompare(b.name, 'de'))

  return (
    <div className="overlay" onClick={onClose}>
      <div className="dialog picker" role="dialog" aria-modal="true" aria-label="Übung wählen" onClick={(e) => e.stopPropagation()}>
        <h2>Übung wählen</h2>
        {exercises.length === 0 ? (
          <p className="muted">
            Noch keine Übungen. <Link to="/uebungen">Übung anlegen</Link>
          </p>
        ) : (
          <>
            <div className="form">
              <input
                type="search"
                placeholder="Suchen…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
            </div>
            <ul className="list picker-list">
              {matches.map((e) => (
                <li key={e.id}>
                  <button type="button" className="btn picker-item" onClick={() => onPick(e)}>
                    <span>{e.name}</span>
                    <span className="muted small">{e.muscleGroup}</span>
                  </button>
                </li>
              ))}
              {matches.length === 0 && <li className="muted">Nichts gefunden.</li>}
            </ul>
          </>
        )}
        <div className="dialog-actions">
          <button type="button" className="btn" onClick={onClose}>
            Schließen
          </button>
        </div>
      </div>
    </div>
  )
}
