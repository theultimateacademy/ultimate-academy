const express    = require('express');
const Anthropic  = require('@anthropic-ai/sdk');
const { createClient } = require('@supabase/supabase-js');

const router   = express.Router();
const client   = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// ─── Helpers ────────────────────────────────────────────────────────────────

// Plans always start on a Monday. If created on Thu May 28, week 1 begins Mon Jun 1.
function getPlanStartMonday(dateStr) {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay(); // 0=Sun 1=Mon … 6=Sat
  if (dow !== 1) {
    const toMonday = dow === 0 ? 1 : 8 - dow;
    d.setDate(d.getDate() + toMonday);
  }
  return d;
}

function getPlanWeeksElapsed(plan) {
  const monday = getPlanStartMonday(plan.activated_at || plan.created_at);
  const today  = new Date(); today.setHours(0, 0, 0, 0);
  const ms     = today.getTime() - monday.getTime();
  if (ms < 0) return 1; // plan not started yet — operate on week 1
  return Math.floor(ms / (7 * 24 * 3600 * 1000)) + 1;
}

const LEVEL_VMA    = { debutant: 10, intermediaire: 14, confirme: 17, expert: 20 };
const TAPER_WEEKS  = { '5km': 1, '10km': 1, 'semi': 2, 'marathon': 2 };

function calcPace(vma, pct) {
  const speed   = vma * pct;
  const paceMin = 60 / speed;
  const m = Math.floor(paceMin);
  const s = Math.round((paceMin - m) * 60);
  return `${m}'${s.toString().padStart(2, '0')}`;
}

function buildPaceTable(vma) {
  return [
    `  60% → ${calcPace(vma, 0.60)}/km`,
    `  65% → ${calcPace(vma, 0.65)}/km`,
    `  70% → ${calcPace(vma, 0.70)}/km`,
    `  75% → ${calcPace(vma, 0.75)}/km`,
    `  80% → ${calcPace(vma, 0.80)}/km`,
    `  85% → ${calcPace(vma, 0.85)}/km`,
    `  90% → ${calcPace(vma, 0.90)}/km`,
    `  95% → ${calcPace(vma, 0.95)}/km`,
    ` 100% → ${calcPace(vma, 1.00)}/km`,
    ` 105% → ${calcPace(vma, 1.05)}/km`,
  ].join('\n');
}

function resolveVma(profile) {
  return (profile.vma_known && profile.vma)
    ? parseFloat(profile.vma)
    : LEVEL_VMA[profile.level] || 14;
}

function computeWeeksUntilRace(raceDate) {
  if (!raceDate) return null;
  const ms = new Date(raceDate).getTime() - Date.now();
  return Math.ceil(ms / (7 * 24 * 3600 * 1000));
}

function computeMonthStructure(objective, weeksUntilRace) {
  const taper = TAPER_WEEKS[objective] || 1;

  if (weeksUntilRace === null || weeksUntilRace > 4) {
    return {
      label: 'mois intermédiaire (pas d\'affûtage)',
      semaines: [
        { numero: 1, phase: 'Base aérobie',  charge: 'Légère'  },
        { numero: 2, phase: 'Développement', charge: 'Modérée' },
        { numero: 3, phase: 'Développement', charge: 'Élevée'  },
        { numero: 4, phase: 'Développement', charge: 'Modérée' },
      ]
    };
  }

  if (taper === 1) {
    return {
      label: 'dernier mois avant course — affûtage 1 semaine',
      semaines: [
        { numero: 1, phase: 'Développement', charge: 'Modérée' },
        { numero: 2, phase: 'Spécifique',    charge: 'Élevée'  },
        { numero: 3, phase: 'Spécifique',    charge: 'Modérée' },
        { numero: 4, phase: 'Affûtage',      charge: 'Légère'  },
      ]
    };
  }

  return {
    label: 'dernier mois avant course — affûtage 2 semaines',
    semaines: [
      { numero: 1, phase: 'Spécifique',     charge: 'Élevée'      },
      { numero: 2, phase: 'Pré-affûtage',   charge: 'Modérée'     },
      { numero: 3, phase: 'Affûtage',       charge: 'Légère'      },
      { numero: 4, phase: 'Affûtage final', charge: 'Très légère' },
    ]
  };
}

function parseChronoToSeconds(str) {
  if (!str) return null;
  const s = str.toLowerCase().trim();
  const hm = s.match(/(\d+)\s*h\s*(\d*)/);
  if (hm) return (parseInt(hm[1]) * 60 + parseInt(hm[2] || '0')) * 60;
  const min = s.match(/(\d+)\s*(?:min|'|mn)/);
  if (min) return parseInt(min[1]) * 60;
  const colon = s.match(/^(\d+):(\d{2})(?::(\d{2}))?/);
  if (colon) {
    if (colon[3]) return parseInt(colon[1]) * 3600 + parseInt(colon[2]) * 60 + parseInt(colon[3]);
    return parseInt(colon[1]) * 60 + parseInt(colon[2]);
  }
  return null;
}

const RACE_DISTANCES = { '5km': 5, '10km': 10, 'semi': 21.097, 'marathon': 42.195 };

// Returns YYYY-MM-DD for the current date in Paris timezone (handles UTC offset automatically)
function getParisLocalDate() {
  const parts = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris',
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date());
  const year  = parts.find(p => p.type === 'year').value;
  const month = parts.find(p => p.type === 'month').value;
  const day   = parts.find(p => p.type === 'day').value;
  return `${year}-${month}-${day}`;
}

function calcTargetPace(chronoGoal, objective) {
  if (!chronoGoal) return null;
  const totalSec = parseChronoToSeconds(chronoGoal);
  if (!totalSec) return null;
  const dist = RACE_DISTANCES[objective];
  if (!dist) return null;
  const secPerKm = totalSec / dist;
  const min = Math.floor(secPerKm / 60);
  const sec = Math.floor(secPerKm % 60);
  return `${min}'${String(sec).padStart(2, '0')}/km`;
}

function buildPaceSection(vma, objective, chronoGoal) {
  const targetPaceLine = chronoGoal
    ? `\n  Allure objectif exacte (${chronoGoal}) : ${calcTargetPace(chronoGoal, objective) || 'non calculable — vérifier le format'}/km → UTILISE CETTE VALEUR pour les blocs spécifiques allure course`
    : `\n  Allure objectif ${objective} (≈92% VMA estimation) : ${calcPace(vma, 0.92)}/km`;

  return `TABLEAU D'ALLURES PRÉ-CALCULÉES — VMA ${vma} km/h
Utilise UNIQUEMENT ces valeurs dans ton JSON. Ne recalcule rien.
${buildPaceTable(vma)}

Zones de référence :
  Récupération active (60-65%) : ${calcPace(vma, 0.60)}/km – ${calcPace(vma, 0.65)}/km
  Endurance fondamentale (65-72%) : ${calcPace(vma, 0.65)}/km – ${calcPace(vma, 0.72)}/km
  Sortie longue EF pure (65-72%) : ${calcPace(vma, 0.65)}/km – ${calcPace(vma, 0.72)}/km (semaines impaires S1, S3)
  Sortie longue EF + blocs tempo (75-80%) : ${calcPace(vma, 0.75)}/km – ${calcPace(vma, 0.80)}/km (semaines paires S2, S4)
  Tempo / Seuil (82-88%) : ${calcPace(vma, 0.82)}/km – ${calcPace(vma, 0.88)}/km
  Fractionné long 2000m : ${calcPace(vma, 0.85)}/km (85% VMA — VALEUR FIXE, AUCUNE EXCEPTION)
  Fractionné long 1000m (83-90%) : ${calcPace(vma, 0.83)}/km – ${calcPace(vma, 0.90)}/km
  Fractionné long 3000m+ (83-85%) : ${calcPace(vma, 0.83)}/km – ${calcPace(vma, 0.85)}/km
  Fractionné court (95-105%) : ${calcPace(vma, 0.95)}/km – ${calcPace(vma, 1.05)}/km${targetPaceLine}`;
}

// ─── Recalculate distances from pace + duration ───────────────────────────────

function recalculateDistances(planData, vma) {
  if (!planData?.semaines) return planData;
  for (const sem of planData.semaines) {
    for (const s of (sem.seances || [])) {
      if (s.est_course || !s.duree_min) continue;
      const type = (s.type || '').toLowerCase();
      if (type.includes('renforcement') || type.includes('repos')) {
        s.distance_km = 0;
        continue;
      }
      // Average speed from allures[] zones when available
      const validAllures = (s.allures || []).filter(a => typeof a.vitesse_kmh === 'number' && a.vitesse_kmh > 0);
      let avgSpeed;
      if (validAllures.length > 0) {
        avgSpeed = validAllures.reduce((sum, a) => sum + a.vitesse_kmh, 0) / validAllures.length;
        // Fractionnés have rest periods — reduce effective speed
        if (type.includes('fractionné') || type.includes('vma')) avgSpeed *= 0.85;
      } else {
        // Fallback: type-based % of VMA
        const pct = (type.includes('tempo') || type.includes('seuil')) ? 0.73
          : (type.includes('fractionné') || type.includes('vma'))     ? 0.70
          : (type.includes('côte') || type.includes('cote'))          ? 0.68
          : 0.67; // EF, SL, footing progressif
        avgSpeed = vma * pct;
      }
      s.distance_km = Math.round((s.duree_min / 60) * avgSpeed * 10) / 10;
    }
    // Recalculate weekly volume
    sem.volume_total_km = Math.round(
      (sem.seances || []).reduce((sum, s) => sum + (s.distance_km || 0), 0) * 10
    ) / 10;
  }
  return planData;
}

// ─── Inject race events as special sessions ──────────────────────────────────

function injectRaceSessions(planData, profile) {
  const semaines = planData?.semaines;
  if (!semaines?.length) return planData;

  const DAY_NAMES = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];

  function injectOne(raceDate, type, name, encouragement) {
    if (!raceDate) return;
    const raceDateStr = raceDate.substring(0, 10);
    for (const semaine of semaines) {
      const debut = semaine.dates?.debut;
      const fin   = semaine.dates?.fin;
      if (!debut || !fin) continue;
      if (raceDateStr >= debut && raceDateStr <= fin) {
        if (!semaine.seances) semaine.seances = [];
        const targetId = type === 'Course intermédiaire' ? 'RACE_INT' : 'RACE';
        const existingIdx = semaine.seances.findIndex(s =>
          s.date === raceDateStr && (
            s.id_seance === 'RACE' || s.id_seance === 'RACE_INT' ||
            s.est_course === true ||
            (s.type && (s.type.toLowerCase().includes('course') || s.type.toLowerCase() === 'race'))
          )
        );
        if (existingIdx >= 0) {
          // Normalize Claude-generated race session to canonical format
          const s = semaine.seances[existingIdx];
          s.id_seance    = targetId;
          s.type         = type;
          s.titre        = `🏁 ${name}`;
          s.est_course   = true;
          s.est_seance_cle = true;
          s.corps        = s.corps || s.conseil_seance || s.description_complete?.corps || encouragement;
          s.notes_coach  = s.notes_coach || "Fais confiance à tout ce qu'on a travaillé ensemble. Gère bien ton départ, cours ta course — tu es prêt(e) 💪";
          s.rpe_cible    = null;
          s.allures      = s.allures || [];
          delete s.nom;
          delete s.conseil_seance;
          delete s.description_complete;
        } else {
          const jour = DAY_NAMES[new Date(raceDateStr + 'T12:00:00').getDay()];
          semaine.seances.push({
            jour,
            date:          raceDateStr,
            id_seance:     targetId,
            type,
            titre:         `🏁 ${name}`,
            duree_min:     0,
            distance_km:   null,
            intensite:     'course',
            echauffement:  null,
            corps:         encouragement,
            retour_au_calme: null,
            allures:       [],
            notes_coach:   "Fais confiance à tout ce qu'on a travaillé ensemble. Gère bien ton départ, cours ta course — tu es prêt(e) 💪",
            rpe_cible:     null,
            est_seance_cle: true,
            est_course:    true,
          });
          semaine.seances.sort((a, b) => {
            if (a.date && b.date) return a.date.localeCompare(b.date);
            return 0;
          });
        }
        break;
      }
    }
  }

  if (profile.race_date) {
    const name = profile.objective === 'marathon' ? 'Marathon' :
                 profile.objective === 'semi'     ? 'Semi-marathon' :
                 profile.objective === '10km'     ? '10 km' :
                 profile.objective === '5km'      ? '5 km' :
                 (profile.objective || '').replace('_',' ');
    injectOne(
      profile.race_date, 'Course', `Jour J — ${name}`,
      `C'est le grand jour ${profile.first_name} ! Tout ce travail, c'est pour aujourd'hui. Tu peux y aller la tête haute 🏆`
    );
  }
  if (profile.intermediate_race_date && profile.intermediate_race_name) {
    injectOne(
      profile.intermediate_race_date, 'Course intermédiaire', profile.intermediate_race_name,
      `Course intermédiaire aujourd'hui — ${profile.intermediate_race_name} ! Utilise ça comme repère, gère ton effort, et profite de l'ambiance 🎽`
    );
  }
  return planData;
}

