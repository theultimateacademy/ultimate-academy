const express  = require('express');
const { createClient } = require('@supabase/supabase-js');
const Anthropic = require('@anthropic-ai/sdk');
const axios     = require('axios');

const router   = express.Router();
const supabase  = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const TOPICS = [
  { subject: 'Les 10 marathons de France incontournables à courir au moins une fois', image_query: 'marathon running france crowd' },
  { subject: 'Comment préparer son premier marathon : guide complet du débutant', image_query: 'marathon runner finish line' },
  { subject: 'Plan entraînement 10km : passer de zéro à 10km en 8 semaines', image_query: 'running training park' },
  { subject: 'Marathon de Paris : tout ce qu\'il faut savoir pour bien se préparer', image_query: 'paris city running race' },
  { subject: 'Comment améliorer sa VMA en course à pied : méthodes et séances', image_query: 'track running speed athlete' },
  { subject: 'Nutrition du coureur : que manger avant, pendant et après une course', image_query: 'healthy food runner nutrition' },
  { subject: 'Récupération après un marathon : le protocole complet du coach', image_query: 'runner recovery stretching' },
  { subject: 'Comment choisir ses chaussures de running : le guide complet', image_query: 'running shoes trail road' },
  { subject: 'Courir un semi-marathon en moins de 2h : méthode et plan d\'entraînement', image_query: 'half marathon running race' },
  { subject: 'Renforcement musculaire pour coureurs : les exercices indispensables', image_query: 'runner strength training gym' },
  { subject: 'Comment éviter les blessures en course à pied : conseils du coach', image_query: 'runner injury prevention stretching' },
  { subject: 'Trail running pour débutants : comment se lancer sur les sentiers', image_query: 'trail running mountain nature' },
  { subject: 'Les meilleurs endroits pour courir à Paris et en Île-de-France', image_query: 'running paris park eiffel tower' },
  { subject: 'Courir en été : conseils pour s\'entraîner par fortes chaleurs', image_query: 'summer running heat sun' },
  { subject: 'VO2max : comprendre et améliorer sa capacité cardio-respiratoire', image_query: 'cardio fitness running athlete' },
  { subject: 'Plan marathon 16 semaines pour finisher : du canapé à la ligne d\'arrivée', image_query: 'marathon training long run' },
  { subject: 'Les étirements essentiels pour coureurs : quand et comment s\'étirer', image_query: 'runner stretching flexibility' },
  { subject: 'Courir un 5km sous les 25 minutes : programme et conseils', image_query: '5km run park morning' },
  { subject: 'Marathon du Médoc : le guide du coureur déguisé', image_query: 'wine marathon medoc bordeaux' },
  { subject: 'Course à pied et perte de poids : ce que dit vraiment la science', image_query: 'running weight loss healthy lifestyle' },
  { subject: 'Le fractionné en course à pied : pourquoi et comment le pratiquer', image_query: 'interval training track sprint' },
  { subject: 'Courir après 50 ans : les conseils du coach pour progresser sans se blesser', image_query: 'mature runner fitness park' },
  { subject: 'Les événements running de France à ne pas manquer', image_query: 'running event race participants' },
  { subject: 'Préparation mentale pour la course à pied : la clé de la performance', image_query: 'runner focus mental strength' },
];

async function getNextTopic() {
  const { count } = await supabase.from('articles').select('*', { count: 'exact', head: true });
  const index = (count || 0) % TOPICS.length;
  return TOPICS[index];
}

