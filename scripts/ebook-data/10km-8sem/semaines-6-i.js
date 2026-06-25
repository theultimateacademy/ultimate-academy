// Trame 6 séances/semaine — Ebook 10km, 8 semaines.
// Base = la trame 4 séances + 2 footings EF supplémentaires chaque semaine pleine.
// Les 6 séances sont toutes de la course à pied (pas de renforcement inclus dans
// cette variante — à l'athlète de le caler de son côté en plus du plan).
const base = require('./semaines-4-i.js')

// Jours libres choisis pour ne jamais coller deux séances exigeantes.
const EXTRA_DAYS = {
  1: ['Lundi', 'Mercredi'],
  2: ['Lundi', 'Mercredi'],
  3: ['Lundi', 'Samedi'],
  4: ['Lundi', 'Samedi'],
  5: ['Lundi', 'Jeudi'],
  6: ['Lundi', 'Mercredi'],
  7: ['Lundi'],
}

const EXTRA_BY_PHASE = {
  'Adaptation': [
    { duree:'30 min', pcts:[[60,65]],
      corps:'30 min très faciles à {{P}}. Une sortie de plus pour augmenter doucement ton volume hebdomadaire sans ajouter de fatigue.',
      note:'RPE 3/10 · Cours au ressenti, sans pression.' },
    { duree:'35 min', pcts:[[65,65]],
      corps:'35 min à {{P}}. Profite de cette sortie pour travailler ta technique de course, relâché et régulier.',
      note:'RPE 3-4/10 · Concentre-toi sur ta foulée plus que sur l\'allure.' },
  ],
  'Développement': [
    { duree:'35 min', pcts:[[65,70]],
      corps:'35 min à {{P}}. Volume supplémentaire qui prépare le corps aux séances de qualité plus loin dans la semaine.',
      note:'RPE 4/10 · Reste sur une sensation facile, ce n\'est pas une séance de plus à pousser.' },
    { duree:'40 min', pcts:[[65,70]],
      corps:'40 min à {{P}}. Régulier et facile, ce volume supplémentaire est ce qui distingue un plan à 6 séances d\'un plan à 4.', retour:'',
      note:'RPE 4/10 · Le bénéfice vient de la régularité, pas de la vitesse.' },
  ],
  'Intensification': [
    { duree:'35 min', pcts:[[60,65]],
      corps:'35 min très faciles à {{P}}. Avec deux séances intenses cette semaine, cette sortie reste volontairement légère pour ne pas freiner ta récupération.',
      note:'RPE 3/10 · Si tu sens la fatigue s\'accumuler, raccourcis à 25 minutes plutôt que d\'accélérer.' },
    { duree:'30 min', pcts:[[60,65]],
      corps:'30 min très faciles à {{P}}. Deuxième sortie de récupération de la semaine, encore plus courte que la première.',
      note:'RPE 3/10 · Cette semaine est chargée, ces footings servent uniquement à absorber la charge.' },
  ],
  'Affûtage': [
    { duree:'20 min', pcts:[[60,60]],
      corps:'20 min très légères à {{P}}. Juste de quoi garder les jambes en mouvement avant la fin de l\'affûtage.',
      note:'RPE 2-3/10 · Volume minimal, l\'objectif est d\'arriver frais.' },
  ],
}

module.exports = base.map(week => {
  const extras = EXTRA_BY_PHASE[week.phase]
  const days = EXTRA_DAYS[week.num]
  if (!extras || !days) return week
  const extraSessions = days.map((jour, i) => ({
    jour, type:'EF', titre:i === 0 ? 'Footing EF supplémentaire' : 'Footing EF complémentaire',
    duree: extras[i].duree, pcts: extras[i].pcts,
    echauff:'', corps: extras[i].corps, retour:'', note: extras[i].note,
  }))
  return { ...week, seances: [...extraSessions, ...week.seances] }
})
