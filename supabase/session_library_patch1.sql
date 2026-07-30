-- ============================================================
-- SESSION LIBRARY — Patch 1
-- Corrections intensités VMA + nouvelles séances
-- À exécuter après session_library_v2.sql
-- ============================================================

-- ============================================================
-- 1. CORRECTIONS INTENSITÉS — 60% VMA → 65% dans les cooldowns
--    et récupérations actives des FC/FL (règle universelle)
-- ============================================================

-- FC-14 : récup active 200m passait à 60% → 65%
UPDATE public.session_library
SET main_set = '5 blocs : 200m à 108-115% VMA puis 200m trot lent à 65% VMA (récup active) — enchaîné'
WHERE code = 'FC-14';

-- Cooldowns FC/FL : "60-63% VMA" → "65% VMA" dans les cooldowns
-- (les footing récup à 60% sont une CATÉGORIE à part, pas un cooldown standard)
UPDATE public.session_library
SET cooldown = '10 min footing lent à 65% VMA'
WHERE cooldown = '10 min footing très lent à 60-63% VMA'
  AND type IN ('fractionne_court', 'fractionne_long', 'tempo_seuil', 'cotes', 'specifique', 'footing_progressif');

-- T-08 et T-09 : récup entre blocs à "63-65%" → "65-68%"
UPDATE public.session_library
SET recovery = '3 min footing lent à 65-68% VMA entre chaque répétition'
WHERE code = 'T-08';

UPDATE public.session_library
SET recovery = '4 min footing lent à 65-68% VMA entre les 2 blocs'
WHERE code = 'T-04';

UPDATE public.session_library
SET recovery = '3 min footing lent à 65-68% VMA entre chaque répétition'
WHERE code = 'T-02';

UPDATE public.session_library
SET recovery = '2''30 footing lent à 65-68% VMA entre chaque répétition'
WHERE code = 'T-01';

UPDATE public.session_library
SET recovery = '4 min footing lent à 65-68% VMA entre les 2 blocs'
WHERE code = 'T-06';

UPDATE public.session_library
SET recovery = '5 min footing lent à 65-68% VMA entre les 2 blocs'
WHERE code = 'T-07';

-- ============================================================
-- 2. CORRECTIONS INTENSITÉS VMA — 200m, 300m, 400m trop faibles
-- ============================================================

-- FC-01 : 10x200m — pousser à 108-115%
UPDATE public.session_library
SET main_set = '10x200m à 108-115% VMA'
WHERE code = 'FC-01';

-- FC-02 : 15x200m — pousser à 105-112%
UPDATE public.session_library
SET main_set = '15x200m à 105-112% VMA'
WHERE code = 'FC-02';

-- FC-03 : 20x200m — pousser à 103-108%
UPDATE public.session_library
SET main_set = '20x200m à 103-108% VMA'
WHERE code = 'FC-03';

-- FC-04 : 10x300m — pousser à 100-108%
UPDATE public.session_library
SET main_set = '10x300m à 100-108% VMA'
WHERE code = 'FC-04';

-- FC-06 : 6x400m — pousser à 97-103%
UPDATE public.session_library
SET main_set = '6x400m à 97-103% VMA'
WHERE code = 'FC-06';

-- FC-07 : 8x400m — pousser à 97-103%
UPDATE public.session_library
SET main_set = '8x400m à 97-103% VMA'
WHERE code = 'FC-07';

-- FC-08 : 10x400m — pousser à 97-103%
UPDATE public.session_library
SET main_set = '10x400m à 97-103% VMA'
WHERE code = 'FC-08';

-- FC-09 : 12x400m — pousser à 95-100%
UPDATE public.session_library
SET main_set = '12x400m à 95-100% VMA'
WHERE code = 'FC-09';

