import type { DayType } from "@/types";

export interface DayTypeMeta {
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  label: string;
}

/** Visual identity for each day type — muted 18% backgrounds, full-color accents. */
export const DAY_TYPE_META: Record<DayType, DayTypeMeta> = {
  training: { color: "#3DDC84", bgColor: "#3DDC8418", borderColor: "#3DDC84", icon: "🏋️", label: "Training" },
  match: { color: "#FF4D5E", bgColor: "#FF4D5E18", borderColor: "#FF4D5E", icon: "⚽", label: "Match Day" },
  rest: { color: "#7E8A93", bgColor: "#7E8A9318", borderColor: "#7E8A93", icon: "😴", label: "Rest" },
  recovery: { color: "#FFC93C", bgColor: "#FFC93C18", borderColor: "#FFC93C", icon: "🧊", label: "Recovery" },
};

export const DAY_TYPES: DayType[] = ["training", "match", "rest", "recovery"];

export const DAY_ABBREVIATIONS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export const FULL_DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;
export const DAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"] as const;

/** Fallback when no schedule has been set yet. Index 0 = Monday. */
export const DEFAULT_WEEKLY_SCHEDULE: DayType[] = [
  "training",
  "training",
  "rest",
  "training",
  "training",
  "match",
  "recovery",
];

export interface ProgramPreset {
  id: string;
  name: string;
  schedule: DayType[];
}

export const PROGRAM_PRESETS: ProgramPreset[] = [
  {
    id: "standard_season",
    name: "Standard Season",
    schedule: [...DEFAULT_WEEKLY_SCHEDULE],
  },
  {
    id: "double_match",
    name: "Double Match Week",
    schedule: ["recovery", "training", "match", "recovery", "training", "match", "recovery"],
  },
  {
    id: "pre_season_grind",
    name: "Pre-Season Grind",
    schedule: ["training", "training", "training", "rest", "training", "training", "rest"],
  },
];

/** Converts JS getDay() (0 = Sunday) to a Monday-first index (0 = Mon … 6 = Sun). */
export function getMondayIndex(date: Date = new Date()): number {
  const jsDay = date.getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}

/** Local-timezone YYYY-MM-DD string (never UTC) used for midnight reset logic. */
export function getLocalDateString(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}
