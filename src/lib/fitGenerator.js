// FIT workout file generator (binary, little-endian)
// Produces valid .FIT workout files importable by Garmin Connect and Coros app

const CRC_TABLE = [
  0x0000, 0xCC01, 0xD801, 0x1400, 0xF001, 0x3C00, 0x2800, 0xE401,
  0xA001, 0x6C00, 0x7800, 0xB401, 0x5000, 0x9C01, 0x8801, 0x4400,
]

function fitCrc(arr) {
  let crc = 0
  for (const b of arr) {
    let tmp = CRC_TABLE[crc & 0xF]
    crc = (crc >> 4) & 0x0FFF
    crc = crc ^ tmp ^ CRC_TABLE[b & 0xF]
    tmp = CRC_TABLE[crc & 0xF]
    crc = (crc >> 4) & 0x0FFF
    crc = crc ^ tmp ^ CRC_TABLE[(b >> 4) & 0xF]
  }
  return crc
}

function toAscii(s) {
  return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\x20-\x7E]/g, '?')
}

class Buf {
  constructor() { this._d = [] }
  u8(v)  { this._d.push((v >>> 0) & 0xFF); return this }
  u16(v) { const n = v >>> 0; return this.u8(n).u8(n >> 8) }
  u32(v) { const n = v >>> 0; return this.u8(n).u8(n>>8).u8(n>>16).u8(n>>24) }
  str(s, n) {
    const a = toAscii(s)
    for (let i = 0; i < n; i++) this.u8(i < a.length ? a.charCodeAt(i) : 0)
    return this
  }
  bytes() { return this._d }
}

// FIT base types
const T = { ENUM: 0x00, UINT16: 0x84, UINT32: 0x86, STRING: 0x07 }

// Write a definition message
function defMsg(buf, localType, globalMsgNum, fields) {
  buf.u8(0x40 | (localType & 0xF)).u8(0).u8(0).u16(globalMsgNum).u8(fields.length)
  fields.forEach(([fn, sz, bt]) => buf.u8(fn).u8(sz).u8(bt))
}

// ─── Pace helpers ──────────────────────────────────────────────────────────

function secPerKm(s) {
  const m = s.match(/^(\d+):(\d+)$/)
  return m ? +m[1] * 60 + +m[2] : null
}

// Returns FIT speed in mm/s (FIT stores m/s * 1000)
function fitSpeed(spk) {
  return spk ? Math.round(1000000 / spk) : 0xFFFFFFFF
}

// Parse all pace ranges from allures text, returns [{lo,hi}] ordered slow→fast
function parsePaces(allures) {
  if (!allures) return []
  const pairs = []
  const re = /(\d+:\d+)(?:\s*[-–]\s*(\d+:\d+))?\/km/g
  let m
  while ((m = re.exec(allures)) !== null) {
    const s1 = secPerKm(m[1])
    const s2 = m[2] ? secPerKm(m[2]) : s1
    if (s1) {
      const slow = Math.max(s1, s2)
      const fast = Math.min(s1, s2)
      pairs.push({ lo: fitSpeed(slow), hi: fitSpeed(fast) })
    }
  }
  return pairs
}

function parseMin(text) {
  const m = (text || '').match(/(\d+)\s*min/i)
  return m ? +m[1] : null
}

// Parse intervals from corps text: "6x400m", "5x1000m", "4x5min"
function parseIntervals(corps) {
  if (!corps) return null
  const byDist = corps.match(/(\d+)\s*[xX×]\s*(\d+)\s*m\b/)
  if (byDist) {
    return { durType: 2, workVal: +byDist[2] * 100, reps: +byDist[1], recovMs: recovMs(corps) }
  }
  const byTime = corps.match(/(\d+)\s*[xX×]\s*(\d+(?:[.,]\d+)?)\s*min/)
  if (byTime) {
    return { durType: 0, workVal: Math.round(+byTime[2].replace(',', '.') * 60000), reps: +byTime[1], recovMs: recovMs(corps) }
  }
  return null
}

function recovMs(text) {
  const s = text.match(/(\d+)\s*s(?:ec)?\s+(?:de\s+)?r[eé]cup/i)
  if (s) return +s[1] * 1000
  const m = text.match(/(\d+(?:[.,]\d+)?)\s*min.*?r[eé]cup/i)
  if (m) return Math.round(+m[1].replace(',', '.') * 60000)
  return 90000
}

