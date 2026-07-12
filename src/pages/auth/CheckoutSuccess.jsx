import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { api } from '../../lib/api'

const FREE_EMAILS = ['anouklothe@gmail.com']

export default function CheckoutSuccess() {
  const { profile, refreshProfile, user } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const sessionId = params.get('session_id')

  // true = coming from Stripe redirect (has session_id)
  // false = redirected from RequireActive (no session_id, subscription not active)
  const fromStripe = !!sessionId

  const [activating,      setActivating]      = useState(fromStripe)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError,   setCheckoutError]   = useState('')

  // Free accounts: activate directly
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

  // Poll until subscription activates — only when coming from Stripe
  useEffect(() => {
    if (!fromStripe) return                                        // ← no poll if no session_id
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
  }, [fromStripe, profile?.subscription_status])

  const isReady = ['active', 'trialing'].includes(profile?.subscription_status)

  function goToApp() {
    if (profile?.profile_completed) {
      navigate('/app/home', { replace: true })   // navigate, pas window.location.replace
    } else {
      navigate('/onboarding', { replace: true })
    }
  }

  async function handleRetryCheckout() {
    if (!user?.id || !user?.email) return
    setCheckoutLoading(true)
    setCheckoutError('')
    try {
      const { url } = await api.createCheckout({
        userId:    user.id,
        email:     user.email,
        firstName: profile?.first_name || '',
        lastName:  profile?.last_name  || '',
      })
      window.location.href = url
    } catch (err) {
      setCheckoutError('Impossible de démarrer le paiement. Réessaie dans quelques instants.')
      setCheckoutLoading(false)
    }
  }

  // ── UI quand pas de session_id (redirigé depuis RequireActive) ──
  if (!fromStripe && !isReady) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'radial-gradient(ellipse at 50% 20%, rgba(139,47,201,.12) 0%, transparent 60%), var(--bg)',
        padding: '1.5rem'
      }}>
        <div className="card" style={{ maxWidth: 480, width: '100%', padding: '2.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
          <h2 style={{ marginBottom: '.75rem', fontSize: 'clamp(1.2rem,4vw,1.5rem)' }}>
            Finalise ton inscription
          </h2>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.75, marginBottom: '2rem', fontSize: '.95rem' }}>
            Ton profil est créé mais ton abonnement n'est pas encore activé.
            <br />
            <strong style={{ color: 'var(--text)' }}>Complète le paiement pour accéder à ton espace.</strong>
          </p>

          {checkoutError && (
            <div className="alert alert-error" style={{ marginBottom: '1rem', textAlign: 'left' }}>
              ⚠️ {checkoutError}
            </div>
          )}

          <button
            onClick={handleRetryCheckout}
            disabled={checkoutLoading}
            style={{
              width: '100%', padding: '1.1rem', borderRadius: 14,
              background: 'linear-gradient(135deg, #8B2FC9, #E8237A)',
              color: '#fff', border: 'none', fontWeight: 800, fontSize: '1rem',
              cursor: checkoutLoading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', letterSpacing: '.02em',
              boxShadow: '0 6px 24px rgba(232,35,122,.35)',
              opacity: checkoutLoading ? .7 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem',
            }}>
            {checkoutLoading ? <><div className="spinner spinner-sm" /> Redirection…</> : 'Finaliser mon abonnement →'}
          </button>

          <p style={{ marginTop: '1rem', fontSize: '.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            14 jours gratuits · puis 30€/mois · annulable à tout moment
          </p>
        </div>
      </div>
    )
  }

  // ── UI post-Stripe (avec session_id) ──
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 50% 20%, rgba(139,47,201,.12) 0%, transparent 60%), var(--bg)',
      padding: '1.5rem'
    }}>
      <div className="card" style={{ maxWidth: 480, width: '100%', padding: '2.5rem', textAlign: 'center' }}>

        <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🎉</div>

        <h2 style={{ marginBottom: '1rem', fontSize: 'clamp(1.3rem,4vw,1.7rem)', lineHeight: 1.2 }}>
          Bienvenue dans{' '}
          <span className="gradient-text">The Ultimate Academy !</span>
        </h2>

        <p style={{ color: 'var(--text-muted)', lineHeight: 1.75, marginBottom: '2rem', fontSize: '.95rem' }}>
          Ton profil est enregistré.<br />
          <strong style={{ color: 'var(--text)' }}>
            Ton coach prépare ton plan personnalisé.
          </strong>
          <br />
          Tu le recevras dans les 24h.
        </p>

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

        <button
          onClick={goToApp}
          disabled={activating && !isReady}
          style={{
            width: '100%', padding: '1.1rem', borderRadius: 14,
            background: 'linear-gradient(135deg, #8B2FC9, #E8237A)',
            color: '#fff', border: 'none', fontWeight: 800, fontSize: '1rem',
            cursor: (activating && !isReady) ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', letterSpacing: '.02em',
            boxShadow: '0 6px 24px rgba(232,35,122,.35)',
            opacity: (activating && !isReady) ? .5 : 1,
            transition: 'opacity .15s',
          }}
          onMouseEnter={e => { if (!activating || isReady) e.currentTarget.style.opacity = '.9' }}
          onMouseLeave={e => { if (!activating || isReady) e.currentTarget.style.opacity = '1' }}>
          Accéder à mon espace →
        </button>

        <p style={{ marginTop: '1rem', fontSize: '.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Tu peux déjà explorer ton espace<br />
          en attendant ton plan personnalisé.
        </p>

      </div>
    </div>
  )
}
