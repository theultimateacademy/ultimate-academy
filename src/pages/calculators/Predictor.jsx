import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Nav from '../../components/Nav'
import SiteFooter from '../../components/SiteFooter'
import PageHero, { gradText } from '../../components/PageHero'
import { fmtHMS, DIST_PRESETS } from '../../lib/runCalc'
import { TESTIMONIALS_PREDICTOR, FUEL_PLAN, EQUIV_TABLE } from '../../lib/toolsContent'
import TestimonialsCarousel from '../../components/TestimonialsCarousel'

const C = { purple: '#8B2FC9', pink: '#E8237A', dark: '#0C0A18', light: '#F8F5FF' }

function riegelPredict(t1Secs, d1Km, d2Km) {
  if (!t1Secs || !d1Km || !d2Km || t1Secs <= 0 || d1Km <= 0 || d2Km <= 0) return 0
  return t1Secs * Math.pow(d2Km / d1Km, 1.06)
}

function improvementLabel(pct) {
  if (pct <= 0)   return null
  if (pct < 2)    return '2 à 4 semaines'
  if (pct < 5)    return '4 à 8 semaines'
  if (pct < 8)    return '8 à 16 semaines'
  if (pct < 12)   return '4 à 6 mois'
  if (pct < 20)   return '6 mois à 1 an'
  return '> 1 an de travail spécifique'
}

const FAQ = [
  { q: 'Comment prédire son temps au marathon ?',
    a: "La formule de Riegel (T2 = T1 × (D2/D1)^1.06) est la référence pour estimer un chrono entre distances. Elle suppose un profil aérobie stable. En pratique, les marathoniens peu expérimentés tendent à murer (ralentir après le 30ème km), ce qui donne des chronos plus lents que prédit. Une préparation spécifique de 16 semaines minimise cet écart." },
  { q: 'Quelle équivalence entre 10 km et semi-marathon ?',
    a: "Selon Riegel, un 10km en 45min correspond à un semi-marathon en environ 1h40. Un 10km en 50min prédit un semi en ~1h53. Ces équivalences supposent une préparation adaptée à la distance cible : l'endurance spécifique au semi exige des sorties longues de 1h30 à 2h régulièrement." },
  { q: 'Si je fais 10 km en 50 min, quel temps au semi ?',
    a: "Avec 10km en 50min (3000 secondes) : 3000 × (21.0975/10)^1.06 ≈ 3000 × 2.27 ≈ 6810 secondes ≈ 1h53. Ce chrono est atteignable avec 10 à 12 semaines de préparation semi incluant des sorties longues et des séances au seuil." },
  { q: 'La formule de Riegel est-elle précise pour le trail ?',
    a: "Non. Riegel est calibré pour la route. En trail, le dénivelé, la technicité du terrain et la gestion de l'effort rendent toute prédiction mécanique peu fiable. Utilise les temps de référence de l'organisation ou les données d'une course similaire sur profil comparable." },
  { q: 'Formule de Riegel expliquée simplement ?',
    a: "Peter Riegel a observé que les performances sportives suivent une loi de puissance : plus la distance augmente, plus la vitesse moyenne baisse, mais pas proportionnellement. L'exposant 1.06 capture ce phénomène. La formule est très précise entre 1km et marathon pour les coureurs entraînés sur route." },
  { q: 'Quand ne pas faire confiance au prédicteur ?',
    a: "Quand ta préparation n'est pas spécifique à la distance cible, quand ton chrono de référence date de plus de 3 mois, quand les profils sont très différents (plat vs dénivelé), ou quand ta fatigue le jour J est anormale. Le prédicteur donne une estimation, pas une garantie." },
]

function ChipBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: '.38rem .85rem', borderRadius: 50, cursor: 'pointer', fontSize: '.82rem',
      border: `1px solid ${active ? 'transparent' : 'rgba(139,47,201,.25)'}`,
      background: active ? `linear-gradient(135deg,${C.purple},${C.pink})` : 'rgba(139,47,201,.07)',
      color: active ? '#fff' : C.purple, fontWeight: active ? 700 : 500,
      transition: 'all .15s',
    }}>{children}</button>
  )
}

function TimeInputs({ h, m, s, onH, onM, onS }) {
  const inputSt = {
    width: 72, padding: '.55rem .65rem', borderRadius: 10, fontSize: '.95rem', fontWeight: 600,
    border: `2px solid rgba(139,47,201,.18)`, background: '#fff', color: '#1a1a2e',
    textAlign: 'center', outline: 'none', transition: 'border-color .15s',
  }
  const labelSt = { display: 'block', fontSize: '.7rem', textTransform: 'uppercase',
    letterSpacing: '.08em', color: 'rgba(139,47,201,.6)', marginBottom: '.35rem', fontWeight: 600 }
  return (
    <div style={{ display: 'flex', gap: '.85rem', flexWrap: 'wrap' }}>
      {[['Heures', h, onH, 9], ['Min', m, onM, 59], ['Sec', s, onS, 59]].map(([lbl, val, set, max]) => (
        <div key={lbl}>
          <label style={labelSt}>{lbl}</label>
          <input type="number" min="0" max={max} placeholder="00" value={val}
            onChange={e => set(e.target.value)}
            onFocus={e => { e.currentTarget.style.borderColor = C.purple }}
            onBlur={e => { e.currentTarget.style.borderColor = 'rgba(139,47,201,.18)' }}
            style={inputSt} />
        </div>
      ))}
    </div>
  )
}

