import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { getDailyTracking, kvGet, kvSet, upsertDailyTracking } from "@/lib/database";
import { useAuth } from "@/providers/AuthProvider";
import { useMealPlan } from "@/providers/MealPlanProvider";
import { useToday } from "@/providers/TodayProvider";
import { getLocalDateString } from "@/constants/dayTypes";
import {
  CUSTOM_MEAL_TIMES_KEY,
  DEFAULT_MEAL_TIME_WINDOWS,
  DEFAULT_REMINDER_SETTINGS,
  HISTORY_MAX_DAYS,
  MEAL_TRACKING_HISTORY_KEY,
  MEAL_TRACKING_KEY,
  REMINDER_SETTINGS_KEY,
  categoriesForDay,
  getMealWindows,
  recomputeTracking,
} from "@/constants/mealTimes";
import type {
  DailyTracking,
  MealCategory,
  MealCheckoff,
  MealTimesConfig,
  ReminderSettings,
} from "@/constants/mealTimes";
import type { DayType } from "@/types";

const HIGHLIGHT_CLEAR_MS = 6000;

/**
 * Daily meal check-off tracking: builds today's DailyTracking from the active meal
 * plan + day-type eating windows, archives yesterday into history on the midnight
 * rollover (last 28 days kept), and handles Ate-it / Skip / Undo actions. Also owns
 * the custom meal time windows and reminder delay settings.
 */
