import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { t } from '../i18n'
import { _resetCache } from '../storage/store'
import SettingsPage from './SettingsPage'

beforeEach(() => {
  const mem = new Map<string, string>()
  ;(globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => void mem.set(k, v),
    removeItem: (k: string) => void mem.delete(k),
  }
  _resetCache()
})
afterEach(() => {
  delete (globalThis as { localStorage?: unknown }).localStorage
  _resetCache()
})

const render = () =>
  renderToStaticMarkup(
    <MemoryRouter>
      <SettingsPage />
    </MemoryRouter>,
  )

/** The markup inside the (single) <details> element. */
const advancedPart = (html: string) => html.slice(html.indexOf('<details'), html.indexOf('</details>'))

describe('settings page', () => {
  it('renders the three groups in order', () => {
    const html = render()
    const at = (key: Parameters<typeof t>[0]) => html.indexOf(`>${t(key)}<`)
    expect(t('settings.group.general')).toBe('Allgemein')
    expect(t('settings.group.data')).toBe('Daten')
    expect(t('settings.group.advanced')).toBe('Erweitert')
    expect(at('settings.group.general')).toBeGreaterThan(-1)
    expect(at('settings.group.data')).toBeGreaterThan(at('settings.group.general'))
    expect(at('settings.group.advanced')).toBeGreaterThan(at('settings.group.data'))
  })

  it('puts language, export and import outside "Erweitert"', () => {
    const html = render()
    const advanced = advancedPart(html)
    const outside = html.replace(advanced, '')
    for (const key of ['settings.language', 'settings.backup.button', 'settings.restore.button'] as const) {
      expect(outside).toContain(t(key))
      expect(advanced).not.toContain(t(key))
    }
  })

  it('"Erweitert" is collapsed by default and holds demo data and the danger zone', () => {
    const html = render()
    expect(html.match(/<details/g)).toHaveLength(1)
    expect(html.match(/<details[^>]*>/)![0]).not.toContain('open')
    const advanced = advancedPart(html)
    expect(advanced).toContain(t('settings.group.advanced'))
    expect(advanced).toContain(t('settings.demo.button'))
    expect(advanced).toContain(t('settings.danger.button'))
    expect(advanced).toContain('danger-zone')
    expect(advanced).toMatch(/btn btn-danger"[^>]*>[^<]*Alle Daten löschen/)
  })
})
