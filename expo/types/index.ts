export type Gender = "male" | "female" | "other";

// Football-specific types
export type FootballPosition =
  | "goalkeeper"
  | "centre_back"
  | "full_back"
  | "defensive_mid"
  | "central_mid"
  | "attacking_mid"
  | "winger"
  | "striker";

export type PlayerLevel =
  | "recreational"
  | "amateur"
  | "academy"
  | "professional";

export type TrainingFrequency = "1-2" | "3-4" | "5-6" | "daily";

export type SeasonPhase =
  | "pre_season"
  | "in_season"
  | "off_season"
  | "injury_recovery";

export type PerformanceGoal =
  | "lean_fast"
  | "endurance"
  | "muscle_power"
  | "injury_recovery"
  | "general";

export type DayType = "training" | "match" | "rest" | "recovery";

export type PerformanceTag =
  | "pre_match"
  | "post_match"
  | "match_day"
  | "training"
  | "rest_day"
  | "recovery"
  | "high_carb"
  | "high_protein"
  | "quick_energy"
  | "meal_prep"
  | "pre_season";

// Legacy compat — keep for any existing references
export type FitnessGoal = "lose_fat" | "build_muscle" | "maintain" | "improve_energy";
export type DietType = "balanced" | "vegetarian" | "vegan" | "pescatarian" | "mediterranean" | "halal" | "omnivore" | "keto" | "paleo";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type BudgetPreference = "budget" | "moderate" | "premium";
export type CookingSkill = "beginner" | "intermediate" | "advanced";
export type CookTimeFilter = "any" | "under_15" | "under_30" | "under_45";
export type KitchenType = "dorm" | "shared" | "full" | "custom";
export type MealPrepStyle = "weekly" | "sometimes" | "daily";
export type ParentalConsentStatus = "granted" | "pending" | "not_required";

export interface UserProfile {
  name: string;
  age: number;
  gender: Gender;
  weight: number;
  height: number;

  // Profile picture (local URI from image picker)
  profileImage?: string;

  // Meal reminder notifications (default true)
  mealRemindersEnabled?: boolean;

  // Football profile
  position: FootballPosition;
  level: PlayerLevel;
  trainingFrequency: TrainingFrequency;
  seasonPhase: SeasonPhase;
  performanceGoal: PerformanceGoal;
  weeklySchedule: DayType[]; // 7 entries, Mon-Sun
  defaultKickoffTime: string; // "HH:MM" format
  defaultTrainingTime: string; // "HH:MM" format

  // Diet
  dietType: string;
  dietTypes: string[];
  allergies: string[];

  // Budget & location
  weeklyBudget: number;
  country: string;

  // Legacy fields kept for compat with existing generation/shopping code
  goal: FitnessGoal;
  activityLevel: ActivityLevel;
  budgetPreference: BudgetPreference;
  kitchenEquipment: string[];
  cookingSkill: CookingSkill;
  maxCookTime: CookTimeFilter;
  noCookOnly: boolean;
  maxFiveIngredients: boolean;
  dietaryPreferences: string[];
  budget: "low" | "medium" | "high";
  calorieTarget: number;
  isPremium: boolean;
  kitchenType?: KitchenType;
  mealPrepStyle?: MealPrepStyle;

  // Legacy soccer fields (kept for backward compat with generator)
  soccerPosition?: string;
  playerLevel?: string;
  trainingDaysPerWeek?: number;
  trainingIntensity?: "light" | "moderate" | "hard";
  matchDays?: { dayOfWeek: number; timeOfDay: string }[];
  performanceGoalLegacy?: string;
  parentalConsent?: ParentalConsentStatus;
  cookAvailability?: "no_cooking" | "quick" | "willing";
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface Ingredient {
  id: string;
  name: string;
  amount: string;
  unit: string;
  category: string;
}

export interface Recipe {
  id: string;
  title: string;
  image: string;
  duration: number;
  servings: number;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  nutrition: NutritionInfo;
  ingredients: Ingredient[];
  steps: string[];
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
}

export interface MealPlan {
  id: string;
  date: string;
  meals: {
    breakfast: Recipe;
    lunch: Recipe;
    dinner: Recipe;
    snack: Recipe;
  };
  totalNutrition: NutritionInfo;
}

export interface ShoppingItem {
  id: string;
  name: string;
  amount: string;
  unit: string;
  category: string;
  checked: boolean;
  bestPrice?: number;
  originalPrice?: number;
  retailer?: string;
  discount?: number;
}

export interface Retailer {
  id: string;
  name: string;
  logo: string;
  discountCount: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  period: "monthly" | "annual";
  features: string[];
  popular?: boolean;
}

// Match Day Timeline types
export interface TimelinePoint {
  time: string;
  timeLabel: string;
  label: string;
  description: string;
  calories: number;
  example: string;
  mealSlot?: "breakfast" | "pre_match_meal" | "pre_match_snack" | "hydration" | "half_time" | "post_match" | "evening";
}

// Hydration tracking
export interface HydrationLog {
  date: string;
  intakeMl: number;
}
