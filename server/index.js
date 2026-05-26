require('dotenv').config();
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

// ─── Auto-reply to athlete messages ─────────────────────────────────────────

const supabaseRT = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
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
});
