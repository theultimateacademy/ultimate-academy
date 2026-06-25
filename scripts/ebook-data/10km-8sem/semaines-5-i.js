// Trame 5 séances/semaine — Ebook 10km, 8 semaines.
// Base = la trame 4 séances + 1 footing EF supplémentaire par semaine.
const base = require('./semaines-4-i.js')

const EXTRA_JOUR = { 1:'Vendredi', 2:'Vendredi', 3:'Samedi', 4:'Samedi', 5:'Jeudi', 6:'Mercredi', 7:'Vendredi' }

const EXTRA_BY_PHASE = {
  'Adaptation': {
    duree:'40 min', pcts:[[60,65]],
    corps:'40 min très faciles à {{P}}. Une sortie de plus pour augmenter doucement ton volume hebdomadaire sans ajouter de fatigue.',
    note:'RPE 3/10 · Cours au ressenti, sans pression.',
  },
  'Développement': {
    duree:'40 min', pcts:[[65,70]],
    corps:'40 min à {{P}}. Volume qui prépare le corps aux séances de qualité plus loin dans la semaine.',
    note:'RPE 4/10 · Reste sur une sensation facile, ce n\'est pas une séance à pousser.',
  },
  'Intensification': {
    duree:'40 min', pcts:[[60,65]],
    corps:'40 min très faciles à {{P}}. Avec deux séances intenses cette semaine, cette sortie reste volontairement légère pour ne pas freiner ta récupération.',
    note:'RPE 3/10 · Si tu sens la fatigue s\'accumuler, raccourcis à 25 minutes.',
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
