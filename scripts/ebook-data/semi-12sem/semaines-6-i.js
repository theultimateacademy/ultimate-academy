// Trame 6 séances/semaine, Ebook Semi-marathon, 12 semaines.
// Base = la trame 4 séances + 2 séances supplémentaires par semaine.
//
// Logique de placement des extras (semaine par semaine) :
//  - Wk1-2 (qualité Jeudi) : Lundi EF + Vendredi EF
//    → Lun EF | Mar EF-base | [Mer repos] | Jeu qualité | Ven EF | Sam EF-base | Dim SL
//    Le repos mercredi sépare le bloc EF lun-mar de la séance du jeudi.
//  - Wk3-4 (qualités Mercredi + Vendredi) : Jeudi EF + Samedi EF
//    → Mar EF-base | Mer qualité | Jeu EF (récup) | Ven qualité | Sam EF | Dim SL
//    Jeudi EF = récupération entre deux séances de qualité.
//  - Wk5 (qualité Jeudi) : Lundi Côtes + Vendredi EF
//    → Lun côtes | Mar EF-base | [Mer repos] | Jeu qualité | Ven EF | Sam EF-base | Dim SL
//    2 jours entre les côtes et le tempo du jeudi.
//  - Wk6 (qualité Jeudi) : Lundi EF + Vendredi EF
//    → Même structure que wk1-2 (repos mercredi entre EF-block et qualité)
//  - Wk7-8 (qualités Mercredi + Vendredi) : Jeudi EF + Samedi EF
//    → Même structure que wk3-4 (jeudi = récupération entre deux qualités)
//  - Wk9 (qualité Jeudi) : Lundi VMA + Vendredi EF
//    → Lun VMA | Mar EF-base | [Mer repos] | Jeu spécif | Ven EF | Sam EF-base | Dim SL
//    2 jours entre VMA et la séance spécifique.
//  - Wk10 (qualité Jeudi) : Lundi EF + Vendredi EF
//    → Même structure que wk1-2
//  - Wk11 (affûtage) : 1 seul extra — Lundi EF 40min. La base (3 séances) + 1 EF = 4 séances max.
//  - Wk12 : ignorée (déjà 4 séances dans la base).
//
// Footings min 40 min. Côtes sem.5, VMA sem.9 — progressifs et bien séparés.
const base = require('./semaines-4-i.js')

const ef = (jour, duree, corps, note, pcts = [[60,65]]) => ({
  jour, type:'EF', titre:'Footing EF',
  duree, pcts, echauff:'', corps, retour:'', note,
})