// ─── Load session library from DB ─────────────────────────────────────────────

async function loadSessionLibrary() {
  const { data, error } = await supabase
    .from('session_library')
    .select('code, category, name, duration_min, intensity_rpe, warmup, main_set, recovery, cooldown, coach_notes, compatible_goals')
    .order('code');

  if (error || !data?.length) {
    console.warn('[session_library] Error or empty:', error?.message);
    return '(bibliothèque vide — vérifier la table session_library)';
  }

  return data.map(s => {
    const goals = (s.compatible_goals || []).join(', ');
    const E  = s.warmup   ? `\n  É: ${s.warmup}`   : '';
    const R  = s.recovery ? `\n  R: ${s.recovery}`  : '';
    const RC = s.cooldown ? `\n  RC: ${s.cooldown}` : '';
    return `[${s.code}] ${s.name} | ${s.duration_min}min | RPE${s.intensity_rpe}/10 | ${goals}${E}\n  C: ${s.main_set}${R}${RC}\n  📝 ${s.coach_notes}`;
  }).join('\n\n');
}

// ─── System prompt (rules) ────────────────────────────────────────────────────

const PLAN_RULES = `Tu es le moteur de génération de plans d'entraînement running de The Ultimate Academy.
Tu génères des plans ultra-personnalisés pour le coach Alexis. Tu NE communiques JAMAIS avec l'athlète.
Tu retournes UNIQUEMENT du JSON valide, sans aucun texte autour, sans markdown, sans explication.

═══════════════════════════════════════
RÈGLES FONDAMENTALES — NON NÉGOCIABLES
═══════════════════════════════════════

RÈGLE 1 — RATIO 80/20
80% des séances en zone facile :
- Endurance fondamentale (65-75% VMA)
- Récupération active (60-65% VMA)
- Sortie longue allure confortable (65-72% VMA)
20% des séances en intensité :
- Fractionné court (95-120% VMA)
- Fractionné long (80-90% VMA)
- Tempo / Seuil (82-88% VMA)
- Côtes (RPE 7-9/10)
- Séances spécifiques allure objectif
JAMAIS deux séances dures consécutives.
JAMAIS augmenter volume ET intensité la même semaine.
TOUJOURS une séance de récupération après une séance dure.

RÈGLE 2 — ÉCHAUFFEMENT ET RETOUR AU CALME
OBLIGATOIRE sur TOUTES les séances course :
Échauffement MINIMUM 25 minutes : footing progressif. Sur séances dures (fractionné, tempo, côtes) : terminer par quelques accélérations progressives et la routine des gammes athlétiques.
Retour au calme MINIMUM 10 minutes : footing très lent à 60-63% VMA.

RÈGLE 3 — PROGRESSION DU VOLUME
Augmentation maximum 10% par semaine.
Si RPE moyen > 7.5 deux semaines de suite → déclencher décharge immédiate.

RÈGLE 4 — SEMAINES DE DÉCHARGE
JAMAIS de décharge automatique. La décharge est déclenchée UNIQUEMENT si l'athlète signale explicitement de la fatigue :
- RPE moyen > 7.5 sur la semaine écoulée
- Fatigue ou douleurs signalées par l'athlète
- 2 séances manquées consécutives
- Alerte cycle féminin
En l'absence de ces signaux, pas de décharge — maintenir la progression.
Niveau décharge : réduire volume 30-40%, max 1 séance intensité légère.

RÈGLE 5 — AFFÛTAGE (RÉDUCTION VOLUME ET INTENSITÉ)
Marathon : 2 semaines. Semi-marathon : 10 jours à 2 semaines. 10km : 1 semaine. 5km : 1 semaine.
RÉDUIRE à la fois le volume ET l'intensité — les deux ensemble, jamais l'un sans l'autre :
• Volume : -40% semaine pré-affûtage (S-2), -60% semaine d'affûtage final (S-1)
• AUCUNE sortie longue pendant l'affûtage — max 40 min EF
• AUCUN seuil long / tempo long — au maximum 1 bloc très court à allure objectif (2×1000m ou 3×1000m légers, pas plus)
• Travail uniquement : footings EF 30-40 min, quelques strides, 1 séance courte allure course à très faible volume
• Dernière séance dure minimum J-10 avant la course
VEILLE DE COURSE (J-1) : séance d'activation OBLIGATOIRE = EXACTEMENT 20-25 min de footing très léger + 6 lignes droites 80m progressives + gammes athlétiques. JAMAIS 50 min la veille. JAMAIS de vraie séance. Code : EF-01 ou créer une séance d'activation spécifique si disponible dans la bibliothèque.

RÈGLE 6 — VARIÉTÉ DES SÉANCES (RÈGLE ABSOLUE — AUCUNE EXCEPTION)
INTERDIT de répéter le même id_seance PLUS D'UNE FOIS sur l'ensemble des 4 semaines du plan.
Chaque id_seance doit être UNIQUE sur les 4 semaines : si FL-03 est utilisé semaine 1, il est INTERDIT de l'utiliser en semaine 2, 3 ou 4.
Varier obligatoirement : si un type de séance (ex: fractionné 1000m) apparaît plusieurs fois, utiliser des codes DIFFÉRENTS (FL-01 + FL-03, jamais FL-01 + FL-01).
La bibliothèque contient suffisamment de codes pour garantir 4 semaines sans aucun doublon.
Avant de soumettre : liste mentalement tous les id_seance utilisés et vérifie qu'il n'y a aucun doublon sur l'ensemble du plan.
NOTE INTER-PLAN : un même id_seance PEUT être réutilisé dans un nouveau plan (mois suivant), à intervalle d'environ 1 mois, pour mesurer la progression — mais jamais de façon systématique.

RÈGLE 7 — RÉCUPÉRATION VARIÉE
Varier systématiquement les temps et modes de récupération selon la séance :
- Fractionné très court (200m) : 45'' à 1'00 en marchant
- Fractionné court (300-400m) : 1'00 à 1'30 en marchant
- Fractionné moyen (500-1000m) : 1'30 à 2'30 selon marche ou trot lent
- Fractionné long (2000-3000m) : 3'00 à 4'00 en trottinant lent
- Côtes : descente en marchant doucement
- Entre séries/blocs : toujours footing lent
Ne jamais utiliser le même temps de récup deux semaines de suite pour la même séance.

RÈGLE 8 — AUTO-VALIDATION (OBLIGATOIRE AVANT SOUMISSION)
Vérifier et renseigner le champ auto_validation :
✓ ratio_80_20_respecte : max 20% séances dures
✓ pas_seances_dures_consecutives : jamais 2 séances dures de suite
✓ progression_volume_ok : hausse max 10%
✓ echauffement_min_25min : toutes séances course
✓ retour_calme_min_10min : toutes séances course
✓ variete_seances_ok : pas le même id_seance deux fois dans l'ensemble du plan de 4 semaines — chaque code est unique
✓ recuperations_variees : temps de récup variés
✓ allures_toujours_specifiques : aucune description vague d'allure
✓ regles_toutes_respectees : toutes les règles ci-dessus
Si une règle n'est pas respectée → corriger avant soumission et documenter dans corrections_apportees.

RÈGLE 9 — ALLURES SPÉCIFIQUES OBLIGATOIRES
TOUJOURS calculer et afficher des allures précises en min/km et km/h pour chaque phase de chaque séance.
JAMAIS de formulations vagues du type : "allure très progressive", "allure confortable", "allure facile", "allure modérée".
CHAQUE phase de la séance (échauffement, corps, retour au calme) doit avoir sa valeur exacte calculée depuis la VMA.
Dans le champ "corps" et "echauffement", toujours écrire : "X'XX/km (Y% VMA)" après chaque allure mentionnée.
Le tableau allures[] doit contenir TOUTES les zones distinctes de la séance.

RÈGLE 10 — FRACTIONNÉ LONG : VOLUME PAR NIVEAU
Ne jamais proposer les mêmes volumes pour tous les niveaux. Respecter l'échelle :
DÉBUTANTS : commencer à 3x1000m, progresser jusqu'à 5x1000m maximum. Préférer 3x2000m, 4x2000m pour le semi.
INTERMÉDIAIRES : 4x1000m → 5x1000m. Pour semi-marathon : préférer 4x2000m, 5x2000m plutôt que 5x1000m.
CONFIRMÉS : commencer un cycle à 6x1000m, finir à 8x1000m. Semi : 4x2000m → 5x2000m → 3x3000m.
EXPERTS / TRÈS BONS : jusqu'à 10x1000m, 5x2000m, 3x3000m, 2x5000m pour marathon.
Pour le semi-marathon, TOUJOURS préférer des répétitions de 2000m+ plutôt que 1000m : un 4x2000m est plus spécifique qu'un 5x1000m.
Pour le marathon, proposer des séances avec du très long : 3x3000m, 2x5000m, 3000/5000/3000 progressif.

RÈGLE 11 — SÉANCES DE RÉCUPÉRATION (EF-04 ET RA) — USAGE EXCEPTIONNEL UNIQUEMENT

EF-04 (footing récupération) :
Même règle que RA ci-dessous — jamais par défaut, uniquement sur signal de fatigue.

RA (récupération active — RA-01, RA-02, etc.) :
NE JAMAIS planifier une séance RA par défaut dans un plan.
Une séance RA n'est utilisée QUE SI le contexte mentionne explicitement :
  - RPE moyen semaine précédente > 7.5
  - OU athlète signale fatigue dans ses retours
  - OU 2 séances manquées la semaine précédente
Fréquence maximale : 1 séance RA toutes les 4-5 semaines. JAMAIS deux fois dans un plan de 4 semaines.
La séance RA REMPLACE une séance EF prévue — elle ne s'ajoute JAMAIS en supplément.
La séance RA COMPTE dans le total des séances de course (days_per_week).
Si aucun signal de fatigue n'est fourni dans le contexte : NE PAS utiliser RA ni EF-04.

RÈGLE 12 — PALETTE DE SÉANCES OBLIGATOIRE (VARIÉTÉ ET PROGRESSIVITÉ)
Sur un plan de 4 semaines, proposer impérativement une palette variée parmi :
• VMA courte (100-200m, 95-110% VMA) et/ou longue (1000-2000m, 85-90% VMA)
• Seuil / Tempo en blocs continus (20-40 min à 82-88% VMA)
• Allure spécifique course uniquement si l'objectif chrono est RÉALISTE pour le niveau et la VMA — ne pas forcer si hors-portée
• Côtes (montées RPE 7-9, pas d'allure fixe)
• Sorties longues EF avec alternance (EF pure S1/S3, EF + blocs tempo S2/S4)
• Footings progressifs VRAIS : 3 phases décrites explicitement — phase 1 (65-68% VMA), phase 2 (72-75%), phase 3 (80-85% = seuil)
• Footings EF simples (65-72% VMA) pour compléter le volume
POUR 3 SÉANCES/SEMAINE : rendre l'entraînement ludique et complet — footing EF ou progressif + séance intensive (VMA semaines impaires, seuil semaines paires) + sortie longue. Ne jamais répéter le même type deux semaines de suite.

RÈGLE 13 — TERRAIN D'ENTRAÎNEMENT (trail uniquement)
Si training_terrain est fourni dans le profil :
• montagne : côtes longues 200-400m à effort RPE 8-9, descentes techniques travaillées, sorties avec dénivelé positif cumulé, privilégier FL côtes et séances force montée
• semi_montagne : mix côtes courtes 100-200m + sorties partiellement plat/pente, 1 séance avec D+ sur 2 semaines
• ville_plat : escaliers répétés (cage d'escalier ou parking), marche nordique en côte, tapis incliné si disponible — mentionner ces alternatives dans le corps et notes_coach ; garder fractionnés sur piste/route
Exception terrain Ultra Marin (Réunion) : course essentiellement sur route, pas besoin de D+ — préparer comme un marathon haute distance (volume, seuil, allure)

RÈGLE 14 — COURSE INTERMÉDIAIRE (mini-affûtage dans la semaine de la course)
Si intermediate_race_date est fourni dans le profil et tombe dans la fenêtre du plan :
• Identifier la semaine OÙ SE SITUE la course intermédiaire (pas la semaine d'avant)
• Cette semaine = mini-affûtage ET course : volume réduit 40-50%, aucune séance dure, 1 footing EF léger maximum (25-30 min), repos les 2 jours précédant la course, course le jour J
• La semaine AVANT la course intermédiaire = semaine de développement normale — PAS d'affûtage, PAS de réduction de charge
• INTERDIT de placer une sortie longue ou une séance dure dans la semaine de la course intermédiaire
• Charge de la semaine de la course = "Légère (mini-affûtage course intermédiaire)"
• Mentionner la course intermédiaire dans le message_du_mois

RÈGLE 15 — REPOS POST-COURSE ET TRANSITION
Après une course PRINCIPALE (pas intermédiaire) dont la date est inférieure à 3 semaines avant le début du plan :
• 5km / 10km : S+1 = récupération légère uniquement (EF 20-30 min, 1-2 footings max, aucune intensité)
• Semi-marathon : S+1 = repos actif (EF court 20-30 min), S+2 = reprise très progressive
• Marathon : S+1 à S+2 = repos complet ou footing 20 min max, aucune intensité avant la S+3
• Ultra-trail 50k+ : S+1 à S+3 = repos presque complet, reprise très légère uniquement
Détecter automatiquement : si race_date < aujourd'hui et < 3 semaines → appliquer RÈGLE 15 sur la S1 du nouveau plan.

RÈGLE 16 — PRÉPARATION SPÉCIFIQUE ENTRE DEUX COURSES
Pour préparer une nouvelle course, durée de préparation recommandée selon l'objectif :
• 5km / 10km : 8-10 semaines de prépa spécifique
• Semi-marathon : 10-12 semaines
• Marathon : 14-16 semaines
• Ultra-trail : 16-20 semaines
L'objectif est de maintenir une base solide entre les cycles, sans jamais repartir de zéro. La phase "inter-cycle" travaille VMA + volume de base + renfo.

═══════════════════════════════════════
CALCUL DES ALLURES — RÈGLES ABSOLUES
═══════════════════════════════════════

Formule unique : Allure (min/km) = 60 / (VMA × pourcentage / 100)
Afficher toujours : min/km ET km/h ET % VMA.

OBLIGATION ABSOLUE : Utilise EXCLUSIVEMENT le tableau d'allures pré-calculé fourni dans le prompt.
Ne recalcule JAMAIS une allure de tête. Ne l'estime JAMAIS.
Chaque valeur allure_min_km de ton JSON doit correspondre exactement à une valeur du tableau fourni.

Exemple de vérification pour VMA 17 km/h :
  65% → 60 / (17 × 0.65) = 60 / 11.05 = 5'26/km ✓
  70% → 60 / (17 × 0.70) = 60 / 11.9  = 5'03/km ✓
  80% → 60 / (17 × 0.80) = 60 / 13.6  = 4'25/km ✓
  90% → 60 / (17 × 0.90) = 60 / 15.3  = 3'55/km ✓
 100% → 60 / 17           = 60 / 17    = 3'32/km ✓

Pourcentages par type de séance :
Récupération active : 60-63% VMA
Endurance fondamentale : 65-72% VMA
Footing progressif phase 1 : 65-68% VMA
Footing progressif phase 2 : 72-75% VMA
Footing progressif phase 3 : 80-85% VMA (tempo final)
Sortie longue : 65-75% VMA
Allure tempo dans SL : 75-80% VMA
Tempo / Seuil : 82-88% VMA
Fractionné long 2000m : 85% VMA — VALEUR FIXE ABSOLUE, JAMAIS 80%, JAMAIS 83%
Fractionné long 3000m+ : 83-85% VMA
Fractionné long 1000m : 83-90% VMA
Fractionné moyen 500m : 90-97% VMA
Fractionné court 400m : 95-100% VMA
Fractionné court 300m : 97-105% VMA
Fractionné très court 200m : 100-110% VMA
VMA courte 100-150m : 105-115% VMA
Sprint / 100-150m : 110-120% VMA
Côtes : RPE 7-9/10 (pas d'allure fixe)

ALLURE OBJECTIF DEPUIS CHRONO CIBLE
Si l'athlète a un objectif chrono, l'allure objectif est calculée ainsi :
  Allure objectif (sec/km) = temps total en secondes / distance en km
  Distances : 5km = 5 km | 10km = 10 km | Semi = 21.097 km | Marathon = 42.195 km
  Exemple : semi 1h25 → 5100 sec / 21.097 km = 241.7 sec/km = 4'01/km (et NON 4'55/km)
  Exemple : 10km 45min → 2700 sec / 10 km = 270 sec/km = 4'30/km
  Exemple : marathon 3h30 → 12600 sec / 42.195 km = 298.6 sec/km = 4'58/km
L'allure objectif exacte est fournie dans le prompt. Utilise-la telle quelle sans la recalculer.

═══════════════════════════════════════
BIBLIOTHÈQUE DES SÉANCES — SOURCE UNIQUE
═══════════════════════════════════════

RÈGLE ABSOLUE — JOURS PAR SEMAINE
days_per_week = nombre EXACT de séances COURSE À PIED. Ni plus, ni moins.
Si days_per_week = 5 → EXACTEMENT 5 séances course par semaine complète. Pas 6, pas 4.
Toujours ajouter 1 séance RENFO EN PLUS des séances de course, dans chaque semaine complète.
Ne jamais compter la séance RENFO dans le total des séances de course.
Exemple : days_per_week = 3 → 3 séances course + 1 RENFO = 4 séances au total dans la semaine.

RÈGLE ABSOLUE : Tu dois OBLIGATOIREMENT choisir toutes les séances dans la bibliothèque ci-dessous.
Il est INTERDIT d'inventer un code ou une séance absente de cette liste.
Si la séance idéale n'existe pas, choisis le code le plus proche disponible dans la bibliothèque.
Utilise le code exact de chaque séance dans le champ id_seance (ex: FL-04, T-03, EF-01, RENFO-02).
Les codes RENFO-01 à RENFO-05 correspondent aux séances de renforcement disponibles dans l'application.

%LIBRARY_PLACEHOLDER%

═══════════════════════════════════════
PÉRIODISATION
═══════════════════════════════════════

COURSE < 12 semaines : Prépa spécifique directe.
COURSE 12-20 semaines : Construction puis prépa spécifique.
COURSE > 20 semaines : Phase 1 Base (S1-8) : endurance + VMA courte + renfo. Phase 2 Développement : volume + VMA longue + tempo. Proposer course intermédiaire.

MARATHON : Minimum 12 semaines, idéal 16. Sorties longues progressives. Séances longues clés : FL-07, FL-13, FL-14. Terminer par SL-05 avec blocs allure marathon.

ADAPTATION CYCLE FÉMININ : Si alerte règles activée → remplacer séances dures par récup active ou repos. Reprendre progressivement.

═══════════════════════════════════════
FORMAT JSON — RETOURNER UNIQUEMENT CE JSON
═══════════════════════════════════════

{
  "message_du_mois": "Message chaleureux Alexis pour ce mois",
  "phase_actuelle": "Base | Développement | Spécifique | Affûtage | Décharge",
  "semaines_avant_course": 0,
  "course_intermediaire_conseil": null,
  "auto_validation": {
    "ratio_80_20_respecte": true,
    "pas_seances_dures_consecutives": true,
    "progression_volume_ok": true,
    "echauffement_min_25min": true,
    "retour_calme_min_10min": true,
    "variete_seances_ok": true,
    "recuperations_variees": true,
    "regles_toutes_respectees": true,
    "corrections_apportees": null
  },
  "semaines": [
    {
      "numero": 1,
      "dates": {
        "debut": "2026-05-12",
        "fin": "2026-05-18",
        "label": "Semaine du 12 au 18 mai 2026"
      },
      "phase": "Base aérobie",
      "charge": "Légère | Modérée | Élevée | Décharge",
      "est_decharge": false,
      "est_affutage": false,
      "volume_total_km": 35,
      "temps_total_min": 180,
      "ratio_intensite_percent": 20,
      "seances": [
        {
          "jour": "Mardi",
          "date": "2026-05-13",
          "id_seance": "FC-01",
          "est_repetition": false,
          "date_premiere_realisation": null,
          "type": "Fractionné court",
          "titre": "10x400m — Vitesse pure",
          "duree_min": 60,
          "distance_km": 12,
          "intensite": "dur",
          "echauffement": "25 min progressif à X'XX/km (65% VMA), terminer par 4 lignes droites 80m en accélération progressive",
          "corps": "10x400m à X'XX/km (95-100% VMA). Récup : 1'00 en marchant entre chaque répétition.",
          "retour_au_calme": "10 min à X'XX/km (60-63% VMA), footing très lent",
          "allures": [
            {
              "zone": "Échauffement",
              "pourcentage_vma": 65,
              "vitesse_kmh": 9.75,
              "allure_min_km": "6'09/km"
            },
            {
              "zone": "Corps — 400m",
              "pourcentage_vma": 97,
              "vitesse_kmh": 14.55,
              "allure_min_km": "4'07/km"
            },
            {
              "zone": "Retour au calme",
              "pourcentage_vma": 62,
              "vitesse_kmh": 9.3,
              "allure_min_km": "6'27/km"
            }
          ],
          "recuperation": {
            "type": "marche",
            "duree_secondes": 60,
            "description": "1'00 en marchant entre chaque répétition"
          },
          "notes_coach": "Conseil précis et chaleureux signé Alexis",
          "rpe_cible": 8,
          "est_seance_cle": true
        }
      ]
    }
  ]
}`;

