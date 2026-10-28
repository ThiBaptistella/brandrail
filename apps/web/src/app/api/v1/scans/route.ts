import { NextResponse, type NextRequest } from "next/server";
import { bearer } from "@/lib/api-keys";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseAnonClient } from "@/lib/supabase/anon";

const MAX_BYTES = 2 * 1024 * 1024;

/** Receives a Checker report from the CLI, GitHub Action or MCP server. */
export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured) return NextResponse.json({ error: "Brandrail is running in demo mode" }, { status: 503 });
  const key = bearer(req);
  if (!key) return NextResponse.json({ error: "Missing Authorization: Bearer <api key>" }, { status: 401 });

  const raw = await req.text();
  if (raw.length > MAX_BYTES) return NextResponse.json({ error: "Report too large (2 MB max)" }, { status: 413 });
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400 });
  }

  const supabase = createSupabaseAnonClient();
  const { data, error } = await supabase.rpc("ingest_scan", { p_key: key, p_payload: payload });
  if (error) {
    const status = error.code === "28000" ? 401 : error.code === "42501" ? 403 : error.code === "22023" ? 422 : 500;
    return NextResponse.json({ error: status === 500 ? "Could not store the scan" : error.message }, { status });
  }
  const scanId = (data as { scan_id: string }).scan_id;
  return NextResponse.json({ scanId, url: `${req.nextUrl.origin}/dashboard/checks/${scanId}` }, { status: 201 });
}
