import { resolveConfig } from "./config.ts";
import { RULES } from "./rules.ts";
import type { BrandrailConfig } from "./types.ts";

export const RULES_START = "<!-- brandrail:start -->";
export const RULES_END = "<!-- brandrail:end -->";

/**
 * Markdown instructions for AI coding tools (CLAUDE.md, AGENTS.md, Cursor rules, Copilot instructions).
 * Generated from the Brand Kit so every tool gets the same, current rules.
 */
export function generateInstructions(config: BrandrailConfig, opts: { org?: string } = {}): string {
  const r = resolveConfig(config);
  const lines: string[] = [];
  lines.push(`# Design system rules${opts.org ? ` — ${opts.org}` : ""}`);
  lines.push("");
  lines.push(
    `All UI in this repo must follow the Brand Kit${r.tokenVersion ? ` (v${r.tokenVersion})` : ""}. These rules are checked on every pull request by Brandrail.`,
  );
  lines.push("");
  if (r.components.length) {
    lines.push("## Components");
    lines.push("Always use these components. Never re-create them with raw HTML elements:");
    for (const c of r.components) {
      const tags = [...r.replaces].filter(([, v]) => v === c).map(([t]) => `<${t}>`);
      lines.push(`- \`${c.name}\` from \`${c.importPath}\`${tags.length ? ` (instead of ${tags.join(", ")})` : ""}`);
    }
    lines.push("");
  }
  if (r.colors.length) {
    lines.push("## Colours");
    lines.push("Use CSS variables only. Never write hex, rgb() or hsl() values, and never use Tailwind palette classes like `bg-blue-500`.");
    for (const c of r.colors) {
      if (c.mode) continue;
      const dark = r.colors.find((d) => d.mode === "dark" && d.path === c.path);
      lines.push(`- \`var(${c.cssVar})\` — ${c.path} (${c.hex}${dark ? `, dark ${dark.hex}` : ""})`);
    }
    lines.push("");
  }
  lines.push("## Spacing, radius and type");
  lines.push(`- Spacing (padding, margin, gap) must be one of: ${r.spacing.filter((s) => s > 2).map((s) => `${s}px`).join(", ")}.`);
  lines.push(`- Corner radius must be one of: ${r.radii.filter((x) => x > 0 && x < 999).map((x) => `${x}px`).join(", ")} (or fully rounded).`);
  if (r.fonts.length) lines.push(`- Fonts: use ${r.fontVars.map((v) => `\`var(${v})\``).join(" or ")}; never set another font-family.`);
  lines.push("");
  lines.push("## Before you finish");
  lines.push("- If the Brandrail MCP server is connected, call `validate_snippet` on the UI you wrote and fix every violation.");
  lines.push("- Otherwise run `npx brandrail check` and fix errors before committing.");
  lines.push("");
  lines.push("<details><summary>Checked rules</summary>");
  lines.push("");
  for (const rule of RULES) {
    if (r.rules[rule.id] === "off") continue;
    lines.push(`- **${rule.title}** (\`${rule.id}\`): ${rule.description}`);
  }
  lines.push("");
  lines.push("</details>");
  return lines.join("\n");
}

/** Insert or replace the Brandrail section inside an existing file's content. */
export function upsertSection(existing: string, section: string): string {
  const block = `${RULES_START}\n${section}\n${RULES_END}`;
  const start = existing.indexOf(RULES_START);
  const end = existing.indexOf(RULES_END);
  if (start !== -1 && end > start) return existing.slice(0, start) + block + existing.slice(end + RULES_END.length);
  return existing.trim() ? `${existing.trimEnd()}\n\n${block}\n` : `${block}\n`;
}
