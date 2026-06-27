import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import Nav from '../components/Nav'

const C = { purple: '#8B2FC9', pink: '#E8237A', bg: '#0C0A18' }
const grad = 'linear-gradient(135deg,#8B2FC9,#E8237A)'

const VARIANT_PRICE_TIERS = {
  '10km-8sem':  { 3: 1499, 4: 1799, 5: 1999, 6: 2299 },
  '10km-12sem': { 3: 1799, 4: 1999, 5: 2299, 6: 2499 },
  'semi-12sem': { 3: 1999, 4: 2299, 5: 2499, 6: 2999 },
}

// Toutes les VMA disponibles : 10 à 24 par pas de 0.5
const VMA_OPTIONS = Array.from({ length: 29 }, (_, i) => parseFloat((10 + i * 0.5).toFixed(1)))

function isValidVma(v) {
  const n = Number(v)
  return Number.isFinite(n) && n >= 10 && n <= 24 && Math.round(n * 2) === n * 2
}

const EBOOK_DETAILS = {
  '10km-8sem': {
    icon: '🏃', weeks: 8, distance: '10 km', level: 'Tous niveaux',
    full_description: 'Un plan complet de 8 semaines pour préparer ta prochaine course de 10 km. Chaque séance est calculée depuis ta VMA réelle : tu cours aux bonnes allures, au bon moment, sans jamais avoir à convertir des pourcentages.',
    toc: [
      'Allures personnalisées en min/km',
      'Semaines 1-2 · Adaptation',
      'Semaines 3-4 · Développement',
      'Semaines 5-6 · Intensification',
      'Semaine 7 · Consolidation',
      'Semaine 8 · Semaine de course',
      'Stratégie de course',
      'Nutrition',
    ],
    for_who: [
      { check: true,  text: 'Tu peux courir 30 minutes sans t\'arrêter' },
      { check: true,  text: 'Tu veux descendre sous les 60 min, 55 min, 50 min, 45 min ou même 40 min' },
      { check: true,  text: 'Tu prépares ta première course de 10km et tu veux un plan progressif et structuré' },
      { check: true,  text: 'Tu cours déjà mais sans méthode, et tu veux enfin progresser avec logique' },
      { check: true,  text: 'Tu as déjà couru un 10km et tu veux battre ton record personnel' },
      { check: true,  text: 'Tu t\'entraînes de 3 à 6 fois par semaine, le plan s\'adapte exactement à ta disponibilité' },
    ],
  },
  '10km-12sem': {
    icon: '🏃', weeks: 12, distance: '10 km', level: 'Tous niveaux',
    full_description: 'La version longue et progressive pour préparer un 10km en 12 semaines. Plus de temps pour construire ta base aérobie, développer ta VMA et arriver en pleine forme le jour J.',
    toc: [
      'Allures personnalisées en min/km',
      'Semaines 1-2 · Adaptation',
      'Semaines 3-4 · Développement aérobie',
      'Semaines 5-6 · Développement VMA',
      'Semaines 7-8 · Intensification',
      'Semaines 9-10 · Spécificité',
      'Semaine 11 · Consolidation',
      'Semaine 12 · Semaine de course',
      'Stratégie de course et nutrition',
    ],
    for_who: [
      { check: true, text: 'Tu peux courir 30 minutes sans t\'arrêter' },
      { check: true, text: 'Tu veux une progression en douceur sur 12 semaines, sans brûler les étapes' },
      { check: true, text: 'Tu veux développer ta VMA et ton endurance de fond' },
      { check: true, text: 'Tu t\'entraînes de 3 à 6 fois par semaine, le plan s\'adapte à ta disponibilité' },
    ],
  },
  'semi-12sem': {
    icon: '🏅', weeks: 12, distance: 'Semi-marathon', level: 'Tous niveaux',
    full_description: 'Prépare ton semi-marathon en 12 semaines avec un plan structuré alliant volume kilométrique progressif, séances de qualité et allures personnalisées selon ta VMA.',
    toc: [
      'Allures personnalisées en min/km',
      'Semaines 1-2 · Adaptation',
      'Semaines 3-4 · Développement aérobie',
      'Semaines 5-6 · Volume',
      'Semaines 7-8 · Intensification',
      'Semaines 9-10 · Spécificité semi',
      'Semaine 11 · Consolidation',
      'Semaine 12 · Semaine de course',
      'Stratégie de course et nutrition',
    ],
    for_who: [
      { check: true, text: 'Tu as déjà couru un 10km ou tu cours régulièrement depuis 6 mois' },
      { check: true, text: 'Tu veux préparer ton premier semi-marathon ou améliorer ton record' },
      { check: true, text: 'Tu es capable de courir 45 minutes sans t\'arrêter' },
      { check: true, text: 'Tu t\'entraînes de 3 à 6 fois par semaine, le plan s\'adapte à ta disponibilité' },
      { check: true, text: 'Tu veux arriver le jour J avec une vraie stratégie de course' },
    ],
  },
  'marathon-12sem': {
    icon: '🏆', weeks: 12, distance: 'Marathon', level: 'Confirmé',
    full_description: 'Un plan intense de 12 semaines pour les coureurs confirmés visant un objectif de temps sur marathon. Exigeant, efficace, structuré.',
    toc: [
      'Semaines 1-3 : Construction du volume — base kilométrique',
      'Semaines 4-6 : Long runs jusqu\'à 30km, allure marathon',
      'Semaines 7-9 : Qualité — seuil, allure spécifique, fractionnés',
      'Semaines 10-11 : Consolidation progressive',
      'Semaine 12 : Semaine de course',
      'Stratégie de course par blocs de 5km',
      'Nutrition, ravitaillement et hydratation',
    ],
    for_who: [
      { check: true, text: 'Tu as déjà terminé un semi-marathon' },
      { check: true, text: 'Tu vises un objectif de temps précis sur marathon' },
      { check: true, text: 'Tu peux t\'entraîner 4 à 5 fois par semaine' },
      { check: true, text: 'Tu veux un plan intensif et structuré sur 12 semaines' },
    ],
  },
  'marathon-16sem': {
    icon: '🏆', weeks: 16, distance: 'Marathon', level: 'Tous niveaux',
    full_description: 'Le plan marathon complet. 16 semaines pour construire progressivement ton endurance, développer ta résistance et arriver au départ en pleine confiance.',
    toc: [
      'Semaines 1-4 : Fondation — endurance fondamentale, côtes',
      'Semaines 5-8 : Développement volume — long runs croissants',
      'Semaines 9-12 : Spécificité marathon — allures et seuil',
      'Semaines 13-14 : Intensification finale',
      'Semaines 15-16 : Consolidation et course',
      'Plans A / B / C selon l\'objectif',
      'Guide complet nutrition et hydratation',
    ],
    for_who: [
      { check: true, text: 'Tu veux préparer ton premier marathon ou battre ton record personnel' },
      { check: true, text: 'Tu t\'entraînes de 3 à 6 fois par semaine' },
      { check: true, text: 'Tu veux progresser sereinement avec 4 mois de préparation devant toi' },
      { check: true, text: 'Tu cherches un plan complet avec stratégie de course et nutrition' },
    ],
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
    for_who: [
      { check: true, text: 'Tu as eu des blessures récurrentes et veux enfin les prévenir' },
      { check: true, text: 'Tu veux renforcer tes zones fragiles : genoux, chevilles, hanches' },
      { check: true, text: 'Tu veux courir durablement, sans interruptions forcées' },
      { check: true, text: 'Tu cherches un protocole de reprise après blessure' },
    ],
  },
}

