import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { SESSION_TYPE_COLORS } from '../../lib/utils'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const DAY_NAMES = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

const SPORT_OPTS = [
  { value: 'all',      label: 'Tous',      color: 'var(--text-muted)' },
  { value: 'running',  label: '🏃 Course',  color: '#10B981' },
  { value: 'trail',    label: '⛰️ Trail',   color: '#22C55E' },
  { value: 'natation', label: '🏊 Natation', color: '#06B6D4' },
  { value: 'velo',     label: '🚴 Vélo',    color: '#F97316' },
  { value: 'brique',   label: '🟣 Brique',  color: '#8B5CF6' },
]

const SPORT_BASE_COLORS = {
  running:  '#10B981',
  trail:    '#22C55E',
  natation: '#06B6D4',
  velo:     '#F97316',
  brique:   '#8B5CF6',
}

// session_library.type est en snake_case interne — on le traduit vers le libellé
// français utilisé partout ailleurs (couleurs, affichage athlète, génération IA).
const SESSION_TYPE_LABELS = {
  endurance_fondamentale: 'Endurance fondamentale',
  footing_progressif:     'Footing progressif',
  footing_recuperation:   'Récupération active',
  sortie_longue:          'Sortie longue',
  fractionne_court:       'Fractionné court',
  fractionne_long:        'Fractionné long',
  tempo_seuil:            'Tempo / Seuil',
  cotes:                  'Côtes',
  specifique:             'Spécifique',
  renforcement:           'Renforcement',
  natation:               'Natation',
  velo:                   'Vélo',
  brique:                 'Brique',
  trail:                  'Trail endurance',
}

function sessionColor(s) {
  const label = SESSION_TYPE_LABELS[s.type] || s.type
  return SESSION_TYPE_COLORS[label] || SPORT_BASE_COLORS[s.sport] || '#8B2FC9'
}

// Allure = vitesse*fraction VMA → min'sec/km. Même formule que server/routes/anthropic.js (calcPace).
function calcPace(vma, fraction) {
  const speed   = vma * fraction
  const paceMin = 60 / speed
  const m = Math.floor(paceMin)
  const s = Math.round((paceMin - m) * 60)
  return `${m}'${String(s).padStart(2, '0')}`
}

// Remplace "X-Y% VMA" / "X% VMA" par l'allure calculée, comme subsPaces() côté serveur.
function subsPaces(text, vma) {
  if (!text || !vma) return text || ''
  return text.replace(/(\d{2,3})-(\d{2,3})%\s*VMA|(\d{2,3})%\s*VMA/g, (match, lo, hi, single) => {
    if (lo && hi) return `${calcPace(vma, lo / 100)}/km – ${calcPace(vma, hi / 100)}/km (${lo}-${hi}% VMA)`
    return `${calcPace(vma, single / 100)}/km (${single}% VMA)`
  })
}

// Construit un tableau d'allures structuré à partir des % VMA trouvés dans les champs texte
// d'une séance de la bibliothèque (échauffement/corps/récupération/retour au calme).
function buildAllures(libSession, vma) {
  if (!vma) return []
  const zones = []
  const re = /(\d{2,3})-(\d{2,3})%\s*VMA|(\d{2,3})%\s*VMA/g
  const pushFromText = (text, label) => {
    if (!text) return
    let m
    re.lastIndex = 0
    while ((m = re.exec(text))) {
      const [, lo, hi, single] = m
      if (lo && hi) {
        zones.push({ zone: `${label} min`, vitesse_kmh: Math.round(vma * lo / 100 * 100) / 100, allure_min_km: `${calcPace(vma, lo / 100)}/km`, pourcentage_vma: Number(lo) })
        zones.push({ zone: `${label} max`, vitesse_kmh: Math.round(vma * hi / 100 * 100) / 100, allure_min_km: `${calcPace(vma, hi / 100)}/km`, pourcentage_vma: Number(hi) })
      } else if (single) {
        zones.push({ zone: label, vitesse_kmh: Math.round(vma * single / 100 * 100) / 100, allure_min_km: `${calcPace(vma, single / 100)}/km`, pourcentage_vma: Number(single) })
      }
    }
  }
  pushFromText(libSession.warmup, 'Échauffement')
  pushFromText(libSession.main_set, 'Corps')
  pushFromText(libSession.recovery, 'Récupération')
  pushFromText(libSession.cooldown, 'Retour au calme')
  return zones
}

