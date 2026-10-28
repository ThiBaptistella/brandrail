import type { Metadata } from "next";
import { Server, Terminal, Workflow } from "lucide-react";
import { Box, BoxHeader, BoxRow, Label } from "@brandrail/ui";
import { ApiKeys } from "@/components/connect/api-keys";
import { ToolSetup } from "@/components/connect/tool-setup";
import { PageHeader } from "@/components/dashboard/page-header";
import { ACTION_REF, CLI, CLI_NOT_PUBLISHED } from "@/lib/cli";
import { listApiKeys, timeAgo } from "@/lib/data";
import { requireOrg } from "@/lib/session";

export const metadata: Metadata = { title: "Connect" };

const mcpTools = [
  { name: "get_design_tokens", desc: "Semantic tokens with values and when to use them" },
  { name: "find_component", desc: "Best component for an intent, with import and example" },
  { name: "get_component_docs", desc: "Props, usage rules, do and don't" },
  { name: "validate_snippet", desc: "Runs the Checker on generated code and returns fixes" },
];

const actionYaml = (apiUrl: string) => `name: Brandrail
on: [pull_request]
permissions:
  contents: read
  pull-requests: write
jobs:
  brand-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ${ACTION_REF}
        with:
          api-key: \${{ secrets.BRANDRAIL_KEY }}
          api-url: ${apiUrl}
          fail-below: 80          # remove for advisory mode
          # upload-snippets: false (default) — code stays in your runner`;

const cliSteps = (apiUrl: string) => `export BRANDRAIL_KEY=br_live_…        # from API keys
export BRANDRAIL_API_URL=${apiUrl}

${CLI} init --from-api   # brandrail.config.json + CLAUDE.md, AGENTS.md, Cursor & Copilot rules
${CLI} check             # violations + brand score
${CLI} check --changed --upload --fail-below 80`;

export default async function ConnectPage() {
  const { org } = await requireOrg();
  const { rows } = await listApiKeys(org);
  const apiUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const mcpUrl = `${apiUrl.replace(/\/$/, "")}/api/mcp`;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Connect" description="Put the Guardrail inside every AI tool and the Checker inside every pipeline." />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px] 2xl:grid-cols-[1fr_400px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Box id="github-action">
            <BoxHeader>
              <Workflow size={15} className="text-fg-subtle" />
              <h2 className="text-[13px] font-medium text-fg">GitHub Action</h2>
              <Label tone="success" className="ml-auto">Ready</Label>
            </BoxHeader>
            <div className="flex flex-col gap-3 p-4">
              <p className="text-[13px] text-fg-muted">
                Add the API key as the repo secret <code className="font-mono text-fg">BRANDRAIL_KEY</code>, then this file as{" "}
                <code className="font-mono text-fg">.github/workflows/brandrail.yml</code>. Every PR gets inline annotations, a score and one
                updating comment with fixes; only changed lines are judged.
              </p>
              <pre className="overflow-x-auto rounded-md border border-line bg-canvas-inset p-3 font-mono text-xs leading-5 text-fg">{actionYaml(apiUrl)}</pre>
            </div>
          </Box>

          <Box>
            <BoxHeader>
              <Terminal size={15} className="text-fg-subtle" />
              <h2 className="text-[13px] font-medium text-fg">CLI</h2>
              <Label tone="success" className="ml-auto">Ready</Label>
            </BoxHeader>
            <div className="flex flex-col gap-3 p-4">
              <pre className="overflow-x-auto rounded-md border border-line bg-canvas-inset p-3 font-mono text-xs leading-5 text-fg">{cliSteps(apiUrl)}</pre>
              {CLI_NOT_PUBLISHED && (
                <p className="text-xs text-fg-subtle">
                  Not on npm yet — until then run <code className="font-mono">node packages/cli/dist/brandrail.mjs</code> from the Brandrail repo.
                </p>
              )}
            </div>
          </Box>

          <ToolSetup mcpUrl={mcpUrl} slug={org.slug} />
        </div>

        <aside className="flex flex-col gap-6">
          <ApiKeys rows={rows.map((k) => ({ id: k.id, name: k.name, prefix: k.prefix, scopes: k.scopes, lastUsed: timeAgo(k.lastUsedAt), created: timeAgo(k.createdAt) }))} />

          <Box>
            <BoxHeader>
              <Server size={15} className="text-fg-subtle" />
              <h2 className="text-[13px] font-medium text-fg">MCP server</h2>
              <Label tone="attention" className="ml-auto">Next build</Label>
            </BoxHeader>
            <BoxRow>
              <div className="text-xs text-fg-subtle">Endpoint</div>
              <code className="mt-1 block truncate font-mono text-xs text-fg">{mcpUrl}</code>
            </BoxRow>
            <BoxRow>
              <div className="mb-2 text-xs text-fg-subtle">Tools (same rules engine as the CLI)</div>
              <ul className="flex flex-col gap-2">
                {mcpTools.map((t) => (
                  <li key={t.name}>
                    <code className="font-mono text-xs text-fg">{t.name}</code>
                    <div className="text-xs text-fg-muted">{t.desc}</div>
                  </li>
                ))}
              </ul>
            </BoxRow>
          </Box>
        </aside>
      </div>
    </div>
  );
}
