import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import Nav from '../components/Nav'

const C = { purple: '#8B2FC9', pink: '#E8237A', bg: '#0C0A18' }
const grad = 'linear-gradient(135deg,#8B2FC9,#E8237A)'

const EBOOK_DETAILS = {
  '10km-8sem': {
    icon: '🏃', weeks: 8, distance: '10 km', level: 'Intermédiaire',
    full_description: 'Un plan complet de 8 semaines pour préparer ta prochaine course de 10km. Idéal si tu cours déjà régulièrement et souhaites progresser sur cette distance emblématique.',
    toc: [
      'Semaines 1-2 : Adaptation — footing EF, fractionné court, sortie longue',
      'Semaines 3-4 : Développement — tempo, intervalles 1000m, volume',
      'Semaines 5-6 : Intensification — VMA, seuil, allure spécifique 10km',
      'Semaine 7 : Affûtage — volume réduit, allures maintenues',
      'Semaine 8 : Course — stratégie km par km, gestion de l\'effort',
      'Bonus : Calcul des allures personnalisées selon ta VMA',
      'Bonus : Nutrition avant et après course',
    ],
    for_who: 'Coureur capable de courir 30 min sans s\'arrêter, souhaitant améliorer son 10km.',
  },
  '10km-12sem': {
    icon: '🏃', weeks: 12, distance: '10 km', level: 'Tous niveaux',
    full_description: 'La version longue et progressive pour préparer un 10km en 12 semaines. Plus de temps pour construire ta base, développer ta VMA et arriver en pleine forme.',
    toc: [
      'Semaines 1-3 : Construction de base — endurance fondamentale',
      'Semaines 4-6 : Développement aérobie — sorties longues, côtes',
      'Semaines 7-9 : Bloc VMA — fractionnés courts et longs',
      'Semaines 10-11 : Allure spécifique — tempo et blocs 10km',
      'Semaine 12 : Affûtage et course',
      'Conseils nutrition et récupération',
    ],
    for_who: 'Tout coureur souhaitant une progression solide et durable sur 10km.',
  },
  'semi-12sem': {
    icon: '🏅', weeks: 12, distance: 'Semi-marathon', level: 'Intermédiaire',
    full_description: 'Prépare tes 21,1km avec un plan structuré de 12 semaines alliant volume kilométrique, séances de qualité et gestion de l\'effort sur la distance.',
    toc: [
      'Semaines 1-3 : Base endurance — EF, sorties longues progressives',
      'Semaines 4-6 : Volume — long runs jusqu\'à 18km, tempo',
      'Semaines 7-9 : Spécificité — allure semi, seuil lactique',
      'Semaines 10-11 : Affûtage — intensité maintenue, volume réduit',
      'Semaine 12 : Semaine de course',
      'Stratégie km par km pour le semi',
      'Ravitaillement et nutrition course',
    ],
    for_who: 'Coureur ayant déjà couru un 10km, prêt à passer au semi-marathon.',
  },
  'marathon-12sem': {
    icon: '🏆', weeks: 12, distance: 'Marathon', level: 'Confirmé',
    full_description: 'Un plan intense de 12 semaines pour les coureurs confirmés visant un objectif de temps sur marathon. Exigeant, efficace, structuré.',
    toc: [
      'Semaines 1-3 : Construction du volume — base kilométrique',
      'Semaines 4-6 : Long runs jusqu\'à 30km, allure marathon',
      'Semaines 7-9 : Qualité — seuil, allure spécifique, fractionnés',
      'Semaines 10-11 : Affûtage progressif',
      'Semaine 12 : Semaine de course',
      'Stratégie de course par blocs de 5km',
      'Nutrition, ravitaillement et hydratation',
    ],
    for_who: 'Coureur ayant terminé un semi-marathon, souhaitant aborder le marathon avec un plan structuré.',
  },
  'marathon-16sem': {
    icon: '🏆', weeks: 16, distance: 'Marathon', level: 'Tous niveaux',
    full_description: 'Le plan marathon complet. 16 semaines pour construire progressivement ton endurance, développer ta résistance et arriver au départ en pleine confiance.',
    toc: [
      'Semaines 1-4 : Fondation — endurance fondamentale, côtes',
      'Semaines 5-8 : Développement volume — long runs croissants',
      'Semaines 9-12 : Spécificité marathon — allures et seuil',
      'Semaines 13-14 : Intensification finale',
      'Semaines 15-16 : Affûtage et course',
      'Plans A / B / C selon l\'objectif',
      'Guide complet nutrition et hydratation',
    ],
    for_who: 'Tout coureur souhaitant préparer un marathon avec le temps nécessaire pour progresser sereinement.',
  },
  'anti-blessure': {
    icon: '🩺', weeks: null, distance: null, level: 'Tous niveaux',
    full_description: 'Le guide indispensable pour courir plus longtemps sans se blesser. Prévention, renforcement musculaire, soins et protocoles de reprise.',
    toc: [
      'Les blessures courantes du runner — causes et mécanismes',
      'Programme de renforcement musculaire complet (8 exercices)',
      'Routine d\'étirements et mobilité articulaire',
      'Signes d\'alerte : quand s\'arrêter, quand continuer',
      'Protocoles de reprise après blessure',
      'La règle des 10% et gestion de la charge',
      'Équipement et chaussures : ce qui compte vraiment',
    ],
    for_who: 'Tous les coureurs, débutants ou confirmés, qui veulent courir durablement.',
  },
}

