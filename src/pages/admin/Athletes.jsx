import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { OBJECTIVE_LABELS, LEVEL_LABELS } from '../../lib/utils'
import LoadingSpinner from '../../components/UI/LoadingSpinner'

const PROFILE_FIELDS = [
  { lbl: 'Objectif',           key: 'objective',              type: 'select',
    options: Object.entries(OBJECTIVE_LABELS),
    display: v => OBJECTIVE_LABELS[v] || 'N/C' },
  { lbl: 'Niveau',             key: 'level',                  type: 'select',
    options: Object.entries(LEVEL_LABELS),
    display: v => LEVEL_LABELS[v] || 'N/C' },
  { lbl: 'VMA (km/h)',         key: 'vma',                    type: 'number',
    display: v => v ? `${v} km/h` : '—' },
  { lbl: 'VMA connue ?',       key: 'vma_known',              type: 'select',
    options: [['true','Oui'],['false','Non']],
    display: v => v ? 'Oui' : 'Non' },
  { lbl: 'Chrono cible',       key: 'chrono_goal',            type: 'text',
    display: v => v || 'Progresser' },
  { lbl: 'Jours / sem.',       key: 'days_per_week',          type: 'number',
    display: v => v ? `${v} j/sem` : '—' },
  { lbl: 'Jours préférés',     key: 'preferred_days',         type: 'text',
    display: v => Array.isArray(v) ? v.join(', ') : v || '—' },
  { lbl: 'Date course',        key: 'race_date',              type: 'date',
    display: v => v ? new Date(v).toLocaleDateString('fr-FR') : 'Non définie' },
  { lbl: 'Course intermédiaire', key: 'intermediate_race_name', type: 'text',
    display: v => v || 'Aucune' },
  { lbl: 'Date course inter.', key: 'intermediate_race_date', type: 'date',
    display: v => v ? new Date(v).toLocaleDateString('fr-FR') : '—' },
  { lbl: 'Terrain',            key: 'training_terrain',       type: 'select',
    options: [['','Non précisé'],['montagne','Montagne'],['semi_montagne','Semi-montagne'],['ville_plat','Ville / Plat']],
    display: v => ({montagne:'Montagne',semi_montagne:'Semi-montagne',ville_plat:'Ville/Plat'})[v] || '—' },
  { lbl: 'Blessures',          key: 'injuries',               type: 'text',
    display: v => v || 'Aucune' },
  { lbl: 'Forme actuelle',     key: 'current_form',           type: 'text',
    display: v => v || 'N/C' },
  { lbl: 'Douleur cycle (j)',  key: 'period_pain_days',       type: 'number',
    display: v => v ? `${v} jour(s)` : '—' },
  { lbl: 'Meilleur chrono',    key: 'best_recent_time',       type: 'text',
    display: v => v || '—' },
]

function getCurrentWeekNum(plan) {
  if (!plan) return 1
  const d = new Date(plan.activated_at || plan.created_at)
  d.setHours(0, 0, 0, 0)
  const dow = d.getDay()
  if (dow !== 1) d.setDate(d.getDate() + (dow === 0 ? 1 : 8 - dow))
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const ms = today.getTime() - d.getTime()
  if (ms < 0) return 1
  return Math.floor(ms / (7 * 24 * 3600 * 1000)) + 1
}

const TYPE_COLORS = {
  'fractionné': '#8B2FC9', 'vma': '#8B2FC9',
  'tempo': '#F59E0B', 'seuil': '#F59E0B',
  'endurance': '#10B981', 'sortie longue': '#10B981', 'footing': '#10B981',
  'renforcement': '#6B7280', 'repos': '#4B5563',
  'course intermédiaire': '#F97316', 'course': '#EF4444',
  'récupération': '#3B82F6', 'côtes': '#EC4899',
}
function getTypeColor(type) {
  const t = (type || '').toLowerCase()
  for (const [k, v] of Object.entries(TYPE_COLORS)) {
    if (t.includes(k)) return v
  }
  return '#6B7280'
}

// ─── Session edit form ────────────────────────────────────────────────────────

