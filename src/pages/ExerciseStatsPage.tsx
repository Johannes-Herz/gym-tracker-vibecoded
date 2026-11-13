import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { exerciseName } from '../features/exercises/exerciseName'
import { t } from '../i18n'
import { formatSet, isBodyweight } from '../features/exercises/bodyweight'
import { bestSet, dayMonth, sessionsFor, type Session } from '../features/stats/exerciseStats'
import LastComparison from '../features/stats/LastComparison'
import RangeFilter from '../features/stats/RangeFilter'
import RepHeatmap from '../features/stats/RepHeatmap'
import TrendSection from '../features/stats/TrendSection'
import { formatNumber } from '../lib/format'
import { useGoUp } from '../lib/useNavSteps'
import { loadStatsRange, saveStatsRange, type RangeSelection } from '../storage/preferences'
import { useStore } from '../storage/store'
import { isCardio } from '../types'

export default function ExerciseStatsPage() {
  const { id = '' } = useParams()
  const goUp = useGoUp()
  const data = useStore()
  const [range, setRange] = useState<RangeSelection>(() => loadStatsRange())

  const exercise = data.exercises.find((e) => e.id === id)

  function changeRange(next: RangeSelection) {
    setRange(next)
    saveStatsRange(next)
  }


  const header = (
    <header className="page-header stats-header">
      <button type="button" className="btn back-link" aria-label={t('stats.back')} onClick={goUp}>
        ‹
      </button>
      <div className="stats-title">
        <h1>{exercise ? exerciseName(exercise) : t('stats.exerciseFallback')}</h1>
        {exercise && isBodyweight(exercise) && <div className="muted small">{t('stats.bodyweightExercise')}</div>}
      </div>
    </header>
  )

  if (!exercise) {
    return (
      <>
        {header}
        <p className="muted">{t('stats.exerciseNotFound')}</p>
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
        <p className="muted">{t('stats.noSessions')}</p>
      ) : (
        <>
          <div className="kpis">
            <Kpi label={t('stats.kpiWorkouts')} value={String(sessions.length)} />
            {cardio ? (
              <Kpi label={t('stats.kpiLongest')} value={`${formatNumber(longestMinutes(sessions))} min`} />
            ) : (
              <Kpi label={t('stats.kpiBest')} value={best(sessions, bodyweight)} />
            )}
            <Kpi
              label={t('stats.kpiPeriod')}
              value={first === last ? dayMonth(first.startedAt) : `${dayMonth(first.startedAt)} – ${dayMonth(last.startedAt)}`}
            />
          </div>

          {!cardio && (
            <>
              <RepHeatmap sessions={sessions} bodyweight={bodyweight} />
              <LastComparison
                allSessions={sessionsFor(data, id, { key: 'all' })}
                rangeSessions={sessions}
                bodyweight={bodyweight}
              />
            </>
          )}
          <TrendSection sessions={sessions} kind={cardio ? 'cardio' : bodyweight ? 'bodyweight' : 'strength'} />
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