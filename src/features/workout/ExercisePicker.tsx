import { useState } from 'react'
import { Link } from 'react-router-dom'
import { byName, matchesQuery } from '../exercises/search'
import { MUSCLE_GROUPS, type Exercise } from '../../types'

interface Props {
  exercises: Exercise[]
  recentIds: string[]
  onPick: (exercise: Exercise) => void
  onClose: () => void
}

function Item({ exercise, onPick }: { exercise: Exercise; onPick: (e: Exercise) => void }) {
  return (
    <li>
      <button type="button" className="btn picker-item" onClick={() => onPick(exercise)}>
        <span>
          {exercise.name}
          {exercise.aliasEn && exercise.aliasEn !== exercise.name && (
            <span className="muted small"> · {exercise.aliasEn}</span>
          )}
        </span>
        <span className="muted small">{exercise.muscleGroup}</span>
      </button>
    </li>
  )
}

export default function ExercisePicker({ exercises, recentIds, onPick, onClose }: Props) {
  const [query, setQuery] = useState('')
  const available = exercises.filter((e) => !e.hidden)
  const searching = query.trim() !== ''
  const matches = available.filter((e) => matchesQuery(e, query)).sort(byName)
  const recent = recentIds
    .map((id) => available.find((e) => e.id === id))
    .filter((e): e is Exercise => e !== undefined)

  return (
    <div className="overlay" onClick={onClose}>
      <div className="dialog picker" role="dialog" aria-modal="true" aria-label="Übung wählen" onClick={(e) => e.stopPropagation()}>
        <h2>Übung wählen</h2>
        {available.length === 0 ? (
          <p className="muted">
            Keine Übungen verfügbar. <Link to="/uebungen">Übungen verwalten</Link>
          </p>
        ) : (
          <>
            <div className="form">
              <input
                type="search"
                placeholder="Suchen (auch englisch)…"
                aria-label="Übung suchen"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
            </div>
            <div className="picker-list">
              {searching ? (
                <ul className="list">
                  {matches.map((e) => (
                    <Item key={e.id} exercise={e} onPick={onPick} />
                  ))}
                  {matches.length === 0 && <li className="muted">Nichts gefunden.</li>}
                </ul>
              ) : (
                <>
                  {recent.length > 0 && (
                    <section>
                      <h3 className="group-title">Zuletzt verwendet</h3>
                      <ul className="list">
                        {recent.map((e) => (
                          <Item key={e.id} exercise={e} onPick={onPick} />
                        ))}
                      </ul>
                    </section>
                  )}
                  {MUSCLE_GROUPS.map((group) => {
                    const items = matches.filter((e) => e.muscleGroup === group)
                    if (items.length === 0) return null
                    return (
                      <section key={group}>
                        <h3 className="group-title">{group}</h3>
                        <ul className="list">
                          {items.map((e) => (
                            <Item key={e.id} exercise={e} onPick={onPick} />
                          ))}
                        </ul>
                      </section>
                    )
                  })}
                </>
              )}
            </div>
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
