import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { parseAllutesPace, fmtDistance, fmtDuration, SESSION_TYPE_COLORS, getPlanStartMonday, getPlanWeeksElapsed } from '../../lib/utils'
import { api } from '../../lib/api'
import { downloadFit, generateFitWorkout } from '../../lib/fitGenerator'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import PostSessionFlow from '../../components/PostSessionFlow'

function ExportBtn({ session, suuntoConnected, garminConnected, userId }) {
  const [open,    setOpen]    = useState(false)
  const [info,    setInfo]    = useState('')
  const [sending, setSending] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const close = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  async function doGarminApi(e) {
    e.stopPropagation()
    setOpen(false)
    setSending(true)
    try {
      await api.garminSendWorkout({ userId, session })
      setInfo('garmin_sent')
    } catch {
      setInfo('garmin_error')
    } finally {
      setSending(false)
    }
  }

  function doGarminFit(e) {
    e.stopPropagation()
    downloadFit(session, 'garmin')
    setInfo('garmin_fit')
    setOpen(false)
  }

  function doCoros(e) {
    e.stopPropagation()
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '')
    const name = (session.titre || 'seance').replace(/[^a-zA-Z0-9À-ɏ]/g, '_').replace(/_+/g, '_').substring(0, 30)
    downloadFit(session, 'coros', `TUA_${name}_${date}.fit`)
    setInfo('coros')
    setOpen(false)
  }

  function doSuunto(e) {
    e.stopPropagation()
    downloadFit(session, 'suunto')
    setInfo('suunto')
    setOpen(false)
  }

  const menuBtn = { width: '100%', textAlign: 'left', padding: '.6rem .875rem', borderRadius: 0, fontSize: '.82rem', whiteSpace: 'nowrap' }
  const confirmStyle = { position: 'absolute', right: 0, bottom: 'calc(100% + .4rem)', zIndex: 60,
    background: 'rgba(16,185,129,.15)', border: '1px solid rgba(16,185,129,.3)',
    borderRadius: 'var(--radius)', padding: '.5rem .75rem', fontSize: '.75rem', color: '#6EE7B7', whiteSpace: 'nowrap' }

  return (
    <div ref={ref} style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
      <button
        className="btn btn-ghost btn-sm"
        style={{ fontSize: '.75rem', padding: '.3rem .65rem', display: 'flex', alignItems: 'center', gap: '.3rem' }}
        disabled={sending}
        onClick={e => { e.stopPropagation(); setOpen(v => !v); setInfo('') }}>
        {sending ? <div className="spinner spinner-sm" /> : <>⬇ <span style={{ fontSize: '.7rem' }}>Exporter</span></>}
      </button>

      {open && (
        <div style={{ position: 'absolute', right: 0, bottom: 'calc(100% + .4rem)', zIndex: 60,
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow-lg)', overflow: 'hidden', minWidth: 185 }}>
          {garminConnected ? (
            <button className="btn btn-ghost" style={menuBtn} onClick={doGarminApi}>
              🟦 Envoyer sur Garmin
            </button>
          ) : (
            <button className="btn btn-ghost" style={menuBtn} onClick={doGarminFit}>
              🟦 Garmin Connect (.FIT)
            </button>
          )}
          <div style={{ height: 1, background: 'var(--border)' }} />
          <button className="btn btn-ghost" style={menuBtn} onClick={doCoros}>
            ⬛ Envoyer sur ma Coros
          </button>
          <div style={{ height: 1, background: 'var(--border)' }} />
          <button className="btn btn-ghost" style={menuBtn} onClick={doSuunto}>
            🔴 Suunto (.FIT)
          </button>
        </div>
      )}

      {info === 'garmin_sent' && (
        <div style={confirmStyle}>✅ Envoyée sur Garmin Connect !</div>
      )}
      {info === 'garmin_error' && (
        <div style={{ ...confirmStyle, background: 'rgba(239,68,68,.15)', borderColor: 'rgba(239,68,68,.3)', color: '#FCA5A5' }}>
          ⚠️ Erreur envoi Garmin
        </div>
      )}
      {info === 'coros' && (
        <div style={{ ...confirmStyle, whiteSpace: 'normal', maxWidth: 220, lineHeight: 1.4 }}>
          ✅ Fichier téléchargé. Ouvre la séance pour les instructions.
        </div>
      )}
      {(info === 'garmin_fit' || info === 'suunto') && (
        <div style={confirmStyle}>✅ .FIT téléchargé</div>
      )}
    </div>
  )
}

