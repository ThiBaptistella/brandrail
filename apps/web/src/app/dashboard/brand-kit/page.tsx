import type { Metadata } from "next";
import { BrandKitEditor } from "@/components/brand-kit/editor";
import { defaultBrandKit, fromDtcg, type BrandKitState } from "@/lib/brand-kit";
import { isSupabaseConfigured } from "@/lib/env";
import { listComponents } from "@/lib/data";
import { requireOrg } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Brand Kit" };

export default async function BrandKitPage() {
  const { org } = await requireOrg();

  let initial: BrandKitState = defaultBrandKit;
  let version: string | null = null;
  let publishedAt: string | null = null;

  if (isSupabaseConfigured) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("token_set_versions")
      .select("version, tokens, published_at")
      .eq("org_id", org.id)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) {
      initial = fromDtcg(data.tokens);
      version = data.version;
      publishedAt = data.published_at;
    }
  }

  const { rows, sample } = await listComponents(org);
  return (
    <BrandKitEditor
      components={sample ? [] : rows.map((r) => ({ name: r.name, importPath: r.importPath, status: r.status }))}
      orgName={org.name}
      initial={initial}
      version={version}
      publishedAt={publishedAt}
      canPublish={org.role === "owner" || org.role === "admin"}
    />
  );
}
