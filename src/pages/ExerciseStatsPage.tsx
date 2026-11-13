import { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { formatSet, isBodyweight } from '../features/exercises/bodyweight'
import { bestSet, dayMonth, sessionsFor, trend, type Session } from '../features/stats/exerciseStats'
import LastComparison from '../features/stats/LastComparison'
import RangeFilter from '../features/stats/RangeFilter'
import { inRange } from '../features/stats/range'
import RepHeatmap from '../features/stats/RepHeatmap'
import { cardioProgress } from '../features/stats/stats'
import TrendChart from '../features/stats/TrendChart'
import { formatNumber } from '../lib/format'
import { loadStatsRange, saveStatsRange, type RangeSelection } from '../storage/preferences'
import { useStore } from '../storage/store'
import { isCardio, type AppData } from '../types'

export default function ExerciseStatsPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const data = useStore()
  const [range, setRange] = useState<RangeSelection>(() => loadStatsRange())

  const exercise = data.exercises.find((e) => e.id === id)

  function changeRange(next: RangeSelection) {
    setRange(next)
    saveStatsRange(next)
  }

  function back() {
    if (location.key !== 'default') navigate(-1)
    else navigate('/statistik', { replace: true })
  }

  const header = (
    <header className="page-header stats-header">
      <button type="button" className="btn back-link" aria-label="Zurück" onClick={back}>
        ‹
      </button>
      <h1>{exercise?.name ?? 'Übung'}</h1>
    </header>
  )

  if (!exercise) {
    return (
      <>
        {header}
        <p className="muted">Übung nicht gefunden.</p>
      </>
    )
  }

  const cardio = isCardio(exercise)
  const bodyweight = isBodyweight(exercise)
  const sessions = sessionsFor(data, id, range)
  const first = sessions[0]
  const last = sessions[sessions.length - 1]

  return (
    <>
      {header}
      <RangeFilter value={range} onChange={changeRange} />

      {sessions.length === 0 ? (
        <p className="muted">Keine Trainings in diesem Zeitraum.</p>
      ) : (
        <>
          <div className="kpis">
            <Kpi label="Trainings" value={String(sessions.length)} />
            {cardio ? (
              <Kpi label="Längste Einheit" value={`${formatNumber(longestMinutes(sessions))} min`} />
            ) : (
              <Kpi label="Bester Satz" value={best(sessions, bodyweight)} />
            )}
            <Kpi
              label="Zeitraum"
              value={first === last ? dayMonth(first.startedAt) : `${dayMonth(first.startedAt)} – ${dayMonth(last.startedAt)}`}
            />
          </div>

          {cardio ? (
            <CardioTrend data={data} exerciseId={id} range={range} />
          ) : (
            <>
              <RepHeatmap sessions={sessions} bodyweight={bodyweight} />
              <LastComparison
                allSessions={sessionsFor(data, id, { key: 'all' })}
                rangeSessions={sessions}
                bodyweight={bodyweight}
              />
              <section className="card">
                <h2 className="block-title">{bodyweight ? 'Wiederholungen gesamt' : 'Geschätztes 1RM'}</h2>
                <TrendChart
                  points={trend(sessions, bodyweight)}
                  label={bodyweight ? 'Wiederholungen' : '1RM'}
                  unit={bodyweight ? 'Wdh.' : 'kg'}
                />
              </section>
            </>
          )}
        </>
      )}
    </>
  )
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="kpi">
      <div className="kpi-value">{value}</div>
      <div className="kpi-label muted small">{label}</div>
    </div>
  )
}

function best(sessions: Session[], bodyweight: boolean): string {
  const s = bestSet(sessions, bodyweight)
  return s ? formatSet(s.weight, s.reps, bodyweight) : '–'
}

function longestMinutes(sessions: Session[]): number {
  return Math.max(...sessions.flatMap((s) => s.sets.map((x) => x.durationMin ?? 0)))
}

function CardioTrend({ data, exerciseId, range }: { data: AppData; exerciseId: string; range: RangeSelection }) {
  const [metric, setMetric] = useState<'durationMin' | 'distanceKm'>('durationMin')
  const points = cardioProgress(data, exerciseId)
    .filter((p) => inRange(p.startedAt, range))
    .map((p) => ({ startedAt: p.startedAt, value: p[metric] }))

  return (
    <section className="card">
      <div className="segmented" role="group" aria-label="Kennzahl">
        {(
          [
            ['durationMin', 'Dauer'],
            ['distanceKm', 'Distanz'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={metric === key ? 'btn active' : 'btn'}
            onClick={() => setMetric(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <TrendChart
        points={points}
        label={metric === 'durationMin' ? 'Dauer' : 'Distanz'}
        unit={metric === 'durationMin' ? 'min' : 'km'}
      />
    </section>
  )
}
