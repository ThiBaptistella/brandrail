# @brandrail/kit

React component library used by Brandrail. Private package: install it with an npm token that has access to the `@brandrail` org.

## Install

Add an `.npmrc` next to your `package.json` (keep the token in an environment variable, never in the file):

```
@brandrail:registry=https://registry.npmjs.org/
//registry.npmjs.org/:_authToken=${NPM_TOKEN}
```

Then:

```bash
npm i @brandrail/kit
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

```bash
cd packages/kit
pnpm publish --access restricted
```

`prepublishOnly` builds `dist/` (ES module, `styles.css`, type declarations). Inside the monorepo the web app uses the TypeScript source directly.
