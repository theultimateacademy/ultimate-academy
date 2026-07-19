import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { api } from '../../lib/api'
import LoadingSpinner from '../../components/UI/LoadingSpinner'

function Conversation({ athlete, onBack }) {
  const [messages,   setMessages]   = useState([])
  const [input,      setInput]      = useState('')
  const [sending,    setSending]    = useState(false)
  const [generating, setGenerating] = useState(false)
  const [suggestion, setSuggestion] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    loadMessages()

    const sub = supabase.channel(`conv-${athlete.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages',
          filter: `user_id=eq.${athlete.id}` },
        payload => {
          setMessages(prev => prev.find(m => m.id === payload.new.id) ? prev : [...prev, payload.new])
          // Mark incoming athlete message as read immediately since coach is viewing
          if (payload.new.sender === 'athlete') {
            supabase.from('messages').update({ read: true }).eq('id', payload.new.id)
          }
        })
      .subscribe()
    return () => sub.unsubscribe()
  }, [athlete.id])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function loadMessages() {
    const { data } = await supabase
      .from('messages').select('*').eq('user_id', athlete.id)
      .order('created_at', { ascending: true })
    setMessages(data || [])
    const unreadIds = (data || []).filter(m => m.sender === 'athlete' && !m.read).map(m => m.id)
    if (unreadIds.length > 0) {
      await supabase.from('messages').update({ read: true }).in('id', unreadIds)
    }
  }

  async function generateSuggestion() {
    setGenerating(true)
    try {
      const last10 = messages.slice(-10)
      const { suggestion } = await api.generateResponse({ athleteId: athlete.id, lastMessages: last10 })
      setSuggestion(suggestion)
      setInput(suggestion)
    } catch (err) {
      console.error(err)
    } finally {
      setGenerating(false)
    }
  }

  async function send(e) {
    e.preventDefault()
    if (!input.trim() || sending) return
    setSending(true)
    const content = input.trim()
    setInput('')
    setSuggestion('')
    try {
      const { data } = await supabase.from('messages').insert({
        user_id: athlete.id, sender: 'coach', content
      }).select().single()
      if (data) setMessages(prev => prev.find(m => m.id === data.id) ? prev : [...prev, data])
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '1rem', background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: '.75rem', flexShrink: 0, overflow: 'hidden' }}>
        <button className="btn-icon" onClick={onBack} style={{ flexShrink: 0 }}>←</button>
        <div className="chat-avatar" style={{ flexShrink: 0, overflow:'hidden', padding:0 }}>
          {athlete.avatar_url
            ? <img src={athlete.avatar_url} alt={athlete.first_name} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }} />
            : athlete.first_name?.[0]?.toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{athlete.first_name} {athlete.last_name}</div>
          <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{athlete.email}</div>
        </div>
        <div style={{ flexShrink: 0 }}>
          <button className="btn btn-secondary btn-sm" disabled={generating} onClick={generateSuggestion}>
            {generating ? <><div className="spinner spinner-sm" /> <span className="suggest-btn-label">Génération…</span></> : <>✨ <span className="suggest-btn-label">Suggérer une réponse</span></>}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        <div className="chat-list">
          {messages.map(msg => (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column',
              alignItems: msg.sender === 'coach' ? 'flex-end' : 'flex-start' }}>
              {msg.sender === 'athlete' && (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '.5rem' }}>
                  <div className="chat-avatar" style={{ width: 28, height: 28, fontSize: '.75rem', overflow:'hidden', padding:0 }}>
                    {athlete.avatar_url
                      ? <img src={athlete.avatar_url} alt={athlete.first_name} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }} />
                      : athlete.first_name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="chat-bubble coach">{msg.content}</div>
                    <div className="chat-meta">{new Date(msg.created_at).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</div>
                  </div>
                </div>
              )}
              {msg.sender === 'coach' && (
                <div>
                  <div className="chat-bubble athlete">{msg.content}</div>
                  <div className="chat-meta" style={{ textAlign: 'right' }}>{new Date(msg.created_at).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</div>
                </div>
              )}
            </div>
          ))}
        </div>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={send} style={{ padding: '1rem', background: 'var(--surface)',
        borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        {suggestion && (
          <div style={{ background: 'rgba(139,47,201,.15)', border: '1px solid rgba(139,47,201,.3)', borderRadius: 'var(--radius)',
            padding: '.75rem', marginBottom: '.75rem', fontSize: '.875rem', color: 'rgba(255,255,255,.85)' }}>
            <div style={{ fontWeight: 600, marginBottom: '.3rem', fontSize: '.75rem', color: '#C084FC' }}>
              ✨ Suggestion (modifiable)
            </div>
            {suggestion}
          </div>
        )}
        <div style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-end' }}>
          <textarea
            value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(e) } }}
            placeholder="Répondre en tant qu'Alexis…"
            rows={2}
            style={{ flex: 1, resize: 'none', border: '1.5px solid var(--border)',
              borderRadius: 12, padding: '.75rem 1rem', fontSize: '.9375rem',
              fontFamily: 'inherit', outline: 'none', background: 'var(--bg)',
              color: 'var(--text)', maxHeight: 150, overflowY: 'auto' }}
          />
          <button type="submit" className="btn btn-primary" disabled={!input.trim() || sending}>
            {sending ? '…' : 'Envoyer'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function AdminMessaging() {
  const [athletes,  setAthletes]   = useState([])
  const [unread,    setUnread]     = useState({})
  const [selected,  setSelected]   = useState(null)
  const [loading,   setLoading]    = useState(true)
  const [lastMsgs,  setLastMsgs]   = useState({})

  useEffect(() => { loadConversations() }, [])

  async function loadConversations() {
    setLoading(true)
    try {
      const { data: profiles } = await supabase
        .from('profiles').select('id, first_name, last_name, email, avatar_url')
        .eq('role', 'athlete').order('first_name')

      const ids = (profiles || []).map(p => p.id)

      const [{ data: unreadMsgs }, { data: lastMessages }] = await Promise.all([
        supabase.from('messages').select('user_id').eq('sender', 'athlete').eq('read', false).in('user_id', ids),
        supabase.from('messages').select('user_id, content, created_at, sender').in('user_id', ids).order('created_at', { ascending: false })
      ])

      // Count unread per user
      const unreadMap = {}
      ;(unreadMsgs || []).forEach(m => { unreadMap[m.user_id] = (unreadMap[m.user_id] || 0) + 1 })

      // Last message per user
      const lastMap = {}
      ;(lastMessages || []).forEach(m => { if (!lastMap[m.user_id]) lastMap[m.user_id] = m })

      // Sort: unread first, then by last message
      const sorted = (profiles || []).sort((a, b) => {
        const aUnread = unreadMap[a.id] || 0
        const bUnread = unreadMap[b.id] || 0
        if (aUnread !== bUnread) return bUnread - aUnread
        const aLast = lastMap[a.id]?.created_at || ''
        const bLast = lastMap[b.id]?.created_at || ''
        return bLast.localeCompare(aLast)
      })

      setAthletes(sorted)
      setUnread(unreadMap)
      setLastMsgs(lastMap)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner fullPage />

  return (
    <div className="admin-chat-screen" style={{ height: '100vh', display: 'flex', overflow: 'hidden' }}>
      {/* Sidebar list */}
      <div style={{ width: 280, flexShrink: 0, borderRight: '1px solid var(--border)',
        overflowY: 'auto', background: 'var(--surface)', display: selected ? 'none' : 'block' }}
        className="messaging-list">
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)' }}>
          <h3>Messagerie</h3>
        </div>
        {athletes.map(a => {
          const u = unread[a.id] || 0
          const last = lastMsgs[a.id]
          return (
            <div key={a.id}
              style={{ padding: '.875rem 1.25rem', borderBottom: '1px solid var(--border)',
                cursor: 'pointer', background: selected?.id === a.id ? 'var(--surface-2)' : 'transparent',
                transition: 'background .15s' }}
              onClick={() => { setSelected(a); loadConversations() }}>
              <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <div className="chat-avatar" style={{ width: 36, height: 36, fontSize: '.9rem', overflow:'hidden', padding:0 }}>
                    {a.avatar_url
                      ? <img src={a.avatar_url} alt={a.first_name} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }} />
                      : a.first_name?.[0]?.toUpperCase()}
                  </div>
                  {u > 0 && (
                    <div style={{ position: 'absolute', top: -2, right: -2,
                      background: 'var(--error)', color: '#fff', width: 16, height: 16,
                      borderRadius: '50%', fontSize: '.65rem', fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{u}</div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: u > 0 ? 700 : 500 }}>{a.first_name} {a.last_name}</div>
                  {last && (
                    <div style={{ fontSize: '.75rem', color: 'var(--text-muted)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {last.sender === 'coach' ? 'Toi : ' : ''}{last.content}
                    </div>
                  )}
                </div>
                {last && (
                  <div style={{ fontSize: '.7rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                    {new Date(last.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </div>
                )}
              </div>
            </div>
          )
        })}
        {athletes.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '.9rem' }}>
            Aucun athlète inscrit.
          </div>
        )}
      </div>

      {/* Conversation */}
      <div style={{ flex: 1, flexDirection: 'column', minWidth: 0,
        display: selected ? 'flex' : 'none' }} className="messaging-conv">
        {selected ? (
          <Conversation
            athlete={selected}
            onBack={() => { setSelected(null); loadConversations() }}
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>💬</div>
              <p>Sélectionne un athlète pour voir la conversation</p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media (min-width: 768px) {
          .messaging-list { display: block !important; }
          .messaging-conv { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
