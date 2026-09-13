/**
 * Unified data layer — Supabase is the source of truth for every user-scoped
 * value; AsyncStorage acts purely as an offline cache mirror.
 *
 * The current user id is bound once by AuthProvider (setDatabaseUserId) so
 * plain lib/ helpers (hydration, sleep, education, ...) stay hook-free while
 * still writing RLS-scoped rows tied to the signed-in account.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";

let currentUserId: string | null = null;

/** Called by AuthProvider whenever the session changes (sign-in/out/restore). */
export function setDatabaseUserId(id: string | null): void {
  currentUserId = id;
}

export function getDatabaseUserId(): string | null {
  return currentUserId;
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Database request failed";
}

// ── Generic per-user key/value store (app_data table) ─────────────────

/**
 * Read a per-user value. Supabase first; the AsyncStorage cache is the
 * offline fallback (and serves data written before this account had a
 * server row — it gets pushed up on the next write).
 */
export async function kvGet<T>(key: string): Promise<T | null> {
  if (currentUserId) {
    try {
      const row = await supabase
        .from("app_data")
        .eq("user_id", currentUserId)
        .eq("key", key)
        .single<{ key: string; value: T | null }>();
      if (row && row.value !== undefined && row.value !== null) {
        void AsyncStorage.setItem(key, JSON.stringify(row.value)).catch(() => undefined);
        return row.value;
      }
    } catch (err) {
      console.log(`[database] kvGet(${key}) fell back to cache:`, errorMessage(err));
    }
  }
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/** Write a per-user value: Supabase first, AsyncStorage mirror (offline-safe). */
export async function kvSet(key: string, value: unknown): Promise<void> {
  void AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => undefined);
  if (!currentUserId) return;
  try {
    await supabase.from("app_data").upsert({
      user_id: currentUserId,
      key,
      value,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.log(`[database] kvSet(${key}) cached locally only:`, errorMessage(err));
  }
}

/** Remove a per-user value from Supabase and the device cache. */
export async function kvRemove(key: string): Promise<void> {
  void AsyncStorage.removeItem(key).catch(() => undefined);
  if (!currentUserId) return;
  try {
    await supabase.from("app_data").eq("user_id", currentUserId).eq("key", key).delete();
  } catch (err) {
    console.log(`[database] kvRemove(${key}) failed:`, errorMessage(err));
  }
}

// ── User profile ───────────────────────────────────────────────────────

export async function getProfile(
  userId: string
): Promise<{ data: Record<string, any> | null; error: string | null }> {
  try {
    const data = await supabase
      .from("profiles")
      .eq("id", userId)
      .single<Record<string, any>>();
    return { data, error: null };
  } catch (err) {
    return { data: null, error: errorMessage(err) };
  }
}

export async function upsertProfile(
  userId: string,
  profile: Record<string, unknown>,
  email?: string
): Promise<{ data: unknown; error: string | null }> {
  const row = {
    id: userId,
    ...(email !== undefined ? { email } : {}),
    ...profile,
    updated_at: new Date().toISOString(),
  };
  try {
    const data = await supabase.from("profiles").upsert(row);
    return { data, error: null };
  } catch (err) {
    return { data: null, error: errorMessage(err) };
  }
}

// ── Weekly schedule ────────────────────────────────────────────────────

export type WeeklyScheduleRow = {
  user_id: string;
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
  updated_at?: string;
};

const DAY_COLUMNS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

/** Monday-first DayType[7] → weekly_schedules row. */
export function scheduleToRow(schedule: string[]): Record<string, string> {
  const row: Record<string, string> = {};
  DAY_COLUMNS.forEach((col, i) => {
    row[col] = schedule[i] ?? "training";
  });
  return row;
}

/** weekly_schedules row → Monday-first DayType[7]. */
export function rowToSchedule(row: Record<string, any>): string[] {
  return DAY_COLUMNS.map((col) => (typeof row[col] === "string" ? row[col] : "training"));
}

export async function getWeeklySchedule(
  userId: string
): Promise<{ data: WeeklyScheduleRow | null; error: string | null }> {
  try {
    const data = await supabase
      .from("weekly_schedules")
      .eq("user_id", userId)
      .single<WeeklyScheduleRow>();
    return { data, error: null };
  } catch (err) {
    return { data: null, error: errorMessage(err) };
  }
}

export async function upsertWeeklySchedule(
  userId: string,
  schedule: Record<string, unknown>
): Promise<{ data: unknown; error: string | null }> {
  try {
    const data = await supabase
      .from("weekly_schedules")
      .onConflict("user_id")
      .upsert({ user_id: userId, ...schedule, updated_at: new Date().toISOString() });
    return { data, error: null };
  } catch (err) {
    return { data: null, error: errorMessage(err) };
  }
}

// ── Meal plans ─────────────────────────────────────────────────────────

export async function getTodayMealPlan(
  userId: string,
  date: string
): Promise<{ data: Record<string, any> | null; error: string | null }> {
  try {
    const data = await supabase
      .from("meal_plans")
      .eq("user_id", userId)
      .eq("date", date)
      .single<Record<string, any>>();
    return { data, error: null };
  } catch (err) {
    return { data: null, error: errorMessage(err) };
  }
}

/**
 * Save a day-scoped plan. `plan` must include the NOT NULL columns of
 * meal_plans (title, duration_days, profile_snapshot) plus `date`, `day_type`
 * and the full day plan in `items` (the recipe catalog lives client-side).
 */
export async function saveMealPlan(
  userId: string,
  plan: Record<string, unknown>
): Promise<{ data: unknown; error: string | null }> {
  try {
    const data = await supabase
      .from("meal_plans")
      .onConflict("user_id,date")
      .upsert({ user_id: userId, ...plan });
    return { data, error: null };
  } catch (err) {
    return { data: null, error: errorMessage(err) };
  }
}

export async function checkOffMeal(
  userId: string,
  mealPlanItemId: string,
  completed: boolean
): Promise<{ data: unknown; error: string | null }> {
  try {
    const data = await supabase
      .from("meal_plan_items")
      .eq("id", mealPlanItemId)
      .eq("user_id", userId)
      .update({ completed, completed_at: completed ? new Date().toISOString() : null });
    return { data, error: null };
  } catch (err) {
    return { data: null, error: errorMessage(err) };
  }
}

export async function getRecipesByDayType(
  dayType: string,
  category?: string
): Promise<{ data: Record<string, any>[]; error: string | null }> {
  try {
    let query = supabase.from("recipes").contains("diet_tags", [dayType]);
    if (category) query = query.eq("category", category);
    const data = await query.select<Record<string, any>>();
    return { data, error: null };
  } catch (err) {
    return { data: [], error: errorMessage(err) };
  }
}

// ── Daily tracking ─────────────────────────────────────────────────────

const num = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);

export async function getDailyTracking(
  userId: string,
  date: string
): Promise<{ data: Record<string, any> | null; error: string | null }> {
  try {
    const data = await supabase
      .from("daily_tracking")
      .eq("user_id", userId)
      .eq("date", date)
      .single<Record<string, any>>();
    return { data, error: null };
  } catch (err) {
    return { data: null, error: errorMessage(err) };
  }
}

/** Upsert one day of tracking: macros mapped to columns, full snapshot in `data`. */
export async function upsertDailyTracking(
  userId: string,
  date: string,
  tracking: unknown
): Promise<{ data: unknown; error: string | null }> {
  const t = (tracking ?? {}) as {
    caloriesConsumed?: unknown;
    meals?: Array<{ completedAt?: string | null; protein?: unknown; carbs?: unknown; fats?: unknown }>;
  };
  const meals = Array.isArray(t.meals) ? t.meals : [];
  const completed = meals.filter((m) => !!m.completedAt);
  try {
    const data = await supabase
      .from("daily_tracking")
      .onConflict("user_id,date")
      .upsert({
        user_id: userId,
        date,
        calories_consumed: num(t.caloriesConsumed),
        protein_consumed: completed.reduce((sum, m) => sum + num(m.protein), 0),
        carbs_consumed: completed.reduce((sum, m) => sum + num(m.carbs), 0),
        fats_consumed: completed.reduce((sum, m) => sum + num(m.fats), 0),
        data: tracking,
        updated_at: new Date().toISOString(),
      });
    return { data, error: null };
  } catch (err) {
    return { data: null, error: errorMessage(err) };
  }
}

// ── Hydration ──────────────────────────────────────────────────────────

export async function logWater(
  userId: string,
  date: string,
  amountMl: number
): Promise<{ data: unknown; error: string | null }> {
  try {
    const data = await supabase
      .from("hydration_logs")
      .insert({ user_id: userId, date, amount_ml: Math.round(amountMl) });
    return { data, error: null };
  } catch (err) {
    return { data: null, error: errorMessage(err) };
  }
}

export async function getHydrationTotal(
  userId: string,
  date: string
): Promise<{ total: number; error: string | null }> {
  try {
    const rows = await supabase
      .from("hydration_logs")
      .eq("user_id", userId)
      .eq("date", date)
      .select<{ amount_ml: number }>("amount_ml");
    const total = rows.reduce((sum, row) => sum + num(row.amount_ml), 0);
    return { total, error: null };
  } catch (err) {
    return { total: 0, error: errorMessage(err) };
  }
}

export async function getHydrationEntries(
  userId: string,
  date: string
): Promise<{ data: Array<{ time: string; ml: number }>; error: string | null }> {
  try {
    const rows = await supabase
      .from("hydration_logs")
      .eq("user_id", userId)
      .eq("date", date)
      .order("created_at", { ascending: true })
      .select<{ amount_ml: number; created_at: string }>("amount_ml,created_at");
    const data = rows.map((row) => {
      const d = new Date(row.created_at);
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      return { time: `${hh}:${mm}`, ml: num(row.amount_ml) };
    });
    return { data, error: null };
  } catch (err) {
    return { data: [], error: errorMessage(err) };
  }
}

/** Clears all of a user's hydration rows for a date (program-change reset). */
export async function resetHydrationDay(userId: string, date: string): Promise<void> {
  try {
    await supabase.from("hydration_logs").eq("user_id", userId).eq("date", date).delete();
  } catch (err) {
    console.log("[database] resetHydrationDay failed:", errorMessage(err));
  }
}
