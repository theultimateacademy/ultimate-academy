-- ============================================================
-- THE ULTIMATE ACADEMY — Supabase Schema
-- Run this in the Supabase SQL editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Profiles ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id                   UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name           TEXT,
  last_name            TEXT,
  email                TEXT,
  role                 TEXT DEFAULT 'athlete',   -- 'athlete' | 'coach'
  -- Wizard fields
  objective            TEXT,   -- '5km' | '10km' | 'semi' | 'marathon'
  race_date            DATE,
  level                TEXT,   -- 'debutant' | 'intermediaire' | 'confirme' | 'expert'
  vma_known            BOOLEAN DEFAULT FALSE,
  vma                  NUMERIC(5,2),
  chrono_goal_known    BOOLEAN DEFAULT FALSE,
  chrono_goal          TEXT,
  days_per_week        INTEGER DEFAULT 3,
  preferred_days       TEXT[],
  gps_watch            TEXT,
  best_recent_time     TEXT,
  injuries             TEXT,
  current_form         TEXT,
  coach_message        TEXT,
  profile_completed    BOOLEAN DEFAULT FALSE,
  -- Subscription
  stripe_customer_id   TEXT,
  subscription_status  TEXT DEFAULT 'inactive',
  -- Strava
  strava_connected     BOOLEAN DEFAULT FALSE,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ── Training Plans ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.training_plans (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status       TEXT DEFAULT 'pending',   -- 'pending' | 'active' | 'completed'
  plan_data    JSONB,
  coach_notes  TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Messages ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender     TEXT NOT NULL,   -- 'athlete' | 'coach'
  content    TEXT NOT NULL,
  read       BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Session Completions ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.session_completions (
  id                 UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id            UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id            UUID REFERENCES public.training_plans(id) ON DELETE CASCADE,
  week_number        INTEGER NOT NULL,
  session_index      INTEGER NOT NULL,
  completed_at       TIMESTAMPTZ DEFAULT NOW(),
  rpe                INTEGER,
  comment            TEXT,
  avg_hr             INTEGER,
  strava_activity_id BIGINT,
  UNIQUE(plan_id, week_number, session_index)
);

-- ── Strava Connections ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.strava_connections (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id       UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  access_token  TEXT,
  refresh_token TEXT,
  expires_at    BIGINT,
  athlete_id    BIGINT,
  athlete_name  TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Strava Activities ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.strava_activities (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id          UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  strava_id        BIGINT UNIQUE NOT NULL,
  name             TEXT,
  distance         NUMERIC,
  moving_time      INTEGER,
  elapsed_time     INTEGER,
  average_heartrate NUMERIC,
  max_heartrate    NUMERIC,
  average_speed    NUMERIC,
  start_date       TIMESTAMPTZ,
  type             TEXT,
  raw_data         JSONB,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── Weekly Analyses ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.weekly_analyses (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id       UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_number   INTEGER,
  plan_id       UUID REFERENCES public.training_plans(id),
  analysis_data JSONB,
  coach_message TEXT,
  status        TEXT DEFAULT 'pending',   -- 'pending' | 'sent'
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  sent_at       TIMESTAMPTZ
);

-- ── Row Level Security ───────────────────────────────────────
ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_plans     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strava_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strava_activities  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_analyses    ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Own profile read"    ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Own profile update"  ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Coach read all"      ON public.profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'coach')
);

-- Training plans
CREATE POLICY "Own plans read"      ON public.training_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Coach plans all"     ON public.training_plans FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'coach')
);

-- Messages
CREATE POLICY "Own messages read"   ON public.messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Athlete insert msg"  ON public.messages FOR INSERT WITH CHECK (auth.uid() = user_id AND sender = 'athlete');
CREATE POLICY "Coach messages all"  ON public.messages FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'coach')
);

-- Session completions
CREATE POLICY "Own completions all" ON public.session_completions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Coach completions read" ON public.session_completions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'coach')
);

-- Strava
CREATE POLICY "Own strava all"      ON public.strava_connections FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own activities all"  ON public.strava_activities  FOR ALL USING (auth.uid() = user_id);

-- Weekly analyses
CREATE POLICY "Own analyses read"   ON public.weekly_analyses FOR SELECT
  USING (auth.uid() = user_id AND status = 'sent');
CREATE POLICY "Coach analyses all"  ON public.weekly_analyses FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'coach')
);

-- ── Auto-create profile on signup ────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Set coach role (replace with real coach email) ───────────
-- UPDATE public.profiles SET role = 'coach' WHERE email = 'coach@example.com';
