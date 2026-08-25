import { GeneratedPlan } from "@/utils/mealGenerator";

export interface SmartShoppingItem {
  id: string;
  name: string;
  quantity: string;
  category: ShoppingCategory;
  checked: boolean;
  prices: RetailerPrice[];
  bestPrice: number;
  bestRetailer: string;
}

export interface RetailerPrice {
  retailer: string;
  price: number;
}

export type ShoppingCategory =
  | "Proteins"
  | "Vegetables"
  | "Fruits"
  | "Dairy"
  | "Grains & Carbs"
  | "Pantry & Spices"
  | "Other";

export interface CategoryConfig {
  key: ShoppingCategory;
  emoji: string;
  color: string;
}

export const CATEGORY_CONFIGS: CategoryConfig[] = [
  { key: "Proteins", emoji: "🥩", color: "#ef4444" },
  { key: "Vegetables", emoji: "🥬", color: "#22c55e" },
  { key: "Fruits", emoji: "🍎", color: "#f97316" },
  { key: "Dairy", emoji: "🧀", color: "#3b82f6" },
  { key: "Grains & Carbs", emoji: "🌾", color: "#f59e0b" },
  { key: "Pantry & Spices", emoji: "🫙", color: "#8b5cf6" },
  { key: "Other", emoji: "🥫", color: "#6b7280" },
];

const CATEGORY_KEYWORDS: Record<ShoppingCategory, string[]> = {
  Proteins: [
    "chicken", "beef", "salmon", "turkey", "tuna", "egg", "eggs", "steak", "fish",
    "pork", "lamb", "cod", "tofu", "tempeh", "sardine", "shrimp", "prawns",
    "mince", "sausage",
  ],
  Vegetables: [
    "broccoli", "spinach", "kale", "pepper", "onion", "garlic", "tomato",
    "cucumber", "zucchini", "asparagus", "celery", "carrot", "lettuce",
    "cauliflower", "mushroom", "cabbage", "aubergine", "courgette",
  ],
  Fruits: [
    "apple", "banana", "berries", "blueberry", "strawberry", "lemon",
    "orange", "mango", "avocado", "fig", "peach", "pear", "grape",
  ],
  Dairy: [
    "milk", "yogurt", "cheese", "butter", "cream", "feta", "halloumi",
    "skyr", "cottage", "parmesan", "mozzarella", "cheddar",
  ],
  "Grains & Carbs": [
    "rice", "pasta", "bread", "oats", "quinoa", "potato", "tortilla",
    "wrap", "noodle", "flour", "couscous", "sweet potato",
  ],
  "Pantry & Spices": [
    "oil", "olive oil", "salt", "pepper", "soy sauce", "honey", "vinegar",
    "cumin", "paprika", "turmeric", "cinnamon", "chili", "mustard", "stock",
    "broth",
  ],
  Other: [],
};

