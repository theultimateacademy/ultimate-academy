-- ============================================================
-- THE ULTIMATE ACADEMY — Session Library v2
-- Remise à zéro + nouvelles séances organisées
-- À exécuter dans le Supabase SQL editor
-- ============================================================

-- ── Nettoyage ────────────────────────────────────────────────
DELETE FROM public.session_library;

-- ── Colonnes sport / triathlon (si pas encore en place) ──────
ALTER TABLE public.session_library ADD COLUMN IF NOT EXISTS sport TEXT DEFAULT 'running';
ALTER TABLE public.session_library ADD COLUMN IF NOT EXISTS montagne_only BOOLEAN DEFAULT FALSE;
ALTER TABLE public.session_library ADD COLUMN IF NOT EXISTS triathlon_disciplines TEXT[];


-- ============================================================
-- COURSE À PIED — ENDURANCE FONDAMENTALE (EF)
-- ============================================================
INSERT INTO public.session_library (code, type, category, name, duration_min, intensity_rpe, warmup, main_set, recovery, cooldown, coach_notes, compatible_goals, sport) VALUES

('EF-01', 'endurance_fondamentale', 'endurance_fondamentale', 'Endurance fondamentale 30min', 30, 4,
 NULL,
 '30 min à 65-70% VMA — allure de conversation, respiration nasale possible',
 NULL, NULL,
 'Séance de base pour débutants. Tu dois pouvoir tenir une conversation entière. Si tu souffles, ralentis sans hésiter.',
 ARRAY['5km', '10km'], 'running'),

('EF-02', 'endurance_fondamentale', 'endurance_fondamentale', 'Endurance fondamentale 40min', 40, 5,
 NULL,
 '40 min à 65-72% VMA — zone aérobie confortable, rythme régulier',
 NULL, NULL,
 'L''endurance fondamentale c''est le socle de tout. Sois patient, la progression se fait en profondeur, pas en surface.',
 ARRAY['5km', '10km', 'semi'], 'running'),

('EF-03', 'endurance_fondamentale', 'endurance_fondamentale', 'Endurance fondamentale 50min', 50, 5,
 NULL,
 '50 min à 65-72% VMA — effort continu et régulier, allure au ressenti',
 NULL, NULL,
 'Reste dans ta zone de confort du début à la fin. C''est le volume qui compte, pas l''intensité.',
 ARRAY['10km', 'semi', 'marathon'], 'running'),

('EF-04', 'endurance_fondamentale', 'endurance_fondamentale', 'Endurance fondamentale 60min', 60, 5,
 NULL,
 '60 min à 65-72% VMA — endurance aérobie développée, allure au ressenti',
 NULL, NULL,
 'Une heure de footing solide. Hydrate-toi avant et après. Belle séance de fond.',
 ARRAY['semi', 'marathon'], 'running'),

('EF-05', 'endurance_fondamentale', 'endurance_fondamentale', 'Endurance fondamentale 70min', 70, 5,
 NULL,
 '70 min à 65-72% VMA — volume aérobie long, reste relâché',
 NULL, NULL,
 'Soixante-dix minutes à allure fondamentale, c''est du vrai travail de fond. Hydrate-toi à mi-parcours.',
 ARRAY['semi', 'marathon'], 'running');

-- ============================================================
-- RÉCUPÉRATION ACTIVE (RA)
-- ============================================================
INSERT INTO public.session_library (code, type, category, name, duration_min, intensity_rpe, warmup, main_set, recovery, cooldown, coach_notes, compatible_goals, sport) VALUES

('RA-01', 'recuperation_active', 'recuperation_active', 'Récupération active 25min', 25, 3,
 NULL,
 '25 min footing très lent à 58-63% VMA — jambes légères, allure de promenade',
 NULL, NULL,
 'Séance de récupération pure. L''objectif n''est pas de se fatiguer mais d''activer la circulation. Si quelque chose fait mal, marche.',
 ARRAY['5km', '10km', 'semi', 'marathon'], 'running'),

('RA-02', 'recuperation_active', 'recuperation_active', 'Récupération active 35min', 35, 3,
 NULL,
 '35 min footing très lent à 58-63% VMA — allure récupération, effort minimal',
 NULL, NULL,
 'Reste dans la zone de récupération absolue. C''est une séance de relance, pas d''entraînement.',
 ARRAY['semi', 'marathon'], 'running'),

('RA-03', 'recuperation_active', 'recuperation_active', 'Récupération active 40min', 40, 3,
 NULL,
 '40 min footing très lent à 58-63% VMA — récupération longue post-effort',
 NULL, NULL,
 'Après une grosse semaine ou une compétition. Plus tu vas lentement, mieux tu récupères. C''est contre-intuitif mais vrai.',
 ARRAY['semi', 'marathon'], 'running');

-- ============================================================
-- FOOTING PROGRESSIF (FP)
-- ============================================================
INSERT INTO public.session_library (code, type, category, name, duration_min, intensity_rpe, warmup, main_set, recovery, cooldown, coach_notes, compatible_goals, sport) VALUES

('FP-01', 'footing_progressif', 'footing_progressif', 'Footing progressif 3 phases — 45min', 60, 6,
 '8 min footing très lent à 60-63% VMA',
 'Phase 1 : 15 min à 65-68% VMA → Phase 2 : 15 min à 72-76% VMA → Phase 3 : 15 min à 80-85% VMA',
 NULL,
 '8 min footing très lent à 60-63% VMA',
 'La progression se fait naturellement — chaque phase est plus rapide. Sens la montée en puissance, ne la force pas.',
 ARRAY['5km', '10km', 'semi', 'marathon'], 'running'),

('FP-02', 'footing_progressif', 'footing_progressif', 'Footing progressif 3 phases — 54min', 70, 6,
 '8 min footing très lent à 60-63% VMA',
 'Phase 1 : 18 min à 65-68% VMA → Phase 2 : 18 min à 72-76% VMA → Phase 3 : 18 min à 80-85% VMA',
 NULL,
 '8 min footing très lent à 60-63% VMA',
 'Version intermédiaire du progressif. Contrôle ton allure à chaque changement de phase, apprends à t''écouter.',
 ARRAY['10km', 'semi', 'marathon'], 'running'),

('FP-03', 'footing_progressif', 'footing_progressif', 'Footing progressif 3 phases — 63min', 80, 7,
 '10 min footing très lent à 60-63% VMA',
 'Phase 1 : 21 min à 65-68% VMA → Phase 2 : 21 min à 72-76% VMA → Phase 3 : 21 min à 80-85% VMA',
 NULL,
 '10 min footing très lent à 60-63% VMA',
 'Version longue. La dernière phase à 80-85% VMA doit être maîtrisée, pas subie. Si tu luttes dès la 2ème phase, tu es parti trop vite.',
 ARRAY['semi', 'marathon'], 'running'),

('FP-04', 'footing_progressif', 'footing_progressif', 'Progressif inversé — Descente d''allure', 65, 7,
 '10 min footing très lent à 60-63% VMA',
 'Phase 1 : 20 min à 80-85% VMA → Phase 2 : 15 min à 72-76% VMA → Phase 3 : 10 min à 65-68% VMA',
 NULL,
 '10 min footing très lent à 60-63% VMA',
 'Variante originale : tu pars fort et tu décélères. Excellent pour apprendre à gérer l''effort et la fatigue. Contrôle ta technique quand les jambes sont chargées.',
 ARRAY['10km', 'semi', 'marathon'], 'running');

-- ============================================================
-- TEMPO / SEUIL (T)
-- ============================================================
INSERT INTO public.session_library (code, type, category, name, duration_min, intensity_rpe, warmup, main_set, recovery, cooldown, coach_notes, compatible_goals, sport) VALUES

('T-01', 'tempo_seuil', 'tempo_seuil', 'Tempo 3x8min — Découverte seuil', 60, 7,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '3x8min à 82-88% VMA',
 '2''30 footing lent à 63-65% VMA entre chaque répétition',
 '10 min footing très lent à 60-63% VMA',
 'Première séance de seuil. Tu dois pouvoir prononcer des mots mais pas des phrases. Trouve ta zone sans l''exploser.',
 ARRAY['5km', '10km', 'semi'], 'running'),

('T-02', 'tempo_seuil', 'tempo_seuil', 'Tempo 3x10min — Introduction seuil', 65, 7,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '3x10min à 82-88% VMA',
 '3 min footing lent à 63-65% VMA entre chaque répétition',
 '10 min footing très lent à 60-63% VMA',
 'Trois blocs de seuil solides. Régularité sur les 3 répétitions — si le 3ème s''effondre, tu es parti trop fort.',
 ARRAY['5km', '10km', 'semi', 'marathon'], 'running'),

('T-03', 'tempo_seuil', 'tempo_seuil', 'Tempo 4x8min — Accumulation seuil', 65, 7,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '4x8min à 82-88% VMA',
 '2''30 footing lent à 63-65% VMA entre chaque répétition',
 '10 min footing très lent à 60-63% VMA',
 'Plus de répétitions mais un peu plus courtes. Travail d''accumulation du temps passé au seuil.',
 ARRAY['5km', '10km', 'semi'], 'running'),

('T-04', 'tempo_seuil', 'tempo_seuil', 'Tempo 2x15min — Développement seuil', 70, 7,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '2x15min à 82-88% VMA',
 '4 min footing lent à 63-65% VMA entre les 2 blocs',
 '10 min footing très lent à 60-63% VMA',
 'Deux bons blocs de seuil. Ne pars pas plus vite sur le deuxième bloc — le but est de tenir la même allure.',
 ARRAY['5km', '10km', 'semi', 'marathon'], 'running'),

