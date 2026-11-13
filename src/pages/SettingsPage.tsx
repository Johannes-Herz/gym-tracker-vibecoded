import { useRef, useState } from 'react'
import ConfirmDialog from '../components/ConfirmDialog'
import { buildDemoData, hasUserData } from '../demo/demoData'
import PageHeader from '../components/PageHeader'
import { backupFileName, deleteAllData, parseImport, replaceAllData, serializeBackup } from '../storage/backup'
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
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmDemo, setConfirmDemo] = useState(false)
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)

  async function handleFile(file: File | undefined) {
    if (!file) return
    setMessage(null)
    const result = parseImport(await file.text())
    if (result.ok) setPending(result.data)
    else setMessage({ kind: 'error', text: result.error })
    if (fileInput.current) fileInput.current.value = ''
  }

  function handleDeleteAll() {
    deleteAllData()
    setConfirmDelete(false)
    setMessage({ kind: 'ok', text: 'Alle Daten wurden gelöscht.' })
  }

  function loadDemo() {
    const demo = buildDemoData({ builtins: data.exercises.filter((e) => e.source === 'builtin') })
    replaceAllData(demo)
    setConfirmDemo(false)
    setMessage({ kind: 'ok', text: `Demo-Daten geladen: ${demo.workouts.length} Trainings.` })
  }

  function handleDemo() {
    setMessage(null)
    if (hasUserData(data)) setConfirmDemo(true)
    else loadDemo()
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

      {message && (
        <p className={message.kind === 'error' ? 'card form-error' : 'card'} role="status">
          {message.text}
        </p>
      )}

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
      </section>

      <section className="card settings-section">
        <h2>Demo-Daten</h2>
        <p className="muted">
          Füllt die App mit ca. 10 Wochen Beispieltrainings und Körpergewicht – zum Ausprobieren von
          Verlauf und Statistik.
        </p>
        <button type="button" className="btn" onClick={handleDemo}>
          Demo-Daten laden
        </button>
      </section>

      <section className="card settings-section">
        <h2>Gefahrenzone</h2>
        <p className="muted">Alle Daten dauerhaft löschen. Das kann nicht rückgängig gemacht werden.</p>
        <button type="button" className="btn btn-danger" onClick={() => setConfirmDelete(true)}>
          Alle Daten löschen
        </button>
      </section>

      {confirmDelete && (
        <ConfirmDialog
          title="Alle Daten löschen?"
          confirmLabel="Endgültig löschen"
          danger
          onConfirm={handleDeleteAll}
          onCancel={() => setConfirmDelete(false)}
        >
          Alle Übungen, Trainings und Körpergewichte werden dauerhaft gelöscht. Exportiere vorher ein
          Backup, wenn du die Daten behalten möchtest.
        </ConfirmDialog>
      )}

      {confirmDemo && (
        <ConfirmDialog
          title="Daten ersetzen?"
          confirmLabel="Ersetzen"
          danger
          onConfirm={loadDemo}
          onCancel={() => setConfirmDemo(false)}
        >
          Alle aktuellen Daten werden durch Demo-Daten ersetzt. Exportiere vorher ein Backup, wenn du
          sie behalten möchtest.
        </ConfirmDialog>
      )}

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
