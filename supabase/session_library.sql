-- ============================================================
-- THE ULTIMATE ACADEMY — Session Library
-- Run this in the Supabase SQL editor
-- ============================================================

-- ── Drop & recreate (clean slate) ────────────────────────────
DROP TABLE IF EXISTS public.session_library;

CREATE TABLE public.session_library (
  code             TEXT PRIMARY KEY,
  type             TEXT NOT NULL,
  category         TEXT NOT NULL,
  name             TEXT NOT NULL,
  duration_min     INTEGER NOT NULL,
  intensity_rpe    INTEGER NOT NULL CHECK (intensity_rpe BETWEEN 1 AND 10),
  warmup           TEXT,
  main_set         TEXT NOT NULL,
  recovery         TEXT,
  cooldown         TEXT,
  coach_notes      TEXT,
  compatible_goals TEXT[]
);

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE public.session_library ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read session_library" ON public.session_library;
DROP POLICY IF EXISTS "Coach write session_library"        ON public.session_library;

CREATE POLICY "Authenticated read session_library"
  ON public.session_library FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Coach write session_library"
  ON public.session_library FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'coach')
  );

-- ── Data ─────────────────────────────────────────────────────

-- ── Endurance Fondamentale (EF) ──────────────────────────────
INSERT INTO public.session_library (code, type, category, name, duration_min, intensity_rpe, warmup, main_set, recovery, cooldown, coach_notes, compatible_goals) VALUES
('EF-01', 'endurance_fondamentale', 'endurance_fondamentale', 'Endurance fondamentale 35min', 55, 5,
 '10 min footing progressif à 65% VMA',
 '35 min footing régulier à 65-70% VMA — allure confortable, respiration nasale possible',
 NULL,
 '10 min footing très lent à 60-63% VMA',
 'Séance de base : tu dois pouvoir parler sans être essoufflé. Si tu halètes, ralentis.',
 ARRAY['5km', '10km', 'semi', 'marathon']),

('EF-02', 'endurance_fondamentale', 'endurance_fondamentale', 'Endurance fondamentale 45min', 65, 5,
 '10 min footing progressif à 65% VMA',
 '45 min footing régulier à 65-70% VMA — zone de confort aérobie',
 NULL,
 '10 min footing très lent à 60-63% VMA',
 'L''endurance fondamentale c''est le socle. Sois patient, la progression se fait en profondeur.',
 ARRAY['5km', '10km', 'semi', 'marathon']),

('EF-03', 'endurance_fondamentale', 'endurance_fondamentale', 'Endurance fondamentale 50min', 70, 5,
 '10 min footing progressif à 65% VMA',
 '50 min footing régulier à 65-70% VMA — effort continu et régulier',
 NULL,
 '10 min footing très lent à 60-63% VMA',
 'Reste dans ta zone de confort tout au long. C''est le volume qui compte, pas l''intensité.',
 ARRAY['10km', 'semi', 'marathon']),

('EF-04', 'endurance_fondamentale', 'endurance_fondamentale', 'Endurance fondamentale 60min', 80, 5,
 '10 min footing progressif à 65% VMA',
 '60 min footing régulier à 65-70% VMA — endurance aérobie développée',
 NULL,
 '10 min footing très lent à 60-63% VMA',
 'Une heure de footing solide. Hydrate-toi avant et après. Belle séance de fond.',
 ARRAY['semi', 'marathon']);

-- ── Récupération Active (RA) ─────────────────────────────────
INSERT INTO public.session_library (code, type, category, name, duration_min, intensity_rpe, warmup, main_set, recovery, cooldown, coach_notes, compatible_goals) VALUES
('RA-01', 'recuperation_active', 'recuperation_active', 'Récupération active 30min', 30, 3,
 NULL,
 '30 min footing très lent à 60-63% VMA — jambes légères, allure de promenade',
 NULL,
 NULL,
 'Séance de récupération pure. L''objectif n''est pas de se fatiguer mais d''activer la circulation. Si ça fait mal quelque part, marche.',
 ARRAY['5km', '10km', 'semi', 'marathon']),

