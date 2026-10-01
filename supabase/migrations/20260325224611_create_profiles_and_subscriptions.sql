
-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  age SMALLINT CHECK (age >= 13 AND age <= 120),
  gender TEXT CHECK (gender IN ('male','female','other')),
  weight_kg DECIMAL(5,2),
  height_cm DECIMAL(5,1),
  activity_level TEXT CHECK (activity_level IN ('sedentary','light','moderate','active','athlete')) DEFAULT 'moderate',
  diet_type TEXT CHECK (diet_type IN ('omnivore','vegetarian','vegan','keto','paleo','pescatarian','mediterranean','low_carb','gluten_free','dash','carnivore','anti_inflammatory','diabetic','muscle_gain','bulking','balanced')) DEFAULT 'omnivore',
  allergies TEXT[] DEFAULT '{}',
  intolerances TEXT[] DEFAULT '{}',
  kitchen_equipment TEXT[] DEFAULT '{}',
  cooking_skill TEXT CHECK (cooking_skill IN ('beginner','intermediate','advanced')) DEFAULT 'intermediate',
  budget_preference TEXT CHECK (budget_preference IN ('low','medium','high')) DEFAULT 'medium',
  country_code CHAR(2),
  region TEXT,
  disliked_ingredients TEXT[] DEFAULT '{}',
  fitness_goal TEXT CHECK (fitness_goal IN ('weight_loss','muscle_gain','maintain','endurance')) DEFAULT 'maintain',
  target_weight_kg DECIMAL(5,2),
  dark_mode BOOLEAN DEFAULT false,
  auto_regenerate BOOLEAN DEFAULT false,
  bmr_cached INTEGER,
  tdee_cached INTEGER,
  onboarding_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  plan TEXT NOT NULL CHECK (plan IN ('free','premium')) DEFAULT 'free',
  status TEXT NOT NULL CHECK (status IN ('trialing','active','past_due','cancelled','expired')) DEFAULT 'active',
  billing_interval TEXT CHECK (billing_interval IN ('month','year')),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Profiles RLS
CREATE POLICY "users_read_own_profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own_profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Subscriptions RLS
CREATE POLICY "users_read_own_subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Auto-create profile + subscription on new user signup
CREATE OR REPLACE FUNCTION public.fn_handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);

  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.fn_handle_new_user();

-- BMR/TDEE calculator function
CREATE OR REPLACE FUNCTION public.fn_calculate_bmr(
  p_age SMALLINT,
  p_gender TEXT,
  p_weight_kg DECIMAL,
  p_height_cm DECIMAL
) RETURNS INTEGER AS $$
BEGIN
  IF p_gender = 'male' THEN
    RETURN ROUND(10 * p_weight_kg + 6.25 * p_height_cm - 5 * p_age + 5);
  ELSE
    RETURN ROUND(10 * p_weight_kg + 6.25 * p_height_cm - 5 * p_age - 161);
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Auto-update BMR/TDEE on profile change
CREATE OR REPLACE FUNCTION public.fn_update_profile_calculations()
RETURNS TRIGGER AS $$
DECLARE
  activity_multiplier DECIMAL;
BEGIN
  NEW.updated_at := now();

  IF NEW.age IS NOT NULL AND NEW.gender IS NOT NULL AND NEW.weight_kg IS NOT NULL AND NEW.height_cm IS NOT NULL THEN
    NEW.bmr_cached := public.fn_calculate_bmr(NEW.age, NEW.gender, NEW.weight_kg, NEW.height_cm);

    activity_multiplier := CASE NEW.activity_level
      WHEN 'sedentary' THEN 1.2
      WHEN 'light' THEN 1.375
      WHEN 'moderate' THEN 1.55
      WHEN 'active' THEN 1.725
      WHEN 'athlete' THEN 1.9
      ELSE 1.55
    END;

    NEW.tdee_cached := ROUND(NEW.bmr_cached * activity_multiplier);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.fn_update_profile_calculations();

-- Premium check function
CREATE OR REPLACE FUNCTION public.fn_is_premium(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = p_user_id
      AND plan = 'premium'
      AND status IN ('active', 'trialing')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
