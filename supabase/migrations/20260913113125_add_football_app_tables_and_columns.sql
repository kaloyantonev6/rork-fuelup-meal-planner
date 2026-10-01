
-- 1. Add missing columns to meal_plans
ALTER TABLE meal_plans
ADD COLUMN IF NOT EXISTS date date,
ADD COLUMN IF NOT EXISTS day_type text;

-- Add check constraint for day_type
ALTER TABLE meal_plans
ADD CONSTRAINT meal_plans_day_type_check
CHECK (day_type IS NULL OR day_type = ANY (ARRAY['training'::text, 'match'::text, 'rest'::text, 'recovery'::text]));

-- 2. Add missing columns to meal_plan_items
ALTER TABLE meal_plan_items
ADD COLUMN IF NOT EXISTS completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS completed_at timestamptz,
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES profiles(id);

-- Drop old meal_slot check and add new one that includes 'snack'
ALTER TABLE meal_plan_items
DROP CONSTRAINT IF EXISTS meal_plan_items_meal_slot_check;

ALTER TABLE meal_plan_items
ADD CONSTRAINT meal_plan_items_meal_slot_check
CHECK (meal_slot = ANY (ARRAY['breakfast'::text, 'lunch'::text, 'dinner'::text, 'snack'::text]));

-- 3. Create daily_tracking table
CREATE TABLE IF NOT EXISTS daily_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id),
  date date NOT NULL,
  calories_consumed integer DEFAULT 0,
  protein_consumed numeric DEFAULT 0,
  carbs_consumed numeric DEFAULT 0,
  fats_consumed numeric DEFAULT 0,
  fiber_consumed numeric DEFAULT 0,
  meals_completed integer DEFAULT 0,
  meals_total integer DEFAULT 0,
  day_type text,
  calorie_target integer,
  protein_target numeric,
  carbs_target numeric,
  fats_target numeric,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date),
  CHECK (day_type IS NULL OR day_type = ANY (ARRAY['training'::text, 'match'::text, 'rest'::text, 'recovery'::text]))
);

-- 4. Create hydration_logs table
CREATE TABLE IF NOT EXISTS hydration_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id),
  date date NOT NULL,
  amount_ml integer NOT NULL,
  source text DEFAULT 'water',
  created_at timestamptz DEFAULT now(),
  CHECK (source = ANY (ARRAY['water'::text, 'sports_drink'::text, 'other'::text]))
);

-- Create index for fast hydration lookups
CREATE INDEX IF NOT EXISTS idx_hydration_logs_user_date ON hydration_logs(user_id, date);

-- Create index for fast daily_tracking lookups
CREATE INDEX IF NOT EXISTS idx_daily_tracking_user_date ON daily_tracking(user_id, date);

-- Create index for meal_plans date lookup
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_date ON meal_plans(user_id, date);

-- 5. Enable RLS on new tables
ALTER TABLE daily_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE hydration_logs ENABLE ROW LEVEL SECURITY;

-- 6. RLS policies for daily_tracking
CREATE POLICY "Users can view own daily tracking"
  ON daily_tracking FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily tracking"
  ON daily_tracking FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily tracking"
  ON daily_tracking FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily tracking"
  ON daily_tracking FOR DELETE
  USING (auth.uid() = user_id);

-- 7. RLS policies for hydration_logs
CREATE POLICY "Users can view own hydration logs"
  ON hydration_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own hydration logs"
  ON hydration_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own hydration logs"
  ON hydration_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own hydration logs"
  ON hydration_logs FOR DELETE
  USING (auth.uid() = user_id);
