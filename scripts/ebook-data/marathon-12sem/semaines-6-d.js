// Marathon 12 semaines · 6 séances/semaine · Palier Débutant (VMA ≤ 13.5)
// Surcharges : côtes réduites, fractionnés raccourcis, tempo réduit, SL plus courtes
const { applyOverrides } = require('../../lib/tier-overrides')
const base = require('./semaines-6-i.js')

module.exports = applyOverrides(base, {
  1: { replace: {
    Mardi: {
    titre:'4 côtes de 100 mètres', duree:'40 min', pcts:[[65,70]],
    echauff:'15 min progressif à {{P}}.',
    corps:'4 montées de 100m à effort soutenu, moins de répétitions que la trame (8×80m). Genoux hauts, bras actifs. Descente en marchant pour récupération complète.',
    retour:'8 min footing léger.',
    note:'RPE 6-7/10 sur les montées · Moins de répétitions, priorité à la technique.' },
    Jeudi: {
    titre:'6 × 400 mètres', pcts:[[65,65],[85,90]],
    echauff:'25 min progressif à {{P}}, terminer par 4 accélérations de 80m.',
    corps:'6 × 400m à {{P}}. Effort soutenu mais confortable. Récupération 90 sec au trot. Régularité avant vitesse.',
    retour:'10 min footing très lent.',
    note:'RPE 6-7/10 · Pour un premier plan marathon, 400m est la distance idéale.' },
    Dimanche: { duree:'65 min',
    corps:'65 min à {{P}}. Plus court que la trame. Régulier et contrôlé. Hydrate-toi toutes les 20 min.',
    note:'RPE 4-5/10 · La durée prime sur l\'allure. Aucun effort excessif.' } } },
  2: { replace: {
    Mardi: {
    titre:'4 côtes de 100 mètres', duree:'40 min', pcts:[[65,70]],
    echauff:'15 min progressif à {{P}}.',
    corps:'4 montées de 100m, même volume que semaine 1. Genoux hauts, bras actifs. Descente au trot pour récupération active.',
    retour:'8 min footing léger.',
    note:'RPE 6-7/10 sur les montées · Côtes réduites pour ce palier.' },
    Jeudi: {
    titre:'4 × 1000 mètres', pcts:[[65,65],[85,90]],
    echauff:'25 min progressif à {{P}}, finir par 4 accélérations 80m.',
    corps:'4 × 1000m à {{P}}. Plus court que 4×2000m, adapté pour progresser. Récupération 2 min au trot entre chaque.',
    retour:'10 min footing très lent.',
    note:'RPE 7/10 · La progression vers les 2000m se fera dans les semaines suivantes.' },
    Dimanche: { duree:'80 min',
    corps:'80 min à {{P}}. Régulier, hydraté. 15 min de plus qu\'en semaine 1.',
    note:'RPE 4-5/10 · La sortie longue est le pilier du plan marathon débutant.' } } },
  3: { replace: {
    Mardi: {
    titre:'6 côtes de 100 mètres', duree:'45 min', pcts:[[65,70]],
    echauff:'18 min progressif à {{P}}.',
    corps:'6 montées de 100m, progression vers le volume. Effort soutenu sur toute la montée. Descente au trot pour récupération active.',
    retour:'8 min footing léger.',
    note:'RPE 6-7/10 sur les montées · Légère progression du volume de côtes.' },
    Mercredi: {
    titre:'Tempo 15 minutes en continu', duree:'50 min', pcts:[[65,70],[80,82]],
    echauff:'20 min progressif à {{P}}, finir par 4 accélérations 80m.',
    corps:'15 min continus à {{P}}. Allure légèrement plus douce que la trame. Premier contact avec l\'effort soutenu. Tu dois pouvoir prononcer quelques mots.',
    retour:'10 min footing très lent.',
    note:'RPE 6/10 · 15 min en continu au seuil léger est un premier cap.' },
    Vendredi: {
    titre:'4 × 1000 mètres', pcts:[[65,65],[85,90]],
    echauff:'25 min progressif à {{P}}, finir par 4 accélérations 80m.',
    corps:'4 × 1000m à {{P}}. Récupération 2 min au trot. Maintiens la même allure sur les 4.',
    retour:'10 min footing très lent.',
    note:'RPE 7/10 · Deux séances de qualité distinctes cette semaine.' },
    Dimanche: { duree:'85 min',
    corps:'85 min à {{P}}. Régulier, hydraté. Pas de bloc marathon cette semaine.',
    note:'RPE 5/10 · La fatigue en fin de semaine est normale. Récupère bien.' } } },
  4: { replace: {
    Mardi: {
    titre:'4 côtes de 200 mètres', duree:'45 min', pcts:[[65,70]],
    echauff:'20 min progressif à {{P}}.',
    corps:'4 montées de 200m à effort soutenu. Distance plus longue que les semaines précédentes, effort sur 200m entiers. Moins de répétitions que la trame (6×200m).',
    retour:'10 min footing léger.',
    note:'RPE 6-7/10 sur les montées · Distance allongée à 200m, volume réduit pour ce palier.' },
    Mercredi: {
    titre:'2 × 10 minutes au seuil', pcts:[[65,70],[82,82]],
    echauff:'25 min progressif à {{P}}, finir par 4 accélérations 80m.',
    corps:'2 × 10 min à {{P}} avec 3 min de récupération. Allure légèrement plus douce que la trame.',
    retour:'10 min footing très lent.',
    note:'RPE 6-7/10 · 20 min totales au seuil léger, adapté au palier débutant.' },
    Vendredi: {
    titre:'4 × 1000 mètres + 1 km allure marathon', pcts:[[65,65],[83,88]],
    echauff:'25 min progressif à {{P}}, finir par 4 accélérations 80m.',
    corps:'4 × 1000m à {{P}}. Récupération 2 min. Après le dernier 1000m et 2 min de récup, 1 km à ton allure objectif marathon ({{OBJ}}).',
    retour:'10 min footing très lent.',
    note:'RPE 7/10 · Le bloc final à {{OBJ}} grave l\'allure cible dans ta mémoire musculaire.' },
    Dimanche: { duree:'95 min',
    corps:'85 min à {{P}}, puis 10 min à ton allure objectif marathon ({{OBJ}}). Gel à 1h. Mémorise cette sensation.',
    note:'RPE 5-6/10 puis 6-7/10 · Bloc OBJ raccourci pour ce palier.' } } },
  5: { replace: {
    Mardi: {
    titre:'5 côtes de 150 mètres', duree:'45 min', pcts:[[65,70]],
    echauff:'18 min progressif à {{P}}.',
    corps:'5 montées de 150m à effort soutenu. Moins de répétitions que la trame (8×150m). Effort régulier sur les 150m.',
    retour:'8 min footing léger.',
    note:'RPE 6-7/10 sur les montées · Distance allongée à 150m, volume réduit pour ce palier.' },
    Mercredi: {
    titre:'2 × 15 minutes au seuil', pcts:[[65,70],[80,83]],
    echauff:'25 min progressif à {{P}}, finir par 4 accélérations 80m.',
    corps:'2 × 15 min à {{P}} avec 4 min de récupération. 30 min totales au seuil. Allure adaptée à ce palier.',
    retour:'10 min footing très lent.',
    note:'RPE 7/10 · 30 min au seuil léger, premier grand cap tempo.' },
    Dimanche: { duree:'1h50',
    corps:'1h50 à {{P}}. Premier cap proche des 2 heures. Gel à 1h. Pas de bloc marathon cette semaine.',
    note:'RPE 5-6/10 · Le palier débutant atteint 1h50 au lieu de 2h+30min.' } } },
  6: { replace: {
    Mardi: {
    titre:'6 côtes de 150 mètres', duree:'50 min', pcts:[[65,70]],
    echauff:'20 min progressif à {{P}}.',
    corps:'6 montées de 150m. Une de plus qu\'en semaine 5. Effort régulier sur les 150m. Moins de répétitions que la trame (10×150m).',
    retour:'8 min footing léger.',
    note:'RPE 7/10 sur les montées · Progression douce vers le volume de côtes.' },
    Mercredi: {
    titre:'2 × 2000 mètres, premier contact avec le long fractionné', pcts:[[65,65],[77,82]],
    echauff:'25 min progressif à {{P}}, finir par 4 accélérations 80m.',
    corps:'2 × 2000m à {{P}}. Récupération 5 min. Version raccourcie de 2×5000m.',
    retour:'10 min footing très lent.',
    note:'RPE 7/10 · 2×2000m avant d\'attaquer les 5000m dans les semaines suivantes.' },
    Dimanche: { duree:'2h',
    corps:'100 min à {{P}}, puis 20 min à ton allure objectif marathon ({{OBJ}}). Gel à 1h et à 1h20. Bloc OBJ raccourci pour ce palier.',
    note:'RPE 5-6/10 en EF · 6-7/10 sur les 20 min · Mémorise la sensation de {{OBJ}}.' } } },
  7: { replace: {
    Mardi: {
    titre:'5 côtes de 200 mètres', duree:'50 min', pcts:[[65,70]],
    echauff:'20 min progressif à {{P}}.',
    corps:'5 montées de 200m à effort soutenu. Moins de répétitions que la trame (8×200m). Effort maintenu sur les 200m.',
    retour:'8 min footing léger.',
    note:'RPE 7/10 sur les montées · 200m, distance longue pour les côtes. Moins de blocs que la trame.' },
    Mercredi: {
    titre:'2000m / 3000m / 2000m progressif', pcts:[[65,65],[80,82],[82,84],[84,87]],
    echauff:'25 min progressif à {{P}}, finir par 4 accélérations 80m.',
    corps:'2000m à {{P}} → récup 4 min → 3000m à {{P}} → récup 4 min → 2000m à {{P}}. Version raccourcie de la séance 3000/5000/3000. Progression sur les 3 blocs.',
    retour:'10 min footing très lent.',
    note:'RPE 7-8/10 · Même progression mais distances raccourcies pour ce palier.' },
    Vendredi: {
    titre:'2 × 15 minutes au seuil', pcts:[[65,70],[82,83]],
    echauff:'25 min progressif à {{P}}, finir par 4 accélérations 80m.',
    corps:'2 × 15 min à {{P}}. Récupération 4 min. Maintiens l\'allure sur les 2 blocs.',
    retour:'10 min footing très lent.',
    note:'RPE 7/10 · 30 min au seuil, maintient la forme sans surcharger.' },
    Dimanche: { duree:'2h10',
    corps:'2h10 à {{P}}. Sortie longue sans bloc allure marathon pour ce palier.',
    note:'RPE 6/10 · Durée maximale sans bloc OBJ pour consolider le volume.' } } },
  8: { replace: {
    Mercredi: {
    titre:'3 × 1500 mètres + 1 × 2 km allure marathon', pcts:[[65,65],[80,85]],
    echauff:'25 min progressif à {{P}}, finir par 4 accélérations 80m.',
    corps:'3 × 1500m à {{P}} → récup 3 min trot → 2 km à ton allure objectif marathon ({{OBJ}}). Version adaptée de FL-14.',
    retour:'10 min footing très lent.',
    note:'RPE 7-8/10 · Séance mixte adaptée au palier débutant.' },
    Vendredi: {
    titre:'6 × 800 mètres', pcts:[[65,65],[85,90]],
    echauff:'25 min progressif à {{P}}, finir par 4 accélérations 80m.',
    corps:'6 × 800m à {{P}}. Récupération 90 sec au trot. Maintiens la même allure sur les 6.',
    retour:'10 min footing très lent.',
    note:'RPE 7-8/10 · Semaine de charge maximale adaptée au palier débutant.' },
    Dimanche: { duree:'2h20',
    corps:'1h50 à {{P}}, puis 30 min à ton allure objectif marathon ({{OBJ}}). Gel à 1h et à 1h20. Le pic de charge du plan débutant.',
    note:'RPE 5-6/10 en EF · 7/10 sur les 30 min · Le pic de charge du plan débutant.' } } },
  9: { replace: {
    Mercredi: {
    titre:'2 × 4 km à allure marathon', duree:'65 min', pcts:[[65,65]],
    echauff:'20 min footing EF à {{P}}.',
    corps:'2 × 4 km exactement à ton allure objectif marathon ({{OBJ}}). Récupération 3 min. 2 blocs adaptés au palier débutant.',
    retour:'10 min footing léger.',
    note:'RPE 6-7/10 · La régularité sur les 2 blocs est l\'objectif.' },
    Dimanche: { duree:'1h55',
    corps:'80 min à {{P}}, puis 35 min à ton allure objectif marathon ({{OBJ}}). Gel à 1h et à 1h10. Mémorise cette sensation.',
    note:'RPE 5-6/10 en EF · 6-7/10 sur les 35 min · Mémorise cette sensation.' } } },
  10: { replace: {
    Mercredi: {
    titre:'1 × 5000 mètres, répétition générale', duree:'65 min', pcts:[[65,65],[78,83]],
    echauff:'25 min progressif à {{P}}, finir par 4 accélérations 80m.',
    corps:'1 × 5000m à {{P}}. Un seul bloc tenu de bout en bout. Après 4 min de récup, 2 km à {{OBJ}}.',
    retour:'10 min footing très lent.',
    note:'RPE 7-8/10 · Un 5000m complet est le pic spécifique pour ce palier.' },
    Vendredi: {
    titre:'3 × 2 km à allure marathon, blocs courts', duree:'50 min', pcts:[[65,65]],
    echauff:'20 min footing EF à {{P}}.',
    corps:'3 × 2 km exactement à ton allure objectif marathon ({{OBJ}}). Récupération 90 sec au trot, plus serrée que les 3 min des 2×4km. 6 km à {{OBJ}} en blocs courts : stimulus différent de la semaine 9.',
    retour:'10 min footing léger.',
    note:'RPE 7/10 · Blocs courts, récup serrée : le stimulus différent de la semaine 9. Après cette séance, les séances dures sont terminées.' },
    Dimanche: { duree:'1h50',
    corps:'80 min à {{P}}, puis 30 min à ton allure objectif marathon ({{OBJ}}). Gel à 1h et à 1h10. Dernière sortie longue chargée.',
    note:'RPE 5-6/10 en EF · 7/10 sur les 30 min · Après cette sortie, les séances dures sont terminées.' } } },
})
