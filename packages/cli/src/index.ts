import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import {
  check,
  ENGINE_VERSION,
  formatGithubAnnotations,
  formatMarkdown,
  formatPretty,
  generateInstructions,
  resolveConfig,
  RULES,
  starterConfig,
  upsertSection,
  type BrandrailConfig,
} from "@brandrail/engine";
import { apiBase, fetchBrandKit, uploadReport } from "./api.ts";
import { collectFiles, CONFIG_FILE, findConfig, readConfig } from "./files.ts";
import { changedLines, repoInfo } from "./git.ts";

const HELP = `brandrail ${ENGINE_VERSION} — check that UI follows your design system

Usage
  brandrail check [paths...]   Scan files and print violations
  brandrail init               Create brandrail.config.json and AI rule files
  brandrail rules              List the rules

Options for check
  --config <file>        Config file (default: nearest brandrail.config.json)
  --format <fmt>         pretty | json | markdown | github   (default: pretty)
  --fail-below <score>   Exit 1 when the brand score is lower (default: off)
  --changed [base]       Only report lines changed vs base branch (default: origin/main)
  --upload               Send the result to Brandrail (needs BRANDRAIL_KEY)
  --no-color             Plain output

Options for init
  --from-api             Pull the published Brand Kit (needs BRANDRAIL_KEY)
  --no-rules             Don't write CLAUDE.md / AGENTS.md / Cursor / Copilot files
  --force                Overwrite an existing brandrail.config.json

Environment
  BRANDRAIL_KEY          API key from Dashboard → Connect
  BRANDRAIL_API_URL      Brandrail URL (default ${apiBase()})
`;

type Flags = Record<string, string | boolean>;

function parseArgs(argv: string[]): { cmd: string; positional: string[]; flags: Flags } {
  const [cmd = "help", ...rest] = argv;
  const positional: string[] = [];
  const flags: Flags = {};
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i]!;
    if (a.startsWith("--no-")) flags[a.slice(5)] = false;
    else if (a.startsWith("--")) {
      const [k, v] = a.slice(2).split("=", 2) as [string, string | undefined];
      const next = rest[i + 1];
      if (v !== undefined) flags[k] = v;
      else if (next !== undefined && !next.startsWith("-") && ["config", "format", "fail-below", "changed"].includes(k)) {
        flags[k] = next;
        i++;
      } else flags[k] = true;
    } else positional.push(a);
  }
  return { cmd, positional, flags };
}

const log = (s = "") => process.stderr.write(`${s}\n`);

async function loadConfig(cwd: string, flags: Flags): Promise<{ config: BrandrailConfig; source: string }> {
  const explicit = typeof flags.config === "string" ? resolve(cwd, flags.config) : null;
  const path = explicit ?? findConfig(cwd);
  if (path) return { config: readConfig(path), source: relative(cwd, path) || CONFIG_FILE };
  const key = process.env.BRANDRAIL_KEY;
  if (key) {
    const { config } = await fetchBrandKit(key);
    return { config, source: `${apiBase()} (published Brand Kit)` };
  }
  throw new Error(`No ${CONFIG_FILE} found. Run \`npx brandrail init\` first, or set BRANDRAIL_KEY to use your published Brand Kit.`);
}

async function cmdCheck(cwd: string, positional: string[], flags: Flags): Promise<number> {
  const { config, source } = await loadConfig(cwd, flags);
  const resolved = resolveConfig(config);
  const root = dirname(typeof flags.config === "string" ? resolve(cwd, flags.config) : findConfig(cwd) ?? join(cwd, CONFIG_FILE));
  const files = collectFiles(root, positional.map((p) => relative(root, resolve(cwd, p))), resolved.ignore);

  let onlyLines: Map<string, Set<number>> | undefined;
  if (flags.changed) {
    const base = typeof flags.changed === "string" ? flags.changed : "origin/main";
    onlyLines = changedLines(root, base) ?? undefined;
    if (!onlyLines) log(`warning: couldn't read git diff against ${base}; checking everything`);
  }

  const report = check(files, resolved, { onlyLines });
  const format = typeof flags.format === "string" ? flags.format : "pretty";
  const threshold = flags["fail-below"] !== undefined ? Number(flags["fail-below"]) : undefined;

  if (format === "json") process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  else if (format === "markdown") process.stdout.write(`${formatMarkdown(report, { threshold })}\n`);
  else if (format === "github") process.stdout.write(`${formatGithubAnnotations(report)}\n`);
  else {
    const color = flags.color !== false && process.stdout.isTTY !== false && !process.env.NO_COLOR;
    const kit = `Brand Kit: ${source}${config.tokenVersion ? ` v${config.tokenVersion}` : ""}`;
    log(color ? `\x1b[2m${kit}\x1b[0m` : kit);
    process.stdout.write(`${formatPretty(report, { color })}\n`);
  }

  if (flags.upload) {
    const key = process.env.BRANDRAIL_KEY;
    if (!key) log("warning: --upload needs BRANDRAIL_KEY; skipped");
    else {
      const repo = repoInfo(root);
      const res = await uploadReport(key, {
        source: process.env.CI ? "ci" : "cli",
        target: { kind: "repo", name: repo.slug.split("/").pop() ?? repo.slug, location: repo.slug },
        ref: repo.branch ?? repo.sha?.slice(0, 7),
        title: flags.changed ? `Changed lines on ${repo.branch ?? "HEAD"}` : `Local check on ${repo.branch ?? "HEAD"}`,
        threshold,
        report,
      });
      log(`Uploaded → ${res.url ?? res.scanId}`);
    }
  }

  if (threshold !== undefined && report.score < threshold) {
    log(`\nBrand score ${report.score} is below ${threshold}.`);
    return 1;
  }
  return 0;
}

