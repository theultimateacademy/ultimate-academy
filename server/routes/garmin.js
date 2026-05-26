// Garmin Connect OAuth2 + structured workout creation
// Required env: GARMIN_CLIENT_ID, GARMIN_CLIENT_SECRET, GARMIN_REDIRECT_URI
// Required DB columns: garmin_connected (bool), garmin_access_token (text),
//                      garmin_refresh_token (text), garmin_user_id (text), garmin_display_name (text)

const express = require('express')
const axios   = require('axios')
const { createClient } = require('@supabase/supabase-js')

const router   = express.Router()
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

const GARMIN_AUTH_URL  = 'https://connect.garmin.com/oauthConfirm'
const GARMIN_TOKEN_URL = 'https://connectapi.garmin.com/oauth-service/oauth/token'
const GARMIN_API_BASE  = 'https://connectapi.garmin.com'

// ─── GET /auth/garmin ───────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const { userId } = req.query
  const params = new URLSearchParams({
    client_id:     process.env.GARMIN_CLIENT_ID,
    redirect_uri:  process.env.GARMIN_REDIRECT_URI,
    response_type: 'code',
    scope:         'workout:write activities:read',
    state:         userId || '',
  })
  res.redirect(`${GARMIN_AUTH_URL}?${params}`)
})

