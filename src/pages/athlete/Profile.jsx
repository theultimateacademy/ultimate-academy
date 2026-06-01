import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { api } from '../../lib/api'
import { OBJECTIVE_LABELS, LEVEL_LABELS } from '../../lib/utils'
import LoadingSpinner from '../../components/UI/LoadingSpinner'

export default function AthleteProfile() {
  const { profile, refreshProfile, updateProfile } = useAuth()
  const [searchParams] = useSearchParams()
  const [stats,          setStats]          = useState({ sessions: 0, avgRpe: 0 })
  const [loading,        setLoading]        = useState(true)
  const [stravaLoading,  setStravaLoading]  = useState(false)
  const [stravaStatus,   setStravaStatus]   = useState('')
  const [importing,      setImporting]      = useState(false)
  const [uploading,      setUploading]      = useState(false)
  const [suuntoStatus,   setSuuntoStatus]   = useState('')
  const [garminLoading,  setGarminLoading]  = useState(false)
  const [garminStatus,   setGarminStatus]   = useState('')
  // Adaptations
  const [heatLoading,    setHeatLoading]    = useState(false)
  const [fatigueLoading, setFatigueLoading] = useState(false)
  const [injuryLoading,  setInjuryLoading]  = useState(false)
  const [cycleLoading,   setCycleLoading]   = useState(false)
  const [restoreLoading, setRestoreLoading] = useState(false)
  const [planAdaptedFor, setPlanAdaptedFor] = useState(null)  // synced from plan_data
  // Résiliation
  const [cancelConfirm,  setCancelConfirm]  = useState(false)
  const [cancelling,     setCancelling]     = useState(false)
  const [cancelMsg,      setCancelMsg]      = useState('')
  // Règles — synced with profile context
  const [periodPain,     setPeriodPain]     = useState(profile?.period_pain || false)
  const [periodDays,     setPeriodDays]     = useState(profile?.period_pain_days || 2)

  useEffect(() => {
    setPeriodPain(profile?.period_pain || false)
    setPeriodDays(profile?.period_pain_days || 2)
  }, [profile?.period_pain, profile?.period_pain_days])
  const [savingPeriod,   setSavingPeriod]   = useState(false)
  // Inline edit
  const [editField,      setEditField]      = useState(null)
  const [editVal,        setEditVal]        = useState({})
  const [editSaving,     setEditSaving]     = useState(false)
  const [toast,          setToast]          = useState(null)

  function showToast(message, type = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4500)
  }

  const KEY_FIELDS = {
    vma:                   'VMA',
    objective:             'Objectif de course',
    race_date:             'Date de course',
    days_per_week:         'Séances par semaine',
    preferred_days:        'Jours d\'entraînement préférés',
    level:                 'Niveau',
    injuries:              'Blessures / douleurs',
    intermediate_race_date:'Course intermédiaire (date)',
    intermediate_race_name:'Course intermédiaire (nom)',
    training_terrain:      'Terrain d\'entraînement',
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const ext  = file.name.split('.').pop()
      const path = `${profile.id}/avatar.${ext}`
      const { error: upErr } = await supabase.storage
        .from('avatars').upload(path, file, { upsert: true, contentType: file.type })
      if (upErr) throw upErr
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      await supabase.from('profiles').update({ avatar_url: publicUrl + '?t=' + Date.now() }).eq('id', profile.id)
      await refreshProfile()
    } catch (err) {
      console.error('Avatar upload error:', err)
    } finally {
      setUploading(false)
    }
  }

  useEffect(() => {
    const strava  = searchParams.get('strava')
    const suunto  = searchParams.get('suunto')
    const garmin  = searchParams.get('garmin')
    if (strava)  setStravaStatus(strava)
    if (suunto)  setSuuntoStatus(suunto)
    if (garmin)  setGarminStatus(garmin)
    loadStats()
  }, [])

  useEffect(() => {
    if (stravaStatus === 'connected' || suuntoStatus === 'connected' || garminStatus === 'connected') refreshProfile()
  }, [stravaStatus, suuntoStatus, garminStatus])

  useEffect(() => {
    if (!profile?.intermediate_race_date) return
    const raceDate = new Date(profile.intermediate_race_date)
    if (raceDate < new Date()) {
      supabase.from('profiles')
        .update({ intermediate_race_name: null, intermediate_race_date: null })
        .eq('id', profile.id)
        .select().single()
        .then(({ data }) => { if (data) updateProfile(data) })
    }
  }, [profile?.intermediate_race_date])

  async function cancelSubscription() {
    setCancelling(true)
    try {
      const { end_date } = await api.cancelSubscription({ userId: profile.id })
      const endFmt = new Date(end_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
      setCancelMsg(`Résiliation confirmée. Ton accès est maintenu jusqu'au ${endFmt}.`)
      setCancelConfirm(false)
      await refreshProfile()
    } catch (err) {
      setCancelMsg('Erreur : ' + err.message)
    } finally {
      setCancelling(false)
    }
  }

  async function savePeriodSettings() {
    setSavingPeriod(true)
    try {
      const patch = { period_pain: periodPain, period_pain_days: periodPain ? periodDays : null }
      const { data: updated, error: dbErr } = await supabase.from('profiles').update(patch).eq('id', profile.id).select().single()
      if (dbErr) throw dbErr
      updateProfile(updated)
      supabase.from('messages').insert({
        user_id: profile.id, sender: 'athlete',
        content: `⚠️ [PROFIL] ${profile.first_name} a modifié ses paramètres de cycle : douleurs ${periodPain ? `oui (${periodDays}j)` : 'non'}.\nLe plan sera automatiquement adapté d'ici 1h.`,
      }).then()
      api.scheduleRegen({ userId: profile.id, reason: 'Cycle menstruel' }).catch(() => {})
      showToast('Cycle sauvegardé. Plan adapté automatiquement d\'ici 1h.')
    } catch {
      showToast('Erreur lors de la sauvegarde ✗', 'error')
    } finally {
      setSavingPeriod(false)
    }
  }

  async function loadStats() {
    setLoading(true)
    try {
      const [{ data: completions }, { data: plan }] = await Promise.all([
        supabase.from('session_completions').select('rpe').eq('user_id', profile.id),
        supabase.from('training_plans').select('plan_data,activated_at,created_at').eq('user_id', profile.id).eq('status', 'active').single(),
      ])
      const sessions = completions?.length || 0
      const avgRpe   = sessions > 0
        ? Math.round((completions.filter(c => c.rpe).reduce((a, c) => a + c.rpe, 0)) / completions.filter(c => c.rpe).length * 10) / 10
        : 0
      setStats({ sessions, avgRpe })

      // Derive plan adaptation state
      if (plan?.plan_data?.semaines) {
        const startDate = new Date(plan.activated_at || plan.created_at)
        // align to next monday
        const dayOfWeek = startDate.getDay()
        const daysUntilMonday = dayOfWeek === 1 ? 0 : (8 - dayOfWeek) % 7 || 7
        startDate.setDate(startDate.getDate() + daysUntilMonday)
        startDate.setHours(0, 0, 0, 0)
        const today = new Date(); today.setHours(0, 0, 0, 0)
        const ms = today.getTime() - startDate.getTime()
        const weeksElapsed = ms < 0 ? 1 : Math.floor(ms / (7 * 24 * 3600 * 1000)) + 1
        const currentWeek = plan.plan_data.semaines.find(s => s.numero === weeksElapsed)
          || plan.plan_data.semaines.find(s => s._adapted_for)
        setPlanAdaptedFor(currentWeek?._adapted_for || null)
      }
    } finally {
      setLoading(false)
    }
  }

  async function connectStrava() {
    setStravaLoading(true)
    window.location.href = api.stravaConnect(profile.id)
  }

  async function disconnectStrava() {
    if (!confirm('Déconnecter Strava ?')) return
    setStravaLoading(true)
    try {
      await api.stravaDisconnect({ userId: profile.id })
      await refreshProfile()
      setStravaStatus('disconnected')
    } finally {
      setStravaLoading(false)
    }
  }

  async function importStrava() {
    setImporting(true)
    try {
      const { imported } = await api.stravaImport({ userId: profile.id })
      setStravaStatus(`imported_${imported}`)
    } finally {
      setImporting(false)
    }
  }

  async function connectGarmin() {
    setGarminLoading(true)
    window.location.href = api.garminConnect(profile.id)
  }

  async function disconnectGarmin() {
    if (!confirm('Déconnecter Garmin ?')) return
    setGarminLoading(true)
    try {
      await api.garminDisconnect({ userId: profile.id })
      await refreshProfile()
      setGarminStatus('disconnected')
    } finally {
      setGarminLoading(false)
    }
  }


  async function saveField(dbKey, value) {
    setEditSaving(true)
    try {
      const oldValue = String(profile?.[dbKey] ?? '')
      const newValue = String(value ?? '')
      let coercedValue = (value === '' || (Array.isArray(value) && value.length === 0)) ? null : value
      if (coercedValue !== null && dbKey === 'days_per_week') coercedValue = parseInt(coercedValue, 10)
      if (coercedValue !== null && dbKey === 'vma')           coercedValue = parseFloat(coercedValue)
      if (coercedValue !== null && dbKey === 'race_denivele') coercedValue = parseInt(coercedValue, 10)
      // Arrays (preferred_days): keep as-is — Supabase handles TEXT[]

      const { data: updated, error: dbErr } = await supabase
        .from('profiles').update({ [dbKey]: coercedValue }).eq('id', profile.id).select().single()
      if (dbErr) throw dbErr

      updateProfile(updated)
      setEditField(null)

      if (KEY_FIELDS[dbKey] && oldValue !== newValue) {
        if (dbKey === 'vma') {
          api.recalculateVma({ userId: profile.id, newVma: parseFloat(value) }).catch(() => {})
          showToast('Tes allures et distances ont été recalculées selon ta nouvelle VMA ✓')
        } else if (dbKey === 'injuries') {
          api.adaptInjury({ userId: profile.id }).catch(() => {})
          showToast('Blessure enregistrée. Tes séances sont adaptées 🩹')
        } else if (['objective', 'race_date', 'days_per_week', 'level'].includes(dbKey)) {
          api.scheduleRegen({ userId: profile.id, reason: KEY_FIELDS[dbKey] }).catch(() => {})
          showToast('Modification enregistrée. Ton coach va adapter ton plan prochainement.')
        } else {
          api.scheduleRegen({ userId: profile.id, reason: KEY_FIELDS[dbKey] }).catch(() => {})
          showToast('Modification enregistrée ✓')
        }
      } else {
        showToast('Profil mis à jour ✓')
      }
    } catch (err) {
      console.error('[saveField]', err)
      showToast((err?.message || 'Erreur inconnue') + ' ✗', 'error')
    } finally {
      setEditSaving(false)
    }
  }

  async function saveNameField() {
    setEditSaving(true)
    try {
      const patch = { first_name: editVal.first_name || null, last_name: editVal.last_name || null }
      const { data: updated, error: dbErr } = await supabase.from('profiles').update(patch).eq('id', profile.id).select().single()
      if (dbErr) throw dbErr
      updateProfile(updated)
      setEditField(null)
      showToast('Profil mis à jour ✓')
    } catch (err) {
      console.error('[saveNameField]', err)
      showToast((err?.message || 'Erreur inconnue') + ' ✗', 'error')
    } finally {
      setEditSaving(false)
    }
  }

  async function toggleHeat() {
    setHeatLoading(true)
    try {
      const activate = !profile?.heat_mode
      await api.adjustHeat({ userId: profile.id, activate })
      await refreshProfile()
      if (!activate) setPlanAdaptedFor(null)
      showToast(activate ? '🌡️ Mode canicule activé' : '✅ Mode canicule désactivé')
    } catch (err) {
      showToast((err?.message || 'Erreur') + ' ✗', 'error')
    } finally {
      setHeatLoading(false)
    }
  }

  async function toggleFatigue() {
    if (planAdaptedFor === 'fatigue') {
      setRestoreLoading(true)
      try {
        await api.restoreWeek({ userId: profile.id })
        setPlanAdaptedFor(null)
        showToast('Plan restauré ✓')
      } catch (err) {
        showToast((err?.message || 'Erreur') + ' ✗', 'error')
      } finally {
        setRestoreLoading(false)
      }
    } else {
      setFatigueLoading(true)
      try {
        await api.fatigueAdapt({ userId: profile.id })
        setPlanAdaptedFor('fatigue')
        showToast('Semaine allégée. Repose-toi bien 😴')
      } catch (err) {
        showToast((err?.message || 'Erreur') + ' ✗', 'error')
      } finally {
        setFatigueLoading(false)
      }
    }
  }

  async function toggleInjury() {
    if (planAdaptedFor === 'injury') {
      setRestoreLoading(true)
      try {
        await api.restoreWeek({ userId: profile.id })
        setPlanAdaptedFor(null)
        showToast('Plan restauré ✓')
      } catch (err) {
        showToast((err?.message || 'Erreur') + ' ✗', 'error')
      } finally {
        setRestoreLoading(false)
      }
    } else {
      setInjuryLoading(true)
      try {
        await api.adaptInjury({ userId: profile.id })
        setPlanAdaptedFor('injury')
        showToast('Plan adapté pour la blessure 🩹')
      } catch (err) {
        showToast((err?.message || 'Erreur') + ' ✗', 'error')
      } finally {
        setInjuryLoading(false)
      }
    }
  }

  async function toggleCycle() {
    if (planAdaptedFor === 'cycle') {
      setRestoreLoading(true)
      try {
        await api.restoreWeek({ userId: profile.id })
        setPlanAdaptedFor(null)
        showToast('Plan restauré ✓')
      } catch (err) {
        showToast((err?.message || 'Erreur') + ' ✗', 'error')
      } finally {
        setRestoreLoading(false)
      }
    } else {
      setCycleLoading(true)
      try {
        await api.periodAlert({ userId: profile.id })
        setPlanAdaptedFor('cycle')
        showToast('Plan adapté pour ton cycle 🌸')
      } catch (err) {
        showToast((err?.message || 'Erreur') + ' ✗', 'error')
      } finally {
        setCycleLoading(false)
      }
    }
  }

  function startEdit(field, initialVal) {
    setEditField(field)
    setEditVal(prev => ({ ...prev, [field]: initialVal }))
  }

  function startNameEdit() {
    setEditField('name')
    setEditVal(prev => ({
      ...prev,
      first_name: profile?.first_name || '',
      last_name:  profile?.last_name  || '',
    }))
  }

  function cancelEdit() {
    setEditField(null)
    setEditVal({})
  }

  if (loading) return <LoadingSpinner fullPage />

  // ── Brand logo with fallback ──────────────────────────────────────────────
  function BrandLogo({ src, bg, fallback }) {
    const [ok, setOk] = useState(true)
    return (
      <div style={{ width:40, height:40, background: bg, borderRadius:8, overflow:'hidden',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:'.9rem', fontWeight:800, color:'#fff', flexShrink:0 }}>
        {ok
          ? <img src={src} alt="" style={{ width:28, height:28, objectFit:'contain' }}
              onError={() => setOk(false)} />
          : fallback}
      </div>
    )
  }

  // ── Service row sub-component ──────────────────────────────────────────────
  function ServiceRow({ icon, name, connected, badge, children }) {
    return (
      <div style={{ display:'flex', gap:'1rem', alignItems:'flex-start' }}>
        <div style={{ flexShrink:0 }}>{icon}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'.5rem', marginBottom:'.3rem' }}>
            <span style={{ fontWeight:700, fontSize:'.95rem' }}>{name}</span>
            {badge}
            {connected === true  && <span style={{ fontSize:'.75rem', color:'var(--success)' }}>● Connecté</span>}
            {connected === false && <span style={{ fontSize:'.75rem', color:'var(--text-muted)' }}>○ Non connecté</span>}
          </div>
          {children}
        </div>
      </div>
    )
  }

  // ── Editable card sub-component ────────────────────────────────────────────
  function FieldCard({ fieldKey, dbKey, label, displayValue, children, highlight }) {
    const isEditing = editField === fieldKey
    const borderColor = isEditing ? 'var(--primary)' : highlight ? '#F9A8D4' : 'transparent'
    return (
      <div
        onClick={() => { if (!isEditing) { startEdit(fieldKey, profile?.[dbKey] ?? '') } }}
        style={{
          position: 'relative',
          padding: '.875rem',
          background: highlight ? 'rgba(249,168,212,.08)' : 'var(--surface-2)',
          borderRadius: 'var(--radius)',
          border: `1.5px solid ${borderColor}`,
          cursor: isEditing ? 'default' : 'pointer',
          transition: 'border-color .15s',
        }}
        className={!isEditing ? 'field-card-hoverable' : ''}
      >
        <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginBottom: '.35rem' }}>{label}</div>

        {isEditing ? (
          <div onClick={e => e.stopPropagation()}>
            {children}
            <div style={{ display: 'flex', gap: '.5rem', marginTop: '.6rem' }}>
              <button
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '.78rem', padding: '.25rem .6rem' }}
                onClick={cancelEdit}
                disabled={editSaving}
              >
                Annuler
              </button>
              <button
                className="btn btn-primary btn-sm"
                style={{ fontSize: '.78rem', padding: '.25rem .75rem' }}
                onClick={() => saveField(dbKey, editVal[fieldKey])}
                disabled={editSaving}
              >
                {editSaving ? '…' : '✓ Enregistrer'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontWeight: 600, fontSize: '.9rem' }}>{displayValue}</div>
            <span style={{
              position: 'absolute', top: '.6rem', right: '.6rem',
              fontSize: '.75rem', opacity: 0,
              transition: 'opacity .15s',
            }} className="pencil-icon">✏️</span>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="page">
      <style>{`
        .field-card-hoverable:hover { border-color: var(--border) !important; }
        .field-card-hoverable:hover .pencil-icon { opacity: 1 !important; }
        @keyframes toastIn { from { opacity:0; transform:translateX(-50%) translateY(12px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
      `}</style>

      {toast && (
        <div style={{
          position: 'fixed', bottom: '5.5rem', left: '50%', transform: 'translateX(-50%)',
          background: toast.type === 'success' ? 'rgba(16,185,129,.95)' : 'rgba(139,47,201,.95)',
          color: '#fff', borderRadius: 99, padding: '.75rem 1.5rem',
          fontWeight: 600, fontSize: '.875rem', zIndex: 500,
          boxShadow: '0 4px 24px rgba(0,0,0,.35)',
          animation: 'toastIn .3s ease',
          whiteSpace: 'nowrap', maxWidth: '90vw', textAlign: 'center',
        }}>
          {toast.message}
        </div>
      )}

      <h2 className="page-heading" style={{ marginBottom: '1.5rem' }}>Mon profil</h2>

      {stravaStatus === 'connected' && <div className="alert alert-success" style={{ marginBottom:'1rem' }}>✅ Strava connecté avec succès !</div>}
      {stravaStatus === 'error'     && <div className="alert alert-error"   style={{ marginBottom:'1rem' }}>⚠️ La connexion Strava a échoué.</div>}
      {String(stravaStatus).startsWith('imported_') && <div className="alert alert-success" style={{ marginBottom:'1rem' }}>✅ {stravaStatus.split('_')[1]} activités importées depuis Strava.</div>}
      {suuntoStatus === 'connected' && <div className="alert alert-success" style={{ marginBottom:'1rem' }}>✅ Suunto connecté ! Les séances s'enverront automatiquement.</div>}
      {suuntoStatus === 'error'     && <div className="alert alert-error"   style={{ marginBottom:'1rem' }}>⚠️ La connexion Suunto a échoué.</div>}
      {garminStatus === 'connected' && <div className="alert alert-success" style={{ marginBottom:'1rem' }}>✅ Garmin Connect connecté ! Tu peux envoyer tes séances directement sur ta montre.</div>}
      {garminStatus === 'error'     && <div className="alert alert-error"   style={{ marginBottom:'1rem' }}>⚠️ La connexion Garmin a échoué. Réessaie.</div>}

      {/* Profile info */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>

          {/* Avatar cliquable */}
          <label style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="avatar"
                style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover',
                  border: '2px solid var(--border)' }} />
            ) : (
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--gradient)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '1.5rem', fontWeight: 800 }}>
                {profile?.first_name?.[0]?.toUpperCase()}
              </div>
            )}
            <div style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 22, height: 22, borderRadius: '50%',
              background: 'var(--gradient)', border: '2px solid var(--bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '.65rem'
            }}>
              {uploading ? '⏳' : '📷'}
            </div>
          </label>

          {/* Name — inline editable */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {editField === 'name' ? (
              <div onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', gap: '.5rem', marginBottom: '.4rem', flexWrap: 'wrap' }}>
                  <input
                    className="form-input"
                    style={{ flex: 1, minWidth: 80, fontSize: '.9rem', padding: '.35rem .6rem' }}
                    placeholder="Prénom"
                    value={editVal.first_name ?? ''}
                    onChange={e => setEditVal(prev => ({ ...prev, first_name: e.target.value }))}
                    autoFocus
                  />
                  <input
                    className="form-input"
                    style={{ flex: 1, minWidth: 80, fontSize: '.9rem', padding: '.35rem .6rem' }}
                    placeholder="Nom"
                    value={editVal.last_name ?? ''}
                    onChange={e => setEditVal(prev => ({ ...prev, last_name: e.target.value }))}
                  />
                </div>
                <div style={{ display: 'flex', gap: '.5rem' }}>
                  <button className="btn btn-ghost btn-sm" style={{ fontSize: '.78rem', padding: '.25rem .6rem' }}
                    onClick={cancelEdit} disabled={editSaving}>
                    Annuler
                  </button>
                  <button className="btn btn-primary btn-sm" style={{ fontSize: '.78rem', padding: '.25rem .75rem' }}
                    onClick={saveNameField} disabled={editSaving}>
                    {editSaving ? '…' : '✓ Enregistrer'}
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={startNameEdit}
                style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '.4rem' }}
                title="Modifier le nom"
              >
                <h3 style={{ margin: 0 }}>{profile?.first_name} {profile?.last_name}</h3>
                <span style={{ fontSize: '.8rem', opacity: 0.4 }}>✏️</span>
              </div>
            )}
            <div style={{ fontSize: '.875rem', color: 'var(--text-muted)', marginTop: '.15rem' }}>{profile?.email}</div>
            {editField !== 'name' && (
              <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginTop: '.2rem' }}>
                Clique sur la photo pour la modifier
              </div>
            )}
          </div>
        </div>

        {/* Editable sections */}
        {(() => {
          const isTri   = ['tri_sprint','tri_olympic','tri_half','tri_ironman'].includes(profile?.objective)
          const isTrail = ['trail_20k','trail_50k','trail_100k','trail_100m'].includes(profile?.objective)

          const sectionHdr = {
            fontSize: '.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em',
            color: 'var(--text-muted)', padding: '.625rem 0', borderBottom: '1px solid var(--border)',
            marginBottom: '.125rem', marginTop: '1.5rem',
          }

          const rowBase = {
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '.75rem 0', borderBottom: '1px solid rgba(255,255,255,.04)',
            cursor: 'pointer', gap: '1rem',
          }

          // Generic row: label left, value/edit right
          function FieldRow({ fieldKey, dbKey, label, displayVal, children }) {
            const isEditing = editField === fieldKey
            return (
              <div style={{ ...rowBase, cursor: isEditing ? 'default' : 'pointer', alignItems: isEditing ? 'flex-start' : 'center' }}
                onClick={() => { if (!isEditing) startEdit(fieldKey, profile?.[dbKey ?? fieldKey] ?? '') }}>
                <span style={{ fontSize: '.82rem', color: 'var(--text-muted)', flexShrink: 0, minWidth: 160 }}>{label}</span>
                {isEditing ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '.4rem' }}
                    onClick={e => e.stopPropagation()}>
                    {children}
                    <div style={{ display: 'flex', gap: '.4rem' }}>
                      <button className="btn btn-ghost btn-sm" style={{ fontSize: '.75rem', padding: '.22rem .55rem' }}
                        onClick={cancelEdit} disabled={editSaving}>Annuler</button>
                      <button className="btn btn-primary btn-sm" style={{ fontSize: '.75rem', padding: '.22rem .6rem' }}
                        onClick={() => saveField(dbKey ?? fieldKey, editVal[fieldKey])} disabled={editSaving}>
                        {editSaving ? '…' : '✓'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <span style={{ fontWeight: 600, fontSize: '.875rem', textAlign: 'right' }}>{displayVal}</span>
                )}
              </div>
            )
          }

          const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

          // Colored section wrapper — visible but not overwhelming
          const sectionBlock = (color) => ({
            background: color + '12', borderRadius: 14,
            border: `1.5px solid ${color}35`,
            padding: '.25rem 1rem .875rem', marginBottom: '.875rem',
          })

          return (
            <div>
              {/* ── Section 1 : Objectif & Course ── */}
              <div style={sectionBlock('#8B2FC9')}>
              <div style={sectionHdr}>🎯 Objectif &amp; Course</div>

              <FieldRow fieldKey="objective" dbKey="objective" label="Objectif"
                displayVal={OBJECTIVE_LABELS[profile?.objective] || 'Non renseigné'}>
                <select className="form-input" style={{ fontSize: '.875rem', width: '100%' }}
                  value={editVal.objective ?? ''} autoFocus
                  onChange={e => setEditVal(prev => ({ ...prev, objective: e.target.value }))}>
                  <option value="">— Choisir —</option>
                  <optgroup label="🏃 Course sur route">
                    <option value="5km">5 km</option>
                    <option value="10km">10 km</option>
                    <option value="semi">Semi-marathon</option>
                    <option value="marathon">Marathon</option>
                  </optgroup>
                  <optgroup label="⛰️ Trail">
                    <option value="trail_20k">Trail 20K</option>
                    <option value="trail_50k">Trail 50K</option>
                    <option value="trail_100k">Trail 100K</option>
                    <option value="trail_100m">Trail 100M</option>
                  </optgroup>
                  <optgroup label="🦾 Triathlon">
                    <option value="tri_sprint">Triathlon Sprint</option>
                    <option value="tri_olympic">Triathlon Olympic</option>
                    <option value="tri_half">Half Ironman 70.3</option>
                    <option value="tri_ironman">Ironman</option>
                  </optgroup>
                </select>
              </FieldRow>

              <FieldRow fieldKey="level" dbKey="level" label="Niveau"
                displayVal={LEVEL_LABELS[profile?.level] || 'Non renseigné'}>
                <select className="form-input" style={{ fontSize: '.875rem', width: '100%' }}
                  value={editVal.level ?? ''} autoFocus
                  onChange={e => setEditVal(prev => ({ ...prev, level: e.target.value }))}>
                  <option value="">— Choisir —</option>
                  <option value="debutant">Débutant</option>
                  <option value="intermediaire">Intermédiaire</option>
                  <option value="confirme">Confirmé</option>
                  <option value="expert">Expert</option>
                </select>
              </FieldRow>

              <FieldRow fieldKey="race_date" dbKey="race_date" label="Date de course"
                displayVal={profile?.race_date
                  ? new Date(profile.race_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                  : 'Non définie'}>
                <input type="date" className="form-input" style={{ fontSize: '.875rem', width: '100%' }}
                  value={editVal.race_date ?? ''} autoFocus
                  onChange={e => setEditVal(prev => ({ ...prev, race_date: e.target.value }))} />
              </FieldRow>

              <FieldRow fieldKey="intermediate_race_name" dbKey="intermediate_race_name" label="Course intermédiaire"
                displayVal={profile?.intermediate_race_name || 'Aucune'}>
                <input type="text" className="form-input" style={{ fontSize: '.875rem', width: '100%' }}
                  placeholder="ex : Semi de Paris"
                  value={editVal.intermediate_race_name ?? ''} autoFocus
                  onChange={e => setEditVal(prev => ({ ...prev, intermediate_race_name: e.target.value }))} />
              </FieldRow>

              <FieldRow fieldKey="intermediate_race_date" dbKey="intermediate_race_date" label="Date intermédiaire"
                displayVal={profile?.intermediate_race_date
                  ? new Date(profile.intermediate_race_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                  : 'Non définie'}>
                <input type="date" className="form-input" style={{ fontSize: '.875rem', width: '100%' }}
                  value={editVal.intermediate_race_date ?? ''} autoFocus
                  onChange={e => setEditVal(prev => ({ ...prev, intermediate_race_date: e.target.value }))} />
              </FieldRow>

              {/* Jours préférés — toggles */}
              {(() => {
                const isEditing   = editField === 'preferred_days'
                const currentDays = profile?.preferred_days || []
                const editDaysSel = Array.isArray(editVal.preferred_days) ? editVal.preferred_days : currentDays
                const toggle = d => setEditVal(prev => ({
                  ...prev,
                  preferred_days: editDaysSel.includes(d)
                    ? editDaysSel.filter(x => x !== d)
                    : [...editDaysSel, d],
                }))
                return (
                  <div style={{ ...rowBase, cursor: isEditing ? 'default' : 'pointer', alignItems: isEditing ? 'flex-start' : 'center' }}
                    onClick={() => { if (!isEditing) startEdit('preferred_days', currentDays) }}>
                    <span style={{ fontSize: '.82rem', color: 'var(--text-muted)', flexShrink: 0, minWidth: 160 }}>
                      Jours d'entraînement
                    </span>
                    {isEditing ? (
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '.5rem' }}
                        onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.35rem', justifyContent: 'flex-end' }}>
                          {DAYS.map(d => {
                            const sel = editDaysSel.includes(d)
                            return (
                              <button key={d} type="button" onClick={() => toggle(d)} style={{
                                padding: '.3rem .6rem', borderRadius: 8, fontWeight: 600, fontSize: '.8rem',
                                border: sel ? '2px solid var(--primary)' : '1px solid var(--border)',
                                background: sel ? 'rgba(139,47,201,.2)' : 'var(--surface)',
                                color: sel ? '#fff' : 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit',
                              }}>{d}</button>
                            )
                          })}
                        </div>
                        <p style={{ fontSize: '.72rem', color: 'var(--text-muted)', margin: 0 }}>
                          {editDaysSel.length} sélectionné{editDaysSel.length > 1 ? 's' : ''}
                        </p>
                        <div style={{ display: 'flex', gap: '.4rem' }}>
                          <button className="btn btn-ghost btn-sm" style={{ fontSize: '.75rem', padding: '.22rem .55rem' }}
                            onClick={cancelEdit} disabled={editSaving}>Annuler</button>
                          <button className="btn btn-primary btn-sm" style={{ fontSize: '.75rem', padding: '.22rem .6rem' }}
                            onClick={() => saveField('preferred_days', editVal.preferred_days ?? currentDays)} disabled={editSaving}>
                            {editSaving ? '…' : '✓'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span style={{ fontWeight: 600, fontSize: '.875rem', textAlign: 'right' }}>
                        {currentDays.length ? currentDays.join(' · ') : 'Non précisé'}
                      </span>
                    )}
                  </div>
                )
              })()}

              </div>{/* end section 1 */}

              {/* ── Section 2 : Performance ── */}
              <div style={sectionBlock('#0EA5E9')}>
              <div style={sectionHdr}>📊 Performance</div>

              <FieldRow fieldKey="vma" dbKey="vma" label="VMA (km/h)"
                displayVal={profile?.vma ? `${profile.vma} km/h` : 'À estimer'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', width: '100%' }}>
                  <input type="number" className="form-input" style={{ flex: 1, fontSize: '.875rem' }}
                    step={0.1} min={8} max={30} value={editVal.vma ?? ''} autoFocus
                    onChange={e => setEditVal(prev => ({ ...prev, vma: e.target.value }))} />
                  <span style={{ fontSize: '.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>km/h</span>
                </div>
              </FieldRow>

              {!isTri && (
                <FieldRow fieldKey="chrono_goal" dbKey="chrono_goal" label="Chrono cible"
                  displayVal={profile?.chrono_goal || 'Progresser'}>
                  <input type="text" className="form-input" style={{ fontSize: '.875rem', width: '100%' }}
                    placeholder="ex: 1h45 au semi"
                    value={editVal.chrono_goal ?? ''} autoFocus
                    onChange={e => setEditVal(prev => ({ ...prev, chrono_goal: e.target.value }))} />
                </FieldRow>
              )}

              {isTri && (<>
                <FieldRow fieldKey="chrono_natation" dbKey="chrono_natation" label="🏊 Chrono nage"
                  displayVal={profile?.chrono_natation || 'Non renseigné'}>
                  <input type="text" className="form-input" style={{ fontSize: '.875rem', width: '100%' }}
                    placeholder={profile?.objective === 'tri_sprint' ? 'ex: 15min' : profile?.objective === 'tri_olympic' ? 'ex: 28min' : profile?.objective === 'tri_half' ? 'ex: 38min' : 'ex: 1h15'}
                    value={editVal.chrono_natation ?? ''} autoFocus
                    onChange={e => setEditVal(prev => ({ ...prev, chrono_natation: e.target.value }))} />
                </FieldRow>
                <FieldRow fieldKey="chrono_velo" dbKey="chrono_velo" label="🚴 Chrono vélo"
                  displayVal={profile?.chrono_velo || 'Non renseigné'}>
                  <input type="text" className="form-input" style={{ fontSize: '.875rem', width: '100%' }}
                    placeholder={profile?.objective === 'tri_sprint' ? 'ex: 40min' : profile?.objective === 'tri_olympic' ? 'ex: 1h15' : profile?.objective === 'tri_half' ? 'ex: 2h45' : 'ex: 5h30'}
                    value={editVal.chrono_velo ?? ''} autoFocus
                    onChange={e => setEditVal(prev => ({ ...prev, chrono_velo: e.target.value }))} />
                </FieldRow>
                <FieldRow fieldKey="chrono_goal" dbKey="chrono_goal" label="🏃 Chrono course"
                  displayVal={profile?.chrono_goal || 'Non renseigné'}>
                  <input type="text" className="form-input" style={{ fontSize: '.875rem', width: '100%' }}
                    placeholder={profile?.objective === 'tri_sprint' ? 'ex: 22min' : profile?.objective === 'tri_olympic' ? 'ex: 45min' : profile?.objective === 'tri_half' ? 'ex: 1h50' : 'ex: 4h00'}
                    value={editVal.chrono_goal ?? ''} autoFocus
                    onChange={e => setEditVal(prev => ({ ...prev, chrono_goal: e.target.value }))} />
                </FieldRow>
              </>)}

              <FieldRow fieldKey="best_recent_time" dbKey="best_recent_time" label="Meilleur chrono récent"
                displayVal={profile?.best_recent_time || '—'}>
                <input type="text" className="form-input" style={{ fontSize: '.875rem', width: '100%' }}
                  placeholder="ex: 1h52 au semi"
                  value={editVal.best_recent_time ?? ''} autoFocus
                  onChange={e => setEditVal(prev => ({ ...prev, best_recent_time: e.target.value }))} />
              </FieldRow>

              </div>{/* end section 2 */}

              {/* ── Section 3 : Organisation entraînement ── */}
              <div style={sectionBlock('#10B981')}>
              <div style={sectionHdr}>📅 Organisation entraînement</div>

              {!isTri && (
                <FieldRow fieldKey="days_per_week" dbKey="days_per_week" label="Séances / semaine"
                  displayVal={profile?.days_per_week ? `${profile.days_per_week} jours` : '—'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', width: '100%' }}>
                    <input type="number" className="form-input" style={{ flex: 1, fontSize: '.875rem' }}
                      min={2} max={7} value={editVal.days_per_week ?? ''} autoFocus
                      onChange={e => setEditVal(prev => ({ ...prev, days_per_week: e.target.value }))} />
                    <span style={{ fontSize: '.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>j/sem.</span>
                  </div>
                </FieldRow>
              )}

              {isTri && [
                { key: 'tri_swim_sessions', label: '🏊 Nage / semaine', max: 4 },
                { key: 'tri_bike_sessions', label: '🚴 Vélo / semaine',  max: 5 },
                { key: 'tri_run_sessions',  label: '🏃 Course / semaine', max: 4 },
              ].map(({ key, label, max }) => (
                <FieldRow key={key} fieldKey={key} dbKey={key} label={label}
                  displayVal={profile?.[key] ? `${profile[key]} séance(s)` : '—'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', width: '100%' }}>
                    <input type="number" className="form-input" style={{ flex: 1, fontSize: '.875rem' }}
                      min={1} max={max} value={editVal[key] ?? ''} autoFocus
                      onChange={e => setEditVal(prev => ({ ...prev, [key]: e.target.value }))} />
                    <span style={{ fontSize: '.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>séance(s)</span>
                  </div>
                </FieldRow>
              ))}

              </div>{/* end section 3 */}

              {/* ── Section 4 : Trail (conditionnel) ── */}
              {isTrail && (<>
              <div style={sectionBlock('#65A30D')}>
                <div style={sectionHdr}>⛰️ Trail</div>

                <FieldRow fieldKey="training_terrain" dbKey="training_terrain" label="Zone d'habitation"
                  displayVal={
                    profile?.training_terrain === 'montagne'      ? '🏔️ Montagne' :
                    profile?.training_terrain === 'semi_montagne' ? '⛰️ Semi-montagne' :
                    profile?.training_terrain === 'ville_plat'    ? '🏙️ Ville / Plat' :
                    'Non renseigné'
                  }>
                  <select className="form-input" style={{ fontSize: '.875rem', width: '100%' }}
                    value={editVal.training_terrain ?? ''} autoFocus
                    onChange={e => setEditVal(prev => ({ ...prev, training_terrain: e.target.value }))}>
                    <option value="">— Choisir —</option>
                    <option value="montagne">🏔️ Montagne (accès D+ direct)</option>
                    <option value="semi_montagne">⛰️ Semi-montagne (relief modéré)</option>
                    <option value="ville_plat">🏙️ Ville / Plat (peu de dénivelé)</option>
                  </select>
                </FieldRow>

                <FieldRow fieldKey="race_denivele" dbKey="race_denivele" label="Dénivelé course (D+)"
                  displayVal={profile?.race_denivele ? `${profile.race_denivele} m D+` : 'Non renseigné'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', width: '100%' }}>
                    <input type="number" className="form-input" style={{ flex: 1, fontSize: '.875rem' }}
                      min={0} max={25000} step={100} placeholder="ex: 2500"
                      value={editVal.race_denivele ?? ''} autoFocus
                      onChange={e => setEditVal(prev => ({ ...prev, race_denivele: e.target.value }))} />
                    <span style={{ fontSize: '.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>m D+</span>
                  </div>
                </FieldRow>
              </div></>)}{/* end section 4 trail */}

              {/* ── Section 5 : Triathlon (conditionnel) ── */}
              {isTri && (<>
              <div style={sectionBlock('#06B6D4')}>
                <div style={sectionHdr}>🦾 Triathlon</div>

                <FieldRow fieldKey="open_water" dbKey="open_water" label="🌊 Nage en eau libre"
                  displayVal={
                    profile?.open_water === 'oui'              ? '🌊 Oui, accès eau libre' :
                    profile?.open_water === 'selon_conditions' ? '🌤️ Selon les conditions' :
                    profile?.open_water === 'non'              ? '🏊 Piscine seulement' :
                    'Non renseigné'
                  }>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem', width: '100%' }}>
                    {[
                      { v: 'oui',              l: '🌊 Oui, accès eau libre' },
                      { v: 'selon_conditions', l: '🌤️ Selon les conditions' },
                      { v: 'non',              l: '🏊 Piscine uniquement' },
                    ].map(o => (
                      <label key={o.v} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', cursor: 'pointer', fontSize: '.875rem' }}>
                        <input type="radio" name="open_water" value={o.v}
                          checked={(editVal.open_water ?? profile?.open_water) === o.v}
                          onChange={() => setEditVal(prev => ({ ...prev, open_water: o.v }))}
                          style={{ accentColor: '#06B6D4' }} />
                        {o.l}
                      </label>
                    ))}
                  </div>
                </FieldRow>
              </div></>)}{/* end section 5 triathlon */}

              {/* ── Section 6 : Santé & Forme ── */}
              <div style={sectionBlock('#EC4899')}>
              <div style={sectionHdr}>💊 Santé &amp; Forme</div>

              <FieldRow fieldKey="current_form" dbKey="current_form" label="Forme actuelle"
                displayVal={profile?.current_form || '—'}>
                <input type="text" className="form-input" style={{ fontSize: '.875rem', width: '100%' }}
                  placeholder="ex: Bonne, légère fatigue…"
                  value={editVal.current_form ?? ''} autoFocus
                  onChange={e => setEditVal(prev => ({ ...prev, current_form: e.target.value }))} />
              </FieldRow>

              <FieldRow fieldKey="injuries" dbKey="injuries" label="Blessures / douleurs"
                displayVal={profile?.injuries || 'Aucune'}>
                <input type="text" className="form-input" style={{ fontSize: '.875rem', width: '100%' }}
                  placeholder="ex: Tendinite genou gauche"
                  value={editVal.injuries ?? ''} autoFocus
                  onChange={e => setEditVal(prev => ({ ...prev, injuries: e.target.value }))} />
              </FieldRow>

              {(profile?.gender === 'femme' || profile?.period_pain) && (
                <FieldRow fieldKey="period_pain_days" dbKey="period_pain_days" label="Douleur cycle (j)"
                  displayVal={profile?.period_pain_days ? `${profile.period_pain_days} jour(s)` : '—'}>
                  <input type="number" className="form-input" style={{ fontSize: '.875rem', width: '100%' }}
                    min={1} max={7} value={editVal.period_pain_days ?? ''} autoFocus
                    onChange={e => setEditVal(prev => ({ ...prev, period_pain_days: e.target.value }))} />
                </FieldRow>
              )}
              </div>{/* end section 6 santé */}

            </div>
          )
        })()}
      </div>

      {/* Stats */}
      <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
        <div className="stat-card stat-card--accent">
          <div className="stat-value">{stats.sessions}</div>
          <div className="stat-label">Séances effectuées</div>
        </div>
        <div className="stat-card stat-card--dark">
          <div className="stat-value">{stats.avgRpe || 'N/A'}</div>
          <div className="stat-label">RPE moyen</div>
        </div>
      </div>

      {/* Services connectés */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <h4 style={{ marginBottom: '.4rem' }}>Mes services connectés</h4>
        <p style={{ fontSize: '.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
          Connecte tes montres et applications pour synchroniser tes séances automatiquement.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>

          {/* Strava */}
          <div style={{
            borderRadius: 14,
            border: `1.5px solid ${profile?.strava_connected ? 'rgba(252,76,2,.6)' : 'rgba(252,76,2,.25)'}`,
            background: profile?.strava_connected ? 'rgba(252,76,2,.08)' : 'rgba(252,76,2,.03)',
            padding: '1rem 1.125rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: profile?.strava_connected ? '.875rem' : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                <BrandLogo src="https://logo.clearbit.com/strava.com" bg="#FC4C02" fallback="🔶" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '.9rem', color: '#FC4C02' }}>Strava</div>
                  <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>
                    {profile?.strava_connected ? '● Connecté' : 'Synchronise ta montre GPS'}
                  </div>
                </div>
              </div>
              {profile?.strava_connected ? (
                <div style={{ display: 'flex', gap: '.5rem', flexShrink: 0 }}>
                  <button className="btn btn-sm" onClick={importStrava} disabled={importing}
                    style={{ background: 'rgba(252,76,2,.15)', border: '1px solid rgba(252,76,2,.3)', color: '#FC4C02', fontFamily: 'inherit', fontSize: '.78rem' }}>
                    {importing ? '…' : '🔄 Synchro'}
                  </button>
                  <button className="btn btn-sm" onClick={disconnectStrava} disabled={stravaLoading}
                    style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', fontFamily: 'inherit', fontSize: '.78rem' }}>
                    Déconnecter
                  </button>
                </div>
              ) : (
                <button className="btn btn-sm" onClick={connectStrava} disabled={stravaLoading}
                  style={{ flexShrink: 0, background: 'rgba(252,76,2,.15)', border: '1px solid rgba(252,76,2,.4)', color: '#FC4C02', fontFamily: 'inherit', fontWeight: 700, fontSize: '.8rem' }}>
                  {stravaLoading ? '…' : 'Connecter'}
                </button>
              )}
            </div>
            {profile?.strava_connected && (
              <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                Garmin, Coros et Suunto se synchronisent automatiquement via Strava.
              </div>
            )}
          </div>

          {/* Coros */}
          <div style={{
            borderRadius: 14,
            border: '1.5px solid rgba(20,184,166,.25)',
            background: 'rgba(20,184,166,.03)',
            padding: '1rem 1.125rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '.625rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                <BrandLogo src="https://logo.clearbit.com/coros.com" bg="#0A0A0A" fallback="CO" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '.9rem', color: '#14B8A6' }}>Coros</div>
                  <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>Export FIT par séance</div>
                </div>
              </div>
              <span style={{ fontSize: '.7rem', background: 'rgba(20,184,166,.12)', color: '#14B8A6', border: '1px solid rgba(20,184,166,.25)', borderRadius: 99, padding: '.15rem .6rem', flexShrink: 0 }}>
                Disponible
              </span>
            </div>
            <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
              Utilise le bouton <strong style={{ color: 'var(--text)' }}>Envoyer sur ma Coros</strong> sur chaque séance.
              {profile?.strava_connected && <span style={{ color: '#FC4C02' }}> Tes données sont aussi importées via Strava ✓</span>}
            </div>
          </div>

          {/* Garmin */}
          <div style={{
            borderRadius: 14,
            border: '1.5px solid rgba(99,102,241,.2)',
            background: 'rgba(99,102,241,.03)',
            padding: '1rem 1.125rem',
            opacity: .75,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                <BrandLogo src="https://logo.clearbit.com/garmin.com" bg="#1A1F6C" fallback="G" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '.9rem', color: '#818CF8' }}>Garmin Connect</div>
                  <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>Connexion directe à la montre</div>
                </div>
              </div>
              <span style={{ fontSize: '.7rem', background: 'rgba(255,255,255,.05)', color: 'rgba(255,255,255,.35)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 99, padding: '.15rem .6rem', flexShrink: 0 }}>
                Bientôt
              </span>
            </div>
          </div>

          {/* Suunto */}
          <div style={{
            borderRadius: 14,
            border: '1.5px solid rgba(239,68,68,.2)',
            background: 'rgba(239,68,68,.03)',
            padding: '1rem 1.125rem',
            opacity: .75,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                <BrandLogo src="https://logo.clearbit.com/suunto.com" bg="#CC0000" fallback="S" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '.9rem', color: '#F87171' }}>Suunto</div>
                  <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>Connexion directe à la montre</div>
                </div>
              </div>
              <span style={{ fontSize: '.7rem', background: 'rgba(255,255,255,.05)', color: 'rgba(255,255,255,.35)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 99, padding: '.15rem .6rem', flexShrink: 0 }}>
                Bientôt
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Adapter mon plan */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <h4 style={{ marginBottom: '.4rem' }}>Adapter mon plan</h4>
        <p style={{ fontSize: '.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
          Active une option pour adapter ta semaine en cours. Une seule adaptation à la fois.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>

          {/* 🩹 Blessure */}
          {(() => {
            const active  = planAdaptedFor === 'injury'
            const loading = injuryLoading || (restoreLoading && active)
            const blocked = planAdaptedFor !== null && !active
            return (
              <div style={{
                borderRadius: 14, border: `1.5px solid ${active ? 'rgba(251,146,60,.7)' : 'rgba(251,146,60,.25)'}`,
                background: active ? 'rgba(251,146,60,.1)' : 'rgba(251,146,60,.04)',
                padding: '1rem 1.125rem', opacity: blocked ? .45 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '.9rem', color: '#FB923C', marginBottom: '.2rem' }}>🩹 Blessure</div>
                  <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                    Remplace les séances intenses par des footings de récupération.
                  </div>
                  {active && (
                    <div style={{ marginTop: '.4rem', fontSize: '.75rem', color: '#FED7AA', fontWeight: 600 }}>
                      Actif cette semaine
                    </div>
                  )}
                </div>
                <button
                  onClick={toggleInjury}
                  disabled={loading || blocked}
                  style={{
                    flexShrink: 0, padding: '.42rem .9rem', borderRadius: 99, fontFamily: 'inherit',
                    border: active ? '1.5px solid rgba(251,146,60,.7)' : '1.5px solid rgba(251,146,60,.4)',
                    background: active ? 'rgba(251,146,60,.2)' : 'transparent',
                    color: active ? '#FED7AA' : '#FB923C',
                    fontWeight: 700, fontSize: '.8rem', cursor: (loading || blocked) ? 'default' : 'pointer',
                  }}>
                  {loading ? '…' : active ? 'Désactiver' : 'Activer'}
                </button>
              </div>
            )
          })()}

          {/* 😴 Fatigue */}
          {(() => {
            const active  = planAdaptedFor === 'fatigue'
            const loading = fatigueLoading || (restoreLoading && active)
            const blocked = planAdaptedFor !== null && !active
            return (
              <div style={{
                borderRadius: 14, border: `1.5px solid ${active ? 'rgba(99,102,241,.7)' : 'rgba(99,102,241,.25)'}`,
                background: active ? 'rgba(99,102,241,.1)' : 'rgba(99,102,241,.04)',
                padding: '1rem 1.125rem', opacity: blocked ? .45 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '.9rem', color: '#818CF8', marginBottom: '.2rem' }}>😴 Fatigue</div>
                  <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                    Allège la semaine : supprime l'intensité, garde des footings légers.
                  </div>
                  {active && (
                    <div style={{ marginTop: '.4rem', fontSize: '.75rem', color: '#A5B4FC', fontWeight: 600 }}>
                      Actif cette semaine
                    </div>
                  )}
                </div>
                <button
                  onClick={toggleFatigue}
                  disabled={loading || blocked}
                  style={{
                    flexShrink: 0, padding: '.42rem .9rem', borderRadius: 99, fontFamily: 'inherit',
                    border: active ? '1.5px solid rgba(99,102,241,.7)' : '1.5px solid rgba(99,102,241,.4)',
                    background: active ? 'rgba(99,102,241,.2)' : 'transparent',
                    color: active ? '#A5B4FC' : '#818CF8',
                    fontWeight: 700, fontSize: '.8rem', cursor: (loading || blocked) ? 'default' : 'pointer',
                  }}>
                  {loading ? '…' : active ? 'Désactiver' : 'Activer'}
                </button>
              </div>
            )
          })()}

          {/* 🌡️ Canicule */}
          {(() => {
            const active  = !!profile?.heat_mode
            const blocked = planAdaptedFor !== null && !active
            return (
              <div style={{
                borderRadius: 14, border: `1.5px solid ${active ? 'rgba(234,179,8,.7)' : 'rgba(234,179,8,.25)'}`,
                background: active ? 'rgba(234,179,8,.1)' : 'rgba(234,179,8,.04)',
                padding: '1rem 1.125rem', opacity: blocked ? .45 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '.9rem', color: '#EAB308', marginBottom: '.2rem' }}>🌡️ Canicule</div>
                  <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                    Footings tranquilles uniquement. Pas de séance intense par forte chaleur.
                  </div>
                  {active && (
                    <div style={{ marginTop: '.4rem', fontSize: '.75rem', color: '#FDE047', fontWeight: 600 }}>
                      Actif cette semaine
                    </div>
                  )}
                </div>
                <button
                  onClick={toggleHeat}
                  disabled={heatLoading || blocked}
                  style={{
                    flexShrink: 0, padding: '.42rem .9rem', borderRadius: 99, fontFamily: 'inherit',
                    border: active ? '1.5px solid rgba(234,179,8,.7)' : '1.5px solid rgba(234,179,8,.4)',
                    background: active ? 'rgba(234,179,8,.2)' : 'transparent',
                    color: active ? '#FDE047' : '#EAB308',
                    fontWeight: 700, fontSize: '.8rem', cursor: (heatLoading || blocked) ? 'default' : 'pointer',
                  }}>
                  {heatLoading ? '…' : active ? 'Désactiver' : 'Activer'}
                </button>
              </div>
            )
          })()}

          {/* 🌸 Cycle — femmes uniquement */}
          {(profile?.gender === 'femme' || profile?.period_pain) && (() => {
            const active  = planAdaptedFor === 'cycle'
            const loading = cycleLoading || (restoreLoading && active)
            const blocked = planAdaptedFor !== null && !active
            return (
              <div style={{
                borderRadius: 14, border: `1.5px solid ${active ? 'rgba(236,72,153,.7)' : 'rgba(236,72,153,.25)'}`,
                background: active ? 'rgba(236,72,153,.1)' : 'rgba(236,72,153,.04)',
                padding: '1rem 1.125rem', opacity: blocked ? .45 : 1,
              }}>
                {/* Bouton activer — même pattern que fatigue/canicule */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '.9rem', color: '#F472B6', marginBottom: '.2rem' }}>🌸 Cycle menstruel</div>
                    <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                      Active quand tes règles impactent ton entraînement — le plan s'adapte automatiquement.
                    </div>
                    {active && (
                      <div style={{ marginTop: '.4rem', fontSize: '.75rem', color: '#F9A8D4', fontWeight: 600 }}>
                        Actif cette semaine
                      </div>
                    )}
                  </div>
                  <button
                    onClick={toggleCycle}
                    disabled={loading || blocked}
                    style={{
                      flexShrink: 0, padding: '.42rem .9rem', borderRadius: 99, fontFamily: 'inherit',
                      border: active ? '1.5px solid rgba(236,72,153,.7)' : '1.5px solid rgba(236,72,153,.4)',
                      background: active ? 'rgba(236,72,153,.2)' : 'transparent',
                      color: active ? '#F9A8D4' : '#F472B6',
                      fontWeight: 700, fontSize: '.8rem', cursor: (loading || blocked) ? 'default' : 'pointer',
                    }}>
                    {loading ? '…' : active ? 'Désactiver' : 'Activer'}
                  </button>
                </div>

                {/* Préférences — durée habituelle */}
                <div style={{ borderTop: '1px solid rgba(236,72,153,.15)', paddingTop: '.875rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '.875rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={periodPain} onChange={e => setPeriodPain(e.target.checked)}
                        style={{ width: 16, height: 16, accentColor: '#EC4899' }} />
                      <span style={{ fontSize: '.82rem', fontWeight: 600 }}>Douleurs habituelles</span>
                    </label>
                  </div>
                  {periodPain && (
                    <div style={{ marginBottom: '.875rem' }}>
                      <label style={{ fontSize: '.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '.35rem' }}>
                        Durée habituelle : {periodDays} jour{periodDays > 1 ? 's' : ''}
                      </label>
                      <input type="range" min={1} max={5} value={periodDays} onChange={e => setPeriodDays(parseInt(e.target.value))}
                        style={{ width: '100%', accentColor: '#EC4899' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.72rem', color: 'var(--text-muted)' }}>
                        <span>1 jour</span><span>5 jours</span>
                      </div>
                    </div>
                  )}
                  <button className="btn btn-sm" disabled={savingPeriod} onClick={savePeriodSettings}
                    style={{ background: 'rgba(236,72,153,.12)', border: '1px solid rgba(236,72,153,.25)', color: '#F472B6', fontFamily: 'inherit' }}>
                    {savingPeriod ? 'Sauvegarde…' : '💾 Sauvegarder les préférences'}
                  </button>
                </div>
              </div>
            )
          })()}

        </div>
      </div>

      {/* Subscription */}
      <div className="card">
        <h4 style={{ marginBottom: '1rem' }}>Abonnement</h4>
        {cancelMsg && (
          <div className={`alert ${cancelMsg.startsWith('Erreur') ? 'alert-error' : 'alert-success'}`}
            style={{ marginBottom: '1rem' }}>
            {cancelMsg}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <div style={{ fontWeight: 600 }}>The Ultimate Academy</div>
            <div style={{ fontSize: '.875rem', color: 'var(--text-muted)' }}>30€ / mois</div>
          </div>
          {profile?.subscription_status === 'cancelling' ? (
            <span className="badge badge-warning">⏳ Résiliation en cours</span>
          ) : (
            <span className="badge badge-success">✅ Actif</span>
          )}
        </div>

        {profile?.subscription_status === 'active' && !cancelConfirm && (
          <button className="btn btn-ghost btn-sm"
            style={{ color: 'var(--error)', fontSize: '.8rem' }}
            onClick={() => setCancelConfirm(true)}>
            Résilier mon abonnement
          </button>
        )}

        {cancelConfirm && (
          <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius)', padding: '1rem', marginTop: '.5rem' }}>
            <p style={{ fontSize: '.875rem', marginBottom: '1rem', lineHeight: 1.6 }}>
              Es-tu sûr de vouloir résilier ? Ton accès sera maintenu jusqu'à la fin de la période en cours.
            </p>
            <div style={{ display: 'flex', gap: '.75rem' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setCancelConfirm(false)}>Annuler</button>
              <button className="btn btn-sm" disabled={cancelling}
                style={{ background: 'var(--error)', color: '#fff', border: 'none' }}
                onClick={cancelSubscription}>
                {cancelling ? 'Résiliation…' : 'Confirmer la résiliation'}
              </button>
            </div>
          </div>
        )}

        {profile?.subscription_status === 'cancelling' && (
          <p className="text-sm text-muted" style={{ marginTop: '.5rem' }}>
            Ton abonnement sera définitivement arrêté à la fin de la période payée.
          </p>
        )}
      </div>
    </div>
  )
}
