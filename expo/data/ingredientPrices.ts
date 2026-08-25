export interface IngredientPrice {
  name: string;
  unit: string;
  basePrice: number;
  discountMultiplier: number;
  midRangeMultiplier: number;
  premiumMultiplier: number;
  bulkSize?: number;
  bulkUnit?: string;
  bulkPrice?: number;
  bulkSavingsPercent?: number;
  category: "proteins" | "vegetables" | "fruits" | "dairy" | "grains" | "pantry" | "frozen" | "canned" | "beverages";
}

export const ingredientPrices: IngredientPrice[] = [
  // === PROTEINS ===
  { name: "Chicken breast", unit: "kg", basePrice: 7.99, discountMultiplier: 0.72, midRangeMultiplier: 1.0, premiumMultiplier: 1.45, bulkSize: 2, bulkUnit: "kg", bulkPrice: 13.49, bulkSavingsPercent: 16, category: "proteins" },
  { name: "Chicken thighs", unit: "kg", basePrice: 5.49, discountMultiplier: 0.70, midRangeMultiplier: 1.0, premiumMultiplier: 1.40, bulkSize: 2, bulkUnit: "kg", bulkPrice: 8.99, bulkSavingsPercent: 18, category: "proteins" },
  { name: "Ground beef", unit: "kg", basePrice: 8.99, discountMultiplier: 0.74, midRangeMultiplier: 1.0, premiumMultiplier: 1.55, bulkSize: 1.5, bulkUnit: "kg", bulkPrice: 11.99, bulkSavingsPercent: 11, category: "proteins" },
  { name: "Salmon fillet", unit: "kg", basePrice: 16.99, discountMultiplier: 0.78, midRangeMultiplier: 1.0, premiumMultiplier: 1.50, category: "proteins" },
  { name: "Canned tuna", unit: "can", basePrice: 1.49, discountMultiplier: 0.60, midRangeMultiplier: 1.0, premiumMultiplier: 1.65, bulkSize: 6, bulkUnit: "cans", bulkPrice: 6.99, bulkSavingsPercent: 22, category: "proteins" },
  { name: "Eggs", unit: "dozen", basePrice: 2.79, discountMultiplier: 0.68, midRangeMultiplier: 1.0, premiumMultiplier: 1.60, category: "proteins" },
  { name: "Tofu", unit: "pack", basePrice: 2.29, discountMultiplier: 0.78, midRangeMultiplier: 1.0, premiumMultiplier: 1.35, category: "proteins" },
  { name: "Pre-cooked chicken strips", unit: "pack", basePrice: 3.49, discountMultiplier: 0.75, midRangeMultiplier: 1.0, premiumMultiplier: 1.40, category: "proteins" },
  { name: "Turkey mince", unit: "kg", basePrice: 7.49, discountMultiplier: 0.73, midRangeMultiplier: 1.0, premiumMultiplier: 1.45, category: "proteins" },
  { name: "Shrimp", unit: "kg", basePrice: 12.99, discountMultiplier: 0.80, midRangeMultiplier: 1.0, premiumMultiplier: 1.50, category: "proteins" },
  { name: "Canned white beans", unit: "can", basePrice: 0.99, discountMultiplier: 0.55, midRangeMultiplier: 1.0, premiumMultiplier: 1.50, category: "proteins" },
  { name: "Lentils", unit: "kg", basePrice: 2.49, discountMultiplier: 0.65, midRangeMultiplier: 1.0, premiumMultiplier: 1.55, bulkSize: 2, bulkUnit: "kg", bulkPrice: 3.99, bulkSavingsPercent: 20, category: "proteins" },
  { name: "Chickpeas", unit: "can", basePrice: 0.99, discountMultiplier: 0.55, midRangeMultiplier: 1.0, premiumMultiplier: 1.50, category: "proteins" },
  { name: "Beef steak", unit: "kg", basePrice: 15.99, discountMultiplier: 0.72, midRangeMultiplier: 1.0, premiumMultiplier: 1.55, category: "proteins" },
  { name: "Bacon", unit: "pack", basePrice: 2.99, discountMultiplier: 0.70, midRangeMultiplier: 1.0, premiumMultiplier: 1.45, category: "proteins" },
  { name: "Pork", unit: "kg", basePrice: 6.99, discountMultiplier: 0.72, midRangeMultiplier: 1.0, premiumMultiplier: 1.40, category: "proteins" },
  { name: "Lamb", unit: "kg", basePrice: 13.99, discountMultiplier: 0.75, midRangeMultiplier: 1.0, premiumMultiplier: 1.50, category: "proteins" },
  { name: "Cod", unit: "kg", basePrice: 11.99, discountMultiplier: 0.78, midRangeMultiplier: 1.0, premiumMultiplier: 1.45, category: "proteins" },
  { name: "Sardines", unit: "can", basePrice: 1.29, discountMultiplier: 0.58, midRangeMultiplier: 1.0, premiumMultiplier: 1.55, category: "proteins" },
  { name: "Tempeh", unit: "pack", basePrice: 2.99, discountMultiplier: 0.80, midRangeMultiplier: 1.0, premiumMultiplier: 1.35, category: "proteins" },
  { name: "Sausage", unit: "pack", basePrice: 3.49, discountMultiplier: 0.72, midRangeMultiplier: 1.0, premiumMultiplier: 1.50, category: "proteins" },

  // === DAIRY ===
  { name: "Milk", unit: "litre", basePrice: 1.19, discountMultiplier: 0.68, midRangeMultiplier: 1.0, premiumMultiplier: 1.55, category: "dairy" },
  { name: "Greek yogurt", unit: "pack", basePrice: 1.89, discountMultiplier: 0.70, midRangeMultiplier: 1.0, premiumMultiplier: 1.45, bulkSize: 1, bulkUnit: "kg", bulkPrice: 3.29, bulkSavingsPercent: 13, category: "dairy" },
  { name: "Cheddar cheese", unit: "pack", basePrice: 2.49, discountMultiplier: 0.72, midRangeMultiplier: 1.0, premiumMultiplier: 1.50, category: "dairy" },
  { name: "Parmesan cheese", unit: "pack", basePrice: 3.29, discountMultiplier: 0.75, midRangeMultiplier: 1.0, premiumMultiplier: 1.55, category: "dairy" },
  { name: "Fresh mozzarella", unit: "pack", basePrice: 1.99, discountMultiplier: 0.72, midRangeMultiplier: 1.0, premiumMultiplier: 1.50, category: "dairy" },
  { name: "Butter", unit: "pack", basePrice: 2.29, discountMultiplier: 0.70, midRangeMultiplier: 1.0, premiumMultiplier: 1.45, category: "dairy" },
  { name: "Cream cheese", unit: "pack", basePrice: 1.49, discountMultiplier: 0.68, midRangeMultiplier: 1.0, premiumMultiplier: 1.40, category: "dairy" },
  { name: "Feta cheese", unit: "pack", basePrice: 2.19, discountMultiplier: 0.72, midRangeMultiplier: 1.0, premiumMultiplier: 1.45, category: "dairy" },
  { name: "Halloumi", unit: "pack", basePrice: 2.99, discountMultiplier: 0.75, midRangeMultiplier: 1.0, premiumMultiplier: 1.45, category: "dairy" },
  { name: "Skyr", unit: "pack", basePrice: 1.79, discountMultiplier: 0.70, midRangeMultiplier: 1.0, premiumMultiplier: 1.40, category: "dairy" },
  { name: "Cottage cheese", unit: "pack", basePrice: 1.49, discountMultiplier: 0.68, midRangeMultiplier: 1.0, premiumMultiplier: 1.40, category: "dairy" },
  { name: "Cream", unit: "pack", basePrice: 1.69, discountMultiplier: 0.72, midRangeMultiplier: 1.0, premiumMultiplier: 1.45, category: "dairy" },

  // === GRAINS & CARBS ===
  { name: "Rice", unit: "kg", basePrice: 1.99, discountMultiplier: 0.60, midRangeMultiplier: 1.0, premiumMultiplier: 1.50, bulkSize: 5, bulkUnit: "kg", bulkPrice: 6.99, bulkSavingsPercent: 30, category: "grains" },
  { name: "Pasta", unit: "pack", basePrice: 1.29, discountMultiplier: 0.55, midRangeMultiplier: 1.0, premiumMultiplier: 1.70, bulkSize: 3, bulkUnit: "kg", bulkPrice: 2.99, bulkSavingsPercent: 23, category: "grains" },
  { name: "Bread", unit: "loaf", basePrice: 1.69, discountMultiplier: 0.65, midRangeMultiplier: 1.0, premiumMultiplier: 1.75, category: "grains" },
  { name: "Tortilla wrap", unit: "pack", basePrice: 1.99, discountMultiplier: 0.70, midRangeMultiplier: 1.0, premiumMultiplier: 1.40, category: "grains" },
  { name: "Rolled oats", unit: "kg", basePrice: 1.49, discountMultiplier: 0.55, midRangeMultiplier: 1.0, premiumMultiplier: 1.65, bulkSize: 2, bulkUnit: "kg", bulkPrice: 2.29, bulkSavingsPercent: 23, category: "grains" },
  { name: "Ciabatta roll", unit: "piece", basePrice: 0.79, discountMultiplier: 0.70, midRangeMultiplier: 1.0, premiumMultiplier: 1.55, category: "grains" },
  { name: "Granola", unit: "pack", basePrice: 2.99, discountMultiplier: 0.68, midRangeMultiplier: 1.0, premiumMultiplier: 1.50, category: "grains" },
  { name: "Noodles", unit: "pack", basePrice: 0.99, discountMultiplier: 0.55, midRangeMultiplier: 1.0, premiumMultiplier: 1.60, category: "grains" },
  { name: "Couscous", unit: "pack", basePrice: 1.49, discountMultiplier: 0.65, midRangeMultiplier: 1.0, premiumMultiplier: 1.45, category: "grains" },
  { name: "Quinoa", unit: "pack", basePrice: 3.49, discountMultiplier: 0.75, midRangeMultiplier: 1.0, premiumMultiplier: 1.35, category: "grains" },
  { name: "Flour", unit: "kg", basePrice: 0.89, discountMultiplier: 0.55, midRangeMultiplier: 1.0, premiumMultiplier: 1.60, category: "grains" },
  { name: "Sweet potato", unit: "kg", basePrice: 2.29, discountMultiplier: 0.72, midRangeMultiplier: 1.0, premiumMultiplier: 1.40, category: "grains" },
  { name: "Potato", unit: "kg", basePrice: 1.19, discountMultiplier: 0.55, midRangeMultiplier: 1.0, premiumMultiplier: 1.50, category: "grains" },
  { name: "Tortilla chips", unit: "pack", basePrice: 1.79, discountMultiplier: 0.65, midRangeMultiplier: 1.0, premiumMultiplier: 1.45, category: "grains" },

  // === VEGETABLES ===
  { name: "Tomato", unit: "kg", basePrice: 2.49, discountMultiplier: 0.70, midRangeMultiplier: 1.0, premiumMultiplier: 1.45, category: "vegetables" },
  { name: "Cherry tomatoes", unit: "pack", basePrice: 1.79, discountMultiplier: 0.72, midRangeMultiplier: 1.0, premiumMultiplier: 1.50, category: "vegetables" },
  { name: "Onion", unit: "kg", basePrice: 1.29, discountMultiplier: 0.60, midRangeMultiplier: 1.0, premiumMultiplier: 1.50, category: "vegetables" },
  { name: "Red onion", unit: "kg", basePrice: 1.49, discountMultiplier: 0.65, midRangeMultiplier: 1.0, premiumMultiplier: 1.50, category: "vegetables" },
  { name: "Garlic", unit: "piece", basePrice: 0.49, discountMultiplier: 0.65, midRangeMultiplier: 1.0, premiumMultiplier: 1.55, category: "vegetables" },
  { name: "Bell pepper", unit: "piece", basePrice: 0.99, discountMultiplier: 0.68, midRangeMultiplier: 1.0, premiumMultiplier: 1.45, category: "vegetables" },
  { name: "Broccoli", unit: "piece", basePrice: 1.49, discountMultiplier: 0.70, midRangeMultiplier: 1.0, premiumMultiplier: 1.40, category: "vegetables" },
  { name: "Spinach", unit: "pack", basePrice: 1.29, discountMultiplier: 0.72, midRangeMultiplier: 1.0, premiumMultiplier: 1.50, category: "vegetables" },
  { name: "Romaine lettuce", unit: "piece", basePrice: 0.99, discountMultiplier: 0.70, midRangeMultiplier: 1.0, premiumMultiplier: 1.55, category: "vegetables" },
  { name: "Cucumber", unit: "piece", basePrice: 0.69, discountMultiplier: 0.65, midRangeMultiplier: 1.0, premiumMultiplier: 1.50, category: "vegetables" },
  { name: "Carrot", unit: "kg", basePrice: 1.09, discountMultiplier: 0.60, midRangeMultiplier: 1.0, premiumMultiplier: 1.45, category: "vegetables" },
  { name: "Zucchini", unit: "piece", basePrice: 0.79, discountMultiplier: 0.68, midRangeMultiplier: 1.0, premiumMultiplier: 1.45, category: "vegetables" },
  { name: "Mushrooms", unit: "pack", basePrice: 1.49, discountMultiplier: 0.70, midRangeMultiplier: 1.0, premiumMultiplier: 1.45, category: "vegetables" },
  { name: "Frozen vegetables", unit: "pack", basePrice: 1.69, discountMultiplier: 0.55, midRangeMultiplier: 1.0, premiumMultiplier: 1.40, category: "frozen" },
  { name: "Corn", unit: "can", basePrice: 0.89, discountMultiplier: 0.55, midRangeMultiplier: 1.0, premiumMultiplier: 1.45, category: "canned" },
  { name: "Avocado", unit: "piece", basePrice: 1.29, discountMultiplier: 0.75, midRangeMultiplier: 1.0, premiumMultiplier: 1.40, category: "vegetables" },
  { name: "Kale", unit: "pack", basePrice: 1.79, discountMultiplier: 0.72, midRangeMultiplier: 1.0, premiumMultiplier: 1.45, category: "vegetables" },
  { name: "Cauliflower", unit: "piece", basePrice: 1.99, discountMultiplier: 0.70, midRangeMultiplier: 1.0, premiumMultiplier: 1.40, category: "vegetables" },
  { name: "Cabbage", unit: "piece", basePrice: 1.29, discountMultiplier: 0.60, midRangeMultiplier: 1.0, premiumMultiplier: 1.45, category: "vegetables" },
  { name: "Asparagus", unit: "pack", basePrice: 3.49, discountMultiplier: 0.75, midRangeMultiplier: 1.0, premiumMultiplier: 1.50, category: "vegetables" },
  { name: "Celery", unit: "piece", basePrice: 1.29, discountMultiplier: 0.65, midRangeMultiplier: 1.0, premiumMultiplier: 1.45, category: "vegetables" },
  { name: "Aubergine", unit: "piece", basePrice: 1.49, discountMultiplier: 0.70, midRangeMultiplier: 1.0, premiumMultiplier: 1.40, category: "vegetables" },
  { name: "Courgette", unit: "piece", basePrice: 0.79, discountMultiplier: 0.68, midRangeMultiplier: 1.0, premiumMultiplier: 1.45, category: "vegetables" },

  // === FRUITS ===
  { name: "Banana", unit: "kg", basePrice: 1.39, discountMultiplier: 0.65, midRangeMultiplier: 1.0, premiumMultiplier: 1.40, category: "fruits" },
  { name: "Apple", unit: "kg", basePrice: 2.29, discountMultiplier: 0.68, midRangeMultiplier: 1.0, premiumMultiplier: 1.45, category: "fruits" },
  { name: "Mixed berries", unit: "pack", basePrice: 2.99, discountMultiplier: 0.72, midRangeMultiplier: 1.0, premiumMultiplier: 1.40, bulkSize: 1, bulkUnit: "kg", bulkPrice: 4.49, bulkSavingsPercent: 25, category: "fruits" },
  { name: "Lemon", unit: "piece", basePrice: 0.49, discountMultiplier: 0.65, midRangeMultiplier: 1.0, premiumMultiplier: 1.50, category: "fruits" },
  { name: "Lime", unit: "piece", basePrice: 0.49, discountMultiplier: 0.65, midRangeMultiplier: 1.0, premiumMultiplier: 1.50, category: "fruits" },
  { name: "Blueberry", unit: "pack", basePrice: 2.99, discountMultiplier: 0.72, midRangeMultiplier: 1.0, premiumMultiplier: 1.40, category: "fruits" },
  { name: "Strawberry", unit: "pack", basePrice: 2.49, discountMultiplier: 0.70, midRangeMultiplier: 1.0, premiumMultiplier: 1.45, category: "fruits" },
  { name: "Orange", unit: "kg", basePrice: 1.99, discountMultiplier: 0.65, midRangeMultiplier: 1.0, premiumMultiplier: 1.45, category: "fruits" },
  { name: "Mango", unit: "piece", basePrice: 1.49, discountMultiplier: 0.72, midRangeMultiplier: 1.0, premiumMultiplier: 1.50, category: "fruits" },
  { name: "Peach", unit: "kg", basePrice: 3.49, discountMultiplier: 0.70, midRangeMultiplier: 1.0, premiumMultiplier: 1.45, category: "fruits" },
  { name: "Pear", unit: "kg", basePrice: 2.49, discountMultiplier: 0.68, midRangeMultiplier: 1.0, premiumMultiplier: 1.45, category: "fruits" },
  { name: "Grape", unit: "kg", basePrice: 3.99, discountMultiplier: 0.72, midRangeMultiplier: 1.0, premiumMultiplier: 1.40, category: "fruits" },
  { name: "Fig", unit: "pack", basePrice: 2.99, discountMultiplier: 0.75, midRangeMultiplier: 1.0, premiumMultiplier: 1.50, category: "fruits" },

  // === PANTRY & SPICES ===
  { name: "Olive oil", unit: "litre", basePrice: 7.99, discountMultiplier: 0.70, midRangeMultiplier: 1.0, premiumMultiplier: 1.50, category: "pantry" },
  { name: "Vegetable oil", unit: "litre", basePrice: 2.49, discountMultiplier: 0.60, midRangeMultiplier: 1.0, premiumMultiplier: 1.40, category: "pantry" },
  { name: "Soy sauce", unit: "bottle", basePrice: 1.99, discountMultiplier: 0.65, midRangeMultiplier: 1.0, premiumMultiplier: 1.55, category: "pantry" },
  { name: "Honey", unit: "jar", basePrice: 3.49, discountMultiplier: 0.70, midRangeMultiplier: 1.0, premiumMultiplier: 1.60, category: "pantry" },
  { name: "Peanut butter", unit: "jar", basePrice: 2.49, discountMultiplier: 0.68, midRangeMultiplier: 1.0, premiumMultiplier: 1.55, category: "pantry" },
  { name: "Canned tomatoes", unit: "can", basePrice: 0.79, discountMultiplier: 0.50, midRangeMultiplier: 1.0, premiumMultiplier: 1.55, category: "canned" },
  { name: "Coconut milk", unit: "can", basePrice: 1.49, discountMultiplier: 0.65, midRangeMultiplier: 1.0, premiumMultiplier: 1.45, category: "canned" },
  { name: "Tomato paste", unit: "tube", basePrice: 0.99, discountMultiplier: 0.55, midRangeMultiplier: 1.0, premiumMultiplier: 1.50, category: "pantry" },
  { name: "Caesar dressing", unit: "bottle", basePrice: 2.29, discountMultiplier: 0.70, midRangeMultiplier: 1.0, premiumMultiplier: 1.45, category: "pantry" },
  { name: "Balsamic glaze", unit: "bottle", basePrice: 2.49, discountMultiplier: 0.72, midRangeMultiplier: 1.0, premiumMultiplier: 1.50, category: "pantry" },
  { name: "Chia seeds", unit: "pack", basePrice: 2.99, discountMultiplier: 0.72, midRangeMultiplier: 1.0, premiumMultiplier: 1.35, category: "pantry" },
  { name: "Salt", unit: "pack", basePrice: 0.39, discountMultiplier: 0.55, midRangeMultiplier: 1.0, premiumMultiplier: 1.80, category: "pantry" },
  { name: "Black pepper", unit: "pack", basePrice: 1.29, discountMultiplier: 0.65, midRangeMultiplier: 1.0, premiumMultiplier: 1.55, category: "pantry" },
  { name: "Paprika", unit: "pack", basePrice: 1.49, discountMultiplier: 0.65, midRangeMultiplier: 1.0, premiumMultiplier: 1.50, category: "pantry" },
  { name: "Cumin", unit: "pack", basePrice: 1.49, discountMultiplier: 0.65, midRangeMultiplier: 1.0, premiumMultiplier: 1.50, category: "pantry" },
  { name: "Curry powder", unit: "pack", basePrice: 1.69, discountMultiplier: 0.65, midRangeMultiplier: 1.0, premiumMultiplier: 1.50, category: "pantry" },
  { name: "Chili flakes", unit: "pack", basePrice: 1.29, discountMultiplier: 0.65, midRangeMultiplier: 1.0, premiumMultiplier: 1.50, category: "pantry" },
  { name: "Vinegar", unit: "bottle", basePrice: 1.69, discountMultiplier: 0.60, midRangeMultiplier: 1.0, premiumMultiplier: 1.55, category: "pantry" },
  { name: "Mustard", unit: "jar", basePrice: 1.29, discountMultiplier: 0.65, midRangeMultiplier: 1.0, premiumMultiplier: 1.50, category: "pantry" },
  { name: "Stock", unit: "pack", basePrice: 1.49, discountMultiplier: 0.65, midRangeMultiplier: 1.0, premiumMultiplier: 1.45, category: "pantry" },
  { name: "Broth", unit: "pack", basePrice: 1.49, discountMultiplier: 0.65, midRangeMultiplier: 1.0, premiumMultiplier: 1.45, category: "pantry" },
  { name: "Cinnamon", unit: "pack", basePrice: 1.79, discountMultiplier: 0.65, midRangeMultiplier: 1.0, premiumMultiplier: 1.50, category: "pantry" },
  { name: "Turmeric", unit: "pack", basePrice: 1.99, discountMultiplier: 0.65, midRangeMultiplier: 1.0, premiumMultiplier: 1.50, category: "pantry" },
  { name: "Chili", unit: "pack", basePrice: 1.29, discountMultiplier: 0.65, midRangeMultiplier: 1.0, premiumMultiplier: 1.50, category: "pantry" },
  { name: "Maple syrup", unit: "bottle", basePrice: 4.99, discountMultiplier: 0.72, midRangeMultiplier: 1.0, premiumMultiplier: 1.50, category: "pantry" },
  { name: "Cooking spray", unit: "can", basePrice: 2.49, discountMultiplier: 0.65, midRangeMultiplier: 1.0, premiumMultiplier: 1.40, category: "pantry" },
  { name: "Baking powder", unit: "pack", basePrice: 0.99, discountMultiplier: 0.60, midRangeMultiplier: 1.0, premiumMultiplier: 1.50, category: "pantry" },
  { name: "Vanilla extract", unit: "bottle", basePrice: 2.99, discountMultiplier: 0.72, midRangeMultiplier: 1.0, premiumMultiplier: 1.50, category: "pantry" },
  { name: "Cocoa powder", unit: "pack", basePrice: 2.49, discountMultiplier: 0.68, midRangeMultiplier: 1.0, premiumMultiplier: 1.50, category: "pantry" },
  { name: "Sesame oil", unit: "bottle", basePrice: 3.49, discountMultiplier: 0.72, midRangeMultiplier: 1.0, premiumMultiplier: 1.45, category: "pantry" },
  { name: "Coconut oil", unit: "jar", basePrice: 4.99, discountMultiplier: 0.72, midRangeMultiplier: 1.0, premiumMultiplier: 1.40, category: "pantry" },
  { name: "Mayonnaise", unit: "jar", basePrice: 1.99, discountMultiplier: 0.65, midRangeMultiplier: 1.0, premiumMultiplier: 1.50, category: "pantry" },
  { name: "Ketchup", unit: "bottle", basePrice: 1.79, discountMultiplier: 0.60, midRangeMultiplier: 1.0, premiumMultiplier: 1.55, category: "pantry" },
  { name: "Sriracha", unit: "bottle", basePrice: 2.99, discountMultiplier: 0.72, midRangeMultiplier: 1.0, premiumMultiplier: 1.40, category: "pantry" },
  { name: "Tahini", unit: "jar", basePrice: 3.49, discountMultiplier: 0.75, midRangeMultiplier: 1.0, premiumMultiplier: 1.40, category: "pantry" },
  { name: "Ghee", unit: "jar", basePrice: 4.99, discountMultiplier: 0.72, midRangeMultiplier: 1.0, premiumMultiplier: 1.45, category: "pantry" },
  { name: "Jam", unit: "jar", basePrice: 1.99, discountMultiplier: 0.65, midRangeMultiplier: 1.0, premiumMultiplier: 1.55, category: "pantry" },
  { name: "Pesto", unit: "jar", basePrice: 2.49, discountMultiplier: 0.72, midRangeMultiplier: 1.0, premiumMultiplier: 1.50, category: "pantry" },
  { name: "Salsa", unit: "jar", basePrice: 1.99, discountMultiplier: 0.65, midRangeMultiplier: 1.0, premiumMultiplier: 1.50, category: "pantry" },
  { name: "Hummus", unit: "pack", basePrice: 1.79, discountMultiplier: 0.72, midRangeMultiplier: 1.0, premiumMultiplier: 1.45, category: "pantry" },
  { name: "Protein powder", unit: "pack", basePrice: 19.99, discountMultiplier: 0.80, midRangeMultiplier: 1.0, premiumMultiplier: 1.30, category: "pantry" },
  { name: "Almond milk", unit: "litre", basePrice: 1.99, discountMultiplier: 0.72, midRangeMultiplier: 1.0, premiumMultiplier: 1.45, category: "beverages" },
  { name: "Oat milk", unit: "litre", basePrice: 1.79, discountMultiplier: 0.72, midRangeMultiplier: 1.0, premiumMultiplier: 1.45, category: "beverages" },
  { name: "Coconut water", unit: "litre", basePrice: 2.49, discountMultiplier: 0.72, midRangeMultiplier: 1.0, premiumMultiplier: 1.40, category: "beverages" },

  // === ADDITIONAL COMMON INGREDIENTS ===
  { name: "Cashew", unit: "pack", basePrice: 3.49, discountMultiplier: 0.72, midRangeMultiplier: 1.0, premiumMultiplier: 1.45, category: "pantry" },
  { name: "Almond", unit: "pack", basePrice: 3.29, discountMultiplier: 0.72, midRangeMultiplier: 1.0, premiumMultiplier: 1.45, category: "pantry" },
  { name: "Walnut", unit: "pack", basePrice: 3.99, discountMultiplier: 0.72, midRangeMultiplier: 1.0, premiumMultiplier: 1.40, category: "pantry" },
  { name: "Pistachio", unit: "pack", basePrice: 4.99, discountMultiplier: 0.75, midRangeMultiplier: 1.0, premiumMultiplier: 1.35, category: "pantry" },
  { name: "Dried fruit", unit: "pack", basePrice: 2.49, discountMultiplier: 0.68, midRangeMultiplier: 1.0, premiumMultiplier: 1.45, category: "pantry" },
  { name: "Crackers", unit: "pack", basePrice: 1.49, discountMultiplier: 0.65, midRangeMultiplier: 1.0, premiumMultiplier: 1.50, category: "grains" },
  { name: "Rice cakes", unit: "pack", basePrice: 1.29, discountMultiplier: 0.65, midRangeMultiplier: 1.0, premiumMultiplier: 1.50, category: "grains" },
  { name: "Tortilla", unit: "pack", basePrice: 0.99, discountMultiplier: 0.65, midRangeMultiplier: 1.0, premiumMultiplier: 1.50, category: "grains" },
  { name: "Sour cream", unit: "pack", basePrice: 1.29, discountMultiplier: 0.68, midRangeMultiplier: 1.0, premiumMultiplier: 1.45, category: "dairy" },
  { name: "Ice cream", unit: "pack", basePrice: 3.49, discountMultiplier: 0.72, midRangeMultiplier: 1.0, premiumMultiplier: 1.50, category: "dairy" },
  { name: "Raita", unit: "pack", basePrice: 1.49, discountMultiplier: 0.72, midRangeMultiplier: 1.0, premiumMultiplier: 1.45, category: "dairy" },
  { name: "Whey", unit: "pack", basePrice: 17.99, discountMultiplier: 0.80, midRangeMultiplier: 1.0, premiumMultiplier: 1.30, category: "pantry" },
  { name: "Edamame", unit: "pack", basePrice: 2.49, discountMultiplier: 0.72, midRangeMultiplier: 1.0, premiumMultiplier: 1.40, category: "proteins" },
  { name: "Paneer", unit: "pack", basePrice: 2.99, discountMultiplier: 0.75, midRangeMultiplier: 1.0, premiumMultiplier: 1.40, category: "dairy" },
  { name: "Sea salt flakes", unit: "pack", basePrice: 2.49, discountMultiplier: 0.68, midRangeMultiplier: 1.0, premiumMultiplier: 1.55, category: "pantry" },
  { name: "Ginger", unit: "piece", basePrice: 0.59, discountMultiplier: 0.68, midRangeMultiplier: 1.0, premiumMultiplier: 1.45, category: "vegetables" },
  { name: "Fresh basil", unit: "pack", basePrice: 1.29, discountMultiplier: 0.70, midRangeMultiplier: 1.0, premiumMultiplier: 1.50, category: "vegetables" },
  { name: "Cilantro", unit: "pack", basePrice: 0.99, discountMultiplier: 0.68, midRangeMultiplier: 1.0, premiumMultiplier: 1.50, category: "vegetables" },
  { name: "Green beans", unit: "pack", basePrice: 1.99, discountMultiplier: 0.70, midRangeMultiplier: 1.0, premiumMultiplier: 1.40, category: "vegetables" },
  { name: "Peas", unit: "pack", basePrice: 1.49, discountMultiplier: 0.65, midRangeMultiplier: 1.0, premiumMultiplier: 1.40, category: "vegetables" },
  { name: "Radish", unit: "pack", basePrice: 0.99, discountMultiplier: 0.65, midRangeMultiplier: 1.0, premiumMultiplier: 1.50, category: "vegetables" },
  { name: "Scallion", unit: "pack", basePrice: 0.79, discountMultiplier: 0.68, midRangeMultiplier: 1.0, premiumMultiplier: 1.50, category: "vegetables" },
  { name: "Spring onion", unit: "pack", basePrice: 0.79, discountMultiplier: 0.68, midRangeMultiplier: 1.0, premiumMultiplier: 1.50, category: "vegetables" },
  { name: "Bok choy", unit: "piece", basePrice: 1.49, discountMultiplier: 0.72, midRangeMultiplier: 1.0, premiumMultiplier: 1.45, category: "vegetables" },
  { name: "Sweet corn", unit: "can", basePrice: 0.89, discountMultiplier: 0.55, midRangeMultiplier: 1.0, premiumMultiplier: 1.45, category: "canned" },
  { name: "Kidney beans", unit: "can", basePrice: 0.99, discountMultiplier: 0.55, midRangeMultiplier: 1.0, premiumMultiplier: 1.50, category: "canned" },
  { name: "Black beans", unit: "can", basePrice: 0.99, discountMultiplier: 0.55, midRangeMultiplier: 1.0, premiumMultiplier: 1.50, category: "canned" },
  { name: "Hummus", unit: "pack", basePrice: 1.79, discountMultiplier: 0.72, midRangeMultiplier: 1.0, premiumMultiplier: 1.45, category: "pantry" },
  { name: "Tzatziki", unit: "pack", basePrice: 1.69, discountMultiplier: 0.72, midRangeMultiplier: 1.0, premiumMultiplier: 1.45, category: "dairy" },
  { name: "Guacamole", unit: "pack", basePrice: 2.49, discountMultiplier: 0.72, midRangeMultiplier: 1.0, premiumMultiplier: 1.45, category: "pantry" },
  { name: "Miso paste", unit: "pack", basePrice: 3.49, discountMultiplier: 0.72, midRangeMultiplier: 1.0, premiumMultiplier: 1.45, category: "pantry" },
  { name: "Fish sauce", unit: "bottle", basePrice: 2.29, discountMultiplier: 0.68, midRangeMultiplier: 1.0, premiumMultiplier: 1.45, category: "pantry" },
  { name: "Rice vinegar", unit: "bottle", basePrice: 2.49, discountMultiplier: 0.68, midRangeMultiplier: 1.0, premiumMultiplier: 1.50, category: "pantry" },
  { name: "Worcestershire sauce", unit: "bottle", basePrice: 2.49, discountMultiplier: 0.70, midRangeMultiplier: 1.0, premiumMultiplier: 1.50, category: "pantry" },
  { name: "Hot sauce", unit: "bottle", basePrice: 2.29, discountMultiplier: 0.68, midRangeMultiplier: 1.0, premiumMultiplier: 1.50, category: "pantry" },
  { name: "BBQ sauce", unit: "bottle", basePrice: 2.29, discountMultiplier: 0.68, midRangeMultiplier: 1.0, premiumMultiplier: 1.50, category: "pantry" },
  { name: "Teriyaki sauce", unit: "bottle", basePrice: 2.99, discountMultiplier: 0.68, midRangeMultiplier: 1.0, premiumMultiplier: 1.45, category: "pantry" },
  { name: "Oyster sauce", unit: "bottle", basePrice: 2.79, discountMultiplier: 0.68, midRangeMultiplier: 1.0, premiumMultiplier: 1.45, category: "pantry" },
  { name: "Hoisin sauce", unit: "bottle", basePrice: 2.79, discountMultiplier: 0.68, midRangeMultiplier: 1.0, premiumMultiplier: 1.45, category: "pantry" },
  { name: "Almond butter", unit: "jar", basePrice: 3.99, discountMultiplier: 0.72, midRangeMultiplier: 1.0, premiumMultiplier: 1.45, category: "pantry" },
  { name: "Cashew butter", unit: "jar", basePrice: 4.49, discountMultiplier: 0.72, midRangeMultiplier: 1.0, premiumMultiplier: 1.40, category: "pantry" },
  { name: "Sunflower seeds", unit: "pack", basePrice: 1.49, discountMultiplier: 0.68, midRangeMultiplier: 1.0, premiumMultiplier: 1.50, category: "pantry" },
  { name: "Pumpkin seeds", unit: "pack", basePrice: 2.29, discountMultiplier: 0.68, midRangeMultiplier: 1.0, premiumMultiplier: 1.45, category: "pantry" },
  { name: "Flaxseed", unit: "pack", basePrice: 2.49, discountMultiplier: 0.70, midRangeMultiplier: 1.0, premiumMultiplier: 1.40, category: "pantry" },
  { name: "Sesame seeds", unit: "pack", basePrice: 1.29, discountMultiplier: 0.65, midRangeMultiplier: 1.0, premiumMultiplier: 1.50, category: "pantry" },
  { name: "Dark chocolate", unit: "pack", basePrice: 2.49, discountMultiplier: 0.68, midRangeMultiplier: 1.0, premiumMultiplier: 1.55, category: "pantry" },
  { name: "Raisins", unit: "pack", basePrice: 1.79, discountMultiplier: 0.65, midRangeMultiplier: 1.0, premiumMultiplier: 1.45, category: "fruits" },
  { name: "Dates", unit: "pack", basePrice: 2.49, discountMultiplier: 0.68, midRangeMultiplier: 1.0, premiumMultiplier: 1.45, category: "fruits" },
  { name: "Pineapple", unit: "piece", basePrice: 2.49, discountMultiplier: 0.72, midRangeMultiplier: 1.0, premiumMultiplier: 1.45, category: "fruits" },
  { name: "Watermelon", unit: "kg", basePrice: 1.29, discountMultiplier: 0.65, midRangeMultiplier: 1.0, premiumMultiplier: 1.50, category: "fruits" },
  { name: "Kiwi", unit: "pack", basePrice: 1.99, discountMultiplier: 0.72, midRangeMultiplier: 1.0, premiumMultiplier: 1.40, category: "fruits" },
  { name: "Coconut flakes", unit: "pack", basePrice: 1.99, discountMultiplier: 0.68, midRangeMultiplier: 1.0, premiumMultiplier: 1.45, category: "pantry" },
];

