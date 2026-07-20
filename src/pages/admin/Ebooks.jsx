import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const STATUS_LABELS = { pending: 'En attente', paid: 'Payé', sent: 'Envoyé' }
const STATUS_COLORS = { pending: '#F59E0B', paid: '#06B6D4', sent: '#10B981' }

const EBOOK_CATALOG = [
  { slug: '10km-8sem',      label: '10 km — 8 semaines',      icon: '🏃' },
  { slug: '10km-12sem',     label: '10 km — 12 semaines',     icon: '🏃' },
  { slug: 'semi-12sem',     label: 'Semi-Marathon — 12 sem',  icon: '🏅' },
  { slug: 'marathon-12sem', label: 'Marathon — 12 semaines',  icon: '🏆' },
  { slug: 'marathon-16sem', label: 'Marathon — 16 semaines',  icon: '🏆' },
]

const VMA_OPTIONS = Array.from({ length: 29 }, (_, i) => (10 + i * 0.5).toFixed(1))
const SEANCES_OPTIONS = [3, 4, 5, 6]

function EbookCard({ slug, label, icon }) {
  const [vma, setVma] = useState('14.0')
  const [seances, setSeances] = useState(4)

  const handleOpen = () => {
    const url = `${API}/api/ebooks/admin/pdf/${slug}/${vma}/${seances}`
    window.open(url, '_blank')
  }

  return (
    <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
        <span style={{ fontSize: '1.6rem' }}>{icon}</span>
        <div style={{ fontWeight: 700, fontSize: '.95rem', lineHeight: 1.3 }}>{label}</div>
      </div>

      <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 100px' }}>
          <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '.3rem' }}>
            VMA (km/h)
          </label>
          <select value={vma} onChange={e => setVma(e.target.value)}
            style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '.45rem .6rem', color: 'var(--text)', fontSize: '.875rem', cursor: 'pointer' }}>
            {VMA_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>

        <div style={{ flex: '1 1 100px' }}>
          <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '.3rem' }}>
            Séances/semaine
          </label>
          <select value={seances} onChange={e => setSeances(Number(e.target.value))}
            style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '.45rem .6rem', color: 'var(--text)', fontSize: '.875rem', cursor: 'pointer' }}>
            {SEANCES_OPTIONS.map(s => <option key={s} value={s}>{s} séances</option>)}
          </select>
        </div>

        <button onClick={handleOpen} className="btn btn-primary btn-sm" style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
          Ouvrir le PDF ↗
        </button>
      </div>
    </div>
  )
}

