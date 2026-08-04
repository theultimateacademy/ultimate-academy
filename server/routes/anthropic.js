const express    = require('express');
const Anthropic  = require('@anthropic-ai/sdk');
const { createClient } = require('@supabase/supabase-js');

const router   = express.Router();
const client   = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// ─── Middleware admin (routes réservées au coach ou aux CRONs internes) ─────
// Accepte : flag _internal, X-Admin-Secret statique, ou JWT Supabase d'un coach
async function requireAdminOrInternal(req, res, next) {
  // Appels internes (crons, appels serveur-à-serveur)
  if (req.body?._internal === true) return next();

  // Secret statique (crons externes)
  const secret = req.headers['x-admin-secret'];
  if (secret && secret === process.env.ADMIN_SECRET) return next();

  // JWT Supabase
  const auth  = req.headers['authorization'];
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  if (token) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (profile?.role === 'coach') return next();
      }
    } catch (_) {}
  }

  console.warn(`[SECURITY] Accès refusé — IP: ${req.ip} — Route: ${req.method} ${req.originalUrl}`);
  return res.status(401).json({ error: 'Non autorisé' });
}

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

// Alerte visible dans l'espace coach (onglet Alertes de la fiche athlète) — déclenchée
// quand l'athlète active/désactive une adaptation de plan (canicule, fatigue, blessure, cycle).
async function sendCoachAlert(userId, message) {
  try {
    await supabase.from('messages').insert({ user_id: userId, sender: 'athlete', content: `⚠️ [PROFIL] ${message}` });
  } catch (err) {
    console.error('[CoachAlert]', err.message);
  }
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
      // Natation / vélo / brique : distance non calculable sans CSS/FTP → null (affiché NC)
      if (type.includes('natation') || type.includes('vélo') || type.includes('velo') || type.includes('brique')) {
        s.distance_km = null;
        continue;
      }
      // Average speed from allures[] zones when available
      const validAllures = (s.allures || []).filter(a => typeof a.vitesse_kmh === 'number' && a.vitesse_kmh > 0);
      let avgSpeed;
      if (validAllures.length > 0) {
        avgSpeed = validAllures.reduce((sum, a) => sum + a.vitesse_kmh, 0) / validAllures.length;
        if (type.includes('fractionné') || type.includes('vma')) avgSpeed *= 0.85;
      } else {
        const pct = (type.includes('tempo') || type.includes('seuil')) ? 0.73
          : (type.includes('fractionné') || type.includes('vma'))     ? 0.70
          : (type.includes('côte') || type.includes('cote'))          ? 0.68
          : 0.67;
        avgSpeed = vma * pct;
      }
      s.distance_km = Math.round((s.duree_min / 60) * avgSpeed * 10) / 10;
    }
    // volume_total_km = running/trail only; separate NC markers for swim/bike
    sem.volume_total_km = Math.round(
      (sem.seances || []).reduce((sum, s) => {
        const t = (s.type || '').toLowerCase();
        if (t.includes('natation') || t.includes('vélo') || t.includes('velo') || t.includes('brique')) return sum;
        return sum + (s.distance_km || 0);
      }, 0) * 10
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

const TRIATHLON_OBJECTIVES = new Set(['tri_sprint', 'tri_olympic', 'tri_half', 'tri_ironman']);
const TRAIL_OBJECTIVES     = new Set(['trail_20k', 'trail_50k', 'trail_100k', 'trail_100m']);

function getDiscipline(objective) {
  if (TRIATHLON_OBJECTIVES.has(objective)) return 'triathlon';
  if (TRAIL_OBJECTIVES.has(objective))     return 'trail';
  return 'running';
}

async function loadSessionLibrary(objective) {
  const discipline = getDiscipline(objective);

  // For running: only running sessions
  // For trail: running (for the run leg) + trail sessions + montagne if applicable
  // For triathlon: all sports (running + natation + velo + brique)
  let query = supabase
    .from('session_library')
    .select('code, category, name, duration_min, intensity_rpe, warmup, main_set, recovery, cooldown, coach_notes, compatible_goals, sport, montagne_only')
    .order('code');

  if (discipline === 'running') {
    query = query.or('sport.eq.running,sport.is.null');
  } else if (discipline === 'trail') {
    query = query.in('sport', ['running', 'trail']);
  }
  // triathlon: no filter — all sports included

  let { data, error } = await query;

  // Fallback: sport/montagne_only columns may not exist yet (migration not run)
  if (error && (error.message?.includes('column') || error.message?.includes('does not exist'))) {
    console.warn('[session_library] sport column missing, using fallback query');
    const fallback = await supabase
      .from('session_library')
      .select('code, category, name, duration_min, intensity_rpe, warmup, main_set, recovery, cooldown, coach_notes, compatible_goals')
      .order('code');
    data = fallback.data;
    error = fallback.error;
  }

  if (error || !data?.length) {
    console.warn('[session_library] Error or empty:', error?.message);
    return { text: '(bibliothèque vide — vérifier la table session_library)', map: {} };
  }

  const map = Object.fromEntries(data.map(s => [s.code, s]));

  // Group by sport for the prompt (if sport column exists)
  const sportLabels = { running: 'COURSE À PIED', natation: 'NATATION', velo: 'VÉLO', brique: 'BRIQUES (multi-sport)', trail: 'TRAIL' };
  const hasSportCol = data[0] && 'sport' in data[0];
  const bySport = {};
  for (const s of data) {
    const sp = (hasSportCol ? s.sport : null) || 'running';
    if (!bySport[sp]) bySport[sp] = [];
    bySport[sp].push(s);
  }

  const text = Object.entries(bySport).map(([sport, sessions]) => {
    const label = sportLabels[sport] || sport.toUpperCase();
    const lines = sessions.map(s => {
      const goals = (s.compatible_goals || []).join(', ');
      const E  = s.warmup   ? `\n  É: ${s.warmup}`   : '';
      const R  = s.recovery ? `\n  R: ${s.recovery}`  : '';
      const RC = s.cooldown ? `\n  RC: ${s.cooldown}` : '';
      const montagne = s.montagne_only ? ' [MONTAGNE UNIQUEMENT]' : '';
      return `[${s.code}] ${s.name}${montagne} | ${s.duration_min}min | RPE${s.intensity_rpe}/10 | ${goals}${E}\n  C: ${s.main_set}${R}${RC}`;
    }).join('\n\n');
    return `── ${label} ──\n${lines}`;
  }).join('\n\n');

  return { text, map };
}

// ─── Inject library content into plan sessions ─────────────────────────────────
// After AI picks codes, replace corps/echauffement/retour with library content
// formatted as BLOC/bullet structure for the UI visual display.

function subsPaces(text, vma) {
  if (!text) return text;
  // Single-pass: match "X-Y% VMA" ranges OR "X% VMA" singles — avoids double-replacement
  return text.replace(/(\d{2,3})-(\d{2,3})%\s*VMA|(\d{2,3})%\s*VMA/g, (match, lo, hi, single) => {
    if (lo && hi) {
      return `${calcPace(vma, parseInt(lo) / 100)}/km – ${calcPace(vma, parseInt(hi) / 100)}/km (${lo}-${hi}% VMA)`;
    }
    return `${calcPace(vma, parseInt(single) / 100)}/km (${single}% VMA)`;
  });
}

function buildCorps(libSession, vma) {
  const main     = libSession.main_set || '';
  const recovery = libSession.recovery || '';
  const cat      = (libSession.category || '').toLowerCase();
  const type     = (libSession.type || '').toLowerCase();

  // EF, RA: plain text — the EF display component handles them
  if (cat === 'endurance_fondamentale' || cat === 'recuperation_active') {
    return subsPaces(main, vma);
  }

  // Renforcement: keep reference text verbatim
  if (cat === 'renforcement') return main;

  // Sortie longue with phase splits (SL-07, SL-08, SL-09, SL-10)
  if (cat === 'sortie_longue') {
    const phases = main.split(/\s+(?:puis|→)\s+/);
    if (phases.length > 1) {
      const phaseLabels = ['Endurance fondamentale', 'Blocs tempo / Allure spécifique', 'Allure course'];
      return phases.map((p, i) =>
        `BLOC ${phaseLabels[i] || 'Phase ' + (i + 1)}\n• ${subsPaces(p.trim(), vma)}`
      ).join('\n\n');
    }
    return subsPaces(main, vma);
  }

  // Footing progressif: Phase 1 / Phase 2 / Phase 3
  if (cat === 'footing_progressif') {
    const phases = main.split(/\s*→\s*/);
    return phases.map((p, i) => `BLOC Phase ${i + 1}\n• ${subsPaces(p.trim(), vma)}`).join('\n\n');
  }

  // ── Natation ────────────────────────────────────────────────
  if (cat === 'natation') {
    // Endurance / récupération nage : plain (comme EF)
    if (type.includes('endurance') || type.includes('recuperation')) {
      return subsPaces(main, vma);
    }
    // Technique : phases split
    if (type.includes('technique')) {
      const phases = main.split(/\s*→\s*/);
      if (phases.length > 1)
        return phases.map((p, i) => `BLOC Exercice ${i + 1}\n• ${subsPaces(p.trim(), vma)}`).join('\n\n');
    }
    // Pyramide : split sur "→"
    if (main.includes('→')) {
      const phases = main.split(/\s*→\s*/);
      return phases.map((p, i) => `BLOC Phase ${i + 1}\n• ${subsPaces(p.trim(), vma)}`).join('\n\n');
    }
    // Intervalles / seuil / tempo / test nage : BLOC + Récupération
    const natLabel = type.includes('vitesse') ? 'Intervalles vitesse'
      : type.includes('seuil') || type.includes('tempo') ? 'Tempo / Seuil'
      : type.includes('test') ? 'Test chronométré'
      : 'Séries';
    let corps = `BLOC ${natLabel}\n• ${subsPaces(main, vma)}`;
    if (recovery) corps += `\n\nBLOC Récupération\n• ${subsPaces(recovery, vma)}`;
    return corps;
  }

  // ── Vélo ────────────────────────────────────────────────────
  if (cat === 'velo') {
    // Endurance / récupération vélo : plain
    if (type.includes('endurance') || type.includes('recuperation')) {
      return subsPaces(main, vma);
    }
    // Tempo / Sweet spot / Intervalles / Côtes : phases ou BLOC
    if (main.includes('→') || main.includes('puis')) {
      const phases = main.split(/\s*(?:→|puis)\s*/);
      return phases.map((p, i) => `BLOC Phase ${i + 1}\n• ${subsPaces(p.trim(), vma)}`).join('\n\n');
    }
    const velLabel = type.includes('intervalles') ? 'Intervalles FTP'
      : type.includes('tempo') ? 'Tempo / Sweet spot'
      : type.includes('cotes') ? 'Montées répétées'
      : type.includes('test') ? 'Test FTP'
      : 'Effort';
    let corps = `BLOC ${velLabel}\n• ${subsPaces(main, vma)}`;
    if (recovery) corps += `\n\nBLOC Récupération\n• ${subsPaces(recovery, vma)}`;
    return corps;
  }

  // ── Brique : split multi-phases sur BLOC intégré ────────────
  if (cat === 'brique') {
    // main_set already contains BLOC structure from the library
    return main;
  }

  // ── Trail ───────────────────────────────────────────────────
  if (cat === 'trail') {
    if (type.includes('endurance') || type.includes('simulation')) return main;
    if (main.includes('→')) {
      const phases = main.split(/\s*→\s*/);
      return phases.map((p, i) => `BLOC Phase ${i + 1}\n• ${subsPaces(p.trim(), vma)}`).join('\n\n');
    }
    const trailLabel = type.includes('fractionne') ? 'Intervalles côtes'
      : type.includes('technique') ? 'Technique'
      : type.includes('montagne') ? 'Montée'
      : 'Effort';
    let corps = `BLOC ${trailLabel}\n• ${subsPaces(main, vma)}`;
    if (recovery) corps += `\n\nBLOC Récupération\n• ${subsPaces(recovery, vma)}`;
    return corps;
  }

  // ── FC, FL, T, CO, SP (course à pied) ───────────────────────
  const blocLabel = {
    fractionne_court: 'Intervalles',
    fractionne_long:  'Intervalles',
    tempo_seuil:      'Tempo / Seuil',
    cotes:            'Montées',
    specifique:       'Allure course',
  }[cat] || 'Effort';

  let corps = `BLOC ${blocLabel}\n• ${subsPaces(main, vma)}`;
  if (recovery) {
    corps += `\n\nBLOC Récupération\n• ${subsPaces(recovery, vma)}`;
  }
  return corps;
}

// Maps library category → display type (used for colors in the UI)
const CATEGORY_TO_TYPE = {
  natation_endurance:   'Natation endurance',
  natation_vitesse:     'Natation vitesse',
  natation_seuil:       'Natation seuil',
  natation_tempo:       'Natation tempo',
  natation_technique:   'Natation technique',
  natation_test:        'Natation test',
  natation_recuperation:'Natation récupération',
  natation:             'Natation',
  velo_endurance:       'Vélo endurance',
  velo_tempo:           'Vélo tempo',
  velo_intervalles:     'Vélo intervalles',
  velo_cotes:           'Vélo côtes',
  velo_test:            'Vélo test',
  velo_recuperation:    'Vélo récupération',
  velo:                 'Vélo',
  brique:               'Brique',
  trail_endurance:      'Trail endurance',
  trail_fractionne:     'Trail fractionné',
  trail_cotes:          'Trail côtes',
  trail_technique:      'Trail technique',
  trail_montagne:       'Trail montagne',
  trail_simulation:     'Trail simulation',
};

function injectLibraryContent(planData, libMap, vma) {
  if (!libMap || !planData?.semaines) return planData;
  for (const sem of planData.semaines) {
    for (const s of (sem.seances || [])) {
      const lib = libMap[s.id_seance];
      if (!lib) continue;

      // Source of truth: duration and display type from library
      s.duree_min = lib.duration_min;

      // Force correct display type for color consistency
      const mappedType = CATEGORY_TO_TYPE[lib.type] || CATEGORY_TO_TYPE[lib.category];
      if (mappedType) s.type = mappedType;

      // Echauffement & retour from library (with paces substituted)
      s.echauffement    = lib.warmup   ? subsPaces(lib.warmup,   vma) : '';
      s.retour_au_calme = lib.cooldown ? subsPaces(lib.cooldown, vma) : '';

      // Corps: structured BLOC/bullet format from library content
      s.corps = buildCorps(lib, vma);

      // Coach notes from library (keep AI's if library has none)
      if (lib.coach_notes) s.notes_coach = lib.coach_notes;
    }
  }
  return planData;
}

// ─── System prompt (rules) ────────────────────────────────────────────────────

const PLAN_RULES = `Tu es le moteur de génération de plans d'entraînement running de The Ultimate Academy.
Tu génères des plans ultra-personnalisés pour le coach Alexis. Tu NE communiques JAMAIS avec l'athlète.
Tu retournes UNIQUEMENT du JSON valide, sans aucun texte autour, sans markdown, sans explication.

RÈGLE ABSOLUE — TUTOIEMENT OBLIGATOIRE
TOUJOURS tutoyer l'athlète dans TOUS les textes (corps, echauffement, retour_au_calme, notes_coach, titre, message_du_mois).
JAMAIS vouvoyer : interdit d'écrire "vous", "votre", "vos", "Restez", "Hydratez-vous", "Faites", "Gardez", "Arrêtez", etc.
TOUJOURS utiliser : "tu", "te", "toi", "ton", "ta", "tes", "Reste", "Hydrate-toi", "Fais", "Garde", "Arrête-toi", etc.
Le lien coach-athlète est proche et direct — on se tutoie toujours.

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
EXCEPTION ABSOLUE — ENDURANCE FONDAMENTALE (EF) ET SORTIE LONGUE :
- AUCUN échauffement, AUCUN retour au calme pour ces deux types.
- Corps uniquement. Les champs "echauffement" et "retour_au_calme" DOIVENT être vides ("") pour toutes les séances EF et Sortie longue.
- EF : {durée} min à 65-72% VMA ({allure_min}/km – {allure_max}/km) — allure au ressenti.
- Sortie longue : {durée} min à 65-72% VMA ({allure}/km) — endurance aérobie.

OBLIGATOIRE sur TOUTES les autres séances course :
Échauffement MINIMUM 25 minutes : footing progressif. Sur séances dures (fractionné, tempo, côtes) : terminer par quelques accélérations progressives et la routine des gammes athlétiques.
Retour au calme MINIMUM 10 minutes : footing très lent à 60-63% VMA.

RÈGLE 3 — VOLUME HEBDOMADAIRE CIBLE
OBJECTIF FIXE : chaque semaine normale doit totaliser environ 30 km (hors affûtage et décharge).
- Semaines normales : 28 à 32 km au total
- Semaines de décharge : 18 à 22 km
- Semaines d'affûtage S-2 : ~18 km · S-1 (semaine course) : ~12 km
- Répartis sur toutes les séances de la semaine via les durées × allure
Augmentation maximum 10% par semaine. Si RPE moyen > 7.5 deux semaines de suite → déclencher décharge immédiate.

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
• AUCUNE sortie longue pendant l'affûtage — max 25 min EF
• AUCUN seuil long / tempo long — au maximum 1 bloc très court à allure objectif (2×1000m ou 3×1000m légers, absolument pas plus)
• Travail uniquement : footings EF 20-25 min + 6 lignes droites 80m progressives + gammes athlétiques. 1 séance courte allure course à très faible volume (2×1000m ou 3×1000m légers maximum)
• Dernière séance dure minimum J-10 avant la course
VEILLE DE COURSE (J-1) : séance d'activation OBLIGATOIRE = EXACTEMENT 20-25 min de footing très léger + 6 lignes droites 80m progressives + gammes athlétiques. JAMAIS 50 min la veille. JAMAIS de vraie séance. Code : EF-01 ou créer une séance d'activation spécifique si disponible dans la bibliothèque.

RÈGLE 6 — VARIÉTÉ DES SÉANCES (RÈGLE ABSOLUE — AUCUNE EXCEPTION)

SOURCE UNIQUE : Tu dois OBLIGATOIREMENT choisir TOUTES les séances depuis la bibliothèque ci-dessous.
Il est STRICTEMENT INTERDIT d'inventer un code ou une séance absente de cette liste.
Codes disponibles réels :
  Fractionné court : FC-01 à FC-06
  Fractionné long  : FL-01 à FL-14
  Sortie longue    : SL-01 à SL-06
  Tempo/Seuil      : T-01 à T-05
  Côtes            : CO-01 à CO-03
  Footing progressif : FP-01 à FP-03
  Endurance fond.  : EF-01 à EF-04
  Récupération act.: RA-01 à RA-02
  Spécifique       : SP-01 à SP-05
  Renforcement     : RENFO-01 à RENFO-05

RÈGLE D'ALTERNANCE OBLIGATOIRE — JAMAIS LE MÊME TYPE DEUX SEMAINES CONSÉCUTIVES :
  • Si semaine 1 contient un Fractionné court (FC-xx) → semaine 2 doit utiliser un Fractionné long (FL-xx) ou Côtes (CO-xx)
  • Si semaine 1 contient un Tempo/Seuil (T-xx) → semaine 2 doit utiliser un Fractionné (FC-xx ou FL-xx) ou Côtes
  • Si semaine impaire (S1, S3) contient VMA courte → semaines paires (S2, S4) doivent utiliser seuil/tempo
  • Alterner systématiquement : FC ↔ FL ↔ T ↔ CO ↔ SP sur les 4 semaines
  • La Sortie longue est obligatoire chaque semaine — alterner SL pure (S1/S3) et SL avec blocs tempo (S2/S4)

UNICITÉ DES CODES : INTERDIT de répéter le même id_seance PLUS D'UNE FOIS sur l'ensemble des 4 semaines du plan.
Chaque id_seance doit être UNIQUE sur les 4 semaines : si FL-03 est utilisé semaine 1, il est INTERDIT de l'utiliser en semaine 2, 3 ou 4.
Varier obligatoirement : si un type de séance (ex: fractionné 1000m) apparaît plusieurs fois, utiliser des codes DIFFÉRENTS (FL-01 + FL-03, jamais FL-01 + FL-01).
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
✓ echauffement_min_25min : toutes séances course SAUF EF et Sortie longue (corps uniquement)
✓ retour_calme_min_10min : toutes séances course SAUF EF et Sortie longue (corps uniquement)
✓ variete_seances_ok : pas le même id_seance deux fois dans l'ensemble du plan de 4 semaines — chaque code est unique
✓ recuperations_variees : temps de récup variés
✓ allures_toujours_specifiques : aucune description vague d'allure
✓ regles_toutes_respectees : toutes les règles ci-dessus
Si une règle n'est pas respectée → corriger avant soumission et documenter dans corrections_apportees.

RÈGLE 9 — ALLURES SPÉCIFIQUES OBLIGATOIRES
TOUJOURS calculer et afficher des allures précises en min/km et km/h pour chaque phase de chaque séance.
JAMAIS de formulations vagues du type : "allure très progressive", "allure confortable", "allure facile", "allure modérée".
CHAQUE phase de la séance (échauffement, corps, retour au calme) doit avoir sa valeur exacte calculée depuis la VMA — SAUF EF : corps uniquement avec plage 65-72% VMA (pas d'échauffement ni retour).
Dans le champ "corps" et "echauffement", toujours écrire : "X'XX/km (Y% VMA)" après chaque allure mentionnée.
Le tableau allures[] doit contenir TOUTES les zones distinctes de la séance. Pour les EF : allures[] = [{zone: "Corps", pourcentage_vma: 65, ...}, {zone: "Corps max", pourcentage_vma: 72, ...}] — pas de zone Échauffement ni Retour.

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
• Sorties longues EF AVEC ALTERNANCE OBLIGATOIRE :
  - Semaines impaires (S1, S3) : SL pure EF (SL-01, SL-02, SL-03, SL-04, SL-06)
  - Semaines paires (S2, S4) : SL avec blocs tempo ou allure spécifique (SL-07, SL-08, SL-09, SL-10 — OBLIGATOIRE)
  - INTERDIT d'utiliser SL pure EF deux semaines de suite
  - Pour semi/marathon : SL-08 et SL-10 incluent des blocs à allure objectif — utiliser en S2 et S4
• Footings progressifs VRAIS : 3 phases décrites explicitement — phase 1 (65-68% VMA), phase 2 (72-75%), phase 3 (80-85% = seuil)
• Footings EF simples (65-72% VMA) pour compléter le volume
POUR 3 SÉANCES/SEMAINE : rendre l'entraînement ludique et complet — footing EF ou progressif + séance intensive (FC, FL, T, CO ou SP en alternant) + sortie longue (pure ou avec blocs selon parité). Ne jamais répéter le même type deux semaines de suite.

RÈGLE 13 — TERRAIN D'ENTRAÎNEMENT (trail uniquement)
Si training_terrain est fourni dans le profil :
• montagne : côtes longues 200-400m à effort RPE 8-9, descentes techniques travaillées, sorties avec dénivelé positif cumulé, privilégier FL côtes et séances force montée
• semi_montagne : mix côtes courtes 100-200m + sorties partiellement plat/pente, 1 séance avec D+ sur 2 semaines
• ville_plat : escaliers répétés (cage d'escalier ou parking), marche nordique en côte, tapis incliné si disponible — mentionner ces alternatives dans le corps et notes_coach ; garder fractionnés sur piste/route
Exception terrain Ultra Marin (Réunion) : course essentiellement sur route, pas besoin de D+ — préparer comme un marathon haute distance (volume, seuil, allure)

RÈGLE 14 — COURSE INTERMÉDIAIRE (mini-affûtage dans la semaine de la course)
Si intermediate_race_date est fourni dans le profil et tombe dans la fenêtre du plan :
• Identifier la semaine OÙ SE SITUE la course intermédiaire (pas la semaine d'avant)
• Cette semaine = mini-affûtage ET course : volume réduit 40-50%, aucune séance dure, repos les 2 jours précédant la course, course le jour J
• Nombre de séances course dans la semaine de course : RESPECTER days_per_week — ex: si days_per_week=3 → 1 EF léger 25 min (début de semaine) + 1 activation J-1 (20-25 min footing très léger + lignes droites + gammes) + course le jour J = 3 séances course. Pour days_per_week=2 → 1 EF léger + course = 2 séances. Ne JAMAIS descendre sous days_per_week en semaine de course intermédiaire (la course compte comme une séance).
• La semaine AVANT la course intermédiaire = semaine de développement normale — PAS d'affûtage, PAS de réduction de charge
• INTERDIT de placer une sortie longue ou une séance dure dans la semaine de la course intermédiaire
• Charge de la semaine de la course = "Légère (mini-affûtage course intermédiaire)"
• Mentionner la course intermédiaire dans le message_du_mois

RÈGLE 14bis — SEMAINE APRÈS UNE COURSE INTERMÉDIAIRE (RÉCUPÉRATION OBLIGATOIRE)
La semaine qui SUIT immédiatement une course intermédiaire = récupération obligatoire, pas de développement :
• J+1 et J+2 après la course = REPOS COMPLET ABSOLU — jamais d'entraînement le lendemain d'une course (ex: course dimanche → lundi = repos total, mardi = repos total)
• Pas de séance placée un lundi ou mardi si la course était le dimanche
• Reprise uniquement à partir de J+3 : UNIQUEMENT EF-01 ou EF-02 (footing léger 35-45 min, 65-68% VMA) — jamais de sortie longue ni séance clé cette semaine-là
• AUCUNE séance dure (seuil, fractionné, tempo, côtes, spécifique) avant J+7 après la course — aucune exception, même si l'athlète se sent bien
• Pas de RENFO pendant les 48h post-course
• Charge de cette semaine = "Légère — Récupération post-course intermédiaire"
• Si cette semaine est la dernière du plan, concentrer sur la récupération et ne pas forcer le volume

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
INTERDIT d'utiliser un code qui n'existe pas dans la bibliothèque (ex: FC-07, FL-15, T-06, CO-04, EF-05, SL-07 n'existent PAS — ne les utilise jamais).
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

router.post('/plans/generate', requireAdminOrInternal, async (req, res) => {
  const { userId, profile: clientProfile, clientDate } = req.body;
  if (!userId || !clientProfile) return res.status(400).json({ error: 'Missing data' });

  // ── Guard: never generate if active or pending plan already exists ─────────────
  const { data: existingPlans } = await supabase
    .from('training_plans')
    .select('id,status')
    .eq('user_id', userId)
    .in('status', ['active', 'pending'])
    .limit(1);
  if (existingPlans?.length > 0) {
    const existing = existingPlans[0];
    return res.status(409).json({
      error: `Cet athlète a déjà un plan ${existing.status === 'active' ? 'actif' : 'en attente de validation'}. Modifiez-le directement ou archivez-le avant d'en générer un nouveau.`,
      existingPlanId: existing.id,
      existingStatus: existing.status,
    });
  }

  // Always re-fetch the latest profile from DB so any modifications are taken into account
  const { data: dbProfile } = await supabase.from('profiles').select('*').eq('id', userId).single();
  const profile = { ...clientProfile, ...(dbProfile || {}) };

  // Fetch codes used in the last active/archived plan to enforce variety
  const { data: lastPlans } = await supabase
    .from('training_plans')
    .select('plan_data')
    .eq('user_id', userId)
    .in('status', ['active', 'archived'])
    .order('created_at', { ascending: false })
    .limit(1);
  const recentlyUsedCodes = new Set();
  if (lastPlans?.[0]?.plan_data?.semaines) {
    for (const sem of lastPlans[0].plan_data.semaines) {
      for (const s of (sem.seances || [])) {
        if (s.id_seance && !['RACE', 'RACE_INT'].includes(s.id_seance)) recentlyUsedCodes.add(s.id_seance);
      }
    }
  }

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
  const preferredDays = profile.preferred_days || [];

  // After Thursday (dow >= 4) or Sunday (0): too late in the week — start from next Monday
  const isLateWeek    = todayDayNum === 0 || todayDayNum >= 4;
  const isPartialWeek = !isLateWeek && todayDayNum !== 1; // Tue or Wed: partial current week
  const remainingThisWeek = isPartialWeek
    ? preferredDays.filter(d => normDay(d) >= normToday)
    : [];
  const week1SessionCount = isPartialWeek ? remainingThisWeek.length : profile.days_per_week;

  // ── Calendar section for prompt ─────────────────────────────────────────────
  // Pre-compute the 4 week date ranges for the prompt
  const w1Mon = new Date(nextMonday); const w1Sun = new Date(w1Mon); w1Sun.setDate(w1Mon.getDate() + 6);
  const w2Mon = new Date(w1Mon); w2Mon.setDate(w1Mon.getDate() + 7); const w2Sun = new Date(w2Mon); w2Sun.setDate(w2Mon.getDate() + 6);
  const w3Mon = new Date(w1Mon); w3Mon.setDate(w1Mon.getDate() + 14); const w3Sun = new Date(w3Mon); w3Sun.setDate(w3Mon.getDate() + 6);
  const w4Mon = new Date(w1Mon); w4Mon.setDate(w1Mon.getDate() + 21); const w4Sun = new Date(w4Mon); w4Sun.setDate(w4Mon.getDate() + 6);

  const calendarSection = isLateWeek
    ? `CALENDRIER — 4 SEMAINES COMPLÈTES
Aujourd'hui ${todayISO} (${todayDayName}) — le plan démarre lundi prochain ${nextMondayISO}.

DATES IMPOSÉES — copier exactement ces valeurs dans le JSON "dates" de chaque semaine :
  Semaine 1 : debut="${localISO(w1Mon)}" fin="${localISO(w1Sun)}" → ${profile.days_per_week} séances course + 1 RENFO
  Semaine 2 : debut="${localISO(w2Mon)}" fin="${localISO(w2Sun)}" → ${profile.days_per_week} séances course + 1 RENFO
  Semaine 3 : debut="${localISO(w3Mon)}" fin="${localISO(w3Sun)}" → ${profile.days_per_week} séances course + 1 RENFO
  Semaine 4 : debut="${localISO(w4Mon)}" fin="${localISO(w4Sun)}" → ${profile.days_per_week} séances course + 1 RENFO

⛔ INTERDIT de créer une semaine avec debut="${todayISO}" ou toute date avant "${nextMondayISO}".
⛔ INTERDIT de créer une semaine vide ou une semaine "partielle".
Le plan contient EXACTEMENT 4 semaines, toutes avec des séances, toutes à partir du ${nextMondayISO}.`
    : isPartialWeek
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

  const recentCodesWarning = recentlyUsedCodes.size > 0
    ? `\n⚠ VARIÉTÉ OBLIGATOIRE — ces codes étaient dans le plan précédent, choisis des codes DIFFÉRENTS :
  ${[...recentlyUsedCodes].sort().join(', ')}
  (ex: si FL-06 est listé → utilise FL-03, FL-04, FL-08, FL-09 ou FL-11 à la place)`
    : '';

  const userPrompt = `Génère un plan d'entraînement running de EXACTEMENT 4 SEMAINES pour :${recentCodesWarning}

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
${(() => {
  const discipline = getDiscipline(profile.objective);
  if (discipline === 'triathlon') {
    const ftpStr = profile.ftp_known && profile.ftp_value ? `${profile.ftp_value}W (connue)` : 'inconnue — travailler en RPE et % FC max';
    const cssStr = profile.css_known && profile.css_value ? `${profile.css_value}/100m (connue)` : 'inconnue — programmer test CSS (NAT-13) en S1 ou S2';
    return `
