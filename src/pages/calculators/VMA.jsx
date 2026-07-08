import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Nav from '../../components/Nav'
import ToolsFooter from '../../components/Layout/ToolsFooter'
import { kmhToPace, DIST_PRESETS, VMA_ZONES } from '../../lib/runCalc'
import { TESTIMONIALS_VMA } from '../../lib/toolsContent'
import TestimonialsCarousel from '../../components/TestimonialsCarousel'

// ── Computation ─────────────────────────────────────────────
const RACE_FACTORS = { '5k':0.95, '10k':0.87, 'semi':0.83, 'marathon':0.77 }
const cooperVMA  = d => d>0 ? (d/1000)*5 : 0
const sixMinVMA  = d => d>0 ? (d/1000)*10 : 0
function chronoVMA(key,h,m,s) {
  const dist = DIST_PRESETS.find(d=>d.key===key); if(!dist) return 0
  const secs = (parseInt(h)||0)*3600+(parseInt(m)||0)*60+(parseInt(s)||0); if(secs<=0) return 0
  return (dist.km*3600/secs)/RACE_FACTORS[key]
}
function vmaLevel(v) {
  if (v<12) return { label:'Débutant',      color:'#60A5FA', bg:'rgba(96,165,250,.12)', desc:'Tu débutes la course à pied. Des séances régulières en endurance fondamentale feront progresser ta VMA rapidement sur les 3 premiers mois.' }
  if (v<15) return { label:'Intermédiaire', color:'#34D399', bg:'rgba(52,211,153,.12)', desc:'Bon niveau pour viser un 10km en moins de 55 min. 2 séances de fractionné par semaine te permettront de franchir le cap en quelques mois.' }
  if (v<18) return { label:'Confirmé',      color:'#A3E635', bg:'rgba(163,230,53,.12)', desc:'Niveau compétiteur régulier. Tu peux viser un marathon en moins de 3h30 avec un programme structuré sur 16 semaines.' }
  if (v<21) return { label:'Expert',        color:'#FBBF24', bg:'rgba(251,191,36,.12)', desc:'Très bon niveau. Des chronos ambitieux (sub-3h marathon, sub-36min 10km) sont à ta portée avec un coaching personnalisé.' }
  return         { label:'Élite',          color:'#C084FC', bg:'rgba(192,132,252,.12)', desc:'Niveau performance nationale. Ta VMA est comparable aux coureurs de compétition confirmés et aux semi-professionnels.' }
}

const FAQ = [
  { q:"C'est quoi la VMA en course à pied ?", a:"La VMA (Vitesse Maximale Aérobie) est la vitesse minimale à laquelle tu atteins ta consommation maximale d'oxygène (VO2max). En pratique, c'est l'allure à laquelle tu peux tenir un effort d'environ 5 à 6 minutes à bloc. C'est l'indicateur de référence de tous les entraîneurs pour programmer les séances et structurer les cycles de préparation." },
  { q:"Quelle VMA pour courir un marathon en 4h ?", a:"Pour finir un marathon en 4h (allure 5'41\"/km), il faut une VMA d'environ 13-14 km/h. Les marathoniens courent typiquement à 80% de leur VMA. Avec une VMA de 14 km/h : 80% donne 11,2 km/h soit 5'21\"/km, ce qui permet de viser un marathon entre 3h45 et 3h55 avec une bonne préparation spécifique." },
  { q:"Comment améliorer sa VMA rapidement ?", a:"Les séances les plus efficaces : fractionné court 30/30 (30s à 100% VMA / 30s récup) ou 10×200m, et fractionné moyen 6×500m à 95% VMA. 2 séances par semaine pendant 8 semaines suffisent pour progresser de 1 à 2 km/h. La régularité et la progressivité sont la clé, pas l'intensité maximale dès le départ." },
  { q:"VMA moyenne homme et femme par âge ?", a:"Entre 20-30 ans : hommes 15-17 km/h, femmes 13-15 km/h (sportifs récréatifs). À 40 ans, on observe une baisse de 0,5 à 1 km/h par décennie sans entraînement spécifique. Les athlètes de haut niveau atteignent 22-24 km/h (hommes) et 19-21 km/h (femmes). Une VMA de 15+ km/h est un bon objectif pour tout coureur régulier, quel que soit l'âge." },
  { q:"Différence entre VMA et VO2max ?", a:"La VO2max est la consommation maximale d'oxygène exprimée en mL/kg/min. La VMA est la vitesse de course atteinte à cette VO2max. La relation : VMA (km/h) ≈ VO2max / 3,5 × 0,21. Une VMA de 15 km/h correspond à un VO2max d'environ 52 mL/kg/min. En pratique, les coureurs utilisent la VMA car elle se mesure directement sur le terrain sans matériel spécialisé." },
  { q:"Combien de fois par semaine travailler la VMA ?", a:"1 à 2 séances de VMA par semaine est la dose optimale pour la majorité des coureurs. Au-delà, le risque de blessure et de surentraînement augmente. Ces séances doivent représenter 10-15% du volume total d'entraînement. Le reste du temps doit être consacré à l'endurance fondamentale (65-75% VMA), base indispensable de toute progression durable." },
]

