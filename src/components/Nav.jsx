import { useState, useEffect } from 'react'
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


const SECTIONS = [
  { label: 'Mon coach',  id: 'coach' },
  { label: 'Tarifs',     id: 'tarifs' },
  { label: 'Résultats',  id: 'resultats' },
  { label: 'FAQ',        id: 'faq' },
]

const PROGRAM_LINKS = [
  { label: '5km',            slug: '5km' },
  { label: '10km',           slug: '10km' },
  { label: 'Semi-marathon',  slug: 'semi-marathon' },
  { label: 'Marathon',       slug: 'marathon' },
  { label: 'Trail',          slug: 'trail' },
  { label: 'Triathlon',      slug: 'triathlon' },
]

export default function Nav() {
  const { } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenu,    setMobileMenu]    = useState(false)
  const [activeSection, setActiveSection] = useState(null)
  const [programOpen,   setProgramOpen]   = useState(false)
  const [programMobileOpen, setProgramMobileOpen] = useState(false)
  const isHome = location.pathname === '/'



  // Close mobile menu on route change, reset active section when leaving home
  useEffect(() => {
    setMobileMenu(false)
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

  const handleCTA = () => navigate('/register')

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
          <img src="/Logo.png" alt="The Ultimate Academy" style={{ height: 72, width: 'auto', display: 'block' }} />
        </Link>

        {/* Desktop centre links — in scroll order */}
        <div className="landing-nav-links">
          <div
            style={{ position: 'relative' }}
            onMouseEnter={() => setProgramOpen(true)}
            onMouseLeave={() => setProgramOpen(false)}
          >
            <button className="landing-nav-link" onClick={() => goToSection('features')}
              style={{ display: 'flex', alignItems: 'center', gap: '.3rem',
                color: activeSection === 'features' || programOpen ? '#C084FC' : undefined,
                fontWeight: activeSection === 'features' ? 600 : undefined }}>
              Programme
              <svg width="9" height="9" viewBox="0 0 9 9" style={{ transform: programOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>
                <path d="M1 3l3.5 3L8 3" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {programOpen && (
              <div style={{
                position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                marginTop: '.5rem', background: 'rgba(10,10,14,.98)', backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,.1)', borderRadius: 14, padding: '.5rem',
                display: 'flex', flexDirection: 'column', minWidth: 180, boxShadow: '0 12px 32px rgba(0,0,0,.5)', zIndex: 50,
              }}>
                {PROGRAM_LINKS.map(({ label, slug }) => (
                  <Link key={slug} to={`/coaching/${slug}`} style={{
                    padding: '.6rem .9rem', borderRadius: 9, fontSize: '.88rem', textDecoration: 'none',
                    color: location.pathname === `/coaching/${slug}` ? '#C084FC' : 'rgba(255,255,255,.75)',
                    fontWeight: location.pathname === `/coaching/${slug}` ? 600 : 500,
                  }}>
                    {label}
                  </Link>
                ))}
              </div>
            )}
          </div>
          {SECTIONS.map(({ label, id }) => (
            <button key={id} className="landing-nav-link" onClick={() => goToSection(id)}
              style={{ color: activeSection === id ? '#C084FC' : undefined, fontWeight: activeSection === id ? 600 : undefined }}>
              {label}
            </button>
          ))}
          <Link to="/blog" className="landing-nav-link" style={{ textDecoration: 'none', color: location.pathname.startsWith('/blog') ? '#C084FC' : undefined, fontWeight: location.pathname.startsWith('/blog') ? 600 : undefined }}>
            Blog
          </Link>
          <Link to="/ebooks" className="landing-nav-link" style={{ textDecoration: 'none', color: location.pathname.startsWith('/ebooks') ? '#C084FC' : undefined, fontWeight: location.pathname.startsWith('/ebooks') ? 600 : undefined }}>
            Ebooks
          </Link>
          <Link to="/calculateur" className="landing-nav-link" style={{ textDecoration: 'none', color: location.pathname.startsWith('/calculateur') ? '#C084FC' : undefined, fontWeight: location.pathname.startsWith('/calculateur') ? 600 : undefined }}>
            Calculateur
          </Link>
          <Link to="/contact" className="landing-nav-link" style={{ textDecoration: 'none', color: location.pathname === '/contact' ? '#C084FC' : undefined, fontWeight: location.pathname === '/contact' ? 600 : undefined }}>
            Contact
          </Link>
        </div>

        {/* Right: auth + hamburger */}
        <div style={{ display: 'flex', gap: '.6rem', alignItems: 'center', flexShrink: 0 }}>
          <div className="landing-nav-auth-desktop" style={{ display: 'flex', gap: '.6rem', alignItems: 'center' }}>
            <Link to="/login" className="btn btn-sm"
              style={{ background: 'transparent', color: 'rgba(255,255,255,.7)', border: '1px solid rgba(255,255,255,.18)' }}>
              Connexion
            </Link>
            <Link to="/choisir-sport" className="btn btn-sm"
              style={{ background: 'linear-gradient(135deg,#8B2FC9,#E8237A)', color: '#fff', border: 'none',
                fontWeight: 700, boxShadow: '0 3px 14px rgba(232,35,122,.45)' }}>
              Rejoindre
            </Link>
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
          <button className="nav-mobile-link" onClick={() => setProgramMobileOpen(v => !v)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            Programme
            <svg width="10" height="10" viewBox="0 0 9 9" style={{ transform: programMobileOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>
              <path d="M1 3l3.5 3L8 3" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {programMobileOpen && (
            <div className="nav-mobile-sub">
              {PROGRAM_LINKS.map(({ label, slug }) => (
                <Link key={slug} to={`/coaching/${slug}`} onClick={() => setMobileMenu(false)}>{label}</Link>
              ))}
            </div>
          )}
          {SECTIONS.map(({ label, id }) => (
            <button key={id} className="nav-mobile-link" onClick={() => goToSection(id)}>{label}</button>
          ))}
          <Link to="/blog" className="nav-mobile-link accent" onClick={() => setMobileMenu(false)}>Blog</Link>
          <Link to="/ebooks" className="nav-mobile-link accent" onClick={() => setMobileMenu(false)}>Ebooks</Link>
          <Link to="/calculateur" className="nav-mobile-link accent" onClick={() => setMobileMenu(false)}>Calculateur</Link>
          <Link to="/contact" className="nav-mobile-link accent" onClick={() => setMobileMenu(false)}>Contact</Link>
          <div style={{ display: 'flex', gap: '.75rem', padding: '.75rem .5rem .25rem', borderTop: '1px solid rgba(255,255,255,.08)', marginTop: '.25rem' }}>
            <Link to="/login" onClick={() => setMobileMenu(false)}
              style={{ flex: 1, padding: '.75rem', borderRadius: 10, textAlign: 'center', fontWeight: 600, fontSize: '.9rem',
                background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.15)', color: 'rgba(255,255,255,.8)', textDecoration: 'none' }}>
              Connexion
            </Link>
            <Link to="/choisir-sport" onClick={() => setMobileMenu(false)}
              style={{ flex: 1, padding: '.75rem', borderRadius: 10, textAlign: 'center', fontWeight: 700, fontSize: '.9rem',
                background: 'linear-gradient(135deg,#8B2FC9,#E8237A)', color: '#fff', textDecoration: 'none' }}>
              Rejoindre
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
