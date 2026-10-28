import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@brandrail/ui", "@brandrail/tokens", "@brandrail/kit", "@brandrail/engine"],
  poweredByHeader: false,
  // Loaded at runtime by the URL scanner; kept out of the bundle.
  serverExternalPackages: ["playwright-core", "@sparticuz/chromium-min"],
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