const EXTRAS_BY_WEEK = {
  // Wk1 : base Mardi EF | Jeudi frac | Samedi EF 35 | Dimanche SL
  1: [
    ef('Lundi','40 min',
      '40 min à {{P}}. Volume supplémentaire dès lundi, avec un repos le mercredi avant la qualité du jeudi. Sortie légère, allure très facile.',
      'RPE 3/10 · Cours au ressenti, sans pression.'),
    ef('Vendredi','40 min',
      '40 min à {{P}}. Récupération après les fractionnés du jeudi et préparation à la sortie longue du dimanche.',
      'RPE 3/10 · Allure de conversation, jambes décontractées.'),
  ],

  // Wk2 : même structure
  2: [
    ef('Lundi','40 min',
      '40 min à {{P}}. Deuxième semaine d\'adaptation, le volume augmente progressivement. Lundi léger, repos mercredi, qualité jeudi.',
      'RPE 3/10 · Foulée légère.'),
    ef('Vendredi','40 min',
      '40 min à {{P}}. Sortie de récupération après les 8 × 800m du jeudi. Prépare la sortie longue du week-end.',
      'RPE 3/10 · Vraiment facile.'),
  ],

  // Wk3 : base Mardi EF | Mercredi tempo | Vendredi frac | Dimanche SL
  // Extras Jeudi + Samedi : séparent et encadrent les deux séances de qualité
  3: [
    ef('Jeudi','40 min',
      '40 min très faciles à {{P}}. Récupération active entre le tempo du mercredi et les fractionnés du vendredi. Le jeudi facile est indispensable pour tenir les 1500m du vendredi.',
      'RPE 3/10 · Ce footing te permet de récupérer du mercredi tout en gardant les jambes mobiles.'),
    ef('Samedi','45 min',
      '45 min à {{P}}. Récupération après les fractionnés de vendredi. Volume progressif avant la sortie longue du dimanche.',
      'RPE 3-4/10 · Relâché et régulier.'),
  ],

  // Wk4 : même structure que wk3
  4: [
    ef('Jeudi','40 min',
      '40 min très faciles à {{P}}. Récupération entre le seuil du mercredi et les fractionnés du vendredi. Volume de base sans jamais empiéter sur la qualité.',
      'RPE 3/10 · Si tu te sens fatigué après le mercredi, réduis à 25 minutes.'),
    ef('Samedi','45 min',
      '45 min à {{P}}. Volume de fin de semaine avant la sortie longue avec encart allure semi du dimanche. Prépare les jambes sans les fatiguer.',
      'RPE 4/10 · Allure facile, conversation possible.'),
  ],

  // Wk5 : base Mardi EF | Jeudi tempo | Samedi EF | Dimanche SL 90
  // Extra Lundi Côtes + Vendredi EF : Lun côtes | Mar EF | [Mer repos] | Jeu tempo | Ven EF | Sam EF | Dim SL
  5: [
    { jour:'Lundi', type:'Côtes', titre:'Séance côtes',
      duree:'50 min', pcts:[[60,65]],
      echauff:'20 min de footing EF progressif à {{P}}.',
      corps:'8 × 80m en côte à effort maximal. Redescends au trot entre chaque montée. Travail de puissance, de foulée et de gainage naturel. Les côtes renforcent tes chevilles et genoux.',
      retour:'10 min de jogging léger.',
      note:'RPE 9/10 sur les montées · Côte à 5-8% de pente · 2 jours séparent cette séance du tempo de jeudi.' },
    ef('Vendredi','40 min',
      '40 min très faciles à {{P}}. Récupération active après le tempo du jeudi. Volume de fin de semaine avant la grande sortie longue de 90 min dimanche.',
      'RPE 3/10 · Jambes légères, allure très facile.'),
  ],

  // Wk6 : base Mardi EF | Jeudi tempo | Samedi EF | Dimanche SL 100
  // Même structure que wk1-2 : repos mercredi sépare bloc EF lun-mar de la qualité jeudi
  6: [
    ef('Lundi','40 min',
      '40 min à {{P}}. Volume de base, avec le repos du mercredi entre ce footing et le tempo du jeudi. Sortie légère et détendue.',
      'RPE 3/10 · Lundi léger, repos mercredi, qualité jeudi : toujours le même schéma.'),
    ef('Vendredi','40 min',
      '40 min très faciles à {{P}}. Récupération active après le tempo de 2 × 20 min. Prépare les jambes pour la sortie longue avec encart allure semi du dimanche.',
      'RPE 3/10 · Vraiment facile, sans exception.'),
  ],

  // Wk7 : base Mardi EF | Mercredi tempo | Vendredi frac | Dimanche SL 105
  // Extras Jeudi + Samedi : même logique que wk3-4
  7: [
    ef('Jeudi','40 min',
      '40 min très faciles à {{P}}. Récupération entre les 3 × 15 min du mercredi et les 6 × 1000m du vendredi. Ce footing est indispensable pour tenir la qualité du vendredi.',
      'RPE 3/10 · Semaine de charge très élevée — le repos du jeudi (actif) est une priorité.'),
    ef('Samedi','45 min',
      '45 min à {{P}}. Récupération active après les deux séances dures de la semaine. Prépare la sortie longue de 105 min du dimanche.',
      'RPE 3/10 · Si tu te sens fatigué, réduis à 30 minutes.'),
  ],

  // Wk8 : base Mardi EF | Mercredi tempo | Vendredi frac | Dimanche SL 110
  // Même structure que wk7, devant le SL le plus long du plan
  8: [
    ef('Jeudi','40 min',
      '40 min très faciles à {{P}}. Récupération entre le seuil du mercredi et les 8 × 1000m du vendredi. La semaine de charge maximale exige un jeudi vraiment facile.',
      'RPE 3/10 · Semaine de pic de charge — soigne ce footing de récupération.'),
    ef('Samedi','45 min',
      '45 min à {{P}}. Activation légère avant la sortie longue de 110 min de demain. Volume minimal, jambes disponibles pour le dimanche.',
      'RPE 3/10 · Si tu sens de la fatigue, réduis à 25 minutes.'),
  ],

  // Wk9 : base Mardi EF | Jeudi spécif 3×5km | Samedi EF | Dimanche SL
  // Extra Lundi VMA + Vendredi EF : Lun VMA | Mar EF | [Mer repos] | Jeu spécif | Ven EF | Sam EF | Dim SL
  9: [
    { jour:'Lundi', type:'VMA', titre:'Fractionnés VMA 400m',
      duree:'55 min', pcts:[[60,65],[95,95]],
      echauff:'20 min de footing EF progressif à {{P}}.',
      corps:'8 × 400m à {{P}}. Récupération 90 sec au trot. Effort intense et contrôlé. Mardi EF (tampon) et mercredi repos garantissent la récupération avant la séance spécifique du jeudi.',
      retour:'10 min de jogging léger.',
      note:'RPE 9/10 · La VMA renforce ton moteur aérobie et améliore ta vitesse de croisière.' },
    ef('Vendredi','45 min',
      '45 min très faciles à {{P}}. Récupération après la séance spécifique du jeudi. Prépare la sortie longue du dimanche, ta dernière grande répétition avant l\'affûtage.',
      'RPE 3/10 · Facile, sans exception.',[[60,60]]),
  ],

  // Wk10 : base Mardi EF | Jeudi spécif 4×5km | Samedi EF | Dimanche SL
  // Même structure que wk1-2 et wk6
  10: [
    ef('Lundi','40 min',
      '40 min à {{P}}. Lundi léger, repos mercredi, puis la séance spécifique la plus longue du plan jeudi (4 × 5 km). Volume de base sans entamer les réserves.',
      'RPE 3/10 · Allure facile.',[[60,60]]),
    ef('Vendredi','45 min',
      '45 min très faciles à {{P}}. Récupération après les 4 × 5 km du jeudi. Les séances dures sont terminées, tu entres dans l\'affûtage.',
      'RPE 3/10 · Dernière sortie à volume plein avant l\'allégement.',[[60,60]]),
  ],

  // Wk11 (affûtage) : 1 seul extra EF 40min sur Lundi.
  // La base a déjà Mardi EF 45min + Jeudi seuil réduit + Samedi EF 35min = 3 séances.
  // 1 extra → 4 séances au total, volume allégé respecté.
  11: [
    ef('Lundi','40 min',
      '40 min très légères à {{P}}. Maintien du volume pendant l\'affûtage. Repos mercredi avant la séance de seuil réduite du jeudi.',
      'RPE 2-3/10 · L\'objectif est d\'arriver frais au départ, pas de s\'entraîner.',[[60,60]]),
  ],

  // Wk12 : ignorée (déjà 4 séances dans la base).
}

module.exports = base.map(week => {
  const extras = EXTRAS_BY_WEEK[week.num]
  if (!extras || extras.length === 0) return week
  return {
    ...week,
    seances: [...week.seances, ...extras],
  }
})
