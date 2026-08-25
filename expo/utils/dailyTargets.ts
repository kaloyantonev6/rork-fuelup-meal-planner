import { UserProfile, DayType, FootballPosition, SeasonPhase, PerformanceGoal } from "@/types";

export interface DailyTargets {
  bmr: number;
  tdee: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  waterLiters: number;
  positionLabel: string;
  dayTypeLabel: string;
  notes: string[];
}

export interface DayTargets {
  dayType: DayType;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  waterLiters: number;
  proteinPct: number;
  carbsPct: number;
  fatPct: number;
}

// Position-based calorie boost (on training/match days only)
export const POSITION_CALORIE_BOOST: Record<FootballPosition, number> = {
  goalkeeper: 150,
  centre_back: 175,
  full_back: 350,
  defensive_mid: 275,
  central_mid: 300,
  attacking_mid: 300,
  winger: 375,
  striker: 275,
};

// Day-type multipliers applied to TDEE
export const DAY_TYPE_MULTIPLIER: Record<DayType, number> = {
  rest: 0.9,
  training: 1.15,
  match: 1.3,
  recovery: 1.1,
};

// Macro splits by day type
export const MACRO_SPLITS: Record<DayType, { protein: number; carbs: number; fats: number }> = {
  rest: { protein: 30, carbs: 40, fats: 30 },
  training: { protein: 25, carbs: 50, fats: 25 },
  match: { protein: 20, carbs: 60, fats: 20 },
  recovery: { protein: 30, carbs: 45, fats: 25 },
};

// Season phase adjustment
export const SEASON_CALORIE_ADJUSTMENT: Record<SeasonPhase, number> = {
  pre_season: 1.1,
  in_season: 1.0,
  off_season: 0.92,
  injury_recovery: 0.95,
};

// Activity multiplier based on training frequency
const TRAINING_FREQ_MULTIPLIER: Record<string, number> = {
  "1-2": 1.375,
  "3-4": 1.55,
  "5-6": 1.725,
  daily: 1.9,
};

