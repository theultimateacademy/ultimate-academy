import { NavLink, Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const NAV = [
  { to: '/app/home',      icon: '🏠', label: 'Accueil' },
  { to: '/app/plan',      icon: '📋', label: 'Mon plan' },
  { to: '/app/strength',  icon: '💪', label: 'Renfo' },
  { to: '/app/drills',    icon: '🏃', label: 'Gammes' },
  { to: '/app/nutrition', icon: '🥗', label: 'Nutrition' },
  { to: '/app/messages',  icon: '💬', label: 'Messages' },
  { to: '/app/profile',   icon: '👤', label: 'Profil' },
]

export default function AthleteLayout() {
  const { profile, signOut } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!profile?.id) return

    const seenKey = `ua_msg_seen_${profile.id}`

    const check = async () => {
      if (window.location.pathname === '/app/messages') return
      const seenAt = localStorage.getItem(seenKey)
      let query = supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .eq('sender', 'coach')
      if (seenAt) query = query.gt('created_at', seenAt)
      const { count } = await query
      setUnread(count || 0)
    }

    check()
    const interval = setInterval(check, 15000)

    const sub = supabase.channel('messages-badge')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages',
          filter: `user_id=eq.${profile.id}` }, check)
      .subscribe()

    return () => { clearInterval(interval); sub.unsubscribe() }
  }, [profile?.id])

  useEffect(() => {
    if (location.pathname === '/app/messages' && profile?.id) {
      setUnread(0)
      localStorage.setItem(`ua_msg_seen_${profile.id}`, new Date().toISOString())
    }
  }, [location.pathname, profile?.id])

  const handleSignOut = async () => { await signOut(); navigate('/') }

  return (
    <div className="app-shell">
      {/* Desktop sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Link to="/app/home"><img src="/Logo.png" alt="The Ultimate Academy" style={{ height: 80, width: 'auto', maxWidth: '100%', marginBottom: '.5rem' }} /></Link>
          <div style={{ fontSize: '.92rem', color: 'var(--primary)', fontWeight: 700, letterSpacing: '.02em', textAlign: 'center' }}>
            Espace Athlète
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to}
              className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}>
              <span className="icon">{item.icon}</span>
              {item.label}
              {item.label === 'Messages' && unread > 0 && location.pathname !== '/app/messages' && <span className="notif" />}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '.75rem' }}>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="avatar"
                style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            ) : (
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--gradient)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '.9rem', fontWeight: 800, flexShrink: 0 }}>
                {profile?.first_name?.[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <div style={{ fontSize: '.85rem', fontWeight: 600, color: 'rgba(255,255,255,.85)' }}>
                {profile?.first_name} {profile?.last_name}
              </div>
              <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.4)' }}>
                {profile?.email}
              </div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm btn-full" onClick={handleSignOut}>
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="main-content">
        <Outlet />
      </div>

      {/* Mobile top bar — logo + logout */}
      <div className="mobile-topbar">
        <Link to="/app/home">
          <img src="/Logo.png" alt="The Ultimate Academy" style={{ height: 44, width: 'auto' }} />
        </Link>
        <button
          onClick={handleSignOut}
          style={{
            background: 'none', border: '1px solid rgba(139,47,201,.3)',
            borderRadius: 8, padding: '.3rem .75rem',
            color: 'rgba(255,255,255,.55)', fontSize: '.75rem', fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
          Déconnexion
        </button>
      </div>

      {/* Mobile bottom nav */}
      <nav className="bottom-nav">
        {NAV.map(item => (
          <NavLink key={item.to} to={item.to}
            className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
            <span className="icon">{item.icon}</span>
            <span>{item.label}</span>
            {item.label === 'Messages' && unread > 0 && location.pathname !== '/app/messages' && <span className="notif" />}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
