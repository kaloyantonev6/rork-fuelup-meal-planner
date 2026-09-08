/**
 * Footballer-specific meal, grounded in UEFA Expert Group Statement (Collins et al., 2021)
 * and IOC Consensus on Sports Nutrition guidelines.
 */
export interface FootballerMeal {
  id: string;
  title: string;
  category: "breakfast" | "lunch" | "dinner" | "snack";
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fats: number; // grams
  fiber: number; // grams (UEFA flags low-fiber on match day)
  prepTime: number; // minutes
  ingredients: { name: string; quantity: number; unit: string }[];
  instructions: string[];
  performanceTags: string[];
  dietTags: string[];
  equipment: string[];
  skillLevel: "beginner" | "intermediate";
  costEstimate: number; // EUR
  noCook: boolean;
  scienceNote: string; // short evidence-based tip shown on meal detail
}
