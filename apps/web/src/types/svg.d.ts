// The UI kit imports SVGs svgr-style: `import { ReactComponent as Icon } from "./icon.svg"`.
// Merges with Next's own "*.svg" declaration (which provides the default export).
declare module "*.svg" {
  import type * as React from "react";
  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement> & { title?: string }>;
}
