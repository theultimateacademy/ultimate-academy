import { NavLink, Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { BadgesProvider, useBadges } from '../../contexts/BadgesContext'

/* Admin mobile bottom nav — only visible below 768px */
const adminMobileStyle = `
  .admin-bottom-nav {
    display: none;
  }
  @media (max-width: 767px) {
    .admin-bottom-nav {
      display: flex;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 200;
      height: 68px;
      background: #09090F;
      border-top: 1px solid rgba(139,47,201,.18);
      padding-bottom: env(safe-area-inset-bottom, 0);
    }
    .admin-bottom-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: .2rem;
      color: rgba(255,255,255,.4);
      font-size: .68rem;
      font-weight: 500;
      border: none;
      background: transparent;
      text-decoration: none;
      position: relative;
      min-width: 0;
    }
    .admin-bottom-item .icon { font-size: 1.3rem; }
    .admin-bottom-item.active { color: #E8237A; }
    .admin-bottom-item .badge-dot-admin {
      position: absolute;
      top: 6px;
      right: calc(50% - 14px);
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #EF4444;
    }
    .admin-shell-mobile { padding-bottom: 68px; }
  }
`

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
    <>
      <style>{adminMobileStyle}</style>
      <div className="app-shell">
        <aside className="sidebar">
          <div className="sidebar-logo" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img src="/Logo.png" alt="The Ultimate Academy" style={{ height: 80, width: 'auto', maxWidth: '100%', marginBottom: '.5rem' }} />
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

        <div className="main-content admin-shell-mobile">
          <Outlet />
        </div>
      </div>

      {/* Mobile top bar — logo + logout */}
      <div className="mobile-topbar">
        <Link to="/admin">
          <img src="/Logo.png" alt="The Ultimate Academy" style={{ height: 52, width: 'auto' }} />
        </Link>
        <button
          onClick={async () => { await signOut(); navigate('/') }}
          style={{
            background: 'none', border: '1px solid rgba(139,47,201,.3)',
            borderRadius: 8, padding: '.3rem .75rem',
            color: 'rgba(255,255,255,.55)', fontSize: '.75rem', fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
          Déconnexion
        </button>
      </div>

      {/* Mobile bottom nav for admin */}
      <nav className="admin-bottom-nav">
        {NAV.map(item => (
          <NavLink key={item.to} to={item.to}
            end={item.exact}
            className={({ isActive }) => `admin-bottom-item${isActive ? ' active' : ''}`}>
            <span className="icon">{item.icon}</span>
            <span style={{ fontSize: '.62rem', textAlign: 'center', lineHeight: 1.1 }}>{item.label.split(' ')[0]}</span>
            {getBadge(item.label) > 0 && <span className="badge-dot-admin" />}
          </NavLink>
        ))}
      </nav>
    </>
  )
}

export default function AdminLayout() {
  return (
    <BadgesProvider>
      <AdminShell />
    </BadgesProvider>
  )
}
