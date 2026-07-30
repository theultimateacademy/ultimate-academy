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
