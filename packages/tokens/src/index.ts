/**
 * Brandrail tokens in W3C DTCG shape. This is both Brandrail's own theme
 * and the default starting point for a customer's Brand Kit.
 */
export type DtcgToken = { $type: string; $value: string; $description?: string };
export type DtcgGroup = { [key: string]: DtcgToken | DtcgGroup };

export const defaultTokens = {
  color: {
    canvas: {
      default: { $type: "color", $value: "#ffffff" },
      subtle: { $type: "color", $value: "#f6f8fa" },
    },
    fg: {
      default: { $type: "color", $value: "#1f2328" },
      muted: { $type: "color", $value: "#59636e" },
    },
    border: { default: { $type: "color", $value: "#d1d9e0" } },
    accent: { default: { $type: "color", $value: "#0969da", $description: "Links, focus, selected states" } },
    action: {
      primary: { $type: "color", $value: "#1f883d", $description: "One primary action per view" },
    },
    danger: { default: { $type: "color", $value: "#cf222e" } },
  },
  radius: {
    sm: { $type: "dimension", $value: "4px" },
    md: { $type: "dimension", $value: "6px" },
    lg: { $type: "dimension", $value: "12px" },
  },
  space: {
    "1": { $type: "dimension", $value: "4px" },
    "2": { $type: "dimension", $value: "8px" },
    "3": { $type: "dimension", $value: "16px" },
    "4": { $type: "dimension", $value: "24px" },
    "5": { $type: "dimension", $value: "32px" },
    "6": { $type: "dimension", $value: "40px" },
  },
  font: {
    family: {
      sans: { $type: "fontFamily", $value: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif" },
      mono: { $type: "fontFamily", $value: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" },
    },
    size: {
      sm: { $type: "dimension", $value: "12px" },
      md: { $type: "dimension", $value: "14px" },
      lg: { $type: "dimension", $value: "16px" },
      xl: { $type: "dimension", $value: "20px" },
      "2xl": { $type: "dimension", $value: "32px" },
    },
  },
} satisfies DtcgGroup;

/** Flatten a DTCG group to `a.b.c -> value` pairs. */
export function flattenTokens(group: DtcgGroup, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, node] of Object.entries(group)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (node && typeof node === "object" && "$value" in node) {
      out[path] = (node as DtcgToken).$value;
    } else {
      Object.assign(out, flattenTokens(node as DtcgGroup, path));
    }
  }
  return out;
}

/** Render tokens as CSS custom properties: color.action.primary -> --color-action-primary */
export function tokensToCss(group: DtcgGroup, selector = ":root"): string {
  const lines = Object.entries(flattenTokens(group)).map(
    ([path, value]) => `  --${path.replace(/\./g, "-")}: ${value};`,
  );
  return `${selector} {\n${lines.join("\n")}\n}\n`;
}