export default function EbookDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [ebook,    setEbook]    = useState(null)
  const [email,    setEmail]    = useState('')
  const [loading,  setLoading]  = useState(true)
  const [paying,   setPaying]   = useState(false)
  const [error,    setError]    = useState(null)

  const meta = EBOOK_DETAILS[slug] || {}

  useEffect(() => {
    fetch(`/api/ebooks/${slug}`)
      .then(r => r.ok ? r.json() : Promise.reject('not found'))
      .then(d => setEbook(d.ebook))
      .catch(() => navigate('/ebooks'))
      .finally(() => setLoading(false))
  }, [slug])

  async function handleCheckout(e) {
    e.preventDefault()
    if (!email.trim() || !ebook) return
    setPaying(true)
    setError(null)
    try {
      const res = await fetch('/api/ebooks/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ebook_id: ebook.id, email: email.trim(), slug }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur paiement')
      window.location.href = data.url
    } catch (err) {
      setError(err.message)
      setPaying(false)
    }
  }

  if (loading) return (
    <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'rgba(255,255,255,.4)' }}>Chargement…</div>
    </div>
  )

  if (!ebook) return null

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: '#fff', fontFamily: 'inherit' }}>
      <Nav />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>
        <Link to="/ebooks" style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', color: 'rgba(255,255,255,.5)', textDecoration: 'none', fontSize: '.85rem', marginBottom: '2rem', fontWeight: 500 }}>
          ← Tous les plans
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
          {/* ── Colonne gauche : infos ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,360px)', gap: '2rem', alignItems: 'start' }}>
            <div>
              {/* Bannière */}
              <div style={{ height: 220, background: 'linear-gradient(135deg,#1A0A2E,#2D0B4E)', borderRadius: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', marginBottom: '1.5rem' }}>
                <div style={{ position: 'absolute', inset: 0, background: grad, opacity: .2 }} />
                {ebook.cover_image
                  ? <img src={ebook.cover_image} alt={ebook.title} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
                  : <>
                      <div style={{ fontSize: '4rem', position: 'relative', marginBottom: '.5rem' }}>{meta.icon || '📋'}</div>
                      <div style={{ position: 'relative', fontSize: '1.1rem', fontWeight: 800, letterSpacing: '.04em' }}>{ebook.title}</div>
                    </>
                }
              </div>

              {/* Chips */}
              <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                {meta.weeks && <Chip color={C.purple}>{meta.weeks} semaines</Chip>}
                {meta.distance && <Chip color={C.pink}>{meta.distance}</Chip>}
                {meta.level && <Chip color="#10B981">{meta.level}</Chip>}
                <Chip color="#F59E0B">📬 PDF par email</Chip>
              </div>

              <h1 style={{ fontSize: 'clamp(1.4rem,4vw,2rem)', fontWeight: 900, margin: '0 0 1rem', lineHeight: 1.2 }}>{ebook.title}</h1>
              <p style={{ color: 'rgba(255,255,255,.7)', lineHeight: 1.75, marginBottom: '1.5rem' }}>{meta.full_description || ebook.description}</p>

              {/* Pour qui */}
              {meta.for_who && (
                <div style={{ background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.2)', borderRadius: 14, padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '.75rem', fontWeight: 700, color: '#10B981', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.4rem' }}>Pour qui ?</div>
                  <p style={{ margin: 0, fontSize: '.9rem', color: 'rgba(255,255,255,.75)', lineHeight: 1.6 }}>{meta.for_who}</p>
                </div>
              )}

              {/* Table des matières */}
              {meta.toc && (
                <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 20, padding: '1.5rem' }}>
                  <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 800 }}>📋 Contenu du plan</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
                    {meta.toc.map((item, i) => (
                      <div key={i} style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-start' }}>
                        <span style={{ width: 22, height: 22, borderRadius: '50%', background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.65rem', fontWeight: 800, flexShrink: 0, marginTop: '.1rem' }}>{i+1}</span>
                        <span style={{ fontSize: '.875rem', color: 'rgba(255,255,255,.8)', lineHeight: 1.5 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Colonne droite : achat ── */}
            <div style={{ position: 'sticky', top: '1.5rem' }}>
              <div style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 24, padding: '1.75rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                    {(ebook.price_cents / 100).toFixed(2).replace('.', ',')}€
                  </div>
                  <div style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.4)', marginTop: '.2rem' }}>Paiement unique — accès à vie</div>
                </div>

                <form onSubmit={handleCheckout}>
                  <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: 'rgba(255,255,255,.6)', marginBottom: '.4rem' }}>
                    Ton adresse email *
                  </label>
                  <input
                    type="email" required placeholder="prenom@email.com"
                    value={email} onChange={e => setEmail(e.target.value)}
                    style={{ width: '100%', padding: '.75rem 1rem', borderRadius: 12, border: '1.5px solid rgba(255,255,255,.12)',
                      background: 'rgba(255,255,255,.07)', color: '#fff', fontSize: '.95rem',
                      fontFamily: 'inherit', marginBottom: '.75rem', boxSizing: 'border-box' }}
                  />
                  {error && <p style={{ color: '#F87171', fontSize: '.8rem', margin: '-.25rem 0 .75rem' }}>{error}</p>}
                  <button type="submit" disabled={!email.trim() || paying}
                    style={{ width: '100%', padding: '.875rem', borderRadius: 99, border: 'none',
                      background: (!email.trim() || paying) ? 'rgba(255,255,255,.1)' : grad,
                      color: (!email.trim() || paying) ? 'rgba(255,255,255,.3)' : '#fff',
                      fontWeight: 700, fontSize: '1rem', cursor: (!email.trim() || paying) ? 'default' : 'pointer',
                      fontFamily: 'inherit', boxShadow: (!email.trim() || paying) ? 'none' : '0 8px 24px rgba(232,35,122,.35)' }}>
                    {paying ? '⏳ Redirection…' : 'Acheter et recevoir par email →'}
                  </button>
                </form>

                <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                  {['🔒 Paiement sécurisé Stripe', '📬 PDF reçu instantanément', '📱 Compatible tous supports'].map(t => (
                    <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.8rem', color: 'rgba(255,255,255,.45)' }}>
                      {t}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: '1rem', background: 'rgba(139,47,201,.1)', border: '1px solid rgba(139,47,201,.2)', borderRadius: 16, padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.6)', marginBottom: '.6rem' }}>
                  💡 Calcule tes allures sur notre calculateur gratuit
                </div>
                <Link to="/calculateur/vma" style={{ color: '#C084FC', fontSize: '.85rem', fontWeight: 600, textDecoration: 'none' }}>
                  Calculateur VMA →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Chip({ children, color }) {
  return (
    <span style={{ background: color + '18', border: `1px solid ${color}35`, borderRadius: 99, padding: '.22rem .7rem', fontSize: '.72rem', fontWeight: 700, color }}>
      {children}
    </span>
  )
}
