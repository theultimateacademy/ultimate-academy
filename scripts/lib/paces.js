// Conversion VMA (km/h) → allure (min/km) pour un % de VMA donné.
// Convention coach : l'allure objectif course (10km) = 90% de la VMA.
const OBJ_PCT = 90

function speedFromPct(vma, pct) {
  return vma * (pct / 100)
}

function paceMinSecFromSpeed(speedKmh) {
  const paceMin = 60 / speedKmh
  let min = Math.floor(paceMin)
  let sec = Math.round((paceMin - min) * 60)
  if (sec === 60) { sec = 0; min += 1 }
  return { min, sec }
}

function formatPace(vma, pct, { suffix = false } = {}) {
  const { min, sec } = paceMinSecFromSpeed(speedFromPct(vma, pct))
  const s = `${min}'${String(sec).padStart(2, '0')}"`
  return suffix ? `${s}/km` : s
}

// pctMin/pctMax : du plus lent (% le plus bas) au plus rapide (% le plus haut)
function formatPaceRange(vma, pctMin, pctMax, { suffix = true } = {}) {
  const slow = formatPace(vma, pctMin)
  const fast = formatPace(vma, pctMax)
  const s = `${slow}-${fast}`
  return suffix ? `${s}/km` : s
}

function formatSpeed(vma, pct) {
  const speed = speedFromPct(vma, pct)
  return `${speed.toFixed(1).replace('.', ',')} km/h`
}

function formatObjPace(vma, { suffix = true } = {}) {
  return formatPace(vma, OBJ_PCT, { suffix })
}

module.exports = {
  OBJ_PCT,
  speedFromPct,
  formatPace,
  formatPaceRange,
  formatSpeed,
  formatObjPace,
}