// ─── Illustrations SVG ───────────────────────────────────────────────────────
function IllustrationRunning({ dist, kmText, kmInline, weeksLabel, price }) {
  const isWord = /[A-Za-z]/.test(dist)
  const distFs = isWord
    ? (dist.length <= 4 ? 100 : dist.length <= 8 ? 72 : 54)
    : (dist.length <= 2 ? 140 : dist.length <= 4 ? 108 : 78)
  const km = !kmInline && (kmText !== undefined ? kmText : 'KM')

  const distY  = isWord ? (km ? 129 : 143) : 162
  const kmY    = isWord ? 187 : 207
  const semsY  = isWord ? (km ? 212 : 175) : 232
  const lineY  = isWord ? (km ? 220 : 184) : 241

  return (
    <svg viewBox="0 0 640 260" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
      <defs>
        <linearGradient id="il-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1A0A2E" /><stop offset="100%" stopColor="#2D0B4E" />
        </linearGradient>
        <linearGradient id="il-g" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8B2FC9" /><stop offset="100%" stopColor="#E8237A" />
        </linearGradient>
        <radialGradient id="il-gl1" cx="50%" cy="50%" r="65%">
          <stop offset="0%" stopColor="#8B2FC9" stopOpacity="0.24" />
          <stop offset="100%" stopColor="#8B2FC9" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="640" height="260" fill="url(#il-bg)" />
      <rect width="640" height="260" fill="url(#il-gl1)" />

      {kmInline ? (
        <text x="320" y="162" textAnchor="middle"
          fontFamily="Poppins,sans-serif" fontWeight="900"
          fill="url(#il-g)" opacity="0.92">
          <tspan fontSize="140" letterSpacing="-2">{dist}</tspan>
          <tspan fontSize="50" letterSpacing="4" dx="16">KM</tspan>
        </text>
      ) : (
        <text x="320" y={distY} fontFamily="Poppins,sans-serif" fontSize={distFs} fontWeight="900"
          fill="url(#il-g)" opacity="0.92" letterSpacing="-2" textAnchor="middle">{dist}</text>
      )}
      {!kmInline && km && <text x="320" y={kmY} fontFamily="Poppins,sans-serif" fontSize={km === 'KM' ? 44 : 36} fontWeight="900"
        fill="url(#il-g)" opacity="0.80" letterSpacing={km === 'KM' ? '8' : '4'} textAnchor="middle">{km}</text>}
      <text x="320" dx="3" y={kmInline ? '232' : semsY} fontFamily="Poppins,sans-serif" fontSize="15" fontWeight="700"
        fill="rgba(255,255,255,.35)" letterSpacing="6" textAnchor="middle">{weeksLabel} SEMAINES</text>
      <rect x="278" y={kmInline ? '241' : lineY} width="88" height="1.5" rx="1" fill="url(#il-g)" opacity="0.35" />

      {price && (
        <>
          <rect x="496" y="12" width="132" height="24" rx="12" fill="url(#il-g)" opacity="0.88" />
          <text x="562" y="28" fontFamily="Poppins,sans-serif" fontSize="10.5" fontWeight="800"
            fill="white" textAnchor="middle">{price}</text>
        </>
      )}

      <circle cx="58" cy="38" r="1.2" fill="white" opacity="0.14" />
      <circle cx="142" cy="24" r="1.8" fill="white" opacity="0.12" />
      <circle cx="498" cy="48" r="1.4" fill="white" opacity="0.16" />
      <circle cx="82" cy="210" r="1" fill="white" opacity="0.13" />
      <circle cx="228" cy="228" r="1.5" fill="white" opacity="0.12" />
      <circle cx="558" cy="220" r="1.2" fill="white" opacity="0.16" />
      <circle cx="600" cy="85" r="1.6" fill="white" opacity="0.13" />
      <circle cx="44" cy="185" r="1" fill="white" opacity="0.12" />
      <circle cx="186" cy="52" r="1.4" fill="#C084FC" opacity="0.22" />
      <circle cx="454" cy="198" r="1.2" fill="#F472B6" opacity="0.20" />
    </svg>
  )
}

