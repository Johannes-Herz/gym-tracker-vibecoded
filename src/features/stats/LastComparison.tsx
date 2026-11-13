import { formatNumber, formatWeekdayDayMonth } from '../../lib/format'
import { formatLoad } from '../exercises/bodyweight'
import { comparisonColumns, type ComparisonCell, type ComparisonColumn, type Delta, type Session } from './exerciseStats'

interface Props {
  allSessions: Session[]
  rangeSessions: Session[]
  bodyweight: boolean
}


/** "Mi, 12.11." */
function sessionDate(iso: string): string {
  return formatWeekdayDayMonth(new Date(iso))
}

const ARROW: Partial<Record<Delta, string>> = { up: '↑', down: '↓' }

function Value({ text, delta, what }: { text: string; delta: Delta; what: string }) {
  const meaning = delta === 'up' ? `mehr ${what}` : delta === 'down' ? `weniger ${what}` : ''
  return (
    <span className={`delta delta-${delta}`} aria-label={meaning ? `${text}, ${meaning}` : text}>
      {text}
      {ARROW[delta] && <span aria-hidden="true">{ARROW[delta]}</span>}
    </span>
  )
}

function Cell({ cell, bodyweight }: { cell: ComparisonCell | undefined; bodyweight: boolean }) {
  if (!cell) return <td className="muted">–</td>
  return (
    <td>
      <Value text={formatLoad(cell.weight, bodyweight)} delta={cell.weightDelta} what="Gewicht" />
      <span className="muted"> × </span>
      <Value text={formatNumber(cell.reps)} delta={cell.repsDelta} what="Wiederholungen" />
      {cell.weightDelta === 'new' && <span className="tag">neu</span>}
    </td>
  )
}

export default function LastComparison({ allSessions, rangeSessions, bodyweight }: Props) {
  const result = comparisonColumns(allSessions, rangeSessions)
  if (!result) return null
  const columns: [string, ComparisonColumn][] = [['Letztes Training', result.last]]
  if (result.prev) columns.push(['Davor', result.prev])

  return (
    <section className="card">
      <h2 className="block-title">Letztes Training vs. davor</h2>
      <table className="compare">
        <thead>
          <tr>
            <th className="muted small">Satz</th>
            {columns.map(([title, col]) => (
              <th key={title}>
                <div className="small">{title}</div>
                <div className="muted small">{sessionDate(col.session.startedAt)}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: result.rows }, (_, i) => (
            <tr key={i}>
              <td className="muted">{i + 1}</td>
              {columns.map(([title, col]) => (
                <Cell key={title} cell={col.cells[i]} bodyweight={bodyweight} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
