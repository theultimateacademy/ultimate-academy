global.WebSocket = require('ws');
require('dotenv').config();

process.on('unhandledRejection', (reason) => {
  console.error('[CRASH] Unhandled rejection:', reason);
  process.exit(1);
});
process.on('uncaughtException', (err) => {
  console.error('[CRASH] Uncaught exception:', err);
  process.exit(1);
});

const REQUIRED_ENV = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'ANTHROPIC_API_KEY',
];

const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length) {
  console.error('[STARTUP] Missing environment variables:', missing.join(', '));
  process.exit(1);
}

const express    = require('express');
const cors       = require('cors');
const cron       = require('node-cron');
const { createClient } = require('@supabase/supabase-js');
const Anthropic  = require('@anthropic-ai/sdk');

const stripeRoutes    = require('./routes/stripe');
const anthropicRoutes = require('./routes/anthropic');
const stravaRoutes    = require('./routes/strava');
const suuntoRoutes    = require('./routes/suunto');
const garminRoutes    = require('./routes/garmin');
const devRoutes       = require('./routes/dev');
const adminRoutes     = require('./routes/admin');
const { router: blogRoutes, generateAndPublish } = require('./routes/blog');

const app  = express();
const PORT = process.env.PORT || 3001;

// Stripe webhook needs raw body
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

app.use('/api/stripe',  stripeRoutes);
app.use('/api',         anthropicRoutes);
app.use('/auth/strava', stravaRoutes);
app.use('/api/strava',  stravaRoutes);
app.use('/auth/suunto', suuntoRoutes);
app.use('/api/suunto',  suuntoRoutes);
app.use('/auth/garmin', garminRoutes);
app.use('/api/garmin',  garminRoutes);
app.use('/api/dev',     devRoutes);
app.use('/api/admin',  adminRoutes);
app.use('/api/blog',   blogRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Blog auto-publish — Monday, Wednesday, Friday at 11:00
cron.schedule('0 11 * * 1,3,5', async () => {
  console.log('[CRON] Blog auto-publish triggered…');
  try {
    await generateAndPublish();
  } catch (err) {
    console.error('[CRON] Blog publish error:', err.message);
  }
});

// Pre-race analysis — every day at 06:00 (J-7)
cron.schedule('0 6 * * *', async () => {
  console.log('[CRON] Running pre-race analysis check…');
  try {
    const axios = require('axios');
    await axios.post(`http://localhost:${PORT}/api/analyses/pre-race/run`, { _internal: true });
  } catch (err) {
    console.error('[CRON] Pre-race analysis error:', err.message);
  }
});

// Intermediate post-race follow-up — every day at 09:00 (J+2 after intermediate race)
cron.schedule('0 9 * * *', async () => {
  console.log('[CRON] Running intermediate post-race analysis…');
  try {
    const axios = require('axios');
    await axios.post(`http://localhost:${PORT}/api/analyses/intermediate-post/run`, {}, { timeout: 120000 });
  } catch (err) {
    console.error('[CRON] Intermediate post-race error:', err.message);
  }
});

// Weekly analysis — every Sunday at 18:00
cron.schedule('0 18 * * 0', async () => {
  console.log('[CRON] Running weekly analysis for all active athletes…');
  try {
    const axios = require('axios');
    await axios.post(`http://localhost:${PORT}/api/analyses/run-weekly`, {
      _internal: true
    });
  } catch (err) {
    console.error('[CRON] Weekly analysis error:', err.message);
  }
});

// Profile regen — every 15 minutes (athletes who modified key fields)
cron.schedule('*/15 * * * *', async () => {
  try {
    const axios = require('axios');
    await axios.post(`http://localhost:${PORT}/api/plans/check-regen`, {}, { timeout: 600000 });
  } catch (err) {
    console.error('[CRON] check-regen error:', err.message);
  }
});

// Monthly plan generation — every Sunday at 15:00 UTC (17:00 Paris), only on the last Sunday of the month
cron.schedule('0 15 * * 0', async () => {
  // Check if this is the last Sunday of the month (next Sunday is in a different month)
  const now = new Date();
  const nextSunday = new Date(now);
  nextSunday.setDate(now.getDate() + 7);
  if (nextSunday.getMonth() === now.getMonth()) return; // Not the last Sunday of the month

  console.log('[CRON] Monthly plan generation triggered…');
  try {
    const axios = require('axios');
    await axios.post(`http://localhost:${PORT}/api/plans/generate-monthly`, {}, { timeout: 600000 });
  } catch (err) {
    console.error('[CRON] Monthly plan generation error:', err.message);
  }
});

// ─── Auto-reply to athlete messages ─────────────────────────────────────────

const WebSocket = require('ws');
const supabaseRT = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { realtime: { transport: WebSocket } }
);
const anthropicAI = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Debounce per user to avoid double-replies on rapid messages
const pendingReplies = new Set();

