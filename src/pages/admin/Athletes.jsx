import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { OBJECTIVE_LABELS, LEVEL_LABELS } from '../../lib/utils'
import LoadingSpinner from '../../components/UI/LoadingSpinner'

const PROFILE_FIELDS = [
  { lbl: 'Objectif',      key: 'objective',     type: 'select',
    options: Object.entries(OBJECTIVE_LABELS),
    display: v => OBJECTIVE_LABELS[v] || 'N/C' },
  { lbl: 'Niveau',        key: 'level',         type: 'select',
    options: Object.entries(LEVEL_LABELS),
    display: v => LEVEL_LABELS[v] || 'N/C' },
  { lbl: 'VMA (km/h)',    key: 'vma',           type: 'number',
    display: v => v ? `${v} km/h` : '—' },
  { lbl: 'Chrono cible',  key: 'chrono_goal',   type: 'text',
    display: v => v || 'Progresser' },
  { lbl: 'Jours / sem.',  key: 'days_per_week', type: 'number',
    display: v => v ? `${v} j/sem` : '—' },
  { lbl: 'Date course',   key: 'race_date',     type: 'date',
    display: v => v ? new Date(v).toLocaleDateString('fr-FR') : 'Non définie' },
  { lbl: 'Blessures',     key: 'injuries',      type: 'text',
    display: v => v || 'Aucune' },
  { lbl: 'Forme actuelle',key: 'current_form',  type: 'text',
    display: v => v || 'N/C' },
]

