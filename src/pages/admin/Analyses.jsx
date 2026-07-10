import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import { SESSION_TYPE_COLORS } from '../../lib/utils'

const MOOD_OPTIONS = [
  { v: 'fire',      icon: '🔥', label: 'En feu !',      color: '#F97316' },
  { v: 'good',      icon: '💪', label: 'Bonne semaine', color: '#10B981' },
  { v: 'ok',        icon: '👌', label: 'Semaine solide', color: '#3B82F6' },
  { v: 'attention', icon: '⚠️', label: 'À surveiller', color: '#F59E0B' },
]

const rpeColor = r => !r ? 'rgba(255,255,255,.4)' : r >= 8 ? '#EF4444' : r >= 6 ? '#F59E0B' : '#10B981'

function AnalysisModal({ analysis, athlete, onClose, onSend }) {
  const data0 = analysis.analysis_data || {}

  const [intro,           setIntro]           = useState(analysis.coach_message || data0.intro || data0.message_coach || '')
  const [conseil,         setConseil]         = useState(data0.conseil || data0.ajustement_semaine_suivante || '')
  const [mood,            setMood]            = useState(data0.mood || 'good')
  const [sessions,        setSessions]        = useState(data0.sessions_comments || [])
  const [saving,          setSaving]          = useState(false)
  const [sending,         setSending]         = useState(false)
  const [weekSessions,    setWeekSessions]    = useState([]) // sessions planifiées
  const [weekCompletions, setWeekCompletions] = useState([]) // sessions effectuées
  const [loadingData,     setLoadingData]     = useState(true)

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
    const payload = {
      coach_message: intro,
      analysis_data: { ...data0, intro, conseil, mood, sessions_comments: sessions },
    }
    await supabase.from('weekly_analyses').update(payload).eq('id', analysis.id)
    setSaving(false)
  }

  async function send() {
    setSending(true)
    try {
      const payload = {
        coach_message: intro,
        analysis_data: { ...data0, intro, conseil, mood, sessions_comments: sessions },
        status: 'sent',
        sent_at: new Date().toISOString(),
      }
      await supabase.from('weekly_analyses').update(payload).eq('id', analysis.id)
      onSend()
    } finally {
      setSending(false)
    }
  }

  const addSession = () => setSessions(s => [...s, { titre: '', note: '' }])
  const updateSession = (i, field, val) => setSessions(s => s.map((x, j) => j === i ? { ...x, [field]: val } : x))
  const removeSession = (i) => setSessions(s => s.filter((_, j) => j !== i))

  const inp = { width: '100%', padding: '.45rem .75rem', border: '1px solid rgba(255,255,255,.12)', borderRadius: 8, fontSize: '.875rem', fontFamily: 'inherit', background: 'rgba(255,255,255,.05)', color: '#fff', outline: 'none', boxSizing: 'border-box' }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '1.5rem', overflowY: 'auto' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: '100%', maxWidth: 680, background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)', boxShadow: '0 24px 60px rgba(0,0,0,.6)', overflow: 'hidden', margin: 'auto' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ background: isSent ? 'rgba(16,185,129,.08)' : 'rgba(139,47,201,.08)', borderBottom: '1px solid var(--border)', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: isSent ? '#34D399' : '#C084FC', marginBottom: '.25rem' }}>
              {isSent ? '✅ Envoyée' : '✏️ Brouillon'}
            </div>
            <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Analyse Semaine {analysis.week_number}</h3>
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

          {/* Intro pote */}
          <div>
            <label style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'rgba(255,255,255,.4)', display: 'block', marginBottom: '.4rem' }}>
              Message principal — ton retour en mode pote
            </label>
            <textarea value={intro} onChange={e => setIntro(e.target.value)}
              placeholder={`Coucou ${athlete?.first_name} ! Super semaine, t'as vraiment assuré sur...`}
              rows={4}
              style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} />
            <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.25)', marginTop: '.3rem' }}>
              Parle-lui comme à un pote. C'est ce texte qui s'affichera en grand sur son tableau de bord.
            </div>
          </div>

          {/* Séances réelles de la semaine */}
          <div>
            <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'rgba(255,255,255,.4)', marginBottom: '.5rem' }}>
              Séances de la semaine — réel
            </div>
            {loadingData ? (
              <div style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.3)', padding: '.5rem 0' }}>Chargement…</div>
            ) : weekSessions.length === 0 ? (
              <div style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.25)', fontStyle: 'italic' }}>Aucune séance trouvée dans le plan.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                {weekSessions.map((s, idx) => {
                  const comp  = weekCompletions.find(c => c.session_index === idx)
                  const color = SESSION_TYPE_COLORS[s.type] || '#10B981'
                  const done  = !!comp
                  return (
                    <div key={idx} style={{
                      display: 'flex', alignItems: 'flex-start', gap: '.75rem',
                      background: done ? 'rgba(16,185,129,.07)' : 'rgba(255,255,255,.03)',
                      border: `1px solid ${done ? 'rgba(16,185,129,.2)' : 'rgba(255,255,255,.08)'}`,
                      borderLeft: `3px solid ${done ? '#10B981' : color}`,
                      borderRadius: 10, padding: '.625rem .875rem',
                    }}>
                      <div style={{ width: 20, flexShrink: 0, paddingTop: '.15rem', textAlign: 'center', fontSize: '.9rem' }}>
                        {done ? '✅' : '—'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', gap: '.4rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '.2rem' }}>
                          <span style={{ fontSize: '.7rem', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '.04em' }}>{s.type}</span>
                          <span style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.35)' }}>· {s.jour}</span>
                          {comp?.rpe && (
                            <span style={{ fontSize: '.7rem', background: 'rgba(255,255,255,.08)', borderRadius: 99, padding: '.1rem .45rem', color: 'rgba(255,255,255,.6)', fontWeight: 700 }}>
                              RPE {comp.rpe}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '.82rem', fontWeight: 600 }}>{s.titre}</div>
                        {comp?.comment && (
                          <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.45)', marginTop: '.2rem', fontStyle: 'italic' }}>
                            {comp.comment}
                          </div>
                        )}
                        {!done && (
                          <div style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.28)', marginTop: '.15rem' }}>Non effectuée</div>
                        )}
                      </div>
                      {comp?.avg_hr && (
                        <div style={{ flexShrink: 0, fontSize: '.72rem', color: 'rgba(255,255,255,.4)', textAlign: 'right' }}>
                          ❤️ {comp.avg_hr} bpm
                        </div>
                      )}
                    </div>
                  )
                })}
                <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.3)', marginTop: '.25rem' }}>
                  {weekCompletions.length} / {weekSessions.length} séances effectuées
                </div>
              </div>
            )}
          </div>

          {/* Session comments */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.5rem' }}>
              <label style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'rgba(255,255,255,.4)' }}>
                Retours séance par séance
              </label>
              <button onClick={addSession} style={{ fontSize: '.75rem', color: '#C084FC', background: 'rgba(139,47,201,.15)', border: '1px solid rgba(139,47,201,.3)', borderRadius: 6, padding: '.2rem .6rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                + Ajouter
              </button>
            </div>
            {sessions.length === 0 && (
              <div style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.25)', fontStyle: 'italic', padding: '.5rem 0' }}>
                Aucun commentaire de séance. Clique sur "+ Ajouter" pour commenter une séance spécifique.
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
              {sessions.map((s, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 10, padding: '.75rem' }}>
                  {/* Titre + jour + type + RPE */}
                  <div style={{ display: 'flex', gap: '.4rem', marginBottom: '.4rem', flexWrap: 'wrap' }}>
                    <input value={s.titre || ''} onChange={e => updateSession(i, 'titre', e.target.value)}
                      placeholder="Titre (ex : Côtes 8×80m)"
                      style={{ ...inp, flex: 2, minWidth: 140, fontSize: '.82rem' }} />
                    <select value={s.jour || ''} onChange={e => updateSession(i, 'jour', e.target.value)}
                      style={{ ...inp, flex: '0 0 90px', fontSize: '.8rem', cursor: 'pointer' }}>
                      <option value="">Jour</option>
                      {['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'].map(j => <option key={j} value={j}>{j.slice(0,3)}</option>)}
                    </select>
                    <select value={s.type || ''} onChange={e => updateSession(i, 'type', e.target.value)}
                      style={{ ...inp, flex: '0 0 100px', fontSize: '.8rem', cursor: 'pointer' }}>
                      <option value="">Sport</option>
                      <option value="Cotes">Côtes</option>
                      <option value="Endurance Fondamentale">EF</option>
                      <option value="Fractionné Court">Frac Court</option>
                      <option value="Fractionné Long">Frac Long</option>
                      <option value="Sortie Longue">SL</option>
                      <option value="Tempo / Seuil">Tempo</option>
                      <option value="Natation">Natation</option>
                      <option value="Velo">Vélo</option>
                      <option value="Brique">Brique</option>
                      <option value="Renforcement">Renfo</option>
                    </select>
                    <input value={s.rpe || ''} onChange={e => updateSession(i, 'rpe', +e.target.value || '')}
                      type="number" min="1" max="10" placeholder="RPE"
                      style={{ ...inp, flex: '0 0 60px', fontSize: '.82rem' }} />
                    <button onClick={() => removeSession(i)} style={{ background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 6, padding: '.2rem .5rem', color: '#F87171', cursor: 'pointer', fontFamily: 'inherit', fontSize: '.8rem' }}>✕</button>
                  </div>
                  <textarea value={s.note || ''} onChange={e => updateSession(i, 'note', e.target.value)}
                    placeholder="Ton retour sur cette séance..."
                    rows={2}
                    style={{ ...inp, resize: 'vertical', fontSize: '.82rem', lineHeight: 1.5 }} />
                </div>
              ))}
            </div>
          </div>

          {/* Conseil semaine prochaine */}
          <div>
            <label style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'rgba(255,255,255,.4)', display: 'block', marginBottom: '.4rem' }}>
              Focus semaine prochaine
            </label>
            <textarea value={conseil} onChange={e => setConseil(e.target.value)}
              placeholder="Ce sur quoi elle doit se concentrer la semaine prochaine..."
              rows={2}
              style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} />
          </div>

          {/* RPE moyen auto */}
          {data0.rpe_moyen && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', background: 'rgba(255,255,255,.04)', borderRadius: 8, padding: '.6rem .875rem' }}>
              <span style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'rgba(255,255,255,.4)' }}>RPE moyen calculé</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: rpeColor(data0.rpe_moyen) }}>{data0.rpe_moyen}</span>
              <span style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.35)' }}>/10 — affiché automatiquement</span>
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
            <button onClick={send} disabled={sending || !intro.trim()} style={{ padding: '.5rem 1.25rem', borderRadius: 8, border: 'none', background: 'var(--gradient)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: '.85rem', fontWeight: 700, opacity: (!intro.trim()) ? .5 : 1 }}>
              {sending ? 'Envoi…' : '📤 Envoyer à l\'athlète'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminAnalyses() {
  const [analyses,  setAnalyses]  = useState([])
  const [athletes,  setAthletes]  = useState({})
  const [modal,     setModal]     = useState(null)
  const [filter,    setFilter]    = useState('pending')
  const [loading,   setLoading]   = useState(true)

  useEffect(() => { loadAnalyses() }, [])

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="page-heading" style={{ marginBottom: '.2rem' }}>Analyses hebdomadaires</h2>
          <p style={{ fontSize: '.85rem', color: 'var(--text-muted)', margin: 0 }}>
            Rédige et envoie tes analyses à chaque athlète — elles apparaissent directement sur leur tableau de bord.
          </p>
        </div>
      </div>

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
                border: `1px solid ${isSent ? 'rgba(16,185,129,.2)' : 'rgba(245,158,11,.2)'}`,
                display: 'flex', gap: 0,
              }}>
              <div style={{ width: 4, background: isSent ? '#10B981' : '#F59E0B', flexShrink: 0 }} />
              <div style={{ flex: 1, padding: '1rem 1.1rem', minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.35rem' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '.75rem', fontWeight: 800, flexShrink: 0 }}>
                        {athlete?.first_name?.[0]?.toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '.9rem' }}>{athlete?.first_name} {athlete?.last_name}</span>
                      <span style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.35)' }}>· S{analysis.week_number}</span>
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
