-- daily_tracking exists in the live DB but is missing columns the client
-- upserts (lib/database.ts upsertDailyTracking). Additive-only, idempotent.
alter table public.daily_tracking
  add column if not exists data jsonb,
  add column if not exists updated_at timestamptz not null default now();

-- Ensure the one-row-per-user-per-day unique constraint exists for the
-- onConflict("user_id,date") upsert target.
create unique index if not exists daily_tracking_user_date_key
  on public.daily_tracking (user_id, date);
