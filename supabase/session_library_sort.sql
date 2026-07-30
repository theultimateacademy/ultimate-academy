-- ============================================================
-- SESSION LIBRARY — Ordre d'affichage précis
-- Ajoute une colonne sort_order pour contrôler l'ordre exact
-- ============================================================

ALTER TABLE public.session_library ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 999;

-- ── Footing Récupération ──────────────────────────────────────
UPDATE public.session_library SET sort_order = 10 WHERE code = 'RA-01';   -- 25min
UPDATE public.session_library SET sort_order = 20 WHERE code = 'RA-02';   -- 35min
UPDATE public.session_library SET sort_order = 25 WHERE code = 'FR-01';   -- 30min
UPDATE public.session_library SET sort_order = 30 WHERE code = 'FR-02';   -- 37min
UPDATE public.session_library SET sort_order = 35 WHERE code = 'RA-03';   -- 40min
UPDATE public.session_library SET sort_order = 40 WHERE code = 'FR-03';   -- 45min

-- ── Endurance Fondamentale ────────────────────────────────────
UPDATE public.session_library SET sort_order = 10 WHERE code = 'EF-01';   -- 30min
UPDATE public.session_library SET sort_order = 20 WHERE code = 'EF-02';   -- 40min
UPDATE public.session_library SET sort_order = 30 WHERE code = 'EF-06';   -- 45min
UPDATE public.session_library SET sort_order = 40 WHERE code = 'EF-03';   -- 50min
UPDATE public.session_library SET sort_order = 50 WHERE code = 'EF-04';   -- 60min
UPDATE public.session_library SET sort_order = 60 WHERE code = 'EF-05';   -- 70min

-- ── Footing Progressif ────────────────────────────────────────
UPDATE public.session_library SET sort_order = 10 WHERE code = 'FP-01';   -- 3 phases 45min
UPDATE public.session_library SET sort_order = 20 WHERE code = 'FP-02';   -- 3 phases 54min
UPDATE public.session_library SET sort_order = 30 WHERE code = 'FP-03';   -- 3 phases 63min
UPDATE public.session_library SET sort_order = 40 WHERE code = 'FP-04';   -- inversé

-- ── Tempo / Seuil ─────────────────────────────────────────────
UPDATE public.session_library SET sort_order = 10  WHERE code = 'T-01';   -- 3x8min
UPDATE public.session_library SET sort_order = 20  WHERE code = 'T-03';   -- 4x8min
UPDATE public.session_library SET sort_order = 30  WHERE code = 'T-02';   -- 3x10min
UPDATE public.session_library SET sort_order = 40  WHERE code = 'T-08';   -- 3x12min
UPDATE public.session_library SET sort_order = 50  WHERE code = 'T-04';   -- 2x15min
UPDATE public.session_library SET sort_order = 60  WHERE code = 'T-05';   -- 20min continu
UPDATE public.session_library SET sort_order = 70  WHERE code = 'T-06';   -- 2x20min
UPDATE public.session_library SET sort_order = 80  WHERE code = 'T-07';   -- 30min continu
UPDATE public.session_library SET sort_order = 90  WHERE code = 'T-09';   -- ondulé
UPDATE public.session_library SET sort_order = 100 WHERE code = 'T-10';   -- montée de régime

-- ── Fractionné Court — 200m ───────────────────────────────────
UPDATE public.session_library SET sort_order = 10 WHERE code = 'FC-01';   -- 10x200m
UPDATE public.session_library SET sort_order = 20 WHERE code = 'FC-02';   -- 15x200m
UPDATE public.session_library SET sort_order = 30 WHERE code = 'FC-03';   -- 20x200m
UPDATE public.session_library SET sort_order = 35 WHERE code = 'FC-14';   -- 5x(200m récup active)

-- ── Fractionné Court — 300m ───────────────────────────────────
UPDATE public.session_library SET sort_order = 40 WHERE code = 'FC-04';   -- 10x300m
UPDATE public.session_library SET sort_order = 50 WHERE code = 'FC-05';   -- 6x(300m+100m sprint)

-- ── Fractionné Court — 400m ───────────────────────────────────
UPDATE public.session_library SET sort_order = 60  WHERE code = 'FC-06';  -- 6x400m
UPDATE public.session_library SET sort_order = 70  WHERE code = 'FC-07';  -- 8x400m
UPDATE public.session_library SET sort_order = 80  WHERE code = 'FC-08';  -- 10x400m
UPDATE public.session_library SET sort_order = 90  WHERE code = 'FC-09';  -- 12x400m
UPDATE public.session_library SET sort_order = 100 WHERE code = 'FC-15';  -- 14x400m
UPDATE public.session_library SET sort_order = 110 WHERE code = 'FC-16';  -- 16x400m
UPDATE public.session_library SET sort_order = 120 WHERE code = 'FC-17';  -- 20x400m
UPDATE public.session_library SET sort_order = 125 WHERE code = 'FC-10';  -- 3x(4x400m) blocs

