import { Link } from 'react-router-dom'
import Nav from '../components/Nav'

const grad = 'linear-gradient(135deg,#8B2FC9,#E8237A)'

export default function EbookMerci() {
  return (
    <div style={{ background: '#0C0A18', minHeight: '100vh', color: '#fff', fontFamily: 'inherit' }}>
      <Nav />
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '5rem 1.5rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🎉</div>
        <h1 style={{ fontSize: 'clamp(1.6rem,4vw,2.2rem)', fontWeight: 900, marginBottom: '1rem',
          background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          Merci pour ton achat !
        </h1>
        <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,.7)', lineHeight: 1.75, marginBottom: '.75rem' }}>
          Ton ebook arrive dans ta boîte mail dans quelques instants.
        </p>
        <p style={{ fontSize: '.875rem', color: 'rgba(255,255,255,.4)', marginBottom: '2.5rem' }}>
          Pense à vérifier tes spams si tu ne le vois pas.
        </p>

        <div style={{ background: 'rgba(139,47,201,.1)', border: '1px solid rgba(139,47,201,.25)', borderRadius: 20, padding: '1.75rem', marginBottom: '2rem' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '.75rem' }}>⚡</div>
          <h3 style={{ margin: '0 0 .5rem', fontSize: '1rem', fontWeight: 800 }}>Calcule tes allures personnalisées</h3>
          <p style={{ color: 'rgba(255,255,255,.55)', fontSize: '.875rem', margin: '0 0 1.25rem', lineHeight: 1.6 }}>
            Utilise notre calculateur VMA gratuit pour personnaliser chaque séance de ton plan selon ta vitesse réelle.
          </p>
          <Link to="/calculateur/vma" style={{ display: 'inline-block', background: grad, color: '#fff', textDecoration: 'none', borderRadius: 99, padding: '.65rem 1.75rem', fontWeight: 700, fontSize: '.9rem', boxShadow: '0 8px 24px rgba(139,47,201,.4)' }}>
            Calculateur VMA gratuit →
          </Link>
        </div>

        <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 20, padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 .5rem', fontSize: '1rem', fontWeight: 800 }}>Tu veux aller plus loin ?</h3>
          <p style={{ color: 'rgba(255,255,255,.55)', fontSize: '.875rem', margin: '0 0 1.25rem', lineHeight: 1.6 }}>
            Avec le coaching personnalisé The Ultimate Academy, ton plan s'adapte chaque semaine selon tes sensations et tes progrès. 14 jours d'essai gratuit.
          </p>
          <Link to="/register" style={{ color: '#C084FC', fontWeight: 600, textDecoration: 'none', fontSize: '.9rem' }}>
            Découvrir le coaching personnalisé →
          </Link>
        </div>

        <div style={{ marginTop: '2rem' }}>
          <Link to="/ebooks" style={{ color: 'rgba(255,255,255,.4)', fontSize: '.85rem', textDecoration: 'none' }}>
            ← Voir tous les plans
          </Link>
        </div>
      </div>
    </div>
  )
}
