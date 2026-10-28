import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  AlertIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  FileCodeIcon,
  InfoIcon,
  LightBulbIcon,
  StopIcon,
  XCircleIcon,
} from "@primer/octicons-react";
import { Blankslate, Box, BoxHeader, Button, Label } from "@brandrail/ui";
import { ScanStatusIcon } from "@/components/dashboard/scan-status";
import { scoreTone } from "@/components/dashboard/sparkline";
import { scans, targets, violationsByScan, type Violation } from "@/lib/mock";

export const metadata: Metadata = { title: "Check details" };

const sevIcon = {
  error: <StopIcon size={16} className="text-danger" />,
  warning: <AlertIcon size={16} className="text-attention" />,
  info: <InfoIcon size={16} className="text-accent" />,
};

export default async function CheckDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scan = scans.find((s) => s.id === id);
  if (!scan) notFound();
  const target = targets.find((t) => t.id === scan.targetId);
  const violations = violationsByScan[id] ?? [];
  const byFile = violations.reduce<Record<string, Violation[]>>((acc, v) => {
    (acc[v.file] ??= []).push(v);
    return acc;
  }, {});
  const counts = { error: 0, warning: 0, info: 0 };
  for (const v of violations) counts[v.severity]++;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/dashboard/checks" className="inline-flex items-center gap-1 text-sm text-fg-muted hover:text-accent">
        <ArrowLeftIcon size={16} /> All checks
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
        <div>
          <h1 className="text-2xl font-normal text-fg">
            {scan.title} <span className="text-fg-muted">{scan.ref}</span>
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-fg-muted">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium text-on-emphasis" style={{ background: scan.status === "passed" ? "var(--br-success-emphasis)" : "var(--br-danger-emphasis)" }}>
              {scan.status === "passed" ? <CheckCircleIcon size={14} /> : <XCircleIcon size={14} />}{" "}
              {scan.status === "passed" ? "Passed" : "Below threshold"}
            </span>
            <span>
              <strong className="text-fg">{target?.name}</strong> · by {scan.author} · {scan.when} · {scan.duration}
            </span>
          </div>
        </div>
        {scan.score !== null && (
          <div className="text-right">
            <div className="text-xs text-fg-muted">Brand score</div>
            <div className={`text-4xl font-semibold ${scoreTone(scan.score, target?.threshold) === "success" ? "text-success" : scoreTone(scan.score, target?.threshold) === "attention" ? "text-attention" : "text-danger"}`}>
              {scan.score}
              <span className="text-base text-fg-muted">/100</span>
            </div>
            <div className="text-xs text-fg-muted">threshold {target?.threshold}</div>
          </div>
        )}
      </div>

      {violations.length === 0 ? (
        <Box>
          <Blankslate
            icon={<ScanStatusIcon status="passed" size={32} />}
            title="No violations"
            description="Everything in this check used approved tokens and components."
          />
        </Box>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <Label tone="danger">{counts.error} errors</Label>
            <Label tone="attention">{counts.warning} warnings</Label>
            <Label tone="accent">{counts.info} info</Label>
            <Button size="sm" variant="primary" className="ml-auto">Open fix PR</Button>
          </div>
          {Object.entries(byFile).map(([file, list]) => (
            <Box key={file}>
              <BoxHeader>
                <FileCodeIcon size={16} className="text-fg-muted" />
                <span className="font-mono text-sm font-semibold text-fg">{file}</span>
                <span className="ml-auto text-xs text-fg-muted">{list.length} issue{list.length > 1 ? "s" : ""}</span>
              </BoxHeader>
              <ul>
                {list.map((v) => (
                  <li key={`${v.line}-${v.rule}`} className="flex gap-3 border-b border-line px-4 py-3 last:border-0">
                    <span className="mt-0.5">{sevIcon[v.severity]}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-mono text-xs text-fg-muted">L{v.line}</span>
                        <span className="text-fg">{v.message}</span>
                        <code className="rounded-md bg-fg-muted/10 px-1.5 py-0.5 font-mono text-xs text-fg-muted">{v.rule}</code>
                      </div>
                      <div className="mt-1.5 flex items-start gap-1.5 text-sm text-success">
                        <LightBulbIcon size={14} className="mt-0.5 shrink-0" />
                        <span>{v.suggestion}</span>
                      </div>
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
