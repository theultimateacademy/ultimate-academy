import { useNavigate } from 'react-router-dom'

const FEATURES = [
  "Plan d'entraînement 100% personnalisé",
  'Adaptation hebdomadaire du programme',
  'Connexion Strava intégrée',
  'Programme de renforcement musculaire',
  'Messagerie directe avec moi',
  'Analyse continue de ta progression',
]

const grad = 'linear-gradient(135deg, #8B2FC9 0%, #E8237A 100%)'
const gd = {
  background: grad,
  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  display: 'inline',
}

export default function PricingCTA({
  title = <>Une seule offre, <span style={gd}>sans compromis</span></>,
  subtitle = 'Tout ce qu\'il faut pour progresser. Rien de superflu.',
}) {
  const navigate = useNavigate()
  const handleCTA = () => navigate('/register')

  return (
    <section style={{ padding: '6rem 1.5rem', background: '#000', borderTop: '1px solid rgba(255,255,255,.06)' }}>
      <style>{`
        @keyframes pricePulse {
          0%, 100% { box-shadow: 0 0 30px rgba(139,47,201,.35), 0 0 60px rgba(232,35,122,.15), 0 24px 48px rgba(0,0,0,.5) }
          50%       { box-shadow: 0 0 55px rgba(139,47,201,.6),  0 0 100px rgba(232,35,122,.3), 0 24px 48px rgba(0,0,0,.5) }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center }
          100% { background-position:  200% center }
        }
        @keyframes trialBlink {
          0%, 100% { opacity: 1 }
          50%       { opacity: 0.65 }
        }
      `}</style>

      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '.6rem', color: '#fff' }}>
            {title}
          </h2>
          <p style={{ color: 'rgba(255,255,255,.4)', fontSize: '1rem' }}>{subtitle}</p>
        </div>

        <div className="pricing-card pricing-card--featured" style={{ padding: '3rem 2.5rem', animation: 'pricePulse 3s ease-in-out infinite' }}>
          {/* Badge essai gratuit */}
          <div style={{
            position: 'absolute', top: '-1px', left: '50%', transform: 'translateX(-50%)',
            background: grad, color: '#fff',
            fontSize: '.72rem', fontWeight: 700, padding: '.35rem 1.6rem', borderRadius: '0 0 14px 14px',
            letterSpacing: '.07em', textTransform: 'uppercase', whiteSpace: 'nowrap',
            animation: 'trialBlink 2.5s ease-in-out infinite',
          }}>
            14 jours d'essai gratuit
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px,100%),1fr))', gap: '3rem', alignItems: 'center', marginTop: '.5rem' }}>
            {/* Prix + bouton */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '.78rem', fontWeight: 700, color: 'rgba(255,255,255,.55)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '1rem' }}>
                Coaching Personnalisé
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '.4rem', marginBottom: '.3rem' }}>
                <span className="price-amount">30€</span>
                <span className="price-period">/mois</span>
              </div>
              <p style={{ color: 'rgba(255,255,255,.65)', fontSize: '.85rem', marginBottom: '.4rem', lineHeight: 1.6 }}>après 14 jours offerts</p>
              <p style={{ color: 'rgba(255,255,255,.5)', fontSize: '.78rem', marginBottom: '2rem', lineHeight: 1.5 }}>Sans engagement. Annule à tout moment.</p>
              <button onClick={handleCTA} style={{
                width: '100%', padding: '1rem 1.5rem', borderRadius: 99, border: 'none', cursor: 'pointer',
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
              <p style={{ color: 'rgba(255,255,255,.45)', fontSize: '.72rem', marginTop: '.75rem' }}>
                Carte requise · aucun débit pendant 14 jours
              </p>
            </div>

            {/* Features */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem', textAlign: 'left' }}>
              {FEATURES.map(f => (
                <div key={f} style={{ display: 'flex', gap: '.75rem', alignItems: 'center', fontSize: '.9rem', color: 'rgba(255,255,255,.78)' }}>
                  <span style={{ ...gd, fontWeight: 700, fontSize: '1rem', flexShrink: 0 }}>✓</span> {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
