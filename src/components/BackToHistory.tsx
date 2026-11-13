import { t } from '../i18n'
import { useGoUp } from '../lib/useNavSteps'

/** Back arrow for pages inside Verlauf: goes up to the Verlauf overview. */
export default function BackToHistory() {
  const up = useGoUp()
  return (
    <button type="button" className="btn back-link" onClick={up}>
      {t('back.history')}
    </button>
  )
}
