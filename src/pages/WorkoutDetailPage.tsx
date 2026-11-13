import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import BackToHistory from '../components/BackToHistory'
import { useGoUp } from '../lib/useNavSteps'
import ConfirmDialog from '../components/ConfirmDialog'
import { t } from '../i18n'
import PageHeader from '../components/PageHeader'
import WorkoutEditor from '../features/workout/WorkoutEditor'
import { workouts } from '../storage/repo'
import { useStore } from '../storage/store'

// Workout whose editor is currently open. Lets the leave-cleanup skip the
// immediate remount React StrictMode does in development.
let openEditorId: string | null = null

export default function WorkoutDetailPage() {
  const { id = '' } = useParams()
  const back = useGoUp()
  const { workouts: all } = useStore()
  const [confirming, setConfirming] = useState(false)

  const exists = all.some((w) => w.id === id)

  // Leaving the editor with no sets left removes the workout: empty workouts are never kept.
  useEffect(() => {
    openEditorId = id
    return () => {
      if (openEditorId === id) openEditorId = null
      setTimeout(() => {
        if (openEditorId !== id) workouts.removeIfEmpty(id)
      }, 0)
    }
  }, [id])

  function handleDelete() {
    workouts.remove(id)
    back()
  }

  return (
    <>
      <PageHeader
        title={t('detail.title')}
        action={<BackToHistory />}
      />
      {exists ? (
        <>
          <WorkoutEditor workoutId={id} />
          <button type="button" className="btn btn-danger wide" onClick={() => setConfirming(true)}>
            {t('detail.delete')}
          </button>
        </>
      ) : (
        <p className="muted">{t('workout.notFound')}</p>
      )}
      {confirming && (
        <ConfirmDialog
          title={t('detail.deleteTitle')}
          confirmLabel={t('common.delete')}
          danger
          onConfirm={handleDelete}
          onCancel={() => setConfirming(false)}
        >
          {t('detail.deleteText')}
        </ConfirmDialog>
      )}
    </>
  )
}