function mkStep(name, intensity, durType, durVal, pace) {
  return {
    name: toAscii(name).substring(0, 15),
    intensity, // 0=active,1=rest,2=warmup,3=cooldown
    durType,   // 0=time(ms),2=dist(cm),6=open
    durVal: durVal >>> 0,
    tgtType: pace ? 0 : 2,
    tgtLo: pace ? pace.lo : 0xFFFFFFFF,
    tgtHi: pace ? pace.hi : 0xFFFFFFFF,
  }
}

// ─── Main export ──────────────────────────────────────────────────────────

export function generateFitWorkout(session) {
  const title  = toAscii(session.titre || 'Seance').substring(0, 15)
  const total  = session.duree_min || 45
  const paces  = parsePaces(session.allures)
  const efPace = paces[0] || null
  const spePace = paces.length > 1 ? paces[paces.length - 1] : efPace

  const warmMin = parseMin(session.echauffement) || Math.max(10, Math.round(total * 0.2))
  const coolMin = parseMin(session.retour_au_calme) || Math.max(8, Math.round(total * 0.15))
  const mainMin = Math.max(5, total - warmMin - coolMin)

  const steps = []
  steps.push(mkStep('Echauffement', 2, 0, warmMin * 60000, efPace))

  const iv = parseIntervals(session.corps)
  if (iv && iv.reps > 1) {
    for (let r = 0; r < iv.reps; r++) {
      steps.push(mkStep(`Intervalle ${r + 1}`, 0, iv.durType, iv.workVal, spePace))
      if (r < iv.reps - 1)
        steps.push(mkStep('Recuperation', 1, 0, iv.recovMs, null))
    }
  } else {
    steps.push(mkStep('Corps de seance', 0, 0, mainMin * 60000, spePace))
  }

  steps.push(mkStep('Retour au calme', 3, 0, coolMin * 60000, efPace))

  // ─── Binary body ───
  const body = new Buf()

  // File ID (global msg 0)
  defMsg(body, 0, 0, [[0,1,T.ENUM],[1,2,T.UINT16],[4,4,T.UINT32]])
  body.u8(0)   // data header: local type 0
      .u8(5)   // type = workout
      .u16(1)  // manufacturer = Garmin (compatibility)
      .u32(Math.floor(Date.now() / 1000) - 631065600) // FIT epoch

  // Workout (global msg 26)
  defMsg(body, 1, 26, [[4,1,T.ENUM],[5,2,T.UINT16],[8,16,T.STRING]])
  body.u8(1)            // data header: local type 1
      .u8(1)            // sport = running
      .u16(steps.length)
      .str(title, 16)

  // WorkoutStep (global msg 27)
  defMsg(body, 2, 27, [
    [0, 2, T.UINT16],  // message_index
    [1, 16, T.STRING], // wkt_step_name
    [2, 1, T.ENUM],    // duration_type
    [3, 4, T.UINT32],  // duration_value
    [4, 1, T.ENUM],    // target_type
    [6, 4, T.UINT32],  // target_low  (speed in mm/s)
    [7, 4, T.UINT32],  // target_high (speed in mm/s)
    [8, 1, T.ENUM],    // intensity
  ])

  steps.forEach((s, i) => {
    body.u8(2)
        .u16(i)
        .str(s.name, 16)
        .u8(s.durType)
        .u32(s.durVal)
        .u8(s.tgtType)
        .u32(s.tgtLo)
        .u32(s.tgtHi)
        .u8(s.intensity)
  })

  const bodyBytes = body.bytes()

  // ─── File header (14 bytes) ───
  const hdr = [
    14, 0x10,                              // header size, protocol 1.0
    2132 & 0xFF, 2132 >> 8,               // profile version LE
    bodyBytes.length & 0xFF,
    (bodyBytes.length >> 8) & 0xFF,
    (bodyBytes.length >> 16) & 0xFF,
    (bodyBytes.length >> 24) & 0xFF,
    0x2E, 0x46, 0x49, 0x54,               // ".FIT"
  ]
  const hdrCrc = fitCrc(hdr)
  hdr.push(hdrCrc & 0xFF, hdrCrc >> 8)

  const all = [...hdr, ...bodyBytes]
  const fileCrc = fitCrc(bodyBytes)
  all.push(fileCrc & 0xFF, fileCrc >> 8)

  return new Uint8Array(all)
}

export function downloadFit(session, label, filename) {
  const bytes = generateFitWorkout(session)
  const blob = new Blob([bytes], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || `${toAscii(session.titre || 'seance').replace(/[^a-zA-Z0-9]/g, '_')}_${label || 'export'}.fit`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
