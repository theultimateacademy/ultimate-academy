// Trame 5 séances/semaine, Ebook Semi-marathon, 12 semaines.
// Base = la trame 4 séances + 1 footing EF supplémentaire par semaine.
// Semaine 12 (Semaine de course) déjà à 4 séances, ignorée ici.
const base = require('./semaines-4-i.js')

const EXTRA_JOUR = {
  1:'Vendredi', 2:'Vendredi',
  3:'Samedi',   4:'Samedi',
  5:'Vendredi', 6:'Jeudi',
  7:'Samedi',   8:'Jeudi',
  9:'Lundi',   10:'Lundi',
  11:'Lundi',
}

const EXTRA_BY_PHASE = {
  'Adaptation': {
    duree:'40 min', pcts:[[60,65]],
    corps:'40 min très faciles à {{P}}. Une sortie de plus pour augmenter doucement ton volume hebdomadaire sans ajouter de fatigue.',
    note:'RPE 3/10 · Cours au ressenti, sans pression.',
  },
  'Développement aérobie': {
    duree:'40 min', pcts:[[65,70]],
    corps:'40 min à {{P}}. Volume qui prépare le corps aux séances de qualité plus loin dans la semaine.',
    note:'RPE 4/10 · Reste sur une sensation facile, ce n\'est pas une séance à pousser.',
  },
  'Volume': {
    duree:'40 min', pcts:[[60,65]],
    corps:'40 min très faciles à {{P}}. La semaine de volume est intense, cette sortie reste légère pour ne pas freiner ta récupération.',
    note:'RPE 3/10 · Si tu sens la fatigue, raccourcis à 25 minutes.',
  },
  'Intensification': {
    duree:'40 min', pcts:[[60,65]],
    corps:'40 min très faciles à {{P}}. Avec deux séances très dures cette semaine, cette sortie reste légère pour ne pas accumuler de fatigue.',
    note:'RPE 3/10 · Si tu sens la fatigue s\'accumuler, raccourcis à 25 minutes.',
  },
  'Spécificité semi': {
    duree:'45 min', pcts:[[60,60]],
    corps:'45 min à {{P}}. Semaine spécifique chargée, cette sortie absorbe la charge et prépare la sortie longue du dimanche.',
    note:'RPE 3/10 · Facile, sans exception.',
  },
  'Consolidation': {
    duree:'40 min', pcts:[[60,60]],
    corps:'40 min très légères à {{P}}. Garder les jambes en mouvement avant la semaine de course.',
    note:'RPE 2-3/10 · Volume minimal, l\'objectif est d\'arriver frais.',
  },
}

module.exports = base.map(week => {
  const extra = EXTRA_BY_PHASE[week.phase]
  const jour = EXTRA_JOUR[week.num]
  if (!extra || !jour) return week
  return {
    ...week,
    seances: [
      ...week.seances,
      { jour, type:'EF', titre:'Footing EF',
        duree:extra.duree, pcts:extra.pcts,
        echauff:'', corps:extra.corps, retour:'',
        note:extra.note },
    ],
  }
})
