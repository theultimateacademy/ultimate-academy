import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import { SESSION_TYPE_COLORS } from '../../lib/utils'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function lastMonthLabel() {
  const d = new Date()
  d.setMonth(d.getMonth() - 1)
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

const MOOD_OPTIONS = [
  { v: 'fire',      icon: '🔥', label: 'En feu !',      color: '#F97316' },
  { v: 'good',      icon: '💪', label: 'Bonne semaine', color: '#10B981' },
  { v: 'ok',        icon: '👌', label: 'Semaine solide', color: '#3B82F6' },
  { v: 'attention', icon: '⚠️', label: 'À surveiller', color: '#F59E0B' },
]

const DAY_ORDER = { Lundi: 1, Mardi: 2, Mercredi: 3, Jeudi: 4, Vendredi: 5, Samedi: 6, Dimanche: 7 }
const rpeColor  = r => !r ? 'rgba(255,255,255,.4)' : r >= 8 ? '#EF4444' : r >= 6 ? '#F59E0B' : '#10B981'

// Parse structured comment tags into object
function parseComment(comment) {
  if (!comment) return {}
  const r = {}
  const ressentiM = comment.match(/\[Ressenti:\s*([^\]]+)\]/)
  if (ressentiM) r.ressenti = ressentiM[1].trim()
  const echM = comment.match(/\[Ech:\s*([^\]]+)\]/)
  if (echM) r.ech = echM[1].trim()
  const blocsM = comment.match(/\[Blocs:\s*([^\]]+)\]/)
  if (blocsM) r.blocs = blocsM[1].split('|').map(b => b.trim()).filter(Boolean)
  const corpsM = comment.match(/\[Corps:\s*([^\]]+)\]/)
  if (corpsM) r.corps = corpsM[1].trim()
  const racM = comment.match(/\[RAC:\s*([^\]]+)\]/)
  if (racM) r.rac = racM[1].trim()
  const fcMoyM = comment.match(/\[FC moy:\s*([^\]]+)\]/)
  if (fcMoyM) r.fcMoy = fcMoyM[1].trim()
  const fcMaxM = comment.match(/\[FC max:\s*([^\]]+)\]/)
  if (fcMaxM) r.fcMax = fcMaxM[1].trim()
  r.text = comment.replace(/\[[^\]]*\]/g, '').trim()
  return r
}

// Corps text renderer adapted for dark admin theme
function AdminCorpsDisplay({ corps, color }) {
  if (!corps) return null
  const c = color || '#10B981'
  const nodes = []
  corps.split('\n').forEach((line, i) => {
    const t = line.trim()
    if (!t) return
    if (/^BLOC\b/i.test(t)) {
      nodes.push(
        <div key={i} style={{ fontSize: '.63rem', fontWeight: 800, color: c, textTransform: 'uppercase',
          letterSpacing: '.07em', marginTop: nodes.length > 0 ? '.5rem' : 0, marginBottom: '.15rem', opacity: .85 }}>
          {t}
        </div>
      )
    } else if (t.startsWith('•')) {
      const content = t.slice(1).trim()
      const isRecov = /récup|recup|marche|trot|repos/i.test(content)
      nodes.push(
        <div key={i} style={{ fontSize: '.78rem', color: isRecov ? 'rgba(255,255,255,.32)' : 'rgba(255,255,255,.72)',
          fontStyle: isRecov ? 'italic' : 'normal', lineHeight: 1.5, textAlign: 'justify' }}>
          {isRecov ? '⏸ ' : '· '}{content}
        </div>
      )
    } else {
      nodes.push(<div key={i} style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.38)', fontStyle: 'italic', textAlign: 'justify' }}>{t}</div>)
    }
  })
  return <div style={{ display: 'flex', flexDirection: 'column', gap: '.1rem' }}>{nodes}</div>
}

