import { useLayoutEffect, useRef, useState } from 'react'
import { formatLoad } from '../exercises/bodyweight'
import { axisLabels, cellKey, dayMonth, heatmapData, repLevel, type Session } from './exerciseStats'

const MAX_DOTS = 5
const LEGEND = ['≤5', '6', '7', '8+']

interface Props {
  sessions: Session[]
  bodyweight: boolean
}

export default function RepHeatmap({ sessions, bodyweight }: Props) {
  const { weights, cells } = heatmapData(sessions)
  const labels = axisLabels(sessions)
  const scroller = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState<{ weight: number; workoutId: string } | null>(null)

  // Start at the newest session (right edge).
  useLayoutEffect(() => {
    const el = scroller.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [sessions.length])

  const selectedCell = selected ? cells.get(cellKey(selected.weight, selected.workoutId)) : undefined
  const selectedSession = selected ? sessions.find((s) => s.workoutId === selected.workoutId) : undefined

  return (
    <section className="card">
      <h2 className="block-title">Wiederholungen je Gewicht</h2>
      <div className="heatmap-scroll" ref={scroller}>
        <table className="heatmap">
          <tbody>
            {weights.map((w) => (
              <tr key={w}>
                <th scope="row" className="heat-label">
                  {formatLoad(w, bodyweight)}
                </th>
                {sessions.map((s) => {
                  const cell = cells.get(cellKey(w, s.workoutId))
                  if (!cell) return <td key={s.workoutId} />
                  const isSelected = selected?.weight === w && selected.workoutId === s.workoutId
                  const extra = cell.reps.length - MAX_DOTS
                  return (
                    <td key={s.workoutId}>
                      <button
                        type="button"
                        className={`heat-cell lv-${repLevel(cell.best)}${isSelected ? ' selected' : ''}`}
                        aria-label={`${dayMonth(s.startedAt)} ${formatLoad(w, bodyweight)}: ${cell.reps.join(', ')} Wiederholungen`}
                        aria-pressed={isSelected}
                        onClick={() => setSelected(isSelected ? null : { weight: w, workoutId: s.workoutId })}
                      >
                        <span className="heat-reps">{cell.best}</span>
                        <span className="heat-dots" aria-hidden="true">
                          {'•'.repeat(Math.min(cell.reps.length, MAX_DOTS))}
                          {extra > 0 && `+${extra}`}
                        </span>
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th className="heat-label" />
              {sessions.map((s, i) => (
                <td key={s.workoutId} className="heat-axis muted small">
                  {labels[i]}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      {selectedCell && selectedSession && selected ? (
        <p className="heat-detail">
          {dayMonth(selectedSession.startedAt)} · {formatLoad(selected.weight, bodyweight)}:{' '}
          {selectedCell.reps.join(' · ')}
        </p>
      ) : (
        <p className="heat-detail muted small">Tippe auf ein Feld für die Sätze.</p>
      )}

      <div className="heat-legend muted small" aria-label="Legende Wiederholungen">
        Wdh.
        {LEGEND.map((label, i) => (
          <span key={label} className={`heat-swatch lv-${i}`}>
            {label}
          </span>
        ))}
      </div>
    </section>
  )
}
