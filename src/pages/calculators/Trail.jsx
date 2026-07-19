import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Nav from '../../components/Nav'
import SiteFooter from '../../components/SiteFooter'
import PageHero, { gradText } from '../../components/PageHero'
import PricingCTA from '../../components/PricingCTA'

// ── Design ────────────────────────────────────────────────────
const C = { purple: '#8B2FC9', pink: '#E8237A', dark: '#1a1230', light: '#F8F5FF' }
const grad = 'linear-gradient(135deg,#8B2FC9,#E8237A)'
const inputSt = {
  background: '#fff', border: '1px solid rgba(139,47,201,.25)',
  borderRadius: 10, padding: '.55rem .75rem', color: '#1a1230',
  fontSize: '.9rem', outline: 'none', width: '100%', boxSizing: 'border-box',
}
const labelSt = {
  display: 'block', fontSize: '.72rem', fontWeight: 700, color: '#1a1230',
  textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.35rem', opacity: .55,
}

// ── Data ──────────────────────────────────────────────────────
const TERRAIN = [
  { key: 'easy',     emoji: '🌲', label: 'Facile',    desc: 'Chemin forestier, sentier roulant, peu de pierres', dpCoef: 1/100, dmCoef: 1/200, flatCoef: 1.0 },
  { key: 'moderate', emoji: '🏔', label: 'Modéré',    desc: 'Sentier montagneux, passages rocheux ponctuels',    dpCoef: 1/80,  dmCoef: 1/160, flatCoef: 1.05 },
  { key: 'technical',emoji: '🗻', label: 'Technique', desc: 'Éboulis, cailloux, boue, passages délicats',        dpCoef: 1/65,  dmCoef: 1/130, flatCoef: 1.15 },
]

const REFS = [
  { race: 'UTMB',                    dist: '171 km', dp: '10 000 m', temps: '20h – 44h',  allure: "7'00/km – 10'00/km" },
  { race: 'CCC',                     dist: '100 km', dp: '6 100 m',  temps: '12h – 26h',  allure: "6'00/km – 9'00/km"  },
  { race: 'TDS',                     dist: '145 km', dp: '9 100 m',  temps: '18h – 40h',  allure: "7'00/km – 10'00/km" },
  { race: 'Marathon du Mont Blanc',  dist: '42 km',  dp: '2 500 m',  temps: '4h30 – 9h',  allure: "6'00/km – 12'00/km" },
  { race: 'Diagonale des Fous',      dist: '167 km', dp: '9 600 m',  temps: '22h – 56h',  allure: "7'00/km – 12'00/km" },
  { race: 'Trail 20 km / 1 000 m',  dist: '20 km',  dp: '1 000 m',  temps: '1h45 – 3h',  allure: "5'00/km – 9'00/km"  },
]

const FAQ = [
  {
    q: "Sur quoi se base ce calculateur ?",
    a: "Sur la règle de Naismith adaptée au running. La formule convertit le dénivelé en kilomètres fictifs sur terrain plat : km équivalents = distance + D+(m)/100 + D-(m)/200. On applique ensuite ton allure de référence, corrigée par un coefficient terrain.",
  },
  {
    q: "Comment estimer mon allure terrain plat ?",
    a: "Prends ton allure moyenne sur ton dernier 10km ou semi-marathon en route, et ajoute 15 à 30 secondes par km selon ton niveau trail. Exemple : si tu cours le 10km à 5'00\"/km, compte 5'15\" à 5'30\"/km comme base pour ce calculateur.",
  },
  {
    q: "C'est quoi le score ITRA / km effort ?",
    a: "L'ITRA (International Trail Running Association) classe les courses par km effort = distance + D+(m)/100 + D-(m)/200. Catégories : XS < 25, S = 25-44, M = 45-74, L = 75-114, XL = 115-174, XXL = 175+. Ce score détermine aussi les points ITRA pour les qualifications UTMB.",
  },
  {
    q: "Pourquoi le D- est-il pris en compte ?",
    a: "La descente fatigue fortement les quadriceps, surtout sur terrain technique. La formule applique un coefficient D-/200 (moitié moins que le D+) sur terrain facile, ajusté à la hausse en terrain technique.",
  },
  {
    q: "Cette estimation est-elle fiable ?",
    a: "Elle donne une bonne approximation pour des allures trail classiques (6'-9'/km). La météo, l'altitude > 2000m et la forme du jour peuvent modifier le résultat de 10 à 25%. Pour les compétitions, les temps de l'édition précédente restent la meilleure référence.",
  },
]

