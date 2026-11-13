import { useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import NumberStepper from '../../components/NumberStepper'
import { t } from '../../i18n'
import { formatDate, formatDayMonth, formatNumber, localDateKey } from '../../lib/format'
import { bodyWeights } from '../../storage/repo'
import { useStore } from '../../storage/store'


// Entries are stored as YYYY-MM-DD; parse as local noon to avoid timezone shifts.
const parseDay = (key: string) => new Date(`${key}T12:00:00`)

export default function BodyWeightTab() {
  const { bodyWeights: entries } = useStore()
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  const latest = sorted[sorted.length - 1]

  const [date, setDate] = useState(localDateKey(new Date()))
  const [weight, setWeight] = useState(latest?.weightKg ?? 70)

  const existing = entries.find((e) => e.date === date)
  const chartData = sorted.map((e) => ({ label: formatDayMonth(parseDay(e.date)), value: e.weightKg }))

  return (
    <>
      <div className="card form">
        <label>
          {t('body.date')}
          <input type="date" value={date} max={localDateKey(new Date())} onChange={(e) => e.target.value && setDate(e.target.value)} />
        </label>
        <div className="body-weight-input">
          <NumberStepper label={t('body.weight')} unit="kg" step={0.1} min={20} value={weight} onChange={setWeight} />
        </div>
        <button type="button" className="btn btn-primary" onClick={() => bodyWeights.save(date, weight)}>
          {existing ? t('body.update') : t('common.save')}
        </button>
      </div>

      {sorted.length === 0 ? (
        <p className="muted">{t('body.none')}</p>
      ) : (
        <>
          {sorted.length > 1 && (
            <div className="card">
              <div className="chart">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 12, right: 12, bottom: 0, left: -12 }}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fill: 'var(--muted)', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} domain={['auto', 'auto']} />
                    <Tooltip
                      formatter={(v: number) => [`${formatNumber(v)} kg`, t('body.weight')]}
                      contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
                    />
                    <Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <ul className="list">
            {[...sorted].reverse().map((e) => (
              <li key={e.id} className="list-item">
                <div className="grow">
                  <div>{formatNumber(e.weightKg)} kg</div>
                  <div className="muted small">{formatDate(parseDay(e.date))}</div>
                </div>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setDate(e.date)
                    setWeight(e.weightKg)
                  }}
                >
                  {t('ex.edit')}
                </button>
                <button
                  type="button"
                  className="btn btn-danger-text"
                  aria-label={t('body.deleteEntry', { date: formatDate(parseDay(e.date)) })}
                  onClick={() => bodyWeights.remove(e.id)}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  )
}
