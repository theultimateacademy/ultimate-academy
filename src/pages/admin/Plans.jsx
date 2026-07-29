import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { SESSION_TYPE_COLORS } from '../../lib/utils'
import { adminFetch } from '../../lib/adminFetch'
import LoadingSpinner from '../../components/UI/LoadingSpinner'

const SESSION_TYPES_PLANS = [
  'Endurance fondamentale','Footing progressif','Sortie longue','Fractionné court','Fractionné long',
  'Tempo / Seuil','Côtes','Spécifique','Récupération active','Natation','Natation endurance',
  'Natation vitesse','Vélo','Vélo endurance','Vélo tempo','Brique','Trail endurance',
  'Trail technique','Renforcement',
]

function PlanModal({ plan, athlete, onClose, onActivate }) {
  const [planData, setPlanData]   = useState(plan.plan_data)
  const [activeWeek, setActiveWeek] = useState(0)
  const [editTarget, setEditTarget] = useState(null)
  const [saving, setSaving]       = useState(false)
  const [activating, setActivating] = useState(false)

  const weeks = planData?.semaines || []
  const DAY_NAMES = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche']
  const DAY_SHORT  = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']

  async function activatePlan() {
    setActivating(true)
    try {
      await supabase.from('training_plans').update({ status: 'completed' }).eq('user_id', athlete.id).eq('status', 'active')
      await supabase.from('training_plans').update({ status: 'active', activated_at: new Date().toISOString() }).eq('id', plan.id)
      await supabase.from('messages').insert({ user_id: athlete.id, sender: 'coach',
        content: `${athlete.first_name} ! 🎉 Ton nouveau plan d'entraînement est prêt, tu peux le consulter dans "Mon plan". Si t'as des questions hésite pas.` })
      onActivate()
    } finally { setActivating(false) }
  }

  async function saveSession(weekIdx, sessionIdx, updatedSession) {
    setSaving(true)
    try {
      const body = await adminFetch(`/api/admin/plans/${plan.id}/session`, {
        method: 'PATCH',
        body: JSON.stringify({ weekIdx, sessionIdx, updatedSession }),
      })
      if (body.plan_data) setPlanData(body.plan_data)
      setEditTarget(null)
    } finally { setSaving(false) }
  }

  async function deleteSession(weekIdx, sessionIdx) {
    const ok = window.confirm('Supprimer cette séance ?')
    if (!ok) return
    const body = await adminFetch(`/api/admin/plans/${plan.id}/session`, {
      method: 'DELETE',
      body: JSON.stringify({ weekIdx, sessionIdx }),
    })
    if (body.plan_data) setPlanData(body.plan_data)
    setEditTarget(null)
  }

  const currentWeek = weeks[activeWeek]
  const editSession = editTarget ? planData?.semaines?.[editTarget.weekIdx]?.seances?.[editTarget.sessionIdx] : null

  return (
    <div className="modal-overlay center" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal center-modal" style={{ maxWidth: 1020, width: '98vw' }}>
        <style>{`
          .cpg { display: grid; grid-template-columns: repeat(7,1fr); gap: .4rem; align-items: start; }
          @media (max-width: 700px) {
            .cpg { grid-template-columns: repeat(4,1fr); }
          }
        `}</style>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1rem' }}>
          <div>
            <h3 style={{ margin:0 }}>Plan de {athlete?.first_name} {athlete?.last_name}</h3>
            <div style={{ fontSize:'.8rem', color:'var(--text-muted)', marginTop:'.2rem' }}>
              {weeks.length} semaines · <span style={{ fontWeight:600 }}>{plan.status}</span>
            </div>
          </div>
          <div style={{ display:'flex', gap:'.5rem' }}>
            {plan.status === 'pending' && (
              <button className="btn btn-primary btn-sm" onClick={activatePlan} disabled={activating}>
                {activating ? <><div className="spinner spinner-sm"/> Activation…</> : '✅ Activer'}
              </button>
            )}
            <button className="btn-icon" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Week tabs */}
        <div style={{ display:'flex', gap:'.3rem', overflowX:'auto', paddingBottom:'.5rem', marginBottom:'.75rem' }}>
          {weeks.map((w,i) => {
            const activatedAt = plan.activated_at ? new Date(plan.activated_at) : null
            let weekRange = ''
            if (activatedAt) {
              const start = new Date(activatedAt)
              start.setUTCDate(start.getUTCDate() + (w.numero - 1) * 7)
              const end = new Date(start)
              end.setUTCDate(end.getUTCDate() + 6)
              const fmt = d => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' })
              weekRange = ` · ${fmt(start)} – ${fmt(end)}`
            }
            return (
              <button key={i} onClick={() => setActiveWeek(i)} style={{
                flexShrink:0, padding:'.35rem .65rem', borderRadius:99, border:'none', whiteSpace:'nowrap',
                background: activeWeek===i ? 'var(--gradient)' : 'var(--surface-2)',
                color: activeWeek===i ? '#fff' : 'var(--text-muted)',
                fontWeight:600, fontSize:'.78rem', cursor:'pointer', fontFamily:'inherit',
              }}>S{w.numero}{weekRange}</button>
            )
          })}
        </div>

        {currentWeek && (() => {
          const seances = currentWeek.seances || []
          const chargeRaw = (currentWeek.charge||'').replace(/\s*\(S\d+\)/gi,'')
          const chargeShort = chargeRaw.split(/[—–(]/)[0].trim()
          const chargeColor = chargeShort.toLowerCase().includes('élevée')?'#F97316':chargeShort.toLowerCase().includes('modérée')?'#06B6D4':chargeShort.toLowerCase().includes('affûtage')?'#8B2FC9':chargeShort.toLowerCase().includes('récup')?'#6B7280':'#10B981'
          const byDay = {}
          DAY_NAMES.forEach(d => { byDay[d] = [] })
          seances.forEach((s,si) => { if (byDay[s.jour]) byDay[s.jour].push({...s, _si: si}) })

          return (
            <div>
              {/* Week badge */}
              <div style={{ display:'flex', alignItems:'center', gap:'.5rem', marginBottom:'.6rem' }}>
                <span style={{ fontSize:'.72rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.08em' }}>
                  S{currentWeek.numero} · {currentWeek.phase?.replace(/^S\d+\s*[—–-]\s*/i,'')}
                </span>
                <span style={{ padding:'.15rem .55rem', borderRadius:99, fontSize:'.68rem', fontWeight:700,
                  background:chargeColor+'25', border:`1px solid ${chargeColor}50`, color:chargeColor }}>{chargeShort}</span>
              </div>

              {/* Day headers */}
              <div className="cpg" style={{ marginBottom:'.3rem' }}>
                {DAY_SHORT.map((d,i) => (
                  <div key={d} style={{ textAlign:'center', fontSize:'.62rem', fontWeight:800, textTransform:'uppercase',
                    letterSpacing:'.07em', color:'var(--text-muted)', paddingBottom:'.3rem',
                    borderBottom:'1px solid var(--border)' }}>{d}</div>
                ))}
              </div>

              {/* 7-column session grid */}
              <div className="cpg">
                {DAY_NAMES.map((day,di) => {
                  const daySessions = byDay[day]
                  return (
                    <div key={day} style={{ display:'flex', flexDirection:'column', gap:'.3rem' }}>
                      {daySessions.length === 0 ? (
                        <div style={{ minHeight:52, display:'flex', alignItems:'center', justifyContent:'center',
                          border:'1px dashed rgba(255,255,255,.07)', borderRadius:8,
                          fontSize:'.62rem', color:'rgba(255,255,255,.18)', fontStyle:'italic' }}>
                          Repos
                        </div>
                      ) : daySessions.map(session => {
                        const si = session._si
                        const color = SESSION_TYPE_COLORS[session.type] || 'var(--primary)'
                        const isRace = session.est_course || (session.id_seance||'').startsWith('RACE')
                        return (
                          <div key={si} style={{
                            borderRadius:7, overflow:'hidden', minWidth:0, position:'relative',
                            border:`1px solid var(--border)`, background: isRace ? color+'18' : 'var(--surface-2)',
                          }}>
                            <div style={{ borderLeft:`3px solid ${color}`, padding:'.45rem .5rem .4rem' }}>
                              <div style={{ fontSize:'.6rem', fontWeight:700, color, marginBottom:'.15rem',
                                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                {session.type}
                              </div>
                              <div style={{ fontSize:'.73rem', fontWeight:700, lineHeight:1.2, marginBottom:'.15rem',
                                overflow:'hidden', textOverflow:'ellipsis',
                                display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                                {session.titre}
                              </div>
                              <div style={{ fontSize:'.62rem', color:'var(--text-muted)' }}>
                                {session.duree_min > 0 ? `${session.duree_min} min` : '—'}
                              </div>
                              {/* Edit / Delete */}
                              <div style={{ display:'flex', gap:'.2rem', marginTop:'.3rem' }}>
                                <button onClick={() => setEditTarget({ weekIdx: activeWeek, sessionIdx: si })}
                                  style={{ flex:1, padding:'.18rem 0', background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.1)',
                                    borderRadius:5, cursor:'pointer', fontSize:'.65rem', color:'rgba(255,255,255,.6)', fontFamily:'inherit' }}>
                                  ✏️
                                </button>
                                <button onClick={() => deleteSession(activeWeek, si)}
                                  style={{ flex:1, padding:'.18rem 0', background:'rgba(239,68,68,.12)', border:'1px solid rgba(239,68,68,.3)',
                                    borderRadius:5, cursor:'pointer', fontSize:'.65rem', color:'#FCA5A5', fontFamily:'inherit' }}>
                                  🗑️
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {/* Session editor overlay */}
        {editTarget && editSession && (
          <div style={{ position:'fixed', inset:0, zIndex:600, background:'rgba(0,0,0,.75)', backdropFilter:'blur(8px)',
            display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}
            onClick={e => e.target === e.currentTarget && setEditTarget(null)}>
            <div style={{ width:'100%', maxWidth:780, maxHeight:'92vh', overflowY:'auto',
              background:'var(--surface)', borderRadius:20, border:'1px solid var(--border)', boxShadow:'0 24px 60px rgba(0,0,0,.6)' }}>
              <div style={{ padding:'1.25rem 1.5rem', borderBottom:'1px solid var(--border)',
                display:'flex', justifyContent:'space-between', alignItems:'center',
                position:'sticky', top:0, background:'var(--surface)', zIndex:10, borderRadius:'20px 20px 0 0' }}>
                <h3 style={{ margin:0, fontSize:'1.05rem' }}>✏️ Modifier la séance {saving && '— sauvegarde…'}</h3>
                <button onClick={() => setEditTarget(null)} style={{ padding:'.35rem .75rem', background:'none', border:'1px solid var(--border)',
                  borderRadius:8, cursor:'pointer', fontFamily:'inherit', color:'var(--text-muted)' }}>✕ Annuler</button>
              </div>
              <EditSessionForm
                session={editSession}
                onSave={updated => saveSession(editTarget.weekIdx, editTarget.sessionIdx, updated)}
                onCancel={() => setEditTarget(null)}
                onDelete={() => deleteSession(editTarget.weekIdx, editTarget.sessionIdx)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const PRESET_TITLES = [
  'Endurance fondamentale', 'Footing progressif', 'Sortie longue EF pure', 'Sortie longue avec blocs tempo',
  'Récupération active', 'Tempo continu 2×15min', 'Tempo 3×10min seuil',
  '10×400m VMA', '6×1000m', '8×200m', '5×3min VMA', '4×1500m',
  'Côtes 10×30s', 'Côtes 8×1min', 'Test CSS', 'Natation endurance 1500m',
  'Natation 10×100m', 'Natation séries pyramidales', 'Sortie vélo endurance',
  'Vélo structuré blocs', 'Brique Vélo+Course', 'Renforcement gainage',
  'Renforcement explosivité', 'Activation J-1', 'Mobilité & récupération',
]

function EditSessionForm({ session, onSave, onCancel, onDelete }) {
  const [v, setV] = useState({
    titre: session.titre||'', type: session.type||'', jour: session.jour||'Lundi',
    duree_min: session.duree_min??'', distance_km: session.distance_km??'',
    intensite: session.intensite||'', echauffement: session.echauffement||'',
    corps: session.corps||'', retour_au_calme: session.retour_au_calme||'',
    notes_coach: session.notes_coach||'', rpe_cible: session.rpe_cible??'',
    alluresJson: JSON.stringify(session.allures||[], null, 2),
  })
  const [alluresError, setAlluresError] = useState('')
  const inp = { width:'100%', padding:'.5rem .75rem', border:'1px solid var(--border)', borderRadius:8,
    fontSize:'.875rem', fontFamily:'inherit', background:'var(--bg)', color:'var(--text)', outline:'none', boxSizing:'border-box' }
  const lbl = { fontSize:'.65rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em',
    color:'var(--text-muted)', marginBottom:'.2rem', display:'block' }
  const set = (k,val) => setV(p=>({...p,[k]:val}))
  const num = (k,fb) => v[k]!=='' ? Number(v[k]) : fb
  return (
    <div style={{ padding:'1.5rem', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
      <div style={{ gridColumn:'1/-1' }}>
        <label style={lbl}>Titre</label>
        <input style={{ ...inp, fontSize:'1rem', fontWeight:600, padding:'.65rem .875rem' }} value={v.titre} onChange={e=>set('titre',e.target.value)} autoFocus />
        <div style={{ display:'flex', flexWrap:'wrap', gap:'.3rem', marginTop:'.5rem' }}>
          {PRESET_TITLES.map(t => (
            <button key={t} type="button" onClick={() => set('titre', t)} style={{
              padding:'.18rem .55rem', borderRadius:99, fontSize:'.72rem', fontWeight:600, cursor:'pointer',
              fontFamily:'inherit', border:'1px solid var(--border)',
              background: v.titre === t ? 'var(--primary)' : 'var(--surface-2)',
              color: v.titre === t ? '#fff' : 'var(--text-muted)',
              transition:'all .12s',
            }}>{t}</button>
          ))}
        </div>
      </div>
      <div><label style={lbl}>Type</label>
        <select style={inp} value={v.type} onChange={e=>set('type',e.target.value)}>
          {SESSION_TYPES_PLANS.map(t=><option key={t}>{t}</option>)}
        </select></div>
      <div><label style={lbl}>Jour</label>
        <select style={inp} value={v.jour} onChange={e=>set('jour',e.target.value)}>
          {['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'].map(d=><option key={d}>{d}</option>)}
        </select></div>
      <div><label style={lbl}>Durée (min)</label><input style={inp} type="number" value={v.duree_min} onChange={e=>set('duree_min',e.target.value)} /></div>
      <div><label style={lbl}>RPE cible</label><input style={inp} type="number" min="1" max="10" value={v.rpe_cible} onChange={e=>set('rpe_cible',e.target.value)} /></div>
      <div><label style={lbl}>Distance (km)</label><input style={inp} type="number" step=".1" value={v.distance_km??''} onChange={e=>set('distance_km',e.target.value)} /></div>
      <div><label style={lbl}>Intensité</label>
        <select style={inp} value={v.intensite} onChange={e=>set('intensite',e.target.value)}>
          {['très facile','facile','modérée','dur','très dur','course'].map(i=><option key={i}>{i}</option>)}
        </select></div>
      <div style={{ gridColumn:'1/-1' }}><label style={lbl}>Échauffement</label>
        <textarea style={{ ...inp, resize:'vertical' }} rows={3} value={v.echauffement} onChange={e=>set('echauffement',e.target.value)} /></div>
      <div style={{ gridColumn:'1/-1' }}><label style={lbl}>Corps de séance</label>
        <textarea style={{ ...inp, resize:'vertical', fontFamily:'monospace', fontSize:'.8rem' }} rows={8} value={v.corps} onChange={e=>set('corps',e.target.value)} /></div>
      <div style={{ gridColumn:'1/-1' }}><label style={lbl}>Retour au calme</label>
        <textarea style={{ ...inp, resize:'vertical' }} rows={2} value={v.retour_au_calme} onChange={e=>set('retour_au_calme',e.target.value)} /></div>
      <div style={{ gridColumn:'1/-1' }}><label style={lbl}>Note coach</label>
        <textarea style={{ ...inp, resize:'vertical' }} rows={3} value={v.notes_coach} onChange={e=>set('notes_coach',e.target.value)} /></div>
      <div style={{ gridColumn:'1/-1' }}>
        <label style={lbl}>Allures (JSON — zone, pourcentage_vma, vitesse_kmh, allure_min_km)</label>
        <textarea
          style={{ ...inp, resize:'vertical', fontFamily:'monospace', fontSize:'.78rem',
            borderColor: alluresError ? 'rgba(239,68,68,.6)' : undefined }}
          rows={6}
          value={v.alluresJson}
          onChange={e => {
            set('alluresJson', e.target.value)
            try { JSON.parse(e.target.value); setAlluresError('') }
            catch { setAlluresError('JSON invalide') }
          }} />
        {alluresError && <div style={{ fontSize:'.72rem', color:'#FCA5A5', marginTop:'.25rem' }}>⚠️ {alluresError}</div>}
      </div>
      <div style={{ gridColumn:'1/-1', display:'flex', justifyContent:'space-between', alignItems:'center', gap:'.75rem',
        padding:'0 0 .5rem', borderTop:'1px solid var(--border)', paddingTop:'1rem' }}>
        {onDelete ? (
          <button onClick={() => { if(window.confirm('Supprimer cette séance ?')) onDelete() }} style={{
            padding:'.6rem 1rem', background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.35)',
            borderRadius:10, cursor:'pointer', fontFamily:'inherit', color:'#FCA5A5', fontWeight:600 }}>
            🗑️ Supprimer
          </button>
        ) : <div />}
        <div style={{ display:'flex', gap:'.75rem' }}>
          <button onClick={onCancel} style={{ padding:'.6rem 1.25rem', background:'none', border:'1px solid var(--border)',
            borderRadius:10, cursor:'pointer', fontFamily:'inherit', color:'var(--text-muted)' }}>Annuler</button>
          <button disabled={!!alluresError} onClick={() => {
            let allures = session.allures||[]
            try { allures = JSON.parse(v.alluresJson) } catch {}
            onSave({ ...session, ...v, allures,
              duree_min:num('duree_min',session.duree_min),
              distance_km:v.distance_km!==''?num('distance_km',session.distance_km):null,
              rpe_cible:num('rpe_cible',session.rpe_cible) })
          }} style={{ padding:'.6rem 1.5rem', background: alluresError?'rgba(255,255,255,.1)':'var(--gradient)',
            color:'#fff', border:'none', borderRadius:10, fontWeight:700, cursor: alluresError?'default':'pointer',
            fontFamily:'inherit', boxShadow: alluresError?'none':'0 4px 16px rgba(232,35,122,.35)' }}>
            ✓ Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminPlans() {
  const navigate = useNavigate()
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
  const [selectedPlans,  setSelectedPlans]  = useState(new Set())
  const [bulkDeleting,   setBulkDeleting]   = useState(false)
  const [showEditForm,   setShowEditForm]   = useState(false)
  const [editAthlete,    setEditAthlete]    = useState('')
  const [editNoplan,     setEditNoplan]     = useState(false)

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
      const body = await adminFetch('/api/plans/generate', {
        method: 'POST',
        body: JSON.stringify({ userId: athlete.id, profile: athlete }),
      })
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

  async function bulkDelete() {
    if (!selectedPlans.size) return
    if (!window.confirm(`Supprimer ${selectedPlans.size} plan(s) ? Cette action est irréversible.`)) return
    setBulkDeleting(true)
    try {
      const ids = [...selectedPlans]
      const { error } = await supabase.from('training_plans').delete().in('id', ids)
      if (error) throw error
      setSelectedPlans(new Set())
      await loadPlans()
    } catch (err) {
      alert('Erreur suppression : ' + err.message)
    } finally {
      setBulkDeleting(false)
    }
  }

  function openActivePlan(athleteId) {
    setEditNoplan(false)
    const activePlan = plans.find(p => p.user_id === athleteId && p.status === 'active')
    if (activePlan) {
      navigate(`/admin/plans/builder?planId=${activePlan.id}&userId=${athleteId}`)
    } else {
      setEditNoplan(true)
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
      <style>{`
        @media (max-width: 767px) {
          .plan-card-actions { flex-wrap: wrap !important; gap: .3rem !important; }
          .plan-card-actions .btn { font-size: .72rem !important; padding: .28rem .5rem !important; }
        }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 className="page-heading">Plans d'entraînement</h2>
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-ghost btn-sm"
            onClick={() => { setShowEditForm(v => !v); setShowGenForm(false); setEditAthlete(''); setEditNoplan(false) }}
            style={showEditForm ? { borderColor: 'var(--primary)', color: '#C084FC' } : {}}>
            ✏️ Modifier un plan en cours
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => { navigate('/admin/plans/builder'); setShowGenForm(false); setShowEditForm(false) }}>
            🗓️ Créer manuellement
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => { setShowGenForm(v => !v); setShowEditForm(false) }}>
            🤖 Générer avec IA
          </button>
        </div>
      </div>

      {showEditForm && (
        <div className="card" style={{ marginBottom: '1.25rem', background: 'var(--surface-2)', border: '1px solid rgba(139,47,201,.25)' }}>
          <h4 style={{ marginBottom: '.875rem', color: '#C084FC' }}>✏️ Modifier un plan en cours</h4>
          <div style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: 1, minWidth: 220, marginBottom: 0 }}>
              <label className="form-label">Athlète</label>
              <select className="form-input" value={editAthlete}
                onChange={e => { setEditAthlete(e.target.value); setEditNoplan(false); if (e.target.value) openActivePlan(e.target.value) }}>
                <option value="">-- Choisir un athlète --</option>
                {allAthletes.map(a => (
                  <option key={a.id} value={a.id}>{a.first_name} {a.last_name}</option>
                ))}
              </select>
            </div>
          </div>
          {editNoplan && (
            <p style={{ marginTop: '.75rem', fontSize: '.85rem', color: '#F59E0B' }}>
              ⚠️ Cet athlète n'a pas de plan actif en ce moment.
            </p>
          )}
          {!editNoplan && !editAthlete && (
            <p className="text-muted text-sm" style={{ marginTop: '.75rem' }}>
              Sélectionne un athlète pour ouvrir son plan en cours et modifier les séances.
            </p>
          )}
        </div>
      )}

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

      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { v: 'pending',   l: `En attente (${plans.filter(p => p.status === 'pending').length})` },
          { v: 'active',    l: 'Actifs' },
          { v: 'completed', l: 'Terminés' },
          { v: 'all',       l: 'Tous' },
        ].map(f => (
          <button key={f.v} className={`btn btn-sm ${filter === f.v ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter(f.v)}>{f.l}</button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '.4rem', alignItems: 'center' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setSelectedPlans(prev => prev.size === filtered.length ? new Set() : new Set(filtered.map(p => p.id)))}>
            {selectedPlans.size === filtered.length && filtered.length > 0 ? '☑ Tout désélectionner' : '☐ Tout sélectionner'}
          </button>
          {selectedPlans.size > 0 && (
            <button className="btn btn-sm" onClick={bulkDelete} disabled={bulkDeleting}
              style={{ background: 'rgba(239,68,68,.15)', border: '1px solid rgba(239,68,68,.4)', color: '#FCA5A5' }}>
              {bulkDeleting ? '…' : `🗑️ Supprimer (${selectedPlans.size})`}
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filtered.map(plan => {
          const athlete = athletes[plan.user_id]
          const weeks   = plan.plan_data?.semaines?.length || 0
          return (
            <div key={plan.id} className="card"
              style={{ borderLeft: selectedPlans.has(plan.id) ? '4px solid var(--primary)' : plan.status === 'pending' ? '4px solid var(--warning)' : '4px solid var(--success)',
                background: selectedPlans.has(plan.id) ? 'rgba(139,47,201,.06)' : undefined }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '.75rem' }}>
                {/* Checkbox */}
                <input type="checkbox" checked={selectedPlans.has(plan.id)}
                  onChange={() => setSelectedPlans(prev => { const n = new Set(prev); n.has(plan.id) ? n.delete(plan.id) : n.add(plan.id); return n })}
                  style={{ marginTop: '.35rem', width: 16, height: 16, accentColor: 'var(--primary)', flexShrink: 0, cursor: 'pointer' }} />
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
                <div className="plan-card-actions" style={{ display: 'flex', gap: '.4rem', flexShrink: 0, alignItems: 'center' }}>
                  <button className="btn btn-ghost btn-sm"
                    style={{ whiteSpace: 'nowrap' }}
                    onClick={() => navigate(`/admin/plans/builder?planId=${plan.id}&userId=${plan.user_id}`)}>
                    ✏️ Modifier
                  </button>
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
