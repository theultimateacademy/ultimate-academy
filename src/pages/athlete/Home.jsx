import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { api } from '../../lib/api'
import { daysUntil, OBJECTIVE_LABELS, getPlanStartMonday, getPlanWeeksElapsed } from '../../lib/utils'
import LoadingSpinner from '../../components/UI/LoadingSpinner'

export default function AthleteHome() {
  const { profile } = useAuth()
  const navigate    = useNavigate()
  const [plan,          setPlan]          = useState(null)
  const [nextSession,   setNextSession]   = useState(null)
  const [weekProgress,  setWeekProgress]  = useState({ done: 0, total: 0 })
  const [lastMessage,   setLastMessage]   = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [analysis,      setAnalysis]      = useState(null)
  const [preRaceAnalysis, setPreRaceAnalysis] = useState(null)
  const [hasPostRace,     setHasPostRace]     = useState(false)

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
        supabase.from('weekly_analyses').select('*').eq('user_id', profile.id).eq('status', 'sent').order('created_at', { ascending: false }).limit(1)
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
      setAnalysis(analyses?.[0] || null)

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

      {/* Latest analysis — rich card */}
      {analysis && (() => {
        const d = analysis.analysis_data || {}
        const intro = analysis.coach_message || d.intro || ''
        const sessions = d.sessions_comments || []
        const conseil  = d.conseil || d.ajustement_semaine_suivante || ''
        const rpe      = d.rpe_moyen
        const mood     = d.mood || 'good'
        const moodMap  = { fire: { icon: '🔥', color: '#F97316', label: 'En feu !' }, good: { icon: '💪', color: '#10B981', label: 'Bonne semaine' }, ok: { icon: '👌', color: '#3B82F6', label: 'Semaine solide' }, attention: { icon: '⚠️', color: '#F59E0B', label: 'À surveiller' } }
        const moodMeta = moodMap[mood] || moodMap.good
        const rpeColor = r => !r ? '#fff' : r >= 8 ? '#EF4444' : r >= 6 ? '#F59E0B' : '#10B981'
        return (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.75rem' }}>
              <h3>Analyse de ta semaine</h3>
              <span style={{ fontSize: '.7rem', background: moodMeta.color + '20', color: moodMeta.color, border: `1px solid ${moodMeta.color}40`, borderRadius: 99, padding: '.15rem .6rem', fontWeight: 700 }}>
                {moodMeta.icon} {moodMeta.label}
              </span>
            </div>

            <div style={{ background: 'linear-gradient(135deg, rgba(139,47,201,.09), rgba(232,35,122,.04))', border: '1px solid rgba(139,47,201,.22)', borderRadius: 16, overflow: 'hidden' }}>

              {/* Coach intro */}
              <div style={{ padding: '1.2rem 1.25rem 1rem', borderBottom: sessions.length || conseil || rpe ? '1px solid rgba(255,255,255,.06)' : 'none' }}>
                <div style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-start' }}>
                  <img src="/Coach.JPG" alt="Alexis" style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid rgba(139,47,201,.45)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.35rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '.8rem', color: '#C084FC' }}>Alexis</span>
                      <span style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.3)', background: 'rgba(255,255,255,.06)', borderRadius: 99, padding: '.08rem .5rem' }}>
                        Semaine {analysis.week_number}
                      </span>
                    </div>
                    <p style={{ fontSize: '.9375rem', lineHeight: 1.65, margin: 0 }}>{intro}</p>
                  </div>
                </div>
              </div>

              {/* Session comments */}
              {sessions.length > 0 && (
                <div style={{ padding: '.9rem 1.25rem', borderBottom: conseil || rpe ? '1px solid rgba(255,255,255,.06)' : 'none' }}>
                  <div style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.09em', color: 'rgba(255,255,255,.3)', marginBottom: '.6rem' }}>Ce que j'en pense</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.45rem' }}>
                    {sessions.map((s, i) => (
                      <div key={i} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 9, padding: '.55rem .875rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '.78rem', color: 'rgba(255,255,255,.9)', marginBottom: '.15rem' }}>{s.titre}</div>
                        <div style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.65)', lineHeight: 1.5 }}>{s.note}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats row */}
              {rpe && (
                <div style={{ padding: '.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: conseil ? '1px solid rgba(255,255,255,.06)' : 'none' }}>
                  <div style={{ textAlign: 'center', minWidth: 52 }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 900, lineHeight: 1, color: rpeColor(rpe) }}>{rpe}</div>
                    <div style={{ fontSize: '.62rem', color: 'rgba(255,255,255,.35)', marginTop: '.15rem' }}>RPE moy.</div>
                  </div>
                  <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 3, width: `${Math.min(rpe * 10, 100)}%`, background: `linear-gradient(90deg, #10B981, ${rpeColor(rpe)})`, transition: 'width .6s ease' }} />
                  </div>
                  <div style={{ fontSize: '.72rem', color: rpeColor(rpe), fontWeight: 700, minWidth: 40, textAlign: 'right' }}>
                    {rpe < 5 ? 'Facile' : rpe < 7 ? 'Modéré' : rpe < 9 ? 'Intense' : 'Max'}
                  </div>
                </div>
              )}

              {/* Conseil */}
              {conseil && (
                <div style={{ padding: '.9rem 1.25rem', background: 'rgba(139,47,201,.08)' }}>
                  <div style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.09em', color: '#C084FC', marginBottom: '.35rem' }}>Focus semaine prochaine</div>
                  <p style={{ fontSize: '.875rem', lineHeight: 1.6, margin: 0, color: 'rgba(255,255,255,.85)' }}>{conseil}</p>
                </div>
              )}
            </div>

            <div style={{ textAlign: 'right', marginTop: '.4rem', fontSize: '.7rem', color: 'rgba(255,255,255,.25)' }}>
              {analysis.sent_at && new Date(analysis.sent_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
            </div>
          </div>
        )
      })()}

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
