import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Nav from '../components/Nav'

const C = { purple: '#8B2FC9', pink: '#E8237A', bg: '#0C0A18' }
const grad = 'linear-gradient(135deg,#8B2FC9,#E8237A)'

// Ebooks à variantes : prix qui dépend du nombre de séances/semaine choisi à l'achat.
const VARIANT_PRICE_TIERS = {
  '10km-8sem': { 3: 1499, 4: 1799, 5: 1999, 6: 2299 },
}

const EBOOK_META = {
  '10km-8sem':      { icon: '🏃', weeks: 8,  distance: '10 km',         tags: ['VMA personnalisée', 'Allures en min/km', 'Stratégie course'] },
  '10km-12sem':     { icon: '🏃', weeks: 12, distance: '10 km',         tags: ['12 semaines', 'Développement VMA', 'Stratégie et nutrition'] },
  'semi-12sem':     { icon: '🏅', weeks: 12, distance: 'Semi-marathon', tags: ['Long runs 18km', 'Seuil lactique', 'Nutrition course'] },
  'marathon-12sem': { icon: '🏆', weeks: 12, distance: 'Marathon',      tags: ['Long runs 30km', 'Allure marathon', 'Stratégie ravitaillement'] },
  'marathon-16sem': { icon: '🏆', weeks: 16, distance: 'Marathon',      tags: ['Progression sur 4 mois', 'Plans A/B/C', 'Hydratation complète'] },
  'anti-blessure':  { icon: '🩺', weeks: null, distance: null,          tags: ['Prévention blessures', 'Renforcement musculaire', 'Protocoles reprise'] },
}

