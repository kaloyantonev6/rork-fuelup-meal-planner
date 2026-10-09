import { kvGet, kvSet } from "@/lib/database";

/**
 * Sleep tracking engine.
 * Source: Walsh et al. 2021 (Expert consensus on sleep and athlete health).
 */

const SLEEP_LOG_KEY = "fuelify_sleep_log";

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
    return (await kvGet<SleepLog>(SLEEP_LOG_KEY)) ?? {};
  } catch {
    return {};
  }
}

export async function saveSleepHours(dateKey: string, hours: number): Promise<void> {
  const log = await loadSleepLog();
  log[dateKey] = Math.round(hours * 100) / 100;
  try {
    await kvSet(SLEEP_LOG_KEY, log);
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

/** One day of sleep data; `hours` is null when that night wasn't logged. */
export interface SleepDayPoint {
  dateKey: string;
  /** Single-letter weekday label (M, T, W…) for chart axes. */
  label: string;
  hours: number | null;
}

const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

function dateKeyFor(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Chronological series of the last `days` nights, oldest first, today last. */
export function dailySeries(log: SleepLog, days: number): SleepDayPoint[] {
  const now = new Date();
  const out: SleepDayPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = dateKeyFor(d);
    const v = log[key];
    out.push({ dateKey: key, label: DAY_LETTERS[d.getDay()], hours: typeof v === "number" && v > 0 ? v : null });
  }
  return out;
}

/** Mean sleep over `[startDaysAgo, startDaysAgo - days + 1]` nights, null if none logged. */
export function averageForRange(log: SleepLog, startDaysAgo: number, days: number): number | null {
  const now = new Date();
  const values: number[] = [];
  for (let i = startDaysAgo; i > startDaysAgo - days; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const v = log[dateKeyFor(d)];
    if (typeof v === "number" && v > 0) values.push(v);
  }
  if (values.length === 0) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

export type SleepDiagnosisLevel = "optimal" | "good" | "fair" | "poor";

export interface SleepDiagnosis {
  level: SleepDiagnosisLevel;
  title: string;
  body: string;
}

/**
 * Performance & recovery diagnosis from the last 7 nights of routine:
 * average vs age target plus night-to-night consistency (Walsh et al. 2021).
 */
export function sleepDiagnosis(log: SleepLog, age: number): SleepDiagnosis {
  const target = getSleepTarget(age);
  const avg = averageForRange(log, 0, 7);
  if (avg === null) {
    return {
      level: "fair",
      title: "Start logging to unlock insights",
      body: "Log a few nights and this section will explain how your routine affects reaction time, muscle repair and match-day readiness.",
    };
  }
  const series = dailySeries(log, 7);
  const logged = series.filter((p) => p.hours !== null);
  const hitCount = logged.filter((p) => p.hours !== null && p.hours >= target.min).length;
  const consistency = logged.length > 0 ? hitCount / logged.length : 0;

  if (avg >= target.min && consistency >= 0.7) {
    return {
      level: "optimal",
      title: "Recovery is dialed in",
      body: `You're averaging ${avg}h with a consistent routine. Deep sleep is when growth hormone drives muscle repair and glycogen stores refill — keep this rhythm and reaction time, decision-making and injury resistance all stay on your side.`,
    };
  }
  if (avg >= target.min) {
    return {
      level: "good",
      title: "Solid routine — make it consistent",
      body: `Your ${avg}h average hits the target, but some nights fall short. Swing nights cost you: every short night measurably slows sprint recovery and sharpens hunger cravings the next day. Anchor a fixed wind-down time.`,
    };
  }
  if (avg >= target.min - 1) {
    return {
      level: "fair",
      title: "Slightly short of target",
      body: `At ${avg}h you're just below your ${target.min}–${target.max}h range. Cumulative short sleep blunts reaction time and doubles injury risk over a season. Adding 30–45 minutes per night closes the gap within a week.`,
    };
  }
  return {
    level: "poor",
    title: "Recovery is compromised",
    body: `At ${avg}h you're well below your ${target.min}–${target.max}h range. Short sleep impairs reaction time more than moderate alcohol, raises injury risk and slows muscle repair. Prioritise an earlier lights-out tonight — even one long night restores sharpness.`,
  };
}
