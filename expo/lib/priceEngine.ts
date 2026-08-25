import { findIngredientPrice, IngredientPrice } from "@/data/ingredientPrices";

export const retailersByCountry: Record<string, { discount: string[]; midRange: string[]; premium: string[] }> = {
  DE: { discount: ["Aldi", "Lidl", "Penny", "Netto"], midRange: ["Rewe", "Edeka", "Kaufland"], premium: ["Bio Company", "Alnatura", "Denn's Biomarkt"] },
  NL: { discount: ["Aldi", "Lidl", "Dirk"], midRange: ["Albert Heijn", "Jumbo", "Plus"], premium: ["Marqt", "Ekoplaza"] },
  FR: { discount: ["Lidl", "Aldi", "Leader Price"], midRange: ["Carrefour", "Intermarché", "Auchan"], premium: ["Monoprix", "Bio c' Bon", "Naturalia"] },
  ES: { discount: ["Lidl", "Aldi", "Dia"], midRange: ["Mercadona", "Carrefour", "Eroski"], premium: ["El Corte Inglés", "Veritas"] },
  IT: { discount: ["Lidl", "Aldi", "Eurospin", "MD"], midRange: ["Coop", "Conad", "Esselunga"], premium: ["Eataly", "NaturaSì"] },
  AT: { discount: ["Hofer", "Lidl", "Penny"], midRange: ["Billa", "Spar", "Interspar"], premium: ["Billa Plus", "Denn's Biomarkt"] },
  BE: { discount: ["Aldi", "Lidl", "Colruyt"], midRange: ["Delhaize", "Carrefour", "Albert Heijn"], premium: ["Bio-Planet", "Färm"] },
  PT: { discount: ["Lidl", "Aldi", "Minipreço"], midRange: ["Continente", "Pingo Doce", "Intermarché"], premium: ["El Corte Inglés", "Go Natural"] },
  IE: { discount: ["Lidl", "Aldi"], midRange: ["Tesco", "Dunnes", "SuperValu"], premium: ["Marks & Spencer", "Avoca"] },
  PL: { discount: ["Lidl", "Aldi", "Biedronka", "Netto"], midRange: ["Kaufland", "Carrefour", "Żabka"], premium: ["Piotr i Paweł", "Organic Farma Zdrowia"] },
  GR: { discount: ["Lidl", "Aldi"], midRange: ["Sklavenitis", "AB Vassilopoulos", "Masoutis"], premium: ["The Food Company"] },
  BG: { discount: ["Lidl", "Kaufland"], midRange: ["Billa", "CBA", "Fantastico"], premium: ["DM", "Bio Bulgaria"] },
  RO: { discount: ["Lidl", "Penny", "Profi"], midRange: ["Kaufland", "Carrefour", "Mega Image"], premium: ["Auchan", "Cora"] },
  HU: { discount: ["Lidl", "Aldi", "Penny"], midRange: ["Tesco", "Spar", "CBA"], premium: ["Auchan", "Rossmann Bio"] },
  CZ: { discount: ["Lidl", "Aldi", "Penny"], midRange: ["Kaufland", "Tesco", "Albert"], premium: ["Marks & Spencer", "Globus"] },
  SE: { discount: ["Lidl", "Willys", "Netto"], midRange: ["ICA", "Coop", "Hemköp"], premium: ["Citygross", "Paradiset"] },
  DK: { discount: ["Lidl", "Aldi", "Netto", "Fakta"], midRange: ["Føtex", "SuperBrugsen", "Bilka"], premium: ["Irma", "MENY"] },
  FI: { discount: ["Lidl"], midRange: ["S-Market", "K-Market", "Prisma"], premium: ["Stockmann", "Anton & Anton"] },
  SK: { discount: ["Lidl", "Kaufland"], midRange: ["Tesco", "Billa", "COOP Jednota"], premium: ["Yeme"] },
  SI: { discount: ["Lidl", "Hofer"], midRange: ["Mercator", "Spar", "Tuš"], premium: ["Interspar"] },
  HR: { discount: ["Lidl", "Kaufland"], midRange: ["Konzum", "Spar", "Studenac"], premium: ["Interspar"] },
  LT: { discount: ["Lidl"], midRange: ["Maxima", "IKI", "Norfa"], premium: ["Rimi"] },
  LV: { discount: ["Lidl"], midRange: ["Maxima", "Rimi", "Top!"], premium: ["Stockmann"] },
  EE: { discount: ["Lidl"], midRange: ["Maxima", "Rimi", "Coop"], premium: ["Stockmann", "Selver"] },
  LU: { discount: ["Lidl", "Aldi"], midRange: ["Cactus", "Delhaize", "Match"], premium: ["Naturata"] },
  MT: { discount: ["Lidl"], midRange: ["Park Towers", "Pavi", "Valyou"], premium: ["The Convenience Shop"] },
  CY: { discount: ["Lidl"], midRange: ["Alphamega", "Papantoniou", "Carrefour"], premium: ["Marks & Spencer"] },
};

