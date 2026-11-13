import { useLayoutEffect, useRef, useState } from 'react'
import { t } from '../../i18n'
import { usePrefersDark } from '../../lib/usePrefersDark'
import { formatLoad, formatLoadLong } from '../exercises/bodyweight'
import { axisLabels, cellKey, dayMonth, heatmapData, type Session } from './exerciseStats'
import { heatColor, heatGradientCss } from './heatColor'

const MAX_DOTS = 5
const LEGEND_TICKS = [
  { label: '5', at: 0 },
  { label: '8', at: 37.5 },
  { label: '13+', at: 100 },
]

interface Props {
  sessions: Session[]
  bodyweight: boolean
}

export default function RepHeatmap({ sessions, bodyweight }: Props) {
  const { weights, cells } = heatmapData(sessions)
  const labels = axisLabels(sessions)
  const scroller = useRef<HTMLDivElement>(null)
  const dark = usePrefersDark()
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
      <h2 className="block-title">{t('heat.title')}</h2>
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
                  const color = heatColor(cell.best, dark)
                  return (
                    <td key={s.workoutId}>
                      <button
                        type="button"
                        className={isSelected ? 'heat-cell selected' : 'heat-cell'}
                        style={{ background: color.bg, color: color.fg }}
                        aria-label={t('heat.cellLabel', { date: dayMonth(s.startedAt), load: formatLoad(w, bodyweight), reps: cell.reps.join(', ') })}
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
          {dayMonth(selectedSession.startedAt)} ·{' '}
          {bodyweight ? formatLoadLong(selected.weight) : formatLoad(selected.weight, false)}:{' '}
          {selectedCell.reps.join(' · ')}
        </p>
      ) : (
        <p className="heat-detail muted small">{t('heat.hint')}</p>
      )}

      <div className="heat-legend muted small" aria-label={t('heat.legendLabel')}>
        <span>{t('block.reps')}</span>
        <div className="heat-scale">
          <div className="heat-bar" style={{ background: heatGradientCss(dark) }} />
          <div className="heat-ticks">
            {LEGEND_TICKS.map((tick) => (
              <span key={tick.label} style={{ left: `${tick.at}%` }}>
                {tick.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
