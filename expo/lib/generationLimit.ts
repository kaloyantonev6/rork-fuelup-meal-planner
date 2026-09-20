/**
 * Free-tier generation limit.
 *
 * Free users get 3 meal plan generations in total; premium users are
 * unlimited. The counter lives in the per-user kv store (Supabase `app_data`,
 * mirrored to AsyncStorage for offline use) so it persists across sessions,
 * follows the account across devices, and resets on a fresh install —
 * matching the rest of the app's data layer.
 */

import { kvGet, kvRemove, kvSet } from "@/lib/database";

const GENERATION_KEY = "fuelify_generation_count";
export const FREE_TIER_LIMIT = 3;

export interface GenerationStatus {
  allowed: boolean;
  /** Generations left before the premium gate (Infinity for premium). */
  remaining: number;
  /** Total generations already used (0 for premium). */
  total: number;
}

/** Total successful generations the current user has made. */
export async function getGenerationCount(): Promise<number> {
  const count = await kvGet<number>(GENERATION_KEY);
  return typeof count === "number" && Number.isFinite(count) ? count : 0;
}

/**
 * Record one generation. Call ONLY after a successful generation — failed
 * attempts (API/network errors) must never count against the free tier.
 */
export async function incrementGenerationCount(): Promise<number> {
  const newCount = (await getGenerationCount()) + 1;
  await kvSet(GENERATION_KEY, newCount);
  return newCount;
}

/** Whether a meal plan generation may proceed, plus remaining/used counts. */
export async function canGenerate(isPremium: boolean): Promise<GenerationStatus> {
  if (isPremium) return { allowed: true, remaining: Infinity, total: 0 };
  const count = await getGenerationCount();
  return {
    allowed: count < FREE_TIER_LIMIT,
    remaining: Math.max(0, FREE_TIER_LIMIT - count),
    total: count,
  };
}

/**
 * Clear the counter — called when a user upgrades to Premium so that a
 * future downgrade starts fresh with 3 new generations.
 */
export async function resetGenerationCount(): Promise<void> {
  await kvRemove(GENERATION_KEY);
}
