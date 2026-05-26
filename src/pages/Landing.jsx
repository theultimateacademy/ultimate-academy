import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Nav from '../components/Nav'

const TOOLS = [
  { label: 'Temps de passage',     path: '/calculateur' },
  { label: 'Calculateur de VMA',   path: '/calculateur/vma' },
  { label: 'Test de Cooper & VO2max', path: '/calculateur/vo2max' },
  { label: 'Allures & zones FC',   path: '/calculateur/allures' },
  { label: 'Prédicteur de chrono', path: '/calculateur/predicteur' },
]

const FEATURES = [
  { icon: '🎯', title: 'Plan sur-mesure',          desc: 'Conçu selon ton niveau, tes objectifs et tes disponibilités' },
  { icon: '⚡', title: 'Adapté en continu',         desc: 'Ton plan évolue chaque semaine selon tes retours et ta progression' },
  { icon: '💬', title: 'Coaching direct',           desc: 'Tu peux me contacter à tout moment, réponse sous 24h' },
  { icon: '⌚', title: 'Synchro montre',            desc: 'Tes séances arrivent directement sur Garmin, Coros ou Suunto' },
  { icon: '💪', title: 'Renforcement musculaire',   desc: 'Une séance de renfo adaptée chaque semaine pour courir plus fort' },
  { icon: '🥗', title: 'Nutrition du sportif',      desc: 'Conseils et recettes adaptés à l\'endurance' },
  { icon: '📊', title: 'Suivi de progression',      desc: 'Visualise tes progrès semaine après semaine' },
  { icon: '🌸', title: 'Suivi cycle féminin',       desc: 'Adaptation automatique du plan selon ton cycle' },
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
  {
    q: "Pour quel niveau de coureur est ce coaching ?",
    a: "Tous les niveaux sont les bienvenus, du grand débutant qui n'a jamais couru 5 km jusqu'au coureur confirmé qui vise un ultra. Ce qui compte, c'est ton engagement et ton objectif : le plan s'adapte à toi, pas l'inverse.",
  },
  {
    q: "Comment se passe le suivi au quotidien ?",
    a: "Chaque semaine, j'analyse tes séances, ta charge et tes retours. Je t'envoie un bilan personnalisé avec mes observations et j'ajuste le programme si nécessaire. Tu peux aussi m'écrire directement via la messagerie à tout moment.",
  },
  {
    q: "En combien de temps vais-je voir des résultats ?",
    a: "Les premières sensations changent souvent dès 3 à 4 semaines. Des progrès mesurables (chrono, distance, facilité perçue) arrivent généralement entre 6 et 10 semaines selon le point de départ. La régularité est le seul vrai levier.",
  },
  {
    q: "Puis-je annuler mon abonnement à tout moment ?",
    a: "Oui, sans préavis ni justification. Tu annules depuis ton espace, l'abonnement reste actif jusqu'à la fin de la période en cours, puis s'arrête. Aucun frais caché, aucune fidélisation forcée.",
  },
  {
    q: "Que se passe-t-il si je me blesse ou dois m'arrêter ?",
    a: "On adapte immédiatement. Une blessure n'est pas une raison d'abandonner le suivi : on travaille ensemble sur la récupération, le maintien de la condition et la reprise progressive. Tu n'es pas livré à toi-même.",
  },
  {
    q: "Combien de temps d'entraînement faut-il prévoir par semaine ?",
    a: "De 2 à 6 séances selon tes disponibilités et ton objectif. Je construis le plan autour de ton emploi du temps réel, pas d'un idéal théorique. 3 séances bien faites valent mieux que 6 séances bâclées.",
  },
  {
    q: "La connexion Strava est-elle obligatoire ?",
    a: "Non, elle n'est pas obligatoire. Si tu n'utilises pas Strava, tu peux simplement me partager tes données manuellement via la messagerie. L'important c'est l'information, pas l'outil.",
  },
]


const gd = (text) => ({
  background: 'linear-gradient(135deg, #8B2FC9 0%, #E8237A 100%)',
  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  display: 'inline',
})

