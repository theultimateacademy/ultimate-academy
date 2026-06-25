import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import Nav from '../components/Nav'

const C = { purple: '#8B2FC9', pink: '#E8237A', bg: '#0C0A18' }
const grad = 'linear-gradient(135deg,#8B2FC9,#E8237A)'

const VARIANT_PRICE_TIERS = {
  '10km-8sem': { 3: 1499, 4: 1799, 5: 1999, 6: 2299 },
}

// Toutes les VMA disponibles : 10 à 24 par pas de 0.5
const VMA_OPTIONS = Array.from({ length: 29 }, (_, i) => parseFloat((10 + i * 0.5).toFixed(1)))

function isValidVma(v) {
  const n = Number(v)
  return Number.isFinite(n) && n >= 10 && n <= 24 && Math.round(n * 2) === n * 2
}

const EBOOK_DETAILS = {
  '10km-8sem': {
    icon: '🏃', weeks: 8, distance: '10 km', level: 'Tous niveaux',
    full_description: 'Un plan complet de 8 semaines pour préparer ta prochaine course de 10 km. Chaque séance est calculée depuis ta VMA réelle — tu cours aux bonnes allures, au bon moment, sans jamais avoir à convertir des pourcentages.',
    toc: [
      'Allures personnalisées en min/km calculées depuis ta VMA — zéro calcul à faire',
      'Semaines 1-2 · Adaptation — footings EF, fractionné 400m, sortie longue progressive',
      'Semaines 3-4 · Développement — tempo au seuil anaérobie, intervalles 1 000m, montée en volume',
      'Semaines 5-6 · Intensification — côtes, 300m VMA, blocs à allure spécifique 10km',
      'Semaine 7 · Consolidation — volume allégé, intensité maintenue, jambes fraîches',
      'Semaine 8 · Semaine de course — 8×30/30, activation J-1, stratégie km par km',
      'Stratégie de course en 4 phases avec tes allures exactes',
      'Nutrition avant et après course — veille, matin J, récupération',
    ],
    for_who: [
      { check: true,  text: 'Tu peux courir 30 minutes sans t\'arrêter — c\'est le seul prérequis' },
      { check: true,  text: 'Tu veux descendre sous les 60 min, 55 min, 50 min, 45 min ou même 40 min' },
      { check: true,  text: 'Tu prépares ta première course de 10km et tu veux un plan progressif et structuré' },
      { check: true,  text: 'Tu cours déjà mais sans méthode, et tu veux enfin progresser avec logique' },
      { check: true,  text: 'Tu as déjà couru un 10km et tu veux battre ton record personnel' },
      { check: true,  text: 'Tu t\'entraînes de 3 à 6 fois par semaine — le plan s\'adapte exactement à ta disponibilité' },
    ],
  },
  '10km-12sem': {
    icon: '🏃', weeks: 12, distance: '10 km', level: 'Tous niveaux',
    full_description: 'La version longue et progressive pour préparer un 10km en 12 semaines. Plus de temps pour construire ta base, développer ta VMA et arriver en pleine forme.',
    toc: [
      'Semaines 1-3 : Construction de base — endurance fondamentale',
      'Semaines 4-6 : Développement aérobie — sorties longues, côtes',
      'Semaines 7-9 : Bloc VMA — fractionnés courts et longs',
      'Semaines 10-11 : Allure spécifique — tempo et blocs 10km',
      'Semaine 12 : Consolidation et course',
      'Conseils nutrition et récupération',
    ],
    for_who: 'Tout coureur souhaitant une progression solide et durable sur 10km.',
  },
  'semi-12sem': {
    icon: '🏅', weeks: 12, distance: 'Semi-marathon', level: 'Intermédiaire',
    full_description: 'Prépare tes 21,1km avec un plan structuré de 12 semaines alliant volume kilométrique, séances de qualité et gestion de l\'effort sur la distance.',
    toc: [
      'Semaines 1-3 : Base endurance — EF, sorties longues progressives',
      'Semaines 4-6 : Volume — long runs jusqu\'à 18km, tempo',
      'Semaines 7-9 : Spécificité — allure semi, seuil lactique',
      'Semaines 10-11 : Consolidation — intensité maintenue, volume réduit',
      'Semaine 12 : Semaine de course',
      'Stratégie km par km pour le semi',
      'Ravitaillement et nutrition course',
    ],
    for_who: 'Coureur ayant déjà couru un 10km, prêt à passer au semi-marathon.',
  },
  'marathon-12sem': {
    icon: '🏆', weeks: 12, distance: 'Marathon', level: 'Confirmé',
    full_description: 'Un plan intense de 12 semaines pour les coureurs confirmés visant un objectif de temps sur marathon. Exigeant, efficace, structuré.',
    toc: [
      'Semaines 1-3 : Construction du volume — base kilométrique',
      'Semaines 4-6 : Long runs jusqu\'à 30km, allure marathon',
      'Semaines 7-9 : Qualité — seuil, allure spécifique, fractionnés',
      'Semaines 10-11 : Consolidation progressive',
      'Semaine 12 : Semaine de course',
      'Stratégie de course par blocs de 5km',
      'Nutrition, ravitaillement et hydratation',
    ],
    for_who: 'Coureur ayant terminé un semi-marathon, souhaitant aborder le marathon avec un plan structuré.',
  },
  'marathon-16sem': {
    icon: '🏆', weeks: 16, distance: 'Marathon', level: 'Tous niveaux',
    full_description: 'Le plan marathon complet. 16 semaines pour construire progressivement ton endurance, développer ta résistance et arriver au départ en pleine confiance.',
    toc: [
      'Semaines 1-4 : Fondation — endurance fondamentale, côtes',
      'Semaines 5-8 : Développement volume — long runs croissants',
      'Semaines 9-12 : Spécificité marathon — allures et seuil',
      'Semaines 13-14 : Intensification finale',
      'Semaines 15-16 : Consolidation et course',
      'Plans A / B / C selon l\'objectif',
      'Guide complet nutrition et hydratation',
    ],
    for_who: 'Tout coureur souhaitant préparer un marathon avec le temps nécessaire pour progresser sereinement.',
  },
  'anti-blessure': {
    icon: '🩺', weeks: null, distance: null, level: 'Tous niveaux',
    full_description: 'Le guide indispensable pour courir plus longtemps sans se blesser. Prévention, renforcement musculaire, soins et protocoles de reprise.',
    toc: [
      'Les blessures courantes du runner — causes et mécanismes',
      'Programme de renforcement musculaire complet (8 exercices)',
      'Routine d\'étirements et mobilité articulaire',
      'Signes d\'alerte : quand s\'arrêter, quand continuer',
      'Protocoles de reprise après blessure',
      'La règle des 10% et gestion de la charge',
      'Équipement et chaussures : ce qui compte vraiment',
    ],
    for_who: 'Tous les coureurs, débutants ou confirmés, qui veulent courir durablement.',
  },
}

