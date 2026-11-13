import { Navigate, Route, Routes } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import ExercisesPage from './pages/ExercisesPage'
import HistoryPage from './pages/HistoryPage'
import PlaceholderPage from './pages/PlaceholderPage'
import TrainingPage from './pages/TrainingPage'
import WorkoutDetailPage from './pages/WorkoutDetailPage'

export default function App() {
  return (
    <>
      <main className="page">
        <Routes>
          <Route path="/" element={<TrainingPage />} />
          <Route path="/verlauf" element={<HistoryPage />} />
          <Route path="/verlauf/:id" element={<WorkoutDetailPage />} />
          <Route path="/uebungen" element={<ExercisesPage />} />
          <Route path="/statistik" element={<PlaceholderPage title="Statistik" />} />
          <Route path="/einstellungen" element={<PlaceholderPage title="Einstellungen" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <BottomNav />
    </>
  )
}
