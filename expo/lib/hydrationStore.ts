import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Shared hydration tracking store.
 * Reads/writes the same keys the app has always used:
 * - "fuelup_hydration": { date, intakeMl } — existing, unchanged
 * - "fuelup_hydration_log": { date, entries } — new, additive timestamped log
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

/** Today's total intake in ml (0 when the stored day is stale — auto-rolls over). */
export async function loadTodayHydration(): Promise<number> {
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

/** Adds ml to today's total and appends a timestamped log entry. Returns the new total. */
export async function addWater(ml: number): Promise<number> {
  const current = await loadTodayHydration();
  const next = Math.max(0, current + ml);
  try {
    await AsyncStorage.setItem(HYDRATION_KEY, JSON.stringify({ date: todayKey(), intakeMl: next }));
    const logRaw = await AsyncStorage.getItem(HYDRATION_LOG_KEY);
    const log = logRaw
      ? (JSON.parse(logRaw) as { date: string; entries: HydrationLogEntry[] })
      : null;
    const entries = log && log.date === todayKey() ? log.entries : [];
    if (ml > 0) entries.push({ time: nowLabel(), ml });
    await AsyncStorage.setItem(HYDRATION_LOG_KEY, JSON.stringify({ date: todayKey(), entries }));
  } catch (e) {
    console.log("[HydrationStore] Save failed:", e);
  }
  return next;
}

/** Today's intake log (oldest first). Empty when the stored day is stale. */
export async function loadTodayHydrationLog(): Promise<HydrationLogEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(HYDRATION_LOG_KEY);
    if (!raw) return [];
    const log = JSON.parse(raw) as { date: string; entries: HydrationLogEntry[] };
    return log.date === todayKey() ? log.entries : [];
  } catch {
    return [];
  }
}