('RA-02', 'recuperation_active', 'recuperation_active', 'Récupération active 40min', 40, 3,
 NULL,
 '40 min footing très lent à 60-63% VMA — allure récupération, effort minimal',
 NULL,
 NULL,
 'Reste dans la zone de récupération. C''est une séance de relance, pas d''entraînement.',
 ARRAY['semi', 'marathon']);

-- ── Footing Progressif (FP) ──────────────────────────────────
INSERT INTO public.session_library (code, type, category, name, duration_min, intensity_rpe, warmup, main_set, recovery, cooldown, coach_notes, compatible_goals) VALUES
('FP-01', 'footing_progressif', 'footing_progressif', 'Footing progressif 45min', 65, 6,
 '10 min footing très lent à 63-65% VMA',
 '15 min à 65-68% VMA → 15 min à 72-75% VMA → 15 min à 80-85% VMA',
 NULL,
 '10 min footing très lent à 60-63% VMA',
 'La progression se fait naturellement — chaque bloc est plus rapide. Sens la montée en puissance.',
 ARRAY['5km', '10km', 'semi', 'marathon']),

('FP-02', 'footing_progressif', 'footing_progressif', 'Footing progressif 50min', 70, 6,
 '10 min footing très lent à 63-65% VMA',
 '17 min à 65-68% VMA → 17 min à 72-75% VMA → 16 min à 80-85% VMA',
 NULL,
 '10 min footing très lent à 60-63% VMA',
 'Un classique qui développe ton sens de l''allure. Contrôle ta montre, apprends à écouter ton corps.',
 ARRAY['10km', 'semi', 'marathon']),

('FP-03', 'footing_progressif', 'footing_progressif', 'Footing progressif 60min', 80, 7,
 '10 min footing très lent à 63-65% VMA',
 '20 min à 65-68% VMA → 20 min à 72-75% VMA → 20 min à 80-85% VMA',
 NULL,
 '10 min footing très lent à 60-63% VMA',
 'Version longue du progressif. La dernière partie à 80-85% VMA doit être maîtrisée, pas subie.',
 ARRAY['semi', 'marathon']);

-- ── Tempo / Seuil (T) ────────────────────────────────────────
INSERT INTO public.session_library (code, type, category, name, duration_min, intensity_rpe, warmup, main_set, recovery, cooldown, coach_notes, compatible_goals) VALUES
('T-01', 'tempo_seuil', 'tempo_seuil', 'Tempo 3x10min — Introduction seuil', 65, 7,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '3x10min à 82-88% VMA',
 '3 min footing lent à 63-65% VMA entre chaque répétition',
 '10 min footing très lent à 60-63% VMA',
 'Séance de seuil pour découvrir cette zone d''effort. Tu dois pouvoir prononcer des mots mais pas des phrases.',
 ARRAY['5km', '10km', 'semi']),

('T-02', 'tempo_seuil', 'tempo_seuil', 'Tempo 2x15min — Développement seuil', 70, 7,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '2x15min à 82-88% VMA',
 '4 min footing lent à 63-65% VMA entre les 2 blocs',
 '10 min footing très lent à 60-63% VMA',
 'Deux bons blocs de seuil. Garde le même rythme sur le deuxième bloc — ne pars pas trop vite.',
 ARRAY['5km', '10km', 'semi', 'marathon']),

('T-03', 'tempo_seuil', 'tempo_seuil', 'Tempo 20min continu — Seuil consolidé', 65, 7,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '20min continu à 82-88% VMA — effort soutenu et régulier',
 NULL,
 '10 min footing très lent à 60-63% VMA',
 'Vingt minutes de seuil en continu, c''est une belle séance. Pars raisonnablement pour finir fort.',
 ARRAY['10km', 'semi', 'marathon']),

('T-04', 'tempo_seuil', 'tempo_seuil', 'Tempo 2x20min — Volume seuil', 80, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '2x20min à 82-88% VMA',
 '5 min footing lent à 63-65% VMA entre les 2 blocs',
 '10 min footing très lent à 60-63% VMA',
 'Séance exigeante. Si le deuxième bloc est nettement plus lent, note-le. C''est une info précieuse sur ta forme.',
 ARRAY['semi', 'marathon']),

