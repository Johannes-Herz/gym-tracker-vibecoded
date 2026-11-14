import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import HistoryPage from '../../pages/HistoryPage'
import { _resetSessionCache, startSession } from '../../storage/session'
import { _resetCache } from '../../storage/store'
import { t } from '../../i18n'
import { ActiveTrainingPrompt } from './ActiveTraining'
import { startAction } from './newWorkout'

beforeEach(() => {
  const mem = new Map<string, string>()
  ;(globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => void mem.set(k, v),
    removeItem: (k: string) => void mem.delete(k),
  }
  _resetCache()
  _resetSessionCache()
})
afterEach(() => {
  delete (globalThis as { localStorage?: unknown }).localStorage
  _resetCache()
  _resetSessionCache()
})

const renderHistory = () =>
  renderToStaticMarkup(
    <MemoryRouter>
      <HistoryPage />
    </MemoryRouter>,
  )

describe('Verlauf banner', () => {
  it('shows "Training läuft – fortsetzen" with an end option only while a session is active', () => {
    expect(renderHistory()).not.toContain(t('training.running'))
    startSession({ startedAt: '2026-11-14T10:00:00.000Z', pending: [] })
    const html = renderHistory()
    expect(t('training.running')).toBe('Training läuft – fortsetzen')
    expect(html).toContain(t('training.running'))
    expect(html).toContain('href="/verlauf/aktiv"')
    expect(html).toContain(`>${t('training.end')}<`)
  })
})

describe('starting a new workout while a session is active', () => {
  it('asks first, never replaces silently', () => {
    expect(startAction(true, 0)).toBe('ask')
    expect(startAction(true, 3)).toBe('ask')
    expect(startAction(false, 3)).toBe('choose-template')
    expect(startAction(false, 0)).toBe('empty')
  })

  it('offers "Fortsetzen" and "Beenden und neu starten"', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <ActiveTrainingPrompt onRestart={() => {}} onDismiss={() => {}} />
      </MemoryRouter>,
    )
    expect(html).toContain('>Fortsetzen<')
    expect(html).toContain('>Beenden und neu starten<')
  })
})
