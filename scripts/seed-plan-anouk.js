#!/usr/bin/env node
/**
 * Plan Anouk — Triathlon L Dinard (dim 13 sept) + 10km (dim 18 oct)
 * VMA course : 13 km/h · Objectif 10km : sub-50 min (5:00/km)
 * Bloc 1 : semaines 1-5 (29 juin → fin juillet)
 *
 * Run  : node scripts/seed-plan-anouk.js
 * Test : node scripts/seed-plan-anouk.js --dry
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
const DRY = process.argv.includes('--dry')

// ── Allures VMA 13 ──────────────────────────────────────────────────────────
const EF     = '6:25 – 7:06 /km'   // 65-72% VMA
const RA     = '7:06 – 7:41 /km'   // 60-65% VMA
const SE     = '5:15 – 5:37 /km'   // 82-88% VMA (seuil)
const FL1K   = '5:08 – 5:26 /km'   // 85-90% VMA
const FL1500 = '5:15 – 5:34 /km'   // 83-88% VMA
const FC500  = '4:43 – 4:58 /km'   // 93-98% VMA
const FC400  = '4:37 – 4:52 /km'   // 95-100% VMA
const FC300  = '4:23 – 4:45 /km'   // 97-105% VMA
const SP     = '5:00 /km'           // 92% VMA — allure objectif 10km sub-50

const ECHAUFF = `25 min progressif à ${EF}, terminer par 4 lignes droites 80m en accélération progressive.`
const RETOUR  = `10 min très lent à ${RA}.`

// ── Allures combos ──────────────────────────────────────────────────────────
const aEF   = [{ zone: 'Footing EF', allure_min_km: EF, pourcentage_vma: 68 }]
const aSL   = [{ zone: 'Sortie longue', allure_min_km: EF, pourcentage_vma: 68 }]
const aCO   = [
  { zone: 'Échauffement', allure_min_km: EF,          pourcentage_vma: 68 },
  { zone: 'Côtes',        allure_min_km: 'Effort max', pourcentage_vma: 100 },
  { zone: 'Retour',       allure_min_km: RA,           pourcentage_vma: 62 },
]
const aSE   = [
  { zone: 'Échauffement', allure_min_km: EF,  pourcentage_vma: 68 },
  { zone: 'Seuil',        allure_min_km: SE,  pourcentage_vma: 85 },
  { zone: 'Retour',       allure_min_km: RA,  pourcentage_vma: 62 },
]
const aSP10 = [
  { zone: 'Échauffement',    allure_min_km: EF, pourcentage_vma: 68 },
  { zone: 'Allure 10km',     allure_min_km: SP, pourcentage_vma: 92 },
  { zone: 'Retour',          allure_min_km: RA, pourcentage_vma: 62 },
]
const aFP = [
  { zone: 'Phase 1',  allure_min_km: '6:35 – 7:06 /km', pourcentage_vma: 66 },
  { zone: 'Phase 2',  allure_min_km: '6:09 – 6:35 /km', pourcentage_vma: 72 },
  { zone: 'Phase 3',  allure_min_km: '5:08 – 5:37 /km', pourcentage_vma: 84 },
]
const a300 = [
  { zone: 'Échauffement', allure_min_km: EF,    pourcentage_vma: 68 },
  { zone: '300m piste',   allure_min_km: FC300, pourcentage_vma: 101 },
  { zone: 'Retour',       allure_min_km: RA,    pourcentage_vma: 62 },
]
const a500 = [
  { zone: 'Échauffement', allure_min_km: EF,   pourcentage_vma: 68 },
  { zone: '500m piste',   allure_min_km: FC500, pourcentage_vma: 95 },
  { zone: 'Retour',       allure_min_km: RA,   pourcentage_vma: 62 },
]
const a1500 = [
  { zone: 'Échauffement', allure_min_km: EF,     pourcentage_vma: 68 },
  { zone: '1500m piste',  allure_min_km: FL1500, pourcentage_vma: 85 },
  { zone: 'Retour',       allure_min_km: RA,     pourcentage_vma: 62 },
]
const aPyramide = [
  { zone: 'Échauffement',        allure_min_km: EF,    pourcentage_vma: 68 },
  { zone: '200m (le plus vite)', allure_min_km: '4:12 – 4:37 /km', pourcentage_vma: 105 },
  { zone: '500m (le plus lent)', allure_min_km: FC500, pourcentage_vma: 95 },
  { zone: 'Retour',              allure_min_km: RA,    pourcentage_vma: 62 },
]

// ── Factories running ────────────────────────────────────────────────────────
const ef = (jour, min) => ({
  jour, type: 'Endurance Fondamentale', titre: `Footing EF ${min} min`,
  duree_min: min, id_seance: min <= 45 ? 'EF-02' : 'EF-03', allures: aEF,
  echauffement: null,
  corps: `${min} min à ${EF}. Allure très facile, respiration nasale possible. Tu dois pouvoir parler sans être essoufflée.`,
  retour_au_calme: null,
  note: "L'EF c'est le socle. Sois patiente, la progression se fait en profondeur.",
})

const fp = (jour) => ({
  jour, type: 'Footing Progressif', titre: 'Footing progressif 45 min',
  duree_min: 65, id_seance: 'FP-01', allures: aFP,
  echauffement: `10 min très lent à ${RA}.`,
  corps: `15 min à 6:35–7:06 /km → 15 min à 6:09–6:35 /km → 15 min à 5:08–5:37 /km. Sens la montée en puissance naturellement, sans forcer.`,
  retour_au_calme: `10 min très lent à ${RA}.`,
  note: "Le progressif t'apprend à gérer l'allure. Chaque phase doit être plus rapide que la précédente.",
})

const sl = (jour, min, corps_extra) => ({
  jour, type: 'Sortie Longue', titre: `Sortie longue ${min} min${corps_extra ? ' — blocs inclus' : ''}`,
  duree_min: min, id_seance: min <= 80 ? 'SL-02' : 'SL-03', allures: corps_extra
    ? [{ zone: 'EF', allure_min_km: EF, pourcentage_vma: 68 }, { zone: 'Blocs seuil', allure_min_km: SE, pourcentage_vma: 85 }]
    : aSL,
  echauffement: null,
  corps: corps_extra ? corps_extra : `${min} min à ${EF}. Effort régulier et constant, reste à l'aise tout au long.`,
  retour_au_calme: null,
  note: min >= 90 ? "Prends un gel après 60 min. Gère l'allure sur la première heure pour finir forte." : "Ta sortie longue de la semaine. Reste à l'aise, hydrate-toi.",
})

const co = (jour, reps, dist) => ({
  jour, type: 'Côtes', titre: `Séance côtes ${reps}×${dist}m`,
  duree_min: 60, id_seance: dist <= 80 ? 'CO-01' : 'CO-03', allures: aCO,
  echauffement: ECHAUFF,
  corps: `${reps} × ${dist}m en côte à effort maximal — monte dynamique, foulée ample, bras actifs. Redescends en marchant pour récupération complète entre chaque montée.`,
  retour_au_calme: RETOUR,
  note: "Les côtes renforcent tes appuis et ta foulée. Attaque le sol, lève les genoux. Laisse-toi le temps de récupérer en descente.",
})

const fc300 = (jour, n) => ({
  jour, type: 'Fractionné Court', titre: `${n}×300m — Piste`,
  duree_min: 60, id_seance: 'FC-03', allures: a300,
  echauffement: ECHAUFF,
  corps: `${n} × 300m à ${FC300} — récupération 1'00 en marchant entre chaque. Maintiens l'allure sur les ${Math.round(n * 0.6)} dernières répétitions — c'est là que ça se construit.`,
  retour_au_calme: RETOUR,
  note: "Séance de vitesse sur piste. Régulière sur les premières, tu accélères si tu te sens bien sur les 4 dernières. Ne pars pas trop vite.",
})

const fc500 = (jour, n) => ({
  jour, type: 'Fractionné Court', titre: `${n}×500m — Piste`,
  duree_min: 65, id_seance: 'FC-04', allures: a500,
  echauffement: ECHAUFF,
  corps: `${n} × 500m à ${FC500} — récupération 1'30 en marchant entre chaque. Belle distance charnière entre vitesse et résistance.`,
  retour_au_calme: RETOUR,
  note: "Le 500m te force à gérer ton effort sur la durée tout en restant dans la zone rapide. Conservatrice sur les premiers, régulière sur tous.",
})

const fl1500 = (jour, n) => ({
  jour, type: 'Fractionné Long', titre: `${n}×1500m — Piste`,
  duree_min: 65, id_seance: 'FL-11', allures: a1500,
  echauffement: ECHAUFF,
  corps: `${n} × 1500m à ${FL1500} — récupération 2'30 trot lent entre chaque. Le 1500m est un bon intermédiaire entre le 1000m et le 2000m : endurance et vitesse simultanées.`,
  retour_au_calme: RETOUR,
  note: "Régularité absolue sur les répétitions. Si tu accélères sur la dernière, parfait. Si la dernière s'effondre, l'allure était trop rapide.",
})

const pyramide = (jour) => ({
  jour, type: 'Fractionné Court', titre: 'Pyramide piste 200-300-400-500-400-300-200m',
  duree_min: 65, id_seance: 'FC-04', allures: aPyramide,
  echauffement: ECHAUFF,
  corps: `200m à 4:12–4:37 /km → 300m à ${FC300} → 400m à ${FC400} → 500m à ${FC500} → 400m à ${FC400} → 300m à ${FC300} → 200m à 4:12–4:37 /km.\nRécupération 1'30 entre chaque distance. Les allures augmentent avec la distance (le 200m est le plus rapide, le 500m le plus lent).`,
  retour_au_calme: RETOUR,
  note: "La pyramide change le rythme en permanence — excellent pour l'adaptabilité neuromusculaire. Les 200m sprint doivent être explosifs et relâchés.",
})

const tempo = (jour, variant) => {
  const v = {
    '2x15': { titre: 'Tempo 2×15 min', duree_min: 70, id: 'T-02',
      corps: `2 × 15 min à ${SE} — récupération 4 min trot lent entre les blocs. Garde le même rythme sur le deuxième bloc, ne pars pas trop vite sur le premier.` },
    '3x10': { titre: 'Tempo 3×10 min', duree_min: 65, id: 'T-01',
      corps: `3 × 10 min à ${SE} — récupération 3 min trot lent entre chaque. Tu dois pouvoir prononcer des mots mais pas des phrases.` },
  }[variant]
  return {
    jour, type: 'Tempo / Seuil', titre: v.titre, duree_min: v.duree_min, id_seance: v.id,
    allures: aSE, echauffement: ECHAUFF, retour_au_calme: RETOUR,
    note: "Deux bons blocs de seuil. Régularité sur les deux blocs — note si le 2ème est nettement plus lent.",
  }
}

const sp10km = (jour, n) => ({
  jour, type: 'Spécifique', titre: `Blocs allure 10km — ${n}×2 km`,
  duree_min: n <= 3 ? 65 : 70, id_seance: 'SP-03', allures: aSP10,
  echauffement: ECHAUFF,
  corps: `${n} × 2 km à ${SP} (allure objectif sub-50) — récupération 2'30 trot lent à ${RA} entre chaque. Grave cette sensation dans ta mémoire musculaire.`,
  retour_au_calme: RETOUR,
  note: `Tu cours à l'allure de ta course. ${n} × 2 km à 5:00/km — si tu tiens le dernier, tu es prête le jour J.`,
})

// ── Natation ─────────────────────────────────────────────────────────────────
const NAT = {
  'NAT-12': (j) => ({
    jour: j, type: 'Natation', titre: 'Natation — Technique & drills', duree_min: 40, id_seance: 'NAT-12', allures: [],
    echauffement: null,
    corps: "4×50m catch-up drill → 4×50m finger tip drag → 4×50m one arm → 200m focus technique → 4×50m négatif split (2ème moitié plus rapide). Récup 20'' entre les longueurs.",
    retour_au_calme: '200m très lent.',
    note: "Séance technique pure. L'objectif est d'améliorer ton efficacité, pas ta vitesse.",
  }),
  'NAT-02': (j) => ({
    jour: j, type: 'Natation', titre: 'Natation — Endurance 2000m', duree_min: 45, id_seance: 'NAT-02', allures: [],
    echauffement: '300m échauffement + 200m technique pull buoy.',
    corps: "2000m continu à 65-72% CSS — effort régulier et économique. Trouve ton rythme dès les premiers 500m, ne pars pas trop vite.",
    retour_au_calme: '200m retour au calme.',
    note: "La distance d'entraînement clé pour le 1900m. Régularité et économie de nage.",
  }),
  'NAT-05': (j) => ({
    jour: j, type: 'Natation', titre: 'Natation — Seuil 8×200m', duree_min: 50, id_seance: 'NAT-05', allures: [],
    echauffement: '400m échauffement + 4×50m cadence.',
    corps: "8 × 200m à 82-88% CSS — récupération 30'' entre chaque série. Régularité absolue sur les 8 répétitions.",
    retour_au_calme: '200m retour au calme.',
    note: "Le 200m est la référence pour travailler ton seuil en nage. Régularité sur toutes les séries.",
  }),
  'NAT-06': (j) => ({
    jour: j, type: 'Natation', titre: 'Natation — 5×400m spécifique', duree_min: 55, id_seance: 'NAT-06', allures: [],
    echauffement: '400m échauffement + 200m drills.',
    corps: "5 × 400m à 80-87% CSS — récupération 45'' entre chaque série. Gère ton effort sur les premiers 400m pour finir fort sur les derniers.",
    retour_au_calme: '200m retour.',
    note: "La distance de travail la plus spécifique au 1900m du triathlon. Régularité sur les 5 répétitions.",
  }),
  'NAT-07': (j) => ({
    jour: j, type: 'Natation', titre: 'Natation — 3×800m tempo', duree_min: 55, id_seance: 'NAT-07', allures: [],
    echauffement: '400m échauffement + 100m kick board.',
    corps: "3 × 800m à 80-85% CSS — récupération 1'00 entre chaque série. Tiens bon sur le 2ème bloc — le 3ème sera plus facile.",
    retour_au_calme: '200m retour.',
    note: "Trois blocs solides. Le 2ème est souvent le plus dur mentalement — tiens bon, le 3ème sera plus facile.",
  }),
  'NAT-04': (j) => ({
    jour: j, type: 'Natation', titre: 'Natation — Vitesse 10×100m', duree_min: 45, id_seance: 'NAT-04', allures: [],
    echauffement: '400m échauffement + 4×50m progressifs.',
    corps: "10 × 100m à 90-95% CSS — récupération 20'' entre chaque. Maintiens l'allure sur les 8 derniers. Si les temps s'effondrent, allonge la récup à 30''.",
    retour_au_calme: '200m retour au calme.',
    note: "Travail de vitesse pure. Maintiens l'allure sur les derniers — c'est là que ça se construit vraiment.",
  }),
  'NAT-08': (j) => ({
    jour: j, type: 'Natation', titre: 'Natation — Pyramide VMA nage', duree_min: 40, id_seance: 'NAT-08', allures: [],
    echauffement: '400m échauffement + 4×25m sprint.',
    corps: "50m à 100% CSS → 100m à 95% → 200m à 90% → 100m à 95% → 50m à 100% CSS. Récupération 30'' entre chaque distance.",
    retour_au_calme: '200m retour.',
    note: "La pyramide te fait changer de rythme en permanence — excellent pour l'adaptabilité. Les 50m doivent être explosifs.",
  }),
  'NAT-11': (j) => ({
    jour: j, type: 'Natation', titre: 'Natation — Simulation 1900m', duree_min: 55, id_seance: 'NAT-11', allures: [],
    echauffement: '400m échauffement.',
    corps: "1900m à allure compétition (75-83% CSS) — simulation exacte de la distance du triathlon. Mémorise la sensation de nager 1900m — c'est ce qui t'attend à Dinard.",
    retour_au_calme: '200m retour lent.',
    note: "C'est LA séance de référence pour le triathlon. Mémorise cette sensation — énergie dépensée, respiration, rythme.",
  }),
  'NAT-15': (j) => ({
    jour: j, type: 'Natation', titre: 'Natation — Récupération 1000m', duree_min: 30, id_seance: 'NAT-15', allures: [],
    echauffement: null,
    corps: "1000m très lent à 60-65% CSS — pull buoy si besoin, focus sur la respiration et la détente totale.",
    retour_au_calme: null,
    note: "Séance de récupération. Nage sans effort, relâche les épaules et la nuque.",
  }),
}

// ── Vélo ─────────────────────────────────────────────────────────────────────
const VEL = {
  'VEL-02': (j) => ({
    jour: j, type: 'Vélo', titre: 'Vélo — Endurance 1h30', duree_min: 90, id_seance: 'VEL-02', allures: [],
    echauffement: '10 min progressif.',
    corps: "70 min à 60-65% FC max (Zone 2) — allure conversationnelle, hydrate-toi dès le départ.",
    retour_au_calme: '10 min retour progressif.',
    note: "Base aérobie vélo. Un gel à 45 min si tu le sens. Travaille ta position sur le vélo.",
  }),
  'VEL-05': (j) => ({
    jour: j, type: 'Vélo', titre: 'Vélo — Tempo 2×15 min', duree_min: 70, id_seance: 'VEL-05', allures: [],
    echauffement: '15 min progressif à 60% FC.',
    corps: "2 × 15 min à 75-80% FC max — récupération 5 min à 60% FC entre les blocs. Cadence 85-95 RPM.",
    retour_au_calme: '10 min retour calme.',
    note: "Travail au seuil vélo. Cadence 85-95 RPM. Si tu pèses trop lourd, baisse la résistance et augmente la cadence.",
  }),
  'VEL-06': (j) => ({
    jour: j, type: 'Vélo', titre: 'Vélo — Intervalles FTP 4×8 min', duree_min: 65, id_seance: 'VEL-06', allures: [],
    echauffement: '15 min échauffement progressif.',
    corps: "4 × 8 min à 85-90% FC max — récupération 4 min à 60% FC entre chaque. Si tu ne peux pas finir les 8 min, la charge est trop élevée.",
    retour_au_calme: '10 min retour calme.',
    note: "Séance clé pour ta puissance aérobie. Reste régulière sur les 4 intervalles.",
  }),
  'VEL-08': (j) => ({
    jour: j, type: 'Vélo', titre: 'Vélo — Sweet spot 2×20 min', duree_min: 80, id_seance: 'VEL-08', allures: [],
    echauffement: '15 min progressif.',
    corps: "2 × 20 min à 78-83% FC max (Sweet Spot) — récupération 5 min à 60% FC entre les blocs.",
    retour_au_calme: '10 min retour.',
    note: "Le sweet spot est l'approche la plus efficace pour progresser rapidement à vélo. Alliance stress/récupération.",
  }),
  'VEL-03': (j) => ({
    jour: j, type: 'Vélo', titre: 'Vélo — Sortie longue 2h30', duree_min: 150, id_seance: 'VEL-03', allures: [],
    echauffement: '15 min progressif.',
    corps: "2h à 60-70% FC max — progression légère sur la dernière heure. Gel toutes les 40 min, 500 ml eau/heure minimum.",
    retour_au_calme: '15 min retour.',
    note: "Gère la première heure en conservateur. La 2ème heure construit ta base pour les 90 km du triathlon.",
  }),
  'VEL-10': (j) => ({
    jour: j, type: 'Vélo', titre: 'Vélo — Côtes 6×4 min', duree_min: 75, id_seance: 'VEL-10', allures: [],
    echauffement: '15 min échauffement sur le plat.',
    corps: "6 × 4 min en montée à RPE 8-9 (>88% FC max) — cadence 70-80 RPM, position assise. Descente tranquille entre chaque.",
    retour_au_calme: '10 min retour.',
    note: "Le travail en côte renforce tes quadriceps et ta puissance. Reste assise pour cibler les fessiers et les cuisses.",
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
    note: "Le gainage c'est la base. Un tronc solide = foulée plus économique et moins de blessures.",
  }),
  'RENFO-02': (j) => ({
    jour: j, type: 'Renforcement', titre: 'Renforcement — Force & Puissance',
    duree_min: 30, id_seance: 'RENFO-02', allures: [],
    echauffement: null,
    corps: "Référence-toi à l'onglet Renforcement — effectue la séance 'Force & Puissance'.",
    retour_au_calme: null,
    note: "Développe la force musculaire spécifique. Ces exercices rendent tes appuis plus explosifs.",
  }),
  'RENFO-03': (j) => ({
    jour: j, type: 'Renforcement', titre: 'Renforcement — Excentrique & Prévention',
    duree_min: 25, id_seance: 'RENFO-03', allures: [],
    echauffement: null,
    corps: "Référence-toi à l'onglet Renforcement — effectue la séance 'Excentrique & Prévention'.",
    retour_au_calme: null,
    note: "La prévention est l'investissement le plus rentable. Ces exercices excentriques protègent tendons et articulations.",
  }),
  'RENFO-04': (j) => ({
    jour: j, type: 'Renforcement', titre: 'Renforcement — Explosivité & Vitesse',
    duree_min: 30, id_seance: 'RENFO-04', allures: [],
    echauffement: null,
    corps: "Référence-toi à l'onglet Renforcement — effectue la séance 'Explosivité & Vitesse'.",
    retour_au_calme: null,
    note: "Travail neuromusculaire pour améliorer ton explosivité. Fais-le fraîche — pas après une grosse séance.",
  }),
}

// ── Brique ────────────────────────────────────────────────────────────────────
const brique_courte = (j) => ({
  jour: j, type: 'Brique', titre: 'Brique — Vélo 45 min + Course 15 min', duree_min: 65, id_seance: 'BRK-01', allures: [],
  echauffement: '5 min vélo léger.',
  corps: `BLOC Vélo\n• 40 min à 65-72% FC max — allure endurance, prépare la transition\n\nBLOC Transition T2\n• Change de chaussures rapidement, note le temps\n\nBLOC Course\n• 15 min à ${EF} — tes premières foulées de brique. Sens tes jambes, tiens l'allure.`,
  retour_au_calme: '5 min marche.',
  note: "Première brique ! Tes jambes seront étranges les 2-3 premières minutes — c'est normal. Le corps s'adapte vite.",
})

// ════════════════════════════════════════════════════════════════════════════
// PLAN 5 SEMAINES — 29 juin → fin juillet
// ════════════════════════════════════════════════════════════════════════════
const SEMAINES = [

  // ── S1 (29 juin) — Reprise ────────────────────────────────────────────────
  {
    numero: 1, phase: 'Reprise', charge: 'Modérée',
    objectif: 'Reprise après ta course. Nage et vélo intégrés dès le départ. On démarre à allure raisonnée mais on ne perd pas de temps — les séances spécifiques commencent cette semaine.',
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
    objectif: 'Première séance piste 300m — la distance que tu aimes. Footing EF pour récupérer des 300m. SL classique pour construire le volume.',
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
    objectif: 'Semaine de charge : 1500m sur piste (endurance-vitesse), intervalles FTP vélo, sortie longue 2h30. Le gros volume de la semaine — récupère bien le week-end.',
    seances: [
      fl1500('Lundi', 4),
      NAT['NAT-04']('Mardi'),
      VEL['VEL-06']('Mercredi'),
      ef('Jeudi', 50),
      RENFO['RENFO-03']('Jeudi'),
      NAT['NAT-06']('Vendredi'),
      VEL['VEL-03']('Samedi'),
      sl('Dimanche', 90, `70 min à ${EF}, puis 2 × 10 min à ${SE} avec 5 min facile entre les blocs. Travaille le seuil en fin de sortie longue quand les jambes sont déjà fatiguées.`),
    ],
  },

  // ── S4 (20 juillet) — Intensification ────────────────────────────────────
  {
    numero: 4, phase: 'Intensification', charge: 'Élevée',
    objectif: 'Pyramide piste (200-300-400-500-400-300-200m) pour toutes les vitesses. Premier test 1900m en natation. SL avec 2×15 min de seuil intégrés en fin de sortie.',
    seances: [
      pyramide('Lundi'),
      NAT['NAT-11']('Mardi'),
      VEL['VEL-08']('Mercredi'),
      ef('Jeudi', 45),
      NAT['NAT-05']('Vendredi'),
      VEL['VEL-03']('Samedi'),
      RENFO['RENFO-04']('Samedi'),
      sl('Dimanche', 90, `55 min à ${EF}, puis 2 × 15 min à ${SE} avec 5 min facile entre les blocs, puis 5 min à ${EF} pour finir. Tempo dans les jambes fatiguées — c'est là que ça se construit vraiment.`),
    ],
  },

  // ── S5 (27 juillet) — Fin juillet / transition ────────────────────────────
  {
    numero: 5, phase: 'Spécifique', charge: 'Élevée',
    objectif: 'Semaine clé avant août : 6×500m pour la puissance-vitesse, première brique vélo-course, SL 100 min avec 3×1 km à allure 10km en fin de sortie. Footing EF jeudi pour récupérer entre les deux qualités.',
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
        corps: `65 min à ${EF}, puis 3 × 1 km à ${SP} avec 2 min trot lent à ${RA} entre chaque, puis 10 min à ${EF} pour terminer. Grave cette allure dans tes jambes fatiguées — c'est exactement ce que tu vivras en course.`,
        retour_au_calme: null,
        note: "L'allure 10km dans une sortie longue, c'est la séance la plus spécifique qui soit. Si tu tiens les 3 km à 5:00 après 65 min de course, tu es sur la bonne voie.",
        est_course: true,
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

  const { data: existing } = await sb
    .from('training_plans').select('id, status').eq('user_id', profile.id).in('status', ['active', 'pending'])
  if (existing?.length && !process.argv.includes('--force')) {
    console.warn(`\n⚠️  Plan ${existing[0].status} existant (id: ${existing[0].id}). Lance avec --force pour remplacer.`)
    process.exit(1)
  }

  const { data, error } = await sb
    .from('training_plans').insert({ user_id: profile.id, plan_data: { semaines: SEMAINES }, status: 'pending' }).select('id')
  if (error) { console.error('Erreur :', error.message); process.exit(1) }
  console.log(`\n✓ Plan créé — id: ${data[0].id} — status: pending`)
  console.log('  Active-le depuis /admin/plans.')
}

main()
