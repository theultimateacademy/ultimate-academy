// Trame 6 séances/semaine — Ebook Semi-marathon, 12 semaines.
// Base = la trame 4 séances + 2 footings EF supplémentaires par semaine.
// Semaine 12 (Semaine de course) déjà à 4 séances, ignorée ici.
const base = require('./semaines-4-i.js')

const EXTRA_DAYS = {
  1:  ['Lundi','Vendredi'],
  2:  ['Lundi','Vendredi'],
  3:  ['Lundi','Samedi'],
  4:  ['Lundi','Samedi'],
  5:  ['Lundi','Vendredi'],
  6:  ['Lundi','Jeudi'],
  7:  ['Lundi','Samedi'],
  8:  ['Lundi','Jeudi'],
  9:  ['Lundi','Mercredi'],
  10: ['Lundi','Mercredi'],
  11: ['Lundi','Mercredi'],
}

const EXTRA_BY_PHASE = {
  'Adaptation': {
    duree:'35 min', pcts:[[60,65]],
    corps:'35 min très faciles à {{P}}. Volume supplémentaire pour ton profil 6 séances. Cours au ressenti, sans pression.',
    note:'RPE 3/10 · Ces footings supplémentaires construisent ta base aérobie sans ajouter de fatigue.',
  },
  'Développement aérobie': {
    duree:'40 min', pcts:[[65,70]],
    corps:'40 min à {{P}}. Volume de base qui prépare le corps aux séances de qualité. Régulier et détendu.',
    note:'RPE 4/10 · Reste sur une sensation facile.',
  },
  'Volume': {
    duree:'35 min', pcts:[[60,65]],
    corps:'35 min très faciles à {{P}}. La semaine de volume est intense — ces footings restent légers pour ne pas accumuler de fatigue.',
    note:'RPE 3/10 · Si tu sens la fatigue s\'installer, raccourcis à 20 minutes.',
  },
  'Intensification': {
    duree:'35 min', pcts:[[60,65]],
    corps:'35 min très faciles à {{P}}. Semaine de charge maximale — ces footings absorbent la fatigue sans en ajouter.',
    note:'RPE 3/10 · Vraiment léger, sans exception.',
  },
  'Spécificité semi': {
    duree:'40 min', pcts:[[60,60]],
    corps:'40 min à {{P}}. Semaine spécifique chargée — ces footings absorbent la charge et préservent la récupération.',
    note:'RPE 2-3/10 · Facile, sans exception.',
  },
  'Consolidation': {
    duree:'35 min', pcts:[[60,60]],
    corps:'35 min très légères à {{P}}. Garder les jambes en mouvement avant la semaine de course. Très court, sans effort.',
    note:'RPE 2/10 · Volume minimal, l\'objectif est d\'arriver frais au départ.',
  },
}

module.exports = base.map(week => {
  const extra = EXTRA_BY_PHASE[week.phase]
  const jours = EXTRA_DAYS[week.num]
  if (!extra || !jours) return week
  return {
    ...week,
    seances: [
      ...week.seances,
      ...jours.map(jour => ({
        jour, type:'EF', titre:'Footing EF',
        duree:extra.duree, pcts:extra.pcts,
        echauff:'', corps:extra.corps, retour:'',
        note:extra.note,
      })),
    ],
  }
})