function AthleteDetailModal({ athlete, onClose, onUpdated }) {
  const [completions,     setCompletions]     = useState([])
  const [plan,            setPlan]            = useState(null)
  const [profileAlerts,   setProfileAlerts]   = useState([])
  const [loading,         setLoading]         = useState(true)
  const [tab,             setTab]             = useState('profile')
  const [generating,   setGenerating]   = useState(false)
  const [generateMsg,  setGenerateMsg]  = useState('')
  const [local,        setLocal]        = useState(athlete)
  const [editField,    setEditField]    = useState(null)
  const [editVal,      setEditVal]      = useState('')
  const [editSaving,   setEditSaving]   = useState(false)
  const [editMsg,      setEditMsg]      = useState(false)
  const [msgVal,       setMsgVal]       = useState(athlete.coach_message || '')

  async function generatePlan() {
    setGenerating(true)
    setGenerateMsg('')
    try {
      const res  = await fetch('/api/plans/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: athlete.id, profile: local })
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Erreur génération')
      setGenerateMsg('Plan généré ! Va dans "Plans" pour le valider.')
      await loadDetail()
    } catch (err) {
      setGenerateMsg('Erreur : ' + err.message)
    } finally {
      setGenerating(false)
    }
  }

  useEffect(() => { loadDetail() }, [])

  async function loadDetail() {
    setLoading(true)
    try {
      const [{ data: c }, { data: p }, { data: alerts }] = await Promise.all([
        supabase.from('session_completions').select('*').eq('user_id', athlete.id).order('completed_at', { ascending: false }),
        supabase.from('training_plans').select('*').eq('user_id', athlete.id).order('created_at', { ascending: false }).limit(1).single(),
        supabase.from('messages').select('*').eq('user_id', athlete.id).like('content', '⚠️ [PROFIL]%').order('created_at', { ascending: false }).limit(20),
      ])
      setCompletions(c || [])
      setPlan(p)
      setProfileAlerts(alerts || [])
    } finally {
      setLoading(false)
    }
  }

  function startEdit(field) {
    const f = PROFILE_FIELDS.find(f => f.key === field)
    setEditField(field)
    setEditVal(local[field] ?? '')
    // For date, format to YYYY-MM-DD for the input
    if (f?.type === 'date' && local[field]) {
      setEditVal(local[field].split('T')[0])
    }
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
      setLocal(updated)
      onUpdated?.(updated)
      setEditMsg(false)
    } catch (err) {
      alert('Erreur : ' + err.message)
    } finally {
      setEditSaving(false)
    }
  }

  const avgRpe = completions.filter(c => c.rpe).length > 0
    ? (completions.filter(c => c.rpe).reduce((a, c) => a + c.rpe, 0) / completions.filter(c => c.rpe).length).toFixed(1)
    : 'N/A'

  const inputStyle = {
    width: '100%', padding: '.4rem .65rem', border: '1.5px solid var(--primary)',
    borderRadius: 'var(--radius)', fontSize: '.875rem', fontFamily: 'inherit',
    background: 'var(--bg)', color: 'var(--text)', outline: 'none'
  }

  return (
    <div className="modal-overlay center" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal center-modal" style={{ maxWidth: 640 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="chat-avatar" style={{ width: 50, height: 50, fontSize: '1.2rem' }}>
              {local.first_name?.[0]?.toUpperCase()}
            </div>
            <div>
              <h3>{local.first_name} {local.last_name}</h3>
              <div style={{ fontSize: '.875rem', color: 'var(--text-muted)' }}>{local.email}</div>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '.25rem', borderBottom: '1px solid var(--border)', marginBottom: '1.25rem' }}>
          {['profile', 'historique'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: '.5rem 1rem', border: 'none', background: 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontWeight: 600, fontSize: '.875rem',
                borderBottom: tab === t ? '2px solid var(--primary)' : '2px solid transparent',
                color: tab === t ? 'var(--primary)' : 'var(--text-muted)',
                position: 'relative' }}>
              {t === 'profile' ? '👤 Profil' : '📊 Historique'}
              {t === 'historique' && profileAlerts.length > 0 && (
                <span style={{
                  position: 'absolute', top: 4, right: 2,
                  width: 8, height: 8, borderRadius: '50%',
                  background: '#EF4444', border: '1.5px solid var(--bg)',
                }} />
              )}
            </button>
          ))}
        </div>

        {loading ? <LoadingSpinner fullPage /> : (
          <>
            {tab === 'profile' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '.65rem' }}>
                  {PROFILE_FIELDS.map(f => (
                    <div key={f.key}
                      style={{
                        background: editField === f.key ? 'var(--surface)' : 'var(--surface-2)',
                        padding: '.875rem', borderRadius: 'var(--radius)',
                        border: editField === f.key ? '2px solid var(--primary)' : '2px solid transparent',
                        cursor: editField === f.key ? 'default' : 'pointer',
                        transition: 'border-color .15s'
                      }}
                      onClick={() => editField !== f.key && startEdit(f.key)}>
                      <div style={{ fontSize: '.72rem', color: editField === f.key ? 'var(--primary)' : 'var(--text-muted)',
                        marginBottom: '.35rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.03em' }}>
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
                          <div style={{ display: 'flex', gap: '.4rem', marginTop: '.5rem' }}>
                            <button onClick={saveField} disabled={editSaving}
                              style={{ padding: '.3rem .7rem', background: 'var(--gradient)', color: '#fff',
                                border: 'none', borderRadius: 6, fontWeight: 600, fontSize: '.78rem',
                                cursor: 'pointer', fontFamily: 'inherit' }}>
                              {editSaving ? '…' : '✓ Enregistrer'}
                            </button>
                            <button onClick={() => setEditField(null)}
                              style={{ padding: '.3rem .6rem', background: 'none', border: '1px solid var(--border)',
                                borderRadius: 6, fontSize: '.78rem', cursor: 'pointer', fontFamily: 'inherit',
                                color: 'var(--text-muted)' }}>
                              Annuler
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontWeight: 600, fontSize: '.9rem' }}>{f.display(local[f.key])}</div>
                          <span style={{ opacity: 0, fontSize: '.7rem', transition: 'opacity .15s' }}
                            className="edit-hint">✏️</span>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Coach message */}
                  <div style={{
                    gridColumn: '1 / -1',
                    background: editMsg ? 'var(--surface)' : 'var(--surface-2)',
                    padding: '.875rem', borderRadius: 'var(--radius)',
                    border: editMsg ? '2px solid var(--primary)' : '2px solid transparent',
                    cursor: editMsg ? 'default' : 'pointer'
                  }}
                    onClick={() => !editMsg && setEditMsg(true)}>
                    <div style={{ fontSize: '.72rem', color: editMsg ? 'var(--primary)' : 'var(--text-muted)',
                      marginBottom: '.35rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.03em' }}>
                      Note coach
                    </div>
                    {editMsg ? (
                      <div onClick={e => e.stopPropagation()}>
                        <textarea value={msgVal} onChange={e => setMsgVal(e.target.value)}
                          rows={3} autoFocus
                          style={{ ...inputStyle, resize: 'vertical' }} />
                        <div style={{ display: 'flex', gap: '.4rem', marginTop: '.5rem' }}>
                          <button onClick={saveCoachMessage} disabled={editSaving}
                            style={{ padding: '.3rem .7rem', background: 'var(--gradient)', color: '#fff',
                              border: 'none', borderRadius: 6, fontWeight: 600, fontSize: '.78rem',
                              cursor: 'pointer', fontFamily: 'inherit' }}>
                            {editSaving ? '…' : '✓ Enregistrer'}
                          </button>
                          <button onClick={() => setEditMsg(false)}
                            style={{ padding: '.3rem .6rem', background: 'none', border: '1px solid var(--border)',
                              borderRadius: 6, fontSize: '.78rem', cursor: 'pointer', fontFamily: 'inherit',
                              color: 'var(--text-muted)' }}>
                            Annuler
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '.9rem', fontStyle: local.coach_message ? 'italic' : 'normal',
                        color: local.coach_message ? 'var(--text)' : 'var(--text-muted)' }}>
                        {local.coach_message || 'Ajouter une note…'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Génération de plan */}
                <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
                  {generateMsg && (
                    <div className={`alert ${generateMsg.startsWith('Erreur') ? 'alert-error' : 'alert-success'}`}
                      style={{ marginBottom: '.75rem' }}>
                      {generateMsg.startsWith('Erreur') ? '⚠️' : '✅'} {generateMsg}
                    </div>
                  )}
                  {!plan ? (
                    <button className="btn btn-primary btn-full" onClick={generatePlan} disabled={generating}>
                      {generating
                        ? <><div className="spinner spinner-sm" /> Génération en cours… (30–60s)</>
                        : '🤖 Générer un plan personnalisé'}
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
                      <span className={`badge ${plan.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                        Plan {plan.status === 'active' ? 'actif' : 'en attente'}
                      </span>
                      <button className="btn btn-ghost btn-sm" onClick={generatePlan} disabled={generating}>
                        {generating ? <><div className="spinner spinner-sm" /> Génération…</> : '↺ Regénérer'}
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {tab === 'historique' && (
              <div>
                {profileAlerts.length > 0 && (
                  <div style={{ marginBottom: '1.25rem', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 'var(--radius)', padding: '1rem' }}>
                    <div style={{ fontWeight: 700, marginBottom: '.75rem', color: '#FCA5A5', fontSize: '.875rem', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                      ⚠️ Modifications de profil récentes
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                      {profileAlerts.map(a => (
                        <div key={a.id} style={{ background: 'rgba(255,255,255,.04)', borderRadius: 8, padding: '.6rem .875rem', fontSize: '.82rem' }}>
                          <div style={{ color: 'rgba(255,255,255,.85)', lineHeight: 1.5 }}>
                            {a.content.replace('⚠️ [PROFIL] ', '')}
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '.72rem', marginTop: '.2rem' }}>
                            {new Date(a.created_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid-3" style={{ marginBottom: '1rem' }}>
                  <div className="stat-card stat-card--accent">
                    <div className="stat-value">{completions.length}</div>
                    <div className="stat-label">Séances</div>
                  </div>
                  <div className="stat-card stat-card--dark">
                    <div className="stat-value">{avgRpe}</div>
                    <div className="stat-label">RPE moyen</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value gradient-text">{plan?.status === 'active' ? 'Actif' : plan?.status || 'N/C'}</div>
                    <div className="stat-label">Plan</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', maxHeight: 300, overflowY: 'auto' }}>
                  {completions.map(c => (
                    <div key={c.id} style={{ padding: '.75rem', background: 'var(--surface-2)', borderRadius: 'var(--radius)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '.875rem' }}>
                      <div>
                        <span style={{ fontWeight: 600 }}>Semaine {c.week_number} · Séance {c.session_index + 1}</span>
                        {c.comment && <div style={{ color: 'var(--text-muted)', marginTop: '.1rem' }}>{c.comment}</div>}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {c.rpe && <div style={{ fontWeight: 700, color: 'var(--primary)' }}>RPE {c.rpe}</div>}
                        <div style={{ color: 'var(--text-muted)', fontSize: '.75rem' }}>
                          {new Date(c.completed_at).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                  ))}
                  {completions.length === 0 && <p className="text-muted text-sm">Aucune séance enregistrée.</p>}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function AdminAthletes() {
  const [athletes,      setAthletes]      = useState([])
  const [alertsMap,     setAlertsMap]     = useState({})
  const [filter,        setFilter]        = useState('all')
  const [search,        setSearch]        = useState('')
  const [selected,      setSelected]      = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [confirmDel,    setConfirmDel]    = useState(null)
  const [deleting,      setDeleting]      = useState(false)

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
          .like('content', '⚠️ [PROFIL]%')
          .gte('created_at', sevenDaysAgo)
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
      (filter === 'active'  && a.subscription_status === 'active') ||
      (filter === 'pending' && a.profile_completed === false) ||
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
                            <span title="Profil modifié récemment" style={{
                              background: '#EF4444', color: '#fff',
                              borderRadius: 99, fontSize: '.65rem', fontWeight: 800,
                              padding: '.1rem .45rem', lineHeight: 1.4,
                            }}>⚠️ Profil modifié</span>
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
                <div style={{ position: 'absolute', top: -2, right: -2,
                  width: 10, height: 10, borderRadius: '50%', background: '#EF4444',
                  border: '2px solid var(--bg)' }} />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {a.first_name} {a.last_name}
              </div>
              <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {a.email}
              </div>
              <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', marginTop: '.15rem' }}>
                {OBJECTIVE_LABELS[a.objective] || ''}
                {a.level ? ` · ${LEVEL_LABELS[a.level]}` : ''}
              </div>
            </div>
            <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '.35rem' }}>
              <span className={`badge ${a.subscription_status === 'active' ? 'badge-success' : 'badge-warning'}`}
                style={{ fontSize: '.65rem' }}>
                {a.subscription_status === 'active' ? '✓ Actif' : 'Inactif'}
              </span>
              <div style={{ display: 'flex', gap: '.3rem' }}>
                <button className="btn btn-ghost btn-sm"
                  style={{ fontSize: '.7rem', padding: '.2rem .55rem' }}
                  onClick={e => { e.stopPropagation(); setSelected(a) }}>Voir</button>
                <button className="btn btn-sm"
                  style={{ background: 'var(--error)', color: '#fff', border: 'none', fontSize: '.7rem', padding: '.2rem .45rem' }}
                  onClick={e => { e.stopPropagation(); setConfirmDel(a) }}>🗑</button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
            <p className="text-muted">Aucun athlète trouvé.</p>
          </div>
        )}
      </div>

      {selected && (
        <AthleteDetailModal
          athlete={selected}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
        />
      )}

      {/* Confirmation suppression */}
      {confirmDel && (
        <div className="modal-overlay center" onClick={e => e.target === e.currentTarget && setConfirmDel(null)}>
          <div className="modal center-modal" style={{ maxWidth: 420 }}>
            <h3 style={{ marginBottom: '.75rem' }}>Supprimer cet athlète ?</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Tu es sur le point de supprimer définitivement <strong>{confirmDel.first_name} {confirmDel.last_name}</strong> ainsi que toutes ses données (plan, séances, messages). Cette action est <strong>irréversible</strong>.
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
