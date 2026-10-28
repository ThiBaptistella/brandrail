"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ORG_COOKIE, isSupabaseConfigured } from "@/lib/env";
import { getUser } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { FormState } from "./auth";

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,37}[a-z0-9])?$/;

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
    (await cookies()).set(
      ORG_COOKIE,
      JSON.stringify({ id: `demo-org-${slug}`, name, slug, role: "owner" }),
      { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 },
    );
    redirect("/dashboard");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("create_organization", { org_name: name, org_slug: slug });
  if (error) {
    if (error.code === "23505") return { error: `brandrail.dev/${slug} is taken. Try another.`, fields };
    return { error: error.message, fields };
  }
  redirect("/dashboard");
}
