import { useState, useEffect } from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function BlogArticle() {
  const { slug } = useParams()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`${API}/api/blog/articles/${slug}`)
      .then(r => { if (r.status === 404) { setNotFound(true); return null } return r.json() })
      .then(d => { if (d) setArticle(d.article) })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  if (notFound) return <Navigate to="/blog" replace />

  if (loading) return (
    <div style={{ background: '#000', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'rgba(255,255,255,.4)' }}>Chargement…</div>
    </div>
  )

  if (!article) return null

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#fff' }}>

      {/* Nav */}
      <nav style={{ padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
        <Link to="/"><img src="/Logo.png" alt="The Ultimate Academy" style={{ height: 48 }} /></Link>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link to="/blog" style={{ color: 'rgba(255,255,255,.6)', fontSize: '.9rem', textDecoration: 'none' }}>← Blog</Link>
          <Link to="/register" style={{ background: 'linear-gradient(135deg,#8B2FC9,#E8237A)', color: '#fff', padding: '.45rem 1.1rem', borderRadius: 8, fontSize: '.9rem', textDecoration: 'none', fontWeight: 600 }}>Rejoindre</Link>
        </div>
      </nav>

      <article style={{ maxWidth: 780, margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>

        {/* Tags */}
        {article.tags?.length > 0 && (
          <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            {article.tags.map(tag => (
              <span key={tag} style={{ background: 'rgba(139,47,201,.15)', border: '1px solid rgba(139,47,201,.25)', borderRadius: 100, padding: '.25rem .7rem', fontSize: '.75rem', color: '#C084FC', fontWeight: 600 }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: '1rem' }}>
          {article.title}
        </h1>

        {/* Meta */}
        <div style={{ color: 'rgba(255,255,255,.35)', fontSize: '.85rem', marginBottom: '2rem' }}>
          Par le coach Alexis · {formatDate(article.published_at)}
        </div>

        {/* Hero image */}
        {article.image_url && (
          <div style={{ borderRadius: 16, overflow: 'hidden', marginBottom: '2.5rem' }}>
            <img src={article.image_url} alt={article.image_alt || article.title}
              style={{ width: '100%', maxHeight: 460, objectFit: 'cover', display: 'block' }} />
          </div>
        )}

        {/* Excerpt */}
        <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,.65)', lineHeight: 1.8, marginBottom: '2rem', fontStyle: 'italic', borderLeft: '3px solid #8B2FC9', paddingLeft: '1.25rem' }}>
          {article.excerpt}
        </p>

        {/* Content */}
        <div
          className="article-content"
          dangerouslySetInnerHTML={{ __html: article.content }}
          style={{ lineHeight: 1.85, fontSize: '1rem', color: 'rgba(255,255,255,.8)' }}
        />

        {/* CTA */}
        <div style={{ marginTop: '3.5rem', padding: '2rem', background: 'linear-gradient(135deg, rgba(139,47,201,.15), rgba(232,35,122,.1))', border: '1px solid rgba(139,47,201,.3)', borderRadius: 16, textAlign: 'center' }}>
          <p style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '.5rem' }}>Prêt à progresser ?</p>
          <p style={{ color: 'rgba(255,255,255,.5)', fontSize: '.9rem', marginBottom: '1.25rem' }}>Rejoins The Ultimate Academy et reçois ton programme personnalisé.</p>
          <Link to="/register" style={{ display: 'inline-block', background: 'linear-gradient(135deg,#8B2FC9,#E8237A)', color: '#fff', padding: '.85rem 2rem', borderRadius: 12, fontWeight: 700, textDecoration: 'none' }}>
            Démarrer mon programme →
          </Link>
        </div>

      </article>

      <style>{`
        .article-content h2 { font-size: 1.4rem; font-weight: 700; margin: 2.5rem 0 1rem; color: #fff; }
        .article-content p  { margin-bottom: 1.25rem; }
        .article-content ul, .article-content ol { padding-left: 1.5rem; margin-bottom: 1.25rem; }
        .article-content li { margin-bottom: .5rem; }
        .article-content strong { color: #fff; font-weight: 600; }
        .article-content a { color: #C084FC; }
      `}</style>
    </div>
  )
}
