const CARD_W = 310
const GAP    = 20

function Card({ t, dark }) {
  const bg     = dark ? 'rgba(255,255,255,.04)' : '#fff'
  const border = dark ? '1px solid rgba(255,255,255,.08)' : '1px solid rgba(139,47,201,.1)'
  const shadow = dark ? 'none' : '0 4px 20px rgba(139,47,201,.07)'
  const txtCol = dark ? 'rgba(255,255,255,.65)' : 'rgba(26,18,48,.75)'
  const nameCol = dark ? '#fff' : '#1a1230'
  const perfCol = dark ? '#C084FC' : '#8B2FC9'

  return (
    <div style={{
      width: CARD_W, flexShrink: 0, background: bg, borderRadius: 16,
      padding: '1.75rem', border, boxShadow: shadow,
    }}>
      <div style={{ color: '#F59E0B', fontSize: '1rem', marginBottom: '.5rem' }}>
        {'★'.repeat(t.stars)}
      </div>
      <p style={{ color: txtCol, fontSize: '.9rem', lineHeight: 1.7, marginBottom: '1.25rem' }}>
        « {t.text} »
      </p>
      <p style={{ fontWeight: 700, color: nameCol, margin: 0, fontSize: '.88rem' }}>{t.name}</p>
      <p style={{ color: perfCol, fontSize: '.8rem', margin: '.15rem 0 0', fontWeight: 600 }}>{t.perf}</p>
    </div>
  )
}

export default function TestimonialsCarousel({ testimonials, dark = false }) {
  const items    = [...testimonials, ...testimonials]
  const duration = testimonials.length * 5

  return (
    <div style={{ overflow: 'hidden', position: 'relative' }}>
      {/* fade edges */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 60, zIndex: 2, pointerEvents: 'none',
        background: `linear-gradient(to right, ${dark ? '#0C0A18' : '#F8F5FF'}, transparent)`,
      }}/>
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: 60, zIndex: 2, pointerEvents: 'none',
        background: `linear-gradient(to left, ${dark ? '#0C0A18' : '#F8F5FF'}, transparent)`,
      }}/>

      <div style={{
        display: 'flex', gap: GAP, width: 'max-content',
        animation: `tCarousel ${duration}s linear infinite`,
      }}>
        {items.map((t, i) => <Card key={i} t={t} dark={dark} />)}
      </div>

      <style>{`
        @keyframes tCarousel {
          0%   { transform: translateX(0) }
          100% { transform: translateX(calc(-${testimonials.length} * ${CARD_W + GAP}px)) }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="tCarousel"] { animation: none; }
        }
      `}</style>
    </div>
  )
}
