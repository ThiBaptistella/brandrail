import "server-only";
import { ruleTitle as engineRuleTitle, starterConfig, type BrandrailConfig, type ComponentEntry } from "@brandrail/engine";
import { KIT_REGISTRY, withKitProps } from "./kit-registry";
import { isSupabaseConfigured } from "./env";
import * as mock from "./mock";
import type { Organization, Role } from "./session";
import { createSupabaseServerClient } from "./supabase/server";

export type ScanSource = "ci" | "cli" | "mcp" | "worker";
export type ScanStatus = "passed" | "failed" | "running" | "queued" | "error";

export interface ScanRow {
  id: string;
  title: string;
  targetName: string;
  targetKind: "repo" | "url";
  source: ScanSource;
  ref: string | null;
  status: ScanStatus;
  score: number | null;
  threshold: number | null;
  errors: number;
  warnings: number;
  info: number;
  createdAt: string;
  durationMs: number | null;
  tokenVersion: string | null;
  filesScanned: number | null;
}

export interface ViolationRow {
  ruleId: string;
  severity: "error" | "warning" | "info";
  file: string;
  line: number | null;
  column: number | null;
  message: string;
  suggestion: string | null;
  snippet: string | null;
}

export interface TargetSummary {
  id: string;
  kind: "repo" | "url";
  name: string;
  location: string;
  threshold: number;
  score: number | null;
  trend: number[];
  lastScanAt: string | null;
  openIssues: number;
}

export interface Overview {
  sample: boolean;
  score: number | null;
  scoreChange: number | null;
  trend: number[];
  targets: TargetSummary[];
  passing: number;
  openIssues: number;
  mcpChecks7d: number;
  topRules: Array<{ ruleId: string; label: string; count: number }>;
  recent: ScanRow[];
  steps: { org: boolean; brandKit: boolean; apiKey: boolean; ci: boolean; url: boolean };
}

const ruleTitle = engineRuleTitle;