function SessionEditForm({ session, onSave, onCancel }) {
  const [vals, setVals] = useState({
    titre:           session.titre           || '',
    type:            session.type            || '',
    duree_min:       session.duree_min       ?? '',
    distance_km:     session.distance_km     ?? '',
    intensite:       session.intensite       || '',
    echauffement:    session.echauffement    || '',
    corps:           session.corps           || '',
    retour_au_calme: session.retour_au_calme || '',
    notes_coach:     session.notes_coach     || '',
    rpe_cible:       session.rpe_cible       ?? '',
  })

  const inp = {
    width: '100%', padding: '.4rem .6rem', border: '1px solid var(--border)',
    borderRadius: 6, fontSize: '.82rem', fontFamily: 'inherit',
    background: 'var(--bg)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box',
  }
  const lbl = {
    fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '.04em', color: 'var(--text-muted)', marginBottom: '.2rem', display: 'block',
  }
  const set = (k, v) => setVals(p => ({ ...p, [k]: v }))

  function handleSave() {
    onSave({
      ...session,
      ...vals,
      duree_min:   vals.duree_min   !== '' ? Number(vals.duree_min)   : session.duree_min,
      distance_km: vals.distance_km !== '' ? Number(vals.distance_km) : session.distance_km,
      rpe_cible:   vals.rpe_cible   !== '' ? Number(vals.rpe_cible)   : session.rpe_cible,
    })
  }

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 8, padding: '.875rem', marginTop: '.35rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' }}>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={lbl}>Titre</label>
          <input style={inp} value={vals.titre} onChange={e => set('titre', e.target.value)} />
        </div>
        <div>
          <label style={lbl}>Type</label>
          <input style={inp} value={vals.type} onChange={e => set('type', e.target.value)} />
        </div>
        <div>
          <label style={lbl}>Intensité</label>
          <input style={inp} value={vals.intensite} onChange={e => set('intensite', e.target.value)} />
        </div>
        <div>
          <label style={lbl}>Durée (min)</label>
          <input style={inp} type="number" value={vals.duree_min} onChange={e => set('duree_min', e.target.value)} />
        </div>
        <div>
          <label style={lbl}>Distance (km)</label>
          <input style={inp} type="number" step=".1" value={vals.distance_km} onChange={e => set('distance_km', e.target.value)} />
        </div>
        <div>
          <label style={lbl}>RPE cible</label>
          <input style={inp} type="number" min="1" max="10" value={vals.rpe_cible} onChange={e => set('rpe_cible', e.target.value)} />
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={lbl}>Échauffement</label>
          <textarea style={{ ...inp, resize: 'vertical' }} rows={2} value={vals.echauffement}
            onChange={e => set('echauffement', e.target.value)} />
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={lbl}>Corps de séance</label>
          <textarea style={{ ...inp, resize: 'vertical' }} rows={5} value={vals.corps}
            onChange={e => set('corps', e.target.value)} />
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={lbl}>Retour au calme</label>
          <textarea style={{ ...inp, resize: 'vertical' }} rows={2} value={vals.retour_au_calme}
            onChange={e => set('retour_au_calme', e.target.value)} />
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={lbl}>Note coach</label>
          <textarea style={{ ...inp, resize: 'vertical' }} rows={3} value={vals.notes_coach}
            onChange={e => set('notes_coach', e.target.value)} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end', marginTop: '.75rem' }}>
        <button onClick={onCancel}
          style={{ padding: '.35rem .75rem', background: 'none', border: '1px solid var(--border)',
            borderRadius: 6, fontSize: '.8rem', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text-muted)' }}>
          Annuler
        </button>
        <button onClick={handleSave}
          style={{ padding: '.35rem .85rem', background: 'var(--gradient)', color: '#fff',
            border: 'none', borderRadius: 6, fontWeight: 700, fontSize: '.8rem', cursor: 'pointer', fontFamily: 'inherit' }}>
          ✓ Enregistrer
        </button>
      </div>
    </div>
  )
}

// ─── Full-screen athlete detail panel ─────────────────────────────────────────

