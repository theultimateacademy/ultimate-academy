// Surcharges des séances de qualité — palier Débutant (VMA 10 à 13.5).
// Réutilisé par semaines-4/5/6-d.js uniquement : ces trois trames héritent toutes
// de semaines-4-i.js, donc les jours des séances de qualité sont identiques.
// (semaines-3-d.js a sa propre table car sa structure à un seul jour de qualité diffère.)
module.exports = {
  1: { replace: { Jeudi: {
    titre:'6 × 300 mètres', pcts:[[65,65],[90,95]],
    corps:'6 × 300m à {{P}}. Effort soutenu mais maîtrisé. Récupération 90 sec au trot entre chaque. L\'objectif est la régularité, pas la vitesse maximale.',
    note:'RPE 7-8/10 · À ce stade, mieux vaut une allure tenue qu\'une allure trop ambitieuse.' } } },
  2: { replace: { Jeudi: {
    titre:'8 × 300 mètres', pcts:[[65,65],[90,95]],
    corps:'8 × 300m à {{P}}. Deux répétitions de plus que la semaine dernière. Récupération 90 sec au trot. Maintiens la même allure du premier au dernier.',
    note:'RPE 7-8/10 · La régularité avant la vitesse.' } } },
  3: { replace: {
    Mercredi: { titre:'Tempo continu, 12 minutes', duree:'50 min', pcts:[[65,70],[80,80]],
      corps:'12 minutes continues à {{P}}. Premier contact avec l\'allure seuil, en restant largement maîtrisé. Tu dois pouvoir prononcer quelques mots.',
      note:'RPE 6-7/10 · Pas besoin d\'aller plus loin pour progresser à ce stade.' },
    Vendredi: { titre:'5 × 600 mètres', duree:'60 min', pcts:[[65,65],[82,85]],
      corps:'5 × 600m à {{P}}. Récupération 2 min au trot. Ces répétitions construisent ta résistance à l\'allure seuil sans te brûler.',
      note:'RPE 7/10 · Si la 5e est nettement plus lente, tu es parti trop vite.' },
  } },
  4: { replace: {
    Mercredi: { titre:'2 × 10 minutes au seuil', duree:'55 min', pcts:[[82,82]],
      corps:'2 × 10 min à {{P}} avec 3 min de récupération. La deuxième répétition est plus difficile, c\'est normal.',
      note:'RPE 7/10 · Concentre-toi sur la régularité plus que sur la vitesse.' },
    Vendredi: { titre:'6 × 600 mètres', duree:'65 min', pcts:[[85,88]],
      corps:'6 × 600m à {{P}}. Une répétition de plus que la semaine dernière. Récupération 2 min au trot.',
      note:'RPE 7-8/10 · Cette charge progressive prépare la suite du plan.' },
  } },
  5: { replace: {
    Mardi: { titre:'6 × côtes, 100 mètres', duree:'50 min', pcts:[[65,70]],
      corps:'6 montées de 100m à effort soutenu, pas maximal. Genoux hauts, bras actifs. Descente au trot complète entre chaque montée.',
      note:'RPE 7-8/10 sur les montées · Les côtes en douceur protègent tes tendons.' },
    Vendredi: { titre:'10 × 200 mètres', duree:'60 min', pcts:[[65,65],[95,100]],
      corps:'10 × 200m à {{P}}. Récupération 60 sec entre chaque. Maintiens la même vitesse sur les 10.',
      note:'RPE 8/10 · Volume volontairement réduit pour bien encaisser la semaine.' },
  } },
  6: { replace: {
    Mardi: { titre:'2 × 10 minutes au seuil', duree:'60 min', pcts:[[85,87]],
      corps:'2 × 10 min à {{P}} avec 3 min de récupération entre chaque.',
      note:'RPE 7-8/10 · Tu retrouves une allure proche de celle de la semaine 4, en plus rapide.' },
    Jeudi: { titre:'3 × 1,5 km à allure objectif', duree:'60 min',
      corps:'3 × 1,5 km exactement à ton allure objectif 10km ({{OBJ}}). Récupération 90 sec au trot. Tu répètes littéralement ton allure de course.',
      note:'RPE 8/10 · Si {{OBJ}} est trop facile, ton objectif est peut-être trop prudent.' },
  } },
  7: { replace: { Jeudi: {
    titre:'4 × 300 mètres, volume réduit', pcts:[[90,95]],
    corps:'4 × 300m à {{P}}. Volume réduit mais intensité maintenue. Récupération 2 min entre chaque.',
    note:'RPE 7-8/10 · Ces répétitions maintiennent tes sensations sans te fatiguer.' } } },
}
