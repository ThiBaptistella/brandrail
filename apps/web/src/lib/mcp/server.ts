import "server-only";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  checkSnippet,
  ENGINE_VERSION,
  findComponentByName,
  findComponents,
  generateInstructions,
  resolveConfig,
  type BrandrailConfig,
  type ComponentEntry,
  type Report,
} from "@brandrail/engine";

export interface McpContext {
  org: string;
  config: BrandrailConfig;
  /** False when the org hasn't published a Brand Kit and starter tokens are in use. */
  published: boolean;
  /** Stores a validate_snippet result as an "AI tool" scan. Best effort. */
  record?: (report: Report, meta: { filename: string; project?: string }) => Promise<void>;
}

type Leaf = { path: string; type?: string; value: unknown; description?: string; dark?: unknown };
function leaves(doc: unknown, prefix = "", out: Leaf[] = []): Leaf[] {
  if (!doc || typeof doc !== "object") return out;
  const o = doc as Record<string, unknown>;
  if ("$value" in o) {
    const ext = (o.$extensions as Record<string, { modes?: { dark?: unknown } }> | undefined)?.["dev.brandrail"];
    out.push({ path: prefix, type: o.$type as string | undefined, value: o.$value, description: o.$description as string | undefined, dark: ext?.modes?.dark });
    return out;
  }
  for (const [k, v] of Object.entries(o)) if (!k.startsWith("$")) leaves(v, prefix ? `${prefix}.${k}` : k, out);
  return out;
}

const CATEGORY: Record<string, (l: Leaf) => boolean> = {
  color: (l) => l.type === "color" || l.path.startsWith("color."),
  spacing: (l) => /^(space|spacing)\./.test(l.path),
  radius: (l) => /^(radius|radii)\./.test(l.path),
  typography: (l) => l.path.startsWith("font.") || l.type === "fontFamily",
};

const cssVar = (path: string) => `var(--${path.replace(/\./g, "-")})`;

function componentDoc(c: ComponentEntry): string {
  const lines = [`### ${c.name}${c.status && c.status !== "stable" ? ` (${c.status})` : ""}`, `\`import { ${c.name} } from "${c.importPath}";\``];
  if (c.description) lines.push("", c.description);
  if (c.replaces?.length) lines.push("", `Use instead of: ${c.replaces.map((t) => `<${t}>`).join(", ")}`);
  if (c.aliases?.length) lines.push(`Also known as: ${c.aliases.join(", ")}`);
  if (c.usageRules?.length) lines.push("", "Rules:", ...c.usageRules.map((r) => `- ${r}`));
  if (c.example) lines.push("", "Example:", "```tsx", c.example, "```");
  return lines.join("\n");
}

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] });

