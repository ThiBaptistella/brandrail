"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_SESSION_COOKIE, ORG_COOKIE, SITE_URL, isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type FormState = { error?: string; message?: string; fields?: Record<string, string> };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const cookieOpts = { httpOnly: true, sameSite: "lax" as const, path: "/", secure: process.env.NODE_ENV === "production" };

function safeNext(raw: FormDataEntryValue | null, fallback = "/dashboard") {
  const v = typeof raw === "string" ? raw : "";
  return v.startsWith("/") && !v.startsWith("//") ? v : fallback;
}

async function origin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  return host ? `${proto}://${host}` : SITE_URL;
}

async function startDemoSession(email: string, name?: string) {
  const store = await cookies();
  const user = { id: `demo-${Buffer.from(email).toString("hex").slice(0, 12)}`, email, name: name || email.split("@")[0] };
  store.set(DEMO_SESSION_COOKIE, JSON.stringify(user), { ...cookieOpts, maxAge: 60 * 60 * 24 * 7 });
}

export async function signInAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address.", fields: { email } };
  if (!password) return { error: "Enter your password.", fields: { email } };

  if (!isSupabaseConfigured) {
    await startDemoSession(email);
    redirect(next);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Incorrect email or password.", fields: { email } };
  redirect(next);
}

export async function signUpAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const fields = { name, email };

  if (name.length < 2) return { error: "Tell us your name.", fields };
  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address.", fields };
  if (password.length < 10) return { error: "Password must be at least 10 characters.", fields };

  if (!isSupabaseConfigured) {
    await startDemoSession(email, name);
    redirect("/onboarding");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
      emailRedirectTo: `${await origin()}/auth/callback?next=/onboarding`,
    },
  });
  if (error) return { error: error.message, fields };
  if (!data.session) {
    return { message: `We sent a confirmation link to ${email}. Open it to finish creating your account.`, fields };
  }
  redirect("/onboarding");
}

export async function oauthAction(formData: FormData): Promise<void> {
  const raw = String(formData.get("provider") ?? "");
  if (raw !== "github" && raw !== "google") redirect("/login");
  const provider = raw;
  const next = safeNext(formData.get("next"));

  if (!isSupabaseConfigured) {
    await startDemoSession(`demo@${provider}.dev`, "Demo User");
    redirect(next);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${await origin()}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) redirect(`/login?error=${encodeURIComponent(error?.message ?? "OAuth failed")}`);
  redirect(data.url);
}

export async function forgotPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address.", fields: { email } };

  if (isSupabaseConfigured) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${await origin()}/auth/callback?next=/dashboard/settings%23password`,
    });
  }
  // Same message whether or not the account exists, so emails can't be enumerated.
  return { message: "If an account exists for that email, a reset link is on its way.", fields: { email } };
}

export async function updatePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 10) return { error: "Password must be at least 10 characters." };
  if (!isSupabaseConfigured) return { message: "Password updated (demo mode — nothing was stored)." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  return { message: "Password updated." };
}

export async function signOutAction(): Promise<void> {
  if (isSupabaseConfigured) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  const store = await cookies();
  store.delete(DEMO_SESSION_COOKIE);
  store.delete(ORG_COOKIE);
  redirect("/");
}
