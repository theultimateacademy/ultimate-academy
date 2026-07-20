import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { SESSION_TYPE_COLORS } from '../../lib/utils'

const DAY_NAMES = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const SPORT_LABELS = { running: '🏃 Course', trail: '⛰️ Trail', triathlon: '🏊 Triathlon' }

function firstMondayOfNextMonth() {
  const now = new Date()
  const first = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const day = first.getDay() // 0=dim, 1=lun…
  const diff = day === 1 ? 0 : day === 0 ? 1 : 8 - day
  first.setDate(first.getDate() + diff)
  first.setHours(0, 0, 0, 0)
  return first
}

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function fmtDay(date) {
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function fmtWeekRange(monday) {
  const sunday = addDays(monday, 6)
  return `${fmtDay(monday)} – ${fmtDay(sunday)}`
}

export default function ManualPlanBuilder() {
  const navigate = useNavigate()
  const [athletes,        setAthletes]        = useState([])
  const [selectedAthlete, setSelectedAthlete] = useState('')
  const [sessions,        setSessions]        = useState([])
  const [search,          setSearch]          = useState('')
  const [sportFilter,     setSportFilter]     = useState('all')
  const [loadingSessions, setLoadingSessions] = useState(true)

  // Plan state: 4 weeks × 7 days, each cell = array of session objects
  const [startMonday] = useState(() => firstMondayOfNextMonth())
  const [plan, setPlan] = useState(() => Array.from({ length: 4 }, () => Array.from({ length: 7 }, () => [])))

  // Drag state
  const [dragging,   setDragging]   = useState(null)   // { session } from library
  const [dragOver,   setDragOver]   = useState(null)    // { week, day }
  const [savingPlan, setSavingPlan] = useState(false)
  const [savedMsg,   setSavedMsg]   = useState('')

  useEffect(() => {
    supabase.from('profiles').select('id, first_name, last_name, email, objective, sport_type')
      .eq('role', 'athlete').eq('subscription_status', 'active')
      .then(({ data }) => setAthletes(data || []))

    supabase.from('session_library').select('*').order('code')
      .then(({ data }) => { setSessions(data || []); setLoadingSessions(false) })
  }, [])

  const athlete = athletes.find(a => a.id === selectedAthlete)
  const isTri = ['tri_sprint', 'tri_olympic', 'tri_half', 'tri_ironman'].includes(athlete?.objective)

  const filteredSessions = sessions.filter(s => {
    const sp = s.sport || 'running'
    if (sportFilter !== 'all' && sp !== sportFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return s.code?.toLowerCase().includes(q) || s.name?.toLowerCase().includes(q)
    }
    return true
  })

  // ── Drag handlers ────────────────────────────────────────────
  function onDragStart(e, session) {
    setDragging(session)
    e.dataTransfer.effectAllowed = 'copy'
  }

  function onDragOver(e, week, day) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setDragOver({ week, day })
  }

  function onDrop(e, week, day) {
    e.preventDefault()
    if (!dragging) return
    setPlan(prev => {
      const next = prev.map(w => w.map(d => [...d]))
      next[week][day] = [...next[week][day], { ...dragging, _uid: Date.now() + Math.random() }]
      return next
    })
    setDragging(null)
    setDragOver(null)
  }

  function removeSession(week, day, idx) {
    setPlan(prev => {
      const next = prev.map(w => w.map(d => [...d]))
      next[week][day].splice(idx, 1)
      return next
    })
  }

  // ── Save plan ────────────────────────────────────────────────
  async function savePlan() {
    if (!selectedAthlete) return alert('Choisis un athlète')
    setSavingPlan(true)
    try {
      const semaines = plan.map((week, wi) => {
        const monday = addDays(startMonday, wi * 7)
        const seances = []
        week.forEach((daySessions, di) => {
          daySessions.forEach(s => {
            seances.push({
              jour:              DAY_NAMES[di],
              type:              s.type || s.sport || 'Endurance fondamentale',
              titre:             s.name || s.code,
              duree_min:         s.duration_min || 0,
              distance_km:       s.distance_km || null,
              intensite:         s.intensity || '',
              echauffement:      s.warmup || '',
              corps:             s.main_set || '',
              retour_au_calme:   s.cooldown || '',
              notes_coach:       s.coach_notes || '',
              rpe_cible:         s.rpe_target || null,
              allures:           s.paces || [],
              id_seance:         s.code,
            })
          })
        })
        return {
          numero:  wi + 1,
          phase:   `S${wi + 1}`,
          charge:  'Modérée',
          date_debut: monday.toISOString().split('T')[0],
          seances,
        }
      })

      const plan_data = { semaines, nb_semaines: 4 }
      const { error } = await supabase.from('training_plans').insert({
        user_id:    selectedAthlete,
        plan_data,
        status:     'pending',
        created_at: new Date().toISOString(),
      })
      if (error) throw error
      setSavedMsg('Plan sauvegardé en statut "En attente" ✓')
      setTimeout(() => navigate('/admin/plans'), 1800)
    } catch (err) {
      alert('Erreur : ' + err.message)
    } finally {
      setSavingPlan(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────
  const panelBase = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    overflow: 'hidden',
  }

  return (
    <div className="page" style={{ padding: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/admin/plans')} className="btn btn-ghost btn-sm">← Retour</button>
        <h2 className="page-heading" style={{ margin: 0, flex: 1 }}>Créer un plan manuellement</h2>

        <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select className="form-input" style={{ minWidth: 220, fontSize: '.875rem' }}
            value={selectedAthlete} onChange={e => setSelectedAthlete(e.target.value)}>
            <option value="">-- Choisir un athlète --</option>
            {athletes.map(a => (
              <option key={a.id} value={a.id}>{a.first_name} {a.last_name}</option>
            ))}
          </select>
          <button className="btn btn-primary btn-sm" onClick={savePlan} disabled={savingPlan || !selectedAthlete}>
            {savingPlan ? '…' : '✅ Sauvegarder le plan'}
          </button>
          {savedMsg && <span style={{ color: '#10B981', fontSize: '.85rem', fontWeight: 700 }}>{savedMsg}</span>}
        </div>
      </div>

      {/* Main layout: calendar left, library right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1rem', alignItems: 'start' }}>

        {/* ── CALENDRIER ── */}
        <div style={panelBase}>
          <div style={{ padding: '.75rem 1rem', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: '.875rem' }}>
            📅 {fmtDay(startMonday)} → {fmtDay(addDays(startMonday, 27))}
            {athlete && <span style={{ marginLeft: '.75rem', color: 'var(--primary)', fontWeight: 600 }}>— {athlete.first_name} {athlete.last_name}</span>}
          </div>

          <div style={{ overflowX: 'auto' }}>
            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '72px repeat(7, 1fr)', borderBottom: '1px solid var(--border)', padding: '0 .5rem' }}>
              <div />
              {DAY_NAMES.map(d => (
                <div key={d} style={{ padding: '.5rem .25rem', textAlign: 'center', fontSize: '.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--text-muted)' }}>{d}</div>
              ))}
            </div>

            {/* 4 weeks */}
            {plan.map((week, wi) => {
              const monday = addDays(startMonday, wi * 7)
              return (
                <div key={wi} style={{ display: 'grid', gridTemplateColumns: '72px repeat(7, 1fr)', borderBottom: wi < 3 ? '1px solid var(--border)' : 'none', minHeight: 90 }}>
                  {/* Week label */}
                  <div style={{ padding: '.5rem .4rem', fontSize: '.65rem', fontWeight: 700, color: 'var(--text-muted)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: '.15rem' }}>
                    <span>S{wi + 1}</span>
                    <span style={{ fontWeight: 400, fontSize: '.6rem' }}>{fmtWeekRange(monday)}</span>
                  </div>

                  {/* 7 day cells */}
                  {week.map((daySessions, di) => {
                    const isOver = dragOver?.week === wi && dragOver?.day === di
                    return (
                      <div key={di}
                        onDragOver={e => onDragOver(e, wi, di)}
                        onDragLeave={() => setDragOver(null)}
                        onDrop={e => onDrop(e, wi, di)}
                        style={{
                          borderLeft: '1px solid var(--border)',
                          padding: '.3rem',
                          minHeight: 90,
                          background: isOver ? 'rgba(139,47,201,.12)' : 'transparent',
                          transition: 'background .1s',
                          display: 'flex', flexDirection: 'column', gap: '.25rem',
                        }}>
                        {/* Date badge */}
                        <div style={{ fontSize: '.58rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '.1rem' }}>
                          {fmtDay(addDays(monday, di))}
                        </div>

                        {daySessions.length === 0 && (
                          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: `1px dashed ${isOver ? 'rgba(139,47,201,.5)' : 'rgba(255,255,255,.08)'}`,
                            borderRadius: 6, fontSize: '.58rem', color: isOver ? 'rgba(139,47,201,.8)' : 'rgba(255,255,255,.18)' }}>
                            {isOver ? '↓ Déposer' : 'Repos'}
                          </div>
                        )}

                        {daySessions.map((s, si) => {
                          const color = SESSION_TYPE_COLORS[s.type] || SESSION_TYPE_COLORS[s.sport] || 'var(--primary)'
                          return (
                            <div key={si} style={{ borderRadius: 5, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--surface-2)', position: 'relative' }}>
                              <div style={{ borderLeft: `3px solid ${color}`, padding: '.3rem .35rem' }}>
                                <div style={{ fontSize: '.58rem', fontWeight: 700, color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {s.code}
                                </div>
                                <div style={{ fontSize: '.62rem', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {s.name}
                                </div>
                              </div>
                              <button onClick={() => removeSession(wi, di, si)}
                                style={{ position: 'absolute', top: 2, right: 2, background: 'none', border: 'none', cursor: 'pointer', fontSize: '.6rem', color: 'rgba(255,255,255,.3)', padding: '1px 3px', lineHeight: 1 }}
                                title="Retirer">✕</button>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── BIBLIOTHÈQUE ── */}
        <div style={{ ...panelBase, position: 'sticky', top: 16, maxHeight: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '.75rem', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: '.875rem' }}>
            📚 Bibliothèque
          </div>

          {/* Filters */}
          <div style={{ padding: '.5rem .75rem', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
            <input className="form-input" style={{ fontSize: '.8rem', padding: '.4rem .6rem' }}
              placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} />
            <select className="form-input" style={{ fontSize: '.78rem', padding: '.35rem .5rem' }}
              value={sportFilter} onChange={e => setSportFilter(e.target.value)}>
              <option value="all">Tous les sports</option>
              {Object.entries(SPORT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>

          {/* Session list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '.5rem' }}>
            {loadingSessions ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '.8rem' }}>Chargement…</div>
            ) : filteredSessions.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '.8rem' }}>Aucune séance</div>
            ) : filteredSessions.map(s => {
              const color = SESSION_TYPE_COLORS[s.type] || SESSION_TYPE_COLORS[s.sport] || 'var(--primary)'
              return (
                <div key={s.id || s.code}
                  draggable
                  onDragStart={e => onDragStart(e, s)}
                  style={{
                    borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface-2)',
                    marginBottom: '.35rem', cursor: 'grab', overflow: 'hidden',
                    opacity: dragging?.id === s.id ? .5 : 1,
                    userSelect: 'none',
                  }}>
                  <div style={{ borderLeft: `3px solid ${color}`, padding: '.4rem .5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.3rem' }}>
                      <span style={{ fontSize: '.62rem', fontWeight: 800, color, flexShrink: 0 }}>{s.code}</span>
                      {s.duration_min && <span style={{ fontSize: '.58rem', color: 'var(--text-muted)' }}>{s.duration_min} min</span>}
                    </div>
                    <div style={{ fontSize: '.68rem', fontWeight: 600, lineHeight: 1.3, marginTop: '.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.name}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
