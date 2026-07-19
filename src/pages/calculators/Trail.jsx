import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Nav from '../../components/Nav'
import SiteFooter from '../../components/SiteFooter'
import PageHero, { gradText } from '../../components/PageHero'
import PricingCTA from '../../components/PricingCTA'

// ── Constantes ────────────────────────────────────────────────
const TERRAIN = [
  {
    key: 'easy',
    label: 'Facile',
    desc: 'Chemin forestier, sentier roulant, peu de rochers',
    dpCoef: 1 / 100,
    dmCoef: 1 / 200,
    flatCoef: 1.0,
  },
  {
    key: 'moderate',
    label: 'Modéré',
    desc: 'Sentier montagneux, quelques passages rocheux',
    dpCoef: 1 / 80,
    dmCoef: 1 / 160,
    flatCoef: 1.05,
  },
  {
    key: 'technical',
    label: 'Technique',
    desc: 'Éboulis, passages délicats, cailloux, boue',
    dpCoef: 1 / 65,
    dmCoef: 1 / 130,
    flatCoef: 1.15,
  },
]

const FAQ = [
  {
    q: "Sur quoi se base ce calculateur ?",
    a: "Sur la règle de Naismith adaptée au running (1892). La formule originale donne 1h pour 5 km + 1h pour 600m de D+. Nous l'avons adaptée pour les coureurs en intégrant un coefficient terrain (facile / modéré / technique) et le dénivelé négatif. Résultat : km équivalents = distance + D+(m)/100 + D-(m)/200 × coef terrain.",
  },
  {
    q: "Comment estimer mon allure terrain plat ?",
    a: "Prends ton allure moyenne sur ton dernier 10km ou semi-marathon en route, et ajoute environ 15 à 30 secondes par km selon ton niveau trail. Exemple : si tu cours le 10km à 5'00\"/km, compte 5'15\"-5'30\"/km comme allure de référence pour ce calculateur.",
  },
  {
    q: "Quelle est la différence entre D+ et km équivalents ?",
    a: "Le D+ (dénivelé positif cumulé) est la somme de tous les mètres montés sur le parcours. Les km équivalents convertissent ce D+ en distance plate fictive : 100m de D+ ≈ 1 km supplémentaire sur terrain plat. Un trail de 30 km / 2000m D+ représente ainsi environ 50 km équivalents.",
  },
  {
    q: "C'est quoi le score ITRA / km effort ?",
    a: "L'ITRA (International Trail Running Association) classe les courses par km effort = distance + D+(m)/100 + D-(m)/200. Une course < 25 km effort : XS. 25-44 : S. 45-74 : M. 75-114 : L. 115-174 : XL. 175+ : XXL (ultra ultra). Ce score détermine aussi les points ITRA pour les qualifications UTMB.",
  },
  {
    q: "Pourquoi le D- est-il pris en compte ?",
    a: "La descente fatigue fortement les quadriceps et ralentit le coureur, surtout en fin de course. Sur terrain technique, une longue descente peut être aussi épuisante que la montée. La formule applique un coefficient D-/200 (soit moitié moins que le D+) pour les terrains faciles, ajusté à la hausse pour les terrains techniques.",
  },
  {
    q: "Cette estimation est-elle fiable ?",
    a: "Elle donne une bonne approximation pour des allures trail classiques (6'-9'/km). Les variantes (météo, altitude > 2000m, conditions de piste, forme du jour) peuvent modifier le résultat de 10 à 25%. Pour les compétitions, l'estimation des organisateurs et les temps de l'édition précédente restent la meilleure référence.",
  },
]

// ── Helpers ───────────────────────────────────────────────────
function parsePace(min, sec) {
  const m = parseInt(min) || 0
  const s = parseInt(sec) || 0
  return m * 60 + s
}

function fmtTime(totalSec) {
  if (!totalSec || totalSec <= 0) return '--'
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = Math.round(totalSec % 60)
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}`
  return `${m}min${String(s).padStart(2, '0')}`
}

function fmtPace(secPerKm) {
  if (!secPerKm || secPerKm <= 0) return '--'
  const m = Math.floor(secPerKm / 60)
  const s = Math.round(secPerKm % 60)
  return `${m}'${String(s).padStart(2, '0')}"/km`
}

