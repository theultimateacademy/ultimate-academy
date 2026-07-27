import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const GRAD = 'linear-gradient(135deg, #8B2FC9, #E8237A)'

const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: 5 + (i * 4.7) % 90,
  y: 5 + (i * 7.3) % 85,
  size: 2 + (i % 3),
  opacity: 0.2 + (i % 5) * 0.07,
  duration: 8 + (i % 8),
  delay: -(i % 6),
}))

export const gradText = {
  background: GRAD,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
}

export default function PageHero({ title, subtitle, badge, children, backTo, backLabel }) {
  const [inView, setInView] = useState(false)
  useEffect(() => { const t = setTimeout(() => setInView(true), 80); return () => clearTimeout(t) }, [])

  return (
    <div style={{
      background: 'linear-gradient(-45deg, #0a0a0a, #1a0a2e, #2d0a4e, #8B2FC9, #5a1fa0, #1a0a2e, #0a0a0a)',
      backgroundSize: '400% 400%',
      animation: 'gradientShift 8s ease infinite',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
      padding: '8rem 1.5rem 4rem',
      borderBottom: '1px solid rgba(255,255,255,.08)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes gradientShift {
          0%   { background-position: 0% 50% }
          50%  { background-position: 100% 50% }
          100% { background-position: 0% 50% }
        }
        @keyframes floatParticle {
          0%   { transform: translateY(0px) translateX(0px) }
          33%  { transform: translateY(-28px) translateX(18px) }
          66%  { transform: translateY(-8px) translateX(-14px) }
          100% { transform: translateY(0px) translateX(0px) }
        }
      `}</style>

      {/* Particules */}
      {PARTICLES.map(p => (
        <div key={p.id} style={{
          position: 'absolute', left: `${p.x}%`, top: `${p.y}%`,
          width: p.size, height: p.size, borderRadius: '50%',
          background: '#fff', opacity: p.opacity, pointerEvents: 'none',
          willChange: 'transform',
          animation: `floatParticle ${p.duration}s ${p.delay}s ease-in-out infinite`,
        }} />
      ))}

      {/* Glow violet haut gauche */}
      <div style={{
        position: 'absolute', top: '-20%', left: '-10%',
        width: '60vw', height: '60vw', maxWidth: 700, maxHeight: 700,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,47,201,.22) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      {/* Glow rose bas droite */}
      <div style={{
        position: 'absolute', top: '60%', left: '65%', transform: 'translate(-50%,-50%)',
        width: 600, height: 500, pointerEvents: 'none',
        background: 'radial-gradient(ellipse, rgba(232,35,122,.09) 0%, transparent 65%)',
      }} />
      {/* Ligne bas dégradé */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: 3, background: GRAD,
      }} />

      {/* Lien retour (optionnel) */}
      {backTo && (
        <Link to={backTo} style={{
          position: 'absolute', top: '5.5rem', left: '1.5rem',
          zIndex: 2, display: 'inline-flex', alignItems: 'center', gap: '.35rem',
          color: 'rgba(255,255,255,.5)', textDecoration: 'none', fontSize: '.82rem', fontWeight: 500,
          transition: 'color .2s',
        }}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,.9)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.5)'}
        >
          ← {backLabel || 'Retour'}
        </Link>
      )}

      <div style={{ position: 'relative', zIndex: 1 }}>
        {badge && (
          <div style={{
            display: 'inline-block',
            background: GRAD,
            borderRadius: 100, padding: '.3rem 1.1rem',
            fontSize: '.75rem', fontWeight: 700, color: '#fff',
            textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '1.1rem',
            boxShadow: '0 4px 16px rgba(232,35,122,.3)',
            opacity: inView ? 1 : 0,
            transform: inView ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.7s 0.1s ease, transform 0.7s 0.1s ease',
          }}>{badge}</div>
        )}
        <h1 style={{
          fontSize: 'clamp(2rem,5vw,3.2rem)', fontWeight: 800,
          letterSpacing: '-0.02em', color: '#fff', margin: 0,
          marginBottom: subtitle ? '.6rem' : 0,
          opacity: inView ? 1 : 0,
          transform: inView ? 'translateY(0)' : 'translateY(32px)',
          transition: 'opacity 0.8s 0.3s ease, transform 0.8s 0.3s ease',
        }}>{title}</h1>
        {subtitle && (
          <p style={{
            color: 'rgba(255,255,255,.5)', fontSize: '1rem', margin: 0,
            marginBottom: children ? '2rem' : 0,
            opacity: inView ? 1 : 0,
            transform: inView ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 0.8s 0.55s ease, transform 0.8s 0.55s ease',
          }}>{subtitle}</p>
        )}
        {children && (
          <div style={{
            opacity: inView ? 1 : 0,
            transform: inView ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.8s 0.8s ease, transform 0.8s 0.8s ease',
          }}>
            {children}
          </div>
        )}
      </div>
    </div>
  )
}
