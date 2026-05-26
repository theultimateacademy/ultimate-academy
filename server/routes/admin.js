const express    = require('express');
const { createClient } = require('@supabase/supabase-js');

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

    const painDays    = profile?.period_pain_days || 1;
    const startDate   = new Date(plan.activated_at || plan.created_at);
    const weeksElapsed = Math.max(1, Math.floor((Date.now() - startDate.getTime()) / (7 * 24 * 3600 * 1000))) + 1;

    const updatedPlan = JSON.parse(JSON.stringify(plan.plan_data));
    let sessionsReplaced = 0;
    const maxReplace     = Math.ceil(painDays / 2); // replace 1 session per ~2 days

    // Replace remaining running sessions in current week (and next if needed)
    for (const week of updatedPlan.semaines) {
      if (week.numero < weeksElapsed) continue;
      if (sessionsReplaced >= maxReplace) break;
      for (let i = 0; i < week.seances.length; i++) {
        if (sessionsReplaced >= maxReplace) break;
        const s = week.seances[i];
        if (s.type === 'Renforcement musculaire') continue;
        if (s.type === 'Récupération active') continue;
        week.seances[i] = {
          ...s,
          type:             'Récupération active',
          titre:            'Récupération — période douloureuse',
          duree_min:        30,
          echauffement:     '5 min de marche douce',
          corps:            '20 min de footing très léger ou marche active selon ressenti',
          retour_au_calme:  '5 min d\'étirements doux',
          allures:          'Au ressenti — très facile',
          notes_coach:      'Prends soin de toi. On garde juste du mouvement doux. Pas de pression.',
          rpe_cible:        2
        };
        sessionsReplaced++;
      }
    }

    await supabase.from('training_plans').update({ plan_data: updatedPlan }).eq('id', plan.id);

    // Notification discrète au coach
    await supabase.from('messages').insert({
      user_id: userId,
      sender:  'system',
      content: `🔔 ${profile?.first_name} a activé l'alerte règles. ${sessionsReplaced} séance(s) adaptée(s) en récupération active pour ${painDays} jour(s).`,
      read:    false
    });

    res.json({ success: true, sessionsReplaced });
  } catch (err) {
    console.error('[Admin] Period alert error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
