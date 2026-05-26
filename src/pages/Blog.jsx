import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function Blog() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  useEffect(() => {
    supabase
      .from('articles')
      .select('id, title, slug, excerpt, image_url, image_alt, tags, published_at')
      .order('published_at', { ascending: false })
      .limit(12)
      .then(({ data, error }) => {
        if (error) throw error
        setArticles(data || [])
      })
      .catch(() => setError('Impossible de charger les articles.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#fff' }}>

      {/* Nav */}
      <nav style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
        <Link to="/"><img src="/Logo.png" alt="The Ultimate Academy" style={{ height: 48 }} /></Link>
        <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link to="/login" style={{ color: 'rgba(255,255,255,.6)', fontSize: '.9rem', textDecoration: 'none', minHeight: 44, display: 'flex', alignItems: 'center' }}>Connexion</Link>
          <Link to="/register" style={{ background: 'linear-gradient(135deg,#8B2FC9,#E8237A)', color: '#fff', padding: '.55rem 1.1rem', borderRadius: 8, fontSize: '.9rem', textDecoration: 'none', fontWeight: 600, minHeight: 44, display: 'flex', alignItems: 'center' }}>Rejoindre</Link>
        </div>
      </nav>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '3rem 1rem' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <div style={{ display: 'inline-block', background: 'rgba(139,47,201,.15)', border: '1px solid rgba(139,47,201,.3)', borderRadius: 100, padding: '.35rem 1rem', fontSize: '.8rem', color: '#C084FC', fontWeight: 600, marginBottom: '1.25rem' }}>
            Blog Running
          </div>
          <h1 style={{ fontSize: 'clamp(2rem,5vw,3.2rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '.75rem' }}>
            Conseils &amp; <span style={{ background: 'linear-gradient(135deg,#8B2FC9,#E8237A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Programmes</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,.45)', fontSize: '1rem', maxWidth: 500, margin: '0 auto' }}>
            Articles, plans d'entraînement et conseils du coach Alexis pour progresser en course à pied.
          </p>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,.4)' }}>
            Chargement des articles…
          </div>
        )}

        {error && (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,.4)' }}>{error}</div>
        )}

        {!loading && articles.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,.4)' }}>
            Les premiers articles arrivent très bientôt…
          </div>
        )}

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {articles.map(article => (
            <Link key={article.id} to={`/blog/${article.slug}`} style={{ textDecoration: 'none' }}>
              <article style={{
                background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
                borderRadius: 16, overflow: 'hidden',
                transition: 'border-color .2s, transform .15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(139,47,201,.4)'; e.currentTarget.style.transform = 'translateY(-3px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)'; e.currentTarget.style.transform = 'translateY(0)' }}>

                {/* Image */}
                {article.image_url ? (
                  <div style={{ height: 200, overflow: 'hidden' }}>
                    <img src={article.image_url} alt={article.image_alt || article.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ) : (
                  <div style={{ height: 200, background: 'linear-gradient(135deg, rgba(139,47,201,.3), rgba(232,35,122,.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
                    🏃
                  </div>
                )}

                <div style={{ padding: '1.25rem' }}>
                  {/* Tags */}
                  {article.tags?.length > 0 && (
                    <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', marginBottom: '.75rem' }}>
                      {article.tags.slice(0, 2).map(tag => (
                        <span key={tag} style={{ background: 'rgba(139,47,201,.15)', border: '1px solid rgba(139,47,201,.25)', borderRadius: 100, padding: '.2rem .6rem', fontSize: '.72rem', color: '#C084FC' }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '.5rem', lineHeight: 1.4 }}>
                    {article.title}
                  </h2>
                  <p style={{ fontSize: '.83rem', color: 'rgba(255,255,255,.45)', lineHeight: 1.6, marginBottom: '.75rem' }}>
                    {article.excerpt}
                  </p>
                  <div style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.3)' }}>
                    {formatDate(article.published_at)}
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>

      </main>

      {/* Footer CTA */}
      <section style={{ borderTop: '1px solid rgba(255,255,255,.08)', padding: '4rem 1.5rem', textAlign: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,.5)', marginBottom: '1.25rem' }}>Prêt à passer à l'action ?</p>
        <Link to="/register" style={{ display: 'inline-block', background: 'linear-gradient(135deg,#8B2FC9,#E8237A)', color: '#fff', padding: '.85rem 2rem', borderRadius: 12, fontWeight: 700, textDecoration: 'none', fontSize: '1rem' }}>
          Démarrer mon programme →
        </Link>
      </section>
    </div>
  )
}
