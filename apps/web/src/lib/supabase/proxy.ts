import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { DEMO_SESSION_COOKIE, SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "../env";

/**
 * Refreshes the Supabase session cookie on every request and reports whether a user is signed in.
 * In demo mode the presence of the demo cookie counts as signed in.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!isSupabaseConfigured) {
    return { response, signedIn: Boolean(request.cookies.get(DEMO_SESSION_COOKIE)?.value) };
  }

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
      },
    },
  });

  // Must be called right after creating the client so the session is refreshed.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, signedIn: Boolean(user) };
}
