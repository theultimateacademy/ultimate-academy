import { useState, useEffect, useMemo } from 'react'

/* ─── Type colors ───────────────────────────────────────────────────── */
const TYPE_COLORS = {
  'Isométrique':     '#8B2FC9',
  'Concentrique':    '#E8237A',
  'Excentrique':     '#0EA5E9',
  'Polyarticulaire': '#10B981',
  'Plyométrique':    '#F59E0B',
  'Stabilisation':   '#6366F1',
  'Proprioception':  '#EC4899',
  'Neuromusculaire': '#F97316',
  'Mobilité':        '#6B7280',
  'Étirement actif': '#14B8A6',
}

/* ─── Rest timer ────────────────────────────────────────────────────── */
function RestTimer({ onClose }) {
  const [dur,     setDur]     = useState(null)
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    if (dur === null || seconds <= 0) return
    const t = setTimeout(() => setSeconds(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [dur, seconds])

  function start(d) { setDur(d); setSeconds(d) }
  function stop()   { setDur(null); setSeconds(0) }

  const running = dur !== null && seconds > 0
  const done    = dur !== null && seconds === 0

  return (
    <div style={{
      position: 'fixed', bottom: 80, right: 16, zIndex: 200,
      background: 'var(--surface)', borderRadius: 20, padding: '1.25rem',
      boxShadow: '0 8px 32px rgba(0,0,0,.3)', border: '1px solid var(--border)',
      minWidth: 156, textAlign: 'center'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.75rem' }}>
        <span style={{ fontSize: '.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>⏱ Récupération</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1rem' }}>✕</button>
      </div>
      {done ? (
        <>
          <div style={{ fontSize: '1.75rem', marginBottom: '.35rem' }}>✅</div>
          <div style={{ fontSize: '.85rem', fontWeight: 700, marginBottom: '.6rem' }}>C'est parti !</div>
          <button className="btn btn-ghost btn-sm btn-full" onClick={stop}>Relancer</button>
        </>
      ) : running ? (
        <>
          <div style={{
            fontSize: '2.5rem', fontWeight: 900, lineHeight: 1,
            color: seconds <= 10 ? 'var(--error)' : 'var(--primary)',
            marginBottom: '.35rem'
          }}>
            {seconds}s
          </div>
          <div style={{ height: 5, background: 'var(--border)', borderRadius: 99, marginBottom: '.75rem', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 99,
              background: seconds <= 10 ? 'var(--error)' : 'var(--primary)',
              width: `${(seconds / dur) * 100}%`, transition: 'width 1s linear'
            }} />
          </div>
          <button className="btn btn-ghost btn-sm btn-full" onClick={stop}>Annuler</button>
        </>
      ) : (
        <div style={{ display: 'flex', gap: '.4rem' }}>
          {[30, 60, 90].map(d => (
            <button key={d} onClick={() => start(d)}
              style={{
                flex: 1, padding: '.5rem .2rem', borderRadius: 10,
                border: '1.5px solid var(--border)', background: 'var(--surface-2)',
                cursor: 'pointer', fontFamily: 'inherit', fontSize: '.85rem', fontWeight: 700
              }}>
              {d}s
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Exercise illustration ─────────────────────────────────────────── */
function ExerciseIllustration({ emoji, type }) {
  const color = TYPE_COLORS[type] || 'var(--primary)'
  return (
    <div style={{
      width: 64, height: 64, borderRadius: 16, flexShrink: 0,
      background: `linear-gradient(135deg, ${color}18 0%, ${color}38 100%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '1.75rem', border: `1.5px solid ${color}28`,
      boxShadow: `0 3px 12px ${color}20`,
    }}>
      {emoji}
    </div>
  )
}

/* ─── Exercise Modal ────────────────────────────────────────────────── */
function ExerciseModal({ exercise, sessionColor, onClose }) {
  const typeColor = TYPE_COLORS[exercise.type] || sessionColor

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-handle" />
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flex: 1 }}>
            <ExerciseIllustration emoji={exercise.emoji} type={exercise.type} />
            <div>
              <h3 style={{ marginBottom: '.35rem' }}>{exercise.name}</h3>
              <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                <span style={{
                  padding: '.2rem .6rem', borderRadius: 99, fontSize: '.72rem', fontWeight: 700,
                  background: typeColor + '20', color: typeColor, border: `1px solid ${typeColor}30`
                }}>
                  {exercise.type}
                </span>
                <span style={{
                  padding: '.2rem .6rem', borderRadius: 99, fontSize: '.72rem', fontWeight: 700,
                  background: 'var(--surface-2)', color: 'var(--text-muted)'
                }}>
                  {exercise.sets} × {exercise.reps}
                </span>
              </div>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} style={{ flexShrink: 0 }}>✕</button>
        </div>

        {/* Muscles */}
        <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          {exercise.muscles.map(m => (
            <span key={m} style={{
              padding: '.25rem .65rem', borderRadius: 99, fontSize: '.78rem', fontWeight: 600,
              background: sessionColor + '15', color: sessionColor, border: `1px solid ${sessionColor}25`
            }}>
              🎯 {m}
            </span>
          ))}
        </div>

        {/* Technique */}
        <h4 style={{ marginBottom: '.75rem' }}>Technique</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem', marginBottom: '1.25rem' }}>
          {exercise.technique.map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-start',
              padding: '.75rem', background: 'var(--surface-2)', borderRadius: 'var(--radius)' }}>
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: typeColor + '25',
                color: typeColor, fontWeight: 800, fontSize: '.75rem', display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0 }}>
                {i + 1}
              </span>
              <span style={{ fontSize: '.9rem', lineHeight: 1.55 }}>{t}</span>
            </div>
          ))}
        </div>

        {/* Runner tip */}
        <div style={{ padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '1.25rem',
          background: `linear-gradient(135deg, ${sessionColor}0D, ${sessionColor}1A)`,
          border: `1.5px solid ${sessionColor}25` }}>
          <div style={{ fontWeight: 700, marginBottom: '.4rem', fontSize: '.875rem', color: sessionColor }}>
            🏃 Pourquoi c'est essentiel pour le coureur
          </div>
          <p style={{ fontSize: '.875rem', lineHeight: 1.65 }}>{exercise.runnerTip}</p>
        </div>

        {/* Progression */}
        <div style={{ padding: '.875rem', borderRadius: 'var(--radius)', background: 'var(--surface-2)' }}>
          <div style={{ fontWeight: 700, marginBottom: '.35rem', fontSize: '.85rem' }}>
            📈 Progression suggérée
          </div>
          <p style={{ fontSize: '.875rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
            {exercise.progression}
          </p>
        </div>
      </div>
    </div>
  )
}

/* ─── Exercise Card (horizontal) ────────────────────────────────────── */
function ExerciseCard({ exercise, sessionColor, onSelect }) {
  const typeColor = TYPE_COLORS[exercise.type] || sessionColor

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '.875rem',
      padding: '.875rem', background: 'var(--surface-2)', borderRadius: 'var(--radius)',
      cursor: 'pointer', transition: 'transform .15s, box-shadow .15s'
    }}
      onClick={() => onSelect(exercise)}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>
      <ExerciseIllustration emoji={exercise.emoji} type={exercise.type} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, marginBottom: '.25rem' }}>{exercise.name}</div>
        <div style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginBottom: '.4rem',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {exercise.shortDesc}
        </div>
        <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
          <span style={{ padding: '.12rem .5rem', borderRadius: 99, fontSize: '.68rem', fontWeight: 700,
            background: typeColor + '18', color: typeColor }}>
            {exercise.type}
          </span>
          {exercise.muscles.slice(0, 2).map(m => (
            <span key={m} style={{ padding: '.12rem .5rem', borderRadius: 99, fontSize: '.68rem', fontWeight: 600,
              background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
              {m}
            </span>
          ))}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontWeight: 800, fontSize: '.9rem', color: sessionColor }}>{exercise.sets}</div>
        <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>×&nbsp;{exercise.reps}</div>
      </div>
    </div>
  )
}

/* ─── Sessions data ─────────────────────────────────────────────────── */
const SESSIONS = [
  {
    id: 'gainage', name: 'Gainage & Stabilité', emoji: '🧘', duration: '25–35 min',
    subtitle: 'Core profond · équilibre · prévention lombaires',
    color: '#8B2FC9',
    exercises: [
      {
        name: 'Planche frontale', emoji: '🤸', type: 'Isométrique',
        muscles: ['Core', 'Transverse', 'Épaules'],
        sets: '3', reps: '30–60 sec',
        shortDesc: 'Sur avant-bras, corps rigide de la tête aux talons',
        technique: [
          'Nombril rentré, fessiers contractés, neutraliser le bas du dos',
          'Tête dans le prolongement de la colonne, pas de cambrure excessive',
          'Respiration abdominale régulière pendant toute la durée',
        ],
        runnerTip: 'Un core fort réduit les oscillations latérales du bassin à chaque foulée. Des études montrent jusqu\'à 15% d\'économie d\'énergie sur longue distance avec un core bien entraîné.',
        progression: 'Quand 60 sec sont tenues sans compensation : passer à la planche avec toucher d\'épaule alternée (sans laisser les hanches bouger).',
      },
      {
        name: 'Dead Bug', emoji: '🪲', type: 'Isométrique',
        muscles: ['Core', 'Transverse', 'Stabilisateurs'],
        sets: '3', reps: '10 / côté',
        shortDesc: 'Sur le dos, abaisser bras et jambe opposés sans décoller le bas du dos',
        technique: [
          'Coller le bas du dos au sol pendant TOUT le mouvement, c\'est le critère de réussite',
          'Descente lente et contrôlée : 3 sec à abaisser, 3 sec à remonter',
          'Expirer à chaque abaissement de jambe pour faciliter le recrutement du transverse',
        ],
        runnerTip: 'Le transverse est le muscle le plus profond du core et le principal stabilisateur de la colonne pendant la course. Le Dead Bug l\'isole parfaitement en situation de charge.',
        progression: 'Ajouter un élastique en repoussant les bras vers le haut (résistance anti-extension) quand 10/côté sont parfaitement maîtrisés.',
      },
      {
        name: 'Bird Dog', emoji: '🐦', type: 'Stabilisation',
        muscles: ['Core', 'Érecteurs', 'Fessiers'],
        sets: '3', reps: '12 / côté',
        shortDesc: 'À quatre pattes, étendre bras droit + jambe gauche simultanément',
        technique: [
          'Hanches parfaitement horizontales, placer une bouteille d\'eau sur les lombes pour vérifier',
          'Extension complète sans creuser le bas du dos',
          'Tenir 2 sec en extension avant de ramener lentement',
        ],
        runnerTip: 'Renforce les érecteurs du rachis et le grand fessier dans leur action coordonnée, exactement le schéma moteur utilisé à chaque foulée lors de l\'extension de hanche.',
        progression: 'Ajouter un élastique léger à la cheville pour augmenter l\'activation fessière. Puis ajouter un léger mouvement de "crunch" du coude vers le genou en phase de retour.',
      },
      {
        name: 'Planche latérale', emoji: '📐', type: 'Isométrique',
        muscles: ['Obliques', 'Core', 'Abducteurs'],
        sets: '3', reps: '25–40 sec / côté',
        shortDesc: 'Sur avant-bras latéral, corps aligné de la tête aux pieds',
        technique: [
          'Hanches levées, ne jamais les laisser s\'affaisser vers le sol',
          'Corps en ligne droite : oreille, épaule, hanche, cheville alignés',
          'Contracter les fessiers pour solidifier la position',
        ],
        runnerTip: 'Les obliques latéraux stabilisent le tronc lors des rotations du balancement des bras. Un oblique faible force une compensation par les muscles paravertébraux, source de lombalgies chez le coureur.',
        progression: 'Lever la jambe supérieure 20 cm et la tenir pour activer simultanément abducteurs et obliques. Puis ajouter un mouvement de bras (rotation vers le sol).',
      },
      {
        name: 'Superman hold', emoji: '🦸', type: 'Isométrique',
        muscles: ['Érecteurs', 'Fessiers', 'Trapèzes'],
        sets: '3', reps: '10 rep · tenir 3 sec',
        shortDesc: 'À plat ventre, lever bras et jambes et maintenir la position',
        technique: [
          'Lever lentement en contractant d\'abord les fessiers puis les dorsaux',
          'Regard vers le sol pour garder le cou en position neutre',
          'Tenir 3 sec en haut avec une contraction maximale',
        ],
        runnerTip: 'Renforce la chaîne postérieure complète (érecteurs + fessiers + ischio) dans sa fonction anti-gravité, précisément ce qui se contracte pour maintenir la posture de course lors de la fatigue des derniers kilomètres.',
        progression: 'Superman avec bras et jambes alternés (bras droit + jambe gauche) pour augmenter l\'instabilité et la demande proprioceptive.',
      },
      {
        name: 'Équilibre unipodal', emoji: '🦩', type: 'Proprioception',
        muscles: ['Cheville', 'Core', 'Stabilisateurs genou'],
        sets: '3', reps: '30–45 sec / pied',
        shortDesc: 'Debout sur un pied, maintenir l\'équilibre en progressant yeux fermés',
        technique: [
          'Commencer yeux ouverts sur sol dur, puis progresser yeux fermés',
          'Genou légèrement fléchi sur la jambe de support (pas à bloc)',
          'Rester actif sur la cheville : micro-corrections permanentes',
        ],
        runnerTip: 'La proprioception est le premier système à défaillir lors de la fatigue. L\'améliorer réduit de 40–50% le risque d\'entorse de cheville sur terrain technique, surtout en fin de course.',
        progression: 'Surface instable (coussin de proprioception, step), puis ajouter des mouvements de bras ou des lancers de balle contre un mur.',
      },
    ]
  },
  {
    id: 'force', name: 'Force & Puissance', emoji: '💪', duration: '35–45 min',
    subtitle: 'Fessiers · quadriceps · chaîne postérieure',
    color: '#E8237A',
    exercises: [
      {
        name: 'Hip Thrust', emoji: '🍑', type: 'Concentrique',
        muscles: ['Fessiers', 'Ischio-jambiers', 'Core'],
        sets: '4', reps: '12–15 rep',
        shortDesc: 'Dos sur banc, extension complète du bassin, serrer fort les fessiers au sommet',
        technique: [
          'Pieds à plat au sol, largeur des épaules, genoux à 90° en position haute',
          'Extension COMPLÈTE du bassin, pas de cambrure lombaire excessive',
          'Tenir 1 sec au sommet en contractant les fessiers à l\'intensité maximale',
        ],
        runnerTip: 'L\'extension de hanche est le mouvement principal de propulsion en course. Un grand fessier fort = propulsion plus puissante, moins d\'effort pour le mollet et la rotule. Les études associent la force du fessier à une réduction de 30% des douleurs de genou chez les coureurs.',
        progression: 'Haltère ou barre posée sur les cuisses, puis hip thrust unilatéral (single leg) pour corriger les asymétries gauche/droite.',
      },
      {
        name: 'Squat goblet', emoji: '🏋️', type: 'Polyarticulaire',
        muscles: ['Quadriceps', 'Fessiers', 'Core', 'Ischio'],
        sets: '3', reps: '12–15 rep',
        shortDesc: 'Tenir un poids contre la poitrine, descendre en squat profond',
        technique: [
          'Talons au sol toute la durée du mouvement',
          'Descendre jusqu\'à ce que les cuisses soient parallèles au sol minimum',
          'Genoux dans l\'axe des orteils, ne JAMAIS les laisser rentrer vers l\'intérieur',
        ],
        runnerTip: 'Le squat renforce les quadriceps dans leur rôle d\'amortisseur de l\'impact. Un quadriceps fort réduit la pression sur le cartilage rotulien, le syndrome fémoro-patellaire ("genou du coureur") est 3× moins fréquent chez les coureurs qui squattent régulièrement.',
        progression: 'Squat avec barre (back squat ou goblet plus lourd), puis split squat bulgare pour l\'unipodal.',
      },
      {
        name: 'Romanian Deadlift', emoji: '🔱', type: 'Polyarticulaire',
        muscles: ['Ischio-jambiers', 'Fessiers', 'Érecteurs'],
        sets: '3', reps: '10–12 rep',
        shortDesc: 'Flexion sur la hanche avec charge, dos droit, charges le long des jambes',
        technique: [
          'Pousser les hanches vers l\'arrière (pas fléchir les genoux comme un squat)',
          'Haltères ou barre proches des jambes, descendre jusqu\'à mi-tibia',
          'Remonter en "tirant" avec les fessiers et les ischio, pas avec le dos',
        ],
        runnerTip: 'Les ischio-jambiers sont le groupe musculaire le plus souvent blessé en course. Le RDL les renforce EXCENTRICALLY (allongés sous charge), exactement dans la position la plus vulnérable lors de la phase de récupération de la foulée à haute vitesse.',
        progression: 'Single-leg Romanian Deadlift pour corriger les asymétries et développer la stabilité unipodal, essentielle pour les coureurs.',
      },
      {
        name: 'Step-up unilatéral', emoji: '🪜', type: 'Concentrique',
        muscles: ['Quadriceps', 'Fessiers', 'Stabilisateurs'],
        sets: '3', reps: '10–12 / jambe',
        shortDesc: 'Monter sur une marche en poussant UNIQUEMENT sur la jambe avant',
        technique: [
          'NE PAS se projeter avec la jambe arrière, 100% de la force vient de la jambe sur la marche',
          'Hauteur de marche : genou à 90° ou légèrement moins (trop haut = compensation)',
          'Descente contrôlée, ne pas "tomber" vers le bas (phase excentrique utile)',
        ],
        runnerTip: 'La course est un sport unilatéral par essence (une jambe à la fois). Cet exercice révèle les asymétries gauche/droite : une différence > 10% de force est un facteur de risque de blessure reconnu. Identifier et corriger l\'asymétrie AVANT la blessure.',
        progression: 'Ajouter des haltères, augmenter la hauteur de la marche ou ralentir la descente (excentrique).',
      },
      {
        name: 'Fentes marchées', emoji: '🚶', type: 'Polyarticulaire',
        muscles: ['Quadriceps', 'Fessiers', 'Core', 'Ischio'],
        sets: '3', reps: '10 / jambe',
        shortDesc: 'Avancer en enchaînant des fentes profondes, genou arrière près du sol',
        technique: [
          'Grand pas vers l\'avant, genou avant dans l\'axe du pied (ni en dedans, ni en dehors)',
          'Genou arrière à 2–3 cm du sol, pas de contact',
          'Buste parfaitement droit, regard devant, ne pas se pencher en avant',
        ],
        runnerTip: 'Les fentes marchées répliquent la mécanique de la foulée tout en développant la mobilité de hanche, la force du quadriceps et la stabilité. C\'est probablement l\'exercice de renforcement le plus transférable à la course.',
        progression: 'Ajouter des haltères en main, puis une rotation du buste du côté de la jambe avant (coordination suplémentaire).',
      },
      {
        name: 'Pompes', emoji: '🤲', type: 'Polyarticulaire',
        muscles: ['Pectoraux', 'Épaules', 'Triceps', 'Core'],
        sets: '3', reps: 'Max contrôlé (qualité > quantité)',
        shortDesc: 'Corps rigide des talons à la tête, descendre jusqu\'à 2 cm du sol',
        technique: [
          'Corps rigide comme une planche, hanches ni affaissées ni en l\'air',
          'Coudes à 45° du corps (ni perpendiculaires, ni collés)',
          'Amplitude complète : poitrine à 2 cm du sol en bas, bras tendus en haut',
        ],
        runnerTip: 'Les bras jouent un rôle locomoteur en course : ils contrebalancent les jambes et contribuent à la propulsion. Un haut du corps fort réduit la fatigue musculaire lors des derniers kilomètres et maintient une mécanique de bras efficace sous la fatigue.',
        progression: 'Pompes déclinées (pieds surélevés sur chaise, 30 cm) pour cibler plus les épaules et le haut du pectoral. Puis anneaux de gymnaste pour l\'instabilité.',
      },
    ]
  },
  {
    id: 'excentrique', name: 'Excentrique & Prévention', emoji: '🛡️', duration: '30–40 min',
    subtitle: 'Ischio-jambiers · mollets · tendons · prévention blessures',
    color: '#0EA5E9',
    exercises: [
      {
        name: 'Nordic Curl', emoji: '🦵', type: 'Excentrique',
        muscles: ['Ischio-jambiers', 'Mollets', 'Genoux'],
        sets: '3', reps: '4–8 rep (qualité absolue)',
        shortDesc: 'Genoux au sol, tomber lentement vers l\'avant en résistant avec les ischio',
        technique: [
          'Partenaire tient les chevilles ou utiliser une barre fixe / meuble lourd',
          'Descente ultra-lente : 4–6 secondes pour descendre d\'une planche verticale à horizontale',
          'Se rattraper avec les mains en bas, utiliser les bras pour remonter (phase concentrique secondaire)',
        ],
        runnerTip: 'Le Nordic Curl est l\'exercice #1 scientifiquement validé pour prévenir les blessures ischio-jambières. Une méta-analyse de 2019 montre une réduction de 51% des déchirures chez les athlètes qui l\'incluent régulièrement. Incontournable pour tout coureur sérieux.',
        progression: 'Commencer à 2–3 reps seulement (ne pas vouloir aller trop vite, les courbatures sont intenses au début). Progresser de 1 rep par séance. Objectif à long terme : 3 × 10 rep.',
      },
      {
        name: 'Calf raise excentrique', emoji: '🦶', type: 'Excentrique',
        muscles: ['Mollets', 'Soléaire', 'Tendon Achille'],
        sets: '3', reps: '15 rep · descente 3 sec',
        shortDesc: 'Monter sur deux pieds, descendre sur un seul pied en 3 secondes',
        technique: [
          'Monter sur les DEUX pieds (phase concentrique assistée)',
          'Lever l\'autre pied et descendre sur UN seul pied en comptant 3 sec',
          'Amplitude totale : talon descend SOUS le niveau de la marche (stretch maximal)',
        ],
        runnerTip: 'Le tendon d\'Achille supporte jusqu\'à 6–8× le poids du corps à la course. La tendinopathie d\'Achille est la blessure chronique la plus répandue chez les coureurs de fond. Le protocole excentrique de Alfredson (validé cliniquement) guérit 80% des cas en 12 semaines.',
        progression: 'Ajouter du poids (sac à dos chargé, haltère) quand 3 × 15 sont réalisés sans douleur. Objectif progressif sur 8–12 semaines.',
      },
      {
        name: 'Squat excentrique 5 sec', emoji: '⬇️', type: 'Excentrique',
        muscles: ['Quadriceps', 'Rotule', 'Fessiers'],
        sets: '3', reps: '10 rep · descente 5 sec',
        shortDesc: 'Squat normal en descente 5 secondes strictement comptées',
        technique: [
          'Compter 5 sec mentalement à la descente, ne jamais accélérer',
          'Remontée explosive sur 1 sec (concentrique normale)',
          'Contrôle absolu des genoux pendant la descente lente',
        ],
        runnerTip: 'Le syndrome fémoro-patellaire ("genou du coureur") est la blessure de surcharge n°1. Le quadriceps excentrique est le traitement non-chirurgical le plus efficace, recommandé en kinésithérapie. En prévention, il rend le tendon patellaire 30% plus résilient.',
        progression: 'Single-leg squat excentrique (Bulgarian split squat excentrique) pour augmenter la charge sur chaque jambe séparément.',
      },
      {
        name: 'Hip Thrust excentrique', emoji: '⏱️', type: 'Excentrique',
        muscles: ['Fessiers', 'Ischio-jambiers'],
        sets: '3', reps: '12 rep · descente 3–4 sec',
        shortDesc: 'Hip thrust avec descente très lente et résistance active',
        technique: [
          'Monter normalement (concentrique standard)',
          'Résister activement à la gravité pendant 3–4 sec à la descente',
          'Ne pas relâcher la tension des fessiers pendant la phase excentrique',
        ],
        runnerTip: 'Les blessures de la chaîne postérieure (fessier, ischio) surviennent le plus souvent lors de la DÉCÉLÉRATION (phase excentrique, atterrissage). Renforcer excentrically prépare ces muscles exactement pour cette contrainte.',
        progression: 'Single-leg hip thrust excentrique, puis ajouter charge (barre ou haltère) sur les cuisses.',
      },
      {
        name: 'Fente excentrique contrôlée', emoji: '🧊', type: 'Excentrique',
        muscles: ['Quadriceps', 'Ischio-jambiers', 'Mollets'],
        sets: '3', reps: '8 / jambe · descente 4 sec',
        shortDesc: 'Descente de la fente en 4 secondes, remontée explosive',
        technique: [
          'Descendre en 4 sec, genou avant parfaitement dans l\'axe du pied',
          'Remontée explosive (1 sec), utiliser toute la puissance disponible',
          'Qualité absolue > nombre de répétitions',
        ],
        runnerTip: 'La fente excentrique simule la phase de freinage et d\'absorption des impacts. Idéale pour préparer les descentes en trail ou les portions descendantes sur route, les deux situations où les douleurs musculaires post-course sont les plus intenses.',
        progression: 'Fente bulgare excentrique (pied arrière surélevé) pour maximiser la charge sur la jambe avant.',
      },
    ]
  },
  {
    id: 'explosivite', name: 'Explosivité & Vitesse', emoji: '⚡', duration: '25–35 min',
    subtitle: 'Puissance · neuromusculaire · vitesse de foulée',
    color: '#F59E0B',
    exercises: [
      {
        name: 'Box Jump', emoji: '📦', type: 'Plyométrique',
        muscles: ['Quadriceps', 'Mollets', 'Fessiers'],
        sets: '4', reps: '6–8 rep (qualité explosive)',
        shortDesc: 'Saut puissant sur une caisse, réception souple, hanche fléchie',
        technique: [
          'Contre-mouvement rapide : flexion hanches + genoux puis explosion immédiate',
          'Bras actifs : swinguer vers le haut pendant le saut pour aider la propulsion',
          'Réception silencieuse sur la pointe des pieds, genoux fléchis, pas de claquement',
        ],
        runnerTip: 'La puissance développée au Box Jump se traduit directement en vitesse de foulée. Après 8 semaines de plyométrie (2×/semaine), les études documentent une amélioration de 3–5% de la vitesse maximale et de l\'économie de course.',
        progression: 'Augmenter la hauteur progressivement. Depth Jump (sauter d\'une caisse + rebondir immédiatement) pour un entraînement de puissance maximale.',
      },
      {
        name: 'Squat Jump', emoji: '🚀', type: 'Plyométrique',
        muscles: ['Quadriceps', 'Mollets', 'Core'],
        sets: '4', reps: '8–10 rep',
        shortDesc: 'Squat complet puis impulsion explosive, réception en squat',
        technique: [
          'Descendre jusqu\'à 90° (full squat), puis exploser IMMÉDIATEMENT sans pause',
          'Bras en swing de bas en haut pendant la poussée pour maximiser la hauteur',
          'Réception sur la pointe des pieds d\'abord, puis talons, amortissement progressif',
        ],
        runnerTip: 'Améliore la "raideur" tendineuse du quadriceps. Un tendon plus élastique (spring-mass model) restitue mieux l\'énergie stockée à l\'impact, comme un ressort. Cela améliore directement l\'économie de course.',
        progression: 'Jumelles de chevilles légères (0,5–1 kg). Puis tuck jump (ramener les genoux vers la poitrine en l\'air).',
      },
      {
        name: 'Fentes sautées alternées', emoji: '🤸', type: 'Plyométrique',
        muscles: ['Quadriceps', 'Fessiers', 'Coordination'],
        sets: '3', reps: '10 / jambe',
        shortDesc: 'Fente profonde, saut explosif, changement de jambe en l\'air',
        technique: [
          'Descendre profondément dans la fente AVANT de sauter (précharge importante)',
          'Bras en opposition des jambes pour l\'équilibre et la puissance',
          'Réception directement en fente de l\'autre côté, sans pause',
        ],
        runnerTip: 'Développe la puissance et la coordination alternée des membres inférieurs, la signature biomécanique exacte de la course. Contrairement au squat jump, cet exercice reproduit le schéma moteur unipodal.',
        progression: 'Ajouter un haltère léger (2 kg) dans chaque main. Puis lester avec un gilet pour augmenter la résistance.',
      },
      {
        name: 'Bounding', emoji: '🦘', type: 'Neuromusculaire',
        muscles: ['Chaîne postérieure', 'Mollets', 'Ischio-jambiers'],
        sets: '4', reps: '20 m × 4',
        shortDesc: 'Bonds exagérés en progressant, amplitude et hauteur maximales',
        technique: [
          'Poussée explosive sur chaque appui, chercher l\'amplitude maximale',
          'Genoux hauts, bras actifs en opposition des jambes',
          'Temps de contact au sol le plus court possible (ne pas "s\'appuyer" sur chaque appui)',
        ],
        runnerTip: 'Le bounding est l\'exercice de choix des sprinteurs et demi-fondeurs africains. Il améliore la "raideur" de la cheville (stiffness) et la coordination neuromusculaire de la chaîne propulsive. Des études montrent des gains de 2–4% d\'économie de course après 10 semaines.',
        progression: 'Bounding avec résistance (élastique fixé derrière le bassin et maintenu par un partenaire). Puis bounding en côte (5–8% pente).',
      },
      {
        name: 'Montée de genoux rapide', emoji: '🏃', type: 'Neuromusculaire',
        muscles: ['Fléchisseurs hanche', 'Core', 'Mollets'],
        sets: '4', reps: '20–30 sec',
        shortDesc: 'Montées de genoux à fréquence maximale en restant sur la pointe des pieds',
        technique: [
          'Rester sur la pointe des pieds TOUT LE TEMPS, ne jamais toucher avec le talon',
          'Genou monter jusqu\'à la hauteur des hanches minimum',
          'Bras actifs en opposition, poings fermés, coudes à 90°',
        ],
        runnerTip: 'La cadence de foulée (steps/min) est l\'un des principaux leviers d\'économie de course. La plupart des coureurs amateurs courent à 160–165 pas/min. La cible optimale est 170–180. Cet exercice entraîne le système neuromusculaire à une fréquence plus élevée.',
        progression: 'Augmenter la durée (45 sec, puis 60 sec). Faire sur une marche surélevée pour pré-activer les fléchisseurs de hanche.',
      },
    ]
  },
  {
    id: 'mobilite', name: 'Mobilité & Récupération', emoji: '🌊', duration: '20–30 min',
    subtitle: 'Hanches · cheville · colonne · récupération active',
    color: '#6B7280',
    exercises: [
      {
        name: '90/90 Hip Stretch', emoji: '🧘', type: 'Mobilité',
        muscles: ['Piriforme', 'Rotateurs externes hanche', 'Adducteurs'],
        sets: '3', reps: '60 sec / côté',
        shortDesc: 'Assis au sol, deux jambes à 90°, se pencher progressivement sur la jambe avant',
        technique: [
          'Jambe avant : cuisse perpendiculaire au tronc, jambe parallèle devant soi',
          'Jambe arrière : même configuration de l\'autre côté (comme un "Z" au sol)',
          'Se pencher doucement sur la jambe avant, buste droit, sans arrondir le dos',
        ],
        runnerTip: 'Un piriforme (muscle profond fessier) hypertendu comprime le nerf sciatique, source de douleurs qui irradient le long de la jambe jusqu\'au pied. Fréquent chez les coureurs à kilométrage élevé. Cet étirement est la solution la plus ciblée.',
        progression: 'Ajouter une légère pression des mains vers l\'avant pour approfondir l\'étirement progressivement au fil des semaines.',
      },
      {
        name: 'World\'s Greatest Stretch', emoji: '🌍', type: 'Mobilité',
        muscles: ['Hanches', 'Ischio-jambiers', 'Épaules', 'Colonne thoracique'],
        sets: '2', reps: '8 / côté lentement',
        shortDesc: 'Fente basse → main au sol → rotation thoracique bras vers plafond',
        technique: [
          'Partir en grande fente basse, main droite au sol (intérieur du pied avant)',
          'Rotation thoracique : bras gauche tendre vers le plafond, suivre des yeux',
          'Revenir, étendre la jambe avant (genou tendu) et toucher la pointe du pied',
        ],
        runnerTip: 'Surnommé "le meilleur étirement au monde pour les coureurs" par les physiothérapeutes. En un seul enchaînement, il adresse les 4 zones les plus raides chez le coureur : hanches, ischio-jambiers, colonne thoracique, cheville. Idéal en échauffement dynamique.',
        progression: 'Ajouter une pause de 3 sec à chaque position extrême. Puis charger légèrement une haltère dans la main levée.',
      },
      {
        name: 'Dorsiflexion cheville murale', emoji: '🦵', type: 'Mobilité',
        muscles: ['Cheville', 'Soléaire', 'Tendon Achille'],
        sets: '3', reps: '10–15 rep / pied',
        shortDesc: 'Pied devant un mur, genou toucher le mur sans lever le talon',
        technique: [
          'Commencer avec le pied à 5 cm du mur, progresser vers l\'avant semaine après semaine',
          'Talon IMPÉRATIVEMENT au sol pendant TOUT le mouvement',
          'Mesurer les progrès : distance pied-mur augmente avec les semaines',
        ],
        runnerTip: 'Une dorsiflexion de cheville < 10° est le facteur biomécanique de risque n°1 pour la douleur rotulienne et l\'aponévrosite plantaire (fasciite). Ce simple test/exercice peut prévenir les deux blessures les plus répandues chez le coureur. Objectif clinique : 12 cm pied-mur.',
        progression: 'Augmenter la distance pied-mur d\'1 cm par semaine. Mesurer et noter les progrès.',
      },
      {
        name: 'Cat-Cow Flow', emoji: '🐱', type: 'Mobilité',
        muscles: ['Colonne vertébrale', 'Core', 'Hanches'],
        sets: '2', reps: '10 cycles respiratoires',
        shortDesc: 'À quatre pattes, alterner dos arrondi et dos creusé en rythme avec la respiration',
        technique: [
          'EXPIRER en arrondissant le dos (chat) : nombril vers le plafond, tête baissée',
          'INSPIRER en creusant le dos (vache) : coccyx et tête vers le plafond',
          'Mouvement fluide et lent, 100% synchronisé avec la respiration',
        ],
        runnerTip: 'La rigidité thoracique est très fréquente chez les coureurs (posture bureau + course). Elle réduit l\'amplitude du balancement des bras et crée des compensations dans les hanches et les lombes. Le Cat-Cow maintient la mobilité segmentaire de la colonne.',
        progression: 'Ajouter une rotation latérale en position "Chat", regarder par-dessus son épaule. Puis ajouter une extension d\'un bras vers le plafond.',
      },
      {
        name: 'Pigeon Pose', emoji: '🕊️', type: 'Étirement actif',
        muscles: ['Psoas', 'Piriforme', 'Fléchisseurs de hanche'],
        sets: '2', reps: '90 sec / côté',
        shortDesc: 'Du chien tête en bas, amener le genou derrière le poignet, s\'allonger',
        technique: [
          'Tibia de la jambe avant à 45–90° selon la souplesse (ne jamais forcer)',
          'Jambe arrière tendue, hanches parallèles au sol (mettre un coussin sous la hanche si besoin)',
          'S\'allonger progressivement sur les avant-bras ou les mains, mâchoire détendue',
        ],
        runnerTip: 'Le psoas est le seul muscle qui connecte la colonne vertébrale aux jambes. La course le raccourcit chroniquement, forçant le bassin en antéversion (cambrure), ce qui comprime les vertèbres lombaires L4-L5. Étirer le psoas prévient 60–70% des lombalgies chez les coureurs de fond.',
        progression: 'Pigeon recouché (sur le dos, ramener le genou vers la poitrine) pour les débutants. Pigeon debout (contre un mur) pour les confirmés.',
      },
    ]
  },
]

/* ─── Flat exercise list for search ─────────────────────────────────── */
const ALL_EXERCISES_FLAT = SESSIONS.flatMap(s =>
  s.exercises.map(ex => ({ ...ex, sessionColor: s.color, sessionName: s.name }))
)

/* ─── Page ──────────────────────────────────────────────────────────── */
export default function AthleteStrength() {
  const [activeSession,     setActiveSession]     = useState(null)
  const [completedSessions, setCompletedSessions] = useState([])
  const [selectedExercise,  setSelectedExercise]  = useState(null)
  const [selectedExColor,   setSelectedExColor]   = useState(null)
  const [showTimer,         setShowTimer]         = useState(false)
  const [search,            setSearch]            = useState('')

  useEffect(() => {
    const key = `strength_sessions_${new Date().toISOString().split('T')[0]}`
    setCompletedSessions(JSON.parse(localStorage.getItem(key) || '[]'))
  }, [])

  function toggleSession(id) {
    const key = `strength_sessions_${new Date().toISOString().split('T')[0]}`
    setCompletedSessions(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      localStorage.setItem(key, JSON.stringify(next))
      return next
    })
  }

  const currentSession = activeSession ? SESSIONS.find(s => s.id === activeSession) : null

  const searchQuery = search.trim().toLowerCase()
  const searchResults = useMemo(() => {
    if (!searchQuery) return []
    return ALL_EXERCISES_FLAT.filter(ex =>
      ex.name.toLowerCase().includes(searchQuery) ||
      ex.type.toLowerCase().includes(searchQuery) ||
      ex.muscles?.some(m => m.toLowerCase().includes(searchQuery)) ||
      ex.sessionName.toLowerCase().includes(searchQuery)
    )
  }, [searchQuery])

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <h2 className="page-heading">Renforcement musculaire</h2>
          <p className="text-muted text-sm" style={{ marginTop: '.25rem' }}>
            Clique sur une séance puis sur un exercice pour les détails.
          </p>
        </div>
        <button
          onClick={() => setShowTimer(v => !v)}
          style={{
            padding: '.4rem .85rem', borderRadius: 99, border: '1.5px solid var(--border)',
            background: showTimer ? 'var(--primary)' : 'var(--surface)',
            color: showTimer ? '#fff' : 'var(--text-muted)',
            cursor: 'pointer', fontFamily: 'inherit', fontSize: '.8rem', fontWeight: 600, flexShrink: 0
          }}>
          ⏱ Timer
        </button>
      </div>

      {/* Search, only on session list view */}
      {!activeSession && (
        <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
          <span style={{ position: 'absolute', left: '.875rem', top: '50%', transform: 'translateY(-50%)',
            fontSize: '1rem', pointerEvents: 'none' }}>🔍</span>
          <input
            type="text"
            placeholder="Rechercher un exercice, un muscle, un type…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '.65rem .875rem .65rem 2.5rem',
              borderRadius: 'var(--radius)', border: '1.5px solid var(--border)',
              background: 'var(--surface)', fontFamily: 'inherit', fontSize: '.9rem',
              outline: 'none', boxSizing: 'border-box',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--primary)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
          {search && (
            <button onClick={() => setSearch('')}
              style={{ position: 'absolute', right: '.75rem', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1rem' }}>
              ✕
            </button>
          )}
        </div>
      )}

      {/* Search results */}
      {!activeSession && searchQuery && (
        <div style={{ marginBottom: '1.5rem' }}>
          {searchResults.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)',
              background: 'var(--surface-2)', borderRadius: 'var(--radius)', fontSize: '.9rem' }}>
              Aucun exercice trouvé pour "{search}"
            </div>
          ) : (
            <>
              <div style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginBottom: '.75rem' }}>
                {searchResults.length} exercice{searchResults.length > 1 ? 's' : ''}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                {searchResults.map((ex, i) => (
                  <div key={i}>
                    <div style={{ fontSize: '.72rem', fontWeight: 700, color: ex.sessionColor,
                      marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                      {ex.sessionName}
                    </div>
                    <ExerciseCard
                      exercise={ex}
                      sessionColor={ex.sessionColor}
                      onSelect={e => { setSelectedExColor(ex.sessionColor); setSelectedExercise(e) }}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Session type cards */}
      {!activeSession && !searchQuery && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.875rem' }}>
          {SESSIONS.map(s => {
            const done = completedSessions.includes(s.id)
            return (
              <div key={s.id} className="card"
                style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  cursor: 'pointer', borderLeft: `4px solid ${s.color}`,
                  opacity: done ? .75 : 1,
                  transition: 'transform .15s, box-shadow .15s'
                }}
                onClick={() => setActiveSession(s.id)}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>
                <div style={{
                  width: 60, height: 60, borderRadius: 16, flexShrink: 0,
                  background: `linear-gradient(135deg, ${s.color}18, ${s.color}38)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem'
                }}>
                  {s.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, marginBottom: '.2rem' }}>{s.name}</div>
                  <div style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginBottom: '.3rem' }}>
                    {s.subtitle}
                  </div>
                  <div style={{ fontSize: '.75rem', fontWeight: 600, color: s.color }}>
                    ⏱ {s.duration} · {s.exercises.length} exercices
                  </div>
                </div>
                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '.3rem' }}>
                  {done && <span className="badge badge-success">✅</span>}
                  <span style={{ color: 'var(--text-muted)' }}>›</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Session detail */}
      {activeSession && currentSession && (
        <>
          {/* Back + header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1.25rem' }}>
            <button onClick={() => setActiveSession(null)}
              style={{ padding: '.4rem .8rem', borderRadius: 99, border: '1.5px solid var(--border)',
                background: 'var(--surface)', cursor: 'pointer', fontFamily: 'inherit',
                fontSize: '.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              ← Séances
            </button>
          </div>
          <div className="card" style={{ marginBottom: '1.25rem',
            background: `linear-gradient(135deg, ${currentSession.color}12, ${currentSession.color}25)`,
            borderLeft: `4px solid ${currentSession.color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontSize: '2rem' }}>{currentSession.emoji}</div>
              <div style={{ flex: 1 }}>
                <h3 style={{ marginBottom: '.2rem' }}>{currentSession.name}</h3>
                <div style={{ fontSize: '.82rem', color: 'var(--text-muted)' }}>{currentSession.subtitle}</div>
              </div>
              <div style={{ fontSize: '.8rem', fontWeight: 700, color: currentSession.color }}>
                ⏱ {currentSession.duration}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            {currentSession.exercises.map((ex, i) => (
              <ExerciseCard
                key={i}
                exercise={ex}
                sessionColor={currentSession.color}
                onSelect={e => { setSelectedExColor(currentSession.color); setSelectedExercise(e) }}
              />
            ))}
          </div>

          {/* Done button */}
          <button
            className={`btn btn-full mt-6 ${completedSessions.includes(activeSession) ? 'btn-ghost' : 'btn-primary'}`}
            onClick={() => toggleSession(activeSession)}>
            {completedSessions.includes(activeSession) ? '↩ Marquer comme non effectué' : '✅ Séance terminée'}
          </button>
        </>
      )}

      {selectedExercise && (
        <ExerciseModal
          exercise={selectedExercise}
          sessionColor={selectedExColor || currentSession?.color || '#8B2FC9'}
          onClose={() => setSelectedExercise(null)}
        />
      )}

      {showTimer && <RestTimer onClose={() => setShowTimer(false)} />}
    </div>
  )
}
