const puppeteer = require('puppeteer')
const fs        = require('fs')
const path      = require('path')

const OUT  = path.join(__dirname, '../public/ebooks/10km-8sem.pdf')
const LOGO = path.join(__dirname, '../public/Logo.png')
fs.mkdirSync(path.dirname(OUT), { recursive: true })

const logoB64 = fs.existsSync(LOGO)
  ? `data:image/png;base64,${fs.readFileSync(LOGO).toString('base64')}`
  : ''

// ─── Couleurs par type ────────────────────────────────────────────────────────
const TC = {
  'EF':            { b:'#06B6D4', bg:'rgba(6,182,212,.1)',   hd:'rgba(6,182,212,.18)',   tx:'#67E8F9' },
  'Fractionné':    { b:'#F97316', bg:'rgba(249,115,22,.1)',  hd:'rgba(249,115,22,.18)',  tx:'#FDBA74' },
  'Tempo':         { b:'#A855F7', bg:'rgba(168,85,247,.1)',  hd:'rgba(168,85,247,.18)',  tx:'#D8B4FE' },
  'Côtes':         { b:'#EF4444', bg:'rgba(239,68,68,.1)',   hd:'rgba(239,68,68,.18)',   tx:'#FCA5A5' },
  'Sortie longue': { b:'#22C55E', bg:'rgba(34,197,94,.1)',   hd:'rgba(34,197,94,.18)',   tx:'#86EFAC' },
  'Activation':    { b:'#EAB308', bg:'rgba(234,179,8,.1)',   hd:'rgba(234,179,8,.18)',   tx:'#FDE047' },
  'Course':        { b:'#EC4899', bg:'rgba(236,72,153,.12)', hd:'rgba(236,72,153,.22)',  tx:'#F9A8D4' },
  'Spécifique':    { b:'#3B82F6', bg:'rgba(59,130,246,.1)',  hd:'rgba(59,130,246,.18)',  tx:'#93C5FD' },
}