-- ── Fractionné Court — 500m ───────────────────────────────────
UPDATE public.session_library SET sort_order = 130 WHERE code = 'FC-11';  -- 6x500m
UPDATE public.session_library SET sort_order = 140 WHERE code = 'FC-12';  -- 8x500m

-- ── Fractionné Court — Mixte ──────────────────────────────────
UPDATE public.session_library SET sort_order = 150 WHERE code = 'FC-13';  -- dégressif 400-300-200-100

-- ── Fractionné Long — 1000m ───────────────────────────────────
UPDATE public.session_library SET sort_order = 10  WHERE code = 'FL-01';  -- 3x1000m
UPDATE public.session_library SET sort_order = 20  WHERE code = 'FL-02';  -- 4x1000m
UPDATE public.session_library SET sort_order = 30  WHERE code = 'FL-03';  -- 5x1000m
UPDATE public.session_library SET sort_order = 40  WHERE code = 'FL-04';  -- 6x1000m
UPDATE public.session_library SET sort_order = 50  WHERE code = 'FL-05';  -- 8x1000m
UPDATE public.session_library SET sort_order = 60  WHERE code = 'FL-06';  -- 10x1000m

-- ── Fractionné Long — 1500m ───────────────────────────────────
UPDATE public.session_library SET sort_order = 70  WHERE code = 'FL-07';  -- 4x1500m
UPDATE public.session_library SET sort_order = 80  WHERE code = 'FL-08';  -- 5x1500m

-- ── Fractionné Long — 2000m ───────────────────────────────────
UPDATE public.session_library SET sort_order = 90  WHERE code = 'FL-09';  -- 3x2000m
UPDATE public.session_library SET sort_order = 100 WHERE code = 'FL-10';  -- 4x2000m
UPDATE public.session_library SET sort_order = 110 WHERE code = 'FL-11';  -- 5x2000m

-- ── Fractionné Long — 3000m ───────────────────────────────────
UPDATE public.session_library SET sort_order = 120 WHERE code = 'FL-12';  -- 3x3000m

-- ── Fractionné Long — 5000m ───────────────────────────────────
UPDATE public.session_library SET sort_order = 130 WHERE code = 'FL-13';  -- 2x5000m

-- ── Fractionné Long — Blocs complexes ────────────────────────
UPDATE public.session_library SET sort_order = 140 WHERE code = 'FL-14';  -- 4x(500-1000-500)
UPDATE public.session_library SET sort_order = 150 WHERE code = 'FL-15';  -- 3x(1000-500-1000)
UPDATE public.session_library SET sort_order = 160 WHERE code = 'FL-16';  -- 2000-1500-1000-500 dégressif
UPDATE public.session_library SET sort_order = 170 WHERE code = 'FL-17';  -- 5x(1000+400)
UPDATE public.session_library SET sort_order = 180 WHERE code = 'FL-18';  -- 3000/5000/3000
UPDATE public.session_library SET sort_order = 190 WHERE code = 'FL-19';  -- 5x2000m allure marathon

-- ── Côtes — courtes (60-100m) ────────────────────────────────
UPDATE public.session_library SET sort_order = 10  WHERE code = 'CO-01';  -- 8x60m
UPDATE public.session_library SET sort_order = 20  WHERE code = 'CO-02';  -- 10x80m
UPDATE public.session_library SET sort_order = 30  WHERE code = 'CO-03';  -- 12x80m
UPDATE public.session_library SET sort_order = 35  WHERE code = 'CO-08';  -- 10x100m récup courte

-- ── Côtes — 150m ─────────────────────────────────────────────
UPDATE public.session_library SET sort_order = 40  WHERE code = 'CO-10';  -- 8x150m
UPDATE public.session_library SET sort_order = 50  WHERE code = 'CO-04';  -- 6x150m (existant)
UPDATE public.session_library SET sort_order = 55  WHERE code = 'CO-11';  -- 10x150m
UPDATE public.session_library SET sort_order = 60  WHERE code = 'CO-12';  -- 12x150m
UPDATE public.session_library SET sort_order = 65  WHERE code = 'CO-13';  -- 15x150m
UPDATE public.session_library SET sort_order = 70  WHERE code = 'CO-14';  -- 18x150m

