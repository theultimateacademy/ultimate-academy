// Marathon 12 semaines · 4 séances/semaine · Palier Débutant (VMA ≤ 13.5)
// Surcharges : fractionnés plus courts, allures plus douces, SL plus courtes
const { applyOverrides } = require('../../lib/tier-overrides')
const base = require('./semaines-4-i.js')

module.exports = applyOverrides(base, {
  1: { replace: { Jeudi: {
    titre:'6 × 400 mètres', pcts:[[65,65],[85,90]],
    corps:'6 × 400m à {{P}}. Effort soutenu mais confortable. Récupération 90 sec au trot entre chaque. Régularité avant vitesse.',
    note:'RPE 6-7/10 · Pour un premier plan marathon, 400m est la distance idéale pour construire la résistance.' },
    Dimanche: { duree:'65 min',
    corps:'65 min à {{P}}. Légèrement plus court que la trame standard. Régulier et contrôlé. Hydrate-toi toutes les 20 min.',
    note:'RPE 4-5/10 · La durée prime sur l\'allure. Aucun effort excessif.' } } },
  2: { replace: { Jeudi: {
    titre:'8 × 400 mètres', pcts:[[65,65],[85,90]],
    corps:'8 × 400m à {{P}}. Deux répétitions de plus. Récupération 90 sec au trot. Maintiens la même allure sur les 8.',
    note:'RPE 6-7/10 · La régularité est plus importante que la vitesse maximale.' },
    Dimanche: { duree:'75 min',
    corps:'75 min à {{P}}. 10 minutes de plus qu\'en semaine 1. Hydrate-toi toutes les 20-25 min.',
    note:'RPE 4-5/10 · La sortie longue est la séance la plus importante du plan marathon.' } } },
  3: { replace: { Mercredi: {
    titre:'Tempo continu, 12 minutes', duree:'50 min', pcts:[[65,70],[80,80]],
    corps:'12 minutes continues à {{P}}. Premier contact avec l\'allure seuil, légèrement plus douce pour ce palier. Tu dois pouvoir prononcer quelques mots.',
    note:'RPE 6/10 · L\'allure seuil à 80% VMA est adaptée pour débutant.' },
    Vendredi: {
    titre:'4 × 600 mètres', pcts:[[65,65],[85,90]],
    corps:'4 × 600m à {{P}}. Intervalles plus courts que la trame. Récupération 2 min au trot. Termine par 600m à ton allure objectif marathon ({{OBJ}}).',
    note:'RPE 7/10 · 600m est la distance adaptée à ce palier.' },
    Dimanche: { duree:'85 min',
    corps:'85 min à {{P}}. Régulier, hydraté, concentré sur ta foulée.',
    note:'RPE 5/10 · La fatigue en fin de semaine est normale. Récupère bien.' } } },
  4: { replace: { Mercredi: {
    titre:'2 × 10 minutes au seuil', pcts:[[65,70],[82,82]],
    corps:'2 × 10 min à {{P}} avec 3 min de récupération entre chaque. La deuxième répétition se termine fatigué, c\'est voulu.',
    note:'RPE 6-7/10 · 20 min totales au seuil, adapté au palier débutant.' },
    Vendredi: {
    titre:'5 × 600 mètres', pcts:[[65,65],[85,90]],
    corps:'5 × 600m à {{P}}. Une répétition de plus. Récupération 2 min au trot. Termine par 600m à {{OBJ}}.',
    note:'RPE 7/10 · Progression douce vers les intervalles plus longs.' },
    Dimanche: { duree:'95 min',
    corps:'85 min à {{P}}, puis les 10 dernières minutes à ton allure objectif marathon ({{OBJ}}). Tu apprends à finir sur la bonne allure.',
    note:'RPE 5-6/10 puis 6-7/10 · Mémorise la sensation de l\'allure marathon sur jambes fatiguées.' } } },
  5: { replace: { Jeudi: {
    titre:'3 × 10 minutes au seuil', pcts:[[65,70],[82,82]],
    corps:'3 × 10 min à {{P}} avec 3 min de récupération entre chaque. La troisième répétition est la plus difficile.',
    note:'RPE 7/10 · 30 min totales au seuil, adapté au palier débutant.' },
    Dimanche: { duree:'110 min',
    corps:'1h50 à {{P}}. Ton premier cap proche des 2 heures. Gel à 1h de course. Hydration toutes les 20 min.',
    note:'RPE 5-6/10 · Le palier débutant atteint 1h50 au lieu de 2h.' } } },
  6: { replace: { Mercredi: {
    titre:'2 × 15 minutes au seuil', pcts:[[65,70],[83,83]],
    corps:'2 × 15 min à {{P}} avec 3 min de récupération entre chaque. 30 min totales au seuil.',
    note:'RPE 7/10 · Progression douce vers les volumes standard.' },
    Dimanche: { duree:'2h10',
    corps:'80 min à {{P}}, puis 6 km à ton allure objectif marathon ({{OBJ}}), puis retour à l\'allure EF. Gel à 1h et à 1h20.',
    note:'RPE 5-6/10 en EF · 6-7/10 sur les 6 km · Bloc allure marathon raccourci pour ce palier.' } } },
  7: { replace: { Mercredi: {
    titre:'3 × 12 minutes au seuil', pcts:[[65,70],[83,83]],
    corps:'3 × 12 min à {{P}} avec 3 min de récupération entre chaque. La troisième est la plus difficile. Maintiens l\'allure.',
    note:'RPE 7-8/10 · 36 min totales au seuil adapté débutant.' },
    Vendredi: {
    titre:'6 × 600 mètres', pcts:[[65,65],[86,90]],
    corps:'6 × 600m à {{P}}. Récupération 2 min au trot. Régulier sur les 6.',
    note:'RPE 7-8/10 · Ces 600m développent ta résistance à l\'effort.' },
    Dimanche: { duree:'2h20',
    corps:'2h20 à {{P}}. Ta sortie longue la plus longue jusqu\'ici. Gel à 1h et à 1h40. Régularité, hydratation toutes les 20 min.',
    note:'RPE 6/10 · Le palier débutant atteint 2h20 au lieu de 2h35.' } } },
  8: { replace: { Mercredi: {
    titre:'4 × 10 minutes au seuil', pcts:[[65,70],[84,84]],
    corps:'4 × 10 min à {{P}} avec 3 min de récupération entre chaque. La quatrième est la plus difficile.',
    note:'RPE 7-8/10 · 40 min au seuil. Ton pic de charge pour ce palier.' },
    Vendredi: {
    titre:'8 × 600 mètres', pcts:[[65,65],[86,90]],
    corps:'8 × 600m à {{P}}. Deux répétitions de plus. Récupération 2 min au trot. Maintiens la même allure.',
    note:'RPE 7-8/10 · Semaine de charge maximale adaptée au palier débutant.' },
    Dimanche: { duree:'2h30',
    corps:'1h45 à {{P}}, puis 10 km à ton allure objectif marathon ({{OBJ}}), puis retour à l\'allure EF. Gel à 1h, à 1h30.',
    note:'RPE 5-6/10 en EF · 7/10 sur les 10 km · Après cette semaine, l\'entraînement dur est terminé.' } } },
  9: { replace: { Jeudi: {
    titre:'2 × 6 km à allure marathon', duree:'65 min',
    corps:'2 × 6 km exactement à ton allure objectif marathon ({{OBJ}}). Récupération 2 min au trot. 2 blocs adaptés au palier débutant.',
    note:'RPE 6-7/10 · La régularité sur les 2 blocs est l\'objectif.' },
    Dimanche: { duree:'2h',
    corps:'70 min à {{P}}, puis 8 km à ton allure objectif marathon ({{OBJ}}), puis retour à l\'allure EF. Gel à 1h et à 1h10.',
    note:'RPE 5-6/10 en EF · 6-7/10 sur les 8 km · Mémorise cette sensation.' } } },
  10: { replace: { Jeudi: {
    titre:'3 × 6 km à allure marathon', duree:'75 min',
    corps:'3 × 6 km exactement à ton allure objectif marathon ({{OBJ}}). Récupération 2 min au trot. Une répétition de plus qu\'en semaine 9.',
    note:'RPE 7/10 · 18 km à l\'allure objectif. Pour ce palier, c\'est le pic spécifique.' },
    Dimanche: { duree:'2h10',
    corps:'45 min à {{P}}, puis 12 km à ton allure objectif marathon ({{OBJ}}), puis retour à l\'allure EF. Gel à 40 min, à 1h10, à 1h40.',
    note:'RPE 5-6/10 en EF · 7/10 sur les 12 km · Après cette séance, les séances dures sont terminées.' } } },
})
