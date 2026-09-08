import type { FootballerMeal } from "./catalog/types";
import { matchDayMeals } from "./catalog/matchDay";
import { trainingDayMeals } from "./catalog/trainingDay";
import { restDayMeals } from "./catalog/restDay";
import { recoveryDayMeals } from "./catalog/recoveryDay";

export type { FootballerMeal } from "./catalog/types";

export type Meal = FootballerMeal;

/**
 * Research-backed footballer meal catalog (80 meals), organized by performance
 * context: match day (20), training day (25), rest day (15), recovery day (20).
 * Every recipe follows UEFA (Collins et al., 2021) and IOC sports-nutrition
 * guidance with proper macronutrient periodization.
 */
export const footballerMealCatalog: FootballerMeal[] = [
  ...matchDayMeals,
  ...trainingDayMeals,
  ...restDayMeals,
  ...recoveryDayMeals,
];

/** Back-compat alias consumed by the catalog adapter. */
export const mealCatalog: FootballerMeal[] = footballerMealCatalog;