('T-05', 'tempo_seuil', 'tempo_seuil', 'Tempo 30min continu — Seuil long', 75, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m',
 '30min continu à 82-88% VMA — tempo soutenu',
 NULL,
 '10 min footing très lent à 60-63% VMA',
 'Trente minutes de seuil en continu, c''est une séance clé. Concentre-toi sur la régularité de l''allure.',
 ARRAY['semi', 'marathon']);

-- ── Fractionné Court (FC) ────────────────────────────────────
INSERT INTO public.session_library (code, type, category, name, duration_min, intensity_rpe, warmup, main_set, recovery, cooldown, coach_notes, compatible_goals) VALUES
('FC-01', 'fractionne_court', 'fractionne_court', '10x400m — Vitesse pure', 65, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m en accélération progressive',
 '10x400m à 95-100% VMA',
 '1''00 en marchant entre chaque répétition',
 '10 min footing très lent à 60-63% VMA',
 'Séance de vitesse classique. Chaque 400m doit être régulier — pas de sprint kamikaze sur les premiers.',
 ARRAY['5km', '10km', 'semi', 'marathon']),

('FC-02', 'fractionne_court', 'fractionne_court', '8x400m — Endurance de vitesse', 60, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m en accélération progressive',
 '8x400m à 95-100% VMA',
 '1''15 en marchant entre chaque répétition',
 '10 min footing très lent à 60-63% VMA',
 'Version accessible du 400m. Idéale pour introduire la vitesse sans trop fatiguer. Progressif sur les semaines.',
 ARRAY['5km', '10km', 'semi']),

('FC-03', 'fractionne_court', 'fractionne_court', '12x300m — Vitesse courte intensive', 60, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m en accélération progressive',
 '12x300m à 97-105% VMA',
 '1''00 en marchant entre chaque répétition',
 '10 min footing très lent à 60-63% VMA',
 'Travail de vitesse sur 300m. Maintiens l''allure sur les 8 dernières répétitions — c''est là que ça se construit.',
 ARRAY['5km', '10km']),

('FC-04', 'fractionne_court', 'fractionne_court', '6x500m — Puissance aérobie', 65, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m en accélération progressive',
 '6x500m à 93-98% VMA',
 '1''30 en marchant entre chaque répétition',
 '10 min footing très lent à 60-63% VMA',
 'Le 500m est une distance charnière entre vitesse et résistance. Belle séance polyvalente.',
 ARRAY['5km', '10km', 'semi']),

('FC-05', 'fractionne_court', 'fractionne_court', '10x200m — VMA courte', 55, 9,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m en accélération progressive',
 '10x200m à 100-110% VMA',
 '1''00 en marchant entre chaque répétition',
 '10 min footing très lent à 60-63% VMA',
 'Séance de VMA courte. Les 200m doivent être courus vite et de façon relâchée. Si tu te crispes, tu perds en efficacité.',
 ARRAY['5km', '10km']),

('FC-06', 'fractionne_court', 'fractionne_court', '15x200m — Volume vitesse', 60, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m en accélération progressive',
 '15x200m à 100-107% VMA',
 '45'' en marchant entre chaque répétition',
 '10 min footing très lent à 60-63% VMA',
 'Volume élevé sur courte distance. La récupération courte oblige à gérer l''allure. Commence conservateur.',
 ARRAY['5km', '10km', 'semi']);

-- ── Fractionné Long (FL) ─────────────────────────────────────
INSERT INTO public.session_library (code, type, category, name, duration_min, intensity_rpe, warmup, main_set, recovery, cooldown, coach_notes, compatible_goals) VALUES
('FL-01', 'fractionne_long', 'fractionne_long', '3x1000m — Initiation fractionné long', 55, 7,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m en accélération progressive',
 '3x1000m à 85-90% VMA',
 '2''30 en marchant / trot lent entre chaque répétition',
 '10 min footing très lent à 60-63% VMA',
 'Séance d''initiation parfaite pour les débutants. Trois km à effort, pas plus. La qualité prime sur la quantité.',
 ARRAY['5km', '10km']),

