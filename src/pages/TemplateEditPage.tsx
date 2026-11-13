import { useParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import TemplateForm from '../features/templates/TemplateForm'
import { useGoUp } from '../lib/useNavSteps'
import { useStore } from '../storage/store'

/** Create (`/uebungen/vorlagen/neu`) or edit (`/uebungen/vorlagen/:id`) a template. */
export default function TemplateEditPage() {
  const { id = '' } = useParams()
  const up = useGoUp()
  const { templates } = useStore()
  const template = id === 'neu' ? undefined : templates.find((t) => t.id === id)

  return (
    <>
      <PageHeader
        title={template ? 'Vorlage' : 'Neue Vorlage'}
        action={
          <button type="button" className="btn back-link" onClick={up}>
            ‹ Vorlagen
          </button>
        }
      />
      {id !== 'neu' && !template ? (
        <p className="muted">Vorlage nicht gefunden.</p>
      ) : (
        <TemplateForm key={id} template={template} onDone={up} />
      )}
    </>
  )
}
