import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../lib/api'

const FREE_EMAILS = ['anouklothe@gmail.com']

export default function CheckoutSuccess() {
  const { profile, refreshProfile, user } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const sessionId = params.get('session_id')

  // Retry free activation for whitelisted accounts (server may have been sleeping at registration)
  useEffect(() => {
    if (!user?.id || !user?.email) return
    if (!FREE_EMAILS.includes(user.email.toLowerCase())) return
    if (['active', 'trialing'].includes(profile?.subscription_status)) return
    api.freeActivate({ userId: user.id, email: user.email.toLowerCase() })
      .then(() => refreshProfile())
      .catch(() => {})
  }, [user?.id])

  useEffect(() => {
    if (['active', 'trialing'].includes(profile?.subscription_status)) return

    // Poll until active/trialing
    let attempts = 0
    const interval = setInterval(async () => {
      await refreshProfile()
      attempts++
      if (attempts > 20) clearInterval(interval)
    }, 2000)
    return () => clearInterval(interval)
  }, [sessionId])

  useEffect(() => {
    if (['active', 'trialing'].includes(profile?.subscription_status)) {
      navigate(profile.profile_completed ? '/app/home' : '/onboarding', { replace: true })
    }
  }, [profile?.subscription_status])


  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '1.5rem' }}>
      <div className="card" style={{ maxWidth: 480, width: '100%', padding: '2.5rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🎉</div>
        <h2 style={{ marginBottom: '1rem' }}>
          Bienvenue dans{' '}
          <span className="gradient-text">The Ultimate Academy !</span>
        </h2>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '1.75rem' }}>
          Je prépare déjà ton espace.
          <strong style={{ display: 'block', marginTop: '.5rem', color: 'var(--text)' }}>
            Commence par remplir ton profil, cela ne prend que 2 minutes.
          </strong>
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '.875rem' }}>
          <div className="spinner spinner-sm" />
          Activation de ton abonnement…
        </div>
        <button className="btn btn-primary btn-full mt-6"
          onClick={() => navigate('/onboarding')}>
          Remplir mon profil maintenant →
        </button>
      </div>
    </div>
  )
}
