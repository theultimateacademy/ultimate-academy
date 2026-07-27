-- ============================================================
-- Weekly Bilans table — The Ultimate Academy
-- Run this in the Supabase SQL editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.weekly_bilans (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL,
  plan_id             uuid NOT NULL,
  week_number         integer NOT NULL,
  submitted_at        timestamptz DEFAULT now(),
  overall_rating      integer,
  fatigue_level       integer,
  motivation_level    integer,
  sleep_quality       integer,
  pain_areas          text,
  what_went_well      text,
  what_was_hard       text,
  wishes_next_week    text,
  coach_message       text,
  coach_response      text,
  coach_responded_at  timestamptz,
  UNIQUE (user_id, plan_id, week_number)
);

-- Enable Row Level Security
ALTER TABLE public.weekly_bilans ENABLE ROW LEVEL SECURITY;

-- Athletes can insert and read their own bilans
CREATE POLICY "Athletes can insert own bilans"
  ON public.weekly_bilans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Athletes can read own bilans"
  ON public.weekly_bilans FOR SELECT
  USING (auth.uid() = user_id);

-- Coach (service key) bypasses RLS
