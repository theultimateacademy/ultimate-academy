#!/usr/bin/env node
/**
 * Plan Anouk — Triathlon L Dinard (dim 13 sept) + 10km (dim 18 oct)
 * VMA course : 13 km/h · Objectif 10km : sub-50 min (5'00/km)
 * Bloc 1 : semaines 1-5 (29 juin → fin juillet)
 *
 * Run  : node scripts/seed-plan-anouk.js
 * Test : node scripts/seed-plan-anouk.js --dry
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
const DRY = process.argv.includes('--dry')

// ── Allures VMA 13 (apostrophe, jamais deux-points) ─────────────────────────
const EF     = "6'25 – 7'06 /km"    // 65-72% VMA
const RA     = "7'06 – 7'41 /km"    // 60-65% VMA
const SE     = "5'15 – 5'37 /km"    // 82-88% VMA (seuil)
const SP     = "5'00 /km"            // 92% VMA — objectif sub-50
const FC200  = "4'12 – 4'37 /km"    // 100-110% VMA (200m)
const FC300  = "4'23 – 4'45 /km"    // 97-105% VMA (300m)
const FC400  = "4'37 – 4'52 /km"    // 95-100% VMA (400m)
const FC500  = "4'43 – 4'58 /km"    // 93-98% VMA (500m)
const FL1500 = "5'15 – 5'34 /km"    // 83-88% VMA (1500m)

const ECHAUFF = `25 min progressif à ${EF}, terminer par 4 lignes droites 80m en accélération progressive.`
const RETOUR  = `10 min très lent à ${RA}.`

// ── Allures combos ──────────────────────────────────────────────────────────
const aEF = [{ zone: 'Footing EF', allure_min_km: EF, pourcentage_vma: 68 }]
const aSL = [{ zone: 'Sortie longue', allure_min_km: EF, pourcentage_vma: 68 }]
const aCO = [
  { zone: 'Échauffement',  allure_min_km: EF,             pourcentage_vma: 68 },
  { zone: 'Côtes',         allure_min_km: "Effort maximal", pourcentage_vma: 100 },
  { zone: 'Retour au calme', allure_min_km: RA,            pourcentage_vma: 62 },
]
const a300 = [
  { zone: 'Échauffement', allure_min_km: EF,    pourcentage_vma: 68 },
  { zone: '300m piste',   allure_min_km: FC300,  pourcentage_vma: 101 },
  { zone: 'Retour',       allure_min_km: RA,     pourcentage_vma: 62 },
]
const a500 = [
  { zone: 'Échauffement', allure_min_km: EF,   pourcentage_vma: 68 },
  { zone: '500m piste',   allure_min_km: FC500, pourcentage_vma: 95 },
  { zone: 'Retour',       allure_min_km: RA,    pourcentage_vma: 62 },
]
const a1500 = [
  { zone: 'Échauffement', allure_min_km: EF,     pourcentage_vma: 68 },
  { zone: '1500m piste',  allure_min_km: FL1500,  pourcentage_vma: 85 },
  { zone: 'Retour',       allure_min_km: RA,      pourcentage_vma: 62 },
]
const aPyramide = [
  { zone: 'Échauffement',  allure_min_km: EF,    pourcentage_vma: 68 },
  { zone: '200m (sprint)', allure_min_km: FC200,  pourcentage_vma: 105 },
  { zone: '500m (base)',   allure_min_km: FC500,  pourcentage_vma: 95 },
  { zone: 'Retour',        allure_min_km: RA,     pourcentage_vma: 62 },
]
const aSE = [
  { zone: 'Échauffement', allure_min_km: EF, pourcentage_vma: 68 },
  { zone: 'Seuil',        allure_min_km: SE,  pourcentage_vma: 85 },
  { zone: 'Retour',       allure_min_km: RA,  pourcentage_vma: 62 },
]
const aSP10 = [
  { zone: 'Échauffement', allure_min_km: EF, pourcentage_vma: 68 },
  { zone: 'Allure 10km',  allure_min_km: SP,  pourcentage_vma: 92 },
  { zone: 'Retour',       allure_min_km: RA,  pourcentage_vma: 62 },
]
const aFP = [
  { zone: 'Phase 1', allure_min_km: "6'35 – 7'06 /km", pourcentage_vma: 66 },
  { zone: 'Phase 2', allure_min_km: "6'09 – 6'35 /km", pourcentage_vma: 72 },
  { zone: 'Phase 3', allure_min_km: "5'08 – 5'37 /km", pourcentage_vma: 84 },
]

// ── Factories running ────────────────────────────────────────────────────────
const ef = (jour, min) => ({
  jour, type: 'Endurance Fondamentale', titre: `Footing EF ${min} min`,
  duree_min: min, id_seance: min <= 45 ? 'EF-02' : 'EF-03', allures: aEF,
  echauffement: null,
  corps: `${min} min à ${EF}. Allure très facile, respiration nasale possible. Tu dois pouvoir parler sans être essoufflée.`,
  retour_au_calme: null,
  notes_coach: "L'EF c'est le socle. Sois patiente, la progression se fait en profondeur. Jamais trop vite sur ce type de séance.",
})

const fp = (jour) => ({
  jour, type: 'Footing Progressif', titre: 'Footing progressif 45 min',
  duree_min: 65, id_seance: 'FP-01', allures: aFP,
  echauffement: `10 min très lent à ${RA}.`,
  corps: `BLOC Phase 1 — Lent
• 15 min à 6'35 – 7'06 /km — allure très facile, tu t'installes

BLOC Phase 2 — Développement
• 15 min à 6'09 – 6'35 /km — tu accélères progressivement

BLOC Phase 3 — Soutenu
• 15 min à 5'08 – 5'37 /km — travail proche du seuil, tiens l'allure`,
  retour_au_calme: `10 min très lent à ${RA}.`,
  notes_coach: "Le progressif t'apprend à gérer l'allure. Chaque phase doit être plus rapide que la précédente. Ne triche pas sur la phase 1.",
})

const sl = (jour, min, corps_extra) => ({
  jour, type: 'Sortie Longue', titre: `Sortie longue ${min} min${corps_extra ? ' — blocs inclus' : ''}`,
  duree_min: min, id_seance: min <= 80 ? 'SL-02' : 'SL-03',
  allures: corps_extra
    ? [{ zone: 'EF', allure_min_km: EF, pourcentage_vma: 68 }, { zone: 'Seuil', allure_min_km: SE, pourcentage_vma: 85 }]
    : aSL,
  echauffement: null,
  corps: corps_extra
    ? corps_extra
    : `${min} min à ${EF}. Effort régulier et constant, reste à l'aise tout au long.`,
  retour_au_calme: null,
  notes_coach: min >= 90
    ? "Prends un gel après 60 min. Gère l'allure sur la première heure pour finir forte. Hydrate-toi toutes les 20 min."
    : "Ta sortie longue de la semaine. Reste à l'aise, hydrate-toi. Pas de stress sur l'allure — la régularité compte.",
})

const co = (jour, reps, dist) => ({
  jour, type: 'Côtes', titre: `Séance côtes ${reps}×${dist}m`,
  duree_min: 60, id_seance: dist <= 80 ? 'CO-01' : 'CO-03', allures: aCO,
  echauffement: ECHAUFF,
  corps: `BLOC ${reps} × ${dist}m côte — Effort maximal
• ${Math.round(reps / 2)} × ${dist}m — monte dynamique, foulée ample, bras actifs
• Récupération : descente à pied (marche), complète avant de remonter
• ${reps - Math.round(reps / 2)} × ${dist}m — même intensité, garde la forme
• Récupération : descente à pied (marche)`,
  retour_au_calme: RETOUR,
  notes_coach: "Les côtes renforcent tes appuis et ta foulée. Attaque le sol, lève les genoux. La récupération en descente est obligatoire — pas de demi-récup.",
})

const fc300 = (jour, n) => ({
  jour, type: 'Fractionné Court', titre: `${n}×300m — Piste`,
  duree_min: 60, id_seance: 'FC-03', allures: a300,
  echauffement: ECHAUFF,
  corps: `BLOC ${n} × 300m — Piste
• ${n} × 300m à ${FC300}
• Récupération : 1'00 marche entre chaque répétition`,
  retour_au_calme: RETOUR,
  notes_coach: "Séance de vitesse sur piste. Pars conservateur sur les 4 premières, accélère sur les 4 dernières si tu te sens bien. Ne pars jamais trop vite.",
})

const fc500 = (jour, n) => ({
  jour, type: 'Fractionné Court', titre: `${n}×500m — Piste`,
  duree_min: 65, id_seance: 'FC-04', allures: a500,
  echauffement: ECHAUFF,
  corps: `BLOC ${n} × 500m — Piste
• ${n} × 500m à ${FC500}
• Récupération : 1'30 marche entre chaque répétition`,
  retour_au_calme: RETOUR,
  notes_coach: "Le 500m c'est la distance charnière entre vitesse et résistance. Régulière sur les premières, et si la dernière est la plus rapide, tu as bien géré.",
})

const fl1500 = (jour, n) => ({
  jour, type: 'Fractionné Long', titre: `${n}×1500m — Piste`,
  duree_min: 65, id_seance: 'FL-11', allures: a1500,
  echauffement: ECHAUFF,
  corps: `BLOC ${n} × 1500m — Piste
• ${n} × 1500m à ${FL1500}
• Récupération : 2'30 trot lent entre chaque répétition`,
  retour_au_calme: RETOUR,
  notes_coach: "Régularité absolue sur les répétitions. Si tu accélères sur la dernière, parfait. Si la dernière s'effondre, l'allure était trop rapide — ça viendra.",
})

const pyramide = (jour) => ({
  jour, type: 'Fractionné Court', titre: 'Pyramide — 200-300-400-500-400-300-200m',
  duree_min: 65, id_seance: 'FC-04', allures: aPyramide,
  echauffement: ECHAUFF,
  corps: `BLOC Pyramide — 7 distances (montée + descente)
• 200m à ${FC200}
• Récupération 1'30 (marche)
• 300m à ${FC300}
• Récupération 1'30 (marche)
• 400m à ${FC400}
• Récupération 1'30 (marche)
• 500m à ${FC500} — sommet de la pyramide
• Récupération 1'30 (marche)
• 400m à ${FC400}
• Récupération 1'30 (marche)
• 300m à ${FC300}
• Récupération 1'30 (marche)
• 200m à ${FC200} — sprint final !`,
  retour_au_calme: RETOUR,
  notes_coach: "Les 200m sont les plus rapides, le 500m le plus lent. Les allures augmentent avec la distance. La pyramide change le rythme en permanence — excellent pour l'adaptabilité.",
})

const tempo = (jour, variant) => {
  const v = {
    '2x15': {
      titre: 'Tempo 2×15 min',
      duree_min: 70,
      id: 'T-02',
      corps: `BLOC 2 × 15 min Seuil
• 15 min à ${SE} — effort contrôlé, tu dois pouvoir prononcer des mots
• Récupération : 4 min trot lent
• 15 min à ${SE} — même allure que le premier bloc, régularité`,
    },
    '3x10': {
      titre: 'Tempo 3×10 min',
      duree_min: 65,
      id: 'T-01',
      corps: `BLOC 3 × 10 min Seuil
• 10 min à ${SE} — installe-toi dans l'effort
• Récupération : 3 min trot lent
• 10 min à ${SE} — garde le même rythme
• Récupération : 3 min trot lent
• 10 min à ${SE} — donne tout sur le dernier bloc`,
    },
  }[variant]
  return {
    jour, type: 'Tempo / Seuil', titre: v.titre, duree_min: v.duree_min, id_seance: v.id,
    allures: aSE,
    echauffement: ECHAUFF,
    corps: v.corps,
    retour_au_calme: RETOUR,
    notes_coach: "Deux bons blocs de seuil. Note si le 2ème est nettement plus lent — c'est le signe qu'il faut travailler l'endurance spécifique.",
  }
}

const sp10km = (jour, n) => ({
  jour, type: 'Spécifique', titre: `Blocs allure 10km — ${n}×2 km`,
  duree_min: n <= 3 ? 65 : 70, id_seance: 'SP-03', allures: aSP10,
  echauffement: ECHAUFF,
  corps: `BLOC ${n} × 2 km — Allure 10km objectif
• ${n} × 2 km à ${SP} (allure sub-50)
• Récupération : 2'30 trot lent à ${RA} entre chaque`,
  retour_au_calme: RETOUR,
  notes_coach: `Tu cours à l'allure de ta course. ${n} × 2 km à 5'00/km — si tu tiens le dernier, tu es prête le jour J. Grave cette sensation dans tes jambes.`,
})

// ── Natation (total ≤ 2000m par séance incluant échauffement + retour) ───────
const NAT = {
  'NAT-12': (j) => ({
    jour: j, type: 'Natation', titre: 'Natation — Technique & drills', duree_min: 40, id_seance: 'NAT-12', allures: [],
    echauffement: '200m très lent (technique).',
    corps: `BLOC Drills technique
• 4×50m catch-up drill — focus prise d'eau
• 4×50m finger tip drag — coude haut
• 4×50m one arm — roulis et équilibre
• 200m focus technique — intègre les drills`,
    retour_au_calme: '100m très lent.',
    notes_coach: "Séance technique pure — l'objectif est d'améliorer ton efficacité, pas ta vitesse. Chaque drill a un but précis.",
  }),

  'NAT-02': (j) => ({
    jour: j, type: 'Natation', titre: 'Natation — Endurance 1500m', duree_min: 40, id_seance: 'NAT-02', allures: [],
    echauffement: '200m échauffement libre.',
    corps: `BLOC 1500m continu — Endurance
• 1500m à 65-72% CSS — effort régulier et économique
• Trouve ton rythme dès les premiers 300m, ne pars pas trop vite`,
    retour_au_calme: '100m retour très lent.',
    notes_coach: "Volume proche de la distance course. Régularité et économie de nage — pas de sprint, reste aérobie tout du long.",
  }),

  'NAT-05': (j) => ({
    jour: j, type: 'Natation', titre: 'Natation — Seuil 5×200m', duree_min: 45, id_seance: 'NAT-05', allures: [],
    echauffement: '200m échauffement + 4×25m cadence.',
    corps: `BLOC 5 × 200m — Seuil
• 5 × 200m à 82-88% CSS
• Récupération : 30'' entre chaque série`,
    retour_au_calme: '100m retour.',
    notes_coach: "Régularité absolue sur les 5 répétitions. Si la 5ème est identique à la 1ère, tu as bien géré ton effort.",
  }),

  'NAT-06': (j) => ({
    jour: j, type: 'Natation', titre: 'Natation — 3×400m spécifique', duree_min: 45, id_seance: 'NAT-06', allures: [],
    echauffement: '200m échauffement + 100m drills.',
    corps: `BLOC 3 × 400m — Spécifique triathlon
• 3 × 400m à 80-87% CSS
• Récupération : 45'' entre chaque série`,
    retour_au_calme: '100m retour.',
    notes_coach: "La distance de travail la plus spécifique au 1900m. Régulière sur les 3 — si tu accélères sur la dernière, parfait.",
  }),

  'NAT-07': (j) => ({
    jour: j, type: 'Natation', titre: 'Natation — 2×700m tempo', duree_min: 45, id_seance: 'NAT-07', allures: [],
    echauffement: '200m échauffement.',
    corps: `BLOC 2 × 700m — Tempo
• 700m à 80-85% CSS — allure soutenue mais tenue
• Récupération : 1'00 entre les deux blocs
• 700m à 80-85% CSS — maintiens l'allure du premier`,
    retour_au_calme: '100m retour.',
    notes_coach: "Deux gros blocs de tempo. Le 2ème bloc est souvent plus dur mentalement que physiquement — tiens bon, le corps suit.",
  }),

  'NAT-04': (j) => ({
    jour: j, type: 'Natation', titre: 'Natation — Vitesse 8×100m', duree_min: 40, id_seance: 'NAT-04', allures: [],
    echauffement: '200m échauffement + 4×25m progressifs.',
    corps: `BLOC 8 × 100m — Vitesse
• 8 × 100m à 90-95% CSS
• Récupération : 20'' entre chaque`,
    retour_au_calme: '100m retour.',
    notes_coach: "Travail de vitesse pure. Maintiens l'allure sur les 8 répétitions — si les temps s'effondrent sur les dernières, allonge la récup à 30''.",
  }),

  'NAT-11': (j) => ({
    jour: j, type: 'Natation', titre: 'Natation — Simulation 1500m triathlon', duree_min: 45, id_seance: 'NAT-11', allures: [],
    echauffement: '200m échauffement.',
    corps: `BLOC Simulation 1500m — Allure compétition
• 1500m à allure compétition (75-83% CSS)
• Nage sans arrêt — mémorise la sensation`,
    retour_au_calme: '100m retour lent.',
    notes_coach: "C'est LA séance de référence pour Dinard. Mémorise cette sensation — énergie dépensée, respiration, rythme. Tu l'auras vécue avant la course.",
  }),
}

// ── Vélo ─────────────────────────────────────────────────────────────────────
const VEL = {
  'VEL-02': (j) => ({
    jour: j, type: 'Vélo', titre: 'Vélo — Endurance 1h30', duree_min: 90, id_seance: 'VEL-02', allures: [],
    echauffement: '10 min progressif.',
    corps: `BLOC Endurance — 1h10 Zone 2
• 1h10 à 60-65% FC max — allure conversationnelle
• Hydrate-toi toutes les 20 min`,
    retour_au_calme: '10 min retour progressif.',
    notes_coach: "Base aérobie vélo. Un gel à 45 min si tu le sens. Travaille ta position sur le vélo — dos plat, bras décontractés.",
  }),

  'VEL-05': (j) => ({
    jour: j, type: 'Vélo', titre: 'Vélo — Tempo 2×15 min', duree_min: 70, id_seance: 'VEL-05', allures: [],
    echauffement: '15 min progressif à 60% FC.',
    corps: `BLOC 2 × 15 min — Tempo vélo
• 15 min à 75-80% FC max — cadence 85-95 RPM
• Récupération : 5 min à 60% FC
• 15 min à 75-80% FC max — même intensité`,
    retour_au_calme: '10 min retour calme.',
    notes_coach: "Travail au seuil vélo. Cadence 85-95 RPM. Si tu pèses trop lourd, baisse la résistance et augmente la cadence.",
  }),

  'VEL-06': (j) => ({
    jour: j, type: 'Vélo', titre: 'Vélo — Intervalles FTP 4×8 min', duree_min: 65, id_seance: 'VEL-06', allures: [],
    echauffement: '15 min échauffement progressif.',
    corps: `BLOC 4 × 8 min — Intervalles FTP
• 4 × 8 min à 85-90% FC max
• Récupération : 4 min à 60% FC entre chaque`,
    retour_au_calme: '10 min retour calme.',
    notes_coach: "Séance clé pour ta puissance aérobie. Si tu ne peux pas finir les 8 min, la charge est trop élevée. Reste régulière sur les 4 blocs.",
  }),

  'VEL-08': (j) => ({
    jour: j, type: 'Vélo', titre: 'Vélo — Sweet spot 2×20 min', duree_min: 80, id_seance: 'VEL-08', allures: [],
    echauffement: '15 min progressif.',
    corps: `BLOC 2 × 20 min — Sweet Spot
• 20 min à 78-83% FC max (sweet spot)
• Récupération : 5 min à 60% FC
• 20 min à 78-83% FC max — tiens le 2ème comme le 1er`,
    retour_au_calme: '10 min retour.',
    notes_coach: "Le sweet spot est l'approche la plus efficace pour progresser rapidement à vélo. Alliance stress/récupération.",
  }),

  'VEL-03': (j) => ({
    jour: j, type: 'Vélo', titre: 'Vélo — Sortie longue 2h30', duree_min: 150, id_seance: 'VEL-03', allures: [],
    echauffement: '15 min progressif.',
    corps: `BLOC Sortie longue — 2h
• 2h à 60-70% FC max — progression légère sur la 2ème heure
• Gel toutes les 40 min, 500 ml eau/heure minimum`,
    retour_au_calme: '15 min retour.',
    notes_coach: "Gère la première heure en conservateur. La 2ème heure construit ta base pour les 90 km du triathlon. Mange et bois régulièrement.",
  }),

  'VEL-10': (j) => ({
    jour: j, type: 'Vélo', titre: 'Vélo — Côtes 6×4 min', duree_min: 75, id_seance: 'VEL-10', allures: [],
    echauffement: '15 min échauffement sur le plat.',
    corps: `BLOC 6 × 4 min — Côtes vélo
• 6 × 4 min en montée à RPE 8-9 (>88% FC max) — cadence 70-80 RPM, position assise
• Récupération : descente tranquille entre chaque`,
    retour_au_calme: '10 min retour.',
    notes_coach: "Le travail en côte renforce tes quadriceps et ta puissance. Reste assise pour cibler les fessiers et les cuisses.",
  }),
}

// ── Renforcement ─────────────────────────────────────────────────────────────
const RENFO = {
  'RENFO-01': (j) => ({
    jour: j, type: 'Renforcement', titre: 'Renforcement — Gainage & Stabilité',
    duree_min: 30, id_seance: 'RENFO-01', allures: [],
    echauffement: null,
    corps: "Référence-toi à l'onglet Renforcement — effectue la séance 'Gainage & Stabilité'.",
    retour_au_calme: null,
    notes_coach: "Le gainage c'est la base. Un tronc solide = foulée plus économique et moins de blessures.",
  }),
  'RENFO-02': (j) => ({
    jour: j, type: 'Renforcement', titre: 'Renforcement — Force & Puissance',
    duree_min: 30, id_seance: 'RENFO-02', allures: [],
    echauffement: null,
    corps: "Référence-toi à l'onglet Renforcement — effectue la séance 'Force & Puissance'.",
    retour_au_calme: null,
    notes_coach: "Développe la force musculaire spécifique. Ces exercices rendent tes appuis plus explosifs.",
  }),
  'RENFO-03': (j) => ({
    jour: j, type: 'Renforcement', titre: 'Renforcement — Excentrique & Prévention',
    duree_min: 25, id_seance: 'RENFO-03', allures: [],
    echauffement: null,
    corps: "Référence-toi à l'onglet Renforcement — effectue la séance 'Excentrique & Prévention'.",
    retour_au_calme: null,
    notes_coach: "La prévention est l'investissement le plus rentable. Ces exercices excentriques protègent tendons et articulations.",
  }),
  'RENFO-04': (j) => ({
    jour: j, type: 'Renforcement', titre: 'Renforcement — Explosivité & Vitesse',
    duree_min: 30, id_seance: 'RENFO-04', allures: [],
    echauffement: null,
    corps: "Référence-toi à l'onglet Renforcement — effectue la séance 'Explosivité & Vitesse'.",
    retour_au_calme: null,
    notes_coach: "Travail neuromusculaire pour améliorer ton explosivité. Fais-le fraîche — pas après une grosse séance.",
  }),
}

// ── Brique ────────────────────────────────────────────────────────────────────
const brique_courte = (j) => ({
  jour: j, type: 'Brique', titre: 'Brique — Vélo 45 min + Course 15 min', duree_min: 65, id_seance: 'BRK-01', allures: [],
  echauffement: '5 min vélo léger.',
  corps: `BLOC Vélo
• 40 min à 65-72% FC max — allure endurance, prépare la transition

BLOC Transition T2
• Change de chaussures rapidement, note le temps

BLOC Course à pied
• 15 min à ${EF} — tes premières foulées de brique. Sens tes jambes, tiens l'allure`,
  retour_au_calme: '5 min marche.',
  notes_coach: "Première brique ! Tes jambes seront étranges les 2-3 premières minutes — c'est tout à fait normal. Le corps s'adapte très vite.",
})

// ════════════════════════════════════════════════════════════════════════════
// PLAN 5 SEMAINES — 29 juin → fin juillet
// ════════════════════════════════════════════════════════════════════════════
const SEMAINES = [

  // ── S1 (29 juin) — Reprise ────────────────────────────────────────────────
  {
    numero: 1, phase: 'Reprise', charge: 'Modérée',
    objectif: 'Reprise après ta course. Nage et vélo intégrés dès le départ. On démarre à allure raisonnée mais les séances spécifiques commencent cette semaine.',
    seances: [
      co('Lundi', 8, 80),
      NAT['NAT-05']('Mardi'),
      VEL['VEL-02']('Mercredi'),
      ef('Jeudi', 45),
      NAT['NAT-02']('Vendredi'),
      VEL['VEL-05']('Samedi'),
      RENFO['RENFO-01']('Samedi'),
      sl('Dimanche', 80),
    ],
  },

  // ── S2 (6 juillet) — Développement ───────────────────────────────────────
  {
    numero: 2, phase: 'Développement', charge: 'Modérée',
    objectif: 'Première séance piste 300m — la distance que tu aimes. Tempo nage. SL classique pour construire le volume.',
    seances: [
      fc300('Lundi', 12),
      NAT['NAT-07']('Mardi'),
      VEL['VEL-08']('Mercredi'),
      ef('Jeudi', 45),
      NAT['NAT-06']('Vendredi'),
      VEL['VEL-02']('Samedi'),
      RENFO['RENFO-02']('Samedi'),
      sl('Dimanche', 90),
    ],
  },

  // ── S3 (13 juillet) — Charge ──────────────────────────────────────────────
  {
    numero: 3, phase: 'Charge', charge: 'Élevée',
    objectif: '4×1500m sur piste, intervalles FTP vélo, SL 90 min avec blocs seuil. Semaine de charge — récupère bien le week-end.',
    seances: [
      fl1500('Lundi', 4),
      NAT['NAT-04']('Mardi'),
      VEL['VEL-06']('Mercredi'),
      ef('Jeudi', 50),
      RENFO['RENFO-03']('Jeudi'),
      NAT['NAT-06']('Vendredi'),
      VEL['VEL-03']('Samedi'),
      sl('Dimanche', 90, `BLOC 70 min EF
• 70 min à ${EF} — allure facile, installe-toi

BLOC 2 × 10 min Seuil
• 10 min à ${SE} — effort contrôlé
• Récupération : 5 min trot lent à ${RA}
• 10 min à ${SE} — tiens l'allure jusqu'au bout`),
    ],
  },

  // ── S4 (20 juillet) — Intensification ────────────────────────────────────
  {
    numero: 4, phase: 'Intensification', charge: 'Élevée',
    objectif: 'Pyramide piste (200→500→200m) pour toutes les vitesses. Simulation 1500m en natation. SL avec 2×15 min de seuil.',
    seances: [
      pyramide('Lundi'),
      NAT['NAT-11']('Mardi'),
      VEL['VEL-08']('Mercredi'),
      ef('Jeudi', 45),
      NAT['NAT-05']('Vendredi'),
      VEL['VEL-03']('Samedi'),
      RENFO['RENFO-04']('Samedi'),
      sl('Dimanche', 90, `BLOC 55 min EF
• 55 min à ${EF} — allure facile, prends ton rythme

BLOC 2 × 15 min Seuil
• 15 min à ${SE} — travail contrôlé au seuil
• Récupération : 5 min trot lent à ${RA}
• 15 min à ${SE} — même intensité, régularité

BLOC Retour
• 5 min à ${EF} — décompresse, déroule`),
    ],
  },

  // ── S5 (27 juillet) — Spécifique ─────────────────────────────────────────
  {
    numero: 5, phase: 'Spécifique', charge: 'Élevée',
    objectif: '6×500m pour la puissance-vitesse, première brique vélo-course, SL 100 min avec 3×1 km à allure 10km en fin de sortie.',
    seances: [
      fc500('Lundi', 6),
      NAT['NAT-07']('Mardi'),
      VEL['VEL-10']('Mercredi'),
      ef('Jeudi', 45),
      NAT['NAT-06']('Vendredi'),
      brique_courte('Samedi'),
      RENFO['RENFO-02']('Samedi'),
      {
        jour: 'Dimanche', type: 'Sortie Longue', titre: 'Sortie longue 100 min — blocs allure 10km',
        duree_min: 100, id_seance: 'SL-03',
        allures: [
          { zone: 'EF', allure_min_km: EF, pourcentage_vma: 68 },
          { zone: 'Allure 10km', allure_min_km: SP, pourcentage_vma: 92 },
        ],
        echauffement: null,
        corps: `BLOC 65 min EF
• 65 min à ${EF} — allure facile, accumule le volume

BLOC 3 × 1 km — Allure 10km
• 3 × 1 km à ${SP} (allure sub-50)
• Récupération : 2'00 trot lent à ${RA} entre chaque

BLOC Retour
• 10 min à ${EF} — termine en douceur`,
        retour_au_calme: null,
        notes_coach: "L'allure 10km dans une sortie longue — c'est la séance la plus spécifique qui soit. Si tu tiens les 3 km à 5'00 après 65 min de course, tu es sur la bonne voie.",
        est_course: false,
      },
    ],
  },
]

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const { data: profiles, error: pErr } = await sb
    .from('profiles').select('id, first_name, last_name, email').ilike('first_name', '%anouk%')
  if (pErr || !profiles?.length) { console.error('Profil Anouk introuvable.', pErr?.message); process.exit(1) }

  const profile = profiles[0]
  const totalSeances = SEMAINES.reduce((n, s) => n + s.seances.length, 0)
  console.log(`Athlète : ${profile.first_name} ${profile.last_name || ''} (${profile.email})`)
  console.log(`Plan : ${SEMAINES.length} semaines — ${totalSeances} séances\n`)
  SEMAINES.forEach(s => {
    const types = [...new Set(s.seances.map(x => x.type.split(' ')[0]))].join(' · ')
    console.log(`  S${s.numero} [${s.charge.padEnd(12)}] ${s.phase.padEnd(20)} → ${s.seances.length} séances  (${types})`)
  })

  if (DRY) { console.log('\n[DRY RUN] — rien inséré.'); return }

  // Archive tous les plans actifs/pending existants
  const { data: existing } = await sb
    .from('training_plans').select('id, status').eq('user_id', profile.id).in('status', ['active', 'pending'])

  if (existing?.length) {
    if (!process.argv.includes('--force')) {
      console.warn(`\n⚠️  Plan ${existing[0].status} existant (id: ${existing[0].id}). Lance avec --force pour remplacer.`)
      process.exit(1)
    }
    for (const p of existing) {
      await sb.from('training_plans').update({ status: 'completed' }).eq('id', p.id)
      console.log(`  ✓ Plan ${p.id} archivé (completed)`)
    }
  }

  // Insérer + activer immédiatement (start_date = lundi 29 juin 2026)
  const { data, error } = await sb.from('training_plans').insert({
    user_id:      profile.id,
    plan_data:    { semaines: SEMAINES },
    status:       'active',
    activated_at: '2026-06-29T00:00:00.000Z',
  }).select('id')
  if (error) { console.error('Erreur insertion :', error.message); process.exit(1) }

  const newId = data[0].id
  console.log(`\n✓ Plan inséré et activé — id: ${newId}`)
  console.log(`  start_date : lundi 29 juin 2026`)
  console.log(`  ${SEMAINES.length} semaines, ${totalSeances} séances`)
}

main()