('T-05', 'tempo_seuil', 'tempo_seuil', 'Tempo 20min continu — Seuil consolidé', 60, 7,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '20min continu à 82-88% VMA — effort soutenu et régulier',
 NULL,
 '10 min footing très lent à 60-63% VMA',
 'Vingt minutes de seuil en continu — c''est une belle séance. Pars raisonnablement pour finir fort, pas l''inverse.',
 ARRAY['10km', 'semi', 'marathon'], 'running'),

('T-06', 'tempo_seuil', 'tempo_seuil', 'Tempo 2x20min — Volume seuil', 80, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '2x20min à 82-88% VMA',
 '5 min footing lent à 63-65% VMA entre les 2 blocs',
 '10 min footing très lent à 60-63% VMA',
 'Séance exigeante. Si le deuxième bloc est nettement plus lent, c''est une info précieuse sur ta forme du jour.',
 ARRAY['semi', 'marathon'], 'running'),

('T-07', 'tempo_seuil', 'tempo_seuil', 'Tempo 30min continu — Seuil long', 75, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '30min continu à 82-88% VMA — effort soutenu',
 NULL,
 '10 min footing très lent à 60-63% VMA',
 'Trente minutes de seuil en continu, c''est une séance clé. Concentre-toi sur la régularité — chaque minute doit ressembler aux autres.',
 ARRAY['semi', 'marathon'], 'running'),

('T-08', 'tempo_seuil', 'tempo_seuil', 'Tempo 3x12min — Volume seuil intermédiaire', 75, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '3x12min à 83-88% VMA',
 '3 min footing lent à 63-65% VMA entre chaque répétition',
 '10 min footing très lent à 60-63% VMA',
 'Excellent compromis entre durée et nombre de blocs. Trente-six minutes au total à seuil — une belle séance de construction.',
 ARRAY['10km', 'semi', 'marathon'], 'running'),

('T-09', 'tempo_seuil', 'tempo_seuil', 'Tempo ondulé 6x(5min seuil + 2min allure marathon)', 75, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '6 blocs : 5min à 85-90% VMA → 2min à allure marathon (80-82% VMA) — enchaîné sans récup',
 NULL,
 '10 min footing très lent à 60-63% VMA',
 'Séance originale : tu alternes intensité seuil et allure marathon sans t''arrêter. Apprend à gérer les changements de vitesse. Très spécifique marathon.',
 ARRAY['marathon'], 'running'),

('T-10', 'tempo_seuil', 'tempo_seuil', 'Tempo en montée de régime 10+15+20min', 80, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '10min à 82-85% VMA → récup 3min → 15min à 84-87% VMA → récup 4min → 20min à 86-90% VMA',
 '3-4 min footing lent entre chaque bloc (variable)',
 '10 min footing très lent à 60-63% VMA',
 'La difficulté croît à chaque bloc — mentalement et physiquement. Le dernier bloc de 20min à vitesse maximale est le vrai test. Ne fais pas cette séance en fin de semaine chargée.',
 ARRAY['semi', 'marathon'], 'running');

-- ============================================================
-- FRACTIONNÉ COURT (FC) — triées par distance de l'effort
-- ============================================================
INSERT INTO public.session_library (code, type, category, name, duration_min, intensity_rpe, warmup, main_set, recovery, cooldown, coach_notes, compatible_goals, sport) VALUES

-- ── 100-200m ─────────────────────────────────────────────────
('FC-01', 'fractionne_court', 'fractionne_court', '10x200m — VMA courte', 55, 9,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '10x200m à 100-110% VMA',
 '1''00 en marchant entre chaque répétition',
 '10 min footing très lent à 60-63% VMA',
 'Séance de VMA courte. Les 200m doivent être courus vite et de façon relâchée. Si tu te crispes, tu perds en efficacité.',
 ARRAY['5km', '10km'], 'running'),

('FC-02', 'fractionne_court', 'fractionne_court', '15x200m — Volume vitesse', 60, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '15x200m à 100-107% VMA',
 '45'' en marchant entre chaque répétition',
 '10 min footing très lent à 60-63% VMA',
 'Volume élevé sur courte distance. La récupération courte oblige à gérer l''allure. Commence conservateur.',
 ARRAY['5km', '10km', 'semi'], 'running'),

('FC-03', 'fractionne_court', 'fractionne_court', '20x200m — Endurance de vitesse', 65, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '20x200m à 97-103% VMA',
 '45'' en marchant entre chaque répétition',
 '10 min footing très lent à 60-63% VMA',
 'Vingt répétitions — ça fait peur sur le papier mais l''allure est gérable. La fatigue s''accumule progressivement. Mental autant que physique.',
 ARRAY['10km', 'semi'], 'running'),

-- ── 300m ─────────────────────────────────────────────────────
('FC-04', 'fractionne_court', 'fractionne_court', '10x300m — Vitesse résistance', 60, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '10x300m à 97-105% VMA',
 '1''00 en marchant entre chaque répétition',
 '10 min footing très lent à 60-63% VMA',
 'Maintiens l''allure sur les 8 dernières répétitions — c''est là que ça se construit. Le 300m développe à la fois vitesse et résistance.',
 ARRAY['5km', '10km'], 'running'),

('FC-05', 'fractionne_court', 'fractionne_court', '6x(300m rapide + 100m sprint final)', 60, 9,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '6 blocs : 300m à 97-100% VMA puis accélération sur les 100m finaux jusqu''à 105-110% VMA',
 '2''00 en marchant entre chaque bloc',
 '10 min footing très lent à 60-63% VMA',
 'Séance de vitesse en fin d''effort. Tu apprends à finir fort quand tu es fatigué — exactement ce qu''il faut en compétition.',
 ARRAY['5km', '10km'], 'running'),

-- ── 400m ─────────────────────────────────────────────────────
('FC-06', 'fractionne_court', 'fractionne_court', '6x400m — Introduction vitesse', 55, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '6x400m à 95-100% VMA',
 '1''30 en marchant entre chaque répétition',
 '10 min footing très lent à 60-63% VMA',
 'Introduction parfaite au 400m. Six répétitions régulières — pas de sprint kamikaze sur les premiers.',
 ARRAY['5km', '10km'], 'running'),

('FC-07', 'fractionne_court', 'fractionne_court', '8x400m — Endurance de vitesse', 60, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '8x400m à 95-100% VMA',
 '1''15 en marchant entre chaque répétition',
 '10 min footing très lent à 60-63% VMA',
 'Huit 400m, c''est la référence. Idéale pour développer la vitesse. Progressif sur les semaines.',
 ARRAY['5km', '10km', 'semi'], 'running'),

('FC-08', 'fractionne_court', 'fractionne_court', '10x400m — Vitesse pure', 65, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '10x400m à 95-100% VMA',
 '1''00 en marchant entre chaque répétition',
 '10 min footing très lent à 60-63% VMA',
 'La séance classique. Chaque 400m doit être régulier. Le 9ème et 10ème 400m doivent ressembler au 1er.',
 ARRAY['5km', '10km', 'semi', 'marathon'], 'running'),

('FC-09', 'fractionne_court', 'fractionne_court', '12x400m — Volume vitesse', 70, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '12x400m à 93-98% VMA',
 '1''00 en marchant entre chaque répétition',
 '10 min footing très lent à 60-63% VMA',
 'Volume élevé sur 400m. Quatre-vingt mètres quatre-vingts de total — séance pour coureurs confirmés. Gère ton effort sur les 4 premiers.',
 ARRAY['10km', 'semi'], 'running'),

('FC-10', 'fractionne_court', 'fractionne_court', '3x(4x400m) — Série de vitesse en blocs', 70, 9,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '3 séries de 4x400m à 95-102% VMA — récup 45'' entre les 400m, 4min entre les séries',
 '45'' marche entre 400m / 4min footing lent entre séries',
 '10 min footing très lent à 60-63% VMA',
 'La récup courte entre les 400m oblige à courir économique. La longue récup entre les séries te laisse souffler. Séance très complète.',
 ARRAY['5km', '10km', 'semi'], 'running'),

-- ── 500m ─────────────────────────────────────────────────────
('FC-11', 'fractionne_court', 'fractionne_court', '6x500m — Puissance aérobie', 65, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '6x500m à 93-98% VMA',
 '1''30 en marchant entre chaque répétition',
 '10 min footing très lent à 60-63% VMA',
 'Le 500m est une distance charnière entre vitesse pure et résistance. Belle séance polyvalente.',
 ARRAY['5km', '10km', 'semi'], 'running'),

('FC-12', 'fractionne_court', 'fractionne_court', '8x500m — Endurance spécifique', 70, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '8x500m à 90-95% VMA',
 '1''30 en marchant entre chaque répétition',
 '10 min footing très lent à 60-63% VMA',
 'Quatre kilomètres de travail intensif. La récup est courte, ce qui force l''économie de course. Reste relâché.',
 ARRAY['10km', 'semi'], 'running'),

-- ── Séances mixtes créatives ──────────────────────────────────
('FC-13', 'fractionne_court', 'fractionne_court', '400-300-200-100m x3 — Dégressif par série', 65, 9,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '3 séries de : 400m → 300m → 200m → 100m, chaque effort plus rapide que le précédent — récup 1''30 entre efforts, 4min entre séries',
 '1''30 marche entre efforts / 4min footing lent entre séries',
 '10 min footing très lent à 60-63% VMA',
 'La distance diminue, la vitesse augmente. Tu finis chaque série en sprint. Séance neuromusculaire et psychologique redoutable.',
 ARRAY['5km', '10km'], 'running'),

