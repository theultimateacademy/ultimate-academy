// ── Pool complet des témoignages ──────────────────────────────
export const TESTIMONIALS_ALL = [
  // Vrais athlètes
  {
    name: 'Marin M., 24 ans',
    perf: 'Semi-marathon 1h20',
    stars: 5,
    text: "J'ai utilisé les temps de passage pour mon premier semi. Négatif split parfait, j'ai accéléré dans les 5 derniers km. Sans ce repère j'aurais sûrement explosé.",
  },
  {
    name: 'Baptiste B.',
    perf: 'Marathon 3h28',
    stars: 5,
    text: "Les temps de passage m'ont sauvé au marathon. J'ai tenu l'allure kilomètre par kilomètre et terminé plus fort. 22 minutes de gagnées en 6 mois.",
  },
  {
    name: 'Dimitry B., 30 ans',
    perf: '10km 57min',
    stars: 5,
    text: "Je partais de loin avec mes 57min au 10km. Alexis a tout restructuré : VMA, zones, séances. J'ai vu ma progression mois après mois.",
  },
  {
    name: 'Anouk L.',
    perf: 'Semi 1h38',
    stars: 5,
    text: "Connaître mes zones d'entraînement a tout changé. Je courais trop vite en endurance et trop lentement en fractionné. Maintenant je progresse vraiment.",
  },
  {
    name: 'Maxime LG.',
    perf: '10km 43min · objectif 45 battu',
    stars: 5,
    text: "Mon objectif était de passer sous les 45min au 10km. Alexis m'a montré comment travailler ma VMA et j'ai terminé en 43min. Au-delà de mes espérances.",
  },
  {
    name: 'Amandine D.',
    perf: '10km 45min',
    stars: 5,
    text: "Alexis m'a expliqué comment utiliser mes zones FC. Je ne cours plus au ressenti flou, j'ai un vrai repère. En 3 mois, 4 minutes de gagnées sur mon 10km.",
  },
  {
    name: 'Emma B., 23 ans',
    perf: '10km 48min',
    stars: 5,
    text: "Première vraie course avec un plan. Les temps de passage m'ont guidée du début à la fin, j'ai su exactement où j'en étais à chaque kilomètre.",
  },
  {
    name: 'Margot P., 25 ans',
    perf: 'Premier marathon 4h12',
    stars: 5,
    text: "Le prédicteur m'a donné un objectif réaliste pour mon premier marathon. J'ai suivi le plan d'Alexis et j'ai terminé dans les temps. Meilleure expérience running de ma vie.",
  },
  {
    name: 'Charlène V., 23 ans',
    perf: '10km 52min',
    stars: 5,
    text: "J'ai découvert que je courais tout le temps en zone grise. Depuis que j'entraîne vraiment par zones, je suis moins fatiguée et je progresse plus vite.",
  },
  {
    name: 'Sofiane B., 30 ans',
    perf: 'RP 10km 37\'45',
    stars: 5,
    text: "Test Cooper + zones VMA = la combinaison qui a tout débloqué pour moi. Nouveau record personnel en 10km après 4 mois de suivi avec Alexis.",
  },
  // Athlètes complémentaires
  {
    name: 'Thomas R., 34 ans',
    perf: 'Marathon 3h45',
    stars: 5,
    text: "Le calculateur de temps de passage a complètement changé ma façon de courir un marathon. Je gère mon effort du premier au dernier kilomètre.",
  },
  {
    name: 'Julie C., 28 ans',
    perf: 'Semi 1h55',
    stars: 5,
    text: "J'ai fait mon premier semi avec les temps de passage imprimés sur le bras. J'ai tenu l'allure et je suis arrivée avec encore de l'énergie. Incroyable.",
  },
  {
    name: 'Nicolas V., 31 ans',
    perf: '10km 42min',
    stars: 5,
    text: "Calculer ma VMA m'a montré que je m'entraînais n'importe comment depuis des années. Avec de vraies zones, j'ai progressé plus en 3 mois qu'en 2 ans avant.",
  },
  {
    name: 'Léa T., 26 ans',
    perf: 'Semi 1h48',
    stars: 5,
    text: "Le test Cooper m'a révélé une VMA bien plus haute que ce que je pensais. J'avais du potentiel inexploité. Alexis a su construire dessus.",
  },
  {
    name: 'Kevin D., 43 ans',
    perf: 'Marathon 3h58',
    stars: 5,
    text: "Le prédicteur m'a fixé un objectif à 3h58 depuis mon 10km. Alexis a construit le plan pour. J'ai passé les 4h pour la première fois à 56 ans.",
  },
]

// ── Subsets par page ──────────────────────────────────────────
export const TESTIMONIALS_CALCULATOR = [
  TESTIMONIALS_ALL[0],  // Marin M.
  TESTIMONIALS_ALL[1],  // Baptiste B.
  TESTIMONIALS_ALL[6],  // Emma B.
  TESTIMONIALS_ALL[10], // Thomas R.
  TESTIMONIALS_ALL[11], // Julie C.
  TESTIMONIALS_ALL[8],  // Charlène V.
]