-- ── Côtes — 200m ─────────────────────────────────────────────
UPDATE public.session_library SET sort_order = 80  WHERE code = 'CO-05';  -- 8x200m (existant)
UPDATE public.session_library SET sort_order = 85  WHERE code = 'CO-15';  -- 10x200m
UPDATE public.session_library SET sort_order = 90  WHERE code = 'CO-16';  -- 14x200m
UPDATE public.session_library SET sort_order = 95  WHERE code = 'CO-17';  -- 17x200m
UPDATE public.session_library SET sort_order = 100 WHERE code = 'CO-18';  -- 20x200m

-- ── Côtes — 300m ─────────────────────────────────────────────
UPDATE public.session_library SET sort_order = 110 WHERE code = 'CO-06';  -- 6x300m (existant)
UPDATE public.session_library SET sort_order = 115 WHERE code = 'CO-19';  -- 8x300m
UPDATE public.session_library SET sort_order = 120 WHERE code = 'CO-20';  -- 10x300m
UPDATE public.session_library SET sort_order = 125 WHERE code = 'CO-21';  -- 12x300m

-- ── Côtes — Mixtes / Créatives ────────────────────────────────
UPDATE public.session_library SET sort_order = 130 WHERE code = 'CO-07';  -- pyramide 80+150+250m
UPDATE public.session_library SET sort_order = 140 WHERE code = 'CO-09';  -- 3x5min montée continue trail

-- ── Spécifique ────────────────────────────────────────────────
UPDATE public.session_library SET sort_order = 10  WHERE code = 'SP-07';  -- intro 3x2km
UPDATE public.session_library SET sort_order = 20  WHERE code = 'SP-01';  -- 5km 5x1km
UPDATE public.session_library SET sort_order = 30  WHERE code = 'SP-02';  -- 10km 4x2km
UPDATE public.session_library SET sort_order = 40  WHERE code = 'SP-03';  -- 10km 5x2km
UPDATE public.session_library SET sort_order = 50  WHERE code = 'SP-09';  -- 10km continu
UPDATE public.session_library SET sort_order = 60  WHERE code = 'SP-04';  -- semi 3x3km
UPDATE public.session_library SET sort_order = 70  WHERE code = 'SP-05';  -- semi 4x3km
UPDATE public.session_library SET sort_order = 80  WHERE code = 'SP-06';  -- marathon 3x5km
UPDATE public.session_library SET sort_order = 90  WHERE code = 'SP-08';  -- spécifique inversé
UPDATE public.session_library SET sort_order = 100 WHERE code = 'SP-10';  -- longue progressive

-- ── Sortie Longue ─────────────────────────────────────────────
UPDATE public.session_library SET sort_order = 10  WHERE code = 'SL-01';  -- 60min
UPDATE public.session_library SET sort_order = 20  WHERE code = 'SL-02';  -- 70min
UPDATE public.session_library SET sort_order = 30  WHERE code = 'SL-03';  -- 80min
UPDATE public.session_library SET sort_order = 40  WHERE code = 'SL-04';  -- 90min
UPDATE public.session_library SET sort_order = 50  WHERE code = 'SL-08';  -- 90min + blocs semi
UPDATE public.session_library SET sort_order = 60  WHERE code = 'SL-05';  -- 100min
UPDATE public.session_library SET sort_order = 70  WHERE code = 'SL-06';  -- 110min
UPDATE public.session_library SET sort_order = 80  WHERE code = 'SL-09';  -- 110min + blocs marathon
UPDATE public.session_library SET sort_order = 90  WHERE code = 'SL-07';  -- 120min
UPDATE public.session_library SET sort_order = 100 WHERE code = 'SL-10';  -- 120min + progressif

-- ── Renforcement ──────────────────────────────────────────────
UPDATE public.session_library SET sort_order = 10 WHERE code = 'RENFO-05'; -- mobilité
UPDATE public.session_library SET sort_order = 20 WHERE code = 'RENFO-03'; -- excentrique
UPDATE public.session_library SET sort_order = 30 WHERE code = 'RENFO-01'; -- gainage
UPDATE public.session_library SET sort_order = 40 WHERE code = 'RENFO-02'; -- force
UPDATE public.session_library SET sort_order = 50 WHERE code = 'RENFO-04'; -- explosivité

-- ── Natation ──────────────────────────────────────────────────
UPDATE public.session_library SET sort_order = 10  WHERE code = 'NAT-09';  -- technique 10x50m
UPDATE public.session_library SET sort_order = 20  WHERE code = 'NAT-04';  -- 10x100m
UPDATE public.session_library SET sort_order = 30  WHERE code = 'NAT-05';  -- 8x100m vitesse
UPDATE public.session_library SET sort_order = 40  WHERE code = 'NAT-06';  -- 5x200m
UPDATE public.session_library SET sort_order = 50  WHERE code = 'NAT-08';  -- pyramide
UPDATE public.session_library SET sort_order = 60  WHERE code = 'NAT-07';  -- 4x400m
UPDATE public.session_library SET sort_order = 70  WHERE code = 'NAT-10';  -- simulation départ
UPDATE public.session_library SET sort_order = 80  WHERE code = 'NAT-12';  -- tempo 3x600m
UPDATE public.session_library SET sort_order = 90  WHERE code = 'NAT-01';  -- endurance 1200m
UPDATE public.session_library SET sort_order = 100 WHERE code = 'NAT-02';  -- endurance 1500m
UPDATE public.session_library SET sort_order = 110 WHERE code = 'NAT-03';  -- endurance 2000m
UPDATE public.session_library SET sort_order = 120 WHERE code = 'NAT-11';  -- volume 3000m