PROFIL TRIATHLON :
Discipline : ${profile.objective} (${profile.objective === 'tri_sprint' ? '750m/20km/5km' : profile.objective === 'tri_olympic' ? '1500m/40km/10km' : profile.objective === 'tri_half' ? '1900m/90km/21km' : '3800m/180km/42km'})
Séances/semaine : ${profile.tri_swim_sessions || 2} natation · ${profile.tri_bike_sessions || 2} vélo · ${profile.tri_run_sessions || 2} course
Niveau natation : ${profile.tri_swim_level || 'non précisé'}
CSS : ${cssStr}
FTP vélo : ${ftpStr}
Eau libre : ${profile.open_water || 'non précisé'}
Vélo : ${profile.bike_type || 'non précisé'}
Expérience triathlon : ${profile.tri_experience || 'non précisée'}

RÈGLES TRIATHLON OBLIGATOIRES :
- Générer des séances pour LES 3 DISCIPLINES + 1 brique chaque semaine
- Chaque séance porte un id_seance de la bibliothèque (NAT-xx, VEL-xx, BRK-xx, ou codes running)
- La course à pied est la PRIORITÉ — placer les séances course les jours clés
- JAMAIS 2 séances dures le même jour
- 1 jour repos total minimum par semaine
- Périodisation : ${profile.objective === 'tri_sprint' ? '8-12 semaines' : profile.objective === 'tri_olympic' ? '12-16 semaines' : profile.objective === 'tri_half' ? '16-20 semaines' : '20-30 semaines'}
- Le champ "type" des séances : natation = "Natation", vélo = "Vélo", brique = "Brique", course = type running habituel

