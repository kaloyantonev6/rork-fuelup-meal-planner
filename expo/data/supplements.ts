/**
 * Supplement classification — AIS Group ABCD framework + IOC Supplement
 * Consensus 2018 + UEFA 2021.
 */

export type AISCategory = "A" | "B" | "C" | "D";

export interface Supplement {
  name: string;
  category: AISCategory;
  evidenceSummary: string;
  footballRelevance: string;
  ageRestriction: number; // minimum age, 0 = no restriction
  antiDopingRisk: "low" | "medium" | "high";
  batchTestingRequired: boolean;
  /** Vitamin/mineral supplements remain visible to under-18s (with a doctor note). */
  isMicronutrient: boolean;
}

export const supplements: Supplement[] = [
  {
    name: "Caffeine",
    category: "A", // strong evidence
    evidenceSummary:
      "Improves endurance, reaction time, and repeated sprint ability. Effective at 3-6mg/kg, 30-60 min before.",
    footballRelevance: "Can improve sprint performance and decision-making in the second half.",
    ageRestriction: 18,
    antiDopingRisk: "low",
    batchTestingRequired: false,
    isMicronutrient: false,
  },
  {
    name: "Creatine Monohydrate",
    category: "A",
    evidenceSummary:
      "3-5g/day improves repeated sprint performance, power output, and may support recovery between matches.",
    footballRelevance: "Relevant for positions requiring repeated sprints (wingers, full-backs, midfielders).",
    ageRestriction: 18,
    antiDopingRisk: "low",
    batchTestingRequired: true,
    isMicronutrient: false,
  },
  {
    name: "Beetroot Juice / Nitrate",
    category: "A",
    evidenceSummary:
      "6-8 mmol nitrate 2-3h before exercise may improve endurance performance via enhanced oxygen efficiency.",
    footballRelevance: "May benefit high-running-volume positions.",
    ageRestriction: 16,
    antiDopingRisk: "low",
    batchTestingRequired: false,
    isMicronutrient: false,
  },
  {
    name: "Vitamin D",
    category: "A",
    evidenceSummary:
      "Supplement if deficient (blood test required). Common in northern latitudes. 1000-2000 IU/day typical.",
    footballRelevance: "Deficiency impairs bone health, immune function, and muscle recovery.",
    ageRestriction: 0,
    antiDopingRisk: "low",
    batchTestingRequired: false,
    isMicronutrient: true,
  },
  {
    name: "Iron",
    category: "A",
    evidenceSummary:
      "Supplement ONLY if blood test confirms deficiency. Do not self-prescribe — excess iron is harmful.",
    footballRelevance: "Low iron = fatigue, poor endurance. Common in female players and adolescents.",
    ageRestriction: 0,
    antiDopingRisk: "low",
    batchTestingRequired: false,
    isMicronutrient: true,
  },
  {
    name: "Omega-3 / Fish Oil",
    category: "B", // some evidence, not conclusive
    evidenceSummary:
      "May reduce exercise-induced inflammation and support brain health. 1-2g EPA+DHA/day.",
    footballRelevance: "Potentially helpful for congested fixture periods and concussion recovery.",
    ageRestriction: 0,
    antiDopingRisk: "low",
    batchTestingRequired: false,
    isMicronutrient: true,
  },
  {
    name: "Tart Cherry Juice",
    category: "B",
    evidenceSummary:
      "Some evidence for reducing muscle soreness and improving recovery. 30ml concentrate 2x/day around matches.",
    footballRelevance: "May reduce DOMS after matches.",
    ageRestriction: 0,
    antiDopingRisk: "low",
    batchTestingRequired: false,
    isMicronutrient: false,
  },
  {
    name: "Pre-Workout Blends",
    category: "D", // banned or high risk
    evidenceSummary: "Unregulated blends with unknown doses. High contamination and doping risk.",
    footballRelevance: "NOT recommended. Multiple positive doping tests traced to pre-workout contamination.",
    ageRestriction: 18,
    antiDopingRisk: "high",
    batchTestingRequired: true,
    isMicronutrient: false,
  },
  {
    name: "Fat Burners / Weight Loss Supplements",
    category: "D",
    evidenceSummary: "No evidence for safe or effective fat loss. Often contain stimulants and banned substances.",
    footballRelevance: "Dangerous and counterproductive for footballers.",
    ageRestriction: 18,
    antiDopingRisk: "high",
    batchTestingRequired: true,
    isMicronutrient: false,
  },
];

export interface AISCategoryMeta {
  label: string;
  color: string;
  backgroundColor: string;
}

export const AIS_CATEGORY_META: Record<AISCategory, AISCategoryMeta> = {
  A: { label: "Evidence-Based", color: "#22C55E", backgroundColor: "#22C55E18" },
  B: { label: "Emerging Evidence", color: "#F59E0B", backgroundColor: "#F59E0B18" },
  C: { label: "Limited Evidence", color: "#9CA3AF", backgroundColor: "#9CA3AF18" },
  D: { label: "Avoid", color: "#EF4444", backgroundColor: "#EF444418" },
};

export const BATCH_TESTING_NOTE =
  "Always use batch-tested products. Look for Kölner Liste or Informed Sport certification — independent labs test supplements for banned substances.";

export const FOOD_FIRST_NOTE =
  "⚠️ Food first. Supplements should never replace a good diet. (IOC 2018, UEFA 2021)";

export const YOUTH_SUPPLEMENT_NOTE = "Speak to a doctor before supplementing.";

/** Under-18s only see micronutrient supplements (SDA 2014: food-first, no performance supps). */
export function supplementsForAge(age: number): Supplement[] {
  if (age >= 18) return supplements;
  return supplements.filter((s) => s.isMicronutrient);
}
