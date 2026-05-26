import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const TOOLS = [
  { label: 'Temps de passage',        path: '/calculateur' },
  { label: 'Calculateur de VMA',      path: '/calculateur/vma' },
  { label: 'Test de Cooper & VO2max', path: '/calculateur/vo2max' },
  { label: 'Allures & zones FC',      path: '/calculateur/allures' },
  { label: 'Prédicteur de chrono',    path: '/calculateur/predicteur' },
]

const NAV_LINKS = [
  { label: 'Mon coach',  href: '/#coach' },
  { label: 'Programme',  href: '/#features' },
  { label: 'Résultats',  href: '/#resultats' },
  { label: 'Tarifs',     href: '/#tarifs' },
  { label: 'FAQ',        href: '/#faq' },
]

export default function BlogNav() {
  const { user, isCoach } = useAuth()
  const navigate = useNavigate()
  const [openTools, setOpenTools] = useState(false)
  const toolsRef = useRef()

  useEffect(() => {
    function onDown(e) { if (toolsRef.current && !toolsRef.current.contains(e.target)) setOpenTools(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const handleCTA = () => navigate(isCoach ? '/admin' : user ? '/app/home' : '/register')

  return (
    <nav className="landing-nav">
      {/* Logo */}
      <Link to="/" style={{ lineHeight: 0, flexShrink: 0 }}>
        <img src="/Logo.png" alt="The Ultimate Academy" style={{ height: 60, width: 'auto', display: 'block' }} />
      </Link>

      {/* Links — same as landing, centered */}
      <div className="landing-nav-links">
        {NAV_LINKS.map(({ label, href }) => (
          <a key={href} href={href} className="landing-nav-link" style={{ textDecoration: 'none' }}>{label}</a>
        ))}

        <Link to="/blog" className="landing-nav-link" style={{ textDecoration: 'none', color: '#C084FC', fontWeight: 600 }}>Blog</Link>

        {/* Outils dropdown */}
        <div ref={toolsRef} style={{ position: 'relative' }}>
          <button className="landing-nav-link"
            onClick={() => setOpenTools(o => !o)}
            style={{ display: 'flex', alignItems: 'center', gap: '.3rem' }}>
            Outils gratuits
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"
              style={{ transition: 'transform .2s', transform: openTools ? 'rotate(180deg)' : 'none', opacity: .7 }}>
              <path d="M1 3l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            </svg>
          </button>
          {openTools && (
            <div style={{ position: 'absolute', top: 'calc(100% + .85rem)', right: '-1rem', minWidth: 230,
              background: '#16132A', border: '1px solid rgba(139,47,201,.35)', borderRadius: 12,
              padding: '.4rem', zIndex: 300, boxShadow: '0 16px 48px rgba(0,0,0,.65)' }}>
              {TOOLS.map(t => (
                <Link key={t.path} to={t.path} onClick={() => setOpenTools(false)} style={{
                  display: 'block', padding: '.55rem .85rem', borderRadius: 8, textDecoration: 'none',
                  fontSize: '.85rem', color: 'rgba(255,255,255,.75)', transition: 'background .12s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.05)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                  {t.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Auth buttons — no hamburger */}
      <div className="landing-nav-auth-desktop" style={{ display: 'flex', gap: '.6rem', alignItems: 'center', flexShrink: 0 }}>
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
