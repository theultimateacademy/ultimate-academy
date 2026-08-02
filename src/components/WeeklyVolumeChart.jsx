import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const COLORS = { course: '#10B981', natation: '#3B82F6', velo: '#F97316' }
const LABELS = { course: 'Course', natation: 'Natation', velo: 'Vélo' }
const ORDER  = ['course', 'natation', 'velo']

function mondayOf(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const dow = d.getDay() // 0=dim 1=lun … 6=sam
  d.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow))
  return d
}

function fmtDay(d) {
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

// Graphique de volume hebdomadaire (12 dernières semaines) par discipline,
// à partir des distances réelles saisies en fin de séance (session_completions).
// Une brique répartit sa distance vélo (distance_km_bike) et course (distance_km).
export default function WeeklyVolumeChart({ userId }) {
  const [weeks, setWeeks] = useState(null) // null = chargement

  useEffect(() => {
    if (!userId) return
    let cancelled = false

    ;(async () => {
      const thisMonday = mondayOf(new Date())
      const startMonday = new Date(thisMonday)
      startMonday.setDate(startMonday.getDate() - 11 * 7) // 12 semaines au total, incluse la semaine en cours

      const { data } = await supabase
        .from('session_completions')
        .select('completed_at, distance_km, distance_km_bike, sport')
        .eq('user_id', userId)
        .gte('completed_at', startMonday.toISOString())

      if (cancelled) return

      const buckets = Array.from({ length: 12 }, (_, i) => {
        const monday = new Date(startMonday)
        monday.setDate(monday.getDate() + i * 7)
        return { monday, course: 0, natation: 0, velo: 0 }
      })

      ;(data || []).forEach(c => {
        const d = new Date(c.completed_at)
        const idx = Math.floor((d - startMonday) / (7 * 24 * 3600 * 1000))
        if (idx < 0 || idx > 11) return
        const bucket = buckets[idx]
        if (c.sport === 'natation') {
          bucket.natation += Number(c.distance_km) || 0
        } else if (c.sport === 'velo') {
          bucket.velo += Number(c.distance_km) || 0
        } else if (c.sport === 'brique') {
          bucket.velo   += Number(c.distance_km_bike) || 0
          bucket.course += Number(c.distance_km) || 0
        } else if (c.sport === 'course') {
          bucket.course += Number(c.distance_km) || 0
        }
      })

      setWeeks(buckets)
    })()

    return () => { cancelled = true }
  }, [userId])

  if (weeks === null) return null
  const maxVal     = Math.max(1, ...weeks.flatMap(w => ORDER.map(k => w[k])))
  const hasAnyData = weeks.some(w => ORDER.some(k => w[k] > 0))

  return (
    <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
      <h4 style={{ marginBottom: '.25rem' }}>📊 Volume hebdomadaire</h4>
      <p style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginBottom: hasAnyData ? '1.5rem' : '0' }}>
        12 dernières semaines, par discipline
      </p>

      {!hasAnyData ? (
        <p style={{ fontSize: '.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem 0', margin: 0 }}>
          Pas encore de séances avec distance renseignée.
        </p>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '.6rem', height: 150, overflowX: 'auto', paddingBottom: '.25rem' }}>
            {weeks.map((w, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.4rem', flexShrink: 0, minWidth: 44 }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 112 }}>
                  {ORDER.map(k => {
                    const h = w[k] > 0 ? Math.max(3, (w[k] / maxVal) * 112) : 2
                    return (
                      <div key={k} title={`${LABELS[k]} — semaine du ${fmtDay(w.monday)} : ${w[k].toFixed(1)} km`}
                        style={{ width: 10, height: h, borderRadius: '3px 3px 0 0',
                          background: COLORS[k], opacity: w[k] > 0 ? 1 : .15,
                          transition: 'height .3s ease' }} />
                    )
                  })}
                </div>
                <span style={{ fontSize: '.6rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fmtDay(w.monday)}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '1.25rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
            {ORDER.map(k => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                <div style={{ width: 9, height: 9, borderRadius: 3, background: COLORS[k], flexShrink: 0 }} />
                <span style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>{LABELS[k]}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