export const RETAILERS_BY_COUNTRY: Record<string, string[]> = {
  Austria: ["SPAR", "Billa", "Hofer (Aldi)", "Merkur", "Penny", "Lidl", "Interspar", "Unimarkt", "MPreis", "Nah & Frisch"],
  Belgium: ["Colruyt", "Carrefour", "Delhaize", "Lidl", "Aldi", "Albert Heijn", "Spar", "Okay", "Cora", "Match"],
  Bulgaria: ["Kaufland", "Lidl", "Billa", "Fantastico", "CBA", "Piccadilly", "T-Market", "Super Vero", "Maxima", "Penny"],
  Croatia: ["Konzum", "Lidl", "Kaufland", "Spar", "Tommy", "Plodine", "Studenac", "Interspar", "NTL", "Bipa"],
  Cyprus: ["Alphamega", "Lidl", "Carrefour", "Papantoniou", "Metro", "Orphanides", "Family Market", "Sklavenitis", "Atlantic Supermarkets", "Ermes"],
  "Czech Republic": ["Albert", "Lidl", "Kaufland", "Penny Market", "Tesco", "Billa", "Coop", "Globus", "Norma", "Makro"],
  Denmark: ["Netto", "Bilka", "Føtex", "Rema 1000", "Lidl", "Aldi", "SuperBrugsen", "Meny", "Fakta", "Spar"],
  Estonia: ["Rimi", "Maxima", "Lidl", "Selver", "Prisma", "Coop", "Konsum", "Toidumaailm", "Grossi", "Kauplus"],
  Finland: ["S-Market", "K-Market", "Lidl", "Alepa", "K-Citymarket", "Prisma", "Sale", "Valintatalo", "K-Supermarket", "Minimani"],
  France: ["Carrefour", "Leclerc", "Intermarché", "Lidl", "Aldi", "Casino", "Super U", "Monoprix", "Auchan", "Picard"],
  Germany: ["Edeka", "Rewe", "Lidl", "Aldi Nord", "Aldi Süd", "Penny", "Kaufland", "Netto", "Real", "Tegut"],
  Greece: ["Sklavenitis", "AB Vassilopoulos", "Lidl", "Masoutis", "My Market", "Bazaar", "Kritikos", "Carrefour", "Metro", "Arvanitis"],
  Hungary: ["Tesco", "Lidl", "Aldi", "Spar", "CBA", "Penny Market", "Coop", "Auchan", "Rossmann", "Kaisers"],
  Ireland: ["Tesco", "Dunnes Stores", "SuperValu", "Lidl", "Aldi", "Centra", "Spar", "Marks & Spencer Food", "Iceland", "Fresh"],
  Italy: ["Conad", "Coop Italia", "Esselunga", "Eurospin", "Lidl", "Aldi", "Carrefour", "PAM", "Sigma", "Tigros"],
  Latvia: ["Rimi", "Maxima", "Lidl", "Elvi", "Citro", "Top!", "Narvesen", "Aibe", "Drogas", "Iki"],
  Lithuania: ["Maxima", "Rimi", "Lidl", "Iki", "Norfa", "Coop", "Prisma", "Akropolis", "Senukai", "Barbora"],
  Luxembourg: ["Cactus", "Lidl", "Aldi", "Delhaize", "Naturata", "Match", "Spar", "Carrefour", "Monoprix", "Auchan"],
  Malta: ["PAVI", "Lidl", "Frank Salt", "Welbees", "Scotts Superstore", "Arkadia", "The General", "Greens", "Tower Supermarket", "Primula"],
  Netherlands: ["Albert Heijn", "Jumbo", "Lidl", "Aldi", "Plus", "Dirk", "Coop", "Jan Linders", "Vomar", "Spar"],
  Poland: ["Biedronka", "Lidl", "Auchan", "Carrefour", "Kaufland", "Netto", "Makro", "Dino", "Żabka", "Stokrotka"],
  Portugal: ["Continente", "Pingo Doce", "Lidl", "Aldi", "Jumbo", "Mini Preço", "Intermarché", "E.Leclerc", "Froiz", "Mercadona"],
  Romania: ["Kaufland", "Lidl", "Carrefour", "Auchan", "Mega Image", "Penny Market", "Profi", "Cora", "La Doi Pași", "Selgros"],
  Slovakia: ["Lidl", "Kaufland", "Billa", "Tesco", "Albert", "Coop Jednota", "Norma", "Fresh", "CBA", "Penny Market"],
  Slovenia: ["Mercator", "Lidl", "Spar", "Hofer (Aldi)", "Tuš", "E.Leclerc", "Interspar", "Engrotuš", "M Tehnika", "Konzum"],
  Spain: ["Mercadona", "Lidl", "Carrefour", "Dia", "Aldi", "Eroski", "El Corte Inglés", "Alcampo", "Consum", "BonPreu"],
  Sweden: ["ICA", "Coop", "Willys", "Lidl", "Hemköp", "City Gross", "Netto", "Axfood", "Maxi ICA", "Mathem"],
};

const DISCOUNT_RETAILERS = new Set([
  "Lidl", "Aldi", "Aldi Nord", "Aldi Süd", "Penny", "Penny Market",
  "Hofer (Aldi)", "Biedronka", "Eurospin", "Netto", "Dia", "Norfa",
  "Maxima", "Kaufland", "Norma", "Okay", "Fakta", "Sale", "Mini Preço",
  "Profi", "La Doi Pași", "Dino", "Stokrotka", "Willys", "Rema 1000",
  "T-Market", "CBA", "Piccadilly", "Studenac", "NTL",
]);

