import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Nav from '../../components/Nav'
import SiteFooter from '../../components/SiteFooter'
import PageHero, { gradText } from '../../components/PageHero'
import PricingCTA from '../../components/PricingCTA'
import { TESTIMONIALS_VO2MAX } from '../../lib/toolsContent'
import TestimonialsCarousel from '../../components/TestimonialsCarousel'

const C = { purple: '#8B2FC9', pink: '#E8237A', dark: '#1a1230', light: '#F8F5FF' }

const LEVEL_COLORS = {
  'Excellent':  { color: '#C084FC', bg: 'rgba(192,132,252,.12)' },
  'Au-dessus':  { color: '#34D399', bg: 'rgba(52,211,153,.12)'  },
  'Moyen':      { color: '#FBBF24', bg: 'rgba(251,191,36,.12)'  },
  'En-dessous': { color: '#F97316', bg: 'rgba(249,115,22,.12)'  },
  'Faible':     { color: '#EF4444', bg: 'rgba(239,68,68,.12)'   },
}

const COOPER_NORMS = {
  homme: {
    '20-29': [
      { label: 'Excellent',  min: 2800, max: Infinity },
      { label: 'Au-dessus',  min: 2400, max: 2799 },
      { label: 'Moyen',      min: 2200, max: 2399 },
      { label: 'En-dessous', min: 1600, max: 2199 },
      { label: 'Faible',     min: 0,    max: 1599 },
    ],
    '30-39': [
      { label: 'Excellent',  min: 2700, max: Infinity },
      { label: 'Au-dessus',  min: 2300, max: 2699 },
      { label: 'Moyen',      min: 1900, max: 2299 },
      { label: 'En-dessous', min: 1500, max: 1999 },
      { label: 'Faible',     min: 0,    max: 1499 },
    ],
    '40-49': [
      { label: 'Excellent',  min: 2500, max: Infinity },
      { label: 'Au-dessus',  min: 2100, max: 2499 },
      { label: 'Moyen',      min: 1700, max: 2099 },
      { label: 'En-dessous', min: 1400, max: 1699 },
      { label: 'Faible',     min: 0,    max: 1399 },
    ],
    '50+': [
      { label: 'Excellent',  min: 2400, max: Infinity },
      { label: 'Au-dessus',  min: 2000, max: 2399 },
      { label: 'Moyen',      min: 1600, max: 1999 },
      { label: 'En-dessous', min: 1300, max: 1599 },
      { label: 'Faible',     min: 0,    max: 1299 },
    ],
  },
  femme: {
    '20-29': [
      { label: 'Excellent',  min: 2700, max: Infinity },
      { label: 'Au-dessus',  min: 2200, max: 2699 },
      { label: 'Moyen',      min: 1800, max: 2199 },
      { label: 'En-dessous', min: 1500, max: 1799 },
      { label: 'Faible',     min: 0,    max: 1499 },
    ],
    '30-39': [
      { label: 'Excellent',  min: 2500, max: Infinity },
      { label: 'Au-dessus',  min: 2000, max: 2499 },
      { label: 'Moyen',      min: 1700, max: 1999 },
      { label: 'En-dessous', min: 1400, max: 1699 },
      { label: 'Faible',     min: 0,    max: 1399 },
    ],
    '40-49': [
      { label: 'Excellent',  min: 2300, max: Infinity },
      { label: 'Au-dessus',  min: 1900, max: 2299 },
      { label: 'Moyen',      min: 1500, max: 1899 },
      { label: 'En-dessous', min: 1200, max: 1499 },
      { label: 'Faible',     min: 0,    max: 1199 },
    ],
    '50+': [
      { label: 'Excellent',  min: 2200, max: Infinity },
      { label: 'Au-dessus',  min: 1700, max: 2199 },
      { label: 'Moyen',      min: 1400, max: 1699 },
      { label: 'En-dessous', min: 1100, max: 1399 },
      { label: 'Faible',     min: 0,    max: 1099 },
    ],
  },
}

const AGE_GROUPS = ['20-29', '30-39', '40-49', '50+']

const VO2MAX_REF = {
  homme: [
    { label: 'Élite',     range: '> 70',  color: '#C084FC', bg: 'rgba(192,132,252,.1)' },
    { label: 'Excellent', range: '60–70', color: '#34D399', bg: 'rgba(52,211,153,.1)'  },
    { label: 'Bon',       range: '50–60', color: '#A3E635', bg: 'rgba(163,230,53,.1)'  },
    { label: 'Moyen',     range: '40–50', color: '#FBBF24', bg: 'rgba(251,191,36,.1)'  },
    { label: 'Faible',    range: '< 40',  color: '#EF4444', bg: 'rgba(239,68,68,.1)'   },
  ],
  femme: [
    { label: 'Élite',     range: '> 60',  color: '#C084FC', bg: 'rgba(192,132,252,.1)' },
    { label: 'Excellent', range: '55–60', color: '#34D399', bg: 'rgba(52,211,153,.1)'  },
    { label: 'Bon',       range: '45–55', color: '#A3E635', bg: 'rgba(163,230,53,.1)'  },
    { label: 'Moyen',     range: '35–45', color: '#FBBF24', bg: 'rgba(251,191,36,.1)'  },
    { label: 'Faible',    range: '< 35',  color: '#EF4444', bg: 'rgba(239,68,68,.1)'   },
  ],
}

