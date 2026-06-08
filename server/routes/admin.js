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

module.exports = router;
