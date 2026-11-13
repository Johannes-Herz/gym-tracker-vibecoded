import { useEffect, useState } from 'react'
import { ADJUST_MS, PRESETS_SEC, formatRemaining } from './timerCore'
import { timerStore, useTimer } from './timerStore'

/**
 * Docked bar above the bottom nav plus a bottom sheet. Mounted by the workout
 * editor only; the timer state itself lives in `timerStore`, so closing the
 * sheet (or leaving the editor) never stops it.
 */
export default function RestTimer() {
  const [open, setOpen] = useState(false)
  const { state, remainingMs } = useTimer()

  // Finish signal only while an editor is mounted; the bar needs room at the page bottom.
  useEffect(() => {
    timerStore.setActive(true)
    document.body.classList.add('has-timer-bar')
    return () => {
      timerStore.setActive(false)
      document.body.classList.remove('has-timer-bar')
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const { status } = state
  const time = formatRemaining(remainingMs)
  const barLabel =
    status === 'idle' && remainingMs === 0
      ? 'Pause-Timer'
      : status === 'finished'
        ? 'Zeit abgelaufen'
        : time

  return (
    <>
      <div className={`timer-bar ${status}`}>
        <button
          type="button"
          className="timer-bar-btn"
          aria-label={`Pause-Timer öffnen${status === 'idle' ? '' : `, ${barLabel}`}`}
          onClick={() => setOpen(true)}
        >
          <span aria-hidden="true">⏱</span>
          <span className="timer-bar-time">{barLabel}</span>
          {status === 'paused' && <span className="muted small">pausiert</span>}
        </button>
      </div>

      {open && (
        <div className="timer-backdrop" onClick={() => setOpen(false)}>
          <div
            className={`timer-sheet ${status}`}
            role="dialog"
            aria-modal="true"
            aria-label="Pause-Timer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="timer-sheet-head">
              <h2>Pause-Timer</h2>
              <button type="button" className="btn" onClick={() => setOpen(false)}>
                Schließen
              </button>
            </div>

            <div className="timer-display-row">
              <button
                type="button"
                className="btn timer-adjust"
                aria-label="30 Sekunden weniger"
                onClick={() => timerStore.adjust(-ADJUST_MS)}
              >
                −30 s
              </button>
              <div className="timer-display" role="timer" aria-live="off">
                {time}
              </div>
              <button
                type="button"
                className="btn timer-adjust"
                aria-label="30 Sekunden mehr"
                onClick={() => timerStore.adjust(ADJUST_MS)}
              >
                +30 s
              </button>
            </div>
            <p className="timer-status muted small" aria-live="polite">
              {status === 'finished' ? 'Zeit abgelaufen' : status === 'paused' ? 'Pausiert' : ' '}
            </p>

            <div className="timer-presets">
              {PRESETS_SEC.map((sec) => (
                <button key={sec} type="button" className="btn" onClick={() => timerStore.start(sec)}>
                  {sec / 60} min
                </button>
              ))}
            </div>

            <div className="timer-controls">
              {status === 'running' && (
                <button type="button" className="btn grow" onClick={() => timerStore.pause()}>
                  Pause
                </button>
              )}
              {status === 'paused' && (
                <button type="button" className="btn btn-primary grow" onClick={() => timerStore.resume()}>
                  Weiter
                </button>
              )}
              {status === 'idle' && (
                <button
                  type="button"
                  className="btn btn-primary grow"
                  disabled={remainingMs === 0}
                  onClick={() => timerStore.resume()}
                >
                  Start
                </button>
              )}
              <button
                type="button"
                className="btn grow"
                disabled={status === 'idle' && remainingMs === 0}
                onClick={() => timerStore.stop()}
              >
                {status === 'finished' ? 'Zurücksetzen' : 'Stopp'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
