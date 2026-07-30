import { useState } from 'react'
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const COACH_EMAIL = 'alexiselie1912@gmail.com'

const glowStyle = `
  .login-bg {
    position: fixed; inset: 0; overflow: hidden; pointer-events: none; z-index: 0;
  }
  .login-bg::before {
    content: ''; position: absolute;
    width: 600px; height: 600px; border-radius: 50%;
    background: radial-gradient(circle, rgba(139,47,201,.18) 0%, transparent 70%);
    top: -150px; left: -150px;
  }
  .login-bg::after {
    content: ''; position: absolute;
    width: 500px; height: 500px; border-radius: 50%;
    background: radial-gradient(circle, rgba(232,35,122,.14) 0%, transparent 70%);
    bottom: -100px; right: -100px;
  }
  .role-card {
    position: relative; overflow: hidden;
    padding: 2rem 1rem 1.75rem; border-radius: 18px;
    border: 1.5px solid rgba(139,47,201,.3);
    background: linear-gradient(160deg, rgba(139,47,201,.12) 0%, rgba(22,19,42,.95) 60%);
    cursor: pointer; text-align: center; color: #fff;
    transition: border-color .2s, transform .15s, box-shadow .2s;
    font-family: inherit;
  }
  .role-card::before {
    content: ''; position: absolute; inset: 0; opacity: 0;
    background: linear-gradient(135deg, rgba(139,47,201,.22), rgba(232,35,122,.12));
    transition: opacity .2s;
  }
  .role-card:hover { border-color: rgba(232,35,122,.7); transform: translateY(-3px); box-shadow: 0 10px 32px rgba(232,35,122,.2); }
  .role-card:hover::before { opacity: 1; }
  .role-icon {
    width: 52px; height: 52px; border-radius: 14px; font-size: 1.6rem;
    background: linear-gradient(135deg, rgba(139,47,201,.3), rgba(232,35,122,.2));
    border: 1px solid rgba(139,47,201,.35);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto .9rem; position: relative; z-index: 1;
  }
  .login-card {
    width: 100%; max-width: 460px;
    background: rgba(22,19,42,.85);
    border: 1px solid rgba(139,47,201,.2);
    border-radius: 24px;
    box-shadow: 0 24px 64px rgba(0,0,0,.5), 0 0 0 1px rgba(139,47,201,.08);
    padding: 2.5rem 2rem;
    backdrop-filter: blur(16px);
  }
  .divider-line {
    height: 1px; flex: 1;
    background: linear-gradient(90deg, transparent, rgba(139,47,201,.3), transparent);
  }
  .back-btn {
    display: inline-flex; align-items: center; gap: .35rem;
    background: none; border: none; cursor: pointer;
    color: rgba(255,255,255,.42); font-size: .85rem;
    padding: 0; margin-bottom: 1.5rem; font-family: inherit;
    transition: color .15s;
  }
  .back-btn:hover { color: rgba(255,255,255,.75); }
  .role-badge {
    display: inline-flex; align-items: center; gap: .5rem;
    background: rgba(139,47,201,.15); border: 1px solid rgba(139,47,201,.3);
    border-radius: 100px; padding: .35rem .9rem;
    font-size: .8rem; font-weight: 600; color: #C084FC;
    margin-bottom: 1.5rem;
  }
`

