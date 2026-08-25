import { mealCatalog, Meal } from "@/data/mealCatalog";

export interface CatalogMeal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  ingredientQuantities: string[];
  instructions: string[];
  nutritionTip: string;
  prepTime: number;
  diets: string[];
  allergens: string[];
  equipment: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  budget: "budget" | "moderate" | "premium";
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  image: string;
  noCook: boolean;
  performanceTags?: string[];
}

const MEAT_KEYWORDS = ['beef', 'chicken', 'turkey', 'pork', 'lamb', 'bacon', 'steak', 'liver', 'mince', 'chuck'];
const FISH_KEYWORDS = ['salmon', 'tuna', 'cod', 'sardine', 'mackerel', 'fish', 'shrimp', 'prawns'];
const DAIRY_KEYWORDS = ['milk', 'yogurt', 'cheese', 'butter', 'cream', 'feta', 'halloumi', 'skyr', 'cottage', 'parmesan', 'mozzarella', 'ghee', 'whey', 'raita'];
const EGG_KEYWORDS = ['egg', 'eggs', 'egg whites'];
const NUT_KEYWORDS = ['almond', 'walnut', 'peanut', 'cashew', 'pistachio', 'pecan', 'hazelnut'];
const GLUTEN_KEYWORDS = ['oat', 'oats', 'oatmeal', 'bread', 'toast', 'pasta', 'flour', 'wrap', 'spaghetti', 'noodle', 'couscous', 'crackers'];
const SOY_KEYWORDS = ['soy', 'tamari', 'tofu', 'tempeh', 'edamame'];

function ingredientNamesLower(meal: Meal): string[] {
  return meal.ingredients.map(i => i.name.toLowerCase());
}

function detectAllergens(meal: Meal): string[] {
  const allergens = new Set<string>();
  const names = ingredientNamesLower(meal);

  for (const name of names) {
    if (DAIRY_KEYWORDS.some(d => name.includes(d))) allergens.add('dairy');
    if (EGG_KEYWORDS.some(e => name === e || name === 'egg whites' || name === 'eggs')) allergens.add('eggs');
    if (NUT_KEYWORDS.some(n => name.includes(n))) allergens.add('nuts');
    if (GLUTEN_KEYWORDS.some(g => name.includes(g))) allergens.add('gluten');
    if (SOY_KEYWORDS.some(s => name.includes(s))) allergens.add('soy');
  }

  return Array.from(allergens);
}

function convertDietTags(meal: Meal): string[] {
  const diets = new Set<string>();
  const names = ingredientNamesLower(meal);
  const tags = meal.dietTags;

  const hasMeat = names.some(n => MEAT_KEYWORDS.some(m => n.includes(m)));
  const hasFish = names.some(n => FISH_KEYWORDS.some(f => n.includes(f)));
  const hasDairy = names.some(n => DAIRY_KEYWORDS.some(d => n.includes(d)));
  const hasEggs = names.some(n => EGG_KEYWORDS.some(e => n === e || n === 'egg whites' || n === 'eggs'));

  diets.add('omnivore');

  if (!hasMeat && !hasFish) {
    diets.add('vegetarian');
    diets.add('pescatarian');
    if (!hasDairy && !hasEggs) {
      diets.add('vegan');
    }
  } else if (!hasMeat && hasFish) {
    diets.add('pescatarian');
  }

  for (const tag of tags) {
    if (['vegan', 'vegetarian', 'pescatarian', 'mediterranean', 'halal', 'gluten_free', 'balanced'].includes(tag)) {
      diets.add(tag);
      if (tag === 'vegan') {
        diets.add('vegetarian');
        diets.add('pescatarian');
      }
      if (tag === 'vegetarian') {
        diets.add('pescatarian');
      }
    }
  }

  return Array.from(diets);
}

function costTobudget(cost: 'low' | 'medium' | 'high'): 'budget' | 'moderate' | 'premium' {
  switch (cost) {
    case 'low': return 'budget';
    case 'medium': return 'moderate';
    case 'high': return 'premium';
  }
}