const FAQ = [
  { q: "C'est quoi la VO2max exactement ?",
    a: "La VO2max (Volume maximal d'oxygène) est la quantité maximale d'oxygène que ton corps peut consommer pendant un effort intense, exprimée en mL/kg/min. C'est l'indicateur de référence de la capacité aérobie : plus ta VO2max est élevée, plus ton moteur cardio-respiratoire est puissant et ton potentiel de performance sur longues distances est important." },
  { q: "Quelle est la différence entre VO2max et VMA ?",
    a: "La VO2max est une mesure physiologique (mL/kg/min), tandis que la VMA (Vitesse Maximale Aérobie) est la vitesse de course à laquelle tu atteins cette VO2max. La VMA se mesure en km/h et s'utilise directement pour programmer les allures d'entraînement. La relation approximative : VO2max ÷ 3,5 ≈ VMA en km/h." },
  { q: "Comment améliorer sa VO2max rapidement ?",
    a: "Les méthodes les plus efficaces : 1) Fractionné court 30/30 (30s à 100-105% VMA / 30s récup active), 15 à 20 répétitions, 2x/semaine. 2) Répétitions de 400m à 95% VMA avec 1 min de récup. 3) Côtes : 10-15 montées de 200m à RPE 8/10. Des progrès significatifs (+1 à 2 km/h de VMA) sont mesurables en 6 à 8 semaines de travail régulier." },
  { q: "À quelle fréquence faire le Test de Cooper ?",
    a: "Un test Cooper tous les 6 à 8 semaines est idéal en phase d'entraînement intensif. En dehors des phases de développement VMA, tous les 3 mois suffit. Ne fais pas le test en période de fatigue, le résultat ne serait pas représentatif. L'idéal : en fin de cycle de base, 3 à 5 jours après une sortie longue." },
  { q: "Est-ce que la VO2max baisse avec l'âge ?",
    a: "Oui, d'environ 1% par an après 25 ans chez les sédentaires. Chez les coureurs réguliers, cette baisse est réduite à 0,5% par an. Des études montrent que les athlètes masters bien entraînés maintiennent une VO2max proche de celle de coureurs récréatifs plus jeunes. L'entraînement spécifique, notamment le fractionné, compense largement les effets du vieillissement." },
  { q: "Quelle VO2max pour courir un marathon en 4h ?",
    a: "Un marathon en 4h (allure 5'41\"/km, ~10,5 km/h) nécessite une VMA d'environ 13 à 14 km/h, soit une VO2max d'environ 45 à 50 mL/kg/min. Les marathoniens courent typiquement à 80% de leur VMA. La préparation spécifique (sorties longues, séances au seuil) est tout aussi importante que la VO2max brute." },
  { q: "Mon résultat Garmin/Apple Watch est-il fiable ?",
    a: "Les estimations de VO2max des montres GPS sont basées sur des algorithmes utilisant FC et vitesse. Elles ont une précision acceptable (±10-15%) en conditions normales, mais peuvent être faussées par la fatigue, la chaleur ou une FC anormale. Le Test de Cooper sur terrain plat reste plus fiable qu'un algorithme indirect." },
]

function getCooperLevel(distM, gender, ageGroup) {
  const norms = COOPER_NORMS[gender][ageGroup]
  return norms.find(n => distM >= n.min && (n.max === Infinity || distM <= n.max)) || norms[norms.length - 1]
}

function getVO2maxLevel(vo2max, gender) {
  if (gender === 'homme') {
    if (vo2max > 70) return { label: 'Élite',     color: '#C084FC', bg: 'rgba(192,132,252,.12)' }
    if (vo2max > 60) return { label: 'Excellent',  color: '#34D399', bg: 'rgba(52,211,153,.12)'  }
    if (vo2max > 50) return { label: 'Bon',        color: '#A3E635', bg: 'rgba(163,230,53,.12)'  }
    if (vo2max > 40) return { label: 'Moyen',      color: '#FBBF24', bg: 'rgba(251,191,36,.12)'  }
    return                   { label: 'Faible',     color: '#EF4444', bg: 'rgba(239,68,68,.12)'   }
  } else {
    if (vo2max > 60) return { label: 'Élite',     color: '#C084FC', bg: 'rgba(192,132,252,.12)' }
    if (vo2max > 55) return { label: 'Excellent',  color: '#34D399', bg: 'rgba(52,211,153,.12)'  }
    if (vo2max > 45) return { label: 'Bon',        color: '#A3E635', bg: 'rgba(163,230,53,.12)'  }
    if (vo2max > 35) return { label: 'Moyen',      color: '#FBBF24', bg: 'rgba(251,191,36,.12)'  }
    return                   { label: 'Faible',     color: '#EF4444', bg: 'rgba(239,68,68,.12)'   }
  }
}

function Chip({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: '.42rem .95rem', borderRadius: 50, cursor: 'pointer', fontSize: '.84rem',
      border: `1px solid ${active ? 'transparent' : 'rgba(139,47,201,.25)'}`,
      background: active ? `linear-gradient(135deg,${C.purple},${C.pink})` : '#fff',
      color: active ? '#fff' : C.purple, fontWeight: active ? 600 : 400, transition: 'all .15s',
    }}>{children}</button>
  )
}
function Inner({ max = 1000, children, style }) {
  return <div style={{ maxWidth: max, margin: '0 auto', ...style }}>{children}</div>
}
function SectionTag({ children, dark }) {
  return <p style={{ fontSize: '.75rem', letterSpacing: '.18em', textTransform: 'uppercase', color: dark ? 'rgba(255,255,255,.6)' : C.purple, marginBottom: '.75rem', fontWeight: 600 }}>{children}</p>
}
function H2L({ children }) {
  return <h2 style={{ fontSize: 'clamp(1.6rem,3.5vw,2.4rem)', fontWeight: 900, color: C.dark, lineHeight: 1.15, marginBottom: '1.25rem' }}>{children}</h2>
}
function H2D({ children }) {
  return <h2 style={{ fontSize: 'clamp(1.6rem,3.5vw,2.4rem)', fontWeight: 900, color: '#fff', lineHeight: 1.15, marginBottom: '1.25rem' }}>{children}</h2>
}

