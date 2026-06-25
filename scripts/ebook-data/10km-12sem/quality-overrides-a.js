// Surcharges des séances de qualité — palier Avancé (VMA 19 à 24).
// Réutilisé par semaines-4/5/6-a.js (toutes héritées de semaines-4-i.js).
module.exports = {
  1: { replace: { Jeudi: {
    titre:'12 × 400 mètres', pcts:[[65,65],[97,102]],
    corps:'12 × 400m à {{P}}. Volume relevé d\'entrée car ton niveau le permet. Récupération 90 sec au trot entre chaque. Maintiens la même allure du premier au dernier.',
    note:'RPE 8-9/10 · Si les dernières sont nettement plus lentes, recalibre la prochaine fois.' } } },
  2: { replace: { Jeudi: {
    titre:'14 × 400 mètres', pcts:[[65,65],[97,102]],
    corps:'14 × 400m à {{P}}. Deux répétitions de plus. Récupération 90 sec au trot. Le volume monte vite à ton niveau, la récupération courte reste le levier principal.',
    note:'RPE 8-9/10 · La récupération courte est volontaire pour développer ta résistance.' } } },
  3: { replace: {
    Mercredi: { titre:'Tempo continu, 20 minutes', duree:'60 min', pcts:[[65,70],[88,88]],
      corps:'20 minutes continues à {{P}}. Bloc plus long qu\'un profil standard car ton seuil te le permet. Difficile mais tenable sur toute la durée.',
      note:'RPE 8/10 · La régularité prime sur la vitesse pure, même à ce niveau.' },
    Vendredi: { titre:'5 × 1000 mètres', duree:'70 min', pcts:[[65,65],[88,92]],
      corps:'5 × 1000m à {{P}}. Récupération 2 min au trot. Termine par 1,5 km à ton allure objectif 10km ({{OBJ}}), pour comparer les sensations.',
      note:'RPE 8/10 · Un répété de plus et une allure plus haute que la version standard.' },
  } },
  4: { replace: {
    Mercredi: { titre:'2 × 15 minutes au seuil', duree:'65 min', pcts:[[88,88]],
      corps:'2 × 15 min à {{P}} avec 3 min de récupération entre chaque. La deuxième répétition est intentionnellement plus dure.',
      note:'RPE 8-9/10 · 30 min au seuil au total, une charge sérieuse.' },
    Vendredi: { titre:'6 × 1000 mètres', duree:'75 min', pcts:[[65,65],[90,93]],
      corps:'6 × 1000m à {{P}}. Deux répétitions de plus que la version standard, allure plus haute. Récupération 2 min au trot.',
      note:'RPE 8-9/10 · Cette densité te rapproche directement de l\'allure 10km.' },
  } },
  5: { replace: { Jeudi: {
    titre:'16 × 400 mètres', pcts:[[65,65],[100,105]],
    corps:'16 × 400m à {{P}}. Quatre répétitions de plus que la version standard. Récupération 90 sec au trot. Maintiens la même vitesse du premier au dernier.',
    note:'RPE 9/10 · La récupération courte est le vrai stimulus de cette séance.' } } },
  6: { replace: {
    Mardi: { titre:'12 × côtes, 150 mètres', duree:'65 min', pcts:[[65,70]],
      corps:'12 montées de 150m à effort maximal. Côte plus longue et plus de répétitions qu\'un profil standard. Genoux hauts, bras actifs, pousse à fond jusqu\'en haut.',
      note:'RPE 9/10 sur les montées · Une séance de côtes nettement plus exigeante.' },
    Vendredi: { titre:'16 × 300 mètres', duree:'70 min', pcts:[[65,65],[102,107]],
      corps:'16 × 300m à {{P}}. Récupération 60 sec entre chaque. Maintiens la même vitesse sur les 16. Termine par 3 × 1 km à ton allure objectif 10km ({{OBJ}}), récupération 60 sec.',
      note:'RPE 9/10 · Volume et allure au-dessus du profil standard.' },
  } },
  7: { replace: {
    Mercredi: { titre:'3 × 12 minutes au seuil', duree:'70 min', pcts:[[90,93]],
      corps:'3 × 12 min à {{P}} avec 3 min de récupération entre chaque. La troisième répétition est la plus difficile, maintiens l\'allure.',
      note:'RPE 8-9/10 · 36 min au seuil au total, ton record sur ce plan.' },
    Vendredi: { titre:'7 × 1000 mètres', duree:'80 min', pcts:[[65,65],[88,92]],
      corps:'7 × 1000m à {{P}}. Deux répétitions de plus que la version standard. Récupération 2 min au trot.',
      note:'RPE 8-9/10 · Cette densité te rapproche directement de l\'allure 10km.' },
  } },
  8: { replace: {
    Mardi: { titre:'14 × côtes, 150 mètres', duree:'70 min', pcts:[[65,70]],
      corps:'14 montées de 150m à effort maximal. Quatre montées de plus que la version standard. Genoux hauts, bras actifs, pousse à fond jusqu\'en haut.',
      note:'RPE 9/10 sur les montées · Une séance record sur ce plan.' },
    Vendredi: { titre:'20 × 300 mètres', duree:'75 min', pcts:[[65,65],[102,107]],
      corps:'20 × 300m à {{P}}. Récupération 60 sec entre chaque. Maintiens la même vitesse. Termine par 4 × 1 km à ton allure objectif 10km ({{OBJ}}), récupération 60 sec.',
      note:'RPE 9/10 · Volume et allure au-dessus du profil standard, à n\'envisager qu\'à ton niveau de forme.' },
  } },
  9: { replace: {
    Mardi: { titre:'4 × 10 minutes au seuil', duree:'80 min', pcts:[[65,70],[90,93]],
      corps:'4 × 10 min à {{P}} avec 3 min de récupération entre chaque. La quatrième répétition est la plus difficile, maintiens l\'allure.',
      note:'RPE 9/10 · 40 min totales au seuil, ton record sur ce plan.' },
    Jeudi: { titre:'4 × 2 km à allure objectif', duree:'70 min',
      corps:'4 × 2 km exactement à ton allure objectif 10km ({{OBJ}}). Récupération 90 sec au trot. Un répété de plus que la version standard.',
      note:'RPE 8-9/10 · Si {{OBJ}} est trop facile sur les 4, ton objectif est peut-être trop prudent.' },
  } },
  10: { replace: {
    Mardi: { titre:'4 × 12 minutes au seuil', duree:'85 min', pcts:[[65,70],[90,93]],
      corps:'4 × 12 min à {{P}} avec 3 min de récupération entre chaque. Légèrement plus long que la semaine 9.',
      note:'RPE 9/10 · 48 min totales au seuil, une charge élite.' },
    Jeudi: { titre:'5 × 2 km à allure objectif', duree:'75 min',
      corps:'5 × 2 km exactement à ton allure objectif 10km ({{OBJ}}). Récupération 90 sec au trot. Un répété de plus qu\'en semaine 9.',
      note:'RPE 8-9/10 · La 5e répétition est ta répétition générale.' },
  } },
  11: { replace: { Jeudi: {
    titre:'8 × 400 mètres, volume réduit', pcts:[[65,65],[97,102]],
    corps:'8 × 400m à {{P}}. Volume réduit par rapport à ta charge habituelle mais intensité maintenue. Récupération 2 min entre chaque. Termine par 3 × 1 km à ton allure objectif 10km ({{OBJ}}), pour garder la sensation fraîche en tête.',
    note:'RPE 8/10 · Même en consolidation, ton volume reste au-dessus de la moyenne.' } } },
}
