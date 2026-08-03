import { useState, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'
import { SESSION_TYPE_COLORS } from '../lib/utils'

const C = { purple: '#8B2FC9', pink: '#E8237A' }

const RESSENTIS = [
  { v: 'facile',         emoji: '😄', label: 'Plutôt facile à tenir' },
  { v: 'difficile',      emoji: '💪', label: 'Difficile mais faisable' },
  { v: 'trop_difficile', emoji: '😓', label: 'Trop difficile à tenir' },
  { v: 'pas_termine',    emoji: '🤒', label: "Je n'ai pas pu terminer" },
]

const RESSENTI_LABELS = {
  facile: 'Plutôt facile', difficile: 'Difficile mais faisable',
  trop_difficile: 'Trop difficile', pas_termine: 'Non terminée',
}

const DAYS_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const DAYS_FR    = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

function rpeColor(v) {
  if (v <= 3) return '#22c55e'
  if (v <= 5) return '#84cc16'
  if (v <= 7) return '#f59e0b'
  if (v <= 9) return '#ef4444'
  return '#dc2626'
}
function rpeLabel(v) {
  if (v <= 3) return 'Très facile'
  if (v <= 5) return 'Modéré'
  if (v <= 7) return 'Difficile'
  if (v <= 9) return 'Très difficile'
  return 'Effort maximal'
}

function fmtPace(min, sec) {
  if (!min && !sec) return null
  return `${min || '0'}'${String(sec || '0').padStart(2, '0')}"/km`
}

// Convert time on distance → split display { time, unit }
// per100=true for natation (calculates /100m instead of /km)
function timeToSplit(min, sec, distM, per100 = false) {
  const total = (parseInt(min) || 0) * 60 + (parseInt(sec) || 0)
  if (!total || !distM) return null
  const unit = per100 ? 100 : 1000
  const paceSec = (total / distM) * unit
  const pMin = Math.floor(paceSec / 60)
  const pSec = Math.round(paceSec % 60)
  return { time: `${pMin}'${String(pSec).padStart(2, '0')}"`, unit: per100 ? '/100m' : '/km' }
}

const RECOVERY_RE = /r[ée]cup|transition|repos/i
const REPS_RE = /(\d+)\s*[×x×]\s*(\d+(?:[.,]\d+)?)\s*(m\b|km\b|min\b)/i

// Detect EVERY meaningful "BLOC ..." section in the corps text (reps-based or continuous),
// skipping pure recovery/transition sections which never need a real-pace input.
function detectAllSections(corps) {
  if (!corps) return []
  const lines = corps.split('\n')
  const raw = []
  let current = null

  for (const line of lines) {
    const t = line.trim()
    if (!t) continue
    if (/^BLOC\b/i.test(t)) {
      if (current) raw.push(current)
      current = { header: t, bullets: [] }
    } else if (t.startsWith('•') && current) {
      current.bullets.push(t.slice(1).trim())
    }
  }
  if (current) raw.push(current)
  if (raw.length === 0) return []

  return raw
    .filter(s => !RECOVERY_RE.test(s.header))
    .map(s => {
      const text = s.bullets.join(' ')
      const m = text.match(REPS_RE)
      const reps = m ? parseInt(m[1]) : 0
      const hasReps = reps >= 2 && reps <= 25
      return {
        header: s.header,
        label: hasReps ? `${m[1]}×${m[2]}${m[3]}` : null,
        reps: hasReps ? reps : 0,
        text,
      }
    })
}

function extractDistM(label) {
  if (!label) return null
  const m = label.match(/[×x]\s*(\d+(?:[.,]\d+)?)\s*(m|km)/i)
  if (!m) return null
  const val = parseFloat(m[1].replace(',', '.'))
  return m[2].toLowerCase() === 'km' ? val * 1000 : val
}

function inferSport(type) {
  const t = (type || '').toLowerCase()
  if (t.includes('vélo') || t.includes('velo')) return 'velo'
  if (t.includes('natation')) return 'natation'
  if (t.includes('brique')) return 'brique'
  if (t.includes('renforcement')) return 'renforcement'
  return 'course'
}

// Friendly label for a section header, e.g. "BLOC Blocs tempo / Allure spécifique" → "Blocs tempo / Allure spécifique"
function sectionTitle(header) {
  return header.replace(/^BLOC\s*/i, '').trim() || 'Bloc'
}

// Get target allure for a phase from session.allures array
function getPhaseAllure(allures, phase) {
  const all = (allures || []).filter(a => a?.allure_min_km && typeof a.allure_min_km === 'string')
  if (!all.length) return null
  if (phase === 'warmup') {
    return all.find(a => /échauff/i.test(a.zone || ''))
      || all.find(a => (a.pourcentage_vma || 100) <= 70)
      || all[0]
  }
  if (phase === 'cooldown') {
    return all.find(a => /retour|calme|récup/i.test(a.zone || ''))
      || all.find(a => (a.pourcentage_vma || 100) <= 70)
      || all[0]
  }
  return all.find(a => /corps|principal|seuil|vma|tempo|frac/i.test(a.zone || ''))
    || all.reduce((best, a) => (a.pourcentage_vma || 0) > (best.pourcentage_vma || 0) ? a : best, all[0])
}

// BLOC/bullet corps renderer — compact version for the "Prévu" card
function CorpsPreview({ corps, typeColor }) {
  if (!corps) return null
  const color = typeColor || C.purple
  const hasBloc = /^BLOC\b/im.test(corps) || corps.includes('•')

  if (!hasBloc) {
    return <p style={{ fontSize: '.875rem', lineHeight: 1.65, color: 'rgba(26,26,46,.7)', margin: 0, whiteSpace: 'pre-line' }}>{corps}</p>
  }

  const lines = corps.split('\n')
  const nodes = []
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim()
    if (!t) continue
    if (/^BLOC\b/i.test(t)) {
      nodes.push(
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', margin: `${nodes.length > 0 ? '.875rem' : '0'} 0 .4rem` }}>
          <div style={{ flex: 1, height: 1, background: color + '30' }} />
          <span style={{ fontSize: '.65rem', fontWeight: 800, letterSpacing: '.1em', color,
            textTransform: 'uppercase', background: color + '15', borderRadius: 99,
            padding: '.2rem .65rem', border: `1px solid ${color}30` }}>
            {t}
          </span>
          <div style={{ flex: 1, height: 1, background: color + '30' }} />
        </div>
      )
    } else if (t.startsWith('•')) {
      const content = t.slice(1).trim()
      const isRecov = /r[eé]cup|marche|trot|repos/i.test(content)
      const mMatch  = content.match(/^(\d+\s*[×x×]\s*\d+(?:[.,]\d+)?\s*(?:m|km|min)\b|\d+(?:[.,]\d+)?\s*(?:m|km|min)\b)\s+/i)
      if (isRecov) {
        nodes.push(
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '.4rem', padding: '.15rem 0' }}>
            <span style={{ fontSize: '.7rem', color: '#38BDF8' }}>⏸</span>
            <span style={{ fontSize: '.78rem', color: 'rgba(26,26,46,.45)', fontStyle: 'italic' }}>{content}</span>
          </div>
        )
      } else {
        nodes.push(
          <div key={i} style={{ background: color + '0D', border: `1px solid ${color}20`,
            borderRadius: 12, padding: '.75rem 1rem', marginBottom: '.25rem' }}>
            {mMatch && <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1a1a2e', lineHeight: 1 }}>{mMatch[1].trim()}</div>}
            <div style={{ fontSize: '.82rem', lineHeight: 1.55, color: 'rgba(26,26,46,.7)', marginTop: mMatch ? '.25rem' : 0 }}>
              {mMatch ? content.slice(mMatch[0].length) : content}
            </div>
          </div>
        )
      }
    } else {
      nodes.push(
        <p key={i} style={{ fontSize: '.8rem', color: 'rgba(26,26,46,.5)', fontStyle: 'italic', margin: '.2rem 0' }}>{t}</p>
      )
    }
  }
  return <div style={{ display: 'flex', flexDirection: 'column', gap: '.2rem' }}>{nodes}</div>
}

