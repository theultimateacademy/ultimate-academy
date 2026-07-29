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
  // Running
  '5km':        '5 km',
  '10km':       '10 km',
  'semi':       'Semi-marathon',
  'marathon':   'Marathon',
  // Trail
  'trail_10k':  'Trail 10K',
  'trail_15k':  'Trail 15K',
  'trail_20k':  'Trail 20K',
  'trail_30k':  'Trail 30K',
  'trail_50k':  'Trail 50K',
  'trail_80k':  'Trail 80K',
  'trail_100k': 'Trail 100K',
  'trail_100m': 'Trail 100M',
  // Triathlon
  'tri_sprint':  'Triathlon Sprint',
  'tri_olympic': 'Triathlon Olympic',
  'tri_half':    'Half Ironman 70.3',
  'tri_ironman': 'Ironman',
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

// ── Palette principale par discipline ─────────────────────────────────────────
// Course à pied : vert/lime/violet/rose — famille running
// Renforcement  : rose #EC4899
// Natation      : cyan #06B6D4
// Vélo          : orange #F97316
// Brique        : violet #8B5CF6
// Courses/Race  : or/ambre

// ── Palette strictement par discipline — aucun doublon inter-sport ────────────
// Course à pied : famille vert / rose / violet / ambre
// Renforcement  : rose fuchsia
// Natation      : famille cyan / bleu ciel
// Vélo          : famille orange / ambre foncé
// Trail         : famille vert forêt / brun / olive
// Brique        : violet
// Race          : or / pêche

export const SESSION_TYPE_COLORS = {
  // ── Course à pied — toutes en vert ────────────────────────
  'Endurance fondamentale':  '#10B981',  // vert émeraude
  'Footing progressif':      '#10B981',
  'Récupération active':     '#34D399',  // vert clair
  'Sortie longue':           '#10B981',
  'Fractionné court':        '#059669',  // vert foncé
  'Fractionné long':         '#059669',
  'Tempo':                   '#065F46',  // vert très foncé
  'Tempo / Seuil':           '#065F46',
  'Tempo/Seuil':             '#065F46',
  'Côtes':                   '#047857',
  'Spécifique':              '#047857',
  // ── Renforcement ───────────────────────────────────────────
  'Renforcement':            '#EC4899',  // rose fuchsia
  'Renforcement musculaire': '#EC4899',
  // ── Trail — famille verts forêt / brun ─────────────────────
  'Trail endurance':         '#22C55E',  // vert forêt
  'Trail fractionné':        '#16A34A',  // vert foncé
  'Trail côtes':             '#65A30D',  // vert olive
  'Trail technique':         '#CA8A04',  // doré / terre
  'Trail montagne':          '#92400E',  // brun montagne
  'Trail simulation':        '#059669',  // émeraude trail
  // ── Natation — famille cyan / bleu ─────────────────────────
  'Natation':                '#06B6D4',  // cyan
  'Natation endurance':      '#06B6D4',
  'Natation vitesse':        '#0891B2',  // cyan foncé
  'Natation seuil':          '#0891B2',
  'Natation tempo':          '#0891B2',
  'Natation technique':      '#22D3EE',  // cyan clair
  'Natation test':           '#0284C7',  // bleu intense
  'Natation récupération':   '#A5F3FC',  // cyan très clair (≠ gris running)
  // ── Vélo — famille orange / ambre ──────────────────────────
  'Vélo':                    '#F97316',  // orange
  'Vélo endurance':          '#F97316',
  'Vélo tempo':              '#EA580C',  // orange foncé
  'Vélo intervalles':        '#C2410C',  // orange-brun intense
  'Vélo côtes':              '#9A3412',  // terre cuite foncée
  'Vélo test':               '#FDBA74',  // pêche clair (≠ course intermédiaire)
  'Vélo récupération':       '#FED7AA',  // orange très clair (≠ gris running)
  // ── Brique ─────────────────────────────────────────────────
  'Brique':                  '#8B5CF6',  // violet
  // ── Courses / Race ─────────────────────────────────────────
  'Course':                  '#FFD700',  // or
  'Course intermédiaire':    '#FFD700',  // jaune or — même famille que Course
  'Compétition':             '#FFD700',  // or — même famille que Course
  // ── Générique running — toutes en vert (jamais violet) ──────
  'Récupération':            '#34D399',
  'Activation':              '#10B981',
  'Footing tempo':           '#065F46',
  'Footing tempo / seuil':   '#065F46',
  'Tempo seuil':             '#065F46',
  'Seuil':                   '#065F46',
  'Sortie trail':            '#22C55E',
  'Sortie longue trail':     '#22C55E',
  'Marche nordique / Trail spécifique': '#CA8A04',
  // Renforcement — variantes roses
  'Renforcement gainage':    '#EC4899',
  'Renforcement trail':      '#EC4899',
  'Mobilité & Récupération': '#EC4899',
  'Mobilité':                '#EC4899',
}
