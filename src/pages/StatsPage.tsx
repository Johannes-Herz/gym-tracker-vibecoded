import { useState } from 'react'
import PageHeader from '../components/PageHeader'
import BodyWeightTab from '../features/stats/BodyWeightTab'
import { useNavigate } from 'react-router-dom'
import ExerciseSearch from '../features/exercises/ExerciseSearch'
import { sessionState } from '../lib/tabMemory'
import { useStore } from '../storage/store'

const TABS = [
  { key: 'exercise', label: 'Übung' },
  { key: 'body', label: 'Körper' },
] as const

type TabKey = (typeof TABS)[number]['key']

export default function StatsPage() {
  const [tab, setTabState] = useState<TabKey>(() => sessionState.statsTab)
  const setTab = (t: TabKey) => {
    setTabState(t)
    sessionState.statsTab = t
  }

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
      {tab === 'exercise' && <TrainedExercises />}
      {tab === 'body' && <BodyWeightTab />}
    </>
  )
}

/** Trained exercises (including hidden ones, so their stats stay reachable). */
function TrainedExercises() {
  const data = useStore()
  const navigate = useNavigate()
  const used = new Set(data.sets.map((s) => s.exerciseId))
  const trained = data.exercises.filter((e) => used.has(e.id))

  if (trained.length === 0) {
    return <p className="muted">Noch keine Daten. Trage zuerst ein Training ein.</p>
  }
  return <ExerciseSearch exercises={trained} onPick={(e) => navigate(`/statistik/uebung/${e.id}`)} />
}
