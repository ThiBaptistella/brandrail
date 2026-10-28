import Link from "next/link";
import type { Metadata } from "next";
import { GlobeIcon, GitPullRequestIcon, TerminalIcon, CopilotIcon, ClockIcon } from "@primer/octicons-react";
import { Box, BoxHeader, Button, Flash, Label, TextInput } from "@brandrail/ui";
import { ScanStatusIcon } from "@/components/dashboard/scan-status";
import { scoreTone } from "@/components/dashboard/sparkline";
import { scans, targets } from "@/lib/mock";

export const metadata: Metadata = { title: "Checks" };

const sourceMeta = {
  ci: { icon: GitPullRequestIcon, label: "Pull request" },
  cli: { icon: TerminalIcon, label: "CLI" },
  mcp: { icon: CopilotIcon, label: "AI tool" },
  worker: { icon: GlobeIcon, label: "URL scan" },
} as const;

export default async function ChecksPage({ searchParams }: { searchParams: Promise<{ new?: string; filter?: string }> }) {
  const { new: showNew, filter } = await searchParams;
  const list = filter === "failed" ? scans.filter((s) => s.status === "failed") : scans;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
        <div>
          <h1 className="text-2xl font-semibold text-fg">Checks</h1>
          <p className="mt-1 text-fg-muted">Every scan from pull requests, the CLI, AI tools and live URLs.</p>
        </div>
      </div>

      <Box id="scan-url" className={showNew ? "ring-2 ring-accent-emphasis/40" : ""}>
        <BoxHeader>
          <GlobeIcon size={16} className="text-fg-muted" />
          <h2 className="text-sm font-semibold text-fg">Scan a live URL</h2>
        </BoxHeader>
        <form className="flex flex-col gap-3 p-4 sm:flex-row" action="/dashboard/checks">
          <TextInput
            name="url"
            type="url"
            required
            placeholder="https://your-app.lovable.app"
            aria-label="URL to scan"
            autoFocus={Boolean(showNew)}
          />
          <Button type="submit" variant="primary" className="shrink-0">Run scan</Button>
        </form>
        {showNew && (
          <div className="px-4 pb-4">
            <Flash tone="accent">
              URL scans run in a headless browser at 375, 768 and 1440px and check colours, fonts, contrast and touch
              targets against your Brand Kit. The scan worker is the next thing to build.
            </Flash>
          </div>
        )}
      </Box>

      <Box>
        <BoxHeader className="justify-between">
          <div className="flex gap-4 text-sm">
            <Link href="/dashboard/checks" className={!filter ? "font-semibold text-fg" : "text-fg-muted hover:text-fg"}>
              {scans.length} scans
            </Link>
            <Link href="/dashboard/checks?filter=failed" className={filter === "failed" ? "font-semibold text-fg" : "text-fg-muted hover:text-fg"}>
              {scans.filter((s) => s.status === "failed").length} below threshold
            </Link>
          </div>
        </BoxHeader>
        <ul>
          {list.map((s) => {
            const target = targets.find((t) => t.id === s.targetId);
            const { icon: SourceIcon, label } = sourceMeta[s.source];
            return (
              <li key={s.id} className="flex items-start gap-3 border-b border-line px-4 py-3 last:border-0 hover:bg-canvas-subtle">
                <span className="mt-0.5"><ScanStatusIcon status={s.status} /></span>
                <div className="min-w-0 flex-1">
                  <Link href={`/dashboard/checks/${s.id}`} className="font-semibold text-fg hover:text-accent">
                    {s.title}
                  </Link>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-fg-muted">
                    <span className="font-semibold">{target?.name}</span>
                    <span className="inline-flex items-center gap-1"><SourceIcon size={12} /> {label} {s.ref}</span>
                    <span>by {s.author}</span>
                  </div>
                </div>
                <div className="hidden flex-col items-end gap-1 text-xs text-fg-muted sm:flex">
                  <span className="inline-flex items-center gap-1"><ClockIcon size={12} /> {s.when}</span>
                  <span>{s.duration}</span>
                </div>
                {s.score !== null && (
                  <Label tone={scoreTone(s.score, target?.threshold)} className="w-12 justify-center">{s.score}</Label>
                )}
              </li>
            );
          })}
        </ul>
      </Box>
    </div>
  );
}
