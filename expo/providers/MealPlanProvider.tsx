import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { MealPlan, ShoppingItem, UserProfile } from "@/types";
import { sampleMealPlan, weeklyMealPlans, sampleShoppingList } from "@/mocks/recipes";
import {
  getProfile,
  kvGet,
  kvSet,
  scheduleToRow,
  upsertProfile,
  upsertWeeklySchedule,
} from "@/lib/database";
import { resetGenerationCount } from "@/lib/generationLimit";
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

/** Maps the local UserProfile to the `profiles` columns that exist server-side.
 * Keep in sync with the add_football_profile_fields migration. */
function profileToSupabaseRow(p: UserProfile): Record<string, unknown> {
  // profiles.age has CHECK (13..120). An out-of-range value would reject the
  // WHOLE row, so send null instead and keep the real value in `preferences`.
  const age = typeof p.age === "number" && p.age >= 13 && p.age <= 120 ? p.age : null;
  return {
    // profiles.full_name is GENERATED ALWAYS from display_name - never send it.
    display_name: p.name,
    age,
    gender: p.gender,
    weight_kg: p.weight,
    height_cm: p.height,
    diet_type: p.dietType,
    allergies: p.allergies,
    cooking_skill: p.cookingSkill,
    kitchen_equipment: p.kitchenEquipment ?? [],
    position: p.position,
    player_level: p.level,
    training_frequency: p.trainingFrequency,
    season_phase: p.seasonPhase,
    performance_goal: p.performanceGoal,
    weekly_schedule: p.weeklySchedule,
    default_kickoff_time: p.defaultKickoffTime,
    default_training_time: p.defaultTrainingTime,
    parental_consent_status: p.parentalConsent ?? "not_required",
    country: p.country || null,
    weekly_budget: p.weeklyBudget ?? null,
    // Full local profile snapshot so a new device restores every field.
    preferences: p,
  };
}

/** Auth-user fields profile syncing needs (subset of SupabaseUser). */
interface SyncUser {
  id: string;
  email?: string | null;
}

/** Writes the profile row for `user`: updates the existing row, and when the
 * user has no row yet (fresh signup) inserts one instead. `email` is NOT NULL
 * in the profiles table, so it is included on insert. */
async function upsertProfileRow(
  user: SyncUser,
  p: UserProfile,
  extra: Record<string, unknown> = {}
): Promise<void> {
  const row = { ...profileToSupabaseRow(p), ...extra };
  const { error } = await upsertProfile(user.id, row, user.email ?? "");
  if (error) throw new Error(error);
  // Keep the weekly_schedules table identical to profiles.weekly_schedule.
  if (Array.isArray(p.weeklySchedule) && p.weeklySchedule.length === 7) {
    const { error: schedErr } = await upsertWeeklySchedule(user.id, scheduleToRow(p.weeklySchedule));
    if (schedErr) console.log("[MealPlanProvider] weekly_schedules sync failed:", schedErr);
  }
}

/** True when the server row was written by the app (has the full snapshot),
 * as opposed to the empty row the signup trigger creates. */
function rowHasAppData(row: Record<string, any>): boolean {
  return !!row.preferences && typeof row.preferences === "object" && Object.keys(row.preferences).length > 0;
}

/** Merges a fetched `profiles` row into the local UserProfile. Only touches
 * fields Supabase owns -- everything else stays as-is. */
function applySupabaseRow(local: UserProfile, row: Record<string, any>): UserProfile {
  // The full profile snapshot (profiles.preferences) restores fields without a
  // dedicated column; the dedicated columns below always win.
  const stored =
    row.preferences && typeof row.preferences === "object"
      ? (row.preferences as Partial<UserProfile>)
      : null;
  const base: UserProfile = stored ? { ...local, ...stored } : local;
  return {
    ...base,
    age: row.age ?? base.age,
    gender: row.gender ?? base.gender,
    weight: row.weight_kg ?? base.weight,
    height: row.height_cm ?? base.height,
    dietType: row.diet_type ?? base.dietType,
    allergies: row.allergies ?? base.allergies,
    position: row.position ?? base.position,
    level: row.player_level ?? base.level,
    trainingFrequency: row.training_frequency ?? base.trainingFrequency,
    seasonPhase: row.season_phase ?? base.seasonPhase,
    performanceGoal: row.performance_goal ?? base.performanceGoal,
    weeklySchedule:
      row.weekly_schedule && row.weekly_schedule.length === 7
        ? row.weekly_schedule
        : base.weeklySchedule,
    defaultKickoffTime: row.default_kickoff_time ?? base.defaultKickoffTime,
    defaultTrainingTime: row.default_training_time ?? base.defaultTrainingTime,
    parentalConsent: row.parental_consent_status ?? base.parentalConsent,
  };
}

