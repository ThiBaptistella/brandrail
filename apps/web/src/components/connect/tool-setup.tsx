"use client";

import { useState } from "react";
import { Check as CheckIcon, Copy as CopyIcon } from "lucide-react";
import { mcpClientConfigs } from "@brandrail/engine";
import { Box, BoxHeader, Button, cn } from "@brandrail/ui";

type Tool = { id: string; name: string; blurb: string; file: string; snippet: (url: string, slug: string) => string };

const byId = (url: string, id: string) => mcpClientConfigs(url).find((c) => c.id === id)!;

const tools: Tool[] = [
  {
    id: "claude-code",
    name: "Claude Code",
    blurb: "Add the MCP server with one command (or commit .mcp.json — `brandrail init --mcp` writes it). Rules go in CLAUDE.md.",
    file: "Terminal",
    snippet: (url) => byId(url, "claude-code").command!,
  },
  {
    id: "codex",
    name: "Codex",
    blurb: "Codex reads AGENTS.md for the rules (written by `brandrail init`). Add the MCP server with one command, or in ~/.codex/config.toml:",
    file: "~/.codex/config.toml",
    snippet: (url) => `# ${byId(url, "codex").command}\n\n${byId(url, "codex").content}`,
  },
  {
    id: "cursor",
    name: "Cursor",
    blurb: "Project MCP config. Rules go in .cursor/rules/brandrail.mdc.",
    file: ".cursor/mcp.json",
    snippet: (url) => byId(url, "cursor").content,
  },
  {
    id: "copilot",
    name: "GitHub Copilot",
    blurb: "VS Code agent mode asks for the key once and stores it securely. Rules go in .github/copilot-instructions.md.",
    file: ".vscode/mcp.json",
    snippet: (url) => byId(url, "vscode").content,
  },
  {
    id: "windsurf",
    name: "Windsurf",
    blurb: "Global MCP config. Rules go in .windsurf/rules/brandrail.md.",
    file: "~/.codeium/windsurf/mcp_config.json",
    snippet: (url) => byId(url, "windsurf").content,
  },
  {
    id: "lovable",
    name: "Lovable",
    blurb: "Add Brandrail as a custom MCP connector (URL + Bearer key), and paste this into Project knowledge.",
    file: "Project knowledge",
    snippet: (_url, slug) =>
      `Always build UI with the ${slug} design system via the Brandrail MCP server.\n- Before writing UI call get_guidelines, then find_component for every element.\n- Use CSS variables from get_design_tokens; never hard-code hex colours or pixel sizes.\n- Before finishing, call validate_snippet and fix every violation.`,
  },
  {
    id: "cli",
    name: "All rule files",
    blurb: "Writes AGENTS.md (Codex), CLAUDE.md, Cursor, Copilot, Windsurf and Gemini rules from your published Brand Kit. --mcp also adds the MCP server to project configs.",
    file: "Terminal",
    snippet: () => `npx brandrail init --from-api --mcp`,
  },
];

export function ToolSetup({ mcpUrl, slug }: { mcpUrl: string; slug: string }) {
  const [active, setActive] = useState(tools[0]!.id);
  const [copied, setCopied] = useState(false);
  const tool = tools.find((t) => t.id === active)!;
  const text = tool.snippet(mcpUrl, slug);

  return (
    <Box>
      <BoxHeader>
        <h2 className="text-[13px] font-medium text-fg">Connect an AI tool</h2>
        <span className="ml-auto text-xs text-fg-subtle">MCP server + rule files</span>
      </BoxHeader>
      <div className="grid md:grid-cols-[220px_1fr]">
        <ul className="flex gap-1 overflow-x-auto border-b border-line p-2 md:flex-col md:border-r md:border-b-0">
          {tools.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => setActive(t.id)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm whitespace-nowrap text-fg hover:bg-btn-hover",
                  active === t.id && "bg-btn-hover font-semibold",
                )}
              >
                {t.name}
              </button>
            </li>
          ))}
        </ul>
        <div className="flex min-w-0 flex-col gap-3 p-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-fg">{tool.name}</h3>
          </div>
          <p className="text-sm text-fg-muted">{tool.blurb}</p>
          <div className="overflow-hidden rounded-md border border-line">
            <div className="flex items-center justify-between border-b border-line bg-canvas-subtle px-3 py-1.5">
              <span className="font-mono text-xs text-fg-muted">{tool.file}</span>
              <Button
                size="sm"
                variant="invisible"
                aria-label="Copy snippet"
                onClick={async () => {
                  await navigator.clipboard.writeText(text);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
              >
                {copied ? <CheckIcon size={14} className="text-success" /> : <CopyIcon size={14} />}
              </Button>
            </div>
            <pre className="overflow-x-auto p-3 font-mono text-xs leading-5 text-fg">{text}</pre>
          </div>
        </div>
      </div>
    </Box>
  );
}
