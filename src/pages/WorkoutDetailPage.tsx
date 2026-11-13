import { useState } from 'react'
import { useParams } from 'react-router-dom'
import BackToHistory, { useBackToHistory } from '../components/BackToHistory'
import ConfirmDialog from '../components/ConfirmDialog'
import PageHeader from '../components/PageHeader'
import WorkoutEditor from '../features/workout/WorkoutEditor'
import { workouts } from '../storage/repo'
import { useStore } from '../storage/store'

export default function WorkoutDetailPage() {
  const { id = '' } = useParams()
  const back = useBackToHistory()
  const { workouts: all } = useStore()
  const [confirming, setConfirming] = useState(false)

  const exists = all.some((w) => w.id === id)

  function handleDelete() {
    workouts.remove(id)
    back()
  }

  return (
    <>
      <PageHeader
        title="Training"
        action={<BackToHistory />}
      />
      {exists ? (
        <>
          <WorkoutEditor workoutId={id} />
          <button type="button" className="btn btn-danger wide" onClick={() => setConfirming(true)}>
            Training löschen
          </button>
        </>
      ) : (
        <p className="muted">Training nicht gefunden.</p>
      )}
      {confirming && (
        <ConfirmDialog
          title="Training löschen?"
          confirmLabel="Löschen"
          danger
          onConfirm={handleDelete}
          onCancel={() => setConfirming(false)}
        >
          Das Training und alle Sätze werden endgültig gelöscht.
        </ConfirmDialog>
      )}
    </>
  )
}
