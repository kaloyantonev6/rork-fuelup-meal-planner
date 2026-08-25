import { UserProfile, DayType } from "@/types";
import { MEAL_CATALOG, CatalogMeal } from "@/mocks/mealCatalog";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { calculateDayTargets, DayTargets } from "@/utils/dailyTargets";

export type { DayType };

export interface GeneratedMeal {
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
  fuelReason: string;
  prepTime: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  image: string;
  isFavorite: boolean;
}

export interface GeneratedPlan {
  id: string;
  date: string;
  dayType: DayType;
  dayLabel: string;
  meals: GeneratedMeal[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  snackLabel?: string;
}

export interface ShoppingIngredient {
  name: string;
  count: number;
}

interface MealHistory {
  planId: string;
  generatedAt: string;
  mealIds: string[];
}

const RECENT_MEALS_KEY = "recentMealHistory";
const MAX_HISTORY = 3;

const PROTEIN_KEYWORDS: Record<string, string[]> = {
  chicken: ["chicken"],
  beef: ["beef", "steak", "sirloin", "chuck", "ribeye", "mince", "ground beef"],
  turkey: ["turkey"],
  salmon: ["salmon"],
  tuna: ["tuna"],
  cod: ["cod"],
  eggs: ["egg", "eggs", "egg whites"],
  tofu: ["tofu", "tempeh"],
  pork: ["pork", "bacon", "pork belly"],
  lamb: ["lamb"],
  sardine: ["sardine", "sardines"],
  mackerel: ["mackerel"],
  lentils: ["lentil", "lentils"],
  chickpeas: ["chickpea", "chickpeas"],
  dairy: ["cottage cheese", "halloumi", "paneer", "yogurt", "skyr"],
};

const PANTRY_STAPLES = new Set([
  "salt", "black pepper", "pepper", "water", "cooking spray",
  "olive oil", "oil", "vegetable oil", "canola oil", "coconut oil",
  "sesame oil", "chili flakes", "sea salt flakes",
]);

const ANTI_INFLAMMATORY_INGREDIENTS = [
  "salmon", "berries", "blueberry", "turmeric", "spinach", "kale",
  "ginger", "walnuts", "almonds", "chia seeds", "flaxseed", "olive oil",
  "avocado", "green tea", "dark chocolate",
];

/**
 * Get the day type for a given date based on the user's weekly schedule.
 */
function getDayTypeFromSchedule(
  date: Date,
  profile: UserProfile,
): DayType {
  const schedule = profile.weeklySchedule;
  if (schedule && schedule.length === 7) {
    // JavaScript getDay(): 0=Sun, 1=Mon, ..., 6=Sat
    // Our schedule: 0=Mon, 1=Tue, ..., 5=Sat, 6=Sun
    const jsDay = date.getDay();
    const scheduleIdx = jsDay === 0 ? 6 : jsDay - 1;
    return (schedule[scheduleIdx] ?? "rest") as DayType;
  }

  // Fallback to legacy logic
  const dayOfWeek = date.getDay();
  const matchDays = profile.matchDays || [];
  if (matchDays.some((m) => m.dayOfWeek === dayOfWeek)) {
    return "match";
  }
  const trainingDays = profile.trainingDaysPerWeek ?? 0;
  if (trainingDays === 0) return "rest";
  const intervals = Math.floor(7 / trainingDays);
  if (intervals <= 0) return "training";
  return dayOfWeek % intervals === 0 ? "training" : "rest";
}

/**
 * Get fuel reason for a meal based on slot, day type, and meal macros.
 */
function getFuelReason(
  mealType: string,
  dayType: DayType,
  meal: CatalogMeal,
  _profile: UserProfile,
): string {
  const isCarbHeavy = meal.carbs > meal.protein * 1.5;
  const isProteinHeavy = meal.protein >= meal.carbs;

  if (dayType === "match") {
    if (mealType === "breakfast") {
      if (isCarbHeavy) return "Pre-match fuel: easy-digesting carbs top up your glycogen stores for kick-off.";
      return "Light pre-match breakfast — enough energy without sitting heavy on your stomach.";
    }
    if (mealType === "lunch") {
      return "Match-day carbs keep your glycogen topped up so you don't fade in the second half.";
    }
    if (mealType === "snack") {
      return "Quick energy top-up between meals to stay sharp on the pitch.";
    }
    if (mealType === "dinner") {
      if (isProteinHeavy) return "Post-match protein starts repairing the muscle damage from 90 minutes.";
      return "Recovery dinner: replenish the carbs you burned and start refuelling for next week.";
    }
  }

  if (dayType === "training") {
    if (mealType === "breakfast") {
      if (isCarbHeavy) return "Carbs before training give you the energy to actually push hard in the session.";
      return "Balanced breakfast to fuel your training session without feeling sluggish.";
    }
    if (mealType === "lunch") {
      return "Post-training lunch: protein for recovery, carbs to refuel.";
    }
    if (mealType === "snack") {
      return "Post-training snack kick-starts recovery before your next meal.";
    }
    if (mealType === "dinner") {
      if (isProteinHeavy) return "Protein at night repairs muscle while you sleep — that's when you actually adapt.";
      return "Dinner carbs reload your glycogen so you're ready for the next session.";
    }
  }

  if (dayType === "recovery") {
    if (mealType === "breakfast") return "Recovery breakfast: protein + anti-inflammatory foods to reduce muscle soreness.";
    if (mealType === "lunch") return "Recovery lunch: steady protein and complex carbs to rebuild after yesterday's effort.";
    if (mealType === "dinner") return "Recovery dinner: omega-3s and antioxidants to speed muscle repair overnight.";
    return "Light snack — protein and hydration to support recovery.";
  }

  // Rest day
  if (mealType === "breakfast") return "Rest-day breakfast: lighter on carbs, still enough protein to maintain muscle.";
  if (mealType === "lunch") return "Rest day means less fuel needed — your body is recovering, not burning.";
  if (mealType === "dinner") return "Recovery dinner: steady protein to keep rebuilding muscle on your day off.";
  return "Light snack — rest days need less fuel, but don't skip protein.";
}

/**
 * Detect performance tags for a meal based on its macros and ingredients.
 */
export function detectPerformanceTags(meal: CatalogMeal): string[] {
  const tags: string[] = [];
  const totalCals = meal.calories || 1;
  const carbCals = meal.carbs * 4;
  const proteinCals = meal.protein * 4;
  const fatCals = meal.fat * 9;
  const carbPct = carbCals / totalCals;
  const proteinPct = proteinCals / totalCals;
  const fatPct = fatCals / totalCals;

  // High carb (55%+)
  if (carbPct >= 0.55) {
    tags.push("high_carb", "pre_match", "match_day");
  }
  // High protein (35%+)
  if (proteinPct >= 0.35) {
    tags.push("high_protein", "recovery");
  }
  // Low fat + low fiber → match day suitable
  if (fatPct < 0.2) {
    tags.push("match_day", "pre_match");
  }
  // Anti-inflammatory ingredients → rest day / recovery
  const ingredientsLower = meal.ingredients.map((i) => i.toLowerCase());
  const hasAntiInflam = ingredientsLower.some((ing) =>
    ANTI_INFLAMMATORY_INGREDIENTS.some((ai) => ing.includes(ai))
  );
  if (hasAntiInflam) {
    tags.push("rest_day", "recovery");
  }
  // Quick energy (under 10 min)
  if (meal.prepTime <= 10) {
    tags.push("quick_energy");
  }
  // Training — balanced meals
  if (carbPct >= 0.4 && proteinPct >= 0.2 && fatPct <= 0.3) {
    tags.push("training");
  }
  // Meal prep — larger meals or rice/pasta based
  if (meal.calories >= 500 && meal.prepTime <= 25) {
    tags.push("meal_prep");
  }
  // Pre-season — calorie dense
  if (meal.calories >= 600) {
    tags.push("pre_season");
  }
  // Ensure at least one tag
  if (tags.length === 0) {
    tags.push("training");
  }

  return Array.from(new Set(tags));
}

/**
 * Score a meal for a specific day type based on performance tag matching.
 */
function scoreByDayType(meal: CatalogMeal, dayType: DayType): number {
  const perfTags = detectPerformanceTags(meal);
  let score = 1.0;

  switch (dayType) {
    case "match":
      if (perfTags.includes("match_day")) score *= 2.0;
      if (perfTags.includes("pre_match")) score *= 1.8;
      if (perfTags.includes("high_carb")) score *= 1.5;
      // Penalize high-fat meals on match day
      if (perfTags.includes("high_protein") && !perfTags.includes("high_carb")) score *= 0.6;
      break;
    case "training":
      if (perfTags.includes("training")) score *= 1.8;
      if (perfTags.includes("high_carb")) score *= 1.3;
      if (perfTags.includes("high_protein")) score *= 1.2;
      break;
    case "recovery":
      if (perfTags.includes("recovery")) score *= 2.0;
      if (perfTags.includes("rest_day")) score *= 1.5;
      if (perfTags.includes("high_protein")) score *= 1.4;
      break;
    case "rest":
      if (perfTags.includes("rest_day")) score *= 2.0;
      if (perfTags.includes("recovery")) score *= 1.5;
      // Lighter meals preferred on rest days
      if (meal.calories < 450) score *= 1.2;
      break;
  }

  return score;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function detectPrimaryProtein(meal: CatalogMeal): string {
  const ingredientsLower = meal.ingredients.map((i) => i.toLowerCase());
  for (const [protein, keywords] of Object.entries(PROTEIN_KEYWORDS)) {
    if (ingredientsLower.some((ing) => keywords.some((kw) => ing.includes(kw)))) {
      return protein;
    }
  }
  return "other";
}

function getWeightForMeal(
  mealId: string,
  recentHistory: MealHistory[],
): number {
  if (recentHistory.length === 0) return 1.0;

  for (let i = 0; i < recentHistory.length; i++) {
    const plan = recentHistory[i];
    if (plan && plan.mealIds.includes(mealId)) {
      if (i === 0) return 0.1;
      if (i === 1) return 0.3;
      if (i === 2) return 0.6;
    }
  }

  return 1.0;
}

/**
 * Determine the meal slots for a given day type.
 * Training & match days: 4 slots (breakfast, lunch, post-training snack, dinner)
 * Rest & recovery days: 3 slots (breakfast, lunch, dinner)
 */
function getMealSlotsForDayType(dayType: DayType): {
  slots: ("breakfast" | "lunch" | "snack" | "dinner")[];
  snackLabel: string;
} {
  if (dayType === "training") {
    return { slots: ["breakfast", "lunch", "snack", "dinner"], snackLabel: "Post-Training Snack" };
  }
  if (dayType === "match") {
    return { slots: ["breakfast", "lunch", "snack", "dinner"], snackLabel: "Post-Match Recovery" };
  }
  return { slots: ["breakfast", "lunch", "dinner"], snackLabel: "" };
}

function filterMeals(
  meals: CatalogMeal[],
  profile: UserProfile,
  mealType: "breakfast" | "lunch" | "dinner" | "snack",
): CatalogMeal[] {
  return meals.filter((meal) => {
    if (meal.mealType !== mealType) return false;

    const dietMatch = meal.diets.includes(profile.dietType);
    if (!dietMatch) return false;

    const userAllergies = (profile.allergies || []).filter((a) => a !== "none");
    if (userAllergies.length > 0) {
      const hasAllergen = meal.allergens.some((a) => userAllergies.includes(a));
      if (hasAllergen) return false;
    }

    if (meal.equipment.length > 0) {
      const userEquipment = profile.kitchenEquipment || [];
      const hasEquipment = meal.equipment.every((eq) => userEquipment.includes(eq));
      if (!hasEquipment) {
        const basicEquipment = meal.equipment.length === 0;
        if (!basicEquipment) return false;
      }
    }

    const skillOrder = ["beginner", "intermediate", "advanced"];
    const userSkillIdx = skillOrder.indexOf(profile.cookingSkill || "beginner");
    const mealSkillIdx = skillOrder.indexOf(meal.difficulty);
    if (mealSkillIdx > userSkillIdx) return false;

    if (profile.maxCookTime && profile.maxCookTime !== "any") {
      const maxMinutes =
        profile.maxCookTime === "under_15" ? 15 :
        profile.maxCookTime === "under_30" ? 30 :
        profile.maxCookTime === "under_45" ? 45 : Infinity;
      if (meal.prepTime > maxMinutes) return false;
    }

    if (profile.noCookOnly && !meal.noCook) return false;

    if (profile.maxFiveIngredients) {
      const realIngredients = meal.ingredients.filter(
        (ing) => !PANTRY_STAPLES.has(ing.toLowerCase()),
      );
      if (realIngredients.length > 5) return false;
    }

    const budgetOrder = ["budget", "moderate", "premium"];
    const userBudgetIdx = budgetOrder.indexOf(profile.budgetPreference || "moderate");
    const mealBudgetIdx = budgetOrder.indexOf(meal.budget);
    if (mealBudgetIdx > userBudgetIdx) return false;

    return true;
  });
}

function pickMealWithDiversity(
  candidates: CatalogMeal[],
  targetCal: number,
  usedIds: Set<string>,
  proteinCounts: Map<string, number>,
  recentHistory: MealHistory[],
  dayType: DayType,
  previousDayLastMealId?: string,
): CatalogMeal | null {
  const available = candidates.filter((c) => !usedIds.has(c.id));
  if (available.length === 0) return null;

  const CALORIE_TOLERANCE = 100;

  const withinRange = available.filter(
    (m) => Math.abs(m.calories - targetCal) <= CALORIE_TOLERANCE,
  );

  const pool = withinRange.length >= 2 ? withinRange : available;

  const scored = pool.map((meal) => {
    let score = getWeightForMeal(meal.id, recentHistory);

    // Day-type performance scoring
    score *= scoreByDayType(meal, dayType);

    const protein = detectPrimaryProtein(meal);
    const count = proteinCounts.get(protein) ?? 0;
    if (count >= 2) {
      score *= 0.2;
    } else if (count >= 1) {
      score *= 0.5;
    }

    if (previousDayLastMealId && meal.id === previousDayLastMealId) {
      score *= 0.1;
    }

    if (withinRange.length < 2) {
      const calDiff = Math.abs(meal.calories - targetCal);
      const calPenalty = Math.max(0.3, 1 - calDiff / 500);
      score *= calPenalty;
    }

    return { meal, score };
  });

  const totalScore = scored.reduce((sum, s) => sum + s.score, 0);
  if (totalScore <= 0) {
    const shuffled = shuffleArray(pool);
    return shuffled[0] ?? null;
  }

  let random = Math.random() * totalScore;
  for (const { meal, score } of scored) {
    random -= score;
    if (random <= 0) {
      return meal;
    }
  }

  return scored[scored.length - 1]?.meal ?? null;
}

function catalogMealToGenerated(
  meal: CatalogMeal,
  slotType: "breakfast" | "lunch" | "dinner" | "snack",
  dayType: DayType,
  profile: UserProfile,
): GeneratedMeal {
  return {
    id: meal.id,
    name: meal.name,
    calories: meal.calories,
    protein: meal.protein,
    carbs: meal.carbs,
    fat: meal.fat,
    ingredients: meal.ingredients,
    ingredientQuantities: meal.ingredientQuantities,
    instructions: meal.instructions,
    nutritionTip: meal.nutritionTip,
    fuelReason: getFuelReason(slotType, dayType, meal, profile),
    prepTime: meal.prepTime,
    difficulty: meal.difficulty,
    mealType: slotType,
    image: meal.image,
    isFavorite: false,
  };
}

function getSlotCalorieTargets(totalCalories: number, mealSlots: string[]): number[] {
  const count = mealSlots.length;
  if (count === 3) {
    return [
      Math.round(totalCalories * 0.30),
      Math.round(totalCalories * 0.35),
      Math.round(totalCalories * 0.35),
    ];
  }
  if (count === 4) {
    return [
      Math.round(totalCalories * 0.25),
      Math.round(totalCalories * 0.30),
      Math.round(totalCalories * 0.15),
      Math.round(totalCalories * 0.30),
    ];
  }
  if (count === 2) {
    return [Math.round(totalCalories * 0.45), Math.round(totalCalories * 0.55)];
  }
  return [Math.round(totalCalories * 0.30), Math.round(totalCalories * 0.35), Math.round(totalCalories * 0.35)];
}

async function loadRecentHistory(): Promise<MealHistory[]> {
  try {
    const stored = await AsyncStorage.getItem(RECENT_MEALS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as MealHistory[];
      return parsed.sort(
        (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime(),
      );
    }
  } catch (e) {
    console.log("[MealGenerator] Error loading recent history:", e);
  }
  return [];
}

async function saveToHistory(mealIds: string[]): Promise<void> {
  try {
    const history = await loadRecentHistory();
    const newEntry: MealHistory = {
      planId: `plan_${Date.now()}`,
      generatedAt: new Date().toISOString(),
      mealIds,
    };
    history.unshift(newEntry);
    const trimmed = history.slice(0, MAX_HISTORY);
    await AsyncStorage.setItem(RECENT_MEALS_KEY, JSON.stringify(trimmed));
    console.log("[MealGenerator] Saved plan to history, total entries:", trimmed.length);
  } catch (e) {
    console.log("[MealGenerator] Error saving history:", e);
  }
}

function generateDailyPlanInternal(
  profile: UserProfile,
  mealsPerDay: number,
  calorieOverride: number | null,
  recentHistory: MealHistory[],
  proteinCounts: Map<string, number>,
  usedIdsAcrossDays: Set<string>,
  previousDayBreakfastId?: string,
  dayTypeOverride?: DayType,
  dateForDayType?: Date,
  dayLabel?: string,
): { plan: GeneratedPlan; proteinCounts: Map<string, number> } {
  const planDate = dateForDayType ?? new Date();
  const dayType = dayTypeOverride ?? getDayTypeFromSchedule(planDate, profile);
  console.log("[MealGenerator] Generating daily plan. Day type:", dayType);

  const dayTargets: DayTargets = calculateDayTargets(profile, dayType);
  const targetCal = calorieOverride ?? dayTargets.calories;
  const targetProtein = dayTargets.protein;
  const targetCarbs = dayTargets.carbs;
  const targetFat = dayTargets.fat;

  console.log("[MealGenerator] Target calories:", targetCal, "P:", targetProtein, "C:", targetCarbs, "F:", targetFat);

  const { slots: mealSlots, snackLabel } = getMealSlotsForDayType(dayType);
  // Override mealsPerDay with the day-type-appropriate count
  const effectiveSlots = mealsPerDay <= mealSlots.length ? mealSlots.slice(0, mealsPerDay) : mealSlots;

  const usedIds = new Set<string>(usedIdsAcrossDays);
  const selectedMeals: GeneratedMeal[] = [];

  const slotCalTargets = getSlotCalorieTargets(targetCal, effectiveSlots);
  let runningCalories = 0;

  console.log("[MealGenerator] Meal slots:", effectiveSlots, "Cal targets:", slotCalTargets);

  for (let i = 0; i < effectiveSlots.length; i++) {
    const slot = effectiveSlots[i] as "breakfast" | "lunch" | "dinner" | "snack";
    const isLastSlot = i === effectiveSlots.length - 1;
    const slotTarget = isLastSlot
      ? targetCal - runningCalories
      : slotCalTargets[i] ?? Math.round(targetCal / effectiveSlots.length);

    console.log(`[MealGenerator] ${slot} (slot ${i}): target ${slotTarget} kcal (running: ${runningCalories})`);

    let candidates = filterMeals(MEAL_CATALOG, profile, slot);
    console.log(`[MealGenerator] ${slot} candidates after filter: ${candidates.length}`);

    if (candidates.length === 0) {
      candidates = MEAL_CATALOG.filter((m) => m.mealType === slot);
      console.log(`[MealGenerator] Using unfiltered pool for ${slot}: ${candidates.length}`);
    }

    if (candidates.length === 0 && slot === "snack") {
      const snackCalTarget = slotCalTargets[i] ?? Math.round(targetCal / effectiveSlots.length);
      const lightMeals = filterMeals(MEAL_CATALOG, profile, "breakfast").filter(
        (m) => m.calories <= snackCalTarget + 100,
      );
      if (lightMeals.length > 0) {
        candidates = lightMeals;
      } else {
        candidates = MEAL_CATALOG.filter((m) => m.calories <= snackCalTarget + 100);
      }
    }

    const previousMealId = i === 0 ? previousDayBreakfastId : undefined;

    const picked = pickMealWithDiversity(
      candidates,
      slotTarget,
      usedIds,
      proteinCounts,
      recentHistory,
      dayType,
      previousMealId,
    );

    if (picked) {
      usedIds.add(picked.id);
      usedIdsAcrossDays.add(picked.id);
      selectedMeals.push(catalogMealToGenerated(picked, slot, dayType, profile));
      runningCalories += picked.calories;

      const protein = detectPrimaryProtein(picked);
      proteinCounts.set(protein, (proteinCounts.get(protein) ?? 0) + 1);

      console.log(`[MealGenerator] Picked for ${slot}: ${picked.name} (${picked.calories} kcal, protein: ${protein})`);
    }
  }

  const totals = selectedMeals.reduce(
    (acc, m) => ({
      cal: acc.cal + m.calories,
      p: acc.p + m.protein,
      c: acc.c + m.carbs,
      f: acc.f + m.fat,
    }),
    { cal: 0, p: 0, c: 0, f: 0 },
  );

  console.log("[MealGenerator] Total calories:", totals.cal, "Target:", targetCal);

  return {
    plan: {
      id: `plan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      date: planDate.toISOString().split("T")[0] ?? "",
      dayType,
      dayLabel: dayLabel ?? (dayType === "match" ? "Match Day" : dayType === "training" ? "Training Day" : dayType === "recovery" ? "Recovery Day" : "Rest Day"),
      meals: selectedMeals,
      totalCalories: totals.cal,
      totalProtein: totals.p,
      totalCarbs: totals.c,
      totalFat: totals.f,
      targetCalories: targetCal,
      targetProtein,
      targetCarbs,
      targetFat,
      snackLabel: snackLabel || undefined,
    },
    proteinCounts,
  };
}

function calculateOverlap(newMealIds: string[], recentHistory: MealHistory[]): number {
  if (recentHistory.length === 0) return 0;
  const lastPlan = recentHistory[0];
  if (!lastPlan) return 0;
  const lastIds = new Set(lastPlan.mealIds);
  const overlap = newMealIds.filter((id) => lastIds.has(id)).length;
  return overlap / Math.max(newMealIds.length, 1);
}

export async function generateDailyPlan(
  profile: UserProfile,
  mealsPerDay: number,
  calorieOverride: number | null,
): Promise<GeneratedPlan> {
  const recentHistory = await loadRecentHistory();
  console.log("[MealGenerator] Recent history plans:", recentHistory.length);

  const proteinCounts = new Map<string, number>();
  const usedIds = new Set<string>();

  let bestPlan: GeneratedPlan | null = null;
  let bestOverlap = 1.0;

  for (let attempt = 0; attempt < 5; attempt++) {
    const { plan } = generateDailyPlanInternal(
      profile,
      mealsPerDay,
      calorieOverride,
      recentHistory,
      new Map(proteinCounts),
      new Set(usedIds),
    );

    const planMealIds = plan.meals.map((m) => m.id);
    const overlap = calculateOverlap(planMealIds, recentHistory);

    console.log(`[MealGenerator] Attempt ${attempt + 1}: overlap=${(overlap * 100).toFixed(0)}%`);

    if (overlap <= 0.5 || !bestPlan) {
      bestPlan = plan;
      bestOverlap = overlap;
    }

    if (overlap <= 0.5) break;
  }

  const finalPlan = bestPlan!;
  const allMealIds = finalPlan.meals.map((m) => m.id);
  await saveToHistory(allMealIds);

  console.log("[MealGenerator] Final plan overlap:", (bestOverlap * 100).toFixed(0) + "%");
  return finalPlan;
}

export async function generateWeeklyPlan(
  profile: UserProfile,
  mealsPerDay: number,
  calorieOverride: number | null,
): Promise<GeneratedPlan[]> {
  console.log("[MealGenerator] Generating weekly plan");

  const recentHistory = await loadRecentHistory();
  const plans: GeneratedPlan[] = [];
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const proteinCounts = new Map<string, number>();
  const usedIdsAcrossDays = new Set<string>();
  let previousDayBreakfastId: string | undefined;

  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const dayType = getDayTypeFromSchedule(date, profile);
    const dayLabel = dayType === "match" ? "Match Day" : dayType === "training" ? "Training Day" : dayType === "recovery" ? "Recovery Day" : "Rest Day";

    const { plan, proteinCounts: updatedProtein } = generateDailyPlanInternal(
      profile,
      mealsPerDay,
      calorieOverride,
      recentHistory,
      proteinCounts,
      usedIdsAcrossDays,
      previousDayBreakfastId,
      dayType,
      date,
      dayLabel,
    );

    for (const [k, v] of updatedProtein) {
      proteinCounts.set(k, v);
    }

    const breakfastMeal = plan.meals.find((m) => m.mealType === "breakfast");
    previousDayBreakfastId = breakfastMeal?.id;

    plans.push({
      ...plan,
      id: `plan_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`,
      date: `${dayNames[i]} - ${date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`,
    });
  }

  const allMealIds = plans.flatMap((p) => p.meals.map((m) => m.id));

  const overlapWithRecent = calculateOverlap(allMealIds, recentHistory);
  console.log("[MealGenerator] Weekly plan overlap with history:", (overlapWithRecent * 100).toFixed(0) + "%");

  await saveToHistory(allMealIds);

  return plans;
}

export function compileShoppingList(plans: GeneratedPlan[]): ShoppingIngredient[] {
  const map = new Map<string, number>();
  for (const plan of plans) {
    for (const meal of plan.meals) {
      for (const ing of meal.ingredientQuantities) {
        map.set(ing, (map.get(ing) ?? 0) + 1);
      }
    }
  }
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function regenerateSingleMeal(
  profile: UserProfile,
  currentMeal: GeneratedMeal,
  excludeIds: string[],
): GeneratedMeal | null {
  const excluded = new Set(excludeIds);
  const candidates = filterMeals(MEAL_CATALOG, profile, currentMeal.mealType);
  const available = candidates.filter((c) => !excluded.has(c.id));

  if (available.length === 0) {
    console.log("[MealGenerator] No alternatives available for", currentMeal.mealType);
    return null;
  }

  const shuffled = shuffleArray(available);
  const pick = shuffled[0];
  if (!pick) return null;

  console.log("[MealGenerator] Regenerated:", currentMeal.name, "->", pick.name);
  return catalogMealToGenerated(pick, currentMeal.mealType, "training", profile);
}

export { getDayTypeFromSchedule };