export default function EbooksPage() {
  const [ebooks, setEbooks] = useState([])
  const [loading, setLoading] = useState(true)

  const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

  useEffect(() => {
    fetch(`${API}/api/ebooks`)
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

function CardIllustration10km() {
  return (
    <svg viewBox="0 0 320 160" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
      <defs>
        <linearGradient id="cd-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1A0A2E"/><stop offset="100%" stopColor="#2D0B4E"/>
        </linearGradient>
        <linearGradient id="cd-g" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8B2FC9"/><stop offset="100%" stopColor="#E8237A"/>
        </linearGradient>
        <linearGradient id="cd-gv" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8B2FC9"/><stop offset="100%" stopColor="#E8237A"/>
        </linearGradient>
        <radialGradient id="cd-gl" cx="25%" cy="55%" r="55%">
          <stop offset="0%" stopColor="#8B2FC9" stopOpacity="0.35"/>
          <stop offset="100%" stopColor="#8B2FC9" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <rect width="320" height="160" fill="url(#cd-bg)"/>
      <rect width="320" height="160" fill="url(#cd-gl)"/>

      {/* Piste */}
      <ellipse cx="85" cy="82" rx="72" ry="46" fill="none" stroke="url(#cd-g)" strokeWidth="1.5" opacity="0.42"/>
      <ellipse cx="85" cy="82" rx="50" ry="30" fill="none" stroke="url(#cd-g)" strokeWidth="1" strokeDasharray="4,6" opacity="0.25"/>

      {/* Coureur */}
      <circle cx="86" cy="44" r="7" fill="url(#cd-g)" opacity="0.85"/>
      <line x1="86" y1="51" x2="85" y2="68" stroke="url(#cd-g)" strokeWidth="2.5" strokeLinecap="round" opacity="0.85"/>
      <polyline points="85,58 96,51 99,47" stroke="url(#cd-g)" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.75"/>
      <polyline points="85,58 75,65 72,70" stroke="url(#cd-g)" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.75"/>
      <polyline points="85,68 76,86 68,88" stroke="url(#cd-g)" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.85"/>
      <polyline points="85,68 95,60 100,51" stroke="url(#cd-g)" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.85"/>

      {/* Lignes vitesse */}
      <line x1="34" y1="66" x2="58" y2="64" stroke="url(#cd-g)" strokeWidth="1.5" opacity="0.3" strokeLinecap="round"/>
      <line x1="29" y1="73" x2="56" y2="72" stroke="url(#cd-g)" strokeWidth="1" opacity="0.2" strokeLinecap="round"/>

      {/* 10 KM */}
      <text x="175" y="88" fontFamily="Poppins,sans-serif" fontSize="60" fontWeight="900"
        fill="url(#cd-g)" opacity="0.08" letterSpacing="-3">10</text>
      <text x="182" y="94" fontFamily="Poppins,sans-serif" fontSize="32" fontWeight="900"
        fill="url(#cd-g)" opacity="0.92" letterSpacing="-1">10 KM</text>
      <text x="186" y="112" fontFamily="Poppins,sans-serif" fontSize="8" fontWeight="700"
        fill="rgba(255,255,255,0.45)" letterSpacing="3.5">8 SEMAINES</text>

      {/* Barres charge */}
      <rect x="176" y="128" width="8" height="12" rx="2" fill="url(#cd-gv)" opacity="0.42"/>
      <rect x="188" y="123" width="8" height="17" rx="2" fill="url(#cd-gv)" opacity="0.52"/>
      <rect x="200" y="118" width="8" height="22" rx="2" fill="url(#cd-gv)" opacity="0.62"/>
      <rect x="212" y="112" width="8" height="28" rx="2" fill="url(#cd-gv)" opacity="0.75"/>
      <rect x="224" y="105" width="8" height="35" rx="2" fill="url(#cd-gv)" opacity="0.88"/>
      <rect x="236" y="102" width="8" height="38" rx="2" fill="url(#cd-gv)" opacity="0.92"/>
      <rect x="248" y="120" width="8" height="20" rx="2" fill="url(#cd-gv)" opacity="0.55"/>
      <rect x="260" y="133" width="8" height="7" rx="2" fill="url(#cd-gv)" opacity="0.30"/>

      {/* Étoiles */}
      <circle cx="165" cy="22" r="1.5" fill="white" opacity="0.35"/>
      <circle cx="295" cy="30" r="2" fill="#C084FC" opacity="0.4"/>
      <circle cx="15" cy="25" r="1.5" fill="white" opacity="0.3"/>
    </svg>
  )
}

function EbookCard({ ebook }) {
  const meta = EBOOK_META[ebook.slug] || {}
  const tiers = VARIANT_PRICE_TIERS[ebook.slug]
  const fromCents = tiers ? Math.min(...Object.values(tiers)) : ebook.price_cents
  const priceLabel = tiers
    ? `À partir de ${(fromCents / 100).toFixed(2).replace('.', ',')}€`
    : `${(fromCents / 100).toFixed(2).replace('.', ',')}€`

  return (
    <Link to={`/ebooks/${ebook.slug}`} style={{ textDecoration: 'none', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 20, overflow: 'hidden', transition: 'transform .15s, border-color .15s', cursor: 'pointer', flex: 1, display: 'flex', flexDirection: 'column' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'rgba(139,47,201,.4)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)' }}>

        {/* Couverture */}
        <div style={{ height: 170, background: 'linear-gradient(135deg,#1A0A2E,#2D0B4E)', position: 'relative', overflow: 'hidden' }}>
          {ebook.slug === '10km-8sem'
            ? <CardIllustration10km />
            : ebook.cover_image
              ? <img src={ebook.cover_image} alt={ebook.title} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
              : <>
                  <div style={{ position: 'absolute', inset: 0, background: grad, opacity: .18 }} />
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontSize: '2.8rem', marginBottom: '.5rem' }}>{meta.icon || '📋'}</div>
                    <div style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)' }}>
                      {meta.distance || 'Guide'}
                    </div>
                  </div>
                </>
          }
          {/* Badge prix */}
          <div style={{ position: 'absolute', top: 12, right: 12,
            background: grad, borderRadius: 99, padding: '.25rem .75rem',
            fontSize: '.72rem', fontWeight: 800, color: '#fff',
            boxShadow: '0 4px 12px rgba(232,35,122,.3)' }}>
            {priceLabel}
          </div>
        </div>

        {/* Contenu */}
        <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 .5rem', fontSize: '1rem', fontWeight: 800, lineHeight: 1.3 }}>{ebook.title}</h3>
          <p style={{ margin: '0 0 1rem', fontSize: '.83rem', color: 'rgba(255,255,255,.55)', lineHeight: 1.6, flex: 1 }}>
            {ebook.description}
          </p>
          {/* Tags */}
          {meta.tags && (
            <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              {meta.tags.slice(0, 2).map(t => (
                <span key={t} style={{ background: 'rgba(139,47,201,.12)', border: '1px solid rgba(139,47,201,.22)',
                  borderRadius: 99, padding: '.18rem .6rem', fontSize: '.68rem', fontWeight: 600, color: '#C084FC' }}>
                  {t}
                </span>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 800, fontSize: '1rem', background: grad,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {priceLabel}
            </span>
            <span style={{ background: grad, color: '#fff', borderRadius: 99, padding: '.45rem 1.1rem', fontSize: '.85rem', fontWeight: 700 }}>
              Découvrir →
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
