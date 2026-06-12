const puppeteer = require('puppeteer')
const fs        = require('fs')
const path      = require('path')

const OUT  = path.join(__dirname, '../public/ebooks/10km-8sem.pdf')
const LOGO = path.join(__dirname, '../public/Logo.png')
fs.mkdirSync(path.dirname(OUT), { recursive: true })

const logoB64 = fs.existsSync(LOGO)
  ? `data:image/png;base64,${fs.readFileSync(LOGO).toString('base64')}`
  : ''

// ─── Données ──────────────────────────────────────────────────────────────────
const SEMAINES = [
  { num:1, phase:'Adaptation', charge:'Modérée',
    objectif:'Installer les habitudes d\'entraînement et prendre ses marques sur les allures. L\'objectif est de finir chaque séance en se sentant bien — pas de se mettre dans le rouge.',
    conseil:'L\'objectif sur les 10 × 400m n\'est pas d\'aller le plus vite sur chaque répétition, mais de tenir la même allure sur les 10. Garde tes 90 secondes de récupération complètes, sans les raccourcir.',
    seances:[
      { jour:'Mardi',    type:'EF',            titre:'Footing Endurance Fondamentale', duree:'40 min',
        echauff:'', corps:'Course continue à 65-70% VMA. Allure conversation — tu dois pouvoir parler en phrases complètes. Si tu as du mal à parler, tu vas trop vite.', retour:'',
        note:'RPE 4-5/10 · Finis la séance en te sentant bien, comme si tu pouvais encore courir 20 minutes.' },
      { jour:'Jeudi',    type:'Fractionné',     titre:'10 × 400 mètres',               duree:'55 min',
        echauff:'15 min de footing EF à 65% VMA.', corps:'10 × 400m à 95-100% VMA. Effort presque maximal sur chaque répétition. Récupération 90 secondes au trot entre chaque. Maintiens la même allure du premier au dernier.', retour:'10 min de jogging léger à 65% VMA.',
        note:'RPE 8-9/10 sur les 400m · Si les dernières sont nettement plus lentes, récupère un peu plus longtemps la prochaine fois.' },
      { jour:'Samedi',   type:'EF',            titre:'Footing de récupération',        duree:'30 min',
        echauff:'', corps:'30 min très faciles à 65% VMA. Active la circulation sanguine pour préparer la sortie longue du lendemain. Si tu as des courbatures, ce footing léger les élimine.', retour:'',
        note:'RPE 3/10 · Vraiment facile, aucun effort.' },
      { jour:'Dimanche', type:'Sortie longue',  titre:'Sortie longue',                  duree:'75 min',
        echauff:'', corps:'Course continue à 70-75% VMA pendant 75 minutes. Allure régulière du début à la fin. Hydrate-toi. Concentre-toi sur ta respiration et ta foulée.', retour:'',
        note:'RPE 5-6/10 · Tu dois pouvoir parler par courtes phrases. Si tu fatigues, ralentis mais continue.' },
    ]},
  { num:2, phase:'Adaptation', charge:'Modérée — légère progression',
    objectif:'Confirmer les bases. Le plan doit commencer à sembler naturel et gérable. Le corps assimile les nouvelles charges.',
    conseil:'Sur les 12 × 400m, l\'objectif n\'est pas d\'aller le plus vite sur chaque répétition — c\'est de tenir la même allure sur les 12. Si les dernières sont nettement plus lentes que les premières, tu es parti trop vite.',
    seances:[
      { jour:'Mardi',    type:'EF',            titre:'Footing Endurance Fondamentale', duree:'45 min',
        echauff:'', corps:'45 min à 65-70% VMA. Même principe que la semaine passée, 5 minutes supplémentaires. Allure conversation, régulière.', retour:'',
        note:'RPE 4-5/10 · Léger et régulier.' },
      { jour:'Jeudi',    type:'Fractionné',     titre:'12 × 400 mètres',               duree:'60 min',
        echauff:'15 min de footing EF à 65% VMA.', corps:'12 × 400m à 95-100% VMA. Deux de plus que la semaine dernière. Récupération 90 secondes au trot. Maintiens la même allure sur les 12 répétitions.', retour:'10 min de footing léger à 65% VMA.',
        note:'RPE 8-9/10 · La récupération à 90 sec est courte volontairement pour développer ta résistance.' },
      { jour:'Samedi',   type:'EF',            titre:'Footing de récupération',        duree:'35 min',
        echauff:'', corps:'35 min très faciles à 65% VMA. Active la circulation et prépare la sortie longue du lendemain.', retour:'',
        note:'RPE 3/10 · Vraiment facile.' },
      { jour:'Dimanche', type:'Sortie longue',  titre:'Sortie longue',                  duree:'80 min',
        echauff:'', corps:'80 min à 70-75% VMA. 5 minutes de plus que la semaine dernière. Régularité du début à la fin — ne t\'emballe pas sur la fin même si tu te sens bien.', retour:'',
        note:'RPE 5-6/10 · La sortie longue hebdomadaire est la pierre angulaire de ta préparation.' },
    ]},
  { num:3, phase:'Développement', charge:'Élevée — première séance tempo',
    objectif:'L\'inconfort arrive — c\'est le signe que tu travailles dans la bonne zone. Cette semaine marque une montée en intensité avec la première séance au seuil anaérobie.',
    conseil:'Sur le tempo, l\'allure doit être inconfortable mais tenable. Tu peux prononcer des mots isolés mais pas des phrases. Si tu dois t\'arrêter avant la fin, c\'est que tu es parti trop vite — reprends 5 secondes de moins par kilomètre.',
    seances:[
      { jour:'Mardi',    type:'EF',            titre:'Footing long EF',                duree:'50 min',
        echauff:'', corps:'50 min à 70% VMA. Long et facile avant la semaine chargée. Travaille ta technique : légère bascule vers l\'avant, attaque milieu du pied.', retour:'',
        note:'RPE 5/10 · Si tu te sens fatigué, passe à 65% VMA — la durée compte plus que l\'intensité ici.' },
      { jour:'Mercredi', type:'Tempo',          titre:'Tempo continu — 20 minutes',    duree:'50 min',
        echauff:'15 min de footing progressif à 65-70% VMA.', corps:'20 minutes continues à 85% VMA. Première vraie séance au seuil. L\'allure doit être difficile mais tenable sur la durée. Tu dois pouvoir prononcer des mots mais pas tenir une conversation.', retour:'15 min de jogging très lent à 65% VMA.',
        note:'RPE 7-8/10 · C\'est normal si tu souffres sur les dernières minutes — c\'est cette zone qui te fait progresser.' },
      { jour:'Vendredi', type:'Fractionné',     titre:'5 × 1000 mètres',               duree:'60 min',
        echauff:'15 min de footing EF à 65% VMA.', corps:'5 × 1000m à 85-88% VMA. Intervalles plus longs que les 400m — développent ta résistance à l\'allure seuil. Récupération 2 min au trot entre chaque.', retour:'10 min de footing léger à 65% VMA.',
        note:'RPE 7-8/10 · La progression 400m → 1000m est intentionnelle. Ton corps est maintenant prêt pour des efforts plus longs.' },
      { jour:'Dimanche', type:'Sortie longue',  titre:'Sortie longue + accélération finale', duree:'85 min',
        echauff:'', corps:'70 min à 70-75% VMA, puis accélération progressive sur les 15 dernières minutes à 80-82% VMA. Cette progression t\'apprend à finir fort — compétence clé sur les 2 derniers km de course.', retour:'',
        note:'RPE 6/10 puis 7-8/10 · Mémorise la sensation de finir fort — tu la réutiliseras en course.' },
    ]},
  { num:4, phase:'Développement', charge:'Élevée — consolidation du seuil',
    objectif:'Consolider le travail de seuil et augmenter le volume. La fatigue commence à s\'installer — mange correctement et dors 8 heures.',
    conseil:'Si tu ressens une fatigue importante en milieu de semaine, remplace la séance du vendredi par un footing EF de 40 min. Un athlète reposé qui adapte son plan progresse davantage qu\'un athlète épuisé qui le suit aveuglément.',
    seances:[
      { jour:'Mardi',    type:'EF',            titre:'Footing long EF',                duree:'55 min',
        echauff:'', corps:'55 min à 70% VMA. Long, régulier, facile. Volume avant la semaine la plus chargée jusqu\'ici.', retour:'',
        note:'RPE 5/10 · Si tu te sens fatigué, passe à 65% VMA.' },
      { jour:'Mercredi', type:'Tempo',          titre:'2 × 15 minutes au seuil',       duree:'55 min',
        echauff:'15 min de footing progressif EF.', corps:'2 × 15 min à 85% VMA avec 3 min de récupération au trot entre les deux. Plus difficile que le tempo continu car la deuxième répétition arrive quand tu es déjà fatigué.', retour:'10 min de footing léger.',
        note:'RPE 7-8/10 · Si la deuxième répétition est plus difficile que la première, c\'est qu\'elle est supposée l\'être.' },
      { jour:'Vendredi', type:'Fractionné',     titre:'6 × 1000 mètres',               duree:'65 min',
        echauff:'15 min de footing EF.', corps:'6 × 1000m à 87-90% VMA. Une répétition de plus que la semaine dernière, allure légèrement plus haute. Récupération 2 min au trot. Ne t\'emballe pas sur les premières.', retour:'10 min de footing léger.',
        note:'RPE 8/10 · C\'est normal si les dernières répétitions sont dures — tu construis ta résistance aérobie.' },
      { jour:'Dimanche', type:'Sortie longue',  titre:'Sortie longue',                  duree:'90 min',
        echauff:'', corps:'90 min à 72-75% VMA. Ta sortie longue la plus importante jusqu\'ici. Régularité et respiration. Hydrate-toi toutes les 20-25 min.', retour:'',
        note:'RPE 6/10 · Si tu arrives épuisé, tu es allé trop vite. Tu dois finir fatigué mais pas à plat.' },
    ]},
  { num:5, phase:'Intensification', charge:'Élevée — bloc VMA',
    objectif:'Les séances les plus intenses du plan. Ce sont elles qui font progresser le plus sur 10km. Donne tout sur les répétitions, récupère bien entre les séances.',
    conseil:'Les côtes sont la séance la plus efficace du plan. Concentre-toi sur l\'impulsion au sol et la montée des genoux — pas sur le chrono. La descente au trot est ta récupération active, ne la court-circuite pas.',
    seances:[
      { jour:'Mardi',    type:'Côtes',          titre:'10 × côtes — 150 mètres',       duree:'55 min',
        echauff:'20 min de footing progressif à 65-70% VMA.', corps:'10 montées de 150m à effort maximal. Genoux hauts, bras actifs, pousse à fond jusqu\'en haut. Descente au trot complète entre chaque montée.', retour:'15 min de footing très léger à 65% VMA.',
        note:'RPE 9/10 sur les montées · Les côtes renforcent tes muscles propulseurs et améliorent ta foulée.' },
      { jour:'Vendredi', type:'Fractionné',     titre:'16 × 300 mètres',               duree:'60 min',
        echauff:'15 min de footing EF.', corps:'16 × 300m à 100-105% VMA. Répétitions courtes à intensité très élevée. Récupération 60 sec entre chaque. Maintiens la même vitesse sur les 16 répétitions.', retour:'10 min de footing léger.',
        note:'RPE 9/10 · 60 sec de récupération c\'est court — calculé pour forcer ton système à s\'adapter à des efforts répétés.' },
      { jour:'Samedi',   type:'EF',            titre:'Footing de récupération',        duree:'35 min',
        echauff:'', corps:'35 min très faciles à 65% VMA. Fondamentale après une grosse semaine — active la circulation pour accélérer la récupération musculaire.', retour:'',
        note:'RPE 3/10 · Cette séance ne te fatigue pas — elle t\'aide à récupérer plus vite pour la sortie longue.' },
      { jour:'Dimanche', type:'Sortie longue',  titre:'Sortie longue avec encart allure', duree:'90 min',
        echauff:'', corps:'60 min à 70-75% VMA, puis 5 km à ton allure cible 10km, puis retour à l\'allure EF pour finir. Cet encart t\'apprend à tenir l\'allure quand les jambes sont déjà sollicitées.', retour:'',
        note:'RPE 6/10 en EF · 7-8/10 sur les 5 km · Note ton allure — c\'est un indicateur fiable de ta forme.' },
    ]},
  { num:6, phase:'Intensification', charge:'Maximale — dernier bloc chargé',
    objectif:'Dernière semaine de charge maximale avant l\'affûtage. Tu atteins le pic de ta préparation. Ce que tu construis cette semaine sera transformé en performance lors de l\'affûtage.',
    conseil:'C\'est ta semaine de charge maximale. N\'ajoute rien. Mange des glucides les soirs avant les séances clés — pâtes, riz, pain. Dors 8 heures. Hydrate-toi toute la journée.',
    seances:[
      { jour:'Mardi',    type:'Tempo',          titre:'3 × 10 minutes au seuil',       duree:'60 min',
        echauff:'15 min de footing progressif EF.', corps:'3 × 10 min à 87-90% VMA avec 3 min de récupération entre chaque. La troisième répétition est la plus difficile. Maintiens l\'allure, résiste à l\'envie de ralentir.', retour:'10 min de footing léger à 65% VMA.',
        note:'RPE 8-9/10 · 30 minutes totales au seuil — ton record sur ce plan. C\'est cette résistance qui fera la différence en course.' },
      { jour:'Jeudi',    type:'Spécifique',      titre:'4 × 2 km à allure objectif',    duree:'60 min',
        echauff:'15 min de footing EF.', corps:'4 × 2 km exactement à ton allure cible 10km. Récupération 90 sec au trot. La séance la plus course-spécifique du plan — tu répètes ce que tu vas faire le jour J.', retour:'10 min de footing léger.',
        note:'RPE 8/10 · Utilise ta montre GPS. Si l\'allure cible est trop facile sur les premières, ton objectif est peut-être trop prudent.' },
      { jour:'Samedi',   type:'EF',            titre:'Footing de récupération',        duree:'35 min',
        echauff:'', corps:'35 min à 65% VMA. Indispensable pour absorber la charge des deux séances clés. Ton corps s\'adapte à un niveau supérieur — ce footing accélère ce processus.', retour:'',
        note:'RPE 3/10 · Le footing de récupération est aussi important que les séances intenses.' },
      { jour:'Dimanche', type:'Sortie longue',  titre:'Dernière sortie longue',         duree:'85 min',
        echauff:'', corps:'85 min à 70-75% VMA. Ta dernière vraie sortie longue avant la course. Mémorise cette sensation — l\'affûtage va encore l\'améliorer.', retour:'',
        note:'RPE 6/10 · Après cette séance, l\'entraînement dur est terminé. Dans 2 semaines, tu courras ta meilleure course.' },
    ]},
  { num:7, phase:'Affûtage', charge:'Volume réduit — intensité maintenue',
    objectif:'L\'affûtage ne fait pas perdre de forme — il la concentre. Tu gardes une séance d\'intensité pour maintenir les sensations. Tes muscles récupèrent, tes réserves se remplissent.',
    conseil:'L\'affûtage est souvent source d\'angoisse. Des études montrent qu\'un athlète est au maximum de ses capacités 8 à 14 jours après la dernière grosse charge. Ce plan est calculé pour ça — fais confiance au processus.',
    seances:[
      { jour:'Mardi',    type:'EF',            titre:'Footing léger',                  duree:'30 min',
        echauff:'', corps:'30 min très faciles à 65% VMA. Garder les jambes en mouvement sans les fatiguer. Cours au ressenti, sans montre.', retour:'',
        note:'RPE 3/10 · Tu dois finir comme si tu venais de te promener.' },
      { jour:'Jeudi',    type:'Fractionné',     titre:'6 × 400 mètres — volume réduit', duree:'40 min',
        echauff:'10 min de footing progressif EF.', corps:'6 × 400m à 95-100% VMA. Volume réduit de 40% mais intensité maintenue. Récupération plus longue : 2 min entre chaque. L\'objectif est de rappeler à ton corps les sensations de course rapide.', retour:'10 min de footing léger.',
        note:'RPE 8/10 · Ces 6 répétitions maintiennent tes sensations sans te fatiguer. Ne rajoute rien après.' },
      { jour:'Samedi',   type:'EF',            titre:'Trot très léger — activation',   duree:'25 min',
        echauff:'', corps:'25 min de trot à 60-65% VMA. Juste assez pour que les jambes se souviennent de courir avant la course dans une semaine.', retour:'',
        note:'RPE 2-3/10 · Tout pour la course. Ne dépasse jamais cette sensation.' },
    ]},
  { num:8, phase:'Semaine de course', charge:'Conserve — tu es prêt',
    objectif:'Rien ne se gagne à l\'entraînement cette semaine. L\'objectif unique : arriver au départ reposé, confiant, les jambes fraîches.',
    conseil:'Fais confiance à tes 7 semaines de travail. Pars légèrement en dessous de ton allure cible les 2 premiers km. Tu rattraperas les impatients au km 7. C\'est une certitude si tu as suivi ce plan.',
    seances:[
      { jour:'Lundi',    type:'EF',            titre:'Footing très léger',             duree:'30 min',
        echauff:'', corps:'30 min à 60-65% VMA. Maintenir la circulation sanguine. Si tu te sens fatigué, réduis à 20 minutes.', retour:'',
        note:'RPE 3/10 · Vraiment facile, aucun effort.' },
      { jour:'Mardi',    type:'EF',            titre:'Footing très léger',             duree:'25 min',
        echauff:'', corps:'25 min à 60-65% VMA. Même principe que la veille. Profite pour visualiser ta course et te concentrer mentalement.', retour:'',
        note:'RPE 3/10 · Pas d\'effort. Juste des jambes qui tournent.' },
      { jour:'Samedi',   type:'Activation',    titre:'Activation J-1 + accélérations',duree:'30 min',
        echauff:'', corps:'20 min de trot très léger à 60-65% VMA. Puis 6 à 8 accélérations progressives de 80 mètres : démarre doucement et accélère progressivement jusqu\'à 90% de ta vitesse max sur les derniers 20m. Récupère 60 sec en marchant entre chaque. Termine par 5 min de marche.', retour:'',
        note:'Ces accélérations réveillent tes fibres musculaires rapides et donnent de meilleures sensations demain. Court, ciblé, très efficace la veille d\'une course.' },
      { jour:'Dimanche', type:'Course',        titre:'COURSE — 10 KILOMÈTRES',        duree:'Jour J',
        echauff:'10 min de jogging léger avant le départ si le protocole le permet.', corps:'KM 1-2 : pars 5 à 8 sec/km en dessous de ton allure cible. KM 3-8 : allure cible exacte, régularité absolue. KM 9 : accélère progressivement si tu as des réserves. KM 10 : donne absolument tout ce qu\'il reste.', retour:'10-15 min de marche pour revenir au calme. Banane et eau dans les 30 min.',
        note:'Les sensations difficiles aux km 6-7 sont normales et passagères. C\'est là que se gagne ou se perd un 10km.' },
    ]},
]

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
@page { size: A4; margin: 0; }
* { margin:0; padding:0; box-sizing:border-box; }
body {
  font-family: 'Poppins', sans-serif;
  background: #0C0A18;
  color: rgba(255,255,255,.92);
  font-size: 10pt;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* ── PAGE ── */
.page {
  width: 210mm;
  padding: 13mm 14mm 14mm;
  background: #0C0A18;
  page-break-before: always;
  break-before: page;
  display: flex;
  flex-direction: column;
  gap: 11px;
  position: relative;
}

/* ── GRADIENT TEXT ── */
.grad {
  background: linear-gradient(135deg,#8B2FC9,#E8237A);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ── LABEL ── */
.lbl {
  font-size: 7pt;
  font-weight: 700;
  color: rgba(255,255,255,.28);
  text-transform: uppercase;
  letter-spacing: .1em;
  margin-bottom: 6px;
}

/* ── PAGE TITLE ── */
.page-title {
  font-size: 26pt;
  font-weight: 800;
  line-height: 1;
  margin-bottom: 5px;
}
.page-intro {
  font-size: 9pt;
  color: rgba(255,255,255,.55);
  line-height: 1.55;
}

/* ── PAGE NUM ── */
.pnum {
  text-align: center;
  font-size: 8pt;
  font-weight: 700;
  background: linear-gradient(135deg,#8B2FC9,#E8237A);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  padding-top: 2px;
}

/* ── COUVERTURE ── */
.cover-page {
  width: 210mm;
  height: 297mm;
  background: #0C0A18;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  page-break-after: always;
  break-after: page;
}
.cover-glow {
  position: absolute;
  top: -80px;
  left: -60px;
  width: 420px;
  height: 420px;
  border-radius: 50%;
  background: radial-gradient(ellipse at center, rgba(139,47,201,.14) 0%, transparent 65%);
  pointer-events: none;
}
.cover-glow-right {
  position: absolute;
  bottom: -60px;
  right: -40px;
  width: 320px;
  height: 320px;
  border-radius: 50%;
  background: radial-gradient(ellipse at center, rgba(232,35,122,.1) 0%, transparent 65%);
  pointer-events: none;
}
.cover-stripe {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, #8B2FC9, #E8237A);
}
.cover-header {
  padding: 14mm 14mm 0;
  display: flex;
  align-items: center;
  gap: 10px;
}
.cover-header img { width: 38px; opacity: .75; }
.cover-brand { font-size: 7pt; font-weight: 700; color: rgba(255,255,255,.25); letter-spacing: .14em; text-transform: uppercase; }

.cover-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 14mm;
}
.cover-eyebrow {
  font-size: 7.5pt;
  font-weight: 700;
  color: rgba(255,255,255,.28);
  letter-spacing: .2em;
  text-transform: uppercase;
  margin-bottom: 14px;
}
.cover-title-wrap {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  line-height: 1;
  margin-bottom: 4px;
}
.cover-num {
  font-size: 108pt;
  font-weight: 800;
  line-height: .88;
  letter-spacing: -.04em;
}
.cover-unit {
  font-size: 32pt;
  font-weight: 800;
  padding-bottom: 8px;
  letter-spacing: -.01em;
}
.cover-tagline {
  font-size: 12.5pt;
  font-weight: 500;
  color: rgba(255,255,255,.42);
  letter-spacing: .05em;
  margin-top: 10px;
}
.cover-sep {
  width: 40px;
  height: 2px;
  background: linear-gradient(90deg,#8B2FC9,#E8237A);
  border-radius: 1px;
  margin: 22px 0 18px;
}
.cover-items { display: flex; flex-direction: column; gap: 9px; }
.cover-item { display: flex; gap: 10px; align-items: flex-start; }
.cover-dot {
  width: 4px; height: 4px;
  border-radius: 50%;
  background: linear-gradient(135deg,#8B2FC9,#E8237A);
  flex-shrink: 0;
  margin-top: 5px;
}
.cover-item-text { font-size: 9pt; color: rgba(255,255,255,.42); }

.cover-footer {
  padding: 0 14mm 13mm;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}
.cover-chips { display: flex; gap: 5px; flex-wrap: wrap; }
.chip { background: rgba(139,47,201,.12); border: 1px solid rgba(139,47,201,.25); border-radius: 20px; padding: 3px 9px; font-size: 7pt; font-weight: 600; color: rgba(255,255,255,.38); }
.cover-by { font-size: 7.5pt; color: rgba(255,255,255,.18); text-align: right; }

/* ── SEMAINE HEADER ── */
.week-hero {
  padding-bottom: 7px;
  border-bottom: 1px solid rgba(255,255,255,.07);
}
.week-eyebrow { font-size: 7pt; font-weight: 700; color: rgba(255,255,255,.28); letter-spacing: .12em; text-transform: uppercase; margin-bottom: 2px; }
.week-title { font-size: 30pt; font-weight: 800; line-height: 1; margin-bottom: 3px; }
.week-charge { font-size: 8.5pt; color: rgba(255,255,255,.38); }

/* ── OBJECTIF ── */
.objectif {
  padding: 0 0 0 11px;
  border-left: 2px solid rgba(139,47,201,.45);
}
.obj-lbl { font-size: 6.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: .09em; color: rgba(139,47,201,.85); margin-bottom: 3px; }
.obj-txt { font-size: 8.5pt; color: rgba(255,255,255,.56); line-height: 1.5; }

/* ── SESSION ── */
.session {
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(139,47,201,.16);
  border-radius: 10px;
  overflow: hidden;
  break-inside: avoid;
  page-break-inside: avoid;
}
.session-head {
  background: rgba(139,47,201,.13);
  padding: 7px 11px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.s-badge { border: 1px solid rgba(139,47,201,.4); border-radius: 16px; padding: 2px 8px; font-size: 6.5pt; font-weight: 700; color: #C084FC; background: rgba(139,47,201,.1); flex-shrink: 0; }
.s-badge.course { border-color: rgba(232,35,122,.4); color: #F472B6; background: rgba(232,35,122,.1); }
.s-jour { font-size: 7.5pt; font-weight: 600; color: rgba(255,255,255,.33); flex-shrink: 0; }
.s-titre { font-size: 9pt; font-weight: 700; flex: 1; }
.s-duree { font-size: 8pt; font-weight: 700; flex-shrink: 0; }

.session-body { padding: 8px 11px; display: flex; flex-direction: column; gap: 4px; }

.bloc { display: flex; gap: 7px; align-items: flex-start; }
.bloc-lbl { font-size: 6.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; flex-shrink: 0; width: 66px; padding-top: 1px; }
.bloc-lbl.e { color: rgba(192,132,252,.8); }
.bloc-lbl.c { color: rgba(255,255,255,.38); }
.bloc-lbl.r { color: rgba(244,114,182,.8); }
.bloc-txt { font-size: 8.5pt; color: rgba(255,255,255,.62); line-height: 1.5; flex: 1; }

.arrow { font-size: 8pt; color: rgba(139,47,201,.28); padding: 0 0 0 33px; }

.session-note {
  padding: 5px 11px;
  border-top: 1px solid rgba(139,47,201,.08);
  font-size: 7pt;
  color: rgba(255,255,255,.28);
  font-style: italic;
  line-height: 1.4;
}

/* ── CONSEIL ── */
.conseil {
  padding: 0 0 0 11px;
  border-left: 2px solid rgba(232,35,122,.35);
  break-inside: avoid;
  page-break-inside: avoid;
}
.conseil-lbl { font-size: 6.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: .09em; color: rgba(232,35,122,.8); margin-bottom: 3px; }
.conseil-txt { font-size: 8.5pt; color: rgba(255,255,255,.52); line-height: 1.5; }

/* ── TABLES ── */
.tbl { width: 100%; border-collapse: collapse; font-size: 8.5pt; }
.tbl thead tr { background: linear-gradient(135deg,#8B2FC9,#E8237A); }
.tbl thead th { color: white; font-weight: 700; padding: 7px 10px; text-align: left; font-size: 7.5pt; }
.tbl tbody tr:nth-child(odd)  { background: rgba(255,255,255,.035); }
.tbl tbody tr:nth-child(even) { background: rgba(255,255,255,.015); }
.tbl tbody td { padding: 6px 10px; border-bottom: 1px solid rgba(139,47,201,.07); color: rgba(255,255,255,.68); line-height: 1.4; vertical-align: top; }
.tbl td:first-child { font-weight: 600; color: rgba(139,47,201,.9); }

/* ── ZONE ── */
.zone { display: flex; gap: 10px; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,.06); break-inside: avoid; page-break-inside: avoid; }
.zone:last-child { border-bottom: none; }
.zone-pct { font-size: 8pt; font-weight: 800; color: #C084FC; flex-shrink: 0; width: 36px; padding-top: 2px; }
.zone-name { font-size: 9pt; font-weight: 700; margin-bottom: 2px; }
.zone-desc { font-size: 8.5pt; color: rgba(255,255,255,.52); line-height: 1.45; }

/* ── PRINCIPE ── */
.principe { display: flex; gap: 12px; align-items: flex-start; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,.06); break-inside: avoid; page-break-inside: avoid; }
.principe:last-child { border-bottom: none; }
.p-num { font-size: 13pt; font-weight: 800; flex-shrink: 0; width: 26px; line-height: 1; padding-top: 1px; }
.p-t { font-size: 9.5pt; font-weight: 700; margin-bottom: 3px; }
.p-d { font-size: 8.5pt; color: rgba(255,255,255,.55); line-height: 1.5; }

/* ── STRATÉGIE ── */
.strat { display: flex; gap: 12px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,.06); break-inside: avoid; page-break-inside: avoid; }
.strat:last-child { border-bottom: none; }
.strat-km { width: 50px; flex-shrink: 0; }
.strat-km-l { font-size: 10.5pt; font-weight: 800; line-height: 1.15; }
.strat-km-a { font-size: 7pt; color: rgba(255,255,255,.35); margin-top: 2px; }
.strat-c { flex: 1; border-left: 2px solid rgba(139,47,201,.22); padding-left: 10px; }
.strat-t { font-size: 9.5pt; font-weight: 700; margin-bottom: 3px; }
.strat-d { font-size: 8.5pt; color: rgba(255,255,255,.55); line-height: 1.5; }
`

// ─── Helpers HTML ─────────────────────────────────────────────────────────────
function sessionCard(s) {
  const isCourse = s.type === 'Course'
  const bc = isCourse ? 's-badge course' : 's-badge'
  const blocs = []
  if (s.echauff) {
    blocs.push(`<div class="bloc"><span class="bloc-lbl e">Échauffement</span><span class="bloc-txt">${s.echauff}</span></div>`)
    blocs.push(`<div class="arrow">↓</div>`)
  }
  blocs.push(`<div class="bloc"><span class="bloc-lbl c">${s.echauff ? 'Séance' : 'Corps de séance'}</span><span class="bloc-txt">${s.corps}</span></div>`)
  if (s.retour) {
    blocs.push(`<div class="arrow">↓</div>`)
    blocs.push(`<div class="bloc"><span class="bloc-lbl r">Retour calme</span><span class="bloc-txt">${s.retour}</span></div>`)
  }
  return `
  <div class="session">
    <div class="session-head">
      <span class="${bc}">${s.type}</span>
      <span class="s-jour">${s.jour}</span>
      <span class="s-titre">${s.titre}</span>
      <span class="s-duree grad">${s.duree}</span>
    </div>
    <div class="session-body">${blocs.join('')}</div>
    <div class="session-note">${s.note}</div>
  </div>`
}

function weekPage(sem) {
  return `
  <div class="page">
    <div class="week-hero">
      <div class="week-eyebrow">Semaine ${sem.num} sur 8</div>
      <div class="week-title grad">${sem.phase.toUpperCase()}</div>
      <div class="week-charge">${sem.charge}</div>
    </div>
    <div class="objectif">
      <div class="obj-lbl">Objectif de la semaine</div>
      <div class="obj-txt">${sem.objectif}</div>
    </div>
    ${sem.seances.map(s => sessionCard(s)).join('')}
    <div class="conseil">
      <div class="conseil-lbl">Conseil de la semaine</div>
      <div class="conseil-txt">${sem.conseil}</div>
    </div>
    <div class="pnum">${sem.num + 3}</div>
  </div>`
}

// ─── HTML COMPLET ─────────────────────────────────────────────────────────────
const HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>${CSS}</style>
</head>
<body>

<!-- COUVERTURE -->
<div class="cover-page">
  <div class="cover-stripe"></div>
  <div class="cover-glow"></div>
  <div class="cover-glow-right"></div>

  <div class="cover-header">
    ${logoB64 ? `<img src="${logoB64}"/>` : ''}
    <span class="cover-brand">The Ultimate Academy</span>
  </div>

  <div class="cover-body">
    <div class="cover-eyebrow">Plan d'entraînement</div>
    <div class="cover-title-wrap">
      <span class="cover-num grad">10</span>
      <span class="cover-unit grad">KM</span>
    </div>
    <div class="cover-tagline">8 semaines de préparation</div>
    <div class="cover-sep"></div>
    <div class="cover-items">
      ${[
        'Programme complet semaine par semaine',
        'Allures personnalisées selon ta VMA',
        'Détail complet de chaque séance',
        'Stratégie de course kilomètre par kilomètre',
        'Nutrition avant, pendant et après',
      ].map(t => `
      <div class="cover-item">
        <div class="cover-dot"></div>
        <span class="cover-item-text">${t}</span>
      </div>`).join('')}
    </div>
  </div>

  <div class="cover-footer">
    <div class="cover-chips">
      <span class="chip">4–5 séances / semaine</span>
      <span class="chip">Toutes VMA</span>
      <span class="chip">Intermédiaire</span>
    </div>
    <div class="cover-by">by Alexis · theultimateacademy.fr</div>
  </div>
</div>

<!-- ALLURES -->
<div class="page">
  <div>
    <div class="page-title grad">Tes allures personnalisées</div>
    <p class="page-intro">
      Toutes les séances de ce plan utilisent des % de VMA (Vitesse Maximale Aérobie).
      Rends-toi sur <strong style="color:#C084FC">theultimateacademy.fr/calculateur/vma</strong>,
      saisis ta VMA et récupère tes allures exactes en 2 minutes.
      Si tu ne connais pas ta VMA : cours 12 minutes, mesure la distance.
      Ta VMA en km/h = distance en mètres ÷ 200. <em style="color:rgba(255,255,255,.4)">(Ex : 2 800 m → VMA 14 km/h)</em>
    </p>
  </div>
  <div>
    <div class="lbl">Tableau de référence — VMA 14 km/h</div>
    <table class="tbl">
      <thead><tr>
        <th style="width:28%">Zone</th><th style="width:9%">% VMA</th>
        <th style="width:10%">Allure</th><th style="width:11%">Vitesse</th>
        <th>Ressenti et usage dans ce plan</th>
      </tr></thead>
      <tbody>
        <tr><td>Endurance Fondamentale</td><td>65%</td><td>6'36"</td><td>9,1 km/h</td><td>Conversation facile · base aérobie · 80% du volume</td></tr>
        <tr><td>Endurance Active</td><td>75%</td><td>5'43"</td><td>10,5 km/h</td><td>Confortable mais soutenu · phrases courtes</td></tr>
        <tr><td>Seuil Anaérobie</td><td>85%</td><td>5'02"</td><td>11,9 km/h</td><td>Difficile, tenable 20-40 min · Tempo</td></tr>
        <tr><td>VMA — 95%</td><td>95%</td><td>4'30"</td><td>13,3 km/h</td><td>Très difficile · répétitions courtes · fractionnés</td></tr>
        <tr><td>VMA Max — 100%</td><td>100%</td><td>4'17"</td><td>14,0 km/h</td><td>Effort maximal · côtes et 300m</td></tr>
      </tbody>
    </table>
  </div>
  <div>
    <div class="lbl">Les 3 zones clés de ce plan</div>
    <div>
      ${[
        ['60–70%', 'Endurance Fondamentale', '80% du volume se fait ici. Allure où tu peux tenir une conversation. Les footings EF construisent ton moteur aérobie, améliorent ton efficacité cardiaque et préparent le corps aux séances intenses. Ils ne sont pas du remplissage — ils sont la base.'],
        ['80–88%', 'Seuil Anaérobie', 'Inconfortable mais tenable 20 à 40 minutes. Mots isolés mais pas de phrases. C\'est ici que se construisent tes capacités à maintenir l\'allure sur 10km. Les séances Tempo de ce plan travaillent précisément cette zone.'],
        ['90–105%', 'VMA', 'Tenable de 30 secondes à 5 minutes. Intervalles courts avec récupération. La zone qui fait le plus progresser sur 10km en développant ton plafond aérobie. Fractionnés 400m, 1000m et côtes travaillent cette zone.'],
      ].map(([pct,name,desc]) => `
      <div class="zone">
        <div class="zone-pct">${pct}</div>
        <div>
          <div class="zone-name">${name}</div>
          <div class="zone-desc">${desc}</div>
        </div>
      </div>`).join('')}
    </div>
  </div>
  <div class="pnum">2</div>
</div>

<!-- PRINCIPES -->
<div class="page">
  <div>
    <div class="page-title grad">Les principes du plan</div>
    <p class="page-intro">Ce que tu dois savoir avant de commencer — les règles qui font la différence entre progresser et stagner.</p>
  </div>
  <div>
    ${[
      ['01','La règle 80/20','80% du volume en Endurance Fondamentale, 20% à haute intensité. C\'est la répartition des coureurs d\'élite mondiaux. Elle permet de progresser vite sans surentraînement. Les footings EF ne sont pas du remplissage — ils construisent le moteur qui te permet de soutenir ton allure en course.'],
      ['02','L\'échauffement — 15 min, toujours','15 minutes de footing EF avant chaque séance intense, sans exception. L\'échauffement prépare les muscles, les tendons et le cœur. Il réduit fortement le risque de blessure. Si tu manques de temps, raccourcis la séance principale — jamais l\'échauffement.'],
      ['03','Le retour au calme — 10 min, toujours','10 minutes de jogging léger après chaque séance intense. Accélère l\'élimination des déchets métaboliques et prépare le corps pour la séance suivante. Sur 8 semaines, l\'effet cumulé sur ta récupération est significatif. Ce n\'est pas optionnel.'],
      ['04','La progressivité — la règle des 10%','Le volume augmente de 10% maximum par semaine. Augmenter trop vite est la première cause de blessure — syndrome rotulien, périostite, tendinite. Respecte le plan même si tu te sens bien : la fatigue profonde se ressent 48h après, pas pendant.'],
      ['05','Le renforcement musculaire','1 séance par semaine en complément : gainage, fentes, squats, montées de mollets. 20 minutes suffisent. Protège les genoux, les hanches et les chevilles — les zones les plus exposées du coureur. Cette séance protège ta saison entière.'],
    ].map(([n,t,d]) => `
    <div class="principe">
      <div class="p-num grad">${n}</div>
      <div>
        <div class="p-t">${t}</div>
        <div class="p-d">${d}</div>
      </div>
    </div>`).join('')}
  </div>
  <div class="pnum">3</div>
</div>

<!-- SEMAINES -->
${SEMAINES.map(s => weekPage(s)).join('')}

<!-- STRATÉGIE -->
<div class="page">
  <div>
    <div class="page-title grad">Stratégie de course</div>
    <p class="page-intro">
      La majorité des coureurs ratent leur 10km sur les 2 premiers kilomètres en partant trop vite.
      Cette stratégie en 4 phases fonctionne à tous les niveaux.
    </p>
  </div>
  <div>
    ${[
      ['KM 1-2','-5 à 8 sec/km','Patience et retenue','Pars légèrement sous ton allure cible. L\'adrénaline du départ va te pousser à partir vite — résiste. Ces 2 km trop rapides peuvent te coûter 30 à 60 secondes sur les 3 derniers. Laisse les autres s\'emballer. Tu les rattraperas.'],
      ['KM 3-8','Allure cible','Régularité absolue','Utilise ta montre GPS. Chaque kilomètre identique. Ne te laisse pas emporter par un bon split ni démoraliser par un mauvais. Un 10km régulier est toujours plus rapide qu\'un 10km en yoyo. Foulée, respiration, posture.'],
      ['KM 9','Si réserves','Évaluation et décision','Fais un bilan honnête. Si tu as des réserves, accélère progressivement. Si tu souffres, maintiens l\'allure — ne t\'engage pas dans une accélération que tu ne pourras pas tenir jusqu\'à la ligne.'],
      ['KM 10','Tout ce qui reste','Donner absolument tout','Donne tout. La douleur est temporaire, le chrono est permanent. Visualise la ligne d\'arrivée depuis le km 9,5. Raccourcis ta foulée, augmente ta cadence. Tout ce que tu as conservé depuis le départ — c\'est maintenant.'],
    ].map(([km,allure,titre,desc]) => `
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
  <div style="padding:9px 0 9px 11px;border-left:2px solid rgba(139,47,201,.3);font-size:8.5pt;color:rgba(255,255,255,.55);line-height:1.5">
    <strong style="color:#C084FC">Hydratation :</strong>
    Eau au km 5 si disponible — prends le gobelet en courant. Pas de gel sur 10km sauf si ta course dure plus d'une heure et que tu en as l'habitude. Ne jamais tester quelque chose de nouveau le jour de la course.
  </div>
  <div class="pnum">12</div>
</div>

<!-- NUTRITION -->
<div class="page">
  <div>
    <div class="page-title grad">Nutrition avant et après course</div>
    <p class="page-intro">Ce que tu mets dans l'assiette change tout — surtout les 48h avant le départ.</p>
  </div>
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
  ].map(s => `
  <div>
    <div style="font-size:10pt;font-weight:700;margin-bottom:5px;padding-left:9px;border-left:2px solid rgba(139,47,201,.4)">${s.titre}</div>
    <table class="tbl">
      <thead><tr><th style="width:24%">Point clé</th><th>Conseils</th></tr></thead>
      <tbody>${s.rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</tbody>
    </table>
  </div>`).join('')}
  <div class="pnum">13</div>
</div>

<!-- PAGE FINALE -->
<div class="page">
  ${logoB64 ? `<div style="text-align:center;padding:10px 0 6px"><img src="${logoB64}" style="width:60px;opacity:.8"/></div>` : ''}
  <div style="text-align:center">
    <div class="page-title grad" style="font-size:21pt">Envie d'aller encore plus loin ?</div>
    <p style="font-size:9pt;color:rgba(255,255,255,.45);margin-top:6px;line-height:1.6">
      Ce plan t'a donné les bases. Imagine un plan qui s'adapte à toi chaque semaine,
      selon tes retours, tes progrès et ta forme réelle.
    </p>
  </div>
  <div style="padding:14px 16px;background:rgba(255,255,255,.04);border:1px solid rgba(139,47,201,.2);border-radius:12px;display:flex;flex-direction:column;gap:10px">
    <div style="font-size:11.5pt;font-weight:800">Coaching personnalisé The Ultimate Academy</div>
    <div style="display:flex;flex-direction:column;gap:7px">
      ${[
        ['Plan 100% personnalisé','Généré selon ta VMA réelle, ton objectif précis et ta disponibilité — pas un plan générique.'],
        ['Ajusté chaque semaine','Évolue selon tes retours. Tu signales de la fatigue — il s\'allège. Tu progresses — il accélère.'],
        ['Bilan hebdomadaire','Un bilan personnalisé avec des conseils concrets chaque semaine.'],
        ['Analyses de course','Analyse pré-course J-7 et post-course pour comprendre et progresser.'],
        ['Accès direct au coach','Alexis répond à tes questions directement dans l\'application.'],
      ].map(([t,d]) => `
      <div style="display:flex;gap:9px;align-items:flex-start">
        <div style="width:4px;height:4px;border-radius:50%;background:linear-gradient(135deg,#8B2FC9,#E8237A);flex-shrink:0;margin-top:5px"></div>
        <div style="font-size:9pt"><strong>${t} —</strong> <span style="color:rgba(255,255,255,.52)">${d}</span></div>
      </div>`).join('')}
    </div>
    <div style="background:linear-gradient(135deg,#8B2FC9,#E8237A);border-radius:8px;padding:11px;text-align:center">
      <div style="font-size:11pt;font-weight:800;color:white">14 jours d'essai gratuit — sans engagement</div>
      <div style="font-size:8.5pt;color:rgba(255,255,255,.8);margin-top:2px">Rejoins les athlètes qui progressent chaque semaine avec un plan personnalisé.</div>
    </div>
  </div>
  <div style="text-align:center">
    <div class="grad" style="font-size:11pt;font-weight:800">theultimateacademy.fr</div>
  </div>
  <div class="pnum">14</div>
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
