import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

const VIOLET = '#8B2FC9'
const ROSE   = '#E8237A'

// ── Curseur stylé ──────────────────────────────────────────────────────────────
function Slider({ value, onChange, min = 1, max = 10, label, leftLabel, rightLabel, getEmoji }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.5rem' }}>
        <label style={{ fontSize: '.82rem', fontWeight: 700, color: 'rgba(255,255,255,.85)' }}>{label}</label>
        <span style={{ fontSize: '1.1rem', fontWeight: 900, color: VIOLET, minWidth: 32, textAlign: 'right' }}>
          {getEmoji ? getEmoji(value) : <span style={{ color: '#fff' }}>{value}/{max}</span>}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: VIOLET, cursor: 'pointer', height: 4 }}
      />
      {(leftLabel || rightLabel) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.25rem' }}>
          <span style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.3)' }}>{leftLabel}</span>
          <span style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.3)' }}>{rightLabel}</span>
        </div>
      )}
    </div>
  )
}

// ── Étoiles sommeil ────────────────────────────────────────────────────────────
function StarRating({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '.4rem', marginTop: '.4rem' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          onClick={() => onChange(n)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '.2rem',
            fontSize: '1.6rem', lineHeight: 1, filter: n <= value ? 'none' : 'grayscale(1) opacity(0.25)',
            transition: 'filter .2s, transform .15s',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
          onMouseLeave={e => e.currentTarget.style.transform = ''}
        >
          ⭐
        </button>
      ))}
    </div>
  )
}

// ── Emoji note globale ─────────────────────────────────────────────────────────
function overallEmoji(v) {
  if (v <= 3) return '😔'
  if (v <= 6) return '😐'
  return '😄'
}

