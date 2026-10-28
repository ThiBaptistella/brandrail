/** MCP client configuration for each AI tool, shared by `brandrail init --mcp` and the dashboard. */

export interface McpClientConfig {
  id: "claude-code" | "cursor" | "vscode" | "codex" | "windsurf";
  name: string;
  /** Where the file goes (project-relative unless it starts with ~). */
  file: string;
  /** Can `brandrail init --mcp` write it into the project? */
  projectFile: boolean;
  content: string;
  /** One-line alternative (CLI command), when the tool has one. */
  command?: string;
}

const json = (o: unknown) => `${JSON.stringify(o, null, 2)}\n`;

export function mcpClientConfigs(url: string): McpClientConfig[] {
  return [
    {
      id: "claude-code",
      name: "Claude Code",
      file: ".mcp.json",
      projectFile: true,
      content: json({ mcpServers: { brandrail: { type: "http", url, headers: { Authorization: "Bearer ${BRANDRAIL_KEY}" } } } }),
      command: `claude mcp add --transport http brandrail ${url} --header "Authorization: Bearer $BRANDRAIL_KEY"`,
    },
    {
      id: "codex",
      name: "Codex",
      file: "~/.codex/config.toml",
      projectFile: false,
      content: `[mcp_servers.brandrail]\nurl = "${url}"\nbearer_token_env_var = "BRANDRAIL_KEY"\n`,
      command: `codex mcp add brandrail --url ${url} --bearer-token-env-var BRANDRAIL_KEY`,
    },
    {
      id: "cursor",
      name: "Cursor",
      file: ".cursor/mcp.json",
      projectFile: true,
      content: json({ mcpServers: { brandrail: { url, headers: { Authorization: "Bearer ${env:BRANDRAIL_KEY}" } } } }),
    },
    {
      id: "vscode",
      name: "GitHub Copilot (VS Code)",
      file: ".vscode/mcp.json",
      projectFile: true,
      content: json({
        inputs: [{ type: "promptString", id: "brandrail-key", description: "Brandrail API key", password: true }],
        servers: { brandrail: { type: "http", url, headers: { Authorization: "Bearer ${input:brandrail-key}" } } },
      }),
    },
    {
      id: "windsurf",
      name: "Windsurf",
      file: "~/.codeium/windsurf/mcp_config.json",
      projectFile: false,
      content: json({ mcpServers: { brandrail: { serverUrl: url, headers: { Authorization: "Bearer ${env:BRANDRAIL_KEY}" } } } }),
    },
  ];
}

/** Rule files `brandrail init` writes, and which tools read them. */
export const RULE_FILES: Array<{ file: string; readBy: string }> = [
  { file: "AGENTS.md", readBy: "Codex, Jules, Amp, Cursor and other agents" },
  { file: "CLAUDE.md", readBy: "Claude Code" },
  { file: ".cursor/rules/brandrail.mdc", readBy: "Cursor" },
  { file: ".github/copilot-instructions.md", readBy: "GitHub Copilot" },
  { file: ".windsurf/rules/brandrail.md", readBy: "Windsurf" },
  { file: "GEMINI.md", readBy: "Gemini CLI" },
];
