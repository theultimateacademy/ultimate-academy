import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Nav from '../../components/Nav'
import SiteFooter from '../../components/SiteFooter'
import PageHero, { gradText } from '../../components/PageHero'
import PricingCTA from '../../components/PricingCTA'

const C = { purple:'#8B2FC9', pink:'#E8237A', dark:'#1a1230', light:'#F8F5FF' }
const inputSt = { background:'#fff', border:'1px solid rgba(139,47,201,.25)', borderRadius:10, padding:'.55rem .75rem', color:C.dark, fontSize:'.9rem', outline:'none', width:80 }
const labelSt = { display:'block', fontSize:'.72rem', color:'rgba(26,18,48,.45)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:'.35rem' }
function Inner({ max=1000, children, style }) { return <div style={{ maxWidth:max, margin:'0 auto', ...style }}>{children}</div> }
function SectionTag({ children, dark }) { return <p style={{ fontSize:'.75rem', letterSpacing:'.18em', textTransform:'uppercase', color:dark?'rgba(255,255,255,.6)':C.purple, marginBottom:'.75rem', fontWeight:600 }}>{children}</p> }
function H2L({ children }) { return <h2 style={{ fontSize:'clamp(1.6rem,3.5vw,2.4rem)', fontWeight:900, color:C.dark, lineHeight:1.15, marginBottom:'1.25rem' }}>{children}</h2> }
function H2D({ children }) { return <h2 style={{ fontSize:'clamp(1.6rem,3.5vw,2.4rem)', fontWeight:900, color:'#fff', lineHeight:1.15, marginBottom:'1.25rem' }}>{children}</h2> }

const CSS_ZONES = [
  { n:1, name:'Récupération',     pct:[0, .78],  color:'#60A5FA', desc:'Nage très lente, récupération active entre les séries' },
  { n:2, name:'Endurance',        pct:[.78,.88], color:'#34D399', desc:'Volume aérobie, base d\'endurance en natation' },
  { n:3, name:'Aérobie soutenu',  pct:[.88,.96], color:'#A3E635', desc:'Travail sous le seuil, progression de la capacité aérobie' },
  { n:4, name:'Seuil / CSS',      pct:[.96,1.04],color:'#FBBF24', desc:'Ta vitesse critique — l\'allure cible des blocs CSS' },
  { n:5, name:'VO₂max',           pct:[1.04,1.15],color:'#EF4444', desc:'Intervalles courts à haute intensité, 50-200m' },
]

const SWIM_DISTS = [
  { label:'50 m',     m:50 },
  { label:'100 m',    m:100 },
  { label:'200 m',    m:200 },
  { label:'400 m',    m:400 },
  { label:'750 m',    m:750,  note:'Sprint Tri' },
  { label:'1 500 m',  m:1500, note:'Olympique' },
  { label:'1 900 m',  m:1900, note:'Half Iron' },
  { label:'3 800 m',  m:3800, note:'Ironman' },
]

const FAQ = [
  { q:'Faut-il vraiment faire les deux distances à fond ?', a:'Oui, absolument. Le calcul du CSS repose sur la différence de temps entre le 200m et le 400m, tous deux réalisés à effort maximal. Si tu ménages l\'un des deux efforts, ta CSS sera faussée. Récupère 10 à 15 minutes entre les deux tests — une récupération incomplète biaisera également le résultat.' },
  { q:'À quelle fréquence recalculer sa CSS ?', a:'La CSS reflète ton niveau aérobie en natation. Elle évolue avec l\'entraînement, généralement tous les 6 à 8 semaines chez un nageur régulier. Recalcule-la après chaque bloc d\'entraînement intense, ou si tu perçois une progression ou une régression notable de ta nage.' },
  { q:'Comment entraîner sa CSS ?', a:'Les séries de CSS classiques sont réalisées avec des répétitions de 50 à 200m à l\'allure CSS, avec peu de récupération (10 à 20s). Par exemple : 10×100m à CSS avec 15s de repos. C\'est l\'équivalent natation des séances tempo en course à pied.' },
  { q:'CSS et FINA T-score : quelle différence ?', a:'La CSS est un indicateur de performance absolue propre à toi, basé sur tes propres tests. Le FINA T-score (ou FINA Points) est une échelle de classement mondial comparant ta performance à des références élite. La CSS est l\'outil d\'entraînement, le T-score est l\'outil de comparaison compétitive.' },
  { q:'Ma CSS est-elle valable pour l\'eau libre ?', a:'La CSS est mesurée en piscine (eau calme, virages). En eau libre, les conditions extérieures (vagues, combinaison, navigation) modifient les allures. En pratique, tes temps de course en eau libre seront légèrement différents de la prédiction CSS pure — mais les zones d\'intensité restent pertinentes comme repères de ressenti.' },
]

function secToMMSS(s) {
  const m = Math.floor(s / 60), ss = Math.round(s % 60)
  return `${m}'${String(ss).padStart(2,'0')}`
}
function parseTime(min, sec) {
  return (parseInt(min)||0) * 60 + (parseInt(sec)||0)
}

export default function CSSCalculator() {
  const navigate = useNavigate()
  const calcRef = useRef()
  const [min200, setMin200] = useState(''); const [sec200, setSec200] = useState('')
  const [min400, setMin400] = useState(''); const [sec400, setSec400] = useState('')
  const [openFaq, setOpenFaq] = useState(null)

  useEffect(() => {
    const prev = document.title
    document.title = 'Calculateur CSS natation — Vitesse Critique de Nage | The Ultimate Academy'
    const meta = document.querySelector('meta[name="description"]')
    const prevM = meta?.content
    if (meta) meta.content = 'Calcule ta CSS (Critical Swim Speed) à partir de tes tests 200m et 400m. Obtiens tes zones d\'entraînement natation.'
    return () => { document.title = prev; if (meta&&prevM!=null) meta.content = prevM }
  }, [])

  const t200 = parseTime(min200, sec200)
  const t400 = parseTime(min400, sec400)
  const valid = t200 > 0 && t400 > 0 && t400 > t200
  const cssPace = valid ? (t400 - t200) / 2 : 0  // sec/100m
  const cssSpeed = cssPace > 0 ? 100 / cssPace : 0  // m/s * 100 = cm/s => actually m per second

  return (
    <div style={{ background:'#000', color:'#fff', overflowX:'hidden' }}>
      <Nav />

      <PageHero
        badge="Natation"
        title={<>CSS — <span style={gradText}>Vitesse Critique</span> de Nage</>}
        subtitle="Calcule ta Critical Swim Speed à partir de deux tests maximal et découvre tes zones d'intensité en natation"
      >
        <button onClick={()=>calcRef.current?.scrollIntoView({behavior:'smooth'})} style={{ padding:'1rem 2.5rem', borderRadius:50, border:'none', background:`linear-gradient(135deg,${C.purple},${C.pink})`, color:'#fff', fontSize:'1.05rem', fontWeight:700, cursor:'pointer', boxShadow:'0 8px 32px rgba(232,35,122,.5)' }}>Calculer ma CSS ↓</button>
      </PageHero>

      {/* CALCULATOR */}
      <section ref={calcRef} id="outil" style={{ background:C.light, padding:'5rem 1.5rem' }}>
        <Inner max={760}>
          <div style={{ textAlign:'center', marginBottom:'2.5rem' }}>
            <SectionTag>Calculateur CSS</SectionTag>
            <h2 style={{ fontSize:'clamp(1.5rem,3vw,2rem)', fontWeight:900, color:C.dark, marginBottom:'.5rem' }}>Tes allures natation personnalisées</h2>
            <p style={{ color:'rgba(26,18,48,.5)', fontSize:'.9rem' }}>Deux tests suffisent — un 200m et un 400m à allure maximale, avec 10-15 min de récupération entre les deux</p>
          </div>

          <div style={{ background:'#fff', borderRadius:20, padding:'2rem', boxShadow:'0 8px 40px rgba(139,47,201,.1)', border:'1px solid rgba(139,47,201,.12)' }}>
            <p style={{ fontWeight:700, color:C.dark, marginBottom:'1.5rem', fontSize:'.95rem' }}>Tes temps de test (effort maximal)</p>
            <div style={{ display:'flex', gap:'2rem', flexWrap:'wrap', marginBottom:'1.75rem' }}>
              <div>
                <label style={labelSt}>Ton 200m (min : sec)</label>
                <div style={{ display:'flex', alignItems:'center', gap:'.4rem' }}>
                  <input type="number" min="0" max="10" placeholder="3" value={min200} onChange={e=>setMin200(e.target.value)} style={inputSt}/>
                  <span style={{ color:'rgba(26,18,48,.4)', fontWeight:700 }}>:</span>
                  <input type="number" min="0" max="59" placeholder="30" value={sec200} onChange={e=>setSec200(e.target.value)} style={inputSt}/>
                </div>
              </div>
              <div>
                <label style={labelSt}>Ton 400m (min : sec)</label>
                <div style={{ display:'flex', alignItems:'center', gap:'.4rem' }}>
                  <input type="number" min="0" max="20" placeholder="7" value={min400} onChange={e=>setMin400(e.target.value)} style={inputSt}/>
                  <span style={{ color:'rgba(26,18,48,.4)', fontWeight:700 }}>:</span>
                  <input type="number" min="0" max="59" placeholder="20" value={sec400} onChange={e=>setSec400(e.target.value)} style={inputSt}/>
                </div>
              </div>
            </div>

            {valid ? (
              <>
                {/* CSS result */}
                <div style={{ background:`linear-gradient(135deg,rgba(139,47,201,.1),rgba(232,35,122,.07))`, borderRadius:16, padding:'1.5rem', border:'1px solid rgba(139,47,201,.15)', marginBottom:'1.75rem', display:'flex', alignItems:'center', gap:'1.5rem', flexWrap:'wrap' }}>
                  <div>
                    <p style={{ fontSize:'.75rem', color:C.purple, fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em', marginBottom:'.3rem' }}>Ta CSS</p>
                    <p style={{ fontSize:'2.5rem', fontWeight:900, color:C.dark, margin:0, fontVariantNumeric:'tabular-nums' }}>{secToMMSS(cssPace)}<span style={{ fontSize:'1rem', fontWeight:400, color:'rgba(26,18,48,.45)', marginLeft:'.3rem' }}>/100m</span></p>
                  </div>
                  <div style={{ width:1, height:56, background:'rgba(139,47,201,.15)', flexShrink:0 }}/>
                  <div>
                    <p style={{ fontSize:'.75rem', color:'rgba(26,18,48,.45)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:'.3rem' }}>Vitesse</p>
                    <p style={{ fontSize:'1.4rem', fontWeight:700, color:C.dark, margin:0 }}>{(cssSpeed * 36).toFixed(1)} <span style={{ fontSize:'.85rem', fontWeight:400 }}>km/h</span></p>
                  </div>
                  <div>
                    <p style={{ fontSize:'.75rem', color:'rgba(26,18,48,.45)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:'.3rem' }}>≈ 1500m en</p>
                    <p style={{ fontSize:'1.4rem', fontWeight:700, color:C.dark, margin:0 }}>{secToMMSS(cssPace * 15)}</p>
                  </div>
                </div>

                {/* Zones */}
                <p style={{ fontWeight:700, color:C.dark, marginBottom:'.75rem', fontSize:'.95rem' }}>Tes zones d'entraînement natation</p>
                <div style={{ overflow:'hidden', overflowX:'auto', borderRadius:12, border:'1px solid rgba(139,47,201,.12)', marginBottom:'1.5rem' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'.875rem', minWidth:480 }}>
                    <thead><tr style={{ background:'#1a1230' }}>
                      {['Zone','Nom','Allure /100m','% CSS','Usage'].map(h=><th key={h} style={{ padding:'.6rem .75rem', textAlign:'left', color:'rgba(255,255,255,.75)', fontWeight:600, fontSize:'.72rem', textTransform:'uppercase', letterSpacing:'.07em' }}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {CSS_ZONES.map(z=>{
                        const speedLo = z.pct[0] * cssSpeed, speedHi = z.pct[1] * cssSpeed
                        const paceLo = speedLo > 0 ? 100 / speedLo : 0
                        const paceHi = speedHi > 0 ? 100 / speedHi : 0
                        const pctLo = Math.round(z.pct[0]*100), pctHi = Math.round(z.pct[1]*100)
                        return <tr key={z.n} style={{ borderTop:'1px solid rgba(139,47,201,.07)' }}>
                          <td style={{ padding:'.6rem .75rem' }}><span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:24, height:24, borderRadius:'50%', background:z.color+'25', color:z.color, fontSize:'.8rem', fontWeight:700 }}>{z.n}</span></td>
                          <td style={{ padding:'.6rem .75rem', color:z.color, fontWeight:600, fontSize:'.85rem' }}>{z.name}</td>
                          <td style={{ padding:'.6rem .75rem', color:C.dark, fontVariantNumeric:'tabular-nums', fontSize:'.85rem' }}>
                            {z.n === 1 ? `>${secToMMSS(cssPace / z.pct[1])}` :
                             z.n === 5 ? `<${secToMMSS(cssPace / z.pct[0])}` :
                             `${secToMMSS(paceHi)}–${secToMMSS(paceLo)}`}
                          </td>
                          <td style={{ padding:'.6rem .75rem', color:'rgba(26,18,48,.45)', fontVariantNumeric:'tabular-nums' }}>
                            {z.n === 1 ? `<${pctHi}%` : z.n === 5 ? `>${pctLo}%` : `${pctLo}–${pctHi}%`}
                          </td>
                          <td style={{ padding:'.6rem .75rem', color:'rgba(26,18,48,.5)', fontSize:'.82rem' }}>{z.desc}</td>
                        </tr>
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Split times table */}
                <p style={{ fontWeight:700, color:C.dark, marginBottom:'.5rem', fontSize:'.95rem' }}>Temps prévisionnels par distance à ta CSS</p>
                <p style={{ color:'rgba(26,18,48,.45)', fontSize:'.82rem', marginBottom:'.75rem' }}>Temps estimés à ton allure de seuil exacte</p>
                <div style={{ overflow:'hidden', overflowX:'auto', borderRadius:12, border:'1px solid rgba(139,47,201,.1)' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'.875rem' }}>
                    <thead><tr style={{ background:'#1a1230' }}>
                      {['Distance','Temps estimé à CSS','Format'].map(h=><th key={h} style={{ padding:'.6rem .85rem', textAlign:'left', color:'rgba(255,255,255,.75)', fontWeight:600, fontSize:'.72rem', textTransform:'uppercase', letterSpacing:'.07em' }}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {SWIM_DISTS.map((d,i)=>{
                        const secs = cssPace * d.m / 100
                        const hh = Math.floor(secs/3600), mm = Math.floor((secs%3600)/60), ss = Math.round(secs%60)
                        const display = hh>0 ? `${hh}h${String(mm).padStart(2,'0')}'${String(ss).padStart(2,'0')}` : `${secToMMSS(secs)}`
                        return <tr key={d.m} style={{ borderTop:'1px solid rgba(139,47,201,.07)', background:i%2===0?'transparent':'rgba(139,47,201,.02)' }}>
                          <td style={{ padding:'.6rem .85rem', color:C.purple, fontWeight:600 }}>{d.label}</td>
                          <td style={{ padding:'.6rem .85rem', color:C.dark, fontWeight:600, fontVariantNumeric:'tabular-nums' }}>{display}</td>
                          <td style={{ padding:'.6rem .85rem', color:'rgba(26,18,48,.4)', fontSize:'.82rem' }}>{d.note||'—'}</td>
                        </tr>
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div style={{ padding:'2.5rem', textAlign:'center', borderRadius:12, background:'rgba(139,47,201,.04)', border:'1px dashed rgba(139,47,201,.15)' }}>
                <p style={{ color:'rgba(26,18,48,.35)', margin:0 }}>
                  {t200>0 && t400>0 && t400<=t200
                    ? 'Le temps du 400m doit être supérieur à celui du 200m'
                    : 'Entre tes temps de 200m et 400m pour calculer ta CSS'}
                </p>
              </div>
            )}
          </div>
        </Inner>
      </section>

      {/* WHAT IS CSS */}
      <section style={{ background:'#fff', padding:'5rem 1.5rem' }}>
        <Inner>
          <div style={{ display:'flex', gap:'3rem', alignItems:'center', flexWrap:'wrap' }}>
            <div style={{ flex:'1 1 380px', borderRadius:20, overflow:'hidden', maxHeight:420 }}>
              <svg viewBox="0 0 440 280" style={{width:'100%',height:'100%',display:'block',minHeight:260}}>
                <defs>
                  <linearGradient id="csg1" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#8B2FC9"/><stop offset="100%" stopColor="#E8237A"/>
                  </linearGradient>
                </defs>
                <rect width="440" height="280" fill="#EDE8F7"/>
                <text x="220" y="26" textAnchor="middle" fontSize="12" fill="#1a1230" fontWeight="800" fontFamily="system-ui,sans-serif">CSS — Modèle de Wakayoshi (1992)</text>
                <text x="220" y="42" textAnchor="middle" fontSize="9.5" fill="rgba(26,18,48,.45)" fontFamily="system-ui,sans-serif">P(t) = CSS·t + D' — Relation vitesse–durée</text>
                {/* Axes */}
                <line x1="55" y1="55" x2="55" y2="215" stroke="rgba(26,18,48,.15)" strokeWidth="1.5"/>
                <line x1="55" y1="215" x2="405" y2="215" stroke="rgba(26,18,48,.15)" strokeWidth="1.5"/>
                <text x="30" y="60" textAnchor="middle" fontSize="9" fill="rgba(26,18,48,.4)" fontFamily="system-ui,sans-serif">Vit.</text>
                <text x="230" y="235" textAnchor="middle" fontSize="9" fill="rgba(26,18,48,.4)" fontFamily="system-ui,sans-serif">Durée →</text>
                {/* CSS horizontal line */}
                <line x1="55" y1="155" x2="400" y2="155" stroke="#8B2FC9" strokeWidth="1.5" strokeDasharray="6,3"/>
                <text x="408" y="158" fontSize="9.5" fill="#8B2FC9" fontWeight="700" fontFamily="system-ui,sans-serif">CSS</text>
                {/* Curve (hyperbolic decay toward CSS) */}
                <path d="M70,80 Q90,90 120,112 Q160,130 200,142 Q250,150 300,153 Q350,154.5 400,155"
                  fill="none" stroke="url(#csg1)" strokeWidth="3" strokeLinecap="round"/>
                {/* D' zone */}
                <path d="M70,80 L70,155 Q90,155 120,155 Q120,112 120,80 Z"
                  fill="rgba(139,47,201,.08)" stroke="none"/>
                <text x="92" y="120" textAnchor="middle" fontSize="10" fill="#8B2FC9" fontWeight="700" fontFamily="system-ui,sans-serif">D'</text>
                <text x="92" y="133" textAnchor="middle" fontSize="8.5" fill="rgba(139,47,201,.6)" fontFamily="system-ui,sans-serif">Réserve</text>
                {/* Test points */}
                <circle cx="120" cy="112" r="5" fill="#E8237A" stroke="#fff" strokeWidth="1.5"/>
                <text x="127" y="108" fontSize="9" fill="#E8237A" fontWeight="700" fontFamily="system-ui,sans-serif">200m</text>
                <circle cx="200" cy="142" r="5" fill="#8B2FC9" stroke="#fff" strokeWidth="1.5"/>
                <text x="207" y="138" fontSize="9" fill="#8B2FC9" fontWeight="700" fontFamily="system-ui,sans-serif">400m</text>
                {/* Formula */}
                <rect x="260" y="65" width="140" height="52" rx="8" fill="rgba(139,47,201,.07)" stroke="rgba(139,47,201,.2)" strokeWidth="1"/>
                <text x="330" y="84" textAnchor="middle" fontSize="10.5" fill="#1a1230" fontWeight="700" fontFamily="system-ui,sans-serif">CSS = (T400 – T200)</text>
                <text x="330" y="100" textAnchor="middle" fontSize="9.5" fill="rgba(26,18,48,.55)" fontFamily="system-ui,sans-serif">divisé par 2</text>
                <text x="330" y="113" textAnchor="middle" fontSize="9" fill={C.purple} fontFamily="system-ui,sans-serif">sec / 100m</text>
                <text x="220" y="258" textAnchor="middle" fontSize="9.5" fill="rgba(26,18,48,.4)" fontFamily="system-ui,sans-serif" fontStyle="italic">Wakayoshi K. et al., J Appl Physiol, 1992</text>
              </svg>
            </div>
            <div style={{ flex:'1 1 320px' }}>
              <SectionTag>La science derrière la CSS</SectionTag>
              <H2L>L'allure de seuil en natation</H2L>
              <div style={{ color:'rgba(26,18,48,.65)', fontSize:'.9rem', lineHeight:1.8, display:'flex', flexDirection:'column', gap:'1rem' }}>
                <p style={{ textAlign:'justify' }}>La <strong style={{ color:C.dark }}>CSS (Critical Swim Speed)</strong> est la vitesse maximale que tu peux maintenir sur une longue distance (~1 500m) sans accumuler excessivement de lactate. Elle a été formalisée par <strong style={{ color:C.dark }}>Wakayoshi et al. en 1992</strong> (<em>Journal of Applied Physiology</em>) comme l'équivalent natation du seuil anaérobie.</p>
                <p style={{ textAlign:'justify' }}>Son principe dérive du <strong style={{ color:C.dark }}>modèle Monod & Scherrer</strong> : à une vitesse élevée, tu puises dans ta réserve anaérobie (D'). La CSS est précisément la vitesse à partir de laquelle cette réserve n'est plus sollicitée — tu peux donc théoriquement la tenir indéfiniment.</p>
                <p style={{ textAlign:'justify' }}>En pratique, la CSS est l'équivalent du <strong style={{ color:C.dark }}>FTP en cyclisme</strong> ou de l'<strong style={{ color:C.dark }}>allure de seuil en course à pied</strong>. Toutes tes zones de nage se construisent autour de cette référence personnelle.</p>
              </div>
            </div>
          </div>
        </Inner>
      </section>

      {/* HOW TO TEST */}
      <section style={{ background:'#0C0A18', padding:'5rem 1.5rem' }}>
        <Inner max={900}>
          <div style={{ textAlign:'center', marginBottom:'3rem' }}>
            <SectionTag dark>Protocole de test</SectionTag>
            <H2D>Comment réaliser tes tests ?</H2D>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:'1.25rem' }}>
            {[
              { n:'01', t:'Échauffement', d:"Commence par 400-600m d'échauffement progressif incluant quelques accélérations courtes. Ton corps doit être bien chaud avant les tests." },
              { n:'02', t:'Test 400m', d:"Nage ton 400m à allure maximale soutenable — pas un sprint, mais l'effort le plus fort que tu puisses tenir sur toute la distance. Note ton temps précisément." },
              { n:'03', t:'Récupération', d:"Récupère 10 à 15 minutes en nageant lentement. Cette récupération est cruciale : une fatigue résiduelle fausserait ton 200m et donc ta CSS." },
              { n:'04', t:'Test 200m', d:"Nage le 200m à fond — ici tu peux te permettre une allure légèrement plus rapide que le 400m. C'est la différence de temps entre les deux qui donne ta CSS." },
            ].map(s=>(
              <div key={s.n} style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.07)', borderRadius:16, padding:'1.5rem' }}>
                <p style={{ fontSize:'1.6rem', fontWeight:900, background:`linear-gradient(135deg,${C.purple},${C.pink})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', marginBottom:'.5rem' }}>{s.n}</p>
                <p style={{ fontWeight:700, color:'#fff', marginBottom:'.5rem', fontSize:'.95rem' }}>{s.t}</p>
                <p style={{ color:'rgba(255,255,255,.5)', fontSize:'.875rem', lineHeight:1.7, textAlign:'justify', margin:0 }}>{s.d}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop:'2rem', background:'rgba(139,47,201,.08)', border:'1px solid rgba(139,47,201,.2)', borderRadius:14, padding:'1.25rem 1.5rem', display:'flex', gap:'.75rem', alignItems:'flex-start' }}>
            <span style={{ fontSize:'1.3rem', flexShrink:0 }}>💡</span>
            <p style={{ margin:0, fontSize:'.875rem', color:'rgba(255,255,255,.6)', lineHeight:1.7, textAlign:'justify' }}>
              <strong style={{ color:'#fff' }}>Mon conseil :</strong> Réalise tes tests en début de séance, reposé, jamais en fin de semaine chargée. Un test mal réalisé donne une CSS inexacte, ce qui fausse toutes tes zones pour les semaines à venir.
            </p>
          </div>
        </Inner>
      </section>

      {/* HOW TO USE CSS */}
      <section style={{ background:'#fff', padding:'5rem 1.5rem' }}>
        <Inner max={900}>
          <div style={{ textAlign:'center', marginBottom:'3rem' }}>
            <SectionTag>Utiliser sa CSS</SectionTag>
            <H2L>Entraîner sa CSS efficacement</H2L>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'1.25rem' }}>
            {[
              { icon:'🔁', t:'Répétitions CSS', d:"La séance de référence : 8 à 12 × 100m à exactement ton allure CSS, avec 15-20 secondes de repos entre chaque répétition. C'est l'équivalent d'une séance tempo en course à pied." },
              { icon:'📈', t:'Blocs progressifs', d:"Commence par 6×100m et augmente progressivement à 10×100m ou 5×200m sur 6-8 semaines. L'objectif est de tenir l'allure CSS sur un volume croissant." },
              { icon:'⚡', t:'Pyramides de vitesse', d:"50m rapide (Zone 5) + 100m à CSS + 200m sous CSS. Ce type de séance développe simultanément ta CSS et ta puissance aérobie maximale." },
              { icon:'🏊', t:'Endurance sous-seuil', d:"Longues séries à Zone 2-3 (endurance et aérobie soutenu) : la base qui soutient ta CSS. Sans volume aérobie, la CSS stagne." },
            ].map(s=>(
              <div key={s.t} style={{ background:C.light, borderRadius:16, padding:'1.5rem', border:'1px solid rgba(139,47,201,.1)' }}>
                <p style={{ fontSize:'1.8rem', marginBottom:'.5rem' }}>{s.icon}</p>
                <p style={{ fontWeight:700, color:C.dark, marginBottom:'.5rem', fontSize:'.95rem' }}>{s.t}</p>
                <p style={{ color:'rgba(26,18,48,.6)', fontSize:'.875rem', lineHeight:1.7, textAlign:'justify', margin:0 }}>{s.d}</p>
              </div>
            ))}
          </div>
        </Inner>
      </section>

      <PricingCTA
        title={<>Un programme natation qui <span style={{ background:'linear-gradient(135deg,#8B2FC9,#E8237A)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', display:'inline' }}>suit ta progression</span></>}
        subtitle="Tes zones CSS intégrées dans un plan d'entraînement structuré, ajusté chaque semaine."
      />

      {/* FAQ */}
      <section style={{ background:'#fff', padding:'5rem 1.5rem', borderTop:'1px solid rgba(139,47,201,.08)' }}>
        <Inner max={720}>
          <div style={{ textAlign:'center', marginBottom:'2.5rem' }}>
            <SectionTag>FAQ</SectionTag>
            <H2L>Questions fréquentes sur la CSS</H2L>
          </div>
          {FAQ.map((item,i)=>(
            <div key={i} style={{ borderBottom:'1px solid rgba(139,47,201,.1)' }}>
              <button onClick={()=>setOpenFaq(openFaq===i?null:i)} style={{ width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'1.1rem 0', background:'none', border:'none', cursor:'pointer', color:C.dark, fontSize:'.95rem', fontWeight:600, textAlign:'left', gap:'1rem' }}>
                {item.q}
                <svg width="14" height="14" viewBox="0 0 12 12" fill="none" style={{ flexShrink:0, transition:'transform .2s', transform:openFaq===i?'rotate(180deg)':'none' }}><path d="M1 4l5 5 5-5" stroke={C.purple} strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
              {openFaq===i&&<p style={{ margin:'0 0 1.25rem', color:'rgba(26,18,48,.65)', fontSize:'.9rem', lineHeight:1.75, textAlign:'justify' }}>{item.a}</p>}
            </div>
          ))}
        </Inner>
      </section>

      <SiteFooter />
    </div>
  )
}
