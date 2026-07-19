import { Link, useNavigate } from 'react-router-dom'

const grad = 'linear-gradient(135deg,#8B2FC9,#E8237A)'

const SPORTS = [
  {
    id: 'running',
    emoji: '🏃',
    name: 'Course à pied',
    desc: '5km · 10km · Semi-marathon · Marathon',
    price: '30€',
    features: [
      "Plan d'entraînement 100% personnalisé",
      'Adaptation hebdomadaire du programme',
      'Connexion Strava intégrée',
      'Programme de renforcement musculaire',
      'Messagerie directe avec le coach',
    ],
  },
  {
    id: 'trail',
    emoji: '⛰️',
    name: 'Trail',
    desc: 'Trail 20K · 50K · 100K · 100 Miles',
    price: '30€',
    badge: '⭐ Populaire',
    features: [
      'Plan trail 100% personnalisé avec D+',
      'Adaptation hebdomadaire du programme',
      'Connexion Strava intégrée',
      'Programme de renforcement musculaire',
      'Messagerie directe avec le coach',
    ],
  },
  {
    id: 'triathlon',
    emoji: '🏊',
    name: 'Triathlon',
    desc: 'Sprint · Olympique · Half Ironman · Ironman',
    price: '50€',
    features: [
      'Plan triathlon 100% personnalisé',
      'Périodisation natation · vélo · course',
      'Connexion Strava intégrée',
      'Programme de renforcement musculaire',
      'Messagerie directe avec le coach',
    ],
  },
]

export default function SportSelect() {
  const navigate = useNavigate()

  const handleSport = (sport) => {
    localStorage.setItem('sport_type', sport)
    navigate(`/register?sport=${sport}`)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '1.25rem', display: 'flex', justifyContent: 'center' }}>
        <Link to="/">
          <img src="/Logo.png" alt="The Ultimate Academy" style={{ height: 160, width: 'auto', objectFit: 'contain' }} />
        </Link>
      </header>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem' }}>
        <p style={{ fontSize: '.78rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)', marginBottom: '.75rem' }}>
          Étape 1 sur 2
        </p>
        <h1 style={{ fontSize: 'clamp(1.8rem,5vw,2.6rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '.6rem', textAlign: 'center' }}>
          Choisis ta discipline
        </h1>
        <p style={{ color: 'rgba(255,255,255,.5)', fontSize: '.95rem', marginBottom: '3rem', textAlign: 'center' }}>
          14 jours gratuits · sans engagement · annulable à tout moment
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
          gap: '1.25rem',
          width: '100%',
          maxWidth: 920,
        }}>
          {SPORTS.map(s => (
            <div key={s.id} style={{ position: 'relative' }}>
              {s.badge && (
                <div style={{
                  position: 'absolute', top: '-1px', left: '50%', transform: 'translateX(-50%)',
                  background: grad, color: '#fff',
                  fontSize: '.7rem', fontWeight: 700, padding: '.3rem 1.4rem',
                  borderRadius: '0 0 12px 12px', letterSpacing: '.07em',
                  textTransform: 'uppercase', whiteSpace: 'nowrap', zIndex: 1,
                }}>
                  {s.badge}
                </div>
              )}
              <button
                onClick={() => handleSport(s.id)}
                style={{
                  width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                  background: s.badge
                    ? 'linear-gradient(145deg, rgba(139,47,201,.18), rgba(232,35,122,.10))'
                    : 'rgba(255,255,255,.04)',
                  border: s.badge ? '1.5px solid rgba(139,47,201,.5)' : '1px solid rgba(255,255,255,.1)',
                  borderRadius: 20,
                  padding: '2rem 1.75rem 1.75rem',
                  color: '#fff',
                  transition: 'transform .15s, box-shadow .15s',
                  boxShadow: s.badge ? '0 0 28px rgba(139,47,201,.2)' : 'none',
                  display: 'flex', flexDirection: 'column', gap: 0,
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(139,47,201,.3)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = s.badge ? '0 0 28px rgba(139,47,201,.2)' : 'none' }}
              >
                <div style={{ fontSize: '2.2rem', marginBottom: '.75rem' }}>{s.emoji}</div>
                <div style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', marginBottom: '.3rem' }}>
                  {s.name}
                </div>
                <div style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.4)', marginBottom: '1.25rem' }}>{s.desc}</div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '.35rem', marginBottom: '1.5rem' }}>
                  <span style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.04em' }}>{s.price}</span>
                  <span style={{ fontSize: '.85rem', color: 'rgba(255,255,255,.45)' }}>/mois</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '.7rem', marginBottom: '1.75rem' }}>
                  {s.features.map(f => (
                    <div key={f} style={{ display: 'flex', gap: '.65rem', alignItems: 'flex-start', fontSize: '.85rem', color: 'rgba(255,255,255,.72)' }}>
                      <span style={{ background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontWeight: 700, fontSize: '1rem', flexShrink: 0, lineHeight: 1.3 }}>✓</span>
                      {f}
                    </div>
                  ))}
                </div>

                <div style={{
                  width: '100%', padding: '.85rem', borderRadius: 12, textAlign: 'center',
                  background: grad, color: '#fff', fontWeight: 700, fontSize: '.95rem',
                  boxShadow: '0 6px 20px rgba(232,35,122,.3)',
                }}>
                  Commencer gratuitement →
                </div>
              </button>
            </div>
          ))}
        </div>

        <p style={{ marginTop: '2.5rem', fontSize: '.78rem', color: 'rgba(255,255,255,.3)', textAlign: 'center' }}>
          Carte requise · aucun débit pendant 14 jours · annulable avant la fin de l'essai
        </p>
      </main>

      <footer style={{ padding: '1.5rem', textAlign: 'center' }}>
        <p style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.3)' }}>
          Déjà membre ?{' '}
          <Link to="/login" style={{ color: 'rgba(139,47,201,.8)', fontWeight: 600 }}>Se connecter</Link>
        </p>
      </footer>
    </div>
  )
}
