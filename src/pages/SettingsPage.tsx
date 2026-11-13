import { useRef, useState } from 'react'
import ConfirmDialog from '../components/ConfirmDialog'
import PageHeader from '../components/PageHeader'
import { backupFileName, parseImport, replaceAllData, serializeBackup } from '../storage/backup'
import type { AppData } from '../types'
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
  const fileInput = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<AppData | null>(null)
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)

  async function handleFile(file: File | undefined) {
    if (!file) return
    setMessage(null)
    const result = parseImport(await file.text())
    if (result.ok) setPending(result.data)
    else setMessage({ kind: 'error', text: result.error })
    if (fileInput.current) fileInput.current.value = ''
  }

  function confirmImport() {
    if (!pending) return
    replaceAllData(pending)
    setPending(null)
    setMessage({ kind: 'ok', text: 'Daten wurden importiert.' })
  }

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
        <p className="muted">Importiere eine zuvor exportierte JSON-Datei. Die aktuellen Daten werden dabei ersetzt.</p>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <button type="button" className="btn" onClick={() => fileInput.current?.click()}>
          Datei auswählen
        </button>
        {message && (
          <p className={message.kind === 'error' ? 'form-error' : 'muted'} role="status">
            {message.text}
          </p>
        )}
      </section>

      <section className="card settings-section">
        <h2>Gefahrenzone</h2>
        <p className="muted">Alle Daten dauerhaft löschen.</p>
      </section>

      {pending && (
        <ConfirmDialog
          title="Daten ersetzen?"
          confirmLabel="Importieren"
          danger
          onConfirm={confirmImport}
          onCancel={() => setPending(null)}
        >
          Das Backup enthält {pending.exercises.length} Übungen, {pending.workouts.length} Trainings,{' '}
          {pending.sets.length} Sätze und {pending.bodyWeights.length} Gewichtseinträge. Alle aktuellen
          Daten werden ersetzt.
        </ConfirmDialog>
      )}
    </>
  )
}
