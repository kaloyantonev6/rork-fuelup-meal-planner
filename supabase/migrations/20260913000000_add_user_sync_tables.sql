-- User-scoped sync tables for the Expo app: weekly schedule, daily meal
-- tracking, hydration log and a generic key/value store for per-user app
-- state (saved plans, budget, settings, premium flags, ...). Everything is
-- RLS-scoped so a user can only ever touch their own rows.

-- ── weekly_schedules ────────────────────────────────────────────────
create table if not exists public.weekly_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  monday text not null default 'training',
  tuesday text not null default 'training',
  wednesday text not null default 'rest',
  thursday text not null default 'training',
  friday text not null default 'training',
  saturday text not null default 'match',
  sunday text not null default 'recovery',
  updated_at timestamptz not null default now(),
  unique (user_id)
);

-- ── meal_plans: day-scoped plans (items stored as jsonb because the
--    app's recipe catalog lives client-side) ─────────────────────────
alter table public.meal_plans
  add column if not exists date date,
  add column if not exists day_type text,
  add column if not exists items jsonb;

-- One row per user per day
create unique index if not exists meal_plans_user_date_idx
  on public.meal_plans (user_id, date)
  where date is not null;

-- ── meal_plan_items: per-item check-off state ───────────────────────
alter table public.meal_plan_items
  add column if not exists completed boolean not null default false,
  add column if not exists completed_at timestamptz;

-- ── daily_tracking: per-day consumption + full tracking snapshot ────
create table if not exists public.daily_tracking (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  calories_consumed numeric not null default 0,
  protein_consumed numeric not null default 0,
  carbs_consumed numeric not null default 0,
  fats_consumed numeric not null default 0,
  data jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

-- ── hydration_logs: one row per logged drink ─────────────────────────
create table if not exists public.hydration_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  amount_ml integer not null,
  created_at timestamptz not null default now()
);

create index if not exists hydration_logs_user_date_idx
  on public.hydration_logs (user_id, date);

-- ── app_data: per-user key/value store (jsonb) ───────────────────────
create table if not exists public.app_data (
  user_id uuid not null references public.profiles(id) on delete cascade,
  key text not null,
  value jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

-- ── Row Level Security ───────────────────────────────────────────────
-- Every table above is user-owned: auth.uid() = user_id for all ops.
do $$
declare
  t text;
  tables text[] := array['weekly_schedules', 'daily_tracking', 'hydration_logs', 'app_data'];
begin
  foreach t in array tables loop
    execute format('alter table public.%I enable row level security', t);

    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = 'own_rows_select') then
      execute format('create policy own_rows_select on public.%I for select using (auth.uid() = user_id)', t);
    end if;
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = 'own_rows_insert') then
      execute format('create policy own_rows_insert on public.%I for insert with check (auth.uid() = user_id)', t);
    end if;
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = 'own_rows_update') then
      execute format('create policy own_rows_update on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
    end if;
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = 'own_rows_delete') then
      execute format('create policy own_rows_delete on public.%I for delete using (auth.uid() = user_id)', t);
    end if;
  end loop;
end $$;

-- ── recipes: public read, admin-only writes ──────────────────────────
-- Verify in the Supabase dashboard that recipes already has:
--   select: true (public read)
--   insert/update/delete: restricted to an admin role/service role.
-- No changes are made here to avoid clobbering existing policies.

-- Profiles should also be RLS-scoped (verify in dashboard):
--   select/update using (auth.uid() = id), insert with check (auth.uid() = id)
