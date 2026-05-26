import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const mobileStyle = `
  .nav-hamburger {
    display: none;
    background: none; border: none; cursor: pointer;
    padding: .4rem; color: rgba(255,255,255,.85); flex-shrink: 0;
  }
  @media (max-width: 680px) {
    .nav-hamburger { display: flex; align-items: center; justify-content: center; }
    .nav-mobile-menu {
      position: fixed; top: 72px; left: 0; right: 0;
      background: rgba(0,0,0,.96); backdrop-filter: blur(24px);
      border-bottom: 1px solid rgba(255,255,255,.1);
      padding: 1rem 1.5rem 1.5rem; z-index: 199;
      display: flex; flex-direction: column; gap: 0;
    }
    .nav-mobile-link {
      display: block; padding: .75rem .5rem;
      font-size: 1rem; font-weight: 500;
      color: rgba(255,255,255,.75);
      border: none; background: none; text-align: left;
      cursor: pointer; font-family: inherit;
      border-bottom: 1px solid rgba(255,255,255,.06);
      text-decoration: none; min-height: 44px; width: 100%;
    }
    .nav-mobile-link:last-child { border-bottom: none; }
    .nav-mobile-link.accent { color: #C084FC; font-weight: 600; }
    .nav-mobile-sub { padding-left: 1rem; display: flex; flex-direction: column; }
    .nav-mobile-sub a {
      display: flex; align-items: center;
      padding: .6rem .5rem; font-size: .9rem;
      color: rgba(255,255,255,.55); text-decoration: none; min-height: 44px;
    }
  }
`

const TOOLS = [
  { label: 'Temps de passage course',    path: '/calculateur' },
  { label: 'Calculateur de VMA',         path: '/calculateur/vma' },
  { label: 'Test de Cooper & VO2max',     path: '/calculateur/vo2max' },
  { label: 'Allures running & zones FC', path: '/calculateur/allures' },
  { label: 'Prédicteur de chrono',       path: '/calculateur/predicteur' },
]

const SECTIONS = [
  { label: 'Mon coach',  id: 'coach' },
  { label: 'Programme',  id: 'features' },
  { label: 'Résultats',  id: 'resultats' },
  { label: 'Tarifs',     id: 'tarifs' },
  { label: 'FAQ',        id: 'faq' },
]

export default function Nav() {
  const { user, isCoach } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [openTools,    setOpenTools]    = useState(false)
  const [mobileMenu,   setMobileMenu]   = useState(false)
  const [mobileTools,  setMobileTools]  = useState(false)
  const [activeSection, setActiveSection] = useState(null)
  const toolsRef = useRef()
  const isHome = location.pathname === '/'

  useEffect(() => {
    function onDown(e) { if (toolsRef.current && !toolsRef.current.contains(e.target)) setOpenTools(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  // Close mobile menu on route change, reset active section when leaving home
  useEffect(() => {
    setMobileMenu(false)
    setMobileTools(false)
    if (!isHome) setActiveSection(null)
  }, [location.pathname])

  // IntersectionObserver: highlight the section currently in view on home page
  useEffect(() => {
    if (!isHome) return
    const ids = SECTIONS.map(s => s.id)
    const observers = []
    ids.forEach(id => {
      const el = document.getElementById(id)
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id) },
        { threshold: 0.3 }
      )
      obs.observe(el)
      observers.push(obs)
    })
    return () => observers.forEach(o => o.disconnect())
  }, [isHome])

  const handleCTA = () => navigate(isCoach ? '/admin' : user ? '/app/home' : '/register')

  const goToSection = (id) => {
    setMobileMenu(false)
    setActiveSection(id)
    if (isHome) {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate(`/#${id}`)
    }
  }

  const handleLogoClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <style>{mobileStyle}</style>

      <nav className="landing-nav">

        {/* Logo — always scrolls to top */}
        <Link to="/" onClick={handleLogoClick} style={{ lineHeight: 0, flexShrink: 0 }}>
          <img src="/Logo.png" alt="The Ultimate Academy" className="nav-logo" />
        </Link>

        {/* Desktop centre links — in scroll order */}
        <div className="landing-nav-links">
          {SECTIONS.map(({ label, id }) => (
            <button key={id} className="landing-nav-link" onClick={() => goToSection(id)}
              style={{ color: activeSection === id ? '#C084FC' : undefined, fontWeight: activeSection === id ? 600 : undefined }}>
              {label}
            </button>
          ))}
          <Link to="/blog" className="landing-nav-link" style={{ textDecoration: 'none', color: location.pathname.startsWith('/blog') ? '#C084FC' : undefined, fontWeight: location.pathname.startsWith('/blog') ? 600 : undefined }}>
            Blog
          </Link>
          <div ref={toolsRef} style={{ position: 'relative' }}>
            <button className="landing-nav-link"
              onClick={() => setOpenTools(o => !o)}
              style={{ display: 'flex', alignItems: 'center', gap: '.3rem',
                color: TOOLS.some(t => t.path === location.pathname) ? '#C084FC' : undefined,
                fontWeight: TOOLS.some(t => t.path === location.pathname) ? 600 : undefined }}>
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
                    fontSize: '.85rem', color: location.pathname === t.path ? '#C084FC' : 'rgba(255,255,255,.75)',
                    background: location.pathname === t.path ? 'rgba(139,47,201,.15)' : 'transparent',
                    transition: 'background .12s',
                  }}
                  onMouseEnter={e => { if (location.pathname !== t.path) e.currentTarget.style.background = 'rgba(255,255,255,.05)' }}
                  onMouseLeave={e => { if (location.pathname !== t.path) e.currentTarget.style.background = 'transparent' }}>
                    {t.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: auth + hamburger */}
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

          {/* Hamburger — mobile only */}
          <button className="nav-hamburger" onClick={() => setMobileMenu(v => !v)} aria-label="Menu">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              {mobileMenu
                ? <><line x1="3" y1="3" x2="19" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="19" y1="3" x2="3" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></>
                : <><line x1="3" y1="6" x2="19" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="11" x2="19" y2="11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="16" x2="19" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></>
              }
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile dropdown — same order always */}
      {mobileMenu && (
        <div className="nav-mobile-menu">
          {SECTIONS.map(({ label, id }) => (
            <button key={id} className="nav-mobile-link" onClick={() => goToSection(id)}>{label}</button>
          ))}
          <Link to="/blog" className="nav-mobile-link accent" onClick={() => setMobileMenu(false)}>Blog</Link>
          <button className="nav-mobile-link accent"
            onClick={e => { e.stopPropagation(); setMobileTools(v => !v) }}>
            Outils gratuits {mobileTools ? '▴' : '▾'}
          </button>
          {mobileTools && (
            <div className="nav-mobile-sub" onClick={e => e.stopPropagation()}>
              {TOOLS.map(t => (
                <Link key={t.path} to={t.path} onClick={() => setMobileMenu(false)}>{t.label}</Link>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
