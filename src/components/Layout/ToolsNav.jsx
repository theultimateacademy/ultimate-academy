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

const mobileToolsNavStyle = `
  .tools-nav-hamburger {
    display: none;
    background: none;
    border: none;
    cursor: pointer;
    padding: .4rem;
    color: rgba(255,255,255,.85);
    flex-shrink: 0;
  }
  @media (max-width: 680px) {
    .tools-nav-hamburger { display: flex; align-items: center; justify-content: center; }
    .tools-mobile-menu {
      position: fixed;
      top: 72px;
      left: 0;
      right: 0;
      background: rgba(0,0,0,.95);
      backdrop-filter: blur(24px);
      border-bottom: 1px solid rgba(255,255,255,.1);
      padding: 1rem 1.5rem 1.5rem;
      z-index: 199;
      display: flex;
      flex-direction: column;
      gap: 0;
    }
    .tools-mobile-link {
      display: flex;
      align-items: center;
      padding: .75rem .5rem;
      font-size: .95rem;
      font-weight: 500;
      color: rgba(255,255,255,.75);
      border: none;
      background: none;
      text-align: left;
      cursor: pointer;
      font-family: inherit;
      border-bottom: 1px solid rgba(255,255,255,.06);
      text-decoration: none;
      min-height: 44px;
    }
    .tools-mobile-link:last-child { border-bottom: none; }
    .tools-mobile-link.active-tool { color: #C084FC; font-weight: 600; }
  }
`

export default function ToolsNav() {
  const { user, isCoach } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open,       setOpen]       = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  const dropRef = useRef()

  useEffect(() => {
    function onDown(e) { if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const isToolActive = TOOLS.some(t => t.path === location.pathname)
  const handleCTA = () => navigate(user ? (isCoach ? '/admin' : '/app/home') : '/register')

  return (
    <>
      <style>{mobileToolsNavStyle}</style>
      <nav className="landing-nav">
        <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/Logo.png" alt="The Ultimate Academy" style={{ height: 60, width: 'auto', flexShrink: 0 }} />
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
          <div className="landing-nav-auth-desktop" style={{ display: 'flex', gap: '.6rem', alignItems: 'center' }}>
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
          <button className="tools-nav-hamburger" onClick={() => setMobileMenu(v => !v)} aria-label="Menu">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              {mobileMenu
                ? <><line x1="3" y1="3" x2="19" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="19" y1="3" x2="3" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></>
                : <><line x1="3" y1="6" x2="19" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="11" x2="19" y2="11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="16" x2="19" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></>
              }
            </svg>
          </button>
        </div>
      </nav>

      {mobileMenu && (
        <div className="tools-mobile-menu">
          {TOOLS.map(t => (
            <Link key={t.path} to={t.path}
              className={`tools-mobile-link${location.pathname === t.path ? ' active-tool' : ''}`}
              onClick={() => setMobileMenu(false)}>
              {t.label}
            </Link>
          ))}
          <a href="/#coach"    className="tools-mobile-link" onClick={() => setMobileMenu(false)}>Mon coach</a>
          <a href="/#tarifs"   className="tools-mobile-link" onClick={() => setMobileMenu(false)}>Tarifs</a>
          {!user && (
            <>
              <Link to="/login"    className="tools-mobile-link" onClick={() => setMobileMenu(false)}>Connexion</Link>
              <Link to="/register" className="tools-mobile-link active-tool" onClick={() => setMobileMenu(false)}>Rejoindre →</Link>
            </>
          )}
          {user && (
            <button className="tools-mobile-link active-tool" onClick={() => { handleCTA(); setMobileMenu(false) }}>Mon espace →</button>
          )}
        </div>
      )}
    </>
  )
}