('FC-14', 'fractionne_court', 'fractionne_court', '5x(200m-200m récup active) — Travail de rythme', 55, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '5 blocs : 200m à 103-108% VMA puis 200m trot lent à 60% VMA (récup active) — enchaîné',
 'Récup active : 200m trot entre chaque effort',
 '10 min footing très lent à 60-63% VMA',
 'La récup se fait en trottinant, pas en marchant. Apprentissage du changement de rythme — très utile en compétition.',
 ARRAY['5km', '10km'], 'running');

-- ============================================================
-- FRACTIONNÉ LONG (FL) — triées par distance de l'effort
-- ============================================================
INSERT INTO public.session_library (code, type, category, name, duration_min, intensity_rpe, warmup, main_set, recovery, cooldown, coach_notes, compatible_goals, sport) VALUES

-- ── 1000m ─────────────────────────────────────────────────────
('FL-01', 'fractionne_long', 'fractionne_long', '3x1000m — Initiation fractionné long', 55, 7,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '3x1000m à 85-90% VMA',
 '2''30 en marchant / trot lent entre chaque répétition',
 '10 min footing très lent à 60-63% VMA',
 'Séance d''initiation parfaite. Trois km à effort, pas plus. La qualité prime sur la quantité.',
 ARRAY['5km', '10km'], 'running'),

('FL-02', 'fractionne_long', 'fractionne_long', '4x1000m — Développement VMA longue', 60, 7,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '4x1000m à 85-90% VMA',
 '2''30 en marchant / trot lent entre chaque répétition',
 '10 min footing très lent à 60-63% VMA',
 'Quatre km à intensité — tu commences à construire ta résistance. Régularité sur les 4 répétitions.',
 ARRAY['5km', '10km', 'semi'], 'running'),

('FL-03', 'fractionne_long', 'fractionne_long', '5x1000m — VMA endurance', 65, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '5x1000m à 83-90% VMA',
 '2''00 en marchant / trot lent entre chaque répétition',
 '10 min footing très lent à 60-63% VMA',
 'La séance classique. Cinq répétitions régulières valent mieux que 3 bonnes et 2 ratées.',
 ARRAY['5km', '10km', 'semi', 'marathon'], 'running'),

('FL-04', 'fractionne_long', 'fractionne_long', '6x1000m — VMA confirmé', 65, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '6x1000m à 85-90% VMA',
 '2''00 en marchant / trot lent entre chaque répétition',
 '10 min footing très lent à 60-63% VMA',
 'Pour coureurs confirmés. Si le 5ème et 6ème s''effondrent, l''allure était trop rapide.',
 ARRAY['5km', '10km', 'semi', 'marathon'], 'running'),

('FL-05', 'fractionne_long', 'fractionne_long', '8x1000m — Volume VMA', 75, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '8x1000m à 83-88% VMA',
 '1''30 en marchant / trot lent entre chaque répétition',
 '10 min footing très lent à 60-63% VMA',
 'Volume élevé sur 1000m. La récupération plus courte demande de gérer l''allure avec intelligence. Commence conservateur.',
 ARRAY['10km', 'semi', 'marathon'], 'running'),

('FL-06', 'fractionne_long', 'fractionne_long', '10x1000m — Volume max VMA', 90, 9,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '10x1000m à 83-88% VMA',
 '1''30 en marchant / trot lent entre chaque répétition',
 '10 min footing très lent à 60-63% VMA',
 'Séance de très haut volume pour experts. Dix km à intensité — réserve-toi mentalement et pars raisonnablement.',
 ARRAY['semi', 'marathon'], 'running'),

-- ── 1500m ─────────────────────────────────────────────────────
('FL-07', 'fractionne_long', 'fractionne_long', '4x1500m — Intermédiaire VMA', 65, 7,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '4x1500m à 83-88% VMA',
 '2''30 en trottinant lent entre chaque répétition',
 '10 min footing très lent à 60-63% VMA',
 'Le 1500m est un excellent intermédiaire entre le 1000m et le 2000m. Permet de varier les stimuli.',
 ARRAY['10km', 'semi'], 'running'),

('FL-08', 'fractionne_long', 'fractionne_long', '5x1500m — Seuil intermédiaire', 70, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '5x1500m à 83-87% VMA',
 '2''30 en trottinant lent entre chaque répétition',
 '10 min footing très lent à 60-63% VMA',
 'Sept virgule cinq km à intensité — belle séance de construction. Régularité absolue sur les 5 répétitions.',
 ARRAY['10km', 'semi', 'marathon'], 'running'),

-- ── 2000m ─────────────────────────────────────────────────────
('FL-09', 'fractionne_long', 'fractionne_long', '3x2000m — Introduction seuil long', 60, 7,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '3x2000m à 80-87% VMA',
 '3''30 en trottinant lent entre chaque répétition',
 '10 min footing très lent à 60-63% VMA',
 'Parfait pour passer du 1000m au 2000m. Trois répétitions de qualité pour construire la résistance longue.',
 ARRAY['10km', 'semi'], 'running'),

('FL-10', 'fractionne_long', 'fractionne_long', '4x2000m — Seuil aérobie long', 70, 7,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '4x2000m à 80-87% VMA',
 '3''00 en trottinant lent entre chaque répétition',
 '10 min footing très lent à 60-63% VMA',
 'Séance clé pour le semi-marathon. Les 2000m à cette intensité sont très spécifiques à ta course. Sens le rythme de compétition.',
 ARRAY['10km', 'semi', 'marathon'], 'running'),

('FL-11', 'fractionne_long', 'fractionne_long', '5x2000m — Volume seuil aérobie', 80, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '5x2000m à 80-87% VMA',
 '3''00 en trottinant lent entre chaque répétition',
 '10 min footing très lent à 60-63% VMA',
 'Dix km à intensité — réserve-toi pour les 2 derniers qui font toute la différence.',
 ARRAY['semi', 'marathon'], 'running'),

-- ── 3000m et + ────────────────────────────────────────────────
('FL-12', 'fractionne_long', 'fractionne_long', '3x3000m — Endurance spécifique', 80, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '3x3000m à 80-85% VMA',
 '4''00 en trottinant lent entre chaque répétition',
 '10 min footing très lent à 60-63% VMA',
 'Neuf km à intensité — c''est là que tu construis l''endurance spécifique marathon. C''est une grande séance.',
 ARRAY['marathon'], 'running'),

('FL-13', 'fractionne_long', 'fractionne_long', '2x5000m — Long spécifique marathon', 90, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '2x5000m à 78-83% VMA',
 '5''00 en trottinant lent entre les 2 blocs',
 '10 min footing très lent à 60-63% VMA',
 'Deux blocs de 5km à intensité modérée-haute — le deuxième bloc est le vrai test. Séance pour marathoniens confirmés.',
 ARRAY['marathon'], 'running'),

-- ── Séances en blocs créatives ────────────────────────────────
('FL-14', 'fractionne_long', 'fractionne_long', '4x(500m-1000m-500m) — Blocs en vague', 80, 9,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '4 blocs de : 500m à 95% VMA → récup 1''00 → 1000m à 88-90% VMA → récup 1''30 → 500m à 97% VMA — récup 4min entre les blocs',
 'Récup : 1''00 entre 500m et 1000m / 1''30 entre 1000m et 500m / 4''00 footing lent entre les 4 blocs',
 '10 min footing très lent à 60-63% VMA',
 'Séance qui fait peur sur le papier et qui tient ses promesses. La structure vague (court-long-court) t''oblige à gérer ton énergie. Le dernier 500m de chaque bloc après le 1000m est toujours le plus dur. Mental de guerrier requis.',
 ARRAY['10km', 'semi', 'marathon'], 'running'),

('FL-15', 'fractionne_long', 'fractionne_long', '3x(1000m-500m-1000m) — Blocs sandwich', 75, 9,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '3 blocs de : 1000m à 87-90% VMA → récup 1''30 → 500m à 97-100% VMA → récup 1''30 → 1000m à 87-90% VMA — récup 4''30 entre les blocs',
 'Récup : 1''30 trot lent entre efforts / 4''30 footing lent entre les 3 blocs',
 '10 min footing très lent à 60-63% VMA',
 'Le 500m au milieu est un accélérateur brutal que tu dois gérer sans péter les plombs sur le 1000m suivant. Séance très complète — tu apprends à varier les rythmes et à récupérer en courant.',
 ARRAY['10km', 'semi'], 'running'),

('FL-16', 'fractionne_long', 'fractionne_long', '2000m-1500m-1000m-500m dégressif', 70, 9,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '2000m à 82-85% VMA → récup 3''30 → 1500m à 85-88% VMA → récup 3''00 → 1000m à 88-92% VMA → récup 2''30 → 500m à 95-100% VMA',
 '3''30 / 3''00 / 2''30 footing lent entre chaque distance (variable)',
 '10 min footing très lent à 60-63% VMA',
 'La distance diminue, la vitesse augmente, la récup aussi se réduit. Tu finis en mode sprint après avoir accumulé de la fatigue. La séance qui révèle ta vraie condition.',
 ARRAY['10km', 'semi'], 'running'),