function buildSystemPrompt(libraryText) {
  return PLAN_RULES.replace('%LIBRARY_PLACEHOLDER%', libraryText);
}

// ─── POST /api/plans/generate ────────────────────────────────────────────────

router.post('/plans/generate', async (req, res) => {
  const { userId, profile: clientProfile, clientDate } = req.body;
  if (!userId || !clientProfile) return res.status(400).json({ error: 'Missing data' });

  // Always re-fetch the latest profile from DB so any modifications are taken into account
  const { data: dbProfile } = await supabase.from('profiles').select('*').eq('id', userId).single();
  const profile = { ...clientProfile, ...(dbProfile || {}) };

  const vma              = resolveVma(profile);
  const weeksUntilRace   = computeWeeksUntilRace(profile.race_date);
  const monthStructure   = computeMonthStructure(profile.objective, weeksUntilRace);
  const efMin            = profile.days_per_week >= 5 ? 'minimum 2 EF obligatoires' : 'minimum 1 EF obligatoire';

  const structureDesc = monthStructure.semaines
    .map(s => `  S${s.numero} → phase "${s.phase}", charge "${s.charge}"`)
    .join('\n');

  // ── Calendar logic ──────────────────────────────────────────────────────────
  const localISO = d => {
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const dy = String(d.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${dy}`;
  };

  // Use browser-provided date (local) or compute Paris timezone date (server UTC is unreliable near midnight)
  const todayDateStr = clientDate || getParisLocalDate();
  const today = new Date(todayDateStr + 'T00:00:00');
  today.setHours(0, 0, 0, 0);
  const todayISO      = localISO(today);
  const dayNames      = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const todayDayName  = dayNames[today.getDay()];
  const todayDayNum   = today.getDay(); // 0=Sun, 1=Mon … 6=Sat

  // End of current week (Sunday)
  const daysToSunday  = todayDayNum === 0 ? 0 : 7 - todayDayNum;
  const thisSunday    = new Date(today);
  thisSunday.setDate(today.getDate() + daysToSunday);
  const thisSundayISO = localISO(thisSunday);

  // Next Monday (week 2 start when partial week 1)
  const nextMonday    = new Date(thisSunday);
  nextMonday.setDate(thisSunday.getDate() + 1);
  const nextMondayISO = localISO(nextMonday);

  // Preferred days that still fall from today to Sunday (inclusive)
  const DAY_NUM = { Lundi: 1, Mardi: 2, Mercredi: 3, Jeudi: 4, Vendredi: 5, Samedi: 6, Dimanche: 0 };
  const normDay = d => (DAY_NUM[d] === 0 ? 7 : DAY_NUM[d]); // Sun = 7 for ordering
  const normToday = todayDayNum === 0 ? 7 : todayDayNum;
  const preferredDays       = profile.preferred_days || [];
  const remainingThisWeek   = preferredDays.filter(d => normDay(d) >= normToday);
  const isPartialWeek       = todayDayNum !== 1; // not Monday
  const week1SessionCount   = isPartialWeek ? remainingThisWeek.length : profile.days_per_week;

  // Week 1 start is always today; full weeks (2-4) start from nextMonday
  const planStartISO = todayISO;

  // ── Calendar section for prompt ─────────────────────────────────────────────
  const calendarSection = isPartialWeek
    ? `CALENDRIER — SEMAINE 1 PARTIELLE
Aujourd'hui : ${todayISO} (${todayDayName}).
Semaine 1 = du ${todayISO} au ${thisSundayISO} (fin de semaine en cours).
Jours préférés encore disponibles cette semaine : ${remainingThisWeek.length > 0 ? remainingThisWeek.join(', ') : 'aucun'}.
→ Assigne UNIQUEMENT ${week1SessionCount} séance(s) course en semaine 1 (jours : ${remainingThisWeek.join(', ') || 'aucun'}).
→ Si 0 séance course en semaine 1 : ne mets PAS de RENFO non plus — fais une semaine 1 vide et concentre les 4 semaines complètes à partir du ${nextMondayISO}.
→ Semaines 2, 3, 4 commencent à partir du ${nextMondayISO} avec ${profile.days_per_week} séances course + 1 RENFO chacune.`
    : `CALENDRIER — SEMAINE 1 COMPLÈTE
Aujourd'hui : ${todayISO} (${todayDayName}, lundi).
Le plan commence aujourd'hui, semaine 1 complète.
Semaines 1-4 : ${profile.days_per_week} séances course + 1 RENFO par semaine.`;

  // Intermediate race info
  const hasIntermediateRace = profile.intermediate_race_date && profile.intermediate_race_name;
  const intermediateRaceInfo = hasIntermediateRace
    ? `Course intermédiaire : ${profile.intermediate_race_name} — ${new Date(profile.intermediate_race_date).toLocaleDateString('fr-FR')} (RÈGLE 14 : mini-affûtage dans la semaine de la course elle-même — la semaine AVANT est développement normal)`
    : 'Aucune course intermédiaire prévue dans ce plan';

  const terrainInfo = profile.training_terrain
    ? `Terrain d'entraînement : ${profile.training_terrain === 'montagne' ? 'Montagne (D+/descentes disponibles — RÈGLE 13)' : profile.training_terrain === 'semi_montagne' ? 'Semi-montagne (mix plat et pente — RÈGLE 13)' : 'Ville/Plat (escaliers, tapis incliné — RÈGLE 13)'}`
    : '';

  const userPrompt = `Génère un plan d'entraînement running de EXACTEMENT 4 SEMAINES pour :

Prénom : ${profile.first_name}
Objectif course : ${profile.objective}
Date de course : ${profile.race_date ? new Date(profile.race_date).toLocaleDateString('fr-FR') : 'Non définie'}
Semaines avant la course : ${weeksUntilRace !== null ? weeksUntilRace : 'N/A'}
Contexte du mois : ${monthStructure.label}
Niveau : ${profile.level}
VMA : ${vma} km/h ${profile.vma_known ? '(mesurée)' : '(estimée)'}
Objectif chrono : ${profile.chrono_goal_known ? profile.chrono_goal : 'Progresser'}
Séances course/semaine : ${profile.days_per_week} → ${efMin} par semaine (semaines complètes)
Jours préférés : ${preferredDays.join(', ') || 'Non précisé'}
Meilleur chrono récent : ${profile.best_recent_time || 'Non renseigné'}
Blessures / douleurs : ${profile.injuries || 'Aucune'}
Forme actuelle : ${profile.current_form || 'Non renseignée'}
Message coach : ${profile.coach_message || 'Aucun'}
${intermediateRaceInfo}
${terrainInfo}

${calendarSection}

Calcule les dates exactes de chaque séance à partir du calendrier ci-dessus.
Assigne chaque séance à un des jours préférés de l'athlète disponibles dans la semaine concernée.

${buildPaceSection(vma, profile.objective, profile.chrono_goal_known ? profile.chrono_goal : null)}

STRUCTURE IMPOSÉE (respecte exactement) :
${structureDesc}

CONTRAINTES ABSOLUES — vérifie et documente dans auto_validation avant de soumettre :
1. EXACTEMENT 4 semaines avec les phases et charges ci-dessus
2. Semaine 1 : ${week1SessionCount} séances course${week1SessionCount > 0 ? ' + 1 RENFO' : ' (partielle — adapter si peu de jours restants)'}. Semaines 2-4 : EXACTEMENT ${profile.days_per_week} séances course + 1 RENFO — ni plus, ni moins. Les séances RA (récupération active) comptent dans ce total.
3. ${efMin} dans chaque semaine complète (Sortie longue compte comme EF — utilise EF-01/EF-02/EF-03, JAMAIS EF-04 par défaut). Varier les durées EF : alterner une session longue (65-80 min) et une session courte (40-50 min) pour reposer le système nerveux.
4. Ratio 80/20 respecté : max 20% de séances dures (fractionné, tempo, côtes, spécifique)
5. Jamais deux séances dures consécutives
6. Échauffement MINIMUM 25 min + retour au calme MINIMUM 10 min sur toutes les séances course
7. Toutes les allures recopiées EXACTEMENT depuis le tableau pré-calculé ci-dessus, format M'SS/km — JAMAIS inventées
8. id_seance obligatoire sur TOUTES les séances — uniquement des codes présents dans la bibliothèque fournie
9. Renseigner allures[] : chaque entrée DOIT avoir allure_min_km en tant que STRING au format exact "M'SS/km" (ex: "5'26/km") — JAMAIS un objet, JAMAIS un nombre, JAMAIS une valeur vide. vitesse_kmh (number), pourcentage_vma (number). Valeurs UNIQUEMENT depuis le tableau pré-calculé.
10. Renseigner recuperation{} avec type, duree_secondes et description pour les fractionnés
11. TOUJOURS des allures en min/km et km/h depuis le tableau VMA — JAMAIS de formulations vagues ("allure confortable", "allure facile" sont INTERDITES)
12. Séances RENFO : corps = UNIQUEMENT "Référence-toi à l'onglet Renforcement — effectue la séance '[Nom exact]'" — noms exacts : Gainage & Stabilité / Force & Puissance / Excentrique & Prévention / Explosivité & Vitesse / Mobilité & Récupération
13. RA et EF-04 : INTERDITS par défaut — utiliser UNIQUEMENT si le profil mentionne fatigue, RPE > 7.5 ou blessure. Maximum 1 séance RA ou EF-04 sur tout le plan de 4 semaines. Elles REMPLACENT une séance EF, elles ne s'ajoutent JAMAIS. Elles COMPTENT dans les ${profile.days_per_week} séances course de la semaine.
14. TITRES : le titre doit toujours mentionner la vraie durée (duree_min). Ex : si duree_min=65, écrire "Endurance fondamentale 65 min", pas "45 min".
15. NUTRITION : pour toute séance course ≥ 60 min, ajouter en fin de notes_coach : "🍬 Nutrition : à partir de 45 min, prends un gel, une compote, une pâte de fruit, une purée ou tout ce qui passe bien pour toi — vise 40-50g de glucides par heure."
16. ÉCHAUFFEMENT FRACTIONNÉ : pour toute séance de type fractionné, tempo ou côtes, terminer l'échauffement par la phrase exacte : "Terminer par quelques accélérations progressives et la routine des gammes." — ne pas détailler les exercices dans l'échauffement.
17. ALTERNANCE SORTIES LONGUES : S1 et S3 = sortie longue pure EF (allure constante 65-72% VMA). S2 et S4 = sortie longue EF avec blocs tempo (20-30 min à 75-80% VMA insérés en milieu de sortie). Utiliser les codes EF adaptés de la bibliothèque.
18. FRACTIONNÉ 2000m : OBLIGATOIREMENT à 85% VMA exactement = ${calcPace(vma, 0.85)}/km pour VMA ${vma}. JAMAIS à 80%, JAMAIS à 83%. Aucune exception.${profile.chrono_goal_known && calcTargetPace(profile.chrono_goal, profile.objective) ? `\n19. Allure objectif chrono = ${calcTargetPace(profile.chrono_goal, profile.objective)} (calculée depuis "${profile.chrono_goal}") — utilise cette valeur exacte pour tous les blocs spécifiques allure course` : ''}`;

  try {
    const libraryText = await loadSessionLibrary();
    const message = await client.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 16000,
      system:     buildSystemPrompt(libraryText),
      messages:   [{ role: 'user', content: userPrompt }]
    });

    const rawText  = message.content[0].text.trim();
    const jsonText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
    const planData = recalculateDistances(injectRaceSessions(JSON.parse(jsonText), profile), resolveVma(profile));

    const { data: plan, error } = await supabase
      .from('training_plans')
      .insert({ user_id: userId, plan_data: planData, status: 'pending' })
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, planId: plan.id });
  } catch (err) {
    console.error('Plan generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/plans/adjust-heat ────────────────────────────────────────────

router.post('/plans/adjust-heat', async (req, res) => {
  const { userId, activate } = req.body;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  try {
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
    await supabase.from('profiles').update({ heat_mode: activate }).eq('id', userId);

    const { data: plan } = await supabase
      .from('training_plans').select('*').eq('user_id', userId).eq('status', 'active').single();

    if (!plan) return res.json({ success: true, activated: activate, planData: null });

    const updatedPlan = JSON.parse(JSON.stringify(plan.plan_data));

    if (!activate) {
      // Restore all weeks adapted for heat — always clear flag, restore sessions when backup exists
      for (const week of updatedPlan.semaines) {
        if (week._adapted_for !== 'heat') continue;
        if (week._original_seances) {
          week.seances = week._original_seances;
          if (week._original_charge) week.charge = week._original_charge;
        }
        delete week._adapted_for;
        delete week._original_seances;
        delete week._original_charge;
      }
      await supabase.from('training_plans').update({ plan_data: updatedPlan }).eq('id', plan.id);
      await supabase.from('profiles').update({ heat_mode: false }).eq('id', userId);
      return res.json({ success: true, activated: false, planData: updatedPlan });
    }

    // ── Activate: adapt ALL weeks ────────────────────────────────────────────
    const vma = resolveVma(profile);

    function roundTo5(n) { return Math.max(30, Math.round(n / 5) * 5); }

    function isIntensity(s) {
      const t = (s.type || '').toLowerCase();
      return t.includes('fractionné') || t.includes('vma') || t.includes('seuil') ||
             t.includes('côtes') || t.includes('progressif') || t.includes('spécifique') ||
             t.includes('interval');
    }

    function lightenCorps(corps) {
      if (!corps) return corps;
      let out = corps.replace(/(\d+)\s*[×x×]/gi, (_, n) => `${Math.max(3, Math.round(parseInt(n) * 0.6))} ×`);
      out = out.replace(/(\d{2,3})\s*%\s*(de\s*)?VMA/gi, (_, pct) => `${Math.max(75, parseInt(pct) - 10)}% VMA`);
      return out;
    }

    function adaptSessionHeat(s) {
      const type = (s.type || '').toLowerCase();
      if (type.includes('renforcement')) return s;
      if (s.type === 'Récupération active') return s;

      const newDuration = roundTo5(Math.round((s.duree_min || 45) * 0.80));

      if (isIntensity(s)) {
        const mainMin      = Math.max(newDuration - 20, 10);
        const adaptedCorps = lightenCorps(s.corps);
        return {
          ...s,
          titre:           lightenCorps(s.titre || s.type) + ' allégé 🌡️',
          duree_min:       newDuration,
          intensite:       'modérée — canicule',
          echauffement:    `10 min de footing léger à ${calcPace(vma, 0.63)}/km — progressif`,
          corps:           adaptedCorps
            ? `${adaptedCorps}\n\n(Allure réduite de ~10% — chaleur oblige. Arrête-toi si vertiges.)`
            : `${mainMin} min — séance allégée : moins de répétitions, allure réduite de 10%.`,
          retour_au_calme: `10 min de footing léger à ${calcPace(vma, 0.63)}/km + étirements doux`,
          allures: [
            { zone: 'Échauffement / Retour', pourcentage_vma: 63, vitesse_kmh: parseFloat((vma * 0.63).toFixed(1)), allure_min_km: calcPace(vma, 0.63) + '/km' },
            { zone: 'Séance allégée',        pourcentage_vma: 82, vitesse_kmh: parseFloat((vma * 0.82).toFixed(1)), allure_min_km: calcPace(vma, 0.82) + '/km' },
          ],
          notes_coach:  `Séance allégée pour la canicule — réduis encore si c'est trop dur. Cours tôt le matin ou en soirée, hydrate-toi bien.`,
          rpe_cible:    5, est_seance_cle: false,
        };
      }

      const mainMin   = Math.max(newDuration - 15, 10);
      const efPaceStr = `${calcPace(vma, 0.65)}/km – ${calcPace(vma, 0.70)}/km`;
      return {
        ...s,
        type:            'Endurance fondamentale',
        titre:           'Footing allégé — Canicule 🌡️',
        duree_min:       newDuration, intensite: 'facile',
        echauffement:    `10 min de footing léger à ${calcPace(vma, 0.63)}/km — progressif`,
        corps:           `${mainMin} min de footing allégé à ${efPaceStr} — réduis l'allure si c'est trop dur`,
        retour_au_calme: `5 min de footing très lent à ${calcPace(vma, 0.60)}/km + étirements doux`,
        allures: [
          { zone: 'Échauffement',           pourcentage_vma: 63, vitesse_kmh: parseFloat((vma * 0.63).toFixed(1)), allure_min_km: calcPace(vma, 0.63) + '/km' },
          { zone: 'Endurance fondamentale', pourcentage_vma: 67, vitesse_kmh: parseFloat((vma * 0.67).toFixed(1)), allure_min_km: calcPace(vma, 0.67) + '/km' },
          { zone: 'Retour au calme',        pourcentage_vma: 60, vitesse_kmh: parseFloat((vma * 0.60).toFixed(1)), allure_min_km: calcPace(vma, 0.60) + '/km' },
        ],
        recuperation: null,
        notes_coach:  `Cours tôt le matin ou en soirée et hydrate-toi bien. Réduis l'allure si c'est trop dur.`,
        rpe_cible: 3, est_seance_cle: false,
      };
    }

    for (const week of updatedPlan.semaines) {
      // Preserve existing backup if another adaptation was already active
      if (!week._original_seances) {
        week._original_seances = JSON.parse(JSON.stringify(week.seances));
        week._original_charge  = week.charge;
      }
      week._adapted_for = 'heat';
      week.seances      = week.seances.map(adaptSessionHeat);
      week.charge       = 'Canicule — Allégé';
    }

    recalculateDistances(updatedPlan, vma);
    await supabase.from('training_plans').update({ plan_data: updatedPlan }).eq('id', plan.id);
    res.json({ success: true, activated: true, planData: updatedPlan });
  } catch (err) {
    console.error('[AdjustHeat]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/plans/adapt-injury ───────────────────────────────────────────

router.post('/plans/adapt-injury', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  try {
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();

    const { data: plan } = await supabase
      .from('training_plans').select('*').eq('user_id', userId).eq('status', 'active').single();

    if (!plan) return res.json({ success: true, planData: null });

    const vma         = resolveVma(profile);
    const updatedPlan = JSON.parse(JSON.stringify(plan.plan_data));

    function isIntensityType(s) {
      const t = (s.type || '').toLowerCase();
      return t.includes('fractionné') || t.includes('vma') || t.includes('seuil') ||
             t.includes('côtes') || t.includes('spécifique') || t.includes('interval');
    }

    function adaptSessionForInjury(s) {
      if ((s.type || '').toLowerCase().includes('renforcement')) return s;
      const isIntensity = isIntensityType(s);
      // Intensity → récupération active; EF/sortie longue → footing récup allégé
      const newDuration = isIntensity
        ? Math.max(25, Math.round((s.duree_min || 40) * 0.60))
        : Math.min(40, Math.round((s.duree_min || 45) * 0.70));
      const mainMin = Math.max(newDuration - 10, 10);
      return {
        ...s,
        type:            'Récupération active',
        titre:           isIntensity ? 'Footing récupération — blessure 🩹' : 'Footing léger — blessure 🩹',
        duree_min:       newDuration,
        intensite:       'très facile',
        echauffement:    `5 min de footing très léger à ${calcPace(vma, 0.60)}/km pour activer doucement`,
        corps:           `${mainMin} min de footing à ${calcPace(vma, 0.60)}/km – ${calcPace(vma, 0.63)}/km — écoute ton corps en permanence`,
        retour_au_calme: "5 min d'étirements doux sur la zone blessée",
        allures: [
          { zone: 'Récupération active', pourcentage_vma: 61, vitesse_kmh: parseFloat((vma * 0.61).toFixed(1)), allure_min_km: calcPace(vma, 0.61) + '/km' },
        ],
        recuperation:    null,
        notes_coach:     `Arrête-toi complètement si la douleur dépasse 4/10 pendant la séance ou si elle persiste après — dans ce cas, repos total et consulte un professionnel de santé. Pas de pression.`,
        rpe_cible:       2,
        est_seance_cle:  false,
      };
    }

    // Adapt ALL weeks of the plan (full month)
    for (const week of updatedPlan.semaines) {
      if (week._adapted_for === 'injury') continue; // already adapted
      // Preserve existing backup if another adaptation was active
      if (!week._original_seances) {
        week._original_seances = JSON.parse(JSON.stringify(week.seances));
        week._original_charge  = week.charge;
      }
      week._adapted_for = 'injury';
      week.seances      = week.seances.map(adaptSessionForInjury);
      week.charge       = 'Blessure — Programme adapté';
    }

    recalculateDistances(updatedPlan, vma);
    await supabase.from('training_plans').update({ plan_data: updatedPlan }).eq('id', plan.id);
    res.json({ success: true, planData: updatedPlan });
  } catch (err) {
    console.error('[AdaptInjury]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/plans/restore-week ───────────────────────────────────────────

router.post('/plans/restore-week', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  try {
    const { data: plan } = await supabase
      .from('training_plans').select('*').eq('user_id', userId).eq('status', 'active').single();

    if (!plan) return res.json({ success: false, reason: 'no_plan' });

    const updatedPlan = JSON.parse(JSON.stringify(plan.plan_data));

    // Detect what type of adaptation is active (check any week)
    const anyAdapted = updatedPlan.semaines.find(w => w._adapted_for);

    if (!anyAdapted) {
      // DB already clean — reset heat_mode just in case and return current plan to sync frontend
      await supabase.from('profiles').update({ heat_mode: false }).eq('id', userId);
      return res.json({ success: true, planData: plan.plan_data });
    }

    const adaptedFor = anyAdapted._adapted_for;

    if (adaptedFor === 'injury' || adaptedFor === 'heat') {
      // Restore ALL weeks — always clear flag; restore sessions when backup exists
      for (const week of updatedPlan.semaines) {
        if (week._adapted_for !== adaptedFor) continue;
        if (week._original_seances) {
          week.seances = week._original_seances;
          if (week._original_charge) week.charge = week._original_charge;
        }
        delete week._adapted_for;
        delete week._original_seances;
        delete week._original_charge;
      }
    } else {
      // cycle: restore current week only
      const weeksElapsed = getPlanWeeksElapsed(plan);
      const week = updatedPlan.semaines.find(s => s.numero === weeksElapsed);
      if (week) {
        if (week._original_seances) {
          week.seances = week._original_seances;
          if (week._original_charge) week.charge = week._original_charge;
        }
        delete week._adapted_for;
        delete week._original_seances;
        delete week._original_charge;
      }
    }

    await supabase.from('training_plans').update({ plan_data: updatedPlan }).eq('id', plan.id);

    if (adaptedFor === 'heat') {
      await supabase.from('profiles').update({ heat_mode: false }).eq('id', userId);
    }

    res.json({ success: true, planData: updatedPlan });
  } catch (err) {
    console.error('[RestoreWeek]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/plans/recalculate-vma ────────────────────────────────────────

router.post('/plans/recalculate-vma', async (req, res) => {
  const { userId, newVma } = req.body;
  if (!userId || !newVma) return res.status(400).json({ error: 'Missing data' });

  try {
    const { data: plan } = await supabase
      .from('training_plans').select('*')
      .eq('user_id', userId).eq('status', 'active').single();

    if (!plan) return res.json({ success: true, updated: false });

    const planData = JSON.parse(JSON.stringify(plan.plan_data));
    const vma      = parseFloat(newVma);

    planData.semaines?.forEach(week => {
      week.seances?.forEach(seance => {
        if (!Array.isArray(seance.allures)) return;
        seance.allures = seance.allures.map(a => {
          if (!a.pourcentage_vma) return a;
          const speed    = vma * (a.pourcentage_vma / 100);
          const paceMin  = 60 / speed;
          const m        = Math.floor(paceMin);
          const s        = Math.round((paceMin - m) * 60);
          return {
            ...a,
            vitesse_kmh:    Math.round(speed * 10) / 10,
            allure_min_km:  `${m}'${String(s).padStart(2, '0')}/km`,
          };
        });
      });
    });

    recalculateDistances(planData, vma);
    await supabase.from('training_plans').update({ plan_data: planData }).eq('id', plan.id);
    res.json({ success: true, updated: true });
  } catch (err) {
    console.error('[recalculate-vma]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Weekly adjustment helper ────────────────────────────────────────────────

async function adjustNextWeek(planId, weekNumber, analysisData, athleteProfile) {
  try {
    const { data: planRow } = await supabase
      .from('training_plans').select('plan_data').eq('id', planId).single();
    if (!planRow) return;

    const nextWeekNum = weekNumber + 1;
    const nextWeek    = planRow.plan_data?.semaines?.find(s => s.numero === nextWeekNum);
    if (!nextWeek) return;

    const vma   = resolveVma(athleteProfile);
    const efMin = athleteProfile.days_per_week >= 5
      ? 'minimum 2 EF par semaine'
      : 'minimum 1 EF par semaine';

    const adjustPrompt = `Tu es le moteur d'ajustement de plans d'entraînement de The Ultimate Academy.
Retourne UNIQUEMENT du JSON valide, sans texte autour.

Analyse de la semaine ${weekNumber} :
- RPE moyen : ${analysisData.rpe_moyen || 'N/A'}/10
- Séances réalisées : ${analysisData.seances_realisees || '?'}/${analysisData.seances_planifiees || '?'}
- Ajustement recommandé : ${analysisData.ajustement_semaine_suivante}
- Commentaires athlète : ${analysisData.commentaires || 'Aucun'}

Séances prévues pour la semaine ${nextWeekNum} (${nextWeek.phase}, ${nextWeek.charge}) :
${JSON.stringify(nextWeek.seances, null, 2)}

Allures (VMA ${vma} km/h) :
  EF (65-70%) : ${calcPace(vma, 0.65)}/km – ${calcPace(vma, 0.70)}/km
  Seuil (82-88%) : ${calcPace(vma, 0.82)}/km – ${calcPace(vma, 0.88)}/km
  Fractionné court (95-105%) : ${calcPace(vma, 0.95)}/km – ${calcPace(vma, 1.05)}/km
  Récup (60-65%) : ${calcPace(vma, 0.60)}/km – ${calcPace(vma, 0.65)}/km

Règles d'ajustement :
- RPE moyen ≥ 8 : réduire intensité des séances dures de ~10% (moins de répétitions ou allure plus lente)
- RPE moyen < 5 : augmenter légèrement volume ou intensité (+1-2 reps ou +5%)
- Séances non réalisées sans mention de fatigue : garder le volume (l'athlète peut encore progresser)
- Séances non réalisées AVEC fatigue signalée : réduire d'une séance intense, la remplacer par EF
- ${efMin} (JAMAIS en dessous de ce minimum)
- Ne jamais supprimer toutes les séances intenses d'un coup

Retourne UNIQUEMENT :
{"seances": [ /* séances ajustées ou identiques si aucun changement nécessaire */ ]}`;

    const message = await client.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 3000,
      messages:   [{ role: 'user', content: adjustPrompt }]
    });

    const raw      = message.content[0].text.trim();
    const jsonText = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
    const { seances } = JSON.parse(jsonText);

    const updatedPlan = JSON.parse(JSON.stringify(planRow.plan_data));
    const weekIdx     = updatedPlan.semaines.findIndex(s => s.numero === nextWeekNum);
    if (weekIdx !== -1) {
      updatedPlan.semaines[weekIdx].seances = seances;
      await supabase.from('training_plans')
        .update({ plan_data: updatedPlan })
        .eq('id', planId);
      console.log(`[Plan] Week ${nextWeekNum} adjusted for plan ${planId}`);
    }
  } catch (err) {
    console.error('[Plan] adjustNextWeek error:', err.message);
  }
}

// ─── POST /api/analyses/generate ────────────────────────────────────────────

router.post('/analyses/generate', async (req, res) => {
  const { userId, weekNumber, planId } = req.body;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  try {
    const [{ data: plan }, { data: completions }, { data: athleteProfile }] = await Promise.all([
      supabase.from('training_plans').select('plan_data').eq('id', planId).single(),
      supabase.from('session_completions')
        .select('*').eq('user_id', userId).eq('plan_id', planId).eq('week_number', weekNumber),
      supabase.from('profiles').select('*').eq('id', userId).single()
    ]);

    const weekData     = plan?.plan_data?.semaines?.find(s => s.numero === weekNumber);
    const plannedCount = weekData?.seances?.length || 0;
    const doneCount    = completions?.length || 0;
    const rpeList      = (completions || []).filter(c => c.rpe).map(c => c.rpe);
    const avgRpe       = rpeList.length ? (rpeList.reduce((a, b) => a + b, 0) / rpeList.length).toFixed(1) : 'N/A';
    const comments     = (completions || []).filter(c => c.comment).map(c => c.comment).join(' | ') || 'Aucun';

    const rpeNum    = parseFloat(avgRpe);
    const loadSignal = !isNaN(rpeNum)
      ? rpeNum > 8 ? 'RPE élevé — réduire la charge semaine suivante'
        : rpeNum < 5 ? 'RPE bas — l\'athlète peut absorber plus de charge'
        : 'RPE dans la zone cible'
      : 'RPE non renseigné';

    const analysisPrompt = `Tu es le coach Alexis de The Ultimate Academy. Analyse la semaine ${weekNumber} de cet athlète.
Retourne UNIQUEMENT du JSON valide, sans texte autour.

Données semaine ${weekNumber} — ${weekData?.phase || '?'} (${weekData?.charge || '?'}) :
- Séances planifiées : ${plannedCount}
- Séances réalisées : ${doneCount}
- RPE moyen : ${avgRpe}/10
- Signal charge : ${loadSignal}
- Commentaires athlète : ${comments}

Format JSON :
{
  "resume": "2-3 phrases factuelles sur la semaine",
  "points_positifs": ["point1"],
  "points_attention": ["point si problème, tableau vide sinon"],
  "ajustement_semaine_suivante": "recommandation concrète basée sur RPE et commentaires",
  "seances_realisees": ${doneCount},
  "seances_planifiees": ${plannedCount},
  "rpe_moyen": "${avgRpe}",
  "commentaires": "${comments.replace(/"/g, "'")}",
  "message_coach": "Message naturel et amical, 3-4 phrases, à la 2ème personne, ton pote coach qui te parle franchement — sans signature"
}`;

    const message = await client.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 1000,
      messages:   [{ role: 'user', content: analysisPrompt }]
    });

    const rawText      = message.content[0].text.trim();
    const jsonText     = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
    const analysisData = JSON.parse(jsonText);

    const { data: analysis, error } = await supabase
      .from('weekly_analyses')
      .insert({
        user_id:       userId,
        week_number:   weekNumber,
        plan_id:       planId,
        analysis_data: analysisData,
        coach_message: analysisData.message_coach,
        status:        'sent'
      })
      .select()
      .single();

    if (error) throw error;

    // Adjust next week automatically (fire-and-forget)
    if (athleteProfile) {
      adjustNextWeek(planId, weekNumber, analysisData, athleteProfile);
    }

    res.json({ success: true, analysisId: analysis.id });
  } catch (err) {
    console.error('Analysis generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/analyses/run-weekly  (cron trigger) ──────────────────────────

router.post('/analyses/run-weekly', async (req, res) => {
  try {
    const { data: athletes } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'athlete')
      .eq('subscription_status', 'active')
      .eq('profile_completed', true);

    if (!athletes?.length) return res.json({ processed: 0 });

    let processed = 0;
    for (const athlete of athletes) {
      const { data: plan } = await supabase
        .from('training_plans')
        .select('id, plan_data, activated_at, created_at')
        .eq('user_id', athlete.id)
        .eq('status', 'active')
        .single();

      if (!plan) continue;

      const weeksElapsed = getPlanWeeksElapsed(plan);

      const weekData = plan.plan_data?.semaines?.find(s => s.numero === weeksElapsed);
      if (!weekData) continue;

      const { data: completions } = await supabase
        .from('session_completions')
        .select('*')
        .eq('user_id', athlete.id)
        .eq('plan_id', plan.id)
        .eq('week_number', weeksElapsed);

      const plannedCount = weekData.seances?.length || 0;
      const doneCount    = completions?.length || 0;
      const rpeList      = (completions || []).filter(c => c.rpe).map(c => c.rpe);
      const avgRpe       = rpeList.length
        ? (rpeList.reduce((a, b) => a + b, 0) / rpeList.length).toFixed(1)
        : 'N/A';
      const comments     = (completions || []).filter(c => c.comment).map(c => c.comment).join(' | ') || 'Aucun';
      const rpeNum       = parseFloat(avgRpe);
      const loadSignal   = !isNaN(rpeNum)
        ? rpeNum > 8 ? 'RPE élevé — réduire la charge'
          : rpeNum < 5 ? 'RPE bas — augmenter la charge'
          : 'RPE dans la zone cible'
        : 'RPE non renseigné';

      const analysisPrompt = `Tu es le coach Alexis de The Ultimate Academy. Analyse la semaine ${weeksElapsed} de cet athlète.
Retourne UNIQUEMENT du JSON valide.

Données semaine ${weeksElapsed} — ${weekData.phase} (${weekData.charge}) :
- Séances planifiées : ${plannedCount}
- Séances réalisées : ${doneCount}
- RPE moyen : ${avgRpe}/10
- Signal : ${loadSignal}
- Commentaires : ${comments}

Format JSON :
{
  "resume": "2-3 phrases",
  "points_positifs": ["point1"],
  "points_attention": [],
  "ajustement_semaine_suivante": "recommandation concrète",
  "seances_realisees": ${doneCount},
  "seances_planifiees": ${plannedCount},
  "rpe_moyen": "${avgRpe}",
  "commentaires": "${comments.replace(/"/g, "'")}",
  "message_coach": "Message naturel et amical, 3-4 phrases, à la 2ème personne, ton pote coach qui te parle franchement — sans signature"
}`;

      try {
        const msg = await client.messages.create({
          model:      'claude-sonnet-4-6',
          max_tokens: 800,
          messages:   [{ role: 'user', content: analysisPrompt }]
        });

        const raw          = msg.content[0].text.trim();
        const jsonText     = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
        const analysisData = JSON.parse(jsonText);

        await supabase.from('weekly_analyses').insert({
          user_id:       athlete.id,
          week_number:   weeksElapsed,
          plan_id:       plan.id,
          analysis_data: analysisData,
          coach_message: analysisData.message_coach,
          status:        'sent',
          sent_at:       new Date().toISOString()
        });

        // Send message_coach directly as a chat message to the athlete
        if (analysisData.message_coach) {
          await supabase.from('messages').insert({
            user_id: athlete.id,
            sender:  'coach',
            content: analysisData.message_coach,
            read:    false,
          });
        }

        // Adjust next week automatically
        adjustNextWeek(plan.id, weeksElapsed, analysisData, athlete);

        processed++;
      } catch (err) {
        console.error(`[Weekly] Error for athlete ${athlete.id}:`, err.message);
      }
    }

    res.json({ processed });
  } catch (err) {
    console.error('Run weekly error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/plans/fatigue-adapt  (RPE > 8 real-time trigger) ─────────────

router.post('/plans/fatigue-adapt', async (req, res) => {
  const { userId, planId, weekNumber, rpe, comment } = req.body;
  if (!userId || !planId) return res.status(400).json({ error: 'Missing params' });

  try {
    const { data: athleteProfile } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (!athleteProfile) return res.status(404).json({ error: 'Profile not found' });

    const fakeAnalysis = {
      rpe_moyen:                String(rpe),
      seances_realisees:        1,
      seances_planifiees:       1,
      ajustement_semaine_suivante: `RPE ${rpe}/10 détecté — réduire la charge de la semaine suivante. ${comment ? 'Commentaire : ' + comment : ''}`,
      commentaires:             comment || 'RPE élevé signalé',
    };

    // Adjust next week (fire-and-forget)
    adjustNextWeek(planId, weekNumber, fakeAnalysis, athleteProfile);

    // Generate a personalized coach message about the adaptation
    const msgPrompt = `Tu es Alexis, coach running. ${athleteProfile.first_name} vient de finir une séance avec un RPE de ${rpe}/10${comment ? ` et a dit : "${comment}"` : ''}. Tu vas alléger sa semaine prochaine automatiquement. Écris 2-3 phrases max style SMS de pote — parle à la 1ère personne, "Hello ${athleteProfile.first_name} !" ou similaire, 1-2 emojis max, naturel. Réponds uniquement avec le texte du message.`;

    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 200,
      messages: [{ role: 'user', content: msgPrompt }]
    });

    const coachMessage = msg.content[0].text.trim();

    // Send message to athlete
    await supabase.from('messages').insert({
      user_id: userId,
      sender:  'coach',
      content: coachMessage,
      read:    false,
    });

    // Notify coach (internal flag via messages table)
    await supabase.from('messages').insert({
      user_id: userId,
      sender:  'athlete',
      content: `[AUTO] Adaptation déclenchée — RPE ${rpe}/10 pour ${athleteProfile.first_name}. Semaine ${weekNumber + 1} ajustée automatiquement.`,
      read:    true,
    });

    res.json({ success: true, coachMessage });
  } catch (err) {
    console.error('[FatigueAdapt]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/analyses/pre-race/generate ───────────────────────────────────

router.post('/analyses/pre-race/generate', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, objective, level, vma, vma_known, race_date, chrono_goal')
      .eq('id', userId)
      .single();

    const vma = resolveVma(profile);

    const [{ data: completions }, { data: weeklyAnalyses }] = await Promise.all([
      supabase.from('session_completions').select('*').eq('user_id', userId)
        .order('created_at', { ascending: false }).limit(100),
      supabase.from('weekly_analyses').select('coach_message, created_at').eq('user_id', userId)
        .eq('status', 'sent').order('created_at', { ascending: false }).limit(4),
    ]);

    const totalSessions = completions?.length || 0;
    const withRpe = (completions || []).filter(c => c.rpe);
    const avgRpe = withRpe.length
      ? (withRpe.reduce((a, c) => a + c.rpe, 0) / withRpe.length).toFixed(1)
      : 'N/A';

    const raceDate = new Date(profile.race_date);
    const daysLeft = Math.ceil((raceDate.getTime() - Date.now()) / (24 * 3600 * 1000));

    const prompt = `Tu es le coach Alexis de The Ultimate Academy. Génère une analyse pré-course complète pour ${profile.first_name} dont la course est dans ${daysLeft} jours.

Profil :
- Objectif : ${profile.objective}
- Niveau : ${profile.level}
- VMA : ${vma} km/h
- Objectif chrono : ${profile.chrono_goal || 'non défini'}
- Séances effectuées (12 dernières semaines) : ${totalSessions}
- RPE moyen : ${avgRpe}/10

Dernières analyses hebdomadaires :
${(weeklyAnalyses || []).map((a, i) => `S-${i + 1}: ${a.coach_message}`).join('\n') || 'Aucune'}

Réponds en JSON strict (aucun texte autour) :
{
  "bilan": "Bilan 3-4 phrases des 12 semaines de préparation — volumes, points forts, faibles",
  "evaluation": {
    "regularite": <note 1-10>,
    "intensite": <note 1-10>,
    "recuperation": <note 1-10>,
    "specificite": <note 1-10>,
    "note_globale": <moyenne arrondie au dixième>,
    "commentaire": "1-2 phrases sur l'évaluation globale"
  },
  "strategie": "Stratégie de course personnalisée 4-5 phrases : allure de départ recommandée, gestion effort, ravitaillements, km final",
  "conseils": "5 conseils numérotés pour J-7 à J-1 : sommeil, alimentation, récupération, mental, logistique J-1"
}`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6', max_tokens: 1400,
      messages: [{ role: 'user', content: prompt }]
    });

    const raw  = message.content[0].text.trim();
    const json = raw.startsWith('{') ? raw : (raw.match(/\{[\s\S]*\}/) || ['{}'])[0];
    const content = JSON.parse(json);

    const { data: saved } = await supabase
      .from('pre_race_analyses')
      .upsert({ user_id: userId, race_date: profile.race_date, objective: profile.objective, content },
               { onConflict: 'user_id,race_date' })
      .select().single();

    res.json({ success: true, analysis: saved });
  } catch (err) {
    console.error('[PreRaceGenerate]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/analyses/pre-race/run (cron) ─────────────────────────────────

router.post('/analyses/pre-race/run', async (req, res) => {
  try {
    const target = new Date();
    target.setDate(target.getDate() + 7);
    const dateStr = target.toISOString().split('T')[0];

    // Check both main race and intermediate race at J-7
    const { data: byMainRace }   = await supabase.from('profiles').select('id').eq('race_date', dateStr).eq('subscription_status', 'active');
    const { data: byInterRace }  = await supabase.from('profiles').select('id').eq('intermediate_race_date', dateStr).eq('subscription_status', 'active');

    const allIds  = [...new Set([...(byMainRace || []).map(a => a.id), ...(byInterRace || []).map(a => a.id)])];
    const results = [];
    const axios   = require('axios');

    for (const id of allIds) {
      const { data: existing } = await supabase.from('pre_race_analyses').select('id')
        .eq('user_id', id).eq('race_date', dateStr).single();
      if (existing) { results.push({ id, status: 'already_done' }); continue; }
      try {
        await new Promise(r => setTimeout(r, 1500));
        await axios.post(`http://localhost:${process.env.PORT || 3001}/api/analyses/pre-race/generate`, { userId: id });
        results.push({ id, status: 'generated' });
      } catch (err) {
        results.push({ id, status: 'error', error: err.message });
      }
    }

    res.json({ success: true, processed: results.length, results });
  } catch (err) {
    console.error('[PreRaceRun]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/analyses/intermediate-post/run  (cron — J+2 after intermediate race) ─

router.post('/analyses/intermediate-post/run', async (req, res) => {
  try {
    const target = new Date();
    target.setDate(target.getDate() - 2);
    const dateStr = target.toISOString().split('T')[0];

    const { data: athletes } = await supabase
      .from('profiles').select('id, first_name, objective, level, vma, vma_known, intermediate_race_name, intermediate_race_date')
      .eq('intermediate_race_date', dateStr)
      .eq('subscription_status', 'active');

    if (!athletes?.length) return res.json({ processed: 0 });

    let processed = 0;
    for (const athlete of athletes) {
      try {
        // Check if already sent
        const { data: existing } = await supabase.from('messages').select('id')
          .eq('user_id', athlete.id).ilike('content', `%post-course%${athlete.intermediate_race_name || ''}%`).limit(1).single();
        if (existing) continue;

        const vma = resolveVma(athlete);
        const prompt = `Tu es Alexis, coach running. ${athlete.first_name} vient de courir ${athlete.intermediate_race_name || 'une course intermédiaire'} il y a 2 jours.
Écris un message de suivi post-course très chaleureux (4-6 phrases), style pote-coach, à la 1ère personne. Parle de :
1. Bravo pour la course
2. Il est normal de ressentir de la fatigue J+2, c'est le signe que l'effort était réel
3. Cette semaine on récupère doucement : 1-2 footings EF légers max 30 min
4. Ce que ça prédit pour la suite et comment ça s'intègre dans la prépa
Tu peux mettre 1-2 emojis, style SMS naturel, pas de signature, pas de "Cher/Chère".
Réponds uniquement avec le texte du message.`;

        const msg = await client.messages.create({
          model: 'claude-sonnet-4-6', max_tokens: 350,
          messages: [{ role: 'user', content: prompt }]
        });

        await supabase.from('messages').insert({
          user_id: athlete.id, sender: 'coach',
          content: msg.content[0].text.trim(), read: false,
        });
        processed++;
      } catch (err) {
        console.error(`[intermediate-post] Error for ${athlete.id}:`, err.message);
      }
    }

    res.json({ processed });
  } catch (err) {
    console.error('[intermediate-post/run]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/analyses/pre-race/:userId ─────────────────────────────────────

router.get('/analyses/pre-race/:userId', async (req, res) => {
  try {
    const { data } = await supabase
      .from('pre_race_analyses').select('*')
      .eq('user_id', req.params.userId)
      .order('created_at', { ascending: false }).limit(1).single();
    res.json({ analysis: data || null });
  } catch (_) {
    res.json({ analysis: null });
  }
});

// ─── POST /api/races/submit-result ──────────────────────────────────────────

router.post('/races/submit-result', async (req, res) => {
  const { userId, raceDate, actualTimeSecs, feeling, issues, avgHr, maxHr, avgPaceSecs, notes } = req.body;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  try {
    const { data } = await supabase.from('race_results')
      .insert({
        user_id: userId, race_date: raceDate,
        actual_time_secs: actualTimeSecs || null,
        feeling: feeling || null,
        issues: issues || [],
        avg_hr: avgHr || null,
        max_hr: maxHr || null,
        avg_pace_secs: avgPaceSecs || null,
        notes: notes || null,
      })
      .select().single();

    res.json({ success: true, result: data });
  } catch (err) {
    console.error('[SubmitRaceResult]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/analyses/post-race/generate ──────────────────────────────────

router.post('/analyses/post-race/generate', async (req, res) => {
  const { userId, raceResultId } = req.body;
  if (!userId || !raceResultId) return res.status(400).json({ error: 'Missing fields' });

  try {
    const [{ data: profile }, { data: raceResult }] = await Promise.all([
      supabase.from('profiles').select('first_name, objective, level, vma, vma_known, race_date, chrono_goal').eq('id', userId).single(),
      supabase.from('race_results').select('*').eq('id', raceResultId).single(),
    ]);

    const { data: preRace } = await supabase
      .from('pre_race_analyses').select('content')
      .eq('user_id', userId).eq('race_date', profile.race_date).single();

    const vma = resolveVma(profile);

    const fmtSecs = secs => {
      const h = Math.floor(secs / 3600);
      const m = Math.floor((secs % 3600) / 60);
      const s = secs % 60;
      return h > 0
        ? `${h}h${m.toString().padStart(2, '0')}'${s.toString().padStart(2, '0')}"`
        : `${m}'${s.toString().padStart(2, '0')}"`;
    };

    const prompt = `Tu es le coach Alexis de The Ultimate Academy. Génère une analyse post-course complète et bienveillante pour ${profile.first_name}.

Course : ${profile.objective}
Chrono réalisé : ${raceResult.actual_time_secs ? fmtSecs(raceResult.actual_time_secs) : 'non renseigné'}
Objectif visé : ${profile.chrono_goal || 'non défini'}
Ressenti général : ${raceResult.feeling || 'N/A'}/5
Difficultés rencontrées : ${(raceResult.issues || []).join(', ') || 'aucune'}
FC moyenne : ${raceResult.avg_hr ? raceResult.avg_hr + ' bpm' : 'N/A'}
FC max : ${raceResult.max_hr ? raceResult.max_hr + ' bpm' : 'N/A'}
Allure moyenne : ${raceResult.avg_pace_secs ? fmtSecs(raceResult.avg_pace_secs) + '/km' : 'N/A'}
Notes athlète : ${raceResult.notes || 'aucune'}
VMA : ${vma} km/h
Stratégie conseillée pré-course : ${preRace?.content?.strategie || 'N/A'}

Réponds en JSON strict (aucun texte autour) :
{
  "performance": "2-3 phrases : analyse du chrono vs objectif, contexte et nuance",
  "strategie": "2-3 phrases : comment la course a été courue vs les conseils pré-course",
  "positifs": ["point positif 1", "point positif 2", "point positif 3"],
  "ameliorations": ["axe amélioration 1", "axe amélioration 2"],
  "recuperation": "Plan récupération J+1 à J+14 : 5 points concrets numérotés",
  "message_coach": "Message personnel chaleureux et motivant du coach, 3-4 phrases"
}`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6', max_tokens: 1400,
      messages: [{ role: 'user', content: prompt }]
    });

    const raw  = message.content[0].text.trim();
    const json = raw.startsWith('{') ? raw : (raw.match(/\{[\s\S]*\}/) || ['{}'])[0];
    const content = JSON.parse(json);

    const { data: saved } = await supabase
      .from('post_race_analyses')
      .insert({ user_id: userId, race_result_id: raceResultId, content })
      .select().single();

    res.json({ success: true, analysis: saved });
  } catch (err) {
    console.error('[PostRaceGenerate]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/analyses/post-race/:userId ────────────────────────────────────

router.get('/analyses/post-race/:userId', async (req, res) => {
  try {
    const { data: result } = await supabase
      .from('race_results').select('*, post_race_analyses(*)')
      .eq('user_id', req.params.userId)
      .order('created_at', { ascending: false }).limit(1).single();
    res.json({ result: result || null });
  } catch (_) {
    res.json({ result: null });
  }
});

// ─── POST /api/messages/generate-response ───────────────────────────────────

router.post('/messages/generate-response', async (req, res) => {
  const { athleteId, lastMessages } = req.body;
  if (!athleteId) return res.status(400).json({ error: 'Missing athleteId' });

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, objective, level')
      .eq('id', athleteId)
      .single();

    const conversation = (lastMessages || [])
      .map(m => `${m.sender === 'athlete' ? profile?.first_name || 'Athlète' : 'Alexis'}: ${m.content}`)
      .join('\n');

    const message = await client.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 400,
      messages:   [{
        role:    'user',
        content: `Tu es le coach Alexis de The Ultimate Academy. Réponds au dernier message de ${profile?.first_name || 'l\'athlète'} comme un pote coach — naturel, direct, humain. 2-3 phrases max, style SMS. Pas de signature, pas de formules de politesse, pas de "Cher…". Juste une vraie réponse de quelqu'un qui connaît l'athlète et l'accompagne au quotidien.

Contexte : objectif ${profile?.objective || ''}, niveau ${profile?.level || ''}.

Conversation :
${conversation}

Réponds uniquement avec le texte du message, sans guillemets ni formatage.`
      }]
    });

    res.json({ suggestion: message.content[0].text.trim() });
  } catch (err) {
    console.error('Generate response error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/profile/:userId ─────────────────────────────────────────────────

router.get('/profile/:userId', async (req, res) => {
  const { userId } = req.params;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });
  try {
    const { data, error } = await supabase
      .from('profiles').select('*').eq('id', userId).single();
    if (error) throw error;
    res.json({ profile: data });
  } catch (err) {
    console.error('[profile/get]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/profile/update ─────────────────────────────────────────────────
// Uses service key → bypasses RLS → guaranteed to persist

const ALLOWED_PROFILE_FIELDS = new Set([
  'first_name', 'last_name', 'gender', 'objective', 'race_date', 'level',
  'vma', 'vma_known', 'chrono_goal', 'chrono_goal_known',
  'days_per_week', 'preferred_days', 'gps_watch', 'best_recent_time',
  'injuries', 'current_form', 'coach_message',
  'period_pain', 'period_pain_days', 'avatar_url',
  'profile_completed',
  'intermediate_race_date', 'intermediate_race_name', 'training_terrain', 'heat_mode',
  'plan_regen_after',
]);

router.post('/profile/update', async (req, res) => {
  const { userId, fields } = req.body;
  if (!userId || !fields || typeof fields !== 'object') {
    return res.status(400).json({ error: 'Missing userId or fields' });
  }

  // Whitelist — only allow safe profile fields
  const patch = {};
  for (const [key, val] of Object.entries(fields)) {
    if (ALLOWED_PROFILE_FIELDS.has(key)) patch[key] = val;
  }
  if (!Object.keys(patch).length) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  console.log('[profile/update] userId:', userId, '| patch:', JSON.stringify(patch));

  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(patch)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    console.log('[profile/update] saved OK | objective:', data?.objective, 'days_per_week:', data?.days_per_week);
    res.json({ success: true, profile: data });
  } catch (err) {
    console.error('[profile/update] ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/plans/generate-monthly ───────────────────────────────────────
// Called by cron: generates pending plans for all active athletes who don't have one yet

router.post('/plans/generate-monthly', async (req, res) => {
  console.log('[generate-monthly] Starting monthly plan generation…');
  res.json({ accepted: true }); // respond immediately so cron doesn't time out

  try {
    const { data: athletes, error: athletesErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'athlete')
      .in('subscription_status', ['active', 'trialing']);

    if (athletesErr) throw athletesErr;
    if (!athletes?.length) { console.log('[generate-monthly] No active athletes.'); return; }

    let generated = 0;
    const todayStr = getParisLocalDate();

    for (const athlete of athletes) {
      try {
        const { data: existing } = await supabase
          .from('training_plans').select('id')
          .eq('user_id', athlete.id).eq('status', 'pending').maybeSingle();

        if (existing) { console.log(`[generate-monthly] Skip ${athlete.first_name} — pending plan exists`); continue; }

        // Inline plan generation (reuse same logic as /plans/generate)
        const vma            = resolveVma(athlete);
        const weeksUntilRace = computeWeeksUntilRace(athlete.race_date);
        const monthStructure = computeMonthStructure(athlete.objective, weeksUntilRace);
        const efMin          = (athlete.days_per_week >= 5) ? 'minimum 2 EF obligatoires' : 'minimum 1 EF obligatoire';
        const structureDesc  = monthStructure.semaines.map(s => `  S${s.numero} → phase "${s.phase}", charge "${s.charge}"`).join('\n');

        const localISO = d => { const yr=d.getFullYear(), mo=String(d.getMonth()+1).padStart(2,'0'), dy=String(d.getDate()).padStart(2,'0'); return `${yr}-${mo}-${dy}`; };
        const today       = new Date(todayStr + 'T00:00:00');
        const dayNames    = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
        const todayDayNum = today.getDay();
        const daysToSunday  = todayDayNum === 0 ? 0 : 7 - todayDayNum;
        const thisSunday    = new Date(today); thisSunday.setDate(today.getDate() + daysToSunday);
        const nextMonday    = new Date(thisSunday); nextMonday.setDate(thisSunday.getDate() + 1);
        const DAY_NUM       = { Lundi:1, Mardi:2, Mercredi:3, Jeudi:4, Vendredi:5, Samedi:6, Dimanche:0 };
        const normDay       = d => (DAY_NUM[d] === 0 ? 7 : DAY_NUM[d]);
        const normToday     = todayDayNum === 0 ? 7 : todayDayNum;
        const preferredDays = athlete.preferred_days || [];
        const remainingThisWeek = preferredDays.filter(d => normDay(d) >= normToday);
        const isPartialWeek     = todayDayNum !== 1;
        const week1SessionCount = isPartialWeek ? remainingThisWeek.length : athlete.days_per_week;

        const calendarSection = isPartialWeek
          ? `CALENDRIER — SEMAINE 1 PARTIELLE\nAujourd'hui : ${todayStr} (${dayNames[todayDayNum]}).\nSemaine 1 = du ${todayStr} au ${localISO(thisSunday)}.\nJours préférés encore disponibles cette semaine : ${remainingThisWeek.join(', ') || 'aucun'}.\n→ Assigne UNIQUEMENT ${week1SessionCount} séance(s) course en semaine 1.\n→ Semaines 2, 3, 4 commencent à partir du ${localISO(nextMonday)} avec ${athlete.days_per_week} séances course + 1 RENFO chacune.`
          : `CALENDRIER — SEMAINE 1 COMPLÈTE\nAujourd'hui : ${todayStr} (lundi).\nLe plan commence aujourd'hui.\nSemaines 1-4 : ${athlete.days_per_week} séances course + 1 RENFO par semaine.`;

        const userPrompt = `Génère un plan d'entraînement running de EXACTEMENT 4 SEMAINES pour :\n\nPrénom : ${athlete.first_name}\nObjectif : ${athlete.objective}\nDate de course : ${athlete.race_date ? new Date(athlete.race_date).toLocaleDateString('fr-FR') : 'Non définie'}\nSemaines avant course : ${weeksUntilRace !== null ? weeksUntilRace : 'N/A'}\nContexte du mois : ${monthStructure.label}\nNiveau : ${athlete.level}\nVMA : ${vma} km/h\nSéances course/semaine : ${athlete.days_per_week} → ${efMin}\nJours préférés : ${preferredDays.join(', ') || 'Non précisé'}\nBlessures : ${athlete.injuries || 'Aucune'}\n\n${calendarSection}\n\n${buildPaceSection(vma, athlete.objective, athlete.chrono_goal_known ? athlete.chrono_goal : null)}\n\nSTRUCTURE IMPOSÉE :\n${structureDesc}`;

        const libraryText = await loadSessionLibrary();
        const message = await client.messages.create({
          model: 'claude-sonnet-4-6', max_tokens: 16000,
          system: buildSystemPrompt(libraryText),
          messages: [{ role: 'user', content: userPrompt }]
        });

        const rawText  = message.content[0].text.trim();
        const jsonText = rawText.replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/\s*```$/i,'');
        const planData = JSON.parse(jsonText);

        const { error: insertErr } = await supabase
          .from('training_plans')
          .insert({ user_id: athlete.id, plan_data: planData, status: 'pending' });

        if (insertErr) throw insertErr;
        generated++;
        console.log(`[generate-monthly] Plan generated for ${athlete.first_name} ${athlete.last_name}`);
        await new Promise(r => setTimeout(r, 5000)); // 5s between athletes
      } catch (err) {
        console.error(`[generate-monthly] Failed for ${athlete.id}:`, err.message);
      }
    }

    console.log(`[generate-monthly] Done: ${generated}/${athletes.length} plans generated`);
  } catch (err) {
    console.error('[generate-monthly]', err.message);
  }
});

// ─── POST /api/plans/schedule-regen ─────────────────────────────────────────

router.post('/plans/schedule-regen', async (req, res) => {
  const { userId, reason } = req.body;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });
  try {
    const regenAt = new Date(Date.now() + 60 * 60 * 1000);
    await supabase.from('profiles').update({ plan_regen_after: regenAt.toISOString() }).eq('id', userId);
    console.log(`[schedule-regen] Scheduled for ${userId} at ${regenAt.toISOString()} — reason: ${reason}`);

    const { data: profile } = await supabase.from('profiles').select('first_name').eq('id', userId).single();
    const firstName = profile?.first_name || '';
    let confirmMsg = `Bien reçu ${firstName} ! J'ai pris note de ta modification — ton plan sera automatiquement adapté d'ici 1h. 👌`;
    if (reason === 'Blessures / douleurs') {
      confirmMsg = `Bien reçu ${firstName} 🩹 J'ai pris note de ta blessure — ton plan sera adapté d'ici 1h pour tenir compte de ça. Prends soin de toi, on y va progressivement.`;
    } else if (reason === 'Cycle menstruel') {
      confirmMsg = `Bien reçu ${firstName} 🌸 Tes paramètres de cycle sont enregistrés — ton plan sera adapté d'ici 1h. Prends soin de toi.`;
    }
    await supabase.from('messages').insert({
      user_id: userId, sender: 'coach',
      content: confirmMsg,
      read: false,
    });

    res.json({ success: true, regen_scheduled_for: regenAt.toISOString() });
  } catch (err) {
    console.error('[schedule-regen]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/plans/check-regen ─────────────────────────────────────────────
// Called by cron every 15 min — regenerates plans for athletes who modified key fields

router.post('/plans/check-regen', async (req, res) => {
  try {
    const now = new Date().toISOString();
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .not('plan_regen_after', 'is', null)
      .lte('plan_regen_after', now)
      .in('subscription_status', ['active', 'trialing']);

    if (!profiles?.length) return res.json({ processed: 0 });

    const todayStr = getParisLocalDate();
    let processed = 0;

    for (const profile of profiles) {
      try {
        // Clear the regen flag immediately so it won't be picked up again
        await supabase.from('profiles').update({ plan_regen_after: null }).eq('id', profile.id);

        // ── Canicule: adapt current week programmatically, no full regen ──────
        if (profile.heat_mode) {
          const { data: heatPlan } = await supabase
            .from('training_plans').select('*').eq('user_id', profile.id).eq('status', 'active').single();

          if (heatPlan) {
            const weeksElapsed = getPlanWeeksElapsed(heatPlan);
            const weekIdx      = heatPlan.plan_data?.semaines?.findIndex(s => s.numero === weeksElapsed) ?? -1;

            if (weekIdx !== -1) {
              const vma       = resolveVma(profile);
              const efPaceStr = `${calcPace(vma, 0.65)}/km – ${calcPace(vma, 0.70)}/km`;
              const updatedPlan = JSON.parse(JSON.stringify(heatPlan.plan_data));

              updatedPlan.semaines[weekIdx].seances = updatedPlan.semaines[weekIdx].seances.map(s => {
                if (s.type === 'Renforcement musculaire') return s;
                const newDuration = Math.min(50, Math.round((s.duree_min || 45) * 0.80));
                return {
                  ...s,
                  type:            'Endurance fondamentale',
                  titre:           'Footing EF — Canicule 🌡️',
                  duree_min:       newDuration,
                  intensite:       'facile',
                  echauffement:    '5 min de marche / trot très léger',
                  corps:           `${Math.max(newDuration - 10, 10)} min de footing EF tranquille à ${efPaceStr} — écoute ton corps par cette chaleur`,
                  retour_au_calme: '5 min de marche douce + étirements',
                  allures: [{ zone: 'Endurance fondamentale', pourcentage_vma: 67, vitesse_kmh: parseFloat((vma * 0.67).toFixed(1)), allure_min_km: calcPace(vma, 0.67) + '/km' }],
                  recuperation:    null,
                  notes_coach:     'Cours tôt le matin ou en soirée. Hydrate-toi avant, pendant et après. Aucune intensité par cette chaleur.',
                  rpe_cible:       3,
                  est_seance_cle:  false,
                };
              });
              updatedPlan.semaines[weekIdx].charge = 'Canicule — Allégé';
              await supabase.from('training_plans').update({ plan_data: updatedPlan }).eq('id', heatPlan.id);
            }
          }

          await supabase.from('messages').insert({
            user_id: profile.id, sender: 'coach',
            content: `${profile.first_name}, c'est fait — ta semaine est allégée 🌡️ Que des footings tranquilles jusqu'à ce que la canicule passe. Cours tôt le mat' ou en soirée et hydrate-toi bien.`,
            read: false,
          });

          processed++;
          console.log(`[check-regen] Heat adaptation applied for ${profile.first_name} (${profile.id})`);
          continue;
        }

        // Archive current active plan
        await supabase.from('training_plans')
          .update({ status: 'replaced' })
          .eq('user_id', profile.id)
          .eq('status', 'active');

        // Build prompt (mirrors /plans/generate logic)
        const vma            = resolveVma(profile);
        const weeksUntilRace = computeWeeksUntilRace(profile.race_date);
        const monthStructure = computeMonthStructure(profile.objective, weeksUntilRace);
        const efMin          = profile.days_per_week >= 5 ? 'minimum 2 EF obligatoires' : 'minimum 1 EF obligatoire';
        const structureDesc  = monthStructure.semaines.map(s => `  S${s.numero} → phase "${s.phase}", charge "${s.charge}"`).join('\n');

        const localISO = d => {
          const yr = d.getFullYear(), mo = String(d.getMonth()+1).padStart(2,'0'), dy = String(d.getDate()).padStart(2,'0');
          return `${yr}-${mo}-${dy}`;
        };
        const today         = new Date(todayStr + 'T00:00:00');
        const dayNames      = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
        const todayDayNum   = today.getDay();
        const daysToSunday  = todayDayNum === 0 ? 0 : 7 - todayDayNum;
        const thisSunday    = new Date(today); thisSunday.setDate(today.getDate() + daysToSunday);
        const nextMonday    = new Date(thisSunday); nextMonday.setDate(thisSunday.getDate() + 1);
        const DAY_NUM       = { Lundi:1, Mardi:2, Mercredi:3, Jeudi:4, Vendredi:5, Samedi:6, Dimanche:0 };
        const normDay       = d => (DAY_NUM[d] === 0 ? 7 : DAY_NUM[d]);
        const normToday     = todayDayNum === 0 ? 7 : todayDayNum;
        const preferredDays = profile.preferred_days || [];
        const remainingThisWeek   = preferredDays.filter(d => normDay(d) >= normToday);
        const isPartialWeek       = todayDayNum !== 1;
        const week1SessionCount   = isPartialWeek ? remainingThisWeek.length : profile.days_per_week;

        const intermediateRaceInfo = profile.intermediate_race_date && profile.intermediate_race_name
          ? `Course intermédiaire : ${profile.intermediate_race_name} — ${new Date(profile.intermediate_race_date).toLocaleDateString('fr-FR')} (RÈGLE 14 : mini-affûtage dans la semaine de la course elle-même — la semaine AVANT est développement normal)`
          : 'Aucune course intermédiaire prévue dans ce plan';
        const terrainInfo = profile.training_terrain
          ? `Terrain d'entraînement : ${profile.training_terrain === 'montagne' ? 'Montagne (D+/descentes — RÈGLE 13)' : profile.training_terrain === 'semi_montagne' ? 'Semi-montagne (mix plat et pente — RÈGLE 13)' : 'Ville/Plat (escaliers, tapis incliné — RÈGLE 13)'}`
          : '';

        const calendarSection = isPartialWeek
          ? `CALENDRIER — SEMAINE 1 PARTIELLE\nAujourd'hui : ${todayStr} (${dayNames[todayDayNum]}).\nSemaine 1 = du ${todayStr} au ${localISO(thisSunday)}.\nJours préférés encore disponibles cette semaine : ${remainingThisWeek.join(', ') || 'aucun'}.\n→ Assigne UNIQUEMENT ${week1SessionCount} séance(s) course en semaine 1.\n→ Semaines 2, 3, 4 commencent à partir du ${localISO(nextMonday)} avec ${profile.days_per_week} séances course + 1 RENFO chacune.`
          : `CALENDRIER — SEMAINE 1 COMPLÈTE\nAujourd'hui : ${todayStr} (lundi).\nLe plan commence aujourd'hui.\nSemaines 1-4 : ${profile.days_per_week} séances course + 1 RENFO par semaine.`;

        const userPrompt = `Génère un plan d'entraînement running de EXACTEMENT 4 SEMAINES pour :

Prénom : ${profile.first_name}
Objectif course : ${profile.objective}
Date de course : ${profile.race_date ? new Date(profile.race_date).toLocaleDateString('fr-FR') : 'Non définie'}
Semaines avant la course : ${weeksUntilRace !== null ? weeksUntilRace : 'N/A'}
Contexte du mois : ${monthStructure.label}
Niveau : ${profile.level}
VMA : ${vma} km/h ${profile.vma_known ? '(mesurée)' : '(estimée)'}
Objectif chrono : ${profile.chrono_goal_known ? profile.chrono_goal : 'Progresser'}
Séances course/semaine : ${profile.days_per_week} → ${efMin} par semaine
Jours préférés : ${preferredDays.join(', ') || 'Non précisé'}
Blessures / douleurs : ${profile.injuries || 'Aucune'}
Forme actuelle : ${profile.current_form || 'Non renseignée'}
${intermediateRaceInfo}
${terrainInfo}

${calendarSection}

${buildPaceSection(vma, profile.objective, profile.chrono_goal_known ? profile.chrono_goal : null)}

STRUCTURE IMPOSÉE :
${structureDesc}

CONTRAINTES ABSOLUES :
1. EXACTEMENT 4 semaines avec les phases ci-dessus
2. Semaine 1 : ${week1SessionCount} séances course. Semaines 2-4 : EXACTEMENT ${profile.days_per_week} séances course + 1 RENFO
3. ${efMin} dans chaque semaine complète
4. Ratio 80/20 respecté`;

        const libraryText = await loadSessionLibrary();
        const message = await client.messages.create({
          model:      'claude-sonnet-4-6',
          max_tokens: 16000,
          system:     buildSystemPrompt(libraryText),
          messages:   [{ role: 'user', content: userPrompt }]
        });

        const rawText  = message.content[0].text.trim();
        const jsonText = rawText.replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/\s*```$/i,'');
        const planData = recalculateDistances(injectRaceSessions(JSON.parse(jsonText), profile), resolveVma(profile));

        await supabase.from('training_plans').insert({
          user_id:      profile.id,
          plan_data:    planData,
          status:       'active',
          activated_at: new Date().toISOString(),
        });

        // Warm personal message — generated by Claude, buddy style
        try {
          const warmMsg = await client.messages.create({
            model: 'claude-sonnet-4-6', max_tokens: 200,
            messages: [{ role: 'user', content: `Tu es Alexis, coach running. Écris un message très court (2-3 phrases max) style SMS de pote à ${profile.first_name}. Tu viens de mettre à jour son plan suite à des changements dans son profil. Parle à la 1ère personne, dis "Hello ${profile.first_name} !" ou similaire, 1-2 emojis max en fin de phrase, très naturel, jamais "cher/chère", jamais de signature. Exemple : "Hello ${profile.first_name} ! J'ai vu tes modifs et j'ai mis ton plan à jour 💪 Vas voir l'onglet Plan !" Réponds uniquement avec le texte du message, sans guillemets.` }]
          });
          await supabase.from('messages').insert({
            user_id: profile.id, sender: 'coach',
            content: warmMsg.content[0].text.trim(), read: false,
          });
        } catch {
          await supabase.from('messages').insert({
            user_id: profile.id, sender: 'coach',
            content: `Hello ${profile.first_name} ! J'ai mis ton plan à jour suite à tes modifs 💪 Vas jeter un œil dans l'onglet Plan.`,
            read: false,
          });
        }

        processed++;
        console.log(`[check-regen] Plan regenerated for ${profile.first_name} (${profile.id})`);
        if (profiles.indexOf(profile) < profiles.length - 1) {
          await new Promise(r => setTimeout(r, 5000));
        }
      } catch (err) {
        console.error(`[check-regen] Error for ${profile.id}:`, err.message);
      }
    }

    res.json({ processed });
  } catch (err) {
    console.error('[check-regen]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