// Target pace chip inside "Prévu" card
function AllureChip({ allure, color }) {
  if (!allure?.allure_min_km) return null
  const pace = allure.allure_min_km.replace(/"/g, '').replace(/\/km$/i, '')
  const c    = color || C.purple
  return (
    <span style={{ background: c + '18', border: `1px solid ${c}35`, borderRadius: 99,
      padding: '.2rem .7rem', fontSize: '.78rem', fontWeight: 700, color: c,
      display: 'inline-block', marginTop: '.6rem' }}>
      🎯 Cible : {pace}<span style={{ opacity: .55, fontWeight: 400 }}>/km</span>
    </span>
  )
}

// Coloured card wrapping the "Prévu" content
function PrevuCard({ color, icon, children }) {
  const c = color || C.purple
  return (
    <div style={{ background: c + '0E', border: `1px solid ${c}28`, borderRadius: 14,
      padding: '1rem', marginBottom: '1.25rem' }}>
      <div style={{ fontSize: '.65rem', textTransform: 'uppercase', letterSpacing: '.12em',
        color: c, fontWeight: 800, marginBottom: '.5rem' }}>
        {icon} Prévu
      </div>
      {children}
    </div>
  )
}

// Min:sec pace input pair (shared by warmup / mainset / cooldown)
function PaceInput({ label, minVal, onMinChange, secVal, onSecChange }) {
  const base = {
    padding: '.5rem .4rem', borderRadius: 10, fontSize: '1.1rem', fontWeight: 700,
    border: '2px solid rgba(139,47,201,.18)', background: '#fff',
    textAlign: 'center', outline: 'none', color: '#1a1a2e', width: 68,
  }
  return (
    <div>
      {label && (
        <div style={{ fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '.08em',
          color: 'rgba(26,26,46,.4)', marginBottom: '.5rem', fontWeight: 700 }}>
          {label}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
        <div>
          <div style={{ fontSize: '.65rem', textTransform: 'uppercase', letterSpacing: '.08em',
            color: 'rgba(26,26,46,.3)', marginBottom: '.3rem' }}>Min</div>
          <input type="number" min="0" max="30" placeholder="4" value={minVal}
            onChange={e => onMinChange(e.target.value)} style={base} />
        </div>
        <span style={{ fontSize: '1.35rem', color: 'rgba(26,26,46,.22)', paddingTop: '1.2rem' }}>:</span>
        <div>
          <div style={{ fontSize: '.65rem', textTransform: 'uppercase', letterSpacing: '.08em',
            color: 'rgba(26,26,46,.3)', marginBottom: '.3rem' }}>Sec</div>
          <input type="number" min="0" max="59" placeholder="30" value={secVal}
            onChange={e => onSecChange(e.target.value)} style={base} />
        </div>
        <span style={{ fontSize: '.85rem', color: 'rgba(26,26,46,.3)', paddingTop: '1.2rem' }}>/km</span>
      </div>
    </div>
  )
}

// Simple numeric field (distance / duration)
function NumberField({ label, value, onChange, placeholder, step, unit }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '.08em',
        color: 'rgba(26,26,46,.4)', marginBottom: '.5rem', fontWeight: 700 }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
        <input type="number" min="0" step={step || '1'} placeholder={placeholder} value={value}
          onChange={e => onChange(e.target.value)}
          style={{ padding: '.6rem .7rem', borderRadius: 10, fontSize: '1.05rem', fontWeight: 700,
            border: '2px solid rgba(139,47,201,.18)', background: '#fff', outline: 'none',
            color: '#1a1a2e', width: '100%', boxSizing: 'border-box' }} />
        {unit && <span style={{ fontSize: '.8rem', color: 'rgba(26,26,46,.35)', flexShrink: 0 }}>{unit}</span>}
      </div>
    </div>
  )
}

// "Skip pace" link
function SkipLink({ label = "Je n'ai pas mesuré →", onSkip }) {
  return (
    <button onClick={onSkip}
      style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
        color: 'rgba(26,26,46,.35)', fontSize: '.85rem', textDecoration: 'underline',
        padding: 0, marginTop: '1.25rem', display: 'block' }}>
      {label}
    </button>
  )
}

