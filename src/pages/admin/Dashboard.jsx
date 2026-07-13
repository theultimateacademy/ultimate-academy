import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { api } from '../../lib/api'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import { useBadges } from '../../contexts/BadgesContext'

const PRICE     = 30
const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

const fmtEur    = (n) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
const fmtUrssaf = (n) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/* ─── Month detail card ─────────────────────────────────────────────── */
function MonthCard({ monthName, mData, year, isCurrent, copied, onCopy }) {
  const [expanded, setExpanded] = useState(isCurrent)
  const key = `${year}-${MONTHS_FR.indexOf(monthName) + 1}`

  if (!mData) return null

  return (
    <div style={{
      borderRadius: 'var(--radius)', border: `1.5px solid ${isCurrent ? 'var(--primary)' : 'var(--border)'}`,
      background: isCurrent ? 'linear-gradient(135deg,rgba(139,47,201,.25),rgba(232,35,122,.15))' : 'var(--surface)',
      overflow: 'hidden', marginBottom: '.5rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '.75rem 1rem', cursor: 'pointer', gap: '.75rem' }}
        onClick={() => setExpanded(e => !e)}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            <span style={{ fontWeight: 700, fontSize: '.9rem' }}>{monthName} {year}</span>
            {isCurrent && (
              <span style={{ fontSize: '.65rem', fontWeight: 700, color: 'var(--secondary)',
                background: 'rgba(232,35,122,.12)', padding: '.1rem .45rem', borderRadius: 99 }}>
                en cours
              </span>
            )}
          </div>
          <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginTop: '.15rem' }}>
            {mData.count} paiement{mData.count > 1 ? 's' : ''}
          </div>
        </div>
        <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--primary)', marginRight: '.5rem' }}>
          {fmtEur(mData.amount)}
        </div>
        <button
          onClick={e => { e.stopPropagation(); onCopy(fmtUrssaf(mData.amount), key) }}
          style={{
            padding: '.2rem .55rem', borderRadius: 6, cursor: 'pointer',
            fontFamily: 'inherit', fontSize: '.72rem', fontWeight: 700, flexShrink: 0,
            border: `1.5px solid ${copied === key ? 'var(--success)' : 'var(--border)'}`,
            background: copied === key ? 'var(--success)' : 'var(--surface-2)',
            color: copied === key ? '#fff' : 'var(--text-muted)', transition: 'all .2s'
          }}>
          {copied === key ? '✅' : '📋 URSSAF'}
        </button>
        <span style={{ color: 'var(--text-muted)', fontSize: '.9rem',
          transform: expanded ? 'rotate(180deg)' : '', transition: 'transform .2s', flexShrink: 0 }}>▾</span>
      </div>

      {expanded && mData.invoices?.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          {mData.invoices.map((inv, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '.55rem 1rem',
              borderBottom: i < mData.invoices.length - 1 ? '1px solid var(--border)' : 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg,#8B2FC9,#E8237A)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: '.7rem', fontWeight: 700
                }}>
                  {inv.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '.82rem' }}>{inv.name}</div>
                  {inv.email && (
                    <div style={{ fontSize: '.7rem', color: 'var(--text-muted)' }}>{inv.email}</div>
                  )}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: '.85rem', color: 'var(--primary)' }}>
                  {fmtEur(inv.amount)}
                </div>
                <div style={{ fontSize: '.7rem', color: 'var(--text-muted)' }}>
                  {new Date(inv.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Revenue card ──────────────────────────────────────────────────── */
function RevenueCard() {
  const [open,       setOpen]       = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [revenue,    setRevenue]    = useState(null)
  const [activeYear, setActiveYear] = useState(new Date().getFullYear())
  const [copied,     setCopied]     = useState(null)
  const [error,      setError]      = useState(null)

  const nowYear  = new Date().getFullYear()
  const nowMonth = new Date().getMonth() + 1

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const { revenue: data } = await api.revenue()
      setRevenue(data || {})
      const years = Object.keys(data || {}).map(Number).sort((a, b) => b - a)
      if (years.length) setActiveYear(years[0])
    } catch (err) {
      setError('Impossible de charger les données Stripe : ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleToggle() {
    const next = !open
    setOpen(next)
    if (next && revenue === null) load()
  }

  function refresh() { setRevenue(null); load() }

  function copy(text, key) {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopied(key)
    setTimeout(() => setCopied(null), 2500)
  }

  function buildAnnualText(yearData) {
    const lines = MONTHS_FR
      .map((name, i) => {
        const m = i + 1
        const d = yearData.months?.[m]
        if (!d) return null
        return `${name} ${activeYear} : ${fmtEur(d.amount)} (${d.count} paiement${d.count > 1 ? 's' : ''})`
      })
      .filter(Boolean)
    lines.push(`\nTOTAL ${activeYear} : ${fmtEur(yearData.total)} (${yearData.count} paiements)`)
    return lines.join('\n')
  }

  const years    = Object.keys(revenue || {}).map(Number).sort((a, b) => b - a)
  const yearData = (revenue || {})[activeYear] || { total: 0, count: 0, months: {} }

  const currentMonthData = yearData.months?.[nowMonth]
  const previousMonths   = MONTHS_FR
    .map((name, i) => ({ name, m: i + 1 }))
    .filter(({ m }) => {
      if (activeYear < nowYear) return !!yearData.months?.[m]
      return m < nowMonth && !!yearData.months?.[m]
    })
    .reverse()

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        onClick={handleToggle}>
        <div>
          <h3 style={{ marginBottom: '.15rem' }}>📊 CA & Déclarations fiscales</h3>
          <div style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>
            URSSAF · Impôts · données réelles Stripe avec détail clients
          </div>
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: '1.25rem',
          transform: open ? 'rotate(180deg)' : '', transition: 'transform .2s', marginLeft: '1rem' }}>
          ▾
        </span>
      </div>

      {open && (
        <div style={{ marginTop: '1.5rem' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '.9rem' }}>
              Connexion à Stripe…
            </div>
          )}
          {error && !loading && (
            <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>
          )}
          {!loading && !error && revenue !== null && years.length === 0 && (
            <p className="text-muted text-sm">Aucune facture payée trouvée dans Stripe.</p>
          )}

          {!loading && !error && years.length > 0 && (
            <>
              {/* Sélecteur d'année */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                {years.map(y => (
                  <button key={y} onClick={() => setActiveYear(y)}
                    style={{
                      padding: '.4rem 1rem', borderRadius: 99, cursor: 'pointer',
                      fontFamily: 'inherit', fontSize: '.875rem', fontWeight: 700,
                      border: `2px solid ${activeYear === y ? 'var(--primary)' : 'var(--border)'}`,
                      background: activeYear === y ? 'linear-gradient(135deg,rgba(139,47,201,.35),rgba(232,35,122,.25))' : 'var(--surface)',
                      color: activeYear === y ? '#fff' : 'var(--text-muted)'
                    }}>
                    {y}
                  </button>
                ))}
                <button onClick={refresh}
                  style={{ marginLeft: 'auto', padding: '.4rem .85rem', borderRadius: 99,
                    border: '1.5px solid var(--border)', background: 'var(--surface)',
                    cursor: 'pointer', fontFamily: 'inherit', fontSize: '.8rem', color: 'var(--text-muted)' }}>
                  🔄 Rafraîchir
                </button>
              </div>

              {/* Total annuel */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '1rem', marginBottom: '1.25rem',
                background: 'linear-gradient(135deg,#1A1A2E,#2D1B4E)',
                borderRadius: 'var(--radius)', color: '#fff' }}>
                <div>
                  <div style={{ fontSize: '.75rem', opacity: .7 }}>CA brut {activeYear}</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#A7F3D0' }}>
                    {fmtEur(yearData.total)}
                  </div>
                  <div style={{ fontSize: '.75rem', opacity: .65, marginTop: '.15rem' }}>
                    {yearData.count} paiements · URSSAF ≈ {fmtEur(yearData.total * 0.22)}
                  </div>
                </div>
                <button
                  onClick={() => copy(buildAnnualText(yearData), `full-${activeYear}`)}
                  style={{
                    padding: '.45rem .9rem', borderRadius: 99, cursor: 'pointer',
                    fontFamily: 'inherit', fontSize: '.78rem', fontWeight: 700,
                    border: 'none',
                    background: copied === `full-${activeYear}` ? 'var(--success)' : 'rgba(255,255,255,.15)',
                    color: '#fff', transition: 'all .2s'
                  }}>
                  {copied === `full-${activeYear}` ? '✅ Copié' : '📄 Récap annuel'}
                </button>
              </div>

              {/* Mois en cours */}
              {activeYear === nowYear && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--text-muted)',
                    textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.5rem' }}>
                    Mois en cours
                  </div>
                  {currentMonthData ? (
                    <MonthCard
                      monthName={MONTHS_FR[nowMonth - 1]}
                      mData={currentMonthData}
                      year={nowYear}
                      isCurrent={true}
                      copied={copied}
                      onCopy={copy}
                    />
                  ) : (
                    <div style={{ padding: '.875rem', borderRadius: 'var(--radius)',
                      border: '1.5px dashed var(--border)',
                      fontSize: '.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                      Aucun paiement reçu ce mois pour le moment
                    </div>
                  )}
                </div>
              )}

              {/* Mois précédents */}
              {previousMonths.length > 0 && (
                <div>
                  <div style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--text-muted)',
                    textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.5rem' }}>
                    Mois précédents
                  </div>
                  {previousMonths.map(({ name, m }) => (
                    <MonthCard
                      key={m}
                      monthName={name}
                      mData={yearData.months?.[m]}
                      year={activeYear}
                      isCurrent={false}
                      copied={copied}
                      onCopy={copy}
                    />
                  ))}
                </div>
              )}

              {/* Note légale */}
              <div style={{ marginTop: '1rem', padding: '.875rem', background: 'var(--surface-2)',
                borderRadius: 'var(--radius)', borderLeft: '3px solid #F59E0B' }}>
                <div style={{ fontWeight: 700, fontSize: '.8rem', marginBottom: '.35rem', color: '#F59E0B' }}>
                  ℹ️ Rappel fiscal (auto-entrepreneur)
                </div>
                <ul style={{ fontSize: '.8rem', color: 'var(--text-muted)', lineHeight: 1.7, paddingLeft: '1rem', margin: 0 }}>
                  <li>Déclarer le <strong>CA brut encaissé</strong>, montant avant frais Stripe</li>
                  <li>Les frais Stripe (~1,5% + 0,25 €/tx) sont des <strong>charges déductibles</strong> aux impôts</li>
                  <li>URSSAF : cotisation = CA × 22% (services), déclarer mensuellement ou trimestriellement</li>
                  <li>Impôts : CA de toute l'année civile → déclaration 2042-C-PRO</li>
                </ul>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Weekly analysis trigger card ─────────────────────────────────── */
function WeeklyAnalysisCard() {
  const [running, setRunning] = useState(false)
  const [result,  setResult]  = useState(null)
  const [error,   setError]   = useState(null)

  async function run() {
    setRunning(true)
    setResult(null)
    setError(null)
    try {
      const data = await api.runWeekly()
      setResult(data.processed ?? 0)
    } catch (err) {
      setError(err.message)
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ marginBottom: '.15rem' }}>📈 Analyses hebdomadaires</h3>
          <div style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>
            Normalement auto chaque dimanche à 18h. Relancer manuellement si besoin.
          </div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={run} disabled={running}
          style={{ flexShrink: 0 }}>
          {running ? '⏳ En cours…' : '▶ Lancer l\'analyse'}
        </button>
      </div>
      {result !== null && !error && (
        <div className="alert alert-success" style={{ marginTop: '1rem' }}>
          ✅ Analyse terminée : {result} athlète{result !== 1 ? 's' : ''} traité{result !== 1 ? 's' : ''}
        </div>
      )}
      {error && (
        <div className="alert alert-error" style={{ marginTop: '1rem' }}>
          ❌ Erreur : {error}
        </div>
      )}
    </div>
  )
}

/* ─── Main dashboard ────────────────────────────────────────────────── */
export default function AdminDashboard() {
  const navigate = useNavigate()
  const badges   = useBadges()
  const [stats,          setStats]          = useState({ athletes: 0, pending: 0, analyses: 0, cancelling: 0, newThisMonth: 0, feedbacks: 0, mrr: 0 })
  const [loading,        setLoading]        = useState(true)
  const [recentAthletes, setRecentAthletes] = useState([])
  const [newAthlete,     setNewAthlete]     = useState(null)

  useEffect(() => { loadData() }, [])

  // Realtime: notify when a new athlete completes their profile
  useEffect(() => {
    // Request browser notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const channel = supabase.channel('admin-new-athlete')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        payload => {
          if (!payload.old?.profile_completed && payload.new?.profile_completed && payload.new?.role === 'athlete') {
            const name = `${payload.new.first_name || ''} ${payload.new.last_name || ''}`.trim();
            setNewAthlete({ name, email: payload.new.email, objective: payload.new.objective });
            loadData();
            // Browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('🏃 Nouvel inscrit · The Ultimate Academy', {
                body: `${name} vient de finaliser son profil !`,
                icon: '/icon-192.png',
              });
            }
          }
        })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

      const [
        { count: athletes },
        { count: pending },
        { count: analyses },
        { count: cancelling },
        { count: newThisMonth },
        { count: feedbacks },
        { count: paying },
        { data: recent }
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'athlete').eq('subscription_status', 'active'),
        supabase.from('training_plans').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('weekly_analyses').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'athlete').eq('subscription_status', 'cancelling'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'athlete').gte('created_at', firstOfMonth),
        supabase.from('weekly_feedbacks').select('id', { count: 'exact', head: true }),
        // Only count athletes with a real Stripe subscription (stripe_customer_id set by webhook)
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'athlete').in('subscription_status', ['active', 'trialing']).not('stripe_customer_id', 'is', null),
        supabase.from('profiles').select('id, first_name, last_name, objective, subscription_status, created_at')
          .eq('role', 'athlete').order('created_at', { ascending: false }).limit(5)
      ])

      const a_ = athletes || 0
      setStats({
        athletes:     a_,
        pending:      pending      || 0,
        analyses:     analyses     || 0,
        cancelling:   cancelling   || 0,
        newThisMonth: newThisMonth || 0,
        feedbacks:    feedbacks    || 0,
        mrr:          0,
      })
      setRecentAthletes(recent || [])
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner fullPage />

  return (
    <div className="page">
      <h2 className="page-heading" style={{ marginBottom: '1.5rem' }}>Tableau de bord</h2>

      {newAthlete && (
        <div className="alert alert-success" style={{ marginBottom: '1rem', justifyContent: 'space-between', cursor: 'pointer' }}
          onClick={() => { navigate('/admin/athletes'); setNewAthlete(null); }}>
          <span>🎉 Nouvel inscrit : <strong>{newAthlete.name}</strong> ({newAthlete.email}) · {newAthlete.objective}</span>
          <span onClick={e => { e.stopPropagation(); setNewAthlete(null); }} style={{ opacity: .6 }}>✕</span>
        </div>
      )}

      {(stats.pending > 0 || stats.analyses > 0 || badges.messages > 0) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem', marginBottom: '1.5rem' }}>
          {stats.pending > 0 && (
            <div className="alert alert-warning" style={{ cursor: 'pointer', justifyContent: 'space-between' }}
              onClick={() => navigate('/admin/plans')}>
              <span>{stats.pending} plan{stats.pending > 1 ? 's' : ''} en attente de validation</span>
              <span>→</span>
            </div>
          )}
          {stats.analyses > 0 && (
            <div className="alert alert-info" style={{ cursor: 'pointer', justifyContent: 'space-between' }}
              onClick={() => navigate('/admin/analyses')}>
              <span>{stats.analyses} analyse{stats.analyses > 1 ? 's' : ''} à envoyer</span>
              <span>→</span>
            </div>
          )}
          {badges.messages > 0 && (
            <div className="alert alert-error" style={{ cursor: 'pointer', justifyContent: 'space-between' }}
              onClick={() => navigate('/admin/messages')}>
              <span>{badges.messages} message{badges.messages > 1 ? 's' : ''} non lu{badges.messages > 1 ? 's' : ''}</span>
              <span>→</span>
            </div>
          )}
        </div>
      )}

      {/* Finance estimée */}
      <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg,#1A1A2E,#2D1B4E)', color: '#fff' }}>
        <h3 style={{ color: '#fff', marginBottom: '1.25rem', fontSize: '1rem' }}>💶 Performance financière</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '1rem', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#A7F3D0' }}>{stats.mrr}€</div>
            <div style={{ fontSize: '.75rem', opacity: .7, marginTop: '.2rem' }}>MRR estimé</div>
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#A7F3D0' }}>{stats.newThisMonth}</div>
            <div style={{ fontSize: '.75rem', opacity: .7, marginTop: '.2rem' }}>Nouvelles inscriptions</div>
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: stats.cancelling > 0 ? '#FCA5A5' : '#A7F3D0' }}>
              {stats.cancelling}
            </div>
            <div style={{ fontSize: '.75rem', opacity: .7, marginTop: '.2rem' }}>Résiliations</div>
          </div>
        </div>
        <div style={{ marginTop: '1.25rem', fontSize: '.8rem', opacity: .65,
          borderTop: '1px solid rgba(255,255,255,.1)', paddingTop: '.75rem' }}>
          {stats.athletes} athlètes actifs · {PRICE}€ / athlète / mois
        </div>
      </div>

      {/* KPIs opérationnels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Athlètes actifs',    value: stats.athletes,    icon: '🏃', action: '/admin/athletes',  variant: 'accent' },
          { label: 'Plans en attente',   value: stats.pending,     icon: '📋', action: '/admin/plans',    highlight: stats.pending > 0 },
          { label: 'Messages non lus',   value: badges.messages,   icon: '💬', action: '/admin/messages', highlight: badges.messages > 0, variant: 'dark' },
          { label: 'Analyses à valider', value: stats.analyses,    icon: '📈', action: '/admin/analyses', highlight: stats.analyses > 0 },
          { label: 'Bilans semaine',     value: stats.feedbacks, icon: '📊', action: null },
        ].map(s => (
          <div key={s.label}
            className={`stat-card${s.variant === 'accent' ? ' stat-card--accent' : s.variant === 'dark' ? ' stat-card--dark' : ''}`}
            style={{ cursor: s.action ? 'pointer' : 'default',
              borderLeft: (!s.variant && s.highlight) ? '3px solid var(--primary)' : '' }}
            onClick={() => s.action && navigate(s.action)}>
            <div style={{ fontSize: '1.5rem', marginBottom: '.25rem' }}>{s.icon}</div>
            <div className={s.variant ? 'stat-value' : 'stat-value gradient-text'}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Analyses hebdomadaires */}
      <WeeklyAnalysisCard />

      {/* CA & Déclarations fiscales */}
      <RevenueCard />

      {/* Derniers athlètes */}
      <div className="card">
        <div className="card-header">
          <h3>Derniers athlètes inscrits</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/athletes')}>Voir tous →</button>
        </div>
        {recentAthletes.length === 0 ? (
          <p className="text-muted text-sm">Aucun athlète pour le moment.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
            {recentAthletes.map(a => (
              <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '.75rem', background: 'var(--surface-2)', borderRadius: 'var(--radius)',
                cursor: 'pointer' }}
                onClick={() => navigate('/admin/athletes')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                  <div className="chat-avatar" style={{ width: 32, height: 32, fontSize: '.8rem' }}>
                    {a.first_name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '.9rem' }}>{a.first_name} {a.last_name}</div>
                    <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>
                      {new Date(a.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </div>
                <span className={`badge ${a.subscription_status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                  {a.subscription_status === 'active' ? 'Actif' : a.subscription_status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