('FL-17', 'fractionne_long', 'fractionne_long', '5x(1000m VMA + 400m seuil) — Alternance intensité', 80, 9,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '5 blocs : 1000m à 88-92% VMA → récup 1''00 → 400m à 82-85% VMA (seuil, pas sprint) — récup 3''00 entre blocs',
 '1''00 marche entre 1000m et 400m / 3''00 footing lent entre les 5 blocs',
 '10 min footing très lent à 60-63% VMA',
 'Tu passes d''un effort VMA à un effort seuil en 1 minute de récup. Ton corps doit apprendre à switcher les filières. Séance inédite qui construit une résistance aérobie redoutable.',
 ARRAY['10km', 'semi', 'marathon'], 'running'),

('FL-18', 'fractionne_long', 'fractionne_long', '3000m/5000m/3000m progressif — Marathon clé', 90, 9,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '3000m à 80-82% VMA → récup 4min → 5000m à 82-85% VMA → récup 5min → 3000m à 85-88% VMA',
 'Récup variable : 4min après le 3000m, 5min après le 5000m — trot lent à 63% VMA',
 '10 min footing très lent à 60-63% VMA',
 'La grande séance marathon. Progression sur les 3 blocs — tu dois finir le dernier 3000m plus fort que le premier. Onze km à intensité. Sois mentalement prêt.',
 ARRAY['marathon'], 'running'),

('FL-19', 'fractionne_long', 'fractionne_long', '5x2000m allure marathon + accélération finale', 85, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '3x2000m à 82-87% VMA → récup 3min → 2x2000m à allure marathon cible avec 200m final en accélération',
 '3''00 en trottinant lent entre chaque répétition',
 '10 min footing très lent à 60-63% VMA',
 'Mélange de seuil et d''allure spécifique. Les 200m finaux de chaque bloc te font apprendre à finir fort — la compétence la plus précieuse en course.',
 ARRAY['marathon'], 'running');

-- ============================================================
-- SÉANCES DE CÔTES (CO)
-- ============================================================
INSERT INTO public.session_library (code, type, category, name, duration_min, intensity_rpe, warmup, main_set, recovery, cooldown, coach_notes, compatible_goals, sport) VALUES

-- ── Côtes courtes ─────────────────────────────────────────────
('CO-01', 'cotes', 'cotes', 'Côtes courtes 8x60m — Puissance explosive', 55, 9,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '8x60m en côte à RPE 9/10 — montée explosive, foulée ample et agressive',
 'Descente en marchant doucement — récupération complète',
 '10 min footing très lent à 60-63% VMA',
 'La côte courte, c''est du neuromusculaire pur. Monte en attaquant le sol, bras actifs, genoux hauts. Laisse-toi le temps de souffler en descente.',
 ARRAY['5km', '10km', 'semi', 'marathon'], 'running'),

('CO-02', 'cotes', 'cotes', 'Côtes courtes 10x80m — Puissance neuromusculaire', 60, 9,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '10x80m en côte à RPE 8-9/10 — montée dynamique, foulée ample',
 'Descente en marchant doucement — récupération complète',
 '10 min footing très lent à 60-63% VMA',
 'Dix montées — l''effort augmente répétition après répétition. La foulée doit rester propre jusqu''au bout. Si tu te contorsionne sur les dernières, ralentis.',
 ARRAY['5km', '10km', 'semi', 'marathon'], 'running'),

('CO-03', 'cotes', 'cotes', 'Côtes courtes 12x80m — Volume explosivité', 65, 9,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '12x80m en côte à RPE 8-9/10 — alternance : 6 montées rapides, 6 montées avec exagération de foulée (genoux hauts)',
 'Descente en marchant — récupération complète',
 '10 min footing très lent à 60-63% VMA',
 'Varie les stimulations : 6 montées à vitesse maximale, 6 montées avec exagération de la foulée (levée de genoux, gainage actif). Double bénéfice neuromusculaire.',
 ARRAY['5km', '10km', 'semi'], 'running'),

-- ── Côtes longues ─────────────────────────────────────────────
('CO-04', 'cotes', 'cotes', 'Côtes longues 6x150m — Résistance montée', 60, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '6x150m en côte à RPE 7-8/10 — effort soutenu et régulier sur toute la longueur',
 'Descente en trottinant très lentement — récupération active',
 '10 min footing très lent à 60-63% VMA',
 'Les côtes longues développent la résistance spécifique et la force musculaire. Maintiens l''effort sur les 150m entiers sans accélérer ni décélérer.',
 ARRAY['5km', '10km', 'semi', 'marathon'], 'running'),

('CO-05', 'cotes', 'cotes', 'Côtes longues 8x200m — Force endurance', 65, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '8x200m en côte à RPE 7-8/10 — effort régulier, respiration contrôlée',
 'Descente en trottinant très lentement — récupération active',
 '10 min footing très lent à 60-63% VMA',
 'Huit fois 200m en montée, c''est une vraie séance de force-endurance. Ton appui doit rester actif jusqu''en haut. Ne laisse pas les bras mourir.',
 ARRAY['10km', 'semi', 'marathon'], 'running'),

('CO-06', 'cotes', 'cotes', 'Côtes longues 6x300m — Résistance aérobie', 70, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '6x300m en côte à RPE 7-8/10 — effort aérobie soutenu sur toute la montée',
 'Descente en trottinant très lentement — récupération active',
 '10 min footing très lent à 60-63% VMA',
 'Trois cents mètres en montée, c''est long. La gestion de l''effort est cruciale. Pars conservateur sur les 3 premières pour finir fort sur les 3 dernières.',
 ARRAY['semi', 'marathon'], 'running'),

-- ── Côtes mixtes et créatives ─────────────────────────────────
('CO-07', 'cotes', 'cotes', 'Côtes en escalade 3x(80m+150m+250m) — Pyramide montante', 70, 9,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '3 séries de : 80m côte explosive (RPE 9) → descente → 150m côte soutenue (RPE 8) → descente → 250m côte aérobie (RPE 7) — récup 4min entre séries',
 'Descente trot très lent entre chaque montée / 4min footing lent entre séries',
 '10 min footing très lent à 60-63% VMA',
 'La séance côtes qui fait tout en même temps : explosivité, résistance et endurance. Les 250m finaux de chaque série arrivent quand tu es déjà chargé. Séance qui fait peur, qui tient ses promesses.',
 ARRAY['10km', 'semi', 'marathon'], 'running'),

('CO-08', 'cotes', 'cotes', 'Côtes en récup courte 10x100m — Accumulation de fatigue', 65, 9,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '10x100m en côte à RPE 8-9/10 — récupération trop courte volontairement (45'' seulement)',
 '45'' descente rapide entre chaque montée (récup volontairement incomplète)',
 '10 min footing très lent à 60-63% VMA',
 'La récup courte est volontaire — tu dois courir en état de fatigue partielle, comme en fin de course. Séance mentalement dure. Ne l''anticipe pas trop.',
 ARRAY['10km', 'semi', 'marathon'], 'running'),

('CO-09', 'cotes', 'cotes', 'Côtes trail 3x(5min montée continue) — Simulation trail', 65, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '3x5min de montée continue sur côte naturelle à RPE 7-8 — marche rapide si trop raide, course si possible',
 'Descente en marchant ou trot lent — récup 3min entre les blocs',
 '10 min footing très lent à 60-63% VMA',
 'Simulation trail : l''effort est chronométré, pas en distance. Adapte-toi au terrain. Monte efficacement, que ce soit en courant ou en marchant vite avec les bras.',
 ARRAY['10km', 'semi', 'marathon'], 'running', true);

-- ============================================================
-- SPÉCIFIQUE ALLURE OBJECTIF (SP)
-- ============================================================
INSERT INTO public.session_library (code, type, category, name, duration_min, intensity_rpe, warmup, main_set, recovery, cooldown, coach_notes, compatible_goals, sport) VALUES

('SP-01', 'specifique', 'specifique', 'Blocs allure 5km — 5x1km', 60, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '5x1km à allure objectif 5km (≈95-100% VMA) — récup 2min marche entre chaque',
 '2''00 en marchant entre chaque répétition',
 '10 min footing très lent à 60-63% VMA',
 'L''allure 5km c''est inconfortable. Cinq fois 1km te donne la sensation de course. Grave ces sensations dans ta mémoire musculaire.',
 ARRAY['5km'], 'running'),

('SP-02', 'specifique', 'specifique', 'Blocs allure 10km — 4x2km', 70, 7,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '4x2km à allure objectif 10km (≈90-93% VMA) — récup 2''30 trot lent entre chaque',
 '2''30 en trottinant lent entre chaque répétition',
 '10 min footing très lent à 60-63% VMA',
 'Huit km à l''allure de ta course. Si tu tiens le quatrième bloc à allure, tu es prêt.',
 ARRAY['10km'], 'running'),

('SP-03', 'specifique', 'specifique', 'Blocs allure 10km — 5x2km', 75, 7,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '5x2km à allure objectif 10km (≈90-93% VMA) — récup 2''30 trot lent entre chaque',
 '2''30 en trottinant lent entre chaque répétition',
 '10 min footing très lent à 60-63% VMA',
 'Dix km à l''allure cible — c''est le volume total de ta course en entraînement. Si tu tiens ça, tu es prêt pour le jour J.',
 ARRAY['10km'], 'running'),

('SP-04', 'specifique', 'specifique', 'Blocs allure semi-marathon — 3x3km', 75, 7,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '3x3km à allure objectif semi-marathon — récup 3min trot lent entre chaque',
 '3''00 en trottinant lent entre chaque répétition',
 '10 min footing très lent à 60-63% VMA',
 'Neuf km à allure semi. Régularité absolue sur les 3 blocs. C''est la prépa directe à ta course.',
 ARRAY['semi'], 'running'),

