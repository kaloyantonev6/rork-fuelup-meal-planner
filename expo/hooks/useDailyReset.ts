import { useCallback, useEffect, useRef } from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocalDateString } from "@/constants/dayTypes";

const LAST_RESET_KEY = "fuelup_last_reset_date";
const HYDRATION_KEY = "fuelup_hydration";
const TIP_INDEX_KEY = "fuelup_tip_index";
const TIP_COUNT = 14;

export interface UseDailyResetOptions {
  /** Fired exactly once per local day when the date rolls over (or on first check after a missed day). */
  onNewDay?: (today: string, isFirstCheck: boolean) => void;
}

/**
 * Midnight auto-reset: checks every 30s (and on every foreground return) whether the
 * local date has changed since the last reset. When it has, hydration is zeroed and
 * the daily performance tip advances to the next in the rotation. Missed days are not
 * "caught up" — a single reset to today is enough. All logic uses the device's local
 * timezone, never UTC.
 */
export function useDailyReset(options: UseDailyResetOptions = {}) {
  const onNewDayRef = useRef(options.onNewDay);
  onNewDayRef.current = options.onNewDay;

  const performReset = useCallback(async (): Promise<boolean> => {
    const today = getLocalDateString();
    try {
      const lastReset = await AsyncStorage.getItem(LAST_RESET_KEY);
      const isFirstCheck = lastReset === null;
      if (lastReset === today) return false; // already reset today

      // Reset hydration for the new day (target recalculates from the new day type)
      await AsyncStorage.setItem(HYDRATION_KEY, JSON.stringify({ date: today, intakeMl: 0 }));

      // Advance the daily performance tip rotation
      const tipRaw = await AsyncStorage.getItem(TIP_INDEX_KEY);
      let currentIndex = 0;
      if (tipRaw) {
        try {
          const parsed = JSON.parse(tipRaw) as { index?: number };
          if (typeof parsed.index === "number") currentIndex = parsed.index;
        } catch {
          // fall through with index 0
        }
      }
      await AsyncStorage.setItem(
        TIP_INDEX_KEY,
        JSON.stringify({ date: today, index: (currentIndex + 1) % TIP_COUNT }),
      );

      // Mark today as reset
      await AsyncStorage.setItem(LAST_RESET_KEY, today);
      onNewDayRef.current?.(today, isFirstCheck);
      return true;
    } catch (e) {
      console.log("[useDailyReset] Reset failed:", e);
      return false;
    }
  }, []);

  useEffect(() => {
    void performReset();
    const interval = setInterval(() => {
      void performReset();
    }, 30000); // catches the midnight crossover while the app is open
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void performReset();
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [performReset]);

  return { performReset };
}
