// Page de démonstration — onglet Strava dans la fiche athlète coach

const STRAVA_ORANGE = '#FC4C02'

function StravaLogo({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="8" fill={STRAVA_ORANGE} />
      <path d="M17 28l-5-9h4l1 2 1-2h4l-5 9z" fill="white" opacity=".6" />
      <path d="M22 28l-5-9h4l5 9h-4z" fill="white" />
    </svg>
  )
}

const ACTIVITIES = [
  { date: 'Dim 20 juil.',  type: 'Course à pied', name: 'Sortie longue',        dist: '12,4 km', duree: '58:32', allure: "4'43\"/km", fc: '158 bpm', deni: '+145 m', strava_id: '11842371920' },
  { date: 'Ven 18 juil.',  type: 'Course à pied', name: 'Fractionné 10×400m',   dist: '9,1 km',  duree: '44:15', allure: "4'52\"/km", fc: '171 bpm', deni: '+38 m',  strava_id: '11829045231' },
  { date: 'Mer 16 juil.',  type: 'Course à pied', name: 'Endurance fondamentale',dist: '7,8 km',  duree: '42:10', allure: "5'24\"/km", fc: '143 bpm', deni: '+62 m',  strava_id: '11810983147' },
  { date: 'Dim 13 juil.',  type: 'Course à pied', name: 'Sortie longue',        dist: '14,2 km', duree: '1h08:44', allure: "4'50\"/km", fc: '155 bpm', deni: '+190 m', strava_id: '11789204561' },
]

export default function DemoStravaCoach() {
  return (
    <div style={{ minHeight: '100vh', background: '#09090F', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      <style>{`
        @media (max-width: 600px) {
          .strava-act-stats  { grid-template-columns: repeat(3, 1fr) !important; }
          .strava-month-stats{ grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '2rem 1.25rem' }}>

        {/* Athlete header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2rem', padding: '1.25rem', background: 'rgba(255,255,255,.03)', borderRadius: 16, border: '1px solid rgba(255,255,255,.07)' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#8B2FC9,#E8237A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.4rem', flexShrink: 0 }}>
            M
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: '1.15rem', marginBottom: '.35rem' }}>Marine Dupont</div>
            <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '.72rem', fontWeight: 700, background: 'rgba(16,185,129,.15)', color: '#34D399', border: '1px solid rgba(16,185,129,.3)', borderRadius: 99, padding: '.18rem .55rem' }}>
                ✓ Actif
              </span>
              <span style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.4)', padding: '.18rem .55rem' }}>Semi-marathon · Confirmée</span>
              <span style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.4)', padding: '.18rem .55rem' }}>VMA 16,5 km/h</span>
            </div>
          </div>
          {/* Strava badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', background: 'rgba(252,76,2,.1)', border: '1px solid rgba(252,76,2,.3)', borderRadius: 10, padding: '.5rem .9rem' }}>
            <StravaLogo size={20} />
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '.72rem', fontWeight: 700, color: STRAVA_ORANGE }}>Strava connecté</div>
              <div style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.35)' }}>Sync. automatique</div>
            </div>
          </div>
        </div>

        {/* Onglets */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,.08)', marginBottom: '1.5rem', overflowX: 'auto' }}>
          {['Plan', 'Analyses', 'Messages', 'Activités Strava'].map((tab, i) => (
            <button key={i} style={{
              padding: '.65rem 1.1rem', background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: '.85rem', fontWeight: i === 3 ? 700 : 500,
              color: i === 3 ? '#fff' : 'rgba(255,255,255,.38)',
              borderBottom: i === 3 ? `2px solid ${STRAVA_ORANGE}` : '2px solid transparent',
              marginBottom: -1, flexShrink: 0, display: 'flex', alignItems: 'center', gap: '.4rem',
            }}>
              {i === 3 && <StravaLogo size={16} />}
              {tab}
            </button>
          ))}
        </div>

        {/* Header section Strava */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.1rem' }}>
          <div>
            <h3 style={{ margin: '0 0 .2rem', fontSize: '1rem', fontWeight: 700 }}>Activités récentes</h3>
            <div style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.4)' }}>4 dernières activités synchronisées automatiquement</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.75rem', color: STRAVA_ORANGE, fontWeight: 700 }}>
            <StravaLogo size={18} />
            Voir sur Strava ↗
          </div>
        </div>

        {/* Activités list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
          {ACTIVITIES.map((act, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)',
              borderRadius: 14, overflow: 'hidden', display: 'flex',
            }}>
              {/* Barre gauche orange */}
              <div style={{ width: 4, background: STRAVA_ORANGE, flexShrink: 0 }} />

              <div style={{ flex: 1, padding: '1rem 1.1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.75rem', flexWrap: 'wrap', gap: '.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.25rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '.92rem' }}>{act.name}</span>
                      <span style={{ fontSize: '.68rem', fontWeight: 700, color: STRAVA_ORANGE, background: 'rgba(252,76,2,.12)', border: '1px solid rgba(252,76,2,.25)', borderRadius: 99, padding: '.1rem .45rem' }}>
                        Strava
                      </span>
                    </div>
                    <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.4)' }}>
                      {act.date} · {act.type}
                    </div>
                  </div>
                </div>

                {/* Stats en grille */}
                <div className="strava-act-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '.5rem' }}>
                  {[
                    { l: 'Distance',   v: act.dist },
                    { l: 'Durée',      v: act.duree },
                    { l: 'Allure moy', v: act.allure },
                    { l: 'FC moy',     v: act.fc },
                    { l: 'Dénivelé',   v: act.deni },
                  ].map(({ l, v }, j) => (
                    <div key={j} style={{ background: 'rgba(255,255,255,.04)', borderRadius: 8, padding: '.4rem .5rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '.6rem', color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.2rem' }}>{l}</div>
                      <div style={{ fontSize: '.82rem', fontWeight: 700 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats globales */}
        <div style={{ marginTop: '1.5rem', padding: '1.1rem 1.25rem', background: 'rgba(252,76,2,.06)', border: '1px solid rgba(252,76,2,.18)', borderRadius: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem' }}>
            <StravaLogo size={22} />
            <span style={{ fontWeight: 700, fontSize: '.88rem', color: STRAVA_ORANGE }}>Bilan du mois — Juillet 2026</span>
          </div>
          <div className="strava-month-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '.75rem' }}>
            {[
              { l: 'Sorties',     v: '12' },
              { l: 'Volume total',v: '87 km' },
              { l: 'Temps total', v: '7h 23min' },
              { l: 'Dénivelé +',  v: '+1 240 m' },
            ].map(({ l, v }, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#fff', marginBottom: '.2rem' }}>{v}</div>
                <div style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
