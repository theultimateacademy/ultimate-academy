import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { api } from '../../lib/api'
import { daysUntil, OBJECTIVE_LABELS, getPlanStartMonday, getPlanWeeksElapsed } from '../../lib/utils'
import LoadingSpinner from '../../components/UI/LoadingSpinner'

// ── Helpers visuels ────────────────────────────────────────────────────────────
const rpeColor = r => !r ? 'rgba(255,255,255,.3)' : r >= 8 ? '#EF4444' : r >= 6 ? '#F59E0B' : '#10B981'
const rpeBg    = r => !r ? 'transparent' : r >= 8 ? 'rgba(239,68,68,.12)' : r >= 6 ? 'rgba(245,158,11,.12)' : 'rgba(16,185,129,.12)'

// Rendu riche : **texte** → gras violet/rose
function renderRich(text, accent = '#C084FC') {
  if (!text) return null
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i} style={{ color: accent, fontWeight: 800 }}>{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>
  )
}

const typeColor = (type) => {
  if (!type) return '#10B981'
  const t = (type || '').toLowerCase()
  if (t.includes('nat'))                      return '#3B82F6'
  if (t.includes('vél') || t.includes('vel') || t.includes('velo')) return '#F97316'
  if (t.includes('brique'))                   return '#8B2FC9'
  if (t.includes('renfo'))                    return '#EC4899'
  return '#10B981'
}

// Barre RPE : 10 segments colorés
function RpeBar({ rpe }) {
  const c = rpeColor(rpe)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '.35rem' }}>
      <div style={{ display: 'flex', gap: 2 }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} style={{ width: 5, height: 12, borderRadius: 2, background: i < rpe ? c : 'rgba(255,255,255,.1)', transition: 'background .3s' }} />
        ))}
      </div>
      <span style={{ fontSize: '.78rem', fontWeight: 800, color: c, minWidth: 14 }}>{rpe || '—'}</span>
    </div>
  )
}

// Jauge arc SVG pour RPE moyen
function RpeGauge({ value, max = 10 }) {
  if (!value) return null
  const r = 34, cx = 44, cy = 44
  const circ = 2 * Math.PI * r
  const arcPct = 0.72
  const arc = circ * arcPct
  const fill = arc * Math.min(value / max, 1)
  const c = rpeColor(value)
  const label = value < 5 ? 'Facile' : value < 7 ? 'Modéré' : value < 9 ? 'Intense' : 'Max'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width="88" height="66" viewBox="0 0 88 66">
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="7"
          strokeDasharray={`${arc} ${circ - arc}`} strokeLinecap="round"
          transform={`rotate(144, ${cx}, ${cx})`} />
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={c} strokeWidth="7"
          strokeDasharray={`${fill} ${circ - fill}`} strokeLinecap="round"
          transform={`rotate(144, ${cx}, ${cx})`} style={{ transition: 'stroke-dasharray .8s ease' }} />
        <text x={cx} y={cx - 2} textAnchor="middle" fill={c} fontSize="16" fontWeight="900" fontFamily="inherit">{value}</text>
        <text x={cx} y={cx + 12} textAnchor="middle" fill="rgba(255,255,255,.3)" fontSize="8" fontFamily="inherit">/10</text>
      </svg>
      <span style={{ fontSize: '.65rem', color: c, fontWeight: 700, marginTop: -6 }}>{label}</span>
    </div>
  )
}

// Grille hebdomadaire — 7 jours avec dots colorés
const DAYS_SHORT = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const JOUR_IDX = { Lundi: 0, Mardi: 1, Mercredi: 2, Jeudi: 3, Vendredi: 4, Samedi: 5, Dimanche: 6 }

