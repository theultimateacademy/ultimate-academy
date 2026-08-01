import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

const grad = 'linear-gradient(135deg,#8B2FC9,#E8237A)'
const gText = { background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }
const API   = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const FEATURES_RUNNING_TRAIL = [
  "Plan d'entraînement 100% personnalisé",
  'Adaptation hebdomadaire du programme',
  'Suivi de tes séances et de ta progression',
  'Programme de renforcement musculaire',
  'Messagerie directe avec le coach',
]

const FEATURES_TRIATHLON = [
  'Plan triathlon 100% personnalisé',
  'Adaptation hebdomadaire du programme',
  'Périodisation natation · vélo · course',
  'Suivi de tes séances et de ta progression',
  'Programme de renforcement musculaire',
  'Messagerie directe avec le coach',
]

function Check() {
  return <span style={{ ...gText, fontWeight: 700, fontSize: '1rem', flexShrink: 0, lineHeight: 1.3 }}>✓</span>
}

export default function SportSelect() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  // Depuis la carte "Course à pied · Trail" de la landing page : on saute directement
  // au choix Course à pied / Trail, sans repasser par le choix Triathlon vs Course-à-pied.
  const [showSubChoice, setShowSubChoice] = useState(searchParams.get('type') === 'running-trail')
  const [quotaFull,     setQuotaFull]     = useState(false)
  const [quotaLoading,  setQuotaLoading]  = useState(true)

  useEffect(() => {
    fetch(`${API}/api/admin/quota`)
      .then(r => r.json())
      .then(d => setQuotaFull(d.full === true))
      .catch(() => {})
      .finally(() => setQuotaLoading(false))
  }, [])

  const handleSport = (sport) => {
    if (quotaFull) return
    localStorage.setItem('sport_type', sport)
    navigate(`/register?sport=${sport}`)
  }

  const baseCard = {
    width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
    borderRadius: 20, padding: '2rem 1.75rem 1.75rem', color: '#fff',
    transition: 'transform .15s, box-shadow .15s',
    display: 'flex', flexDirection: 'column',
  }

  const hover = (e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 14px 40px rgba(139,47,201,.35)' }
  const unhover = (e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'none' }

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '1.25rem', display: 'flex', justifyContent: 'center' }}>
        <Link to="/">
          <img src="/Logo.png" alt="The Ultimate Academy" style={{ height: 160, width: 'auto', objectFit: 'contain' }} />
        </Link>
      </header>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem' }}>

        {/* ── Quota complet ── */}
        {!quotaLoading && quotaFull && (
          <div style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1.25rem' }}>🙏</div>
            <h1 style={{ fontSize: 'clamp(1.6rem,4vw,2.2rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '1rem', lineHeight: 1.2 }}>
              Je suis désolé, j'ai atteint<br /><span style={gText}>mon quota d'athlètes</span>
            </h1>
            <p style={{ color: 'rgba(255,255,255,.6)', fontSize: '1rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
              Pour garantir un suivi de qualité à chaque athlète, je limite le nombre de personnes que j'accompagne simultanément. Les places se libèrent régulièrement, n'hésite pas à revenir consulter cette page.
            </p>
            <div style={{ background: 'rgba(139,47,201,.12)', border: '1px solid rgba(139,47,201,.35)', borderRadius: 16, padding: '1.25rem 1.5rem', marginBottom: '2rem' }}>
              <p style={{ margin: 0, fontSize: '.95rem', color: 'rgba(255,255,255,.75)', lineHeight: 1.6 }}>
                📸 Suis-moi sur Instagram <strong style={{ color: '#fff' }}>@theultimateacademy</strong> et je publie dès qu'une nouvelle place se libère.
              </p>
            </div>
            <p style={{ color: 'rgba(255,255,255,.5)', fontSize: '.9rem', marginBottom: '1.5rem' }}>
              En attendant, prépare-toi avec un plan optimisé grâce à mes ebooks :
            </p>
            <Link
              to="/ebooks"
              style={{ display: 'inline-block', padding: '.85rem 2rem', borderRadius: 12, background: grad, color: '#fff', fontWeight: 700, fontSize: '1rem', textDecoration: 'none', boxShadow: '0 6px 20px rgba(232,35,122,.3)' }}
            >
              Découvrir les ebooks →
            </Link>
          </div>
        )}

        {/* ── Contenu normal (chargement ou quota non atteint) ── */}
        {!quotaFull && <>
        <p style={{ fontSize: '.78rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)', marginBottom: '.75rem' }}>
          Étape 1 sur 2
        </p>
        <h1 style={{ fontSize: 'clamp(1.8rem,5vw,2.6rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '.6rem', textAlign: 'center' }}>
          Choisis ta <span style={gText}>discipline</span>
        </h1>
        <p style={{ color: 'rgba(255,255,255,.5)', fontSize: '.95rem', marginBottom: '3rem', textAlign: 'center' }}>
          14 jours gratuits · sans engagement · annulable à tout moment
        </p>

        {!showSubChoice ? (
          <div style={{ display: 'flex', gap: '1.25rem', width: '100%', maxWidth: 680, alignItems: 'stretch', flexWrap: 'wrap' }}>

            {/* Course à pied & Trail */}
            <button
              onClick={() => setShowSubChoice(true)}
              style={{ ...baseCard, flex: '1 1 280px', background: 'linear-gradient(145deg, rgba(139,47,201,.15), rgba(232,35,122,.08))', border: '1.5px solid rgba(139,47,201,.45)' }}
              onMouseEnter={hover} onMouseLeave={unhover}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem', marginBottom: '.25rem' }}>
                <span style={{ fontSize: '1.9rem', flexShrink: 0 }}>🏃 ⛰️</span>
                <div style={{ fontSize: 'clamp(1.2rem,2.8vw,1.5rem)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2, color: '#fff' }}>
                  Course à pied &amp; Trail
                </div>
              </div>
              <div style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.4)', lineHeight: 1.4, marginBottom: '.6rem' }}>
                5km · 10km · Semi · Marathon · Trail
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '.35rem', marginBottom: '1.1rem' }}>
                <span style={{ fontSize: '2.4rem', fontWeight: 800, letterSpacing: '-0.04em', background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>30€</span>
                <span style={{ fontSize: '.85rem', color: 'rgba(255,255,255,.45)' }}>/mois</span>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '.55rem', marginBottom: '1.2rem' }}>
                {FEATURES_RUNNING_TRAIL.map(f => (
                  <div key={f} style={{ display: 'flex', gap: '.6rem', alignItems: 'flex-start', fontSize: '.83rem', color: 'rgba(255,255,255,.72)' }}>
                    <Check />{f}
                  </div>
                ))}
              </div>
              <div style={{ width: '100%', padding: '.8rem', borderRadius: 12, textAlign: 'center', background: grad, color: '#fff', fontWeight: 700, fontSize: '.92rem', boxShadow: '0 6px 20px rgba(232,35,122,.3)' }}>
                Commencer gratuitement →
              </div>
            </button>

            {/* Triathlon */}
            <button
              onClick={() => handleSport('triathlon')}
              style={{ ...baseCard, flex: '1 1 280px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)' }}
              onMouseEnter={hover} onMouseLeave={unhover}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.65rem', marginBottom: '.25rem' }}>
                <span style={{ fontSize: '1.9rem', flexShrink: 0 }}>🏊</span>
                <div style={{ fontSize: 'clamp(1.2rem,2.8vw,1.5rem)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2, color: '#fff' }}>
                  Triathlon
                </div>
              </div>
              <div style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.4)', lineHeight: 1.4, marginBottom: '.6rem', textAlign: 'center' }}>
                Sprint · Olympique · Half Ironman · Ironman
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '.35rem', marginBottom: '1.1rem' }}>
                <span style={{ fontSize: '2.4rem', fontWeight: 800, letterSpacing: '-0.04em', background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>50€</span>
                <span style={{ fontSize: '.85rem', color: 'rgba(255,255,255,.45)' }}>/mois</span>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '.55rem', marginBottom: '1.2rem' }}>
                {FEATURES_TRIATHLON.map(f => (
                  <div key={f} style={{ display: 'flex', gap: '.6rem', alignItems: 'flex-start', fontSize: '.83rem', color: 'rgba(255,255,255,.72)' }}>
                    <Check />{f}
                  </div>
                ))}
              </div>
              <div style={{ width: '100%', padding: '.8rem', borderRadius: 12, textAlign: 'center', background: grad, color: '#fff', fontWeight: 700, fontSize: '.92rem', boxShadow: '0 6px 20px rgba(232,35,122,.3)' }}>
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
                style={{ ...baseCard, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', padding: '1.75rem 1.5rem' }}
                onMouseEnter={hover} onMouseLeave={unhover}
              >
                <div style={{ fontSize: '2rem', marginBottom: '.75rem' }}>🏃</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '.4rem' }}>
                  <span style={gText}>Course à pied</span>
                </div>
                <div style={{ fontSize: '.82rem', color: 'rgba(255,255,255,.45)', marginBottom: '1.5rem', lineHeight: 1.5, flex: 1 }}>5km · 10km · Semi-marathon · Marathon</div>
                <div style={{ width: '100%', padding: '.75rem', borderRadius: 10, textAlign: 'center', background: grad, color: '#fff', fontWeight: 700, fontSize: '.9rem' }}>
                  Choisir →
                </div>
              </button>

              <button
                onClick={() => handleSport('trail')}
                style={{ ...baseCard, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', padding: '1.75rem 1.5rem' }}
                onMouseEnter={hover} onMouseLeave={unhover}
              >
                <div style={{ fontSize: '2rem', marginBottom: '.75rem' }}>⛰️</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '.4rem' }}>
                  <span style={gText}>Trail</span>
                </div>
                <div style={{ fontSize: '.82rem', color: 'rgba(255,255,255,.45)', marginBottom: '1.5rem', lineHeight: 1.5, flex: 1 }}>Trail 20K · 50K · 100K · 100 Miles</div>
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
        </>}
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