-- ── Vélo ──────────────────────────────────────────────────────
UPDATE public.session_library SET sort_order = 10  WHERE code = 'VEL-09';  -- cadence
UPDATE public.session_library SET sort_order = 20  WHERE code = 'VEL-08';  -- sprints 8x30sec
UPDATE public.session_library SET sort_order = 30  WHERE code = 'VEL-04';  -- intervalles 5x5min
UPDATE public.session_library SET sort_order = 40  WHERE code = 'VEL-05';  -- intervalles 4x8min
UPDATE public.session_library SET sort_order = 50  WHERE code = 'VEL-12';  -- blocs puissance
UPDATE public.session_library SET sort_order = 60  WHERE code = 'VEL-10';  -- collines 5x3min
UPDATE public.session_library SET sort_order = 70  WHERE code = 'VEL-06';  -- tempo 2x20min
UPDATE public.session_library SET sort_order = 80  WHERE code = 'VEL-07';  -- tempo 40min
UPDATE public.session_library SET sort_order = 90  WHERE code = 'VEL-01';  -- endurance 1h
UPDATE public.session_library SET sort_order = 100 WHERE code = 'VEL-02';  -- endurance 1h30
UPDATE public.session_library SET sort_order = 110 WHERE code = 'VEL-03';  -- endurance 2h
UPDATE public.session_library SET sort_order = 120 WHERE code = 'VEL-11';  -- simulation 2h30

-- ── Brique ────────────────────────────────────────────────────
UPDATE public.session_library SET sort_order = 10  WHERE code = 'BRI-08';  -- fractionnée 3x(15+5)
UPDATE public.session_library SET sort_order = 20  WHERE code = 'BRI-01';  -- intro 30+15min
UPDATE public.session_library SET sort_order = 30  WHERE code = 'BRI-02';  -- courte 45+20min
UPDATE public.session_library SET sort_order = 40  WHERE code = 'BRI-03';  -- simulation sprint
UPDATE public.session_library SET sort_order = 50  WHERE code = 'BRI-09';  -- nage+vélo
UPDATE public.session_library SET sort_order = 60  WHERE code = 'BRI-10';  -- triathlon sprint complet
UPDATE public.session_library SET sort_order = 70  WHERE code = 'BRI-04';  -- simulation olympique
UPDATE public.session_library SET sort_order = 80  WHERE code = 'BRI-05';  -- longue 1h30+30min
UPDATE public.session_library SET sort_order = 90  WHERE code = 'BRI-06';  -- 70.3 2h+45min
UPDATE public.session_library SET sort_order = 100 WHERE code = 'BRI-07';  -- ironman 3h+40min

-- ── Trail ─────────────────────────────────────────────────────
UPDATE public.session_library SET sort_order = 10  WHERE code = 'TRAIL-12'; -- cadence plat
UPDATE public.session_library SET sort_order = 20  WHERE code = 'TRAIL-04'; -- 6x4min montée
UPDATE public.session_library SET sort_order = 30  WHERE code = 'TRAIL-05'; -- 4x6min montée
UPDATE public.session_library SET sort_order = 40  WHERE code = 'TRAIL-11'; -- mixte montée+descente+plat
UPDATE public.session_library SET sort_order = 50  WHERE code = 'TRAIL-07'; -- descente technique
UPDATE public.session_library SET sort_order = 60  WHERE code = 'TRAIL-06'; -- marche rapide D+
UPDATE public.session_library SET sort_order = 70  WHERE code = 'TRAIL-01'; -- endurance 1h
UPDATE public.session_library SET sort_order = 80  WHERE code = 'TRAIL-02'; -- endurance 1h30
UPDATE public.session_library SET sort_order = 90  WHERE code = 'TRAIL-03'; -- endurance 2h
UPDATE public.session_library SET sort_order = 100 WHERE code = 'TRAIL-08'; -- simulation 2h30
UPDATE public.session_library SET sort_order = 110 WHERE code = 'TRAIL-10'; -- nuit 1h30
UPDATE public.session_library SET sort_order = 120 WHERE code = 'TRAIL-09'; -- ultra 3h+
