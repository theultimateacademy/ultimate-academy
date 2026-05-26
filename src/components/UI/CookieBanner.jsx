import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const STORAGE_KEY = 'cookie_consent'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true)
  }, [])

  function accept() {
    localStorage.setItem(STORAGE_KEY, 'accepted')
    setVisible(false)
  }

  function refuse() {
    localStorage.setItem(STORAGE_KEY, 'refused')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: 'rgba(22,19,42,.97)', backdropFilter: 'blur(12px)',
      borderTop: '1px solid rgba(139,47,201,.3)',
      padding: '1rem 1.5rem',
      display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
    }}>
      <p style={{ flex: 1, minWidth: 200, margin: 0, fontSize: '.85rem', color: 'rgba(255,255,255,.75)', lineHeight: 1.5 }}>
        Nous utilisons des cookies pour assurer le bon fonctionnement de l'application.{' '}
        <Link to="/cookies" style={{ color: '#C084FC', textDecoration: 'none' }}>
          En savoir plus
        </Link>
      </p>
      <div style={{ display: 'flex', gap: '.6rem', flexShrink: 0 }}>
        <button onClick={refuse} style={{
          padding: '.45rem 1rem', borderRadius: 8, border: '1px solid rgba(255,255,255,.15)',
          background: 'transparent', color: 'rgba(255,255,255,.55)', fontSize: '.82rem',
          cursor: 'pointer',
        }}>
          Refuser
        </button>
        <button onClick={accept} style={{
          padding: '.45rem 1rem', borderRadius: 8, border: 'none',
          background: 'linear-gradient(135deg,#8B2FC9,#E8237A)', color: '#fff',
          fontSize: '.82rem', fontWeight: 600, cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(232,35,122,.35)',
        }}>
          Accepter
        </button>
      </div>
    </div>
  )
}
