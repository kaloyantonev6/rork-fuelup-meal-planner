/**
 * Supabase Auth over the REST API (/auth/v1).
 *
 * `@supabase/supabase-js` is not available in this Expo Go setup, so these
 * helpers call the auth endpoints directly with `fetch`. They return a
 * normalized session (with `expires_at` in unix seconds) that the
 * AuthProvider persists and feeds to the PostgREST client.
 */

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

export type SupabaseUser = {
  id: string;
  email?: string;
  email_confirmed_at?: string | null;
  user_metadata?: Record<string, unknown>;
};

export type SupabaseSession = {
  access_token: string;
  refresh_token: string;
  /** Unix timestamp (seconds) when the access token expires. */
  expires_at: number;
  token_type?: string;
  user?: SupabaseUser;
};

/** Sanitized, user-friendly auth error; never exposes keys or internals. */
export class SupabaseAuthError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "SupabaseAuthError";
    this.status = status;
  }
}

/** Map raw Supabase auth errors to copy that is safe and useful to show. */
function toFriendlyError(status: number, rawMessage: string): string {
  const message = rawMessage.toLowerCase();
  if (status === 400 && message.includes("invalid login credentials")) {
    return "Incorrect email or password.";
  }
  if (message.includes("email not confirmed")) {
    return "Please confirm your email first — check your inbox for the confirmation link.";
  }
  if (message.includes("user already registered") || message.includes("already been registered")) {
    return "An account with this email already exists. Try signing in instead.";
  }
  if (message.includes("password should be")) {
    return "Password is too weak — use at least 6 characters.";
  }
  if (status === 422) {
    return "Please enter a valid email address and password.";
  }
  if (status === 429) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  if (status === 401) {
    return "Your session expired. Please sign in again.";
  }
  return rawMessage || "Something went wrong. Please try again.";
}

async function authRequest<T>(
  path: string,
  body: Record<string, unknown>,
  accessToken?: string
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${SUPABASE_URL}${path}`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${accessToken ?? SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error("[supabase-auth] Network error:", err);
    throw new SupabaseAuthError("Could not reach the sign-in service. Check your connection.", 0);
  }

  const text = await response.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      // Non-JSON body — fall through to status handling.
    }
  }

  if (!response.ok) {
    const rawMessage =
      parsed && typeof parsed === "object" && "msg" in parsed
        ? String((parsed as { msg: unknown }).msg)
        : parsed && typeof parsed === "object" && "message" in parsed
          ? String((parsed as { message: unknown }).message)
          : response.statusText;
    console.error(`[supabase-auth] ${path} failed (${response.status}): ${rawMessage}`);
    throw new SupabaseAuthError(toFriendlyError(response.status, rawMessage), response.status);
  }

  return parsed as T;
}

/** Fill `expires_at` from `expires_in` when the API omits it. */
function normalizeSession(
  raw: { access_token: string; refresh_token: string; expires_at?: number; expires_in?: number; token_type?: string; user?: SupabaseUser }
): SupabaseSession {
  return {
    access_token: raw.access_token,
    refresh_token: raw.refresh_token,
    expires_at: raw.expires_at ?? Math.floor(Date.now() / 1000) + (raw.expires_in ?? 3600),
    token_type: raw.token_type,
    user: raw.user,
  };
}

/** Sign in with email and password; returns a fresh session. */
export async function signInWithPassword(email: string, password: string): Promise<SupabaseSession> {
  const raw = await authRequest<{
    access_token: string;
    refresh_token: string;
    expires_at?: number;
    expires_in?: number;
    token_type?: string;
    user?: SupabaseUser;
  }>("/auth/v1/token?grant_type=password", { email: email.toLowerCase().trim(), password });
  return normalizeSession(raw);
}

/**
 * Create an account. Returns the new user plus a session when email
 * confirmation is disabled; with confirmation enabled the session is null and
 * the user must click the emailed link before signing in.
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  name: string
): Promise<{ user: SupabaseUser; session: SupabaseSession | null }> {
  const raw = await authRequest<{
    id: string;
    email?: string;
    email_confirmed_at?: string | null;
    user_metadata?: Record<string, unknown>;
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
    expires_in?: number;
  }>("/auth/v1/signup", {
    email: email.toLowerCase().trim(),
    password,
    data: { display_name: name.trim(), full_name: name.trim() },
  });

  const user: SupabaseUser = {
    id: raw.id,
    email: raw.email,
    email_confirmed_at: raw.email_confirmed_at ?? null,
    user_metadata: raw.user_metadata,
  };

  if (!raw.access_token || !raw.refresh_token) {
    return { user, session: null };
  }

  const session = normalizeSession({
    access_token: raw.access_token,
    refresh_token: raw.refresh_token,
    expires_at: raw.expires_at,
    expires_in: raw.expires_in,
    user,
  });
  return { user, session };
}

/** Exchange a refresh token for a new session. */
export async function refreshSession(refreshToken: string): Promise<SupabaseSession> {
  const raw = await authRequest<{
    access_token: string;
    refresh_token: string;
    expires_at?: number;
    expires_in?: number;
    token_type?: string;
    user?: SupabaseUser;
  }>("/auth/v1/token?grant_type=refresh_token", { refresh_token: refreshToken });
  return normalizeSession(raw);
}

/** Revoke a session server-side (best effort — local state clears regardless). */
export async function revokeSession(accessToken: string): Promise<void> {
  await authRequest<unknown>("/auth/v1/logout", {}, accessToken);
}
