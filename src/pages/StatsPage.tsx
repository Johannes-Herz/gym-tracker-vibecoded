import { useState } from 'react'
import PageHeader from '../components/PageHeader'
import ExerciseProgressTab from '../features/stats/ExerciseProgressTab'

const TABS = [
  { key: 'exercise', label: 'Übung' },
  { key: 'groups', label: 'Gruppen' },
  { key: 'body', label: 'Körper' },
  { key: 'calendar', label: 'Kalender' },
] as const

type TabKey = (typeof TABS)[number]['key']

export default function StatsPage() {
  const [tab, setTab] = useState<TabKey>('exercise')

  return (
    <>
      <PageHeader title="Statistik" />
      <div className="segmented tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={t.key === tab}
            className={t.key === tab ? 'btn active' : 'btn'}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'exercise' ? <ExerciseProgressTab /> : <p className="muted">Kommt bald.</p>}
    </>
  )
}