('SP-05', 'specifique', 'specifique', 'Blocs allure semi-marathon — 4x3km', 80, 7,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '4x3km à allure objectif semi-marathon — récup 3min trot lent entre chaque',
 '3''00 en trottinant lent entre chaque répétition',
 '10 min footing très lent à 60-63% VMA',
 'Douze km à allure semi — séance de référence. Si les 4 blocs sont réguliers, ta forme est au rendez-vous.',
 ARRAY['semi'], 'running'),

('SP-06', 'specifique', 'specifique', 'Blocs allure marathon — 3x5km', 90, 7,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '3x5km à allure objectif marathon (≈82-87% VMA) — récup 4min trot lent entre chaque',
 '4''00 en trottinant lent entre chaque répétition',
 '10 min footing très lent à 60-63% VMA',
 'Quinze km à allure marathon. Séance de référence pour savoir si tu es prêt. Gère impeccablement le premier bloc.',
 ARRAY['marathon'], 'running'),

('SP-07', 'specifique', 'specifique', 'Blocs allure — Introduction spécifique', 65, 7,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '3x2km à allure objectif course (≈88-93% VMA) — récup 3min trot lent entre chaque',
 '3''00 en trottinant lent à 63-65% VMA entre chaque répétition',
 '10 min footing très lent à 60-63% VMA',
 'Tu coures à l''allure de ta course objectif. Grave cette sensation dans ta mémoire musculaire. C''est elle qui compte le jour J.',
 ARRAY['5km', '10km', 'semi', 'marathon'], 'running'),

('SP-08', 'specifique', 'specifique', 'Spécifique inversé — Seuil puis allure', 75, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '2x2km à 88-92% VMA → récup 4min → 3x2km à allure marathon — récup 3min entre blocs marathon',
 'Récup variable : 4min entre les blocs seuil et marathon / 3min entre blocs marathon',
 '10 min footing très lent à 60-63% VMA',
 'Tu fais du seuil en premier pour te fatiguer, puis tu passes à l''allure marathon. Simule ce que tu ressentiras sur la 2ème moitié de marathon. Très formateur.',
 ARRAY['marathon'], 'running'),

('SP-09', 'specifique', 'specifique', '10km à allure cible continu — Répétition générale', 80, 8,
 '20 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '10km continu à allure objectif 10km — effort régulier, sans s''arrêter',
 NULL,
 '10 min footing très lent à 60-63% VMA',
 'La répétition générale. Tu coures ton 10km à allure cible en entraînement. Mentalement c''est une semi-compétition. Engage-toi mais reste lucide.',
 ARRAY['10km'], 'running'),

('SP-10', 'specifique', 'specifique', 'Séance de course incluse dans longue — Allure progressive', 90, 8,
 NULL,
 '50 min à 65-70% VMA → 20 min à allure semi → 10 min à allure 10km — terminer fort',
 NULL, NULL,
 'Sortie longue qui se termine en compétition. Les jambes sont fatiguées quand tu accélères — c''est exactement ce qu''il faut. Ne te ménage pas sur la fin.',
 ARRAY['semi', 'marathon'], 'running');

-- ============================================================
-- SORTIE LONGUE (SL)
-- ============================================================
INSERT INTO public.session_library (code, type, category, name, duration_min, intensity_rpe, warmup, main_set, recovery, cooldown, coach_notes, compatible_goals, sport) VALUES

('SL-01', 'sortie_longue', 'sortie_longue', 'Sortie longue 60min', 60, 5,
 NULL,
 '60 min à 65-72% VMA — allure confortable, effort régulier',
 NULL, NULL,
 'Ta sortie longue. Reste à l''aise, hydrate-toi. Ce n''est pas une course, c''est du fond.',
 ARRAY['5km', '10km'], 'running'),

('SL-02', 'sortie_longue', 'sortie_longue', 'Sortie longue 70min', 70, 5,
 NULL,
 '70 min à 65-72% VMA — endurance aérobie continue',
 NULL, NULL,
 'Soixante-dix minutes. Hydrate-toi avant, pendant et après. Belle séance de fond.',
 ARRAY['5km', '10km', 'semi'], 'running'),

('SL-03', 'sortie_longue', 'sortie_longue', 'Sortie longue 80min', 80, 5,
 NULL,
 '80 min à 65-72% VMA — volume endurance longue',
 NULL, NULL,
 'Bonne sortie longue. Si tu pars à jeun, mange quelque chose avant 60min. Gère bien le début.',
 ARRAY['10km', 'semi'], 'running'),

('SL-04', 'sortie_longue', 'sortie_longue', 'Sortie longue 90min', 90, 6,
 NULL,
 '90 min à 65-72% VMA — volume endurance, reste dans ta zone de confort',
 NULL, NULL,
 'Prends un gel ou une barre à partir de 60min. La gestion de l''allure sur la première heure est clé.',
 ARRAY['semi', 'marathon'], 'running'),

('SL-05', 'sortie_longue', 'sortie_longue', 'Sortie longue 100min', 100, 6,
 NULL,
 '100 min à 65-72% VMA — endurance longue, ravitaillement nécessaire',
 NULL, NULL,
 'Gel toutes les 40-45min. C''est une séance qui prépare ton corps à tenir sur la durée.',
 ARRAY['semi', 'marathon'], 'running'),

('SL-06', 'sortie_longue', 'sortie_longue', 'Sortie longue 110min', 110, 6,
 NULL,
 '110 min à 65-72% VMA — endurance marathon développée',
 NULL, NULL,
 'Pense à ton ravitaillement dès le départ. Bonne expérience de nutrition en mouvement.',
 ARRAY['marathon'], 'running'),

('SL-07', 'sortie_longue', 'sortie_longue', 'Sortie longue 120min', 120, 6,
 NULL,
 '120 min à 65-72% VMA — volume endurance maximal. Allure très confortable sur les 3/4.',
 NULL, NULL,
 'Deux heures de course. Plan de ravitaillement solide : gel toutes les 40min, eau régulièrement.',
 ARRAY['marathon'], 'running'),

('SL-08', 'sortie_longue', 'sortie_longue', 'Sortie longue 90min avec blocs allure semi', 105, 7,
 NULL,
 '70 min à 65-72% VMA puis 20 min à allure semi-marathon cible — simule les conditions de course sur la fin',
 NULL, NULL,
 'Les 20 dernières minutes à allure cible arrivent quand tu es fatigué. C''est exactement ce que tu vivras en compétition. Ne ralentis pas.',
 ARRAY['semi'], 'running'),

('SL-09', 'sortie_longue', 'sortie_longue', 'Sortie longue 110min avec blocs allure marathon', 110, 7,
 NULL,
 '90 min à 65-72% VMA puis 20 min à allure marathon cible — simule les conditions de course sur la fin',
 NULL, NULL,
 'La reine des sorties longues marathon. Les 20 dernières minutes à allure cible simulent les conditions de course. Sois prêt mentalement.',
 ARRAY['marathon'], 'running'),

('SL-10', 'sortie_longue', 'sortie_longue', 'Sortie longue 120min avec blocs progressifs', 125, 7,
 NULL,
 '80 min à 65-68% VMA → 25 min à 72-75% VMA → 15 min à allure marathon cible',
 NULL, NULL,
 'Sortie longue avec montée en régime. Chaque phase est plus rapide. La fin à allure marathon après 105 minutes de course — mentalement et physiquement exigeant.',
 ARRAY['marathon'], 'running');

-- ============================================================
-- RENFORCEMENT MUSCULAIRE (RENFO)
-- ============================================================
INSERT INTO public.session_library (code, type, category, name, duration_min, intensity_rpe, warmup, main_set, recovery, cooldown, coach_notes, compatible_goals, sport) VALUES

('RENFO-01', 'renforcement', 'renforcement', 'Gainage & Stabilité', 30, 5,
 NULL,
 'Référence-toi à l''onglet Renforcement — effectue la séance ''Gainage & Stabilité''',
 NULL, NULL,
 'Le gainage est la base. Un tronc solide = une foulée plus économique et moins de blessures. Sois rigoureux sur la qualité des positions.',
 ARRAY['5km', '10km', 'semi', 'marathon'], 'running'),

('RENFO-02', 'renforcement', 'renforcement', 'Force & Puissance', 30, 7,
 NULL,
 'Référence-toi à l''onglet Renforcement — effectue la séance ''Force & Puissance''',
 NULL, NULL,
 'Développe la force musculaire spécifique au running. Ces exercices rendent tes appuis plus explosifs.',
 ARRAY['5km', '10km', 'semi', 'marathon'], 'running'),

('RENFO-03', 'renforcement', 'renforcement', 'Excentrique & Prévention', 25, 4,
 NULL,
 'Référence-toi à l''onglet Renforcement — effectue la séance ''Excentrique & Prévention''',
 NULL, NULL,
 'La prévention c''est l''investissement le plus rentable du running. Ces exercices excentriques protègent tes tendons et articulations.',
 ARRAY['5km', '10km', 'semi', 'marathon'], 'running'),

('RENFO-04', 'renforcement', 'renforcement', 'Explosivité & Vitesse', 30, 8,
 NULL,
 'Référence-toi à l''onglet Renforcement — effectue la séance ''Explosivité & Vitesse''',
 NULL, NULL,
 'Travail neuromusculaire pour améliorer ton explosivité. Fais-le quand tu es frais — pas après une grosse séance.',
 ARRAY['5km', '10km', 'semi'], 'running'),

