import type { DayType } from "@/types";

export type MealCategory = "breakfast" | "lunch" | "snack" | "dinner";
export type MealStatus = "pending" | "due" | "completed" | "skipped" | "missed";

export interface MealWindow {
  start: string; // HH:mm
  end: string; // HH:mm
  /** Static suggestion only — live reminders use window end + reminderSettings.delayMinutes */
  reminder: string; // HH:mm
}

export interface MealWindows {
  breakfast: MealWindow;
  lunch: MealWindow;
  /** No snack on rest days */
  snack?: MealWindow;
  dinner: MealWindow;
}

export type MealTimesConfig = Record<DayType, MealWindows>;

/** Expected eating windows per meal category, adjusted by day type. */
export const DEFAULT_MEAL_TIME_WINDOWS: MealTimesConfig = {
  training: {
    breakfast: { start: "07:00", end: "09:00", reminder: "09:30" },
    lunch: { start: "12:00", end: "14:00", reminder: "14:30" },
    snack: { start: "16:00", end: "17:00", reminder: "17:30" },
    dinner: { start: "19:00", end: "21:00", reminder: "21:30" },
  },
  match: {
    breakfast: { start: "08:00", end: "09:30", reminder: "10:00" },
    lunch: { start: "11:30", end: "13:00", reminder: "13:30" },
    snack: { start: "15:00", end: "16:00", reminder: "16:30" },
    dinner: { start: "19:30", end: "21:30", reminder: "22:00" },
  },
  rest: {
    breakfast: { start: "08:00", end: "10:00", reminder: "10:30" },
    lunch: { start: "12:30", end: "14:30", reminder: "15:00" },
    dinner: { start: "19:00", end: "21:00", reminder: "21:30" },
  },
  recovery: {
    breakfast: { start: "07:30", end: "09:30", reminder: "10:00" },
    lunch: { start: "12:00", end: "14:00", reminder: "14:30" },
    snack: { start: "16:00", end: "17:00", reminder: "17:30" },
    dinner: { start: "19:00", end: "21:00", reminder: "21:30" },
  },
};

// ── Storage keys ─────────────────────────────────────────────
export const MEAL_TRACKING_KEY = "mealTracking";
export const MEAL_TRACKING_HISTORY_KEY = "mealTrackingHistory";
export const CUSTOM_MEAL_TIMES_KEY = "customMealTimes";
export const REMINDER_SETTINGS_KEY = "mealReminderSettings";
export const NOTIFICATION_PERMISSION_KEY = "notificationPermission";
export const NOTIFICATION_PERMISSION_DEFERRED_AT_KEY = "notificationPermissionDeferredAt";
/** How long a day's tracking lives in history (4 weeks) */
export const HISTORY_MAX_DAYS = 28;

export interface ReminderSettings {
  enabled: boolean;
  delayMinutes: number;
}

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = { enabled: true, delayMinutes: 30 };
export const REMINDER_DELAY_OPTIONS = [15, 30, 45, 60];

