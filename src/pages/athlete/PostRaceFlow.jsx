import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../lib/api'
import LoadingSpinner from '../../components/UI/LoadingSpinner'

const C = { purple: '#8B2FC9', pink: '#E8237A', green: '#34D399', yellow: '#FBBF24', red: '#F87171' }
const gradient = `linear-gradient(135deg, ${C.purple} 0%, ${C.pink} 100%)`

const FEELING_OPTIONS = [
  { value: 1, label: 'Très difficile', emoji: '😰', color: C.red },
  { value: 2, label: 'Difficile',      emoji: '😓', color: '#FB923C' },
  { value: 3, label: 'Correct',        emoji: '😐', color: C.yellow },
  { value: 4, label: 'Bien',           emoji: '😊', color: '#4ADE80' },
  { value: 5, label: 'Excellent',      emoji: '🤩', color: C.green },
]

const ISSUES = [
  { id: 'crampes',    label: 'Crampes',                        icon: '⚡' },
  { id: 'douleurs',  label: 'Douleurs musculaires',           icon: '🦵' },
  { id: 'nutrition', label: 'Nutrition / hydratation',        icon: '💧' },
  { id: 'mental',    label: 'Baisse de motivation',           icon: '🧠' },
  { id: 'meteo',     label: 'Conditions météo difficiles',    icon: '🌧️' },
  { id: 'allure',    label: 'Mauvaise gestion d\'allure',     icon: '⏱' },
  { id: 'gi',        label: 'Problèmes digestifs',            icon: '🤢' },
  { id: 'fatigue',   label: 'Fatigue globale',                icon: '😮‍💨' },
]

function fmtSecs(secs) {
  if (!secs) return null
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  return h > 0
    ? `${h}h${String(m).padStart(2, '0')}'${String(s).padStart(2, '0')}"`
    : `${m}'${String(s).padStart(2, '0')}"`
}

function TimeInput({ label, value, onChange }) {
  const h = Math.floor(value / 3600)
  const m = Math.floor((value % 3600) / 60)
  const s = value % 60

  function update(field, raw) {
    const n  = Math.max(0, parseInt(raw) || 0)
    const nh = field === 'h' ? n : h
    const nm = field === 'm' ? Math.min(59, n) : m
    const ns = field === 's' ? Math.min(59, n) : s
    onChange(nh * 3600 + nm * 60 + ns)
  }

  return (
    <div>
      <div style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.5)', marginBottom: '.5rem', fontWeight: 500 }}>{label}</div>
      <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
        {[
          { field: 'h', val: h, placeholder: 'h',   max: 9 },
          { field: 'm', val: m, placeholder: 'min', max: 59 },
          { field: 's', val: s, placeholder: 'sec', max: 59 },
        ].map(({ field, val, placeholder, max }, i) => (
          <div key={field} style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
            <input
              type="number" min={0} max={max}
              value={val === 0 ? '' : val}
              placeholder={placeholder}
              onChange={e => update(field, e.target.value)}
              style={{
                width: 68, padding: '.7rem .5rem', textAlign: 'center',
                background: 'rgba(255,255,255,.07)',
                border: '1px solid rgba(255,255,255,.12)',
                borderRadius: 12, color: '#fff', fontSize: '1.05rem',
                fontFamily: 'inherit', fontWeight: 600,
              }}
            />
            {i < 2 && <span style={{ color: 'rgba(255,255,255,.3)', fontWeight: 700, fontSize: '1.1rem' }}>:</span>}
          </div>
        ))}
      </div>
      <div style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.3)', marginTop: '.3rem' }}>heures : minutes : secondes</div>
    </div>
  )
}

// Parse numbered recovery text into structured steps
function parseRecovery(text) {
  if (!text) return []
  return text.split(/\n+/).filter(l => /^\d+\./.test(l.trim())).map(line => {
    const body = line.replace(/^\d+\.\s*/, '').replace(/\*\*/g, '').trim()
    return body
  }).filter(Boolean)
}