function AthleteDetailPanel({ athlete, onClose, onUpdated }) {
  const [completions,   setCompletions]   = useState([])
  const [plan,          setPlan]          = useState(null)
  const [profileAlerts, setProfileAlerts] = useState([])
  const [loading,       setLoading]       = useState(true)
  const [tab,           setTab]           = useState('profile')
  const [generating,    setGenerating]    = useState(false)
  const [generateMsg,   setGenerateMsg]   = useState('')
  const [local,         setLocal]         = useState(athlete)
  const [editField,     setEditField]     = useState(null)
  const [editVal,       setEditVal]       = useState('')
  const [editSaving,    setEditSaving]    = useState(false)
  const [editMsg,       setEditMsg]       = useState(false)
  const [msgVal,        setMsgVal]        = useState(athlete.coach_message || '')
  const [editingSession,setEditingSession]= useState(null) // {weekNum, sessionIdx}
  const [sessionSaving, setSessionSaving] = useState(false)
  const [expandedWeeks, setExpandedWeeks] = useState(new Set())

  const currentWeekNum = getCurrentWeekNum(plan)

  useEffect(() => { loadDetail() }, [])

  async function loadDetail() {
    setLoading(true)
    try {
      const [{ data: c }, { data: p }, { data: alerts }] = await Promise.all([
        supabase.from('session_completions').select('*').eq('user_id', athlete.id)
          .order('completed_at', { ascending: false }),
        supabase.from('training_plans').select('*').eq('user_id', athlete.id)
          .in('status', ['active', 'pending']).order('created_at', { ascending: false }).limit(1).single(),
        supabase.from('messages').select('*').eq('user_id', athlete.id)
          .like('content', '⚠️ [PROFIL]%').order('created_at', { ascending: false }).limit(30),
      ])
      setCompletions(c || [])
      setPlan(p)
      setProfileAlerts(alerts || [])
      if (p) {
        const week = getCurrentWeekNum(p)
        setExpandedWeeks(new Set([week]))
      }
    } finally {
      setLoading(false)
    }
  }

  async function generatePlan() {
    setGenerating(true); setGenerateMsg('')
    try {
      const res  = await fetch('/api/plans/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: athlete.id, profile: local, clientDate: new Date().toISOString().split('T')[0] }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Erreur génération')
      setGenerateMsg('Plan généré — valide-le dans l\'onglet Plans.')
      await loadDetail()
    } catch (err) {
      setGenerateMsg('Erreur : ' + err.message)
    } finally {
      setGenerating(false)
    }
  }

  function startEdit(field) {
    const f = PROFILE_FIELDS.find(f => f.key === field)
    setEditField(field)
    setEditVal(local[field] ?? '')
    if (f?.type === 'date' && local[field]) setEditVal(local[field].split('T')[0])
  }

  async function saveField() {
    if (editSaving) return
    setEditSaving(true)
    try {
      const update = { [editField]: editVal === '' ? null : editVal }
      const { error } = await supabase.from('profiles').update(update).eq('id', athlete.id)
      if (error) throw error
      const updated = { ...local, ...update }
      setLocal(updated)
      onUpdated?.(updated)
      setEditField(null)
    } catch (err) {
      alert('Erreur : ' + err.message)
    } finally {
      setEditSaving(false)
    }
  }

  async function saveCoachMessage() {
    setEditSaving(true)
    try {
      const { error } = await supabase.from('profiles').update({ coach_message: msgVal }).eq('id', athlete.id)
      if (error) throw error
      const updated = { ...local, coach_message: msgVal }
      setLocal(updated); onUpdated?.(updated); setEditMsg(false)
    } catch (err) {
      alert('Erreur : ' + err.message)
    } finally {
      setEditSaving(false)
    }
  }

  async function saveSession(weekNum, sessionIdx, updatedSession) {
    if (sessionSaving) return
    setSessionSaving(true)
    try {
      const updatedPlan = JSON.parse(JSON.stringify(plan.plan_data))
      const week = updatedPlan.semaines.find(s => s.numero === weekNum)
      if (week) {
        week.seances[sessionIdx] = updatedSession
        week.volume_total_km = Math.round(
          week.seances.reduce((sum, s) => sum + (s.distance_km || 0), 0) * 10
        ) / 10
      }
      const { error } = await supabase.from('training_plans')
        .update({ plan_data: updatedPlan }).eq('id', plan.id)
      if (error) throw error
      setPlan(p => ({ ...p, plan_data: updatedPlan }))
      setEditingSession(null)
    } catch (err) {
      alert('Erreur : ' + err.message)
    } finally {
      setSessionSaving(false)
    }
  }

  function toggleWeek(num) {
    setExpandedWeeks(prev => {
      const next = new Set(prev)
      next.has(num) ? next.delete(num) : next.add(num)
      return next
    })
  }

  const avgRpe = completions.filter(c => c.rpe).length > 0
    ? (completions.filter(c => c.rpe).reduce((a, c) => a + c.rpe, 0) /
       completions.filter(c => c.rpe).length).toFixed(1)
    : 'N/A'

  const inputStyle = {
    width: '100%', padding: '.4rem .65rem', border: '1.5px solid var(--primary)',
    borderRadius: 'var(--radius)', fontSize: '.875rem', fontFamily: 'inherit',
    background: 'var(--bg)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box',
  }

  const tabs = [
    { v: 'profile',  l: '👤 Profil' },
    { v: 'plan',     l: `📋 Plan complet${plan ? ` (S${currentWeekNum})` : ''}` },
    { v: 'retours',  l: `📊 Retours (${completions.length})` },
    ...(profileAlerts.length > 0 ? [{ v: 'alertes', l: `⚠️ Alertes (${profileAlerts.length})` }] : []),
  ]

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'var(--bg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Header ── */}
      <div style={{ borderBottom: '1px solid var(--border)', padding: '.875rem 1.5rem', display: 'flex', alignItems: 'center', gap: '.875rem', flexShrink: 0, background: 'var(--surface)' }}>
        <button onClick={onClose}
          style={{ padding: '.35rem .75rem', background: 'none', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text-muted)', fontSize: '.82rem', flexShrink: 0 }}>
          ← Retour
        </button>
        <div className="chat-avatar" style={{ width: 40, height: 40, fontSize: '1rem', flexShrink: 0 }}>
          {local.first_name?.[0]?.toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{local.first_name} {local.last_name}</div>
          <div style={{ fontSize: '.78rem', color: 'var(--text-muted)' }}>{local.email}</div>
        </div>
        <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', flexShrink: 0 }}>
          <span className={`badge ${local.subscription_status === 'active' ? 'badge-success' : 'badge-warning'}`}>
            {local.subscription_status === 'active' ? '✓ Actif' : local.subscription_status || 'Inactif'}
          </span>
          {plan && (
            <span className={`badge ${plan.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
              Plan {plan.status === 'active' ? 'actif' : 'en attente'}
            </span>
          )}
          {local.heat_mode && <span className="badge" style={{ background: '#F59E0B22', color: '#F59E0B' }}>🌡️ Canicule</span>}
          {local.injury_mode && <span className="badge" style={{ background: '#EF444422', color: '#EF4444' }}>🩹 Blessure</span>}
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0, paddingLeft: '1rem', background: 'var(--surface)', overflowX: 'auto' }}>
        {tabs.map(t => (
          <button key={t.v} onClick={() => setTab(t.v)}
            style={{ padding: '.6rem 1rem', border: 'none', background: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontWeight: 600, fontSize: '.82rem', whiteSpace: 'nowrap',
              borderBottom: tab === t.v ? '2px solid var(--primary)' : '2px solid transparent',
              color: tab === t.v ? 'var(--primary)' : 'var(--text-muted)' }}>
            {t.l}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
        {loading ? <LoadingSpinner /> : (
          <>

            {/* ── PROFIL TAB ── */}
            {tab === 'profile' && (
              <div style={{ maxWidth: 960 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '.6rem', marginBottom: '1rem' }}>
                  {PROFILE_FIELDS.map(f => (
                    <div key={f.key}
                      style={{ background: editField === f.key ? 'var(--surface)' : 'var(--surface-2)', padding: '.75rem',
                        borderRadius: 'var(--radius)', border: editField === f.key ? '2px solid var(--primary)' : '2px solid transparent',
                        cursor: editField === f.key ? 'default' : 'pointer' }}
                      onClick={() => editField !== f.key && startEdit(f.key)}>
                      <div style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.03em',
                        color: editField === f.key ? 'var(--primary)' : 'var(--text-muted)', marginBottom: '.3rem' }}>
                        {f.lbl}
                      </div>
                      {editField === f.key ? (
                        <div onClick={e => e.stopPropagation()}>
                          {f.type === 'select' ? (
                            <select value={editVal} onChange={e => setEditVal(e.target.value)} style={inputStyle} autoFocus>
                              {f.options.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                          ) : (
                            <input type={f.type} value={editVal} onChange={e => setEditVal(e.target.value)}
                              style={inputStyle} autoFocus
                              onKeyDown={e => { if (e.key === 'Enter') saveField(); if (e.key === 'Escape') setEditField(null) }} />
                          )}
                          <div style={{ display: 'flex', gap: '.35rem', marginTop: '.45rem' }}>
                            <button onClick={saveField} disabled={editSaving}
                              style={{ padding: '.28rem .65rem', background: 'var(--gradient)', color: '#fff', border: 'none', borderRadius: 5, fontWeight: 700, fontSize: '.75rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                              {editSaving ? '…' : '✓'}
                            </button>
                            <button onClick={() => setEditField(null)}
                              style={{ padding: '.28rem .55rem', background: 'none', border: '1px solid var(--border)', borderRadius: 5, fontSize: '.75rem', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text-muted)' }}>
                              ✕
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontWeight: 600, fontSize: '.875rem' }}>{f.display(local[f.key])}</div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Note coach */}
                <div style={{ background: editMsg ? 'var(--surface)' : 'var(--surface-2)', padding: '.75rem',
                  borderRadius: 'var(--radius)', border: editMsg ? '2px solid var(--primary)' : '2px solid transparent',
                  cursor: editMsg ? 'default' : 'pointer', marginBottom: '1.25rem' }}
                  onClick={() => !editMsg && setEditMsg(true)}>
                  <div style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.03em',
                    color: editMsg ? 'var(--primary)' : 'var(--text-muted)', marginBottom: '.3rem' }}>
                    Note coach
                  </div>
                  {editMsg ? (
                    <div onClick={e => e.stopPropagation()}>
                      <textarea value={msgVal} onChange={e => setMsgVal(e.target.value)}
                        rows={4} autoFocus style={{ ...inputStyle, resize: 'vertical' }} />
                      <div style={{ display: 'flex', gap: '.4rem', marginTop: '.5rem' }}>
                        <button onClick={saveCoachMessage} disabled={editSaving}
                          style={{ padding: '.3rem .7rem', background: 'var(--gradient)', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: '.78rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                          {editSaving ? '…' : '✓ Enregistrer'}
                        </button>
                        <button onClick={() => setEditMsg(false)}
                          style={{ padding: '.3rem .65rem', background: 'none', border: '1px solid var(--border)', borderRadius: 6, fontSize: '.78rem', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text-muted)' }}>
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '.875rem', fontStyle: local.coach_message ? 'italic' : 'normal',
                      color: local.coach_message ? 'var(--text)' : 'var(--text-muted)' }}>
                      {local.coach_message || 'Ajouter une note…'}
                    </div>
                  )}
                </div>

                {/* Génération plan */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                  {generateMsg && (
                    <div className={`alert ${generateMsg.startsWith('Erreur') ? 'alert-error' : 'alert-success'}`}
                      style={{ marginBottom: '.75rem' }}>
                      {generateMsg.startsWith('Erreur') ? '⚠️' : '✅'} {generateMsg}
                    </div>
                  )}
                  {!plan ? (
                    <button className="btn btn-primary" onClick={generatePlan} disabled={generating}>
                      {generating ? <><div className="spinner spinner-sm" /> Génération en cours… (30-60s)</> : '🤖 Générer un plan personnalisé'}
                    </button>
                  ) : (
                    <button className="btn btn-ghost btn-sm" onClick={generatePlan} disabled={generating}>
                      {generating ? <><div className="spinner spinner-sm" /> Génération…</> : '↺ Regénérer le plan'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── PLAN TAB ── */}
            {tab === 'plan' && (
              <div style={{ maxWidth: 1000 }}>
                {!plan ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    <p>Aucun plan. Génère-en un dans l'onglet Profil.</p>
                  </div>
                ) : (
                  <>
                    {/* Plan header info */}
                    {plan.plan_data?.message_du_mois && (
                      <div style={{ background: 'var(--surface-2)', padding: '.875rem 1rem', borderRadius: 'var(--radius)', marginBottom: '1.25rem', fontStyle: 'italic', fontSize: '.9rem', color: 'var(--text)', lineHeight: 1.6, borderLeft: '3px solid var(--primary)' }}>
                        {plan.plan_data.message_du_mois}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                      <span className="badge badge-success">Semaine {currentWeekNum} / {plan.plan_data?.semaines?.length || 4} en cours</span>
                      {plan.plan_data?.phase_actuelle && <span className="badge">{plan.plan_data.phase_actuelle}</span>}
                      <span style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                        Cliquer sur une semaine pour la déplier · ✏️ pour modifier une séance
                      </span>
                    </div>

                    {/* Weeks */}
                    {(plan.plan_data?.semaines || []).map(week => {
                      const isCurrent  = week.numero === currentWeekNum
                      const isExpanded = expandedWeeks.has(week.numero)
                      const weekComps  = completions.filter(c => c.week_number === week.numero)
                      const runningSessions = (week.seances || []).filter(s => !/renforcement|repos/i.test(s.type || ''))
                      const adaptedLabel = { heat: '🌡️ Canicule', injury: '🩹 Blessure', cycle: '🌸 Cycle' }[week._adapted_for] || null

                      return (
                        <div key={week.numero} style={{
                          border: isCurrent ? '2px solid var(--primary)' : '1px solid var(--border)',
                          borderRadius: 'var(--radius)', marginBottom: '1rem', overflow: 'hidden',
                        }}>
                          {/* Week header */}
                          <div style={{
                            background: isCurrent ? 'rgba(var(--primary-rgb, 124,58,237),.08)' : 'var(--surface)',
                            padding: '.875rem 1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '.75rem',
                            borderBottom: isExpanded ? '1px solid var(--border)' : 'none',
                          }} onClick={() => toggleWeek(week.numero)}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 700, fontSize: '.95rem' }}>
                                  Semaine {week.numero}
                                  {isCurrent && (
                                    <span style={{ marginLeft: '.4rem', fontSize: '.65rem', background: 'var(--primary)', color: '#fff', padding: '.1rem .4rem', borderRadius: 4 }}>
                                      EN COURS
                                    </span>
                                  )}
                                </span>
                                {adaptedLabel && (
                                  <span style={{ fontSize: '.72rem', padding: '.1rem .4rem', borderRadius: 4, background: 'rgba(255,255,255,.07)' }}>
                                    {adaptedLabel}
                                  </span>
                                )}
                                <span style={{ fontSize: '.78rem', color: 'var(--text-muted)' }}>{week.dates?.label || ''}</span>
                              </div>
                              <div style={{ display: 'flex', gap: '1.25rem', marginTop: '.3rem', fontSize: '.78rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                                <span>{week.phase}</span>
                                <span>Charge : {week.charge}</span>
                                <span>Volume : {week.volume_total_km ?? '?'} km</span>
                                <span style={{ color: weekComps.length >= runningSessions.length ? '#10B981' : 'inherit' }}>
                                  ✓ {weekComps.length} / {(week.seances || []).length} séances
                                </span>
                              </div>
                            </div>
                            <span style={{ color: 'var(--text-muted)', fontSize: '.85rem' }}>{isExpanded ? '▲' : '▼'}</span>
                          </div>

                          {/* Sessions list */}
                          {isExpanded && (
                            <div style={{ padding: '.75rem', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                              {(week.seances || []).map((s, sIdx) => {
                                const isEditingThis = editingSession?.weekNum === week.numero && editingSession?.sessionIdx === sIdx
                                const completion = weekComps.find(c => c.session_index === sIdx)
                                const color = getTypeColor(s.type)

                                return (
                                  <div key={sIdx} style={{
                                    background: 'var(--surface-2)', borderRadius: 8, overflow: 'hidden',
                                    border: completion ? '1px solid rgba(16,185,129,.3)' : '1px solid transparent',
                                  }}>
                                    {/* Session row */}
                                    <div style={{ padding: '.6rem .875rem', display: 'flex', alignItems: 'flex-start', gap: '.75rem' }}>
                                      <div style={{ width: 3, minHeight: 40, alignSelf: 'stretch', borderRadius: 2, background: color, flexShrink: 0 }} />
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', flexWrap: 'wrap', marginBottom: '.2rem' }}>
                                          <span style={{ fontWeight: 700, fontSize: '.82rem' }}>
                                            {s.date ? new Date(s.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) : s.jour}
                                          </span>
                                          <span style={{ fontSize: '.68rem', color, background: `${color}22`, padding: '.1rem .4rem', borderRadius: 4 }}>
                                            {s.type}
                                          </span>
                                          {s.est_seance_cle && <span style={{ fontSize: '.65rem', color: '#F59E0B' }}>★ Clé</span>}
                                          {completion && (
                                            <span style={{ fontSize: '.65rem', color: '#10B981' }}>
                                              ✓ RPE {completion.rpe || '?'}/10
                                            </span>
                                          )}
                                        </div>
                                        <div style={{ fontWeight: 600, fontSize: '.875rem', marginBottom: '.15rem' }}>{s.titre}</div>
                                        <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>
                                          {s.duree_min ? `${s.duree_min} min` : '—'}
                                          {s.distance_km != null ? ` · ${s.distance_km} km` : ''}
                                          {s.intensite ? ` · ${s.intensite}` : ''}
                                          {s.rpe_cible ? ` · RPE cible ${s.rpe_cible}` : ''}
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => setEditingSession(isEditingThis ? null : { weekNum: week.numero, sessionIdx: sIdx })}
                                        style={{ padding: '.28rem .6rem', background: 'none', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontSize: '.72rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                                        {isEditingThis ? '✕' : '✏️'}
                                      </button>
                                    </div>

                                    {/* Session details when expanded */}
                                    {!isEditingThis && (s.corps || s.echauffement || s.notes_coach) && (
                                      <div style={{ padding: '0 .875rem .75rem', display: 'flex', flexDirection: 'column', gap: '.4rem', borderTop: '1px solid var(--border)', paddingTop: '.6rem' }}>
                                        {s.echauffement && (
                                          <div style={{ fontSize: '.78rem' }}>
                                            <span style={{ fontWeight: 600, color: 'var(--text-muted)', marginRight: '.3rem' }}>É:</span>
                                            {s.echauffement}
                                          </div>
                                        )}
                                        {s.corps && (
                                          <div style={{ fontSize: '.78rem' }}>
                                            <span style={{ fontWeight: 600, color: 'var(--text-muted)', marginRight: '.3rem' }}>Corps:</span>
                                            {s.corps}
                                          </div>
                                        )}
                                        {s.retour_au_calme && (
                                          <div style={{ fontSize: '.78rem' }}>
                                            <span style={{ fontWeight: 600, color: 'var(--text-muted)', marginRight: '.3rem' }}>RC:</span>
                                            {s.retour_au_calme}
                                          </div>
                                        )}
                                        {s.notes_coach && (
                                          <div style={{ fontSize: '.78rem', color: 'var(--primary)', fontStyle: 'italic' }}>
                                            💬 {s.notes_coach}
                                          </div>
                                        )}
                                        {completion?.comment && (
                                          <div style={{ fontSize: '.78rem', color: '#10B981', fontStyle: 'italic', borderTop: '1px solid var(--border)', paddingTop: '.35rem', marginTop: '.2rem' }}>
                                            Retour athlète : &quot;{completion.comment}&quot;
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {/* Inline edit form */}
                                    {isEditingThis && (
                                      <div style={{ padding: '0 .875rem .875rem' }}>
                                        <SessionEditForm
                                          session={s}
                                          onSave={updated => saveSession(week.numero, sIdx, updated)}
                                          onCancel={() => setEditingSession(null)}
                                        />
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </>
                )}
              </div>
            )}

            {/* ── RETOURS TAB ── */}
            {tab === 'retours' && (
              <div style={{ maxWidth: 800 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '.75rem', marginBottom: '1.5rem' }}>
                  <div className="stat-card stat-card--accent">
                    <div className="stat-value">{completions.length}</div>
                    <div className="stat-label">Séances réalisées</div>
                  </div>
                  <div className="stat-card stat-card--dark">
                    <div className="stat-value">{avgRpe}</div>
                    <div className="stat-label">RPE moyen</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value gradient-text">S{currentWeekNum}</div>
                    <div className="stat-label">Semaine actuelle</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                  {completions.map(c => {
                    const week    = plan?.plan_data?.semaines?.find(s => s.numero === c.week_number)
                    const session = week?.seances?.[c.session_index]
                    const rpeColor = !c.rpe ? 'var(--text-muted)' : c.rpe >= 8 ? '#EF4444' : c.rpe >= 6 ? '#F59E0B' : '#10B981'
                    return (
                      <div key={c.id} style={{ padding: '.875rem 1rem', background: 'var(--surface-2)', borderRadius: 'var(--radius)', display: 'flex', gap: '1rem' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '.875rem', marginBottom: '.1rem' }}>
                            {session?.titre || `Séance ${c.session_index + 1}`}
                          </div>
                          <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginBottom: '.25rem' }}>
                            Semaine {c.week_number}
                            {session ? ` · ${session.type} · ${session.duree_min} min` : ''}
                          </div>
                          {c.comment && (
                            <div style={{ fontSize: '.82rem', fontStyle: 'italic', color: 'var(--text)' }}>
                              💬 &quot;{c.comment}&quot;
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          {c.rpe && (
                            <div style={{ fontWeight: 700, color: rpeColor, fontSize: '1.1rem', lineHeight: 1 }}>
                              {c.rpe}/10
                            </div>
                          )}
                          <div style={{ color: 'var(--text-muted)', fontSize: '.72rem', marginTop: '.2rem' }}>
                            {new Date(c.completed_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {completions.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                      Aucun retour de séance.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── ALERTES TAB ── */}
            {tab === 'alertes' && (
              <div style={{ maxWidth: 800 }}>
                {profileAlerts.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>Aucune alerte récente.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
                    {profileAlerts.map(a => (
                      <div key={a.id} style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 'var(--radius)', padding: '.875rem 1rem' }}>
                        <div style={{ color: 'rgba(255,255,255,.85)', fontSize: '.875rem', lineHeight: 1.6 }}>
                          {a.content.replace('⚠️ [PROFIL] ', '')}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '.72rem', marginTop: '.3rem' }}>
                          {new Date(a.created_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </>
        )}
      </div>
    </div>
  )
}

// ─── Athletes list page ────────────────────────────────────────────────────────

export default function AdminAthletes() {
  const [athletes,   setAthletes]   = useState([])
  const [alertsMap,  setAlertsMap]  = useState({})
  const [filter,     setFilter]     = useState('all')
  const [search,     setSearch]     = useState('')
  const [selected,   setSelected]   = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [confirmDel, setConfirmDel] = useState(null)
  const [deleting,   setDeleting]   = useState(false)

  useEffect(() => { loadAthletes() }, [])

  async function deleteAthlete(athlete) {
    setDeleting(true)
    try {
      const res  = await fetch(`/api/admin/athlete/${athlete.id}`, { method: 'DELETE' })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error)
      setConfirmDel(null)
      await loadAthletes()
    } catch (err) {
      alert('Erreur suppression : ' + err.message)
    } finally {
      setDeleting(false)
    }
  }

  async function loadAthletes() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('profiles').select('*').eq('role', 'athlete').order('created_at', { ascending: false })
      setAthletes(data || [])
      if (data?.length) {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()
        const { data: alerts } = await supabase
          .from('messages').select('user_id')
          .like('content', '⚠️ [PROFIL]%').gte('created_at', sevenDaysAgo)
        const map = {}
        alerts?.forEach(a => { map[a.user_id] = true })
        setAlertsMap(map)
      }
    } finally {
      setLoading(false)
    }
  }

  function handleUpdated(updated) {
    setAthletes(prev => prev.map(a => a.id === updated.id ? updated : a))
    setSelected(updated)
  }

  const filtered = athletes.filter(a => {
    const matchFilter = filter === 'all' ||
      (filter === 'active'   && a.subscription_status === 'active') ||
      (filter === 'pending'  && a.profile_completed === false) ||
      (filter === 'inactive' && a.subscription_status !== 'active')
    const matchSearch = !search ||
      `${a.first_name} ${a.last_name} ${a.email}`.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  if (loading) return <LoadingSpinner fullPage />

  return (
    <div className="page">
      <h2 className="page-heading" style={{ marginBottom: '1.5rem' }}>Athlètes ({athletes.length})</h2>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {[
          { v: 'all',      l: 'Tous' },
          { v: 'active',   l: 'Actifs' },
          { v: 'pending',  l: 'Profil incomplet' },
          { v: 'inactive', l: 'Inactifs' },
        ].map(f => (
          <button key={f.v} onClick={() => setFilter(f.v)}
            className={`btn btn-sm ${filter === f.v ? 'btn-primary' : 'btn-ghost'}`}>
            {f.l}
          </button>
        ))}
        <input className="form-input" style={{ maxWidth: 220 }}
          placeholder="Rechercher…" value={search}
          onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Desktop table */}
      <div className="card athletes-table-desktop" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Athlète</th>
                <th>Objectif</th>
                <th>Niveau</th>
                <th>Statut</th>
                <th>Inscription</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                      <div className="chat-avatar" style={{ width: 32, height: 32, fontSize: '.8rem' }}>
                        {a.first_name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                          {a.first_name} {a.last_name}
                          {alertsMap[a.id] && (
                            <span style={{ background: '#EF4444', color: '#fff', borderRadius: 99, fontSize: '.65rem', fontWeight: 800, padding: '.1rem .45rem' }}>
                              ⚠️
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>{a.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{OBJECTIVE_LABELS[a.objective] || 'N/C'}</td>
                  <td>{LEVEL_LABELS[a.level] || 'N/C'}</td>
                  <td>
                    <span className={`badge ${a.subscription_status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                      {a.subscription_status === 'active' ? 'Actif' : a.subscription_status || 'Inactif'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '.875rem' }}>
                    {new Date(a.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '.4rem' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setSelected(a)}>
                        Voir →
                      </button>
                      <button className="btn btn-sm" onClick={() => setConfirmDel(a)}
                        style={{ background: 'var(--error)', color: '#fff', border: 'none' }}>
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Aucun athlète trouvé.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile card list */}
      <div className="athletes-mobile-list" style={{ display: 'none' }}>
        {filtered.map(a => (
          <div key={a.id} className="card"
            style={{ display: 'flex', alignItems: 'center', gap: '.875rem', padding: '.875rem 1rem', cursor: 'pointer' }}
            onClick={() => setSelected(a)}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div className="chat-avatar" style={{ width: 42, height: 42, fontSize: '1rem' }}>
                {a.first_name?.[0]?.toUpperCase()}
              </div>
              {alertsMap[a.id] && (
                <div style={{ position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: '50%', background: '#EF4444', border: '2px solid var(--bg)' }} />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {a.first_name} {a.last_name}
              </div>
              <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>
                {OBJECTIVE_LABELS[a.objective] || ''}{a.level ? ` · ${LEVEL_LABELS[a.level]}` : ''}
              </div>
            </div>
            <span className={`badge ${a.subscription_status === 'active' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '.65rem' }}>
              {a.subscription_status === 'active' ? '✓' : '—'}
            </span>
          </div>
        ))}
      </div>

      {/* Full-screen athlete panel */}
      {selected && (
        <AthleteDetailPanel
          athlete={selected}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
        />
      )}

      {/* Delete confirmation */}
      {confirmDel && (
        <div className="modal-overlay center" onClick={e => e.target === e.currentTarget && setConfirmDel(null)}>
          <div className="modal center-modal" style={{ maxWidth: 420 }}>
            <h3 style={{ marginBottom: '.75rem' }}>Supprimer cet athlète ?</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Tu vas supprimer définitivement <strong>{confirmDel.first_name} {confirmDel.last_name}</strong> et toutes ses données. Action <strong>irréversible</strong>.
            </p>
            <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDel(null)}>Annuler</button>
              <button className="btn btn-sm" disabled={deleting}
                style={{ background: 'var(--error)', color: '#fff', border: 'none' }}
                onClick={() => deleteAthlete(confirmDel)}>
                {deleting ? 'Suppression…' : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
