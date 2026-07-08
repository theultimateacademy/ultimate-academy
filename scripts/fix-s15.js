#!/usr/bin/env node
// Fix S15 footing durations and descriptions across all 4 i-tier files
const fs = require('fs')
const path = require('path')

const dir = path.join(__dirname, 'ebook-data/marathon-16sem')

function fix(filename, pairs) {
  const fp = path.join(dir, filename)
  let c = fs.readFileSync(fp, 'utf8')
  let ok = 0
  for (const [a, b] of pairs) {
    if (c.includes(a)) { c = c.split(a).join(b); ok++ }
    else console.warn('[MISS] ' + a.substring(0, 80))
  }
  fs.writeFileSync(fp, c)
  console.log(filename + ': ' + ok + '/' + pairs.length + ' OK')
}

// ── 3-i : Samedi S15  35 → 40 min ──────────────────────────────────────────
fix('semaines-3-i.js', [
  [
    "{ jour:'Samedi', type:'EF', titre:'Footing de 35 minutes', duree:'35 min', pcts:[[65,65]],\n        echauff:'', corps:'35 min à {{P}}. Garde les jambes en mouvement. Inclus 4 à 6 accélérations de 60m à allure marathon pour réveiller les sensations.', retour:'',\n        note:'RPE 3/10 · Tu dois finir frais et légèrement dynamisé, jamais fatigué.' },",
    "{ jour:'Samedi', type:'EF', titre:'Footing de 40 minutes', duree:'40 min', pcts:[[65,65]],\n        echauff:'', corps:'40 min à {{P}}, allure vraiment légère. Dans les 10 dernières minutes, place 4 à 6 accélérations de 60m à ton allure marathon pour réveiller les sensations neuromusculaires. Les jambes doivent fourmiller d\\'impatience, pas de fatigue.', retour:'',\n        note:'RPE 3/10 · Tu dois finir frais et légèrement dynamisé, jamais fatigué.' },"
  ],
])

// ── 4-i : S15 Lundi 35→50 (premier), Vendredi 35→40, Dimanche 30→35 ────────
fix('semaines-4-i.js', [
  [
    "{ jour:'Lundi', type:'EF', titre:'Footing léger 35 minutes', duree:'35 min', pcts:[[65,65]],\n        echauff:'', corps:'35 min très faciles à {{P}}. Corps en mouvement en début de semaine d\\'affûtage.', retour:'',\n        note:'RPE 3/10.' },",
    "{ jour:'Lundi', type:'EF', titre:'Footing léger 50 minutes', duree:'50 min', pcts:[[65,65]],\n        echauff:'', corps:'50 min à {{P}}, allure légère. Le footing le plus long de la semaine de consolidation : il maintient l\\'endurance de base sans fatiguer. Cours en nature, apprécie la légèreté. La semaine de course se profile.', retour:'',\n        note:'RPE 3/10 · Tu dois finir comme si tu venais de te promener.' },"
  ],
  [
    "{ jour:'Vendredi', type:'EF', titre:'Footing léger 35 minutes', duree:'35 min', pcts:[[65,65]],\n        echauff:'', corps:'35 min à {{P}}. Inclus 4 à 6 accélérations de 60m à allure marathon.', retour:'',\n        note:'RPE 3/10.' },\n      { jour:'Dimanche', type:'EF', titre:'Footing léger 30 minutes'",
    "{ jour:'Vendredi', type:'EF', titre:'Footing léger 40 minutes', duree:'40 min', pcts:[[65,65]],\n        echauff:'', corps:'40 min à {{P}}, allure légère. Dans les 10 dernières minutes, place 4 à 6 accélérations de 60m à ton allure marathon pour garder les sensations neuromusculaires vives. Termine frais et dynamisé.', retour:'',\n        note:'RPE 3/10.' },\n      { jour:'Dimanche', type:'EF', titre:'Footing léger 35 minutes'"
  ],
  [
    "{ jour:'Dimanche', type:'EF', titre:'Footing léger 30 minutes', duree:'30 min', pcts:[[60,65]],\n        echauff:'', corps:'30 min très légers à {{P}}. Dernier footing de l\\'affûtage. Jambes légères.', retour:'',\n        note:'RPE 3/10 · Tu dois finir frais et dynamisé.' },",
    "{ jour:'Dimanche', type:'EF', titre:'Footing léger 35 minutes', duree:'35 min', pcts:[[60,65]],\n        echauff:'', corps:'35 min très légers à {{P}}. Dernier footing avant la semaine de course. Laisse les jambes rouler librement, le corps se recharge. Finis avec le sourire — le travail est fait.', retour:'',\n        note:'RPE 3/10 · Tu dois finir frais et dynamisé.' },"
  ],
])

