import Link from "next/link";
import type { Metadata } from "next";
import { Bot, Clock, Globe, GitPullRequest, Terminal } from "lucide-react";
import { Box, BoxHeader, Label } from "@brandrail/ui";
import { Playground } from "@/components/checks/playground";
import { PageHeader } from "@/components/dashboard/page-header";
import { SampleDataBadge } from "@/components/dashboard/sample-data";
import { ScanStatusIcon } from "@/components/dashboard/scan-status";
import { scoreTone } from "@/components/dashboard/sparkline";
import { listScans, timeAgo } from "@/lib/data";
import { requireOrg } from "@/lib/session";

export const metadata: Metadata = { title: "Checks" };

const sourceMeta = {
  ci: { icon: GitPullRequest, label: "Pull request" },
  cli: { icon: Terminal, label: "CLI" },
  mcp: { icon: Bot, label: "AI tool" },
  worker: { icon: Globe, label: "URL scan" },
} as const;

function FirstScan() {
  return (
    <div className="grid gap-6 p-6 lg:grid-cols-2">
      <div>
        <h3 className="text-sm font-medium text-fg">Run your first check from a repo</h3>
        <p className="mt-1 text-[13px] text-fg-muted">
          Create an API key in <Link href="/dashboard/connect" className="text-accent hover:underline">Connect</Link>, then in your project:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-md border border-line bg-canvas-inset p-3 font-mono text-xs leading-5 text-fg">{`export BRANDRAIL_KEY=br_live_…
export BRANDRAIL_API_URL=http://localhost:3000
npx brandrail init --from-api
npx brandrail check --upload`}</pre>
      </div>
      <div>
        <h3 className="text-sm font-medium text-fg">Or check every pull request</h3>
        <p className="mt-1 text-[13px] text-fg-muted">
          Add the GitHub Action. Scores, annotations and a PR comment appear on every PR, and results land here.
        </p>
        <Link href="/dashboard/connect#github-action" className="mt-3 inline-block text-[13px] text-accent hover:underline">
          Set up the GitHub Action →
        </Link>
      </div>
    </div>
  );
}

export default async function ChecksPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter } = await searchParams;
  const { org } = await requireOrg();
  const [{ rows, sample }, all] = await Promise.all([
    listScans(org, { failedOnly: filter === "failed" }),
    filter === "failed" ? listScans(org) : Promise.resolve(null),
  ]);
  const total = all ?? { rows, sample };
  const failedCount = total.rows.filter((r) => r.status === "failed").length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Checks"
        badge={sample ? <SampleDataBadge /> : undefined}
        description="Every scan from pull requests, the CLI, AI tools and live URLs."
      />

      <Box>
        <BoxHeader className="justify-between">
          <div className="flex gap-4 text-[13px]">
            <Link href="/dashboard/checks" className={!filter ? "font-medium text-fg" : "text-fg-muted hover:text-fg"}>
              {total.rows.length} scans
            </Link>
            <Link href="/dashboard/checks?filter=failed" className={filter === "failed" ? "font-medium text-fg" : "text-fg-muted hover:text-fg"}>
              {failedCount} below threshold
            </Link>
          </div>
        </BoxHeader>
        {total.rows.length === 0 ? (
          <FirstScan />
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-fg-muted">Nothing below threshold. Nice.</p>
        ) : (
          <ul>
            {rows.map((s) => {
              const { icon: SourceIcon, label } = sourceMeta[s.source];
              return (
                <li key={s.id} className="flex items-start gap-3 border-b border-line px-4 py-3 last:border-0 hover:bg-canvas-subtle">
                  <span className="mt-0.5">
                    <ScanStatusIcon status={s.status} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link href={`/dashboard/checks/${s.id}`} className="text-[13px] font-medium text-fg hover:text-accent">
                      {s.title}
                    </Link>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-fg-subtle">
                      <span className="text-fg-muted">{s.targetName}</span>
                      <span className="inline-flex items-center gap-1">
                        <SourceIcon size={12} /> {label} {s.ref}
                      </span>
                      <span>
                        {s.errors} errors · {s.warnings} warnings
                      </span>
                    </div>
                  </div>
                  <span className="hidden items-center gap-1 text-xs text-fg-subtle sm:inline-flex">
                    <Clock size={12} /> {timeAgo(s.createdAt)}
                  </span>
                  {s.score !== null && (
                    <Label tone={scoreTone(s.score, s.threshold ?? 80)} className="w-12 justify-center">
                      {s.score}
                    </Label>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Box>

      <Playground />
    </div>
  );
}