export default function PredictorCalculator() {
  const navigate = useNavigate()

  const [srcKey,   setSrcKey]   = useState('10k')
  const [sh, setSh] = useState(''); const [sm, setSm] = useState(''); const [ss, setSs] = useState('')
  const [tgtKey,   setTgtKey]   = useState('marathon')
  const [targetH,  setTargetH]  = useState('')
  const [targetM,  setTargetM]  = useState('')
  const [targetS,  setTargetS]  = useState('')
  const [fuelTab,  setFuelTab]  = useState('marathon')
  const [openFaq,  setOpenFaq]  = useState(null)

  useEffect(() => {
    const prev = document.title
    document.title = 'Estime ton chrono running | The Ultimate Academy'
    const meta = document.querySelector('meta[name="description"]')
    const prevM = meta?.content
    if (meta) meta.content = "Estime ton temps sur 10km, semi-marathon ou marathon depuis ton dernier chrono. Outil gratuit basé sur la formule de Riegel."
    return () => { document.title = prev; if (meta && prevM != null) meta.content = prevM }
  }, [])

  const srcDist   = DIST_PRESETS.find(d => d.key === srcKey)?.km ?? 0
  const tgtDist   = DIST_PRESETS.find(d => d.key === tgtKey)?.km ?? 0
  const t1Secs    = (parseInt(sh)||0)*3600 + (parseInt(sm)||0)*60 + (parseInt(ss)||0)
  const predicted = riegelPredict(t1Secs, srcDist, tgtDist)
  const targetSecs = (parseInt(targetH)||0)*3600 + (parseInt(targetM)||0)*60 + (parseInt(targetS)||0)
  const improvPct  = predicted > 0 && targetSecs > 0 && targetSecs < predicted
    ? ((predicted - targetSecs) / predicted * 100) : 0
  const improvLabel = improvementLabel(improvPct)

  const fuel = FUEL_PLAN[fuelTab]

  return (
    <div style={{ background: '#fff', color: '#1a1a2e', overflowX: 'hidden', minHeight: '100vh' }}>
      <Nav />

      <PageHero
        badge="Prédicteur de chrono"
        title={<>Estime ton chrono sur <span style={gradText}>n'importe quelle distance</span></>}
        subtitle="À partir d'un chrono récent, estime ta performance sur 5km, 10km, semi ou marathon grâce à la formule de Riegel."
      >
        <button onClick={() => document.getElementById('predictor-tool')?.scrollIntoView({ behavior:'smooth' })}
          style={{ padding:'.85rem 2.2rem', borderRadius:50, cursor:'pointer', fontWeight:800, fontSize:'1rem', border:'none', color:'#fff', background:`linear-gradient(135deg,${C.purple},${C.pink})`, boxShadow:'0 8px 32px rgba(232,35,122,.45)' }}>
          Calculer mon chrono →
        </button>
      </PageHero>

      {/* ── CALCULATOR ─────────────────────────────────── */}
      <section id="predictor-tool" style={{ background: C.light, padding: '5rem 1.5rem' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: 'clamp(1.6rem,4vw,2.4rem)', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '.6rem' }}>
              Estime ton chrono cible
            </h2>
            <p style={{ color: 'rgba(26,26,46,.5)', fontSize: '1rem' }}>
              Entre un chrono récent et choisis la distance que tu vises
            </p>
          </div>

          <div style={{ background: '#fff', borderRadius: 24, padding: '2.25rem',
            boxShadow: `0 8px 48px rgba(139,47,201,.12)` }}>

            {/* Row 1 — source distance + time */}
            <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
              <div style={{ flex: '1 1 260px' }}>
                <p style={{ fontSize: '.8rem', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '.08em', color: 'rgba(139,47,201,.7)', marginBottom: '.75rem' }}>
                  Distance réalisée
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem', marginBottom: '1.5rem' }}>
                  {DIST_PRESETS.map(d => (
                    <ChipBtn key={d.key} active={srcKey === d.key} onClick={() => setSrcKey(d.key)}>{d.label}</ChipBtn>
                  ))}
                </div>
                <p style={{ fontSize: '.8rem', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '.08em', color: 'rgba(139,47,201,.7)', marginBottom: '.75rem' }}>
                  Chrono réalisé
                </p>
                <TimeInputs h={sh} m={sm} s={ss} onH={setSh} onM={setSm} onS={setSs} />
              </div>

              <div style={{ flex: '1 1 200px' }}>
                <p style={{ fontSize: '.8rem', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '.08em', color: 'rgba(139,47,201,.7)', marginBottom: '.75rem' }}>
                  Distance cible
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem' }}>
                  {DIST_PRESETS.map(d => (
                    <ChipBtn key={d.key} active={tgtKey === d.key} onClick={() => setTgtKey(d.key)}>{d.label}</ChipBtn>
                  ))}
                </div>
              </div>
            </div>

            {/* Prediction result */}
            {predicted > 0 && (
              <div style={{ padding: '1.5rem', borderRadius: 16,
                background: `linear-gradient(135deg, rgba(139,47,201,.06), rgba(232,35,122,.04))`,
                border: `1.5px solid rgba(139,47,201,.2)`, marginBottom: '1.75rem' }}>
                <p style={{ margin: '0 0 .35rem', fontSize: '.75rem', textTransform: 'uppercase',
                  letterSpacing: '.1em', color: 'rgba(139,47,201,.6)', fontWeight: 600 }}>
                  Chrono prédit · {DIST_PRESETS.find(d => d.key === tgtKey)?.label}
                </p>
                <p style={{ margin: '0 0 .35rem', fontSize: '3rem', fontWeight: 900, lineHeight: 1,
                  background: `linear-gradient(135deg,${C.purple},${C.pink})`,
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  fontVariantNumeric: 'tabular-nums' }}>
                  {fmtHMS(predicted)}
                </p>
                <p style={{ margin: 0, fontSize: '.78rem', color: 'rgba(26,26,46,.35)' }}>
                  Formule de Riegel · T2 = T1 × (D2/D1)^1.06
                </p>
              </div>
            )}

            {/* Full table */}
            {t1Secs > 0 && srcDist > 0 && (
              <>
                <p style={{ fontSize: '.8rem', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '.08em', color: 'rgba(139,47,201,.7)', marginBottom: '.85rem' }}>
                  Prédictions sur toutes les distances
                </p>
                <div style={{ overflowX: 'auto', borderRadius: 14, border: '1px solid rgba(139,47,201,.1)', marginBottom: '1.75rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.875rem' }}>
                    <thead>
                      <tr style={{ background: 'rgba(139,47,201,.05)' }}>
                        {['Distance', 'Chrono prédit', 'Allure moy.'].map(h => (
                          <th key={h} style={{ padding: '.65rem 1rem', textAlign: 'left',
                            color: 'rgba(26,26,46,.4)', fontWeight: 600, fontSize: '.73rem',
                            textTransform: 'uppercase', letterSpacing: '.07em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {DIST_PRESETS.map(d => {
                        const pred = d.km === srcDist ? t1Secs : riegelPredict(t1Secs, srcDist, d.km)
                        const isSrc = d.km === srcDist
                        const paceS = pred > 0 ? pred / d.km : 0
                        return (
                          <tr key={d.key} style={{ borderTop: '1px solid rgba(139,47,201,.07)',
                            background: isSrc ? 'rgba(139,47,201,.04)' : 'transparent' }}>
                            <td style={{ padding: '.7rem 1rem', color: isSrc ? 'rgba(26,26,46,.45)' : '#1a1a2e', fontWeight: isSrc ? 400 : 600 }}>
                              {d.label}{isSrc && <span style={{ fontSize: '.73rem', color: 'rgba(26,26,46,.3)', marginLeft: '.4rem' }}>(référence)</span>}
                            </td>
                            <td style={{ padding: '.7rem 1rem', fontVariantNumeric: 'tabular-nums',
                              fontWeight: isSrc ? 400 : 800,
                              background: isSrc ? undefined : `linear-gradient(135deg,${C.purple},${C.pink})`,
                              WebkitBackgroundClip: isSrc ? undefined : 'text',
                              WebkitTextFillColor: isSrc ? 'rgba(26,26,46,.4)' : 'transparent' }}>
                              {fmtHMS(pred)}
                            </td>
                            <td style={{ padding: '.7rem 1rem', color: 'rgba(26,26,46,.45)', fontVariantNumeric: 'tabular-nums' }}>
                              {paceS > 0 ? `${Math.floor(paceS/60)}'${String(Math.round(paceS%60)).padStart(2,'0')}"/km` : '—'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Objective section */}
            {predicted > 0 && (
              <>
                <p style={{ fontSize: '.8rem', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '.08em', color: 'rgba(139,47,201,.7)', marginBottom: '.5rem' }}>
                  Ton objectif est-il réaliste ?
                </p>
                <p style={{ fontSize: '.85rem', color: 'rgba(26,26,46,.45)', marginBottom: '1rem' }}>
                  Entre ton chrono cible sur {DIST_PRESETS.find(d => d.key === tgtKey)?.label} pour estimer le travail nécessaire.
                </p>
                <TimeInputs h={targetH} m={targetM} s={targetS} onH={setTargetH} onM={setTargetM} onS={setTargetS} />

                {targetSecs > 0 && (
                  <div style={{ marginTop: '1.25rem', padding: '1.1rem 1.25rem', borderRadius: 14,
                    background: targetSecs >= predicted ? 'rgba(52,211,153,.08)' : 'rgba(139,47,201,.06)',
                    border: `1.5px solid ${targetSecs >= predicted ? 'rgba(52,211,153,.3)' : 'rgba(139,47,201,.2)'}` }}>
                    {targetSecs >= predicted ? (
                      <>
                        <p style={{ margin: '0 0 .3rem', fontWeight: 700, color: '#059669' }}>
                          ✓ Tu as déjà le niveau pour cet objectif !
                        </p>
                        <p style={{ margin: 0, fontSize: '.82rem', color: 'rgba(26,26,46,.55)' }}>
                          Ton chrono prédit est {fmtHMS(predicted)}, soit {fmtHMS(targetSecs - predicted)} plus rapide que ton objectif.
                        </p>
                      </>
                    ) : improvPct > 0 ? (
                      <>
                        <p style={{ margin: '0 0 .35rem', fontSize: '.85rem', color: 'rgba(26,26,46,.6)' }}>
                          Amélioration nécessaire :{' '}
                          <strong style={{ color: C.purple }}>{improvPct.toFixed(1)}%</strong>
                          {' '}· {fmtHMS(predicted - targetSecs)} à gagner
                        </p>
                        {improvLabel && (
                          <p style={{ margin: '0 0 .3rem', fontWeight: 700, color: '#1a1a2e' }}>
                            Durée estimée :{' '}
                            <span style={{ background: `linear-gradient(135deg,${C.purple},${C.pink})`,
                              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                              {improvLabel}
                            </span>{' '}
                            d'entraînement structuré
                          </p>
                        )}
                        <p style={{ margin: 0, fontSize: '.78rem', color: 'rgba(26,26,46,.35)' }}>
                          Basé sur une progression de 1 à 3% par mois avec un suivi structuré.
                        </p>
                      </>
                    ) : null}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── COMMENT ÇA FONCTIONNE ──────────────────────── */}
      <section style={{ background: '#fff', padding: '5rem 1.5rem' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto', display: 'flex', gap: '4rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: '0 0 auto', width: 'min(100%, 420px)', borderRadius: 24, overflow: 'hidden',
            boxShadow: `0 20px 60px rgba(139,47,201,.18)` }}>
            <svg viewBox="0 0 420 315" style={{width:'100%',display:'block',aspectRatio:'4/3'}}>
              <defs>
                <linearGradient id="pg1" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#8B2FC9"/>
                  <stop offset="100%" stopColor="#E8237A"/>
                </linearGradient>
              </defs>
              <rect width="420" height="315" fill="#EDE8F7"/>
              <text x="210" y="26" textAnchor="middle" fontSize="12" fill="#1a1230" fontWeight="700" fontFamily="system-ui,sans-serif">Courbe de performance · Riegel</text>
              <text x="210" y="42" textAnchor="middle" fontSize="9.5" fill="rgba(26,18,48,.38)" fontFamily="system-ui,sans-serif">T2 = T1 × (D2 / D1) ^ 1,06</text>
              <line x1="50" y1="55" x2="50" y2="230" stroke="rgba(139,47,201,.1)" strokeWidth="1"/>
              <line x1="50" y1="230" x2="400" y2="230" stroke="rgba(139,47,201,.1)" strokeWidth="1"/>
              <text x="35" y="61" textAnchor="end" fontSize="9" fill="rgba(26,18,48,.55)" fontFamily="system-ui,sans-serif">18</text>
              <text x="35" y="97" textAnchor="end" fontSize="9" fill="rgba(26,18,48,.55)" fontFamily="system-ui,sans-serif">17</text>
              <text x="35" y="134" textAnchor="end" fontSize="9" fill="rgba(26,18,48,.55)" fontFamily="system-ui,sans-serif">16</text>
              <text x="35" y="170" textAnchor="end" fontSize="9" fill="rgba(26,18,48,.55)" fontFamily="system-ui,sans-serif">15</text>
              <text x="35" y="206" textAnchor="end" fontSize="9" fill="rgba(26,18,48,.55)" fontFamily="system-ui,sans-serif">14</text>
              <text x="38" y="245" fontSize="9" fill="rgba(26,18,48,.55)" fontFamily="system-ui,sans-serif">5km</text>
              <text x="152" y="245" textAnchor="middle" fontSize="9" fill="rgba(26,18,48,.55)" fontFamily="system-ui,sans-serif">10km</text>
              <text x="260" y="245" textAnchor="middle" fontSize="9" fill="rgba(26,18,48,.55)" fontFamily="system-ui,sans-serif">Semi</text>
              <text x="390" y="245" textAnchor="middle" fontSize="9" fill="rgba(26,18,48,.55)" fontFamily="system-ui,sans-serif">Marathon</text>
              <path d="M 60 68 C 100 80 140 100 155 108 C 210 130 250 148 265 158 C 320 180 360 198 390 210" stroke="url(#pg1)" strokeWidth="3" fill="none"/>
              <circle cx="60" cy="68" r="6" fill="white" stroke="#8B2FC9" strokeWidth="2"/>
              <text x="62" y="60" fontSize="9" fill="#8B2FC9" fontFamily="system-ui,sans-serif">17,8 km/h</text>
              <circle cx="155" cy="108" r="6" fill="white" stroke="#8B2FC9" strokeWidth="2"/>
              <text x="157" y="100" fontSize="9" fill="#8B2FC9" fontFamily="system-ui,sans-serif">16,8 km/h</text>
              <circle cx="265" cy="158" r="6" fill="white" stroke="#E8237A" strokeWidth="2"/>
              <text x="267" y="150" fontSize="9" fill="#E8237A" fontFamily="system-ui,sans-serif">15,3 km/h</text>
              <circle cx="390" cy="210" r="7" fill="url(#pg1)"/>
              <rect x="368" y="177" width="44" height="12" fill="#EDE8F7"/>
              <text x="410" y="188" textAnchor="end" fontSize="9" fill="#E8237A" fontFamily="system-ui,sans-serif">13,9 km/h</text>
              <text x="210" y="275" textAnchor="middle" fontSize="10" fill="rgba(26,18,48,.6)" fontFamily="system-ui,sans-serif">Vitesse moyenne en km/h · coureur référence 5km 20min</text>
              <text x="210" y="294" textAnchor="middle" fontSize="9.5" fill="rgba(26,18,48,.5)" fontFamily="system-ui,sans-serif">La vitesse baisse à mesure que la distance augmente</text>
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', padding: '.28rem .85rem',
              borderRadius: 99, background: `rgba(139,47,201,.1)`, border: `1px solid rgba(139,47,201,.25)`,
              fontSize: '.72rem', fontWeight: 700, color: C.purple, letterSpacing: '.1em',
              textTransform: 'uppercase', marginBottom: '1.25rem' }}>
              Comment ça fonctionne
            </div>
            <h2 style={{ fontSize: 'clamp(1.6rem,4vw,2.4rem)', fontWeight: 900, letterSpacing: '-0.02em',
              lineHeight: 1.15, marginBottom: '1.25rem' }}>
              La formule de Riegel,<br />expliquée simplement
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {[
                ['📐', "T2 = T1 × (D2/D1)^1.06", "C'est la formule. T1 est ton chrono de référence, D1 ta distance réalisée, D2 la distance cible. L'exposant 1.06 traduit le fait que la vitesse baisse quand la distance augmente."],
                ['🏃', 'Une loi de puissance universelle', "Peter Riegel a observé ce modèle en 1977 sur des centaines de performances. Il est précis pour les distances de 1km à marathon sur route, pour des coureurs avec une base aérobie solide."],
                ['⚠️', 'Ses limites', "La formule suppose que tu t'es préparé spécifiquement pour la distance cible. Un 10km récent prédit un marathon uniquement si tu as mis les sorties longues et les séances de seuil adaptées."],
              ].map(([icon, title, desc]) => (
                <div key={title} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 12, fontSize: '1.1rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: `rgba(139,47,201,.1)` }}>
                    {icon}
                  </div>
                  <div>
                    <p style={{ margin: '0 0 .2rem', fontWeight: 700, fontSize: '.95rem' }}>{title}</p>
                    <p style={{ margin: 0, fontSize: '.875rem', color: 'rgba(26,26,46,.55)', lineHeight: 1.7 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── RIEGEL EN PROFONDEUR ────────────────────────── */}
      <section style={{ background: C.dark, padding: '5rem 1.5rem', color: '#fff' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto', display: 'flex', gap: '4rem', alignItems: 'center', flexWrap: 'wrap-reverse' }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ display: 'inline-flex', padding: '.28rem .85rem', borderRadius: 99,
              background: 'rgba(192,132,252,.15)', border: '1px solid rgba(192,132,252,.3)',
              fontSize: '.72rem', fontWeight: 700, color: '#C084FC', letterSpacing: '.1em',
              textTransform: 'uppercase', marginBottom: '1.25rem' }}>
              Pour aller plus loin
            </div>
            <h2 style={{ fontSize: 'clamp(1.6rem,4vw,2.4rem)', fontWeight: 900, letterSpacing: '-0.02em',
              lineHeight: 1.15, marginBottom: '1.5rem' }}>
              Comprendre les limites<br />du modèle
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {[
                ['Préparation spécifique obligatoire',
                  "La formule suppose que tu t'es préparé pour la distance cible. Un 10km récent ne prédit un marathon fiable que si tu as couru des sorties longues de 28 à 35km. Sans ça, tu mureras."],
                ['Fraîcheur et forme du moment',
                  "Un chrono réalisé en fin de cycle chargé est moins représentatif qu'un chrono en forme optimale. Si tu évaluais fatigué, tes vraies capacités sont probablement supérieures à la prédiction."],
                ['Profil du parcours',
                  "Riegel est calibré pour des courses plates sur route. Un 10km vallonné comparé à un marathon plat faussera les estimations. Corrige mentalement de 15 à 30 secondes par km de dénivelé significatif."],
                ['Le facteur mental',
                  "Aucun modèle ne capture la gestion de l'effort, la motivation du jour J ou la stratégie de course. Utilise le prédicteur comme balise, pas comme vérité absolue."],
              ].map(([title, desc]) => (
                <div key={title} style={{ paddingLeft: '1rem', borderLeft: `3px solid rgba(192,132,252,.3)` }}>
                  <p style={{ margin: '0 0 .3rem', fontWeight: 700, color: '#fff', fontSize: '.95rem' }}>{title}</p>
                  <p style={{ margin: 0, fontSize: '.875rem', color: 'rgba(255,255,255,.5)', lineHeight: 1.7 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div style={{ flex: '0 0 auto', width: 'min(100%, 400px)', borderRadius: 24, overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,.5)' }}>
            <svg viewBox="0 0 400 300" style={{width:'100%',display:'block',aspectRatio:'4/3'}}>
              <defs>
                <linearGradient id="pg2" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#8B2FC9"/>
                  <stop offset="100%" stopColor="#E8237A"/>
                </linearGradient>
              </defs>
              <rect width="400" height="300" fill="#12102a"/>
              <text x="200" y="26" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,.3)" fontFamily="system-ui,sans-serif">Facteurs limitants : à ne pas négliger</text>
              <rect x="30" y="45" width="160" height="80" rx="12" fill="rgba(139,47,201,.1)" stroke="rgba(139,47,201,.25)" strokeWidth="1"/>
              <text x="110" y="72" textAnchor="middle" fontSize="18" fontFamily="system-ui,sans-serif">🏋️</text>
              <text x="110" y="90" textAnchor="middle" fontSize="11" fill="white" fontWeight="700" fontFamily="system-ui,sans-serif">Préparation</text>
              <text x="110" y="105" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,.38)" fontFamily="system-ui,sans-serif">Spécificité à la distance</text>
              <rect x="210" y="45" width="160" height="80" rx="12" fill="rgba(232,35,122,.08)" stroke="rgba(232,35,122,.22)" strokeWidth="1"/>
              <text x="290" y="72" textAnchor="middle" fontSize="18" fontFamily="system-ui,sans-serif">⚡</text>
              <text x="290" y="90" textAnchor="middle" fontSize="11" fill="white" fontWeight="700" fontFamily="system-ui,sans-serif">Forme du jour</text>
              <text x="290" y="105" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,.38)" fontFamily="system-ui,sans-serif">Fatigue &amp; récupération</text>
              <rect x="30" y="145" width="160" height="80" rx="12" fill="rgba(163,230,53,.07)" stroke="rgba(163,230,53,.2)" strokeWidth="1"/>
              <text x="110" y="172" textAnchor="middle" fontSize="18" fontFamily="system-ui,sans-serif">🗺️</text>
              <text x="110" y="190" textAnchor="middle" fontSize="11" fill="white" fontWeight="700" fontFamily="system-ui,sans-serif">Profil du parcours</text>
              <text x="110" y="205" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,.38)" fontFamily="system-ui,sans-serif">Dénivelé &amp; terrain</text>
              <rect x="210" y="145" width="160" height="80" rx="12" fill="rgba(251,191,36,.07)" stroke="rgba(251,191,36,.2)" strokeWidth="1"/>
              <text x="290" y="172" textAnchor="middle" fontSize="18" fontFamily="system-ui,sans-serif">🧠</text>
              <text x="290" y="190" textAnchor="middle" fontSize="11" fill="white" fontWeight="700" fontFamily="system-ui,sans-serif">Facteur mental</text>
              <text x="290" y="205" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,.38)" fontFamily="system-ui,sans-serif">Gestion &amp; motivation</text>
              <line x1="30" y1="245" x2="370" y2="245" stroke="rgba(255,255,255,.06)" strokeWidth="1"/>
              <text x="200" y="265" textAnchor="middle" fontSize="10.5" fill="rgba(255,255,255,.35)" fontFamily="system-ui,sans-serif">La formule donne une estimation,</text>
              <text x="200" y="283" textAnchor="middle" fontSize="10.5" fill="rgba(255,255,255,.35)" fontFamily="system-ui,sans-serif">les facteurs humains font la vraie différence.</text>
            </svg>
          </div>
        </div>
      </section>

      {/* ── TABLE D'ÉQUIVALENCES ────────────────────────── */}
      <section style={{ background: C.light, padding: '5rem 1.5rem' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: 'clamp(1.6rem,4vw,2.4rem)', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '.6rem' }}>
              Table d'équivalences
            </h2>
            <p style={{ color: 'rgba(26,26,46,.45)', fontSize: '1rem' }}>
              Correspondances indicatives entre 10km, semi et marathon
            </p>
          </div>
          <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden',
            boxShadow: '0 4px 32px rgba(139,47,201,.08)', border: '1px solid rgba(139,47,201,.1)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.9rem' }}>
              <thead>
                <tr style={{ background: `linear-gradient(135deg, #8B2FC9, #E8237A)` }}>
                  {['10 km', 'Semi-marathon', 'Marathon'].map(h => (
                    <th key={h} style={{ padding: '.85rem 1.25rem', textAlign: 'center', fontWeight: 700, fontSize: '.8rem',
                      textTransform: 'uppercase', letterSpacing: '.08em', color: '#fff' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {EQUIV_TABLE.map((row, i) => (
                  <tr key={i} style={{ borderTop: '1px solid rgba(139,47,201,.07)',
                    background: i % 2 === 0 ? '#fff' : 'rgba(139,47,201,.02)' }}>
                    <td style={{ padding: '.8rem 1.25rem', textAlign: 'center', fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                      background: `linear-gradient(135deg,${C.purple},${C.pink})`,
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{row.t10}</td>
                    <td style={{ padding: '.8rem 1.25rem', textAlign: 'center', fontVariantNumeric: 'tabular-nums',
                      color: 'rgba(26,26,46,.7)', fontWeight: 500 }}>{row.semi}</td>
                    <td style={{ padding: '.8rem 1.25rem', textAlign: 'center', fontVariantNumeric: 'tabular-nums',
                      color: 'rgba(26,26,46,.7)', fontWeight: 500 }}>{row.marathon}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '.78rem', color: 'rgba(26,26,46,.35)' }}>
            Basé sur la formule de Riegel · valeurs indicatives pour coureurs entraînés
          </p>
        </div>
      </section>

      {/* ── RAVITAILLEMENT ──────────────────────────────── */}
      <section style={{ background: '#fff', padding: '5rem 1.5rem' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: 'clamp(1.6rem,4vw,2.4rem)', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '.6rem' }}>
              Plan de ravitaillement
            </h2>
            <p style={{ color: 'rgba(26,26,46,.45)', fontSize: '1rem' }}>
              Mange avant d'avoir faim, bois avant d'avoir soif
            </p>
          </div>
          <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
            {['semi','marathon'].map(k => (
              <ChipBtn key={k} active={fuelTab === k} onClick={() => setFuelTab(k)}>
                {FUEL_PLAN[k].label}
              </ChipBtn>
            ))}
          </div>

          <div style={{ background: `rgba(139,47,201,.06)`, borderRadius: 16, padding: '1.1rem 1.25rem',
            border: `1px solid rgba(139,47,201,.15)`, marginBottom: '1.75rem', display: 'flex', gap: '.75rem', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>💡</span>
            <p style={{ margin: 0, fontSize: '.88rem', color: 'rgba(26,26,46,.7)', lineHeight: 1.7 }}>
              <strong style={{ color: '#1a1a2e' }}>Mon conseil :</strong> {fuel.tip}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            {fuel.points.map((pt) => (
              <div key={pt.km} style={{ display: 'flex', gap: '1.25rem', alignItems: 'center',
                background: '#fff', borderRadius: 14, padding: '.85rem 1.25rem',
                border: '1px solid rgba(139,47,201,.1)', boxShadow: '0 2px 12px rgba(139,47,201,.06)' }}>
                <div style={{ flexShrink: 0, minWidth: 60, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900,
                    background: `linear-gradient(135deg,${C.purple},${C.pink})`,
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {pt.km} km
                  </div>
                  <div style={{ fontSize: '.7rem', color: 'rgba(26,26,46,.4)', marginTop: '.15rem' }}>{pt.label}</div>
                </div>
                <div style={{ width: 1, height: 36, background: 'rgba(139,47,201,.12)', flexShrink: 0 }} />
                <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                  {pt.items.map(item => (
                    <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '.35rem',
                      padding: '.3rem .75rem', borderRadius: 99,
                      background: 'rgba(139,47,201,.07)', border: '1px solid rgba(139,47,201,.12)',
                      fontSize: '.8rem', fontWeight: 500, color: 'rgba(26,26,46,.7)' }}>
                      <span>{item.icon}</span> {item.name}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TÉMOIGNAGES ─────────────────────────────────── */}
      <section style={{ background: C.light, padding: '5rem 1.5rem' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: 'clamp(1.6rem,4vw,2.4rem)', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '.6rem' }}>
            Ils ont atteint leur chrono cible
          </h2>
          <p style={{ color: 'rgba(26,26,46,.45)', fontSize: '1rem' }}>Des vrais résultats, avec un suivi structuré</p>
        </div>
        <TestimonialsCarousel testimonials={TESTIMONIALS_PREDICTOR} />
      </section>

      {/* ── CTA ─────────────────────────────────────────── */}
      <section style={{ padding: '6rem 1.5rem', background: C.dark, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '10%', left: '-5%', width: '40vw', height: '40vw', maxWidth: 420, maxHeight: 420, borderRadius: '50%', background: 'radial-gradient(circle,rgba(139,47,201,.22) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '-5%', width: '35vw', height: '35vw', maxWidth: 360, maxHeight: 360, borderRadius: '50%', background: 'radial-gradient(circle,rgba(232,35,122,.16) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 620, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 24, padding: '3.5rem 2.5rem' }}>
            <p style={{ fontSize: '.75rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(192,132,252,.8)', marginBottom: '.75rem', fontWeight: 600 }}>Coaching personnalisé</p>
            <h2 style={{ fontSize: 'clamp(1.4rem,4vw,2rem)', fontWeight: 900, color: '#fff', marginBottom: '1rem', lineHeight: 1.25 }}>
              Atteins ce chrono avec un vrai coaching
            </h2>
            <p style={{ color: 'rgba(255,255,255,.55)', maxWidth: 440, margin: '0 auto 2rem', lineHeight: 1.65 }}>
              Je construis ton programme semaine par semaine pour que les prédictions deviennent réalité : plan structuré, suivi hebdomadaire, ajustements en temps réel.
            </p>
            <button onClick={() => navigate('/register')} style={{
              padding: '.9rem 2.4rem', borderRadius: 50, border: 'none', cursor: 'pointer',
              background: `linear-gradient(135deg,${C.purple},${C.pink})`, color: '#fff', fontSize: '1rem', fontWeight: 800,
              boxShadow: '0 8px 32px rgba(232,35,122,.5)', transition: 'transform .15s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
              Démarrer mon coaching · 30€/mois
            </button>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────── */}
      <section style={{ background: '#fff', padding: '5rem 1.5rem' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: 'clamp(1.6rem,4vw,2.4rem)', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '.6rem' }}>
              Questions fréquentes
            </h2>
            <p style={{ color: 'rgba(26,26,46,.45)', fontSize: '1rem' }}>
              Tout sur la prédiction de chrono et la formule de Riegel
            </p>
          </div>
          {FAQ.map((item, i) => (
            <div key={i} style={{ borderBottom: '1px solid rgba(139,47,201,.1)', marginBottom: '.15rem' }}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '1.1rem 0', background: 'none', border: 'none', cursor: 'pointer',
                  color: '#1a1a2e', fontSize: '.95rem', fontWeight: 600, textAlign: 'left', gap: '1rem' }}>
                {item.q}
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"
                  style={{ flexShrink: 0, color: C.purple, transition: 'transform .2s',
                    transform: openFaq === i ? 'rotate(180deg)' : 'none' }}>
                  <path d="M1 4l5 5 5-5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
                </svg>
              </button>
              {openFaq === i && (
                <p style={{ margin: '0 0 1.1rem', fontSize: '.875rem', color: 'rgba(26,26,46,.6)', lineHeight: 1.8 }}>{item.a}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER CTA ──────────────────────────────────── */}
      <section style={{ background: C.dark, padding: '5rem 1.5rem', textAlign: 'center' }}>
        <p style={{ fontSize: '.72rem', letterSpacing: '.2em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,.3)', marginBottom: '1.25rem' }}>The Ultimate Academy</p>
        <h2 style={{ fontSize: 'clamp(1.8rem,5vw,3.2rem)', fontWeight: 900, color: '#fff',
          letterSpacing: '-0.03em', marginBottom: '1.5rem', lineHeight: 1.1 }}>
          Ton objectif, ton plan,<br />
          <span style={{ background: `linear-gradient(135deg,${C.purple},${C.pink})`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            ton run.
          </span>
        </h2>
        <button onClick={() => navigate('/register')} style={{
          padding: '.9rem 2.25rem', borderRadius: 50, border: 'none', cursor: 'pointer',
          background: `linear-gradient(135deg,${C.purple},${C.pink})`, color: '#fff',
          fontSize: '1rem', fontWeight: 800, boxShadow: '0 8px 32px rgba(232,35,122,.4)',
        }}>
          Rejoindre The Ultimate Academy →
        </button>
      </section>

      <SiteFooter />
    </div>
  )
}
