import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { api } from '../../lib/api'
import LoadingSpinner from '../../components/UI/LoadingSpinner'

function AnalysisModal({ analysis, athlete, onClose, onSend }) {
  const [message, setMessage]   = useState(analysis.coach_message || '')
  const [sending, setSending]   = useState(false)
  const [saving,  setSaving]    = useState(false)

  const data = analysis.analysis_data || {}

  async function save() {
    setSaving(true)
    await supabase.from('weekly_analyses').update({ coach_message: message }).eq('id', analysis.id)
    setSaving(false)
  }

  async function sendToAthlete() {
    setSending(true)
    try {
      await supabase.from('weekly_analyses').update({
        coach_message: message,
        status: 'sent',
        sent_at: new Date().toISOString()
      }).eq('id', analysis.id)

      // Also send as a chat message
      await supabase.from('messages').insert({
        user_id: athlete.id,
        sender: 'coach',
        content: message
      })
      onSend()
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="modal-overlay center" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal center-modal" style={{ maxWidth: 640 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <h3>Analyse · Semaine {analysis.week_number}</h3>
            <div style={{ fontSize: '.875rem', color: 'var(--text-muted)' }}>
              {athlete?.first_name} {athlete?.last_name}
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        {/* Summary */}
        {data.resume && (
          <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1rem' }}>
            <div style={{ fontWeight: 600, marginBottom: '.4rem', fontSize: '.875rem' }}>📊 Résumé</div>
            <p style={{ fontSize: '.9rem', lineHeight: 1.6 }}>{data.resume}</p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          {data.points_positifs?.length > 0 && (
            <div style={{ background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.25)', borderRadius: 'var(--radius)', padding: '1rem' }}>
              <div style={{ fontWeight: 600, color: '#6EE7B7', marginBottom: '.4rem', fontSize: '.875rem' }}>✅ Points positifs</div>
              {data.points_positifs.map((p, i) => <div key={i} style={{ fontSize: '.85rem', color: 'rgba(255,255,255,.75)' }}>• {p}</div>)}
            </div>
          )}
          {data.points_attention?.length > 0 && (
            <div style={{ background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.25)', borderRadius: 'var(--radius)', padding: '1rem' }}>
              <div style={{ fontWeight: 600, color: '#FCD34D', marginBottom: '.4rem', fontSize: '.875rem' }}>⚠️ Points d'attention</div>
              {data.points_attention.map((p, i) => <div key={i} style={{ fontSize: '.85rem', color: 'rgba(255,255,255,.75)' }}>• {p}</div>)}
            </div>
          )}
        </div>

        {data.ajustement_semaine_suivante && (
          <div style={{ background: 'rgba(139,47,201,.15)', border: '1px solid rgba(139,47,201,.3)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ fontWeight: 600, marginBottom: '.4rem', fontSize: '.875rem', color: '#C084FC' }}>🎯 Ajustement semaine suivante</div>
            <p style={{ fontSize: '.9rem', color: 'rgba(255,255,255,.8)' }}>{data.ajustement_semaine_suivante}</p>
          </div>
        )}

        {/* Editable message */}
        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
          <label className="form-label">💬 Message à envoyer à {athlete?.first_name}</label>
          <textarea className="form-textarea" style={{ minHeight: 140 }}
            value={message} onChange={e => setMessage(e.target.value)} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '.5rem' }}>
            <button className="btn btn-ghost btn-sm" disabled={saving} onClick={save}>
              {saving ? 'Sauvegarde…' : '💾 Sauvegarder le brouillon'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '.75rem' }}>
          <button className="btn btn-ghost btn-sm flex-1" onClick={onClose}>Fermer</button>
          <button className="btn btn-primary btn-sm flex-1" disabled={sending || !message.trim()} onClick={sendToAthlete}>
            {sending ? <><div className="spinner spinner-sm" /> Envoi…</> : '📤 Envoyer à l\'athlète'}
          </button>
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
  const [generating, setGenerating] = useState(false)

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
      <h2 style={{ marginBottom: '1.5rem' }}>Analyses hebdomadaires</h2>

      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {[
          { v: 'pending', l: `À envoyer (${analyses.filter(a => a.status === 'pending').length})` },
          { v: 'sent',    l: 'Envoyées' },
          { v: 'all',     l: 'Toutes' },
        ].map(f => (
          <button key={f.v} className={`btn btn-sm ${filter === f.v ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter(f.v)}>{f.l}</button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filtered.map(analysis => {
          const athlete = athletes[analysis.user_id]
          const data    = analysis.analysis_data || {}
          return (
            <div key={analysis.id} className="card"
              style={{ borderLeft: `4px solid ${analysis.status === 'pending' ? 'var(--warning)' : 'var(--success)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '.5rem' }}>
                    <div className="chat-avatar" style={{ width: 32, height: 32, fontSize: '.8rem' }}>
                      {athlete?.first_name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700 }}>{athlete?.first_name} {athlete?.last_name}</div>
                      <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>Semaine {analysis.week_number}</div>
                    </div>
                  </div>
                  {data.resume && (
                    <p style={{ fontSize: '.875rem', color: 'var(--text-muted)', maxWidth: 400,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {data.resume}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className={`badge ${analysis.status === 'pending' ? 'badge-warning' : 'badge-success'}`}>
                    {analysis.status === 'pending' ? '⏳ À envoyer' : '✅ Envoyée'}
                  </span>
                  <span style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>
                    {new Date(analysis.created_at).toLocaleDateString('fr-FR')}
                  </span>
                  <button className="btn btn-primary btn-sm"
                    onClick={() => setModal({ analysis, athlete })}>
                    {analysis.status === 'pending' ? '📤 Réviser et envoyer' : '👁 Voir'}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
            <p className="text-muted">Aucune analyse dans cette catégorie.</p>
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
