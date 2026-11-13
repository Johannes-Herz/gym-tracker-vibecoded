import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatDateTime, localDateKey } from '../../lib/format'
import { useStore } from '../../storage/store'
import { monthGrid } from './calendar'
import { trainingDays } from './stats'

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const monthName = new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' })

export default function CalendarTab() {
  const data = useStore()
  const now = new Date()
  const [view, setView] = useState({ year: now.getFullYear(), month: now.getMonth() })
  const [selected, setSelected] = useState<string | null>(null)

  const days = trainingDays(data)
  const todayKey = localDateKey(now)
  const cells = monthGrid(view.year, view.month)
  const keyFor = (d: number) => localDateKey(new Date(view.year, view.month, d))

  const monthPrefix = `${view.year}-${String(view.month + 1).padStart(2, '0')}-`
  const trainedThisMonth = [...days].filter((k) => k.startsWith(monthPrefix)).length

  function shift(delta: number) {
    const d = new Date(view.year, view.month + delta, 1)
    setView({ year: d.getFullYear(), month: d.getMonth() })
    setSelected(null)
  }

  const selectedWorkouts = selected
    ? data.workouts
        .filter((w) => localDateKey(new Date(w.startedAt)) === selected)
        .sort((a, b) => a.startedAt.localeCompare(b.startedAt))
    : []

  return (
    <>
      <div className="card">
        <div className="calendar-head">
          <button type="button" className="btn" aria-label="Vorheriger Monat" onClick={() => shift(-1)}>
            ‹
          </button>
          <strong>{monthName.format(new Date(view.year, view.month, 1))}</strong>
          <button type="button" className="btn" aria-label="Nächster Monat" onClick={() => shift(1)}>
            ›
          </button>
        </div>
        <div className="calendar-grid">
          {WEEKDAYS.map((w) => (
            <div key={w} className="calendar-weekday muted small">
              {w}
            </div>
          ))}
          {cells.map((d, i) => {
            if (d === null) return <div key={i} />
            const key = keyFor(d)
            const trained = days.has(key)
            const classes = ['calendar-day']
            if (trained) classes.push('trained')
            if (key === todayKey) classes.push('today')
            if (key === selected) classes.push('selected')
            return (
              <button
                key={i}
                type="button"
                className={classes.join(' ')}
                aria-label={trained ? `${d}. – Training` : `${d}.`}
                aria-pressed={key === selected}
                onClick={() => setSelected(key === selected ? null : key)}
              >
                {d}
              </button>
            )
          })}
        </div>
        <div className="muted small calendar-summary">
          {trainedThisMonth} {trainedThisMonth === 1 ? 'Trainingstag' : 'Trainingstage'} in diesem Monat
        </div>
      </div>

      {selected && (
        <ul className="list">
          {selectedWorkouts.length === 0 && <li className="muted">Kein Training an diesem Tag.</li>}
          {selectedWorkouts.map((w) => (
            <li key={w.id}>
              <Link to={`/verlauf/${w.id}`} className="list-item history-item">
                <div className="grow">{formatDateTime(w.startedAt)}</div>
                <span aria-hidden="true" className="muted">›</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