// ── 5-i : S15 Lundi 35→50, Mardi 30→35, Vendredi 35→40, Dimanche 25→35 ────
fix('semaines-5-i.js', [
  [
    "{ jour:'Lundi', type:'EF', titre:'Footing léger 35 minutes', duree:'35 min', pcts:[[65,65]],\n        echauff:'', corps:'35 min très faciles à {{P}}.', retour:'',\n        note:'RPE 3/10.' },\n      { jour:'Mardi', type:'EF', titre:'Footing de récupération 30 minutes'",
    "{ jour:'Lundi', type:'EF', titre:'Footing léger 50 minutes', duree:'50 min', pcts:[[65,65]],\n        echauff:'', corps:'50 min à {{P}}, allure légère. Le footing le plus long de la semaine de consolidation — il maintient l\\'endurance de base sans fatiguer. Cours en nature, apprécie la légèreté des jambes après les semaines de charge. La semaine de course approche.', retour:'',\n        note:'RPE 3/10 · Tu dois finir comme si tu venais de te promener.' },\n      { jour:'Mardi', type:'EF', titre:'Footing de récupération 35 minutes'"
  ],
  [
    "{ jour:'Mardi', type:'EF', titre:'Footing de récupération 30 minutes', duree:'30 min', pcts:[[60,65]],\n        echauff:'', corps:'30 min à {{P}}. Très léger. Corps en mouvement.', retour:'',\n        note:'RPE 3/10.' },",
    "{ jour:'Mardi', type:'EF', titre:'Footing de récupération 35 minutes', duree:'35 min', pcts:[[60,62]],\n        echauff:'', corps:'35 min à {{P}}, allure très douce, bien inférieure à ton EF habituel. Semaine de consolidation : laisse les adaptations s\\'installer. Ce footing lent du mardi complète la récupération avant le seuil du mercredi.', retour:'',\n        note:'RPE 3/10.' },"
  ],
  [
    "{ jour:'Vendredi', type:'EF', titre:'Footing léger 35 minutes', duree:'35 min', pcts:[[65,65]],\n        echauff:'', corps:'35 min à {{P}}. Inclus 4 à 6 accélérations de 60m à allure marathon.', retour:'',\n        note:'RPE 3/10.' },\n      { jour:'Dimanche', type:'EF', titre:'Footing léger 25 minutes'",
    "{ jour:'Vendredi', type:'EF', titre:'Footing léger 40 minutes', duree:'40 min', pcts:[[65,65]],\n        echauff:'', corps:'40 min à {{P}}, allure légère. Dans les 10 dernières minutes, place 4 à 6 accélérations de 60m à ton allure marathon pour garder les sensations neuromusculaires vives. Termine frais et dynamisé.', retour:'',\n        note:'RPE 3/10.' },\n      { jour:'Dimanche', type:'EF', titre:'Footing léger 35 minutes'"
  ],
  [
    "{ jour:'Dimanche', type:'EF', titre:'Footing léger 25 minutes', duree:'25 min', pcts:[[60,65]],\n        echauff:'', corps:'25 min très légers à {{P}}. Dernier footing avant la semaine de course.', retour:'',\n        note:'RPE 3/10 · Tu dois finir frais et dynamisé.' },",
    "{ jour:'Dimanche', type:'EF', titre:'Footing léger 35 minutes', duree:'35 min', pcts:[[60,65]],\n        echauff:'', corps:'35 min très légers à {{P}}. Dernier footing avant la semaine de course. Laisse les jambes rouler librement, le corps se recharge. Finis avec le sourire — le travail est fait.', retour:'',\n        note:'RPE 3/10 · Tu dois finir frais et dynamisé.' },"
  ],
])

// ── 6-i : S15 Lundi 35→50, Vendredi 35→40, Dimanche 25→35 ─────────────────
fix('semaines-6-i.js', [
  [
    "{ jour:'Lundi', type:'EF', titre:'Footing léger 35 minutes', duree:'35 min', pcts:[[65,65]],\n        echauff:'', corps:'35 min très faciles à {{P}}.', retour:'',\n        note:'RPE 3/10.' },\n      { jour:'Mercredi', type:'Tempo'",
    "{ jour:'Lundi', type:'EF', titre:'Footing léger 50 minutes', duree:'50 min', pcts:[[65,65]],\n        echauff:'', corps:'50 min à {{P}}, allure vraiment légère. Le footing le plus long de la semaine de consolidation — maintien de l\\'endurance de base sans fatiguer. Cours en nature, apprécie la légèreté des jambes. La semaine de course est imminente.', retour:'',\n        note:'RPE 3/10 · Tu dois finir comme si tu venais de te promener.' },\n      { jour:'Mercredi', type:'Tempo'"
  ],
  [
    "{ jour:'Vendredi', type:'EF', titre:'Footing léger 35 minutes', duree:'35 min', pcts:[[65,65]],\n        echauff:'', corps:'35 min à {{P}}. Inclus 4 à 6 accélérations de 60m à allure marathon.', retour:'',\n        note:'RPE 3/10.' },\n      { jour:'Dimanche', type:'EF', titre:'Footing léger 25 minutes'",
    "{ jour:'Vendredi', type:'EF', titre:'Footing léger 40 minutes', duree:'40 min', pcts:[[65,65]],\n        echauff:'', corps:'40 min à {{P}}, allure légère. Dans les 10 dernières minutes, place 4 à 6 accélérations de 60m à ton allure marathon pour garder les sensations neuromusculaires vives. Termine frais et dynamisé.', retour:'',\n        note:'RPE 3/10.' },\n      { jour:'Dimanche', type:'EF', titre:'Footing léger 35 minutes'"
  ],
  [
    "{ jour:'Dimanche', type:'EF', titre:'Footing léger 25 minutes', duree:'25 min', pcts:[[60,65]],\n        echauff:'', corps:'25 min très légers à {{P}}. Dernier footing avant la semaine de course.', retour:'',\n        note:'RPE 3/10 · Tu dois finir frais et dynamisé.' },",
    "{ jour:'Dimanche', type:'EF', titre:'Footing léger 35 minutes', duree:'35 min', pcts:[[60,65]],\n        echauff:'', corps:'35 min très légers à {{P}}. Dernier footing avant la semaine de course. Laisse les jambes rouler librement, le corps se recharge. Finis avec le sourire — le travail est fait.', retour:'',\n        note:'RPE 3/10 · Tu dois finir frais et dynamisé.' },"
  ],
])

console.log('S15 fixes done!')