export function createBrandrailMcp(ctx: McpContext): McpServer {
  const server = new McpServer(
    { name: "brandrail", title: `Brandrail — ${ctx.org} design system`, version: ENGINE_VERSION },
    {
      instructions:
        `Design system for ${ctx.org}. Before writing UI: call get_guidelines once, use find_component for every UI element ` +
        `and get_design_tokens for colours/spacing. After writing UI: call validate_snippet and fix every violation before finishing.`,
    },
  );
  const resolved = resolveConfig(ctx.config);
  const kitNote = ctx.published ? "" : "\n\n_Note: this organisation hasn't published a Brand Kit yet, so starter tokens are shown._";

  server.registerTool(
    "get_guidelines",
    {
      title: "Get design system guidelines",
      description: "The organisation's design system rules for AI coding: components to use, allowed colour/spacing tokens, and what the Checker enforces. Call once before writing UI.",
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async () => text(generateInstructions(ctx.config, { org: ctx.org }) + kitNote),
  );

  server.registerTool(
    "get_design_tokens",
    {
      title: "Get design tokens",
      description: "Brand Kit tokens with the CSS variable to use for each. Never hard-code colours, spacing, radius or fonts; use these variables.",
      inputSchema: { category: z.enum(["all", "color", "spacing", "radius", "typography"]).default("all").describe("Which tokens to return") },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ category }) => {
      const all = leaves(ctx.config.tokens);
      const pick = category === "all" ? all : all.filter(CATEGORY[category]!);
      const lines = [`# ${ctx.org} design tokens${ctx.config.tokenVersion ? ` (Brand Kit v${ctx.config.tokenVersion})` : ""}`, ""];
      lines.push("| Token | Use | Value | Meaning |", "| --- | --- | --- | --- |");
      for (const l of pick) lines.push(`| ${l.path} | \`${cssVar(l.path)}\` | ${String(l.value)}${l.dark ? ` (dark ${String(l.dark)})` : ""} | ${l.description ?? ""} |`);
      if (pick.some((l) => l.dark)) lines.push("", "Colours with a dark value switch automatically: always use the variable, never the hex, so both themes work.");
      if (category === "all" || category === "spacing") lines.push("", `Allowed spacing (px): ${resolved.spacing.filter((s) => s > 2).join(", ")}`);
      if (category === "all" || category === "radius") lines.push(`Allowed radius (px): ${resolved.radii.filter((r) => r > 0 && r < 999).join(", ")}`);
      return text(lines.join("\n") + kitNote);
    },
  );

  server.registerTool(
    "find_component",
    {
      title: "Find a design system component",
      description: 'Finds the component to use for a UI need, e.g. "date picker", "primary action", "modal", "dropdown of trucks". Returns the import, rules and an example. Always use these instead of raw HTML elements or other UI libraries.',
      inputSchema: {
        intent: z.string().min(1).max(300).describe("What you need, in plain words"),
        limit: z.number().int().min(1).max(10).default(3),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ intent, limit }) => {
      const matches = findComponents(ctx.config, intent, limit);
      if (matches.length === 0) {
        const names = (ctx.config.components ?? []).map((c) => c.name);
        return text(
          names.length
            ? `No component matches "${intent}". Available components: ${names.join(", ")}. If none fits, compose from these and design tokens; don't import another UI library.`
            : `The ${ctx.org} registry has no components yet. Use design tokens (get_design_tokens) and semantic HTML.`,
        );
      }
      return text(matches.map((m) => componentDoc(m.component)).join("\n\n---\n\n"));
    },
  );

  server.registerTool(
    "get_component_docs",
    {
      title: "Get component docs",
      description: "Full docs for one component by name or alias: import, what it replaces, usage rules and example.",
      inputSchema: { name: z.string().min(1).max(80).describe('Component name, e.g. "Button" or an alias like "Modal"') },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ name }) => {
      const c = findComponentByName(ctx.config, name);
      if (!c) {
        const names = (ctx.config.components ?? []).map((x) => x.name).join(", ");
        return { ...text(`No component called "${name}". Available: ${names || "none"}.`), isError: true };
      }
      return text(componentDoc(c));
    },
  );

  server.registerTool(
    "validate_snippet",
    {
      title: "Validate UI code against the design system",
      description:
        "Runs the Brandrail Checker on UI code you wrote (TSX/JSX/Vue/Svelte/HTML/CSS). Returns a brand score and each violation with the fix. Call after writing UI and fix every error and warning before finishing.",
      inputSchema: {
        code: z.string().min(1).max(100_000).describe("The full file or snippet"),
        filename: z.string().max(200).default("snippet.tsx").describe("File name; the extension decides how it's parsed"),
        project: z.string().max(120).optional().describe("Repo or app name, e.g. fleet-portal (shown in the dashboard)"),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ code, filename, project }) => {
      const name = /\.(tsx|jsx|ts|js|vue|svelte|html|css|scss)$/i.test(filename) ? filename : `${filename}.tsx`;
      const report = checkSnippet(code, name, ctx.config);
      await ctx.record?.(report, { filename: name, project }).catch(() => undefined);
      if (report.violations.length === 0) {
        return text(`✅ Brand score ${report.score}/100 — no violations. This code follows the ${ctx.org} design system.`);
      }
      const lines = [
        `Brand score ${report.score}/100 — ${report.counts.error} errors, ${report.counts.warning} warnings, ${report.counts.info} info.`,
        "",
        ...report.violations.map((v) => `- [${v.severity}] line ${v.line}: ${v.message}${v.suggestion ? ` → ${v.suggestion}` : ""} (${v.ruleId})`),
        "",
        "Fix every error and warning, then call validate_snippet again.",
      ];
      return text(lines.join("\n") + kitNote);
    },
  );

  return server;
}
