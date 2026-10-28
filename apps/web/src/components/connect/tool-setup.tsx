"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "@primer/octicons-react";
import { Box, BoxHeader, Button, Label, cn } from "@brandrail/ui";

type Tool = { id: string; name: string; blurb: string; file: string; snippet: (url: string, slug: string) => string; connected?: boolean };

const tools: Tool[] = [
  {
    id: "claude-code",
    name: "Claude Code",
    blurb: "Add the MCP server with one command.",
    file: "Terminal",
    snippet: (url) => `claude mcp add --transport http brandrail ${url} \\\n  --header "Authorization: Bearer $BRANDRAIL_KEY"`,
    connected: true,
  },
  {
    id: "cursor",
    name: "Cursor",
    blurb: "Add to your project's MCP config and rules.",
    file: ".cursor/mcp.json",
    snippet: (url) => `{\n  "mcpServers": {\n    "brandrail": {\n      "url": "${url}",\n      "headers": { "Authorization": "Bearer \${env:BRANDRAIL_KEY}" }\n    }\n  }\n}`,
  },
  {
    id: "copilot",
    name: "GitHub Copilot",
    blurb: "VS Code agent mode reads the MCP server from workspace settings.",
    file: ".vscode/mcp.json",
    snippet: (url) => `{\n  "servers": {\n    "brandrail": {\n      "type": "http",\n      "url": "${url}",\n      "headers": { "Authorization": "Bearer \${input:brandrailKey}" }\n    }\n  }\n}`,
  },
  {
    id: "lovable",
    name: "Lovable",
    blurb: "Paste into Project knowledge, or add Brandrail as a custom MCP connector.",
    file: "Project knowledge",
    snippet: (_url, slug) => `Always build UI with the ${slug} design system.\n- Import components from "@${slug}/ui" only.\n- Colours, spacing, radius and fonts come from CSS variables in tokens.css.\n- Never hard-code hex colours or pixel sizes.\n- Before finishing, call brandrail.validate_snippet and fix every violation.`,
  },
  {
    id: "cli",
    name: "Any tool (rule files)",
    blurb: "Writes CLAUDE.md, .cursor/rules, copilot-instructions and AGENTS.md from your Brand Kit.",
    file: "Terminal",
    snippet: (_url, slug) => `npx brandrail init --org ${slug}`,
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
        <h2 className="text-sm font-semibold text-fg">Connect an AI tool</h2>
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
                {t.connected && <span className="h-2 w-2 rounded-full bg-success-emphasis" aria-label="Connected" />}
              </button>
            </li>
          ))}
        </ul>
        <div className="flex min-w-0 flex-col gap-3 p-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-fg">{tool.name}</h3>
            {tool.connected && <Label tone="success">Connected · 214 calls this week</Label>}
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
