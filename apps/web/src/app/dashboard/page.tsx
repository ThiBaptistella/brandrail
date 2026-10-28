import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, Bot, CheckCircle2, Circle, Globe, GitBranch, GitPullRequest, Terminal, TrendingDown, TrendingUp } from "lucide-react";
import { Box, BoxHeader, Label, ProgressBar, buttonClasses } from "@brandrail/ui";
import { PageHeader } from "@/components/dashboard/page-header";
import { SampleDataBadge } from "@/components/dashboard/sample-data";
import { Sparkline, scoreTone } from "@/components/dashboard/sparkline";
import { getOverview, timeAgo } from "@/lib/data";
import { requireOrg } from "@/lib/session";

export const metadata: Metadata = { title: "Overview" };

const sourceIcon = { ci: GitPullRequest, cli: Terminal, mcp: Bot, worker: Globe } as const;
const sourceLabel = { ci: "Pull request", cli: "CLI", mcp: "AI tool", worker: "URL scan" } as const;

function Stat({ label, value, suffix, hint, children }: { label: string; value: React.ReactNode; suffix?: string; hint?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <Box className="flex flex-col justify-between gap-3 p-5">
      <div className="text-[13px] text-fg-muted">{label}</div>
      <div className="flex items-end justify-between gap-3">
        <div className="text-3xl font-normal tracking-tight text-fg">
          {value}
          {suffix && <span className="ml-0.5 text-sm text-fg-subtle">{suffix}</span>}
        </div>
        {children}
      </div>
      {hint && <div className="text-xs text-fg-muted">{hint}</div>}
    </Box>
  );
}

