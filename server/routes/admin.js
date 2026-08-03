const express    = require('express');
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const LEVEL_VMA = { debutant: 10, intermediaire: 14, confirme: 17, expert: 20 };

function resolveVma(profile) {
  return (profile.vma_known && profile.vma) ? parseFloat(profile.vma) : LEVEL_VMA[profile.level] || 14;
}

function recalculateDistances(planData, vma) {
  if (!planData?.semaines) return planData;
  for (const sem of planData.semaines) {
    for (const s of (sem.seances || [])) {
      if (s.est_course || !s.duree_min) continue;
      const type = (s.type || '').toLowerCase();
      if (type.includes('renforcement') || type.includes('repos')) { s.distance_km = 0; continue; }
      const validAllures = (s.allures || []).filter(a => typeof a.vitesse_kmh === 'number' && a.vitesse_kmh > 0);
      let avgSpeed;
      if (validAllures.length > 0) {
        avgSpeed = validAllures.reduce((sum, a) => sum + a.vitesse_kmh, 0) / validAllures.length;
        if (type.includes('fractionné') || type.includes('vma')) avgSpeed *= 0.85;
      } else {
        const pct = (type.includes('tempo') || type.includes('seuil')) ? 0.73
          : (type.includes('fractionné') || type.includes('vma'))     ? 0.70
          : 0.67;
        avgSpeed = vma * pct;
      }
      s.distance_km = Math.round((s.duree_min / 60) * avgSpeed * 10) / 10;
    }
    sem.volume_total_km = Math.round((sem.seances || []).reduce((sum, s) => sum + (s.distance_km || 0), 0) * 10) / 10;
  }
  return planData;
}

function getPlanStartMonday(dateStr) {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay();
  if (dow !== 1) {
    const toMonday = dow === 0 ? 1 : 8 - dow;
    d.setDate(d.getDate() + toMonday);
  }
  return d;
}

function getPlanWeeksElapsed(plan) {
  const monday = getPlanStartMonday(plan.activated_at || plan.created_at);
  const today  = new Date(); today.setHours(0, 0, 0, 0);
  const ms     = today.getTime() - monday.getTime();
  if (ms < 0) return 1;
  return Math.floor(ms / (7 * 24 * 3600 * 1000)) + 1;
}

const router   = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ─── Middleware d'authentification coach ────────────────────────────────────
// Accepte soit :
//   1. Header Authorization: Bearer <supabase_jwt>  (utilisé par le frontend coach)
//   2. Header X-Admin-Secret: <secret>              (utilisé par les crons internes)
async function requireAdmin(req, res, next) {
  // Fallback secret statique pour les appels internes/cron
  const secret = req.headers['x-admin-secret'];
  if (secret && secret === process.env.ADMIN_SECRET) return next();

  // Vérification JWT Supabase
  const auth = req.headers['authorization'];
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  if (token) {
    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && user) {
        const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
        if (profile?.role === 'coach') return next();
      }
    } catch (_) {}
  }

  console.warn(`[SECURITY] Accès admin refusé — IP: ${req.ip} — Route: ${req.method} ${req.originalUrl}`);
  return res.status(401).json({ error: 'Non autorisé' });
}

