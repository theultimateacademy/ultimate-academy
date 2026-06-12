import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Nav from '../components/Nav'

const C = { purple: '#8B2FC9', pink: '#E8237A', bg: '#0C0A18' }
const grad = 'linear-gradient(135deg,#8B2FC9,#E8237A)'

const EBOOK_META = {
  '10km-8sem':      { icon: '🏃', weeks: 8,  distance: '10 km',         toc: ['8 semaines structurées', 'Séances EF, Fractionné, Tempo', 'Sortie longue progressive', 'Semaine d\'affûtage', 'Stratégie de course'] },
  '10km-12sem':     { icon: '🏃', weeks: 12, distance: '10 km',         toc: ['12 semaines progressives', 'Volume et intensité montants', 'Blocs de développement VMA', 'Affûtage 2 semaines', 'Stratégie et nutrition'] },
  'semi-12sem':     { icon: '🏅', weeks: 12, distance: 'Semi-marathon', toc: ['12 semaines complètes', 'Long runs jusqu\'à 18km', 'Séances au seuil et allure spé', 'Gestion des 21km', 'Nutrition avant course'] },
  'marathon-12sem': { icon: '🏆', weeks: 12, distance: 'Marathon',      toc: ['12 semaines intensives', 'Sorties longues jusqu\'à 30km', 'Allures marathon et tempo', 'Stratégie ravitaillement', 'Préparation mentale'] },
  'marathon-16sem': { icon: '🏆', weeks: 16, distance: 'Marathon',      toc: ['16 semaines progressives', 'Construction du volume km', 'Long runs hebdomadaires', 'Affûtage sur 3 semaines', 'Plan A/B/C par objectif'] },
  'anti-blessure':  { icon: '🩺', weeks: null, distance: null,          toc: ['Prévention des blessures courantes', 'Renforcement musculaire ciblé', 'Étirements et mobilité', 'Signes d\'alerte à connaître', 'Protocoles de reprise'] },
}

