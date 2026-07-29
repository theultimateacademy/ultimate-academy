import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Nav from '../components/Nav'
import SiteFooter from '../components/SiteFooter'
import HeroTerrain from '../components/HeroTerrain'

const TOOLS = [
  { label: 'Temps de passage',        path: '/calculateur' },
  { label: 'Calculateur de VMA',      path: '/calculateur/vma' },
  { label: 'Test de Cooper & VO2max', path: '/calculateur/vo2max' },
  { label: 'Allures & zones FC',      path: '/calculateur/allures' },
  { label: 'Estime ton chrono',       path: '/calculateur/predicteur' },
]

const FEATURES = [
  { icon: '🎯', title: 'Plan sur-mesure', desc: "Ton programme est construit à partir de zéro : ton niveau actuel, ton historique de blessures, le temps que tu as chaque semaine et ton objectif précis. Aucun plan copié-collé, chaque séance a une raison d'être." },
  { icon: '⚡', title: 'Adapté en continu', desc: "Chaque semaine, j'analyse tes séances Strava, tes ressentis et ta charge réelle. Si quelque chose ne colle pas (fatigue, manque de temps, séance ratée), j'ajuste immédiatement. Ton plan est vivant, pas figé." },
  { icon: '💬', title: 'Coaching direct', desc: "Tu as une question sur une séance, un doute sur une douleur ou besoin d'un retour ? Tu m'écris directement depuis l'app. Je réponds sous 24h, souvent bien moins. Pas de formulaire, pas d'intermédiaire." },
  { icon: '🌡️', title: 'Adaptation fatigue & météo', desc: "Semaine chargée au boulot, mauvaise nuit ou 38°C dehors ? Je tiens compte de tout ça. Pas question de te faire exploser sur une sortie longue quand les conditions ne le permettent pas. Savoir doser, c'est aussi s'entraîner intelligemment." },
  { icon: '💪', title: 'Renforcement musculaire', desc: "Une séance de renforcement spécifique est intégrée chaque semaine : gainage, fessiers, chaîne postérieure. Moins de blessures, une foulée plus économique et une meilleure puissance en côte. Le renfo, c'est pas en option." },
  { icon: '🥗', title: 'Nutrition du sportif', desc: "Hydratation, ravitaillement en course, nutrition avant une sortie longue : je t'accompagne sur les bases concrètes qui font la différence au moment où ça compte. Pas de régime, juste ce qui te permet de performer et de récupérer." },
  { icon: '📊', title: 'Suivi de progression', desc: "Tes données Strava sont analysées chaque semaine : allures, fréquence cardiaque, volume accumulé. Tu vois noir sur blanc d'où tu es parti et jusqu'où tu es allé. La progression se mesure, et quand elle se mesure, elle motive." },
  { icon: '🌸', title: 'Suivi cycle féminin', desc: "Le cycle menstruel impacte directement les performances, la récupération et le moral. Ton plan s'adapte selon les phases pour que tu t'entraînes avec ton corps, pas contre lui. Moins de frustration, plus d'efficacité." },
  { icon: '🏆', title: 'Stratégie de course', desc: "Avant chaque objectif, je te prépare une fiche race day complète : échauffement, stratégie d'allure, gestion de l'effort et points de vigilance. Tu arrives prêt à tout donner, pas juste entraîné." },
]

const TESTIMONIALS = [
  { name: 'Marin',    age: 22, role: 'Finisher Ironman · Prépa triathlon',             emoji: '🏊',  quote: "J'ai fini mon Ironman avec la prépa d'Alexis. Le plan était vraiment adapté à ma charge globale triathlon, je n'avais jamais couru aussi bien sans me blesser." },
  { name: 'Amandine', age: 25, role: 'Finisher Ironman 70.3 · 10km en 49min',          emoji: '🏃‍♀️', quote: "En quelques mois, j'ai passé mon 10km sous les 50min et fini mon premier 70.3. Alexis a su cerner exactement ce dont j'avais besoin dès le départ." },
  { name: 'Baptiste', age: 27, role: 'Semi en 1h24 · 10km en 37min',                   emoji: '⚡',  quote: "1h24 au semi et 37min sur 10km, des chronos que je n'aurais jamais crus possibles seul. Le suivi semaine par semaine fait vraiment la différence." },
  { name: 'Anouk',    age: 25, role: 'Finisher Ironman 70.3 · 10km en 48min',          emoji: '🥇',  quote: "Mon 70.3 finisher et mon 10km en 48min, je les dois à Alexis. Il sait exactement comment doser la charge sans jamais te griller avant le jour J." },
  { name: 'Dimitry',  age: 30, role: 'Finisher 50K Grand Raid Ventoux · Marathon',     emoji: '🏔️', quote: "Finisher du 50K Grand Raid Ventoux et d'un marathon dans la même saison. Je ne pensais vraiment pas que c'était à ma portée. Alexis m'a prouvé le contraire." },
  { name: 'Lucas',    age: 19, role: 'Étudiant · Premier 10km finisher',               emoji: '🎓',  quote: "Je m'étais jamais vu finir un 10km entier. Quatre mois plus tard, j'ai franchi la ligne d'arrivée. Une fierté que j'avais pas du tout anticipée." },
  { name: 'Céline',   age: 38, role: 'Reprise post-grossesse · Objectif semi',         emoji: '🌸',  quote: "Reprendre le sport après une grossesse c'est aussi mental que physique. Alexis n'a jamais forcé le rythme. Je prépare mon premier semi sereinement." },
  { name: 'Romain',   age: 45, role: 'Cadre · Marathon en 3h45',                       emoji: '💼',  quote: "Boulot, famille, deux séances par semaine c'est tout ce que j'avais. Alexis en a fait quelque chose de solide. 3h45 au marathon, je l'avais vraiment pas vu venir." },
  { name: 'Sofia',    age: 31, role: 'Crossfit → Trail · Première course montagne',    emoji: '⛰️', quote: "Du crossfit au trail, j'avais la condition mais pas les fondamentaux de course. Alexis a tout remis en ordre. Ma première course montagne s'est super bien passée." },
]
const TESTIMONIALS_LOOP = [...TESTIMONIALS, ...TESTIMONIALS]

