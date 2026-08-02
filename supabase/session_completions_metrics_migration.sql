-- Ajoute la saisie de distance/durée réelles à chaque séance effectuée,
-- et un champ 'sport' dénormalisé pour agréger le volume par discipline
-- sans avoir à retraverser plan_data à chaque requête.

ALTER TABLE public.session_completions
  ADD COLUMN IF NOT EXISTS distance_km      NUMERIC,   -- distance totale, ou km course pour une brique
  ADD COLUMN IF NOT EXISTS distance_km_bike NUMERIC,   -- km vélo (brique uniquement)
  ADD COLUMN IF NOT EXISTS duree_reelle_min INTEGER,   -- durée totale, ou durée course pour une brique
  ADD COLUMN IF NOT EXISTS duree_bike_min   INTEGER,   -- durée vélo (brique uniquement)
  ADD COLUMN IF NOT EXISTS sport            TEXT;      -- 'course' | 'natation' | 'velo' | 'brique' | 'renforcement'
