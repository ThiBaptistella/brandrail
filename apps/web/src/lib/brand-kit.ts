/**
 * Brand Kit editor state <-> W3C DTCG token document stored in token_set_versions.tokens.
 * Pure functions: used by the server (load/publish) and the client editor (import, export, diff).
 */
import { buildDtcg, flattenTokens, pickColorRoles, type ColorRole, type FlatToken, type TokenType } from "@brandrail/engine";

export type ColorToken = { id: string; path: string; value: string; dark?: string; note: string };
export type ScaleStep = { id: string; name: string; value: number };
export type TypeStep = { id: string; name: string; size: number; lineHeight?: number; weight?: number };
export type FontToken = { id: string; name: string; value: string };
export type OtherToken = { id: string; path: string; type: TokenType; value: string; note?: string };

export type BrandKitState = {
  colors: ColorToken[];
  fonts: FontToken[];
  typeScale: TypeStep[];
  radii: ScaleStep[];
  spacing: ScaleStep[];
  other: OtherToken[];
};

let seq = 0;
export const uid = () => `t${Date.now().toString(36)}${(seq++).toString(36)}`;

const SYSTEM_SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif";

export const defaultBrandKit: BrandKitState = {
  colors: [
    { path: "color.action.primary", value: "#1f883d", dark: "#2ea043", note: "One primary action per view" },
    { path: "color.accent.default", value: "#0969da", dark: "#4493f8", note: "Links, focus, selection" },
    { path: "color.fg.default", value: "#1f2328", dark: "#f0f6fc", note: "Body text" },
    { path: "color.fg.muted", value: "#59636e", dark: "#9198a1", note: "Secondary text" },
    { path: "color.canvas.default", value: "#ffffff", dark: "#0d1117", note: "Page background" },
    { path: "color.canvas.subtle", value: "#f6f8fa", dark: "#151b23", note: "Headers, wells" },
    { path: "color.border.default", value: "#d1d9e0", dark: "#3d444d", note: "Borders and dividers" },
    { path: "color.danger.default", value: "#cf222e", dark: "#f85149", note: "Destructive actions, errors" },
    { path: "color.success.default", value: "#1a7f37", dark: "#3fb950", note: "Success messages, completed states" },
    { path: "color.attention.default", value: "#9a6700", dark: "#d29922", note: "Warnings, needs attention" },
  ].map((c, i) => ({ ...c, id: `c${i}` })),
  fonts: [
    { id: "f0", name: "sans", value: SYSTEM_SANS },
    { id: "f1", name: "mono", value: "ui-monospace, SFMono-Regular, Menlo, monospace" },
  ],
  typeScale: [
    { name: "xs", size: 12, lineHeight: 18 },
    { name: "sm", size: 13, lineHeight: 20 },
    { name: "base", size: 14, lineHeight: 22 },
    { name: "lg", size: 16, lineHeight: 24, weight: 600 },
    { name: "xl", size: 20, lineHeight: 28, weight: 600 },
    { name: "2xl", size: 24, lineHeight: 32, weight: 600 },
    { name: "3xl", size: 32, lineHeight: 40, weight: 600 },
  ].map((t, i) => ({ ...t, id: `ty${i}` })),
  radii: [
    { name: "sm", value: 3 },
    { name: "md", value: 6 },
    { name: "lg", value: 12 },
    { name: "full", value: 9999 },
  ].map((r, i) => ({ ...r, id: `r${i}` })),
  spacing: spacingFromUnit(4, "s"),
  other: [],
};

/** A 4-based or 8-based spacing scale named 1…8. */
export function spacingFromUnit(unit: number, idPrefix = ""): ScaleStep[] {
  const steps = unit >= 8 ? [0.5, 1, 1.5, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 6, 8, 10, 12];
  return steps.map((m, i) => ({ id: idPrefix ? `${idPrefix}${i}` : uid(), name: String(i + 1), value: unit * m }));
}

const px = (v: string | undefined) => {
  if (!v) return undefined;
  const m = v.trim().match(/^(-?\d*\.?\d+)(px|rem)?$/);
  if (!m) return undefined;
  const n = Number.parseFloat(m[1]!);
  return m[2] === "rem" ? n * 16 : n;
};
const pxv = (n: number) => `${n}px`;
const byNum = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, "en", { numeric: true });

