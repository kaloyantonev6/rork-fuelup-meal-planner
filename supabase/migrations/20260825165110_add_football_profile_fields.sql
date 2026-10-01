-- Add football-specific profile fields so the AI/cloud layer can see
-- what the Rork frontend already models locally (position, schedule,
-- season phase, performance goal), plus a persisted parental-consent
-- status so it can actually be enforced server-side, not just recorded
-- on-device and ignored.

ALTER TABLE public.profiles
  ADD COLUMN position text
    CHECK (position = ANY (ARRAY[
      'goalkeeper','centre_back','full_back','defensive_mid',
      'central_mid','attacking_mid','winger','striker'
    ])),
  ADD COLUMN player_level text
    CHECK (player_level = ANY (ARRAY[
      'recreational','amateur','academy','professional'
    ])),
  ADD COLUMN training_frequency text
    CHECK (training_frequency = ANY (ARRAY['1-2','3-4','5-6','daily'])),
  ADD COLUMN season_phase text
    CHECK (season_phase = ANY (ARRAY[
      'pre_season','in_season','off_season','injury_recovery'
    ])),
  ADD COLUMN performance_goal text
    CHECK (performance_goal = ANY (ARRAY[
      'lean_fast','endurance','muscle_power','injury_recovery','general'
    ])),
  -- 7 entries, Mon-Sun, each one of DayType: training/match/rest/recovery
  ADD COLUMN weekly_schedule jsonb DEFAULT '[]'::jsonb
    CHECK (
      weekly_schedule = '[]'::jsonb
      OR jsonb_array_length(weekly_schedule) = 7
    ),
  ADD COLUMN default_kickoff_time time,
  ADD COLUMN default_training_time time,
  ADD COLUMN parental_consent_status text DEFAULT 'not_required'
    CHECK (parental_consent_status = ANY (ARRAY[
      'granted','pending','not_required'
    ]));

COMMENT ON COLUMN public.profiles.parental_consent_status IS
  'Set to pending at signup when age < 16. Must be checked server-side '
  'before generating plans or accepting health-data writes for that user '
  '-- see generate-meal-plan edge function.';