export default async function OverviewPage() {
  const { user, org } = await requireOrg();
  const o = await getOverview(org);
  const steps = [
    { label: "Create your organisation", done: o.steps.org, href: "/dashboard/settings" },
    { label: "Publish your Brand Kit", done: o.steps.brandKit, href: "/dashboard/brand-kit" },
    { label: "Create an API key", done: o.steps.apiKey, href: "/dashboard/connect" },
    { label: "Add the GitHub Action to a repo", done: o.steps.ci, href: "/dashboard/connect#github-action" },
    { label: "Scan a live URL", done: o.steps.url, href: "/dashboard/checks#scan-url" },
  ];
  const done = steps.filter((s) => s.done).length;
  const maxRule = Math.max(1, ...o.topRules.map((r) => r.count));
  const empty = o.targets.length === 0;

  return (
    <>
      <PageHeader
        title={org.name}
        badge={o.sample ? <SampleDataBadge /> : undefined}
        description={`Welcome back, ${user.name.split(" ")[0]}. Here's how on-brand everything shipped recently.`}
        actions={
          <>
            <Link href="/dashboard/connect" className={buttonClasses("default")}>Connect a tool</Link>
            <Link href="/dashboard/checks" className={buttonClasses("primary")}>Run a check</Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Brand score"
          value={o.score ?? "—"}
          suffix={o.score !== null ? "/100" : undefined}
          hint={
            o.scoreChange !== null ? (
              <span className={`inline-flex items-center gap-1 ${o.scoreChange >= 0 ? "text-success" : "text-danger"}`}>
                {o.scoreChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {o.scoreChange >= 0 ? "+" : ""}
                {o.scoreChange} over {o.trend.length} days of scans
              </span>
            ) : (
              "average of each repo and app's latest scan"
            )
          }
        >
          <Sparkline values={o.trend} width={88} height={30} stroke="var(--br-brand)" />
        </Stat>
        <Stat label="Targets passing" value={o.passing} suffix={`/${o.targets.length}`} hint="repos and apps above threshold" />
        <Stat label="Open issues" value={o.openIssues} hint="errors and warnings in latest scans" />
        <Stat label="AI tool checks" value={o.mcpChecks7d.toLocaleString()} hint="validate_snippet calls, last 7 days" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px] 2xl:grid-cols-[1fr_400px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Box>
            <BoxHeader className="justify-between">
              <h2 className="text-[13px] font-medium text-fg">Repos and apps</h2>
              <Link href="/dashboard/checks" className="text-xs text-fg-muted hover:text-fg">
                All checks
              </Link>
            </BoxHeader>
            {empty ? (
              <div className="p-6 text-[13px] text-fg-muted">
                No scans yet. Repos and apps appear here after their first check from the{" "}
                <Link href="/dashboard/checks" className="text-accent hover:underline">CLI or GitHub Action</Link>.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-line text-left text-xs text-fg-subtle">
                      <th className="px-4 py-2.5 font-normal">Name</th>
                      <th className="hidden px-4 py-2.5 font-normal md:table-cell">Score</th>
                      <th className="hidden px-4 py-2.5 font-normal sm:table-cell">Trend</th>
                      <th className="px-4 py-2.5 text-right font-normal">Last scan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {o.targets.map((t) => {
                      const tone = t.score === null ? "attention" : scoreTone(t.score, t.threshold);
                      const color = tone === "success" ? "var(--br-brand)" : tone === "attention" ? "var(--br-attention-fg)" : "var(--br-danger-fg)";
                      return (
                        <tr key={t.id} className="border-b border-line last:border-0 hover:bg-canvas-subtle">
                          <td className="px-4 py-3">
                            <span className="flex items-center gap-2.5">
                              <span className="text-fg-subtle">{t.kind === "repo" ? <GitBranch size={15} /> : <Globe size={15} />}</span>
                              <span className="min-w-0">
                                <span className="block truncate text-fg">{t.name}</span>
                                <span className="block truncate text-xs text-fg-subtle">{t.location}</span>
                              </span>
                            </span>
                          </td>
                          <td className="hidden w-48 px-4 py-3 md:table-cell">
                            {t.score !== null && (
                              <div className="flex items-center gap-3">
                                <ProgressBar value={t.score} tone={tone} className="h-1.5" />
                                <span className="w-7 text-right font-mono text-xs text-fg">{t.score}</span>
                              </div>
                            )}
                          </td>
                          <td className="hidden px-4 py-3 sm:table-cell">
                            <Sparkline values={t.trend} width={80} height={22} stroke={color} />
                          </td>
                          <td className="px-4 py-3 text-right text-xs whitespace-nowrap text-fg-muted">
                            {t.score !== null && <Label tone={tone} className="mr-2 md:hidden">{t.score}</Label>}
                            {timeAgo(t.lastScanAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Box>

          <Box>
            <BoxHeader className="justify-between">
              <h2 className="text-[13px] font-medium text-fg">What people get wrong most</h2>
              <span className="text-xs text-fg-subtle">latest scan per repo / app</span>
            </BoxHeader>
            {o.topRules.length === 0 ? (
              <p className="p-6 text-[13px] text-fg-muted">Nothing yet. Rule breakdowns appear after the first scan.</p>
            ) : (
              <div className="flex flex-col gap-3.5 p-5">
                {o.topRules.map((r) => (
                  <div key={r.ruleId} className="grid grid-cols-[180px_1fr_40px] items-center gap-4 text-[13px] max-sm:grid-cols-[1fr_40px]">
                    <span className="truncate text-fg-muted">{r.label}</span>
                    <div className="h-1.5 overflow-hidden rounded-full bg-fg-muted/15 max-sm:hidden">
                      <div className="h-full rounded-full bg-brand" style={{ width: `${(r.count / maxRule) * 100}%` }} />
                    </div>
                    <span className="text-right font-mono text-xs text-fg">{r.count}</span>
                  </div>
                ))}
              </div>
            )}
          </Box>
        </div>

        <aside className="flex flex-col gap-6">
          <Box>
            <BoxHeader className="flex-col items-start gap-3">
              <div className="flex w-full items-center justify-between">
                <h2 className="text-[13px] font-medium text-fg">Get set up</h2>
                <span className="text-xs text-fg-subtle">{done} of {steps.length}</span>
              </div>
              <ProgressBar value={(done / steps.length) * 100} tone="success" className="h-1.5" />
            </BoxHeader>
            <ul className="py-1">
              {steps.map((s) => (
                <li key={s.label}>
                  <Link href={s.href} className="group flex items-center gap-3 px-4 py-2.5 text-[13px] hover:bg-canvas-subtle">
                    {s.done ? <CheckCircle2 size={16} className="text-brand" /> : <Circle size={16} className="text-fg-subtle" />}
                    <span className={s.done ? "text-fg-subtle line-through" : "text-fg"}>{s.label}</span>
                    {!s.done && <ArrowUpRight size={14} className="ml-auto text-fg-subtle opacity-0 group-hover:opacity-100" />}
                  </Link>
                </li>
              ))}
            </ul>
          </Box>

          <Box>
            <BoxHeader>
              <h2 className="text-[13px] font-medium text-fg">Recent scans</h2>
            </BoxHeader>
            {o.recent.length === 0 ? (
              <p className="p-4 text-[13px] text-fg-muted">No scans yet.</p>
            ) : (
              <ol className="flex flex-col py-1">
                {o.recent.map((s) => {
                  const Icon = sourceIcon[s.source];
                  return (
                    <li key={s.id}>
                      <Link href={`/dashboard/checks/${s.id}`} className="flex gap-3 px-4 py-2.5 text-[13px] hover:bg-canvas-subtle">
                        <Icon size={15} className="mt-0.5 shrink-0 text-fg-subtle" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-fg">{s.title}</div>
                          <div className="text-xs text-fg-subtle">
                            {sourceLabel[s.source]} · {s.targetName} · {timeAgo(s.createdAt)}
                          </div>
                        </div>
                        {s.score !== null && <Label tone={scoreTone(s.score, s.threshold ?? 80)}>{s.score}</Label>}
                      </Link>
                    </li>
                  );
                })}
              </ol>
            )}
          </Box>
        </aside>
      </div>
    </>
  );
}
