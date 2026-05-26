export function fmtHMS(secs) {
  secs = Math.round(Math.max(0, secs))
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export function fmtPaceSecs(secsPerKm) {
  if (!secsPerKm || secsPerKm <= 0) return '—'
  secsPerKm = Math.round(secsPerKm)
  return `${Math.floor(secsPerKm / 60)}'${String(secsPerKm % 60).padStart(2, '0')}"`
}

export function kmhToPace(kmh) {
  if (!kmh || kmh <= 0) return '—'
  return fmtPaceSecs(3600 / kmh)
}

export function parsePaceStr(str) {
  if (!str || !str.trim()) return null
  const s = str.trim().replace(/['"″]/g, '').replace(',', '.')
  const parts = s.split(':')
  const min = parseFloat(parts[0])
  const sec = parseFloat(parts[1] ?? '0')
  if (isNaN(min) || min < 0) return null
  const total = min * 60 + (isNaN(sec) ? 0 : sec)
  return total > 0 && total < 2400 ? total : null
}

export const DIST_PRESETS = [
  { label: '5 km',     km: 5,       key: '5k' },
  { label: '10 km',    km: 10,      key: '10k' },
  { label: 'Semi',     km: 21.0975, key: 'semi' },
  { label: 'Marathon', km: 42.195,  key: 'marathon' },
]

export const VMA_ZONES = [
  { n: 1, name: 'Récupération',           pct: [0.55, 0.65], color: '#60A5FA' },
  { n: 2, name: 'Endurance fondamentale', pct: [0.65, 0.75], color: '#34D399' },
  { n: 3, name: 'Allure marathon',        pct: [0.75, 0.80], color: '#A3E635' },
  { n: 4, name: 'Seuil anaérobie',        pct: [0.80, 0.90], color: '#FBBF24' },
  { n: 5, name: 'VMA',                    pct: [0.90, 1.00], color: '#F97316' },
  { n: 6, name: 'Sur-vitesse',            pct: [1.00, 1.10], color: '#C084FC' },
]
