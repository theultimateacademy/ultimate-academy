import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { api } from '../../lib/api'

const DAYS_CARDS = [
  { v: 2, title: '2 jours',  desc: '2 séances de course' },
  { v: 3, title: '3 jours',  desc: '3 séances de course' },
  { v: 4, title: '4 jours',  desc: '4 séances de course' },
  { v: 5, title: '5 jours',  desc: '5 séances de course' },
  { v: 6, title: '6 jours',  desc: '6 séances de course' },
  { v: 7, title: '7 jours',  desc: '7 séances de course' },
]
const DAYS_WEEK = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

const WATCH_OPTIONS = [
  { v: 'garmin',  l: 'Garmin',  e: '🟢', desc: 'Forerunner, Fenix, Epix…' },
  { v: 'coros',   l: 'Coros',   e: '⚡', desc: 'Pace, Apex, Vertix…' },
  { v: 'suunto',  l: 'Suunto',  e: '🔴', desc: 'Race, 9 Peak, Core…' },
  { v: 'autre',   l: 'Autre',   e: '⌚', desc: 'Samsung, Polar, Fitbit…' },
  { v: 'aucune',  l: 'Aucune',  e: '📱', desc: "J'utilise mon téléphone" },
]

const ROAD_OPTIONS = [
  { v: '5km',      e: '🏃', l: '5 km',          desc: 'Course courte et intense' },
  { v: '10km',     e: '🏃', l: '10 km',         desc: 'Distance phare du running' },
  { v: 'semi',     e: '🏃', l: 'Semi-marathon', desc: '21.1 km — le défi intermédiaire' },
  { v: 'marathon', e: '🏃', l: 'Marathon',      desc: '42.2 km — le grand défi route' },
]

const TRAIL_OPTIONS = [
  { v: 'trail_10k',  e: '🌿', l: 'Trail 10K',  desc: 'Découverte du trail — accessible et fun' },
  { v: 'trail_15k',  e: '🏕️', l: 'Trail 15K',  desc: 'Un premier objectif trail engagé' },
  { v: 'trail_20k',  e: '🏕️', l: 'Trail 20K',  desc: 'Distance phare du trail découverte' },
  { v: 'trail_30k',  e: '⛰️', l: 'Trail 30K',  desc: 'Défi intermédiaire avec dénivelé' },
  { v: 'trail_50k',  e: '⛰️', l: 'Trail 50K',  desc: 'Défi technique et engagé' },
  { v: 'trail_80k',  e: '🏔️', l: 'Trail 80K',  desc: 'Ultra trail — engagement total' },
  { v: 'trail_100k', e: '🏔️', l: 'Trail 100K', desc: "L'ultra long — une épreuve de fond" },
  { v: 'trail_100m', e: '🌋', l: 'Trail 100M', desc: "160km — l'épreuve ultime de l'endurance" },
]

const TRAIL_VALUES     = new Set(['trail_10k', 'trail_15k', 'trail_20k', 'trail_30k', 'trail_50k', 'trail_80k', 'trail_100k', 'trail_100m'])
const TRIATHLON_VALUES = new Set(['tri_sprint', 'tri_olympic', 'tri_half', 'tri_ironman'])

const TRIATHLON_OPTIONS = [
  { v: 'tri_sprint',  e: '⚡', l: 'Triathlon Sprint',    desc: '750m nage · 20km vélo · 5km course' },
  { v: 'tri_olympic', e: '🏅', l: 'Triathlon Olympic',   desc: '1500m nage · 40km vélo · 10km course' },
  { v: 'tri_half',    e: '🔥', l: 'Half Ironman 70.3',   desc: '1,9km nage · 90km vélo · 21km course' },
  { v: 'tri_ironman', e: '🦾', l: 'Ironman',             desc: '3,8km nage · 180km vélo · 42km course' },
]

const OBJECTIVE_MAP = {
  '5km':       '5km',
  '10km':      '10km',
  'semi':      'semi',
  'marathon':  'marathon',
  trail_10k:   'trail_10k',
  trail_15k:   'trail_15k',
  trail_20k:   'trail_20k',
  trail_30k:   'trail_30k',
  trail_50k:   'trail_50k',
  trail_80k:   'trail_80k',
  trail_100k:  'trail_100k',
  trail_100m:  'trail_100m',
  tri_sprint:  'tri_sprint',
  tri_olympic: 'tri_olympic',
  tri_half:    'tri_half',
  tri_ironman: 'tri_ironman',
  debutant:    '5km',
  perf:        'semi',
  route:       '10km',
}

const LEVEL_OPTIONS = [
  { v: 'debutant',      e: '🟢', l: 'Débutant',      desc: 'Je cours depuis moins d\'un an' },
  { v: 'intermediaire', e: '🟡', l: 'Intermédiaire', desc: 'Je cours régulièrement depuis 1 à 3 ans' },
  { v: 'confirme',      e: '🟠', l: 'Confirmé',      desc: 'Je cours en compétition' },
  { v: 'expert',        e: '🔴', l: 'Expert',        desc: 'Performances élevées, grande expérience' },
]

const FORM_OPTIONS = [
  { v: 'tres_frais',      e: '😄', l: 'Forme olympique',             desc: 'Je me sens au top, prêt à tout' },
  { v: 'bien',            e: '🙂', l: 'En forme',                    desc: 'Bonne énergie, rien à signaler' },
  { v: 'un_peu_fatigue',  e: '😐', l: 'Un peu fatigué',              desc: 'Je peux m\'entraîner mais c\'est moins fluide' },
  { v: 'fatigue',         e: '😓', l: 'Fatigué / Besoin de récup',   desc: 'Le corps envoie des signaux d\'alerte' },
]

const INJURY_OPTIONS = [
  { v: 'none',   e: '✅', l: 'Aucune blessure',         desc: 'Je suis en pleine forme' },
  { v: 'light',  e: '⚠️', l: 'Douleur légère',          desc: 'Je peux quand même courir' },
  { v: 'injury', e: '🛑', l: 'Blessure en cours',       desc: 'Je suis limité dans mes entraînements' },
]

const GENDER_OPTIONS = [
  { v: 'homme',      e: '🧑', l: 'Homme' },
  { v: 'femme',      e: '👩', l: 'Femme' },
  { v: 'non_precise', e: '🤝', l: 'Préfère ne pas préciser' },
]

function getStepIds(data) {
  const base = [
    'first_name', 'gender', 'objective', 'race_date', 'intermediate_race',
    'level', 'days_per_week', 'preferred_days',
    'gps_watch', 'vma', 'chrono_goal', 'current_form',
    'injuries', 'coach_message',
  ]

  if (TRAIL_VALUES.has(data.objective)) {
    const interIdx = base.indexOf('intermediate_race')
    // terrain + trail-specific questions after intermediate_race
    base.splice(interIdx + 1, 0, 'training_terrain', 'trail_experience', 'trail_poles')
  }

  if (TRIATHLON_VALUES.has(data.objective)) {
    const interIdx = base.indexOf('intermediate_race')
    // Triathlon-specific questions right after intermediate_race
    base.splice(interIdx + 1, 0,
      'tri_sessions', 'tri_swim_level', 'css', 'ftp', 'open_water', 'bike_type', 'tri_experience'
    )
    // For triathlon: VMA is still used for the run leg
  }

  if (data.gender === 'femme') {
    const injIdx = base.indexOf('injuries')
    base.splice(injIdx + 1, 0, 'period')
  }
  return base
}