('FL-02', 'fractionne_long', 'fractionne_long', '4x1000m — Développement VMA longue', 60, 7,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m en accélération progressive',
 '4x1000m à 85-90% VMA',
 '2''30 en marchant / trot lent entre chaque répétition',
 '10 min footing très lent à 60-63% VMA',
 'Quatre km à intensité — tu commences à construire ta résistance. Régularité sur les 4 répétitions.',
 ARRAY['5km', '10km', 'semi']),

('FL-03', 'fractionne_long', 'fractionne_long', '5x1000m — VMA endurance', 65, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m en accélération progressive',
 '5x1000m à 83-90% VMA',
 '2''00 en marchant / trot lent entre chaque répétition',
 '10 min footing très lent à 60-63% VMA',
 'La séance classique 5x1000m. Cinq répétitions régulières valent mieux que 3 bonnes et 2 ratées.',
 ARRAY['5km', '10km', 'semi', 'marathon']),

('FL-04', 'fractionne_long', 'fractionne_long', '4x2000m — Seuil aérobie long', 70, 7,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m en accélération progressive',
 '4x2000m à 80-87% VMA',
 '3''00 en trottinant lent entre chaque répétition',
 '10 min footing très lent à 60-63% VMA',
 'Séance clé pour le semi-marathon. Les 2000m à cette intensité sont très spécifiques à ta course. Sens le rythme.',
 ARRAY['10km', 'semi', 'marathon']),

('FL-05', 'fractionne_long', 'fractionne_long', '5x2000m — Volume seuil aérobie', 80, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m en accélération progressive',
 '5x2000m à 80-87% VMA',
 '3''00 en trottinant lent entre chaque répétition',
 '10 min footing très lent à 60-63% VMA',
 'Version volume du 2000m. Dix km à intensité — réserve-toi pour les 2 derniers qui font toute la différence.',
 ARRAY['semi', 'marathon']),

('FL-06', 'fractionne_long', 'fractionne_long', '3x2000m — Introduction seuil long', 60, 7,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m en accélération progressive',
 '3x2000m à 80-87% VMA',
 '3''30 en trottinant lent entre chaque répétition',
 '10 min footing très lent à 60-63% VMA',
 'Parfait pour passer du 1000m au 2000m. Trois répétitions de qualité pour construire la résistance longue.',
 ARRAY['10km', 'semi']),

('FL-07', 'fractionne_long', 'fractionne_long', '3x3000m — Endurance spécifique marathon', 80, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m en accélération progressive',
 '3x3000m à 80-85% VMA',
 '4''00 en trottinant lent entre chaque répétition',
 '10 min footing très lent à 60-63% VMA',
 'Séance marathon clé. Neuf km à intensité — c''est là que tu construis l''endurance spécifique dont tu as besoin.',
 ARRAY['marathon']),

('FL-08', 'fractionne_long', 'fractionne_long', '6x1000m — VMA confirmé', 65, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m en accélération progressive',
 '6x1000m à 85-90% VMA',
 '2''00 en marchant / trot lent entre chaque répétition',
 '10 min footing très lent à 60-63% VMA',
 'Pour coureurs confirmés. Six répétitions régulières — si le 5ème et 6ème s''effondrent, l''allure était trop rapide.',
 ARRAY['5km', '10km', 'semi', 'marathon']),

('FL-09', 'fractionne_long', 'fractionne_long', '8x1000m — Volume VMA', 75, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m en accélération progressive',
 '8x1000m à 83-88% VMA',
 '1''30 en marchant / trot lent entre chaque répétition',
 '10 min footing très lent à 60-63% VMA',
 'Volume élevé sur 1000m. La récupération plus courte demande de gérer l''allure avec intelligence. Commence conservateur.',
 ARRAY['10km', 'semi', 'marathon']),

('FL-10', 'fractionne_long', 'fractionne_long', '10x1000m — Volume max VMA', 90, 9,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m en accélération progressive',
 '10x1000m à 83-88% VMA',
 '1''30 en marchant / trot lent entre chaque répétition',
 '10 min footing très lent à 60-63% VMA',
 'Séance de très haut volume pour experts. Dix km à intensité — réserve-toi mentalement et pars raisonnablement.',
 ARRAY['semi', 'marathon']),