export const TESTIMONIALS_VMA = [
  TESTIMONIALS_ALL[4],  // Maxime LG.
  TESTIMONIALS_ALL[5],  // Amandine D.
  TESTIMONIALS_ALL[9],  // Sofiane B.
  TESTIMONIALS_ALL[12], // Nicolas V.
  TESTIMONIALS_ALL[3],  // Anouk L.
  TESTIMONIALS_ALL[13], // Léa T.
]

export const TESTIMONIALS_ALLURES = [
  TESTIMONIALS_ALL[3],  // Anouk L.
  TESTIMONIALS_ALL[7],  // Margot P.
  TESTIMONIALS_ALL[8],  // Charlène V.
  TESTIMONIALS_ALL[1],  // Baptiste B.
  TESTIMONIALS_ALL[5],  // Amandine D.
  TESTIMONIALS_ALL[12], // Nicolas V.
]

export const TESTIMONIALS_VO2MAX = [
  TESTIMONIALS_ALL[9],  // Sofiane B.
  TESTIMONIALS_ALL[2],  // Dimitry B.
  TESTIMONIALS_ALL[13], // Léa T.
  TESTIMONIALS_ALL[14], // Kevin D.
  TESTIMONIALS_ALL[4],  // Maxime LG.
  TESTIMONIALS_ALL[6],  // Emma B.
]

export const TESTIMONIALS_PREDICTOR = [
  TESTIMONIALS_ALL[2],  // Dimitry B.
  TESTIMONIALS_ALL[7],  // Margot P.
  TESTIMONIALS_ALL[14], // Kevin D.
  TESTIMONIALS_ALL[0],  // Marin M.
  TESTIMONIALS_ALL[10], // Thomas R.
  TESTIMONIALS_ALL[6],  // Emma B.
]

// Rétrocompatibilité avec l'ancien import TESTIMONIALS
export const TESTIMONIALS = TESTIMONIALS_ALL.slice(0, 5)

export const FUEL_PLAN = {
  '10k': {
    label: '10 km',
    tip: "Sur 10km, un seul ravitaillement en eau suffit. Inutile de se charger en gel. L'énergie des muscles suffit si tu es bien hydraté avant le départ.",
    points: [
      { km: 5, label: 'Mi-course', items: [{ icon: '💧', name: 'Eau' }] },
    ],
  },
  semi: {
    label: 'Semi-marathon',
    tip: "Sur semi, 1 à 2 gels suffisent selon ton allure. Le premier gel à 7km cale l'énergie pour la seconde moitié. À 14km, recharge avant d'en avoir besoin.",
    points: [
      { km: 7,  label: '7 km',  items: [{ icon: '💧', name: 'Eau' }, { icon: '🧃', name: 'Gel énergétique' }] },
      { km: 14, label: '14 km', items: [{ icon: '💧', name: 'Eau' }, { icon: '🧃', name: 'Gel énergétique' }, { icon: '🍌', name: 'Banane' }] },
      { km: 18, label: '18 km', items: [{ icon: '💧', name: 'Eau' }, { icon: '🧂', name: 'Électrolytes' }] },
    ],
  },
  marathon: {
    label: 'Marathon',
    tip: "Sur marathon, mange avant d'avoir faim et bois avant d'avoir soif. Un gel toutes les 40-45min est la règle de base. Teste tout à l'entraînement : ne rien essayer de nouveau le jour J.",
    points: [
      { km: 10, label: '10 km', items: [{ icon: '💧', name: 'Eau' }] },
      { km: 15, label: '15 km', items: [{ icon: '💧', name: 'Eau' }, { icon: '🧃', name: 'Gel énergétique' }] },
      { km: 20, label: '20 km', items: [{ icon: '💧', name: 'Eau' }, { icon: '🧃', name: 'Gel' }, { icon: '🍌', name: 'Banane' }] },
      { km: 25, label: '25 km', items: [{ icon: '💧', name: 'Eau' }, { icon: '🧃', name: 'Gel' }, { icon: '🧂', name: 'Sel / électrolytes' }] },
      { km: 30, label: '30 km', items: [{ icon: '💧', name: 'Eau' }, { icon: '🧃', name: 'Gel' }, { icon: '🧂', name: 'Sel' }] },
      { km: 35, label: '35 km', items: [{ icon: '💧', name: 'Eau' }, { icon: '🧃', name: 'Gel' }, { icon: '🍌', name: 'Banane' }] },
      { km: 38, label: '38 km', items: [{ icon: '💧', name: 'Eau' }, { icon: '🧃', name: 'Gel' }] },
    ],
  },
}

export const EQUIV_TABLE = [
  { t10: '40:00', semi: '1h28', marathon: '3h05' },
  { t10: '45:00', semi: '1h40', marathon: '3h28' },
  { t10: '50:00', semi: '1h51', marathon: '3h51' },
  { t10: '55:00', semi: '2h03', marathon: '4h15' },
  { t10: '1h00',  semi: '2h14', marathon: '4h38' },
]