// ── Helpers ───────────────────────────────────────────────────
const parsePace = (min, sec) => (parseInt(min) || 0) * 60 + (parseInt(sec) || 0)

function fmtTime(s) {
  if (!s || s <= 0) return '--'
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60)
  return h > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${m}min${String(Math.round(s % 60)).padStart(2, '0')}`
}

function fmtPace(s) {
  if (!s || s <= 0) return '--'
  return `${Math.floor(s / 60)}'${String(Math.round(s % 60)).padStart(2, '0')}"/km`
}

function itraCategory(ke) {
  if (ke < 25)  return { label: 'XS', color: '#60A5FA' }
  if (ke < 45)  return { label: 'S',  color: '#34D399' }
  if (ke < 75)  return { label: 'M',  color: '#A3E635' }
  if (ke < 115) return { label: 'L',  color: '#FBBF24' }
  if (ke < 175) return { label: 'XL', color: '#F97316' }
  return { label: 'XXL', color: '#C084FC' }
}

// ── Chip ──────────────────────────────────────────────────────
function Chip({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: '.45rem 1.1rem', borderRadius: 50, cursor: 'pointer',
      border: active ? 'none' : '1px solid rgba(139,47,201,.3)',
      background: active ? grad : 'transparent',
      color: active ? '#fff' : C.purple,
      fontWeight: active ? 700 : 500, fontSize: '.85rem', transition: 'all .15s',
    }}>{children}</button>
  )
}

// ── SVG mountain illustration ─────────────────────────────────
function MountainSVG() {
  return (
    <svg viewBox="0 0 380 210" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', maxWidth: 380, display: 'block' }}>
      <defs>
        <linearGradient id="tg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8B2FC9"/>
          <stop offset="100%" stopColor="#E8237A"/>
        </linearGradient>
        <linearGradient id="tf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8B2FC9" stopOpacity="0.18"/>
          <stop offset="100%" stopColor="#E8237A" stopOpacity="0"/>
        </linearGradient>
      </defs>

      {/* Ground line */}
      <line x1="20" y1="162" x2="360" y2="162" stroke="rgba(139,47,201,.12)" strokeWidth="1.5"/>

      {/* Mountain fill */}
      <polygon points="20,162 110,58 200,108 285,38 360,162" fill="url(#tf)"/>
      {/* Mountain path */}
      <polyline points="20,162 110,58 200,108 285,38 360,162"
        stroke="url(#tg)" strokeWidth="2.5" strokeLinejoin="round"/>

      {/* Summit dot */}
      <circle cx="285" cy="38" r="4.5" fill="#E8237A"/>

      {/* D+ dashed line */}
      <line x1="110" y1="60" x2="110" y2="160" stroke="#8B2FC9" strokeWidth="1.5" strokeDasharray="4,3"/>
      {/* D+ arrow up */}
      <polygon points="110,58 106,70 114,70" fill="#8B2FC9"/>
      <text x="116" y="115" fill="#8B2FC9" fontSize="13" fontWeight="700" fontFamily="system-ui,sans-serif">D+</text>

      {/* D- dashed line */}
      <line x1="285" y1="40" x2="285" y2="160" stroke="#E8237A" strokeWidth="1.5" strokeDasharray="4,3"/>
      {/* D- arrow down */}
      <polygon points="285,160 281,148 289,148" fill="#E8237A"/>
      <text x="291" y="98" fill="#E8237A" fontSize="13" fontWeight="700" fontFamily="system-ui,sans-serif">D-</text>

      {/* Distance arrows */}
      <line x1="20" y1="178" x2="360" y2="178" stroke="rgba(139,47,201,.2)" strokeWidth="1.5"/>
      <polygon points="20,178 32,174 32,182" fill="rgba(139,47,201,.35)"/>
      <polygon points="360,178 348,174 348,182" fill="rgba(139,47,201,.35)"/>
      <text x="190" y="196" fill="rgba(139,47,201,.5)" fontSize="10" fontWeight="600"
        textAnchor="middle" fontFamily="system-ui,sans-serif">Distance totale</text>

      {/* Formula hint */}
      <text x="190" y="22" fill="rgba(139,47,201,.4)" fontSize="9" textAnchor="middle"
        fontFamily="system-ui,sans-serif">km eq = dist + D+/100 + D-/200</text>
    </svg>
  )
}

