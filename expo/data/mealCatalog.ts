export interface Meal {
  id: string;
  title: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  ingredients: { name: string; quantity: number; unit: string }[];
  instructions: string;
  dietTags: string[];
  equipment: string[];
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  costEstimate: 'low' | 'medium' | 'high';
  prepTime?: number;
  noCook?: boolean;
}

export const mealCatalog: Meal[] = [
  // ===== BREAKFAST (24 meals) =====
  {
    id: 'b1', title: 'Beef Liver & Eggs', category: 'breakfast',
    calories: 540, protein: 48, carbs: 0, fats: 38,
    ingredients: [{name:'beef liver',quantity:115,unit:'g'},{name:'butter',quantity:15,unit:'g'},{name:'eggs',quantity:3,unit:'pcs'}],
    instructions: 'Sauté liver in butter 2-3 min each side. Fry eggs. Serve together.',
    dietTags: ['carnivore'], equipment: ['stovetop'], skillLevel: 'intermediate', costEstimate: 'medium'
  },
  {
    id: 'b2', title: 'Berry Smoothie Bowl', category: 'breakfast',
    calories: 380, protein: 12, carbs: 48, fats: 18,
    ingredients: [{name:'mixed berries',quantity:150,unit:'g'},{name:'spinach',quantity:30,unit:'g'},{name:'flaxseed',quantity:10,unit:'g'},{name:'almond milk',quantity:150,unit:'ml'},{name:'chia seeds',quantity:10,unit:'g'},{name:'almonds',quantity:15,unit:'g'},{name:'coconut flakes',quantity:10,unit:'g'}],
    instructions: 'Blend berries, spinach, flaxseed, almond milk. Pour into bowl. Top with chia, almonds, coconut.',
    dietTags: ['anti_inflammatory','vegan','gluten_free'], equipment: ['blender'], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 'b3', title: 'Cottage Cheese & Fruit', category: 'breakfast',
    calories: 380, protein: 28, carbs: 18, fats: 22,
    ingredients: [{name:'cottage cheese',quantity:200,unit:'g'},{name:'apple',quantity:0.5,unit:'pcs'},{name:'almonds',quantity:20,unit:'g'}],
    instructions: 'Top cottage cheese with sliced apple and almonds.',
    dietTags: ['low_carb','gluten_free'], equipment: [], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 'b4', title: 'Cottage Cheese & Peaches', category: 'breakfast',
    calories: 360, protein: 30, carbs: 26, fats: 16,
    ingredients: [{name:'low-fat cottage cheese',quantity:200,unit:'g'},{name:'peaches',quantity:1,unit:'pcs'},{name:'cinnamon',quantity:2,unit:'g'},{name:'almonds',quantity:15,unit:'g'}],
    instructions: 'Top cottage cheese with sliced peaches, cinnamon, and almonds.',
    dietTags: ['diabetic','gluten_free','vegetarian'], equipment: [], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 'b5', title: 'Diabetic Greek Yogurt Bowl', category: 'breakfast',
    calories: 380, protein: 28, carbs: 24, fats: 20,
    ingredients: [{name:'plain Greek yogurt',quantity:200,unit:'g'},{name:'chia seeds',quantity:10,unit:'g'},{name:'walnuts',quantity:20,unit:'g'},{name:'fresh berries',quantity:80,unit:'g'}],
    instructions: 'Top yogurt with chia seeds, walnuts, and berries. No added sugar.',
    dietTags: ['diabetic','gluten_free','vegetarian'], equipment: [], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 'b6', title: 'Diabetic Veggie Omelet', category: 'breakfast',
    calories: 420, protein: 30, carbs: 28, fats: 20,
    ingredients: [{name:'eggs',quantity:2,unit:'pcs'},{name:'spinach',quantity:50,unit:'g'},{name:'tomatoes',quantity:1,unit:'pcs'},{name:'mushrooms',quantity:50,unit:'g'},{name:'whole grain toast',quantity:1,unit:'slice'},{name:'berries',quantity:50,unit:'g'}],
    instructions: 'Make omelet with spinach, tomatoes, mushrooms. Serve with toast and berries.',
    dietTags: ['diabetic','gluten_free','vegetarian'], equipment: ['stovetop'], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 'b7', title: 'Egg & Oat Power Bowl', category: 'breakfast',
    calories: 720, protein: 42, carbs: 72, fats: 28,
    ingredients: [{name:'eggs',quantity:4,unit:'pcs'},{name:'oatmeal',quantity:80,unit:'g'},{name:'banana',quantity:1,unit:'pcs'},{name:'honey',quantity:15,unit:'ml'},{name:'whole milk',quantity:200,unit:'ml'}],
    instructions: 'Cook oats with milk. Scramble eggs. Serve together with sliced banana and honey drizzle.',
    dietTags: ['muscle_gain','bulking'], equipment: ['stovetop'], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 'b8', title: 'Egg & Toast Stack', category: 'breakfast',
    calories: 720, protein: 40, carbs: 66, fats: 32,
    ingredients: [{name:'eggs',quantity:4,unit:'pcs'},{name:'cheese',quantity:40,unit:'g'},{name:'whole grain toast',quantity:3,unit:'slices'},{name:'orange juice',quantity:200,unit:'ml'}],
    instructions: 'Scramble eggs with cheese. Stack on toast slices. Serve with orange juice.',
    dietTags: ['bulking'], equipment: ['stovetop'], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 'b9', title: 'Eggs & Avocado', category: 'breakfast',
    calories: 420, protein: 18, carbs: 12, fats: 34,
    ingredients: [{name:'eggs',quantity:2,unit:'pcs'},{name:'avocado',quantity:0.5,unit:'pcs'},{name:'tomato',quantity:1,unit:'pcs'}],
    instructions: 'Fry or scramble eggs. Slice avocado and tomato. Serve together.',
    dietTags: ['low_carb','keto','gluten_free','paleo'], equipment: ['stovetop'], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 'b10', title: 'Eggs & Bacon', category: 'breakfast',
    calories: 620, protein: 42, carbs: 0, fats: 48,
    ingredients: [{name:'eggs',quantity:4,unit:'pcs'},{name:'bacon',quantity:4,unit:'strips'},{name:'butter',quantity:10,unit:'g'}],
    instructions: 'Scramble eggs in butter. Fry bacon until crispy. Serve together.',
    dietTags: ['carnivore','keto'], equipment: ['stovetop'], skillLevel: 'beginner', costEstimate: 'medium'
  },
  {
    id: 'b11', title: 'Eggs & Potatoes', category: 'breakfast',
    calories: 440, protein: 22, carbs: 42, fats: 20,
    ingredients: [{name:'eggs',quantity:2,unit:'pcs'},{name:'potatoes',quantity:200,unit:'g'},{name:'tomato',quantity:1,unit:'pcs'}],
    instructions: 'Sauté diced potatoes until golden. Fry eggs. Serve with sliced tomato.',
    dietTags: ['gluten_free','vegetarian'], equipment: ['stovetop'], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 'b12', title: 'Greek Yogurt Parfait', category: 'breakfast',
    calories: 420, protein: 26, carbs: 48, fats: 14,
    ingredients: [{name:'low-fat Greek yogurt',quantity:200,unit:'g'},{name:'berries',quantity:100,unit:'g'},{name:'almonds',quantity:20,unit:'g'},{name:'honey',quantity:10,unit:'ml'}],
    instructions: 'Layer yogurt with berries and almonds. Drizzle with honey.',
    dietTags: ['dash','gluten_free','vegetarian'], equipment: [], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 'b13', title: 'Oatmeal Bowl', category: 'breakfast',
    calories: 480, protein: 18, carbs: 68, fats: 16,
    ingredients: [{name:'steel-cut oatmeal',quantity:80,unit:'g'},{name:'banana',quantity:1,unit:'pcs'},{name:'walnuts',quantity:20,unit:'g'},{name:'cinnamon',quantity:2,unit:'g'},{name:'low-fat milk',quantity:150,unit:'ml'}],
    instructions: 'Cook oats with milk. Top with sliced banana, walnuts, and cinnamon.',
    dietTags: ['dash','balanced','vegetarian'], equipment: ['stovetop','microwave'], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 'b14', title: 'Protein Oatmeal', category: 'breakfast',
    calories: 480, protein: 24, carbs: 62, fats: 16,
    ingredients: [{name:'oats',quantity:80,unit:'g'},{name:'milk or skyr',quantity:150,unit:'g'},{name:'berries',quantity:80,unit:'g'},{name:'walnuts',quantity:20,unit:'g'}],
    instructions: 'Cook oats with milk. Stir in skyr. Top with berries and walnuts.',
    dietTags: ['balanced','vegetarian','muscle_gain'], equipment: ['stovetop','microwave'], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 'b15', title: 'Protein Oats & Eggs', category: 'breakfast',
    calories: 780, protein: 50, carbs: 78, fats: 30,
    ingredients: [{name:'oatmeal',quantity:80,unit:'g'},{name:'protein powder',quantity:30,unit:'g'},{name:'banana',quantity:1,unit:'pcs'},{name:'peanut butter',quantity:20,unit:'g'},{name:'eggs',quantity:3,unit:'pcs'}],
    instructions: 'Cook oats with protein powder and banana. Scramble eggs. Stir in peanut butter.',
    dietTags: ['bulking','muscle_gain'], equipment: ['stovetop'], skillLevel: 'beginner', costEstimate: 'medium'
  },
  {
    id: 'b16', title: 'Protein Pancakes', category: 'breakfast',
    calories: 640, protein: 46, carbs: 68, fats: 16,
    ingredients: [{name:'oats',quantity:60,unit:'g'},{name:'egg whites',quantity:4,unit:'pcs'},{name:'whey protein',quantity:30,unit:'g'},{name:'berries',quantity:80,unit:'g'},{name:'Greek yogurt',quantity:100,unit:'g'}],
    instructions: 'Blend oats, egg whites, whey. Cook as pancakes. Top with berries and yogurt.',
    dietTags: ['muscle_gain','balanced'], equipment: ['stovetop','blender'], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 'b17', title: 'Skyr & Berries', category: 'breakfast',
    calories: 380, protein: 32, carbs: 22, fats: 20,
    ingredients: [{name:'skyr or Greek yogurt',quantity:200,unit:'g'},{name:'mixed berries',quantity:100,unit:'g'},{name:'walnuts',quantity:30,unit:'g'}],
    instructions: 'Top yogurt with berries and walnuts. Serve cold.',
    dietTags: ['low_carb','gluten_free'], equipment: [], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 'b18', title: 'Smoothie & Toast', category: 'breakfast',
    calories: 760, protein: 42, carbs: 88, fats: 26,
    ingredients: [{name:'whey protein',quantity:30,unit:'g'},{name:'banana',quantity:1,unit:'pcs'},{name:'oats',quantity:40,unit:'g'},{name:'milk',quantity:250,unit:'ml'},{name:'peanut butter',quantity:15,unit:'g'},{name:'whole grain toast',quantity:2,unit:'slices'},{name:'jam',quantity:20,unit:'g'}],
    instructions: 'Blend protein, banana, oats, milk, PB into smoothie. Toast bread and add jam.',
    dietTags: ['bulking','muscle_gain'], equipment: ['blender'], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 'b19', title: 'Steak & Eggs', category: 'breakfast',
    calories: 680, protein: 56, carbs: 0, fats: 50,
    ingredients: [{name:'sirloin steak',quantity:170,unit:'g'},{name:'eggs',quantity:3,unit:'pcs'},{name:'beef tallow',quantity:15,unit:'g'}],
    instructions: 'Sear steak. Fry eggs in beef tallow. Serve together.',
    dietTags: ['carnivore','keto','paleo'], equipment: ['stovetop'], skillLevel: 'intermediate', costEstimate: 'high'
  },
  {
    id: 'b20', title: 'Turmeric Oat Bowl', category: 'breakfast',
    calories: 420, protein: 14, carbs: 58, fats: 16,
    ingredients: [{name:'rolled oats',quantity:80,unit:'g'},{name:'turmeric',quantity:3,unit:'g'},{name:'cinnamon',quantity:2,unit:'g'},{name:'blueberries',quantity:80,unit:'g'},{name:'walnuts',quantity:20,unit:'g'},{name:'honey',quantity:10,unit:'ml'}],
    instructions: 'Cook oats with turmeric and cinnamon. Top with blueberries, walnuts, and honey.',
    dietTags: ['anti_inflammatory','vegetarian'], equipment: ['stovetop','microwave'], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 'b21', title: 'Veggie Egg White Omelet', category: 'breakfast',
    calories: 380, protein: 28, carbs: 36, fats: 12,
    ingredients: [{name:'egg whites',quantity:4,unit:'pcs'},{name:'spinach',quantity:50,unit:'g'},{name:'tomatoes',quantity:1,unit:'pcs'},{name:'bell peppers',quantity:0.5,unit:'pcs'},{name:'whole grain toast',quantity:1,unit:'slice'}],
    instructions: 'Whisk egg whites. Pour into pan, add veggies. Fold and serve with toast.',
    dietTags: ['dash','low_carb','gluten_free'], equipment: ['stovetop'], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 'b22', title: 'Walnut & Fig Overnight Oats', category: 'breakfast',
    calories: 440, protein: 14, carbs: 56, fats: 20,
    ingredients: [{name:'rolled oats',quantity:80,unit:'g'},{name:'almond milk',quantity:200,unit:'ml'},{name:'walnuts',quantity:25,unit:'g'},{name:'dried figs',quantity:30,unit:'g'},{name:'cinnamon',quantity:2,unit:'g'},{name:'flaxseed',quantity:10,unit:'g'}],
    instructions: 'Mix oats, almond milk, cinnamon, flaxseed. Refrigerate overnight. Top with walnuts and figs.',
    dietTags: ['anti_inflammatory','vegan'], equipment: [], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 'b23', title: 'Oats & Milk', category: 'breakfast',
    calories: 480, protein: 24, carbs: 62, fats: 16,
    ingredients: [{name:'rolled oats',quantity:80,unit:'g'},{name:'milk',quantity:200,unit:'ml'},{name:'berries',quantity:80,unit:'g'},{name:'almonds',quantity:20,unit:'g'}],
    instructions: 'Cook oats with milk. Top with berries and almonds.',
    dietTags: ['balanced','vegetarian'], equipment: ['stovetop','microwave'], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 'b24', title: 'Yogurt Bowl', category: 'breakfast',
    calories: 450, protein: 28, carbs: 52, fats: 16,
    ingredients: [{name:'Greek yogurt',quantity:200,unit:'g'},{name:'berries',quantity:100,unit:'g'},{name:'banana',quantity:1,unit:'pcs'},{name:'walnuts',quantity:20,unit:'g'}],
    instructions: 'Layer yogurt with sliced banana, berries, and walnuts.',
    dietTags: ['gluten_free','balanced','vegetarian'], equipment: [], skillLevel: 'beginner', costEstimate: 'low'
  },

  // ===== LUNCH (22 meals) =====
  {
    id: 'l1', title: 'Beef & Quinoa Bowl', category: 'lunch',
    calories: 760, protein: 52, carbs: 72, fats: 28,
    ingredients: [{name:'lean ground beef',quantity:170,unit:'g'},{name:'quinoa',quantity:80,unit:'g'},{name:'black beans',quantity:80,unit:'g'},{name:'corn',quantity:50,unit:'g'},{name:'avocado',quantity:0.5,unit:'pcs'}],
    instructions: 'Brown beef. Cook quinoa. Assemble bowl with beans, corn, sliced avocado.',
    dietTags: ['muscle_gain','gluten_free'], equipment: ['stovetop'], skillLevel: 'intermediate', costEstimate: 'medium'
  },
  {
    id: 'l2', title: 'Beef Patties', category: 'lunch',
    calories: 680, protein: 54, carbs: 0, fats: 50,
    ingredients: [{name:'ground beef 80/20',quantity:250,unit:'g'},{name:'salt',quantity:2,unit:'g'},{name:'cheese',quantity:30,unit:'g'}],
    instructions: 'Form beef into patties. Pan fry 4-5 min each side. Top with cheese if desired.',
    dietTags: ['carnivore','keto','gluten_free'], equipment: ['stovetop'], skillLevel: 'beginner', costEstimate: 'medium'
  },
  {
    id: 'l3', title: 'Beef Salad', category: 'lunch',
    calories: 560, protein: 44, carbs: 14, fats: 38,
    ingredients: [{name:'lean beef strips',quantity:150,unit:'g'},{name:'mixed greens',quantity:100,unit:'g'},{name:'tomatoes',quantity:1,unit:'pcs'},{name:'olive oil',quantity:15,unit:'ml'}],
    instructions: 'Sear beef strips. Toss with greens, tomatoes, olive oil dressing.',
    dietTags: ['low_carb','gluten_free','paleo'], equipment: ['stovetop'], skillLevel: 'intermediate', costEstimate: 'medium'
  },
  {
    id: 'l4', title: 'Bone Broth & Pork Belly', category: 'lunch',
    calories: 720, protein: 38, carbs: 0, fats: 62,
    ingredients: [{name:'bone broth',quantity:250,unit:'ml'},{name:'pork belly',quantity:170,unit:'g'}],
    instructions: 'Roast pork belly until crispy. Warm bone broth. Serve together.',
    dietTags: ['carnivore','keto'], equipment: ['oven','stovetop'], skillLevel: 'intermediate', costEstimate: 'medium'
  },
  {
    id: 'l5', title: 'Chicken & Rice Plate', category: 'lunch',
    calories: 680, protein: 50, carbs: 78, fats: 14,
    ingredients: [{name:'chicken breast',quantity:170,unit:'g'},{name:'jasmine rice',quantity:150,unit:'g'},{name:'mixed vegetables',quantity:100,unit:'g'},{name:'teriyaki sauce',quantity:20,unit:'ml'}],
    instructions: 'Grill chicken. Cook rice. Steam vegetables. Drizzle with teriyaki.',
    dietTags: ['muscle_gain','balanced','gluten_free'], equipment: ['stovetop','oven'], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 'l6', title: 'Chicken Burrito Bowl', category: 'lunch',
    calories: 900, protein: 58, carbs: 88, fats: 34,
    ingredients: [{name:'chicken breast',quantity:230,unit:'g'},{name:'rice',quantity:150,unit:'g'},{name:'black beans',quantity:80,unit:'g'},{name:'corn',quantity:50,unit:'g'},{name:'salsa',quantity:30,unit:'g'},{name:'cheese',quantity:30,unit:'g'},{name:'guacamole',quantity:40,unit:'g'}],
    instructions: 'Cook chicken and rice. Assemble bowl with beans, corn, salsa, cheese, guacamole.',
    dietTags: ['bulking','muscle_gain'], equipment: ['stovetop'], skillLevel: 'intermediate', costEstimate: 'medium'
  },
  {
    id: 'l7', title: 'Chicken Grain Bowl', category: 'lunch',
    calories: 620, protein: 48, carbs: 58, fats: 22,
    ingredients: [{name:'chicken breast',quantity:150,unit:'g'},{name:'quinoa',quantity:80,unit:'g'},{name:'cucumber',quantity:0.5,unit:'pcs'},{name:'tomatoes',quantity:1,unit:'pcs'},{name:'olive oil',quantity:15,unit:'ml'},{name:'lemon juice',quantity:15,unit:'ml'}],
    instructions: 'Grill chicken. Cook quinoa. Dice cucumber and tomatoes. Assemble with olive oil and lemon.',
    dietTags: ['balanced','gluten_free'], equipment: ['stovetop'], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 'l8', title: 'Chickpea Mediterranean Bowl', category: 'lunch',
    calories: 580, protein: 22, carbs: 64, fats: 26,
    ingredients: [{name:'chickpeas',quantity:150,unit:'g'},{name:'cucumber',quantity:0.5,unit:'pcs'},{name:'tomatoes',quantity:1,unit:'pcs'},{name:'olives',quantity:30,unit:'g'},{name:'feta cheese',quantity:40,unit:'g'},{name:'olive oil',quantity:15,unit:'ml'},{name:'lemon juice',quantity:15,unit:'ml'}],
    instructions: 'Combine chickpeas, diced cucumber, tomatoes, olives, crumbled feta. Dress with olive oil and lemon.',
    dietTags: ['dash','vegetarian','mediterranean'], equipment: [], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 'l9', title: 'Double Chicken Rice & Broccoli', category: 'lunch',
    calories: 820, protein: 62, carbs: 92, fats: 18,
    ingredients: [{name:'chicken breast',quantity:230,unit:'g'},{name:'jasmine rice',quantity:200,unit:'g'},{name:'broccoli',quantity:200,unit:'g'},{name:'soy-garlic sauce',quantity:20,unit:'ml'}],
    instructions: 'Grill double portion chicken. Cook rice. Steam broccoli. Drizzle with sauce.',
    dietTags: ['bulking','muscle_gain','gluten_free'], equipment: ['stovetop','oven'], skillLevel: 'beginner', costEstimate: 'medium'
  },
  {
    id: 'l10', title: 'Grilled Chicken Salad', category: 'lunch',
    calories: 520, protein: 42, carbs: 12, fats: 34,
    ingredients: [{name:'chicken breast',quantity:150,unit:'g'},{name:'mixed greens',quantity:100,unit:'g'},{name:'cucumber',quantity:0.5,unit:'pcs'},{name:'olive oil',quantity:20,unit:'ml'},{name:'lemon juice',quantity:15,unit:'ml'}],
    instructions: 'Grill chicken. Toss greens with cucumber, olive oil and lemon dressing.',
    dietTags: ['balanced','low_carb','gluten_free','dash'], equipment: ['stovetop'], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 'l11', title: 'Grilled Mackerel & Kale', category: 'lunch',
    calories: 520, protein: 34, carbs: 28, fats: 32,
    ingredients: [{name:'mackerel fillet',quantity:150,unit:'g'},{name:'kale',quantity:100,unit:'g'},{name:'roasted beets',quantity:80,unit:'g'},{name:'pumpkin seeds',quantity:15,unit:'g'}],
    instructions: 'Grill mackerel. Massage kale with olive oil. Serve with roasted beets and pumpkin seeds.',
    dietTags: ['anti_inflammatory','gluten_free','pescatarian'], equipment: ['stovetop','oven'], skillLevel: 'intermediate', costEstimate: 'medium'
  },
  {
    id: 'l12', title: 'Halloumi Salad', category: 'lunch',
    calories: 560, protein: 32, carbs: 28, fats: 38,
    ingredients: [{name:'halloumi',quantity:100,unit:'g'},{name:'mixed greens',quantity:100,unit:'g'},{name:'cucumber',quantity:0.5,unit:'pcs'},{name:'tomatoes',quantity:1,unit:'pcs'},{name:'olive oil',quantity:15,unit:'ml'}],
    instructions: 'Pan-fry halloumi slices. Toss with greens, cucumber, tomatoes, olive oil.',
    dietTags: ['vegetarian','gluten_free','low_carb'], equipment: ['stovetop'], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 'l13', title: 'Lentil Salad', category: 'lunch',
    calories: 580, protein: 26, carbs: 62, fats: 24,
    ingredients: [{name:'cooked lentils',quantity:200,unit:'g'},{name:'arugula',quantity:60,unit:'g'},{name:'feta',quantity:40,unit:'g'},{name:'olives',quantity:30,unit:'g'},{name:'olive oil',quantity:15,unit:'ml'}],
    instructions: 'Combine lentils, arugula, crumbled feta, olives. Dress with olive oil and lemon.',
    dietTags: ['vegetarian','vegan','gluten_free'], equipment: [], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 'l14', title: 'Mediterranean Sardine Bowl', category: 'lunch',
    calories: 520, protein: 32, carbs: 42, fats: 26,
    ingredients: [{name:'sardines',quantity:120,unit:'g'},{name:'quinoa',quantity:80,unit:'g'},{name:'roasted red peppers',quantity:60,unit:'g'},{name:'olives',quantity:30,unit:'g'},{name:'cucumber',quantity:0.5,unit:'pcs'}],
    instructions: 'Cook quinoa. Arrange sardines over quinoa with peppers, olives, cucumber. Drizzle olive oil and lemon.',
    dietTags: ['anti_inflammatory','gluten_free','pescatarian'], equipment: ['stovetop'], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 'l15', title: 'Quinoa Chickpea Bowl', category: 'lunch',
    calories: 640, protein: 28, carbs: 82, fats: 22,
    ingredients: [{name:'quinoa',quantity:80,unit:'g'},{name:'chickpeas',quantity:150,unit:'g'},{name:'cucumber',quantity:0.5,unit:'pcs'},{name:'tomatoes',quantity:1,unit:'pcs'},{name:'feta',quantity:40,unit:'g'},{name:'olive oil',quantity:15,unit:'ml'}],
    instructions: 'Cook quinoa. Combine with chickpeas, diced cucumber, tomatoes, feta. Dress with olive oil.',
    dietTags: ['vegetarian','vegan','gluten_free','mediterranean'], equipment: ['stovetop'], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 'l16', title: 'Salmon Fillet', category: 'lunch',
    calories: 580, protein: 52, carbs: 0, fats: 40,
    ingredients: [{name:'wild salmon fillet',quantity:230,unit:'g'},{name:'butter',quantity:15,unit:'g'}],
    instructions: 'Pan-fry salmon in butter 4-5 min each side. Season with salt.',
    dietTags: ['carnivore','keto','pescatarian','gluten_free'], equipment: ['stovetop'], skillLevel: 'intermediate', costEstimate: 'high'
  },
  {
    id: 'l17', title: 'Tuna & Quinoa', category: 'lunch',
    calories: 560, protein: 42, carbs: 56, fats: 18,
    ingredients: [{name:'tuna',quantity:150,unit:'g'},{name:'quinoa',quantity:80,unit:'g'},{name:'cucumber',quantity:0.5,unit:'pcs'},{name:'olive oil',quantity:15,unit:'ml'},{name:'lemon juice',quantity:15,unit:'ml'}],
    instructions: 'Cook quinoa. Flake tuna over quinoa. Add diced cucumber, dress with olive oil and lemon.',
    dietTags: ['gluten_free','pescatarian','balanced'], equipment: ['stovetop'], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 'l18', title: 'Tuna Stuffed Avocado', category: 'lunch',
    calories: 520, protein: 36, carbs: 30, fats: 28,
    ingredients: [{name:'tuna',quantity:120,unit:'g'},{name:'avocado',quantity:1,unit:'pcs'},{name:'mixed vegetables',quantity:80,unit:'g'},{name:'whole grain crackers',quantity:30,unit:'g'}],
    instructions: 'Mix tuna with light mayo. Scoop into avocado halves. Serve with veggies and crackers.',
    dietTags: ['diabetic','gluten_free','pescatarian','low_carb'], equipment: [], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 'l19', title: 'Turkey & Veggie Wrap', category: 'lunch',
    calories: 560, protein: 36, carbs: 52, fats: 22,
    ingredients: [{name:'whole wheat wrap',quantity:1,unit:'pcs'},{name:'sliced turkey',quantity:120,unit:'g'},{name:'spinach',quantity:30,unit:'g'},{name:'tomato',quantity:1,unit:'pcs'},{name:'avocado',quantity:0.5,unit:'pcs'},{name:'mustard',quantity:10,unit:'g'}],
    instructions: 'Layer turkey, spinach, tomato, avocado on wrap. Add mustard. Roll tightly.',
    dietTags: ['dash','balanced'], equipment: [], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 'l20', title: 'Turkey Bowl', category: 'lunch',
    calories: 520, protein: 46, carbs: 16, fats: 30,
    ingredients: [{name:'turkey mince',quantity:200,unit:'g'},{name:'cauliflower rice',quantity:150,unit:'g'},{name:'bell peppers',quantity:1,unit:'pcs'}],
    instructions: 'Brown turkey mince. Sauté cauliflower rice and diced peppers. Combine and serve.',
    dietTags: ['low_carb','gluten_free'], equipment: ['stovetop'], skillLevel: 'intermediate', costEstimate: 'medium'
  },
  {
    id: 'l21', title: 'Turkey Lettuce Wraps', category: 'lunch',
    calories: 480, protein: 38, carbs: 22, fats: 26,
    ingredients: [{name:'lean turkey',quantity:150,unit:'g'},{name:'lettuce leaves',quantity:4,unit:'pcs'},{name:'avocado',quantity:0.5,unit:'pcs'},{name:'tomatoes',quantity:1,unit:'pcs'},{name:'hummus',quantity:30,unit:'g'},{name:'carrot sticks',quantity:50,unit:'g'}],
    instructions: 'Cook turkey. Spoon into lettuce cups. Top with avocado, tomato, hummus. Serve with carrot sticks.',
    dietTags: ['diabetic','low_carb','gluten_free'], equipment: ['stovetop'], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 'l22', title: 'Wild Salmon Salad', category: 'lunch',
    calories: 560, protein: 38, carbs: 18, fats: 38,
    ingredients: [{name:'wild salmon',quantity:150,unit:'g'},{name:'baby spinach',quantity:80,unit:'g'},{name:'cherry tomatoes',quantity:80,unit:'g'},{name:'avocado',quantity:0.5,unit:'pcs'},{name:'red onion',quantity:30,unit:'g'},{name:'olive oil',quantity:15,unit:'ml'}],
    instructions: 'Pan-sear salmon. Toss spinach, tomatoes, avocado, onion. Place salmon on top. Drizzle olive oil.',
    dietTags: ['anti_inflammatory','gluten_free','pescatarian'], equipment: ['stovetop'], skillLevel: 'intermediate', costEstimate: 'medium'
  },

  // ===== DINNER (25 meals) =====
  {
    id: 'd1', title: 'Baked Salmon & Quinoa', category: 'dinner',
    calories: 680, protein: 44, carbs: 62, fats: 24,
    ingredients: [{name:'salmon fillet',quantity:170,unit:'g'},{name:'quinoa',quantity:80,unit:'g'},{name:'broccoli',quantity:100,unit:'g'},{name:'carrots',quantity:80,unit:'g'}],
    instructions: 'Bake salmon with herbs at 200°C for 15 min. Cook quinoa. Steam broccoli and carrots. Serve together.',
    dietTags: ['dash','gluten_free','pescatarian','anti_inflammatory'], equipment: ['oven','stovetop'], skillLevel: 'intermediate', costEstimate: 'medium'
  },
  {
    id: 'd2', title: 'Beef Stir-Fry', category: 'dinner',
    calories: 760, protein: 48, carbs: 68, fats: 32,
    ingredients: [{name:'lean ground beef',quantity:200,unit:'g'},{name:'sweet potato',quantity:200,unit:'g'},{name:'bell peppers',quantity:1,unit:'pcs'},{name:'onions',quantity:0.5,unit:'pcs'},{name:'avocado',quantity:0.5,unit:'pcs'}],
    instructions: 'Brown beef. Roast sweet potato. Sauté peppers and onions. Assemble with sliced avocado.',
    dietTags: ['bulking','gluten_free'], equipment: ['stovetop','oven'], skillLevel: 'intermediate', costEstimate: 'medium'
  },
  {
    id: 'd3', title: 'Chicken & Rice', category: 'dinner',
    calories: 640, protein: 52, carbs: 62, fats: 20,
    ingredients: [{name:'chicken breast',quantity:170,unit:'g'},{name:'basmati rice',quantity:150,unit:'g'},{name:'broccoli',quantity:150,unit:'g'},{name:'yogurt-garlic sauce',quantity:30,unit:'g'}],
    instructions: 'Grill chicken. Cook rice. Steam broccoli. Serve with yogurt-garlic sauce.',
    dietTags: ['balanced','gluten_free'], equipment: ['stovetop','oven'], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 'd4', title: 'Chicken & Vegetable Tray', category: 'dinner',
    calories: 580, protein: 52, carbs: 18, fats: 34,
    ingredients: [{name:'chicken thighs',quantity:200,unit:'g'},{name:'broccoli',quantity:100,unit:'g'},{name:'bell peppers',quantity:1,unit:'pcs'},{name:'onions',quantity:0.5,unit:'pcs'},{name:'olive oil',quantity:15,unit:'ml'}],
    instructions: 'Place chicken and veggies on tray. Drizzle olive oil, season. Bake at 200°C for 30 min.',
    dietTags: ['low_carb','gluten_free','paleo'], equipment: ['oven'], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 'd5', title: 'Chuck Roast', category: 'dinner',
    calories: 880, protein: 72, carbs: 0, fats: 64,
    ingredients: [{name:'beef chuck roast',quantity:300,unit:'g'},{name:'bone marrow',quantity:50,unit:'g'}],
    instructions: 'Slow cook chuck roast at 160°C for 3-4 hours. Serve with bone marrow.',
    dietTags: ['carnivore','paleo'], equipment: ['oven'], skillLevel: 'intermediate', costEstimate: 'medium'
  },
  {
    id: 'd6', title: 'Cod & Brown Rice', category: 'dinner',
    calories: 620, protein: 44, carbs: 66, fats: 18,
    ingredients: [{name:'cod fillet',quantity:170,unit:'g'},{name:'brown rice',quantity:150,unit:'g'},{name:'broccoli',quantity:150,unit:'g'},{name:'lemon-butter sauce',quantity:20,unit:'ml'}],
    instructions: 'Pan-sear cod. Cook brown rice. Steam broccoli. Drizzle with lemon-butter sauce.',
    dietTags: ['muscle_gain','gluten_free','pescatarian'], equipment: ['stovetop','oven'], skillLevel: 'intermediate', costEstimate: 'medium'
  },
  {
    id: 'd7', title: 'Diabetic Chicken Stir-Fry', category: 'dinner',
    calories: 560, protein: 44, carbs: 48, fats: 18,
    ingredients: [{name:'chicken breast',quantity:170,unit:'g'},{name:'bell peppers',quantity:1,unit:'pcs'},{name:'snap peas',quantity:80,unit:'g'},{name:'broccoli',quantity:100,unit:'g'},{name:'brown rice',quantity:80,unit:'g'}],
    instructions: 'Stir-fry chicken with peppers, snap peas, broccoli. Serve over brown rice.',
    dietTags: ['diabetic','gluten_free'], equipment: ['stovetop'], skillLevel: 'intermediate', costEstimate: 'medium'
  },
  {
    id: 'd8', title: 'Diabetic Lentil Soup', category: 'dinner',
    calories: 520, protein: 26, carbs: 58, fats: 18,
    ingredients: [{name:'lentils',quantity:150,unit:'g'},{name:'carrots',quantity:80,unit:'g'},{name:'celery',quantity:50,unit:'g'},{name:'tomatoes',quantity:1,unit:'pcs'},{name:'olive oil',quantity:15,unit:'ml'},{name:'green salad',quantity:80,unit:'g'}],
    instructions: 'Simmer lentils with diced carrots, celery, tomatoes. Serve with green salad dressed in olive oil.',
    dietTags: ['diabetic','vegetarian','dash'], equipment: ['stovetop'], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 'd9', title: 'Ginger Chicken & Sweet Potato', category: 'dinner',
    calories: 580, protein: 40, carbs: 52, fats: 22,
    ingredients: [{name:'chicken thighs',quantity:200,unit:'g'},{name:'sweet potato',quantity:200,unit:'g'},{name:'broccoli',quantity:100,unit:'g'},{name:'ginger',quantity:10,unit:'g'},{name:'turmeric',quantity:3,unit:'g'}],
    instructions: 'Marinate chicken in ginger and turmeric. Roast with sweet potato at 200°C for 25 min. Steam broccoli.',
    dietTags: ['anti_inflammatory','gluten_free'], equipment: ['oven'], skillLevel: 'intermediate', costEstimate: 'medium'
  },
  {
    id: 'd10', title: 'Grilled Cod & Sweet Potato', category: 'dinner',
    calories: 620, protein: 40, carbs: 72, fats: 18,
    ingredients: [{name:'cod fillet',quantity:170,unit:'g'},{name:'sweet potato',quantity:200,unit:'g'},{name:'green beans',quantity:100,unit:'g'},{name:'garlic',quantity:5,unit:'g'}],
    instructions: 'Grill cod with herbs. Bake sweet potato. Steam green beans with garlic.',
    dietTags: ['dash','gluten_free','pescatarian'], equipment: ['oven','stovetop'], skillLevel: 'intermediate', costEstimate: 'medium'
  },
  {
    id: 'd11', title: 'Herb-Crusted Salmon & Asparagus', category: 'dinner',
    calories: 560, protein: 42, carbs: 40, fats: 24,
    ingredients: [{name:'salmon fillet',quantity:170,unit:'g'},{name:'fresh dill',quantity:5,unit:'g'},{name:'lemon',quantity:0.5,unit:'pcs'},{name:'asparagus',quantity:150,unit:'g'},{name:'sweet potato',quantity:150,unit:'g'}],
    instructions: 'Crust salmon with dill and lemon. Bake at 200°C for 15 min. Roast asparagus and sweet potato alongside.',
    dietTags: ['anti_inflammatory','gluten_free','pescatarian'], equipment: ['oven'], skillLevel: 'intermediate', costEstimate: 'medium'
  },
  {
    id: 'd12', title: 'Lamb Chops', category: 'dinner',
    calories: 820, protein: 64, carbs: 0, fats: 62,
    ingredients: [{name:'lamb loin chops',quantity:4,unit:'pcs'},{name:'ghee',quantity:15,unit:'g'},{name:'salt',quantity:2,unit:'g'}],
    instructions: 'Sear lamb chops in ghee 3-4 min each side. Season with salt. Rest 5 min.',
    dietTags: ['carnivore','keto','paleo','gluten_free'], equipment: ['stovetop'], skillLevel: 'intermediate', costEstimate: 'high'
  },
  {
    id: 'd13', title: 'Lentil Vegetable Soup', category: 'dinner',
    calories: 580, protein: 28, carbs: 78, fats: 16,
    ingredients: [{name:'lentils',quantity:150,unit:'g'},{name:'carrots',quantity:80,unit:'g'},{name:'celery',quantity:50,unit:'g'},{name:'tomatoes',quantity:2,unit:'pcs'},{name:'whole grain bread',quantity:1,unit:'slice'}],
    instructions: 'Simmer lentils with diced carrots, celery, tomatoes for 25 min. Serve with bread.',
    dietTags: ['dash','vegetarian','anti_inflammatory'], equipment: ['stovetop'], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 'd14', title: 'Mushroom Stroganoff', category: 'dinner',
    calories: 640, protein: 22, carbs: 78, fats: 28,
    ingredients: [{name:'mushrooms',quantity:250,unit:'g'},{name:'cream',quantity:100,unit:'ml'},{name:'whole-grain pasta',quantity:100,unit:'g'},{name:'onion',quantity:0.5,unit:'pcs'}],
    instructions: 'Sauté mushrooms and onion. Add cream, simmer. Cook pasta. Combine and serve.',
    dietTags: ['vegetarian'], equipment: ['stovetop'], skillLevel: 'intermediate', costEstimate: 'medium'
  },
  {
    id: 'd15', title: 'Paneer & Veg Skillet', category: 'dinner',
    calories: 720, protein: 30, carbs: 118, fats: 19,
    ingredients: [{name:'paneer or tofu',quantity:150,unit:'g'},{name:'bell peppers',quantity:1,unit:'pcs'},{name:'onion',quantity:0.5,unit:'pcs'},{name:'basmati rice',quantity:150,unit:'g'},{name:'yogurt raita',quantity:50,unit:'g'}],
    instructions: 'Cube and pan-fry paneer. Sauté peppers and onion. Cook rice. Serve with raita.',
    dietTags: ['vegetarian'], equipment: ['stovetop'], skillLevel: 'intermediate', costEstimate: 'medium'
  },
  {
    id: 'd16', title: 'Ribeye Steak', category: 'dinner',
    calories: 920, protein: 78, carbs: 0, fats: 66,
    ingredients: [{name:'ribeye steak',quantity:340,unit:'g'},{name:'butter',quantity:20,unit:'g'},{name:'salt',quantity:2,unit:'g'}],
    instructions: 'Bring steak to room temp. Sear in butter 4-5 min each side for medium. Rest 5 min.',
    dietTags: ['carnivore','keto','gluten_free'], equipment: ['stovetop'], skillLevel: 'intermediate', costEstimate: 'high'
  },
  {
    id: 'd17', title: 'Salmon & Pasta', category: 'dinner',
    calories: 840, protein: 52, carbs: 82, fats: 34,
    ingredients: [{name:'salmon fillet',quantity:170,unit:'g'},{name:'whole wheat pasta',quantity:100,unit:'g'},{name:'olive oil',quantity:15,unit:'ml'},{name:'garlic',quantity:5,unit:'g'},{name:'cherry tomatoes',quantity:80,unit:'g'}],
    instructions: 'Grill salmon. Cook pasta. Sauté garlic and tomatoes in olive oil. Toss pasta. Serve with salmon.',
    dietTags: ['bulking','muscle_gain','pescatarian'], equipment: ['stovetop'], skillLevel: 'intermediate', costEstimate: 'medium'
  },
  {
    id: 'd18', title: 'Salmon & Potatoes', category: 'dinner',
    calories: 680, protein: 42, carbs: 58, fats: 30,
    ingredients: [{name:'salmon fillet',quantity:170,unit:'g'},{name:'baby potatoes',quantity:200,unit:'g'},{name:'green beans',quantity:100,unit:'g'}],
    instructions: 'Bake salmon. Roast baby potatoes. Steam green beans. Serve together.',
    dietTags: ['balanced','gluten_free','pescatarian'], equipment: ['oven','stovetop'], skillLevel: 'intermediate', costEstimate: 'medium'
  },
  {
    id: 'd19', title: 'Salmon & Zucchini', category: 'dinner',
    calories: 620, protein: 48, carbs: 10, fats: 44,
    ingredients: [{name:'salmon fillet',quantity:170,unit:'g'},{name:'zucchini',quantity:200,unit:'g'},{name:'olives',quantity:30,unit:'g'},{name:'olive oil',quantity:15,unit:'ml'}],
    instructions: 'Pan-fry salmon. Sauté zucchini slices. Serve with olives.',
    dietTags: ['low_carb','keto','gluten_free','pescatarian'], equipment: ['stovetop'], skillLevel: 'intermediate', costEstimate: 'medium'
  },
  {
    id: 'd20', title: 'Steak & Mashed Potatoes', category: 'dinner',
    calories: 820, protein: 56, carbs: 68, fats: 34,
    ingredients: [{name:'sirloin steak',quantity:230,unit:'g'},{name:'potatoes',quantity:250,unit:'g'},{name:'butter',quantity:20,unit:'g'},{name:'green beans',quantity:100,unit:'g'}],
    instructions: 'Sear steak. Boil and mash potatoes with butter. Steam green beans. Serve together.',
    dietTags: ['bulking','muscle_gain'], equipment: ['stovetop','oven'], skillLevel: 'intermediate', costEstimate: 'high'
  },
  {
    id: 'd21', title: 'Tofu Stir-fry', category: 'dinner',
    calories: 580, protein: 34, carbs: 62, fats: 22,
    ingredients: [{name:'tofu',quantity:200,unit:'g'},{name:'broccoli',quantity:100,unit:'g'},{name:'bell peppers',quantity:1,unit:'pcs'},{name:'tamari sauce',quantity:20,unit:'ml'},{name:'rice',quantity:80,unit:'g'}],
    instructions: 'Press and cube tofu. Stir-fry with broccoli and peppers in tamari. Serve over rice.',
    dietTags: ['vegetarian','vegan','gluten_free'], equipment: ['stovetop'], skillLevel: 'intermediate', costEstimate: 'medium'
  },
  {
    id: 'd22', title: 'Turkey & Sweet Potato', category: 'dinner',
    calories: 780, protein: 52, carbs: 86, fats: 22,
    ingredients: [{name:'ground turkey',quantity:200,unit:'g'},{name:'sweet potatoes',quantity:300,unit:'g'},{name:'asparagus',quantity:100,unit:'g'},{name:'butter',quantity:15,unit:'g'}],
    instructions: 'Brown turkey. Bake sweet potatoes. Steam asparagus with butter. Serve together.',
    dietTags: ['bulking','muscle_gain','gluten_free'], equipment: ['stovetop','oven'], skillLevel: 'beginner', costEstimate: 'medium'
  },
  {
    id: 'd23', title: 'Turkey Meatballs & Pasta', category: 'dinner',
    calories: 720, protein: 48, carbs: 82, fats: 20,
    ingredients: [{name:'turkey mince',quantity:200,unit:'g'},{name:'whole wheat spaghetti',quantity:100,unit:'g'},{name:'marinara sauce',quantity:100,unit:'ml'},{name:'parmesan',quantity:20,unit:'g'}],
    instructions: 'Form turkey into meatballs. Bake at 190°C for 20 min. Cook pasta. Combine with marinara and parmesan.',
    dietTags: ['muscle_gain','balanced'], equipment: ['oven','stovetop'], skillLevel: 'intermediate', costEstimate: 'medium'
  },
  {
    id: 'd24', title: 'Turkey Skillet', category: 'dinner',
    calories: 580, protein: 44, carbs: 52, fats: 22,
    ingredients: [{name:'turkey mince',quantity:200,unit:'g'},{name:'bell peppers',quantity:1,unit:'pcs'},{name:'onions',quantity:0.5,unit:'pcs'},{name:'tomato sauce',quantity:80,unit:'ml'},{name:'rice',quantity:80,unit:'g'}],
    instructions: 'Brown turkey with peppers and onions. Add tomato sauce. Simmer 10 min. Serve over rice.',
    dietTags: ['balanced','gluten_free'], equipment: ['stovetop'], skillLevel: 'intermediate', costEstimate: 'medium'
  },
  {
    id: 'd25', title: 'Turmeric Lentil Stew', category: 'dinner',
    calories: 540, protein: 24, carbs: 76, fats: 14,
    ingredients: [{name:'red lentils',quantity:150,unit:'g'},{name:'turmeric',quantity:3,unit:'g'},{name:'ginger',quantity:5,unit:'g'},{name:'garlic',quantity:5,unit:'g'},{name:'tomatoes',quantity:2,unit:'pcs'},{name:'spinach',quantity:50,unit:'g'},{name:'brown rice',quantity:80,unit:'g'}],
    instructions: 'Simmer lentils with turmeric, ginger, garlic, tomatoes for 20 min. Stir in spinach. Serve over rice.',
    dietTags: ['anti_inflammatory','vegan','gluten_free'], equipment: ['stovetop'], skillLevel: 'beginner', costEstimate: 'low'
  },

  // ===== SNACKS (15 meals) =====
  {
    id: 's1', title: 'Protein Shake', category: 'snack',
    calories: 280, protein: 30, carbs: 24, fats: 8,
    ingredients: [{name:'whey protein',quantity:30,unit:'g'},{name:'banana',quantity:1,unit:'pcs'},{name:'almond milk',quantity:200,unit:'ml'}],
    instructions: 'Blend whey protein, banana, and almond milk until smooth. Serve cold.',
    dietTags: ['balanced','muscle_gain','bulking','gluten_free','vegetarian'], equipment: ['blender'], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 's2', title: 'Greek Yogurt & Honey', category: 'snack',
    calories: 220, protein: 18, carbs: 22, fats: 6,
    ingredients: [{name:'Greek yogurt',quantity:150,unit:'g'},{name:'honey',quantity:10,unit:'ml'},{name:'walnuts',quantity:10,unit:'g'}],
    instructions: 'Top Greek yogurt with a drizzle of honey and crushed walnuts.',
    dietTags: ['balanced','vegetarian','gluten_free','dash','diabetic'], equipment: [], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 's3', title: 'Apple & Peanut Butter', category: 'snack',
    calories: 260, protein: 8, carbs: 28, fats: 14,
    ingredients: [{name:'apple',quantity:1,unit:'pcs'},{name:'peanut butter',quantity:20,unit:'g'}],
    instructions: 'Slice apple and serve with peanut butter for dipping.',
    dietTags: ['balanced','vegan','gluten_free','vegetarian','pescatarian'], equipment: [], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 's4', title: 'Hard Boiled Eggs', category: 'snack',
    calories: 210, protein: 18, carbs: 2, fats: 14,
    ingredients: [{name:'eggs',quantity:3,unit:'pcs'},{name:'salt',quantity:1,unit:'g'}],
    instructions: 'Boil eggs for 10 minutes. Cool, peel, and season with salt.',
    dietTags: ['keto','low_carb','carnivore','paleo','gluten_free','balanced'], equipment: ['stovetop'], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 's5', title: 'Trail Mix', category: 'snack',
    calories: 280, protein: 8, carbs: 24, fats: 18,
    ingredients: [{name:'almonds',quantity:20,unit:'g'},{name:'walnuts',quantity:15,unit:'g'},{name:'dried cranberries',quantity:15,unit:'g'},{name:'dark chocolate chips',quantity:10,unit:'g'}],
    instructions: 'Combine almonds, walnuts, dried cranberries, and dark chocolate chips. Portion and serve.',
    dietTags: ['balanced','vegan','gluten_free','vegetarian','anti_inflammatory'], equipment: [], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 's6', title: 'Cottage Cheese & Berries', category: 'snack',
    calories: 200, protein: 22, carbs: 16, fats: 6,
    ingredients: [{name:'cottage cheese',quantity:150,unit:'g'},{name:'mixed berries',quantity:80,unit:'g'}],
    instructions: 'Top cottage cheese with fresh mixed berries. Serve cold.',
    dietTags: ['balanced','low_carb','gluten_free','vegetarian','diabetic','dash'], equipment: [], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 's7', title: 'Hummus & Veggie Sticks', category: 'snack',
    calories: 240, protein: 10, carbs: 26, fats: 12,
    ingredients: [{name:'hummus',quantity:60,unit:'g'},{name:'carrot sticks',quantity:60,unit:'g'},{name:'cucumber',quantity:60,unit:'g'},{name:'bell peppers',quantity:0.5,unit:'pcs'}],
    instructions: 'Slice vegetables into sticks. Serve with hummus for dipping.',
    dietTags: ['balanced','vegan','gluten_free','vegetarian','dash','anti_inflammatory','diabetic'], equipment: [], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 's8', title: 'Avocado Rice Cake', category: 'snack',
    calories: 230, protein: 4, carbs: 18, fats: 16,
    ingredients: [{name:'rice cakes',quantity:2,unit:'pcs'},{name:'avocado',quantity:0.5,unit:'pcs'},{name:'lemon juice',quantity:5,unit:'ml'},{name:'salt',quantity:1,unit:'g'}],
    instructions: 'Mash avocado with lemon juice and salt. Spread on rice cakes.',
    dietTags: ['balanced','vegan','gluten_free','vegetarian','paleo'], equipment: [], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 's9', title: 'Beef Jerky & Cheese', category: 'snack',
    calories: 260, protein: 24, carbs: 6, fats: 16,
    ingredients: [{name:'beef jerky',quantity:40,unit:'g'},{name:'cheese',quantity:30,unit:'g'}],
    instructions: 'Pair beef jerky with sliced cheese. Serve as a portable snack.',
    dietTags: ['keto','low_carb','carnivore','gluten_free','paleo'], equipment: [], skillLevel: 'beginner', costEstimate: 'medium'
  },
  {
    id: 's10', title: 'Banana & Almond Butter', category: 'snack',
    calories: 270, protein: 8, carbs: 32, fats: 14,
    ingredients: [{name:'banana',quantity:1,unit:'pcs'},{name:'almond butter',quantity:15,unit:'g'}],
    instructions: 'Slice banana and drizzle with almond butter. Serve immediately.',
    dietTags: ['balanced','vegan','gluten_free','vegetarian','bulking','muscle_gain'], equipment: [], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 's11', title: 'Tuna Cucumber Bites', category: 'snack',
    calories: 180, protein: 22, carbs: 6, fats: 8,
    ingredients: [{name:'tuna',quantity:80,unit:'g'},{name:'cucumber',quantity:1,unit:'pcs'},{name:'olive oil',quantity:5,unit:'ml'},{name:'lemon juice',quantity:5,unit:'ml'}],
    instructions: 'Slice cucumber into thick rounds. Top each with seasoned tuna mixed with olive oil and lemon.',
    dietTags: ['low_carb','keto','gluten_free','pescatarian','paleo','balanced'], equipment: [], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 's12', title: 'Edamame Bowl', category: 'snack',
    calories: 220, protein: 18, carbs: 14, fats: 10,
    ingredients: [{name:'edamame',quantity:150,unit:'g'},{name:'salt',quantity:1,unit:'g'},{name:'chili flakes',quantity:1,unit:'g'}],
    instructions: 'Steam or microwave edamame. Season with salt and chili flakes.',
    dietTags: ['balanced','vegan','gluten_free','vegetarian','anti_inflammatory','dash'], equipment: ['stovetop','microwave'], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 's13', title: 'Protein Energy Balls', category: 'snack',
    calories: 250, protein: 14, carbs: 28, fats: 10,
    ingredients: [{name:'oats',quantity:40,unit:'g'},{name:'peanut butter',quantity:20,unit:'g'},{name:'honey',quantity:10,unit:'ml'},{name:'whey protein',quantity:15,unit:'g'},{name:'dark chocolate chips',quantity:10,unit:'g'}],
    instructions: 'Mix all ingredients. Roll into balls. Refrigerate for 30 min before serving.',
    dietTags: ['balanced','muscle_gain','bulking','vegetarian'], equipment: [], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 's14', title: 'Smoked Salmon Bites', category: 'snack',
    calories: 200, protein: 20, carbs: 8, fats: 10,
    ingredients: [{name:'smoked salmon',quantity:60,unit:'g'},{name:'cream cheese',quantity:20,unit:'g'},{name:'cucumber',quantity:0.5,unit:'pcs'},{name:'dill',quantity:2,unit:'g'}],
    instructions: 'Slice cucumber into rounds. Spread cream cheese, top with smoked salmon and dill.',
    dietTags: ['low_carb','keto','gluten_free','pescatarian','anti_inflammatory'], equipment: [], skillLevel: 'beginner', costEstimate: 'medium'
  },
  {
    id: 's15', title: 'Mixed Nuts & Dark Chocolate', category: 'snack',
    calories: 300, protein: 8, carbs: 18, fats: 24,
    ingredients: [{name:'almonds',quantity:15,unit:'g'},{name:'cashews',quantity:15,unit:'g'},{name:'dark chocolate',quantity:20,unit:'g'}],
    instructions: 'Portion out nuts and break dark chocolate into pieces. Enjoy together.',
    dietTags: ['balanced','vegan','gluten_free','vegetarian','keto'], equipment: [], skillLevel: 'beginner', costEstimate: 'low'
  },

  // ===== NEW BREAKFAST (20 meals) =====
  {
    id: 'b25', title: 'Shakshuka', category: 'breakfast',
    calories: 420, protein: 22, carbs: 32, fats: 24,
    ingredients: [{name:'eggs',quantity:3,unit:'pcs'},{name:'canned tomatoes',quantity:200,unit:'g'},{name:'onion',quantity:0.5,unit:'pcs'},{name:'bell peppers',quantity:0.5,unit:'pcs'},{name:'garlic',quantity:5,unit:'g'},{name:'cumin',quantity:2,unit:'g'},{name:'paprika',quantity:2,unit:'g'},{name:'olive oil',quantity:10,unit:'ml'},{name:'whole grain bread',quantity:1,unit:'slice'}],
    instructions: 'Sauté onion, peppers, garlic in olive oil. Add tomatoes, cumin, paprika and simmer 10 min. Make wells, crack eggs in. Cover and cook 5-7 min until set. Serve with bread.',
    dietTags: ['vegetarian','gluten_free','mediterranean','dash','anti_inflammatory'], equipment: ['stovetop'], skillLevel: 'intermediate', costEstimate: 'low'
  },
  {
    id: 'b26', title: 'Açaí Bowl', category: 'breakfast',
    calories: 440, protein: 10, carbs: 62, fats: 18,
    ingredients: [{name:'açaí puree',quantity:100,unit:'g'},{name:'banana',quantity:1,unit:'pcs'},{name:'blueberries',quantity:60,unit:'g'},{name:'granola',quantity:30,unit:'g'},{name:'almond milk',quantity:100,unit:'ml'},{name:'chia seeds',quantity:10,unit:'g'},{name:'coconut flakes',quantity:10,unit:'g'}],
    instructions: 'Blend açaí puree, half banana, and almond milk until thick. Pour into bowl. Top with sliced banana, blueberries, granola, chia seeds, coconut.',
    dietTags: ['vegan','gluten_free','anti_inflammatory','balanced'], equipment: ['blender'], skillLevel: 'beginner', costEstimate: 'medium'
  },
  {
    id: 'b27', title: 'Japanese Tamago & Rice', category: 'breakfast',
    calories: 480, protein: 22, carbs: 58, fats: 18,
    ingredients: [{name:'eggs',quantity:3,unit:'pcs'},{name:'mirin',quantity:10,unit:'ml'},{name:'soy sauce',quantity:5,unit:'ml'},{name:'short grain rice',quantity:120,unit:'g'},{name:'nori',quantity:1,unit:'sheet'},{name:'pickled ginger',quantity:10,unit:'g'}],
    instructions: 'Whisk eggs with mirin and soy. Cook in layers in a rectangular pan, rolling each layer. Serve sliced over steamed rice with nori and pickled ginger.',
    dietTags: ['balanced','pescatarian'], equipment: ['stovetop'], skillLevel: 'intermediate', costEstimate: 'low'
  },
  {
    id: 'b28', title: 'Chia Pudding with Mango', category: 'breakfast',
    calories: 380, protein: 12, carbs: 46, fats: 18,
    ingredients: [{name:'chia seeds',quantity:40,unit:'g'},{name:'coconut milk',quantity:200,unit:'ml'},{name:'mango',quantity:100,unit:'g'},{name:'passion fruit',quantity:1,unit:'pcs'},{name:'honey',quantity:10,unit:'ml'},{name:'pistachios',quantity:10,unit:'g'}],
    instructions: 'Mix chia seeds with coconut milk and honey. Refrigerate 4+ hours or overnight. Top with diced mango, passion fruit pulp, and crushed pistachios.',
    dietTags: ['vegan','gluten_free','anti_inflammatory','vegetarian'], equipment: [], skillLevel: 'beginner', costEstimate: 'medium'
  },
  {
    id: 'b29', title: 'Avocado Toast with Poached Eggs', category: 'breakfast',
    calories: 460, protein: 20, carbs: 34, fats: 28,
    ingredients: [{name:'sourdough bread',quantity:2,unit:'slices'},{name:'avocado',quantity:1,unit:'pcs'},{name:'eggs',quantity:2,unit:'pcs'},{name:'chili flakes',quantity:1,unit:'g'},{name:'lemon juice',quantity:5,unit:'ml'},{name:'cherry tomatoes',quantity:50,unit:'g'}],
    instructions: 'Toast sourdough. Mash avocado with lemon juice. Poach eggs in simmering water 3-4 min. Spread avocado on toast, top with poached eggs, halved cherry tomatoes, and chili flakes.',
    dietTags: ['vegetarian','balanced','dash'], equipment: ['stovetop'], skillLevel: 'intermediate', costEstimate: 'low'
  },
  {
    id: 'b30', title: 'Egg Muffin Cups', category: 'breakfast',
    calories: 360, protein: 28, carbs: 12, fats: 24,
    ingredients: [{name:'eggs',quantity:4,unit:'pcs'},{name:'spinach',quantity:40,unit:'g'},{name:'sun-dried tomatoes',quantity:20,unit:'g'},{name:'feta cheese',quantity:30,unit:'g'},{name:'bell peppers',quantity:0.5,unit:'pcs'}],
    instructions: 'Whisk eggs. Divide spinach, diced peppers, sun-dried tomatoes, and feta into muffin cups. Pour egg mixture over. Bake at 180°C for 18-20 min.',
    dietTags: ['low_carb','keto','gluten_free','vegetarian','diabetic'], equipment: ['oven'], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 'b31', title: 'Turkish Menemen', category: 'breakfast',
    calories: 400, protein: 20, carbs: 28, fats: 24,
    ingredients: [{name:'eggs',quantity:3,unit:'pcs'},{name:'tomatoes',quantity:2,unit:'pcs'},{name:'green peppers',quantity:1,unit:'pcs'},{name:'onion',quantity:0.5,unit:'pcs'},{name:'olive oil',quantity:10,unit:'ml'},{name:'paprika',quantity:2,unit:'g'},{name:'whole grain bread',quantity:1,unit:'slice'}],
    instructions: 'Sauté diced onion and peppers in olive oil. Add chopped tomatoes and paprika, cook until soft. Stir in beaten eggs until just set. Serve with bread.',
    dietTags: ['vegetarian','mediterranean','gluten_free','balanced'], equipment: ['stovetop'], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 'b32', title: 'Sweet Potato Hash & Eggs', category: 'breakfast',
    calories: 480, protein: 24, carbs: 48, fats: 22,
    ingredients: [{name:'sweet potato',quantity:200,unit:'g'},{name:'eggs',quantity:2,unit:'pcs'},{name:'bell peppers',quantity:0.5,unit:'pcs'},{name:'onion',quantity:0.5,unit:'pcs'},{name:'olive oil',quantity:10,unit:'ml'},{name:'paprika',quantity:2,unit:'g'},{name:'avocado',quantity:0.25,unit:'pcs'}],
    instructions: 'Dice sweet potato small. Sauté in olive oil until golden (8-10 min). Add diced peppers and onion, cook 4 min. Make wells, crack eggs in. Cover until eggs set. Top with avocado.',
    dietTags: ['gluten_free','paleo','vegetarian','balanced'], equipment: ['stovetop'], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 'b33', title: 'Buckwheat Porridge with Berries', category: 'breakfast',
    calories: 420, protein: 14, carbs: 68, fats: 12,
    ingredients: [{name:'buckwheat groats',quantity:80,unit:'g'},{name:'almond milk',quantity:200,unit:'ml'},{name:'mixed berries',quantity:100,unit:'g'},{name:'maple syrup',quantity:10,unit:'ml'},{name:'hemp seeds',quantity:10,unit:'g'}],
    instructions: 'Cook buckwheat in almond milk until tender and creamy (15 min). Top with mixed berries, hemp seeds, and a drizzle of maple syrup.',
    dietTags: ['vegan','gluten_free','anti_inflammatory','balanced'], equipment: ['stovetop'], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 'b34', title: 'Smoked Salmon Bagel', category: 'breakfast',
    calories: 480, protein: 30, carbs: 42, fats: 22,
    ingredients: [{name:'whole wheat bagel',quantity:1,unit:'pcs'},{name:'smoked salmon',quantity:80,unit:'g'},{name:'cream cheese',quantity:30,unit:'g'},{name:'capers',quantity:10,unit:'g'},{name:'red onion',quantity:20,unit:'g'},{name:'dill',quantity:2,unit:'g'}],
    instructions: 'Toast bagel halves. Spread cream cheese. Layer with smoked salmon, thin red onion rings, capers, and fresh dill.',
    dietTags: ['pescatarian','balanced','dash'], equipment: [], skillLevel: 'beginner', costEstimate: 'medium'
  },
  {
    id: 'b35', title: 'Banana Oat Waffles', category: 'breakfast',
    calories: 520, protein: 22, carbs: 72, fats: 16,
    ingredients: [{name:'oats',quantity:80,unit:'g'},{name:'banana',quantity:1,unit:'pcs'},{name:'eggs',quantity:2,unit:'pcs'},{name:'baking powder',quantity:3,unit:'g'},{name:'cinnamon',quantity:2,unit:'g'},{name:'Greek yogurt',quantity:60,unit:'g'},{name:'berries',quantity:60,unit:'g'}],
    instructions: 'Blend oats, banana, eggs, baking powder, cinnamon until smooth. Cook in waffle iron. Serve topped with yogurt and berries.',
    dietTags: ['balanced','vegetarian','muscle_gain'], equipment: ['blender','stovetop'], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 'b36', title: 'Mediterranean Frittata', category: 'breakfast',
    calories: 440, protein: 30, carbs: 14, fats: 30,
    ingredients: [{name:'eggs',quantity:4,unit:'pcs'},{name:'zucchini',quantity:100,unit:'g'},{name:'sun-dried tomatoes',quantity:20,unit:'g'},{name:'olives',quantity:20,unit:'g'},{name:'feta cheese',quantity:40,unit:'g'},{name:'fresh basil',quantity:5,unit:'g'},{name:'olive oil',quantity:10,unit:'ml'}],
    instructions: 'Sauté sliced zucchini in olive oil. Beat eggs, pour over zucchini. Add sun-dried tomatoes, olives, feta. Cook on stovetop 5 min, then finish under broiler 3 min.',
    dietTags: ['low_carb','keto','gluten_free','vegetarian','mediterranean'], equipment: ['stovetop','oven'], skillLevel: 'intermediate', costEstimate: 'low'
  },
  {
    id: 'b37', title: 'Peanut Butter Banana Smoothie', category: 'breakfast',
    calories: 520, protein: 28, carbs: 58, fats: 22,
    ingredients: [{name:'banana',quantity:1,unit:'pcs'},{name:'peanut butter',quantity:30,unit:'g'},{name:'oats',quantity:30,unit:'g'},{name:'milk',quantity:250,unit:'ml'},{name:'cocoa powder',quantity:10,unit:'g'},{name:'honey',quantity:10,unit:'ml'}],
    instructions: 'Blend all ingredients until smooth and creamy. Serve immediately.',
    dietTags: ['balanced','vegetarian','muscle_gain','bulking'], equipment: ['blender'], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 'b38', title: 'Spinach & Ricotta Crepes', category: 'breakfast',
    calories: 460, protein: 26, carbs: 38, fats: 24,
    ingredients: [{name:'eggs',quantity:2,unit:'pcs'},{name:'milk',quantity:100,unit:'ml'},{name:'flour',quantity:50,unit:'g'},{name:'spinach',quantity:80,unit:'g'},{name:'ricotta',quantity:80,unit:'g'},{name:'nutmeg',quantity:1,unit:'g'},{name:'parmesan',quantity:15,unit:'g'}],
    instructions: 'Blend eggs, milk, flour into batter. Cook thin crepes. Fill with wilted spinach, ricotta, nutmeg, parmesan. Roll and serve.',
    dietTags: ['vegetarian','balanced','mediterranean'], equipment: ['stovetop','blender'], skillLevel: 'intermediate', costEstimate: 'low'
  },
  {
    id: 'b39', title: 'Breakfast Burrito', category: 'breakfast',
    calories: 560, protein: 32, carbs: 48, fats: 26,
    ingredients: [{name:'whole wheat tortilla',quantity:1,unit:'pcs'},{name:'eggs',quantity:2,unit:'pcs'},{name:'black beans',quantity:60,unit:'g'},{name:'avocado',quantity:0.25,unit:'pcs'},{name:'salsa',quantity:30,unit:'g'},{name:'cheese',quantity:30,unit:'g'},{name:'bell peppers',quantity:0.5,unit:'pcs'}],
    instructions: 'Scramble eggs with diced peppers. Warm tortilla. Layer beans, scrambled eggs, cheese, avocado, salsa. Roll tightly.',
    dietTags: ['balanced','vegetarian','muscle_gain'], equipment: ['stovetop'], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 'b40', title: 'Nordic Rye & Salmon Open Sandwich', category: 'breakfast',
    calories: 420, protein: 26, carbs: 34, fats: 20,
    ingredients: [{name:'dark rye bread',quantity:2,unit:'slices'},{name:'smoked salmon',quantity:60,unit:'g'},{name:'avocado',quantity:0.5,unit:'pcs'},{name:'radishes',quantity:3,unit:'pcs'},{name:'lemon juice',quantity:5,unit:'ml'},{name:'dill',quantity:2,unit:'g'}],
    instructions: 'Top rye bread with mashed avocado. Layer smoked salmon, thinly sliced radishes, dill, and a squeeze of lemon.',
    dietTags: ['pescatarian','balanced','dash','anti_inflammatory'], equipment: [], skillLevel: 'beginner', costEstimate: 'medium'
  },
  {
    id: 'b41', title: 'Matcha Overnight Oats', category: 'breakfast',
    calories: 400, protein: 16, carbs: 54, fats: 14,
    ingredients: [{name:'rolled oats',quantity:70,unit:'g'},{name:'almond milk',quantity:200,unit:'ml'},{name:'matcha powder',quantity:3,unit:'g'},{name:'maple syrup',quantity:10,unit:'ml'},{name:'banana',quantity:0.5,unit:'pcs'},{name:'almonds',quantity:15,unit:'g'},{name:'chia seeds',quantity:10,unit:'g'}],
    instructions: 'Whisk matcha into almond milk. Mix with oats, chia, and maple syrup. Refrigerate overnight. Top with sliced banana and almonds.',
    dietTags: ['vegan','anti_inflammatory','balanced','vegetarian'], equipment: [], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 'b42', title: 'Savory Oat Bowl with Egg', category: 'breakfast',
    calories: 460, protein: 24, carbs: 48, fats: 20,
    ingredients: [{name:'rolled oats',quantity:70,unit:'g'},{name:'vegetable broth',quantity:200,unit:'ml'},{name:'egg',quantity:1,unit:'pcs'},{name:'avocado',quantity:0.25,unit:'pcs'},{name:'cherry tomatoes',quantity:50,unit:'g'},{name:'nutritional yeast',quantity:5,unit:'g'},{name:'chili flakes',quantity:1,unit:'g'}],
    instructions: 'Cook oats in vegetable broth instead of milk. Top with a fried egg, sliced avocado, halved cherry tomatoes, nutritional yeast, and chili flakes.',
    dietTags: ['vegetarian','balanced','dash'], equipment: ['stovetop'], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 'b43', title: 'Coconut Quinoa Porridge', category: 'breakfast',
    calories: 440, protein: 14, carbs: 56, fats: 20,
    ingredients: [{name:'quinoa',quantity:70,unit:'g'},{name:'coconut milk',quantity:150,unit:'ml'},{name:'mango',quantity:80,unit:'g'},{name:'toasted coconut',quantity:10,unit:'g'},{name:'lime juice',quantity:5,unit:'ml'},{name:'macadamia nuts',quantity:15,unit:'g'}],
    instructions: 'Cook quinoa in coconut milk until creamy. Top with diced mango, toasted coconut, crushed macadamia nuts, and lime juice.',
    dietTags: ['vegan','gluten_free','anti_inflammatory'], equipment: ['stovetop'], skillLevel: 'beginner', costEstimate: 'medium'
  },
  {
    id: 'b44', title: 'Huevos Rancheros', category: 'breakfast',
    calories: 520, protein: 24, carbs: 48, fats: 26,
    ingredients: [{name:'eggs',quantity:2,unit:'pcs'},{name:'corn tortillas',quantity:2,unit:'pcs'},{name:'black beans',quantity:80,unit:'g'},{name:'salsa roja',quantity:60,unit:'g'},{name:'avocado',quantity:0.25,unit:'pcs'},{name:'cheese',quantity:20,unit:'g'},{name:'cilantro',quantity:5,unit:'g'}],
    instructions: 'Warm tortillas. Heat black beans. Fry eggs sunny-side up. Layer tortillas, beans, eggs, salsa, cheese, avocado, and cilantro.',
    dietTags: ['vegetarian','gluten_free','balanced','mediterranean'], equipment: ['stovetop'], skillLevel: 'beginner', costEstimate: 'low'
  },

  // ===== NEW LUNCH (22 meals) =====
  {
    id: 'l23', title: 'Salmon Poke Bowl', category: 'lunch',
    calories: 580, protein: 36, carbs: 62, fats: 22,
    ingredients: [{name:'sushi-grade salmon',quantity:150,unit:'g'},{name:'sushi rice',quantity:120,unit:'g'},{name:'edamame',quantity:50,unit:'g'},{name:'avocado',quantity:0.5,unit:'pcs'},{name:'cucumber',quantity:0.5,unit:'pcs'},{name:'soy sauce',quantity:15,unit:'ml'},{name:'sesame seeds',quantity:5,unit:'g'},{name:'nori strips',quantity:2,unit:'g'}],
    instructions: 'Cook sushi rice. Cube salmon. Arrange rice in bowl, top with salmon, sliced avocado, cucumber, edamame. Drizzle soy sauce. Garnish with sesame and nori.',
    dietTags: ['pescatarian','gluten_free','balanced','anti_inflammatory'], equipment: ['stovetop'], skillLevel: 'intermediate', costEstimate: 'high'
  },
  {
    id: 'l24', title: 'Falafel Plate', category: 'lunch',
    calories: 620, protein: 22, carbs: 68, fats: 30,
    ingredients: [{name:'chickpeas',quantity:150,unit:'g'},{name:'parsley',quantity:15,unit:'g'},{name:'garlic',quantity:5,unit:'g'},{name:'cumin',quantity:3,unit:'g'},{name:'whole wheat pita',quantity:1,unit:'pcs'},{name:'tahini',quantity:20,unit:'g'},{name:'mixed greens',quantity:60,unit:'g'},{name:'tomatoes',quantity:1,unit:'pcs'},{name:'cucumber',quantity:0.5,unit:'pcs'}],
    instructions: 'Blend chickpeas, parsley, garlic, cumin into a paste. Form into balls, bake at 190°C for 20 min. Serve with pita, greens, chopped tomato, cucumber, and tahini drizzle.',
    dietTags: ['vegan','vegetarian','mediterranean','balanced'], equipment: ['oven','blender'], skillLevel: 'intermediate', costEstimate: 'low'
  },
  {
    id: 'l25', title: 'Thai Chicken Lettuce Wraps', category: 'lunch',
    calories: 480, protein: 40, carbs: 22, fats: 26,
    ingredients: [{name:'ground chicken',quantity:200,unit:'g'},{name:'lettuce leaves',quantity:6,unit:'pcs'},{name:'lime juice',quantity:15,unit:'ml'},{name:'fish sauce',quantity:10,unit:'ml'},{name:'ginger',quantity:5,unit:'g'},{name:'garlic',quantity:5,unit:'g'},{name:'peanuts',quantity:15,unit:'g'},{name:'cilantro',quantity:5,unit:'g'},{name:'chili',quantity:1,unit:'pcs'}],
    instructions: 'Stir-fry ground chicken with ginger, garlic, chili. Add fish sauce and lime. Spoon into lettuce cups. Top with crushed peanuts and cilantro.',
    dietTags: ['low_carb','gluten_free','paleo','balanced'], equipment: ['stovetop'], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 'l26', title: 'Minestrone Soup', category: 'lunch',
    calories: 480, protein: 20, carbs: 66, fats: 14,
    ingredients: [{name:'cannellini beans',quantity:100,unit:'g'},{name:'pasta shells',quantity:50,unit:'g'},{name:'zucchini',quantity:100,unit:'g'},{name:'carrots',quantity:80,unit:'g'},{name:'celery',quantity:50,unit:'g'},{name:'tomatoes',quantity:200,unit:'g'},{name:'onion',quantity:0.5,unit:'pcs'},{name:'olive oil',quantity:10,unit:'ml'},{name:'parmesan',quantity:10,unit:'g'}],
    instructions: 'Sauté onion, carrots, celery in olive oil. Add tomatoes, zucchini, beans, and water. Simmer 20 min. Add pasta, cook 10 more min. Serve with parmesan.',
    dietTags: ['vegetarian','mediterranean','dash','balanced','anti_inflammatory'], equipment: ['stovetop'], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 'l27', title: 'Vietnamese Chicken Noodle Bowl', category: 'lunch',
    calories: 520, protein: 38, carbs: 56, fats: 16,
    ingredients: [{name:'chicken breast',quantity:150,unit:'g'},{name:'rice noodles',quantity:80,unit:'g'},{name:'bean sprouts',quantity:50,unit:'g'},{name:'fresh herbs',quantity:15,unit:'g'},{name:'lime',quantity:0.5,unit:'pcs'},{name:'fish sauce',quantity:10,unit:'ml'},{name:'ginger',quantity:5,unit:'g'},{name:'chicken broth',quantity:300,unit:'ml'}],
    instructions: 'Simmer broth with ginger. Poach chicken in broth, then shred. Cook rice noodles. Serve noodles in broth with chicken, bean sprouts, herbs, lime, and fish sauce.',
    dietTags: ['gluten_free','balanced','anti_inflammatory'], equipment: ['stovetop'], skillLevel: 'intermediate', costEstimate: 'low'
  },
  {
    id: 'l28', title: 'Greek Chicken Souvlaki Bowl', category: 'lunch',
    calories: 620, protein: 44, carbs: 54, fats: 26,
    ingredients: [{name:'chicken thighs',quantity:180,unit:'g'},{name:'Greek yogurt',quantity:40,unit:'g'},{name:'cucumber',quantity:0.5,unit:'pcs'},{name:'tomatoes',quantity:1,unit:'pcs'},{name:'red onion',quantity:30,unit:'g'},{name:'olive oil',quantity:10,unit:'ml'},{name:'lemon juice',quantity:15,unit:'ml'},{name:'brown rice',quantity:80,unit:'g'},{name:'oregano',quantity:2,unit:'g'}],
    instructions: 'Marinate chicken in lemon, olive oil, oregano. Grill and slice. Cook rice. Assemble with diced cucumber, tomato, onion, and tzatziki-style yogurt.',
    dietTags: ['mediterranean','gluten_free','balanced','muscle_gain'], equipment: ['stovetop'], skillLevel: 'intermediate', costEstimate: 'low'
  },
  {
    id: 'l29', title: 'Black Bean & Sweet Potato Bowl', category: 'lunch',
    calories: 560, protein: 20, carbs: 82, fats: 18,
    ingredients: [{name:'sweet potato',quantity:200,unit:'g'},{name:'black beans',quantity:120,unit:'g'},{name:'corn',quantity:50,unit:'g'},{name:'avocado',quantity:0.5,unit:'pcs'},{name:'lime juice',quantity:10,unit:'ml'},{name:'cilantro',quantity:5,unit:'g'},{name:'cumin',quantity:2,unit:'g'},{name:'brown rice',quantity:60,unit:'g'}],
    instructions: 'Roast cubed sweet potato with cumin at 200°C for 25 min. Cook rice. Warm beans with corn. Assemble bowl. Top with avocado, cilantro, and lime.',
    dietTags: ['vegan','gluten_free','vegetarian','balanced','dash'], equipment: ['oven','stovetop'], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 'l30', title: 'Niçoise Salad', category: 'lunch',
    calories: 540, protein: 34, carbs: 32, fats: 32,
    ingredients: [{name:'tuna steak',quantity:130,unit:'g'},{name:'eggs',quantity:2,unit:'pcs'},{name:'green beans',quantity:80,unit:'g'},{name:'baby potatoes',quantity:100,unit:'g'},{name:'cherry tomatoes',quantity:80,unit:'g'},{name:'olives',quantity:20,unit:'g'},{name:'olive oil',quantity:15,unit:'ml'},{name:'lemon juice',quantity:10,unit:'ml'}],
    instructions: 'Sear tuna 1-2 min per side. Boil eggs and potatoes. Blanch green beans. Arrange all on plate with tomatoes and olives. Dress with olive oil and lemon.',
    dietTags: ['pescatarian','gluten_free','mediterranean','balanced'], equipment: ['stovetop'], skillLevel: 'intermediate', costEstimate: 'medium'
  },
  {
    id: 'l31', title: 'Teriyaki Salmon Bowl', category: 'lunch',
    calories: 640, protein: 40, carbs: 68, fats: 24,
    ingredients: [{name:'salmon fillet',quantity:150,unit:'g'},{name:'sushi rice',quantity:120,unit:'g'},{name:'broccoli',quantity:100,unit:'g'},{name:'edamame',quantity:50,unit:'g'},{name:'soy sauce',quantity:15,unit:'ml'},{name:'honey',quantity:10,unit:'ml'},{name:'ginger',quantity:5,unit:'g'},{name:'sesame seeds',quantity:5,unit:'g'}],
    instructions: 'Glaze salmon with soy, honey, ginger. Bake at 200°C for 12 min. Cook rice. Steam broccoli and edamame. Assemble bowl. Garnish with sesame.',
    dietTags: ['pescatarian','balanced','muscle_gain'], equipment: ['oven','stovetop'], skillLevel: 'intermediate', costEstimate: 'medium'
  },
  {
    id: 'l32', title: 'Moroccan Chickpea Stew', category: 'lunch',
    calories: 540, protein: 22, carbs: 72, fats: 18,
    ingredients: [{name:'chickpeas',quantity:150,unit:'g'},{name:'sweet potato',quantity:150,unit:'g'},{name:'tomatoes',quantity:200,unit:'g'},{name:'onion',quantity:0.5,unit:'pcs'},{name:'garlic',quantity:5,unit:'g'},{name:'cumin',quantity:2,unit:'g'},{name:'cinnamon',quantity:1,unit:'g'},{name:'olive oil',quantity:10,unit:'ml'},{name:'cilantro',quantity:5,unit:'g'}],
    instructions: 'Sauté onion, garlic in olive oil. Add cumin, cinnamon. Add diced sweet potato, chickpeas, tomatoes. Simmer 25 min. Garnish with cilantro.',
    dietTags: ['vegan','gluten_free','vegetarian','anti_inflammatory','dash'], equipment: ['stovetop'], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 'l33', title: 'Shrimp Avocado Salad', category: 'lunch',
    calories: 480, protein: 36, carbs: 18, fats: 32,
    ingredients: [{name:'shrimp',quantity:180,unit:'g'},{name:'avocado',quantity:1,unit:'pcs'},{name:'mixed greens',quantity:80,unit:'g'},{name:'cherry tomatoes',quantity:80,unit:'g'},{name:'red onion',quantity:20,unit:'g'},{name:'lime juice',quantity:15,unit:'ml'},{name:'olive oil',quantity:10,unit:'ml'},{name:'cilantro',quantity:5,unit:'g'}],
    instructions: 'Sauté shrimp with lime juice until pink. Toss greens, tomatoes, onion. Top with sliced avocado and shrimp. Drizzle olive oil. Garnish with cilantro.',
    dietTags: ['low_carb','gluten_free','pescatarian','keto','paleo'], equipment: ['stovetop'], skillLevel: 'beginner', costEstimate: 'medium'
  },
  {
    id: 'l34', title: 'Middle Eastern Lamb Pita', category: 'lunch',
    calories: 620, protein: 38, carbs: 52, fats: 28,
    ingredients: [{name:'ground lamb',quantity:150,unit:'g'},{name:'whole wheat pita',quantity:1,unit:'pcs'},{name:'yogurt',quantity:40,unit:'g'},{name:'cucumber',quantity:0.5,unit:'pcs'},{name:'tomatoes',quantity:1,unit:'pcs'},{name:'onion',quantity:0.25,unit:'pcs'},{name:'cumin',quantity:2,unit:'g'},{name:'mint',quantity:5,unit:'g'}],
    instructions: 'Season lamb with cumin, cook until browned. Stuff pita with lamb, diced cucumber, tomato, onion, yogurt, and fresh mint.',
    dietTags: ['balanced','mediterranean'], equipment: ['stovetop'], skillLevel: 'intermediate', costEstimate: 'medium'
  },
  {
    id: 'l35', title: 'Cauliflower Fried Rice', category: 'lunch',
    calories: 420, protein: 32, carbs: 18, fats: 26,
    ingredients: [{name:'cauliflower',quantity:300,unit:'g'},{name:'eggs',quantity:2,unit:'pcs'},{name:'shrimp',quantity:100,unit:'g'},{name:'peas',quantity:40,unit:'g'},{name:'carrots',quantity:50,unit:'g'},{name:'soy sauce',quantity:15,unit:'ml'},{name:'sesame oil',quantity:5,unit:'ml'},{name:'garlic',quantity:5,unit:'g'}],
    instructions: 'Pulse cauliflower into rice-sized pieces. Scramble eggs, set aside. Sauté shrimp and garlic. Add cauliflower rice, peas, diced carrots. Season with soy and sesame oil. Mix in eggs.',
    dietTags: ['low_carb','gluten_free','pescatarian','keto','diabetic'], equipment: ['stovetop','blender'], skillLevel: 'intermediate', costEstimate: 'medium'
  },
  {
    id: 'l36', title: 'Tuscan White Bean Soup', category: 'lunch',
    calories: 480, protein: 24, carbs: 62, fats: 16,
    ingredients: [{name:'cannellini beans',quantity:150,unit:'g'},{name:'kale',quantity:80,unit:'g'},{name:'carrots',quantity:60,unit:'g'},{name:'celery',quantity:40,unit:'g'},{name:'garlic',quantity:5,unit:'g'},{name:'tomatoes',quantity:100,unit:'g'},{name:'olive oil',quantity:10,unit:'ml'},{name:'rosemary',quantity:2,unit:'g'},{name:'parmesan rind',quantity:20,unit:'g'}],
    instructions: 'Sauté garlic, carrots, celery in olive oil. Add beans, tomatoes, parmesan rind, rosemary, and water. Simmer 20 min. Add kale, cook 5 more min.',
    dietTags: ['vegetarian','mediterranean','dash','anti_inflammatory','balanced'], equipment: ['stovetop'], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 'l37', title: 'Korean Bibimbap', category: 'lunch',
    calories: 620, protein: 34, carbs: 72, fats: 22,
    ingredients: [{name:'lean beef',quantity:120,unit:'g'},{name:'short grain rice',quantity:120,unit:'g'},{name:'spinach',quantity:60,unit:'g'},{name:'carrots',quantity:60,unit:'g'},{name:'zucchini',quantity:60,unit:'g'},{name:'egg',quantity:1,unit:'pcs'},{name:'gochujang',quantity:15,unit:'g'},{name:'sesame oil',quantity:5,unit:'ml'},{name:'sesame seeds',quantity:3,unit:'g'}],
    instructions: 'Cook rice. Sauté beef. Blanch and season spinach, julienned carrots, zucchini separately. Fry egg sunny-side up. Arrange all over rice. Serve with gochujang and sesame.',
    dietTags: ['balanced','gluten_free'], equipment: ['stovetop'], skillLevel: 'intermediate', costEstimate: 'medium'
  },
  {
    id: 'l38', title: 'Stuffed Bell Peppers', category: 'lunch',
    calories: 540, protein: 34, carbs: 48, fats: 24,
    ingredients: [{name:'bell peppers',quantity:2,unit:'pcs'},{name:'ground turkey',quantity:150,unit:'g'},{name:'brown rice',quantity:60,unit:'g'},{name:'tomato sauce',quantity:80,unit:'ml'},{name:'onion',quantity:0.25,unit:'pcs'},{name:'garlic',quantity:3,unit:'g'},{name:'cheese',quantity:30,unit:'g'},{name:'oregano',quantity:2,unit:'g'}],
    instructions: 'Cook rice. Brown turkey with onion and garlic. Mix with rice, tomato sauce, oregano. Stuff into halved peppers. Top with cheese. Bake at 190°C for 25 min.',
    dietTags: ['gluten_free','balanced','mediterranean'], equipment: ['stovetop','oven'], skillLevel: 'intermediate', costEstimate: 'medium'
  },
  {
    id: 'l39', title: 'Miso Tofu & Soba Bowl', category: 'lunch',
    calories: 520, protein: 28, carbs: 62, fats: 18,
    ingredients: [{name:'firm tofu',quantity:150,unit:'g'},{name:'soba noodles',quantity:80,unit:'g'},{name:'miso paste',quantity:15,unit:'g'},{name:'edamame',quantity:50,unit:'g'},{name:'wakame seaweed',quantity:5,unit:'g'},{name:'green onions',quantity:2,unit:'pcs'},{name:'sesame oil',quantity:5,unit:'ml'},{name:'ginger',quantity:5,unit:'g'}],
    instructions: 'Cube and pan-fry tofu until golden. Cook soba noodles. Make miso broth with paste, ginger, hot water. Assemble bowl with noodles, tofu, edamame, wakame, green onions, and sesame oil.',
    dietTags: ['vegan','vegetarian','anti_inflammatory','balanced'], equipment: ['stovetop'], skillLevel: 'intermediate', costEstimate: 'low'
  },
  {
    id: 'l40', title: 'Mediterranean Tuna Wrap', category: 'lunch',
    calories: 520, protein: 36, carbs: 46, fats: 22,
    ingredients: [{name:'tuna',quantity:120,unit:'g'},{name:'whole wheat wrap',quantity:1,unit:'pcs'},{name:'hummus',quantity:30,unit:'g'},{name:'roasted red peppers',quantity:40,unit:'g'},{name:'arugula',quantity:30,unit:'g'},{name:'olives',quantity:15,unit:'g'},{name:'sun-dried tomatoes',quantity:15,unit:'g'}],
    instructions: 'Spread hummus on wrap. Layer tuna, arugula, roasted peppers, olives, and sun-dried tomatoes. Roll tightly.',
    dietTags: ['pescatarian','mediterranean','balanced','dash'], equipment: [], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 'l41', title: 'Chicken Caesar Salad', category: 'lunch',
    calories: 540, protein: 44, carbs: 22, fats: 32,
    ingredients: [{name:'chicken breast',quantity:170,unit:'g'},{name:'romaine lettuce',quantity:120,unit:'g'},{name:'parmesan',quantity:20,unit:'g'},{name:'whole grain croutons',quantity:20,unit:'g'},{name:'lemon juice',quantity:15,unit:'ml'},{name:'olive oil',quantity:15,unit:'ml'},{name:'garlic',quantity:3,unit:'g'},{name:'anchovy paste',quantity:5,unit:'g'}],
    instructions: 'Grill chicken, slice. Whisk lemon, olive oil, garlic, anchovy into dressing. Toss romaine with dressing. Top with chicken, shaved parmesan, and croutons.',
    dietTags: ['balanced','muscle_gain','dash'], equipment: ['stovetop'], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 'l42', title: 'Egg Fried Rice', category: 'lunch',
    calories: 560, protein: 22, carbs: 72, fats: 20,
    ingredients: [{name:'jasmine rice',quantity:150,unit:'g'},{name:'eggs',quantity:2,unit:'pcs'},{name:'peas',quantity:50,unit:'g'},{name:'carrots',quantity:50,unit:'g'},{name:'green onions',quantity:2,unit:'pcs'},{name:'soy sauce',quantity:15,unit:'ml'},{name:'sesame oil',quantity:5,unit:'ml'},{name:'garlic',quantity:3,unit:'g'}],
    instructions: 'Cook and cool rice. Scramble eggs, set aside. Stir-fry garlic, peas, diced carrots. Add rice, soy sauce, sesame oil. Fold in eggs and green onions.',
    dietTags: ['vegetarian','balanced'], equipment: ['stovetop'], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 'l43', title: 'Spicy Prawn Tacos', category: 'lunch',
    calories: 520, protein: 32, carbs: 48, fats: 24,
    ingredients: [{name:'prawns',quantity:180,unit:'g'},{name:'corn tortillas',quantity:3,unit:'pcs'},{name:'cabbage',quantity:60,unit:'g'},{name:'avocado',quantity:0.5,unit:'pcs'},{name:'lime juice',quantity:15,unit:'ml'},{name:'chipotle',quantity:5,unit:'g'},{name:'Greek yogurt',quantity:30,unit:'g'},{name:'cilantro',quantity:5,unit:'g'}],
    instructions: 'Season prawns with chipotle, sear 2 min each side. Shred cabbage. Mix yogurt with lime. Fill tortillas with prawns, cabbage, avocado, yogurt sauce, and cilantro.',
    dietTags: ['pescatarian','gluten_free','balanced'], equipment: ['stovetop'], skillLevel: 'beginner', costEstimate: 'medium'
  },
  {
    id: 'l44', title: 'Roasted Veggie & Hummus Bowl', category: 'lunch',
    calories: 540, protein: 18, carbs: 64, fats: 26,
    ingredients: [{name:'sweet potato',quantity:150,unit:'g'},{name:'chickpeas',quantity:80,unit:'g'},{name:'broccoli',quantity:100,unit:'g'},{name:'red onion',quantity:0.5,unit:'pcs'},{name:'hummus',quantity:60,unit:'g'},{name:'quinoa',quantity:60,unit:'g'},{name:'olive oil',quantity:10,unit:'ml'},{name:'tahini',quantity:10,unit:'g'}],
    instructions: 'Toss cubed sweet potato, chickpeas, broccoli, onion with olive oil. Roast at 200°C for 25 min. Cook quinoa. Assemble bowl with hummus and tahini drizzle.',
    dietTags: ['vegan','vegetarian','gluten_free','mediterranean','dash','anti_inflammatory'], equipment: ['oven','stovetop'], skillLevel: 'beginner', costEstimate: 'low'
  },

  // ===== NEW DINNER (25 meals) =====
  {
    id: 'd26', title: 'Thai Green Curry Chicken', category: 'dinner',
    calories: 620, protein: 40, carbs: 54, fats: 28,
    ingredients: [{name:'chicken thighs',quantity:200,unit:'g'},{name:'green curry paste',quantity:30,unit:'g'},{name:'coconut milk',quantity:150,unit:'ml'},{name:'bamboo shoots',quantity:50,unit:'g'},{name:'bell peppers',quantity:0.5,unit:'pcs'},{name:'basil',quantity:10,unit:'g'},{name:'jasmine rice',quantity:100,unit:'g'},{name:'lime juice',quantity:10,unit:'ml'}],
    instructions: 'Sauté curry paste 1 min. Add coconut milk, bring to simmer. Add sliced chicken, bamboo shoots, peppers. Cook 15 min. Stir in basil and lime. Serve over rice.',
    dietTags: ['gluten_free','balanced'], equipment: ['stovetop'], skillLevel: 'intermediate', costEstimate: 'medium'
  },
  {
    id: 'd27', title: 'Miso-Glazed Salmon', category: 'dinner',
    calories: 580, protein: 44, carbs: 42, fats: 26,
    ingredients: [{name:'salmon fillet',quantity:180,unit:'g'},{name:'white miso paste',quantity:20,unit:'g'},{name:'mirin',quantity:10,unit:'ml'},{name:'soy sauce',quantity:5,unit:'ml'},{name:'brown rice',quantity:80,unit:'g'},{name:'bok choy',quantity:150,unit:'g'},{name:'sesame seeds',quantity:3,unit:'g'}],
    instructions: 'Marinate salmon in miso, mirin, soy for 30 min. Bake at 200°C for 12-15 min. Cook rice. Steam bok choy. Serve with sesame garnish.',
    dietTags: ['pescatarian','anti_inflammatory','balanced'], equipment: ['oven','stovetop'], skillLevel: 'intermediate', costEstimate: 'medium'
  },
  {
    id: 'd28', title: 'Chicken Tikka Masala', category: 'dinner',
    calories: 640, protein: 44, carbs: 58, fats: 26,
    ingredients: [{name:'chicken breast',quantity:200,unit:'g'},{name:'yogurt',quantity:60,unit:'g'},{name:'tomato paste',quantity:30,unit:'g'},{name:'cream',quantity:40,unit:'ml'},{name:'garam masala',quantity:5,unit:'g'},{name:'turmeric',quantity:2,unit:'g'},{name:'garlic',quantity:5,unit:'g'},{name:'ginger',quantity:5,unit:'g'},{name:'basmati rice',quantity:100,unit:'g'}],
    instructions: 'Marinate chicken in yogurt, garam masala, turmeric. Sear chicken. Make sauce with tomato paste, cream, garlic, ginger, spices. Simmer chicken in sauce 15 min. Serve over rice.',
    dietTags: ['gluten_free','balanced','muscle_gain'], equipment: ['stovetop'], skillLevel: 'intermediate', costEstimate: 'medium'
  },
  {
    id: 'd29', title: 'Stuffed Portobello Mushrooms', category: 'dinner',
    calories: 480, protein: 24, carbs: 34, fats: 28,
    ingredients: [{name:'portobello mushrooms',quantity:3,unit:'pcs'},{name:'quinoa',quantity:60,unit:'g'},{name:'spinach',quantity:60,unit:'g'},{name:'sun-dried tomatoes',quantity:20,unit:'g'},{name:'goat cheese',quantity:40,unit:'g'},{name:'garlic',quantity:5,unit:'g'},{name:'olive oil',quantity:10,unit:'ml'},{name:'pine nuts',quantity:10,unit:'g'}],
    instructions: 'Cook quinoa. Sauté spinach and garlic. Mix quinoa, spinach, sun-dried tomatoes, pine nuts. Stuff mushroom caps. Top with goat cheese. Bake at 190°C for 15 min.',
    dietTags: ['vegetarian','gluten_free','low_carb','mediterranean'], equipment: ['oven','stovetop'], skillLevel: 'intermediate', costEstimate: 'medium'
  },
  {
    id: 'd30', title: 'Lemon Herb Grilled Sea Bass', category: 'dinner',
    calories: 520, protein: 42, carbs: 32, fats: 24,
    ingredients: [{name:'sea bass fillet',quantity:180,unit:'g'},{name:'lemon',quantity:1,unit:'pcs'},{name:'fresh thyme',quantity:3,unit:'g'},{name:'garlic',quantity:5,unit:'g'},{name:'asparagus',quantity:150,unit:'g'},{name:'baby potatoes',quantity:150,unit:'g'},{name:'olive oil',quantity:10,unit:'ml'}],
    instructions: 'Marinate sea bass in lemon juice, thyme, garlic, olive oil. Grill 4 min each side. Roast potatoes and asparagus at 200°C for 20 min. Serve together.',
    dietTags: ['pescatarian','gluten_free','mediterranean','dash','anti_inflammatory'], equipment: ['stovetop','oven'], skillLevel: 'intermediate', costEstimate: 'medium'
  },
  {
    id: 'd31', title: 'Lamb Kofta with Tabbouleh', category: 'dinner',
    calories: 640, protein: 38, carbs: 52, fats: 32,
    ingredients: [{name:'ground lamb',quantity:180,unit:'g'},{name:'bulgur wheat',quantity:60,unit:'g'},{name:'parsley',quantity:20,unit:'g'},{name:'mint',quantity:10,unit:'g'},{name:'tomatoes',quantity:1,unit:'pcs'},{name:'cucumber',quantity:0.5,unit:'pcs'},{name:'lemon juice',quantity:15,unit:'ml'},{name:'olive oil',quantity:10,unit:'ml'},{name:'cumin',quantity:2,unit:'g'}],
    instructions: 'Mix lamb with cumin, shape into kofta. Grill or pan-fry 4 min each side. Cook bulgur. Chop parsley, mint, tomato, cucumber for tabbouleh. Dress with lemon and olive oil.',
    dietTags: ['mediterranean','balanced'], equipment: ['stovetop'], skillLevel: 'intermediate', costEstimate: 'medium'
  },
  {
    id: 'd32', title: 'Ratatouille with Crusty Bread', category: 'dinner',
    calories: 480, protein: 14, carbs: 58, fats: 22,
    ingredients: [{name:'eggplant',quantity:150,unit:'g'},{name:'zucchini',quantity:150,unit:'g'},{name:'bell peppers',quantity:1,unit:'pcs'},{name:'tomatoes',quantity:200,unit:'g'},{name:'onion',quantity:0.5,unit:'pcs'},{name:'garlic',quantity:5,unit:'g'},{name:'olive oil',quantity:15,unit:'ml'},{name:'herbes de Provence',quantity:3,unit:'g'},{name:'crusty bread',quantity:60,unit:'g'}],
    instructions: 'Slice all vegetables. Layer in baking dish with tomato sauce, garlic, herbs. Drizzle olive oil. Bake at 190°C for 40 min. Serve with crusty bread.',
    dietTags: ['vegan','vegetarian','mediterranean','dash','anti_inflammatory','gluten_free'], equipment: ['oven'], skillLevel: 'intermediate', costEstimate: 'low'
  },
  {
    id: 'd33', title: 'Shrimp Stir-Fry with Vegetables', category: 'dinner',
    calories: 520, protein: 38, carbs: 52, fats: 18,
    ingredients: [{name:'shrimp',quantity:200,unit:'g'},{name:'broccoli',quantity:100,unit:'g'},{name:'snap peas',quantity:60,unit:'g'},{name:'carrots',quantity:60,unit:'g'},{name:'garlic',quantity:5,unit:'g'},{name:'ginger',quantity:5,unit:'g'},{name:'soy sauce',quantity:15,unit:'ml'},{name:'jasmine rice',quantity:80,unit:'g'},{name:'sesame oil',quantity:5,unit:'ml'}],
    instructions: 'Cook rice. Stir-fry shrimp with garlic, ginger until pink. Add broccoli, snap peas, carrots. Season with soy and sesame oil. Serve over rice.',
    dietTags: ['pescatarian','balanced','gluten_free','muscle_gain'], equipment: ['stovetop'], skillLevel: 'beginner', costEstimate: 'medium'
  },
  {
    id: 'd34', title: 'Cauliflower Steak with Chimichurri', category: 'dinner',
    calories: 440, protein: 14, carbs: 36, fats: 30,
    ingredients: [{name:'cauliflower',quantity:300,unit:'g'},{name:'parsley',quantity:20,unit:'g'},{name:'garlic',quantity:5,unit:'g'},{name:'red wine vinegar',quantity:10,unit:'ml'},{name:'olive oil',quantity:25,unit:'ml'},{name:'chili flakes',quantity:1,unit:'g'},{name:'oregano',quantity:2,unit:'g'},{name:'sweet potato',quantity:150,unit:'g'}],
    instructions: 'Slice cauliflower into thick steaks. Brush with olive oil. Roast at 220°C for 25 min. Blend parsley, garlic, vinegar, olive oil, chili, oregano for chimichurri. Roast sweet potato wedges alongside. Drizzle chimichurri over cauliflower.',
    dietTags: ['vegan','vegetarian','gluten_free','paleo','anti_inflammatory'], equipment: ['oven'], skillLevel: 'intermediate', costEstimate: 'low'
  },
  {
    id: 'd35', title: 'Mediterranean Baked Chicken', category: 'dinner',
    calories: 620, protein: 48, carbs: 38, fats: 30,
    ingredients: [{name:'chicken thighs',quantity:250,unit:'g'},{name:'artichoke hearts',quantity:80,unit:'g'},{name:'olives',quantity:30,unit:'g'},{name:'cherry tomatoes',quantity:100,unit:'g'},{name:'garlic',quantity:5,unit:'g'},{name:'lemon',quantity:0.5,unit:'pcs'},{name:'olive oil',quantity:15,unit:'ml'},{name:'orzo',quantity:60,unit:'g'},{name:'feta',quantity:20,unit:'g'}],
    instructions: 'Place chicken, artichokes, olives, tomatoes, garlic in baking dish. Drizzle olive oil and lemon. Bake at 200°C for 35 min. Cook orzo. Serve chicken over orzo, crumble feta on top.',
    dietTags: ['mediterranean','balanced','gluten_free'], equipment: ['oven','stovetop'], skillLevel: 'intermediate', costEstimate: 'medium'
  },
  {
    id: 'd36', title: 'Zucchini Noodle Bolognese', category: 'dinner',
    calories: 520, protein: 40, carbs: 22, fats: 32,
    ingredients: [{name:'lean ground beef',quantity:200,unit:'g'},{name:'zucchini',quantity:300,unit:'g'},{name:'tomato sauce',quantity:150,unit:'ml'},{name:'onion',quantity:0.5,unit:'pcs'},{name:'garlic',quantity:5,unit:'g'},{name:'carrots',quantity:50,unit:'g'},{name:'olive oil',quantity:10,unit:'ml'},{name:'parmesan',quantity:15,unit:'g'},{name:'basil',quantity:5,unit:'g'}],
    instructions: 'Spiralize zucchini into noodles. Brown beef with onion, garlic, diced carrots. Add tomato sauce, simmer 15 min. Sauté zucchini noodles 2 min. Serve sauce over noodles with parmesan and basil.',
    dietTags: ['low_carb','gluten_free','paleo','keto','diabetic'], equipment: ['stovetop'], skillLevel: 'intermediate', costEstimate: 'medium'
  },
  {
    id: 'd37', title: 'Chicken Shawarma Bowl', category: 'dinner',
    calories: 620, protein: 46, carbs: 56, fats: 24,
    ingredients: [{name:'chicken thighs',quantity:200,unit:'g'},{name:'cumin',quantity:3,unit:'g'},{name:'paprika',quantity:2,unit:'g'},{name:'turmeric',quantity:2,unit:'g'},{name:'garlic',quantity:5,unit:'g'},{name:'basmati rice',quantity:100,unit:'g'},{name:'hummus',quantity:40,unit:'g'},{name:'pickled turnips',quantity:20,unit:'g'},{name:'mixed greens',quantity:40,unit:'g'}],
    instructions: 'Marinate chicken in cumin, paprika, turmeric, garlic, olive oil. Pan-fry or grill until cooked. Cook rice. Assemble bowl with rice, sliced chicken, hummus, pickled turnips, and greens.',
    dietTags: ['gluten_free','mediterranean','balanced','muscle_gain'], equipment: ['stovetop'], skillLevel: 'intermediate', costEstimate: 'low'
  },
  {
    id: 'd38', title: 'Baked Cod with Olive Tapenade', category: 'dinner',
    calories: 520, protein: 42, carbs: 38, fats: 22,
    ingredients: [{name:'cod fillet',quantity:180,unit:'g'},{name:'olives',quantity:40,unit:'g'},{name:'capers',quantity:10,unit:'g'},{name:'garlic',quantity:3,unit:'g'},{name:'olive oil',quantity:10,unit:'ml'},{name:'lemon juice',quantity:10,unit:'ml'},{name:'roasted potatoes',quantity:150,unit:'g'},{name:'green beans',quantity:100,unit:'g'}],
    instructions: 'Blend olives, capers, garlic, olive oil, lemon into tapenade. Bake cod at 200°C for 12 min. Spoon tapenade over cod. Serve with roasted potatoes and steamed green beans.',
    dietTags: ['pescatarian','gluten_free','mediterranean','dash'], equipment: ['oven','stovetop'], skillLevel: 'intermediate', costEstimate: 'medium'
  },
  {
    id: 'd39', title: 'Veggie Pad Thai', category: 'dinner',
    calories: 540, protein: 18, carbs: 68, fats: 22,
    ingredients: [{name:'rice noodles',quantity:100,unit:'g'},{name:'tofu',quantity:100,unit:'g'},{name:'bean sprouts',quantity:60,unit:'g'},{name:'carrots',quantity:50,unit:'g'},{name:'green onions',quantity:2,unit:'pcs'},{name:'peanuts',quantity:20,unit:'g'},{name:'lime',quantity:0.5,unit:'pcs'},{name:'tamarind paste',quantity:15,unit:'g'},{name:'soy sauce',quantity:10,unit:'ml'}],
    instructions: 'Cook noodles. Fry cubed tofu until golden. Stir-fry carrots. Add noodles, tamarind, soy sauce. Toss with bean sprouts and green onions. Serve with crushed peanuts and lime.',
    dietTags: ['vegan','vegetarian','gluten_free'], equipment: ['stovetop'], skillLevel: 'intermediate', costEstimate: 'low'
  },
  {
    id: 'd40', title: 'Herb-Roasted Chicken & Root Veg', category: 'dinner',
    calories: 620, protein: 48, carbs: 46, fats: 28,
    ingredients: [{name:'chicken thighs',quantity:250,unit:'g'},{name:'parsnips',quantity:100,unit:'g'},{name:'carrots',quantity:100,unit:'g'},{name:'sweet potato',quantity:100,unit:'g'},{name:'rosemary',quantity:3,unit:'g'},{name:'thyme',quantity:3,unit:'g'},{name:'garlic',quantity:5,unit:'g'},{name:'olive oil',quantity:15,unit:'ml'}],
    instructions: 'Toss chicken and diced root vegetables with olive oil, rosemary, thyme, garlic. Spread on baking tray. Roast at 200°C for 35 min until chicken is golden.',
    dietTags: ['gluten_free','paleo','balanced','dash'], equipment: ['oven'], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 'd41', title: 'Seared Duck Breast with Lentils', category: 'dinner',
    calories: 680, protein: 44, carbs: 48, fats: 34,
    ingredients: [{name:'duck breast',quantity:200,unit:'g'},{name:'green lentils',quantity:100,unit:'g'},{name:'shallots',quantity:2,unit:'pcs'},{name:'red wine vinegar',quantity:10,unit:'ml'},{name:'thyme',quantity:2,unit:'g'},{name:'Dijon mustard',quantity:5,unit:'g'},{name:'arugula',quantity:40,unit:'g'}],
    instructions: 'Score duck skin, sear skin-side down 6 min, flip 4 min. Rest. Cook lentils with shallots and thyme. Dress with vinegar and mustard. Slice duck, serve over lentils and arugula.',
    dietTags: ['gluten_free','balanced','paleo'], equipment: ['stovetop'], skillLevel: 'advanced', costEstimate: 'high'
  },
  {
    id: 'd42', title: 'Eggplant Parmesan', category: 'dinner',
    calories: 560, protein: 24, carbs: 48, fats: 32,
    ingredients: [{name:'eggplant',quantity:250,unit:'g'},{name:'marinara sauce',quantity:150,unit:'ml'},{name:'mozzarella',quantity:80,unit:'g'},{name:'parmesan',quantity:20,unit:'g'},{name:'breadcrumbs',quantity:30,unit:'g'},{name:'eggs',quantity:1,unit:'pcs'},{name:'basil',quantity:5,unit:'g'},{name:'olive oil',quantity:10,unit:'ml'}],
    instructions: 'Slice eggplant, dip in beaten egg, coat in breadcrumbs. Bake at 200°C until golden. Layer in dish with marinara and mozzarella. Bake 15 min until bubbly. Top with parmesan and basil.',
    dietTags: ['vegetarian','mediterranean'], equipment: ['oven'], skillLevel: 'intermediate', costEstimate: 'low'
  },
  {
    id: 'd43', title: 'Coconut Shrimp Curry', category: 'dinner',
    calories: 580, protein: 36, carbs: 52, fats: 26,
    ingredients: [{name:'shrimp',quantity:200,unit:'g'},{name:'coconut milk',quantity:150,unit:'ml'},{name:'curry powder',quantity:5,unit:'g'},{name:'tomatoes',quantity:100,unit:'g'},{name:'onion',quantity:0.5,unit:'pcs'},{name:'garlic',quantity:5,unit:'g'},{name:'ginger',quantity:5,unit:'g'},{name:'basmati rice',quantity:80,unit:'g'},{name:'cilantro',quantity:5,unit:'g'}],
    instructions: 'Sauté onion, garlic, ginger. Add curry powder, tomatoes, coconut milk. Simmer 10 min. Add shrimp, cook 5 min. Cook rice. Serve curry over rice with cilantro.',
    dietTags: ['pescatarian','gluten_free','anti_inflammatory'], equipment: ['stovetop'], skillLevel: 'intermediate', costEstimate: 'medium'
  },
  {
    id: 'd44', title: 'Harissa Chicken with Couscous', category: 'dinner',
    calories: 620, protein: 46, carbs: 58, fats: 22,
    ingredients: [{name:'chicken breast',quantity:200,unit:'g'},{name:'harissa paste',quantity:20,unit:'g'},{name:'couscous',quantity:80,unit:'g'},{name:'chickpeas',quantity:60,unit:'g'},{name:'cucumber',quantity:0.5,unit:'pcs'},{name:'mint',quantity:5,unit:'g'},{name:'lemon juice',quantity:15,unit:'ml'},{name:'olive oil',quantity:10,unit:'ml'}],
    instructions: 'Coat chicken in harissa. Grill or pan-fry until cooked. Prepare couscous. Toss with chickpeas, diced cucumber, mint, lemon, olive oil. Serve chicken over couscous salad.',
    dietTags: ['balanced','mediterranean','muscle_gain'], equipment: ['stovetop'], skillLevel: 'intermediate', costEstimate: 'low'
  },
  {
    id: 'd45', title: 'Pesto Chicken & Roasted Vegetables', category: 'dinner',
    calories: 600, protein: 48, carbs: 28, fats: 34,
    ingredients: [{name:'chicken breast',quantity:200,unit:'g'},{name:'basil pesto',quantity:30,unit:'g'},{name:'zucchini',quantity:100,unit:'g'},{name:'cherry tomatoes',quantity:80,unit:'g'},{name:'bell peppers',quantity:1,unit:'pcs'},{name:'olive oil',quantity:10,unit:'ml'},{name:'mozzarella',quantity:30,unit:'g'}],
    instructions: 'Spread pesto over chicken. Bake at 200°C for 20 min. Toss vegetables with olive oil, roast alongside. Top chicken with mozzarella last 5 min. Serve together.',
    dietTags: ['low_carb','gluten_free','mediterranean','keto','muscle_gain'], equipment: ['oven'], skillLevel: 'beginner', costEstimate: 'medium'
  },
  {
    id: 'd46', title: 'Spicy Tuna Steak with Mango Salsa', category: 'dinner',
    calories: 520, protein: 44, carbs: 32, fats: 24,
    ingredients: [{name:'tuna steak',quantity:180,unit:'g'},{name:'mango',quantity:80,unit:'g'},{name:'red onion',quantity:20,unit:'g'},{name:'jalapeño',quantity:0.5,unit:'pcs'},{name:'cilantro',quantity:5,unit:'g'},{name:'lime juice',quantity:15,unit:'ml'},{name:'sweet potato',quantity:150,unit:'g'},{name:'olive oil',quantity:10,unit:'ml'}],
    instructions: 'Sear tuna 1-2 min each side. Dice mango, onion, jalapeño, cilantro, toss with lime for salsa. Bake sweet potato wedges. Serve tuna with mango salsa and sweet potato.',
    dietTags: ['pescatarian','gluten_free','paleo','anti_inflammatory'], equipment: ['stovetop','oven'], skillLevel: 'intermediate', costEstimate: 'medium'
  },
  {
    id: 'd47', title: 'One-Pot Chicken & Orzo', category: 'dinner',
    calories: 620, protein: 44, carbs: 64, fats: 20,
    ingredients: [{name:'chicken thighs',quantity:200,unit:'g'},{name:'orzo',quantity:100,unit:'g'},{name:'spinach',quantity:60,unit:'g'},{name:'sun-dried tomatoes',quantity:20,unit:'g'},{name:'garlic',quantity:5,unit:'g'},{name:'chicken broth',quantity:300,unit:'ml'},{name:'lemon juice',quantity:10,unit:'ml'},{name:'parmesan',quantity:15,unit:'g'}],
    instructions: 'Sear chicken, set aside. Sauté garlic, add broth and orzo. Cook 10 min. Return chicken, add sun-dried tomatoes, spinach, lemon. Cook until orzo tender. Top with parmesan.',
    dietTags: ['balanced','mediterranean','muscle_gain'], equipment: ['stovetop'], skillLevel: 'intermediate', costEstimate: 'low'
  },
  {
    id: 'd48', title: 'Korean Beef Bulgogi', category: 'dinner',
    calories: 640, protein: 42, carbs: 62, fats: 24,
    ingredients: [{name:'beef sirloin',quantity:200,unit:'g'},{name:'soy sauce',quantity:20,unit:'ml'},{name:'sesame oil',quantity:5,unit:'ml'},{name:'garlic',quantity:5,unit:'g'},{name:'ginger',quantity:5,unit:'g'},{name:'pear',quantity:0.25,unit:'pcs'},{name:'short grain rice',quantity:120,unit:'g'},{name:'kimchi',quantity:40,unit:'g'},{name:'green onions',quantity:2,unit:'pcs'}],
    instructions: 'Thinly slice beef. Marinate in soy, sesame oil, garlic, ginger, grated pear for 30 min. Pan-fry quickly over high heat. Cook rice. Serve with kimchi and green onions.',
    dietTags: ['balanced','muscle_gain','gluten_free'], equipment: ['stovetop'], skillLevel: 'intermediate', costEstimate: 'medium'
  },
  {
    id: 'd49', title: 'Baked Feta Pasta', category: 'dinner',
    calories: 580, protein: 22, carbs: 64, fats: 28,
    ingredients: [{name:'feta cheese',quantity:100,unit:'g'},{name:'cherry tomatoes',quantity:200,unit:'g'},{name:'whole wheat penne',quantity:100,unit:'g'},{name:'garlic',quantity:5,unit:'g'},{name:'olive oil',quantity:15,unit:'ml'},{name:'basil',quantity:10,unit:'g'},{name:'chili flakes',quantity:1,unit:'g'}],
    instructions: 'Place feta in center of baking dish, surround with tomatoes, garlic. Drizzle olive oil, add chili. Bake at 200°C for 25 min. Cook pasta. Mash feta and tomatoes, toss with pasta and basil.',
    dietTags: ['vegetarian','mediterranean'], equipment: ['oven','stovetop'], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 'd50', title: 'Lemon Garlic Butter Scallops', category: 'dinner',
    calories: 540, protein: 36, carbs: 44, fats: 26,
    ingredients: [{name:'sea scallops',quantity:200,unit:'g'},{name:'butter',quantity:20,unit:'g'},{name:'garlic',quantity:5,unit:'g'},{name:'lemon juice',quantity:15,unit:'ml'},{name:'asparagus',quantity:120,unit:'g'},{name:'risotto rice',quantity:80,unit:'g'},{name:'white wine',quantity:30,unit:'ml'},{name:'parmesan',quantity:15,unit:'g'}],
    instructions: 'Make risotto: toast rice, add wine, gradually add broth, stir in parmesan. Sear scallops in butter 2 min each side. Add garlic, lemon. Roast asparagus. Serve scallops over risotto with asparagus.',
    dietTags: ['pescatarian','gluten_free','mediterranean'], equipment: ['stovetop','oven'], skillLevel: 'advanced', costEstimate: 'high'
  },

  // ===== NEW SNACKS (10 meals) =====
  {
    id: 's16', title: 'Roasted Chickpeas', category: 'snack',
    calories: 220, protein: 12, carbs: 30, fats: 6,
    ingredients: [{name:'chickpeas',quantity:150,unit:'g'},{name:'olive oil',quantity:5,unit:'ml'},{name:'paprika',quantity:2,unit:'g'},{name:'cumin',quantity:1,unit:'g'},{name:'garlic powder',quantity:1,unit:'g'}],
    instructions: 'Drain and dry chickpeas. Toss with olive oil and spices. Roast at 200°C for 25-30 min until crunchy.',
    dietTags: ['vegan','vegetarian','gluten_free','balanced','anti_inflammatory','dash'], equipment: ['oven'], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 's17', title: 'Caprese Skewers', category: 'snack',
    calories: 240, protein: 14, carbs: 8, fats: 18,
    ingredients: [{name:'fresh mozzarella',quantity:60,unit:'g'},{name:'cherry tomatoes',quantity:80,unit:'g'},{name:'fresh basil',quantity:5,unit:'g'},{name:'balsamic glaze',quantity:5,unit:'ml'},{name:'olive oil',quantity:5,unit:'ml'}],
    instructions: 'Thread mozzarella balls, cherry tomatoes, and basil leaves onto small skewers. Drizzle with balsamic glaze and olive oil.',
    dietTags: ['vegetarian','gluten_free','low_carb','keto','mediterranean'], equipment: [], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 's18', title: 'Guacamole & Veggies', category: 'snack',
    calories: 260, protein: 6, carbs: 22, fats: 18,
    ingredients: [{name:'avocado',quantity:0.5,unit:'pcs'},{name:'lime juice',quantity:10,unit:'ml'},{name:'tomato',quantity:0.5,unit:'pcs'},{name:'onion',quantity:20,unit:'g'},{name:'cilantro',quantity:3,unit:'g'},{name:'carrot sticks',quantity:50,unit:'g'},{name:'bell pepper strips',quantity:50,unit:'g'}],
    instructions: 'Mash avocado with lime, diced tomato, onion, cilantro. Serve with carrot sticks and pepper strips for dipping.',
    dietTags: ['vegan','vegetarian','gluten_free','paleo','keto','low_carb','anti_inflammatory'], equipment: [], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 's19', title: 'Dates & Almond Butter', category: 'snack',
    calories: 280, protein: 6, carbs: 42, fats: 12,
    ingredients: [{name:'Medjool dates',quantity:3,unit:'pcs'},{name:'almond butter',quantity:15,unit:'g'},{name:'sea salt flakes',quantity:0.5,unit:'g'}],
    instructions: 'Pit dates, fill each with almond butter. Sprinkle with a pinch of sea salt.',
    dietTags: ['vegan','vegetarian','gluten_free','balanced','paleo'], equipment: [], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 's20', title: 'Tzatziki & Cucumber', category: 'snack',
    calories: 180, protein: 12, carbs: 14, fats: 8,
    ingredients: [{name:'Greek yogurt',quantity:120,unit:'g'},{name:'cucumber',quantity:1,unit:'pcs'},{name:'garlic',quantity:2,unit:'g'},{name:'dill',quantity:2,unit:'g'},{name:'lemon juice',quantity:5,unit:'ml'},{name:'olive oil',quantity:3,unit:'ml'}],
    instructions: 'Grate cucumber, squeeze dry. Mix with yogurt, garlic, dill, lemon, olive oil. Serve with extra cucumber slices for dipping.',
    dietTags: ['vegetarian','gluten_free','low_carb','mediterranean','dash','diabetic'], equipment: [], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 's21', title: 'Seaweed & Sesame Rice Balls', category: 'snack',
    calories: 240, protein: 6, carbs: 42, fats: 6,
    ingredients: [{name:'sushi rice',quantity:100,unit:'g'},{name:'nori sheets',quantity:1,unit:'pcs'},{name:'sesame seeds',quantity:5,unit:'g'},{name:'soy sauce',quantity:5,unit:'ml'},{name:'rice vinegar',quantity:5,unit:'ml'}],
    instructions: 'Cook and season rice with vinegar. Shape into balls, roll in sesame seeds. Wrap with nori strips. Serve with soy sauce.',
    dietTags: ['vegan','vegetarian','gluten_free','balanced'], equipment: ['stovetop'], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 's22', title: 'Stuffed Dates with Goat Cheese', category: 'snack',
    calories: 260, protein: 8, carbs: 36, fats: 10,
    ingredients: [{name:'Medjool dates',quantity:4,unit:'pcs'},{name:'goat cheese',quantity:30,unit:'g'},{name:'walnuts',quantity:10,unit:'g'},{name:'honey',quantity:5,unit:'ml'}],
    instructions: 'Pit dates, stuff with goat cheese and a walnut piece. Drizzle lightly with honey.',
    dietTags: ['vegetarian','gluten_free','balanced','mediterranean'], equipment: [], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 's23', title: 'Mango Lassi', category: 'snack',
    calories: 220, protein: 10, carbs: 36, fats: 4,
    ingredients: [{name:'mango',quantity:100,unit:'g'},{name:'plain yogurt',quantity:120,unit:'g'},{name:'milk',quantity:50,unit:'ml'},{name:'cardamom',quantity:1,unit:'g'},{name:'honey',quantity:5,unit:'ml'}],
    instructions: 'Blend mango, yogurt, milk, cardamom, and honey until smooth. Serve chilled.',
    dietTags: ['vegetarian','gluten_free','balanced'], equipment: ['blender'], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 's24', title: 'Baked Sweet Potato Fries', category: 'snack',
    calories: 240, protein: 4, carbs: 42, fats: 8,
    ingredients: [{name:'sweet potato',quantity:200,unit:'g'},{name:'olive oil',quantity:5,unit:'ml'},{name:'paprika',quantity:2,unit:'g'},{name:'garlic powder',quantity:1,unit:'g'},{name:'salt',quantity:1,unit:'g'}],
    instructions: 'Cut sweet potato into thin fries. Toss with olive oil and spices. Bake at 210°C for 20-25 min, flipping halfway.',
    dietTags: ['vegan','vegetarian','gluten_free','paleo','balanced'], equipment: ['oven'], skillLevel: 'beginner', costEstimate: 'low'
  },
  {
    id: 's25', title: 'Frozen Yogurt Bark', category: 'snack',
    calories: 200, protein: 14, carbs: 24, fats: 6,
    ingredients: [{name:'Greek yogurt',quantity:150,unit:'g'},{name:'berries',quantity:60,unit:'g'},{name:'pistachios',quantity:10,unit:'g'},{name:'honey',quantity:5,unit:'ml'},{name:'dark chocolate chips',quantity:10,unit:'g'}],
    instructions: 'Spread yogurt on parchment-lined tray. Top with berries, pistachios, chocolate chips, honey drizzle. Freeze 3+ hours. Break into pieces.',
    dietTags: ['vegetarian','gluten_free','balanced','dash'], equipment: [], skillLevel: 'beginner', costEstimate: 'low'
  },

  // ===== NO-COOK MEALS (5 meals) =====
  {
    id: 'nc_1', title: 'Greek Yogurt Parfait', category: 'breakfast',
    calories: 320, protein: 22, carbs: 42, fats: 8,
    ingredients: [{name:'Greek yogurt',quantity:200,unit:'g'},{name:'granola',quantity:40,unit:'g'},{name:'mixed berries',quantity:80,unit:'g'},{name:'honey',quantity:15,unit:'ml'}],
    instructions: 'Layer yogurt, granola, and berries in a glass or bowl. Drizzle honey on top. Serve immediately or refrigerate overnight.',
    dietTags: ['vegetarian','gluten_free','balanced'], equipment: [], skillLevel: 'beginner', costEstimate: 'low', prepTime: 5, noCook: true
  },
  {
    id: 'nc_2', title: 'Chicken Caesar Wrap', category: 'lunch',
    calories: 420, protein: 32, carbs: 35, fats: 16,
    ingredients: [{name:'tortilla wrap',quantity:1,unit:'pcs'},{name:'pre-cooked chicken strips',quantity:100,unit:'g'},{name:'romaine lettuce',quantity:50,unit:'g'},{name:'parmesan cheese',quantity:15,unit:'g'},{name:'caesar dressing',quantity:15,unit:'ml'}],
    instructions: 'Lay tortilla flat. Layer lettuce, chicken strips, and parmesan. Drizzle caesar dressing. Roll tightly and slice in half.',
    dietTags: ['balanced','muscle_gain'], equipment: [], skillLevel: 'beginner', costEstimate: 'low', prepTime: 7, noCook: true
  },
  {
    id: 'nc_3', title: 'Tuna & White Bean Salad', category: 'lunch',
    calories: 380, protein: 30, carbs: 28, fats: 14,
    ingredients: [{name:'canned tuna',quantity:120,unit:'g'},{name:'canned white beans',quantity:100,unit:'g'},{name:'cherry tomatoes',quantity:80,unit:'g'},{name:'red onion',quantity:30,unit:'g'},{name:'olive oil',quantity:15,unit:'ml'}],
    instructions: 'Drain tuna and white beans. Halve cherry tomatoes and thinly slice red onion. Combine all in a bowl and drizzle with olive oil. Toss gently and serve.',
    dietTags: ['pescatarian','gluten_free','mediterranean','balanced'], equipment: [], skillLevel: 'beginner', costEstimate: 'low', prepTime: 8, noCook: true
  },
  {
    id: 'nc_4', title: 'Overnight Oats', category: 'breakfast',
    calories: 350, protein: 14, carbs: 52, fats: 10,
    ingredients: [{name:'rolled oats',quantity:60,unit:'g'},{name:'milk',quantity:150,unit:'ml'},{name:'chia seeds',quantity:15,unit:'ml'},{name:'banana',quantity:1,unit:'pcs'},{name:'peanut butter',quantity:15,unit:'ml'}],
    instructions: 'Combine oats, milk, and chia seeds in a jar. Stir well, seal, and refrigerate overnight. In the morning, top with sliced banana and peanut butter.',
    dietTags: ['vegetarian','vegan','balanced'], equipment: [], skillLevel: 'beginner', costEstimate: 'low', prepTime: 5, noCook: true
  },
  {
    id: 'nc_5', title: 'Caprese Sandwich', category: 'dinner',
    calories: 400, protein: 18, carbs: 38, fats: 20,
    ingredients: [{name:'ciabatta roll',quantity:1,unit:'pcs'},{name:'fresh mozzarella',quantity:80,unit:'g'},{name:'tomato',quantity:1,unit:'pcs'},{name:'fresh basil',quantity:4,unit:'leaves'},{name:'balsamic glaze',quantity:15,unit:'ml'}],
    instructions: 'Slice ciabatta roll in half. Layer mozzarella slices, tomato slices, and basil leaves. Drizzle with balsamic glaze. Close sandwich and serve.',
    dietTags: ['vegetarian','mediterranean'], equipment: [], skillLevel: 'beginner', costEstimate: 'low', prepTime: 5, noCook: true
  },

  // ===== FOOTBALL-SPECIFIC RECIPES (10) =====

  // PRE-MATCH MEALS
  {
    id: 'fm_1', title: 'Match Day Pasta', category: 'lunch',
    calories: 620, protein: 35, carbs: 88, fats: 12,
    ingredients: [{name:'pasta',quantity:120,unit:'g'},{name:'chicken breast',quantity:120,unit:'g'},{name:'tomato passata',quantity:150,unit:'ml'},{name:'olive oil',quantity:1,unit:'tsp'},{name:'parmesan cheese',quantity:10,unit:'g'}],
    instructions: 'Cook pasta al dente. Dice and pan-fry chicken in olive oil until cooked through. Add passata, simmer 5 minutes. Toss with pasta and top with parmesan.',
    dietTags: ['balanced','mediterranean'], equipment: ['stovetop','pot','pan'], skillLevel: 'beginner', costEstimate: 'low', prepTime: 20
  },
  {
    id: 'fm_2', title: 'Pre-Match Rice Bowl', category: 'lunch',
    calories: 580, protein: 30, carbs: 92, fats: 8,
    ingredients: [{name:'rice',quantity:150,unit:'g'},{name:'chicken breast',quantity:100,unit:'g'},{name:'sweet potato',quantity:100,unit:'g'},{name:'soy sauce',quantity:1,unit:'tbsp'},{name:'honey',quantity:1,unit:'tsp'}],
    instructions: 'Cook rice. Cube sweet potato and boil until soft. Slice chicken, cook in pan with soy sauce and honey. Assemble bowl: rice base, sweet potato, glazed chicken.',
    dietTags: ['balanced'], equipment: ['stovetop','pot','pan'], skillLevel: 'beginner', costEstimate: 'low', prepTime: 25
  },

  // POST-MATCH RECOVERY
  {
    id: 'fm_3', title: 'Recovery Chocolate Smoothie', category: 'snack',
    calories: 380, protein: 28, carbs: 52, fats: 8,
    ingredients: [{name:'banana',quantity:1,unit:'pcs'},{name:'milk',quantity:300,unit:'ml'},{name:'cocoa powder',quantity:1,unit:'tbsp'},{name:'peanut butter',quantity:1,unit:'tbsp'},{name:'honey',quantity:1,unit:'tbsp'}],
    instructions: 'Blend all ingredients until smooth. Drink within 30 minutes of finishing the match.',
    dietTags: ['vegetarian'], equipment: ['blender'], skillLevel: 'beginner', costEstimate: 'low', prepTime: 5, noCook: true
  },
  {
    id: 'fm_4', title: 'Post-Match Chicken & Rice Recovery Bowl', category: 'dinner',
    calories: 650, protein: 42, carbs: 78, fats: 14,
    ingredients: [{name:'rice',quantity:150,unit:'g'},{name:'chicken breast',quantity:150,unit:'g'},{name:'broccoli',quantity:80,unit:'g'},{name:'soy sauce',quantity:1,unit:'tbsp'},{name:'olive oil',quantity:1,unit:'tsp'}],
    instructions: 'Cook rice. Steam broccoli. Slice and pan-fry chicken with soy sauce. Combine in bowl, drizzle olive oil.',
    dietTags: ['balanced'], equipment: ['stovetop','pot','pan'], skillLevel: 'beginner', costEstimate: 'medium', prepTime: 25
  },

  // TRAINING DAY
  {
    id: 'fm_5', title: 'Footballer\'s Overnight Oats', category: 'breakfast',
    calories: 450, protein: 22, carbs: 65, fats: 12,
    ingredients: [{name:'rolled oats',quantity:80,unit:'g'},{name:'milk',quantity:200,unit:'ml'},{name:'banana',quantity:1,unit:'pcs'},{name:'honey',quantity:1,unit:'tbsp'},{name:'mixed berries',quantity:60,unit:'g'}],
    instructions: 'Mix oats and milk in a jar. Refrigerate overnight. Top with sliced banana, berries, and honey in the morning.',
    dietTags: ['vegetarian','balanced'], equipment: [], skillLevel: 'beginner', costEstimate: 'low', prepTime: 5, noCook: true
  },
  {
    id: 'fm_6', title: 'High-Protein Training Day Wrap', category: 'lunch',
    calories: 520, protein: 38, carbs: 48, fats: 18,
    ingredients: [{name:'tortilla wrap',quantity:1,unit:'pcs'},{name:'chicken breast',quantity:130,unit:'g'},{name:'avocado',quantity:0.5,unit:'pcs'},{name:'spinach',quantity:30,unit:'g'},{name:'greek yogurt',quantity:30,unit:'g'}],
    instructions: 'Slice and cook chicken. Mash avocado and spread on wrap. Layer spinach, chicken, dollop of yogurt. Roll tightly and slice.',
    dietTags: ['balanced'], equipment: ['stovetop'], skillLevel: 'beginner', costEstimate: 'medium', prepTime: 10
  },

  // REST / RECOVERY DAY
  {
    id: 'fm_7', title: 'Anti-Inflammatory Salmon Bowl', category: 'dinner',
    calories: 520, protein: 36, carbs: 42, fats: 22,
    ingredients: [{name:'salmon fillet',quantity:130,unit:'g'},{name:'quinoa',quantity:70,unit:'g'},{name:'spinach',quantity:50,unit:'g'},{name:'lemon',quantity:0.5,unit:'pcs'},{name:'olive oil',quantity:1,unit:'tbsp'}],
    instructions: 'Cook quinoa per package instructions. Pan-sear salmon with olive oil, 4 min per side. Wilt spinach in the same pan. Assemble bowl, squeeze lemon over top.',
    dietTags: ['pescatarian','mediterranean','gluten_free'], equipment: ['stovetop','pan','pot'], skillLevel: 'beginner', costEstimate: 'high', prepTime: 25
  },
  {
    id: 'fm_8', title: 'Recovery Berry Protein Bowl', category: 'breakfast',
    calories: 380, protein: 28, carbs: 48, fats: 10,
    ingredients: [{name:'greek yogurt',quantity:200,unit:'g'},{name:'mixed berries',quantity:100,unit:'g'},{name:'granola',quantity:30,unit:'g'},{name:'honey',quantity:1,unit:'tsp'},{name:'chia seeds',quantity:1,unit:'tbsp'}],
    instructions: 'Add yogurt to a bowl. Top with berries, granola, chia seeds. Drizzle honey.',
    dietTags: ['vegetarian','gluten_free'], equipment: [], skillLevel: 'beginner', costEstimate: 'medium', prepTime: 5, noCook: true
  },

  // CARB-LOADING / PRE-SEASON
  {
    id: 'fm_9', title: 'Carb-Load Chicken Penne', category: 'dinner',
    calories: 720, protein: 40, carbs: 98, fats: 16,
    ingredients: [{name:'penne pasta',quantity:150,unit:'g'},{name:'chicken breast',quantity:140,unit:'g'},{name:'bell pepper',quantity:1,unit:'pcs'},{name:'canned tomatoes',quantity:200,unit:'ml'},{name:'olive oil',quantity:1,unit:'tbsp'}],
    instructions: 'Cook penne al dente. Dice chicken and bell pepper, sauté in olive oil. Add canned tomatoes, simmer 8 minutes. Toss with pasta.',
    dietTags: ['balanced'], equipment: ['stovetop','pot','pan'], skillLevel: 'beginner', costEstimate: 'medium', prepTime: 20
  },

  // QUICK ENERGY / SNACK
  {
    id: 'fm_10', title: 'Banana & PB Energy Toast', category: 'snack',
    calories: 320, protein: 12, carbs: 42, fats: 14,
    ingredients: [{name:'bread',quantity:2,unit:'slices'},{name:'peanut butter',quantity:1,unit:'tbsp'},{name:'banana',quantity:1,unit:'pcs'},{name:'honey',quantity:1,unit:'tsp'}],
    instructions: 'Toast bread. Spread peanut butter. Slice banana on top. Drizzle honey.',
    dietTags: ['vegetarian','vegan'], equipment: [], skillLevel: 'beginner', costEstimate: 'low', prepTime: 3, noCook: true
  },
];
