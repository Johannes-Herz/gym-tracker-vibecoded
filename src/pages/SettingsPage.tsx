import { useRef, useState } from 'react'
import ConfirmDialog from '../components/ConfirmDialog'
import { buildDemoData, hasUserData } from '../demo/demoData'
import PageHeader from '../components/PageHeader'
import { LANGUAGE_NAMES, getLang, setLang, t } from '../i18n'
import { LANGUAGES } from '../storage/preferences'
import { buildBackupFile, canShareBackupFile, deleteAllData, parseImport, replaceAllData, shareBackup, shareErrorReason } from '../storage/backup'
import type { AppData } from '../types'
import { useStore } from '../storage/store'

function downloadFile(file: File) {
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
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
    setMessage({ kind: 'ok', text: t('settings.deleted') })
  }

  function loadDemo() {
    const demo = buildDemoData({ builtins: data.exercises.filter((e) => e.source === 'builtin') })
    replaceAllData(demo)
    setConfirmDemo(false)
    setMessage({ kind: 'ok', text: t('settings.demoLoaded', { n: demo.workouts.length }) })
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
    setMessage({ kind: 'ok', text: t('settings.imported') })
  }

  function handleExport() {
    downloadFile(buildBackupFile(data))
  }

  async function handleShare() {
    setMessage(null)
    try {
      await shareBackup(data) // dismissing the share sheet resolves quietly
    } catch (e) {
      console.error('Share failed', e)
      setMessage({ kind: 'error', text: t('settings.share.failed', { reason: shareErrorReason(e) }) })
    }
  }

  const lang = getLang()

  return (
    <>
      <PageHeader title={t('settings.title')} />

      {message && (
        <p className={message.kind === 'error' ? 'card form-error' : 'card'} role="status">
          {message.text}
        </p>
      )}

      <section className="settings-group" aria-labelledby="settings-general">
        <h2 id="settings-general" className="settings-group-title">{t('settings.group.general')}</h2>
        <p className="muted small">{t('settings.group.general.text')}</p>
        <div className="card settings-section">
          <h3>{t('settings.language')}</h3>
          <div className="segmented" role="radiogroup" aria-label={t('settings.language')}>
            {LANGUAGES.map((l) => (
              <button
                key={l}
                type="button"
                role="radio"
                aria-checked={l === lang}
                lang={l}
                className={l === lang ? 'btn active' : 'btn'}
                onClick={() => l !== lang && setLang(l)}
              >
                {LANGUAGE_NAMES[l]}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="settings-group" aria-labelledby="settings-data">
        <h2 id="settings-data" className="settings-group-title">{t('settings.group.data')}</h2>
        <p className="muted small">{t('settings.group.data.text')}</p>
        <div className="card settings-section">
          <h3>{t('settings.backup.title')}</h3>
          <p className="muted">{t('settings.backup.text')}</p>
          <div className="button-row">
            <button type="button" className="btn btn-primary" onClick={handleExport}>
              {t('settings.backup.button')}
            </button>
            {canShareBackupFile() && (
              <button type="button" className="btn" onClick={handleShare}>
                {t('settings.share.button')}
              </button>
            )}
          </div>
        </div>
        <div className="card settings-section">
          <h3>{t('settings.restore.title')}</h3>
          <p className="muted">{t('settings.restore.text')}</p>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json,text/plain,.txt"
            hidden
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <button type="button" className="btn" onClick={() => fileInput.current?.click()}>
            {t('settings.restore.button')}
          </button>
        </div>
      </section>

      <section className="settings-group" aria-labelledby="settings-advanced">
        <details className="advanced">
          <summary>
            <span id="settings-advanced" className="settings-group-title">{t('settings.group.advanced')}</span>
            <span className="muted small">{t('settings.group.advanced.text')}</span>
          </summary>
          <div className="card settings-section">
            <h3>{t('settings.demo.title')}</h3>
            <p className="muted">{t('settings.demo.text')}</p>
            <button type="button" className="btn" onClick={handleDemo}>
              {t('settings.demo.button')}
            </button>
          </div>
          <div className="card settings-section danger-zone">
            <h3>{t('settings.danger.title')}</h3>
            <p className="muted">{t('settings.danger.text')}</p>
            <button type="button" className="btn btn-danger" onClick={() => setConfirmDelete(true)}>
              {t('settings.danger.button')}
            </button>
          </div>
        </details>
      </section>

      {confirmDelete && (
        <ConfirmDialog
          title={t('settings.deleteDialog.title')}
          confirmLabel={t('settings.deleteDialog.confirm')}
          danger
          onConfirm={handleDeleteAll}
          onCancel={() => setConfirmDelete(false)}
        >
          {t('settings.deleteDialog.text')}
        </ConfirmDialog>
      )}

      {confirmDemo && (
        <ConfirmDialog
          title={t('settings.replaceDialog.title')}
          confirmLabel={t('settings.replaceDialog.confirm')}
          danger
          onConfirm={loadDemo}
          onCancel={() => setConfirmDemo(false)}
        >
          {t('settings.demoDialog.text')}
        </ConfirmDialog>
      )}

      {pending && (
        <ConfirmDialog
          title={t('settings.replaceDialog.title')}
          confirmLabel={t('settings.importDialog.confirm')}
          danger
          onConfirm={confirmImport}
          onCancel={() => setPending(null)}
        >
          {t('settings.importDialog.text', {
            exercises: pending.exercises.length,
            workouts: pending.workouts.length,
            sets: pending.sets.length,
            weights: pending.bodyWeights.length,
          })}
        </ConfirmDialog>
      )}
    </>
  )
}
