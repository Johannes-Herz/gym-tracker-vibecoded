import PageHeader from '../components/PageHeader'
import { backupFileName, serializeBackup } from '../storage/backup'
import { useStore } from '../storage/store'

function downloadJson(text: string, fileName: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export default function SettingsPage() {
  const data = useStore()

  function handleExport() {
    downloadJson(serializeBackup(data), backupFileName())
  }

  return (
    <>
      <PageHeader title="Einstellungen" />

      <section className="card settings-section">
        <h2>Daten sichern</h2>
        <p className="muted">Exportiere alle Daten als JSON-Datei.</p>
        <button type="button" className="btn btn-primary" onClick={handleExport}>
          Daten exportieren
        </button>
      </section>

      <section className="card settings-section">
        <h2>Daten wiederherstellen</h2>
        <p className="muted">Importiere eine zuvor exportierte JSON-Datei.</p>
      </section>

      <section className="card settings-section">
        <h2>Gefahrenzone</h2>
        <p className="muted">Alle Daten dauerhaft löschen.</p>
      </section>
    </>
  )
}
