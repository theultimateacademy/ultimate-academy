// Trame 5 séances/semaine, Ebook Semi-marathon, 12 semaines.
// Base = la trame 4 séances + 1 séance supplémentaire par semaine.
//
// Côtes chaque semaine 1-10 placées le Lundi :
//  - Wk1-2,5-6,9-10 (qualité Jeudi) : Lun côtes | Mar EF-base | [Mer repos] | Jeu qualité
//    → 2 jours entre les côtes et la qualité du jeudi (Mar EF + Mer repos)
//  - Wk3-4,7-8 (qualités Mer + Ven) : Lun côtes | Mar EF-base | Mer qualité
//    → Mardi EF assure la récupération entre côtes lundi et qualité mercredi
//  - Progression des côtes : 6×60m (wk1) → 10×100m (wk7-8) → 6×80m (wk10)
//  - Semaine 11 (affûtage) : aucun extra — base (3 séances) suffit
//  - Semaine 12 : ignorée (déjà 4 séances dans la base)
const base = require('./semaines-4-i.js')

const cotes = (wk, reps, dist, duree, echauffMin, bodyText, noteText) => ({
  jour: 'Lundi', type: 'Côtes', titre: 'Séance côtes',
  duree, pcts: [[60, 65]],
  echauff: `${echauffMin} min de footing EF progressif à {{P}}.`,
  corps: bodyText,
  retour: '10 min de jogging léger.',
  note: noteText,
})

const EXTRA_BY_WEEK = {
  // Wk1 – 6 × 60m – adaptation
  1: cotes(1, 6, 60, '45 min', 15,
    '6 × 60m en côte à effort intense. Redescends au trot entre chaque montée. Première séance côtes du plan : travail de puissance et gainage naturel. Allure EF à {{P}} à l\'échauffement.',
    'RPE 8-9/10 sur les montées · Côte 5-8% · Mardi EF + Mercredi repos avant la qualité du jeudi.'),

  // Wk2 – 8 × 60m
  2: cotes(2, 8, 60, '50 min', 15,
    '8 × 60m en côte à effort intense. Deux répétitions de plus. Redescends au trot. La montée renforce chevilles, quadriceps et améliore la foulée. Allure EF à {{P}} à l\'échauffement.',
    'RPE 8-9/10 · Côte 5-8% · Mardi EF + Mercredi repos isolent cette séance du jeudi.'),

  // Wk3 – 8 × 80m – semaine double qualité Mer + Ven
  3: cotes(3, 8, 80, '50 min', 20,
    '8 × 80m en côte à effort maximal. Montées plus longues. Redescends au trot. Travail de puissance, stabilité et gainage. Allure EF à {{P}} à l\'échauffement.',
    'RPE 9/10 · Côte 5-8% · Mardi EF assure la récupération avant le tempo de mercredi.'),

  // Wk4 – 10 × 80m – volume côtes à son pic intermédiaire
  4: cotes(4, 10, 80, '55 min', 20,
    '10 × 80m en côte à effort maximal. Dix répétitions pour développer la puissance musculaire. Redescends au trot. Allure EF à {{P}} à l\'échauffement.',
    'RPE 9/10 · Côte 5-8% · Mardi EF puis mercredi qualité : récupération active garantie.'),

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

  // Wk8 – 10 × 100m – pic de charge
  8: cotes(8, 10, 100, '60 min', 20,
    '10 × 100m en côte à effort maximal. Semaine de charge maximale. Redescends au trot. Dernière semaine de côtes à plein volume avant la spécificité. Allure EF à {{P}} à l\'échauffement.',
    'RPE 9/10 · Côte 5-8% · Mardi EF puis mercredi qualité : soigne la récupération active.'),

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
