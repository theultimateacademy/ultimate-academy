import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const COLORS = { course: '#10B981', natation: '#3B82F6', velo: '#F97316' }
const LABELS = { course: 'Course', natation: 'Natation', velo: 'Vélo' }
const EMOJIS = { course: '🏃', natation: '🏊', velo: '🚴' }
const ORDER  = ['course', 'natation', 'velo']
const WEEKS_COUNT = 16

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

// "3-9 août" si même mois, "28 juil. - 3 août" sinon
function fmtRange(monday) {
  const sunday = new Date(monday)
  sunday.setDate(sunday.getDate() + 6)
  if (monday.getMonth() === sunday.getMonth()) {
    const month = sunday.toLocaleDateString('fr-FR', { month: 'short' })
    return `${monday.getDate()}-${sunday.getDate()} ${month}`
  }
  return `${fmtDay(monday)} - ${fmtDay(sunday)}`
}

// Durée en minutes → "1h25" ou "45 min"
function fmtDuration(min) {
  if (!min) return null
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  if (h === 0) return `${m} min`
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`
}

// Allure course/natation en "M'SS""
function fmtPaceSec(paceSec) {
  const m = Math.floor(paceSec / 60)
  const s = Math.round(paceSec % 60)
  return `${m}'${String(s).padStart(2, '0')}"`
}

// Allure moyenne de la semaine pour une discipline donnée
function avgPace(sport, km, durMin) {
  if (!km || !durMin) return null
  if (sport === 'course') return `${fmtPaceSec((durMin * 60) / km)}/km`
  if (sport === 'natation') return `${fmtPaceSec((durMin * 60) / (km * 10))}/100m`
  if (sport === 'velo') return `${(km / (durMin / 60)).toFixed(1)} km/h`
  return null
}

