
-- Recipes catalog (114+ meals)
CREATE TABLE public.recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('breakfast','lunch','dinner','snack')),
  diet_tags TEXT[] NOT NULL DEFAULT '{}',
  cuisine_type TEXT,
  calories INTEGER NOT NULL,
  protein_g DECIMAL(6,1) NOT NULL,
  carbs_g DECIMAL(6,1) NOT NULL,
  fats_g DECIMAL(6,1) NOT NULL,
  ingredients JSONB NOT NULL DEFAULT '[]',
  instructions TEXT NOT NULL DEFAULT '',
  tutorial_steps JSONB,
  prep_time_min SMALLINT,
  cook_time_min SMALLINT,
  cost_estimate TEXT CHECK (cost_estimate IN ('low','medium','high')),
  skill_level TEXT CHECK (skill_level IN ('beginner','intermediate','advanced')),
  equipment_needed TEXT[] DEFAULT '{}',
  image_url TEXT,
  is_community BOOLEAN DEFAULT false,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_name TEXT,
  likes_count INTEGER DEFAULT 0,
  avg_rating DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_recipes_diet_tags ON public.recipes USING GIN (diet_tags);
CREATE INDEX idx_recipes_category ON public.recipes (category);
CREATE INDEX idx_recipes_is_community ON public.recipes (is_community);

-- Meal plan folders
CREATE TABLE public.meal_plan_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT 'emerald',
  icon TEXT DEFAULT '📁',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Meal plans
CREATE TABLE public.meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  duration_days SMALLINT NOT NULL CHECK (duration_days IN (1,7)),
  profile_snapshot JSONB NOT NULL DEFAULT '{}',
  target_calories INTEGER,
  target_protein_g INTEGER,
  target_carbs_g INTEGER,
  target_fats_g INTEGER,
  weekly_budget DECIMAL(8,2),
  is_saved BOOLEAN DEFAULT false,
  folder_id UUID REFERENCES public.meal_plan_folders(id) ON DELETE SET NULL,
  generation_model TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Meal plan items (individual meals)
CREATE TABLE public.meal_plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id UUID NOT NULL REFERENCES public.meal_plans(id) ON DELETE CASCADE,
  day_number SMALLINT NOT NULL CHECK (day_number >= 1 AND day_number <= 7),
  meal_slot TEXT NOT NULL CHECK (meal_slot IN ('breakfast','lunch','dinner')),
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE SET NULL,
  meal_name TEXT NOT NULL,
  calories INTEGER NOT NULL,
  protein_g DECIMAL(6,1),
  carbs_g DECIMAL(6,1),
  fats_g DECIMAL(6,1),
  ingredients JSONB NOT NULL DEFAULT '[]',
  instructions TEXT,
  tutorial_steps JSONB,
  image_url TEXT,
  prep_time_min SMALLINT,
  cost_estimate_eur DECIMAL(6,2),
  UNIQUE (meal_plan_id, day_number, meal_slot)
);

-- Enable RLS
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plan_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plan_items ENABLE ROW LEVEL SECURITY;

-- Recipes RLS (public read, auth write for community)
CREATE POLICY "anyone_can_read_recipes" ON public.recipes FOR SELECT USING (true);
CREATE POLICY "users_create_community_recipes" ON public.recipes FOR INSERT WITH CHECK (auth.uid() = author_id AND is_community = true);
CREATE POLICY "users_update_own_recipes" ON public.recipes FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "users_delete_own_recipes" ON public.recipes FOR DELETE USING (auth.uid() = author_id);

-- Folders RLS
CREATE POLICY "users_crud_own_folders" ON public.meal_plan_folders FOR ALL USING (auth.uid() = user_id);

-- Meal plans RLS
CREATE POLICY "users_crud_own_plans" ON public.meal_plans FOR ALL USING (auth.uid() = user_id);

-- Meal plan items RLS (via parent plan)
CREATE POLICY "users_crud_own_plan_items" ON public.meal_plan_items FOR ALL
  USING (EXISTS (SELECT 1 FROM public.meal_plans WHERE id = meal_plan_items.meal_plan_id AND user_id = auth.uid()));
