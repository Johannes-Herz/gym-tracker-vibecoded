import { useState } from 'react'
import { formatNumber } from '../lib/format'
import { parseDecimal, stepValue } from '../lib/number'

interface Props {
  /** undefined shows an empty input (only useful together with onClear). */
  value: number | undefined
  step: number
  label: string
  unit?: string
  min?: number
  /** Show −/+ buttons (default true). Without them it is a plain input. */
  buttons?: boolean
  inputMode?: 'decimal' | 'numeric'
  placeholder?: string
  onChange: (value: number) => void
  /** If set, clearing the input is allowed and reported here. */
  onClear?: () => void
}

export default function NumberStepper({
  value,
  step,
  label,
  unit,
  min = 0,
  buttons = true,
  inputMode = 'decimal',
  placeholder,
  onChange,
  onClear,
}: Props) {
  const [draft, setDraft] = useState<string | null>(null)

  function handleInput(text: string) {
    setDraft(text)
    const n = parseDecimal(text)
    if (n !== null && n >= min) onChange(n)
    else if (onClear && text.trim() === '') onClear()
  }

  function bump(delta: number) {
    setDraft(null)
    onChange(stepValue(value ?? 0, delta, min))
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
        placeholder={placeholder}
        value={draft ?? (value === undefined ? '' : formatNumber(value))}
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