const PREMIUM_RETAILERS = new Set([
  "Edeka", "Monoprix", "Marks & Spencer Food", "El Corte Inglés",
  "Esselunga", "Cactus", "Meny", "Naturata", "Tegut", "Picard",
  "Albert Heijn", "SuperBrugsen", "K-Citymarket", "Prisma",
  "BonPreu", "Mathem", "Maxi ICA", "City Gross", "Bilka",
  "Cora", "Alphamega", "Globus", "Makro", "Selgros",
]);

const COUNTRY_PRICE_MULTIPLIER: Record<string, number> = {
  Bulgaria: 0.6,
  Romania: 0.6,
  Poland: 0.6,
  Hungary: 0.6,
  Lithuania: 0.6,
  Latvia: 0.6,
  Estonia: 0.6,
  Croatia: 0.6,
  "Czech Republic": 0.6,
  Slovakia: 0.6,
  Germany: 1.0,
  France: 1.0,
  Spain: 1.0,
  Italy: 1.0,
  Portugal: 1.0,
  Belgium: 1.0,
  Netherlands: 1.0,
  Austria: 1.0,
  Slovenia: 1.0,
  Greece: 1.0,
  Cyprus: 1.0,
  Malta: 1.0,
  Denmark: 1.4,
  Finland: 1.4,
  Sweden: 1.4,
  Ireland: 1.4,
  Luxembourg: 1.4,
};

const BASE_PRICES: Record<string, number> = {
  "chicken breast": 8, chicken: 8, "ground beef": 10, beef: 10,
  "salmon fillet": 16, salmon: 16, turkey: 9, tuna: 7,
  egg: 0.3, eggs: 3, steak: 14, fish: 10, pork: 8, lamb: 14,
  cod: 12, tofu: 3.5, tempeh: 4, sardine: 4, shrimp: 12,
  prawns: 13, mince: 10, sausage: 5,
  rice: 2, pasta: 1.5, bread: 2, oats: 2, quinoa: 6,
  potato: 1.25, tortilla: 2, wrap: 2, noodle: 1.8, flour: 1,
  couscous: 2.5, "sweet potato": 2.5,
  broccoli: 3.6, spinach: 4, kale: 4, pepper: 3, onion: 1.5,
  garlic: 6, tomato: 3, cucumber: 1.5, zucchini: 3,
  asparagus: 6, celery: 2, carrot: 1.5, lettuce: 1.5,
  cauliflower: 3, mushroom: 5, cabbage: 1.5, aubergine: 3, courgette: 3,
  apple: 2.5, banana: 1.5, berries: 6, blueberry: 8,
  strawberry: 6, lemon: 3, orange: 2, mango: 3,
  avocado: 1.5, fig: 8, peach: 3.5, pear: 2.5, grape: 4,
  milk: 1.2, yogurt: 2, cheese: 12.5, butter: 8, cream: 4,
  feta: 10, halloumi: 14, skyr: 3.5, cottage: 3,
  parmesan: 20, mozzarella: 8, cheddar: 10,
  oil: 4, "olive oil": 6, salt: 0.8, "soy sauce": 3,
  honey: 8, vinegar: 2.5, cumin: 5, paprika: 4,
  turmeric: 6, cinnamon: 5, chili: 3, mustard: 2.5,
  stock: 2, broth: 2.5,
};

const COUNTRY_FLAGS: Record<string, string> = {
  Austria: "🇦🇹", Belgium: "🇧🇪", Bulgaria: "🇧🇬", Croatia: "🇭🇷",
  Cyprus: "🇨🇾", "Czech Republic": "🇨🇿", Denmark: "🇩🇰", Estonia: "🇪🇪",
  Finland: "🇫🇮", France: "🇫🇷", Germany: "🇩🇪", Greece: "🇬🇷",
  Hungary: "🇭🇺", Ireland: "🇮🇪", Italy: "🇮🇹", Latvia: "🇱🇻",
  Lithuania: "🇱🇹", Luxembourg: "🇱🇺", Malta: "🇲🇹", Netherlands: "🇳🇱",
  Poland: "🇵🇱", Portugal: "🇵🇹", Romania: "🇷🇴", Slovakia: "🇸🇰",
  Slovenia: "🇸🇮", Spain: "🇪🇸", Sweden: "🇸🇪",
};

