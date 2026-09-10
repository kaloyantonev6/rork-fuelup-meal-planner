import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Sleep tracking engine.
 * Source: Walsh et al. 2021 (Expert consensus on sleep and athlete health).
 */

const SLEEP_LOG_KEY = "fuelup_sleep_log";

/** Sleep target by age (Walsh 2021 consensus). */
export function getSleepTarget(age: number): { min: number; max: number; unit: string } {
  if (age < 14) return { min: 9, max: 11, unit: "hours" };
  if (age < 18) return { min: 8, max: 10, unit: "hours" };
  return { min: 7, max: 9, unit: "hours" };
}

export interface SleepLog {
  /** date (YYYY-MM-DD) → hours slept (decimal, e.g. 7.5) */
  [date: string]: number;
}

export async function loadSleepLog(): Promise<SleepLog> {
  try {
    const raw = await AsyncStorage.getItem(SLEEP_LOG_KEY);
    return raw ? (JSON.parse(raw) as SleepLog) : {};
  } catch {
    return {};
  }
}

export async function saveSleepHours(dateKey: string, hours: number): Promise<void> {
  const log = await loadSleepLog();
  log[dateKey] = Math.round(hours * 100) / 100;
  try {
    await AsyncStorage.setItem(SLEEP_LOG_KEY, JSON.stringify(log));
  } catch {
    // best-effort
  }
}

/** Mean sleep over the last 7 days (rounded to 1 decimal), null if no entries. */
export function weeklyAverage(log: SleepLog): number | null {
  const now = new Date();
  const values: number[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;
    const v = log[key];
    if (typeof v === "number" && v > 0) values.push(v);
  }
  if (values.length === 0) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

/** Amber-card trigger: below recommended levels for the user's age group. */
export function isSleepDeficient(weeklyAvg: number | null, age: number): boolean {
  if (weeklyAvg === null) return false;
  return age < 18 ? weeklyAvg < 8 : weeklyAvg < 7;
}

export const SLEEP_WARNING_TEXT =
  "Your sleep average is below recommended levels. Short sleep impairs reaction time, decision-making, and increases injury risk. (Walsh 2021)";

export const SLEEP_MATCH_EVE_TEXT =
  "Match day tomorrow. Aim for 8+ hours sleep tonight. A light carb-rich snack before bed can improve sleep quality. (Walsh 2021)";
