import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatNumber } from '../../lib/format'
import { dayMonth } from './exerciseStats'

interface Props {
  points: { startedAt: string; value: number }[]
  label: string
  unit: string
}

/** Compact single-line trend chart. */
export default function TrendChart({ points, label, unit }: Props) {
  const data = points.map((p) => ({ label: dayMonth(p.startedAt), value: p.value }))
  return (
    <div className="chart chart-compact">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fill: 'var(--muted)', fontSize: 11 }} />
          <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} domain={['auto', 'auto']} />
          <Tooltip
            formatter={(v: number) => [`${formatNumber(v)} ${unit}`, label]}
            contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
          />
          <Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
