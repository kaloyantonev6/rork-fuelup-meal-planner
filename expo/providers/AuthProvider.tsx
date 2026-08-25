/**
 * AuthProvider — Supabase email/password sessions.
 *
 * Persists the session in AsyncStorage, restores it on launch (refreshing the
 * access token when it is near expiry), and keeps the PostgREST client's
 * bearer token in sync so RLS policies using auth.uid() apply to every query.
 */

import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { supabase } from "@/lib/supabase";
import {
  SupabaseSession,
  SupabaseUser,
  refreshSession,
  revokeSession,
  signInWithPassword,
  signUpWithEmail,
} from "@/lib/supabaseAuth";

const SESSION_KEY = "nutriplan_supabase_session";
const LAST_EMAIL_KEY = "nutriplan_last_email";

/** Refresh the token when less than 60s of validity remains. */
const REFRESH_MARGIN_MS = 60_000;

export type AuthResult = {
  success: boolean;
  /** Signup succeeded but requires clicking the emailed confirmation link. */
  requiresConfirmation?: boolean;
  error?: string;
};

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastEmail, setLastEmail] = useState<string>("");

  /** Single source of truth for the token used by RLS-scoped queries. */
  const applySession = useCallback((next: SupabaseSession | null) => {
    setSession(next);
    supabase.setAccessToken(next?.access_token ?? null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      try {
        const [raw, storedEmail] = await Promise.all([
          AsyncStorage.getItem(SESSION_KEY),
          AsyncStorage.getItem(LAST_EMAIL_KEY),
        ]);
        if (cancelled) return;
        if (storedEmail) setLastEmail(storedEmail);
        if (!raw) return;

        const stored = JSON.parse(raw) as SupabaseSession;
        let active: SupabaseSession | null = stored;
        const expiresAtMs = stored.expires_at * 1000;
        if (stored.refresh_token && Date.now() > expiresAtMs - REFRESH_MARGIN_MS) {
          active = await refreshSession(stored.refresh_token);
          await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(active));
        }
        if (!cancelled) applySession(active);
      } catch (err) {
        console.error("[auth] Failed to restore session:", err);
        await AsyncStorage.removeItem(SESSION_KEY);
        if (!cancelled) applySession(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void restore();
    return () => {
      cancelled = true;
    };
  }, [applySession]);

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      try {
        const next = await signInWithPassword(email, password);
        const normalizedEmail = next.user?.email ?? email.toLowerCase().trim();
        await AsyncStorage.multiSet([
          [SESSION_KEY, JSON.stringify(next)],
          [LAST_EMAIL_KEY, normalizedEmail],
        ]);
        setLastEmail(normalizedEmail);
        applySession(next);
        return { success: true };
      } catch (err) {
        console.error("[auth] Sign-in failed:", err instanceof Error ? err.message : err);
        return {
          success: false,
          error: err instanceof Error ? err.message : "Sign-in failed. Please try again.",
        };
      }
    },
    [applySession]
  );

  const signUp = useCallback(
    async (email: string, password: string, name: string): Promise<AuthResult> => {
      try {
        const { user, session: next } = await signUpWithEmail(email, password, name);

        if (!next) {
          // Email confirmation is enabled on the Supabase project.
          await AsyncStorage.setItem(LAST_EMAIL_KEY, user.email ?? email.toLowerCase().trim());
          setLastEmail(user.email ?? email.toLowerCase().trim());
          return { success: true, requiresConfirmation: true };
        }

        const normalizedEmail = next.user?.email ?? email.toLowerCase().trim();
        await AsyncStorage.multiSet([
          [SESSION_KEY, JSON.stringify(next)],
          [LAST_EMAIL_KEY, normalizedEmail],
        ]);
        setLastEmail(normalizedEmail);
        applySession(next);
        return { success: true };
      } catch (err) {
        console.error("[auth] Sign-up failed:", err instanceof Error ? err.message : err);
        return {
          success: false,
          error: err instanceof Error ? err.message : "Could not create your account. Please try again.",
        };
      }
    },
    [applySession]
  );

  const signOut = useCallback(async () => {
    const token = session?.access_token ?? null;
    applySession(null);
    await AsyncStorage.removeItem(SESSION_KEY);
    if (!token) return;
    try {
      await revokeSession(token);
    } catch (err) {
      // Best effort — the local session is already cleared.
      console.error("[auth] Session revocation failed:", err instanceof Error ? err.message : err);
    }
  }, [applySession, session]);

  const user: SupabaseUser | null = session?.user ?? null;

  return {
    session,
    user,
    isAuthenticated: session !== null,
    isLoading,
    lastEmail,
    signIn,
    signUp,
    signOut,
  };
});