const PROFILE_KEY = "nutriplan_profile";
const ONBOARDED_KEY = "nutriplan_onboarded";

export const [MealPlanProvider, useMealPlan] = createContextHook(() => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [todayPlan, setTodayPlan] = useState<MealPlan>(sampleMealPlan);
  const [weekPlans] = useState<MealPlan[]>(weeklyMealPlans);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>(sampleShoppingList);
  const [hasOnboarded, setHasOnboarded] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // Always-current profile for async callbacks (avoids stale closures).
  const profileRef = useRef<UserProfile>(DEFAULT_PROFILE);
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    if (authLoading) return;
    const loadData = async () => {
      try {
        // Purge the retired on-device login (it stored a plaintext password);
        // auth is handled by Supabase in AuthProvider.
        void AsyncStorage.multiRemove(["nutriplan_auth", "nutriplan_session"]).catch(() => undefined);
        const [storedProfile, onboarded] = await Promise.all([
          AsyncStorage.getItem(PROFILE_KEY),
          kvGet<boolean>(ONBOARDED_KEY),
        ]);
        if (storedProfile) {
          setProfile(JSON.parse(storedProfile));
        }
        if (onboarded === true) {
          setHasOnboarded(true);
        }
      } catch (e) {
        console.log("Error loading profile:", e);
      } finally {
        setIsLoading(false);
      }
    };
    void loadData();
  }, [authLoading, user?.id]);

  // Pull the server-side profile once authenticated, so a fresh install or
  // a new device gets real data instead of DEFAULT_PROFILE.
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    (async () => {
      try {
        const { data: row } = await getProfile(user.id);
        const localRaw = await AsyncStorage.getItem(PROFILE_KEY);
        const local: UserProfile | null = localRaw ? JSON.parse(localRaw) : null;
        if (row && !rowHasAppData(row) && local) {
          // Server only has the empty signup-trigger row (DB defaults like
          // diet_type='omnivore'); this device holds the real profile. Device
          // wins and is pushed up so both sides become identical.
          setProfile(local);
          const onboarded = (await kvGet<boolean>(ONBOARDED_KEY)) === true;
          await upsertProfileRow(user, local, onboarded ? { onboarding_complete: true } : {});
        } else if (row) {
          setProfile((prev) => {
            const merged = applySupabaseRow(prev, row);
            void AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(merged));
            return merged;
          });
        } else {
          // No server profile yet (fresh signup) — fall back to onboarding so
          // one gets created instead of showing empty default data.
          setHasOnboarded(false);
        }
      } catch (e) {
        console.log("[MealPlanProvider] Could not fetch profile from Supabase:", e);
      }
    })();
  }, [isAuthenticated, user]);

  // Premium users have no generation limit — clear the free-tier counter so
  // a future downgrade starts fresh with 3 new generations.
  useEffect(() => {
    if (profile.isPremium) void resetGenerationCount();
  }, [profile.isPremium]);

  const saveProfileMutation = useMutation({
    mutationFn: async (newProfile: UserProfile) => {
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(newProfile));
      if (isAuthenticated && user) {
        try {
          await upsertProfileRow(user, newProfile);
        } catch (e) {
          console.log("[MealPlanProvider] Supabase profile sync failed:", e);
        }
      }
      return newProfile;
    },
    onSuccess: (data) => {
      setProfile(data);
    },
  });

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    const updated = { ...profileRef.current, ...updates };
    profileRef.current = updated;
    setProfile(updated);
    saveProfileMutation.mutate(updated);
  }, [saveProfileMutation]);

  const completeOnboarding = useCallback(async () => {
    await kvSet(ONBOARDED_KEY, true);
    if (isAuthenticated && user) {
      try {
        // Read the ref, not the `profile` closure: onboarding calls
        // updateProfile() right before this, and the closure would still
        // hold the pre-onboarding profile and overwrite the fresh one.
        await upsertProfileRow(user, profileRef.current, { onboarding_complete: true });
      } catch (e) {
        console.log("[MealPlanProvider] Supabase profile sync failed on onboarding complete:", e);
      }
    }
    setHasOnboarded(true);
  }, [isAuthenticated, user]);

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
  }), [profile, updateProfile, todayPlan, weekPlans, shoppingList, toggleShoppingItem, generateNewPlan, hasOnboarded, completeOnboarding, isLoading, totalSavings, totalCartCost, checkedCount]);
});