export function getCountryFlag(country: string): string {
  return COUNTRY_FLAGS[country] ?? "🌍";
}

export function getRetailersForCountry(country: string): string[] {
  return RETAILERS_BY_COUNTRY[country] ?? RETAILERS_BY_COUNTRY["Germany"] ?? [];
}

function categorizeIngredient(ingredient: string): ShoppingCategory {
  const lower = ingredient.toLowerCase();
  const categories: ShoppingCategory[] = [
    "Proteins", "Vegetables", "Fruits", "Dairy", "Grains & Carbs", "Pantry & Spices",
  ];
  for (const cat of categories) {
    const keywords = CATEGORY_KEYWORDS[cat];
    if (keywords.some((k) => lower.includes(k))) {
      return cat;
    }
  }
  return "Other";
}

function getBasePrice(ingredient: string): number {
  const lower = ingredient.toLowerCase();
  for (const [key, price] of Object.entries(BASE_PRICES)) {
    if (lower.includes(key)) return price;
  }
  return 1.5;
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function getRetailerTier(retailer: string): number {
  if (DISCOUNT_RETAILERS.has(retailer)) return 0.85;
  if (PREMIUM_RETAILERS.has(retailer)) return 1.15;
  return 1.0;
}

function generateRetailerPrices(
  basePrice: number,
  retailers: string[],
  countryMultiplier: number,
  itemSeed: number,
): RetailerPrice[] {
  return retailers.map((retailer, idx) => {
    const tierMultiplier = getRetailerTier(retailer);
    const variance = 0.95 + seededRandom(itemSeed * 31 + idx * 17) * 0.1;
    const price = basePrice * countryMultiplier * tierMultiplier * variance;
    return {
      retailer,
      price: Math.round(price * 100) / 100,
    };
  });
}

export function compileSmartShoppingList(
  plans: GeneratedPlan[],
  country: string,
): SmartShoppingItem[] {
  console.log("[SmartShopping] Compiling for country:", country);

  const ingredientMap = new Map<string, { quantity: string; count: number }>();

  for (const plan of plans) {
    for (const meal of plan.meals) {
      for (const iq of meal.ingredientQuantities) {
        const existing = ingredientMap.get(iq);
        if (existing) {
          existing.count += 1;
        } else {
          ingredientMap.set(iq, { quantity: iq, count: 1 });
        }
      }
    }
  }

  const retailers = getRetailersForCountry(country);
  const countryMult = COUNTRY_PRICE_MULTIPLIER[country] ?? 1.0;

  const items: SmartShoppingItem[] = [];
  let idx = 0;

  for (const [key, val] of ingredientMap) {
    const category = categorizeIngredient(key);
    const basePrice = getBasePrice(key);
    const unitPrice = basePrice * 0.3;
    const totalBase = unitPrice * val.count;
    const prices = generateRetailerPrices(totalBase, retailers, countryMult, idx);
    const sorted = [...prices].sort((a, b) => a.price - b.price);
    const best = sorted[0];

    items.push({
      id: `si_${idx++}`,
      name: val.quantity,
      quantity: val.count > 1 ? `×${val.count}` : "",
      category,
      checked: false,
      prices,
      bestPrice: best?.price ?? 0,
      bestRetailer: best?.retailer ?? "",
    });
  }

  console.log("[SmartShopping] Compiled", items.length, "items across", retailers.length, "retailers");
  return items;
}

export interface RetailerTotal {
  retailer: string;
  total: number;
}

export function calculateRetailerTotals(
  items: SmartShoppingItem[],
  retailers: string[],
): RetailerTotal[] {
  const totals = retailers.map((retailer) => {
    const total = items.reduce((sum, item) => {
      const rp = item.prices.find((p) => p.retailer === retailer);
      return sum + (rp?.price ?? item.bestPrice);
    }, 0);
    return { retailer, total: Math.round(total * 100) / 100 };
  });
  return totals.sort((a, b) => a.total - b.total);
}

export function getCheckedTotal(items: SmartShoppingItem[]): number {
  return items
    .filter((i) => i.checked)
    .reduce((sum, i) => sum + i.bestPrice, 0);
}
