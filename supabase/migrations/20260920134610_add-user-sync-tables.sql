-- User-scoped sync tables missing from the live database: weekly schedule
-- and the generic per-user key/value store. Everything is RLS-scoped with
-- auth.uid() (native Supabase Auth model).

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

-- ── meal_plans: additive day-scoped columns (date/day_type already exist) ──
alter table public.meal_plans
  add column if not exists date date,
  add column if not exists day_type text,
  add column if not exists items jsonb;

create unique index if not exists meal_plans_user_date_idx
  on public.meal_plans (user_id, date)
  where date is not null;

-- ── meal_plan_items: per-item check-off state (already exist — no-ops) ──
alter table public.meal_plan_items
  add column if not exists completed boolean not null default false,
  add column if not exists completed_at timestamptz;

-- ── app_data: per-user key/value store (jsonb) ───────────────────────
create table if not exists public.app_data (
  user_id uuid not null references public.profiles(id) on delete cascade,
  key text not null,
  value jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

-- ── Row Level Security ───────────────────────────────────────────────
do $$
declare
  t text;
  tables text[] := array['weekly_schedules', 'app_data'];
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
