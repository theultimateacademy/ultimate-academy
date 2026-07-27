const express  = require('express');
const Stripe   = require('stripe');
const path     = require('path');
const fs       = require('fs');
const { createClient } = require('@supabase/supabase-js');

const router  = express.Router();
const stripe  = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const _rawClientUrl = process.env.CLIENT_URL || 'https://theultimateacademy.fr';
const CLIENT_URL = _rawClientUrl.startsWith('http') ? _rawClientUrl.replace(/\/$/, '') : `https://${_rawClientUrl.replace(/\/$/, '')}`;
if (!CLIENT_URL.startsWith('https://')) console.warn('[Ebooks] CLIENT_URL ne commence pas par https://', CLIENT_URL);

// ─── Ebooks à variantes (VMA × séances/semaine) ───────────────────────────────
// Tarif par nombre de séances/semaine, identique pour toutes les VMA.
const PRICE_TIERS = {
  '10km-8sem':     { 3: 1499, 4: 1799, 5: 1999, 6: 2299 },
  '10km-12sem':    { 3: 1799, 4: 1999, 5: 2299, 6: 2499 },
  'semi-12sem':    { 3: 1999, 4: 2299, 5: 2499, 6: 2999 },
  'marathon-12sem':{ 3: 2299, 4: 2499, 5: 2799, 6: 2999 },
  'marathon-16sem':{ 3: 2499, 4: 2799, 5: 2999, 6: 3299 },
};

const VMA_MIN = 10;
const VMA_MAX = 24;

function isValidVma(vma) {
  const n = Number(vma);
  return Number.isFinite(n) && n >= VMA_MIN && n <= VMA_MAX && Math.round(n * 2) === n * 2;
}

function isValidSeances(seances, tiers) {
  return Object.prototype.hasOwnProperty.call(tiers, String(seances));
}

function variantPdfPath(slug, vma, seances) {
  return path.join(__dirname, '../../public/ebooks', slug, `vma-${vma}-${seances}seances.pdf`);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function sendEbookEmail(email, ebook, pdfPathOverride) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Ebooks] RESEND_API_KEY not set — skipping email');
    return;
  }

  const pdfPath = pdfPathOverride || path.join(__dirname, '../../public/ebooks', ebook.pdf_path || `${ebook.slug}.pdf`);
  if (!fs.existsSync(pdfPath)) {
    console.error(`[Ebooks] PDF not found: ${pdfPath}`);
    return;
  }

  const pdfBuffer = fs.readFileSync(pdfPath);
  const pdfBase64 = pdfBuffer.toString('base64');

  const body = {
    from: 'The Ultimate Academy <noreply@theultimateacademy.fr>',
    to:   [email],
    subject: `Ton ebook The Ultimate Academy 📚`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a2e">
        <div style="background:linear-gradient(135deg,#8B2FC9,#E8237A);padding:32px 24px;border-radius:12px 12px 0 0;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:22px">The Ultimate Academy</h1>
        </div>
        <div style="background:#fff;padding:32px 24px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none">
          <p style="font-size:16px;margin:0 0 16px">Merci pour ton achat !</p>
          <p style="color:#374151;margin:0 0 16px">Tu trouveras ton plan d'entraînement <strong>${ebook.title}</strong> en pièce jointe.</p>
          <div style="background:#f5f3ff;border-left:4px solid #8B2FC9;padding:16px;border-radius:4px;margin:24px 0">
            <p style="margin:0;font-size:14px;color:#5B21B6">
              💡 <strong>Calcule tes allures personnalisées</strong> avec notre calculateur VMA gratuit :<br>
              <a href="https://theultimateacademy.fr/calculateur/vma" style="color:#8B2FC9">theultimateacademy.fr/calculateur/vma</a>
            </p>
          </div>
          <p style="color:#374151;margin:0 0 8px">Bon entraînement !</p>
          <p style="color:#6b7280;font-size:14px;margin:0">Alexis — The Ultimate Academy</p>
        </div>
      </div>
    `,
    attachments: [{
      filename: `${ebook.slug}.pdf`,
      content:  pdfBase64,
    }],
  };

  const res = await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error: ${err}`);
  }
}

