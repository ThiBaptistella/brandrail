import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@brandrail/ui", "@brandrail/tokens", "@brandrail/kit", "@brandrail/engine"],
  poweredByHeader: false,
  // Loaded at runtime by the URL scanner; kept out of the bundle.
  serverExternalPackages: ["playwright-core", "@sparticuz/chromium-min"],
  // pnpm monorepo: trace from the repo root, and ship all of playwright-core with the scanner
  // (it reads browsers.json and other files at runtime, which tracing can't see).
  outputFileTracingRoot: path.join(import.meta.dirname, "../.."),
  outputFileTracingIncludes: {
    "/api/scan-url": ["../../node_modules/.pnpm/playwright-core@1.63.0/node_modules/playwright-core/**/*", "../../node_modules/.pnpm/@sparticuz+chromium-min@*/node_modules/@sparticuz/chromium-min/**/*"],
  },
  turbopack: {
    rules: {
      // The UI kit imports icons as `import { ReactComponent as Icon } from "./icon.svg"` (Vite/svgr style).
      "*.svg": {
        loaders: [{ loader: "@svgr/webpack", options: { exportType: "named", namedExport: "ReactComponent", svgo: false, titleProp: true, ref: true } }],
        as: "*.js",
      },
    },
  },
};

export default nextConfig;
