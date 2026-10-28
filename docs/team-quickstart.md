# Team quick-start: your design system in every AI tool

About 30 minutes. You end with a published Brand Kit, a component registry, and Claude Code / Cursor /
Copilot / Codex building with your tokens and components, plus a check on every pull request.

## 1. Organisation (2 min)

1. Sign in at the Brandrail site → **New organisation** (header switcher) → your company or product name.
2. **Settings → Members**: invite teammates by email (admin, member or viewer), then **Copy sign-up link**
   and send it to them. The invitation appears when they sign in with that email.

## 2. Brand Kit (10 min)

**Brand Kit → Import**, pick one:

- **Figma file**: file link + a personal access token (Figma → Settings → Security, "File content: read").
  Variables come through with modes (a *Dark* mode becomes the dark value). Without an Enterprise plan,
  colour and text styles are read instead.
- **JSON file**: DTCG, Tokens Studio, or a Figma variables export.

Review the diff (Replace for the first import), check the preview in light and dark, fix names in
**Colours**, **Typography**, **Spacing & radius**, then **Publish**. Every AI tool and check uses the
latest published version.

Tip: give each colour a one-line "when to use it" note. AI tools read those.

## 3. Components (5 min)

**Components**: add the components your codebase already has (name, import path, which HTML element it
replaces, other names people use, usage rules, a short example). That is what `find_component` returns
and what the Checker suggests instead of raw `<button>`, `<select>`, `<input type=checkbox>`.

## 4. Connect your AI tool (5 min per person)

1. **Connect → API keys → Create key** (one per person; shown once).
2. In the repo:

   ```bash
   export BRANDRAIL_KEY=br_live_…
   npx brandrail init --from-api --mcp
   ```

   This writes `brandrail.config.json`, `AGENTS.md` (Codex), `CLAUDE.md`, `.cursor/rules/brandrail.mdc`,
   `.github/copilot-instructions.md` and the MCP config for Claude Code, Cursor and VS Code.
   Commit the rule files so the whole team gets them.

   Claude Code only, without the CLI:

   ```bash
   claude mcp add --transport http brandrail https://web-phi-nine-77.vercel.app/api/mcp \
     --header "Authorization: Bearer $BRANDRAIL_KEY"
   ```

3. Ask the AI tool for a screen. It calls `get_guidelines`, `find_component`, `get_design_tokens`, and
   `validate_snippet` before it finishes. Those calls show up in **Checks** as "AI tool" scans.

## 5. Check every pull request (5 min)

Add `BRANDRAIL_KEY` as a repo secret and the workflow from **Connect → GitHub Action**. Each PR gets a
brand score, inline annotations and one comment with fixes; only changed lines are judged.

Locally: `npx brandrail check --changed`. Running app: `npx brandrail scan http://localhost:3000 --pages 3`.

## Data and privacy

| What | Leaves your machine? |
| --- | --- |
| `brandrail check` / `scan` | No, unless you add `--upload` (then scores and messages, never code) |
| MCP `get_*` / `find_component` | No code is sent; the tool reads your Brand Kit |
| MCP `validate_snippet` | The snippet is sent for checking and **not stored**; only the result is |
| Brand Kit, component registry | Stored in the Brandrail database |

If your company needs approval for third-party tools, share this table, or use the CLI only.