// Toutes les dates sont manipulées en UTC pur (jamais setHours/local) pour éviter
// le décalage d'un jour au moment du toISOString() côté fuseaux horaires UTC+.
function nextMonday() {
  const now = new Date()
  const d   = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
  const dow = d.getUTCDay() // 0=dim 1=lun … 6=sam
  if (dow !== 1) {
    const toMonday = dow === 0 ? 1 : 8 - dow
    d.setUTCDate(d.getUTCDate() + toMonday)
  }
  return d
}

function addDays(date, n) {
  const d = new Date(date)
  d.setUTCDate(d.getUTCDate() + n)
  return d
}

// Parse une date 'YYYY-MM-DD' en minuit UTC — jamais via setHours (dépend du fuseau local).
function parseDateOnly(dateStr) {
  return new Date(dateStr + 'T00:00:00Z')
}

function fmtDay(date) {
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' })
}

function fmtWeekRange(monday) {
  return `${fmtDay(monday)} – ${fmtDay(addDays(monday, 6))}`
}

function planDataToGrid(plan_data) {
  const grid = Array.from({ length: 4 }, () => Array.from({ length: 7 }, () => []))
  ;(plan_data?.semaines || []).forEach((sem, wi) => {
    if (wi >= 4) return
    ;(sem.seances || []).forEach(s => {
      const di = DAY_NAMES.indexOf(s.jour)
      if (di < 0) return
      grid[wi][di].push({
        code:            s.id_seance || s.titre,
        titre:           s.titre,
        type:            s.type,
        sport:           s.sport || 'running',
        corps:           s.corps || '',
        echauffement:    s.echauffement || '',
        retour_au_calme: s.retour_au_calme || '',
        notes_coach:     s.notes_coach || '',
        duree_min:       s.duree_min || null,
        // Champs riches préservés tels quels : sinon toute édition d'une séance de la
        // semaine efface les allures/distance/intensité déjà calculées des autres séances.
        distance_km:     s.distance_km ?? null,
        intensite:       s.intensite ?? '',
        rpe_cible:       s.rpe_cible ?? null,
        allures:         s.allures ?? [],
        recuperation:    s.recuperation ?? null,
        est_seance_cle:  s.est_seance_cle ?? false,
        _uid:            Date.now() + Math.random(),
      })
    })
  })
  return grid
}

