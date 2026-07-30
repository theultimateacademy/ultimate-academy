import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Nav from '../../components/Nav'
import SiteFooter from '../../components/SiteFooter'
import PageHero, { gradText } from '../../components/PageHero'
import PricingCTA from '../../components/PricingCTA'

const C = { purple: '#8B2FC9', pink: '#E8237A', dark: '#1a1230', light: '#F8F5FF' }
const grad = `linear-gradient(135deg,${C.purple},${C.pink})`

const PRESETS = [
  { label: 'Sprint',   swim: 750,  bike: 20,  run: 5    },
  { label: 'Olympique',swim: 1500, bike: 40,  run: 10   },
  { label: '70.3',     swim: 1900, bike: 90,  run: 21.1 },
  { label: 'Ironman',  swim: 3800, bike: 180, run: 42.2 },
]

const FAQ = [
  { q: "Pourquoi l'allure natation est en min/100m ?",
    a: "En natation, la distance de référence est le bassin de 100m, pas le kilomètre. Une allure de 2'00\"/100m signifie que tu nages chaque 100m en 2 minutes. C'est l'équivalent du min/km en course. Pour convertir : multiplie par 10 pour avoir ton temps au km (2'00\"/100m = 20'00\"/km)." },
  { q: "Comment améliorer ma vitesse vélo sans me vider pour la course ?",
    a: "La clé est le ratio puissance/effort. En triathlon, la règle est de rouler à 70-80% de ton effort maximal pour préserver tes jambes pour la course. Travailler sa position aérodynamique peut gagner 2-3 km/h sans dépenser plus d'énergie. En entraînement, les sorties longues à allure modérée (3-5h) sont la base." },
  { q: "Quel temps prévoir pour les transitions T1 et T2 ?",
    a: "Ce calculateur affiche le temps de nage + vélo + course sans les transitions. En compétition, prévois 2 à 5 minutes par transition selon ta fluidité. Les débutants mettent souvent 5-8 min en T1 (nage → vélo) et 2-4 min en T2 (vélo → course). Les pros descendent sous 1 minute." },
  { q: "Quelle allure de course prévoir après le vélo ?",
    a: "Le phénomène de 'jambes de brique' après le vélo fait perdre 10 à 15% par rapport à ton allure habituelle les premières minutes. Avec l'expérience, cet écart diminue. Pour un premier triathlon, vise 20-30 secondes/km plus lent que ton allure 10km habituelle. Intègre des entraînements combinés vélo-course (briques) dans ta prépa." },
]

// ── Helpers ────────────────────────────────────────────────
function secFromHMS(h, m, s) {
  return (parseInt(h) || 0) * 3600 + (parseInt(m) || 0) * 60 + (parseInt(s) || 0)
}

function fmtTime(totalSec) {
  if (!totalSec) return '--'
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = Math.round(totalSec % 60)
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}'${String(s).padStart(2, '0')}'`
  return `${m}'${String(s).padStart(2, '0')}'`
}

function swimPace(distM, totalSec) {
  if (!distM || !totalSec || distM <= 0 || totalSec <= 0) return null
  const secPer100 = totalSec / (distM / 100)
  const min = Math.floor(secPer100 / 60)
  const sec = Math.round(secPer100 % 60)
  return `${min}'${String(sec).padStart(2, '0')}''/100m`
}

function bikeSpeed(distKm, totalSec) {
  if (!distKm || !totalSec || distKm <= 0 || totalSec <= 0) return null
  return (distKm / (totalSec / 3600)).toFixed(1)
}

function runPace(distKm, totalSec) {
  if (!distKm || !totalSec || distKm <= 0 || totalSec <= 0) return null
  const secPerKm = totalSec / distKm
  const min = Math.floor(secPerKm / 60)
  const sec = Math.round(secPerKm % 60)
  return `${min}'${String(sec).padStart(2, '0')}''/km`
}

// ── Shared styles ─────────────────────────────────────────
const inputSt = {
  background: '#fff', border: '1.5px solid rgba(139,47,201,.2)', borderRadius: 10,
  padding: '.55rem .85rem', fontSize: '1rem', color: C.dark, outline: 'none',
  width: 72, textAlign: 'center', fontVariantNumeric: 'tabular-nums',
}
const labelSt = {
  display: 'block', fontSize: '.72rem', fontWeight: 700, color: 'rgba(26,18,48,.4)',
  textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '.3rem',
}