export const countryMultiplier: Record<string, number> = {
  DE: 1.0, NL: 1.05, FR: 1.08, ES: 0.88, IT: 0.95,
  AT: 1.05, BE: 1.06, PT: 0.82, IE: 1.12, PL: 0.62,
  GR: 0.80, BG: 0.52, RO: 0.55, HU: 0.58, CZ: 0.68,
  SE: 1.18, DK: 1.22, FI: 1.15, SK: 0.65, SI: 0.85,
  HR: 0.70, LT: 0.60, LV: 0.62, EE: 0.68, LU: 1.15,
  MT: 0.90, CY: 0.92,
};

const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  Austria: "AT", Belgium: "BE", Bulgaria: "BG", Croatia: "HR", Cyprus: "CY",
  "Czech Republic": "CZ", Denmark: "DK", Estonia: "EE", Finland: "FI", France: "FR",
  Germany: "DE", Greece: "GR", Hungary: "HU", Ireland: "IE", Italy: "IT",
  Latvia: "LV", Lithuania: "LT", Luxembourg: "LU", Malta: "MT", Netherlands: "NL",
  Poland: "PL", Portugal: "PT", Romania: "RO", Slovakia: "SK", Slovenia: "SI",
  Spain: "ES", Sweden: "SE",
};

export function countryNameToCode(name: string): string {
  return COUNTRY_NAME_TO_CODE[name] || name;
}

export function getTopRetailers(countryCode: string): { discount: string[]; midRange: string[]; premium: string[] } {
  return retailersByCountry[countryCode] ?? retailersByCountry["DE"] ?? { discount: ["Lidl"], midRange: ["Tesco"], premium: ["Bio Company"] };
}

export function getCountryMultiplier(countryCode: string): number {
  return countryMultiplier[countryCode] ?? 1.0;
}

export interface ItemPrice {
  name: string;
  price: number;
  quantity: number;
  unit: string;
}

export interface PriceComparison {
  retailerName: string;
  retailerType: "discount" | "midRange" | "premium";
  totalPrice: number;
  itemPrices: ItemPrice[];
  savingsVsMidRange: number;
  savingsPercent: number;
}

function convertQuantityToUnits(quantity: number, fromUnit: string, toUnit: string): number {
  const q = quantity;
  const fu = fromUnit.toLowerCase().trim();
  const tu = toUnit.toLowerCase().trim();

  if (fu === tu) return q;
  if (fu === "g" && tu === "kg") return q / 1000;
  if (fu === "kg" && tu === "g") return q * 1000;
  if (fu === "ml" && tu === "litre") return q / 1000;
  if (fu === "litre" && tu === "ml") return q * 1000;
  return q;
}

