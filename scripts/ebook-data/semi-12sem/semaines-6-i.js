// Trame 6 séances/semaine, Ebook Semi-marathon, 12 semaines.
// Base = la trame 4 séances + 2 séances supplémentaires par semaine.
//
// Côtes chaque semaine 1-10 placées le Lundi :
//  - Wk1-2,5-6,9-10 (qualité Jeudi) : Lundi Côtes + Vendredi EF
//    → Lun côtes | Mar EF-base | [Mer repos] | Jeu qualité | Ven EF | Sam EF-base | Dim SL
//  - Wk3-4,7-8 (qualités Mer + Ven) : Lundi Côtes + Jeudi EF
//    → Lun côtes | Mar EF-base | Mer qualité | Jeu EF (récup) | Ven qualité | [Sam repos] | Dim SL
//    Samedi devient repos (Lun côtes remplace l'ancien extra Samedi EF pour rester à 6 séances)
//  - Progression des côtes : 6×60m (wk1) → 10×100m (wk7-8) → 6×80m (wk10)
//  - Wk11 (affûtage) : 1 seul extra — Lundi EF 40min
//  - Wk12 : ignorée (déjà 4 séances dans la base)
const base = require('./semaines-4-i.js')

const ef = (jour, duree, corps, note, pcts = [[60, 65]]) => ({
  jour, type: 'EF', titre: 'Footing EF',
  duree, pcts, echauff: '', corps, retour: '', note,
})

const cotes = (wk, duree, echauffMin, bodyText, noteText) => ({
  jour: 'Lundi', type: 'Côtes', titre: 'Séance côtes',
  duree, pcts: [[60, 65]],
  echauff: `${echauffMin} min de footing EF progressif à {{P}}.`,
  corps: bodyText,
  retour: '10 min de jogging léger.',
  note: noteText,
})

// Côtes progression partagée avec le plan 5 séances
const COTES = {
  1: cotes(1, '45 min', 15,
    '6 × 60m en côte à effort intense. Redescends au trot entre chaque montée. Première séance côtes du plan : puissance et gainage naturel. Allure EF à {{P}} à l\'échauffement.',
    'RPE 8-9/10 · Côte 5-8% · Mar EF + Mer repos avant la qualité du jeudi.'),
  2: cotes(2, '50 min', 15,
    '8 × 60m en côte à effort intense. Deux répétitions de plus. Redescends au trot. La montée renforce chevilles, quadriceps et améliore la foulée. Allure EF à {{P}} à l\'échauffement.',
    'RPE 8-9/10 · Côte 5-8% · Mar EF + Mer repos isolent cette séance du jeudi.'),
  3: cotes(3, '50 min', 20,
    '8 × 80m en côte à effort maximal. Montées plus longues. Redescends au trot. Travail de puissance, stabilité et gainage. Allure EF à {{P}} à l\'échauffement.',
    'RPE 9/10 · Côte 5-8% · Mar EF assure la récupération avant le tempo de mercredi.'),
  4: cotes(4, '55 min', 20,
    '10 × 80m en côte à effort maximal. Dix répétitions pour développer la puissance musculaire. Redescends au trot. Allure EF à {{P}} à l\'échauffement.',
    'RPE 9/10 · Côte 5-8% · Mar EF puis mercredi qualité : récupération active garantie.'),
  5: cotes(5, '50 min', 20,
    '10 × 80m en côte à effort maximal. Redescends au trot entre chaque. Travail de puissance, foulée et gainage. Allure EF à {{P}} à l\'échauffement.',
    'RPE 9/10 · Côte 5-8% · 2 jours (Mar EF + Mer repos) avant le tempo de jeudi.'),
  6: cotes(6, '55 min', 20,
    '8 × 100m en côte à effort maximal. Montées plus longues pour développer l\'endurance musculaire. Redescends au trot. Résistance à la fatigue neuromusculaire. Allure EF à {{P}} à l\'échauffement.',
    'RPE 9/10 · Côte 5-8% · Mar EF + Mer repos avant le tempo du jeudi.'),
  7: cotes(7, '60 min', 20,
    '10 × 100m en côte à effort maximal. Semaine d\'intensification. Dix répétitions longues. Redescends au trot. Gainage, puissance, explosivité. Allure EF à {{P}} à l\'échauffement.',
    'RPE 9/10 · Côte 5-8% · Mar EF assure la récupération avant le tempo de mercredi.'),
  8: cotes(8, '60 min', 20,
    '10 × 100m en côte à effort maximal. Semaine de charge maximale. Redescends au trot. Dernière semaine à plein volume de côtes avant la spécificité. Allure EF à {{P}} à l\'échauffement.',
    'RPE 9/10 · Côte 5-8% · Mar EF puis mercredi qualité : soigne la récupération active.'),
  9: cotes(9, '50 min', 20,
    '8 × 80m en côte à effort maximal. Volume réduit pour préserver les jambes avant les 3 × 5 km du jeudi. Intensité maintenue, durée allégée. Allure EF à {{P}} à l\'échauffement.',
    'RPE 9/10 · Côte 5-8% · Mar EF + Mer repos avant la séance spécifique du jeudi.'),
  10: cotes(10, '45 min', 15,
    '6 × 80m en côte à effort maximal. Dernière séance de côtes du plan. Volume allégé pour les 4 × 5 km du jeudi. Qualité de chaque montée prime sur la quantité. Allure EF à {{P}} à l\'échauffement.',
    'RPE 9/10 · Côte 5-8% · Dernière séance côtes avant l\'affûtage.'),
}

