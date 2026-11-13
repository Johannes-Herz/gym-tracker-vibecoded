import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import WorkoutCalendar from '../features/history/WorkoutCalendar'
import { formatDateTime } from '../lib/format'
import { loadHistoryView, saveHistoryView, type HistoryView } from '../storage/preferences'
import { useStore } from '../storage/store'

const monthFormat = new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' })

const VIEWS: { key: HistoryView; label: string }[] = [
  { key: 'list', label: 'Liste' },
  { key: 'calendar', label: 'Kalender' },
]

export default function HistoryPage() {
  const [view, setView] = useState<HistoryView>(() => loadHistoryView())

  function choose(next: HistoryView) {
    setView(next)
    saveHistoryView(next)
  }

  return (
    <>
      <PageHeader title="Verlauf" />
      <div className="segmented tabs" role="tablist">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            type="button"
            role="tab"
            aria-selected={v.key === view}
            className={v.key === view ? 'btn active' : 'btn'}
            onClick={() => choose(v.key)}
          >
            {v.label}
          </button>
        ))}
      </div>
      {view === 'list' ? <WorkoutList /> : <WorkoutCalendar />}
    </>
  )
}

function WorkoutList() {
  const { workouts, sets, exercises } = useStore()

  const sorted = [...workouts].sort((a, b) => b.startedAt.localeCompare(a.startedAt))
  const months = new Map<string, typeof sorted>()
  for (const w of sorted) {
    const key = monthFormat.format(new Date(w.startedAt))
    months.set(key, [...(months.get(key) ?? []), w])
  }

  return (
    <>
      {sorted.length === 0 && <p className="muted">Noch keine Trainings.</p>}
      {[...months.entries()].map(([month, items]) => (
        <section key={month}>
          <h2 className="group-title">{month}</h2>
          <ul className="list">
            {items.map((w) => {
              const workoutSets = sets.filter((s) => s.workoutId === w.id)
              const names = [...new Set(workoutSets.map((s) => s.exerciseId))]
                .map((id) => exercises.find((e) => e.id === id)?.name)
                .filter(Boolean)
              return (
                <li key={w.id}>
                  <Link to={`/verlauf/${w.id}`} className="list-item history-item">
                    <div className="grow">
                      <div>{formatDateTime(w.startedAt)}</div>
                      <div className="muted small">
                        {workoutSets.length === 0
                          ? 'Leer'
                          : `${workoutSets.length} Sätze · ${names.join(', ')}`}
                      </div>
                    </div>
                    <span aria-hidden="true" className="muted">›</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </>
  )
}
