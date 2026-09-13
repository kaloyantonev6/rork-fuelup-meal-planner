import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getDatabaseUserId,
  getHydrationEntries,
  getHydrationTotal,
  logWater,
} from "@/lib/database";

/**
 * Shared hydration tracking store — Supabase (`hydration_logs`) is the source
 * of truth for signed-in users; AsyncStorage keeps an offline cache mirror:
 * - "fuelup_hydration": { date, intakeMl }
 * - "fuelup_hydration_log": { date, entries }
 */

export const HYDRATION_KEY = "fuelup_hydration";
const HYDRATION_LOG_KEY = "fuelup_hydration_log";

export interface HydrationLogEntry {
  time: string;
  ml: number;
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function nowLabel(): string {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

async function readCacheIntake(): Promise<number> {
  try {
    const stored = await AsyncStorage.getItem(HYDRATION_KEY);
    if (!stored) return 0;
    const data = JSON.parse(stored) as { date: string; intakeMl: number };
    if (data.date !== todayKey()) {
      await AsyncStorage.setItem(HYDRATION_KEY, JSON.stringify({ date: todayKey(), intakeMl: 0 }));
      return 0;
    }
    return data.intakeMl;
  } catch {
    return 0;
  }
}

async function readCacheLog(): Promise<HydrationLogEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(HYDRATION_LOG_KEY);
    if (!raw) return [];
    const log = JSON.parse(raw) as { date: string; entries: HydrationLogEntry[] };
    return log.date === todayKey() ? log.entries : [];
  } catch {
    return [];
  }
}

/** Today's total intake in ml (server total when signed in, cache otherwise). */
export async function loadTodayHydration(): Promise<number> {
  const userId = getDatabaseUserId();
  if (userId) {
    const { total, error } = await getHydrationTotal(userId, todayKey());
    if (!error) {
      void AsyncStorage.setItem(
        HYDRATION_KEY,
        JSON.stringify({ date: todayKey(), intakeMl: total }),
      ).catch(() => undefined);
      return total;
    }
  }
  return readCacheIntake();
}

/** Adds ml to today's total (server row + cache mirror) and appends a timestamped log entry. */
export async function addWater(ml: number): Promise<number> {
  const current = await loadTodayHydration();
  const next = Math.max(0, current + ml);
  const userId = getDatabaseUserId();
  if (userId && ml > 0) {
    const { error } = await logWater(userId, todayKey(), ml);
    if (error) console.log("[HydrationStore] Server log failed:", error);
  }
  try {
    await AsyncStorage.setItem(HYDRATION_KEY, JSON.stringify({ date: todayKey(), intakeMl: next }));
    if (ml > 0) {
      const entries = await readCacheLog();
      entries.push({ time: nowLabel(), ml });
      await AsyncStorage.setItem(
        HYDRATION_LOG_KEY,
        JSON.stringify({ date: todayKey(), entries }),
      );
    }
  } catch (e) {
    console.log("[HydrationStore] Save failed:", e);
  }
  return next;
}

/** Today's intake log (oldest first) — server rows when signed in, cache otherwise. */
export async function loadTodayHydrationLog(): Promise<HydrationLogEntry[]> {
  const userId = getDatabaseUserId();
  if (userId) {
    const { data, error } = await getHydrationEntries(userId, todayKey());
    if (!error) {
      void AsyncStorage.setItem(
        HYDRATION_LOG_KEY,
        JSON.stringify({ date: todayKey(), entries: data }),
      ).catch(() => undefined);
      return data;
    }
  }
  return readCacheLog();
}