const EXTRAS_BY_WEEK = {
  // Wk1 : base Mar EF | Jeu frac | Sam EF | Dim SL
  // Lun côtes | Mar EF | [Mer repos] | Jeu frac | Ven EF | Sam EF | Dim SL = 6 sessions
  1: [
    COTES[1],
    ef('Vendredi', '40 min',
      '40 min à {{P}}. Récupération après les fractionnés du jeudi et préparation à la sortie longue du dimanche. Allure vraiment facile.',
      'RPE 3/10 · Allure de conversation, jambes décontractées.'),
  ],

  // Wk2 : même structure
  2: [
    COTES[2],
    ef('Vendredi', '40 min',
      '40 min à {{P}}. Volume supplémentaire en récupération après les 8 × 800m. Prépare la base aérobie avant les séances de seuil des semaines suivantes.',
      'RPE 3/10 · Vraiment facile.'),
  ],

  // Wk3 : base Mar EF | Mer tempo | Ven frac | Dim SL
  // Lun côtes | Mar EF | Mer qualité | Jeu EF (récup) | Ven qualité | [Sam repos] | Dim SL = 6 sessions
  3: [
    COTES[3],
    ef('Jeudi', '40 min',
      '40 min très faciles à {{P}}. Récupération active entre le tempo du mercredi et les fractionnés du vendredi. Ce footing est indispensable pour tenir la qualité du vendredi.',
      'RPE 3/10 · Ce footing facile te permet de récupérer du mercredi tout en gardant les jambes mobiles.'),
  ],

  // Wk4 : même structure que wk3
  4: [
    COTES[4],
    ef('Jeudi', '40 min',
      '40 min très faciles à {{P}}. Récupération entre le seuil du mercredi et les fractionnés du vendredi. Volume de base sans jamais empiéter sur la qualité.',
      'RPE 3/10 · Si tu te sens fatigué après le mercredi, réduis à 25 minutes.'),
  ],

  // Wk5 : base Mar EF | Jeu tempo | Sam EF | Dim SL 90
  // Lun côtes | Mar EF | [Mer repos] | Jeu tempo | Ven EF | Sam EF | Dim SL = 6 sessions
  5: [
    COTES[5],
    ef('Vendredi', '40 min',
      '40 min très faciles à {{P}}. Récupération active après le tempo du jeudi. Volume de fin de semaine avant la grande sortie longue de 90 min dimanche.',
      'RPE 3/10 · Jambes légères, allure très facile.'),
  ],

  // Wk6 : base Mar EF | Jeu tempo | Sam EF | Dim SL 100
  // Lun côtes | Mar EF | [Mer repos] | Jeu tempo | Ven EF | Sam EF | Dim SL = 6 sessions
  6: [
    COTES[6],
    ef('Vendredi', '40 min',
      '40 min très faciles à {{P}}. Récupération active après le tempo de 2 × 20 min. Prépare les jambes pour la sortie longue avec encart allure semi du dimanche.',
      'RPE 3/10 · Vraiment facile, sans exception.'),
  ],

  // Wk7 : base Mar EF | Mer tempo | Ven frac | Dim SL 105
  // Lun côtes | Mar EF | Mer qualité | Jeu EF (récup) | Ven qualité | [Sam repos] | Dim SL = 6 sessions
  7: [
    COTES[7],
    ef('Jeudi', '40 min',
      '40 min très faciles à {{P}}. Récupération entre les 3 × 15 min du mercredi et les 6 × 1000m du vendredi. Ce footing est indispensable pour tenir la qualité du vendredi.',
      'RPE 3/10 · Semaine de charge élevée — le jeudi actif est une priorité.'),
  ],

  // Wk8 : base Mar EF | Mer tempo | Ven frac | Dim SL 110
  // Même structure que wk7, pic de charge
  8: [
    COTES[8],
    ef('Jeudi', '40 min',
      '40 min très faciles à {{P}}. Récupération entre le seuil du mercredi et les 8 × 1000m du vendredi. La semaine de pic de charge exige un jeudi vraiment facile.',
      'RPE 3/10 · Semaine de pic de charge — soigne ce footing de récupération.'),
  ],

  // Wk9 : base Mar EF | Jeu spécif 3×5km | Sam EF | Dim SL
  // Lun côtes | Mar EF | [Mer repos] | Jeu spécif | Ven EF | Sam EF | Dim SL = 6 sessions
  9: [
    COTES[9],
    ef('Vendredi', '45 min',
      '45 min très faciles à {{P}}. Récupération après la séance spécifique du jeudi. Prépare la sortie longue du dimanche, ta dernière grande répétition avant l\'affûtage.',
      'RPE 3/10 · Facile, sans exception.', [[60, 60]]),
  ],

  // Wk10 : base Mar EF | Jeu spécif 4×5km | Sam EF | Dim SL
  // Lun côtes | Mar EF | [Mer repos] | Jeu spécif | Ven EF | Sam EF | Dim SL = 6 sessions
  10: [
    COTES[10],
    ef('Vendredi', '45 min',
      '45 min très faciles à {{P}}. Récupération après les 4 × 5 km du jeudi. Les séances dures sont terminées, tu entres dans l\'affûtage.',
      'RPE 3/10 · Dernière sortie à volume plein avant l\'allégement.', [[60, 60]]),
  ],

  // Wk11 (affûtage) : 1 seul extra EF 40min sur Lundi.
  // La base a déjà Mar EF 45min + Jeu seuil réduit + Sam EF 35min = 3 séances.
  // 1 extra → 4 séances au total, volume allégé respecté.
  11: [
    ef('Lundi', '40 min',
      '40 min très légères à {{P}}. Maintien du volume pendant l\'affûtage. Repos mercredi avant la séance de seuil réduite du jeudi.',
      'RPE 2-3/10 · L\'objectif est d\'arriver frais au départ, pas de s\'entraîner.', [[60, 60]]),
  ],

  // Wk12 : ignorée (déjà 4 séances dans la base).
}

module.exports = base.map(week => {
  const extras = EXTRAS_BY_WEEK[week.num]
  if (!extras || extras.length === 0) return week
  return {
    ...week,
    seances: [...week.seances, ...extras],
  }
})
