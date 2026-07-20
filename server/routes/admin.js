const express    = require('express');
const { createClient } = require('@supabase/supabase-js');

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

// POST /api/admin/period-alert  — adapts current week's plan for menstrual pain
router.post('/period-alert', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  try {
    const [{ data: profile }, { data: plan }] = await Promise.all([
      supabase.from('profiles').select('first_name, last_name, period_pain_days, vma, vma_known, level').eq('id', userId).single(),
      supabase.from('training_plans').select('id, plan_data, activated_at, created_at')
        .eq('user_id', userId).eq('status', 'active').single()
    ]);

    if (!plan) return res.status(404).json({ error: 'Aucun plan actif trouvé.' });

    const painDays     = profile?.period_pain_days || 1;
    const weeksElapsed = getPlanWeeksElapsed(plan);

    const updatedPlan = JSON.parse(JSON.stringify(plan.plan_data));

    // Number of complete rest sessions: ~2 for 3 pain days, scales with painDays
    const restSessions = Math.max(1, Math.round(painDays * 2 / 3));

    const currentWeek = updatedPlan.semaines.find(s => s.numero === weeksElapsed);
    if (currentWeek) {
      // Preserve existing backup if another adaptation was already active
      if (!currentWeek._original_seances) {
        currentWeek._original_seances = JSON.parse(JSON.stringify(currentWeek.seances));
        currentWeek._original_charge  = currentWeek.charge;
      }
      currentWeek._adapted_for = 'cycle';

      let replaced = 0;
      for (let i = 0; i < currentWeek.seances.length; i++) {
        if (replaced >= restSessions) break;
        const s = currentWeek.seances[i];
        if ((s.type || '').toLowerCase().includes('renforcement')) continue;
        if (s.type === 'Repos') continue;
        currentWeek.seances[i] = {
          ...s,
          type:            'Repos',
          titre:           'Repos complet — période douloureuse 🌸',
          duree_min:       0,
          intensite:       'repos',
          echauffement:    '',
          corps:           'Journée de repos complet. Accorde-toi du temps pour récupérer — ton corps en a besoin.',
          retour_au_calme: '',
          allures:         [],
          notes_coach:     'Prends soin de toi. Hydrate-toi, repose-toi et écoute ton corps. On reprend dès que tu te sens prête.',
          rpe_cible:       0,
          est_seance_cle:  false,
        };
        replaced++;
      }
    }

    recalculateDistances(updatedPlan, resolveVma(profile));
    await supabase.from('training_plans').update({ plan_data: updatedPlan }).eq('id', plan.id);

    res.json({ success: true, planData: updatedPlan });
  } catch (err) {
    console.error('[Admin] Period alert error:', err.message);
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

module.exports = router;
