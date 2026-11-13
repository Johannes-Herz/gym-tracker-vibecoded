import { formatSet } from '../exercises/bodyweight'
import { compareLast, dayMonth, type Session } from './exerciseStats'

export default function LastComparison({ sessions, bodyweight }: { sessions: Session[]; bodyweight: boolean }) {
  const result = compareLast(sessions)

  return (
    <section className="card">
      <h2 className="block-title">Letztes Training vs. davor</h2>
      {!result ? (
        <p className="muted">Kein vorheriges Training im Zeitraum.</p>
      ) : (
        <table className="compare">
          <thead>
            <tr className="muted small">
              <th>Satz</th>
              <th>{dayMonth(result.prev.startedAt)}</th>
              <th>{dayMonth(result.last.startedAt)}</th>
            </tr>
          </thead>
          <tbody>
            {result.rows.map((r) => (
              <tr key={r.index} className={r.improved ? 'improved' : undefined}>
                <td className="muted">{r.index + 1}</td>
                <td>{r.prev ? formatSet(r.prev.weight, r.prev.reps, bodyweight) : '–'}</td>
                <td>
                  {r.last ? formatSet(r.last.weight, r.last.reps, bodyweight) : '–'}
                  {r.improved && <span className="improved-mark" aria-label="Verbesserung"> ▲</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
