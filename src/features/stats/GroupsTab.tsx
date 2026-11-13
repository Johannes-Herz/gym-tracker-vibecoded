import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatNumber } from '../../lib/format'
import { useStore } from '../../storage/store'
import { aggregateBy } from './stats'

const RANGES = [
  { key: '4w', label: '4 Wochen', days: 28 },
  { key: '3m', label: '3 Monate', days: 91 },
  { key: 'all', label: 'Alles', days: null },
] as const

const GROUPINGS = [
  { key: 'muscleGroup', label: 'Muskelgruppe' },
  { key: 'category', label: 'Kategorie' },
] as const

export default function GroupsTab() {
  const data = useStore()
  const [by, setBy] = useState<(typeof GROUPINGS)[number]['key']>('muscleGroup')
  const [rangeKey, setRangeKey] = useState<(typeof RANGES)[number]['key']>('4w')

  const range = RANGES.find((r) => r.key === rangeKey)!
  const since = range.days
    ? new Date(Date.now() - range.days * 24 * 60 * 60 * 1000).toISOString()
    : undefined
  const totals = aggregateBy(data, by, since)

  return (
    <>
      <div className="card">
        <div className="segmented" role="group" aria-label="Gruppierung">
          {GROUPINGS.map((g) => (
            <button
              key={g.key}
              type="button"
              className={g.key === by ? 'btn active' : 'btn'}
              onClick={() => setBy(g.key)}
            >
              {g.label}
            </button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Zeitraum">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              className={r.key === rangeKey ? 'btn active' : 'btn'}
              onClick={() => setRangeKey(r.key)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {totals.length === 0 ? (
        <p className="muted">Keine Daten im gewählten Zeitraum.</p>
      ) : (
        <>
          <div className="card">
            <div className="muted small">Volumen (Gewicht × Wiederholungen) in kg</div>
            <div className="chart" style={{ height: 48 + totals.length * 40 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={totals} layout="vertical" margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fill: 'var(--muted)', fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="key"
                    width={92}
                    tick={{ fill: 'var(--muted)', fontSize: 11 }}
                  />
                  <Tooltip
                    cursor={{ fill: 'var(--border)', opacity: 0.4 }}
                    formatter={(v: number) => [`${formatNumber(v)} kg`, 'Volumen']}
                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  />
                  <Bar dataKey="volume" fill="var(--primary)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <ul className="list">
            {totals.map((t) => (
              <li key={t.key} className="list-item">
                <div className="grow">{t.key}</div>
                <div className="muted small">
                  {t.sets} {t.sets === 1 ? 'Satz' : 'Sätze'} · {formatNumber(t.volume)} kg
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  )
}
