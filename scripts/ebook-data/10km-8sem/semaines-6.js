// Trame 6 séances/semaine — Ebook 10km, 8 semaines.
// Base = la trame 5 séances (4 séances + renforcement), + 1 footing EF supplémentaire
// chaque semaine pleine. Volume total le plus élevé du plan, mais toujours un footing
// facile (jamais une 2e séance dure) pour respecter la règle 80/20 et la progressivité.
const base = require('./semaines-5.js')

const EXTRA_JOUR = { 1:'Lundi', 2:'Lundi', 3:'Lundi', 4:'Lundi', 5:'Lundi', 6:'Lundi', 7:'Lundi' }

const EXTRA_BY_PHASE = {
  'Adaptation': { duree:'30 min', pcts:[[60,65]],
    corps:'30 min très faciles à {{P}}. Une sixième sortie pour augmenter doucement ton volume hebdomadaire sans ajouter de fatigue.',
    note:'RPE 3/10 · Cours au ressenti, sans pression.' },
  'Développement': { duree:'35 min', pcts:[[65,70]],
    corps:'35 min à {{P}}. Volume supplémentaire qui prépare le corps aux séances de qualité plus loin dans la semaine.',
    note:'RPE 4/10 · Reste sur une sensation facile, ce n\'est pas une séance de plus à pousser.' },
  'Intensification': { duree:'35 min', pcts:[[60,65]],
    corps:'35 min très faciles à {{P}}. Avec deux séances intenses cette semaine, cette sortie reste volontairement légère pour ne pas freiner ta récupération.',
    note:'RPE 3/10 · Si tu sens la fatigue s\'accumuler, raccourcis à 25 minutes plutôt que d\'accélérer.' },
  'Affûtage': { duree:'20 min', pcts:[[60,60]],
    corps:'20 min très légères à {{P}}. Juste de quoi garder les jambes en mouvement avant la fin de l\'affûtage.',
    note:'RPE 2-3/10 · Volume minimal, l\'objectif est d\'arriver frais.' },
}

module.exports = base.map(week => {
  const extra = EXTRA_BY_PHASE[week.phase]
  if (!extra || !EXTRA_JOUR[week.num]) return week
  return {
    ...week,
    seances: [
      { jour:EXTRA_JOUR[week.num], type:'EF', titre:'Footing EF supplémentaire', duree:extra.duree, pcts:extra.pcts,
        echauff:'', corps:extra.corps, retour:'', note:extra.note },
      ...week.seances,
    ],
  }
})
