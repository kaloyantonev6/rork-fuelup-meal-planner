import { useCallback, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { useMealPlan } from "@/providers/MealPlanProvider";
import { useDailyReset } from "@/hooks/useDailyReset";
import { calculateDayTargets } from "@/utils/dailyTargets";
import {
  DEFAULT_WEEKLY_SCHEDULE,
  FULL_DAY_NAMES,
  getLocalDateString,
  getMondayIndex,
} from "@/constants/dayTypes";
import type { DayType } from "@/types";

export interface TomorrowPreview {
  dayType: DayType;
  dayName: string;
  calorieTarget: number;
}

export interface TodayData {
  dayType: DayType;
  dayName: string;
  /** Monday-first index, 0 = Monday */
  dayIndex: number;
  calorieTarget: number;
  /** Macro split in percentages */
  macroSplit: { protein: number; carbs: number; fats: number };
  /** Litres */
  hydrationTarget: number;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
  tomorrow: TomorrowPreview;
}

const HYDRATION_KEY = "fuelup_hydration";

/**
 * Single source of truth for "today": day type from the weekly schedule, the
 * recalculated calorie/macro/hydration targets, and a tomorrow preview. Runs the
 * midnight auto-reset once at the app root and re-exposes today's data to every
 * screen. Re-computes automatically when the profile (e.g. weeklySchedule) changes
 * or when the day rolls over; call refreshToday() after program edits.
 */
export const [TodayProvider, useToday] = createContextHook(() => {
  const { profile, isLoading } = useMealPlan();

  const [dayKey, setDayKey] = useState<string>(() => getLocalDateString());
  const [bootedWithReset, setBootedWithReset] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);

  const { performReset } = useDailyReset({
    onNewDay: (today, isFirstCheck) => {
      setDayKey(today);
      if (isFirstCheck) {
        // App was opened on a brand-new day — consumers can greet the user.
        setBootedWithReset(true);
      } else {
        // Midnight crossover while the app was open.
        setRefreshCount((c) => c + 1);
      }
    },
  });

  /** Re-read the local date and notify consumers (after program edits or manual syncs). */
  const refreshToday = useCallback(() => {
    setDayKey(getLocalDateString());
    setRefreshCount((c) => c + 1);
  }, []);

  const todayData = useMemo<TodayData | null>(() => {
    if (isLoading) return null;
    const schedule: DayType[] =
      profile.weeklySchedule && profile.weeklySchedule.length === 7
        ? profile.weeklySchedule
        : DEFAULT_WEEKLY_SCHEDULE;

    const dayIndex = getMondayIndex();
    const dayType = schedule[dayIndex] ?? "training";
    const targets = calculateDayTargets(profile, dayType);

    const tomorrowIndex = (dayIndex + 1) % 7;
    const tomorrowType = schedule[tomorrowIndex] ?? "training";
    const tomorrowTargets = calculateDayTargets(profile, tomorrowType);

    return {
      dayType,
      dayName: FULL_DAY_NAMES[dayIndex],
      dayIndex,
      calorieTarget: targets.calories,
      macroSplit: {
        protein: Math.round(targets.proteinPct * 100),
        carbs: Math.round(targets.carbsPct * 100),
        fats: Math.round(targets.fatPct * 100),
      },
      hydrationTarget: targets.waterLiters,
      proteinGrams: targets.protein,
      carbsGrams: targets.carbs,
      fatsGrams: targets.fat,
      tomorrow: {
        dayType: tomorrowType,
        dayName: FULL_DAY_NAMES[tomorrowIndex],
        calorieTarget: tomorrowTargets.calories,
      },
    };
  }, [profile, isLoading, dayKey]);

  /**
   * Clears today's hydration progress (used when the user confirms a reset after
   * changing their program mid-day). Hydration reloads on the next consumer refresh.
   */
  const resetHydration = useCallback(() => {
    void AsyncStorage.setItem(
      HYDRATION_KEY,
      JSON.stringify({ date: getLocalDateString(), intakeMl: 0 }),
    ).catch((e) => console.log("[TodayProvider] Hydration reset failed:", e));
    setRefreshCount((c) => c + 1);
  }, []);

  return useMemo(
    () => ({
      todayData,
      refreshToday,
      resetHydration,
      /** Bumped on midnight crossover, foreground-return resets and refreshToday() */
      refreshCount,
      /** True when the app's first daily-reset check of this session actually reset (opened on a new day) */
      bootedWithReset,
      dayKey,
    }),
    [todayData, refreshToday, resetHydration, refreshCount, bootedWithReset, dayKey],
  );
});
