// Page de démonstration — données Strava dans le flow post-séance

const STRAVA_ORANGE = '#FC4C02'

function StravaLogo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="8" fill={STRAVA_ORANGE} />
      <path d="M17 28l-5-9h4l1 2 1-2h4l-5 9z" fill="white" opacity=".6" />
      <path d="M22 28l-5-9h4l5 9h-4z" fill="white" />
    </svg>
  )
}

const statRow = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '.65rem 0', borderBottom: '1px solid rgba(255,255,255,.06)',
}

export default function DemoStravaSeance() {
  return (
    <div style={{ minHeight: '100vh', background: '#09090F', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '2rem 1.25rem' }}>

        {/* Header séance */}
        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{ fontSize: '.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'rgba(255,255,255,.35)', marginBottom: '.4rem' }}>
            Dimanche 20 juillet 2026
          </div>
          <h1 style={{ margin: '0 0 .35rem', fontSize: '1.4rem', fontWeight: 800 }}>Sortie longue</h1>
          <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '.75rem', fontWeight: 700, background: '#10B98120', color: '#10B981', border: '1px solid #10B98140', borderRadius: 99, padding: '.2rem .65rem' }}>
              Endurance fondamentale
            </span>
            <span style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.35)' }}>60 min prévues</span>
          </div>
        </div>

        {/* Ressenti athlète */}
        <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, padding: '1.1rem 1.25rem', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'rgba(255,255,255,.3)', marginBottom: '.6rem' }}>
            Ton ressenti
          </div>
          <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '.75rem' }}>
            {['😴 Fatigué', '😐 Moyen', '💪 Bien', '🔥 En feu'].map((label, i) => (
              <div key={i} style={{
                padding: '.4rem .9rem', borderRadius: 99, fontSize: '.82rem', fontWeight: 600, cursor: 'pointer',
                background: i === 2 ? 'rgba(16,185,129,.2)' : 'transparent',
                border: i === 2 ? '1.5px solid #10B981' : '1.5px solid rgba(255,255,255,.12)',
                color: i === 2 ? '#10B981' : 'rgba(255,255,255,.45)',
              }}>
                {label}
              </div>
            ))}
          </div>
          <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 10, padding: '.6rem .875rem', fontSize: '.85rem', color: 'rgba(255,255,255,.5)', fontStyle: 'italic' }}>
            "Bonne sortie, les jambes étaient légères aujourd'hui"
          </div>
        </div>

        {/* ──────────── BLOC STRAVA ──────────── */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(252,76,2,.1) 0%, rgba(252,76,2,.04) 100%)',
          border: '1.5px solid rgba(252,76,2,.35)',
          borderRadius: 16, overflow: 'hidden', marginBottom: '1.25rem',
        }}>
          {/* Header Strava */}
          <div style={{ padding: '1rem 1.25rem .75rem', borderBottom: '1px solid rgba(252,76,2,.15)', display: 'flex', alignItems: 'center', gap: '.75rem' }}>
            <StravaLogo size={32} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: '.95rem', color: '#fff' }}>Données importées depuis Strava</div>
              <div style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.4)', marginTop: '.1rem' }}>Synchronisé le 20 juillet à 11h47</div>
            </div>
            <span style={{
              fontSize: '.7rem', fontWeight: 700, background: 'rgba(16,185,129,.15)',
              color: '#34D399', border: '1px solid rgba(16,185,129,.3)',
              borderRadius: 99, padding: '.25rem .7rem', whiteSpace: 'nowrap',
            }}>
              ✓ Synchronisé
            </span>
          </div>

          {/* Stats */}
          <div style={{ padding: '.5rem 1.25rem 1rem' }}>
            {[
              { label: 'Distance',      value: '12,4 km',    icon: '📍' },
              { label: 'Temps total',   value: '58 min 32 s', icon: '⏱' },
              { label: 'Allure moyenne',value: "4'43\"/km",   icon: '⚡' },
              { label: 'FC moyenne',    value: '158 bpm',    icon: '❤️' },
              { label: 'FC max',        value: '174 bpm',    icon: '🔴' },
              { label: 'Dénivelé +',   value: '+145 m',      icon: '⛰️' },
            ].map(({ label, value, icon }, i) => (
              <div key={i} style={{ ...statRow, ...(i === 5 ? { borderBottom: 'none' } : {}) }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                  <span style={{ fontSize: '.85rem', width: 22 }}>{icon}</span>
                  <span style={{ fontSize: '.85rem', color: 'rgba(255,255,255,.55)' }}>{label}</span>
                </div>
                <span style={{ fontWeight: 700, fontSize: '.92rem', color: '#fff' }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Footer Strava wordmark */}
          <div style={{ padding: '.5rem 1.25rem .875rem', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
            <div style={{ height: 1, flex: 1, background: 'rgba(252,76,2,.2)' }} />
            <span style={{ fontSize: '.68rem', fontWeight: 800, color: STRAVA_ORANGE, letterSpacing: '.12em', textTransform: 'uppercase' }}>
              Powered by STRAVA
            </span>
            <div style={{ height: 1, flex: 1, background: 'rgba(252,76,2,.2)' }} />
          </div>
        </div>

        {/* RPE */}
        <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, padding: '1.1rem 1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'rgba(255,255,255,.3)', marginBottom: '.75rem' }}>
            Intensité perçue (RPE)
          </div>
          <div style={{ display: 'flex', gap: '.35rem', marginBottom: '.5rem' }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} style={{ flex: 1, height: 28, borderRadius: 6, background: i < 5 ? '#10B981' : 'rgba(255,255,255,.08)', transition: '.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: i === 4 ? '.72rem' : 0, fontWeight: 800, color: '#fff' }}>
                {i === 4 ? '5' : ''}
              </div>
            ))}
          </div>
          <div style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.4)', textAlign: 'center' }}>
            5 / 10 — Effort modéré, bonne récupération active
          </div>
        </div>

        {/* Bouton valider */}
        <button style={{
          width: '100%', padding: '1rem', border: 'none', borderRadius: 14,
          background: 'linear-gradient(135deg, #8B2FC9, #E8237A)',
          color: '#fff', fontWeight: 800, fontSize: '1rem', cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(139,47,201,.4)', fontFamily: 'inherit',
        }}>
          ✅ Valider la séance
        </button>

      </div>
    </div>
  )
}
