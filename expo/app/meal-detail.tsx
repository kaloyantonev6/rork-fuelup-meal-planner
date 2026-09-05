import React, { useRef, useEffect, useCallback, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  Alert,
  Modal,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import {
  ArrowLeft,
  Heart,
  Flame,
  Clock,
  ChefHat,
  RefreshCw,
  Crown,
  Dumbbell,
  Wheat,
  Droplets,
  Lightbulb,
  Shuffle,
  Play,
  Lock,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useSavedPlans } from "@/providers/SavedPlansProvider";
import { GeneratedMeal } from "@/utils/mealGenerator";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface SubstituteOption {
  name: string;
  note: string;
}

interface IngredientSubstitutes {
  [key: string]: SubstituteOption[];
}

const SUBSTITUTES_DB: IngredientSubstitutes = {
  "chicken breast": [
    { name: "Turkey breast", note: "Similar protein, leaner" },
    { name: "Tofu (firm)", note: "Plant-based, press well" },
    { name: "Tempeh", note: "Fermented, nutty flavor" },
    { name: "Cod fillet", note: "White fish, mild taste" },
  ],
  "chicken": [
    { name: "Turkey", note: "Similar taste and texture" },
    { name: "Tofu", note: "Plant-based alternative" },
    { name: "Seitan", note: "High protein, wheat-based" },
  ],
  "chicken thighs": [
    { name: "Chicken breast", note: "Leaner cut" },
    { name: "Turkey thighs", note: "Similar flavor" },
    { name: "Pork tenderloin", note: "Juicy alternative" },
  ],
  "salmon": [
    { name: "Trout", note: "Similar omega-3 content" },
    { name: "Arctic char", note: "Mild, pink flesh" },
    { name: "Mackerel", note: "Rich in omega-3" },
    { name: "Tuna steak", note: "Firmer texture" },
  ],
  "salmon fillet": [
    { name: "Trout fillet", note: "Similar taste" },
    { name: "Cod fillet", note: "Milder, less fat" },
    { name: "Sea bass", note: "Delicate flavor" },
  ],
  "wild salmon": [
    { name: "Trout", note: "Similar omega-3" },
    { name: "Arctic char", note: "Sustainable choice" },
    { name: "Mackerel", note: "Budget-friendly omega-3" },
  ],
  "wild salmon fillet": [
    { name: "Trout fillet", note: "Similar omega-3" },
    { name: "Mackerel fillet", note: "Rich flavor" },
  ],
  "beef": [
    { name: "Bison", note: "Leaner, similar taste" },
    { name: "Turkey mince", note: "Lower fat" },
    { name: "Mushrooms (portobello)", note: "Meaty texture, plant-based" },
  ],
  "ground beef": [
    { name: "Ground turkey", note: "Leaner option" },
    { name: "Ground bison", note: "Similar, less fat" },
    { name: "Lentils", note: "Plant-based, high fiber" },
  ],
  "lean ground beef": [
    { name: "Ground turkey", note: "Even leaner" },
    { name: "Ground chicken", note: "Mild flavor" },
    { name: "Lentils", note: "Vegan protein source" },
  ],
  "ground beef 80/20": [
    { name: "Ground turkey", note: "Leaner" },
    { name: "Ground lamb", note: "Richer flavor" },
  ],
  "lean beef strips": [
    { name: "Chicken strips", note: "Lighter option" },
    { name: "Tofu strips", note: "Plant-based" },
  ],
  "sirloin steak": [
    { name: "Flank steak", note: "Leaner cut" },
    { name: "NY strip", note: "More marbled" },
    { name: "Portobello mushroom", note: "Grillable, vegan" },
  ],
  "ribeye steak": [
    { name: "Sirloin steak", note: "Leaner alternative" },
    { name: "NY strip", note: "Less marbling" },
  ],
  "beef liver": [
    { name: "Chicken liver", note: "Milder taste" },
    { name: "Lamb liver", note: "Similar nutrients" },
  ],
  "beef chuck roast": [
    { name: "Pork shoulder", note: "Slow cooks well" },
    { name: "Lamb shoulder", note: "Rich flavor" },
  ],
  "lamb loin chops": [
    { name: "Pork chops", note: "Milder flavor" },
    { name: "Veal chops", note: "Tender, delicate" },
  ],
  "pork belly": [
    { name: "Beef brisket", note: "Slow cook similarly" },
    { name: "Chicken thighs", note: "Crispy skin option" },
  ],
  "bacon": [
    { name: "Turkey bacon", note: "Lower fat" },
    { name: "Tempeh bacon", note: "Plant-based" },
    { name: "Prosciutto", note: "Thinner, Italian style" },
  ],
  "eggs": [
    { name: "Egg whites (extra)", note: "Lower calorie" },
    { name: "Tofu scramble", note: "Vegan option" },
    { name: "Chickpea flour omelet", note: "Gluten-free vegan" },
  ],
  "egg whites": [
    { name: "Whole eggs", note: "More nutrients" },
    { name: "Aquafaba", note: "Vegan whipping sub" },
  ],
  "greek yogurt": [
    { name: "Skyr", note: "Icelandic, thick & high protein" },
    { name: "Cottage cheese", note: "Similar protein" },
    { name: "Coconut yogurt", note: "Dairy-free" },
  ],
  "plain greek yogurt": [
    { name: "Skyr", note: "Higher protein" },
    { name: "Cottage cheese", note: "Similar macros" },
  ],
  "low-fat greek yogurt": [
    { name: "Skyr", note: "Naturally low fat" },
    { name: "Quark", note: "European style" },
  ],
  "skyr or greek yogurt": [
    { name: "Cottage cheese", note: "Similar protein" },
    { name: "Quark", note: "Creamy texture" },
  ],
  "cottage cheese": [
    { name: "Ricotta", note: "Creamier texture" },
    { name: "Greek yogurt", note: "Thicker consistency" },
    { name: "Skyr", note: "High protein" },
  ],
  "low-fat cottage cheese": [
    { name: "Greek yogurt (0%)", note: "Similar protein" },
    { name: "Skyr", note: "Thick and creamy" },
  ],
  "milk": [
    { name: "Oat milk", note: "Creamy, plant-based" },
    { name: "Almond milk", note: "Lower calorie" },
    { name: "Soy milk", note: "Closest protein match" },
  ],
  "low-fat milk": [
    { name: "Oat milk", note: "Plant-based" },
    { name: "Soy milk", note: "Higher protein" },
  ],
  "almond milk": [
    { name: "Oat milk", note: "Creamier" },
    { name: "Coconut milk", note: "Richer flavor" },
    { name: "Soy milk", note: "More protein" },
  ],
  "cheese": [
    { name: "Nutritional yeast", note: "Vegan, cheesy flavor" },
    { name: "Goat cheese", note: "Easier to digest" },
  ],
  "feta": [
    { name: "Goat cheese", note: "Tangy, crumbly" },
    { name: "Vegan feta", note: "Dairy-free" },
  ],
  "feta cheese": [
    { name: "Goat cheese", note: "Similar tanginess" },
    { name: "Ricotta salata", note: "Firm, salty" },
  ],
  "halloumi": [
    { name: "Paneer", note: "Similar grilling cheese" },
    { name: "Firm tofu", note: "Plant-based, pan-fry" },
  ],
  "parmesan": [
    { name: "Pecorino Romano", note: "Similar sharpness" },
    { name: "Nutritional yeast", note: "Vegan option" },
  ],
  "butter": [
    { name: "Ghee", note: "Lactose-free, high smoke point" },
    { name: "Coconut oil", note: "Vegan, tropical flavor" },
    { name: "Olive oil", note: "Heart-healthy fat" },
  ],
  "cream": [
    { name: "Coconut cream", note: "Dairy-free, rich" },
    { name: "Cashew cream", note: "Nutty, vegan" },
  ],
  "rice": [
    { name: "Quinoa", note: "Complete protein" },
    { name: "Cauliflower rice", note: "Low carb" },
    { name: "Bulgur wheat", note: "Higher fiber" },
  ],
  "jasmine rice": [
    { name: "Basmati rice", note: "Lower glycemic index" },
    { name: "Quinoa", note: "More protein" },
    { name: "Cauliflower rice", note: "Low carb option" },
  ],
  "basmati rice": [
    { name: "Jasmine rice", note: "Stickier texture" },
    { name: "Quinoa", note: "Complete protein" },
  ],
  "brown rice": [
    { name: "Quinoa", note: "Complete protein" },
    { name: "Farro", note: "Nutty, chewy" },
  ],
  "oats": [
    { name: "Quinoa flakes", note: "Gluten-free" },
    { name: "Buckwheat groats", note: "Nutty flavor" },
    { name: "Chia pudding", note: "No-cook option" },
  ],
  "rolled oats": [
    { name: "Steel-cut oats", note: "Chewier texture" },
    { name: "Quinoa flakes", note: "Gluten-free" },
  ],
  "steel-cut oatmeal": [
    { name: "Rolled oats", note: "Quicker cooking" },
    { name: "Buckwheat", note: "Gluten-free" },
  ],
  "oatmeal": [
    { name: "Quinoa porridge", note: "Higher protein" },
    { name: "Amaranth porridge", note: "Ancient grain" },
  ],
  "quinoa": [
    { name: "Couscous", note: "Lighter, faster" },
    { name: "Bulgur", note: "Similar texture" },
    { name: "Brown rice", note: "Budget-friendly" },
  ],
  "pasta": [
    { name: "Zucchini noodles", note: "Low carb" },
    { name: "Chickpea pasta", note: "High protein" },
    { name: "Rice noodles", note: "Gluten-free" },
  ],
  "whole wheat pasta": [
    { name: "Chickpea pasta", note: "Higher protein" },
    { name: "Lentil pasta", note: "Gluten-free option" },
  ],
  "whole-grain pasta": [
    { name: "Lentil pasta", note: "More protein" },
    { name: "Zucchini noodles", note: "Low carb" },
  ],
  "whole wheat spaghetti": [
    { name: "Chickpea spaghetti", note: "High protein" },
    { name: "Zucchini noodles", note: "Low carb" },
  ],
  "whole grain toast": [
    { name: "Sourdough", note: "Easier to digest" },
    { name: "Rice cakes", note: "Gluten-free" },
    { name: "Sweet potato toast", note: "Nutrient-dense" },
  ],
  "whole grain bread": [
    { name: "Sourdough bread", note: "Lower GI" },
    { name: "Ezekiel bread", note: "Sprouted grains" },
  ],
  "bread": [
    { name: "Wraps", note: "Thinner option" },
    { name: "Rice cakes", note: "Gluten-free" },
  ],
  "whole wheat wrap": [
    { name: "Lettuce leaves", note: "Low carb wrap" },
    { name: "Collard greens", note: "Sturdy, green wrap" },
    { name: "Rice paper", note: "Gluten-free" },
  ],
  "potatoes": [
    { name: "Sweet potatoes", note: "Lower GI, more vitamins" },
    { name: "Cauliflower", note: "Low carb mash" },
    { name: "Parsnips", note: "Slightly sweeter" },
  ],
  "baby potatoes": [
    { name: "Sweet potato cubes", note: "More nutrients" },
    { name: "Turnips", note: "Lower carb" },
  ],
  "sweet potato": [
    { name: "Butternut squash", note: "Similar sweetness" },
    { name: "Regular potato", note: "Budget-friendly" },
    { name: "Parsnips", note: "Root veggie swap" },
  ],
  "sweet potatoes": [
    { name: "Butternut squash", note: "Similar nutrients" },
    { name: "Parsnips", note: "Sweet root veg" },
  ],
  "broccoli": [
    { name: "Cauliflower", note: "Milder flavor" },
    { name: "Broccolini", note: "More tender" },
    { name: "Green beans", note: "Easy to prep" },
  ],
  "spinach": [
    { name: "Kale", note: "Heartier green" },
    { name: "Swiss chard", note: "Mild, colorful" },
    { name: "Arugula", note: "Peppery flavor" },
  ],
  "kale": [
    { name: "Spinach", note: "Softer texture" },
    { name: "Collard greens", note: "Sturdier leaves" },
  ],
  "mixed greens": [
    { name: "Spinach", note: "Nutrient-dense" },
    { name: "Arugula", note: "Peppery kick" },
  ],
  "baby spinach": [
    { name: "Mixed greens", note: "Variety of textures" },
    { name: "Arugula", note: "Peppery flavor" },
  ],
  "arugula": [
    { name: "Watercress", note: "Similar peppery taste" },
    { name: "Spinach", note: "Milder option" },
  ],
  "lettuce leaves": [
    { name: "Collard leaves", note: "Sturdier" },
    { name: "Butter lettuce", note: "Cup-shaped" },
  ],
  "avocado": [
    { name: "Hummus", note: "Creamy, plant-based" },
    { name: "Mashed banana (in baking)", note: "Sweet substitute" },
    { name: "Tahini", note: "Sesame-based, creamy" },
  ],
  "tomato": [
    { name: "Red bell pepper", note: "Sweet, crunchy" },
    { name: "Sun-dried tomatoes", note: "Concentrated flavor" },
  ],
  "tomatoes": [
    { name: "Roasted red peppers", note: "Sweet substitute" },
    { name: "Canned tomatoes", note: "Year-round option" },
  ],
  "cherry tomatoes": [
    { name: "Grape tomatoes", note: "Similar size" },
    { name: "Diced red pepper", note: "Colorful swap" },
  ],
  "bell peppers": [
    { name: "Zucchini", note: "Mild flavor" },
    { name: "Celery", note: "Crunchy texture" },
  ],
  "cucumber": [
    { name: "Celery", note: "Crunchy, refreshing" },
    { name: "Jicama", note: "Crisp, slightly sweet" },
  ],
  "mushrooms": [
    { name: "Eggplant", note: "Meaty texture" },
    { name: "Zucchini", note: "Mild, versatile" },
  ],
  "asparagus": [
    { name: "Green beans", note: "Similar shape" },
    { name: "Broccolini", note: "Tender stems" },
  ],
  "green beans": [
    { name: "Asparagus", note: "Elegant swap" },
    { name: "Sugar snap peas", note: "Sweet crunch" },
  ],
  "zucchini": [
    { name: "Yellow squash", note: "Nearly identical" },
    { name: "Eggplant", note: "Meatier texture" },
  ],
  "cauliflower rice": [
    { name: "Broccoli rice", note: "More fiber" },
    { name: "Riced zucchini", note: "Very low cal" },
  ],
  "olive oil": [
    { name: "Avocado oil", note: "Higher smoke point" },
    { name: "Coconut oil", note: "Different flavor profile" },
  ],
  "coconut flakes": [
    { name: "Toasted almonds", note: "Nutty crunch" },
    { name: "Hemp seeds", note: "Protein boost" },
  ],
  "walnuts": [
    { name: "Pecans", note: "Similar richness" },
    { name: "Almonds", note: "Milder flavor" },
    { name: "Pumpkin seeds", note: "Nut-free option" },
  ],
  "almonds": [
    { name: "Cashews", note: "Creamier" },
    { name: "Sunflower seeds", note: "Nut-free" },
  ],
  "peanut butter": [
    { name: "Almond butter", note: "Nut alternative" },
    { name: "Sunflower seed butter", note: "Nut-free" },
    { name: "Tahini", note: "Sesame-based" },
  ],
  "protein powder": [
    { name: "Collagen powder", note: "Joint support" },
    { name: "Pea protein", note: "Vegan" },
  ],
  "whey protein": [
    { name: "Pea protein", note: "Vegan option" },
    { name: "Casein protein", note: "Slow-release" },
    { name: "Hemp protein", note: "Plant-based, earthy" },
  ],
  "lentils": [
    { name: "Chickpeas", note: "Similar protein" },
    { name: "Black beans", note: "Heartier texture" },
  ],
  "red lentils": [
    { name: "Yellow lentils", note: "Similar cook time" },
    { name: "Split peas", note: "Thicker stew" },
  ],
  "cooked lentils": [
    { name: "Canned chickpeas", note: "Quick swap" },
    { name: "White beans", note: "Creamy texture" },
  ],
  "chickpeas": [
    { name: "White beans", note: "Milder flavor" },
    { name: "Lentils", note: "Quicker to cook" },
  ],
  "black beans": [
    { name: "Kidney beans", note: "Similar size" },
    { name: "Pinto beans", note: "Creamier" },
  ],
  "tofu": [
    { name: "Tempeh", note: "Fermented, firmer" },
    { name: "Seitan", note: "Wheat-based, chewy" },
    { name: "Paneer", note: "Indian cheese option" },
  ],
  "paneer or tofu": [
    { name: "Halloumi", note: "Grillable cheese" },
    { name: "Chickpea tofu", note: "Legume-based" },
  ],
  "tuna": [
    { name: "Canned salmon", note: "More omega-3" },
    { name: "Sardines", note: "Budget-friendly" },
    { name: "Chickpeas (mashed)", note: "Vegan tuna salad" },
  ],
  "cod fillet": [
    { name: "Haddock", note: "Similar mild flavor" },
    { name: "Tilapia", note: "Budget option" },
    { name: "Halibut", note: "Firmer texture" },
  ],
  "mackerel fillet": [
    { name: "Sardines", note: "Smaller, similar omega-3" },
    { name: "Herring", note: "Rich flavor" },
  ],
  "sardines": [
    { name: "Anchovies", note: "Stronger flavor" },
    { name: "Mackerel", note: "Larger fish" },
  ],
  "turkey mince": [
    { name: "Chicken mince", note: "Similar lean option" },
    { name: "Lentils", note: "Plant-based" },
  ],
  "ground turkey": [
    { name: "Ground chicken", note: "Similar leanness" },
    { name: "Crumbled tofu", note: "Vegan swap" },
  ],
  "sliced turkey": [
    { name: "Sliced chicken", note: "Similar protein" },
    { name: "Smoked salmon", note: "Omega-3 boost" },
  ],
  "lean turkey": [
    { name: "Lean chicken", note: "Very similar" },
    { name: "Turkey mince", note: "Ground option" },
  ],
  "honey": [
    { name: "Maple syrup", note: "Vegan option" },
    { name: "Agave nectar", note: "Lower GI" },
  ],
  "soy sauce": [
    { name: "Tamari", note: "Gluten-free" },
    { name: "Coconut aminos", note: "Soy-free, sweeter" },
  ],
  "tamari sauce": [
    { name: "Soy sauce", note: "Contains gluten" },
    { name: "Coconut aminos", note: "Soy-free" },
  ],
  "banana": [
    { name: "Plantain", note: "Starchier option" },
    { name: "Applesauce", note: "In baking" },
  ],
  "mixed berries": [
    { name: "Frozen berries", note: "Budget-friendly" },
    { name: "Pomegranate seeds", note: "Crunchy" },
  ],
  "berries": [
    { name: "Frozen berries", note: "Year-round option" },
    { name: "Chopped stone fruit", note: "Seasonal swap" },
  ],
  "fresh berries": [
    { name: "Frozen berries (thawed)", note: "Cheaper" },
    { name: "Sliced kiwi", note: "Tropical twist" },
  ],
  "blueberries": [
    { name: "Blackberries", note: "Similar antioxidants" },
    { name: "Raspberries", note: "Tart alternative" },
  ],
  "apple": [
    { name: "Pear", note: "Similar texture" },
    { name: "Peach", note: "Sweeter, softer" },
  ],
  "peaches": [
    { name: "Nectarines", note: "Smooth skin" },
    { name: "Apricots", note: "Smaller, tangy" },
  ],
  "dried figs": [
    { name: "Dates", note: "Sweeter, stickier" },
    { name: "Dried apricots", note: "Tangier" },
  ],
  "chia seeds": [
    { name: "Flaxseed", note: "Similar omega-3" },
    { name: "Hemp seeds", note: "More protein" },
  ],
  "flaxseed": [
    { name: "Chia seeds", note: "Similar nutrition" },
    { name: "Hemp seeds", note: "More protein" },
  ],
  "bone broth": [
    { name: "Vegetable broth", note: "Plant-based" },
    { name: "Miso broth", note: "Fermented, umami" },
  ],
  "bone marrow": [
    { name: "Butter", note: "Rich fat substitute" },
    { name: "Ghee", note: "Clarified butter" },
  ],
  "beef tallow": [
    { name: "Ghee", note: "Clarified butter" },
    { name: "Coconut oil", note: "High smoke point" },
  ],
  "ghee": [
    { name: "Clarified butter", note: "Same thing" },
    { name: "Coconut oil", note: "Dairy-free" },
  ],
};

const COOKING_TUTORIALS: Record<string, { steps: { title: string; duration: string; description: string }[] }> = {
  default: {
    steps: [
      { title: "Prep Ingredients", duration: "3-5 min", description: "Wash, peel, and chop all ingredients. Measure out spices and sauces." },
      { title: "Heat & Season", duration: "2-3 min", description: "Heat your pan or oven. Season proteins and vegetables as needed." },
      { title: "Cook Protein", duration: "5-10 min", description: "Cook your main protein to the correct internal temperature. Let rest if needed." },
      { title: "Cook Sides", duration: "5-8 min", description: "Prepare grains, vegetables, or other sides while protein rests." },
      { title: "Plate & Serve", duration: "2 min", description: "Arrange components on plate. Add garnishes and final seasonings." },
    ],
  },
};

function getSubstitutesForIngredient(ingredientText: string): SubstituteOption[] {
  const lower = ingredientText.toLowerCase();
  for (const key of Object.keys(SUBSTITUTES_DB)) {
    if (lower.includes(key)) {
      return SUBSTITUTES_DB[key];
    }
  }
  return [];
}

export default function MealDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ meal: string; isPremium: string }>();
  const { toggleFavorite, isFavorite } = useSavedPlans();

  const [meal, setMeal] = useState<GeneratedMeal | null>(null);
  const [showSimplified, setShowSimplified] = useState<boolean>(false);
  const [expandedIngredient, setExpandedIngredient] = useState<number | null>(null);
  const [showTutorialModal, setShowTutorialModal] = useState<boolean>(false);
  const [showPremiumModal, setShowPremiumModal] = useState<boolean>(false);
  const [showRegenPremiumModal, setShowRegenPremiumModal] = useState<boolean>(false);
  const simplifiedAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    try {
      if (params.meal) {
        const parsed = JSON.parse(params.meal) as GeneratedMeal;
        setMeal(parsed);
        console.log("[MealDetail] Loaded meal:", parsed.name);
      }
    } catch (e) {
      console.log("[MealDetail] Error parsing meal:", e);
    }
  }, [params.meal]);

  const isPremium = params.isPremium === "true";

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const heartScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 10, tension: 50, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleToggleFavorite = useCallback(() => {
    if (!meal) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.4, friction: 3, useNativeDriver: true }),
      Animated.spring(heartScale, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();
    toggleFavorite(meal);
  }, [meal, toggleFavorite, heartScale]);

  const handleToggleSimplified = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nextVal = !showSimplified;
    setShowSimplified(nextVal);
    Animated.spring(simplifiedAnim, {
      toValue: nextVal ? 1 : 0,
      friction: 8,
      tension: 60,
      useNativeDriver: false,
    }).start();
  }, [showSimplified, simplifiedAnim]);

  const simplifiedTip = useMemo(() => {
    if (!meal?.nutritionTip) return "";
    const tip = meal.nutritionTip.toLowerCase();
    const parts: string[] = [];

    if (tip.includes("protein")) parts.push("This meal has a good amount of protein, which helps your muscles grow and recover after exercise.");
    if (tip.includes("carb") || tip.includes("energy")) parts.push("It gives you steady energy throughout the day so you won't feel tired or hungry quickly.");
    if (tip.includes("fat") || tip.includes("healthy fat") || tip.includes("omega")) parts.push("The healthy fats in this meal are good for your brain and heart.");
    if (tip.includes("fiber") || tip.includes("digest")) parts.push("It contains fiber which helps your stomach work well and keeps you full longer.");
    if (tip.includes("vitamin") || tip.includes("nutrient") || tip.includes("mineral")) parts.push("This meal is packed with vitamins and minerals that keep your body healthy.");
    if (tip.includes("muscle")) parts.push("Great for building and maintaining muscle — especially if you exercise regularly.");
    if (tip.includes("weight") || tip.includes("deficit") || tip.includes("loss") || tip.includes("lean")) parts.push("This helps you manage your weight by keeping calories in check without starving yourself.");
    if (tip.includes("complex") || tip.includes("sustained") || tip.includes("slow")) parts.push("The energy from this meal is released slowly, keeping you fueled for hours.");

    if (parts.length === 0) parts.push("In simple terms: this is a well-balanced meal that gives your body what it needs to stay healthy and energized.");

    return "\u{1F9E0} In plain English: " + parts.slice(0, 2).join(" ");
  }, [meal?.nutritionTip]);

  const handleRegenerate = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!isPremium) {
      setShowRegenPremiumModal(true);
      return;
    }
    Alert.alert("Coming Soon", "Meal regeneration from the detail view will be available soon.");
  }, [isPremium]);

  const handleRegenUpgradePress = useCallback(() => {
    setShowRegenPremiumModal(false);
    router.push("/premium");
  }, [router]);

  const handleIngredientTap = useCallback((idx: number) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedIngredient((prev) => (prev === idx ? null : idx));
  }, []);

  const handleTutorialPress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!isPremium) {
      setShowPremiumModal(true);
    } else {
      setShowTutorialModal(true);
    }
  }, [isPremium]);

  const handleUpgradePress = useCallback(() => {
    setShowPremiumModal(false);
    router.push("/premium");
  }, [router]);

  if (!meal) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.errorText}>Meal not found</Text>
      </View>
    );
  }

  const isFav = isFavorite(meal.id);

  const getMealTypeColor = (type: string) => {
    switch (type) {
      case "breakfast": return "#F59E0B";
      case "lunch": return "#3B82F6";
      case "dinner": return "#8B5CF6";
      case "snack": return "#10B981";
      default: return Colors.primary;
    }
  };

  const getMealTypeLabel = (type: string) => {
    switch (type) {
      case "breakfast": return "Breakfast";
      case "lunch": return "Lunch";
      case "dinner": return "Dinner";
      case "snack": return "Snack";
      default: return type;
    }
  };

  const getDifficultyLabel = (d: string) => {
    switch (d) {
      case "beginner": return "Easy";
      case "intermediate": return "Medium";
      case "advanced": return "Advanced";
      default: return d;
    }
  };

  const typeColor = getMealTypeColor(meal.mealType);
  const tutorialSteps = COOKING_TUTORIALS.default.steps;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        bounces
      >
        <View style={styles.heroWrap}>
          <Image source={{ uri: meal.image }} style={styles.heroImage} contentFit="cover" />
          <View style={styles.heroOverlay} />

          <View style={[styles.heroTopBar, { top: insets.top + 8 }]}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.heroBtn, pressed && { opacity: 0.7 }]}
            >
              <ArrowLeft size={22} color="#fff" />
            </Pressable>
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Pressable
                onPress={handleToggleFavorite}
                style={({ pressed }) => [styles.heroBtn, pressed && { opacity: 0.7 }]}
              >
                <Heart
                  size={22}
                  color={isFav ? "#EF4444" : "#fff"}
                  fill={isFav ? "#EF4444" : "transparent"}
                />
              </Pressable>
            </Animated.View>
          </View>

          <View style={styles.heroBadgeRow}>
            <View style={[styles.mealTypeBadge, { backgroundColor: typeColor }]}>
              <Text style={styles.mealTypeBadgeText}>{getMealTypeLabel(meal.mealType)}</Text>
            </View>
          </View>
        </View>

        <Animated.View style={[styles.contentWrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.mealName}>{meal.name}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaPill}>
              <Clock size={14} color={Colors.textSecondary} />
              <Text style={styles.metaPillText}>{meal.prepTime} min</Text>
            </View>
            <View style={styles.metaPill}>
              <ChefHat size={14} color={Colors.textSecondary} />
              <Text style={styles.metaPillText}>{getDifficultyLabel(meal.difficulty)}</Text>
            </View>
            <View style={[styles.metaPill, { backgroundColor: `${typeColor}15` }]}>
              <Flame size={14} color={typeColor} />
              <Text style={[styles.metaPillText, { color: typeColor }]}>{meal.calories} kcal</Text>
            </View>
          </View>

          <View style={styles.macroCard}>
            <Text style={styles.macroCardTitle}>Macro Breakdown</Text>
            <View style={styles.macroGrid}>
              <View style={styles.macroItem}>
                <View style={[styles.macroIconWrap, { backgroundColor: "#FFF3EB" }]}>
                  <Flame size={18} color="#FF6B35" />
                </View>
                <Text style={styles.macroValue}>{meal.calories}</Text>
                <Text style={styles.macroLabel}>Calories</Text>
              </View>
              <View style={styles.macroItem}>
                <View style={[styles.macroIconWrap, { backgroundColor: "#FEF2F2" }]}>
                  <Dumbbell size={18} color="#E8734A" />
                </View>
                <Text style={styles.macroValue}>{meal.protein}g</Text>
                <Text style={styles.macroLabel}>Protein</Text>
              </View>
              <View style={styles.macroItem}>
                <View style={[styles.macroIconWrap, { backgroundColor: "#EFF6FF" }]}>
                  <Wheat size={18} color="#4A90D9" />
                </View>
                <Text style={styles.macroValue}>{meal.carbs}g</Text>
                <Text style={styles.macroLabel}>Carbs</Text>
              </View>
              <View style={styles.macroItem}>
                <View style={[styles.macroIconWrap, { backgroundColor: "#FFFBEB" }]}>
                  <Droplets size={18} color="#D4A44C" />
                </View>
                <Text style={styles.macroValue}>{meal.fat}g</Text>
                <Text style={styles.macroLabel}>Fats</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Ingredients</Text>
              <View style={styles.substituteHint}>
                <Shuffle size={12} color={Colors.primary} />
                <Text style={styles.substituteHintText}>Tap for substitutes</Text>
              </View>
            </View>
            <View style={styles.ingredientsList}>
              {meal.ingredientQuantities.map((ing, idx) => {
                const subs = getSubstitutesForIngredient(ing);
                const isExpanded = expandedIngredient === idx;
                const hasSubs = subs.length > 0;

                return (
                  <View key={`${ing}-${idx}`}>
                    <Pressable
                      onPress={() => hasSubs ? handleIngredientTap(idx) : undefined}
                      style={({ pressed }) => [
                        styles.ingredientRow,
                        hasSubs && pressed && { opacity: 0.7 },
                      ]}
                    >
                      <View style={styles.ingredientDot} />
                      <Text style={styles.ingredientText}>{ing}</Text>
                      {hasSubs && (
                        isExpanded
                          ? <ChevronUp size={16} color={Colors.primary} />
                          : <ChevronDown size={16} color={Colors.textTertiary} />
                      )}
                    </Pressable>

                    {isExpanded && hasSubs && (
                      <View style={styles.substitutesContainer}>
                        <View style={styles.substitutesHeader}>
                          <Shuffle size={13} color={Colors.primary} />
                          <Text style={styles.substitutesTitle}>Substitutes</Text>
                        </View>
                        {subs.map((sub, sIdx) => (
                          <View key={`sub-${sIdx}`} style={styles.substituteRow}>
                            <View style={styles.substituteArrow}>
                              <Text style={styles.substituteArrowText}>→</Text>
                            </View>
                            <View style={styles.substituteInfo}>
                              <Text style={styles.substituteName}>{sub.name}</Text>
                              <Text style={styles.substituteNote}>{sub.note}</Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            <View style={styles.instructionsList}>
              {meal.instructions.map((step, idx) => (
                <View key={`step-${idx}`} style={styles.instructionRow}>
                  <View style={styles.stepNumberWrap}>
                    <Text style={styles.stepNumber}>{idx + 1}</Text>
                  </View>
                  <Text style={styles.instructionText}>{step}</Text>
                </View>
              ))}
            </View>
          </View>

          <Pressable
            onPress={handleTutorialPress}
            style={({ pressed }) => [
              styles.tutorialBtn,
              pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
            ]}
            testID="tutorial-button"
          >
            <View style={styles.tutorialBtnContent}>
              <View style={styles.tutorialIconWrap}>
                <Play size={20} color="#fff" fill="#fff" />
              </View>
              <View style={styles.tutorialBtnTextWrap}>
                <Text style={styles.tutorialBtnTitle}>Cooking Tutorial</Text>
                <Text style={styles.tutorialBtnSubtitle}>Step-by-step guided video</Text>
              </View>
            </View>
            {!isPremium && (
              <View style={styles.tutorialLockOverlay}>
                <View style={styles.tutorialLockBadge}>
                  <Lock size={14} color="#D4A44C" />
                  <Text style={styles.tutorialLockText}>PRO</Text>
                </View>
              </View>
            )}
          </Pressable>

          <View style={styles.tipCard}>
            <View style={styles.tipHeader}>
              <Lightbulb size={18} color="#F59E0B" />
              <Text style={styles.tipTitle}>Nutrition Tips</Text>
            </View>
            <Text style={styles.tipText}>{meal.nutritionTip}</Text>

            {showSimplified && (
              <Animated.View
                style={[
                  styles.simplifiedWrap,
                  {
                    opacity: simplifiedAnim,
                    transform: [{
                      translateY: simplifiedAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [8, 0],
                      }),
                    }],
                  },
                ]}
              >
                <Text style={styles.simplifiedText}>{simplifiedTip}</Text>
              </Animated.View>
            )}

            <View style={styles.simplAIRow}>
              <Pressable
                onPress={handleToggleSimplified}
                style={({ pressed }) => [
                  styles.simplAIBtn,
                  showSimplified && styles.simplAIBtnActive,
                  pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] },
                ]}
              >
                <Text style={[
                  styles.simplAIBtnText,
                  showSimplified && styles.simplAIBtnTextActive,
                ]}>{"\u2728"} SimplAI</Text>
              </Pressable>
            </View>
          </View>

          <Pressable
            onPress={handleRegenerate}
            style={({ pressed }) => [styles.regenerateBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
          >
            {!isPremium && <Crown size={16} color="#D4A44C" />}
            <RefreshCw size={18} color={isPremium ? Colors.primary : "#D4A44C"} />
            <Text style={[styles.regenerateBtnText, !isPremium && { color: "#D4A44C" }]}>
              Regenerate this meal
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>

      <View style={[styles.bottomFavBar, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          onPress={handleToggleFavorite}
          style={({ pressed }) => [
            styles.bottomFavBtn,
            isFav && styles.bottomFavBtnActive,
            pressed && { opacity: 0.9 },
          ]}
        >
          <Heart size={20} color={isFav ? "#fff" : Colors.primary} fill={isFav ? "#fff" : "transparent"} />
          <Text style={[styles.bottomFavBtnText, isFav && styles.bottomFavBtnTextActive]}>
            {isFav ? "Saved to Favorites" : "Add to Favorites"}
          </Text>
        </Pressable>
      </View>

      <Modal
        visible={showPremiumModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPremiumModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.premiumModalCard}>
            <Pressable
              onPress={() => setShowPremiumModal(false)}
              style={styles.modalCloseBtn}
            >
              <X size={20} color="#9CA3AF" />
            </Pressable>

            <View style={styles.premiumModalIconWrap}>
              <Crown size={32} color="#D4A44C" />
            </View>

            <Text style={styles.premiumModalTitle}>Premium Feature</Text>
            <Text style={styles.premiumModalMessage}>
              Unlock step-by-step cooking tutorials with a Premium subscription. Watch guided videos for every meal in your plan.
            </Text>

            <Pressable
              onPress={handleUpgradePress}
              style={({ pressed }) => [
                styles.premiumModalUpgradeBtn,
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              ]}
            >
              <Text style={styles.premiumModalUpgradeBtnText}>Upgrade to Premium</Text>
            </Pressable>

            <Pressable
              onPress={() => setShowPremiumModal(false)}
              style={({ pressed }) => [
                styles.premiumModalDismissBtn,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={styles.premiumModalDismissBtnText}>Maybe Later</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showRegenPremiumModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRegenPremiumModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.premiumModalCard}>
            <Pressable
              onPress={() => setShowRegenPremiumModal(false)}
              style={styles.modalCloseBtn}
            >
              <X size={20} color="#9CA3AF" />
            </Pressable>

            <View style={styles.premiumModalIconWrap}>
              <Crown size={32} color="#D4A44C" />
            </View>

            <Text style={styles.premiumModalTitle}>Premium Feature</Text>
            <Text style={styles.premiumModalMessage}>
              Unlock meal regeneration with a Premium subscription. Swap out any meal in your plan for a fresh alternative that fits your goals.
            </Text>

            <Pressable
              onPress={handleRegenUpgradePress}
              style={({ pressed }) => [
                styles.premiumModalUpgradeBtn,
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              ]}
            >
              <Text style={styles.premiumModalUpgradeBtnText}>Upgrade to Premium</Text>
            </Pressable>

            <Pressable
              onPress={() => setShowRegenPremiumModal(false)}
              style={({ pressed }) => [
                styles.premiumModalDismissBtn,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={styles.premiumModalDismissBtnText}>Maybe Later</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showTutorialModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTutorialModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.tutorialModalCard}>
            <View style={styles.tutorialModalHeader}>
              <View style={styles.tutorialModalTitleRow}>
                <Play size={20} color={Colors.primary} fill={Colors.primary} />
                <Text style={styles.tutorialModalTitle}>Cooking Tutorial</Text>
              </View>
              <Pressable
                onPress={() => setShowTutorialModal(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color="#9CA3AF" />
              </Pressable>
            </View>

            <Text style={styles.tutorialModalMealName}>{meal.name}</Text>

            <ScrollView
              style={styles.tutorialStepsScroll}
              showsVerticalScrollIndicator={false}
            >
              {tutorialSteps.map((step, idx) => (
                <View key={`tut-${idx}`} style={styles.tutorialStepCard}>
                  <View style={styles.tutorialStepHeader}>
                    <View style={styles.tutorialStepBadge}>
                      <Text style={styles.tutorialStepBadgeText}>Step {idx + 1}</Text>
                    </View>
                    <View style={styles.tutorialStepDuration}>
                      <Clock size={12} color={Colors.textTertiary} />
                      <Text style={styles.tutorialStepDurationText}>{step.duration}</Text>
                    </View>
                  </View>
                  <Text style={styles.tutorialStepTitle}>{step.title}</Text>
                  <Text style={styles.tutorialStepDesc}>{step.description}</Text>
                </View>
              ))}
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center" as const,
    marginTop: 60,
  },
  heroWrap: {
    position: "relative" as const,
    height: 300,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  heroTopBar: {
    position: "absolute" as const,
    left: 16,
    right: 16,
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
  },
  heroBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  heroBadgeRow: {
    position: "absolute" as const,
    bottom: 16,
    left: 16,
  },
  mealTypeBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 24,
  },
  mealTypeBadgeText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: "#fff",
    textTransform: "uppercase" as const,
    letterSpacing: 0.8,
  },
  contentWrap: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  mealName: {
    fontSize: 26,
    fontWeight: "800" as const,
    color: Colors.text,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: "row" as const,
    gap: 8,
    marginBottom: 20,
  },
  metaPill: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 5,
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  metaPillText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  macroCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 24,
  },
  macroCardTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  macroGrid: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
  },
  macroItem: {
    flex: 1,
    alignItems: "center" as const,
    gap: 6,
  },
  macroIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  macroValue: {
    fontSize: 18,
    fontWeight: "800" as const,
    color: Colors.text,
  },
  macroLabel: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: Colors.textTertiary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.3,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 0,
  },
  substituteHint: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  substituteHintText: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  ingredientsList: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 4,
  },
  ingredientRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    paddingVertical: 6,
  },
  ingredientDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.primary,
  },
  ingredientText: {
    fontSize: 15,
    fontWeight: "500" as const,
    color: Colors.text,
    flex: 1,
  },
  substitutesContainer: {
    marginLeft: 19,
    marginBottom: 8,
    backgroundColor: "#122B22",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#1F4A3A",
  },
  substitutesHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    marginBottom: 8,
  },
  substitutesTitle: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.primary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  substituteRow: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    gap: 8,
    paddingVertical: 5,
  },
  substituteArrow: {
    width: 20,
    alignItems: "center" as const,
    paddingTop: 1,
  },
  substituteArrowText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "600" as const,
  },
  substituteInfo: {
    flex: 1,
  },
  substituteName: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  substituteNote: {
    fontSize: 12,
    color: "#8FB8A8",
    marginTop: 1,
  },
  instructionsList: {
    gap: 14,
  },
  instructionRow: {
    flexDirection: "row" as const,
    gap: 14,
    alignItems: "flex-start" as const,
  },
  stepNumberWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primary,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    marginTop: 1,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: "#fff",
  },
  instructionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500" as const,
    color: Colors.text,
    lineHeight: 22,
  },
  tutorialBtn: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    marginBottom: 20,
    overflow: "hidden" as const,
    position: "relative" as const,
  },
  tutorialBtnContent: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 14,
  },
  tutorialIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  tutorialBtnTextWrap: {
    flex: 1,
    gap: 2,
  },
  tutorialBtnTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  tutorialBtnSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  tutorialLockOverlay: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.65)",
    justifyContent: "center" as const,
    alignItems: "flex-end" as const,
    paddingRight: 16,
  },
  tutorialLockBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 5,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  tutorialLockText: {
    fontSize: 12,
    fontWeight: "800" as const,
    color: "#D4A44C",
    letterSpacing: 0.5,
  },
  tipCard: {
    backgroundColor: "#FFFBEB",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FDE68A",
    marginBottom: 20,
    gap: 8,
  },
  tipHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: "#92400E",
  },
  tipText: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: "#78350F",
    lineHeight: 21,
  },
  simplifiedWrap: {
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  simplifiedText: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: "#92400E",
    lineHeight: 21,
  },
  simplAIRow: {
    flexDirection: "row" as const,
    justifyContent: "flex-end" as const,
    marginTop: 8,
  },
  simplAIBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#FDE68A",
  },
  simplAIBtnActive: {
    backgroundColor: "#F59E0B",
  },
  simplAIBtnText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: "#92400E",
    letterSpacing: 0.3,
  },
  simplAIBtnTextActive: {
    color: "#fff",
  },
  regenerateBtn: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    marginBottom: 20,
  },
  regenerateBtnText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  bottomFavBar: {
    position: "absolute" as const,
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  bottomFavBtn: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 10,
    paddingVertical: 15,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: "transparent",
  },
  bottomFavBtnActive: {
    backgroundColor: "#EF4444",
    borderColor: "#EF4444",
  },
  bottomFavBtnText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  bottomFavBtnTextActive: {
    color: "#fff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  premiumModalCard: {
    width: SCREEN_WIDTH - 48,
    backgroundColor: "#1A1D23",
    borderRadius: 24,
    padding: 28,
    alignItems: "center" as const,
  },
  modalCloseBtn: {
    position: "absolute" as const,
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  premiumModalIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(212,164,76,0.15)",
    justifyContent: "center" as const,
    alignItems: "center" as const,
    borderWidth: 1.5,
    borderColor: "rgba(212,164,76,0.3)",
    marginBottom: 16,
  },
  premiumModalTitle: {
    fontSize: 22,
    fontWeight: "800" as const,
    color: "#fff",
    marginBottom: 10,
  },
  premiumModalMessage: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center" as const,
    lineHeight: 21,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  premiumModalUpgradeBtn: {
    width: "100%",
    backgroundColor: "#2dd4a8",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center" as const,
    marginBottom: 12,
  },
  premiumModalUpgradeBtnText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#0F1115",
  },
  premiumModalDismissBtn: {
    paddingVertical: 10,
  },
  premiumModalDismissBtnText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#6B7280",
  },
  tutorialModalCard: {
    width: SCREEN_WIDTH - 32,
    maxHeight: "80%",
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
  },
  tutorialModalHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    marginBottom: 4,
  },
  tutorialModalTitleRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
  },
  tutorialModalTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  tutorialModalMealName: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  tutorialStepsScroll: {
    flex: 1,
  },
  tutorialStepCard: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  tutorialStepHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    marginBottom: 8,
  },
  tutorialStepBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  tutorialStepBadgeText: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  tutorialStepDuration: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
  },
  tutorialStepDurationText: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  tutorialStepTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  tutorialStepDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
});
