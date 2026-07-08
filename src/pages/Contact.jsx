import { useState } from 'react'
import Nav from '../components/Nav'
import PageHero, { gradText } from '../components/PageHero'

const grad = 'linear-gradient(135deg,#8B2FC9,#E8237A)'
const TARGET = 'theultimateacademy.ua@gmail.com'

const inputSt = {
  width: '100%', background: 'rgba(255,255,255,.05)',
  border: '1.5px solid rgba(255,255,255,.1)', borderRadius: 12,
  padding: '.85rem 1.1rem', fontSize: '1rem', color: '#fff', outline: 'none',
  boxSizing: 'border-box', transition: 'border-color .2s',
  fontFamily: 'inherit',
}

export default function Contact() {
  const [email,   setEmail]   = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [status,  setStatus]  = useState('idle') // idle | sending | success | error

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !subject || !message) return
    setStatus('sending')
    try {
      const fd = new FormData()
      fd.append('email', email)
      fd.append('_subject', subject)
      fd.append('message', message)
      fd.append('_captcha', 'false')
      fd.append('_template', 'table')
      fd.append('_next', window.location.href)

      const res = await fetch(`https://formsubmit.co/ajax/${TARGET}`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: fd,
      })
      const data = await res.json()
      if (data.success === 'true' || data.success === true) {
        setStatus('success')
        setEmail(''); setSubject(''); setMessage('')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#fff' }}>
      <Nav />

      <PageHero
        badge="Nous contacter"
        title={<>Une question ? <span style={gradText}>Écris-moi.</span></>}
        subtitle="Je réponds personnellement à chaque message sous 48h."
      />

      <main style={{ maxWidth: 640, margin: '0 auto', padding: '4rem 1.5rem 6rem' }}>

        {status === 'success' ? (
          <div style={{
            background: 'rgba(52,211,153,.08)', border: '1px solid rgba(52,211,153,.3)',
            borderRadius: 20, padding: '3rem 2rem', textAlign: 'center',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '.5rem' }}>Message envoyé !</h2>
            <p style={{ color: 'rgba(255,255,255,.5)', lineHeight: 1.7 }}>
              Ton message a bien été transmis. Je te répondrai dans les 48 heures.
            </p>
            <button
              onClick={() => setStatus('idle')}
              style={{ marginTop: '1.5rem', padding: '.75rem 2rem', borderRadius: 50, border: 'none', background: grad, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '.95rem' }}>
              Envoyer un autre message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'rgba(255,255,255,.45)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '.4rem' }}>
                Ton adresse email *
              </label>
              <input
                type="email" required
                placeholder="exemple@email.com"
                value={email} onChange={e => setEmail(e.target.value)}
                style={inputSt}
                onFocus={e => e.target.style.borderColor = 'rgba(139,47,201,.6)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.1)'}
              />
            </div>

            {/* Objet */}
            <div>
              <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'rgba(255,255,255,.45)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '.4rem' }}>
                Objet *
              </label>
              <input
                type="text" required
                placeholder="Sujet de ton message"
                value={subject} onChange={e => setSubject(e.target.value)}
                style={inputSt}
                onFocus={e => e.target.style.borderColor = 'rgba(139,47,201,.6)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.1)'}
              />
            </div>

            {/* Message */}
            <div>
              <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'rgba(255,255,255,.45)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '.4rem' }}>
                Ton message *
              </label>
              <textarea
                required rows={7}
                placeholder="Écris ton message ici…"
                value={message} onChange={e => setMessage(e.target.value)}
                style={{ ...inputSt, resize: 'vertical', minHeight: 160 }}
                onFocus={e => e.target.style.borderColor = 'rgba(139,47,201,.6)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.1)'}
              />
            </div>

            {status === 'error' && (
              <div style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 12, padding: '.85rem 1.1rem', fontSize: '.875rem', color: '#FCA5A5' }}>
                Une erreur est survenue. Réessaie ou contacte-moi directement à <strong>{TARGET}</strong>.
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'sending'}
              style={{
                padding: '1rem', borderRadius: 50, border: 'none',
                background: status === 'sending' ? 'rgba(139,47,201,.4)' : grad,
                color: '#fff', fontSize: '1rem', fontWeight: 700, cursor: status === 'sending' ? 'default' : 'pointer',
                boxShadow: status === 'sending' ? 'none' : '0 6px 24px rgba(232,35,122,.4)',
                transition: 'all .2s',
              }}>
              {status === 'sending' ? 'Envoi en cours…' : 'Envoyer mon message →'}
            </button>

            <p style={{ textAlign: 'center', fontSize: '.78rem', color: 'rgba(255,255,255,.2)', margin: 0 }}>
              Ton message est envoyé directement à Alexis. Aucune donnée n'est conservée.
            </p>
          </form>
        )}
      </main>
    </div>
  )
}