// ─── Données ──────────────────────────────────────────────────────────────────
const SEMAINES = [
  { num:1, phase:'Adaptation', charge:'Modérée',
    objectif:'Installer les habitudes d\'entraînement et prendre ses marques sur les allures. Finir chaque séance en se sentant bien — pas se mettre dans le rouge.',
    conseil:'Sur les 10 × 400m, l\'objectif n\'est pas d\'aller le plus vite sur chaque répétition, mais de tenir la même allure sur les 10. Garde tes 90 secondes de récupération complètes.',
    seances:[
      { jour:'Mardi',    type:'EF',           titre:'Endurance Fondamentale',       duree:'45 min',
        echauff:'', corps:'Course continue à 65-70% VMA. Allure conversation — tu dois pouvoir parler en phrases complètes. Si tu as du mal à parler, tu vas trop vite. Régulier et relâché du début à la fin.', retour:'',
        note:'RPE 4-5/10 · Finis en te sentant bien, comme si tu pouvais encore courir.' },
      { jour:'Jeudi',    type:'Fractionné',    titre:'10 × 400 mètres',             duree:'55 min',
        echauff:'15 min de footing EF à 65% VMA.', corps:'10 × 400m à 95-100% VMA. Effort presque maximal sur chaque répétition. Récupération 90 secondes au trot. Maintiens la même allure du premier au dernier.', retour:'10 min de jogging léger à 65% VMA.',
        note:'RPE 8-9/10 · Si les dernières sont plus lentes, récupère un peu plus la prochaine fois.' },
      { jour:'Samedi',   type:'EF',           titre:'Footing de récupération',      duree:'45 min',
        echauff:'', corps:'45 min à 65% VMA. Active la circulation sanguine et prépare la sortie longue du lendemain. Si tu as des courbatures, ce footing léger les élimine progressivement.', retour:'',
        note:'RPE 3/10 · Vraiment facile, aucun effort.' },
      { jour:'Dimanche', type:'Sortie longue', titre:'Sortie longue',               duree:'75 min',
        echauff:'', corps:'Course continue à 70-75% VMA pendant 75 minutes. Allure régulière du début à la fin. Hydrate-toi. Concentre-toi sur ta respiration et ta foulée.', retour:'',
        note:'RPE 5-6/10 · Tu dois pouvoir parler par courtes phrases. Si tu fatigues, ralentis.' },
    ]},
  { num:2, phase:'Adaptation', charge:'Modérée — légère progression',
    objectif:'Confirmer les bases. Le plan doit commencer à sembler naturel et gérable. Le corps assimile les nouvelles charges d\'entraînement.',
    conseil:'Sur les 12 × 400m, l\'objectif n\'est pas d\'aller le plus vite — c\'est de tenir la même allure sur les 12. Si les dernières sont nettement plus lentes, tu es parti trop vite.',
    seances:[
      { jour:'Mardi',    type:'EF',           titre:'Endurance Fondamentale',       duree:'45 min',
        echauff:'', corps:'45 min à 65-70% VMA. Même principe que la semaine passée. Allure conversation, régulière du début à la fin.', retour:'',
        note:'RPE 4-5/10 · Léger et régulier.' },
      { jour:'Jeudi',    type:'Fractionné',    titre:'12 × 400 mètres',             duree:'60 min',
        echauff:'15 min de footing EF à 65% VMA.', corps:'12 × 400m à 95-100% VMA. Deux répétitions de plus. Récupération 90 secondes au trot. Maintiens la même allure sur les 12 répétitions.', retour:'10 min de footing léger.',
        note:'RPE 8-9/10 · La récupération courte est volontaire pour développer ta résistance.' },
      { jour:'Samedi',   type:'EF',           titre:'Footing de récupération',      duree:'45 min',
        echauff:'', corps:'45 min à 65% VMA. Active la circulation et prépare la sortie longue du lendemain. Cours sans te forcer, très détendu.', retour:'',
        note:'RPE 3/10 · Vraiment facile.' },
      { jour:'Dimanche', type:'Sortie longue', titre:'Sortie longue',               duree:'80 min',
        echauff:'', corps:'80 min à 70-75% VMA. 5 minutes de plus que la semaine dernière. Régularité du début à la fin — ne t\'emballe pas sur la fin même si tu te sens bien.', retour:'',
        note:'RPE 5-6/10 · La sortie longue est la pierre angulaire de ta préparation.' },
    ]},
  { num:3, phase:'Développement', charge:'Élevée — première séance tempo',
    objectif:'L\'inconfort arrive — c\'est le signe que tu travailles dans la bonne zone. Montée en intensité avec la première séance au seuil anaérobie.',
    conseil:'Sur le tempo, l\'allure doit être inconfortable mais tenable. Tu peux prononcer des mots isolés mais pas des phrases. Si tu t\'arrêtes avant la fin, tu es parti trop vite.',
    seances:[
      { jour:'Mardi',    type:'EF',           titre:'Footing long EF',              duree:'50 min',
        echauff:'', corps:'50 min à 70% VMA. Long et facile avant la semaine chargée. Travaille ta technique : légère bascule vers l\'avant, attaque milieu du pied, bras détendus.', retour:'',
        note:'RPE 5/10 · Si tu te sens fatigué, passe à 65% VMA — la durée prime sur l\'intensité.' },
      { jour:'Mercredi', type:'Tempo',         titre:'Tempo continu — 20 minutes',  duree:'50 min',
        echauff:'15 min de footing progressif à 65-70% VMA.', corps:'20 minutes continues à 85% VMA. Première séance au seuil. Difficile mais tenable. Tu dois prononcer des mots mais pas tenir une conversation.', retour:'15 min de jogging très lent à 65% VMA.',
        note:'RPE 7-8/10 · C\'est normal si tu souffres sur les dernières minutes — cette zone te fait progresser.' },
      { jour:'Vendredi', type:'Fractionné',    titre:'5 × 1000 mètres',             duree:'60 min',
        echauff:'15 min de footing EF à 65% VMA.', corps:'5 × 1000m à 85-88% VMA. Intervalles plus longs que les 400m — développent ta résistance à l\'allure seuil. Récupération 2 min au trot.', retour:'10 min de footing léger.',
        note:'RPE 7-8/10 · La progression 400m → 1000m est intentionnelle. Ton corps est prêt.' },
      { jour:'Dimanche', type:'Sortie longue', titre:'Sortie longue + accélération finale', duree:'85 min',
        echauff:'', corps:'70 min à 70-75% VMA, puis accélération progressive sur les 15 dernières minutes à 80-82% VMA. Tu apprends à finir fort — compétence clé sur les 2 derniers km de course.', retour:'',
        note:'RPE 6/10 puis 7-8/10 · Mémorise cette sensation — tu la réutiliseras en course.' },
    ]},
  { num:4, phase:'Développement', charge:'Élevée — consolidation du seuil',
    objectif:'Consolider le travail de seuil et augmenter le volume. La fatigue s\'installe — mange correctement et dors 8 heures par nuit.',
    conseil:'Si tu ressens une fatigue importante en milieu de semaine, remplace la séance du vendredi par un footing EF de 45 min. Un athlète reposé progresse davantage qu\'un athlète épuisé.',
    seances:[
      { jour:'Mardi',    type:'EF',           titre:'Footing long EF',              duree:'55 min',
        echauff:'', corps:'55 min à 70% VMA. Long, régulier, facile. Volume avant la semaine la plus chargée jusqu\'ici.', retour:'',
        note:'RPE 5/10 · Si tu te sens fatigué, passe à 65% VMA.' },
      { jour:'Mercredi', type:'Tempo',         titre:'2 × 15 minutes au seuil',     duree:'55 min',
        echauff:'15 min de footing progressif EF.', corps:'2 × 15 min à 85% VMA avec 3 min de récupération. Plus difficile que le tempo continu car la deuxième répétition arrive quand tu es déjà fatigué.', retour:'10 min de footing léger.',
        note:'RPE 7-8/10 · Si la deuxième répétition est plus difficile, c\'est qu\'elle est supposée l\'être.' },
      { jour:'Vendredi', type:'Fractionné',    titre:'6 × 1000 mètres',             duree:'65 min',
        echauff:'15 min de footing EF.', corps:'6 × 1000m à 87-90% VMA. Une répétition de plus, allure légèrement plus haute. Récupération 2 min au trot. Ne t\'emballe pas sur les premières.', retour:'10 min de footing léger.',
        note:'RPE 8/10 · C\'est normal si les dernières sont dures — tu construis ta résistance aérobie.' },
      { jour:'Dimanche', type:'Sortie longue', titre:'Sortie longue',               duree:'90 min',
        echauff:'', corps:'90 min à 72-75% VMA. Ta sortie longue la plus importante jusqu\'ici. Régularité et respiration. Hydrate-toi toutes les 20-25 min.', retour:'',
        note:'RPE 6/10 · Si tu arrives épuisé, tu es allé trop vite. Fatigué mais pas à plat.' },
    ]},
  { num:5, phase:'Intensification', charge:'Élevée — bloc VMA',
    objectif:'Les séances les plus intenses du plan. Ce sont elles qui font progresser le plus sur 10km. Donne tout sur les répétitions, récupère bien entre les séances.',
    conseil:'Les côtes sont la séance la plus efficace du plan. Concentre-toi sur l\'impulsion au sol et la montée des genoux — pas sur le chrono. La descente au trot est ta récupération active.',
    seances:[
      { jour:'Mardi',    type:'Côtes',         titre:'10 × côtes — 150 mètres',    duree:'55 min',
        echauff:'20 min de footing progressif à 65-70% VMA.', corps:'10 montées de 150m à effort maximal. Genoux hauts, bras actifs, pousse à fond jusqu\'en haut. Descente au trot complète entre chaque montée.', retour:'15 min de footing très léger.',
        note:'RPE 9/10 sur les montées · Les côtes renforcent tes muscles propulseurs.' },
      { jour:'Vendredi', type:'Fractionné',    titre:'16 × 300 mètres',             duree:'60 min',
        echauff:'15 min de footing EF.', corps:'16 × 300m à 100-105% VMA. Intensité très élevée. Récupération 60 sec entre chaque. Maintiens la même vitesse sur les 16 répétitions.', retour:'10 min de footing léger.',
        note:'RPE 9/10 · 60 sec de récupération — calculé pour forcer l\'adaptation aux efforts répétés.' },
      { jour:'Samedi',   type:'EF',           titre:'Footing de récupération',      duree:'45 min',
        echauff:'', corps:'45 min à 65% VMA. Fondamentale après une grosse semaine — active la circulation pour accélérer la récupération musculaire avant la sortie longue du lendemain.', retour:'',
        note:'RPE 3/10 · Cette séance te fait récupérer plus vite, elle ne te fatigue pas.' },
      { jour:'Dimanche', type:'Sortie longue', titre:'Sortie longue avec encart allure', duree:'90 min',
        echauff:'', corps:'60 min à 70-75% VMA, puis 5 km à ton allure cible 10km, puis retour à l\'allure EF. Cet encart t\'apprend à tenir l\'allure quand les jambes sont déjà sollicitées.', retour:'',
        note:'RPE 6/10 en EF · 7-8/10 sur les 5 km · Note ton allure — indicateur fiable de ta forme.' },
    ]},
  { num:6, phase:'Intensification', charge:'Maximale — dernier bloc chargé',
    objectif:'Dernière semaine de charge maximale avant l\'affûtage. Tu atteins le pic de ta préparation. Ce que tu construis ici sera transformé en performance lors de l\'affûtage.',
    conseil:'C\'est ta semaine de charge maximale. N\'ajoute rien. Mange des glucides les soirs avant les séances clés — pâtes, riz, pain. Dors 8 heures. Hydrate-toi toute la journée.',
    seances:[
      { jour:'Mardi',    type:'Tempo',         titre:'3 × 10 minutes au seuil',     duree:'60 min',
        echauff:'15 min de footing progressif EF.', corps:'3 × 10 min à 87-90% VMA avec 3 min de récupération entre chaque. La troisième répétition est la plus difficile. Maintiens l\'allure, résiste à l\'envie de ralentir.', retour:'10 min de footing léger.',
        note:'RPE 8-9/10 · 30 min totales au seuil — ton record sur ce plan.' },
      { jour:'Jeudi',    type:'Spécifique',    titre:'4 × 2 km à allure objectif',  duree:'60 min',
        echauff:'15 min de footing EF.', corps:'4 × 2 km exactement à ton allure cible 10km. Récupération 90 sec au trot. La séance la plus course-spécifique du plan — tu répètes ce que tu vas faire le jour J.', retour:'10 min de footing léger.',
        note:'RPE 8/10 · Si l\'allure cible est trop facile, ton objectif est peut-être trop prudent.' },
      { jour:'Samedi',   type:'EF',           titre:'Footing de récupération',      duree:'45 min',
        echauff:'', corps:'45 min à 65% VMA. Indispensable pour absorber la charge des deux séances clés. Ton corps s\'adapte à un niveau supérieur — ce footing accélère ce processus.', retour:'',
        note:'RPE 3/10 · Le footing de récupération est aussi important que les séances intenses.' },
      { jour:'Dimanche', type:'Sortie longue', titre:'Dernière sortie longue',      duree:'85 min',
        echauff:'', corps:'85 min à 70-75% VMA. Ta dernière vraie sortie longue avant la course. Mémorise cette sensation — l\'affûtage va encore l\'améliorer.', retour:'',
        note:'RPE 6/10 · Après cette séance, l\'entraînement dur est terminé.' },
    ]},
  { num:7, phase:'Affûtage', charge:'Volume réduit — intensité maintenue',
    objectif:'L\'affûtage ne fait pas perdre de forme — il la concentre. Tu gardes une séance d\'intensité pour maintenir les sensations. Tes muscles récupèrent, tes réserves se remplissent.',
    conseil:'L\'affûtage est souvent source d\'angoisse. Des études montrent qu\'un athlète est au maximum de ses capacités 8 à 14 jours après la dernière grosse charge. Ce plan est calculé pour ça.',
    seances:[
      { jour:'Mardi',    type:'EF',           titre:'Footing léger',                duree:'45 min',
        echauff:'', corps:'45 min très faciles à 65% VMA. Garder les jambes en mouvement sans les fatiguer. Cours au ressenti, sans montre. Profite de la légèreté des jambes de l\'affûtage.', retour:'',
        note:'RPE 3/10 · Tu dois finir comme si tu venais de te promener.' },
      { jour:'Jeudi',    type:'Fractionné',    titre:'6 × 400 mètres — volume réduit', duree:'40 min',
        echauff:'10 min de footing progressif EF.', corps:'6 × 400m à 95-100% VMA. Volume réduit de 40% mais intensité maintenue. Récupération 2 min entre chaque. Objectif : rappeler à ton corps les sensations de course rapide.', retour:'10 min de footing léger.',
        note:'RPE 8/10 · Ces 6 répétitions maintiennent tes sensations sans te fatiguer.' },
      { jour:'Samedi',   type:'Activation',   titre:'Trot léger d\'activation',     duree:'25 min',
        echauff:'', corps:'25 min de trot à 60-65% VMA. Juste assez pour que les jambes se souviennent de courir avant la course dans une semaine. Pas d\'effort, juste du mouvement léger.', retour:'',
        note:'RPE 2-3/10 · Tout pour la course. Ne dépasse jamais cette sensation.' },
    ]},
  { num:8, phase:'Semaine de course', charge:'Conserve — tu es prêt',
    objectif:'Rien ne se gagne à l\'entraînement cette semaine. L\'objectif unique : arriver au départ reposé, confiant, les jambes fraîches.',
    conseil:'Fais confiance à tes 7 semaines de travail. Pars légèrement en dessous de ton allure cible les 2 premiers km. Tu rattraperas les impatients au km 7.',
    seances:[
      { jour:'Lundi',    type:'EF',           titre:'Footing très léger',           duree:'35 min',
        echauff:'', corps:'35 min à 60-65% VMA. Maintenir la circulation sanguine. Vraiment facile — si tu te sens fatigué, réduis à 25 minutes. Aucune pression.', retour:'',
        note:'RPE 3/10 · Aucun effort. Juste des jambes qui bougent.' },
      { jour:'Mardi',    type:'EF',           titre:'Footing très léger',           duree:'35 min',
        echauff:'', corps:'35 min à 60-65% VMA. Même principe que la veille. Profite pour visualiser ta course et te concentrer mentalement.', retour:'',
        note:'RPE 3/10 · Profite de cette légèreté — tes jambes sont prêtes.' },
      { jour:'Samedi',   type:'Activation',   titre:'Activation J-1 + accélérations', duree:'30 min',
        echauff:'', corps:'20 min de trot à 60-65% VMA. Puis 6 à 8 accélérations progressives de 80m : démarre doucement et accélère jusqu\'à 90% de ta vitesse max sur les 20 derniers mètres. Récupère 60 sec en marchant entre chaque.', retour:'',
        note:'Ces accélérations réveillent tes fibres rapides. Efficace la veille d\'une course.' },
      { jour:'Dimanche', type:'Course',       titre:'COURSE — 10 KILOMÈTRES',      duree:'Jour J',
        echauff:'10 min de jogging léger avant le départ si le protocole le permet.', corps:'KM 1-2 : pars 5 à 8 sec/km en dessous de ton allure cible. KM 3-8 : allure cible exacte, régularité absolue. KM 9 : accélère si tu as des réserves. KM 10 : donne absolument tout.', retour:'10-15 min de marche. Banane et eau dans les 30 min.',
        note:'Les sensations difficiles aux km 6-7 sont normales et passagères. C\'est là que se gagne un 10km.' },
    ]},
]