export default function ManualPlanBuilder() {
  const navigate       = useNavigate()
  const [searchParams] = useSearchParams()

  const [athletes,        setAthletes]        = useState([])
  const [selectedAthlete, setSelectedAthlete] = useState(searchParams.get('userId') || '')
  const [athletePlans,    setAthletePlans]    = useState([])
  const [loadedPlanId,    setLoadedPlanId]    = useState(null)

  const [sessions,        setSessions]        = useState([])
  const [search,          setSearch]          = useState('')
  const [sportFilter,     setSportFilter]     = useState('all')
  const [loadingSessions, setLoadingSessions] = useState(true)

  const [startMonday, setStartMonday] = useState(() => nextMonday())
  const [plan,        setPlan]        = useState(() => Array.from({ length: 4 }, () => Array.from({ length: 7 }, () => [])))

  const [dragging,   setDragging]   = useState(null)
  const [dragOver,   setDragOver]   = useState(null)
  const [savingPlan, setSavingPlan] = useState(false)
  const [savedMsg,   setSavedMsg]   = useState('')

  // Chargement initial : tous les athlètes + sessions
  useEffect(() => {
    supabase.from('profiles').select('*')
      .eq('role', 'athlete').order('first_name')
      .then(({ data, error }) => {
        if (error) console.error('[ManualPlanBuilder] athletes:', error)
        setAthletes(data || [])
      })

    supabase.from('session_library').select('*').order('code')
      .then(({ data }) => { setSessions(data || []); setLoadingSessions(false) })
  }, [])

  // Quand l'athlète change : charger ses plans existants
  useEffect(() => {
    if (!selectedAthlete) { setAthletePlans([]); return }
    supabase.from('training_plans')
      .select('id, status, created_at, plan_data')
      .eq('user_id', selectedAthlete)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setAthletePlans(data || [])
        // Si un planId est passé en URL et qu'on vient de charger l'athlète correspondant
        const urlPlanId = searchParams.get('planId')
        if (urlPlanId && data?.length) {
          const found = data.find(p => p.id === urlPlanId)
          if (found) {
            setLoadedPlanId(found.id)
            setPlan(planDataToGrid(found.plan_data))
            const firstDate = found.plan_data?.semaines?.[0]?.date_debut
            if (firstDate) setStartMonday(parseDateOnly(firstDate))
          }
        }
      })
  }, [selectedAthlete])

  const athlete = athletes.find(a => a.id === selectedAthlete)

  const filteredSessions = sessions.filter(s => {
    if (sportFilter !== 'all' && (s.sport || 'running') !== sportFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return s.code?.toLowerCase().includes(q) || s.name?.toLowerCase().includes(q)
    }
    return true
  })

  // ── Charger un plan existant dans le calendrier ──────────────
  function loadPlan(planId) {
    const found = athletePlans.find(p => p.id === planId)
    if (!found) return
    setLoadedPlanId(planId)
    const grid = planDataToGrid(found.plan_data)
    setPlan(grid)
    // Essaie d'utiliser la vraie date de début du plan
    const firstDateStr = found.plan_data?.semaines?.[0]?.date_debut
    if (firstDateStr) setStartMonday(parseDateOnly(firstDateStr))
  }

  function newPlan() {
    setLoadedPlanId(null)
    setStartMonday(nextMonday())
    setPlan(Array.from({ length: 4 }, () => Array.from({ length: 7 }, () => [])))
  }

  // ── Drag handlers ────────────────────────────────────────────
  function onDragStart(e, session) {
    setDragging(session)
    e.dataTransfer.effectAllowed = 'copy'
  }

  function onDragOver(e, week, day) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setDragOver({ week, day })
  }

  function onDrop(e, week, day) {
    e.preventDefault()
    if (!dragging) return
    const vma = athlete?.vma
    // dragging = ligne brute session_library (main_set/warmup/cooldown avec "% VMA" en texte).
    // On calcule tout de suite les vraies allures pour l'athlète sélectionné, sinon la séance
    // reste avec des pourcentages bruts et un tableau d'allures vide.
    const item = {
      code:            dragging.code,
      titre:           dragging.name,
      type:            SESSION_TYPE_LABELS[dragging.type] || dragging.type,
      sport:           dragging.sport || 'running',
      corps:           subsPaces(dragging.main_set, vma) || dragging.main_set || '',
      echauffement:    subsPaces(dragging.warmup, vma) || dragging.warmup || '',
      retour_au_calme: subsPaces(dragging.cooldown, vma) || dragging.cooldown || '',
      notes_coach:     dragging.coach_notes || '',
      duree_min:       dragging.duration_min || null,
      distance_km:     null,
      intensite:       dragging.intensity_rpe >= 7 ? 'dur' : dragging.intensity_rpe <= 4 ? 'facile' : 'modere',
      rpe_cible:       dragging.intensity_rpe ?? null,
      allures:         buildAllures(dragging, vma),
      recuperation:    dragging.recovery ? { type: 'récupération', description: subsPaces(dragging.recovery, vma) || dragging.recovery, duree_secondes: null } : null,
      est_seance_cle:  false,
      _uid:            Date.now() + Math.random(),
    }
    setPlan(prev => {
      const next = prev.map(w => w.map(d => [...d]))
      next[week][day] = [...next[week][day], item]
      return next
    })
    setDragging(null)
    setDragOver(null)
  }

  function removeSession(week, day, idx) {
    setPlan(prev => {
      const next = prev.map(w => w.map(d => [...d]))
      next[week][day].splice(idx, 1)
      return next
    })
  }

  // ── Sauvegarde (création ou mise à jour) ─────────────────────
  async function savePlan() {
    if (!selectedAthlete) return alert('Choisis un athlète')
    setSavingPlan(true)
    try {
      const semaines = plan.map((week, wi) => {
        const monday  = addDays(startMonday, wi * 7)
        const seances = []
        week.forEach((daySessions, di) => {
          daySessions.forEach(s => {
            seances.push({
              jour:            DAY_NAMES[di],
              date:            addDays(monday, di).toISOString().split('T')[0],
              type:            s.type || 'Endurance fondamentale',
              titre:           s.titre || s.code,
              duree_min:       s.duree_min || 0,
              distance_km:     s.distance_km ?? null,
              intensite:       s.intensite || '',
              echauffement:    s.echauffement || '',
              corps:           s.corps || '',
              retour_au_calme: s.retour_au_calme || '',
              notes_coach:     s.notes_coach || '',
              rpe_cible:       s.rpe_cible ?? null,
              allures:         s.allures || [],
              recuperation:    s.recuperation ?? null,
              est_seance_cle:  s.est_seance_cle ?? false,
              id_seance:       s.code,
            })
          })
        })
        return {
          numero:     wi + 1,
          phase:      `S${wi + 1}`,
          charge:     'Modérée',
          date_debut: monday.toISOString().split('T')[0],
          seances,
        }
      })

      const plan_data = { semaines, nb_semaines: 4 }
      let error

      if (loadedPlanId) {
        // Mise à jour du plan existant
        ;({ error } = await supabase.from('training_plans')
          .update({ plan_data, updated_at: new Date().toISOString() })
          .eq('id', loadedPlanId))
      } else {
        // Création d'un nouveau plan
        ;({ error } = await supabase.from('training_plans').insert({
          user_id:    selectedAthlete,
          plan_data,
          status:     'pending',
          created_at: new Date().toISOString(),
        }))
      }

      if (error) throw error
      setSavedMsg(loadedPlanId ? 'Plan mis à jour ✓' : 'Plan sauvegardé ✓')
      setTimeout(() => navigate('/admin/plans'), 1800)
    } catch (err) {
      alert('Erreur : ' + err.message)
    } finally {
      setSavingPlan(false)
    }
  }

  // ── Helpers UI ───────────────────────────────────────────────
  const panelBase = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    overflow: 'hidden',
  }

  function planLabel(p) {
    const date = new Date(p.created_at).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' })
    const status = { pending: 'En attente', active: 'Actif', completed: 'Terminé' }[p.status] || p.status
    return `${date} — ${status}`
  }

  return (
    <div className="page" style={{ padding: '1.25rem' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/admin/plans')} className="btn btn-ghost btn-sm">← Retour</button>
        <h2 className="page-heading" style={{ margin: 0, flex: 1 }}>
          {loadedPlanId ? '✏️ Modifier un plan' : '🗓️ Créer un plan manuellement'}
        </h2>
        <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-sm" onClick={savePlan} disabled={savingPlan || !selectedAthlete}>
            {savingPlan ? '…' : loadedPlanId ? '💾 Mettre à jour' : '✅ Sauvegarder'}
          </button>
          {savedMsg && <span style={{ color: '#10B981', fontSize: '.85rem', fontWeight: 700 }}>{savedMsg}</span>}
        </div>
      </div>

      {/* ── Sélecteurs athlète + plan existant ── */}
      <div style={{ display: 'flex', gap: '.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 220px' }}>
          <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '.3rem' }}>Athlète</label>
          <select className="form-input" style={{ width: '100%', fontSize: '.875rem' }}
            value={selectedAthlete} onChange={e => setSelectedAthlete(e.target.value)}>
            <option value="">-- Choisir un athlète --</option>
            {athletes.map(a => (
              <option key={a.id} value={a.id}>{a.first_name} {a.last_name}</option>
            ))}
          </select>
        </div>

        {selectedAthlete && (
          <div style={{ flex: '1 1 260px' }}>
            <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '.3rem' }}>
              Plan à modifier (optionnel)
            </label>
            <div style={{ display: 'flex', gap: '.5rem' }}>
              <select className="form-input" style={{ flex: 1, fontSize: '.875rem' }}
                value={loadedPlanId || ''}
                onChange={e => e.target.value ? loadPlan(e.target.value) : newPlan()}>
                <option value="">+ Nouveau plan</option>
                {athletePlans.map(p => (
                  <option key={p.id} value={p.id}>{planLabel(p)}</option>
                ))}
              </select>
              {loadedPlanId && (
                <button className="btn btn-ghost btn-sm" onClick={newPlan} title="Nouveau plan vierge">✕</button>
              )}
            </div>
          </div>
        )}

        {athlete && (
          <div style={{ fontSize: '.82rem', color: 'var(--primary)', fontWeight: 700, paddingBottom: '.3rem', whiteSpace: 'nowrap' }}>
            {athlete.first_name} {athlete.last_name}
            {loadedPlanId && <span style={{ marginLeft: '.5rem', fontWeight: 400, color: 'var(--text-muted)' }}>(plan chargé)</span>}
          </div>
        )}
      </div>

      {/* ── Main layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1rem', alignItems: 'start' }}>

        {/* ── CALENDRIER ── */}
        <div style={panelBase}>
          <div style={{ padding: '.75rem 1rem', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: '.875rem' }}>
            📅 {fmtDay(startMonday)} → {fmtDay(addDays(startMonday, 27))}
          </div>

          <div style={{ overflowX: 'auto' }}>
            {/* En-têtes jours */}
            <div style={{ display: 'grid', gridTemplateColumns: '72px repeat(7, 1fr)', borderBottom: '1px solid var(--border)' }}>
              <div />
              {DAY_NAMES.map(d => (
                <div key={d} style={{ padding: '.5rem .25rem', textAlign: 'center', fontSize: '.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--text-muted)' }}>{d}</div>
              ))}
            </div>

            {/* 4 semaines */}
            {plan.map((week, wi) => {
              const monday = addDays(startMonday, wi * 7)
              return (
                <div key={wi} style={{ display: 'grid', gridTemplateColumns: '72px repeat(7, 1fr)', borderBottom: wi < 3 ? '1px solid var(--border)' : 'none', minHeight: 90 }}>
                  <div style={{ padding: '.5rem .4rem', fontSize: '.65rem', fontWeight: 700, color: 'var(--text-muted)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '.15rem' }}>
                    <span>S{wi + 1}</span>
                    <span style={{ fontWeight: 400, fontSize: '.6rem' }}>{fmtWeekRange(monday)}</span>
                  </div>

                  {week.map((daySessions, di) => {
                    const isOver = dragOver?.week === wi && dragOver?.day === di
                    return (
                      <div key={di}
                        onDragOver={e => onDragOver(e, wi, di)}
                        onDragLeave={() => setDragOver(null)}
                        onDrop={e => onDrop(e, wi, di)}
                        style={{
                          borderLeft: '1px solid var(--border)',
                          padding: '.3rem',
                          minHeight: 90,
                          background: isOver ? 'rgba(139,47,201,.12)' : 'transparent',
                          transition: 'background .1s',
                          display: 'flex', flexDirection: 'column', gap: '.25rem',
                        }}>
                        <div style={{ fontSize: '.58rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '.1rem' }}>
                          {fmtDay(addDays(monday, di))}
                        </div>

                        {daySessions.length === 0 && (
                          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: `1px dashed ${isOver ? 'rgba(139,47,201,.5)' : 'rgba(255,255,255,.08)'}`,
                            borderRadius: 6, fontSize: '.58rem', color: isOver ? 'rgba(139,47,201,.8)' : 'rgba(255,255,255,.18)' }}>
                            {isOver ? '↓ Déposer' : 'Repos'}
                          </div>
                        )}

                        {daySessions.map((s, si) => {
                          const color = sessionColor(s)
                          return (
                            <div key={`${si}-${s._uid}`} style={{ borderRadius: 5, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--surface-2)', position: 'relative' }}>
                              <div style={{ borderLeft: `3px solid ${color}`, padding: '.3rem .35rem .3rem .4rem' }}>
                                <div style={{ fontSize: '.58rem', fontWeight: 700, color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {s.code}
                                </div>
                                <div style={{ fontSize: '.62rem', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {s.titre}
                                </div>
                              </div>
                              <button onClick={() => removeSession(wi, di, si)}
                                style={{ position: 'absolute', top: 2, right: 2, background: 'none', border: 'none', cursor: 'pointer', fontSize: '.6rem', color: 'rgba(255,255,255,.3)', padding: '1px 3px', lineHeight: 1 }}
                                title="Retirer">✕</button>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── BIBLIOTHÈQUE ── */}
        <div style={{ ...panelBase, position: 'sticky', top: 16, maxHeight: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '.75rem', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: '.875rem' }}>
            📚 Bibliothèque
          </div>

          <div style={{ padding: '.5rem .75rem', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
            <input className="form-input" style={{ fontSize: '.8rem', padding: '.4rem .6rem' }}
              placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} />

            {/* Sport filter pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem' }}>
              {SPORT_OPTS.map(opt => (
                <button key={opt.value}
                  onClick={() => setSportFilter(opt.value)}
                  style={{
                    padding: '.22rem .55rem', borderRadius: 99, fontSize: '.68rem', fontWeight: 700, cursor: 'pointer',
                    border: `1px solid ${sportFilter === opt.value ? opt.color : 'var(--border)'}`,
                    background: sportFilter === opt.value ? opt.color + '22' : 'transparent',
                    color: sportFilter === opt.value ? opt.color : 'var(--text-muted)',
                    transition: 'all .12s',
                  }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '.5rem' }}>
            {loadingSessions ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '.8rem' }}>Chargement…</div>
            ) : filteredSessions.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '.8rem' }}>Aucune séance</div>
            ) : filteredSessions.map(s => {
              const color = sessionColor(s)
              return (
                <div key={s.id || s.code}
                  draggable
                  onDragStart={e => onDragStart(e, s)}
                  style={{
                    borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface-2)',
                    marginBottom: '.35rem', cursor: 'grab', overflow: 'hidden',
                    opacity: dragging?.code === s.code ? .5 : 1,
                    userSelect: 'none',
                  }}>
                  <div style={{ borderLeft: `3px solid ${color}`, padding: '.4rem .5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.3rem' }}>
                      <span style={{ fontSize: '.62rem', fontWeight: 800, color, flexShrink: 0 }}>{s.code}</span>
                      {s.duration_min && <span style={{ fontSize: '.58rem', color: 'var(--text-muted)', flexShrink: 0 }}>{s.duration_min} min</span>}
                    </div>
                    <div style={{ fontSize: '.68rem', fontWeight: 600, lineHeight: 1.3, marginTop: '.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.name}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