('RENFO-05', 'renforcement', 'renforcement', 'Mobilité & Récupération', 25, 3,
 NULL,
 'Référence-toi à l''onglet Renforcement — effectue la séance ''Mobilité & Récupération''',
 NULL, NULL,
 'Séance de mobilité et d''entretien articulaire. Parfaite le lendemain d''une sortie longue. Prends ton temps.',
 ARRAY['5km', '10km', 'semi', 'marathon'], 'running');


-- ============================================================
-- NATATION (NAT)
-- ============================================================
INSERT INTO public.session_library (code, type, category, name, duration_min, intensity_rpe, warmup, main_set, recovery, cooldown, coach_notes, compatible_goals, sport, triathlon_disciplines) VALUES

('NAT-01', 'natation', 'natation', 'Endurance natation — 1200m continu', 40, 5,
 '200m nage libre lente, 100m dos crawlé',
 '1200m nage libre à allure endurance (65-70% CSS) — effort régulier, respiration maîtrisée',
 NULL,
 '100m retour au calme crawl lent',
 'Séance de base. Tu dois sentir ton allure dès les premiers 200m. Si tu souffles au bord à 300m, c''est que tu pars trop vite.',
 ARRAY['sprint', 'olympique', '70.3', 'ironman'], 'triathlon', ARRAY['natation']),

('NAT-02', 'natation', 'natation', 'Endurance natation — 1500m continu', 45, 5,
 '200m nage libre lente, 100m dos crawlé',
 '1500m nage libre à allure endurance (65-70% CSS) — 1500m sans s''arrêter',
 NULL,
 '100m retour au calme crawl lent',
 'Ton 1500m de référence. Pars conservateur — l''erreur classique est de vouloir nager vite d''emblée.',
 ARRAY['olympique', '70.3', 'ironman'], 'triathlon', ARRAY['natation']),

('NAT-03', 'natation', 'natation', 'Endurance natation — 2000m continu', 55, 6,
 '300m nage libre lente, 100m dos crawlé',
 '2000m nage libre à allure endurance (65-72% CSS) — effort constant et régulier',
 NULL,
 '100m retour au calme',
 'Deux kilomètres sans s''arrêter. La fatigue arrive vers 1200-1400m — c''est normal. Concentre-toi sur ta technique à ce moment-là.',
 ARRAY['70.3', 'ironman'], 'triathlon', ARRAY['natation']),

('NAT-04', 'natation', 'natation', 'Fractionné court natation — 10x100m', 45, 7,
 '400m échauffement varié (nage libre, dos, battements)',
 '10x100m à 85-90% CSS — récup 20'' entre chaque',
 '20'' bord entre chaque répétition',
 '200m retour au calme',
 'Séance classique de fractionné. Chaque 100m doit être régulier. La récup courte oblige à être économique. Ne te jette pas sur les premiers.',
 ARRAY['sprint', 'olympique', '70.3', 'ironman'], 'triathlon', ARRAY['natation']),

('NAT-05', 'natation', 'natation', 'Fractionné court natation — 8x100m vitesse', 40, 8,
 '400m échauffement varié',
 '8x100m à 90-95% CSS — récup 30'' entre chaque',
 '30'' bord entre chaque',
 '200m retour au calme',
 'Effort plus intense que NAT-04. Les 30'' de récup te permettent de maintenir l''allure. Concentre-toi sur la finition de chaque longueur.',
 ARRAY['sprint', 'olympique'], 'triathlon', ARRAY['natation']),

('NAT-06', 'natation', 'natation', 'Fractionné long natation — 5x200m', 50, 7,
 '400m échauffement varié',
 '5x200m à 83-88% CSS — récup 30'' entre chaque',
 '30'' bord entre chaque',
 '200m retour au calme',
 'Le 200m en natation demande une gestion fine de l''effort. Ne pars pas trop vite — les 50 derniers mètres doivent être aussi rapides que les 50 premiers.',
 ARRAY['olympique', '70.3'], 'triathlon', ARRAY['natation']),

('NAT-07', 'natation', 'natation', 'Fractionné long natation — 4x400m', 55, 7,
 '400m échauffement varié',
 '4x400m à 80-85% CSS — récup 45'' entre chaque',
 '45'' bord entre chaque',
 '200m retour au calme',
 'Séance clé pour Ironman 70.3. Le 400m en piscine simule un effort de 8-9 minutes. Régularité sur les 4 répétitions.',
 ARRAY['70.3', 'ironman'], 'triathlon', ARRAY['natation']),

('NAT-08', 'natation', 'natation', 'Pyramide natation — 100-200-400-200-100m', 50, 7,
 '400m échauffement varié',
 '100m à 90% CSS → récup 20'' → 200m à 85% CSS → récup 30'' → 400m à 80% CSS → récup 40'' → 200m à 85% CSS → récup 20'' → 100m à 90% CSS',
 'Variable : 20'', 30'', 40'' selon la distance',
 '200m retour au calme',
 'Séance pyramide — tu montes en distance puis tu redescends. La gestion de l''allure est la clé : chaque distance a son intensité propre. Original et très formateur.',
 ARRAY['sprint', 'olympique', '70.3'], 'triathlon', ARRAY['natation']),

('NAT-09', 'natation', 'natation', 'Natation technique — 10x50m focus', 40, 5,
 '400m nage libre lente',
 '10x50m technique : 3 longueurs catch et traction → 3 longueurs battements de jambes → 4 longueurs nage complète focus gainage — récup 15'' entre chaque',
 '15'' entre chaque longueur',
 '100m retour au calme',
 'Séance technique pure. Concentre-toi sur chaque élément. La technique en natation rapporte plus que la condition physique seule.',
 ARRAY['sprint', 'olympique', '70.3', 'ironman'], 'triathlon', ARRAY['natation']),

('NAT-10', 'natation', 'natation', 'Natation eau vive — Simulation départ masse', 45, 8,
 '400m nage libre lente',
 '6x150m à 90-95% CSS — départ toutes les 3min30 (travail de rythme de course)',
 'Récup passive jusqu''au top de départ suivant',
 '200m retour au calme',
 'Simuler un départ de triathlon : tu dois aller vite dès le début. La récup est chronométrée — peu importe que tu sois fatigué, le départ part.',
 ARRAY['sprint', 'olympique', '70.3'], 'triathlon', ARRAY['natation']),

('NAT-11', 'natation', 'natation', 'Volume endurance natation — 3000m avec blocs', 70, 6,
 '300m nage libre lente',
 '500m EF → 10x100m à 83% CSS (récup 15'') → 500m EF → 5x200m à 80% CSS (récup 25'') → 500m EF',
 'Variable selon les blocs',
 '200m retour au calme',
 'Grosse séance d''endurance de volume. Trois mille mètres au total avec des blocs de qualité intercalés. Pour les préparations Ironman. Hydrate-toi en bord de bassin.',
 ARRAY['ironman'], 'triathlon', ARRAY['natation']),

('NAT-12', 'natation', 'natation', 'Tempo natation — 3x600m seuil', 55, 8,
 '400m échauffement varié',
 '3x600m à 82-87% CSS — récup 1min entre chaque',
 '1min bord entre chaque',
 '200m retour au calme',
 'Trois blocs de 600m au seuil — l''équivalent natation du tempo running. La régularité entre les 3 blocs est la clé. Évite de partir fort sur le 1er.',
 ARRAY['olympique', '70.3', 'ironman'], 'triathlon', ARRAY['natation']);

-- ============================================================
-- VÉLO (VEL)
-- ============================================================
INSERT INTO public.session_library (code, type, category, name, duration_min, intensity_rpe, warmup, main_set, recovery, cooldown, coach_notes, compatible_goals, sport, triathlon_disciplines) VALUES

('VEL-01', 'velo', 'velo', 'Endurance vélo — 1h fondamentale', 60, 5,
 '10 min pédalage lent zone 1',
 '50 min à 65-72% FTP (zone 2) — allure de conversation, cadence 85-95 rpm',
 NULL,
 '5 min pédalage très lent',
 'Séance de base vélo. La cadence doit rester autour de 90 rpm — si tu pousses des gros braquets lentement, tu fatigues les jambes pour rien.',
 ARRAY['sprint', 'olympique', '70.3', 'ironman'], 'triathlon', ARRAY['velo']),

('VEL-02', 'velo', 'velo', 'Endurance vélo — 1h30 fondamentale', 90, 5,
 '10 min pédalage lent zone 1',
 '75 min à 65-72% FTP (zone 2) — effort régulier, terrain varié bienvenu',
 NULL,
 '5 min pédalage très lent',
 'Heure et demie de vélo. Bonne sortie pour construire l''endurance de base. Mange si tu es parti depuis plus de 60min.',
 ARRAY['olympique', '70.3', 'ironman'], 'triathlon', ARRAY['velo']),

('VEL-03', 'velo', 'velo', 'Endurance vélo — 2h fondamentale', 120, 6,
 '15 min pédalage lent zone 1',
 '100 min à 65-75% FTP (zone 2-3) — volume endurance, terrain varié',
 NULL,
 '5 min pédalage très lent',
 'Deux heures de selle. Ravitaillement obligatoire : gel toutes les 45min + eau régulière. Gère l''allure sur le premier tiers.',
 ARRAY['70.3', 'ironman'], 'triathlon', ARRAY['velo']),

