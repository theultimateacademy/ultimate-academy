import { createContext, useContext, useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const BadgesContext = createContext({ plans: 0, analyses: 0, messages: 0 })

export function useBadges() {
  return useContext(BadgesContext)
}

export function BadgesProvider({ children }) {
  const [badges, setBadges] = useState({ plans: 0, analyses: 0, messages: 0 })
  const location = useLocation()

  async function load() {
    const [{ count: plans }, { count: analyses }, { count: msgs }] = await Promise.all([
      supabase.from('training_plans').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('weekly_analyses').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('messages').select('id', { count: 'exact', head: true }).eq('sender', 'athlete').eq('read', false)
    ])
    const onMessagesPage = window.location.pathname === '/admin/messages'
    setBadges({ plans: plans || 0, analyses: analyses || 0, messages: onMessagesPage ? 0 : (msgs || 0) })
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 15000)
    const sub = supabase.channel('admin-badges-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, load)
      .subscribe()
    return () => { clearInterval(interval); sub.unsubscribe() }
  }, [])

  useEffect(() => {
    if (location.pathname === '/admin/messages') {
      setBadges(b => ({ ...b, messages: 0 }))
    }
  }, [location.pathname])

  return (
    <BadgesContext.Provider value={badges}>
      {children}
    </BadgesContext.Provider>
  )
}
