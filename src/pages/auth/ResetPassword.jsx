import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState(false)
  const [ready, setReady]         = useState(false)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return }
    if (password.length < 8)  { setError('Le mot de passe doit faire au moins 8 caractères.'); return }
    setLoading(true); setError('')
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      setError(err.message || 'Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '1.5rem' }}>
      <div style={{ width: '100%', maxWidth: 420, background: 'rgba(22,19,42,.85)', border: '1px solid rgba(139,47,201,.2)', borderRadius: 24, padding: '2.5rem 2rem', backdropFilter: 'blur(16px)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link to="/"><img src="/Logo.png" alt="The Ultimate Academy" style={{ height: 60, marginBottom: '1.5rem' }} /></Link>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '.4rem' }}>Nouveau mot de passe</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '.88rem' }}>Choisis un nouveau mot de passe pour ton compte</p>
        </div>

        {success ? (
          <div className="alert alert-success" style={{ textAlign: 'center' }}>
            ✅ Mot de passe mis à jour ! Redirection…
          </div>
        ) : !ready ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '.9rem' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }} />
            Vérification du lien…
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {error && <div className="alert alert-error">⚠️ {error}</div>}
            <div className="form-group">
              <label className="form-label">Nouveau mot de passe</label>
              <input type="password" className="form-input" required autoFocus
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" autoComplete="new-password" />
            </div>
            <div className="form-group">
              <label className="form-label">Confirmer le mot de passe</label>
              <input type="password" className="form-input" required
                value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••" autoComplete="new-password" />
            </div>
            <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading} style={{ marginTop: '.25rem' }}>
              {loading ? <><div className="spinner spinner-sm" /> Mise à jour…</> : 'Mettre à jour le mot de passe'}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link to="/login" style={{ color: 'var(--text-muted)', fontSize: '.85rem' }}>← Retour à la connexion</Link>
        </div>
      </div>
    </div>
  )
}
