-- ============================================================
-- SESSION LIBRARY — Patch 2
-- Montée des % VMA + ajout systématique des % manquants
-- À exécuter après patch1
-- ============================================================

-- ============================================================
-- 1. FRACTIONNÉ COURT — montée des intensités (toutes distances)
-- ============================================================

-- 200m : on monte encore (patch1 avait corrigé le SQL mais pas la DB)
UPDATE public.session_library SET
  main_set = '10x200m à 110-117% VMA'
WHERE code = 'FC-01';

UPDATE public.session_library SET
  main_set = '15x200m à 107-113% VMA'
WHERE code = 'FC-02';

UPDATE public.session_library SET
  main_set = '20x200m à 105-110% VMA'
WHERE code = 'FC-03';

-- 300m
UPDATE public.session_library SET
  main_set = '10x300m à 103-110% VMA'
WHERE code = 'FC-04';

UPDATE public.session_library SET
  main_set = '6 blocs : 300m à 103-108% VMA puis accélération sur les 100m finaux jusqu''à 112-120% VMA'
WHERE code = 'FC-05';

-- 400m
UPDATE public.session_library SET
  main_set = '6x400m à 100-107% VMA'
WHERE code = 'FC-06';

UPDATE public.session_library SET
  main_set = '8x400m à 100-107% VMA'
WHERE code = 'FC-07';

UPDATE public.session_library SET
  main_set = '10x400m à 100-107% VMA'
WHERE code = 'FC-08';

UPDATE public.session_library SET
  main_set = '12x400m à 98-105% VMA'
WHERE code = 'FC-09';