// Graphique de volume hebdomadaire (16 dernières semaines) par discipline,
// à partir des distances/durées réelles saisies en fin de séance (session_completions).
// Une brique répartit sa distance/durée vélo (distance_km_bike/duree_bike_min) et course (distance_km/duree_reelle_min).
export default function WeeklyVolumeChart({ userId }) {
  const [weeks,          setWeeks]          = useState(null) // null = chargement
  const [selectedIdx,    setSelectedIdx]    = useState(null)
  const [selectedSport,  setSelectedSport]  = useState(null)

  useEffect(() => {
    if (!userId) return
    let cancelled = false

    ;(async () => {
      const thisMonday = mondayOf(new Date())
      const startMonday = new Date(thisMonday)
      startMonday.setDate(startMonday.getDate() - (WEEKS_COUNT - 1) * 7) // WEEKS_COUNT semaines au total, incluse la semaine en cours

      const { data } = await supabase
        .from('session_completions')
        .select('completed_at, distance_km, distance_km_bike, duree_reelle_min, duree_bike_min, sport')
        .eq('user_id', userId)
        .gte('completed_at', startMonday.toISOString())

      if (cancelled) return

      const buckets = Array.from({ length: WEEKS_COUNT }, (_, i) => {
        const monday = new Date(startMonday)
        monday.setDate(monday.getDate() + i * 7)
        return {
          monday,
          course: 0, natation: 0, velo: 0,
          courseDur: 0, natationDur: 0, veloDur: 0,
        }
      })

      ;(data || []).forEach(c => {
        const d = new Date(c.completed_at)
        const idx = Math.floor((d - startMonday) / (7 * 24 * 3600 * 1000))
        if (idx < 0 || idx > WEEKS_COUNT - 1) return
        const bucket = buckets[idx]
        if (c.sport === 'natation') {
          bucket.natation    += Number(c.distance_km) || 0
          bucket.natationDur += Number(c.duree_reelle_min) || 0
        } else if (c.sport === 'velo') {
          bucket.velo    += Number(c.distance_km) || 0
          bucket.veloDur += Number(c.duree_reelle_min) || 0
        } else if (c.sport === 'brique') {
          bucket.velo      += Number(c.distance_km_bike) || 0
          bucket.veloDur   += Number(c.duree_bike_min) || 0
          bucket.course    += Number(c.distance_km) || 0
          bucket.courseDur += Number(c.duree_reelle_min) || 0
        } else if (c.sport === 'course') {
          bucket.course    += Number(c.distance_km) || 0
          bucket.courseDur += Number(c.duree_reelle_min) || 0
        }
      })

      setWeeks(buckets)
      setSelectedIdx(buckets.length - 1) // semaine en cours par défaut
    })()

    return () => { cancelled = true }
  }, [userId])

  if (weeks === null) return null
  const maxVal     = Math.max(1, ...weeks.flatMap(w => ORDER.map(k => w[k])))
  const hasAnyData = weeks.some(w => ORDER.some(k => w[k] > 0))
  const selected   = selectedIdx !== null ? weeks[selectedIdx] : null
  const totalKm    = selected ? ORDER.reduce((sum, k) => sum + selected[k], 0) : 0
  const totalDur   = selected ? ORDER.reduce((sum, k) => sum + selected[`${k}Dur`], 0) : 0

  function selectWeek(i) {
    setSelectedIdx(i)
    setSelectedSport(null)
  }

  return (
    <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
      <h4 style={{ marginBottom: '.25rem' }}>📊 Volume hebdomadaire</h4>
      <p style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginBottom: hasAnyData ? '1.5rem' : '0' }}>
        16 dernières semaines, par discipline — clique une semaine pour le détail
      </p>

      {!hasAnyData ? (
        <p style={{ fontSize: '.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem 0', margin: 0 }}>
          Pas encore de séances avec distance renseignée.
        </p>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '.5rem', height: 165, overflowX: 'auto', paddingBottom: '.25rem' }}>
            {weeks.map((w, i) => (
              <div key={i}
                onClick={() => selectWeek(i)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.4rem',
                  flexShrink: 0, minWidth: 58, cursor: 'pointer', padding: '.25rem .2rem', borderRadius: 8,
                  background: i === selectedIdx ? 'var(--surface-2)' : 'transparent',
                  transition: 'background .15s',
                }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 112 }}>
                  {ORDER.map(k => {
                    const h = w[k] > 0 ? Math.max(3, (w[k] / maxVal) * 112) : 2
                    return (
                      <div key={k} title={`${LABELS[k]} — semaine du ${fmtRange(w.monday)} : ${w[k].toFixed(1)} km`}
                        style={{ width: 10, height: h, borderRadius: '3px 3px 0 0',
                          background: COLORS[k], opacity: w[k] > 0 ? 1 : .15,
                          transition: 'height .3s ease' }} />
                    )
                  })}
                </div>
                <div style={{ height: 28, display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
                  <span style={{
                    fontSize: '.58rem', color: i === selectedIdx ? 'var(--text)' : 'var(--text-muted)',
                    fontWeight: i === selectedIdx ? 700 : 400,
                    textAlign: 'center', lineHeight: 1.3, maxWidth: 58,
                  }}>{fmtRange(w.monday)}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '1.25rem', marginTop: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            {ORDER.map(k => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                <div style={{ width: 9, height: 9, borderRadius: 3, background: COLORS[k], flexShrink: 0 }} />
                <span style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>{LABELS[k]}</span>
              </div>
            ))}
          </div>

          {/* Détail de la semaine sélectionnée */}
          {selected && (
            <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius)', padding: '1rem 1.1rem' }}>
              <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginBottom: '.3rem' }}>
                Semaine du {fmtRange(selected.monday)}
              </div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '.9rem' }}>
                {totalKm.toFixed(1)} km{totalDur > 0 && <span style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '1rem' }}> · {fmtDuration(totalDur)}</span>}
              </div>

              <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap', marginBottom: selectedSport ? '.9rem' : 0 }}>
                {ORDER.filter(k => selected[k] > 0).map(k => {
                  const active = selectedSport === k
                  return (
                    <button key={k}
                      onClick={() => setSelectedSport(active ? null : k)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '.4rem',
                        padding: '.45rem .75rem', borderRadius: 99, cursor: 'pointer', fontFamily: 'inherit',
                        border: `1.5px solid ${active ? COLORS[k] : 'var(--border)'}`,
                        background: active ? `${COLORS[k]}18` : 'var(--surface)',
                        color: active ? COLORS[k] : 'var(--text)', fontSize: '.82rem', fontWeight: 700,
                      }}>
                      <span>{EMOJIS[k]}</span>
                      <span>{LABELS[k]}</span>
                      <span style={{ opacity: .7, fontWeight: 600 }}>{selected[k].toFixed(1)} km</span>
                    </button>
                  )
                })}
              </div>

              {selectedSport && selected[selectedSport] > 0 && (
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', paddingTop: '.5rem', borderTop: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize: '.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Distance</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: COLORS[selectedSport] }}>{selected[selectedSport].toFixed(1)} km</div>
                  </div>
                  {selected[`${selectedSport}Dur`] > 0 && (
                    <div>
                      <div style={{ fontSize: '.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Durée</div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800 }}>{fmtDuration(selected[`${selectedSport}Dur`])}</div>
                    </div>
                  )}
                  {avgPace(selectedSport, selected[selectedSport], selected[`${selectedSport}Dur`]) && (
                    <div>
                      <div style={{ fontSize: '.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                        {selectedSport === 'velo' ? 'Vitesse moy.' : 'Allure moy.'}
                      </div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800 }}>{avgPace(selectedSport, selected[selectedSport], selected[`${selectedSport}Dur`])}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
