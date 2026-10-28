import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Handles email confirmation, password reset and OAuth redirects from Supabase. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/dashboard";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";

  // Provider-side failures (user cancelled, provider misconfigured) come back as ?error_description=
  const providerError = searchParams.get("error_description");
  if (providerError) return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(providerError.slice(0, 200))}`);

  if (isSupabaseConfigured && code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // First sign-in with GitHub/Google: no organisation yet, so go through onboarding.
      const { count } = await supabase.from("memberships").select("org_id", { count: "exact", head: true });
      return NextResponse.redirect(`${origin}${count === 0 && !next.startsWith("/onboarding") ? "/onboarding" : next}`);
    }
  }
  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("That link is invalid or has expired.")}`);
}
