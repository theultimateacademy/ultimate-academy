import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        setLoading(true)
        loadProfile(session.user.id)
      } else { setProfile(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(userId) {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
      if (error) throw error
      setProfile(data)
    } catch (err) {
      console.error('Profile load error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function refreshProfile() {
    if (user) await loadProfile(user.id)
  }

  function updateProfile(partial) {
    setProfile(prev => prev ? { ...prev, ...partial } : prev)
  }

  async function signUp(email, password, firstName, lastName) {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { first_name: firstName, last_name: lastName } }
    })
    if (error) throw error
    return data
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    if (error) throw error
  }

  const isCoach    = profile?.role === 'coach'
  const isActive   = ['active', 'trialing'].includes(profile?.subscription_status)
  const isTrialing = profile?.subscription_status === 'trialing'
  const hasProfile = profile?.profile_completed === true

  return (
    <AuthContext.Provider value={{
      user, profile, loading,
      signUp, signIn, signOut, resetPassword,
      refreshProfile, updateProfile,
      isCoach, isActive, isTrialing, hasProfile
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