function SessionDetailPage({ session, weekNum, sessionIdx, planId, vma, onClose, onDone, onStartFlow }) {
  const { profile } = useAuth()
  const [isDone,      setIsDone]      = useState(session._isDone || false)
  const [stravaAct,   setStravaAct]   = useState(null)
  const [exportInfo,  setExportInfo]  = useState('')
  const [corosModal,  setCorosModal]  = useState(false)
  const [corosCopied, setCorosCopied] = useState(false)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    if (profile?.strava_connected) {
      const today = new Date().toISOString().split('T')[0]
      supabase.from('strava_activities').select('*').eq('user_id', profile.id)
        .gte('start_date', today + 'T00:00:00Z').lte('start_date', today + 'T23:59:59Z').limit(1)
        .then(({ data }) => { if (data?.[0]) setStravaAct(data[0]) })
    }
  }, [])

  // Helpers
  const typeColor    = SESSION_TYPE_COLORS[session.type] || '#8B5CF6'
  const sessionTypeL = (session.type || '').toLowerCase()
  // Natation/vélo/brique : pas d'allure en min/km
  const isNonRunning = sessionTypeL.includes('natation') || sessionTypeL.includes('vélo') || sessionTypeL.includes('velo') || sessionTypeL.includes('brique')
  const alluresOk  = (session.allures || []).filter(a => a?.allure_min_km && typeof a.allure_min_km === 'string' && !a.allure_min_km.includes('[object'))
  const efPace       = isNonRunning ? null : (alluresOk[0] || null)
  const cooldownPace = isNonRunning ? null : (alluresOk.find(a => /retour|calme|récup/i.test(a.zone || '')) || efPace)
  // spePace = the main-set (corps) allure: prefer explicit "Corps" zone label, else highest intensity
  const spePace    = alluresOk.length > 1
    ? (alluresOk.find(a => /corps|principal/i.test(a.zone || ''))
       || alluresOk.reduce((best, a) => ((a.pourcentage_vma || 0) > (best.pourcentage_vma || 0)) ? a : best, alluresOk[0]))
    : efPace

  function PaceChip({ allure, color }) {
    if (!allure?.allure_min_km) return null
    // Strip trailing /km so we never produce "7'06/km/km"
    const pace = allure.allure_min_km.replace(/"/g, '').replace(/\/km$/i, '')
    const bg     = color ? color + '18' : 'rgba(255,255,255,.08)'
    const border = color ? color + '35' : 'rgba(255,255,255,.14)'
    const text   = color || 'rgba(255,255,255,.7)'
    return (
      <span style={{ background: bg, border: `1px solid ${border}`, borderRadius: 99,
        padding: '.18rem .6rem', fontSize: '.75rem', fontWeight: 700, color: text, whiteSpace: 'nowrap' }}>
        {pace}<span style={{ opacity: .6, fontWeight: 400 }}>/km</span>
      </span>
    )
  }

  function PhaseArrow() {
    return (
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 1.25rem', height: 28 }}>
        <div style={{ width: 1, height: '100%', background: 'var(--border)', margin: '0 auto' }} />
      </div>
    )
  }

  function MainSetVisual() {
    const mainSet = session.corps || ''
    const type    = (session.type || '').toLowerCase()

    // ── EF: endurance fondamentale — special clean display ───────
    if (type.includes('endurance fondamentale') || type === 'ef') {
      const allOk   = (session.allures || []).filter(a => a?.allure_min_km)
      const paceMin = allOk.find(a => (a.pourcentage_vma || 0) <= 66) || allOk[0]
      const paceMax = allOk.find(a => (a.pourcentage_vma || 0) >= 70 && a !== paceMin) || null
      return (
        <div style={{ padding: '.75rem 0', textAlign: 'center' }}>
          <div style={{ fontSize: '3.8rem', fontWeight: 900, lineHeight: 1, color: '#fff' }}>
            {session.duree_min}
          </div>
          <div style={{ fontSize: '.82rem', color: 'rgba(255,255,255,.35)', marginBottom: '1.375rem', marginTop: '.2rem' }}>
            minutes
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem',
            background: typeColor + '14', borderRadius: 99, padding: '.45rem 1.125rem',
            border: `1px solid ${typeColor}30`, marginBottom: '1rem' }}>
            {paceMin && <span style={{ fontSize: '1rem', fontWeight: 700, color: typeColor }}>{paceMin.allure_min_km}</span>}
            {paceMax && <>
              <span style={{ color: 'rgba(255,255,255,.3)', fontSize: '.82rem' }}>à</span>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: typeColor }}>{paceMax.allure_min_km}</span>
            </>}
            <span style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.35)' }}>/km</span>
          </div>
          <div style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.35)', fontStyle: 'italic' }}>
            65 à 72% VMA · allure au ressenti
          </div>
        </div>
      )
    }

    // ── BLOC / bullet structured session ─────────────────────────
    const hasBloc   = /^BLOC\b/im.test(mainSet)
    const hasBullet = mainSet.includes('•')
    if (hasBloc || hasBullet) {
      const lines = mainSet.split('\n')
      const nodes = []
      for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim()
        if (!trimmed) continue

        if (/^BLOC\b/i.test(trimmed)) {
          nodes.push(
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '.75rem',
              margin: nodes.length > 0 ? '1rem 0 0' : '0',
            }}>
              <div style={{ flex: 1, height: 1, background: `${typeColor}35` }} />
              <span style={{
                fontSize: '.7rem', fontWeight: 800, letterSpacing: '.1em', flexShrink: 0,
                color: typeColor, textTransform: 'uppercase',
                padding: '.25rem .875rem',
                background: `${typeColor}18`, borderRadius: 99,
                border: `1px solid ${typeColor}35`,
              }}>{trimmed}</span>
              <div style={{ flex: 1, height: 1, background: `${typeColor}35` }} />
            </div>
          )
          continue
        }

        if (trimmed.startsWith('•')) {
          const content = trimmed.slice(1).trim()
          const isRecov = /r[eé]cup|marche|trot|repos|footing.*lent|lent.*footing/i.test(content)

          if (isRecov) {
            nodes.push(
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem', padding: '.2rem 0' }}>
                <span style={{ fontSize: '.75rem', color: '#38BDF8' }}>⏸</span>
                <span style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.4)', fontStyle: 'italic' }}>{content}</span>
              </div>
            )
          } else {
            // Matches "4x1500m", "3x10min", "10x400m" (NxM pattern) OR "55 min", "6 km" (simple)
            const mMatch = content.match(/^(\d+\s*[×x]\s*\d+(?:[.,]\d+)?\s*(?:m\b|km\b|min\b)|\d+(?:[.,]\d+)?\s*(?:m\b|km\b|min\b))\s+/i)
            const metric = mMatch ? mMatch[1].trim() : null
            const rest   = mMatch ? content.slice(mMatch[0].length) : content
            nodes.push(
              <div key={i} style={{
                background: `${typeColor}0D`, border: `1px solid ${typeColor}2A`,
                borderRadius: 16, padding: '1rem 1.125rem',
              }}>
                {metric && (
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff', lineHeight: 1, marginBottom: '.35rem' }}>
                    {metric}
                  </div>
                )}
                <div style={{ fontSize: '.875rem', lineHeight: 1.6, color: 'rgba(255,255,255,.72)' }}>
                  {metric ? rest : content}
                </div>
              </div>
            )
          }
          continue
        }

        // Plain prose line (e.g. "Récupération externe : 3 min footing lent...")
        nodes.push(
          <div key={i} style={{
            padding: '.625rem .875rem', marginTop: '.375rem',
            background: 'rgba(14,165,233,.06)', border: '1px solid rgba(14,165,233,.14)',
            borderRadius: 10,
          }}>
            <p style={{ fontSize: '.82rem', lineHeight: 1.55, color: 'rgba(255,255,255,.5)', margin: 0, fontStyle: 'italic' }}>
              {trimmed}
            </p>
          </div>
        )
      }
      return <div style={{ display: 'flex', flexDirection: 'column', gap: '.625rem' }}>{nodes}</div>
    }

    // ── Tout le reste : affichage unifié — durée + allures ───────
    // (inclut footings, progressif, récupération, activation, et fractionné simple)
    if (session.duree_min > 0) {
      const allOk = (session.allures || []).filter(a => a?.allure_min_km)
      const corpsAllures = allOk.filter(a => !/retour|calme|récup|échauff/i.test(a.zone || ''))
      const display = corpsAllures.length > 0 ? corpsAllures : allOk
      const sorted = [...display].sort((a, b) => (a.vitesse_kmh || 0) - (b.vitesse_kmh || 0))
      const paceMin = sorted[0] || null
      const paceMax = sorted.length > 1 && sorted[sorted.length - 1] !== paceMin ? sorted[sorted.length - 1] : null
      const isProgressif = type.includes('progressif') || type.includes('progression')
      return (
        <div style={{ padding: '.5rem 0', textAlign: 'center' }}>
          <div style={{ fontSize: '3.8rem', fontWeight: 900, lineHeight: 1, color: '#fff' }}>
            {session.duree_min}
          </div>
          <div style={{ fontSize: '.82rem', color: 'rgba(255,255,255,.35)', marginBottom: '1.25rem', marginTop: '.2rem' }}>
            minutes
          </div>
          {(paceMin || paceMax) && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem',
              background: typeColor + '14', borderRadius: 99, padding: '.45rem 1.125rem',
              border: `1px solid ${typeColor}30`, marginBottom: '.875rem' }}>
              {paceMin && <span style={{ fontSize: '1rem', fontWeight: 700, color: typeColor }}>{paceMin.allure_min_km}</span>}
              {paceMax && <>
                <span style={{ color: 'rgba(255,255,255,.3)', fontSize: '.82rem' }}>à</span>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: typeColor }}>{paceMax.allure_min_km}</span>
              </>}
              <span style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.35)' }}>/km</span>
            </div>
          )}
          {paceMin && (
            <div style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.35)', fontStyle: 'italic' }}>
              {isProgressif && paceMax
                ? `On part de ${paceMin.pourcentage_vma}% VMA pour aller vers ${paceMax.pourcentage_vma}% VMA`
                : paceMax
                  ? `${paceMin.pourcentage_vma} à ${paceMax.pourcentage_vma}% VMA · allure au ressenti`
                  : `${paceMin.pourcentage_vma}% VMA · allure au ressenti`}
            </div>
          )}
        </div>
      )
    }

    return <p style={{ fontSize: '.9rem', lineHeight: 1.7, color: 'rgba(255,255,255,.8)', whiteSpace: 'pre-line' }}>{mainSet}</p>
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'var(--bg)', overflowY: 'auto',
      animation: 'slideUpFull .35s cubic-bezier(0.32, 0.72, 0, 1)',
    }}>
      <style>{`
        @keyframes slideUpFull { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes fadeInCard  { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes ctaPulse    { 0%,100% { box-shadow: 0 4px 20px rgba(139,47,201,.45); } 50% { box-shadow: 0 4px 32px rgba(139,47,201,.7); } }
        .detail-card { animation: fadeInCard .38s ease both; }
        .detail-card:nth-child(1){animation-delay:.05s}
        .detail-card:nth-child(2){animation-delay:.1s}
        .detail-card:nth-child(3){animation-delay:.15s}
        .detail-card:nth-child(4){animation-delay:.2s}
        .cta-pulse { animation: ctaPulse 2.5s ease-in-out infinite; }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{
        padding: 'max(env(safe-area-inset-top, 0px), 1rem) 1.25rem 1.25rem',
        borderBottom: '1px solid var(--border)',
      }}>
        {/* Nav row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', fontSize: '.9rem', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: '.3rem', padding: 0,
          }}>‹ Retour</button>
          {isDone && (
            <span style={{ background: 'rgba(16,185,129,.15)', border: '1px solid rgba(16,185,129,.3)',
              borderRadius: 99, padding: '.2rem .75rem', fontSize: '.72rem', fontWeight: 700, color: '#6EE7B7' }}>
              ✅ Effectuée
            </span>
          )}
        </div>

        {/* Type badge */}
        <span style={{
          display: 'inline-block', marginBottom: '.625rem',
          background: typeColor + '18', border: `1px solid ${typeColor}40`,
          borderRadius: 99, padding: '.2rem .75rem',
          fontSize: '.7rem', fontWeight: 800, color: typeColor,
          letterSpacing: '.08em', textTransform: 'uppercase',
        }}>{session.type || 'Séance'}</span>

        {/* Title */}
        <h2 style={{ fontSize: 'clamp(1.15rem, 4vw, 1.4rem)', lineHeight: 1.25, marginBottom: '.4rem' }}>
          {session.titre}
        </h2>

        {/* Date */}
        <p style={{ fontSize: '.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          📅 {session._dateLabel || session.jour}
        </p>

        {/* Stats chips */}
        <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
          {[
            { icon: '⏱', val: `${session.duree_min} min` },
            session.distance_km ? { icon: '📍', val: `${session.distance_km} km` } : null,
            { icon: '💪', val: `RPE ${session.rpe_cible}` },
          ].filter(Boolean).map(({ icon, val }) => (
            <div key={val} style={{
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderRadius: 99, padding: '.28rem .75rem',
              fontSize: '.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '.3rem',
            }}>
              <span>{icon}</span><span>{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ padding: '1rem 1rem 9rem', display: 'flex', flexDirection: 'column', gap: '.875rem' }}>

        {/* Programme de séance — carte principale */}
        <div className="detail-card" style={{ background: 'var(--surface)', borderRadius: 20, overflow: 'hidden', border: '1px solid var(--border)' }}>

          {/* Échauffement */}
          {session.echauffement && (
            <div style={{ borderLeft: '3px solid #F59E0B', padding: '1rem 1.125rem 1rem 1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.5rem' }}>
                <span style={{ fontWeight: 700, fontSize: '.72rem', color: '#FCD34D', letterSpacing: '.1em', textTransform: 'uppercase' }}>🔥 Échauffement</span>
                <PaceChip allure={efPace} />
              </div>
              <p style={{ fontSize: '.875rem', lineHeight: 1.65, color: 'rgba(255,255,255,.72)' }}>{session.echauffement}</p>
            </div>
          )}

          {session.echauffement && session.corps && <PhaseArrow />}

          {/* Corps — élément central */}
          {session.corps && (() => {
            const t = (session.type || '').toLowerCase()
            const isSimple = t.includes('endurance fondamentale') || t === 'ef' || t.includes('sortie longue')
            // Natation et vélo : pas d'allure en min/km
            const hidePaceChip = t.includes('natation') || t.includes('vélo') || t.includes('velo') || t.includes('brique')
            return (
              <div style={{ borderLeft: `3px solid ${typeColor}`, padding: isSimple ? '1.5rem 1.25rem' : '1.125rem 1.125rem 1.125rem 1rem', background: typeColor + '06' }}>
                {!isSimple && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.875rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '.76rem', color: typeColor, letterSpacing: '.1em', textTransform: 'uppercase' }}>⚡ Séance principale</span>
                    {!hidePaceChip && <PaceChip allure={spePace} color={typeColor} />}
                  </div>
                )}

                <MainSetVisual />
              </div>
            )
          })()}

          {session.corps && session.retour_au_calme && <PhaseArrow />}

          {/* Retour au calme */}
          {session.retour_au_calme && (
            <div style={{ borderLeft: '3px solid #3B82F6', padding: '1rem 1.125rem 1rem 1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.5rem' }}>
                <span style={{ fontWeight: 700, fontSize: '.72rem', color: '#93C5FD', letterSpacing: '.1em', textTransform: 'uppercase' }}>❄️ Retour au calme</span>
                <PaceChip allure={cooldownPace} color="#3B82F6" />
              </div>
              <p style={{ fontSize: '.875rem', lineHeight: 1.65, color: 'rgba(255,255,255,.72)' }}>{session.retour_au_calme}</p>
            </div>
          )}
        </div>

        {/* Note d'Alexis */}
        {session.notes_coach && (
          <div className="detail-card" style={{ background: 'var(--surface)', borderRadius: 20, padding: '1rem 1.125rem', border: '1px solid rgba(139,47,201,.25)' }}>
            <div style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-start' }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--gradient)', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 800, fontSize: '.875rem' }}>A</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '.75rem', marginBottom: '.4rem', color: '#C084FC', textTransform: 'uppercase', letterSpacing: '.06em' }}>Ma note</div>
                <p style={{ fontSize: '.875rem', lineHeight: 1.7, fontStyle: 'italic', color: 'rgba(255,255,255,.82)' }}>"{session.notes_coach}"</p>
              </div>
            </div>
          </div>
        )}

        {/* Données Strava */}
        {stravaAct && (
          <div className="detail-card" style={{ background: 'var(--surface)', borderRadius: 20, padding: '1rem 1.125rem', border: '1.5px solid rgba(252,76,2,.3)' }}>
            <div style={{ fontWeight: 700, marginBottom: '.75rem', color: '#FC4C02', display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.82rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>
              🔶 Données Strava
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '.5rem' }}>
              {[
                { v: fmtDistance(stravaAct.distance),    l: 'Distance' },
                { v: fmtDuration(stravaAct.moving_time), l: 'Durée' },
                { v: stravaAct.average_heartrate ? `${Math.round(stravaAct.average_heartrate)} bpm` : '—', l: 'FC moy.' },
              ].map(({ v, l }) => (
                <div key={l} style={{ textAlign: 'center', background: 'var(--surface-2)', borderRadius: 12, padding: '.625rem .5rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '.95rem' }}>{v}</div>
                  <div style={{ fontSize: '.7rem', color: 'var(--text-muted)', marginTop: '.15rem' }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Export */}
        <div className="detail-card" style={{ background: 'var(--surface)', borderRadius: 20, padding: '1.25rem', border: '1px solid var(--border)' }}>
          <div style={{ fontWeight: 700, marginBottom: '.875rem', display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.95rem' }}>
            ⬇️ <span>Envoyer vers ma montre</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>

            {/* Garmin — envoi direct si connecté, sinon .FIT */}
            {profile?.garmin_connected ? (
              <button className="btn btn-secondary"
                style={{ width: '100%', textAlign: 'left', padding: '.75rem 1rem', borderRadius: 12 }}
                disabled={exportInfo === 'garmin_sending'}
                onClick={async () => {
                  setExportInfo('garmin_sending')
                  try {
                    await api.garminSendWorkout({ userId: profile.id, session })
                    setExportInfo('garmin_sent')
                  } catch {
                    setExportInfo('garmin_error')
                  }
                }}>
                {exportInfo === 'garmin_sending'
                  ? <><div className="spinner spinner-sm" /> Envoi en cours…</>
                  : '🟦 Envoyer sur Garmin Connect'}
              </button>
            ) : (
              <button className="btn btn-secondary"
                style={{ width: '100%', textAlign: 'left', padding: '.75rem 1rem', borderRadius: 12 }}
                onClick={() => { downloadFit(session, 'garmin'); setExportInfo('garmin_fit') }}>
                🟦 Garmin Connect (.FIT)
              </button>
            )}

            <button className="btn btn-secondary"
              style={{ width: '100%', textAlign: 'left', padding: '.75rem 1rem', borderRadius: 12 }}
              onClick={() => {
                const date = new Date().toISOString().split('T')[0].replace(/-/g, '')
                const name = (session.titre || 'seance').replace(/[^a-zA-Z0-9À-ɏ]/g, '_').replace(/_+/g, '_').substring(0, 30)
                downloadFit(session, 'coros', `TUA_${name}_${date}.fit`)
                setCorosModal(true)
                setExportInfo('coros')
              }}>
              ⬛ Envoyer sur ma Coros
            </button>
            <button className="btn btn-secondary"
              style={{ width: '100%', textAlign: 'left', padding: '.75rem 1rem', borderRadius: 12 }}
              onClick={() => { downloadFit(session, 'suunto'); setExportInfo('suunto') }}>
              🔴 Suunto (.FIT)
            </button>
          </div>

          {exportInfo === 'garmin_sent' && (
            <div style={{ marginTop: '.75rem', background: 'rgba(16,185,129,.12)', border: '1px solid rgba(16,185,129,.3)', borderRadius: 12, padding: '.875rem', fontSize: '.8rem', lineHeight: 1.7 }}>
              <div style={{ fontWeight: 700, marginBottom: '.3rem', color: '#6EE7B7' }}>✅ Séance envoyée sur Garmin Connect</div>
              Elle apparaîtra sur ta montre à la prochaine synchronisation. Ouvre <strong>Garmin Connect</strong> sur ton téléphone.
            </div>
          )}
          {exportInfo === 'garmin_error' && (
            <div style={{ marginTop: '.75rem', background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 12, padding: '.875rem', fontSize: '.8rem', lineHeight: 1.7, color: '#FCA5A5' }}>
              ⚠️ L'envoi a échoué. Vérifie ta connexion Garmin dans ton profil.
            </div>
          )}
          {exportInfo === 'garmin_fit' && (
            <div style={{ marginTop: '.75rem', background: 'rgba(29,78,216,.12)', border: '1px solid rgba(29,78,216,.25)', borderRadius: 12, padding: '.875rem', fontSize: '.8rem', lineHeight: 1.7 }}>
              <div style={{ fontWeight: 700, marginBottom: '.3rem', color: '#93C5FD' }}>📲 Importer dans Garmin Connect</div>
              Ouvre <strong>Garmin Connect</strong> → <strong>Plus</strong> → <strong>Entraînements</strong> → icône <strong>⋮</strong> → <strong>Importer</strong>
            </div>
          )}
          {exportInfo === 'coros' && !corosModal && (
            <div style={{ marginTop: '.75rem', background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.25)', borderRadius: 12, padding: '.875rem', fontSize: '.8rem', lineHeight: 1.7, cursor: 'pointer' }}
              onClick={() => setCorosModal(true)}>
              <div style={{ fontWeight: 700, marginBottom: '.25rem', color: '#6EE7B7' }}>✅ Fichier téléchargé !</div>
              <span style={{ color: 'var(--text-muted)' }}>Appuie ici pour voir les instructions d'import →</span>
            </div>
          )}
          {exportInfo === 'suunto' && (
            <div style={{ marginTop: '.75rem', background: 'rgba(204,0,0,.12)', border: '1px solid rgba(204,0,0,.3)', borderRadius: 12, padding: '.875rem', fontSize: '.8rem', lineHeight: 1.7 }}>
              <div style={{ fontWeight: 700, marginBottom: '.3rem', color: '#FF8080' }}>📲 Importer dans Suunto</div>
              Ouvre l'app <strong>Suunto</strong> → <strong>Bibliothèque</strong> → <strong>Entraînements</strong> → <strong>Importer un fichier</strong>
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL COROS ── */}
      {corosModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          padding: '0 0 env(safe-area-inset-bottom)',
        }} onClick={() => setCorosModal(false)}>
          <div style={{
            width: '100%', maxWidth: 520,
            background: 'var(--surface)',
            borderRadius: '24px 24px 0 0',
            border: '1px solid var(--border)',
            padding: '1.5rem 1.25rem 2rem',
            maxHeight: '88vh', overflowY: 'auto',
          }} onClick={e => e.stopPropagation()}>

            {/* Handle */}
            <div style={{ width: 40, height: 4, background: 'rgba(255,255,255,.2)', borderRadius: 99, margin: '0 auto 1.5rem' }} />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1.5rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>⬛</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>Ta séance est prête pour ta Coros ✓</div>
                <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginTop: '.15rem' }}>Suis ces étapes pour l'importer</div>
              </div>
            </div>

            {/* Steps */}
            {[
              { n: 1, text: 'Le fichier vient de se télécharger sur ton téléphone.' },
              { n: 2, text: <>Depuis un <strong>ordinateur</strong>, connecte-toi sur <strong style={{ color: '#C084FC' }}>t.coros.com</strong></> },
              { n: 3, text: <>Clique sur <strong>Workout</strong> dans le menu, puis <strong>Import Workout</strong></> },
              { n: 4, text: <>Sélectionne le fichier <strong style={{ fontFamily: 'monospace', fontSize: '.78rem', background: 'rgba(255,255,255,.08)', padding: '.1rem .35rem', borderRadius: 4 }}>TUA_...</strong> téléchargé</> },
              { n: 5, text: <>La séance apparaîtra sur ta montre à la prochaine synchronisation via l'<strong>app Coros</strong>.</> },
            ].map(({ n, text }) => (
              <div key={n} style={{ display: 'flex', gap: '.875rem', marginBottom: '1rem', alignItems: 'flex-start' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--gradient)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '.8rem', color: '#fff' }}>{n}</div>
                <p style={{ fontSize: '.875rem', lineHeight: 1.6, paddingTop: '.3rem' }}>{text}</p>
              </div>
            ))}

            {/* Copy link button */}
            <button
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: '.5rem', marginBottom: '.875rem', justifyContent: 'center', gap: '.5rem' }}
              onClick={() => {
                navigator.clipboard?.writeText('https://t.coros.com').catch(() => {})
                setCorosCopied(true)
                setTimeout(() => setCorosCopied(false), 2500)
              }}>
              {corosCopied ? '✅ Lien copié !' : '🔗 Copier le lien t.coros.com'}
            </button>

            {/* Strava note */}
            {profile?.strava_connected ? (
              <div style={{ background: 'rgba(252,76,2,.1)', border: '1px solid rgba(252,76,2,.25)', borderRadius: 12, padding: '.875rem', fontSize: '.8rem', lineHeight: 1.6 }}>
                <span style={{ fontWeight: 700, color: '#FFA07A' }}>🔶 Strava connecté</span>
                <br />Tes données Coros (distance, FC, allure) seront <strong>importées automatiquement via Strava</strong> après ta séance.
                <br /><span style={{ color: 'var(--text-muted)' }}>Affichées dans "Données importées depuis ta Coros via Strava ✓"</span>
              </div>
            ) : (
              <div style={{ background: 'rgba(139,47,201,.1)', border: '1px solid rgba(139,47,201,.25)', borderRadius: 12, padding: '.875rem', fontSize: '.8rem', lineHeight: 1.6 }}>
                <span style={{ fontWeight: 700, color: '#C084FC' }}>💡 Astuce</span>
                <br />Connecte ton compte <strong>Strava</strong> pour que tes données Coros soient récupérées automatiquement après chaque séance.
              </div>
            )}

            <button
              className="btn btn-primary btn-full"
              style={{ marginTop: '1.25rem' }}
              onClick={() => setCorosModal(false)}>
              J'ai compris
            </button>
          </div>
        </div>
      )}

      {/* ── STICKY CTA ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        padding: '1rem 1.25rem 1.75rem',
        background: 'linear-gradient(to top, #0D0D0D 70%, transparent)',
        pointerEvents: isDone ? 'none' : 'auto',
      }}>
        {isDone ? (
          <div className="alert alert-success" style={{ textAlign: 'center', borderRadius: 18 }}>✅ Séance enregistrée !</div>
        ) : (
          <button
            className="cta-pulse"
            onClick={() => { onClose(); onStartFlow?.() }}
            style={{
              width: '100%', background: 'linear-gradient(135deg, #6B21A8, #BE185D)',
              border: 'none', borderRadius: 18, padding: '1.1rem',
              color: '#fff', fontSize: '1rem', fontWeight: 800,
              cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '.02em',
            }}>
            ✅ Marquer comme effectuée
          </button>
        )}
      </div>
    </div>
  )
}

const DAY_OFFSET = { Lundi: 0, Mardi: 1, Mercredi: 2, Jeudi: 3, Vendredi: 4, Samedi: 5, Dimanche: 6 }

// Always compute date from planMonday — never trust AI-generated dates/jour labels
function sessionDate(planMonday, weekNumber, jourName) {
  const offset = DAY_OFFSET[jourName]
  if (offset === undefined) return jourName
  const d = new Date(planMonday)
  d.setDate(d.getDate() + (weekNumber - 1) * 7 + offset)
  return `${jourName} ${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`
}

// Day order for sorting (Monday=1 … Sunday=7)
function sessionDayOrder(session) {
  return (DAY_OFFSET[session.jour] ?? 10) + 1
}

// Always compute from planMonday — never trust AI-generated weekDates
function weekDateRange(planMonday, weekNumber) {
  const start = new Date(planMonday)
  start.setDate(start.getDate() + (weekNumber - 1) * 7)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const fmt = d => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
  return `${fmt(start)} au ${fmt(end)}`
}

function WeeklyFeedbackCard({ weekNum, planId, userId, onSaved }) {
  const [rpe,       setRpe]       = useState(6)
  const [ressenti,  setRessenti]  = useState('')
  const [comment,   setComment]   = useState('')
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)

  async function submit() {
    if (!ressenti) return
    setSaving(true)
    try {
      await supabase.from('weekly_feedbacks').upsert({
        user_id: userId, plan_id: planId, week_number: weekNum,
        rpe_semaine: rpe, ressenti, commentaire: comment
      }, { onConflict: 'user_id,plan_id,week_number' })
      setSaved(true)
      onSaved?.()
    } finally {
      setSaving(false)
    }
  }

  if (saved) return (
    <div className="alert alert-success" style={{ marginTop: '1.5rem' }}>
      ✅ Bilan de semaine enregistré, je l'utilise pour adapter la suite.
    </div>
  )

  const RESSENTIS = [
    { v: 'tres_bien', l: '😄 Très bien' },
    { v: 'bien',      l: '😊 Bien' },
    { v: 'moyen',     l: '😐 Moyen' },
    { v: 'difficile', l: '😓 Difficile' },
  ]

  return (
    <div style={{ marginTop: '1.5rem', background: 'rgba(139,47,201,.1)', border: '1px solid rgba(139,47,201,.25)',
      borderRadius: 'var(--radius)', padding: '1.25rem' }}>
      <h4 style={{ marginBottom: '1rem', color: '#fff' }}>📊 Bilan de la semaine</h4>
      <div className="form-group" style={{ marginBottom: '1rem' }}>
        <label className="form-label">RPE global de la semaine : {rpe}/10</label>
        <input type="range" min={1} max={10} value={rpe} onChange={e => setRpe(parseInt(e.target.value))} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.75rem', color: 'var(--text-muted)' }}>
          <span>😴 Très facile</span><span>🔥 Très difficile</span>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '.5rem', marginBottom: '1rem' }}>
        {RESSENTIS.map(r => (
          <button key={r.v} onClick={() => setRessenti(r.v)}
            style={{
              padding: '.6rem', borderRadius: 'var(--radius)', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: '.875rem', fontWeight: 600,
              border: `2px solid ${ressenti === r.v ? 'var(--primary)' : 'var(--border)'}`,
              background: ressenti === r.v ? 'var(--primary)' : 'var(--surface)',
              color: ressenti === r.v ? '#fff' : 'var(--text)'
            }}>{r.l}</button>
        ))}
      </div>
      <div className="form-group" style={{ marginBottom: '1rem' }}>
        <label className="form-label">Commentaire libre (optionnel)</label>
        <textarea className="form-textarea" placeholder="Comment s'est passée cette semaine ?"
          value={comment} onChange={e => setComment(e.target.value)} style={{ minHeight: 70 }} />
      </div>
      <button className="btn btn-primary btn-sm btn-full" disabled={saving || !ressenti} onClick={submit}>
        {saving ? 'Enregistrement…' : '✅ Envoyer mon bilan'}
      </button>
    </div>
  )
}

export default function AthletePlan() {
  const { profile, refreshProfile } = useAuth()
  const [plan,           setPlan]          = useState(null)
  const [completions,    setCompletions]   = useState([])
  const [weekFeedbacks,  setWeekFeedbacks] = useState([])
  const [activeWeek,     setActiveWeek]    = useState(1)
  const [triTab,         setTriTab]        = useState('all') // 'all' | 'natation' | 'velo' | 'course'
  const [modal,          setModal]         = useState(null)
  const [postFlow,       setPostFlow]      = useState(null)
  const [loading,        setLoading]       = useState(true)
  const [heatModal,      setHeatModal]     = useState(false)
  const [heatLoading,    setHeatLoading]   = useState(false)
  const [heatDone,       setHeatDone]      = useState(false)
  const [heatError,      setHeatError]     = useState(null)
  const [cycleModal,     setCycleModal]    = useState(false)
  const [cycleLoading,   setCycleLoading]  = useState(false)
  const [cycleDone,      setCycleDone]     = useState(false)
  const [fatigueModal,   setFatigueModal]  = useState(false)
  const [fatigueLoading, setFatigueLoading] = useState(false)
  const [fatigueDone,    setFatigueDone]   = useState(false)
  const [injuryModal,    setInjuryModal]   = useState(false)
  const [injuryLoading,  setInjuryLoading] = useState(false)
  const [injuryDone,     setInjuryDone]    = useState(false)
  const [restoreLoading, setRestoreLoading] = useState(false)
  const [toast,          setToast]         = useState(null)

  function showToast(message, type = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4500)
  }

  useEffect(() => {
    if (!profile?.id) return
    loadPlan()
  }, [profile?.id])

  async function loadPlan() {
    setLoading(true)
    try {
      const { data: p } = await supabase
        .from('training_plans').select('*')
        .eq('user_id', profile.id).eq('status', 'active').single()
      setPlan(p)
      if (p) {
        const weeksElapsed = Math.max(1, getPlanWeeksElapsed(p))
        setActiveWeek(weeksElapsed)
        const [{ data: c }, { data: fb }] = await Promise.all([
          supabase.from('session_completions').select('*').eq('user_id', profile.id).eq('plan_id', p.id),
          supabase.from('weekly_feedbacks').select('*').eq('user_id', profile.id).eq('plan_id', p.id)
        ])
        setCompletions(c || [])
        setWeekFeedbacks(fb || [])
      }
    } finally {
      setLoading(false)
    }
  }

  function isCompleted(weekNum, sessionIdx) {
    return completions.some(c => c.week_number === weekNum && c.session_index === sessionIdx)
  }

  async function activateHeat() {
    setHeatLoading(true)
    setHeatError(null)
    try {
      const result = await api.adjustHeat({ userId: profile.id, activate: true })
      await refreshProfile()
      if (result?.planData) {
        setPlan(prev => prev ? { ...prev, plan_data: result.planData } : prev)
      } else {
        await loadPlan()
      }
      setHeatDone(true)
      setTimeout(() => { setHeatModal(false); setHeatDone(false); setHeatError(null) }, 2000)
    } catch (err) {
      console.error('[activateHeat]', err)
      setHeatError(err?.message || 'Erreur inconnue')
    } finally {
      setHeatLoading(false)
    }
  }

  // Restore heat adaptation directly via Supabase client — bypasses Render server entirely
  async function handleRestoreHeat() {
    setRestoreLoading(true)
    try {
      const { data: p, error: fetchErr } = await supabase
        .from('training_plans').select('*')
        .eq('user_id', profile.id).eq('status', 'active').single()
      if (fetchErr) throw new Error(fetchErr.message)

      if (p) {
        const updatedData = JSON.parse(JSON.stringify(p.plan_data))
        const isHeatSession = s => /🌡️|allégé|canicule/i.test(s.titre || '') || s.intensite === 'modérée — canicule'
        for (const week of updatedData.semaines || []) {
          if (week._adapted_for !== 'heat') continue
          // Only restore backup if it contains original (non-canicule) sessions
          const backupIsClean = week._original_seances && !week._original_seances.some(isHeatSession)
          if (backupIsClean) {
            week.seances = week._original_seances
            if (week._original_charge) week.charge = week._original_charge
          }
          delete week._adapted_for
          delete week._original_seances
          delete week._original_charge
        }
        const { error: updateErr } = await supabase
          .from('training_plans').update({ plan_data: updatedData }).eq('id', p.id)
        if (updateErr) throw new Error(updateErr.message)
        setPlan({ ...p, plan_data: updatedData })
      }

      // Reset heat_mode flag in profile (fire-and-forget via API, ignore errors)
      api.adjustHeat({ userId: profile.id, activate: false }).catch(() => {})
      await refreshProfile()
      showToast('Plan restauré. Retour aux séances normales ✓')
    } catch (err) {
      console.error('[RestoreHeat]', err)
      showToast((err?.message || 'Erreur lors de la restauration') + ' ✗', 'error')
    } finally {
      setRestoreLoading(false)
    }
  }

  async function handleRestoreWeek() {
    setRestoreLoading(true)
    try {
      const result = await api.restoreWeek({ userId: profile.id })
      await refreshProfile()
      if (result?.planData) {
        setPlan(prev => prev ? { ...prev, plan_data: result.planData } : prev)
      } else {
        const { data: p } = await supabase
          .from('training_plans').select('*')
          .eq('user_id', profile.id).eq('status', 'active').single()
        if (p) setPlan(p)
      }
      showToast('Plan restauré. Retour aux séances normales ✓')
    } catch (err) {
      console.error('[RestoreWeek]', err)
      showToast((err?.message || 'Erreur lors de la restauration') + ' ✗', 'error')
    } finally {
      setRestoreLoading(false)
    }
  }

  async function triggerFatigueAdapt() {
    setFatigueLoading(true)
    try {
      const result = await api.fatigueAdapt({ userId: profile.id })
      if (result?.planData) {
        setPlan(prev => prev ? { ...prev, plan_data: result.planData } : prev)
      } else {
        await loadPlan()
      }
      setFatigueDone(true)
      showToast('Semaine allégée. Repose-toi bien 😴')
      setTimeout(() => { setFatigueModal(false); setFatigueDone(false) }, 2000)
    } catch (err) {
      console.error('[FatigueAdapt]', err)
      setFatigueModal(false)
      showToast((err?.message || 'Erreur lors de l\'adaptation') + ' ✗', 'error')
    } finally {
      setFatigueLoading(false)
    }
  }

  async function triggerInjuryAdapt() {
    setInjuryLoading(true)
    try {
      const result = await api.adaptInjury({ userId: profile.id })
      if (result?.planData) {
        setPlan(prev => prev ? { ...prev, plan_data: result.planData } : prev)
      } else {
        await loadPlan()
      }
      setInjuryDone(true)
      showToast('Plan adapté pour la blessure 🩹')
      setTimeout(() => { setInjuryModal(false); setInjuryDone(false) }, 2000)
    } catch (err) {
      console.error('[InjuryAdapt]', err)
      setInjuryModal(false)
      showToast((err?.message || 'Erreur lors de l\'adaptation') + ' ✗', 'error')
    } finally {
      setInjuryLoading(false)
    }
  }

  async function triggerCycleAdapt() {
    setCycleLoading(true)
    try {
      const result = await api.periodAlert({ userId: profile.id })
      if (result?.planData) {
        setPlan(prev => prev ? { ...prev, plan_data: result.planData } : prev)
      } else {
        await loadPlan()
      }
      setCycleDone(true)
      showToast('Plan adapté pour ton cycle 🌸')
      setTimeout(() => { setCycleModal(false); setCycleDone(false) }, 2000)
    } catch (err) {
      console.error('[CycleAdapt]', err)
      setCycleModal(false)
      showToast((err?.message || 'Erreur lors de l\'adaptation') + ' ✗', 'error')
    } finally {
      setCycleLoading(false)
    }
  }

  if (loading) return <LoadingSpinner fullPage text="Chargement du plan…" />

  if (!plan) {
    return (
      <div className="page">
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
          <h3>Plan en cours de préparation</h3>
          <p className="text-muted" style={{ marginTop: '.5rem' }}>
            Je finalise ton programme personnalisé. Il sera disponible très bientôt.
          </p>
        </div>
      </div>
    )
  }

  const weeks           = plan.plan_data?.semaines || []
  const totalWeeks      = weeks.length
  const planDone        = activeWeek > totalWeeks
  const planMonday      = getPlanStartMonday(plan.activated_at || plan.created_at)
  const weeksElapsedNow = getPlanWeeksElapsed(plan)  // 0 = not started yet
  const realCurrentWeek = weeks.find(w => w.numero === weeksElapsedNow)
  // Detect adaptation from current week OR any week (for full-month adaptations before plan starts)
  const anyAdaptedWeek = realCurrentWeek || weeks.find(w => w._adapted_for)
  const adaptedFor     = anyAdaptedWeek?._adapted_for || null

  if (planDone) {
    return (
      <div className="page">
        <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🏆</div>
          <h3 style={{ marginBottom: '.75rem' }}>Plan terminé !</h3>
          <p className="text-muted" style={{ marginBottom: '1.5rem', lineHeight: 1.7, maxWidth: 380, margin: '0 auto .75rem' }}>
            Tu as terminé toutes les semaines de ton programme. Félicitations pour le travail accompli.
          </p>
          <p className="text-muted" style={{ fontSize: '.875rem', marginBottom: '2rem' }}>
            Ton coach prépare la suite. Tu seras notifié dès que le nouveau plan est disponible.
          </p>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setActiveWeek(totalWeeks)}>
            Revoir la dernière semaine
          </button>
        </div>
      </div>
    )
  }

  const currentWeekData = weeks.find(w => w.numero === activeWeek) || weeks[0]

  return (
    <div className="page">
      <style>{`@keyframes toastIn { from { opacity:0; transform:translateX(-50%) translateY(12px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`}</style>
      {toast && (
        <div style={{
          position: 'fixed', bottom: '5.5rem', left: '50%', transform: 'translateX(-50%)',
          background: toast.type === 'success' ? 'rgba(16,185,129,.95)' : 'rgba(239,68,68,.95)',
          color: '#fff', borderRadius: 99, padding: '.75rem 1.5rem',
          fontWeight: 600, fontSize: '.875rem', zIndex: 500,
          boxShadow: '0 4px 24px rgba(0,0,0,.35)',
          animation: 'toastIn .3s ease',
          whiteSpace: 'nowrap', maxWidth: '90vw', textAlign: 'center',
        }}>
          {toast.message}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '.5rem' }}>
        <h2 className="page-heading" style={{ margin: 0 }}>Mon plan</h2>
        <div style={{ display: 'flex', gap: '.35rem', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {(profile?.gender === 'female' || profile?.period_pain) && (
            <button
              onClick={adaptedFor === 'cycle' ? handleRestoreWeek : () => setCycleModal(true)}
              disabled={restoreLoading || (adaptedFor !== null && adaptedFor !== 'cycle')}
              style={{
                padding: '.38rem .7rem', borderRadius: 99,
                border: adaptedFor === 'cycle' ? '1.5px solid rgba(236,72,153,.8)' : '1.5px solid rgba(236,72,153,.5)',
                background: adaptedFor === 'cycle' ? 'rgba(236,72,153,.25)' : 'rgba(236,72,153,.12)',
                color: '#F472B6', fontSize: '.72rem', fontWeight: 700,
                cursor: (restoreLoading || (adaptedFor !== null && adaptedFor !== 'cycle')) ? 'default' : 'pointer',
                fontFamily: 'inherit', whiteSpace: 'nowrap', opacity: (adaptedFor !== null && adaptedFor !== 'cycle') ? .4 : 1,
              }}>
              {adaptedFor === 'cycle' ? '🌸 ✓' : '🌸 Cycle'}
            </button>
          )}
          <button
            onClick={adaptedFor === 'fatigue' ? handleRestoreWeek : () => setFatigueModal(true)}
            disabled={fatigueLoading || restoreLoading || (adaptedFor !== null && adaptedFor !== 'fatigue')}
            style={{
              padding: '.38rem .7rem', borderRadius: 99,
              border: adaptedFor === 'fatigue' ? '1.5px solid rgba(99,102,241,.8)' : '1.5px solid rgba(99,102,241,.5)',
              background: adaptedFor === 'fatigue' ? 'rgba(99,102,241,.25)' : 'rgba(99,102,241,.1)',
              color: adaptedFor === 'fatigue' ? '#A5B4FC' : '#818CF8',
              fontSize: '.72rem', fontWeight: 700,
              cursor: (fatigueLoading || restoreLoading || (adaptedFor !== null && adaptedFor !== 'fatigue')) ? 'default' : 'pointer',
              fontFamily: 'inherit', whiteSpace: 'nowrap', opacity: (adaptedFor !== null && adaptedFor !== 'fatigue') ? .4 : 1,
            }}>
            {(fatigueLoading || (restoreLoading && adaptedFor === 'fatigue')) ? '…' : adaptedFor === 'fatigue' ? '😴 ✓' : '😴 Fatigue'}
          </button>
          <button
            onClick={adaptedFor === 'injury' ? handleRestoreWeek : () => setInjuryModal(true)}
            disabled={injuryLoading || restoreLoading || (adaptedFor !== null && adaptedFor !== 'injury')}
            style={{
              padding: '.38rem .7rem', borderRadius: 99,
              border: adaptedFor === 'injury' ? '1.5px solid rgba(251,146,60,.8)' : '1.5px solid rgba(251,146,60,.5)',
              background: adaptedFor === 'injury' ? 'rgba(251,146,60,.25)' : 'rgba(251,146,60,.1)',
              color: adaptedFor === 'injury' ? '#FED7AA' : '#FB923C',
              fontSize: '.72rem', fontWeight: 700,
              cursor: (injuryLoading || restoreLoading || (adaptedFor !== null && adaptedFor !== 'injury')) ? 'default' : 'pointer',
              fontFamily: 'inherit', whiteSpace: 'nowrap', opacity: (adaptedFor !== null && adaptedFor !== 'injury') ? .4 : 1,
            }}>
            {(injuryLoading || (restoreLoading && adaptedFor === 'injury')) ? '…' : adaptedFor === 'injury' ? '🩹 ✓' : '🩹 Blessure'}
          </button>
          <button
            onClick={adaptedFor === 'heat' ? handleRestoreHeat : () => setHeatModal(true)}
            disabled={heatLoading || restoreLoading || (adaptedFor !== null && adaptedFor !== 'heat')}
            style={{
              padding: '.38rem .7rem', borderRadius: 99,
              border: '1.5px solid #CA8A04',
              background: adaptedFor === 'heat' ? 'rgba(234,179,8,.25)' : 'rgba(234,179,8,.1)',
              color: adaptedFor === 'heat' ? '#FDE047' : '#EAB308',
              fontSize: '.72rem', fontWeight: 700,
              cursor: (heatLoading || restoreLoading || (adaptedFor !== null && adaptedFor !== 'heat')) ? 'default' : 'pointer',
              fontFamily: 'inherit', whiteSpace: 'nowrap',
              opacity: (adaptedFor !== null && adaptedFor !== 'heat') ? .4 : 1,
            }}>
            {(heatLoading || (restoreLoading && adaptedFor === 'heat')) ? '…' : adaptedFor === 'heat' ? '🌡️ ✓' : '🌡️ Canicule'}
          </button>
        </div>
      </div>

      {/* Week selector */}
      <div style={{ display: 'flex', gap: '.5rem', overflowX: 'auto', paddingBottom: '.5rem', marginBottom: '1.5rem' }}>
        {weeks.map(w => {
          const doneInWeek  = completions.filter(c => c.week_number === w.numero).length
          const totalInWeek = w.seances?.length || 0
          const pct         = totalInWeek > 0 ? doneInWeek / totalInWeek : 0
          const isActive    = activeWeek === w.numero
          return (
            <button key={w.numero}
              onClick={() => setActiveWeek(w.numero)}
              style={{
                flexShrink: 0, padding: '.5rem .875rem',
                borderRadius: 99, border: `2px solid ${isActive ? 'var(--primary)' : 'var(--border)'}`,
                background: isActive ? 'linear-gradient(135deg,rgba(139,47,201,.35),rgba(232,35,122,.25))' : 'var(--surface)',
                color: isActive ? '#fff' : 'var(--text-muted)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '.78rem', cursor: 'pointer', fontFamily: 'inherit',
                whiteSpace: 'nowrap',
              }}>
              {weekDateRange(planMonday, w.numero)}{pct === 1 ? ' ✅' : ''}
            </button>
          )
        })}
      </div>

      {/* Current week header */}
      {currentWeekData && (() => {
        const seances = currentWeekData.seances || []
        const isTri = ['tri_sprint','tri_olympic','tri_half','tri_ironman'].includes(profile?.objective)
        const nat   = seances.filter(s => String(s.type||'').toLowerCase().includes('natation')).length
        const vel   = seances.filter(s => String(s.type||'').toLowerCase().includes('vélo') || String(s.type||'').toLowerCase().includes('velo')).length
        const brk   = seances.filter(s => String(s.type||'').toLowerCase().includes('brique') || (s.id_seance||'').startsWith('BRK')).length
        const renfo = seances.filter(s => String(s.type||'').toLowerCase().includes('renforcement') || (s.id_seance||'').startsWith('RENFO')).length
        const course= seances.filter(s => {
          const t = String(s.type||'').toLowerCase()
          return !t.includes('natation') && !t.includes('vélo') && !t.includes('velo') && !t.includes('brique') && !t.includes('renforcement') && !s.est_course
        }).length
        const km = currentWeekData.volume_total_km
        const phase = (currentWeekData.phase || '').replace(/^S\d+\s*[—–-]\s*/i, '').replace(/\s*\(S\d+\)/gi, '')
        const chargeRaw = (currentWeekData.charge || '').replace(/\s*\(S\d+\)/gi, '')
        const chargeShort = chargeRaw.split(/[—–(]/)[0].trim()
        const chargeSub = chargeRaw.includes('(') ? chargeRaw.slice(chargeRaw.indexOf('(')) : null
        const chargeColor = chargeShort.toLowerCase().includes('élevée') ? '#F97316'
          : chargeShort.toLowerCase().includes('modérée') ? '#06B6D4'
          : chargeShort.toLowerCase().includes('affûtage') ? '#8B2FC9'
          : chargeShort.toLowerCase().includes('récup') ? '#6B7280'
          : '#10B981'

        const chips = [
          { cond: course > 0, count: course, icon: '🏃', label: 'course',  color: '#10B981' },
          { cond: nat    > 0, count: nat,    icon: '🏊', label: 'nage',    color: '#06B6D4' },
          { cond: vel    > 0, count: vel,    icon: '🚴', label: 'vélo',    color: '#F97316' },
          { cond: brk    > 0, count: brk,    icon: '🔗', label: 'brique',  color: '#8B5CF6' },
          { cond: renfo  > 0, count: renfo,  icon: '💪', label: 'renfo',   color: '#EC4899' },
        ].filter(d => d.cond)

        return (
          <div style={{ marginBottom: '1.25rem', borderRadius: 18, overflow: 'hidden', background: 'linear-gradient(135deg,#1A1A2E,#2D1B4E)', color: '#fff' }}>
            {/* Header row */}
            <div style={{ padding: '1rem 1.25rem .75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'rgba(255,255,255,.38)', marginBottom: '.25rem' }}>
                  Semaine {currentWeekData.numero} · {weekDateRange(planMonday, currentWeekData.numero)}
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', lineHeight: 1.2 }}>{phase}</div>
                {chargeSub && <div style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.35)', marginTop: '.2rem' }}>{chargeSub}</div>}
              </div>
              <span style={{ flexShrink: 0, padding: '.22rem .75rem', borderRadius: 99, fontSize: '.7rem', fontWeight: 700,
                background: chargeColor + '25', border: `1px solid ${chargeColor}50`, color: chargeColor }}>
                {chargeShort}
              </span>
            </div>

            {/* Discipline chips */}
            <div style={{ padding: '.5rem 1.25rem .625rem', display: 'flex', flexWrap: 'wrap', gap: '.45rem',
              borderTop: '1px solid rgba(255,255,255,.06)', alignItems: 'center' }}>
              {chips.map(d => (
                <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: '.3rem',
                  background: d.color + '18', border: `1px solid ${d.color}35`, borderRadius: 99,
                  padding: '.22rem .65rem' }}>
                  <span style={{ fontSize: '.82rem' }}>{d.icon}</span>
                  <span style={{ fontWeight: 800, fontSize: '.85rem', color: d.color }}>{d.count}</span>
                  <span style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.38)' }}>{d.label}</span>
                </div>
              ))}
              {km > 0 && (
                <span style={{ marginLeft: 'auto', fontSize: '.75rem', color: 'rgba(255,255,255,.45)' }}>
                  📍 <strong style={{ color: '#fff', fontWeight: 700 }}>{km} km</strong>
                </span>
              )}
            </div>
          </div>
        )
      })()}

      {/* Triathlon discipline tabs */}
      {['tri_sprint','tri_olympic','tri_half','tri_ironman'].includes(profile?.objective) && (
        <div style={{ display: 'flex', gap: '.4rem', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '.25rem' }}>
          {[
            { v: 'all',      l: '🗓 Semaine',  color: '#8B2FC9' },
            { v: 'natation', l: '🏊 Natation', color: '#06B6D4' },
            { v: 'velo',     l: '🚴 Vélo',     color: '#F97316' },
            { v: 'brique',   l: '🔗 Brique',   color: '#8B5CF6' },
            { v: 'course',   l: '🏃 Course',   color: '#10B981' },
            { v: 'renfo',    l: '💪 Renfo',    color: '#EC4899' },
          ].map(t => (
            <button key={t.v} onClick={() => setTriTab(t.v)} style={{
              padding: '.35rem .85rem', borderRadius: 99, fontWeight: 600, fontSize: '.8rem',
              border: triTab === t.v ? `2px solid ${t.color}` : '1px solid rgba(255,255,255,.15)',
              background: triTab === t.v ? t.color + '30' : 'rgba(255,255,255,.05)',
              color: triTab === t.v ? '#fff' : 'rgba(255,255,255,.6)',
              cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0,
            }}>{t.l}</button>
          ))}
        </div>
      )}

      {/* Sessions — desktop: 7-day grid / mobile: vertical list */}
      <style>{`
        @media (min-width: 900px) {
          .plan-day-grid { display: grid !important; grid-template-columns: repeat(7,1fr) !important; gap: .6rem !important; align-items: start !important; }
          .plan-day-headers { display: grid !important; }
        }
        .plan-day-headers { display: none; grid-template-columns: repeat(7,1fr); gap: .6rem; margin-bottom: .5rem; }
      `}</style>
      <div className="plan-day-headers">
        {['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(d => (
          <div key={d} style={{ textAlign:'center', fontSize:'.66rem', fontWeight:800, textTransform:'uppercase',
            letterSpacing:'.08em', color:'var(--text-muted)', paddingBottom:'.4rem', borderBottom:'1px solid var(--border)' }}>{d}</div>
        ))}
      </div>

      <div className="plan-day-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {(currentWeekData?.seances || [])
          .map((s, origIdx) => ({ ...s, _origIdx: origIdx }))
          .sort((a, b) => sessionDayOrder(a) - sessionDayOrder(b))
          .filter(session => {
            if (triTab === 'all') return true;
            const t = (session.type || '').toLowerCase();
            const isRenfo = t.includes('renforcement') || (session.id_seance || '').startsWith('RENFO');
            const isBrk = t.includes('brique') || (session.id_seance || '').startsWith('BRK');
            if (triTab === 'natation') return t.includes('natation');
            if (triTab === 'velo')     return t.includes('vélo') || t.includes('velo');
            if (triTab === 'brique')   return isBrk;
            if (triTab === 'renfo')    return isRenfo;
            if (triTab === 'course')   return !t.includes('natation') && !t.includes('vélo') && !t.includes('velo') && !isBrk && !isRenfo;
            return true;
          })
          .map((session) => {
          const DAY_COL = { Lundi:1, Mardi:2, Mercredi:3, Jeudi:4, Vendredi:5, Samedi:6, Dimanche:7 }
          const idx   = session._origIdx
          const done  = isCompleted(currentWeekData.numero, idx)
          const isRace = session.est_course || session.id_seance === 'RACE' || session.id_seance === 'RACE_INT'
          const isBrique = (session.type || '').toLowerCase().includes('brique')
          const color = SESSION_TYPE_COLORS[session.type] || 'var(--primary)'

          // ── Brick session card ──────────────────────────────────────────────
          if (isBrique && !isRace) {
            const bColor = '#8B5CF6'
            const dateLabel = sessionDate(planMonday, currentWeekData.numero, session.jour)
            const parts = (session.corps || '').split(/BLOC\s+/i).filter(Boolean)
            return (
              <div key={idx} style={{
                borderRadius: 'var(--radius)',
                border: `2px solid ${done ? 'var(--success)' : bColor}`,
                background: `linear-gradient(135deg, ${bColor}10, ${bColor}06)`,
                padding: '1rem 1.25rem', cursor: 'pointer',
                opacity: done ? .75 : 1,
              }} onClick={() => setModal({ session: { ...session, _isDone: done, _dateLabel: dateLabel }, weekNum: currentWeekData.numero, sessionIdx: idx })}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.5rem' }}>
                  <span style={{ fontSize: '.75rem', fontWeight: 700, color: bColor, background: bColor+'25', padding: '.15rem .6rem', borderRadius: 99 }}>
                    🔗 Brique
                  </span>
                  {done && <span className="badge badge-success">✅ Effectuée</span>}
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '.2rem' }}>{session.titre}</div>
                <div style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginBottom: '.75rem' }}>
                  {dateLabel} · {session.duree_min} min
                </div>
                <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                  {parts.slice(0, 3).map((part, i) => {
                    const firstLine = part.split('\n')[0].trim()
                    const isBikeBloc = /vélo|velo|bike/i.test(firstLine)
                    const isRunBloc  = /course|run|footing/i.test(firstLine)
                    const isNatBloc  = /nage|natation|swim/i.test(firstLine)
                    const bloColor   = isBikeBloc ? '#F97316' : isRunBloc ? '#10B981' : isNatBloc ? '#06B6D4' : bColor
                    return (
                      <div key={i} style={{ background: bloColor+'18', border: `1px solid ${bloColor}35`, borderRadius: 8, padding: '.3rem .7rem', fontSize: '.75rem', fontWeight: 600, color: bloColor }}>
                        {firstLine.replace(/\n.*/, '')}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          }

          // ── Special race card ──────────────────────────────────────────────
          if (isRace) {
            const raceColor = session.type === 'Course intermédiaire' ? '#FB923C' : '#FFD700'
            const dateLabel = sessionDate(planMonday, currentWeekData.numero, session.jour)
            return (
              <div key={idx} style={{
                borderRadius: 'var(--radius)',
                border: `2px solid ${raceColor}`,
                background: `linear-gradient(135deg, ${raceColor}18, ${raceColor}08)`,
                padding: '1rem 1.25rem',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', top: 0, right: 0, bottom: 0, width: 4,
                  background: raceColor, opacity: .6,
                }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.5rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>🏁</span>
                  <span style={{ fontSize: '.75rem', fontWeight: 700, color: raceColor,
                    background: raceColor + '25', padding: '.15rem .6rem', borderRadius: 99 }}>
                    {session.type}
                  </span>
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '.25rem', color: raceColor }}>
                  {session.titre}
                </div>
                <div style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginBottom: '.75rem' }}>{dateLabel}</div>
                {session.corps && (
                  <div style={{ fontSize: '.875rem', lineHeight: 1.6, color: 'var(--text)', fontStyle: 'italic',
                    borderTop: `1px solid ${raceColor}30`, paddingTop: '.6rem' }}>
                    {session.corps}
                  </div>
                )}
                {session.notes_coach && (
                  <div style={{ marginTop: '.5rem', fontSize: '.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    💬 {session.notes_coach}
                  </div>
                )}
              </div>
            )
          }

          const isRenfo = (session.type || '').toLowerCase().includes('renforcement') || (session.id_seance || '').startsWith('RENFO')
          const cardBorderStyle = isRenfo
            ? { border: `2px solid ${done ? 'var(--success)' : color}`, background: done ? undefined : color + '0A' }
            : { borderLeft: `4px solid ${done ? 'var(--success)' : color}` }
          const dayGridCol = DAY_COL[session.jour] || 'auto'

          return (
            <div key={idx} className="card"
              style={{
                ...cardBorderStyle,
                opacity: done ? .75 : 1, cursor: 'pointer',
                transition: 'transform .15s, box-shadow .15s',
                gridColumn: dayGridCol,
              }}
              onClick={() => setModal({ session: { ...session, _isDone: done, _dateLabel: sessionDate(planMonday, currentWeekData.numero, session.jour) }, weekNum: currentWeekData.numero, sessionIdx: idx })}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.3rem' }}>
                    <span style={{ fontSize: '.75rem', fontWeight: 600, color, background: color + '18', padding: '.15rem .5rem', borderRadius: 99 }}>
                      {session.type}
                    </span>
                    {done && <span className="badge badge-success">✅ Effectué</span>}
                  </div>
                  <h4 style={{ marginBottom: '.2rem' }}>{session.titre}</h4>
                  <div style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>
                    {sessionDate(planMonday, currentWeekData.numero, session.jour)} · {session.duree_min} min
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '.4rem', flexShrink: 0 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>RPE cible</div>
                    <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{session.rpe_cible}/10</div>
                  </div>
                  <ExportBtn
                    session={session}
                    suuntoConnected={profile?.suunto_connected}
                    garminConnected={profile?.garmin_connected}
                    userId={profile?.id}
                  />
                </div>
              </div>
              {session.notes_coach && (
                <p style={{ marginTop: '.6rem', fontSize: '.8rem', color: 'var(--text-muted)', fontStyle: 'italic',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  💬 "{session.notes_coach}"
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Weekly feedback, appears when all sessions of active week are done */}
      {(() => {
        if (!currentWeekData) return null
        const total = currentWeekData.seances?.length || 0
        const done = completions.filter(c => c.week_number === currentWeekData.numero).length
        const hasFeedback = weekFeedbacks.some(f => f.week_number === currentWeekData.numero)
        if (total > 0 && done === total && !hasFeedback) {
          return (
            <WeeklyFeedbackCard
              weekNum={currentWeekData.numero}
              planId={plan.id}
              userId={profile.id}
              onSaved={loadPlan}
            />
          )
        }
        return null
      })()}

      {modal && (
        <SessionDetailPage
          session={modal.session}
          weekNum={modal.weekNum}
          sessionIdx={modal.sessionIdx}
          planId={plan.id}
          vma={profile?.vma}
          onClose={() => setModal(null)}
          onDone={() => { setModal(null); loadPlan() }}
          onStartFlow={() => setPostFlow({
            session:         modal.session,
            weekNum:         modal.weekNum,
            sessionIdx:      modal.sessionIdx,
            weekSessions:    currentWeekData?.seances || [],
            weekCompletions: completions.filter(c => c.week_number === modal.weekNum),
          })}
        />
      )}


      {postFlow && (
        <PostSessionFlow
          session={postFlow.session}
          weekNum={postFlow.weekNum}
          sessionIdx={postFlow.sessionIdx}
          planId={plan.id}
          weekSessions={postFlow.weekSessions}
          weekCompletions={postFlow.weekCompletions}
          onClose={() => setPostFlow(null)}
          onDone={() => { loadPlan() }}
        />
      )}

      {heatModal && (
        <div className="modal-overlay center" onClick={e => e.target === e.currentTarget && !heatLoading && setHeatModal(false)}>
          <div className="modal center-modal" style={{ maxWidth: 380 }}>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>🌡️</div>
              <h3 style={{ marginBottom: '.5rem' }}>Mode Canicule</h3>
              <p style={{ fontSize: '.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Ta semaine va être allégée. Tous tes footings seront à allure tranquille. Tu peux réduire l'allure si tu en ressens le besoin, l'essentiel est de bouger en douceur. Quand la chaleur redescend, reclique sur le bouton pour revenir au plan normal.
              </p>
            </div>
            {heatDone ? (
              <div style={{ textAlign: 'center', color: '#FDE047', fontWeight: 700, padding: '.75rem' }}>
                ✅ Plan allégé. Prends soin de toi 🌡️
              </div>
            ) : (
              <>
                {heatError && (
                  <div style={{ background: '#1f1010', border: '1px solid #ef4444', borderRadius: 8, padding: '.625rem .875rem', marginBottom: '.75rem', fontSize: '.8rem', color: '#fca5a5', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    Erreur : {heatError}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '.75rem' }}>
                  <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { setHeatModal(false); setHeatError(null) }} disabled={heatLoading}>
                    Annuler
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1, background: 'linear-gradient(135deg,#CA8A04,#A16207)', border: 'none' }}
                    disabled={heatLoading}
                    onClick={activateHeat}>
                    {heatLoading ? '…' : heatError ? 'Réessayer 🌡️' : 'Activer 🌡️'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {fatigueModal && (
        <div className="modal-overlay center" onClick={e => e.target === e.currentTarget && !fatigueLoading && setFatigueModal(false)}>
          <div className="modal center-modal" style={{ maxWidth: 380 }}>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>😴</div>
              <h3 style={{ marginBottom: '.5rem' }}>Semaine Fatigue</h3>
              <p style={{ fontSize: '.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Ta séance intense de la semaine est remplacée par un footing léger, et les autres séances sont réduites. Tu récupères, tu reprends normal la semaine prochaine.
              </p>
            </div>
            {fatigueDone ? (
              <div style={{ textAlign: 'center', color: '#A5B4FC', fontWeight: 700, padding: '.75rem' }}>
                ✅ Semaine allégée. Repose-toi bien 😴
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '.75rem' }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setFatigueModal(false)} disabled={fatigueLoading}>Annuler</button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, background: 'linear-gradient(135deg,#4F46E5,#7C3AED)', border: 'none' }}
                  disabled={fatigueLoading}
                  onClick={triggerFatigueAdapt}>
                  {fatigueLoading ? '…' : 'Alléger 😴'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {injuryModal && (
        <div className="modal-overlay center" onClick={e => e.target === e.currentTarget && !injuryLoading && setInjuryModal(false)}>
          <div className="modal center-modal" style={{ maxWidth: 380 }}>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>🩹</div>
              <h3 style={{ marginBottom: '.5rem' }}>Plan Blessure</h3>
              <p style={{ fontSize: '.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Toutes tes séances sont adaptées en récupération douce sur tout le plan. Dès que tu te sens prêt(e), reclique sur le bouton pour revenir au programme normal.
              </p>
            </div>
            {injuryDone ? (
              <div style={{ textAlign: 'center', color: '#FED7AA', fontWeight: 700, padding: '.75rem' }}>
                ✅ Plan adapté. Prends soin de toi 🩹
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '.75rem' }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setInjuryModal(false)} disabled={injuryLoading}>Annuler</button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, background: 'linear-gradient(135deg,#EA580C,#C2410C)', border: 'none' }}
                  disabled={injuryLoading}
                  onClick={triggerInjuryAdapt}>
                  {injuryLoading ? '…' : 'Adapter 🩹'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {cycleModal && (
        <div className="modal-overlay center" onClick={e => e.target === e.currentTarget && setCycleModal(false)}>
          <div className="modal center-modal" style={{ maxWidth: 380 }}>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>🌸</div>
              <h3 style={{ marginBottom: '.5rem' }}>Adapter mon plan</h3>
              <p style={{ fontSize: '.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Les séances intenses de cette semaine vont être remplacées par des footings légers de récupération. Tu reprends normalement dès que tu te sens prête.
              </p>
            </div>
            {cycleDone ? (
              <div style={{ textAlign: 'center', color: '#F472B6', fontWeight: 700, padding: '.75rem' }}>
                ✅ Plan adapté. Prends soin de toi 🌸
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '.75rem' }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setCycleModal(false)}>
                  Annuler
                </button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, background: 'linear-gradient(135deg,#BE185D,#9D174D)', border: 'none' }}
                  disabled={cycleLoading}
                  onClick={triggerCycleAdapt}>
                  {cycleLoading ? '…' : 'Adapter'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
