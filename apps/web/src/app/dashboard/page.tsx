import Link from "next/link";
import type { Metadata } from "next";
import {
  CheckCircleFillIcon,
  CircleIcon,
  GlobeIcon,
  RepoIcon,
  ArrowUpIcon,
} from "@primer/octicons-react";
import { Avatar, Box, BoxHeader, BoxRow, Label, ProgressBar, buttonClasses } from "@brandrail/ui";
import { Sparkline, scoreTone } from "@/components/dashboard/sparkline";
import { activity, orgScore, targets, topRules } from "@/lib/mock";
import { requireOrg } from "@/lib/session";

export const metadata: Metadata = { title: "Overview" };

const steps = [
  { label: "Create your organisation", done: true, href: "/dashboard/settings" },
  { label: "Set up your Brand Kit", done: true, href: "/dashboard/brand-kit" },
  { label: "Connect an AI coding tool", done: false, href: "/dashboard/connect" },
  { label: "Add the GitHub Action to a repo", done: false, href: "/dashboard/connect#github-action" },
  { label: "Scan a live URL", done: false, href: "/dashboard/checks?new=1" },
];

export default async function OverviewPage() {
  const { user, org } = await requireOrg();
  const done = steps.filter((s) => s.done).length;
  const maxRule = Math.max(...topRules.map((r) => r.count));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="flex min-w-0 flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-fg">Good to see you, {user.name.split(" ")[0]}</h1>
          <p className="text-fg-muted">How on-brand is everything {org.name} shipped this week.</p>
        </div>

        {/* Score summary */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Box className="p-4 sm:col-span-1">
            <div className="text-sm text-fg-muted">Brand score</div>
            <div className="mt-1 flex items-end justify-between">
              <div className="text-4xl font-semibold text-fg">
                {orgScore.current}
                <span className="text-base text-fg-muted">/100</span>
              </div>
              <Sparkline values={orgScore.trend} width={96} />
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs text-success">
              <ArrowUpIcon size={12} /> {orgScore.current - orgScore.previous} points in 8 weeks
            </div>
          </Box>
          <Box className="p-4">
            <div className="text-sm text-fg-muted">Targets passing</div>
            <div className="mt-1 text-4xl font-semibold text-fg">
              {targets.filter((t) => t.score >= t.threshold).length}
              <span className="text-base text-fg-muted">/{targets.length}</span>
            </div>
            <div className="mt-2 text-xs text-fg-muted">repos and apps above threshold</div>
          </Box>
          <Box className="p-4">
            <div className="text-sm text-fg-muted">Open violations</div>
            <div className="mt-1 text-4xl font-semibold text-fg">{targets.reduce((n, t) => n + t.violations, 0)}</div>
            <div className="mt-2 text-xs text-fg-muted">across all targets</div>
          </Box>
        </div>

        {/* Targets */}
        <Box>
          <BoxHeader className="justify-between">
            <h2 className="text-sm font-semibold text-fg">Repos and apps</h2>
            <Link href="/dashboard/checks?new=1" className={buttonClasses("default", "sm")}>
              Add target
            </Link>
          </BoxHeader>
          {targets.map((t) => {
            const tone = scoreTone(t.score, t.threshold);
            return (
              <BoxRow key={t.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-2 md:grid-cols-[auto_minmax(0,1.4fr)_minmax(0,1fr)_auto_auto]">
                <span className="text-fg-muted">{t.kind === "repo" ? <RepoIcon size={16} /> : <GlobeIcon size={16} />}</span>
                <div className="min-w-0">
                  <Link href="/dashboard/checks" className="truncate font-semibold text-accent hover:underline">
                    {t.name}
                  </Link>
                  <div className="truncate text-xs text-fg-muted">
                    {t.location} · scanned {t.lastScan}
                  </div>
                </div>
                <div className="col-span-3 flex items-center gap-3 md:col-span-1">
                  <ProgressBar value={t.score} tone={tone} />
                </div>
                <Sparkline
                  values={t.trend}
                  width={72}
                  height={24}
                  className="hidden md:block"
                  stroke={tone === "success" ? "var(--br-success-fg)" : tone === "attention" ? "var(--br-attention-fg)" : "var(--br-danger-fg)"}
                />
                <Label tone={tone} className="row-start-1 col-start-3 md:row-start-auto md:col-start-auto w-12 justify-center">
                  {t.score}
                </Label>
              </BoxRow>
            );
          })}
        </Box>

        {/* Top rules */}
        <Box>
          <BoxHeader>
            <h2 className="text-sm font-semibold text-fg">What people get wrong most</h2>
            <span className="text-xs text-fg-muted">last 30 days</span>
          </BoxHeader>
          <div className="flex flex-col gap-3 p-4">
            {topRules.map((r) => (
              <div key={r.rule} className="grid grid-cols-[160px_1fr_40px] items-center gap-3 text-sm max-sm:grid-cols-[1fr_40px]">
                <span className="truncate text-fg">{r.label}</span>
                <div className="h-2 overflow-hidden rounded-full bg-fg-muted/15 max-sm:hidden">
                  <div className="h-full rounded-full bg-accent-emphasis" style={{ width: `${(r.count / maxRule) * 100}%` }} />
                </div>
                <span className="text-right font-mono text-fg-muted">{r.count}</span>
              </div>
            ))}
          </div>
        </Box>
      </div>

      {/* Right rail */}
      <aside className="flex flex-col gap-6">
        <Box>
          <BoxHeader className="flex-col items-start gap-2">
            <div className="flex w-full items-center justify-between">
              <h2 className="text-sm font-semibold text-fg">Get set up</h2>
              <span className="text-xs text-fg-muted">
                {done} of {steps.length}
              </span>
            </div>
            <ProgressBar value={(done / steps.length) * 100} tone="accent" />
          </BoxHeader>
          <ul>
            {steps.map((s) => (
              <li key={s.label} className="border-b border-line last:border-0">
                <Link href={s.href} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-canvas-subtle">
                  {s.done ? (
                    <CheckCircleFillIcon size={16} className="text-success" />
                  ) : (
                    <CircleIcon size={16} className="text-fg-muted" />
                  )}
                  <span className={s.done ? "text-fg-muted line-through" : "text-fg"}>{s.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Box>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-fg">Recent activity</h2>
          <ol className="relative flex flex-col gap-4 border-l border-line pl-4">
            {activity.map((a, i) => (
              <li key={i} className="relative text-sm">
                <span className="absolute top-0.5 -left-[27px] rounded-full bg-canvas p-0.5">
                  <Avatar name={a.who} size={18} />
                </span>
                <span className="font-semibold text-fg">{a.who}</span>{" "}
                <span className="text-fg-muted">{a.what}</span>{" "}
                <span className="font-semibold text-fg">{a.target}</span>
                <div className="text-xs text-fg-muted">
                  {a.detail} · {a.when} ago
                </div>
              </li>
            ))}
          </ol>
        </div>
      </aside>
    </div>
  );
}
