// Surcharges des séances de qualité — palier Avancé (VMA 19 à 24).
// Réutilisé par semaines-4/5/6-a.js.
module.exports = {
  1: { replace: { Jeudi: {
    titre:'10 × 800 mètres', pcts:[[65,65],[90,94]],
    corps:'10 × 800m à {{P}}. Volume élevé d\'entrée car ton niveau le permet. Récupération 75 sec au trot. Maintiens la même allure du premier au dernier.',
    note:'RPE 8/10 · La récupération courte est volontaire pour développer ta résistance.' } } },
  2: { replace: { Jeudi: {
    titre:'12 × 800 mètres', pcts:[[65,65],[90,94]],
    corps:'12 × 800m à {{P}}. Deux répétitions de plus. Récupération 75 sec au trot. Le volume monte vite à ton niveau.',
    note:'RPE 8/10 · La récupération courte reste le levier principal.' } } },
  3: { replace: {
    Mercredi: { titre:'Tempo continu, 22 minutes', duree:'60 min', pcts:[[65,70],[86,86]],
      corps:'22 minutes continues à {{P}}. Bloc plus long qu\'un profil standard car ton seuil te le permet. Difficile mais tenable sur toute la durée.',
      note:'RPE 8/10 · La régularité prime sur la vitesse pure, même à ce niveau.' },
    Vendredi: { titre:'5 × 1500 mètres', duree:'70 min', pcts:[[65,65],[85,88]],
      corps:'5 × 1500m à {{P}}. Une répétition de plus que la version standard. Récupération 90 sec au trot. Termine par 2 km à ton allure objectif semi-marathon ({{OBJ}}).',
      note:'RPE 8/10 · Un répété de plus et une allure plus haute que la version standard.' },
  } },
  4: { replace: {
    Mercredi: { titre:'2 × 20 minutes au seuil', duree:'70 min', pcts:[[65,70],[87,87]],
      corps:'2 × 20 min à {{P}} avec 3 min de récupération entre chaque. 5 minutes de plus par répétition que la version standard. La deuxième est intentionnellement plus dure.',
      note:'RPE 8-9/10 · 40 min au seuil au total, une charge sérieuse.' },
    Vendredi: { titre:'6 × 1500 mètres', duree:'75 min', pcts:[[65,65],[85,88]],
      corps:'6 × 1500m à {{P}}. Deux répétitions de plus que la version standard. Récupération 90 sec au trot.',
      note:'RPE 8-9/10 · Cette densité te rapproche directement de l\'allure semi-marathon.' },
  } },
  5: { replace: { Jeudi: {
    titre:'4 × 12 minutes au seuil', pcts:[[65,70],[87,87]],
    corps:'4 × 12 min à {{P}} avec 3 min de récupération entre chaque. Une répétition de plus que la version standard.',
    note:'RPE 8-9/10 · 48 min au seuil, une charge élite.' } } },
  6: { replace: { Jeudi: {
    titre:'2 × 25 minutes au seuil', pcts:[[65,70],[88,88]],
    corps:'2 × 25 min à {{P}} avec 3 min de récupération entre chaque. 5 minutes de plus par répétition que la version standard.',
    note:'RPE 8-9/10 · 50 min totales au seuil, ton record absolu sur cette séance.' } } },
  7: { replace: {
    Mercredi: { titre:'4 × 15 minutes au seuil', duree:'80 min', pcts:[[65,70],[88,88]],
      corps:'4 × 15 min à {{P}} avec 3 min de récupération entre chaque. La quatrième est la plus difficile, maintiens l\'allure.',
      note:'RPE 8-9/10 · 60 min au seuil au total, ton record absolu.' },
    Vendredi: { titre:'10 × 1000 mètres', duree:'85 min', pcts:[[65,65],[90,94]],
      corps:'10 × 1000m à {{P}}. Quatre répétitions de plus que la version standard. Récupération 90 sec au trot.',
      note:'RPE 8-9/10 · Cette densité te rapproche directement de la performance.' },
  } },
  8: { replace: {
    Mercredi: { titre:'5 × 12 minutes au seuil', duree:'80 min', pcts:[[65,70],[88,88]],
      corps:'5 × 12 min à {{P}} avec 3 min de récupération entre chaque. Une répétition de plus que la semaine 7.',
      note:'RPE 9/10 · 60 min au seuil, une charge de très haut niveau.' },
    Vendredi: { titre:'12 × 1000 mètres', duree:'90 min', pcts:[[65,65],[90,94]],
      corps:'12 × 1000m à {{P}}. Quatre répétitions de plus que la version standard. Récupération 90 sec au trot. Maintiens la même vitesse.',
      note:'RPE 9/10 · Volume et allure au-dessus du profil standard, à n\'envisager qu\'à ton niveau de forme.' },
  } },
  9: { replace: { Jeudi: {
    titre:'4 × 5 km à allure objectif',
    corps:'4 × 5 km exactement à ton allure objectif semi-marathon ({{OBJ}}). Récupération 2 min au trot. Une répétition de plus que la version standard.',
    note:'RPE 8/10 · 20 km à l\'allure objectif. Si c\'est trop facile, ton objectif est peut-être trop prudent.' } } },
  10: { replace: { Jeudi: {
    titre:'5 × 5 km à allure objectif',
    corps:'5 × 5 km exactement à ton allure objectif semi-marathon ({{OBJ}}). Récupération 2 min au trot. Une répétition de plus qu\'en semaine 9.',
    note:'RPE 8/10 · 25 km à l\'allure objectif, la répétition générale ultime.' } } },
  11: { replace: { Jeudi: {
    titre:'2 × 15 minutes au seuil, volume réduit', pcts:[[65,70],[86,86]],
    corps:'2 × 15 min à {{P}}. Volume réduit par rapport à ta charge habituelle mais intensité maintenue. Récupération 3 min. Termine par 2 km à ton allure objectif semi-marathon ({{OBJ}}).',
    note:'RPE 8/10 · Même en consolidation, ton volume reste au-dessus de la moyenne.' } } },
}