function WeekGrid({ sessions }) {
  const byDay = sessions.reduce((acc, s) => {
    const i = JOUR_IDX[s.jour]
    if (i !== undefined) { if (!acc[i]) acc[i] = []; acc[i].push(s) }
    return acc
  }, {})
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '.3rem', textAlign: 'center' }}>
      {DAYS_SHORT.map((d, i) => {
        const dayS = byDay[i] || []
        const s0 = dayS[0]
        const color = s0 ? typeColor(s0.type) : null
        const done  = s0?.done !== false
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.25rem' }}>
            <span style={{ fontSize: '.62rem', color: 'rgba(255,255,255,.3)', fontWeight: 600 }}>{d}</span>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: color ? (done ? color + '28' : 'transparent') : 'transparent',
              border: color ? `2px solid ${color}` : '2px solid rgba(255,255,255,.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative',
            }}>
              {done && color && <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />}
              {dayS.length > 1 && (
                <div style={{ position: 'absolute', top: -3, right: -3, width: 10, height: 10, borderRadius: '50%', background: typeColor(dayS[1].type), border: '1.5px solid var(--bg)', fontSize: '.45rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>{dayS.length}</div>
              )}
            </div>
            {color && <div style={{ width: 3, height: 3, borderRadius: '50%', background: color, opacity: .6 }} />}
          </div>
        )
      })}
    </div>
  )
}

// Légende sport
function SportLegend({ sessions }) {
  const types = [...new Set(sessions.map(s => s.type).filter(Boolean))]
  const grouped = types.slice(0, 4)
  return (
    <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
      {grouped.map((t, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '.25rem' }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: typeColor(t) }} />
          <span style={{ fontSize: '.62rem', color: 'rgba(255,255,255,.35)' }}>{t.split(' ')[0]}</span>
        </div>
      ))}
    </div>
  )
}

