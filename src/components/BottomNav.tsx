import type { MouseEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { t, type MessageKey } from '../i18n'
import { navTarget, saveScroll, tabOf, tabSteps, type TabRoot } from '../lib/tabMemory'
import { useRunSteps } from '../lib/useNavSteps'

const ITEMS: { to: TabRoot; label: MessageKey; icon: string }[] = [
  { to: '/verlauf', label: 'nav.history', icon: '📅' },
  { to: '/uebungen', label: 'nav.exercises', icon: '📋' },
  { to: '/statistik', label: 'nav.stats', icon: '📈' },
  { to: '/einstellungen', label: 'nav.more', icon: '⚙️' },
]

export default function BottomNav() {
  const location = useLocation()
  const run = useRunSteps()
  const activeTab = tabOf(location.pathname)

  function onClick(e: MouseEvent, root: TabRoot) {
    e.preventDefault()
    if (activeTab === root && location.pathname === root) {
      // Already on this tab's overview: just scroll to the top.
      saveScroll(root, 0)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    run(tabSteps(root, location.key, location.pathname))
  }

  return (
    <nav className="bottom-nav" aria-label={t('nav.main')}>
      {ITEMS.map((item) => {
        const active = activeTab === item.to
        return (
          <Link
            key={item.to}
            to={navTarget(item.to, location.pathname)}
            className={active ? 'nav-item active' : 'nav-item'}
            aria-current={active ? 'page' : undefined}
            onClick={(e) => onClick(e, item.to)}
          >
            <span aria-hidden="true" className="nav-icon">{item.icon}</span>
            <span>{t(item.label)}</span>
          </Link>
        )
      })}
    </nav>
  )
}
