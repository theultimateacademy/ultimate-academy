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
  /* ── 1. Core & Abdominaux ─────────────────────────────────────────── */
  {
    id: 'core_abdo', name: 'Abdominaux & Core', emoji: '🎯', duration: '25–35 min',
    subtitle: 'Transverse · obliques · rectus abdominis · core profond',
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
        runnerTip: 'Un core fort réduit les oscillations latérales du bassin à chaque foulée — jusqu\'à 15% d\'économie d\'énergie sur longue distance.',
        progression: 'Quand 60 sec tenues sans compensation : passer à la planche avec toucher d\'épaule alternée.',
      },
      {
        name: 'Dead Bug', emoji: '🪲', type: 'Isométrique',
        muscles: ['Transverse', 'Core', 'Stabilisateurs'],
        sets: '3', reps: '10 / côté',
        shortDesc: 'Sur le dos, abaisser bras et jambe opposés sans décoller le bas du dos',
        technique: [
          'Coller le bas du dos au sol pendant TOUT le mouvement',
          'Descente lente et contrôlée : 3 sec à abaisser, 3 sec à remonter',
          'Expirer à chaque abaissement de jambe',
        ],
        runnerTip: 'Le transverse est le stabilisateur principal de la colonne pendant la course — le Dead Bug l\'isole parfaitement.',
        progression: 'Ajouter un élastique en repoussant les bras vers le haut pour résistance anti-extension.',
      },
      {
        name: 'Crunch bicycle', emoji: '🚴', type: 'Concentrique',
        muscles: ['Obliques', 'Rectus abdominis', 'Fléchisseurs de hanche'],
        sets: '3', reps: '20 alternés',
        shortDesc: 'Sur le dos, amener coude droit vers genou gauche en pédalant',
        technique: [
          'Rotation franche du torse, pas juste du coude',
          'Jambe en extension à 45° du sol, jambe pliée à 90°',
          'Tempo lent : 2 sec de rotation, 1 sec de retour',
        ],
        runnerTip: 'Les obliques gèrent la rotation du tronc pendant la course — leur renforcement améliore directement l\'économie de course.',
        progression: 'Ralentir encore le tempo (3-0-3) ou ajouter une résistance légère derrière la tête.',
      },
      {
        name: 'Planche latérale', emoji: '📐', type: 'Isométrique',
        muscles: ['Obliques', 'Core', 'Abducteurs'],
        sets: '3', reps: '25–40 sec / côté',
        shortDesc: 'Sur avant-bras latéral, corps aligné de la tête aux pieds',
        technique: [
          'Hanches levées, ne jamais les laisser s\'affaisser',
          'Corps en ligne : oreille, épaule, hanche, cheville alignés',
          'Contracter les fessiers pour solidifier la position',
        ],
        runnerTip: 'Les obliques latéraux stabilisent le tronc lors des rotations du balancement des bras — clé pour éviter les lombalgies.',
        progression: 'Lever la jambe supérieure 20 cm et la tenir pour activer abducteurs et obliques simultanément.',
      },
      {
        name: 'Mountain Climbers', emoji: '🧗', type: 'Neuromusculaire',
        muscles: ['Core', 'Épaules', 'Fléchisseurs de hanche'],
        sets: '3', reps: '30 sec',
        shortDesc: 'En planche haute, alterner les genoux vers la poitrine rapidement',
        technique: [
          'Hanches stables, ne pas les lever ou les balancer',
          'Genoux ramenés sous la poitrine, pas latéralement',
          'Maintenir la tension du core tout au long',
        ],
        runnerTip: 'Combine gainage du core et cardio — parfait pour simuler le travail des fléchisseurs de hanche en course.',
        progression: 'Augmenter la vitesse d\'exécution ou poser les mains sur des disques glissants pour difficulté accrue.',
      },
      {
        name: 'Ab Wheel', emoji: '☸️', type: 'Excentrique',
        muscles: ['Core', 'Dorsaux', 'Épaules'],
        sets: '3', reps: '8–12',
        shortDesc: 'À genoux, dérouler la roue vers l\'avant puis revenir',
        technique: [
          'Core ultra-contracté tout le long, dos parfaitement plat',
          'Extension maximale sans toucher le sol avec les hanches',
          'Retour lent et contrôlé : 3 sec de retour',
        ],
        runnerTip: 'Exercice anti-extension très efficace pour renforcer les stabilisateurs profonds du tronc sollicités à chaque foulée.',
        progression: 'Depuis les pieds (full planche) au lieu des genoux quand 12 reps parfaites sont maîtrisées.',
      },
    ],
  },

  /* ── 2. Gainage & Stabilité ───────────────────────────────────────── */
  {
    id: 'gainage', name: 'Gainage & Stabilité', emoji: '🧘', duration: '25–35 min',
    subtitle: 'Core profond · équilibre · prévention lombaires',
    color: '#6366F1',
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
        runnerTip: 'Le psoas est le seul muscle qui connecte la colonne vertébrale aux jambes. La course le raccourcit chroniquement — étirer le psoas prévient 60–70% des lombalgies chez les coureurs.',
        progression: 'Pigeon recouché (sur le dos) pour les débutants. Pigeon debout (contre un mur) pour les confirmés.',
      },
    ]
  },

  /* ── 6. Haut du corps ────────────────────────────────────────────── */
  {
    id: 'haut_corps', name: 'Haut du Corps', emoji: '💪', duration: '30–40 min',
    subtitle: 'Épaules · dos · pectoraux · bras · posture',
    color: '#E8237A',
    exercises: [
      {
        name: 'Pompes', emoji: '🤲', type: 'Polyarticulaire',
        muscles: ['Pectoraux', 'Triceps', 'Épaules', 'Core'],
        sets: '3', reps: '12–20',
        shortDesc: 'Planche haute, descendre la poitrine jusqu\'à 2 cm du sol',
        technique: [
          'Corps parfaitement rigide de la tête aux talons',
          'Coudes à 45° du corps (pas à 90°)',
          'Descendre lentement (3 sec), remonter en 1 sec',
        ],
        runnerTip: 'Les pectoraux et épaules contribuent au balancement des bras pendant la course. Des bras forts stabilisent le tronc et améliorent l\'économie de course.',
        progression: 'Pieds surélevés (pompes déclinées), pompes explosives ou pompes avec applaudissement.',
      },
      {
        name: 'Rowing élastique', emoji: '🎽', type: 'Concentrique',
        muscles: ['Grand dorsal', 'Trapèzes', 'Biceps', 'Rhomboïdes'],
        sets: '3', reps: '15',
        shortDesc: 'Tirer l\'élastique vers le ventre en gardant les coudes collés au corps',
        technique: [
          'Scapulas rétractées (omoplates vers l\'arrière) en fin de mouvement',
          'Dos droit, ne pas se pencher en arrière pour aider',
          'Contraction maximale de 1 sec en fin de tirage',
        ],
        runnerTip: 'Le grand dorsal contre-équilibre le balancement des bras et maintient la posture droite en fin de course. Clé pour ne pas s\'effondrer après le 30e km.',
        progression: 'Augmenter la résistance de l\'élastique ou passer au Rowing haltère unilatéral.',
      },
      {
        name: 'Face Pull', emoji: '😤', type: 'Concentrique',
        muscles: ['Deltoïdes postérieurs', 'Trapèzes', 'Rotateurs externes épaule'],
        sets: '3', reps: '15–20',
        shortDesc: 'Tirer l\'élastique vers le visage, coudes en haut, mains vers les oreilles',
        technique: [
          'Coudes au-dessus des épaules tout au long du mouvement',
          'Finir avec les pouces vers l\'arrière (rotation externe)',
          'Mouvement lent et contrôlé : 3 sec de traction',
        ],
        runnerTip: 'Renforce les rotateurs externes et les deltoïdes postérieurs — corrige les épaules qui tombent vers l\'avant (posture en C) fréquente chez les coureurs très entraînés.',
        progression: 'Augmenter la résistance ou passer à une double traction avec les deux bras séparément.',
      },
      {
        name: 'Élévations latérales', emoji: '🦅', type: 'Concentrique',
        muscles: ['Deltoïdes latéraux', 'Trapèzes supérieurs'],
        sets: '3', reps: '15',
        shortDesc: 'Haltères en mains, bras le long du corps, monter jusqu\'à la hauteur des épaules',
        technique: [
          'Légère flexion des coudes (pas les bras tendus rigides)',
          'Monter lentement jusqu\'à parallèle au sol, descente contrôlée 3 sec',
          'Ne pas utiliser l\'élan — mouvement pur deltoids',
        ],
        runnerTip: 'Des épaules latéralement fortes maintiennent la symétrie du balancement des bras — clé pour ne pas "tanguer" dans les derniers km d\'un marathon.',
        progression: 'Augmenter le poids ou faire l\'exercice assis pour supprimer tout élan.',
      },
      {
        name: 'Pull-over haltère', emoji: '🏋️', type: 'Concentrique',
        muscles: ['Grand dorsal', 'Pectoraux', 'Triceps long'],
        sets: '3', reps: '12',
        shortDesc: 'Allongé sur un banc, haltère à deux mains, descendre derrière la tête puis revenir',
        technique: [
          'Coudes légèrement fléchis tout le long (jamais totalement tendus)',
          'Amplitude maximale vers l\'arrière sans cambrer le bas du dos',
          'Expirer en remontant, contraction maximale du grand dorsal',
        ],
        runnerTip: 'Renforce la connexion grand dorsal-pectoraux qui stabilise la cage thoracique lors de la rotation du tronc en course.',
        progression: 'Augmenter le poids ou réaliser l\'exercice sur un ballon de gym pour un recrutement du core accru.',
      },
      {
        name: 'Curl biceps', emoji: '💪', type: 'Concentrique',
        muscles: ['Biceps', 'Avant-bras', 'Fléchisseurs'],
        sets: '3', reps: '12 / côté',
        shortDesc: 'Haltère en main, fléchir le coude jusqu\'à l\'épaule, descendre lentement',
        technique: [
          'Coude fixe contre le flanc, ne pas balancer l\'épaule',
          'Supination complète (rotation de la main vers le haut) en fin de montée',
          'Descente lente et contrôlée : 3 secondes',
        ],
        runnerTip: 'Des biceps forts maintiennent une flexion du coude à 90° constante pendant la course, réduisant les oscillations inutiles.',
        progression: 'Curl concentré sur un genou, ou curl marteau (prise neutre) pour cibler le brachial.',
      },
    ],
  },

  /* ── 7. Quadriceps & Genoux ──────────────────────────────────────── */
  {
    id: 'quadriceps', name: 'Quadriceps & Genoux', emoji: '🦵', duration: '30–40 min',
    subtitle: 'Quadriceps · rotule · vaste interne · prévention genou',
    color: '#0EA5E9',
    exercises: [
      {
        name: 'Squat goblet', emoji: '🏋️', type: 'Polyarticulaire',
        muscles: ['Quadriceps', 'Fessiers', 'Ischio-jambiers', 'Core'],
        sets: '4', reps: '12–15',
        shortDesc: 'Haltère ou kettlebell tenu à deux mains contre la poitrine, s\'accroupir',
        technique: [
          'Pieds à largeur d\'épaules, orteils légèrement ouverts (10-30°)',
          'Genoux dans l\'axe des orteils tout au long, ne jamais les laisser rentrer',
          'Descendre jusqu\'à la cuisse parallèle au sol minimum, dos droit',
        ],
        runnerTip: 'Le squat goblet renforce les quadriceps dans la même amplitude de mouvement que la descente de côte. Clé pour éviter le syndrome fémoro-patellaire (douleur devant le genou).',
        progression: 'Squat bulgare (pied arrière surélevé) pour isoler davantage chaque jambe. Squat goblet avec pause de 3 sec en bas.',
      },
      {
        name: 'Terminal Knee Extension (TKE)', emoji: '🦿', type: 'Isométrique',
        muscles: ['Vaste interne (VMO)', 'Quadriceps'],
        sets: '3', reps: '15 / côté',
        shortDesc: 'Élastique derrière le genou, démarrer fléchi à 30°, étendre complètement',
        technique: [
          'Élastique fixé à la cheville ou derrière le genou, prise en tension',
          'Extension complète du genou avec contraction maximale du VMO',
          'Tenir 2 sec en extension, descente contrôlée',
        ],
        runnerTip: 'Le VMO (vaste interne) est souvent le plus faible des quadriceps et première cause du syndrome fémoro-patellaire. Ce mouvement l\'isole dans les derniers degrés d\'extension.',
        progression: 'Augmenter la résistance de l\'élastique. Passer à la leg extension unilatérale avec haltère.',
      },
      {
        name: 'Step-up unilatéral', emoji: '🪜', type: 'Concentrique',
        muscles: ['Quadriceps', 'Fessiers', 'Équilibre'],
        sets: '3', reps: '12 / côté',
        shortDesc: 'Monter sur un step en appuyant sur la jambe de travail, sans élan',
        technique: [
          'Pied entier sur la boîte, ne pas se propulser avec la jambe du bas',
          'Genou dans l\'axe des orteils en montée comme en descente',
          'Contrôler la descente (3 sec) : c\'est la phase excentrique qui renforce',
        ],
        runnerTip: 'Reproduit exactement le pattern de la montée de côte — renforcement unilatéral qui corrige les déséquilibres droite/gauche fréquents chez les coureurs.',
        progression: 'Augmenter la hauteur du step ou tenir des haltères. Step-up latéral pour varier l\'angle.',
      },
      {
        name: 'Wall Sit', emoji: '🧱', type: 'Isométrique',
        muscles: ['Quadriceps', 'Fessiers', 'Mollets'],
        sets: '3', reps: '30–60 sec',
        shortDesc: 'Dos au mur, cuisses parallèles au sol, tenir la position',
        technique: [
          'Angle de 90° aux genoux et aux hanches — pas plus d\'effort si moins de 90°',
          'Talons à plat au sol, pieds dans l\'axe des genoux',
          'Dos entièrement plaqué contre le mur, ne pas se cambrer',
        ],
        runnerTip: 'Travail isométrique intense des quadriceps en situation de fatigue musculaire — simulé les derniers km d\'un semi ou d\'un marathon où les jambes brûlent.',
        progression: 'Lever un pied du sol alternativement. Ajouter un haltère sur les cuisses pour surcharge.',
      },
      {
        name: 'Fente bulgare', emoji: '🔱', type: 'Polyarticulaire',
        muscles: ['Quadriceps', 'Fessiers', 'Ischio-jambiers', 'Équilibre'],
        sets: '3', reps: '10 / côté',
        shortDesc: 'Pied arrière sur un banc, descendre en fente profonde',
        technique: [
          'Pied avant loin du banc (genou jamais devant l\'orteil)',
          'Descente verticale de la hanche, ne pas basculer en avant',
          'Genou arrière frôle le sol sans toucher',
        ],
        runnerTip: 'Exercice le plus complet pour le coureur — renforce quadriceps, fessiers, ischio en situation unilatérale avec fort déséquilibre, exactement comme la foulée.',
        progression: 'Ajouter des haltères ou une barre. Fente bulgare sautée pour composante plyométrique.',
      },
      {
        name: 'Leg Extension isométrique', emoji: '⚖️', type: 'Isométrique',
        muscles: ['Quadriceps', 'Vaste interne'],
        sets: '3', reps: '10 × 5 sec',
        shortDesc: 'Assis, jambe tendue à 90°, pousser contre une résistance fixe 5 sec',
        technique: [
          'Jambe tendue à l\'horizontale, contracter au maximum 5 sec',
          'Descendre lentement (4 sec) jusqu\'à 30° de flexion',
          'Alterner les deux jambes sans pause',
        ],
        runnerTip: 'Renforcement isométrique des quadriceps très efficace après une douleur de genou — sans compression articulaire, adaptable à tous les niveaux.',
        progression: 'Ajouter un haltère sur la cheville. Passer à la chaise romaine (leg extension avec poids).',
      },
    ],
  },

  /* ── 8. Fessiers & Ischio-jambiers ──────────────────────────────── */
  {
    id: 'fessiers', name: 'Fessiers & Ischio-jambiers', emoji: '🍑', duration: '30–40 min',
    subtitle: 'Grand fessier · biceps fémoral · propulsion · prévention',
    color: '#10B981',
    exercises: [
      {
        name: 'Hip Thrust', emoji: '🍑', type: 'Concentrique',
        muscles: ['Grand fessier', 'Ischio-jambiers', 'Core'],
        sets: '4', reps: '12–15',
        shortDesc: 'Dos contre un banc, barre sur les hanches, pousser les hanches vers le haut',
        technique: [
          'Menton rentré, ne pas cambrer le cou vers le haut',
          'En haut : hanches, genoux et épaules alignés horizontalement',
          'Contraction maximale du fessier d\'1 sec en extension complète',
        ],
        runnerTip: 'Le grand fessier est le moteur principal de la propulsion en course. Un Hip Thrust fort de 150+ kg corrèle directement avec un meilleur temps au 5km et une réduction des blessures aux ischio.',
        progression: 'Hip Thrust unilatéral (1 jambe), pause de 3 sec en haut, ou augmenter la charge progressivement.',
      },
      {
        name: 'Romanian Deadlift', emoji: '🔱', type: 'Excentrique',
        muscles: ['Ischio-jambiers', 'Grand fessier', 'Érecteurs'],
        sets: '3', reps: '10',
        shortDesc: 'Haltères le long des cuisses, pencher le buste en gardant les genoux quasi-tendus',
        technique: [
          'Dos droit pendant tout le mouvement — ne jamais arrondir',
          'Pousser les hanches vers l\'arrière (hip hinge) en descendant',
          'Sentir l\'étirement des ischio-jambiers avant de remonter',
        ],
        runnerTip: 'Renforce les ischio-jambiers en excentrique — première ligne de défense contre les déchirures musculaires en sprint ou en côte.',
        progression: 'Passer à la barre olympique, ou faire en unilatéral (Single Leg RDL) pour l\'équilibre.',
      },
      {
        name: 'Nordic Curl', emoji: '🦵', type: 'Excentrique',
        muscles: ['Ischio-jambiers', 'Mollets'],
        sets: '3', reps: '5–8',
        shortDesc: 'Chevilles fixées, corps droit, laisser tomber vers l\'avant très lentement',
        technique: [
          'Corps rigide de la tête aux genoux — ne pas plier aux hanches',
          'Descente la plus lente possible (5-8 sec) pour le maximum d\'excentrique',
          'Se rattraper avec les mains et se propulser pour revenir si nécessaire',
        ],
        runnerTip: 'Réduit de 51% le risque de déchirure des ischio-jambiers (étude FIFA) — exercice incontournable pour tout coureur qui fait des fractionnés ou des côtes.',
        progression: 'Augmenter le nombre de reps ou la durée de la descente. Ajouter une bande élastique pour aider la remontée.',
      },
      {
        name: 'Glute Bridge unilatéral', emoji: '🌉', type: 'Concentrique',
        muscles: ['Grand fessier', 'Ischio-jambiers', 'Core'],
        sets: '3', reps: '15 / côté',
        shortDesc: 'Sur le dos, un pied au sol, l\'autre tendu, pousser la hanche vers le haut',
        technique: [
          'Garder les hanches à la même hauteur tout le long — ne pas basculer',
          'Pied au sol : talon en appui (pas les orteils)',
          'Contraction maximale du fessier d\'1 sec en haut',
        ],
        runnerTip: 'Isole le fessier de façon unilatérale — révèle et corrige les déséquilibres droite/gauche qui causent 80% des blessures asymétriques chez les coureurs.',
        progression: 'Poser le pied sur un ballon BOSU pour instabilité. Ajouter une bande élastique au-dessus des genoux.',
      },
      {
        name: 'Good Morning', emoji: '🌅', type: 'Concentrique',
        muscles: ['Ischio-jambiers', 'Érecteurs', 'Grand fessier'],
        sets: '3', reps: '12',
        shortDesc: 'Barre sur les épaules, se pencher en avant en gardant le dos droit',
        technique: [
          'Genoux légèrement fléchis, tibia vertical',
          'Push hips back : pousser les hanches vers l\'arrière (pas plier la taille)',
          'Remonter en contractant les fessiers et les ischio',
        ],
        runnerTip: 'Renforce la chaîne postérieure complète dans sa fonction principale en course — la triple extension hanche/genou/cheville à chaque foulée.',
        progression: 'Augmenter la charge ou faire en unilatéral (Single Leg Good Morning).',
      },
      {
        name: 'Clamshell', emoji: '🐚', type: 'Concentrique',
        muscles: ['Moyen fessier', 'Petit fessier', 'Rotateurs externes'],
        sets: '3', reps: '20 / côté',
        shortDesc: 'Allongé sur le côté, genoux pliés, ouvrir le genou supérieur comme une coquille',
        technique: [
          'Hanches empilées, ne pas basculer en arrière pour compenser',
          'Amplitude maximale : lever le genou le plus haut possible',
          'Contraction du moyen fessier de 1 sec en haut',
        ],
        runnerTip: 'Le moyen fessier stabilise le bassin à chaque appui unipodal. Sa faiblesse est la première cause du syndrome de la bandelette ilio-tibiale (douleur externe du genou).',
        progression: 'Ajouter une bande élastique au-dessus des genoux. Clamshell debout contre un mur.',
      },
    ],
  },

  /* ── 9. Proprioception & Équilibre ──────────────────────────────── */
  {
    id: 'proprioception', name: 'Proprioception & Équilibre', emoji: '🦩', duration: '20–30 min',
    subtitle: 'Cheville · stabilité unipodal · neuromusculaire',
    color: '#EC4899',
    exercises: [
      {
        name: 'Équilibre unipodal', emoji: '🦩', type: 'Proprioception',
        muscles: ['Cheville', 'Mollet', 'Stabilisateurs'],
        sets: '3', reps: '30–60 sec / pied',
        shortDesc: 'Sur un pied, genou légèrement fléchi, maintenir l\'équilibre',
        technique: [
          'Genou de la jambe d\'appui légèrement fléchi (jamais tendu à bloc)',
          'Regard fixe sur un point pour aider la stabilité',
          'Progresser vers les yeux fermés pour augmenter la difficulté',
        ],
        runnerTip: 'Pendant la course, chaque appui est unipodal. Un déficit de proprioception cheville = risque élevé d\'entorse de cheville et de fractures de stress.',
        progression: 'Yeux fermés, puis sur coussin d\'équilibre (BOSU), puis avec catches de médecine-ball.',
      },
      {
        name: 'Single Leg Deadlift', emoji: '🔱', type: 'Proprioception',
        muscles: ['Ischio-jambiers', 'Fessier', 'Stabilisateurs cheville'],
        sets: '3', reps: '10 / côté',
        shortDesc: 'Sur un pied, se pencher en avant en étendant la jambe arrière',
        technique: [
          'Corps en T parfait : jambe arrière, dos et bras dans le même plan',
          'Genou d\'appui légèrement fléchi, ne jamais le verrouiller',
          'Mouvement lent : 3 sec de descente, 1 sec de remontée',
        ],
        runnerTip: 'Renforce les ischio-jambiers et le fessier en condition d\'équilibre unipodal — exactement comme la phase d\'appui de la foulée.',
        progression: 'Ajouter un haltère à la main opposée. Réaliser sur ballon BOSU pour instabilité maximale.',
      },
      {
        name: 'Lateral Band Walk', emoji: '🦀', type: 'Neuromusculaire',
        muscles: ['Moyen fessier', 'Stabilisateurs hanche', 'Abducteurs'],
        sets: '3', reps: '15 pas / sens',
        shortDesc: 'Élastique aux genoux ou chevilles, pas latéraux avec légère flexion des genoux',
        technique: [
          'Genoux dans l\'axe des orteils — ne jamais les laisser entrer vers l\'intérieur',
          'Maintenir la tension de l\'élastique à chaque pas (ne jamais relâcher)',
          'Buste droit, légère flexion de hanche et genou',
        ],
        runnerTip: 'Active le moyen fessier de façon dynamique — prévient le valgus du genou (genoux qui rentrent vers l\'intérieur) en course, première cause de syndrome fémoro-patellaire.',
        progression: 'Placer l\'élastique à la cheville (bras de levier plus long). Ajouter des pas en diagonale.',
      },
      {
        name: 'Heel Raises sur une jambe', emoji: '🦶', type: 'Concentrique',
        muscles: ['Soléaire', 'Gastrocnémien', 'Stabilisateurs cheville'],
        sets: '3', reps: '15 / côté',
        shortDesc: 'Sur un pied, monter sur la pointe, descendre lentement (3 sec)',
        technique: [
          'Amplitude maximale : aller le plus haut possible sur la pointe',
          'Descendre en 3 sec en contrôlant — c\'est la phase excentrique qui protège',
          'Légère flexion du genou pour cibler le soléaire, jambe tendue pour le gastrocnémien',
        ],
        runnerTip: 'Le tendon d\'Achille supporte 6–8 fois le poids du corps à chaque foulée. Les heel raises en excentrique réduisent de 75% les tendinopathies d\'Achille.',
        progression: 'Sur une marche (amplitude accrue). Avec haltère pour surcharge progressive.',
      },
      {
        name: 'Squat saut avec stabilisation', emoji: '🚀', type: 'Plyométrique',
        muscles: ['Quadriceps', 'Fessiers', 'Stabilisateurs cheville'],
        sets: '3', reps: '8',
        shortDesc: 'Squat, sauter haut, atterrir sur un pied et stabiliser 3 sec',
        technique: [
          'Saut depuis les deux jambes, réception sur une seule jambe',
          'Réception en douceur : mi-pied d\'abord, puis genou fléchi pour amortir',
          'Stabiliser 3 sec sans vaciller avant de recommencer',
        ],
        runnerTip: 'Combine l\'explosivité et le contrôle proprioceptif — entraîne le cerveau à stabiliser le genou instantanément lors des descentes rapides en trail ou en cross.',
        progression: 'Augmenter la hauteur du saut. Réception les yeux fermés pour proprioception maximale.',
      },
    ],
  },

  /* ── 10. Pilates & Posture ───────────────────────────────────────── */
  {
    id: 'pilates', name: 'Pilates & Posture', emoji: '🌸', duration: '25–35 min',
    subtitle: 'Gainage profond · respiration · alignement · souplesse active',
    color: '#F59E0B',
    exercises: [
      {
        name: 'The Hundred', emoji: '💯', type: 'Isométrique',
        muscles: ['Core', 'Transverse', 'Fléchisseurs de hanche'],
        sets: '1', reps: '100 battements',
        shortDesc: 'Sur le dos, jambes à 45°, battre les bras 100 fois en respirant',
        technique: [
          'Tête et épaules décollées du sol, menton légèrement rentré',
          'Bras battent vite et court (environ 10 cm), core ultra-contracté',
          'Inspire 5 battements, expire 5 battements — rythme régulier',
        ],
        runnerTip: 'Le « 100 » du Pilates renforce le core en condition de charge prolongée, en synchronisant respiration et gainage — exactement ce qu\'il faut maintenir en fin de course.',
        progression: 'Jambes plus basses (15° du sol) pour augmenter la charge. Ajouter des circles avec les jambes.',
      },
      {
        name: 'Roll Up', emoji: '🌀', type: 'Concentrique',
        muscles: ['Core', 'Colonne vertébrale', 'Ischio-jambiers'],
        sets: '3', reps: '10',
        shortDesc: 'Allongé, bras en l\'air, décoller vertèbre par vertèbre jusqu\'en avant-penché',
        technique: [
          'Mouvement lent et articulé — chaque vertèbre se décolle dans l\'ordre',
          'Expirer en remontant, inspirer en redescendant',
          'Pieds maintenus au sol, jambes tendues tout au long',
        ],
        runnerTip: 'Améliore la mobilité de la colonne vertébrale et le contrôle moteur global — prévient les blocages du dos très fréquents lors des longues sorties.',
        progression: 'Ajouter une résistance avec un élastique aux pieds. Roll Over (jambes par-dessus la tête).',
      },
      {
        name: 'Spine Twist', emoji: '🌀', type: 'Mobilité',
        muscles: ['Obliques', 'Érecteurs', 'Mobilité thoracique'],
        sets: '3', reps: '10 / côté',
        shortDesc: 'Assis droit, bras en croix, rotation franche du buste de chaque côté',
        technique: [
          'Assis sur les ischions, dos parfaitement droit (pas affalé)',
          'Rotation vient des dorsales (thoracique), pas des hanches',
          'Expirer en tournant, inspirer au centre',
        ],
        runnerTip: 'La rotation thoracique est essentielle pour le balancement des bras en course. Un tronc rigide oblige une compensation des épaules et cause des douleurs cervicales.',
        progression: 'Ajouter une extension latérale en fin de rotation. Assis sur un ballon pour instabilité.',
      },
      {
        name: 'Leg Circle', emoji: '⭕', type: 'Mobilité',
        muscles: ['Psoas', 'Fessiers', 'Stabilisateurs hanche'],
        sets: '3', reps: '8 cercles / sens / jambe',
        shortDesc: 'Sur le dos, jambe tendue en l\'air, tracer des cercles sans bouger le bassin',
        technique: [
          'Le bassin ne bouge PAS — c\'est le critère principal de réussite',
          'Cercles contrôlés, la taille augmente progressivement',
          'Alterner sens horaire et anti-horaire',
        ],
        runnerTip: 'Mobilise l\'articulation coxo-fémorale dans toutes ses directions — prévient les blocages de hanche qui forcent une compensation en rotation lors des longues sorties.',
        progression: 'Augmenter le diamètre des cercles. Ajouter une résistance élastique à la cheville.',
      },
      {
        name: 'Swimming Pilates', emoji: '🏊', type: 'Isométrique',
        muscles: ['Érecteurs', 'Fessiers', 'Ischio-jambiers', 'Épaules'],
        sets: '3', reps: '30 sec',
        shortDesc: 'À plat ventre, alterner bras/jambe opposés en battement rapide',
        technique: [
          'Lever légèrement le torse et les jambes du sol au départ',
          'Battements courts et rapides, alternance parfaitement synchronisée',
          'Inspirer 5 battements, expirer 5 battements',
        ],
        runnerTip: 'Renforce toute la chaîne postérieure (dos, fessiers, ischio) de façon dynamique et coordinative — améliore la stabilité posturale sur les longues distances.',
        progression: 'Augmenter l\'amplitude des mouvements. Ajouter des poids légers aux chevilles et aux poignets.',
      },
      {
        name: 'Child\'s Pose to Cobra', emoji: '🐍', type: 'Mobilité',
        muscles: ['Colonne vertébrale', 'Psoas', 'Pectoraux', 'Épaules'],
        sets: '3', reps: '10 transitions',
        shortDesc: 'Alterner la posture enfant (étirement dos) et cobra (extension colonne)',
        technique: [
          'Posture enfant : genoux écartés, bras tendus devant, front au sol',
          'Cobra : bras tendus, bassin au sol, regard vers le haut — respirer',
          'Transition lente et fluide entre les deux',
        ],
        runnerTip: 'Contre-pose parfaite aux longues sorties : décompresse les disques intervertébraux, étire le psoas et mobilise les épaules — récupération active optimale.',
        progression: 'Upward Dog (hanches décollées du sol) pour intensifier. Ajouter des cercles des hanches en posture enfant.',
      },
    ],
  },

  /* ── 11. Full Body ───────────────────────────────────────────────── */
  {
    id: 'full_body', name: 'Full Body', emoji: '🔥', duration: '35–45 min',
    subtitle: 'Séance complète · polyarticulaire · cardio-musculaire',
    color: '#F97316',
    exercises: [
      {
        name: 'Burpee', emoji: '💥', type: 'Plyométrique',
        muscles: ['Corps entier', 'Cardio', 'Épaules', 'Core'],
        sets: '3', reps: '10–15',
        shortDesc: 'Planche → pompe → ramener les pieds → sauter avec bras en l\'air',
        technique: [
          'Corps rigide en position de planche (pas les fesses en l\'air)',
          'Pompe complète : poitrine à 2 cm du sol',
          'Saut haut avec bras tendus, réception genoux fléchis',
        ],
        runnerTip: 'Le burpee est l\'exercice le plus complet qui soit — combine tous les patrons moteurs du coureur dans un enchaînement cardio-musculaire intense.',
        progression: 'Burpee avec box jump. Burpee en slow-motion (5 sec chaque phase) pour travail de force.',
      },
      {
        name: 'Kettlebell Swing', emoji: '🏋️', type: 'Polyarticulaire',
        muscles: ['Fessiers', 'Ischio-jambiers', 'Core', 'Épaules'],
        sets: '3', reps: '15',
        shortDesc: 'Balancement du kettlebell de l\'entrejambe jusqu\'à la hauteur des épaules',
        technique: [
          'Hip hinge puissant : fessiers et ischio propulsent, pas les bras',
          'Core contracté à l\'impact, bloquer la respiration une fraction de seconde',
          'Laisser retomber le kettlebell en guidant — ne pas freiner',
        ],
        runnerTip: 'Le Swing mimique parfaitement le pattern de propulsion en course — extension explosive de hanche. Renforce la chaîne postérieure de façon cardiovasculaire.',
        progression: 'Augmenter le poids. Single Arm Swing. American Swing (jusqu\'au-dessus de la tête).',
      },
      {
        name: 'Thruster', emoji: '🚀', type: 'Polyarticulaire',
        muscles: ['Quadriceps', 'Épaules', 'Core', 'Triceps'],
        sets: '3', reps: '10',
        shortDesc: 'Squat avec haltères, remonter et pousser les bras au-dessus de la tête',
        technique: [
          'Descendre en squat profond (cuisse parallèle), haltères aux épaules',
          'L\'élan de la remontée du squat propulse les bras vers le haut',
          'Bras complètement tendus en haut, core contracté',
        ],
        runnerTip: 'Coordonne bas du corps et haut du corps en un seul mouvement — parfait pour améliorer la coordination neuromusculaire globale du coureur.',
        progression: 'Augmenter le poids. Thruster avec barre olympique. Ajouter un saut entre chaque rep.',
      },
      {
        name: 'Man Maker', emoji: '⚡', type: 'Polyarticulaire',
        muscles: ['Corps entier', 'Ischio-jambiers', 'Épaules', 'Core'],
        sets: '3', reps: '8',
        shortDesc: 'Pompe avec haltères, rowing, debout, curl, press — tout enchaîné',
        technique: [
          'Haltères au sol, planche, pompe, rowing droit, rowing gauche',
          'Ramener les pieds, se lever, curl, press au-dessus de la tête',
          'Mouvement fluide et contrôlé — qualité prime sur vitesse',
        ],
        runnerTip: 'Combine force, cardio et coordination — conditionne le corps à maintenir la technique de course sous une forte fatigue cardiovasculaire et musculaire.',
        progression: 'Augmenter le poids des haltères. Ajouter un squat jump entre chaque Man Maker.',
      },
      {
        name: 'Bear Crawl', emoji: '🐻', type: 'Neuromusculaire',
        muscles: ['Core', 'Épaules', 'Quadriceps', 'Coordination'],
        sets: '3', reps: '20 m aller-retour',
        shortDesc: 'À quatre pattes, se déplacer en diagonale (main droite + pied gauche)',
        technique: [
          'Genoux à 2 cm du sol — ne jamais les poser',
          'Corps horizontal, hanches à la hauteur des épaules',
          'Coordination contralétale stricte : main droite + pied gauche',
        ],
        runnerTip: 'Le Bear Crawl renforce la coordination contralétale (côté opposé) qui est exactement le patron de la foulée — bras gauche / jambe droite en simultané.',
        progression: 'Bear Crawl en arrière. Bear Crawl avec sac à dos lesté. Bear Crawl sur surface instable.',
      },
    ],
  },

  /* ── 13. Gainage Dynamique ────────────────────────────────────────── */
  {
    id: 'gainage_dynamique', name: 'Gainage Dynamique', emoji: '🌪️', duration: '25–35 min',
    subtitle: 'Anti-rotation · core en mouvement · transfert de force',
    color: '#6366F1',
    exercises: [
      {
        name: 'Renegade Row', emoji: '🏋️', type: 'Isométrique',
        muscles: ['Core', 'Dos', 'Épaules'],
        sets: '3', reps: '8 / côté',
        shortDesc: 'En planche haute mains sur haltères, tirer un haltère vers la hanche sans faire pivoter le bassin',
        technique: [
          'Pieds écartés pour une base stable, poids répartis sur les deux mains au sol',
          'Tirer l\'haltère en gardant les hanches parfaitement carrées, face au sol',
          'Reposer l\'haltère avec contrôle avant de changer de côté',
        ],
        runnerTip: 'Travaille le core en anti-rotation exactement comme il doit stabiliser le bassin contre la rotation du buste à chaque foulée.',
        progression: 'Augmenter le poids des haltères ou ralentir la phase de repose (3 sec).',
      },
      {
        name: 'Plank to Push-up', emoji: '🤸', type: 'Neuromusculaire',
        muscles: ['Core', 'Épaules', 'Triceps'],
        sets: '3', reps: '10',
        shortDesc: 'Passer de la planche avant-bras à la planche haute bras tendus, sans balancer les hanches',
        technique: [
          'Un bras à la fois se pose puis se relève, hanches immobiles tout le mouvement',
          'Ne jamais laisser le bassin tourner ou s\'affaisser pendant la transition',
          'Alterner le bras qui commence à chaque répétition',
        ],
        runnerTip: 'Renforce le core en résistance à la rotation, un vrai test de stabilité anti-rotation sous charge changeante.',
        progression: 'Ajouter un temps de maintien de 2 sec en planche haute avant de redescendre.',
      },
      {
        name: 'Windshield Wipers', emoji: '🌀', type: 'Concentrique',
        muscles: ['Obliques', 'Core', 'Fléchisseurs de hanche'],
        sets: '3', reps: '10 / côté',
        shortDesc: 'Sur le dos, jambes tendues en l\'air, les faire basculer de chaque côté sans toucher le sol',
        technique: [
          'Bras en croix pour stabiliser le haut du corps, épaules au sol en permanence',
          'Descendre les jambes le plus loin possible sans les laisser toucher le sol',
          'Contrôler le retour au centre avec les obliques, pas l\'élan',
        ],
        runnerTip: 'Cible les obliques dans un mouvement de rotation contrôlée — utile pour absorber la rotation du bassin en fin de course fatiguée.',
        progression: 'Jambes fléchies pour débuter, jambes tendues pour progresser, puis ajouter un léger poids entre les pieds.',
      },
      {
        name: 'Pallof Press', emoji: '🎗️', type: 'Isométrique',
        muscles: ['Core', 'Obliques', 'Épaules'],
        sets: '3', reps: '12 / côté',
        shortDesc: 'Élastique fixé sur le côté, pousser les mains devant soi en résistant à la rotation',
        technique: [
          'Se placer perpendiculaire au point d\'ancrage, tension de l\'élastique dès le départ',
          'Pousser droit devant sans laisser le buste tourner vers l\'élastique',
          'Tenir 2 sec en extension complète avant de revenir lentement',
        ],
        runnerTip: 'L\'exercice anti-rotation de référence — exactement la fonction que le core doit remplir à chaque appui pour stabiliser le tronc.',
        progression: 'Augmenter la résistance de l\'élastique ou faire l\'exercice à genoux pour plus d\'instabilité.',
      },
      {
        name: 'Suitcase Carry', emoji: '🧳', type: 'Isométrique',
        muscles: ['Obliques', 'Core', 'Avant-bras'],
        sets: '3', reps: '30 m / côté',
        shortDesc: 'Marcher en portant une charge lourde d\'un seul côté, buste bien droit',
        technique: [
          'Épaules alignées horizontalement, ne pas se pencher du côté de la charge',
          'Pas courts et contrôlés, core gainé en permanence',
          'Respirer normalement sans relâcher la tension abdominale',
        ],
        runnerTip: 'Renforce la résistance à la flexion latérale du tronc — un core capable de rester droit malgré un déséquilibre limite le tangage à la course.',
        progression: 'Augmenter la charge progressivement ou allonger la distance de marche.',
      },
    ],
  },

  /* ── 14. Abdos & Obliques Intenses ────────────────────────────────── */
  {
    id: 'abdos_obliques', name: 'Abdos & Obliques Intenses', emoji: '🔥', duration: '25–30 min',
    subtitle: 'Rectus abdominis · obliques · rotation du tronc',
    color: '#8B2FC9',
    exercises: [
      {
        name: 'Russian Twist', emoji: '🌀', type: 'Concentrique',
        muscles: ['Obliques', 'Core', 'Fléchisseurs de hanche'],
        sets: '3', reps: '20 alternés',
        shortDesc: 'Assis en équilibre sur les ischions, pieds décollés, faire pivoter un poids d\'un côté à l\'autre',
        technique: [
          'Buste incliné à 45°, dos droit, ne pas s\'arrondir',
          'Rotation complète du buste, le poids touche le sol de chaque côté',
          'Pieds décollés pour la version avancée, au sol pour débuter',
        ],
        runnerTip: 'Renforce les obliques dans le plan de rotation, directement transférable à la gestion du balancement du buste en course.',
        progression: 'Ajouter du poids (médecine-ball, disque) ou décoller davantage les pieds du sol.',
      },
      {
        name: 'Side Plank Rotation', emoji: '📐', type: 'Concentrique',
        muscles: ['Obliques', 'Core', 'Épaules'],
        sets: '3', reps: '10 / côté',
        shortDesc: 'En planche latérale, passer le bras libre sous le corps puis le ramener vers le plafond',
        technique: [
          'Hanches levées et stables pendant toute la rotation',
          'Le bras passe sous le buste (thread the needle) puis remonte en extension complète',
          'Tempo lent, pas d\'élan pour effectuer la rotation',
        ],
        runnerTip: 'Combine gainage latéral et rotation contrôlée — travaille les obliques dans deux fonctions essentielles à la stabilité du buste.',
        progression: 'Tenir 2 sec en position haute de rotation, ou ajouter un léger poids en main.',
      },
      {
        name: 'Woodchopper élastique', emoji: '🪓', type: 'Concentrique',
        muscles: ['Obliques', 'Core', 'Épaules'],
        sets: '3', reps: '12 / côté',
        shortDesc: 'Élastique fixé en hauteur, tirer en diagonale d\'un côté à la hanche opposée',
        technique: [
          'Rotation initiée par les hanches et le tronc, pas seulement les bras',
          'Jambes légèrement fléchies pour transférer la force du bas vers le haut',
          'Contrôler le retour à la position de départ sans relâcher brutalement',
        ],
        runnerTip: 'Reproduit un schéma de rotation diagonale proche du mouvement combiné bras-tronc de la course rapide.',
        progression: 'Augmenter la résistance de l\'élastique ou ralentir la phase de retour.',
      },
      {
        name: 'Hanging Knee Raise', emoji: '🦵', type: 'Concentrique',
        muscles: ['Fléchisseurs de hanche', 'Rectus abdominis', 'Avant-bras'],
        sets: '3', reps: '12–15',
        shortDesc: 'Suspendu à une barre, remonter les genoux vers la poitrine sans se balancer',
        technique: [
          'Départ en suspension complète, épaules engagées (pas relâchées)',
          'Remonter les genoux en enroulant le bassin, pas juste en fléchissant les hanches',
          'Descente contrôlée, éviter le balancement du corps',
        ],
        runnerTip: 'Renforce les fléchisseurs de hanche et le bas des abdominaux en résistant à la gravité — utile pour la phase de relevé du genou en course.',
        progression: 'Jambes tendues au lieu de fléchies (Hanging Leg Raise) quand la version fléchie est maîtrisée sans élan.',
      },
      {
        name: 'V-Up', emoji: '📐', type: 'Concentrique',
        muscles: ['Rectus abdominis', 'Fléchisseurs de hanche', 'Ischio-jambiers'],
        sets: '3', reps: '12',
        shortDesc: 'Allongé, lever simultanément buste et jambes tendues pour former un V',
        technique: [
          'Bras tendus vers les pieds, jambes tendues, décoller les deux en même temps',
          'Chercher à toucher les pieds avec les mains en haut du mouvement',
          'Redescendre lentement sans laisser les lombaires se cambrer',
        ],
        runnerTip: 'Exercice complet qui synchronise le travail du haut et du bas des abdominaux — utile pour la coordination du tronc à haute intensité.',
        progression: 'Jambes fléchies pour débuter (moins de bras de levier), jambes tendues pour progresser.',
      },
    ],
  },

  /* ── 15. Core Stabilité Avancée ───────────────────────────────────── */
  {
    id: 'core_stabilite_avancee', name: 'Core Stabilité Avancée', emoji: '🛡️', duration: '25–35 min',
    subtitle: 'Gainage évolué · anti-extension · contrôle profond',
    color: '#EC4899',
    exercises: [
      {
        name: 'Stir the Pot', emoji: '🥣', type: 'Isométrique',
        muscles: ['Core', 'Transverse', 'Épaules'],
        sets: '3', reps: '8 cercles / sens',
        shortDesc: 'Avant-bras sur un ballon de gym en planche, tracer de larges cercles avec le ballon',
        technique: [
          'Corps rigide de la tête aux talons, hanches stables pendant tout le cercle',
          'Cercles amples et lents dans les deux sens',
          'Ne jamais laisser le bassin suivre le mouvement du ballon',
        ],
        runnerTip: 'L\'instabilité du ballon force un recrutement profond et continu du core — un excellent test de gainage réactif.',
        progression: 'Agrandir le diamètre des cercles ou ralentir encore le tempo.',
      },
      {
        name: 'Copenhagen Plank', emoji: '🩰', type: 'Isométrique',
        muscles: ['Adducteurs', 'Core', 'Obliques'],
        sets: '3', reps: '20–30 sec / côté',
        shortDesc: 'Planche latérale avec la jambe supérieure posée sur un banc, jambe inférieure levée',
        technique: [
          'Jambe du haut sur le banc, jambe du bas maintenue en l\'air tout le long',
          'Hanches alignées, ne jamais les laisser tomber vers le sol',
          'Respirer normalement en maintenant la contraction des adducteurs',
        ],
        runnerTip: 'Renforce les adducteurs souvent négligés — leur faiblesse est associée à un risque accru de pubalgie chez les coureurs à haut volume.',
        progression: 'Commencer genou fléchi (version facilitée) puis passer à la jambe tendue.',
      },
      {
        name: 'Hollow Body Hold', emoji: '🛶', type: 'Isométrique',
        muscles: ['Core', 'Fléchisseurs de hanche', 'Rectus abdominis'],
        sets: '3', reps: '20–40 sec',
        shortDesc: 'Sur le dos, bras et jambes tendus légèrement décollés, bas du dos plaqué au sol',
        technique: [
          'Bas du dos collé au sol en permanence — c\'est le critère de réussite',
          'Bras derrière la tête, jambes tendues, angle bas pour plus de difficulté',
          'Respiration régulière sans perdre la position',
        ],
        runnerTip: 'Position fondamentale de la gymnastique qui développe un contrôle abdominal complet, transférable à la posture de course sous fatigue.',
        progression: 'Abaisser progressivement bras et jambes vers le sol pour augmenter le bras de levier.',
      },
      {
        name: 'Plank Reach-Under', emoji: '🤲', type: 'Concentrique',
        muscles: ['Core', 'Obliques', 'Épaules'],
        sets: '3', reps: '10 / côté',
        shortDesc: 'En planche haute, passer une main sous le corps vers l\'extérieur opposé puis revenir',
        technique: [
          'Hanches immobiles pendant tout le mouvement de reach',
          'Rotation minimale du bassin, le mouvement vient du bras et des épaules',
          'Revenir en position de planche stable avant l\'autre côté',
        ],
        runnerTip: 'Sollicite le core en anti-rotation dynamique, un pont entre le gainage statique et les mouvements réels de course.',
        progression: 'Ralentir le tempo ou ajouter un contact main-sol plus éloigné pour plus d\'amplitude.',
      },
      {
        name: 'Pallof Press à genoux', emoji: '🎗️', type: 'Isométrique',
        muscles: ['Core', 'Obliques', 'Fessiers'],
        sets: '3', reps: '10 / côté',
        shortDesc: 'Version à genoux du Pallof Press, base d\'appui réduite pour plus d\'instabilité',
        technique: [
          'Un genou au sol, l\'autre pied à plat, hanches stables et carrées',
          'Pousser l\'élastique droit devant sans rotation du buste',
          'Contracter les fessiers pour stabiliser le bassin pendant la poussée',
        ],
        runnerTip: 'La base réduite exige davantage de stabilisation du core que la version debout — utile en progression avancée.',
        progression: 'Augmenter la résistance de l\'élastique ou allonger le temps de maintien en extension.',
      },
    ],
  },

  /* ── 16. Respiration & Posture ────────────────────────────────────── */
  {
    id: 'respiration_posture', name: 'Respiration & Posture', emoji: '🌬️', duration: '20–30 min',
    subtitle: 'Respiration diaphragmatique · alignement · gainage profond',
    color: '#6B7280',
    exercises: [
      {
        name: 'Respiration 90/90', emoji: '🌬️', type: 'Mobilité',
        muscles: ['Diaphragme', 'Transverse', 'Core profond'],
        sets: '3', reps: '8–10 respirations',
        shortDesc: 'Jambes surélevées à 90°/90°, respirer profondément en gonflant les côtes plutôt que le ventre',
        technique: [
          'Bas du dos plaqué au sol, jambes posées sur une chaise ou un ballon',
          'Inspirer par le nez en élargissant les côtes sur les côtés, pas juste le ventre',
          'Expirer longuement par la bouche en relâchant toute tension du haut du corps',
        ],
        runnerTip: 'Une respiration diaphragmatique efficace améliore l\'oxygénation et réduit la tension parasite dans les épaules et le cou pendant l\'effort.',
        progression: 'Allonger progressivement le temps d\'expiration (ratio 1:2 inspiration/expiration).',
      },
      {
        name: 'Wall Posture Reset', emoji: '🧱', type: 'Isométrique',
        muscles: ['Érecteurs', 'Trapèzes', 'Core'],
        sets: '3', reps: '45–60 sec',
        shortDesc: 'Dos contre un mur, talons, fessiers, omoplates et tête en contact, maintenir l\'alignement',
        technique: [
          'Rentrer légèrement le menton pour aligner la tête sur la colonne',
          'Coller le bas du dos au mur en contractant légèrement le transverse',
          'Respirer sans perdre le contact des quatre points d\'appui',
        ],
        runnerTip: 'Réinitialise la posture de référence — un repère utile à retrouver mentalement pendant les longues sorties quand la fatigue installe le dos rond.',
        progression: 'Fermer les yeux pour renforcer la conscience posturale sans repère visuel.',
      },
      {
        name: 'Thoracic Rotation assise', emoji: '🔄', type: 'Mobilité',
        muscles: ['Colonne thoracique', 'Obliques', 'Épaules'],
        sets: '2', reps: '10 / côté',
        shortDesc: 'Assis, bras croisés sur la poitrine, tourner le buste d\'un côté puis de l\'autre',
        technique: [
          'Bassin fixe, immobile — toute la rotation vient du haut du dos',
          'Expirer en tournant pour faciliter l\'amplitude',
          'Mouvement lent et contrôlé, pas de rebond en fin de rotation',
        ],
        runnerTip: 'Une bonne mobilité thoracique permet un balancement des bras plus ample et plus économique en course.',
        progression: 'Ajouter un léger bâton tenu horizontalement pour guider et amplifier la rotation.',
      },
      {
        name: 'Standing March contrôlée', emoji: '🚶', type: 'Concentrique',
        muscles: ['Core', 'Fléchisseurs de hanche', 'Fessiers'],
        sets: '3', reps: '10 / côté',
        shortDesc: 'Debout, monter un genou à 90° en expirant fort, sans perdre l\'équilibre du bassin',
        technique: [
          'Expirer complètement au sommet du mouvement pour engager le transverse',
          'Bassin parfaitement stable, pas d\'inclinaison lors de la montée du genou',
          'Reposer le pied avec contrôle, pas de chute brusque',
        ],
        runnerTip: 'Associe respiration et stabilité unipodale — un pont direct vers le contrôle postural requis à chaque appui de course.',
        progression: 'Fermer les yeux ou ajouter une résistance élastique autour des chevilles.',
      },
      {
        name: 'Bracing Drill chargé', emoji: '🎒', type: 'Isométrique',
        muscles: ['Transverse', 'Core', 'Érecteurs'],
        sets: '3', reps: '30 m de marche',
        shortDesc: 'Marcher avec une charge modérée sur les épaules en maintenant un gainage abdominal actif',
        technique: [
          'Contracter le transverse comme pour se préparer à un léger coup dans le ventre',
          'Maintenir cette contraction légère en respirant normalement pendant toute la marche',
          'Buste droit, pas de compensation en cambrure lombaire',
        ],
        runnerTip: 'Entraîne le gainage réflexe sous charge et en mouvement — la compétence recherchée pour stabiliser le tronc sur les longues distances.',
        progression: 'Augmenter la charge portée ou allonger la distance de marche.',
      },
    ],
  },

  /* ── 17. Fessiers Unilatéral ───────────────────────────────────────── */
  {
    id: 'fessiers_unilateral', name: 'Fessiers Unilatéral', emoji: '🦵', duration: '30–40 min',
    subtitle: 'Grand fessier · asymétries · stabilité de hanche',
    color: '#10B981',
    exercises: [
      {
        name: 'Single Leg Hip Thrust', emoji: '🍑', type: 'Concentrique',
        muscles: ['Grand fessier', 'Ischio-jambiers', 'Core'],
        sets: '3', reps: '12 / côté',
        shortDesc: 'Dos sur un banc, une jambe tendue en l\'air, pousser le bassin vers le haut sur l\'autre jambe',
        technique: [
          'Jambe libre tendue, ne pas la laisser retomber pendant le mouvement',
          'Extension complète du bassin, contraction maximale du fessier en haut',
          'Descente contrôlée sans laisser le bassin partir en rotation',
        ],
        runnerTip: 'Isole totalement le fessier d\'un côté — l\'exercice de référence pour corriger une faiblesse unilatérale identifiée.',
        progression: 'Ajouter une charge sur les hanches ou surélever le pied d\'appui.',
      },
      {
        name: 'Curtsy Lunge', emoji: '🩰', type: 'Concentrique',
        muscles: ['Moyen fessier', 'Grand fessier', 'Quadriceps'],
        sets: '3', reps: '10 / côté',
        shortDesc: 'Croiser une jambe en arrière en diagonale et descendre en fente',
        technique: [
          'Jambe arrière croise derrière la jambe d\'appui en diagonale',
          'Genou avant dans l\'axe du pied, buste droit',
          'Pousser fort sur le talon avant pour remonter',
        ],
        runnerTip: 'Sollicite le moyen fessier dans un plan de mouvement latéral, complémentaire au travail sagittal habituel de la course.',
        progression: 'Ajouter des haltères ou augmenter la profondeur de la fente.',
      },
      {
        name: 'Abduction de hanche debout élastique', emoji: '🎗️', type: 'Concentrique',
        muscles: ['Moyen fessier', 'Petit fessier'],
        sets: '3', reps: '15 / côté',
        shortDesc: 'Élastique aux chevilles, lever la jambe sur le côté en gardant le buste droit',
        technique: [
          'Jambe d\'appui légèrement fléchie, bassin stable',
          'Lever la jambe latéralement sans pencher le buste du côté opposé',
          'Redescendre avec contrôle sans relâcher la tension de l\'élastique',
        ],
        runnerTip: 'Le moyen fessier stabilise le bassin à chaque appui — un renforcement ciblé réduit le risque de bandelette ilio-tibiale.',
        progression: 'Augmenter la résistance de l\'élastique ou ralentir la phase de retour.',
      },
      {
        name: 'Single Leg RDL to Row', emoji: '🔱', type: 'Polyarticulaire',
        muscles: ['Ischio-jambiers', 'Grand fessier', 'Dos'],
        sets: '3', reps: '10 / côté',
        shortDesc: 'Sur un pied, basculer le buste en avant et tirer un haltère vers la hanche',
        technique: [
          'Corps en T stable avant d\'initier le rowing',
          'Tirer l\'haltère en gardant le dos plat, coude proche du corps',
          'Revenir à la verticale avec contrôle sur la jambe d\'appui',
        ],
        runnerTip: 'Combine équilibre unipodal et renforcement du dos — utile pour la coordination globale du haut et du bas du corps en course.',
        progression: 'Augmenter le poids de l\'haltère ou fermer les yeux pour plus de difficulté d\'équilibre.',
      },
      {
        name: 'Step Down excentrique', emoji: '🪜', type: 'Excentrique',
        muscles: ['Grand fessier', 'Quadriceps', 'Stabilisateurs'],
        sets: '3', reps: '10 / côté',
        shortDesc: 'Debout sur un step, descendre lentement l\'autre pied vers le sol sans y poser le poids',
        technique: [
          'Descente ultra-contrôlée en 3–4 sec, genou dans l\'axe du pied',
          'Toucher le sol légèrement du talon sans transférer le poids',
          'Remonter en poussant avec la jambe sur le step',
        ],
        runnerTip: 'Le contrôle excentrique de la descente reproduit la phase d\'amortissement de chaque appui, en particulier en descente de côte.',
        progression: 'Augmenter la hauteur du step ou ajouter une charge légère.',
      },
    ],
  },

  /* ── 18. Ischio-jambiers Force ────────────────────────────────────── */
  {
    id: 'ischio_force', name: 'Ischio-jambiers Force', emoji: '💪', duration: '30–40 min',
    subtitle: 'Force maximale · prévention des déchirures',
    color: '#0EA5E9',
    exercises: [
      {
        name: 'Nordic Curl assisté élastique', emoji: '🦵', type: 'Excentrique',
        muscles: ['Ischio-jambiers', 'Mollets'],
        sets: '3', reps: '8–10',
        shortDesc: 'Nordic Curl avec un élastique fixé devant pour assister la remontée',
        technique: [
          'Chevilles fixées, corps rigide de la tête aux genoux',
          'Descente lente et contrôlée, l\'élastique aide à revenir en position haute',
          'Réduire progressivement l\'assistance de l\'élastique avec les semaines',
        ],
        runnerTip: 'Version accessible du Nordic Curl pour progresser vers la version complète sans se décourager par des courbatures excessives.',
        progression: 'Réduire la tension de l\'élastique semaine après semaine jusqu\'au Nordic Curl sans assistance.',
      },
      {
        name: 'Swiss Ball Hamstring Curl', emoji: '⚽', type: 'Concentrique',
        muscles: ['Ischio-jambiers', 'Fessiers', 'Core'],
        sets: '3', reps: '12–15',
        shortDesc: 'Sur le dos, talons sur un ballon, pousser le bassin en l\'air puis ramener le ballon vers les fessiers',
        technique: [
          'Bassin haut et stable pendant tout le mouvement de flexion du genou',
          'Ramener le ballon le plus près possible des fessiers',
          'Revenir en contrôlant, ne pas laisser le bassin retomber',
        ],
        runnerTip: 'Sollicite les ischio-jambiers en position de hanche étendue, condition proche de la phase de poussée en course.',
        progression: 'Passer en unilatéral (une jambe sur le ballon) pour augmenter la difficulté.',
      },
      {
        name: 'Soulevé de terre jambes tendues', emoji: '🔱', type: 'Excentrique',
        muscles: ['Ischio-jambiers', 'Grand fessier', 'Érecteurs'],
        sets: '3', reps: '10',
        shortDesc: 'Barre ou haltères, jambes quasi tendues, descendre en poussant les hanches en arrière',
        technique: [
          'Genoux à peine fléchis et fixes tout le mouvement',
          'Descendre jusqu\'à sentir l\'étirement maximal des ischio-jambiers, sans arrondir le dos',
          'Remonter en contractant fessiers et ischio-jambiers, pas le bas du dos',
        ],
        runnerTip: 'Charge les ischio-jambiers en position longue — la zone la plus souvent lésée lors des sprints ou fractionnés rapides.',
        progression: 'Augmenter la charge progressivement ou passer en unilatéral.',
      },
      {
        name: 'Single Leg Hamstring Bridge', emoji: '🌉', type: 'Concentrique',
        muscles: ['Ischio-jambiers', 'Grand fessier'],
        sets: '3', reps: '12 / côté',
        shortDesc: 'Sur le dos, un talon au sol, pousser le bassin vers le haut sur une seule jambe',
        technique: [
          'Talon d\'appui bien ancré, jambe libre tendue et immobile',
          'Extension complète de la hanche, alignement genou-hanche-épaule en haut',
          'Descente contrôlée, pas de chute brutale du bassin',
        ],
        runnerTip: 'Version unilatérale qui révèle et corrige les déficits de force entre les deux jambes.',
        progression: 'Ajouter une charge sur le bassin ou surélever le talon d\'appui.',
      },
      {
        name: 'Sliding Leg Curl', emoji: '🧊', type: 'Excentrique',
        muscles: ['Ischio-jambiers', 'Core', 'Fessiers'],
        sets: '3', reps: '10–12',
        shortDesc: 'Sur le dos, pieds sur des patins glissants, fléchir et tendre les jambes en gardant le bassin haut',
        technique: [
          'Bassin maintenu en extension pendant tout le mouvement',
          'Ramener les talons vers les fessiers en glissant, puis retendre lentement',
          'Ne jamais laisser le bassin s\'affaisser entre les répétitions',
        ],
        runnerTip: 'Combine travail concentrique et excentrique des ischio-jambiers en un seul mouvement fluide, très proche du cycle de la foulée.',
        progression: 'Ralentir la phase d\'extension des jambes (3–4 sec) pour plus de travail excentrique.',
      },
    ],
  },

  /* ── 19. Chaîne Postérieure Complète ──────────────────────────────── */
  {
    id: 'chaine_posterieure', name: 'Chaîne Postérieure Complète', emoji: '⛓️', duration: '35–45 min',
    subtitle: 'Dos · fessiers · ischio-jambiers · force globale',
    color: '#6366F1',
    exercises: [
      {
        name: 'Soulevé de terre conventionnel', emoji: '🏋️', type: 'Polyarticulaire',
        muscles: ['Ischio-jambiers', 'Grand fessier', 'Érecteurs', 'Dos'],
        sets: '4', reps: '8',
        shortDesc: 'Barre au sol, pieds largeur de hanches, se relever en gardant le dos plat',
        technique: [
          'Barre proche des tibias, dos plat, poitrine sortie avant de tirer',
          'Pousser le sol avec les jambes avant de tirer avec le dos',
          'Extension complète des hanches en haut, sans hyperextension lombaire',
        ],
        runnerTip: 'Le mouvement de force fondamental de toute la chaîne postérieure — développe la puissance globale nécessaire à la propulsion.',
        progression: 'Augmenter la charge progressivement en respectant strictement la technique.',
      },
      {
        name: 'Trap Bar Deadlift', emoji: '🔺', type: 'Polyarticulaire',
        muscles: ['Quadriceps', 'Grand fessier', 'Ischio-jambiers'],
        sets: '4', reps: '10',
        shortDesc: 'Barre hexagonale, position plus proche du squat, tirer en se tenant debout',
        technique: [
          'Barre alignée avec le centre de gravité, dos neutre',
          'Descente en poussant les hanches en arrière et en fléchissant les genoux',
          'Remontée en poussant fort dans le sol des deux pieds',
        ],
        runnerTip: 'Plus accessible techniquement que le deadlift classique, cible fessiers et quadriceps en synergie.',
        progression: 'Augmenter la charge ou passer à une version déficit (surélevé) pour plus d\'amplitude.',
      },
      {
        name: 'Back Extension', emoji: '🌅', type: 'Concentrique',
        muscles: ['Érecteurs', 'Grand fessier', 'Ischio-jambiers'],
        sets: '3', reps: '15',
        shortDesc: 'Sur un banc à hyperextension, descendre le buste puis remonter à l\'horizontale',
        technique: [
          'Ne pas dépasser l\'horizontale en haut du mouvement (pas d\'hyperextension)',
          'Contracter fessiers et ischio-jambiers pour initier la remontée, pas le bas du dos',
          'Descente contrôlée jusqu\'à sentir l\'étirement des ischio-jambiers',
        ],
        runnerTip: 'Renforce les érecteurs du rachis en soutien de la posture de course, particulièrement utile en fin de longue distance.',
        progression: 'Ajouter un poids tenu contre la poitrine.',
      },
      {
        name: 'Soulevé de terre sumo', emoji: '🔱', type: 'Polyarticulaire',
        muscles: ['Adducteurs', 'Grand fessier', 'Quadriceps'],
        sets: '3', reps: '10',
        shortDesc: 'Pieds très écartés, orteils ouverts, tirer la barre en position sumo',
        technique: [
          'Pieds plus larges que les épaules, genoux dans l\'axe des orteils',
          'Buste plus vertical que le deadlift conventionnel',
          'Pousser les genoux vers l\'extérieur en tirant',
        ],
        runnerTip: 'Sollicite davantage les adducteurs et les quadriceps que le deadlift classique — utile pour une chaîne postérieure complète.',
        progression: 'Augmenter la charge progressivement en maîtrisant l\'ouverture des genoux.',
      },
      {
        name: 'Reverse Hyperextension', emoji: '🔄', type: 'Concentrique',
        muscles: ['Grand fessier', 'Érecteurs', 'Ischio-jambiers'],
        sets: '3', reps: '15',
        shortDesc: 'Buste fixé sur un banc, jambes dans le vide, les lever à l\'horizontale',
        technique: [
          'Buste stable et fixé, tout le mouvement vient des hanches',
          'Lever les jambes jusqu\'à l\'horizontale sans cambrer excessivement',
          'Redescendre avec contrôle, jambes tendues',
        ],
        runnerTip: 'Décompresse la colonne lombaire tout en renforçant la chaîne postérieure — utile en complément d\'un gros volume de course.',
        progression: 'Ajouter un poids léger entre les chevilles.',
      },
    ],
  },

  /* ── 20. Fessiers Élastique & Activation ──────────────────────────── */
  {
    id: 'fessiers_elastique', name: 'Fessiers Élastique & Activation', emoji: '🎗️', duration: '20–30 min',
    subtitle: 'Activation · échauffement · moyen fessier',
    color: '#EC4899',
    exercises: [
      {
        name: 'Monster Walk', emoji: '👣', type: 'Concentrique',
        muscles: ['Moyen fessier', 'Grand fessier'],
        sets: '3', reps: '15 pas / sens',
        shortDesc: 'Élastique aux genoux, pas larges en diagonale avant-arrière',
        technique: [
          'Genoux légèrement fléchis, buste droit tout le mouvement',
          'Grands pas en diagonale en maintenant la tension de l\'élastique',
          'Ne jamais laisser les genoux se rapprocher entre les pas',
        ],
        runnerTip: 'Excellent exercice d\'activation avant course ou séance — réveille le moyen fessier souvent inhibé après une position assise prolongée.',
        progression: 'Élastique plus résistant ou pas plus larges.',
      },
      {
        name: 'Banded Hip Thrust', emoji: '🍑', type: 'Concentrique',
        muscles: ['Grand fessier', 'Moyen fessier'],
        sets: '3', reps: '15',
        shortDesc: 'Hip Thrust classique avec un élastique placé au-dessus des genoux',
        technique: [
          'Pousser les genoux vers l\'extérieur contre l\'élastique en montant',
          'Extension complète du bassin, contraction maximale en haut',
          'Descente contrôlée sans relâcher la tension latérale',
        ],
        runnerTip: 'L\'élastique ajoute un travail d\'abduction qui recrute davantage le moyen fessier, stabilisateur clé du bassin en course.',
        progression: 'Augmenter la résistance de l\'élastique ou passer en unilatéral.',
      },
      {
        name: 'Fire Hydrant', emoji: '🐕', type: 'Concentrique',
        muscles: ['Moyen fessier', 'Rotateurs externes'],
        sets: '3', reps: '15 / côté',
        shortDesc: 'À quatre pattes, lever un genou sur le côté comme un chien lève la patte',
        technique: [
          'Genou fléchi à 90° tout le mouvement, hanches stables',
          'Lever le plus haut possible sans faire tourner le bassin',
          'Redescendre avec contrôle sans reposer le genou brutalement',
        ],
        runnerTip: 'Cible spécifiquement les rotateurs externes de hanche, essentiels pour éviter le valgus du genou (genoux qui rentrent) en course.',
        progression: 'Ajouter un élastique au-dessus du genou.',
      },
      {
        name: 'Donkey Kick', emoji: '🦵', type: 'Concentrique',
        muscles: ['Grand fessier'],
        sets: '3', reps: '15 / côté',
        shortDesc: 'À quatre pattes, pousser un pied vers le plafond, genou fléchi à 90°',
        technique: [
          'Genou fléchi à 90° maintenu tout le mouvement, pied à plat vers le plafond',
          'Contraction maximale du fessier en haut, pas de cambrure lombaire',
          'Redescendre lentement sans reposer le genou au sol entre les reps',
        ],
        runnerTip: 'Isole le grand fessier en pure extension de hanche, idéal en activation avant une séance de côtes ou de fractionné.',
        progression: 'Ajouter un élastique derrière le genou ou une cheville lestée.',
      },
      {
        name: 'Standing Band Kickback', emoji: '🎗️', type: 'Concentrique',
        muscles: ['Grand fessier', 'Ischio-jambiers'],
        sets: '3', reps: '15 / côté',
        shortDesc: 'Debout, élastique à la cheville, pousser la jambe en arrière en extension de hanche',
        technique: [
          'Buste légèrement incliné en avant, dos droit',
          'Extension de hanche complète sans cambrer le bas du dos',
          'Retour contrôlé sans laisser l\'élastique tirer brutalement la jambe',
        ],
        runnerTip: 'Reproduit le mouvement d\'extension de hanche de la propulsion en course dans une version d\'activation légère.',
        progression: 'Augmenter la résistance de l\'élastique ou ajouter un temps de maintien en fin d\'extension.',
      },
    ],
  },

  /* ── 21. Postérieur Puissance ──────────────────────────────────────── */
  {
    id: 'posterieur_puissance', name: 'Postérieur Puissance', emoji: '⚡', duration: '30–40 min',
    subtitle: 'Explosivité · chaîne postérieure · propulsion',
    color: '#F59E0B',
    exercises: [
      {
        name: 'Broad Jump', emoji: '🦘', type: 'Plyométrique',
        muscles: ['Grand fessier', 'Ischio-jambiers', 'Quadriceps'],
        sets: '4', reps: '5',
        shortDesc: 'Saut en longueur depuis un départ arrêté, réception stable et contrôlée',
        technique: [
          'Contre-mouvement des bras et des hanches avant l\'impulsion',
          'Extension complète des hanches à l\'envol, recherche de distance maximale',
          'Réception genoux fléchis, stabiliser 1 sec avant de recommencer',
        ],
        runnerTip: 'Développe la puissance d\'extension de hanche en une seule impulsion maximale — transférable à la puissance de propulsion en côte.',
        progression: 'Enchaîner plusieurs bonds successifs (broad jump répétés) sans pause complète.',
      },
      {
        name: 'Single Leg Bound', emoji: '🦵', type: 'Plyométrique',
        muscles: ['Grand fessier', 'Ischio-jambiers', 'Mollets'],
        sets: '3', reps: '5 / côté',
        shortDesc: 'Bond unilatéral vers l\'avant, réception et stabilisation sur la même jambe',
        technique: [
          'Impulsion complète sur une jambe, bras actifs pour l\'équilibre',
          'Réception souple sur la même jambe, genou fléchi pour amortir',
          'Stabiliser complètement avant de refaire un bond',
        ],
        runnerTip: 'Le bond unipodal est la forme plyométrique la plus spécifique à la foulée de course — puissance et absorption sur une seule jambe.',
        progression: 'Enchaîner 3 bonds d\'affilée sur la même jambe avant de changer de côté.',
      },
      {
        name: 'Hip Thrust explosif', emoji: '🍑', type: 'Plyométrique',
        muscles: ['Grand fessier', 'Ischio-jambiers'],
        sets: '4', reps: '8',
        shortDesc: 'Hip Thrust avec une phase de poussée la plus rapide possible',
        technique: [
          'Descente contrôlée normale, puis explosion maximale à la remontée',
          'Chercher à décoller légèrement le bassin du poids en haut (sans le lâcher)',
          'Atterrissage souple avant d\'enchaîner la répétition suivante',
        ],
        runnerTip: 'Entraîne le fessier à produire de la force rapidement — la qualité clé pour l\'accélération et le sprint final.',
        progression: 'Utiliser une charge plus légère pour maximiser la vitesse d\'exécution.',
      },
      {
        name: 'Traîneau (Sled Push)', emoji: '🛷', type: 'Polyarticulaire',
        muscles: ['Quadriceps', 'Grand fessier', 'Mollets'],
        sets: '4', reps: '20 m',
        shortDesc: 'Pousser un traîneau chargé sur une distance courte, foulées puissantes',
        technique: [
          'Buste incliné en avant, bras tendus sur les poignées',
          'Poussée puissante et complète à chaque appui, pas de petits pas traînants',
          'Respiration régulière malgré l\'intensité',
        ],
        runnerTip: 'Développe la force de poussée horizontale sans le risque d\'impact du sprint — idéal pour construire la puissance en toute sécurité.',
        progression: 'Augmenter la charge du traîneau ou la distance parcourue.',
      },
      {
        name: 'Depth Jump to Sprint', emoji: '💥', type: 'Plyométrique',
        muscles: ['Grand fessier', 'Mollets', 'Quadriceps'],
        sets: '4', reps: '3',
        shortDesc: 'Descendre d\'une petite caisse, rebondir immédiatement puis sprinter 10 m',
        technique: [
          'Descente simple, pas de saut au départ de la caisse',
          'Réception la plus courte possible au sol avant de rebondir vers l\'avant',
          'Enchaîner directement en sprint sur 10 mètres',
        ],
        runnerTip: 'Combine réactivité tendineuse et transfert direct en vitesse de course — un exercice avancé réservé aux coureurs déjà solides.',
        progression: 'Augmenter légèrement la hauteur de la caisse une fois la technique maîtrisée.',
      },
    ],
  },

  /* ── 22. Jambes Unilatéral ─────────────────────────────────────────── */
  {
    id: 'jambes_unilateral', name: 'Jambes Unilatéral', emoji: '🦿', duration: '30–40 min',
    subtitle: 'Équilibre gauche/droite · stabilité de genou',
    color: '#E8237A',
    exercises: [
      {
        name: 'Pistol Squat assisté', emoji: '🍸', type: 'Concentrique',
        muscles: ['Quadriceps', 'Fessiers', 'Équilibre'],
        sets: '3', reps: '6–8 / côté',
        shortDesc: 'Squat complet sur une jambe, l\'autre tendue devant, en se tenant à un support léger',
        technique: [
          'Se tenir légèrement à un poteau ou un TRX pour l\'équilibre au début',
          'Descendre le plus bas possible en gardant le talon au sol',
          'Remonter en poussant fort dans le talon, sans à-coup',
        ],
        runnerTip: 'Exercice unilatéral exigeant qui développe force et contrôle du genou en amplitude complète, l\'une des meilleures préparations contre les asymétries.',
        progression: 'Réduire progressivement l\'aide du support jusqu\'au pistol squat libre.',
      },
      {
        name: 'Fente arrière (Reverse Lunge)', emoji: '🚶', type: 'Concentrique',
        muscles: ['Quadriceps', 'Fessiers', 'Ischio-jambiers'],
        sets: '3', reps: '10 / côté',
        shortDesc: 'Reculer une jambe et descendre en fente, revenir en position debout',
        technique: [
          'Grand pas en arrière, genou avant dans l\'axe du pied',
          'Descendre jusqu\'à ce que le genou arrière frôle le sol',
          'Pousser sur le talon avant pour revenir à la position de départ',
        ],
        runnerTip: 'Moins traumatisant pour le genou que la fente avant — un bon point d\'entrée pour le travail unilatéral des jambes.',
        progression: 'Ajouter des haltères ou passer en fente marchée.',
      },
      {
        name: 'Step Down contrôlé', emoji: '🪜', type: 'Excentrique',
        muscles: ['Quadriceps', 'Fessiers', 'Stabilisateurs genou'],
        sets: '3', reps: '10 / côté',
        shortDesc: 'Debout sur un step, descendre lentement l\'autre jambe jusqu\'à toucher le sol',
        technique: [
          'Genou d\'appui aligné avec les orteils tout le mouvement',
          'Descente en 3–4 sec, contrôle total, pas de chute',
          'Toucher le sol du talon libre puis remonter en poussant sur la jambe d\'appui',
        ],
        runnerTip: 'Reproduit précisément l\'absorption d\'impact de chaque appui de course, particulièrement utile pour la prévention du genou du coureur.',
        progression: 'Augmenter la hauteur du step ou ralentir davantage la descente.',
      },
      {
        name: 'Skater Squat', emoji: '⛸️', type: 'Concentrique',
        muscles: ['Quadriceps', 'Fessiers', 'Équilibre'],
        sets: '3', reps: '8 / côté',
        shortDesc: 'Squat unilatéral avec la jambe libre tendue en arrière, touchant légèrement le sol',
        technique: [
          'Buste légèrement incliné en avant pour garder l\'équilibre',
          'Descendre jusqu\'à ce que le genou libre touche presque le sol',
          'Remonter en poussant fort sur la jambe d\'appui',
        ],
        runnerTip: 'Combine force unilatérale et équilibre dynamique, une transition idéale vers le pistol squat complet.',
        progression: 'Toucher un support de plus en plus bas puis retirer le support complètement.',
      },
      {
        name: 'Fente latérale', emoji: '↔️', type: 'Concentrique',
        muscles: ['Adducteurs', 'Quadriceps', 'Fessiers'],
        sets: '3', reps: '10 / côté',
        shortDesc: 'Grand pas sur le côté, plier la jambe qui reçoit le poids, l\'autre reste tendue',
        technique: [
          'Pied qui reçoit le poids reste bien à plat, genou dans l\'axe du pied',
          'Jambe opposée tendue, sentir l\'étirement de l\'intérieur de cuisse',
          'Pousser fort pour revenir au centre',
        ],
        runnerTip: 'Renforce dans le plan latéral, complémentaire du travail sagittal de la course — utile pour les changements de direction en trail.',
        progression: 'Ajouter des haltères ou augmenter l\'amplitude du pas latéral.',
      },
    ],
  },

  /* ── 23. Genou & Prévention ────────────────────────────────────────── */
  {
    id: 'quad_genou_prevention', name: 'Genou & Prévention', emoji: '🦵', duration: '25–35 min',
    subtitle: 'Syndrome fémoro-patellaire · tendon rotulien',
    color: '#0EA5E9',
    exercises: [
      {
        name: 'Spanish Squat', emoji: '🎗️', type: 'Isométrique',
        muscles: ['Quadriceps', 'Tendon rotulien'],
        sets: '3', reps: '30–45 sec',
        shortDesc: 'Élastique fixé derrière les genoux et attaché à un point bas, s\'asseoir en squat sans basculer le buste',
        technique: [
          'Élastique tendu derrière les genoux, aide à garder le buste vertical',
          'Descendre en squat en gardant le tibia le plus vertical possible',
          'Maintenir la position isométrique en respirant normalement',
        ],
        runnerTip: 'Protocole clinique de référence pour la tendinopathie rotulienne — charge le tendon sans excès de stress sur l\'articulation.',
        progression: 'Ajouter une charge tenue contre la poitrine ou allonger le temps de maintien.',
      },
      {
        name: 'Sissy Squat', emoji: '🦵', type: 'Excentrique',
        muscles: ['Quadriceps', 'Tendon rotulien'],
        sets: '3', reps: '8–10',
        shortDesc: 'Talons fixés, basculer le corps en arrière en fléchissant seulement les genoux',
        technique: [
          'Se tenir à un support pour l\'équilibre, talons ancrés au sol',
          'Basculer en arrière en gardant les hanches tendues, flexion pure du genou',
          'Remonter en contractant fort le quadriceps',
        ],
        runnerTip: 'Isole le quadriceps en étirement maximal, un renforcement puissant pour le tendon rotulien en prévention.',
        progression: 'Réduire l\'aide du support ou ajouter une légère charge.',
      },
      {
        name: 'Reverse Nordic', emoji: '🦿', type: 'Excentrique',
        muscles: ['Quadriceps', 'Tendon rotulien'],
        sets: '3', reps: '8',
        shortDesc: 'À genoux, buste droit, basculer en arrière en fléchissant seulement les genoux',
        technique: [
          'Genoux au sol, buste et hanches parfaitement alignés',
          'Basculer en arrière le plus loin possible en contrôlant avec les quadriceps',
          'Se rattraper avec les mains si nécessaire, remonter en poussant sur les cuisses',
        ],
        runnerTip: 'L\'équivalent du Nordic Curl mais pour le quadriceps — renforce excentriquement le muscle le plus sollicité à la réception de chaque foulée.',
        progression: 'Augmenter l\'amplitude de la bascule arrière avant de se rattraper.',
      },
      {
        name: 'Wall Sit unilatéral', emoji: '🧱', type: 'Isométrique',
        muscles: ['Quadriceps', 'Fessiers'],
        sets: '3', reps: '20–30 sec / côté',
        shortDesc: 'Wall sit classique puis lever une jambe pour transférer tout le poids sur l\'autre',
        technique: [
          'Dos plaqué au mur, genou d\'appui à 90° ou légèrement plus',
          'Lever la jambe libre sans perdre l\'angle du genou d\'appui',
          'Respirer normalement en maintenant la contraction',
        ],
        runnerTip: 'Isole le travail isométrique sur une seule jambe — utile pour identifier et corriger un déficit de force entre les deux côtés.',
        progression: 'Augmenter le temps de maintien progressivement.',
      },
      {
        name: 'Squat sur boîte tempo', emoji: '📦', type: 'Excentrique',
        muscles: ['Quadriceps', 'Fessiers', 'Genoux'],
        sets: '3', reps: '10',
        shortDesc: 'Squat en descendant très lentement jusqu\'à toucher légèrement une boîte, sans s\'asseoir dessus',
        technique: [
          'Descente en 5 sec, contrôle total du genou dans l\'axe des orteils',
          'Toucher légèrement la boîte sans y transférer le poids',
          'Remonter à vitesse normale en poussant sur les talons',
        ],
        runnerTip: 'La lenteur de la descente maximise le temps sous tension du quadriceps, un stimulus efficace pour renforcer sans lourde charge.',
        progression: 'Augmenter le temps de descente à 6–8 sec ou ajouter une charge légère.',
      },
    ],
  },

  /* ── 24. Jambes Charge Lourde ──────────────────────────────────────── */
  {
    id: 'jambes_charge_lourde', name: 'Jambes Charge Lourde', emoji: '🏋️', duration: '35–45 min',
    subtitle: 'Force maximale · base de puissance',
    color: '#8B2FC9',
    exercises: [
      {
        name: 'Squat arrière (Back Squat)', emoji: '🏋️', type: 'Polyarticulaire',
        muscles: ['Quadriceps', 'Fessiers', 'Core'],
        sets: '4', reps: '6–8',
        shortDesc: 'Barre sur le haut du dos, descendre en squat profond puis remonter',
        technique: [
          'Barre positionnée sur les trapèzes, pieds largeur d\'épaules',
          'Descendre jusqu\'aux cuisses parallèles minimum, genoux dans l\'axe des pieds',
          'Remonter en poussant le sol, buste droit tout le mouvement',
        ],
        runnerTip: 'Le mouvement de force fondamental pour développer la puissance des jambes — base de toute progression en charge lourde.',
        progression: 'Augmenter la charge progressivement sur plusieurs semaines (5–10% quand la technique est solide).',
      },
      {
        name: 'Squat avant (Front Squat)', emoji: '🏋️', type: 'Polyarticulaire',
        muscles: ['Quadriceps', 'Core', 'Fessiers'],
        sets: '4', reps: '6–8',
        shortDesc: 'Barre posée devant sur les épaules, descendre en gardant le buste très droit',
        technique: [
          'Coudes hauts pour maintenir la barre stable sur les épaules',
          'Buste plus vertical que le back squat, sollicite davantage les quadriceps',
          'Remonter en gardant les coudes levés jusqu\'en haut',
        ],
        runnerTip: 'Cible davantage les quadriceps que le squat arrière tout en exigeant un core très engagé pour stabiliser la barre.',
        progression: 'Augmenter la charge progressivement en priorisant la mobilité des poignets et des épaules.',
      },
      {
        name: 'Presse à cuisses (Leg Press)', emoji: '🦵', type: 'Polyarticulaire',
        muscles: ['Quadriceps', 'Fessiers', 'Ischio-jambiers'],
        sets: '4', reps: '10–12',
        shortDesc: 'Assis sur la machine, pousser la plateforme en extension complète des jambes',
        technique: [
          'Pieds largeur d\'épaules sur la plateforme, dos bien calé contre le dossier',
          'Descendre jusqu\'à 90° de flexion de genou sans décoller le bas du dos',
          'Ne jamais verrouiller complètement les genoux en haut',
        ],
        runnerTip: 'Permet de charger lourd les jambes sans le stress de stabilisation du squat libre — utile en complément ou en fin de bloc de charge.',
        progression: 'Augmenter la charge ou passer en unilatéral pour plus de spécificité.',
      },
      {
        name: 'Hack Squat', emoji: '⚙️', type: 'Polyarticulaire',
        muscles: ['Quadriceps', 'Fessiers'],
        sets: '3', reps: '10',
        shortDesc: 'Sur la machine hack squat, descendre en squat guidé puis remonter',
        technique: [
          'Dos et épaules bien calés contre le support de la machine',
          'Descente contrôlée jusqu\'à 90° minimum, genoux dans l\'axe',
          'Poussée complète en remontant sans verrouiller brutalement',
        ],
        runnerTip: 'Le guidage de la machine permet de charger lourd le quadriceps en toute sécurité, utile pour progresser sans risque technique.',
        progression: 'Augmenter la charge progressivement chaque semaine.',
      },
      {
        name: 'Fente marchée chargée', emoji: '🚶', type: 'Polyarticulaire',
        muscles: ['Quadriceps', 'Fessiers', 'Ischio-jambiers'],
        sets: '3', reps: '10 / jambe',
        shortDesc: 'Fentes marchées avec haltères ou barre, sur une distance de 15–20 mètres',
        technique: [
          'Grand pas, genou avant dans l\'axe, genou arrière frôle le sol',
          'Buste droit tout le mouvement, pas de bascule vers l\'avant',
          'Pousser fort sur le talon avant pour enchaîner le pas suivant',
        ],
        runnerTip: 'Combine force et transfert de charge d\'une jambe à l\'autre, très proche du schéma moteur de la foulée.',
        progression: 'Augmenter la charge portée ou la distance parcourue.',
      },
    ],
  },

  /* ── 25. Jambes Endurance Musculaire ───────────────────────────────── */
  {
    id: 'jambes_endurance_muscu', name: 'Jambes Endurance Musculaire', emoji: '🔄', duration: '30–40 min',
    subtitle: 'Résistance à la fatigue · haut volume de répétitions',
    color: '#F97316',
    exercises: [
      {
        name: 'Squat tempo lent', emoji: '⏱️', type: 'Isométrique',
        muscles: ['Quadriceps', 'Fessiers'],
        sets: '3', reps: '20',
        shortDesc: 'Squat au poids du corps avec un tempo très lent (3 sec descente, 3 sec montée)',
        technique: [
          'Compter mentalement 3 sec à la descente et 3 sec à la remontée',
          'Amplitude complète, cuisses parallèles au sol minimum',
          'Respiration régulière malgré la brûlure musculaire progressive',
        ],
        runnerTip: 'Développe l\'endurance musculaire locale des quadriceps — la capacité à répéter un effort sans perte de force, clé sur marathon.',
        progression: 'Ajouter un léger poids tenu contre la poitrine.',
      },
      {
        name: 'Chair Squat Hold', emoji: '🪑', type: 'Isométrique',
        muscles: ['Quadriceps', 'Fessiers'],
        sets: '3', reps: '45–60 sec',
        shortDesc: 'Position assise imaginaire sans chaise, cuisses parallèles au sol, maintenir',
        technique: [
          'Dos droit, genoux à 90°, poids réparti sur tout le pied',
          'Bras tendus devant pour l\'équilibre',
          'Respirer régulièrement, ne pas bloquer sa respiration',
        ],
        runnerTip: 'Simule la fatigue musculaire des derniers kilomètres — un excellent test de résistance mentale et musculaire combinée.',
        progression: 'Allonger le temps de maintien de 10 sec chaque semaine.',
      },
      {
        name: 'Fentes enchaînées 100 reps', emoji: '🚶', type: 'Concentrique',
        muscles: ['Quadriceps', 'Fessiers', 'Ischio-jambiers'],
        sets: '2', reps: '50 / côté',
        shortDesc: 'Enchaîner des fentes classiques au poids du corps jusqu\'à 100 répétitions au total',
        technique: [
          'Technique irréprochable maintenue même en fin de série malgré la fatigue',
          'Rythme régulier, pas de précipitation qui dégraderait la forme',
          'Pauses courtes autorisées si nécessaire, sans interrompre longtemps',
        ],
        runnerTip: 'Un gros volume de répétitions légères développe la résistance musculaire locale, complémentaire au travail de force lourde.',
        progression: 'Réduire le nombre de pauses nécessaires pour compléter les 100 répétitions.',
      },
      {
        name: 'Step-ups cadence rapide', emoji: '🪜', type: 'Concentrique',
        muscles: ['Quadriceps', 'Fessiers', 'Mollets'],
        sets: '3', reps: '30 sec rapide / côté',
        shortDesc: 'Monter et descendre d\'un step le plus vite possible en gardant la technique',
        technique: [
          'Pied entier posé sur le step à chaque montée, pas juste les orteils',
          'Rythme rapide mais contrôlé, pas de mouvement brouillon',
          'Alterner les jambes ou rester sur la même selon la variante choisie',
        ],
        runnerTip: 'Développe l\'endurance musculaire en cadence rapide, un stimulus proche de la fréquence de foulée en course.',
        progression: 'Augmenter la durée de l\'effort à 45 sec puis 60 sec.',
      },
      {
        name: 'Squat Pulse', emoji: '🔽', type: 'Concentrique',
        muscles: ['Quadriceps', 'Fessiers'],
        sets: '3', reps: '20 pulses',
        shortDesc: 'En position basse de squat, faire de petits mouvements de pulsation sans remonter complètement',
        technique: [
          'Rester dans le tiers bas du mouvement pendant toute la série',
          'Petites amplitudes rapides et contrôlées',
          'Ne remonter en position debout qu\'à la fin de la série complète',
        ],
        runnerTip: 'Maintient une tension constante sur le quadriceps sans repos — développe la tolérance à la fatigue musculaire locale.',
        progression: 'Allonger la série à 30 pulses ou enchaîner deux séries sans pause.',
      },
    ],
  },

  /* ── 26. Bas du Corps Complet ──────────────────────────────────────── */
  {
    id: 'bas_corps_complet', name: 'Bas du Corps Complet', emoji: '🦵', duration: '35–45 min',
    subtitle: 'Séance complète · quadriceps · fessiers · ischio-jambiers',
    color: '#10B981',
    exercises: [
      {
        name: 'Goblet Squat + Calf Raise', emoji: '🏋️', type: 'Polyarticulaire',
        muscles: ['Quadriceps', 'Fessiers', 'Mollets'],
        sets: '3', reps: '12',
        shortDesc: 'Squat goblet classique, puis monter sur la pointe des pieds en position haute',
        technique: [
          'Descendre en squat complet, poids contre la poitrine',
          'En remontant, continuer le mouvement en montant sur la pointe des pieds',
          'Redescendre les talons puis enchaîner la répétition suivante',
        ],
        runnerTip: 'Combine deux mouvements clés de la propulsion en course en un seul exercice efficace en temps.',
        progression: 'Augmenter le poids du goblet ou ralentir la phase de montée sur pointe.',
      },
      {
        name: 'Soulevé de terre + Rowing', emoji: '🔱', type: 'Polyarticulaire',
        muscles: ['Ischio-jambiers', 'Grand fessier', 'Dos'],
        sets: '3', reps: '10',
        shortDesc: 'Soulevé de terre roumain, puis tirer les haltères vers la poitrine en position basse',
        technique: [
          'Descendre en hip hinge jusqu\'à sentir l\'étirement des ischio-jambiers',
          'En position basse, tirer les haltères vers les côtes',
          'Reposer puis remonter en position debout',
        ],
        runnerTip: 'Associe chaîne postérieure et dos dans un mouvement fonctionnel complet, économe en temps d\'entraînement.',
        progression: 'Augmenter la charge des haltères progressivement.',
      },
      {
        name: 'Matrice de fentes multidirectionnelles', emoji: '🧭', type: 'Concentrique',
        muscles: ['Quadriceps', 'Fessiers', 'Adducteurs'],
        sets: '3', reps: '1 tour complet / côté',
        shortDesc: 'Enchaîner fente avant, latérale et arrière sur la même jambe sans reposer l\'autre',
        technique: [
          'Revenir au centre entre chaque direction sans poser l\'autre pied',
          'Genou toujours dans l\'axe du pied quelle que soit la direction',
          'Terminer les 3 directions avant de changer de jambe',
        ],
        runnerTip: 'Prépare les jambes à absorber des forces dans tous les plans, utile en trail sur terrain irrégulier.',
        progression: 'Ajouter des haltères légers ou augmenter l\'amplitude de chaque fente.',
      },
      {
        name: 'Step-up chargé', emoji: '🪜', type: 'Concentrique',
        muscles: ['Quadriceps', 'Fessiers', 'Ischio-jambiers'],
        sets: '3', reps: '10 / côté',
        shortDesc: 'Step-up sur une boîte haute avec haltères, sans élan de la jambe arrière',
        technique: [
          'Toute la force vient de la jambe posée sur la boîte',
          'Monter en poussant le talon, pas les orteils',
          'Descendre avec contrôle sans se laisser tomber',
        ],
        runnerTip: 'Reproduit fidèlement le pattern de montée de côte en charge, un transfert direct pour le trail et les dénivelés.',
        progression: 'Augmenter la hauteur de la boîte ou la charge portée.',
      },
      {
        name: 'Wall Ball', emoji: '⚽', type: 'Polyarticulaire',
        muscles: ['Quadriceps', 'Fessiers', 'Épaules'],
        sets: '3', reps: '15',
        shortDesc: 'Squat avec un ballon lesté, le lancer contre un mur puis le rattraper',
        technique: [
          'Descendre en squat complet, ballon tenu devant la poitrine',
          'Enchaîner l\'extension des jambes avec la poussée du ballon vers le haut',
          'Rattraper le ballon en amortissant directement dans le squat suivant',
        ],
        runnerTip: 'Combine force des jambes et travail cardio-musculaire en un mouvement dynamique et fonctionnel complet.',
        progression: 'Augmenter le poids du ballon ou la hauteur de la cible.',
      },
    ],
  },

  /* ── 27. Épaules & Stabilité ───────────────────────────────────────── */
  {
    id: 'epaules_stabilite', name: 'Épaules & Stabilité', emoji: '🎯', duration: '25–35 min',
    subtitle: 'Coiffe des rotateurs · posture · stabilité scapulaire',
    color: '#0EA5E9',
    exercises: [
      {
        name: 'Y-T-W Raises', emoji: '🤸', type: 'Concentrique',
        muscles: ['Deltoïdes postérieurs', 'Trapèzes', 'Rhomboïdes'],
        sets: '3', reps: '10 chaque lettre',
        shortDesc: 'Allongé sur le ventre, lever les bras en formant successivement un Y, un T et un W',
        technique: [
          'Lever les bras légèrement du sol à chaque position, pouces vers le ciel',
          'Contraction maximale des omoplates en position haute',
          'Mouvement lent et contrôlé, pas d\'élan',
        ],
        runnerTip: 'Renforce l\'ensemble des muscles stabilisateurs de l\'omoplate — une posture d\'épaule solide améliore l\'efficacité du balancement des bras.',
        progression: 'Ajouter de très légers haltères (0,5–1 kg) une fois le mouvement maîtrisé.',
      },
      {
        name: 'Landmine Press', emoji: '🚀', type: 'Polyarticulaire',
        muscles: ['Épaules', 'Triceps', 'Core'],
        sets: '3', reps: '10 / côté',
        shortDesc: 'Barre coincée dans un coin, pousser l\'extrémité libre vers le haut en diagonale',
        technique: [
          'Position légèrement décalée, une main pousse la barre en diagonale',
          'Core engagé pour stabiliser le tronc pendant la poussée',
          'Redescendre avec contrôle jusqu\'à l\'épaule',
        ],
        runnerTip: 'Trajectoire naturelle qui ménage l\'articulation de l\'épaule tout en développant la force de poussée verticale.',
        progression: 'Augmenter la charge ou faire l\'exercice en position debout sur un pied.',
      },
      {
        name: 'Scapular Wall Slide', emoji: '🧱', type: 'Mobilité',
        muscles: ['Trapèzes', 'Dentelé antérieur', 'Deltoïdes'],
        sets: '3', reps: '12',
        shortDesc: 'Dos au mur, bras en position de \'chandelier\', les faire glisser vers le haut en gardant le contact',
        technique: [
          'Bas du dos, tête et coudes en contact avec le mur tout le mouvement',
          'Glisser les bras vers le haut sans décoller les coudes du mur',
          'Redescendre lentement en gardant le contact permanent',
        ],
        runnerTip: 'Corrige la position d\'épaules enroulées vers l\'avant, fréquente chez les coureurs à haut volume assis le reste de la journée.',
        progression: 'Ajouter une légère résistance élastique entre les mains.',
      },
      {
        name: 'Turkish Get-up partiel', emoji: '🏋️', type: 'Neuromusculaire',
        muscles: ['Épaules', 'Core', 'Stabilisateurs'],
        sets: '3', reps: '5 / côté',
        shortDesc: 'Sur le dos, kettlebell tendu au-dessus d\'une épaule, se redresser jusqu\'en position assise',
        technique: [
          'Bras tendu vers le plafond en permanence, regard sur le poids',
          'Se redresser en s\'appuyant sur le coude puis la main opposée',
          'Revenir en contrôlant la descente jusqu\'au sol',
        ],
        runnerTip: 'Développe la stabilité de l\'épaule sous charge dans un mouvement multi-articulaire complexe et exigeant en coordination.',
        progression: 'Compléter le mouvement jusqu\'en position debout complète (Turkish Get-up intégral).',
      },
      {
        name: 'Arm Bar', emoji: '📏', type: 'Isométrique',
        muscles: ['Épaules', 'Core', 'Coiffe des rotateurs'],
        sets: '3', reps: '30 sec / côté',
        shortDesc: 'Sur le dos, léger poids tenu bras tendu vers le plafond, faire rouler le corps sur le côté',
        technique: [
          'Bras toujours parfaitement vertical, ne jamais le laisser dévier',
          'Rouler lentement le buste et les hanches vers le côté opposé',
          'Maintenir la position stable avant de revenir au centre',
        ],
        runnerTip: 'Renforce le contrôle fin de l\'épaule en position instable — utile pour prévenir les tensions cervicales liées à un mauvais alignement postural.',
        progression: 'Augmenter légèrement le poids tenu ou ralentir le tempo du roulé.',
      },
    ],
  },

  /* ── 28. Dos & Posture ─────────────────────────────────────────────── */
  {
    id: 'dos_posture', name: 'Dos & Posture', emoji: '🧍', duration: '30–40 min',
    subtitle: 'Grand dorsal · érecteurs · alignement vertical',
    color: '#6366F1',
    exercises: [
      {
        name: 'Tirage assisté / Pull-up', emoji: '🧗', type: 'Polyarticulaire',
        muscles: ['Grand dorsal', 'Biceps', 'Trapèzes'],
        sets: '3', reps: '6–10',
        shortDesc: 'Traction à la barre, assistée par élastique si nécessaire, jusqu\'au menton au-dessus de la barre',
        technique: [
          'Départ en suspension complète, omoplates engagées avant de tirer',
          'Tirer jusqu\'à ce que le menton dépasse la barre',
          'Descente contrôlée jusqu\'à l\'extension complète des bras',
        ],
        runnerTip: 'Développe la force du dos qui contre-équilibre le buste et maintient la posture droite en fin de longue distance.',
        progression: 'Réduire l\'assistance de l\'élastique progressivement jusqu\'à la traction complète.',
      },
      {
        name: 'Rowing haltère unilatéral', emoji: '🏋️', type: 'Concentrique',
        muscles: ['Grand dorsal', 'Rhomboïdes', 'Biceps'],
        sets: '3', reps: '12 / côté',
        shortDesc: 'Un genou et une main sur un banc, tirer un haltère vers la hanche',
        technique: [
          'Dos parfaitement plat et parallèle au sol',
          'Tirer le coude vers le plafond en serrant l\'omoplate',
          'Descendre l\'haltère avec contrôle jusqu\'à l\'extension complète',
        ],
        runnerTip: 'Le rowing unilatéral corrige les asymétries de force du dos et renforce la posture droite nécessaire en fin de course.',
        progression: 'Augmenter la charge de l\'haltère progressivement.',
      },
      {
        name: 'Superman', emoji: '🦸', type: 'Isométrique',
        muscles: ['Érecteurs', 'Fessiers', 'Épaules'],
        sets: '3', reps: '10 × maintien 3 sec',
        shortDesc: 'À plat ventre, lever bras et jambes simultanément et maintenir',
        technique: [
          'Lever en contractant d\'abord les fessiers puis les dorsaux',
          'Regard vers le sol, cou en position neutre',
          'Maintenir 3 sec en contraction maximale avant de redescendre',
        ],
        runnerTip: 'Renforce toute la chaîne postérieure du dos, essentielle pour maintenir une posture haute et efficace sur la durée.',
        progression: 'Alterner bras et jambe opposés pour plus d\'instabilité et de coordination.',
      },
      {
        name: 'Reverse Fly élastique', emoji: '🦅', type: 'Concentrique',
        muscles: ['Deltoïdes postérieurs', 'Rhomboïdes', 'Trapèzes'],
        sets: '3', reps: '15',
        shortDesc: 'Élastique tenu à deux mains, écarter les bras en arrière en serrant les omoplates',
        technique: [
          'Buste légèrement penché en avant, dos droit',
          'Écarter les bras en gardant une légère flexion du coude',
          'Contraction maximale des omoplates en fin de mouvement',
        ],
        runnerTip: 'Corrige le déséquilibre entre pectoraux (souvent forts) et deltoïdes postérieurs (souvent faibles) chez les coureurs.',
        progression: 'Augmenter la résistance de l\'élastique ou ralentir le tempo.',
      },
      {
        name: 'Band Pull-Apart', emoji: '🎗️', type: 'Concentrique',
        muscles: ['Deltoïdes postérieurs', 'Rhomboïdes'],
        sets: '3', reps: '20',
        shortDesc: 'Élastique tenu bras tendus devant soi, l\'écarter jusqu\'à toucher la poitrine',
        technique: [
          'Bras tendus à hauteur d\'épaule pendant tout le mouvement',
          'Écarter en serrant les omoplates, pas seulement en écartant les bras',
          'Retour contrôlé sans relâcher brutalement la tension',
        ],
        runnerTip: 'Exercice d\'activation simple et rapide, idéal en échauffement pour réveiller les muscles du haut du dos avant une séance.',
        progression: 'Augmenter la résistance de l\'élastique ou le nombre de répétitions.',
      },
    ],
  },

  /* ── 29. Bras & Avant-bras ─────────────────────────────────────────── */
  {
    id: 'bras_avantbras', name: 'Bras & Avant-bras', emoji: '💪', duration: '25–30 min',
    subtitle: 'Biceps · triceps · grip · endurance de préhension',
    color: '#E8237A',
    exercises: [
      {
        name: 'Curl marteau', emoji: '🔨', type: 'Concentrique',
        muscles: ['Biceps', 'Brachial', 'Avant-bras'],
        sets: '3', reps: '12 / côté',
        shortDesc: 'Haltères en prise neutre (paumes face à face), fléchir le coude',
        technique: [
          'Coude fixe contre le flanc pendant tout le mouvement',
          'Prise neutre maintenue du début à la fin',
          'Descente lente et contrôlée sur 3 secondes',
        ],
        runnerTip: 'Renforce le brachial et l\'avant-bras, utiles pour maintenir une flexion de coude stable et économique en course.',
        progression: 'Augmenter le poids ou réaliser l\'exercice assis pour éliminer tout élan.',
      },
      {
        name: 'Extension triceps au-dessus de la tête', emoji: '💪', type: 'Concentrique',
        muscles: ['Triceps'],
        sets: '3', reps: '12',
        shortDesc: 'Haltère tenu à deux mains derrière la tête, étendre les bras vers le plafond',
        technique: [
          'Coudes proches de la tête et fixes tout le mouvement',
          'Descendre jusqu\'à sentir l\'étirement complet du triceps',
          'Remonter en extension complète sans verrouiller brutalement',
        ],
        runnerTip: 'Des triceps forts stabilisent l\'action du bras lors du balancement rapide en fin de sprint ou de côte.',
        progression: 'Augmenter le poids de l\'haltère progressivement.',
      },
      {
        name: 'Dead Hang', emoji: '🪢', type: 'Isométrique',
        muscles: ['Avant-bras', 'Grand dorsal', 'Épaules'],
        sets: '3', reps: '30–45 sec',
        shortDesc: 'Suspendu à une barre, bras tendus, maintenir la position sans bouger',
        technique: [
          'Épaules légèrement engagées, pas totalement relâchées',
          'Respiration régulière malgré la fatigue de l\'avant-bras',
          'Descendre avec contrôle en fin de série, pas de lâcher brutal',
        ],
        runnerTip: 'Développe l\'endurance de préhension et décompresse la colonne — un excellent complément après les longues sorties.',
        progression: 'Allonger le temps de maintien progressivement de 5 sec par semaine.',
      },
      {
        name: 'Wrist Curl', emoji: '🖐️', type: 'Concentrique',
        muscles: ['Avant-bras', 'Fléchisseurs du poignet'],
        sets: '3', reps: '15',
        shortDesc: 'Avant-bras posé sur une cuisse, fléchir et tendre le poignet avec un haltère léger',
        technique: [
          'Avant-bras stable, seul le poignet bouge',
          'Amplitude complète, flexion puis extension du poignet',
          'Mouvement lent, pas de rebond',
        ],
        runnerTip: 'Un avant-bras résistant limite la fatigue de préhension lors des longues sorties avec bâtons en trail.',
        progression: 'Augmenter le poids ou le nombre de répétitions.',
      },
      {
        name: 'Pompes diamant', emoji: '🔷', type: 'Polyarticulaire',
        muscles: ['Triceps', 'Pectoraux', 'Épaules'],
        sets: '3', reps: '10–15',
        shortDesc: 'Pompes avec les mains rapprochées formant un losange sous la poitrine',
        technique: [
          'Mains rapprochées, pouces et index qui se touchent',
          'Coudes proches du corps pendant toute la descente',
          'Corps rigide de la tête aux talons',
        ],
        runnerTip: 'Sollicite intensément les triceps en chaîne fermée — un renforcement complet du bras sans matériel.',
        progression: 'Pieds surélevés pour augmenter la difficulté.',
      },
    ],
  },

  /* ── 30. Haut du Corps Poids du Corps ──────────────────────────────── */
  {
    id: 'haut_corps_poids_corps', name: 'Haut du Corps Poids du Corps', emoji: '🤸', duration: '30–40 min',
    subtitle: 'Sans matériel · force fonctionnelle',
    color: '#F59E0B',
    exercises: [
      {
        name: 'Pompes archer', emoji: '🏹', type: 'Polyarticulaire',
        muscles: ['Pectoraux', 'Triceps', 'Épaules'],
        sets: '3', reps: '8 / côté',
        shortDesc: 'Pompes en décalant le poids vers une main, l\'autre bras tendu sur le côté',
        technique: [
          'Bras tendu sur le côté reste quasiment droit pendant la descente',
          'Le poids du corps se déplace vers le bras qui travaille',
          'Alterner les côtés à chaque répétition',
        ],
        runnerTip: 'Version unilatérale des pompes qui développe une force asymétrique utile pour corriger les déséquilibres du haut du corps.',
        progression: 'Descendre davantage vers le bras tendu pour augmenter la charge.',
      },
      {
        name: 'Dips sur banc', emoji: '💺', type: 'Polyarticulaire',
        muscles: ['Triceps', 'Pectoraux', 'Épaules'],
        sets: '3', reps: '12–15',
        shortDesc: 'Mains sur un banc derrière soi, descendre le bassin puis remonter en poussant sur les bras',
        technique: [
          'Coudes qui se plient vers l\'arrière, pas vers l\'extérieur',
          'Descendre jusqu\'à un angle de coude de 90°',
          'Remonter en poussant fort sans verrouiller brutalement',
        ],
        runnerTip: 'Renforce les triceps et les épaules en chaîne fermée, un bon complément aux pompes pour un haut du corps équilibré.',
        progression: 'Ajouter un poids sur les cuisses ou surélever les pieds sur un second banc.',
      },
      {
        name: 'Pike Push-up', emoji: '🔺', type: 'Polyarticulaire',
        muscles: ['Épaules', 'Triceps'],
        sets: '3', reps: '10',
        shortDesc: 'Fesses hautes en forme de V inversé, descendre la tête vers le sol comme une pompe verticale',
        technique: [
          'Hanches hautes, jambes quasi tendues, poids sur les mains',
          'Descendre la tête entre les mains en fléchissant les coudes',
          'Remonter en poussant fort sur les épaules',
        ],
        runnerTip: 'Prépare les épaules à un travail vertical de poussée, complémentaire aux mouvements horizontaux classiques.',
        progression: 'Surélever les pieds pour augmenter l\'angle et la difficulté.',
      },
      {
        name: 'Rowing inversé (Inverted Row)', emoji: '🎽', type: 'Polyarticulaire',
        muscles: ['Grand dorsal', 'Biceps', 'Core'],
        sets: '3', reps: '12',
        shortDesc: 'Sous une barre basse ou une table solide, tirer le corps vers le haut en gardant le corps rigide',
        technique: [
          'Corps rigide de la tête aux talons, comme une planche inclinée',
          'Tirer la poitrine vers la barre en serrant les omoplates',
          'Descendre avec contrôle jusqu\'à l\'extension complète des bras',
        ],
        runnerTip: 'Équivalent du rowing horizontal au poids du corps — développe le dos sans matériel de musculation.',
        progression: 'Abaisser la barre pour augmenter l\'inclinaison du corps et la difficulté.',
      },
      {
        name: 'Handstand Hold contre le mur', emoji: '🤾', type: 'Isométrique',
        muscles: ['Épaules', 'Triceps', 'Core'],
        sets: '3', reps: '20–30 sec',
        shortDesc: 'Appui tendu renversé contre un mur, maintenir la position',
        technique: [
          'Monter progressivement en marchant les pieds sur le mur',
          'Corps aligné, regard vers les mains, core gainé',
          'Descendre avec contrôle en fin de série',
        ],
        runnerTip: 'Développe une force et une endurance d\'épaule exceptionnelles, utile pour maintenir la posture sous fatigue extrême.',
        progression: 'Allonger le temps de maintien progressivement.',
      },
    ],
  },

  /* ── 31. Haut du Corps Élastique ───────────────────────────────────── */
  {
    id: 'haut_corps_elastique', name: 'Haut du Corps Élastique', emoji: '🎗️', duration: '25–30 min',
    subtitle: 'Léger · portable · échauffement ou complément',
    color: '#6B7280',
    exercises: [
      {
        name: 'Tirage élastique vertical', emoji: '🎗️', type: 'Concentrique',
        muscles: ['Grand dorsal', 'Biceps'],
        sets: '3', reps: '15',
        shortDesc: 'Élastique fixé en hauteur, tirer vers le bas comme un tirage poulie classique',
        technique: [
          'Buste droit, légère cambrure naturelle du dos',
          'Tirer en amenant les coudes vers les hanches',
          'Contrôler la remontée sans relâcher brutalement',
        ],
        runnerTip: 'Version portable du tirage vertical — permet de travailler le dos n\'importe où, y compris en voyage ou en stage.',
        progression: 'Augmenter la résistance de l\'élastique ou ralentir le tempo.',
      },
      {
        name: 'Rotation externe élastique', emoji: '🔄', type: 'Concentrique',
        muscles: ['Coiffe des rotateurs', 'Deltoïdes postérieurs'],
        sets: '3', reps: '15 / côté',
        shortDesc: 'Coude au corps à 90°, tourner l\'avant-bras vers l\'extérieur contre l\'élastique',
        technique: [
          'Coude fixe contre les côtes pendant tout le mouvement',
          'Rotation contrôlée, pas d\'élan du buste pour compenser',
          'Retour lent sans relâcher la tension',
        ],
        runnerTip: 'Renforce la coiffe des rotateurs souvent négligée — protège l\'épaule lors du balancement répété des bras.',
        progression: 'Augmenter la résistance de l\'élastique.',
      },
      {
        name: 'Développé élastique debout', emoji: '🚀', type: 'Concentrique',
        muscles: ['Épaules', 'Triceps'],
        sets: '3', reps: '15',
        shortDesc: 'Élastique sous les pieds, pousser les poignées vers le haut au-dessus de la tête',
        technique: [
          'Core engagé pour éviter de cambrer le dos en poussant',
          'Extension complète des bras au-dessus de la tête',
          'Descente contrôlée jusqu\'aux épaules',
        ],
        runnerTip: 'Renforce les épaules en poussée verticale, complémentaire à l\'action horizontale du balancement de bras en course.',
        progression: 'Augmenter la résistance de l\'élastique ou faire l\'exercice en fente.',
      },
      {
        name: 'Extension triceps élastique', emoji: '💪', type: 'Concentrique',
        muscles: ['Triceps'],
        sets: '3', reps: '15',
        shortDesc: 'Élastique fixé en hauteur derrière soi, étendre le bras vers le bas',
        technique: [
          'Coude fixe près de la tête pendant tout le mouvement',
          'Extension complète du bras vers le bas',
          'Retour contrôlé sans relâcher la tension',
        ],
        runnerTip: 'Exercice léger et portable pour maintenir un travail de triceps régulier même en période de charge de course élevée.',
        progression: 'Augmenter la résistance de l\'élastique.',
      },
      {
        name: 'Élévation frontale élastique', emoji: '⬆️', type: 'Concentrique',
        muscles: ['Deltoïdes antérieurs'],
        sets: '3', reps: '15',
        shortDesc: 'Élastique sous les pieds, lever les bras tendus devant soi jusqu\'à l\'horizontale',
        technique: [
          'Légère flexion des coudes maintenue tout le mouvement',
          'Monter jusqu\'à l\'horizontale sans monter plus haut',
          'Descente contrôlée sur 2–3 secondes',
        ],
        runnerTip: 'Complète le travail des deltoïdes pour un développement équilibré de l\'épaule sur les trois faces.',
        progression: 'Augmenter la résistance de l\'élastique ou ralentir le tempo.',
      },
    ],
  },

  /* ── 32. Pectoraux & Triceps ───────────────────────────────────────── */
  {
    id: 'pectoraux_triceps', name: 'Pectoraux & Triceps', emoji: '🔺', duration: '30–40 min',
    subtitle: 'Force du haut du corps · stabilité du buste',
    color: '#8B2FC9',
    exercises: [
      {
        name: 'Développé couché haltères', emoji: '🏋️', type: 'Polyarticulaire',
        muscles: ['Pectoraux', 'Triceps', 'Épaules'],
        sets: '4', reps: '10',
        shortDesc: 'Allongé sur un banc, pousser les haltères vers le plafond depuis la poitrine',
        technique: [
          'Omoplates serrées et fixées sur le banc pendant tout le mouvement',
          'Descendre jusqu\'à sentir l\'étirement des pectoraux',
          'Pousser en extension complète sans verrouiller brutalement les coudes',
        ],
        runnerTip: 'Renforce le haut du corps pour une meilleure posture et un balancement de bras plus stable sur la durée.',
        progression: 'Augmenter le poids des haltères progressivement.',
      },
      {
        name: 'Dips lestés', emoji: '🔻', type: 'Polyarticulaire',
        muscles: ['Triceps', 'Pectoraux', 'Épaules'],
        sets: '3', reps: '10',
        shortDesc: 'Dips aux barres parallèles avec une charge additionnelle à la ceinture',
        technique: [
          'Buste légèrement incliné en avant pour cibler les pectoraux',
          'Descendre jusqu\'à un angle de coude de 90°',
          'Remonter en poussant fort sans à-coup',
        ],
        runnerTip: 'Développe une force de poussée puissante du haut du corps, utile pour maintenir la posture en fin d\'effort intense.',
        progression: 'Augmenter progressivement la charge additionnelle.',
      },
      {
        name: 'Écarté couché', emoji: '🦅', type: 'Concentrique',
        muscles: ['Pectoraux'],
        sets: '3', reps: '12',
        shortDesc: 'Allongé, haltères tenus bras légèrement fléchis, les écarter puis les ramener au-dessus de la poitrine',
        technique: [
          'Légère flexion des coudes maintenue tout le mouvement',
          'Descendre jusqu\'à sentir l\'étirement maximal des pectoraux',
          'Remonter en un arc de cercle, pas en ligne droite',
        ],
        runnerTip: 'Isole les pectoraux en étirement, complémentaire aux mouvements de poussée pour un développement complet.',
        progression: 'Augmenter le poids des haltères progressivement.',
      },
      {
        name: 'Pompes déclinées', emoji: '🔽', type: 'Polyarticulaire',
        muscles: ['Pectoraux supérieurs', 'Épaules', 'Triceps'],
        sets: '3', reps: '12–15',
        shortDesc: 'Pieds surélevés sur une chaise, effectuer des pompes classiques',
        technique: [
          'Corps rigide de la tête aux talons malgré l\'inclinaison',
          'Descendre jusqu\'à 2 cm du sol',
          'Coudes à 45° du corps',
        ],
        runnerTip: 'Sollicite davantage le haut des pectoraux et les épaules que la pompe classique.',
        progression: 'Augmenter la hauteur de surélévation des pieds.',
      },
      {
        name: 'Extension triceps à la poulie/câble', emoji: '🔗', type: 'Concentrique',
        muscles: ['Triceps'],
        sets: '3', reps: '15',
        shortDesc: 'Face à une poulie haute, pousser la corde ou la barre vers le bas',
        technique: [
          'Coudes fixes contre le corps pendant tout le mouvement',
          'Extension complète en bas avec contraction maximale',
          'Retour contrôlé jusqu\'à 90° de flexion',
        ],
        runnerTip: 'Isole les triceps en fin de séance pour un travail complémentaire après les mouvements polyarticulaires.',
        progression: 'Augmenter la charge progressivement.',
      },
    ],
  },

  /* ── 33. Pliométrie Avancée ────────────────────────────────────────── */
  {
    id: 'pliometrie_avancee', name: 'Pliométrie Avancée', emoji: '💥', duration: '30–40 min',
    subtitle: 'Puissance réactive · raideur tendineuse',
    color: '#F59E0B',
    exercises: [
      {
        name: 'Depth Jump', emoji: '⬇️', type: 'Plyométrique',
        muscles: ['Quadriceps', 'Mollets', 'Fessiers'],
        sets: '4', reps: '5',
        shortDesc: 'Descendre d\'une caisse basse et rebondir immédiatement le plus haut possible',
        technique: [
          'Descendre simplement de la caisse, ne pas sauter au départ',
          'Contact au sol le plus court possible avant de rebondir',
          'Réception souple après le rebond, genoux fléchis',
        ],
        runnerTip: 'Entraîne la raideur tendineuse et le réflexe myotatique — la capacité du tendon à restituer l\'énergie stockée à l\'impact, comme un ressort.',
        progression: 'Augmenter très progressivement la hauteur de la caisse une fois la technique maîtrisée.',
      },
      {
        name: 'Single Leg Box Jump', emoji: '📦', type: 'Plyométrique',
        muscles: ['Quadriceps', 'Fessiers', 'Mollets'],
        sets: '3', reps: '5 / côté',
        shortDesc: 'Saut sur une caisse depuis un appui unipodal, réception à deux pieds',
        technique: [
          'Impulsion complète depuis une seule jambe, bras actifs',
          'Réception stable en haut de la caisse, genoux fléchis',
          'Redescendre marchant, ne pas sauter en arrière',
        ],
        runnerTip: 'Développe la puissance unilatérale — chaque appui de course étant unipodal, ce transfert est direct.',
        progression: 'Augmenter la hauteur de la caisse progressivement.',
      },
      {
        name: 'Broad Jump to Vertical Jump', emoji: '🦘', type: 'Plyométrique',
        muscles: ['Quadriceps', 'Fessiers', 'Mollets'],
        sets: '4', reps: '5',
        shortDesc: 'Enchaîner un saut en longueur puis, à la réception, un saut vertical maximal',
        technique: [
          'Réception du saut en longueur la plus courte possible au sol',
          'Transition immédiate vers l\'impulsion verticale, sans pause',
          'Bras actifs pour maximiser la hauteur du second saut',
        ],
        runnerTip: 'Combine deux directions de puissance en un seul enchaînement — développe la capacité à changer de plan de force rapidement.',
        progression: 'Réduire le temps de transition entre les deux sauts.',
      },
      {
        name: 'Lateral Bound', emoji: '↔️', type: 'Plyométrique',
        muscles: ['Fessiers', 'Adducteurs', 'Mollets'],
        sets: '3', reps: '6 / côté',
        shortDesc: 'Bond latéral d\'une jambe à l\'autre, stabiliser à chaque réception',
        technique: [
          'Impulsion puissante sur le côté, pas seulement vers l\'avant',
          'Réception stable sur la jambe opposée, genou fléchi',
          'Stabiliser 1 sec avant d\'enchaîner le bond suivant',
        ],
        runnerTip: 'Développe la force et la stabilité dans le plan latéral, essentiel pour les changements de direction en trail ou cross.',
        progression: 'Augmenter la distance du bond ou enchaîner plusieurs bonds sans pause.',
      },
      {
        name: 'Tuck Jump', emoji: '🤸', type: 'Plyométrique',
        muscles: ['Quadriceps', 'Fléchisseurs de hanche', 'Mollets'],
        sets: '3', reps: '8',
        shortDesc: 'Saut vertical en ramenant les genoux vers la poitrine en l\'air',
        technique: [
          'Impulsion complète des deux jambes, bras actifs vers le haut',
          'Ramener les genoux le plus haut possible en l\'air',
          'Réception souple, genoux fléchis, prêt à repartir',
        ],
        runnerTip: 'Développe la puissance verticale et la vitesse de recrutement des fléchisseurs de hanche, utile pour la fréquence de foulée.',
        progression: 'Enchaîner les sauts sans pause entre chaque répétition.',
      },
    ],
  },

  /* ── 34. Vitesse & Réaction ────────────────────────────────────────── */
  {
    id: 'vitesse_reaction', name: 'Vitesse & Réaction', emoji: '⚡', duration: '25–35 min',
    subtitle: 'Départs · changements de direction · réactivité',
    color: '#10B981',
    exercises: [
      {
        name: 'Départs arrêtés', emoji: '🏁', type: 'Neuromusculaire',
        muscles: ['Quadriceps', 'Fessiers', 'Mollets'],
        sets: '5', reps: '15 m',
        shortDesc: 'Départ immobile, accélération maximale sur 15 mètres',
        technique: [
          'Départ légèrement penché en avant, premier appui puissant',
          'Accélération progressive, buste qui se redresse au fil des appuis',
          'Récupération complète entre chaque répétition',
        ],
        runnerTip: 'Développe la capacité d\'accélération pure, utile pour les changements de rythme en course et les sprints finaux.',
        progression: 'Augmenter la distance à 20–25 mètres ou ajouter une résistance légère.',
      },
      {
        name: 'Réaction ballon (drop catch)', emoji: '🎾', type: 'Neuromusculaire',
        muscles: ['Réactivité', 'Coordination'],
        sets: '3', reps: '10',
        shortDesc: 'Un partenaire lâche une balle, la rattraper avant le second rebond',
        technique: [
          'Position prête, genoux légèrement fléchis, regard sur la balle',
          'Réagir dès le lâcher, pas d\'anticipation',
          'Rattraper avec les deux mains ou une seule selon la variante',
        ],
        runnerTip: 'Entraîne le temps de réaction neuromusculaire, utile pour ajuster rapidement la foulée sur terrain technique ou en compétition.',
        progression: 'Varier la hauteur et la direction du lâcher pour plus d\'imprévisibilité.',
      },
      {
        name: 'Échelle de rythme', emoji: '🪜', type: 'Neuromusculaire',
        muscles: ['Mollets', 'Coordination', 'Fréquence de foulée'],
        sets: '4', reps: '1 passage',
        shortDesc: 'Passages rapides et variés dans une échelle de rythme au sol',
        technique: [
          'Appuis courts et rapides, rester sur l\'avant du pied',
          'Bras actifs et synchronisés avec les jambes',
          'Précision des appuis avant la vitesse d\'exécution',
        ],
        runnerTip: 'Développe la coordination et la fréquence de foulée — un pilier de l\'économie de course à toutes les allures.',
        progression: 'Augmenter la vitesse d\'exécution une fois les patterns maîtrisés.',
      },
      {
        name: 'Changements de direction (5-10-5)', emoji: '🔀', type: 'Neuromusculaire',
        muscles: ['Quadriceps', 'Fessiers', 'Adducteurs'],
        sets: '4', reps: '1 passage',
        shortDesc: 'Sprint 5 m, changement de direction, 10 m dans l\'autre sens, puis 5 m retour',
        technique: [
          'Décélération contrôlée avant chaque changement de direction',
          'Appui bas et large au moment du pivot',
          'Réaccélération immédiate après le changement',
        ],
        runnerTip: 'Renforce la capacité à décélérer et réaccélérer, essentiel en trail sur terrain irrégulier ou en compétition sur route.',
        progression: 'Réduire le temps total réalisé au fil des séances.',
      },
      {
        name: 'Sprint résisté élastique', emoji: '🎗️', type: 'Neuromusculaire',
        muscles: ['Quadriceps', 'Fessiers', 'Mollets'],
        sets: '5', reps: '15 m',
        shortDesc: 'Élastique fixé à la taille et tenu par un partenaire, sprinter contre résistance',
        technique: [
          'Buste penché en avant, premiers appuis puissants',
          'Maintenir une technique de course propre malgré la résistance',
          'Récupération complète marchée entre chaque répétition',
        ],
        runnerTip: 'Développe la force spécifique d\'accélération sans excès de vitesse, réduisant le risque de blessure à l\'ischio-jambier.',
        progression: 'Augmenter légèrement la résistance de l\'élastique.',
      },
    ],
  },

  /* ── 35. Équilibre Dynamique ───────────────────────────────────────── */
  {
    id: 'equilibre_dynamique', name: 'Équilibre Dynamique', emoji: '🤹', duration: '20–30 min',
    subtitle: 'Stabilité fonctionnelle · terrain instable',
    color: '#EC4899',
    exercises: [
      {
        name: 'Squat sur Bosu', emoji: '🔵', type: 'Proprioception',
        muscles: ['Quadriceps', 'Fessiers', 'Stabilisateurs cheville'],
        sets: '3', reps: '12',
        shortDesc: 'Squat classique effectué en équilibre sur un demi-ballon Bosu',
        technique: [
          'Regard fixe droit devant pour aider l\'équilibre',
          'Descente contrôlée, genoux dans l\'axe des orteils',
          'Micro-ajustements permanents de la cheville pour rester stable',
        ],
        runnerTip: 'L\'instabilité du Bosu recrute en continu les petits stabilisateurs de cheville, essentiels sur terrain irrégulier en trail.',
        progression: 'Fermer les yeux ou ajouter un léger poids tenu devant soi.',
      },
      {
        name: 'Y-Balance Reach', emoji: '🦩', type: 'Proprioception',
        muscles: ['Cheville', 'Fessiers', 'Core'],
        sets: '3', reps: '8 / direction / côté',
        shortDesc: 'Sur un pied, toucher le sol le plus loin possible dans 3 directions différentes',
        technique: [
          'Jambe d\'appui légèrement fléchie, genou stable',
          'Toucher le sol du bout du pied libre sans transférer le poids',
          'Revenir au centre entre chaque direction avant de continuer',
        ],
        runnerTip: 'Test et exercice combinés — une bonne portée dans les 3 directions est corrélée à un risque de blessure réduit à la cheville.',
        progression: 'Augmenter la distance atteinte progressivement dans chaque direction.',
      },
      {
        name: 'Marche en ligne', emoji: '➰', type: 'Proprioception',
        muscles: ['Cheville', 'Core', 'Équilibre'],
        sets: '3', reps: '10 m',
        shortDesc: 'Marcher pied devant pied sur une ligne au sol, bras écartés pour l\'équilibre',
        technique: [
          'Talon du pied avant touche les orteils du pied arrière à chaque pas',
          'Regard fixe sur un point devant soi, pas sur les pieds',
          'Pas lents et contrôlés',
        ],
        runnerTip: 'Développe l\'équilibre dynamique en mouvement, une compétence différente et complémentaire de l\'équilibre statique.',
        progression: 'Fermer les yeux progressivement ou marcher en arrière.',
      },
      {
        name: 'Single Leg Hop and Stick', emoji: '🦘', type: 'Proprioception',
        muscles: ['Quadriceps', 'Fessiers', 'Stabilisateurs cheville'],
        sets: '3', reps: '8 / côté',
        shortDesc: 'Sauter en avant sur une jambe et stabiliser complètement la réception',
        technique: [
          'Impulsion modérée, pas maximale, priorité à la qualité de la réception',
          'Réception genou fléchi, stabiliser 2 sec sans vaciller',
          'Recommencer seulement une fois parfaitement stable',
        ],
        runnerTip: 'Entraîne le contrôle neuromusculaire du genou à la réception — la compétence clé pour prévenir l\'entorse de cheville.',
        progression: 'Augmenter la distance du saut ou fermer les yeux à la réception.',
      },
      {
        name: 'Lancer de ballon en équilibre unipodal', emoji: '🏀', type: 'Proprioception',
        muscles: ['Cheville', 'Core', 'Épaules'],
        sets: '3', reps: '10 lancers / pied',
        shortDesc: 'Sur un pied, lancer et rattraper un ballon contre un mur',
        technique: [
          'Genou de la jambe d\'appui légèrement fléchi en permanence',
          'Lancer et rattraper sans reposer le pied libre',
          'Varier la hauteur et la direction du lancer',
        ],
        runnerTip: 'Combine tâche motrice (lancer) et équilibre — proche des exigences réelles du trail où l\'attention est divisée entre terrain et effort.',
        progression: 'Augmenter la vitesse des lancers ou fermer un œil.',
      },
    ],
  },

  /* ── 36. Puissance Bondissante ─────────────────────────────────────── */
  {
    id: 'puissance_bondissante', name: 'Puissance Bondissante', emoji: '🦘', duration: '30–35 min',
    subtitle: 'Bondissements · foulée bondissante · côtes',
    color: '#F97316',
    exercises: [
      {
        name: 'Bounding en côte', emoji: '⛰️', type: 'Plyométrique',
        muscles: ['Fessiers', 'Ischio-jambiers', 'Mollets'],
        sets: '4', reps: '15–20 m',
        shortDesc: 'Grandes foulées bondissantes en montée sur pente douce',
        technique: [
          'Poussée puissante et complète à chaque appui, genoux hauts',
          'Bras actifs en opposition des jambes',
          'Redescendre en marchant pour une récupération complète',
        ],
        runnerTip: 'La pente réduit l\'impact tout en maximisant le travail de poussée — un bon compromis puissance/sécurité articulaire.',
        progression: 'Augmenter la pente ou la distance parcourue.',
      },
      {
        name: 'Triple bond (Hop-Skip-Jump réduit)', emoji: '🦘', type: 'Plyométrique',
        muscles: ['Quadriceps', 'Fessiers', 'Mollets'],
        sets: '4', reps: '3 bonds enchaînés',
        shortDesc: 'Enchaîner un bond sur une jambe, un skip, puis un saut à deux pieds',
        technique: [
          'Chaque phase enchaînée sans pause, transfert d\'énergie continu',
          'Bras actifs pour maximiser la distance de chaque phase',
          'Réception finale stable et contrôlée',
        ],
        runnerTip: 'Exercice d\'athlétisme classique qui développe la puissance de bond dans un enchaînement complexe et coordonné.',
        progression: 'Augmenter la distance totale parcourue sur les 3 bonds.',
      },
      {
        name: 'A-Skip explosif', emoji: '🏃', type: 'Neuromusculaire',
        muscles: ['Fléchisseurs de hanche', 'Mollets', 'Core'],
        sets: '4', reps: '20 m',
        shortDesc: 'Skipping avec genoux hauts et poussée explosive à chaque appui',
        technique: [
          'Genou monté à hauteur de hanche à chaque skip',
          'Appui bref et puissant sur l\'avant du pied',
          'Bras actifs et synchronisés avec les jambes',
        ],
        runnerTip: 'Drill technique classique pour améliorer la mécanique de genou haut et la puissance de chaque appui.',
        progression: 'Augmenter la vitesse d\'exécution en gardant la technique propre.',
      },
      {
        name: 'Saut de haie latéral', emoji: '🚧', type: 'Plyométrique',
        muscles: ['Mollets', 'Fessiers', 'Adducteurs'],
        sets: '3', reps: '10 / côté',
        shortDesc: 'Petits sauts latéraux par-dessus une haie basse ou un obstacle',
        technique: [
          'Sauts rapides et courts, contact au sol minimal',
          'Genoux légèrement fléchis à chaque réception',
          'Rester sur l\'avant du pied pendant toute la série',
        ],
        runnerTip: 'Développe la raideur des chevilles dans le plan latéral, utile pour la stabilité sur terrain technique.',
        progression: 'Augmenter la hauteur de l\'obstacle ou la vitesse des sauts.',
      },
      {
        name: 'Pogo Jumps', emoji: '🐇', type: 'Plyométrique',
        muscles: ['Mollets', 'Tendon Achille'],
        sets: '3', reps: '20',
        shortDesc: 'Petits rebonds rapides sur la pointe des pieds, genoux quasi tendus',
        technique: [
          'Genoux légèrement fléchis mais rigides, le rebond vient de la cheville',
          'Contact au sol le plus court possible',
          'Bras relâchés le long du corps ou légèrement actifs',
        ],
        runnerTip: 'Développe la raideur réactive de la cheville — un facteur clé de l\'économie de course à toutes les allures.',
        progression: 'Augmenter la fréquence des rebonds ou la durée de la série.',
      },
    ],
  },

  /* ── 37. Coordination & Agilité ────────────────────────────────────── */
  {
    id: 'coordination_agilite', name: 'Coordination & Agilité', emoji: '🌀', duration: '25–30 min',
    subtitle: 'Échelle de rythme · appuis · réactivité multidirectionnelle',
    color: '#6366F1',
    exercises: [
      {
        name: 'Échelle de rythme croisée', emoji: '🪜', type: 'Neuromusculaire',
        muscles: ['Coordination', 'Mollets', 'Fréquence de foulée'],
        sets: '4', reps: '1 passage',
        shortDesc: 'Passages dans l\'échelle avec des pas croisés devant et derrière',
        technique: [
          'Appuis précis dans chaque case, pas de précipitation',
          'Bras qui accompagnent la rotation du buste',
          'Regard devant, pas sur les pieds',
        ],
        runnerTip: 'Développe la coordination croisée qui améliore la fluidité de la foulée à haute cadence.',
        progression: 'Augmenter la vitesse d\'exécution une fois le pattern maîtrisé.',
      },
      {
        name: 'Ladder drills variés', emoji: '🔀', type: 'Neuromusculaire',
        muscles: ['Coordination', 'Mollets'],
        sets: '4', reps: '1 passage chaque pattern',
        shortDesc: 'Alterner plusieurs patterns d\'appuis différents dans l\'échelle de rythme',
        technique: [
          'Un nouveau pattern à chaque passage pour varier les stimuli',
          'Précision avant vitesse, surtout sur un nouveau pattern',
          'Récupération courte entre chaque passage',
        ],
        runnerTip: 'La variété des patterns entraîne le système nerveux à s\'adapter rapidement — utile face aux terrains changeants du trail.',
        progression: 'Ajouter des patterns plus complexes au fil des séances.',
      },
      {
        name: 'Cross-over step', emoji: '❌', type: 'Neuromusculaire',
        muscles: ['Adducteurs', 'Coordination', 'Fessiers'],
        sets: '3', reps: '10 m aller-retour',
        shortDesc: 'Se déplacer latéralement en croisant un pied devant puis derrière l\'autre',
        technique: [
          'Hanches basses, buste stable pendant tout le déplacement',
          'Alterner croisement devant et derrière à chaque pas',
          'Regard devant, pas sur les pieds',
        ],
        runnerTip: 'Développe la mobilité de hanche en rotation et la coordination latérale, utile pour les virages serrés en compétition.',
        progression: 'Augmenter la vitesse de déplacement.',
      },
      {
        name: 'Carioca', emoji: '🔄', type: 'Neuromusculaire',
        muscles: ['Adducteurs', 'Obliques', 'Coordination'],
        sets: '3', reps: '15 m aller-retour',
        shortDesc: 'Pas chassés latéraux avec rotation du bassin, jambe qui passe alternativement devant et derrière',
        technique: [
          'Rotation du buste dans le sens opposé au déplacement',
          'Rythme fluide et régulier, pas saccadé',
          'Rester bas sur les appuis pendant tout le déplacement',
        ],
        runnerTip: 'Classique de l\'échauffement athlétique — prépare les hanches à la rotation et améliore la coordination générale.',
        progression: 'Augmenter la vitesse d\'exécution.',
      },
      {
        name: 'Réaction plots (cone touch)', emoji: '🎯', type: 'Neuromusculaire',
        muscles: ['Coordination', 'Réactivité', 'Quadriceps'],
        sets: '4', reps: '30 sec',
        shortDesc: 'Plots disposés en étoile, toucher chacun le plus vite possible depuis le centre',
        technique: [
          'Retour au centre entre chaque plot touché',
          'Appuis courts et rapides, rester bas sur les jambes',
          'Varier l\'ordre des plots touchés pour rester imprévisible',
        ],
        runnerTip: 'Combine agilité et prise de décision rapide, une dimension complémentaire à la pure vitesse linéaire.',
        progression: 'Augmenter la durée de l\'effort ou le nombre de plots.',
      },
    ],
  },

  /* ── 38. Mobilité des Hanches ──────────────────────────────────────── */
  {
    id: 'mobilite_hanches', name: 'Mobilité des Hanches', emoji: '🦴', duration: '20–30 min',
    subtitle: 'Amplitude de hanche · fluidité de la foulée',
    color: '#6B7280',
    exercises: [
      {
        name: 'Hip CARs (rotations articulaires contrôlées)', emoji: '🔄', type: 'Mobilité',
        muscles: ['Articulation coxo-fémorale', 'Rotateurs de hanche'],
        sets: '2', reps: '5 / sens / côté',
        shortDesc: 'Debout, tracer un grand cercle avec le genou en explorant toute l\'amplitude de la hanche',
        technique: [
          'Bassin fixe, se tenir à un support pour l\'équilibre si besoin',
          'Amplitude maximale et contrôlée à chaque point du cercle',
          'Mouvement lent, sans à-coup ni élan',
        ],
        runnerTip: 'Explore et entretient toute l\'amplitude articulaire de la hanche — une hanche mobile permet une foulée plus ample et plus économique.',
        progression: 'Augmenter progressivement l\'amplitude du cercle au fil des semaines.',
      },
      {
        name: 'Fente avec rotation', emoji: '🚶', type: 'Mobilité',
        muscles: ['Fléchisseurs de hanche', 'Colonne thoracique', 'Adducteurs'],
        sets: '2', reps: '8 / côté',
        shortDesc: 'Fente basse puis rotation du buste vers la jambe avant, bras qui suit',
        technique: [
          'Fente profonde, hanche avant bien ouverte',
          'Rotation du buste depuis le tronc, pas juste les épaules',
          'Revenir au centre avant de changer de côté',
        ],
        runnerTip: 'Combine ouverture de hanche et mobilité thoracique en un seul mouvement fluide, idéal en échauffement dynamique.',
        progression: 'Ajouter une pause de 2 sec en fin de rotation.',
      },
      {
        name: 'Balancements de jambe (Leg Swings)', emoji: '🦵', type: 'Mobilité',
        muscles: ['Fléchisseurs de hanche', 'Ischio-jambiers', 'Adducteurs'],
        sets: '2', reps: '10 / sens / côté',
        shortDesc: 'En appui sur un support, balancer une jambe tendue d\'avant en arrière puis latéralement',
        technique: [
          'Amplitude qui augmente progressivement à chaque répétition',
          'Buste stable, le mouvement vient uniquement de la hanche',
          'Contrôler la fin de course, pas de à-coup brutal',
        ],
        runnerTip: 'Excellent échauffement dynamique avant course — augmente la température et l\'amplitude articulaire sans effet de relâchement musculaire.',
        progression: 'Augmenter progressivement l\'amplitude du balancement.',
      },
      {
        name: 'Grenouille (Frog Stretch)', emoji: '🐸', type: 'Étirement actif',
        muscles: ['Adducteurs', 'Fléchisseurs de hanche'],
        sets: '3', reps: '45–60 sec',
        shortDesc: 'À quatre pattes, genoux très écartés, reculer doucement le bassin vers les talons',
        technique: [
          'Genoux et chevilles alignés à 90°, pieds détendus',
          'Reculer le bassin progressivement sans forcer la douleur',
          'Respiration profonde pour approfondir l\'étirement au fil des respirations',
        ],
        runnerTip: 'Étirement profond des adducteurs, souvent raccourcis par la répétition du même plan de mouvement en course.',
        progression: 'Reculer le bassin un peu plus loin chaque semaine.',
      },
      {
        name: 'Étirement adducteur latéral', emoji: '↔️', type: 'Étirement actif',
        muscles: ['Adducteurs', 'Ischio-jambiers'],
        sets: '2', reps: '45 sec / côté',
        shortDesc: 'Grand écart latéral partiel, buste penché vers la jambe tendue',
        technique: [
          'Une jambe tendue sur le côté, l\'autre fléchie',
          'Pencher le buste vers la jambe tendue sans arrondir le dos',
          'Respirer profondément pour relâcher progressivement la tension',
        ],
        runnerTip: 'Complète le travail de mobilité de hanche par un étirement direct des adducteurs, utile après un travail de vitesse ou de côtes.',
        progression: 'Augmenter progressivement l\'amplitude de l\'écart.',
      },
    ],
  },

  /* ── 39. Mobilité Cheville Avancée ─────────────────────────────────── */
  {
    id: 'mobilite_cheville_avancee', name: 'Mobilité Cheville Avancée', emoji: '🦶', duration: '20–25 min',
    subtitle: 'Dorsiflexion · tendon d\'Achille · prévention',
    color: '#0EA5E9',
    exercises: [
      {
        name: 'Ankle CARs', emoji: '🔄', type: 'Mobilité',
        muscles: ['Cheville', 'Tendon Achille'],
        sets: '2', reps: '5 / sens / côté',
        shortDesc: 'Assis, jambe tendue, tracer de grands cercles avec le pied dans toute l\'amplitude',
        technique: [
          'Seule la cheville bouge, la jambe reste immobile',
          'Amplitude maximale explorée à chaque point du cercle',
          'Mouvement lent et contrôlé dans les deux sens',
        ],
        runnerTip: 'Entretient la mobilité complète de la cheville dans tous les plans, au-delà de la simple dorsiflexion.',
        progression: 'Augmenter progressivement l\'amplitude des cercles.',
      },
      {
        name: 'Étirement du mollet au mur', emoji: '🧱', type: 'Étirement actif',
        muscles: ['Gastrocnémien', 'Tendon Achille'],
        sets: '3', reps: '45 sec / côté',
        shortDesc: 'Face au mur, une jambe reculée tendue, talon au sol, pousser les hanches vers le mur',
        technique: [
          'Jambe arrière parfaitement tendue, talon jamais décollé',
          'Pousser le bassin vers le mur pour approfondir l\'étirement',
          'Respirer profondément pendant tout l\'étirement',
        ],
        runnerTip: 'Cible le gastrocnémien, le muscle superficiel du mollet le plus sollicité lors des accélérations et des côtes.',
        progression: 'Reculer davantage la jambe arrière au fil des semaines.',
      },
      {
        name: 'Étirement du soléaire assis', emoji: '🪑', type: 'Étirement actif',
        muscles: ['Soléaire', 'Tendon Achille'],
        sets: '3', reps: '45 sec / côté',
        shortDesc: 'Genou fléchi, talon au sol, pousser le genou vers l\'avant pour étirer le mollet profond',
        technique: [
          'Genou fléchi à environ 90°, talon ancré au sol en permanence',
          'Pousser le genou vers l\'avant jusqu\'à sentir l\'étirement profond du mollet',
          'Maintenir sans à-coup, respiration régulière',
        ],
        runnerTip: 'Le soléaire, actif genou fléchi, est essentiel en descente et en trail — souvent négligé au profit du seul gastrocnémien.',
        progression: 'Augmenter progressivement la flexion du genou.',
      },
      {
        name: 'Mobilisation cheville à la bande', emoji: '🎗️', type: 'Mobilité',
        muscles: ['Cheville', 'Tendon Achille'],
        sets: '3', reps: '10 flexions',
        shortDesc: 'Bande épaisse autour de la cheville tirée vers l\'arrière, fléchir le genou vers l\'avant',
        technique: [
          'Bande qui crée une légère traction postérieure de la cheville',
          'Fléchir le genou vers l\'avant en gardant le talon au sol',
          'Revenir avec contrôle sans relâcher brutalement',
        ],
        runnerTip: 'Technique de mobilisation articulaire utilisée en kinésithérapie pour restaurer le glissement normal de l\'articulation talo-crurale.',
        progression: 'Augmenter légèrement la tension de la bande.',
      },
      {
        name: 'Rocking Ankle Mobilization', emoji: '🌊', type: 'Mobilité',
        muscles: ['Cheville', 'Tendon Achille'],
        sets: '3', reps: '10 / côté',
        shortDesc: 'En fente, bercer le poids du corps d\'avant en arrière sur le pied avant fléchi',
        technique: [
          'Talon avant toujours ancré au sol pendant le mouvement',
          'Bercer doucement le poids vers l\'avant puis revenir',
          'Amplitude qui augmente progressivement à chaque répétition',
        ],
        runnerTip: 'Mobilise la cheville en charge, plus proche des conditions réelles de la course que les étirements statiques seuls.',
        progression: 'Augmenter l\'amplitude du bercement vers l\'avant.',
      },
    ],
  },

  /* ── 40. Étirements Chaîne Postérieure ─────────────────────────────── */
  {
    id: 'etirements_chaine_posterieure', name: 'Étirements Chaîne Postérieure', emoji: '🧵', duration: '20–30 min',
    subtitle: 'Ischio-jambiers · mollets · fessiers · souplesse',
    color: '#8B2FC9',
    exercises: [
      {
        name: 'Étirement ischio-jambier debout', emoji: '🦵', type: 'Étirement actif',
        muscles: ['Ischio-jambiers'],
        sets: '3', reps: '45 sec / côté',
        shortDesc: 'Un pied surélevé sur un support, jambe tendue, se pencher en avant depuis les hanches',
        technique: [
          'Dos droit, la flexion vient des hanches, pas du dos',
          'Jambe surélevée tendue, pointe de pied vers soi',
          'Descendre jusqu\'à sentir l\'étirement, sans forcer la douleur',
        ],
        runnerTip: 'Des ischio-jambiers souples réduisent la tension sur le bassin et le bas du dos pendant la phase d\'oscillation de la foulée.',
        progression: 'Augmenter progressivement la hauteur du support.',
      },
      {
        name: 'Étirement ischio-jambier assis', emoji: '🪑', type: 'Étirement actif',
        muscles: ['Ischio-jambiers', 'Mollets'],
        sets: '3', reps: '45 sec',
        shortDesc: 'Assis jambes tendues devant soi, se pencher vers l\'avant en gardant le dos droit',
        technique: [
          'Dos plat, la flexion vient du bassin, pas des épaules qui s\'affaissent',
          'Chercher à toucher les pieds sans arrondir excessivement le dos',
          'Respirer profondément pour approfondir progressivement',
        ],
        runnerTip: 'Version bilatérale simple à intégrer en routine quotidienne pour maintenir la souplesse de la chaîne postérieure.',
        progression: 'Ajouter une légère flexion dorsale des pieds pour inclure les mollets dans l\'étirement.',
      },
      {
        name: 'Chien tête en bas prolongé', emoji: '🐕', type: 'Étirement actif',
        muscles: ['Ischio-jambiers', 'Mollets', 'Épaules'],
        sets: '3', reps: '45–60 sec',
        shortDesc: 'Posture de yoga en V inversé, talons qui cherchent le sol',
        technique: [
          'Mains et pieds bien ancrés, hanches hautes vers le plafond',
          'Pédaler doucement les talons vers le sol en alternance',
          'Respiration profonde et régulière pendant tout le maintien',
        ],
        runnerTip: 'Étire simultanément ischio-jambiers, mollets et épaules — une position complète de récupération post-effort.',
        progression: 'Maintenir la posture plus longtemps ou tendre davantage les genoux.',
      },
      {
        name: 'Étirement fessier assis (Figure 4)', emoji: '4️⃣', type: 'Étirement actif',
        muscles: ['Piriforme', 'Grand fessier'],
        sets: '3', reps: '45 sec / côté',
        shortDesc: 'Assis, une cheville posée sur le genou opposé, se pencher en avant',
        technique: [
          'Dos droit pendant toute la flexion vers l\'avant',
          'Pencher depuis les hanches jusqu\'à sentir l\'étirement du fessier',
          'Respirer profondément pour relâcher progressivement',
        ],
        runnerTip: 'Le piriforme comprimé peut irriter le nerf sciatique — cet étirement ciblé est une des solutions les plus efficaces.',
        progression: 'Augmenter progressivement l\'inclinaison du buste vers l\'avant.',
      },
      {
        name: 'Glissement neural doux (nerve flossing)', emoji: '🧵', type: 'Mobilité',
        muscles: ['Nerf sciatique', 'Ischio-jambiers'],
        sets: '2', reps: '10 mouvements / côté',
        shortDesc: 'Assis, jambe tendue, alterner extension du genou et flexion de la nuque sans forcer',
        technique: [
          'Mouvement très doux, jamais dans la douleur',
          'Tendre le genou en penchant la tête en arrière, puis inverser',
          'Amplitude minimale au départ, augmenter très progressivement',
        ],
        runnerTip: 'Technique douce de mobilisation neurale utilisée en kinésithérapie pour les tensions sciatiques liées à un piriforme raide.',
        progression: 'À réaliser uniquement en l\'absence de douleur irradiante, sous conseil professionnel si des symptômes existent.',
      },
    ],
  },

  /* ── 41. Récupération Active ───────────────────────────────────────── */
  {
    id: 'recuperation_active', name: 'Récupération Active', emoji: '🌿', duration: '25–35 min',
    subtitle: 'Décrassage · relâchement musculaire · retour au calme',
    color: '#10B981',
    exercises: [
      {
        name: 'Marche de récupération', emoji: '🚶', type: 'Mobilité',
        muscles: ['Corps entier'],
        sets: '1', reps: '10–15 min',
        shortDesc: 'Marche à allure tranquille en respirant profondément et régulièrement',
        technique: [
          'Rythme lent, sans objectif de performance',
          'Respiration ample et consciente à chaque pas',
          'Relâcher activement les épaules et la mâchoire en marchant',
        ],
        runnerTip: 'Favorise le retour veineux et l\'évacuation des déchets métaboliques après un effort intense, sans le stress supplémentaire de la course.',
        progression: 'Allonger la durée après les séances les plus intenses.',
      },
      {
        name: 'Auto-massage quadriceps/ischio', emoji: '🎳', type: 'Mobilité',
        muscles: ['Quadriceps', 'Ischio-jambiers'],
        sets: '1', reps: '2 min / zone',
        shortDesc: 'Rouleau de massage passé lentement sur les cuisses, en insistant sur les zones tendues',
        technique: [
          'Passage lent, pas plus vite qu\'un centimètre par seconde',
          'S\'arrêter et respirer 20–30 sec sur les points les plus sensibles',
          'Ne jamais rouler directement sur une articulation',
        ],
        runnerTip: 'Le foam rolling favorise la circulation locale et réduit la sensation de raideur musculaire post-effort.',
        progression: 'Augmenter progressivement la pression appliquée au fil des séances.',
      },
      {
        name: 'Vélo léger décrassage', emoji: '🚴', type: 'Mobilité',
        muscles: ['Quadriceps', 'Mollets'],
        sets: '1', reps: '15–20 min',
        shortDesc: 'Pédalage très facile, cadence élevée, résistance minimale',
        technique: [
          'Intensité très basse, conversation possible sans essoufflement',
          'Cadence de pédalage élevée (90+ tr/min) pour favoriser le flux sanguin',
          'Terminer par quelques minutes encore plus faciles',
        ],
        runnerTip: 'Le mouvement cyclique sans impact accélère l\'élimination des déchets métaboliques mieux que le repos complet.',
        progression: 'Utiliser systématiquement après les séances de fractionné intense.',
      },
      {
        name: 'Étirements globaux post-effort', emoji: '🧘', type: 'Étirement actif',
        muscles: ['Corps entier'],
        sets: '1', reps: '10–15 min',
        shortDesc: 'Enchaîner des étirements doux de toutes les grandes chaînes musculaires sollicitées',
        technique: [
          'Étirements statiques doux, jamais dans la douleur',
          'Maintenir chaque position 20–30 sec en respirant profondément',
          'Prioriser mollets, ischio-jambiers, quadriceps et fessiers',
        ],
        runnerTip: 'Un retour au calme actif aide à la transition du système nerveux vers un état de récupération.',
        progression: 'Ajouter progressivement des postures selon les zones les plus sollicitées de la séance.',
      },
      {
        name: 'Respiration diaphragmatique de récupération', emoji: '🌬️', type: 'Mobilité',
        muscles: ['Diaphragme', 'Système nerveux'],
        sets: '1', reps: '5 min',
        shortDesc: 'Allongé, respirer profondément avec un ratio d\'expiration prolongée',
        technique: [
          'Inspirer 4 sec par le nez, expirer 6–8 sec par la bouche',
          'Ventre et côtes qui se gonflent à l\'inspiration',
          'Relâcher consciemment chaque groupe musculaire à chaque expiration',
        ],
        runnerTip: 'Favorise le passage du système nerveux sympathique (effort) vers le parasympathique (récupération), accélérant la régénération.',
        progression: 'Allonger progressivement le temps d\'expiration.',
      },
    ],
  },

  /* ── 42. Mobilité de la Colonne ────────────────────────────────────── */
  {
    id: 'mobilite_colonne', name: 'Mobilité de la Colonne', emoji: '🐍', duration: '20–25 min',
    subtitle: 'Rachis thoracique · lombaires · rotation',
    color: '#EC4899',
    exercises: [
      {
        name: 'Thread the Needle', emoji: '🧵', type: 'Mobilité',
        muscles: ['Colonne thoracique', 'Épaules'],
        sets: '2', reps: '8 / côté',
        shortDesc: 'À quatre pattes, glisser un bras sous le corps puis le ramener en rotation vers le plafond',
        technique: [
          'Hanches stables et immobiles pendant toute la rotation',
          'Glisser le bras le plus loin possible sous le corps',
          'Rotation contrôlée vers le plafond, regard qui suit la main',
        ],
        runnerTip: 'Mobilise spécifiquement la colonne thoracique, la zone la plus rigide chez les coureurs à cause de la posture répétitive.',
        progression: 'Augmenter progressivement l\'amplitude de la rotation.',
      },
      {
        name: 'Open Book Stretch', emoji: '📖', type: 'Mobilité',
        muscles: ['Colonne thoracique', 'Pectoraux'],
        sets: '2', reps: '8 / côté',
        shortDesc: 'Allongé sur le côté, genoux fléchis, ouvrir le bras du dessus comme un livre',
        technique: [
          'Genoux qui restent collés l\'un à l\'autre pendant toute la rotation',
          'Suivre la main des yeux pendant l\'ouverture du bras',
          'Revenir lentement à la position de départ',
        ],
        runnerTip: 'Améliore l\'amplitude de rotation thoracique, essentielle pour un balancement de bras ample et économique.',
        progression: 'Augmenter le temps de maintien en position ouverte.',
      },
      {
        name: 'Extension lombaire douce (Cobra léger)', emoji: '🐍', type: 'Mobilité',
        muscles: ['Colonne lombaire', 'Abdominaux'],
        sets: '2', reps: '8',
        shortDesc: 'À plat ventre, se soulever légèrement sur les avant-bras en gardant le bassin au sol',
        technique: [
          'Bassin qui reste en contact avec le sol pendant tout le mouvement',
          'Extension progressive, s\'arrêter à la première tension',
          'Redescendre lentement et répéter',
        ],
        runnerTip: 'Décompresse doucement les disques intervertébraux après une position penchée en avant prolongée en course.',
        progression: 'Augmenter progressivement la hauteur de l\'extension (passer aux mains tendues).',
      },
      {
        name: 'Flexion latérale debout', emoji: '↕️', type: 'Mobilité',
        muscles: ['Obliques', 'Colonne lombaire'],
        sets: '2', reps: '8 / côté',
        shortDesc: 'Debout, bras levé, incliner le buste latéralement sans se pencher en avant',
        technique: [
          'Hanches fixes, la flexion vient uniquement du buste',
          'Bras qui s\'allonge dans le prolongement de l\'inclinaison',
          'Revenir au centre avec contrôle avant l\'autre côté',
        ],
        runnerTip: 'Mobilise la colonne dans le plan latéral, souvent négligé au profit des seules flexions avant/arrière.',
        progression: 'Augmenter progressivement l\'amplitude de l\'inclinaison.',
      },
      {
        name: 'Segmental Rolling', emoji: '🎢', type: 'Mobilité',
        muscles: ['Colonne vertébrale', 'Core profond'],
        sets: '2', reps: '6 / sens',
        shortDesc: 'Allongé sur le dos, genoux ramenés, se rouler sur le côté vertèbre par vertèbre',
        technique: [
          'Initier le roulement par les yeux et la tête, puis les épaules, puis le bassin',
          'Mouvement lent et segmenté, pas un roulé en bloc',
          'Revenir au centre de la même façon contrôlée',
        ],
        runnerTip: 'Développe le contrôle moteur fin de la colonne, une compétence de base souvent négligée dans les routines classiques.',
        progression: 'Ralentir encore davantage le mouvement pour plus de contrôle segmentaire.',
      },
    ],
  },

  /* ── 43. Yoga du Coureur ───────────────────────────────────────────── */
  {
    id: 'yoga_coureur', name: 'Yoga du Coureur', emoji: '🧘', duration: '30–40 min',
    subtitle: 'Souplesse globale · respiration · relâchement mental',
    color: '#F59E0B',
    exercises: [
      {
        name: 'Salutation au soleil modifiée', emoji: '☀️', type: 'Mobilité',
        muscles: ['Corps entier'],
        sets: '3', reps: '1 enchaînement',
        shortDesc: 'Enchaînement fluide reliant plusieurs postures d\'ouverture et d\'étirement, synchronisé à la respiration',
        technique: [
          'Un mouvement par respiration, jamais de mouvement sans souffle associé',
          'Fluidité recherchée plutôt que l\'intensité de l\'étirement',
          'Répéter l\'enchaînement en alternant le pied qui avance en premier',
        ],
        runnerTip: 'Échauffement complet du corps qui prépare articulations et muscles tout en calmant le système nerveux avant l\'effort.',
        progression: 'Allonger le temps de maintien de chaque posture intermédiaire.',
      },
      {
        name: 'Demi-pigeon debout', emoji: '🕊️', type: 'Étirement actif',
        muscles: ['Piriforme', 'Fessiers'],
        sets: '2', reps: '45 sec / côté',
        shortDesc: 'Debout, cheville posée sur le genou opposé, descendre en légère flexion de l\'autre jambe',
        technique: [
          'Dos droit, descendre uniquement jusqu\'à ce que l\'étirement soit ressenti',
          'Se tenir à un support si l\'équilibre est difficile',
          'Respirer profondément pour approfondir progressivement',
        ],
        runnerTip: 'Version debout du Pigeon, accessible à tous niveaux de souplesse et pratiquable n\'importe où sans tapis.',
        progression: 'Passer à la version au sol (Pigeon classique) quand la souplesse le permet.',
      },
      {
        name: 'Guerrier II', emoji: '⚔️', type: 'Mobilité',
        muscles: ['Adducteurs', 'Fléchisseurs de hanche', 'Quadriceps'],
        sets: '2', reps: '45 sec / côté',
        shortDesc: 'Grande fente latérale, bras tendus horizontalement, regard vers la main avant',
        technique: [
          'Genou avant à 90°, dans l\'axe du pied',
          'Bassin ouvert sur le côté, buste bien droit',
          'Respiration profonde et régulière pendant tout le maintien',
        ],
        runnerTip: 'Ouvre profondément la hanche tout en renforçant les jambes en isométrie — un excellent double bénéfice.',
        progression: 'Descendre progressivement plus bas dans la fente.',
      },
      {
        name: 'Chien tête en bas prolongé', emoji: '🐕', type: 'Étirement actif',
        muscles: ['Ischio-jambiers', 'Mollets', 'Épaules'],
        sets: '2', reps: '60–90 sec',
        shortDesc: 'Posture en V inversé maintenue longuement avec une respiration profonde',
        technique: [
          'Mains bien ancrées, doigts écartés, poids réparti sur toute la paume',
          'Pédaler doucement les talons pour étirer alternativement chaque mollet',
          'Respiration ample et continue pendant tout le maintien',
        ],
        runnerTip: 'Position de référence du yoga du coureur qui combine étirement de la chaîne postérieure et relâchement mental.',
        progression: 'Allonger progressivement la durée de maintien.',
      },
      {
        name: 'Torsion assise', emoji: '🌀', type: 'Mobilité',
        muscles: ['Colonne vertébrale', 'Obliques', 'Fessiers'],
        sets: '2', reps: '45 sec / côté',
        shortDesc: 'Assis jambes croisées, tourner le buste d\'un côté en s\'appuyant sur le genou opposé',
        technique: [
          'Assis bien droit sur les ischions avant d\'initier la rotation',
          'Rotation qui vient du tronc, pas seulement du cou',
          'Respirer profondément, expirer pour approfondir la torsion',
        ],
        runnerTip: 'Termine la séance sur une note de relâchement complet de la colonne et du système nerveux.',
        progression: 'Augmenter progressivement l\'amplitude de la rotation.',
      },
    ],
  },

  /* ── 44. Full Body HIIT ────────────────────────────────────────────── */
  {
    id: 'full_body_hiit', name: 'Full Body HIIT', emoji: '🔥', duration: '25–35 min',
    subtitle: 'Cardio-musculaire · haute intensité par intervalles',
    color: '#F97316',
    exercises: [
      {
        name: 'Jumping Jacks', emoji: '🤸', type: 'Neuromusculaire',
        muscles: ['Corps entier', 'Cardio'],
        sets: '4', reps: '40 sec',
        shortDesc: 'Sauts en écartant bras et jambes simultanément, puis en revenant en position groupée',
        technique: [
          'Réception souple sur l\'avant du pied à chaque saut',
          'Bras qui montent complètement au-dessus de la tête',
          'Rythme régulier et soutenu pendant toute la durée',
        ],
        runnerTip: 'Échauffement cardio-musculaire complet qui augmente rapidement la fréquence cardiaque avant un circuit plus intense.',
        progression: 'Augmenter la durée de l\'effort ou la vitesse d\'exécution.',
      },
      {
        name: 'Squat + Punch', emoji: '🥊', type: 'Polyarticulaire',
        muscles: ['Quadriceps', 'Fessiers', 'Core'],
        sets: '4', reps: '15',
        shortDesc: 'Squat classique puis, en remontant, enchaîner deux coups de poing devant soi',
        technique: [
          'Descente en squat complet, poids réparti sur tout le pied',
          'Coups de poing rapides et engagés en remontant, rotation légère du buste',
          'Retour en position de garde entre chaque squat',
        ],
        runnerTip: 'Combine renforcement des jambes et rotation du tronc en un mouvement cardio-musculaire dynamique.',
        progression: 'Augmenter la vitesse d\'exécution ou ajouter de légers haltères.',
      },
      {
        name: 'Burpee sans pompe', emoji: '💥', type: 'Polyarticulaire',
        muscles: ['Corps entier', 'Cardio'],
        sets: '4', reps: '12',
        shortDesc: 'Version rapide du burpee, sans la phase de pompe, pour un rythme cardio plus soutenu',
        technique: [
          'Mains au sol, sauter les pieds en arrière en planche',
          'Ramener directement les pieds sans marquer de pompe',
          'Saut final avec bras tendus vers le haut',
        ],
        runnerTip: 'Version accessible du burpee qui permet de maintenir un rythme cardio élevé sans sacrifier la qualité d\'exécution.',
        progression: 'Ajouter la phase de pompe une fois le rythme cardio maîtrisé.',
      },
      {
        name: 'Plank Jacks', emoji: '🤸', type: 'Neuromusculaire',
        muscles: ['Core', 'Épaules', 'Cardio'],
        sets: '4', reps: '30 sec',
        shortDesc: 'En planche haute, sauter les pieds en écartant puis en resserrant, comme un jumping jack horizontal',
        technique: [
          'Hanches stables pendant tout le mouvement, ne pas les lever',
          'Sauts rapides et légers, pas de rebond brutal',
          'Corps rigide de la tête aux talons en permanence',
        ],
        runnerTip: 'Combine gainage et travail cardio — le core doit rester stable malgré le mouvement rapide des jambes.',
        progression: 'Augmenter la durée de l\'effort ou la vitesse des sauts.',
      },
      {
        name: 'High Knees sur place', emoji: '🏃', type: 'Neuromusculaire',
        muscles: ['Fléchisseurs de hanche', 'Mollets', 'Core'],
        sets: '4', reps: '30 sec',
        shortDesc: 'Montées de genoux rapides sur place, à fréquence maximale',
        technique: [
          'Genou qui monte à hauteur de hanche à chaque appui',
          'Rester sur l\'avant du pied, jamais sur le talon',
          'Bras actifs en opposition des jambes',
        ],
        runnerTip: 'Développe la fréquence de foulée et l\'endurance cardio-vasculaire en un seul exercice sans matériel.',
        progression: 'Augmenter la durée de l\'effort ou la fréquence des appuis.',
      },
    ],
  },

  /* ── 45. Full Body Force ───────────────────────────────────────────── */
  {
    id: 'full_body_force', name: 'Full Body Force', emoji: '🏋️', duration: '35–45 min',
    subtitle: 'Force globale · mouvements polyarticulaires lourds',
    color: '#8B2FC9',
    exercises: [
      {
        name: 'Clean and Press', emoji: '🏋️', type: 'Polyarticulaire',
        muscles: ['Corps entier', 'Épaules', 'Fessiers'],
        sets: '4', reps: '6',
        shortDesc: 'Tirer la barre du sol jusqu\'aux épaules, puis la pousser au-dessus de la tête',
        technique: [
          'Tirage explosif depuis le sol, hanches et genoux qui s\'étendent ensemble',
          'Réception de la barre sur les épaules, coudes hauts',
          'Poussée complète au-dessus de la tête pour terminer',
        ],
        runnerTip: 'Mouvement complet qui développe la puissance de toute la chaîne cinétique en un seul geste explosif.',
        progression: 'Augmenter la charge progressivement en priorisant la technique.',
      },
      {
        name: 'Deadlift + Développé militaire', emoji: '🔱', type: 'Polyarticulaire',
        muscles: ['Ischio-jambiers', 'Fessiers', 'Épaules'],
        sets: '3', reps: '8',
        shortDesc: 'Soulevé de terre roumain, puis développé militaire debout à la remontée',
        technique: [
          'Descente en hip hinge, dos plat, haltères le long des jambes',
          'Remontée complète en position debout stable',
          'Poussée des haltères au-dessus de la tête, core engagé',
        ],
        runnerTip: 'Combine chaîne postérieure et épaules dans un mouvement fonctionnel économe en temps d\'entraînement.',
        progression: 'Augmenter la charge des haltères progressivement.',
      },
      {
        name: 'Squat to Press', emoji: '🚀', type: 'Polyarticulaire',
        muscles: ['Quadriceps', 'Épaules', 'Core'],
        sets: '3', reps: '10',
        shortDesc: 'Squat goblet complet, puis pousser le poids au-dessus de la tête en remontant',
        technique: [
          'Descente en squat complet, poids tenu contre la poitrine',
          'L\'élan de la remontée du squat aide à initier la poussée',
          'Extension complète des bras au-dessus de la tête en haut',
        ],
        runnerTip: 'Coordonne bas et haut du corps en un seul mouvement — utile pour la coordination neuromusculaire globale.',
        progression: 'Augmenter la charge ou ralentir la phase de squat.',
      },
      {
        name: 'Push-Press', emoji: '🚀', type: 'Polyarticulaire',
        muscles: ['Épaules', 'Triceps', 'Quadriceps'],
        sets: '4', reps: '8',
        shortDesc: 'Léger fléchissement des jambes pour donner de l\'élan à la poussée des haltères au-dessus de la tête',
        technique: [
          'Flexion rapide et courte des jambes, pas un squat complet',
          'Extension explosive des jambes qui transfère l\'énergie vers le haut',
          'Poussée complète des bras pour terminer le mouvement',
        ],
        runnerTip: 'Permet de charger plus lourd que le développé militaire strict en utilisant l\'élan des jambes, comme en course où les jambes propulsent le haut du corps.',
        progression: 'Augmenter la charge progressivement.',
      },
      {
        name: 'Farmer Walk lourd + Squat', emoji: '🧳', type: 'Polyarticulaire',
        muscles: ['Avant-bras', 'Core', 'Quadriceps'],
        sets: '3', reps: '20 m + 8 squats',
        shortDesc: 'Marcher avec des charges lourdes puis enchaîner directement une série de squats au poids du corps',
        technique: [
          'Buste droit pendant toute la marche, pas de bascule latérale',
          'Poser les charges avec contrôle avant d\'enchaîner les squats',
          'Squats profonds et contrôlés malgré la fatigue de préhension',
        ],
        runnerTip: 'Combine force de préhension, gainage et endurance musculaire des jambes en un seul enchaînement complet.',
        progression: 'Augmenter la charge portée ou la distance de marche.',
      },
    ],
  },

  /* ── 46. Circuit Métabolique ───────────────────────────────────────── */
  {
    id: 'circuit_metabolique', name: 'Circuit Métabolique', emoji: '🔄', duration: '30–35 min',
    subtitle: 'Cardio-musculaire · VO2max · capacité anaérobie',
    color: '#EC4899',
    exercises: [
      {
        name: 'Kettlebell Swing + Squat Jump', emoji: '🏋️', type: 'Polyarticulaire',
        muscles: ['Fessiers', 'Ischio-jambiers', 'Quadriceps'],
        sets: '4', reps: '10 + 10',
        shortDesc: 'Enchaîner 10 kettlebell swings puis directement 10 squat jumps',
        technique: [
          'Swing propulsé par les hanches, pas par les bras',
          'Transition rapide vers le squat jump sans pause complète',
          'Réception souple à chaque saut, genoux fléchis',
        ],
        runnerTip: 'Combine deux mouvements de puissance de la chaîne postérieure pour un stimulus cardio-musculaire intense.',
        progression: 'Réduire le temps de transition entre les deux exercices.',
      },
      {
        name: 'Battle Rope (vagues de corde)', emoji: '🌊', type: 'Neuromusculaire',
        muscles: ['Épaules', 'Core', 'Cardio'],
        sets: '4', reps: '30 sec',
        shortDesc: 'Créer des vagues alternées ou simultanées avec des cordes lourdes',
        technique: [
          'Genoux légèrement fléchis, position athlétique stable',
          'Vagues amples générées par les épaules, pas seulement les mains',
          'Core engagé pour stabiliser le buste pendant tout l\'effort',
        ],
        runnerTip: 'Développe l\'endurance du haut du corps et la capacité cardio-vasculaire sans impact sur les jambes.',
        progression: 'Augmenter la durée de l\'effort ou l\'amplitude des vagues.',
      },
      {
        name: 'Rameur intervalle', emoji: '🚣', type: 'Polyarticulaire',
        muscles: ['Corps entier', 'Cardio'],
        sets: '5', reps: '250 m',
        shortDesc: 'Intervalles courts et intenses sur rameur, récupération égale entre chaque',
        technique: [
          'Poussée des jambes en premier, puis bascule du buste, puis tirage des bras',
          'Retour dans l\'ordre inverse : bras, buste, puis jambes',
          'Rythme soutenu et régulier sur toute la distance',
        ],
        runnerTip: 'Sollicite tout le corps sans impact articulaire — un excellent complément cardio en période de forte charge de course.',
        progression: 'Réduire le temps de récupération entre les intervalles.',
      },
      {
        name: 'Wall Ball', emoji: '⚽', type: 'Polyarticulaire',
        muscles: ['Quadriceps', 'Fessiers', 'Épaules'],
        sets: '4', reps: '15',
        shortDesc: 'Squat avec un ballon lesté, le lancer contre un mur puis le rattraper en continu',
        technique: [
          'Descente en squat complet à chaque répétition',
          'Extension des jambes qui propulse le lancer du ballon',
          'Rattraper en amortissant directement dans le squat suivant',
        ],
        runnerTip: 'Mouvement cardio-musculaire complet qui maintient une fréquence cardiaque élevée tout en travaillant la force des jambes.',
        progression: 'Augmenter le poids du ballon ou le nombre de répétitions.',
      },
      {
        name: 'Box Step-over rapide', emoji: '📦', type: 'Neuromusculaire',
        muscles: ['Quadriceps', 'Fessiers', 'Cardio'],
        sets: '4', reps: '30 sec',
        shortDesc: 'Monter sur une boîte puis redescendre de l\'autre côté, en alternant rapidement',
        technique: [
          'Pied entier posé sur la boîte à chaque montée',
          'Rythme rapide et régulier, alterner le pied qui monte en premier',
          'Rester léger sur les appuis, pas de bruit à la réception',
        ],
        runnerTip: 'Développe l\'endurance cardio-musculaire des jambes dans un mouvement fonctionnel proche de la montée d\'escalier.',
        progression: 'Augmenter la hauteur de la boîte ou la durée de l\'effort.',
      },
    ],
  },

  /* ── 47. Full Body Poids du Corps ─────────────────────────────────── */
  {
    id: 'full_body_poids_corps', name: 'Full Body Poids du Corps', emoji: '🤸', duration: '30–40 min',
    subtitle: 'Sans matériel · fonctionnel · voyage',
    color: '#6366F1',
    exercises: [
      {
        name: 'Squat Thrust', emoji: '💥', type: 'Polyarticulaire',
        muscles: ['Corps entier', 'Core'],
        sets: '4', reps: '12',
        shortDesc: 'Mains au sol, sauter les pieds en arrière en planche puis les ramener directement',
        technique: [
          'Planche brève et stable au point le plus bas',
          'Ramener les pieds vivement vers les mains',
          'Se redresser complètement entre chaque répétition',
        ],
        runnerTip: 'Version simplifiée du burpee, sans le saut final, pour un rythme cardio soutenu et accessible à tous niveaux.',
        progression: 'Ajouter le saut final une fois le rythme maîtrisé.',
      },
      {
        name: 'Pompe-Squat combo', emoji: '🤲', type: 'Polyarticulaire',
        muscles: ['Pectoraux', 'Quadriceps', 'Core'],
        sets: '3', reps: '10',
        shortDesc: 'Une pompe complète, puis se relever directement en squat',
        technique: [
          'Pompe complète, poitrine proche du sol',
          'Se relever en ramenant les pieds vers les mains',
          'Enchaîner directement en squat complet',
        ],
        runnerTip: 'Combine deux mouvements fondamentaux du haut et du bas du corps sans transition inutile — efficace en temps limité.',
        progression: 'Ajouter un saut à la fin du squat.',
      },
      {
        name: 'Superman to Push-up', emoji: '🦸', type: 'Neuromusculaire',
        muscles: ['Érecteurs', 'Pectoraux', 'Core'],
        sets: '3', reps: '10',
        shortDesc: 'Depuis la position Superman (à plat ventre), se retourner et enchaîner une pompe',
        technique: [
          'Maintenir la position Superman 1 sec avant la transition',
          'Se retourner avec contrôle, ne pas se laisser tomber',
          'Enchaîner directement une pompe complète',
        ],
        runnerTip: 'Combine renforcement de la chaîne postérieure et poussée du haut du corps en une transition fluide et coordonnée.',
        progression: 'Ralentir la transition pour plus de contrôle ou enchaîner sans pause.',
      },
      {
        name: 'Inchworm', emoji: '🐛', type: 'Mobilité',
        muscles: ['Ischio-jambiers', 'Core', 'Épaules'],
        sets: '3', reps: '8',
        shortDesc: 'Debout, se pencher en avant, marcher avec les mains jusqu\'en planche puis revenir',
        technique: [
          'Jambes tendues autant que possible pendant la marche des mains',
          'Planche brève et stable au point le plus éloigné',
          'Remonter en marchant les pieds vers les mains',
        ],
        runnerTip: 'Combine mobilité des ischio-jambiers et gainage dynamique — un excellent échauffement complet avant course.',
        progression: 'Ajouter une pompe en position de planche avant de remonter.',
      },
      {
        name: 'Crab Walk', emoji: '🦀', type: 'Neuromusculaire',
        muscles: ['Triceps', 'Fessiers', 'Core'],
        sets: '3', reps: '15 m aller-retour',
        shortDesc: 'Assis, mains et pieds au sol, bassin levé, se déplacer en crabe',
        technique: [
          'Bassin maintenu haut pendant tout le déplacement',
          'Coordination contralatérale : main droite avec pied gauche',
          'Regard vers l\'avant, ne pas laisser tomber les hanches',
        ],
        runnerTip: 'Renforce triceps et fessiers en chaîne fermée tout en développant une coordination inhabituelle et complémentaire.',
        progression: 'Augmenter la distance ou la vitesse de déplacement.',
      },
    ],
  },

  /* ── 48. Full Body Kettlebell ──────────────────────────────────────── */
  {
    id: 'full_body_kettlebell', name: 'Full Body Kettlebell', emoji: '🏋️', duration: '30–40 min',
    subtitle: 'Puissance · endurance musculaire · coordination',
    color: '#10B981',
    exercises: [
      {
        name: 'Kettlebell Clean', emoji: '🏋️', type: 'Polyarticulaire',
        muscles: ['Fessiers', 'Épaules', 'Avant-bras'],
        sets: '4', reps: '8 / côté',
        shortDesc: 'Tirer le kettlebell du sol jusqu\'à la position de réception à l\'épaule',
        technique: [
          'Hip hinge puissant pour initier le mouvement, pas les bras',
          'Guider le kettlebell près du corps pendant la remontée',
          'Réception souple à l\'épaule, coude proche du corps',
        ],
        runnerTip: 'Développe la puissance de hanche et la coordination nécessaire pour transférer la force du bas vers le haut du corps.',
        progression: 'Augmenter le poids du kettlebell progressivement.',
      },
      {
        name: 'Turkish Get-up complet', emoji: '🏋️', type: 'Neuromusculaire',
        muscles: ['Épaules', 'Core', 'Corps entier'],
        sets: '3', reps: '5 / côté',
        shortDesc: 'Depuis le sol jusqu\'à la position debout complète, kettlebell tendu au-dessus de la tête en permanence',
        technique: [
          'Regard sur le poids pendant toute la séquence',
          'Chaque transition effectuée lentement et avec contrôle',
          'Refaire le chemin inverse pour revenir au sol',
        ],
        runnerTip: 'Mouvement complexe qui développe stabilité d\'épaule, mobilité de hanche et coordination globale en un seul exercice.',
        progression: 'Augmenter le poids du kettlebell une fois le mouvement fluide et maîtrisé.',
      },
      {
        name: 'Kettlebell Goblet Lunge', emoji: '🚶', type: 'Polyarticulaire',
        muscles: ['Quadriceps', 'Fessiers', 'Core'],
        sets: '3', reps: '10 / côté',
        shortDesc: 'Kettlebell tenu contre la poitrine, effectuer des fentes avant',
        technique: [
          'Kettlebell tenu près du corps, coudes vers le bas',
          'Descente en fente jusqu\'à ce que le genou arrière frôle le sol',
          'Pousser fort sur le talon avant pour remonter',
        ],
        runnerTip: 'Le poids tenu devant renforce le gainage anti-flexion pendant tout le mouvement de fente.',
        progression: 'Augmenter le poids du kettlebell ou la profondeur de la fente.',
      },
      {
        name: 'Kettlebell Snatch', emoji: '⚡', type: 'Polyarticulaire',
        muscles: ['Fessiers', 'Épaules', 'Corps entier'],
        sets: '3', reps: '8 / côté',
        shortDesc: 'Tirer le kettlebell du sol jusqu\'à la position tendue au-dessus de la tête en un seul mouvement',
        technique: [
          'Extension puissante des hanches pour propulser le kettlebell',
          'Le bras guide le kettlebell autour du poignet sans à-coup brutal',
          'Réception stable, bras tendu au-dessus de la tête',
        ],
        runnerTip: 'Mouvement explosif complet qui développe puissance et coordination — un des exercices kettlebell les plus exigeants.',
        progression: 'Augmenter le poids une fois la technique parfaitement maîtrisée.',
      },
      {
        name: 'Kettlebell Row unilatéral', emoji: '🎽', type: 'Concentrique',
        muscles: ['Dos', 'Biceps', 'Core'],
        sets: '3', reps: '12 / côté',
        shortDesc: 'Buste penché en avant, tirer le kettlebell vers la hanche',
        technique: [
          'Dos plat, buste stable pendant toute la traction',
          'Tirer le coude vers le plafond en serrant l\'omoplate',
          'Descendre avec contrôle jusqu\'à l\'extension complète',
        ],
        runnerTip: 'Renforce le dos en position fonctionnelle, complémentaire aux mouvements de poussée de la séance.',
        progression: 'Augmenter le poids du kettlebell progressivement.',
      },
    ],
  },

  /* ── 49. Cross Training Coureur ────────────────────────────────────── */
  {
    id: 'cross_training', name: 'Cross Training Coureur', emoji: '🎯', duration: '35–45 min',
    subtitle: 'Circuit complet · transfert direct à la course',
    color: '#F59E0B',
    exercises: [
      {
        name: 'Circuit combiné (squat-row-press-fente)', emoji: '🔄', type: 'Polyarticulaire',
        muscles: ['Corps entier'],
        sets: '3', reps: '10 chaque mouvement',
        shortDesc: 'Enchaîner squat, rowing, développé épaules et fente sans pause entre les mouvements',
        technique: [
          'Transition rapide entre chaque mouvement, technique toujours prioritaire',
          'Charge modérée permettant de maintenir la qualité sur tout le circuit',
          'Récupération complète uniquement entre les tours',
        ],
        runnerTip: 'Circuit complet qui sollicite tout le corps en peu de temps — idéal en complément d\'un planning de course chargé.',
        progression: 'Réduire le temps de transition entre les mouvements ou augmenter les charges.',
      },
      {
        name: 'Med Ball Slam', emoji: '💥', type: 'Plyométrique',
        muscles: ['Core', 'Épaules', 'Corps entier'],
        sets: '4', reps: '10',
        shortDesc: 'Lever un medecine-ball au-dessus de la tête puis le projeter violemment au sol',
        technique: [
          'Extension complète du corps à la montée du ballon',
          'Contraction explosive du core pour projeter le ballon vers le bas',
          'Rattraper au rebond et enchaîner directement',
        ],
        runnerTip: 'Développe la puissance du core en extension-flexion rapide, un excellent exutoire pour l\'intensité nerveuse.',
        progression: 'Augmenter le poids du ballon ou la vitesse d\'exécution.',
      },
      {
        name: 'Sled Drag (traction de traîneau)', emoji: '🛷', type: 'Polyarticulaire',
        muscles: ['Ischio-jambiers', 'Fessiers', 'Avant-bras'],
        sets: '4', reps: '20 m',
        shortDesc: 'Tirer un traîneau chargé en marchant à reculons, sangles tenues à deux mains',
        technique: [
          'Pas courts et puissants, buste légèrement incliné',
          'Tension constante dans les sangles, pas de à-coup',
          'Respiration régulière malgré l\'effort soutenu',
        ],
        runnerTip: 'Sollicite la chaîne postérieure en excentrique contrôlé, complémentaire à la poussée du sled push.',
        progression: 'Augmenter la charge du traîneau ou la distance parcourue.',
      },
      {
        name: 'Corde à sauter', emoji: '🪢', type: 'Neuromusculaire',
        muscles: ['Mollets', 'Cardio', 'Coordination'],
        sets: '5', reps: '60 sec',
        shortDesc: 'Sauts à la corde en rythme régulier, rester léger sur l\'avant du pied',
        technique: [
          'Petits sauts, quelques centimètres seulement au-dessus du sol',
          'Poignets qui font tourner la corde, pas les épaules',
          'Rythme constant et régulier pendant toute la durée',
        ],
        runnerTip: 'Développe la raideur de cheville et la coordination à haute fréquence — un transfert direct vers l\'économie de course.',
        progression: 'Augmenter la durée des intervalles ou ajouter des doubles sauts.',
      },
      {
        name: 'Farmer Carry + Sprint', emoji: '🧳', type: 'Polyarticulaire',
        muscles: ['Avant-bras', 'Core', 'Cardio'],
        sets: '4', reps: '20 m + 15 m',
        shortDesc: 'Marcher chargé sur 20 mètres puis poser les charges et sprinter 15 mètres',
        technique: [
          'Buste droit pendant toute la marche chargée',
          'Poser les charges avec contrôle avant le sprint',
          'Accélération complète sur le sprint final',
        ],
        runnerTip: 'Combine force de préhension, gainage et vitesse — un enchaînement complet qui simule la fatigue de fin de course suivie d\'un sursaut d\'effort.',
        progression: 'Augmenter la charge portée ou la distance du sprint.',
      },
    ],
  },
]

