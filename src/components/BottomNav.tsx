import type { MouseEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { navTarget, saveScroll, tabOf, type TabRoot } from '../lib/tabMemory'

const ITEMS: { to: TabRoot; label: string; icon: string }[] = [
  { to: '/verlauf', label: 'Verlauf', icon: '📅' },
  { to: '/uebungen', label: 'Übungen', icon: '📋' },
  { to: '/statistik', label: 'Statistik', icon: '📈' },
  { to: '/einstellungen', label: 'Mehr', icon: '⚙️' },
]

export default function BottomNav() {
  const { pathname } = useLocation()
  const activeTab = tabOf(pathname)

  // Tapping the active tab while already on its overview just scrolls to the top.
  function onClick(e: MouseEvent, root: TabRoot) {
    if (activeTab === root && pathname === root) {
      e.preventDefault()
      saveScroll(root, 0)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <nav className="bottom-nav" aria-label="Hauptnavigation">
      {ITEMS.map((item) => {
        const active = activeTab === item.to
        return (
          <Link
            key={item.to}
            to={navTarget(item.to, pathname)}
            className={active ? 'nav-item active' : 'nav-item'}
            aria-current={active ? 'page' : undefined}
            onClick={(e) => onClick(e, item.to)}
          >
            <span aria-hidden="true" className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
