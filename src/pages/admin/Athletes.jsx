import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { OBJECTIVE_LABELS, LEVEL_LABELS, SESSION_TYPE_COLORS } from '../../lib/utils'
import { api } from '../../lib/api'
import { adminFetch } from '../../lib/adminFetch'
import LoadingSpinner from '../../components/UI/LoadingSpinner'

// ─── Coach Plan View — isolated component so crashes don't black the whole panel ──
function PlanView({ plan, completions, coachWeekIdx, setCoachWeekIdx, currentWeekNum, onSessionClick, onDeleteSession, onRescheduleSession, objective }) {
  const DAY_NAMES  = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche']
  const DAY_SHORT  = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']
  const DAY_OFFSET = { Lundi:0, Mardi:1, Mercredi:2, Jeudi:3, Vendredi:4, Samedi:5, Dimanche:6 }
  const [rescheduleCell, setRescheduleCell] = useState(null)

  // Compute plan start monday
  const planMonday = (() => {
    const d = new Date(plan.activated_at || plan.created_at)
    d.setHours(0,0,0,0)
    const dow = d.getDay()
    if (dow !== 1) d.setDate(d.getDate() + (dow === 0 ? 1 : 8 - dow))
    return d
  })()

  function dayDate(weekNumber, dayName) {
    const offset = DAY_OFFSET[dayName]
    if (offset === undefined) return ''
    const d = new Date(planMonday)
    d.setDate(d.getDate() + (weekNumber - 1) * 7 + offset)
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  try {
    const semaines = (plan.plan_data?.semaines) || []
    const activeSem = semaines[coachWeekIdx] || semaines[0]
    if (!activeSem) return <p style={{ color:'var(--text-muted)', padding:'2rem', textAlign:'center' }}>Aucune semaine dans ce plan.</p>

    const seances = activeSem.seances || []
    const weekComps = completions.filter(c => c.plan_id === plan.id && c.week_number === activeSem.numero)
    const chargeRaw = (activeSem.charge||'').replace(/\s*\(S\d+\)/gi,'')
    const chargeShort = chargeRaw.split(/[—–(]/)[0].trim()
    const chargeColor = chargeShort.toLowerCase().includes('élevée')?'#F97316':chargeShort.toLowerCase().includes('modérée')?'#06B6D4':chargeShort.toLowerCase().includes('affûtage')?'#8B2FC9':'#10B981'

    // Km course à pied seulement (jamais natation/vélo/brique pour triathlon)
    const runKm = Math.round(seances.filter(s => {
      const t = (s.type||'').toLowerCase()
      return !t.includes('natation') && !t.includes('vélo') && !t.includes('velo') && !t.includes('brique') && !t.includes('renforcement')
    }).reduce((sum, s) => sum + (s.distance_km || 0), 0) * 10) / 10

    // Group sessions by day
    const byDay = {}
    DAY_NAMES.forEach(d => { byDay[d] = [] })
    seances.forEach((s, si) => { if (byDay[s.jour]) byDay[s.jour].push({...s, _si: si}) })

    return (
      <>
        {/* Week tabs — desktop: date range, mobile: S1 S2... */}
        <style>{`
          .coach-week-date { display: inline; }
          @media (max-width: 699px) {
            .coach-week-date { display: none; }
            .coach-week-tabs { flex-wrap: wrap !important; overflow: visible !important; }
          }
        `}</style>
        <div className="coach-week-tabs" style={{ display:'flex', gap:'.35rem', overflowX:'auto', paddingBottom:'.5rem', marginBottom:'.75rem' }}>
          {semaines.map((w,i) => {
            const wStart = new Date(planMonday); wStart.setDate(planMonday.getDate() + i*7)
            const wEnd   = new Date(wStart);     wEnd.setDate(wStart.getDate() + 6)
            const fmtShort = d => d.toLocaleDateString('fr-FR', { day:'numeric', month:'short' })
            return (
              <button key={i} onClick={() => setCoachWeekIdx(i)}
                style={{ flexShrink:0, padding:'.38rem .75rem', borderRadius:12, border:'none',
                  whiteSpace:'nowrap', textAlign:'left',
                  background: coachWeekIdx === i ? 'var(--gradient)' : 'var(--surface-2)',
                  color: coachWeekIdx === i ? '#fff' : 'var(--text-muted)',
                  fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                <div style={{ fontSize:'.78rem' }}>
                  S{w.numero}{w.numero === currentWeekNum ? ' ●' : ''}
                </div>
                <div className="coach-week-date" style={{ fontSize:'.65rem', opacity:.75, marginTop:'.1rem' }}>
                  {fmtShort(wStart)} – {fmtShort(wEnd)}
                </div>
              </button>
            )
          })}
        </div>

        {/* Week header avec dates */}
        {(() => {
          const wStart = new Date(planMonday); wStart.setDate(planMonday.getDate() + coachWeekIdx*7)
          const wEnd   = new Date(wStart);     wEnd.setDate(wStart.getDate() + 6)
          const fmtLong = d => d.toLocaleDateString('fr-FR', { day:'numeric', month:'long' })
          return (
            <div style={{ marginBottom:'.75rem', borderRadius:14, overflow:'hidden',
              background:'linear-gradient(135deg,#1A1A2E,#2D1B4E)', color:'#fff' }}>
              <div style={{ padding:'.75rem 1rem', display:'flex', justifyContent:'space-between',
                alignItems:'center', gap:'1rem' }}>
                <div>
                  <div style={{ fontSize:'.62rem', fontWeight:700, textTransform:'uppercase',
                    letterSpacing:'.1em', color:'rgba(255,255,255,.38)', marginBottom:'.2rem' }}>
                    Semaine {activeSem.numero}{activeSem.numero === currentWeekNum ? ' · EN COURS' : ''} · {(activeSem.phase||'').replace(/^S\d+\s*[—–-]\s*/i,'').replace(/\s*\(S\d+\)/gi,'')}
                  </div>
                  <div style={{ fontSize:'.82rem', fontWeight:700, color:'#fff' }}>
                    {fmtLong(wStart)} – {fmtLong(wEnd)}
                  </div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'.3rem', flexShrink:0 }}>
                  <span style={{ padding:'.2rem .65rem', borderRadius:99, fontSize:'.68rem',
                    fontWeight:700, background:chargeColor+'25', border:`1px solid ${chargeColor}50`,
                    color:chargeColor }}>{chargeShort}</span>
                  {runKm > 0 && (
                    <span style={{ fontSize:'.65rem', fontWeight:700, color:'rgba(255,255,255,.55)' }}>
                      🏃 <strong style={{ color:'#fff' }}>{runKm} km</strong> course
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })()}

        <style>{`
          @media (max-width: 699px) { .coach-plan-desktop { display: none !important; } }
          @media (min-width: 700px) { .coach-plan-mobile  { display: none !important; } }
        `}</style>

        {/* ── DESKTOP : grille unique headers+cells, cartes hauteur uniforme ── */}
        <div className="coach-plan-desktop" style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'.5rem' }}>
          {/* Row 1 : en-têtes jours */}
          {DAY_SHORT.map(d => (
            <div key={d} style={{ textAlign:'center', fontSize:'.72rem', fontWeight:800, textTransform:'uppercase',
              letterSpacing:'.07em', color:'var(--text-muted)', paddingBottom:'.4rem',
              borderBottom:'1px solid var(--border)', marginBottom:'.2rem' }}>{d}</div>
          ))}
          {/* Row 2 : colonnes de séances */}
          {DAY_NAMES.map(day => {
            const daySessions = byDay[day]
            return (
              <div key={day} style={{ display:'flex', flexDirection:'column', gap:'.5rem' }}>
                {daySessions.length === 0 ? (
                  <div style={{ height:120, display:'flex', alignItems:'center', justifyContent:'center',
                    border:'1px dashed rgba(255,255,255,.07)', borderRadius:10,
                    fontSize:'.7rem', color:'rgba(255,255,255,.18)', fontStyle:'italic' }}>
                    Repos
                  </div>
                ) : daySessions.map(session => {
                  const si    = session._si
                  const clr   = getSessionColor(session.type)
                  const comp  = weekComps.find(c => c.session_index === si)
                  const done  = !!comp
                  const isRace = session.est_course || (session.id_seance||'').startsWith('RACE')
                  const isRescheduling = rescheduleCell === si
                  return (
                    <div key={si} style={{ borderRadius:10, minWidth:0, position:'relative',
                      border: done ? '1px solid rgba(16,185,129,.35)' : '1px solid var(--border)',
                      borderLeft: `3px solid ${done?'#10B981':clr}`,
                      background: done ? 'rgba(16,185,129,.12)' : isRace ? clr+'18' : 'var(--surface-2)',
                      display:'flex', flexDirection:'column',
                      height:120, overflow: isRescheduling ? 'visible' : 'hidden' }}>
                      {/* Content cliquable */}
                      <div onClick={() => onSessionClick(session, activeSem.numero, si, comp)}
                        style={{ padding:'.55rem .6rem', cursor:'pointer', flex:1, overflow:'hidden', minHeight:0 }}>
                        <div style={{ fontSize:'.67rem', fontWeight:700, color:done?'#10B981':clr, marginBottom:'.15rem',
                          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{session.type || '—'}</div>
                        <div style={{ fontSize:'.8rem', fontWeight:700, lineHeight:1.2,
                          overflow:'hidden', textOverflow:'ellipsis',
                          display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{session.titre || '—'}</div>
                        <div style={{ fontSize:'.68rem', color: done ? '#10B981' : 'var(--text-muted)', marginTop:'.12rem',
                          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {session.duree_min > 0 ? `${session.duree_min} min` : '—'}{done ? ' · ✅' : ''}
                        </div>
                      </div>
                      {/* Actions — TOUJOURS visibles en bas */}
                      <div style={{ display:'flex', borderTop:'1px solid rgba(255,255,255,.06)', flexShrink:0 }}>
                        {onRescheduleSession && (
                          <button
                            onClick={e => { e.stopPropagation(); setRescheduleCell(isRescheduling ? null : si) }}
                            style={{ flex:1, padding:'.28rem 0', background: isRescheduling ? 'rgba(139,47,201,.2)' : 'rgba(255,255,255,.04)',
                              border:'none', cursor:'pointer', fontSize:'.72rem',
                              color: isRescheduling ? '#C084FC' : 'rgba(255,255,255,.38)', fontFamily:'inherit' }}>
                            📅
                          </button>
                        )}
                        {onDeleteSession && (
                          <button onClick={e => { e.stopPropagation(); onDeleteSession(coachWeekIdx, si, session.titre) }}
                            style={{ flex:1, padding:'.28rem 0', background:'rgba(239,68,68,.08)',
                              border:'none', borderLeft: onRescheduleSession ? '1px solid rgba(255,255,255,.06)' : 'none',
                              cursor:'pointer', fontSize:'.72rem', color:'#FCA5A5', fontFamily:'inherit' }}>
                            🗑️
                          </button>
                        )}
                      </div>
                      {/* Day picker */}
                      {isRescheduling && onRescheduleSession && (
                        <div onClick={e => e.stopPropagation()} style={{
                          position:'absolute', top:'calc(100% + .2rem)', left:0, zIndex:60, minWidth:160,
                          background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8,
                          padding:'.4rem', boxShadow:'var(--shadow-lg)',
                        }}>
                          <div style={{ fontSize:'.58rem', color:'var(--text-muted)', marginBottom:'.3rem', textAlign:'center', fontWeight:600 }}>Déplacer au</div>
                          <div style={{ display:'flex', flexWrap:'wrap', gap:'.2rem', justifyContent:'center' }}>
                            {DAY_NAMES.map(d => (
                              <button key={d}
                                onClick={() => { onRescheduleSession(coachWeekIdx, activeSem.numero, si, d); setRescheduleCell(null) }}
                                style={{
                                  padding:'.2rem .35rem', borderRadius:5, fontSize:'.6rem', cursor:'pointer',
                                  fontFamily:'inherit', fontWeight: session.jour === d ? 800 : 500,
                                  background: session.jour === d ? clr+'30' : 'var(--surface-2)',
                                  border: session.jour === d ? `1px solid ${clr}` : '1px solid var(--border)',
                                  color: session.jour === d ? clr : 'var(--text)',
                                }}>
                                {d.slice(0,3)}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* ── MOBILE : liste verticale propre par jour (identique interface athlète) ── */}
        <div className="coach-plan-mobile" style={{ display:'flex', flexDirection:'column', gap:'.625rem' }}>
          {DAY_NAMES.map(day => {
            const daySessions = byDay[day]
            if (!daySessions.length) return null
            return (
              <div key={day}>
                <div style={{ display:'flex', alignItems:'center', gap:'.5rem', marginBottom:'.4rem' }}>
                  <span style={{ fontSize:'.65rem', fontWeight:800, textTransform:'uppercase',
                    letterSpacing:'.1em', color:'var(--text-muted)', flexShrink:0 }}>{day}</span>
                  <div style={{ flex:1, height:1, background:'var(--border)' }} />
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'.4rem' }}>
                  {daySessions.map(session => {
                    const si   = session._si
                    const clr  = getSessionColor(session.type)
                    const comp = weekComps.find(c => c.session_index === si)
                    const done = !!comp
                    const isRace = session.est_course || (session.id_seance||'').startsWith('RACE')
                    return (
                      <div key={si}
                        onClick={() => onSessionClick(session, activeSem.numero, si, comp)}
                        style={{ borderRadius:12, overflow:'hidden', cursor:'pointer',
                          background: done ? 'rgba(16,185,129,.1)' : isRace ? clr+'12' : 'var(--surface-2)',
                          border:`1px solid ${done?'rgba(16,185,129,.3)':isRace?clr+'45':'rgba(255,255,255,.08)'}` }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'.65rem',
                          padding:'.7rem .875rem', borderLeft:`3px solid ${done?'#10B981':clr}` }}>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:'.62rem', fontWeight:700, textTransform:'uppercase',
                              letterSpacing:'.04em', marginBottom:'.15rem', color:done?'#10B981':clr }}>
                              {session.type}
                            </div>
                            <div style={{ fontSize:'.875rem', fontWeight:700, overflow:'hidden',
                              textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{session.titre}</div>
                            <div style={{ fontSize:'.72rem', color:'var(--text-muted)', marginTop:'.12rem' }}>
                              ⏱ {session.duree_min > 0 ? `${session.duree_min} min` : '🏁'}
                            </div>
                          </div>
                          <div style={{ flexShrink:0, display:'flex', alignItems:'center', gap:'.4rem' }}>
                            {done && <span style={{ fontSize:'.8rem' }}>✅</span>}
                            <span style={{ color:'rgba(255,255,255,.3)', fontSize:'1rem' }}>›</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {seances.length === 0 && <p style={{ color:'var(--text-muted)', textAlign:'center', padding:'2rem' }}>Aucune séance cette semaine.</p>}
      </>
    )
  } catch (err) {
    console.error('[PlanView] Render error:', err)
    return (
      <div style={{ padding:'2rem', textAlign:'center', color:'var(--text-muted)' }}>
        <p>⚠️ Erreur d'affichage du plan.</p>
        <p style={{ fontSize:'.8rem', marginTop:'.5rem' }}>{err.message}</p>
      </div>
    )
  }
}

// ─── Design tokens ─────────────────────────────────────────────────────────────
function getSessionColor(type) {
  if (!type) return '#10B981'
  if (SESSION_TYPE_COLORS[type]) return SESSION_TYPE_COLORS[type]
  const lower = type.toLowerCase()
  for (const [k, v] of Object.entries(SESSION_TYPE_COLORS)) {
    if (k.toLowerCase() === lower) return v
  }
  return '#10B981'
}

function parseRetourComment(comment) {
  if (!comment) return {}
  const r = {}
  const match = (re) => { const m = comment.match(re); return m ? m[1].trim() : null }
  r.ressenti = match(/\[Ressenti:\s*([^\]]+)\]/)
  r.ech      = match(/\[Ech:\s*([^\]]+)\]/)
  // Format: [Blocs: ...] (old) ou [Blocs 7×300m: ...] (nouveau avec label)
  const blocsAll = [...comment.matchAll(/\[Blocs([^\]:]*):\s*([^\]]+)\]/g)]
  r.blocsData = blocsAll.map(m => ({
    label: m[1].trim(),
    items: m[2].split('|').map(b => b.trim()).filter(Boolean),
  }))
  r.blocs = r.blocsData.flatMap(b => b.items)
  r.corps  = match(/\[Corps:\s*([^\]]+)\]/)
  r.rac    = match(/\[RAC:\s*([^\]]+)\]/)
  r.fcMoy  = match(/\[FC moy:\s*([^\]]+)\]/)
  r.fcMax  = match(/\[FC max:\s*([^\]]+)\]/)
  r.text   = comment.replace(/\[[^\]]*\]/g, '').trim()
  return r
}

const TYPE_COLORS = {
  'fractionné court': '#E8237A', 'fractionné long': '#8B2FC9', 'fractionné': '#8B2FC9', 'vma': '#8B2FC9',
  'tempo': '#F59E0B', 'seuil': '#F59E0B',
  'progressif': '#84CC16',
  'endurance': '#10B981', 'footing': '#10B981',
  'sortie longue': '#0EA5E9',
  'renforcement': '#D97706',
  'repos': '#374151',
  'course intermédiaire': '#FB923C', 'course': '#FFD700',
  'récupération': '#6B7280', 'côtes': '#EF4444', 'spécifique': '#6366F1',
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
  { lbl: 'Montre GPS',         key: 'gps_watch',              type: 'select',
    opts: [['','—'],['garmin','Garmin'],['coros','Coros'],['suunto','Suunto'],['autre','Autre'],['aucune','Téléphone']],
    show: v => ({garmin:'🟢 Garmin',coros:'⚡ Coros',suunto:'🔴 Suunto',autre:'⌚ Autre',aucune:'📱 Téléphone'})[v] || '—' },
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

const SESSION_TYPES = [
  'Endurance fondamentale','Footing progressif','Sortie longue','Fractionné court','Fractionné long',
  'Tempo / Seuil','Côtes','Spécifique','Récupération active','Natation','Natation endurance',
  'Natation vitesse','Vélo','Vélo endurance','Vélo tempo','Brique','Trail endurance',
  'Trail technique','Trail fractionné','Trail montagne','Renforcement',
]

// ─── Session edit form ────────────────────────────────────────────────────────
// inline=true : rendu direct sans overlay fixe (ex: dans CoachSessionModal qui a déjà un backdrop-filter)
function SessionEditForm({ session, onSave, onCancel, inline = false }) {
  const [v, setV] = useState({
    titre: session.titre || '', type: session.type || '',
    jour: session.jour || '',
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

  const formContent = (
    <div style={{ width:'100%', maxWidth: inline ? '100%' : 780, maxHeight: inline ? 'none' : '92vh',
      overflowY: inline ? 'visible' : 'auto',
      background:'var(--surface)', borderRadius: inline ? 0 : 20,
      border: inline ? 'none' : '1px solid var(--border)',
      boxShadow: inline ? 'none' : '0 24px 60px rgba(0,0,0,.6)' }}>
      {/* Header */}
      <div style={{ padding:'1.25rem 1.5rem', borderBottom:'1px solid var(--border)',
        display:'flex', justifyContent:'space-between', alignItems:'center',
        position: inline ? 'static' : 'sticky', top:0,
        background:'var(--surface)', zIndex:10, borderRadius: inline ? 0 : '20px 20px 0 0' }}>
        <h3 style={{ margin:0, fontSize:'1.05rem' }}>✏️ Modifier la séance</h3>
        <button onClick={onCancel} style={{ padding:'.35rem .75rem', background:'none', border:'1px solid var(--border)',
          borderRadius:8, cursor:'pointer', fontFamily:'inherit', color:'var(--text-muted)', fontSize:'.85rem' }}>✕ Annuler</button>
      </div>

      <div style={{ padding:'1.5rem', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
        <div style={{ gridColumn:'1/-1' }}>
          <label style={lbl}>Titre de la séance</label>
          <input style={{ ...inp, fontSize:'1rem', fontWeight:600, padding:'.6rem .875rem' }}
            value={v.titre} onChange={e => set('titre', e.target.value)} autoFocus />
        </div>
        <div>
          <label style={lbl}>Type / catégorie</label>
          <select style={inp} value={v.type} onChange={e => set('type', e.target.value)}>
            <option value="">— Choisir —</option>
            {SESSION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            <option value={v.type}>{v.type !== '' && !SESSION_TYPES.includes(v.type) ? v.type : ''}</option>
          </select>
        </div>
        <div>
          <label style={lbl}>Jour</label>
          <select style={inp} value={v.jour} onChange={e => set('jour', e.target.value)}>
            {['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'].map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Durée (min)</label>
          <input style={inp} type="number" value={v.duree_min} onChange={e => set('duree_min', e.target.value)} />
        </div>
        <div>
          <label style={lbl}>RPE cible (1-10)</label>
          <input style={inp} type="number" min="1" max="10" value={v.rpe_cible} onChange={e => set('rpe_cible', e.target.value)} />
        </div>
        <div>
          <label style={lbl}>Distance (km) — laisser vide pour auto</label>
          <input style={inp} type="number" step=".1" value={v.distance_km ?? ''} onChange={e => set('distance_km', e.target.value)} />
        </div>
        <div>
          <label style={lbl}>Intensité</label>
          <select style={inp} value={v.intensite} onChange={e => set('intensite', e.target.value)}>
            {['très facile','facile','modérée','dur','très dur','course'].map(i => <option key={i}>{i}</option>)}
          </select>
        </div>
        <div style={{ gridColumn:'1/-1' }}>
          <label style={lbl}>Échauffement</label>
          <textarea style={{ ...inp, resize:'vertical' }} rows={3} value={v.echauffement} onChange={e => set('echauffement', e.target.value)} />
        </div>
        <div style={{ gridColumn:'1/-1' }}>
          <label style={lbl}>Corps de séance</label>
          <textarea style={{ ...inp, resize:'vertical', fontFamily:'monospace', fontSize:'.8rem' }} rows={8} value={v.corps} onChange={e => set('corps', e.target.value)} />
        </div>
        <div style={{ gridColumn:'1/-1' }}>
          <label style={lbl}>Retour au calme</label>
          <textarea style={{ ...inp, resize:'vertical' }} rows={2} value={v.retour_au_calme} onChange={e => set('retour_au_calme', e.target.value)} />
        </div>
        <div style={{ gridColumn:'1/-1' }}>
          <label style={lbl}>Note coach (visible par l'athlète)</label>
          <textarea style={{ ...inp, resize:'vertical' }} rows={3} value={v.notes_coach} onChange={e => set('notes_coach', e.target.value)} />
        </div>
      </div>

      <div style={{ padding:'1rem 1.5rem', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end', gap:'.75rem',
        position: inline ? 'static' : 'sticky', bottom:0, background:'var(--surface)', borderRadius: inline ? 0 : '0 0 20px 20px' }}>
        <button onClick={onCancel}
          style={{ padding:'.6rem 1.25rem', background:'none', border:'1px solid var(--border)',
            borderRadius:10, cursor:'pointer', fontFamily:'inherit', fontSize:'.875rem', color:'var(--text-muted)' }}>
          Annuler
        </button>
        <button onClick={() => onSave({ ...session, ...v,
          duree_min: num('duree_min', session.duree_min),
          distance_km: v.distance_km !== '' ? num('distance_km', session.distance_km) : null,
          rpe_cible: num('rpe_cible', session.rpe_cible) })}
          style={{ padding:'.6rem 1.5rem', background:'var(--gradient)', color:'#fff', border:'none',
            borderRadius:10, fontWeight:700, fontSize:'.875rem', cursor:'pointer', fontFamily:'inherit',
            boxShadow:'0 4px 16px rgba(232,35,122,.35)' }}>
          ✓ Enregistrer les modifications
        </button>
      </div>
    </div>
  )

  if (inline) return formContent

  return (
    <div style={{ position:'fixed', inset:0, zIndex:500, background:'rgba(0,0,0,.7)', backdropFilter:'blur(8px)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}
      onClick={e => e.target === e.currentTarget && onCancel()}>
      {formContent}
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

      {/* Type badge — tronqué sur mobile via .coach-type-badge */}
      <span className="coach-type-badge"
        style={{ flexShrink:0, fontSize:'.63rem', fontWeight:700, padding:'.18rem .55rem',
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
  const color = SESSION_TYPE_COLORS[session.type] || '#10B981'

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

  function CorpsVisual({ mainSet }) {
    const sType = (session.type || '').toLowerCase()

    // EF — clean centered display (not for sortie longue which has fixed pace + richer corps text)
    if (sType.includes('endurance fondamentale') || sType === 'ef') {
      const allOk   = (session.allures || []).filter(a => a?.allure_min_km)
      const paceMin = allOk.find(a => (a.pourcentage_vma || 0) <= 66) || allOk[0]
      const paceMax = allOk.find(a => (a.pourcentage_vma || 0) >= 70 && a !== paceMin) || null
      return (
        <div style={{ padding:'.75rem 0', textAlign:'center' }}>
          <div style={{ fontSize:'3.2rem', fontWeight:900, lineHeight:1, color:'#fff' }}>{session.duree_min}</div>
          <div style={{ fontSize:'.78rem', color:'rgba(255,255,255,.35)', marginBottom:'1.125rem', marginTop:'.15rem' }}>minutes</div>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'.5rem',
            background:`${color}14`, borderRadius:99, padding:'.4rem 1rem',
            border:`1px solid ${color}30`, marginBottom:'.75rem' }}>
            {paceMin && <span style={{ fontSize:'.95rem', fontWeight:700, color }}>{paceMin.allure_min_km}</span>}
            {paceMax && <>
              <span style={{ color:'rgba(255,255,255,.3)', fontSize:'.8rem' }}>à</span>
              <span style={{ fontSize:'.95rem', fontWeight:700, color }}>{paceMax.allure_min_km}</span>
            </>}
            <span style={{ fontSize:'.7rem', color:'rgba(255,255,255,.35)' }}>/km</span>
          </div>
          <div style={{ fontSize:'.75rem', color:'rgba(255,255,255,.35)', fontStyle:'italic' }}>
            65 à 72% VMA · allure au ressenti
          </div>
        </div>
      )
    }

    // BLOC / bullet structured session
    const hasBloc   = /^BLOC\b/im.test(mainSet)
    const hasBullet = mainSet.includes('•')
    if (hasBloc || hasBullet) {
      const nodes = []
      for (const [i, line] of mainSet.split('\n').entries()) {
        const trimmed = line.trim()
        if (!trimmed) continue
        if (/^BLOC\b/i.test(trimmed)) {
          nodes.push(
            <div key={i} style={{ display:'flex', alignItems:'center', gap:'.75rem', margin:nodes.length > 0 ? '1rem 0 0' : '0' }}>
              <div style={{ flex:1, height:1, background:`${color}35` }} />
              <span style={{ fontSize:'.65rem', fontWeight:800, letterSpacing:'.1em', flexShrink:0,
                color, textTransform:'uppercase', padding:'.22rem .75rem',
                background:`${color}18`, borderRadius:99, border:`1px solid ${color}35` }}>{trimmed}</span>
              <div style={{ flex:1, height:1, background:`${color}35` }} />
            </div>
          )
        } else if (trimmed.startsWith('•')) {
          const content = trimmed.slice(1).trim()
          const isRecov = /r[eé]cup|marche|trot|repos/i.test(content)
          if (isRecov) {
            nodes.push(
              <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'.5rem', padding:'.2rem 0' }}>
                <span style={{ fontSize:'.7rem', color:'#38BDF8' }}>⏸</span>
                <span style={{ fontSize:'.78rem', color:'rgba(255,255,255,.4)', fontStyle:'italic' }}>{content}</span>
              </div>
            )
          } else {
            const mMatch = content.match(/^(\d+(?:[.,]\d+)?\s*(?:m\b|km\b|min\b))\s+/i)
            const metric = mMatch ? mMatch[1].trim() : null
            const rest   = mMatch ? content.slice(mMatch[0].length) : content
            nodes.push(
              <div key={i} style={{ background:`${color}0D`, border:`1px solid ${color}2A`, borderRadius:14, padding:'.875rem 1rem' }}>
                {metric && <div style={{ fontSize:'1.4rem', fontWeight:900, color:'#fff', lineHeight:1, marginBottom:'.3rem' }}>{metric}</div>}
                <div style={{ fontSize:'.85rem', lineHeight:1.55, color:'rgba(255,255,255,.72)' }}>{metric ? rest : content}</div>
              </div>
            )
          }
        } else {
          nodes.push(
            <div key={i} style={{ padding:'.55rem .75rem', marginTop:'.25rem',
              background:'rgba(14,165,233,.06)', border:'1px solid rgba(14,165,233,.14)', borderRadius:10 }}>
              <p style={{ fontSize:'.8rem', lineHeight:1.5, color:'rgba(255,255,255,.5)', margin:0, fontStyle:'italic' }}>{trimmed}</p>
            </div>
          )
        }
      }
      return <div style={{ display:'flex', flexDirection:'column', gap:'.55rem' }}>{nodes}</div>
    }

    // Affichage unifié pour tout le reste (footings, récup, progression, etc.)
    if (session.duree_min > 0) {
      const allOk = (session.allures || []).filter(a => a?.allure_min_km)
      const corpsAllures = allOk.filter(a => !/retour|calme|récup|échauff/i.test(a.zone || ''))
      const display = corpsAllures.length > 0 ? corpsAllures : allOk
      const sorted = [...display].sort((a, b) => (a.vitesse_kmh || 0) - (b.vitesse_kmh || 0))
      const paceMin = sorted[0] || null
      const paceMax = sorted.length > 1 ? sorted[sorted.length - 1] : null
      return (
        <div style={{ padding:'.5rem 0', textAlign:'center' }}>
          <div style={{ fontSize:'3rem', fontWeight:900, lineHeight:1, color:'#fff' }}>{session.duree_min}</div>
          <div style={{ fontSize:'.78rem', color:'rgba(255,255,255,.35)', marginBottom:'1rem', marginTop:'.15rem' }}>minutes</div>
          {(paceMin || paceMax) && (
            <div style={{ display:'inline-flex', alignItems:'center', gap:'.5rem',
              background:`${color}14`, borderRadius:99, padding:'.4rem 1rem',
              border:`1px solid ${color}30`, marginBottom:'.625rem' }}>
              {paceMin && <span style={{ fontSize:'.95rem', fontWeight:700, color }}>{paceMin.allure_min_km}</span>}
              {paceMax && <>
                <span style={{ color:'rgba(255,255,255,.3)', fontSize:'.8rem' }}>à</span>
                <span style={{ fontSize:'.95rem', fontWeight:700, color }}>{paceMax.allure_min_km}</span>
              </>}
              <span style={{ fontSize:'.7rem', color:'rgba(255,255,255,.35)' }}>/km</span>
            </div>
          )}
          {paceMin && (
            <div style={{ fontSize:'.75rem', color:'rgba(255,255,255,.35)', fontStyle:'italic' }}>
              {paceMax
                ? `${paceMin.pourcentage_vma} à ${paceMax.pourcentage_vma}% VMA · allure au ressenti`
                : `${paceMin.pourcentage_vma}% VMA`}
            </div>
          )}
          {/* Texte du corps si contenu significatif (sortie longue, tempo avec description) */}
          {mainSet && mainSet.length > 40 && (
            <div style={{ marginTop:'1rem', fontSize:'.85rem', lineHeight:1.7,
              color:'rgba(255,255,255,.72)', textAlign:'left', whiteSpace:'pre-line',
              borderTop:`1px solid ${color}20`, paddingTop:'.875rem' }}>
              {mainSet}
            </div>
          )}
        </div>
      )
    }

    return <p style={{ fontSize:'.85rem', lineHeight:1.65, color:'rgba(255,255,255,.75)', whiteSpace:'pre-line', margin:0 }}>{mainSet}</p>
  }

  return (
    <div
      style={{ position:'fixed', inset:0, zIndex:300,
        background:'rgba(0,0,0,.65)', backdropFilter:'blur(6px)',
        display:'flex', alignItems:'center', justifyContent:'center',
        padding:'1rem' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <style>{`@keyframes slideUpModal { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }`}</style>
      <div style={{
        width:'100%', maxWidth:680,
        background:'var(--surface)',
        borderRadius:20,
        border:'1px solid var(--border)',
        maxHeight:'88vh', overflowY:'auto',
        boxShadow:'0 24px 60px rgba(0,0,0,.6)',
        animation:'slideUpModal .28s ease both',
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
              session.duree_min > 0 ? { icon:'⏱', val:`${(() => { const pm = t => { const m=(t||'').match(/^(\d+)\s*min/i); return m?parseInt(m[1],10):0 }; const e=pm(session.echauffement),r=pm(session.retour_au_calme),b=session.duree_min||0; return (e+r>0&&b<e+r+5)?b+e+r:b })()} min` } : null,
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
          <div className="coach-session-modal-inner"
            style={{ padding:'1rem 1.25rem 2.5rem', display:'flex', flexDirection:'column', gap:'.75rem' }}>

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
                {session.corps && (() => {
                  const t = (session.type || '').toLowerCase()
                  const isEF = t.includes('endurance fondamentale') || t === 'ef'
                  return (
                    <div style={{ borderLeft:`3px solid ${color}`, padding: isEF ? '1.25rem 1rem' : '.875rem 1rem .875rem .875rem', background:`${color}06` }}>
                      {!isEF && (
                        <div style={{ fontSize:'.65rem', fontWeight:700, textTransform:'uppercase',
                          letterSpacing:'.08em', color, marginBottom:'.4rem' }}>⚡ Séance principale</div>
                      )}
                      <CorpsVisual mainSet={session.corps} />
                    </div>
                  )
                })()}
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
          <SessionEditForm
            session={session}
            onSave={updated => { onSave(weekNum, sessionIdx, updated); onClose() }}
            onCancel={() => setEditing(false)}
            inline={true}
          />
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
  const [tab,           setTab]           = useState(() => sessionStorage.getItem(`admin_tab_${athlete.id}`) || 'profile')
  const [generating,    setGenerating]    = useState(false)
  const [generateMsg,   setGenerateMsg]   = useState('')
  const [local,         setLocal]         = useState(athlete)
  const [editField,     setEditField]     = useState(null)
  const [editVal,       setEditVal]       = useState('')
  const [editDays,      setEditDays]      = useState([])
  const [editSaving,    setEditSaving]    = useState(false)
  const [editMsg,       setEditMsg]       = useState(false)
  const [msgVal,        setMsgVal]        = useState(athlete.coach_message || '')
  const [saveToast,     setSaveToast]     = useState(null) // { text, ok }

  function showSaveToast(text, ok = true) {
    setSaveToast({ text, ok })
    setTimeout(() => setSaveToast(null), 3000)
  }

  async function freeActivate() {
    if (!window.confirm(`Activer gratuitement ${local.first_name} ${local.last_name} ?`)) return
    setFreeActivating(true)
    try {
      await adminFetch(`/api/admin/athletes/${local.id}/free-activate`, { method: 'POST' })
      setLocal(prev => ({ ...prev, subscription_status: 'active' }))
      showSaveToast(`${local.first_name} activé(e) gratuitement`)
    } catch (err) {
      showSaveToast('Erreur : ' + err.message, false)
    } finally {
      setFreeActivating(false)
    }
  }

  const [sessionSaving,    setSessionSaving]    = useState(false)
  const [openSession,      setOpenSession]      = useState(null)
  const [freeActivating,   setFreeActivating]   = useState(false)
  const [openRetour,    setOpenRetour]    = useState(null)
  const [coachWeekIdx, setCoachWeekIdx]  = useState(0)  // active week tab in plan view
  const [retourWeek,   setRetourWeek]    = useState(null) // selected week in retours tab
  const [bilans,       setBilans]        = useState([])
  const [bilansLoaded, setBilansLoaded]  = useState(false)
  const [bilansError,  setBilansError]   = useState(null)
  const [bilanResponses, setBilanResponses] = useState({}) // { [bilanId]: string }
  const [bilanSaving,  setBilanSaving]   = useState({}) // { [bilanId]: bool }

  const currentWeekNum = getCurrentWeekNum(plan)

  // Auto-select current week when plan loads
  useEffect(() => {
    if (!plan?.plan_data?.semaines) return
    const idx = plan.plan_data.semaines.findIndex(s => s.numero === currentWeekNum)
    if (idx >= 0) setCoachWeekIdx(idx)
  }, [plan?.id])

  useEffect(() => { loadDetail() }, [])

  useEffect(() => {
    sessionStorage.setItem(`admin_tab_${athlete.id}`, tab)
    if (tab === 'bilans' && !bilansLoaded) loadBilans()
  }, [athlete.id, tab])

  async function loadBilans() {
    try {
      const body = await adminFetch(`/api/admin/weekly-bilans?userId=${athlete.id}`)
      if (!body) throw new Error('Erreur')
      setBilans(body.bilans || [])
      // Pre-fill responses
      const resps = {}
      for (const b of body.bilans || []) {
        resps[b.id] = b.coach_response || ''
      }
      setBilanResponses(resps)
    } catch (err) {
      console.error('[Bilans] load error:', err.message)
      setBilans([])
      setBilansError(err.message)
    } finally {
      setBilansLoaded(true)
    }
  }

  async function submitBilanResponse(bilanId) {
    const response = bilanResponses[bilanId]?.trim()
    if (!response) return
    setBilanSaving(s => ({ ...s, [bilanId]: true }))
    try {
      const body = await adminFetch(`/api/admin/weekly-bilans/${bilanId}/response`, {
        method: 'POST',
        body: JSON.stringify({ response }),
      })
      if (!body) throw new Error('Erreur')
      setBilans(bs => bs.map(b => b.id === bilanId ? { ...b, coach_response: response, coach_responded_at: new Date().toISOString() } : b))
      showSaveToast('Réponse envoyée')
    } catch (err) {
      showSaveToast('Erreur : ' + err.message, false)
    } finally {
      setBilanSaving(s => ({ ...s, [bilanId]: false }))
    }
  }

  // Realtime : met à jour le plan coach quand l'athlète déplace une séance
  useEffect(() => {
    if (!athlete?.id) return
    const channel = supabase.channel(`plan-${athlete.id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'training_plans',
        filter: `user_id=eq.${athlete.id}`,
      }, payload => {
        if (payload.new?.plan_data) {
          setPlan(p => p ? { ...p, plan_data: payload.new.plan_data } : p)
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [athlete?.id])

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
      const body = await adminFetch('/api/plans/generate', {
        method: 'POST',
        body: JSON.stringify({ userId: athlete.id, profile: local, clientDate: new Date().toISOString().split('T')[0] }),
      })
      if (!body) throw new Error('Erreur')
      setGenerateMsg('Plan généré. Valide-le dans l\'onglet Plans.')
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
    if (field === 'preferred_days') {
      setEditDays(Array.isArray(local[field]) ? local[field] : [])
    } else {
      setEditVal(local[field] ?? '')
      if (f?.type === 'date' && local[field]) setEditVal(local[field].split('T')[0])
    }
  }

  async function saveField() {
    if (editSaving || !editField) return
    setEditSaving(true)
    try {
      const raw = editField === 'preferred_days' ? editDays : editVal
      const value = (raw === '' || (Array.isArray(raw) && raw.length === 0)) ? null : raw
      const patch = { [editField]: value }

      // Server endpoint uses service key — bypasses Supabase RLS
      const result = await api.adminUpdateProfile(athlete.id, patch)
      if (!result.success) throw new Error(result.error || 'Échec de la sauvegarde')

      const updated = { ...local, ...(result.profile || patch) }
      setLocal(updated)
      onUpdated?.(updated)
      setEditField(null)
      showSaveToast('✓ Enregistré')

      // Si la VMA change, recalculer les allures du plan actif (séances validées préservées)
      if (editField === 'vma' || editField === 'vma_known') {
        const LEVEL_VMA_DEFAULTS = { debutant: 10, intermediaire: 14, confirme: 17, expert: 20 }
        const newVmaKnown = editField === 'vma_known' ? (value === 'true' || value === true) : (updated.vma_known === true || updated.vma_known === 'true')
        const newVmaVal   = editField === 'vma' ? parseFloat(value) : parseFloat(updated.vma)
        const resolvedVma = (newVmaKnown && newVmaVal) ? newVmaVal : (LEVEL_VMA_DEFAULTS[updated.level] || 14)
        api.recalculateVma({ userId: athlete.id, newVma: resolvedVma })
          .then(() => showSaveToast('✓ Allures du plan recalculées (VMA ' + resolvedVma + ')'))
          .catch(() => {})
      }
    } catch (err) {
      console.error('[saveField]', err)
      showSaveToast('✗ ' + (err.message || 'Erreur'), false)
    } finally {
      setEditSaving(false)
    }
  }

  async function saveCoachMessage() {
    setEditSaving(true)
    try {
      // Also routes through server to bypass RLS
      const result = await api.adminUpdateProfile(athlete.id, { coach_message: msgVal })
      if (!result.success) throw new Error(result.error || 'Échec')
      const updated = { ...local, coach_message: msgVal }
      setLocal(updated); onUpdated?.(updated); setEditMsg(false)
      showSaveToast('✓ Note enregistrée')
    } catch (err) {
      showSaveToast('✗ ' + err.message, false)
    } finally {
      setEditSaving(false)
    }
  }

  async function deleteSessionFromPlan(weekIdx, sessionIdx, titre) {
    if (!window.confirm(`Supprimer "${titre}" ?`)) return
    try {
      const body = await adminFetch(`/api/admin/plans/${plan.id}/session`, {
        method: 'DELETE',
        body: JSON.stringify({ weekIdx, sessionIdx }),
      })
      if (body.plan_data) setPlan(p => ({ ...p, plan_data: body.plan_data }))
    } catch (err) {
      alert('Erreur suppression : ' + err.message)
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

  async function rescheduleSession(weekIdx, weekNum, sessionIdx, newDay) {
    try {
      const updatedPlan = JSON.parse(JSON.stringify(plan.plan_data))
      const week = updatedPlan.semaines.find(s => s.numero === weekNum)
      if (week?.seances?.[sessionIdx]) {
        week.seances[sessionIdx] = { ...week.seances[sessionIdx], jour: newDay }
        const { error } = await supabase.from('training_plans').update({ plan_data: updatedPlan }).eq('id', plan.id)
        if (error) throw error
        setPlan(p => ({ ...p, plan_data: updatedPlan }))
        showSaveToast(`✓ Séance déplacée au ${newDay}`)
      }
    } catch (err) {
      showSaveToast('✗ ' + err.message, false)
    }
  }

  const inp = { width:'100%', padding:'.4rem .7rem', border:'1.5px solid var(--primary)',
    borderRadius:8, fontSize:'.875rem', fontFamily:'inherit', background:'var(--bg)',
    color:'var(--text)', outline:'none', boxSizing:'border-box' }

  const planComps = completions.filter(c => plan && c.plan_id === plan.id)
    .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))

  const rpeAvg = (list) => {
    const vals = list.filter(c => c.rpe).map(c => c.rpe)
    return vals.length ? (vals.reduce((a,b) => a+b,0) / vals.length).toFixed(1) : '—'
  }
  const avgRpe = rpeAvg(planComps)

  const _now = new Date()
  const moisLabel = _now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  const avgRpeMois = rpeAvg(planComps.filter(c => {
    const d = new Date(c.completed_at)
    return d.getFullYear() === _now.getFullYear() && d.getMonth() === _now.getMonth()
  }))
  const avgRpeWeek = rpeAvg(planComps.filter(c => c.week_number === currentWeekNum))

  const planStart = (() => {
    if (!plan) return null
    const d = new Date(plan.activated_at || plan.created_at)
    d.setHours(0, 0, 0, 0)
    const dow = d.getDay()
    if (dow !== 1) d.setDate(d.getDate() + (dow === 0 ? 1 : 8 - dow))
    return d
  })()
  const getWeekRange = (weekNum) => {
    if (!planStart) return ''
    const start = new Date(planStart)
    start.setDate(start.getDate() + (weekNum - 1) * 7)
    const end = new Date(start); end.setDate(end.getDate() + 6)
    const fmt = d => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    return `${fmt(start)} – ${fmt(end)}`
  }

  const TABS = [
    { v:'profile',  l:'👤 Profil' },
    { v:'plan',     l:`📋 Plan${plan ? ` · S${currentWeekNum}` : ''}` },
    { v:'retours',  l:`📊 Retours (${planComps.length})` },
    { v:'bilans',   l:'📝 Bilans' },
    ...(alerts.length > 0 ? [{ v:'alertes', l:`⚠️ Alertes (${alerts.length})` }] : []),
  ]

  return (
    <div style={{ position:'fixed', inset:0, zIndex:201, background:'var(--bg)', display:'flex', flexDirection:'column' }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="coach-panel-header"
        style={{ background:'var(--surface)', borderBottom:'1px solid var(--border)',
          padding:'1rem 1.5rem', display:'flex', alignItems:'center', gap:'1rem', flexShrink:0 }}>
        <button onClick={onClose}
          style={{ padding:'.38rem .75rem', background:'none', border:'1px solid var(--border)',
            borderRadius:8, cursor:'pointer', fontFamily:'inherit', color:'var(--text-muted)', fontSize:'.82rem', flexShrink:0 }}>
          ← Retour
        </button>
        <div className="chat-avatar" style={{ width:42, height:42, fontSize:'1.05rem', flexShrink:0, overflow:'hidden', padding:0 }}>
          {local.avatar_url
            ? <img src={local.avatar_url} alt={local.first_name} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }} />
            : local.first_name?.[0]?.toUpperCase()}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:700, fontSize:'1.05rem', display:'flex', alignItems:'center', gap:'.5rem' }}>
            {local.first_name} {local.last_name}
            {alerts.length > 0 && (
              <span style={{ background:'#EF4444', color:'#fff', borderRadius:99,
                fontSize:'.6rem', fontWeight:800, padding:'.1rem .4rem' }}>
                {alerts.length}!
              </span>
            )}
          </div>
          <div className="coach-panel-header-info" style={{ fontSize:'.78rem', color:'var(--text-muted)' }}>
            {local.email} · {OBJECTIVE_LABELS[local.objective] || '—'} · {LEVEL_LABELS[local.level] || '—'}
          </div>
        </div>
        <div className="coach-panel-badges" style={{ display:'flex', gap:'.4rem', flexShrink:0, flexWrap:'wrap', alignItems:'center' }}>
          <span className={`badge ${local.subscription_status === 'active' ? 'badge-success' : 'badge-warning'}`}>
            {local.subscription_status === 'active' ? '✓ Actif' : 'Inactif'}
          </span>
          {local.subscription_status !== 'active' && (
            <button
              onClick={freeActivate}
              disabled={freeActivating}
              style={{ padding:'.3rem .75rem', borderRadius:8, border:'1px solid rgba(16,185,129,.4)',
                background:'rgba(16,185,129,.1)', color:'#10B981', fontWeight:600, fontSize:'.75rem',
                cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>
              {freeActivating ? '…' : '🎁 Activer gratuitement'}
            </button>
          )}
          {plan && <span className={`badge ${plan.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
            Plan {plan.status === 'active' ? 'actif' : 'en attente'}
          </span>}
          {local.heat_mode && <span className="badge" style={{ background:'rgba(245,158,11,.12)', color:'#FCD34D' }}>🌡️</span>}
          {local.injury_mode && <span className="badge" style={{ background:'rgba(239,68,68,.12)', color:'#FCA5A5' }}>🩹</span>}
          {plan?.plan_data?.semaines?.some(s => s._adapted_for) && (
            <span className="badge" style={{ background:'rgba(139,47,201,.15)', color:'#C084FC', border:'1px solid rgba(139,47,201,.3)' }}>
              ⚡ {(() => {
                const labels = { fatigue:'Fatigue', heat:'Canicule', injury:'Blessure', cycle:'Cycle' }
                const found = plan.plan_data.semaines.find(s => s._adapted_for)
                return labels[found._adapted_for] || found._adapted_for
              })()} en cours
            </span>
          )}
        </div>
      </div>

      {/* ── Save toast ─────────────────────────────────────── */}
      {saveToast && (
        <div style={{
          position:'fixed', top:'1rem', right:'1rem', zIndex:9999,
          padding:'.65rem 1.1rem', borderRadius:10, fontWeight:700, fontSize:'.875rem',
          background: saveToast.ok ? 'rgba(16,185,129,.15)' : 'rgba(239,68,68,.15)',
          border: `1px solid ${saveToast.ok ? 'rgba(16,185,129,.4)' : 'rgba(239,68,68,.4)'}`,
          color: saveToast.ok ? '#6EE7B7' : '#FCA5A5',
          boxShadow:'0 4px 20px rgba(0,0,0,.3)',
        }}>
          {saveToast.text}
        </div>
      )}

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
              <div className="coach-tab-pane" style={{ maxWidth:720, margin:'0 auto', padding:'1.5rem' }}>

                {/* ── helpers ── */}
                {(() => {
                  const isTri   = ['tri_sprint','tri_olympic','tri_half','tri_ironman'].includes(local.objective)
                  const isTrail = ['trail_10k','trail_15k','trail_20k','trail_30k','trail_50k','trail_80k','trail_100k','trail_100m'].includes(local.objective)

                  const sectionHdr = { fontSize:'.68rem', fontWeight:800, textTransform:'uppercase',
                    letterSpacing:'.1em', color:'var(--text-muted)', padding:'.625rem 0',
                    borderBottom:'1px solid var(--border)', marginBottom:'.125rem', marginTop:0 }

                  const S = {
                    objectif:     { background:'rgba(210,170,255,.15)', border:'1.5px solid rgba(180,130,255,.35)' },
                    performance:  { background:'rgba(140,200,255,.15)', border:'1.5px solid rgba(90,160,255,.35)'  },
                    organisation: { background:'rgba(110,230,195,.14)', border:'1.5px solid rgba(60,195,155,.35)'  },
                    trail:        { background:'rgba(170,230,110,.14)', border:'1.5px solid rgba(130,200,70,.35)'  },
                    triathlon:    { background:'rgba(110,225,240,.14)', border:'1.5px solid rgba(60,195,220,.35)'  },
                    sante:        { background:'rgba(255,165,200,.14)', border:'1.5px solid rgba(240,110,165,.35)' },
                  }
                  const sectionBlock = (key) => ({
                    ...S[key], borderRadius: 14,
                    padding: '.25rem 1rem .875rem', marginBottom: '.875rem',
                  })

                  const rowStyle = { display:'flex', justifyContent:'space-between', alignItems:'center',
                    padding:'.75rem 0', borderBottom:'1px solid rgba(255,255,255,.04)',
                    cursor:'pointer', gap:'1rem' }

                  const saveBtn = { padding:'.28rem .65rem', background:'var(--gradient)', color:'#fff',
                    border:'none', borderRadius:6, fontWeight:700, fontSize:'.75rem',
                    cursor:'pointer', fontFamily:'inherit' }

                  const cancelBtn = { padding:'.28rem .55rem', background:'none',
                    border:'1px solid var(--border)', borderRadius:6, fontSize:'.75rem',
                    cursor:'pointer', fontFamily:'inherit', color:'var(--text-muted)' }

                  function FieldRow({ field, label, show, opts, type: ftype = 'text' }) {
                    const isEditing = editField === field
                    return (
                      <div style={{ ...rowStyle, cursor: isEditing ? 'default' : 'pointer' }}
                        onClick={() => !isEditing && startEdit(field)}>
                        <span style={{ fontSize:'.82rem', color:'var(--text-muted)', flexShrink:0, minWidth:140 }}>{label}</span>
                        {isEditing ? (
                          <div style={{ display:'flex', alignItems:'center', gap:'.4rem', flex:1, justifyContent:'flex-end' }}
                            onClick={e => e.stopPropagation()}>
                            {ftype === 'select' ? (
                              <select value={editVal} onChange={e => setEditVal(e.target.value)} style={{ ...inp, width:'auto', flex:1, maxWidth:200 }} autoFocus>
                                {opts.map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                              </select>
                            ) : (
                              <input type={ftype} value={editVal} onChange={e => setEditVal(e.target.value)}
                                style={{ ...inp, width:'auto', flex:1, maxWidth:200 }} autoFocus
                                onKeyDown={e => { if (e.key === 'Enter') saveField(); if (e.key === 'Escape') setEditField(null) }} />
                            )}
                            <button onClick={saveField} disabled={editSaving} style={saveBtn}>{editSaving ? '…' : '✓'}</button>
                            <button onClick={() => setEditField(null)} style={cancelBtn}>✕</button>
                          </div>
                        ) : (
                          <span style={{ fontWeight:600, fontSize:'.875rem', textAlign:'right' }}>{show(local[field])}</span>
                        )}
                      </div>
                    )
                  }

                  const DAYS = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']

                  return (
                    <>
                      {/* ── Section 1 : Objectif & Course ── */}
                      <div style={sectionBlock('objectif')}>
                      <div style={sectionHdr}>🎯 Objectif &amp; Course</div>

                      <FieldRow field="objective" label="Objectif" type="select"
                        opts={Object.entries(OBJECTIVE_LABELS)}
                        show={v => OBJECTIVE_LABELS[v] || '—'} />

                      <FieldRow field="level" label="Niveau" type="select"
                        opts={Object.entries(LEVEL_LABELS)}
                        show={v => LEVEL_LABELS[v] || '—'} />

                      <FieldRow field="race_date" label="Date de course" type="date"
                        show={v => v ? new Date(v).toLocaleDateString('fr-FR') : '—'} />

                      <FieldRow field="intermediate_race_name" label="Course intermédiaire" type="text"
                        show={v => v || 'Aucune'} />

                      <FieldRow field="intermediate_race_date" label="Date intermédiaire" type="date"
                        show={v => v ? new Date(v).toLocaleDateString('fr-FR') : '—'} />

                      {/* Jours préférés — toggles */}
                      {(() => {
                        const isEditing = editField === 'preferred_days'
                        const current   = Array.isArray(local.preferred_days) ? local.preferred_days : []
                        return (
                          <div style={{ ...rowStyle, flexWrap: isEditing ? 'wrap' : 'nowrap',
                            cursor: isEditing ? 'default' : 'pointer', alignItems: isEditing ? 'flex-start' : 'center' }}
                            onClick={() => !isEditing && startEdit('preferred_days')}>
                            <span style={{ fontSize:'.82rem', color:'var(--text-muted)', flexShrink:0, minWidth:140 }}>Jours préférés</span>
                            {isEditing ? (
                              <div style={{ flex:1, display:'flex', flexDirection:'column', gap:'.5rem', alignItems:'flex-end' }}
                                onClick={e => e.stopPropagation()}>
                                <div style={{ display:'flex', flexWrap:'wrap', gap:'.35rem', justifyContent:'flex-end' }}>
                                  {DAYS.map(d => {
                                    const sel = editDays.includes(d)
                                    return (
                                      <button key={d} type="button"
                                        onClick={() => setEditDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])}
                                        style={{ padding:'.28rem .55rem', borderRadius:7, fontWeight:600, fontSize:'.78rem',
                                          border: sel ? '2px solid var(--primary)' : '1px solid var(--border)',
                                          background: sel ? 'rgba(139,47,201,.2)' : 'var(--surface)',
                                          color: sel ? '#fff' : 'var(--text-muted)', cursor:'pointer', fontFamily:'inherit' }}>
                                        {d}
                                      </button>
                                    )
                                  })}
                                </div>
                                <div style={{ display:'flex', gap:'.35rem' }}>
                                  <button onClick={saveField} disabled={editSaving} style={saveBtn}>{editSaving ? '…' : '✓'}</button>
                                  <button onClick={() => setEditField(null)} style={cancelBtn}>✕</button>
                                </div>
                              </div>
                            ) : (
                              <span style={{ fontWeight:600, fontSize:'.875rem', textAlign:'right' }}>
                                {current.length ? current.join(' · ') : '—'}
                              </span>
                            )}
                          </div>
                        )
                      })()}

                      </div>{/* end s1 */}
                      {/* ── Section 2 : Performance ── */}
                      <div style={sectionBlock('performance')}>
                      <div style={sectionHdr}>📊 Performance</div>

                      {/* VMA row avec bouton recalcul intégré */}
                      {(() => {
                        const isEditing = editField === 'vma'
                        const LEVEL_VMA_DEFAULTS = { debutant: 10, intermediaire: 14, confirme: 17, expert: 20 }
                        const vmaKnown    = local.vma_known === true || local.vma_known === 'true'
                        const resolvedVma = (vmaKnown && local.vma) ? parseFloat(local.vma) : (LEVEL_VMA_DEFAULTS[local.level] || 14)
                        return (
                          <div style={{ ...rowStyle, cursor: isEditing ? 'default' : 'pointer' }}
                            onClick={() => !isEditing && startEdit('vma')}>
                            <span style={{ fontSize:'.82rem', color:'var(--text-muted)', flexShrink:0, minWidth:140 }}>VMA (km/h)</span>
                            {isEditing ? (
                              <div style={{ display:'flex', alignItems:'center', gap:'.4rem', flex:1, justifyContent:'flex-end' }}
                                onClick={e => e.stopPropagation()}>
                                <input type="number" value={editVal} onChange={e => setEditVal(e.target.value)}
                                  style={{ ...inp, width:'auto', flex:1, maxWidth:200 }} autoFocus
                                  onKeyDown={e => { if (e.key === 'Enter') saveField(); if (e.key === 'Escape') setEditField(null) }} />
                                <button onClick={saveField} disabled={editSaving} style={saveBtn}>{editSaving ? '…' : '✓'}</button>
                                <button onClick={() => setEditField(null)} style={cancelBtn}>✕</button>
                              </div>
                            ) : (
                              <div style={{ display:'flex', alignItems:'center', gap:'.5rem' }} onClick={e => e.stopPropagation()}>
                                <button
                                  onClick={() => {
                                    api.recalculateVma({ userId: athlete.id, newVma: resolvedVma })
                                      .then(r => showSaveToast(r?.skipped > 0
                                        ? `✓ Allures recalculées — ${r.skipped} séance(s) validée(s) préservée(s)`
                                        : '✓ Allures du plan recalculées'))
                                      .catch(e => showSaveToast('✗ ' + e.message, false))
                                  }}
                                  style={{ fontSize:'.7rem', padding:'2px 8px', borderRadius:5,
                                    border:'1px solid #4A90D9', background:'#EBF4FF', color:'#1D4ED8',
                                    cursor:'pointer', fontWeight:600, whiteSpace:'nowrap' }}
                                >
                                  Recalculer les allures
                                </button>
                                <span style={{ fontWeight:600, fontSize:'.875rem', cursor:'pointer' }}
                                  onClick={() => startEdit('vma')}>
                                  {local.vma ? `${local.vma} km/h` : '—'}
                                </span>
                              </div>
                            )}
                          </div>
                        )
                      })()}

                      <FieldRow field="vma_known" label="VMA mesurée ?" type="select"
                        opts={[['true','Oui'],['false','Non']]}
                        show={v => v === true || v === 'true' ? 'Oui' : 'Non'} />

                      {!isTri && (
                        <FieldRow field="chrono_goal" label="Chrono cible" type="text"
                          show={v => v || 'Progresser'} />
                      )}

                      {isTri && (<>
                        <FieldRow field="chrono_natation" label="🏊 Chrono nage" type="text"
                          show={v => v || '—'} />
                        <FieldRow field="chrono_velo" label="🚴 Chrono vélo" type="text"
                          show={v => v || '—'} />
                        <FieldRow field="chrono_goal" label="🏃 Chrono course" type="text"
                          show={v => v || '—'} />
                      </>)}

                      <FieldRow field="best_recent_time" label="Meilleur chrono récent" type="text"
                        show={v => v || '—'} />

                      </div>{/* end s2 */}
                      {/* ── Section 3 : Organisation entraînement ── */}
                      <div style={sectionBlock('organisation')}>
                      <div style={sectionHdr}>📅 Organisation entraînement</div>

                      {!isTri && (
                        <FieldRow field="days_per_week" label="Séances / semaine" type="number"
                          show={v => v ? `${v} j/sem` : '—'} />
                      )}

                      {isTri && (<>
                        <FieldRow field="tri_swim_sessions" label="🏊 Nage / sem." type="number"
                          show={v => v ? `${v} séance(s)` : '—'} />
                        <FieldRow field="tri_bike_sessions" label="🚴 Vélo / sem." type="number"
                          show={v => v ? `${v} séance(s)` : '—'} />
                        <FieldRow field="tri_run_sessions" label="🏃 Course / sem." type="number" max={6}
                          show={v => v ? `${v} séance(s)` : '—'} />
                      </>)}

                      <FieldRow field="gps_watch" label="⌚ Montre GPS" type="select"
                        opts={[['','—'],['garmin','Garmin'],['coros','Coros'],['suunto','Suunto'],['autre','Autre'],['aucune','Téléphone']]}
                        show={v => ({garmin:'🟢 Garmin',coros:'⚡ Coros',suunto:'🔴 Suunto',autre:'⌚ Autre',aucune:'📱 Téléphone'})[v] || '—'} />

                      </div>{/* end s3 */}
                      {/* ── Section 4 : Trail (conditionnel) ── */}
                      {isTrail && (<>
                        <div style={sectionBlock('trail')}>
                        <div style={sectionHdr}>⛰️ Trail</div>
                        <FieldRow field="training_terrain" label="Zone d'habitation" type="select"
                          opts={[['','Non précisé'],['montagne','Montagne'],['semi_montagne','Semi-montagne'],['ville_plat','Ville/Plat']]}
                          show={v => ({montagne:'Montagne',semi_montagne:'Semi-montagne',ville_plat:'Ville/Plat'})[v] || '—'} />
                        <FieldRow field="race_denivele" label="Dénivelé course (m D+)" type="number"
                          show={v => v ? `${v} m D+` : '—'} />
                        </div>
                      </>)}

                      {/* ── Section 5 : Triathlon (conditionnel) ── */}
                      {isTri && (<>
                        <div style={sectionBlock('triathlon')}>
                        <div style={sectionHdr}>🦾 Triathlon</div>
                        <FieldRow field="open_water" label="🌊 Nage en eau libre" type="select"
                          opts={[['','—'],['oui','Oui, accès eau libre'],['selon_conditions','Selon les conditions'],['non','Non, piscine seulement']]}
                          show={v => ({oui:'Oui',selon_conditions:'Selon conditions',non:'Piscine'})[v] || '—'} />
                        <FieldRow field="bike_type" label="Type de vélo" type="select"
                          opts={[['','—'],['route','Route'],['tt','Contre-la-montre'],['gravel','Gravel']]}
                          show={v => ({route:'Route',tt:'Contre-la-montre',gravel:'Gravel'})[v] || '—'} />
                        </div>
                      </>)}

                      {/* ── Section 6 : Santé & Forme ── */}
                      <div style={sectionBlock('sante')}>
                      <div style={sectionHdr}>💊 Santé &amp; Forme</div>

                      <FieldRow field="current_form" label="Forme actuelle" type="text"
                        show={v => v || '—'} />

                      <FieldRow field="injuries" label="Blessures / douleurs" type="text"
                        show={v => v || 'Aucune'} />

                      {(local.gender === 'femme' || local.period_pain) && (
                        <FieldRow field="period_pain_days" label="Douleur cycle (j)" type="number"
                          show={v => v ? `${v} jour(s)` : '—'} />
                      )}
                      </div>{/* end s6 */}
                    </>
                  )
                })()}

                {/* Note coach */}
                <div style={{ marginTop:'1.5rem', borderTop:'1px solid var(--border)', paddingTop:'1rem' }}>
                  <div style={{ fontSize:'.68rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'.1em',
                    color:'var(--text-muted)', marginBottom:'.75rem' }}>
                    Note coach
                  </div>
                  <div style={{ background: editMsg ? 'var(--surface)' : 'var(--surface-2)',
                    padding:'.875rem', borderRadius:12, marginBottom:'1.25rem',
                    border: editMsg ? '2px solid var(--primary)' : '1px solid var(--border)', cursor: editMsg ? 'default' : 'pointer' }}
                    onClick={() => !editMsg && setEditMsg(true)}>
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
              <div className="coach-tab-pane" style={{ padding:'1.5rem' }}>
                {!plan || !plan.plan_data ? (
                  <div style={{ textAlign:'center', padding:'4rem 2rem', color:'var(--text-muted)' }}>
                    <div style={{ fontSize:'2rem', marginBottom:'.75rem' }}>📋</div>
                    <p>Aucun plan actif. Génère-en un dans l'onglet Profil.</p>
                  </div>
                ) : (
                  <PlanView
                    plan={plan}
                    completions={completions}
                    coachWeekIdx={coachWeekIdx}
                    setCoachWeekIdx={setCoachWeekIdx}
                    currentWeekNum={currentWeekNum}
                    onSessionClick={(session, weekNum, sessionIdx, completion) =>
                      setOpenSession({session, weekNum, sessionIdx, completion})}
                    onDeleteSession={(weekIdx, sessionIdx, titre) =>
                      deleteSessionFromPlan(weekIdx, sessionIdx, titre)}
                    onRescheduleSession={(weekIdx, weekNum, sessionIdx, newDay) =>
                      rescheduleSession(weekIdx, weekNum, sessionIdx, newDay)}
                    objective={local.objective}
                  />
                )}
              </div>
            )}


            {/* ══════════ RETOURS ══════════ */}
            {tab === 'retours' && (() => {
              const DAY_ORDER = { Lundi:1, Mardi:2, Mercredi:3, Jeudi:4, Vendredi:5, Samedi:6, Dimanche:7 }
              const rpeColor = (rpe) => !rpe ? 'var(--text-muted)' : rpe >= 8 ? '#EF4444' : rpe >= 6 ? '#F59E0B' : '#10B981'
              const rpeBg    = (rpe) => !rpe ? 'transparent' : rpe >= 8 ? 'rgba(239,68,68,.12)' : rpe >= 6 ? 'rgba(245,158,11,.12)' : 'rgba(16,185,129,.12)'

              const allWeeks  = plan?.plan_data?.semaines || []
              const activeWk  = retourWeek ?? currentWeekNum
              const sem       = allWeeks.find(s => s.numero === activeWk)
              const seances   = [...(sem?.seances || [])].map((s, si) => ({ ...s, _si: si }))
                .sort((a, b) => (DAY_ORDER[a.jour] || 8) - (DAY_ORDER[b.jour] || 8))
              const weekComps = planComps.filter(c => c.week_number === activeWk)
              const weekRpe   = rpeAvg(weekComps)

              return (
                <div className="coach-tab-pane" style={{ maxWidth:720, margin:'0 auto', padding:'1.5rem' }}>
                  <style>{`
                    @media (max-width: 767px) {
                      .retour-grid-outer { overflow: visible !important; }
                      .retour-grid { display: flex !important; flex-direction: column !important; min-width: unset !important; gap: .75rem !important; }
                      .retour-day-header { display: none !important; }
                      .retour-day-empty { display: none !important; }
                      .retour-day-col { gap: .5rem !important; }
                      .retour-day-col::before { content: attr(data-day); display: block; font-size: .72rem; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; color: rgba(255,255,255,.35); padding-bottom: .4rem; border-bottom: 1px solid rgba(255,255,255,.06); margin-bottom: .15rem; }
                    }
                  `}</style>

                  {/* ── Stat cards ── */}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'.75rem', marginBottom:'1.5rem' }}>
                    <div className="stat-card stat-card--accent">
                      <div className="stat-value">{planComps.length}</div>
                      <div className="stat-label">Séances réalisées</div>
                    </div>
                    <div className="stat-card stat-card--dark" style={{ border: avgRpeMois !== '—' ? `1px solid ${rpeColor(+avgRpeMois)}44` : undefined }}>
                      <div className="stat-value" style={{ color: avgRpeMois !== '—' ? rpeColor(+avgRpeMois) : undefined }}>{avgRpeMois}</div>
                      <div className="stat-label">RPE moyen — {moisLabel}</div>
                    </div>
                    <div className="stat-card" style={{ border: avgRpeWeek !== '—' ? `1px solid ${rpeColor(+avgRpeWeek)}44` : '1px solid var(--border)', background:'var(--surface-2)' }}>
                      <div className="stat-value" style={avgRpeWeek !== '—' ? { color:rpeColor(+avgRpeWeek) } : { background:'var(--gradient)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                        {avgRpeWeek}
                      </div>
                      <div className="stat-label">RPE semaine {currentWeekNum}</div>
                    </div>
                  </div>

                  {/* ── Onglets semaine ── */}
                  {allWeeks.length > 0 && (
                    <div style={{ display:'flex', gap:'.35rem', flexWrap:'wrap', marginBottom:'1rem' }}>
                      {allWeeks.map(w => {
                        const wComps    = planComps.filter(c => c.week_number === w.numero)
                        const hasDone   = wComps.length > 0
                        const isActive  = activeWk === w.numero
                        const isCurrent = w.numero === currentWeekNum
                        return (
                          <button key={w.numero} onClick={() => setRetourWeek(w.numero)} style={{
                            padding:'.38rem .8rem', borderRadius:10, fontWeight:700, fontSize:'.8rem',
                            cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap',
                            border:`1px solid ${isActive ? 'var(--primary)' : hasDone ? 'rgba(16,185,129,.25)' : 'rgba(255,255,255,.08)'}`,
                            background: isActive ? 'rgba(139,47,201,.2)' : hasDone ? 'rgba(16,185,129,.06)' : 'transparent',
                            color: isActive ? '#C084FC' : hasDone ? '#6EE7B7' : 'rgba(255,255,255,.32)',
                          }}>
                            S{w.numero}{isCurrent ? ' ●' : ''}{hasDone ? ` · ${wComps.length}` : ''}
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {/* ── En-tête semaine sélectionnée ── */}
                  {sem && (
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                      marginBottom:'1rem', padding:'.5rem .875rem',
                      background: activeWk === currentWeekNum ? 'rgba(139,47,201,.08)' : 'rgba(255,255,255,.03)',
                      borderRadius:10,
                      border:`1px solid ${activeWk === currentWeekNum ? 'rgba(139,47,201,.25)' : 'rgba(255,255,255,.07)'}` }}>
                      <div>
                        <span style={{ fontWeight:700, fontSize:'.85rem',
                          color: activeWk === currentWeekNum ? '#C084FC' : '#fff' }}>
                          Semaine {activeWk}{activeWk === currentWeekNum ? ' · EN COURS' : ''}
                        </span>
                        <span style={{ fontSize:'.7rem', color:'rgba(255,255,255,.38)', marginLeft:'.5rem' }}>
                          {getWeekRange(activeWk)}
                        </span>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
                        <span style={{ fontSize:'.72rem', fontWeight:600, color:'rgba(255,255,255,.5)' }}>
                          {weekComps.length}/{seances.length} effectuées
                        </span>
                        {weekRpe !== '—' && (
                          <span style={{ fontSize:'.8rem', fontWeight:900, color:rpeColor(+weekRpe),
                            background:rpeBg(+weekRpe), borderRadius:99, padding:'.18rem .6rem',
                            border:`1px solid ${rpeColor(+weekRpe)}40` }}>
                            RPE {weekRpe}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── Grille séances (style plan) ── */}
                  {seances.length === 0 ? (
                    <div style={{ textAlign:'center', padding:'2.5rem', color:'var(--text-muted)', fontStyle:'italic' }}>
                      {allWeeks.length === 0 ? 'Aucun retour de séance pour ce plan.' : 'Aucune séance planifiée cette semaine.'}
                    </div>
                  ) : (() => {
                    const DAY_SHORT_R = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']
                    const DAY_NAMES_R = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche']
                    const byDayR = {}
                    DAY_NAMES_R.forEach(d => { byDayR[d] = [] })
                    seances.forEach(s => { if (byDayR[s.jour]) byDayR[s.jour].push(s) })
                    return (
                      <div className="retour-grid-outer" style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
                      <div className="retour-grid" style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'.45rem', minWidth:560 }}>
                        {/* En-têtes jours */}
                        {DAY_SHORT_R.map(d => (
                          <div key={d} className="retour-day-header" style={{ textAlign:'center', fontSize:'.62rem', fontWeight:800,
                            textTransform:'uppercase', letterSpacing:'.07em',
                            color:'rgba(255,255,255,.35)', paddingBottom:'.4rem',
                            borderBottom:'1px solid rgba(255,255,255,.06)', marginBottom:'.15rem' }}>{d}</div>
                        ))}
                        {/* Colonnes */}
                        {DAY_NAMES_R.map(day => {
                          const daySessions = byDayR[day]
                          return (
                            <div key={day} data-day={day} className={`retour-day-col${daySessions.length === 0 ? ' retour-day-empty' : ''}`} style={{ display:'flex', flexDirection:'column', gap:'.45rem' }}>
                              {daySessions.length === 0 ? (
                                <div style={{ minHeight:110, display:'flex', alignItems:'center', justifyContent:'center',
                                  border:'1px dashed rgba(255,255,255,.05)', borderRadius:10,
                                  fontSize:'.58rem', color:'rgba(255,255,255,.1)', fontStyle:'italic' }}>
                                  —
                                </div>
                              ) : daySessions.map(session => {
                                const comp  = weekComps.find(c => c.session_index === session._si)
                                const done  = !!comp
                                const clr   = getSessionColor(session.type)
                                const rc    = done ? rpeColor(comp.rpe) : null
                                return (
                                  <div key={session._si}
                                    onClick={() => {
                                      if (!done) return
                                      setOpenRetour({ c: comp, session, color: clr, rpe: comp.rpe, rpeColor: rc, rawComment: comp.comment || '' })
                                    }}
                                    style={{
                                      minHeight:110, borderRadius:10, overflow:'hidden',
                                      cursor: done ? 'pointer' : 'default',
                                      background: done ? `${clr}1a` : 'rgba(255,255,255,.025)',
                                      border: done ? `1px solid ${clr}50` : '1px solid rgba(255,255,255,.06)',
                                      borderTop: `3px solid ${done ? clr : 'rgba(255,255,255,.07)'}`,
                                      display:'flex', flexDirection:'column',
                                      transition: done ? 'transform .1s, box-shadow .1s' : 'none',
                                      opacity: done ? 1 : 0.4,
                                    }}
                                    onMouseEnter={e => { if (done) { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 6px 20px ${clr}25` } }}
                                    onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='' }}>
                                    {/* Contenu */}
                                    <div style={{ padding:'.5rem .55rem', flex:1, overflow:'hidden' }}>
                                      <div style={{ fontSize:'.58rem', fontWeight:800, textTransform:'uppercase',
                                        letterSpacing:'.04em', color: done ? clr : 'rgba(255,255,255,.25)',
                                        marginBottom:'.15rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                        {(session.type||'').split(' ')[0]}
                                      </div>
                                      <div style={{ fontSize:'.76rem', fontWeight:700, lineHeight:1.2,
                                        color: done ? '#fff' : 'rgba(255,255,255,.28)',
                                        overflow:'hidden', display:'-webkit-box',
                                        WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                                        {session.titre}
                                      </div>
                                    </div>
                                    {/* Pied de carte */}
                                    <div style={{ padding:'.3rem .55rem .45rem', display:'flex',
                                      alignItems:'center', justifyContent:'space-between',
                                      borderTop: done ? `1px solid ${clr}20` : '1px solid rgba(255,255,255,.04)' }}>
                                      {done ? (
                                        <>
                                          <span style={{ fontSize:'.7rem' }}>✅</span>
                                          {comp.rpe ? (
                                            <span style={{ fontSize:'.68rem', fontWeight:900,
                                              color: rc, background: rc ? `${rc}20` : 'transparent',
                                              borderRadius:99, padding:'.08rem .38rem' }}>
                                              {comp.rpe}/10
                                            </span>
                                          ) : <span />}
                                        </>
                                      ) : (
                                        <span style={{ fontSize:'.58rem', color:'rgba(255,255,255,.18)', fontStyle:'italic', width:'100%', textAlign:'center' }}>Non effectuée</span>
                                      )}
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
                </div>
              )
            })()}

            {/* ══════════ BILANS HEBDO ══════════ */}
            {tab === 'bilans' && (
              <div className="coach-tab-pane" style={{ maxWidth:720, margin:'0 auto', padding:'1.5rem' }}>
                {!bilansLoaded ? (
                  <div style={{ textAlign:'center', padding:'3rem', color:'var(--text-muted)' }}>Chargement...</div>
                ) : bilansError ? (
                  <div style={{ background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.25)', borderRadius:12, padding:'1.25rem 1.5rem' }}>
                    <div style={{ fontWeight:700, color:'#FCA5A5', marginBottom:'.5rem' }}>Table manquante en base de données</div>
                    <div style={{ fontSize:'.84rem', color:'rgba(255,255,255,.7)', lineHeight:1.6, marginBottom:'1rem' }}>
                      La table <code style={{ background:'rgba(255,255,255,.08)', borderRadius:4, padding:'1px 5px', fontFamily:'monospace' }}>weekly_bilans</code> n'existe pas encore dans Supabase. Execute le SQL ci-dessous dans le <strong>SQL Editor</strong> de ton dashboard Supabase pour la créer, puis recharge cette page.
                    </div>
                    <pre style={{ background:'rgba(0,0,0,.4)', border:'1px solid rgba(255,255,255,.08)', borderRadius:8, padding:'1rem', fontSize:'.75rem', color:'#A5F3FC', overflowX:'auto', lineHeight:1.7, margin:0 }}>{`CREATE TABLE IF NOT EXISTS public.weekly_bilans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_id uuid NOT NULL,
  week_number integer NOT NULL,
  submitted_at timestamptz DEFAULT now(),
  overall_rating integer,
  fatigue_level integer,
  motivation_level integer,
  sleep_quality integer,
  pain_areas text,
  what_went_well text,
  what_was_hard text,
  wishes_next_week text,
  coach_message text,
  coach_response text,
  coach_responded_at timestamptz,
  UNIQUE (user_id, plan_id, week_number)
);
ALTER TABLE public.weekly_bilans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Athletes insert own" ON public.weekly_bilans
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Athletes read own" ON public.weekly_bilans
  FOR SELECT USING (auth.uid() = user_id);`}</pre>
                    <button onClick={() => { setBilansLoaded(false); setBilansError(null); loadBilans() }}
                      style={{ marginTop:'.875rem', background:'rgba(239,68,68,.15)', border:'1px solid rgba(239,68,68,.3)', borderRadius:8, padding:'.45rem 1rem', color:'#FCA5A5', fontSize:'.82rem', fontWeight:700, cursor:'pointer' }}>
                      Réessayer
                    </button>
                  </div>
                ) : bilans.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'3rem', color:'var(--text-muted)', fontSize:'.88rem' }}>
                    Aucun bilan soumis pour cet athlète.
                  </div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
                    {bilans.map(b => {
                      const responded = !!b.coach_response
                      return (
                        <div key={b.id} style={{
                          background:'var(--surface)', border:`1px solid ${responded ? 'rgba(16,185,129,.25)' : 'rgba(139,47,201,.25)'}`,
                          borderRadius:14, overflow:'hidden',
                        }}>
                          {/* Header bilan */}
                          <div style={{
                            background: responded ? 'rgba(16,185,129,.07)' : 'rgba(139,47,201,.07)',
                            padding:'.875rem 1rem',
                            display:'flex', justifyContent:'space-between', alignItems:'center', gap:'.75rem',
                            borderBottom:'1px solid rgba(255,255,255,.06)',
                          }}>
                            <div>
                              <div style={{ fontWeight:800, fontSize:'.92rem', color:'#fff' }}>
                                Semaine {b.week_number}
                                {responded && <span style={{ marginLeft:'.5rem', fontSize:'.7rem', color:'#6EE7B7', fontWeight:700, background:'rgba(16,185,129,.12)', borderRadius:99, padding:'.1rem .4rem' }}>Répondu</span>}
                              </div>
                              <div style={{ fontSize:'.7rem', color:'var(--text-muted)', marginTop:'.15rem' }}>
                                {new Date(b.submitted_at).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                              </div>
                            </div>
                            {/* Scores */}
                            <div style={{ display:'flex', gap:'.5rem', flexWrap:'wrap', justifyContent:'flex-end' }}>
                              {b.overall_rating != null && (
                                <span style={{ fontSize:'.72rem', fontWeight:700, background:'rgba(139,47,201,.12)', border:'1px solid rgba(139,47,201,.25)', borderRadius:99, padding:'.2rem .55rem', color:'#C084FC' }}>
                                  Note {b.overall_rating}/10
                                </span>
                              )}
                              {b.fatigue_level != null && (
                                <span style={{ fontSize:'.72rem', fontWeight:700, background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', borderRadius:99, padding:'.2rem .55rem', color:'#FCA5A5' }}>
                                  Fatigue {b.fatigue_level}/10
                                </span>
                              )}
                              {b.motivation_level != null && (
                                <span style={{ fontSize:'.72rem', fontWeight:700, background:'rgba(16,185,129,.08)', border:'1px solid rgba(16,185,129,.2)', borderRadius:99, padding:'.2rem .55rem', color:'#6EE7B7' }}>
                                  Motiv. {b.motivation_level}/10
                                </span>
                              )}
                              {b.sleep_quality != null && (
                                <span style={{ fontSize:'.72rem', fontWeight:700, background:'rgba(245,158,11,.08)', border:'1px solid rgba(245,158,11,.2)', borderRadius:99, padding:'.2rem .55rem', color:'#FCD34D' }}>
                                  Sommeil {'⭐'.repeat(b.sleep_quality)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Contenu texte */}
                          <div style={{ padding:'1rem', display:'flex', flexDirection:'column', gap:'.75rem' }}>
                            {b.pain_areas && (
                              <div>
                                <div style={{ fontSize:'.65rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'#FCA5A5', marginBottom:'.25rem' }}>Douleurs/gênes</div>
                                <p style={{ fontSize:'.84rem', color:'rgba(255,255,255,.8)', margin:0, lineHeight:1.6 }}>{b.pain_areas}</p>
                              </div>
                            )}
                            {b.what_went_well && (
                              <div>
                                <div style={{ fontSize:'.65rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'#6EE7B7', marginBottom:'.25rem' }}>Ce qui s'est bien passé</div>
                                <p style={{ fontSize:'.84rem', color:'rgba(255,255,255,.8)', margin:0, lineHeight:1.6 }}>{b.what_went_well}</p>
                              </div>
                            )}
                            {b.what_was_hard && (
                              <div>
                                <div style={{ fontSize:'.65rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'#FCD34D', marginBottom:'.25rem' }}>Ce qui a été difficile</div>
                                <p style={{ fontSize:'.84rem', color:'rgba(255,255,255,.8)', margin:0, lineHeight:1.6 }}>{b.what_was_hard}</p>
                              </div>
                            )}
                            {b.wishes_next_week && (
                              <div>
                                <div style={{ fontSize:'.65rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'#93C5FD', marginBottom:'.25rem' }}>Souhaits semaine prochaine</div>
                                <p style={{ fontSize:'.84rem', color:'rgba(255,255,255,.8)', margin:0, lineHeight:1.6 }}>{b.wishes_next_week}</p>
                              </div>
                            )}
                            {b.coach_message && (
                              <div>
                                <div style={{ fontSize:'.65rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'#C084FC', marginBottom:'.25rem' }}>Message au coach</div>
                                <p style={{ fontSize:'.84rem', color:'rgba(255,255,255,.8)', margin:0, lineHeight:1.6 }}>{b.coach_message}</p>
                              </div>
                            )}

                            {/* Réponse coach existante */}
                            {b.coach_response && (
                              <div style={{ background:'rgba(16,185,129,.07)', border:'1px solid rgba(16,185,129,.2)', borderRadius:10, padding:'.75rem' }}>
                                <div style={{ fontSize:'.65rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'#6EE7B7', marginBottom:'.25rem' }}>
                                  Ta réponse · {new Date(b.coach_responded_at).toLocaleDateString('fr-FR', { day:'numeric', month:'short' })}
                                </div>
                                <p style={{ fontSize:'.84rem', color:'rgba(255,255,255,.82)', margin:0, lineHeight:1.6 }}>{b.coach_response}</p>
                              </div>
                            )}

                            {/* Zone de réponse coach */}
                            <div>
                              <div style={{ fontSize:'.65rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'rgba(255,255,255,.3)', marginBottom:'.4rem' }}>
                                {b.coach_response ? 'Modifier ta réponse' : 'Répondre à cet athlète'}
                              </div>
                              <textarea
                                value={bilanResponses[b.id] ?? ''}
                                onChange={e => setBilanResponses(r => ({ ...r, [b.id]: e.target.value }))}
                                placeholder="Écris ta réponse personnalisée..."
                                rows={3}
                                style={{
                                  width:'100%', background:'rgba(255,255,255,.04)',
                                  border:'1px solid rgba(139,47,201,.25)', borderRadius:10,
                                  padding:'.6rem .75rem', color:'#fff', fontSize:'.84rem',
                                  fontFamily:'inherit', resize:'vertical', outline:'none', boxSizing:'border-box',
                                }}
                              />
                              <button
                                onClick={() => submitBilanResponse(b.id)}
                                disabled={bilanSaving[b.id] || !bilanResponses[b.id]?.trim()}
                                style={{
                                  marginTop:'.5rem', padding:'.5rem 1.25rem',
                                  background: bilanSaving[b.id] ? 'rgba(139,47,201,.3)' : 'linear-gradient(135deg,#8B2FC9,#E8237A)',
                                  border:'none', borderRadius:9, color:'#fff', fontWeight:700,
                                  fontSize:'.82rem', cursor: bilanSaving[b.id] || !bilanResponses[b.id]?.trim() ? 'not-allowed' : 'pointer',
                                  fontFamily:'inherit', opacity: !bilanResponses[b.id]?.trim() ? 0.5 : 1,
                                }}
                              >
                                {bilanSaving[b.id] ? 'Envoi...' : 'Envoyer la réponse'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ══════════ ALERTES ══════════ */}
            {tab === 'alertes' && (
              <div className="coach-tab-pane" style={{ maxWidth:700, margin:'0 auto', padding:'1.5rem' }}>
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

      {/* ── Modal détail retour athlète ────────────────────── */}
      {openRetour && (() => {
        const { c, session, color, rpe, rawComment } = openRetour
        const parsed = parseRetourComment(rawComment)
        const RESSENTI_LABELS = { facile:'Facile 😊', tres_bien:'Très bien 😄', bien:'Bien 😊', moyen:'Moyen 😐', difficile:'Difficile 😐', trop_difficile:'Chargé 😓', pas_termine:"N'a pas terminé 😟" }
        const rc = !rpe ? '#10B981' : rpe >= 8 ? '#EF4444' : rpe >= 6 ? '#F59E0B' : '#10B981'

        // ── helpers pour le visuel "Prévu" (copié de Plan.jsx) ──
        const sType    = (session?.type || '').toLowerCase()
        const isNonRun = sType.includes('natation') || sType.includes('vélo') || sType.includes('velo') || sType.includes('brique')
        const alluresOk = (session?.allures || []).filter(a => a?.allure_min_km && typeof a.allure_min_km === 'string')
        const efPace      = isNonRun ? null : (alluresOk[0] || null)
        const coolPace    = isNonRun ? null : (alluresOk.find(a => /retour|calme|récup/i.test(a.zone||'')) || efPace)
        const spePace     = alluresOk.length > 1
          ? (alluresOk.find(a => /corps|principal/i.test(a.zone||'')) || alluresOk.reduce((b,a) => (a.pourcentage_vma||0) > (b.pourcentage_vma||0) ? a : b, alluresOk[0]))
          : efPace

        const PChip = ({ allure, chipColor }) => {
          if (!allure?.allure_min_km) return null
          const pace = allure.allure_min_km.replace(/"/g,'').replace(/\/km$/i,'')
          return (
            <span style={{ background: chipColor ? chipColor+'1a' : 'rgba(255,255,255,.08)',
              border:`1px solid ${chipColor ? chipColor+'35' : 'rgba(255,255,255,.14)'}`,
              borderRadius:99, padding:'.14rem .5rem', fontSize:'.68rem', fontWeight:700,
              color: chipColor || 'rgba(255,255,255,.7)', whiteSpace:'nowrap', flexShrink:0 }}>
              {pace}<span style={{ opacity:.55, fontWeight:400 }}>/km</span>
            </span>
          )
        }
        const PArrow = () => (
          <div style={{ display:'flex', alignItems:'center', padding:'0 .75rem', height:20 }}>
            <div style={{ width:1, height:'100%', background:'rgba(255,255,255,.1)', margin:'0 auto' }} />
          </div>
        )
        const MiniCorps = () => {
          const mainSet = session?.corps || ''
          if (!mainSet) return null

          // EF
          if (sType.includes('endurance fondamentale') || sType === 'ef') {
            const pMin = alluresOk.find(a => (a.pourcentage_vma||0) <= 66) || alluresOk[0]
            const pMax = alluresOk.find(a => (a.pourcentage_vma||0) >= 70 && a !== pMin) || null
            return (
              <div style={{ textAlign:'center', padding:'.5rem 0' }}>
                <div style={{ fontSize:'2.4rem', fontWeight:900, lineHeight:1, color:'#fff' }}>{session.duree_min}</div>
                <div style={{ fontSize:'.72rem', color:'rgba(255,255,255,.35)', marginBottom:'1rem', marginTop:'.15rem' }}>minutes</div>
                <div style={{ display:'inline-flex', alignItems:'center', gap:'.4rem',
                  background:color+'14', borderRadius:99, padding:'.4rem .875rem', border:`1px solid ${color}30`, marginBottom:'.75rem' }}>
                  {pMin && <span style={{ fontSize:'.9rem', fontWeight:700, color }}>{pMin.allure_min_km}</span>}
                  {pMax && <><span style={{ color:'rgba(255,255,255,.3)', fontSize:'.72rem' }}>à</span>
                    <span style={{ fontSize:'.9rem', fontWeight:700, color }}>{pMax.allure_min_km}</span></>}
                  <span style={{ fontSize:'.65rem', color:'rgba(255,255,255,.35)' }}>/km</span>
                </div>
                <div style={{ fontSize:'.7rem', color:'rgba(255,255,255,.32)', fontStyle:'italic' }}>65 à 72% VMA · allure au ressenti</div>
              </div>
            )
          }

          // BLOC / bullet
          const hasBloc = /^BLOC\b/im.test(mainSet)
          const hasBullet = mainSet.includes('•')
          if (hasBloc || hasBullet) {
            const lines = mainSet.split('\n')
            const nodes = []
            for (let i = 0; i < lines.length; i++) {
              const trimmed = lines[i].trim()
              if (!trimmed) continue
              if (/^BLOC\b/i.test(trimmed)) {
                nodes.push(
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:'.5rem', margin: nodes.length > 0 ? '.75rem 0 0' : '0' }}>
                    <div style={{ flex:1, height:1, background:`${color}35` }} />
                    <span style={{ fontSize:'.62rem', fontWeight:800, letterSpacing:'.1em', flexShrink:0,
                      color, textTransform:'uppercase', padding:'.18rem .65rem',
                      background:`${color}18`, borderRadius:99, border:`1px solid ${color}35` }}>{trimmed}</span>
                    <div style={{ flex:1, height:1, background:`${color}35` }} />
                  </div>
                )
                continue
              }
              if (trimmed.startsWith('•')) {
                const content = trimmed.slice(1).trim()
                const isRecov = /r[eé]cup|marche|trot|repos|footing.*lent|lent.*footing/i.test(content)
                if (isRecov) {
                  nodes.push(
                    <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'.4rem', padding:'.15rem 0' }}>
                      <span style={{ fontSize:'.68rem', color:'#38BDF8' }}>⏸</span>
                      <span style={{ fontSize:'.72rem', color:'rgba(255,255,255,.38)', fontStyle:'italic' }}>{content}</span>
                    </div>
                  )
                } else {
                  const mMatch = content.match(/^(\d+\s*[×x]\s*\d+(?:[.,]\d+)?\s*(?:m\b|km\b|min\b)|\d+(?:[.,]\d+)?\s*(?:m\b|km\b|min\b))\s+/i)
                  const metric = mMatch ? mMatch[1].trim() : null
                  const rest   = mMatch ? content.slice(mMatch[0].length) : content
                  nodes.push(
                    <div key={i} style={{ background:`${color}0D`, border:`1px solid ${color}2A`, borderRadius:12, padding:'.75rem .875rem' }}>
                      {metric && <div style={{ fontSize:'1.3rem', fontWeight:900, color:'#fff', lineHeight:1, marginBottom:'.25rem' }}>{metric}</div>}
                      <div style={{ fontSize:'.78rem', lineHeight:1.55, color:'rgba(255,255,255,.72)' }}>{metric ? rest : content}</div>
                    </div>
                  )
                }
                continue
              }
              nodes.push(
                <div key={i} style={{ padding:'.5rem .75rem', marginTop:'.25rem',
                  background:'rgba(14,165,233,.06)', border:'1px solid rgba(14,165,233,.14)', borderRadius:8 }}>
                  <p style={{ fontSize:'.74rem', lineHeight:1.5, color:'rgba(255,255,255,.5)', margin:0, fontStyle:'italic' }}>{trimmed}</p>
                </div>
              )
            }
            return <div style={{ display:'flex', flexDirection:'column', gap:'.5rem' }}>{nodes}</div>
          }

          // Défaut : durée + allures
          if (session?.duree_min > 0) {
            const sorted = [...alluresOk.filter(a => !/retour|calme|échauff/i.test(a.zone||''))].sort((a,b) => (a.vitesse_kmh||0)-(b.vitesse_kmh||0))
            const pMin2 = sorted[0] || null
            const pMax2 = sorted.length > 1 ? sorted[sorted.length-1] : null
            const isProgressif = sType.includes('progressif')
            return (
              <div style={{ textAlign:'center', padding:'.5rem 0' }}>
                <div style={{ fontSize:'2.4rem', fontWeight:900, lineHeight:1, color:'#fff' }}>{session.duree_min}</div>
                <div style={{ fontSize:'.72rem', color:'rgba(255,255,255,.35)', marginBottom:'1rem', marginTop:'.15rem' }}>minutes</div>
                {(pMin2||pMax2) && (
                  <div style={{ display:'inline-flex', alignItems:'center', gap:'.4rem',
                    background:color+'14', borderRadius:99, padding:'.4rem .875rem',
                    border:`1px solid ${color}30`, marginBottom:'.625rem' }}>
                    {pMin2 && <span style={{ fontSize:'.9rem', fontWeight:700, color }}>{pMin2.allure_min_km}</span>}
                    {pMax2 && <><span style={{ color:'rgba(255,255,255,.3)', fontSize:'.72rem' }}>à</span>
                      <span style={{ fontSize:'.9rem', fontWeight:700, color }}>{pMax2.allure_min_km}</span></>}
                    <span style={{ fontSize:'.65rem', color:'rgba(255,255,255,.35)' }}>/km</span>
                  </div>
                )}
                {pMin2 && (
                  <div style={{ fontSize:'.7rem', color:'rgba(255,255,255,.32)', fontStyle:'italic' }}>
                    {isProgressif && pMax2
                      ? `${pMin2.pourcentage_vma}% → ${pMax2.pourcentage_vma}% VMA`
                      : pMax2 ? `${pMin2.pourcentage_vma}–${pMax2.pourcentage_vma}% VMA`
                      : `${pMin2.pourcentage_vma}% VMA`}
                  </div>
                )}
                {mainSet && mainSet.length > 40 && (
                  <div style={{ marginTop:'.875rem', fontSize:'.78rem', lineHeight:1.7,
                    color:'rgba(255,255,255,.65)', textAlign:'left', whiteSpace:'pre-line',
                    borderTop:`1px solid ${color}20`, paddingTop:'.75rem' }}>{mainSet}</div>
                )}
              </div>
            )
          }

          return <p style={{ fontSize:'.82rem', lineHeight:1.65, color:'rgba(255,255,255,.75)', whiteSpace:'pre-line' }}>{mainSet}</p>
        }

        return (
          <div style={{ position:'fixed', inset:0, zIndex:400, background:'rgba(0,0,0,.78)', backdropFilter:'blur(8px)',
            display:'flex', alignItems:'center', justifyContent:'center', padding:'1.25rem' }}
            onClick={() => setOpenRetour(null)}>
            <style>{`.retour-panel-grid { display:grid; grid-template-columns:1fr 1fr; } @media (max-width:767px) { .retour-panel-grid { grid-template-columns:1fr !important; } }`}</style>
            <div style={{ width:'100%', maxWidth:680, background:'#12121E', borderRadius:22,
              border:`1px solid ${color}35`, boxShadow:`0 30px 80px rgba(0,0,0,.7), 0 0 0 1px ${color}12`,
              overflow:'hidden', maxHeight:'92vh', overflowY:'auto' }}
              onClick={e => e.stopPropagation()}>

              {/* ── Header ── */}
              <div style={{ background:`linear-gradient(135deg, ${color}28 0%, rgba(18,18,30,1) 65%)`,
                borderBottom:`1px solid ${color}22`, padding:'1.25rem 1.5rem',
                display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <span style={{ fontSize:'.65rem', fontWeight:900, textTransform:'uppercase',
                    letterSpacing:'.1em', color, background:`${color}22`,
                    border:`1px solid ${color}45`, borderRadius:99, padding:'.2rem .75rem' }}>
                    {session?.type || 'Séance'}
                  </span>
                  <h3 style={{ margin:'.5rem 0 .25rem', fontSize:'1.05rem', fontWeight:800, lineHeight:1.25, color:'#fff' }}>
                    {session?.titre || `Séance ${c.session_index + 1}`}
                  </h3>
                  <div style={{ fontSize:'.72rem', color:'rgba(255,255,255,.42)', fontWeight:500 }}>
                    {new Date(c.completed_at).toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
                  </div>
                </div>
                <button onClick={() => setOpenRetour(null)}
                  style={{ background:`${color}18`, border:`1px solid ${color}35`, borderRadius:10,
                    padding:'.35rem .7rem', cursor:'pointer', color:'rgba(255,255,255,.7)',
                    fontFamily:'inherit', fontSize:'.8rem', fontWeight:700 }}>✕</button>
              </div>

              {/* ── Deux panneaux côte à côte ── */}
              <div className="retour-panel-grid" style={{ minHeight:200 }}>

                {/* PRÉVU — rendu identique à la vue athlète */}
                <div style={{ borderRight:'1px solid rgba(255,255,255,.06)', overflowY:'auto' }}>
                  <div style={{ fontSize:'.6rem', fontWeight:900, textTransform:'uppercase',
                    letterSpacing:'.12em', color, padding:'1rem 1rem .5rem',
                    display:'flex', alignItems:'center', gap:'.4rem' }}>
                    📋 Prévu
                  </div>

                  {/* Stats chips */}
                  {(session?.duree_min > 0 || session?.rpe_cible || session?.distance_km) && (
                    <div style={{ padding:'.375rem 1rem .625rem', display:'flex', gap:'.3rem', flexWrap:'wrap' }}>
                      {session?.duree_min > 0 && (
                        <span style={{ background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.1)',
                          borderRadius:99, padding:'.2rem .6rem', fontSize:'.7rem', fontWeight:600 }}>⏱ {session.duree_min} min</span>
                      )}
                      {session?.distance_km && (
                        <span style={{ background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.1)',
                          borderRadius:99, padding:'.2rem .6rem', fontSize:'.7rem', fontWeight:600 }}>📍 {session.distance_km} km</span>
                      )}
                      {session?.rpe_cible && (
                        <span style={{ background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.1)',
                          borderRadius:99, padding:'.2rem .6rem', fontSize:'.7rem', fontWeight:600 }}>💪 RPE {session.rpe_cible}</span>
                      )}
                    </div>
                  )}

                  {/* Carte séance — même structure que l'athlète */}
                  <div style={{ margin:'0 .75rem .75rem', background:'rgba(255,255,255,.03)',
                    borderRadius:14, overflow:'hidden', border:'1px solid rgba(255,255,255,.07)' }}>

                    {session?.echauffement && (
                      <div style={{ borderLeft:'3px solid #F59E0B', padding:'.875rem .875rem .875rem .75rem' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'.35rem' }}>
                          <span style={{ fontWeight:700, fontSize:'.62rem', color:'#FCD34D', letterSpacing:'.1em', textTransform:'uppercase' }}>🔥 Échauffement</span>
                          {!isNonRun && efPace && <PChip allure={efPace} />}
                        </div>
                        <p style={{ fontSize:'.78rem', lineHeight:1.6, color:'rgba(255,255,255,.72)', margin:0 }}>{session.echauffement}</p>
                      </div>
                    )}

                    {session?.echauffement && session?.corps && <PArrow />}

                    {session?.corps && (
                      <div style={{ borderLeft:`3px solid ${color}`, padding:'.875rem .875rem .875rem .75rem', background:`${color}07` }}>
                        {!(sType.includes('endurance fondamentale') || sType === 'ef' || sType.includes('sortie longue')) && (
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'.625rem' }}>
                            <span style={{ fontWeight:800, fontSize:'.62rem', color, letterSpacing:'.1em', textTransform:'uppercase' }}>⚡ Séance principale</span>
                            {!isNonRun && spePace && <PChip allure={spePace} chipColor={color} />}
                          </div>
                        )}
                        <MiniCorps />
                      </div>
                    )}

                    {session?.corps && session?.retour_au_calme && <PArrow />}

                    {session?.retour_au_calme && (
                      <div style={{ borderLeft:'3px solid #3B82F6', padding:'.875rem .875rem .875rem .75rem' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'.35rem' }}>
                          <span style={{ fontWeight:700, fontSize:'.62rem', color:'#93C5FD', letterSpacing:'.1em', textTransform:'uppercase' }}>❄️ Retour au calme</span>
                          {!isNonRun && coolPace && coolPace !== efPace && <PChip allure={coolPace} chipColor="#3B82F6" />}
                        </div>
                        <p style={{ fontSize:'.78rem', lineHeight:1.6, color:'rgba(255,255,255,.72)', margin:0 }}>{session.retour_au_calme}</p>
                      </div>
                    )}

                    {!session?.echauffement && !session?.corps && !session?.retour_au_calme && (
                      <div style={{ padding:'1.5rem', textAlign:'center', color:'rgba(255,255,255,.2)', fontStyle:'italic', fontSize:'.78rem' }}>—</div>
                    )}
                  </div>
                </div>

                {/* RÉALISÉ */}
                <div style={{ padding:'1.125rem 1.25rem', background: rpe ? `${rc}0a` : 'transparent' }}>
                  <div style={{ fontSize:'.62rem', fontWeight:900, textTransform:'uppercase',
                    letterSpacing:'.12em', color:rc, marginBottom:'1rem',
                    display:'flex', alignItems:'center', gap:'.5rem' }}>
                    <span>✅</span> Réalisé
                  </div>

                  {/* RPE + Ressenti */}
                  {rpe && (
                    <div style={{ marginBottom:'1rem', background:`${rc}1a`,
                      borderRadius:12, padding:'.75rem 1rem', border:`1px solid ${rc}35` }}>
                      <div style={{ display:'flex', alignItems:'baseline', gap:'.3rem', marginBottom:'.4rem' }}>
                        <span style={{ fontSize:'2.2rem', fontWeight:900, color:rc, lineHeight:1 }}>{rpe}</span>
                        <span style={{ fontSize:'.88rem', color:'rgba(255,255,255,.45)', fontWeight:700 }}>/10</span>
                        {parsed.ressenti && (
                          <span style={{ marginLeft:'auto', fontSize:'.82rem', fontWeight:800, color:'#fff' }}>
                            {RESSENTI_LABELS[parsed.ressenti] || parsed.ressenti}
                          </span>
                        )}
                      </div>
                      <div style={{ height:7, borderRadius:99, background:'rgba(255,255,255,.08)', overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${rpe*10}%`,
                          background:`linear-gradient(90deg, ${rc}99, ${rc})`, borderRadius:99 }} />
                      </div>
                    </div>
                  )}

                  {/* Blocs fractionné */}
                  {parsed.blocs?.length > 0 && (
                    <div style={{ marginBottom:'.75rem' }}>
                      <div style={{ fontSize:'.58rem', fontWeight:800, textTransform:'uppercase',
                        letterSpacing:'.08em', color:`${rc}cc`, marginBottom:'.5rem' }}>Chronos réalisés</div>
                      {(parsed.blocsData?.length > 0 ? parsed.blocsData : [{ label:'', items: parsed.blocs }]).map((bloc, bi) => (
                        <div key={bi} style={{ marginTop: bi > 0 ? '.6rem' : 0 }}>
                          {bloc.label && (
                            <div style={{ fontSize:'.62rem', fontWeight:800, color:`${rc}bb`,
                              textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'.25rem' }}>
                              {bloc.label}
                            </div>
                          )}
                          <div style={{ display:'flex', flexDirection:'column', gap:'.2rem' }}>
                            {bloc.items.map((b, i) => (
                              <div key={i} style={{ fontSize:'.8rem', fontWeight:700, color:'#fff',
                                background:'rgba(255,255,255,.06)', borderRadius:8, padding:'.28rem .65rem',
                                borderLeft:`2px solid ${rc}` }}>
                                {b}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Allure corps EF/footing */}
                  {parsed.corps && !parsed.blocs?.length && (
                    <div style={{ marginBottom:'.6rem' }}>
                      <div style={{ fontSize:'.58rem', fontWeight:800, textTransform:'uppercase',
                        letterSpacing:'.08em', color:`${rc}cc`, marginBottom:'.18rem' }}>Allure corps</div>
                      <div style={{ fontSize:'.9rem', fontWeight:900, color:'#fff' }}>{parsed.corps}</div>
                    </div>
                  )}

                  {/* FC */}
                  {(parsed.fcMoy || parsed.fcMax) && (
                    <div style={{ display:'flex', gap:'.5rem', marginBottom:'.6rem' }}>
                      {parsed.fcMoy && (
                        <div style={{ flex:1, background:'rgba(248,113,113,.12)',
                          border:'1px solid rgba(248,113,113,.28)', borderRadius:10,
                          padding:'.5rem .75rem', textAlign:'center' }}>
                          <div style={{ fontSize:'.55rem', fontWeight:800, textTransform:'uppercase',
                            color:'#FCA5A5', letterSpacing:'.07em', marginBottom:'.1rem' }}>FC moy</div>
                          <div style={{ fontSize:'1rem', fontWeight:900, color:'#FCA5A5' }}>{parsed.fcMoy}</div>
                        </div>
                      )}
                      {parsed.fcMax && (
                        <div style={{ flex:1, background:'rgba(239,68,68,.12)',
                          border:'1px solid rgba(239,68,68,.28)', borderRadius:10,
                          padding:'.5rem .75rem', textAlign:'center' }}>
                          <div style={{ fontSize:'.55rem', fontWeight:800, textTransform:'uppercase',
                            color:'#F87171', letterSpacing:'.07em', marginBottom:'.1rem' }}>FC max</div>
                          <div style={{ fontSize:'1rem', fontWeight:900, color:'#F87171' }}>{parsed.fcMax}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Commentaire libre */}
                  {parsed.text && (
                    <div style={{ paddingTop:'.6rem', borderTop:'1px solid rgba(255,255,255,.07)' }}>
                      <p style={{ fontSize:'.82rem', lineHeight:1.65, fontStyle:'italic',
                        color:'rgba(255,255,255,.7)', margin:0 }}>
                        &ldquo;{parsed.text}&rdquo;
                      </p>
                    </div>
                  )}

                  {!rpe && !parsed.blocs?.length && !parsed.corps && !parsed.fcMoy && !parsed.fcMax && !parsed.text && (
                    <div style={{ fontSize:'.78rem', color:'rgba(255,255,255,.22)', fontStyle:'italic' }}>—</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })()}

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
  const [filter,     setFilter]     = useState(() => sessionStorage.getItem('admin_athletes_filter') || 'all')
  const [search,     setSearch]     = useState(() => sessionStorage.getItem('admin_athletes_search') || '')
  const [selected,   setSelected]   = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [confirmDel, setConfirmDel] = useState(null)
  const [deleting,   setDeleting]   = useState(false)

  useEffect(() => { sessionStorage.setItem('admin_athletes_filter', filter) }, [filter])
  useEffect(() => { sessionStorage.setItem('admin_athletes_search', search) }, [search])
  useEffect(() => {
    if (selected?.id) sessionStorage.setItem('admin_athletes_selected', selected.id)
    else sessionStorage.removeItem('admin_athletes_selected')
  }, [selected?.id])

  useEffect(() => { loadAthletes() }, [])

  async function deleteAthlete(a) {
    setDeleting(true)
    try {
      await adminFetch(`/api/admin/athlete/${a.id}`, { method: 'DELETE' })
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
      const savedId = sessionStorage.getItem('admin_athletes_selected')
      if (savedId && data?.length) {
        const match = data.find(a => a.id === savedId)
        if (match) setSelected(match)
      }
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
                      <div className="chat-avatar" style={{ width:32, height:32, fontSize:'.8rem', overflow:'hidden', padding:0 }}>
                        {a.avatar_url
                          ? <img src={a.avatar_url} alt={a.first_name} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }} />
                          : a.first_name?.[0]?.toUpperCase()}
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
                  <td><span className={`badge ${a.subscription_status === 'active' ? 'badge-success' : 'badge-warning'}`}>{({ active: 'Actif', trialing: 'Essai', cancelling: 'Résiliation en cours', canceled: 'Annulé' }[a.subscription_status] || a.subscription_status || 'Inactif')}</span></td>
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
              <div className="chat-avatar" style={{ width:42, height:42, fontSize:'1rem', overflow:'hidden', padding:0 }}>
                {a.avatar_url
                  ? <img src={a.avatar_url} alt={a.first_name} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }} />
                  : a.first_name?.[0]?.toUpperCase()}
              </div>
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
