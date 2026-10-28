import { NextResponse, type NextRequest } from "next/server";
import { bearer } from "@/lib/api-keys";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseAnonClient } from "@/lib/supabase/anon";

type BrandKitRow = {
  org: string;
  slug: string;
  tokenVersion: string | null;
  tokens: Record<string, unknown>;
  components: Array<{ name: string; importPath: string }>;
};

/** The published Brand Kit as a brandrail.config.json, for the CLI, GitHub Action and MCP server. */
export async function GET(req: NextRequest) {
  if (!isSupabaseConfigured) return NextResponse.json({ error: "Brandrail is running in demo mode" }, { status: 503 });
  const key = bearer(req);
  if (!key) return NextResponse.json({ error: "Missing Authorization: Bearer <api key>" }, { status: 401 });

  const { data, error } = await createSupabaseAnonClient().rpc("get_brand_kit", { p_key: key });
  if (error) {
    const status = error.code === "28000" ? 401 : error.code === "42501" ? 403 : 500;
    return NextResponse.json({ error: status === 500 ? "Could not load the Brand Kit" : error.message }, { status });
  }
  const kit = data as BrandKitRow;
  if (!kit.tokenVersion) {
    return NextResponse.json({ error: `${kit.org} hasn't published a Brand Kit yet. Publish one in Dashboard → Brand Kit.` }, { status: 404 });
  }
  return NextResponse.json({
    org: kit.org,
    config: { org: kit.slug, tokenVersion: kit.tokenVersion, tokens: kit.tokens, components: kit.components },
  });
}
