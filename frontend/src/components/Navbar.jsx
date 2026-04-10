import { NavLink } from 'react-router-dom'

const links = [
  { to: '/scrapbook',   label: 'My Story' },
  { to: '/timeline',    label: 'Timeline' },
  // { to: '/map',         label: 'World Map' },
  { to: '/stats',       label: 'Life Stats' },
  { to: '/family-tree', label: 'Family Tree' },
]

export default function Navbar({ onLogout }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-3"
      style={{ background: 'rgba(26,15,10,0.95)', borderBottom: '1px solid #4a2c1a' }}>
      <span style={{ fontFamily: "'Special Elite', cursive", color: '#c9973a', fontSize: '1.3rem', letterSpacing: '0.05em' }}>
        My Story
      </span>
      <div className="flex gap-6">
        {links.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              fontFamily: "'Crimson Text', serif",
              fontSize: '1.1rem',
              color: isActive ? '#c9973a' : '#e8dfc8',
              textDecoration: 'none',
              borderBottom: isActive ? '1px solid #c9973a' : 'none',
              paddingBottom: '2px',
              transition: 'color 0.2s',
            })}
          >
            {label}
          </NavLink>
        ))}
      </div>
      <button
        onClick={onLogout}
        style={{
          fontFamily: "'Crimson Text', serif",
          background: 'transparent',
          border: '1px solid #8b3a2a',
          color: '#e8dfc8',
          padding: '4px 14px',
          borderRadius: '2px',
          cursor: 'pointer',
          fontSize: '1rem',
        }}
      >
        Sign Out
      </button>
    </nav>
  )
}
