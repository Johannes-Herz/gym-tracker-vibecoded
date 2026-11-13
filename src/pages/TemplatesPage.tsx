import { Link, useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import ExerciseViewToggle from '../features/templates/ExerciseViewToggle'
import { useStore } from '../storage/store'

export default function TemplatesPage() {
  const { templates, exercises } = useStore()
  const navigate = useNavigate()
  const sorted = [...templates].sort((a, b) => a.name.localeCompare(b.name, 'de'))

  return (
    <>
      <PageHeader
        title="Übungen"
        action={
          <button type="button" className="btn btn-primary" onClick={() => navigate('/uebungen/vorlagen/neu')}>
            + Neu
          </button>
        }
      />
      <ExerciseViewToggle view="templates" />
      {sorted.length === 0 && (
        <p className="muted">
          Noch keine Vorlagen. Lege eine an oder speichere ein Training in der Trainingsansicht als Vorlage.
        </p>
      )}
      <ul className="list">
        {sorted.map((t) => {
          const names = t.exerciseIds.map((id) => exercises.find((e) => e.id === id)?.name).filter(Boolean)
          return (
            <li key={t.id}>
              <Link to={`/uebungen/vorlagen/${t.id}`} className="list-item history-item">
                <div className="grow">
                  <div>{t.name}</div>
                  <div className="muted small">
                    {names.length === 0 ? 'Keine Übungen' : `${names.length} Übungen · ${names.join(', ')}`}
                  </div>
                </div>
                <span aria-hidden="true" className="muted">›</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </>
  )
}
