/**
 * EFSA Dietary Reference Values (EU standard) — replaces US RDAs.
 * Source: EFSA DRV Finder (https://multimedia.efsa.europa.eu/drvs/index.htm)
 */

export interface NutrientDRV {
  nutrient: string;
  maleAdult: number;
  femaleAdult: number;
  maleYouth1317: number;
  femaleYouth1317: number;
  unit: string;
}

export const efsaDRVs: NutrientDRV[] = [
  { nutrient: "Iron", maleAdult: 11, femaleAdult: 16, maleYouth1317: 11, femaleYouth1317: 13, unit: "mg/day" },
  { nutrient: "Calcium", maleAdult: 950, femaleAdult: 950, maleYouth1317: 1150, femaleYouth1317: 1150, unit: "mg/day" },
  { nutrient: "Vitamin D", maleAdult: 15, femaleAdult: 15, maleYouth1317: 15, femaleYouth1317: 15, unit: "µg/day" },
  { nutrient: "Zinc", maleAdult: 11, femaleAdult: 8, maleYouth1317: 11, femaleYouth1317: 8, unit: "mg/day" },
  { nutrient: "Magnesium", maleAdult: 350, femaleAdult: 300, maleYouth1317: 300, femaleYouth1317: 250, unit: "mg/day" },
];

/** Returns the applicable EFSA DRV for a user's age and gender. */
export function getDRV(nutrient: string, age: number, gender: string): NutrientDRV | null {
  const drv = efsaDRVs.find((d) => d.nutrient.toLowerCase() === nutrient.toLowerCase());
  if (!drv) return null;
  return drv;
}

export function formatDRV(drv: NutrientDRV, age: number, gender: string): string {
  const isYouth = age >= 13 && age <= 17;
  const isFemale = gender === "female";
  const value = isYouth
    ? isFemale
      ? drv.femaleYouth1317
      : drv.maleYouth1317
    : isFemale
      ? drv.femaleAdult
      : drv.maleAdult;
  return `${value} ${drv.unit}`;
}