// ── Tracking data structures ─────────────────────────────────
export interface MealCheckoff {
  mealId: string;
  mealTitle: string;
  category: MealCategory;
  scheduledTime: string; // HH:mm — expected eating window start
  completedAt: string | null; // ISO timestamp when ticked off
  skipped: boolean;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface DailyTracking {
  date: string; // YYYY-MM-DD
  dayType: DayType;
  meals: MealCheckoff[];
  calorieTarget: number;
  caloriesConsumed: number; // sum of completed meals' calories
  completionPercent: number; // 0-100
}

// ── Category meta ────────────────────────────────────────────
export const MEAL_CATEGORY_META: Record<MealCategory, { icon: string; label: string; short: string }> = {
  breakfast: { icon: "🍳", label: "Breakfast", short: "BRK" },
  lunch: { icon: "🍽️", label: "Lunch", short: "LUN" },
  snack: { icon: "🍌", label: "Snack", short: "SNK" },
  dinner: { icon: "🥘", label: "Dinner", short: "DIN" },
};

/** Rest days only have 3 meals — no snack slot. */
export function categoriesForDay(dayType: DayType): MealCategory[] {
  return dayType === "rest"
    ? ["breakfast", "lunch", "dinner"]
    : ["breakfast", "lunch", "snack", "dinner"];
}

/** Merges user custom times over the defaults, tolerating partial configs. */
export function getMealWindows(custom: MealTimesConfig | null, dayType: DayType): MealWindows {
  const base = DEFAULT_MEAL_TIME_WINDOWS[dayType];
  const overrides = custom?.[dayType];
  if (!overrides) return base;
  const merged: MealWindows = {
    breakfast: { ...base.breakfast, ...overrides.breakfast },
    lunch: { ...base.lunch, ...overrides.lunch },
    dinner: { ...base.dinner, ...overrides.dinner },
  };
  if (base.snack) {
    merged.snack = { ...base.snack, ...overrides.snack };
  }
  return merged;
}

// ── Time helpers (local timezone only) ───────────────────────
export function parseTimeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

export function minutesNow(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

export function formatMinutes(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function isWithinWindow(nowMin: number, w: MealWindow): boolean {
  const start = parseTimeToMinutes(w.start);
  const end = parseTimeToMinutes(w.end);
  return nowMin >= start && nowMin <= end;
}

export function isPastWindow(nowMin: number, w: MealWindow): boolean {
  return nowMin > parseTimeToMinutes(w.end);
}

/** Derives the visual/behavioural status of a meal from its tracking state + time window. */
export function mealStatus(meal: MealCheckoff, windows: MealWindows, nowMin: number): MealStatus {
  if (meal.completedAt) return "completed";
  if (meal.skipped) return "skipped";
  const w = windows[meal.category];
  if (!w) return "pending";
  if (isWithinWindow(nowMin, w)) return "due";
  if (isPastWindow(nowMin, w)) return "missed";
  return "pending";
}

/** A Date today at the given HH:mm plus `addMinutes`, or null when the time is invalid. */
export function timeToDate(hhmm: string, addMinutes = 0): Date | null {
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return new Date(d.getTime() + addMinutes * 60 * 1000);
}

/** Recomputes derived totals (consumed calories, completion %) from the meals array. */
export function recomputeTracking(t: DailyTracking): DailyTracking {
  const done = t.meals.filter((m) => m.completedAt || m.skipped).length;
  const consumed = t.meals
    .filter((m) => m.completedAt)
    .reduce((acc, m) => acc + m.calories, 0);
  return {
    ...t,
    caloriesConsumed: consumed,
    completionPercent: t.meals.length > 0 ? Math.round((done / t.meals.length) * 100) : 0,
  };
}

// ── Context-aware reminder messages ─────────────────────────
export function getMealReminderTitle(category: MealCategory, dayType: DayType): string {
  const titles: Record<MealCategory, Record<DayType, string>> = {
    breakfast: {
      training: "⚽ Fuel up before training",
      match: "⚽ Match day — don't skip breakfast",
      rest: "🍳 Time for breakfast",
      recovery: "🧊 Recovery starts with breakfast",
    },
    lunch: {
      training: "🍽️ Time to refuel after training",
      match: "⚽ Pre-match meal — don't miss this",
      rest: "🍽️ Lunch time",
      recovery: "🍽️ Recovery lunch — protein up",
    },
    snack: {
      training: "⚡ Post-training snack time",
      match: "⚡ Pre-match snack — quick energy",
      rest: "🍌 Snack time",
      recovery: "🍌 Recovery snack",
    },
    dinner: {
      training: "🍽️ Dinner time — rebuild those muscles",
      match: "🍽️ Post-match recovery dinner",
      rest: "🍽️ Dinner time",
      recovery: "🍽️ Recovery dinner — you need this",
    },
  };
  return titles[category]?.[dayType] ?? "🍽️ Time to eat";
}

export function getMealReminderBody(category: MealCategory, mealTitle: string): string {
  return `Your ${category} is ready: ${mealTitle}. Tap to mark it done.`;
}

export function getFollowUpTitle(category: MealCategory): string {
  const titles: Record<MealCategory, string> = {
    breakfast: "Still haven't had breakfast?",
    lunch: "Lunch is overdue",
    snack: "Don't forget your snack",
    dinner: "Dinner time is passing",
  };
  return titles[category] ?? "Meal reminder";
}

export function getFollowUpBody(category: MealCategory, dayType: DayType): string {
  const bodies: Record<MealCategory, Record<DayType, string>> = {
    breakfast: {
      training: "Skipping breakfast before training tanks your energy. Even something small helps.",
      match: "You need carbs in you for match day. Eat something now.",
      rest: "Take 5 minutes to eat. Your body still needs fuel on rest days.",
      recovery: "Your muscles need protein to rebuild. Don't skip this.",
    },
    lunch: {
      training: "You burned serious calories. Your body needs fuel to recover and adapt.",
      match: "This is your most important pre-match meal. Don't go in on empty.",
      rest: "Even on rest days, consistent meals keep your metabolism right.",
      recovery: "Recovery nutrition matters. Eat to come back stronger.",
    },
    snack: {
      training: "A quick post-training snack helps your muscles recover faster.",
      match: "Small but important — quick carbs before your match.",
      rest: "A light snack keeps your energy stable.",
      recovery: "Keep feeding those muscles. Small meals help recovery.",
    },
    dinner: {
      training: "Last meal of the day — repair and rebuild. Don't skip it.",
      match: "Post-match dinner is crucial for recovery. Eat well tonight.",
      rest: "Finish the day with a solid dinner.",
      recovery: "Night time is when your body repairs. Feed it properly.",
    },
  };
  return bodies[category]?.[dayType] ?? "Don't forget to eat — your performance depends on it.";
}

/** Validates an HH:mm string (00:00–23:59). */
export function isValidTime(t: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(t.trim());
}
