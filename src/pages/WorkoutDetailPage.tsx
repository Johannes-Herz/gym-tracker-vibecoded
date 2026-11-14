import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import BackToHistory from '../components/BackToHistory'
import { useGoUp } from '../lib/useNavSteps'
import ConfirmDialog from '../components/ConfirmDialog'
import { t } from '../i18n'
import PageHeader from '../components/PageHeader'
import WorkoutEditor from '../features/workout/WorkoutEditor'
import { workouts } from '../storage/repo'
import { useSession } from '../storage/session'
import { useStore } from '../storage/store'
import { ACTIVE_ID, discardTraining, dropDraft, endTraining, endTrainingIfEmpty } from '../features/workout/training'

// Workout whose editor is currently open. Lets the leave-cleanup skip the
// immediate remount React StrictMode does in development.
let openEditorId: string | null = null

export default function WorkoutDetailPage() {
  const { id = '' } = useParams()
  const back = useGoUp()
  const { workouts: all } = useStore()
  const [confirming, setConfirming] = useState(false)

  const session = useSession()

  // The running workout (by route or by id) is edited through the training session;
  // any other workout is a past one and does not touch the session.
  const inSession = id === ACTIVE_ID || (session?.workoutId !== undefined && id === session.workoutId)
  const exists = inSession ? session !== null : all.some((w) => w.id === id)

  // Leaving the editor: empty workouts/sessions are never kept, suggestions of a past workout are dropped.
  useEffect(() => {
    openEditorId = id
    return () => {
      if (openEditorId === id) openEditorId = null
      setTimeout(() => {
        if (openEditorId === id) return
        workouts.removeIfEmpty(id)
        dropDraft(id)
        endTrainingIfEmpty()
      }, 0)
    }
  }, [id])

  function handleDelete() {
    if (inSession) discardTraining()
    else workouts.remove(id)
    back()
  }

  function handleFinish() {
    endTraining()
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
          <WorkoutEditor scope={inSession ? null : id} />
          {inSession && (
            <button type="button" className="btn btn-primary wide" onClick={handleFinish}>
              {t('workout.finish')}
            </button>
          )}
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
