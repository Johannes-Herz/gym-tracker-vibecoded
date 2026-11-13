import { useState } from 'react'
import { loadTrendMetric, saveTrendMetric } from '../../storage/preferences'
import { TREND_METRICS, trendSeries, type ExerciseKind, type Session, type TrendMetric } from './exerciseStats'
import TrendChart from './TrendChart'

/** Trend chart with a metric switch; the choice is remembered per device and exercise kind. */
export default function TrendSection({ sessions, kind }: { sessions: Session[]; kind: ExerciseKind }) {
  const metrics: readonly { key: TrendMetric; label: string; unit: string }[] = TREND_METRICS[kind]
  const [chosen, setChosen] = useState<TrendMetric>(() =>
    loadTrendMetric(kind, metrics.map((m) => m.key)),
  )
  const metric = metrics.find((m) => m.key === chosen) ?? metrics[0]
  const points = trendSeries(sessions, metric.key)

  function choose(key: TrendMetric) {
    setChosen(key)
    saveTrendMetric(kind, key)
  }

  return (
    <section className="card">
      <h2 className="block-title">Verlauf</h2>
      <div className="segmented" role="group" aria-label="Kennzahl">
        {metrics.map((m) => (
          <button
            key={m.key}
            type="button"
            className={m.key === metric.key ? 'btn active' : 'btn'}
            aria-pressed={m.key === metric.key}
            onClick={() => choose(m.key)}
          >
            {m.label}
          </button>
        ))}
      </div>
      {points.length === 0 ? (
        <p className="muted">Keine Werte in diesem Zeitraum.</p>
      ) : (
        <TrendChart points={points} label={metric.label} unit={metric.unit} />
      )}
    </section>
  )
}
