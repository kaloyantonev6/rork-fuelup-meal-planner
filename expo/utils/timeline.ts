import { DayType } from "@/types";

export interface TimelineEntry {
  offsetLabel: string;
  timeLabel: string;
  label: string;
  description: string;
  caloriePct: number;
  example: string;
  mealSlot:
    | "breakfast"
    | "pre_match_meal"
    | "pre_match_snack"
    | "hydration"
    | "half_time"
    | "post_match"
    | "evening"
    | "pre_training_meal"
    | "pre_training_snack"
    | "training_session"
    | "post_training"
    | "mid_morning_snack"
    | "afternoon_snack";
}

export interface TimelineTemplate {
  dayType: DayType;
  sessionLabel: string;
  timeLabel: string;
  offsets: number[];
  entries: Omit<TimelineEntry, "timeLabel">[];
  hydrationNote: string;
}

export const TIMELINE_TEMPLATES: Record<DayType, TimelineTemplate> = {
  match: {
    dayType: "match",
    sessionLabel: "KICKOFF",
    timeLabel: "Kickoff",
    offsets: [-7, -4, -1.5, -0.5, 0, 2, 5],
    entries: [
      { offsetLabel: "-7h", label: "Breakfast", description: "High-carb, moderate protein, low fat", caloriePct: 0.22, example: "Oatmeal with banana, honey & berries", mealSlot: "breakfast" },
      { offsetLabel: "-4h", label: "Pre-Match Meal", description: "Carb-rich, easily digestible, low fiber", caloriePct: 0.28, example: "Pasta with chicken & light tomato sauce", mealSlot: "pre_match_meal" },
      { offsetLabel: "-1.5h", label: "Pre-Match Snack", description: "Quick energy, easy on stomach", caloriePct: 0.08, example: "Banana + energy bar", mealSlot: "pre_match_snack" },
      { offsetLabel: "-30min", label: "Hydration", description: "400-500ml water with electrolytes", caloriePct: 0, example: "Water + electrolyte tablet", mealSlot: "hydration" },
      { offsetLabel: "Half-Time", label: "Half-Time Fuel", description: "Quick carbs, small amount", caloriePct: 0.04, example: "Orange slices + sip of sports drink", mealSlot: "half_time" },
      { offsetLabel: "+2h", label: "Post-Match Recovery", description: "3:1 carb-to-protein ratio, within 60 min", caloriePct: 0.20, example: "Chocolate milk + rice with chicken", mealSlot: "post_match" },
      { offsetLabel: "+5h", label: "Evening Meal", description: "Balanced recovery dinner", caloriePct: 0.18, example: "Salmon, sweet potato, steamed vegetables", mealSlot: "evening" },
    ],
    hydrationNote: "Start hydrating 24h before kickoff. Aim for 500ml 2 hours before, then 250ml 30 min before. Sip at half-time.",
  },
  training: {
    dayType: "training",
    sessionLabel: "TRAINING",
    timeLabel: "Training",
    offsets: [-8, -4, -1.5, -0.5, 0, 1, 4],
    entries: [
      { offsetLabel: "-8h", label: "Breakfast", description: "High-carb, moderate protein to fuel the day", caloriePct: 0.20, example: "Footballer's overnight oats with berries", mealSlot: "breakfast" },
      { offsetLabel: "-4h", label: "Pre-Training Meal", description: "Balanced carbs + protein, easy to digest", caloriePct: 0.25, example: "High-protein training day wrap + rice", mealSlot: "pre_training_meal" },
      { offsetLabel: "-1.5h", label: "Pre-Training Snack", description: "Quick energy, light on the stomach", caloriePct: 0.08, example: "Banana & PB energy toast", mealSlot: "pre_training_snack" },
      { offsetLabel: "-30min", label: "Hydration", description: "400-500ml water + electrolytes", caloriePct: 0, example: "Water + electrolyte tablet", mealSlot: "hydration" },
      { offsetLabel: "Session", label: "Training Session", description: "Your main pitch work. Sip fluids throughout.", caloriePct: 0, example: "Sip 150-250ml every 15-20 min", mealSlot: "training_session" },
      { offsetLabel: "+1h", label: "Post-Training Recovery", description: "20-25g protein + carbs within 60 min", caloriePct: 0.25, example: "Recovery chocolate smoothie + rice bowl", mealSlot: "post_training" },
      { offsetLabel: "+4h", label: "Evening Meal", description: "Balanced dinner to replenish glycogen", caloriePct: 0.22, example: "Salmon, quinoa and roasted vegetables", mealSlot: "evening" },
    ],
    hydrationNote: "Start hydrating 2 hours before training. Aim for 5-7ml/kg body weight about 2h before the session.",
  },
  rest: {
    dayType: "rest",
    sessionLabel: "DAY",
    timeLabel: "Rest",
    offsets: [7, 10, 13, 16, 19],
    entries: [
      { offsetLabel: "07:00", label: "Breakfast", description: "Steady energy, anti-inflammatory where possible", caloriePct: 0.25, example: "Recovery berry protein bowl", mealSlot: "breakfast" },
      { offsetLabel: "10:00", label: "Mid-Morning Snack", description: "Light protein + fiber", caloriePct: 0.10, example: "Greek yogurt with nuts", mealSlot: "mid_morning_snack" },
      { offsetLabel: "13:00", label: "Lunch", description: "Balanced macros, lighter than training day", caloriePct: 0.30, example: "Grilled chicken salad with whole grains", mealSlot: "pre_training_meal" },
      { offsetLabel: "16:00", label: "Afternoon Snack", description: "Sustained energy, no heavy fats", caloriePct: 0.10, example: "Apple + handful of almonds", mealSlot: "afternoon_snack" },
      { offsetLabel: "19:00", label: "Dinner", description: "Recovery-focused, protein + vegetables", caloriePct: 0.25, example: "Anti-inflammatory salmon bowl", mealSlot: "evening" },
    ],
    hydrationNote: "Rest days still need 2-3L fluid. Keep a bottle nearby and sip steadily.",
  },
  recovery: {
    dayType: "recovery",
    sessionLabel: "DAY",
    timeLabel: "Recovery",
    offsets: [7, 10, 13, 16, 19],
    entries: [
      { offsetLabel: "07:00", label: "Breakfast", description: "Anti-inflammatory, protein-rich start", caloriePct: 0.25, example: "Recovery berry protein bowl", mealSlot: "breakfast" },
      { offsetLabel: "10:00", label: "Mid-Morning Snack", description: "Protein + polyphenols", caloriePct: 0.10, example: "Tart cherry juice + handful of nuts", mealSlot: "mid_morning_snack" },
      { offsetLabel: "13:00", label: "Lunch", description: "High-protein, micronutrient-dense", caloriePct: 0.30, example: "Salmon, quinoa and leafy greens", mealSlot: "pre_training_meal" },
      { offsetLabel: "16:00", label: "Afternoon Snack", description: "Light carbs + protein", caloriePct: 0.10, example: "Greek yogurt with berries", mealSlot: "afternoon_snack" },
      { offsetLabel: "19:00", label: "Dinner", description: "Omega-3 rich, anti-inflammatory dinner", caloriePct: 0.25, example: "Grilled mackerel with sweet potato", mealSlot: "evening" },
    ],
    hydrationNote: "Recovery days need extra fluid to help clear soreness. Aim for 2.5-3L.",
  },
};

