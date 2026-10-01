-- The 2026-08-25 trigger rewrite dropped the free-tier subscriptions row that the
-- original fn_handle_new_user created. Without it, create-checkout-session and
-- stripe-webhook update zero rows for new users and premium never activates.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'display_name',
    new.raw_user_meta_data->>'full_name'
  )
  on conflict (id) do nothing;

  insert into public.subscriptions (user_id, plan, status)
  values (new.id, 'free', 'active')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- Backfill any profile that is missing its subscriptions row.
insert into public.subscriptions (user_id, plan, status)
select p.id, 'free', 'active' from public.profiles p
where not exists (select 1 from public.subscriptions s where s.user_id = p.id)
on conflict (user_id) do nothing;