// ─── Illustration SVG 10km ────────────────────────────────────────────────────
function Illustration10km() {
  return (
    <svg viewBox="0 0 640 260" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
      <defs>
        <linearGradient id="il-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1A0A2E" /><stop offset="100%" stopColor="#2D0B4E" />
        </linearGradient>
        <linearGradient id="il-g" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8B2FC9" /><stop offset="100%" stopColor="#E8237A" />
        </linearGradient>
        <linearGradient id="il-gv" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8B2FC9" /><stop offset="100%" stopColor="#E8237A" />
        </linearGradient>
        <radialGradient id="il-gl1" cx="20%" cy="55%" r="55%">
          <stop offset="0%" stopColor="#8B2FC9" stopOpacity="0.38" />
          <stop offset="100%" stopColor="#8B2FC9" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="il-gl2" cx="82%" cy="30%" r="45%">
          <stop offset="0%" stopColor="#E8237A" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#E8237A" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Fond */}
      <rect width="640" height="260" fill="url(#il-bg)" />
      <rect width="640" height="260" fill="url(#il-gl1)" />
      <rect width="640" height="260" fill="url(#il-gl2)" />

      {/* Piste — 3 ellipses concentriques */}
      <ellipse cx="160" cy="138" rx="132" ry="82" fill="none" stroke="url(#il-g)" strokeWidth="2.5" opacity="0.42" />
      <ellipse cx="160" cy="138" rx="93" ry="54" fill="none" stroke="url(#il-g)" strokeWidth="1.5" strokeDasharray="5,8" opacity="0.28" />
      <ellipse cx="160" cy="138" rx="55" ry="29" fill="none" stroke="rgba(139,47,201,0.7)" strokeWidth="1" opacity="0.38" />

      {/* Coureur — silhouette stylisée en foulée */}
      <g strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* Tête */}
        <circle cx="162" cy="66" r="13" fill="url(#il-g)" opacity="0.88" />
        {/* Corps */}
        <line x1="162" y1="79" x2="160" y2="116" stroke="url(#il-g)" strokeWidth="4.5" opacity="0.85" />
        {/* Bras avant (droit) */}
        <polyline points="160,96 183,82 189,75" stroke="url(#il-g)" strokeWidth="3" opacity="0.75" />
        {/* Bras arrière (gauche) */}
        <polyline points="160,96 139,112 133,120" stroke="url(#il-g)" strokeWidth="3" opacity="0.75" />
        {/* Jambe avant (gauche) */}
        <polyline points="160,116 141,150 126,154" stroke="url(#il-g)" strokeWidth="4.5" opacity="0.85" />
        {/* Pied avant */}
        <line x1="126" y1="154" x2="113" y2="150" stroke="url(#il-g)" strokeWidth="3" opacity="0.7" />
        {/* Jambe arrière shootée (droite) */}
        <polyline points="160,116 178,100 186,86" stroke="url(#il-g)" strokeWidth="4.5" opacity="0.85" />
      </g>

      {/* Lignes de vitesse */}
      <line x1="62" y1="110" x2="108" y2="108" stroke="url(#il-g)" strokeWidth="2.5" opacity="0.32" strokeLinecap="round" />
      <line x1="54" y1="122" x2="105" y2="121" stroke="url(#il-g)" strokeWidth="1.8" opacity="0.22" strokeLinecap="round" />
      <line x1="58" y1="134" x2="107" y2="133" stroke="url(#il-g)" strokeWidth="1.2" opacity="0.15" strokeLinecap="round" />

      {/* Point coureur sur la piste extérieure */}
      <circle cx="292" cy="57" r="7" fill="#E8237A" opacity="0.8" />
      <circle cx="292" cy="57" r="14" fill="none" stroke="#E8237A" strokeWidth="1.5" opacity="0.3" />
      <circle cx="292" cy="57" r="22" fill="none" stroke="#E8237A" strokeWidth="0.8" opacity="0.15" />

      {/* Ligne heartbeat */}
      <polyline fill="none" stroke="url(#il-g)" strokeWidth="1.8" strokeLinecap="round"
        strokeLinejoin="round" opacity="0.35"
        points="310,205 350,205 365,205 375,190 385,220 393,200 401,210 410,205 470,205 483,205 494,190 505,220 513,205 560,205 640,205" />

      {/* Filigrane 10 géant */}
      <text x="325" y="160" fontFamily="Poppins,sans-serif" fontSize="110" fontWeight="900"
        fill="url(#il-g)" opacity="0.07" letterSpacing="-5">10</text>

      {/* Titre "10 KM" */}
      <text x="352" y="152" fontFamily="Poppins,sans-serif" fontSize="54" fontWeight="900"
        fill="url(#il-g)" opacity="0.92" letterSpacing="-2">10 KM</text>
      <text x="360" y="177" fontFamily="Poppins,sans-serif" fontSize="12.5" fontWeight="700"
        fill="rgba(255,255,255,0.5)" letterSpacing="5">8 SEMAINES</text>

      {/* Barres de charge hebdomadaire */}
      {/* S1:40% S2:55% S3:65% S4:75% S5:90% S6:95% S7:60% S8:20% → max 55px */}
      <rect x="347" y="220" width="15" height="22" rx="3" fill="url(#il-gv)" opacity="0.42" />
      <rect x="367" y="212" width="15" height="30" rx="3" fill="url(#il-gv)" opacity="0.50" />
      <rect x="387" y="205" width="15" height="37" rx="3" fill="url(#il-gv)" opacity="0.58" />
      <rect x="407" y="197" width="15" height="45" rx="3" fill="url(#il-gv)" opacity="0.66" />
      <rect x="427" y="185" width="15" height="57" rx="3" fill="url(#il-gv)" opacity="0.80" />
      <rect x="447" y="180" width="15" height="62" rx="3" fill="url(#il-gv)" opacity="0.88" />
      <rect x="467" y="208" width="15" height="34" rx="3" fill="url(#il-gv)" opacity="0.55" />
      <rect x="487" y="228" width="15" height="14" rx="3" fill="url(#il-gv)" opacity="0.32" />
      <text x="348" y="252" fontFamily="Poppins,sans-serif" fontSize="7.5"
        fill="rgba(255,255,255,0.28)" letterSpacing="4.5">S1 S2 S3 S4 S5 S6 S7 S8</text>

      {/* Badge VMA */}
      <rect x="330" y="22" width="198" height="27" rx="13.5"
        fill="rgba(139,47,201,0.18)" stroke="rgba(139,47,201,0.5)" strokeWidth="1" />
      <text x="429" y="40.5" fontFamily="Poppins,sans-serif" fontSize="10.5" fontWeight="700"
        fill="#C084FC" textAnchor="middle" letterSpacing="2.5">VMA PERSONNALISÉE</text>

      {/* Étoiles / particules */}
      <circle cx="320" cy="32" r="2.2" fill="white" opacity="0.38" />
      <circle cx="395" cy="20" r="1.5" fill="white" opacity="0.30" />
      <circle cx="570" cy="42" r="2.8" fill="#C084FC" opacity="0.45" />
      <circle cx="28" cy="42" r="2" fill="white" opacity="0.38" />
      <circle cx="600" cy="155" r="1.8" fill="#F472B6" opacity="0.40" />
      <circle cx="558" cy="178" r="1.2" fill="white" opacity="0.28" />
      <circle cx="70" cy="210" r="1.5" fill="#8B2FC9" opacity="0.35" />
      <circle cx="270" cy="230" r="1" fill="white" opacity="0.22" />
    </svg>
  )
}