// ── Component ─────────────────────────────────────────────────
export default function TrailCalculator() {
  const [dist,    setDist]    = useState('')
  const [dp,      setDp]      = useState('')
  const [dm,      setDm]      = useState('')
  const [paceMin, setPaceMin] = useState('')
  const [paceSec, setPaceSec] = useState('')
  const [terrain, setTerrain] = useState('moderate')
  const [openFaq, setOpenFaq] = useState(null)

  useEffect(() => {
    const prev = document.title
    document.title = 'Calculateur temps trail | Dénivelé & Naismith | The Ultimate Academy'
    const meta = document.querySelector('meta[name="description"]')
    const prevM = meta?.content
    if (meta) meta.content = "Estime ton temps trail avec distance, D+ et D-. Règle de Naismith, km équivalents, score ITRA."
    return () => { document.title = prev; if (meta && prevM != null) meta.content = prevM }
  }, [])

  const distN  = parseFloat(dist) || 0
  const dpN    = parseFloat(dp) || 0
  const dmN    = parseFloat(dm) || 0
  const paceS  = parsePace(paceMin, paceSec)
  const t      = TERRAIN.find(x => x.key === terrain) || TERRAIN[1]
  const dmEff  = dmN > 0 ? dmN : dpN
  const extraDp = dpN * t.dpCoef
  const extraDm = dmEff * t.dmCoef
  const kmEq    = distN + extraDp + extraDm
  const kmEff   = distN + dpN / 100 + dmEff / 200
  const adjPace = paceS * t.flatCoef
  const total   = kmEq * adjPace
  const valid   = distN > 0 && dpN >= 0 && paceS > 0
  const cat     = valid ? itraCategory(kmEff) : null

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#fff' }}>
      <Nav />

      <PageHero
        badge="Trail Running"
        title={<>Temps Trail <span style={gradText}>& Dénivelé</span></>}
        subtitle="Distance, D+, D- et type de terrain : calcule ton temps de course trail basé sur la règle de Naismith."
      >
        <button
          onClick={() => document.getElementById('trail-calc')?.scrollIntoView({ behavior: 'smooth' })}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '.5rem',
            padding: '.75rem 1.75rem', borderRadius: 50, border: 'none',
            background: 'linear-gradient(90deg,#8B2FC9,#E8237A,#8B2FC9)',
            backgroundSize: '200% auto', animation: 'shimmer 2.5s linear infinite',
            color: '#fff', fontSize: '.9rem', fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 6px 24px rgba(232,35,122,.4)',
          }}
        >
          Estimer mon temps ↓
        </button>
      </PageHero>

      {/* ── Calculateur (fond clair) ── */}
      <section id="trail-calc" style={{ background: C.light, padding: '5rem 1.5rem' }}>
        <div style={{ maxWidth: 920, margin: '0 auto' }}>

          {/* Titre intro */}
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{
              display: 'inline-block', background: 'rgba(139,47,201,.1)',
              borderRadius: 50, padding: '.3rem .9rem',
              fontSize: '.75rem', fontWeight: 700, color: C.purple,
              letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '1rem',
            }}>Règle de Naismith</div>
            <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', fontWeight: 900, color: C.dark, lineHeight: 1.2, margin: '0 auto', maxWidth: 600 }}>
              Renseigne tes données et obtiens ton{' '}
              <span style={{ background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                temps estimé trail
              </span>
            </h2>
          </div>

          {/* Carte blanche : terrain + inputs + résultats */}
          <div style={{ background: '#fff', borderRadius: 20, padding: '2.5rem', boxShadow: '0 8px 40px rgba(139,47,201,.1)' }}>

            {/* Terrain */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ ...labelSt, marginBottom: '.75rem' }}>Type de terrain</div>
              <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap' }}>
                {TERRAIN.map(tr => (
                  <Chip key={tr.key} active={terrain === tr.key} onClick={() => setTerrain(tr.key)}>
                    {tr.emoji} {tr.label}
                  </Chip>
                ))}
              </div>
              <div style={{ fontSize: '.78rem', color: 'rgba(26,18,48,.4)', marginTop: '.5rem' }}>
                {t.desc}
              </div>
            </div>

            <div style={{ height: 1, background: 'rgba(139,47,201,.1)', marginBottom: '2rem' }}/>

            {/* Inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '.5rem' }}>
              <div>
                <label style={{ ...labelSt, display: 'block', minHeight: '2.6rem' }}>Distance totale (km)</label>
                <input type="number" min="0" step="0.5" placeholder="Ex : 42"
                  value={dist} onChange={e => setDist(e.target.value)} style={inputSt}/>
              </div>
              <div>
                <label style={{ ...labelSt, display: 'block', minHeight: '2.6rem' }}>Dénivelé positif D+ (m)</label>
                <input type="number" min="0" step="50" placeholder="Ex : 2 800"
                  value={dp} onChange={e => setDp(e.target.value)} style={inputSt}/>
              </div>
              <div>
                <label style={{ ...labelSt, display: 'block', minHeight: '2.6rem' }}>
                  Dénivelé négatif D- (m){' '}
                  <span style={{ opacity: .5, textTransform: 'none', letterSpacing: 0 }}>optionnel</span>
                </label>
                <input type="number" min="0" step="50"
                  placeholder={dpN ? `= D+ par défaut (${dpN} m)` : 'Ex : 2 800'}
                  value={dm} onChange={e => setDm(e.target.value)} style={inputSt}/>
              </div>
              <div>
                <label style={{ ...labelSt, display: 'block', minHeight: '2.6rem' }}>Allure 10km (min : sec)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '.35rem', alignItems: 'center' }}>
                  <input type="number" min="0" max="20" placeholder="min"
                    value={paceMin} onChange={e => setPaceMin(e.target.value)} style={inputSt}/>
                  <span style={{ color: 'rgba(26,18,48,.35)', textAlign: 'center', fontWeight: 700 }}>:</span>
                  <input type="number" min="0" max="59" placeholder="sec"
                    value={paceSec} onChange={e => setPaceSec(e.target.value)} style={inputSt}/>
                </div>
              </div>
            </div>
            <div style={{ fontSize: '.7rem', color: 'rgba(26,18,48,.35)', marginBottom: '1.5rem', textAlign: 'right' }}>
              Utilise ton allure sur 10km sur route plate
            </div>

            {/* Résultats */}
            {valid ? (
              <>
                <div style={{ height: 1, background: 'rgba(139,47,201,.1)', marginBottom: '2rem' }}/>

                {/* Temps principal */}
                <div style={{
                  textAlign: 'center', padding: '1.75rem',
                  background: C.light, borderRadius: 16, marginBottom: '1.5rem',
                }}>
                  <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'rgba(26,18,48,.4)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '.4rem' }}>
                    Temps estimé
                  </div>
                  <div style={{ fontSize: 'clamp(2.5rem, 8vw, 3.5rem)', fontWeight: 900, background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1 }}>
                    {fmtTime(total)}
                  </div>
                  <div style={{ fontSize: '.85rem', color: 'rgba(26,18,48,.5)', marginTop: '.5rem' }}>
                    {(distN / total * 3600).toFixed(1)} km/h &nbsp;·&nbsp; allure effective {fmtPace(adjPace)}
                  </div>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '.75rem' }}>
                  {[
                    { label: 'Km équivalents', value: `${kmEq.toFixed(1)} km` },
                    { label: 'Km effort ITRA', value: `${kmEff.toFixed(1)} km` },
                    { label: 'Catégorie ITRA', value: cat?.label, color: cat?.color },
                    { label: 'Temps partie plate', value: fmtTime(distN * adjPace) },
                    { label: 'Temps D+', value: fmtTime(extraDp * adjPace) },
                    { label: 'Temps D-', value: fmtTime(extraDm * adjPace) },
                  ].map((s, i) => (
                    <div key={i} style={{ background: C.light, borderRadius: 12, padding: '.9rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ fontSize: '.6rem', color: 'rgba(26,18,48,.4)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '.3rem', minHeight: '2.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.label}</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: s.color || C.dark }}>{s.value || '--'}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'rgba(26,18,48,.3)', fontSize: '.9rem' }}>
                Remplis les champs pour voir ton estimation ↑
              </div>
            )}
          </div>

          {/* Illustration + légende après le calculateur */}
          <div style={{ marginTop: '3.5rem', background: '#fff', borderRadius: 20, padding: '2.5rem', boxShadow: '0 8px 40px rgba(139,47,201,.08)' }}>
            <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', fontWeight: 900, color: C.dark, marginBottom: '.4rem', textAlign: 'center' }}>
              Comment le calcul <span style={{ background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>fonctionne</span> ?
            </h2>
            <p style={{ color: 'rgba(26,18,48,.5)', fontSize: '.88rem', marginBottom: '2rem', lineHeight: 1.6, textAlign: 'center' }}>
              Le schéma ci-dessous représente le profil altimétrique d'un trail. Chaque élément du dessin correspond à une donnée que tu as saisie.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2.5rem', alignItems: 'center' }}>
              <MountainSVG />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {[
                  {
                    color: C.purple,
                    title: 'D+ — Dénivelé positif (violet)',
                    desc: "Total des mètres montés sur l'ensemble du parcours. Règle Naismith : 100 m D+ = 1 km de temps supplémentaire sur terrain plat.",
                  },
                  {
                    color: C.pink,
                    title: 'D- — Dénivelé négatif (rose)',
                    desc: "Total des mètres descendus. La descente fatigue les quadriceps et ralentit. Règle : 200 m D- = 1 km supplémentaire (moitié moins que le D+).",
                  },
                  {
                    color: 'rgba(139,47,201,.4)',
                    title: 'Distance totale (axe horizontal)',
                    desc: "La longueur du tracé en kilomètres, du départ à l'arrivée, sans tenir compte du dénivelé.",
                  },
                  {
                    color: '#A3E635',
                    title: 'Km effort ITRA',
                    desc: "Valeur utilisée par l'ITRA pour classer les courses : km effort = Distance + D+/100 + D-/200. Ce n'est pas un score de points, c'est la distance fictive qui sert à déterminer la catégorie (XS → XXL).",
                  },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: '.75rem' }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: item.color, flexShrink: 0, marginTop: '.2rem' }}/>
                    <div>
                      <div style={{ fontWeight: 700, color: C.dark, fontSize: '.85rem', marginBottom: '.2rem' }}>{item.title}</div>
                      <div style={{ color: 'rgba(26,18,48,.55)', fontSize: '.8rem', lineHeight: 1.65, textAlign: 'justify' }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Link to="/calculateur" style={{ color: 'rgba(26,18,48,.4)', textDecoration: 'none', fontSize: '.85rem' }}>
              ← Tous les calculateurs
            </Link>
          </div>
        </div>
      </section>

      {/* ── Courses de référence (fond sombre) ── */}
      <section style={{ background: C.dark, padding: '5rem 1.5rem' }}>
        <div style={{ maxWidth: 920, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(1.7rem, 3.5vw, 2.3rem)', fontWeight: 900, color: '#fff', marginBottom: '.6rem', textAlign: 'center' }}>
            Courses de <span style={{ background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>référence</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,.4)', marginBottom: '2.5rem', fontSize: '.9rem', textAlign: 'center' }}>
            Ordres de grandeur pour situer ton niveau et fixer un objectif réaliste.
          </p>
          <div style={{ overflowX: 'auto', borderRadius: 16, border: '1px solid rgba(255,255,255,.07)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.875rem' }}>
              <thead>
                <tr style={{ background: 'rgba(139,47,201,.2)' }}>
                  {['Course', 'Distance', 'D+', 'Temps', 'Allure'].map(h => (
                    <th key={h} style={{
                      padding: '.875rem 1.25rem', textAlign: 'left', fontWeight: 700,
                      color: '#C084FC', fontSize: '.72rem', textTransform: 'uppercase',
                      letterSpacing: '.07em', whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {REFS.map((r, i) => (
                  <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,.06)' }}>
                    <td style={{ padding: '.875rem 1.25rem', fontWeight: 700, color: '#fff' }}>{r.race}</td>
                    <td style={{ padding: '.875rem 1.25rem', color: 'rgba(255,255,255,.55)' }}>{r.dist}</td>
                    <td style={{ padding: '.875rem 1.25rem', color: '#C084FC' }}>{r.dp}</td>
                    <td style={{ padding: '.875rem 1.25rem', color: 'rgba(255,255,255,.75)', fontWeight: 600 }}>{r.temps}</td>
                    <td style={{ padding: '.875rem 1.25rem', color: 'rgba(255,255,255,.4)' }}>{r.allure}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FAQ (fond clair) ── */}
      <section style={{ background: C.light, padding: '5rem 1.5rem' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', fontWeight: 900, color: C.dark, marginBottom: '2rem', textAlign: 'center' }}>
            Questions <span style={{ background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>fréquentes</span>
          </h2>
          {FAQ.map((item, i) => (
            <div key={i} style={{ borderBottom: '1px solid rgba(139,47,201,.12)', overflow: 'hidden' }}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{
                  width: '100%', background: 'none', border: 'none', color: C.dark,
                  cursor: 'pointer', padding: '1.1rem 0',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  gap: '1rem', textAlign: 'left', fontWeight: 700, fontSize: '.9rem',
                }}
              >
                {item.q}
                <span style={{
                  fontSize: '1.2rem', color: C.purple, flexShrink: 0,
                  transition: 'transform .2s', transform: openFaq === i ? 'rotate(45deg)' : 'none',
                }}>+</span>
              </button>
              {openFaq === i && (
                <div style={{ paddingBottom: '1.1rem', fontSize: '.875rem', color: 'rgba(26,18,48,.6)', lineHeight: 1.8, textAlign: 'justify' }}>
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <PricingCTA
        title={<>Ton allure trail, <span style={{ background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', display: 'inline' }}>optimisée semaine par semaine.</span></>}
        subtitle="Un plan structuré depuis ta VMA, ajusté à ton objectif trail. Pas un programme générique."
      />
      <SiteFooter />
    </div>
  )
}