function writeRuleFiles(root: string, config: BrandrailConfig, org?: string): string[] {
  const md = generateInstructions(config, { org });
  const written: string[] = [];
  const upsert = (rel: string, wrap = (s: string) => s) => {
    const abs = join(root, rel);
    mkdirSync(dirname(abs), { recursive: true });
    const before = existsSync(abs) ? readFileSync(abs, "utf8") : "";
    writeFileSync(abs, upsertSection(before, wrap(md)));
    written.push(rel);
  };
  upsert("CLAUDE.md");
  upsert("AGENTS.md");
  upsert(".github/copilot-instructions.md");
  // Cursor .mdc needs front-matter at the very top, so it's written whole.
  const cursor = join(root, ".cursor/rules/brandrail.mdc");
  mkdirSync(dirname(cursor), { recursive: true });
  writeFileSync(cursor, `---\ndescription: Design system rules from Brandrail\nglobs: ["**/*.{tsx,jsx,vue,svelte,html,css,scss}"]\nalwaysApply: true\n---\n\n${md}\n`);
  written.push(".cursor/rules/brandrail.mdc");
  return written;
}

async function cmdInit(cwd: string, flags: Flags): Promise<number> {
  const target = join(cwd, CONFIG_FILE);
  let config: BrandrailConfig = starterConfig;
  let org: string | undefined;
  if (flags["from-api"]) {
    const key = process.env.BRANDRAIL_KEY;
    if (!key) throw new Error("--from-api needs BRANDRAIL_KEY (Dashboard → Connect → API keys).");
    const res = await fetchBrandKit(key);
    config = { $schema: starterConfig.$schema, ...res.config };
    org = res.org;
  }
  if (existsSync(target) && !flags.force && !flags["from-api"]) {
    log(`${CONFIG_FILE} already exists (use --force to overwrite). Updating rule files from it.`);
    config = readConfig(target);
  } else {
    writeFileSync(target, `${JSON.stringify(config, null, 2)}\n`);
    log(`✔ wrote ${CONFIG_FILE}${org ? ` from ${org}'s Brand Kit` : " (starter tokens — edit them or use --from-api)"}`);
  }
  if (flags.rules !== false) for (const f of writeRuleFiles(cwd, config, org)) log(`✔ updated ${f}`);
  log("\nNext: npx brandrail check");
  return 0;
}

function cmdRules(): number {
  for (const r of RULES) process.stdout.write(`${r.id.padEnd(28)} ${r.defaultSeverity.padEnd(8)} ${r.description}\n`);
  return 0;
}

export async function main(argv = process.argv.slice(2)): Promise<number> {
  const { cmd, positional, flags } = parseArgs(argv);
  const cwd = process.cwd();
  if (flags.version || cmd === "--version" || cmd === "-v") {
    process.stdout.write(`${ENGINE_VERSION}\n`);
    return 0;
  }
  switch (cmd) {
    case "check":
      return cmdCheck(cwd, positional, flags);
    case "init":
      return cmdInit(cwd, flags);
    case "rules":
      return cmdRules();
    default:
      process.stdout.write(HELP);
      return cmd === "help" || cmd === "--help" || cmd === "-h" ? 0 : 1;
  }
}

main().then(
  (code) => process.exit(code),
  (err: Error) => {
    log(`brandrail: ${err.message}`);
    process.exit(2);
  },
);
