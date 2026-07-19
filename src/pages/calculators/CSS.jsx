import { useState, useEffect, useRef } from 'react'
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
  { n:1, name:'Récupération',    pct:[0,.78],   color:'#60A5FA', desc:'Nage très lente, récupération active entre les séries' },
  { n:2, name:'Endurance',       pct:[.78,.88], color:'#34D399', desc:'Volume aérobie, construction de la base en natation' },
  { n:3, name:'Aérobie soutenu', pct:[.88,.96], color:'#A3E635', desc:'Travail sous le seuil, progression de la capacité aérobie' },
  { n:4, name:'Seuil / CSS',     pct:[.96,1.04],color:'#FBBF24', desc:'Ta vitesse critique, allure cible des blocs CSS' },
  { n:5, name:'VO₂max',          pct:[1.04,1.15],color:'#EF4444', desc:'Intervalles courts à haute intensité, 50-200m' },
]

// pctRace = % de CSS recommandé pour nager cette distance en compétition triathlon
const SWIM_DISTS = [
  { label:'50 m',    m:50 },
  { label:'100 m',   m:100 },
  { label:'200 m',   m:200 },
  { label:'400 m',   m:400 },
  { label:'750 m',   m:750,  note:'Sprint Tri',   pctRace:'94-98%' },
  { label:'1 500 m', m:1500, note:'Olympique',    pctRace:'88-93%' },
  { label:'1 900 m', m:1900, note:'Half Ironman', pctRace:'83-88%' },
  { label:'3 800 m', m:3800, note:'Ironman',      pctRace:'75-81%' },
]

const FAQ = [
  { q:'Faut-il vraiment faire les deux distances à fond ?', a:'Oui, absolument. Le calcul du CSS repose sur la différence de temps entre le 200m et le 400m, tous deux réalisés à effort maximal. Si tu ménages l\'un des deux efforts, ta CSS sera faussée. Récupère 10 à 15 minutes entre les deux tests : une récupération incomplète biaisera également le résultat.' },
  { q:'À quelle fréquence recalculer sa CSS ?', a:'La CSS reflète ton niveau aérobie en natation. Elle évolue avec l\'entraînement, généralement tous les 6 à 8 semaines chez un nageur régulier. Recalcule-la après chaque bloc d\'entraînement intense, ou si tu perçois une progression ou une régression notable de ta nage.' },
  { q:'Comment entraîner sa CSS ?', a:'Les séries de CSS classiques sont réalisées avec des répétitions de 50 à 200m à l\'allure CSS, avec peu de récupération (10 à 20s). Par exemple : 10 × 100m à CSS avec 15s de repos. C\'est l\'équivalent natation des séances tempo en course à pied.' },
  { q:'CSS et FINA T-score : quelle différence ?', a:'La CSS est un indicateur de performance absolue propre à toi, basé sur tes propres tests. Le FINA T-score (ou FINA Points) est une échelle de classement mondial comparant ta performance à des références élite. La CSS est l\'outil d\'entraînement, le T-score est l\'outil de comparaison compétitive.' },
  { q:'Ma CSS est-elle valable pour l\'eau libre ?', a:'La CSS est mesurée en piscine (eau calme, virages). En eau libre, les conditions extérieures (vagues, combinaison, navigation) modifient les allures. En pratique, tes temps de course en eau libre seront légèrement différents de la prédiction CSS pure, mais les zones d\'intensité restent pertinentes comme repères de ressenti.' },
]

function secToMMSS(s) {
  const m = Math.floor(s / 60), ss = Math.round(s % 60)
  return `${m}'${String(ss).padStart(2,'0')}`
}
function parseTime(min, sec) {
  return (parseInt(min)||0) * 60 + (parseInt(sec)||0)
}