/* ─── Grandes catégories (groupes musculaires) ───────────────────────── */
const CATEGORIES = [
  { id: 'abdos_gainage',          name: 'Abdos & Gainage',              emoji: '🎯', color: '#8B2FC9', sessionIds: ['core_abdo', 'gainage', 'pilates', 'gainage_dynamique', 'abdos_obliques', 'core_stabilite_avancee', 'respiration_posture'] },
  { id: 'fessiers_ischio',        name: 'Fessiers & Ischio-jambiers',   emoji: '🍑', color: '#10B981', sessionIds: ['fessiers', 'excentrique', 'fessiers_unilateral', 'ischio_force', 'chaine_posterieure', 'fessiers_elastique', 'posterieur_puissance'] },
  { id: 'jambes_genoux',          name: 'Jambes & Genoux',              emoji: '🦵', color: '#E8237A', sessionIds: ['force', 'quadriceps', 'jambes_unilateral', 'quad_genou_prevention', 'jambes_charge_lourde', 'jambes_endurance_muscu', 'bas_corps_complet'] },
  { id: 'haut_corps_cat',         name: 'Haut du Corps',                emoji: '💪', color: '#0EA5E9', sessionIds: ['haut_corps', 'epaules_stabilite', 'dos_posture', 'bras_avantbras', 'haut_corps_poids_corps', 'haut_corps_elastique', 'pectoraux_triceps'] },
  { id: 'explosivite_equilibre',  name: 'Explosivité & Équilibre',      emoji: '⚡', color: '#F59E0B', sessionIds: ['explosivite', 'proprioception', 'pliometrie_avancee', 'vitesse_reaction', 'equilibre_dynamique', 'puissance_bondissante', 'coordination_agilite'] },
  { id: 'mobilite_cat',           name: 'Mobilité & Récupération',      emoji: '🌊', color: '#6B7280', sessionIds: ['mobilite', 'mobilite_hanches', 'mobilite_cheville_avancee', 'etirements_chaine_posterieure', 'recuperation_active', 'mobilite_colonne', 'yoga_coureur'] },
  { id: 'full_body_cat',          name: 'Full Body',                    emoji: '🔥', color: '#F97316', sessionIds: ['full_body', 'full_body_hiit', 'full_body_force', 'circuit_metabolique', 'full_body_poids_corps', 'full_body_kettlebell', 'cross_training'] },
]

