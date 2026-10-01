-- These user_id FKs had no ON DELETE action, so deleting an account (auth.users ->
-- profiles cascade) failed once the user had any tracking rows. Every other
-- user-owned table already cascades; align these (needed for GDPR erasure).
alter table public.daily_tracking drop constraint daily_tracking_user_id_fkey,
  add constraint daily_tracking_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade;
alter table public.hydration_logs drop constraint hydration_logs_user_id_fkey,
  add constraint hydration_logs_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade;
alter table public.meal_plan_items drop constraint meal_plan_items_user_id_fkey,
  add constraint meal_plan_items_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade;