export function parseTimeString(timeStr: string): { hour: number; minute: number } {
  const parts = timeStr.split(":");
  const hour = parseInt(parts[0] ?? "15", 10) || 15;
  const minute = parseInt(parts[1] ?? "0", 10) || 0;
  return { hour, minute };
}

export function formatTime(hour: number, minute: number): string {
  const h = ((hour % 24) + 24) % 24;
  const m = ((minute % 60) + 60) % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function generateTimeline(
  sessionStr: string,
  dailyCalories: number,
  template: TimelineTemplate,
): TimelineEntry[] {
  const { hour: sHour, minute: sMinute } = parseTimeString(sessionStr);
  const sessionMinutes = sHour * 60 + sMinute;

  return template.entries.map((tmpl, idx) => {
    const offsetH = template.offsets[idx] ?? 0;
    let timeLabel: string;

    if (template.dayType === "match" && idx === 4) {
      timeLabel = "Half-Time";
    } else if (template.dayType === "rest" || template.dayType === "recovery") {
      timeLabel = formatTime(offsetH, 0);
    } else {
      const totalMinutes = sessionMinutes + Math.round(offsetH * 60);
      timeLabel = formatTime(Math.floor(totalMinutes / 60), totalMinutes % 60);
    }

    return {
      ...tmpl,
      timeLabel,
      offsetLabel: tmpl.offsetLabel === "Half-Time" ? "HT" : tmpl.offsetLabel,
    };
  });
}

export function getCurrentTimelineStatus(
  entries: TimelineEntry[],
  sessionStr: string,
  template: TimelineTemplate,
): { activeIdx: number; nowMinutes: number; sessionMinutes: number } {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const { hour: sHour, minute: sMinute } = parseTimeString(sessionStr);
  const sessionMinutes = sHour * 60 + sMinute;
  const halfTimeOffset = 45;

  const entryMinutes = entries.map((entry, idx) => {
    if (template.dayType === "match" && idx === 4) {
      return sessionMinutes + halfTimeOffset;
    }
    if (template.dayType === "rest" || template.dayType === "recovery") {
      return (template.offsets[idx] ?? 0) * 60;
    }
    return sessionMinutes + Math.round((template.offsets[idx] ?? 0) * 60);
  });

  let activeIdx = 0;
  for (let i = 0; i < entryMinutes.length; i++) {
    if (nowMinutes >= entryMinutes[i]!) {
      activeIdx = i;
    }
  }

  const lastEntryMinutes = entryMinutes[entryMinutes.length - 1] ?? sessionMinutes;
  if (nowMinutes > lastEntryMinutes + 30) {
    activeIdx = entries.length - 1;
  }

  return { activeIdx, nowMinutes, sessionMinutes };
}

/**
 * Resolve a timeline entry's timeLabel (e.g. "15:00" or "Half-Time") to a
 * concrete Date today. Returns null for non-clock labels like "Half-Time"
 * or "Session" that cannot be scheduled.
 */
export function entryTimeToDate(
  entry: TimelineEntry,
  sessionStr: string,
  template: TimelineTemplate,
  idx: number,
): Date | null {
  const { hour: sHour, minute: sMinute } = parseTimeString(sessionStr);
  const sessionMinutes = sHour * 60 + sMinute;
  const halfTimeOffset = 45;

  let minutes: number | null = null;

  if (template.dayType === "match" && idx === 4) {
    minutes = sessionMinutes + halfTimeOffset;
  } else if (template.dayType === "rest" || template.dayType === "recovery") {
    minutes = (template.offsets[idx] ?? 0) * 60;
  } else if (entry.timeLabel !== "Half-Time" && entry.timeLabel !== "Session") {
    const { hour, minute } = parseTimeString(entry.timeLabel);
    minutes = hour * 60 + minute;
  }

  if (minutes === null) return null;

  const d = new Date();
  d.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return d;
}

/**
 * Format a millisecond delta as a friendly "in Xh Ym" / "in Y min" string.
 */
export function formatDuration(deltaMs: number): string {
  const mins = Math.max(0, Math.round(deltaMs / 60000));
  if (mins <= 0) return "soon";
  if (mins < 60) return `in ${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (m === 0) return `in ${h}h`;
  return `in ${h}h ${m}m`;
}
