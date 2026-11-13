import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { formatDateTime } from '../lib/format'
import { useStore } from '../storage/store'

const monthFormat = new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' })

export default function HistoryPage() {
  const { workouts, sets, exercises } = useStore()

  const sorted = [...workouts].sort((a, b) => b.startedAt.localeCompare(a.startedAt))
  const months = new Map<string, typeof sorted>()
  for (const w of sorted) {
    const key = monthFormat.format(new Date(w.startedAt))
    months.set(key, [...(months.get(key) ?? []), w])
  }

  return (
    <>
      <PageHeader title="Verlauf" />
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
