"use server";

import { checkSnippet, type Report } from "@brandrail/engine";
import { getOrgEngineConfig } from "@/lib/data";
import { requireOrg } from "@/lib/session";

export type PlaygroundResult = { ok: true; report: Report; kitVersion: string | null } | { ok: false; error: string };

const EXT = new Set(["tsx", "jsx", "vue", "svelte", "html", "css", "scss"]);

/** Runs the same engine as the CLI / Action / MCP server against pasted code. Nothing is stored. */
export async function runPlaygroundAction(code: string, ext: string): Promise<PlaygroundResult> {
  const { org } = await requireOrg();
  if (code.length > 100_000) return { ok: false, error: "Paste up to 100 KB of code." };
  const e = EXT.has(ext) ? ext : "tsx";
  const { config, published } = await getOrgEngineConfig(org);
  const report = checkSnippet(code, `playground.${e}`, config);
  return { ok: true, report, kitVersion: published ? (config.tokenVersion ?? null) : null };
}
