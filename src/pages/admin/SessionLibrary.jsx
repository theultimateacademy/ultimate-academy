import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import LoadingSpinner from '../../components/UI/LoadingSpinner'

const SPORT_LABELS = {
  running:  { label: 'Course à pied', icon: '🏃', color: '#10B981' },
  natation: { label: 'Natation',      icon: '🏊', color: '#3B82F6' },
  velo:     { label: 'Vélo',          icon: '🚴', color: '#F97316' },
  brique:   { label: 'Brique',        icon: '⚡', color: '#8B2FC9' },
  trail:    { label: 'Trail',         icon: '🏔', color: '#84CC16' },
}

const TYPE_LABELS = {
  footing_recuperation:   'Footing Récup',
  recuperation_active:    'Footing Récup',   // alias unifié
  endurance_fondamentale: 'EF',
  footing_progressif:     'FP',
  tempo_seuil:            'Tempo',
  fractionne_court:       'Frac Court',
  fractionne_long:        'Frac Long',
  cotes:                  'Côtes',
  specifique:             'Spécif',
  sortie_longue:          'SL',
  renforcement:           'Renfo',
  natation:               'Natation',
  velo:                   'Vélo',
  brique:                 'Brique',
  trail:                  'Trail',
}

const RPE_COLOR = rpe =>
  rpe <= 3 ? '#10B981' : rpe <= 5 ? '#06B6D4' : rpe <= 7 ? '#F59E0B' : rpe <= 8 ? '#F97316' : '#EF4444'

