import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import { useTabMemory } from './lib/useTabMemory'
import ExercisesPage from './pages/ExercisesPage'
import HistoryPage from './pages/HistoryPage'
import NewWorkoutPage from './pages/NewWorkoutPage'
import SettingsPage from './pages/SettingsPage'
import WorkoutDetailPage from './pages/WorkoutDetailPage'

// Loaded on demand: pulls in the chart library.
const StatsPage = lazy(() => import('./pages/StatsPage'))
const ExerciseStatsPage = lazy(() => import('./pages/ExerciseStatsPage'))

export default function App() {
  useTabMemory()

  return (
    <>
      <main className="page">
        <Suspense fallback={<p className="muted">Lädt…</p>}>
        <Routes>
          <Route path="/" element={<Navigate to="/verlauf" replace />} />
          <Route path="/verlauf" element={<HistoryPage />} />
          <Route path="/verlauf/neu" element={<NewWorkoutPage />} />
          <Route path="/verlauf/:id" element={<WorkoutDetailPage />} />
          <Route path="/uebungen" element={<ExercisesPage />} />
          <Route path="/statistik" element={<StatsPage />} />
          <Route path="/statistik/uebung/:id" element={<ExerciseStatsPage />} />
          <Route path="/einstellungen" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </main>
      <BottomNav />
    </>
  )
}