('VEL-04', 'velo', 'velo', 'Intervalles vélo — 5x5min zone 4', 70, 8,
 '15 min progressif zone 1-2',
 '5x5min à 90-105% FTP (zone 4) — effort soutenu, cadence 85-95 rpm',
 '3min zone 1-2 entre chaque intervalle',
 '10 min pédalage très lent',
 'Séance de seuil vélo. Cinq minutes à effort fort — ça brûle mais ça construit. La récup de 3min est volontairement courte.',
 ARRAY['sprint', 'olympique', '70.3'], 'triathlon', ARRAY['velo']),

('VEL-05', 'velo', 'velo', 'Intervalles vélo — 4x8min zone 4', 75, 8,
 '15 min progressif zone 1-2',
 '4x8min à 88-100% FTP (zone 4) — effort soutenu, régulier',
 '4min zone 1-2 entre chaque',
 '10 min pédalage très lent',
 'Huit minutes au seuil — l''effort doit être stable du début à la fin. Si tu exploses sur le 3ème bloc, tu es parti trop fort.',
 ARRAY['olympique', '70.3'], 'triathlon', ARRAY['velo']),

('VEL-06', 'velo', 'velo', 'Tempo vélo — 2x20min zone 3-4', 80, 7,
 '15 min progressif zone 1-2',
 '2x20min à 83-90% FTP (zone 3-4) — effort seuil tempo régulier',
 '5min zone 1-2 entre les 2 blocs',
 '10 min pédalage très lent',
 'Deux blocs de 20min au tempo — l''équivalent vélo du tempo running. La régularité entre les blocs est la clé. Garde la même puissance du début à la fin.',
 ARRAY['olympique', '70.3', 'ironman'], 'triathlon', ARRAY['velo']),

('VEL-07', 'velo', 'velo', 'Tempo vélo — 40min continu zone 3', 70, 7,
 '15 min progressif zone 1-2',
 '40min continu à 78-85% FTP (zone 3) — effort soutenu, régulier',
 NULL,
 '10 min pédalage très lent',
 'Quarante minutes au tempo en continu. L''allure est moins intense que le seuil mais la durée est plus longue. Très spécifique Ironman.',
 ARRAY['70.3', 'ironman'], 'triathlon', ARRAY['velo']),

('VEL-08', 'velo', 'velo', 'Sprint vélo — 8x30sec explosifs', 60, 9,
 '20 min progressif avec accélérations',
 '8x30sec à 130-150% FTP — effort explosif maximal, récup complète',
 '3min zone 1 entre chaque sprint',
 '10 min pédalage très lent',
 'Travail neuromusculaire vélo. Les 30 secondes doivent être maximales. La récup de 3min permet de maintenir la qualité. Tu dois avoir peur du prochain sprint.',
 ARRAY['sprint', 'olympique'], 'triathlon', ARRAY['velo']),

('VEL-09', 'velo', 'velo', 'Travail de cadence — 6x3min haute cadence', 60, 6,
 '15 min progressif zone 1-2',
 '6x3min à 105-115 rpm en zone 2 (léger braquet) — focus technique et fluidité',
 '2min cadence normale zone 1 entre chaque',
 '10 min pédalage très lent',
 'Séance technique pure. La haute cadence force ton système cardiovasculaire et améliore ton efficacité neuromusculaire. C''est inconfortable au début — persiste.',
 ARRAY['sprint', 'olympique', '70.3', 'ironman'], 'triathlon', ARRAY['velo']),

('VEL-10', 'velo', 'velo', 'Vélo colline — 5x3min côtes zone 4-5', 70, 9,
 '15 min progressif zone 1-2',
 '5x3min en montée à 95-110% FTP — effort fort et régulier en montée',
 'Descente lente récup zone 1 entre chaque',
 '10 min pédalage très lent',
 'Les côtes en vélo développent la force et la puissance. Reste assis si possible, la puissance vient des jambes. Si tu dois danser, monte ton braquet.',
 ARRAY['olympique', '70.3', 'ironman'], 'triathlon', ARRAY['velo']),

('VEL-11', 'velo', 'velo', 'Simulation course vélo — 2h30 avec blocs', 150, 7,
 '15 min progressif zone 1-2',
 '2h à 70-78% FTP → 20min à 80-85% FTP → 10min à 85-90% FTP',
 NULL,
 '5 min pédalage très lent',
 'Simulation de la partie vélo Ironman. Tu montes en régime sur la fin — comme en course. Ravitaillement : gel toutes les 40min, eau toutes les 20min.',
 ARRAY['ironman'], 'triathlon', ARRAY['velo']),

('VEL-12', 'velo', 'velo', 'Blocs puissance — 3x(3min fort + 2min tempo)', 65, 8,
 '15 min progressif zone 1-2',
 '3 blocs : 3min à 100-110% FTP → sans récup → 2min à 85-90% FTP — récup 4min entre blocs',
 '4min zone 1 entre les 3 blocs',
 '10 min pédalage très lent',
 'L''effort fort suivi sans récup d''un tempo — tu apprends à récupérer en roulant. Très spécifique triathlon où tu ne t''arrêtes jamais vraiment.',
 ARRAY['olympique', '70.3'], 'triathlon', ARRAY['velo']);

-- ============================================================
-- BRIQUE (BRI)
-- ============================================================
INSERT INTO public.session_library (code, type, category, name, duration_min, intensity_rpe, warmup, main_set, recovery, cooldown, coach_notes, compatible_goals, sport, triathlon_disciplines) VALUES

('BRI-01', 'brique', 'brique', 'Brique introduction — Vélo 30min + Course 15min', 55, 6,
 '5 min vélo lent zone 1',
 'Vélo : 25min à 70-75% FTP (zone 2-3) — transition rapide → Course : 15min à 65-70% VMA (allure endurance)',
 NULL, NULL,
 'Première brique ? Bienvenue dans la zone de l''étrange. Les jambes vont sembler faites en béton au départ de la course. C''est normal — ça disparaît entre 5 et 10min. Ne ralentis pas, laisse ton corps s''adapter.',
 ARRAY['sprint', 'olympique'], 'triathlon', ARRAY['velo', 'course']),

('BRI-02', 'brique', 'brique', 'Brique courte — Vélo 45min + Course 20min', 75, 7,
 '5 min vélo lent zone 1',
 'Vélo : 40min à 72-80% FTP → transition rapide → Course : 20min à 65-72% VMA',
 NULL, NULL,
 'La transition vélo-course est un art. Prépare tout avant de partir : chaussures, casquette, gel. Chaque seconde perdue en transition est une seconde donnée aux autres.',
 ARRAY['sprint', 'olympique'], 'triathlon', ARRAY['velo', 'course']),

('BRI-03', 'brique', 'brique', 'Brique simulation sprint — Vélo 20min + Course 5km', 65, 8,
 '10 min vélo progressif zone 1-2',
 'Vélo : 20min à 80-88% FTP (effort course sprint) → transition rapide → Course : 5km à allure objectif course',
 NULL, NULL,
 'Simulation de distance sprint. L''intensité vélo est élevée — tu arrives en course avec les jambes chargées. C''est exactement les conditions de la compétition. Gère ton allure course dès le premier kilomètre.',
 ARRAY['sprint'], 'triathlon', ARRAY['velo', 'course']),

('BRI-04', 'brique', 'brique', 'Brique simulation olympique — Vélo 40km + Course 10km', 140, 7,
 '10 min vélo progressif zone 1-2',
 'Vélo : 40km à 75-82% FTP → transition rapide → Course : 10km à 70-80% VMA',
 NULL, NULL,
 'Répétition générale distance olympique. Le 10km en course après 40km de vélo c''est différent d''un 10km seul. Tes allures seront différentes — adapte-toi et ne te bats pas contre le verdict de tes jambes.',
 ARRAY['olympique'], 'triathlon', ARRAY['velo', 'course']),

('BRI-05', 'brique', 'brique', 'Brique longue — Vélo 1h30 + Course 30min', 115, 7,
 '10 min vélo progressif zone 1-2',
 'Vélo : 1h20 à 70-78% FTP → transition rapide → Course : 30min à 65-72% VMA',
 NULL, NULL,
 'Brique longue pour Ironman 70.3. Trente minutes de course après 1h20 de vélo — tes jambes vont te surprendre (pas toujours agréablement). L''adaptation vient avec la répétition de ce type de séance.',
 ARRAY['70.3'], 'triathlon', ARRAY['velo', 'course']),

('BRI-06', 'brique', 'brique', 'Brique 70.3 — Vélo 2h + Course 45min', 165, 7,
 '10 min vélo progressif zone 1-2',
 'Vélo : 1h50 à 68-75% FTP → transition rapide → Course : 45min à 65-72% VMA',
 NULL, NULL,
 'Simulation 70.3. Ne va pas chercher l''intensité — l''objectif est l''adaptation à l''enchaînement. Ravitaillement vélo : gel toutes les 35-40min. Course : gel ou eau au départ de la transition.',
 ARRAY['70.3'], 'triathlon', ARRAY['velo', 'course']),

('BRI-07', 'brique', 'brique', 'Brique Ironman — Vélo 3h + Course 40min', 225, 6,
 '10 min vélo progressif zone 1-2',
 'Vélo : 2h45 à 65-72% FTP → transition rapide → Course : 40min à 60-68% VMA (allure récupération-endurance)',
 NULL, NULL,
 'Séance phare de préparation Ironman. Trois heures de vélo suivi d''une course — ton corps va apprendre à se réinitialiser. L''allure course doit rester gérée même si tu as envie d''aller plus vite. Journée de ravitaillement structuré.',
 ARRAY['ironman'], 'triathlon', ARRAY['velo', 'course']),

