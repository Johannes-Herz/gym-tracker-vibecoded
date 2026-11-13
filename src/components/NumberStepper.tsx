import { useState } from 'react'
import { formatNumber } from '../lib/format'
import { parseDecimal, stepValue } from '../lib/number'

interface Props {
  value: number
  step: number
  label: string
  unit?: string
  min?: number
  /** Show −/+ buttons (default true). Without them it is a plain input. */
  buttons?: boolean
  inputMode?: 'decimal' | 'numeric'
  onChange: (value: number) => void
}

export default function NumberStepper({
  value,
  step,
  label,
  unit,
  min = 0,
  buttons = true,
  inputMode = 'decimal',
  onChange,
}: Props) {
  const [draft, setDraft] = useState<string | null>(null)

  function handleInput(text: string) {
    setDraft(text)
    const n = parseDecimal(text)
    if (n !== null && n >= min) onChange(n)
  }

  function bump(delta: number) {
    setDraft(null)
    onChange(stepValue(value, delta, min))
  }

  return (
    <div className="stepper">
      {buttons && (
        <button type="button" className="btn" aria-label={`${label} verringern`} onClick={() => bump(-step)}>
          −
        </button>
      )}
      <input
        aria-label={label}
        inputMode={inputMode}
        value={draft ?? formatNumber(value)}
        onChange={(e) => handleInput(e.target.value)}
        onFocus={(e) => e.target.select()}
        onBlur={() => setDraft(null)}
      />
      {buttons && (
        <button type="button" className="btn" aria-label={`${label} erhöhen`} onClick={() => bump(step)}>
          +
        </button>
      )}
      {unit && <span className="muted small">{unit}</span>}
    </div>
  )
}
