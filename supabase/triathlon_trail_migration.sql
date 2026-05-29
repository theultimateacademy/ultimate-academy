-- ============================================================
-- THE ULTIMATE ACADEMY — Triathlon & Trail Migration
-- Chaque ALTER est séparé pour éviter les erreurs en cascade
-- ============================================================

-- ── Profiles: colonnes triathlon ─────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tri_swim_sessions INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tri_bike_sessions INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tri_run_sessions INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tri_swim_level TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS css_known BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS css_value TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ftp_known BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ftp_value INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS open_water TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bike_type TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tri_experience TEXT;

-- ── Profiles: colonnes trail ──────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trail_experience TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trail_poles TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trail_terrain_dispo TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS race_denivele INTEGER;

-- ── Profiles: colonnes chronos triathlon ─────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS chrono_natation TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS chrono_velo TEXT;

-- ── session_library: nouvelles colonnes ──────────────────────
ALTER TABLE public.session_library ADD COLUMN IF NOT EXISTS sport TEXT DEFAULT 'running';
ALTER TABLE public.session_library ADD COLUMN IF NOT EXISTS montagne_only BOOLEAN DEFAULT FALSE;
ALTER TABLE public.session_library ADD COLUMN IF NOT EXISTS triathlon_disciplines TEXT[];

-- ── Mettre à jour les séances existantes ─────────────────────
UPDATE public.session_library SET sport = 'running' WHERE sport IS NULL;
