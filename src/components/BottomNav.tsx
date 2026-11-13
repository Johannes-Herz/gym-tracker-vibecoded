import { NavLink } from 'react-router-dom'

const ITEMS = [
  { to: '/verlauf', label: 'Verlauf', icon: '📅' },
  { to: '/uebungen', label: 'Übungen', icon: '📋' },
  { to: '/statistik', label: 'Statistik', icon: '📈' },
  { to: '/einstellungen', label: 'Mehr', icon: '⚙️' },
]

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Hauptnavigation">
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
        >
          <span aria-hidden="true" className="nav-icon">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