export function findIngredientPrice(ingredientName: string): IngredientPrice {
  const lowerName = ingredientName.toLowerCase().trim();
  for (const price of ingredientPrices) {
    if (lowerName === price.name.toLowerCase()) {
      return price;
    }
  }
  for (const price of ingredientPrices) {
    if (lowerName.includes(price.name.toLowerCase()) || price.name.toLowerCase().includes(lowerName)) {
      return price;
    }
  }
  return estimateMissingPrice(ingredientName);
}

export function estimateMissingPrice(ingredientName: string): IngredientPrice {
  const lower = ingredientName.toLowerCase();
  let category: IngredientPrice["category"] = "pantry";
  if (lower.includes("chicken") || lower.includes("beef") || lower.includes("salmon") || lower.includes("egg") || lower.includes("tofu") || lower.includes("fish") || lower.includes("shrimp") || lower.includes("pork") || lower.includes("lamb")) {
    category = "proteins";
  } else if (lower.includes("milk") || lower.includes("cheese") || lower.includes("yogurt") || lower.includes("butter") || lower.includes("cream")) {
    category = "dairy";
  } else if (lower.includes("rice") || lower.includes("pasta") || lower.includes("bread") || lower.includes("oats") || lower.includes("flour") || lower.includes("noodle")) {
    category = "grains";
  } else if (lower.includes("apple") || lower.includes("banana") || lower.includes("berry") || lower.includes("fruit") || lower.includes("lemon") || lower.includes("orange")) {
    category = "fruits";
  } else if (lower.includes("broccoli") || lower.includes("spinach") || lower.includes("tomato") || lower.includes("onion") || lower.includes("carrot") || lower.includes("pepper")) {
    category = "vegetables";
  }
  return {
    name: ingredientName,
    unit: "pack",
    basePrice: 2.0,
    discountMultiplier: 0.70,
    midRangeMultiplier: 1.0,
    premiumMultiplier: 1.45,
    category,
  };
}
