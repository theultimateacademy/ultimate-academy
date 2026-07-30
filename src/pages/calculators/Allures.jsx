import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import Nav from '../../components/Nav'
import SiteFooter from '../../components/SiteFooter'
import PageHero, { gradText } from '../../components/PageHero'
import PricingCTA from '../../components/PricingCTA'
import { kmhToPace, DIST_PRESETS, VMA_ZONES } from '../../lib/runCalc'
import { TESTIMONIALS_ALLURES } from '../../lib/toolsContent'
import TestimonialsCarousel from '../../components/TestimonialsCarousel'

const FC_ZONES = [
  { n:1, name:'Récupération active',  pct:[.50,.60], color:'#60A5FA', desc:'Footing très lent, récupération active après une course' },
  { n:2, name:'Endurance de base',    pct:[.60,.70], color:'#34D399', desc:'Sorties longues, construction de la base aérobie' },
  { n:3, name:'Aérobie',              pct:[.70,.80], color:'#A3E635', desc:'Entraînement principal, améliore l\'efficacité cardiaque' },
  { n:4, name:'Seuil lactique',       pct:[.80,.90], color:'#FBBF24', desc:'Tempo run, fractionné : effort soutenu mais contrôlé' },
  { n:5, name:'VO2max / VMA',         pct:[.90,1.00], color:'#EF4444', desc:'Intervalles courts, effort maximal et difficile à maintenir' },
]
const ALLURE_TABLE = [
  { dist:'10 km', chrono:'40:00', allure:"4'00\"/km", note:'Sub-40' },
  { dist:'10 km', chrono:'45:00', allure:"4'30\"/km", note:'Bon niveau' },
  { dist:'10 km', chrono:'50:00', allure:"5'00\"/km", note:'Intermédiaire' },
  { dist:'Semi',  chrono:'1h30',  allure:"4'16\"/km", note:'Sub-1h30' },
  { dist:'Semi',  chrono:'1h45',  allure:"4'58\"/km", note:'Bon niveau' },
  { dist:'Semi',  chrono:'2h00',  allure:"5'41\"/km", note:'Accessible' },
  { dist:'Marathon', chrono:'3h30', allure:"4'58\"/km", note:'Objectif ambitieux' },
  { dist:'Marathon', chrono:'4h00', allure:"5'41\"/km", note:'Objectif classique' },
  { dist:'Marathon', chrono:'4h30', allure:"6'23\"/km", note:'Premier marathon' },
]
const FAQ = [
  { q:"Quelle allure pour l'endurance fondamentale ?", a:"L'endurance fondamentale se court à 65-75% de ta VMA, soit 60-70% de ta FC max. En pratique : tu dois pouvoir tenir une conversation sans essoufflement. C'est souvent plus lent que tu ne le penses ! Pour une VMA de 15 km/h, l'allure fondamentale est entre 5'20\" et 6'10\"/km. Cette zone représente 70-80% du volume des coureurs d'élite." },
  { q:"Comment calculer son allure marathon ?", a:"L'allure marathon correspond à environ 80% de ta VMA, ou 75-80% de ta FC max. Formule simple : allure marathon (sec/km) = 3600 / (VMA × 0.80). Avec une VMA de 15 km/h : 3600 / 12 = 300 sec/km = 5'00\"/km, soit un marathon en ~3h32. À l'entraînement, cours tes séances à allure spécifique marathon 2-3 semaines avant la course." },
  { q:"Fréquence cardiaque maximale : comment la trouver ?", a:"La formule 220−âge est une estimation statistique avec une marge d'erreur de ±10-15 bpm. Pour une FC max précise, effectue un test de terrain : après 3km d'échauffement, fais 2×3min à allure maximale avec 2min de récup. Relève ta FC à la fin du 2ème effort. Ou mieux : un test d'effort médical supervisé." },
  { q:"Doit-on toujours courir avec un cardio ?", a:"La montre cardio est un outil, pas une obligation. Elle est particulièrement utile pour contrôler l'intensité des sorties longues et éviter de courir trop vite en endurance fondamentale. L'allure au ressenti reste valable pour les runners expérimentés qui connaissent leurs sensations. Les débutants bénéficient davantage du contrôle cardio pour éviter la zone grise du trop-intense-mais-pas-assez." },
  { q:"Allure seuil : comment la trouver ?", a:"L'allure seuil anaérobie correspond à 82-88% de ta VMA, ou 80-85% de ta FC max. C'est l'allure à laquelle tu commences à accumuler du lactate plus vite que tu ne le recycles, effort soutenu mais contrôlé sur 20-60 minutes. Test pratique : cours 30 min à fond, l'allure soutenue sur les 20 dernières minutes correspond à ton allure de seuil." },
  { q:"Pourquoi courir lentement aide à progresser ?", a:"L'entraînement en endurance fondamentale développe des adaptations impossibles à obtenir en courant vite : augmentation des mitochondries, développement des capillaires, amélioration de l'utilisation des graisses comme carburant. Ces adaptations prennent du temps mais sont fondamentales. Les coureurs qui n'améliorent pas leurs performances courent souvent dans la zone grise : ni assez lent pour récupérer, ni assez vite pour progresser." },
]

