import { useState, useEffect } from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Nav from '../components/Nav'
import SiteFooter from '../components/SiteFooter'


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

function cleanContent(html) {
  return html
    .replace(/—/g, ' ')
    .replace(/–/g, '-')
}


const TOOL_CTAS = [
  {
    icon: '⚡',
    label: 'Calcule ta VMA',
    description: 'Découvre ta vitesse maximale aérobie et calibre tes séances.',
    href: '/calculateur/vma',
    color: '#C084FC',
    bg: 'rgba(139,47,201,.12)',
    border: 'rgba(139,47,201,.28)',
  },
  {
    icon: '🏃',
    label: 'Tes allures d\'entraînement',
    description: 'Allures endurance, tempo, VMA selon ton niveau en quelques secondes.',
    href: '/calculateur/allures',
    color: '#F472B6',
    bg: 'rgba(232,35,122,.12)',
    border: 'rgba(232,35,122,.28)',
  },
  {
    icon: '🎯',
    label: 'Prédicteur de chrono',
    description: 'Estime ton temps sur marathon ou semi à partir d\'un résultat récent.',
    href: '/calculateur/predicteur',
    color: '#60A5FA',
    bg: 'rgba(59,130,246,.12)',
    border: 'rgba(59,130,246,.28)',
  },
  {
    icon: '⏱',
    label: 'Temps de passage au km',
    description: 'Calcule tes splits kilomètre par kilomètre pour tenir ton allure cible.',
    href: '/calculateur',
    color: '#2DD4BF',
    bg: 'rgba(20,184,166,.12)',
    border: 'rgba(20,184,166,.28)',
  },
]

function ToolCta({ index }) {
  const tool = TOOL_CTAS[index % TOOL_CTAS.length]
  return (
    <Link to={tool.href} style={{ textDecoration: 'none', display: 'block', margin: '3rem 0' }}>
      <div style={{
        background: tool.bg,
        border: `1px solid ${tool.border}`,
        borderRadius: 18,
        padding: '1.4rem 1.75rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1.1rem',
      }}
      className="tool-cta-inner">
        <div style={{ fontSize: '1.8rem', flexShrink: 0 }}>{tool.icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, color: '#fff', fontSize: '.92rem', marginBottom: '.2rem' }}>{tool.label}</div>
          <div style={{ color: 'rgba(255,255,255,.45)', fontSize: '.8rem', lineHeight: 1.5 }}>{tool.description}</div>
        </div>
        <div style={{ color: tool.color, fontSize: '1.1rem', fontWeight: 700, flexShrink: 0 }}>→</div>
      </div>
    </Link>
  )
}

