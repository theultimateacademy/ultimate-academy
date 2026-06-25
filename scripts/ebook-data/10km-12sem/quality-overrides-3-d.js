// Surcharges Débutant pour le plan 3 séances/semaine.
// Toutes les séances de qualité sont sur Jeudi dans semaines-3-i.js.
module.exports = {
  1: { replace: { Jeudi: {
    titre:'5 × 300 mètres', pcts:[[65,65],[88,92]],
    corps:'5 × 300m à {{P}}. Effort soutenu mais maîtrisé. Récupération 90 sec au trot entre chaque. L\'objectif est la régularité.',
    note:'RPE 7/10 · À ce stade, mieux vaut une allure tenue qu\'une allure trop ambitieuse.' } } },
  2: { replace: { Jeudi: {
    titre:'7 × 300 mètres', pcts:[[65,65],[88,92]],
    corps:'7 × 300m à {{P}}. Deux répétitions de plus. Récupération 90 sec au trot. Maintiens la même allure sur les 7.',
    note:'RPE 7/10 · La régularité avant la vitesse.' } } },
  3: { replace: { Jeudi: {
    titre:'Tempo continu, 12 minutes', pcts:[[65,70],[80,80]],
    echauff:'25 min de footing progressif à {{P}}.', duree:'50 min',
    corps:'12 minutes continues à {{P}}. Premier contact avec l\'allure seuil. Tu dois pouvoir prononcer quelques mots.',
    note:'RPE 6-7/10 · Pas besoin d\'aller plus loin pour progresser à ce stade.' } } },
  4: { replace: { Jeudi: {
    titre:'4 × 800 mètres', pcts:[[65,65],[82,85]],
    corps:'4 × 800m à {{P}}. Récupération 2 min au trot. Ces répétitions construisent ta résistance à l\'allure seuil sans te brûler. Termine par 1 km à ton allure objectif 10km ({{OBJ}}).',
    note:'RPE 7/10 · Si la 4e est nettement plus lente, tu es parti trop vite.' } } },
  5: { replace: { Jeudi: {
    titre:'8 × 300 mètres', pcts:[[65,65],[90,95]],
    corps:'8 × 300m à {{P}}. Effort soutenu. Récupération 90 sec entre chaque. Maintiens la même vitesse sur les 8.',
    note:'RPE 7-8/10 · Volume adapté à ton niveau.' } } },
  6: { replace: { Jeudi: {
    titre:'6 × côtes, 100 mètres', pcts:[[65,70]],
    corps:'6 montées de 100m à effort soutenu, pas maximal. Genoux hauts, bras actifs. Descente au trot complète entre chaque montée.',
    note:'RPE 7-8/10 sur les montées · Les côtes en douceur protègent tes tendons.' } } },
  7: { replace: { Jeudi: {
    titre:'2 × 12 minutes au seuil', pcts:[[83,83]],
    corps:'2 × 12 min à {{P}} avec 3 min de récupération entre chaque.',
    note:'RPE 7-8/10 · 24 min au seuil, une charge sérieuse à ce niveau.' } } },
  8: { replace: { Jeudi: {
    titre:'10 × 200 mètres', pcts:[[65,65],[92,97]],
    corps:'10 × 200m à {{P}}. Récupération 60 sec entre chaque. Maintiens la même vitesse sur les 10. Termine par 1 km à ton allure objectif 10km ({{OBJ}}).',
    note:'RPE 8/10 · Volume adapté à ton profil.' } } },
  9: { replace: { Jeudi: {
    titre:'2 × 2 km à allure objectif',
    corps:'2 × 2 km exactement à ton allure objectif 10km ({{OBJ}}). Récupération 90 sec au trot. Tu répètes littéralement ton allure de course.',
    note:'RPE 8/10 · Si {{OBJ}} est trop facile, ton objectif est peut-être trop prudent.' } } },
  10: { replace: { Jeudi: {
    titre:'3 × 2 km à allure objectif',
    corps:'3 × 2 km exactement à ton allure objectif 10km ({{OBJ}}). Récupération 90 sec au trot. Une répétition de plus qu\'en semaine 9.',
    note:'RPE 8/10 · La troisième est la plus précieuse, elle simule la fin de course.' } } },
  11: { replace: { Jeudi: {
    titre:'3 × 300 mètres, volume réduit', pcts:[[65,65],[88,92]],
    corps:'3 × 300m à {{P}}. Volume réduit mais intensité maintenue. Récupération 2 min entre chaque.',
    note:'RPE 7/10 · Ces répétitions maintiennent tes sensations sans te fatiguer.' } } },
}
