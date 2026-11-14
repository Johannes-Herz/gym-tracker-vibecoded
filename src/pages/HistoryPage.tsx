import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { newWorkoutPath, startAction } from '../features/workout/newWorkout'
import PageHeader from '../components/PageHeader'
import WorkoutCalendar from '../features/history/WorkoutCalendar'
import { formatDateTime, formatMonthYear } from '../lib/format'
import { loadHistoryView, saveHistoryView, type HistoryView } from '../storage/preferences'
import { ActiveTrainingBanner, ActiveTrainingPrompt } from '../features/workout/ActiveTraining'
import StartWorkoutSheet from '../features/workout/StartWorkoutSheet'
import { endTraining } from '../features/workout/training'
import { useSession } from '../storage/session'
import { useStore } from '../storage/store'
import { t, tp, type MessageKey } from '../i18n'
import { exerciseName } from '../features/exercises/exerciseName'


const VIEWS: { key: HistoryView; label: MessageKey }[] = [
  { key: 'list', label: 'history.list' },
  { key: 'calendar', label: 'history.calendar' },
]

export default function HistoryPage() {
  const [view, setView] = useState<HistoryView>(() => loadHistoryView())
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)
  const [asking, setAsking] = useState(false)
  const { templates } = useStore()
  const session = useSession()
  const navigate = useNavigate()
  const dateKey = view === 'calendar' ? selectedDay : null

  function begin(sessionActive: boolean) {
    const action = startAction(sessionActive, templates.length)
    if (action === 'ask') setAsking(true)
    else if (action === 'choose-template') setStarting(true)
    else navigate(newWorkoutPath(dateKey))
  }

  function choose(next: HistoryView) {
    setView(next)
    setSelectedDay(null)
    saveHistoryView(next)
  }

  return (
    <>
      <PageHeader title={t('nav.history')} />
      <ActiveTrainingBanner />
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
            {t(v.label)}
          </button>
        ))}
      </div>
      {view === 'list' ? <WorkoutList /> : <WorkoutCalendar onSelectDay={setSelectedDay} />}
      <div className="fab-spacer" />
      <button type="button" className="fab" aria-label={t('new.title')} onClick={() => begin(session !== null)}>
        +
      </button>
      {asking && (
        <ActiveTrainingPrompt
          onDismiss={() => setAsking(false)}
          onRestart={() => {
            endTraining()
            setAsking(false)
            begin(false)
          }}
        />
      )}
      {starting && <StartWorkoutSheet templates={templates} dateKey={dateKey} onClose={() => setStarting(false)} />}
    </>
  )
}

function WorkoutList() {
  const { workouts, sets, exercises } = useStore()

  const sorted = [...workouts].sort((a, b) => b.startedAt.localeCompare(a.startedAt))
  const months = new Map<string, typeof sorted>()
  for (const w of sorted) {
    const key = formatMonthYear(new Date(w.startedAt))
    months.set(key, [...(months.get(key) ?? []), w])
  }

  return (
    <>
      {sorted.length === 0 && <p className="muted">{t('history.none')}</p>}
      {[...months.entries()].map(([month, items]) => (
        <section key={month}>
          <h2 className="group-title">{month}</h2>
          <ul className="list">
            {items.map((w) => {
              const workoutSets = sets.filter((s) => s.workoutId === w.id)
              const names = [...new Set(workoutSets.map((s) => s.exerciseId))]
                .map((id) => exercises.find((e) => e.id === id))
                .filter((e) => e !== undefined)
                .map((e) => exerciseName(e))
              return (
                <li key={w.id}>
                  <Link to={`/verlauf/${w.id}`} className="list-item history-item">
                    <div className="grow">
                      <div>
                        {formatDateTime(w.startedAt)}
                        {w.templateName && <span className="muted small"> · {w.templateName}</span>}
                      </div>
                      <div className="muted small">
                        {workoutSets.length === 0
                          ? t('history.empty')
                          : t('history.summary', { sets: tp('count.sets', workoutSets.length), names: names.join(', ') })}
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
