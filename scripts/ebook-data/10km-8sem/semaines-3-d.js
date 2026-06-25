// Trame 3 séances/semaine — palier Débutant (VMA 10 à 13.5).
const { applyOverrides } = require('../../lib/tier-overrides')
const base = require('./semaines-3-i.js')

module.exports = applyOverrides(base, {
  1: { replace: { Jeudi: {
    titre:'6 × 300 mètres', pcts:[[65,65],[90,95]],
    corps:'6 × 300m à {{P}}. Effort soutenu mais maîtrisé. Récupération 90 sec au trot entre chaque. L\'objectif est la régularité, pas la vitesse maximale.',
    note:'RPE 7-8/10 · Avec 3 séances/semaine, mieux vaut une allure tenue qu\'une allure trop ambitieuse.' } } },
  2: { replace: { Jeudi: {
    titre:'8 × 300 mètres', pcts:[[65,65],[90,95]],
    corps:'8 × 300m à {{P}}. Deux répétitions de plus que la semaine dernière. Récupération 90 sec au trot.',
    note:'RPE 7-8/10 · La régularité avant la vitesse.' } } },
  3: { replace: { Jeudi: {
    titre:'Tempo continu, 10 minutes', duree:'45 min', pcts:[[65,70],[78,78]],
    corps:'10 minutes continues à {{P}}. Premier contact avec l\'allure seuil, en restant largement maîtrisé. Tu dois pouvoir prononcer quelques mots.',
    note:'RPE 6/10 · Pas besoin d\'aller plus loin pour progresser à ce stade.' } } },
  4: { replace: { Jeudi: {
    titre:'5 × 600 mètres', duree:'55 min', pcts:[[65,65],[82,85]],
    corps:'5 × 600m à {{P}}. Récupération 2 min au trot. Ces répétitions construisent ta résistance à l\'allure seuil sans te brûler.',
    note:'RPE 7/10 · Si la dernière est nettement plus lente, tu es parti trop vite.' } } },
  5: { replace: { Jeudi: {
    titre:'6 × côtes, 100 mètres', duree:'45 min', pcts:[[65,70]],
    corps:'6 montées de 100m à effort soutenu, pas maximal. Genoux hauts, bras actifs. Descente au trot complète entre chaque montée.',
    note:'RPE 7-8/10 sur les montées · Les côtes en douceur protègent tes tendons.' } } },
  6: { replace: { Jeudi: {
    titre:'2 × 1,5 km à allure objectif', duree:'50 min',
    corps:'2 × 1,5 km exactement à ton allure objectif 10km ({{OBJ}}). Récupération 90 sec au trot. Tu répètes littéralement ton allure de course.',
    note:'RPE 8/10 · Si {{OBJ}} est trop facile, ton objectif est peut-être trop prudent.' } } },
  7: { replace: { Jeudi: {
    titre:'3 × 300 mètres, volume réduit', pcts:[[90,95]],
    corps:'3 × 300m à {{P}}. Volume très réduit mais intensité maintenue. Récupération 2 min entre chaque.',
    note:'RPE 7-8/10 · Ces répétitions maintiennent tes sensations sans te fatiguer.' } } },
})
