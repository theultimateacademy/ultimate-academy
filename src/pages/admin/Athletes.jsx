import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { OBJECTIVE_LABELS, LEVEL_LABELS, SESSION_TYPE_COLORS } from '../../lib/utils'
import { api } from '../../lib/api'
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
    const weekComps = completions.filter(c => c.week_number === activeSem.numero)
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
        <div className="coach-plan-desktop" style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'.35rem' }}>
          {/* Row 1 : en-têtes jours */}
          {DAY_SHORT.map(d => (
            <div key={d} style={{ textAlign:'center', fontSize:'.61rem', fontWeight:800, textTransform:'uppercase',
              letterSpacing:'.07em', color:'var(--text-muted)', paddingBottom:'.3rem',
              borderBottom:'1px solid var(--border)', marginBottom:'.15rem' }}>{d}</div>
          ))}
          {/* Row 2 : colonnes de séances */}
          {DAY_NAMES.map(day => {
            const daySessions = byDay[day]
            return (
              <div key={day} style={{ display:'flex', flexDirection:'column', gap:'.3rem' }}>
                {daySessions.length === 0 ? (
                  <div style={{ height:88, display:'flex', alignItems:'center', justifyContent:'center',
                    border:'1px dashed rgba(255,255,255,.07)', borderRadius:7,
                    fontSize:'.6rem', color:'rgba(255,255,255,.18)', fontStyle:'italic' }}>
                    Repos
                  </div>
                ) : daySessions.map(session => {
                  const si    = session._si
                  const clr   = SESSION_TYPE_COLORS[session.type] || '#10B981'
                  const comp  = weekComps.find(c => c.session_index === si)
                  const done  = !!comp
                  const isRace = session.est_course || (session.id_seance||'').startsWith('RACE')
                  const isRescheduling = rescheduleCell === si
                  return (
                    <div key={si} style={{ borderRadius:7, minWidth:0, position:'relative',
                      border: done ? '1px solid rgba(16,185,129,.35)' : '1px solid var(--border)',
                      borderLeft: `3px solid ${done?'#10B981':clr}`,
                      background: done ? 'rgba(16,185,129,.12)' : isRace ? clr+'18' : 'var(--surface-2)',
                      display:'flex', flexDirection:'column', overflow:'hidden' }}>
                      {/* Content cliquable */}
                      <div onClick={() => onSessionClick(session, activeSem.numero, si, comp)}
                        style={{ padding:'.42rem .45rem', cursor:'pointer', flex:1 }}>
                        <div style={{ fontSize:'.59rem', fontWeight:700, color:done?'#10B981':clr, marginBottom:'.1rem',
                          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{session.type || '—'}</div>
                        <div style={{ fontSize:'.71rem', fontWeight:700, lineHeight:1.2,
                          overflow:'hidden', textOverflow:'ellipsis',
                          display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{session.titre || '—'}</div>
                        <div style={{ fontSize:'.6rem', color:'var(--text-muted)', marginTop:'.1rem' }}>
                          {session.duree_min > 0 ? `${session.duree_min} min` : '—'}
                          {done && <span style={{ color:'#10B981', marginLeft:'.25rem' }}>✅</span>}
                        </div>
                      </div>
                      {/* Actions — TOUJOURS visibles en bas */}
                      <div style={{ display:'flex', borderTop:'1px solid rgba(255,255,255,.06)', flexShrink:0 }}>
                        {onRescheduleSession && (
                          <button
                            onClick={e => { e.stopPropagation(); setRescheduleCell(isRescheduling ? null : si) }}
                            style={{ flex:1, padding:'.18rem 0', background: isRescheduling ? 'rgba(139,47,201,.2)' : 'rgba(255,255,255,.04)',
                              border:'none', cursor:'pointer', fontSize:'.6rem',
                              color: isRescheduling ? '#C084FC' : 'rgba(255,255,255,.38)', fontFamily:'inherit' }}>
                            📅
                          </button>
                        )}
                        {onDeleteSession && (
                          <button onClick={e => { e.stopPropagation(); onDeleteSession(coachWeekIdx, si, session.titre) }}
                            style={{ flex:1, padding:'.18rem 0', background:'rgba(239,68,68,.08)',
                              border:'none', borderLeft: onRescheduleSession ? '1px solid rgba(255,255,255,.06)' : 'none',
                              cursor:'pointer', fontSize:'.6rem', color:'#FCA5A5', fontFamily:'inherit' }}>
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
                    const clr  = SESSION_TYPE_COLORS[session.type] || '#10B981'
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
  const [tab,           setTab]           = useState('profile')
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
  const [sessionSaving, setSessionSaving] = useState(false)
  const [openSession,   setOpenSession]   = useState(null)
  const [openRetour,    setOpenRetour]    = useState(null)
  const [coachWeekIdx, setCoachWeekIdx]  = useState(0)  // active week tab in plan view

  const currentWeekNum = getCurrentWeekNum(plan)

  // Auto-select current week when plan loads
  useEffect(() => {
    if (!plan?.plan_data?.semaines) return
    const idx = plan.plan_data.semaines.findIndex(s => s.numero === currentWeekNum)
    if (idx >= 0) setCoachWeekIdx(idx)
  }, [plan?.id])

  useEffect(() => { loadDetail() }, [])

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
      const res = await fetch('/api/plans/generate', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ userId: athlete.id, profile: local, clientDate: new Date().toISOString().split('T')[0] }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Erreur')
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
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/plans/${plan.id}/session`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekIdx, sessionIdx }),
      })
      const body = await res.json()
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
        <div className="chat-avatar" style={{ width:42, height:42, fontSize:'1.05rem', flexShrink:0 }}>
          {local.first_name?.[0]?.toUpperCase()}
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
        <div className="coach-panel-badges" style={{ display:'flex', gap:'.4rem', flexShrink:0, flexWrap:'wrap' }}>
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
                  const isTrail = ['trail_20k','trail_50k','trail_100k','trail_100m'].includes(local.objective)

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

                      <FieldRow field="vma" label="VMA (km/h)" type="number"
                        show={v => v ? `${v} km/h` : '—'} />

                      <FieldRow field="vma_known" label="VMA mesurée ?" type="select"
                        opts={[['true','Oui'],['false','Non']]}
                        show={v => v === true || v === 'true' ? 'Oui' : 'Non'} />

                      {(() => {
                        const LEVEL_VMA_DEFAULTS = { debutant: 10, intermediaire: 14, confirme: 17, expert: 20 }
                        const vmaKnown = local.vma_known === true || local.vma_known === 'true'
                        const resolvedVma = (vmaKnown && local.vma) ? parseFloat(local.vma) : (LEVEL_VMA_DEFAULTS[local.level] || 14)
                        return (
                          <div style={{ display:'flex', justifyContent:'flex-end', padding:'4px 0' }}>
                            <button
                              onClick={() => {
                                api.recalculateVma({ userId: athlete.id, newVma: resolvedVma })
                                  .then(r => showSaveToast(r?.skipped > 0
                                    ? `✓ Allures recalculées (VMA ${resolvedVma}) — ${r.skipped} séance(s) validée(s) préservée(s)`
                                    : `✓ Allures recalculées (VMA ${resolvedVma})`))
                                  .catch(e => showSaveToast('✗ ' + e.message, false))
                              }}
                              style={{ fontSize:'.75rem', padding:'3px 10px', borderRadius:6,
                                border:'1px solid #4A90D9', background:'#EBF4FF', color:'#1D4ED8',
                                cursor:'pointer', fontWeight:600 }}
                            >
                              Recalculer allures plan (VMA {resolvedVma})
                            </button>
                          </div>
                        )
                      })()}

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
                        <FieldRow field="tri_run_sessions" label="🏃 Course / sem." type="number"
                          show={v => v ? `${v} séance(s)` : '—'} />
                      </>)}

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
              <div className="coach-tab-pane" style={{ maxWidth:900, margin:'0 auto', padding:'1.5rem' }}>
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
            {tab === 'retours' && (
              <div className="coach-tab-pane" style={{ maxWidth:700, margin:'0 auto', padding:'1.5rem' }}>
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
                    const color   = SESSION_TYPE_COLORS[session?.type] || '#10B981'
                    // Parse comment: extraire [Tag: Valeur] et texte libre
                    const tagPattern = /\[([^\]:]+):\s*([^\]]+)\]/g
                    const tags = []
                    let rawComment = c.comment || ''
                    let m
                    while ((m = tagPattern.exec(rawComment)) !== null) tags.push({ k: m[1].trim(), v: m[2].trim() })
                    const freeText = rawComment.replace(/\[[^\]]+\]/g, '').trim()
                    return (
                      <div key={c.id}
                        onClick={() => setOpenRetour({ c, session, color, rpe, rpeColor, tags, freeText })}
                        style={{ background:'var(--surface-2)', borderRadius:12, overflow:'hidden',
                          border:'1px solid var(--border)', cursor:'pointer',
                          transition:'box-shadow .15s', display:'flex', gap:0 }}
                        onMouseEnter={e => e.currentTarget.style.boxShadow='var(--shadow)'}
                        onMouseLeave={e => e.currentTarget.style.boxShadow='none'}>
                        <div style={{ width:3, background: color, flexShrink:0 }} />
                        <div style={{ flex:1, padding:'.75rem .875rem', minWidth:0 }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'.5rem', marginBottom:'.3rem' }}>
                            <div style={{ fontWeight:700, fontSize:'.875rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                              {session?.titre || `Séance ${c.session_index + 1}`}
                            </div>
                            <div style={{ flexShrink:0, textAlign:'right' }}>
                              {rpe && <span style={{ fontWeight:800, fontSize:'1rem', color: rpeColor }}>{rpe}</span>}
                              {rpe && <span style={{ fontSize:'.7rem', color:'var(--text-muted)' }}>/10</span>}
                            </div>
                          </div>
                          <div style={{ fontSize:'.72rem', color:'var(--text-muted)', marginBottom: tags.length || freeText ? '.4rem' : 0 }}>
                            {new Date(c.completed_at).toLocaleDateString('fr-FR', { day:'numeric', month:'long' })}
                            {session ? ` · ${session.type}` : ''}
                          </div>
                          {/* Tags lisibles */}
                          {tags.length > 0 && (
                            <div style={{ display:'flex', flexWrap:'wrap', gap:'.25rem', marginBottom: freeText ? '.35rem' : 0 }}>
                              {tags.map((t, i) => (
                                <span key={i} style={{ fontSize:'.68rem', background:'rgba(255,255,255,.06)',
                                  border:'1px solid rgba(255,255,255,.1)', borderRadius:99,
                                  padding:'.12rem .5rem', color:'rgba(255,255,255,.65)' }}>
                                  {t.k} : <strong style={{ color:'#fff' }}>{t.v}</strong>
                                </span>
                              ))}
                            </div>
                          )}
                          {/* Commentaire libre */}
                          {freeText && (
                            <div style={{ fontSize:'.8rem', fontStyle:'italic', color:'rgba(255,255,255,.72)',
                              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                              &ldquo;{freeText}&rdquo;
                            </div>
                          )}
                        </div>
                        <div style={{ padding:'.75rem .625rem', display:'flex', alignItems:'center' }}>
                          <span style={{ color:'rgba(255,255,255,.2)', fontSize:'.8rem' }}>›</span>
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
        const { c, session, color, rpe, rpeColor, tags, freeText } = openRetour
        const RESSENTI_FR = { facile:'Facile 😊', difficile:'Normal 😐', trop_difficile:'Chargé 😓', pas_termine:'N\'a pas terminé 😟', tres_bien:'Très bien 😄', bien:'Bien 😊', moyen:'Moyen 😐' }
        return (
          <div style={{ position:'fixed', inset:0, zIndex:400, background:'rgba(0,0,0,.7)', backdropFilter:'blur(6px)',
            display:'flex', alignItems:'center', justifyContent:'center', padding:'1.5rem' }}
            onClick={() => setOpenRetour(null)}>
            <div style={{ width:'100%', maxWidth:520, background:'var(--surface)', borderRadius:20,
              border:'1px solid var(--border)', boxShadow:'0 24px 60px rgba(0,0,0,.6)',
              overflow:'hidden' }}
              onClick={e => e.stopPropagation()}>
              {/* Header coloré */}
              <div style={{ background:`linear-gradient(135deg, ${color}20, ${color}08)`,
                borderBottom:`1px solid ${color}30`, padding:'1.25rem 1.5rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <span style={{ fontSize:'.65rem', fontWeight:800, textTransform:'uppercase',
                      letterSpacing:'.08em', color, background:`${color}20`,
                      border:`1px solid ${color}35`, borderRadius:99, padding:'.18rem .65rem' }}>
                      {session?.type || 'Séance'}
                    </span>
                    <h3 style={{ marginTop:'.5rem', marginBottom:'.2rem', fontSize:'1rem', lineHeight:1.3 }}>
                      {session?.titre || `Séance ${c.session_index + 1}`}
                    </h3>
                    <div style={{ fontSize:'.75rem', color:'var(--text-muted)' }}>
                      {new Date(c.completed_at).toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
                    </div>
                  </div>
                  <button onClick={() => setOpenRetour(null)}
                    style={{ background:'none', border:'1px solid var(--border)', borderRadius:8,
                      padding:'.3rem .6rem', cursor:'pointer', color:'var(--text-muted)', fontFamily:'inherit' }}>✕</button>
                </div>
              </div>
              {/* Corps */}
              <div style={{ padding:'1.25rem 1.5rem', display:'flex', flexDirection:'column', gap:'1rem' }}>
                {/* RPE */}
                {rpe && (
                  <div style={{ display:'flex', alignItems:'center', gap:'1rem',
                    background:'var(--bg)', borderRadius:12, padding:'.875rem 1rem' }}>
                    <div>
                      <div style={{ fontSize:'.62rem', fontWeight:700, textTransform:'uppercase',
                        letterSpacing:'.08em', color:'var(--text-muted)', marginBottom:'.2rem' }}>Effort perçu</div>
                      <div style={{ display:'flex', alignItems:'baseline', gap:'.25rem' }}>
                        <span style={{ fontSize:'2.2rem', fontWeight:900, lineHeight:1, color: rpeColor }}>{rpe}</span>
                        <span style={{ fontSize:'.9rem', color:'var(--text-muted)' }}>/10</span>
                      </div>
                    </div>
                    {session && (
                      <div style={{ flex:1, borderLeft:'1px solid var(--border)', paddingLeft:'1rem' }}>
                        <div style={{ fontSize:'.62rem', fontWeight:700, textTransform:'uppercase',
                          letterSpacing:'.08em', color:'var(--text-muted)', marginBottom:'.2rem' }}>Séance prévue</div>
                        <div style={{ fontSize:'.82rem' }}>
                          {session.duree_min > 0 ? `${session.duree_min} min` : '—'}
                          {session.rpe_cible ? ` · RPE cible ${session.rpe_cible}/10` : ''}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {/* Tags */}
                {tags.length > 0 && (
                  <div style={{ background:'var(--bg)', borderRadius:12, padding:'.875rem 1rem' }}>
                    <div style={{ fontSize:'.62rem', fontWeight:700, textTransform:'uppercase',
                      letterSpacing:'.08em', color:'var(--text-muted)', marginBottom:'.625rem' }}>Retour de séance</div>
                    <div style={{ display:'flex', flexDirection:'column', gap:'.5rem' }}>
                      {tags.map((t, i) => {
                        const val = RESSENTI_FR[t.v] || t.v
                        return (
                          <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                            fontSize:'.875rem', paddingBottom: i < tags.length - 1 ? '.5rem' : 0,
                            borderBottom: i < tags.length - 1 ? '1px solid rgba(255,255,255,.05)' : 'none' }}>
                            <span style={{ color:'var(--text-muted)' }}>{t.k}</span>
                            <span style={{ fontWeight:600 }}>{val}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
                {/* Commentaire libre */}
                {freeText && (
                  <div style={{ background:'rgba(139,47,201,.08)', border:'1px solid rgba(139,47,201,.2)',
                    borderRadius:12, padding:'.875rem 1rem' }}>
                    <div style={{ fontSize:'.62rem', fontWeight:700, textTransform:'uppercase',
                      letterSpacing:'.08em', color:'#C084FC', marginBottom:'.5rem' }}>💬 Son commentaire</div>
                    <p style={{ fontSize:'.9rem', lineHeight:1.7, fontStyle:'italic', color:'rgba(255,255,255,.82)', margin:0 }}>
                      &ldquo;{freeText}&rdquo;
                    </p>
                  </div>
                )}
                {!rpe && !tags.length && !freeText && (
                  <p style={{ color:'var(--text-muted)', textAlign:'center', padding:'1rem' }}>
                    Aucun commentaire de l&apos;athlète.
                  </p>
                )}
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
