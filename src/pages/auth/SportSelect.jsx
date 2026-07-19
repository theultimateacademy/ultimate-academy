import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const grad = 'linear-gradient(135deg,#8B2FC9,#E8237A)'

const FEATURES_RUNNING_TRAIL = [
  "Plan d'entraînement 100% personnalisé",
  'Adaptation hebdomadaire du programme',
  'Connexion Strava intégrée',
  'Programme de renforcement musculaire',
  'Messagerie directe avec le coach',
]

const FEATURES_TRIATHLON = [
  'Plan triathlon 100% personnalisé',
  'Périodisation natation · vélo · course',
  'Connexion Strava intégrée',
  'Programme de renforcement musculaire',
  'Messagerie directe avec le coach',
]

export default function SportSelect() {
  const navigate = useNavigate()
  const [showSubChoice, setShowSubChoice] = useState(false)

  const handleSport = (sport) => {
    localStorage.setItem('sport_type', sport)
    navigate(`/register?sport=${sport}`)
  }

  const cardStyle = (featured) => ({
    width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
    background: featured
      ? 'linear-gradient(145deg, rgba(139,47,201,.15), rgba(232,35,122,.08))'
      : 'rgba(255,255,255,.04)',
    border: featured ? '1.5px solid rgba(139,47,201,.45)' : '1px solid rgba(255,255,255,.1)',
    borderRadius: 20,
    padding: '2rem 1.75rem 1.75rem',
    color: '#fff',
    transition: 'transform .15s, box-shadow .15s',
    display: 'flex', flexDirection: 'column',
  })

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

        {!showSubChoice ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', width: '100%', maxWidth: 680 }}>

            {/* Course à pied & Trail */}
            <button
              onClick={() => setShowSubChoice(true)}
              style={cardStyle(true)}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(139,47,201,.3)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'none' }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '.75rem' }}>🏃 ⛰️</div>
              <div style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', marginBottom: '.3rem' }}>
                Course à pied & Trail
              </div>
              <div style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.4)', marginBottom: '1.25rem' }}>
                5km · 10km · Semi · Marathon · Trail
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '.35rem', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.04em' }}>30€</span>
                <span style={{ fontSize: '.85rem', color: 'rgba(255,255,255,.45)' }}>/mois</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.7rem', marginBottom: '1.75rem' }}>
                {FEATURES_RUNNING_TRAIL.map(f => (
                  <div key={f} style={{ display: 'flex', gap: '.65rem', alignItems: 'flex-start', fontSize: '.85rem', color: 'rgba(255,255,255,.72)' }}>
                    <span style={{ background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontWeight: 700, fontSize: '1rem', flexShrink: 0, lineHeight: 1.3 }}>✓</span>
                    {f}
                  </div>
                ))}
              </div>
              <div style={{ width: '100%', padding: '.85rem', borderRadius: 12, textAlign: 'center', background: grad, color: '#fff', fontWeight: 700, fontSize: '.95rem', boxShadow: '0 6px 20px rgba(232,35,122,.3)' }}>
                Commencer gratuitement →
              </div>
            </button>

            {/* Triathlon */}
            <button
              onClick={() => handleSport('triathlon')}
              style={cardStyle(false)}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(139,47,201,.3)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'none' }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '.75rem' }}>🏊</div>
              <div style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', marginBottom: '.3rem' }}>
                Triathlon
              </div>
              <div style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.4)', marginBottom: '1.25rem' }}>
                Sprint · Olympique · Half Ironman · Ironman
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '.35rem', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.04em' }}>50€</span>
                <span style={{ fontSize: '.85rem', color: 'rgba(255,255,255,.45)' }}>/mois</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.7rem', marginBottom: '1.75rem' }}>
                {FEATURES_TRIATHLON.map(f => (
                  <div key={f} style={{ display: 'flex', gap: '.65rem', alignItems: 'flex-start', fontSize: '.85rem', color: 'rgba(255,255,255,.72)' }}>
                    <span style={{ background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontWeight: 700, fontSize: '1rem', flexShrink: 0, lineHeight: 1.3 }}>✓</span>
                    {f}
                  </div>
                ))}
              </div>
              <div style={{ width: '100%', padding: '.85rem', borderRadius: 12, textAlign: 'center', background: grad, color: '#fff', fontWeight: 700, fontSize: '.95rem', boxShadow: '0 6px 20px rgba(232,35,122,.3)' }}>
                Commencer gratuitement →
              </div>
            </button>
          </div>
        ) : (
          /* Sub-choice: Course à pied ou Trail */
          <div style={{ width: '100%', maxWidth: 680 }}>
            <button
              onClick={() => setShowSubChoice(false)}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.45)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '.875rem', marginBottom: '1.75rem', display: 'flex', alignItems: 'center', gap: '.4rem' }}
            >
              ← Retour
            </button>
            <p style={{ fontSize: '.78rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', marginBottom: '1.25rem', textAlign: 'center' }}>
              Course à pied & Trail · 30€/mois
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <button
                onClick={() => handleSport('running')}
                style={{ ...cardStyle(false), padding: '1.75rem 1.5rem' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(139,47,201,.3)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'none' }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '.6rem' }}>🏃</div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '.35rem' }}>Course à pied</div>
                <div style={{ fontSize: '.82rem', color: 'rgba(255,255,255,.45)', marginBottom: '1.25rem', lineHeight: 1.5 }}>5km · 10km · Semi-marathon · Marathon</div>
                <div style={{ width: '100%', padding: '.75rem', borderRadius: 10, textAlign: 'center', background: grad, color: '#fff', fontWeight: 700, fontSize: '.9rem' }}>
                  Choisir →
                </div>
              </button>

              <button
                onClick={() => handleSport('trail')}
                style={{ ...cardStyle(false), padding: '1.75rem 1.5rem' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(139,47,201,.3)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'none' }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '.6rem' }}>⛰️</div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '.35rem' }}>Trail</div>
                <div style={{ fontSize: '.82rem', color: 'rgba(255,255,255,.45)', marginBottom: '1.25rem', lineHeight: 1.5 }}>Trail 20K · 50K · 100K · 100 Miles</div>
                <div style={{ width: '100%', padding: '.75rem', borderRadius: 10, textAlign: 'center', background: grad, color: '#fff', fontWeight: 700, fontSize: '.9rem' }}>
                  Choisir →
                </div>
              </button>
            </div>
          </div>
        )}

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
