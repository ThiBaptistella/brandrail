import "server-only";
import { isSupabaseConfigured, SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

export type OAuthProvider = "github" | "google";
const ALL: OAuthProvider[] = ["github", "google"];

/**
 * Which social sign-ins are switched on in Supabase (Auth → Sign In / Providers).
 * Read from GoTrue's public settings endpoint and cached for 5 minutes, so a
 * provider shows up on the login page shortly after it's enabled.
 */
export async function enabledOAuthProviders(): Promise<OAuthProvider[]> {
  if (!isSupabaseConfigured) return ALL; // demo mode fakes both
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: SUPABASE_ANON_KEY },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return [];
    const body = (await res.json()) as { external?: Record<string, boolean> };
    return ALL.filter((p) => body.external?.[p]);
  } catch {
    return [];
  }
}