function Illustration10km({ price }) {
  return <IllustrationRunning dist="10" kmInline weeksLabel="8" price={price} />
}

function IllustrationAntiBlessure({ price }) {
  return (
    <svg viewBox="0 0 640 260" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
      <defs>
        <linearGradient id="il-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1A0A2E" /><stop offset="100%" stopColor="#2D0B4E" />
        </linearGradient>
        <linearGradient id="il-g" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8B2FC9" /><stop offset="100%" stopColor="#E8237A" />
        </linearGradient>
        <radialGradient id="il-gl2" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#8B2FC9" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#8B2FC9" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="640" height="260" fill="url(#il-bg)" />
      <rect width="640" height="260" fill="url(#il-gl2)" />
      <path d="M 320,18 L 470,55 L 470,145 C 470,195 320,232 320,232 C 320,232 170,195 170,145 L 170,55 Z"
        fill="none" stroke="url(#il-g)" strokeWidth="1.5" opacity="0.22" />
      <path d="M 320,30 L 455,62 L 455,142 C 455,186 320,220 320,220 C 320,220 185,186 185,142 L 185,62 Z"
        fill="rgba(139,47,201,.06)" />
      <text x="320" y="104" fontFamily="Poppins,sans-serif" fontSize="28" fontWeight="700"
        fill="rgba(255,255,255,.45)" letterSpacing="12" textAnchor="middle">ANTI</text>
      <text x="320" y="155" fontFamily="Poppins,sans-serif" fontSize="50" fontWeight="900"
        fill="url(#il-g)" opacity="0.88" letterSpacing="-1" textAnchor="middle">BLESSURE</text>
      <text x="320" y="178" fontFamily="Poppins,sans-serif" fontSize="10" fontWeight="700"
        fill="rgba(255,255,255,.32)" letterSpacing="3" textAnchor="middle">COURIR DURABLEMENT</text>
      {price && (
        <>
          <rect x="496" y="12" width="132" height="24" rx="12" fill="url(#il-g)" opacity="0.88" />
          <text x="562" y="28" fontFamily="Poppins,sans-serif" fontSize="10.5" fontWeight="800"
            fill="white" textAnchor="middle">{price}</text>
        </>
      )}
      <circle cx="95" cy="45" r="1.5" fill="white" opacity="0.14" />
      <circle cx="545" cy="38" r="1.8" fill="#C084FC" opacity="0.20" />
      <circle cx="560" cy="210" r="1.2" fill="white" opacity="0.12" />
      <circle cx="80" cy="195" r="1" fill="white" opacity="0.13" />
      <circle cx="480" cy="85" r="1.4" fill="#F472B6" opacity="0.18" />
    </svg>
  )
}

// ─── Illustration générique (autres ebooks) ───────────────────────────────────
function IllustrationGeneric({ icon, title }) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0,
      background: 'linear-gradient(135deg,#1A0A2E,#2D0B4E)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: grad, opacity: .18 }} />
      <div style={{ fontSize: '3.5rem', position: 'relative', marginBottom: '.5rem' }}>{icon}</div>
      <div style={{ position: 'relative', fontSize: '1rem', fontWeight: 800, color: 'rgba(255,255,255,.8)' }}>{title}</div>
    </div>
  )
}

