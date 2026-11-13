import { useState } from 'react'
import { t } from '../../i18n'
import { unitLabel } from './unitLabel'
import { loadTrendMetric, saveTrendMetric } from '../../storage/preferences'
import { TREND_METRICS, chartSeries, type ExerciseKind, type Session, type TrendMetric } from './exerciseStats'
import TrendChart from './TrendChart'

/** Trend chart with a metric switch; the choice is remembered per device and exercise kind. */
export default function TrendSection({ sessions, kind }: { sessions: Session[]; kind: ExerciseKind }) {
  const metrics: readonly { key: TrendMetric; unit: string }[] = TREND_METRICS[kind]
  const [chosen, setChosen] = useState<TrendMetric>(() =>
    loadTrendMetric(kind, metrics.map((m) => m.key)),
  )
  const metric = metrics.find((m) => m.key === chosen) ?? metrics[0]
  const { points, unit } = chartSeries(sessions, metric.key)

  function choose(key: TrendMetric) {
    setChosen(key)
    saveTrendMetric(kind, key)
  }

  return (
    <section className="card">
      <h2 className="block-title">{t('trend.title')}</h2>
      <div className="segmented" role="group" aria-label={t('trend.metric')}>
        {metrics.map((m) => (
          <button
            key={m.key}
            type="button"
            className={m.key === metric.key ? 'btn active' : 'btn'}
            aria-pressed={m.key === metric.key}
            onClick={() => choose(m.key)}
          >
            {t(`metric.${m.key}`)}
          </button>
        ))}
      </div>
      {points.length === 0 ? (
        <p className="muted">{t('trend.none')}</p>
      ) : (
        <TrendChart points={points} label={t(`metric.${metric.key}`)} unit={unitLabel(unit)} />
      )}
    </section>
  )
}
