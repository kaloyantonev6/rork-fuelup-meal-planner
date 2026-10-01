
-- Favorite meals
CREATE TABLE public.favorite_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE,
  meal_plan_item_id UUID REFERENCES public.meal_plan_items(id) ON DELETE CASCADE,
  meal_name TEXT NOT NULL,
  image_url TEXT,
  calories INTEGER,
  macros JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_favorite_unique ON public.favorite_meals (user_id, COALESCE(recipe_id, meal_plan_item_id));

-- Shopping lists
CREATE TABLE public.shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  meal_plan_id UUID NOT NULL REFERENCES public.meal_plans(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Shopping list items
CREATE TABLE public.shopping_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopping_list_id UUID NOT NULL REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
  ingredient_name TEXT NOT NULL,
  quantity DECIMAL(8,2),
  unit TEXT,
  category TEXT,
  is_checked BOOLEAN DEFAULT false,
  estimated_price_eur DECIMAL(8,2),
  actual_price_eur DECIMAL(8,2),
  sort_order SMALLINT
);

-- Grocery retailers (270 EU retailers)
CREATE TABLE public.grocery_retailers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country_code CHAR(2) NOT NULL,
  rank SMALLINT,
  website_url TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_retailers_country ON public.grocery_retailers (country_code);

-- Ingredient prices
CREATE TABLE public.ingredient_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_name TEXT NOT NULL,
  retailer_id UUID NOT NULL REFERENCES public.grocery_retailers(id),
  price_eur DECIMAL(8,2) NOT NULL,
  unit TEXT NOT NULL,
  quantity_per_unit DECIMAL(8,3) DEFAULT 1,
  last_updated TIMESTAMPTZ DEFAULT now(),
  source TEXT
);

CREATE INDEX idx_prices_ingredient_retailer ON public.ingredient_prices (ingredient_name, retailer_id);

-- Budget trackers
CREATE TABLE public.budget_trackers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  meal_plan_id UUID NOT NULL REFERENCES public.meal_plans(id) ON DELETE CASCADE UNIQUE,
  weekly_budget_eur DECIMAL(8,2) NOT NULL,
  spent_eur DECIMAL(8,2) DEFAULT 0,
  remaining_eur DECIMAL(8,2) GENERATED ALWAYS AS (weekly_budget_eur - spent_eur) STORED,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.favorite_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grocery_retailers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredient_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_trackers ENABLE ROW LEVEL SECURITY;

-- Favorites RLS
CREATE POLICY "users_crud_own_favorites" ON public.favorite_meals FOR ALL USING (auth.uid() = user_id);

-- Shopping lists RLS
CREATE POLICY "users_crud_own_lists" ON public.shopping_lists FOR ALL USING (auth.uid() = user_id);

-- Shopping list items RLS
CREATE POLICY "users_crud_own_list_items" ON public.shopping_list_items FOR ALL
  USING (EXISTS (SELECT 1 FROM public.shopping_lists WHERE id = shopping_list_items.shopping_list_id AND user_id = auth.uid()));

-- Retailers: public read
CREATE POLICY "anyone_can_read_retailers" ON public.grocery_retailers FOR SELECT USING (true);

-- Ingredient prices: premium only
CREATE POLICY "premium_users_read_prices" ON public.ingredient_prices FOR SELECT
  USING (public.fn_is_premium(auth.uid()));

-- Budget trackers RLS
CREATE POLICY "users_crud_own_budget" ON public.budget_trackers FOR ALL USING (auth.uid() = user_id);

-- Trigger: update budget when shopping items checked off
CREATE OR REPLACE FUNCTION public.fn_update_budget_spent()
RETURNS TRIGGER AS $$
DECLARE
  v_shopping_list_id UUID;
  v_meal_plan_id UUID;
  v_total_spent DECIMAL(8,2);
BEGIN
  v_shopping_list_id := COALESCE(NEW.shopping_list_id, OLD.shopping_list_id);

  SELECT meal_plan_id INTO v_meal_plan_id
  FROM public.shopping_lists WHERE id = v_shopping_list_id;

  SELECT COALESCE(SUM(actual_price_eur), 0) INTO v_total_spent
  FROM public.shopping_list_items
  WHERE shopping_list_id = v_shopping_list_id AND is_checked = true AND actual_price_eur IS NOT NULL;

  UPDATE public.budget_trackers
  SET spent_eur = v_total_spent, updated_at = now()
  WHERE meal_plan_id = v_meal_plan_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_shopping_item_updated
  AFTER UPDATE ON public.shopping_list_items
  FOR EACH ROW EXECUTE FUNCTION public.fn_update_budget_spent();
