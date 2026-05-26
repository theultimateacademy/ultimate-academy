import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../lib/api'
import LoadingSpinner from '../../components/UI/LoadingSpinner'

const C = { purple: '#8B2FC9', pink: '#E8237A', green: '#34D399', yellow: '#FBBF24', red: '#F87171' }
const gradient = `linear-gradient(135deg, ${C.purple} 0%, ${C.pink} 100%)`

function scoreColor(v) {
  return v >= 7 ? C.green : v >= 5 ? C.yellow : C.red
}

// SVG ring gauge — iOS Activity style
function ScoreRing({ score, size = 130 }) {
  const [animated, setAnimated] = useState(false)
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 100); return () => clearTimeout(t) }, [])
  const r = (size - 18) / 2
  const circ = 2 * Math.PI * r
  const filled = animated ? (score / 10) * circ : 0
  const color  = scoreColor(score)
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,.12)" strokeWidth={12} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={12}
          strokeDasharray={`${filled} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1.4s cubic-bezier(.4,0,.2,1)', filter: `drop-shadow(0 0 6px ${color})` }} />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: '1.9rem', fontWeight: 800, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.5)', fontWeight: 600, letterSpacing: '.04em', marginTop: 2 }}>/10</span>
      </div>
    </div>
  )
}

// Animated score bar
function ScoreBar({ label, value, icon, delay = 0 }) {
  const [w, setW] = useState(0)
  useEffect(() => { const t = setTimeout(() => setW(value * 10), 200 + delay); return () => clearTimeout(t) }, [value, delay])
  const color = scoreColor(value)
  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
          <span style={{ fontSize: '1rem' }}>{icon}</span>
          <span style={{ fontSize: '.875rem', color: 'rgba(255,255,255,.8)', fontWeight: 500 }}>{label}</span>
        </div>
        <span style={{ fontSize: '.95rem', fontWeight: 800, color }}>{value}<span style={{ fontSize: '.7rem', fontWeight: 500, color: 'rgba(255,255,255,.4)', marginLeft: 1 }}>/10</span></span>
      </div>
      <div style={{ height: 10, borderRadius: 99, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 99, width: `${w}%`,
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          boxShadow: `0 0 12px ${color}66`,
          transition: 'width 1s cubic-bezier(.4,0,.2,1)',
        }} />
      </div>
    </div>
  )
}

// Parse numbered conseils into structured tips
function parseTips(text) {
  if (!text) return []
  const items = text.split(/\n\n+/).filter(Boolean)
  return items.map(item => {
    const titleMatch = item.match(/^\d+\.\s+(?:\*\*(.+?)\*\*|(.+?)\s*:)/)
    const title = (titleMatch?.[1] || titleMatch?.[2] || '').replace(/\s*\(.*?\)/, '').trim()
    const body  = item.replace(/^\d+\.\s+(\*\*[^*]+\*\*|[^:]+)\s*:\s*/, '').replace(/\*\*/g, '').trim()
    const num   = parseInt(item.match(/^(\d+)/)?.[1] || '0')
    return { num, title, body }
  }).filter(t => t.body)
}

const TIP_ICONS = ['😴', '🍝', '🦵', '🧠', '🎒']
const TIP_COLORS = ['#6366F1', '#F59E0B', '#10B981', '#EC4899', '#8B5CF6']

export default function PreRaceAnalysis() {
  const { profile }  = useAuth()
  const navigate     = useNavigate()
  const [analysis,   setAnalysis]   = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error,      setError]      = useState(null)
  const [visible,    setVisible]    = useState(false)

  useEffect(() => {
    if (!profile?.id) return
    loadAnalysis()
  }, [profile?.id])

  useEffect(() => {
    if (analysis) setTimeout(() => setVisible(true), 50)
  }, [analysis])

  async function loadAnalysis() {
    setLoading(true)
    try {
      const { analysis } = await api.getPreRaceAnalysis(profile.id)
      setAnalysis(analysis)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  async function handleGenerate() {
    setGenerating(true)
    setError(null)
    try {
      const { analysis } = await api.generatePreRaceAnalysis({ userId: profile.id })
      setAnalysis(analysis)
    } catch (err) { setError(err.message) }
    finally { setGenerating(false) }
  }

  if (loading) return <LoadingSpinner fullPage text="Chargement de ton analyse…" />

  const c    = analysis?.content || {}
  const ev   = c.evaluation || {}
  const tips = parseTips(c.conseils)
  const raceDate = analysis?.race_date
  const daysLeft = raceDate
    ? Math.ceil((new Date(raceDate).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86400000)
    : null

  return (
    <div className="page" style={{ maxWidth: 640, margin: '0 auto', paddingBottom: '3rem' }}>

      {/* ── HERO ── */}
      <div style={{
        background: gradient,
        borderRadius: 24,
        padding: '1.5rem 1.5rem 2rem',
        marginBottom: '1.25rem',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(139,47,201,.4)',
      }}>
        {/* background orbs */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -30, left: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,.04)', pointerEvents: 'none' }} />

        <button onClick={() => navigate('/app/home')} style={{
          display: 'inline-flex', alignItems: 'center', gap: '.3rem',
          background: 'rgba(255,255,255,.15)', border: 'none', backdropFilter: 'blur(8px)',
          color: '#fff', borderRadius: 99, padding: '.35rem .9rem',
          cursor: 'pointer', fontSize: '.8rem', fontFamily: 'inherit', fontWeight: 600,
          marginBottom: '1.25rem',
        }}>
          ‹ Accueil
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {ev.note_globale ? (
            <ScoreRing score={ev.note_globale} size={120} />
          ) : (
            <div style={{ fontSize: '3rem' }}>🎯</div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '.35rem',
              background: 'rgba(255,255,255,.18)', borderRadius: 99,
              padding: '.25rem .75rem', fontSize: '.75rem', fontWeight: 700,
              marginBottom: '.5rem', backdropFilter: 'blur(8px)',
            }}>
              {daysLeft !== null ? `J-${daysLeft} avant ta course` : 'Analyse pré-course'}
            </div>
            <h2 style={{ margin: '0 0 .25rem', fontSize: '1.3rem', fontWeight: 800 }}>
              {profile?.first_name}, prêt(e) ?
            </h2>
            <p style={{ margin: 0, opacity: .8, fontSize: '.85rem', lineHeight: 1.5 }}>
              Bilan personnalisé de ta préparation pour le{' '}
              <strong>{analysis?.objective || 'objectif'}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* ── EMPTY STATE ── */}
      {!analysis && !generating && (
        <div style={{
          background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
          borderRadius: 20, padding: '2.5rem', textAlign: 'center',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
          <h3 style={{ marginBottom: '.5rem' }}>Analyse non encore générée</h3>
          <p style={{ color: 'rgba(255,255,255,.5)', fontSize: '.875rem', marginBottom: '1.75rem', lineHeight: 1.6 }}>
            Générée automatiquement J-7 avant ta course.<br />Tu peux aussi la déclencher maintenant.
          </p>
          <button onClick={handleGenerate} style={{
            background: gradient, border: 'none', color: '#fff',
            borderRadius: 99, padding: '.75rem 2rem', fontSize: '.95rem',
            fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 8px 24px rgba(232,35,122,.4)',
          }}>
            Générer mon analyse
          </button>
        </div>
      )}

      {generating && (
        <div style={{
          background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
          borderRadius: 20, padding: '3rem', textAlign: 'center',
        }}>
          <LoadingSpinner text="J'analyse ta préparation…" />
        </div>
      )}

      {error && (
        <div style={{
          background: 'rgba(248,113,113,.12)', border: '1px solid rgba(248,113,113,.3)',
          borderRadius: 12, padding: '1rem', marginBottom: '1rem', fontSize: '.875rem', color: C.red,
        }}>
          {error}
        </div>
      )}

      {analysis && (
        <div style={{
          opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(16px)',
          transition: 'opacity .5s ease, transform .5s ease',
        }}>

          {/* ── BILAN ── */}
          <Section icon="📊" label="Bilan" color="#6366F1" title="12 semaines de prépa">
            <p style={{ margin: 0, lineHeight: 1.8, color: 'rgba(255,255,255,.82)', fontSize: '.9rem' }}>
              {c.bilan}
            </p>
          </Section>

          {/* ── ÉVALUATION ── */}
          {ev.regularite !== undefined && (
            <Section icon="⭐" label="Évaluation" color={C.yellow} title="Ta préparation en chiffres">
              <div style={{ marginBottom: '1.25rem' }}>
                <ScoreBar icon="📅" label="Régularité"    value={ev.regularite}   delay={0} />
                <ScoreBar icon="⚡" label="Intensité"      value={ev.intensite}    delay={80} />
                <ScoreBar icon="💤" label="Récupération"   value={ev.recuperation} delay={160} />
                <ScoreBar icon="🎯" label="Spécificité"    value={ev.specificite}  delay={240} />
              </div>
              {ev.commentaire && (
                <div style={{
                  background: 'rgba(255,255,255,.05)', borderRadius: 12,
                  border: '1px solid rgba(255,255,255,.08)', padding: '1rem',
                  fontSize: '.875rem', color: 'rgba(255,255,255,.75)', lineHeight: 1.7,
                  fontStyle: 'italic',
                }}>
                  "{ev.commentaire}"
                </div>
              )}
            </Section>
          )}

          {/* ── STRATÉGIE ── */}
          {c.strategie && (
            <Section icon="🏃" label="Stratégie" color={C.green} title="Ta course, km par km">
              <p style={{ margin: 0, lineHeight: 1.8, color: 'rgba(255,255,255,.82)', fontSize: '.9rem' }}>
                {c.strategie}
              </p>
            </Section>
          )}

          {/* ── CONSEILS ── */}
          {tips.length > 0 && (
            <Section icon="📋" label="Conseils" color={C.pink} title="J-7 à J-1, jour par jour">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                {tips.map((tip, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: '1rem', alignItems: 'flex-start',
                    background: 'rgba(255,255,255,.04)',
                    border: '1px solid rgba(255,255,255,.07)',
                    borderRadius: 14, padding: '.9rem 1rem',
                  }}>
                    <div style={{
                      width: 40, height: 40, flexShrink: 0, borderRadius: 12,
                      background: `${TIP_COLORS[i % TIP_COLORS.length]}22`,
                      border: `1px solid ${TIP_COLORS[i % TIP_COLORS.length]}44`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.2rem',
                    }}>
                      {TIP_ICONS[i % TIP_ICONS.length]}
                    </div>
                    <div style={{ flex: 1 }}>
                      {tip.title && (
                        <div style={{
                          fontSize: '.75rem', fontWeight: 700, letterSpacing: '.06em',
                          color: TIP_COLORS[i % TIP_COLORS.length],
                          textTransform: 'uppercase', marginBottom: '.3rem',
                        }}>
                          {tip.title}
                        </div>
                      )}
                      <p style={{ margin: 0, fontSize: '.875rem', lineHeight: 1.7, color: 'rgba(255,255,255,.78)' }}>
                        {tip.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* ── CTA POST-COURSE ── */}
          <div style={{
            background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
            borderRadius: 20, padding: '1.5rem', textAlign: 'center', marginTop: '.5rem',
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '.5rem' }}>🏅</div>
            <p style={{ margin: '0 0 1rem', fontSize: '.875rem', color: 'rgba(255,255,255,.6)', lineHeight: 1.6 }}>
              Après ta course, reviens partager ton résultat<br />pour mon analyse complète
            </p>
            <button onClick={() => navigate('/app/home')} style={{
              background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.15)',
              color: '#fff', borderRadius: 99, padding: '.6rem 1.5rem',
              fontSize: '.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              Retour à l'accueil
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ icon, label, color, title, children }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,.04)',
      border: '1px solid rgba(255,255,255,.07)',
      borderRadius: 20, padding: '1.25rem',
      marginBottom: '1rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '1rem' }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
          background: `${color}22`, border: `1px solid ${color}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.95rem',
        }}>
          {icon}
        </div>
        <div>
          <div style={{ fontSize: '.65rem', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '.07em' }}>
            {label}
          </div>
          <div style={{ fontSize: '.95rem', fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
            {title}
          </div>
        </div>
      </div>
      {children}
    </div>
  )
}