⛔ RÈGLE TERRAIN VÉLO :
Si training_terrain = 'ville_plat' → INTERDIT d'utiliser VEL-10 (côtes répétées vélo).
Si training_terrain = 'montagne' ou 'semi_montagne' → VEL-10 autorisé.

⛔ RÈGLE BRIQUE — ABSOLUE ET NON NÉGOCIABLE :
CHAQUE SEMAINE d'entraînement DOIT contenir EXACTEMENT 1 brique (BRK-xx), placée de préférence le samedi.
AUCUNE semaine sans brique.

⛔ RÈGLE COMPTAGE SÉANCES AVEC BRIQUE :
La brique remplace des séances des disciplines qu'elle contient. NE PAS ajouter de séances supplémentaires pour ces disciplines.
- BRK contenant natation (BRK-05, BRK-06) → compte comme 1 séance natation + 1 séance vélo. Ajouter seulement (tri_swim_sessions - 1) séances natation additionnelles.
- BRK contenant vélo + course (BRK-01, BRK-02, BRK-03, BRK-04, BRK-07, BRK-08) → compte comme 1 séance vélo + 1 séance course. Ajouter seulement (tri_bike_sessions - 1) vélos et (tri_run_sessions - 1) courses additionnelles.
- BRK-06 (nage + vélo + course) → compte comme 1 natation + 1 vélo + 1 course. Soustraire respectivement.
Exemple : tri_swim_sessions=2, tri_bike_sessions=2, tri_run_sessions=2 + BRK-01 (vélo+course) → ajouter : 2 natations, 1 vélo, 1 course (+ brique).

