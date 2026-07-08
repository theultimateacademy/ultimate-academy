import { Link } from 'react-router-dom'

const colHead = {
  fontSize: '.72rem', fontWeight: 700, letterSpacing: '.12em',
  textTransform: 'uppercase', color: 'rgba(255,255,255,.25)', marginBottom: '.85rem',
}
const colLink = {
  display: 'block', color: 'rgba(255,255,255,.38)', fontSize: '.82rem',
  textDecoration: 'none', marginBottom: '.5rem', lineHeight: 1.4,
}

const CALCULATEURS = [
  { label: 'Temps de passage',        path: '/calculateur/passage' },
  { label: 'Calculateur de VMA',      path: '/calculateur/vma' },
  { label: 'Test de Cooper & VO2max', path: '/calculateur/vo2max' },
  { label: 'Allures & zones FC',      path: '/calculateur/allures' },
  { label: 'Prédicteur de chrono',    path: '/calculateur/predicteur' },
  { label: 'Allures triathlon',       path: '/calculateur/triathlon' },
]

export default function SiteFooter() {
  return (
    <footer style={{ padding: '3rem 1.5rem 2rem', borderTop: '1px solid rgba(255,255,255,.06)', background: '#000' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: '2.5rem', marginBottom: '2rem' }}>

          <div>
            <img src="/LogoSymbol.png" alt="The Ultimate Academy" style={{ height: 52, width: 'auto', objectFit: 'contain', marginBottom: '.85rem' }} />
            <p style={{ color: 'rgba(255,255,255,.2)', fontSize: '.78rem', margin: 0 }}>
              © 2026 The Ultimate Academy<br />Tous droits réservés.
            </p>
          </div>

          <div>
            <p style={colHead}>Calculateur</p>
            {CALCULATEURS.map(t => (
              <Link key={t.path} to={t.path} style={colLink}>{t.label}</Link>
            ))}
          </div>

          <div>
            <p style={colHead}>Blog</p>
            {["Tous les articles", "Plans d'entraînement", "Nutrition", "Trail & Marathon"].map(l => (
              <Link key={l} to="/blog" style={colLink}>{l}</Link>
            ))}
          </div>

          <div>
            <p style={colHead}>Liens</p>
            <Link to="/ebooks"  style={colLink}>Ebooks</Link>
            <Link to="/contact" style={colLink}>Contact</Link>
            <Link to="/privacy" style={colLink}>Politique de confidentialité</Link>
            <Link to="/terms"   style={colLink}>CGV</Link>
            <Link to="/cookies" style={colLink}>Cookies</Link>
          </div>

        </div>
      </div>
    </footer>
  )
}