export default function VO2maxCalculator() {
  const navigate  = useNavigate()
  const calcRef   = useRef()

  const [distUnit,     setDistUnit]     = useState('m')
  const [distance,     setDistance]     = useState('')
  const [gender,       setGender]       = useState('homme')
  const [ageGroup,     setAgeGroup]     = useState('20-29')
  const [normsGender,  setNormsGender]  = useState('homme')
  const [normsAge,     setNormsAge]     = useState('20-29')
  const [openFaq,      setOpenFaq]      = useState(null)

  useEffect(() => {
    const prev = document.title
    document.title = 'Test de Cooper & Calculateur VO2max | The Ultimate Academy'
    const meta  = document.querySelector('meta[name="description"]')
    const prevM = meta?.content
    if (meta) meta.content = "Calcule ta VO2max avec le Test de Cooper en 12 minutes. Découvre ton niveau aérobie, ta VMA estimée et comment progresser. Outil gratuit par Alexis, coach running certifié."
    return () => { document.title = prev; if (meta && prevM != null) meta.content = prevM }
  }, [])

  const distanceM   = distUnit === 'm' ? (parseFloat(distance) || 0) : (parseFloat(distance) || 0) * 1000
  const rawVO2max   = distanceM > 0 ? (22.351 * distanceM / 1000) - 11.288 : 0
  const vo2max      = rawVO2max > 0 ? rawVO2max : 0
  const vma         = vo2max > 0 ? vo2max / 3.5 : 0
  const cooperLevel = vo2max > 0 ? getCooperLevel(distanceM, gender, ageGroup) : null
  const vo2Level    = vo2max > 0 ? getVO2maxLevel(vo2max, gender) : null
  const vo2Pct      = vo2max > 0 ? Math.min(100, Math.max(0, ((vo2max - 20) / 60) * 100)) : 0
  const tracksEquiv = distanceM > 0 ? (distanceM / 400).toFixed(1) : null

  return (
    <div style={{ background: '#000', color: '#fff', overflowX: 'hidden' }}>
      <Nav />

      <PageHero
        badge="Test de Cooper"
        title={<>Calcule ta <span style={gradText}>VO2max</span></>}
        subtitle="Calcule ta VO2max avec le test de Cooper en 12 minutes. Découvre ton niveau aérobie et ta VMA estimée."
        backTo="/calculateur" backLabel="Calculateurs"
      >
        <button onClick={() => calcRef.current?.scrollIntoView({ behavior: 'smooth' })}
          style={{ padding:'1rem 2.5rem', borderRadius:50, border:'none', background:`linear-gradient(135deg,${C.purple},${C.pink})`, color:'#fff', fontSize:'1.05rem', fontWeight:700, cursor:'pointer', boxShadow:'0 8px 32px rgba(232,35,122,.5)' }}>
          Faire le test →
        </button>
      </PageHero>

      {/* ── CALCULATEUR ────────────────────────────────────── */}
      <section ref={calcRef} id="outil" style={{ background: C.light, padding: '5rem 1.5rem' }}>
        <Inner max={780}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <SectionTag>Calculateur interactif</SectionTag>
            <h2 style={{ fontSize: 'clamp(1.5rem,3vw,2rem)', fontWeight: 900, color: C.dark, marginBottom: '.5rem' }}><span style={gradText}>Calcule</span> ta VO2max</h2>
            <p style={{ color: 'rgba(26,18,48,.55)', fontSize: '.95rem' }}>Résultats instantanés, aucune inscription requise</p>
          </div>
          <div style={{ background: '#fff', borderRadius: 20, padding: '2rem', boxShadow: '0 8px 40px rgba(139,47,201,.1)', border: '1px solid rgba(139,47,201,.12)' }}>

            {/* Step 1 — Distance */}
            <div style={{ marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.85rem' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', background: `linear-gradient(135deg,${C.purple},${C.pink})`, fontSize: '.72rem', fontWeight: 800, color: '#fff' }}>1</span>
                <span style={{ fontWeight: 700, color: C.dark, fontSize: '.95rem' }}>Distance parcourue en 12 minutes</span>
              </div>
              <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '.4rem' }}>
                  {[['m', 'Mètres'], ['km', 'Kilomètres']].map(([v, l]) => (
                    <Chip key={v} active={distUnit === v} onClick={() => setDistUnit(v)}>{l}</Chip>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                  <input type="number" min="0" step={distUnit === 'm' ? '50' : '0.1'}
                    placeholder={distUnit === 'm' ? 'Ex : 2800' : 'Ex : 2.8'}
                    value={distance} onChange={e => setDistance(e.target.value)}
                    style={{ background: '#fff', border: '1px solid rgba(139,47,201,.25)', borderRadius: 10, padding: '.55rem .75rem', color: C.dark, fontSize: '.9rem', outline: 'none', width: 140 }} />
                  <span style={{ color: 'rgba(26,18,48,.45)', fontSize: '.85rem' }}>{distUnit}</span>
                </div>
              </div>
              <p style={{ color: 'rgba(26,18,48,.32)', fontSize: '.78rem', marginTop: '.5rem' }}>
                Exemple : 2800m = 7 tours d'une piste de 400m
              </p>
            </div>

            {/* Step 2 — Genre */}
            <div style={{ marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.85rem' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', background: `linear-gradient(135deg,${C.purple},${C.pink})`, fontSize: '.72rem', fontWeight: 800, color: '#fff' }}>2</span>
                <span style={{ fontWeight: 700, color: C.dark, fontSize: '.95rem' }}>Genre</span>
              </div>
              <div style={{ display: 'flex', gap: '.5rem' }}>
                {[['homme', '👨 Homme'], ['femme', '👩 Femme']].map(([v, l]) => (
                  <Chip key={v} active={gender === v} onClick={() => setGender(v)}>{l}</Chip>
                ))}
              </div>
            </div>

            {/* Step 3 — Âge */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.85rem' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', background: `linear-gradient(135deg,${C.purple},${C.pink})`, fontSize: '.72rem', fontWeight: 800, color: '#fff' }}>3</span>
                <span style={{ fontWeight: 700, color: C.dark, fontSize: '.95rem' }}>Tranche d'âge</span>
              </div>
              <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                {AGE_GROUPS.map(ag => (
                  <Chip key={ag} active={ageGroup === ag} onClick={() => setAgeGroup(ag)}>{ag} ans</Chip>
                ))}
              </div>
            </div>

            {/* Results */}
            {vo2max > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: '1rem' }}>

                {/* Card VO2max */}
                <div style={{ background: C.light, borderRadius: 16, padding: '1.5rem', border: `2px solid ${vo2Level?.color || C.purple}40`, boxShadow: `0 4px 20px ${vo2Level?.color || C.purple}18` }}>
                  <p style={{ margin: '0 0 .35rem', fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '.1em', color: 'rgba(26,18,48,.4)', fontWeight: 600 }}>VO2max estimée</p>
                  <p style={{ margin: '0 0 .4rem', fontSize: '2.4rem', fontWeight: 900, lineHeight: 1, background: `linear-gradient(135deg,${C.purple},${C.pink})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {vo2max.toFixed(1)}
                  </p>
                  <p style={{ margin: '0 0 .75rem', fontSize: '.78rem', color: 'rgba(26,18,48,.4)' }}>mL/kg/min</p>
                  {vo2Level && (
                    <div style={{ display: 'inline-block', padding: '.22rem .75rem', borderRadius: 99, background: vo2Level.bg, border: `1px solid ${vo2Level.color}40`, marginBottom: '.85rem' }}>
                      <span style={{ fontSize: '.78rem', fontWeight: 700, color: vo2Level.color }}>{vo2Level.label}</span>
                    </div>
                  )}
                  <div style={{ height: 7, borderRadius: 4, background: 'rgba(139,47,201,.1)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${vo2Pct}%`, borderRadius: 4, background: 'linear-gradient(90deg,#EF4444,#FBBF24,#34D399,#C084FC)', transition: 'width .4s ease' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.3rem', fontSize: '.62rem', color: 'rgba(26,18,48,.28)' }}>
                    <span>20</span><span>40</span><span>60</span><span>80+</span>
                  </div>
                </div>

                {/* Card VMA */}
                <div style={{ background: C.light, borderRadius: 16, padding: '1.5rem', border: '2px solid rgba(139,47,201,.2)', boxShadow: '0 4px 20px rgba(139,47,201,.1)' }}>
                  <p style={{ margin: '0 0 .35rem', fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '.1em', color: 'rgba(26,18,48,.4)', fontWeight: 600 }}>VMA estimée</p>
                  <p style={{ margin: '0 0 .1rem', fontSize: '2.4rem', fontWeight: 900, lineHeight: 1, background: `linear-gradient(135deg,${C.purple},${C.pink})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {vma.toFixed(2)}
                  </p>
                  <p style={{ margin: '0 0 .75rem', fontSize: '.78rem', color: 'rgba(26,18,48,.4)' }}>km/h</p>
                  <p style={{ margin: '0 0 .85rem', fontSize: '.78rem', color: 'rgba(26,18,48,.5)', lineHeight: 1.5 }}>Vitesse Maximale Aérobie estimée</p>
                  <Link to="/calculateur/allures" state={{ vma }} style={{ display: 'inline-flex', alignItems: 'center', gap: '.35rem', color: C.purple, fontSize: '.82rem', fontWeight: 600, textDecoration: 'none' }}>
                    → Calculer mes allures avec cette VMA
                  </Link>
                </div>

                {/* Card Distance */}
                <div style={{ background: C.light, borderRadius: 16, padding: '1.5rem', border: '1px solid rgba(139,47,201,.12)' }}>
                  <p style={{ margin: '0 0 .35rem', fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '.1em', color: 'rgba(26,18,48,.4)', fontWeight: 600 }}>Distance parcourue</p>
                  <p style={{ margin: '0 0 .1rem', fontSize: '2.4rem', fontWeight: 900, lineHeight: 1, color: C.dark }}>
                    {distanceM >= 1000 ? (distanceM / 1000).toFixed(2).replace('.', ',') : Math.round(distanceM)}
                  </p>
                  <p style={{ margin: '0 0 .75rem', fontSize: '.78rem', color: 'rgba(26,18,48,.4)' }}>{distanceM >= 1000 ? 'km' : 'm'}</p>
                  {tracksEquiv && <p style={{ margin: '0 0 .85rem', fontSize: '.82rem', color: 'rgba(26,18,48,.5)' }}>{tracksEquiv} tours de piste (400m)</p>}
                  {cooperLevel && (
                    <div style={{ display: 'inline-block', padding: '.22rem .75rem', borderRadius: 99, background: LEVEL_COLORS[cooperLevel.label]?.bg, border: `1px solid ${LEVEL_COLORS[cooperLevel.label]?.color}40` }}>
                      <span style={{ fontSize: '.75rem', fontWeight: 700, color: LEVEL_COLORS[cooperLevel.label]?.color }}>{cooperLevel.label} · {gender} {ageGroup}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ padding: '2.5rem', textAlign: 'center', borderRadius: 12, background: 'rgba(139,47,201,.04)', border: '1px dashed rgba(139,47,201,.15)' }}>
                <p style={{ color: 'rgba(26,18,48,.35)', margin: 0, fontSize: '.9rem' }}>Entre ta distance parcourue pour voir tes résultats</p>
              </div>
            )}
          </div>
        </Inner>
      </section>

      {/* ── C'EST QUOI LA VO2MAX ───────────────────────────── */}
      <section style={{ background: '#fff', padding: '5rem 1.5rem' }}>
        <Inner>
          <div style={{ display: 'flex', gap: '3rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 300px' }}>
              <SectionTag>Comprendre les bases</SectionTag>
              <H2L>C'est quoi la <span style={gradText}>VO2max</span> ?</H2L>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: 'rgba(26,18,48,.7)', fontSize: '.9rem', lineHeight: 1.8 }}>
                <p style={{ margin: 0, textAlign: 'justify' }}>La <strong style={{ color: C.dark }}>VO2max</strong>, ou consommation maximale d'oxygène, représente la quantité maximale d'oxygène que ton corps peut utiliser par minute et par kilogramme de poids corporel lors d'un effort intense.</p>
                <p style={{ margin: 0, textAlign: 'justify' }}>En termes simples : c'est la <strong style={{ color: C.dark }}>cylindrée de ton moteur aérobie</strong>. Plus elle est élevée, plus ton corps est efficace pour produire de l'énergie à haute intensité.</p>
                <p style={{ margin: 0, textAlign: 'justify' }}>C'est l'indicateur de performance aérobie le plus utilisé par les coachs professionnels. Un coureur avec une VO2max élevée a un potentiel de performance plus important, mais l'entraînement peut significativement améliorer cette valeur chez n'importe quel athlète.</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.55rem', margin: '1.25rem 0' }}>
                {[
                  ["🫁", "Absorber l'oxygène via les poumons"],
                  ["❤️", "Le transporter via le cœur et le sang"],
                  ["💪", "Le livrer aux muscles qui travaillent"],
                  ["⚡", "L'utiliser pour produire de l'énergie"],
                ].map(([icon, txt]) => (
                  <div key={txt} style={{ display: 'flex', alignItems: 'center', gap: '.75rem', fontSize: '.875rem', color: C.dark }}>
                    <span style={{ flexShrink: 0 }}>{icon}</span><span>{txt}</span>
                  </div>
                ))}
              </div>
              <div style={{ padding: '1.1rem 1.25rem', borderRadius: 12, background: `linear-gradient(135deg,rgba(139,47,201,.07),rgba(232,35,122,.05))`, border: '1px solid rgba(139,47,201,.15)' }}>
                <p style={{ margin: 0, fontSize: '.875rem', color: C.dark, lineHeight: 1.7 }}>
                  <strong style={{ color: C.purple }}>Lien entre VO2max et VMA :</strong> La VO2max se mesure en mL/kg/min, la VMA en km/h. Formule approximative : <strong>VO2max ÷ 3,5 ≈ VMA</strong>
                </p>
              </div>
            </div>
            <div style={{ flex: '1 1 380px', borderRadius: 20, overflow: 'hidden', maxHeight: 480 }}>
              <svg viewBox="0 0 440 320" style={{width:'100%',height:'100%',display:'block',minHeight:300}}>
                <defs>
                  <linearGradient id="vog1" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#8B2FC9"/>
                    <stop offset="100%" stopColor="#E8237A"/>
                  </linearGradient>
                  <marker id="vo2-arr1" markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto">
                    <path d="M0,1 L6,3.5 L0,6 Z" fill="#8B2FC9"/>
                  </marker>
                  <marker id="vo2-arr2" markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto">
                    <path d="M0,1 L6,3.5 L0,6 Z" fill="#E8237A"/>
                  </marker>
                </defs>
                <rect width="440" height="320" fill="#EDE8F7"/>
                <text x="220" y="28" textAnchor="middle" fontSize="12" fill="#1a1230" fontWeight="700" fontFamily="system-ui,sans-serif">Comment fonctionne la VO2max ?</text>
                <circle cx="100" cy="125" r="42" fill="rgba(139,47,201,.1)" stroke="#8B2FC9" strokeWidth="1.5"/>
                <text x="100" y="115" textAnchor="middle" fontSize="20" fontFamily="system-ui,sans-serif">🫁</text>
                <text x="100" y="138" textAnchor="middle" fontSize="10" fill="#8B2FC9" fontWeight="700" fontFamily="system-ui,sans-serif">Poumons</text>
                <text x="100" y="152" textAnchor="middle" fontSize="8.5" fill="rgba(26,18,48,.55)" fontFamily="system-ui,sans-serif">Absorber O₂</text>
                <path d="M 147 125 L 173 125" stroke="#8B2FC9" strokeWidth="2" markerEnd="url(#vo2-arr1)"/>
                <circle cx="220" cy="125" r="42" fill="rgba(232,35,122,.1)" stroke="#E8237A" strokeWidth="1.5"/>
                <text x="220" y="115" textAnchor="middle" fontSize="20" fontFamily="system-ui,sans-serif">❤️</text>
                <text x="220" y="138" textAnchor="middle" fontSize="10" fill="#E8237A" fontWeight="700" fontFamily="system-ui,sans-serif">Cœur</text>
                <text x="220" y="152" textAnchor="middle" fontSize="8.5" fill="rgba(26,18,48,.55)" fontFamily="system-ui,sans-serif">Transporter O₂</text>
                <path d="M 267 125 L 293 125" stroke="#E8237A" strokeWidth="2" markerEnd="url(#vo2-arr2)"/>
                <circle cx="340" cy="125" r="42" fill="rgba(163,230,53,.1)" stroke="#A3E635" strokeWidth="1.5"/>
                <text x="340" y="115" textAnchor="middle" fontSize="20" fontFamily="system-ui,sans-serif">💪</text>
                <text x="340" y="138" textAnchor="middle" fontSize="10" fill="#A3E635" fontWeight="700" fontFamily="system-ui,sans-serif">Muscles</text>
                <text x="340" y="152" textAnchor="middle" fontSize="8.5" fill="rgba(26,18,48,.55)" fontFamily="system-ui,sans-serif">Utiliser O₂</text>
                <line x1="40" y1="185" x2="400" y2="185" stroke="rgba(139,47,201,.1)" strokeWidth="1"/>
                <rect x="115" y="200" width="210" height="72" rx="12" fill="white" style={{filter:'drop-shadow(0 4px 12px rgba(139,47,201,.15))'}}/>
                <text x="220" y="222" textAnchor="middle" fontSize="10" fill="rgba(26,18,48,.55)" fontFamily="system-ui,sans-serif" fontWeight="600">VO2MAX ESTIMÉE</text>
                <text x="220" y="248" textAnchor="middle" fontSize="24" fill="url(#vog1)" fontWeight="900" fontFamily="system-ui,sans-serif">52,3</text>
                <text x="220" y="263" textAnchor="middle" fontSize="10" fill="rgba(26,18,48,.5)" fontFamily="system-ui,sans-serif">mL/kg/min · VMA ≈ 14,9 km/h</text>
                <text x="220" y="300" textAnchor="middle" fontSize="9.5" fill="rgba(26,18,48,.4)" fontFamily="system-ui,sans-serif">Formule : VO2max ÷ 3,5 ≈ VMA</text>
              </svg>
            </div>
          </div>
        </Inner>
      </section>

      {/* ── TEST DE COOPER ─────────────────────────────────── */}
      <section style={{ background: C.light, padding: '5rem 1.5rem' }}>
        <Inner max={860}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <SectionTag>Protocole officiel</SectionTag>
            <H2L>Comment réaliser le Test de <span style={gradText}>Cooper</span> ?</H2L>
            <p style={{ color: 'rgba(26,18,48,.55)', maxWidth: 520, margin: '0 auto' }}>4 étapes simples pour un résultat fiable en 12 minutes</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(260px,100%),1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
            {[
              { n: '1', icon: '🏟️', title: 'Trouve un terrain plat', desc: "L'idéal est une piste d'athlétisme de 400m. Sinon, un terrain plat mesuré où tu peux courir sans t'arrêter : pas de feux ni d'obstacles." },
              { n: '2', icon: '🔥', title: 'Échauffe-toi bien', desc: "15 à 20 min de footing progressif à 63-65% de ta VMA estimée. Ne néglige pas l'échauffement, il influence directement ton résultat." },
              { n: '3', icon: '⏱️', title: 'Cours 12 minutes à fond', desc: "Lance ton chrono et cours aussi loin que possible pendant exactement 12 minutes. Gère ton effort dès le départ : partir trop vite est l'erreur classique. Note la distance GPS ou le nombre de tours." },
            ].map(step => (
              <div key={step.n} style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', boxShadow: '0 4px 20px rgba(139,47,201,.07)', border: '1px solid rgba(139,47,201,.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem', marginBottom: '.85rem' }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: `linear-gradient(135deg,${C.purple},${C.pink})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '.78rem', fontWeight: 800, flexShrink: 0 }}>{step.n}</div>
                  <span style={{ fontSize: '1.4rem' }}>{step.icon}</span>
                </div>
                <p style={{ fontWeight: 700, color: C.dark, marginBottom: '.45rem', fontSize: '.95rem' }}>{step.title}</p>
                <p style={{ color: 'rgba(26,18,48,.6)', fontSize: '.875rem', lineHeight: 1.65, margin: 0, textAlign: 'justify' }}>{step.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', boxShadow: '0 4px 20px rgba(139,47,201,.07)', border: '1px solid rgba(139,47,201,.1)', marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem', marginBottom: '.85rem' }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: `linear-gradient(135deg,${C.purple},${C.pink})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '.78rem', fontWeight: 800, flexShrink: 0 }}>4</div>
              <span style={{ fontSize: '1.4rem' }}>📏</span>
            </div>
            <p style={{ fontWeight: 700, color: C.dark, marginBottom: '.45rem', fontSize: '.95rem' }}>Mesure la distance</p>
            <p style={{ color: 'rgba(26,18,48,.6)', fontSize: '.875rem', lineHeight: 1.65, margin: 0, textAlign: 'justify' }}>Relève la distance totale parcourue en mètres ou kilomètres. C'est cette valeur qui permet de calculer ta VO2max et ta VMA estimée.</p>
          </div>
          <div style={{ background: `linear-gradient(135deg,rgba(139,47,201,.08),rgba(232,35,122,.05))`, borderRadius: 16, padding: '1.5rem 2rem', border: '1px solid rgba(139,47,201,.18)', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>💬</span>
            <div>
              <p style={{ fontWeight: 700, color: C.dark, marginBottom: '.35rem', fontSize: '.95rem' }}>Mon conseil</p>
              <p style={{ color: 'rgba(26,18,48,.65)', fontSize: '.9rem', lineHeight: 1.7, margin: 0, fontStyle: 'italic', textAlign: 'justify' }}>
                "Le Test de Cooper est un excellent outil de progression. Je conseille à mes athlètes de le répéter tous les 2 à 3 mois pour mesurer leur évolution. L'amélioration de ta VO2max est l'un des meilleurs signes que ton entraînement fonctionne."
              </p>
            </div>
          </div>
        </Inner>
      </section>

      {/* ── TABLEAU DE NORMES ──────────────────────────────── */}
      <section style={{ background: '#fff', padding: '5rem 1.5rem' }}>
        <Inner max={860}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <SectionTag>Normes officielles</SectionTag>
            <H2L>Comment tu te <span style={gradText}>situes</span> ?</H2L>
            <p style={{ color: 'rgba(26,18,48,.55)', maxWidth: 500, margin: '0 auto' }}>Basé sur les normes Cooper Institute. Ta ligne est mise en surbrillance automatiquement.</p>
          </div>

          <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {[['homme', '👨 Hommes'], ['femme', '👩 Femmes']].map(([v, l]) => (
              <Chip key={v} active={normsGender === v} onClick={() => setNormsGender(v)}>{l}</Chip>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
            {AGE_GROUPS.map(ag => (
              <button key={ag} onClick={() => setNormsAge(ag)} style={{
                padding: '.3rem .8rem', borderRadius: 50, cursor: 'pointer', fontSize: '.8rem',
                border: `1px solid ${normsAge === ag ? 'transparent' : 'rgba(139,47,201,.25)'}`,
                background: normsAge === ag ? 'rgba(139,47,201,.15)' : 'transparent',
                color: normsAge === ag ? C.purple : 'rgba(26,18,48,.5)', fontWeight: normsAge === ag ? 700 : 400,
              }}>{ag} ans</button>
            ))}
          </div>

          <div className="tbl-scroll" style={{ background: '#fff', borderRadius: 20, boxShadow: '0 8px 40px rgba(139,47,201,.1)', border: '1px solid rgba(139,47,201,.12)', overflow: 'hidden', overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: 480, borderCollapse: 'collapse', fontSize: '.875rem' }}>
              <thead>
                <tr style={{ background: '#1a1230' }}>
                  {['Niveau', 'Distance', 'VO2max estimée'].map(h => (
                    <th key={h} style={{ padding: '.7rem 1rem', textAlign: 'left', color: 'rgba(255,255,255,.85)', fontWeight: 600, fontSize: '.72rem', textTransform: 'uppercase', letterSpacing: '.07em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COOPER_NORMS[normsGender][normsAge].map((row, i) => {
                  const lc = LEVEL_COLORS[row.label]
                  const isUser = vo2max > 0 && gender === normsGender && ageGroup === normsAge &&
                    distanceM >= row.min && (row.max === Infinity || distanceM <= row.max)
                  const loVO2 = (22.351 * row.min / 1000) - 11.288
                  const hiVO2 = row.max === Infinity ? null : (22.351 * row.max / 1000) - 11.288
                  return (
                    <tr key={i} style={{ borderTop: '1px solid rgba(139,47,201,.07)', background: isUser ? lc?.bg : 'transparent', transition: 'background .2s' }}>
                      <td style={{ padding: '.7rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                          <div style={{ width: 9, height: 9, borderRadius: '50%', background: lc?.color, flexShrink: 0 }} />
                          <span style={{ fontWeight: isUser ? 700 : 500, color: isUser ? lc?.color : C.dark }}>{row.label}</span>
                          {isUser && <span style={{ fontSize: '.68rem', background: lc?.color, color: '#fff', padding: '.1rem .45rem', borderRadius: 99, fontWeight: 700 }}>Ton niveau</span>}
                        </div>
                      </td>
                      <td style={{ padding: '.7rem 1rem', color: C.dark, fontVariantNumeric: 'tabular-nums', fontWeight: isUser ? 700 : 400 }}>
                        {row.max === Infinity ? `> ${row.min.toLocaleString('fr')} m` : `${row.min.toLocaleString('fr')} – ${row.max.toLocaleString('fr')} m`}
                      </td>
                      <td style={{ padding: '.7rem 1rem', color: 'rgba(26,18,48,.5)', fontSize: '.82rem' }}>
                        {hiVO2 !== null ? `${loVO2.toFixed(0)} – ${hiVO2.toFixed(0)}` : `> ${loVO2.toFixed(0)}`} mL/kg/min
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '2.5rem' }}>
            <p style={{ textAlign: 'center', fontWeight: 700, color: C.dark, marginBottom: '1.25rem', fontSize: '.92rem' }}>
              Valeurs de référence VO2max · {normsGender === 'homme' ? 'Hommes' : 'Femmes'}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '.65rem' }}>
              {VO2MAX_REF[normsGender].map(item => (
                <div key={item.label} style={{ background: item.bg, borderRadius: 12, padding: '.85rem', textAlign: 'center', border: `1px solid ${item.color}30` }}>
                  <div style={{ fontSize: '.68rem', color: item.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.2rem' }}>{item.label}</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: item.color }}>{item.range}</div>
                  <div style={{ fontSize: '.65rem', color: 'rgba(26,18,48,.35)', marginTop: '.15rem' }}>mL/kg/min</div>
                </div>
              ))}
            </div>
          </div>
        </Inner>
      </section>

      {/* ── COMMENT AMÉLIORER SA VO2MAX ────────────────────── */}
      <section style={{ background: C.light, padding: '5rem 1.5rem' }}>
        <Inner>
          <div style={{ display: 'flex', gap: '3rem', alignItems: 'center', flexWrap: 'wrap', flexDirection: 'row-reverse' }}>
            <div style={{ flex: '1 1 380px', borderRadius: 20, overflow: 'hidden', maxHeight: 480 }}>
              <svg viewBox="0 0 440 300" style={{width:'100%',height:'100%',display:'block',minHeight:280}}>
                <defs>
                  <linearGradient id="vog2" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#8B2FC9"/>
                    <stop offset="100%" stopColor="#E8237A"/>
                  </linearGradient>
                </defs>
                <rect width="440" height="300" fill="#EDE8F7"/>
                <text x="220" y="26" textAnchor="middle" fontSize="12" fill="#1a1230" fontWeight="700" fontFamily="system-ui,sans-serif">Progression VO2max sur 8 semaines</text>
                <line x1="50" y1="50" x2="50" y2="220" stroke="rgba(139,47,201,.12)" strokeWidth="1"/>
                <line x1="50" y1="220" x2="415" y2="220" stroke="rgba(139,47,201,.12)" strokeWidth="1"/>
                <text x="35" y="225" textAnchor="end" fontSize="9" fill="rgba(26,18,48,.4)" fontFamily="system-ui,sans-serif">S0</text>
                <text x="130" y="225" textAnchor="middle" fontSize="9" fill="rgba(26,18,48,.4)" fontFamily="system-ui,sans-serif">S2</text>
                <text x="210" y="225" textAnchor="middle" fontSize="9" fill="rgba(26,18,48,.4)" fontFamily="system-ui,sans-serif">S4</text>
                <text x="290" y="225" textAnchor="middle" fontSize="9" fill="rgba(26,18,48,.4)" fontFamily="system-ui,sans-serif">S6</text>
                <text x="410" y="225" textAnchor="middle" fontSize="9" fill="rgba(26,18,48,.4)" fontFamily="system-ui,sans-serif">S8</text>
                <text x="38" y="80" textAnchor="end" fontSize="9" fill="rgba(26,18,48,.4)" fontFamily="system-ui,sans-serif">60</text>
                <text x="38" y="130" textAnchor="end" fontSize="9" fill="rgba(26,18,48,.4)" fontFamily="system-ui,sans-serif">55</text>
                <text x="38" y="180" textAnchor="end" fontSize="9" fill="rgba(26,18,48,.4)" fontFamily="system-ui,sans-serif">50</text>
                <line x1="50" y1="80" x2="415" y2="80" stroke="rgba(139,47,201,.05)" strokeWidth="1"/>
                <line x1="50" y1="130" x2="415" y2="130" stroke="rgba(139,47,201,.05)" strokeWidth="1"/>
                <line x1="50" y1="180" x2="415" y2="180" stroke="rgba(139,47,201,.05)" strokeWidth="1"/>
                <path d="M 50 185 C 90 183 130 178 170 168 C 210 158 250 140 290 118 C 330 98 370 82 410 72" stroke="url(#vog2)" strokeWidth="3" fill="none"/>
                <circle cx="50" cy="185" r="5" fill="white" stroke="#8B2FC9" strokeWidth="2"/>
                <circle cx="170" cy="168" r="5" fill="white" stroke="#8B2FC9" strokeWidth="2"/>
                <circle cx="290" cy="118" r="5" fill="white" stroke="#E8237A" strokeWidth="2"/>
                <circle cx="410" cy="72" r="6" fill="url(#vog2)"/>
                <text x="408" y="45" fontSize="10" fill="#8B2FC9" fontWeight="700" fontFamily="system-ui,sans-serif" textAnchor="end">+2,1</text>
                <text x="408" y="57" fontSize="9" fill="rgba(26,18,48,.55)" fontFamily="system-ui,sans-serif" textAnchor="end">km/h VMA</text>
                <rect x="110" y="237" width="220" height="54" rx="10" fill="rgba(139,47,201,.08)" stroke="rgba(139,47,201,.2)" strokeWidth="1"/>
                <text x="220" y="256" textAnchor="middle" fontSize="10.5" fill="#8B2FC9" fontWeight="700" fontFamily="system-ui,sans-serif">2 séances VMA / semaine</text>
                <text x="220" y="277" textAnchor="middle" fontSize="9.5" fill="rgba(26,18,48,.55)" fontFamily="system-ui,sans-serif">Progression mesurable en 6 à 8 semaines</text>
              </svg>
            </div>
            <div style={{ flex: '1 1 300px' }}>
              <SectionTag>Progresser</SectionTag>
              <H2L>Comment améliorer sa <span style={gradText}>VO2max</span> ?</H2L>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
                {[
                  { icon: '🔥', title: 'Fractionné court (VMA)', desc: "Les séances à 95-105% de ta VMA sont les plus efficaces. Efforts de 30 sec à 3 min avec récupération équivalente.", sub: "Exemple : 10×400m à 95% VMA, récup 1 min" },
                  { icon: '⏱️', title: 'Intermittent 30/30', desc: "Alterne 30 secondes à 100-105% VMA et 30 secondes de récupération active. 15 à 20 répétitions. Efficace et adapté à tous les niveaux.", sub: null },
                  { icon: '🏔️', title: 'Côtes', desc: "Le travail en côte sollicite fortement le système cardiovasculaire tout en renforçant les muscles spécifiques à la course.", sub: "10 à 20 montées de 150-200m à RPE 8/10" },
                ].map(item => (
                  <div key={item.title} style={{ display: 'flex', gap: '.85rem', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{item.icon}</span>
                    <div>
                      <p style={{ fontWeight: 700, color: C.dark, marginBottom: '.2rem', fontSize: '.95rem' }}>{item.title}</p>
                      <p style={{ color: 'rgba(26,18,48,.6)', fontSize: '.88rem', lineHeight: 1.65, margin: 0, textAlign: 'justify' }}>{item.desc}</p>
                      {item.sub && <p style={{ color: C.purple, fontSize: '.8rem', fontWeight: 600, margin: '.2rem 0 0', fontStyle: 'italic' }}>{item.sub}</p>}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '1.1rem 1.25rem', borderRadius: 12, background: `linear-gradient(135deg,rgba(139,47,201,.07),rgba(232,35,122,.05))`, border: '1px solid rgba(139,47,201,.15)', marginBottom: '1.5rem' }}>
                <p style={{ margin: 0, fontSize: '.88rem', color: C.dark, lineHeight: 1.7, fontStyle: 'italic', textAlign: 'justify' }}>
                  <strong style={{ color: C.purple }}>💬 Mon conseil :</strong> "Dans mes plans, je programme une séance de VMA par semaine pendant les phases de développement. C'est ce travail régulier et progressif qui fait vraiment bouger les curseurs sur le long terme."
                </p>
              </div>
              <button onClick={() => navigate('/register')} style={{ padding: '.85rem 2rem', borderRadius: 50, border: 'none', background: `linear-gradient(135deg,${C.purple},${C.pink})`, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '.95rem', boxShadow: '0 6px 24px rgba(232,35,122,.4)' }}>
                Je rejoins The Ultimate Academy
              </button>
            </div>
          </div>
        </Inner>
      </section>

      {/* ── VO2MAX VS VMA ──────────────────────────────────── */}
      <section style={{ background: '#0C0A18', padding: '5rem 1.5rem' }}>
        <Inner max={760}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <SectionTag dark>Concepts clés</SectionTag>
            <H2D>VO2max et VMA : quelle <span style={gradText}>différence</span> ?</H2D>
            <p style={{ color: 'rgba(255,255,255,.5)', maxWidth: 460, margin: '0 auto' }}>Deux indicateurs complémentaires, souvent confondus</p>
          </div>
          <div className="tbl-scroll" style={{ background: 'rgba(255,255,255,.04)', borderRadius: 20, border: '1px solid rgba(255,255,255,.08)', overflow: 'hidden', overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: 400, borderCollapse: 'collapse', fontSize: '.9rem' }}>
              <thead>
                <tr style={{ background: 'rgba(139,47,201,.25)' }}>
                  {['', 'VO2max', 'VMA'].map(h => (
                    <th key={h} style={{ padding: '.8rem 1.25rem', textAlign: 'left', color: 'rgba(255,255,255,.9)', fontWeight: 600, fontSize: '.73rem', textTransform: 'uppercase', letterSpacing: '.08em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Unité',    'mL/kg/min',                     'km/h'],
                  ['Mesure',   "Capacité d'absorption d'O2",    'Vitesse à VO2max'],
                  ['Type',     'Indicateur physiologique',       'Indicateur terrain'],
                  ['Usage',    'Évaluation cardio-respiratoire', "Programmation des allures"],
                  ['Formule',  'VO2max ÷ 3,5 ≈ VMA',           'VMA × 3,5 ≈ VO2max'],
                ].map((row, i) => (
                  <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,.06)' }}>
                    <td style={{ padding: '.7rem 1.25rem', color: 'rgba(255,255,255,.55)', fontSize: '.82rem', fontWeight: 600, whiteSpace: 'nowrap' }}>{row[0]}</td>
                    <td style={{ padding: '.7rem 1.25rem', color: i === 4 ? '#C084FC' : 'rgba(255,255,255,.8)', fontWeight: i === 4 ? 700 : 400 }}>{row[1]}</td>
                    <td style={{ padding: '.7rem 1.25rem', color: i === 4 ? '#C084FC' : 'rgba(255,255,255,.8)', fontWeight: i === 4 ? 700 : 400 }}>{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: '2rem', display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/calculateur/vma" style={{ color: '#C084FC', fontSize: '.85rem', textDecoration: 'none' }}>→ Calculer ma VMA</Link>
            <Link to="/calculateur/allures" style={{ color: '#C084FC', fontSize: '.85rem', textDecoration: 'none' }}>→ Calculer mes allures</Link>
            <Link to="/calculateur" style={{ color: '#C084FC', fontSize: '.85rem', textDecoration: 'none' }}>→ Temps de passage</Link>
          </div>
        </Inner>
      </section>

      {/* ── TÉMOIGNAGES ────────────────────────────────────────── */}
      <section style={{ background: C.light, padding: '5rem 1.5rem' }}>
        <Inner>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <SectionTag>Témoignages</SectionTag>
            <H2L>Ce que disent nos <span style={gradText}>athlètes</span></H2L>
          </div>
        </Inner>
        <TestimonialsCarousel testimonials={TESTIMONIALS_VO2MAX} />
      </section>

      <PricingCTA
        title={<>Tu connais ton niveau. <span style={{ background:'linear-gradient(135deg,#8B2FC9,#E8237A)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', display:'inline' }}>Exploite-le.</span></>}
        subtitle="Reçois un plan basé sur ta VMA réelle pour progresser vite, que je construis et ajuste chaque semaine."
      />

      {/* ── FAQ ────────────────────────────────────────────── */}
      <section style={{ background: '#fff', padding: '5rem 1.5rem' }}>
        <Inner max={720}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <SectionTag>Questions fréquentes</SectionTag>
            <H2L>Tout ce que tu dois savoir sur la <span style={gradText}>VO2max</span></H2L>
          </div>
          {FAQ.map((item, i) => (
            <div key={i} style={{ borderBottom: '1px solid rgba(139,47,201,.1)' }}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.1rem 0', background: 'none', border: 'none', cursor: 'pointer', color: C.dark, fontSize: '.95rem', fontWeight: 600, textAlign: 'left', gap: '1rem' }}>
                {item.q}
                <svg width="14" height="14" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, transition: 'transform .2s', transform: openFaq === i ? 'rotate(180deg)' : 'none' }}>
                  <path d="M1 4l5 5 5-5" stroke={C.purple} strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
              {openFaq === i && <p style={{ margin: '0 0 1.25rem', color: 'rgba(26,18,48,.65)', fontSize: '.9rem', lineHeight: 1.75, textAlign: 'justify' }}>{item.a}</p>}
            </div>
          ))}
        </Inner>
      </section>


      <SiteFooter />
    </div>
  )
}