function TimeInput({ label, h, m, s, setH, setM, setS }) {
  return (
    <div>
      <label style={labelSt}>{label}</label>
      <div style={{ display: 'flex', gap: '.4rem', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '.65rem', color: 'rgba(26,18,48,.35)', textAlign: 'center', marginBottom: '.15rem' }}>h</div>
          <input type="number" min="0" max="9" placeholder="0" value={h}
            onChange={e => setH(e.target.value)} style={inputSt} />
        </div>
        <span style={{ color: 'rgba(26,18,48,.3)', fontWeight: 700, marginTop: '1rem' }}>:</span>
        <div>
          <div style={{ fontSize: '.65rem', color: 'rgba(26,18,48,.35)', textAlign: 'center', marginBottom: '.15rem' }}>min</div>
          <input type="number" min="0" max="59" placeholder="00" value={m}
            onChange={e => setM(e.target.value)} style={inputSt} />
        </div>
        <span style={{ color: 'rgba(26,18,48,.3)', fontWeight: 700, marginTop: '1rem' }}>:</span>
        <div>
          <div style={{ fontSize: '.65rem', color: 'rgba(26,18,48,.35)', textAlign: 'center', marginBottom: '.15rem' }}>sec</div>
          <input type="number" min="0" max="59" placeholder="00" value={s}
            onChange={e => setS(e.target.value)} style={inputSt} />
        </div>
      </div>
    </div>
  )
}

function DistInput({ label, value, setValue, unit, placeholder }) {
  return (
    <div>
      <label style={labelSt}>{label}</label>
      <div style={{ display: 'flex', gap: '.4rem', alignItems: 'center' }}>
        <input type="number" min="0" step="any" placeholder={placeholder}
          value={value} onChange={e => setValue(e.target.value)}
          style={{ ...inputSt, width: 100 }} />
        <span style={{ color: 'rgba(26,18,48,.45)', fontSize: '.85rem' }}>{unit}</span>
      </div>
    </div>
  )
}

function Chip({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: '.35rem .85rem', borderRadius: 50, cursor: 'pointer', fontSize: '.82rem',
      border: `1px solid ${active ? 'transparent' : 'rgba(139,47,201,.25)'}`,
      background: active ? grad : 'transparent',
      color: active ? '#fff' : C.purple, fontWeight: active ? 700 : 400,
      transition: 'all .15s',
    }}>{children}</button>
  )
}