('BRI-08', 'brique', 'brique', 'Brique fractionnée — 3x(15min vélo fort + 5min course)', 80, 8,
 '10 min vélo progressif zone 1-2',
 '3 séries de : 15min vélo à 82-90% FTP → transition → 5min course à 75-80% VMA — récup 3min vélo lent entre séries',
 '3min vélo lent zone 1 entre chaque série',
 '5 min vélo lent',
 'Brique en intervalles — tu répètes la transition plusieurs fois dans la même séance. Chaque transition doit être plus rapide que la précédente. Excellent pour les débutants en triathlon.',
 ARRAY['sprint', 'olympique'], 'triathlon', ARRAY['velo', 'course']),

('BRI-09', 'brique', 'brique', 'Brique natation-vélo — Nage 1500m + Vélo 45min', 85, 7,
 NULL,
 'Natation : 1500m à 70-75% CSS → transition T1 → Vélo : 45min à 70-78% FTP',
 NULL, NULL,
 'Simulation T1 — la transition nage-vélo est souvent négligée à l''entraînement. Ton corps sort de l''eau les bras fatigués et doit gérer les jambes sur le vélo. Prépare ta transition T1 avant de nager.',
 ARRAY['olympique', '70.3'], 'triathlon', ARRAY['natation', 'velo']),

('BRI-10', 'brique', 'brique', 'Brique complète triathlon sprint', 90, 8,
 NULL,
 'Nage : 750m à allure objectif → T1 rapide → Vélo : 20km à 80-85% FTP → T2 rapide → Course : 5km à allure objectif',
 NULL, NULL,
 'Répétition générale sprint. Reproduis exactement les conditions de course : équipement, alimentation, allures. C''est en faisant qu''on apprend — ne te souviens pas de cette séance comme d''un entraînement, souviens-t''en comme de ta première course.',
 ARRAY['sprint'], 'triathlon', ARRAY['natation', 'velo', 'course']);

-- ============================================================
-- TRAIL (TRAIL)
-- ============================================================
INSERT INTO public.session_library (code, type, category, name, duration_min, intensity_rpe, warmup, main_set, recovery, cooldown, coach_notes, compatible_goals, sport, montagne_only) VALUES

('TRAIL-01', 'trail', 'trail', 'Sortie trail endurance — 1h terrain varié', 60, 5,
 NULL,
 '60 min trail à effort endurance (65-72% VMA ressenti) — marche dans les montées raides si nécessaire, course sur le plat et en descente',
 NULL, NULL,
 'Le trail c''est l''effort ressenti qui guide, pas l''allure. Marcher en montée n''est pas une faiblesse — c''est une stratégie. Économise-toi dans les montées pour courir dans les descentes.',
 ARRAY['trail_court', 'trail_long', 'ultra'], 'running', true),

('TRAIL-02', 'trail', 'trail', 'Sortie trail endurance — 1h30 terrain varié', 90, 6,
 NULL,
 '90 min trail à effort endurance — marche active en montée, course sur plat et descente',
 NULL, NULL,
 'Heure et demie de trail. La fatigue s''installe — la marche en montée devient une alliée, pas un aveu. Ravitaille-toi si tu as des réserves sur toi.',
 ARRAY['trail_court', 'trail_long', 'ultra'], 'running', true),

('TRAIL-03', 'trail', 'trail', 'Sortie trail endurance — 2h terrain montagneux', 120, 6,
 NULL,
 '2h trail en terrain montagneux — alternance course, marche rapide, descente technique',
 NULL, NULL,
 'Deux heures en montagne. Les bâtons sont autorisés si tu en as. Ravitaillement : eau + gel toutes les 45min. Descends prudemment — les genoux se souviennent de tout.',
 ARRAY['trail_long', 'ultra'], 'running', true),

('TRAIL-04', 'trail', 'trail', 'Fractionné trail — 6x4min montée soutenue', 65, 8,
 '20 min footing progressif avec 4 accélérations courtes',
 '6x4min de montée en trail à RPE 7-8 — effort soutenu, technique de montée optimisée',
 'Descente lente 2min entre chaque montée',
 '10 min footing lent en descente',
 'Six montées de 4 minutes — ton cœur et tes fessiers vont en voir de toutes les couleurs. Concentre-toi sur la technique de montée : gainage, appui efficace, bras actifs.',
 ARRAY['trail_court', 'trail_long', 'ultra'], 'running', true),

('TRAIL-05', 'trail', 'trail', 'Fractionné trail — 4x6min montée longue', 70, 8,
 '20 min footing progressif',
 '4x6min de montée à RPE 7-8 — effort long en montée, régulier',
 'Descente lente 3min entre chaque montée',
 '10 min footing lent',
 'Six minutes de montée, c''est long. L''effort doit être géré — tu ne peux pas partir à fond sans exploser. Cherche ton rythme de croisière en montée.',
 ARRAY['trail_long', 'ultra'], 'running', true),

('TRAIL-06', 'trail', 'trail', 'Marche rapide technique — 1h dénivelé accumulé', 60, 5,
 NULL,
 '1h de marche rapide en terrain montagneux — objectif : accumuler 400-600m de D+ selon ton terrain, marche nordique si tu as des bâtons',
 NULL, NULL,
 'Séance de marche rapide uniquement. La marche en compétition trail est une technique — entraîne-toi spécifiquement. Bâtons bienvenus. Pousse fort derrière à chaque pas.',
 ARRAY['trail_long', 'ultra'], 'running', true),

('TRAIL-07', 'trail', 'trail', 'Descente technique — 40min descentes répétées', 65, 7,
 '15 min footing lent pour montée initiale',
 '5 répétitions de descente technique — focus pied avant, regard loin, relâchement, lignes de fuite',
 'Montée lente entre chaque descente',
 '5 min footing lent',
 'La descente trail s''apprend. Regard 5-10m devant, bras légèrement écartés pour l''équilibre, centre de gravité bas, ne freine pas avec les talons. Les premières descentes seront hésitantes — c''est normal.',
 ARRAY['trail_court', 'trail_long', 'ultra'], 'running', true),

('TRAIL-08', 'trail', 'trail', 'Trail spécifique — Simulation course 2h30', 150, 7,
 NULL,
 '2h30 trail en terrain proche de ta course objectif — reproduis le profil de la course : même D+, mêmes surfaces',
 NULL, NULL,
 'Répétition générale trail. Utilise le même équipement qu''en course (chaussures, sac, alimentation). Teste tout ce que tu vas utiliser le jour J. Ne découvre rien en compétition.',
 ARRAY['trail_long', 'ultra'], 'running', true),

('TRAIL-09', 'trail', 'trail', 'Trail long — 3h+ endurance ultra', 180, 6,
 NULL,
 '3h à 3h30 trail à allure ultra (60-65% VMA ressenti) — marche systématique en montée, course sur plat/descente',
 NULL, NULL,
 'Séance ultra. L''allure doit être très conservatrice — si tu penses que tu vas trop lentement, c''est probablement la bonne allure. Alimentation toutes les 30-40min. Cette séance prépare ton corps à l''ultra autant mentalement que physiquement.',
 ARRAY['ultra'], 'running', true),

('TRAIL-10', 'trail', 'trail', 'Trail nuit — 1h30 lampe frontale', 90, 6,
 NULL,
 '1h30 trail de nuit avec lampe frontale — allure très conservatrice, terrain connu, technique de course nocturne',
 NULL, NULL,
 'Course de nuit : réduis ta foulée, baisse ton regard, accepte d''aller plus lentement. La nuit trompe la perception du terrain. Si ta course a une partie nocturne, cette séance est obligatoire.',
 ARRAY['trail_long', 'ultra'], 'running', true),

('TRAIL-11', 'trail', 'trail', 'Fractionné trail mixte — 4x(3min montée + descente + 2min plat)', 65, 8,
 '20 min footing progressif',
 '4 blocs : 3min montée à RPE 8 → descente libre → 2min course soutenue sur plat à RPE 7 — récup 2min footing lent entre blocs',
 '2min footing lent entre chaque bloc complet',
 '10 min footing lent',
 'Tu enchaînes montée, descente et relance sur plat sans vraiment récupérer. Simule le profil ondulé de la plupart des trails. La relance sur plat après la descente est l''élément le plus formateur.',
 ARRAY['trail_court', 'trail_long'], 'running', true),

('TRAIL-12', 'trail', 'trail', 'Trail cadence — 30min terrain plat, cadence élevée', 55, 6,
 '10 min footing lent',
 '30min course trail sur terrain plat ou légèrement vallonné à 90-95 foulées/min — focus sur la cadence de foulée',
 NULL,
 '10 min footing lent',
 'Améliore ta cadence — en trail, une cadence élevée réduit les chocs et la fatigue musculaire. Compte tes foulées sur 30 secondes (objectif : 45 foulées d''un pied = 90 total). Utilise un métronome si besoin.',
 ARRAY['trail_court', 'trail_long', 'ultra'], 'running', false);

-- ── Mise à jour sport pour les séances de running déjà présentes ─
UPDATE public.session_library SET sport = 'running' WHERE sport IS NULL;

-- ── Index pour les requêtes fréquentes ───────────────────────
CREATE INDEX IF NOT EXISTS idx_session_library_sport ON public.session_library(sport);
CREATE INDEX IF NOT EXISTS idx_session_library_type  ON public.session_library(type);
CREATE INDEX IF NOT EXISTS idx_session_library_code  ON public.session_library(code);
