import AsyncStorage from "@react-native-async-storage/async-storage";
import type { DayType } from "@/types";

/**
 * Evidence-based hydration engine.
 * Sources: ACSM Position Stand 2007, NATA Position Statement 2017,
 * GSSI Sports Science Exchange.
 */

const SWEAT_TEST_KEY = "fuelup_sweat_test";

export interface HydrationTargets {
  baselineDaily: number; // liters
  prePractice: number; // liters, 2-4h before
  duringPerHour: number; // liters per hour of exercise
  postExercise: number; // liters per kg lost (requires weigh-in)
  maxLossPercent: number; // body mass loss ceiling
}

export function calculateHydrationTargets(
  weightKg: number,
  dayType: string,
  temperatureCelsius?: number, // optional — for heat adjustment
): HydrationTargets {
  // ACSM 2007: individualise based on body weight
  const baselineDaily = weightKg * 0.033; // ~33ml per kg

  // Heat adjustment (if user provides temperature)
  const heatMultiplier = temperatureCelsius && temperatureCelsius > 25 ? 1.15 : 1.0;

  // ACSM: 5-7 ml/kg at least 4 hours before exercise
  const prePractice = weightKg * 0.006 * heatMultiplier; // ~6ml/kg = midpoint

  // Sweat rate varies hugely (0.5-2.5 L/h) — use moderate estimate.
  // NATA 2017: individualise via sweat test.
  const duringPerHour = dayType === "match" ? 0.8 : 0.6; // conservative default

  // ACSM: 1.5L per kg of body mass lost (to account for ongoing losses)
  const postExercise = 1.5; // liters per kg lost — requires sweat test

  return {
    baselineDaily: Math.round(baselineDaily * heatMultiplier * 10) / 10,
    prePractice: Math.round(prePractice * 10) / 10,
    duringPerHour,
    postExercise,
    maxLossPercent: 2, // ACSM: "avoid >2% body mass loss"
  };
}

export interface SweatTestResult {
  sweatRateLPerHour: number;
  massLossPercent: number;
  status: string;
  advice: string;
}

export function calculateSweatRate(
  preWeightKg: number,
  postWeightKg: number,
  fluidConsumedMl: number,
  sessionMinutes: number,
): SweatTestResult {
  const massLostKg = preWeightKg - postWeightKg;
  const totalSweatLoss = massLostKg * 1000 + fluidConsumedMl; // ml
  const sweatRateMlPerHour = totalSweatLoss / (sessionMinutes / 60);
  const massLossPercent = (massLostKg / preWeightKg) * 100;

  let status: string;
  let advice: string;

  // NATA 2017 warning: flag overdrinking first
  if (massLostKg < 0) {
    status = "Overhydrated";
    advice =
      "You gained weight during the session — you drank more than you lost. This can be dangerous (hyponatraemia). Reduce fluid intake slightly.";
  } else if (massLossPercent < 1) {
    status = "Well hydrated";
    advice = "Great job — you replaced most of your sweat losses during the session.";
  } else if (massLossPercent < 2) {
    status = "Mild dehydration";
    advice = `Try drinking an extra ${Math.round(massLostKg * 500)}ml during your next session.`;
  } else if (massLossPercent < 3) {
    status = "Moderate dehydration";
    advice = `You lost ${massLossPercent.toFixed(1)}% of your body weight — this impairs performance. Aim to drink ${Math.round(sweatRateMlPerHour * 0.7)}ml/hour during training.`;
  } else {
    status = "Severe dehydration";
    advice = `${massLossPercent.toFixed(1)}% loss is significant. You need a hydration plan — drink ${Math.round(sweatRateMlPerHour * 0.8)}ml/hour and start sessions better hydrated.`;
  }

  return {
    sweatRateLPerHour: Math.round(sweatRateMlPerHour) / 1000,
    massLossPercent: Math.round(massLossPercent * 10) / 10,
    status,
    advice,
  };
}

export interface StoredSweatTest extends SweatTestResult {
  testedAt: string; // ISO date
}

export async function saveSweatTestResult(result: SweatTestResult): Promise<void> {
  const stored: StoredSweatTest = { ...result, testedAt: new Date().toISOString() };
  await AsyncStorage.setItem(SWEAT_TEST_KEY, JSON.stringify(stored));
}

export async function loadSweatTestResult(): Promise<StoredSweatTest | null> {
  try {
    const raw = await AsyncStorage.getItem(SWEAT_TEST_KEY);
    return raw ? (JSON.parse(raw) as StoredSweatTest) : null;
  } catch {
    return null;
  }
}

/**
 * Personal sweat rate (L/hour) overrides the default `duringPerHour` estimate
 * once a sweat test has been completed.
 */
export async function getEffectiveDuringRate(defaultRate: number): Promise<number> {
  const stored = await loadSweatTestResult();
  if (!stored || stored.status === "Overhydrated") return defaultRate;
  return Math.round(stored.sweatRateLPerHour * 10) / 10;
}

/**
 * NATA 2017 hydration warnings. Returns display-ready warning strings.
 */
export function getHydrationWarnings(
  dailyIntakeLiters: number,
  dayType: DayType,
  temperatureCelsius?: number,
): { level: "amber" | "info"; text: string }[] {
  const warnings: { level: "amber" | "info"; text: string }[] = [];

  if (dailyIntakeLiters > 6) {
    warnings.push({
      level: "amber",
      text: "NATA warns against overdrinking — excessive fluid intake can cause hyponatraemia (dangerously low sodium). Drink to thirst, not beyond.",
    });
  }

  if (dayType === "match") {
    warnings.push({
      level: "info",
      text: "Start hydrating 24h before. Check urine colour — pale straw yellow = hydrated.",
    });
  }

  if (temperatureCelsius && temperatureCelsius > 25) {
    warnings.push({
      level: "info",
      text: "Heat increases sweat losses. Aim for an extra 15% fluid today.",
    });
  }

  return warnings;
}
