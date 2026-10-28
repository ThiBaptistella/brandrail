import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { DEMO_SESSION_COOKIE, ORG_COOKIE, isSupabaseConfigured } from "./env";
import { createSupabaseServerClient } from "./supabase/server";

export type SessionUser = { id: string; email: string; name: string };
export type Organization = { id: string; name: string; slug: string; role: "owner" | "admin" | "member" };

export const getUser = cache(async (): Promise<SessionUser | null> => {
  if (!isSupabaseConfigured) {
    const raw = (await cookies()).get(DEMO_SESSION_COOKIE)?.value;
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SessionUser;
    } catch {
      return null;
    }
  }
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const meta = (user.user_metadata ?? {}) as { full_name?: string; name?: string; user_name?: string };
  return {
    id: user.id,
    email: user.email ?? "",
    name: meta.full_name ?? meta.name ?? meta.user_name ?? user.email?.split("@")[0] ?? "You",
  };
});

export const getOrganizations = cache(async (): Promise<Organization[]> => {
  if (!isSupabaseConfigured) {
    const raw = (await cookies()).get(ORG_COOKIE)?.value;
    if (!raw) return [];
    try {
      return [JSON.parse(raw) as Organization];
    } catch {
      return [];
    }
  }
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("memberships")
    .select("role, organizations(id, name, slug)")
    .order("created_at", { ascending: true });
  return (data ?? []).flatMap((row) => {
    const org = row.organizations as unknown as { id: string; name: string; slug: string } | null;
    return org ? [{ ...org, role: row.role as Organization["role"] }] : [];
  });
});

/** For pages that need a signed-in user with an organisation. */
export async function requireOrg(): Promise<{ user: SessionUser; org: Organization; orgs: Organization[] }> {
  const user = await getUser();
  if (!user) redirect("/login");
  const orgs = await getOrganizations();
  const org = orgs[0];
  if (!org) redirect("/onboarding");
  return { user, org, orgs };
}
