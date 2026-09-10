import AsyncStorage from "@react-native-async-storage/async-storage";
import type { DayType } from "@/types";

/**
 * "Why This Works" education layer — rotating source-attributed cards.
 * Each card cites its Tier 1/Tier 2 source so users know it's not made up.
 */

export interface EducationCard {
  title: string;
  body: string;
  source: string;
  dayTypes: DayType[];
}

export const educationCards: EducationCard[] = [
  {
    title: "Carbs Are Your Fuel",
    body: "Your muscles store ~500g of glycogen (carbs). A 90-minute match uses most of it. It takes 24–48 hours of carb-rich eating to fully reload.",
    source: "UEFA Expert Group 2021",
    dayTypes: ["training", "match", "recovery"],
  },
  {
    title: "Protein Timing Matters",
    body: "Spread protein across the day: 0.25–0.4g per kg at each meal. This is more effective than one big protein hit. For a 70kg player = 18–28g per meal.",
    source: "ISSN Position Stand 2017",
    dayTypes: ["training", "recovery", "rest"],
  },
  {
    title: "The Recovery Window",
    body: "Eat within 30–60 minutes of finishing a match or hard training: 1–1.2g carbs/kg + 0.3–0.5g protein/kg. Chocolate milk works as well as commercial recovery drinks.",
    source: "UEFA 2021",
    dayTypes: ["match", "training"],
  },
  {
    title: "Hydration Is Personal",
    body: "Sweat rates vary from 0.5 to 2.5 litres/hour. A sweat test (weigh before and after training) is the only way to know YOUR needs. Aim to lose less than 2% body weight.",
    source: "ACSM 2007 / NATA 2017",
    dayTypes: ["training", "match"],
  },
  {
    title: "Match Day = Low Fibre, Low Fat",
    body: "High-fibre and high-fat meals slow digestion. Within 3 hours of kickoff, stick to white bread, plain pasta, rice, and lean protein. Save the wholemeal for training days.",
    source: "UEFA 2021 / SDA Soccer",
    dayTypes: ["match"],
  },
  {
    title: "Sleep Is Recovery",
    body: "Poor sleep impairs reaction time more than moderate alcohol consumption. Most young athletes need 8–10 hours. It's not lazy — it's where your body repairs.",
    source: "Walsh et al. 2021 (Expert Consensus)",
    dayTypes: ["rest", "recovery"],
  },
  {
    title: "Iron — The Silent Bottleneck",
    body: "Iron carries oxygen to your muscles. Low iron = tired, slow, and injury-prone. Eat red meat 2–3x/week, or combine plant iron sources with vitamin C.",
    source: "SDA Adolescent Athlete 2014",
    dayTypes: ["rest", "recovery", "training"],
  },
  {
    title: "Don't Skip Meals",
    body: "The biggest nutrition problem in youth football isn't what players eat — it's that they skip meals entirely. A simple meal you actually eat beats a perfect meal you don't.",
    source: "FIFA Training Centre / Collins 2021",
    dayTypes: ["training", "rest", "recovery", "match"],
  },
  {
    title: "Food First, Always",
    body: "Only a handful of supplements have solid evidence. Most are unregulated, some are contaminated. A good diet covers 95% of your needs. (The other 5%? Speak to a sports dietitian.)",
    source: "IOC Supplement Consensus 2018 / AIS ABCD",
    dayTypes: ["rest"],
  },
  {
    title: "Under-Fuelling Hurts Performance",
    body: "Not eating enough doesn't make you leaner — it makes you slower, weaker, and more injury-prone. This is called RED-S (Relative Energy Deficiency in Sport). If you're always tired or getting injured, eat more, not less.",
    source: "IOC REDs Consensus 2023",
    dayTypes: ["training", "rest", "recovery"],
  },
  {
    title: "Your Position Matters",
    body: "A winger covers 20–30% more high-intensity distance than a centre-back. Midfielders cover the most total distance. Higher running demands = more carbs needed.",
    source: "UEFA 2021",
    dayTypes: ["training", "match"],
  },
  {
    title: "Post-Match: Pizza Is Fine",
    body: "Post-match is when compliance matters most. A pizza with some protein delivers carbs for glycogen and calories for recovery. Perfection is the enemy of good enough.",
    source: "UEFA 2021 (practical application)",
    dayTypes: ["match"],
  },
];

const EDUCATION_STATE_KEY = "fuelup_education_state";

interface EducationState {
  /** Titles shown recently — cleared once all matching cards have cycled */
  shown: string[];
  /** Titles dismissed by the user — never reshown */
  dismissed: string[];
  /** Date the current card was picked for (YYYY-MM-DD) */
  dateKey: string;
  title: string;
}

async function loadState(): Promise<EducationState> {
  try {
    const raw = await AsyncStorage.getItem(EDUCATION_STATE_KEY);
    if (raw) return JSON.parse(raw) as EducationState;
  } catch {
    // fall through to fresh state
  }
  return { shown: [], dismissed: [], dateKey: "", title: "" };
}

async function saveState(state: EducationState): Promise<void> {
  try {
    await AsyncStorage.setItem(EDUCATION_STATE_KEY, JSON.stringify(state));
  } catch {
    // best-effort
  }
}

function dateKeyFor(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

/**
 * Picks today's card: one per day, matching today's day type, never repeating
 * until every matching card has been shown, and never reshowing dismissed ones.
 * Stable within a single day (no flicker on re-render).
 */
export async function getTodayEducationCard(dayType: DayType): Promise<EducationCard | null> {
  const today = dateKeyFor(new Date());
  const state = await loadState();

  if (state.dateKey === today && state.title) {
    const card = educationCards.find((c) => c.title === state.title);
    if (card && card.dayTypes.includes(dayType)) return card;
  }

  const matching = educationCards.filter(
    (c) => c.dayTypes.includes(dayType) && !state.dismissed.includes(c.title),
  );
  if (matching.length === 0) return null;

  let pool = matching.filter((c) => !state.shown.includes(c.title));
  if (pool.length === 0) {
    // All matching cards shown — start a new cycle
    state.shown = [];
    pool = matching;
  }

  // Deterministic pick within the day (seeded by date) so re-renders don't flicker
  const seed = today.split("-").reduce((acc, p) => acc + parseInt(p, 10), 0);
  const card = pool[seed % pool.length]!;

  state.dateKey = today;
  state.title = card.title;
  state.shown = [...state.shown, card.title];
  await saveState(state);
  return card;
}

/** Marks the current card as read; the next card appears tomorrow. */
export async function dismissEducationCard(): Promise<void> {
  const state = await loadState();
  if (state.title) {
    state.dismissed = [...state.dismissed, state.title];
  }
  state.title = "";
  state.dateKey = "";
  await saveState(state);
}
