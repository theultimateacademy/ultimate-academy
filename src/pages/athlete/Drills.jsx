import { useState } from 'react'

const DRILLS = [
  {
    id: 'montees-genoux',
    name: 'Montées de genoux',
    emoji: '🦵',
    duration: '2×20m',
    desc: 'Monte les genoux au-dessus de la hanche, bras actifs en opposition. Pose l\'avant-pied, cadence élevée.',
    cue: 'Genoux haut, bras énergiques, regard droit devant.',
    category: 'activation',
  },
  {
    id: 'talons-fesses',
    name: 'Talons-fesses',
    emoji: '🔄',
    duration: '2×20m',
    desc: 'Ramène les talons vers les fesses en alternance. Garde le buste droit, les cuisses vers le bas.',
    cue: 'Talons qui touchent les fesses, corps vertical.',
    category: 'activation',
  },
  {
    id: 'skipping-a',
    name: 'Skipping A',
    emoji: '⬆️',
    duration: '2×20m',
    desc: 'Montée de genou contrôlée avec pose active du pied au sol (griffé). Tempo modéré, bras en opposition.',
    cue: 'Monte, pose, griffe — ne pas frapper le sol.',
    category: 'technique',
  },
  {
    id: 'skipping-b',
    name: 'Skipping B',
    emoji: '↗️',
    duration: '2×20m',
    desc: 'Comme le skipping A, puis extension complète de la jambe vers l\'avant. Travail du cycle arrière.',
    cue: 'Monte → étends → griffe. Cycle complet de la jambe.',
    category: 'technique',
  },
  {
    id: 'jambes-tendues',
    name: 'Jambes tendues',
    emoji: '📏',
    duration: '2×20m',
    desc: 'Marche rapide avec jambe tendue qui monte devant, pied fléchi. Hanches hautes, buste droit.',
    cue: 'Jambe tendue, pied flex, ne pas se pencher en arrière.',
    category: 'technique',
  },
  {
    id: 'foulees-bondissantes',
    name: 'Foulées bondissantes',
    emoji: '🦘',
    duration: '2×30m',
    desc: 'Grande foulée avec poussée vers le haut. Cherche la hauteur et la longueur. Bras amples.',
    cue: 'Pousse fort, vole haut, amorti souple.',
    category: 'puissance',
  },
  {
    id: 'carioca',
    name: 'Carioca',
    emoji: '🔀',
    duration: '2×20m',
    desc: 'Déplacement latéral : jambe droite croise devant, puis derrière en alternance. Hanches qui pivotent.',
    cue: 'Épaules immobiles, hanches qui tournent, pieds légers.',
    category: 'coordination',
  },
  {
    id: 'pas-chasses',
    name: 'Pas chassés',
    emoji: '↔️',
    duration: '2×20m',
    desc: 'Glisse latéralement, pied qui regroupe puis repousse. Reste bas, genoux légèrement fléchis.',
    cue: 'Reste bas, ne croise pas les pieds.',
    category: 'coordination',
  },
  {
    id: 'accelerations',
    name: 'Accélérations progressives',
    emoji: '🚀',
    duration: '3×60m',
    desc: 'Commence à 50% puis monte progressivement jusqu\'à 90-95% sur 60m. Libère la foulée en douceur.',
    cue: '0-20m facile, 20-40m relance, 40-60m vitesse de course.',
    category: 'vitesse',
  },
  {
    id: 'lignes-droites',
    name: 'Lignes droites',
    emoji: '➡️',
    duration: '4×80m',
    desc: 'Footing à allure de course sur 80m. Sentir la mécanique de course, rester relâché.',
    cue: 'Relâché, efficace, sens ton allure de course.',
    category: 'vitesse',
  },
]

const CATEGORIES = {
  activation:    { label: 'Activation',    color: '#10B981', bg: 'rgba(16,185,129,.12)',  border: 'rgba(16,185,129,.3)'  },
  technique:     { label: 'Technique',     color: '#3DC8F0', bg: 'rgba(61,200,240,.12)',  border: 'rgba(61,200,240,.3)'  },
  puissance:     { label: 'Puissance',     color: '#F59E0B', bg: 'rgba(245,158,11,.12)',  border: 'rgba(245,158,11,.3)'  },
  coordination:  { label: 'Coordination',  color: '#8B2FC9', bg: 'rgba(139,47,201,.12)',  border: 'rgba(139,47,201,.3)'  },
  vitesse:       { label: 'Vitesse',       color: '#E8237A', bg: 'rgba(232,35,122,.12)',  border: 'rgba(232,35,122,.3)'  },
}

const RECOMMENDED_ORDER = [
  'montees-genoux',
  'talons-fesses',
  'skipping-a',
  'skipping-b',
  'jambes-tendues',
  'foulees-bondissantes',
  'carioca',
  'pas-chasses',
  'accelerations',
  'lignes-droites',
]

