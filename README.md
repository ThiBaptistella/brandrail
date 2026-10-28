# Brandrail

Your design system, enforced in every AI tool. Brand Kit + MCP Guardrail + Checker.

## Quick start

```bash
pnpm install
pnpm dev            # http://localhost:3000
```

With no Supabase keys the app runs in **demo mode**: any email/password signs you in, nothing is stored,
and the dashboard shows sample data. A yellow banner tells you when you're in demo mode.

## Supabase

Project `brandrail` (ref `cyxytcoswgwgzaonkpnf`). All migrations in `supabase/migrations/` are already applied;
the file names match the versions recorded in Supabase, so the GitHub integration won't re-run them.
`apps/web/.env.local` holds the URL and publishable key (git-ignored).

Still to do in the Supabase dashboard:
1. Auth → URL Configuration: Site URL `http://localhost:3000`, and add `http://localhost:3000/**` to Redirect URLs.
2. Auth → Providers: enable GitHub and Google if you want OAuth (each needs an OAuth app's client ID/secret).
3. For quick local testing you can turn off "Confirm email" under Auth → Providers → Email.
4. Auth → Passwords: turn on leaked password protection (flagged by the security advisor).

## Production

Live at https://web-phi-nine-77.vercel.app (Vercel project `web`, root `apps/web`, deploys on push to `main`).

- Vercel env (Production): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`. They're baked in at build time, so redeploy after changing them. Without them the app runs in demo mode.
- Supabase Auth → URL Configuration: Site URL is the Vercel URL; Redirect URLs include it with `/**` plus `http://localhost:3000/**` for local dev.
- The CLI and GitHub Action talk to the hosted URL by default. Set `BRANDRAIL_API_URL=http://localhost:3000` (or the Action's `api-url`) to use a local server.
- Changing the domain: update the three places above and `DEFAULT_API` in `packages/cli/src/api.ts`, then `pnpm build:action`.

## Checker

One rules engine (`packages/engine`) runs everywhere: CLI, GitHub Action, the web playground, and next the MCP server.

| Rule | Default | Catches |
| --- | --- | --- |
| `no-hardcoded-color` | error | hex / rgb / hsl literals and Tailwind `[#…]` values; suggests the closest token (ΔE) |
| `no-raw-palette-class` | warning | `bg-blue-500`, `hover:text-gray-700`… instead of semantic classes |
| `prefer-official-component` | error | raw `<button>`, `<input>`, `<select>`, `<textarea>` when the registry has a component |
| `forbidden-import` | error | other UI libraries (MUI, antd, Chakra, Bootstrap…) |
| `spacing-scale` | warning | padding / margin / gap off the spacing scale (CSS, style objects, `p-[13px]`) |
| `font-family` | warning | fonts that aren't in the Brand Kit |
| `radius-scale` | info | border-radius values that aren't radius tokens |
| `img-alt` | warning | `<img>` without alt text |

```bash
pnpm test                        # engine tests
pnpm build:cli                   # → packages/cli/dist/brandrail.mjs
node packages/cli/dist/brandrail.mjs init --from-api     # needs BRANDRAIL_KEY + BRANDRAIL_API_URL
node packages/cli/dist/brandrail.mjs check --changed --upload --fail-below 80
pnpm build:action                # rebuild + commit packages/github-action/dist after engine changes
```

Rules can be turned off or re-levelled per repo in `brandrail.config.json` → `"rules": { "radius-scale": "off" }`.
The GitHub Action usage is in `packages/github-action/README.md`. Its `api-url` must be a public URL (deploy the web app first).

API (API-key auth, used by CLI / Action / MCP):
- `GET /api/v1/brand-kit` → published Brand Kit as a `brandrail.config.json`
- `POST /api/v1/scans` → store a report; returns the dashboard URL
- `POST /api/mcp` → MCP server (Streamable HTTP, stateless, `Authorization: Bearer <key>`)

## Brand Kit tokens

Stored as W3C DTCG JSON in `token_set_versions.tokens`. A colour's dark-mode value lives in
`$extensions["dev.brandrail"].modes.dark`, so it keeps one name and one CSS variable; the Checker accepts
both values and AI tools see both.

**Import** (Dashboard → Brand Kit → Import, or `brandrail import tokens.json`) reads:

| Source | Notes |
| --- | --- |
| Figma file link + personal access token | Variables API (Enterprise plans, `file_variables:read`): collections, modes, aliases. A mode named *Dark* becomes the dark value. Other plans fall back to colour and text styles. The token is used once and never stored. |
| DTCG JSON | `$value` / `$type`, `{alias.references}` |
| Tokens Studio JSON | Token sets; a set named *dark* supplies dark values |
| Figma variables exports | Mode-keyed objects like the UI kit's `src/styles/tokens.js` (`light`/`dark`, `themeA`/`themeB`, `defaultRadius`/`rounded`/`sharp`) |

Semantic tokens that point at a palette are kept; the raw ramps (`gray.100…900`) are left out unless you
tick *Include primitives* (`--primitives`), so AI tools reach for the semantic names. You review a diff
(changed / added / removed) and choose Merge or Replace before anything is published.

## MCP server

Tools (all read-only, same engine as the CLI): `get_guidelines`, `get_design_tokens`, `find_component`,
`get_component_docs`, `validate_snippet`. Each `validate_snippet` call is stored as an "AI tool" scan (no code kept).
`find_component` searches the component registry (Dashboard → Components → Import from UI kit to seed it).

```bash
npx @brandrail/cli init --from-api --mcp   # rule files + .mcp.json, .cursor/mcp.json, .vscode/mcp.json
codex mcp add brandrail --url $BRANDRAIL_API_URL/api/mcp --bearer-token-env-var BRANDRAIL_KEY
```

Rule files written by `init`: AGENTS.md (Codex and other agents), CLAUDE.md, .cursor/rules/brandrail.mdc,
.github/copilot-instructions.md, .windsurf/rules/brandrail.md, GEMINI.md.

## Structure

```
apps/
  web/                 Next.js 16 app (marketing, auth, dashboard)
    src/proxy.ts       Auth guard + session refresh (Next 16 "proxy", formerly middleware)
    src/app/(auth)/    Sign in, sign up, forgot password
    src/app/onboarding Create organisation
    src/app/dashboard/ Overview, Brand Kit, Components, Connect, Checks, Settings
    src/app/api/v1/    brand-kit + scans endpoints (API-key auth)
    src/lib/data.ts    Dashboard queries (falls back to src/lib/mock.ts in demo mode)
packages/
  engine/              Checker rules engine — pure TS, no deps, shared everywhere
  cli/                 `brandrail` CLI (check, init, rules), bundled with esbuild
  github-action/       Composite action; dist/ is committed
  ui/                  Brandrail app primitives (GitHub/Primer look) used by the web app
  kit/                 Midrocks UI kit (copied unchanged from default-ui-kit/src) + new "brandrail" theme
    src/styles/themes/brandrail.css   GitHub palette mapped onto the kit's semantic variables
  tokens/              Theme CSS variables + DTCG token helpers
supabase/migrations/   Postgres schema with row-level security
```

## Next up

- [x] Bring in the Midrocks UI kit as `@brandrail/kit` (live gallery on Dashboard → Components)
- [ ] New kit components: DataTable, Charts, Maps
- [x] Import tokens: Figma file (variables, or styles on non-Enterprise plans), DTCG, Tokens Studio, variable exports
- [x] Save Brand Kit versions to `token_set_versions`
- [x] `packages/engine` + CLI + GitHub Action + ingest API + real dashboard data
- [x] MCP server at `/api/mcp` on the same engine
- [x] Component registry editing + import from the UI kit
- [x] Brand Kit editor: add/remove/rename colours with dark values, fonts, type scale, spacing and radius scales
- [ ] Publish `@brandrail/cli` to npm; deploy the web app (Vercel) so the Action can upload
- [ ] `apps/worker` — Playwright URL scanner
