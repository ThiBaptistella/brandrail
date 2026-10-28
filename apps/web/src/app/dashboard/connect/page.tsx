import type { Metadata } from "next";
import { KeyIcon, ServerIcon, WorkflowIcon } from "@primer/octicons-react";
import { Box, BoxHeader, BoxRow, Button, Label } from "@brandrail/ui";
import { ToolSetup } from "@/components/connect/tool-setup";
import { requireOrg } from "@/lib/session";

export const metadata: Metadata = { title: "Connect" };

const mcpTools = [
  { name: "get_design_tokens", desc: "Semantic tokens with values and when to use them" },
  { name: "find_component", desc: "Best component for an intent, with import and example" },
  { name: "get_component_docs", desc: "Props, usage rules, do and don't" },
  { name: "get_layout_patterns", desc: "Page templates: dashboard, form, table" },
  { name: "validate_snippet", desc: "Runs the Checker on generated code and returns fixes" },
];

const keys = [
  { name: "Thiago's laptop", prefix: "br_live_7f3a", scopes: "mcp:read, checks:write", used: "12 minutes ago" },
  { name: "GitHub Actions", prefix: "br_live_c91e", scopes: "checks:write", used: "2 hours ago" },
];

const actionYaml = (slug: string) => `name: Brandrail
on: [pull_request]
jobs:
  brand-check:
    runs-on: ubuntu-latest
    permissions: { contents: read, pull-requests: write }
    steps:
      - uses: actions/checkout@v4
      - uses: brandrail/check-action@v1
        with:
          org: ${slug}
          api-key: \${{ secrets.BRANDRAIL_KEY }}
          fail-below: 80          # or remove for advisory mode
          upload-snippets: false  # code stays in your CI`;

export default async function ConnectPage() {
  const { org } = await requireOrg();
  const mcpUrl = `https://mcp.brandrail.dev/${org.slug}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-line pb-4">
        <h1 className="text-2xl font-semibold text-fg">Connect</h1>
        <p className="mt-1 text-fg-muted">Put the Guardrail inside every AI tool and the Checker inside every pipeline.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex min-w-0 flex-col gap-6">
          <ToolSetup mcpUrl={mcpUrl} slug={org.slug} />

          <Box id="github-action">
            <BoxHeader>
              <WorkflowIcon size={16} className="text-fg-muted" />
              <h2 className="text-sm font-semibold text-fg">GitHub Action</h2>
              <Label tone="accent" className="ml-auto">Recommended</Label>
            </BoxHeader>
            <div className="flex flex-col gap-3 p-4">
              <p className="text-sm text-fg-muted">
                Add <code className="font-mono text-fg">.github/workflows/brandrail.yml</code>. Every pull request gets a
                brand score and a comment with fixes. Your source code never leaves your runner.
              </p>
              <pre className="overflow-x-auto rounded-md border border-line bg-canvas-subtle p-3 font-mono text-xs leading-5 text-fg">
                {actionYaml(org.slug)}
              </pre>
            </div>
          </Box>
        </div>

        <aside className="flex flex-col gap-6">
          <Box>
            <BoxHeader>
              <ServerIcon size={16} className="text-fg-muted" />
              <h2 className="text-sm font-semibold text-fg">MCP server</h2>
              <Label tone="success" className="ml-auto">Live</Label>
            </BoxHeader>
            <BoxRow>
              <div className="text-xs text-fg-muted">Endpoint</div>
              <code className="mt-1 block truncate font-mono text-xs text-fg">{mcpUrl}</code>
            </BoxRow>
            <BoxRow>
              <div className="mb-2 text-xs text-fg-muted">Tools exposed</div>
              <ul className="flex flex-col gap-2">
                {mcpTools.map((t) => (
                  <li key={t.name}>
                    <code className="font-mono text-xs font-semibold text-fg">{t.name}</code>
                    <div className="text-xs text-fg-muted">{t.desc}</div>
                  </li>
                ))}
              </ul>
            </BoxRow>
          </Box>

          <Box>
            <BoxHeader className="justify-between">
              <span className="flex items-center gap-2">
                <KeyIcon size={16} className="text-fg-muted" />
                <h2 className="text-sm font-semibold text-fg">API keys</h2>
              </span>
              <Button size="sm">Generate key</Button>
            </BoxHeader>
            {keys.map((k) => (
              <BoxRow key={k.prefix}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-fg">{k.name}</span>
                  <Button size="sm" variant="danger">Revoke</Button>
                </div>
                <code className="font-mono text-xs text-fg-muted">{k.prefix}••••••••</code>
                <div className="text-xs text-fg-muted">
                  {k.scopes} · used {k.used}
                </div>
              </BoxRow>
            ))}
          </Box>
        </aside>
      </div>
    </div>
  );
}
