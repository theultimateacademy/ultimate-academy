// Trame 3 séances/semaine — palier Avancé (VMA 19 à 24).
const { applyOverrides } = require('../../lib/tier-overrides')
const base = require('./semaines-3-i.js')

module.exports = applyOverrides(base, {
  1: { replace: { Jeudi: {
    titre:'12 × 400 mètres', pcts:[[65,65],[97,102]],
    corps:'12 × 400m à {{P}}. Volume relevé d\'entrée car ton niveau le permet. Récupération 90 sec au trot entre chaque.',
    note:'RPE 8-9/10 · Avec seulement 3 séances/semaine, cette séance porte une grosse partie de ta charge.' } } },
  2: { conseil:'Sur les 14 × 400m, l\'objectif c\'est de tenir la même allure sur les 14. Si les dernières sont nettement plus lentes, tu es parti trop vite.',
    replace: { Jeudi: {
    titre:'14 × 400 mètres', pcts:[[65,65],[97,102]],
    corps:'14 × 400m à {{P}}. Deux répétitions de plus. Récupération 90 sec au trot.',
    note:'RPE 8-9/10 · La récupération courte est volontaire pour développer ta résistance.' } } },
  3: { replace: { Jeudi: {
    titre:'Tempo continu, 20 minutes', duree:'60 min', pcts:[[65,70],[87,87]],
    corps:'20 minutes continues à {{P}}. Bloc long car ton seuil te le permet. Difficile mais tenable sur toute la durée.',
    note:'RPE 8/10 · La régularité prime sur la vitesse pure, même à ce niveau.' } } },
  4: { replace: { Jeudi: {
    titre:'7 × 1000 mètres', duree:'75 min', pcts:[[65,65],[90,93]],
    corps:'7 × 1000m à {{P}}. Récupération 2 min au trot. Termine par 1,5 km à ton allure objectif 10km ({{OBJ}}), pour comparer les sensations.',
    note:'RPE 8-9/10 · Cette densité te rapproche directement de l\'allure 10km.' } } },
  5: { replace: { Jeudi: {
    titre:'12 × côtes, 200 mètres', duree:'60 min', pcts:[[65,70]],
    corps:'12 montées de 200m à effort maximal. Côte plus longue et plus de répétitions qu\'un profil standard. Genoux hauts, bras actifs, pousse à fond.',
    note:'RPE 9/10 sur les montées · Une séance de côtes nettement plus exigeante.' } } },
  6: { replace: { Jeudi: {
    titre:'4 × 2 km à allure objectif', duree:'70 min',
    corps:'4 × 2 km exactement à ton allure objectif 10km ({{OBJ}}). Récupération 90 sec au trot. Avec 3 séances/semaine, c\'est ta séance la plus spécifique du plan.',
    note:'RPE 8-9/10 · Si {{OBJ}} est trop facile sur les 4, ton objectif est peut-être trop prudent.' } } },
  7: { replace: { Jeudi: {
    titre:'6 × 400 mètres, volume réduit', pcts:[[97,102]],
    corps:'6 × 400m à {{P}}. Volume réduit par rapport à ta charge habituelle mais intensité maintenue. Récupération 2 min entre chaque. Termine par 2 × 1 km à ton allure objectif 10km ({{OBJ}}).',
    note:'RPE 8/10 · Même en consolidation, ton volume reste au-dessus de la moyenne.' } } },
})