function ResultBadge({ label, value, unit, color = C.purple }) {
  if (!value) return null
  return (
    <div style={{
      padding: '.65rem 1.1rem', borderRadius: 12,
      background: `linear-gradient(135deg,${C.purple},${C.pink})`,
      color: '#fff', textAlign: 'center', minWidth: 120,
    }}>
      <div style={{ fontSize: '.68rem', opacity: .8, marginBottom: '.2rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</div>
      <div style={{ fontSize: '1.3rem', fontWeight: 900, lineHeight: 1 }}>{value}</div>
      {unit && <div style={{ fontSize: '.68rem', opacity: .75, marginTop: '.15rem' }}>{unit}</div>}
    </div>
  )
}

// ── SVG Illustrations ─────────────────────────────────────
function SwimIllustration() {
  return (
    <svg viewBox="0 0 80 60" width={80} height={60} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="12" r="7" fill="url(#tg)" opacity=".9"/>
      <path d="M22 30 Q32 22 40 28 Q48 34 58 26" stroke="url(#tg)" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M18 38 Q28 30 36 36 Q44 42 54 34 Q62 28 70 34" stroke="url(#tg)" strokeWidth="2" strokeLinecap="round" opacity=".6"/>
      <path d="M14 46 Q24 38 32 44 Q40 50 50 42 Q58 36 66 42" stroke="url(#tg)" strokeWidth="1.5" strokeLinecap="round" opacity=".35"/>
      <defs><linearGradient id="tg" x1="0" y1="0" x2="80" y2="60" gradientUnits="userSpaceOnUse"><stop stopColor="#8B2FC9"/><stop offset="1" stopColor="#E8237A"/></linearGradient></defs>
    </svg>
  )
}

function BikeIllustration() {
  return (
    <svg viewBox="0 0 80 60" width={80} height={60} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="42" r="13" stroke="url(#bg)" strokeWidth="2.5"/>
      <circle cx="60" cy="42" r="13" stroke="url(#bg)" strokeWidth="2.5"/>
      <path d="M20 42 L35 18 L60 42" stroke="url(#bg)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M35 18 L50 30" stroke="url(#bg)" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M50 30 L60 42" stroke="url(#bg)" strokeWidth="2" strokeLinecap="round" opacity=".6"/>
      <circle cx="35" cy="18" r="3" fill="url(#bg)"/>
      <path d="M30 14 L40 14" stroke="url(#bg)" strokeWidth="2.5" strokeLinecap="round"/>
      <defs><linearGradient id="bg" x1="0" y1="0" x2="80" y2="60" gradientUnits="userSpaceOnUse"><stop stopColor="#8B2FC9"/><stop offset="1" stopColor="#E8237A"/></linearGradient></defs>
    </svg>
  )
}

function RunIllustration() {
  return (
    <svg viewBox="0 0 80 60" width={80} height={60} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="46" cy="10" r="6" fill="url(#rg)"/>
      <path d="M46 16 L40 30 L30 42" stroke="url(#rg)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M40 30 L54 38 L58 50" stroke="url(#rg)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M40 22 L28 26" stroke="url(#rg)" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M42 26 L54 20" stroke="url(#rg)" strokeWidth="2" strokeLinecap="round" opacity=".7"/>
      <defs><linearGradient id="rg" x1="0" y1="0" x2="80" y2="60" gradientUnits="userSpaceOnUse"><stop stopColor="#8B2FC9"/><stop offset="1" stopColor="#E8237A"/></linearGradient></defs>
    </svg>
  )
}

// ── Main component ─────────────────────────────────────────
export default function Triathlon() {
  const navigate = useNavigate()
  const calcRef = useRef(null)

  // Swim
  const [swimDist, setSwimDist] = useState('')
  const [swimH, setSwimH] = useState('')
  const [swimM, setSwimM] = useState('')
  const [swimS, setSwimS] = useState('')

  // Bike
  const [bikeDist, setBikeDist] = useState('')
  const [bikeH, setBikeH] = useState('')
  const [bikeM, setBikeM] = useState('')
  const [bikeS, setBikeS] = useState('')

  // Run
  const [runDist, setRunDist] = useState('')
  const [runH, setRunH] = useState('')
  const [runM, setRunM] = useState('')
  const [runS, setRunS] = useState('')

  const [activePreset, setActivePreset] = useState(null)
  const [openFaq, setOpenFaq] = useState(null)

  function applyPreset(p) {
    setActivePreset(p.label)
    setSwimDist(String(p.swim))
    setBikeDist(String(p.bike))
    setRunDist(String(p.run))
  }

  const swimSec = secFromHMS(swimH, swimM, swimS)
  const bikeSec = secFromHMS(bikeH, bikeM, bikeS)
  const runSec  = secFromHMS(runH,  runM,  runS)

  const swimResult = swimPace(parseFloat(swimDist), swimSec)
  const bikeResult = bikeSpeed(parseFloat(bikeDist), bikeSec)
  const runResult  = runPace(parseFloat(runDist), runSec)

  const totalSec = (swimSec || 0) + (bikeSec || 0) + (runSec || 0)
  const hasAny = swimResult || bikeResult || runResult

  const handleCTA = () => navigate('/register')

  return (
    <div style={{ background: '#000', color: '#fff', overflowX: 'hidden' }}>
      <Nav />

      <PageHero
        badge="🏊 + 🚴 + 🏃 Triathlon"
        title={<>Calcule tes allures <span style={gradText}>triathlon</span></>}
        subtitle="Renseigne tes distances et tes temps cibles pour chaque discipline. Obtiens ton allure natation, ta vitesse vélo, ton allure course et ton temps total."
        backTo="/calculateur" backLabel="Calculateurs"
      >
        <button onClick={() => calcRef.current?.scrollIntoView({ behavior: 'smooth' })}
          style={{ padding:'1rem 2.5rem', borderRadius:50, border:'none', background:grad, color:'#fff', fontSize:'1.05rem', fontWeight:700, cursor:'pointer', boxShadow:'0 8px 32px rgba(232,35,122,.5)' }}>
          Calculer mes allures ↓
        </button>
      </PageHero>

      {/* ── CALCULATOR ────────────────────────────────────── */}
      <section ref={calcRef} style={{ background: C.light, padding: '5rem 1.5rem' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ display: 'inline-block', background: grad, borderRadius: 50, padding: '.3rem 1rem', fontSize: '.75rem', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '.85rem' }}>
              Calculateur triathlon
            </div>
            <h2 style={{ fontSize: 'clamp(1.5rem,3vw,2rem)', fontWeight: 900, color: C.dark, marginBottom: '.5rem' }}>
              Choisis ta <span style={gradText}>distance</span> ou saisis tes valeurs
            </h2>
            <p style={{ color: 'rgba(26,18,48,.5)', fontSize: '.95rem', margin: 0 }}>
              Applique un format prédéfini ou personnalise chaque discipline librement
            </p>
          </div>

          {/* Presets */}
          <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '2rem' }}>
            {PRESETS.map(p => (
              <Chip key={p.label} active={activePreset === p.label} onClick={() => applyPreset(p)}>
                {p.label}
              </Chip>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* ── NATATION ── */}
            <div style={{ background: '#fff', borderRadius: 20, padding: '2rem', boxShadow: '0 4px 24px rgba(139,47,201,.08)', border: '1px solid rgba(139,47,201,.1)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <SwimIllustration />
                  <div>
                    <p style={{ fontWeight: 800, color: C.dark, marginBottom: '.2rem', fontSize: '1.1rem' }}>🏊 Natation</p>
                    <p style={{ color: 'rgba(26,18,48,.45)', fontSize: '.85rem', margin: 0 }}>Allure calculée en min/100m</p>
                  </div>
                </div>
                {swimResult && <ResultBadge label="Allure" value={swimResult} />}
              </div>
              <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <DistInput label="Distance natation" value={swimDist} setValue={setSwimDist} unit="m" placeholder="1500" />
                <TimeInput label="Temps visé" h={swimH} m={swimM} s={swimS} setH={setSwimH} setM={setSwimM} setS={setSwimS} />
              </div>
              {swimResult && (
                <div style={{ marginTop: '1rem', padding: '.65rem 1rem', background: 'rgba(139,47,201,.06)', borderRadius: 10, fontSize: '.82rem', color: 'rgba(26,18,48,.55)' }}>
                  💡 Pour nager {swimDist}m en {fmtTime(swimSec)}, tu dois maintenir une allure de <strong style={{ color: C.purple }}>{swimResult}</strong>
                </div>
              )}
            </div>

            {/* ── VÉLO ── */}
            <div style={{ background: '#fff', borderRadius: 20, padding: '2rem', boxShadow: '0 4px 24px rgba(139,47,201,.08)', border: '1px solid rgba(139,47,201,.1)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <BikeIllustration />
                  <div>
                    <p style={{ fontWeight: 800, color: C.dark, marginBottom: '.2rem', fontSize: '1.1rem' }}>🚴 Vélo</p>
                    <p style={{ color: 'rgba(26,18,48,.45)', fontSize: '.85rem', margin: 0 }}>Vitesse calculée en km/h</p>
                  </div>
                </div>
                {bikeResult && <ResultBadge label="Vitesse" value={`${bikeResult} km/h`} />}
              </div>
              <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <DistInput label="Distance vélo" value={bikeDist} setValue={setBikeDist} unit="km" placeholder="40" />
                <TimeInput label="Temps visé" h={bikeH} m={bikeM} s={bikeS} setH={setBikeH} setM={setBikeM} setS={setBikeS} />
              </div>
              {bikeResult && (
                <div style={{ marginTop: '1rem', padding: '.65rem 1rem', background: 'rgba(139,47,201,.06)', borderRadius: 10, fontSize: '.82rem', color: 'rgba(26,18,48,.55)' }}>
                  💡 Pour parcourir {bikeDist}km en {fmtTime(bikeSec)}, tu dois rouler à <strong style={{ color: C.purple }}>{bikeResult} km/h</strong> de moyenne
                </div>
              )}
            </div>

            {/* ── COURSE ── */}
            <div style={{ background: '#fff', borderRadius: 20, padding: '2rem', boxShadow: '0 4px 24px rgba(139,47,201,.08)', border: '1px solid rgba(139,47,201,.1)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <RunIllustration />
                  <div>
                    <p style={{ fontWeight: 800, color: C.dark, marginBottom: '.2rem', fontSize: '1.1rem' }}>🏃 Course à pied</p>
                    <p style={{ color: 'rgba(26,18,48,.45)', fontSize: '.85rem', margin: 0 }}>Allure calculée en min/km</p>
                  </div>
                </div>
                {runResult && <ResultBadge label="Allure" value={runResult} />}
              </div>
              <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <DistInput label="Distance course" value={runDist} setValue={setRunDist} unit="km" placeholder="10" />
                <TimeInput label="Temps visé" h={runH} m={runM} s={runS} setH={setRunH} setM={setRunM} setS={setRunS} />
              </div>
              {runResult && (
                <div style={{ marginTop: '1rem', padding: '.65rem 1rem', background: 'rgba(139,47,201,.06)', borderRadius: 10, fontSize: '.82rem', color: 'rgba(26,18,48,.55)' }}>
                  💡 Pour courir {runDist}km en {fmtTime(runSec)}, tu dois maintenir <strong style={{ color: C.purple }}>{runResult}</strong>
                </div>
              )}
            </div>
          </div>

          {/* ── TOTAL ── */}
          {hasAny && totalSec > 0 && (
            <div style={{ marginTop: '2rem', background: '#fff', borderRadius: 20, padding: '2rem', boxShadow: '0 8px 40px rgba(139,47,201,.14)', border: `2px solid rgba(139,47,201,.2)` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '.72rem', color: 'rgba(26,18,48,.4)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.3rem' }}>
                    Temps total estimé
                  </p>
                  <p style={{ margin: 0, fontSize: '2.8rem', fontWeight: 900, background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1 }}>
                    {fmtTime(totalSec)}
                  </p>
                  <p style={{ margin: '.4rem 0 0', fontSize: '.8rem', color: 'rgba(26,18,48,.4)', fontStyle: 'italic' }}>
                    ⚠️ Hors transitions T1 et T2
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
                  {swimResult && (
                    <div style={{ textAlign: 'center', padding: '.75rem 1rem', background: 'rgba(139,47,201,.06)', borderRadius: 12 }}>
                      <div style={{ fontSize: '.65rem', color: 'rgba(26,18,48,.4)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.25rem' }}>Nage</div>
                      <div style={{ fontWeight: 800, color: C.purple, fontSize: '.9rem' }}>{swimResult}</div>
                    </div>
                  )}
                  {bikeResult && (
                    <div style={{ textAlign: 'center', padding: '.75rem 1rem', background: 'rgba(139,47,201,.06)', borderRadius: 12 }}>
                      <div style={{ fontSize: '.65rem', color: 'rgba(26,18,48,.4)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.25rem' }}>Vélo</div>
                      <div style={{ fontWeight: 800, color: C.purple, fontSize: '.9rem' }}>{bikeResult} km/h</div>
                    </div>
                  )}
                  {runResult && (
                    <div style={{ textAlign: 'center', padding: '.75rem 1rem', background: 'rgba(139,47,201,.06)', borderRadius: 12 }}>
                      <div style={{ fontSize: '.65rem', color: 'rgba(26,18,48,.4)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.25rem' }}>Course</div>
                      <div style={{ fontWeight: 800, color: C.purple, fontSize: '.9rem' }}>{runResult}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── EXPLICATIONS ──────────────────────────────────── */}
      <section style={{ background: '#0a0a0a', padding: '5rem 1.5rem', borderTop: '1px solid rgba(255,255,255,.06)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={{ fontSize: 'clamp(1.6rem,4vw,2.4rem)', fontWeight: 900, marginBottom: '.5rem' }}>
              Comment lire tes{' '}
              <span style={{ background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>allures ?</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,.4)', fontSize: '1rem' }}>
              Chaque discipline a son unité de mesure. Voici comment les interpréter.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
            {[
              {
                icon: <SwimIllustration />,
                disc: 'Natation',
                unit: 'min/100m',
                color: '#60A5FA',
                desc: "En natation, on mesure le temps pour parcourir 100 mètres. Une allure de 2'00\"/100m est un bon niveau pour un triathlète. Les débutants tournent souvent autour de 2'30\"-3'00\"/100m.",
                refs: [
                  { label: 'Débutant', value: "3'00\"/100m" },
                  { label: 'Intermédiaire', value: "2'15\"/100m" },
                  { label: 'Avancé', value: "1'35\"/100m" },
                ],
              },
              {
                icon: <BikeIllustration />,
                disc: 'Vélo',
                unit: 'km/h',
                color: '#34D399',
                desc: "Le vélo se mesure en vitesse moyenne (km/h). En triathlon, la vitesse dépend aussi du vent, du dénivelé et du matériel. Un triathlète amateur tourne entre 28 et 35 km/h sur un parcours plat.",
                refs: [
                  { label: 'Débutant', value: '25 km/h' },
                  { label: 'Intermédiaire', value: '32 km/h' },
                  { label: 'Avancé', value: '40+ km/h' },
                ],
              },
              {
                icon: <RunIllustration />,
                disc: 'Course à pied',
                unit: 'min/km',
                color: '#F472B6',
                desc: "La course se mesure en allure (min/km). Attention : après le vélo, tes jambes sont fatiguées. Prévois 10 à 30 secondes par kilomètre de plus que ton allure habituelle en course sèche.",
                refs: [
                  { label: 'Débutant', value: "6'30\"/km" },
                  { label: 'Intermédiaire', value: "5'00\"/km" },
                  { label: 'Avancé', value: "4'00\"/km" },
                ],
              },
            ].map(d => (
              <div key={d.disc} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 20, padding: '2rem' }}>
                <div style={{ marginBottom: '1rem' }}>{d.icon}</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', marginBottom: '.25rem' }}>{d.disc}</h3>
                <div style={{ display: 'inline-block', background: 'rgba(255,255,255,.06)', borderRadius: 6, padding: '.15rem .55rem', fontSize: '.72rem', fontWeight: 700, color: d.color, marginBottom: '.85rem' }}>{d.unit}</div>
                <p style={{ fontSize: '.875rem', color: 'rgba(255,255,255,.5)', lineHeight: 1.7, marginBottom: '1.25rem', textAlign: 'justify' }}>{d.desc}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                  {d.refs.map(r => (
                    <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '.4rem .75rem', background: 'rgba(255,255,255,.03)', borderRadius: 8 }}>
                      <span style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.4)' }}>{r.label}</span>
                      <span style={{ fontSize: '.82rem', fontWeight: 700, color: d.color }}>{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Note transitions */}
          <div style={{ marginTop: '2.5rem', background: 'rgba(232,35,122,.07)', border: '1px solid rgba(232,35,122,.2)', borderRadius: 16, padding: '1.5rem 2rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>⏱️</div>
            <div>
              <p style={{ fontWeight: 700, color: '#fff', marginBottom: '.35rem' }}>Les transitions : ne les oublie pas !</p>
              <p style={{ fontSize: '.875rem', color: 'rgba(255,255,255,.5)', lineHeight: 1.7, margin: 0, textAlign: 'justify' }}>
                Ce calculateur affiche la somme des trois temps de discipline <strong style={{ color: '#fff' }}>sans les transitions</strong>. En compétition, ajoute <strong style={{ color: '#fff' }}>T1</strong> (sortie eau → vélo) et <strong style={{ color: '#fff' }}>T2</strong> (vélo → course) à ton temps total. Comptez environ 2 à 5 minutes par transition pour un triathlète amateur.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────── */}
      <section style={{ background: '#000', padding: '5rem 1.5rem', borderTop: '1px solid rgba(255,255,255,.06)' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(1.6rem,4vw,2.2rem)', fontWeight: 900, textAlign: 'center', marginBottom: '3rem' }}>
            Questions <span style={{ background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>fréquentes</span>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            {FAQ.map((f, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,.04)', border: `1px solid ${openFaq === i ? 'rgba(139,47,201,.4)' : 'rgba(255,255,255,.08)'}`, borderRadius: 14, overflow: 'hidden', transition: 'border-color .2s' }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: '100%', textAlign: 'left', padding: '1.1rem 1.4rem', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '.95rem', lineHeight: 1.4 }}>{f.q}</span>
                  <span style={{ color: C.purple, fontSize: '1.2rem', flexShrink: 0, transform: openFaq === i ? 'rotate(45deg)' : 'none', transition: 'transform .2s' }}>+</span>
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 1.4rem 1.25rem', color: 'rgba(255,255,255,.55)', fontSize: '.9rem', lineHeight: 1.7, textAlign: 'justify' }}>{f.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <PricingCTA
        title={<>Un coach pour <span style={{ background:'linear-gradient(135deg,#8B2FC9,#E8237A)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', display:'inline' }}>aller plus loin</span></>}
        subtitle="Un plan structuré, un suivi des charges et des adaptations hebdomadaires pour progresser vraiment."
      />

      <SiteFooter />
    </div>
  )
}
