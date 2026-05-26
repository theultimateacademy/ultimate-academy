import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { BadgesProvider, useBadges } from '../../contexts/BadgesContext'

const NAV = [
  { to: '/admin',           icon: '📊', label: 'Tableau de bord', exact: true },
  { to: '/admin/athletes',  icon: '🏃', label: 'Athlètes' },
  { to: '/admin/plans',     icon: '📋', label: 'Plans' },
  { to: '/admin/analyses',  icon: '📈', label: 'Analyses' },
  { to: '/admin/messages',  icon: '💬', label: 'Messagerie' },
]

function AdminShell() {
  const { signOut } = useAuth()
  const navigate    = useNavigate()
  const location    = useLocation()
  const badges      = useBadges()

  const getBadge = (label) => {
    if (label === 'Plans')      return badges.plans
    if (label === 'Analyses')   return badges.analyses
    if (label === 'Messagerie') return location.pathname === '/admin/messages' ? 0 : badges.messages
    return 0
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img src="/Logo.png" alt="The Ultimate Academy" style={{ height: 110, width: 'auto', maxWidth: '100%', marginBottom: '.5rem' }} />
          <div style={{ fontSize: '.92rem', color: 'var(--primary)', fontWeight: 700, letterSpacing: '.02em', textAlign: 'center' }}>
            Espace Coach
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to}
              end={item.exact}
              className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}>
              <span className="icon">{item.icon}</span>
              {item.label}
              {getBadge(item.label) > 0 && (
                <span style={{
                  marginLeft: 'auto', background: 'var(--error)', color: '#fff',
                  borderRadius: 99, padding: '1px 7px', fontSize: '.7rem', fontWeight: 700
                }}>{getBadge(item.label)}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div style={{ fontSize: '.85rem', fontWeight: 600, marginBottom: '.75rem', color: 'rgba(255,255,255,.85)' }}>
            Coach Alexis
          </div>
          <button className="btn btn-ghost btn-sm btn-full" onClick={async () => { await signOut(); navigate('/') }}>
            Déconnexion
          </button>
        </div>
      </aside>

      <div className="main-content">
        <Outlet />
      </div>
    </div>
  )
}

export default function AdminLayout() {
  return (
    <BadgesProvider>
      <AdminShell />
    </BadgesProvider>
  )
}
