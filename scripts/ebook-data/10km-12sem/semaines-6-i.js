// Trame 6 séances/semaine — Ebook 10km, 12 semaines.
// Base = la trame 4 séances + 2 footings EF chaque semaine pleine.
// Semaine 12 (Semaine de course) déjà à 4 séances, ignorée ici.
const base = require('./semaines-4-i.js')

// Jours libres choisis pour ne jamais coller deux séances exigeantes.
const EXTRA_DAYS = {
  1:  ['Lundi', 'Vendredi'],
  2:  ['Lundi', 'Vendredi'],
  3:  ['Lundi', 'Samedi'],
  4:  ['Lundi', 'Samedi'],
  5:  ['Lundi', 'Vendredi'],
  6:  ['Lundi', 'Jeudi'],
  7:  ['Lundi', 'Samedi'],
  8:  ['Lundi', 'Jeudi'],
  9:  ['Lundi', 'Mercredi'],
  10: ['Lundi', 'Mercredi'],
  11: ['Lundi', 'Mercredi'],
}

const EXTRA_BY_PHASE = {
  'Adaptation': [
    { duree:'40 min', pcts:[[60,65]],
      corps:'40 min très faciles à {{P}}. Une sortie de plus pour augmenter doucement ton volume hebdomadaire sans ajouter de fatigue.',
      note:'RPE 3/10 · Cours au ressenti, sans pression.' },
    { duree:'40 min', pcts:[[65,65]],
      corps:'40 min à {{P}}. Profite de cette sortie pour travailler ta technique de course, relâché et régulier.',
      note:'RPE 3-4/10 · Concentre-toi sur ta foulée plus que sur l\'allure.' },
  ],
  'Développement aérobie': [
    { duree:'40 min', pcts:[[65,70]],
      corps:'40 min à {{P}}. Volume qui prépare le corps aux séances de qualité plus loin dans la semaine.',
      note:'RPE 4/10 · Reste sur une sensation facile, ce n\'est pas une séance à pousser.' },
    { duree:'40 min', pcts:[[65,70]],
      corps:'40 min à {{P}}. Régulier et facile, ce volume est ce qui distingue un plan à 6 séances d\'un plan à 4.',
      note:'RPE 4/10 · Le bénéfice vient de la régularité, pas de la vitesse.' },
  ],
  'Développement VMA': [
    { duree:'40 min', pcts:[[60,65]],
      corps:'40 min très faciles à {{P}}. Cette semaine est intense — cette sortie reste volontairement légère pour ne pas freiner ta récupération.',
      note:'RPE 3/10 · Si tu sens la fatigue, raccourcis à 25 minutes.' },
    { duree:'35 min', pcts:[[60,65]],
      corps:'35 min très faciles à {{P}}. Deuxième sortie de récupération de la semaine, encore plus courte que la première.',
      note:'RPE 3/10 · Ces footings servent uniquement à absorber la charge.' },
  ],
  'Intensification': [
    { duree:'40 min', pcts:[[60,65]],
      corps:'40 min très faciles à {{P}}. Avec deux séances intenses cette semaine, cette sortie reste volontairement légère pour ne pas freiner ta récupération.',
      note:'RPE 3/10 · Si tu sens la fatigue s\'accumuler, raccourcis à 25 minutes plutôt que d\'accélérer.' },
    { duree:'30 min', pcts:[[60,65]],
      corps:'30 min très faciles à {{P}}. Deuxième sortie de récupération de la semaine, encore plus courte que la première.',
      note:'RPE 3/10 · Cette semaine est chargée, ces footings servent uniquement à absorber la charge.' },
  ],
  'Spécificité': [
    { duree:'45 min', pcts:[[60,60]],
      corps:'45 min à {{P}}. Semaine spécifique chargée — cette sortie absorbe la charge et prépare la sortie longue du dimanche.',
      note:'RPE 3/10 · Facile, sans exception.' },
    { duree:'35 min', pcts:[[60,60]],
      corps:'35 min à {{P}}. Deuxième sortie EF de la semaine, très légère. Elle entretient le volume sans ajouter de fatigue.',
      note:'RPE 3/10 · Encore plus facile que la première.' },
  ],
  'Consolidation': [
    { duree:'40 min', pcts:[[60,60]],
      corps:'40 min très légères à {{P}}. Garder les jambes en mouvement avant la semaine de course.',
      note:'RPE 2-3/10 · Volume minimal, l\'objectif est d\'arriver frais.' },
    { duree:'30 min', pcts:[[60,60]],
      corps:'30 min très légères à {{P}}. Deuxième sortie de consolidation, encore plus courte.',
      note:'RPE 2/10 · Ultra léger. Tu arrives frais à la semaine de course.' },
  ],
}

module.exports = base.map(week => {
  const extras = EXTRA_BY_PHASE[week.phase]
  const days = EXTRA_DAYS[week.num]
  if (!extras || !days) return week
  const extraSessions = days.map((jour, i) => ({
    jour, type:'EF', titre:'Footing EF',
    duree: extras[i].duree, pcts: extras[i].pcts,
    echauff:'', corps: extras[i].corps, retour:'', note: extras[i].note,
  }))
  return { ...week, seances: [...extraSessions, ...week.seances] }
})
