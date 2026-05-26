import { useState, useEffect } from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function capitalizeTag(tag) {
  if (!tag) return tag
  return tag.charAt(0).toUpperCase() + tag.slice(1)
}

function getReadingTime(html) {
  const text = html.replace(/<[^>]*>/g, ' ')
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(2, Math.ceil(words / 200))
}

const TOOL_CTAS = [
  {
    icon: '⚡',
    label: 'Calculateur de VMA',
    description: 'Découvre ta vitesse maximale aérobie et adapte tes séances.',
    href: '/outils/vma',
    gradient: 'linear-gradient(135deg, rgba(139,47,201,.18), rgba(139,47,201,.06))',
    border: 'rgba(139,47,201,.35)',
    accent: '#C084FC',
  },
  {
    icon: '🏃',
    label: 'Calculateur d\'allures',
    description: 'Trouve tes allures d\'entraînement idéales selon ton niveau.',
    href: '/outils/allures',
    gradient: 'linear-gradient(135deg, rgba(232,35,122,.18), rgba(232,35,122,.06))',
    border: 'rgba(232,35,122,.35)',
    accent: '#F472B6',
  },
  {
    icon: '🎯',
    label: 'Prédicteur de performance',
    description: 'Estime ton temps sur marathon ou semi à partir d\'un résultat récent.',
    href: '/outils/predicteur',
    gradient: 'linear-gradient(135deg, rgba(59,130,246,.18), rgba(59,130,246,.06))',
    border: 'rgba(59,130,246,.35)',
    accent: '#60A5FA',
  },
  {
    icon: '⏱',
    label: 'Temps de passage',
    description: 'Calcule tes splits kilomètre par kilomètre pour tenir ton allure cible.',
    href: '/outils/temps-de-passage',
    gradient: 'linear-gradient(135deg, rgba(20,184,166,.18), rgba(20,184,166,.06))',
    border: 'rgba(20,184,166,.35)',
    accent: '#2DD4BF',
  },
]

