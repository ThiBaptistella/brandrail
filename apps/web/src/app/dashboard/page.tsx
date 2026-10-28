import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, CheckCircle2, Circle, Globe, GitBranch, TrendingUp } from "lucide-react";
import { Avatar, Box, BoxHeader, Label, ProgressBar, buttonClasses } from "@brandrail/ui";
import { PageHeader } from "@/components/dashboard/page-header";
import { SampleDataBadge } from "@/components/dashboard/sample-data";
import { Sparkline, scoreTone } from "@/components/dashboard/sparkline";
import { activity, orgScore, targets, topRules } from "@/lib/mock";
import { requireOrg } from "@/lib/session";

export const metadata: Metadata = { title: "Overview" };

const steps = [
  { label: "Create your organisation", done: true, href: "/dashboard/settings" },
  { label: "Set up your Brand Kit", done: false, href: "/dashboard/brand-kit" },
  { label: "Connect an AI coding tool", done: false, href: "/dashboard/connect" },
  { label: "Add the GitHub Action to a repo", done: false, href: "/dashboard/connect#github-action" },
  { label: "Scan a live URL", done: false, href: "/dashboard/checks?new=1" },
];

function Stat({ label, value, suffix, hint, children }: { label: string; value: React.ReactNode; suffix?: string; hint?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <Box className="flex flex-col justify-between gap-4 p-5">
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
  const done = steps.filter((s) => s.done).length;
  const maxRule = Math.max(...topRules.map((r) => r.count));

  return (
    <>
      <PageHeader
        title={org.name}
        badge={<SampleDataBadge />}
        description={`Welcome back, ${user.name.split(" ")[0]}. Here's how on-brand everything shipped this week.`}
        actions={
          <>
            <Link href="/dashboard/connect" className={buttonClasses("default")}>Connect a tool</Link>
            <Link href="/dashboard/checks?new=1" className={buttonClasses("primary")}>New scan</Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Brand score"
          value={orgScore.current}
          suffix="/100"
          hint={
            <span className="inline-flex items-center gap-1 text-success">
              <TrendingUp size={12} /> +{orgScore.current - orgScore.previous} in 8 weeks
            </span>
          }
        >
          <Sparkline values={orgScore.trend} width={88} height={30} stroke="var(--br-brand)" />
        </Stat>
        <Stat label="Targets passing" value={targets.filter((t) => t.score >= t.threshold).length} suffix={`/${targets.length}`} hint="repos and apps above threshold" />
        <Stat label="Open violations" value={targets.reduce((n, t) => n + t.violations, 0)} hint="across all targets" />
        <Stat label="AI tool calls" value="1,284" hint="MCP requests in the last 7 days" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Box>
            <BoxHeader className="justify-between">
              <h2 className="text-[13px] font-medium text-fg">Repos and apps</h2>
              <Link href="/dashboard/checks?new=1" className="text-xs text-fg-muted hover:text-fg">
                Add target
              </Link>
            </BoxHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-line text-left text-xs text-fg-subtle">
                    <th className="px-4 py-2.5 font-normal">Name</th>
                    <th className="hidden px-4 py-2.5 font-normal md:table-cell">Score</th>
                    <th className="hidden px-4 py-2.5 font-normal sm:table-cell">8 weeks</th>
                    <th className="px-4 py-2.5 text-right font-normal">Last scan</th>
                  </tr>
                </thead>
                <tbody>
                  {targets.map((t) => {
                    const tone = scoreTone(t.score, t.threshold);
                    const color = tone === "success" ? "var(--br-brand)" : tone === "attention" ? "var(--br-attention-fg)" : "var(--br-danger-fg)";
                    return (
                      <tr key={t.id} className="border-b border-line last:border-0 hover:bg-canvas-subtle">
                        <td className="px-4 py-3">
                          <Link href="/dashboard/checks" className="flex items-center gap-2.5">
                            <span className="text-fg-subtle">{t.kind === "repo" ? <GitBranch size={15} /> : <Globe size={15} />}</span>
                            <span className="min-w-0">
                              <span className="block truncate text-fg">{t.name}</span>
                              <span className="block truncate text-xs text-fg-subtle">{t.location}</span>
                            </span>
                          </Link>
                        </td>
                        <td className="hidden w-48 px-4 py-3 md:table-cell">
                          <div className="flex items-center gap-3">
                            <ProgressBar value={t.score} tone={tone} className="h-1.5" />
                            <span className="w-7 text-right font-mono text-xs text-fg">{t.score}</span>
                          </div>
                        </td>
                        <td className="hidden px-4 py-3 sm:table-cell">
                          <Sparkline values={t.trend} width={80} height={22} stroke={color} />
                        </td>
                        <td className="px-4 py-3 text-right text-xs whitespace-nowrap text-fg-muted">
                          <Label tone={tone} className="mr-2 md:hidden">{t.score}</Label>
                          {t.lastScan}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Box>

          <Box>
            <BoxHeader className="justify-between">
              <h2 className="text-[13px] font-medium text-fg">What people get wrong most</h2>
              <span className="text-xs text-fg-subtle">last 30 days</span>
            </BoxHeader>
            <div className="flex flex-col gap-3.5 p-5">
              {topRules.map((r) => (
                <div key={r.rule} className="grid grid-cols-[170px_1fr_40px] items-center gap-4 text-[13px] max-sm:grid-cols-[1fr_40px]">
                  <span className="truncate text-fg-muted">{r.label}</span>
                  <div className="h-1.5 overflow-hidden rounded-full bg-fg-muted/15 max-sm:hidden">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${(r.count / maxRule) * 100}%` }} />
                  </div>
                  <span className="text-right font-mono text-xs text-fg">{r.count}</span>
                </div>
              ))}
            </div>
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
              <h2 className="text-[13px] font-medium text-fg">Recent activity</h2>
            </BoxHeader>
            <ol className="flex flex-col py-1">
              {activity.map((a, i) => (
                <li key={i} className="flex gap-3 px-4 py-2.5 text-[13px]">
                  <Avatar name={a.who} size={22} />
                  <div className="min-w-0">
                    <div className="text-fg-muted">
                      <span className="text-fg">{a.who}</span> {a.what} <span className="text-fg">{a.target}</span>
                    </div>
                    <div className="text-xs text-fg-subtle">{a.detail} · {a.when} ago</div>
                  </div>
                </li>
              ))}
            </ol>
          </Box>
        </aside>
      </div>
    </>
  );
}