// RPE mini progress bar
function RPEBar({ rpe }) {
  if (!rpe) return null
  const c = rpeColor(rpe)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.5rem' }}>
      <span style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.38)', flexShrink: 0 }}>RPE</span>
      <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,.08)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${rpe * 10}%`, background: c, borderRadius: 99, transition: 'width .3s' }} />
      </div>
      <span style={{ fontSize: '.85rem', fontWeight: 800, color: c, flexShrink: 0, minWidth: 18 }}>{rpe}</span>
    </div>
  )
}

// Single expandable session card
function SessionAccordion({ session, expanded, onToggle }) {
  const { idx, jour, type, titre, corps, allures, echauffement, retour_au_calme, comp, aiComment } = session
  const color  = SESSION_TYPE_COLORS[type] || '#10B981'
  const done   = !!comp
  const parsed = parseComment(comp?.comment)

  return (
    <div style={{ borderRadius: 12, border: `1px solid ${done ? 'rgba(16,185,129,.18)' : 'rgba(255,255,255,.07)'}`,
      overflow: 'hidden', background: done ? 'rgba(16,185,129,.04)' : 'rgba(255,255,255,.02)' }}>

      {/* Collapsed header — full row is clickable */}
      <button onClick={onToggle} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 0,
        background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0, textAlign: 'left',
      }}>
        <div style={{ width: 3, background: done ? '#10B981' : color, alignSelf: 'stretch', flexShrink: 0 }} />
        <div style={{ flex: 1, padding: '.6rem .875rem', display: 'flex', alignItems: 'center', gap: '.5rem', minWidth: 0 }}>
          {/* Day */}
          <span style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.38)', flexShrink: 0, minWidth: 28 }}>
            {jour?.slice(0, 3)}
          </span>
          {/* Type badge */}
          <span style={{ fontSize: '.62rem', fontWeight: 800, color, textTransform: 'uppercase',
            letterSpacing: '.05em', flexShrink: 0, background: color + '18',
            borderRadius: 99, padding: '.1rem .45rem', border: `1px solid ${color}28` }}>
            {type?.split(' ')[0]}
          </span>
          {/* Title */}
          <span style={{ fontSize: '.82rem', fontWeight: 600, color: '#fff', flex: 1, overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {titre}
          </span>
          {/* Done / not done */}
          {done ? (
            <>
              <span style={{ fontSize: '.78rem' }}>✅</span>
              {comp.rpe && (
                <span style={{ fontSize: '.68rem', fontWeight: 800, color: rpeColor(comp.rpe),
                  background: rpeColor(comp.rpe) + '20', borderRadius: 99, padding: '.1rem .4rem',
                  flexShrink: 0, border: `1px solid ${rpeColor(comp.rpe)}30` }}>
                  RPE {comp.rpe}
                </span>
              )}
            </>
          ) : (
            <span style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.25)', fontStyle: 'italic', flexShrink: 0 }}>Non effectuée</span>
          )}
          {/* Chevron */}
          <span style={{ fontSize: '.6rem', color: 'rgba(255,255,255,.22)', flexShrink: 0, marginLeft: '.25rem' }}>
            {expanded ? '▲' : '▼'}
          </span>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,.06)', padding: '1rem' }}>

          {/* Prévu / Réalisé two-column grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

            {/* ── PRÉVU ── */}
            <div>
              <div style={{ fontSize: '.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em',
                color, marginBottom: '.5rem' }}>Prévu</div>
              {echauffement && (
                <div style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.45)', marginBottom: '.35rem',
                  padding: '.3rem .5rem', background: 'rgba(245,158,11,.06)', borderRadius: 8,
                  border: '1px solid rgba(245,158,11,.15)', textAlign: 'justify' }}>
                  🔥 <em>{echauffement}</em>
                </div>
              )}
              <AdminCorpsDisplay corps={corps} color={color} />
              {retour_au_calme && (
                <div style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.45)', marginTop: '.35rem',
                  padding: '.3rem .5rem', background: 'rgba(59,130,246,.06)', borderRadius: 8,
                  border: '1px solid rgba(59,130,246,.15)', textAlign: 'justify' }}>
                  ❄️ <em>{retour_au_calme}</em>
                </div>
              )}
              {/* Allures cibles */}
              {(allures || []).filter(a => a?.allure_min_km).length > 0 && (
                <div style={{ marginTop: '.5rem', display: 'flex', flexWrap: 'wrap', gap: '.3rem' }}>
                  {(allures || []).filter(a => a?.allure_min_km).map((a, ai) => (
                    <span key={ai} style={{ fontSize: '.7rem', fontWeight: 700, color,
                      background: color + '15', borderRadius: 99, padding: '.15rem .5rem',
                      border: `1px solid ${color}28` }}>
                      🎯 {a.zone ? `${a.zone}: ` : ''}{a.allure_min_km}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* ── RÉALISÉ ── */}
            <div>
              <div style={{ fontSize: '.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em',
                color: done ? '#10B981' : 'rgba(255,255,255,.25)', marginBottom: '.5rem' }}>Réalisé</div>
              {done ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
                  <RPEBar rpe={comp.rpe} />
                  {parsed.ressenti && (
                    <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.6)', textAlign: 'justify' }}>
                      💬 {parsed.ressenti}
                    </div>
                  )}
                  {parsed.ech && (
                    <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.55)' }}>
                      🔥 Ech: <strong>{parsed.ech}</strong>/km
                    </div>
                  )}
                  {parsed.blocs && parsed.blocs.length > 0 && (
                    <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 8,
                      padding: '.4rem .6rem', border: '1px solid rgba(255,255,255,.07)' }}>
                      <div style={{ fontSize: '.62rem', fontWeight: 700, color: 'rgba(255,255,255,.3)',
                        textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.25rem' }}>
                        Répétitions
                      </div>
                      {parsed.blocs.map((b, bi) => (
                        <div key={bi} style={{ fontSize: '.78rem', color: '#C084FC',
                          fontWeight: 700, lineHeight: 1.6 }}>
                          ⚡ {b}
                        </div>
                      ))}
                    </div>
                  )}
                  {parsed.corps && (
                    <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.55)' }}>
                      ⚡ Corps: <strong>{parsed.corps}</strong>
                    </div>
                  )}
                  {parsed.rac && (
                    <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.55)' }}>
                      ❄️ RAC: <strong>{parsed.rac}</strong>/km
                    </div>
                  )}
                  {(comp.avg_hr || parsed.fcMoy) && (
                    <div style={{ fontSize: '.75rem', color: '#F87171' }}>
                      ❤️ FC moy: <strong>{comp.avg_hr || parsed.fcMoy}</strong> bpm
                      {parsed.fcMax && <span> · max: <strong>{parsed.fcMax}</strong> bpm</span>}
                    </div>
                  )}
                  {parsed.text && (
                    <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.5)',
                      fontStyle: 'italic', borderTop: '1px solid rgba(255,255,255,.06)',
                      paddingTop: '.3rem', marginTop: '.1rem', textAlign: 'justify' }}>
                      "{parsed.text}"
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.25)', fontStyle: 'italic', paddingTop: '.25rem' }}>
                  — Séance non effectuée
                </div>
              )}
            </div>
          </div>

          {/* AI coach comment */}
          {aiComment && (
            <div style={{ marginTop: '.875rem', borderTop: '1px solid rgba(255,255,255,.06)',
              paddingTop: '.75rem' }}>
              <div style={{ fontSize: '.62rem', fontWeight: 800, textTransform: 'uppercase',
                letterSpacing: '.1em', color: '#C084FC', marginBottom: '.35rem' }}>
                Analyse coach
              </div>
              <p style={{ fontSize: '.82rem', color: 'rgba(255,255,255,.6)', lineHeight: 1.65, margin: 0,
                fontStyle: 'italic', textAlign: 'justify' }}>
                {aiComment}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AnalysisModal({ analysis, athlete, onClose, onSend }) {
  const data0 = analysis.analysis_data || {}

  const [conseil,         setConseil]         = useState(data0.conseil || data0.ajustement_semaine_suivante || '')
  const [mood,            setMood]            = useState(data0.mood || 'good')
  const [saving,          setSaving]          = useState(false)
  const [sending,         setSending]         = useState(false)
  const [weekSessions,    setWeekSessions]    = useState([])
  const [weekCompletions, setWeekCompletions] = useState([])
  const [loadingData,     setLoadingData]     = useState(true)
  const [expandedIdx,     setExpandedIdx]     = useState(null)

  const isSent = analysis.status === 'sent'

  useEffect(() => {
    async function loadWeekData() {
      setLoadingData(true)
      try {
        const [{ data: plan }, { data: comps }] = await Promise.all([
          supabase.from('training_plans').select('plan_data').eq('id', analysis.plan_id).single(),
          supabase.from('session_completions').select('*')
            .eq('user_id', analysis.user_id)
            .eq('plan_id', analysis.plan_id)
            .eq('week_number', analysis.week_number),
        ])
        const weekData = plan?.plan_data?.semaines?.find(w => w.numero === analysis.week_number)
        setWeekSessions(weekData?.seances || [])
        setWeekCompletions(comps || [])
      } finally {
        setLoadingData(false)
      }
    }
    if (analysis.plan_id) loadWeekData()
    else setLoadingData(false)
  }, [analysis.plan_id, analysis.user_id, analysis.week_number])

  async function save() {
    setSaving(true)
    await supabase.from('weekly_analyses')
      .update({ analysis_data: { ...data0, conseil, mood } })
      .eq('id', analysis.id)
    setSaving(false)
  }

  async function send() {
    setSending(true)
    try {
      await supabase.from('weekly_analyses')
        .update({
          analysis_data: { ...data0, conseil, mood },
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', analysis.id)
      onSend()
    } finally {
      setSending(false)
    }
  }

  const aiSessions = data0.sessions || []

  const sessionCards = weekSessions
    .map((s, idx) => ({
      idx,
      ...s,
      comp:      weekCompletions.find(c => c.session_index === idx),
      aiComment: aiSessions.find(ai => ai.idx === idx)?.coach_comment || null,
    }))
    .sort((a, b) => (DAY_ORDER[a.jour] || 8) - (DAY_ORDER[b.jour] || 8))

  const doneCount = sessionCards.filter(s => s.comp).length

  const inp = { width: '100%', padding: '.45rem .75rem', border: '1px solid rgba(255,255,255,.12)', borderRadius: 8, fontSize: '.875rem', fontFamily: 'inherit', background: 'rgba(255,255,255,.05)', color: '#fff', outline: 'none', boxSizing: 'border-box' }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '1.5rem', overflowY: 'auto' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: '100%', maxWidth: 720, background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)', boxShadow: '0 24px 60px rgba(0,0,0,.6)', overflow: 'hidden', margin: 'auto' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ background: isSent ? 'rgba(16,185,129,.08)' : 'rgba(139,47,201,.08)', borderBottom: '1px solid var(--border)', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: isSent ? '#34D399' : '#C084FC', marginBottom: '.25rem' }}>
              {isSent ? '✅ Envoyée' : '✏️ Brouillon'}
            </div>
            <h3 style={{ margin: 0, fontSize: '1.05rem' }}>
              {data0.is_monthly
                ? `Analyse du mois de ${data0.month || ''}`
                : `Analyse de la semaine ${analysis.week_number}`}
            </h3>
            <div style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginTop: '.2rem' }}>
              {athlete?.first_name} {athlete?.last_name}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '.3rem .6rem', cursor: 'pointer', color: 'var(--text-muted)', fontFamily: 'inherit', fontSize: '.85rem' }}>✕</button>
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Mood */}
          <div>
            <label style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'rgba(255,255,255,.4)', display: 'block', marginBottom: '.5rem' }}>Ambiance de la semaine</label>
            <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
              {MOOD_OPTIONS.map(m => (
                <button key={m.v} onClick={() => setMood(m.v)} style={{
                  padding: '.35rem .8rem', borderRadius: 8, border: `1px solid ${mood === m.v ? m.color : 'rgba(255,255,255,.12)'}`,
                  background: mood === m.v ? m.color + '20' : 'transparent',
                  color: mood === m.v ? m.color : 'rgba(255,255,255,.5)',
                  fontWeight: 600, fontSize: '.82rem', cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  {m.icon} {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Séances accordion — weekly only */}
          {!data0.is_monthly && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.5rem' }}>
                <label style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'rgba(255,255,255,.4)' }}>
                  Séances de la semaine
                </label>
                {!loadingData && sessionCards.length > 0 && (
                  <span style={{ fontSize: '.72rem', color: doneCount === sessionCards.length ? '#34D399' : 'rgba(255,255,255,.3)', fontWeight: 600 }}>
                    {doneCount}/{sessionCards.length} effectuées
                  </span>
                )}
              </div>
              {loadingData ? (
                <div style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.3)', padding: '.5rem 0' }}>Chargement…</div>
              ) : sessionCards.length === 0 ? (
                <div style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.25)', fontStyle: 'italic' }}>Aucune séance trouvée dans le plan.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
                  {sessionCards.map(s => (
                    <SessionAccordion
                      key={s.idx}
                      session={s}
                      expanded={expandedIdx === s.idx}
                      onToggle={() => setExpandedIdx(expandedIdx === s.idx ? null : s.idx)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Conseil / bilan */}
          <div>
            <label style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'rgba(255,255,255,.4)', display: 'block', marginBottom: '.4rem' }}>
              {data0.is_monthly ? 'Bilan du mois' : 'Focus semaine prochaine'}
            </label>
            <textarea value={conseil} onChange={e => setConseil(e.target.value)}
              placeholder={data0.is_monthly
                ? 'Retour sur les moments forts du mois, les progrès, les points à travailler...'
                : 'Ce sur quoi elle doit se concentrer la semaine prochaine...'}
              rows={data0.is_monthly ? 5 : 2}
              style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} />
          </div>

          {/* RPE moyen */}
          {data0.rpe_moyen && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', background: 'rgba(255,255,255,.04)', borderRadius: 8, padding: '.6rem .875rem' }}>
              <span style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'rgba(255,255,255,.4)' }}>RPE moyen</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: rpeColor(data0.rpe_moyen) }}>{data0.rpe_moyen}</span>
              <span style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.35)' }}>/10 — calculé automatiquement</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '.75rem', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '.5rem 1rem', borderRadius: 8, border: '1px solid var(--border)', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '.85rem' }}>
            Fermer
          </button>
          <button onClick={save} disabled={saving} style={{ padding: '.5rem 1rem', borderRadius: 8, border: '1px solid rgba(255,255,255,.15)', background: 'rgba(255,255,255,.06)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: '.85rem', fontWeight: 600 }}>
            {saving ? 'Sauvegarde…' : '💾 Brouillon'}
          </button>
          {!isSent && (
            <button onClick={send} disabled={sending} style={{ padding: '.5rem 1.25rem', borderRadius: 8, border: 'none', background: 'var(--gradient)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: '.85rem', fontWeight: 700 }}>
              {sending ? 'Envoi…' : '📤 Envoyer à l\'athlète'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminAnalyses() {
  const [analyses,             setAnalyses]            = useState([])
  const [athletes,             setAthletes]            = useState({})
  const [modal,                setModal]               = useState(null)
  const [filter,               setFilter]              = useState('pending')
  const [loading,              setLoading]             = useState(true)
  const [showMonthForm,        setShowMonthForm]       = useState(false)
  const [monthAthletes,        setMonthAthletes]       = useState([])
  const [monthSelectedAthlete, setMonthSelectedAthlete] = useState('')
  const [monthLabel,           setMonthLabel]          = useState(lastMonthLabel())
  const [monthCreating,        setMonthCreating]       = useState(false)

  useEffect(() => {
    loadAnalyses()
    supabase.from('profiles').select('id, first_name, last_name')
      .eq('role', 'athlete').order('first_name')
      .then(({ data }) => setMonthAthletes(data || []))
  }, [])

  async function deleteAnalysis(id) {
    if (!window.confirm('Supprimer cette analyse ?')) return
    await supabase.from('weekly_analyses').delete().eq('id', id)
    setAnalyses(prev => prev.filter(a => a.id !== id))
  }

  async function createMonthlyAnalysis() {
    if (!monthSelectedAthlete) return
    setMonthCreating(true)
    try {
      const res = await fetch(`${API}/api/admin/monthly-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: monthSelectedAthlete, month_label: monthLabel }),
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setShowMonthForm(false)
      setMonthSelectedAthlete('')
      loadAnalyses()
    } catch (err) {
      alert('Erreur : ' + err.message)
    } finally {
      setMonthCreating(false)
    }
  }

  async function loadAnalyses() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('weekly_analyses').select('*').order('created_at', { ascending: false })
      const ids = [...new Set((data || []).map(a => a.user_id))]
      const { data: profiles } = await supabase
        .from('profiles').select('id, first_name, last_name').in('id', ids)
      setAnalyses(data || [])
      setAthletes(Object.fromEntries((profiles || []).map(p => [p.id, p])))
    } finally {
      setLoading(false)
    }
  }

  const filtered = analyses.filter(a => filter === 'all' || a.status === filter)

  if (loading) return <LoadingSpinner fullPage />

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="page-heading" style={{ marginBottom: '.2rem' }}>Analyses</h2>
          <p style={{ fontSize: '.85rem', color: 'var(--text-muted)', margin: 0 }}>
            Rédige et envoie tes analyses à chaque athlète — elles apparaissent directement sur leur tableau de bord.
          </p>
        </div>
        <button
          onClick={() => setShowMonthForm(v => !v)}
          style={{
            padding: '.4rem 1rem', borderRadius: 8, border: '1px solid rgba(6,182,212,.35)',
            background: showMonthForm ? 'rgba(6,182,212,.15)' : 'rgba(6,182,212,.07)',
            color: '#22D3EE', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: '.82rem', fontWeight: 600,
          }}>
          📅 Analyse mensuelle
        </button>
      </div>

      {showMonthForm && (
        <div style={{
          background: 'rgba(6,182,212,.06)', border: '1px solid rgba(6,182,212,.2)',
          borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.25rem',
        }}>
          <div style={{ fontSize: '.78rem', fontWeight: 700, color: '#22D3EE', marginBottom: '.75rem' }}>
            📅 Créer une analyse mensuelle
          </div>
          <div style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.4)', display: 'block', marginBottom: '.3rem' }}>Athlète</label>
              <select value={monthSelectedAthlete} onChange={e => setMonthSelectedAthlete(e.target.value)}
                style={{ width: '100%', padding: '.4rem .65rem', border: '1px solid rgba(255,255,255,.12)', borderRadius: 8, fontSize: '.85rem', fontFamily: 'inherit', background: 'rgba(255,255,255,.05)', color: '#fff', outline: 'none' }}>
                <option value="">— Choisir un athlète —</option>
                {monthAthletes.map(a => (
                  <option key={a.id} value={a.id}>{a.first_name} {a.last_name}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 150 }}>
              <label style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.4)', display: 'block', marginBottom: '.3rem' }}>Mois concerné</label>
              <input value={monthLabel} onChange={e => setMonthLabel(e.target.value)}
                style={{ width: '100%', padding: '.4rem .65rem', border: '1px solid rgba(255,255,255,.12)', borderRadius: 8, fontSize: '.85rem', fontFamily: 'inherit', background: 'rgba(255,255,255,.05)', color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <button onClick={createMonthlyAnalysis} disabled={monthCreating || !monthSelectedAthlete}
              style={{
                padding: '.42rem 1.1rem', borderRadius: 8, border: 'none',
                background: !monthSelectedAthlete ? 'rgba(255,255,255,.08)' : 'rgba(6,182,212,.85)',
                color: !monthSelectedAthlete ? 'rgba(255,255,255,.3)' : '#fff',
                cursor: monthSelectedAthlete ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit', fontSize: '.85rem', fontWeight: 700,
              }}>
              {monthCreating ? 'Création…' : 'Créer'}
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {[
          { v: 'pending', l: `✏️ À envoyer (${analyses.filter(a => a.status === 'pending').length})` },
          { v: 'sent',    l: `✅ Envoyées (${analyses.filter(a => a.status === 'sent').length})` },
          { v: 'all',     l: 'Toutes' },
        ].map(f => (
          <button key={f.v}
            onClick={() => setFilter(f.v)}
            style={{
              padding: '.35rem .9rem', borderRadius: 8, border: '1px solid',
              fontSize: '.82rem', fontWeight: 600, cursor: 'pointer',
              borderColor: filter === f.v ? 'var(--primary)' : 'rgba(255,255,255,.12)',
              background: filter === f.v ? 'rgba(139,47,201,.2)' : 'transparent',
              color: filter === f.v ? '#C084FC' : 'rgba(255,255,255,.5)',
              fontFamily: 'inherit',
            }}>{f.l}</button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
        {filtered.map(analysis => {
          const athlete = athletes[analysis.user_id]
          const data    = analysis.analysis_data || {}
          const mood    = data.mood || 'good'
          const moodMap = { fire: { icon: '🔥', color: '#F97316' }, good: { icon: '💪', color: '#10B981' }, ok: { icon: '👌', color: '#3B82F6' }, attention: { icon: '⚠️', color: '#F59E0B' } }
          const m       = moodMap[mood] || moodMap.good
          const isSent  = analysis.status === 'sent'
          const preview = analysis.coach_message || data.intro || data.resume || ''
          return (
            <div key={analysis.id}
              style={{
                background: 'rgba(255,255,255,.03)', borderRadius: 12, overflow: 'hidden',
                border: `1px solid ${isSent ? 'rgba(16,185,129,.2)' : data.is_monthly ? 'rgba(6,182,212,.2)' : 'rgba(245,158,11,.2)'}`,
                display: 'flex', gap: 0,
              }}>
              <div style={{ width: 4, background: isSent ? '#10B981' : data.is_monthly ? '#06B6D4' : '#F59E0B', flexShrink: 0 }} />
              <div style={{ flex: 1, padding: '1rem 1.1rem', minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.35rem' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '.75rem', fontWeight: 800, flexShrink: 0 }}>
                        {athlete?.first_name?.[0]?.toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '.9rem' }}>{athlete?.first_name} {athlete?.last_name}</span>
                      {data.is_monthly ? (
                        <span style={{ fontSize: '.68rem', fontWeight: 700, color: '#22D3EE', background: 'rgba(6,182,212,.12)', border: '1px solid rgba(6,182,212,.25)', borderRadius: 99, padding: '.06rem .45rem' }}>
                          📅 Mensuelle
                        </span>
                      ) : (
                        <span style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.35)' }}>· S{analysis.week_number}</span>
                      )}
                      {data.mood && (
                        <span style={{ fontSize: '.75rem', color: m.color, background: m.color + '18', border: `1px solid ${m.color}30`, borderRadius: 99, padding: '.08rem .45rem' }}>
                          {m.icon}
                        </span>
                      )}
                    </div>
                    {preview && (
                      <p style={{ fontSize: '.82rem', color: 'rgba(255,255,255,.5)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 380 }}>
                        {preview}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.3)' }}>
                      {new Date(analysis.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </span>
                    <button
                      onClick={() => setModal({ analysis, athlete })}
                      style={{
                        padding: '.35rem .85rem', borderRadius: 8, border: '1px solid',
                        fontSize: '.8rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                        borderColor: isSent ? 'rgba(16,185,129,.3)' : 'var(--primary)',
                        background: isSent ? 'rgba(16,185,129,.1)' : 'rgba(139,47,201,.2)',
                        color: isSent ? '#34D399' : '#C084FC',
                      }}>
                      {isSent ? '👁 Voir' : '✏️ Rédiger'}
                    </button>
                    <button
                      onClick={() => deleteAnalysis(analysis.id)}
                      title="Supprimer l'analyse"
                      style={{
                        width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(239,68,68,.25)',
                        background: 'rgba(239,68,68,.08)', color: '#F87171',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '.85rem', flexShrink: 0,
                      }}>
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,.02)', borderRadius: 12, border: '1px solid var(--border)' }}>
            Aucune analyse dans cette catégorie.
          </div>
        )}
      </div>

      {modal && (
        <AnalysisModal
          analysis={modal.analysis}
          athlete={modal.athlete}
          onClose={() => setModal(null)}
          onSend={() => { setModal(null); loadAnalyses() }}
        />
      )}
    </div>
  )
}