function estimatePrepTime(meal: Meal): number {
  if (meal.prepTime !== undefined) return meal.prepTime;

  const instructionSteps = meal.instructions.split('.').filter(s => s.trim().length > 0).length;
  if (meal.equipment.length === 0) {
    if (instructionSteps <= 3) return 5;
    if (instructionSteps <= 5) return 8;
    return 10;
  }
  if (instructionSteps <= 3) return 10;
  if (instructionSteps <= 5) return 20;
  if (instructionSteps <= 8) return 30;
  return 45;
}

function detectNoCook(meal: Meal): boolean {
  if (meal.noCook !== undefined) return meal.noCook;
  if (meal.equipment.length === 0) return true;
  const noCookTags = ['wrap', 'salad', 'yogurt', 'smoothie', 'parfait', 'oats', 'no-cook', 'trail mix', 'jerky', 'dates'];
  const titleLower = meal.title.toLowerCase();
  return noCookTags.some(tag => titleLower.includes(tag));
}

function formatQuantity(ing: { name: string; quantity: number; unit: string }): string {
  const qty = ing.unit === 'pcs' && ing.quantity === 1
    ? '1'
    : ing.unit === 'pcs' && ing.quantity < 1
      ? `${ing.quantity}`
      : `${ing.quantity}${ing.unit}`;
  return `${qty} ${ing.name}`;
}

function generateNutritionTip(meal: Meal): string {
  const names = ingredientNamesLower(meal);
  if (names.some(n => n.includes('salmon'))) return 'Omega-3s reduce inflammation and speed recovery between matches.';
  if (names.some(n => n.includes('turmeric'))) return 'Curcumin in turmeric reduces muscle soreness after intense training.';
  if (names.some(n => n.includes('lentil'))) return 'Lentils provide slow-release carbs and plant protein for sustained energy.';
  if (names.some(n => n.includes('oat'))) return 'Oats give sustained energy for training — top up glycogen without spikes.';
  if (names.some(n => n.includes('yogurt') || n.includes('skyr'))) return 'High-quality protein for muscle repair, plus probiotics for gut health.';
  if (names.some(n => n.includes('chicken'))) return 'Lean protein for muscle repair — ideal post-training fuel.';
  if (names.some(n => n.includes('tofu') || n.includes('tempeh'))) return 'Complete plant protein — great for recovery on plant-based diets.';
  if (names.some(n => n.includes('egg'))) return 'Eggs are one of the most bioavailable protein sources for recovery.';
  if (names.some(n => n.includes('quinoa'))) return 'Quinoa is a complete protein with carbs for glycogen replenishment.';
  if (names.some(n => n.includes('avocado'))) return 'Healthy fats and potassium support muscle function and hydration.';
  if (names.some(n => n.includes('berries') || n.includes('blueberries'))) return 'Antioxidants in berries reduce muscle soreness and speed recovery.';
  if (names.some(n => n.includes('steak') || n.includes('beef'))) return 'Iron, zinc, and B12 from red meat support oxygen transport and energy.';
  if (names.some(n => n.includes('pasta') || n.includes('rice'))) return 'Carb-rich fuel to top up glycogen stores before training or matches.';
  if (names.some(n => n.includes('banana'))) return 'Quick-digesting carbs for pre-match energy or post-session recovery.';
  return `Fuel for performance: ${meal.protein}g protein, ${meal.carbs}g carbs, ${meal.fats}g fat.`;
}

