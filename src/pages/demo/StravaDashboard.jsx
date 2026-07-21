// Page de démonstration — carte Strava sur le dashboard athlète

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

function StatPill({ label, value }) {
  return (
    <div style={{ background: 'rgba(255,255,255,.05)', borderRadius: 10, padding: '.55rem .75rem', textAlign: 'center', flex: 1, minWidth: 70 }}>
      <div style={{ fontSize: '.62rem', color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.2rem' }}>{label}</div>
      <div style={{ fontSize: '.88rem', fontWeight: 700, color: '#fff' }}>{value}</div>
    </div>
  )
}

export default function DemoStravaDashboard() {
  return (
    <div style={{ minHeight: '100vh', background: '#09090F', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '2rem 1.25rem' }}>

        {/* Salutation */}
        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{ fontSize: '.875rem', color: 'rgba(255,255,255,.45)', marginBottom: '.25rem' }}>Bonjour 👋</div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Marine !</h1>
        </div>

        {/* Stats cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '.75rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Cette semaine', value: '3/5' },
            { label: 'Jours avant course', value: '42' },
            { label: 'Objectif', value: 'Semi' },
          ].map(({ label, value }, i) => (
            <div key={i} style={{ background: i === 1 ? 'linear-gradient(135deg,#8B2FC9,#E8237A)' : 'rgba(255,255,255,.05)', borderRadius: 14, padding: '1rem .875rem', textAlign: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: '1.35rem', marginBottom: '.2rem' }}>{value}</div>
              <div style={{ fontSize: '.68rem', color: i === 1 ? 'rgba(255,255,255,.7)' : 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Semaine en cours */}
        <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, padding: '1.1rem 1.25rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.75rem' }}>
            <span style={{ fontWeight: 700, fontSize: '.88rem' }}>Semaine en cours</span>
            <span style={{ fontSize: '.72rem', fontWeight: 700, background: 'rgba(139,47,201,.2)', color: '#C084FC', borderRadius: 99, padding: '.18rem .55rem' }}>3/5</span>
          </div>
          <div style={{ height: 6, background: 'rgba(255,255,255,.08)', borderRadius: 99, marginBottom: '.875rem', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: '60%', background: 'linear-gradient(90deg,#8B2FC9,#E8237A)', borderRadius: 99 }} />
          </div>
          {[
            { jour: 'Lundi',   titre: 'Endurance fondamentale 40min', icon: '✅' },
            { jour: 'Mercredi',titre: 'Fractionné 8×400m',            icon: '✅' },
            { jour: 'Vendredi',titre: 'Tempo / Seuil 35min',          icon: '✅' },
            { jour: 'Samedi', titre: 'Sortie longue 60min',           icon: '⏳' },
            { jour: 'Dimanche',titre: 'Récupération active 30min',    icon: '⏳' },
          ].map(({ jour, titre, icon }, i) => (
            <div key={i} style={{ display: 'flex', gap: '.6rem', alignItems: 'center', padding: '.35rem 0', fontSize: '.85rem' }}>
              <span>{icon}</span>
              <span style={{ color: 'rgba(255,255,255,.5)', minWidth: 70, fontSize: '.78rem' }}>{jour}</span>
              <span style={{ color: icon === '✅' ? 'rgba(255,255,255,.8)' : 'rgba(255,255,255,.45)' }}>{titre}</span>
            </div>
          ))}
        </div>

        {/* ──────────── CARTE STRAVA ──────────── */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontWeight: 700, fontSize: '.88rem', marginBottom: '.6rem', color: 'rgba(255,255,255,.65)' }}>
            Dernière activité
          </div>
          <div style={{
            background: 'linear-gradient(135deg, rgba(252,76,2,.12) 0%, rgba(252,76,2,.04) 100%)',
            border: '1.5px solid rgba(252,76,2,.3)',
            borderRadius: 16, overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{ padding: '.875rem 1.1rem .7rem', display: 'flex', alignItems: 'center', gap: '.75rem', borderBottom: '1px solid rgba(252,76,2,.12)' }}>
              <StravaLogo size={28} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '.88rem', color: '#fff', marginBottom: '.1rem' }}>Sortie longue</div>
                <div style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.38)' }}>Dim 20 juil. · Il y a 2 heures</div>
              </div>
              <span style={{ fontSize: '.68rem', fontWeight: 700, color: '#34D399', background: 'rgba(16,185,129,.12)', border: '1px solid rgba(16,185,129,.25)', borderRadius: 99, padding: '.18rem .55rem', whiteSpace: 'nowrap' }}>
                ✓ Synchro
              </span>
            </div>

            {/* Stat pills */}
            <div style={{ padding: '.875rem 1.1rem', display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
              <StatPill label="Distance"  value="12,4 km" />
              <StatPill label="Durée"     value="58:32" />
              <StatPill label="Allure"    value={"4'43\"/km"} />
              <StatPill label="FC moy"    value="158 bpm" />
            </div>

            {/* Mini stat bar FC */}
            <div style={{ padding: '0 1.1rem .875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.3rem' }}>
                <span style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.35)' }}>Fréquence cardiaque</span>
                <span style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.35)' }}>FC max : 174 bpm</span>
              </div>
              <div style={{ height: 5, background: 'rgba(255,255,255,.08)', borderRadius: 99, overflow: 'hidden', position: 'relative' }}>
                <div style={{ position: 'absolute', left: '55%', width: '22%', height: '100%', background: '#F59E0B', borderRadius: 99, opacity: .9 }} />
                <div style={{ position: 'absolute', left: '77%', width: '10%', height: '100%', background: '#EF4444', borderRadius: 99 }} />
                <div style={{ position: 'absolute', left: 0, width: '55%', height: '100%', background: '#10B981', borderRadius: 99 }} />
              </div>
              <div style={{ display: 'flex', gap: '.75rem', marginTop: '.4rem' }}>
                {[{ c: '#10B981', l: 'Zone 2' }, { c: '#F59E0B', l: 'Zone 3' }, { c: '#EF4444', l: 'Zone 4' }].map(({ c, l }, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '.25rem' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: c }} />
                    <span style={{ fontSize: '.62rem', color: 'rgba(255,255,255,.4)' }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Dénivelé */}
            <div style={{ padding: '.5rem 1.1rem .875rem', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <span style={{ fontSize: '.8rem' }}>⛰️</span>
              <span style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.45)' }}>Dénivelé positif :</span>
              <span style={{ fontSize: '.85rem', fontWeight: 700, color: '#fff' }}>+145 m</span>
              <div style={{ marginLeft: 'auto', fontSize: '.68rem', fontWeight: 700, color: STRAVA_ORANGE, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                STRAVA ↗
              </div>
            </div>
          </div>
        </div>

        {/* Message coach */}
        <div style={{ background: 'linear-gradient(135deg, rgba(139,47,201,.12), rgba(232,35,122,.06))', border: '1px solid rgba(139,47,201,.25)', borderRadius: 14, padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-start' }}>
            <img src="/Coach.JPG" alt="Alexis" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid rgba(139,47,201,.4)' }}
              onError={e => { e.currentTarget.style.display = 'none' }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '.82rem', marginBottom: '.3rem', color: '#C084FC' }}>Alexis · Ce mois-ci</div>
              <p style={{ fontSize: '.88rem', lineHeight: 1.6, margin: 0, color: 'rgba(255,255,255,.75)', fontStyle: 'italic' }}>
                "Super sortie longue Marine ! Tes zones cardio sont exactement où elles doivent être pour cette période de préparation. 💪"
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
