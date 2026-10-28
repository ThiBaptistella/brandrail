import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, CircleCheck, CircleX, FileCode, Info, Lightbulb, OctagonX, TriangleAlert } from "lucide-react";
import { RULES } from "@brandrail/engine";
import { Blankslate, Box, BoxHeader, Label } from "@brandrail/ui";
import { scoreTone } from "@/components/dashboard/sparkline";
import { getScan, timeAgo, type ViolationRow } from "@/lib/data";
import { requireOrg } from "@/lib/session";

export const metadata: Metadata = { title: "Check details" };

const sevIcon = {
  error: <OctagonX size={16} className="text-danger" />,
  warning: <TriangleAlert size={16} className="text-attention" />,
  info: <Info size={16} className="text-accent" />,
};
const sourceLabel = { ci: "Pull request", cli: "CLI", mcp: "AI tool", worker: "URL scan" } as const;
const ruleTitle = (id: string) => RULES.find((r) => r.id === id)?.title ?? id;

export default async function CheckDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { org } = await requireOrg();
  const found = await getScan(org, id);
  if (!found) notFound();
  const { scan, violations } = found;

  const byFile = violations.reduce<Record<string, ViolationRow[]>>((acc, v) => {
    (acc[v.file] ??= []).push(v);
    return acc;
  }, {});
  const tone = scan.score !== null ? scoreTone(scan.score, scan.threshold ?? 80) : "attention";
  const passed = scan.status === "passed";

  return (
    <div className="flex flex-col gap-6">
      <Link href="/dashboard/checks" className="inline-flex items-center gap-1.5 text-[13px] text-fg-muted hover:text-fg">
        <ArrowLeft size={14} /> All checks
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-normal tracking-tight text-fg">
            {scan.title} {scan.ref && <span className="text-fg-subtle">{scan.ref}</span>}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px] text-fg-muted">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${passed ? "bg-success-subtle text-success" : "bg-danger-subtle text-danger"}`}
            >
              {passed ? <CircleCheck size={13} /> : <CircleX size={13} />} {passed ? "Passed" : "Below threshold"}
            </span>
            <span className="text-fg">{scan.targetName}</span>
            <span>· {sourceLabel[scan.source]}</span>
            <span>· {timeAgo(scan.createdAt)}</span>
            {scan.durationMs !== null && <span>· {scan.durationMs}ms</span>}
            {scan.tokenVersion && <span>· Brand Kit v{scan.tokenVersion}</span>}
          </div>
        </div>
        {scan.score !== null && (
          <div className="text-right">
            <div className="text-xs text-fg-subtle">Brand score</div>
            <div className={`text-4xl font-normal ${tone === "success" ? "text-success" : tone === "attention" ? "text-attention" : "text-danger"}`}>
              {scan.score}
              <span className="text-base text-fg-subtle">/100</span>
            </div>
            {scan.threshold !== null && <div className="text-xs text-fg-subtle">threshold {scan.threshold}</div>}
          </div>
        )}
      </div>

      {violations.length === 0 ? (
        <Box>
          <Blankslate
            icon={<CircleCheck size={32} className="text-success" />}
            title="No violations"
            description="Everything in this check used approved tokens and components."
          />
        </Box>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <Label tone="danger">{violations.filter((v) => v.severity === "error").length} errors</Label>
            <Label tone="attention">{violations.filter((v) => v.severity === "warning").length} warnings</Label>
            <Label tone="accent">{violations.filter((v) => v.severity === "info").length} info</Label>
          </div>
          {Object.entries(byFile).map(([file, list]) => (
            <Box key={file}>
              <BoxHeader>
                <FileCode size={15} className="text-fg-subtle" />
                <span className="font-mono text-[13px] text-fg">{file}</span>
                <span className="ml-auto text-xs text-fg-subtle">
                  {list.length} issue{list.length > 1 ? "s" : ""}
                </span>
              </BoxHeader>
              <ul>
                {list.map((v, i) => (
                  <li key={i} className="flex gap-3 border-b border-line px-4 py-3 last:border-0">
                    <span className="mt-0.5">{sevIcon[v.severity]}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-[13px]">
                        {v.line !== null && <span className="font-mono text-xs text-fg-subtle">L{v.line}</span>}
                        <span className="text-fg">{v.message}</span>
                        <code className="rounded bg-fg-muted/10 px-1.5 py-px font-mono text-[11px] text-fg-muted" title={ruleTitle(v.ruleId)}>
                          {v.ruleId}
                        </code>
                      </div>
                      {v.snippet && <pre className="mt-1.5 overflow-x-auto rounded bg-canvas-inset px-2 py-1 font-mono text-[11px] text-fg-muted">{v.snippet}</pre>}
                      {v.suggestion && (
                        <div className="mt-1.5 flex items-start gap-1.5 text-[13px] text-success">
                          <Lightbulb size={14} className="mt-0.5 shrink-0" />
                          <span>{v.suggestion}</span>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </Box>
          ))}
        </>
      )}
    </div>
  );
}
