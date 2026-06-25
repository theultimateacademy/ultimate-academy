// Trame 5 séances/semaine — Ebook 10km, 8 semaines.
// Base = la trame 4 séances (déjà validée), + 1 séance de renforcement musculaire
// hebdomadaire (sauf semaine de course, où le taper prime). Contenu du renforcement
// qui monte en intensité avec les phases, comme le reste du plan.
const base = require('./semaines-4-i.js')

const RENFO_JOUR = { 1:'Vendredi', 2:'Vendredi', 3:'Samedi', 4:'Samedi', 5:'Jeudi', 6:'Mercredi', 7:'Vendredi' }

const RENFO_BY_PHASE = {
  'Adaptation': {
    duree:'20 min',
    corps:'Gainage planche 3 × 30 sec · Squats 3 × 15 · Fentes avant 3 × 10 par jambe. Récupération 30 sec entre chaque série. Mouvements lents et contrôlés, pas de précipitation.',
    note:'Construit les fondations qui protègent tes genoux, hanches et chevilles sur la durée du plan.',
  },
  'Développement': {
    duree:'22 min',
    corps:'Gainage latéral 3 × 30 sec par côté · Squats sautés légers 3 × 10 · Fentes latérales 3 × 10 par jambe · Mollets debout 3 × 20. Récupération 30 sec entre chaque série.',
    note:'Le travail latéral stabilise ton bassin, essentiel quand la fatigue s\'installe en course.',
  },
  'Intensification': {
    duree:'25 min',
    corps:'Gainage dynamique (mountain climbers) 3 × 20 · Squats bulgares 3 × 10 par jambe · Corde à sauter ou talons-fesses 3 × 30 sec · Gainage planche 3 × 40 sec. Récupération 30 sec entre chaque série.',
    note:'Le pic de renforcement coïncide avec le pic d\'intensité course à pied — ton corps absorbe mieux la charge.',
  },
  'Consolidation': {
    duree:'15 min',
    corps:'Gainage planche 2 × 20 sec · Squats au poids du corps 2 × 12 · Quelques étirements actifs des mollets et ischio-jambiers. Volume très réduit, l\'objectif est d\'entretenir, pas de fatiguer.',
    note:'Léger volontairement : tes muscles doivent récupérer, pas travailler.',
  },
}

module.exports = base.map(week => {
  const renfo = RENFO_BY_PHASE[week.phase]
  if (!renfo || !RENFO_JOUR[week.num]) return week
  return {
    ...week,
    seances: [
      ...week.seances,
      { jour:RENFO_JOUR[week.num], type:'Renforcement', titre:'Renforcement musculaire', duree:renfo.duree,
        echauff:'', corps:renfo.corps, retour:'',
        note:renfo.note },
    ],
  }
})
