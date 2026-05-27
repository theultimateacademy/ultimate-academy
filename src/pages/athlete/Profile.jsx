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
  // Canicule
  const [heatLoading,    setHeatLoading]    = useState(false)
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
    vma:          'VMA',
    objective:    'Objectif de course',
    race_date:    'Date de course',
    days_per_week:'Séances par semaine',
    level:        'Niveau',
    injuries:     'Blessures / douleurs',
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
      showToast('Paramètres cycle sauvegardés ✓')
    } catch {
      showToast('Erreur lors de la sauvegarde ✗', 'error')
    } finally {
      setSavingPeriod(false)
    }
  }

  async function loadStats() {
    setLoading(true)
    try {
      const { data: completions } = await supabase
        .from('session_completions').select('rpe').eq('user_id', profile.id)
      const sessions = completions?.length || 0
      const avgRpe   = sessions > 0
        ? Math.round((completions.filter(c => c.rpe).reduce((a, c) => a + c.rpe, 0)) / completions.filter(c => c.rpe).length * 10) / 10
        : 0
      setStats({ sessions, avgRpe })
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
      let coercedValue = value === '' ? null : value
      if (coercedValue !== null && dbKey === 'days_per_week') coercedValue = parseInt(coercedValue, 10)
      if (coercedValue !== null && dbKey === 'vma') coercedValue = parseFloat(coercedValue)

      const { data: updated, error: dbErr } = await supabase
        .from('profiles').update({ [dbKey]: coercedValue }).eq('id', profile.id).select().single()
      if (dbErr) throw dbErr

      updateProfile(updated)
      setEditField(null)

      if (KEY_FIELDS[dbKey] && oldValue !== newValue && newValue) {
        const label = KEY_FIELDS[dbKey]
        supabase.from('messages').insert({
          user_id: profile.id,
          sender:  'athlete',
          content: `⚠️ [PROFIL] ${label} modifié : "${oldValue || '—'}" → "${newValue}"`,
        }).then()

        if (dbKey === 'vma') {
          api.recalculateVma({ userId: profile.id, newVma: parseFloat(value) }).catch(() => {})
          showToast('Tes allures ont été recalculées selon ta nouvelle VMA ✓')
        } else {
          showToast('Profil mis à jour — ton coach adaptera ton plan en conséquence.')
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
      showToast(activate ? '🌡️ Mode canicule activé — plan allégé cette semaine' : '✅ Mode canicule désactivé')
    } catch (err) {
      showToast((err?.message || 'Erreur') + ' ✗', 'error')
    } finally {
      setHeatLoading(false)
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
  function FieldCard({ fieldKey, dbKey, label, displayValue, children }) {
    const isEditing = editField === fieldKey
    return (
      <div
        onClick={() => { if (!isEditing) { startEdit(fieldKey, profile?.[dbKey] ?? '') } }}
        style={{
          position: 'relative',
          padding: '.875rem',
          background: 'var(--surface-2)',
          borderRadius: 'var(--radius)',
          border: isEditing ? '1.5px solid var(--primary)' : '1.5px solid transparent',
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

        {/* Editable grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>

          {/* Objectif */}
          <FieldCard
            fieldKey="objective"
            dbKey="objective"
            label="Objectif"
            displayValue={OBJECTIVE_LABELS[profile?.objective] || 'Non renseigné'}
          >
            <select
              className="form-input"
              style={{ width: '100%', fontSize: '.875rem' }}
              value={editVal.objective ?? ''}
              onChange={e => setEditVal(prev => ({ ...prev, objective: e.target.value }))}
              autoFocus
            >
              <option value="">— Choisir —</option>
              <optgroup label="Course sur route">
                <option value="5km">5 km</option>
                <option value="10km">10 km</option>
                <option value="semi">Semi-marathon</option>
                <option value="marathon">Marathon</option>
              </optgroup>
              <optgroup label="Trail">
                <option value="trail_20k">Trail 20K</option>
                <option value="trail_50k">Trail 50K</option>
                <option value="trail_100k">Trail 100K</option>
                <option value="trail_100m">Trail 100M</option>
              </optgroup>
            </select>
          </FieldCard>

          {/* Niveau */}
          <FieldCard
            fieldKey="level"
            dbKey="level"
            label="Niveau"
            displayValue={LEVEL_LABELS[profile?.level] || 'Non renseigné'}
          >
            <select
              className="form-input"
              style={{ width: '100%', fontSize: '.875rem' }}
              value={editVal.level ?? ''}
              onChange={e => setEditVal(prev => ({ ...prev, level: e.target.value }))}
              autoFocus
            >
              <option value="">— Choisir —</option>
              <option value="debutant">Débutant</option>
              <option value="intermediaire">Intermédiaire</option>
              <option value="confirme">Confirmé</option>
              <option value="expert">Expert</option>
            </select>
          </FieldCard>

          {/* VMA */}
          <FieldCard
            fieldKey="vma"
            dbKey="vma"
            label="VMA"
            displayValue={profile?.vma ? `${profile.vma} km/h` : 'À estimer'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
              <input
                type="number"
                className="form-input"
                style={{ flex: 1, fontSize: '.875rem' }}
                step={0.1}
                min={8}
                max={30}
                value={editVal.vma ?? ''}
                onChange={e => setEditVal(prev => ({ ...prev, vma: e.target.value }))}
                autoFocus
              />
              <span style={{ fontSize: '.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>km/h</span>
            </div>
          </FieldCard>

          {/* Date de course */}
          <FieldCard
            fieldKey="race_date"
            dbKey="race_date"
            label="Date de course"
            displayValue={profile?.race_date
              ? new Date(profile.race_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
              : 'Non définie'}
          >
            <input
              type="date"
              className="form-input"
              style={{ width: '100%', fontSize: '.875rem' }}
              value={editVal.race_date ?? ''}
              onChange={e => setEditVal(prev => ({ ...prev, race_date: e.target.value }))}
              autoFocus
            />
          </FieldCard>

          {/* Chrono cible */}
          <FieldCard
            fieldKey="chrono_goal"
            dbKey="chrono_goal"
            label="Chrono cible"
            displayValue={profile?.chrono_goal || 'Progresser'}
          >
            <input
              type="text"
              className="form-input"
              style={{ width: '100%', fontSize: '.875rem' }}
              placeholder="ex: 1h45 au semi"
              value={editVal.chrono_goal ?? ''}
              onChange={e => setEditVal(prev => ({ ...prev, chrono_goal: e.target.value }))}
              autoFocus
            />
          </FieldCard>

          {/* Jours/semaine */}
          <FieldCard
            fieldKey="days_per_week"
            dbKey="days_per_week"
            label="Jours/semaine"
            displayValue={profile?.days_per_week ? `${profile.days_per_week} jours` : '—'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
              <input
                type="number"
                className="form-input"
                style={{ flex: 1, fontSize: '.875rem' }}
                min={2}
                max={7}
                value={editVal.days_per_week ?? ''}
                onChange={e => setEditVal(prev => ({ ...prev, days_per_week: e.target.value }))}
                autoFocus
              />
              <span style={{ fontSize: '.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>jours/sem.</span>
            </div>
          </FieldCard>

          {/* Course intermédiaire — nom */}
          <FieldCard
            fieldKey="intermediate_race_name"
            dbKey="intermediate_race_name"
            label="Course intermédiaire"
            displayValue={profile?.intermediate_race_name || 'Aucune'}
          >
            <input
              type="text"
              className="form-input"
              style={{ width: '100%', fontSize: '.875rem' }}
              placeholder="ex : Semi de Paris"
              value={editVal.intermediate_race_name ?? ''}
              onChange={e => setEditVal(prev => ({ ...prev, intermediate_race_name: e.target.value }))}
              autoFocus
            />
          </FieldCard>

          {/* Course intermédiaire — date */}
          <FieldCard
            fieldKey="intermediate_race_date"
            dbKey="intermediate_race_date"
            label="Date course intermédiaire"
            displayValue={profile?.intermediate_race_date
              ? new Date(profile.intermediate_race_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
              : 'Non définie'}
          >
            <input
              type="date"
              className="form-input"
              style={{ width: '100%', fontSize: '.875rem' }}
              value={editVal.intermediate_race_date ?? ''}
              onChange={e => setEditVal(prev => ({ ...prev, intermediate_race_date: e.target.value }))}
              autoFocus
            />
          </FieldCard>

          {/* Terrain d'entraînement — visible si trail */}
          {['trail_20k','trail_50k','trail_100k','trail_100m'].includes(profile?.objective) && (
            <FieldCard
              fieldKey="training_terrain"
              dbKey="training_terrain"
              label="Terrain d'entraînement"
              displayValue={
                profile?.training_terrain === 'montagne'      ? '🏔️ Montagne' :
                profile?.training_terrain === 'semi_montagne' ? '⛰️ Semi-montagne' :
                profile?.training_terrain === 'ville_plat'    ? '🏙️ Ville / Plat' :
                'Non renseigné'
              }
            >
              <select
                className="form-input"
                style={{ width: '100%', fontSize: '.875rem' }}
                value={editVal.training_terrain ?? ''}
                onChange={e => setEditVal(prev => ({ ...prev, training_terrain: e.target.value }))}
                autoFocus
              >
                <option value="">— Choisir —</option>
                <option value="montagne">🏔️ Montagne</option>
                <option value="semi_montagne">⛰️ Semi-montagne</option>
                <option value="ville_plat">🏙️ Ville / Plat</option>
              </select>
            </FieldCard>
          )}

        </div>
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
        <h4 style={{ marginBottom: '.875rem' }}>Mes services connectés</h4>

        {/* Message général */}
        <div style={{ background:'rgba(139,47,201,.08)', border:'1px solid rgba(139,47,201,.2)', borderRadius:12, padding:'.75rem 1rem', marginBottom:'1.25rem', fontSize:'.82rem', lineHeight:1.6 }}>
          💡 Connecte Strava pour synchroniser automatiquement tes données depuis ta montre GPS après chaque séance.
        </div>

        {/* Strava */}
        <ServiceRow
          icon={<BrandLogo src="https://logo.clearbit.com/strava.com" bg="#FC4C02" fallback="🔶" />}
          name="Strava"
          connected={profile?.strava_connected}
        >
          {profile?.strava_connected ? (
            <div>
              <div style={{ display:'flex', gap:'.5rem', flexWrap:'wrap', marginBottom:'.625rem' }}>
                <button className="btn btn-secondary btn-sm" onClick={importStrava} disabled={importing}>
                  {importing ? <><div className="spinner spinner-sm" /> Importation…</> : '🔄 Synchroniser'}
                </button>
                <button className="btn btn-danger btn-sm" onClick={disconnectStrava} disabled={stravaLoading}>Déconnecter</button>
              </div>
              <p style={{ fontSize:'.75rem', color:'var(--text-muted)', lineHeight:1.5 }}>
                La connexion Strava synchronise automatiquement tes données depuis ta montre Garmin, Coros ou Suunto.
              </p>
            </div>
          ) : (
            <div>
              <button className="btn btn-primary btn-sm" onClick={connectStrava} disabled={stravaLoading} style={{ marginBottom:'.625rem' }}>
                {stravaLoading ? <><div className="spinner spinner-sm" /> Connexion…</> : '🔗 Connecter Strava'}
              </button>
              <p style={{ fontSize:'.75rem', color:'var(--text-muted)', lineHeight:1.5 }}>
                La connexion Strava permet de synchroniser automatiquement tes données depuis ta montre Garmin, Coros ou Suunto.
              </p>
            </div>
          )}
        </ServiceRow>

        <div style={{ height:1, background:'var(--border)', margin:'.875rem 0' }} />

        {/* Coros */}
        <ServiceRow
          icon={<BrandLogo src="https://logo.clearbit.com/coros.com" bg="#0A0A0A" fallback="CO" />}
          name="Coros"
          connected={null}
          badge={<span style={{ fontSize:'.72rem', background:'rgba(255,255,255,.07)', color:'rgba(255,255,255,.6)', border:'1px solid rgba(255,255,255,.12)', borderRadius:99, padding:'.1rem .5rem' }}>Export FIT</span>}
        >
          <p style={{ fontSize:'.8rem', color:'var(--text-muted)', marginBottom:'.75rem', lineHeight:1.5 }}>
            Clique sur <strong style={{ color:'var(--text)' }}>Envoyer sur ma Coros</strong> sur chaque séance — le fichier se télécharge et les instructions s'affichent.
          </p>
          {profile?.strava_connected ? (
            <div style={{ background:'rgba(252,76,2,.1)', border:'1px solid rgba(252,76,2,.2)', borderRadius:10, padding:'.6rem .75rem', fontSize:'.78rem', lineHeight:1.5 }}>
              🔶 <strong style={{ color:'#FFA07A' }}>Strava connecté</strong> — Tes données Coros sont importées automatiquement via Strava ✓
            </div>
          ) : (
            <div style={{ background:'rgba(139,47,201,.08)', border:'1px solid rgba(139,47,201,.2)', borderRadius:10, padding:'.6rem .75rem', fontSize:'.78rem', lineHeight:1.5 }}>
              💡 <strong style={{ color:'#C084FC' }}>Astuce :</strong> Connecte Strava pour importer automatiquement tes données Coros →{' '}
              <button style={{ background:'none', border:'none', cursor:'pointer', color:'var(--primary)', fontWeight:600, fontSize:'.78rem', fontFamily:'inherit', padding:0 }}
                onClick={connectStrava}>
                Connecter Strava
              </button>
            </div>
          )}
        </ServiceRow>

        <div style={{ height:1, background:'var(--border)', margin:'.875rem 0' }} />

        {/* Garmin — Prochainement */}
        <ServiceRow
          icon={<BrandLogo src="https://logo.clearbit.com/garmin.com" bg="#1A1F6C" fallback="G" />}
          name="Garmin Connect"
          connected={null}
          badge={<span style={{ fontSize:'.72rem', background:'rgba(255,255,255,.05)', color:'rgba(255,255,255,.35)', border:'1px solid rgba(255,255,255,.1)', borderRadius:99, padding:'.1rem .5rem' }}>🔜 Prochainement</span>}
        >
          <p style={{ fontSize:'.78rem', color:'var(--text-muted)', lineHeight:1.5 }}>
            Synchronisation via Strava disponible.<br />
            <span style={{ opacity:.65 }}>Connexion directe à la montre — Bientôt disponible</span>
          </p>
        </ServiceRow>

        <div style={{ height:1, background:'var(--border)', margin:'.875rem 0' }} />

        {/* Suunto — Prochainement */}
        <ServiceRow
          icon={<BrandLogo src="https://logo.clearbit.com/suunto.com" bg="#CC0000" fallback="S" />}
          name="Suunto"
          connected={null}
          badge={<span style={{ fontSize:'.72rem', background:'rgba(255,255,255,.05)', color:'rgba(255,255,255,.35)', border:'1px solid rgba(255,255,255,.1)', borderRadius:99, padding:'.1rem .5rem' }}>🔜 Prochainement</span>}
        >
          <p style={{ fontSize:'.78rem', color:'var(--text-muted)', lineHeight:1.5 }}>
            Synchronisation via Strava disponible.<br />
            <span style={{ opacity:.65 }}>Connexion directe à la montre — Bientôt disponible</span>
          </p>
        </ServiceRow>

      </div>

      {/* Mode canicule — visible pour tous les athlètes */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.75rem' }}>
          <h4 style={{ margin: 0 }}>🌡️ Mode canicule</h4>
          <button
            onClick={toggleHeat}
            disabled={heatLoading}
            style={{
              padding: '.4rem .9rem', borderRadius: 99, fontFamily: 'inherit',
              border: profile?.heat_mode ? '1.5px solid rgba(251,146,60,.6)' : '1.5px solid var(--border)',
              background: profile?.heat_mode ? 'rgba(251,146,60,.15)' : 'var(--surface-2)',
              color: profile?.heat_mode ? '#FB923C' : 'var(--text-muted)',
              fontWeight: 700, fontSize: '.82rem', cursor: heatLoading ? 'default' : 'pointer',
              transition: 'all .2s',
            }}>
            {heatLoading ? '…' : profile?.heat_mode ? '✓ Actif — Désactiver' : 'Activer'}
          </button>
        </div>
        <p className="text-sm text-muted" style={{ lineHeight: 1.6 }}>
          Active ce mode quand il fait trop chaud pour s'entraîner normalement. Ton plan de la semaine en cours est automatiquement allégé — que des footings tranquilles, aucune séance dure. Désactive-le dès que la chaleur redescend.
        </p>
        {profile?.heat_mode && (
          <div style={{ marginTop: '.75rem', background: 'rgba(251,146,60,.1)', border: '1px solid rgba(251,146,60,.3)', borderRadius: 10, padding: '.6rem .875rem', fontSize: '.82rem', color: '#FED7AA' }}>
            🌡️ Actif — plan de cette semaine allégé. Va dans ton plan pour voir les séances adaptées.
          </div>
        )}
      </div>

      {/* Alerte règles — visible uniquement si gender = femme */}
      {profile?.gender === 'femme' && (
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <h4 style={{ marginBottom: '.75rem' }}>🌸 Cycle menstruel</h4>
          <p className="text-sm text-muted" style={{ marginBottom: '1rem', lineHeight: 1.6 }}>
            Si tu as des douleurs importantes pendant tes règles qui t'empêchent de t'entraîner, active cette option.
            Un bouton discret apparaîtra sur ton tableau de bord pour adapter automatiquement ton plan.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={periodPain} onChange={e => setPeriodPain(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: 'var(--primary)' }} />
              <span style={{ fontWeight: 600, fontSize: '.9rem' }}>
                J'ai des douleurs qui impactent mon entraînement
              </span>
            </label>
          </div>
          {periodPain && (
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Durée habituelle des douleurs : {periodDays} jour{periodDays > 1 ? 's' : ''}</label>
              <input type="range" min={1} max={5} value={periodDays} onChange={e => setPeriodDays(parseInt(e.target.value))} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.75rem', color: 'var(--text-muted)' }}>
                <span>1 jour</span><span>5 jours</span>
              </div>
            </div>
          )}
          <button className="btn btn-primary btn-sm" disabled={savingPeriod} onClick={savePeriodSettings}>
            {savingPeriod ? 'Sauvegarde…' : '💾 Sauvegarder'}
          </button>
        </div>
      )}

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
