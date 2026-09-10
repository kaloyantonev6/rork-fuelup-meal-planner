import AsyncStorage from "@react-native-async-storage/async-storage";
import { mealImageQueryMap } from "./mealImageQueries";

/**
 * Pexels image search for meal photos. Free tier: 200 req/hour, 20k/month.
 * The key is a public client key (same exposure level as the Supabase anon
 * key) — supply it via EXPO_PUBLIC_PEXELS_API_KEY. Without a key every lookup
 * degrades gracefully to per-category fallback photos.
 */
const PEXELS_API_KEY = process.env.EXPO_PUBLIC_PEXELS_API_KEY ?? "";

interface PexelsPhoto {
  id: number;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  alt: string;
  photographer: string;
}

interface PexelsResponse {
  photos: PexelsPhoto[];
  total_results: number;
}

/** In-memory cache so a title is only fetched once per session. */
const imageCache: Record<string, string> = {};

const IMAGE_KEY_PREFIX = "meal_image_";

/** Hardcoded per-category fallbacks (Pexels free images) for offline/API failure. */
const CATEGORY_FALLBACKS: Record<string, string> = {
  breakfast: "https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg?auto=compress&cs=tinysrgb&w=400",
  lunch: "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400",
  dinner: "https://images.pexels.com/photos/699953/pexels-photo-699953.jpeg?auto=compress&cs=tinysrgb&w=400",
  snack: "https://images.pexels.com/photos/1099680/pexels-photo-1099680.jpeg?auto=compress&cs=tinysrgb&w=400",
};

function getFallbackImage(category: string, fallbackUri?: string): string {
  return fallbackUri ?? CATEGORY_FALLBACKS[category] ?? CATEGORY_FALLBACKS.lunch;
}

/** Strips performance/generic words that pollute image search results. */
function buildSearchQuery(mealTitle: string): string {
  const removeWords = [
    "match day",
    "training",
    "recovery",
    "post-match",
    "pre-match",
    "footballer's",
    "high-protein",
    "anti-inflammatory",
    "carb-load",
    "power",
  ];

  let query = mealTitle.toLowerCase();
  for (const word of removeWords) {
    query = query.replace(word, "");
  }
  query = query.trim();

  return `${query} food`;
}

/**
 * Resolves a meal photo URL for `mealTitle`. Order: memory cache →
 * AsyncStorage → curated query map → title-derived search → category fallback.
 */
export async function getMealImage(mealTitle: string, category: string, fallbackUri?: string): Promise<string> {
  const cacheKey = mealTitle.toLowerCase();
  if (imageCache[cacheKey]) return imageCache[cacheKey];

  try {
    const cachedUrl = await AsyncStorage.getItem(`${IMAGE_KEY_PREFIX}${cacheKey}`);
    if (cachedUrl) {
      imageCache[cacheKey] = cachedUrl;
      return cachedUrl;
    }
  } catch {
    // storage unavailable — fall through to a fresh fetch
  }

  // Without a key we can't search — serve fallbacks so nothing crashes.
  if (!PEXELS_API_KEY) return getFallbackImage(category, fallbackUri);

  const searchQuery = mealImageQueryMap[mealTitle] ?? buildSearchQuery(mealTitle);

  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchQuery)}&per_page=5&orientation=landscape`,
      { headers: { Authorization: PEXELS_API_KEY } },
    );

    if (!response.ok) throw new Error(`Pexels API error (${response.status})`);

    const data = (await response.json()) as PexelsResponse;

    if (!data.photos || data.photos.length === 0) {
      return getFallbackImage(category, fallbackUri);
    }

    // Random pick from the top 5 keeps repeat plans visually varied
    const randomIndex = Math.floor(Math.random() * Math.min(data.photos.length, 5));
    const imageUrl = data.photos[randomIndex].src.medium; // ~350px wide — fast on mobile

    imageCache[cacheKey] = imageUrl;
    try {
      await AsyncStorage.setItem(`${IMAGE_KEY_PREFIX}${cacheKey}`, imageUrl);
    } catch {
      // cache write is best-effort
    }

    return imageUrl;
  } catch {
    return getFallbackImage(category, fallbackUri);
  }
}

/**
 * Pre-fetches images for a whole meal plan so they're cached before the user
 * scrolls. Batches of 3 with a small delay stay well inside the free-tier
 * rate limit. Never throws — failures resolve to fallback URLs.
 */
export async function prefetchMealPlanImages(
  meals: Array<{ title: string; category: string }>,
): Promise<Record<string, string>> {
  const results: Record<string, string> = {};

  for (let i = 0; i < meals.length; i += 3) {
    const batch = meals.slice(i, i + 3);
    await Promise.all(
      batch.map(async (meal) => {
        const url = await getMealImage(meal.title, meal.category);
        results[meal.title] = url;
      }),
    );

    if (i + 3 < meals.length) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  return results;
}