export default function PostSessionFlow({
  session, weekNum, sessionIdx, planId,
  weekSessions = [], weekCompletions = [],
  onClose, onDone,
}) {
  const { profile } = useAuth()

  const [step,    setStep]    = useState('ressenti')
  const [saved,   setSaved]   = useState(false)
  const [saving,  setSaving]  = useState(false)

  const [ressenti,      setRessenti]      = useState(null)
  const [rpe,           setRpe]           = useState(6)
  const [wuPaceMin,     setWuPaceMin]     = useState('')
  const [wuPaceSec,     setWuPaceSec]     = useState('')
  // Per-section state, keyed by section index — replaces the old fixed bloc1/bloc2 pair
  const [sectionReps,   setSectionReps]   = useState({}) // { [i]: [{min,sec}] } — reps mode: temps par répétition
  const [sectionPaces,  setSectionPaces]  = useState({}) // { [i]: [{min,sec}] } — reps mode: allure par répétition
  const [sectionWatts,  setSectionWatts]  = useState({}) // { [i]: [string] } — vélo, watts par répétition
  const [sectionSingle, setSectionSingle] = useState({}) // { [i]: {min,sec} } — phase continue (pas de répétitions)
  const [repMode,       setRepMode]       = useState('time') // 'time' | 'pace' (partagé entre sections à reps)
  const [cdPaceMin,     setCdPaceMin]     = useState('')
  const [cdPaceSec,     setCdPaceSec]     = useState('')
  const [avgHr,         setAvgHr]         = useState('')
  const [maxHr,         setMaxHr]         = useState('')
  const [distKm,        setDistKm]        = useState('')
  const [distKmBike,    setDistKmBike]    = useState('') // brique uniquement
  const [durMin,        setDurMin]        = useState('')
  const [durBikeMin,    setDurBikeMin]    = useState('') // brique uniquement
  const [comment,       setComment]       = useState('')

  const typeColor      = SESSION_TYPE_COLORS[session.type] || '#10B981'
  const sessionTypeL   = (session.type || '').toLowerCase()
  const isNatation     = sessionTypeL.includes('natation')
  const isVelo         = sessionTypeL.includes('vélo') || sessionTypeL.includes('velo')
  const isBrique       = sessionTypeL.includes('brique')
  const isRenfo        = sessionTypeL.includes('renforcement')
  const isNonRunning   = isNatation || isVelo || isBrique || isRenfo

  // Detect every meaningful section (reps-based or continuous phase)
  const sections = useMemo(() => detectAllSections(session.corps), [session.corps])
  const hasBlocs = sections.length > 0

  // Effective per-section arrays (grow dynamically as the athlete types)
  function effectiveReps(i, n)  { return Array.from({ length: n }, (_, j) => (sectionReps[i]  || [])[j] || { min: '', sec: '' }) }
  function effectivePaces(i, n) { return Array.from({ length: n }, (_, j) => (sectionPaces[i] || [])[j] || { min: '', sec: '' }) }
  function effectiveWatts(i, n) { return Array.from({ length: n }, (_, j) => (sectionWatts[i] || [])[j] || '') }
  function singleFor(i) { return sectionSingle[i] || { min: '', sec: '' } }
  function setSingleFor(i, patch) {
    setSectionSingle(prev => ({ ...prev, [i]: { ...singleFor(i), ...patch } }))
  }

  const wuAllure   = getPhaseAllure(session.allures, 'warmup')
  const mainAllure = getPhaseAllure(session.allures, 'main')
  const cdAllure   = getPhaseAllure(session.allures, 'cooldown')

  const pasTermine  = ressenti === 'pas_termine'
  const hasWarmup   = !!session.echauffement && !isNonRunning
  // mainset shown for running OR any session with detectable sections
  const hasMainSet  = !!session.corps && (!isNonRunning || hasBlocs)
  const hasCooldown = !!session.retour_au_calme && !isNonRunning

  function activeSteps() {
    const s = ['ressenti']
    if (!pasTermine) {
      s.push('rpe')
      if (!isNonRunning) {
        if (hasWarmup)   s.push('warmup')
      }
      if (hasMainSet)  s.push('mainset')
      if (!isNonRunning) {
        if (hasCooldown) s.push('cooldown')
      }
      s.push('fc')
    }
    s.push('metrics', 'comment', 'summary')
    return s
  }

  const steps   = activeSteps()
  const stepIdx = steps.indexOf(step)
  const progress = (stepIdx + 1) / steps.length

  function nextStep() {
    const idx = steps.indexOf(step)
    return idx < steps.length - 1 ? steps[idx + 1] : 'summary'
  }
  function prevStep() {
    const idx = steps.indexOf(step)
    return idx > 0 ? steps[idx - 1] : 'ressenti'
  }

  function buildComment() {
    const parts = []
    if (ressenti) parts.push(`[Ressenti: ${RESSENTI_LABELS[ressenti]}]`)
    if (!isNonRunning) {
      if (wuPaceMin || wuPaceSec)
        parts.push(`[Ech: ${wuPaceMin||'0'}'${String(wuPaceSec||'0').padStart(2,'0')}"]`)
    }
    // Every detected section — reps-based (per-rep times/paces/watts) or continuous (single pace)
    sections.forEach((sec, i) => {
      const distM = extractDistM(sec.label)
      const title = sectionTitle(sec.header)
      if (sec.reps > 0) {
        if (isVelo) {
          const watts = effectiveWatts(i, sec.reps)
          const str = watts.map((w, j) => w ? `bloc${j+1}:${w}W` : null).filter(Boolean).join(' | ')
          if (str) parts.push(`[${title}: ${str}]`)
        } else {
          const useTimeMode = repMode === 'time' && distM
          const arr = useTimeMode ? effectiveReps(i, sec.reps) : effectivePaces(i, sec.reps)
          const str = arr.map((t, j) => {
            if (!t.min && !t.sec) return null
            const timeStr = `${t.min||'0'}'${String(t.sec||'0').padStart(2,'0')}"`
            if (useTimeMode) {
              const split = timeToSplit(t.min, t.sec, distM, isNatation)
              return split ? `${j+1}:${timeStr}(${split.time}${split.unit})` : `${j+1}:${timeStr}`
            }
            return `${j+1}:${timeStr}/km`
          }).filter(Boolean).join(' | ')
          if (str) parts.push(`[${sec.label} — ${title}: ${str}]`)
        }
      } else if (!isVelo) {
        const p = singleFor(i)
        if (p.min || p.sec) parts.push(`[${title}: ${p.min||'0'}'${String(p.sec||'0').padStart(2,'0')}"/km]`)
      }
    })
    // Séance sans BLOC détecté (footing, EF simple…) — allure moyenne saisie via le champ de secours
    if (!hasBlocs) {
      const p = singleFor(0)
      if (p.min || p.sec) parts.push(`[Corps: ${p.min||'0'}'${String(p.sec||'0').padStart(2,'0')}"/km]`)
    }
    if (!isNonRunning) {
      if (cdPaceMin || cdPaceSec)
        parts.push(`[RAC: ${cdPaceMin||'0'}'${String(cdPaceSec||'0').padStart(2,'0')}"]`)
    }
    if (avgHr) parts.push(`[FC moy: ${avgHr} bpm]`)
    if (maxHr) parts.push(`[FC max: ${maxHr} bpm]`)
    return [...parts, comment].filter(Boolean).join(' ')
  }

  async function saveAndProceed() {
    if (saved) { setStep('summary'); return }
    setSaving(true)
    try {
      const fullComment = buildComment()
      await supabase.from('session_completions').upsert({
        user_id:           profile.id,
        plan_id:           planId,
        week_number:       weekNum,
        session_index:     sessionIdx,
        rpe:                parseInt(rpe),
        comment:            fullComment || null,
        avg_hr:             avgHr ? parseInt(avgHr) : null,
        distance_km:        distKm ? parseFloat(distKm) : null,
        distance_km_bike:   isBrique && distKmBike ? parseFloat(distKmBike) : null,
        duree_reelle_min:   durMin ? parseInt(durMin) : null,
        duree_bike_min:     isBrique && durBikeMin ? parseInt(durBikeMin) : null,
        sport:              inferSport(session.type),
        completed_at:       new Date().toISOString(),
      }, { onConflict: 'plan_id,week_number,session_index' })

      setSaved(true)
      setStep('summary')
      onDone?.()

      if (parseInt(rpe) > 8) {
        api.fatigueAdapt({ userId: profile.id, planId, weekNumber: weekNum, rpe: parseInt(rpe), comment })
          .catch(() => {})
      }
    } finally {
      setSaving(false)
    }
  }

  async function goNext() {
    const next = nextStep()
    if (next === 'summary') { await saveAndProceed(); return }
    setStep(next)
  }

  function skipToNext() { setStep(nextStep()) }

  // Week summary stats
  const prevDone    = weekCompletions.length
  const totalSess   = weekSessions.length
  const doneCount   = prevDone + 1
  const prevRpeSum  = weekCompletions.reduce((s, c) => s + (c.rpe || 0), 0)
  const avgRpeVal   = doneCount > 0 ? ((prevRpeSum + parseInt(rpe)) / doneCount).toFixed(1) : rpe
  function sessionTotalMin(s) {
    const parseMin = t => { const m = (t || '').match(/^(\d+)\s*min/i); return m ? parseInt(m[1], 10) : 0 }
    const ech = parseMin(s.echauffement)
    const rac = parseMin(s.retour_au_calme)
    const base = s.duree_min || 0
    // Add ech+rac only if duree_min seems to be corpus-only (< ech+rac+5 min corpus)
    return (ech + rac > 0 && base < ech + rac + 5) ? base + ech + rac : base
  }
  const weekMinutes = weekSessions.reduce((sum, s, i) => {
    const done = weekCompletions.some(c => c.session_index === i) || i === sessionIdx
    return done ? sum + sessionTotalMin(s) : sum
  }, 0)

  function fmtDur(min) {
    if (min < 60) return `${min} min`
    const h = Math.floor(min / 60), m = min % 60
    return m > 0 ? `${h}h${String(m).padStart(2,'0')}` : `${h}h`
  }

  const inputSt = {
    width: '100%', padding: '.65rem .85rem', borderRadius: 12, fontSize: '.95rem',
    border: '2px solid rgba(139,47,201,.15)', background: '#fff', outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box', color: '#1a1a2e', transition: 'border-color .15s',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
    }}>
      <div style={{
        background: '#fff', color: '#1a1a2e', borderRadius: 24,
        width: '100%', maxWidth: 500,
        maxHeight: '92dvh', overflowY: 'auto',
        boxShadow: '0 32px 80px rgba(0,0,0,.4)',
        display: 'flex', flexDirection: 'column',
      }}>

        {/* ── Header ── */}
        <div style={{ padding: '1.25rem 1.25rem 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.75rem' }}>
            {stepIdx > 0 ? (
              <button onClick={() => setStep(prevStep())}
                style={{ background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(26,26,46,.4)', fontSize: '.88rem', padding: 0, fontFamily: 'inherit' }}>
                ← Retour
              </button>
            ) : <div />}
            <span style={{ fontSize: '.72rem', fontWeight: 700, color: 'rgba(26,26,46,.3)', letterSpacing: '.06em' }}>
              {stepIdx + 1} / {steps.length}
            </span>
            <button onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(26,26,46,.3)', fontSize: '1.1rem', lineHeight: 1, padding: 0 }}>✕</button>
          </div>
          <div style={{ height: 3, background: 'rgba(139,47,201,.1)', borderRadius: 99 }}>
            <div style={{ height: '100%', borderRadius: 99, width: `${progress * 100}%`,
              background: `linear-gradient(90deg,${C.purple},${C.pink})`, transition: 'width .35s ease' }} />
          </div>
        </div>

        {/* ── Content ── */}
        <div style={{ padding: '1.5rem 1.25rem', flex: 1 }}>

          {/* ── PAGE 1 : Ressenti ── */}
          {step === 'ressenti' && (
            <>
              <p style={{ fontSize: '.72rem', textTransform: 'uppercase', letterSpacing: '.12em',
                color: C.purple, fontWeight: 700, marginBottom: '.4rem' }}>{session.titre}</p>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, lineHeight: 1.2, marginBottom: '.4rem' }}>
                Comment as-tu vécu cette séance ?
              </h3>
              <p style={{ fontSize: '.85rem', color: 'rgba(26,26,46,.5)', marginBottom: '1.25rem', lineHeight: 1.65 }}>
                Ton ressenti nous aide à ajuster tes prochaines séances.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem', marginBottom: '1.5rem' }}>
                {RESSENTIS.map(opt => (
                  <button key={opt.v} onClick={() => setRessenti(opt.v)} style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    padding: '.9rem 1.1rem', borderRadius: 16, cursor: 'pointer',
                    fontFamily: 'inherit', textAlign: 'left', fontSize: '.93rem', fontWeight: 600,
                    border: `2px solid ${ressenti === opt.v ? C.purple : 'rgba(26,26,46,.1)'}`,
                    background: ressenti === opt.v ? 'rgba(139,47,201,.07)' : '#fff',
                    color: ressenti === opt.v ? C.purple : '#1a1a2e', transition: 'all .15s',
                  }}>
                    <span style={{ fontSize: '1.5rem' }}>{opt.emoji}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── PAGE 2 : RPE ── */}
          {step === 'rpe' && (
            <>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, lineHeight: 1.2, marginBottom: '.4rem' }}>
                Donne une note à ton effort
              </h3>
              <p style={{ fontSize: '.85rem', color: 'rgba(26,26,46,.5)', marginBottom: '1.75rem', lineHeight: 1.65 }}>
                De 1 (très facile) à 10 (effort maximal absolu).
              </p>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '4.5rem', fontWeight: 900, lineHeight: 1, color: rpeColor(rpe), transition: 'color .2s' }}>{rpe}</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: rpeColor(rpe), marginTop: '.3rem', transition: 'color .2s' }}>
                  {rpeLabel(rpe)}
                </div>
              </div>
              <input type="range" min={1} max={10} value={rpe}
                onChange={e => setRpe(parseInt(e.target.value))}
                style={{ width: '100%', cursor: 'pointer', accentColor: rpeColor(rpe), marginBottom: '.5rem' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.68rem', color: 'rgba(26,26,46,.3)', marginBottom: '1.5rem' }}>
                {['1','2','3','4','5','6','7','8','9','10'].map(n => <span key={n}>{n}</span>)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.4rem' }}>
                {[
                  { r: '1–3', l: 'Très facile',    c: '#22c55e' },
                  { r: '4–5', l: 'Modéré',         c: '#84cc16' },
                  { r: '6–7', l: 'Difficile',      c: '#f59e0b' },
                  { r: '8–9', l: 'Très difficile', c: '#ef4444' },
                  { r: '10',  l: 'Effort maximal', c: '#dc2626' },
                ].map(({ r, l, c }) => (
                  <div key={r} style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.76rem', color: 'rgba(26,26,46,.5)' }}>
                    <div style={{ width: 8, height: 8, borderRadius: 99, background: c, flexShrink: 0 }} />
                    <span style={{ fontWeight: 600 }}>{r}</span> : {l}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── PAGE 3 : Échauffement ── */}
          {step === 'warmup' && (
            <>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, lineHeight: 1.2, marginBottom: '.4rem' }}>
                🔥 Échauffement
              </h3>
              <p style={{ fontSize: '.85rem', color: 'rgba(26,26,46,.5)', marginBottom: '1.25rem', lineHeight: 1.65 }}>
                Quelle allure as-tu courue à l'échauffement ?
              </p>
              <PrevuCard color="#F59E0B" icon="🔥">
                <p style={{ fontSize: '.875rem', lineHeight: 1.65, color: 'rgba(26,26,46,.75)', margin: 0 }}>
                  {session.echauffement}
                </p>
                <AllureChip allure={wuAllure} color="#F59E0B" />
              </PrevuCard>
              <PaceInput
                label="Ton allure à l'échauffement"
                minVal={wuPaceMin} onMinChange={setWuPaceMin}
                secVal={wuPaceSec} onSecChange={setWuPaceSec}
              />
              <SkipLink onSkip={skipToNext} />
            </>
          )}

          {/* ── PAGE 4 : Corps de séance / Sections ── */}
          {step === 'mainset' && (
            <>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, lineHeight: 1.2, marginBottom: '.4rem' }}>
                {hasBlocs ? '⚡ Tes allures réelles' : '⚡ Corps de séance'}
              </h3>
              <p style={{ fontSize: '.85rem', color: 'rgba(26,26,46,.5)', marginBottom: '1.25rem', lineHeight: 1.65 }}>
                {hasBlocs
                  ? "Renseigne ce que tu as vraiment tenu sur chaque partie de la séance."
                  : 'Quelle allure moyenne sur le corps de la séance ?'}
              </p>

              <PrevuCard color={typeColor} icon={isNatation ? '🏊' : isVelo ? '🚴' : '⚡'}>
                <div style={{ fontWeight: 700, fontSize: '.88rem', marginBottom: '.5rem', color: '#1a1a2e' }}>
                  {session.titre}
                </div>
                <CorpsPreview corps={session.corps} typeColor={typeColor} />
                {!hasBlocs && <AllureChip allure={mainAllure} color={typeColor} />}
              </PrevuCard>

              {hasBlocs ? (
                <>
                  {/* Mode toggle — running sections with a known distance */}
                  {sections.some(sec => sec.reps > 0 && extractDistM(sec.label)) && !isNonRunning && (
                    <div style={{ display: 'flex', gap: '.35rem', marginBottom: '.875rem',
                      background: 'rgba(139,47,201,.06)', borderRadius: 12, padding: '.3rem' }}>
                      {[
                        { v: 'time', l: '⏱ Temps / distance' },
                        { v: 'pace', l: '⚡ Allure /km' },
                      ].map(m => (
                        <button key={m.v} onClick={() => setRepMode(m.v)} style={{
                          flex: 1, padding: '.4rem', borderRadius: 9, border: 'none', cursor: 'pointer',
                          fontFamily: 'inherit', fontWeight: 700, fontSize: '.8rem',
                          background: repMode === m.v ? C.purple : 'transparent',
                          color: repMode === m.v ? '#fff' : 'rgba(26,26,46,.4)',
                          transition: 'all .15s',
                        }}>{m.l}</button>
                      ))}
                    </div>
                  )}

                  {sections.map((sec, i) => {
                    const distM = extractDistM(sec.label)
                    const title = sectionTitle(sec.header)
                    const isVeloBloc = isVelo && sec.reps > 0

                    return (
                      <div key={i} style={{ marginBottom: i < sections.length - 1 ? '1.25rem' : 0 }}>
                        {sections.length > 1 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', margin: `${i > 0 ? '1.25rem' : '0'} 0 .65rem` }}>
                            <div style={{ flex: 1, height: 1, background: typeColor + '30' }} />
                            <span style={{ fontSize: '.65rem', fontWeight: 800, letterSpacing: '.1em', color: typeColor,
                              textTransform: 'uppercase', background: typeColor + '15', borderRadius: 99,
                              padding: '.2rem .65rem', border: `1px solid ${typeColor}30`, textAlign: 'center' }}>
                              {sec.label ? `${sec.label} — ${title}` : title}
                            </span>
                            <div style={{ flex: 1, height: 1, background: typeColor + '30' }} />
                          </div>
                        )}

                        {sec.reps === 0 ? (
                          // Continuous phase (no reps) — one pace input for the whole section
                          <PaceInput
                            label={sections.length > 1 ? undefined : `Allure — ${title}`}
                            minVal={singleFor(i).min} onMinChange={v => setSingleFor(i, { min: v })}
                            secVal={singleFor(i).sec} onSecChange={v => setSingleFor(i, { sec: v })}
                          />
                        ) : isVeloBloc ? (
                          // Vélo — watts input per rep
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                            {effectiveWatts(i, sec.reps).map((w, j) => (
                              <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '.75rem',
                                background: 'rgba(139,47,201,.04)', borderRadius: 12,
                                padding: '.6rem .875rem', border: '1px solid rgba(139,47,201,.1)' }}>
                                <span style={{ fontSize: '.78rem', fontWeight: 800, color: C.purple,
                                  minWidth: 22, textAlign: 'center' }}>{j + 1}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', flex: 1 }}>
                                  <input
                                    type="number" min="0" max="9999" placeholder="Ex: 245" value={w}
                                    onChange={e => setSectionWatts(prev => {
                                      const next = effectiveWatts(i, sec.reps)
                                      next[j] = e.target.value
                                      return { ...prev, [i]: next }
                                    })}
                                    style={{ width: 90, padding: '.4rem .5rem', borderRadius: 8, fontSize: '.95rem',
                                      fontWeight: 700, border: '2px solid rgba(139,47,201,.18)', background: '#fff',
                                      textAlign: 'center', outline: 'none', color: '#1a1a2e' }} />
                                  <span style={{ fontSize: '.85rem', fontWeight: 700, color: 'rgba(26,26,46,.45)' }}>W</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (() => {
                          const useTimeMode = repMode === 'time' && distM
                          const arr = useTimeMode ? effectiveReps(i, sec.reps) : effectivePaces(i, sec.reps)
                          const setter = (j, field, val) => {
                            const bucket = useTimeMode ? sectionReps : sectionPaces
                            const setBucket = useTimeMode ? setSectionReps : setSectionPaces
                            const arrEff = useTimeMode ? effectiveReps(i, sec.reps) : effectivePaces(i, sec.reps)
                            const next = arrEff.map(x => ({ ...x }))
                            next[j] = { ...next[j], [field]: val }
                            setBucket(prev => ({ ...prev, [i]: next }))
                          }
                          const unitLabel = distM ? (isNatation ? '/100m' : '/km') : '/km'
                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                              {arr.map((rp, j) => {
                                const split = (useTimeMode && distM) ? timeToSplit(rp.min, rp.sec, distM, isNatation) : null
                                return (
                                  <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '.75rem',
                                    background: 'rgba(139,47,201,.04)', borderRadius: 12,
                                    padding: '.6rem .875rem', border: '1px solid rgba(139,47,201,.1)' }}>
                                    <span style={{ fontSize: '.78rem', fontWeight: 800, color: C.purple,
                                      minWidth: 22, textAlign: 'center' }}>{j + 1}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '.3rem', flex: 1 }}>
                                      <input
                                        type="number" min="0" max="99" placeholder="MM" value={rp.min || ''}
                                        onChange={e => setter(j, 'min', e.target.value)}
                                        style={{ width: 50, padding: '.4rem .3rem', borderRadius: 8, fontSize: '.95rem',
                                          fontWeight: 700, border: '2px solid rgba(139,47,201,.18)', background: '#fff',
                                          textAlign: 'center', outline: 'none', color: '#1a1a2e' }} />
                                      <span style={{ color: 'rgba(26,26,46,.25)', fontSize: '1rem' }}>:</span>
                                      <input
                                        type="number" min="0" max="59" placeholder="SS" value={rp.sec || ''}
                                        onChange={e => setter(j, 'sec', e.target.value)}
                                        style={{ width: 50, padding: '.4rem .3rem', borderRadius: 8, fontSize: '.95rem',
                                          fontWeight: 700, border: '2px solid rgba(139,47,201,.18)', background: '#fff',
                                          textAlign: 'center', outline: 'none', color: '#1a1a2e' }} />
                                      {!split && <span style={{ fontSize: '.75rem', color: 'rgba(26,26,46,.35)' }}>{unitLabel}</span>}
                                    </div>
                                    {split && (
                                      <span style={{ fontSize: '.8rem', fontWeight: 800, color: C.purple,
                                        flexShrink: 0, whiteSpace: 'nowrap' }}>
                                        = {split.time}<span style={{ fontSize: '.68rem', fontWeight: 400, opacity: .6 }}>{split.unit}</span>
                                      </span>
                                    )}
                                    {!useTimeMode && (rp.min || rp.sec) && (
                                      <span style={{ fontSize: '.75rem', fontWeight: 800, color: C.purple, flexShrink: 0 }}>
                                        {rp.min || '0'}'{String(rp.sec || '0').padStart(2,'0')}"
                                      </span>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )
                        })()}
                      </div>
                    )
                  })}
                </>
              ) : (
                <PaceInput
                  label="Allure moyenne corps de séance"
                  minVal={singleFor(0).min} onMinChange={v => setSingleFor(0, { min: v })}
                  secVal={singleFor(0).sec} onSecChange={v => setSingleFor(0, { sec: v })}
                />
              )}

              <SkipLink onSkip={skipToNext} />
            </>
          )}

          {/* ── PAGE 5 : Retour au calme ── */}
          {step === 'cooldown' && (
            <>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, lineHeight: 1.2, marginBottom: '.4rem' }}>
                ❄️ Retour au calme
              </h3>
              <p style={{ fontSize: '.85rem', color: 'rgba(26,26,46,.5)', marginBottom: '1.25rem', lineHeight: 1.65 }}>
                Quelle allure as-tu courue au retour au calme ?
              </p>
              <PrevuCard color="#3B82F6" icon="❄️">
                <p style={{ fontSize: '.875rem', lineHeight: 1.65, color: 'rgba(26,26,46,.75)', margin: 0 }}>
                  {session.retour_au_calme}
                </p>
                <AllureChip allure={cdAllure} color="#3B82F6" />
              </PrevuCard>
              <PaceInput
                label="Ton allure retour au calme"
                minVal={cdPaceMin} onMinChange={setCdPaceMin}
                secVal={cdPaceSec} onSecChange={setCdPaceSec}
              />
              <SkipLink onSkip={skipToNext} />
            </>
          )}

          {/* ── PAGE FC ── */}
          {step === 'fc' && (
            <>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, lineHeight: 1.2, marginBottom: '.4rem' }}>
                Ta fréquence cardiaque
              </h3>
              <p style={{ fontSize: '.85rem', color: 'rgba(26,26,46,.5)', marginBottom: '1.5rem', lineHeight: 1.65 }}>
                Si tu as les données, elles aident à calibrer l'intensité réelle de tes séances.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '.76rem', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '.08em', color: 'rgba(26,26,46,.45)', marginBottom: '.4rem' }}>
                    FC moyenne (bpm)
                  </label>
                  <input type="number" placeholder="Ex : 148" value={avgHr} onChange={e => setAvgHr(e.target.value)}
                    min={40} max={220}
                    onFocus={e => { e.currentTarget.style.borderColor = C.purple }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(139,47,201,.15)' }}
                    style={inputSt} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '.76rem', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '.08em', color: 'rgba(26,26,46,.45)', marginBottom: '.4rem' }}>
                    FC max atteinte (bpm)
                  </label>
                  <input type="number" placeholder="Ex : 172" value={maxHr} onChange={e => setMaxHr(e.target.value)}
                    min={40} max={220}
                    onFocus={e => { e.currentTarget.style.borderColor = C.purple }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(139,47,201,.15)' }}
                    style={inputSt} />
                </div>
              </div>
              <SkipLink label="Passer cette étape →" onSkip={() => setStep('comment')} />
            </>
          )}

          {/* ── PAGE Métriques : distance et durée réelles ── */}
          {step === 'metrics' && (
            <>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, lineHeight: 1.2, marginBottom: '.4rem' }}>
                📏 Distance et durée
              </h3>
              <p style={{ fontSize: '.85rem', color: 'rgba(26,26,46,.5)', marginBottom: '1.5rem', lineHeight: 1.65 }}>
                {isBrique
                  ? 'Renseigne le détail vélo et course de ta brique.'
                  : isRenfo
                    ? 'Combien de temps a duré ta séance ?'
                    : 'Distance parcourue et durée réelle de la séance.'}
              </p>

              {isBrique ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <div style={{ fontSize: '.72rem', fontWeight: 800, textTransform: 'uppercase',
                      letterSpacing: '.1em', color: '#F97316', marginBottom: '.65rem' }}>🚴 Vélo</div>
                    <div style={{ display: 'flex', gap: '.75rem' }}>
                      <NumberField label="Distance (km)" value={distKmBike} onChange={setDistKmBike} placeholder="Ex : 45" step="0.1" />
                      <NumberField label="Durée (min)" value={durBikeMin} onChange={setDurBikeMin} placeholder="Ex : 90" />
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '.72rem', fontWeight: 800, textTransform: 'uppercase',
                      letterSpacing: '.1em', color: '#10B981', marginBottom: '.65rem' }}>🏃 Course</div>
                    <div style={{ display: 'flex', gap: '.75rem' }}>
                      <NumberField label="Distance (km)" value={distKm} onChange={setDistKm} placeholder="Ex : 10" step="0.1" />
                      <NumberField label="Durée (min)" value={durMin} onChange={setDurMin} placeholder="Ex : 45" />
                    </div>
                  </div>
                </div>
              ) : isRenfo ? (
                <NumberField label="Durée (min)" value={durMin} onChange={setDurMin} placeholder="Ex : 30" />
              ) : (
                <div style={{ display: 'flex', gap: '.75rem' }}>
                  <NumberField label="Distance (km)" value={distKm} onChange={setDistKm} placeholder="Ex : 10" step="0.1" />
                  <NumberField label="Durée (min)" value={durMin} onChange={setDurMin} placeholder="Ex : 50" />
                </div>
              )}

              <SkipLink onSkip={skipToNext} />
            </>
          )}

          {/* ── PAGE Commentaire ── */}
          {step === 'comment' && (
            <>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, lineHeight: 1.2, marginBottom: '.4rem' }}>
                Un message pour ton coach ?
              </h3>
              <p style={{ fontSize: '.85rem', color: 'rgba(26,26,46,.5)', marginBottom: '1.25rem', lineHeight: 1.65 }}>
                Douleur, météo, fatigue particulière, sensation positive… Tout est utile !
              </p>
              <textarea
                placeholder="Ex : jambes lourdes depuis hier, mais j'ai tenu les allures sur les 3 premiers blocs..."
                value={comment} onChange={e => setComment(e.target.value)}
                style={{ ...inputSt, minHeight: 130, resize: 'vertical', lineHeight: 1.65 }} />
            </>
          )}

          {/* ── PAGE Résumé ── */}
          {step === 'summary' && (
            <>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, lineHeight: 1.2, marginBottom: '.3rem' }}>
                Ta semaine jusqu'ici 💪
              </h3>
              <p style={{ fontSize: '.85rem', color: 'rgba(26,26,46,.5)', marginBottom: '1.5rem' }}>
                Séance enregistrée. Voici le bilan.
              </p>

              {/* Stats grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.65rem', marginBottom: '1.5rem' }}>
                {[
                  { icon: '🏃', label: 'Séances',     val: `${doneCount} / ${totalSess}` },
                  { icon: '⏱',  label: 'Temps total', val: fmtDur(weekMinutes) },
                  { icon: '📈', label: 'RPE moyen',   val: `${avgRpeVal} / 10` },
                  { icon: '💬', label: 'Ressenti',    val: { facile:'Facile', difficile:'Normal', trop_difficile:'Chargé', pas_termine:'Difficile' }[ressenti] || '—' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'rgba(139,47,201,.05)', borderRadius: 14,
                    padding: '.875rem', border: '1px solid rgba(139,47,201,.09)' }}>
                    <div style={{ fontSize: '1.2rem', marginBottom: '.3rem' }}>{s.icon}</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 900, lineHeight: 1 }}>{s.val}</div>
                    <div style={{ fontSize: '.7rem', color: 'rgba(26,26,46,.4)', marginTop: '.2rem', fontWeight: 600 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Distance / durée recap */}
              {(distKm || distKmBike || durMin || durBikeMin) && (
                <div style={{ background: 'rgba(16,185,129,.07)', border: '1px solid rgba(16,185,129,.2)',
                  borderRadius: 14, padding: '.875rem', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '.1em', color: '#10B981', marginBottom: '.6rem' }}>📏 Distance &amp; durée</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.75rem' }}>
                    {isBrique ? (
                      <>
                        {(distKmBike || durBikeMin) && (
                          <span style={{ fontSize: '.85rem', color: 'rgba(26,26,46,.7)' }}>
                            🚴 {distKmBike ? `${distKmBike} km` : ''}{distKmBike && durBikeMin ? ' · ' : ''}{durBikeMin ? `${durBikeMin} min` : ''}
                          </span>
                        )}
                        {(distKm || durMin) && (
                          <span style={{ fontSize: '.85rem', color: 'rgba(26,26,46,.7)' }}>
                            🏃 {distKm ? `${distKm} km` : ''}{distKm && durMin ? ' · ' : ''}{durMin ? `${durMin} min` : ''}
                          </span>
                        )}
                      </>
                    ) : (
                      <span style={{ fontSize: '.85rem', color: 'rgba(26,26,46,.7)' }}>
                        {distKm ? `${distKm} km` : ''}{distKm && durMin ? ' · ' : ''}{durMin ? `${durMin} min` : ''}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Paces/Blocs recap */}
              {(() => {
                const lines = []
                if (!isNonRunning) {
                  if (wuPaceMin || wuPaceSec) lines.push({ icon: '🔥', label: 'Ech.', val: fmtPace(wuPaceMin, wuPaceSec) })
                }
                if (hasBlocs) {
                  sections.forEach((sec, i) => {
                    const title = sectionTitle(sec.header)
                    if (sec.reps > 0) {
                      if (isVelo) {
                        const count = effectiveWatts(i, sec.reps).filter(w => w).length
                        if (count > 0) lines.push({ icon: '🚴', label: title, val: `${count} blocs` })
                      } else {
                        const distM = extractDistM(sec.label)
                        const arr = (repMode === 'time' && distM) ? effectiveReps(i, sec.reps) : effectivePaces(i, sec.reps)
                        const count = arr.filter(p => p.min || p.sec).length
                        if (count > 0) lines.push({ icon: isNatation ? '🏊' : '⚡', label: title, val: `${count} blocs` })
                      }
                    } else {
                      const p = singleFor(i)
                      if (p.min || p.sec) lines.push({ icon: '⚡', label: title, val: fmtPace(p.min, p.sec) })
                    }
                  })
                } else if (!isNonRunning) {
                  const p = singleFor(0)
                  if (p.min || p.sec) lines.push({ icon: '⚡', label: 'Corps', val: fmtPace(p.min, p.sec) })
                }
                if (!isNonRunning) {
                  if (cdPaceMin || cdPaceSec) lines.push({ icon: '❄️', label: 'RAC', val: fmtPace(cdPaceMin, cdPaceSec) })
                }
                if (!lines.length) return null
                return (
                  <div style={{ background: typeColor + '08', border: `1px solid ${typeColor}20`,
                    borderRadius: 14, padding: '.875rem', marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase',
                      letterSpacing: '.1em', color: typeColor, marginBottom: '.6rem' }}>Allures</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.75rem' }}>
                      {lines.map((pl, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                          <span style={{ fontSize: '.82rem' }}>{pl.icon}</span>
                          <span style={{ fontSize: '.75rem', color: 'rgba(26,26,46,.5)' }}>{pl.label}</span>
                          <span style={{ fontSize: '.85rem', fontWeight: 800, color: C.purple }}>{pl.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}

              {/* Day timeline */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '.1em', color: 'rgba(26,26,46,.38)', marginBottom: '.75rem' }}>
                  Cette semaine
                </div>
                <div style={{ display: 'flex', gap: '.35rem', alignItems: 'flex-end', height: 60 }}>
                  {DAYS_FR.map((day, di) => {
                    const si     = weekSessions.findIndex(s => s.jour === day)
                    const sess   = si >= 0 ? weekSessions[si] : null
                    const isDone = si >= 0 && (weekCompletions.some(c => c.session_index === si) || si === sessionIdx)
                    const h      = sess ? Math.max(18, Math.min(56, (sess.duree_min || 45) * 0.65)) : 10
                    return (
                      <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.28rem' }}>
                        <div style={{ width: '100%', borderRadius: 5, height: h, transition: 'height .3s',
                          background: !sess ? 'rgba(26,26,46,.07)'
                            : isDone ? `linear-gradient(180deg,${C.purple},${C.pink})`
                            : 'rgba(139,47,201,.18)' }} />
                        <div style={{ fontSize: '.6rem', color: 'rgba(26,26,46,.38)', fontWeight: 600 }}>
                          {DAYS_SHORT[di]}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div style={{ display: 'flex', gap: '.85rem', marginTop: '.6rem', flexWrap: 'wrap' }}>
                  {[
                    { bg: `linear-gradient(135deg,${C.purple},${C.pink})`, l: 'Effectuée' },
                    { bg: 'rgba(139,47,201,.18)', l: 'À venir' },
                    { bg: 'rgba(26,26,46,.07)',   l: 'Repos' },
                  ].map(({ bg, l }) => (
                    <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '.3rem',
                      fontSize: '.7rem', color: 'rgba(26,26,46,.4)' }}>
                      <div style={{ width: 9, height: 9, borderRadius: 3, background: bg, flexShrink: 0 }} />
                      {l}
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ background: 'rgba(139,47,201,.09)', borderRadius: 99, height: 7, marginBottom: '.4rem' }}>
                <div style={{ height: '100%', borderRadius: 99,
                  background: `linear-gradient(90deg,${C.purple},${C.pink})`,
                  width: `${totalSess > 0 ? (doneCount / totalSess) * 100 : 0}%`,
                  transition: 'width .5s ease' }} />
              </div>
              <p style={{ fontSize: '.78rem', color: 'rgba(26,26,46,.4)', marginBottom: comment ? '1.25rem' : 0 }}>
                {doneCount} séance{doneCount > 1 ? 's' : ''} sur {totalSess} cette semaine
              </p>

              {comment && (
                <div style={{ background: 'rgba(139,47,201,.05)', borderRadius: 14, padding: '.85rem 1rem',
                  border: '1px solid rgba(139,47,201,.1)', marginTop: '1rem' }}>
                  <div style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '.1em', color: C.purple, marginBottom: '.35rem' }}>
                    Message envoyé au coach
                  </div>
                  <p style={{ fontSize: '.85rem', color: 'rgba(26,26,46,.6)', lineHeight: 1.65,
                    margin: 0, fontStyle: 'italic' }}>"{comment}"</p>
                </div>
              )}
            </>
          )}

          {/* ── CTA button ── */}
          <div style={{ marginTop: '1.75rem' }}>
            {step !== 'summary' && (
              <button onClick={goNext}
                disabled={(step === 'ressenti' && !ressenti) || saving}
                style={{
                  width: '100%', padding: '.9rem', borderRadius: 50, border: 'none',
                  cursor: (step === 'ressenti' && !ressenti) || saving ? 'default' : 'pointer',
                  background: (step === 'ressenti' && !ressenti) || saving
                    ? 'rgba(26,26,46,.1)'
                    : `linear-gradient(135deg,${C.purple},${C.pink})`,
                  color: (step === 'ressenti' && !ressenti) || saving ? 'rgba(26,26,46,.3)' : '#fff',
                  fontSize: '.95rem', fontWeight: 800, transition: 'all .2s', fontFamily: 'inherit',
                }}>
                {saving ? 'Enregistrement…' : step === 'comment' ? '✅ Valider la séance' : 'Continuer →'}
              </button>
            )}
            {step === 'summary' && (
              <button onClick={onClose}
                style={{ width: '100%', padding: '.9rem', borderRadius: 50, border: 'none', cursor: 'pointer',
                  background: `linear-gradient(135deg,${C.purple},${C.pink})`,
                  color: '#fff', fontSize: '.95rem', fontWeight: 800, fontFamily: 'inherit' }}>
                Terminer 🎉
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
