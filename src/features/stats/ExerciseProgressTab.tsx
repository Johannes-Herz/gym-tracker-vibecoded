import { useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatNumber } from '../../lib/format'
import { useStore } from '../../storage/store'
import { isCardio } from '../../types'
import { cardioProgress, exerciseProgress } from './stats'

const STRENGTH_METRICS = [
  { key: 'maxWeight', label: 'Max. Gewicht', unit: 'kg' },
  { key: 'est1RM', label: 'Geschätztes 1RM', unit: 'kg' },
  { key: 'volume', label: 'Volumen', unit: 'kg' },
] as const

const CARDIO_METRICS = [
  { key: 'durationMin', label: 'Dauer', unit: 'min' },
  { key: 'distanceKm', label: 'Distanz', unit: 'km' },
] as const

type MetricKey = (typeof STRENGTH_METRICS)[number]['key'] | (typeof CARDIO_METRICS)[number]['key']

const shortDate = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })

export default function ExerciseProgressTab() {
  const data = useStore()
  const [selected, setSelected] = useState('')
  const [metricKey, setMetricKey] = useState<MetricKey>('maxWeight')

  const used = new Set(data.sets.map((s) => s.exerciseId))
  const options = data.exercises
    .filter((e) => used.has(e.id))
    .sort((a, b) => a.name.localeCompare(b.name, 'de'))

  if (options.length === 0) {
    return <p className="muted">Noch keine Daten. Trage zuerst ein Training ein.</p>
  }

  const exerciseId = options.some((e) => e.id === selected) ? selected : options[0].id
  const cardio = isCardio(options.find((e) => e.id === exerciseId)!)
  const metrics: readonly { key: MetricKey; label: string; unit: string }[] = cardio ? CARDIO_METRICS : STRENGTH_METRICS
  const metric = metrics.find((m) => m.key === metricKey) ?? metrics[0]
  const points: { startedAt: string; [key: string]: number | string }[] = cardio
    ? cardioProgress(data, exerciseId).map((p) => ({ ...p }))
    : exerciseProgress(data, exerciseId).map((p) => ({ ...p }))
  const chartData = points.map((p) => ({
    label: shortDate.format(new Date(p.startedAt)),
    value: p[metric.key] as number,
  }))
  const best = Math.max(...chartData.map((d) => d.value))

  return (
    <>
      <div className="form card">
        <label>
          Übung
          <select value={exerciseId} onChange={(e) => setSelected(e.target.value)}>
            {options.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </label>
        <div className="segmented" role="group" aria-label="Kennzahl">
          {metrics.map((m) => (
            <button
              key={m.key}
              type="button"
              className={m.key === metric.key ? 'btn active' : 'btn'}
              onClick={() => setMetricKey(m.key)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="muted small">
          {metric.label}: Bestwert {formatNumber(best)} {metric.unit} · {points.length}{' '}
          {points.length === 1 ? 'Training' : 'Trainings'}
        </div>
        <div className="chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 12, right: 12, bottom: 0, left: -12 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fill: 'var(--muted)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} domain={['auto', 'auto']} />
              <Tooltip
                formatter={(v: number) => [`${formatNumber(v)} ${metric.unit}`, metric.label]}
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
              />
              <Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  )
}