const RECOVERY_ICONS = ['🛌', '🚶', '🏊', '💪', '🏃']
const RECOVERY_COLORS = ['#6366F1', '#10B981', '#0EA5E9', '#F59E0B', C.purple]

export default function PostRaceFlow() {
  const { profile } = useAuth()
  const navigate    = useNavigate()

  const [step,       setStep]       = useState(1)
  const [timeSecs,   setTimeSecs]   = useState(0)
  const [feeling,    setFeeling]    = useState(null)
  const [issues,     setIssues]     = useState([])
  const [avgHr,      setAvgHr]      = useState('')
  const [maxHr,      setMaxHr]      = useState('')
  const [paceSecs,   setPaceSecs]   = useState(0)
  const [notes,      setNotes]      = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [analysis,   setAnalysis]   = useState(null)
  const [error,      setError]      = useState(null)
  const [loadingExisting, setLoadingExisting] = useState(true)

  useEffect(() => {
    if (!profile?.id) return
    api.getPostRaceAnalysis(profile.id)
      .then(({ result }) => {
        if (result?.post_race_analyses?.length) {
          setAnalysis({ ...result.post_race_analyses[0], raceResult: result })
        }
      })
      .catch(() => {})
      .finally(() => setLoadingExisting(false))
  }, [profile?.id])

  function toggleIssue(id) {
    setIssues(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    try {
      const { result } = await api.submitRaceResult({
        userId:         profile.id,
        raceDate:       profile.race_date,
        actualTimeSecs: timeSecs > 0 ? timeSecs : null,
        feeling, issues,
        avgHr:        avgHr ? parseInt(avgHr) : null,
        maxHr:        maxHr ? parseInt(maxHr) : null,
        avgPaceSecs:  paceSecs > 0 ? paceSecs : null,
        notes:        notes || null,
      })
      const { analysis: ana } = await api.generatePostRaceAnalysis({ userId: profile.id, raceResultId: result.id })
      setAnalysis({ ...ana, raceResult: result })
      setStep(4)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingExisting) return <LoadingSpinner fullPage text="Chargement…" />
  if (analysis) return <AnalysisView analysis={analysis} navigate={navigate} />

  const STEPS = ['Résultat', 'Difficultés', 'Données', 'Analyse']
  const progress = (step / STEPS.length) * 100

  return (
    <div className="page" style={{ maxWidth: 600, margin: '0 auto', paddingBottom: '3rem' }}>

      {/* ── FORM HEADER ── */}
      <div style={{
        background: gradient, borderRadius: 24, padding: '1.5rem',
        marginBottom: '1.25rem', color: '#fff', position: 'relative', overflow: 'hidden',
        boxShadow: '0 16px 48px rgba(139,47,201,.35)',
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,.06)', pointerEvents: 'none' }} />

        <button onClick={() => step > 1 ? setStep(s => s - 1) : navigate('/app/home')} style={{
          display: 'inline-flex', alignItems: 'center', gap: '.3rem',
          background: 'rgba(255,255,255,.15)', border: 'none', backdropFilter: 'blur(8px)',
          color: '#fff', borderRadius: 99, padding: '.35rem .9rem',
          cursor: 'pointer', fontSize: '.8rem', fontFamily: 'inherit', fontWeight: 600,
          marginBottom: '1rem',
        }}>
          ‹ {step > 1 ? 'Retour' : 'Accueil'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '2rem' }}>🏅</span>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Comment s'est passée ta course ?</h2>
            <p style={{ margin: '.2rem 0 0', opacity: .75, fontSize: '.8rem' }}>Partage ton ressenti, j'analyse tout</p>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,.2)', overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 99, background: '#fff', width: `${progress}%`, transition: 'width .4s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.45rem' }}>
          {STEPS.map((s, i) => (
            <span key={s} style={{ fontSize: '.68rem', fontWeight: step === i + 1 ? 700 : 400, opacity: step === i + 1 ? 1 : .5 }}>{s}</span>
          ))}
        </div>
      </div>

      {error && (
        <div style={{
          background: 'rgba(248,113,113,.12)', border: '1px solid rgba(248,113,113,.3)',
          borderRadius: 12, padding: '1rem', marginBottom: '1rem', fontSize: '.875rem', color: C.red,
        }}>
          {error}
        </div>
      )}

      {/* ── STEP 1 — Résultat ── */}
      {step === 1 && (
        <FormCard>
          <SectionLabel>Ton chrono</SectionLabel>
          <div style={{ marginBottom: '1.75rem' }}>
            <TimeInput label="Chrono réalisé (optionnel)" value={timeSecs} onChange={setTimeSecs} />
          </div>

          <SectionLabel>Comment tu t'es senti(e) ? *</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', marginBottom: '1.75rem' }}>
            {FEELING_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => setFeeling(opt.value)} style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                padding: '.85rem 1rem', borderRadius: 14, cursor: 'pointer',
                fontFamily: 'inherit', fontSize: '.9rem', fontWeight: 500,
                border: `1.5px solid ${feeling === opt.value ? opt.color : 'rgba(255,255,255,.08)'}`,
                background: feeling === opt.value ? `${opt.color}18` : 'rgba(255,255,255,.04)',
                color: '#fff', textAlign: 'left', transition: 'all .15s',
              }}>
                <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>{opt.emoji}</span>
                <span style={{ flex: 1 }}>{opt.label}</span>
                {feeling === opt.value && (
                  <span style={{
                    width: 20, height: 20, borderRadius: '50%', background: opt.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '.7rem', flexShrink: 0,
                  }}>✓</span>
                )}
              </button>
            ))}
          </div>

          <PrimaryBtn disabled={!feeling} onClick={() => setStep(2)}>Suivant →</PrimaryBtn>
        </FormCard>
      )}

      {/* ── STEP 2 — Difficultés ── */}
      {step === 2 && (
        <FormCard>
          <SectionLabel>As-tu rencontré des difficultés ?</SectionLabel>
          <p style={{ color: 'rgba(255,255,255,.45)', fontSize: '.8rem', marginBottom: '1.25rem', marginTop: '-.25rem' }}>
            Coche tout ce qui s'applique — ou passe directement
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem', marginBottom: '1.75rem' }}>
            {ISSUES.map(issue => {
              const on = issues.includes(issue.id)
              return (
                <button key={issue.id} onClick={() => toggleIssue(issue.id)} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '.3rem',
                  padding: '.85rem', borderRadius: 14, cursor: 'pointer',
                  fontFamily: 'inherit',
                  border: `1.5px solid ${on ? C.purple : 'rgba(255,255,255,.08)'}`,
                  background: on ? 'rgba(139,47,201,.18)' : 'rgba(255,255,255,.04)',
                  color: '#fff', textAlign: 'left', transition: 'all .15s',
                  position: 'relative',
                }}>
                  {on && (
                    <span style={{
                      position: 'absolute', top: 8, right: 8,
                      width: 16, height: 16, borderRadius: '50%',
                      background: C.purple, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '.6rem',
                    }}>✓</span>
                  )}
                  <span style={{ fontSize: '1.3rem' }}>{issue.icon}</span>
                  <span style={{ fontSize: '.78rem', lineHeight: 1.3, color: on ? '#fff' : 'rgba(255,255,255,.65)', fontWeight: on ? 600 : 400 }}>
                    {issue.label}
                  </span>
                </button>
              )
            })}
          </div>

          <PrimaryBtn onClick={() => setStep(3)}>
            {issues.length === 0 ? 'Passer →' : `Suivant (${issues.length} sélectionnés) →`}
          </PrimaryBtn>
        </FormCard>
      )}

      {/* ── STEP 3 — Données ── */}
      {step === 3 && (
        <FormCard>
          <SectionLabel>Données de course</SectionLabel>
          <p style={{ color: 'rgba(255,255,255,.45)', fontSize: '.8rem', marginBottom: '1.5rem', marginTop: '-.25rem' }}>
            Tout est optionnel — enrichit mon analyse
          </p>

          <div style={{ display: 'flex', gap: '.75rem', marginBottom: '1.25rem' }}>
            {[
              { label: 'FC moyenne', val: avgHr, set: setAvgHr, placeholder: '165' },
              { label: 'FC max',     val: maxHr, set: setMaxHr, placeholder: '185' },
            ].map(({ label, val, set, placeholder }) => (
              <div key={label} style={{ flex: 1 }}>
                <div style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.5)', marginBottom: '.4rem', fontWeight: 500 }}>
                  {label} <span style={{ opacity: .5 }}>bpm</span>
                </div>
                <input type="number" min={40} max={250}
                  value={val} onChange={e => set(e.target.value)} placeholder={placeholder}
                  style={{
                    width: '100%', padding: '.7rem', borderRadius: 12,
                    background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)',
                    color: '#fff', fontSize: '.95rem', fontFamily: 'inherit',
                    fontWeight: 600, boxSizing: 'border-box',
                  }}
                />
              </div>
            ))}
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <TimeInput label="Allure moyenne /km (optionnel)" value={paceSecs} onChange={setPaceSecs} />
          </div>

          <div style={{ marginBottom: '1.75rem' }}>
            <div style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.5)', marginBottom: '.4rem', fontWeight: 500 }}>
              Commentaire libre
            </div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Ce que tu veux partager avec ton coach…"
              rows={3}
              style={{
                width: '100%', padding: '.85rem', borderRadius: 12,
                background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)',
                color: '#fff', fontSize: '.875rem', fontFamily: 'inherit',
                resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6,
              }}
            />
          </div>

          <PrimaryBtn onClick={handleSubmit} disabled={submitting}>
            {submitting ? '⏳ Génération en cours…' : '🎯 Obtenir mon analyse'}
          </PrimaryBtn>

          {submitting && (
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <LoadingSpinner text="J'analyse ta performance…" />
            </div>
          )}
        </FormCard>
      )}
    </div>
  )
}

