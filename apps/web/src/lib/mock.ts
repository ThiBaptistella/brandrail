/**
 * Sample data for the dashboard until the Checker, MCP server and Supabase queries are wired up.
 * Shapes match the tables in supabase/migrations.
 */

export type Target = {
  id: string;
  kind: "repo" | "url";
  name: string;
  location: string;
  score: number;
  trend: number[]; // last 8 weekly scores
  threshold: number;
  lastScan: string;
  violations: number;
};

export const targets: Target[] = [
  { id: "t1", kind: "repo", name: "fleet-portal", location: "acme/fleet-portal", score: 94, trend: [71, 74, 80, 83, 88, 90, 92, 94], threshold: 80, lastScan: "12 minutes ago", violations: 3 },
  { id: "t2", kind: "repo", name: "procurement-ui", location: "acme/procurement-ui", score: 58, trend: [55, 54, 57, 56, 60, 59, 57, 58], threshold: 80, lastScan: "2 hours ago", violations: 41 },
  { id: "t3", kind: "url", name: "safety-forms (Lovable)", location: "https://safety-forms.lovable.app", score: 71, trend: [40, 48, 52, 61, 66, 68, 70, 71], threshold: 75, lastScan: "yesterday", violations: 17 },
  { id: "t4", kind: "repo", name: "design-system", location: "acme/design-system", score: 99, trend: [97, 98, 98, 99, 99, 99, 99, 99], threshold: 95, lastScan: "3 days ago", violations: 1 },
  { id: "t5", kind: "url", name: "intranet-home", location: "https://intranet.acme.example", score: 83, trend: [79, 80, 80, 81, 82, 82, 84, 83], threshold: 80, lastScan: "4 days ago", violations: 9 },
];

export type ScanStatus = "passed" | "failed" | "running" | "queued";
export type Scan = {
  id: string;
  title: string;
  targetId: string;
  source: "ci" | "cli" | "mcp" | "worker";
  ref: string;
  author: string;
  status: ScanStatus;
  score: number | null;
  when: string;
  duration: string;
};

export const scans: Scan[] = [
  { id: "s-1042", title: "Add fleet maintenance page", targetId: "t1", source: "ci", ref: "#482", author: "jordan", status: "passed", score: 94, when: "12 minutes ago", duration: "41s" },
  { id: "s-1041", title: "Vendor onboarding wizard", targetId: "t2", source: "ci", ref: "#219", author: "priya", status: "failed", score: 58, when: "2 hours ago", duration: "1m 12s" },
  { id: "s-1040", title: "Scheduled scan", targetId: "t3", source: "worker", ref: "safety-forms.lovable.app", author: "brandrail", status: "failed", score: 71, when: "yesterday", duration: "28s" },
  { id: "s-1039", title: "Generated KPI card (validate_snippet)", targetId: "t1", source: "mcp", ref: "Claude Code", author: "sam", status: "passed", score: 100, when: "yesterday", duration: "0.4s" },
  { id: "s-1038", title: "Bump tokens to v1.4.0", targetId: "t4", source: "ci", ref: "#77", author: "you", status: "passed", score: 99, when: "3 days ago", duration: "33s" },
  { id: "s-1037", title: "Local check before push", targetId: "t2", source: "cli", ref: "feat/po-table", author: "priya", status: "failed", score: 61, when: "3 days ago", duration: "6s" },
  { id: "s-1036", title: "Scheduled scan", targetId: "t5", source: "worker", ref: "intranet.acme.example", author: "brandrail", status: "passed", score: 83, when: "4 days ago", duration: "35s" },
];

export type Violation = {
  rule: string;
  severity: "error" | "warning" | "info";
  file: string;
  line: number;
  message: string;
  suggestion: string;
};

