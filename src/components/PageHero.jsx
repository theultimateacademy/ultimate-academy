const BG = 'linear-gradient(-45deg, #080818, #1a0a2e, #2d0a4e, #5a1fa0, #2d0a4e, #1a0a2e, #080818)'
const GRAD = 'linear-gradient(135deg, #8B2FC9, #E8237A)'

export const gradText = {
  background: GRAD,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
}

export default function PageHero({ title, subtitle, badge }) {
  return (
    <div style={{
      background: BG,
      padding: '5rem 1.5rem 3.5rem',
      textAlign: 'center',
      borderBottom: '1px solid rgba(255,255,255,.08)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: '60vw', height: '60vw', maxWidth: 600, maxHeight: 600,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,47,201,.3) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        {badge && (
          <div style={{
            display: 'inline-block',
            background: GRAD,
            borderRadius: 100, padding: '.3rem 1.1rem',
            fontSize: '.75rem', fontWeight: 700, color: '#fff',
            textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '1.1rem',
            boxShadow: '0 4px 16px rgba(232,35,122,.3)',
          }}>{badge}</div>
        )}
        <h1 style={{
          fontSize: 'clamp(2rem,5vw,3.2rem)', fontWeight: 800,
          letterSpacing: '-0.02em', color: '#fff', margin: 0,
          marginBottom: subtitle ? '.6rem' : 0,
        }}>{title}</h1>
        {subtitle && (
          <p style={{ color: 'rgba(255,255,255,.5)', fontSize: '1rem', margin: 0 }}>{subtitle}</p>
        )}
      </div>
    </div>
  )
}
