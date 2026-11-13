import { Link, useNavigate } from 'react-router-dom'
import { exerciseName } from '../features/exercises/exerciseName'
import { LOCALES, getLang, t, tp } from '../i18n'
import PageHeader from '../components/PageHeader'
import ExerciseViewToggle from '../features/templates/ExerciseViewToggle'
import { useStore } from '../storage/store'

export default function TemplatesPage() {
  const { templates, exercises } = useStore()
  const navigate = useNavigate()
  const sorted = [...templates].sort((a, b) => a.name.localeCompare(b.name, LOCALES[getLang()]))

  return (
    <>
      <PageHeader
        title={t('nav.exercises')}
        action={
          <button type="button" className="btn btn-primary" onClick={() => navigate('/uebungen/vorlagen/neu')}>
            {t('common.new')}
          </button>
        }
      />
      <ExerciseViewToggle view="templates" />
      {sorted.length === 0 && (
        <p className="muted">{t('tpl.none')}</p>
      )}
      <ul className="list">
        {sorted.map((tpl) => {
          const names = tpl.exerciseIds
            .map((id) => exercises.find((e) => e.id === id))
            .filter((e) => e !== undefined)
            .map((e) => exerciseName(e))
          return (
            <li key={tpl.id}>
              <Link to={`/uebungen/vorlagen/${tpl.id}`} className="list-item history-item">
                <div className="grow">
                  <div>{tpl.name}</div>
                  <div className="muted small">
                    {names.length === 0
                      ? t('common.noExercises')
                      : t('tpl.summary', { count: tp('count.exercises', names.length), names: names.join(', ') })}
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