function SessionCard({ s, expanded, onToggle }) {
  const sport = SPORT_LABELS[s.sport || 'running'] || { label: s.sport, icon: '•', color: '#8B2FC9' }
  const typeLabel = TYPE_LABELS[s.type] || s.type

  return (
    <div
      onClick={onToggle}
      style={{
        background: 'rgba(255,255,255,.04)',
        border: `1px solid ${expanded ? sport.color + '55' : 'rgba(255,255,255,.07)'}`,
        borderRadius: 10,
        padding: '1rem 1.1rem',
        cursor: 'pointer',
        transition: 'border-color .15s',
      }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', flexWrap: 'wrap' }}>
        <span style={{
          fontFamily: 'monospace', fontSize: '.75rem', fontWeight: 700,
          color: sport.color, background: sport.color + '18',
          borderRadius: 5, padding: '1px 7px', letterSpacing: '.02em',
        }}>{s.code}</span>

        <span style={{ fontWeight: 600, fontSize: '.95rem', color: '#fff', flex: 1 }}>{s.name}</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', flexShrink: 0 }}>
          <span style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.45)', background: 'rgba(255,255,255,.06)', borderRadius: 5, padding: '1px 7px' }}>
            {typeLabel}
          </span>
          <span style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.45)', background: 'rgba(255,255,255,.06)', borderRadius: 5, padding: '1px 7px' }}>
            {s.duration_min} min
          </span>
          <span style={{
            fontSize: '.75rem', fontWeight: 700, borderRadius: 5, padding: '1px 7px',
            color: RPE_COLOR(s.intensity_rpe), background: RPE_COLOR(s.intensity_rpe) + '18',
          }}>RPE {s.intensity_rpe}</span>
          <span style={{ color: 'rgba(255,255,255,.3)', fontSize: '.8rem' }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '.55rem' }}>
          {s.warmup && (
            <div>
              <span style={{ fontSize: '.7rem', fontWeight: 700, color: 'rgba(255,255,255,.35)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Échauffement</span>
              <p style={{ margin: '.2rem 0 0', fontSize: '.85rem', color: 'rgba(255,255,255,.75)', lineHeight: 1.5 }}>{s.warmup}</p>
            </div>
          )}
          {s.main_set && (
            <div>
              <span style={{ fontSize: '.7rem', fontWeight: 700, color: 'rgba(255,255,255,.35)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Corps de séance</span>
              <p style={{ margin: '.2rem 0 0', fontSize: '.88rem', color: '#fff', lineHeight: 1.55, whiteSpace: 'pre-line' }}>{s.main_set}</p>
            </div>
          )}
          {s.recovery && (
            <div>
              <span style={{ fontSize: '.7rem', fontWeight: 700, color: 'rgba(255,255,255,.35)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Récupération</span>
              <p style={{ margin: '.2rem 0 0', fontSize: '.85rem', color: 'rgba(255,255,255,.75)', lineHeight: 1.5 }}>{s.recovery}</p>
            </div>
          )}
          {s.cooldown && (
            <div>
              <span style={{ fontSize: '.7rem', fontWeight: 700, color: 'rgba(255,255,255,.35)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Retour au calme</span>
              <p style={{ margin: '.2rem 0 0', fontSize: '.85rem', color: 'rgba(255,255,255,.75)', lineHeight: 1.5 }}>{s.cooldown}</p>
            </div>
          )}
          {s.coach_notes && (
            <div style={{
              background: 'rgba(139,47,201,.12)', border: '1px solid rgba(139,47,201,.25)',
              borderRadius: 7, padding: '.6rem .85rem',
            }}>
              <span style={{ fontSize: '.7rem', fontWeight: 700, color: '#8B2FC9', letterSpacing: '.08em', textTransform: 'uppercase' }}>Note coach</span>
              <p style={{ margin: '.2rem 0 0', fontSize: '.85rem', color: 'rgba(255,255,255,.8)', lineHeight: 1.5, fontStyle: 'italic' }}>{s.coach_notes}</p>
            </div>
          )}
          {s.compatible_goals && s.compatible_goals.length > 0 && (
            <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap', marginTop: '.1rem' }}>
              {s.compatible_goals.map(g => (
                <span key={g} style={{
                  fontSize: '.7rem', color: 'rgba(255,255,255,.4)',
                  background: 'rgba(255,255,255,.06)', borderRadius: 4, padding: '1px 6px',
                }}>{g}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function SessionLibrary() {
  const [sessions, setSessions] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [sport,    setSport]    = useState('all')
  const [search,   setSearch]   = useState('')
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    supabase
      .from('session_library')
      .select('*')
      .then(({ data }) => {
        if (!data) { setLoading(false); return }
        // Ordre des catégories par sport puis par type logique
        const TYPE_ORDER = {
          // Running — ordre logique de la semaine d'entraînement
          footing_recuperation:   0,
          recuperation_active:    0,  // alias — même groupe
          endurance_fondamentale: 1,
          footing_progressif:     2,
          tempo_seuil:            3,
          fractionne_court:       4,
          fractionne_long:        5,
          cotes:                  6,
          specifique:             7,
          sortie_longue:          8,
          renforcement:           9,
          // Autres sports
          natation:               10,
          velo:                   11,
          brique:                 12,
          trail:                  13,
        }
        const sorted = [...data].sort((a, b) => {
          const tA = TYPE_ORDER[a.type] ?? 99
          const tB = TYPE_ORDER[b.type] ?? 99
          if (tA !== tB) return tA - tB
          // Au sein d'une catégorie : sort_order défini en DB (précis), sinon durée
          const sA = a.sort_order ?? 999
          const sB = b.sort_order ?? 999
          if (sA !== sB) return sA - sB
          return a.duration_min - b.duration_min
        })
        setSessions(sorted)
        setLoading(false)
      })
  }, [])

  const sports = ['all', ...Object.keys(SPORT_LABELS)]

  const filtered = sessions.filter(s => {
    const sp = s.sport || 'running'
    if (sport !== 'all' && sp !== sport) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        s.code?.toLowerCase().includes(q) ||
        s.name?.toLowerCase().includes(q) ||
        s.main_set?.toLowerCase().includes(q) ||
        s.coach_notes?.toLowerCase().includes(q)
      )
    }
    return true
  })

  const grouped = filtered.reduce((acc, s) => {
    const sp = s.sport || 'running'
    if (!acc[sp]) acc[sp] = []
    acc[sp].push(s)
    return acc
  }, {})

  if (loading) return <LoadingSpinner />

  return (
    <div className="page"><div style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Bibliothèque de séances</h1>
        <p style={{ color: 'rgba(255,255,255,.45)', margin: '.3rem 0 0', fontSize: '.9rem' }}>
          {sessions.length} séances disponibles — clique sur une carte pour voir le détail
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap', marginBottom: '1.2rem' }}>
        {sports.map(sp => {
          const meta = SPORT_LABELS[sp]
          const active = sport === sp
          return (
            <button key={sp} onClick={() => { setSport(sp); setExpanded(null) }} style={{
              padding: '.35rem .9rem', borderRadius: 8, border: '1px solid',
              fontSize: '.82rem', fontWeight: 600, cursor: 'pointer',
              borderColor: active ? (meta?.color || '#8B2FC9') : 'rgba(255,255,255,.12)',
              background: active ? (meta?.color || '#8B2FC9') + '22' : 'transparent',
              color: active ? (meta?.color || '#E8237A') : 'rgba(255,255,255,.5)',
            }}>
              {meta ? `${meta.icon} ${meta.label}` : 'Tous'}
            </button>
          )
        })}

        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setExpanded(null) }}
          placeholder="Rechercher…"
          style={{
            marginLeft: 'auto', padding: '.35rem .75rem', borderRadius: 8,
            border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)',
            color: '#fff', fontSize: '.85rem', outline: 'none', minWidth: 160,
          }} />
      </div>

      {/* Groups */}
      {Object.entries(grouped).map(([sp, list]) => {
        const meta = SPORT_LABELS[sp] || { label: sp, icon: '•', color: '#fff' }
        return (
          <div key={sp} style={{ marginBottom: '2rem' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '.5rem',
              borderBottom: `1px solid ${meta.color}33`, paddingBottom: '.4rem', marginBottom: '.8rem',
            }}>
              <span style={{ fontSize: '1.1rem' }}>{meta.icon}</span>
              <span style={{ fontWeight: 700, color: meta.color, fontSize: '.95rem' }}>{meta.label}</span>
              <span style={{ color: 'rgba(255,255,255,.3)', fontSize: '.8rem' }}>({list.length})</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
              {list.map(s => (
                <SessionCard
                  key={s.code}
                  s={s}
                  expanded={expanded === s.code}
                  onToggle={() => setExpanded(expanded === s.code ? null : s.code)}
                />
              ))}
            </div>
          </div>
        )
      })}

      {filtered.length === 0 && (
        <p style={{ color: 'rgba(255,255,255,.35)', textAlign: 'center', padding: '3rem 0' }}>
          Aucune séance trouvée.
        </p>
      )}
    </div></div>
  )
}
