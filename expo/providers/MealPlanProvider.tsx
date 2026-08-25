import { useState, useEffect, useCallback, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { MealPlan, ShoppingItem, UserProfile } from "@/types";
import { sampleMealPlan, weeklyMealPlans, sampleShoppingList } from "@/mocks/recipes";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
const DEFAULT_PROFILE: UserProfile = {
  name: "",
  age: 18,
  gender: "other",
  weight: 70,
  height: 170,
  // Football profile
  position: "central_mid",
  // App targets amateur players aspiring to go pro — level is fixed internally
  level: "amateur",
  trainingFrequency: "3-4",
  seasonPhase: "in_season",
  performanceGoal: "general",
  weeklySchedule: ["training", "training", "rest", "training", "training", "match", "recovery"],
  defaultKickoffTime: "15:00",
  defaultTrainingTime: "18:00",
  // Diet
  goal: "maintain",
  dietType: "balanced",
  dietTypes: ["balanced"],
  allergies: [],
  // Budget & location
  weeklyBudget: 35,
  country: "",
  // Legacy compat fields
  activityLevel: "moderate",
  budgetPreference: "moderate",
  kitchenEquipment: ["stovetop", "oven", "pan", "pot", "microwave", "blender"],
  cookingSkill: "beginner",
  maxCookTime: "any" as const,
  noCookOnly: false,
  maxFiveIngredients: false,
  dietaryPreferences: [],
  budget: "medium",
  calorieTarget: 2500,
  isPremium: false,
  // Legacy soccer compat
  soccerPosition: "midfielder",
  playerLevel: "amateur",
  trainingDaysPerWeek: 4,
  trainingIntensity: "moderate",
  matchDays: [{ dayOfWeek: 6, timeOfDay: "afternoon" }],
  parentalConsent: "not_required",
  cookAvailability: "quick",
};

const PROFILE_KEY = "nutriplan_profile";
const ONBOARDED_KEY = "nutriplan_onboarded";
const AUTH_KEY = "nutriplan_auth";
const SESSION_KEY = "nutriplan_session";

interface AuthData {
  email: string;
  password: string;
  name: string;
}

export const [MealPlanProvider, useMealPlan] = createContextHook(() => {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [todayPlan, setTodayPlan] = useState<MealPlan>(sampleMealPlan);
  const [weekPlans] = useState<MealPlan[]>(weeklyMealPlans);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>(sampleShoppingList);
  const [hasOnboarded, setHasOnboarded] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [hasAccount, setHasAccount] = useState<boolean>(false);
  const [savedEmail, setSavedEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [storedProfile, onboarded, authData, session] = await Promise.all([
          AsyncStorage.getItem(PROFILE_KEY),
          AsyncStorage.getItem(ONBOARDED_KEY),
          AsyncStorage.getItem(AUTH_KEY),
          AsyncStorage.getItem(SESSION_KEY),
        ]);
        if (storedProfile) {
          setProfile(JSON.parse(storedProfile));
        }
        if (onboarded === "true") {
          setHasOnboarded(true);
        }
        if (authData) {
          const parsed: AuthData = JSON.parse(authData);
          setHasAccount(true);
          setSavedEmail(parsed.email);
          console.log("Found existing account for:", parsed.email);
        }
        if (session === "true") {
          setIsLoggedIn(true);
          console.log("User session active, auto-logging in");
        }
      } catch (e) {
        console.log("Error loading profile:", e);
      } finally {
        setIsLoading(false);
      }
    };
    void loadData();
  }, []);

  const saveProfileMutation = useMutation({
    mutationFn: async (newProfile: UserProfile) => {
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(newProfile));
      return newProfile;
    },
    onSuccess: (data) => {
      setProfile(data);
    },
  });

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile((prev) => {
      const updated = { ...prev, ...updates };
      saveProfileMutation.mutate(updated);
      return updated;
    });
  }, [saveProfileMutation]);

  const completeOnboarding = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDED_KEY, "true");
    setHasOnboarded(true);
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    const authData: AuthData = { email: email.toLowerCase().trim(), password, name };
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(authData));
    await AsyncStorage.setItem(SESSION_KEY, "true");
    setHasAccount(true);
    setIsLoggedIn(true);
    setSavedEmail(authData.email);
    console.log("User signed up:", authData.email);
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const authData = await AsyncStorage.getItem(AUTH_KEY);
      if (!authData) {
        return { success: false, error: "No account found. Please sign up first." };
      }
      const parsed: AuthData = JSON.parse(authData);
      if (parsed.email !== email.toLowerCase().trim()) {
        return { success: false, error: "Email not found. Check your email or sign up." };
      }
      if (parsed.password !== password) {
        return { success: false, error: "Incorrect password. Please try again." };
      }
      await AsyncStorage.setItem(SESSION_KEY, "true");
      setIsLoggedIn(true);
      console.log("User signed in:", email);
      return { success: true };
    } catch (e) {
      console.log("Sign in error:", e);
      return { success: false, error: "Something went wrong. Please try again." };
    }
  }, []);

  const signOut = useCallback(async () => {
    await AsyncStorage.removeItem(SESSION_KEY);
    setIsLoggedIn(false);
    console.log("User signed out");
  }, []);

  const toggleShoppingItem = useCallback((id: string) => {
    setShoppingList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  }, []);

  const generateNewPlan = useCallback(() => {
    const shuffled = [...weeklyMealPlans].sort(() => Math.random() - 0.5);
    if (shuffled[0]) {
      setTodayPlan({ ...shuffled[0], id: `mp_${Date.now()}`, date: new Date().toISOString().split("T")[0] });
    }
  }, []);

  const totalSavings = useMemo(() => shoppingList.reduce((acc, item) => {
    if (item.originalPrice && item.bestPrice) {
      return acc + (item.originalPrice - item.bestPrice);
    }
    return acc;
  }, 0), [shoppingList]);

  const totalCartCost = useMemo(() => shoppingList.reduce((acc, item) => {
    return acc + (item.bestPrice ?? 0);
  }, 0), [shoppingList]);

  const checkedCount = useMemo(() => shoppingList.filter((item) => item.checked).length, [shoppingList]);

  return useMemo(() => ({
    profile,
    updateProfile,
    todayPlan,
    weekPlans,
    shoppingList,
    toggleShoppingItem,
    generateNewPlan,
    hasOnboarded,
    completeOnboarding,
    isLoading,
    totalSavings,
    totalCartCost,
    checkedCount,
    isLoggedIn,
    hasAccount,
    savedEmail,
    signUp,
    signIn,
    signOut,
  }), [profile, updateProfile, todayPlan, weekPlans, shoppingList, toggleShoppingItem, generateNewPlan, hasOnboarded, completeOnboarding, isLoading, totalSavings, totalCartCost, checkedCount, isLoggedIn, hasAccount, savedEmail, signUp, signIn, signOut]);
});