export default function AdminEbooks() {
  const [stats,     setStats]     = useState(null)
  const [purchases, setPurchases] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [tab,       setTab]       = useState('ebooks')
  const [toggling,  setToggling]  = useState(null)
  const [deleting,  setDeleting]  = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const [s, p] = await Promise.all([
        fetch(`${API}/api/ebooks/admin/stats`).then(r => r.json()),
        fetch(`${API}/api/ebooks/admin/purchases`).then(r => r.json()),
      ])
      setStats(s)
      setPurchases(p.purchases || [])
    } finally {
      setLoading(false)
    }
  }

  async function toggleActive(id) {
    setToggling(id)
    try {
      await fetch(`${API}/api/ebooks/admin/${id}/toggle`, { method: 'PATCH' })
      await load()
    } finally {
      setToggling(null)
    }
  }

  async function deletePurchase(id) {
    if (!confirm('Supprimer cet achat ?')) return
    setDeleting(id)
    try {
      await fetch(`${API}/api/ebooks/admin/purchases/${id}`, { method: 'DELETE' })
      setPurchases(prev => prev.filter(p => p.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  if (loading) return <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Chargement…</div>

  const totalRevenue = ((stats?.total_revenue_cents || 0) / 100).toFixed(2)

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '.75rem' }}>
        <h2 className="page-heading" style={{ margin: 0 }}>Ebooks</h2>
        <div style={{ background: 'linear-gradient(135deg,rgba(139,47,201,.2),rgba(232,35,122,.15))', border: '1px solid rgba(139,47,201,.3)', borderRadius: 12, padding: '.6rem 1.25rem', fontWeight: 800, fontSize: '1.1rem' }}>
          Revenu total : {totalRevenue}€
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.5rem' }}>
        {[
          { v: 'ebooks',    l: 'Mes ebooks'  },
          { v: 'ventes',    l: 'Ventes'      },
          { v: 'catalogue', l: 'Catalogue'   },
        ].map(t => (
          <button key={t.v} onClick={() => setTab(t.v)}
            className={`btn btn-sm ${tab === t.v ? 'btn-primary' : 'btn-ghost'}`}>
            {t.l}
          </button>
        ))}
      </div>

      {/* ── MES EBOOKS ── */}
      {tab === 'ebooks' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {EBOOK_CATALOG.map(e => <EbookCard key={e.slug} {...e} />)}
        </div>
      )}

      {/* ── VENTES ── */}
      {tab === 'ventes' && (
        <>
          {/* Stats par ebook */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {(stats?.ebooks || []).map(e => (
              <div key={e.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.1rem' }}>
                <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginBottom: '.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: e.sales > 0 ? 'var(--primary)' : 'var(--text-muted)' }}>{e.sales}</div>
                <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>vente{e.sales !== 1 ? 's' : ''} · {(e.revenue_cents / 100).toFixed(2)}€</div>
              </div>
            ))}
          </div>

          {/* Liste des achats */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', fontWeight: 700 }}>
              Derniers achats ({purchases.length})
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Email', 'Plan', 'VMA', 'Séances', 'Statut', 'Date', ''].map(h => (
                      <th key={h} style={{ padding: '.75rem 1rem', textAlign: 'left', fontSize: '.78rem', fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {purchases.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '.75rem 1rem', fontSize: '.875rem' }}>{p.email}</td>
                      <td style={{ padding: '.75rem 1rem', fontSize: '.875rem', color: 'var(--text-muted)' }}>{p.ebooks?.title || p.ebook_id}</td>
                      <td style={{ padding: '.75rem 1rem', fontSize: '.875rem' }}>{p.vma ?? '—'}</td>
                      <td style={{ padding: '.75rem 1rem', fontSize: '.875rem' }}>{p.seances_semaine ?? '—'}</td>
                      <td style={{ padding: '.75rem 1rem' }}>
                        <span style={{ background: (STATUS_COLORS[p.status] || '#6B7280') + '20', color: STATUS_COLORS[p.status] || '#6B7280', borderRadius: 99, padding: '.2rem .65rem', fontSize: '.72rem', fontWeight: 700 }}>
                          {STATUS_LABELS[p.status] || p.status}
                        </span>
                      </td>
                      <td style={{ padding: '.75rem 1rem', fontSize: '.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(p.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '.75rem 1rem' }}>
                        <button
                          onClick={() => deletePurchase(p.id)}
                          disabled={deleting === p.id}
                          title="Supprimer cet achat"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', opacity: deleting === p.id ? .4 : .6, transition: 'opacity .15s', padding: '.2rem .4rem', borderRadius: 6 }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                          onMouseLeave={e => e.currentTarget.style.opacity = deleting === p.id ? '.4' : '.6'}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                  {purchases.length === 0 && (
                    <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Aucun achat pour l'instant.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── CATALOGUE ── */}
      {tab === 'catalogue' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Titre', 'Slug', 'Prix', 'Ventes', 'Statut', ''].map(h => (
                  <th key={h} style={{ padding: '.75rem 1rem', textAlign: 'left', fontSize: '.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(stats?.ebooks || []).map(e => (
                <tr key={e.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '.75rem 1rem', fontWeight: 600 }}>{e.title}</td>
                  <td style={{ padding: '.75rem 1rem', fontSize: '.8rem', color: 'var(--text-muted)' }}>{e.slug}</td>
                  <td style={{ padding: '.75rem 1rem', fontSize: '.875rem' }}>{(e.price_cents / 100).toFixed(2)}€</td>
                  <td style={{ padding: '.75rem 1rem', fontWeight: 700, color: e.sales > 0 ? 'var(--primary)' : 'var(--text-muted)' }}>{e.sales}</td>
                  <td style={{ padding: '.75rem 1rem' }}>
                    <span style={{ background: e.active ? 'rgba(16,185,129,.15)' : 'rgba(107,114,128,.15)', color: e.active ? '#10B981' : '#6B7280', borderRadius: 99, padding: '.2rem .65rem', fontSize: '.72rem', fontWeight: 700 }}>
                      {e.active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td style={{ padding: '.75rem 1rem' }}>
                    <button onClick={() => toggleActive(e.id)} disabled={toggling === e.id}
                      className="btn btn-ghost btn-sm">
                      {toggling === e.id ? '…' : e.active ? 'Désactiver' : 'Activer'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
