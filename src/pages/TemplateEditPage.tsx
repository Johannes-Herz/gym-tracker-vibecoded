import { useParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { t } from '../i18n'
import TemplateForm from '../features/templates/TemplateForm'
import { useGoUp } from '../lib/useNavSteps'
import { useStore } from '../storage/store'

/** Create (`/uebungen/vorlagen/neu`) or edit (`/uebungen/vorlagen/:id`) a template. */
export default function TemplateEditPage() {
  const { id = '' } = useParams()
  const up = useGoUp()
  const { templates } = useStore()
  const template = id === 'neu' ? undefined : templates.find((tpl) => tpl.id === id)

  return (
    <>
      <PageHeader
        title={template ? t('tpl.title') : t('tpl.newTitle')}
        action={
          <button type="button" className="btn back-link" onClick={up}>
            {t('tpl.back')}
          </button>
        }
      />
      {id !== 'neu' && !template ? (
        <p className="muted">{t('tpl.notFound')}</p>
      ) : (
        <TemplateForm key={id} template={template} onDone={up} />
      )}
    </>
  )
}
