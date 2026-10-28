import { NextResponse } from "next/server";
import { getOrgEngineConfig } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/env";
import { normaliseScanUrl, ScanError, scanUrl } from "@/lib/scanner";
import { canAdmin, canWrite, getCurrentOrg, getUser } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
// Chromium cold start (~5s) + up to 5 pages.
export const maxDuration = 60;

/** POST { url, pages? } → runs a live-URL scan as the signed-in member and stores it as a "URL scan". */
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const org = await getCurrentOrg();
  if (!org) return NextResponse.json({ error: "Create an organisation first." }, { status: 403 });
  if (!canWrite(org)) return NextResponse.json({ error: "Viewers can't start scans." }, { status: 403 });

  let body: { url?: unknown; pages?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Send JSON: { url }" }, { status: 400 });
  }
  if (typeof body.url !== "string" || body.url.length > 2000) return NextResponse.json({ error: "Enter a web address." }, { status: 400 });
  const pages = typeof body.pages === "number" ? Math.min(Math.max(Math.round(body.pages), 1), 5) : 1;

  try {
    const url = await normaliseScanUrl(body.url);
    const { config } = await getOrgEngineConfig(org);
    const result = await scanUrl(url, config, { maxPages: pages, budgetMs: 50_000 });
    const target = new URL(result.url);

    if (!isSupabaseConfigured) return NextResponse.json({ demo: true, ...result });

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("record_member_scan", {
      p_org: org.id,
      p_payload: {
        target: { kind: "url", name: target.host, location: `${target.origin}${target.pathname === "/" ? "" : target.pathname}` },
        ref: result.url,
        title: result.pages.length > 1 ? `${target.host} · ${result.pages.length} pages` : `${target.host}${target.pathname === "/" ? "" : target.pathname}`,
        report: result.report,
      },
    });
    if (error) {
      const status = error.code === "53400" ? 429 : error.code === "42501" ? 403 : 500;
      return NextResponse.json({ error: status === 500 ? "Scan finished but couldn't be saved." : error.message, ...result }, { status });
    }
    return NextResponse.json({ scanId: (data as { scan_id: string }).scan_id, ...result });
  } catch (e) {
    if (e instanceof ScanError) return NextResponse.json({ error: e.message }, { status: 422 });
    console.error("scan-url failed", e);
    // Owners and admins see the first line of the error, which is what you need to debug a deploy.
    const detail = canAdmin(org) ? ` (${String((e as Error)?.message ?? e).split("\n")[0]!.slice(0, 300)})` : "";
    return NextResponse.json({ error: `The scanner hit an unexpected error. Try again.${detail}` }, { status: 500 });
  }
}
