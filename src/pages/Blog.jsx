import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import BlogNav from '../components/BlogNav'
import BlogFooter from '../components/BlogFooter'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function capitalizeTag(tag) {
  if (!tag) return tag
  return tag.charAt(0).toUpperCase() + tag.slice(1)
}

function currentWeekIndex(count) {
  const weekNum = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))
  return count > 0 ? weekNum % count : 0
}

export default function Blog() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [query, setQuery]       = useState('')

  useEffect(() => {
    supabase
      .from('articles')
      .select('id, title, slug, excerpt, image_url, image_alt, tags, reading_time, published_at')
      .order('published_at', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (error) throw error
        setArticles(data || [])
      })
      .catch(() => setError('Impossible de charger les articles.'))
      .finally(() => setLoading(false))
  }, [])

  const q = query.trim().toLowerCase()
  const filtered = q
    ? articles.filter(a =>
        a.title?.toLowerCase().includes(q) ||
        a.excerpt?.toLowerCase().includes(q) ||
        a.tags?.some(t => t.toLowerCase().includes(q))
      )
    : articles

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#fff', paddingTop: 72 }}>

      {/* Nav */}
      <BlogNav />

      <main style={{ maxWidth: 1140, margin: '0 auto', padding: '3.5rem 1.25rem 6rem' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div style={{ display: 'inline-block', background: 'rgba(139,47,201,.12)', border: '1px solid rgba(139,47,201,.25)', borderRadius: 100, padding: '.35rem 1rem', fontSize: '.78rem', color: '#C084FC', fontWeight: 700, marginBottom: '1.25rem', letterSpacing: '.04em', textTransform: 'uppercase' }}>
            Blog Running
          </div>
          <h1 style={{ fontSize: 'clamp(2rem,5vw,3.2rem)', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '.75rem', lineHeight: 1.1 }}>
            Conseils &amp; <span style={{ background: 'linear-gradient(135deg,#8B2FC9,#E8237A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Programmes</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,.4)', fontSize: '1rem', maxWidth: 460, margin: '0 auto .5rem' }}>
            Articles et plans d'entraînement pour progresser en course à pied.
          </p>
        </div>

        {/* Search bar */}
        <div style={{ maxWidth: 560, margin: '0 auto 3.5rem', position: 'relative' }}>
          <div style={{ position: 'absolute', left: '1.1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher un article, un mot-clé…"
            style={{
              width: '100%',
              background: 'rgba(255,255,255,.06)',
              border: '1px solid rgba(255,255,255,.12)',
              borderRadius: 14,
              padding: '.85rem 1.1rem .85rem 3rem',
              color: '#fff',
              fontSize: '.95rem',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color .2s',
            }}
            onFocus={e => e.target.style.borderColor = 'rgba(139,47,201,.6)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.12)'}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,.35)', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1 }}>
              ×
            </button>
          )}
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,.35)' }}>
            Chargement des articles…
          </div>
        )}
        {error && (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,.35)' }}>{error}</div>
        )}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,.35)' }}>
            {q ? `Aucun article trouvé pour "${query}".` : 'Les premiers articles arrivent très bientôt…'}
          </div>
        )}

        {/* Featured article — hidden during search, rotates every week */}
        {!q && articles.length > 0 && (() => {
          const fi = currentWeekIndex(articles.length)
          const f  = articles[fi]
          return (
            <Link to={`/blog/${f.slug}`} style={{ textDecoration: 'none', display: 'block', marginBottom: '3rem' }}>
              <article className="featured-card" style={{
                background: 'rgba(255,255,255,.03)',
                border: '1px solid rgba(255,255,255,.07)',
                borderRadius: 24,
                overflow: 'hidden',
                display: 'grid',
                gridTemplateColumns: f.image_url ? '1.1fr 1fr' : '1fr',
              }}>
                {f.image_url && (
                  <div style={{ minHeight: 320, overflow: 'hidden', position: 'relative' }}>
                    <img src={f.image_url} alt={f.image_alt || f.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
                  </div>
                )}
                <div style={{ padding: '2.25rem 2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  {/* Gradient badge */}
                  <div style={{ display: 'inline-flex', alignItems: 'center', background: 'linear-gradient(135deg,#8B2FC9,#E8237A)', borderRadius: 100, padding: '.25rem .95rem', fontSize: '.72rem', color: '#fff', fontWeight: 700, marginBottom: '1rem', width: 'fit-content', boxShadow: '0 3px 12px rgba(232,35,122,.35)' }}>
                    À la une
                  </div>
                  {f.tags?.length > 0 && (
                    <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                      {f.tags.slice(0, 3).map(tag => (
                        <span key={tag} style={tagStyle}>{capitalizeTag(tag)}</span>
                      ))}
                    </div>
                  )}
                  <h2 style={{ fontSize: 'clamp(1.1rem,2.5vw,1.55rem)', fontWeight: 800, color: '#fff', marginBottom: '.8rem', lineHeight: 1.25, letterSpacing: '-0.01em' }}>
                    {f.title}
                  </h2>
                  <p style={{ fontSize: '.9rem', color: 'rgba(255,255,255,.45)', lineHeight: 1.75, marginBottom: '1.5rem' }}>
                    {f.excerpt}
                  </p>
                  <div style={{ display: 'flex', gap: '.6rem', alignItems: 'center', fontSize: '.78rem', color: 'rgba(255,255,255,.28)' }}>
                    <span>{formatDate(f.published_at)}</span>
                    <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,.2)', flexShrink: 0 }} />
                    <span>⏱ {f.reading_time || 4} min de lecture</span>
                  </div>
                </div>
              </article>
            </Link>
          )
        })()}

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '1.5rem' }}>
          {(q ? filtered : articles.filter((_, i) => i !== currentWeekIndex(articles.length))).map(article => (
            <Link key={article.id} to={`/blog/${article.slug}`} style={{ textDecoration: 'none' }}>
              <article className="article-card" style={{
                background: 'rgba(255,255,255,.04)',
                border: '1px solid rgba(255,255,255,.07)',
                borderRadius: 20,
                overflow: 'hidden',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}>
                {article.image_url ? (
                  <div style={{ height: 200, overflow: 'hidden', flexShrink: 0 }}>
                    <img src={article.image_url} alt={article.image_alt || article.title}
                      className="card-img"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .4s ease' }} />
                  </div>
                ) : (
                  <div style={{ height: 200, background: 'linear-gradient(135deg, rgba(139,47,201,.25), rgba(232,35,122,.15))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', flexShrink: 0 }}>
                    🏃
                  </div>
                )}
                <div style={{ padding: '1.4rem 1.4rem 1.75rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {article.tags?.length > 0 && (
                    <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap', marginBottom: '.8rem' }}>
                      {article.tags.slice(0, 2).map(tag => (
                        <span key={tag} style={tagStyle}>{capitalizeTag(tag)}</span>
                      ))}
                    </div>
                  )}
                  <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '.5rem', lineHeight: 1.4, flex: 1 }}>
                    {article.title}
                  </h2>
                  <p style={{ fontSize: '.82rem', color: 'rgba(255,255,255,.4)', lineHeight: 1.65, marginBottom: '1rem' }}>
                    {article.excerpt?.slice(0, 110)}{article.excerpt?.length > 110 ? '…' : ''}
                  </p>
                  <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', fontSize: '.75rem', color: 'rgba(255,255,255,.25)' }}>
                    <span>{formatDate(article.published_at)}</span>
                    <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,.18)', flexShrink: 0 }} />
                    <span>⏱ {article.reading_time || 4} min</span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>

      </main>

      <BlogFooter />

      <style>{`
        .featured-card { transition: border-color .2s, transform .15s; }
        .featured-card:hover { border-color: rgba(139,47,201,.4) !important; transform: translateY(-2px); }
        .article-card { transition: border-color .2s, transform .15s; }
        .article-card:hover { border-color: rgba(139,47,201,.35) !important; transform: translateY(-3px); }
        .article-card:hover .card-img { transform: scale(1.05); }
        @media (max-width: 700px) {
          .featured-card { grid-template-columns: 1fr !important; }
          .featured-card img { height: 220px; position: static !important; }
        }
        @media (max-width: 480px) {
          nav a[href="/"], nav a[href="/calculateur"] { display: none; }
        }
      `}</style>
    </div>
  )
}

const tagStyle = {
  background: 'rgba(139,47,201,.15)',
  border: '1px solid rgba(139,47,201,.22)',
  borderRadius: 100,
  padding: '.22rem .65rem',
  fontSize: '.72rem',
  color: '#C084FC',
  fontWeight: 600,
}