function calculateBMR(gender: string, weight: number, height: number, age: number): number {
  if (gender === "female") {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
  return 10 * weight + 6.25 * height - 5 * age + 5;
}

function getFiberTarget(gender: string, age: number): number {
  if (gender === "female") {
    return age >= 50 ? 21 : 25;
  }
  return age >= 50 ? 30 : 38;
}

function getPositionLabel(position: string): string {
  const labels: Record<string, string> = {
    goalkeeper: "Goalkeeper",
    centre_back: "Centre-Back",
    full_back: "Full-Back",
    defensive_mid: "Defensive Midfielder",
    central_mid: "Central Midfielder",
    attacking_mid: "Attacking Midfielder",
    winger: "Winger",
    striker: "Striker",
  };
  return labels[position] ?? "Player";
}

function getDayTypeLabel(dayType: DayType): string {
  switch (dayType) {
    case "match": return "Match Day";
    case "training": return "Training Day";
    case "recovery": return "Recovery Day";
    case "rest": return "Rest Day";
  }
}

/**
 * Calculate water intake target based on body weight and day type.
 * base = weightKg * 0.033 liters, plus day-type bonus
 */
export function calculateWaterTarget(weight: number, dayType: DayType): number {
  const baseWater = weight * 0.033;
  const dayBonus: Record<DayType, number> = {
    rest: 0,
    training: 0.75,
    match: 1.0,
    recovery: 0.5,
  };
  return Math.round((baseWater + dayBonus[dayType]) * 10) / 10;
}

/**
 * Calculate day-specific targets (calories + macros) for the given day type.
 * This is the core function used by the meal generator.
 */
export function calculateDayTargets(
  profile: UserProfile,
  dayType: DayType,
): DayTargets {
  const weight = profile.weight || 70;
  const height = profile.height || 170;
  const age = profile.age || 20;
  const gender = profile.gender || "male";

  const position = (profile.position ?? "central_mid") as FootballPosition;
  const seasonPhase = (profile.seasonPhase ?? "in_season") as SeasonPhase;
  const trainingFreq = profile.trainingFrequency ?? "3-4";

  const bmr = Math.round(calculateBMR(gender, weight, height, age));
  const activityMult = TRAINING_FREQ_MULTIPLIER[trainingFreq] ?? 1.55;
  const tdee = Math.round(bmr * activityMult);

  const dayMult = DAY_TYPE_MULTIPLIER[dayType];
  const seasonMult = SEASON_CALORIE_ADJUSTMENT[seasonPhase];

  // Position boost applies on training/match days only
  const positionBoost = (dayType === "training" || dayType === "match")
    ? POSITION_CALORIE_BOOST[position] ?? 0
    : 0;

  const calories = Math.round(tdee * dayMult * seasonMult + positionBoost);

  const macros = MACRO_SPLITS[dayType];
  const proteinPct = macros.protein / 100;
  const carbsPct = macros.carbs / 100;
  const fatPct = macros.fats / 100;

  const protein = Math.round((calories * proteinPct) / 4);
  const carbs = Math.round((calories * carbsPct) / 4);
  const fat = Math.round((calories * fatPct) / 9);

  const waterLiters = calculateWaterTarget(weight, dayType);

  return {
    dayType,
    calories,
    protein,
    carbs,
    fat,
    waterLiters,
    proteinPct,
    carbsPct,
    fatPct,
  };
}

function generateNotes(profile: UserProfile, dayType: DayType): string[] {
  const notes: string[] = [];
  const age = profile.age || 20;
  const position = profile.position ?? "central_mid";
  const seasonPhase = profile.seasonPhase ?? "in_season";

  if (age >= 16 && age <= 19) {
    notes.push("Teen athlete: your body is still developing — prioritize adequate calories and calcium.");
  }
  if (age >= 20 && age <= 24) {
    notes.push("Peak performance window: maintain consistent fueling to maximize training adaptations.");
  }

  if (dayType === "match") {
    notes.push("Match day: carb-heavy fueling maximizes glycogen stores for 90 minutes of effort.");
    if (position === "winger" || position === "full_back") {
      notes.push("High-intensity position: you'll burn more sprints — extra carbs are critical.");
    }
  }
  if (dayType === "training") {
    notes.push("Training day: balanced macros with slightly higher carbs to fuel the session.");
  }
  if (dayType === "recovery") {
    notes.push("Recovery day: high protein + anti-inflammatory foods (salmon, berries, leafy greens).");
  }
  if (dayType === "rest") {
    notes.push("Rest day: lower calories, but don't skip protein — your muscles rebuild on off days.");
  }

  if (seasonPhase === "pre_season") {
    notes.push("Pre-season: higher calorie intake supports fitness building and muscle gain.");
  }
  if (seasonPhase === "injury_recovery") {
    notes.push("Injury recovery: protein-heavy, anti-inflammatory foods to speed tissue repair.");
  }

  return notes.slice(0, 3);
}

export function calculateDailyTargets(profile: UserProfile, dayType: DayType = "training"): DailyTargets {
  const weight = profile.weight || 70;
  const height = profile.height || 170;
  const age = profile.age || 20;
  const gender = profile.gender || "male";
  const position = (profile.position ?? "central_mid") as FootballPosition;
  const trainingFreq = profile.trainingFrequency ?? "3-4";

  const bmr = Math.round(calculateBMR(gender, weight, height, age));
  const activityMult = TRAINING_FREQ_MULTIPLIER[trainingFreq] ?? 1.55;
  const tdee = Math.round(bmr * activityMult);

  const dayTarget = calculateDayTargets(profile, dayType);

  const fiber = getFiberTarget(gender, age);
  const positionLabel = getPositionLabel(position);
  const dayTypeLabel = getDayTypeLabel(dayType);
  const notes = generateNotes(profile, dayType);

  console.log("[DailyTargets] BMR:", bmr, "TDEE:", tdee, "Day calories:", dayTarget.calories, "Day:", dayType);

  return {
    bmr,
    tdee,
    calories: dayTarget.calories,
    protein: dayTarget.protein,
    carbs: dayTarget.carbs,
    fat: dayTarget.fat,
    fiber,
    waterLiters: dayTarget.waterLiters,
    positionLabel,
    dayTypeLabel,
    notes,
  };
}