// ── Composant principal ────────────────────────────────────────────────────────
export default function BilanHebdo({ planId, weekNumber, onSubmitted }) {
  const { profile } = useAuth()

  const [overall,      setOverall]      = useState(7)
  const [fatigue,      setFatigue]      = useState(5)
  const [motivation,   setMotivation]   = useState(7)
  const [sleep,        setSleep]        = useState(3)
  const [pain,         setPain]         = useState('')
  const [wentWell,     setWentWell]     = useState('')
  const [wasHard,      setWasHard]      = useState('')
  const [wishes,       setWishes]       = useState('')
  const [coachMsg,     setCoachMsg]     = useState('')
  const [submitting,   setSubmitting]   = useState(false)
  const [error,        setError]        = useState(null)

  const textareaStyle = {
    width: '100%', background: 'rgba(255,255,255,.04)',
    border: '1px solid rgba(139,47,201,.3)', borderRadius: 10,
    padding: '.6rem .75rem', color: '#fff', fontSize: '.85rem',
    fontFamily: 'inherit', lineHeight: 1.6, resize: 'vertical',
    outline: 'none', boxSizing: 'border-box',
  }

  const labelStyle = {
    display: 'block', fontSize: '.82rem', fontWeight: 700,
    color: 'rgba(255,255,255,.85)', marginBottom: '.4rem',
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!wentWell.trim()) { setError('Dis-nous ce qui s\'est bien passé cette semaine !'); return }
    setError(null)
    setSubmitting(true)
    try {
      const resp = await fetch('/api/athlete/weekly-bilan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id:          profile.id,
          plan_id:          planId,
          week_number:      weekNumber,
          overall_rating:   overall,
          fatigue_level:    fatigue,
          motivation_level: motivation,
          sleep_quality:    sleep,
          pain_areas:       pain.trim() || null,
          what_went_well:   wentWell.trim(),
          what_was_hard:    wasHard.trim() || null,
          wishes_next_week: wishes.trim() || null,
          coach_message:    coachMsg.trim() || null,
        }),
      })
      if (!resp.ok) {
        const body = await resp.json()
        throw new Error(body.error || 'Erreur lors de la soumission')
      }
      onSubmitted?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0F0B1F, #150A25)',
      border: `1px solid ${VIOLET}40`,
      borderRadius: 18,
      padding: '1.5rem',
      marginBottom: '1.5rem',
      boxShadow: `0 4px 32px rgba(139,47,201,.12)`,
    }}>
      {/* En-tête */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.35rem' }}>
          <span style={{ fontSize: '1.3rem' }}>📋</span>
          <span style={{ fontWeight: 900, fontSize: '1.05rem', color: '#fff' }}>
            Bilan de la semaine {weekNumber}
          </span>
        </div>
        <p style={{ fontSize: '.82rem', color: 'rgba(255,255,255,.45)', margin: 0, lineHeight: 1.5 }}>
          Prends 2 minutes pour faire le point sur ta semaine passée — ton coach y a accès directement.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* 1. Note globale */}
        <div style={{ background: 'rgba(255,255,255,.03)', borderRadius: 12, padding: '1rem' }}>
          <Slider
            value={overall}
            onChange={setOverall}
            min={1} max={10}
            label="Note globale de la semaine"
            leftLabel="Nulle"
            rightLabel="Parfaite"
            getEmoji={v => (
              <span style={{ fontSize: '1.4rem' }}>{overallEmoji(v)}</span>
            )}
          />
        </div>

        {/* 2. Fatigue */}
        <div style={{ background: 'rgba(255,255,255,.03)', borderRadius: 12, padding: '1rem' }}>
          <Slider
            value={fatigue}
            onChange={setFatigue}
            min={1} max={10}
            label="Niveau de fatigue ressenti"
            leftLabel="Très frais"
            rightLabel="Épuisé"
            getEmoji={v => (
              <span style={{ fontWeight: 900, color: v <= 4 ? '#10B981' : v <= 7 ? '#F59E0B' : '#EF4444' }}>
                {v}/10
              </span>
            )}
          />
        </div>

        {/* 3. Motivation */}
        <div style={{ background: 'rgba(255,255,255,.03)', borderRadius: 12, padding: '1rem' }}>
          <Slider
            value={motivation}
            onChange={setMotivation}
            min={1} max={10}
            label="Niveau de motivation"
            leftLabel="Zéro motiv'"
            rightLabel="Ultra motivé"
            getEmoji={v => (
              <span style={{ fontWeight: 900, color: v <= 4 ? '#EF4444' : v <= 6 ? '#F59E0B' : '#10B981' }}>
                {v}/10
              </span>
            )}
          />
        </div>

        {/* 4. Sommeil */}
        <div style={{ background: 'rgba(255,255,255,.03)', borderRadius: 12, padding: '1rem' }}>
          <label style={labelStyle}>Qualité du sommeil</label>
          <StarRating value={sleep} onChange={setSleep} />
        </div>

        {/* 5. Douleurs */}
        <div>
          <label style={labelStyle}>As-tu ressenti des douleurs ou gênes ? <span style={{ color: 'rgba(255,255,255,.3)', fontWeight: 400 }}>(optionnel)</span></label>
          <textarea
            value={pain}
            onChange={e => setPain(e.target.value)}
            placeholder="Ex. : légère douleur au genou droit en fin de sortie longue... (laisse vide si non)"
            rows={2}
            style={textareaStyle}
          />
        </div>

        {/* 6. Ce qui s'est bien passé */}
        <div>
          <label style={labelStyle}>Ce qui s'est bien passé cette semaine <span style={{ color: ROSE, fontSize: '.75rem' }}>*</span></label>
          <textarea
            value={wentWell}
            onChange={e => setWentWell(e.target.value)}
            placeholder="Ex. : J'ai tenu l'allure sur les fractionnés, le footing du mercredi s'est super bien passé..."
            rows={3}
            style={{ ...textareaStyle, border: `1px solid ${wentWell ? VIOLET + '60' : 'rgba(139,47,201,.3)'}` }}
            required
          />
        </div>

        {/* 7. Ce qui a été difficile */}
        <div>
          <label style={labelStyle}>Ce qui a été difficile <span style={{ color: 'rgba(255,255,255,.3)', fontWeight: 400 }}>(optionnel)</span></label>
          <textarea
            value={wasHard}
            onChange={e => setWasHard(e.target.value)}
            placeholder="Ex. : La sortie longue de samedi, j'ai eu du mal à maintenir l'allure sur les derniers km..."
            rows={2}
            style={textareaStyle}
          />
        </div>

        {/* 8. Souhaits semaine prochaine */}
        <div>
          <label style={labelStyle}>Pour la semaine prochaine, j'aimerais... <span style={{ color: 'rgba(255,255,255,.3)', fontWeight: 400 }}>(optionnel)</span></label>
          <textarea
            value={wishes}
            onChange={e => setWishes(e.target.value)}
            placeholder="Ex. : travailler davantage la cadence, avoir une séance de trail..."
            rows={2}
            style={textareaStyle}
          />
        </div>

        {/* 9. Message coach */}
        <div>
          <label style={labelStyle}>Un message pour ton coach ? <span style={{ color: 'rgba(255,255,255,.3)', fontWeight: 400 }}>(optionnel)</span></label>
          <textarea
            value={coachMsg}
            onChange={e => setCoachMsg(e.target.value)}
            placeholder="Questions, remarques, demandes spécifiques..."
            rows={2}
            style={textareaStyle}
          />
        </div>

        {/* Erreur */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)',
            borderRadius: 10, padding: '.6rem .875rem',
            fontSize: '.82rem', color: '#FCA5A5',
          }}>
            {error}
          </div>
        )}

        {/* Bouton submit */}
        <button
          type="submit"
          disabled={submitting}
          style={{
            width: '100%',
            background: submitting ? 'rgba(139,47,201,.3)' : `linear-gradient(135deg, ${VIOLET}, ${ROSE})`,
            border: 'none', borderRadius: 12,
            padding: '.875rem',
            color: '#fff', fontWeight: 800, fontSize: '.95rem', fontFamily: 'inherit',
            cursor: submitting ? 'not-allowed' : 'pointer',
            transition: 'opacity .2s, transform .15s',
            opacity: submitting ? 0.7 : 1,
          }}
          onMouseEnter={e => { if (!submitting) e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = '' }}
        >
          {submitting ? 'Envoi en cours...' : 'Envoyer mon bilan'}
        </button>
      </form>
    </div>
  )
}
