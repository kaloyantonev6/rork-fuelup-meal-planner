import { averageForRange, dailySeries, getSleepTarget, type SleepLog } from "@/lib/sleepEngine";

/**
 * Sleep performance metrics (WHOOP-style breakdown, computed honestly from
 * the logged sleep data — Walsh et al. 2021 targets):
 *
 * - Hours vs. Needed  → last night's sleep against the age-based need.
 * - Sleep Consistency → share of the last 7 logged nights hitting the target minimum.
 * - Sleep Efficiency  → weekly average against the age target midpoint.
 * - High Sleep Stress → inverse deficit metric; 0% is best, grows with shortfall.
 */

export interface SleepPerformanceMetrics {
  /** Last night's logged hours, null when not yet logged. */
  lastNightHours: number | null;
  /** Age-based nightly need (target midpoint in hours). */
  neededHours: number;
  /** Ring headline: last night vs need, 0–100. */
  performance: number | null;
  /** 0–100, null without logged nights. */
  hoursVsNeeded: number | null;
  /** 0–100, null without logged nights. */
  consistency: number | null;
  /** 0–100, null without logged nights. */
  efficiency: number | null;
  /** 0–100 where 0 is best, null without logged nights. */
  sleepStress: number | null;
}

function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function clamp(v: number, min = 0, max = 100): number {
  return Math.min(Math.max(v, min), max);
}

/** 0 = poor (amber), 1 = sufficient (grey), 2 = optimal (green). */
export function metricLevel(pct: number, invert = false): 0 | 1 | 2 {
  if (invert) {
    if (pct <= 10) return 2;
    if (pct <= 25) return 1;
    return 0;
  }
  if (pct >= 90) return 2;
  if (pct >= 70) return 1;
  return 0;
}

export function sleepPerformance(log: SleepLog, age: number): SleepPerformanceMetrics {
  const target = getSleepTarget(age);
  const needed = (target.min + target.max) / 2;

  const lastRaw = log[localDateKey(new Date())];
  const lastNightHours = typeof lastRaw === "number" && lastRaw > 0 ? lastRaw : null;
  const hoursVsNeeded = lastNightHours !== null ? Math.round(clamp((lastNightHours / needed) * 100)) : null;

  // Consistency — of the logged nights in the past week, how many hit the minimum.
  const week = dailySeries(log, 7);
  const logged = week.filter((p) => p.hours !== null);
  const hits = logged.filter((p) => (p.hours as number) >= target.min);
  const consistency = logged.length > 0 ? Math.round((hits.length / logged.length) * 100) : null;

  // Efficiency — weekly average against the age target midpoint.
  const weekAvg = averageForRange(log, 0, 7);
  const efficiency = weekAvg !== null ? Math.round(clamp((weekAvg / needed) * 100)) : null;

  // High sleep stress — how far the weekly average sits below the need.
  const sleepStress =
    weekAvg !== null ? Math.round(clamp(((needed - weekAvg) / (needed * 0.5)) * 100)) : null;

  return {
    lastNightHours,
    neededHours: needed,
    performance: hoursVsNeeded,
    hoursVsNeeded,
    consistency,
    efficiency,
    sleepStress,
  };
}