('FL-11', 'fractionne_long', 'fractionne_long', '4x1500m — Intermédiaire VMA', 65, 7,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m en accélération progressive',
 '4x1500m à 83-88% VMA',
 '2''30 en trottinant lent entre chaque répétition',
 '10 min footing très lent à 60-63% VMA',
 'Le 1500m est un bon intermédiaire. Permet de varier entre le 1000m et le 2000m tout en restant spécifique.',
 ARRAY['10km', 'semi']),

('FL-12', 'fractionne_long', 'fractionne_long', '2x5000m — Long spécifique marathon', 90, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m en accélération progressive',
 '2x5000m à 78-83% VMA',
 '5''00 en trottinant lent entre les 2 blocs',
 '10 min footing très lent à 60-63% VMA',
 'Séance exigeante pour marathoniens. Deux blocs de 5km à intensité modérée-haute — le deuxième bloc est le vrai test.',
 ARRAY['marathon']),

('FL-13', 'fractionne_long', 'fractionne_long', '3000m/5000m/3000m progressif — Séance marathon clé', 90, 9,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m en accélération progressive',
 '3000m à 80-82% VMA → récup 4min → 5000m à 82-85% VMA → récup 5min → 3000m à 85-88% VMA',
 'Récup variable : 4min après le 3000m, 5min après le 5000m — trot lent à 63% VMA',
 '10 min footing très lent à 60-63% VMA',
 'La grande séance marathon. Progression sur les 3 blocs — tu dois finir le dernier 3000m plus fort que le premier.',
 ARRAY['marathon']),

('FL-14', 'fractionne_long', 'fractionne_long', '5x2000m + blocs allure spécifique — Séance marathon', 85, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m en accélération progressive',
 '3x2000m à 82-87% VMA → récup 3min → 2x2000m à allure marathon cible',
 '3''00 en trottinant lent entre chaque répétition',
 '10 min footing très lent à 60-63% VMA',
 'Mélange de seuil et d''allure spécifique. La transition vers l''allure marathon sur les 2 derniers blocs est l''élément clé.',
 ARRAY['marathon']);

-- ── Sortie Longue (SL) ───────────────────────────────────────
INSERT INTO public.session_library (code, type, category, name, duration_min, intensity_rpe, warmup, main_set, recovery, cooldown, coach_notes, compatible_goals) VALUES
('SL-01', 'sortie_longue', 'sortie_longue', 'Sortie longue 70min', 70, 5,
 '10 min footing très lent à 63-65% VMA',
 '60 min à 65-72% VMA — allure confortable, effort régulier et constant',
 NULL,
 NULL,
 'Ta sortie longue de la semaine. Reste à l''aise, hydrate-toi. Ce n''est pas une course, c''est du fond.',
 ARRAY['5km', '10km']),

('SL-02', 'sortie_longue', 'sortie_longue', 'Sortie longue 80min', 80, 5,
 '10 min footing très lent à 63-65% VMA',
 '70 min à 65-72% VMA — endurance aérobie en continu',
 NULL,
 NULL,
 'Bonne sortie longue. Mange quelque chose avant si tu pars à jeun plus de 60min. Gère bien le début.',
 ARRAY['5km', '10km', 'semi']),

('SL-03', 'sortie_longue', 'sortie_longue', 'Sortie longue 90min', 90, 6,
 '10 min footing très lent à 63-65% VMA',
 '80 min à 65-72% VMA — volume endurance, reste dans la zone de confort',
 NULL,
 NULL,
 'Prends un gel ou une barre à partir de 60min. Gère l''allure sur la première heure pour finir fort.',
 ARRAY['10km', 'semi', 'marathon']),

('SL-04', 'sortie_longue', 'sortie_longue', 'Sortie longue 100min', 100, 6,
 '10 min footing très lent à 63-65% VMA',
 '90 min à 65-72% VMA — endurance longue, ravitaillement nécessaire',
 NULL,
 NULL,
 'Pense à ton ravitaillement. Gel toutes les 40-45min. C''est une séance qui prépare ton corps à tenir sur la durée.',
 ARRAY['semi', 'marathon']),