export default function Login() {
  const { signIn, resetPassword, profile, loading } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [mode, setMode]       = useState(null)
  const [form, setForm]       = useState({ email: '', password: '' })
  const [error, setError]     = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createMsg, setCreateMsg] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  const handleCreateCoach = async () => {
    if (!form.password || form.password.length < 8) {
      setError('Entre un mot de passe (8 caractères min) avant de créer le compte.')
      return
    }
    setCreating(true); setError(''); setCreateMsg('')
    try {
      const res  = await fetch('/api/dev/setup-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: COACH_EMAIL, password: form.password })
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error)
      setCreateMsg('Compte créé ! Clique sur "Accéder à mon espace".')
    } catch (err) {
      setError(err.message || 'Erreur création compte')
    } finally {
      setCreating(false)
    }
  }

  const from = location.state?.from?.pathname || null

  if (!loading && profile) {
    if (profile.role === 'coach') return <Navigate to="/admin" replace />
    if (!['active', 'trialing'].includes(profile.subscription_status)) return <Navigate to="/welcome" replace />
    if (!profile.profile_completed) return <Navigate to="/onboarding" replace />
    return <Navigate to={from || '/app/home'} replace />
  }

  const handleReset = async (email) => {
    setResetLoading(true); setError('')
    try {
      await resetPassword(email)
      setResetSent(true)
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'envoi.')
    } finally {
      setResetLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSubmitting(true)
    try {
      const email = mode === 'coach' ? COACH_EMAIL : form.email
      if (mode === 'coach' && form.email && form.email !== COACH_EMAIL) {
        throw new Error("Adresse non autorisée pour l'espace coach.")
      }
      await signIn(email, form.password)
    } catch (err) {
      setError(err.message || 'Identifiants incorrects')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <style>{glowStyle}</style>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', position: 'relative' }}>
        <div className="login-bg" />

        {/* Header */}
        <header style={{ padding: '1.75rem 2rem', display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
          <Link to="/">
            <img src="/Logo.png" alt="The Ultimate Academy" style={{ height: 200, width: 'auto', filter: 'drop-shadow(0 4px 16px rgba(232,35,122,.3))' }} />
          </Link>
        </header>

        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 1rem 3rem', position: 'relative', zIndex: 1 }}>
          <div className="login-card">

            {/* Sélection du rôle */}
            {!mode && (
              <>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <h2 style={{ marginBottom: '.5rem', fontSize: '1.7rem' }}>Connexion</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '.9rem' }}>Choisis ton espace pour continuer</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                  <button
                    className="role-card"
                    onClick={() => { setMode('coach'); setForm(f => ({ ...f, email: COACH_EMAIL })) }}>
                    <div className="role-icon">🏋️</div>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '.3rem', color: '#fff', position: 'relative', zIndex: 1 }}>Coach</div>
                    <div style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.5)', position: 'relative', zIndex: 1 }}>Alexis</div>
                  </button>

                  <button className="role-card" onClick={() => setMode('athlete')}>
                    <div className="role-icon">🏃</div>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '.3rem', color: '#fff', position: 'relative', zIndex: 1 }}>Athlète</div>
                    <div style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.5)', position: 'relative', zIndex: 1 }}>Membre</div>
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="divider-line" />
                  <span style={{ fontSize: '.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Nouveau ici ?</span>
                  <div className="divider-line" />
                </div>

                <Link to="/register"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem',
                    padding: '.85rem', borderRadius: 12,
                    border: '1.5px solid rgba(139,47,201,.3)',
                    color: '#C084FC', fontWeight: 600, fontSize: '.9rem',
                    background: 'rgba(139,47,201,.07)',
                    transition: 'background .2s, border-color .2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,47,201,.14)'; e.currentTarget.style.borderColor = 'rgba(139,47,201,.5)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,47,201,.07)'; e.currentTarget.style.borderColor = 'rgba(139,47,201,.3)' }}>
                  S'inscrire à The Ultimate Academy →
                </Link>
              </>
            )}

            {/* Formulaire coach */}
            {mode === 'coach' && (
              <>
                <button className="back-btn" onClick={() => { setMode(null); setError('') }}>
                  ← Retour
                </button>
                <div style={{ marginBottom: '2rem' }}>
                  <div className="role-badge">🏋️ Espace Coach</div>
                  <h2 style={{ fontSize: '1.5rem', marginBottom: '.3rem' }}>Bon retour, Alexis</h2>
                  <p style={{ fontSize: '.82rem', color: 'var(--text-muted)' }}>{COACH_EMAIL}</p>
                </div>

                {error    && <div className="alert alert-error"   style={{ marginBottom: '1rem' }}>⚠️ {error}</div>}
                {createMsg && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>✅ {createMsg}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Mot de passe</label>
                    <input type="password" className="form-input" required autoFocus
                      value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="••••••••" autoComplete="current-password" />
                  </div>
                  <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading || creating} style={{ marginTop: '.25rem' }}>
                    {loading ? <><div className="spinner spinner-sm" /> Connexion…</> : 'Accéder à mon espace'}
                  </button>
                </form>
                {resetSent
                  ? <p style={{ textAlign: 'center', color: '#4ade80', fontSize: '.85rem', marginTop: '1rem' }}>✅ Email envoyé à {COACH_EMAIL}</p>
                  : <button onClick={() => handleReset(COACH_EMAIL)} disabled={resetLoading}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '.82rem', marginTop: '.75rem', display: 'block', width: '100%', textAlign: 'center' }}>
                      {resetLoading ? 'Envoi…' : 'Mot de passe oublié ?'}
                    </button>
                }
              </>
            )}

            {/* Formulaire athlète */}
            {mode === 'athlete' && (
              <>
                <button className="back-btn" onClick={() => { setMode(null); setError('') }}>
                  ← Retour
                </button>
                <div style={{ marginBottom: '2rem' }}>
                  <div className="role-badge">🏃 Espace Athlète</div>
                  <h2 style={{ fontSize: '1.5rem' }}>Connexion</h2>
                </div>

                {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>⚠️ {error}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-input" required autoFocus
                      value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="ton@email.com" autoComplete="email" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mot de passe</label>
                    <input type="password" className="form-input" required
                      value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="••••••••" autoComplete="current-password" />
                  </div>
                  <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading} style={{ marginTop: '.25rem' }}>
                    {loading ? <><div className="spinner spinner-sm" /> Connexion…</> : 'Se connecter'}
                  </button>
                </form>
                {resetSent
                  ? <p style={{ textAlign: 'center', color: '#4ade80', fontSize: '.85rem', marginTop: '1rem' }}>✅ Email de réinitialisation envoyé !</p>
                  : <button onClick={() => form.email ? handleReset(form.email) : setError('Entre ton email puis clique sur "Mot de passe oublié ?".')}
                      disabled={resetLoading}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '.82rem', marginTop: '.75rem', display: 'block', width: '100%', textAlign: 'center' }}>
                      {resetLoading ? 'Envoi…' : 'Mot de passe oublié ?'}
                    </button>
                }

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.5rem 0 1.25rem' }}>
                  <div className="divider-line" />
                  <span style={{ fontSize: '.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Pas encore membre ?</span>
                  <div className="divider-line" />
                </div>

                <Link to="/register"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem',
                    padding: '.85rem', borderRadius: 12,
                    border: '1.5px solid rgba(139,47,201,.3)',
                    color: '#C084FC', fontWeight: 600, fontSize: '.9rem',
                    background: 'rgba(139,47,201,.07)',
                    transition: 'background .2s, border-color .2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,47,201,.14)'; e.currentTarget.style.borderColor = 'rgba(139,47,201,.5)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,47,201,.07)'; e.currentTarget.style.borderColor = 'rgba(139,47,201,.3)' }}>
                  S'inscrire à The Ultimate Academy →
                </Link>
              </>
            )}
          </div>
        </main>
      </div>
    </>
  )
}
