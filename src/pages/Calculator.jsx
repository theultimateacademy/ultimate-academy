import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Nav from '../components/Nav'
import SiteFooter from '../components/SiteFooter'
import { TESTIMONIALS_CALCULATOR, FUEL_PLAN } from '../lib/toolsContent'
import TestimonialsCarousel from '../components/TestimonialsCarousel'

// ── Helpers ─────────────────────────────────────────────────
const DISTANCES = [
  { label: '5 km',     km: 5,       key: '5k' },
  { label: '10 km',    km: 10,      key: '10k' },
  { label: 'Semi',     km: 21.0975, key: 'semi' },
  { label: 'Marathon', km: 42.195,  key: 'marathon' },
]
const FREQS = [
  { label: 'Tous les 1 km',         key: '1km' },
  { label: 'Tous les 5 km',         key: '5km' },
  { label: 'Points clés seulement', key: 'keys' },
]
const FAQ = [
  { q: "C'est quoi un temps de passage ?",
    a: "Un temps de passage est le chrono cumulé que tu dois afficher à chaque borne kilométrique pour atteindre ton objectif final. Par exemple, pour finir un 10km en 45min à allure régulière, tu dois passer à 5km en 22'30\". Ces repères te permettent de contrôler ton effort en temps réel sans montre GPS sophistiquée." },
  { q: "Faut-il partir plus vite ou plus lentement ?",
    a: "La science du running est claire : le négatif split (départ légèrement plus lent, arrivée plus rapide) donne systématiquement de meilleures performances que le positif split. Partir 2 à 3% plus lentement en première moitié permet de conserver le glycogène et d'accélérer sur la fin. Les meilleurs marathoniens du monde utilisent presque tous cette stratégie." },
  { q: "Comment utiliser ses temps de passage en course ?",
    a: "Note tes temps clés sur un bracelet ou mémorise 2-3 points stratégiques (mi-course, 3/4). En course, compare ton chrono réel à chaque borne avec le temps prévu. Si tu es en avance, ralentis légèrement. Si tu es en retard, ne t'affole pas : maintiens ton allure cible et récupère progressivement. La panique en milieu de course est l'erreur numéro 1." },
  { q: "Quelle allure pour un 10km en 45min ?",
    a: "Pour finir un 10km en 45min, tu dois maintenir une allure de 4'30\"/km, soit 13,3 km/h. En négatif split : 4'38\"/km sur les 5 premiers km, 4'22\"/km sur les 5 derniers. Cette allure correspond à environ 92% de ta VMA, ce qui suppose une VMA de 14,5 km/h minimum. À l'entraînement, travaille tes séances de seuil à 4'30\"-4'40\"/km." },
  { q: "Quelle allure pour un marathon en 4h ?",
    a: "Un marathon en 4h nécessite une allure de 5'41\"/km sur les 42,195km, soit 10,5 km/h. En négatif split : 5'50\"/km les 21 premiers km, 5'33\"/km les 21 derniers. Cette allure représente environ 80% de ta VMA (VMA cible ~13 km/h). La clé : tenir cette allure régulière et gérer l'alimentation dès le 15ème kilomètre." },
  { q: "Comment ne pas partir trop vite ?",
    a: "Le sentiment d'effort en début de course est trompeur : l'adrénaline et la fraîcheur musculaire font paraître une allure trop rapide comme normale. Trois stratégies : 1) imprime tes temps de passage sur un bracelet et contrôle aux bornes, 2) cours les 2 premiers km 10\" plus lentement que ton allure cible, 3) laisse passer les premiers coureurs euphoriques et trouve ton rythme au 3ème km." },
]

