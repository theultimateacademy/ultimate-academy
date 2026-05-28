const express    = require('express');
const { createClient } = require('@supabase/supabase-js');

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
      supabase.from('profiles').select('first_name, last_name, period_pain_days').eq('id', userId).single(),
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
      currentWeek._original_seances = JSON.parse(JSON.stringify(currentWeek.seances));
      currentWeek._original_charge  = currentWeek.charge;
      currentWeek._adapted_for      = 'cycle';

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

    await supabase.from('training_plans').update({ plan_data: updatedPlan }).eq('id', plan.id);

    res.json({ success: true, planData: updatedPlan });
  } catch (err) {
    console.error('[Admin] Period alert error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