export function compareShoppingListPrices(
  ingredients: { name: string; quantity: number; unit: string }[],
  countryCode: string,
): PriceComparison[] {
  const countryMult = getCountryMultiplier(countryCode);
  const retailers = retailersByCountry[countryCode];
  if (!retailers) return [];

  const results: PriceComparison[] = [];

  const types: {
    key: "discount" | "midRange" | "premium";
    multiplierKey: "discountMultiplier" | "midRangeMultiplier" | "premiumMultiplier";
  }[] = [
    { key: "discount", multiplierKey: "discountMultiplier" },
    { key: "midRange", multiplierKey: "midRangeMultiplier" },
    { key: "premium", multiplierKey: "premiumMultiplier" },
  ];

  let midRangeTotal = 0;

  for (const type of types) {
    const retailerNames = retailers[type.key];
    const itemPrices: ItemPrice[] = [];
    let total = 0;

    for (const ingredient of ingredients) {
      const priceData = findIngredientPrice(ingredient.name);
      const unitPrice = priceData.basePrice * priceData[type.multiplierKey] * countryMult;
      const quantityMultiplier = convertQuantityToUnits(ingredient.quantity, ingredient.unit, priceData.unit);
      const price = Math.round(unitPrice * quantityMultiplier * 100) / 100;
      total += price;
      itemPrices.push({ name: ingredient.name, price, quantity: ingredient.quantity, unit: ingredient.unit });
    }

    if (type.key === "midRange") midRangeTotal = total;

    for (const name of retailerNames) {
      results.push({
        retailerName: name,
        retailerType: type.key,
        totalPrice: Math.round(total * 100) / 100,
        itemPrices,
        savingsVsMidRange: 0,
        savingsPercent: 0,
      });
    }
  }

  for (const r of results) {
    r.savingsVsMidRange = Math.round((midRangeTotal - r.totalPrice) * 100) / 100;
    r.savingsPercent = midRangeTotal > 0 ? Math.round((r.savingsVsMidRange / midRangeTotal) * 100) : 0;
  }

  results.sort((a, b) => a.totalPrice - b.totalPrice);
  return results;
}

export interface BulkSuggestion {
  ingredientName: string;
  regularUnit: string;
  regularPrice: number;
  bulkSize: number;
  bulkUnit: string;
  bulkPrice: number;
  bulkSavingsPercent: number;
  pricePerUnitRegular: number;
  pricePerUnitBulk: number;
}

export function getBulkSuggestions(
  ingredientNames: string[],
): BulkSuggestion[] {
  const suggestions: BulkSuggestion[] = [];
  const seen = new Set<string>();

  for (const name of ingredientNames) {
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const priceData = findIngredientPrice(name);
    if (!priceData.bulkSize || !priceData.bulkPrice || !priceData.bulkSavingsPercent) continue;
    if (priceData.bulkSavingsPercent < 15) continue;

    suggestions.push({
      ingredientName: priceData.name,
      regularUnit: priceData.unit,
      regularPrice: priceData.basePrice,
      bulkSize: priceData.bulkSize,
      bulkUnit: priceData.bulkUnit ?? priceData.unit,
      bulkPrice: priceData.bulkPrice,
      bulkSavingsPercent: priceData.bulkSavingsPercent,
      pricePerUnitRegular: Math.round((priceData.basePrice / priceData.bulkSize) * 100) / 100,
      pricePerUnitBulk: Math.round((priceData.bulkPrice / priceData.bulkSize) * 100) / 100,
    });
  }

  return suggestions;
}

export interface SmartMixItem {
  ingredientName: string;
  bestRetailer: string;
  bestPrice: number;
  originalPrice: number;
}

export interface SmartMix {
  items: SmartMixItem[];
  totalSmartMix: number;
  totalBestSingle: number;
  savings: number;
  byRetailer: Record<string, { items: string[]; total: number }>;
}

