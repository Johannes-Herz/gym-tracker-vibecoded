import PageHeader from '../components/PageHeader'

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Einstellungen" />

      <section className="card settings-section">
        <h2>Daten sichern</h2>
        <p className="muted">Exportiere alle Daten als JSON-Datei.</p>
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