const C = { purple:'#8B2FC9', pink:'#E8237A', dark:'#1a1230', light:'#F8F5FF' }
const inputSt = { background:'#fff', border:'1px solid rgba(139,47,201,.25)', borderRadius:10, padding:'.55rem .75rem', color:C.dark, fontSize:'.9rem', outline:'none' }
const labelSt = { display:'block', fontSize:'.72rem', color:'rgba(26,18,48,.45)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:'.4rem' }

function Chip({ active, onClick, children }) {
  return <button onClick={onClick} style={{ padding:'.4rem .9rem', borderRadius:50, cursor:'pointer', fontSize:'.84rem', border:`1px solid ${active?'transparent':'rgba(139,47,201,.25)'}`, background:active?`linear-gradient(135deg,${C.purple},${C.pink})`:'#fff', color:active?'#fff':C.purple, fontWeight:active?600:400 }}>{children}</button>
}
function Inner({ max=1000, children, style }) { return <div style={{ maxWidth:max, margin:'0 auto', ...style }}>{children}</div> }
function SectionTag({ children, dark }) { return <p style={{ fontSize:'.75rem', letterSpacing:'.18em', textTransform:'uppercase', color:dark?'rgba(255,255,255,.6)':C.purple, marginBottom:'.75rem', fontWeight:600 }}>{children}</p> }
function H2L({ children }) { return <h2 style={{ fontSize:'clamp(1.6rem,3.5vw,2.4rem)', fontWeight:900, color:C.dark, lineHeight:1.15, marginBottom:'1.25rem' }}>{children}</h2> }
function H2D({ children }) { return <h2 style={{ fontSize:'clamp(1.6rem,3.5vw,2.4rem)', fontWeight:900, color:'#fff', lineHeight:1.15, marginBottom:'1.25rem' }}>{children}</h2> }

export default function VMACalculator() {
  const navigate = useNavigate()
  const calcRef  = useRef()

  const [cooperDist, setCooperDist] = useState('')
  const [sixDist,    setSixDist]    = useState('')
  const [distKey,    setDistKey]    = useState('10k')
  const [ch,setCh] = useState(''); const [cm,setCm] = useState(''); const [cs,setCs] = useState('')
  const [openFaq,    setOpenFaq]    = useState(null)

  useEffect(() => {
    const prev = document.title
    document.title = 'Calculateur de VMA gratuit | Test Cooper et chrono | The Ultimate Academy'
    const meta = document.querySelector('meta[name="description"]')
    const prevM = meta?.content
    if (meta) meta.content = "Calcule ta VMA avec le test Cooper, 6 minutes ou depuis ton dernier chrono. Découvre tes zones d'entraînement personnalisées."
    return () => { document.title = prev; if (meta&&prevM!=null) meta.content = prevM }
  }, [])

  const vmaC = cooperVMA(parseFloat(cooperDist)||0)
  const vmaS = sixMinVMA(parseFloat(sixDist)||0)
  const vmaR = chronoVMA(distKey,ch,cm,cs)
  const vma  = vmaR||vmaC||vmaS
  const lvl  = vma>0 ? vmaLevel(vma) : null

  const handleCTA = () => navigate('/register')

  return (
    <div style={{ background:'#000', color:'#fff', overflowX:'hidden' }}>
      <Nav />

      {/* HERO */}
      <section style={{ position:'relative', minHeight:'100vh', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', textAlign:'center', background:'linear-gradient(-45deg, #080818, #1a0a2e, #2d0a4e, #5a1fa0, #2d0a4e, #1a0a2e, #080818)', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'-20%', left:'-10%', width:'60vw', height:'60vw', maxWidth:700, maxHeight:700, borderRadius:'50%', background:'radial-gradient(circle,rgba(139,47,201,.22) 0%,transparent 70%)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:'-10%', right:'-8%', width:'50vw', height:'50vw', maxWidth:600, maxHeight:600, borderRadius:'50%', background:'radial-gradient(circle,rgba(232,35,122,.18) 0%,transparent 70%)', pointerEvents:'none' }}/>
        <div style={{ position:'relative', zIndex:1, padding:'8rem 1.5rem 4rem', maxWidth:760 }}>
          <h1 style={{ fontSize:'clamp(2.2rem,6vw,4rem)', fontWeight:900, lineHeight:1.05, marginBottom:'1.25rem' }}>
            Calculateur de <span style={{ background:'linear-gradient(135deg,#8B2FC9,#E8237A)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', display:'inline' }}>VMA running</span>
          </h1>
          <p style={{ fontSize:'clamp(1rem,2.5vw,1.2rem)', color:'rgba(255,255,255,.75)', maxWidth:520, margin:'0 auto 2.5rem', lineHeight:1.6 }}>Vitesse Maximale Aérobie : la donnée clé pour programmer ton entraînement et exploser tes chronos</p>
          <button onClick={()=>calcRef.current?.scrollIntoView({behavior:'smooth'})} style={{ padding:'1rem 2.5rem', borderRadius:50, border:'none', background:`linear-gradient(135deg,${C.purple},${C.pink})`, color:'#fff', fontSize:'1.05rem', fontWeight:700, cursor:'pointer', boxShadow:'0 8px 32px rgba(232,35,122,.5)' }}>Calculer ma VMA ↓</button>
        </div>
        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${C.purple},${C.pink})` }}/>
      </section>

      {/* CALCULATOR */}
      <section ref={calcRef} id="outil" style={{ background:C.light, padding:'5rem 1.5rem' }}>
        <Inner max={780}>
          <div style={{ textAlign:'center', marginBottom:'2.5rem' }}>
            <SectionTag>Calculateur de VMA</SectionTag>
            <h2 style={{ fontSize:'clamp(1.5rem,3vw,2rem)', fontWeight:900, color:C.dark, marginBottom:'.5rem' }}>3 méthodes au choix</h2>
            <p style={{ color:'rgba(26,18,48,.55)', fontSize:'.95rem' }}>Utilise celle qui correspond à ton niveau et tes ressources</p>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>

            {/* Cooper */}
            <div style={{ background:'#fff', borderRadius:20, padding:'2rem', boxShadow:'0 4px 24px rgba(139,47,201,.08)', border:'1px solid rgba(139,47,201,.1)' }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem', marginBottom:'1.25rem' }}>
                <div>
                  <p style={{ fontWeight:800, color:C.dark, marginBottom:'.2rem', fontSize:'1.05rem' }}>🏃 Test Cooper · 12 minutes</p>
                  <p style={{ color:'rgba(26,18,48,.5)', fontSize:'.85rem', margin:0 }}>Course en continu le plus loin possible pendant 12 minutes</p>
                </div>
                {vmaC>0&&<div style={{ padding:'.5rem 1rem', borderRadius:10, background:`linear-gradient(135deg,${C.purple},${C.pink})`, color:'#fff', textAlign:'right' }}><p style={{ margin:0, fontSize:'.72rem', opacity:.8 }}>VMA estimée</p><p style={{ margin:0, fontSize:'1.4rem', fontWeight:900 }}>{vmaC.toFixed(1)} km/h</p></div>}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'.75rem', flexWrap:'wrap' }}>
                <div><label style={labelSt}>Distance parcourue</label><div style={{ display:'flex', alignItems:'center', gap:'.5rem' }}><input type="number" min="0" step="50" placeholder="Ex : 2800" value={cooperDist} onChange={e=>setCooperDist(e.target.value)} style={{ ...inputSt, width:150 }}/><span style={{ color:'rgba(26,18,48,.45)', fontSize:'.85rem' }}>mètres</span></div></div>
                <p style={{ color:'rgba(26,18,48,.4)', fontSize:'.82rem', margin:0 }}>Ex : 2800m → VMA <strong>14 km/h</strong></p>
              </div>
            </div>

            {/* 6 min */}
            <div style={{ background:'#fff', borderRadius:20, padding:'2rem', boxShadow:'0 4px 24px rgba(139,47,201,.08)', border:'1px solid rgba(139,47,201,.1)' }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem', marginBottom:'1.25rem' }}>
                <div>
                  <p style={{ fontWeight:800, color:C.dark, marginBottom:'.2rem', fontSize:'1.05rem' }}>⚡ Test 6 minutes</p>
                  <p style={{ color:'rgba(26,18,48,.5)', fontSize:'.85rem', margin:0 }}>Plus court, tout aussi précis pour les coureurs réguliers</p>
                </div>
                {vmaS>0&&<div style={{ padding:'.5rem 1rem', borderRadius:10, background:`linear-gradient(135deg,${C.purple},${C.pink})`, color:'#fff', textAlign:'right' }}><p style={{ margin:0, fontSize:'.72rem', opacity:.8 }}>VMA estimée</p><p style={{ margin:0, fontSize:'1.4rem', fontWeight:900 }}>{vmaS.toFixed(1)} km/h</p></div>}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'.75rem', flexWrap:'wrap' }}>
                <div><label style={labelSt}>Distance parcourue</label><div style={{ display:'flex', alignItems:'center', gap:'.5rem' }}><input type="number" min="0" step="25" placeholder="Ex : 1500" value={sixDist} onChange={e=>setSixDist(e.target.value)} style={{ ...inputSt, width:150 }}/><span style={{ color:'rgba(26,18,48,.45)', fontSize:'.85rem' }}>mètres</span></div></div>
                <p style={{ color:'rgba(26,18,48,.4)', fontSize:'.82rem', margin:0 }}>Ex : 1500m → VMA <strong>~15,8 km/h</strong></p>
              </div>
            </div>

            {/* Chrono */}
            <div style={{ background:'#fff', borderRadius:20, padding:'2rem', boxShadow:'0 4px 24px rgba(139,47,201,.08)', border:'1px solid rgba(139,47,201,.1)' }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem', marginBottom:'1.25rem' }}>
                <div>
                  <p style={{ fontWeight:800, color:C.dark, marginBottom:'.2rem', fontSize:'1.05rem' }}>🎯 Depuis un chrono récent</p>
                  <p style={{ color:'rgba(26,18,48,.5)', fontSize:'.85rem', margin:0 }}>Estime ta VMA depuis ta dernière compétition ou sortie chronométrée</p>
                </div>
                {vmaR>0&&<div style={{ padding:'.5rem 1rem', borderRadius:10, background:`linear-gradient(135deg,${C.purple},${C.pink})`, color:'#fff', textAlign:'right' }}><p style={{ margin:0, fontSize:'.72rem', opacity:.8 }}>VMA estimée</p><p style={{ margin:0, fontSize:'1.4rem', fontWeight:900 }}>{vmaR.toFixed(1)} km/h</p></div>}
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'.5rem', marginBottom:'1rem' }}>
                {DIST_PRESETS.map(d=><Chip key={d.key} active={distKey===d.key} onClick={()=>setDistKey(d.key)}>{d.label}</Chip>)}
              </div>
              <div style={{ display:'flex', gap:'.75rem', flexWrap:'wrap' }}>
                {[['Heures',ch,setCh,9],['Minutes',cm,setCm,59],['Secondes',cs,setCs,59]].map(([l,v,s,mx])=>(
                  <div key={l}><label style={labelSt}>{l}</label><input type="number" min="0" max={mx} placeholder="00" value={v} onChange={e=>s(e.target.value)} style={{ ...inputSt, width:80 }}/></div>
                ))}
              </div>
            </div>
          </div>

          {/* Results */}
          {vma>0&&(
            <div style={{ marginTop:'2rem', background:'#fff', borderRadius:20, padding:'2rem', boxShadow:'0 8px 40px rgba(139,47,201,.12)', border:`2px solid rgba(139,47,201,.2)` }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:'1.5rem', marginBottom:'1.75rem' }}>
                <div>
                  <p style={{ margin:0, fontSize:'.75rem', color:'rgba(26,18,48,.4)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:'.3rem' }}>Ta VMA estimée</p>
                  <p style={{ margin:0, fontSize:'3rem', fontWeight:900, color:C.purple, lineHeight:1 }}>{vma.toFixed(1)}<span style={{ fontSize:'1rem', fontWeight:400, marginLeft:'.25rem' }}>km/h</span></p>
                  <p style={{ margin:'.3rem 0 0', color:'rgba(26,18,48,.5)', fontSize:'.85rem' }}>Allure VMA : {kmhToPace(vma)}/km</p>
                </div>
                {lvl&&(
                  <div style={{ padding:'1rem 1.5rem', borderRadius:14, background:lvl.bg, textAlign:'right' }}>
                    <p style={{ margin:0, fontWeight:800, color:lvl.color, fontSize:'1.1rem' }}>{lvl.label}</p>
                    <p style={{ margin:'.35rem 0 0', fontSize:'.82rem', color:'rgba(26,18,48,.6)', maxWidth:220 }}>{lvl.desc}</p>
                  </div>
                )}
              </div>
              <p style={{ fontWeight:700, color:C.dark, marginBottom:'1rem', fontSize:'.95rem' }}>Tes zones d'entraînement</p>
              <div style={{ overflowX:'auto', borderRadius:12, border:'1px solid rgba(139,47,201,.12)' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'.875rem' }}>
                  <thead><tr style={{ background:'rgba(139,47,201,.06)' }}>
                    {['Zone','Nom','% VMA','Vitesse','Allure'].map(h=><th key={h} style={{ padding:'.6rem .85rem', textAlign:'left', color:'rgba(26,18,48,.4)', fontWeight:500, fontSize:'.72rem', textTransform:'uppercase', letterSpacing:'.07em' }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {VMA_ZONES.map(z=>{
                      const lo=vma*z.pct[0], hi=vma*z.pct[1]
                      return <tr key={z.n} style={{ borderTop:'1px solid rgba(139,47,201,.07)' }}>
                        <td style={{ padding:'.6rem .85rem' }}><span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:24, height:24, borderRadius:'50%', background:z.color+'25', color:z.color, fontSize:'.8rem', fontWeight:700 }}>{z.n}</span></td>
                        <td style={{ padding:'.6rem .85rem', color:z.color, fontWeight:600 }}>{z.name}</td>
                        <td style={{ padding:'.6rem .85rem', color:'rgba(26,18,48,.45)', fontVariantNumeric:'tabular-nums' }}>{Math.round(z.pct[0]*100)}–{Math.round(z.pct[1]*100)}%</td>
                        <td style={{ padding:'.6rem .85rem', color:C.dark, fontVariantNumeric:'tabular-nums' }}>{lo.toFixed(1)}–{hi.toFixed(1)} km/h</td>
                        <td style={{ padding:'.6rem .85rem', color:C.dark, fontVariantNumeric:'tabular-nums' }}>{kmhToPace(hi)} – {kmhToPace(lo)}</td>
                      </tr>
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop:'1.25rem', textAlign:'center' }}>
                <Link to="/calculateur" state={{ vma }} style={{ display:'inline-block', padding:'.7rem 1.75rem', borderRadius:50, background:`linear-gradient(135deg,${C.purple},${C.pink})`, color:'#fff', fontWeight:700, textDecoration:'none', fontSize:'.9rem' }}>
                  Utiliser cette VMA pour calculer mes temps de passage →
                </Link>
              </div>
            </div>
          )}
        </Inner>
      </section>

      {/* COMMENT ÇA FONCTIONNE */}
      <section style={{ background:'#fff', padding:'5rem 1.5rem' }}>
        <Inner>
          <div style={{ display:'flex', gap:'3rem', alignItems:'center', flexWrap:'wrap' }}>
            <div style={{ flex:'1 1 380px', borderRadius:20, overflow:'hidden', maxHeight:440 }}>
              <svg viewBox="0 0 440 300" style={{width:'100%',height:'100%',display:'block',minHeight:280}}>
                <defs>
                  <linearGradient id="vg1" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#8B2FC9"/>
                    <stop offset="100%" stopColor="#E8237A"/>
                  </linearGradient>
                </defs>
                <rect width="440" height="300" fill="#EDE8F7"/>
                <text x="220" y="28" textAnchor="middle" fontSize="12" fill="#1a1230" fontWeight="700" fontFamily="system-ui,sans-serif">Zones d'entraînement · VMA 15 km/h</text>
                <rect x="40" y="48" width="360" height="36" rx="8" fill="#60A5FA22"/>
                <rect x="40" y="48" width="10" height="36" rx="4" fill="#60A5FA"/>
                <text x="60" y="62" fontSize="10.5" fill="#1a1230" fontWeight="600" fontFamily="system-ui,sans-serif">Z1 · Récupération  60–65% VMA</text>
                <text x="60" y="77" fontSize="9.5" fill="rgba(26,18,48,.45)" fontFamily="system-ui,sans-serif">9,0 – 9,8 km/h · 6'08″ – 6'40″/km</text>
                <rect x="40" y="94" width="360" height="36" rx="8" fill="#34D39922"/>
                <rect x="40" y="94" width="10" height="36" rx="4" fill="#34D399"/>
                <text x="60" y="108" fontSize="10.5" fill="#1a1230" fontWeight="600" fontFamily="system-ui,sans-serif">Z2 · Endurance  70–75% VMA</text>
                <text x="60" y="123" fontSize="9.5" fill="rgba(26,18,48,.45)" fontFamily="system-ui,sans-serif">10,5 – 11,3 km/h · 5'20″ – 5'43″/km</text>
                <rect x="40" y="140" width="360" height="36" rx="8" fill="#A3E63522"/>
                <rect x="40" y="140" width="10" height="36" rx="4" fill="#A3E635"/>
                <text x="60" y="154" fontSize="10.5" fill="#1a1230" fontWeight="600" fontFamily="system-ui,sans-serif">Z3 · Aérobie  80–85% VMA</text>
                <text x="60" y="169" fontSize="9.5" fill="rgba(26,18,48,.45)" fontFamily="system-ui,sans-serif">12,0 – 12,8 km/h · 4'42″ – 5'00″/km</text>
                <rect x="40" y="186" width="360" height="36" rx="8" fill="#FBBF2422"/>
                <rect x="40" y="186" width="10" height="36" rx="4" fill="#FBBF24"/>
                <text x="60" y="200" fontSize="10.5" fill="#1a1230" fontWeight="600" fontFamily="system-ui,sans-serif">Z4 · Seuil  88–95% VMA</text>
                <text x="60" y="215" fontSize="9.5" fill="rgba(26,18,48,.45)" fontFamily="system-ui,sans-serif">13,2 – 14,3 km/h · 4'12″ – 4'33″/km</text>
                <rect x="40" y="232" width="360" height="36" rx="8" fill="url(#vg1)" opacity=".12"/>
                <rect x="40" y="232" width="10" height="36" rx="4" fill="url(#vg1)"/>
                <text x="60" y="246" fontSize="10.5" fill="#8B2FC9" fontWeight="700" fontFamily="system-ui,sans-serif">Z5 · VMA  95–100% VMA ⚡</text>
                <text x="60" y="261" fontSize="9.5" fill="rgba(139,47,201,.6)" fontFamily="system-ui,sans-serif">14,3 – 15,0 km/h · 4'00″ – 4'12″/km</text>
                <text x="220" y="290" textAnchor="middle" fontSize="9.5" fill="rgba(26,18,48,.25)" fontFamily="system-ui,sans-serif">Calculé pour une VMA de 15 km/h</text>
              </svg>
            </div>
            <div style={{ flex:'1 1 300px' }}>
              <SectionTag>C'est quoi la VMA ?</SectionTag>
              <H2L>La donnée qui pilote tout ton entraînement</H2L>
              <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem', marginBottom:'2rem' }}>
                {[
                  { n:'⚡', t:'Définition simple', d:"La VMA (Vitesse Maximale Aérobie) est la vitesse à laquelle ton corps consomme le maximum d'oxygène possible. C'est ton moteur : plus il est puissant, plus tu es rapide et endurant sur toutes les distances." },
                  { n:'📈', t:"L'indicateur de progression", d:"En connaissant ta VMA, tu peux calculer avec précision toutes tes allures d'entraînement et te fixer des objectifs réalistes. Chaque progression de 0,5 km/h de VMA se traduit par 3-5 minutes gagnées sur un marathon." },
                  { n:'🎯', t:'La base de chaque séance', d:"Endurance fondamentale, seuil, fractionné : tout se calcule en pourcentage de VMA. Courir dans les bonnes zones évite le surentraînement et maximise les adaptations physiologiques." },
                ].map(p=><div key={p.n} style={{ display:'flex', gap:'.85rem', alignItems:'flex-start' }}><span style={{ fontSize:'1.5rem', flexShrink:0 }}>{p.n}</span><div><p style={{ fontWeight:700, color:C.dark, marginBottom:'.2rem', fontSize:'.95rem' }}>{p.t}</p><p style={{ color:'rgba(26,18,48,.6)', fontSize:'.88rem', lineHeight:1.65, margin:0 }}>{p.d}</p></div></div>)}
              </div>
              <button onClick={handleCTA} style={{ padding:'.85rem 2rem', borderRadius:50, border:'none', background:`linear-gradient(135deg,${C.purple},${C.pink})`, color:'#fff', fontWeight:700, cursor:'pointer', fontSize:'.95rem', boxShadow:'0 6px 24px rgba(232,35,122,.4)' }}>Je rejoins The Ultimate Academy</button>
            </div>
          </div>
        </Inner>
      </section>

      {/* COMMENT AMÉLIORER SA VMA */}
      <section style={{ background:'#0C0A18', padding:'5rem 1.5rem' }}>
        <Inner>
          <div style={{ display:'flex', gap:'3rem', alignItems:'center', flexWrap:'wrap', flexDirection:'row-reverse' }}>
            <div style={{ flex:'1 1 380px', borderRadius:20, overflow:'hidden', maxHeight:440 }}>
              <svg viewBox="0 0 440 300" style={{width:'100%',height:'100%',display:'block',minHeight:280}}>
                <defs>
                  <linearGradient id="vg2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E8237A"/>
                    <stop offset="100%" stopColor="#8B2FC9"/>
                  </linearGradient>
                </defs>
                {/* Background */}
                <rect width="440" height="300" fill="#12102a"/>
                {/* Title */}
                <text x="220" y="22" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,.65)" fontFamily="system-ui,sans-serif" fontWeight="600">Séance 30/30 · Fractionné court VMA</text>
                {/* Y-axis labels – above their reference lines */}
                <text x="5" y="41" fontSize="9" fill="rgba(255,255,255,.65)" fontFamily="system-ui,sans-serif">100% VMA</text>
                <text x="5" y="159" fontSize="9" fill="rgba(255,255,255,.6)" fontFamily="system-ui,sans-serif">Récup. active</text>
                {/* Reference lines */}
                <line x1="75" y1="44" x2="408" y2="44" stroke="rgba(255,255,255,.1)" strokeWidth="1" strokeDasharray="4,3"/>
                <line x1="75" y1="162" x2="408" y2="162" stroke="rgba(255,255,255,.08)" strokeWidth="1" strokeDasharray="4,3"/>
                {/* Pair 1 */}
                <rect x="80" y="44" width="22" height="156" rx="4" fill="url(#vg2)" opacity=".9"/>
                <rect x="106" y="162" width="22" height="38" rx="4" fill="rgba(255,255,255,.13)"/>
                {/* Pair 2 */}
                <rect x="146" y="44" width="22" height="156" rx="4" fill="url(#vg2)" opacity=".9"/>
                <rect x="172" y="162" width="22" height="38" rx="4" fill="rgba(255,255,255,.13)"/>
                {/* Pair 3 */}
                <rect x="212" y="44" width="22" height="156" rx="4" fill="url(#vg2)" opacity=".9"/>
                <rect x="238" y="162" width="22" height="38" rx="4" fill="rgba(255,255,255,.13)"/>
                {/* Pair 4 */}
                <rect x="278" y="44" width="22" height="156" rx="4" fill="url(#vg2)" opacity=".9"/>
                <rect x="304" y="162" width="22" height="38" rx="4" fill="rgba(255,255,255,.13)"/>
                {/* Pair 5 */}
                <rect x="344" y="44" width="22" height="156" rx="4" fill="url(#vg2)" opacity=".9"/>
                <rect x="370" y="162" width="22" height="38" rx="4" fill="rgba(255,255,255,.13)"/>
                {/* 30s labels – first 3 pairs */}
                <text x="91"  y="213" textAnchor="middle" fontSize="8.5" fill="rgba(255,255,255,.55)" fontFamily="system-ui,sans-serif">30s</text>
                <text x="117" y="213" textAnchor="middle" fontSize="8.5" fill="rgba(255,255,255,.45)" fontFamily="system-ui,sans-serif">30s</text>
                <text x="157" y="213" textAnchor="middle" fontSize="8.5" fill="rgba(255,255,255,.55)" fontFamily="system-ui,sans-serif">30s</text>
                <text x="183" y="213" textAnchor="middle" fontSize="8.5" fill="rgba(255,255,255,.45)" fontFamily="system-ui,sans-serif">30s</text>
                <text x="223" y="213" textAnchor="middle" fontSize="8.5" fill="rgba(255,255,255,.55)" fontFamily="system-ui,sans-serif">30s</text>
                <text x="249" y="213" textAnchor="middle" fontSize="8.5" fill="rgba(255,255,255,.45)" fontFamily="system-ui,sans-serif">30s</text>
                {/* Legend */}
                <rect x="118" y="228" width="14" height="10" rx="2" fill="url(#vg2)" opacity=".9"/>
                <text x="138" y="237" fontSize="9.5" fill="rgba(255,255,255,.65)" fontFamily="system-ui,sans-serif">Effort VMA</text>
                <rect x="232" y="228" width="14" height="10" rx="2" fill="rgba(255,255,255,.13)"/>
                <text x="252" y="237" fontSize="9.5" fill="rgba(255,255,255,.65)" fontFamily="system-ui,sans-serif">Récupération active</text>
                {/* Footer */}
                <text x="220" y="260" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,.7)" fontWeight="700" fontFamily="system-ui,sans-serif">10–15 répétitions · 2x par semaine</text>
                <text x="220" y="280" textAnchor="middle" fontSize="10" fill="rgba(255,255,255,.45)" fontFamily="system-ui,sans-serif">Progression mesurable en 6 à 8 semaines</text>
              </svg>
            </div>
            <div style={{ flex:'1 1 300px' }}>
              <SectionTag dark>Comment améliorer sa VMA</SectionTag>
              <H2D>Les séances qui font vraiment progresser</H2D>
              <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
                {[
                  { n:'🔁', t:'Fractionné court (30/30)', d:"30 secondes à 100-105% VMA suivies de 30 secondes de récupération active. 10 à 15 répétitions. La séance reine pour développer la VMA sans s'épuiser. À faire sur piste ou terrain plat." },
                  { n:'🏔', t:'Séances de côtes', d:"6 à 10 répétitions de 150-200m en montée à allure maximale. La côte force l'engagement musculaire et améliore la VMA sans l'impact du sprint plat. Idéal pour les traileurs." },
                  { n:'💪', t:'Renforcement musculaire', d:"Gainages, squats, fentes : un corps fort produit une foulée plus efficace. 2 séances de 30 min par semaine peuvent améliorer ta VMA de 3 à 5% en 3 mois." },
                  { n:'😴', t:'Récupération', d:"La progression se fait pendant le repos, pas pendant l'effort. Sommeil 7-9h, nutrition adaptée, alternance hard/easy : ces facteurs comptent autant que les séances elles-mêmes." },
                ].map(p=><div key={p.n} style={{ display:'flex', gap:'.85rem', alignItems:'flex-start' }}><span style={{ fontSize:'1.5rem', flexShrink:0 }}>{p.n}</span><div><p style={{ fontWeight:700, color:'#fff', marginBottom:'.2rem', fontSize:'.95rem' }}>{p.t}</p><p style={{ color:'rgba(255,255,255,.6)', fontSize:'.88rem', lineHeight:1.65, margin:0 }}>{p.d}</p></div></div>)}
              </div>
              <div style={{ marginTop:'1.5rem', display:'flex', gap:'1rem', flexWrap:'wrap' }}>
                <Link to="/calculateur/allures" style={{ color:'#C084FC', fontSize:'.85rem', textDecoration:'none' }}>→ Calculer mes allures d'entraînement</Link>
                <Link to="/calculateur" style={{ color:'#C084FC', fontSize:'.85rem', textDecoration:'none' }}>→ Calculer mes temps de passage</Link>
              </div>
            </div>
          </div>
        </Inner>
      </section>

      {/* TÉMOIGNAGES */}
      <section style={{ background:C.light, padding:'5rem 1.5rem' }}>
        <Inner>
          <div style={{ textAlign:'center', marginBottom:'2.5rem' }}><SectionTag>Témoignages</SectionTag><H2L>Ce que disent nos athlètes</H2L></div>
        </Inner>
        <TestimonialsCarousel testimonials={TESTIMONIALS_VMA} />
      </section>

      {/* CTA */}
      <section style={{ padding:'6rem 1.5rem', background:'#0C0A18', textAlign:'center', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'10%', left:'-5%', width:'40vw', height:'40vw', maxWidth:420, maxHeight:420, borderRadius:'50%', background:'radial-gradient(circle,rgba(139,47,201,.22) 0%,transparent 70%)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:'10%', right:'-5%', width:'35vw', height:'35vw', maxWidth:360, maxHeight:360, borderRadius:'50%', background:'radial-gradient(circle,rgba(232,35,122,.16) 0%,transparent 70%)', pointerEvents:'none' }}/>
        <Inner max={620} style={{ position:'relative', zIndex:1 }}>
          <div style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.08)', borderRadius:24, padding:'3.5rem 2.5rem' }}>
            <p style={{ fontSize:'.75rem', letterSpacing:'.18em', textTransform:'uppercase', color:'rgba(192,132,252,.8)', marginBottom:'.75rem', fontWeight:600 }}>Coaching personnalisé</p>
            <h2 style={{ fontSize:'clamp(1.8rem,4vw,2.8rem)', fontWeight:900, color:'#fff', lineHeight:1.1, marginBottom:'1rem' }}>Transforme ta VMA en performances</h2>
            <p style={{ color:'rgba(255,255,255,.55)', fontSize:'1.05rem', marginBottom:'2.5rem', lineHeight:1.6 }}>Reçois un plan personnalisé basé sur ta VMA et ton objectif, que je construis et ajuste chaque semaine.</p>
            <button onClick={handleCTA} style={{ padding:'1.1rem 2.75rem', borderRadius:50, border:'none', background:`linear-gradient(135deg,${C.purple},${C.pink})`, color:'#fff', fontSize:'1.1rem', fontWeight:800, cursor:'pointer', boxShadow:'0 8px 32px rgba(232,35,122,.5)', marginBottom:'1rem' }}>Je rejoins The Ultimate Academy</button>
            <p style={{ color:'rgba(255,255,255,.3)', fontSize:'.82rem', margin:0 }}>30€/mois · Sans engagement · Résiliation en 1 clic</p>
          </div>
        </Inner>
      </section>

      {/* FAQ */}
      <section style={{ background:'#fff', padding:'5rem 1.5rem' }}>
        <Inner max={720}>
          <div style={{ textAlign:'center', marginBottom:'2.5rem' }}><SectionTag>Questions fréquentes</SectionTag><H2L>Tout ce que tu dois savoir sur la VMA</H2L></div>
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
      </section>

      {/* FOOTER CTA */}
      <section style={{ background:'#0C0A18', padding:'3.5rem 1.5rem', textAlign:'center' }}>
        <p style={{ color:'rgba(255,255,255,.5)', fontSize:'1.05rem', marginBottom:'1.25rem', fontStyle:'italic' }}>Ton objectif, ton plan, ton run.</p>
        <button onClick={handleCTA} style={{ padding:'.85rem 2.25rem', borderRadius:50, border:'none', background:`linear-gradient(135deg,${C.purple},${C.pink})`, color:'#fff', fontSize:'1rem', fontWeight:700, cursor:'pointer', boxShadow:'0 6px 24px rgba(232,35,122,.4)' }}>Démarrer mon coaching</button>
      </section>

      <ToolsFooter />
    </div>
  )
}
