import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { OBJECTIVE_LABELS, LEVEL_LABELS } from '../../lib/utils'
import LoadingSpinner from '../../components/UI/LoadingSpinner'

// ─── Design tokens ─────────────────────────────────────────────────────────────
const TYPE_COLORS = {
  'fractionné': '#8B2FC9', 'vma': '#8B2FC9',
  'tempo': '#F59E0B', 'seuil': '#F59E0B',
  'endurance': '#10B981', 'sortie longue': '#10B981', 'footing': '#10B981',
  'renforcement': '#6B7280', 'repos': '#374151',
  'course intermédiaire': '#F97316', 'course': '#EF4444',
  'récupération': '#3B82F6', 'côtes': '#EC4899', 'progressif': '#6366F1',
}
function typeColor(type) {
  const t = (type || '').toLowerCase()
  for (const [k, v] of Object.entries(TYPE_COLORS)) if (t.includes(k)) return v
  return '#6B7280'
}

// ─── Profile fields ────────────────────────────────────────────────────────────
const PROFILE_FIELDS = [
  { lbl: 'Objectif',           key: 'objective',              type: 'select',
    opts: Object.entries(OBJECTIVE_LABELS), show: v => OBJECTIVE_LABELS[v] || '—' },
  { lbl: 'Niveau',             key: 'level',                  type: 'select',
    opts: Object.entries(LEVEL_LABELS), show: v => LEVEL_LABELS[v] || '—' },
  { lbl: 'VMA (km/h)',         key: 'vma',                    type: 'number',
    show: v => v ? `${v} km/h` : '—' },
  { lbl: 'VMA mesurée ?',      key: 'vma_known',              type: 'select',
    opts: [['true','Oui'],['false','Non']], show: v => v ? 'Oui' : 'Non' },
  { lbl: 'Chrono cible',       key: 'chrono_goal',            type: 'text',
    show: v => v || 'Progresser' },
  { lbl: 'Séances / sem.',     key: 'days_per_week',          type: 'number',
    show: v => v ? `${v} j/sem` : '—' },
  { lbl: 'Jours préférés',     key: 'preferred_days',         type: 'text',
    show: v => Array.isArray(v) ? v.join(', ') : v || '—' },
  { lbl: 'Date course',        key: 'race_date',              type: 'date',
    show: v => v ? new Date(v).toLocaleDateString('fr-FR') : '—' },
  { lbl: 'Course intermédiaire', key: 'intermediate_race_name', type: 'text',
    show: v => v || 'Aucune' },
  { lbl: 'Date course inter.', key: 'intermediate_race_date', type: 'date',
    show: v => v ? new Date(v).toLocaleDateString('fr-FR') : '—' },
  { lbl: 'Terrain',            key: 'training_terrain',       type: 'select',
    opts: [['','Non précisé'],['montagne','Montagne'],['semi_montagne','Semi-montagne'],['ville_plat','Ville/Plat']],
    show: v => ({montagne:'Montagne',semi_montagne:'Semi-montagne',ville_plat:'Ville/Plat'})[v] || '—' },
  { lbl: 'Blessures',          key: 'injuries',               type: 'text',
    show: v => v || 'Aucune' },
  { lbl: 'Forme actuelle',     key: 'current_form',           type: 'text',
    show: v => v || '—' },
  { lbl: 'Douleur cycle (j)',  key: 'period_pain_days',       type: 'number',
    show: v => v ? `${v} jour(s)` : '—' },
  { lbl: 'Meilleur chrono',    key: 'best_recent_time',       type: 'text',
    show: v => v || '—' },
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

// ─── Session edit form ────────────────────────────────────────────────────────
function SessionEditForm({ session, onSave, onCancel }) {
  const [v, setV] = useState({
    titre: session.titre || '', type: session.type || '',
    duree_min: session.duree_min ?? '', distance_km: session.distance_km ?? '',
    intensite: session.intensite || '', echauffement: session.echauffement || '',
    corps: session.corps || '', retour_au_calme: session.retour_au_calme || '',
    notes_coach: session.notes_coach || '', rpe_cible: session.rpe_cible ?? '',
  })
  const inp = { width:'100%', padding:'.4rem .7rem', border:'1px solid var(--border)', borderRadius:8,
    fontSize:'.83rem', fontFamily:'inherit', background:'var(--bg)', color:'var(--text)',
    outline:'none', boxSizing:'border-box' }
  const lbl = { fontSize:'.65rem', fontWeight:700, textTransform:'uppercase',
    letterSpacing:'.06em', color:'var(--text-muted)', marginBottom:'.2rem', display:'block' }
  const set = (k, val) => setV(p => ({ ...p, [k]: val }))
  const num = (k, fallback) => v[k] !== '' ? Number(v[k]) : fallback

  return (
    <div style={{ padding:'1rem', background:'var(--bg)', borderTop:'1px solid var(--border)' }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.6rem' }}>
        <div style={{ gridColumn:'1/-1' }}>
          <label style={lbl}>Titre</label>
          <input style={inp} value={v.titre} onChange={e => set('titre', e.target.value)} />
        </div>
        <div><label style={lbl}>Type</label><input style={inp} value={v.type} onChange={e => set('type', e.target.value)} /></div>
        <div><label style={lbl}>Intensité</label><input style={inp} value={v.intensite} onChange={e => set('intensite', e.target.value)} /></div>
        <div><label style={lbl}>Durée (min)</label><input style={inp} type="number" value={v.duree_min} onChange={e => set('duree_min', e.target.value)} /></div>
        <div><label style={lbl}>Distance (km)</label><input style={inp} type="number" step=".1" value={v.distance_km} onChange={e => set('distance_km', e.target.value)} /></div>
        <div><label style={lbl}>RPE cible</label><input style={inp} type="number" min="1" max="10" value={v.rpe_cible} onChange={e => set('rpe_cible', e.target.value)} /></div>
        <div style={{ gridColumn:'1/-1' }}><label style={lbl}>Échauffement</label>
          <textarea style={{ ...inp, resize:'vertical' }} rows={2} value={v.echauffement} onChange={e => set('echauffement', e.target.value)} /></div>
        <div style={{ gridColumn:'1/-1' }}><label style={lbl}>Corps de séance</label>
          <textarea style={{ ...inp, resize:'vertical' }} rows={5} value={v.corps} onChange={e => set('corps', e.target.value)} /></div>
        <div style={{ gridColumn:'1/-1' }}><label style={lbl}>Retour au calme</label>
          <textarea style={{ ...inp, resize:'vertical' }} rows={2} value={v.retour_au_calme} onChange={e => set('retour_au_calme', e.target.value)} /></div>
        <div style={{ gridColumn:'1/-1' }}><label style={lbl}>Note coach</label>
          <textarea style={{ ...inp, resize:'vertical' }} rows={3} value={v.notes_coach} onChange={e => set('notes_coach', e.target.value)} /></div>
      </div>
      <div style={{ display:'flex', gap:'.5rem', justifyContent:'flex-end', marginTop:'.875rem' }}>
        <button onClick={onCancel}
          style={{ padding:'.4rem .9rem', background:'none', border:'1px solid var(--border)', borderRadius:8,
            fontSize:'.82rem', cursor:'pointer', fontFamily:'inherit', color:'var(--text-muted)' }}>
          Annuler
        </button>
        <button onClick={() => onSave({ ...session, ...v, duree_min: num('duree_min', session.duree_min), distance_km: num('distance_km', session.distance_km), rpe_cible: num('rpe_cible', session.rpe_cible) })}
          style={{ padding:'.4rem 1rem', background:'var(--gradient)', color:'#fff', border:'none',
            borderRadius:8, fontWeight:700, fontSize:'.82rem', cursor:'pointer', fontFamily:'inherit' }}>
          ✓ Enregistrer
        </button>
      </div>
    </div>
  )
}

// ─── Session card (row only — click opens CoachSessionModal) ──────────────────
function SessionCard({ session, completion, weekNum, sessionIdx, onOpen }) {
  const color  = typeColor(session.type)
  const isRest = (session.type || '').toLowerCase().includes('repos')

  return (
    <div
      onClick={() => onOpen(session, weekNum, sessionIdx, completion)}
      style={{
        display:'flex', alignItems:'center', gap:'.75rem', padding:'.8rem 1rem',
        borderRadius:12, cursor:'pointer',
        background: isRest ? 'var(--surface-2)' : `${color}0D`,
        border: completion
          ? '1px solid rgba(16,185,129,.3)'
          : isRest ? '1px solid var(--border)' : `1px solid ${color}28`,
        transition:'box-shadow .15s, transform .1s',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow='var(--shadow)'; e.currentTarget.style.transform='translateY(-1px)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow='none'; e.currentTarget.style.transform='' }}
    >
      {/* Color bar */}
      <div style={{ width:4, height:44, borderRadius:2, background: isRest ? 'var(--border)' : color, flexShrink:0 }} />

      {/* Day */}
      <div style={{ flexShrink:0, minWidth:38, textAlign:'center' }}>
        <div style={{ fontSize:'.65rem', textTransform:'uppercase', letterSpacing:'.05em',
          color: isRest ? 'var(--text-muted)' : color, fontWeight:700 }}>
          {session.jour?.substring(0,3) || '—'}
        </div>
      </div>

      {/* Type badge */}
      <span style={{ flexShrink:0, fontSize:'.63rem', fontWeight:700, padding:'.18rem .55rem',
        borderRadius:20, background:`${color}20`, color, textTransform:'uppercase',
        letterSpacing:'.04em', whiteSpace:'nowrap' }}>
        {session.type}
      </span>

      {/* Title + meta */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:600, fontSize:'.875rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {session.titre}
        </div>
        <div style={{ fontSize:'.72rem', color:'var(--text-muted)', marginTop:'.1rem',
          display:'flex', gap:'.5rem', flexWrap:'wrap' }}>
          {session.duree_min > 0 && <span>{session.duree_min} min</span>}
          {session.distance_km != null && session.distance_km > 0 && <span>{session.distance_km} km</span>}
          {session.rpe_cible && <span>RPE {session.rpe_cible}/10</span>}
          {completion && <span style={{ color:'#10B981' }}>✓ fait · RPE {completion.rpe || '?'}</span>}
          {session.est_seance_cle && <span style={{ color:'#F59E0B' }}>★ clé</span>}
        </div>
      </div>

      {/* Chevron */}
      <span style={{ color:'var(--text-muted)', fontSize:'.9rem', flexShrink:0 }}>›</span>
    </div>
  )
}

// ─── Coach session modal (bottom sheet, style interface athlète) ───────────────
function CoachSessionModal({ session, weekNum, sessionIdx, completion, onClose, onSave }) {
  const [editing, setEditing] = useState(false)
  const color = typeColor(session.type)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  function PhaseArrow() {
    return (
      <div style={{ display:'flex', alignItems:'center', padding:'0 1.25rem', height:24 }}>
        <div style={{ width:1, height:'100%', background:'var(--border)', margin:'0 auto' }} />
      </div>
    )
  }

  return (
    <div
      style={{ position:'fixed', inset:0, zIndex:300,
        background:'rgba(0,0,0,.65)', backdropFilter:'blur(6px)',
        display:'flex', alignItems:'flex-end', justifyContent:'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <style>{`@keyframes slideUpSheet { from { transform:translateY(100%); } to { transform:translateY(0); } }`}</style>
      <div style={{
        width:'100%', maxWidth:720,
        background:'var(--surface)',
        borderRadius:'24px 24px 0 0',
        border:'1px solid var(--border)',
        maxHeight:'90vh', overflowY:'auto',
        animation:'slideUpSheet .3s cubic-bezier(0.32,0.72,0,1)',
      }}>

        {/* Handle */}
        <div style={{ display:'flex', justifyContent:'center', paddingTop:'.875rem', paddingBottom:'.25rem' }}>
          <div style={{ width:40, height:4, borderRadius:99, background:'rgba(255,255,255,.15)' }} />
        </div>

        {/* Header */}
        <div style={{ padding:'1rem 1.25rem 1.25rem', borderBottom:'1px solid var(--border)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'.625rem' }}>
            <span style={{
              display:'inline-block',
              background:`${color}18`, border:`1px solid ${color}40`,
              borderRadius:99, padding:'.2rem .75rem',
              fontSize:'.7rem', fontWeight:800, color,
              letterSpacing:'.08em', textTransform:'uppercase',
            }}>{session.type || 'Séance'}</span>
            <div style={{ display:'flex', gap:'.5rem', alignItems:'center' }}>
              {!editing && (
                <button onClick={() => setEditing(true)}
                  style={{ padding:'.35rem .8rem', background:'none', border:'1px solid var(--border)',
                    borderRadius:8, cursor:'pointer', fontFamily:'inherit', fontSize:'.75rem', color:'var(--text-muted)' }}>
                  ✏️ Modifier
                </button>
              )}
              <button onClick={onClose}
                style={{ padding:'.35rem .7rem', background:'none', border:'1px solid var(--border)',
                  borderRadius:8, cursor:'pointer', fontFamily:'inherit', fontSize:'.82rem', color:'var(--text-muted)' }}>
                ✕
              </button>
            </div>
          </div>

          <h3 style={{ fontSize:'1.1rem', fontWeight:700, lineHeight:1.25, marginBottom:'.35rem' }}>
            {session.titre}
          </h3>
          <p style={{ fontSize:'.8rem', color:'var(--text-muted)', marginBottom:'.875rem' }}>
            {session.jour && `📅 ${session.jour}`}
            {completion && (
              <span style={{ marginLeft:'.75rem', color:'#10B981', fontWeight:600 }}>
                ✓ Effectuée · RPE {completion.rpe || '?'}/10
              </span>
            )}
          </p>

          {/* Stats chips */}
          <div style={{ display:'flex', gap:'.4rem', flexWrap:'wrap' }}>
            {[
              session.duree_min > 0 ? { icon:'⏱', val:`${session.duree_min} min` } : null,
              session.distance_km > 0 ? { icon:'📍', val:`${session.distance_km} km` } : null,
              session.rpe_cible ? { icon:'💪', val:`RPE ${session.rpe_cible}` } : null,
              session.est_seance_cle ? { icon:'★', val:'Séance clé' } : null,
            ].filter(Boolean).map(({ icon, val }) => (
              <div key={val} style={{
                background:'var(--surface-2)', border:'1px solid var(--border)',
                borderRadius:99, padding:'.25rem .75rem',
                fontSize:'.78rem', fontWeight:600, display:'flex', alignItems:'center', gap:'.3rem',
              }}>
                <span>{icon}</span><span>{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        {!editing ? (
          <div style={{ padding:'1rem 1.25rem 2.5rem', display:'flex', flexDirection:'column', gap:'.75rem' }}>

            {/* Programme structuré */}
            {(session.echauffement || session.corps || session.retour_au_calme) && (
              <div style={{ background:'var(--bg)', borderRadius:16, overflow:'hidden', border:'1px solid var(--border)' }}>
                {session.echauffement && (
                  <div style={{ borderLeft:'3px solid #F59E0B', padding:'.875rem 1rem .875rem .875rem' }}>
                    <div style={{ fontSize:'.65rem', fontWeight:700, textTransform:'uppercase',
                      letterSpacing:'.08em', color:'#FCD34D', marginBottom:'.4rem' }}>🔥 Échauffement</div>
                    <p style={{ fontSize:'.85rem', lineHeight:1.65, color:'rgba(255,255,255,.75)' }}>{session.echauffement}</p>
                  </div>
                )}
                {session.echauffement && session.corps && <PhaseArrow />}
                {session.corps && (
                  <div style={{ borderLeft:`3px solid ${color}`, padding:'.875rem 1rem .875rem .875rem', background:`${color}06` }}>
                    <div style={{ fontSize:'.65rem', fontWeight:700, textTransform:'uppercase',
                      letterSpacing:'.08em', color, marginBottom:'.4rem' }}>⚡ Séance principale</div>
                    <p style={{ fontSize:'.85rem', lineHeight:1.65, color:'rgba(255,255,255,.75)', whiteSpace:'pre-line' }}>{session.corps}</p>
                  </div>
                )}
                {session.corps && session.retour_au_calme && <PhaseArrow />}
                {session.retour_au_calme && (
                  <div style={{ borderLeft:'3px solid #3B82F6', padding:'.875rem 1rem .875rem .875rem' }}>
                    <div style={{ fontSize:'.65rem', fontWeight:700, textTransform:'uppercase',
                      letterSpacing:'.08em', color:'#93C5FD', marginBottom:'.4rem' }}>❄️ Retour au calme</div>
                    <p style={{ fontSize:'.85rem', lineHeight:1.65, color:'rgba(255,255,255,.75)' }}>{session.retour_au_calme}</p>
                  </div>
                )}
              </div>
            )}

            {/* Notes coach */}
            {session.notes_coach && (
              <div style={{ background:'var(--bg)', border:'1px solid rgba(139,47,201,.25)',
                borderRadius:14, padding:'.875rem 1rem' }}>
                <div style={{ fontWeight:700, fontSize:'.65rem', textTransform:'uppercase',
                  letterSpacing:'.08em', color:'#C084FC', marginBottom:'.4rem' }}>Ma note</div>
                <p style={{ fontSize:'.85rem', lineHeight:1.7, fontStyle:'italic', color:'rgba(255,255,255,.82)' }}>
                  &ldquo;{session.notes_coach}&rdquo;
                </p>
              </div>
            )}

            {/* Retour athlète */}
            {completion?.comment && (
              <div style={{ background:'rgba(16,185,129,.07)', border:'1px solid rgba(16,185,129,.2)',
                borderRadius:14, padding:'.875rem 1rem' }}>
                <div style={{ fontWeight:700, fontSize:'.65rem', textTransform:'uppercase',
                  letterSpacing:'.08em', color:'#6EE7B7', marginBottom:'.4rem' }}>💬 Retour athlète</div>
                <p style={{ fontSize:'.85rem', lineHeight:1.7, color:'rgba(255,255,255,.82)' }}>
                  &ldquo;{completion.comment}&rdquo;
                </p>
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding:'1rem 1.25rem 2.5rem' }}>
            <SessionEditForm
              session={session}
              onSave={updated => { onSave(weekNum, sessionIdx, updated); onClose() }}
              onCancel={() => setEditing(false)}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Full-screen athlete panel ─────────────────────────────────────────────────
function AthleteDetailPanel({ athlete, onClose, onUpdated, onAlertDismissed }) {
  const [completions,   setCompletions]   = useState([])
  const [plan,          setPlan]          = useState(null)
  const [alerts,        setAlerts]        = useState([])
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
  const [sessionSaving, setSessionSaving] = useState(false)
  const [openSession,   setOpenSession]   = useState(null)

  const currentWeekNum = getCurrentWeekNum(plan)

  useEffect(() => { loadDetail() }, [])

  async function loadDetail() {
    setLoading(true)
    try {
      const [{ data: c }, { data: p }, { data: al }] = await Promise.all([
        supabase.from('session_completions').select('*').eq('user_id', athlete.id)
          .order('completed_at', { ascending: false }),
        supabase.from('training_plans').select('*').eq('user_id', athlete.id)
          .in('status', ['active','pending']).order('created_at', { ascending: false }).limit(1).single(),
        supabase.from('messages').select('*').eq('user_id', athlete.id)
          .like('content', '⚠️ [PROFIL]%').order('created_at', { ascending: false }).limit(30),
      ])
      setCompletions(c || [])
      setPlan(p)
      setAlerts(al || [])
    } finally {
      setLoading(false)
    }
  }

  async function dismissAlert(alertId) {
    await supabase.from('messages').delete().eq('id', alertId)
    const next = alerts.filter(a => a.id !== alertId)
    setAlerts(next)
    if (next.length === 0) onAlertDismissed?.(athlete.id)
  }

  async function generatePlan() {
    setGenerating(true); setGenerateMsg('')
    try {
      const res = await fetch('/api/plans/generate', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ userId: athlete.id, profile: local, clientDate: new Date().toISOString().split('T')[0] }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Erreur')
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
      setLocal(updated); onUpdated?.(updated); setEditField(null)
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
        week.volume_total_km = Math.round(week.seances.reduce((s, x) => s + (x.distance_km || 0), 0) * 10) / 10
      }
      const { error } = await supabase.from('training_plans').update({ plan_data: updatedPlan }).eq('id', plan.id)
      if (error) throw error
      setPlan(p => ({ ...p, plan_data: updatedPlan }))
    } catch (err) {
      alert('Erreur : ' + err.message)
    } finally {
      setSessionSaving(false)
    }
  }

  const inp = { width:'100%', padding:'.4rem .7rem', border:'1.5px solid var(--primary)',
    borderRadius:8, fontSize:'.875rem', fontFamily:'inherit', background:'var(--bg)',
    color:'var(--text)', outline:'none', boxSizing:'border-box' }

  const avgRpe = (() => {
    const rpes = completions.filter(c => c.rpe).map(c => c.rpe)
    return rpes.length ? (rpes.reduce((a,b) => a+b,0) / rpes.length).toFixed(1) : 'N/A'
  })()

  const TABS = [
    { v:'profile',  l:'👤 Profil' },
    { v:'plan',     l:`📋 Plan${plan ? ` · S${currentWeekNum}` : ''}` },
    { v:'retours',  l:`📊 Retours (${completions.length})` },
    ...(alerts.length > 0 ? [{ v:'alertes', l:`⚠️ Alertes (${alerts.length})` }] : []),
  ]

  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, background:'var(--bg)', display:'flex', flexDirection:'column' }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ background:'var(--surface)', borderBottom:'1px solid var(--border)',
        padding:'1rem 1.5rem', display:'flex', alignItems:'center', gap:'1rem', flexShrink:0 }}>
        <button onClick={onClose}
          style={{ padding:'.38rem .75rem', background:'none', border:'1px solid var(--border)',
            borderRadius:8, cursor:'pointer', fontFamily:'inherit', color:'var(--text-muted)', fontSize:'.82rem' }}>
          ← Retour
        </button>
        <div className="chat-avatar" style={{ width:42, height:42, fontSize:'1.05rem', flexShrink:0 }}>
          {local.first_name?.[0]?.toUpperCase()}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:700, fontSize:'1.05rem', display:'flex', alignItems:'center', gap:'.5rem' }}>
            {local.first_name} {local.last_name}
            {alerts.length > 0 && (
              <span style={{ background:'#EF4444', color:'#fff', borderRadius:99,
                fontSize:'.6rem', fontWeight:800, padding:'.1rem .4rem' }}>
                {alerts.length} alerte{alerts.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div style={{ fontSize:'.78rem', color:'var(--text-muted)' }}>
            {local.email} · {OBJECTIVE_LABELS[local.objective] || '—'} · {LEVEL_LABELS[local.level] || '—'}
          </div>
        </div>
        <div style={{ display:'flex', gap:'.4rem', flexShrink:0, flexWrap:'wrap' }}>
          <span className={`badge ${local.subscription_status === 'active' ? 'badge-success' : 'badge-warning'}`}>
            {local.subscription_status === 'active' ? '✓ Actif' : 'Inactif'}
          </span>
          {plan && <span className={`badge ${plan.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
            Plan {plan.status === 'active' ? 'actif' : 'en attente'}
          </span>}
          {local.heat_mode && <span className="badge" style={{ background:'rgba(245,158,11,.12)', color:'#FCD34D' }}>🌡️</span>}
          {local.injury_mode && <span className="badge" style={{ background:'rgba(239,68,68,.12)', color:'#FCA5A5' }}>🩹</span>}
        </div>
      </div>

      {/* ── Tab bar ────────────────────────────────────────── */}
      <div style={{ background:'var(--surface)', borderBottom:'1px solid var(--border)',
        display:'flex', overflowX:'auto', flexShrink:0 }}>
        {TABS.map(t => (
          <button key={t.v} onClick={() => setTab(t.v)}
            style={{ padding:'.7rem 1.2rem', border:'none', background:'none', cursor:'pointer',
              fontFamily:'inherit', fontWeight:600, fontSize:'.82rem', whiteSpace:'nowrap',
              borderBottom: tab === t.v ? '2px solid var(--primary)' : '2px solid transparent',
              color: tab === t.v ? 'var(--primary)' : 'var(--text-muted)' }}>
            {t.l}
          </button>
        ))}
      </div>

      {/* ── Content ────────────────────────────────────────── */}
      <div style={{ flex:1, overflowY:'auto' }}>
        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:'3rem' }}>
            <LoadingSpinner />
          </div>
        ) : (

          <>
            {/* ══════════ PROFIL ══════════ */}
            {tab === 'profile' && (
              <div style={{ maxWidth:960, margin:'0 auto', padding:'1.5rem' }}>

                {/* Field grid */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'.65rem', marginBottom:'1.25rem' }}>
                  {PROFILE_FIELDS.map(f => (
                    <div key={f.key}
                      style={{ background: editField === f.key ? 'var(--surface)' : 'var(--surface-2)',
                        padding:'.875rem', borderRadius:12,
                        border: editField === f.key ? '2px solid var(--primary)' : '1px solid var(--border)',
                        cursor: editField === f.key ? 'default' : 'pointer',
                        transition:'border-color .15s' }}
                      onClick={() => editField !== f.key && startEdit(f.key)}>
                      <div style={{ fontSize:'.62rem', fontWeight:700, textTransform:'uppercase',
                        letterSpacing:'.06em', color: editField === f.key ? 'var(--primary)' : 'var(--text-muted)',
                        marginBottom:'.3rem' }}>
                        {f.lbl}
                      </div>
                      {editField === f.key ? (
                        <div onClick={e => e.stopPropagation()}>
                          {f.type === 'select' ? (
                            <select value={editVal} onChange={e => setEditVal(e.target.value)} style={inp} autoFocus>
                              {f.opts.map(([k,val]) => <option key={k} value={k}>{val}</option>)}
                            </select>
                          ) : (
                            <input type={f.type} value={editVal} onChange={e => setEditVal(e.target.value)}
                              style={inp} autoFocus
                              onKeyDown={e => { if (e.key === 'Enter') saveField(); if (e.key === 'Escape') setEditField(null) }} />
                          )}
                          <div style={{ display:'flex', gap:'.35rem', marginTop:'.5rem' }}>
                            <button onClick={saveField} disabled={editSaving}
                              style={{ padding:'.28rem .65rem', background:'var(--gradient)', color:'#fff',
                                border:'none', borderRadius:6, fontWeight:700, fontSize:'.75rem',
                                cursor:'pointer', fontFamily:'inherit' }}>
                              {editSaving ? '…' : '✓'}
                            </button>
                            <button onClick={() => setEditField(null)}
                              style={{ padding:'.28rem .55rem', background:'none',
                                border:'1px solid var(--border)', borderRadius:6, fontSize:'.75rem',
                                cursor:'pointer', fontFamily:'inherit', color:'var(--text-muted)' }}>
                              ✕
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontWeight:600, fontSize:'.9rem' }}>{f.show(local[f.key])}</div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Note coach */}
                <div style={{ background: editMsg ? 'var(--surface)' : 'var(--surface-2)',
                  padding:'.875rem', borderRadius:12, marginBottom:'1.25rem',
                  border: editMsg ? '2px solid var(--primary)' : '1px solid var(--border)', cursor: editMsg ? 'default' : 'pointer' }}
                  onClick={() => !editMsg && setEditMsg(true)}>
                  <div style={{ fontSize:'.62rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em',
                    color: editMsg ? 'var(--primary)' : 'var(--text-muted)', marginBottom:'.3rem' }}>
                    Note coach
                  </div>
                  {editMsg ? (
                    <div onClick={e => e.stopPropagation()}>
                      <textarea value={msgVal} onChange={e => setMsgVal(e.target.value)}
                        rows={4} autoFocus style={{ ...inp, resize:'vertical' }} />
                      <div style={{ display:'flex', gap:'.4rem', marginTop:'.5rem' }}>
                        <button onClick={saveCoachMessage} disabled={editSaving}
                          style={{ padding:'.3rem .75rem', background:'var(--gradient)', color:'#fff',
                            border:'none', borderRadius:7, fontWeight:700, fontSize:'.78rem', cursor:'pointer', fontFamily:'inherit' }}>
                          {editSaving ? '…' : '✓ Enregistrer'}
                        </button>
                        <button onClick={() => setEditMsg(false)}
                          style={{ padding:'.3rem .65rem', background:'none', border:'1px solid var(--border)',
                            borderRadius:7, fontSize:'.78rem', cursor:'pointer', fontFamily:'inherit', color:'var(--text-muted)' }}>
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize:'.875rem', fontStyle: local.coach_message ? 'italic' : 'normal',
                      color: local.coach_message ? 'var(--text)' : 'var(--text-muted)' }}>
                      {local.coach_message || 'Ajouter une note…'}
                    </div>
                  )}
                </div>

                {/* Generate */}
                <div style={{ borderTop:'1px solid var(--border)', paddingTop:'1rem' }}>
                  {generateMsg && (
                    <div className={`alert ${generateMsg.startsWith('Erreur') ? 'alert-error' : 'alert-success'}`}
                      style={{ marginBottom:'.75rem' }}>
                      {generateMsg.startsWith('Erreur') ? '⚠️' : '✅'} {generateMsg}
                    </div>
                  )}
                  {!plan ? (
                    <button className="btn btn-primary" onClick={generatePlan} disabled={generating}>
                      {generating ? <><div className="spinner spinner-sm" /> Génération… (30-60s)</> : '🤖 Générer un plan personnalisé'}
                    </button>
                  ) : (
                    <button className="btn btn-ghost btn-sm" onClick={generatePlan} disabled={generating}>
                      {generating ? <><div className="spinner spinner-sm" /> Génération…</> : '↺ Regénérer le plan'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ══════════ PLAN ══════════ */}
            {tab === 'plan' && (
              <div style={{ maxWidth:900, margin:'0 auto', padding:'1.5rem' }}>
                {!plan ? (
                  <div style={{ textAlign:'center', padding:'4rem 2rem', color:'var(--text-muted)' }}>
                    <div style={{ fontSize:'2rem', marginBottom:'.75rem' }}>📋</div>
                    <p>Aucun plan. Génère-en un dans l'onglet Profil.</p>
                  </div>
                ) : (
                  <>
                    {/* Month message */}
                    {plan.plan_data?.message_du_mois && (
                      <div style={{ background:'var(--surface)', border:'1px solid var(--border)',
                        borderLeft:'4px solid var(--primary)', borderRadius:12, padding:'1rem 1.25rem',
                        marginBottom:'1.5rem', fontSize:'.875rem', fontStyle:'italic',
                        lineHeight:1.7, color:'var(--text)' }}>
                        {plan.plan_data.message_du_mois}
                      </div>
                    )}

                    {/* Weeks */}
                    {(plan.plan_data?.semaines || []).map(week => {
                      const isCurrent  = week.numero === currentWeekNum
                      const weekComps  = completions.filter(c => c.week_number === week.numero)
                      const totalSess  = (week.seances || []).length
                      const progress   = totalSess > 0 ? weekComps.length / totalSess : 0
                      const adaptedTag = { heat:'🌡️ Canicule', injury:'🩹 Blessure', cycle:'🌸 Cycle' }[week._adapted_for] || null

                      return (
                        <div key={week.numero} style={{ marginBottom:'1.25rem' }}>
                          {/* Week header — couleur distincte des cartes de séance */}
                          <div style={{
                            background: isCurrent
                              ? 'linear-gradient(135deg, #0F172A, #1E1B4B)'
                              : 'var(--surface)',
                            border: isCurrent ? '2px solid rgba(139,47,201,.45)' : '1px solid var(--border)',
                            borderRadius:12, padding:'1rem 1.25rem', marginBottom:'.5rem',
                            boxShadow: isCurrent ? '0 4px 24px rgba(139,47,201,.18)' : 'none' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:'.75rem', flexWrap:'wrap' }}>
                              <div style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
                                <span style={{ fontWeight:800, fontSize:'1rem' }}>S{week.numero}</span>
                                {isCurrent && (
                                  <span style={{ fontSize:'.6rem', fontWeight:800, background:'var(--gradient)',
                                    color:'#fff', padding:'.15rem .45rem', borderRadius:6 }}>
                                    EN COURS
                                  </span>
                                )}
                                {adaptedTag && (
                                  <span style={{ fontSize:'.68rem', padding:'.1rem .4rem', borderRadius:6,
                                    background:'rgba(255,255,255,.06)', color:'var(--text-muted)' }}>
                                    {adaptedTag}
                                  </span>
                                )}
                              </div>
                              <div style={{ flex:1 }}>
                                <div style={{ fontSize:'.8rem', fontWeight:600 }}>{week.dates?.label || ''}</div>
                                <div style={{ fontSize:'.72rem', color:'var(--text-muted)', marginTop:'.1rem' }}>
                                  {week.phase} · Charge {week.charge} · {week.volume_total_km ?? '—'} km
                                </div>
                              </div>
                              {/* Progress */}
                              <div style={{ textAlign:'right', flexShrink:0 }}>
                                <div style={{ fontSize:'.75rem', fontWeight:700,
                                  color: weekComps.length >= totalSess && totalSess > 0 ? '#10B981' : 'var(--text-muted)' }}>
                                  {weekComps.length} / {totalSess} ✓
                                </div>
                                <div style={{ width:60, height:4, background:'var(--border)', borderRadius:2, marginTop:'.25rem' }}>
                                  <div style={{ width:`${progress*100}%`, height:'100%',
                                    background:'var(--gradient)', borderRadius:2, transition:'width .3s' }} />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Sessions — chaque séance a sa propre couleur */}
                          <div style={{ display:'flex', flexDirection:'column', gap:'.4rem', paddingLeft:'.5rem' }}>
                            {(week.seances || []).map((s, sIdx) => (
                              <SessionCard
                                key={sIdx}
                                session={s}
                                completion={weekComps.find(c => c.session_index === sIdx)}
                                weekNum={week.numero}
                                sessionIdx={sIdx}
                                onOpen={(session, weekNum, sessionIdx, completion) =>
                                  setOpenSession({ session, weekNum, sessionIdx, completion })}
                              />
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </>
                )}
              </div>
            )}

            {/* ══════════ RETOURS ══════════ */}
            {tab === 'retours' && (
              <div style={{ maxWidth:700, margin:'0 auto', padding:'1.5rem' }}>
                {/* Stats */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'.75rem', marginBottom:'1.5rem' }}>
                  {[
                    { val: completions.length, lbl: 'Séances réalisées', cls: 'stat-card--accent' },
                    { val: avgRpe, lbl: 'RPE moyen', cls: 'stat-card--dark' },
                    { val: `S${currentWeekNum}`, lbl: 'Semaine actuelle', cls: '' },
                  ].map((s, i) => (
                    <div key={i} className={`stat-card ${s.cls}`}>
                      <div className="stat-value" style={!s.cls ? { background:'var(--gradient)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' } : {}}>
                        {s.val}
                      </div>
                      <div className="stat-label">{s.lbl}</div>
                    </div>
                  ))}
                </div>

                {/* List */}
                <div style={{ display:'flex', flexDirection:'column', gap:'.5rem' }}>
                  {completions.map(c => {
                    const week    = plan?.plan_data?.semaines?.find(s => s.numero === c.week_number)
                    const session = week?.seances?.[c.session_index]
                    const rpe     = c.rpe
                    const rpeColor = !rpe ? 'var(--text-muted)' : rpe >= 8 ? '#EF4444' : rpe >= 6 ? '#F59E0B' : '#10B981'
                    const color   = typeColor(session?.type)
                    return (
                      <div key={c.id} style={{ background:'var(--surface-2)', borderRadius:12,
                        display:'flex', gap:'.875rem', overflow:'hidden',
                        border:'1px solid var(--border)' }}>
                        {session && <div style={{ width:3, background: color, flexShrink:0 }} />}
                        <div style={{ flex:1, padding:'.875rem .875rem .875rem 0', minWidth:0 }}>
                          <div style={{ fontWeight:600, fontSize:'.875rem', marginBottom:'.1rem' }}>
                            {session?.titre || `Séance ${c.session_index + 1}`}
                          </div>
                          <div style={{ fontSize:'.72rem', color:'var(--text-muted)' }}>
                            Sem. {c.week_number}{session ? ` · ${session.type} · ${session.duree_min} min` : ''}
                          </div>
                          {c.comment && (
                            <div style={{ marginTop:'.35rem', fontSize:'.8rem', fontStyle:'italic', color:'var(--text)' }}>
                              💬 &quot;{c.comment}&quot;
                            </div>
                          )}
                        </div>
                        <div style={{ padding:'.875rem', textAlign:'right', flexShrink:0 }}>
                          {rpe && <div style={{ fontWeight:800, fontSize:'1.1rem', color: rpeColor }}>{rpe}/10</div>}
                          <div style={{ color:'var(--text-muted)', fontSize:'.7rem', marginTop:'.15rem' }}>
                            {new Date(c.completed_at).toLocaleDateString('fr-FR', { day:'numeric', month:'short' })}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {completions.length === 0 && (
                    <div style={{ textAlign:'center', padding:'3rem', color:'var(--text-muted)' }}>
                      Aucun retour de séance.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ══════════ ALERTES ══════════ */}
            {tab === 'alertes' && (
              <div style={{ maxWidth:700, margin:'0 auto', padding:'1.5rem' }}>
                <p style={{ fontSize:'.82rem', color:'var(--text-muted)', marginBottom:'1rem' }}>
                  Clique sur ✓ pour marquer une alerte comme lue et la supprimer.
                </p>
                {alerts.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'3rem', color:'var(--text-muted)' }}>
                    Aucune alerte en attente.
                  </div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:'.65rem' }}>
                    {alerts.map(a => (
                      <div key={a.id} style={{ background:'rgba(239,68,68,.07)',
                        border:'1px solid rgba(239,68,68,.2)', borderRadius:12,
                        padding:'.875rem 1rem', display:'flex', gap:'1rem', alignItems:'flex-start' }}>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:'.875rem', lineHeight:1.6, color:'rgba(255,255,255,.85)' }}>
                            {a.content.replace('⚠️ [PROFIL] ', '')}
                          </div>
                          <div style={{ fontSize:'.7rem', color:'var(--text-muted)', marginTop:'.3rem' }}>
                            {new Date(a.created_at).toLocaleString('fr-FR', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                          </div>
                        </div>
                        <button onClick={() => dismissAlert(a.id)}
                          style={{ padding:'.35rem .7rem', background:'rgba(16,185,129,.15)',
                            border:'1px solid rgba(16,185,129,.3)', borderRadius:8,
                            color:'#6EE7B7', fontWeight:700, fontSize:'.75rem',
                            cursor:'pointer', fontFamily:'inherit', flexShrink:0 }}>
                          ✓ Lu
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </>
        )}
      </div>

      {/* ── Coach session modal ─────────────────────────────── */}
      {openSession && (
        <CoachSessionModal
          session={openSession.session}
          weekNum={openSession.weekNum}
          sessionIdx={openSession.sessionIdx}
          completion={openSession.completion}
          onClose={() => setOpenSession(null)}
          onSave={(wn, si, updated) => { saveSession(wn, si, updated); setOpenSession(null) }}
        />
      )}
    </div>
  )
}

// ─── Athletes list ─────────────────────────────────────────────────────────────
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

  async function deleteAthlete(a) {
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/athlete/${a.id}`, { method:'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error)
      setConfirmDel(null)
      await loadAthletes()
    } catch (err) {
      alert('Erreur : ' + err.message)
    } finally {
      setDeleting(false)
    }
  }

  async function loadAthletes() {
    setLoading(true)
    try {
      const { data } = await supabase.from('profiles').select('*')
        .eq('role','athlete').order('created_at', { ascending:false })
      setAthletes(data || [])
      if (data?.length) {
        const cutoff = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()
        const { data: al } = await supabase.from('messages').select('user_id')
          .like('content','⚠️ [PROFIL]%').gte('created_at', cutoff)
        const map = {}
        al?.forEach(a => { map[a.user_id] = true })
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

  function handleAlertDismissed(athleteId) {
    setAlertsMap(prev => { const next = { ...prev }; delete next[athleteId]; return next })
  }

  const filtered = athletes.filter(a => {
    const mf = filter === 'all' || (filter === 'active' && a.subscription_status === 'active') ||
               (filter === 'pending' && !a.profile_completed) || (filter === 'inactive' && a.subscription_status !== 'active')
    const ms = !search || `${a.first_name} ${a.last_name} ${a.email}`.toLowerCase().includes(search.toLowerCase())
    return mf && ms
  })

  if (loading) return <LoadingSpinner fullPage />

  return (
    <div className="page">
      <h2 className="page-heading" style={{ marginBottom:'1.5rem' }}>Athlètes ({athletes.length})</h2>

      <div style={{ display:'flex', gap:'.5rem', marginBottom:'1rem', flexWrap:'wrap' }}>
        {[{v:'all',l:'Tous'},{v:'active',l:'Actifs'},{v:'pending',l:'Incomplets'},{v:'inactive',l:'Inactifs'}].map(f => (
          <button key={f.v} onClick={() => setFilter(f.v)} className={`btn btn-sm ${filter === f.v ? 'btn-primary' : 'btn-ghost'}`}>{f.l}</button>
        ))}
        <input className="form-input" style={{ maxWidth:220 }} placeholder="Rechercher…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Desktop table */}
      <div className="card athletes-table-desktop" style={{ padding:0, overflow:'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Athlète</th><th>Objectif</th><th>Niveau</th><th>Statut</th><th>Inscription</th><th></th></tr></thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:'.75rem' }}>
                      <div className="chat-avatar" style={{ width:32, height:32, fontSize:'.8rem' }}>
                        {a.first_name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight:600, display:'flex', alignItems:'center', gap:'.4rem' }}>
                          {a.first_name} {a.last_name}
                          {alertsMap[a.id] && (
                            <span style={{ background:'#EF4444', color:'#fff', borderRadius:99, fontSize:'.6rem', fontWeight:800, padding:'.1rem .4rem' }}>!</span>
                          )}
                        </div>
                        <div style={{ fontSize:'.8rem', color:'var(--text-muted)' }}>{a.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{OBJECTIVE_LABELS[a.objective] || '—'}</td>
                  <td>{LEVEL_LABELS[a.level] || '—'}</td>
                  <td><span className={`badge ${a.subscription_status === 'active' ? 'badge-success' : 'badge-warning'}`}>{a.subscription_status === 'active' ? 'Actif' : a.subscription_status || 'Inactif'}</span></td>
                  <td style={{ color:'var(--text-muted)', fontSize:'.875rem' }}>{new Date(a.created_at).toLocaleDateString('fr-FR')}</td>
                  <td>
                    <div style={{ display:'flex', gap:'.4rem' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setSelected(a)}>Voir →</button>
                      <button className="btn btn-sm" onClick={() => setConfirmDel(a)}
                        style={{ background:'var(--error)', color:'#fff', border:'none' }}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan={6} style={{ textAlign:'center', color:'var(--text-muted)', padding:'2rem' }}>Aucun athlète trouvé.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile list */}
      <div className="athletes-mobile-list" style={{ display:'none' }}>
        {filtered.map(a => (
          <div key={a.id} className="card"
            style={{ display:'flex', alignItems:'center', gap:'.875rem', padding:'.875rem 1rem', cursor:'pointer' }}
            onClick={() => setSelected(a)}>
            <div style={{ position:'relative', flexShrink:0 }}>
              <div className="chat-avatar" style={{ width:42, height:42, fontSize:'1rem' }}>{a.first_name?.[0]?.toUpperCase()}</div>
              {alertsMap[a.id] && <div style={{ position:'absolute', top:-2, right:-2, width:10, height:10, borderRadius:'50%', background:'#EF4444', border:'2px solid var(--bg)' }} />}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:600, fontSize:'.9rem' }}>{a.first_name} {a.last_name}</div>
              <div style={{ fontSize:'.72rem', color:'var(--text-muted)' }}>{OBJECTIVE_LABELS[a.objective] || ''}{a.level ? ` · ${LEVEL_LABELS[a.level]}` : ''}</div>
            </div>
            <span className={`badge ${a.subscription_status === 'active' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize:'.65rem' }}>
              {a.subscription_status === 'active' ? '✓' : '—'}
            </span>
          </div>
        ))}
      </div>

      {/* Panel */}
      {selected && (
        <AthleteDetailPanel
          athlete={selected}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
          onAlertDismissed={handleAlertDismissed}
        />
      )}

      {/* Delete confirm */}
      {confirmDel && (
        <div className="modal-overlay center" onClick={e => e.target === e.currentTarget && setConfirmDel(null)}>
          <div className="modal center-modal" style={{ maxWidth:420 }}>
            <h3 style={{ marginBottom:'.75rem' }}>Supprimer cet athlète ?</h3>
            <p style={{ color:'var(--text-muted)', marginBottom:'1.5rem', lineHeight:1.6 }}>
              Suppression définitive de <strong>{confirmDel.first_name} {confirmDel.last_name}</strong> et toutes ses données. Action <strong>irréversible</strong>.
            </p>
            <div style={{ display:'flex', gap:'.75rem', justifyContent:'flex-end' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDel(null)}>Annuler</button>
              <button className="btn btn-sm" disabled={deleting}
                style={{ background:'var(--error)', color:'#fff', border:'none' }}
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