export default function AthleticDrills() {
  const [selected, setSelected] = useState(new Set(['montees-genoux', 'talons-fesses', 'skipping-a', 'foulees-bondissantes', 'accelerations']))
  const [activeFilter, setActiveFilter] = useState(null)
  const [expanded, setExpanded] = useState(null)

  const toggle = (id) => setSelected(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const filtered = activeFilter
    ? DRILLS.filter(d => d.category === activeFilter)
    : DRILLS

  const selectedInOrder = RECOMMENDED_ORDER
    .map(id => DRILLS.find(d => d.id === id))
    .filter(d => d && selected.has(d.id))

  const totalDuration = selectedInOrder.reduce((acc, d) => {
    const reps = parseInt(d.duration.match(/(\d+)×/)?.[1] || '1')
    const dist = parseInt(d.duration.match(/×(\d+)/)?.[1] || '0')
    return acc + (reps * dist / 100) * 0.35
  }, 0)
  const estMin = Math.round(totalDuration + selectedInOrder.length * 0.5 + 2)

  return (
    <div className="page">
      <h2 className="page-heading" style={{ marginBottom: '.35rem' }}>Gammes athlétiques</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '.875rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
        À réaliser avant chaque séance intensive (fractionné, tempo, côtes). Sélectionne les gammes que tu veux inclure — elles s'afficheront dans l'ordre recommandé ci-dessous.
      </p>

      {/* Selected routine */}
      {selectedInOrder.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(139,47,201,.1), rgba(232,35,122,.08))', border: '1px solid rgba(139,47,201,.25)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ margin: 0 }}>Ta routine ({selectedInOrder.length} gammes)</h4>
            <span style={{ fontSize: '.78rem', color: 'var(--text-muted)', background: 'var(--surface-2)', padding: '.25rem .65rem', borderRadius: 99 }}>
              ~{estMin} min
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
            {selectedInOrder.map((d, i) => {
              const cat = CATEGORIES[d.category]
              return (
                <div key={d.id} style={{
                  display: 'flex', alignItems: 'center', gap: '.75rem',
                  padding: '.6rem .875rem', background: 'var(--surface-2)',
                  borderRadius: 12, border: `1px solid ${cat.border}`,
                }}>
                  <span style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--text-muted)', width: 18, flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{d.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '.875rem' }}>{d.name}</div>
                    <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>{d.duration}</div>
                  </div>
                  <span style={{ fontSize: '.7rem', padding: '.15rem .45rem', borderRadius: 99, background: cat.bg, color: cat.color, border: `1px solid ${cat.border}`, flexShrink: 0 }}>
                    {cat.label}
                  </span>
                </div>
              )
            })}
          </div>
          <p style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.35)', marginTop: '.875rem', marginBottom: 0, lineHeight: 1.7, textAlign: 'center' }}>
            Effectue chaque gamme sur la distance indiquée, récupère en marchant retour.
          </p>
        </div>
      )}

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <button onClick={() => setActiveFilter(null)}
          style={{ padding: '.3rem .8rem', borderRadius: 99, fontSize: '.78rem', fontWeight: 600, border: 'none', cursor: 'pointer',
            background: !activeFilter ? 'var(--gradient)' : 'var(--surface-2)', color: !activeFilter ? '#fff' : 'var(--text-muted)' }}>
          Toutes
        </button>
        {Object.entries(CATEGORIES).map(([key, cat]) => (
          <button key={key} onClick={() => setActiveFilter(activeFilter === key ? null : key)}
            style={{ padding: '.3rem .8rem', borderRadius: 99, fontSize: '.78rem', fontWeight: 600, border: `1px solid ${cat.border}`, cursor: 'pointer',
              background: activeFilter === key ? cat.bg : 'transparent', color: activeFilter === key ? cat.color : 'var(--text-muted)' }}>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Drill cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
        {filtered.map(d => {
          const cat = CATEGORIES[d.category]
          const isSelected = selected.has(d.id)
          const isExpanded = expanded === d.id

          return (
            <div key={d.id} style={{
              borderRadius: 16, overflow: 'hidden',
              border: isSelected ? `1.5px solid ${cat.border}` : '1.5px solid var(--border)',
              background: isSelected ? cat.bg : 'var(--surface)',
              transition: 'all .15s',
            }}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '.875rem', padding: '.875rem 1rem', cursor: 'pointer' }}
                onClick={() => setExpanded(isExpanded ? null : d.id)}
              >
                {/* Checkbox */}
                <div
                  onClick={e => { e.stopPropagation(); toggle(d.id) }}
                  style={{
                    width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                    border: `2px solid ${isSelected ? cat.color : 'var(--border)'}`,
                    background: isSelected ? cat.color : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'all .15s',
                  }}>
                  {isSelected && <span style={{ color: '#fff', fontSize: '.75rem', fontWeight: 800 }}>✓</span>}
                </div>

                <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{d.emoji}</span>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '.925rem' }}>{d.name}</span>
                    <span style={{ fontSize: '.7rem', padding: '.1rem .4rem', borderRadius: 99, background: cat.bg, color: cat.color, border: `1px solid ${cat.border}` }}>
                      {cat.label}
                    </span>
                  </div>
                  <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginTop: '.15rem' }}>{d.duration}</div>
                </div>

                <span style={{ color: 'var(--text-muted)', fontSize: '.85rem', transition: 'transform .2s', transform: isExpanded ? 'rotate(180deg)' : 'none' }}>▾</span>
              </div>

              {isExpanded && (
                <div style={{ padding: '0 1rem 1rem', borderTop: '1px solid var(--border)' }}>
                  <p style={{ fontSize: '.875rem', lineHeight: 1.7, color: 'rgba(255,255,255,.75)', margin: '.75rem 0 .5rem' }}>
                    {d.desc}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '.5rem', background: 'rgba(255,255,255,.05)', borderRadius: 10, padding: '.6rem .875rem' }}>
                    <span style={{ fontSize: '.85rem', flexShrink: 0 }}>💡</span>
                    <span style={{ fontSize: '.82rem', color: cat.color, fontStyle: 'italic', lineHeight: 1.6 }}>{d.cue}</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <p style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginTop: '1.5rem', lineHeight: 1.7, textAlign: 'center' }}>
        Clique sur une gamme pour voir la description · Coche pour l'ajouter à ta routine
      </p>
    </div>
  )
}
