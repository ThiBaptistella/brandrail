import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

/**
 * Library build for npm: ES module + one stylesheet (theme layers + every component's CSS).
 * Inside the monorepo the web app uses the TypeScript source directly; this is only for publishing.
 */
export default defineConfig({
  plugins: [react(), svgr({ include: "**/*.svg", svgrOptions: { exportType: "named", namedExport: "ReactComponent" } })],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    cssCodeSplit: false,
    sourcemap: true,
    lib: {
      entry: resolve(import.meta.dirname, "src/lib.ts"),
      formats: ["es"],
      fileName: () => "index.js",
      cssFileName: "styles",
    },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime", "classnames", /^date-fns/],
      // Components use state and effects: mark the bundle as client code for Next.js / RSC apps.
      output: { banner: '"use client";' },
    },
  },
});