function ArticleContent({ html }) {
  const cleaned = cleanContent(html)
  const sections = cleaned.split(/(?=<h2)/)

  return (
    <>
      {sections.map((section, i) => (
        <div key={i}>
          <div className="article-content" dangerouslySetInnerHTML={{ __html: section }} />
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
      <div style={{ color: 'rgba(255,255,255,.35)' }}>Chargement…</div>
    </div>
  )

  if (!article) return null

  const readingTime = article.reading_time || getReadingTime(article.content)

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#fff', paddingTop: 72 }}>

      {/* Nav */}
      <Nav />

      <article style={{ maxWidth: 740, margin: '0 auto', padding: '3.5rem 1.25rem 7rem', wordBreak: 'break-word', overflowWrap: 'break-word' }}>

        {/* Tags */}
        {article.tags?.length > 0 && (
          <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            {article.tags.map(tag => (
              <span key={tag} style={tagStyle}>{capitalizeTag(tag)}</span>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 style={{ fontSize: 'clamp(1.9rem,4.5vw,3rem)', fontWeight: 800, letterSpacing: '-0.028em', lineHeight: 1.12, marginBottom: '1.25rem' }}>
          {article.title}
        </h1>

        {/* Meta row */}
        <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', flexWrap: 'wrap', color: 'rgba(255,255,255,.3)', fontSize: '.83rem', marginBottom: '2.5rem', paddingBottom: '1.75rem', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
          <span>{formatDate(article.published_at)}</span>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,.18)', flexShrink: 0 }} />
          <span>⏱ {readingTime} min de lecture</span>
        </div>

        {/* Hero image */}
        {article.image_url && (
          <div style={{ borderRadius: 22, overflow: 'hidden', marginBottom: '3rem', boxShadow: '0 24px 64px rgba(0,0,0,.55)' }}>
            <img src={article.image_url} alt={article.image_alt || article.title}
              style={{ width: '100%', maxHeight: 460, objectFit: 'cover', display: 'block' }} />
          </div>
        )}

        {/* Excerpt */}
        <p style={{ fontSize: '1.12rem', color: 'rgba(255,255,255,.65)', lineHeight: 1.9, marginBottom: '3rem', fontStyle: 'italic', borderLeft: '3px solid #8B2FC9', paddingLeft: '1.4rem' }}>
          {article.excerpt}
        </p>

        {/* Content with tool CTAs and images injected */}
        <ArticleContent html={article.content} />

        {/* Bottom signup CTA */}
        <div style={{ marginTop: '4rem', padding: '3rem 2rem 2.5rem', background: 'linear-gradient(135deg, rgba(139,47,201,.14), rgba(232,35,122,.09))', border: '1px solid rgba(139,47,201,.28)', borderRadius: 24, textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: 'linear-gradient(135deg,#8B2FC9,#E8237A)', borderRadius: 100, padding: '.3rem 1rem', fontSize: '.75rem', color: '#fff', fontWeight: 700, marginBottom: '1.25rem', letterSpacing: '.04em' }}>
            THE ULTIMATE ACADEMY
          </div>
          <h3 style={{ fontSize: 'clamp(1.3rem,3vw,1.9rem)', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '.75rem', lineHeight: 1.2 }}>
            Passe à l'action.<br />Ton programme t'attend.
          </h3>
          <p style={{ color: 'rgba(255,255,255,.5)', fontSize: '.92rem', marginBottom: '2rem', maxWidth: 400, margin: '0 auto 2rem', lineHeight: 1.7 }}>
            Arrête de t'entraîner au hasard. Reçois un plan construit pour toi, suivi semaine après semaine.
          </p>

          {/* 3 benefits */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
            {[
              { icon: '🎯', text: 'Plan 100 % sur-mesure' },
              { icon: '💬', text: 'Suivi direct par le coach' },
              { icon: '⚡', text: 'Résultats dès 4 semaines' },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.85rem', color: 'rgba(255,255,255,.7)' }}>
                <span>{icon}</span><span>{text}</span>
              </div>
            ))}
          </div>

          <Link to="/register" style={{ display: 'inline-block', background: 'linear-gradient(135deg,#8B2FC9,#E8237A)', color: '#fff', padding: '1rem 2.5rem', borderRadius: 14, fontWeight: 800, textDecoration: 'none', fontSize: '1rem', boxShadow: '0 6px 24px rgba(232,35,122,.4)' }}>
            Démarrer mon programme →
          </Link>
          <p style={{ color: 'rgba(255,255,255,.25)', fontSize: '.78rem', marginTop: '.9rem' }}>
            Sans engagement · 30 €/mois · Résiliable à tout moment
          </p>
        </div>

      </article>

      <SiteFooter />

      <style>{`
        .article-content h2 {
          font-size: 1.45rem;
          font-weight: 800;
          margin: 3.25rem 0 1.1rem;
          color: #fff;
          letter-spacing: -0.015em;
          line-height: 1.25;
        }
        .article-content h2:first-child { margin-top: 0; }
        .article-content p { margin-bottom: 1.5rem; line-height: 1.9; color: rgba(255,255,255,.72); text-align: justify; hyphens: auto; }
        .article-content ul, .article-content ol { padding-left: 1.5rem; margin-bottom: 1.5rem; }
        .article-content li { margin-bottom: .7rem; line-height: 1.8; color: rgba(255,255,255,.72); text-align: justify; hyphens: auto; }
        .article-content strong {
          font-weight: 700;
          background: linear-gradient(135deg, #C084FC, #F472B6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .article-content a { color: #C084FC; }
        .article-content blockquote {
          border-left: 3px solid #8B2FC9;
          margin: 2rem 0;
          padding: .85rem 1.4rem;
          color: rgba(255,255,255,.55);
          font-style: italic;
          background: rgba(139,47,201,.06);
          border-radius: 0 12px 12px 0;
        }
        .tool-cta-inner { transition: transform .15s, box-shadow .15s; }
        .tool-cta-inner:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,0,0,.3); }
        @media (min-width: 640px) { .nav-outils { display: flex !important; } }
      `}</style>
    </div>
  )
}

const tagStyle = {
  background: 'rgba(139,47,201,.15)',
  border: '1px solid rgba(139,47,201,.22)',
  borderRadius: 100,
  padding: '.25rem .72rem',
  fontSize: '.73rem',
  color: '#C084FC',
  fontWeight: 600,
}
