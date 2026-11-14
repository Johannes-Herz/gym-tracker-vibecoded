import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ConfirmDialog from '../../components/ConfirmDialog'
import { t } from '../../i18n'
import { useSession } from '../../storage/session'
import { ACTIVE_ID, endTraining } from './training'

/** Banner in Verlauf while a training session is running. */
export function ActiveTrainingBanner() {
  const session = useSession()
  const [ending, setEnding] = useState(false)
  if (!session) return null
  return (
    <div className="card training-banner">
      <Link to={`/verlauf/${ACTIVE_ID}`} className="grow training-banner-link">
        {t('training.running')}
      </Link>
      <button type="button" className="btn" onClick={() => setEnding(true)}>
        {t('training.end')}
      </button>
      {ending && (
        <ConfirmDialog
          title={t('training.endTitle')}
          confirmLabel={t('training.end')}
          onConfirm={() => {
            endTraining()
            setEnding(false)
          }}
          onCancel={() => setEnding(false)}
        >
          {t('training.endText')}
        </ConfirmDialog>
      )}
    </div>
  )
}

/** Asked when a new workout is started while a training session is running. */
export function ActiveTrainingPrompt({ onRestart, onDismiss }: { onRestart: () => void; onDismiss: () => void }) {
  const navigate = useNavigate()
  return (
    <div className="overlay" onClick={onDismiss}>
      <div
        className="dialog"
        role="alertdialog"
        aria-modal="true"
        aria-label={t('training.activeTitle')}
        onClick={(e) => e.stopPropagation()}
      >
        <h2>{t('training.activeTitle')}</h2>
        <div className="dialog-body">{t('training.activeText')}</div>
        <div className="dialog-actions">
          <button type="button" className="btn btn-primary" onClick={() => navigate(`/verlauf/${ACTIVE_ID}`)}>
            {t('training.resume')}
          </button>
          <button type="button" className="btn btn-danger" onClick={onRestart}>
            {t('training.endAndRestart')}
          </button>
        </div>
      </div>
    </div>
  )
}