export function timeAgo(iso: string | null): string {
  if (!iso) return "never";
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

/* ------------------------------------------------------------------ */
/* Demo data adapters                                                  */
/* ------------------------------------------------------------------ */

const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString();
const MOCK_AGE: Record<string, number> = { "12 minutes ago": 12, "2 hours ago": 120, yesterday: 1500, "3 days ago": 4320, "4 days ago": 5760 };

function mockScans(): ScanRow[] {
  return mock.scans.map((s) => {
    const t = mock.targets.find((x) => x.id === s.targetId)!;
    const v = mock.violationsByScan[s.id] ?? [];
    return {
      id: s.id,
      title: s.title,
      targetName: t.name,
      targetKind: t.kind,
      source: s.source,
      ref: s.ref,
      status: s.status,
      score: s.score,
      threshold: t.threshold,
      errors: v.filter((x) => x.severity === "error").length || (s.status === "failed" ? 4 : 0),
      warnings: v.filter((x) => x.severity === "warning").length,
      info: v.filter((x) => x.severity === "info").length,
      createdAt: ago(MOCK_AGE[s.when] ?? 60),
      durationMs: null,
      tokenVersion: "1.4.0",
      filesScanned: null,
    };
  });
}

/* ------------------------------------------------------------------ */

const SCAN_COLS =
  "id, title, source, ref, status, score, threshold, error_count, warning_count, info_count, created_at, duration_ms, token_version, files_scanned, targets(name, kind)";

type ScanDb = {
  id: string;
  title: string | null;
  source: ScanSource;
  ref: string | null;
  status: ScanStatus;
  score: number | null;
  threshold: number | null;
  error_count: number;
  warning_count: number;
  info_count: number;
  created_at: string;
  duration_ms: number | null;
  token_version: string | null;
  files_scanned: number | null;
  targets: { name: string; kind: "repo" | "url" } | null;
};

const toScanRow = (r: ScanDb): ScanRow => ({
  id: r.id,
  title: r.title ?? "Scan",
  targetName: r.targets?.name ?? "—",
  targetKind: r.targets?.kind ?? "repo",
  source: r.source,
  ref: r.ref,
  status: r.status,
  score: r.score,
  threshold: r.threshold,
  errors: r.error_count,
  warnings: r.warning_count,
  info: r.info_count,
  createdAt: r.created_at,
  durationMs: r.duration_ms,
  tokenVersion: r.token_version,
  filesScanned: r.files_scanned,
});

export async function listScans(org: Organization, opts: { failedOnly?: boolean; limit?: number } = {}): Promise<{ rows: ScanRow[]; sample: boolean }> {
  if (!isSupabaseConfigured) {
    const rows = mockScans();
    return { rows: opts.failedOnly ? rows.filter((r) => r.status === "failed") : rows, sample: true };
  }
  const supabase = await createSupabaseServerClient();
  let q = supabase.from("scans").select(SCAN_COLS).eq("org_id", org.id).order("created_at", { ascending: false }).limit(opts.limit ?? 50);
  if (opts.failedOnly) q = q.eq("status", "failed");
  const { data } = await q;
  return { rows: ((data ?? []) as unknown as ScanDb[]).map(toScanRow), sample: false };
}

export async function getScan(org: Organization, id: string): Promise<{ scan: ScanRow; violations: ViolationRow[] } | null> {
  if (!isSupabaseConfigured) {
    const scan = mockScans().find((s) => s.id === id);
    if (!scan) return null;
    const violations = (mock.violationsByScan[id] ?? []).map((v) => ({
      ruleId: v.rule,
      severity: v.severity,
      file: v.file,
      line: v.line,
      column: null,
      message: v.message,
      suggestion: v.suggestion,
      snippet: null,
    }));
    return { scan, violations };
  }
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createSupabaseServerClient();
  const [{ data: s }, { data: v }] = await Promise.all([
    supabase.from("scans").select(SCAN_COLS).eq("org_id", org.id).eq("id", id).maybeSingle(),
    supabase
      .from("violations")
      .select("rule_id, severity, file, line, col, message, suggestion, snippet")
      .eq("scan_id", id)
      .order("file")
      .order("line", { nullsFirst: true })
      // Insertion order: the engine already sorts by severity and impact.
      .order("id")
      .limit(1000),
  ]);
  if (!s) return null;
  return {
    scan: toScanRow(s as unknown as ScanDb),
    violations: (v ?? []).map((r) => ({
      ruleId: r.rule_id,
      severity: r.severity,
      file: r.file ?? "",
      line: r.line,
      column: r.col,
      message: r.message,
      suggestion: r.suggestion,
      snippet: r.snippet,
    })),
  };
}

export async function getOverview(org: Organization): Promise<Overview> {
  if (!isSupabaseConfigured) {
    return {
      sample: true,
      score: mock.orgScore.current,
      scoreChange: mock.orgScore.current - mock.orgScore.previous,
      trend: mock.orgScore.trend,
      targets: mock.targets.map((t) => ({
        id: t.id,
        kind: t.kind,
        name: t.name,
        location: t.location,
        threshold: t.threshold,
        score: t.score,
        trend: t.trend,
        lastScanAt: ago(MOCK_AGE[t.lastScan] ?? 60),
        openIssues: t.violations,
      })),
      passing: mock.targets.filter((t) => t.score >= t.threshold).length,
      openIssues: mock.targets.reduce((n, t) => n + t.violations, 0),
      mcpChecks7d: 1284,
      topRules: mock.topRules.map((r) => ({ ruleId: r.rule, label: r.label, count: r.count })),
      recent: mockScans().slice(0, 5),
      steps: { org: true, brandKit: true, apiKey: false, ci: false, url: false },
    };
  }

  const supabase = await createSupabaseServerClient();
  const since7 = new Date(Date.now() - 7 * 86400_000).toISOString();
  const [targetsRes, scansRes, kitRes, keyRes, mcpRes] = await Promise.all([
    supabase.from("targets").select("id, kind, name, location, threshold").eq("org_id", org.id),
    supabase
      .from("scans")
      .select("id, target_id, score, source, status, error_count, warning_count, info_count, by_rule, created_at, title, ref, threshold, duration_ms, token_version, files_scanned, targets(name, kind)")
      .eq("org_id", org.id)
      .order("created_at", { ascending: false })
      .limit(300),
    supabase.from("token_set_versions").select("id", { count: "exact", head: true }).eq("org_id", org.id).eq("status", "published"),
    supabase.from("api_keys").select("id", { count: "exact", head: true }).eq("org_id", org.id).is("revoked_at", null),
    supabase.from("scans").select("id", { count: "exact", head: true }).eq("org_id", org.id).eq("source", "mcp").gte("created_at", since7),
  ]);

  type S = ScanDb & { target_id: string; by_rule: Array<{ ruleId: string; count: number }> };
  const scans = (scansRes.data ?? []) as unknown as S[];
  const targets = (targetsRes.data ?? []) as Array<{ id: string; kind: "repo" | "url"; name: string; location: string; threshold: number }>;

  const summaries: TargetSummary[] = targets.map((t) => {
    const ts = scans.filter((s) => s.target_id === t.id && s.score !== null);
    const latest = ts[0];
    return {
      ...t,
      score: latest?.score ?? null,
      trend: ts.slice(0, 8).map((s) => s.score!).reverse(),
      lastScanAt: latest?.created_at ?? null,
      openIssues: latest ? latest.error_count + latest.warning_count : 0,
    };
  });
  summaries.sort((a, b) => (b.lastScanAt ?? "").localeCompare(a.lastScanAt ?? ""));

  const scored = summaries.filter((t) => t.score !== null);
  const score = scored.length ? Math.round(scored.reduce((n, t) => n + t.score!, 0) / scored.length) : null;

  // Daily average score, oldest → newest, last 8 days with data.
  const byDay = new Map<string, number[]>();
  for (const s of scans) if (s.score !== null) byDay.set(s.created_at.slice(0, 10), [...(byDay.get(s.created_at.slice(0, 10)) ?? []), s.score]);
  const trend = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([, xs]) => Math.round(xs.reduce((a, b) => a + b, 0) / xs.length));

  const rules = new Map<string, number>();
  const latestPerTarget = new Set<string>();
  for (const s of scans) {
    if (latestPerTarget.has(s.target_id)) continue;
    latestPerTarget.add(s.target_id);
    for (const r of s.by_rule ?? []) rules.set(r.ruleId, (rules.get(r.ruleId) ?? 0) + r.count);
  }

  return {
    sample: false,
    score,
    scoreChange: trend.length > 1 ? trend.at(-1)! - trend[0]! : null,
    trend,
    targets: summaries,
    passing: summaries.filter((t) => t.score !== null && t.score >= t.threshold).length,
    openIssues: summaries.reduce((n, t) => n + t.openIssues, 0),
    mcpChecks7d: mcpRes.count ?? 0,
    topRules: [...rules].map(([ruleId, count]) => ({ ruleId, label: ruleTitle(ruleId), count })).sort((a, b) => b.count - a.count).slice(0, 6),
    recent: scans.slice(0, 5).map(toScanRow),
    steps: {
      org: true,
      brandKit: (kitRes.count ?? 0) > 0,
      apiKey: (keyRes.count ?? 0) > 0,
      ci: scans.some((s) => s.source === "ci"),
      url: targets.some((t) => t.kind === "url"),
    },
  };
}

