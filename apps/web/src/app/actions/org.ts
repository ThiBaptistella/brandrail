"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CURRENT_ORG_COOKIE, ORG_COOKIE, isSupabaseConfigured } from "@/lib/env";
import { getOrganizations, getUser, requireOrg, type Role } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { FormState } from "./auth";

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,37}[a-z0-9])?$/;
const COOKIE = { httpOnly: true, sameSite: "lax" as const, path: "/", maxAge: 60 * 60 * 24 * 365, secure: process.env.NODE_ENV === "production" };

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

const DEMO: ActionResult = { ok: false, error: "Demo mode: connect Supabase to manage members." };

async function setCurrentOrg(id: string) {
  (await cookies()).set(CURRENT_ORG_COOKIE, id, COOKIE);
}

function friendly(e: { message: string; code?: string }): string {
  // Our SQL functions raise human-readable messages; Postgres internals don't get shown.
  return e.code && /^(42501|22023|23505|P0002|53400|28000)$/.test(e.code) ? e.message : "Something went wrong. Try again.";
}

export async function createOrganizationAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getUser();
  if (!user) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const fields = { name, slug };

  if (name.length < 2) return { error: "Organisation name must be at least 2 characters.", fields };
  if (!SLUG_RE.test(slug)) {
    return { error: "URL can use lowercase letters, numbers and dashes (max 39 characters).", fields };
  }

  if (!isSupabaseConfigured) {
    (await cookies()).set(ORG_COOKIE, JSON.stringify({ id: `demo-org-${slug}`, name, slug, role: "owner" }), { ...COOKIE, maxAge: 60 * 60 * 24 * 7 });
    redirect("/dashboard");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_organization", { org_name: name, org_slug: slug });
  if (error) {
    if (error.code === "23505") return { error: `The URL “${slug}” is taken. Try another.`, fields };
    return { error: error.message, fields };
  }
  await setCurrentOrg(data as string);
  redirect("/dashboard");
}

export async function switchOrgAction(formData: FormData): Promise<void> {
  const id = String(formData.get("orgId") ?? "");
  const orgs = await getOrganizations();
  if (orgs.some((o) => o.id === id)) await setCurrentOrg(id);
  redirect("/dashboard");
}

export async function updateOrgAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { org } = await requireOrg();
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const fields = { name, slug };
  if (org.role !== "owner" && org.role !== "admin") return { error: "Only owners and admins can change organisation settings.", fields };
  if (name.length < 2 || name.length > 80) return { error: "Name must be 2–80 characters.", fields };
  if (!SLUG_RE.test(slug)) return { error: "URL can use lowercase letters, numbers and dashes (max 39 characters).", fields };
  if (!isSupabaseConfigured) return { error: "Demo mode: nothing is saved.", fields };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("organizations").update({ name, slug }).eq("id", org.id);
  if (error) return { error: error.code === "23505" ? `The URL “${slug}” is taken.` : error.message, fields };
  revalidatePath("/dashboard", "layout");
  return { message: "Saved.", fields };
}

export async function updateProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getUser();
  if (!user) redirect("/login");
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 1 || name.length > 80) return { error: "Name must be 1–80 characters.", fields: { name } };
  if (!isSupabaseConfigured) return { error: "Demo mode: nothing is saved.", fields: { name } };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ data: { full_name: name } });
  if (error) return { error: error.message, fields: { name } };
  revalidatePath("/dashboard", "layout");
  return { message: "Saved.", fields: { name } };
}

export async function inviteMemberAction(email: string, role: Role): Promise<ActionResult> {
  const { org } = await requireOrg();
  if (!isSupabaseConfigured) return DEMO;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("invite_member", { p_org: org.id, p_email: email, p_role: role });
  if (error) return { ok: false, error: friendly(error) };
  revalidatePath("/dashboard/settings");
  return { ok: true, message: `Invited ${email.trim().toLowerCase()}. They'll see it when they sign in with that email.` };
}

export async function revokeInviteAction(id: string): Promise<ActionResult> {
  await requireOrg();
  if (!isSupabaseConfigured) return DEMO;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("invitations").delete().eq("id", id);
  if (error) return { ok: false, error: friendly(error) };
  revalidatePath("/dashboard/settings");
  return { ok: true };
}

export async function setMemberRoleAction(userId: string, role: Role): Promise<ActionResult> {
  const { org } = await requireOrg();
  if (!isSupabaseConfigured) return DEMO;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("set_member_role", { p_org: org.id, p_user: userId, p_role: role });
  if (error) return { ok: false, error: friendly(error) };
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function removeMemberAction(userId: string): Promise<ActionResult> {
  const { org, user } = await requireOrg();
  if (!isSupabaseConfigured) return DEMO;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("remove_member", { p_org: org.id, p_user: userId });
  if (error) return { ok: false, error: friendly(error) };
  if (userId === user.id) {
    (await cookies()).delete(CURRENT_ORG_COOKIE);
    redirect("/dashboard");
  }
  revalidatePath("/dashboard/settings");
  return { ok: true };
}

export async function deleteOrgAction(confirmSlug: string): Promise<ActionResult> {
  const { org } = await requireOrg();
  if (!isSupabaseConfigured) return { ok: false, error: "Demo mode: nothing to delete." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("delete_organization", { p_org: org.id, p_confirm_slug: confirmSlug });
  if (error) return { ok: false, error: friendly(error) };
  (await cookies()).delete(CURRENT_ORG_COOKIE);
  redirect("/dashboard");
}

export async function respondInvitationAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const accept = formData.get("accept") === "1";
  const user = await getUser();
  if (!user) redirect("/login");
  if (!isSupabaseConfigured) redirect("/dashboard");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("respond_invitation", { p_id: id, p_accept: accept });
  if (error) redirect(`/dashboard?error=${encodeURIComponent(friendly(error))}`);
  if (accept && data) await setCurrentOrg(data as string);
  redirect("/dashboard");
}
