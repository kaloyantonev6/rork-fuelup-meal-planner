-- App's DietType includes 'halal'; the old CHECK rejected the whole profile row for halal users.
alter table public.profiles drop constraint if exists profiles_diet_type_check;
alter table public.profiles add constraint profiles_diet_type_check check (diet_type = any (array[
  'omnivore','vegetarian','vegan','keto','paleo','pescatarian','mediterranean','low_carb','gluten_free',
  'dash','carnivore','anti_inflammatory','diabetic','muscle_gain','bulking','balanced','halal']));

-- lib/database.ts saveMealPlan() upserts with on_conflict=user_id,date — needs a matching unique constraint.
-- NULL dates stay distinct, so saved (undated) plans are unaffected.
alter table public.meal_plans add constraint meal_plans_user_id_date_key unique (user_id, date);
