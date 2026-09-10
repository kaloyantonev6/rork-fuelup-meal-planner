import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Youth safety guardrails.
 * Sources: IOC REDs Consensus 2023, SDA Adolescent Athlete 2014,
 * Stables et al. 2024, Randell et al. 2021.
 */

export interface SafetyCheck {
  allowed: boolean;
  message?: string;
  severity: "info" | "warning" | "block";
}

/** Under-18s never see "deficit" or "weight loss" language (also in dailyTargets). */
export function hideWeightLossLabels(age: number): boolean {
  return age < 18;
}

/** Female users of any age are never shown body-comp/weight-loss targets (Randell 2021). */
export function hideBodyCompTargets(gender: string, age: number): boolean {
  return gender === "female" || age < 18;
}

export function checkYouthSafety(
  age: number,
  action: string,
  params?: { supplementCategory?: string },
): SafetyCheck {
  if (age >= 18) return { allowed: true, severity: "info" };

  switch (action) {
    case "set_goal_lose_fat":
    case "set_goal_lean":
      // IOC REDs 2023: under-fuelling harms health AND performance in youth
      return {
        allowed: false,
        message:
          "FuelUp doesn't offer weight-loss or calorie restriction for under-18s. Research shows this can harm your development, bone health, and performance. Focus on \"General Performance\" instead. If you have concerns, speak to a doctor or sports dietitian.",
        severity: "block",
      };

    case "reduce_calories_below_floor":
      // SDA 2014: eat for long-term health
      return {
        allowed: false,
        message:
          "Your calorie target can't go below the research-based minimum for your age group. Growing athletes need adequate energy.",
        severity: "block",
      };

    case "enable_low_carb":
    case "enable_keto":
      // Stables 2024: training with reduced carb affects bone markers in academy players
      return {
        allowed: false,
        message:
          "Low-carb and keto diets are not available for under-18s. Research on academy players shows carbohydrate restriction can negatively affect bone health.",
        severity: "block",
      };

    case "view_supplement":
      // SDA 2014: no performance supplements for minors
      if (params?.supplementCategory === "performance") {
        return {
          allowed: false,
          message:
            "Performance supplements (creatine, caffeine, pre-workouts) are not recommended for under-18s. Focus on food-first nutrition.",
          severity: "block",
        };
      }
      return { allowed: true, severity: "info" };

    case "set_body_comp_target":
      // Randell 2021: no body composition targets for youth/sub-elite
      return {
        allowed: false,
        message:
          "FuelUp doesn't set body composition or weight targets for under-18 players. Focus on fuelling your training and recovery.",
        severity: "block",
      };

    default:
      return { allowed: true, severity: "info" };
  }
}

// ── 4B. RED-S warning system (IOC REDs 2023) ───────────────────────
export const REDS_SYMPTOMS = [
  "Feeling unusually tired despite rest",
  "Getting sick more often than usual",
  "Stress fractures or bone injuries",
  "Irregular or missed periods (female)",
  "Losing weight without trying",
  "Mood changes or irritability",
  "Poor concentration",
] as const;

export const REDS_RESPONSE_TEXT =
  "These can be signs of under-fuelling (Relative Energy Deficiency in Sport). We recommend speaking to a doctor or sports dietitian. FuelUp can help you eat enough — but it can't diagnose or treat medical conditions.";

export const REDS_INFO_TEXT =
  "Learn more about RED-S: the IOC consensus (2023) describes how chronic under-fuelling relative to exercise load impairs metabolism, bone health, immunity, and performance. Recovery focuses on gradually increasing energy intake to match training demands.";

const HEALTH_CHECK_KEY = "fuelup_health_check_last_shown";

/** Health check cadence: monthly for adults, fortnightly for under-18s. */
export function healthCheckIntervalDays(age: number): number {
  return age < 18 ? 14 : 30;
}

export function healthCheckIntervalMs(age: number): number {
  return healthCheckIntervalDays(age) * 24 * 60 * 60 * 1000;
}

export async function shouldShowHealthCheck(age: number): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(HEALTH_CHECK_KEY);
    if (!raw) return true;
    const last = new Date(raw).getTime();
    if (Number.isNaN(last)) return true;
    return Date.now() - last >= healthCheckIntervalMs(age);
  } catch {
    return false;
  }
}

export async function markHealthCheckShown(): Promise<void> {
  try {
    await AsyncStorage.setItem(HEALTH_CHECK_KEY, new Date().toISOString());
  } catch {
    // best-effort
  }
}

// ── 4C. Nutrient watch list for teens (SDA Adolescent 2014) ────────
export interface YouthNutrientCard {
  nutrient: string;
  icon: string;
  why: string;
  foods: string[];
  source: string;
  accentColor: string;
}

export const youthNutrientCards: YouthNutrientCard[] = [
  {
    nutrient: "Iron",
    icon: "🩸",
    why: "Iron carries oxygen to your muscles. Low iron = low energy, poor endurance. Common in growing athletes.",
    foods: ["Red meat 2-3x/week", "Spinach with vitamin C food", "Fortified cereals", "Lentils and beans"],
    source: "SDA Adolescent Athlete 2014",
    accentColor: "#EF4444",
  },
  {
    nutrient: "Calcium",
    icon: "🦴",
    why: "You're building bone density right now that has to last your whole life. Peak bone mass is reached in your 20s.",
    foods: ["Milk & yogurt daily", "Cheese", "Fortified plant milks", "Tinned fish with bones"],
    source: "SDA Adolescent Athlete 2014",
    accentColor: "#F1F5F9",
  },
  {
    nutrient: "Vitamin D",
    icon: "☀️",
    why: "Vitamin D helps absorb calcium and supports immune function. Low levels are common in athletes who train indoors or live in northern climates.",
    foods: ["Oily fish (salmon, mackerel)", "Eggs", "Fortified milk", "15-20 min sunlight when possible"],
    source: "SDA Adolescent Athlete 2014",
    accentColor: "#F59E0B",
  },
];

/** One nutrient card per month, rotating January → December. */
export function getMonthlyNutrientCard(date: Date = new Date()): YouthNutrientCard {
  const month = date.getMonth(); // 0-11
  return youthNutrientCards[month % youthNutrientCards.length]!;
}

/** True for the 13-18 nutrient watch list audience. */
export function isTeenNutrientAudience(age: number): boolean {
  return age >= 13 && age <= 18;
}
