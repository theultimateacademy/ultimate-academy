import { Link } from 'react-router-dom'

const TOOLS = [
  { label: 'Calculateur temps de passage',  path: '/calculateur' },
  { label: 'Calculateur de VMA',            path: '/calculateur/vma' },
  { label: 'Test de Cooper & VO2max',       path: '/calculateur/vo2max' },
  { label: 'Allures running & zones FC',    path: '/calculateur/allures' },
  { label: 'Prédicteur de chrono running',  path: '/calculateur/predicteur' },
]

const colHead = {
  fontSize: '.72rem', fontWeight: 700, letterSpacing: '.12em',
  textTransform: 'uppercase', color: 'rgba(255,255,255,.25)', marginBottom: '.85rem',
}
const colLink = {
  display: 'block', color: 'rgba(255,255,255,.38)', fontSize: '.82rem',
  textDecoration: 'none', marginBottom: '.5rem', lineHeight: 1.4,
}

export default function ToolsFooter() {
  return (
    <footer style={{ borderTop: '1px solid rgba(255,255,255,.06)', background: '#000', padding: '3rem 1.5rem 2rem' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: '2.5rem', marginBottom: '2rem' }}>
          <div>
            <img src="/Logo.png" alt="The Ultimate Academy" style={{ height: 60, width: 'auto', objectFit: 'contain', opacity: .8, marginBottom: '.85rem' }} />
            <p style={{ color: 'rgba(255,255,255,.2)', fontSize: '.78rem', margin: 0 }}>
              © 2026 The Ultimate Academy<br />Tous droits réservés.
            </p>
          </div>

          <div>
            <p style={colHead}>Outils gratuits</p>
            {TOOLS.map(t => <Link key={t.path} to={t.path} style={colLink}>{t.label}</Link>)}
          </div>

          <div>
            <p style={colHead}>Blog</p>
            <Link to="/blog" style={colLink}>Tous les articles</Link>
            <Link to="/blog" style={colLink}>Plans d'entraînement</Link>
            <Link to="/blog" style={colLink}>Nutrition</Link>
            <Link to="/blog" style={colLink}>Trail & Marathon</Link>
          </div>
          <div>
            <p style={colHead}>Légal</p>
            <Link to="/privacy" style={colLink}>Politique de confidentialité</Link>
            <Link to="/terms"   style={colLink}>CGV</Link>
            <Link to="/cookies" style={colLink}>Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
