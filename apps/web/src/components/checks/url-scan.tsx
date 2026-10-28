"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, OctagonX, TriangleAlert } from "lucide-react";
import type { Report } from "@brandrail/engine";
import { Box, BoxHeader, Button, Flash, Label, Select, TextInput } from "@brandrail/ui";

type Result = { scanId?: string; demo?: boolean; error?: string; notes?: string[]; report?: Report; pages?: Array<{ url: string; title: string; nodes: number }> };

const STAGES = ["Starting a browser…", "Loading the page…", "Reading computed styles…", "Checking against your Brand Kit…"];

/** "Scan a live URL": runs the hosted scanner and opens the stored result. */
export function UrlScan({ canScan }: { canScan: boolean }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [pages, setPages] = useState("1");
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState(0);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    if (!busy) return;
    setStage(0);
    const t = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 4000);
    return () => clearInterval(t);
  }, [busy]);

  const scan = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/scan-url", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url, pages: Number(pages) }) });
      const body = (await res.json().catch(() => ({ error: "The scanner timed out. Try a single page." }))) as Result;
      if (body.scanId) {
        router.push(`/dashboard/checks/${body.scanId}`);
        router.refresh();
        return;
      }
      setResult(res.ok ? body : { ...body, error: body.error ?? `Scan failed (${res.status}).` });
    } catch {
      setResult({ error: "Couldn't reach the scanner." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box id="scan-url">
      <BoxHeader>
        <Globe size={15} className="text-fg-subtle" />
        <h2 className="text-[13px] font-medium text-fg">Scan a live URL</h2>
        <span className="hidden text-xs text-fg-muted sm:inline">Checks what the browser actually renders: colours, contrast, fonts, type scale, spacing, radius</span>
      </BoxHeader>
      <form onSubmit={scan} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <TextInput aria-label="Page address" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://your-app.com/dashboard" disabled={busy || !canScan} required />
        </div>
        <div className="w-full sm:w-36">
          <Select aria-label="Pages to scan" value={pages} onChange={(e) => setPages(e.target.value)} disabled={busy || !canScan}>
            <option value="1">This page</option>
            <option value="3">+ 2 linked pages</option>
            <option value="5">+ 4 linked pages</option>
          </Select>
        </div>
        <Button type="submit" variant="primary" disabled={busy || !canScan || !url.trim()} aria-busy={busy}>
          {busy ? "Scanning…" : "Scan"}
        </Button>
      </form>
      {busy && <p className="-mt-1 px-4 pb-4 text-xs text-fg-muted" aria-live="polite">{STAGES[stage]}</p>}
      {!canScan && <p className="-mt-1 px-4 pb-4 text-xs text-fg-muted">Viewers can't start scans.</p>}
      {!busy && !result && canScan && (
        <p className="-mt-1 px-4 pb-4 text-xs text-fg-subtle">
          Public pages only. For localhost or pages behind a login, run <code className="font-mono">npx brandrail scan &lt;url&gt;</code> on your machine.
        </p>
      )}
      {result?.error && (
        <div className="px-4 pb-4">
          <Flash tone="danger">{result.error}</Flash>
        </div>
      )}
      {result?.report && !result.scanId && (
        <div className="border-t border-line">
          <div className="flex flex-wrap items-center gap-2 px-4 py-3 text-xs text-fg-muted">
            <Label tone={result.report.score >= 80 ? "success" : "danger"}>{result.report.score}/100</Label>
            {result.pages?.map((p) => p.url).join(", ")} · {result.report.linesScanned} elements
            {result.demo && <span className="ml-auto">Demo mode: not saved</span>}
          </div>
          {result.notes?.map((n) => (
            <p key={n} className="px-4 pb-2 text-xs text-attention">{n}</p>
          ))}
          <ul>
            {result.report.violations.slice(0, 30).map((v, i) => (
              <li key={i} className="flex gap-3 border-t border-line px-4 py-2.5 text-[13px]">
                {v.severity === "error" ? <OctagonX size={15} className="mt-0.5 shrink-0 text-danger" /> : <TriangleAlert size={15} className="mt-0.5 shrink-0 text-attention" />}
                <div className="min-w-0">
                  <div className="text-fg">{v.message}</div>
                  {v.suggestion && <div className="text-xs text-fg-muted">{v.suggestion}</div>}
                  {v.snippet && <code className="mt-0.5 block truncate font-mono text-[11px] text-fg-subtle">{v.snippet}</code>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Box>
  );
}
