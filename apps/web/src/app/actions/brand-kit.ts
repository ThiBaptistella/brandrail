"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/env";
import { nextVersion, toDtcg, type BrandKitState } from "@/lib/brand-kit";
import { requireOrg } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PublishResult = { ok: true; version: string; demo?: boolean } | { ok: false; error: string };

const HEX = /^#[0-9a-f]{6}$/i;

export async function publishBrandKitAction(state: BrandKitState, notes?: string): Promise<PublishResult> {
  const { user, org } = await requireOrg();

  if (!Array.isArray(state.colors) || state.colors.some((c) => !HEX.test(c.value))) {
    return { ok: false, error: "Every colour must be a 6-digit hex value like #1f883d." };
  }
  if (org.role !== "owner" && org.role !== "admin") {
    return { ok: false, error: "Only owners and admins can publish the Brand Kit." };
  }

  if (!isSupabaseConfigured) return { ok: true, version: "1.0.0", demo: true };

  const supabase = await createSupabaseServerClient();
  const { data: latest } = await supabase
    .from("token_set_versions")
    .select("version")
    .eq("org_id", org.id)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const version = nextVersion(latest?.version ?? null);
  const { error } = await supabase.from("token_set_versions").insert({
    org_id: org.id,
    version,
    status: "published",
    tokens: toDtcg(state),
    source: "manual",
    notes: notes ?? null,
    published_at: new Date().toISOString(),
    created_by: user.id,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/brand-kit");
  return { ok: true, version };
}