const FAQ = [
  { q: "Pour quel niveau de coureur est ce coaching ?",      a: "Tous les niveaux sont les bienvenus, du grand débutant qui n'a jamais couru 5 km jusqu'au coureur confirmé qui vise un ultra. Ce qui compte, c'est ton engagement et ton objectif : le plan s'adapte à toi, pas l'inverse." },
  { q: "Comment se passe le suivi au quotidien ?",           a: "Chaque semaine, j'analyse tes séances, ta charge et tes retours. Je t'envoie un bilan personnalisé avec mes observations et j'ajuste le programme si nécessaire. Tu peux aussi m'écrire directement via la messagerie à tout moment." },
  { q: "En combien de temps vais-je voir des résultats ?",   a: "Les premières sensations changent souvent dès 3 à 4 semaines. Des progrès mesurables (chrono, distance, facilité perçue) arrivent généralement entre 6 et 10 semaines selon le point de départ. La régularité est le seul vrai levier." },
  { q: "Puis-je annuler mon abonnement à tout moment ?",     a: "Oui, sans préavis ni justification. Tu annules depuis ton espace, l'abonnement reste actif jusqu'à la fin de la période en cours, puis s'arrête. Aucun frais caché, aucune fidélisation forcée." },
  { q: "Que se passe-t-il si je me blesse ou dois m'arrêter ?", a: "On adapte immédiatement. Une blessure n'est pas une raison d'abandonner le suivi : on travaille ensemble sur la récupération, le maintien de la condition et la reprise progressive. Tu n'es pas livré à toi-même." },
  { q: "Combien de temps d'entraînement faut-il prévoir par semaine ?", a: "De 2 à 6 séances selon tes disponibilités et ton objectif. Je construis le plan autour de ton emploi du temps réel, pas d'un idéal théorique. 3 séances bien faites valent mieux que 6 séances bâclées." },
  { q: "La connexion Strava est-elle obligatoire ?",         a: "Non, elle n'est pas obligatoire. Si tu n'utilises pas Strava, tu peux simplement me partager tes données manuellement via la messagerie. L'important c'est l'information, pas l'outil." },
]

const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: 5 + (i * 4.7) % 90,
  y: 5 + (i * 7.3) % 85,
  size: 2 + (i % 3),
  opacity: 0.2 + (i % 5) * 0.07,
  duration: 8 + (i % 8),
  delay: -(i % 6),
}))

const gd = () => ({
  background: 'linear-gradient(135deg, #8B2FC9 0%, #E8237A 100%)',
  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  display: 'inline',
})
const grad = 'linear-gradient(135deg,#8B2FC9,#E8237A)'