export interface ApiKeyRow {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  createdAt: string;
}

export async function listApiKeys(org: Organization): Promise<{ rows: ApiKeyRow[]; sample: boolean }> {
  if (!isSupabaseConfigured) {
    return {
      sample: true,
      rows: [
        { id: "k1", name: "Thiago's laptop", prefix: "br_live_7f3a", scopes: ["mcp:read", "checks:write"], lastUsedAt: ago(12), createdAt: ago(9000) },
        { id: "k2", name: "GitHub Actions", prefix: "br_live_c91e", scopes: ["checks:write"], lastUsedAt: ago(120), createdAt: ago(9000) },
      ],
    };
  }
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("api_keys")
    .select("id, name, prefix, scopes, last_used_at, created_at")
    .eq("org_id", org.id)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });
  return {
    sample: false,
    rows: (data ?? []).map((k) => ({ id: k.id, name: k.name, prefix: k.prefix, scopes: k.scopes, lastUsedAt: k.last_used_at, createdAt: k.created_at })),
  };
}

export interface RegistryComponent extends ComponentEntry {
  id: string;
  updatedAt: string | null;
}

const COMPONENT_COLS = "id, name, import_path, description, usage_rules, status, replaces, aliases, example, props_schema, updated_at";
type ComponentDb = {
  id: string;
  name: string;
  import_path: string;
  description: string | null;
  usage_rules: string[] | null;
  status: ComponentEntry["status"];
  replaces: string[] | null;
  aliases: string[] | null;
  example: string | null;
  props_schema: { props?: ComponentEntry["props"]; htmlAttributes?: string } | null;
  updated_at: string | null;
};
const toComponent = (c: ComponentDb): RegistryComponent => ({
  id: c.id,
  name: c.name,
  importPath: c.import_path,
  description: c.description ?? undefined,
  usageRules: c.usage_rules?.length ? c.usage_rules : undefined,
  status: c.status ?? "stable",
  replaces: c.replaces?.length ? c.replaces : undefined,
  aliases: c.aliases?.length ? c.aliases : undefined,
  example: c.example ?? undefined,
  props: c.props_schema?.props?.length ? c.props_schema.props : undefined,
  htmlAttributes: c.props_schema?.htmlAttributes,
  updatedAt: c.updated_at,
});