export default function CSSCalculator() {
  const calcRef = useRef()
  const [min200, setMin200] = useState(''); const [sec200, setSec200] = useState('')
  const [min400, setMin400] = useState(''); const [sec400, setSec400] = useState('')
  const [openFaq, setOpenFaq] = useState(null)

  useEffect(() => {
    const prev = document.title
    document.title = 'Calculateur CSS natation : Vitesse Critique de Nage | The Ultimate Academy'
    const meta = document.querySelector('meta[name="description"]')
    const prevM = meta?.content
    if (meta) meta.content = 'Calcule ta CSS (Critical Swim Speed) à partir de tes tests 200m et 400m. Obtiens tes zones d\'entraînement natation.'
    return () => { document.title = prev; if (meta&&prevM!=null) meta.content = prevM }
  }, [])

  const t200 = parseTime(min200, sec200)
  const t400 = parseTime(min400, sec400)
  const valid = t200 > 0 && t400 > 0 && t400 > t200
  const cssPace = valid ? (t400 - t200) / 2 : 0

  return (
    <div style={{ background:'#000', color:'#fff', overflowX:'hidden' }}>
      <Nav />

      <PageHero
        badge="Natation"
        title={<>CSS : <span style={gradText}>Vitesse Critique</span> de Nage</>}
        subtitle="Calcule ta Critical Swim Speed à partir de deux tests maximaux et découvre tes zones d'intensité en natation"
      >
        <button onClick={()=>calcRef.current?.scrollIntoView({behavior:'smooth'})} style={{ padding:'1rem 2.5rem', borderRadius:50, border:'none', background:`linear-gradient(135deg,${C.purple},${C.pink})`, color:'#fff', fontSize:'1.05rem', fontWeight:700, cursor:'pointer', boxShadow:'0 8px 32px rgba(232,35,122,.5)' }}>Calculer ma CSS ↓</button>
      </PageHero>

      {/* CALCULATOR */}
      <section ref={calcRef} id="outil" style={{ background:C.light, padding:'5rem 1.5rem' }}>
        <Inner max={760}>
          <div style={{ textAlign:'center', marginBottom:'2.5rem' }}>
            <SectionTag>Calculateur CSS</SectionTag>
            <h2 style={{ fontSize:'clamp(1.5rem,3vw,2rem)', fontWeight:900, color:C.dark, marginBottom:'.5rem' }}>Tes allures natation personnalisées</h2>
            <p style={{ color:'rgba(26,18,48,.5)', fontSize:'.9rem' }}>Deux tests suffisent : un 200m et un 400m à allure maximale, avec 10-15 min de récupération entre les deux</p>
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
                    <p style={{ fontSize:'.75rem', color:'rgba(26,18,48,.45)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:'.3rem' }}>1 500m estimé à CSS</p>
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
                        const speedLo = z.pct[0] * (100/cssPace)
                        const speedHi = z.pct[1] * (100/cssPace)
                        const paceLo = speedLo > 0 ? 100/speedLo : 0
                        const paceHi = speedHi > 0 ? 100/speedHi : 0
                        const pctLo = Math.round(z.pct[0]*100), pctHi = Math.round(z.pct[1]*100)
                        return <tr key={z.n} style={{ borderTop:'1px solid rgba(139,47,201,.07)' }}>
                          <td style={{ padding:'.6rem .75rem' }}><span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:24, height:24, borderRadius:'50%', background:z.color+'25', color:z.color, fontSize:'.8rem', fontWeight:700 }}>{z.n}</span></td>
                          <td style={{ padding:'.6rem .75rem', color:z.color, fontWeight:600, fontSize:'.85rem' }}>{z.name}</td>
                          <td style={{ padding:'.6rem .75rem', color:C.dark, fontVariantNumeric:'tabular-nums', fontSize:'.85rem' }}>
                            {z.n === 1 ? `> ${secToMMSS(cssPace / z.pct[1])}` :
                             z.n === 5 ? `< ${secToMMSS(cssPace / z.pct[0])}` :
                             `${secToMMSS(paceHi)} – ${secToMMSS(paceLo)}`}
                          </td>
                          <td style={{ padding:'.6rem .75rem', color:'rgba(26,18,48,.45)', fontVariantNumeric:'tabular-nums' }}>
                            {z.n === 1 ? `< ${pctHi}%` : z.n === 5 ? `> ${pctLo}%` : `${pctLo} – ${pctHi}%`}
                          </td>
                          <td style={{ padding:'.6rem .75rem', color:'rgba(26,18,48,.5)', fontSize:'.82rem' }}>{z.desc}</td>
                        </tr>
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Split times table */}
                <p style={{ fontWeight:700, color:C.dark, marginBottom:'.5rem', fontSize:'.95rem' }}>Temps prévisionnels à ta CSS et allures triathlon</p>
                <p style={{ color:'rgba(26,18,48,.45)', fontSize:'.82rem', marginBottom:'.75rem' }}>Temps estimés à ton allure CSS exacte. Pour les distances triathlon, la colonne "% CSS en course" indique l'intensité réaliste en compétition.</p>
                <div style={{ overflow:'hidden', overflowX:'auto', borderRadius:12, border:'1px solid rgba(139,47,201,.1)' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'.875rem' }}>
                    <thead><tr style={{ background:'#1a1230' }}>
                      {['Distance','Temps à CSS','Format triathlon','% CSS en course'].map(h=><th key={h} style={{ padding:'.6rem .85rem', textAlign:'left', color:'rgba(255,255,255,.75)', fontWeight:600, fontSize:'.72rem', textTransform:'uppercase', letterSpacing:'.07em' }}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {SWIM_DISTS.map((d,i)=>{
                        const secs = cssPace * d.m / 100
                        const hh = Math.floor(secs/3600), mm = Math.floor((secs%3600)/60), ss = Math.round(secs%60)
                        const display = hh>0 ? `${hh}h${String(mm).padStart(2,'0')}'${String(ss).padStart(2,'0')}` : secToMMSS(secs)
                        return <tr key={d.m} style={{ borderTop:'1px solid rgba(139,47,201,.07)', background:i%2===0?'transparent':'rgba(139,47,201,.02)' }}>
                          <td style={{ padding:'.6rem .85rem', color:C.purple, fontWeight:600 }}>{d.label}</td>
                          <td style={{ padding:'.6rem .85rem', color:C.dark, fontWeight:600, fontVariantNumeric:'tabular-nums' }}>{display}</td>
                          <td style={{ padding:'.6rem .85rem', color:'rgba(26,18,48,.4)', fontSize:'.82rem' }}>{d.note || ''}</td>
                          <td style={{ padding:'.6rem .85rem', color: d.pctRace ? C.purple : 'rgba(26,18,48,.2)', fontWeight: d.pctRace ? 600 : 400, fontSize:'.85rem' }}>{d.pctRace || 'n/a'}</td>
                        </tr>
                      })}
                    </tbody>
                  </table>
                </div>
                <p style={{ fontSize:'.75rem', color:'rgba(26,18,48,.35)', marginTop:'.6rem' }}>Source allures triathlon : Laursen P.B. et al., Int J Sports Physiol Perform, 2006</p>
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
          <div style={{ display:'flex', gap:'3rem', alignItems:'flex-start', flexWrap:'wrap' }}>
            <div style={{ flex:'1 1 320px' }}>
              <div style={{ background:C.light, borderRadius:20, padding:'2rem', border:'1px solid rgba(139,47,201,.12)' }}>
                <p style={{ fontWeight:800, color:C.dark, fontSize:'1rem', marginBottom:'1.25rem' }}>La formule CSS</p>
                <div style={{ background:'#fff', borderRadius:14, padding:'1.5rem', textAlign:'center', marginBottom:'1.25rem', border:'1px solid rgba(139,47,201,.1)' }}>
                  <p style={{ fontSize:'1.35rem', fontWeight:900, color:C.dark, margin:0, fontFamily:'Georgia,serif', letterSpacing:'.02em' }}>
                    CSS = (T<sub>400</sub> &minus; T<sub>200</sub>) / 2
                  </p>
                  <p style={{ color:'rgba(26,18,48,.4)', fontSize:'.78rem', margin:'.4rem 0 0' }}>résultat en secondes par 100m</p>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.75rem', marginBottom:'1rem' }}>
                  <div style={{ background:'rgba(232,35,122,.06)', borderRadius:10, padding:'.9rem', border:'1px solid rgba(232,35,122,.12)' }}>
                    <p style={{ fontWeight:700, color:'#E8237A', marginBottom:'.3rem', fontSize:'.85rem' }}>T<sub>400</sub></p>
                    <p style={{ color:'rgba(26,18,48,.6)', fontSize:'.8rem', lineHeight:1.55, margin:0 }}>Ton temps sur 400m à effort maximal soutenable</p>
                  </div>
                  <div style={{ background:'rgba(139,47,201,.06)', borderRadius:10, padding:'.9rem', border:'1px solid rgba(139,47,201,.12)' }}>
                    <p style={{ fontWeight:700, color:C.purple, marginBottom:'.3rem', fontSize:'.85rem' }}>T<sub>200</sub></p>
                    <p style={{ color:'rgba(26,18,48,.6)', fontSize:'.8rem', lineHeight:1.55, margin:0 }}>Ton temps sur 200m à effort maximal soutenable</p>
                  </div>
                </div>
                <p style={{ color:'rgba(26,18,48,.3)', fontSize:'.72rem', margin:0, textAlign:'center', fontStyle:'italic' }}>Wakayoshi K. et al., Journal of Applied Physiology, 1992</p>
              </div>
            </div>
            <div style={{ flex:'1 1 320px' }}>
              <SectionTag>La science derrière la CSS</SectionTag>
              <H2L>L'allure de seuil en natation</H2L>
              <div style={{ color:'rgba(26,18,48,.65)', fontSize:'.9rem', lineHeight:1.8, display:'flex', flexDirection:'column', gap:'1rem' }}>
                <p style={{ textAlign:'justify' }}>La <strong style={{ color:C.dark }}>CSS (Critical Swim Speed)</strong> est la vitesse maximale que tu peux maintenir sur une longue distance (environ 1 500m) sans accumuler excessivement de lactate. Elle a été formalisée par <strong style={{ color:C.dark }}>Wakayoshi et al. en 1992</strong> (<em>Journal of Applied Physiology</em>) comme l'équivalent natation du seuil anaérobie.</p>
                <p style={{ textAlign:'justify' }}>Son principe repose sur le fait que pour aller vite, tu utilises ta réserve anaérobie. La CSS est exactement la vitesse à partir de laquelle cette réserve n'est plus sollicitée : tu peux donc théoriquement la tenir sur une très longue durée sans t'épuiser.</p>
                <p style={{ textAlign:'justify' }}>En pratique, la CSS est l'équivalent du <strong style={{ color:C.dark }}>FTP en cyclisme</strong> ou de l'<strong style={{ color:C.dark }}>allure de seuil en course à pied</strong>. Toutes tes zones de nage se construisent autour de cette référence personnelle. En compétition triathlon, tu ne nages jamais à 100% de ta CSS sur les longues distances : tu peux consulter le tableau ci-dessus pour connaître l'intensité réaliste selon le format.</p>
              </div>
            </div>
          </div>
        </Inner>
      </section>

      {/* HOW TO TEST */}
      <section style={{ background:'#0C0A18', padding:'5rem 1.5rem' }}>
        <Inner max={1100}>
          <div style={{ textAlign:'center', marginBottom:'3rem' }}>
            <SectionTag dark>Protocole de test</SectionTag>
            <H2D>Comment réaliser tes tests ?</H2D>
            <p style={{ color:'rgba(255,255,255,.45)', fontSize:'.9rem', maxWidth:600, margin:'.5rem auto 0' }}>Les deux tests doivent être réalisés le même jour, dans cet ordre précis, en piscine de 25m ou 50m. La qualité de l'exécution conditionne directement la fiabilité de ta CSS.</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'1.25rem' }}>
            {[
              { n:'01', t:'Échauffement complet', d:"Nage 400 à 600m en progressant en intensité : commence très lentement, puis passe par quelques accélérations de 25m pour activer ton système cardio-vasculaire. Termine par 2 à 3 longueurs à l'allure cible du 400m. Ton cœur doit être chaud, tes épaules déverrouillées et ta respiration fluide avant de lancer le premier test." },
              { n:'02', t:'Test 400m : effort soutenu', d:"Lance le chrono et nage 400m à l'allure la plus élevée que tu puisses maintenir jusqu'à la fin sans décrocher. L'erreur classique est de partir trop vite sur les 100 premiers mètres : commence légèrement en dessous de ton maximum et gère ton effort pour finir fort. Note ton temps au centième de seconde si possible." },
              { n:'03', t:'Récupération 10-15 min', d:"Après le 400m, nage lentement pendant 10 à 15 minutes. Cette phase est non négociable : si tu te lances dans le 200m encore fatigué, ta CSS sera artificiellement élevée et tes zones incorrectes. Le critère : tu dois te sentir prêt à donner un effort maximal sur 200m. Si ce n'est pas le cas, étire le temps de récupération." },
              { n:'04', t:'Test 200m : effort maximal', d:"Nage le 200m à fond. Contrairement au 400m, tu peux ici te permettre de partir plus fort car la distance est deux fois plus courte. Chaque longueur doit être intense. C'est la différence entre les temps des deux tests qui détermine ta CSS : plus elle est grande, plus tu as bien géré tes deux efforts à des intensités distinctes." },
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
        <Inner max={1100}>
          <div style={{ textAlign:'center', marginBottom:'3rem' }}>
            <SectionTag>Utiliser sa CSS</SectionTag>
            <H2L>Entraîner sa CSS efficacement</H2L>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'1.25rem' }}>
            {[
              { icon:'🔁', t:'Répétitions CSS', d:"La séance de référence : 8 à 12 × 100m à exactement ton allure CSS, avec 15-20 secondes de repos entre chaque répétition. C'est l'équivalent d'une séance tempo en course à pied." },
              { icon:'📈', t:'Blocs progressifs', d:"Commence par 6 × 100m et augmente progressivement à 10 × 100m ou 5 × 200m sur 6-8 semaines. L'objectif est de tenir l'allure CSS sur un volume croissant." },
              { icon:'⚡', t:'Pyramides de vitesse', d:"50m rapide (Zone 5) puis 100m à CSS puis 200m sous CSS. Ce type de séance développe simultanément ta CSS et ta puissance aérobie maximale." },
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