function AnalysisView({ analysis, navigate }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { setTimeout(() => setVisible(true), 50) }, [])

  const c  = analysis?.content || {}
  const rr = analysis?.raceResult
  const recoverySteps = parseRecovery(c.recuperation)
  const feelingOpt = FEELING_OPTIONS.find(f => f.value === rr?.feeling)

  return (
    <div className="page" style={{ maxWidth: 640, margin: '0 auto', paddingBottom: '3rem' }}>

      {/* ── HERO ── */}
      <div style={{
        background: gradient, borderRadius: 24, padding: '1.75rem',
        marginBottom: '1.25rem', color: '#fff', position: 'relative', overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(232,35,122,.35)',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -30, left: -50, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,.04)', pointerEvents: 'none' }} />

        <button onClick={() => navigate('/app/home')} style={{
          display: 'inline-flex', alignItems: 'center', gap: '.3rem',
          background: 'rgba(255,255,255,.15)', border: 'none', backdropFilter: 'blur(8px)',
          color: '#fff', borderRadius: 99, padding: '.35rem .9rem',
          cursor: 'pointer', fontSize: '.8rem', fontFamily: 'inherit', fontWeight: 600,
          marginBottom: '1.25rem',
        }}>
          ‹ Accueil
        </button>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '.5rem' }}>🏅</div>
          <div style={{ fontSize: '.75rem', fontWeight: 700, letterSpacing: '.08em', opacity: .7, textTransform: 'uppercase', marginBottom: '.4rem' }}>
            Analyse post-course
          </div>

          {rr?.actual_time_secs ? (
            <div style={{ fontSize: '2.8rem', fontWeight: 900, letterSpacing: '-.02em', lineHeight: 1 }}>
              {fmtSecs(rr.actual_time_secs)}
            </div>
          ) : (
            <div style={{ fontSize: '1.4rem', fontWeight: 700, opacity: .8 }}>Course terminée !</div>
          )}

          {/* Stats row */}
          {(rr?.avg_hr || rr?.max_hr || rr?.avg_pace_secs || feelingOpt) && (
            <div style={{
              display: 'flex', justifyContent: 'center', gap: '.6rem', flexWrap: 'wrap',
              marginTop: '1rem',
            }}>
              {feelingOpt && (
                <StatChip icon={feelingOpt.emoji} label={feelingOpt.label} color={feelingOpt.color} />
              )}
              {rr?.avg_hr && <StatChip icon="❤️" label={`${rr.avg_hr} bpm moy`} />}
              {rr?.max_hr && <StatChip icon="🔴" label={`${rr.max_hr} bpm max`} />}
              {rr?.avg_pace_secs && <StatChip icon="⏱" label={`${fmtSecs(rr.avg_pace_secs)}/km`} />}
            </div>
          )}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{
        opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(16px)',
        transition: 'opacity .5s ease, transform .5s ease',
      }}>

        {/* Performance */}
        {c.performance && (
          <Section icon="📊" label="Performance" color="#6366F1" title="Ton résultat analysé">
            <p style={{ margin: 0, lineHeight: 1.8, color: 'rgba(255,255,255,.82)', fontSize: '.9rem' }}>
              {c.performance}
            </p>
          </Section>
        )}

        {/* Stratégie */}
        {c.strategie && (
          <Section icon="🏃" label="Stratégie" color={C.yellow} title="Comment tu as couru">
            <p style={{ margin: 0, lineHeight: 1.8, color: 'rgba(255,255,255,.82)', fontSize: '.9rem' }}>
              {c.strategie}
            </p>
          </Section>
        )}

        {/* Positifs + Améliorations */}
        {(c.positifs?.length > 0 || c.ameliorations?.length > 0) && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem', marginBottom: '1rem' }}>
            {c.positifs?.length > 0 && (
              <div style={{
                background: 'rgba(52,211,153,.08)', border: '1px solid rgba(52,211,153,.2)',
                borderRadius: 20, padding: '1.1rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', marginBottom: '.85rem' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, background: 'rgba(52,211,153,.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.85rem',
                  }}>✅</div>
                  <span style={{ fontSize: '.7rem', fontWeight: 700, color: C.green, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                    Points forts
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.55rem' }}>
                  {c.positifs.map((p, i) => (
                    <div key={i} style={{ display: 'flex', gap: '.5rem', alignItems: 'flex-start' }}>
                      <span style={{ color: C.green, fontSize: '.7rem', marginTop: '.2rem', flexShrink: 0 }}>●</span>
                      <span style={{ fontSize: '.8rem', lineHeight: 1.5, color: 'rgba(255,255,255,.8)' }}>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {c.ameliorations?.length > 0 && (
              <div style={{
                background: 'rgba(251,191,36,.08)', border: '1px solid rgba(251,191,36,.2)',
                borderRadius: 20, padding: '1.1rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', marginBottom: '.85rem' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, background: 'rgba(251,191,36,.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.85rem',
                  }}>🎯</div>
                  <span style={{ fontSize: '.7rem', fontWeight: 700, color: C.yellow, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                    À améliorer
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.55rem' }}>
                  {c.ameliorations.map((a, i) => (
                    <div key={i} style={{ display: 'flex', gap: '.5rem', alignItems: 'flex-start' }}>
                      <span style={{ color: C.yellow, fontSize: '.7rem', marginTop: '.2rem', flexShrink: 0 }}>●</span>
                      <span style={{ fontSize: '.8rem', lineHeight: 1.5, color: 'rgba(255,255,255,.8)' }}>{a}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Récupération */}
        {recoverySteps.length > 0 && (
          <Section icon="💤" label="Récupération" color="#0EA5E9" title="Plan J+1 à J+14">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
              {recoverySteps.map((step, i) => (
                <div key={i} style={{
                  display: 'flex', gap: '.85rem', alignItems: 'flex-start',
                  background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)',
                  borderRadius: 14, padding: '.85rem',
                }}>
                  <div style={{
                    width: 36, height: 36, flexShrink: 0, borderRadius: 10,
                    background: `${RECOVERY_COLORS[i % RECOVERY_COLORS.length]}22`,
                    border: `1px solid ${RECOVERY_COLORS[i % RECOVERY_COLORS.length]}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
                  }}>
                    {RECOVERY_ICONS[i % RECOVERY_ICONS.length]}
                  </div>
                  <p style={{ margin: 0, fontSize: '.85rem', lineHeight: 1.65, color: 'rgba(255,255,255,.78)' }}>
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Message coach */}
        {c.message_coach && (
          <div style={{
            background: 'rgba(139,47,201,.12)',
            border: '1px solid rgba(139,47,201,.25)',
            borderRadius: 20, padding: '1.25rem',
            marginBottom: '1.5rem',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: -20, right: -20, width: 100, height: 100,
              borderRadius: '50%', background: 'rgba(232,35,122,.08)', pointerEvents: 'none',
            }} />
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <img src="/Coach.JPG" alt="Alexis" style={{
                  width: 48, height: 48, borderRadius: '50%', objectFit: 'cover',
                  border: '2px solid rgba(232,35,122,.5)',
                }} />
                <div style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: 14, height: 14, borderRadius: '50%', background: C.green,
                  border: '2px solid #0C0A18',
                }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '.7rem', fontWeight: 700, color: C.pink,
                  textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '.5rem',
                }}>
                  Mon message
                </div>
                <p style={{
                  margin: 0, lineHeight: 1.75, fontStyle: 'italic',
                  color: 'rgba(255,255,255,.88)', fontSize: '.9rem',
                }}>
                  "{c.message_coach}"
                </p>
              </div>
            </div>
          </div>
        )}

        <button onClick={() => navigate('/app/home')} style={{
          width: '100%', padding: '.875rem', background: gradient, border: 'none',
          borderRadius: 99, color: '#fff', fontSize: '.95rem', fontWeight: 700,
          cursor: 'pointer', fontFamily: 'inherit',
          boxShadow: '0 8px 24px rgba(139,47,201,.4)',
        }}>
          Retour au tableau de bord
        </button>
      </div>
    </div>
  )
}

// ── Shared helpers ──

function Section({ icon, label, color, title, children }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)',
      borderRadius: 20, padding: '1.25rem', marginBottom: '1rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '1rem' }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
          background: `${color}22`, border: `1px solid ${color}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.95rem',
        }}>
          {icon}
        </div>
        <div>
          <div style={{ fontSize: '.65rem', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '.07em' }}>{label}</div>
          <div style={{ fontSize: '.95rem', fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{title}</div>
        </div>
      </div>
      {children}
    </div>
  )
}

function FormCard({ children }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)',
      borderRadius: 20, padding: '1.5rem',
    }}>
      {children}
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: '.75rem', fontWeight: 700, color: 'rgba(255,255,255,.45)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '.85rem' }}>
      {children}
    </div>
  )
}

function PrimaryBtn({ children, disabled, onClick }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: '100%', padding: '.875rem', background: disabled ? 'rgba(255,255,255,.08)' : gradient,
      border: 'none', borderRadius: 99, color: disabled ? 'rgba(255,255,255,.3)' : '#fff',
      fontSize: '.95rem', fontWeight: 700, cursor: disabled ? 'default' : 'pointer',
      fontFamily: 'inherit', transition: 'all .2s',
      boxShadow: disabled ? 'none' : '0 8px 24px rgba(139,47,201,.35)',
    }}>
      {children}
    </button>
  )
}

function StatChip({ icon, label, color }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '.35rem',
      background: color ? `${color}22` : 'rgba(255,255,255,.15)',
      border: `1px solid ${color ? color + '44' : 'rgba(255,255,255,.2)'}`,
      backdropFilter: 'blur(8px)', borderRadius: 99,
      padding: '.3rem .75rem', fontSize: '.78rem', fontWeight: 600,
    }}>
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  )
}
