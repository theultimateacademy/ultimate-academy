import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

const FREE_EMAILS = ['anouklothe@gmail.com']

export default function CheckoutSuccess() {
  const { profile, refreshProfile, user } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const sessionId = params.get('session_id')
  const [activating, setActivating] = useState(true)

  // Free accounts: activate directly in Supabase
  useEffect(() => {
    if (!user?.id || !user?.email) return
    if (!FREE_EMAILS.includes(user.email.toLowerCase())) return
    if (['active', 'trialing'].includes(profile?.subscription_status)) return
    supabase.from('profiles')
      .update({ subscription_status: 'active' })
      .eq('id', user.id)
      .then(() => refreshProfile())
      .catch(() => {})
  }, [user?.id])

  // Poll until subscription activates
  useEffect(() => {
    if (['active', 'trialing'].includes(profile?.subscription_status)) {
      setActivating(false)
      return
    }
    let attempts = 0
    const interval = setInterval(async () => {
      await refreshProfile()
      attempts++
      if (attempts > 20) { clearInterval(interval); setActivating(false) }
    }, 2000)
    return () => clearInterval(interval)
  }, [sessionId, profile?.subscription_status])

  function goToApp() {
    // Force full reload so AuthContext re-reads profile_completed from DB
    if (profile?.profile_completed) {
      window.location.replace('/app/home')
    } else {
      navigate('/onboarding', { replace: true })
    }
  }

  const isReady = ['active', 'trialing'].includes(profile?.subscription_status)

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 50% 20%, rgba(139,47,201,.12) 0%, transparent 60%), var(--bg)',
      padding: '1.5rem'
    }}>
      <div className="card" style={{ maxWidth: 480, width: '100%', padding: '2.5rem', textAlign: 'center' }}>

        {/* Icon */}
        <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🎉</div>

        {/* Title */}
        <h2 style={{ marginBottom: '1rem', fontSize: 'clamp(1.3rem,4vw,1.7rem)', lineHeight: 1.2 }}>
          Bienvenue dans{' '}
          <span className="gradient-text">The Ultimate Academy !</span>
        </h2>

        {/* Description */}
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.75, marginBottom: '2rem', fontSize: '.95rem' }}>
          Ton profil est enregistré.<br />
          <strong style={{ color: 'var(--text)' }}>
            Ton coach prépare ton plan personnalisé.
          </strong>
          <br />
          Tu le recevras dans les 24h.
        </p>

        {/* Activation status */}
        {activating && !isReady && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '.75rem', justifyContent: 'center',
            color: 'var(--text-muted)', fontSize: '.875rem', marginBottom: '1.5rem',
            background: 'var(--surface-2)', borderRadius: 10, padding: '.75rem 1.25rem'
          }}>
            <div className="spinner spinner-sm" />
            Activation de ton accès…
          </div>
        )}

        {/* CTA Button */}
        <button
          onClick={goToApp}
          style={{
            width: '100%', padding: '1.1rem', borderRadius: 14,
            background: 'linear-gradient(135deg, #8B2FC9, #E8237A)',
            color: '#fff', border: 'none', fontWeight: 800, fontSize: '1rem',
            cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '.02em',
            boxShadow: '0 6px 24px rgba(232,35,122,.35)',
            transition: 'opacity .15s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '.9'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          Accéder à mon espace →
        </button>

        {/* Reassurance */}
        <p style={{
          marginTop: '1rem', fontSize: '.82rem', color: 'var(--text-muted)',
          lineHeight: 1.6
        }}>
          Tu peux déjà explorer ton espace<br />
          en attendant ton plan personnalisé.
        </p>

      </div>
    </div>
  )
}
