import { useState, useEffect, useRef } from 'react'
import Nav from '../../components/Nav'
import SiteFooter from '../../components/SiteFooter'
import PageHero, { gradText } from '../../components/PageHero'
import PricingCTA from '../../components/PricingCTA'

const C = { purple:'#8B2FC9', pink:'#E8237A', dark:'#1a1230', light:'#F8F5FF' }
const inputSt = { background:'#fff', border:'1px solid rgba(139,47,201,.25)', borderRadius:10, padding:'.55rem .75rem', color:C.dark, fontSize:'.9rem', outline:'none', width:100 }
const labelSt = { display:'block', fontSize:'.72rem', color:'rgba(26,18,48,.45)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:'.35rem' }
function Inner({ max=1000, children, style }) { return <div style={{ maxWidth:max, margin:'0 auto', ...style }}>{children}</div> }
function SectionTag({ children, dark }) { return <p style={{ fontSize:'.75rem', letterSpacing:'.18em', textTransform:'uppercase', color:dark?'rgba(255,255,255,.6)':C.purple, marginBottom:'.75rem', fontWeight:600 }}>{children}</p> }
function H2L({ children }) { return <h2 style={{ fontSize:'clamp(1.6rem,3.5vw,2.4rem)', fontWeight:900, color:C.dark, lineHeight:1.15, marginBottom:'1.25rem' }}>{children}</h2> }
function H2D({ children }) { return <h2 style={{ fontSize:'clamp(1.6rem,3.5vw,2.4rem)', fontWeight:900, color:'#fff', lineHeight:1.15, marginBottom:'1.25rem' }}>{children}</h2> }

const CP_ZONES = [
  { n:1, name:'Récupération active', pct:[0,.55],     color:'#60A5FA', desc:'Pédalage de récupération, flux sanguin sans charge' },
  { n:2, name:'Endurance',           pct:[.55,.75],   color:'#34D399', desc:'Base aérobie longue durée, 2-6 h, graisses dominantes' },
  { n:3, name:'Tempo',               pct:[.75,.90],   color:'#A3E635', desc:'Effort soutenu 20-60 min, améliore l\'endurance spécifique' },
  { n:4, name:'Seuil / FTP',         pct:[.90,1.05],  color:'#FBBF24', desc:'Intensité de seuil, 10-40 min max, cœur de ton entraînement' },
  { n:5, name:'VO₂max',              pct:[1.05,1.20], color:'#F97316', desc:'Intervalles 3-8 min, développe ta puissance aérobie maximale' },
  { n:6, name:'Anaérobie',           pct:[1.20,1.50], color:'#EF4444', desc:'Efforts courts et explosifs 30s-3 min, puise dans W\'' },
  { n:7, name:'Neuromusculaire',     pct:[1.50,Infinity],color:'#C084FC', desc:'Sprints < 30s, recrutement maximal des fibres rapides' },
]

const FAQ = [
  { q:'CP vs FTP : quelle différence concrète ?', a:"La FTP (Functional Threshold Power) est une approximation pratique, souvent définie comme la puissance maximale soutenable 1 heure, estimée à 95% de la puissance soutenue sur 20 minutes. La CP (Critical Power) est la valeur asymptotique du modèle mathématique de Monod & Scherrer : la puissance au-delà de laquelle tu puises inexorablement dans ta réserve anaérobie W'. En pratique, la CP est légèrement supérieure à la FTP réelle d'une personne de 1 à 3%. Les deux sont des repères valables, mais la CP est plus robuste car elle s'appuie sur plusieurs tests." },
  { q:'Qu\'est-ce que la W\' (W prime) ?', a:"La W' (prononcé 'W prime') est ta réserve d'énergie anaérobie, exprimée en kilojoules. C'est la quantité de travail que tu peux accomplir au-dessus de ta CP avant l'épuisement. Une W' élevée signifie que tu peux tenir un effort intense plus longtemps avant de craquer, crucial pour les attaques, les sprints finaux ou les côtes courtes. La W' se reconstitue dès que tu repasses sous ta CP, selon une cinétique exponentielle." },
  { q:'À quelle fréquence recalculer sa CP ?', a:"La CP évolue avec l'entraînement. Recalcule-la toutes les 6-8 semaines, ou après un bloc d'entraînement significatif. Ne fais pas un test CP en cours de cycle chargé : les résultats seraient sous-estimés. Planifie toujours tes tests en début de semaine, après au moins 48h de récupération." },
  { q:'Comment réaliser les tests de puissance ?', a:"Les tests de 5 minutes et 20 minutes doivent être réalisés à effort maximal soutenable, pas à fond dès le départ. Pour le 5 minutes : pars à une intensité très élevée mais que tu peux tenir jusqu'au bout. Pour le 20 minutes : commence légèrement en dessous de ce que tu penses pouvoir tenir, puis gère ton effort. Chaque test doit être séparé par au moins 24h de récupération." },
  { q:'Le rapport W/kg est-il vraiment important ?', a:"En cyclisme, le rapport W/kg est le roi de la performance en montagne. Deux cyclistes avec la même CP mais des poids différents n'auront pas les mêmes performances en côte : celui avec le meilleur rapport W/kg sera avantagé. Sur le plat, la puissance absolue (watts) prime. En contre-la-montre sur parcours vallonné, les deux comptent." },
  { q:'Le modèle CP fonctionne-t-il pour d\'autres sports ?', a:"Oui. Le modèle de Monod & Scherrer (1965) a été appliqué à la natation (CSS), la course à pied (vitesse critique) et l'aviron. Dans chaque discipline, la logique est identique : une vitesse ou puissance critique qui représente le seuil entre métabolisme aérobie pur et puisement dans la réserve anaérobie. C'est un cadre universel de la physiologie de l'exercice." },
]

function calcCP(p5, p20, p12) {
  const points = []
  if (p5  > 0) points.push({ t:300,  p:p5 })
  if (p12 > 0) points.push({ t:720,  p:p12 })
  if (p20 > 0) points.push({ t:1200, p:p20 })
  if (points.length < 2) return null

  if (points.length === 2) {
    const [a, b] = points
    const cp = (b.p * b.t - a.p * a.t) / (b.t - a.t)
    const wprime = (a.p - cp) * a.t
    return { cp: Math.round(cp), wprime: Math.round(wprime) }
  }
  // 3 points: least squares P = W'*(1/t) + CP
  const xs = points.map(pt => 1/pt.t)
  const ys = points.map(pt => pt.p)
  const n = 3
  const sumX = xs.reduce((a,b)=>a+b,0)
  const sumY = ys.reduce((a,b)=>a+b,0)
  const sumXY = xs.reduce((s,x,i)=>s+x*ys[i],0)
  const sumX2 = xs.reduce((s,x)=>s+x*x,0)
  const wprime = (n*sumXY - sumX*sumY) / (n*sumX2 - sumX*sumX)
  const cp = (sumY - wprime*sumX) / n
  return { cp: Math.round(cp), wprime: Math.round(wprime) }
}

function fmtTime(secs) {
  if (secs < 0) return 'n/a'
  const h = Math.floor(secs/3600), m = Math.floor((secs%3600)/60), s = Math.round(secs%60)
  if (h > 0) return `${h}h${String(m).padStart(2,'0')}'`
  return `${m}'${String(s).padStart(2,'0')}`
}

export default function CriticalPowerCalculator() {
  const calcRef = useRef()
  const [p5,  setP5]  = useState('')
  const [p20, setP20] = useState('')
  const [p12, setP12] = useState('')
  const [poids, setPoids] = useState('')
  const [openFaq, setOpenFaq] = useState(null)

  useEffect(() => {
    const prev = document.title
    document.title = 'Calculateur Puissance Critique (CP/FTP) vélo | The Ultimate Academy'
    const meta = document.querySelector('meta[name="description"]')
    const prevM = meta?.content
    if (meta) meta.content = 'Calcule ta puissance critique (CP) et ta FTP à partir de tes tests d\'effort. Obtiens tes zones de puissance en watts et W/kg.'
    return () => { document.title = prev; if (meta&&prevM!=null) meta.content = prevM }
  }, [])

  const p5Val  = parseInt(p5)||0
  const p20Val = parseInt(p20)||0
  const p12Val = parseInt(p12)||0
  const poidsVal = parseFloat(poids)||0
  const result = (p5Val>0 && p20Val>0) ? calcCP(p5Val, p20Val, p12Val>0?p12Val:0) : null
  const ftpEst = p20Val > 0 ? Math.round(p20Val * 0.95) : 0

  return (
    <div style={{ background:'#000', color:'#fff', overflowX:'hidden' }}>
      <Nav />

      <PageHero
        badge="Cyclisme"
        title={<>Puissance Critique <span style={gradText}>& FTP</span></>}
        subtitle="Calcule ta CP et ta FTP à partir de tes tests d'effort. Découvre ta réserve anaérobie W' et tes 7 zones de puissance"
      >
        <button onClick={()=>calcRef.current?.scrollIntoView({behavior:'smooth'})} style={{ padding:'1rem 2.5rem', borderRadius:50, border:'none', background:`linear-gradient(135deg,${C.purple},${C.pink})`, color:'#fff', fontSize:'1.05rem', fontWeight:700, cursor:'pointer', boxShadow:'0 8px 32px rgba(232,35,122,.5)' }}>Calculer ma CP ↓</button>
      </PageHero>

      {/* CALCULATOR */}
      <section ref={calcRef} id="outil" style={{ background:C.light, padding:'5rem 1.5rem' }}>
        <Inner max={800}>
          <div style={{ textAlign:'center', marginBottom:'2.5rem' }}>
            <SectionTag>Calculateur de puissance</SectionTag>
            <h2 style={{ fontSize:'clamp(1.5rem,3vw,2rem)', fontWeight:900, color:C.dark, marginBottom:'.5rem' }}>Tes zones de puissance <span style={gradText}>personnalisées</span></h2>
            <p style={{ color:'rgba(26,18,48,.5)', fontSize:'.9rem' }}>Renseigne ta puissance maximale soutenue sur 5 et 20 minutes. Le test à 12 min est optionnel mais améliore la précision.</p>
          </div>

          <div style={{ background:'#fff', borderRadius:20, padding:'2rem', boxShadow:'0 8px 40px rgba(139,47,201,.1)', border:'1px solid rgba(139,47,201,.12)' }}>
            <div style={{ display:'flex', gap:'1.5rem', flexWrap:'wrap', marginBottom:'1.5rem', alignItems:'flex-end' }}>
              <div>
                <label style={labelSt}>Puissance max 5 min (W) *</label>
                <input type="number" min="50" max="800" placeholder="Ex : 320" value={p5} onChange={e=>setP5(e.target.value)} style={inputSt}/>
              </div>
              <div>
                <label style={labelSt}>Puissance max 20 min (W) *</label>
                <input type="number" min="50" max="700" placeholder="Ex : 270" value={p20} onChange={e=>setP20(e.target.value)} style={inputSt}/>
              </div>
              <div>
                <label style={labelSt}>Puissance max 12 min (W) optionnel</label>
                <input type="number" min="50" max="750" placeholder="Ex : 295" value={p12} onChange={e=>setP12(e.target.value)} style={inputSt}/>
              </div>
              <div>
                <label style={labelSt}>Ton poids (kg) optionnel</label>
                <input type="number" min="40" max="150" step=".1" placeholder="Ex : 70" value={poids} onChange={e=>setPoids(e.target.value)} style={inputSt}/>
              </div>
            </div>
            <p style={{ fontSize:'.78rem', color:'rgba(26,18,48,.35)', marginBottom:'1.5rem' }}>* Tests réalisés à effort maximal soutenable, séparés d'au moins 24h de récupération</p>

            {result ? (
              <>
                {/* Main results */}
                <div style={{ display:'flex', gap:'1rem', flexWrap:'wrap', marginBottom:'1.75rem' }}>
                  {[
                    { label:'Puissance Critique (CP)', value:`${result.cp} W`, sub:poidsVal>0?`${(result.cp/poidsVal).toFixed(2)} W/kg`:null, highlight:true },
                    { label:'FTP estimée (95% × 20 min)', value:`${ftpEst} W`, sub:poidsVal>0?`${(ftpEst/poidsVal).toFixed(2)} W/kg`:null },
                    { label:'Réserve anaérobie (W\')', value:`${Math.round(result.wprime/1000*10)/10} kJ`, sub:`${result.wprime} joules` },
                    { label:'Limite théorique à CP+20W', value:fmtTime(result.wprime/20), sub:'avant épuisement W\'' },
                  ].map(r=>(
                    <div key={r.label} style={{ flex:'1 1 160px', background:r.highlight?`linear-gradient(135deg,rgba(139,47,201,.12),rgba(232,35,122,.08))`:'rgba(139,47,201,.04)', borderRadius:14, padding:'1.1rem 1.25rem', border:r.highlight?'1px solid rgba(139,47,201,.25)':'1px solid rgba(139,47,201,.1)' }}>
                      <p style={{ fontSize:'.72rem', color:r.highlight?C.purple:'rgba(26,18,48,.45)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:'.3rem' }}>{r.label}</p>
                      <p style={{ fontSize:'1.6rem', fontWeight:900, color:C.dark, margin:0, fontVariantNumeric:'tabular-nums' }}>{r.value}</p>
                      {r.sub && <p style={{ fontSize:'.8rem', color:'rgba(26,18,48,.5)', margin:'.2rem 0 0' }}>{r.sub}</p>}
                    </div>
                  ))}
                </div>

                {/* Zones table */}
                <p style={{ fontWeight:700, color:C.dark, marginBottom:'.75rem', fontSize:'.95rem' }}>Tes 7 zones de puissance</p>
                <div style={{ overflow:'hidden', overflowX:'auto', borderRadius:12, border:'1px solid rgba(139,47,201,.12)' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'.875rem', minWidth:520 }}>
                    <thead><tr style={{ background:'#1a1230' }}>
                      {['Zone','Nom','Watts','% CP', poidsVal>0?'W/kg':'','Durée max'].filter(Boolean).map(h=><th key={h} style={{ padding:'.6rem .75rem', textAlign:'left', color:'rgba(255,255,255,.75)', fontWeight:600, fontSize:'.72rem', textTransform:'uppercase', letterSpacing:'.07em' }}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {CP_ZONES.map(z=>{
                        const wLo = Math.round(result.cp * z.pct[0])
                        const wHi = z.pct[1] === Infinity ? '∞' : Math.round(result.cp * z.pct[1])
                        const wRange = z.n===1 ? `< ${Math.round(result.cp*.55)}W` : z.n===7 ? `> ${Math.round(result.cp*1.50)}W` : `${wLo}–${wHi}W`
                        const pctRange = z.n===1 ? '<55%' : z.n===7 ? '>150%' : `${Math.round(z.pct[0]*100)}–${Math.round(z.pct[1]*100)}%`
                        const kgRange = poidsVal>0 ? (z.n===1 ? `<${(result.cp*.55/poidsVal).toFixed(1)}` : z.n===7 ? `>${(result.cp*1.5/poidsVal).toFixed(1)}` : `${(wLo/poidsVal).toFixed(1)}–${typeof wHi==='number'?(wHi/poidsVal).toFixed(1):'∞'}`) : null
                        let durMax = 'n/a'
                        const midPct = (z.pct[0]+Math.min(z.pct[1],2))/2
                        const exceedCP = result.cp * midPct - result.cp
                        if (z.n >= 5 && exceedCP > 0) durMax = fmtTime(result.wprime / exceedCP)
                        else if (z.n<=4) durMax = z.n===4?'10-40 min':z.n===3?'20-60 min':z.n===2?'2-6 h':'illimité'
                        const cols = [
                          <td key="z" style={{ padding:'.6rem .75rem' }}><span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:24, height:24, borderRadius:'50%', background:z.color+'25', color:z.color, fontSize:'.8rem', fontWeight:700 }}>{z.n}</span></td>,
                          <td key="n" style={{ padding:'.6rem .75rem', color:z.color, fontWeight:600, fontSize:'.85rem' }}>{z.name}</td>,
                          <td key="w" style={{ padding:'.6rem .75rem', color:C.dark, fontVariantNumeric:'tabular-nums', fontWeight:600, fontSize:'.85rem' }}>{wRange}</td>,
                          <td key="p" style={{ padding:'.6rem .75rem', color:'rgba(26,18,48,.45)', fontVariantNumeric:'tabular-nums' }}>{pctRange}</td>,
                          poidsVal>0 && <td key="kg" style={{ padding:'.6rem .75rem', color:'rgba(26,18,48,.55)', fontVariantNumeric:'tabular-nums', fontSize:'.85rem' }}>{kgRange}</td>,
                          <td key="d" style={{ padding:'.6rem .75rem', color:'rgba(26,18,48,.4)', fontSize:'.82rem' }}>{durMax}</td>,
                        ].filter(Boolean)
                        return <tr key={z.n} style={{ borderTop:'1px solid rgba(139,47,201,.07)' }}>{cols}</tr>
                      })}
                    </tbody>
                  </table>
                </div>
                <p style={{ fontSize:'.75rem', color:'rgba(26,18,48,.35)', marginTop:'.75rem' }}>La durée max pour les zones 5-7 correspond au temps théorique avant épuisement de la réserve W' (W' / Puissance excédant CP)</p>
              </>
            ) : (
              <div style={{ padding:'2.5rem', textAlign:'center', borderRadius:12, background:'rgba(139,47,201,.04)', border:'1px dashed rgba(139,47,201,.15)' }}>
                <p style={{ color:'rgba(26,18,48,.35)', margin:0 }}>Entre ta puissance sur 5 min et 20 min pour calculer ta CP</p>
              </div>
            )}
          </div>
        </Inner>
      </section>

      {/* SCIENCE */}
      <section style={{ background:'#fff', padding:'5rem 1.5rem' }}>
        <Inner>
          <div style={{ display:'flex', gap:'3rem', alignItems:'flex-start', flexWrap:'wrap' }}>
            <div style={{ flex:'1 1 320px' }}>
              <div style={{ background:C.light, borderRadius:20, padding:'2rem', border:'1px solid rgba(139,47,201,.12)' }}>
                <p style={{ fontWeight:800, color:C.dark, fontSize:'1rem', marginBottom:'1.25rem' }}>Le modèle Monod & Scherrer</p>
                <div style={{ background:'#fff', borderRadius:14, padding:'1.5rem', textAlign:'center', marginBottom:'1.25rem', border:'1px solid rgba(139,47,201,.1)' }}>
                  <p style={{ fontSize:'1.35rem', fontWeight:900, color:C.dark, margin:0, fontFamily:'Georgia,serif', letterSpacing:'.02em' }}>
                    P(t) = CP + W' / t
                  </p>
                  <p style={{ color:'rgba(26,18,48,.4)', fontSize:'.78rem', margin:'.4rem 0 0' }}>puissance (W) en fonction de la durée (s)</p>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.75rem', marginBottom:'1rem' }}>
                  <div style={{ background:'rgba(139,47,201,.06)', borderRadius:10, padding:'.9rem', border:'1px solid rgba(139,47,201,.12)' }}>
                    <p style={{ fontWeight:700, color:C.purple, marginBottom:'.3rem', fontSize:'.85rem' }}>CP</p>
                    <p style={{ color:'rgba(26,18,48,.6)', fontSize:'.8rem', lineHeight:1.55, margin:0 }}>Puissance critique : seuil aérobie maximal, théoriquement indéfiniment tenable</p>
                  </div>
                  <div style={{ background:'rgba(232,35,122,.06)', borderRadius:10, padding:'.9rem', border:'1px solid rgba(232,35,122,.12)' }}>
                    <p style={{ fontWeight:700, color:'#E8237A', marginBottom:'.3rem', fontSize:'.85rem' }}>W'</p>
                    <p style={{ color:'rgba(26,18,48,.6)', fontSize:'.8rem', lineHeight:1.55, margin:0 }}>Réserve anaérobie en joules, disponible au-dessus de la CP</p>
                  </div>
                </div>
                <div style={{ background:'rgba(249,115,22,.06)', borderRadius:10, padding:'.9rem', border:'1px solid rgba(249,115,22,.12)', marginBottom:'1rem' }}>
                  <p style={{ fontWeight:700, color:'#F97316', marginBottom:'.3rem', fontSize:'.85rem' }}>FTP ≈ 95% × P<sub>20min</sub></p>
                  <p style={{ color:'rgba(26,18,48,.6)', fontSize:'.8rem', lineHeight:1.55, margin:0 }}>Approximation pratique, légèrement inférieure à la CP réelle</p>
                </div>
                <p style={{ color:'rgba(26,18,48,.3)', fontSize:'.72rem', margin:0, textAlign:'center', fontStyle:'italic' }}>Monod H. & Scherrer J., Ergonomics, 1965</p>
              </div>
            </div>
            <div style={{ flex:'1 1 320px' }}>
              <SectionTag>La science derrière la CP</SectionTag>
              <H2L>Pourquoi la CP est <span style={gradText}>supérieure</span> à la FTP ?</H2L>
              <div style={{ color:'rgba(26,18,48,.65)', fontSize:'.9rem', lineHeight:1.8, display:'flex', flexDirection:'column', gap:'1rem' }}>
                <p style={{ textAlign:'justify' }}>La <strong style={{ color:C.dark }}>Puissance Critique (CP)</strong> est définie par le modèle de <strong style={{ color:C.dark }}>Monod & Scherrer (1965)</strong> (<em>Ergonomics</em>) comme la valeur asymptotique de la relation puissance–durée : la puissance que tu pourrais théoriquement maintenir indéfiniment, sans puiser dans ta réserve anaérobie.</p>
                <p style={{ textAlign:'justify' }}>La <strong style={{ color:C.dark }}>W' (W prime)</strong> est ta réserve d'énergie anaérobie en joules. Au-dessus de ta CP, cette réserve se vide à un rythme dépendant de l'excès de puissance. Dès que tu repasses sous la CP, elle se reconstitue progressivement. <strong style={{ color:C.dark }}>Jones et al. (2010)</strong> (<em>Journal of Applied Physiology</em>) ont montré que ce modèle prédit avec précision la tolérance à l'effort intense.</p>
                <p style={{ textAlign:'justify' }}>Contrairement à la FTP (95% de la puissance sur 20 min), la CP est issue d'une <strong style={{ color:C.dark }}>régression multidurée</strong> : plus tu fournis de tests (5 min, 12 min, 20 min), plus l'estimation est robuste et individualisée.</p>
              </div>
            </div>
          </div>
        </Inner>
      </section>

      {/* HOW TO TEST */}
      <section style={{ background:'#0C0A18', padding:'5rem 1.5rem' }}>
        <Inner max={1100}>
          <div style={{ textAlign:'center', marginBottom:'3rem' }}>
            <SectionTag dark>Protocole</SectionTag>
            <H2D>Comment réaliser tes <span style={gradText}>tests</span> de puissance ?</H2D>
            <p style={{ color:'rgba(255,255,255,.45)', fontSize:'.9rem', maxWidth:600, margin:'.5rem auto 0' }}>Chaque test doit être réalisé à effort maximal soutenable, jamais à fond dès la première seconde. L'objectif est de trouver la puissance la plus élevée que tu peux maintenir jusqu'à la fin, pas de t'effondrer à mi-parcours. La qualité d'exécution conditionne directement la précision de ta CP.</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'1.25rem', marginBottom:'2rem' }}>
            {[
              { t:'Test 5 minutes', icon:'⚡', d:"Après un échauffement de 20 minutes incluant 3 à 4 accélérations progressives de 30 secondes, lance le chrono et maintiens la puissance la plus élevée que tu peux soutenir sur 5 minutes complètes. C'est l'effort le plus intense des trois tests : tu dois être à la limite du supportable dès la 2e minute, mais encore capable d'accélérer sur les 30 dernières secondes. Récupère au moins 48h avant le test suivant." },
              { t:'Test 20 minutes', icon:'🔥', d:"Le classique du cyclisme structuré. Après un échauffement complet de 20 à 30 minutes, maintiens la puissance la plus élevée que tu puisses soutenir pendant 20 minutes sans baisser. L'erreur la plus commune est de partir trop fort les 5 premières minutes puis de s'effondrer. Commence à 5-10% sous ton estimation et remonte si tu peux. La FTP est estimée à 95% de ce résultat." },
              { t:'Test 12 minutes optionnel', icon:'📊', d:"Ce troisième point de mesure améliore significativement la robustesse du modèle. Avec seulement 2 tests, la CP peut être sur ou sous-estimée selon la façon dont tu t'es exécuté. Avec 3 tests, le calculateur applique une régression par moindres carrés qui minimise les erreurs individuelles. Même protocole : effort maximal soutenable sur exactement 12 minutes." },
              { t:'Conditions idéales', icon:'🎯', d:"Toujours reposé : ne jamais tester en fatigue accumulée ou en fin de semaine chargée. Sur home trainer pour plus de répétabilité et de sécurité. Nutrition normale la veille, repas léger 2-3 heures avant. Ne jamais réaliser deux tests le même jour : la fatigue du premier biaiserait le second. Essaie de reproduire les mêmes conditions à chaque recalcul pour comparer valablement." },
            ].map(s=>(
              <div key={s.t} style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.07)', borderRadius:16, padding:'1.5rem' }}>
                <p style={{ fontSize:'1.5rem', marginBottom:'.5rem' }}>{s.icon}</p>
                <p style={{ fontWeight:700, color:'#fff', marginBottom:'.5rem', fontSize:'.95rem' }}>{s.t}</p>
                <p style={{ color:'rgba(255,255,255,.5)', fontSize:'.875rem', lineHeight:1.7, textAlign:'justify', margin:0 }}>{s.d}</p>
              </div>
            ))}
          </div>
          <div style={{ background:'rgba(139,47,201,.08)', border:'1px solid rgba(139,47,201,.2)', borderRadius:14, padding:'1.25rem 1.5rem', display:'flex', gap:'.75rem', alignItems:'flex-start' }}>
            <span style={{ fontSize:'1.3rem', flexShrink:0 }}>💡</span>
            <p style={{ margin:0, fontSize:'.875rem', color:'rgba(255,255,255,.6)', lineHeight:1.7, textAlign:'justify' }}>
              <strong style={{ color:'#fff' }}>Mon conseil :</strong> Le test à 20 minutes est souvent surestimé car les cyclistes partent trop fort les 5 premières minutes puis compensent. Commence à 5% sous ton estimation et ajuste. Une CP surestimée te donne des zones trop élevées et des séances non récupérables.
            </p>
          </div>
        </Inner>
      </section>

      {/* W/kg CONTEXT */}
      <section style={{ background:'#fff', padding:'5rem 1.5rem' }}>
        <Inner max={900}>
          <div style={{ textAlign:'center', marginBottom:'3rem' }}>
            <SectionTag>Niveaux de performance</SectionTag>
            <H2L>Que signifie ton rapport W/kg ?</H2L>
          </div>
          <div style={{ overflow:'hidden', overflowX:'auto', borderRadius:16, border:'1px solid rgba(139,47,201,.12)' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'.875rem', minWidth:480 }}>
              <thead><tr style={{ background:'#1a1230' }}>
                {['Niveau','FTP W/kg','Profil typique'].map(h=><th key={h} style={{ padding:'.75rem 1rem', textAlign:'left', color:'rgba(255,255,255,.75)', fontWeight:600, fontSize:'.72rem', textTransform:'uppercase', letterSpacing:'.07em' }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {[
                  ['Débutant','< 2.0 W/kg','Cyclisme récréatif, premières sorties structurées'],
                  ['Intermédiaire','2.0 – 3.0 W/kg','Cycliste régulier, granfondos courtes distances'],
                  ['Avancé','3.0 – 3.5 W/kg','Compétiteur amateur, capables de tenir un groupe élite loisir'],
                  ['Expert','3.5 – 4.0 W/kg','Podiums amateurs, profil montagnard efficace'],
                  ['Elite amateur','4.0 – 5.0 W/kg','Niveau catégorie 1-2 nationale'],
                  ['Professionnel','> 5.0 W/kg','WorldTour : Pogačar, Vingegaard ~ 6.2-6.8 W/kg'],
                ].map(([n,w,d],i)=>(
                  <tr key={n} style={{ borderTop:'1px solid rgba(139,47,201,.07)', background:i%2===0?'transparent':'rgba(139,47,201,.02)' }}>
                    <td style={{ padding:'.7rem 1rem', color:C.purple, fontWeight:700 }}>{n}</td>
                    <td style={{ padding:'.7rem 1rem', color:C.dark, fontWeight:600, fontVariantNumeric:'tabular-nums' }}>{w}</td>
                    <td style={{ padding:'.7rem 1rem', color:'rgba(26,18,48,.5)', fontSize:'.85rem' }}>{d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize:'.78rem', color:'rgba(26,18,48,.35)', marginTop:'.75rem', textAlign:'center' }}>Valeurs basées sur FTP (pas CP). Source : Coggan A. (2010), Training and Racing with a Power Meter</p>
        </Inner>
      </section>

      <PricingCTA
        title={<>Un entraînement cycliste <span style={{ background:'linear-gradient(135deg,#8B2FC9,#E8237A)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', display:'inline' }}>basé sur ta puissance</span></>}
        subtitle="Tes zones CP intégrées dans un plan structuré, progressif et ajusté chaque semaine."
      />

      {/* FAQ */}
      <section style={{ background:'#fff', padding:'5rem 1.5rem', borderTop:'1px solid rgba(139,47,201,.08)' }}>
        <Inner max={720}>
          <div style={{ textAlign:'center', marginBottom:'2.5rem' }}>
            <SectionTag>FAQ</SectionTag>
            <H2L>Questions sur la puissance critique</H2L>
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
