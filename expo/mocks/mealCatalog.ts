import { mealCatalog } from "@/data/mealCatalog";
import type { FootballerMeal } from "@/data/mealCatalog";

export interface CatalogMeal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
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

function ingredientNamesLower(meal: FootballerMeal): string[] {
  return meal.ingredients.map(i => i.name.toLowerCase());
}

function detectAllergens(meal: FootballerMeal): string[] {
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

function convertDietTags(meal: FootballerMeal): string[] {
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

const MASS_UNITS = new Set(['g', 'ml', 'kg', 'l']);

function formatQuantity(ing: { name: string; quantity: number; unit: string }): string {
  if (MASS_UNITS.has(ing.unit)) {
    return `${ing.quantity}${ing.unit} ${ing.name}`;
  }
  if (ing.quantity === 1) {
    return `1 ${ing.name}`;
  }
  return `${ing.quantity} ${ing.unit} ${ing.name}`;
}

function budgetFromCost(cost: number): 'budget' | 'moderate' | 'premium' {
  if (cost < 1.5) return 'budget';
  if (cost < 2.75) return 'moderate';
  return 'premium';
}

const CATEGORY_IMAGES: Record<string, string> = {
  breakfast: 'https://images.unsplash.com/photo-1608039829572-25e8182a7290?w=600&q=80',
  lunch: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80',
  dinner: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&q=80',
  snack: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&q=80',
};

function convertMealToCatalog(meal: FootballerMeal): CatalogMeal {
  return {
    id: meal.id,
    name: meal.title,
    calories: meal.calories,
    protein: meal.protein,
    carbs: meal.carbs,
    fat: meal.fats,
    fiber: meal.fiber,
    ingredients: meal.ingredients.map(i => i.name),
    ingredientQuantities: meal.ingredients.map(formatQuantity),
    instructions: meal.instructions.filter(s => s.trim().length > 0),
    nutritionTip: meal.scienceNote,
    prepTime: meal.prepTime,
    diets: convertDietTags(meal),
    allergens: detectAllergens(meal),
    equipment: meal.equipment,
    difficulty: meal.skillLevel,
    budget: budgetFromCost(meal.costEstimate),
    mealType: meal.category,
    image: CATEGORY_IMAGES[meal.category] ?? 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
    noCook: meal.noCook,
    performanceTags: meal.performanceTags,
  };
}

/**
 * Fallback tag detection based on macros and ingredients — used only if a meal
 * has no authored performance tags (all catalog meals have them).
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
 * Get performance tags for a catalog meal — authored UEFA/IOC tags always win.
 */
export function getPerformanceTags(meal: CatalogMeal): string[] {
  if (meal.performanceTags && meal.performanceTags.length > 0) return meal.performanceTags;
  return detectPerformanceTags(meal);
}

export const MEAL_CATALOG: CatalogMeal[] = mealCatalog.map(meal => convertMealToCatalog(meal));