// ─── Aperçu flouté ────────────────────────────────────────────────────────────
const PREVIEW_DATA = {
  '10km-8sem': {
    header: '10 KM · 8 SEMAINES', allureeLabel: 'Allure objectif 10km : XX:XX min/km',
    weekLabel: 'Semaine 6 / 8 · 6 séances', phase: 'INTENSIFICATION',
    phaseDesc: 'Dernière semaine de charge maximale. Tu atteins le pic de ta préparation.',
    sessions: [
      { day: 'LUN', type: 'Footing EF', color: '#22C55E', dur: '40 min',
        lines: ['40 min très faciles. Sortie légère avant les deux séances clés.', 'RPE 3/10'] },
      { day: 'MAR', type: '3 × 10 min au seuil', color: '#F97316', dur: '70 min',
        lines: ['Échauffement 25 min EF progressif.', '3 × 10 min à allure seuil, 3 min récup entre chaque.', 'RPE 8-9/10 · 30 min totales au seuil.'] },
      { day: 'MER', type: 'Footing EF', color: '#22C55E', dur: '30 min',
        lines: ['30 min très faciles. Sortie de récupération volontairement courte.', 'RPE 3/10'] },
      { day: 'JEU', type: '4 × 2 km à allure objectif', color: '#8B2FC9', dur: '70 min',
        lines: ['Échauffement 25 min EF.', '4 × 2 km à ton allure objectif 10km. Récupération 90 sec.', 'RPE 8/10 · La séance la plus course-spécifique du plan.'] },
      { day: 'SAM', type: 'Footing de récupération', color: '#22C55E', dur: '45 min',
        lines: ['45 min très faciles. Aussi important que les séances intenses.', 'RPE 3/10'] },
      { day: 'DIM', type: 'Sortie longue', color: '#06B6D4', dur: '85 min',
        lines: ['85 min à allure EF. Ta dernière vraie sortie longue avant la course.', 'RPE 6/10'] },
    ],
  },
  '10km-12sem': {
    header: '10 KM · 12 SEMAINES', allureeLabel: 'Allure objectif 10km : XX:XX min/km',
    weekLabel: 'Semaine 8 / 12 · 5 séances', phase: 'DÉVELOPPEMENT VMA',
    phaseDesc: 'Montée en puissance. Le volume atteint son pic et la VMA est sollicitée.',
    sessions: [
      { day: 'MAR', type: 'Footing EF', color: '#22C55E', dur: '45 min',
        lines: ['45 min à allure fondamentale. Volume de base avant les séances de qualité.', 'RPE 4-5/10'] },
      { day: 'MER', type: '5 × 1000 m au seuil', color: '#F97316', dur: '65 min',
        lines: ['Échauffement 25 min EF.', '5 × 1000m à ton allure seuil. Récupération 2 min au trot.', 'RPE 7-8/10'] },
      { day: 'VEN', type: '12 × 400 m VMA', color: '#EF4444', dur: '65 min',
        lines: ['Échauffement 25 min progressif.', '12 × 400m à allure VMA. Récupération 90 sec au trot.', 'RPE 9/10 · La séance qui fait le plus progresser.'] },
      { day: 'SAM', type: 'Footing de récupération', color: '#22C55E', dur: '40 min',
        lines: ['40 min très faciles. Active la circulation avant la sortie longue.', 'RPE 3/10'] },
      { day: 'DIM', type: 'Sortie longue', color: '#06B6D4', dur: '90 min',
        lines: ['85 min à allure EF, puis 5 min à ton allure objectif 10km.', 'RPE 6/10'] },
    ],
  },
  'semi-12sem': {
    header: '21,1 KM · 12 SEMAINES', allureeLabel: 'Allure objectif semi : XX:XX min/km',
    weekLabel: 'Semaine 9 / 12 · 5 séances', phase: 'SPÉCIFICITÉ SEMI',
    phaseDesc: 'Les séances s\'alignent sur ton allure de course. Le jour J se rapproche.',
    sessions: [
      { day: 'LUN', type: 'Footing EF', color: '#22C55E', dur: '45 min',
        lines: ['45 min à allure fondamentale. Récupération active après la semaine chargée.', 'RPE 4/10'] },
      { day: 'MAR', type: '2 × 15 min au seuil lactique', color: '#F97316', dur: '70 min',
        lines: ['Échauffement 25 min progressif.', '2 × 15 min à ton allure seuil, 3 min de récupération.', 'RPE 8/10'] },
      { day: 'JEU', type: '4 × 2 km à allure semi', color: '#8B2FC9', dur: '75 min',
        lines: ['Échauffement 25 min EF.', '4 × 2 km à ton allure objectif semi-marathon. Récup 90 sec.', 'RPE 7-8/10 · La séance la plus spécifique du plan.'] },
      { day: 'SAM', type: 'Footing EF', color: '#22C55E', dur: '35 min',
        lines: ['35 min très faciles. Prépare la sortie longue du lendemain.', 'RPE 3/10'] },
      { day: 'DIM', type: 'Sortie longue 22 km', color: '#06B6D4', dur: '120 min',
        lines: ['22 km à allure endurance fondamentale. Le long run le plus important du plan.', 'RPE 6/10 · Ravitaille-toi à mi-course.'] },
    ],
  },
  'marathon-12sem': {
    header: '42,195 KM · 12 SEMAINES', allureeLabel: 'Allure objectif marathon : XX:XX min/km',
    weekLabel: 'Semaine 9 / 12 · 5 séances', phase: 'ALLURE MARATHON',
    phaseDesc: 'L\'allure objectif est au cœur de chaque séance. Les long runs atteignent leur pic.',
    sessions: [
      { day: 'LUN', type: 'Footing EF', color: '#22C55E', dur: '50 min',
        lines: ['50 min à allure fondamentale. Récupération après le week-end chargé.', 'RPE 4/10'] },
      { day: 'MER', type: '3 × 12 min au seuil', color: '#F97316', dur: '75 min',
        lines: ['Échauffement 25 min progressif.', '3 × 12 min à ton allure seuil, 3 min de récupération.', 'RPE 8-9/10'] },
      { day: 'VEN', type: '5 × 2 km à allure marathon', color: '#8B2FC9', dur: '85 min',
        lines: ['Échauffement 25 min EF.', '5 × 2 km exactement à ton allure objectif marathon. Récup 90 sec.', 'RPE 8/10 · Mémorise cette sensation, c\'est celle du jour J.'] },
      { day: 'SAM', type: 'Footing de récupération', color: '#22C55E', dur: '40 min',
        lines: ['40 min faciles. Récupération active avant le long run du dimanche.', 'RPE 3/10'] },
      { day: 'DIM', type: 'Sortie longue 30 km', color: '#06B6D4', dur: '160 min',
        lines: ['28 km à allure EF, puis 2 km à ton allure objectif marathon.', 'RPE 6/10 · Le long run le plus long du plan.'] },
    ],
  },
  'marathon-16sem': {
    header: '42,195 KM · 16 SEMAINES', allureeLabel: 'Allure objectif marathon : XX:XX min/km',
    weekLabel: 'Semaine 11 / 16 · 5 séances', phase: 'DÉVELOPPEMENT MARATHON',
    phaseDesc: 'Le volume atteint son pic. Les sorties longues dépassent les 30 km.',
    sessions: [
      { day: 'LUN', type: 'Footing EF', color: '#22C55E', dur: '50 min',
        lines: ['50 min à allure fondamentale. Base aérobie de la semaine.', 'RPE 4/10'] },
      { day: 'MAR', type: '2 × 20 min au seuil', color: '#F97316', dur: '80 min',
        lines: ['Échauffement 25 min.', '2 × 20 min à ton allure seuil, 4 min de récupération.', 'RPE 8/10 · 40 min totales au seuil, ta charge la plus élevée.'] },
      { day: 'JEU', type: '5 × 1500 m à allure marathon', color: '#8B2FC9', dur: '80 min',
        lines: ['Échauffement 25 min EF.', '5 × 1500m à ton allure objectif marathon. Récupération 2 min.', 'RPE 7-8/10'] },
      { day: 'SAM', type: 'Footing EF', color: '#22C55E', dur: '45 min',
        lines: ['45 min faciles. Prépare le long run du lendemain.', 'RPE 3/10'] },
      { day: 'DIM', type: 'Sortie longue 32 km', color: '#06B6D4', dur: '175 min',
        lines: ['30 km à allure EF, puis 2 km à ton allure objectif marathon.', 'RPE 6/10 · Ravitaille-toi toutes les 45 min.'] },
    ],
  },
}

