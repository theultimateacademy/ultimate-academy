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
      background: 'linear-gradient(-45deg, #0a0a0a, #1a0a2e, #2d0a4e, #8B2FC9, #5a1fa0, #1a0a2e, #0a0a0a)',
      backgroundSize: '400% 400%',
      backgroundPosition: '60% 50%',
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
