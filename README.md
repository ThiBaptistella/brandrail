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

Project `brandrail` (ref `cyxytcoswgwgzaonkpnf`). Both migrations in `supabase/migrations/` are already applied;
the file names match the versions recorded in Supabase, so the GitHub integration won't re-run them.
`apps/web/.env.local` holds the URL and publishable key (git-ignored).

Still to do in the Supabase dashboard:
1. Auth → URL Configuration: Site URL `http://localhost:3000`, and add `http://localhost:3000/**` to Redirect URLs.
2. Auth → Providers: enable GitHub and Google if you want OAuth (each needs an OAuth app's client ID/secret).
3. For quick local testing you can turn off "Confirm email" under Auth → Providers → Email.

## Structure

```
apps/
  web/                 Next.js 16 app (marketing, auth, dashboard)
    src/proxy.ts       Auth guard + session refresh (Next 16 "proxy", formerly middleware)
    src/app/(auth)/    Sign in, sign up, forgot password
    src/app/onboarding Create organisation
    src/app/dashboard/ Overview, Brand Kit, Components, Connect, Checks, Settings
    src/lib/mock.ts    Sample data until the Checker and MCP server are wired up
packages/
  ui/                  Brandrail app primitives (GitHub/Primer look) used by the web app
  kit/                 Midrocks UI kit (copied unchanged from default-ui-kit/src) + new "brandrail" theme
    src/styles/themes/brandrail.css   GitHub palette mapped onto the kit's semantic variables
  tokens/              Theme CSS variables + DTCG token helpers
supabase/migrations/   Postgres schema with row-level security
```

## Next up

- [x] Bring in the Midrocks UI kit as `@brandrail/kit` (live gallery on Dashboard → Components)
- [ ] New kit components: DataTable, Charts, Maps
- [ ] Reuse the kit's `scripts/figmaApi.js` + `generateThemes.js` for "Import from Figma"
- [ ] Save Brand Kit versions to `token_set_versions`
- [ ] `packages/engine` — Checker rules (AST) shared by CLI, GitHub Action, MCP and scan worker
- [ ] `apps/mcp` — MCP server (get_design_tokens, find_component, validate_snippet…)
- [ ] `apps/worker` — Playwright URL scanner
