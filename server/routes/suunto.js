// Suunto OAuth2 + workout upload
// Required env: SUUNTO_CLIENT_ID, SUUNTO_CLIENT_SECRET, SUUNTO_REDIRECT_URI
// Required DB columns on profiles: suunto_connected (bool), suunto_access_token (text), suunto_refresh_token (text)

const express = require('express')
const axios   = require('axios')
const { createClient } = require('@supabase/supabase-js')

const router   = express.Router()
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

const SUUNTO_AUTH_URL  = 'https://cloudapi-oauth.suunto.com/oauth/authorize'
const SUUNTO_TOKEN_URL = 'https://cloudapi-oauth.suunto.com/oauth/token'
const SUUNTO_API_BASE  = 'https://cloudapi.suunto.com/v1'

// GET /auth/suunto — redirect to Suunto OAuth
router.get('/', (req, res) => {
  const { userId } = req.query
  const params = new URLSearchParams({
    client_id:     process.env.SUUNTO_CLIENT_ID,
    redirect_uri:  process.env.SUUNTO_REDIRECT_URI,
    response_type: 'code',
    scope:         'workout',
    state:         userId || '',
  })
  res.redirect(`${SUUNTO_AUTH_URL}?${params}`)
})

// GET /auth/suunto/callback
router.get('/callback', async (req, res) => {
  const { code, state: userId, error } = req.query
  const redirectBase = process.env.CLIENT_URL || 'http://localhost:3000'

  if (error || !code) {
    return res.redirect(`${redirectBase}/app/profile?suunto=error`)
  }

  try {
    const { data: tokenData } = await axios.post(SUUNTO_TOKEN_URL, new URLSearchParams({
      client_id:     process.env.SUUNTO_CLIENT_ID,
      client_secret: process.env.SUUNTO_CLIENT_SECRET,
      code,
      grant_type:    'authorization_code',
      redirect_uri:  process.env.SUUNTO_REDIRECT_URI,
    }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })

    await supabase.from('profiles').update({
      suunto_connected:      true,
      suunto_access_token:   tokenData.access_token,
      suunto_refresh_token:  tokenData.refresh_token,
    }).eq('id', userId)

    res.redirect(`${redirectBase}/app/profile?suunto=connected`)
  } catch (err) {
    console.error('[Suunto OAuth]', err.message)
    res.redirect(`${redirectBase}/app/profile?suunto=error`)
  }
})

// POST /api/suunto/disconnect
router.post('/disconnect', async (req, res) => {
  const { userId } = req.body
  if (!userId) return res.status(400).json({ error: 'Missing userId' })
  try {
    await supabase.from('profiles').update({
      suunto_connected:     false,
      suunto_access_token:  null,
      suunto_refresh_token: null,
    }).eq('id', userId)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/suunto/send-workout — upload a FIT workout to Suunto app
router.post('/send-workout', async (req, res) => {
  const { userId, fitBase64, filename } = req.body
  if (!userId || !fitBase64) return res.status(400).json({ error: 'Missing params' })

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('suunto_access_token, suunto_refresh_token')
      .eq('id', userId)
      .single()

    if (!profile?.suunto_access_token) {
      return res.status(403).json({ error: 'Suunto non connecté' })
    }

    const fitBuffer = Buffer.from(fitBase64, 'base64')
    const FormData = require('form-data')
    const form = new FormData()
    form.append('workoutFile', fitBuffer, { filename: filename || 'workout.fit', contentType: 'application/octet-stream' })

    await axios.post(`${SUUNTO_API_BASE}/workout`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${profile.suunto_access_token}`,
      },
    })

    res.json({ success: true })
  } catch (err) {
    console.error('[Suunto send-workout]', err.response?.data || err.message)
    res.status(500).json({ error: err.response?.data?.message || err.message })
  }
})

module.exports = router
