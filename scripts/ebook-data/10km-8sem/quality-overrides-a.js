// Surcharges des séances de qualité — palier Avancé (VMA 19 à 24).
// Réutilisé par semaines-4/5/6-a.js uniquement (toutes héritées de semaines-4-i.js).
module.exports = {
  1: { replace: { Jeudi: {
    titre:'14 × 400 mètres', pcts:[[65,65],[97,102]],
    corps:'14 × 400m à {{P}}. Volume relevé d\'entrée car ton niveau le permet. Récupération 90 sec au trot entre chaque. Maintiens la même allure du premier au dernier.',
    note:'RPE 8-9/10 · Si les dernières sont nettement plus lentes, recalibre la prochaine fois.' } } },
  2: { conseil:'Sur les 16 × 400m, l\'objectif c\'est de tenir la même allure sur les 16. Si les dernières sont nettement plus lentes, tu es parti trop vite.',
    replace: { Jeudi: {
    titre:'16 × 400 mètres', pcts:[[65,65],[97,102]],
    corps:'16 × 400m à {{P}}. Deux répétitions de plus. Récupération 90 sec au trot. Le volume monte vite à ton niveau, la récupération courte reste le levier principal.',
    note:'RPE 8-9/10 · La récupération courte est volontaire pour développer ta résistance.' } } },
  3: { replace: {
    Mercredi: { titre:'Tempo continu, 25 minutes', duree:'65 min', pcts:[[65,70],[87,87]],
      corps:'25 minutes continues à {{P}}. Bloc plus long qu\'un profil standard car ton seuil te le permet. Difficile mais tenable sur toute la durée.',
      note:'RPE 8/10 · La régularité prime sur la vitesse pure, même à ce niveau.' },
    Vendredi: { titre:'6 × 1000 mètres', duree:'75 min', pcts:[[65,65],[88,92]],
      corps:'6 × 1000m à {{P}}. Récupération 2 min au trot. Termine par 1,5 km à ton allure objectif 10km ({{OBJ}}), pour comparer les sensations.',
      note:'RPE 8/10 · Un répété de plus et une allure plus haute que la version standard.' },
  } },
  4: { replace: {
    Mercredi: { titre:'3 × 12 minutes au seuil', duree:'70 min', pcts:[[87,87]],
      corps:'3 × 12 min à {{P}} avec 3 min de récupération entre chaque, puis termine par 3 minutes à ton allure objectif 10km ({{OBJ}}). La troisième répétition arrive fatiguée, c\'est voulu.',
      note:'RPE 8-9/10 · 36 minutes au seuil au total, une charge sérieuse.' },
    Vendredi: { titre:'8 × 1000 mètres', duree:'80 min', pcts:[[90,93]],
      corps:'8 × 1000m à {{P}}. Deux répétitions de plus que la version standard, allure plus haute. Récupération 2 min au trot.',
      note:'RPE 8-9/10 · Cette densité te rapproche directement de l\'allure 10km.' },
  } },
  5: { replace: {
    Mardi: { titre:'12 × côtes, 200 mètres', duree:'65 min', pcts:[[65,70]],
      corps:'12 montées de 200m à effort maximal. Côte plus longue et plus de répétitions qu\'un profil standard. Genoux hauts, bras actifs, pousse à fond jusqu\'en haut.',
      note:'RPE 9/10 sur les montées · Une séance de côtes nettement plus exigeante.' },
    Vendredi: { titre:'20 × 300 mètres', duree:'75 min', pcts:[[65,65],[102,107]],
      corps:'20 × 300m à {{P}}. Récupération 60 sec entre chaque. Termine par 4 × 1 km à ton allure objectif 10km ({{OBJ}}), récupération 60 sec.',
      note:'RPE 9/10 · Volume et allure au-dessus du profil standard, à n\'envisager qu\'à ton niveau de forme.' },
  } },
  6: { replace: {
    Mardi: { titre:'4 × 10 minutes au seuil', duree:'80 min', pcts:[[90,93]],
      corps:'4 × 10 min à {{P}} avec 3 min de récupération entre chaque. La quatrième répétition est la plus difficile, maintiens l\'allure.',
      note:'RPE 9/10 · 40 min totales au seuil, ton record sur ce plan.' },
    Jeudi: { titre:'5 × 2 km à allure objectif', duree:'80 min',
      corps:'5 × 2 km exactement à ton allure objectif 10km ({{OBJ}}). Récupération 90 sec au trot. Un répété de plus que la version standard.',
      note:'RPE 8-9/10 · Si {{OBJ}} est trop facile sur les 5, ton objectif est peut-être trop prudent.' },
  } },
  7: { replace: { Jeudi: {
    titre:'8 × 400 mètres, volume réduit', pcts:[[97,102]],
    corps:'8 × 400m à {{P}}. Volume réduit par rapport à ta charge habituelle mais intensité maintenue. Récupération 2 min entre chaque. Termine par 3 × 1 km à ton allure objectif 10km ({{OBJ}}), pour garder la sensation fraîche en tête.',
    note:'RPE 8/10 · Même en consolidation, ton volume reste au-dessus de la moyenne.' } } },
}
