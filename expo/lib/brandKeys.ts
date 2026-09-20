import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * One-time "FuelUp" → "Fuelify" storage migration.
 *
 * Legacy data was written under "fuelup_*" AsyncStorage keys (and mirrored
 * into the Supabase `app_data` table under the same names). All new writes go
 * to "fuelify_*" keys. On first launch after the rebrand this module copies
 * every legacy value forward so no user data is lost:
 * - kvGet() calls this before reading, so a new key with no server row yet
 *   falls back to the migrated local mirror; the next kvSet() pushes the value
 *   up to Supabase under the new key name.
 * - Direct AsyncStorage reads go through brandGetItem() for the same guarantee.
 * - Legacy keys are never deleted, so a rollback or re-migration stays possible.
 */

const LEGACY_KEY_MAP: ReadonlyArray<readonly [legacy: string, fresh: string]> = [
  ["fuelup_education_state", "fuelify_education_state"],
  ["fuelup_last_reset_date", "fuelify_last_reset_date"],
  ["fuelup_hydration", "fuelify_hydration"],
  ["fuelup_tip_index", "fuelify_tip_index"],
  ["fuelup_cycle_tracking", "fuelify_cycle_tracking"],
  ["fuelup_sweat_test", "fuelify_sweat_test"],
  ["fuelup_hydration_log", "fuelify_hydration_log"],
  ["fuelup_sleep_log", "fuelify_sleep_log"],
  ["fuelup_health_check_last_shown", "fuelify_health_check_last_shown"],
  ["fuelup_saved_plans", "fuelify_saved_plans"],
  ["fuelup_favorites", "fuelify_favorites"],
  ["fuelup_folders", "fuelify_folders"],
  ["fuelup_default_kickoff", "fuelify_default_kickoff"],
  ["fuelup_default_training_time", "fuelify_default_training_time"],
];

const LEGACY_SESSIONS_PREFIX = "fuelup_completed_sessions_";
const FRESH_SESSIONS_PREFIX = "fuelify_completed_sessions_";

const MIGRATION_FLAG = "fuelify_storage_migration_v1";

let migrationPromise: Promise<void> | null = null;

async function runMigration(): Promise<void> {
  if ((await AsyncStorage.getItem(MIGRATION_FLAG)) === "1") return;

  for (const [legacyKey, freshKey] of LEGACY_KEY_MAP) {
    if ((await AsyncStorage.getItem(freshKey)) !== null) continue;
    const legacyValue = await AsyncStorage.getItem(legacyKey);
    if (legacyValue !== null) await AsyncStorage.setItem(freshKey, legacyValue);
  }

  // Dynamic per-day session keys: "fuelup_completed_sessions_YYYY-MM-DD"
  const allKeys = await AsyncStorage.getAllKeys();
  for (const legacyKey of allKeys) {
    if (!legacyKey.startsWith(LEGACY_SESSIONS_PREFIX)) continue;
    const freshKey = FRESH_SESSIONS_PREFIX + legacyKey.slice(LEGACY_SESSIONS_PREFIX.length);
    if ((await AsyncStorage.getItem(freshKey)) !== null) continue;
    const legacyValue = await AsyncStorage.getItem(legacyKey);
    if (legacyValue !== null) await AsyncStorage.setItem(freshKey, legacyValue);
  }

  await AsyncStorage.setItem(MIGRATION_FLAG, "1");
}

/**
 * Ensures the one-time legacy-key migration has run (memoized; safe to await
 * before every read). Fails soft — a failed attempt is retried on next call.
 */
export function ensureLegacyKeyMigration(): Promise<void> {
  if (!migrationPromise) {
    migrationPromise = runMigration().catch((e: unknown) => {
      migrationPromise = null; // allow retry on the next read
      console.log("[brandKeys] Legacy key migration failed, will retry:", e);
    });
  }
  return migrationPromise;
}

/** AsyncStorage.getItem that guarantees the legacy-key migration ran first. */
export async function brandGetItem(key: string): Promise<string | null> {
  try {
    await ensureLegacyKeyMigration();
  } catch {
    // best-effort — fall through to a plain read
  }
  return AsyncStorage.getItem(key);
}