// ─── Illustration générique (autres ebooks) ───────────────────────────────────
function IllustrationGeneric({ icon, title }) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0,
      background: 'linear-gradient(135deg,#1A0A2E,#2D0B4E)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: grad, opacity: .18 }} />
      <div style={{ fontSize: '3.5rem', position: 'relative', marginBottom: '.5rem' }}>{icon}</div>
      <div style={{ position: 'relative', fontSize: '1rem', fontWeight: 800, color: 'rgba(255,255,255,.8)' }}>{title}</div>
    </div>
  )
}

// ─── Aperçu flouté ────────────────────────────────────────────────────────────
function BlurredPreview({ slug }) {
  if (slug !== '10km-8sem') return null

  const sessionColors = ['#06B6D4', '#F97316', '#22C55E', '#A855F7']
  const weekData = [
    { day: 'MAR', color: '#06B6D4', label: 'Endurance' },
    { day: 'JEU', color: '#F97316', label: '10 × 400m' },
    { day: 'SAM', color: '#06B6D4', label: 'Récupération' },
    { day: 'DIM', color: '#22C55E', label: 'Sortie longue' },
  ]

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h3 style={{ margin: '0 0 .75rem', fontSize: '.95rem', fontWeight: 800 }}>
        👁 Aperçu du plan
      </h3>
      <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden',
        border: '1px solid rgba(255,255,255,.08)' }}>

        {/* 3 mini-pages côte à côte */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: '#0C0A18' }}>

          {/* Page 1 — Couverture (légèrement visible) */}
          <div style={{ padding: '12px 10px', background: 'linear-gradient(135deg,#1A0A2E,#2D0B4E)',
            minHeight: 180, display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 6, borderRight: '1px solid rgba(255,255,255,.06)' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, lineHeight: 1,
              background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>10</div>
            <div style={{ fontSize: '.9rem', fontWeight: 900,
              background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>KM</div>
            <div style={{ fontSize: '.48rem', fontWeight: 700, color: 'rgba(255,255,255,.45)',
              letterSpacing: '2px', marginTop: 4 }}>8 SEMAINES</div>
            <div style={{ width: 30, height: 1.5, background: grad, borderRadius: 1, margin: '2px 0' }} />
            <div style={{ fontSize: '.4rem', color: 'rgba(255,255,255,.3)', letterSpacing: '1px', textTransform: 'uppercase' }}>
              The Ultimate Academy
            </div>
          </div>

          {/* Page 2 — Semaine type (floutée) */}
          <div style={{ padding: '10px 8px', minHeight: 180, filter: 'blur(4px)',
            userSelect: 'none', borderRight: '1px solid rgba(255,255,255,.06)', overflow: 'hidden' }}>
            <div style={{ fontSize: '.5rem', fontWeight: 700, color: 'rgba(255,255,255,.35)',
              textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 4 }}>Semaine 1 / 8</div>
            <div style={{ fontSize: '.7rem', fontWeight: 900,
              background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              marginBottom: 8 }}>ADAPTATION</div>
            <div style={{ fontSize: '.4rem', color: 'rgba(255,255,255,.5)', marginBottom: 8, lineHeight: 1.5 }}>
              Objectif : installer les habitudes et prendre ses marques sur les allures.
            </div>
            {weekData.map((s, i) => (
              <div key={i} style={{ marginBottom: 5, background: `${s.color}18`,
                borderLeft: `2px solid ${s.color}`, borderRadius: '0 4px 4px 0', padding: '3px 5px' }}>
                <div style={{ fontSize: '.38rem', fontWeight: 700, color: 'rgba(255,255,255,.4)',
                  textTransform: 'uppercase', letterSpacing: '1px' }}>{s.day}</div>
                <div style={{ fontSize: '.44rem', fontWeight: 700, color: s.color }}>{s.label}</div>
                <div style={{ height: 2, background: `${s.color}40`, borderRadius: 1, marginTop: 2 }} />
                <div style={{ height: 1.5, background: `${s.color}25`, borderRadius: 1, marginTop: 1, width: '70%' }} />
              </div>
            ))}
          </div>

          {/* Page 3 — Stratégie de course (floutée) */}
          <div style={{ padding: '10px 8px', minHeight: 180, filter: 'blur(4px)',
            userSelect: 'none', overflow: 'hidden' }}>
            <div style={{ fontSize: '.6rem', fontWeight: 900,
              background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              marginBottom: 8, lineHeight: 1.3 }}>STRATÉGIE<br/>DE COURSE</div>
            {[
              { km: 'KM 1-2', c: '#06B6D4', label: 'Patience' },
              { km: 'KM 3-8', c: '#22C55E', label: 'Régularité' },
              { km: 'KM 9',   c: '#F97316', label: 'Accélération' },
              { km: 'KM 10',  c: '#EF4444', label: 'Tout donner' },
            ].map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: 4, alignItems: 'flex-start', marginBottom: 6 }}>
                <div style={{ fontSize: '.42rem', fontWeight: 800, color: p.c, flexShrink: 0, width: 24 }}>{p.km}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '.44rem', fontWeight: 700, color: 'rgba(255,255,255,.7)' }}>{p.label}</div>
                  <div style={{ height: 1.5, background: `${p.c}50`, borderRadius: 1, marginTop: 2 }} />
                  <div style={{ height: 1, background: 'rgba(255,255,255,.1)', borderRadius: 1, marginTop: 1.5, width: '65%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dégradé + overlay CTA */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(to bottom, transparent 25%, rgba(12,10,24,.75) 65%, rgba(12,10,24,.97) 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1rem',
          textAlign: 'center' }}>
          <div style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.45)', marginBottom: '.35rem' }}>
            🔒 Contenu complet déverrouillé après achat
          </div>
          <div style={{ fontSize: '.72rem', fontWeight: 600,
            background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            15 pages · allures personnalisées · livré en secondes par email
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function EbookDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [ebook,   setEbook]   = useState(null)
  const [email,   setEmail]   = useState('')
  const [vma,     setVma]     = useState('')
  const [seances, setSeances] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paying,  setPaying]  = useState(false)
  const [error,   setError]   = useState(null)

  const meta = EBOOK_DETAILS[slug] || {}
  const priceTiers = VARIANT_PRICE_TIERS[slug]
  const isVariant  = !!priceTiers

  const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

  useEffect(() => {
    fetch(`${API}/api/ebooks/${slug}`)
      .then(r => r.ok ? r.json() : Promise.reject('not found'))
      .then(d => setEbook(d.ebook))
      .catch(() => navigate('/ebooks'))
      .finally(() => setLoading(false))
  }, [slug])

  const minCents = isVariant ? Math.min(...Object.values(priceTiers)) : null
  const displayPriceCents = isVariant
    ? (seances ? priceTiers[seances] : minCents)
    : ebook?.price_cents

  const canCheckout = email.trim() && ebook && (!isVariant || (isValidVma(vma) && seances))

  async function handleCheckout(e) {
    e.preventDefault()
    if (!canCheckout) return
    setPaying(true)
    setError(null)
    try {
      const res = await fetch(`${API}/api/ebooks/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ebook_id: ebook.id, email: email.trim(), slug,
          ...(isVariant ? { vma: Number(vma), seances } : {}),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur paiement')
      window.location.href = data.url
    } catch (err) {
      setError(err.message)
      setPaying(false)
    }
  }

  if (loading) return (
    <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'rgba(255,255,255,.4)' }}>Chargement…</div>
    </div>
  )
  if (!ebook) return null

  const forWhoIsArray = Array.isArray(meta.for_who)

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: '#fff', fontFamily: 'inherit' }}>
      <Nav />
      <div style={{ maxWidth: 940, margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>
        <Link to="/ebooks" style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem',
          color: 'rgba(255,255,255,.5)', textDecoration: 'none', fontSize: '.85rem',
          marginBottom: '2rem', fontWeight: 500 }}>
          ← Tous les plans
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,340px)', gap: '2.5rem', alignItems: 'start' }}>

          {/* ── Colonne gauche ── */}
          <div>
            {/* Illustration */}
            <div style={{ height: 260, borderRadius: 20, overflow: 'hidden', position: 'relative', marginBottom: '1.5rem' }}>
              {slug === '10km-8sem'
                ? <Illustration10km />
                : ebook.cover_image
                  ? <img src={ebook.cover_image} alt={ebook.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <IllustrationGeneric icon={meta.icon || '📋'} title={ebook.title} />
              }
              {/* Badge prix */}
              <div style={{ position: 'absolute', top: 14, right: 14,
                borderRadius: 99, padding: '.3rem .85rem',
                fontSize: '.75rem', fontWeight: 800,
                background: grad, color: '#fff',
                boxShadow: '0 4px 14px rgba(232,35,122,.35)' }}>
                À partir de {(minCents || ebook.price_cents) / 100}€
              </div>
            </div>

            {/* Chips */}
            <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
              {meta.weeks && <Chip color={C.purple}>{meta.weeks} semaines</Chip>}
              {meta.distance && <Chip color={C.pink}>{meta.distance}</Chip>}
              {meta.level && <Chip color="#10B981">{meta.level}</Chip>}
              <Chip color="#F59E0B">📬 PDF par email</Chip>
            </div>

            <h1 style={{ fontSize: 'clamp(1.4rem,4vw,2rem)', fontWeight: 900, margin: '0 0 1rem', lineHeight: 1.2 }}>
              {ebook.title}
            </h1>
            <p style={{ color: 'rgba(255,255,255,.7)', lineHeight: 1.8, marginBottom: '1.75rem' }}>
              {meta.full_description || ebook.description}
            </p>

            {/* Pour qui */}
            {meta.for_who && (
              <div style={{ background: 'rgba(16,185,129,.07)', border: '1px solid rgba(16,185,129,.2)',
                borderRadius: 16, padding: '1.25rem 1.5rem', marginBottom: '1.75rem' }}>
                <div style={{ fontSize: '.72rem', fontWeight: 800, color: '#10B981',
                  textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.75rem' }}>
                  Pour qui est ce plan ?
                </div>
                {forWhoIsArray ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                    {meta.for_who.map((item, i) => (
                      <div key={i} style={{ display: 'flex', gap: '.65rem', alignItems: 'flex-start' }}>
                        <span style={{ color: '#10B981', fontWeight: 800, fontSize: '1rem', lineHeight: 1.4, flexShrink: 0 }}>✓</span>
                        <span style={{ fontSize: '.88rem', color: 'rgba(255,255,255,.8)', lineHeight: 1.55 }}>{item.text}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: '.5rem', padding: '.6rem .8rem',
                      background: 'rgba(16,185,129,.1)', borderRadius: 10,
                      fontSize: '.8rem', color: '#6EE7B7', fontWeight: 600 }}>
                      👟 Seul prérequis : pouvoir courir 30 minutes sans s'arrêter
                    </div>
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: '.9rem', color: 'rgba(255,255,255,.75)', lineHeight: 1.6 }}>{meta.for_who}</p>
                )}
              </div>
            )}

            {/* Contenu du plan */}
            {meta.toc && (
              <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
                borderRadius: 20, padding: '1.5rem', marginBottom: '1.75rem' }}>
                <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 800 }}>📋 Contenu du plan</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
                  {meta.toc.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-start' }}>
                      <span style={{ width: 22, height: 22, borderRadius: '50%', background: grad,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '.62rem', fontWeight: 800, flexShrink: 0, marginTop: '.1rem' }}>{i + 1}</span>
                      <span style={{ fontSize: '.875rem', color: 'rgba(255,255,255,.8)', lineHeight: 1.55 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Aperçu flouté */}
            <BlurredPreview slug={slug} />
          </div>

          {/* ── Colonne droite — achat (sticky) ── */}
          <div style={{ position: 'sticky', top: '1.5rem' }}>
            <div style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)',
              borderRadius: 24, padding: '1.75rem' }}>

              {/* Prix */}
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'rgba(255,255,255,.4)',
                  textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.3rem' }}>
                  {isVariant && !seances ? 'À partir de' : 'Prix'}
                </div>
                <div style={{ fontSize: '2.6rem', fontWeight: 900,
                  background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  {((displayPriceCents || minCents || ebook.price_cents) / 100).toFixed(2).replace('.', ',')}€
                </div>
                <div style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.38)', marginTop: '.2rem' }}>
                  Paiement unique · accès à vie
                </div>
              </div>

              <form onSubmit={handleCheckout}>
                {isVariant && (
                  <>
                    {/* VMA */}
                    <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700,
                      color: 'rgba(255,255,255,.55)', marginBottom: '.4rem', letterSpacing: '.03em' }}>
                      Ta VMA (km/h) *
                    </label>
                    <select
                      required value={vma} onChange={e => setVma(e.target.value)}
                      style={{ width: '100%', padding: '.75rem 1rem', borderRadius: 12,
                        border: `1.5px solid ${vma ? 'rgba(139,47,201,.5)' : 'rgba(255,255,255,.12)'}`,
                        background: 'rgba(255,255,255,.07)', color: vma ? '#fff' : 'rgba(255,255,255,.35)',
                        fontSize: '.95rem', fontFamily: 'inherit', marginBottom: '.4rem',
                        boxSizing: 'border-box', cursor: 'pointer', appearance: 'none',
                        WebkitAppearance: 'none', outline: 'none' }}>
                      <option value="" disabled>Sélectionne ta VMA…</option>
                      {VMA_OPTIONS.map(v => (
                        <option key={v} value={v} style={{ background: '#1A0A2E', color: '#fff' }}>
                          {v} km/h
                        </option>
                      ))}
                    </select>
                    <div style={{ marginBottom: '1rem' }}>
                      <Link to="/calculateur/vma"
                        style={{ color: '#C084FC', fontSize: '.78rem', fontWeight: 600, textDecoration: 'none' }}>
                        Tu ne connais pas ta VMA ? Calcule-la ici →
                      </Link>
                    </div>

                    {/* Séances */}
                    <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700,
                      color: 'rgba(255,255,255,.55)', marginBottom: '.5rem', letterSpacing: '.03em' }}>
                      Séances par semaine *
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '.5rem', marginBottom: '1rem' }}>
                      {Object.keys(priceTiers).map(Number).sort((a, b) => a - b).map(n => (
                        <button key={n} type="button" onClick={() => setSeances(n)}
                          style={{ padding: '.65rem .3rem', borderRadius: 12, cursor: 'pointer',
                            fontFamily: 'inherit', transition: 'all .15s',
                            border: seances === n ? `1.5px solid ${C.purple}` : '1.5px solid rgba(255,255,255,.12)',
                            background: seances === n ? 'rgba(139,47,201,.22)' : 'rgba(255,255,255,.06)',
                            color: seances === n ? '#fff' : 'rgba(255,255,255,.65)' }}>
                          <div style={{ fontWeight: 900, fontSize: '1.05rem' }}>{n}</div>
                          <div style={{ fontSize: '.65rem', marginTop: '.15rem', opacity: .75 }}>
                            {(priceTiers[n] / 100).toFixed(2).replace('.', ',')}€
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* Email */}
                <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700,
                  color: 'rgba(255,255,255,.55)', marginBottom: '.4rem', letterSpacing: '.03em' }}>
                  Ton adresse email *
                </label>
                <input
                  type="email" required placeholder="prenom@email.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                  style={{ width: '100%', padding: '.75rem 1rem', borderRadius: 12,
                    border: '1.5px solid rgba(255,255,255,.12)',
                    background: 'rgba(255,255,255,.07)', color: '#fff',
                    fontSize: '.95rem', fontFamily: 'inherit',
                    marginBottom: '.75rem', boxSizing: 'border-box', outline: 'none' }}
                />

                {error && <p style={{ color: '#F87171', fontSize: '.8rem', margin: '-.25rem 0 .75rem' }}>{error}</p>}

                <button type="submit" disabled={!canCheckout || paying}
                  style={{ width: '100%', padding: '.9rem', borderRadius: 99, border: 'none',
                    background: (!canCheckout || paying) ? 'rgba(255,255,255,.08)' : grad,
                    color: (!canCheckout || paying) ? 'rgba(255,255,255,.3)' : '#fff',
                    fontWeight: 800, fontSize: '1rem', cursor: (!canCheckout || paying) ? 'default' : 'pointer',
                    fontFamily: 'inherit',
                    boxShadow: (!canCheckout || paying) ? 'none' : '0 8px 28px rgba(232,35,122,.4)',
                    transition: 'all .2s' }}>
                  {paying ? '⏳ Redirection…' : 'Obtenir mon plan →'}
                </button>
              </form>

              {/* Trust badges */}
              <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '.45rem' }}>
                {['🔒 Paiement sécurisé Stripe', '📬 PDF reçu instantanément par email', '📱 Compatible mobile, tablette, ordinateur'].map(t => (
                  <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '.5rem',
                    fontSize: '.78rem', color: 'rgba(255,255,255,.4)' }}>
                    {t}
                  </div>
                ))}
              </div>
            </div>

            {/* Calcul VMA */}
            <div style={{ marginTop: '1rem', background: 'rgba(139,47,201,.1)',
              border: '1px solid rgba(139,47,201,.2)', borderRadius: 16, padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.55)', marginBottom: '.5rem', lineHeight: 1.5 }}>
                💡 Tu ne connais pas ta VMA ?<br />Utilise notre calculateur gratuit.
              </div>
              <Link to="/calculateur/vma"
                style={{ color: '#C084FC', fontSize: '.85rem', fontWeight: 700, textDecoration: 'none' }}>
                Calculateur VMA gratuit →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Chip({ children, color }) {
  return (
    <span style={{ background: color + '18', border: `1px solid ${color}35`,
      borderRadius: 99, padding: '.22rem .7rem', fontSize: '.72rem', fontWeight: 700, color }}>
      {children}
    </span>
  )
}