function BlurredPreview({ slug }) {
  const data = PREVIEW_DATA[slug]
  if (!data) return null
  const { header, allureeLabel, weekLabel, phase, phaseDesc, sessions } = data

  return (
    <div>
      <h3 style={{ margin: '0 0 .75rem', fontSize: '.95rem', fontWeight: 800 }}>
        Aperçu du plan
      </h3>
      <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden',
        border: '1px solid rgba(255,255,255,.1)',
        boxShadow: '0 4px 30px rgba(0,0,0,.5)' }}>

        {/* Contenu flouté */}
        <div style={{ filter: 'blur(3px)', userSelect: 'none', background: '#0E0B1E', padding: '1.25rem 1.5rem' }}>

          {/* En-tête */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderBottom: '1px solid rgba(255,255,255,.1)', paddingBottom: '.65rem', marginBottom: '.85rem' }}>
            <div>
              <div style={{ fontSize: '.45rem', color: 'rgba(255,255,255,.3)', letterSpacing: '3px',
                textTransform: 'uppercase', marginBottom: '.1rem' }}>The Ultimate Academy</div>
              <div style={{ fontSize: '.85rem', fontWeight: 900,
                background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {header}
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '.48rem', color: 'rgba(255,255,255,.28)', lineHeight: 1.7 }}>
              <div>VMA : XX,X km/h</div>
              <div>Allure EF : XX:XX min/km</div>
              <div>{allureeLabel}</div>
            </div>
          </div>

          {/* Semaine */}
          <div style={{ marginBottom: '.75rem' }}>
            <div style={{ fontSize: '.42rem', color: 'rgba(255,255,255,.38)', textTransform: 'uppercase',
              letterSpacing: '2.5px', marginBottom: '.2rem' }}>{weekLabel}</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 900, marginBottom: '.3rem',
              background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {phase}
            </div>
            <div style={{ fontSize: '.6rem', color: 'rgba(255,255,255,.45)', lineHeight: 1.55 }}>
              {phaseDesc}
            </div>
          </div>

          {/* Séances */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.45rem' }}>
            {sessions.map((s, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2.8rem 1fr auto',
                gap: '.6rem', alignItems: 'start',
                background: `${s.color}0D`, border: `1px solid ${s.color}22`,
                borderRadius: 8, padding: '.5rem .7rem' }}>
                <div>
                  <div style={{ fontSize: '.62rem', fontWeight: 800, color: 'rgba(255,255,255,.5)' }}>{s.day}</div>
                </div>
                <div>
                  <div style={{ fontSize: '.68rem', fontWeight: 800, color: s.color, marginBottom: '.2rem' }}>{s.type}</div>
                  {s.lines.map((l, j) => (
                    <div key={j} style={{ fontSize: '.55rem', color: 'rgba(255,255,255,.45)', lineHeight: 1.55 }}>{l}</div>
                  ))}
                </div>
                <div style={{ fontSize: '.55rem', color: 'rgba(255,255,255,.3)', whiteSpace: 'nowrap' }}>{s.dur}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(to bottom, transparent 40%, rgba(12,10,24,.65) 65%, rgba(12,10,24,.97) 100%)' }} />

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1rem 1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.42)' }}>
            🔒 Allures personnalisées déverrouillées après achat
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function EbookDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [ebook,   setEbook]   = useState(null)
  const [email,   setEmail]   = useState('')
  const [vma,     setVma]     = useState('')
  const [seances, setSeances] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paying,  setPaying]  = useState(false)
  const [error,   setError]   = useState(null)

  const meta = EBOOK_DETAILS[slug] || {}
  const priceTiers = VARIANT_PRICE_TIERS[slug]
  const isVariant  = !!priceTiers

  const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

  useEffect(() => {
    fetch(`${API}/api/ebooks/${slug}`)
      .then(r => r.ok ? r.json() : Promise.reject('not found'))
      .then(d => setEbook(d.ebook))
      .catch(() => navigate('/ebooks'))
      .finally(() => setLoading(false))
  }, [slug])

  const minCents = isVariant ? Math.min(...Object.values(priceTiers)) : null
  const displayPriceCents = isVariant
    ? (seances ? priceTiers[seances] : minCents)
    : ebook?.price_cents

  const canCheckout = email.trim() && ebook && (!isVariant || (isValidVma(vma) && seances))

  async function handleCheckout(e) {
    e.preventDefault()
    if (!canCheckout) return
    setPaying(true)
    setError(null)
    try {
      const res = await fetch(`${API}/api/ebooks/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ebook_id: ebook.id, email: email.trim(), slug,
          ...(isVariant ? { vma: Number(vma), seances } : {}),
        }),
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

  const forWhoIsArray = Array.isArray(meta.for_who)

  const priceStr = `À partir de ${((minCents || ebook.price_cents) / 100).toFixed(2).replace('.', ',')} €`
  const RUNNING_ILL_CFG = {
    '10km-12sem':     { dist: '10',       kmInline: true,  weeksLabel: '12' },
    'semi-12sem':     { dist: 'SEMI-MARATHON', kmText: '', weeksLabel: '12' },
    'marathon-12sem': { dist: 'MARATHON', kmText: '',      weeksLabel: '12' },
    'marathon-16sem': { dist: 'MARATHON', kmText: '',      weeksLabel: '16' },
  }
  const slugIllustration = slug === '10km-8sem' ? <Illustration10km price={priceStr} />
    : RUNNING_ILL_CFG[slug] ? <IllustrationRunning {...RUNNING_ILL_CFG[slug]} price={priceStr} />
    : slug === 'anti-blessure' ? <IllustrationAntiBlessure price={priceStr} />
    : null

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: '#fff', fontFamily: 'inherit' }}>
      <Nav />
      <div style={{ maxWidth: 940, margin: '0 auto', padding: '5rem 1.5rem 5rem' }}>
        <Link to="/ebooks" style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem',
          color: 'rgba(255,255,255,.5)', textDecoration: 'none', fontSize: '.85rem',
          marginBottom: '2rem', fontWeight: 500 }}>
          ← Tous les plans
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,340px)', gap: '2.5rem', alignItems: 'start' }}>

          {/* ── Colonne gauche ── */}
          <div>
            {/* Illustration */}
            <div style={{ height: 260, borderRadius: 20, overflow: 'hidden', position: 'relative', marginBottom: '1.5rem' }}>
              {slugIllustration ?? (ebook.cover_image
                ? <img src={ebook.cover_image} alt={ebook.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <IllustrationGeneric icon={meta.icon || '📋'} title={ebook.title} />
              )}
            </div>

            {/* Chips */}
            <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
              {meta.weeks && <Chip color={C.purple}>{meta.weeks} semaines</Chip>}
              {meta.distance && <Chip color={C.pink}>{meta.distance}</Chip>}
              {meta.level && <Chip color="#10B981">{meta.level}</Chip>}
              <Chip color="#F59E0B">📬 PDF par email</Chip>
            </div>

            <h1 style={{ fontSize: 'clamp(1.4rem,4vw,2rem)', fontWeight: 900, margin: '0 0 1rem', lineHeight: 1.2 }}>
              {ebook.title}
            </h1>
            <p style={{ color: 'rgba(255,255,255,.7)', lineHeight: 1.8, marginBottom: '1.75rem', textAlign: 'justify' }}>
              {slug === '10km-8sem' ? (
                <>
                  Un plan complet de 8 semaines pour préparer ta prochaine course de 10 km. Chaque séance est{' '}
                  <strong style={{ fontWeight: 800, background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>calculée depuis ta VMA réelle</strong>
                  {' '}: tu cours aux bonnes allures, au bon moment, sans jamais avoir à convertir des pourcentages.
                </>
              ) : slug === '10km-12sem' ? (
                <>
                  La version longue et progressive pour préparer un 10km en 12 semaines. Plus de temps pour{' '}
                  <strong style={{ fontWeight: 800, background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>construire ta base aérobie, développer ta VMA et arriver en pleine forme</strong>
                  {' '}le jour J.
                </>
              ) : slug === 'semi-12sem' ? (
                <>
                  Prépare ton semi-marathon en 12 semaines avec un plan structuré alliant{' '}
                  <strong style={{ fontWeight: 800, background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>volume progressif, séances de qualité et allures personnalisées selon ta VMA</strong>
                  {' '}pour arriver le jour J prêt à performer.
                </>
              ) : (meta.full_description || ebook.description)}
            </p>

            {/* Pour qui */}
            {meta.for_who && (
              <div style={{ background: 'rgba(16,185,129,.07)', border: '1px solid rgba(16,185,129,.2)',
                borderRadius: 16, padding: '1.25rem 1.5rem', marginBottom: '1.75rem' }}>
                <div style={{ fontSize: '.72rem', fontWeight: 800, color: '#10B981',
                  textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.75rem' }}>
                  Pour qui est ce plan ?
                </div>
                {forWhoIsArray ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                    {meta.for_who.map((item, i) => (
                      <div key={i} style={{ display: 'flex', gap: '.65rem', alignItems: 'flex-start' }}>
                        <span style={{ color: '#10B981', fontWeight: 800, fontSize: '1rem', lineHeight: 1.4, flexShrink: 0 }}>✓</span>
                        <span style={{ fontSize: '.88rem', color: 'rgba(255,255,255,.8)', lineHeight: 1.55, display: 'block', textAlign: 'justify' }}>{item.text}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: '.9rem', color: 'rgba(255,255,255,.75)', lineHeight: 1.6 }}>{meta.for_who}</p>
                )}
              </div>
            )}

            {/* Contenu du plan */}
            {meta.toc && (
              <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
                borderRadius: 20, padding: '1.5rem', marginBottom: '1.75rem' }}>
                <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 800 }}>📋 Contenu du plan</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
                  {meta.toc.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-start' }}>
                      <span style={{ width: 22, height: 22, borderRadius: '50%', background: grad,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '.62rem', fontWeight: 800, flexShrink: 0, marginTop: '.1rem' }}>{i + 1}</span>
                      <span style={{ fontSize: '.875rem', color: 'rgba(255,255,255,.8)', lineHeight: 1.55 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* ── Colonne droite — achat (sticky) ── */}
          <div style={{ position: 'sticky', top: '1.5rem' }}>
            <div id="buy-form" style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)',
              borderRadius: 24, padding: '1.75rem' }}>

              {/* Prix */}
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'rgba(255,255,255,.4)',
                  textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.3rem' }}>
                  {isVariant && !seances ? 'À partir de' : 'Prix'}
                </div>
                <div style={{ fontSize: '2.6rem', fontWeight: 900,
                  background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  {((displayPriceCents || minCents || ebook.price_cents) / 100).toFixed(2).replace('.', ',')}€
                </div>
                <div style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.38)', marginTop: '.2rem' }}>
                  Paiement unique · accès à vie
                </div>
              </div>

              <form onSubmit={handleCheckout}>
                {isVariant && (
                  <>
                    {/* VMA */}
                    <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700,
                      color: 'rgba(255,255,255,.55)', marginBottom: '.4rem', letterSpacing: '.03em' }}>
                      Ta VMA (km/h) *
                    </label>
                    <select
                      required value={vma} onChange={e => setVma(e.target.value)}
                      style={{ width: '100%', padding: '.75rem 1rem', borderRadius: 12,
                        border: `1.5px solid ${vma ? 'rgba(139,47,201,.5)' : 'rgba(255,255,255,.12)'}`,
                        background: 'rgba(255,255,255,.07)', color: vma ? '#fff' : 'rgba(255,255,255,.35)',
                        fontSize: '.95rem', fontFamily: 'inherit', marginBottom: '.4rem',
                        boxSizing: 'border-box', cursor: 'pointer', appearance: 'none',
                        WebkitAppearance: 'none', outline: 'none' }}>
                      <option value="" disabled>Sélectionne ta VMA…</option>
                      {VMA_OPTIONS.map(v => (
                        <option key={v} value={v} style={{ background: '#1A0A2E', color: '#fff' }}>
                          {v} km/h
                        </option>
                      ))}
                    </select>
                    <div style={{ marginBottom: '1rem' }}>
                      <Link to="/calculateur/vma"
                        style={{ color: '#C084FC', fontSize: '.78rem', fontWeight: 600, textDecoration: 'none' }}>
                        Tu ne connais pas ta VMA ? Calcule-la ici →
                      </Link>
                    </div>

                    {/* Séances */}
                    <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700,
                      color: 'rgba(255,255,255,.55)', marginBottom: '.5rem', letterSpacing: '.03em' }}>
                      Séances par semaine *
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '.5rem', marginBottom: '1rem' }}>
                      {Object.keys(priceTiers).map(Number).sort((a, b) => a - b).map(n => (
                        <button key={n} type="button" onClick={() => setSeances(n)}
                          style={{ padding: '.65rem .3rem', borderRadius: 12, cursor: 'pointer',
                            fontFamily: 'inherit', transition: 'all .15s',
                            border: seances === n ? `1.5px solid ${C.purple}` : '1.5px solid rgba(255,255,255,.12)',
                            background: seances === n ? 'rgba(139,47,201,.22)' : 'rgba(255,255,255,.06)',
                            color: seances === n ? '#fff' : 'rgba(255,255,255,.65)' }}>
                          <div style={{ fontWeight: 900, fontSize: '1.05rem' }}>{n}</div>
                          <div style={{ fontSize: '.65rem', marginTop: '.15rem', opacity: .75 }}>
                            {(priceTiers[n] / 100).toFixed(2).replace('.', ',')}€
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* Email */}
                <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700,
                  color: 'rgba(255,255,255,.55)', marginBottom: '.4rem', letterSpacing: '.03em' }}>
                  Ton adresse email *
                </label>
                <input
                  type="email" required placeholder="prenom@email.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                  style={{ width: '100%', padding: '.75rem 1rem', borderRadius: 12,
                    border: '1.5px solid rgba(255,255,255,.12)',
                    background: 'rgba(255,255,255,.07)', color: '#fff',
                    fontSize: '.95rem', fontFamily: 'inherit',
                    marginBottom: '.75rem', boxSizing: 'border-box', outline: 'none' }}
                />

                {error && <p style={{ color: '#F87171', fontSize: '.8rem', margin: '-.25rem 0 .75rem' }}>{error}</p>}

                <button type="submit" disabled={!canCheckout || paying}
                  style={{ width: '100%', padding: '.9rem', borderRadius: 99, border: 'none',
                    background: (!canCheckout || paying) ? 'rgba(255,255,255,.08)' : grad,
                    color: (!canCheckout || paying) ? 'rgba(255,255,255,.3)' : '#fff',
                    fontWeight: 800, fontSize: '1rem', cursor: (!canCheckout || paying) ? 'default' : 'pointer',
                    fontFamily: 'inherit',
                    boxShadow: (!canCheckout || paying) ? 'none' : '0 8px 28px rgba(232,35,122,.4)',
                    transition: 'all .2s' }}>
                  {paying ? '⏳ Redirection…' : 'Obtenir mon plan →'}
                </button>
              </form>

              {/* Trust badges */}
              <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '.45rem' }}>
                {['🔒 Paiement sécurisé Stripe', '📬 PDF reçu instantanément par email', '📱 Compatible mobile, tablette, ordinateur'].map(t => (
                  <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '.5rem',
                    fontSize: '.78rem', color: 'rgba(255,255,255,.4)' }}>
                    {t}
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ── Ligne 2 de la grille : aperçu flouté ── */}
          <BlurredPreview slug={slug} />
        </div>
      </div>
    </div>
  )
}

function Chip({ children, color }) {
  return (
    <span style={{ background: color + '18', border: `1px solid ${color}35`,
      borderRadius: 99, padding: '.22rem .7rem', fontSize: '.72rem', fontWeight: 700, color }}>
      {children}
    </span>
  )
}