export default function Landing() {
  const { user, isCoach } = useAuth()
  const navigate = useNavigate()
  const [openFaq, setOpenFaq] = useState(null)

  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    if (hash) setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' }), 120)
  }, [])

  const handleCTA = () => {
    if (!user) { navigate('/register'); return }
    navigate(isCoach ? '/admin' : '/app/home')
  }

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div style={{ background: '#000', color: '#fff', overflowX: 'hidden' }}>
      <Nav />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <header style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
        padding: '7rem 1.5rem 4rem', position: 'relative', overflow: 'hidden',
        background: 'radial-gradient(ellipse at 50% 45%, rgba(139,47,201,.18) 0%, rgba(232,35,122,.10) 42%, transparent 68%), #0C0A18',
      }}>
        {/* Glow accent secondaire */}
        <div style={{
          position: 'absolute', top: '60%', left: '65%', transform: 'translate(-50%,-50%)',
          width: 600, height: 500, pointerEvents: 'none',
          background: 'radial-gradient(ellipse, rgba(232,35,122,.07) 0%, transparent 65%)',
        }} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent, #8B2FC9, #E8237A, transparent)',
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 900 }}>
          <h1 style={{
            fontSize: 'clamp(3.5rem, 10vw, 7rem)', fontWeight: 800,
            letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: '1.75rem',
          }}>
            Cours plus vite,<br />
            <span style={gd()}>va plus loin.</span>
          </h1>

          <p style={{
            color: 'rgba(255,255,255,.6)', fontSize: 'clamp(1.05rem, 2.5vw, 1.3rem)',
            maxWidth: 560, margin: '0 auto 2.75rem', lineHeight: 1.8,
          }}>
            Je conçois ton plan sur-mesure, suis ta progression semaine après semaine
            et t'accompagne jusqu'à ton objectif, du 5 km au marathon.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={handleCTA} className="btn-liquid-primary">
              Je veux progresser →
            </button>
            <button onClick={() => scrollTo('coach')} className="btn-liquid-ghost">
              En savoir plus
            </button>
          </div>
        </div>

        <div style={{
          position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
          color: 'rgba(255,255,255,.3)', fontSize: '1.4rem',
          animation: 'floatDown 2s ease-in-out infinite',
        }}>↓</div>
      </header>

      {/* ── STATS ────────────────────────────────────────────── */}
      <section style={{
        background: '#0A0A0A', padding: '2.5rem 1.5rem',
        borderTop: '1px solid rgba(255,255,255,.06)', borderBottom: '1px solid rgba(255,255,255,.06)',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1.5rem', textAlign: 'center' }}>
          {[['250+','Athlètes accompagnés'],['4.9/5','Satisfaction'],['93%','Objectifs atteints'],['12 sem.','Durée moyenne']].map(([val,lbl]) => (
            <div key={lbl}>
              <div style={{ fontSize: 'clamp(1.8rem,4vw,2.5rem)', fontWeight: 800, letterSpacing: '-0.02em', ...gd() }}>{val}</div>
              <div style={{ color: 'rgba(255,255,255,.45)', fontSize: '.85rem', marginTop: '.3rem' }}>{lbl}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES BENTO ───────────────────────────────────── */}
      <section id="features" style={{ padding: '6rem 1.5rem', background: '#000', borderTop: '1px solid rgba(255,255,255,.06)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={{ fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '.75rem' }}>
              Ce que je <span style={gd()}>t'apporte</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,.4)', fontSize: '1rem' }}>Un accompagnement complet pour progresser intelligemment</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '.75rem' }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{
                display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1.1rem 1.25rem',
                borderRadius: 18, background: 'rgba(255,255,255,.04)',
                border: '1px solid rgba(255,255,255,.08)',
                backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                transition: 'border-color .2s',
              }}>
                <div style={{ fontSize: '1.6rem', flexShrink: 0, marginTop: '.1rem' }}>{f.icon}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '.95rem', color: '#fff', marginBottom: '.25rem' }}>{f.title}</div>
                  <div style={{ fontSize: '.82rem', color: 'rgba(255,255,255,.45)', lineHeight: 1.6 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COACH ────────────────────────────────────────────── */}
      <section id="coach" style={{ padding: '6rem 1.5rem', background: '#0A0A0A', borderTop: '1px solid rgba(255,255,255,.06)' }}>
        <div className="container" style={{ maxWidth: 960 }}>
          <div style={{ display: 'flex', gap: '4rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flexShrink: 0, width: 'min(100%, 300px)' }}>
              <div style={{ borderRadius: 28, overflow: 'hidden', position: 'relative',
                boxShadow: '0 0 60px rgba(232,35,122,.25), 0 32px 64px rgba(0,0,0,.5)',
                border: '1px solid rgba(255,255,255,.12)' }}>
                <img src="/Coach.JPG" alt="Alexis" style={{ width: '100%', display: 'block', objectFit: 'cover', aspectRatio: '3/4' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#8B2FC9,#E8237A)' }} />
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', padding: '.35rem 1rem',
                borderRadius: 99, background: 'rgba(139,47,201,.18)', border: '1px solid rgba(139,47,201,.35)',
                fontSize: '.8rem', fontWeight: 600, color: '#C084FC', marginBottom: '1.25rem' }}>
                Ton coach
              </div>
              <h2 style={{ fontSize: 'clamp(2.5rem,6vw,4rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '1.75rem' }}>Alexis</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  "Ancien militaire et moniteur de ski, je suis aujourd'hui éducateur sportif et actuellement en formation STAPS. Le sport structure ma vie depuis toujours, et cette diversité d'expériences m'a appris à m'adapter, à transmettre et à comprendre les besoins de chaque athlète.",
                  "Sur route, je cours le 10km en 34 minutes et le semi en 1h19. En montagne, j'ai enchaîné plusieurs ultras dont un 126km avec 6500m de dénivelé positif.",
                  "Je connais la discipline qu'exige un objectif ambitieux et la fierté de le franchir. C'est cette expérience que je mets entièrement au service de ton programme.",
                ].map((t, i) => (
                  <p key={i} style={{ lineHeight: 1.8, color: 'rgba(255,255,255,.62)', fontSize: '.9875rem', textAlign: 'justify' }}>{t}</p>
                ))}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.6rem', marginTop: '2rem' }}>
                {[['🏃','10km en 34min'],['🥈','Semi en 1h19'],['🏔️','126km / 6500m D+'],['🎿','Moniteur de ski'],['🎓','Éducateur sportif · STAPS']].map(([icon,label]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '.4rem',
                    padding: '.4rem .9rem', borderRadius: 99,
                    background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)',
                    fontSize: '.8rem', fontWeight: 500, color: 'rgba(255,255,255,.8)' }}>
                    <span>{icon}</span> {label}
                  </div>
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
        <div className="container" style={{ maxWidth: 820 }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '.6rem' }}>
              Une seule offre, <span style={gd()}>sans compromis</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,.4)', fontSize: '1rem' }}>Tout ce qu'il faut pour progresser. Rien de superflu.</p>
          </div>

          <div className="pricing-card pricing-card--featured" style={{ padding: '3rem 2.5rem' }}>
            <div style={{ position: 'absolute', top: '-1px', left: '50%', transform: 'translateX(-50%)',
              background: 'linear-gradient(135deg,#8B2FC9,#E8237A)', color: '#fff',
              fontSize: '.72rem', fontWeight: 700, padding: '.35rem 1.6rem', borderRadius: '0 0 14px 14px',
              letterSpacing: '.07em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              14 jours d'essai gratuit
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px,100%),1fr))', gap: '3rem', alignItems: 'center', marginTop: '.5rem' }}>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '.78rem', fontWeight: 700, color: 'rgba(255,255,255,.55)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '1rem', textAlign: 'center', width: '100%' }}>
                  Coaching Personnalisé
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '.4rem', marginBottom: '.3rem' }}>
                  <span className="price-amount">30€</span>
                  <span className="price-period">/mois</span>
                </div>
                <p style={{ color: 'rgba(255,255,255,.65)', fontSize: '.85rem', marginBottom: '.4rem', lineHeight: 1.6 }}>
                  après 14 jours offerts
                </p>
                <p style={{ color: 'rgba(255,255,255,.5)', fontSize: '.78rem', marginBottom: '2rem', lineHeight: 1.5 }}>
                  Sans engagement. Annule à tout moment.
                </p>
                <button onClick={handleCTA} className="btn-liquid-primary" style={{ width: '100%', fontSize: '1rem', padding: '1rem 1.5rem' }}>
                  Commencer gratuitement →
                </button>
                <p style={{ color: 'rgba(255,255,255,.45)', fontSize: '.72rem', marginTop: '.75rem' }}>
                  Carte requise · aucun débit pendant 14 jours
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem', textAlign: 'left' }}>
                {[
                  "Plan d'entraînement 100% personnalisé",
                  'Adaptation hebdomadaire du programme',
                  'Connexion Strava intégrée',
                  'Programme de renforcement musculaire',
                  'Messagerie directe avec moi',
                  'Analyse continue de ta progression',
                ].map(f => (
                  <div key={f} style={{ display: 'flex', gap: '.75rem', alignItems: 'center', fontSize: '.9rem', color: 'rgba(255,255,255,.78)' }}>
                    <span style={{ ...gd(), fontWeight: 700, fontSize: '1rem', flexShrink: 0 }}>✓</span> {f}
                  </div>
                ))}
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────── */}
      <section id="resultats" style={{ padding: '5rem 0', background: '#0A0A0A', overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,.06)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem', padding: '0 1.5rem' }}>
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
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={{ fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '.6rem' }}>
              Questions <span style={gd()}>fréquentes</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,.4)', fontSize: '1rem' }}>Tout ce que tu veux savoir avant de commencer</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
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
                      background: open ? 'linear-gradient(135deg,#8B2FC9,#E8237A)' : 'rgba(255,255,255,.08)',
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

          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
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
      <footer style={{ padding: '3rem 1.5rem 2rem', borderTop: '1px solid rgba(255,255,255,.06)', background: '#000' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: '2.5rem', marginBottom: '2rem' }}>
            <div>
              <img src="/Logo.png" alt="The Ultimate Academy" style={{ height: 60, width: 'auto', opacity: .8, marginBottom: '.85rem' }} />
              <p style={{ color: 'rgba(255,255,255,.2)', fontSize: '.78rem', margin: 0 }}>
                © 2026 The Ultimate Academy<br />Tous droits réservés.
              </p>
            </div>
            <div>
              <p style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.25)', marginBottom: '.85rem' }}>Outils gratuits</p>
              {TOOLS.map(t => (
                <Link key={t.path} to={t.path} style={{ display: 'block', color: 'rgba(255,255,255,.38)', fontSize: '.82rem', textDecoration: 'none', marginBottom: '.5rem' }}>{t.label}</Link>
              ))}
            </div>
            <div>
              <p style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.25)', marginBottom: '.85rem' }}>Blog</p>
              <Link to="/blog" style={{ display: 'block', color: 'rgba(255,255,255,.38)', fontSize: '.82rem', textDecoration: 'none', marginBottom: '.5rem' }}>Tous les articles</Link>
              <Link to="/blog" style={{ display: 'block', color: 'rgba(255,255,255,.38)', fontSize: '.82rem', textDecoration: 'none', marginBottom: '.5rem' }}>Plans d'entraînement</Link>
              <Link to="/blog" style={{ display: 'block', color: 'rgba(255,255,255,.38)', fontSize: '.82rem', textDecoration: 'none', marginBottom: '.5rem' }}>Nutrition</Link>
              <Link to="/blog" style={{ display: 'block', color: 'rgba(255,255,255,.38)', fontSize: '.82rem', textDecoration: 'none', marginBottom: '.5rem' }}>Trail & Marathon</Link>
            </div>
            <div>
              <p style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.25)', marginBottom: '.85rem' }}>Légal</p>
              <Link to="/privacy" style={{ display: 'block', color: 'rgba(255,255,255,.38)', fontSize: '.82rem', textDecoration: 'none', marginBottom: '.5rem' }}>Politique de confidentialité</Link>
              <Link to="/terms"   style={{ display: 'block', color: 'rgba(255,255,255,.38)', fontSize: '.82rem', textDecoration: 'none', marginBottom: '.5rem' }}>CGV</Link>
              <Link to="/cookies" style={{ display: 'block', color: 'rgba(255,255,255,.38)', fontSize: '.82rem', textDecoration: 'none', marginBottom: '.5rem' }}>Cookies</Link>
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}
