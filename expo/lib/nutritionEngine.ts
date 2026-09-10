import type { DayType, PlayerLevel } from "@/types";

/**
 * Evidence-based nutrition engine.
 * Sources: Hannon et al. 2021 (doubly labelled water in EPL academy players),
 * Stables et al. 2023/2024 (non-academy energy expenditure, carb restriction
 * and bone markers), UEFA Expert Group 2021, ISSN Position Stand 2017,
 * SDA Adolescent Athlete 2014.
 */

// ── 1A. Youth energy expenditure sanity bounds ─────────────────────
// Measured via doubly labelled water in EPL academy players (Hannon 2021).
// These are MEANS — individual variation is ±400-600 kcal.
export const youthEnergyBounds: Record<string, { mean: number; min: number; max: number }> = {
  U12: { mean: 2860, min: 2300, max: 3400 },
  U13: { mean: 2860, min: 2300, max: 3400 },
  U14: { mean: 2950, min: 2400, max: 3500 },
  U15: { mean: 3030, min: 2450, max: 3600 },
  U16: { mean: 3200, min: 2600, max: 3800 },
  U17: { mean: 3400, min: 2750, max: 4050 },
  U18: { mean: 3590, min: 2900, max: 4280 },
};

// Non-academy 13-year-olds had ~15% lower energy expenditure than academy
// peers (Stables et al., 2023) — apply for recreational/amateur level users.
export const nonAcademyMultiplier = 0.85;

export function getYouthAgeGroup(age: number): string {
  if (age <= 12) return "U12";
  if (age <= 13) return "U13";
  if (age <= 14) return "U14";
  if (age <= 15) return "U15";
  if (age <= 16) return "U16";
  if (age <= 17) return "U17";
  return "U18";
}

export interface CalorieClampResult {
  calories: number;
  wasClamped: boolean;
  clampReason: string | null;
}

/** Clamps youth calorie targets into the research-measured range for their age group. */
export function clampCaloriesToResearchBounds(
  calculatedCalories: number,
  age: number,
  level: string,
): CalorieClampResult {
  if (age > 18) {
    // Adults don't get clamped to youth bounds
    return { calories: calculatedCalories, wasClamped: false, clampReason: null };
  }

  const ageGroup = getYouthAgeGroup(age);
  const bounds = youthEnergyBounds[ageGroup];
  if (!bounds) return { calories: calculatedCalories, wasClamped: false, clampReason: null };

  const isNonAcademy = level === "recreational" || level === "amateur";
  const adjustedMin = isNonAcademy ? Math.round(bounds.min * nonAcademyMultiplier) : bounds.min;
  const adjustedMax = isNonAcademy ? Math.round(bounds.max * nonAcademyMultiplier) : bounds.max;

  if (calculatedCalories < adjustedMin) {
    return {
      calories: adjustedMin,
      wasClamped: true,
      clampReason: `Your target has been raised to ${adjustedMin} kcal — the research-based minimum for ${ageGroup} players. Growing athletes need adequate fuel.`,
    };
  }

  if (calculatedCalories > adjustedMax) {
    return {
      calories: adjustedMax,
      wasClamped: true,
      clampReason: `Your target has been capped at ${adjustedMax} kcal based on measured energy needs for ${ageGroup} players.`,
    };
  }

  return { calories: calculatedCalories, wasClamped: false, clampReason: null };
}

// ── 1B. Macronutrient targets — per-kg body weight ─────────────────
export interface MacroTargetsPerKg {
  carbsPerKg: { min: number; max: number };
  proteinPerKg: { min: number; max: number };
  fatPercentOfTotal: { min: number; max: number }; // fat fills remaining calories
}

export const adultMacroTargets: Record<DayType, MacroTargetsPerKg> = {
  match: {
    carbsPerKg: { min: 6, max: 8 }, // UEFA: "up to 8 g/kg in the 24h before"
    proteinPerKg: { min: 1.6, max: 2.0 }, // ISSN: 1.4-2.0, higher end for match recovery
    fatPercentOfTotal: { min: 15, max: 22 },
  },
  training: {
    carbsPerKg: { min: 5, max: 7 }, // UEFA: "moderate-to-high training load"
    proteinPerKg: { min: 1.6, max: 2.2 }, // ISSN: up to 2.2 for demanding training
    fatPercentOfTotal: { min: 20, max: 30 },
  },
  recovery: {
    carbsPerKg: { min: 4, max: 6 }, // Glycogen replenishment window
    proteinPerKg: { min: 1.8, max: 2.2 }, // Elevated for tissue repair
    fatPercentOfTotal: { min: 22, max: 30 },
  },
  rest: {
    carbsPerKg: { min: 3, max: 5 }, // UEFA: "low training load"
    proteinPerKg: { min: 1.4, max: 1.8 },
    fatPercentOfTotal: { min: 25, max: 35 },
  },
};

// Youth adjustments (SDA Adolescent 2014 + Stables 2024).
// NEVER go below adult carb minimums for youth — carb restriction
// impairs bone markers in academy players (Stables 2024).
export const youthMacroAdjustments = {
  carbsPerKgFloor: 5, // never below 5g/kg for under-18s on ANY day type
  proteinPerKgCeiling: 2.0, // no need to exceed 2.0 for youth (SDA 2014)
};

export interface MacroGrams {
  proteinG: number;
  carbsG: number;
  fatsG: number;
}

export function calculateMacroGrams(
  weightKg: number,
  dailyCalories: number,
  dayType: DayType,
  age: number,
): MacroGrams {
  const targets = adultMacroTargets[dayType] ?? adultMacroTargets.training;

  // Use midpoint of ranges
  let carbsPerKg = (targets.carbsPerKg.min + targets.carbsPerKg.max) / 2;
  let proteinPerKg = (targets.proteinPerKg.min + targets.proteinPerKg.max) / 2;

  // Youth adjustments
  if (age < 18) {
    carbsPerKg = Math.max(carbsPerKg, youthMacroAdjustments.carbsPerKgFloor);
    proteinPerKg = Math.min(proteinPerKg, youthMacroAdjustments.proteinPerKgCeiling);
  }

  const carbsG = Math.round(carbsPerKg * weightKg);
  const proteinG = Math.round(proteinPerKg * weightKg);

  // Fat fills remaining calories (minimum 0.8g/kg fat)
  const carbCalories = carbsG * 4;
  const proteinCalories = proteinG * 4;
  const remainingCalories = dailyCalories - carbCalories - proteinCalories;
  const fatsG = Math.max(
    Math.round(remainingCalories / 9),
    Math.round(weightKg * 0.8),
  );

  return { proteinG, carbsG, fatsG };
}