export function toFlat(s: BrandKitState): FlatToken[] {
  const out: FlatToken[] = [];
  for (const c of s.colors) out.push({ path: c.path, type: "color", value: c.value, ...(c.dark ? { dark: c.dark } : {}), ...(c.note ? { description: c.note } : {}) });
  for (const f of s.fonts) out.push({ path: `font.family.${f.name}`, type: "fontFamily", value: f.value });
  for (const t of s.typeScale) {
    out.push({ path: `font.size.${t.name}`, type: "dimension", value: pxv(t.size) });
    if (t.lineHeight) out.push({ path: `font.line-height.${t.name}`, type: "dimension", value: pxv(t.lineHeight) });
    if (t.weight) out.push({ path: `font.weight.${t.name}`, type: "fontWeight", value: String(t.weight) });
  }
  for (const r of s.radii) out.push({ path: `radius.${r.name}`, type: "dimension", value: pxv(r.value) });
  for (const sp of s.spacing) out.push({ path: `space.${sp.name}`, type: "dimension", value: pxv(sp.value) });
  for (const o of s.other) out.push({ path: o.path, type: o.type, value: o.value, ...(o.note ? { description: o.note } : {}) });
  return out;
}

export function toDtcg(s: BrandKitState) {
  return buildDtcg(toFlat(s));
}

/** Also reads v1 kits (single radius.md, space.unit, font.size.base) and expands them into scales. */
export function fromDtcg(doc: unknown): BrandKitState {
  const flat = flattenTokens(doc);
  const s: BrandKitState = { colors: [], fonts: [], typeScale: [], radii: [], spacing: [], other: [] };
  const sizes = new Map<string, TypeStep>();
  const lineHeights = new Map<string, number>();
  const weights = new Map<string, number>();
  let legacyUnit: number | undefined;

  for (const t of flat) {
    const p = t.path;
    const rest = (prefix: string) => p.slice(prefix.length);
    if (t.type === "color") s.colors.push({ id: uid(), path: p, value: t.value, ...(t.dark ? { dark: t.dark } : {}), note: t.description ?? "" });
    else if (p.startsWith("font.family.")) s.fonts.push({ id: uid(), name: rest("font.family."), value: t.value });
    else if (p.startsWith("font.size.") && px(t.value) !== undefined) sizes.set(rest("font.size."), { id: uid(), name: rest("font.size."), size: px(t.value)! });
    else if (p.startsWith("font.line-height.") && px(t.value) !== undefined) lineHeights.set(rest("font.line-height."), px(t.value)!);
    else if (p.startsWith("font.weight.") && /^\d+$/.test(t.value)) weights.set(rest("font.weight."), Number(t.value));
    else if (p === "space.unit" && px(t.value)) legacyUnit = px(t.value);
    else if (/^(space|spacing)\./.test(p) && px(t.value) !== undefined) s.spacing.push({ id: uid(), name: p.replace(/^(space|spacing)\./, ""), value: px(t.value)! });
    else if (/^radius\./.test(p) && px(t.value) !== undefined) s.radii.push({ id: uid(), name: rest("radius."), value: px(t.value)! });
    else s.other.push({ id: uid(), path: p, type: t.type, value: t.value, ...(t.description ? { note: t.description } : {}) });
  }

  // Line heights / weights that pair with a size become part of that type step.
  for (const [name, step] of sizes) {
    if (lineHeights.has(name)) {
      step.lineHeight = lineHeights.get(name);
      lineHeights.delete(name);
    }
    if (weights.has(name)) {
      step.weight = weights.get(name);
      weights.delete(name);
    }
  }
  for (const [name, v] of lineHeights) s.other.push({ id: uid(), path: `font.line-height.${name}`, type: "dimension", value: pxv(v) });
  for (const [name, v] of weights) s.other.push({ id: uid(), path: `font.weight.${name}`, type: "fontWeight", value: String(v) });
  s.typeScale = [...sizes.values()].sort((a, b) => a.size - b.size);

  // v1 kits: one base size, one radius, a spacing unit.
  if (s.typeScale.length === 1 && s.typeScale[0]!.name === "base") {
    const b = s.typeScale[0]!.size;
    s.typeScale = [0.86, 0.93, 1, 1.14, 1.43, 1.71, 2.29].map((m, i) => ({
      id: uid(),
      name: ["xs", "sm", "base", "lg", "xl", "2xl", "3xl"][i]!,
      size: Math.round(b * m),
      lineHeight: Math.round(b * m * 1.5 / 2) * 2,
      ...(m > 1.1 ? { weight: 600 } : {}),
    }));
  }
  if (s.radii.length === 1 && s.radii[0]!.name === "md") {
    const r = s.radii[0]!.value;
    s.radii = [
      { id: uid(), name: "sm", value: Math.round(r / 2) },
      { id: uid(), name: "md", value: r },
      { id: uid(), name: "lg", value: r * 2 },
      { id: uid(), name: "full", value: 9999 },
    ];
  }
  if (!s.spacing.length && legacyUnit) s.spacing = spacingFromUnit(legacyUnit >= 8 ? 8 : 4);

  if (!s.colors.length) s.colors = defaultBrandKit.colors.map((c) => ({ ...c, id: uid() }));
  if (!s.fonts.length) s.fonts = defaultBrandKit.fonts.map((f) => ({ ...f, id: uid() }));
  if (!s.typeScale.length) s.typeScale = defaultBrandKit.typeScale.map((t) => ({ ...t, id: uid() }));
  if (!s.radii.length) s.radii = defaultBrandKit.radii.map((r) => ({ ...r, id: uid() }));
  if (!s.spacing.length) s.spacing = spacingFromUnit(4);
  s.spacing.sort((a, b) => a.value - b.value || byNum(a, b));
  s.radii.sort((a, b) => a.value - b.value || byNum(a, b));
  return s;
}

