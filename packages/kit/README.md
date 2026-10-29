# @brandrail/kit

React component library used by Brandrail. It's a private package on GitHub Packages, published as `@thibaptistella/kit` and installed under the name `@brandrail/kit`.

## Install

1. Create a GitHub **classic** personal access token with the `read:packages` scope (GitHub → Settings → Developer settings → Tokens (classic)). Your GitHub account needs access to the `ThiBaptistella/brandrail` repo.
2. Add an `.npmrc` next to your `package.json`. Keep the token in an environment variable, never in the file:

   ```
   @thibaptistella:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
   ```

3. Install it under its usual name, so imports stay `@brandrail/kit`:

   ```bash
   export GITHUB_TOKEN=ghp_…   # your token
   npm i @brandrail/kit@npm:@thibaptistella/kit
   ```

Peer dependencies: `react` and `react-dom` 19.

## Use

```tsx
import "@brandrail/kit/styles.css";
import "./brandrail.tokens.css"; // written by `npx brandrail init`: maps your Brand Kit onto the kit
import { Button, ColorMode } from "@brandrail/kit";

export default function App() {
  return (
    <div className="brandrail light">
      <Button theme="brandrail" colorMode={ColorMode.LIGHT} label="Save" />
    </div>
  );
}
```

`brandrail init` writes `brandrail.tokens.css` with your published Brand Kit: colours, spacing, radius, type and font. The kit picks them up automatically, whatever order the stylesheets load in.

## Publishing (maintainers)

Needs a GitHub classic token with `write:packages`:

```bash
cd packages/kit
export NODE_AUTH_TOKEN=ghp_…        # write:packages token
pnpm run publish:github -- --dry-run # check first
pnpm run publish:github
```

The script builds `dist/` (ES module, `styles.css`, type declarations), renames the package to `@thibaptistella/kit` (GitHub Packages requires the owner's scope) and publishes it. Bump `version` in `package.json` before each release. Inside the monorepo the web app uses the TypeScript source directly.