const MEAL_IMAGES: Record<string, string> = {
  'b1': 'https://images.unsplash.com/photo-1608039829572-25e8182a7290?w=600&q=80',
  'b2': 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=600&q=80',
  'b3': 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=600&q=80',
  'b4': 'https://images.unsplash.com/photo-1535473895227-bdecb20fb157?w=600&q=80',
  'b5': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80',
  'b6': 'https://images.unsplash.com/photo-1510693206972-df098062cb71?w=600&q=80',
  'b7': 'https://images.unsplash.com/photo-1495214783159-3503fd1b572d?w=600&q=80',
  'b8': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&q=80',
  'b9': 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&q=80',
  'b10': 'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=600&q=80',
  'b11': 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=600&q=80',
  'b12': 'https://images.unsplash.com/photo-1634564375206-5a0b42649a09?w=600&q=80',
  'b13': 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=600&q=80',
  'b14': 'https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?w=600&q=80',
  'b15': 'https://images.unsplash.com/photo-1494597564530-871f2b93ac55?w=600&q=80',
  'b16': 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80',
  'b17': 'https://images.unsplash.com/photo-1511690743698-d9d18f7e20f1?w=600&q=80',
  'b18': 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&q=80',
  'b19': 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=600&q=80',
  'b20': 'https://images.unsplash.com/photo-1638176066666-ffb2f013c7dd?w=600&q=80',
  'b21': 'https://images.unsplash.com/photo-1612240498936-65f5101365d2?w=600&q=80',
  'b22': 'https://images.unsplash.com/photo-1640352100426-4e5e56fd9ec5?w=600&q=80',
  'b23': 'https://images.unsplash.com/photo-1584949514811-a5c1ae8bd06e?w=600&q=80',
  'b24': 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=600&q=80',
  'l1': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80',
  'l2': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80',
  'l3': 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600&q=80',
  'l4': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
  'l5': 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=600&q=80',
  'l6': 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&q=80',
  'l7': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80',
  'l8': 'https://images.unsplash.com/photo-1623428186429-e76984bf48ad?w=600&q=80',
  'l9': 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600&q=80',
  'l10': 'https://images.unsplash.com/photo-1604909052743-94e838986d24?w=600&q=80',
  'l11': 'https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=600&q=80',
  'l12': 'https://images.unsplash.com/photo-1529059997568-3d847b1154f0?w=600&q=80',
  'l13': 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=600&q=80',
  'l14': 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&q=80',
  'l15': 'https://images.unsplash.com/photo-1540914124281-342587941389?w=600&q=80',
  'l16': 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&q=80',
  'l17': 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&q=80',
  'l18': 'https://images.unsplash.com/photo-1582169296194-e4d644c48063?w=600&q=80',
  'l19': 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=600&q=80',
  'l20': 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80',
  'l21': 'https://images.unsplash.com/photo-1609525313344-a56b96f1d570?w=600&q=80',
  'l22': 'https://images.unsplash.com/photo-1485921325833-c519f76c4927?w=600&q=80',
  'd1': 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&q=80',
  'd2': 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=600&q=80',
  'd3': 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600&q=80',
  'd4': 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=600&q=80',
  'd5': 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80',
  'd6': 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&q=80',
  'd7': 'https://images.unsplash.com/photo-1609525313344-a56b96f1d570?w=600&q=80',
  'd8': 'https://images.unsplash.com/photo-1648455320791-a667c8aab7e4?w=600&q=80',
  'd9': 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600&q=80',
  'd10': 'https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=600&q=80',
  'd11': 'https://images.unsplash.com/photo-1485921325833-c519f76c4927?w=600&q=80',
  'd12': 'https://images.unsplash.com/photo-1558030006-450675393462?w=600&q=80',
  'd13': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&q=80',
  'd14': 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600&q=80',
  'd15': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&q=80',
  'd16': 'https://images.unsplash.com/photo-1558030006-450675393462?w=600&q=80',
  'd17': 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&q=80',
  'd18': 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&q=80',
  'd19': 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&q=80',
  'd20': 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80',
  'd21': 'https://images.unsplash.com/photo-1543339308-d595c4975053?w=600&q=80',
  'd22': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
  'd23': 'https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?w=600&q=80',
  'd24': 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80',
  'd25': 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=600&q=80',
  's1': 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&q=80',
  's2': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80',
  's3': 'https://images.unsplash.com/photo-1568702846914-96b305d2uj38?w=600&q=80',
  's4': 'https://images.unsplash.com/photo-1587169544748-5ba5506dd498?w=600&q=80',
  's5': 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=600&q=80',
  's6': 'https://images.unsplash.com/photo-1490885578174-acda8905c2c6?w=600&q=80',
  's7': 'https://images.unsplash.com/photo-1540914124281-342587941389?w=600&q=80',
  's8': 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&q=80',
  's9': 'https://images.unsplash.com/photo-1613145997970-db84a7975fbb?w=600&q=80',
  's10': 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&q=80',
  's11': 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&q=80',
  's12': 'https://images.unsplash.com/photo-1564834724105-918b73d1b9e0?w=600&q=80',
  's13': 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=600&q=80',
  's14': 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&q=80',
  's15': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80',
  'nc_1': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80',
  'nc_2': 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&q=80',
  'nc_3': 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=600&q=80',
  'nc_4': 'https://images.unsplash.com/photo-1640352100426-4e5e56fd9ec5?w=600&q=80',
  'nc_5': 'https://images.unsplash.com/photo-1529059997568-3d847b1154f0?w=600&q=80',
  // Football-specific meals
  'fm_1': 'https://images.unsplash.com/photo-1551183053-bf91a1d8bcb7?w=600&q=80',
  'fm_2': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80',
  'fm_3': 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&q=80',
  'fm_4': 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=600&q=80',
  'fm_5': 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=600&q=80',
  'fm_6': 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&q=80',
  'fm_7': 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&q=80',
  'fm_8': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80',
  'fm_9': 'https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?w=600&q=80',
  'fm_10': 'https://images.unsplash.com/photo-1506084868230-bb9d95c25759?w=600&q=80',
};