// ─── SVG décoratifs ──────────────────────────────────────────────────────────
const SVG_HEARTBEAT = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 28" width="100%" height="28" style="display:block">
  <defs>
    <linearGradient id="hb-g" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#8B2FC9" stop-opacity="0"/>
      <stop offset="15%" stop-color="#8B2FC9"/>
      <stop offset="85%" stop-color="#E8237A"/>
      <stop offset="100%" stop-color="#E8237A" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <polyline fill="none" stroke="url(#hb-g)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
    points="0,14 45,14 60,14 70,3 80,25 88,10 96,20 104,14 175,14 190,14 203,3 216,25 224,14 295,14 310,14 323,3 336,25 344,14 415,14 500,14"/>
</svg>`

const SVG_TRACK = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 90" width="180" height="90" style="display:block;margin:0 auto">
  <defs>
    <linearGradient id="tk-g" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#8B2FC9" stop-opacity="0.4"/>
      <stop offset="50%" stop-color="#E8237A" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#8B2FC9" stop-opacity="0.4"/>
    </linearGradient>
    <linearGradient id="tk-g2" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#8B2FC9" stop-opacity="0.2"/>
      <stop offset="50%" stop-color="#E8237A" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#8B2FC9" stop-opacity="0.2"/>
    </linearGradient>
  </defs>
  <ellipse cx="90" cy="45" rx="82" ry="36" fill="none" stroke="url(#tk-g)" stroke-width="2"/>
  <ellipse cx="90" cy="45" rx="56" ry="22" fill="none" stroke="url(#tk-g2)" stroke-width="1.5" stroke-dasharray="3,5"/>
  <circle cx="172" cy="45" r="5" fill="url(#tk-g)"/>
  <circle cx="8" cy="45" r="3" fill="rgba(139,47,201,.5)"/>
</svg>`

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
@page { size: A4; margin: 0; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: 'Poppins', sans-serif;
  background: #0C0A18;
  color: #fff;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* PAGE DE BASE */
.page {
  width: 210mm;
  height: 297mm;
  overflow: hidden;
  padding: 12mm 13mm 19mm;
  background: #0C0A18;
  page-break-after: always;
  break-after: page;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* BLOBS */
.blob-tr, .blob-bl, .blob-tl, .blob-br {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}
.blob-tr { top:-80px; right:-70px; width:300px; height:300px; background:radial-gradient(ellipse,rgba(139,47,201,.26) 0%,transparent 65%); }
.blob-bl { bottom:-70px; left:-60px; width:260px; height:260px; background:radial-gradient(ellipse,rgba(232,35,122,.2) 0%,transparent 65%); }
.blob-tl { top:-60px; left:-60px; width:250px; height:250px; background:radial-gradient(ellipse,rgba(168,85,247,.2) 0%,transparent 65%); }
.blob-br { bottom:-60px; right:-50px; width:230px; height:230px; background:radial-gradient(ellipse,rgba(236,72,153,.18) 0%,transparent 65%); }

.page > *:not([class^="blob"]) { position: relative; z-index: 1; }

/* NUMÉRO PAGE — fixe bas droite */
.pnum {
  position: absolute;
  bottom: 11mm;
  right: 13mm;
  font-size: 13pt;
  font-weight: 800;
  background: linear-gradient(135deg,#8B2FC9,#E8237A);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  z-index: 10;
}

/* GRADIENT */
.grad {
  background: linear-gradient(135deg,#8B2FC9,#E8237A);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* TITRE DE PAGE centré */
.page-title {
  font-size: 27pt; font-weight: 800; line-height: 1;
  text-align: center; flex-shrink: 0;
  background: linear-gradient(135deg,#8B2FC9,#E8237A);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.page-intro {
  font-size: 9.5pt; color: rgba(255,255,255,.7); line-height: 1.6;
  text-align: center; flex-shrink: 0;
}
.section-label {
  font-size: 7pt; font-weight: 700; text-transform: uppercase;
  letter-spacing: .1em; color: rgba(255,255,255,.38); margin-bottom: 6px;
}

/* ══ COUVERTURE ══ */
.cover-page {
  width: 210mm; height: 297mm; overflow: hidden;
  background: #0C0A18;
  page-break-after: always; break-after: page;
  position: relative;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  text-align: center;
}
.cover-wm {
  position: absolute;
  font-size: 260pt; font-weight: 800; line-height: 1;
  letter-spacing: -.05em;
  background: linear-gradient(135deg,#8B2FC9,#E8237A);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  opacity: .04; pointer-events: none; user-select: none;
  top: 50%; left: 50%; transform: translate(-50%,-50%);
}
.cover-inner {
  display: flex; flex-direction: column;
  align-items: center; gap: 0;
  position: relative; z-index: 1;
  padding: 0 14mm;
}
.cover-logo { width: 96px; opacity: .95; margin-bottom: 18px; }
.cover-sep { width: 56px; height: 2px; background: linear-gradient(90deg,#8B2FC9,#E8237A); border-radius: 1px; margin: 18px auto; }
.cover-eyebrow { font-size: 8pt; font-weight: 700; letter-spacing: .22em; text-transform: uppercase; color: rgba(255,255,255,.38); margin-bottom: 8px; }
.cover-title {
  font-size: 80pt; font-weight: 800; line-height: .9; letter-spacing: -.03em;
  background: linear-gradient(135deg,#8B2FC9,#E8237A);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.cover-subtitle { font-size: 15pt; font-weight: 600; color: rgba(255,255,255,.75); letter-spacing: .05em; margin-top: 10px; }
.cover-academy { font-size: 8pt; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; color: rgba(255,255,255,.28); margin-top: 32px; }

/* ══ SOMMAIRE ══ */
.som-svg-wrap { text-align: center; flex-shrink: 0; }
.som-section { flex-shrink: 0; }
.som-section-lbl {
  font-size: 7pt; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
  color: rgba(255,255,255,.35); padding-bottom: 5px;
  border-bottom: 1px solid rgba(255,255,255,.08); margin-bottom: 4px;
}
.som-item {
  display: flex; align-items: baseline;
  padding: 5.5px 0;
  border-bottom: 1px solid rgba(255,255,255,.05);
}
.som-item:last-child { border-bottom: none; }
.som-num { font-size: 8pt; font-weight: 800; color: rgba(139,47,201,.8); width: 24px; flex-shrink: 0; }
.som-label { font-size: 10.5pt; font-weight: 500; color: rgba(255,255,255,.88); flex-shrink: 0; }
.som-dots { flex: 1; border-bottom: 1px dotted rgba(255,255,255,.18); margin: 0 8px; align-self: flex-end; margin-bottom: 4px; }
.som-page {
  font-size: 10pt; font-weight: 800; flex-shrink: 0;
  background: linear-gradient(135deg,#8B2FC9,#E8237A);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}

/* ══ PAGE ALLURES ══ */
.zone-card {
  flex: 1; display: flex; align-items: center;
  padding: 0 14px;
  border-radius: 10px;
  gap: 16px;
}
.zone-pct {
  font-size: 22pt; font-weight: 800; flex-shrink: 0; width: 62px;
  line-height: 1;
}
.zone-info { flex: 1; }
.zone-name { font-size: 10.5pt; font-weight: 700; margin-bottom: 2px; }
.zone-desc { font-size: 9pt; color: rgba(255,255,255,.7); line-height: 1.45; }
.zone-pace {
  font-size: 18pt; font-weight: 800; flex-shrink: 0; text-align: right;
}
.zone-speed { font-size: 7.5pt; color: rgba(255,255,255,.45); text-align: right; margin-top: 1px; }

/* ══ PRINCIPES ══ */
.principes-wrap { flex: 1; display: flex; flex-direction: column; min-height: 0; }
.principe {
  flex: 1; display: flex; gap: 14px; align-items: center;
  padding: 0 12px;
  border-bottom: 1px solid rgba(255,255,255,.07);
}
.principe:last-child { border-bottom: none; }
.p-num { font-size: 15pt; font-weight: 800; flex-shrink: 0; width: 28px; line-height: 1; }
.p-t { font-size: 10.5pt; font-weight: 700; margin-bottom: 3px; }
.p-d { font-size: 9.5pt; color: rgba(255,255,255,.75); line-height: 1.5; }

/* ══ STRATÉGIE ══ */
.strats-wrap { flex: 1; display: flex; flex-direction: column; min-height: 0; }
.strat {
  flex: 1; display: flex; gap: 14px; align-items: center;
  padding: 0 0 0 0;
  border-bottom: 1px solid rgba(255,255,255,.07);
}
.strat:last-child { border-bottom: none; }
.strat-km { width: 54px; flex-shrink: 0; text-align: center; }
.strat-km-l { font-size: 11pt; font-weight: 800; line-height: 1.1; }
.strat-km-a { font-size: 7.5pt; color: rgba(255,255,255,.4); margin-top: 2px; }
.strat-c { flex: 1; padding-left: 12px; border-left: 2px solid rgba(139,47,201,.3); }
.strat-t { font-size: 10.5pt; font-weight: 700; margin-bottom: 3px; }
.strat-d { font-size: 9.5pt; color: rgba(255,255,255,.75); line-height: 1.5; }

/* ══ SEMAINES ══ */
.week-hero {
  flex-shrink: 0;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255,255,255,.08);
}
.week-num {
  font-size: 11pt; font-weight: 700; letter-spacing: .07em; text-transform: uppercase;
  margin-bottom: 2px;
  background: linear-gradient(90deg,#8B2FC9,#E8237A);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.week-phase { font-size: 24pt; font-weight: 800; line-height: 1; margin-bottom: 2px; }
.week-charge { font-size: 9pt; color: rgba(255,255,255,.45); }

.objectif {
  flex-shrink: 0;
  padding: 7px 0 7px 11px;
  border-left: 2px solid rgba(139,47,201,.55);
}
.obj-lbl { font-size: 6.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: rgba(139,47,201,.9); margin-bottom: 3px; }
.obj-txt { font-size: 9.5pt; color: rgba(255,255,255,.82); line-height: 1.5; }

.sessions-wrap {
  flex: 1; min-height: 0;
  display: flex; flex-direction: column;
  gap: 6px; overflow: hidden;
}

/* SESSION CARD */
.session {
  flex: 1; min-height: 0;
  display: flex; flex-direction: column;
  border-radius: 12px; overflow: hidden;
  border: 1px solid rgba(255,255,255,.07);
}
.s-head {
  flex-shrink: 0; height: 40px;
  display: flex; align-items: center; gap: 10px;
  padding: 0 13px;
  border-bottom: 1px solid rgba(255,255,255,.07);
}
.s-jour {
  font-size: 8.5pt; font-weight: 700; text-transform: uppercase;
  letter-spacing: .05em; color: rgba(255,255,255,.45);
  flex-shrink: 0; width: 66px;
}
.s-badge {
  font-size: 6.5pt; font-weight: 800; letter-spacing: .05em; text-transform: uppercase;
  border-radius: 10px; padding: 2px 8px; flex-shrink: 0; white-space: nowrap;
}
.s-titre {
  font-size: 10pt; font-weight: 700; flex: 1;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.s-duree { font-size: 9.5pt; font-weight: 800; flex-shrink: 0; white-space: nowrap; }

/* CORPS centré verticalement et horizontalement */
.s-body {
  flex: 1; min-height: 0; overflow: hidden;
  display: flex; flex-direction: column;
  justify-content: center; align-items: center;
  text-align: center;
  padding: 8px 14px; gap: 5px;
}
.s-meta {
  flex-shrink: 0; font-size: 8pt;
  color: rgba(255,255,255,.4);
  display: flex; gap: 10px; justify-content: center;
}
.s-corps {
  font-size: 10pt; line-height: 1.55;
  color: rgba(255,255,255,.9);
  text-align: center;
}
.s-note {
  flex-shrink: 0; padding: 5px 13px;
  border-top: 1px solid rgba(255,255,255,.06);
  font-size: 7.5pt; font-style: italic;
  color: rgba(255,255,255,.42);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  text-align: center;
}

.conseil {
  flex-shrink: 0; padding: 7px 0 7px 11px;
  border-left: 2px solid rgba(232,35,122,.5);
}
.conseil-lbl { font-size: 6.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: rgba(232,35,122,.9); margin-bottom: 3px; }
.conseil-txt { font-size: 9.5pt; color: rgba(255,255,255,.8); line-height: 1.5; }

/* TABLE */
.tbl { width: 100%; border-collapse: collapse; }
.tbl thead tr { background: linear-gradient(90deg,#8B2FC9,#E8237A); }
.tbl thead th { color: white; font-weight: 700; padding: 8px 11px; text-align: left; font-size: 8pt; }
.tbl tbody tr:nth-child(odd)  { background: rgba(255,255,255,.04); }
.tbl tbody tr:nth-child(even) { background: rgba(255,255,255,.02); }
.tbl tbody td { padding: 7px 11px; border-bottom: 1px solid rgba(255,255,255,.06); color: rgba(255,255,255,.85); line-height: 1.45; vertical-align: top; font-size: 9pt; }
.tbl td:first-child { font-weight: 700; color: #C084FC; white-space: nowrap; }
`

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getDur(text, fallback) {
  const m = text && text.match(/^(\d+)\s*min/)
  return m ? m[1] + ' min' : fallback
}

function blobs(v = 'A') {
  return v === 'A'
    ? '<div class="blob-tr"></div><div class="blob-bl"></div>'
    : '<div class="blob-tl"></div><div class="blob-br"></div>'
}

function sessionCard(s) {
  const c = TC[s.type] || TC['EF']
  const headSt = `background:linear-gradient(90deg,${c.hd},rgba(255,255,255,.04));`
  const badgeSt = `background:${c.bg};color:${c.tx};border:1px solid ${c.b}55;`
  const cardSt  = `border-left:3px solid ${c.b};background:${c.bg};`
  const durSt   = `color:${c.tx};`

  let meta = ''
  if (s.echauff || s.retour) {
    const parts = []
    if (s.echauff) parts.push(`<span style="color:${c.tx}">Éch. ${getDur(s.echauff,'15 min')}</span>`)
    if (s.echauff && s.retour) parts.push('<span style="color:rgba(255,255,255,.2)">·</span>')
    if (s.retour)  parts.push(`<span style="color:${c.tx}">Retour ${getDur(s.retour,'10 min')}</span>`)
    meta = `<div class="s-meta">${parts.join('')}</div>`
  }

  return `
  <div class="session" style="${cardSt}">
    <div class="s-head" style="${headSt}">
      <span class="s-jour">${s.jour}</span>
      <span class="s-badge" style="${badgeSt}">${s.type}</span>
      <span class="s-titre">${s.titre}</span>
      <span class="s-duree" style="${durSt}">${s.duree}</span>
    </div>
    <div class="s-body">
      ${meta}
      <div class="s-corps">${s.corps}</div>
    </div>
    <div class="s-note">${s.note}</div>
  </div>`
}

function weekPage(sem) {
  return `
  <div class="page">
    ${blobs(sem.num % 2 === 0 ? 'B' : 'A')}
    <div class="week-hero">
      <div class="week-num">Semaine ${sem.num} sur 8</div>
      <div class="week-phase grad">${sem.phase.toUpperCase()}</div>
      <div class="week-charge">${sem.charge}</div>
    </div>
    <div class="objectif">
      <div class="obj-lbl">Objectif</div>
      <div class="obj-txt">${sem.objectif}</div>
    </div>
    <div class="sessions-wrap">
      ${sem.seances.map(s => sessionCard(s)).join('')}
    </div>
    <div class="conseil">
      <div class="conseil-lbl">Conseil de la semaine</div>
      <div class="conseil-txt">${sem.conseil}</div>
    </div>
    <div class="pnum">${sem.num + 4}</div>
  </div>`
}

// ─── Zones allures ────────────────────────────────────────────────────────────
const ZONES = [
  { pct:'65%', name:'Endurance Fondamentale', pace:"6'36\"", speed:'9,1 km/h', desc:'Allure conversation · footing EF · 80% du volume total', c:'#06B6D4' },
  { pct:'75%', name:'Endurance Active',        pace:"5'43\"", speed:'10,5 km/h', desc:'Confortable mais soutenu · phrases courtes', c:'#10B981' },
  { pct:'85%', name:'Seuil Anaérobie',         pace:"5'02\"", speed:'11,9 km/h', desc:'Difficile mais tenable 20-40 min · Tempo', c:'#F59E0B' },
  { pct:'95%', name:'VMA — 95%',               pace:"4'30\"", speed:'13,3 km/h', desc:'Très difficile · répétitions courtes · fractionnés', c:'#F97316' },
  { pct:'100%',name:'VMA Max',                 pace:"4'17\"", speed:'14,0 km/h', desc:'Effort maximal · côtes et 300 mètres', c:'#EF4444' },
]

// ─── HTML ─────────────────────────────────────────────────────────────────────
const HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>${CSS}</style>
</head>
<body>

<!-- PAGE 1 : COUVERTURE -->
<div class="cover-page">
  <div class="cover-wm">10</div>
  <div class="cover-inner">
    ${logoB64 ? `<img src="${logoB64}" class="cover-logo"/>` : ''}
    <div class="cover-sep"></div>
    <div class="cover-eyebrow">Plan d'entraînement</div>
    <div class="cover-title">10 KM</div>
    <div class="cover-subtitle">8 semaines de préparation</div>
    <div class="cover-academy">The Ultimate Academy</div>
  </div>
</div>

<!-- PAGE 2 : SOMMAIRE -->
<div class="page">
  ${blobs('A')}
  <div class="page-title">Sommaire</div>
  <div class="som-svg-wrap">${SVG_TRACK}</div>
  <div class="som-section">
    <div class="som-section-lbl">Introduction</div>
    ${[
      ['01','Tes allures personnalisées','3'],
      ['02','Les principes du plan','4'],
    ].map(([n,l,p])=>`
    <div class="som-item">
      <span class="som-num">${n}</span>
      <span class="som-label">${l}</span>
      <span class="som-dots"></span>
      <span class="som-page">p.${p}</span>
    </div>`).join('')}
  </div>
  <div class="som-section">
    <div class="som-section-lbl">Programme semaine par semaine</div>
    ${[
      ['03','Semaine 1 · Adaptation','5'],
      ['04','Semaine 2 · Adaptation','6'],
      ['05','Semaine 3 · Développement','7'],
      ['06','Semaine 4 · Développement','8'],
      ['07','Semaine 5 · Intensification','9'],
      ['08','Semaine 6 · Intensification','10'],
      ['09','Semaine 7 · Affûtage','11'],
      ['10','Semaine 8 · Semaine de course','12'],
    ].map(([n,l,p])=>`
    <div class="som-item">
      <span class="som-num">${n}</span>
      <span class="som-label">${l}</span>
      <span class="som-dots"></span>
      <span class="som-page">p.${p}</span>
    </div>`).join('')}
  </div>
  <div class="som-section">
    <div class="som-section-lbl">Course &amp; après</div>
    ${[
      ['11','Stratégie de course','13'],
      ['12','Nutrition avant et après','14'],
      ['13','Coaching personnalisé','15'],
    ].map(([n,l,p])=>`
    <div class="som-item">
      <span class="som-num">${n}</span>
      <span class="som-label">${l}</span>
      <span class="som-dots"></span>
      <span class="som-page">p.${p}</span>
    </div>`).join('')}
  </div>
  <div class="pnum">2</div>
</div>

<!-- PAGE 3 : ALLURES -->
<div class="page">
  ${blobs('B')}
  <div class="page-title">Tes allures personnalisées</div>
  <p class="page-intro">
    Toutes les séances utilisent des % de VMA (Vitesse Maximale Aérobie).
    Va sur <strong style="color:#C084FC">theultimateacademy.fr/calculateur/vma</strong>
    pour obtenir tes allures exactes. Sans VMA connue : cours 12 min, mesure la distance —
    VMA (km/h) = distance (m) ÷ 200.
  </p>
  <div style="flex-shrink:0">${SVG_HEARTBEAT}</div>
  <div style="flex:1;display:flex;flex-direction:column;min-height:0;gap:5px">
    ${ZONES.map(z => `
    <div class="zone-card" style="border-left:3px solid ${z.c};background:rgba(${
      z.c==='#06B6D4'?'6,182,212':z.c==='#10B981'?'16,185,129':z.c==='#F59E0B'?'245,158,11':z.c==='#F97316'?'249,115,22':'239,68,68'
    },.08);">
      <div class="zone-pct" style="color:${z.c}">${z.pct}</div>
      <div class="zone-info">
        <div class="zone-name">${z.name}</div>
        <div class="zone-desc">${z.desc}</div>
      </div>
      <div>
        <div class="zone-pace" style="color:${z.c}">${z.pace}</div>
        <div class="zone-speed">${z.speed}</div>
      </div>
    </div>`).join('')}
  </div>
  <div class="pnum">3</div>
</div>

<!-- PAGE 4 : PRINCIPES -->
<div class="page">
  ${blobs('A')}
  <div class="page-title">Les principes du plan</div>
  <p class="page-intro">Les règles qui font la différence entre progresser et stagner sur 8 semaines.</p>
  <div class="principes-wrap">
    ${[
      ['01','La règle 80/20','80% du volume en Endurance Fondamentale, 20% à haute intensité. C\'est la répartition des coureurs d\'élite mondiaux. Elle permet de progresser vite sans surentraînement. Les footings EF ne sont pas du remplissage — ils construisent le moteur aérobie.'],
      ['02','L\'échauffement — 15 min, toujours','15 minutes de footing EF avant chaque séance intense, sans exception. L\'échauffement prépare les muscles, les tendons et le cœur. Si tu manques de temps, raccourcis la séance principale — jamais l\'échauffement.'],
      ['03','Le retour au calme — 10 min, toujours','10 minutes de jogging léger après chaque séance intense. Accélère l\'élimination des déchets métaboliques et prépare le corps pour la séance suivante. Sur 8 semaines, l\'effet cumulé est significatif.'],
      ['04','La progressivité — la règle des 10%','Le volume augmente de 10% maximum par semaine. Augmenter trop vite est la première cause de blessure — périostite, tendinite, syndrome rotulien. Respecte le plan même si tu te sens bien.'],
      ['05','Le renforcement musculaire','1 séance de 20 min par semaine en complément : gainage, fentes, squats, montées de mollets. Protège les genoux, les hanches et les chevilles — les zones les plus exposées du coureur.'],
    ].map(([n,t,d])=>`
    <div class="principe">
      <div class="p-num grad">${n}</div>
      <div>
        <div class="p-t">${t}</div>
        <div class="p-d">${d}</div>
      </div>
    </div>`).join('')}
  </div>
  <div class="pnum">4</div>
</div>

<!-- SEMAINES 1-8 -->
${SEMAINES.map(s => weekPage(s)).join('')}

<!-- PAGE 13 : STRATÉGIE -->
<div class="page">
  ${blobs('A')}
  <div class="page-title">Stratégie de course</div>
  <p class="page-intro">La majorité des coureurs ratent leur 10km sur les 2 premiers kilomètres en partant trop vite. Cette stratégie en 4 phases fonctionne à tous les niveaux.</p>
  <div class="strats-wrap">
    ${[
      ['KM 1-2','-5 à 8 sec/km','Patience et retenue','Pars légèrement sous ton allure cible. L\'adrénaline du départ va te pousser à partir vite — résiste. Ces 2 km trop rapides peuvent te coûter 30 à 60 secondes sur les 3 derniers.'],
      ['KM 3-8','Allure cible','Régularité absolue','Utilise ta montre GPS. Chaque kilomètre identique. Ne te laisse pas emporter par un bon split ni démoraliser par un mauvais. Un 10km régulier est toujours plus rapide qu\'un 10km en yoyo.'],
      ['KM 9','Si réserves','Évaluation et décision','Fais un bilan honnête. Si tu as des réserves, accélère progressivement. Si tu souffres, maintiens l\'allure — ne t\'engage pas dans une accélération que tu ne pourras pas tenir jusqu\'à la ligne.'],
      ['KM 10','Tout ce qui reste','Donner absolument tout','Donne tout. La douleur est temporaire, le chrono est permanent. Visualise la ligne d\'arrivée depuis le km 9,5. Raccourcis ta foulée, augmente ta cadence. Tout ce que tu as conservé — c\'est maintenant.'],
    ].map(([km,allure,titre,desc])=>`
    <div class="strat">
      <div class="strat-km">
        <div class="strat-km-l grad">${km}</div>
        <div class="strat-km-a">${allure}</div>
      </div>
      <div class="strat-c">
        <div class="strat-t">${titre}</div>
        <div class="strat-d">${desc}</div>
      </div>
    </div>`).join('')}
  </div>
  <div style="flex-shrink:0;padding:8px 0 8px 11px;border-left:2px solid rgba(139,47,201,.4);font-size:9.5pt;color:rgba(255,255,255,.75);line-height:1.5">
    <strong style="color:#C084FC">Hydratation :</strong> Eau au km 5 si disponible. Pas de gel sur 10km sauf si ta course dure plus d'une heure et que tu en as l'habitude. Ne jamais tester quelque chose de nouveau le jour J.
  </div>
  <div class="pnum">13</div>
</div>

<!-- PAGE 14 : NUTRITION -->
<div class="page">
  ${blobs('B')}
  <div class="page-title">Nutrition avant et après course</div>
  <p class="page-intro">Ce que tu mets dans l'assiette change tout — surtout les 48h avant le départ.</p>
  ${[
    { titre:'La veille de la course', rows:[
      ['Dîner glucides','Pâtes, riz, pain complet — constitue tes réserves de glycogène pour demain.'],
      ['Aliments à éviter','Légumineuses, crudités, fibres en excès — risque de problèmes digestifs.'],
      ['Règle d\'or','Aucun nouvel aliment. Reste sur ce que ton corps connaît et digère bien.'],
      ['Hydratation','1,5 à 2 litres d\'eau dans la journée.'],
    ]},
    { titre:'Le matin de la course', rows:[
      ['Timing','Dernier repas 2h30 à 3h avant le départ. Sans exception.'],
      ['Que manger','Pain blanc + confiture ou miel, banane, flocons d\'avoine. Digestion facile.'],
      ['Café','Si tu en as l\'habitude, oui. Jamais d\'essai le jour J.'],
      ['Hydratation','500 ml d\'eau jusqu\'au départ. Arrête de boire 30 min avant.'],
    ]},
    { titre:'Après la course', rows:[
      ['Fenêtre anabolique','Dans les 30 min : banane ou barre + eau ou boisson isotonique.'],
      ['Repas complet','Dans les 2h : protéines + glucides — poulet-riz, omelette-pain.'],
      ['Alcool','Évite les 24h suivantes — ralentit significativement la récupération.'],
      ['Hydratation','Continue à boire toute la journée. La déshydratation persiste longtemps.'],
    ]},
  ].map(s=>`
  <div style="flex-shrink:0">
    <div style="font-size:10pt;font-weight:700;margin-bottom:5px;padding-left:9px;border-left:2px solid rgba(139,47,201,.5);color:#fff">${s.titre}</div>
    <table class="tbl">
      <thead><tr><th style="width:24%">Point clé</th><th>Conseils</th></tr></thead>
      <tbody>${s.rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</tbody>
    </table>
  </div>`).join('')}
  <div class="pnum">14</div>
</div>

<!-- PAGE 15 : FINALE -->
<div class="page">
  ${blobs('A')}
  ${logoB64?`<div style="text-align:center;padding:4px 0"><img src="${logoB64}" style="width:52px;opacity:.85"/></div>`:''}
  <div style="text-align:center">
    <div class="page-title" style="font-size:20pt">Envie d'aller encore plus loin ?</div>
    <p style="font-size:9.5pt;color:rgba(255,255,255,.7);margin-top:6px;line-height:1.6">
      Ce plan t'a donné les bases. Imagine un plan qui s'adapte à toi chaque semaine,
      selon tes retours, tes progrès et ta forme réelle.
    </p>
  </div>
  <div style="padding:14px 16px;background:rgba(255,255,255,.04);border:1px solid rgba(139,47,201,.25);border-radius:12px;display:flex;flex-direction:column;gap:11px;flex-shrink:0">
    <div style="font-size:11.5pt;font-weight:800">Coaching personnalisé The Ultimate Academy</div>
    <div style="display:flex;flex-direction:column;gap:9px">
      ${[
        ['Plan 100% personnalisé','Généré selon ta VMA réelle, ton objectif précis et ta disponibilité.'],
        ['Ajusté chaque semaine','Évolue selon tes retours. Tu signales de la fatigue — il s\'allège.'],
        ['Bilan hebdomadaire','Un bilan personnalisé avec des conseils concrets chaque semaine.'],
        ['Analyses de course','Analyse pré-course J-7 et post-course pour comprendre et progresser.'],
        ['Accès direct au coach','Alexis répond à tes questions directement dans l\'application.'],
      ].map(([t,d])=>`
      <div style="display:flex;gap:9px;align-items:flex-start">
        <div style="width:5px;height:5px;border-radius:50%;background:linear-gradient(135deg,#8B2FC9,#E8237A);flex-shrink:0;margin-top:6px"></div>
        <div style="font-size:9.5pt"><strong>${t} —</strong> <span style="color:rgba(255,255,255,.7)">${d}</span></div>
      </div>`).join('')}
    </div>
    <div style="background:linear-gradient(135deg,#8B2FC9,#E8237A);border-radius:8px;padding:12px;text-align:center">
      <div style="font-size:11pt;font-weight:800;color:white">14 jours d'essai gratuit — sans engagement</div>
      <div style="font-size:9pt;color:rgba(255,255,255,.85);margin-top:2px">Rejoins les athlètes qui progressent chaque semaine avec un plan personnalisé.</div>
    </div>
  </div>
  <div style="text-align:center;margin-top:auto">
    <div class="grad" style="font-size:12pt;font-weight:800">theultimateacademy.fr</div>
  </div>
  <div class="pnum">15</div>
</div>

</body></html>`

// ─── Génération ───────────────────────────────────────────────────────────────
;(async () => {
  const browser = await puppeteer.launch({ headless:'new', args:['--no-sandbox','--disable-setuid-sandbox'] })
  const page    = await browser.newPage()
  await page.setContent(HTML, { waitUntil:'networkidle0', timeout:30000 })
  await page.evaluateHandle('document.fonts.ready')
  await page.pdf({ path:OUT, format:'A4', printBackground:true, margin:{top:0,right:0,bottom:0,left:0} })
  await browser.close()
  const ko = Math.round(fs.statSync(OUT).size/1024)
  console.log(`✅ PDF généré : ${OUT} (${ko} Ko)`)
})()