export function calculateSmartMix(
  ingredients: { name: string; quantity: number; unit: string }[],
  countryCode: string,
): SmartMix {
  const countryMult = getCountryMultiplier(countryCode);
  const retailers = retailersByCountry[countryCode];
  if (!retailers) {
    return { items: [], totalSmartMix: 0, totalBestSingle: 0, savings: 0, byRetailer: {} };
  }

  const allRetailers = [...retailers.discount, ...retailers.midRange, ...retailers.premium];
  const items: SmartMixItem[] = [];
  const byRetailer: Record<string, { items: string[]; total: number }> = {};

  for (const ingredient of ingredients) {
    const priceData = findIngredientPrice(ingredient.name);
    let bestPrice = Infinity;
    let bestRetailer = "";

    for (const retailer of allRetailers) {
      let typeMultiplier: number;
      if (retailers.discount.includes(retailer)) typeMultiplier = priceData.discountMultiplier;
      else if (retailers.premium.includes(retailer)) typeMultiplier = priceData.premiumMultiplier;
      else typeMultiplier = priceData.midRangeMultiplier;

      const unitPrice = priceData.basePrice * typeMultiplier * countryMult;
      const quantityMultiplier = convertQuantityToUnits(ingredient.quantity, ingredient.unit, priceData.unit);
      const price = unitPrice * quantityMultiplier;

      if (price < bestPrice) {
        bestPrice = price;
        bestRetailer = retailer;
      }
    }

    const roundedPrice = Math.round(bestPrice * 100) / 100;
    items.push({
      ingredientName: ingredient.name,
      bestRetailer,
      bestPrice: roundedPrice,
      originalPrice: roundedPrice,
    });

    if (!byRetailer[bestRetailer]) {
      byRetailer[bestRetailer] = { items: [], total: 0 };
    }
    byRetailer[bestRetailer].items.push(ingredient.name);
    byRetailer[bestRetailer].total += roundedPrice;
  }

  const totalSmartMix = items.reduce((sum, i) => sum + i.bestPrice, 0);

  const comparisons = compareShoppingListPrices(ingredients, countryCode);
  const totalBestSingle = comparisons.length > 0 ? comparisons[0].totalPrice : totalSmartMix;
  const savings = totalBestSingle - totalSmartMix;

  for (const key of Object.keys(byRetailer)) {
    byRetailer[key].total = Math.round(byRetailer[key].total * 100) / 100;
  }

  return {
    items,
    totalSmartMix: Math.round(totalSmartMix * 100) / 100,
    totalBestSingle: Math.round(totalBestSingle * 100) / 100,
    savings: Math.round(savings * 100) / 100,
    byRetailer,
  };
}

const SHARED_CATEGORIES: Set<IngredientPrice["category"]> = new Set(["pantry", "grains", "dairy"]);

export function isSharedItem(ingredientName: string): boolean {
  const priceData = findIngredientPrice(ingredientName);
  return SHARED_CATEGORIES.has(priceData.category);
}

export function calculateSplitCosts(
  ingredients: { name: string; quantity: number; unit: string; isShared: boolean }[],
  countryCode: string,
  peopleCount: number,
) {
  const countryMult = getCountryMultiplier(countryCode);
  let sharedTotal = 0;
  let personalTotal = 0;
  const sharedItems: { name: string; price: number }[] = [];
  const personalItems: { name: string; price: number }[] = [];

  for (const ingredient of ingredients) {
    const priceData = findIngredientPrice(ingredient.name);
    const unitPrice = priceData.basePrice * priceData.midRangeMultiplier * countryMult;
    const quantityMultiplier = convertQuantityToUnits(ingredient.quantity, ingredient.unit, priceData.unit);
    const price = Math.round(unitPrice * quantityMultiplier * 100) / 100;

    if (ingredient.isShared) {
      sharedTotal += price;
      sharedItems.push({ name: ingredient.name, price });
    } else {
      personalTotal += price;
      personalItems.push({ name: ingredient.name, price });
    }
  }

  const sharedPerPerson = peopleCount > 0 ? Math.round((sharedTotal / peopleCount) * 100) / 100 : 0;
  const yourTotal = Math.round((sharedPerPerson + personalTotal) * 100) / 100;

  return {
    sharedItems,
    personalItems,
    sharedTotal: Math.round(sharedTotal * 100) / 100,
    personalTotal: Math.round(personalTotal * 100) / 100,
    sharedPerPerson,
    yourTotal,
    peopleCount,
  };
}
