// Surcharges Avancé pour le plan 3 séances/semaine.
// Toutes les séances de qualité sont sur Jeudi dans semaines-3-i.js.
module.exports = {
  1: { replace: { Jeudi: {
    titre:'12 × 400 mètres', pcts:[[65,65],[97,102]],
    corps:'12 × 400m à {{P}}. Volume relevé d\'entrée car ton niveau le permet. Récupération 90 sec au trot. Maintiens la même allure du premier au dernier.',
    note:'RPE 8-9/10 · Si les dernières sont nettement plus lentes, recalibre la prochaine fois.' } } },
  2: { replace: { Jeudi: {
    titre:'14 × 400 mètres', pcts:[[65,65],[97,102]],
    corps:'14 × 400m à {{P}}. Deux répétitions de plus. Récupération 90 sec au trot.',
    note:'RPE 8-9/10 · La récupération courte est le levier principal.' } } },
  3: { replace: { Jeudi: {
    titre:'Tempo continu, 20 minutes', pcts:[[65,70],[88,88]],
    echauff:'25 min de footing progressif à {{P}}.', duree:'60 min',
    corps:'20 minutes continues à {{P}}. Bloc plus long qu\'un profil standard car ton seuil te le permet.',
    note:'RPE 8/10 · La régularité prime sur la vitesse pure.' } } },
  4: { replace: { Jeudi: {
    titre:'5 × 1000 mètres', pcts:[[65,65],[88,92]],
    corps:'5 × 1000m à {{P}}. Récupération 2 min au trot. Termine par 1,5 km à ton allure objectif 10km ({{OBJ}}).',
    note:'RPE 8/10 · Un répété de plus et une allure plus haute que la version standard.' } } },
  5: { replace: { Jeudi: {
    titre:'14 × 400 mètres', pcts:[[65,65],[100,105]],
    corps:'14 × 400m à {{P}}. Volume plus élevé que la version standard. Récupération 90 sec au trot.',
    note:'RPE 9/10 · La récupération courte est le vrai stimulus de cette séance.' } } },
  6: { replace: { Jeudi: {
    titre:'10 × côtes, 150 mètres', pcts:[[65,70]],
    corps:'10 montées de 150m à effort maximal. Plus de répétitions qu\'un profil standard. Genoux hauts, bras actifs, pousse à fond jusqu\'en haut. Descente au trot complète entre chaque montée.',
    note:'RPE 9/10 sur les montées · Une séance de côtes nettement plus exigeante.' } } },
  7: { replace: { Jeudi: {
    titre:'3 × 10 minutes au seuil', pcts:[[90,93]],
    corps:'3 × 10 min à {{P}} avec 3 min de récupération entre chaque. La troisième répétition est la plus difficile, maintiens l\'allure.',
    note:'RPE 8-9/10 · 30 min au seuil, une charge sérieuse.' } } },
  8: { replace: { Jeudi: {
    titre:'16 × 300 mètres', pcts:[[65,65],[102,107]],
    corps:'16 × 300m à {{P}}. Récupération 60 sec entre chaque. Maintiens la même vitesse. Termine par 3 × 1 km à ton allure objectif 10km ({{OBJ}}), récupération 60 sec.',
    note:'RPE 9/10 · Volume et allure au-dessus du profil standard.' } } },
  9: { replace: { Jeudi: {
    titre:'4 × 2 km à allure objectif',
    corps:'4 × 2 km exactement à ton allure objectif 10km ({{OBJ}}). Récupération 90 sec au trot. Un répété de plus que la version standard.',
    note:'RPE 8-9/10 · Si {{OBJ}} est trop facile sur les 4, ton objectif est peut-être trop prudent.' } } },
  10: { replace: { Jeudi: {
    titre:'5 × 2 km à allure objectif',
    corps:'5 × 2 km exactement à ton allure objectif 10km ({{OBJ}}). Récupération 90 sec au trot. Un répété de plus qu\'en semaine 9.',
    note:'RPE 8-9/10 · La 5e répétition est ta répétition générale.' } } },
  11: { replace: { Jeudi: {
    titre:'6 × 400 mètres, volume réduit', pcts:[[65,65],[97,102]],
    corps:'6 × 400m à {{P}}. Volume réduit mais intensité maintenue. Récupération 2 min entre chaque. Termine par 2 × 1 km à ton allure objectif 10km ({{OBJ}}).',
    note:'RPE 8/10 · Même en consolidation, ton volume reste au-dessus de la moyenne.' } } },
}