// ─── Route publique — quota athlètes (pas de protection, pas de données sensibles) ──
const ATHLETE_QUOTA = 20;
router.get('/quota', async (req, res) => {
  try {
    const { count, error } = await supabaseAdmin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'athlete')
      .in('subscription_status', ['active', 'trialing']);
    if (error) throw error;
    res.json({ quota: ATHLETE_QUOTA, current: count || 0, full: (count || 0) >= ATHLETE_QUOTA });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.use(requireAdmin);
// ────────────────────────────────────────────────────────────────────────────

// PATCH /api/admin/profile/:id — coach updates athlete profile (bypasses RLS via service key)
router.patch('/profile/:id', async (req, res) => {
  const { id } = req.params;
  const patch = req.body;
  if (!id || !patch || Object.keys(patch).length === 0)
    return res.status(400).json({ error: 'Missing id or patch' });

  // Coerce numeric fields
  const intFields = ['days_per_week','tri_swim_sessions','tri_bike_sessions','tri_run_sessions','race_denivele','ftp_value'];
  for (const k of intFields) {
    if (k in patch && patch[k] !== null) patch[k] = parseInt(patch[k], 10);
  }
  if ('vma' in patch && patch.vma !== null) patch.vma = parseFloat(patch.vma);

  try {
    const { data, error } = await supabase
      .from('profiles').update(patch).eq('id', id).select().single();
    if (error) throw error;
    res.json({ success: true, profile: data });
  } catch (err) {
    console.error('[Admin] Profile update error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/athlete/:id
router.delete('/athlete/:id', async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'Missing id' });

  try {
    // Delete related data first (in case FK constraints don't cascade)
    await Promise.all([
      supabase.from('session_completions').delete().eq('user_id', id),
      supabase.from('weekly_analyses').delete().eq('user_id', id),
      supabase.from('messages').delete().eq('user_id', id),
      supabase.from('strava_activities').delete().eq('user_id', id),
    ]);
    await supabase.from('training_plans').delete().eq('user_id', id);
    await supabase.from('profiles').delete().eq('id', id);
    await supabase.auth.admin.deleteUser(id);

    res.json({ success: true });
  } catch (err) {
    console.error('[Admin] Delete athlete error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/plans/:planId/session  — update one session (coach, bypasses RLS)
router.patch('/plans/:planId/session', async (req, res) => {
  const { planId } = req.params;
  const { weekIdx, sessionIdx, updatedSession } = req.body;
  if (weekIdx == null || sessionIdx == null || !updatedSession)
    return res.status(400).json({ error: 'Missing params' });
  try {
    const { data: row } = await supabase.from('training_plans').select('plan_data').eq('id', planId).single();
    if (!row) return res.status(404).json({ error: 'Plan not found' });
    const pd = JSON.parse(JSON.stringify(row.plan_data));
    pd.semaines[weekIdx].seances[sessionIdx] = { ...pd.semaines[weekIdx].seances[sessionIdx], ...updatedSession };
    await supabase.from('training_plans').update({ plan_data: pd }).eq('id', planId);
    res.json({ success: true, plan_data: pd });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/plans/:planId/session  — delete one session (coach, bypasses RLS)
router.delete('/plans/:planId/session', async (req, res) => {
  const { planId } = req.params;
  const { weekIdx, sessionIdx } = req.body;
  if (weekIdx == null || sessionIdx == null)
    return res.status(400).json({ error: 'Missing params' });
  try {
    const { data: row } = await supabase.from('training_plans').select('plan_data').eq('id', planId).single();
    if (!row) return res.status(404).json({ error: 'Plan not found' });
    const pd = JSON.parse(JSON.stringify(row.plan_data));
    pd.semaines[weekIdx].seances.splice(sessionIdx, 1);
    await supabase.from('training_plans').update({ plan_data: pd }).eq('id', planId);
    res.json({ success: true, plan_data: pd });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/weekly-feedback — save weekly recap (bypasses RLS via service key)
router.post('/weekly-feedback', async (req, res) => {
  try {
    const { user_id, plan_id, week_number, rpe_semaine, ressenti, commentaire } = req.body;
    if (!user_id || !plan_id || !week_number || !ressenti)
      return res.status(400).json({ error: 'Missing required fields' });
    const { error } = await supabase.from('weekly_feedbacks').upsert({
      user_id, plan_id,
      week_number: parseInt(week_number),
      rpe_semaine: parseInt(rpe_semaine) || 6,
      ressenti,
      commentaire: commentaire || null,
    }, { onConflict: 'user_id,plan_id,week_number' });
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/admin/weekly-bilans — tous les bilans (coach)
router.get('/weekly-bilans', async (req, res) => {
  try {
    const { userId } = req.query;
    let query = supabase
      .from('weekly_bilans')
      .select('*')
      .order('submitted_at', { ascending: false });
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ bilans: data || [] });
  } catch (err) {
    console.error('[Admin] weekly-bilans GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/weekly-bilans/:id/response — réponse du coach
router.post('/weekly-bilans/:id/response', async (req, res) => {
  const { id } = req.params;
  const { response } = req.body;
  if (!id || !response) return res.status(400).json({ error: 'Missing id or response' });
  try {
    const { data, error } = await supabase
      .from('weekly_bilans')
      .update({ coach_response: response, coach_responded_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    res.json({ success: true, bilan: data });
  } catch (err) {
    console.error('[Admin] weekly-bilans response error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/athletes — liste tous les athlètes (service key, bypass RLS)
router.get('/athletes', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, objective, sport_type, subscription_status')
      .eq('role', 'athlete')
      .order('first_name');
    if (error) throw error;
    res.json({ athletes: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/athletes/:id/adaptation — adaptation active sur le plan courant
router.get('/athletes/:id/adaptation', async (req, res) => {
  try {
    const { data: plans } = await supabase
      .from('training_plans')
      .select('id, plan_data, updated_at')
      .eq('user_id', req.params.id)
      .in('status', ['active'])
      .order('updated_at', { ascending: false })
      .limit(1);
    const plan = plans?.[0];
    if (!plan) return res.json({ adaptation: null });
    const adapted = plan.plan_data?.semaines?.find(s => s._adapted_for);
    res.json({
      adaptation: adapted?._adapted_for || null,
      updated_at: plan.updated_at,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/monthly-analysis — crée une analyse mensuelle pour un athlète
router.post('/monthly-analysis', async (req, res) => {
  const { user_id, month_label } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id requis' });
  try {
    const { data: existing } = await supabase
      .from('weekly_analyses')
      .select('id')
      .eq('user_id', user_id)
      .eq('status', 'pending')
      .filter('analysis_data->>is_monthly', 'eq', 'true')
      .limit(1);
    if (existing?.length > 0) {
      return res.json({ id: existing[0].id, already_exists: true });
    }
    const month = month_label || new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    const { data, error } = await supabase.from('weekly_analyses').insert({
      user_id,
      week_number: 0,
      status: 'pending',
      analysis_data: { is_monthly: true, month, conseil: '', mood: 'good' },
      coach_message: '',
      created_at: new Date().toISOString(),
    }).select().single();
    if (error) throw error;
    res.json({ id: data.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/athletes/:id/free-activate — activer un athlète gratuitement (coach uniquement)
router.post('/athletes/:id/free-activate', async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'Missing athlete id' });
  try {
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ subscription_status: 'active' })
      .eq('id', id);
    if (error) throw error;
    console.log(`[Admin] Athlète ${id} activé gratuitement par le coach`);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
