// Surcharges Débutant pour le plan 3 séances/semaine.
// Toutes les séances de qualité sont sur Jeudi dans semaines-3-i.js.
module.exports = {
  1: { replace: { Jeudi: {
    titre:'4 × 800 mètres', pcts:[[65,65],[83,86]],
    corps:'4 × 800m à {{P}}. Effort soutenu mais maîtrisé. Récupération 2 min au trot. Volume réduit pour commencer sans accumulation.',
    note:'RPE 6-7/10 · À ce stade, mieux vaut une allure tenue sur 4 que manquée sur 6.' } } },
  2: { replace: { Jeudi: {
    titre:'5 × 800 mètres', pcts:[[65,65],[83,86]],
    corps:'5 × 800m à {{P}}. Une répétition de plus. Récupération 2 min au trot. Maintiens la même allure sur les 5.',
    note:'RPE 6-7/10 · La régularité avant la vitesse.' } } },
  3: { replace: { Jeudi: {
    titre:'Tempo continu, 15 minutes', pcts:[[65,70],[80,80]],
    echauff:'25 min de footing progressif à {{P}}.', duree:'55 min',
    corps:'15 minutes continues à {{P}}. Légèrement moins long que la version standard car c\'est ton premier tempo. Tu dois pouvoir prononcer quelques mots.',
    note:'RPE 6-7/10 · Pas besoin d\'aller plus loin pour progresser à ce stade.' } } },
  4: { replace: { Jeudi: {
    titre:'2 × 14 minutes au seuil', pcts:[[65,70],[82,82]],
    echauff:'25 min de footing progressif à {{P}}.', duree:'60 min',
    corps:'2 × 14 min à {{P}} avec 3 min de récupération. Légèrement moins long que la version standard. La deuxième est plus difficile, c\'est normal.',
    note:'RPE 7/10 · Concentre-toi sur la régularité.' } } },
  5: { replace: { Jeudi: {
    titre:'2 × 12 minutes au seuil', pcts:[[65,70],[83,83]],
    corps:'2 × 12 min à {{P}} avec 3 min de récupération entre chaque. Volume adapté à ton profil.',
    note:'RPE 7/10 · 24 min au seuil, une charge sérieuse à ce niveau.' } } },
  6: { replace: { Jeudi: {
    titre:'2 × 15 minutes au seuil', pcts:[[65,70],[83,83]],
    corps:'2 × 15 min à {{P}} avec 3 min de récupération entre chaque.',
    note:'RPE 7-8/10 · 30 min totales au seuil, ton pic sur cette séance.' } } },
  7: { replace: { Jeudi: {
    titre:'2 × 16 minutes au seuil', pcts:[[65,70],[83,83]],
    corps:'2 × 16 min à {{P}} avec 3 min de récupération entre chaque. Légèrement moins long que la version standard car c\'est ta seule séance de qualité.',
    note:'RPE 7-8/10 · 32 min au seuil, une charge sérieuse à ce niveau.' } } },
  8: { replace: { Jeudi: {
    titre:'3 × 12 minutes au seuil', pcts:[[65,70],[83,83]],
    corps:'3 × 12 min à {{P}} avec 3 min de récupération entre chaque. La troisième est la plus difficile, maintiens l\'allure.',
    note:'RPE 7-8/10 · 36 min au seuil, ton record sur cette séance.' } } },
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