/** Content fingerprint, ignoring React ids. */
export const kitKey = (s: BrandKitState) => JSON.stringify(toFlat(s));

export function nextVersion(current: string | null): string {
  if (!current) return "1.0.0";
  const [maj = 1, min = 0] = current.split(".").map((n) => Number.parseInt(n, 10) || 0);
  return `${maj}.${min + 1}.0`;
}

/* ───────── validation (shared by the editor and the publish action) ───────── */

export const HEX = /^#(?:[0-9a-f]{6}|[0-9a-f]{8})$/i;
const NAME = /^[a-z0-9][a-z0-9-]*$/;
const PATH = /^[a-z][a-z0-9-]*(\.[a-z0-9][a-z0-9-]*)+$/;

export function validateKit(s: BrandKitState): string | null {
  if (!s.colors.length) return "Add at least one colour.";
  const seen = new Set<string>();
  for (const c of s.colors) {
    if (!PATH.test(c.path) || !c.path.startsWith("color.")) return `“${c.path}” isn't a valid colour name. Use lower-case dot paths like color.action.primary.`;
    if (seen.has(c.path)) return `“${c.path}” is used twice.`;
    seen.add(c.path);
    if (!HEX.test(c.value)) return `${c.path}: “${c.value}” must be a hex value like #1f883d (or #1f883d80 with alpha).`;
    if (c.dark && !HEX.test(c.dark)) return `${c.path}: dark value “${c.dark}” must be a hex value.`;
  }
  for (const [label, list] of [
    ["font", s.fonts],
    ["type step", s.typeScale],
    ["radius", s.radii],
    ["spacing step", s.spacing],
  ] as const) {
    const names = new Set<string>();
    for (const x of list) {
      if (!NAME.test(x.name)) return `“${x.name}” isn't a valid ${label} name. Use lower-case letters, numbers and dashes.`;
      if (names.has(x.name)) return `Two ${label}s are called “${x.name}”.`;
      names.add(x.name);
    }
  }
  if (!s.fonts.some((f) => f.value.trim())) return "Add a font family.";
  for (const t of s.typeScale) if (!(t.size > 0 && t.size <= 400)) return `Type step ${t.name}: size must be between 1 and 400px.`;
  for (const r of s.radii) if (!(r.value >= 0 && r.value <= 9999)) return `Radius ${r.name} must be 0–9999px.`;
  for (const sp of s.spacing) if (!(sp.value >= 0 && sp.value <= 1000)) return `Spacing ${sp.name} must be 0–1000px.`;
  return null;
}

/* ───────── roles: which token plays which part, for the preview and contrast checks ───────── */

export type Role = ColorRole;

export function pickRoles(colors: ColorToken[], dark = false): Record<Role, { value: string; path?: string }> {
  return pickColorRoles(colors, dark);
}

export const cssVar = (path: string) => `--${path.replace(/\./g, "-")}`;
