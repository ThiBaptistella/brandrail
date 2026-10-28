"use server";

import { revalidatePath } from "next/cache";
import { generateApiKey } from "@/lib/api-keys";
import { isSupabaseConfigured } from "@/lib/env";
import { canWrite, requireOrg } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CreateKeyResult = { ok: true; key: string; name: string } | { ok: false; error: string };

export async function createApiKeyAction(name: string): Promise<CreateKeyResult> {
  const { user, org } = await requireOrg();
  const clean = name.trim().slice(0, 60) || "API key";
  const { key, prefix, hash } = generateApiKey();
  if (!isSupabaseConfigured) return { ok: true, key, name: `${clean} (demo — not saved)` };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("api_keys").insert({
    org_id: org.id,
    user_id: user.id,
    name: clean,
    prefix,
    key_hash: hash,
    // Viewers get read-only keys: AI tools can read the Brand Kit, but nothing gets uploaded.
    scopes: canWrite(org) ? ["mcp:read", "checks:write"] : ["mcp:read"],
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/connect");
  return { ok: true, key, name: clean };
}

export async function revokeApiKeyAction(id: string): Promise<void> {
  await requireOrg();
  if (!isSupabaseConfigured) return;
  const supabase = await createSupabaseServerClient();
  await supabase.from("api_keys").update({ revoked_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/dashboard/connect");
}