const gd = { background: 'linear-gradient(135deg,#8B2FC9,#E8237A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }

function readWizardDraft(userId) {
  if (!userId) return {}
  try { return JSON.parse(localStorage.getItem(`wizard_draft_${userId}`)) || {} } catch { return {} }
}

export default function ProfileWizard() {
  const { user, refreshProfile, updateProfile } = useAuth()
  const navigate = useNavigate()

  const sportType = localStorage.getItem('sport_type') || 'running'

  const [data, setData] = useState(() => {
    const defaults = {
      first_name: '', gender: '', objective: '', objective_other: '',
      race_date: '',
      intermediate_race_date: '', intermediate_race_name: '',
      training_terrain: '',
      level: '',
      vma_known: false, vma: '',
      chrono_goal_known: false, chrono_goal: '',
      days_per_week: 4, preferred_days: [],
      gps_watch: '', best_recent_time: '',
      injuries: '', injury_detail: '',
      current_form: '',
      period_pain: false, period_pain_days: '',
      race_denivele: '',
      coach_message: '',
      trail_experience: '', trail_poles: '',
      tri_swim_sessions: 2, tri_bike_sessions: 2, tri_run_sessions: 2,
      tri_swim_level: '',
      css_known: false, css_value: '',
      ftp_known: false, ftp_value: '',
      open_water: '', bike_type: '',
      tri_experience: '',
    }
    const saved = readWizardDraft(user?.id)
    return saved.data ? { ...defaults, ...saved.data } : defaults
  })

  const [currentIdx, setCurrentIdx] = useState(() => readWizardDraft(user?.id).currentIdx || 0)
  const [direction, setDirection]   = useState('forward')
  const [animKey, setAnimKey]        = useState(0)
  const [submitting, setSubmitting]  = useState(false)
  const [submitAttempt, setSubmitAttempt] = useState(0)
  const [done, setDone]              = useState(false)
  const [error, setError]            = useState('')

  const steps    = getStepIds(data)
  const stepId   = steps[currentIdx]
  const total    = steps.length
  const progress = Math.round(((currentIdx) / (total - 1)) * 100)

  // Pre-warm Render immediately on mount so it's ready when the wizard finishes
  useEffect(() => {
    api.health().catch(() => {})
  }, [])

  useEffect(() => {
    if (!user?.id) return
    localStorage.setItem(`wizard_draft_${user.id}`, JSON.stringify({ data, currentIdx }))
  }, [user?.id, data, currentIdx])

  function set(key, val) { setData(d => ({ ...d, [key]: val })) }

  function toggleDay(d) {
    setData(prev => ({
      ...prev,
      preferred_days: prev.preferred_days.includes(d)
        ? prev.preferred_days.filter(x => x !== d)
        : [...prev.preferred_days, d]
    }))
  }

  function canContinue() {
    if (stepId === 'first_name')    return data.first_name.trim().length > 0
    if (stepId === 'gender')        return !!data.gender
    if (stepId === 'objective')     return !!data.objective
    if (stepId === 'level')         return !!data.level
    if (stepId === 'days_per_week') return data.days_per_week >= 2
    if (stepId === 'current_form')  return !!data.current_form
    if (stepId === 'injuries')      return !!data.injuries
    return true
  }

  function advance() {
    setDirection('forward')
    setAnimKey(k => k + 1)
    if (currentIdx < steps.length - 1) {
      setCurrentIdx(i => i + 1)
    } else {
      handleSubmit()
    }
  }

  function goBack() {
    if (currentIdx === 0) return
    setDirection('back')
    setAnimKey(k => k + 1)
    setCurrentIdx(i => i - 1)
  }

  function selectCard(key, val) {
    set(key, val)
    setTimeout(advance, 200)
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError('')
    const isTri   = TRIATHLON_VALUES.has(data.objective)
    const isTrail = TRAIL_VALUES.has(data.objective)
    const fields = {
      first_name:             data.first_name,
      gender:                 data.gender,
      objective:              OBJECTIVE_MAP[data.objective] || data.objective,
      race_date:              data.race_date || null,
      intermediate_race_date: data.intermediate_race_date || null,
      intermediate_race_name: data.intermediate_race_name || null,
      training_terrain:       data.training_terrain || null,
      level:                  data.level,
      vma_known:              data.vma_known,
      vma:                    data.vma_known ? parseFloat(data.vma) || null : null,
      chrono_goal_known:      data.chrono_goal_known,
      chrono_goal:            data.chrono_goal_known ? data.chrono_goal : '',
      days_per_week:          isTri ? data.tri_run_sessions : data.days_per_week,
      preferred_days:         data.preferred_days,
      gps_watch:              data.gps_watch,
      injuries:               data.injuries === 'none' ? '' : `${data.injuries}${data.injury_detail ? ' — ' + data.injury_detail : ''}`,
      current_form:           data.current_form,
      period_pain:            data.period_pain,
      period_pain_days:       data.period_pain_days ? parseInt(data.period_pain_days) : null,
      race_denivele:          data.race_denivele ? parseInt(data.race_denivele) : null,
      coach_message:          data.coach_message,
      // Trail
      trail_experience:       isTrail ? data.trail_experience || null : null,
      trail_poles:            isTrail ? data.trail_poles || null : null,
      // Triathlon
      tri_swim_sessions:      isTri ? data.tri_swim_sessions : null,
      tri_bike_sessions:      isTri ? data.tri_bike_sessions : null,
      tri_run_sessions:       isTri ? data.tri_run_sessions : null,
      tri_swim_level:         isTri ? data.tri_swim_level || null : null,
      css_known:              isTri ? data.css_known : false,
      css_value:              isTri && data.css_known ? data.css_value || null : null,
      ftp_known:              isTri ? data.ftp_known : false,
      ftp_value:              isTri && data.ftp_known ? parseInt(data.ftp_value) || null : null,
      open_water:             isTri ? data.open_water || null : null,
      bike_type:              isTri ? data.bike_type || null : null,
      tri_experience:         isTri ? data.tri_experience || null : null,
      profile_completed:      true
    }
    if (!user?.id) {
      setError('Session expirée — recharge la page et reconnecte-toi.')
      setSubmitting(false)
      return
    }

    // Try full update first, fallback to base fields if columns missing
    const baseFields = {
      first_name: fields.first_name, objective: fields.objective,
      race_date: fields.race_date, level: fields.level,
      vma_known: fields.vma_known, vma: fields.vma,
      chrono_goal_known: fields.chrono_goal_known, chrono_goal: fields.chrono_goal,
      days_per_week: fields.days_per_week, preferred_days: fields.preferred_days,
      gps_watch: fields.gps_watch, injuries: fields.injuries,
      current_form: fields.current_form, coach_message: fields.coach_message,
      intermediate_race_date: fields.intermediate_race_date,
      intermediate_race_name: fields.intermediate_race_name,
      training_terrain: fields.training_terrain,
      profile_completed: true,
    }

    let savedProfile = null
    try {
      for (const patch of [fields, baseFields]) {
        const { data: row, error: dbErr } = await supabase
          .from('profiles').update(patch).eq('id', user.id).select().single()
        if (!dbErr) { savedProfile = row; break }
        if (!dbErr.message?.includes('column')) throw dbErr
      }
    } catch (err) {
      setError(`Erreur: ${err.message}`)
      setSubmitting(false)
      return
    }

    if (!savedProfile) {
      setError('Impossible de sauvegarder. Réessaie.')
      setSubmitting(false)
      return
    }

    // Ensure free accounts are activated directly in Supabase (bypasses Render)
    const FREE_EMAILS = ['anouklothe@gmail.com']
    if (user.email && FREE_EMAILS.includes(user.email.toLowerCase())) {
      await supabase.from('profiles')
        .update({ subscription_status: 'active' })
        .eq('id', user.id)
        .catch(() => {})
    }

    // Generate plan with retries — Render may be waking from sleep (60s cold start)
    const clientDate = new Date().toLocaleDateString('sv-SE') // YYYY-MM-DD local time
    ;(async () => {
      for (let attempt = 1; attempt <= 4; attempt++) {
        try {
          await api.generatePlan({ userId: user.id, profile: savedProfile, clientDate })
          console.log('[Plan] Generated on attempt', attempt)
          return
        } catch (err) {
          console.warn(`[Plan] Attempt ${attempt}/4 failed:`, err.message)
          if (attempt < 4) await new Promise(r => setTimeout(r, 20000)) // wait 20s then retry
        }
      }
      console.error('[Plan] All attempts failed — server will self-heal on next wake-up')
    })().catch(() => {})
    localStorage.removeItem(`wizard_draft_${user.id}`)
    localStorage.removeItem('sport_type')
    // Force a full page reload to /app/home — this re-reads the profile from Supabase
    // which has profile_completed=true, so RequireActive will pass without race condition
    window.location.replace('/app/home')
  }

  if (done) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 50% 30%, rgba(139,47,201,.15) 0%, transparent 60%), #0C0A18',
      padding: '1.5rem', color: '#fff' }}>
      <div style={{ maxWidth: 480, width: '100%', textAlign: 'center',
        background: 'rgba(255,255,255,.05)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(139,47,201,.3)', borderRadius: 28, padding: '2.5rem 2rem',
        boxShadow: '0 24px 60px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.1)' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>✨</div>
        <h2 style={{ marginBottom: '.75rem', fontSize: '1.6rem' }}>
          C'est parti, <span style={gd}>{data.first_name}</span> !
        </h2>
        <div style={{ background: 'rgba(139,47,201,.1)', border: '1px solid rgba(139,47,201,.25)',
          borderRadius: 16, padding: '1.25rem', marginBottom: '1.75rem', textAlign: 'left' }}>
          <div style={{ fontWeight: 700, marginBottom: '.5rem', fontSize: '.95rem' }}>📊 Une chose essentielle</div>
          <p style={{ fontSize: '.875rem', lineHeight: 1.75, color: 'rgba(255,255,255,.7)' }}>
            Pour que ton coaching soit vraiment personnalisé, il est essentiel que tu remplisses tes retours
            après chaque séance. C'est ce qui fait la différence entre un plan générique et un plan fait pour toi.
          </p>
          <p style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.45)', marginTop: '.6rem', lineHeight: 1.6 }}>
            Plus tu me donnes d'informations, plus ton plan sera précis et adapté.
            Prends le temps de remplir tes retours après chaque séance — c'est ce qui permet à ton plan
            de vraiment évoluer avec toi.
          </p>
        </div>
        <button onClick={() => navigate('/app/home')} style={{
          width: '100%', padding: '1rem', borderRadius: 14,
          background: 'linear-gradient(135deg,#8B2FC9,#E8237A)', color: '#fff',
          border: 'none', fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
          boxShadow: '0 6px 24px rgba(232,35,122,.4)', fontFamily: 'inherit'
        }}>
          Accéder à mon espace →
        </button>
      </div>
    </div>
  )

  const cardStyle = (selected) => ({
    padding: '1.25rem 1rem', borderRadius: 18, cursor: 'pointer', textAlign: 'left',
    border: selected ? '2px solid #8B2FC9' : '1px solid rgba(255,255,255,.1)',
    background: selected ? 'rgba(139,47,201,.18)' : 'rgba(255,255,255,.05)',
    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
    boxShadow: selected ? '0 0 0 1px rgba(139,47,201,.3), 0 8px 24px rgba(139,47,201,.15)' : 'none',
    transition: 'all .15s', fontFamily: 'inherit', width: '100%', color: '#fff',
    display: 'flex', flexDirection: 'column', gap: '.35rem',
  })

  const slideAnim = {
    animation: `${direction === 'forward' ? 'wizSlideIn' : 'wizSlideBack'} .3s cubic-bezier(.4,0,.2,1) both`
  }

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 50% 20%, rgba(139,47,201,.14) 0%, transparent 55%), #0C0A18', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes wizSlideIn   { from { transform: translateX(50px); opacity: 0 } to { transform: none; opacity: 1 } }
        @keyframes wizSlideBack { from { transform: translateX(-50px); opacity: 0 } to { transform: none; opacity: 1 } }
      `}</style>

      {/* Top bar */}
      <div style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(12,10,24,.8)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(139,47,201,.15)' }}>
        <button onClick={goBack} disabled={currentIdx === 0}
          style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.1)', color: currentIdx === 0 ? 'rgba(255,255,255,.2)' : 'rgba(255,255,255,.7)',
            borderRadius: 10, width: 36, height: 36, cursor: currentIdx === 0 ? 'default' : 'pointer', fontSize: '1rem', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>
          ←
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,.1)', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg,#8B2FC9,#E8237A)', width: `${progress}%`, transition: 'width .4s ease' }} />
          </div>
        </div>
        <span style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.4)', flexShrink: 0, fontWeight: 600 }}>
          {currentIdx + 1} / {total}
        </span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.25rem' }}>
        <div key={animKey} style={{ width: '100%', maxWidth: 560, ...slideAnim }}>

          {error && (
            <div style={{ background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.3)', color: '#FCA5A5',
              borderRadius: 12, padding: '.75rem 1rem', marginBottom: '1.25rem', fontSize: '.9rem' }}>
              ⚠️ {error}
            </div>
          )}

          {/* ── first_name ── */}
          {stepId === 'first_name' && <>
            <p style={{ fontSize: '.875rem', color: 'rgba(255,255,255,.4)', textAlign: 'center', marginBottom: '.75rem', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600 }}>Bienvenue</p>
            <h2 style={{ textAlign: 'center', fontSize: 'clamp(1.6rem,5vw,2.2rem)', marginBottom: '2rem', letterSpacing: '-0.02em' }}>
              Comment tu t'appelles ?
            </h2>
            <input style={{ width: '100%', padding: '1.1rem 1.25rem', background: 'rgba(255,255,255,.07)', border: '1.5px solid rgba(139,47,201,.3)', borderRadius: 14, color: '#fff', fontSize: '1.3rem', textAlign: 'center', outline: 'none', fontFamily: 'inherit' }}
              placeholder="Ton prénom…"
              value={data.first_name}
              onChange={e => set('first_name', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && canContinue() && advance()}
              autoFocus />
            <ContinueBtn disabled={!canContinue()} onClick={advance} />
          </>}

          {/* ── gender ── */}
          {stepId === 'gender' && <>
            <StepLabel>Question {currentIdx + 1}</StepLabel>
            <StepTitle>Tu es…</StepTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '.75rem' }}>
              {GENDER_OPTIONS.map(o => (
                <button key={o.v} onClick={() => selectCard('gender', o.v)} style={{ ...cardStyle(data.gender === o.v), alignItems: 'center', textAlign: 'center', padding: '1.5rem 1rem' }}>
                  <span style={{ fontSize: '2.5rem' }}>{o.e}</span>
                  <span style={{ fontWeight: 600, fontSize: '.9rem', color: data.gender === o.v ? '#fff' : 'rgba(255,255,255,.7)' }}>{o.l}</span>
                </button>
              ))}
            </div>
          </>}

          {/* ── objective ── */}
          {stepId === 'objective' && <>
            <StepLabel>Question {currentIdx + 1}</StepLabel>
            <StepTitle>Quel est ton objectif ?</StepTitle>

            {/* Course à pied */}
            {sportType === 'running' && <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.65rem', marginBottom: '1rem' }}>
                {ROAD_OPTIONS.map(o => (
                  <button key={o.v} onClick={() => set('objective', o.v)} style={{ ...cardStyle(data.objective === o.v), alignItems: 'flex-start', padding: '.9rem 1rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '.95rem' }}>{o.l}</div>
                    <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.45)', marginTop: '.15rem', lineHeight: 1.4 }}>{o.desc}</div>
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem', marginBottom: '.5rem' }}>
                {[
                  { v: 'debutant', e: '🌱', l: 'Commencer à courir',      desc: 'Je débute et veux progresser sans me blesser' },
                  { v: 'perf',     e: '⚡', l: 'Progresser et performer', desc: 'Je cours déjà et veux passer au niveau supérieur' },
                ].map(o => (
                  <button key={o.v} onClick={() => set('objective', o.v)} style={{ ...cardStyle(data.objective === o.v), flexDirection: 'row', alignItems: 'center', gap: '.9rem', padding: '.9rem 1rem' }}>
                    <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{o.e}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '.9rem' }}>{o.l}</div>
                      <div style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.45)', marginTop: '.1rem' }}>{o.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </>}

            {/* Trail */}
            {sportType === 'trail' && <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.65rem', marginBottom: '1rem' }}>
                {TRAIL_OPTIONS.map(o => (
                  <button key={o.v} onClick={() => set('objective', o.v)} style={{ ...cardStyle(data.objective === o.v), alignItems: 'flex-start', padding: '.9rem 1rem' }}>
                    <span style={{ fontSize: '1.4rem' }}>{o.e}</span>
                    <div style={{ fontWeight: 700, fontSize: '.95rem' }}>{o.l}</div>
                    <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.45)', marginTop: '.1rem', lineHeight: 1.4 }}>{o.desc}</div>
                  </button>
                ))}
              </div>
              {TRAIL_VALUES.has(data.objective) && (
                <div style={{ background: 'rgba(139,47,201,.08)', border: '1px solid rgba(139,47,201,.25)', borderRadius: 14, padding: '1rem 1.1rem', marginBottom: '.75rem' }}>
                  <div style={{ fontSize: '.875rem', fontWeight: 600, marginBottom: '.6rem', color: 'rgba(255,255,255,.8)' }}>
                    Dénivelé positif total de la course
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                    <input type="number" min={0} max={20000} step={100}
                      style={{ width: 110, padding: '.7rem', background: 'rgba(255,255,255,.07)', border: '1.5px solid rgba(139,47,201,.35)', borderRadius: 10, color: '#fff', fontSize: '1.1rem', textAlign: 'center', outline: 'none', fontFamily: 'inherit' }}
                      value={data.race_denivele}
                      onChange={e => set('race_denivele', e.target.value)}
                      placeholder="2500" />
                    <span style={{ color: 'rgba(255,255,255,.5)', fontSize: '.9rem' }}>m+</span>
                    <span style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.35)' }}>optionnel</span>
                  </div>
                </div>
              )}
            </>}

            {/* Triathlon */}
            {sportType === 'triathlon' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.65rem', marginBottom: '1rem' }}>
                {TRIATHLON_OPTIONS.map(o => (
                  <button key={o.v} onClick={() => selectCard('objective', o.v)} style={{ ...cardStyle(data.objective === o.v), alignItems: 'flex-start', padding: '.9rem 1rem' }}>
                    <span style={{ fontSize: '1.4rem' }}>{o.e}</span>
                    <div style={{ fontWeight: 700, fontSize: '.95rem' }}>{o.l}</div>
                    <div style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.45)', marginTop: '.1rem', lineHeight: 1.4 }}>{o.desc}</div>
                  </button>
                ))}
              </div>
            )}

            {data.objective && <ContinueBtn onClick={advance} />}
          </>}

          {/* ── race_date ── */}
          {stepId === 'race_date' && <>
            <StepLabel>Question {currentIdx + 1}</StepLabel>
            <StepTitle>As-tu une date de course ?</StepTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
              <input type="date" style={{ padding: '.9rem 1.25rem', background: 'rgba(255,255,255,.07)', border: '1.5px solid rgba(139,47,201,.3)', borderRadius: 14, color: '#fff', fontSize: '1.1rem', outline: 'none', fontFamily: 'inherit', colorScheme: 'dark' }}
                value={data.race_date}
                onChange={e => set('race_date', e.target.value)}
                min={new Date().toISOString().split('T')[0]} />
              <button onClick={advance} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.4)', cursor: 'pointer', fontSize: '.9rem', fontFamily: 'inherit', padding: '.5rem 1rem' }}>
                Je n'ai pas encore de date →
              </button>
            </div>
            <ContinueBtn disabled={!data.race_date} onClick={advance} label="Confirmer" />
          </>}

          {/* ── intermediate_race ── */}
          {stepId === 'intermediate_race' && <>
            <StepLabel>Question {currentIdx + 1}</StepLabel>
            <StepTitle>As-tu une course intermédiaire ?</StepTitle>
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,.4)', fontSize: '.875rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Une course avant ton objectif principal ? Je planifie un mini-affûtage d'une semaine avant.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.875rem', marginBottom: '.5rem' }}>
              <input
                type="text"
                style={{ width: '100%', padding: '.9rem 1.1rem', background: 'rgba(255,255,255,.07)', border: '1.5px solid rgba(139,47,201,.3)', borderRadius: 12, color: '#fff', fontSize: '1rem', outline: 'none', fontFamily: 'inherit' }}
                placeholder="Nom de la course (ex : Semi de Paris)"
                value={data.intermediate_race_name}
                onChange={e => set('intermediate_race_name', e.target.value)}
              />
              <input
                type="date"
                style={{ padding: '.9rem 1.25rem', background: 'rgba(255,255,255,.07)', border: '1.5px solid rgba(139,47,201,.3)', borderRadius: 14, color: '#fff', fontSize: '1rem', outline: 'none', fontFamily: 'inherit', colorScheme: 'dark', width: '100%' }}
                value={data.intermediate_race_date}
                onChange={e => set('intermediate_race_date', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <button onClick={advance} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.4)', cursor: 'pointer', fontSize: '.9rem', fontFamily: 'inherit', padding: '.5rem 1rem', display: 'block', margin: '0 auto' }}>
              Pas de course intermédiaire →
            </button>
            <ContinueBtn
              disabled={!!(data.intermediate_race_name && !data.intermediate_race_date)}
              onClick={advance}
              label="Confirmer"
            />
          </>}

          {/* ── training_terrain (trail only) ── */}
          {stepId === 'training_terrain' && <>
            <StepLabel>Question {currentIdx + 1}</StepLabel>
            <StepTitle>Où t'entraînes-tu ?</StepTitle>
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,.4)', fontSize: '.875rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Pour adapter tes séances trail à ton terrain disponible.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              {[
                { v: 'montagne',      e: '🏔️', l: 'Montagne',         desc: 'Accès direct à du vrai dénivelé — côtes, sentiers, D+' },
                { v: 'semi_montagne', e: '⛰️',  l: 'Semi-montagne',   desc: 'Mix plat et relief — quelques côtes disponibles' },
                { v: 'ville_plat',    e: '🏙️', l: 'Ville / Plat',    desc: 'Peu de dénivelé — escaliers, tapis incliné, marche nordique' },
              ].map(o => (
                <button key={o.v} onClick={() => selectCard('training_terrain', o.v)}
                  style={{ ...cardStyle(data.training_terrain === o.v), flexDirection: 'row', alignItems: 'center', gap: '1rem', padding: '1.1rem 1.25rem' }}>
                  <span style={{ fontSize: '1.8rem', flexShrink: 0 }}>{o.e}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '.975rem' }}>{o.l}</div>
                    <div style={{ fontSize: '.82rem', color: 'rgba(255,255,255,.5)', marginTop: '.1rem' }}>{o.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </>}

          {/* ── trail_experience ── */}
          {stepId === 'trail_experience' && <>
            <StepLabel>Trail — Question {currentIdx + 1}</StepLabel>
            <StepTitle>Ton expérience en trail ?</StepTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              {[
                { v: 'jamais',       e: '🌱', l: 'Première course trail',     desc: 'Je viens du running sur route ou je débute' },
                { v: 'quelques',     e: '🏕️', l: 'Quelques courses trail',    desc: 'Moins de 5 courses trail au compteur' },
                { v: 'experimente',  e: '🏔️', l: 'Expérimenté',              desc: '5+ courses trail, je connais les codes' },
              ].map(o => (
                <button key={o.v} onClick={() => selectCard('trail_experience', o.v)}
                  style={{ ...cardStyle(data.trail_experience === o.v), flexDirection: 'row', alignItems: 'center', gap: '1rem', padding: '1.1rem 1.25rem' }}>
                  <span style={{ fontSize: '1.8rem', flexShrink: 0 }}>{o.e}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '.975rem' }}>{o.l}</div>
                    <div style={{ fontSize: '.82rem', color: 'rgba(255,255,255,.5)', marginTop: '.1rem' }}>{o.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </>}

          {/* ── trail_poles ── */}
          {stepId === 'trail_poles' && <>
            <StepLabel>Trail — Question {currentIdx + 1}</StepLabel>
            <StepTitle>Tu as des bâtons de trail ?</StepTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              {[
                { v: 'oui',     e: '🥢', l: 'Oui, j\'en ai',         desc: 'Je les utilise déjà en entraînement' },
                { v: 'prevois', e: '🛒', l: 'Je prévois d\'en acheter', desc: 'Utiles pour les longues distances' },
                { v: 'non',     e: '🙅', l: 'Non, sans bâtons',      desc: 'Je préfère courir sans' },
              ].map(o => (
                <button key={o.v} onClick={() => selectCard('trail_poles', o.v)}
                  style={{ ...cardStyle(data.trail_poles === o.v), flexDirection: 'row', alignItems: 'center', gap: '1rem', padding: '1.1rem 1.25rem' }}>
                  <span style={{ fontSize: '1.8rem', flexShrink: 0 }}>{o.e}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '.975rem' }}>{o.l}</div>
                    <div style={{ fontSize: '.82rem', color: 'rgba(255,255,255,.5)', marginTop: '.1rem' }}>{o.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </>}

          {/* ── tri_sessions ── */}
          {stepId === 'tri_sessions' && <>
            <StepLabel>Triathlon — Question {currentIdx + 1}</StepLabel>
            <StepTitle>Combien de séances par semaine ?</StepTitle>
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,.4)', fontSize: '.875rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Ton volume d'entraînement triathlon hebdomadaire.
            </p>
            {[
              { key: 'tri_swim_sessions', label: '🏊 Natation', min: 1, max: 4, emoji: '🏊' },
              { key: 'tri_bike_sessions', label: '🚴 Vélo',     min: 1, max: 4, emoji: '🚴' },
              { key: 'tri_run_sessions',  label: '🏃 Course',   min: 1, max: 6, emoji: '🏃' },
            ].map(({ key, label, min, max }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', background: 'rgba(255,255,255,.05)', borderRadius: 14, padding: '.875rem 1.1rem' }}>
                <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{label.split(' ')[0]}</span>
                <span style={{ fontWeight: 600, flex: 1, fontSize: '.95rem' }}>{label.split(' ').slice(1).join(' ')}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                  <button onClick={() => set(key, Math.max(min, data[key] - 1))}
                    style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.15)', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '1.1rem', fontFamily: 'inherit' }}>−</button>
                  <span style={{ fontWeight: 800, fontSize: '1.4rem', minWidth: 28, textAlign: 'center' }}>{data[key]}</span>
                  <button onClick={() => set(key, Math.min(max, data[key] + 1))}
                    style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.15)', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '1.1rem', fontFamily: 'inherit' }}>+</button>
                </div>
              </div>
            ))}
            <ContinueBtn onClick={advance} />
          </>}

          {/* ── tri_swim_level ── */}
          {stepId === 'tri_swim_level' && <>
            <StepLabel>Triathlon — Question {currentIdx + 1}</StepLabel>
            <StepTitle>Ton niveau en natation ?</StepTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              {[
                { v: 'debutant',      e: '🤽', l: 'Débutant',      desc: 'Je nage mais pas régulièrement — je travaille les bases' },
                { v: 'intermediaire', e: '🏊', l: 'Intermédiaire', desc: 'Je nage régulièrement, je suis à l\'aise en piscine' },
                { v: 'confirme',      e: '🌊', l: 'Confirmé',      desc: 'Je nage en compétition ou en club' },
              ].map(o => (
                <button key={o.v} onClick={() => selectCard('tri_swim_level', o.v)}
                  style={{ ...cardStyle(data.tri_swim_level === o.v), flexDirection: 'row', alignItems: 'center', gap: '1rem', padding: '1.1rem 1.25rem' }}>
                  <span style={{ fontSize: '1.8rem', flexShrink: 0 }}>{o.e}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '.975rem' }}>{o.l}</div>
                    <div style={{ fontSize: '.82rem', color: 'rgba(255,255,255,.5)', marginTop: '.1rem' }}>{o.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </>}

          {/* ── css ── */}
          {stepId === 'css' && <>
            <StepLabel>Triathlon — Question {currentIdx + 1}</StepLabel>
            <StepTitle>Tu connais ton CSS ?</StepTitle>
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,.4)', fontSize: '.875rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Le CSS (Critical Swim Speed) définit toutes tes allures de nage.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem', marginBottom: '1.25rem' }}>
              {[{ v: true, e: '🎯', l: 'Je connais mon CSS', desc: 'Je vais le saisir' },
                { v: false, e: '🧪', l: 'Je ne sais pas', desc: 'Test CSS prévu en S1-S2' }].map(o => (
                <button key={String(o.v)} onClick={() => set('css_known', o.v)}
                  style={{ ...cardStyle(data.css_known === o.v), alignItems: 'center', textAlign: 'center', padding: '1.25rem 1rem' }}>
                  <span style={{ fontSize: '1.8rem' }}>{o.e}</span>
                  <span style={{ fontWeight: 700, fontSize: '.875rem' }}>{o.l}</span>
                  <span style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.45)', lineHeight: 1.4 }}>{o.desc}</span>
                </button>
              ))}
            </div>
            {data.css_known && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', justifyContent: 'center', marginBottom: '.5rem' }}>
                <input style={{ width: 130, padding: '.9rem', background: 'rgba(255,255,255,.07)', border: '1.5px solid rgba(139,47,201,.35)', borderRadius: 14, color: '#fff', fontSize: '1.3rem', textAlign: 'center', outline: 'none', fontFamily: 'inherit' }}
                  placeholder="1'45" value={data.css_value}
                  onChange={e => set('css_value', e.target.value)} autoFocus />
                <span style={{ fontWeight: 600, color: 'rgba(255,255,255,.5)', fontSize: '1rem' }}>/100m</span>
              </div>
            )}
            <ContinueBtn onClick={advance} />
          </>}

          {/* ── ftp ── */}
          {stepId === 'ftp' && <>
            <StepLabel>Triathlon — Question {currentIdx + 1}</StepLabel>
            <StepTitle>Tu as un capteur de puissance ?</StepTitle>
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,.4)', fontSize: '.875rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              La FTP (seuil fonctionnel) calibre l'intensité de tes séances vélo.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem', marginBottom: '1.25rem' }}>
              {[{ v: true, e: '⚡', l: 'Oui, j\'ai ma FTP', desc: 'Je vais la saisir en watts' },
                { v: false, e: '❤️', l: 'Non', desc: 'On travaillera en RPE et % FC max' }].map(o => (
                <button key={String(o.v)} onClick={() => set('ftp_known', o.v)}
                  style={{ ...cardStyle(data.ftp_known === o.v), alignItems: 'center', textAlign: 'center', padding: '1.25rem 1rem' }}>
                  <span style={{ fontSize: '1.8rem' }}>{o.e}</span>
                  <span style={{ fontWeight: 700, fontSize: '.875rem' }}>{o.l}</span>
                  <span style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.45)', lineHeight: 1.4 }}>{o.desc}</span>
                </button>
              ))}
            </div>
            {data.ftp_known && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', justifyContent: 'center', marginBottom: '.5rem' }}>
                <input type="number" style={{ width: 130, padding: '.9rem', background: 'rgba(255,255,255,.07)', border: '1.5px solid rgba(139,47,201,.35)', borderRadius: 14, color: '#fff', fontSize: '1.3rem', textAlign: 'center', outline: 'none', fontFamily: 'inherit' }}
                  placeholder="220" min={80} max={500}
                  value={data.ftp_value}
                  onChange={e => set('ftp_value', e.target.value)} autoFocus />
                <span style={{ fontWeight: 600, color: 'rgba(255,255,255,.5)', fontSize: '1rem' }}>watts</span>
              </div>
            )}
            <ContinueBtn onClick={advance} />
          </>}

          {/* ── open_water ── */}
          {stepId === 'open_water' && <>
            <StepLabel>Triathlon — Question {currentIdx + 1}</StepLabel>
            <StepTitle>Tu veux t'entraîner en eau libre ?</StepTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              {[
                { v: 'oui',                e: '🌊', l: 'Oui',                    desc: 'Lac, mer, rivière — j\'ai accès à l\'eau libre' },
                { v: 'selon_conditions',   e: '🌤️', l: 'Selon les conditions',  desc: 'Quand c\'est possible et sécurisé' },
                { v: 'non',                e: '🏊', l: 'Non, piscine uniquement', desc: 'Je n\'ai pas accès à l\'eau libre' },
              ].map(o => (
                <button key={o.v} onClick={() => selectCard('open_water', o.v)}
                  style={{ ...cardStyle(data.open_water === o.v), flexDirection: 'row', alignItems: 'center', gap: '1rem', padding: '1.1rem 1.25rem' }}>
                  <span style={{ fontSize: '1.8rem', flexShrink: 0 }}>{o.e}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '.975rem' }}>{o.l}</div>
                    <div style={{ fontSize: '.82rem', color: 'rgba(255,255,255,.5)', marginTop: '.1rem' }}>{o.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </>}

          {/* ── bike_type ── */}
          {stepId === 'bike_type' && <>
            <StepLabel>Triathlon — Question {currentIdx + 1}</StepLabel>
            <StepTitle>Quel vélo tu utilises ?</StepTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              {[
                { v: 'route',        e: '🚴', l: 'Vélo de route',         desc: 'Guidon courbé, position classique' },
                { v: 'triathlon_tt', e: '⚡', l: 'Vélo triathlon / TT',   desc: 'Position aéro, extensions de guidon' },
                { v: 'gravel_vtt',   e: '🌲', l: 'Vélo gravel / VTT',     desc: 'Terrain varié, position plus haute' },
                { v: 'aucun',        e: '🛒', l: 'Pas encore de vélo',    desc: 'Je vais en acheter un' },
              ].map(o => (
                <button key={o.v} onClick={() => selectCard('bike_type', o.v)}
                  style={{ ...cardStyle(data.bike_type === o.v), flexDirection: 'row', alignItems: 'center', gap: '1rem', padding: '1.1rem 1.25rem' }}>
                  <span style={{ fontSize: '1.8rem', flexShrink: 0 }}>{o.e}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '.975rem' }}>{o.l}</div>
                    <div style={{ fontSize: '.82rem', color: 'rgba(255,255,255,.5)', marginTop: '.1rem' }}>{o.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </>}

          {/* ── tri_experience ── */}
          {stepId === 'tri_experience' && <>
            <StepLabel>Triathlon — Question {currentIdx + 1}</StepLabel>
            <StepTitle>Ton expérience triathlon ?</StepTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              {[
                { v: 'jamais',       e: '🌱', l: 'Premier triathlon',        desc: 'Je n\'en ai jamais fait, c\'est mon premier' },
                { v: 'quelques',     e: '🏅', l: 'Quelques triathlons',     desc: 'Moins de 5 triathlons au compteur' },
                { v: 'experimente',  e: '🏆', l: 'Expérimenté',             desc: '5+ triathlons, je connais les transitions' },
              ].map(o => (
                <button key={o.v} onClick={() => selectCard('tri_experience', o.v)}
                  style={{ ...cardStyle(data.tri_experience === o.v), flexDirection: 'row', alignItems: 'center', gap: '1rem', padding: '1.1rem 1.25rem' }}>
                  <span style={{ fontSize: '1.8rem', flexShrink: 0 }}>{o.e}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '.975rem' }}>{o.l}</div>
                    <div style={{ fontSize: '.82rem', color: 'rgba(255,255,255,.5)', marginTop: '.1rem' }}>{o.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </>}

          {/* ── level ── */}
          {stepId === 'level' && <>
            <StepLabel>Question {currentIdx + 1}</StepLabel>
            <StepTitle>Quel est ton niveau ?</StepTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              {LEVEL_OPTIONS.map(o => (
                <button key={o.v} onClick={() => selectCard('level', o.v)} style={{ ...cardStyle(data.level === o.v), flexDirection: 'row', alignItems: 'center', gap: '1rem', padding: '1.1rem 1.25rem' }}>
                  <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{o.e}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '.975rem' }}>{o.l}</div>
                    <div style={{ fontSize: '.82rem', color: 'rgba(255,255,255,.5)', marginTop: '.1rem' }}>{o.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </>}

          {/* ── days_per_week ── */}
          {stepId === 'days_per_week' && <>
            <StepLabel>Question {currentIdx + 1}</StepLabel>
            <StepTitle>Combien de séances de course par semaine ?</StepTitle>
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,.45)', fontSize: '.85rem', marginBottom: '1.25rem', lineHeight: 1.6, maxWidth: 320, margin: '0 auto 1.25rem' }}>
              Le renforcement musculaire est inclus en bonus — 1 séance par semaine, en plus de ce nombre.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '.75rem' }}>
              {DAYS_CARDS.map(d => (
                <button key={d.v} onClick={() => selectCard('days_per_week', d.v)} style={{ ...cardStyle(data.days_per_week === d.v), alignItems: 'center', textAlign: 'center', padding: '1.25rem .75rem' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 800, ...(data.days_per_week === d.v ? gd : {}) }}>{d.v}</span>
                  <span style={{ fontWeight: 700, fontSize: '.85rem' }}>{d.title}</span>
                  <span style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.45)', lineHeight: 1.4 }}>{d.desc}</span>
                </button>
              ))}
            </div>
          </>}

          {/* ── preferred_days ── */}
          {stepId === 'preferred_days' && <>
            <StepLabel>Question {currentIdx + 1}</StepLabel>
            <StepTitle>Quels jours tu préfères ?</StepTitle>
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,.4)', fontSize: '.875rem', marginBottom: '1.5rem' }}>Sélectionne autant que tu veux</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.6rem', justifyContent: 'center', marginBottom: '2rem' }}>
              {DAYS_WEEK.map(d => {
                const sel = data.preferred_days.includes(d)
                return (
                  <button key={d} onClick={() => toggleDay(d)} style={{
                    padding: '.65rem 1.2rem', borderRadius: 99, fontWeight: 600, fontSize: '.9rem',
                    border: sel ? '2px solid #8B2FC9' : '1px solid rgba(255,255,255,.15)',
                    background: sel ? 'linear-gradient(135deg,rgba(139,47,201,.3),rgba(232,35,122,.2))' : 'rgba(255,255,255,.06)',
                    color: sel ? '#fff' : 'rgba(255,255,255,.6)', cursor: 'pointer', fontFamily: 'inherit',
                    boxShadow: sel ? '0 0 12px rgba(139,47,201,.3)' : 'none', transition: 'all .15s'
                  }}>{d}</button>
                )
              })}
            </div>
            <ContinueBtn onClick={advance} label={data.preferred_days.length ? 'Confirmer' : 'Passer →'} />
          </>}

          {/* ── gps_watch ── */}
          {stepId === 'gps_watch' && <>
            <StepLabel>Question {currentIdx + 1}</StepLabel>
            <StepTitle>Quelle montre GPS ?</StepTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '.75rem' }}>
              {WATCH_OPTIONS.map(o => (
                <button key={o.v} onClick={() => selectCard('gps_watch', o.v)} style={{ ...cardStyle(data.gps_watch === o.v), padding: '1rem', flexDirection: 'row', alignItems: 'center', gap: '.75rem' }}>
                  <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{o.e}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '.9rem' }}>{o.l}</div>
                    <div style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.4)' }}>{o.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </>}

          {/* ── vma ── */}
          {stepId === 'vma' && <>
            <StepLabel>Question {currentIdx + 1}</StepLabel>
            <StepTitle>Connais-tu ta VMA ?</StepTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem', marginBottom: '1.25rem' }}>
              {[{ v: true, e: '✅', l: 'Je connais ma VMA', desc: 'Je vais la saisir' },
                { v: false, e: '🤷', l: 'Je ne sais pas', desc: 'On l\'estimera ensemble' }].map(o => (
                <button key={String(o.v)} onClick={() => set('vma_known', o.v)}
                  style={{ ...cardStyle(data.vma_known === o.v), alignItems: 'center', textAlign: 'center', padding: '1.25rem 1rem' }}>
                  <span style={{ fontSize: '1.8rem' }}>{o.e}</span>
                  <span style={{ fontWeight: 700, fontSize: '.875rem' }}>{o.l}</span>
                  <span style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.45)' }}>{o.desc}</span>
                </button>
              ))}
            </div>
            {data.vma_known && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center' }}>
                <input type="number" style={{ width: 120, padding: '.9rem', background: 'rgba(255,255,255,.07)', border: '1.5px solid rgba(139,47,201,.35)', borderRadius: 14, color: '#fff', fontSize: '1.5rem', textAlign: 'center', outline: 'none', fontFamily: 'inherit' }}
                  value={data.vma} onChange={e => set('vma', e.target.value)}
                  min={8} max={25} step={0.1} placeholder="15.5" autoFocus />
                <span style={{ fontWeight: 600, color: 'rgba(255,255,255,.5)', fontSize: '1.1rem' }}>km/h</span>
              </div>
            )}
            <ContinueBtn onClick={advance} />
          </>}

          {/* ── chrono_goal ── */}
          {stepId === 'chrono_goal' && <>
            <StepLabel>Question {currentIdx + 1}</StepLabel>
            <StepTitle>As-tu un objectif de temps ?</StepTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem', marginBottom: '1.25rem' }}>
              {[{ v: true, e: '🎯', l: 'Oui, j\'ai un chrono cible', desc: 'Je veux battre un temps précis' },
                { v: false, e: '📈', l: 'Non, juste progresser', desc: 'L\'important c\'est d\'aller plus loin' }].map(o => (
                <button key={String(o.v)} onClick={() => set('chrono_goal_known', o.v)}
                  style={{ ...cardStyle(data.chrono_goal_known === o.v), alignItems: 'center', textAlign: 'center', padding: '1.25rem 1rem' }}>
                  <span style={{ fontSize: '1.8rem' }}>{o.e}</span>
                  <span style={{ fontWeight: 700, fontSize: '.875rem' }}>{o.l}</span>
                  <span style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.45)' }}>{o.desc}</span>
                </button>
              ))}
            </div>
            {data.chrono_goal_known && (
              <input style={{ width: '100%', padding: '.9rem 1.1rem', background: 'rgba(255,255,255,.07)', border: '1.5px solid rgba(139,47,201,.35)', borderRadius: 12, color: '#fff', fontSize: '1rem', outline: 'none', fontFamily: 'inherit' }}
                placeholder="Ex : passer sous 1h45 au semi…"
                value={data.chrono_goal}
                onChange={e => set('chrono_goal', e.target.value)}
                autoFocus />
            )}
            <ContinueBtn onClick={advance} />
          </>}

          {/* ── current_form ── */}
          {stepId === 'current_form' && <>
            <StepLabel>Question {currentIdx + 1}</StepLabel>
            <StepTitle>Comment tu te sens en ce moment ?</StepTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              {FORM_OPTIONS.map(o => (
                <button key={o.v} onClick={() => selectCard('current_form', o.v)} style={{ ...cardStyle(data.current_form === o.v), flexDirection: 'row', alignItems: 'center', gap: '1rem', padding: '1.1rem 1.25rem' }}>
                  <span style={{ fontSize: '1.8rem', flexShrink: 0 }}>{o.e}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '.95rem' }}>{o.l}</div>
                    <div style={{ fontSize: '.82rem', color: 'rgba(255,255,255,.5)', marginTop: '.1rem' }}>{o.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </>}

          {/* ── injuries ── */}
          {stepId === 'injuries' && <>
            <StepLabel>Question {currentIdx + 1}</StepLabel>
            <StepTitle>Blessures ou douleurs ?</StepTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem', marginBottom: '1rem' }}>
              {INJURY_OPTIONS.map(o => (
                <button key={o.v} onClick={() => set('injuries', o.v)} style={{ ...cardStyle(data.injuries === o.v), flexDirection: 'row', alignItems: 'center', gap: '1rem', padding: '1.1rem 1.25rem' }}>
                  <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{o.e}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '.95rem' }}>{o.l}</div>
                    <div style={{ fontSize: '.82rem', color: 'rgba(255,255,255,.5)', marginTop: '.1rem' }}>{o.desc}</div>
                  </div>
                </button>
              ))}
            </div>
            {data.injuries && data.injuries !== 'none' && (
              <input style={{ width: '100%', padding: '.9rem 1.1rem', background: 'rgba(255,255,255,.07)', border: '1.5px solid rgba(139,47,201,.3)', borderRadius: 12, color: '#fff', fontSize: '.95rem', outline: 'none', fontFamily: 'inherit' }}
                placeholder="Précise si tu veux (ex : tendinite genou gauche)…"
                value={data.injury_detail}
                onChange={e => set('injury_detail', e.target.value)} />
            )}
            <ContinueBtn disabled={!data.injuries} onClick={advance} />
          </>}

          {/* ── period (only if femme) ── */}
          {stepId === 'period' && <>
            <StepLabel>Question {currentIdx + 1}</StepLabel>
            <StepTitle>Douleurs pendant tes règles ?</StepTitle>
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,.4)', fontSize: '.875rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Je tiens compte de ton cycle pour adapter ton plan les jours difficiles.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem', marginBottom: '1.25rem' }}>
              {[{ v: true, e: '✅', l: 'Oui, parfois difficile', desc: 'J\'ai du mal à m\'entraîner' },
                { v: false, e: '❌', l: 'Non, ça ne m\'affecte pas', desc: 'Je continue normalement' }].map(o => (
                <button key={String(o.v)} onClick={() => set('period_pain', o.v)}
                  style={{ ...cardStyle(data.period_pain === o.v), alignItems: 'center', textAlign: 'center', padding: '1.25rem 1rem' }}>
                  <span style={{ fontSize: '1.8rem' }}>{o.e}</span>
                  <span style={{ fontWeight: 700, fontSize: '.875rem' }}>{o.l}</span>
                  <span style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.45)', lineHeight: 1.4 }}>{o.desc}</span>
                </button>
              ))}
            </div>
            {data.period_pain && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', justifyContent: 'center' }}>
                <label style={{ fontSize: '.875rem', color: 'rgba(255,255,255,.6)' }}>Durée habituelle des douleurs :</label>
                <input type="number" style={{ width: 70, padding: '.65rem', background: 'rgba(255,255,255,.07)', border: '1.5px solid rgba(139,47,201,.3)', borderRadius: 10, color: '#fff', fontSize: '1.1rem', textAlign: 'center', outline: 'none', fontFamily: 'inherit' }}
                  value={data.period_pain_days}
                  onChange={e => set('period_pain_days', e.target.value)}
                  min={1} max={7} placeholder="2" />
                <span style={{ color: 'rgba(255,255,255,.5)', fontSize: '.875rem' }}>jours</span>
              </div>
            )}
            <ContinueBtn onClick={advance} />
          </>}

          {/* ── coach_message ── */}
          {stepId === 'coach_message' && <>
            <StepLabel>Dernière étape</StepLabel>
            <StepTitle>Un message pour ton coach ?</StepTitle>
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,.4)', fontSize: '.875rem', marginBottom: '1.5rem', lineHeight: 1.7 }}>
              Objectifs, craintes, contexte particulier…
            </p>
            <textarea style={{ width: '100%', minHeight: 130, padding: '1rem 1.1rem', background: 'rgba(255,255,255,.07)', border: '1.5px solid rgba(139,47,201,.25)', borderRadius: 14, color: '#fff', fontSize: '.975rem', outline: 'none', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.7 }}
              placeholder="Parle-moi de toi, de ce qui te motive, de tes doutes ou de ta situation particulière…"
              value={data.coach_message}
              onChange={e => set('coach_message', e.target.value)} />
            <p style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.3)', marginTop: '.75rem', lineHeight: 1.7, textAlign: 'center' }}>
              Plus tu me donnes d'informations, plus ton plan sera précis.
              Rien n'est obligatoire — tu peux aussi passer cette étape.
            </p>
            <ContinueBtn onClick={advance} disabled={submitting}
              label={submitting
                ? <><SpinnerInline /> {submitAttempt > 1 ? `Connexion… (${submitAttempt}/6)` : 'Création de ton plan…'}</>
                : 'Terminer et créer mon plan →'} />
          </>}

        </div>
      </div>
    </div>
  )
}

function StepLabel({ children }) {
  return <p style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.35)', textAlign: 'center', marginBottom: '.6rem', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600 }}>{children}</p>
}

function StepTitle({ children }) {
  return <h2 style={{ textAlign: 'center', fontSize: 'clamp(1.4rem,4vw,1.9rem)', marginBottom: '1.75rem', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{children}</h2>
}

function ContinueBtn({ onClick, disabled, label = 'Continuer →' }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ width: '100%', marginTop: '1.75rem', padding: '1rem', borderRadius: 14,
        background: disabled ? 'rgba(255,255,255,.08)' : 'linear-gradient(135deg,#8B2FC9,#E8237A)',
        color: disabled ? 'rgba(255,255,255,.3)' : '#fff',
        border: 'none', fontWeight: 700, fontSize: '1rem', cursor: disabled ? 'default' : 'pointer',
        boxShadow: disabled ? 'none' : '0 6px 24px rgba(232,35,122,.35)', fontFamily: 'inherit',
        transition: 'all .2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem' }}>
      {label}
    </button>
  )
}

function SpinnerInline() {
  return <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', animation: 'spin .7s linear infinite' }} />
}