('SL-05', 'sortie_longue', 'sortie_longue', 'Sortie longue 110min avec blocs allure marathon', 110, 7,
 '15 min footing très lent à 63-65% VMA',
 '75 min à 65-72% VMA puis 20 min à allure marathon cible',
 NULL,
 NULL,
 'La reine des sorties longues pour le marathon. Les 20 dernières minutes à allure cible simulent les conditions de course. Sois prêt mentalement.',
 ARRAY['marathon']),

('SL-06', 'sortie_longue', 'sortie_longue', 'Sortie longue 120min — Endurance marathon', 120, 6,
 '10 min footing très lent à 63-65% VMA',
 '110 min à 65-72% VMA — volume endurance maximal du cycle',
 NULL,
 NULL,
 'Deux heures de course. Plan de ravitaillement solide : gel toutes les 40min, eau régulièrement. Allure très confortable sur les 3/4.',
 ARRAY['marathon']);

-- ── Côtes (CO) ───────────────────────────────────────────────
INSERT INTO public.session_library (code, type, category, name, duration_min, intensity_rpe, warmup, main_set, recovery, cooldown, coach_notes, compatible_goals) VALUES
('CO-01', 'cotes', 'cotes', 'Côtes courtes 8x80m — Puissance neuromusculaire', 60, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m en accélération progressive',
 '8x80m en côte à RPE 8-9/10 — montée dynamique, foulée ample',
 'Descente en marchant doucement pour récupération complète',
 '10 min footing très lent à 60-63% VMA',
 'Les côtes renforcent les appuis et la foulée. Monte en attaquant le sol, bras actifs. Laisse-toi le temps de récupérer en descente.',
 ARRAY['5km', '10km', 'semi', 'marathon']),

('CO-02', 'cotes', 'cotes', 'Côtes longues 6x200m — Résistance en montée', 65, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m en accélération progressive',
 '6x200m en côte à RPE 7-8/10 — effort soutenu et régulier sur toute la longueur',
 'Descente en trottinant très lentement pour récupération active',
 '10 min footing très lent à 60-63% VMA',
 'Les côtes longues développent la résistance spécifique. Maintiens l''effort sur les 200m entiers.',
 ARRAY['5km', '10km', 'semi', 'marathon']),

('CO-03', 'cotes', 'cotes', 'Côtes mixtes 10x100m — Variété neuromusculaire', 60, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m en accélération progressive',
 '10x100m en côte à RPE 8-9/10 — alternance entre 5 montées rapides et 5 montées en foulées exagérées',
 'Descente en marchant doucement pour récupération complète',
 '10 min footing très lent à 60-63% VMA',
 'Varie les stimulations : 5 montées à vitesse maximale, 5 montées avec exagération de la foulée (levée de genoux). Double bénéfice neuromusculaire.',
 ARRAY['5km', '10km', 'semi']);

-- ── Spécifique Allure Objectif (SP) ─────────────────────────
INSERT INTO public.session_library (code, type, category, name, duration_min, intensity_rpe, warmup, main_set, recovery, cooldown, coach_notes, compatible_goals) VALUES
('SP-01', 'specifique', 'specifique', 'Blocs allure objectif — Introduction spécifique', 65, 7,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m en accélération progressive',
 '3x2km à allure objectif course (≈92% VMA) — récup 3min trot lent entre chaque',
 '3''00 en trottinant lent à 63-65% VMA entre chaque répétition',
 '10 min footing très lent à 60-63% VMA',
 'Tu coures à l''allure de ta course objectif. Grave cette sensation dans ta mémoire musculaire.',
 ARRAY['5km', '10km', 'semi', 'marathon']),

('SP-02', 'specifique', 'specifique', 'Blocs allure semi-marathon 3x3km', 75, 7,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m en accélération progressive',
 '3x3km à allure objectif semi-marathon — récup 3min trot lent entre chaque',
 '3''00 en trottinant lent à 63-65% VMA entre chaque répétition',
 '10 min footing très lent à 60-63% VMA',
 'Neuf km à allure semi. Régularité absolue sur les 3 blocs. C''est la prépa directe à ta course.',
 ARRAY['semi']),