/* ─── Flat exercise list for search ─────────────────────────────────── */
const ALL_EXERCISES_FLAT = SESSIONS.flatMap(s =>
  s.exercises.map(ex => ({ ...ex, sessionColor: s.color, sessionName: s.name }))
)

/* ─── Page ──────────────────────────────────────────────────────────── */
export default function AthleteStrength() {
  const [activeCategory,    setActiveCategory]    = useState(null)
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
            Clique sur une catégorie, puis sur une séance et un exercice pour les détails.
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

      {/* Category tiles (grandes catégories) */}
      {!activeCategory && !activeSession && !searchQuery && (
        <div className="strength-cat-grid">
          {CATEGORIES.map(cat => {
            const sessions = SESSIONS.filter(s => cat.sessionIds.includes(s.id))
            const totalEx  = sessions.reduce((sum, s) => sum + s.exercises.length, 0)
            const allDone  = sessions.length > 0 && sessions.every(s => completedSessions.includes(s.id))
            return (
              <div key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', gap: '.65rem', padding: '1.25rem', textAlign: 'center',
                  cursor: 'pointer', background: 'var(--surface)', border: '1.5px solid var(--border)',
                  borderRadius: 20, position: 'relative', boxSizing: 'border-box',
                  transition: 'transform .15s, box-shadow .15s, border-color .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; e.currentTarget.style.borderColor = cat.color + '60' }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = 'var(--border)' }}>
                {allDone && (
                  <span style={{ position: 'absolute', top: 10, right: 10, fontSize: '.95rem' }}>✅</span>
                )}
                <div style={{
                  width: 68, height: 68, borderRadius: 18,
                  background: `linear-gradient(135deg, ${cat.color}18, ${cat.color}38)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem'
                }}>
                  {cat.emoji}
                </div>
                <div style={{ fontWeight: 700, fontSize: '.95rem', lineHeight: 1.25 }}>{cat.name}</div>
                <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>
                  {sessions.length} séance{sessions.length > 1 ? 's' : ''} · {totalEx} exercices
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Session list within a category */}
      {activeCategory && !activeSession && !searchQuery && (() => {
        const category = CATEGORIES.find(c => c.id === activeCategory)
        const sessions  = SESSIONS.filter(s => category?.sessionIds.includes(s.id))
        return (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1.25rem' }}>
              <button onClick={() => setActiveCategory(null)}
                style={{ padding: '.4rem .8rem', borderRadius: 99, border: '1.5px solid var(--border)',
                  background: 'var(--surface)', cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: '.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                ← Catégories
              </button>
              <div style={{ fontWeight: 700, fontSize: '.95rem' }}>{category?.emoji} {category?.name}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.875rem' }}>
              {sessions.map(s => {
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
          </>
        )
      })()}

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