const ANIMATIONS = `
@keyframes gradientShift {
  0%   { background-position: 0% 50% }
  50%  { background-position: 100% 50% }
  100% { background-position: 0% 50% }
}
@keyframes floatParticle {
  0%   { transform: translateY(0px) translateX(0px) }
  33%  { transform: translateY(-28px) translateX(18px) }
  66%  { transform: translateY(-8px) translateX(-14px) }
  100% { transform: translateY(0px) translateX(0px) }
}
@keyframes runnerDot {
  0%   { left: -1% }
  100% { left: 101% }
}
@keyframes slideUpFade {
  from { opacity: 0; transform: translateY(32px) }
  to   { opacity: 1; transform: translateY(0) }
}
@keyframes bounceScroll {
  0%, 100% { transform: translateX(-50%) translateY(0) }
  50%       { transform: translateX(-50%) translateY(10px) }
}
@keyframes shimmer {
  0%   { background-position: -200% center }
  100% { background-position:  200% center }
}
@keyframes pricePulse {
  0%, 100% { box-shadow: 0 0 30px rgba(139,47,201,.35), 0 0 60px rgba(232,35,122,.15), 0 24px 48px rgba(0,0,0,.5) }
  50%       { box-shadow: 0 0 55px rgba(139,47,201,.6),  0 0 100px rgba(232,35,122,.3), 0 24px 48px rgba(0,0,0,.5) }
}
@keyframes badgePop {
  from { opacity: 0; transform: scale(0.75) }
  to   { opacity: 1; transform: scale(1) }
}
@keyframes trialBlink {
  0%, 100% { opacity: 1 }
  50%       { opacity: 0.65 }
}
/* ── Reveal 3D : les sections arrivent depuis la profondeur ── */
.reveal-3d {
  opacity: 0;
  transform: perspective(1200px) translateZ(-60px) translateY(40px);
  transition: opacity 0.85s cubic-bezier(0.22,1,0.36,1),
              transform 0.85s cubic-bezier(0.22,1,0.36,1);
  will-change: opacity, transform;
}
.reveal-3d.visible {
  opacity: 1;
  transform: perspective(1200px) translateZ(0px) translateY(0px);
}
/* Variante : arrive de la gauche en profondeur */
.reveal-3d-left {
  opacity: 0;
  transform: perspective(1200px) translateZ(-50px) translateX(-50px) rotateY(8deg);
  transition: opacity 0.9s cubic-bezier(0.22,1,0.36,1),
              transform 0.9s cubic-bezier(0.22,1,0.36,1);
  will-change: opacity, transform;
}
.reveal-3d-left.visible {
  opacity: 1;
  transform: perspective(1200px) translateZ(0px) translateX(0px) rotateY(0deg);
}
/* Variante : arrive de la droite en profondeur */
.reveal-3d-right {
  opacity: 0;
  transform: perspective(1200px) translateZ(-50px) translateX(50px) rotateY(-8deg);
  transition: opacity 0.9s cubic-bezier(0.22,1,0.36,1),
              transform 0.9s cubic-bezier(0.22,1,0.36,1);
  will-change: opacity, transform;
}
.reveal-3d-right.visible {
  opacity: 1;
  transform: perspective(1200px) translateZ(0px) translateX(0px) rotateY(0deg);
}
/* Feature cards staggered */
.feat-card {
  opacity: 0;
  transform: perspective(900px) translateZ(-40px) translateY(30px);
  transition: opacity 0.7s cubic-bezier(0.22,1,0.36,1),
              transform 0.7s cubic-bezier(0.22,1,0.36,1);
  will-change: opacity, transform;
}
.feat-card.visible {
  opacity: 1;
  transform: perspective(900px) translateZ(0px) translateY(0px);
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  .reveal-3d, .reveal-3d-left, .reveal-3d-right, .feat-card {
    opacity: 1 !important;
    transform: none !important;
  }
}
`

function useOnScreen(ref, threshold = 0.2) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return visible
}

// Hook de révélation 3D via IntersectionObserver sur une classe CSS
function useReveal3D(selector = '.reveal-3d', threshold = 0.15) {
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible')
          obs.unobserve(e.target)
        }
      })
    }, { threshold })

    // Observer tous les éléments correspondants dans le DOM
    const attach = () => {
      document.querySelectorAll(`${selector}, .reveal-3d-left, .reveal-3d-right, .feat-card`)
        .forEach(el => { if (!el.classList.contains('visible')) obs.observe(el) })
    }
    // Attendre que le DOM soit rendu
    const timer = setTimeout(attach, 100)
    return () => { clearTimeout(timer); obs.disconnect() }
  }, [])
}