('SP-03', 'specifique', 'specifique', 'Blocs allure 10km 4x2km', 70, 7,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m en accélération progressive',
 '4x2km à allure objectif 10km (≈90-93% VMA) — récup 2''30 trot lent entre chaque',
 '2''30 en trottinant lent à 63-65% VMA entre chaque répétition',
 '10 min footing très lent à 60-63% VMA',
 'Huit km à l''allure du 10km. Si tu tiens le quatrième bloc, tu es prêt. Restent les jambes le jour J.',
 ARRAY['10km']),

('SP-04', 'specifique', 'specifique', 'Blocs allure 5km 5x1km', 60, 8,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m en accélération progressive',
 '5x1km à allure objectif 5km (≈95-100% VMA) — récup 2min marche entre chaque',
 '2''00 en marchant entre chaque répétition',
 '10 min footing très lent à 60-63% VMA',
 'L''allure 5km, c''est inconfortable. Cinq fois 1km à cette intensité te donne la sensation de course. Bienvenue dans la zone rouge.',
 ARRAY['5km']),

('SP-05', 'specifique', 'specifique', 'Blocs allure marathon 3x5km', 90, 7,
 '25 min progressif à 65-72% VMA, terminer par 4 lignes droites 80m en accélération progressive',
 '3x5km à allure objectif marathon (≈82-87% VMA) — récup 4min trot lent entre chaque',
 '4''00 en trottinant lent à 63-65% VMA entre chaque répétition',
 '10 min footing très lent à 60-63% VMA',
 'Quinze km à allure marathon. Séance de référence pour savoir si tu es prêt. Gère impeccablement le premier bloc.',
 ARRAY['marathon']);

-- ── Renforcement (RENFO) ─────────────────────────────────────
INSERT INTO public.session_library (code, type, category, name, duration_min, intensity_rpe, warmup, main_set, recovery, cooldown, coach_notes, compatible_goals) VALUES
('RENFO-01', 'renforcement', 'renforcement', 'Gainage & Stabilité', 30, 5,
 NULL,
 'Référence-toi à l''onglet Renforcement — effectue la séance ''Gainage & Stabilité''',
 NULL,
 NULL,
 'Le gainage est la base. Un tronc solide = une foulée plus économique et moins de blessures. Sois rigoureux sur la qualité des positions.',
 ARRAY['5km', '10km', 'semi', 'marathon']),

('RENFO-02', 'renforcement', 'renforcement', 'Force & Puissance', 30, 7,
 NULL,
 'Référence-toi à l''onglet Renforcement — effectue la séance ''Force & Puissance''',
 NULL,
 NULL,
 'Développe la force musculaire spécifique au running. Ces exercices rendent tes appuis plus explosifs et réduisent le temps de contact au sol.',
 ARRAY['5km', '10km', 'semi', 'marathon']),

('RENFO-03', 'renforcement', 'renforcement', 'Excentrique & Prévention', 25, 4,
 NULL,
 'Référence-toi à l''onglet Renforcement — effectue la séance ''Excentrique & Prévention''',
 NULL,
 NULL,
 'La prévention c''est l''investissement le plus rentable du running. Ces exercices excentriques protègent tes tendons et articulations sur le long terme.',
 ARRAY['5km', '10km', 'semi', 'marathon']),

('RENFO-04', 'renforcement', 'renforcement', 'Explosivité & Vitesse', 30, 8,
 NULL,
 'Référence-toi à l''onglet Renforcement — effectue la séance ''Explosivité & Vitesse''',
 NULL,
 NULL,
 'Travail neuromusculaire pour améliorer ton explosivité et ta coordination. Fais-le quand tu es frais — pas après une grosse séance.',
 ARRAY['5km', '10km', 'semi']),

('RENFO-05', 'renforcement', 'renforcement', 'Mobilité & Récupération', 25, 3,
 NULL,
 'Référence-toi à l''onglet Renforcement — effectue la séance ''Mobilité & Récupération''',
 NULL,
 NULL,
 'Séance de mobilité et d''entretien articulaire. Parfaite le lendemain d''une sortie longue ou d''une séance intensive. Prends ton temps.',
 ARRAY['5km', '10km', 'semi', 'marathon']);
