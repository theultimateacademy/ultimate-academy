import { Link } from 'react-router-dom'
import Nav from '../components/Nav'
import PageHero from '../components/PageHero'

const CALCULATEURS = [
  {
    icon: '🏃',
    title: 'Temps de passage',
    desc: 'Génère ton tableau de bord complet avec tes temps de passage à chaque kilomètre selon ton allure cible. Idéal pour préparer ta stratégie de course et éviter de partir trop vite.',
    path: '/calculateur/passage',
    label: 'Calculer mes temps de passage',
    tag: 'Course à pied',
  },
  {
    icon: '⚡',
    title: 'Calculateur de VMA',
    desc: 'Calcule ta Vitesse Maximale Aérobie (VMA) à partir de ton test de Cooper, ton test 6 minutes ou un chrono récent. Obtiens tes zones d\'entraînement personnalisées.',
    path: '/calculateur/vma',
    label: 'Calculer ma VMA',
    tag: 'VMA & Zones',
  },
  {
    icon: '📊',
    title: 'Allures running & zones FC',
    desc: 'Génère un tableau complet de toutes tes allures d\'entraînement (EF, Seuil, Tempo, VMA) et tes zones de fréquence cardiaque selon ta VMA et ta FCmax.',
    path: '/calculateur/allures',
    label: 'Voir mes allures',
    tag: 'Allures & FC',
  },
  {
    icon: '🎯',
    title: 'Prédicteur de chrono',
    desc: 'À partir d\'un chrono récent sur une distance, prédit ton temps cible sur une autre distance grâce à la formule de Riegel. Idéal pour fixer un objectif réaliste.',
    path: '/calculateur/predicteur',
    label: 'Prédire mon chrono',
    tag: 'Objectif course',
  },
  {
    icon: '🫁',
    title: 'Test de Cooper & VO2max',
    desc: 'Calcule ton VO2max estimé à partir du test de Cooper (12 minutes) ou d\'autres protocoles. Situe ton niveau par rapport aux normes internationales selon ton âge et ton sexe.',
    path: '/calculateur/vo2max',
    label: 'Tester mon VO2max',
    tag: 'VO2max',
  },
]

const grad = 'linear-gradient(135deg,#8B2FC9,#E8237A)'

export default function CalculateurHub() {
  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#fff' }}>
      <Nav />

      <PageHero
        badge="Outils gratuits"
        title="Calculateurs Running"
        subtitle="Tous les outils pour optimiser ton entraînement et préparer tes courses."
      />

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '4rem 1.5rem 6rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '1.5rem' }}>
          {CALCULATEURS.map(c => (
            <Link key={c.path} to={c.path} style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'rgba(255,255,255,.04)',
                border: '1px solid rgba(255,255,255,.08)',
                borderRadius: 20, padding: '2rem',
                display: 'flex', flexDirection: 'column', gap: '1rem',
                height: '100%', transition: 'border-color .2s, transform .2s, box-shadow .2s',
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(139,47,201,.45)'
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(139,47,201,.18)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)'
                  e.currentTarget.style.transform = ''
                  e.currentTarget.style.boxShadow = ''
                }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                  <div style={{ fontSize: '2.2rem' }}>{c.icon}</div>
                  <div style={{
                    background: 'rgba(139,47,201,.15)',
                    border: '1px solid rgba(139,47,201,.25)',
                    borderRadius: 100, padding: '.2rem .75rem',
                    fontSize: '.72rem', fontWeight: 700, color: '#C084FC',
                    letterSpacing: '.04em', whiteSpace: 'nowrap',
                  }}>{c.tag}</div>
                </div>

                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: '0 0 .5rem' }}>{c.title}</h2>
                  <p style={{ fontSize: '.875rem', color: 'rgba(255,255,255,.5)', lineHeight: 1.7, margin: 0 }}>{c.desc}</p>
                </div>

                <div style={{
                  marginTop: 'auto',
                  display: 'inline-flex', alignItems: 'center', gap: '.4rem',
                  background: grad, borderRadius: 50,
                  padding: '.55rem 1.25rem', fontSize: '.85rem', fontWeight: 700, color: '#fff',
                  width: 'fit-content',
                }}>
                  {c.label} →
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
