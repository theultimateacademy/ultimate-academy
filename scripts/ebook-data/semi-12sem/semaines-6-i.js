// Trame 6 séances/semaine, Ebook Semi-marathon, 12 semaines.
// Base = la trame 4 séances + 2 séances supplémentaires par semaine.
// Distribution 80:20 : EF de base + variété (côtes, VMA) pour les extras.
// Semaine 11 (affûtage) : 1 seul extra EF 30min, pas 2. Volume réduit.
// Semaine 12 (Semaine de course) : déjà à 4 séances, ignorée ici.
const base = require('./semaines-4-i.js')

// Config par semaine : tableau de 1 ou 2 sessions supplémentaires
const EXTRAS_BY_WEEK = {
  1: [
    { jour:'Lundi',  type:'EF', titre:'Footing EF', duree:'35 min', pcts:[[60,65]],
      echauff:'', retour:'',
      corps:'35 min très faciles à {{P}}. Semaine d\'adaptation, cette sortie légère augmente doucement ton volume sans fatigue.',
      note:'RPE 3/10 · Cours au ressenti, sans pression.' },
    { jour:'Vendredi', type:'EF', titre:'Footing EF', duree:'30 min', pcts:[[60,65]],
      echauff:'', retour:'',
      corps:'30 min très faciles à {{P}}. Fin de semaine légère avant la sortie longue du dimanche.',
      note:'RPE 3/10 · Allure de promenade, jambes décontractées.' },
  ],
  2: [
    { jour:'Lundi',  type:'EF', titre:'Footing EF', duree:'35 min', pcts:[[60,65]],
      echauff:'', retour:'',
      corps:'35 min à {{P}}. Le volume global augmente progressivement. Régularité et décontraction.',
      note:'RPE 3/10 · Foulée légère.' },
    { jour:'Vendredi', type:'EF', titre:'Footing EF', duree:'30 min', pcts:[[60,65]],
      echauff:'', retour:'',
      corps:'30 min très faciles à {{P}}. Prépare les jambes pour le week-end sans les fatiguer.',
      note:'RPE 3/10 · Sortie détendue.' },
  ],
  3: [
    { jour:'Lundi',  type:'EF', titre:'Footing EF', duree:'40 min', pcts:[[65,70]],
      echauff:'', retour:'',
      corps:'40 min à {{P}}. Volume de base qui prépare le corps aux séances de qualité de la semaine.',
      note:'RPE 4/10 · Reste sur une sensation facile.' },
    { jour:'Samedi', type:'Côtes', titre:'Séance côtes',
      duree:'50 min', pcts:[[60,65]],
      echauff:'20 min de footing EF progressif à {{P}}.', retour:'10 min de jogging léger.',
      corps:'8 × 80m en côte à effort maximal. Redescends au trot entre chaque montée. Travail de puissance, foulée et gainage naturel.',
      note:'RPE 9/10 sur les montées · Trouve une côte à 5-8% de pente · Les côtes renforcent les chevilles et genoux.' },
  ],
  4: [
    { jour:'Lundi',  type:'EF', titre:'Footing EF', duree:'40 min', pcts:[[65,70]],
      echauff:'', retour:'',
      corps:'40 min à {{P}}. Volume de base avant les séances clés de la semaine. Régulier et sans forcer.',
      note:'RPE 4/10 · Allure de conversation.' },
    { jour:'Samedi', type:'Côtes', titre:'Séance côtes',
      duree:'50 min', pcts:[[60,65]],
      echauff:'20 min de footing EF progressif à {{P}}.', retour:'10 min de jogging léger.',
      corps:'10 × 80m en côte à effort maximal. Redescends au trot. Deux répétitions de plus que la semaine 3, tu construis ta puissance musculaire.',
      note:'RPE 9/10 sur les montées · Posture droite, poussée des bras, foulée courte.' },
  ],
  5: [
    { jour:'Lundi',  type:'EF', titre:'Footing EF', duree:'35 min', pcts:[[60,65]],
      echauff:'', retour:'',
      corps:'35 min très faciles à {{P}}. La semaine de volume est intense, ces footings restent légers pour ne pas accumuler de fatigue.',
      note:'RPE 3/10 · Si tu sens la fatigue, raccourcis à 20 minutes.' },
    { jour:'Vendredi', type:'EF', titre:'Footing EF', duree:'30 min', pcts:[[60,65]],
      echauff:'', retour:'',
      corps:'30 min très faciles à {{P}}. Semaine de volume maximale. Ce footing prépare la sortie longue du dimanche.',
      note:'RPE 3/10 · Vraiment léger, sans exception.' },
  ],
  6: [
    { jour:'Lundi',  type:'EF', titre:'Footing EF', duree:'35 min', pcts:[[60,65]],
      echauff:'', retour:'',
      corps:'35 min très faciles à {{P}}. Récupération active après le pic de volume. Léger et décontracté.',
      note:'RPE 3/10 · Allure très facile.' },
    { jour:'Jeudi',  type:'EF', titre:'Footing EF', duree:'30 min', pcts:[[60,65]],
      echauff:'', retour:'',
      corps:'30 min très faciles à {{P}}. Volume de base sans rien ajouter à la fatigue de la semaine de volume.',
      note:'RPE 3/10 · Si tu sens de la fatigue, saute cette sortie.' },
  ],
  7: [
    { jour:'Lundi',  type:'EF', titre:'Footing EF', duree:'35 min', pcts:[[60,65]],
      echauff:'', retour:'',
      corps:'35 min très faciles à {{P}}. Semaine de charge maximale, ce footing absorbe la fatigue sans en ajouter.',
      note:'RPE 3/10 · Vraiment léger, sans exception.' },
    { jour:'Samedi', type:'VMA', titre:'Fractionnés VMA 400m',
      duree:'55 min', pcts:[[60,65],[95,95]],
      echauff:'20 min de footing EF progressif à {{P}}.', retour:'10 min de jogging léger.',
      corps:'8 × 400m à {{P}}. Récupération 90 sec au trot entre chaque. Effort intense et contrôlé. Maintiens la même allure du premier au dernier 400m.',
      note:'RPE 9/10 · La VMA développe ton moteur aérobie et te rend plus rapide sur toutes les distances.' },
  ],
  8: [
    { jour:'Lundi',  type:'EF', titre:'Footing EF', duree:'35 min', pcts:[[60,65]],
      echauff:'', retour:'',
      corps:'35 min très faciles à {{P}}. Semaine de charge absolue, ces footings absorbent sans ajouter de fatigue.',
      note:'RPE 3/10 · Vraiment léger, sans exception.' },
    { jour:'Samedi', type:'VMA', titre:'Fractionnés VMA 400m',
      duree:'55 min', pcts:[[60,65],[95,95]],
      echauff:'20 min de footing EF progressif à {{P}}.', retour:'10 min de jogging léger.',
      corps:'10 × 400m à {{P}}. Récupération 90 sec au trot. Deux répétitions de plus que la semaine 7. Maintiens la même allure sur les 10.',
      note:'RPE 9/10 · La séance la plus difficile du plan. Demain, la sortie longue finalise ton pic de préparation.' },
  ],
  9: [
    { jour:'Lundi',  type:'EF', titre:'Footing EF', duree:'35 min', pcts:[[60,60]],
      echauff:'', retour:'',
      corps:'35 min faciles à {{P}}. Récupération active, les séances de spécificité sont les priorités de la semaine.',
      note:'RPE 3/10 · Garde les jambes fraîches pour le jeudi.' },
    { jour:'Mercredi', type:'EF', titre:'Footing EF', duree:'30 min', pcts:[[60,60]],
      echauff:'', retour:'',
      corps:'30 min très faciles à {{P}}. Volume minimal entre les deux séances de qualité. Jambes en mouvement, sans effort.',
      note:'RPE 2-3/10 · Raccourcis à 20 minutes si tu te sens fatigué.' },
  ],
  10: [
    { jour:'Lundi',  type:'EF', titre:'Footing EF', duree:'35 min', pcts:[[60,60]],
      echauff:'', retour:'',
      corps:'35 min faciles à {{P}}. Dernière semaine de charge avant l\'affûtage. Ce footing prépare les 4 × 5 km du jeudi.',
      note:'RPE 3/10 · Facile, sans exception.' },
    { jour:'Mercredi', type:'EF', titre:'Footing EF', duree:'30 min', pcts:[[60,60]],
      echauff:'', retour:'',
      corps:'30 min très faciles à {{P}}. Volume de base entre les deux séances de qualité de la semaine.',
      note:'RPE 2-3/10 · Raccourcis à 20 minutes si besoin.' },
  ],
  // Semaine 11 : affûtage. 1 seul extra EF 30min, pas 2.
  // Le volume est déjà suffisant avec les 3 séances de la base (EF + seuil + EF 35min).
  11: [
    { jour:'Lundi',  type:'EF', titre:'Footing très léger', duree:'30 min', pcts:[[60,60]],
      echauff:'', retour:'',
      corps:'30 min très légères à {{P}}. Maintien minimal du volume pendant l\'affûtage. Jambes qui bougent, rien de plus.',
      note:'RPE 2/10 · L\'objectif est d\'arriver frais au départ, pas de s\'entraîner.' },
  ],
  // Semaine 12 : ignorée (déjà 4 séances dans la base).
}

module.exports = base.map(week => {
  const extras = EXTRAS_BY_WEEK[week.num]
  if (!extras || extras.length === 0) return week
  return {
    ...week,
    seances: [
      ...week.seances,
      ...extras.map(e => ({
        jour:e.jour, type:e.type, titre:e.titre,
        duree:e.duree, pcts:e.pcts,
        echauff:e.echauff, corps:e.corps, retour:e.retour,
        note:e.note,
      })),
    ],
  }
})