function ToolCta({ index }) {
  const tool = TOOL_CTAS[index % TOOL_CTAS.length]
  return (
    <Link to={tool.href} style={{ textDecoration: 'none', display: 'block', margin: '2.5rem 0' }}>
      <div style={{
        background: tool.gradient,
        border: `1px solid ${tool.border}`,
        borderRadius: 16,
        padding: '1.5rem 1.75rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1.25rem',
        transition: 'transform .15s, box-shadow .15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 30px ${tool.border}` }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
        <div style={{ fontSize: '2rem', flexShrink: 0 }}>{tool.icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, color: '#fff', fontSize: '.95rem', marginBottom: '.2rem' }}>{tool.label}</div>
          <div style={{ color: 'rgba(255,255,255,.5)', fontSize: '.83rem', lineHeight: 1.5 }}>{tool.description}</div>
        </div>
        <div style={{ color: tool.accent, fontSize: '1.1rem', flexShrink: 0 }}>→</div>
      </div>
    </Link>
  )
}

function ArticleContent({ html }) {
  const sections = html.split(/(?=<h2)/)

  return (
    <>
      {sections.map((section, i) => (
        <div key={i}>
          <div
            className="article-content"
            dangerouslySetInnerHTML={{ __html: section }}
          />
          {i < sections.length - 1 && i % 2 === 1 && (
            <ToolCta index={Math.floor(i / 2)} />
          )}
        </div>
      ))}
    </>
  )
}

export default function BlogArticle() {
  const { slug } = useParams()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    supabase
      .from('articles')
      .select('*')
      .eq('slug', slug)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setNotFound(true); return }
        setArticle(data)
      })
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

  const readingTime = getReadingTime(article.content)

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#fff' }}>

      {/* Nav */}
      <nav style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
        <Link to="/"><img src="/Logo.png" alt="The Ultimate Academy" style={{ height: 48 }} /></Link>
        <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
          <Link to="/blog" style={{ color: 'rgba(255,255,255,.6)', fontSize: '.9rem', textDecoration: 'none', minHeight: 44, display: 'flex', alignItems: 'center' }}>← Blog</Link>
          <Link to="/register" style={{ background: 'linear-gradient(135deg,#8B2FC9,#E8237A)', color: '#fff', padding: '.55rem 1.1rem', borderRadius: 8, fontSize: '.9rem', textDecoration: 'none', fontWeight: 600, minHeight: 44, display: 'flex', alignItems: 'center' }}>Rejoindre</Link>
        </div>
      </nav>

      <article style={{ maxWidth: 760, margin: '0 auto', padding: '3rem 1.25rem 6rem', wordBreak: 'break-word', overflowWrap: 'break-word' }}>

        {/* Tags */}
        {article.tags?.length > 0 && (
          <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            {article.tags.map(tag => (
              <span key={tag} style={{ background: 'rgba(139,47,201,.15)', border: '1px solid rgba(139,47,201,.25)', borderRadius: 100, padding: '.28rem .75rem', fontSize: '.74rem', color: '#C084FC', fontWeight: 600 }}>
                {capitalizeTag(tag)}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 style={{ fontSize: 'clamp(1.9rem,4.5vw,3rem)', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.15, marginBottom: '1.25rem' }}>
          {article.title}
        </h1>

        {/* Meta row */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', color: 'rgba(255,255,255,.35)', fontSize: '.85rem', marginBottom: '2.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
          <span>Par le coach Alexis</span>
          <span style={{ opacity: .4 }}>·</span>
          <span>{formatDate(article.published_at)}</span>
          <span style={{ opacity: .4 }}>·</span>
          <span>⏱ {readingTime} min de lecture</span>
        </div>

        {/* Hero image */}
        {article.image_url && (
          <div style={{ borderRadius: 20, overflow: 'hidden', marginBottom: '3rem', boxShadow: '0 20px 60px rgba(0,0,0,.5)' }}>
            <img src={article.image_url} alt={article.image_alt || article.title}
              style={{ width: '100%', maxHeight: 480, objectFit: 'cover', display: 'block' }} />
          </div>
        )}

        {/* Excerpt */}
        <p style={{ fontSize: '1.15rem', color: 'rgba(255,255,255,.7)', lineHeight: 1.85, marginBottom: '2.5rem', fontStyle: 'italic', borderLeft: '3px solid #8B2FC9', paddingLeft: '1.4rem' }}>
          {article.excerpt}
        </p>

        {/* Content with tool CTAs injected */}
        <ArticleContent html={article.content} />

        {/* Final tool CTA — always show one last one */}
        <div style={{ margin: '3rem 0' }}>
          <ToolCta index={2} />
        </div>

        {/* CTA */}
        <div style={{ marginTop: '1.5rem', padding: '2.5rem 2rem', background: 'linear-gradient(135deg, rgba(139,47,201,.15), rgba(232,35,122,.1))', border: '1px solid rgba(139,47,201,.3)', borderRadius: 20, textAlign: 'center' }}>
          <div style={{ fontSize: '1.6rem', marginBottom: '.75rem' }}>🎯</div>
          <p style={{ fontWeight: 700, fontSize: '1.15rem', marginBottom: '.6rem' }}>Prêt à progresser ?</p>
          <p style={{ color: 'rgba(255,255,255,.5)', fontSize: '.9rem', marginBottom: '1.5rem', maxWidth: 400, margin: '0 auto 1.5rem' }}>Rejoins The Ultimate Academy et reçois ton programme personnalisé directement par le coach Alexis.</p>
          <Link to="/register" style={{ display: 'inline-block', background: 'linear-gradient(135deg,#8B2FC9,#E8237A)', color: '#fff', padding: '.9rem 2.25rem', borderRadius: 14, fontWeight: 700, textDecoration: 'none', fontSize: '1rem' }}>
            Démarrer mon programme →
          </Link>
        </div>

      </article>

      <style>{`
        .article-content h2 {
          font-size: 1.45rem;
          font-weight: 800;
          margin: 3rem 0 1.1rem;
          color: #fff;
          letter-spacing: -0.01em;
          line-height: 1.3;
        }
        .article-content h2:first-child { margin-top: 0; }
        .article-content p  { margin-bottom: 1.4rem; line-height: 1.9; color: rgba(255,255,255,.78); }
        .article-content ul, .article-content ol { padding-left: 1.5rem; margin-bottom: 1.4rem; }
        .article-content li { margin-bottom: .65rem; line-height: 1.75; color: rgba(255,255,255,.78); }
        .article-content strong { color: #fff; font-weight: 700; }
        .article-content a { color: #C084FC; text-decoration: underline; }
        .article-content blockquote {
          border-left: 3px solid #8B2FC9;
          margin: 1.5rem 0;
          padding: .75rem 1.25rem;
          color: rgba(255,255,255,.6);
          font-style: italic;
        }
      `}</style>
    </div>
  )
}
