/** Brand Kit editor state <-> W3C DTCG token document stored in token_set_versions.tokens. */

export type ColorToken = { path: string; value: string; note: string };
export type BrandKitState = {
  colors: ColorToken[];
  font: string;
  baseSize: number;
  radius: number;
  spaceUnit: number;
};

export const defaultBrandKit: BrandKitState = {
  colors: [
    { path: "color.action.primary", value: "#1f883d", note: "One primary action per view" },
    { path: "color.accent.default", value: "#0969da", note: "Links, focus, selection" },
    { path: "color.fg.default", value: "#1f2328", note: "Body text" },
    { path: "color.fg.muted", value: "#59636e", note: "Secondary text" },
    { path: "color.canvas.default", value: "#ffffff", note: "Page background" },
    { path: "color.canvas.subtle", value: "#f6f8fa", note: "Headers, wells" },
    { path: "color.border.default", value: "#d1d9e0", note: "Borders and dividers" },
    { path: "color.danger.default", value: "#cf222e", note: "Destructive actions, errors" },
  ],
  font: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif",
  baseSize: 14,
  radius: 6,
  spaceUnit: 8,
};

type Node = { [k: string]: Node | { $type: string; $value: string; $description?: string } };

function set(tree: Node, path: string, leaf: { $type: string; $value: string; $description?: string }) {
  const parts = path.split(".");
  let node = tree;
  parts.forEach((p, i) => {
    if (i === parts.length - 1) node[p] = leaf;
    else node = (node[p] ??= {}) as Node;
  });
}

export function toDtcg(s: BrandKitState): Node {
  const tree: Node = {};
  for (const c of s.colors) set(tree, c.path, { $type: "color", $value: c.value, $description: c.note });
  set(tree, "font.family.sans", { $type: "fontFamily", $value: s.font });
  set(tree, "font.size.base", { $type: "dimension", $value: `${s.baseSize}px` });
  set(tree, "radius.md", { $type: "dimension", $value: `${s.radius}px` });
  set(tree, "space.unit", { $type: "dimension", $value: `${s.spaceUnit}px` });
  return tree;
}

function walk(node: unknown, prefix: string, out: Array<{ path: string; $value: string; $description?: string }>) {
  if (!node || typeof node !== "object") return;
  const obj = node as Record<string, unknown>;
  if ("$value" in obj) {
    out.push({ path: prefix, $value: String(obj.$value), $description: obj.$description as string | undefined });
    return;
  }
  for (const [k, v] of Object.entries(obj)) walk(v, prefix ? `${prefix}.${k}` : k, out);
}

export function fromDtcg(doc: unknown): BrandKitState {
  const flat: Array<{ path: string; $value: string; $description?: string }> = [];
  walk(doc, "", flat);
  const get = (p: string) => flat.find((f) => f.path === p)?.$value;
  const px = (v: string | undefined, d: number) => (v ? Number.parseFloat(v) || d : d);
  const colors = flat
    .filter((f) => f.path.startsWith("color."))
    .map((f) => ({ path: f.path, value: f.$value, note: f.$description ?? "" }));
  return {
    colors: colors.length ? colors : defaultBrandKit.colors,
    font: get("font.family.sans") ?? defaultBrandKit.font,
    baseSize: px(get("font.size.base"), defaultBrandKit.baseSize),
    radius: px(get("radius.md"), defaultBrandKit.radius),
    spaceUnit: px(get("space.unit"), defaultBrandKit.spaceUnit),
  };
}

export function nextVersion(current: string | null): string {
  if (!current) return "1.0.0";
  const [maj = 1, min = 0] = current.split(".").map((n) => Number.parseInt(n, 10) || 0);
  return `${maj}.${min + 1}.0`;
}
