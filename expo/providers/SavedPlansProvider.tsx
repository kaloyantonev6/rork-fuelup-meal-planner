import { useState, useEffect, useCallback, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import createContextHook from "@nkzw/create-context-hook";
import { kvGet, kvSet } from "@/lib/database";
import { useAuth } from "@/providers/AuthProvider";
import { GeneratedPlan, GeneratedMeal } from "@/utils/mealGenerator";

export interface SavedPlanData {
  id: string;
  title: string;
  dateSaved: string;
  duration: "1-Day" | "7-Day";
  plans: GeneratedPlan[];
  mealsPerDay: number;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  folderId: string | null;
}

export interface FavoriteMeal {
  id: string;
  name: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  ingredientQuantities: string[];
  instructions: string[];
  nutritionTip: string;
  prepTime: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  image: string;
  dateFavorited: string;
}

export interface PlanFolder {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

const SAVED_PLANS_KEY = "fuelup_saved_plans";
const FAVORITES_KEY = "fuelup_favorites";
const FOLDERS_KEY = "fuelup_folders";

export const [SavedPlansProvider, useSavedPlans] = createContextHook(() => {
  const { user, isLoading: authLoading } = useAuth();
  const [savedPlans, setSavedPlans] = useState<SavedPlanData[]>([]);
  const [favorites, setFavorites] = useState<FavoriteMeal[]>([]);
  const [folders, setFolders] = useState<PlanFolder[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    const load = async () => {
      try {
        const [plans, favs, storedFolders] = await Promise.all([
          kvGet<SavedPlanData[]>(SAVED_PLANS_KEY),
          kvGet<FavoriteMeal[]>(FAVORITES_KEY),
          kvGet<PlanFolder[]>(FOLDERS_KEY),
        ]);
        if (plans) setSavedPlans(plans);
        if (favs) setFavorites(favs);
        if (storedFolders) setFolders(storedFolders);
      } catch (e) {
        console.log("[SavedPlans] Error loading:", e);
      } finally {
        setIsLoaded(true);
      }
    };
    void load();
  }, [authLoading, user?.id]);

  const persistPlans = useMutation({
    mutationFn: async (plans: SavedPlanData[]) => {
      await kvSet(SAVED_PLANS_KEY, plans);
    },
  });

  const persistFavorites = useMutation({
    mutationFn: async (favs: FavoriteMeal[]) => {
      await kvSet(FAVORITES_KEY, favs);
    },
  });

  const persistFolders = useMutation({
    mutationFn: async (f: PlanFolder[]) => {
      await kvSet(FOLDERS_KEY, f);
    },
  });

  const savePlan = useCallback((
    plans: GeneratedPlan[],
    planType: "daily" | "weekly",
  ) => {
    const activePlan = plans[0];
    if (!activePlan) return;

    const newPlan: SavedPlanData = {
      id: `sp_${Date.now()}`,
      title: planType === "daily"
        ? `Daily Plan - ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
        : `Weekly Plan - ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
      dateSaved: new Date().toISOString(),
      duration: planType === "daily" ? "1-Day" : "7-Day",
      plans,
      mealsPerDay: activePlan.meals.length,
      targetCalories: activePlan.targetCalories,
      targetProtein: activePlan.targetProtein,
      targetCarbs: activePlan.targetCarbs,
      targetFat: activePlan.targetFat,
      folderId: null,
    };

    setSavedPlans((prev) => {
      const updated = [newPlan, ...prev];
      persistPlans.mutate(updated);
      return updated;
    });

    console.log("[SavedPlans] Plan saved:", newPlan.title);
  }, [persistPlans]);

  const removePlan = useCallback((planId: string) => {
    setSavedPlans((prev) => {
      const updated = prev.filter((p) => p.id !== planId);
      persistPlans.mutate(updated);
      return updated;
    });
  }, [persistPlans]);

  const movePlanToFolder = useCallback((planId: string, folderId: string | null) => {
    setSavedPlans((prev) => {
      const updated = prev.map((p) =>
        p.id === planId ? { ...p, folderId } : p
      );
      persistPlans.mutate(updated);
      return updated;
    });
  }, [persistPlans]);

  const toggleFavorite = useCallback((meal: GeneratedMeal) => {
    setFavorites((prev) => {
      const exists = prev.find((f) => f.id === meal.id);
      let updated: FavoriteMeal[];
      if (exists) {
        updated = prev.filter((f) => f.id !== meal.id);
      } else {
        const newFav: FavoriteMeal = {
          id: meal.id,
          name: meal.name,
          mealType: meal.mealType,
          calories: meal.calories,
          protein: meal.protein,
          carbs: meal.carbs,
          fat: meal.fat,
          ingredients: meal.ingredients,
          ingredientQuantities: meal.ingredientQuantities ?? meal.ingredients,
          instructions: meal.instructions ?? [],
          nutritionTip: meal.nutritionTip ?? "",
          prepTime: meal.prepTime ?? 0,
          difficulty: meal.difficulty ?? "beginner",
          image: meal.image,
          dateFavorited: new Date().toISOString(),
        };
        updated = [newFav, ...prev];
      }
      persistFavorites.mutate(updated);
      return updated;
    });
  }, [persistFavorites]);

  const removeFavorite = useCallback((mealId: string) => {
    setFavorites((prev) => {
      const updated = prev.filter((f) => f.id !== mealId);
      persistFavorites.mutate(updated);
      return updated;
    });
  }, [persistFavorites]);

  const isFavorite = useCallback((mealId: string) => {
    return favorites.some((f) => f.id === mealId);
  }, [favorites]);

  const createFolder = useCallback((name: string, emoji: string, color: string) => {
    const newFolder: PlanFolder = {
      id: `folder_${Date.now()}`,
      name,
      emoji,
      color,
    };
    setFolders((prev) => {
      const updated = [...prev, newFolder];
      persistFolders.mutate(updated);
      return updated;
    });
  }, [persistFolders]);

  return useMemo(() => ({
    savedPlans,
    favorites,
    folders,
    isLoaded,
    savePlan,
    removePlan,
    movePlanToFolder,
    toggleFavorite,
    removeFavorite,
    isFavorite,
    createFolder,
  }), [savedPlans, favorites, folders, isLoaded, savePlan, removePlan, movePlanToFolder, toggleFavorite, removeFavorite, isFavorite, createFolder]);
});