async function autoReply(message) {
  const { user_id } = message;
  if (pendingReplies.has(user_id)) return;
  pendingReplies.add(user_id);

  // Random delay 20-30 min to feel human
  const delay = (20 + Math.floor(Math.random() * 10)) * 60 * 1000;
  await new Promise(r => setTimeout(r, delay));
  pendingReplies.delete(user_id);

  try {
    const { data: profile } = await supabaseRT
      .from('profiles').select('first_name, objective, level')
      .eq('id', user_id).single();

    const { data: msgs } = await supabaseRT
      .from('messages').select('sender, content')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(12);

    const conversation = (msgs || []).reverse()
      .map(m => `${m.sender === 'athlete' ? profile?.first_name || 'Athlète' : 'Alexis'}: ${m.content}`)
      .join('\n');

    const resp = await anthropicAI.messages.create({
      model:      'claude-sonnet-4-5',
      max_tokens: 400,
      messages:   [{
        role:    'user',
        content: `Tu es le coach Alexis de The Ultimate Academy. Réponds au dernier message de ${profile?.first_name || "l'athlète"} comme un pote coach — naturel, direct, humain. 2-3 phrases max, style SMS. Pas de signature, pas de formules de politesse, pas de "Cher…". Juste une vraie réponse de quelqu'un qui connaît l'athlète et l'accompagne au quotidien.

Contexte : objectif ${profile?.objective || ''}, niveau ${profile?.level || ''}.

Conversation :
${conversation}

Réponds uniquement avec le texte du message, sans guillemets ni formatage.`
      }]
    });

    await supabaseRT.from('messages').insert({
      user_id,
      sender:  'coach',
      content: resp.content[0].text.trim(),
      read:    false,
    });

    console.log(`[AutoReply] Replied to ${profile?.first_name} (${user_id})`);
  } catch (err) {
    console.error('[AutoReply] Error:', err.message);
  }
}

function getParisLocalDate() {
  const parts = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date());
  const year  = parts.find(p => p.type === 'year').value;
  const month = parts.find(p => p.type === 'month').value;
  const day   = parts.find(p => p.type === 'day').value;
  return `${year}-${month}-${day}`;
}

// On server wake-up: find athletes with completed profile but no training plan and generate one
async function healMissingPlans() {
  console.log('[STARTUP] Checking for athletes missing training plans…');
  try {
    const { data: athletes } = await supabaseRT
      .from('profiles')
      .select('*')
      .eq('role', 'athlete')
      .eq('profile_completed', true)
      .in('subscription_status', ['active', 'trialing']);

    if (!athletes?.length) return;

    const axios = require('axios');
    for (const athlete of athletes) {
      const { data: existing } = await supabaseRT
        .from('training_plans')
        .select('id')
        .eq('user_id', athlete.id)
        .in('status', ['active', 'pending'])
        .maybeSingle();

      if (existing) continue;

      console.log(`[STARTUP] Generating missing plan for ${athlete.first_name} ${athlete.last_name}…`);
      try {
        await axios.post(`http://localhost:${PORT}/api/plans/generate`, {
          userId: athlete.id,
          profile: athlete,
          clientDate: getParisLocalDate(),
        }, { timeout: 120000 });
        console.log(`[STARTUP] Plan generated for ${athlete.first_name}`);
        await new Promise(r => setTimeout(r, 5000));
      } catch (err) {
        console.error(`[STARTUP] Failed for ${athlete.id}:`, err.message);
      }
    }
  } catch (err) {
    console.error('[STARTUP] healMissingPlans error:', err.message);
  }
}

// ─── New athlete notification ────────────────────────────────────────────────

async function notifyCoachNewAthlete(profile) {
  const name  = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
  const email = profile.email || '';
  const obj   = profile.objective || '?';
  const level = profile.level || '?';

  console.log(`[NewAthlete] Nouvel inscrit : ${name} (${email})`);

  // Email via Resend (optional — only if RESEND_API_KEY is set)
  if (process.env.RESEND_API_KEY) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({
          from:    'The Ultimate Academy <noreply@theultimateacademy.fr>',
          to:      [process.env.COACH_EMAIL || 'alexiselie1912@gmail.com'],
          subject: `🏃 Nouvel inscrit : ${name}`,
          text:    `Nouveau membre sur The Ultimate Academy !\n\nNom : ${name}\nEmail : ${email}\nObjectif : ${obj}\nNiveau : ${level}\n\nConnecte-toi sur l'interface coach pour générer son plan.`,
        }),
      });
      console.log(`[NewAthlete] Email sent to coach`);
    } catch (err) {
      console.error('[NewAthlete] Email error:', err.message);
    }
  }
}

app.listen(PORT, () => {
  console.log(`The Ultimate Academy server running on port ${PORT}`);

  // Start realtime listener for athlete messages
  supabaseRT.channel('auto-reply-channel')
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      payload => {
        if (payload.new?.sender === 'athlete') {
          autoReply(payload.new);
        }
      })
    .subscribe(status => {
      console.log(`[AutoReply] Realtime status: ${status}`);
    });

  // Listen for new athletes completing their profile
  supabaseRT.channel('new-athlete-channel')
    .on('postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'profiles' },
      payload => {
        const prev = payload.old;
        const next = payload.new;
        if (!prev?.profile_completed && next?.profile_completed && next?.role === 'athlete') {
          notifyCoachNewAthlete(next);
        }
      })
    .subscribe(status => {
      console.log(`[NewAthlete] Realtime status: ${status}`);
    });

  // Heal any athletes who registered while Render was sleeping (no plan generated)
  setTimeout(healMissingPlans, 8000);
});