export default function EbooksPage() {
  const [ebooks, setEbooks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/ebooks')
      .then(r => r.json())
      .then(d => setEbooks(d.ebooks || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: '#fff', fontFamily: 'inherit' }}>
      <Nav />

      {/* ── HERO ── */}
      <div style={{ textAlign: 'center', padding: '5rem 1.5rem 3rem' }}>
        <div style={{ display: 'inline-block', background: 'rgba(139,47,201,.15)', border: '1px solid rgba(139,47,201,.3)',
          borderRadius: 99, padding: '.35rem 1rem', fontSize: '.78rem', fontWeight: 700,
          color: '#C084FC', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
          Plans d'entraînement PDF
        </div>
        <h1 style={{ fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 900, margin: '0 0 1rem',
          background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          Plans d'entraînement PDF
        </h1>
        <div style={{ fontSize: 'clamp(1.1rem,3vw,1.5rem)', fontWeight: 700, color: '#fff', marginBottom: '.75rem' }}>
          14,99€ — Paiement unique
        </div>
        <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,.6)', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
          Des plans complets, structurés et personnalisables selon ta VMA.<br />
          Reçus instantanément par email.
        </p>
      </div>

      {/* ── GRILLE ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem 4rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,.4)' }}>Chargement…</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '1.5rem' }}>
            {ebooks.map(e => <EbookCard key={e.id} ebook={e} />)}
          </div>
        )}

        {/* ── COMMENT CA MARCHE ── */}
        <div style={{ marginTop: '5rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '2.5rem' }}>Comment ça marche ?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1.5rem', maxWidth: 800, margin: '0 auto 3rem' }}>
            {[
              { n: '1', icon: '📋', title: 'Choisis ton plan', text: 'Sélectionne le plan qui correspond à ton objectif et ton niveau.' },
              { n: '2', icon: '🔒', title: 'Paye en sécurité', text: 'Paiement 100% sécurisé via Stripe. Visa, Mastercard, Apple Pay.' },
              { n: '3', icon: '📬', title: 'Reçois ton PDF', text: 'Ton plan arrive dans ta boîte mail dans les secondes qui suivent.' },
              { n: '4', icon: '⚡', title: 'Calcule tes allures', text: 'Utilise notre calculateur VMA gratuit pour personnaliser chaque séance.' },
            ].map(s => (
              <div key={s.n} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 20, padding: '1.5rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', margin: '0 auto .875rem' }}>
                  {s.icon}
                </div>
                <div style={{ fontWeight: 700, marginBottom: '.4rem' }}>{s.title}</div>
                <div style={{ fontSize: '.85rem', color: 'rgba(255,255,255,.5)', lineHeight: 1.6 }}>{s.text}</div>
              </div>
            ))}
          </div>

          {/* CTA coaching */}
          <div style={{ background: 'rgba(139,47,201,.1)', border: '1px solid rgba(139,47,201,.25)', borderRadius: 24, padding: '2.5rem', maxWidth: 560, margin: '0 auto' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '.75rem' }}>🎯</div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '.75rem' }}>
              Tu préfères un suivi personnalisé ?
            </h3>
            <p style={{ color: 'rgba(255,255,255,.6)', fontSize: '.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Avec le coaching The Ultimate Academy, ton plan s'adapte chaque semaine selon tes sensations et tes progrès.
            </p>
            <Link to="/register" style={{ display: 'inline-block', background: grad, color: '#fff', textDecoration: 'none', borderRadius: 99, padding: '.75rem 2rem', fontWeight: 700, fontSize: '.95rem', boxShadow: '0 8px 24px rgba(232,35,122,.35)' }}>
              Coaching personnalisé — 14 jours gratuits
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function EbookCard({ ebook }) {
  const meta = EBOOK_META[ebook.slug] || {}
  return (
    <Link to={`/ebooks/${ebook.slug}`} style={{ textDecoration: 'none', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 20, overflow: 'hidden', transition: 'transform .15s, border-color .15s', cursor: 'pointer', flex: 1, display: 'flex', flexDirection: 'column' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'rgba(139,47,201,.4)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)' }}>
        {/* Couverture */}
        <div style={{ height: 160, background: `linear-gradient(135deg,#1A0A2E,#2D0B4E)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: grad, opacity: .15 }} />
          {ebook.cover_image
            ? <img src={ebook.cover_image} alt={ebook.title} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
            : <>
                <div style={{ fontSize: '2.5rem', marginBottom: '.5rem', position: 'relative' }}>{meta.icon || '📋'}</div>
                <div style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)', position: 'relative' }}>
                  {meta.distance || 'Guide'}
                </div>
              </>
          }
          <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(8px)', borderRadius: 99, padding: '.25rem .7rem', fontSize: '.72rem', fontWeight: 700 }}>
            {(ebook.price_cents / 100).toFixed(2).replace('.', ',')}€
          </div>
        </div>
        {/* Contenu */}
        <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 .5rem', fontSize: '1rem', fontWeight: 800, lineHeight: 1.3 }}>{ebook.title}</h3>
          <p style={{ margin: '0 0 1rem', fontSize: '.83rem', color: 'rgba(255,255,255,.55)', lineHeight: 1.6, flex: 1 }}>
            {ebook.description}
          </p>
          {meta.weeks && (
            <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem' }}>
              <span style={{ background: 'rgba(139,47,201,.15)', border: '1px solid rgba(139,47,201,.25)', borderRadius: 99, padding: '.2rem .65rem', fontSize: '.72rem', fontWeight: 600, color: '#C084FC' }}>
                {meta.weeks} semaines
              </span>
              <span style={{ background: 'rgba(232,35,122,.1)', border: '1px solid rgba(232,35,122,.2)', borderRadius: 99, padding: '.2rem .65rem', fontSize: '.72rem', fontWeight: 600, color: '#F472B6' }}>
                {meta.distance}
              </span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 800, fontSize: '1.1rem', background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {(ebook.price_cents / 100).toFixed(2).replace('.', ',')}€
            </span>
            <span style={{ background: grad, color: '#fff', borderRadius: 99, padding: '.45rem 1.1rem', fontSize: '.85rem', fontWeight: 700 }}>
              Acheter →
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