⛔ RÈGLE AFFÛTAGE TRIATHLON (semaine de course ou mini-affûtage) :
UNIQUEMENT ces séances — pas plus :
• 1 footing EF léger 25-35 min (EF-01 ou EF-02)
• 1 sortie vélo endurance légère max 45-60 min (VEL-01 ou VEL-11)
• 1 natation légère 1000-1500m (NAT-01 ou NAT-15)
• 1 brique très courte ou légère (BRK-01 ou BRK-07)
• 1 activation J-1 (EF-01, 20-25 min, footing léger + gammes)
• 1 RENFO mobilité (RENFO-05)
AUCUNE séance intensive. AUCUNE longue sortie. Pas plus de 6 séances au total.

⛔ RÈGLE COURSE — NE JAMAIS CRÉER DE SÉANCE RACE :
NE JAMAIS utiliser un code NAT-xx, VEL-xx ou BRK-xx pour représenter la course objectif ou intermédiaire.
Le jour de course dans le plan DOIT rester VIDE (sans séance) — la course est injectée automatiquement par le système.
Un athlète triathlon court au jour J avec id_seance="RACE_INT" ou "RACE" injecté automatiquement.`;
  }
  if (discipline === 'trail') {
    const denivele = profile.race_denivele ? `${profile.race_denivele}m D+` : 'non précisé';
    const terrain = profile.training_terrain || 'ville_plat';
    const isMontagne = terrain === 'montagne';
    return `
PROFIL TRAIL :
Distance objectif : ${profile.objective}
Dénivelé course : ${denivele}
Terrain entraînement : ${terrain}
Expérience trail : ${profile.trail_experience || 'non précisée'}
Bâtons : ${profile.trail_poles || 'non précisé'}