function convertMealToCatalog(meal: Meal): CatalogMeal {
  return {
    id: meal.id,
    name: meal.title,
    calories: meal.calories,
    protein: meal.protein,
    carbs: meal.carbs,
    fat: meal.fats,
    ingredients: meal.ingredients.map(i => i.name),
    ingredientQuantities: meal.ingredients.map(formatQuantity),
    instructions: meal.instructions.split('. ').filter(s => s.trim().length > 0).map(s => s.endsWith('.') ? s : s + '.'),
    nutritionTip: generateNutritionTip(meal),
    prepTime: estimatePrepTime(meal),
    diets: convertDietTags(meal),
    allergens: detectAllergens(meal),
    equipment: meal.equipment,
    difficulty: meal.skillLevel,
    budget: costTobudget(meal.costEstimate),
    mealType: meal.category,
    image: MEAL_IMAGES[meal.id] ?? 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
    noCook: detectNoCook(meal),
  };
}

/**
 * Detect performance tags for a meal based on macros and ingredients.
 * Football-specific tagging: pre_match, post_match, match_day, training, rest_day, recovery, etc.
 */
function detectPerformanceTags(meal: CatalogMeal): string[] {
  const tags: string[] = [];
  const totalCals = meal.calories || 1;
  const carbCals = meal.carbs * 4;
  const proteinCals = meal.protein * 4;
  const fatCals = meal.fat * 9;
  const carbPct = carbCals / totalCals;
  const proteinPct = proteinCals / totalCals;
  const fatPct = fatCals / totalCals;

  if (carbPct >= 0.55) tags.push('high_carb', 'pre_match', 'match_day');
  if (proteinPct >= 0.35) tags.push('high_protein', 'recovery');
  if (fatPct < 0.2) tags.push('match_day', 'pre_match');

  const antiInflam = ['salmon', 'berries', 'blueberry', 'turmeric', 'spinach', 'kale', 'ginger', 'walnuts', 'almonds', 'chia', 'flaxseed', 'olive oil', 'avocado'];
  const ingredientsLower = meal.ingredients.map(i => i.toLowerCase());
  if (ingredientsLower.some(ing => antiInflam.some(ai => ing.includes(ai)))) {
    tags.push('rest_day', 'recovery');
  }
  if (meal.prepTime <= 10) tags.push('quick_energy');
  if (carbPct >= 0.4 && proteinPct >= 0.2 && fatPct <= 0.3) tags.push('training');
  if (meal.calories >= 500 && meal.prepTime <= 25) tags.push('meal_prep');
  if (meal.calories >= 600) tags.push('pre_season');
  if (tags.length === 0) tags.push('training');

  return Array.from(new Set(tags));
}

/**
 * Get performance tags for a catalog meal (memoized at conversion time).
 */
export function getPerformanceTags(meal: CatalogMeal): string[] {
  if (meal.performanceTags && meal.performanceTags.length > 0) return meal.performanceTags;
  return detectPerformanceTags(meal);
}

export const MEAL_CATALOG: CatalogMeal[] = mealCatalog.map(meal => {
  const converted = convertMealToCatalog(meal);
  converted.performanceTags = detectPerformanceTags(converted);
  return converted;
});