export const violationsByScan: Record<string, Violation[]> = {
  "s-1041": [
    { rule: "no-hardcoded-color", severity: "error", file: "src/vendors/Wizard.tsx", line: 42, message: "Hard-coded colour #3b82f6", suggestion: "Use var(--color-accent-default) (ΔE 1.8 from #0969da)" },
    { rule: "no-hardcoded-color", severity: "error", file: "src/vendors/Wizard.tsx", line: 87, message: "Tailwind arbitrary value bg-[#16a34a]", suggestion: "Use bg-success-emphasis" },
    { rule: "prefer-official-component", severity: "error", file: "src/vendors/StepFooter.tsx", line: 12, message: "Raw <button> re-implements Button", suggestion: "import { Button } from \"@acme/ui\"" },
    { rule: "spacing-scale", severity: "warning", file: "src/vendors/StepFooter.tsx", line: 19, message: "padding: 13px is off the spacing scale", suggestion: "Use space.3 (16px) or space.2 (8px)" },
    { rule: "font-family", severity: "warning", file: "src/styles/vendor.css", line: 4, message: "font-family: Inter is not in the Brand Kit", suggestion: "Use var(--font-family-sans)" },
    { rule: "contrast-aa", severity: "error", file: "src/vendors/Badge.tsx", line: 8, message: "Contrast 3.1:1 on #9ca3af text", suggestion: "Use fg.muted (#59636e, 6.2:1)" },
    { rule: "radius-scale", severity: "info", file: "src/vendors/Card.tsx", line: 15, message: "border-radius: 10px", suggestion: "Use radius.md (6px) or radius.lg (12px)" },
  ],
};

export const topRules = [
  { rule: "no-hardcoded-color", count: 128, label: "Hard-coded colours" },
  { rule: "prefer-official-component", count: 64, label: "Re-invented components" },
  { rule: "spacing-scale", count: 51, label: "Off-scale spacing" },
  { rule: "contrast-aa", count: 22, label: "Contrast failures" },
  { rule: "font-family", count: 9, label: "Unapproved fonts" },
];

export const activity = [
  { who: "jordan", what: "passed a check on", target: "fleet-portal", detail: "score 94", when: "12m" },
  { who: "priya", what: "failed a check on", target: "procurement-ui", detail: "41 violations", when: "2h" },
  { who: "sam", what: "generated on-brand UI with", target: "Claude Code", detail: "via MCP", when: "1d" },
  { who: "you", what: "published Brand Kit", target: "v1.4.0", detail: "3 tokens changed", when: "3d" },
];

export const registryComponents = [
  { name: "Button", importPath: "@brandrail/ui", status: "stable", rules: ["One primary per view", "Use danger only for destructive actions"], usage: 412 },
  { name: "TextInput", importPath: "@brandrail/ui", status: "stable", rules: ["Always inside FormControl"], usage: 268 },
  { name: "FormControl", importPath: "@brandrail/ui", status: "stable", rules: ["Every input has a visible label"], usage: 251 },
  { name: "Box", importPath: "@brandrail/ui", status: "stable", rules: ["Use for bordered containers, not shadows"], usage: 190 },
  { name: "Label", importPath: "@brandrail/ui", status: "stable", rules: ["Tone matches meaning"], usage: 133 },
  { name: "Flash", importPath: "@brandrail/ui", status: "stable", rules: ["One per form", "danger for errors only"], usage: 74 },
  { name: "Avatar", importPath: "@brandrail/ui", status: "beta", rules: [], usage: 61 },
  { name: "ProgressBar", importPath: "@brandrail/ui", status: "beta", rules: [], usage: 22 },
  { name: "DataTable", importPath: "@brandrail/ui", status: "draft", rules: ["Coming from the UI kit"], usage: 0 },
  { name: "Chart", importPath: "@brandrail/ui", status: "draft", rules: ["Coming from the UI kit"], usage: 0 },
];

export const orgScore = { current: 82, previous: 74, trend: [61, 64, 66, 70, 72, 74, 79, 82] };
