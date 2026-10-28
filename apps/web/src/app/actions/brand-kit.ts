"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/env";
import { nextVersion, toDtcg, validateKit, type BrandKitState } from "@/lib/brand-kit";
import { fetchFigmaTokens, type FigmaFetchResult } from "@/lib/figma";
import { requireOrg } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PublishResult = { ok: true; version: string; demo?: boolean } | { ok: false; error: string };
export type KitSource = "manual" | "figma" | "import";

export async function publishBrandKitAction(state: BrandKitState, opts: { notes?: string; source?: KitSource } = {}): Promise<PublishResult> {
  const { user, org } = await requireOrg();

  const invalid = validateKit(state);
  if (invalid) return { ok: false, error: invalid };
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
  const source: KitSource = opts.source && ["manual", "figma", "import"].includes(opts.source) ? opts.source : "manual";
  const { error } = await supabase.from("token_set_versions").insert({
    org_id: org.id,
    version,
    status: "published",
    tokens: toDtcg(state),
    source,
    notes: opts.notes?.slice(0, 500) ?? null,
    published_at: new Date().toISOString(),
    created_by: user.id,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/brand-kit");
  revalidatePath("/dashboard");
  return { ok: true, version };
}

/**
 * Reads variables (or, without Variables API access, colour and text styles) from a Figma file.
 * The personal access token is used for this request only and never stored.
 */
export async function importFromFigmaAction(input: { token: string; url: string }): Promise<FigmaFetchResult> {
  const { org } = await requireOrg();
  if (org.role !== "owner" && org.role !== "admin") return { ok: false, error: "Only owners and admins can import into the Brand Kit." };
  return fetchFigmaTokens(input.token, input.url);
}