// ─── GET /api/ebooks — liste publique ────────────────────────────────────────

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ebooks')
      .select('id, slug, title, description, distance, duration_weeks, price_cents, cover_image')
      .eq('active', true)
      .order('created_at');
    if (error) throw error;
    res.json({ ebooks: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/ebooks/admin/pdf/:slug — accès PDF coach (ebook simple, pas de variante) ──

router.get('/admin/pdf/:slug', async (req, res) => {
  const { slug } = req.params;
  // Ebooks sans variante : chercher le pdf_path en DB
  const { data: ebook } = await supabase.from('ebooks').select('pdf_path').eq('slug', slug).single();
  if (!ebook?.pdf_path) return res.status(404).json({ error: 'PDF introuvable' });
  const pdfPath = path.join(__dirname, '../../public/ebooks', ebook.pdf_path);
  if (!fs.existsSync(pdfPath)) return res.status(404).json({ error: 'Fichier PDF introuvable sur le serveur' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${slug}.pdf"`);
  fs.createReadStream(pdfPath).pipe(res);
});

// ─── GET /api/ebooks/admin/pdf/:slug/:vma/:seances — accès PDF coach (variantes) ──────

router.get('/admin/pdf/:slug/:vma/:seances', (req, res) => {
  const { slug, vma, seances } = req.params;
  const pdfPath = variantPdfPath(slug, vma, seances);
  if (!fs.existsSync(pdfPath)) return res.status(404).json({ error: 'PDF introuvable' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${slug}-vma${vma}-${seances}seances.pdf"`);
  fs.createReadStream(pdfPath).pipe(res);
});

// ─── GET /api/ebooks/:slug — détail ──────────────────────────────────────────

router.get('/:slug', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ebooks')
      .select('id, slug, title, description, distance, duration_weeks, price_cents, cover_image')
      .eq('slug', req.params.slug)
      .eq('active', true)
      .single();
    if (error || !data) return res.status(404).json({ error: 'Ebook not found' });
    res.json({ ebook: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/ebooks/checkout ────────────────────────────────────────────────

router.post('/checkout', async (req, res) => {
  const { ebook_id, email, slug, vma, seances } = req.body;
  if (!ebook_id || !email) return res.status(400).json({ error: 'ebook_id et email requis' });

  try {
    const { data: ebook, error } = await supabase
      .from('ebooks').select('*').eq('id', ebook_id).eq('active', true).single();
    if (error || !ebook) return res.status(404).json({ error: 'Ebook introuvable' });

    const tiers = PRICE_TIERS[ebook.slug];
    let unitAmount = ebook.price_cents;
    const metadata = { ebook_id: ebook.id, email };

    if (tiers) {
      if (!isValidVma(vma) || !isValidSeances(seances, tiers)) {
        return res.status(400).json({ error: 'VMA (10-24, pas 0,5) et séances/semaine (3-6) requis pour cet ebook' });
      }
      unitAmount = tiers[String(seances)];
      metadata.vma = String(vma);
      metadata.seances = String(seances);
    }

    // Créer la session Stripe
    const session = await stripe.checkout.sessions.create({
      mode:                 'payment',
      payment_method_types: ['card'],
      customer_email:       email,
      line_items: [{
        price_data: {
          currency:     'eur',
          product_data: { name: ebook.title, description: ebook.description || undefined },
          unit_amount:  unitAmount,
        },
        quantity: 1,
      }],
      metadata,
      success_url: `${CLIENT_URL}/ebooks/merci`,
      cancel_url:  `${CLIENT_URL}/ebooks/${ebook.slug}`,
    });

    // Enregistrer l'achat en pending
    await supabase.from('ebook_purchases').insert({
      ebook_id:                 ebook.id,
      email,
      stripe_payment_intent_id: session.payment_intent || session.id,
      status:                   'pending',
      ...(tiers ? { vma: Number(vma), seances_semaine: Number(seances) } : {}),
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('[Ebooks] checkout error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/ebooks/webhook ─────────────────────────────────────────────────
// Note: raw body middleware registered in index.js before JSON parser

router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET_EBOOKS || process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[Ebooks] Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    if (session.mode !== 'payment') return res.json({ received: true });

    const { ebook_id, email, vma, seances } = session.metadata || {};
    if (!ebook_id || !email) return res.json({ received: true });

    try {
      // Marquer comme payé
      await supabase.from('ebook_purchases')
        .update({ status: 'paid', stripe_payment_intent_id: session.payment_intent || session.id })
        .eq('stripe_payment_intent_id', session.payment_intent || session.id);

      // Récupérer l'ebook
      const { data: ebook } = await supabase.from('ebooks').select('*').eq('id', ebook_id).single();
      if (!ebook) throw new Error('Ebook not found for id: ' + ebook_id);

      // Envoyer le PDF par email (variante VMA/séances si applicable)
      const pdfPathOverride = (vma && seances) ? variantPdfPath(ebook.slug, vma, seances) : null;
      await sendEbookEmail(email, ebook, pdfPathOverride);

      // Marquer comme envoyé
      await supabase.from('ebook_purchases')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('stripe_payment_intent_id', session.payment_intent || session.id);

      console.log(`[Ebooks] PDF sent to ${email} for "${ebook.title}"`);
    } catch (err) {
      console.error('[Ebooks] Fulfillment error:', err.message);
    }
  }

  res.json({ received: true });
});

// ─── Admin routes ──────────────────────────────────────────────────────────────

router.get('/admin/purchases', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ebook_purchases')
      .select('*, ebooks(title, slug)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ purchases: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/admin/stats', async (req, res) => {
  try {
    const { data: ebooks } = await supabase.from('ebooks').select('id, title, slug, price_cents, active');
    const { data: purchases } = await supabase.from('ebook_purchases').select('ebook_id, status');

    const stats = (ebooks || []).map(e => {
      const sales = (purchases || []).filter(p => p.ebook_id === e.id && p.status === 'sent').length;
      return { ...e, sales, revenue_cents: sales * e.price_cents };
    });

    const total_revenue = stats.reduce((s, e) => s + e.revenue_cents, 0);
    res.json({ ebooks: stats, total_revenue_cents: total_revenue });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/admin/purchases/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('ebook_purchases').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/admin/:id/toggle', async (req, res) => {
  try {
    const { data: current } = await supabase.from('ebooks').select('active').eq('id', req.params.id).single();
    const { data, error } = await supabase.from('ebooks').update({ active: !current?.active }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ ebook: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
