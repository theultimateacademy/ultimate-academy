import { Link } from 'react-router-dom'

export default function BlogNav() {
  return (
    <>
      <nav style={{
        padding: '0 1.5rem',
        height: 72,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,.07)',
        position: 'sticky',
        top: 0,
        background: 'rgba(0,0,0,.9)',
        backdropFilter: 'blur(20px)',
        zIndex: 50,
        flexShrink: 0,
      }}>
        {/* Logo — taille fixe, ne bouge jamais */}
        <Link to="/" style={{ flexShrink: 0, lineHeight: 0 }}>
          <img src="/Logo.png" alt="The Ultimate Academy" style={{ height: 60, width: 'auto', display: 'block' }} />
        </Link>

        {/* Links — fixed layout, no wrap */}
        <div style={{ display: 'flex', gap: '.25rem', alignItems: 'center', flexShrink: 0 }}>
          <Link to="/"            className="blog-nav-link">Accueil</Link>
          <Link to="/calculateur" className="blog-nav-link blog-nav-hide-sm">Outils gratuits</Link>
          <Link to="/blog"        className="blog-nav-link blog-nav-blog">Blog</Link>
          <Link to="/login"       className="blog-nav-link blog-nav-hide-xs">Connexion</Link>
          <Link to="/register"    className="blog-nav-cta">Rejoindre</Link>
        </div>
      </nav>

      <style>{`
        .blog-nav-link {
          color: rgba(255,255,255,.55);
          font-size: .88rem;
          text-decoration: none;
          padding: .45rem .7rem;
          border-radius: 8px;
          white-space: nowrap;
          transition: color .15s;
        }
        .blog-nav-link:hover { color: #fff; }
        .blog-nav-blog { color: #C084FC !important; font-weight: 600; }
        .blog-nav-cta {
          background: linear-gradient(135deg,#8B2FC9,#E8237A);
          color: #fff !important;
          font-size: .88rem;
          font-weight: 700;
          text-decoration: none;
          padding: .5rem 1.1rem;
          border-radius: 10px;
          white-space: nowrap;
          margin-left: .25rem;
        }
        @media (max-width: 600px) { .blog-nav-hide-sm { display: none !important; } }
        @media (max-width: 420px) { .blog-nav-hide-xs { display: none !important; } }
      `}</style>
    </>
  )
}
