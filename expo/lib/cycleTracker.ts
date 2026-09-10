import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Optional menstrual cycle awareness (Randell et al. 2021 / FIFA Women's
 * Health Project). Education, not prescription — fully opt-in, stored locally.
 */

const CYCLE_KEY = "fuelup_cycle_tracking";

export interface CycleSettings {
  enabled: boolean;
  cycleLengthDays: number; // default 28
  lastPeriodDate: string; // YYYY-MM-DD
}

export const DEFAULT_CYCLE_SETTINGS: CycleSettings = {
  enabled: false,
  cycleLengthDays: 28,
  lastPeriodDate: "",
};

export async function loadCycleSettings(): Promise<CycleSettings> {
  try {
    const raw = await AsyncStorage.getItem(CYCLE_KEY);
    if (raw) return { ...DEFAULT_CYCLE_SETTINGS, ...(JSON.parse(raw) as Partial<CycleSettings>) };
  } catch {
    // fall through
  }
  return DEFAULT_CYCLE_SETTINGS;
}

export async function saveCycleSettings(settings: CycleSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(CYCLE_KEY, JSON.stringify(settings));
  } catch {
    // best-effort
  }
}

export type CyclePhase = "period" | "follicular" | "luteal" | "unknown";

export function getCyclePhase(settings: CycleSettings, today: Date = new Date()): CyclePhase {
  if (!settings.enabled || !settings.lastPeriodDate) return "unknown";

  const [y, m, d] = settings.lastPeriodDate.split("-").map(Number);
  if (!y || !m || !d) return "unknown";
  const last = new Date(y, m - 1, d);
  const diffDays = Math.floor((today.getTime() - last.getTime()) / 86400000);
  if (diffDays < 0) return "unknown";

  const dayInCycle = (diffDays % settings.cycleLengthDays) + 1;
  if (dayInCycle <= 5) return "period";
  if (dayInCycle <= 14) return "follicular";
  return "luteal";
}

/** Subtle, phase-specific education lines (never prescriptive). */
export const CYCLE_EDUCATION: Record<CyclePhase, string | null> = {
  period: "Iron needs may be higher. Include iron-rich foods this week.",
  follicular: "You may find higher-carb meals more comfortable during this phase.",
  luteal: "Some athletes need ~100-300 extra calories during this phase. Listen to your body.",
  unknown: null,
};

export const CYCLE_SOURCE_TAG = "Based on Randell et al. 2021 / FIFA Women's Health Project";