function itrationCategory(kmEffort) {
  if (kmEffort < 25) return { label: 'XS', color: '#60A5FA' }
  if (kmEffort < 45) return { label: 'S', color: '#34D399' }
  if (kmEffort < 75) return { label: 'M', color: '#A3E635' }
  if (kmEffort < 115) return { label: 'L', color: '#FBBF24' }
  if (kmEffort < 175) return { label: 'XL', color: '#F97316' }
  return { label: 'XXL', color: '#C084FC' }
}

// ── Styles ────────────────────────────────────────────────────
const C = { purple: '#8B2FC9', pink: '#E8237A', dark: '#0C0A18' }
const grad = 'linear-gradient(135deg,#8B2FC9,#E8237A)'

const inputSt = {
  background: 'rgba(255,255,255,.06)',
  border: '1px solid rgba(255,255,255,.15)',
  borderRadius: 10,
  padding: '.55rem .75rem',
  color: '#fff',
  fontSize: '.9rem',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}
const labelSt = {
  display: 'block',
  fontSize: '.72rem',
  color: 'rgba(255,255,255,.45)',
  textTransform: 'uppercase',
  letterSpacing: '.08em',
  marginBottom: '.4rem',
}
const card = {
  background: 'rgba(255,255,255,.04)',
  border: '1px solid rgba(255,255,255,.09)',
  borderRadius: 16,
  padding: '1.5rem',
}

function TerrainChip({ t, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '.5rem 1rem',
        borderRadius: 50,
        cursor: 'pointer',
        fontSize: '.84rem',
        border: `1px solid ${active ? 'transparent' : 'rgba(139,47,201,.3)'}`,
        background: active ? grad : 'transparent',
        color: active ? '#fff' : 'rgba(255,255,255,.6)',
        fontWeight: active ? 700 : 400,
        transition: 'all .15s',
      }}
    >
      {t.label}
    </button>
  )
}