// ─── GET /auth/garmin/callback ──────────────────────────────────────────────
router.get('/callback', async (req, res) => {
  const { code, state: userId, error } = req.query
  const redirectBase = process.env.CLIENT_URL || 'http://localhost:3000'

  if (error || !code) {
    return res.redirect(`${redirectBase}/app/profile?garmin=error`)
  }

  try {
    const { data: tokenData } = await axios.post(GARMIN_TOKEN_URL,
      new URLSearchParams({
        client_id:     process.env.GARMIN_CLIENT_ID,
        client_secret: process.env.GARMIN_CLIENT_SECRET,
        code,
        grant_type:    'authorization_code',
        redirect_uri:  process.env.GARMIN_REDIRECT_URI,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    )

    // Fetch display name from Garmin user profile
    let displayName = null
    let garminUserId = null
    try {
      const { data: userInfo } = await axios.get(
        `${GARMIN_API_BASE}/userprofile-service/userprofile`,
        { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
      )
      displayName  = userInfo?.displayName || userInfo?.userName || null
      garminUserId = String(userInfo?.userId || userInfo?.id || '')
    } catch (_) {}

    await supabase.from('profiles').update({
      garmin_connected:     true,
      garmin_access_token:  tokenData.access_token,
      garmin_refresh_token: tokenData.refresh_token || null,
      garmin_user_id:       garminUserId,
      garmin_display_name:  displayName,
    }).eq('id', userId)

    res.redirect(`${redirectBase}/app/profile?garmin=connected`)
  } catch (err) {
    console.error('[Garmin OAuth]', err.response?.data || err.message)
    res.redirect(`${redirectBase}/app/profile?garmin=error`)
  }
})

// ─── POST /api/garmin/disconnect ────────────────────────────────────────────
router.post('/disconnect', async (req, res) => {
  const { userId } = req.body
  if (!userId) return res.status(400).json({ error: 'Missing userId' })
  try {
    await supabase.from('profiles').update({
      garmin_connected:     false,
      garmin_access_token:  null,
      garmin_refresh_token: null,
      garmin_user_id:       null,
      garmin_display_name:  null,
    }).eq('id', userId)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── Helpers ────────────────────────────────────────────────────────────────

function secPerKm(paceStr) {
  const m = (paceStr || '').match(/^(\d+):(\d+)/)
  if (!m) return null
  return parseInt(m[1]) * 60 + parseInt(m[2])
}

// Returns m/s from pace string "4:13" or km/h number
function paceToMs(allureMinKm) {
  if (typeof allureMinKm === 'number') return allureMinKm / 3.6
  const secs = secPerKm(allureMinKm)
  return secs ? 1000 / secs : null
}

// Returns { lo, hi } in m/s from a range like "4:13-4:30" (lo=slower, hi=faster)
function parsePaceRange(allureMinKm) {
  if (!allureMinKm) return { lo: null, hi: null }
  const clean  = String(allureMinKm).replace(/\/km.*/, '').trim()
  const parts  = clean.split(/[-–]/).map(s => s.trim())
  const speeds = parts.map(paceToMs).filter(Boolean)
  if (!speeds.length) return { lo: null, hi: null }
  return { lo: Math.min(...speeds), hi: Math.max(...speeds) }
}

function parseMinutes(text) {
  const m = (text || '').match(/(\d+)\s*min/i)
  return m ? parseInt(m[1]) : null
}

function parseIntervals(corps) {
  if (!corps) return null
  const byDist = corps.match(/(\d+)\s*[xX×]\s*(\d+)\s*m\b/)
  if (byDist) return { type: 'distance', reps: parseInt(byDist[1]), value: parseInt(byDist[2]) }
  const byTime = corps.match(/(\d+)\s*[xX×]\s*(\d+(?:[.,]\d+)?)\s*min/)
  if (byTime) return { type: 'time', reps: parseInt(byTime[1]), value: Math.round(parseFloat(byTime[2].replace(',', '.')) * 60) }
  return null
}

function parseRecovery(corps) {
  const s = (corps || '').match(/(\d+)\s*s(?:ec)?\s+(?:de\s+)?r[eé]cup/i)
  if (s) return parseInt(s[1])
  const m = (corps || '').match(/(\d+(?:[.,]\d+)?)\s*min.*?r[eé]cup/i)
  if (m) return Math.round(parseFloat(m[1].replace(',', '.')) * 60)
  return 90
}

// Get effective paces from allures (array or string)
function getEffortPaces(allures) {
  if (!allures) return { ef: { lo: null, hi: null }, spe: { lo: null, hi: null } }

  if (Array.isArray(allures) && allures.length > 0) {
    const valid = allures.filter(a => a?.allure_min_km)
    if (!valid.length) return { ef: { lo: null, hi: null }, spe: { lo: null, hi: null } }
    const ef  = parsePaceRange(valid[0].allure_min_km)
    const spe = parsePaceRange(valid[valid.length - 1].allure_min_km)
    return { ef, spe }
  }

  // String format "4:13-4:30/km ... 3:55-4:05/km"
  const re = /(\d+:\d+(?:\s*[-–]\s*\d+:\d+)?)\s*\/km/g
  const found = []
  let m
  while ((m = re.exec(String(allures))) !== null) found.push(parsePaceRange(m[1]))
  if (!found.length) return { ef: { lo: null, hi: null }, spe: { lo: null, hi: null } }
  return { ef: found[0], spe: found[found.length - 1] }
}

function buildGarminStep(order, stepTypeId, stepTypeKey, endConditionId, endConditionKey, endValue, targetTypeId, targetTypeKey, targetLo, targetHi) {
  const step = {
    stepOrder: order,
    stepType: { stepTypeId, stepTypeKey },
    endCondition: { conditionTypeId: endConditionId, conditionTypeKey: endConditionKey },
    endConditionValue: endValue,
    targetType: { workoutTargetTypeId: targetTypeId, workoutTargetTypeKey: targetTypeKey },
  }
  if (targetLo !== null && targetHi !== null) {
    step.targetValueOne = Math.round(targetLo * 1000) / 1000
    step.targetValueTwo = Math.round(targetHi * 1000) / 1000
  }
  return step
}

function sessionToGarminWorkout(session) {
  const total   = session.duree_min || 45
  const warmMin = parseMinutes(session.echauffement) || Math.max(10, Math.round(total * 0.2))
  const coolMin = parseMinutes(session.retour_au_calme) || Math.max(8, Math.round(total * 0.15))
  const mainMin = Math.max(5, total - warmMin - coolMin)

  const { ef, spe } = getEffortPaces(session.allures)
  const iv          = parseIntervals(session.corps)
  const recovSecs   = parseRecovery(session.corps)

  const steps = []
  let order   = 1

  // Warmup (time-based)
  steps.push(buildGarminStep(
    order++, 1, 'warmup',
    2, 'time', warmMin * 60,
    ef.lo !== null ? 6 : 1, ef.lo !== null ? 'pace.zone' : 'no.target',
    ef.lo, ef.hi
  ))

  if (iv && iv.reps > 1) {
    for (let r = 0; r < iv.reps; r++) {
      // Interval step
      const isTimeBased = iv.type === 'time'
      steps.push(buildGarminStep(
        order++, 3, 'interval',
        isTimeBased ? 2 : 3, isTimeBased ? 'time' : 'distance',
        iv.value,
        spe.lo !== null ? 6 : 1, spe.lo !== null ? 'pace.zone' : 'no.target',
        spe.lo, spe.hi
      ))
      // Recovery (not after last rep)
      if (r < iv.reps - 1) {
        steps.push(buildGarminStep(
          order++, 2, 'recovery',
          2, 'time', recovSecs,
          1, 'no.target', null, null
        ))
      }
    }
  } else {
    // Continuous effort
    steps.push(buildGarminStep(
      order++, 3, 'interval',
      2, 'time', mainMin * 60,
      spe.lo !== null ? 6 : 1, spe.lo !== null ? 'pace.zone' : 'no.target',
      spe.lo, spe.hi
    ))
  }

  // Cooldown
  steps.push(buildGarminStep(
    order++, 4, 'cooldown',
    2, 'time', coolMin * 60,
    ef.lo !== null ? 6 : 1, ef.lo !== null ? 'pace.zone' : 'no.target',
    ef.lo, ef.hi
  ))

  return {
    workoutName: session.titre || 'Séance',
    description: session.notes_coach || '',
    sport: 'running',
    estimatedDurationInSecs: total * 60,
    workoutSegments: [
      {
        segmentOrder: 1,
        sportType: { sportTypeId: 1, sportTypeKey: 'running' },
        workoutSteps: steps,
      },
    ],
  }
}

// ─── POST /api/garmin/send-workout ──────────────────────────────────────────
router.post('/send-workout', async (req, res) => {
  const { userId, session } = req.body
  if (!userId || !session) return res.status(400).json({ error: 'Missing params' })

  try {
    const { data: profile, error: dbErr } = await supabase
      .from('profiles')
      .select('garmin_access_token, garmin_refresh_token, garmin_display_name')
      .eq('id', userId)
      .single()

    if (dbErr || !profile?.garmin_access_token) {
      return res.status(403).json({ error: 'Garmin non connecté' })
    }

    let token = profile.garmin_access_token

    const workout = sessionToGarminWorkout(session)

    let garminRes
    try {
      garminRes = await axios.post(
        `${GARMIN_API_BASE}/workout-service/workout`,
        workout,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'NK': 'NT' } }
      )
    } catch (apiErr) {
      // Try token refresh if 401
      if (apiErr.response?.status === 401 && profile.garmin_refresh_token) {
        const { data: newTokens } = await axios.post(GARMIN_TOKEN_URL,
          new URLSearchParams({
            client_id:     process.env.GARMIN_CLIENT_ID,
            client_secret: process.env.GARMIN_CLIENT_SECRET,
            refresh_token: profile.garmin_refresh_token,
            grant_type:    'refresh_token',
          }),
          { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        )
        token = newTokens.access_token
        await supabase.from('profiles').update({
          garmin_access_token:  token,
          garmin_refresh_token: newTokens.refresh_token || profile.garmin_refresh_token,
        }).eq('id', userId)

        garminRes = await axios.post(
          `${GARMIN_API_BASE}/workout-service/workout`,
          workout,
          { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'NK': 'NT' } }
        )
      } else {
        throw apiErr
      }
    }

    res.json({ success: true, workoutId: garminRes.data?.workoutId || garminRes.data?.id })
  } catch (err) {
    console.error('[Garmin send-workout]', err.response?.data || err.message)
    res.status(500).json({ error: err.response?.data?.message || err.message })
  }
})

// ─── POST /api/garmin/fetch-activity ────────────────────────────────────────
// Polls Garmin for the most recent run activity (used post-session)
router.post('/fetch-activity', async (req, res) => {
  const { userId } = req.body
  if (!userId) return res.status(400).json({ error: 'Missing userId' })

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('garmin_access_token')
      .eq('id', userId)
      .single()

    if (!profile?.garmin_access_token) return res.status(403).json({ error: 'Garmin non connecté' })

    const { data: activities } = await axios.get(
      `${GARMIN_API_BASE}/activitylist-service/activities/search/activities`,
      {
        params: { limit: 1, activityType: 'running', sortBy: 'startLocal', sortOrder: 'desc' },
        headers: { Authorization: `Bearer ${profile.garmin_access_token}` },
      }
    )

    const act = Array.isArray(activities) ? activities[0] : null
    if (!act) return res.json({ activity: null })

    res.json({
      activity: {
        distance_km:    act.distance ? act.distance / 1000 : null,
        duration_min:   act.duration ? Math.round(act.duration / 60) : null,
        avg_pace:       act.averageSpeed ? (1000 / act.averageSpeed / 60).toFixed(2) : null,
        avg_hr:         act.averageHR    || null,
        max_hr:         act.maxHR        || null,
        calories:       act.calories     || null,
        start_date:     act.startTimeLocal || null,
      },
    })
  } catch (err) {
    console.error('[Garmin fetch-activity]', err.response?.data || err.message)
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