const C = { purple:'#8B2FC9', pink:'#E8237A', dark:'#fff', light:'#0C0A18' }
const inputSt = { background:'rgba(255,255,255,.07)', border:'1px solid rgba(139,47,201,.25)', borderRadius:10, padding:'.55rem .75rem', color:C.dark, fontSize:'.9rem', outline:'none' }
const labelSt = { display:'block', fontSize:'.72rem', color:'rgba(255,255,255,.45)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:'.4rem' }
function Chip({ active, onClick, children }) {
  return <button onClick={onClick} style={{ padding:'.4rem .9rem', borderRadius:50, cursor:'pointer', fontSize:'.84rem', border:`1px solid ${active?'transparent':'rgba(139,47,201,.25)'}`, background:active?`linear-gradient(135deg,${C.purple},${C.pink})`:'#fff', color:active?'#fff':C.purple, fontWeight:active?600:400 }}>{children}</button>
}
function Inner({ max=1000, children, style }) { return <div style={{ maxWidth:max, margin:'0 auto', ...style }}>{children}</div> }
function SectionTag({ children, dark }) { return <p style={{ fontSize:'.75rem', letterSpacing:'.18em', textTransform:'uppercase', color:dark?'rgba(255,255,255,.6)':C.purple, marginBottom:'.75rem', fontWeight:600 }}>{children}</p> }
function H2L({ children }) { return <h2 style={{ fontSize:'clamp(1.6rem,3.5vw,2.4rem)', fontWeight:900, color:C.dark, lineHeight:1.15, marginBottom:'1.25rem' }}>{children}</h2> }
function H2D({ children }) { return <h2 style={{ fontSize:'clamp(1.6rem,3.5vw,2.4rem)', fontWeight:900, color:'#fff', lineHeight:1.15, marginBottom:'1.25rem' }}>{children}</h2> }

export default function AlluresCalculator() {
  const navigate = useNavigate()
  const location = useLocation()
  const calcRef  = useRef()

  const [vma,       setVma]      = useState('')
  const [fcMax,     setFcMax]    = useState('')
  const [age,       setAge]      = useState('')
  const [useAge,    setUseAge]   = useState(false)
  const [mode,      setMode]     = useState('vma')
  const [openFaq,   setOpenFaq]  = useState(null)

  useEffect(() => {
    const prev = document.title
    document.title = 'Calculateur allures running et zones FC | The Ultimate Academy'
    const meta = document.querySelector('meta[name="description"]')
    const prevM = meta?.content
    if (meta) meta.content = 'Trouve tes allures d\'entraînement selon ta VMA et tes zones de fréquence cardiaque. Entraîne-toi intelligemment.'
    if (location.state?.vma) {
      setVma(String(parseFloat(location.state.vma).toFixed(1)))
      setMode('vma')
    }
    return () => { document.title = prev; if (meta&&prevM!=null) meta.content = prevM }
  }, [])

  const vmaVal = parseFloat(vma)||0
  const fcEstimated = useAge ? (220-(parseInt(age)||0)) : 0
  const fcVal = useAge ? fcEstimated : (parseInt(fcMax)||0)
  const handleCTA = () => navigate('/register')

  return (
    <div style={{ background:'#000', color:'#fff', overflowX:'hidden' }}>
      <Nav />

      <PageHero
        badge="Allures running"
        title={<><span style={gradText}>Allures d'entraînement</span> &amp; zones FC</>}
        subtitle="Entraîne-toi dans les bonnes zones pour progresser sans te blesser, avec ta VMA et ta fréquence cardiaque"
        backTo="/calculateur" backLabel="Calculateurs"
      >
        <button onClick={()=>calcRef.current?.scrollIntoView({behavior:'smooth'})} style={{ padding:'1rem 2.5rem', borderRadius:50, border:'none', background:`linear-gradient(135deg,${C.purple},${C.pink})`, color:'#fff', fontSize:'1.05rem', fontWeight:700, cursor:'pointer', boxShadow:'0 8px 32px rgba(232,35,122,.5)' }}>Calculer mes allures ↓</button>
      </PageHero>

      {/* CALCULATOR */}
      <section ref={calcRef} id="outil" style={{ background:'#000', padding:'5rem 1.5rem' }}>
        <Inner max={780}>
          <div style={{ textAlign:'center', marginBottom:'2.5rem' }}>
            <SectionTag>Calculateur d'allures</SectionTag>
            <h2 style={{ fontSize:'clamp(1.5rem,3vw,2rem)', fontWeight:900, color:C.dark, marginBottom:'.5rem' }}>Tes zones <span style={gradText}>personnalisées</span></h2>
            <div style={{ display:'flex', gap:'.5rem', justifyContent:'center', flexWrap:'wrap' }}>
              <Chip active={mode==='vma'} onClick={()=>setMode('vma')}>⚡ Depuis ma VMA</Chip>
              <Chip active={mode==='fc'} onClick={()=>setMode('fc')}>❤️ Zones fréquence cardiaque</Chip>
            </div>
          </div>

          <div style={{ background:'rgba(255,255,255,.05)', borderRadius:20, padding:'2rem', boxShadow:'0 8px 40px rgba(139,47,201,.1)', border:'1px solid rgba(139,47,201,.12)' }}>
            {mode==='vma' ? (
              <>
                <p style={{ fontWeight:700, color:C.dark, marginBottom:'1rem', fontSize:'.95rem' }}>Ta VMA (km/h)</p>
                <div style={{ display:'flex', alignItems:'center', gap:'.75rem', marginBottom:'1.5rem', flexWrap:'wrap' }}>
                  <input type="number" min="8" max="30" step=".1" placeholder="Ex : 15" value={vma} onChange={e=>setVma(e.target.value)} style={{ ...inputSt, width:110 }}/>
                  <span style={{ color:'rgba(255,255,255,.45)', fontSize:'.85rem' }}>km/h</span>
                  <Link to="/calculateur/vma" style={{ color:C.purple, fontSize:'.82rem', textDecoration:'none' }}>Je ne connais pas ma VMA →</Link>
                </div>
                {vmaVal>0 ? (
                  <div style={{ overflow:'hidden', overflowX:'auto', borderRadius:12, border:'1px solid rgba(139,47,201,.12)' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'.875rem' }}>
                      <thead><tr style={{ background:'#1a1230' }}>
                        {['Zone','Nom','% VMA','Vitesse','Allure','Objectif'].map(h=><th key={h} style={{ padding:'.6rem .75rem', textAlign:'left', color:'rgba(255,255,255,.75)', fontWeight:600, fontSize:'.72rem', textTransform:'uppercase', letterSpacing:'.07em' }}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {VMA_ZONES.map(z=>{
                          const lo=vmaVal*z.pct[0], hi=vmaVal*z.pct[1]
                          const descs = ['Récupération','Sortie longue','Prépa marathon','Seuil / tempo','Fractionné VMA','Sur-vitesse']
                          return <tr key={z.n} style={{ borderTop:'1px solid rgba(139,47,201,.07)' }}>
                            <td style={{ padding:'.6rem .75rem' }}><span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:24, height:24, borderRadius:'50%', background:z.color+'25', color:z.color, fontSize:'.8rem', fontWeight:700 }}>{z.n}</span></td>
                            <td style={{ padding:'.6rem .75rem', color:z.color, fontWeight:600, fontSize:'.85rem' }}>{z.name}</td>
                            <td style={{ padding:'.6rem .75rem', color:'rgba(255,255,255,.4)', fontVariantNumeric:'tabular-nums' }}>{Math.round(z.pct[0]*100)}–{Math.round(z.pct[1]*100)}%</td>
                            <td style={{ padding:'.6rem .75rem', color:C.dark, fontVariantNumeric:'tabular-nums', fontSize:'.85rem' }}>{lo.toFixed(1)}–{hi.toFixed(1)}</td>
                            <td style={{ padding:'.6rem .75rem', color:C.dark, fontVariantNumeric:'tabular-nums', fontSize:'.85rem' }}>{kmhToPace(hi)}–{kmhToPace(lo)}</td>
                            <td style={{ padding:'.6rem .75rem', color:'rgba(255,255,255,.45)', fontSize:'.8rem' }}>{descs[z.n-1]}</td>
                          </tr>
                        })}
                      </tbody>
                    </table>
                  </div>
                ):(
                  <div style={{ padding:'2.5rem', textAlign:'center', borderRadius:12, background:'rgba(139,47,201,.04)', border:'1px dashed rgba(139,47,201,.15)' }}>
                    <p style={{ color:'rgba(255,255,255,.35)', margin:0 }}>Entre ta VMA pour voir tes zones d'entraînement</p>
                  </div>
                )}
              </>
            ):(
              <>
                <p style={{ fontWeight:700, color:C.dark, marginBottom:'1rem', fontSize:'.95rem' }}>Fréquence cardiaque maximale</p>
                <div style={{ display:'flex', gap:'1.5rem', flexWrap:'wrap', marginBottom:'1.5rem', alignItems:'flex-end' }}>
                  <div><label style={labelSt}>FC max connue (bpm)</label><input type="number" min="100" max="230" placeholder="Ex : 185" value={fcMax} onChange={e=>{setFcMax(e.target.value);setUseAge(false)}} disabled={useAge} style={{ ...inputSt, width:110, opacity:useAge?.4:1 }}/></div>
                  <div><label style={labelSt}>Ou estimer par l'âge</label><div style={{ display:'flex', gap:'.5rem', alignItems:'center' }}><input type="number" min="15" max="80" placeholder="Âge" value={age} onChange={e=>{setAge(e.target.value);setUseAge(true)}} style={{ ...inputSt, width:90 }}/><span style={{ color:'rgba(255,255,255,.45)', fontSize:'.82rem' }}>ans → {useAge&&age?`FC max ~${fcEstimated} bpm`:''}</span></div></div>
                </div>
                {fcVal>0 ? (
                  <div style={{ overflow:'hidden', overflowX:'auto', borderRadius:12, border:'1px solid rgba(139,47,201,.12)' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'.875rem' }}>
                      <thead><tr style={{ background:'#1a1230' }}>
                        {['Zone','Nom','% FC max','FC (bpm)','Usage'].map(h=><th key={h} style={{ padding:'.6rem .85rem', textAlign:'left', color:'rgba(255,255,255,.75)', fontWeight:600, fontSize:'.72rem', textTransform:'uppercase', letterSpacing:'.07em' }}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {FC_ZONES.map(z=>{
                          const lo=Math.round(fcVal*z.pct[0]), hi=Math.round(fcVal*z.pct[1])
                          return <tr key={z.n} style={{ borderTop:'1px solid rgba(139,47,201,.07)' }}>
                            <td style={{ padding:'.6rem .85rem' }}><span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:24, height:24, borderRadius:'50%', background:z.color+'25', color:z.color, fontSize:'.8rem', fontWeight:700 }}>{z.n}</span></td>
                            <td style={{ padding:'.6rem .85rem', color:z.color, fontWeight:600 }}>{z.name}</td>
                            <td style={{ padding:'.6rem .85rem', color:'rgba(255,255,255,.45)', fontVariantNumeric:'tabular-nums' }}>{Math.round(z.pct[0]*100)}–{Math.round(z.pct[1]*100)}%</td>
                            <td style={{ padding:'.6rem .85rem', color:C.dark, fontVariantNumeric:'tabular-nums', fontWeight:600 }}>{lo}–{hi}</td>
                            <td style={{ padding:'.6rem .85rem', color:'rgba(255,255,255,.5)', fontSize:'.82rem' }}>{z.desc}</td>
                          </tr>
                        })}
                      </tbody>
                    </table>
                  </div>
                ):(
                  <div style={{ padding:'2.5rem', textAlign:'center', borderRadius:12, background:'rgba(139,47,201,.04)', border:'1px dashed rgba(139,47,201,.15)' }}>
                    <p style={{ color:'rgba(255,255,255,.35)', margin:0 }}>Entre ta FC max ou ton âge pour voir tes zones cardiaques</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Tableau temps VMA par distance */}
          {vmaVal>0 && (
            <div style={{ marginTop:'2rem', background:'rgba(255,255,255,.05)', borderRadius:20, padding:'2rem', boxShadow:'0 4px 24px rgba(139,47,201,.08)', border:'1px solid rgba(139,47,201,.1)' }}>
              <p style={{ fontWeight:800, color:C.dark, marginBottom:'.4rem', fontSize:'1.05rem' }}>Tes temps exacts pour chaque distance</p>
              <p style={{ color:'rgba(255,255,255,.5)', fontSize:'.85rem', marginBottom:'1.25rem' }}>Basé sur ta VMA de {vmaVal} km/h — temps pour chaque distance en min/km selon l'intensité</p>
              <div style={{ overflow:'hidden', overflowX:'auto', borderRadius:12, border:'1px solid rgba(139,47,201,.1)' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'.78rem', minWidth:720 }}>
                  <thead>
                    <tr style={{ background:'#1a1230' }}>
                      <th style={{ padding:'.55rem .75rem', textAlign:'left', color:'rgba(255,255,255,.8)', fontWeight:700, fontSize:'.72rem', whiteSpace:'nowrap', position:'sticky', left:0, background:'#1a1230', zIndex:1 }}>Distance</th>
                      {[60,65,70,75,80,85,90,95,100,105,110].map(p=>(
                        <th key={p} style={{ padding:'.55rem .5rem', textAlign:'center', color:'rgba(255,255,255,.8)', fontWeight:600, fontSize:'.72rem', whiteSpace:'nowrap' }}>{p}%</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {label:'50 m', km:0.05},
                      {label:'100 m', km:0.1},
                      {label:'200 m', km:0.2},
                      {label:'300 m', km:0.3},
                      {label:'400 m', km:0.4},
                      {label:'500 m', km:0.5},
                      {label:'600 m', km:0.6},
                      {label:'800 m', km:0.8},
                      {label:'1 km', km:1},
                      {label:'1 200 m', km:1.2},
                      {label:'1,5 km', km:1.5},
                      {label:'2 km', km:2},
                      {label:'3 km', km:3},
                      {label:'5 km', km:5},
                      {label:'10 km', km:10},
                    ].map((dist,i)=>(
                      <tr key={dist.km} style={{ borderTop:'1px solid rgba(139,47,201,.07)', background:i%2===0?'transparent':'rgba(139,47,201,.025)' }}>
                        <td style={{ padding:'.45rem .75rem', color:C.purple, fontWeight:700, whiteSpace:'nowrap', position:'sticky', left:0, background:i%2===0?'#fff':'#faf8ff', zIndex:1 }}>{dist.label}</td>
                        {[60,65,70,75,80,85,90,95,100,105,110].map(p=>{
                          const secs = Math.round(dist.km / (vmaVal * p / 100) * 3600)
                          const hh = Math.floor(secs / 3600)
                          const mm = Math.floor((secs % 3600) / 60)
                          const ss = secs % 60
                          const t = hh>0 ? `${hh}h${String(mm).padStart(2,'0')}'` : `${mm}'${String(ss).padStart(2,'0')}`
                          const isVMA = p===100
                          return <td key={p} style={{ padding:'.45rem .5rem', textAlign:'center', color:isVMA?C.purple:C.dark, fontWeight:isVMA?700:400, fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap', background:isVMA?'rgba(139,47,201,.06)':'transparent' }}>{t}</td>
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p style={{ color:'rgba(255,255,255,.35)', fontSize:'.75rem', marginTop:'.75rem', textAlign:'center' }}>La colonne 100% correspond à ton allure VMA · Les pourcentages inférieurs à 65% = endurance fondamentale</p>
            </div>
          )}

          {/* Allure selon objectif */}
          <div style={{ marginTop:'2rem', background:'rgba(255,255,255,.05)', borderRadius:20, padding:'2rem', boxShadow:'0 4px 24px rgba(139,47,201,.08)', border:'1px solid rgba(139,47,201,.1)' }}>
            <p style={{ fontWeight:800, color:C.dark, marginBottom:'.4rem', fontSize:'1.05rem' }}>Quelle allure selon ton objectif chrono ?</p>
            <p style={{ color:'rgba(255,255,255,.5)', fontSize:'.85rem', marginBottom:'1.25rem' }}>Repères pour chaque objectif courant</p>
            <div style={{ overflow:'hidden', overflowX:'auto', borderRadius:12, border:'1px solid rgba(139,47,201,.1)' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'.875rem', minWidth:420 }}>
                <thead><tr style={{ background:'#1a1230' }}>
                  {['Distance','Objectif','Allure à tenir','Niveau'].map(h=><th key={h} style={{ padding:'.6rem .85rem', textAlign:'left', color:'rgba(255,255,255,.75)', fontWeight:600, fontSize:'.72rem', textTransform:'uppercase', letterSpacing:'.07em', whiteSpace:'nowrap' }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {ALLURE_TABLE.map((row,i)=>(
                    <tr key={i} style={{ borderTop:'1px solid rgba(139,47,201,.07)', background:i%2===0?'transparent':'rgba(139,47,201,.02)' }}>
                      <td style={{ padding:'.6rem .85rem', color:C.purple, fontWeight:600, whiteSpace:'nowrap' }}>{row.dist}</td>
                      <td style={{ padding:'.6rem .85rem', color:C.dark, fontWeight:600, fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap' }}>{row.chrono}</td>
                      <td style={{ padding:'.6rem .85rem', color:C.dark, fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap' }}>{row.allure}</td>
                      <td style={{ padding:'.6rem .85rem', color:'rgba(255,255,255,.45)', fontSize:'.82rem', whiteSpace:'nowrap' }}>{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Inner>
      </section>

      {/* POURQUOI S'ENTRAÎNER PAR ZONES */}
      <section style={{ background:'#0C0A18', padding:'5rem 1.5rem' }}>
        <Inner>
          <div style={{ display:'flex', gap:'3rem', alignItems:'center', flexWrap:'wrap' }}>
            <div style={{ flex:'1 1 380px', borderRadius:20, overflow:'hidden', maxHeight:440 }}>
              <svg viewBox="0 0 440 300" style={{width:'100%',height:'100%',display:'block',minHeight:280}}>
                <defs>
                  <linearGradient id="ag1" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#8B2FC9"/>
                    <stop offset="100%" stopColor="#E8237A"/>
                  </linearGradient>
                </defs>
                <rect width="440" height="300" fill="#EDE8F7"/>
                <text x="220" y="28" textAnchor="middle" fontSize="12" fill="#1a1230" fontWeight="700" fontFamily="system-ui,sans-serif">La règle des 80/20</text>
                <text x="220" y="46" textAnchor="middle" fontSize="10" fill="rgba(26,18,48,.4)" fontFamily="system-ui,sans-serif">Répartition optimale de l'entraînement</text>
                <rect x="40" y="62" width="288" height="80" rx="10" fill="#34D39920"/>
                <rect x="40" y="62" width="288" height="80" rx="10" stroke="#34D39950" strokeWidth="1.5" fill="none"/>
                <text x="184" y="96" textAnchor="middle" fontSize="22" fill="#34D399" fontWeight="900" fontFamily="system-ui,sans-serif">80%</text>
                <text x="184" y="116" textAnchor="middle" fontSize="11" fill="#34D399" fontWeight="600" fontFamily="system-ui,sans-serif">Basse intensité · Zones 1 &amp; 2</text>
                <text x="184" y="130" textAnchor="middle" fontSize="9.5" fill="rgba(26,18,48,.4)" fontFamily="system-ui,sans-serif">Endurance fondamentale · Récupération</text>
                <rect x="336" y="62" width="64" height="80" rx="10" fill="url(#ag1)" opacity=".18"/>
                <rect x="336" y="62" width="64" height="80" rx="10" stroke="url(#ag1)" strokeWidth="1.5" fill="none" opacity=".5"/>
                <text x="368" y="98" textAnchor="middle" fontSize="18" fill="#8B2FC9" fontWeight="900" fontFamily="system-ui,sans-serif">20%</text>
                <text x="368" y="114" textAnchor="middle" fontSize="9" fill="#8B2FC9" fontWeight="600" fontFamily="system-ui,sans-serif">Zones 4-5</text>
                <text x="368" y="127" textAnchor="middle" fontSize="8.5" fill="rgba(26,18,48,.4)" fontFamily="system-ui,sans-serif">Intensif</text>
                <line x1="40" y1="162" x2="400" y2="162" stroke="rgba(139,47,201,.1)" strokeWidth="1"/>
                <text x="220" y="185" textAnchor="middle" fontSize="11.5" fill="#1a1230" fontWeight="700" fontFamily="system-ui,sans-serif">Pourquoi la Zone 3 est à éviter ?</text>
                <rect x="40" y="193" width="360" height="64" rx="10" fill="rgba(251,191,36,.1)" stroke="rgba(251,191,36,.3)" strokeWidth="1.5"/>
                <text x="60" y="214" fontSize="10.5" fill="#B45309" fontWeight="600" fontFamily="system-ui,sans-serif">⚠ La zone grise (Zone 3) accumule la fatigue</text>
                <text x="60" y="231" fontSize="9.5" fill="rgba(26,18,48,.5)" fontFamily="system-ui,sans-serif">Ni assez facile pour récupérer, ni assez dur pour progresser.</text>
                <text x="60" y="247" fontSize="9.5" fill="rgba(26,18,48,.5)" fontFamily="system-ui,sans-serif">C'est là que stagnent la plupart des coureurs amateurs.</text>
                <text x="220" y="285" textAnchor="middle" fontSize="9.5" fill="rgba(26,18,48,.25)" fontFamily="system-ui,sans-serif">Source : science du sport appliquée, modèle polarisé</text>
              </svg>
            </div>
            <div style={{ flex:'1 1 300px' }}>
              <SectionTag>S'entraîner intelligemment</SectionTag>
              <H2L>Pourquoi s'entraîner par <span style={gradText}>zones</span> ?</H2L>
              <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem', marginBottom:'2rem', color:'rgba(255,255,255,.7)', fontSize:'.9rem', lineHeight:1.7 }}>
                <p style={{ margin:0, textAlign:'justify' }}>L'erreur la plus courante chez les coureurs amateurs : courir <strong style={{ color:C.dark }}>trop vite en endurance et trop lentement en fractionné</strong>. Résultat : fatigue chronique, stagnation des chronos, risque de blessure accru.</p>
                <p style={{ margin:0, textAlign:'justify' }}>La règle des <strong style={{ color:C.dark }}>80/20</strong> est prouvée par la science du sport : 80% du volume à basse intensité (zones 1-2), 20% à haute intensité (zones 4-5). C'est la répartition des meilleurs coureurs mondiaux, des récréatifs aux élites.</p>
                <p style={{ margin:0, textAlign:'justify' }}>En connaissant précisément tes zones, tu <strong style={{ color:C.dark }}>optimises chaque séance</strong> : les sorties longues reconstituent les réserves, les séances de seuil repoussent tes limites, le fractionné développe ta puissance maximale.</p>
              </div>
              <button onClick={handleCTA} style={{ padding:'.85rem 2rem', borderRadius:50, border:'none', background:`linear-gradient(135deg,${C.purple},${C.pink})`, color:'#fff', fontWeight:700, cursor:'pointer', fontSize:'.95rem', boxShadow:'0 6px 24px rgba(232,35,122,.4)' }}>Je rejoins The Ultimate Academy</button>
            </div>
          </div>
        </Inner>
      </section>

      {/* CONSEIL POLARISATION */}
      <section style={{ background:'#0C0A18', padding:'5rem 1.5rem' }}>
        <Inner>
          <div style={{ display:'flex', gap:'3rem', alignItems:'center', flexWrap:'wrap', flexDirection:'row-reverse' }}>
            <div style={{ flex:'1 1 380px', borderRadius:20, overflow:'hidden', maxHeight:440 }}>
              <svg viewBox="0 0 440 300" style={{width:'100%',height:'100%',display:'block',minHeight:280}}>
                <defs>
                  <linearGradient id="ag2" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#8B2FC9"/>
                    <stop offset="100%" stopColor="#E8237A"/>
                  </linearGradient>
                </defs>
                <rect width="440" height="300" fill="#12102a"/>
                <text x="220" y="26" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,.3)" fontFamily="system-ui,sans-serif">Modèle d'entraînement polarisé</text>
                <text x="90" y="58" textAnchor="middle" fontSize="9.5" fill="#34D399" fontFamily="system-ui,sans-serif" fontWeight="600">Zones 1–2</text>
                <text x="90" y="70" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,.65)" fontFamily="system-ui,sans-serif">Facile</text>
                <rect x="55" y="78" width="70" height="155" rx="8" fill="#34D39930"/>
                <rect x="55" y="78" width="70" height="155" rx="8" stroke="#34D39960" strokeWidth="1.5" fill="none"/>
                <text x="90" y="160" textAnchor="middle" fontSize="20" fill="#34D399" fontWeight="900" fontFamily="system-ui,sans-serif">80%</text>
                <text x="220" y="58" textAnchor="middle" fontSize="9.5" fill="#FBBF24" fontFamily="system-ui,sans-serif" fontWeight="600">Zone 3</text>
                <text x="220" y="70" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,.65)" fontFamily="system-ui,sans-serif">À éviter</text>
                <rect x="185" y="188" width="70" height="45" rx="8" fill="rgba(251,191,36,.18)"/>
                <rect x="185" y="188" width="70" height="45" rx="8" stroke="rgba(251,191,36,.4)" strokeWidth="1.5" fill="none"/>
                <text x="220" y="215" textAnchor="middle" fontSize="13" fill="#FBBF24" fontWeight="900" fontFamily="system-ui,sans-serif">~0%</text>
                <line x1="185" y1="188" x2="255" y2="188" stroke="#FBBF2440" strokeWidth="1"/>
                <text x="350" y="58" textAnchor="middle" fontSize="9.5" fill="#C084FC" fontFamily="system-ui,sans-serif" fontWeight="600">Zones 4–5</text>
                <text x="350" y="70" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,.65)" fontFamily="system-ui,sans-serif">Intense</text>
                <rect x="315" y="138" width="70" height="95" rx="8" fill="url(#ag2)" opacity=".35"/>
                <rect x="315" y="138" width="70" height="95" rx="8" stroke="url(#ag2)" strokeWidth="1.5" fill="none" opacity=".8"/>
                <text x="350" y="192" textAnchor="middle" fontSize="18" fill="#C084FC" fontWeight="900" fontFamily="system-ui,sans-serif">20%</text>
                <line x1="40" y1="245" x2="400" y2="245" stroke="rgba(255,255,255,.12)" strokeWidth="1"/>
                <text x="220" y="265" textAnchor="middle" fontSize="10.5" fill="rgba(255,255,255,.7)" fontFamily="system-ui,sans-serif" fontWeight="600">Entraîne vraiment lentement · Entraîne vraiment fort</text>
                <text x="220" y="283" textAnchor="middle" fontSize="9.5" fill="rgba(255,255,255,.5)" fontFamily="system-ui,sans-serif">La clé de la progression durable</text>
              </svg>
            </div>
            <div style={{ flex:'1 1 300px' }}>
              <SectionTag dark>Mon conseil</SectionTag>
              <H2D>La <span style={gradText}>polarisation</span> de l'entraînement</H2D>
              <div style={{ color:'rgba(255,255,255,.7)', fontSize:'.9rem', lineHeight:1.8, display:'flex', flexDirection:'column', gap:'1rem' }}>
                <p style={{ margin:0, textAlign:'justify' }}>La <strong style={{ color:'#fff' }}>polarisation</strong> est l'approche adoptée par tous les grands entraîneurs : concentrer les efforts soit dans la zone 1-2 (facile), soit dans la zone 4-5 (dur), en évitant la zone 3 (modérée).</p>
                <p style={{ margin:0, textAlign:'justify' }}>La zone 3, ni trop facile ni assez intense, est la <strong style={{ color:'#fff' }}>zone grise</strong> qui accumule la fatigue sans produire les adaptations des zones hautes. C'est là que stagnent la plupart des amateurs.</p>
                <p style={{ margin:0, textAlign:'justify' }}>La solution : <strong style={{ color:'#fff' }}>courir vraiment lentement le plus souvent</strong>, et se donner à fond lors des séances intenses. Ce contraste est la clé de la progression durable.</p>
              </div>
              <div style={{ marginTop:'1.5rem', display:'flex', gap:'1rem', flexWrap:'wrap' }}>
                <Link to="/calculateur/vma" style={{ color:'#C084FC', fontSize:'.85rem', textDecoration:'none' }}>→ Calculer ma VMA</Link>
                <Link to="/calculateur" style={{ color:'#C084FC', fontSize:'.85rem', textDecoration:'none' }}>→ Temps de passage</Link>
              </div>
            </div>
          </div>
        </Inner>
      </section>

      {/* TÉMOIGNAGES */}
      <section style={{ background:'#000', padding:'5rem 1.5rem' }}>
        <Inner>
          <div style={{ textAlign:'center', marginBottom:'2.5rem' }}><SectionTag>Témoignages</SectionTag><H2L>Ce que disent nos <span style={gradText}>athlètes</span></H2L></div>
        </Inner>
        <TestimonialsCarousel testimonials={TESTIMONIALS_ALLURES} />
      </section>

      <PricingCTA
        title={<>Entraîne-toi dans les <span style={{ background:'linear-gradient(135deg,#8B2FC9,#E8237A)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', display:'inline' }}>bonnes zones</span></>}
        subtitle="Reçois un plan structuré sur mesure, basé sur ta VMA et tes zones, que je construis et ajuste chaque semaine."
      />

      {/* FAQ */}
      <section style={{ background:'#0C0A18', padding:'5rem 1.5rem' }}>
        <Inner max={720}>
          <div style={{ textAlign:'center', marginBottom:'2.5rem' }}><SectionTag>Questions fréquentes</SectionTag><H2L>Tout ce que tu dois savoir sur les <span style={gradText}>allures</span></H2L></div>
          {FAQ.map((item,i)=>(
            <div key={i} style={{ borderBottom:'1px solid rgba(139,47,201,.1)' }}>
              <button onClick={()=>setOpenFaq(openFaq===i?null:i)} style={{ width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'1.1rem 0', background:'none', border:'none', cursor:'pointer', color:C.dark, fontSize:'.95rem', fontWeight:600, textAlign:'left', gap:'1rem' }}>
                {item.q}
                <svg width="14" height="14" viewBox="0 0 12 12" fill="none" style={{ flexShrink:0, transition:'transform .2s', transform:openFaq===i?'rotate(180deg)':'none' }}><path d="M1 4l5 5 5-5" stroke={C.purple} strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
              {openFaq===i&&<p style={{ margin:'0 0 1.25rem', color:'rgba(255,255,255,.65)', fontSize:'.9rem', lineHeight:1.75, textAlign:'justify' }}>{item.a}</p>}
            </div>
          ))}
        </Inner>
      </section>


      <SiteFooter />
    </div>
  )
}
