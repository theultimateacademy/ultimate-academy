import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../lib/api'
import { supabase } from '../../lib/supabase'

export default function Register() {
  const { signUp, signIn, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sport = searchParams.get('sport') || localStorage.getItem('sport_type') || 'running'
  const isTriathlon = sport === 'triathlon'

  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirm: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep]     = useState('form')  // 'form' | 'redirecting'

  const isDev = import.meta.env.DEV

  useEffect(() => {
    if (sport) localStorage.setItem('sport_type', sport)
  }, [sport])

  const handleDevBypass = () => {
    window.location.href = '/dev-login'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) { setError('Les mots de passe ne correspondent pas.'); return }
    if (form.password.length < 8)       { setError('Le mot de passe doit comporter au moins 8 caractères.'); return }
    setLoading(true)

    try {
      const data = await signUp(form.email, form.password, form.firstName, form.lastName)
      const userId = data.user?.id
      if (!userId) throw new Error('Compte créé ! Vérifie ton email pour confirmer.')

      // Coach account bypasses Stripe entirely
      if (data.user?.user_metadata?.role === 'coach' || form.email === 'alexiselie1912@gmail.com') {
        navigate('/admin')
        return
      }

      // Whitelisted free accounts — bypass Stripe, activate directly
      const FREE_EMAILS = ['anouklothe@gmail.com']
      if (FREE_EMAILS.includes(form.email.toLowerCase())) {
        try {
          await api.freeActivate({ userId, email: form.email.toLowerCase() })
        } catch (err) {
          console.warn('freeActivate failed (server may be deploying):', err.message)
          // Continue anyway — server will activate on next request or manual retry
        }
        navigate('/onboarding')
        return
      }

      setStep('redirecting')
      const { url } = await api.createCheckout({
        userId,
        email:     form.email,
        firstName: form.firstName,
        lastName:  form.lastName,
        sport,
      })
      window.location.href = url
    } catch (err) {
      // If already registered, try to log them in (free email path)
      const FREE_EMAILS = ['anouklothe@gmail.com']
      if (
        err.message?.toLowerCase().includes('already registered') &&
        FREE_EMAILS.includes(form.email.toLowerCase())
      ) {
        try {
          await signIn(form.email, form.password)
          await api.freeActivate({ userId: (await supabase.auth.getUser()).data.user?.id, email: form.email.toLowerCase() }).catch(() => {})
          navigate('/onboarding')
          return
        } catch {
          setError('Compte déjà existant. Connecte-toi depuis la page de connexion.')
        }
      } else {
        setError(err.message || 'Une erreur est survenue.')
      }
      setStep('form')
      setLoading(false)
    }
  }

  if (step === 'redirecting') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1.5rem', background: 'var(--bg)' }}>
        <div className="spinner" />
        <p className="text-muted">Redirection vers le paiement sécurisé…</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <header style={{ padding: '1.25rem', display: 'flex', justifyContent: 'center' }}>
        <Link to="/">
          <img src="/Logo.png" alt="The Ultimate Academy" style={{ height: 200, width: 'auto', objectFit: 'contain' }} />
        </Link>
      </header>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
        <div className="card" style={{ width: '100%', maxWidth: 460, padding: '2rem' }}>
          <h2 style={{ marginBottom: '.4rem' }}>Commencer mon essai gratuit</h2>
          <p className="text-muted text-sm" style={{ marginBottom: '.5rem' }}>
            14 jours gratuits · puis <strong>{isTriathlon ? '50€' : '30€'}/mois</strong> · annulable à tout moment
          </p>
          <p className="text-muted text-sm" style={{ marginBottom: '1.25rem', fontSize: '.8rem' }}>
            {isTriathlon ? '🏊 Triathlon' : sport === 'trail' ? '⛰️ Trail' : '🏃 Course à pied'}
            {' '}· <Link to="/choisir-sport" style={{ color: 'var(--primary)', fontWeight: 500 }}>Changer</Link>
          </p>

          {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>⚠️ {error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Prénom</label>
                <input className="form-input" required
                  value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                  placeholder="Prénom" />
              </div>
              <div className="form-group">
                <label className="form-label">Nom</label>
                <input className="form-input" required
                  value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                  placeholder="Nom" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" required
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="ton@email.com" autoComplete="email" />
            </div>

            <div className="form-group">
              <label className="form-label">Mot de passe</label>
              <input type="password" className="form-input" required
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="8 caractères minimum" autoComplete="new-password" />
            </div>

            <div className="form-group">
              <label className="form-label">Confirmer le mot de passe</label>
              <input type="password" className="form-input" required
                value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                placeholder="••••••••" autoComplete="new-password" />
            </div>

            <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius)', padding: '.875rem', fontSize: '.85rem' }}>
              <div style={{ fontWeight: 600, marginBottom: '.35rem' }}>🔒 Paiement sécurisé via Stripe</div>
              <div className="text-muted">Carte requise · Aucun débit pendant 14 jours · Annulable avant</div>
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}
              style={{ whiteSpace: 'normal', lineHeight: 1.4, padding: '.9rem 1.25rem', fontSize: '1rem' }}>
              {loading ? <><div className="spinner spinner-sm" /> Création…</> : 'Créer mon compte et démarrer l\'essai'}
            </button>

          </form>

          {isDev && (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ textAlign: 'center', fontSize: '.75rem', color: 'var(--text-muted)', marginBottom: '.5rem' }}>
                [ DEV ONLY ]
              </div>
              <button
                onClick={handleDevBypass}
                disabled={loading}
                style={{
                  width: '100%', padding: '.75rem', cursor: 'pointer',
                  background: '#2d2d2d', color: '#f59e0b',
                  border: '1.5px dashed #f59e0b', borderRadius: 'var(--radius)',
                  fontWeight: 600, fontSize: '.85rem', fontFamily: 'inherit'
                }}>
                {loading ? '⏳ Connexion en cours…' : '🛠 Accès test (dev only), bypass Stripe'}
              </button>
            </div>
          )}

          <p className="text-center text-sm text-muted" style={{ marginTop: '1.5rem' }}>
            Déjà membre ?{' '}
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Se connecter</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
