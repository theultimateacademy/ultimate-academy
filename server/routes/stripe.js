const express = require('express');
const Stripe  = require('stripe');
const { createClient } = require('@supabase/supabase-js');

const router  = express.Router();
const stripe  = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// POST /api/stripe/create-checkout
router.post('/create-checkout', async (req, res) => {
  const { userId, email, firstName, lastName } = req.body;
  if (!userId || !email) return res.status(400).json({ error: 'Missing userId or email' });

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    let customerId = profile?.stripe_customer_id;
    let trialEligible = true;

    if (!customerId) {
      // Anti-abuse: check if this email already consumed a trial in Stripe
      const existing = await stripe.customers.list({ email, limit: 5 });
      for (const cust of existing.data) {
        const subs = await stripe.subscriptions.list({ customer: cust.id, status: 'all', limit: 1 });
        if (subs.data.length > 0) { trialEligible = false; break; }
      }

      const customer = await stripe.customers.create({
        email,
        name: `${firstName || ''} ${lastName || ''}`.trim(),
        metadata: { userId }
      });
      customerId = customer.id;
      await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', userId);
    } else {
      // Existing Stripe customer: check if they ever had a subscription
      const subs = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 1 });
      if (subs.data.length > 0) trialEligible = false;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${process.env.CLIENT_URL}/welcome?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${process.env.CLIENT_URL}/register`,
      metadata: { userId },
      locale: 'fr',
      ...(trialEligible && { subscription_data: { trial_period_days: 14 } }),
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/stripe/free-activate — whitelist bypass (no Stripe)
const FREE_EMAIL_WHITELIST = ['anouklothe@gmail.com'];

router.post('/free-activate', async (req, res) => {
  const { userId, email } = req.body;
  if (!userId || !email) return res.status(400).json({ error: 'Missing userId or email' });

  if (!FREE_EMAIL_WHITELIST.includes(email.toLowerCase())) {
    return res.status(403).json({ error: 'Not authorized for free access' });
  }

  try {
    await supabase.from('profiles').update({
      subscription_status: 'active',
    }).eq('id', userId);

    res.json({ ok: true });
  } catch (err) {
    console.error('Free activate error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/stripe/dev-activate  — localhost dev bypass only
router.post('/dev-activate', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Not available in production' });
  }
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });
  await supabase.from('profiles').update({
    subscription_status: 'active',
    profile_completed: true
  }).eq('id', userId);
  res.json({ ok: true });
});

// POST /api/stripe/webhook
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object;
        const userId = s.metadata?.userId;
        if (userId) {
          let status = 'active';
          if (s.subscription) {
            const sub = await stripe.subscriptions.retrieve(s.subscription);
            if (sub.status === 'trialing') status = 'trialing';
          }
          await supabase.from('profiles').update({
            subscription_status: status,
            stripe_customer_id: s.customer
          }).eq('id', userId);
        }
        break;
      }
      case 'invoice.payment_succeeded': {
        const inv = event.data.object;
        const { data } = await supabase
          .from('profiles').select('id').eq('stripe_customer_id', inv.customer).single();
        if (data) await supabase.from('profiles')
          .update({ subscription_status: 'active' }).eq('id', data.id);
        break;
      }
      case 'invoice.payment_failed': {
        const inv = event.data.object;
        const { data } = await supabase
          .from('profiles').select('id').eq('stripe_customer_id', inv.customer).single();
        if (data) await supabase.from('profiles')
          .update({ subscription_status: 'payment_failed' }).eq('id', data.id);
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const { data } = await supabase
          .from('profiles').select('id').eq('stripe_customer_id', sub.customer).single();
        if (data) {
          let status;
          if (sub.cancel_at_period_end) {
            status = 'cancelling';
          } else if (sub.status === 'trialing') {
            status = 'trialing';
          } else if (sub.status === 'active') {
            status = 'active';
          } else {
            status = sub.status; // past_due, unpaid, etc.
          }
          await supabase.from('profiles').update({ subscription_status: status }).eq('id', data.id);
        }
        break;
      }
      case 'customer.subscription.trial_will_end': {
        const sub = event.data.object;
        const { data } = await supabase
          .from('profiles').select('id').eq('stripe_customer_id', sub.customer).single();
        if (data) {
          const trialEnd = new Date(sub.trial_end * 1000);
          const formatted = trialEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
          await supabase.from('messages').insert({
            user_id: data.id,
            sender:  'system',
            content: `⏰ Ton essai gratuit se termine le ${formatted}. Ton abonnement à 30€/mois démarrera automatiquement à cette date. Tu peux annuler avant si tu le souhaites.`,
            read:    false
          });
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const { data } = await supabase
          .from('profiles').select('id').eq('stripe_customer_id', sub.customer).single();
        if (data) await supabase.from('profiles')
          .update({ subscription_status: 'cancelled' }).eq('id', data.id);
        break;
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
  }

  res.json({ received: true });
});

// POST /api/stripe/cancel-subscription
router.post('/cancel-subscription', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, first_name, last_name')
      .eq('id', userId)
      .single();

    if (!profile?.stripe_customer_id) {
      return res.status(400).json({ error: 'Aucun abonnement Stripe trouvé.' });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'active',
      limit: 1
    });

    if (!subscriptions.data.length) {
      return res.status(400).json({ error: 'Aucun abonnement actif trouvé.' });
    }

    const sub     = subscriptions.data[0];
    const endDate = new Date(sub.current_period_end * 1000);

    await stripe.subscriptions.update(sub.id, { cancel_at_period_end: true });
    await supabase.from('profiles')
      .update({ subscription_status: 'cancelling' })
      .eq('id', userId);

    // Notification coach
    await supabase.from('messages').insert({
      user_id: userId,
      sender:  'system',
      content: `ℹ️ ${profile.first_name} ${profile.last_name} a résilié son abonnement. Accès maintenu jusqu'au ${endDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}.`,
      read:    false
    });

    res.json({ success: true, end_date: endDate.toISOString() });
  } catch (err) {
    console.error('Cancel subscription error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stripe/revenue — CA mensuel + annuel avec détail clients
router.get('/revenue', async (req, res) => {
  try {
    const invoices = []
    let startingAfter

    do {
      const batch = await stripe.invoices.list({
        status:  'paid',
        limit:   100,
        expand:  ['data.customer'],
        ...(startingAfter && { starting_after: startingAfter })
      })
      invoices.push(...batch.data.filter(inv => inv.amount_paid > 0))
      startingAfter = batch.has_more ? batch.data[batch.data.length - 1].id : null
    } while (startingAfter)

    const byYear = {}
    for (const inv of invoices) {
      const date   = new Date(inv.created * 1000)
      const year   = date.getFullYear()
      const month  = date.getMonth() + 1
      const amount = inv.amount_paid / 100

      const cust  = inv.customer
      const name  = (typeof cust === 'object' ? cust?.name : null) || inv.customer_name || 'Client'
      const email = (typeof cust === 'object' ? cust?.email : null) || ''

      if (!byYear[year])               byYear[year]                = { total: 0, count: 0, months: {} }
      if (!byYear[year].months[month]) byYear[year].months[month]  = { amount: 0, count: 0, invoices: [] }

      byYear[year].months[month].invoices.push({
        name,
        email,
        amount,
        date: date.toISOString().split('T')[0]
      })
      byYear[year].months[month].amount += amount
      byYear[year].months[month].count  += 1
      byYear[year].total                += amount
      byYear[year].count                += 1
    }

    res.json({ revenue: byYear })
  } catch (err) {
    console.error('Revenue error:', err)
    res.status(500).json({ error: err.message })
  }
})

module.exports = router;
