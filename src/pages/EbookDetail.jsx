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
    full_description: 'Un plan complet de 8 semaines pour préparer ta prochaine course de 10 km. Chaque séance est calculée depuis ta VMA réelle : tu cours aux bonnes allures, au bon moment, sans jamais avoir à convertir des pourcentages.',
    toc: [
      'Allures personnalisées en min/km',
      'Semaines 1-2 · Adaptation',
      'Semaines 3-4 · Développement',
      'Semaines 5-6 · Intensification',
      'Semaine 7 · Consolidation',
      'Semaine 8 · Semaine de course',
      'Stratégie de course',
      'Nutrition',
    ],
    for_who: [
      { check: true,  text: 'Tu peux courir 30 minutes sans t\'arrêter' },
      { check: true,  text: 'Tu veux descendre sous les 60 min, 55 min, 50 min, 45 min ou même 40 min' },
      { check: true,  text: 'Tu prépares ta première course de 10km et tu veux un plan progressif et structuré' },
      { check: true,  text: 'Tu cours déjà mais sans méthode, et tu veux enfin progresser avec logique' },
      { check: true,  text: 'Tu as déjà couru un 10km et tu veux battre ton record personnel' },
      { check: true,  text: 'Tu t\'entraînes de 3 à 6 fois par semaine, le plan s\'adapte exactement à ta disponibilité' },
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
        <radialGradient id="il-gl1" cx="22%" cy="52%" r="65%">
          <stop offset="0%" stopColor="#8B2FC9" stopOpacity="0.26" />
          <stop offset="100%" stopColor="#8B2FC9" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Fond */}
      <rect width="640" height="260" fill="url(#il-bg)" />
      <rect width="640" height="260" fill="url(#il-gl1)" />

      {/* Séparateur */}
      <line x1="316" y1="18" x2="316" y2="244" stroke="rgba(255,255,255,.06)" strokeWidth="1" />

      {/* GAUCHE — Titre grand format */}
      <text x="22" y="162" fontFamily="Poppins,sans-serif" fontSize="118" fontWeight="900"
        fill="url(#il-g)" opacity="0.92" letterSpacing="-5">10</text>
      <text x="24" y="207" fontFamily="Poppins,sans-serif" fontSize="44" fontWeight="900"
        fill="url(#il-g)" opacity="0.80" letterSpacing="8">KM</text>
      <text x="24" y="232" fontFamily="Poppins,sans-serif" fontSize="11" fontWeight="700"
        fill="rgba(255,255,255,.35)" letterSpacing="7">8 SEMAINES</text>
      <rect x="24" y="240" width="72" height="1.5" rx="1" fill="url(#il-g)" opacity="0.35" />

      {/* DROITE — Graphique de progression S1→S8 */}
      <line x1="336" y1="218" x2="614" y2="218" stroke="rgba(255,255,255,.1)" strokeWidth="1" />

      <rect x="337" y="190" width="22" height="28" rx="3" fill="url(#il-gv)" opacity="0.36" />
      <text x="348" y="234" fontFamily="Poppins,sans-serif" fontSize="8" fontWeight="600" fill="rgba(255,255,255,.28)" textAnchor="middle">S1</text>

      <rect x="368" y="178" width="22" height="40" rx="3" fill="url(#il-gv)" opacity="0.46" />
      <text x="379" y="234" fontFamily="Poppins,sans-serif" fontSize="8" fontWeight="600" fill="rgba(255,255,255,.28)" textAnchor="middle">S2</text>

      <rect x="399" y="162" width="22" height="56" rx="3" fill="url(#il-gv)" opacity="0.56" />
      <text x="410" y="234" fontFamily="Poppins,sans-serif" fontSize="8" fontWeight="600" fill="rgba(255,255,255,.28)" textAnchor="middle">S3</text>

      <rect x="430" y="150" width="22" height="68" rx="3" fill="url(#il-gv)" opacity="0.65" />
      <text x="441" y="234" fontFamily="Poppins,sans-serif" fontSize="8" fontWeight="600" fill="rgba(255,255,255,.28)" textAnchor="middle">S4</text>

      <rect x="461" y="136" width="22" height="82" rx="3" fill="url(#il-gv)" opacity="0.76" />
      <text x="472" y="234" fontFamily="Poppins,sans-serif" fontSize="8" fontWeight="600" fill="rgba(255,255,255,.28)" textAnchor="middle">S5</text>

      <rect x="492" y="128" width="22" height="90" rx="3" fill="url(#il-gv)" opacity="0.90" />
      <text x="503" y="234" fontFamily="Poppins,sans-serif" fontSize="8" fontWeight="600" fill="rgba(255,255,255,.28)" textAnchor="middle">S6</text>

      <rect x="523" y="166" width="22" height="52" rx="3" fill="url(#il-gv)" opacity="0.58" />
      <text x="534" y="234" fontFamily="Poppins,sans-serif" fontSize="8" fontWeight="600" fill="rgba(255,255,255,.28)" textAnchor="middle">S7</text>

      <rect x="554" y="186" width="22" height="32" rx="3" fill="url(#il-gv)" opacity="0.40" />
      <text x="565" y="234" fontFamily="Poppins,sans-serif" fontSize="8" fontWeight="600" fill="rgba(255,255,255,.28)" textAnchor="middle">S8</text>
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

  // Semaine 6 — plan 6 séances/semaine (Intensification maximale)
  const sessions = [
    { day: 'LUN', type: 'Footing EF', color: '#22C55E', dur: '40 min',
      lines: ['40 min très faciles. Sortie légère avant les deux séances clés de la semaine.', 'RPE 3/10 · Si tu sens la fatigue, raccourcis à 25 min.'] },
    { day: 'MAR', type: '3 × 10 min au seuil', color: '#F97316', dur: '70 min',
      lines: ['Échauffement 25 min EF progressif.', '3 × 10 min à allure seuil, 3 min de récupération entre chaque. La 3e répétition est la plus difficile.', 'RPE 8-9/10 · 30 min totales au seuil, ton record sur ce plan.'] },
    { day: 'MER', type: 'Footing EF', color: '#22C55E', dur: '30 min',
      lines: ['30 min très faciles. 2e sortie de récupération, volontairement courte.', 'RPE 3/10 · Ces footings servent à absorber la charge, rien de plus.'] },
    { day: 'JEU', type: '4 × 2 km à allure objectif', color: '#8B2FC9', dur: '70 min',
      lines: ['Échauffement 25 min EF.', '4 × 2 km à ton allure objectif 10km. Récupération 90 sec au trot.', 'RPE 8/10 · La séance la plus course-spécifique du plan.'] },
    { day: 'SAM', type: 'Footing de récupération', color: '#22C55E', dur: '45 min',
      lines: ['45 min très faciles. Indispensable pour absorber la charge des deux séances clés.', 'RPE 3/10 · Aussi important que les séances intenses.'] },
    { day: 'DIM', type: 'Sortie longue', color: '#06B6D4', dur: '85 min',
      lines: ['85 min à allure EF. Ta dernière vraie sortie longue avant la course.', 'RPE 6/10 · Après cette séance, l\'entraînement dur est terminé.'] },
  ]

  return (
    <div>
      <h3 style={{ margin: '0 0 .75rem', fontSize: '.95rem', fontWeight: 800 }}>
        Aperçu du plan
      </h3>
      <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden',
        border: '1px solid rgba(255,255,255,.1)',
        boxShadow: '0 4px 30px rgba(0,0,0,.5)' }}>

        {/* Contenu flouté — semaine 6, plan 6 séances */}
        <div style={{ filter: 'blur(3px)', userSelect: 'none', background: '#0E0B1E', padding: '1.25rem 1.5rem' }}>

          {/* En-tête */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderBottom: '1px solid rgba(255,255,255,.1)', paddingBottom: '.65rem', marginBottom: '.85rem' }}>
            <div>
              <div style={{ fontSize: '.45rem', color: 'rgba(255,255,255,.3)', letterSpacing: '3px',
                textTransform: 'uppercase', marginBottom: '.1rem' }}>The Ultimate Academy</div>
              <div style={{ fontSize: '.85rem', fontWeight: 900,
                background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                10 KM · 8 SEMAINES
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '.48rem', color: 'rgba(255,255,255,.28)', lineHeight: 1.7 }}>
              <div>VMA : XX,X km/h</div>
              <div>Allure EF : XX:XX min/km</div>
              <div>Allure objectif 10km : XX:XX min/km</div>
            </div>
          </div>

          {/* Semaine */}
          <div style={{ marginBottom: '.75rem' }}>
            <div style={{ fontSize: '.42rem', color: 'rgba(255,255,255,.38)', textTransform: 'uppercase',
              letterSpacing: '2.5px', marginBottom: '.2rem' }}>Semaine 6 / 8 · 6 séances</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 900, marginBottom: '.3rem',
              background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              INTENSIFICATION
            </div>
            <div style={{ fontSize: '.6rem', color: 'rgba(255,255,255,.45)', lineHeight: 1.55 }}>
              Dernière semaine de charge maximale. Tu atteins le pic de ta préparation.
            </div>
          </div>

          {/* Séances */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.45rem' }}>
            {sessions.map((s, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2.8rem 1fr auto',
                gap: '.6rem', alignItems: 'start',
                background: `${s.color}0D`, border: `1px solid ${s.color}22`,
                borderRadius: 8, padding: '.5rem .7rem' }}>
                <div>
                  <div style={{ fontSize: '.62rem', fontWeight: 800, color: 'rgba(255,255,255,.5)' }}>{s.day}</div>
                </div>
                <div>
                  <div style={{ fontSize: '.68rem', fontWeight: 800, color: s.color, marginBottom: '.2rem' }}>{s.type}</div>
                  {s.lines.map((l, j) => (
                    <div key={j} style={{ fontSize: '.55rem', color: 'rgba(255,255,255,.45)', lineHeight: 1.55 }}>{l}</div>
                  ))}
                </div>
                <div style={{ fontSize: '.55rem', color: 'rgba(255,255,255,.3)', whiteSpace: 'nowrap' }}>{s.dur}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(to bottom, transparent 40%, rgba(12,10,24,.65) 65%, rgba(12,10,24,.97) 100%)' }} />

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1rem 1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.42)' }}>
            🔒 Allures personnalisées déverrouillées après achat
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

          </div>

          {/* ── Colonne droite — achat (sticky) ── */}
          <div style={{ position: 'sticky', top: '1.5rem' }}>
            <div id="buy-form" style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)',
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

          </div>

          {/* ── Ligne 2 de la grille : aperçu + box VMA, naturellement alignés ── */}
          <BlurredPreview slug={slug} />
          {isVariant && (
            <div style={{ background: 'rgba(139,47,201,.1)',
              border: '1px solid rgba(139,47,201,.2)', borderRadius: 16, padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.55)', marginBottom: '.5rem', lineHeight: 1.5 }}>
                Tu ne connais pas ta VMA ?<br />Utilise notre calculateur gratuit.
              </div>
              <Link to="/calculateur/vma"
                style={{ color: '#C084FC', fontSize: '.85rem', fontWeight: 700, textDecoration: 'none' }}>
                Calculateur VMA gratuit →
              </Link>
            </div>
          )}
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
