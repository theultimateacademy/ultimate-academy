import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'

const C = { purple: '#8B2FC9', pink: '#E8237A' }

const RESSENTIS = [
  { v: 'facile',         emoji: '😄', label: 'Plutôt facile à tenir' },
  { v: 'difficile',      emoji: '💪', label: 'Difficile mais faisable' },
  { v: 'trop_difficile', emoji: '😓', label: 'Trop difficile à tenir' },
  { v: 'pas_termine',    emoji: '🤒', label: "Je n'ai pas pu terminer" },
]

const RESSENTI_LABELS = {
  facile: 'Plutôt facile', difficile: 'Difficile mais faisable',
  trop_difficile: 'Trop difficile', pas_termine: 'Non terminée',
}

const DAYS_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const DAYS_FR    = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

function rpeColor(v) {
  if (v <= 3) return '#22c55e'
  if (v <= 5) return '#84cc16'
  if (v <= 7) return '#f59e0b'
  if (v <= 9) return '#ef4444'
  return '#dc2626'
}
function rpeLabel(v) {
  if (v <= 3) return 'Très facile'
  if (v <= 5) return 'Modéré'
  if (v <= 7) return 'Difficile'
  if (v <= 9) return 'Très difficile'
  return 'Effort maximal'
}

export default function PostSessionFlow({
  session, weekNum, sessionIdx, planId,
  weekSessions = [], weekCompletions = [],
  onClose, onDone,
}) {
  const { profile } = useAuth()

  const [step,    setStep]    = useState(1)
  const [saved,   setSaved]   = useState(false)
  const [saving,  setSaving]  = useState(false)

  // Form data
  const [ressenti, setRessenti] = useState(null)
  const [rpe,      setRpe]      = useState(6)
  const [paceMin,  setPaceMin]  = useState('')
  const [paceSec,  setPaceSec]  = useState('')
  const [avgHr,    setAvgHr]    = useState('')
  const [maxHr,    setMaxHr]    = useState('')
  const [comment,  setComment]  = useState('')

  const hasAllures  = Array.isArray(session.allures) ? session.allures.length > 0 : !!(session.allures?.trim?.())
  const pasTermine  = ressenti === 'pas_termine'

  // Which steps are active?
  function activeSteps() {
    const s = [1]
    if (!pasTermine) { s.push(2); if (hasAllures) s.push(3) }
    s.push(4, 5, 6)
    return s
  }
  const steps    = activeSteps()
  const stepIdx  = steps.indexOf(step)
  const progress = (stepIdx + 1) / steps.length

  function nextStep() {
    const idx  = steps.indexOf(step)
    return idx < steps.length - 1 ? steps[idx + 1] : 6
  }
  function prevStep() {
    const idx = steps.indexOf(step)
    return idx > 0 ? steps[idx - 1] : 1
  }

  async function saveAndProceed() {
    if (saved) { setStep(6); return }
    setSaving(true)
    try {
      const parts = []
      if (ressenti) parts.push(`[Ressenti: ${RESSENTI_LABELS[ressenti]}]`)
      if (paceMin || paceSec) parts.push(`[Allure: ${paceMin || '0'}'${String(paceSec || '0').padStart(2, '0')}"/km]`)
      if (avgHr)  parts.push(`[FC moy: ${avgHr} bpm]`)
      if (maxHr)  parts.push(`[FC max: ${maxHr} bpm]`)
      const fullComment = [...parts, comment].filter(Boolean).join(' ')

      await supabase.from('session_completions').upsert({
        user_id:          profile.id,
        plan_id:          planId,
        week_number:      weekNum,
        session_index:    sessionIdx,
        rpe:              parseInt(rpe),
        comment:          fullComment || null,
        avg_hr:           avgHr ? parseInt(avgHr) : null,
        completed_at:     new Date().toISOString(),
      }, { onConflict: 'plan_id,week_number,session_index' })

      setSaved(true)
      onDone?.()

      if (parseInt(rpe) > 8) {
        api.fatigueAdapt({ userId: profile.id, planId, weekNumber: weekNum, rpe: parseInt(rpe), comment })
          .catch(() => {})
      }
    } finally {
      setSaving(false)
    }
    setStep(6)
  }

  async function goNext() {
    const next = nextStep()
    if (next === 6) { await saveAndProceed(); return }
    setStep(next)
  }

  // Week summary data (includes this session)
  const prevDone    = weekCompletions.length
  const totalSess   = weekSessions.length
  const doneCount   = prevDone + 1
  const prevRpeSum  = weekCompletions.reduce((s, c) => s + (c.rpe || 0), 0)
  const avgRpeVal   = doneCount > 0 ? ((prevRpeSum + parseInt(rpe)) / doneCount).toFixed(1) : rpe
  const weekMinutes = weekSessions.reduce((sum, s, i) => {
    const done = weekCompletions.some(c => c.session_index === i) || i === sessionIdx
    return done ? sum + (s.duree_min || 0) : sum
  }, 0)

  function fmtDur(min) {
    if (min < 60) return `${min} min`
    const h = Math.floor(min / 60), m = min % 60
    return m > 0 ? `${h}h${String(m).padStart(2,'0')}` : `${h}h`
  }

  const inputSt = {
    width: '100%', padding: '.65rem .85rem', borderRadius: 12, fontSize: '.95rem',
    border: '2px solid rgba(139,47,201,.15)', background: '#fff', outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box', color: '#1a1a2e',
    transition: 'border-color .15s',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
    }}>
      <div style={{
        background: '#fff', color: '#1a1a2e', borderRadius: 24,
        width: '100%', maxWidth: 500,
        maxHeight: '92dvh', overflowY: 'auto',
        boxShadow: '0 32px 80px rgba(0,0,0,.4)',
        display: 'flex', flexDirection: 'column',
      }}>

        {/* ── Header ── */}
        <div style={{ padding: '1.25rem 1.25rem 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.75rem' }}>
            {stepIdx > 0 ? (
              <button onClick={() => setStep(prevStep())}
                style={{ background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(26,26,46,.4)', fontSize: '.88rem', padding: '0', fontFamily: 'inherit' }}>
                ← Retour
              </button>
            ) : <div />}
            <span style={{ fontSize: '.72rem', fontWeight: 700, color: 'rgba(26,26,46,.3)', letterSpacing: '.06em' }}>
              {stepIdx + 1} / {steps.length}
            </span>
            <button onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(26,26,46,.3)', fontSize: '1.1rem', lineHeight: 1, padding: '0' }}>✕</button>
          </div>
          <div style={{ height: 3, background: 'rgba(139,47,201,.1)', borderRadius: 99 }}>
            <div style={{ height: '100%', borderRadius: 99, width: `${progress * 100}%`,
              background: `linear-gradient(90deg,${C.purple},${C.pink})`, transition: 'width .35s ease' }} />
          </div>
        </div>

        {/* ── Content ── */}
        <div style={{ padding: '1.5rem 1.25rem', flex: 1 }}>

          {/* PAGE 1 — Ressenti */}
          {step === 1 && (
            <>
              <p style={{ fontSize: '.72rem', textTransform: 'uppercase', letterSpacing: '.12em',
                color: C.purple, fontWeight: 700, marginBottom: '.4rem' }}>{session.titre}</p>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, lineHeight: 1.2, marginBottom: '.4rem' }}>
                Comment as-tu vécu cette séance ?
              </h3>
              <p style={{ fontSize: '.85rem', color: 'rgba(26,26,46,.5)', marginBottom: '1.25rem', lineHeight: 1.65 }}>
                Ton ressenti nous aide à ajuster tes prochaines séances.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem', marginBottom: '1.5rem' }}>
                {RESSENTIS.map(opt => (
                  <button key={opt.v} onClick={() => setRessenti(opt.v)} style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    padding: '.9rem 1.1rem', borderRadius: 16, cursor: 'pointer',
                    fontFamily: 'inherit', textAlign: 'left', fontSize: '.93rem', fontWeight: 600,
                    border: `2px solid ${ressenti === opt.v ? C.purple : 'rgba(26,26,46,.1)'}`,
                    background: ressenti === opt.v ? 'rgba(139,47,201,.07)' : '#fff',
                    color: ressenti === opt.v ? C.purple : '#1a1a2e',
                    transition: 'all .15s',
                  }}>
                    <span style={{ fontSize: '1.5rem' }}>{opt.emoji}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* PAGE 2 — RPE */}
          {step === 2 && (
            <>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, lineHeight: 1.2, marginBottom: '.4rem' }}>
                Donne une note à ton effort
              </h3>
              <p style={{ fontSize: '.85rem', color: 'rgba(26,26,46,.5)', marginBottom: '1.75rem', lineHeight: 1.65 }}>
                De 1 (très facile) à 10 (effort maximal absolu).
              </p>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '4.5rem', fontWeight: 900, lineHeight: 1, color: rpeColor(rpe), transition: 'color .2s' }}>
                  {rpe}
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: rpeColor(rpe), marginTop: '.3rem', transition: 'color .2s' }}>
                  {rpeLabel(rpe)}
                </div>
              </div>
              <input type="range" min={1} max={10} value={rpe}
                onChange={e => setRpe(parseInt(e.target.value))}
                style={{ width: '100%', cursor: 'pointer', accentColor: rpeColor(rpe), marginBottom: '.5rem' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between',
                fontSize: '.68rem', color: 'rgba(26,26,46,.3)', marginBottom: '1.5rem' }}>
                {['1','2','3','4','5','6','7','8','9','10'].map(n => <span key={n}>{n}</span>)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.4rem' }}>
                {[
                  { r: '1–3', l: 'Très facile',    c: '#22c55e' },
                  { r: '4–5', l: 'Modéré',         c: '#84cc16' },
                  { r: '6–7', l: 'Difficile',      c: '#f59e0b' },
                  { r: '8–9', l: 'Très difficile', c: '#ef4444' },
                  { r: '10',  l: 'Effort maximal', c: '#dc2626' },
                ].map(({ r, l, c }) => (
                  <div key={r} style={{ display: 'flex', alignItems: 'center', gap: '.4rem',
                    fontSize: '.76rem', color: 'rgba(26,26,46,.5)' }}>
                    <div style={{ width: 8, height: 8, borderRadius: 99, background: c, flexShrink: 0 }} />
                    <span style={{ fontWeight: 600 }}>{r}</span> : {l}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* PAGE 3 — Allures */}
          {step === 3 && hasAllures && (
            <>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, lineHeight: 1.2, marginBottom: '.4rem' }}>
                Tes allures sur cette séance
              </h3>
              <p style={{ fontSize: '.85rem', color: 'rgba(26,26,46,.5)', marginBottom: '1.25rem', lineHeight: 1.65 }}>
                Compare ce que tu as réellement couru à ce qui était prévu.
              </p>
              <div style={{ background: 'rgba(139,47,201,.06)', borderRadius: 14, padding: '1rem',
                border: '1px solid rgba(139,47,201,.14)', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '.1em',
                  color: C.purple, fontWeight: 700, marginBottom: '.35rem' }}>Prévu</div>
                <div style={{ fontSize: '.9rem', lineHeight: 1.65 }}>{session.allures}</div>
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '.78rem', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '.08em', color: 'rgba(26,26,46,.5)', marginBottom: '.75rem' }}>
                  Allure moy. réalisée
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                  <div>
                    <div style={{ fontSize: '.68rem', textTransform: 'uppercase', letterSpacing: '.08em',
                      color: 'rgba(26,26,46,.35)', marginBottom: '.3rem' }}>Min</div>
                    <input type="number" min="0" max="30" placeholder="4" value={paceMin}
                      onChange={e => setPaceMin(e.target.value)}
                      style={{ width: 72, padding: '.55rem .5rem', borderRadius: 10, fontSize: '1.1rem',
                        fontWeight: 700, border: '2px solid rgba(139,47,201,.18)', background: '#fff',
                        textAlign: 'center', outline: 'none', color: '#1a1a2e' }} />
                  </div>
                  <span style={{ fontSize: '1.4rem', color: 'rgba(26,26,46,.25)', paddingTop: '1.2rem' }}>:</span>
                  <div>
                    <div style={{ fontSize: '.68rem', textTransform: 'uppercase', letterSpacing: '.08em',
                      color: 'rgba(26,26,46,.35)', marginBottom: '.3rem' }}>Sec</div>
                    <input type="number" min="0" max="59" placeholder="30" value={paceSec}
                      onChange={e => setPaceSec(e.target.value)}
                      style={{ width: 72, padding: '.55rem .5rem', borderRadius: 10, fontSize: '1.1rem',
                        fontWeight: 700, border: '2px solid rgba(139,47,201,.18)', background: '#fff',
                        textAlign: 'center', outline: 'none', color: '#1a1a2e' }} />
                  </div>
                  <span style={{ fontSize: '.9rem', color: 'rgba(26,26,46,.35)', paddingTop: '1.2rem' }}>/km</span>
                </div>
              </div>
              <button onClick={() => setStep(4)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  color: 'rgba(26,26,46,.38)', fontSize: '.85rem', textDecoration: 'underline', padding: 0 }}>
                Je n'ai pas mesuré mes allures →
              </button>
            </>
          )}

          {/* PAGE 4 — FC */}
          {step === 4 && (
            <>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, lineHeight: 1.2, marginBottom: '.4rem' }}>
                Ta fréquence cardiaque
              </h3>
              <p style={{ fontSize: '.85rem', color: 'rgba(26,26,46,.5)', marginBottom: '1.5rem', lineHeight: 1.65 }}>
                Si tu as les données, elles aident à calibrer l'intensité réelle de tes séances.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '.76rem', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '.08em', color: 'rgba(26,26,46,.45)', marginBottom: '.4rem' }}>
                    FC moyenne (bpm)
                  </label>
                  <input type="number" placeholder="Ex : 148" value={avgHr}
                    onChange={e => setAvgHr(e.target.value)} min={40} max={220}
                    onFocus={e => { e.currentTarget.style.borderColor = C.purple }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(139,47,201,.15)' }}
                    style={inputSt} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '.76rem', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '.08em', color: 'rgba(26,26,46,.45)', marginBottom: '.4rem' }}>
                    FC max atteinte (bpm)
                  </label>
                  <input type="number" placeholder="Ex : 172" value={maxHr}
                    onChange={e => setMaxHr(e.target.value)} min={40} max={220}
                    onFocus={e => { e.currentTarget.style.borderColor = C.purple }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(139,47,201,.15)' }}
                    style={inputSt} />
                </div>
              </div>
              <button onClick={() => setStep(5)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  color: 'rgba(26,26,46,.38)', fontSize: '.85rem', textDecoration: 'underline', padding: 0 }}>
                Passer cette étape →
              </button>
            </>
          )}

          {/* PAGE 5 — Commentaire */}
          {step === 5 && (
            <>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, lineHeight: 1.2, marginBottom: '.4rem' }}>
                Un message pour ton coach ?
              </h3>
              <p style={{ fontSize: '.85rem', color: 'rgba(26,26,46,.5)', marginBottom: '1.25rem', lineHeight: 1.65 }}>
                Douleur, météo, fatigue particulière, sensation positive… Tout est utile !
              </p>
              <textarea
                placeholder="Ex : jambes lourdes depuis hier, mais j'ai tenu les allures sur les 3 premiers blocs..."
                value={comment} onChange={e => setComment(e.target.value)}
                style={{ ...inputSt, minHeight: 130, resize: 'vertical', lineHeight: 1.65 }} />
            </>
          )}

          {/* PAGE 6 — Résumé semaine */}
          {step === 6 && (
            <>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, lineHeight: 1.2, marginBottom: '.3rem' }}>
                Ta semaine jusqu'ici 💪
              </h3>
              <p style={{ fontSize: '.85rem', color: 'rgba(26,26,46,.5)', marginBottom: '1.5rem' }}>
                Séance enregistrée. Voici le bilan.
              </p>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.65rem', marginBottom: '1.5rem' }}>
                {[
                  { icon: '🏃', label: 'Séances',     val: `${doneCount} / ${totalSess}` },
                  { icon: '⏱',  label: 'Temps total', val: fmtDur(weekMinutes) },
                  { icon: '📈', label: 'RPE moyen',   val: `${avgRpeVal} / 10` },
                  { icon: '💬', label: 'Ressenti',     val: { facile:'Facile', difficile:'Normal', trop_difficile:'Chargé', pas_termine:'Difficile' }[ressenti] || '—' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'rgba(139,47,201,.05)', borderRadius: 14,
                    padding: '.875rem', border: '1px solid rgba(139,47,201,.09)' }}>
                    <div style={{ fontSize: '1.2rem', marginBottom: '.3rem' }}>{s.icon}</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 900, lineHeight: 1 }}>{s.val}</div>
                    <div style={{ fontSize: '.7rem', color: 'rgba(26,26,46,.4)', marginTop: '.2rem', fontWeight: 600 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Day timeline */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '.1em', color: 'rgba(26,26,46,.38)', marginBottom: '.75rem' }}>
                  Cette semaine
                </div>
                <div style={{ display: 'flex', gap: '.35rem', alignItems: 'flex-end', height: 60 }}>
                  {DAYS_FR.map((day, di) => {
                    const si      = weekSessions.findIndex(s => s.jour === day)
                    const sess    = si >= 0 ? weekSessions[si] : null
                    const isDone  = si >= 0 && (weekCompletions.some(c => c.session_index === si) || si === sessionIdx)
                    const h       = sess ? Math.max(18, Math.min(56, (sess.duree_min || 45) * 0.65)) : 10
                    return (
                      <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.28rem' }}>
                        <div style={{ width: '100%', borderRadius: 5, height: h, transition: 'height .3s',
                          background: !sess ? 'rgba(26,26,46,.07)'
                            : isDone ? `linear-gradient(180deg,${C.purple},${C.pink})`
                            : 'rgba(139,47,201,.18)' }} />
                        <div style={{ fontSize: '.6rem', color: 'rgba(26,26,46,.38)', fontWeight: 600 }}>
                          {DAYS_SHORT[di]}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div style={{ display: 'flex', gap: '.85rem', marginTop: '.6rem', flexWrap: 'wrap' }}>
                  {[
                    { bg: `linear-gradient(135deg,${C.purple},${C.pink})`, l: 'Effectuée' },
                    { bg: 'rgba(139,47,201,.18)', l: 'À venir' },
                    { bg: 'rgba(26,26,46,.07)',   l: 'Repos' },
                  ].map(({ bg, l }) => (
                    <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '.3rem',
                      fontSize: '.7rem', color: 'rgba(26,26,46,.4)' }}>
                      <div style={{ width: 9, height: 9, borderRadius: 3, background: bg, flexShrink: 0 }} />
                      {l}
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ background: 'rgba(139,47,201,.09)', borderRadius: 99, height: 7, marginBottom: '.4rem' }}>
                <div style={{ height: '100%', borderRadius: 99,
                  background: `linear-gradient(90deg,${C.purple},${C.pink})`,
                  width: `${totalSess > 0 ? (doneCount / totalSess) * 100 : 0}%`,
                  transition: 'width .5s ease' }} />
              </div>
              <p style={{ fontSize: '.78rem', color: 'rgba(26,26,46,.4)', marginBottom: comment ? '1.25rem' : 0 }}>
                {doneCount} séance{doneCount > 1 ? 's' : ''} sur {totalSess} cette semaine
              </p>

              {comment && (
                <div style={{ background: 'rgba(139,47,201,.05)', borderRadius: 14, padding: '.85rem 1rem',
                  border: '1px solid rgba(139,47,201,.1)', marginTop: '1rem' }}>
                  <div style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '.1em', color: C.purple, marginBottom: '.35rem' }}>Message envoyé au coach</div>
                  <p style={{ fontSize: '.85rem', color: 'rgba(26,26,46,.6)', lineHeight: 1.65,
                    margin: 0, fontStyle: 'italic' }}>"{comment}"</p>
                </div>
              )}
            </>
          )}

          {/* ── CTA button ── */}
          <div style={{ marginTop: '1.75rem' }}>
            {step < 6 && (
              <button onClick={goNext}
                disabled={step === 1 && !ressenti || saving}
                style={{
                  width: '100%', padding: '.9rem', borderRadius: 50, border: 'none',
                  cursor: (step === 1 && !ressenti) || saving ? 'default' : 'pointer',
                  background: (step === 1 && !ressenti) || saving
                    ? 'rgba(26,26,46,.1)'
                    : `linear-gradient(135deg,${C.purple},${C.pink})`,
                  color: (step === 1 && !ressenti) || saving ? 'rgba(26,26,46,.3)' : '#fff',
                  fontSize: '.95rem', fontWeight: 800, transition: 'all .2s', fontFamily: 'inherit',
                }}>
                {saving ? 'Enregistrement…' : step === 5 ? '✅ Valider la séance' : 'Continuer →'}
              </button>
            )}
            {step === 6 && (
              <button onClick={onClose}
                style={{ width: '100%', padding: '.9rem', borderRadius: 50, border: 'none', cursor: 'pointer',
                  background: `linear-gradient(135deg,${C.purple},${C.pink})`,
                  color: '#fff', fontSize: '.95rem', fontWeight: 800, fontFamily: 'inherit' }}>
                Terminer 🎉
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
