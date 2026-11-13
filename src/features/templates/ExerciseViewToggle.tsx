import { useNavigate } from 'react-router-dom'

const VIEWS = [
  { key: 'exercises', label: 'Übungen', to: '/uebungen' },
  { key: 'templates', label: 'Vorlagen', to: '/uebungen/vorlagen' },
] as const

/** Switches between the exercise list and the template list inside the Übungen tab. */
export default function ExerciseViewToggle({ view }: { view: 'exercises' | 'templates' }) {
  const navigate = useNavigate()
  return (
    <div className="segmented tabs" role="tablist">
      {VIEWS.map((v) => (
        <button
          key={v.key}
          type="button"
          role="tab"
          aria-selected={v.key === view}
          className={v.key === view ? 'btn active' : 'btn'}
          onClick={() => v.key !== view && navigate(v.to, { replace: true })}
        >
          {v.label}
        </button>
      ))}
    </div>
  )
}
