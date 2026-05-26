import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const TOOLS = [
  { label: '⏱ Temps de passage course',    path: '/calculateur' },
  { label: '⚡ Calculateur de VMA',         path: '/calculateur/vma' },
  { label: '🫁 Test Cooper & VO2max',       path: '/calculateur/vo2max' },
  { label: '🏃 Allures running & zones FC', path: '/calculateur/allures' },
  { label: '🎯 Prédicteur de chrono',       path: '/calculateur/predicteur' },
]

export default function ToolsNav() {
  const { user, isCoach } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const dropRef = useRef()

  useEffect(() => {
    function onDown(e) { if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const isToolActive = TOOLS.some(t => t.path === location.pathname)
  const handleCTA = () => navigate(user ? (isCoach ? '/admin' : '/app/home') : '/register')

  return (
    <nav className="landing-nav">
      <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
        <img src="/Logo.png" alt="The Ultimate Academy" style={{ height: 58, width: 'auto', flexShrink: 0 }} />
      </Link>

      <div className="landing-nav-links">
        {[['Mon coach','coach'],['Programme','features'],['Résultats','resultats'],['Tarifs','tarifs'],['FAQ','faq']].map(([l, id]) => (
          <a key={id} href={`/#${id}`} className="landing-nav-link" style={{ textDecoration: 'none' }}>{l}</a>
        ))}

        <div ref={dropRef} style={{ position: 'relative' }}>
          <button
            className="landing-nav-link"
            onClick={() => setOpen(o => !o)}
            style={{ display: 'flex', alignItems: 'center', gap: '.3rem',
              color: isToolActive ? '#C084FC' : undefined, fontWeight: isToolActive ? 700 : undefined }}>
            Outils gratuits
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"
              style={{ transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none', opacity: .7 }}>
              <path d="M1 3l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            </svg>
          </button>

          {open && (
            <div style={{
              position: 'absolute', top: 'calc(100% + .85rem)', right: '-1rem',
              minWidth: 230, background: '#16132A',
              border: '1px solid rgba(139,47,201,.35)', borderRadius: 12,
              padding: '.4rem', zIndex: 300,
              boxShadow: '0 16px 48px rgba(0,0,0,.65)',
            }}>
              {TOOLS.map(t => {
                const active = location.pathname === t.path
                return (
                  <Link key={t.path} to={t.path} onClick={() => setOpen(false)} style={{
                    display: 'block', padding: '.55rem .85rem', borderRadius: 8,
                    textDecoration: 'none', fontSize: '.85rem', lineHeight: 1.3,
                    color: active ? '#C084FC' : 'rgba(255,255,255,.75)',
                    background: active ? 'rgba(139,47,201,.15)' : 'transparent',
                    transition: 'background .12s',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,.05)' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}>
                    {t.label}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '.6rem', alignItems: 'center', flexShrink: 0 }}>
        {user ? (
          <button className="btn btn-sm" onClick={handleCTA}
            style={{ background: 'rgba(255,255,255,.1)', color: '#fff', border: '1px solid rgba(255,255,255,.2)' }}>
            Mon espace
          </button>
        ) : (
          <>
            <Link to="/login" className="btn btn-sm"
              style={{ background: 'transparent', color: 'rgba(255,255,255,.7)', border: '1px solid rgba(255,255,255,.18)' }}>
              Connexion
            </Link>
            <Link to="/register" className="btn btn-sm"
              style={{ background: 'linear-gradient(135deg,#8B2FC9,#E8237A)', color: '#fff', border: 'none',
                fontWeight: 700, boxShadow: '0 3px 14px rgba(232,35,122,.45)' }}>
              Rejoindre
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
