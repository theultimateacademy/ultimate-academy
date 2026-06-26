// Trame 5 séances/semaine, Ebook Semi-marathon, 12 semaines.
// Base = la trame 4 séances + 1 séance supplémentaire par semaine.
//
// Côtes semaines 2,3,5,6,7,9,10 placées le Lundi.
// Wk1,4,8 : footing progressif (pas de côtes en début de plan, semaine double charge, pic).
//  - Wk1-2,5-6,9-10 (qualité Jeudi) : Lun extra | Mar EF-base | [Mer repos] | Jeu qualité
//  - Wk3-4,7-8 (qualités Mer + Ven) : Lun extra | Mar EF-base | Mer qualité
//  - Progression côtes : 8×60m (wk2) → 10×80m (wk5-6) → 10×100m (wk7) → 6×80m (wk10)
//  - Semaine 11 (affûtage) : aucun extra — base (3 séances) suffit
//  - Semaine 12 : ignorée (déjà 4 séances dans la base)
const base = require('./semaines-4-i.js')

const ef = (jour, duree, corps, note, pcts = [[60, 65]]) => ({
  jour, type: 'EF', titre: 'Footing EF',
  duree, pcts, echauff: '', corps, retour: '', note,
})

const cotes = (wk, reps, dist, duree, echauffMin, bodyText, noteText) => ({
  jour: 'Lundi', type: 'Côtes', titre: 'Séance côtes',
  duree, pcts: [[60, 65]],
  echauff: `${echauffMin} min de footing EF progressif à {{P}}.`,
  corps: bodyText,
  retour: '10 min de jogging léger.',
  note: noteText,
})

const EXTRA_BY_WEEK = {
  // Wk1 – footing progressif (pas de côtes en première semaine d'adaptation)
  1: ef('Vendredi', '40 min',
    '40 min à {{P}}. Volume supplémentaire en récupération après les 6 × 800m du jeudi. Allure très facile, jambes décontractées.',
    'RPE 3/10 · Finis frais, allure de conversation.'),

  // Wk2 – 8 × 60m
  2: cotes(2, 8, 60, '50 min', 15,
    '8 × 60m en côte à effort intense. Deux répétitions de plus. Redescends au trot. La montée renforce chevilles, quadriceps et améliore la foulée. Allure EF à {{P}} à l\'échauffement.',
    'RPE 8-9/10 · Côte 5-8% · Mardi EF + Mercredi repos isolent cette séance du jeudi.'),

  // Wk3 – 8 × 80m – semaine double qualité Mer + Ven
  3: cotes(3, 8, 80, '50 min', 20,
    '8 × 80m en côte à effort maximal. Montées plus longues. Redescends au trot. Travail de puissance, stabilité et gainage. Allure EF à {{P}} à l\'échauffement.',
    'RPE 9/10 · Côte 5-8% · Mardi EF assure la récupération avant le tempo de mercredi.'),

  // Wk4 – footing progressif (semaine double qualité Mer + Ven, pas de côtes supplémentaires)
  4: ef('Samedi', '45 min',
    '45 min à {{P}}. Récupération avant la sortie longue du dimanche. Footing progressif, volume maintenu sans empiéter sur la qualité de la semaine.',
    'RPE 3-4/10 · Foulée légère, respiration nasale si possible.'),

  // Wk5 – 10 × 80m – première semaine de volume
  5: cotes(5, 10, 80, '50 min', 20,
    '10 × 80m en côte à effort maximal. Redescends au trot entre chaque. Travail de puissance, foulée et gainage. Allure EF à {{P}} à l\'échauffement.',
    'RPE 9/10 · Côte 5-8% · 2 jours (Mar EF + Mer repos) avant le tempo de jeudi.'),

  // Wk6 – 8 × 100m – collines longues, progression
  6: cotes(6, 8, 100, '55 min', 20,
    '8 × 100m en côte à effort maximal. Montées plus longues pour développer l\'endurance musculaire. Redescends au trot. Travail de résistance à la fatigue neuromusculaire. Allure EF à {{P}} à l\'échauffement.',
    'RPE 9/10 · Côte 5-8% · Mardi EF + Mercredi repos avant le tempo du jeudi.'),

  // Wk7 – 10 × 100m – intensification
  7: cotes(7, 10, 100, '60 min', 20,
    '10 × 100m en côte à effort maximal. Semaine d\'intensification : 10 répétitions longues. Redescends au trot. Gainage, puissance, explosivité. Allure EF à {{P}} à l\'échauffement.',
    'RPE 9/10 · Côte 5-8% · Mardi EF assure la récupération avant le tempo de mercredi.'),

  // Wk8 – footing progressif (pic de charge Mer + Ven : pas de côtes supplémentaires)
  8: ef('Samedi', '45 min',
    '45 min à {{P}}. Activation légère avant la sortie longue de 110 min de demain. Footing progressif, jambes disponibles pour le dimanche.',
    'RPE 3/10 · Si tu te sens fatigué, réduis à 30 minutes.'),

  // Wk9 – 8 × 80m – réduction, phase spécificité
  9: cotes(9, 8, 80, '50 min', 20,
    '8 × 80m en côte à effort maximal. Volume réduit pour préserver les jambes avant les 3 × 5 km du jeudi. Intensité maintenue, durée allégée. Allure EF à {{P}} à l\'échauffement.',
    'RPE 9/10 · Côte 5-8% · Mardi EF + Mercredi repos avant la séance spécifique du jeudi.'),

  // Wk10 – 6 × 80m – pré-affûtage
  10: cotes(10, 6, 80, '45 min', 15,
    '6 × 80m en côte à effort maximal. Dernière séance de côtes du plan. Volume allégé pour arriver frais sur les 4 × 5 km du jeudi. Qualité de chaque montée prime sur la quantité. Allure EF à {{P}} à l\'échauffement.',
    'RPE 9/10 · Côte 5-8% · Dernière séance côtes avant l\'affûtage.'),

  // Wk11 (affûtage) : aucun extra — la base a déjà 3 séances avec 2 footings.
  // Wk12 : ignorée (déjà 4 séances dans la base).
}

module.exports = base.map(week => {
  const extra = EXTRA_BY_WEEK[week.num]
  if (!extra) return week
  return {
    ...week,
    seances: [...week.seances, extra],
  }
})
