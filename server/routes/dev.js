const express  = require('express');
const { createClient } = require('@supabase/supabase-js');

const router   = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const TEST_EMAIL    = 'test@athlete.com';
const TEST_PASSWORD = 'Test1234!';

router.post('/test-login', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Not available in production' });
  }

  try {
    // 1. Récupère ou crée le user
    const { data: listData, error: listErr } = await supabase.auth.admin.listUsers();
    if (listErr) throw new Error('listUsers: ' + listErr.message);

    let user = listData?.users?.find(u => u.email === TEST_EMAIL);

    if (!user) {
      console.log('[DEV] Creating test user…');
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        email_confirm: true,
        user_metadata: { first_name: 'Test', last_name: 'Athlete' }
      });
      if (createErr) throw new Error('createUser: ' + createErr.message);
      user = created.user;
      console.log('[DEV] User created:', user.id);
      // Laisse le trigger créer le profil de base
      await new Promise(r => setTimeout(r, 500));
    } else {
      console.log('[DEV] User exists:', user.id);
    }

    // 2. INSERT le profil s'il n'existe pas, puis UPDATE dans tous les cas
    await supabase.from('profiles').insert({
      id:         user.id,
      email:      TEST_EMAIL,
      first_name: 'Test',
      last_name:  'Athlete',
      role:       'athlete'
    }).then(() => {}); // ignore l'erreur si déjà existant

    const { error: updateErr } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'active',
        profile_completed:   true,
        role:                'athlete',
      })
      .eq('id', user.id);

    if (updateErr) throw new Error('profile update: ' + updateErr.message);

    // 3. Vérifie que le profil est bien actif
    const { data: profile, error: fetchErr } = await supabase
      .from('profiles')
      .select('subscription_status, profile_completed')
      .eq('id', user.id)
      .single();

    if (fetchErr) throw new Error('profile fetch: ' + fetchErr.message);
    console.log('[DEV] Profile state:', profile);

    if (profile.subscription_status !== 'active') {
      throw new Error('Profile not active after update — check RLS or service key');
    }

    res.json({ email: TEST_EMAIL, password: TEST_PASSWORD, profileOk: true });

  } catch (err) {
    console.error('[DEV] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/dev/setup-coach — crée ou configure le compte coach
router.post('/setup-coach', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email et password requis' });

  try {
    // 1. Cherche si le compte existe déjà
    const { data: listData } = await supabase.auth.admin.listUsers();
    let user = listData?.users?.find(u => u.email === email);

    if (!user) {
      // 2. Crée le compte sans confirmation email
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email, password,
        email_confirm: true,
        user_metadata: { first_name: 'Alexis', last_name: 'Coach' }
      });
      if (createErr) throw new Error('createUser: ' + createErr.message);
      user = created.user;
      await new Promise(r => setTimeout(r, 500));
    } else {
      // Force confirmation email + met à jour le mot de passe
      await supabase.auth.admin.updateUserById(user.id, {
        password,
        email_confirm: true
      });
    }

    // 3. Insert profil si absent
    await supabase.from('profiles').insert({
      id: user.id, email,
      first_name: 'Alexis', last_name: 'Coach'
    }).then(() => {});

    // 4. Force role = 'coach'
    const { error: updateErr } = await supabase.from('profiles').update({
      role: 'coach',
      subscription_status: 'active',
      profile_completed: true,
      first_name: 'Alexis',
      last_name: 'Coach'
    }).eq('id', user.id);

    if (updateErr) throw new Error('profile update: ' + updateErr.message);

    console.log('[DEV] Coach account ready:', user.id);
    res.json({ ok: true });
  } catch (err) {
    console.error('[DEV] setup-coach error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
