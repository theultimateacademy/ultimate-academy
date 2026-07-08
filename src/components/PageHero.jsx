const BG = 'linear-gradient(-45deg, #080818, #1a0a2e, #2d0a4e, #5a1fa0, #2d0a4e, #1a0a2e, #080818)'

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
        background: 'radial-gradient(circle, rgba(139,47,201,.25) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        {badge && (
          <div style={{
            display: 'inline-block',
            background: 'rgba(139,47,201,.18)',
            border: '1px solid rgba(139,47,201,.35)',
            borderRadius: 100, padding: '.3rem 1rem',
            fontSize: '.75rem', fontWeight: 700, color: '#C084FC',
            textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '1rem',
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