RÈGLES TRAIL OBLIGATOIRES :
- Plans en TEMPS (minutes/heures), pas en km (sauf courses objectif)
- Inclure des séances spécifiques trail (TR-xx) dans toutes les semaines
- ${isMontagne ? 'Utiliser les séances MON-xx (montagne) en priorité pour le travail de dénivelé' : 'Utiliser TR-05 et TR-07 pour simuler le D+. Séances MON-xx INTERDITES (réservées montagne)'}
- Progresser le D+ accumulé semaine par semaine
- Sortie longue trail = temps sur pied, marcher dans les côtes > 15%
- Technique descente obligatoire (TR-06) 1x par plan minimum`;
  }
  return '';
})()}

${calendarSection}

Calcule les dates exactes de chaque séance à partir du calendrier ci-dessus.
Assigne chaque séance à un des jours préférés de l'athlète disponibles dans la semaine concernée.

${buildPaceSection(vma, profile.objective, profile.chrono_goal_known ? profile.chrono_goal : null)}

STRUCTURE IMPOSÉE (respecte exactement) :
${structureDesc}

DATES OBLIGATOIRES DES SEMAINES — utilise EXACTEMENT ces valeurs dans le champ "dates" de chaque semaine :
  S1 : debut="${localISO(w1Mon)}" fin="${localISO(w1Sun)}"
  S2 : debut="${localISO(w2Mon)}" fin="${localISO(w2Sun)}"
  S3 : debut="${localISO(w3Mon)}" fin="${localISO(w3Sun)}"
  S4 : debut="${localISO(w4Mon)}" fin="${localISO(w4Sun)}"

CONTRAINTES ABSOLUES — vérifie et documente dans auto_validation avant de soumettre :
1. EXACTEMENT 4 semaines avec les phases et charges ci-dessus — S1 debut="${localISO(w1Mon)}", S4 debut="${localISO(w4Mon)}"
2. ${isLateWeek ? `Semaines 1-4 : EXACTEMENT ${profile.days_per_week} séances course + 1 RENFO chacune — toutes complètes.` : `Semaine 1 : ${week1SessionCount} séances course${week1SessionCount > 0 ? ' + 1 RENFO' : ' (partielle — adapter si peu de jours restants)'}. Semaines 2-4 : EXACTEMENT ${profile.days_per_week} séances course + 1 RENFO — ni plus, ni moins.`} Les séances RA (récupération active) comptent dans ce total.
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
18. FRACTIONNÉ 2000m : OBLIGATOIREMENT à 85% VMA exactement = ${calcPace(vma, 0.85)}/km pour VMA ${vma}. JAMAIS à 80%, JAMAIS à 83%. Aucune exception.${profile.chrono_goal_known && calcTargetPace(profile.chrono_goal, profile.objective) ? `\n19. Allure objectif chrono = ${calcTargetPace(profile.chrono_goal, profile.objective)} (calculée depuis "${profile.chrono_goal}") — utilise cette valeur exacte pour tous les blocs spécifiques allure course` : ''}${hasIntermediateRace ? `\n${profile.chrono_goal_known && calcTargetPace(profile.chrono_goal, profile.objective) ? '20' : '19'}. RÉCUPÉRATION POST-COURSE INTERMÉDIAIRE (RÈGLE 14bis — ABSOLUE) : La semaine qui SUIT la course intermédiaire du ${new Date(profile.intermediate_race_date).toLocaleDateString('fr-FR')} doit être une semaine de récupération. J+1 et J+2 = repos complet. Aucun seuil/fractionné/tempo/côtes avant J+7. EF léger uniquement à partir de J+3 (25-35 min, 65-68% VMA). Charge = "Légère — Récupération post-course intermédiaire". JAMAIS de séance dure le lundi ou mardi après la course.` : ''}`;

  try {
    const { text: libraryText, map: libraryMap } = await loadSessionLibrary(profile.objective);
    const message = await client.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 16000,
      system:     buildSystemPrompt(libraryText),
      messages:   [{ role: 'user', content: userPrompt + '\n\nRÉPONDS UNIQUEMENT AVEC LE JSON — COMMENCE DIRECTEMENT PAR { SANS AUCUN TEXTE AVANT.' }]
    });

    const rawText  = message.content[0].text.trim();
    let jsonText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
    // Extract JSON object — strip any text before first { or after last }
    const jsonStart = jsonText.indexOf('{');
    const jsonEnd   = jsonText.lastIndexOf('}');
    if (jsonStart >= 0 && jsonEnd > jsonStart) jsonText = jsonText.slice(jsonStart, jsonEnd + 1);
    const parsed   = JSON.parse(jsonText);

    // Strip any empty/partial semaines the AI creates for the current partial week
    if (parsed.semaines) {
      parsed.semaines = parsed.semaines.filter(s => (s.seances || []).length > 0);
      parsed.semaines.forEach((s, i) => { s.numero = i + 1; });
    }

    // Inject library content (corps/echauffement/retour/duree_min) from DB — source of truth
    injectLibraryContent(parsed, libraryMap, vma);

    const planData = recalculateDistances(injectRaceSessions(parsed, profile), resolveVma(profile));

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
      sendCoachAlert(userId, `${profile?.first_name || "L'athlète"} a désactivé le mode canicule 🌡️ — retour aux séances normales.`);
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
      if (s.est_course) return s;
      if (s.id_seance === 'RACE' || s.id_seance === 'RACE_INT') return s;
      if (type.includes('course') || type.includes('compétition')) return s;

      const newDuration = roundTo5(Math.round((s.duree_min || 45) * 0.80));

      // ── Natation : garder la discipline (piscine = fraîche en été) ──────────
      if (type.includes('natation')) {
        return {
          ...s,
          titre:       (s.titre || s.type) + ' — Canicule 🌡️',
          duree_min:   newDuration,
          intensite:   'modérée',
          corps:       s.corps
            ? `${s.corps}\n\n(Volume réduit de 20% — canicule. La piscine reste fraîche, profites-en !)`
            : `${newDuration} min de nage en endurance à allure confortable — séance allégée.`,
          notes_coach: 'La piscine est un excellent refuge par la chaleur. Nage à ton rythme, pas de forçage.',
          rpe_cible:   Math.max(3, (s.rpe_cible || 5) - 1),
          est_seance_cle: false,
        };
      }

      // ── Vélo : garder la discipline, réduire volume et intensité ─────────────
      if (type.includes('vélo') || type.includes('velo')) {
        return {
          ...s,
          titre:       (s.titre || s.type) + ' allégé 🌡️',
          duree_min:   newDuration,
          intensite:   'facile',
          corps:       s.corps
            ? `${s.corps}\n\n(Volume réduit de 20% — canicule. Sors tôt le matin ou utilise un home trainer.)`
            : `${newDuration} min de vélo en endurance — séance allégée, allure confortable.`,
          notes_coach: 'Sors tôt le matin ou utilise un home trainer par cette chaleur. Hydrate-toi bien avant, pendant et après.',
          rpe_cible:   Math.max(3, (s.rpe_cible || 5) - 1),
          est_seance_cle: false,
        };
      }

      // ── Brique : garder mais alléger, conseil chaleur ─────────────────────────
      if (type.includes('brique')) {
        return {
          ...s,
          titre:       (s.titre || s.type) + ' allégée 🌡️',
          duree_min:   newDuration,
          intensite:   'facile',
          corps:       s.corps
            ? `${s.corps}\n\n(Séance allégée canicule : favorise la natation et le vélo, réduis la partie course.)`
            : `${newDuration} min — brique allégée, allure confortable dans toutes les disciplines.`,
          notes_coach: 'Par la chaleur, réduis surtout la partie course à pied. Natation et vélo sont plus supportables.',
          rpe_cible:   4,
          est_seance_cle: false,
        };
      }

      // ── Course/running avec intensité : garder l'intensité, réduire volume/allure ──
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

      // ── Course/running sans intensité : footing EF allégé ────────────────────
      return {
        ...s,
        type:            'Endurance fondamentale',
        titre:           'Footing allégé — Canicule 🌡️',
        duree_min:       newDuration, intensite: 'facile',
        echauffement:    '',
        corps:           `${newDuration} min à 65-72% VMA (${calcPace(vma, 0.65)}/km – ${calcPace(vma, 0.72)}/km) — allure au ressenti, réduis encore si c'est trop dur`,
        retour_au_calme: '',
        allures: [
          { zone: 'Min (65% VMA)', pourcentage_vma: 65, vitesse_kmh: parseFloat((vma * 0.65).toFixed(1)), allure_min_km: calcPace(vma, 0.65) + '/km' },
          { zone: 'Max (72% VMA)', pourcentage_vma: 72, vitesse_kmh: parseFloat((vma * 0.72).toFixed(1)), allure_min_km: calcPace(vma, 0.72) + '/km' },
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
    sendCoachAlert(userId, `${profile?.first_name || "L'athlète"} a activé le mode canicule 🌡️ — le plan de la semaine a été allégé.`);
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
      const t     = (s.type  || '').toLowerCase();
      const titre = (s.titre || '').toLowerCase();
      const code  = (s.id_seance || '').toLowerCase();
      const isNat  = t.includes('natation') || titre.includes('natation') || code.startsWith('nat-');
      const isVelo = t.includes('vélo') || t.includes('velo') || titre.includes('vélo') || titre.includes('velo') || code.startsWith('vel-');
      const isBri  = t.includes('brique') || titre.includes('brique') || code.startsWith('bri-');
      if (t.includes('renforcement')) return s;
      if (s.est_course) return s;

      // ── Natation : parfait cross-training running injury, garder ──────────────
      if (isNat) {
        return {
          ...s,
          titre:          (s.titre || s.type) + ' — Cross-training 🩹',
          intensite:      'modérée',
          corps:          s.corps
            ? `${s.corps}\n\n(Excellent cross-training pendant ta blessure — pas d'impact, continue à nager !)`
            : `${s.duree_min || 45} min de natation — idéal pour maintenir la forme sans contrainte articulaire.`,
          notes_coach:    'La natation est parfaite pendant une blessure running : zéro impact, maintien de la condition. Continue !',
          est_seance_cle: false,
        };
      }

      // ── Vélo : bon cross-training aussi, garder ───────────────────────────────
      if (isVelo) {
        return {
          ...s,
          titre:          (s.titre || s.type) + ' — Cross-training 🩹',
          intensite:      'modérée',
          corps:          s.corps
            ? `${s.corps}\n\n(Cross-training pendant ta blessure — sans impact, parfait pour maintenir ta forme !)`
            : `${s.duree_min || 45} min de vélo — maintien de la condition sans impact.`,
          notes_coach:    'Le vélo est parfait pendant une blessure running : maintient la condition cardio sans solliciter la zone blessée.',
          est_seance_cle: false,
        };
      }

      // ── Brique : supprimer la partie course, garder natation/vélo seulement ───
      if (isBri) {
        return {
          ...s,
          type:           'Natation endurance',
          titre:          'Natation seulement — Blessure 🩹',
          intensite:      'modérée',
          corps:          `${Math.min(s.duree_min || 45, 45)} min de natation — on supprime la partie course pendant ta blessure. Nage à allure confortable.`,
          notes_coach:    'On garde uniquement la natation de ta brique pendant ta blessure. La course attendra ta guérison.',
          rpe_cible:      4,
          est_seance_cle: false,
        };
      }

      // ── Course/running : adapter en footing très léger ────────────────────────
      const isIntensity = isIntensityType(s);
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
    sendCoachAlert(userId, `${profile?.first_name || "L'athlète"} a signalé une blessure 🩹 — le plan a été adapté en conséquence.`);
    res.json({ success: true, planData: updatedPlan });
  } catch (err) {
    console.error('[AdaptInjury]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/plans/fatigue-adapt ──────────────────────────────────────────

router.post('/plans/fatigue-adapt', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  try {
    const [{ data: profile }, { data: plan }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('training_plans').select('*').eq('user_id', userId).eq('status', 'active').single(),
    ]);

    if (!plan) return res.json({ success: false, planData: null });

    const vma          = resolveVma(profile);
    const weeksElapsed = getPlanWeeksElapsed(plan);
    const updatedPlan  = JSON.parse(JSON.stringify(plan.plan_data));

    const currentWeek = updatedPlan.semaines.find(s => s.numero === weeksElapsed);
    if (!currentWeek) return res.json({ success: false, reason: 'no_current_week' });

    if (!currentWeek._original_seances) {
      currentWeek._original_seances = JSON.parse(JSON.stringify(currentWeek.seances));
      currentWeek._original_charge  = currentWeek.charge;
    }
    currentWeek._adapted_for = 'fatigue';
    currentWeek.charge = 'Fatigue : Semaine allégée';

    // Semaine fatigue = séances légères dans chaque discipline, pas de conversion running forcée
    const lightDurations = [30, 35, 40, 45];
    let lightIdx = 0;
    currentWeek.seances = currentWeek.seances.map(s => {
      const t     = (s.type || '').toLowerCase();
      const titre = (s.titre || '').toLowerCase();
      const code  = (s.id_seance || '').toLowerCase();
      // Détection discipline multi-source (type + titre + code séance)
      const isNat  = t.includes('natation') || titre.includes('natation') || code.startsWith('nat-');
      const isVelo = t.includes('vélo') || t.includes('velo') || titre.includes('vélo') || titre.includes('velo') || code.startsWith('vel-');
      const isBri  = t.includes('brique') || titre.includes('brique') || code.startsWith('bri-');
      // Repos, renforcement et courses restent intacts
      if (t.includes('renforcement') || t.includes('repos') || s.est_course) return s;

      const dur = lightDurations[lightIdx++ % lightDurations.length];

      // ── Natation : garder la natation, juste alléger ──────────────────────────
      if (isNat) {
        return {
          ...s,
          type:           'Natation endurance',
          titre:          'Natation récupération 😴',
          duree_min:      dur,
          intensite:      'très facile',
          corps:          `${dur} min de nage douce en endurance — allure très confortable, aucune intensité. Séance de récupération active.`,
          notes_coach:    'Ton corps a besoin de souffler. Nage tranquillement, sens l\'eau, pas de forçage.',
          rpe_cible:      2,
          est_seance_cle: false,
        };
      }

      // ── Vélo : garder le vélo, juste alléger ─────────────────────────────────
      if (isVelo) {
        return {
          ...s,
          type:           'Vélo endurance',
          titre:          'Vélo récupération 😴',
          duree_min:      dur,
          intensite:      'très facile',
          corps:          `${dur} min de vélo en endurance fondamentale — cadence souple, allure très facile, aucune accélération. Récupération active.`,
          notes_coach:    'Ton corps a besoin de souffler. Pédale en douceur, sans forcer.',
          rpe_cible:      2,
          est_seance_cle: false,
        };
      }

      // ── Brique : alléger mais garder les deux disciplines, pas de conversion running ──
      if (isBri) {
        const shortDur = Math.max(30, Math.round((s.duree_min || 60) * 0.65));
        return {
          ...s,
          titre:           (s.titre || 'Brique') + ' — allégée 😴',
          duree_min:       shortDur,
          intensite:       'très facile',
          corps:           s.corps
            ? `${s.corps}\n\n(Séance allégée — durée réduite de 35%, intensité très facile. Écoute ton corps.)`
            : `Brique légère ${shortDur} min — allure endurance confortable, aucun effort intense.`,
          notes_coach:    'Ton corps a besoin de souffler. On réduit la durée et l\'intensité de la brique, mais on garde les deux disciplines.',
          rpe_cible:      3,
          est_seance_cle: false,
        };
      }

      // ── Course/running : footing EF léger ─────────────────────────────────────
      return {
        ...s,
        type:            'Endurance fondamentale',
        titre:           'Footing récupération 😴',
        duree_min:       dur,
        intensite:       'très facile',
        echauffement:    '',
        corps:           `${dur} min à 65-72% VMA (${calcPace(vma, 0.65)}/km à ${calcPace(vma, 0.72)}/km) — allure au ressenti. Séance de récupération active.`,
        retour_au_calme: '',
        allures: [
          { zone: 'Min (65% VMA)', pourcentage_vma: 65, vitesse_kmh: parseFloat((vma * 0.65).toFixed(1)), allure_min_km: calcPace(vma, 0.65) + '/km' },
          { zone: 'Max (72% VMA)', pourcentage_vma: 72, vitesse_kmh: parseFloat((vma * 0.72).toFixed(1)), allure_min_km: calcPace(vma, 0.72) + '/km' },
        ],
        notes_coach:    'Ton corps a besoin de souffler. Reste dans ta zone de confort, pas de forçage.',
        rpe_cible:      3,
        est_seance_cle: false,
      };
    });

    recalculateDistances(updatedPlan, vma);
    await supabase.from('training_plans').update({ plan_data: updatedPlan }).eq('id', plan.id);
    sendCoachAlert(userId, `${profile?.first_name || "L'athlète"} a signalé de la fatigue 😴 — la semaine a été allégée.`);
    res.json({ success: true, planData: updatedPlan });
  } catch (err) {
    console.error('[FatigueAdapt]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/plans/restore-week ───────────────────────────────────────────

router.post('/plans/restore-week', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  try {
    const [{ data: plan }, { data: profile }] = await Promise.all([
      supabase.from('training_plans').select('*').eq('user_id', userId).eq('status', 'active').single(),
      supabase.from('profiles').select('*').eq('id', userId).single(),
    ]);

    if (!plan) return res.json({ success: false, reason: 'no_plan' });

    const updatedPlan = JSON.parse(JSON.stringify(plan.plan_data));
    const anyAdapted = updatedPlan.semaines.find(w => w._adapted_for);

    if (!anyAdapted) {
      await supabase.from('profiles').update({ heat_mode: false }).eq('id', userId);
      return res.json({ success: true, planData: plan.plan_data });
    }

    const adaptedFor = anyAdapted._adapted_for;

    if (adaptedFor === 'injury') {
      // Progressive recovery: replace intensity with progressif for current & next week
      const vma = resolveVma(profile);
      const weeksElapsed = getPlanWeeksElapsed(plan);

      function makeProgressifSession(s, phase) {
        const type = (s.type || '').toLowerCase();
        const isIntensity = type.includes('fractionné') || type.includes('vma') ||
                            type.includes('seuil') || type.includes('côtes') ||
                            type.includes('spécifique') || type.includes('interval');
        const isHardIntensity = type.includes('fractionné') || type.includes('vma') || type.includes('côtes');
        if (phase === 'current' && !isIntensity) return s;
        if (phase === 'next'    && !isHardIntensity) return s;
        const dur     = phase === 'current' ? 35 : 45;
        const main    = dur - 10;
        const chunk   = Math.round(main / 3);
        return {
          ...s,
          type:            'Footing progressif',
          titre:           phase === 'current' ? 'Footing de reprise progressif 🩹' : 'Footing progressif — reprise S2 🩹',
          duree_min:       dur,
          intensite:       phase === 'current' ? 'très facile' : 'facile',
          echauffement:    `5 min de footing très léger à ${calcPace(vma, 0.60)}/km`,
          corps:           phase === 'current'
            ? `${main} min progressif : ${chunk} min à ${calcPace(vma, 0.63)}/km → ${chunk} min à ${calcPace(vma, 0.65)}/km → ${chunk} min à ${calcPace(vma, 0.68)}/km. Arrête-toi si douleur.`
            : `${main} min progressif : ${chunk} min à ${calcPace(vma, 0.65)}/km → ${chunk} min à ${calcPace(vma, 0.68)}/km → ${chunk} min à ${calcPace(vma, 0.72)}/km. Pas encore de fractionné.`,
          retour_au_calme: `5 min très léger à ${calcPace(vma, 0.60)}/km + étirements doux`,
          allures:         phase === 'current' ? [
            { zone: 'Phase 1', pourcentage_vma: 63, vitesse_kmh: parseFloat((vma*0.63).toFixed(1)), allure_min_km: calcPace(vma,0.63)+'/km' },
            { zone: 'Phase 2', pourcentage_vma: 65, vitesse_kmh: parseFloat((vma*0.65).toFixed(1)), allure_min_km: calcPace(vma,0.65)+'/km' },
            { zone: 'Phase 3', pourcentage_vma: 68, vitesse_kmh: parseFloat((vma*0.68).toFixed(1)), allure_min_km: calcPace(vma,0.68)+'/km' },
          ] : [
            { zone: 'Phase 1', pourcentage_vma: 65, vitesse_kmh: parseFloat((vma*0.65).toFixed(1)), allure_min_km: calcPace(vma,0.65)+'/km' },
            { zone: 'Phase 2', pourcentage_vma: 68, vitesse_kmh: parseFloat((vma*0.68).toFixed(1)), allure_min_km: calcPace(vma,0.68)+'/km' },
            { zone: 'Phase 3', pourcentage_vma: 72, vitesse_kmh: parseFloat((vma*0.72).toFixed(1)), allure_min_km: calcPace(vma,0.72)+'/km' },
          ],
          recuperation:    null,
          notes_coach:     phase === 'current'
            ? 'Reprise post-blessure. Pas de pression sur le rythme — écoute ton corps. Arrête si douleur > 3/10.'
            : '2ème semaine de reprise. Tu peux sentir le retour de forme — reste en footing, pas encore de fractionné ni de côtes.',
          rpe_cible:       phase === 'current' ? 3 : 4,
          est_seance_cle:  false,
        };
      }

      for (const week of updatedPlan.semaines) {
        if (week._adapted_for !== 'injury') continue;
        const orig = week._original_seances || week.seances;
        if (week.numero === weeksElapsed) {
          week.seances = orig.map(s => makeProgressifSession(s, 'current'));
          week.charge  = 'Légère — Reprise post-blessure (S1)';
        } else if (week.numero === weeksElapsed + 1) {
          week.seances = orig.map(s => makeProgressifSession(s, 'next'));
          week.charge  = 'Légère — Reprise progressive (S2)';
        } else {
          week.seances = orig;
          if (week._original_charge) week.charge = week._original_charge;
        }
        delete week._adapted_for;
        delete week._original_seances;
        delete week._original_charge;
      }

      recalculateDistances(updatedPlan, vma);
      await supabase.from('training_plans').update({ plan_data: updatedPlan }).eq('id', plan.id);
      sendCoachAlert(userId, `${profile?.first_name || "L'athlète"} a désactivé l'adaptation blessure 🩹 — reprise progressive sur 2 semaines.`);
      return res.json({ success: true, planData: updatedPlan });
    }

    if (adaptedFor === 'heat') {
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
      await supabase.from('profiles').update({ heat_mode: false }).eq('id', userId);
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
    const restoreLabels = { heat: 'canicule 🌡️', cycle: 'cycle menstruel 🌸', fatigue: 'fatigue 😴' };
    sendCoachAlert(userId, `${profile?.first_name || "L'athlète"} a désactivé l'adaptation ${restoreLabels[adaptedFor] || adaptedFor} — retour aux séances normales.`);
    res.json({ success: true, planData: updatedPlan });
  } catch (err) {
    console.error('[RestoreWeek]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/plans/period-alert ───────────────────────────────────────────

router.post('/plans/period-alert', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });
  try {
    const [{ data: profile }, { data: plan }] = await Promise.all([
      supabase.from('profiles').select('first_name, last_name, period_pain_days, vma, vma_known, level').eq('id', userId).single(),
      supabase.from('training_plans').select('id, plan_data, activated_at, created_at')
        .eq('user_id', userId).eq('status', 'active').single()
    ]);
    if (!plan) return res.status(404).json({ error: 'Aucun plan actif trouvé.' });
    const painDays = profile?.period_pain_days || 1;
    const weeksElapsed = getPlanWeeksElapsed(plan);
    const updatedPlan = JSON.parse(JSON.stringify(plan.plan_data));
    const restSessions = Math.max(1, Math.round(painDays * 2 / 3));
    const currentWeek = updatedPlan.semaines.find(s => s.numero === weeksElapsed);
    if (currentWeek) {
      if (!currentWeek._original_seances) {
        currentWeek._original_seances = JSON.parse(JSON.stringify(currentWeek.seances));
        currentWeek._original_charge = currentWeek.charge;
      }
      currentWeek._adapted_for = 'cycle';
      let replaced = 0;
      for (let i = 0; i < currentWeek.seances.length; i++) {
        if (replaced >= restSessions) break;
        const s = currentWeek.seances[i];
        if ((s.type || '').toLowerCase().includes('renforcement')) continue;
        if (s.type === 'Repos') continue;
        currentWeek.seances[i] = { ...s, type: 'Repos', titre: 'Repos complet — période douloureuse 🌸',
          duree_min: 0, intensite: 'repos', echauffement: '',
          corps: 'Journée de repos complet. Accorde-toi du temps pour récupérer — ton corps en a besoin.',
          retour_au_calme: '', allures: [],
          notes_coach: 'Prends soin de toi. Hydrate-toi, repose-toi et écoute ton corps. On reprend dès que tu te sens prête.',
          rpe_cible: 0, est_seance_cle: false };
        replaced++;
      }
    }
    recalculateDistances(updatedPlan, resolveVma(profile));
    await supabase.from('training_plans').update({ plan_data: updatedPlan }).eq('id', plan.id);
    sendCoachAlert(userId, `${profile?.first_name || "L'athlète"} a activé l'adaptation cycle menstruel 🌸 — certaines séances ont été remplacées par du repos.`);
    res.json({ success: true, planData: updatedPlan });
  } catch (err) {
    console.error('[PeriodAlert]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/plans/recalculate-vma ────────────────────────────────────────

router.post('/plans/recalculate-vma', async (req, res) => {
  const { userId, newVma } = req.body;
  if (!userId || !newVma) return res.status(400).json({ error: 'Missing data' });

  try {
    const [{ data: plan }, { data: profile }] = await Promise.all([
      supabase.from('training_plans').select('*').eq('user_id', userId).eq('status', 'active').single(),
      supabase.from('profiles').select('*').eq('id', userId).single(),
    ]);

    if (!plan) return res.json({ success: true, updated: false });

    // Load validated sessions to avoid touching them
    const { data: completions } = await supabase
      .from('session_completions')
      .select('week_number, session_index')
      .eq('plan_id', plan.id);

    const validatedKeys = new Set(
      (completions || []).map(c => `${c.week_number}-${c.session_index}`)
    );

    const planData = JSON.parse(JSON.stringify(plan.plan_data));
    const vma      = parseFloat(newVma);

    // Load session library to rebuild corps/echauffement/retour with new VMA
    const { map: libMap } = await loadSessionLibrary(profile?.objective || 'running');

    planData.semaines?.forEach((week, _wi) => {
      week.seances?.forEach((seance, sessionIdx) => {
        const key = `${week.numero}-${sessionIdx}`;
        if (validatedKeys.has(key)) return; // séance déjà validée — on ne touche pas

        // Re-inject library content (corps/echauffement/retour) with new VMA
        const lib = libMap?.[seance.id_seance];
        if (lib) {
          seance.echauffement    = lib.warmup   ? subsPaces(lib.warmup,   vma) : '';
          seance.retour_au_calme = lib.cooldown ? subsPaces(lib.cooldown, vma) : '';
          seance.corps           = buildCorps(lib, vma);
        }

        // Recalculate allures[] with new VMA
        if (!Array.isArray(seance.allures)) return;
        seance.allures = seance.allures.map(a => {
          if (!a.pourcentage_vma) return a;
          const speed   = vma * (a.pourcentage_vma / 100);
          const paceMin = 60 / speed;
          const m       = Math.floor(paceMin);
          const s       = Math.round((paceMin - m) * 60);
          return {
            ...a,
            vitesse_kmh:   Math.round(speed * 10) / 10,
            allure_min_km: `${m}'${String(s).padStart(2, '0')}/km`,
          };
        });
      });
    });

    recalculateDistances(planData, vma);
    await supabase.from('training_plans').update({ plan_data: planData }).eq('id', plan.id);
    res.json({ success: true, updated: true, skipped: validatedKeys.size });
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

    const chargeSignal = analysisData.charge_signal || 'maintain';
    const chargeRule   = chargeSignal === 'reduce'
      ? 'RÉDUIRE la charge : -10 à -20% volume/intensité sur les séances dures, remplacer une séance intense par EF si nécessaire'
      : chargeSignal === 'increase'
      ? 'AUGMENTER légèrement : +1-2 reps ou +5% intensité sur les séances clés'
      : 'MAINTENIR : garder le plan tel quel sauf anomalie de RPE';

    const adjustPrompt = `Tu es le moteur d'ajustement de plans d'entraînement de The Ultimate Academy.
Retourne UNIQUEMENT du JSON valide, sans texte autour.

Analyse de la semaine ${weekNumber} :
- RPE moyen : ${analysisData.rpe_moyen || 'N/A'}/10
- Séances réalisées : ${analysisData.seances_realisees || '?'}/${analysisData.seances_planifiees || '?'}
- Signal de charge : ${chargeSignal.toUpperCase()} — ${chargeRule}
- Focus coach : ${analysisData.ajustement_semaine_suivante || 'maintenir'}

Séances prévues pour la semaine ${nextWeekNum} (${nextWeek.phase}, ${nextWeek.charge}) :
${JSON.stringify(nextWeek.seances, null, 2)}

Allures de référence (VMA ${vma} km/h) :
  EF (65-70%) : ${calcPace(vma, 0.65)}/km – ${calcPace(vma, 0.70)}/km
  Seuil (82-88%) : ${calcPace(vma, 0.82)}/km – ${calcPace(vma, 0.88)}/km
  Fractionné court (95-105%) : ${calcPace(vma, 0.95)}/km – ${calcPace(vma, 1.05)}/km
  Récup (60-65%) : ${calcPace(vma, 0.60)}/km – ${calcPace(vma, 0.65)}/km

Règles impératives :
- Respecter le signal de charge indiqué ci-dessus en priorité
- ${efMin} (JAMAIS en dessous)
- Ne jamais supprimer TOUTES les séances intenses d'un coup
- Séances non réalisées sans fatigue signalée : garder le volume

Retourne UNIQUEMENT :
{"seances": [ /* séances ajustées ou identiques */ ]}`;

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
      max_tokens: 2000,
      messages:   [{ role: 'user', content: analysisPrompt }]
    });

    const rawText  = message.content[0].text.trim();
    const jsonText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
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

router.post('/analyses/run-weekly', requireAdminOrInternal, async (req, res) => {
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

      const [{ data: completions }, { data: bilan }] = await Promise.all([
        supabase
          .from('session_completions')
          .select('*')
          .eq('user_id', athlete.id)
          .eq('plan_id', plan.id)
          .eq('week_number', weeksElapsed),
        supabase
          .from('weekly_bilans')
          .select('*')
          .eq('user_id', athlete.id)
          .eq('plan_id', plan.id)
          .eq('week_number', weeksElapsed)
          .maybeSingle(),
      ]);

      const plannedCount = weekData.seances?.length || 0;
      const rpeList      = (completions || []).filter(c => c.rpe).map(c => c.rpe);
      const avgRpe       = rpeList.length
        ? (rpeList.reduce((a, b) => a + b, 0) / rpeList.length).toFixed(1)
        : 'N/A';
      const rpeNum       = parseFloat(avgRpe);
      const loadSignal   = !isNaN(rpeNum)
        ? rpeNum > 8 ? 'RPE élevé — réduire la charge'
          : rpeNum < 5 ? 'RPE bas — augmenter la charge'
          : 'RPE dans la zone cible'
        : 'RPE non renseigné';

      // Day-of-week sort order
      const DAY_ORDER = { Lundi:1, Mardi:2, Mercredi:3, Jeudi:4, Vendredi:5, Samedi:6, Dimanche:7 };

      // Build session-by-session breakdown sorted chronologically
      const sessionsDetail = (weekData.seances || [])
        .map((s, idx) => {
          const comp = (completions || []).find(c => c.session_index === idx);
          return {
            idx,
            jour:      s.jour,
            type:      s.type,
            titre:     s.titre,
            duree_min: s.duree_min,
            done:      !!comp,
            rpe:       comp?.rpe || null,
            comment:   comp?.comment || null,
            completed_at: comp?.completed_at || null,
          };
        })
        .sort((a, b) => (DAY_ORDER[a.jour] || 8) - (DAY_ORDER[b.jour] || 8));

      // Count done from sessionsDetail (not raw completions, which may have ghost entries)
      const realDoneCount = sessionsDetail.filter(s => s.done).length;

      // Next week context for the focus
      const nextWeekData = plan.plan_data?.semaines?.find(s => s.numero === weeksElapsed + 1);
      const nextWeekStr  = nextWeekData
        ? (nextWeekData.seances || [])
            .slice().sort((a, b) => (DAY_ORDER[a.jour] || 8) - (DAY_ORDER[b.jour] || 8))
            .map(s => `  - ${s.jour} : ${s.titre} (${s.type}, ${s.duree_min || '?'} min)`)
            .join('\n')
        : '  (Dernière semaine du plan — pas de semaine suivante)';

      const sessionsDetailStr = sessionsDetail.map((s, i) =>
        `  [${i}] ${s.jour} : ${s.titre} (${s.type}, ${s.duree_min || '?'} min) ${s.done ? `✅ RPE ${s.rpe || '?'}${s.comment ? ' | Ressenti athlète: ' + s.comment : ''}` : '❌ non effectuée'}`
      ).join('\n');

      const sessionsJsonTemplate = sessionsDetail.map(s =>
        `    {"idx": ${s.idx}, "coach_comment": "${s.done ? 'Commentaire coach spécifique sur cette séance, 1-2 phrases' : 'Séance non effectuée — mot d\'encouragement court'}"}`
      ).join(',\n');

      const analysisPrompt = `Tu es le coach Alexis de The Ultimate Academy. Analyse la semaine ${weeksElapsed} de ${athlete.first_name}.
Retourne UNIQUEMENT du JSON valide, SANS markdown, SANS backticks.

Contexte semaine ${weeksElapsed} (${weekData.phase} — charge ${weekData.charge}) :
- Séances planifiées : ${plannedCount}
- Séances réalisées : ${realDoneCount}/${plannedCount}
- RPE moyen : ${avgRpe}/10
- Signal de charge : ${loadSignal}

Séances de la semaine écoulée (ordre chronologique) :
${sessionsDetailStr}

Séances PRÉVUES pour la semaine ${weeksElapsed + 1} (plan actuel, avant ajustement automatique) :
${nextWeekStr}
${bilan ? `
Bilan hebdomadaire rempli par l'athlète :
- Note globale : ${bilan.overall_rating}/10
- Fatigue : ${bilan.fatigue_level}/10
- Motivation : ${bilan.motivation_level}/10
- Sommeil : ${bilan.sleep_quality}/5
- Douleurs : ${bilan.pain_areas || 'Aucune'}
- Ce qui s'est bien passé : ${bilan.what_went_well || 'Non renseigné'}
- Ce qui a été difficile : ${bilan.what_was_hard || 'RAS'}
- Souhaits semaine prochaine : ${bilan.wishes_next_week || 'Non renseigné'}
- Message au coach : ${bilan.coach_message || 'Aucun'}` : ''}

RÈGLES pour les coach_comment :
- Écris un commentaire COACH pour CHAQUE séance, même un footing EF basique
- Mentionne le type de séance, ce que ça apporte à l'entraînement
- Appuie-toi sur le RPE et le ressenti si disponible
- Si RPE haut sur EF → signale qu'il faut rester léger la prochaine fois
- Style coach expert mais chaleureux, tutoiement, 1 à 2 phrases max
- JAMAIS de tiret long (—)

RÈGLES pour ajustement_semaine_suivante :
- Rédige le focus en te basant sur les séances RÉELLES prévues la semaine prochaine
- Mentionne des séances concrètes ("ta sortie longue de jeudi", "les fracs de mardi")
- Si RPE moyen ≥ 8 ou fatigue signalée : précise qu'on réduit la charge (le plan sera ajusté automatiquement)
- Si RPE < 5 : précise qu'on peut pousser davantage
- Sinon : focus sur ce qui compte dans la semaine à venir
- 2 à 3 phrases, tutoiement, ton coach

Format JSON strict :
{
  "resume": "2-3 phrases sur la semaine globale",
  "points_positifs": ["point1", "point2"],
  "points_attention": ["point si nécessaire, sinon tableau vide"],
  "ajustement_semaine_suivante": "focus basé sur les séances réelles de la semaine prochaine",
  "charge_signal": "reduce" ou "maintain" ou "increase",
  "seances_realisees": ${realDoneCount},
  "seances_planifiees": ${plannedCount},
  "rpe_moyen": ${isNaN(parseFloat(avgRpe)) ? 'null' : avgRpe},
  "sessions": [
${sessionsJsonTemplate}
  ]
}`;

      try {
        const msg = await client.messages.create({
          model:      'claude-sonnet-4-6',
          max_tokens: 1200,
          messages:   [{ role: 'user', content: analysisPrompt }]
        });

        const raw          = msg.content[0].text.trim();
        const jsonText     = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
        const analysisData = JSON.parse(jsonText);

        // Merge AI coach_comments into sessionsDetail
        const aiSessions = analysisData.sessions || [];
        const finalSessions = sessionsDetail.map(s => ({
          ...s,
          coach_comment: aiSessions.find(ai => ai.idx === s.idx)?.coach_comment || null,
        }));

        await supabase.from('weekly_analyses').insert({
          user_id:       athlete.id,
          week_number:   weeksElapsed,
          plan_id:       plan.id,
          analysis_data: { ...analysisData, sessions: finalSessions },
          coach_message: null,
          status:        'pending',
        });

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

router.post('/analyses/pre-race/run', requireAdminOrInternal, async (req, res) => {
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

router.post('/analyses/intermediate-post/run', requireAdminOrInternal, async (req, res) => {
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

        await client.messages.create({
          model: 'claude-sonnet-4-6', max_tokens: 350,
          messages: [{ role: 'user', content: prompt }]
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

router.post('/messages/generate-response', requireAdminOrInternal, async (req, res) => {
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

router.post('/plans/generate-monthly', requireAdminOrInternal, async (req, res) => {
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

    res.json({ success: true, regen_scheduled_for: regenAt.toISOString() });
  } catch (err) {
    console.error('[schedule-regen]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/plans/check-regen ─────────────────────────────────────────────
// Called by cron every 15 min — regenerates plans for athletes who modified key fields

router.post('/plans/check-regen', requireAdminOrInternal, async (req, res) => {
  // Auto-regen disabled — coach generates plans manually
  return res.json({ processed: 0, disabled: true });
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
                const st = (s.type || '').toLowerCase();
                if (st.includes('renforcement')) return s;
                if (s.est_course) return s;
                const newDuration = Math.min(50, Math.round((s.duree_min || 45) * 0.80));

                // Natation : garder la discipline (piscine = fraîche)
                if (st.includes('natation')) {
                  return {
                    ...s,
                    titre:       (s.titre || s.type) + ' — Canicule 🌡️',
                    duree_min:   newDuration,
                    intensite:   'modérée',
                    corps:       s.corps
                      ? `${s.corps}\n\n(Volume réduit de 20% — canicule. La piscine reste fraîche, profites-en !)`
                      : `${newDuration} min de nage en endurance — séance allégée.`,
                    notes_coach: 'La piscine est un excellent refuge par la chaleur. Nage à ton rythme.',
                    rpe_cible:   3, est_seance_cle: false,
                  };
                }

                // Vélo : garder la discipline, réduire volume
                if (st.includes('vélo') || st.includes('velo')) {
                  return {
                    ...s,
                    titre:       (s.titre || s.type) + ' allégé 🌡️',
                    duree_min:   newDuration,
                    intensite:   'facile',
                    corps:       s.corps
                      ? `${s.corps}\n\n(Volume réduit de 20% — canicule. Sors tôt ou utilise un home trainer.)`
                      : `${newDuration} min de vélo en endurance — séance allégée.`,
                    notes_coach: 'Sors tôt le matin ou utilise un home trainer. Hydrate-toi bien.',
                    rpe_cible:   3, est_seance_cle: false,
                  };
                }

                // Brique : alléger
                if (st.includes('brique')) {
                  return {
                    ...s,
                    titre:       (s.titre || s.type) + ' allégée 🌡️',
                    duree_min:   newDuration,
                    intensite:   'facile',
                    corps:       `${newDuration} min — brique allégée, favorise la natation et le vélo, réduis la partie course par cette chaleur.`,
                    notes_coach: 'Par la chaleur, réduis surtout la partie course. La natation et le vélo restent supportables.',
                    rpe_cible:   4, est_seance_cle: false,
                  };
                }

                // Course/running : footing EF allégé
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
                  rpe_cible:       3, est_seance_cle: false,
                };
              });
              updatedPlan.semaines[weekIdx].charge = 'Canicule — Allégé';
              await supabase.from('training_plans').update({ plan_data: updatedPlan }).eq('id', heatPlan.id);
            }
          }

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

// ─── POST /api/plans/reschedule-session ─── (athlete, bypasses RLS) ─────────
router.post('/plans/reschedule-session', async (req, res) => {
  const { userId, planId, weekNum, sessionIdx, newDay } = req.body;
  if (!userId || !planId || weekNum == null || sessionIdx == null || !newDay)
    return res.status(400).json({ error: 'Missing params' });

  try {
    // Refuse if this session is already completed
    const { data: existingComp } = await supabase
      .from('session_completions')
      .select('id')
      .eq('user_id', userId)
      .eq('plan_id', planId)
      .eq('week_number', weekNum)
      .eq('session_index', sessionIdx)
      .maybeSingle();
    if (existingComp) {
      return res.status(400).json({ error: 'Cette séance a déjà été effectuée et ne peut pas être déplacée.' });
    }

    const { data: plan, error: fetchErr } = await supabase
      .from('training_plans').select('plan_data').eq('id', planId).eq('user_id', userId).single();
    if (fetchErr || !plan) return res.status(404).json({ error: 'Plan not found' });

    const pd = JSON.parse(JSON.stringify(plan.plan_data));
    const week = pd.semaines.find(s => s.numero === weekNum);
    if (!week || !week.seances[sessionIdx])
      return res.status(404).json({ error: 'Session not found' });

    week.seances[sessionIdx].jour = newDay;

    const { error: updateErr } = await supabase
      .from('training_plans').update({ plan_data: pd }).eq('id', planId);
    if (updateErr) throw new Error(updateErr.message);

    res.json({ success: true, plan_data: pd });
  } catch (err) {
    console.error('[reschedule-session]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/athlete/weekly-bilan ─── (athlete submits their weekly recap) ──
router.post('/athlete/weekly-bilan', async (req, res) => {
  const {
    user_id, plan_id, week_number,
    overall_rating, fatigue_level, motivation_level, sleep_quality,
    pain_areas, what_went_well, what_was_hard, wishes_next_week, coach_message,
  } = req.body;

  if (!user_id || !plan_id || !week_number)
    return res.status(400).json({ error: 'Missing user_id, plan_id or week_number' });

  try {
    // Check if a bilan already exists for this week
    const { data: existing } = await supabase
      .from('weekly_bilans')
      .select('id')
      .eq('user_id', user_id)
      .eq('plan_id', plan_id)
      .eq('week_number', parseInt(week_number))
      .maybeSingle();

    if (existing) return res.status(409).json({ error: 'Bilan already submitted for this week' });

    const { data, error } = await supabase.from('weekly_bilans').insert({
      user_id,
      plan_id,
      week_number: parseInt(week_number),
      overall_rating:   overall_rating   ? parseInt(overall_rating)   : null,
      fatigue_level:    fatigue_level    ? parseInt(fatigue_level)    : null,
      motivation_level: motivation_level ? parseInt(motivation_level) : null,
      sleep_quality:    sleep_quality    ? parseInt(sleep_quality)    : null,
      pain_areas:       pain_areas       || null,
      what_went_well:   what_went_well   || null,
      what_was_hard:    what_was_hard    || null,
      wishes_next_week: wishes_next_week || null,
      coach_message:    coach_message    || null,
    }).select().single();

    if (error) throw error;
    res.json({ success: true, bilan: data });
  } catch (err) {
    console.error('[weekly-bilan] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
