import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import ExercisesPage from './pages/ExercisesPage'
import HistoryPage from './pages/HistoryPage'
import SettingsPage from './pages/SettingsPage'
import TrainingPage from './pages/TrainingPage'
import WorkoutDetailPage from './pages/WorkoutDetailPage'

// Loaded on demand: pulls in the chart library.
const StatsPage = lazy(() => import('./pages/StatsPage'))

export default function App() {
  return (
    <>
      <main className="page">
        <Suspense fallback={<p className="muted">Lädt…</p>}>
        <Routes>
          <Route path="/" element={<TrainingPage />} />
          <Route path="/verlauf" element={<HistoryPage />} />
          <Route path="/verlauf/:id" element={<WorkoutDetailPage />} />
          <Route path="/uebungen" element={<ExercisesPage />} />
          <Route path="/statistik" element={<StatsPage />} />
          <Route path="/einstellungen" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </main>
      <BottomNav />
    </>
  )
}
