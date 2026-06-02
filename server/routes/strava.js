const express = require('express');
const axios   = require('axios');
const { createClient } = require('@supabase/supabase-js');

const router   = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const STRAVA_TOKEN_URL   = 'https://www.strava.com/oauth/token';
const STRAVA_DEAUTH_URL  = 'https://www.strava.com/oauth/deauthorize';
const STRAVA_API_BASE    = 'https://www.strava.com/api/v3';

// GET /auth/strava  — redirect to Strava OAuth
router.get('/', (req, res) => {
  const { userId } = req.query;
  const params = new URLSearchParams({
    client_id:     process.env.STRAVA_CLIENT_ID,
    redirect_uri:  process.env.STRAVA_REDIRECT_URI,
    response_type: 'code',
    approval_prompt: 'force',
    scope:         'read,activity:read_all',
    state:         userId || ''
  });
  res.redirect(`https://www.strava.com/oauth/authorize?${params}`);
});

// GET /auth/strava/callback
router.get('/callback', async (req, res) => {
  const { code, state: userId, error } = req.query;
  const redirectBase = process.env.CLIENT_URL || 'http://localhost:3000';

  console.log('[Strava callback] STRAVA_REDIRECT_URI:', process.env.STRAVA_REDIRECT_URI);
  console.log('[Strava callback] CLIENT_URL:', process.env.CLIENT_URL);
  console.log('[Strava callback] code:', !!code, '| userId:', userId, '| error:', error);

  if (error || !code) {
    console.error('[Strava callback] OAuth error from Strava:', error);
    return res.redirect(`${redirectBase}/app/profile?strava=error&reason=${encodeURIComponent(error || 'no_code')}`);
  }

  try {
    const { data: tokenData } = await axios.post(STRAVA_TOKEN_URL, {
      client_id:     process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type:    'authorization_code'
    });

    const { access_token, refresh_token, expires_at, athlete } = tokenData;

    await supabase.from('strava_connections').upsert({
      user_id:       userId,
      access_token,
      refresh_token,
      expires_at,
      athlete_id:    athlete.id,
      athlete_name:  `${athlete.firstname} ${athlete.lastname}`,
      updated_at:    new Date().toISOString()
    }, { onConflict: 'user_id' });

    await supabase.from('profiles')
      .update({ strava_connected: true })
      .eq('id', userId);

    // Auto-import recent activities
    await importActivities(userId, access_token);

    res.redirect(`${redirectBase}/app/profile?strava=connected`);
  } catch (err) {
    const errDetail = err.response?.data || err.message;
    console.error('[Strava callback] ERROR:', JSON.stringify(errDetail));
    res.redirect(`${redirectBase}/app/profile?strava=error&reason=${encodeURIComponent(JSON.stringify(errDetail).substring(0, 200))}`);
  }
});

// POST /api/strava/import  — manual refresh import
router.post('/import', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  try {
    const token = await getValidToken(userId);
    const count = await importActivities(userId, token);
    res.json({ imported: count });
  } catch (err) {
    console.error('Strava import error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/strava/disconnect
router.post('/disconnect', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  try {
    const { data: conn } = await supabase
      .from('strava_connections').select('access_token').eq('user_id', userId).single();

    if (conn?.access_token) {
      await axios.post(STRAVA_DEAUTH_URL, null, {
        headers: { Authorization: `Bearer ${conn.access_token}` }
      }).catch(() => {});
    }

    await supabase.from('strava_connections').delete().eq('user_id', userId);
    await supabase.from('profiles').update({ strava_connected: false }).eq('id', userId);
    res.json({ success: true });
  } catch (err) {
    console.error('Strava disconnect error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── Helpers ───────────────────────────────────────────────────

async function getValidToken(userId) {
  const { data: conn } = await supabase
    .from('strava_connections')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .single();

  if (!conn) throw new Error('No Strava connection found');

  // Refresh if token expires within 5 minutes
  if (conn.expires_at * 1000 < Date.now() + 5 * 60 * 1000) {
    const { data: refreshed } = await axios.post(STRAVA_TOKEN_URL, {
      client_id:     process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: conn.refresh_token,
      grant_type:    'refresh_token'
    });

    await supabase.from('strava_connections').update({
      access_token:  refreshed.data.access_token,
      refresh_token: refreshed.data.refresh_token,
      expires_at:    refreshed.data.expires_at,
      updated_at:    new Date().toISOString()
    }).eq('user_id', userId);

    return refreshed.data.access_token;
  }

  return conn.access_token;
}

async function importActivities(userId, accessToken) {
  const { data: activities } = await axios.get(`${STRAVA_API_BASE}/athlete/activities`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    params: { per_page: 50, page: 1 }
  });

  const runs = activities.filter(a => a.type === 'Run' || a.type === 'TrailRun');
  let count = 0;

  for (const act of runs) {
    const { error } = await supabase.from('strava_activities').upsert({
      user_id:           userId,
      strava_id:         act.id,
      name:              act.name,
      distance:          act.distance,
      moving_time:       act.moving_time,
      elapsed_time:      act.elapsed_time,
      average_heartrate: act.average_heartrate,
      max_heartrate:     act.max_heartrate,
      average_speed:     act.average_speed,
      start_date:        act.start_date,
      type:              act.type,
      raw_data:          act
    }, { onConflict: 'strava_id' });

    if (!error) count++;
  }

  return count;
}

module.exports = router;
