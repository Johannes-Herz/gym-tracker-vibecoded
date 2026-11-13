import { formatNumber } from '../../lib/format'
import { formatLoad } from '../exercises/bodyweight'
import { compareWithPrevious, dayMonth, type Delta, type Session } from './exerciseStats'

interface Props {
  allSessions: Session[]
  rangeSessions: Session[]
  bodyweight: boolean
}

const ARROW: Record<Delta, string> = { up: '↑', down: '↓', same: '', new: '' }

function Value({ text, delta, what }: { text: string; delta: Delta; what: 'Gewicht' | 'Wiederholungen' }) {
  const meaning =
    delta === 'up'
      ? `mehr ${what} als zuvor`
      : delta === 'down'
        ? `weniger ${what} als zuvor`
        : delta === 'same'
          ? 'gleich wie zuvor'
          : 'neu'
  return (
    <span className={`delta delta-${delta}`} aria-label={`${text}, ${meaning}`}>
      {text}
      {ARROW[delta] && <span aria-hidden="true"> {ARROW[delta]}</span>}
    </span>
  )
}

export default function LastComparison({ allSessions, rangeSessions, bodyweight }: Props) {
  const result = compareWithPrevious(allSessions, rangeSessions)
  if (!result) return null

  return (
    <section className="card">
      <h2 className="block-title">Letztes Training ({dayMonth(result.last.startedAt)})</h2>
      <p className="muted small compare-sub">
        {result.prev ? `verglichen mit ${dayMonth(result.prev.startedAt)}` : 'Erstes Training'}
      </p>
      <ul className="compare-list">
        {result.rows.map((r) => (
          <li key={r.index}>
            <span className="muted">Satz {r.index + 1}</span>
            <Value text={formatLoad(r.weight, bodyweight)} delta={r.weightDelta} what="Gewicht" />
            <span className="muted" aria-hidden="true">
              ×
            </span>
            <Value text={`${formatNumber(r.reps)} Wdh.`} delta={r.repsDelta} what="Wiederholungen" />
            {r.weightDelta === 'new' && result.prev && <span className="tag">neu</span>}
          </li>
        ))}
      </ul>
    </section>
  )
}
