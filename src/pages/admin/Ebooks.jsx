import { useState, useEffect } from 'react'
import { api } from '../../lib/api'

const STATUS_LABELS = { pending: 'En attente', paid: 'Payé', sent: 'Envoyé' }
const STATUS_COLORS = { pending: '#F59E0B', paid: '#06B6D4', sent: '#10B981' }

export default function AdminEbooks() {
  const [stats,     setStats]     = useState(null)
  const [purchases, setPurchases] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [tab,       setTab]       = useState('ventes')
  const [toggling,  setToggling]  = useState(null)

  useEffect(() => { load() }, [])

  const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

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
        {[{ v: 'ventes', l: 'Ventes' }, { v: 'catalogue', l: 'Catalogue' }].map(t => (
          <button key={t.v} onClick={() => setTab(t.v)}
            className={`btn btn-sm ${tab === t.v ? 'btn-primary' : 'btn-ghost'}`}>
            {t.l}
          </button>
        ))}
      </div>

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
                    {['Email', 'Plan', 'Statut', 'Date'].map(h => (
                      <th key={h} style={{ padding: '.75rem 1rem', textAlign: 'left', fontSize: '.78rem', fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {purchases.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '.75rem 1rem', fontSize: '.875rem' }}>{p.email}</td>
                      <td style={{ padding: '.75rem 1rem', fontSize: '.875rem', color: 'var(--text-muted)' }}>{p.ebooks?.title || p.ebook_id}</td>
                      <td style={{ padding: '.75rem 1rem' }}>
                        <span style={{ background: (STATUS_COLORS[p.status] || '#6B7280') + '20', color: STATUS_COLORS[p.status] || '#6B7280', borderRadius: 99, padding: '.2rem .65rem', fontSize: '.72rem', fontWeight: 700 }}>
                          {STATUS_LABELS[p.status] || p.status}
                        </span>
                      </td>
                      <td style={{ padding: '.75rem 1rem', fontSize: '.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(p.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                  {purchases.length === 0 && (
                    <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Aucun achat pour l'instant.</td></tr>
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
