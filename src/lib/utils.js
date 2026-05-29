// Convert VMA (km/h) + percentage to pace string "M:SS min/km"
export function vmaToPace(vma, pct) {
  if (!vma || !pct) return 'N/C'
  const speed = vma * (pct / 100)        // km/h
  const minPerKm = 60 / speed            // min/km
  const mins = Math.floor(minPerKm)
  const secs = Math.round((minPerKm - mins) * 60)
  return `${mins}:${String(secs).padStart(2, '0')} min/km`
}

// Parse an allures string like "70-75% VMA" and return pace range
export function parseAllutesPace(allures, vma) {
  if (!vma || !allures) return allures || 'à définir avec ton coach'
  const match = allures.match(/(\d+)[-–](\d+)%/)
  if (match) {
    const lo = parseInt(match[1])
    const hi = parseInt(match[2])
    return `${vmaToPace(vma, hi)} → ${vmaToPace(vma, lo)}`
  }
  const single = allures.match(/(\d+)%/)
  if (single) return vmaToPace(vma, parseInt(single[1]))
  return allures
}

// Format distance in meters to "X,XX km"
export function fmtDistance(m) {
  if (!m) return 'N/C'
  return `${(m / 1000).toFixed(2).replace('.', ',')} km`
}

// Format seconds to "Xh YYmin" or "XXmin"
export function fmtDuration(sec) {
  if (!sec) return 'N/C'
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}min` : `${m}min`
}

// Format pace from m/s to "M:SS min/km"
export function fmtPaceFromSpeed(mps) {
  if (!mps) return 'N/C'
  const minPerKm = 1000 / mps / 60
  const mins = Math.floor(minPerKm)
  const secs = Math.round((minPerKm - mins) * 60)
  return `${mins}:${String(secs).padStart(2, '0')} min/km`
}

// Days until a date
export function daysUntil(dateStr) {
  if (!dateStr) return null
  const diff = new Date(dateStr) - new Date()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

// Returns the Monday on or after the given date string/Date.
// Plans always start on a Monday — if created on Thu May 28, week 1 begins Mon Jun 1.
export function getPlanStartMonday(dateStr) {
  const d = new Date(dateStr)
  d.setHours(0, 0, 0, 0)
  const dow = d.getDay() // 0=Sun 1=Mon … 6=Sat
  if (dow !== 1) {
    const toMonday = dow === 0 ? 1 : 8 - dow
    d.setDate(d.getDate() + toMonday)
  }
  return d
}

// Returns how many weeks into the plan we are (1-based), or 0 if not started yet.
export function getPlanWeeksElapsed(plan) {
  const monday = getPlanStartMonday(plan.activated_at || plan.created_at)
  const today  = new Date(); today.setHours(0, 0, 0, 0)
  const ms     = today.getTime() - monday.getTime()
  if (ms < 0) return 0
  return Math.floor(ms / (7 * 24 * 3600 * 1000)) + 1
}

export const OBJECTIVE_LABELS = {
  '5km':        '5 km',
  '10km':       '10 km',
  'semi':       'Semi-marathon',
  'marathon':   'Marathon',
  'trail_20k':  'Trail 20K',
  'trail_50k':  'Trail 50K',
  'trail_100k': 'Trail 100K',
  'trail_100m': 'Trail 100M',
}

export const LEVEL_LABELS = {
  'debutant':     'Débutant',
  'intermediaire': 'Intermédiaire',
  'confirme':     'Confirmé',
  'expert':       'Expert'
}

export const DAY_LABELS = {
  'Lun': 'Lundi', 'Mar': 'Mardi', 'Mer': 'Mercredi',
  'Jeu': 'Jeudi', 'Ven': 'Vendredi', 'Sam': 'Samedi', 'Dim': 'Dimanche'
}

export const SESSION_TYPE_COLORS = {
  'Endurance fondamentale':  '#10B981',
  'Footing progressif':      '#06B6D4',
  'Fractionné court':        '#E8237A',
  'Fractionné long':         '#8B2FC9',
  'Tempo':                   '#F59E0B',
  'Côtes':                   '#EF4444',
  'Spécifique':              '#6366F1',
  'Sortie longue':           '#0EA5E9',
  'Récupération active':     '#6B7280',
  'Renforcement musculaire': '#D97706',
  'Course':                  '#FFD700',
  'Course intermédiaire':    '#FB923C',
}
