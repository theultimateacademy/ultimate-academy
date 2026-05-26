import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import LoadingSpinner from '../../components/UI/LoadingSpinner'

export default function AthleteMessages() {
  const { profile } = useAuth()
  const [messages, setMessages] = useState([])
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(true)
  const [sending,  setSending]  = useState(false)
  const bottomRef  = useRef(null)

  useEffect(() => {
    if (!profile?.id) return
    loadMessages()

    const sub = supabase.channel('messages-channel')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `user_id=eq.${profile.id}`
      }, payload => {
        setMessages(prev => [...prev, payload.new])
        // Mark coach messages as read
        if (payload.new.sender === 'coach') {
          supabase.from('messages').update({ read: true }).eq('id', payload.new.id)
        }
      })
      .subscribe()

    return () => sub.unsubscribe()
  }, [profile?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadMessages() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: true })
      setMessages(data || [])

      // Mark unread coach messages as read
      const unreadIds = (data || []).filter(m => m.sender === 'coach' && !m.read).map(m => m.id)
      if (unreadIds.length > 0) {
        await supabase.from('messages').update({ read: true }).in('id', unreadIds)
      }
    } finally {
      setLoading(false)
    }
  }

  async function sendMessage(e) {
    e.preventDefault()
    if (!input.trim() || sending) return
    setSending(true)
    const content = input.trim()
    setInput('')
    try {
      await supabase.from('messages').insert({
        user_id: profile.id,
        sender: 'athlete',
        content
      })
    } finally {
      setSending(false)
    }
  }

  if (loading) return <LoadingSpinner fullPage text="Chargement des messages…" />

  return (
    <div className="chat-screen" style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      {/* Header */}
      <div style={{ padding: '1rem 1.25rem', background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: '.875rem', flexShrink: 0 }}>
        <img src="/Coach.JPG" alt="Alexis" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
        <div>
          <div style={{ fontWeight: 700 }}>Alexis</div>
          <div style={{ fontSize: '.75rem', color: 'var(--success)' }}>● Ton coach</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>💬</div>
            <h4 style={{ marginBottom: '.5rem' }}>C'est ici que tu parles avec Alexis</h4>
            <p className="text-muted text-sm">
              Pose tes questions, partage tes ressentis, ou dis-lui tout ce que tu veux qu'il sache sur ta progression.
            </p>
          </div>
        )}

        <div className="chat-list">
          {messages.map(msg => (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column',
              alignItems: msg.sender === 'athlete' ? 'flex-end' : 'flex-start' }}>
              {msg.sender === 'coach' && (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '.5rem' }}>
                  <img src="/Coach.JPG" alt="Alexis" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  <div>
                    <div className="chat-bubble coach">{msg.content}</div>
                    <div className="chat-meta">{new Date(msg.created_at).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</div>
                  </div>
                </div>
              )}
              {msg.sender === 'athlete' && (
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
      <form onSubmit={sendMessage} style={{ padding: '1rem 1.25rem',
        background: 'var(--surface)', borderTop: '1px solid var(--border)',
        display: 'flex', gap: '.75rem', alignItems: 'flex-end',
        paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))',
        flexShrink: 0 }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e) } }}
          placeholder="Écris à ton coach…"
          rows={1}
          style={{ flex: 1, resize: 'none', border: '1.5px solid var(--border)',
            borderRadius: 20, padding: '.65rem 1rem', fontSize: '.9375rem',
            fontFamily: 'inherit', background: 'var(--bg)', outline: 'none',
            maxHeight: 120, overflowY: 'auto' }}
          onInput={e => {
            e.target.style.height = 'auto'
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
          }}
        />
        <button type="submit" disabled={!input.trim() || sending}
          style={{ width: 42, height: 42, borderRadius: '50%', border: 'none',
            background: input.trim() ? 'var(--gradient)' : 'var(--border)',
            color: '#fff', cursor: input.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem', flexShrink: 0, transition: 'background .2s' }}>
          {sending ? <div className="spinner spinner-sm" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,.3)' }} /> : '➤'}
        </button>
      </form>
    </div>
  )
}