export default function TrailCalculator() {
  const [dist,     setDist]     = useState('')
  const [dp,       setDp]       = useState('')
  const [dm,       setDm]       = useState('')
  const [paceMin,  setPaceMin]  = useState('')
  const [paceSec,  setPaceSec]  = useState('')
  const [terrain,  setTerrain]  = useState('moderate')
  const [openFaq,  setOpenFaq]  = useState(null)

  useEffect(() => {
    const prev = document.title
    document.title = 'Calculateur de temps trail | Dénivelé & allures | The Ultimate Academy'
    const meta = document.querySelector('meta[name="description"]')
    const prevM = meta?.content
    if (meta) meta.content = "Estime ton temps de course sur trail en tenant compte de la distance, du dénivelé positif et négatif, et du type de terrain. Basé sur la règle de Naismith."
    return () => { document.title = prev; if (meta && prevM != null) meta.content = prevM }
  }, [])

  const distN     = parseFloat(dist) || 0
  const dpN       = parseFloat(dp) || 0
  const dmN       = parseFloat(dm) || 0
  const paceSec_n = parsePace(paceMin, paceSec)
  const t         = TERRAIN.find(x => x.key === terrain) || TERRAIN[1]

  const dmEffective = dmN > 0 ? dmN : dpN

  const extraKmDp   = dpN * t.dpCoef
  const extraKmDm   = dmEffective * t.dmCoef
  const kmEq        = distN + extraKmDp + extraKmDm
  const kmEffort    = distN + dpN / 100 + dmEffective / 200

  const adjustedPace = paceSec_n * t.flatCoef
  const totalSec    = kmEq * adjustedPace

  const timeDp      = extraKmDp * adjustedPace
  const timeDm      = extraKmDm * adjustedPace
  const timeFlat    = distN * adjustedPace

  const avgSpeed    = totalSec > 0 ? (distN / totalSec * 3600) : 0
  const avgPace     = totalSec > 0 ? totalSec / kmEq : 0

  const valid = distN > 0 && dpN >= 0 && paceSec_n > 0
  const cat   = valid ? itrationCategory(kmEffort) : null

  return (
    <div style={{ background: C.dark, color: '#fff', overflowX: 'hidden' }}>
      <Nav />

      <PageHero
        badge="Trail Running"
        title={<>Estimateur de temps <span style={gradText}>Trail</span></>}
        subtitle="Distance, dénivelé positif, terrain : calcule ton temps de course sur trail basé sur la règle de Naismith."
      />

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>

        {/* ── Formule ── */}
        <div style={{ ...card, marginBottom: '2rem', borderColor: 'rgba(139,47,201,.25)' }}>
          <div style={{ fontSize: '.75rem', fontWeight: 700, color: C.purple, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '.75rem' }}>
            Méthode de calcul — Naismith Running
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            {[
              { formula: 'km éq = D + D+(m)/100 + D-(m)/200', label: 'Kilomètres équivalents (terrain facile)' },
              { formula: 'coef terrain × km éq × allure', label: 'Temps estimé total' },
              { formula: 'km effort = D + D+(m)/100 + D-(m)/200', label: 'Score ITRA / distance effort' },
            ].map((f, i) => (
              <div key={i} style={{ background: 'rgba(139,47,201,.08)', borderRadius: 12, padding: '1rem 1.25rem' }}>
                <div style={{ fontFamily: 'monospace', fontSize: '.95rem', color: '#C084FC', fontWeight: 700, marginBottom: '.35rem' }}>{f.formula}</div>
                <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.45)' }}>{f.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Terrain ── */}
        <div style={{ ...card, marginBottom: '2rem' }}>
          <div style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '.9rem', color: 'rgba(255,255,255,.7)', textTransform: 'uppercase', letterSpacing: '.06em', fontSize: '.72rem' }}>
            Type de terrain
          </div>
          <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', marginBottom: '.75rem' }}>
            {TERRAIN.map(t2 => (
              <TerrainChip key={t2.key} t={t2} active={terrain === t2.key} onClick={() => setTerrain(t2.key)} />
            ))}
          </div>
          <div style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.4)' }}>
            {t.desc}
          </div>
        </div>

        {/* ── Inputs ── */}
        <div style={{ ...card, marginBottom: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>

            <div>
              <label style={labelSt}>Distance totale (km)</label>
              <input
                type="number" min="0" step="0.5" placeholder="Ex: 42"
                value={dist} onChange={e => setDist(e.target.value)}
                style={inputSt}
              />
            </div>

            <div>
              <label style={labelSt}>Dénivelé positif — D+ (m)</label>
              <input
                type="number" min="0" step="50" placeholder="Ex: 2800"
                value={dp} onChange={e => setDp(e.target.value)}
                style={inputSt}
              />
            </div>

            <div>
              <label style={labelSt}>Dénivelé négatif — D- (m) <span style={{ color: 'rgba(255,255,255,.3)' }}>(optionnel)</span></label>
              <input
                type="number" min="0" step="50" placeholder={dp ? `= D+ par défaut (${dp}m)` : 'Ex: 2800'}
                value={dm} onChange={e => setDm(e.target.value)}
                style={inputSt}
              />
            </div>

            <div>
              <label style={labelSt}>Allure terrain plat (min / sec)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '.4rem', alignItems: 'center' }}>
                <input
                  type="number" min="0" max="20" placeholder="min"
                  value={paceMin} onChange={e => setPaceMin(e.target.value)}
                  style={inputSt}
                />
                <span style={{ color: 'rgba(255,255,255,.35)', fontSize: '.9rem' }}>:</span>
                <input
                  type="number" min="0" max="59" placeholder="sec"
                  value={paceSec} onChange={e => setPaceSec(e.target.value)}
                  style={inputSt}
                />
              </div>
              <div style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.3)', marginTop: '.3rem' }}>
                Ton allure sur route plane (10km ou semi-marathon)
              </div>
            </div>
          </div>
        </div>

        {/* ── Résultats ── */}
        {valid && (
          <>
            {/* Temps principal */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(139,47,201,.18), rgba(232,35,122,.12))',
              border: '1px solid rgba(139,47,201,.35)',
              borderRadius: 20,
              padding: '2rem',
              textAlign: 'center',
              marginBottom: '1.5rem',
            }}>
              <div style={{ fontSize: '.75rem', fontWeight: 700, color: 'rgba(255,255,255,.45)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '.5rem' }}>
                Temps estimé
              </div>
              <div style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)', fontWeight: 900, background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1 }}>
                {fmtTime(totalSec)}
              </div>
              <div style={{ fontSize: '.9rem', color: 'rgba(255,255,255,.5)', marginTop: '.5rem' }}>
                Vitesse moyenne : {avgSpeed.toFixed(1)} km/h &nbsp;·&nbsp; Allure effective : {fmtPace(avgPace)}
              </div>
            </div>

            {/* Détails */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {[
                { label: 'Km équivalents', value: `${kmEq.toFixed(1)} km`, sub: `+ ${(extraKmDp + extraKmDm).toFixed(1)} km de D` },
                { label: 'Km effort (ITRA)', value: `${kmEffort.toFixed(1)} km`, sub: cat ? `Catégorie ${cat.label}` : '' },
                { label: 'Temps partie plate', value: fmtTime(timeFlat), sub: `${distN} km` },
                { label: 'Temps D+', value: fmtTime(timeDp), sub: `${dpN} m` },
                { label: 'Temps D-', value: fmtTime(timeDm), sub: `${dmEffective} m ${dmN === 0 ? '(= D+)' : ''}` },
              ].map((item, i) => (
                <div key={i} style={{ ...card, textAlign: 'center' }}>
                  <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '.4rem' }}>{item.label}</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>{item.value}</div>
                  {item.sub && <div style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.4)', marginTop: '.25rem' }}>{item.sub}</div>}
                </div>
              ))}
            </div>

            {/* Catégorie ITRA */}
            {cat && (
              <div style={{ ...card, borderColor: cat.color + '40', background: cat.color + '12', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: cat.color }}>{cat.label}</div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: '.95rem' }}>Catégorie ITRA</div>
                    <div style={{ fontSize: '.82rem', color: 'rgba(255,255,255,.5)' }}>
                      {kmEffort.toFixed(1)} km effort · {dpN.toLocaleString('fr-FR')} m D+ · {distN} km
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Profils de référence ── */}
        <div style={{ ...card, marginBottom: '2rem' }}>
          <h3 style={{ fontWeight: 800, fontSize: '1rem', margin: '0 0 1.25rem', color: 'rgba(255,255,255,.85)' }}>
            Profils de référence
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '.75rem' }}>
            {[
              { race: 'UTMB (171 km / 10 000 m D+)', ref: '20h - 44h selon niveau', allure: '7\'-10\'/km trail' },
              { race: 'CCC (100 km / 6 100 m D+)', ref: '12h - 26h selon niveau', allure: '6\'-9\'/km trail' },
              { race: 'TDS (145 km / 9 100 m D+)', ref: '18h - 40h selon niveau', allure: '7\'-10\'/km trail' },
              { race: 'Marathon du Mont Blanc (42 km / 2 500 m D+)', ref: '4h30 - 9h selon niveau', allure: '6\'-12\'/km trail' },
              { race: 'Diagonale des Fous (167 km / 9 600 m D+)', ref: '22h - 56h selon niveau', allure: '7\'-12\'/km trail' },
              { race: 'Trail 20 km / 1 000 m D+', ref: '1h45 - 3h selon niveau', allure: '5\'-9\'/km trail' },
            ].map((r, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,.04)', borderRadius: 10, padding: '.9rem 1rem' }}>
                <div style={{ fontWeight: 700, fontSize: '.85rem', color: '#fff', marginBottom: '.25rem' }}>{r.race}</div>
                <div style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.45)' }}>{r.ref}</div>
                <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.3)', marginTop: '.15rem' }}>{r.allure}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── FAQ ── */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 900, margin: '0 0 1.25rem' }}>Questions fréquentes</h2>
          {FAQ.map((item, i) => (
            <div key={i} style={{ borderBottom: '1px solid rgba(255,255,255,.07)', overflow: 'hidden' }}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{ width: '100%', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '1rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '.9rem' }}
              >
                {item.q}
                <span style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,.4)', flexShrink: 0, transition: 'transform .2s', transform: openFaq === i ? 'rotate(45deg)' : 'none' }}>+</span>
              </button>
              {openFaq === i && (
                <div style={{ padding: '0 0 1rem', fontSize: '.875rem', color: 'rgba(255,255,255,.6)', lineHeight: 1.75 }}>
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center' }}>
          <Link to="/calculateur" style={{ color: 'rgba(255,255,255,.45)', textDecoration: 'none', fontSize: '.85rem' }}>
            ← Tous les calculateurs
          </Link>
        </div>

      </main>

      <PricingCTA
        title={<>Ton allure trail, <span style={{ background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', display: 'inline' }}>optimisée semaine par semaine.</span></>}
        subtitle="Un plan structuré depuis ta VMA, ajusté à ton objectif. Pas un programme générique."
      />
      <SiteFooter />
    </div>
  )
}