export const [MealTrackingProvider, useMealTracking] = createContextHook(() => {
  const { todayPlan, profile } = useMealPlan();
  const { todayData, dayKey } = useToday();
  const { user, isLoading: authLoading } = useAuth();

  const [tracking, setTracking] = useState<DailyTracking | null>(null);
  const [history, setHistory] = useState<DailyTracking[]>([]);
  const [customTimes, setCustomTimes] = useState<MealTimesConfig>(DEFAULT_MEAL_TIME_WINDOWS);
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(DEFAULT_REMINDER_SETTINGS);
  const [highlightMealId, setHighlightMealIdState] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setHighlightMealId = useCallback((mealId: string | null) => {
    setHighlightMealIdState(mealId);
    if (highlightTimer.current) clearTimeout(highlightTimer.current);
    if (mealId) {
      highlightTimer.current = setTimeout(() => setHighlightMealIdState(null), HIGHLIGHT_CLEAR_MS);
    }
  }, []);

  /** Builds a fresh DailyTracking for today from the active plan + custom windows. */
  const buildTodaysTracking = useCallback(
    (dayType: DayType, calorieTarget: number, times: MealTimesConfig, date: string): DailyTracking => {
      const windows = getMealWindows(times, dayType);
      const meals: MealCheckoff[] = categoriesForDay(dayType).map((category) => {
        const recipe = todayPlan.meals[category];
        return {
          mealId: `${date}_${category}`,
          mealTitle: recipe.title,
          category: category as MealCategory,
          scheduledTime: windows[category]?.start ?? "12:00",
          completedAt: null,
          skipped: false,
          calories: recipe.nutrition.calories,
          protein: recipe.nutrition.protein,
          carbs: recipe.nutrition.carbs,
          fats: recipe.nutrition.fat,
        };
      });
      return recomputeTracking({
        date,
        dayType,
        meals,
        calorieTarget,
        caloriesConsumed: 0,
        completionPercent: 0,
      });
    },
    [todayPlan],
  );

  // Load + normalise: archive a stale day into history, initialise today,
  // and patch the calorie target when profile/day-type targets change.
  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    const run = async () => {
      try {
        const today = getLocalDateString();
        const [trackingRow, historyRaw, timesRaw, settingsRaw] = await Promise.all([
          user ? getDailyTracking(user.id, today) : Promise.resolve({ data: null, error: null }),
          kvGet<DailyTracking[]>(MEAL_TRACKING_HISTORY_KEY),
          kvGet<MealTimesConfig>(CUSTOM_MEAL_TIMES_KEY),
          kvGet<ReminderSettings>(REMINDER_SETTINGS_KEY),
        ]);
        if (cancelled) return;

        let nextTimes = DEFAULT_MEAL_TIME_WINDOWS;
        if (timesRaw && typeof timesRaw === "object") {
          nextTimes = { ...DEFAULT_MEAL_TIME_WINDOWS, ...timesRaw };
        }
        let nextSettings = DEFAULT_REMINDER_SETTINGS;
        if (settingsRaw && typeof settingsRaw === "object") {
          nextSettings = {
            enabled: settingsRaw.enabled ?? true,
            delayMinutes: settingsRaw.delayMinutes ?? 30,
          };
        }

        let nextHistory: DailyTracking[] = Array.isArray(historyRaw) ? historyRaw : [];

        let current: DailyTracking | null =
          trackingRow && typeof trackingRow.data === "object" && trackingRow.data !== null
            ? (trackingRow.data as DailyTracking)
            : null;
        if (!current) {
          // No server row — fall back to the device cache (offline/pre-migration)
          const cached = await kvGet<DailyTracking>(MEAL_TRACKING_KEY);
          if (cached && typeof cached === "object") current = cached;
        }

        const calorieTarget = todayData?.calorieTarget ?? profile.calorieTarget ?? 0;

        const persistCurrent = async (t: DailyTracking) => {
          void AsyncStorage.setItem(MEAL_TRACKING_KEY, JSON.stringify(t)).catch(() => undefined);
          if (user) await upsertDailyTracking(user.id, today, t);
        };

        if (current && current.date === today) {
          // Same day — patch the target if it moved (profile edits, program changes)
          if (calorieTarget > 0 && current.calorieTarget !== calorieTarget) {
            current = recomputeTracking({ ...current, calorieTarget });
            await persistCurrent(current);
          }
        } else {
          // Stale or missing — archive yesterday (unchecked meals stay "missed") and start fresh
          if (current) {
            nextHistory = [...nextHistory.filter((h) => h.date !== current?.date), current].slice(
              -HISTORY_MAX_DAYS,
            );
            await kvSet(MEAL_TRACKING_HISTORY_KEY, nextHistory);
          }
          const dayType: DayType =
            todayData?.dayType ??
            profile.weeklySchedule?.[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1] ??
            "training";
          current = buildTodaysTracking(dayType, calorieTarget, nextTimes, today);
          await persistCurrent(current);
        }

        if (cancelled) return;
        setTracking(current);
        setHistory(nextHistory);
        setCustomTimes(nextTimes);
        setReminderSettings(nextSettings);
      } catch (e) {
        console.log("[MealTracking] Init failed:", e);
      } finally {
        if (!cancelled) setIsLoaded(true);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [dayKey, todayData?.calorieTarget, todayData?.dayType, profile.calorieTarget, buildTodaysTracking, user?.id, authLoading]);

  const persist = useCallback(
    async (next: DailyTracking) => {
      setTracking(next);
      try {
        void AsyncStorage.setItem(MEAL_TRACKING_KEY, JSON.stringify(next)).catch(() => undefined);
        if (user) await upsertDailyTracking(user.id, next.date, next);
      } catch (e) {
        console.log("[MealTracking] Persist failed:", e);
      }
    },
    [user],
  );

  const updateMeal = useCallback(
    (mealId: string, patch: Partial<MealCheckoff>) => {
      setTracking((prev) => {
        if (!prev) return prev;
        const next = recomputeTracking({
          ...prev,
          meals: prev.meals.map((m) => (m.mealId === mealId ? { ...m, ...patch } : m)),
        });
        void persist(next);
        return next;
      });
    },
    [persist],
  );

  /** Marks a meal eaten — stamps the time and adds its calories to the consumed total. */
  const checkoffMeal = useCallback(
    (mealId: string) => {
      updateMeal(mealId, { completedAt: new Date().toISOString(), skipped: false });
    },
    [updateMeal],
  );

  /** Marks a meal skipped — no calories added, card dims. */
  const skipMeal = useCallback(
    (mealId: string) => {
      updateMeal(mealId, { skipped: true, completedAt: null });
    },
    [updateMeal],
  );

  /** Reverses a check-off or skip (10-second undo window). */
  const undoMeal = useCallback(
    (mealId: string) => {
      updateMeal(mealId, { completedAt: null, skipped: false });
    },
    [updateMeal],
  );

  /** Saves a custom eating window for a day type + category and re-initialises scheduled times. */
  const updateMealTimes = useCallback(
    (dayType: DayType, category: MealCategory, start: string, end: string) => {
      setCustomTimes((prev) => {
        const base = prev[dayType];
        const next: MealTimesConfig = {
          ...prev,
          [dayType]: {
            ...base,
            [category]: { ...(base[category] ?? { reminder: end }), start, end, reminder: end },
          },
        };
        void kvSet(CUSTOM_MEAL_TIMES_KEY, next).catch((e) =>
          console.log("[MealTracking] Save meal times failed:", e),
        );
        // Keep today's scheduledTime labels in sync with the new window starts
        setTracking((t) => {
          if (!t || t.dayType !== dayType) return t;
          return {
            ...t,
            meals: t.meals.map((m) =>
              m.category === category ? { ...m, scheduledTime: start } : m,
            ),
          };
        });
        return next;
      });
    },
    [],
  );

  const updateReminderDelay = useCallback((delayMinutes: number) => {
    setReminderSettings((prev) => {
      const next = { ...prev, delayMinutes };
      void kvSet(REMINDER_SETTINGS_KEY, next).catch((e) =>
        console.log("[MealTracking] Save reminder settings failed:", e),
      );
      return next;
    });
  }, []);

  const stats = useMemo(() => {
    if (!tracking) {
      return {
        completedCount: 0,
        skippedCount: 0,
        missedCount: 0,
        totalMeals: 0,
        caloriesConsumed: 0,
        completionPercent: 0,
      };
    }
    return {
      completedCount: tracking.meals.filter((m) => m.completedAt).length,
      skippedCount: tracking.meals.filter((m) => m.skipped).length,
      missedCount: tracking.meals.filter((m) => !m.completedAt && !m.skipped).length,
      totalMeals: tracking.meals.length,
      caloriesConsumed: tracking.caloriesConsumed,
      completionPercent: tracking.completionPercent,
    };
  }, [tracking]);

  return useMemo(
    () => ({
      tracking,
      history,
      customTimes,
      reminderSettings,
      highlightMealId,
      setHighlightMealId,
      isLoaded,
      checkoffMeal,
      skipMeal,
      undoMeal,
      updateMealTimes,
      updateReminderDelay,
      stats,
    }),
    [
      tracking,
      history,
      customTimes,
      reminderSettings,
      highlightMealId,
      setHighlightMealId,
      isLoaded,
      checkoffMeal,
      skipMeal,
      undoMeal,
      updateMealTimes,
      updateReminderDelay,
      stats,
    ],
  );
});
