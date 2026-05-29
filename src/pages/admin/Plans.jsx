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

  return (
    <div className="modal-overlay center" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal center-modal" style={{ maxWidth: 780, width: '95vw' }}>
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
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap', marginBottom: '.35rem' }}>
                <span className="badge badge-primary">Semaine {currentWeek.numero}</span>
                <span className="badge badge-info" style={{ maxWidth: '100%', whiteSpace: 'normal', lineHeight: 1.3 }}>{currentWeek.phase}</span>
              </div>
              {currentWeek.charge && (() => {
                const parenIdx = currentWeek.charge.indexOf('(')
                const main = parenIdx > 0 ? currentWeek.charge.slice(0, parenIdx).trim() : currentWeek.charge
                const sub  = parenIdx > 0 ? currentWeek.charge.slice(parenIdx) : null
                return (
                  <div>
                    <span className="badge badge-warning">{main}</span>
                    {sub && <span style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginLeft: '.4rem' }}>{sub}</span>}
                  </div>
                )
              })()}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem', maxHeight: '50vh', overflowY: 'auto' }}>
              {currentWeek.seances?.map((session, si) => {
                const color = SESSION_TYPE_COLORS[session.type] || 'var(--primary)'
                const isEditing = editSession === `${activeWeek}-${si}`
                return (
                  <div key={si} className="card" style={{ borderLeft: `3px solid ${color}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: '.75rem', color, fontWeight: 700, marginBottom: '.2rem' }}>{session.type}</div>
                        {isEditing ? (
                          <input className="form-input" value={session.titre}
                            onChange={e => updateSession(activeWeek, si, 'titre', e.target.value)}
                            style={{ marginBottom: '.5rem' }} />
                        ) : (
                          <h4 style={{ marginBottom: '.2rem' }}>{session.titre}</h4>
                        )}
                        <div style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>
                          {session.jour} · {session.duree_min} min · RPE {session.rpe_cible}/10
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '.35rem', flexShrink: 0 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() =>
                          setEditSession(isEditing ? null : `${activeWeek}-${si}`)}>
                          {isEditing ? 'Fermer' : '✏️'}
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--error)', borderColor: 'rgba(239,68,68,.3)' }}
                          onClick={() => {
                            if (window.confirm(`Supprimer "${session.titre}" ?`)) {
                              deleteSession(activeWeek, si)
                            }
                          }}>
                          🗑️
                        </button>
                      </div>
                    </div>

                    {isEditing && (
                      <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                        {[
                          { label: 'Échauffement', field: 'echauffement' },
                          { label: 'Corps de séance', field: 'corps' },
                          { label: 'Retour au calme', field: 'retour_au_calme' },
                          { label: 'Notes coach', field: 'notes_coach' },
                          { label: 'Allures', field: 'allures' },
                        ].map(({ label, field }) => (
                          <div className="form-group" key={field}>
                            <label className="form-label">{label}</label>
                            <textarea className="form-textarea" style={{ minHeight: 70 }}
                              value={session[field] || ''}
                              onChange={e => updateSession(activeWeek, si, field, e.target.value)} />
                          </div>
                        ))}
                        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                          <div className="form-group" style={{ flex: 1, minWidth: 80 }}>
                            <label className="form-label">Durée (min)</label>
                            <input type="number" className="form-input" value={session.duree_min}
                              onChange={e => updateSession(activeWeek, si, 'duree_min', parseInt(e.target.value))} />
                          </div>
                          <div className="form-group" style={{ flex: 1, minWidth: 80 }}>
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
