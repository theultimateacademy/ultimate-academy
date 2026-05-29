-- ============================================================
-- THE ULTIMATE ACADEMY — Triathlon & Trail Migration
-- Run this in the Supabase SQL editor
-- ============================================================

-- ── Profiles: new columns ────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tri_swim_sessions    INTEGER,
  ADD COLUMN IF NOT EXISTS tri_bike_sessions    INTEGER,
  ADD COLUMN IF NOT EXISTS tri_run_sessions     INTEGER,
  ADD COLUMN IF NOT EXISTS tri_swim_level       TEXT,
  ADD COLUMN IF NOT EXISTS css_known            BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS css_value            TEXT,
  ADD COLUMN IF NOT EXISTS ftp_known            BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ftp_value            INTEGER,
  ADD COLUMN IF NOT EXISTS open_water           TEXT,
  ADD COLUMN IF NOT EXISTS bike_type            TEXT,
  ADD COLUMN IF NOT EXISTS tri_experience       TEXT,
  ADD COLUMN IF NOT EXISTS trail_experience     TEXT,
  ADD COLUMN IF NOT EXISTS trail_poles          TEXT,
  ADD COLUMN IF NOT EXISTS trail_terrain_dispo  TEXT[];

-- ── session_library: new columns ─────────────────────────────
ALTER TABLE public.session_library
  ADD COLUMN IF NOT EXISTS sport                TEXT DEFAULT 'running',
  ADD COLUMN IF NOT EXISTS montagne_only        BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS triathlon_disciplines TEXT[];

-- ── Update existing running sessions ─────────────────────────
UPDATE public.session_library SET sport = 'running' WHERE sport IS NULL;