-- FC-10 : 3x(4x400m) — pousser à 97-105%
UPDATE public.session_library
SET main_set = '3 séries de 4x400m à 97-105% VMA — récup 45'''' entre les 400m, 4min entre les séries'
WHERE code = 'FC-10';

-- FC-11 : 6x500m — pousser à 95-100%
UPDATE public.session_library
SET main_set = '6x500m à 95-100% VMA'
WHERE code = 'FC-11';

-- FC-12 : 8x500m — pousser à 93-98%
UPDATE public.session_library
SET main_set = '8x500m à 93-98% VMA'
WHERE code = 'FC-12';

-- FC-05 : sprint final 110-118%
UPDATE public.session_library
SET main_set = '6 blocs : 300m à 100-105% VMA puis accélération sur les 100m finaux jusqu''à 110-118% VMA'
WHERE code = 'FC-05';

-- FL-14 : ajuster le 500m final à 100%
UPDATE public.session_library
SET main_set = '4 blocs de : 500m à 97% VMA → récup 1''00 → 1000m à 88-90% VMA → récup 1''30 → 500m à 100% VMA — récup 4min entre les blocs'
WHERE code = 'FL-14';

-- FL-15 : 500m à 100-105%
UPDATE public.session_library
SET main_set = '3 blocs de : 1000m à 87-90% VMA → récup 1''30 → 500m à 100-105% VMA → récup 1''30 → 1000m à 87-90% VMA — récup 4''30 entre les blocs'
WHERE code = 'FL-15';

-- ============================================================
-- 3. NOUVELLES SÉANCES — INSERT
-- ============================================================

-- ── EF-06 : Endurance fondamentale 45min (manquante) ─────────
INSERT INTO public.session_library (code, type, category, name, duration_min, intensity_rpe, warmup, main_set, recovery, cooldown, coach_notes, compatible_goals, sport) VALUES
('EF-06', 'endurance_fondamentale', 'endurance_fondamentale', 'Endurance fondamentale 45min', 45, 5,
 NULL,
 '45 min à 65-72% VMA — zone aérobie confortable, allure régulière',
 NULL, NULL,
 'Entre le 40min et le 50min — la durée idéale pour consolider l''endurance de base sans trop fatiguer. Reste dans ta zone de confort du début à la fin.',
 ARRAY['5km', '10km', 'semi'], 'running');

-- ── FR-01, FR-02, FR-03 : Footing récupération (nouvelle catégorie) ──
INSERT INTO public.session_library (code, type, category, name, duration_min, intensity_rpe, warmup, main_set, recovery, cooldown, coach_notes, compatible_goals, sport) VALUES

('FR-01', 'footing_recuperation', 'footing_recuperation', 'Footing récupération 30min', 30, 2,
 NULL,
 '30 min footing récupération à 57-62% VMA — allure très lente, effort minimal, jambes qui tournent',
 NULL, NULL,
 'Zone de récupération absolue. Tu dois pouvoir tenir une conversation sans aucune difficulté. Si tu souffles, c''est que tu vas trop vite. L''objectif : activer la circulation, pas s''entraîner.',
 ARRAY['5km', '10km', 'semi', 'marathon'], 'running'),

('FR-02', 'footing_recuperation', 'footing_recuperation', 'Footing récupération 37min', 37, 2,
 NULL,
 '37 min footing récupération à 57-62% VMA — allure très lente, relâchement total',
 NULL, NULL,
 'Séance de récupération intermédiaire. L''allure doit être inconfortablement lente — c''est le signe que tu es dans la bonne zone. Profite-en pour travailler ta foulée et ton relâchement.',
 ARRAY['10km', 'semi', 'marathon'], 'running'),

('FR-03', 'footing_recuperation', 'footing_recuperation', 'Footing récupération 45min', 45, 3,
 NULL,
 '45 min footing récupération à 57-62% VMA — volume de récupération long, effort très facile',
 NULL, NULL,
 'Quarante-cinq minutes en zone de récupération — séance post-sortie longue ou post-compétition. Plus tu vas lentement, plus tu récupères vite. Contre-intuitif mais vrai.',
 ARRAY['semi', 'marathon'], 'running');

-- ── CO-10 à CO-16 : Nouvelles séances de côtes ───────────────
INSERT INTO public.session_library (code, type, category, name, duration_min, intensity_rpe, warmup, main_set, recovery, cooldown, coach_notes, compatible_goals, sport, montagne_only) VALUES

-- 8x150m à 18x150m
('CO-10', 'cotes', 'cotes', 'Côtes 8x150m — Résistance vitesse', 60, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '8x150m en côte à RPE 8/10 — effort soutenu et régulier sur toute la montée',
 'Descente trot lent — récupération active',
 '10 min footing lent à 65% VMA',
 'Le 150m est la distance idéale entre l''explosif et le résistant. Maintiens la foulée propre jusqu''en haut — c''est là que ça se gagne.',
 ARRAY['5km', '10km', 'semi', 'marathon'], 'running', false),

('CO-11', 'cotes', 'cotes', 'Côtes 10x150m — Volume résistance', 65, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '10x150m en côte à RPE 8/10 — effort régulier, foulée active',
 'Descente trot lent — récupération active',
 '10 min footing lent à 65% VMA',
 'Dix montées de 150m — le volume commence à peser. Les 3 dernières répétitions sont celles qui font la différence. Ne les bâcle pas.',
 ARRAY['5km', '10km', 'semi', 'marathon'], 'running', false),

('CO-12', 'cotes', 'cotes', 'Côtes 12x150m — Accumulation force', 70, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '12x150m en côte à RPE 7-8/10 — effort soutenu, technique constante',
 'Descente trot lent — récupération active',
 '10 min footing lent à 65% VMA',
 'Douze fois 150m — 1800m de montée au total. La fatigue s''accumule sur les fessiers et les mollets. Reste technique même quand ça brûle.',
 ARRAY['10km', 'semi', 'marathon'], 'running', false),

('CO-13', 'cotes', 'cotes', 'Côtes 15x150m — Endurance de force', 75, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '15x150m en côte à RPE 7-8/10 — effort régulier et constant du début à la fin',
 'Descente trot lent — récupération active',
 '10 min footing lent à 65% VMA',
 'Deux kilomètres deux cents de montée. La séance qui fait peur et qui livre. Les 5 dernières répétitions arrivent quand les fessiers et les mollets sont bien chargés. Mental requis.',
 ARRAY['10km', 'semi', 'marathon'], 'running', false),

('CO-14', 'cotes', 'cotes', 'Côtes 18x150m — Volume max force', 85, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '18x150m en côte à RPE 7/10 — l''allure est modérée mais le volume est élevé, maintiens jusqu''au bout',
 'Descente trot lent — récupération active',
 '10 min footing lent à 65% VMA',
 'Dix-huit fois 150m — 2700m de montée. Séance de force-endurance maximale. L''allure doit être gérable sinon tu exploseras avant la fin. Réserve cette séance pour les phases de charge.',
 ARRAY['semi', 'marathon'], 'running', false),

-- 10x200m à 20x200m (côtes)
('CO-15', 'cotes', 'cotes', 'Côtes 10x200m — Force résistance', 65, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '10x200m en côte à RPE 7-8/10 — effort régulier sur toute la montée',
 'Descente trot lent — récupération active',
 '10 min footing lent à 65% VMA',
 'Dix montées de 200m — deux kilomètres de montée au total. Le 200m demande une vraie gestion de l''effort : pars conservateur pour maintenir l''allure sur les dernières.',
 ARRAY['10km', 'semi', 'marathon'], 'running', false),

('CO-16', 'cotes', 'cotes', 'Côtes 14x200m — Accumulation force longue', 75, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '14x200m en côte à RPE 7-8/10 — effort soutenu, cadence de montée régulière',
 'Descente trot lent — récupération active',
 '10 min footing lent à 65% VMA',
 'Deux kilomètres huit cents de montée. Séance longue et exigeante. Fractionne mentalement en 3 blocs de 5 : 1-5 tu gères, 6-10 tu tiens, 11-14 tu lâches tout.',
 ARRAY['semi', 'marathon'], 'running', false),

('CO-17', 'cotes', 'cotes', 'Côtes 17x200m — Volume force avancé', 80, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '17x200m en côte à RPE 7/10 — allure modérée mais volume élevé',
 'Descente trot lent — récupération active',
 '10 min footing lent à 65% VMA',
 'Trois kilomètres quatre cents de montée. Pour coureurs expérimentés seulement. Hydrate-toi bien avant et prévois un gel si tu pars à jeun.',
 ARRAY['semi', 'marathon'], 'running', false),

('CO-18', 'cotes', 'cotes', 'Côtes 20x200m — Volume max côtes', 90, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '20x200m en côte à RPE 7/10 — l''allure est contrôlée, le volume est le stimulus',
 'Descente trot lent — récupération active',
 '10 min footing lent à 65% VMA',
 'Quatre kilomètres de montée. La séance côtes de référence pour les marathoniens et ultra-traileurs. Si l''allure s''effondre après le 14ème, c''est une information précieuse. Ne triche pas.',
 ARRAY['marathon'], 'running', false),

-- 300m jusqu'à 12x
('CO-19', 'cotes', 'cotes', 'Côtes 8x300m — Puissance aérobie longue', 70, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '8x300m en côte à RPE 7-8/10 — effort aérobie soutenu sur toute la montée',
 'Descente trot lent — récupération active',
 '10 min footing lent à 65% VMA',
 'Deux kilomètres quatre cents de montée. Le 300m en côte demande un vrai tempo — ni trop fort pour exploser, ni trop lent pour rater le stimulus. Cherche ton rythme de croisière.',
 ARRAY['semi', 'marathon'], 'running', false),

('CO-20', 'cotes', 'cotes', 'Côtes 10x300m — Volume puissance aérobie', 80, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '10x300m en côte à RPE 7-8/10 — maintiens l''allure sur les 10 répétitions',
 'Descente trot lent — récupération active',
 '10 min footing lent à 65% VMA',
 'Trois kilomètres de montée. Séance très complète qui développe simultanément la force et l''endurance aérobie. Les 3 dernières répétitions arrivent sur des jambes chargées — c''est exactement l''objectif.',
 ARRAY['semi', 'marathon'], 'running', false),

('CO-21', 'cotes', 'cotes', 'Côtes 12x300m — Volume max puissance', 90, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '12x300m en côte à RPE 7/10 — allure contrôlée, volume élevé',
 'Descente trot lent — récupération active',
 '10 min footing lent à 65% VMA',
 'Trois kilomètres six cents de montée — la séance côtes 300m de référence. Pars impérativement conservateur sur les 4 premières. Si les 4 dernières tiennent l''allure des premières, tu es au top.',
 ARRAY['marathon'], 'running', false);

-- ── FC-15, FC-16 : 14x400m et 16x400m ───────────────────────
INSERT INTO public.session_library (code, type, category, name, duration_min, intensity_rpe, warmup, main_set, recovery, cooldown, coach_notes, compatible_goals, sport) VALUES

('FC-15', 'fractionne_court', 'fractionne_court', '14x400m — Grand volume vitesse', 80, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '14x400m à 93-98% VMA',
 '1''00 en marchant entre chaque répétition',
 '10 min footing lent à 65% VMA',
 'Cinq kilomètres six cents de travail intensif. Séance longue — prévois ta nutrition et ton hydratation. Fractionne mentalement : 1-6 en gestion, 7-10 tu maintiens, 11-14 tu lâches tout ce qui reste.',
 ARRAY['10km', 'semi', 'marathon'], 'running'),

('FC-16', 'fractionne_court', 'fractionne_court', '16x400m — Volume vitesse expert', 90, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '16x400m à 92-97% VMA',
 '1''00 en marchant entre chaque répétition',
 '10 min footing lent à 65% VMA',
 'Six kilomètres quatre cents à intensité — séance de référence pour coureurs très confirmés. L''allure est légèrement réduite par rapport au 10x ou 12x pour tenir la distance. Régularité absolue.',
 ARRAY['semi', 'marathon'], 'running'),

('FC-17', 'fractionne_court', 'fractionne_court', '20x400m — Volume max 400m', 100, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '20x400m à 90-95% VMA',
 '1''00 en marchant entre chaque répétition',
 '10 min footing lent à 65% VMA',
 'Huit kilomètres à intensité. La grande séance 400m. Sur le papier, ça fait peur — c''est voulu. L''allure est gérée pour tenir 20 répétitions. Si tu arrives au 20ème aussi régulier qu''au 1er, tu es dans une forme exceptionnelle.',
 ARRAY['semi', 'marathon'], 'running');

-- ── Correction TYPE_LABELS pour footing_recuperation ─────────
-- (pas de SQL ici — à faire dans le composant React)
