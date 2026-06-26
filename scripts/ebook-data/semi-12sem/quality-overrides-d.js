// Surcharges des séances de qualité — palier Débutant (VMA 10 à 13.5).
// Réutilisé par semaines-4/5/6-d.js.
module.exports = {
  1: { replace: { Jeudi: {
    titre:'4 × 800 mètres', pcts:[[65,65],[83,86]],
    corps:'4 × 800m à {{P}}. Effort soutenu mais maîtrisé. Récupération 2 min au trot entre chaque. Volume réduit pour commencer sans accumulation.',
    note:'RPE 6-7/10 · À ce stade, mieux vaut une allure tenue sur 4 que manquée sur 6.' } } },
  2: { replace: { Jeudi: {
    titre:'5 × 800 mètres', pcts:[[65,65],[83,86]],
    corps:'5 × 800m à {{P}}. Une répétition de plus que la semaine dernière. Récupération 2 min au trot. Maintiens la même allure sur les 5.',
    note:'RPE 6-7/10 · La régularité avant la vitesse.' } } },
  3: { replace: {
    Mercredi: { titre:'Tempo continu, 12 minutes', duree:'50 min', pcts:[[65,70],[80,80]],
      corps:'12 minutes continues à {{P}}. Premier contact avec l\'allure seuil. Tu dois pouvoir prononcer quelques mots.',
      note:'RPE 6-7/10 · Pas besoin d\'aller plus loin pour progresser à ce stade.' },
    Vendredi: { titre:'3 × 1500 mètres', duree:'60 min', pcts:[[65,65],[80,82]],
      corps:'3 × 1500m à {{P}}. Récupération 2 min au trot. Termine par 1 km à ton allure objectif semi-marathon ({{OBJ}}).',
      note:'RPE 7/10 · Des intervalles longs à allure modérée pour bâtir ta résistance.' },
  } },
  4: { replace: {
    Mercredi: { titre:'2 × 12 minutes au seuil', duree:'55 min', pcts:[[65,70],[82,82]],
      corps:'2 × 12 min à {{P}} avec 3 min de récupération. La deuxième répétition est plus difficile, c\'est normal.',
      note:'RPE 7/10 · Concentre-toi sur la régularité plus que sur la vitesse.' },
    Vendredi: { titre:'4 × 1500 mètres', duree:'65 min', pcts:[[65,65],[80,83]],
      corps:'4 × 1500m à {{P}}. Une répétition de plus que la semaine dernière. Récupération 2 min au trot.',
      note:'RPE 7/10 · Cette progression douce protège tes tendons et ta motivation.' },
  } },
  5: { replace: { Jeudi: {
    titre:'2 × 12 minutes au seuil', pcts:[[65,70],[83,83]],
    corps:'2 × 12 min à {{P}} avec 3 min de récupération entre chaque. Volume adapté à ton niveau.',
    note:'RPE 7/10 · 24 min au seuil, une charge sérieuse à ce niveau.' } } },
  6: { replace: { Jeudi: {
    titre:'2 × 15 minutes au seuil', pcts:[[65,70],[83,83]],
    corps:'2 × 15 min à {{P}} avec 3 min de récupération entre chaque. 3 minutes de plus par répétition que la semaine dernière.',
    note:'RPE 7-8/10 · 30 min totales au seuil, ton pic sur cette séance.' } } },
  7: { replace: {
    Mercredi: { titre:'2 × 15 minutes au seuil', duree:'60 min', pcts:[[65,70],[83,83]],
      corps:'2 × 15 min à {{P}} avec 3 min de récupération entre chaque.',
      note:'RPE 7-8/10 · 30 min au seuil, une charge sérieuse à ce niveau.' },
    Vendredi: { titre:'4 × 1000 mètres', duree:'65 min', pcts:[[65,65],[83,86]],
      corps:'4 × 1000m à {{P}}. Deux répétitions de moins que la version standard. Récupération 2 min au trot.',
      note:'RPE 7-8/10 · La progression est adaptée à ton profil.' },
  } },
  8: { replace: {
    Mercredi: { titre:'3 × 12 minutes au seuil', duree:'65 min', pcts:[[65,70],[83,83]],
      corps:'3 × 12 min à {{P}} avec 3 min de récupération entre chaque. La troisième est la plus difficile.',
      note:'RPE 7-8/10 · 36 min au seuil, ton record sur cette séance.' },
    Vendredi: { titre:'5 × 1000 mètres', duree:'70 min', pcts:[[65,65],[83,86]],
      corps:'5 × 1000m à {{P}}. Trois répétitions de moins que la version standard. Récupération 2 min au trot.',
      note:'RPE 7-8/10 · Volume adapté à ton niveau pour bien absorber la charge.' },
  } },
  9: { replace: { Jeudi: {
    titre:'2 × 5 km à allure objectif',
    corps:'2 × 5 km exactement à ton allure objectif semi-marathon ({{OBJ}}). Récupération 2 min au trot. Tu répètes littéralement ton allure de course.',
    note:'RPE 7/10 · Si {{OBJ}} est trop facile sur les 2, ton objectif est peut-être trop prudent.' } } },
  10: { replace: { Jeudi: {
    titre:'3 × 5 km à allure objectif',
    corps:'3 × 5 km exactement à ton allure objectif semi-marathon ({{OBJ}}). Récupération 2 min au trot. Une répétition de plus qu\'en semaine 9.',
    note:'RPE 7-8/10 · La troisième est la plus précieuse, elle simule la 2e partie du semi.' } } },
  11: { replace: { Jeudi: {
    titre:'1 × 12 minutes au seuil, volume réduit', pcts:[[65,70],[82,82]],
    corps:'12 min continues à {{P}}. Volume très réduit mais intensité maintenue. Termine par 1 km à ton allure objectif semi-marathon ({{OBJ}}).',
    note:'RPE 6-7/10 · Ces minutes maintiennent tes sensations sans te fatiguer avant la course.' } } },
}
