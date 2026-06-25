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
          À partir de 14,99 € — Paiement unique
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

function CardIllustrationRunning({ gid, dist, weeksLabel }) {
  const distFs = dist.length <= 2 ? 68 : dist.length <= 4 ? 56 : 48
  return (
    <svg viewBox="0 0 320 160" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
      <defs>
        <linearGradient id={`${gid}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1A0A2E"/><stop offset="100%" stopColor="#2D0B4E"/>
        </linearGradient>
        <linearGradient id={`${gid}-g`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8B2FC9"/><stop offset="100%" stopColor="#E8237A"/>
        </linearGradient>
        <radialGradient id={`${gid}-gl`} cx="50%" cy="50%" r="65%">
          <stop offset="0%" stopColor="#8B2FC9" stopOpacity="0.24"/>
          <stop offset="100%" stopColor="#8B2FC9" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <rect width="320" height="160" fill={`url(#${gid}-bg)`}/>
      <rect width="320" height="160" fill={`url(#${gid}-gl)`}/>
      <text x="160" y="88" fontFamily="Poppins,sans-serif" fontSize={distFs} fontWeight="900"
        fill={`url(#${gid}-g)`} opacity="0.92" letterSpacing="-1" textAnchor="middle">{dist}</text>
      <text x="160" y="112" fontFamily="Poppins,sans-serif" fontSize="21" fontWeight="900"
        fill={`url(#${gid}-g)`} opacity="0.80" letterSpacing="5" textAnchor="middle">KM</text>
      <text x="160" y="130" fontFamily="Poppins,sans-serif" fontSize="7" fontWeight="700"
        fill="rgba(255,255,255,.35)" letterSpacing="4" textAnchor="middle">{weeksLabel} SEMAINES</text>
      <rect x="124" y="136" width="72" height="1" rx="1" fill={`url(#${gid}-g)`} opacity="0.35"/>
      <circle cx="28" cy="22" r="1" fill="white" opacity="0.14"/>
      <circle cx="292" cy="18" r="1.4" fill="#C084FC" opacity="0.22"/>
      <circle cx="44" cy="138" r="1" fill="white" opacity="0.13"/>
      <circle cx="276" cy="142" r="1.2" fill="#F472B6" opacity="0.18"/>
    </svg>
  )
}

function CardIllustrationAntiBlessure() {
  return (
    <svg viewBox="0 0 320 160" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
      <defs>
        <linearGradient id="cab-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1A0A2E"/><stop offset="100%" stopColor="#2D0B4E"/>
        </linearGradient>
        <linearGradient id="cab-g" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8B2FC9"/><stop offset="100%" stopColor="#E8237A"/>
        </linearGradient>
        <radialGradient id="cab-gl" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#8B2FC9" stopOpacity="0.22"/>
          <stop offset="100%" stopColor="#8B2FC9" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <rect width="320" height="160" fill="url(#cab-bg)"/>
      <rect width="320" height="160" fill="url(#cab-gl)"/>
      <path d="M 160,10 L 235,30 L 235,95 C 235,128 160,148 160,148 C 160,148 85,128 85,95 L 85,30 Z"
        fill="none" stroke="url(#cab-g)" strokeWidth="1.5" opacity="0.22"/>
      <path d="M 160,18 L 225,36 L 225,92 C 225,121 160,140 160,140 C 160,140 95,121 95,92 L 95,36 Z"
        fill="rgba(139,47,201,.06)"/>
      <text x="160" y="68" fontFamily="Poppins,sans-serif" fontSize="18" fontWeight="700"
        fill="rgba(255,255,255,.45)" letterSpacing="8" textAnchor="middle">ANTI</text>
      <text x="160" y="100" fontFamily="Poppins,sans-serif" fontSize="28" fontWeight="900"
        fill="url(#cab-g)" opacity="0.88" textAnchor="middle">BLESSURE</text>
      <text x="160" y="118" fontFamily="Poppins,sans-serif" fontSize="6.5" fontWeight="700"
        fill="rgba(255,255,255,.32)" letterSpacing="3.5" textAnchor="middle">COURIR DURABLEMENT</text>
      <circle cx="42" cy="28" r="1.2" fill="white" opacity="0.14"/>
      <circle cx="278" cy="22" r="1.5" fill="#C084FC" opacity="0.20"/>
      <circle cx="292" cy="134" r="1" fill="white" opacity="0.12"/>
    </svg>
  )
}

function EbookCard({ ebook }) {
  const meta = EBOOK_META[ebook.slug] || {}
  const priceLabel = 'À partir de 14,99 €'

  return (
    <Link to={`/ebooks/${ebook.slug}`} style={{ textDecoration: 'none', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 20, overflow: 'hidden', transition: 'transform .15s, border-color .15s', cursor: 'pointer', flex: 1, display: 'flex', flexDirection: 'column' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'rgba(139,47,201,.4)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)' }}>

        {/* Couverture */}
        <div style={{ height: 170, background: 'linear-gradient(135deg,#1A0A2E,#2D0B4E)', position: 'relative', overflow: 'hidden' }}>
          {(() => {
            if (ebook.slug === '10km-8sem')      return <CardIllustrationRunning gid="c8"   dist="10"     weeksLabel="8"  />
            if (ebook.slug === '10km-12sem')     return <CardIllustrationRunning gid="c10"  dist="10"     weeksLabel="12" />
            if (ebook.slug === 'semi-12sem')     return <CardIllustrationRunning gid="cs"   dist="21,097" weeksLabel="12" />
            if (ebook.slug === 'marathon-12sem') return <CardIllustrationRunning gid="cm12" dist="42,195" weeksLabel="12" />
            if (ebook.slug === 'marathon-16sem') return <CardIllustrationRunning gid="cm16" dist="42,195" weeksLabel="16" />
            if (ebook.slug === 'anti-blessure')  return <CardIllustrationAntiBlessure />
            if (ebook.cover_image) return <img src={ebook.cover_image} alt={ebook.title} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
            return (
              <>
                <div style={{ position: 'absolute', inset: 0, background: grad, opacity: .18 }} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: '2.8rem', marginBottom: '.5rem' }}>{meta.icon || '📋'}</div>
                  <div style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)' }}>
                    {meta.distance || 'Guide'}
                  </div>
                </div>
              </>
            )
          })()}
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
