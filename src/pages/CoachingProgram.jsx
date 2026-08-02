import { useState } from 'react'
import { useParams, Navigate, useNavigate } from 'react-router-dom'
import Nav from '../components/Nav'
import SiteFooter from '../components/SiteFooter'
import { useSEO } from '../lib/useSEO'
import { COACHING_PROGRAMS } from '../data/coachingPrograms'

const grad = 'linear-gradient(135deg,#8B2FC9,#E8237A)'
const gd = () => ({
  background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  backgroundClip: 'text', display: 'inline',
})

export default function CoachingProgram() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [openFaq, setOpenFaq] = useState(null)
  const program = COACHING_PROGRAMS[slug]

  const canonical = program ? `https://theultimateacademy.fr/coaching/${program.slug}` : undefined

  useSEO(program ? {
    title: program.metaTitle,
    description: program.metaDescription,
    keywords: program.keywords.join(', '),
    canonical,
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: program.schemaName,
      description: program.schemaDescription,
      provider: {
        '@type': 'Organization',
        name: 'The Ultimate Academy',
        sameAs: 'https://theultimateacademy.fr',
      },
      offers: {
        '@type': 'Offer',
        category: 'Coaching sportif',
        priceCurrency: 'EUR',
        url: canonical,
      },
    },
  } : {})

  if (!program) return <Navigate to="/" replace />

  return (
    <div style={{ background: '#000', color: '#fff', minHeight: '100vh' }}>
      <Nav />

      {/* ── Hero ── */}
      <section style={{ padding: '9rem 1.5rem 5rem', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: 780, margin: '0 auto' }}>
          <p style={{ fontSize: '.78rem', fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,.4)', marginBottom: '1rem' }}>
            {program.distanceLabel}
          </p>
          <h1 style={{ fontSize: 'clamp(2.1rem,5.5vw,3.4rem)', fontWeight: 800, letterSpacing: '-0.03em',
            lineHeight: 1.12, marginBottom: '1.25rem' }}>
            {program.h1.split(' ').slice(0, -1).join(' ')} <span style={gd()}>{program.h1.split(' ').slice(-1)}</span>
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,.6)', lineHeight: 1.75, marginBottom: '2.25rem' }}>
            {program.heroSub}
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/register')} style={{
              padding: '.9rem 2.1rem', borderRadius: 99, border: 'none', cursor: 'pointer',
              fontWeight: 800, fontSize: '1rem', fontFamily: 'inherit', color: '#fff',
              background: grad, boxShadow: '0 8px 28px rgba(232,35,122,.4)',
            }}>
              Commencer gratuitement →
            </button>
          </div>
          <p style={{ marginTop: '1rem', fontSize: '.78rem', color: 'rgba(255,255,255,.35)' }}>
            14 jours gratuits · sans engagement · {program.audience}
          </p>
        </div>
      </section>

      {/* ── Pourquoi choisir ce coaching ── */}
      <section style={{ padding: '4rem 1.5rem', borderTop: '1px solid rgba(255,255,255,.06)' }}>
        <div className="container" style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(1.6rem,4vw,2.2rem)', fontWeight: 800, letterSpacing: '-0.02em',
            textAlign: 'center', marginBottom: '3rem' }}>
            Pourquoi choisir ce <span style={gd()}>coaching {program.shortLabel}</span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
            {program.whyChoose.map((f, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)',
                borderRadius: 20, padding: '1.75rem 1.5rem',
              }}>
                <div style={{ fontSize: '1.9rem', marginBottom: '.9rem' }}>{f.icon}</div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '.6rem' }}>{f.title}</h3>
                <p style={{ fontSize: '.88rem', color: 'rgba(255,255,255,.55)', lineHeight: 1.7 }}>{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Programme type 4 semaines ── */}
      <section style={{ padding: '4rem 1.5rem', borderTop: '1px solid rgba(255,255,255,.06)', background: 'rgba(255,255,255,.015)' }}>
        <div className="container" style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(1.6rem,4vw,2.2rem)', fontWeight: 800, letterSpacing: '-0.02em',
            textAlign: 'center', marginBottom: '.75rem' }}>
            Un programme type sur <span style={gd()}>4 semaines</span>
          </h2>
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,.45)', fontSize: '.95rem', marginBottom: '3rem' }}>
            Un aperçu — ton plan réel est entièrement personnalisé selon ton niveau et ton objectif
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {program.program4Weeks.map(w => (
              <div key={w.week} style={{
                display: 'flex', gap: '1.25rem', alignItems: 'flex-start',
                background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)',
                borderRadius: 16, padding: '1.25rem 1.5rem',
              }}>
                <div style={{
                  flexShrink: 0, width: 44, height: 44, borderRadius: 12, background: grad,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '1.1rem',
                }}>{w.week}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '.95rem', marginBottom: '.3rem' }}>
                    Semaine {w.week} — {w.title}
                  </div>
                  <div style={{ fontSize: '.85rem', color: 'rgba(255,255,255,.5)', lineHeight: 1.6 }}>{w.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Témoignage ── */}
      <section style={{ padding: '4rem 1.5rem', borderTop: '1px solid rgba(255,255,255,.06)' }}>
        <div className="container" style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{program.testimonial.emoji}</div>
          <p style={{ fontSize: '1.15rem', lineHeight: 1.75, color: 'rgba(255,255,255,.85)', fontStyle: 'italic', marginBottom: '1.25rem' }}>
            "{program.testimonial.quote}"
          </p>
          <div style={{ fontWeight: 700 }}>{program.testimonial.name}, {program.testimonial.age} ans</div>
          <div style={{ fontSize: '.85rem', color: 'rgba(255,255,255,.45)' }}>{program.testimonial.role}</div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: '4rem 1.5rem', borderTop: '1px solid rgba(255,255,255,.06)' }}>
        <div className="container" style={{ maxWidth: 760, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(1.6rem,4vw,2.2rem)', fontWeight: 800, letterSpacing: '-0.02em',
            textAlign: 'center', marginBottom: '2.5rem' }}>
            Questions <span style={gd()}>fréquentes</span>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            {program.faq.map((item, i) => {
              const open = openFaq === i
              return (
                <div key={i} onClick={() => setOpenFaq(open ? null : i)} style={{
                  borderRadius: 20, overflow: 'hidden', cursor: 'pointer',
                  background: open ? 'rgba(139,47,201,.12)' : 'rgba(255,255,255,.04)',
                  border: `1px solid ${open ? 'rgba(139,47,201,.35)' : 'rgba(255,255,255,.08)'}`,
                  transition: 'background .2s, border-color .2s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '1.25rem 1.5rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '.975rem', color: open ? '#fff' : 'rgba(255,255,255,.8)', lineHeight: 1.5 }}>
                      {item.q}
                    </span>
                    <span style={{
                      flexShrink: 0, width: 28, height: 28, borderRadius: '50%',
                      background: open ? grad : 'rgba(255,255,255,.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '.9rem', fontWeight: 700, color: '#fff',
                      transition: 'background .2s, transform .25s',
                      transform: open ? 'rotate(45deg)' : 'none',
                    }}>+</span>
                  </div>
                  {open && (
                    <div style={{ padding: '0 1.5rem 1.25rem', color: 'rgba(255,255,255,.6)', fontSize: '.925rem', lineHeight: 1.8 }}>
                      {item.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section style={{ padding: '5rem 1.5rem 6rem', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,.06)' }}>
        <div className="container" style={{ maxWidth: 620, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(1.6rem,4vw,2.2rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '1rem' }}>
            Prêt à préparer ton <span style={gd()}>{program.distanceLabel}</span> ?
          </h2>
          <p style={{ color: 'rgba(255,255,255,.55)', fontSize: '1rem', marginBottom: '2rem', lineHeight: 1.7 }}>
            14 jours d'essai gratuit, carte requise, aucun débit pendant l'essai. Annulable à tout moment.
          </p>
          <button onClick={() => navigate('/register')} style={{
            padding: '1rem 2.5rem', borderRadius: 99, border: 'none', cursor: 'pointer',
            fontWeight: 800, fontSize: '1.02rem', fontFamily: 'inherit', color: '#fff',
            background: grad, boxShadow: '0 8px 28px rgba(232,35,122,.4)',
          }}>
            Commencer gratuitement →
          </button>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
