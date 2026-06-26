// Trame 5 séances/semaine, Ebook Semi-marathon, 12 semaines.
// Base = la trame 4 séances + 1 séance supplémentaire par semaine.
//
// Logique de placement :
//  - Base wk1-2,5-6,9-10 : qualité le JEUDI → extra placé VENDREDI (après qualité)
//    ou LUNDI (avant, avec MARDI EF de la base en tampon puis REPOS le MER avant qualité)
//  - Base wk3-4,7-8 : qualité MER + VEN → extra placé SAMEDI (après VEN qualité, avant DIM SL)
//  - Semaine 11 (affûtage) : aucun extra — base (3 séances) suffit
//  - Semaine 12 : déjà 4 séances, ignorée
//
// Variété : côtes en semaine 5 (Lundi), VMA en semaine 9 (Lundi).
// Footings min 40 min. La côte et la VMA sont bien séparées des séances qualité de la base.
const base = require('./semaines-4-i.js')

const EF = (jour, duree, corps, note, pcts = [[60,65]]) => ({
  jour, type:'EF', titre:'Footing EF',
  duree, pcts, echauff:'', corps, retour:'', note,
})

const EXTRA_BY_WEEK = {
  // Wk1 : base Mar EF | Jeu frac | Sam EF 35 | Dim SL
  // Extra Vendredi : Jeu qualité → Ven EF → Sam EF → Dim SL
  1: EF('Vendredi','40 min',
    '40 min à {{P}}. Récupération active après les 6 × 800m du jeudi. Jambes en mouvement, allure très facile.',
    'RPE 3/10 · Tu dois finir frais, sans aucune fatigue.',[[60,65]]),

  // Wk2 : même structure
  2: EF('Vendredi','40 min',
    '40 min à {{P}}. Volume supplémentaire en récupération. Cette sortie prépare ta base aérobie avant les séances de seuil.',
    'RPE 3/10 · Allure de conversation.',[[60,65]]),

  // Wk3 : base Mar EF | Mer tempo | Ven frac | Dim SL
  // Extra Samedi : Ven qualité → Sam EF → Dim SL (2 séances faciles après la qualité)
  3: EF('Samedi','45 min',
    '45 min à {{P}}. Récupération active entre la séance de vendredi et la sortie longue du dimanche. Volume progressif.',
    'RPE 3/10 · Cours détendu, allure confortable.',[[60,65]]),

  // Wk4 : même structure que wk3
  4: EF('Samedi','45 min',
    '45 min à {{P}}. Récupération avant la sortie longue du dimanche. Cette sortie ancre la progression du volume hebdomadaire.',
    'RPE 4/10 · Foulée légère, respiration nasale si possible.',[[65,70]]),

  // Wk5 : base Mar EF | Jeu tempo | Sam EF | Dim SL 90
  // Extra Lundi : Côtes — isolation parfaite : Lun côtes | Mar EF (tampon) | Mer REPOS | Jeu tempo
  5: {
    jour:'Lundi', type:'Côtes', titre:'Séance côtes',
    duree:'50 min', pcts:[[60,65]],
    echauff:'20 min de footing EF progressif à {{P}}.',
    corps:'8 × 80m en côte à effort maximal. Redescends au trot entre chaque. Travail de puissance, foulée et gainage. Première séance côtes du plan.',
    retour:'10 min de jogging léger.',
    note:'RPE 9/10 sur les montées · Côte à 5-8% de pente · 2 jours de récup avant le tempo de jeudi.',
  },

  // Wk6 : base Mar EF | Jeu tempo | Sam EF | Dim SL 100
  // Extra Vendredi : Jeu qualité → Ven EF → Sam EF → Dim SL (récupération)
  6: EF('Vendredi','40 min',
    '40 min très faciles à {{P}}. Récupération après le tempo du jeudi, préparation à la grande sortie longue de dimanche.',
    'RPE 3/10 · Vraiment léger, jambes décontractées.',[[60,65]]),

  // Wk7 : base Mar EF | Mer tempo | Ven frac | Dim SL 105
  // Extra Samedi : Ven qualité → Sam EF → Dim SL (récupération avant le gros SL)
  7: EF('Samedi','45 min',
    '45 min à {{P}}. Récupération active entre les fractionnés de vendredi et la sortie longue de dimanche. Volume maintenu sans fatigue.',
    'RPE 3/10 · Facile, sans exception. Le dimanche est ta séance la plus importante.',[[60,65]]),

  // Wk8 : base Mar EF | Mer tempo | Ven frac | Dim SL 110
  // Extra Samedi : même logique, avant le plus gros SL du plan
  8: EF('Samedi','45 min',
    '45 min à {{P}}. Activation légère avant la sortie longue de 110 min de demain. Volume minimal, jambes disponibles.',
    'RPE 3/10 · Si tu te sens fatigué, réduis à 30 minutes.',[[60,65]]),

  // Wk9 : base Mar EF | Jeu spécif 3×5km | Sam EF | Dim SL
  // Extra Lundi : VMA — isolation parfaite : Lun VMA | Mar EF (tampon) | Mer REPOS | Jeu spécif
  9: {
    jour:'Lundi', type:'VMA', titre:'Fractionnés VMA 400m',
    duree:'55 min', pcts:[[60,65],[95,95]],
    echauff:'20 min de footing EF progressif à {{P}}.',
    corps:'8 × 400m à {{P}}. Récupération 90 sec au trot. Effort intense et contrôlé. Maintiens la même allure du 1er au 8e. Mardi EF et mercredi repos assurent la récupération avant le spécifique du jeudi.',
    retour:'10 min de jogging léger.',
    note:'RPE 9/10 · La VMA développe ton moteur et te rend plus rapide sur toutes les distances.',
  },

  // Wk10 : base Mar EF | Jeu spécif 4×5km | Sam EF | Dim SL
  // Extra Vendredi : Jeu qualité → Ven EF → Sam EF → Dim SL (deux EF de récupération)
  10: EF('Vendredi','40 min',
    '40 min très faciles à {{P}}. Récupération après les 4 × 5 km du jeudi. Deux EF légers (vendredi + samedi) avant la grande sortie longue de dimanche.',
    'RPE 3/10 · Allure de récupération, aucun effort.',[[60,60]]),

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