UPDATE public.session_library SET
  main_set = '3 séries de 4x400m à 100-107% VMA — récup 45'''' entre les 400m, 4min entre les séries'
WHERE code = 'FC-10';

-- 500m
UPDATE public.session_library SET
  main_set = '6x500m à 97-103% VMA'
WHERE code = 'FC-11';

UPDATE public.session_library SET
  main_set = '8x500m à 95-100% VMA'
WHERE code = 'FC-12';

-- Dégressif — ajout % VMA sur chaque distance
UPDATE public.session_library SET
  main_set = '3 séries de : 400m à 100-105% VMA → 300m à 105-110% VMA → 200m à 110-115% VMA → 100m à 115-122% VMA — récup 1''30 entre efforts, 4min entre séries'
WHERE code = 'FC-13';

-- Récup active — déjà dans patch1 mais on s'assure
UPDATE public.session_library SET
  main_set = '5 blocs : 200m à 110-117% VMA puis 200m trot lent à 65% VMA (récup active) — enchaîné sans s''arrêter'
WHERE code = 'FC-14';

-- Nouveaux 14/16/20x400m (du patch1 — on monte aussi)
UPDATE public.session_library SET
  main_set = '14x400m à 97-103% VMA'
WHERE code = 'FC-15';

UPDATE public.session_library SET
  main_set = '16x400m à 95-102% VMA'
WHERE code = 'FC-16';

UPDATE public.session_library SET
  main_set = '20x400m à 93-100% VMA'
WHERE code = 'FC-17';

-- ============================================================
-- 2. FRACTIONNÉ LONG — ajout % VMA manquants + montée légère
-- ============================================================

-- FL-19 : "allure marathon cible" → % VMA explicite
UPDATE public.session_library SET
  main_set = '3x2000m à 85-88% VMA → récup 3min → 2x2000m à 82-85% VMA (allure marathon) avec accélération sur les 200m finaux à 90-93% VMA'
WHERE code = 'FL-19';

-- FL-14 : 500m finaux montés (patch1 avait modifié, on consolide avec le bon %)
UPDATE public.session_library SET
  main_set = '4 blocs de : 500m à 100% VMA → récup 1''00 → 1000m à 90-93% VMA → récup 1''30 → 500m à 103% VMA — récup 4min entre les blocs'
WHERE code = 'FL-14';

-- FL-15 : 500m central monté
UPDATE public.session_library SET
  main_set = '3 blocs de : 1000m à 90-93% VMA → récup 1''30 → 500m à 103-107% VMA → récup 1''30 → 1000m à 90-93% VMA — récup 4''30 entre les blocs'
WHERE code = 'FL-15';

-- FL-16 : 500m final monté
UPDATE public.session_library SET
  main_set = '2000m à 83-87% VMA → récup 3''30 → 1500m à 87-90% VMA → récup 3''00 → 1000m à 90-95% VMA → récup 2''30 → 500m à 100-105% VMA'
WHERE code = 'FL-16';

-- FL-17 : 400m seuil → % VMA précis
UPDATE public.session_library SET
  main_set = '5 blocs : 1000m à 90-95% VMA → récup 1''00 → 400m à 83-87% VMA (allure seuil) — récup 3''00 entre blocs'
WHERE code = 'FL-17';

-- ============================================================
-- 3. SORTIE LONGUE — ajout % VMA sur les parties "allure cible"
-- ============================================================

UPDATE public.session_library SET
  main_set = '70 min à 65-72% VMA puis 20 min à allure semi-marathon (83-87% VMA) — simule les conditions de course sur la fin'
WHERE code = 'SL-08';

UPDATE public.session_library SET
  main_set = '90 min à 65-72% VMA puis 20 min à allure marathon (82-85% VMA) — simule les conditions de course sur la fin'
WHERE code = 'SL-09';

UPDATE public.session_library SET
  main_set = '80 min à 65-68% VMA → 25 min à 72-75% VMA → 15 min à allure marathon (82-85% VMA)'
WHERE code = 'SL-10';

-- SL-09 coach notes : on précise aussi dans les notes
UPDATE public.session_library SET
  coach_notes = 'La reine des sorties longues marathon. Les 20 dernières minutes à 82-85% VMA simulent les conditions de course. Sois prêt mentalement — l''allure doit tenir malgré la fatigue accumulée.'
WHERE code = 'SL-09';

-- ============================================================
-- 4. SPÉCIFIQUE — ajout % VMA sur les "allure cible" manquants
-- ============================================================

-- SP-02 : "allure objectif 10km" → % VMA
UPDATE public.session_library SET
  main_set = '4x2km à allure objectif 10km (90-95% VMA) — récup 2''30 trot lent entre chaque'
WHERE code = 'SP-02';

-- SP-03
UPDATE public.session_library SET
  main_set = '5x2km à allure objectif 10km (90-95% VMA) — récup 2''30 trot lent entre chaque'
WHERE code = 'SP-03';

-- SP-04
UPDATE public.session_library SET
  main_set = '3x3km à allure objectif semi-marathon (85-88% VMA) — récup 3min trot lent entre chaque'
WHERE code = 'SP-04';

-- SP-05
UPDATE public.session_library SET
  main_set = '4x3km à allure objectif semi-marathon (85-88% VMA) — récup 3min trot lent entre chaque'
WHERE code = 'SP-05';

-- SP-06
UPDATE public.session_library SET
  main_set = '3x5km à allure objectif marathon (82-85% VMA) — récup 4min trot lent entre chaque'
WHERE code = 'SP-06';

-- SP-07
UPDATE public.session_library SET
  main_set = '3x2km à allure objectif course (90-95% VMA) — récup 3min trot lent entre chaque'
WHERE code = 'SP-07';

-- SP-08 : partie marathon sans %VMA
UPDATE public.session_library SET
  main_set = '2x2km à 90-95% VMA → récup 4min → 3x2km à allure marathon (82-85% VMA) — récup 3min entre blocs marathon'
WHERE code = 'SP-08';

-- SP-09 : "allure objectif 10km" → % VMA
UPDATE public.session_library SET
  main_set = '10km continu à allure objectif 10km (90-95% VMA) — effort régulier, sans s''arrêter'
WHERE code = 'SP-09';

-- SP-10 : "allure semi" et "allure 10km" → % VMA
UPDATE public.session_library SET
  main_set = '50 min à 65-70% VMA → 20 min à allure semi-marathon (85-88% VMA) → 10 min à allure 10km (90-95% VMA) — terminer fort'
WHERE code = 'SP-10';

-- ============================================================
-- 5. BRIQUE — correction 60% VMA sur BRI-07
-- ============================================================

UPDATE public.session_library SET
  main_set = 'Vélo : 2h45 à 65-72% FTP → transition rapide → Course : 40min à 65-68% VMA (allure récupération-endurance)',
  coach_notes = 'Séance phare de préparation Ironman. Trois heures de vélo suivi d''une course — ton corps va apprendre à se réinitialiser. L''allure course doit rester gérée même si tu as envie d''aller plus vite. Journée de ravitaillement structuré.'
WHERE code = 'BRI-07';

-- ============================================================
-- 6. TEMPO — récup inter-blocs standardisée à 65-68% VMA
-- ============================================================

UPDATE public.session_library SET
  recovery = '2''30 footing lent à 65-68% VMA entre chaque répétition'
WHERE code = 'T-03';

UPDATE public.session_library SET
  recovery = '3''00 footing lent à 65-68% VMA entre chaque répétition'
WHERE code = 'T-08';

-- T-10 : récup variable → préciser
UPDATE public.session_library SET
  recovery = '3min footing lent à 65-68% VMA après le 1er bloc / 4min après le 2ème bloc'
WHERE code = 'T-10';
