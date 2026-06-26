// Trame 5 séances/semaine, Ebook Semi-marathon, 12 semaines.
// Base = la trame 4 séances + 1 séance supplémentaire par semaine.
// Variété : EF en adaptation, côtes en volume, VMA en intensification.
// Semaine 11 (affûtage) : aucun extra, le volume de la base suffit.
// Semaine 12 (Semaine de course) : déjà à 4 séances, ignorée ici.
const base = require('./semaines-4-i.js')

// Config par semaine : null = pas d'extra (affûtage ou semaine de course)
const EXTRA_BY_WEEK = {
  1: { jour:'Vendredi', type:'EF', titre:'Footing EF',
    duree:'35 min', pcts:[[60,65]],
    echauff:'', retour:'',
    corps:'35 min très faciles à {{P}}. Semaine d\'adaptation, cette sortie en douceur construit ta base aérobie sans stress.',
    note:'RPE 3/10 · Cours au ressenti, sans montre.' },

  2: { jour:'Vendredi', type:'EF', titre:'Footing EF',
    duree:'35 min', pcts:[[60,65]],
    echauff:'', retour:'',
    corps:'35 min faciles à {{P}}. Le volume augmente doucement. Régularité et décontraction.',
    note:'RPE 3/10 · Allure de conversation obligatoire.' },

  3: { jour:'Samedi', type:'EF', titre:'Footing EF',
    duree:'40 min', pcts:[[65,70]],
    echauff:'', retour:'',
    corps:'40 min à {{P}}. Volume de base qui prépare le corps aux séances de qualité. Régulier et détendu.',
    note:'RPE 4/10 · Reste sur une sensation facile.' },

  4: { jour:'Samedi', type:'EF', titre:'Footing EF',
    duree:'40 min', pcts:[[65,70]],
    echauff:'', retour:'',
    corps:'40 min à {{P}}. Le volume augmente progressivement. Cette sortie prépare la sortie longue du dimanche.',
    note:'RPE 4/10 · Foulée légère, sans forcer.' },

  5: { jour:'Vendredi', type:'Côtes', titre:'Séance côtes',
    duree:'50 min', pcts:[[60,65]],
    echauff:'20 min de footing EF progressif à {{P}}.', retour:'10 min de jogging léger.',
    corps:'8 × 80m en côte à effort maximal. Redescends au trot entre chaque montée. Travail de puissance, foulée et gainage naturel.',
    note:'RPE 9/10 sur les montées · Trouve une côte à 5-8% de pente · Les côtes protègent contre les blessures.' },

  6: { jour:'Jeudi', type:'EF', titre:'Footing EF',
    duree:'35 min', pcts:[[60,65]],
    echauff:'', retour:'',
    corps:'35 min très faciles à {{P}}. Récupération active après la semaine de volume maximale. Léger, sans aucun effort.',
    note:'RPE 3/10 · Si tu sens de la fatigue résiduelle, raccourcis à 20 minutes.' },

  7: { jour:'Samedi', type:'VMA', titre:'Fractionnés VMA 400m',
    duree:'55 min', pcts:[[60,65],[95,95]],
    echauff:'20 min de footing EF progressif à {{P}}.', retour:'10 min de jogging léger.',
    corps:'8 × 400m à {{P}}. Récupération 90 sec au trot entre chaque. Effort intense et contrôlé. Maintiens la même allure du premier au dernier 400m.',
    note:'RPE 9/10 · La VMA développe ton moteur aérobie et te rend plus rapide sur toutes les distances.' },

  8: { jour:'Lundi', type:'Côtes', titre:'Séance côtes',
    duree:'50 min', pcts:[[60,65]],
    echauff:'20 min de footing EF progressif à {{P}}.', retour:'10 min de jogging léger.',
    corps:'10 × 80m en côte à effort maximal. Redescends au trot. Tu prépares tes jambes à la phase de spécificité, deux répétitions de plus que la semaine 5.',
    note:'RPE 9/10 sur les montées · Posture droite, poussée des bras, foulée courte et dynamique.' },

  9: { jour:'Lundi', type:'EF', titre:'Footing EF',
    duree:'35 min', pcts:[[60,65]],
    echauff:'', retour:'',
    corps:'35 min faciles à {{P}}. Récupération active, les séances de spécificité sont les priorités de la semaine. Garde les jambes fraîches pour le jeudi.',
    note:'RPE 3/10 · Volume minimal, séances spécifiques prioritaires.' },

  10: { jour:'Lundi', type:'EF', titre:'Footing EF',
    duree:'35 min', pcts:[[60,65]],
    echauff:'', retour:'',
    corps:'35 min faciles à {{P}}. Ta dernière semaine chargée. Ce footing prépare les 4 × 5 km du jeudi sans t\'entamer.',
    note:'RPE 3/10 · Facile, sans exception.' },

  // Semaine 11 : affûtage, aucun extra. La base (3 séances) suffit.
  // Semaine 12 : ignorée (déjà 4 séances dans la base).
}

module.exports = base.map(week => {
  const extra = EXTRA_BY_WEEK[week.num]
  if (!extra) return week
  return {
    ...week,
    seances: [
      ...week.seances,
      { jour:extra.jour, type:extra.type, titre:extra.titre,
        duree:extra.duree, pcts:extra.pcts,
        echauff:extra.echauff, corps:extra.corps, retour:extra.retour,
        note:extra.note },
    ],
  }
})