function animateCounter(from, to, duration, onUpdate) {
  const start = performance.now()
  const tick = (now) => {
    const t = Math.min((now - start) / duration, 1)
    const eased = 1 - Math.pow(1 - t, 3)
    onUpdate(from + (to - from) * eased)
    if (t < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

export default function Landing() {
  const { user, isCoach } = useAuth()
  const navigate = useNavigate()
  const [openFaq, setOpenFaq] = useState(null)
  const [heroIn, setHeroIn] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [counts, setCounts] = useState({ a: 0, r: 0, s: 0, w: 0 })
  const [statsStarted, setStatsStarted] = useState(false)
  const [visibleFeatures, setVisibleFeatures] = useState(new Set())
  const [coachIn, setCoachIn] = useState(false)

  const statsRef   = useRef(null)
  const featRef    = useRef(null)
  const coachRef   = useRef(null)
  const pricingRef = useRef(null)

  const statsVisible = useOnScreen(statsRef)
  const featVisible  = useOnScreen(featRef, 0.1)
  const coachVisible = useOnScreen(coachRef, 0.15)

  // Révélation 3D globale sur toute la page
  useReveal3D()

  useEffect(() => { setTimeout(() => setHeroIn(true), 80) }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!statsVisible || statsStarted) return
    setStatsStarted(true)
    animateCounter(0, 70,  2000, v => setCounts(c => ({ ...c, a: v })))
    animateCounter(0, 4.9, 2000, v => setCounts(c => ({ ...c, r: v })))
    animateCounter(0, 93,  2000, v => setCounts(c => ({ ...c, s: v })))
    animateCounter(0, 12,  2000, v => setCounts(c => ({ ...c, w: v })))
  }, [statsVisible, statsStarted])

  useEffect(() => {
    if (!featVisible) return
    FEATURES.forEach((_, i) => {
      setTimeout(() => setVisibleFeatures(prev => new Set([...prev, i])), i * 80)
    })
  }, [featVisible])

  useEffect(() => { if (coachVisible) setCoachIn(true) }, [coachVisible])

  useEffect(() => {
    const el = pricingRef.current
    if (!el) return
    const equalize = () => {
      const cards = el.querySelectorAll('.pricing-card')
      cards.forEach(c => { c.style.height = 'auto' })
      const maxH = Math.max(...Array.from(cards).map(c => c.offsetHeight))
      cards.forEach(c => { c.style.height = maxH + 'px' })
    }
    equalize()
    const ro = new ResizeObserver(equalize)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const handleCTA = () => {
    if (!user) { navigate('/choisir-sport'); return }
    navigate(isCoach ? '/admin' : '/app/home')
  }
  const handleTriathlonCTA = () => {
    if (!user) { localStorage.setItem('sport_type', 'triathlon'); navigate('/register?sport=triathlon'); return }
    navigate(isCoach ? '/admin' : '/app/home')
  }
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  const statItems = [
    { val: Math.floor(counts.a),                               suffix: '+',     label: 'Athlètes accompagnés', pct: 70 },
    { val: counts.r.toFixed(counts.r >= 4.9 ? 1 : 1),         suffix: '/5',    label: 'Satisfaction',         pct: 98 },
    { val: Math.floor(counts.s),                               suffix: '%',     label: 'Objectifs atteints',   pct: 93 },
    { val: Math.floor(counts.w),                               suffix: ' sem.', label: 'Durée moyenne',        pct: 80 },
  ]

  return (
    <div style={{ background: '#000', color: '#fff', overflowX: 'hidden' }}>
      <style>{ANIMATIONS}</style>
      <Nav />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <header style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
        padding: '7rem 1.5rem 4rem', position: 'relative', overflow: 'hidden',
        background: 'radial-gradient(ellipse at 50% 60%, #1a0828 0%, #0d0010 45%, #000000 100%)',
      }}>
        {/* Terrain 3D Three.js */}
        <HeroTerrain />

        {/* Particules CSS */}
        {PARTICLES.map(p => (
          <div key={p.id} style={{
            position: 'absolute', left: `${p.x}%`, top: `${p.y}%`,
            width: p.size, height: p.size, borderRadius: '50%',
            background: '#fff', opacity: p.opacity, pointerEvents: 'none',
            willChange: 'transform',
            animation: `floatParticle ${p.duration}s ${p.delay}s ease-in-out infinite`,
          }} />
        ))}

        {/* Glow violet centre */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          width: 900, height: 700, pointerEvents: 'none',
          background: 'radial-gradient(ellipse, rgba(139,47,201,.13) 0%, rgba(232,35,122,.06) 40%, transparent 70%)',
        }} />

        {/* Contenu hero */}
        <div className="hero-content-3d" style={{ position: 'relative', zIndex: 1, maxWidth: 900, transformStyle: 'preserve-3d' }}>
          <h1 style={{ fontSize: 'clamp(3.5rem, 10vw, 7rem)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: '1.75rem' }}>
            <span style={{
              display: 'block',
              opacity: heroIn ? 1 : 0,
              transform: heroIn ? 'translateY(0)' : 'translateY(32px)',
              transition: 'opacity 0.8s ease, transform 0.8s ease',
            }}>Cours plus vite,</span>
            <span style={{
              display: 'block',
              opacity: heroIn ? 1 : 0,
              transform: heroIn ? 'translateY(0)' : 'translateY(32px)',
              transition: 'opacity 0.8s 0.3s ease, transform 0.8s 0.3s ease',
              ...gd(),
            }}>va plus loin.</span>
          </h1>

          <p style={{
            color: 'rgba(255,255,255,.6)', fontSize: 'clamp(1.05rem, 2.5vw, 1.3rem)',
            maxWidth: 560, margin: '0 auto 2.75rem', lineHeight: 1.8,
            opacity: heroIn ? 1 : 0, transform: heroIn ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 0.8s 0.6s ease, transform 0.8s 0.6s ease',
          }}>
            Je conçois ton plan sur-mesure, suis ta progression semaine après semaine
            et t'accompagne jusqu'à ton objectif, que ce soit une course sur route, un trail ou un triathlon.
          </p>

          <div style={{
            display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap',
            opacity: heroIn ? 1 : 0, transform: heroIn ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.8s 0.9s ease, transform 0.8s 0.9s ease',
          }}>
            <button onClick={handleCTA} style={{
              padding: '.85rem 2rem', borderRadius: 99, border: 'none', cursor: 'pointer',
              fontWeight: 800, fontSize: '1rem', fontFamily: 'inherit', color: '#fff',
              background: `linear-gradient(90deg, #8B2FC9, #E8237A, #8B2FC9)`,
              backgroundSize: '200% auto',
              animation: 'shimmer 3s linear infinite',
              boxShadow: '0 8px 28px rgba(232,35,122,.4)',
              transition: 'transform .2s, box-shadow .2s',
              willChange: 'transform',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 14px 36px rgba(232,35,122,.55)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 8px 28px rgba(232,35,122,.4)' }}>
              Je veux progresser →
            </button>
            <button onClick={() => scrollTo('coach')} className="btn-liquid-ghost">
              En savoir plus
            </button>
          </div>
        </div>

        {/* Overlay dégradé bas du hero */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '180px',
          background: 'linear-gradient(to bottom, transparent, #0a0a0a)',
          zIndex: 1, pointerEvents: 'none',
        }} />

        {/* Scroll indicator */}
        {!scrolled && (
          <div style={{
            position: 'absolute', bottom: '2rem', left: '50%',
            animation: 'bounceScroll 2s ease-in-out infinite',
            cursor: 'pointer', zIndex: 2,
          }} onClick={() => scrollTo('stats')}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              border: '1.5px solid rgba(139,47,201,.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,.45)', fontSize: '1rem',
              backdropFilter: 'blur(4px)',
            }}>↓</div>
          </div>
        )}
      </header>

      {/* ── STATS ────────────────────────────────────────────── */}
      <section id="stats" ref={statsRef} style={{
        background: '#0A0A0A', padding: '3rem 1.5rem',
        borderTop: '1px solid rgba(255,255,255,.06)', borderBottom: '1px solid rgba(255,255,255,.06)',
      }}>
        <div className="reveal-3d" style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1.5rem', textAlign: 'center' }}>
          {statItems.map(({ val, suffix, label, pct }) => (
            <div key={label}>
              <div style={{ fontSize: 'clamp(1.8rem,4vw,2.5rem)', fontWeight: 800, letterSpacing: '-0.02em', ...gd() }}>
                {val}{suffix}
              </div>
              <div style={{ color: 'rgba(255,255,255,.45)', fontSize: '.85rem', marginTop: '.3rem', marginBottom: '.65rem' }}>{label}</div>
              <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 2, background: grad,
                  width: statsStarted ? `${pct}%` : '0%',
                  transition: 'width 2s cubic-bezier(0.25,0.46,0.45,0.94)',
                }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section id="features" ref={featRef} style={{ padding: '6rem 1.5rem', background: '#000', borderTop: '1px solid rgba(255,255,255,.06)' }}>
        <div className="container">
          <div className="reveal-3d" style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={{ fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '.75rem' }}>
              Ce que je <span style={gd()}>t'apporte</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,.4)', fontSize: '1rem' }}>Un accompagnement complet pour progresser intelligemment</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {FEATURES.map((f, idx) => (
              <div key={f.title}
                className={`feat-card${visibleFeatures.has(idx) ? ' visible' : ''}`}
                style={{
                  padding: '1.5rem', borderRadius: 18,
                  background: 'rgba(255,255,255,.04)',
                  border: '1px solid rgba(255,255,255,.08)',
                  backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                  transition: `opacity 0.7s ${idx * 0.06}s cubic-bezier(0.22,1,0.36,1), transform 0.7s ${idx * 0.06}s cubic-bezier(0.22,1,0.36,1), border-color .2s`,
                  transformStyle: 'preserve-3d',
                  position: 'relative', overflow: 'hidden',
                  cursor: 'default',
                }}
                onMouseMove={e => {
                  const card = e.currentTarget
                  const rect = card.getBoundingClientRect()
                  const x    = (e.clientX - rect.left) / rect.width
                  const y    = (e.clientY - rect.top)  / rect.height
                  const rx   = (y - 0.5) * -18
                  const ry   = (x - 0.5) *  18
                  card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(10px)`
                  const shine = card.querySelector('.card-shine')
                  if (shine) {
                    shine.style.setProperty('--mx', x * 100 + '%')
                    shine.style.setProperty('--my', y * 100 + '%')
                    shine.style.opacity = '1'
                  }
                }}
                onMouseLeave={e => {
                  const card = e.currentTarget
                  card.style.transform = ''
                  const shine = card.querySelector('.card-shine')
                  if (shine) shine.style.opacity = '0'
                }}
              >
                <div className="card-shine" style={{
                  position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none',
                  background: 'radial-gradient(circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.13), transparent 60%)',
                  opacity: 0, transition: 'opacity .2s',
                }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '.5rem', position: 'relative', zIndex: 1 }}>
                  <div style={{ fontSize: '1.75rem', lineHeight: 1, flexShrink: 0 }}>{f.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: '.95rem', color: '#fff' }}>{f.title}</div>
                </div>
                <div style={{ fontSize: '.84rem', color: 'rgba(255,255,255,.5)', lineHeight: 1.7, textAlign: 'justify', position: 'relative', zIndex: 1 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COACH ────────────────────────────────────────────── */}
      <section id="coach" ref={coachRef} style={{ padding: '6rem 1.5rem', background: '#0A0A0A', borderTop: '1px solid rgba(255,255,255,.06)' }}>
        <div className="container" style={{ maxWidth: 960 }}>
          <div style={{ display: 'flex', gap: '4rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Photo coach — arrive de gauche */}
            <div className="reveal-3d-left" style={{
              flexShrink: 0, width: 'min(100%, 300px)',
              marginTop: '3rem',
            }}>
              <div style={{
                borderRadius: 28, overflow: 'hidden', position: 'relative',
                boxShadow: '0 0 60px rgba(232,35,122,.25), 0 32px 64px rgba(0,0,0,.5)',
                border: '1px solid rgba(255,255,255,.12)',
              }}>
                <img src="/Coach.JPG" alt="Alexis" style={{ width: '100%', display: 'block', objectFit: 'cover', aspectRatio: '3/4' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: grad }} />
              </div>
            </div>
            {/* Texte coach — arrive de droite */}
            <div className="reveal-3d-right" style={{ flex: 1, minWidth: 260 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', padding: '.35rem 1rem',
                borderRadius: 99, background: 'rgba(139,47,201,.18)', border: '1px solid rgba(139,47,201,.35)',
                fontSize: '.8rem', fontWeight: 600, color: '#C084FC', marginBottom: '1.25rem' }}>
                Ton coach
              </div>
              <h2 style={{ fontSize: 'clamp(2.5rem,6vw,4rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '1.75rem' }}>Alexis</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  "Le sport structure ma vie depuis toujours. Ancien militaire, moniteur de ski et éducateur sportif, j'ai développé une approche exigeante et bienveillante de la performance. Je ne transmets que ce que j'ai testé sur le terrain, et je m'adapte entièrement à ton profil, ton niveau et ta vie.",
                  "Sur route, je cours le 10km en 34 minutes et le semi en 1h19. En montagne, j'ai enchaîné plusieurs ultras dont un 126km avec 6500m de dénivelé positif. J'accompagne aussi des athlètes en triathlon, du sprint à l'Ironman. Ces disciplines, je les connais de l'intérieur, avec leurs exigences, leurs pièges et ce qu'elles demandent vraiment.",
                  "Que tu vises ton premier trail, un ultra, un triathlon ou un chrono sur route, mon rôle est simple : te donner le plan qui te correspond, suivre ta progression semaine après semaine et t'amener sur la ligne de départ dans ta meilleure forme. Ensemble, on construit quelque chose de solide.",
                ].map((t, i) => (
                  <p key={i} style={{ lineHeight: 1.8, color: 'rgba(255,255,255,.62)', fontSize: '.9875rem', textAlign: 'justify' }}>{t}</p>
                ))}
              </div>

              <button onClick={handleCTA} className="btn-liquid-primary" style={{ marginTop: '2rem' }}>
                Travailler avec moi →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────── */}
      <section id="tarifs" style={{ padding: '6rem 1.5rem', background: '#000', borderTop: '1px solid rgba(255,255,255,.06)' }}>
        <div className="container" style={{ maxWidth: 1160 }}>
          <div className="reveal-3d" style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '.6rem' }}>
              Choisis ton <span style={gd()}>niveau d'accompagnement</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,.4)', fontSize: '1rem' }}>Coaching complet ou ressources pour progresser à ton rythme.</p>
          </div>

          <div className="pricing-grid reveal-3d" ref={pricingRef}>

            {/* ── Ebook card ── */}
            <div className="pricing-card" style={{
              padding: '2.5rem 2rem 9rem',
              display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ fontSize: '.78rem', fontWeight: 700, color: 'rgba(255,255,255,.55)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '1rem', textAlign: 'center' }}>
                Ebooks Running
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '.4rem', marginBottom: '.3rem' }}>
                <span className="price-amount">14,99€</span>
              </div>
              <p style={{ color: 'rgba(255,255,255,.65)', fontSize: '.85rem', marginBottom: '.4rem', lineHeight: 1.6, textAlign: 'center' }}>à partir de 14,99€ · selon le plan</p>
              <p style={{ color: 'rgba(255,255,255,.5)', fontSize: '.78rem', marginBottom: '2rem', lineHeight: 1.5, textAlign: 'center' }}>Achat unique. Accès illimité au PDF.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem', textAlign: 'left' }}>
                {[
                  'Séances calculées selon ta VMA réelle',
                  'Choix du nombre de séances par semaine',
                  "Choix d'objectif : 10 km, semi ou marathon",
                  "Long runs progressifs jusqu'à 32 km",
                  'Stratégie de course et gestion des allures',
                  'Téléchargement immédiat · sans abonnement',
                ].map(f => (
                  <div key={f} style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-start', fontSize: '.88rem', color: 'rgba(255,255,255,.78)' }}>
                    <span style={{ ...gd(), fontWeight: 700, fontSize: '1rem', flexShrink: 0, lineHeight: 1.4 }}>✓</span> {f}
                  </div>
                ))}
              </div>
              <Link to="/ebooks" style={{
                position: 'absolute', bottom: '4.5rem', left: '2rem', right: '2rem',
                display: 'block', padding: '1rem 1.5rem', borderRadius: 99, boxSizing: 'border-box',
                textAlign: 'center', fontWeight: 800, fontSize: '1rem', color: '#fff', textDecoration: 'none',
                background: 'linear-gradient(90deg, #8B2FC9, #E8237A, #8B2FC9)',
                backgroundSize: '200% auto',
                animation: 'shimmer 2.5s linear infinite',
                boxShadow: '0 8px 28px rgba(139,47,201,.4)',
                transition: 'transform .2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = '' }}>
                Voir les ebooks →
              </Link>
              <p style={{
                position: 'absolute', bottom: '1.5rem', left: '2rem', right: '2rem',
                color: 'rgba(255,255,255,.3)', fontSize: '.72rem', textAlign: 'center', margin: 0,
              }}>
                Accès immédiat · sans abonnement
              </p>
            </div>

            {/* ── Coaching Course à pied · Trail (Populaire) ── */}
            <div className="pricing-card pricing-card--featured" style={{
              padding: '2.5rem 2rem 9rem',
              animation: 'pricePulse 3s ease-in-out infinite',
              display: 'flex', flexDirection: 'column',
            }}>
              <div style={{
                position: 'absolute', top: '-1px', left: '50%', transform: 'translateX(-50%)',
                background: grad, color: '#fff',
                fontSize: '.72rem', fontWeight: 700, padding: '.35rem 1.6rem', borderRadius: '0 0 14px 14px',
                letterSpacing: '.07em', textTransform: 'uppercase', whiteSpace: 'nowrap',
                animation: 'trialBlink 2.5s ease-in-out infinite',
              }}>
                ⭐ Populaire
              </div>
              <div style={{ fontSize: '.78rem', fontWeight: 700, color: 'rgba(255,255,255,.55)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '1rem', textAlign: 'center' }}>
                Course à pied · Trail
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '.4rem', marginBottom: '.3rem' }}>
                <span className="price-amount">30€</span>
                <span className="price-period">/mois</span>
              </div>
              <p style={{ color: 'rgba(255,255,255,.65)', fontSize: '.85rem', marginBottom: '.4rem', lineHeight: 1.6, textAlign: 'center' }}>après 14 jours offerts</p>
              <p style={{ color: 'rgba(255,255,255,.5)', fontSize: '.78rem', marginBottom: '2rem', lineHeight: 1.5, textAlign: 'center' }}>Sans engagement. Annule à tout moment.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem', textAlign: 'left' }}>
                {[
                  "Plan d'entraînement 100% personnalisé",
                  'Adaptation hebdomadaire du programme',
                  'Connexion Strava intégrée',
                  'Programme de renforcement musculaire',
                  'Messagerie directe avec moi',
                  'Analyse continue de ta progression',
                ].map(f => (
                  <div key={f} style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-start', fontSize: '.88rem', color: 'rgba(255,255,255,.78)' }}>
                    <span style={{ ...gd(), fontWeight: 700, fontSize: '1rem', flexShrink: 0, lineHeight: 1.4 }}>✓</span> {f}
                  </div>
                ))}
              </div>
              <button onClick={handleCTA} style={{
                position: 'absolute', bottom: '4.5rem', left: '2rem', right: '2rem',
                padding: '1rem 1.5rem', borderRadius: 99, border: 'none', cursor: 'pointer', boxSizing: 'border-box',
                fontWeight: 800, fontSize: '1rem', fontFamily: 'inherit', color: '#fff',
                background: 'linear-gradient(90deg, #8B2FC9, #E8237A, #8B2FC9)',
                backgroundSize: '200% auto',
                animation: 'shimmer 2.5s linear infinite',
                boxShadow: '0 8px 28px rgba(232,35,122,.4)',
                transition: 'transform .2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = '' }}>
                Commencer gratuitement →
              </button>
              <p style={{
                position: 'absolute', bottom: '1.5rem', left: '2rem', right: '2rem',
                color: 'rgba(255,255,255,.45)', fontSize: '.72rem', textAlign: 'center', margin: 0,
              }}>
                Carte requise · aucun débit pendant 14 jours
              </p>
            </div>

            {/* ── Coaching Triathlon ── */}
            <div className="pricing-card" style={{
              padding: '2.5rem 2rem 9rem',
              display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ fontSize: '.78rem', fontWeight: 700, color: 'rgba(255,255,255,.55)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '1rem', textAlign: 'center' }}>
                Triathlon
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '.4rem', marginBottom: '.3rem' }}>
                <span className="price-amount">50€</span>
                <span className="price-period">/mois</span>
              </div>
              <p style={{ color: 'rgba(255,255,255,.65)', fontSize: '.85rem', marginBottom: '.4rem', lineHeight: 1.6, textAlign: 'center' }}>après 14 jours offerts</p>
              <p style={{ color: 'rgba(255,255,255,.5)', fontSize: '.78rem', marginBottom: '2rem', lineHeight: 1.5, textAlign: 'center' }}>Sans engagement. Annule à tout moment.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem', textAlign: 'left' }}>
                {[
                  'Plan triathlon 100% personnalisé',
                  'Périodisation sprint, olympique, longue distance',
                  'Connexion Strava intégrée',
                  'Programme de renforcement musculaire',
                  'Messagerie directe avec moi',
                  'Analyse continue de ta progression',
                ].map(f => (
                  <div key={f} style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-start', fontSize: '.88rem', color: 'rgba(255,255,255,.78)' }}>
                    <span style={{ ...gd(), fontWeight: 700, fontSize: '1rem', flexShrink: 0, lineHeight: 1.4 }}>✓</span> {f}
                  </div>
                ))}
              </div>
              <button onClick={handleTriathlonCTA} style={{
                position: 'absolute', bottom: '4.5rem', left: '2rem', right: '2rem',
                padding: '1rem 1.5rem', borderRadius: 99, border: 'none', cursor: 'pointer', boxSizing: 'border-box',
                fontWeight: 800, fontSize: '1rem', fontFamily: 'inherit', color: '#fff',
                background: 'linear-gradient(90deg, #8B2FC9, #E8237A, #8B2FC9)',
                backgroundSize: '200% auto',
                animation: 'shimmer 2.5s linear infinite',
                boxShadow: '0 8px 28px rgba(139,47,201,.35)',
                transition: 'transform .2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = '' }}>
                Commencer gratuitement →
              </button>
              <p style={{
                position: 'absolute', bottom: '1.5rem', left: '2rem', right: '2rem',
                color: 'rgba(255,255,255,.45)', fontSize: '.72rem', textAlign: 'center', margin: 0,
              }}>
                Carte requise · aucun débit pendant 14 jours
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────── */}
      <section id="resultats" style={{ padding: '5rem 0', background: '#0A0A0A', overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,.06)' }}>
        <div className="reveal-3d" style={{ textAlign: 'center', marginBottom: '2.5rem', padding: '0 1.5rem' }}>
          <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '.5rem' }}>
            Ils l'ont <span style={gd()}>fait</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,.4)', fontSize: '1rem' }}>Des vrais résultats, de vraies personnes</p>
        </div>
        <div className="testimonials-viewport">
          <div className="testimonials-track">
            {TESTIMONIALS_LOOP.map((t, i) => (
              <div key={i} className="testimonial-card">
                <div style={{ fontSize: '2rem', marginBottom: '.75rem' }}>{t.emoji}</div>
                <p style={{ fontSize: '.9375rem', lineHeight: 1.75, color: 'rgba(255,255,255,.65)', fontStyle: 'italic', marginBottom: '1rem', flex: 1 }}>
                  "{t.quote}"
                </p>
                <div>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: '.9375rem' }}>{t.name}{t.age ? `, ${t.age} ans` : ''}</div>
                  <div style={{ fontSize: '.78rem', marginTop: '.2rem', fontWeight: 600, ...gd() }}>{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section id="faq" style={{ padding: '6rem 1.5rem', background: '#000', borderTop: '1px solid rgba(255,255,255,.06)' }}>
        <div className="container" style={{ maxWidth: 760 }}>
          <div className="reveal-3d" style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={{ fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '.6rem' }}>
              Questions <span style={gd()}>fréquentes</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,.4)', fontSize: '1rem' }}>Tout ce que tu veux savoir avant de commencer</p>
          </div>

          <div className="reveal-3d" style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            {FAQ.map((item, i) => {
              const open = openFaq === i
              return (
                <div key={i} onClick={() => setOpenFaq(open ? null : i)} style={{
                  borderRadius: 20, overflow: 'hidden', cursor: 'pointer',
                  background: open ? 'rgba(139,47,201,.12)' : 'rgba(255,255,255,.04)',
                  border: `1px solid ${open ? 'rgba(139,47,201,.35)' : 'rgba(255,255,255,.08)'}`,
                  backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                  transition: 'background .2s, border-color .2s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '1.25rem 1.5rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '.975rem', color: open ? '#fff' : 'rgba(255,255,255,.8)', lineHeight: 1.5 }}>
                      {item.q}
                    </span>
                    <span style={{
                      flexShrink: 0, width: 28, height: 28, borderRadius: '50%',
                      background: open ? grad : 'rgba(255,255,255,.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '.9rem', fontWeight: 700, color: '#fff',
                      transition: 'background .2s, transform .25s',
                      transform: open ? 'rotate(45deg)' : 'none',
                    }}>+</span>
                  </div>
                  {open && (
                    <div style={{ padding: '0 1.5rem 1.25rem', color: 'rgba(255,255,255,.6)', fontSize: '.925rem', lineHeight: 1.8 }}>
                      {item.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="reveal-3d" style={{ textAlign: 'center', marginTop: '3rem' }}>
            <p style={{ color: 'rgba(255,255,255,.35)', fontSize: '.9rem', marginBottom: '1.25rem' }}>
              Tu as une autre question ?
            </p>
            <button onClick={() => scrollTo('tarifs')} className="btn-liquid-primary">
              Commencer mon essai gratuit →
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <SiteFooter />
    </div>
  )
}