// Modale analyse mensuelle
function MonthlyAnalysisModal({ analysis, onClose }) {
  const d       = analysis.analysis_data || {}
  const month   = d.month || ''
  const conseil = d.conseil || ''

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: '#09090F', overflowY: 'auto' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div style={{
          position: 'sticky', top: 0, zIndex: 2,
          background: 'linear-gradient(160deg, rgba(6,182,212,.15) 0%, #09090F 75%)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,.07)',
          padding: 'calc(env(safe-area-inset-top, 0px) + 1.25rem) 1.5rem 1rem',
          display: 'flex', alignItems: 'center', gap: '.875rem',
        }}>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,.07)', border: 'none', borderRadius: 10, padding: '.4rem .85rem', cursor: 'pointer', color: 'rgba(255,255,255,.65)', fontSize: '.8rem', fontWeight: 700, fontFamily: 'inherit', flexShrink: 0 }}>
            ← Retour
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: '.95rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              📅 Analyse du mois de {month}
            </div>
            {analysis.sent_at && (
              <div style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.28)' }}>
                {new Date(analysis.sent_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: '1.75rem 1.5rem 5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {conseil ? (
            <div style={{ background: 'rgba(6,182,212,.07)', border: '1px solid rgba(6,182,212,.22)', borderRadius: 14, padding: '1.5rem' }}>
              <div style={{ fontSize: '.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: '#22D3EE', marginBottom: '.875rem' }}>
                Analyse du mois de {month}
              </div>
              <p style={{ fontSize: '.92rem', lineHeight: 1.8, margin: 0, color: 'rgba(255,255,255,.88)', textAlign: 'justify', whiteSpace: 'pre-wrap' }}>
                {renderRich(conseil, '#22D3EE')}
              </p>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,.3)', fontSize: '.9rem' }}>
              Ton bilan mensuel est en cours de rédaction...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Modale analyse — pleine page
function WeeklyAnalysisModal({ analysis, onClose }) {
  const d = analysis.analysis_data || {}
  const intro    = analysis.coach_message || ''
  const sessions = d.sessions || d.sessions_comments || []
  const conseil  = d.conseil || d.ajustement_semaine_suivante || ''
  const rpe      = d.rpe_moyen
  const mood     = d.mood || 'good'
  const MOOD = {
    fire:      { icon: '🔥', color: '#F97316', label: 'En feu !' },
    good:      { icon: '💪', color: '#10B981', label: 'Bonne semaine' },
    ok:        { icon: '👌', color: '#3B82F6', label: 'Semaine solide' },
    attention: { icon: '⚠️', color: '#F59E0B', label: 'À surveiller' },
  }
  const m = MOOD[mood] || MOOD.good
  const done  = sessions.filter(s => s.done !== false).length
  const total = sessions.length

  // Prevent body scroll when modal open
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: '#09090F', overflowY: 'auto' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>

        {/* ── Header sticky ── */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 2,
          background: `linear-gradient(160deg, ${m.color}1e 0%, #09090F 75%)`,
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,.07)',
          padding: 'calc(env(safe-area-inset-top, 0px) + 1.25rem) 1.5rem 1rem',
          display: 'flex', alignItems: 'center', gap: '.875rem',
        }}>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,.07)', border: 'none', borderRadius: 10,
              padding: '.4rem .85rem', cursor: 'pointer', color: 'rgba(255,255,255,.65)',
              fontSize: '.8rem', fontWeight: 700, fontFamily: 'inherit', flexShrink: 0,
              display: 'flex', alignItems: 'center', gap: '.3rem',
            }}>
            ← Retour
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: '.95rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {m.icon} Analyse de la semaine {analysis.week_number}
            </div>
            {analysis.sent_at && (
              <div style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.28)' }}>
                {new Date(analysis.sent_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            )}
          </div>
          <span style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.3)', fontWeight: 700, flexShrink: 0 }}>
            {done}/{total} séances
          </span>
        </div>

        {/* ── Contenu ── */}
        <div style={{ padding: '1.75rem 1.5rem 5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          {/* Vue semaine */}
          <div>
            <div style={{ fontSize: '.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: 'rgba(255,255,255,.22)', marginBottom: '1rem' }}>Vue de la semaine</div>
            <WeekGrid sessions={sessions} />
            <div style={{ marginTop: '.875rem' }}>
              <SportLegend sessions={sessions} />
            </div>
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,.06)' }} />

          {/* Retour par séance */}
          {sessions.length > 0 && (
            <div>
              <div style={{ fontSize: '.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: 'rgba(255,255,255,.22)', marginBottom: '1.125rem' }}>Retour par séance</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {sessions.map((s, i) => {
                  const c   = typeColor(s.type)
                  const isDone = s.done !== false
                  return (
                    <div key={i} style={{
                      background: 'rgba(255,255,255,.03)',
                      border: `1px solid ${c}1a`,
                      borderLeft: `4px solid ${c}`,
                      borderRadius: 14,
                      padding: '1rem 1.25rem',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '.75rem', marginBottom: '.625rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 800, fontSize: '.88rem', color: isDone ? '#fff' : 'rgba(255,255,255,.38)' }}>{s.titre}</span>
                            {!isDone && <span style={{ fontSize: '.62rem', color: '#F59E0B', fontWeight: 700, background: 'rgba(245,158,11,.1)', borderRadius: 4, padding: '.1rem .35rem' }}>Non effectuée</span>}
                          </div>
                          <div style={{ fontSize: '.7rem', color: `${c}bb`, fontWeight: 600, marginTop: '.2rem' }}>
                            {s.jour}{s.type ? ` · ${s.type}` : ''}
                          </div>
                        </div>
                        <div style={{ flexShrink: 0 }}>
                          <RpeBar rpe={s.rpe} />
                        </div>
                      </div>
                      {s.coach_comment && (
                        <div style={{ background: 'linear-gradient(135deg, rgba(139,47,201,.08), rgba(232,35,122,.04))', border: '1px solid rgba(139,47,201,.18)', borderRadius: 10, padding: '.6rem .875rem', marginBottom: (s.comment || s.note) ? '.5rem' : 0 }}>
                          <div style={{ fontSize: '.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#C084FC', marginBottom: '.3rem' }}>Alexis</div>
                          <p style={{ fontSize: '.845rem', lineHeight: 1.65, color: 'rgba(255,255,255,.88)', margin: 0, textAlign: 'justify' }}>{renderRich(s.coach_comment)}</p>
                        </div>
                      )}
                      {(s.comment || s.note) && (
                        <p style={{ fontSize: '.8rem', lineHeight: 1.6, color: 'rgba(255,255,255,.5)', margin: 0, fontStyle: 'italic' }}>
                          {renderRich(s.comment || s.note)}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* RPE moyen gauge */}
          {rpe && (
            <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <RpeGauge value={rpe} />
              <div>
                <div style={{ fontWeight: 800, fontSize: '.92rem', marginBottom: '.35rem' }}>
                  RPE moyen · <span style={{ color: rpeColor(rpe) }}>{rpe}/10</span>
                </div>
                <p style={{ fontSize: '.82rem', color: 'rgba(255,255,255,.45)', lineHeight: 1.55, margin: 0 }}>
                  {rpe < 5 ? 'Semaine légère, bonne récupération active.' : rpe < 7 ? 'Charge modérée bien gérée. Endurance de fond qui progresse.' : rpe < 9 ? 'Semaine chargée. Assure-toi de bien dormir et bien manger.' : 'Semaine très intense. Récupération prioritaire.'}
                </p>
              </div>
            </div>
          )}

          {/* Focus semaine prochaine */}
          {conseil && (
            <div style={{ background: 'rgba(59,130,246,.07)', border: '1px solid rgba(59,130,246,.22)', borderRadius: 14, padding: '1.25rem 1.5rem' }}>
              <div style={{ fontSize: '.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: '#60A5FA', marginBottom: '.625rem' }}>→ Focus semaine prochaine</div>
              <p style={{ fontSize: '.9rem', lineHeight: 1.75, margin: 0, color: 'rgba(255,255,255,.85)', textAlign: 'justify' }}>
                {renderRich(conseil, '#60A5FA')}
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default function AthleteHome() {
  const { profile } = useAuth()
  const navigate    = useNavigate()
  const [plan,          setPlan]          = useState(null)
  const [nextSession,   setNextSession]   = useState(null)
  const [weekProgress,  setWeekProgress]  = useState({ done: 0, total: 0 })
  const [lastMessage,   setLastMessage]   = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [analysis,         setAnalysis]         = useState(null)
  const [analysisOpen,     setAnalysisOpen]     = useState(false)
  const [monthlyAnalysis,  setMonthlyAnalysis]  = useState(null)
  const [monthlyOpen,      setMonthlyOpen]      = useState(false)
  const [preRaceAnalysis,  setPreRaceAnalysis]  = useState(null)
  const [hasPostRace,      setHasPostRace]      = useState(false)

  useEffect(() => {
    if (!profile?.id) return
    loadData()
  }, [profile?.id])

  async function loadData() {
    setLoading(true)
    try {
      const raceDate = profile?.race_date
      const nowDay = new Date(); nowDay.setHours(0,0,0,0)
      const rawD = raceDate
        ? Math.ceil((new Date(raceDate).setHours(0,0,0,0) - nowDay.getTime()) / (24 * 3600 * 1000))
        : null

      const basePromises = [
        supabase.from('training_plans').select('*').eq('user_id', profile.id).eq('status', 'active').single(),
        supabase.from('messages').select('*').eq('user_id', profile.id).eq('sender', 'coach').order('created_at', { ascending: false }).limit(1),
        supabase.from('weekly_analyses').select('*').eq('user_id', profile.id).eq('status', 'sent').order('created_at', { ascending: false }).limit(3)
      ]
      const [{ data: plans }, { data: msgs }, { data: analyses }] = await Promise.all(basePromises)

      // Pre-race analysis: load when 1-7 days before race
      if (rawD !== null && rawD >= 1 && rawD <= 7) {
        api.getPreRaceAnalysis(profile.id)
          .then(({ analysis: pra }) => setPreRaceAnalysis(pra))
          .catch(() => {})
      }

      // Post-race: check if result already submitted (race day or day after)
      if (rawD !== null && rawD >= -1 && rawD <= 0) {
        api.getPostRaceAnalysis(profile.id)
          .then(({ result }) => setHasPostRace(!!(result?.post_race_analyses?.length)))
          .catch(() => {})
      }

      setPlan(plans)
      setLastMessage(msgs?.[0] || null)
      const weeklyA   = (analyses || []).find(a => !a.analysis_data?.is_monthly)
      const monthlyA  = (analyses || []).find(a =>  a.analysis_data?.is_monthly)
      setAnalysis(weeklyA || null)
      setMonthlyAnalysis(monthlyA || null)

      if (plans) {
        const weeks        = plans.plan_data?.semaines || []
        const planMonday   = getPlanStartMonday(plans.activated_at || plans.created_at)
        const weeksElapsed = getPlanWeeksElapsed(plans)

        if (weeksElapsed === 0) {
          // Plan hasn't started yet — show start date, no sessions
          setWeekProgress({ notStarted: true, startDate: planMonday })
        } else {
          const currentWeek = weeks.find(w => w.numero === weeksElapsed)

          if (currentWeek) {
            const { data: completions } = await supabase
              .from('session_completions')
              .select('week_number, session_index, rpe')
              .eq('user_id', profile.id)
              .eq('plan_id', plans.id)
              .eq('week_number', currentWeek.numero)

            const doneIdxs = new Set((completions || []).map(c => c.session_index))
            const rpeList  = (completions || []).filter(c => c.rpe).map(c => c.rpe)
            const avgRpe   = rpeList.length ? (rpeList.reduce((a,b) => a+b,0) / rpeList.length).toFixed(1) : null

            const DAY_MAP   = { Lundi:0, Mardi:1, Mercredi:2, Jeudi:3, Vendredi:4, Samedi:5, Dimanche:6 }
            const rawSeances = currentWeek.seances || []
            const weekStart  = new Date(planMonday)
            weekStart.setDate(planMonday.getDate() + (weeksElapsed - 1) * 7)
            const today = new Date(); today.setHours(0,0,0,0)

            // Sort by real calendar day, preserve original idx for completion lookup
            const seancesWithIdx = rawSeances
              .map((s, origIdx) => ({ ...s, _origIdx: origIdx }))
              .sort((a, b) => {
                const order = s => {
                  if (s.date) { const d = new Date(s.date + 'T00:00:00').getDay(); return d === 0 ? 7 : d }
                  return (DAY_MAP[s.jour] ?? 10) + 1
                }
                return order(a) - order(b)
              })

            const sessionStatuses = seancesWithIdx.map(s => {
              if (doneIdxs.has(s._origIdx)) return 'done'
              const offset      = DAY_MAP[s.jour] ?? s._origIdx
              const sessionDate = new Date(weekStart); sessionDate.setDate(weekStart.getDate() + offset)
              sessionDate.setHours(0,0,0,0)
              return sessionDate < today ? 'missed' : 'upcoming'
            })

            setWeekProgress({ done: doneIdxs.size, total: rawSeances.length, statuses: sessionStatuses, seances: seancesWithIdx, avgRpe })

            const next = seances.find((_, idx) => !doneIdxs.has(idx))
            if (next) setNextSession({ ...next, weekNum: currentWeek.numero })
          }
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const days = profile?.race_date ? daysUntil(profile.race_date) : null

  // Raw days (can be negative for past race dates)
  const rawDays = profile?.race_date
    ? Math.ceil((new Date(profile.race_date).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / (24 * 3600 * 1000))
    : null
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  if (loading) return <LoadingSpinner fullPage text="Chargement de ton espace…" />

  return (
    <div className="page">

      {/* Welcome */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ fontSize: '.875rem', color: 'var(--text-muted)', marginBottom: '.25rem' }}>
          {greeting} 👋
        </div>
        <h2>{profile?.first_name} !</h2>
        {plan?.status === 'pending' && (
          <div className="alert alert-info" style={{ marginTop: '1rem' }}>
            ⏳ Ton coach prépare ton plan personnalisé. Tu seras notifié dès qu'il sera prêt !
          </div>
        )}
      </div>

      {/* Stats row */}
      {plan && (
        <div className="grid-3 stat-cards-3" style={{ marginBottom: '1.5rem' }}>
          <div className="stat-card stat-card--dark">
            <div className="stat-value">{weekProgress.done}/{weekProgress.total}</div>
            <div className="stat-label">Séances cette semaine</div>
          </div>
          {days !== null && (
            <div className="stat-card stat-card--accent">
              <div className="stat-value">{days}</div>
              <div className="stat-label">Jours avant la course</div>
            </div>
          )}
          <div className="stat-card">
            <div className="stat-value gradient-text">{OBJECTIVE_LABELS[profile?.objective] || 'N/C'}</div>
            <div className="stat-label">Ton objectif</div>
          </div>
        </div>
      )}

      {/* Plan not started yet */}
      {plan && weekProgress.notStarted && (
        <div className="card" style={{ marginBottom: '1.5rem', textAlign: 'center', padding: '1.5rem' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '.5rem' }}>🗓️</div>
          <div style={{ fontWeight: 700, marginBottom: '.25rem' }}>Ton programme démarre bientôt</div>
          <div style={{ fontSize: '.875rem', color: 'var(--text-muted)' }}>
            Semaine 1 commence le{' '}
            <strong style={{ color: 'var(--primary)' }}>
              {weekProgress.startDate?.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </strong>
          </div>
        </div>
      )}

      {/* Week progress */}
      {plan && weekProgress.total > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header" style={{ marginBottom: '.75rem' }}>
            <span className="card-title">Semaine en cours</span>
            <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
              {weekProgress.avgRpe && (
                <span style={{ fontSize: '.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  RPE moy. {weekProgress.avgRpe}
                </span>
              )}
              <span className="badge badge-primary">{weekProgress.done}/{weekProgress.total}</span>
            </div>
          </div>
          <div className="progress-bar" style={{ marginBottom: '1rem' }}>
            <div className="progress-bar-fill" style={{ width: `${(weekProgress.done / weekProgress.total) * 100}%` }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
            {(weekProgress.seances || []).map((s, i) => {
              const status = weekProgress.statuses?.[i] || 'upcoming'
              const icon   = status === 'done' ? '✅' : status === 'missed' ? '❌' : '⏳'
              const color  = status === 'done' ? 'rgba(255,255,255,.85)' : status === 'missed' ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.6)'
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.85rem', minWidth: 0 }}>
                  <span style={{ flexShrink: 0 }}>{icon}</span>
                  <span style={{ fontWeight: 600, color, flexShrink: 0, minWidth: 52 }}>{s.jour}</span>
                  <span style={{ color: 'var(--text-muted)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.titre}</span>
                  <span style={{ flexShrink: 0, fontSize: '.75rem', color: 'var(--text-muted)' }}>{s.duree_min}min</span>
                </div>
              )
            })}
          </div>
          {weekProgress.done === weekProgress.total && (
            <div style={{ marginTop: '.75rem', fontSize: '.82rem', color: '#34D399', fontWeight: 600 }}>
              ✅ Toutes les séances de la semaine effectuées !
            </div>
          )}
        </div>
      )}

      {/* Next session */}
      {nextSession && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '.75rem' }}>Prochaine séance</h3>
          <div className="card" style={{
            borderLeft: '4px solid var(--primary)',
            cursor: 'pointer',
            transition: 'transform .15s, box-shadow .15s'
          }}
            onClick={() => navigate('/app/plan')}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = ''}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.5rem' }}>
              <div>
                <div style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginBottom: '.2rem' }}>{nextSession.jour}</div>
                <h4>{nextSession.titre}</h4>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>{nextSession.duree_min} min</div>
                <div style={{ fontSize: '.75rem', color: 'var(--primary)', fontWeight: 600 }}>RPE {nextSession.rpe_cible}/10</div>
              </div>
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', padding: '.25rem .7rem',
              borderRadius: 99, background: 'var(--surface-2)', fontSize: '.75rem', fontWeight: 600
            }}>
              {nextSession.type}
            </div>
            {nextSession.notes_coach && (
              <p style={{ marginTop: '.75rem', fontSize: '.875rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                💬 Mon conseil : "{nextSession.notes_coach}"
              </p>
            )}
          </div>
        </div>
      )}

      {/* Race countdown */}
      {days !== null && days <= 60 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div className="card" style={{
            background: 'linear-gradient(135deg,#1A1A2E,#2D1B4E)',
            color: '#fff', textAlign: 'center'
          }}>
            <div style={{ fontSize: '.875rem', opacity: .7, marginBottom: '.5rem' }}>Compte à rebours</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '.25rem' }}>
              {days} jours
            </div>
            <div style={{ fontSize: '.9rem', opacity: .8 }}>
              avant ton {OBJECTIVE_LABELS[profile?.objective]}
            </div>
          </div>
        </div>
      )}

      {/* Pre-race analysis card (J-7) */}
      {rawDays !== null && rawDays >= 1 && rawDays <= 7 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div
            onClick={() => navigate('/app/pre-race')}
            style={{
              background: 'linear-gradient(135deg,#1A0933,#2D0E4E)',
              border: '1px solid rgba(139,47,201,.5)',
              borderRadius: 12, padding: '1.25rem',
              cursor: 'pointer', transition: 'transform .15s, box-shadow .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(139,47,201,.3)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
              <div style={{ fontSize: '2rem' }}>🎯</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.2rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '.95rem' }}>Ta course approche. Lis ton analyse</span>
                  <span style={{
                    background: '#E8237A', color: '#fff', borderRadius: 99,
                    padding: '.1rem .5rem', fontSize: '.7rem', fontWeight: 700,
                  }}>J-{rawDays}</span>
                </div>
                <div style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.6)' }}>
                  {preRaceAnalysis ? 'Bilan préparation, stratégie de course et conseils J-7 →' : 'Génère ton analyse de préparation →'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Post-race card */}
      {rawDays !== null && rawDays >= -1 && rawDays <= 0 && !hasPostRace && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div
            onClick={() => navigate('/app/post-race')}
            style={{
              background: 'linear-gradient(135deg,#0D2418,#0A3D1F)',
              border: '1px solid rgba(52,211,153,.3)',
              borderRadius: 12, padding: '1.25rem',
              cursor: 'pointer', transition: 'transform .15s, box-shadow .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(52,211,153,.2)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
              <div style={{ fontSize: '2rem' }}>🏅</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '.95rem', marginBottom: '.2rem' }}>
                  Comment s'est passée ta course ?
                </div>
                <div style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.6)' }}>
                  Partage ton chrono et obtiens une analyse personnalisée →
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analyse — trigger compact */}
      {analysis && (() => {
        const d    = analysis.analysis_data || {}
        const mood = d.mood || 'good'
        const MOOD = { fire: { icon: '🔥', color: '#F97316' }, good: { icon: '💪', color: '#10B981' }, ok: { icon: '👌', color: '#3B82F6' }, attention: { icon: '⚠️', color: '#F59E0B' } }
        const m    = MOOD[mood] || MOOD.good
        const sessions   = d.sessions || d.sessions_comments || []
        const doneReal   = sessions.filter(s => s.done).length
        const totalCount = sessions.length
        return (
          <div style={{ marginBottom: '1.5rem' }}>
            <button
              onClick={() => setAnalysisOpen(true)}
              style={{
                width: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
              }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '.875rem',
                background: `linear-gradient(135deg, ${m.color}14, rgba(255,255,255,.02))`,
                border: `1px solid ${m.color}35`, borderRadius: 14,
                padding: '.875rem 1.1rem',
                transition: 'transform .15s, box-shadow .15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 6px 24px ${m.color}22` }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>
                <div style={{ fontSize: '1.6rem', lineHeight: 1, flexShrink: 0 }}>{m.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: '.88rem', color: '#fff', marginBottom: '.15rem' }}>
                    Analyse de la semaine {analysis.week_number}
                  </div>
                  <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.4)' }}>
                    {doneReal}/{totalCount} séances effectuées
                  </div>
                </div>
                {d.rpe_moyen && (
                  <div style={{ textAlign: 'center', flexShrink: 0, background: rpeBg(d.rpe_moyen), border: `1px solid ${rpeColor(d.rpe_moyen)}30`, borderRadius: 8, padding: '.3rem .6rem' }}>
                    <div style={{ fontSize: '1rem', fontWeight: 900, color: rpeColor(d.rpe_moyen), lineHeight: 1 }}>{d.rpe_moyen}</div>
                    <div style={{ fontSize: '.58rem', color: 'rgba(255,255,255,.3)' }}>RPE</div>
                  </div>
                )}
                <div style={{ color: m.color, fontSize: '1rem', flexShrink: 0 }}>›</div>
              </div>
            </button>
          </div>
        )
      })()}

      {/* Modale analyse immersive */}
      {analysisOpen && analysis && (
        <WeeklyAnalysisModal analysis={analysis} onClose={() => setAnalysisOpen(false)} />
      )}

      {/* Analyse mensuelle — trigger compact */}
      {monthlyAnalysis && (() => {
        const d = monthlyAnalysis.analysis_data || {}
        return (
          <div style={{ marginBottom: '1.5rem' }}>
            <button
              onClick={() => setMonthlyOpen(true)}
              style={{ width: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '.875rem',
                background: 'linear-gradient(135deg, rgba(6,182,212,.12), rgba(255,255,255,.02))',
                border: '1px solid rgba(6,182,212,.3)', borderRadius: 14,
                padding: '.875rem 1.1rem',
                transition: 'transform .15s, box-shadow .15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(6,182,212,.18)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>
                <div style={{ fontSize: '1.5rem', lineHeight: 1, flexShrink: 0 }}>📅</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: '.88rem', color: '#22D3EE', marginBottom: '.15rem' }}>
                    Analyse du mois de {d.month || ''}
                  </div>
                  <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.4)' }}>
                    Analyse mensuelle disponible
                  </div>
                </div>
                <div style={{ color: '#22D3EE', fontSize: '1rem', flexShrink: 0 }}>›</div>
              </div>
            </button>
          </div>
        )
      })()}

      {/* Modale analyse mensuelle */}
      {monthlyOpen && monthlyAnalysis && (
        <MonthlyAnalysisModal analysis={monthlyAnalysis} onClose={() => setMonthlyOpen(false)} />
      )}

      {/* Monthly message from coach (from plan_data) */}
      {plan?.plan_data?.message_du_mois && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.75rem' }}>
            <h3>Message du mois</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/app/messages')}>
              Messages →
            </button>
          </div>
          <div className="card" style={{
            background: 'linear-gradient(135deg, rgba(139,47,201,.12), rgba(190,24,93,.08))',
            border: '1px solid rgba(139,47,201,.25)',
          }}>
            <div style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-start' }}>
              <img src="/Coach.JPG" alt="Alexis" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid rgba(139,47,201,.4)' }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '.875rem', marginBottom: '.375rem', color: 'var(--primary)' }}>Alexis · Message du mois</div>
                <p style={{ fontSize: '.9375rem', lineHeight: 1.65, fontStyle: 'italic' }}>{plan.plan_data.message_du_mois}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Last message from coach (fallback when no monthly message) */}
      {!plan?.plan_data?.message_du_mois && lastMessage && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.75rem' }}>
            <h3>Message de ton coach</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/app/messages')}>
              Voir tout →
            </button>
          </div>
          <div className="card">
            <div style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-start' }}>
              <img src="/Coach.JPG" alt="Alexis" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '.875rem', marginBottom: '.25rem' }}>Alexis</div>
                <p style={{ fontSize: '.9375rem', lineHeight: 1.6 }}>{lastMessage.content}</p>
                <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginTop: '.35rem' }}>
                  {new Date(lastMessage.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!plan && !loading && (
        <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
          <h3 style={{ marginBottom: '.5rem' }}>Ton plan est en préparation</h3>
          <p className="text-muted">
            J'analyse ton profil et prépare ton programme personnalisé.
            Il sera disponible dans les 24h.
          </p>
        </div>
      )}
    </div>
  )
}
