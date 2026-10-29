# brandrail

Keep AI-generated UI on-brand. `brandrail` checks code and live pages against your design system
(Brand Kit), and writes your rules into the files AI coding tools read.

```bash
npx brandrail init            # brandrail.config.json, src/brandrail.tokens.css + AGENTS.md, CLAUDE.md, Cursor/Copilot/Windsurf/Gemini rules
npx brandrail check           # violations + brand score for this repo
npx brandrail scan <url>      # check a running page in a real browser
```

## With a Brandrail account

```bash
export BRANDRAIL_KEY=br_live_…            # Dashboard → Connect → API keys
npx brandrail init --from-api --mcp       # pull your published Brand Kit, add the MCP server to your AI tools
npx brandrail check --changed --upload    # only changed lines, results in the dashboard
```

## Commands

| Command | |
| --- | --- |
| `check [paths]` | `--format pretty\|json\|markdown\|github`, `--fail-below 80`, `--changed [base]`, `--upload` |
| `scan <url>` | `--pages 3`, `--storage-state auth.json` (pages behind a login), `--wait 2000`, `--upload`. Needs `npm i -D playwright && npx playwright install chromium` |
| `init` | `--from-api`, `--mcp`, `--tokens-css <file>`, `--no-rules`, `--force`. Writes the Brand Kit as CSS variables; import that file once at your app entry |
| `import <tokens.json>` | DTCG, Tokens Studio or Figma variables JSON into the config. `--replace`, `--primitives` |
| `rules` | List the rules |

Nothing is uploaded unless you pass `--upload`, and code snippets are never uploaded.
