"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/env";
import { KIT_REGISTRY } from "@/lib/kit-registry";
import { requireOrg } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

export interface ComponentInput {
  id?: string;
  name: string;
  importPath: string;
  description?: string;
  status: "draft" | "beta" | "stable" | "deprecated";
  replaces: string[];
  aliases: string[];
  usageRules: string[];
  example?: string;
}

const NAME_RE = /^[A-Z][A-Za-z0-9.]{0,59}$/;
const TAG_RE = /^[a-z][a-z0-9-]*(\[type=[a-z-]+\])?$/;
const STATUSES = new Set(["draft", "beta", "stable", "deprecated"]);

async function editor() {
  const ctx = await requireOrg();
  if (ctx.org.role !== "owner" && ctx.org.role !== "admin") throw new Error("Only owners and admins can edit the component registry.");
  return ctx;
}

const clean = (xs: string[], max = 20) => [...new Set(xs.map((x) => x.trim()).filter(Boolean))].slice(0, max);

export async function saveComponentAction(input: ComponentInput): Promise<ActionResult> {
  let org;
  try {
    ({ org } = await editor());
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  const name = input.name.trim();
  const importPath = input.importPath.trim();
  const replaces = clean(input.replaces.map((t) => t.toLowerCase().replace(/\s+/g, "").replace(/["']/g, "")));
  if (!NAME_RE.test(name)) return { ok: false, error: "Name must be a PascalCase component name, e.g. DatePicker." };
  if (!importPath || importPath.length > 200) return { ok: false, error: "Import path is required, e.g. @acme/ui." };
  const badTag = replaces.find((t) => !TAG_RE.test(t));
  if (badTag) return { ok: false, error: `"${badTag}" isn't a valid tag. Use e.g. button, select or input[type=checkbox].` };
  if (!STATUSES.has(input.status)) return { ok: false, error: "Unknown status." };
  if (!isSupabaseConfigured) return { ok: true, message: `${name} saved (demo mode — not stored).` };

  const row = {
    org_id: org.id,
    name,
    import_path: importPath,
    description: input.description?.trim().slice(0, 500) || null,
    status: input.status,
    replaces,
    aliases: clean(input.aliases),
    usage_rules: clean(input.usageRules, 30).map((r) => r.slice(0, 300)),
    example: input.example?.trim().slice(0, 2000) || null,
    updated_at: new Date().toISOString(),
  };
  const supabase = await createSupabaseServerClient();
  const { error } = input.id
    ? await supabase.from("components").update(row).eq("id", input.id).eq("org_id", org.id)
    : await supabase.from("components").insert(row);
  if (error) {
    if (error.code === "23505") return { ok: false, error: `${name} is already in the registry.` };
    return { ok: false, error: error.message };
  }
  revalidatePath("/dashboard/components");
  return { ok: true, message: `${name} saved.` };
}

export async function deleteComponentAction(id: string): Promise<ActionResult> {
  let org;
  try {
    ({ org } = await editor());
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  if (!isSupabaseConfigured) return { ok: true };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("components").delete().eq("id", id).eq("org_id", org.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/components");
  return { ok: true };
}

/** Adds every UI kit component that isn't in the registry yet. Existing entries are left untouched. */
export async function importKitAction(importPath: string): Promise<ActionResult> {
  let org;
  try {
    ({ org } = await editor());
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  const path = importPath.trim() || "@brandrail/kit";
  if (!isSupabaseConfigured) return { ok: true, message: `Demo mode: the ${KIT_REGISTRY.length} kit components are already shown.` };
  const supabase = await createSupabaseServerClient();
  const rows = KIT_REGISTRY.map((c) => ({
    org_id: org.id,
    name: c.name,
    import_path: path,
    description: c.description ?? null,
    status: c.status ?? "stable",
    replaces: c.replaces ?? [],
    aliases: c.aliases ?? [],
    usage_rules: c.usageRules ?? [],
    example: c.example ?? null,
  }));
  const { data, error } = await supabase.from("components").upsert(rows, { onConflict: "org_id,name", ignoreDuplicates: true }).select("id");
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/components");
  const added = data?.length ?? 0;
  return { ok: true, message: added ? `Added ${added} components from the UI kit.` : "All UI kit components are already in the registry." };
}