async function fetchImage(query) {
  if (!process.env.UNSPLASH_ACCESS_KEY) return { url: null, alt: null };
  try {
    const res = await axios.get('https://api.unsplash.com/search/photos', {
      headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` },
      params: { query, per_page: 3, orientation: 'landscape' },
      timeout: 8000,
    });
    const results = res.data.results;
    if (!results?.length) return { url: null, alt: null };
    const photo = results[Math.floor(Math.random() * results.length)];
    return { url: photo.urls.regular, alt: photo.alt_description || query };
  } catch {
    return { url: null, alt: null };
  }
}

function calcReadingTime(content) {
  const text = (content || '').replace(/<[^>]*>/g, ' ')
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(2, Math.ceil(words / 200))
}

async function generateAndPublish(forceTopic, overrideDate) {
  const topic = forceTopic || await getNextTopic();

  const completion = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2500,
    messages: [{
      role: 'user',
      content: `Tu es un journaliste expert en course à pied qui écrit pour le blog de The Ultimate Academy, une plateforme de coaching running personnalisé avec le coach Alexis.

Écris un article de blog de 650-800 mots sur le sujet : "${topic.subject}"

Règles :
- Style journalistique fluide, dynamique, accessible à tous les coureurs
- Structuré avec 3-4 sous-titres H2 pertinents
- Conseils pratiques et concrets
- Mentionne The Ultimate Academy naturellement 1 seule fois maximum (jamais en début d'article)
- Terminer par un appel à l'action subtil
- Langue : français
- N'utilise JAMAIS le tiret long (—) ni le tiret demi-long (–) dans le texte, utilise des virgules ou reformule

Retourne UNIQUEMENT un JSON valide (sans markdown, sans \`\`\`) avec exactement ces champs :
{
  "title": "titre accrocheur et SEO-optimisé",
  "slug": "slug-url-en-minuscules-avec-tirets",
  "excerpt": "description de 2 phrases pour Google (150-160 caractères max)",
  "content": "contenu HTML avec <h2>, <p>, <ul>, <li>, <strong> — PAS de balise <html> ou <body>",
  "tags": ["tag1", "tag2", "tag3", "tag4"]
}`
    }],
  });

  let article;
  try {
    article = JSON.parse(completion.content[0].text.trim());
  } catch {
    const match = completion.content[0].text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Invalid JSON from Anthropic');
    article = JSON.parse(match[0]);
  }

  const { url: imageUrl, alt: imageAlt } = await fetchImage(topic.image_query);

  const { data, error } = await supabase.from('articles').insert({
    title:        article.title,
    slug:         article.slug,
    excerpt:      article.excerpt,
    content:      article.content,
    image_url:    imageUrl,
    image_alt:    imageAlt || topic.image_query,
    tags:         article.tags || [],
    reading_time: calcReadingTime(article.content),
    published_at: overrideDate || new Date().toISOString(),
  }).select().single();

  if (error) throw error;
  console.log(`[Blog] Published: "${article.title}"`);
  return data;
}

// POST /api/blog/generate — called by cron or external service
router.post('/generate', async (req, res) => {
  const secret = req.headers['x-blog-secret'] || req.body?.secret;
  if (process.env.BLOG_SECRET && secret !== process.env.BLOG_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const forceTopic = req.body?.subject
      ? { subject: req.body.subject, image_query: req.body.image_query || 'running marathon' }
      : null;

    if (req.body?.delete_slug) {
      await supabase.from('articles').delete().eq('slug', req.body.delete_slug);
      console.log(`[Blog] Deleted article: ${req.body.delete_slug}`);
    }

    const article = await generateAndPublish(forceTopic, req.body?.published_at || null);
    res.json({ success: true, title: article.title, slug: article.slug });
  } catch (err) {
    console.error('[Blog] Generate error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/blog/articles
router.get('/articles', async (req, res) => {
  const limit  = Math.min(parseInt(req.query.limit) || 12, 50);
  const offset = parseInt(req.query.offset) || 0;
  try {
    const { data, error, count } = await supabase
      .from('articles')
      .select('id, title, slug, excerpt, image_url, image_alt, tags, published_at', { count: 'exact' })
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;
    res.json({ articles: data || [], total: count || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/blog/articles/:slug
router.get('/articles/:slug', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('articles').select('*')
      .eq('slug', req.params.slug).single();
    if (error || !data) return res.status(404).json({ error: 'Article not found' });
    res.json({ article: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/blog/update-image — set/replace image on an existing article
router.post('/update-image', async (req, res) => {
  const secret = req.headers['x-blog-secret'] || req.body?.secret;
  if (process.env.BLOG_SECRET && secret !== process.env.BLOG_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const { slug, image_query } = req.body || {};
  if (!slug || !image_query) return res.status(400).json({ error: 'slug and image_query required' });
  try {
    const { url, alt } = await fetchImage(image_query);
    if (!url) return res.status(404).json({ error: 'No image found on Unsplash' });
    const { error } = await supabase.from('articles')
      .update({ image_url: url, image_alt: alt || image_query })
      .eq('slug', slug);
    if (error) throw error;
    res.json({ success: true, image_url: url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/blog/fix-reading-time — one-time backfill for old articles
router.post('/fix-reading-time', async (req, res) => {
  const secret = req.headers['x-blog-secret'] || req.body?.secret;
  if (process.env.BLOG_SECRET && secret !== process.env.BLOG_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const { data: articles, error } = await supabase
      .from('articles')
      .select('id, content');
    if (error) throw error;

    let updated = 0;
    for (const article of articles) {
      const rt = calcReadingTime(article.content);
      await supabase.from('articles').update({ reading_time: rt }).eq('id', article.id);
      updated++;
    }
    res.json({ success: true, updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = { router, generateAndPublish };
