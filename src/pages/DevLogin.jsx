import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function DevLogin() {
  const [log, setLog] = useState([])

  const add = (msg, color = '#86efac') => {
    console.log('[DEV]', msg)
    setLog(prev => [...prev, { msg, color }])
  }

  useEffect(() => { run() }, [])

  async function run() {
    try {
      // 1. Prépare le compte via backend
      add('1. Appel backend /api/dev/test-login…', '#facc15')
      const res  = await fetch('/api/dev/test-login', { method: 'POST' })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error)
      add('2. Backend OK — profileOk: ' + body.profileOk)

      // 2. Connexion
      add('3. signInWithPassword…', '#facc15')
      const { data, error } = await supabase.auth.signInWithPassword({
        email: body.email, password: body.password
      })
      if (error) throw error
      add('4. Connecté userId=' + data.user?.id)

      // 3. Lit le profil directement
      add('5. Lecture du profil en base…', '#facc15')
      const { data: profile, error: perr } = await supabase
        .from('profiles').select('*').eq('id', data.user.id).single()
      if (perr) throw new Error('Profil illisible: ' + perr.message + ' (code: ' + perr.code + ')')
      add('6. Profil: subscription=' + profile.subscription_status + ' completed=' + profile.profile_completed)

      if (profile.subscription_status !== 'active') {
        throw new Error('subscription_status = "' + profile.subscription_status + '" (pas active) → RequireActive va bloquer')
      }
      if (!profile.profile_completed) {
        throw new Error('profile_completed = false → va rediriger vers /onboarding')
      }

      add('7. ✅ Tout OK — redirection /app/home dans 1s…', '#60a5fa')
      setTimeout(() => { window.location.href = '/app/home' }, 1000)

    } catch (err) {
      add('❌ ERREUR : ' + err.message, '#f87171')
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0d0d0d', color: '#f0f0f0',
      fontFamily: 'monospace', padding: '2rem'
    }}>
      <div style={{ color: '#f59e0b', fontWeight: 700, marginBottom: '1rem' }}>
        🛠 DEV LOGIN
      </div>
      {log.map((e, i) => (
        <div key={i} style={{ color: e.color, marginBottom: '.35rem', fontSize: '.9rem' }}>
          {e.msg}
        </div>
      ))}
      {log.length === 0 && <div style={{ color: '#555' }}>Démarrage…</div>}
    </div>
  )
}