function fmtHMS(s) {
  s = Math.round(Math.max(0, s))
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  return `${m}:${String(sec).padStart(2,'0')}`
}
function fmtPace(s) {
  if (!s || s <= 0) return '—'
  s = Math.round(s)
  return `${Math.floor(s/60)}'${String(s%60).padStart(2,'0')}"`
}
function getSplits(distKm, freq) {
  const pts = []
  if (freq === '1km') { for (let k = 1; k <= distKm - .001; k++) pts.push(k); pts.push(distKm) }
  else if (freq === '5km') { for (let k = 5; k <= distKm - .01; k += 5) pts.push(k); pts.push(distKm) }
  else {
    const isM = Math.abs(distKm-42.195)<.5, isS = Math.abs(distKm-21.0975)<.5
    const is10 = Math.abs(distKm-10)<.1, is5 = Math.abs(distKm-5)<.1
    if (is5) [1,2,3,4,5].forEach(k=>pts.push(k))
    else if (is10) [5,10].forEach(k=>pts.push(k))
    else if (isS) [5,10,15,20,21.0975].forEach(k=>pts.push(k))
    else if (isM) [10,21.0975,30,35,40,42.195].forEach(k=>pts.push(k))
    else { if (distKm<=5) for (let k=1;k<=distKm-.001;k++) pts.push(k); else for (let k=5;k<=distKm-.01;k+=5) pts.push(k); pts.push(distKm) }
  }
  const seen = new Set()
  return pts.filter(k=>{const r=Math.round(k*100);return seen.has(r)?false:seen.add(r)}).sort((a,b)=>a-b)
}
function kmLabel(km, distKm) {
  if (Math.abs(km-distKm)<.01) {
    if (Math.abs(distKm-42.195)<.1) return 'Arrivée 42,195 km'
    if (Math.abs(distKm-21.0975)<.1) return 'Arrivée 21,1 km'
    return `Arrivée ${Number.isInteger(distKm)?distKm:distKm.toFixed(1)} km`
  }
  if (Math.abs(km-21.0975)<.01) return '21,1 km · ½ marathon'
  return `${Number.isInteger(km)?km:km.toFixed(1)} km`
}
function parsePaceStr(str) {
  if (!str?.trim()) return null
  const s = str.trim().replace(/['"″]/g,'').replace(',','.')
  const [a,b] = s.split(':')
  const min = parseFloat(a), sec = parseFloat(b??'0')
  if (isNaN(min)||min<0) return null
  const t = min*60+(isNaN(sec)?0:sec)
  return t>0&&t<2400?t:null
}
function getSplitTime(km, avgPace, distKm, negSplit) {
  if (!negSplit) return avgPace * km
  const half = distKm / 2
  const p1 = avgPace * 1.03, p2 = avgPace * 0.97
  return km <= half ? p1*km : p1*half + p2*(km-half)
}

// ── Shared atoms (light bg) ────────────────────────────────
const C = { purple:'#8B2FC9', pink:'#E8237A', dark:'#1a1230', light:'#F8F5FF' }
const inputSt = { background:'#fff', border:'1px solid rgba(139,47,201,.25)', borderRadius:10, padding:'.55rem .75rem', color:C.dark, fontSize:'.9rem', outline:'none', width:80 }
const labelSt = { display:'block', fontSize:'.72rem', color:'rgba(26,18,48,.45)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:'.4rem' }

function Chip({ active, onClick, children, small }) {
  return <button onClick={onClick} style={{ padding:small?'.28rem .65rem':'.42rem .95rem', borderRadius:50, cursor:'pointer', fontSize:small?'.78rem':'.84rem', border:`1px solid ${active?'transparent':'rgba(139,47,201,.25)'}`, background:active?`linear-gradient(135deg,${C.purple},${C.pink})`:'#fff', color:active?'#fff':C.purple, fontWeight:active?600:400, transition:'all .15s', whiteSpace:'nowrap' }}>{children}</button>
}
function TimeInput({ label, value, onChange, max }) {
  return <div><label style={labelSt}>{label}</label><input type="number" min="0" max={max} value={value} onChange={e=>onChange(e.target.value)} placeholder="00" style={inputSt}/></div>
}
function Stars({ n }) {
  return <div style={{ color:'#F59E0B', fontSize:'1rem', marginBottom:'.5rem' }}>{'★'.repeat(n)}</div>
}
function Section({ bg='#fff', pad='5rem 1.5rem', children, id }) {
  return <section id={id} style={{ background:bg, padding:pad }}>{children}</section>
}
function Inner({ max=1000, children, style }) {
  return <div style={{ maxWidth:max, margin:'0 auto', ...style }}>{children}</div>
}
function SectionTag({ children }) {
  return <p style={{ fontSize:'.75rem', letterSpacing:'.18em', textTransform:'uppercase', color:C.purple, marginBottom:'.75rem', fontWeight:600 }}>{children}</p>
}
function H2Light({ children }) {
  return <h2 style={{ fontSize:'clamp(1.6rem,3.5vw,2.4rem)', fontWeight:900, color:C.dark, lineHeight:1.15, marginBottom:'1.25rem' }}>{children}</h2>
}
function H2Dark({ children }) {
  return <h2 style={{ fontSize:'clamp(1.6rem,3.5vw,2.4rem)', fontWeight:900, color:'#fff', lineHeight:1.15, marginBottom:'1.25rem' }}>{children}</h2>
}

export default function Calculator() {
  const { user, isCoach } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const calcRef = useRef()

  const [distKey,  setDistKey]  = useState('marathon')
  const [customKm, setCustomKm] = useState('')
  const [hours,    setHours]    = useState('')
  const [minutes,  setMinutes]  = useState('')
  const [seconds,  setSeconds]  = useState('')
  const [freq,     setFreq]     = useState('1km')
  const [negSplit, setNegSplit] = useState(false)
  const [copied,   setCopied]   = useState(false)
  const [fuelDist, setFuelDist] = useState('semi')
  const [invPace,  setInvPace]  = useState('')
  const [invDist,  setInvDist]  = useState('marathon')
  const [openFaq,  setOpenFaq]  = useState(null)

  useEffect(() => {
    const prev = document.title
    document.title = 'Calculateur temps de passage 10km, semi, marathon | The Ultimate Academy'
    const meta = document.querySelector('meta[name="description"]')
    const prevM = meta?.content
    if (meta) meta.content = 'Calcule tes temps de passage gratuitement pour ton 10km, semi-marathon ou marathon. Outil créé par Alexis, coach running certifié.'
    if (location.state?.vma) {
      const vma = location.state.vma
      const paceS = 3600 / (vma * 0.80)
      const total = Math.round(paceS * 42.195)
      setDistKey('marathon')
      setHours(String(Math.floor(total/3600)))
      setMinutes(String(Math.floor((total%3600)/60)))
      setSeconds(String(total%60))
    }
    return () => { document.title = prev; if (meta&&prevM!=null) meta.content = prevM }
  }, [])

  const distKm = distKey==='custom' ? (parseFloat(customKm)||0) : (DISTANCES.find(d=>d.key===distKey)?.km??0)
  const totalSecs = (parseInt(hours)||0)*3600+(parseInt(minutes)||0)*60+(parseInt(seconds)||0)
  const avgPace = distKm>0&&totalSecs>0 ? totalSecs/distKm : 0
  const splits = distKm>0&&totalSecs>0 ? getSplits(distKm,freq) : []
  const invPaceSecs = parsePaceStr(invPace)
  const invDistKm = DISTANCES.find(d=>d.key===invDist)?.km??0
  const invTotal = invPaceSecs&&invDistKm>0 ? invPaceSecs*invDistKm : null
  const fuel = FUEL_PLAN[fuelDist]

  function copyResults() {
    const lines = splits.map(km=>`${kmLabel(km,distKm).padEnd(28)} ${fmtHMS(getSplitTime(km,avgPace,distKm,negSplit)).padEnd(10)} ${fmtPace(avgPace)}`)
    navigator.clipboard.writeText(`Temps de passage\nAllure: ${fmtPace(avgPace)}/km\n\n`+lines.join('\n'))
    setCopied(true); setTimeout(()=>setCopied(false),2500)
  }

  const handleCTA = () => navigate(user?(isCoach?'/admin':'/app/home'):'/register')

  return (
    <div style={{ background:'#000', color:'#fff', overflowX:'hidden' }}>
      <Nav />

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section style={{ position:'relative', minHeight:'100vh', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', textAlign:'center', background:'linear-gradient(135deg,#0C0A18 0%,#12102a 50%,#1a0d30 100%)', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'-20%', left:'-10%', width:'60vw', height:'60vw', maxWidth:700, maxHeight:700, borderRadius:'50%', background:'radial-gradient(circle,rgba(139,47,201,.22) 0%,transparent 70%)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:'-10%', right:'-8%', width:'50vw', height:'50vw', maxWidth:600, maxHeight:600, borderRadius:'50%', background:'radial-gradient(circle,rgba(232,35,122,.18) 0%,transparent 70%)', pointerEvents:'none' }}/>
        <div style={{ position:'relative', zIndex:1, padding:'8rem 1.5rem 4rem', maxWidth:760 }}>
          <h1 style={{ fontSize:'clamp(2.2rem,6vw,4rem)', fontWeight:900, lineHeight:1.05, marginBottom:'1.25rem' }}>
            Calcule tes <span style={{ background:'linear-gradient(135deg,#8B2FC9,#E8237A)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', display:'inline' }}>temps de passage</span>
          </h1>
          <p style={{ fontSize:'clamp(1rem,2.5vw,1.25rem)', color:'rgba(255,255,255,.75)', maxWidth:540, margin:'0 auto 2.5rem', lineHeight:1.6 }}>
            Renseigne ton chrono visé, je calcule tes repères du 5 km au marathon, stratégie négatif split incluse
          </p>
          <button onClick={()=>calcRef.current?.scrollIntoView({behavior:'smooth'})} style={{ padding:'1rem 2.5rem', borderRadius:50, border:'none', background:`linear-gradient(135deg,${C.purple},${C.pink})`, color:'#fff', fontSize:'1.05rem', fontWeight:700, cursor:'pointer', boxShadow:'0 8px 32px rgba(232,35,122,.5)' }}>
            Voir le calculateur ↓
          </button>
        </div>
        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${C.purple},${C.pink})` }}/>
      </section>

      {/* ── CALCULATOR ─────────────────────────────────────────── */}
      <section ref={calcRef} id="outil" style={{ background:C.light, padding:'5rem 1.5rem' }}>
        <Inner max={780}>
          <div style={{ textAlign:'center', marginBottom:'2.5rem' }}>
            <SectionTag>Calculateur interactif</SectionTag>
            <h2 style={{ fontSize:'clamp(1.5rem,3vw,2rem)', fontWeight:900, color:C.dark, marginBottom:'.5rem' }}>Tes temps de passage en temps réel</h2>
            <p style={{ color:'rgba(26,18,48,.55)', fontSize:'.95rem' }}>Résultats instantanés, aucune inscription requise</p>
          </div>
          <div style={{ background:'#fff', borderRadius:20, padding:'2rem', boxShadow:'0 8px 40px rgba(139,47,201,.1)', border:'1px solid rgba(139,47,201,.12)' }}>

            {/* Step 1 */}
            <div style={{ marginBottom:'1.75rem' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'.6rem', marginBottom:'.85rem' }}>
                <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:24, height:24, borderRadius:'50%', background:`linear-gradient(135deg,${C.purple},${C.pink})`, fontSize:'.72rem', fontWeight:800, color:'#fff' }}>1</span>
                <span style={{ fontWeight:700, color:C.dark, fontSize:'.95rem' }}>Choisis ta distance</span>
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'.5rem', marginBottom:distKey==='custom'?'.75rem':0 }}>
                {DISTANCES.map(d=><Chip key={d.key} active={distKey===d.key} onClick={()=>setDistKey(d.key)}>{d.label}</Chip>)}
                <Chip active={distKey==='custom'} onClick={()=>setDistKey('custom')}>Distance perso</Chip>
              </div>
              {distKey==='custom'&&<div style={{ display:'flex', alignItems:'center', gap:'.6rem', marginTop:'.75rem' }}><input type="number" min=".1" step=".1" value={customKm} onChange={e=>setCustomKm(e.target.value)} placeholder="Ex : 30" style={{ ...inputSt, width:110 }}/><span style={{ color:'rgba(26,18,48,.5)', fontSize:'.9rem' }}>km</span></div>}
            </div>

            {/* Step 2 */}
            <div style={{ marginBottom:'1.75rem' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'.6rem', marginBottom:'.85rem' }}>
                <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:24, height:24, borderRadius:'50%', background:`linear-gradient(135deg,${C.purple},${C.pink})`, fontSize:'.72rem', fontWeight:800, color:'#fff' }}>2</span>
                <span style={{ fontWeight:700, color:C.dark, fontSize:'.95rem' }}>Ton chrono objectif</span>
              </div>
              <div style={{ display:'flex', gap:'.75rem', flexWrap:'wrap' }}>
                <TimeInput label="Heures"   value={hours}   onChange={setHours}   max={9}/>
                <TimeInput label="Minutes"  value={minutes} onChange={setMinutes} max={59}/>
                <TimeInput label="Secondes" value={seconds} onChange={setSeconds} max={59}/>
              </div>
            </div>

            {/* Step 3 */}
            <div style={{ marginBottom:'1.75rem' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'.6rem', marginBottom:'.85rem' }}>
                <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:24, height:24, borderRadius:'50%', background:`linear-gradient(135deg,${C.purple},${C.pink})`, fontSize:'.72rem', fontWeight:800, color:'#fff' }}>3</span>
                <span style={{ fontWeight:700, color:C.dark, fontSize:'.95rem' }}>Fréquence des passages</span>
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'.5rem', marginBottom:'1rem' }}>
                {FREQS.map(f=><Chip key={f.key} active={freq===f.key} onClick={()=>setFreq(f.key)}>{f.label}</Chip>)}
              </div>
              <label style={{ display:'flex', alignItems:'center', gap:'.6rem', cursor:'pointer' }}>
                <input type="checkbox" checked={negSplit} onChange={e=>setNegSplit(e.target.checked)} style={{ accentColor:C.purple, width:16, height:16 }}/>
                <span style={{ fontSize:'.875rem', color:'rgba(26,18,48,.7)' }}>Stratégie négatif split : départ 3% plus lent, arrivée 3% plus rapide</span>
              </label>
            </div>

            {/* Results */}
            {splits.length>0 ? (
              <>
                {negSplit&&<div style={{ padding:'.6rem 1rem', borderRadius:8, background:'rgba(139,47,201,.08)', border:'1px solid rgba(139,47,201,.2)', marginBottom:'1rem', fontSize:'.82rem', color:C.purple }}>Stratégie négatif split activée · 1ère moitié : {fmtPace(avgPace*1.03)}/km · 2ème moitié : {fmtPace(avgPace*0.97)}/km</div>}
                <div style={{ overflowX:'auto', borderRadius:12, border:'1px solid rgba(139,47,201,.12)' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'.875rem' }}>
                    <thead><tr style={{ background:'rgba(139,47,201,.06)' }}>
                      {['Kilomètre','Temps de passage','Allure'].map(h=><th key={h} style={{ padding:'.65rem .85rem', textAlign:'left', color:'rgba(26,18,48,.4)', fontWeight:500, fontSize:'.72rem', textTransform:'uppercase', letterSpacing:'.08em' }}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {splits.map((km,i)=>{
                        const isFinish = Math.abs(km-distKm)<.01
                        const isHalf = Math.abs(km-21.0975)<.01
                        const t = getSplitTime(km,avgPace,distKm,negSplit)
                        const pace = negSplit ? (km<=(distKm/2)?avgPace*1.03:avgPace*0.97) : avgPace
                        return <tr key={i} style={{ borderTop:'1px solid rgba(139,47,201,.07)', background:isFinish?'rgba(139,47,201,.07)':isHalf?'rgba(139,47,201,.03)':'transparent' }}>
                          <td style={{ padding:'.6rem .85rem', color:isFinish?C.purple:C.dark, fontWeight:isFinish?700:400 }}>{kmLabel(km,distKm)}</td>
                          <td style={{ padding:'.6rem .85rem', color:isFinish?C.purple:C.dark, fontWeight:isFinish?700:400, fontVariantNumeric:'tabular-nums' }}>{fmtHMS(t)}</td>
                          <td style={{ padding:'.6rem .85rem', color:'rgba(26,18,48,.45)', fontVariantNumeric:'tabular-nums' }}>{fmtPace(pace)}/km</td>
                        </tr>
                      })}
                    </tbody>
                  </table>
                </div>
                <div style={{ marginTop:'1.25rem', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'.75rem' }}>
                  <p style={{ margin:0, fontSize:'.88rem', color:'rgba(26,18,48,.6)' }}>Allure moyenne : <strong style={{ color:C.purple, fontVariantNumeric:'tabular-nums' }}>{fmtPace(avgPace)}/km</strong></p>
                  <button onClick={copyResults} style={{ padding:'.4rem 1rem', borderRadius:8, cursor:'pointer', fontSize:'.82rem', border:`1px solid ${copied?C.purple:'rgba(139,47,201,.2)'}`, background:copied?'rgba(139,47,201,.08)':'transparent', color:copied?C.purple:'rgba(26,18,48,.5)', transition:'all .2s' }}>{copied?'✓ Copié !':'Copier les temps de passage'}</button>
                </div>
              </>
            ):(
              <div style={{ padding:'2.5rem', textAlign:'center', borderRadius:12, background:'rgba(139,47,201,.04)', border:'1px dashed rgba(139,47,201,.15)' }}>
                <p style={{ color:'rgba(26,18,48,.35)', margin:0, fontSize:'.9rem' }}>Entre ton chrono objectif pour voir tes temps de passage</p>
              </div>
            )}

            {/* Inverse */}
            <div style={{ marginTop:'2rem', paddingTop:'2rem', borderTop:'1px solid rgba(139,47,201,.1)' }}>
              <p style={{ fontWeight:700, color:C.dark, marginBottom:'1rem' }}>Tu connais ton allure ? → Calcule ton chrono</p>
              <div style={{ display:'flex', gap:'1rem', flexWrap:'wrap', alignItems:'flex-end' }}>
                <div><label style={labelSt}>Allure (min/km)</label><div style={{ display:'flex', alignItems:'center', gap:'.4rem' }}><input type="text" placeholder="4:30" value={invPace} onChange={e=>setInvPace(e.target.value)} style={{ ...inputSt, width:90 }}/><span style={{ color:'rgba(26,18,48,.4)', fontSize:'.82rem' }}>min/km</span></div></div>
                <div><label style={labelSt}>Distance</label><div style={{ display:'flex', gap:'.4rem', flexWrap:'wrap' }}>{DISTANCES.map(d=><Chip key={d.key} active={invDist===d.key} onClick={()=>setInvDist(d.key)} small>{d.label}</Chip>)}</div></div>
                {invTotal&&<div style={{ padding:'.65rem 1.25rem', borderRadius:10, background:`linear-gradient(135deg,${C.purple},${C.pink})`, color:'#fff' }}><p style={{ margin:0, fontSize:'.75rem', opacity:.8 }}>Chrono estimé</p><p style={{ margin:0, fontSize:'1.4rem', fontWeight:900, fontVariantNumeric:'tabular-nums' }}>{fmtHMS(invTotal)}</p></div>}
              </div>
            </div>
          </div>
        </Inner>
      </section>

      {/* ── COMMENT ÇA FONCTIONNE ──────────────────────────────── */}
      <Section>
        <Inner>
          <div style={{ display:'flex', gap:'3rem', alignItems:'center', flexWrap:'wrap' }}>
            <div style={{ flex:'1 1 380px', borderRadius:20, overflow:'hidden', maxHeight:440 }}>
              <svg viewBox="0 0 440 300" style={{width:'100%',height:'100%',display:'block',minHeight:280}}>
                <defs>
                  <linearGradient id="cg1" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#8B2FC9"/>
                    <stop offset="100%" stopColor="#E8237A"/>
                  </linearGradient>
                </defs>
                <rect width="440" height="300" fill="#EDE8F7"/>
                <rect x="70" y="22" width="300" height="242" rx="16" fill="white" style={{filter:'drop-shadow(0 6px 18px rgba(139,47,201,.15))'}}/>
                <rect x="70" y="22" width="300" height="46" rx="16" fill="url(#cg1)"/>
                <rect x="70" y="52" width="300" height="16" fill="url(#cg1)"/>
                <text x="220" y="50" textAnchor="middle" fontSize="12" fill="white" fontWeight="700" fontFamily="system-ui,sans-serif">MARATHON · OBJECTIF 4:00:00</text>
                <line x1="90" y1="86" x2="350" y2="86" stroke="rgba(139,47,201,.08)" strokeWidth="1"/>
                <text x="95" y="104" fontSize="11" fill="rgba(26,18,48,.42)" fontFamily="system-ui,sans-serif">10 km</text>
                <text x="345" y="104" textAnchor="end" fontSize="12" fill="#1a1230" fontWeight="600" fontFamily="system-ui,sans-serif">56:50</text>
                <line x1="90" y1="113" x2="350" y2="113" stroke="rgba(139,47,201,.08)" strokeWidth="1"/>
                <text x="95" y="131" fontSize="11" fill="rgba(26,18,48,.42)" fontFamily="system-ui,sans-serif">21,1 km · Mi-course</text>
                <text x="345" y="131" textAnchor="end" fontSize="12" fill="#1a1230" fontWeight="600" fontFamily="system-ui,sans-serif">2:00:09</text>
                <line x1="90" y1="140" x2="350" y2="140" stroke="rgba(139,47,201,.08)" strokeWidth="1"/>
                <text x="95" y="158" fontSize="11" fill="rgba(26,18,48,.42)" fontFamily="system-ui,sans-serif">30 km</text>
                <text x="345" y="158" textAnchor="end" fontSize="12" fill="#1a1230" fontWeight="600" fontFamily="system-ui,sans-serif">2:50:30</text>
                <line x1="90" y1="167" x2="350" y2="167" stroke="rgba(139,47,201,.08)" strokeWidth="1"/>
                <text x="95" y="185" fontSize="11" fill="rgba(26,18,48,.42)" fontFamily="system-ui,sans-serif">40 km</text>
                <text x="345" y="185" textAnchor="end" fontSize="12" fill="#1a1230" fontWeight="600" fontFamily="system-ui,sans-serif">3:46:40</text>
                <line x1="90" y1="194" x2="350" y2="194" stroke="rgba(139,47,201,.08)" strokeWidth="1"/>
                <rect x="80" y="202" width="280" height="32" rx="8" fill="rgba(139,47,201,.09)"/>
                <text x="95" y="222" fontSize="11" fill="#8B2FC9" fontWeight="700" fontFamily="system-ui,sans-serif">Arrivée 42,2 km 🏁</text>
                <text x="345" y="222" textAnchor="end" fontSize="13" fill="#8B2FC9" fontWeight="900" fontFamily="system-ui,sans-serif">4:00:00</text>
                <text x="220" y="282" textAnchor="middle" fontSize="10" fill="rgba(26,18,48,.28)" fontFamily="system-ui,sans-serif">Allure 5′41″/km · Négatif split activé</text>
              </svg>
            </div>
            <div style={{ flex:'1 1 300px' }}>
              <SectionTag>Comment ça fonctionne ?</SectionTag>
              <H2Light>La stratégie qui fait la différence le jour J</H2Light>
              <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem', marginBottom:'2rem' }}>
                {[
                  { n:'🎯', t:'Définis ton objectif', d:"Entre ta distance et ton chrono cible. Le calculateur convertit immédiatement en allure et en temps de passage kilomètre par kilomètre." },
                  { n:'📊', t:'Visualise ta course', d:"Obtiens un tableau complet de tes repères. Active le négatif split pour une stratégie scientifiquement prouvée : partir légèrement plus lent pour finir plus fort." },
                  { n:'🏃', t:'Exécute en confiance', d:"Le jour de course, coche chaque borne avec ton tableau de bord. Plus de décision à prendre à chaud : tu suis juste ton plan." },
                ].map(p=><div key={p.n} style={{ display:'flex', gap:'.85rem', alignItems:'flex-start' }}><span style={{ fontSize:'1.5rem', flexShrink:0, marginTop:'.1rem' }}>{p.n}</span><div><p style={{ fontWeight:700, color:C.dark, marginBottom:'.25rem', fontSize:'.95rem' }}>{p.t}</p><p style={{ color:'rgba(26,18,48,.6)', fontSize:'.88rem', lineHeight:1.65, margin:0 }}>{p.d}</p></div></div>)}
              </div>
              <button onClick={handleCTA} style={{ padding:'.85rem 2rem', borderRadius:50, border:'none', background:`linear-gradient(135deg,${C.purple},${C.pink})`, color:'#fff', fontWeight:700, cursor:'pointer', fontSize:'.95rem', boxShadow:'0 6px 24px rgba(232,35,122,.4)' }}>Je rejoins The Ultimate Academy</button>
            </div>
          </div>
        </Inner>
      </Section>

      {/* ── ÉDUCATIF ───────────────────────────────────────────── */}
      <Section bg="#0C0A18">
        <Inner>
          <div style={{ display:'flex', gap:'3rem', alignItems:'center', flexWrap:'wrap', flexDirection:'row-reverse' }}>
            <div style={{ flex:'1 1 380px', borderRadius:20, overflow:'hidden', maxHeight:440 }}>
              <svg viewBox="0 0 440 300" style={{width:'100%',height:'100%',display:'block',minHeight:280}}>
                <defs>
                  <linearGradient id="cg2" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#8B2FC9"/>
                    <stop offset="100%" stopColor="#E8237A"/>
                  </linearGradient>
                </defs>
                <rect width="440" height="300" fill="#12102a"/>
                <text x="220" y="28" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,.3)" fontFamily="system-ui,sans-serif">Stratégie de course · Allure/km au fil des bornes</text>
                <line x1="50" y1="50" x2="50" y2="220" stroke="rgba(255,255,255,.08)" strokeWidth="1"/>
                <line x1="50" y1="220" x2="405" y2="220" stroke="rgba(255,255,255,.08)" strokeWidth="1"/>
                <text x="50" y="240" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,.22)" fontFamily="system-ui,sans-serif">0</text>
                <text x="140" y="240" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,.22)" fontFamily="system-ui,sans-serif">10km</text>
                <text x="228" y="240" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,.22)" fontFamily="system-ui,sans-serif">21km</text>
                <text x="405" y="240" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,.22)" fontFamily="system-ui,sans-serif">42km</text>
                <line x1="228" y1="52" x2="228" y2="218" stroke="rgba(255,255,255,.08)" strokeWidth="1" strokeDasharray="4,3"/>
                <text x="232" y="65" fontSize="8.5" fill="rgba(255,255,255,.2)" fontFamily="system-ui,sans-serif">Mi-course</text>
                <path d="M 50 125 C 95 123 140 120 228 118 C 270 138 315 168 405 205" stroke="#F97316" strokeWidth="2.5" fill="none" strokeDasharray="7,4" opacity=".65"/>
                <path d="M 50 130 C 95 133 140 136 228 137 C 280 133 335 127 405 118" stroke="url(#cg2)" strokeWidth="3" fill="none"/>
                <line x1="62" y1="265" x2="90" y2="265" stroke="#F97316" strokeWidth="2" strokeDasharray="6,4" opacity=".65"/>
                <text x="95" y="269" fontSize="10.5" fill="rgba(255,255,255,.4)" fontFamily="system-ui,sans-serif">Positif split, départ trop vite</text>
                <line x1="248" y1="265" x2="276" y2="265" stroke="#C084FC" strokeWidth="3"/>
                <text x="281" y="269" fontSize="10.5" fill="rgba(255,255,255,.4)" fontFamily="system-ui,sans-serif">Négatif split ✓</text>
              </svg>
            </div>
            <div style={{ flex:'1 1 300px' }}>
              <SectionTag>Comprendre les temps de passage</SectionTag>
              <H2Dark>Négatif split, stratégie et gestion de l'effort</H2Dark>
              <div style={{ color:'rgba(255,255,255,.7)', fontSize:'.9rem', lineHeight:1.8, display:'flex', flexDirection:'column', gap:'1rem' }}>
                <p>Un <strong style={{ color:'#fff' }}>temps de passage</strong> est ton chrono cumulé à chaque borne kilométrique. C'est l'outil de navigation de tout coureur qui vise un objectif précis, car les sensations en course sont souvent trompeuses.</p>
                <p>Le <strong style={{ color:'#fff' }}>négatif split</strong> consiste à courir la seconde moitié de la course plus vite que la première. Cette stratégie, utilisée par Eliud Kipchoge et les meilleurs marathoniens, préserve le glycogène musculaire et évite le redoutable « mur » du marathon.</p>
                <p>À l'inverse, le <strong style={{ color:'#fff' }}>positif split</strong> (partir trop vite) est la cause numéro 1 des contre-performances. L'adrénaline du départ fait paraître une allure excessive comme normale, jusqu'au retour de bâton au 30ème kilomètre.</p>
              </div>
              <div style={{ marginTop:'1.5rem', display:'flex', gap:'1rem', flexWrap:'wrap' }}>
                <Link to="/calculateur/vma" style={{ color:'#C084FC', fontSize:'.85rem', textDecoration:'none' }}>→ Calculer ma VMA</Link>
                <Link to="/calculateur/predicteur" style={{ color:'#C084FC', fontSize:'.85rem', textDecoration:'none' }}>→ Prédire mon chrono</Link>
              </div>
            </div>
          </div>
        </Inner>
      </Section>

      {/* ── RAVITAILLEMENT ─────────────────────────────────────── */}
      <Section bg="#fff">
        <Inner>
          <div style={{ textAlign:'center', marginBottom:'2.5rem' }}>
            <SectionTag>Nutrition course</SectionTag>
            <H2Light>Où placer tes ravitaillements ?</H2Light>
            <p style={{ color:'rgba(26,18,48,.55)', maxWidth:540, margin:'0 auto' }}>La stratégie nutritionnelle se prépare avant le départ, pas au 25ème kilomètre quand tu commences à flancher.</p>
          </div>
          <div style={{ display:'flex', gap:'.5rem', flexWrap:'wrap', justifyContent:'center', marginBottom:'2rem' }}>
            {['10k','semi','marathon'].map(k=><Chip key={k} active={fuelDist===k} onClick={()=>setFuelDist(k)}>{FUEL_PLAN[k].label}</Chip>)}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'1rem', marginBottom:'2rem' }}>
            {fuel.points.map(p=>(
              <div key={p.km} style={{ background:C.light, borderRadius:14, padding:'1.25rem', border:`2px solid rgba(139,47,201,.12)` }}>
                <p style={{ fontWeight:800, color:C.purple, fontSize:'1.1rem', margin:'0 0 .6rem' }}>km {p.km}</p>
                <p style={{ fontSize:'.75rem', color:'rgba(26,18,48,.4)', margin:'0 0 .75rem', textTransform:'uppercase', letterSpacing:'.06em' }}>{p.label}</p>
                {p.items.map(it=><div key={it.name} style={{ display:'flex', alignItems:'center', gap:'.5rem', marginBottom:'.35rem', fontSize:'.875rem', color:C.dark }}><span style={{ fontSize:'1.1rem' }}>{it.icon}</span>{it.name}</div>)}
              </div>
            ))}
          </div>
          <div style={{ background:`linear-gradient(135deg,rgba(139,47,201,.08),rgba(232,35,122,.06))`, borderRadius:16, padding:'1.5rem', border:'1px solid rgba(139,47,201,.15)' }}>
            <p style={{ margin:0, fontSize:'.92rem', color:C.dark, lineHeight:1.7 }}>
              <strong style={{ color:C.purple }}>💬 Mon conseil coach :</strong> « {fuel.tip} »
            </p>
          </div>
        </Inner>
      </Section>

      {/* ── TÉMOIGNAGES ────────────────────────────────────────── */}
      <Section bg={C.light}>
        <Inner>
          <div style={{ textAlign:'center', marginBottom:'2.5rem' }}>
            <SectionTag>Témoignages</SectionTag>
            <H2Light>Ce que disent nos athlètes</H2Light>
          </div>
        </Inner>
        <TestimonialsCarousel testimonials={TESTIMONIALS_CALCULATOR} />
      </Section>

      {/* ── CTA PRINCIPAL ──────────────────────────────────────── */}
      <section style={{ padding:'6rem 1.5rem', background:'#0C0A18', textAlign:'center', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'10%', left:'-5%', width:'40vw', height:'40vw', maxWidth:420, maxHeight:420, borderRadius:'50%', background:'radial-gradient(circle,rgba(139,47,201,.22) 0%,transparent 70%)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:'10%', right:'-5%', width:'35vw', height:'35vw', maxWidth:360, maxHeight:360, borderRadius:'50%', background:'radial-gradient(circle,rgba(232,35,122,.16) 0%,transparent 70%)', pointerEvents:'none' }}/>
        <Inner max={620} style={{ position:'relative', zIndex:1 }}>
          <div style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.08)', borderRadius:24, padding:'3.5rem 2.5rem' }}>
            <p style={{ fontSize:'.75rem', letterSpacing:'.18em', textTransform:'uppercase', color:'rgba(192,132,252,.8)', marginBottom:'.75rem', fontWeight:600 }}>Prêt à passer à l'action ?</p>
            <h2 style={{ fontSize:'clamp(1.8rem,4vw,2.8rem)', fontWeight:900, color:'#fff', lineHeight:1.1, marginBottom:'1rem' }}>Atteins ce chrono avec un vrai coaching</h2>
            <p style={{ color:'rgba(255,255,255,.55)', fontSize:'1.05rem', marginBottom:'2.5rem', lineHeight:1.6 }}>Reçois un plan personnalisé basé sur ta VMA et ton objectif, que je construis et ajuste chaque semaine.</p>
            <button onClick={handleCTA} style={{ padding:'1.1rem 2.75rem', borderRadius:50, border:'none', background:`linear-gradient(135deg,${C.purple},${C.pink})`, color:'#fff', fontSize:'1.1rem', fontWeight:800, cursor:'pointer', boxShadow:'0 8px 32px rgba(232,35,122,.5)', marginBottom:'1rem' }}>Je rejoins The Ultimate Academy</button>
            <p style={{ color:'rgba(255,255,255,.3)', fontSize:'.82rem', margin:0 }}>30€/mois · Sans engagement · Résiliation en 1 clic</p>
          </div>
        </Inner>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────── */}
      <Section bg="#fff">
        <Inner max={720}>
          <div style={{ textAlign:'center', marginBottom:'2.5rem' }}>
            <SectionTag>Questions fréquentes</SectionTag>
            <H2Light>Tout ce que tu dois savoir</H2Light>
          </div>
          {FAQ.map((item,i)=>(
            <div key={i} style={{ borderBottom:'1px solid rgba(139,47,201,.1)' }}>
              <button onClick={()=>setOpenFaq(openFaq===i?null:i)} style={{ width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'1.1rem 0', background:'none', border:'none', cursor:'pointer', color:C.dark, fontSize:'.95rem', fontWeight:600, textAlign:'left', gap:'1rem' }}>
                {item.q}
                <svg width="14" height="14" viewBox="0 0 12 12" fill="none" style={{ flexShrink:0, transition:'transform .2s', transform:openFaq===i?'rotate(180deg)':'none' }}><path d="M1 4l5 5 5-5" stroke={C.purple} strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
              {openFaq===i&&<p style={{ margin:'0 0 1.25rem', color:'rgba(26,18,48,.65)', fontSize:'.9rem', lineHeight:1.75 }}>{item.a}</p>}
            </div>
          ))}
        </Inner>
      </Section>

      {/* ── FOOTER CTA ─────────────────────────────────────────── */}
      <section style={{ background:'#0C0A18', padding:'3.5rem 1.5rem', textAlign:'center' }}>
        <p style={{ color:'rgba(255,255,255,.5)', fontSize:'1.05rem', marginBottom:'1.25rem', fontStyle:'italic' }}>Ton objectif, ton plan, ton run.</p>
        <button onClick={handleCTA} style={{ padding:'.85rem 2.25rem', borderRadius:50, border:'none', background:`linear-gradient(135deg,${C.purple},${C.pink})`, color:'#fff', fontSize:'1rem', fontWeight:700, cursor:'pointer', boxShadow:'0 6px 24px rgba(232,35,122,.4)' }}>Démarrer mon coaching</button>
      </section>

      <SiteFooter />
    </div>
  )
}
