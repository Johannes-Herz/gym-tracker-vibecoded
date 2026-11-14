import { t } from '../i18n'
import { useState } from 'react'
import PageHeader from '../components/PageHeader'
import BodyWeightTab from '../features/stats/BodyWeightTab'
import { useNavigate } from 'react-router-dom'
import ExerciseSearch from '../features/exercises/ExerciseSearch'
import { sessionState } from '../lib/tabMemory'
import { useStore } from '../storage/store'

const TABS = [
  { key: 'exercise', label: 'stats.tabExercise' },
  { key: 'body', label: 'stats.tabBody' },
] as const

type TabKey = (typeof TABS)[number]['key']

export default function StatsPage() {
  const [tab, setTabState] = useState<TabKey>(() => sessionState.statsTab)
  const setTab = (next: TabKey) => {
    setTabState(next)
    sessionState.statsTab = next
  }

  return (
    <>
      <PageHeader title={t('nav.stats')} />
      <div className="segmented tabs" role="tablist">
        {TABS.map((tabDef) => (
          <button
            key={tabDef.key}
            type="button"
            role="tab"
            aria-selected={tabDef.key === tab}
            className={tabDef.key === tab ? 'btn active' : 'btn'}
            onClick={() => setTab(tabDef.key)}
          >
            {t(tabDef.label)}
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
    return <p className="muted">{t('stats.none')}</p>
  }
  return <ExerciseSearch exercises={trained} onPick={(e) => navigate(`/statistik/uebung/${e.id}`)} />
}