const demoRegistry = (): RegistryComponent[] =>
  KIT_REGISTRY.map((c, i) => ({ ...c, id: `demo-${i}`, importPath: "@brandrail/kit", updatedAt: null }));

export async function listComponents(org: Organization): Promise<{ rows: RegistryComponent[]; sample: boolean }> {
  if (!isSupabaseConfigured) return { rows: demoRegistry(), sample: true };
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("components").select(COMPONENT_COLS).eq("org_id", org.id).order("name");
  return { rows: withKitProps(((data ?? []) as ComponentDb[]).map(toComponent)), sample: false };
}

/** The org's published Brand Kit as an engine config (falls back to the starter kit). */
export async function getOrgEngineConfig(org: Organization): Promise<{ config: BrandrailConfig; published: boolean }> {
  if (!isSupabaseConfigured) return { config: { ...starterConfig, components: demoRegistry() }, published: false };

  const supabase = await createSupabaseServerClient();
  const [{ data: kit }, { data: comps }] = await Promise.all([
    supabase
      .from("token_set_versions")
      .select("version, tokens")
      .eq("org_id", org.id)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("components").select(COMPONENT_COLS).eq("org_id", org.id).neq("status", "deprecated"),
  ]);
  const components: ComponentEntry[] = withKitProps(((comps ?? []) as ComponentDb[]).map(toComponent))
    .map(({ id: _id, updatedAt: _updatedAt, ...entry }) => entry);
  if (!kit) return { config: { ...starterConfig, components: components.length ? components : starterConfig.components }, published: false };
  return {
    config: { tokenVersion: kit.version, tokens: kit.tokens as BrandrailConfig["tokens"], components },
    published: true,
  };
}

/* ───────── members & invitations ───────── */

export type MemberRow = { userId: string; email: string; name: string; role: Role; joinedAt: string };
export type InvitationRow = { id: string; email: string; role: Role; createdAt: string; expiresAt: string };
export type MyInvitation = { id: string; orgName: string; orgSlug: string; role: Role; invitedBy: string | null };

export async function listMembers(org: Organization, me: { id: string; email: string; name: string }): Promise<MemberRow[]> {
  if (!isSupabaseConfigured) return [{ userId: me.id, email: me.email, name: me.name, role: org.role, joinedAt: new Date().toISOString() }];
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.rpc("org_members", { p_org: org.id });
  return ((data ?? []) as Array<{ user_id: string; email: string; name: string; role: Role; joined_at: string }>).map((m) => ({
    userId: m.user_id,
    email: m.email,
    name: m.name,
    role: m.role,
    joinedAt: m.joined_at,
  }));
}

export async function listInvitations(org: Organization): Promise<InvitationRow[]> {
  if (!isSupabaseConfigured || (org.role !== "owner" && org.role !== "admin")) return [];
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("invitations").select("id, email, role, created_at, expires_at").eq("org_id", org.id).order("created_at", { ascending: false });
  return (data ?? []).map((i) => ({ id: i.id, email: i.email, role: i.role as Role, createdAt: i.created_at, expiresAt: i.expires_at }));
}

export async function myInvitations(): Promise<MyInvitation[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("my_invitations");
  if (error) return [];
  return ((data ?? []) as Array<{ id: string; org_name: string; org_slug: string; role: Role; invited_by_email: string | null }>).map((i) => ({
    id: i.id,
    orgName: i.org_name,
    orgSlug: i.org_slug,
    role: i.role,
    invitedBy: i.invited_by_email,
  }));
}
