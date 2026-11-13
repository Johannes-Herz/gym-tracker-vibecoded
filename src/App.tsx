import { Fragment, lazy, Suspense, useEffect } from 'react'
import { t, useLang } from './i18n'
import { Navigate, Route, Routes } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import { useTabMemory } from './lib/useTabMemory'
import { usePendingSteps } from './lib/useNavSteps'
import ExercisesPage from './pages/ExercisesPage'
import HistoryPage from './pages/HistoryPage'
import NewWorkoutPage from './pages/NewWorkoutPage'
import TemplateEditPage from './pages/TemplateEditPage'
import TemplatesPage from './pages/TemplatesPage'
import SettingsPage from './pages/SettingsPage'
import WorkoutDetailPage from './pages/WorkoutDetailPage'

// Loaded on demand: pulls in the chart library.
const StatsPage = lazy(() => import('./pages/StatsPage'))
const ExerciseStatsPage = lazy(() => import('./pages/ExerciseStatsPage'))

export default function App() {
  useTabMemory()
  usePendingSteps()
  // Strings are looked up at render time; remounting on a language change makes
  // every screen pick up the new language immediately (no reload).
  const lang = useLang()
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  return (
    <Fragment key={lang}>
      <main className="page">
        <Suspense fallback={<p className="muted">{t('common.loading')}</p>}>
        <Routes>
          <Route path="/" element={<Navigate to="/verlauf" replace />} />
          <Route path="/verlauf" element={<HistoryPage />} />
          <Route path="/verlauf/neu" element={<NewWorkoutPage />} />
          <Route path="/verlauf/:id" element={<WorkoutDetailPage />} />
          <Route path="/uebungen" element={<ExercisesPage />} />
          <Route path="/uebungen/vorlagen" element={<TemplatesPage />} />
          <Route path="/uebungen/vorlagen/:id" element={<TemplateEditPage />} />
          <Route path="/statistik" element={<StatsPage />} />
          <Route path="/statistik/uebung/:id" element={<ExerciseStatsPage />} />
          <Route path="/einstellungen" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </main>
      <BottomNav />
    </Fragment>
  )
}
