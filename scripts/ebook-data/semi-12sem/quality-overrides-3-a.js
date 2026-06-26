// Surcharges Avancé pour le plan 3 séances/semaine.
// Toutes les séances de qualité sont sur Jeudi dans semaines-3-i.js.
module.exports = {
  1: { replace: { Jeudi: {
    titre:'10 × 800 mètres', pcts:[[65,65],[90,94]],
    corps:'10 × 800m à {{P}}. Volume élevé d\'entrée car ton niveau le permet. Récupération 75 sec au trot. Maintiens la même allure du premier au dernier.',
    note:'RPE 8/10 · La récupération courte est volontaire pour développer ta résistance.' } } },
  2: { replace: { Jeudi: {
    titre:'12 × 800 mètres', pcts:[[65,65],[90,94]],
    corps:'12 × 800m à {{P}}. Deux répétitions de plus. Récupération 75 sec au trot.',
    note:'RPE 8/10 · La récupération courte reste le levier principal.' } } },
  3: { replace: { Jeudi: {
    titre:'Tempo continu, 26 minutes', pcts:[[65,70],[86,86]],
    echauff:'25 min de footing progressif à {{P}}.', duree:'65 min',
    corps:'26 minutes continues à {{P}}. Plus long que la version standard car c\'est ta seule qualité de la semaine et ton niveau le permet.',
    note:'RPE 8/10 · La régularité prime sur la vitesse, même à ce niveau.' } } },
  4: { replace: { Jeudi: {
    titre:'2 × 22 minutes au seuil', pcts:[[65,70],[87,87]],
    echauff:'25 min de footing progressif EF.', duree:'70 min',
    corps:'2 × 22 min à {{P}} avec 3 min de récupération entre chaque. Plus long que la version standard. La deuxième est intentionnellement plus dure.',
    note:'RPE 8-9/10 · 44 min au seuil au total, une charge sérieuse.' } } },
  5: { replace: { Jeudi: {
    titre:'4 × 14 minutes au seuil', pcts:[[65,70],[87,87]],
    corps:'4 × 14 min à {{P}} avec 3 min de récupération entre chaque.',
    note:'RPE 8-9/10 · 56 min au seuil, une charge élite.' } } },
  6: { replace: { Jeudi: {
    titre:'2 × 27 minutes au seuil', pcts:[[65,70],[88,88]],
    corps:'2 × 27 min à {{P}} avec 3 min de récupération entre chaque.',
    note:'RPE 8-9/10 · 54 min totales au seuil, ton record absolu sur cette séance.' } } },
  7: { replace: { Jeudi: {
    titre:'3 × 20 minutes au seuil', pcts:[[65,70],[88,88]],
    corps:'3 × 20 min à {{P}} avec 3 min de récupération entre chaque. La troisième est la plus difficile, maintiens l\'allure. Plus long que la version standard car c\'est ta seule qualité.',
    note:'RPE 8-9/10 · 60 min au seuil, ton record absolu.' } } },
  8: { replace: { Jeudi: {
    titre:'4 × 15 minutes au seuil', pcts:[[65,70],[88,88]],
    corps:'4 × 15 min à {{P}} avec 3 min de récupération entre chaque. Plus long que la version standard.',
    note:'RPE 9/10 · 60 min au seuil, une charge de très haut niveau.' } } },
  9: { replace: { Jeudi: {
    titre:'4 × 5 km à allure objectif',
    corps:'4 × 5 km exactement à ton allure objectif semi-marathon ({{OBJ}}). Récupération 2 min au trot. Une répétition de plus que la version standard.',
    note:'RPE 8/10 · 20 km à l\'allure objectif. Si c\'est trop facile, ton objectif est peut-être trop prudent.' } } },
  10: { replace: { Jeudi: {
    titre:'5 × 5 km à allure objectif',
    corps:'5 × 5 km exactement à ton allure objectif semi-marathon ({{OBJ}}). Récupération 2 min au trot.',
    note:'RPE 8/10 · 25 km à l\'allure objectif, la répétition générale ultime.' } } },
  11: { replace: { Jeudi: {
    titre:'2 × 15 minutes au seuil, volume réduit', pcts:[[65,70],[86,86]],
    corps:'2 × 15 min à {{P}}. Volume réduit par rapport à ta charge habituelle mais intensité maintenue. Récupération 3 min. Termine par 2 km à ton allure objectif semi-marathon ({{OBJ}}).',
    note:'RPE 8/10 · Même en consolidation, ton volume reste au-dessus de la moyenne.' } } },
}
