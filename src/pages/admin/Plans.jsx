import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { SESSION_TYPE_COLORS } from '../../lib/utils'
import LoadingSpinner from '../../components/UI/LoadingSpinner'

function PlanModal({ plan, athlete, onClose, onActivate }) {
  const [planData, setPlanData]   = useState(plan.plan_data)
  const [activeWeek, setActiveWeek] = useState(0)
  const [editSession, setEditSession] = useState(null)
  const [saving, setSaving]       = useState(false)
  const [activating, setActivating] = useState(false)

  const weeks = planData?.semaines || []

  async function saveEdit() {
    setSaving(true)
    try {
      await supabase.from('training_plans').update({ plan_data: planData }).eq('id', plan.id)
      setEditSession(null)
    } finally {
      setSaving(false)
    }
  }

  async function activatePlan() {
    setActivating(true)
    try {
      // Archive any existing active plan for this athlete
      await supabase.from('training_plans')
        .update({ status: 'completed' })
        .eq('user_id', athlete.id)
        .eq('status', 'active')

      // Activate new plan
      await supabase.from('training_plans').update({
        status: 'active',
        activated_at: new Date().toISOString()
      }).eq('id', plan.id)

      // Send welcome message
      await supabase.from('messages').insert({
        user_id: athlete.id,
        sender: 'coach',
        content: `${athlete.first_name} ! 🎉 Ton nouveau plan d'entraînement est prêt, tu peux le consulter dans "Mon plan". Si t'as des questions hésite pas.`
      })
      onActivate()
    } finally {
      setActivating(false)
    }
  }

  function updateSession(weekIdx, sessionIdx, field, value) {
    setPlanData(d => {
      const updated = JSON.parse(JSON.stringify(d))
      updated.semaines[weekIdx].seances[sessionIdx][field] = value
      return updated
    })
  }

  async function deleteSession(weekIdx, sessionIdx) {
    const updated = JSON.parse(JSON.stringify(planData))
    updated.semaines[weekIdx].seances.splice(sessionIdx, 1)
    setPlanData(updated)
    setEditSession(null)
    await supabase.from('training_plans').update({ plan_data: updated }).eq('id', plan.id)
  }

  const currentWeek = weeks[activeWeek]
  const DAY_NAMES_GRID = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche']

  return (
    <div className="modal-overlay center" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal center-modal" style={{ maxWidth: 980, width: '98vw' }}>
        <style>{`
          @media (min-width: 900px) {
            .coach-plan-grid { display: grid !important; grid-template-columns: repeat(7,1fr) !important; gap: .5rem !important; align-items: start !important; }
            .coach-plan-grid-headers { display: grid !important; grid-template-columns: repeat(7,1fr); gap: .5rem; margin-bottom: .5rem; }
            .coach-plan-mobile-list { display: none !important; }
          }
          .coach-plan-grid-headers { display: none; }
          .coach-plan-grid { display: none; }
        `}</style>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <h3>Plan de {athlete?.first_name} {athlete?.last_name}</h3>
            <div style={{ fontSize: '.875rem', color: 'var(--text-muted)' }}>
              {weeks.length} semaines · Statut : <span style={{ fontWeight: 600 }}>{plan.status}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '.5rem' }}>
            {plan.status === 'pending' && (
              <button className="btn btn-primary btn-sm" onClick={activatePlan} disabled={activating}>
                {activating ? <><div className="spinner spinner-sm" /> Activation…</> : '✅ Valider et activer'}
              </button>
            )}
            <button className="btn-icon" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Week tabs */}
        <div style={{ display: 'flex', gap: '.35rem', overflowX: 'auto', paddingBottom: '.5rem', marginBottom: '1rem' }}>
          {weeks.map((w, i) => (
            <button key={i} onClick={() => setActiveWeek(i)}
              style={{ flexShrink: 0, padding: '.4rem .75rem', borderRadius: 99, border: 'none',
                whiteSpace: 'nowrap',
                background: activeWeek === i ? 'var(--gradient)' : 'var(--surface-2)',
                color: activeWeek === i ? '#fff' : 'var(--text-muted)',
                fontWeight: 600, fontSize: '.8rem', cursor: 'pointer', fontFamily: 'inherit' }}>
              S{w.numero}
            </button>
          ))}
        </div>

        {currentWeek && (
          <div>
            {/* ── Week header — same design as athlete interface ── */}
            {(() => {
              const seances = currentWeek.seances || []
              const nat   = seances.filter(s => String(s.type||'').toLowerCase().includes('natation')).length
              const vel   = seances.filter(s => String(s.type||'').toLowerCase().includes('vélo') || String(s.type||'').toLowerCase().includes('velo')).length
              const brk   = seances.filter(s => String(s.type||'').toLowerCase().includes('brique') || (s.id_seance||'').startsWith('BRK')).length
              const renfo = seances.filter(s => String(s.type||'').toLowerCase().includes('renforcement') || (s.id_seance||'').startsWith('RENFO')).length
              const course= seances.filter(s => { const t=String(s.type||'').toLowerCase(); return !t.includes('natation')&&!t.includes('vélo')&&!t.includes('velo')&&!t.includes('brique')&&!t.includes('renforcement')&&!s.est_course }).length
              const km = currentWeek.volume_total_km
              const chargeRaw = (currentWeek.charge||'').replace(/\s*\(S\d+\)/gi,'')
              const chargeShort = chargeRaw.split(/[—–(]/)[0].trim()
              const chargeSub = chargeRaw.includes('(') ? chargeRaw.slice(chargeRaw.indexOf('(')) : null
              const chargeColor = chargeShort.toLowerCase().includes('élevée')?'#F97316':chargeShort.toLowerCase().includes('modérée')?'#06B6D4':chargeShort.toLowerCase().includes('affûtage')?'#8B2FC9':chargeShort.toLowerCase().includes('récup')?'#6B7280':'#10B981'
              const chips = [
                {cond:course>0,count:course,icon:'🏃',label:'course', color:'#10B981'},
                {cond:nat>0,   count:nat,   icon:'🏊',label:'nage',   color:'#06B6D4'},
                {cond:vel>0,   count:vel,   icon:'🚴',label:'vélo',   color:'#F97316'},
                {cond:brk>0,   count:brk,   icon:'🔗',label:'brique', color:'#8B5CF6'},
                {cond:renfo>0, count:renfo, icon:'💪',label:'renfo',  color:'#EC4899'},
              ].filter(d=>d.cond)
              return (
                <div style={{ marginBottom:'1rem', borderRadius:14, overflow:'hidden', background:'linear-gradient(135deg,#1A1A2E,#2D1B4E)', color:'#fff' }}>
                  <div style={{ padding:'.875rem 1.125rem .625rem', display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'1rem' }}>
                    <div>
                      <div style={{ fontSize:'.68rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em', color:'rgba(255,255,255,.38)', marginBottom:'.2rem' }}>
                        Semaine {currentWeek.numero} · {currentWeek.phase?.replace(/^S\d+\s*[—–-]\s*/i,'').replace(/\s*\(S\d+\)/gi,'')}
                      </div>
                      {chargeSub && <div style={{ fontSize:'.66rem', color:'rgba(255,255,255,.3)' }}>{chargeSub}</div>}
                    </div>
                    <span style={{ flexShrink:0, padding:'.2rem .65rem', borderRadius:99, fontSize:'.68rem', fontWeight:700,
                      background:chargeColor+'25', border:`1px solid ${chargeColor}50`, color:chargeColor }}>{chargeShort}</span>
                  </div>
                  <div style={{ padding:'.375rem 1.125rem .625rem', display:'flex', flexWrap:'wrap', gap:'.4rem', alignItems:'center', borderTop:'1px solid rgba(255,255,255,.06)' }}>
                    {chips.map(d => (
                      <div key={d.label} style={{ display:'flex', alignItems:'center', gap:'.28rem', background:d.color+'18', border:`1px solid ${d.color}35`, borderRadius:99, padding:'.2rem .6rem' }}>
                        <span style={{ fontSize:'.78rem' }}>{d.icon}</span>
                        <span style={{ fontWeight:800, fontSize:'.82rem', color:d.color }}>{d.count}</span>
                        <span style={{ fontSize:'.68rem', color:'rgba(255,255,255,.35)' }}>{d.label}</span>
                      </div>
                    ))}
                    {km > 0 && <span style={{ marginLeft:'auto', fontSize:'.72rem', color:'rgba(255,255,255,.4)' }}>📍 <strong style={{ color:'#fff' }}>{km} km</strong></span>}
                  </div>
                </div>
              )
            })()}

            {/* Desktop day headers */}
            <div className="coach-plan-grid-headers">
              {['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(d => (
                <div key={d} style={{ textAlign:'center', fontSize:'.66rem', fontWeight:800, textTransform:'uppercase',
                  letterSpacing:'.08em', color:'var(--text-muted)', paddingBottom:'.4rem',
                  borderBottom:'1px solid var(--border)' }}>{d}</div>
              ))}
            </div>

            {/* Desktop: 7-column grid */}
            <div className="coach-plan-grid">
              {DAY_NAMES_GRID.map(day => {
                const daySessions = (currentWeek.seances || [])
                  .map((s, si) => ({ ...s, _si: si }))
                  .filter(s => s.jour === day)
                return (
                  <div key={day} style={{ display:'flex', flexDirection:'column', gap:'.4rem' }}>
                    {daySessions.length === 0 ? (
                      <div style={{ minHeight:56, display:'flex', alignItems:'center', justifyContent:'center',
                        border:'1px dashed rgba(255,255,255,.07)', borderRadius:10,
                        fontSize:'.68rem', color:'rgba(255,255,255,.2)', fontStyle:'italic' }}>
                        Repos
                      </div>
                    ) : daySessions.map(session => {
                      const si = session._si
                      const color = SESSION_TYPE_COLORS[session.type] || 'var(--primary)'
                      const isEditing = editSession === `${activeWeek}-${si}`
                      return (
                        <div key={si} style={{
                          borderRadius: 8, overflow: 'hidden',
                          border: `1px solid var(--border)`,
                          background: 'var(--surface-2)',
                          minWidth: 0,
                        }}>
                          <div style={{ borderLeft:`3px solid ${color}`, padding:'.55rem .65rem' }}>
                            <div style={{ fontSize:'.65rem', fontWeight:700, color, marginBottom:'.2rem',
                              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                              {session.type}
                            </div>
                            <div style={{ fontSize:'.78rem', fontWeight:700, lineHeight:1.2, marginBottom:'.2rem',
                              overflow:'hidden', textOverflow:'ellipsis',
                              display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                              {session.titre}
                            </div>
                            <div style={{ fontSize:'.68rem', color:'var(--text-muted)', marginBottom:'.35rem' }}>
                              {session.duree_min} min · RPE {session.rpe_cible}
                            </div>
                            <div style={{ display:'flex', gap:'.25rem', justifyContent:'flex-end' }}>
                              <button className="btn btn-ghost btn-sm" style={{ padding:'.2rem .4rem', fontSize:'.72rem' }}
                                onClick={() => setEditSession(isEditing ? null : `${activeWeek}-${si}`)}>
                                {isEditing ? '✕' : '✏️'}
                              </button>
                              <button className="btn btn-ghost btn-sm" style={{ padding:'.2rem .4rem', fontSize:'.72rem', color:'var(--error)', borderColor:'rgba(239,68,68,.3)' }}
                                onClick={() => window.confirm(`Supprimer "${session.titre}" ?`) && deleteSession(activeWeek, si)}>
                                🗑️
                              </button>
                            </div>
                          </div>
                          {isEditing && (
                            <div style={{ padding:'.75rem', borderTop:'1px solid var(--border)', display:'flex', flexDirection:'column', gap:'.5rem' }}>
                              {[
                                { label:'Échauffement', field:'echauffement' },
                                { label:'Corps', field:'corps' },
                                { label:'Retour au calme', field:'retour_au_calme' },
                                { label:'Notes coach', field:'notes_coach' },
                              ].map(({ label, field }) => (
                                <div className="form-group" key={field} style={{ marginBottom:0 }}>
                                  <label className="form-label" style={{ fontSize:'.68rem' }}>{label}</label>
                                  <textarea className="form-textarea" style={{ minHeight:50, fontSize:'.78rem' }}
                                    value={session[field] || ''}
                                    onChange={e => updateSession(activeWeek, si, field, e.target.value)} />
                                </div>
                              ))}
                              <div style={{ display:'flex', gap:'.35rem' }}>
                                <div className="form-group" style={{ flex:1, marginBottom:0 }}>
                                  <label className="form-label" style={{ fontSize:'.68rem' }}>Durée (min)</label>
                                  <input type="number" className="form-input" style={{ fontSize:'.78rem' }} value={session.duree_min}
                                    onChange={e => updateSession(activeWeek, si, 'duree_min', parseInt(e.target.value))} />
                                </div>
                                <div className="form-group" style={{ flex:1, marginBottom:0 }}>
                                  <label className="form-label" style={{ fontSize:'.68rem' }}>RPE cible</label>
                                  <input type="number" min={1} max={10} className="form-input" style={{ fontSize:'.78rem' }} value={session.rpe_cible}
                                    onChange={e => updateSession(activeWeek, si, 'rpe_cible', parseInt(e.target.value))} />
                                </div>
                              </div>
                              <button className="btn btn-primary btn-sm" disabled={saving} onClick={saveEdit}>
                                {saving ? '…' : '💾'}
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>

            {/* Mobile: flat vertical list (same iOS-style cards as athlete interface) */}
            <div className="coach-plan-mobile-list" style={{ display:'flex', flexDirection:'column', gap:'.5rem' }}>
              {currentWeek.seances?.map((session, si) => {
                const color = SESSION_TYPE_COLORS[session.type] || 'var(--primary)'
                const isRenfo = (session.type||'').toLowerCase().includes('renforcement') || (session.id_seance||'').startsWith('RENFO')
                const isEditing = editSession === `${activeWeek}-${si}`
                return (
                  <div key={si} style={{
                    borderRadius: 14, overflow: 'hidden',
                    border: isRenfo ? `1.5px solid ${color}45` : '1px solid var(--border)',
                    background: 'var(--surface-2)',
                  }}>
                    {/* Color accent strip top */}
                    <div style={{ height: 4, background: `linear-gradient(90deg, ${color}, ${color}88)` }} />
                    <div style={{ padding:'.75rem 1rem', display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'.75rem' }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'.4rem', marginBottom:'.3rem', flexWrap:'wrap' }}>
                          <span style={{ fontSize:'.68rem', fontWeight:700, color, background:color+'18', padding:'.12rem .5rem', borderRadius:99, whiteSpace:'nowrap' }}>
                            {session.type}
                          </span>
                          <span style={{ fontSize:'.72rem', color:'var(--text-muted)' }}>{session.jour}</span>
                        </div>
                        {isEditing ? (
                          <input className="form-input" value={session.titre}
                            onChange={e => updateSession(activeWeek, si, 'titre', e.target.value)}
                            style={{ marginBottom:'.25rem', fontSize:'.875rem' }} />
                        ) : (
                          <div style={{ fontWeight:700, fontSize:'.9rem', lineHeight:1.3, marginBottom:'.25rem',
                            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {session.titre}
                          </div>
                        )}
                        <div style={{ fontSize:'.75rem', color:'var(--text-muted)', display:'flex', gap:'.6rem' }}>
                          <span>⏱ {session.duree_min} min</span>
                          {session.rpe_cible && <span>💪 RPE {session.rpe_cible}</span>}
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:'.3rem', flexShrink:0 }}>
                        <button className="btn btn-ghost btn-sm" style={{ padding:'.25rem .5rem', fontSize:'.78rem' }}
                          onClick={() => setEditSession(isEditing ? null : `${activeWeek}-${si}`)}>
                          {isEditing ? '✕' : '✏️'}
                        </button>
                        <button className="btn btn-ghost btn-sm" style={{ padding:'.25rem .5rem', fontSize:'.78rem', color:'var(--error)', borderColor:'rgba(239,68,68,.3)' }}
                          onClick={() => window.confirm(`Supprimer "${session.titre}" ?`) && deleteSession(activeWeek, si)}>
                          🗑️
                        </button>
                      </div>
                    </div>

                    {isEditing && (
                      <div style={{ padding:'0 1rem 1rem', display:'flex', flexDirection:'column', gap:'.75rem' }}>
                        {[
                          { label:'Échauffement', field:'echauffement' },
                          { label:'Corps de séance', field:'corps' },
                          { label:'Retour au calme', field:'retour_au_calme' },
                          { label:'Notes coach', field:'notes_coach' },
                          { label:'Allures', field:'allures' },
                        ].map(({ label, field }) => (
                          <div className="form-group" key={field}>
                            <label className="form-label">{label}</label>
                            <textarea className="form-textarea" style={{ minHeight:70 }}
                              value={session[field] || ''}
                              onChange={e => updateSession(activeWeek, si, field, e.target.value)} />
                          </div>
                        ))}
                        <div style={{ display:'flex', gap:'.5rem', flexWrap:'wrap' }}>
                          <div className="form-group" style={{ flex:1, minWidth:80 }}>
                            <label className="form-label">Durée (min)</label>
                            <input type="number" className="form-input" value={session.duree_min}
                              onChange={e => updateSession(activeWeek, si, 'duree_min', parseInt(e.target.value))} />
                          </div>
                          <div className="form-group" style={{ flex:1, minWidth:80 }}>
                            <label className="form-label">RPE cible</label>
                            <input type="number" min={1} max={10} className="form-input" value={session.rpe_cible}
                              onChange={e => updateSession(activeWeek, si, 'rpe_cible', parseInt(e.target.value))} />
                          </div>
                        </div>
                        <button className="btn btn-primary btn-sm" disabled={saving} onClick={saveEdit}>
                          {saving ? 'Sauvegarde…' : '💾 Sauvegarder'}
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminPlans() {
  const [plans,      setPlans]      = useState([])
  const [athletes,   setAthletes]   = useState({})
  const [modal,      setModal]      = useState(null)
  const [filter,     setFilter]     = useState('pending')
  const [loading,    setLoading]    = useState(true)
  const [allAthletes,    setAllAthletes]    = useState([])
  const [generating,     setGenerating]     = useState(null)
  const [showGenForm,    setShowGenForm]    = useState(false)
  const [selectedAthlete, setSelectedAthlete] = useState('')
  const [confirmDelPlan, setConfirmDelPlan] = useState(null)
  const [deletingPlan,   setDeletingPlan]   = useState(false)

  useEffect(() => { loadPlans(); loadAllAthletes() }, [])

  async function deletePlan(plan) {
    setDeletingPlan(true)
    try {
      const { error } = await supabase.from('training_plans').delete().eq('id', plan.id)
      if (error) throw error
      setConfirmDelPlan(null)
      await loadPlans()
    } catch (err) {
      alert('Erreur suppression : ' + err.message)
    } finally {
      setDeletingPlan(false)
    }
  }

  async function loadAllAthletes() {
    const { data } = await supabase.from('profiles').select('*').eq('role', 'athlete').eq('subscription_status', 'active')
    setAllAthletes(data || [])
  }

  async function generatePlan() {
    const athlete = allAthletes.find(a => a.id === selectedAthlete)
    if (!athlete) return
    setGenerating(athlete.id)
    try {
      const res  = await fetch('/api/plans/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: athlete.id, profile: athlete })
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error)
      setShowGenForm(false)
      setSelectedAthlete('')
      await loadPlans()
      setFilter('pending')
    } catch (err) {
      alert('Erreur : ' + err.message)
    } finally {
      setGenerating(null)
    }
  }

  async function loadPlans() {
    setLoading(true)
    try {
      const { data: plans } = await supabase
        .from('training_plans').select('*').order('created_at', { ascending: false })
      const userIds = [...new Set((plans || []).map(p => p.user_id))]
      const { data: profiles } = await supabase
        .from('profiles').select('id, first_name, last_name, email').in('id', userIds)
      const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]))
      setPlans(plans || [])
      setAthletes(profileMap)
    } finally {
      setLoading(false)
    }
  }

  const filtered = plans.filter(p => filter === 'all' || p.status === filter)

  if (loading) return <LoadingSpinner fullPage />

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 className="page-heading">Plans d'entraînement</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowGenForm(v => !v)}>
          + Générer un plan
        </button>
      </div>

      {showGenForm && (
        <div className="card" style={{ marginBottom: '1.25rem', background: 'var(--surface-2)' }}>
          <h4 style={{ marginBottom: '1rem' }}>🤖 Générer un plan personnalisé</h4>
          <div style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
              <label className="form-label">Athlète</label>
              <select className="form-input" value={selectedAthlete} onChange={e => setSelectedAthlete(e.target.value)}>
                <option value="">-- Choisir un athlète --</option>
                {allAthletes.map(a => (
                  <option key={a.id} value={a.id}>{a.first_name} {a.last_name} ({a.email})</option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary" onClick={generatePlan}
              disabled={!selectedAthlete || generating}>
              {generating ? <><div className="spinner spinner-sm" /> Génération… (30–60s)</> : 'Lancer la génération'}
            </button>
          </div>
          <p className="text-muted text-sm" style={{ marginTop: '.75rem' }}>
            Le plan sera généré en fonction du profil complet de l'athlète et apparaîtra ici en statut "En attente".
          </p>
        </div>
      )}

      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {[
          { v: 'pending',   l: `En attente (${plans.filter(p => p.status === 'pending').length})` },
          { v: 'active',    l: 'Actifs' },
          { v: 'completed', l: 'Terminés' },
          { v: 'all',       l: 'Tous' },
        ].map(f => (
          <button key={f.v} className={`btn btn-sm ${filter === f.v ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter(f.v)}>{f.l}</button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filtered.map(plan => {
          const athlete = athletes[plan.user_id]
          const weeks   = plan.plan_data?.semaines?.length || 0
          return (
            <div key={plan.id} className="card"
              style={{ borderLeft: plan.status === 'pending' ? '4px solid var(--warning)' : '4px solid var(--success)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '.75rem' }}>
                {/* Athlete info + badges */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '.75rem', minWidth: 0, flex: 1 }}>
                  <div className="chat-avatar" style={{ flexShrink: 0, marginTop: '.1rem' }}>{athlete?.first_name?.[0]?.toUpperCase()}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{athlete?.first_name} {athlete?.last_name}</div>
                    <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{athlete?.email}</div>
                    <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap', marginTop: '.4rem', alignItems: 'center' }}>
                      <span className="badge badge-info">{weeks} sem.</span>
                      <span className={`badge ${plan.status === 'pending' ? 'badge-warning' : plan.status === 'active' ? 'badge-success' : 'badge-info'}`}>
                        {plan.status === 'pending' ? '⏳ Attente' : plan.status === 'active' ? '✅ Actif' : plan.status}
                      </span>
                      <span style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>
                        {new Date(plan.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Action buttons — compact, never overflow */}
                <div style={{ display: 'flex', gap: '.4rem', flexShrink: 0, alignItems: 'center' }}>
                  <button className="btn btn-primary btn-sm"
                    style={{ whiteSpace: 'nowrap' }}
                    onClick={() => setModal({ plan, athlete })}>
                    {plan.status === 'pending' ? '📋 Réviser' : '📋 Voir'}
                  </button>
                  {plan.status === 'pending' && (
                    <button className="btn btn-sm" onClick={() => setConfirmDelPlan({ plan, athlete })}
                      style={{ background: 'var(--error)', color: '#fff', border: 'none', padding: '.35rem .6rem' }}>
                      🗑
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
            <p className="text-muted">Aucun plan dans cette catégorie.</p>
          </div>
        )}
      </div>

      {modal && (
        <PlanModal
          plan={modal.plan}
          athlete={modal.athlete}
          onClose={() => setModal(null)}
          onActivate={() => { setModal(null); loadPlans() }}
        />
      )}

      {confirmDelPlan && (
        <div className="modal-overlay center" onClick={e => e.target === e.currentTarget && setConfirmDelPlan(null)}>
          <div className="modal center-modal" style={{ maxWidth: 420 }}>
            <h3 style={{ marginBottom: '.75rem' }}>Supprimer ce plan ?</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Supprimer le plan en attente de <strong>{confirmDelPlan.athlete?.first_name} {confirmDelPlan.athlete?.last_name}</strong> ?
              Tu pourras en regénérer un nouveau depuis la fiche athlète.
            </p>
            <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDelPlan(null)}>Annuler</button>
              <button className="btn btn-sm" disabled={deletingPlan}
                style={{ background: 'var(--error)', color: '#fff', border: 'none' }}
                onClick={() => deletePlan(confirmDelPlan.plan)}>
                {deletingPlan ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
