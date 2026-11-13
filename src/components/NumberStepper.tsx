import { useState } from 'react'
import { formatNumber } from '../lib/format'

interface Props {
  value: number
  step: number
  label: string
  unit?: string
  min?: number
  onChange: (value: number) => void
}

const round = (n: number) => Math.round(n * 100) / 100

export default function NumberStepper({ value, step, label, unit, min = 0, onChange }: Props) {
  const [draft, setDraft] = useState<string | null>(null)

  function handleInput(text: string) {
    setDraft(text)
    const n = Number(text.replace(',', '.'))
    if (text.trim() !== '' && Number.isFinite(n) && n >= min) onChange(round(n))
  }

  function bump(delta: number) {
    setDraft(null)
    onChange(Math.max(min, round(value + delta)))
  }

  return (
    <div className="stepper">
      <button type="button" className="btn" aria-label={`${label} verringern`} onClick={() => bump(-step)}>
        −
      </button>
      <input
        aria-label={label}
        inputMode="decimal"
        value={draft ?? formatNumber(value)}
        onChange={(e) => handleInput(e.target.value)}
        onFocus={(e) => e.target.select()}
        onBlur={() => setDraft(null)}
      />
      <button type="button" className="btn" aria-label={`${label} erhöhen`} onClick={() => bump(step)}>
        +
      </button>
      {unit && <span className="muted small">{unit}</span>}
    </div>
  )
}
