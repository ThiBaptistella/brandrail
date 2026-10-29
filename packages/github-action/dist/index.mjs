// src/index.ts
import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync as existsSync2, readFileSync as readFileSync2 } from "node:fs";
import { resolve as resolve2 } from "node:path";

// ../engine/src/color.ts
var clamp = (n, lo = 0, hi = 255) => Math.min(hi, Math.max(lo, n));
function parseHex(hex) {
  let h = hex.replace(/^#/, "").toLowerCase();
  if (!/^[0-9a-f]+$/.test(h)) return null;
  if (h.length === 3 || h.length === 4) h = h.split("").map((c) => c + c).join("");
  if (h.length !== 6 && h.length !== 8) return null;
  const n = (i) => parseInt(h.slice(i, i + 2), 16);
  return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) / 255 : 1 };
}
function hslToRgb(h, s, l) {
  h = (h % 360 + 360) % 360;
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}
function parseColor(input) {
  const s = input.trim().toLowerCase();
  if (s.startsWith("#")) return parseHex(s);
  const m = s.match(/^(rgba?|hsla?)\(\s*([^)]*)\)$/);
  if (!m) return null;
  const parts = m[2].split(/[\s,/]+/).filter(Boolean);
  if (parts.length < 3) return null;
  const num = (p, max) => p.endsWith("%") ? parseFloat(p) / 100 * max : parseFloat(p);
  const alpha = parts[3] !== void 0 ? num(parts[3], 1) : 1;
  if (m[1].startsWith("rgb")) {
    const [r2, g2, b2] = parts.slice(0, 3).map((p) => num(p, 255));
    if ([r2, g2, b2].some((v) => Number.isNaN(v))) return null;
    return { r: clamp(r2), g: clamp(g2), b: clamp(b2), a: alpha };
  }
  const [h, sat, l] = [parseFloat(parts[0]), parseFloat(parts[1]), parseFloat(parts[2])];
  if ([h, sat, l].some((v) => Number.isNaN(v))) return null;
  const [r, g, b] = hslToRgb(h, sat, l);
  return { r: clamp(r), g: clamp(g), b: clamp(b), a: alpha };
}
function toHex({ r, g, b }) {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
}
function rgbToLab({ r, g, b }) {
  const lin = (c) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const [R, G, B] = [lin(r), lin(g), lin(b)];
  const x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
  const y = R * 0.2126 + G * 0.7152 + B * 0.0722;
  const z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const f = (t) => t > 8856e-6 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
  return { l: 116 * f(y) - 16, a: 500 * (f(x) - f(y)), b: 200 * (f(y) - f(z)) };
}
function deltaE(a, b) {
  return Math.sqrt((a.l - b.l) ** 2 + (a.a - b.a) ** 2 + (a.b - b.b) ** 2);
}

// ../engine/src/config.ts
var DEFAULT_IGNORE = [
  "**/node_modules/**",
  "**/.git/**",
  "**/dist/**",
  "**/build/**",
  "**/out/**",
  "**/.next/**",
  "**/.nuxt/**",
  "**/.turbo/**",
  "**/coverage/**",
  "**/*.min.*",
  "**/*.map",
  "**/*.d.ts",
  "**/tailwind.config.*",
  "**/*.test.*",
  "**/*.spec.*",
  "**/*.stories.*",
  "**/__tests__/**",
  "**/__mocks__/**"
];
var DEFAULT_FORBIDDEN_IMPORTS = [
  "@mui/material",
  "@mui/joy",
  "@material-ui/core",
  "antd",
  "@chakra-ui/react",
  "react-bootstrap",
  "bootstrap",
  "@mantine/core",
  "semantic-ui-react",
  "primereact"
];
var NAME_TO_TAGS = {
  button: ["button"],
  input: ["input"],
  textinput: ["input"],
  inputtext: ["input"],
  textfield: ["input"],
  select: ["select"],
  dropdown: ["select"],
  textarea: ["textarea"],
  inputtextarea: ["textarea"],
  link: ["a"],
  table: ["table"],
  checkbox: ["input[type=checkbox]"],
  radio: ["input[type=radio]"]
};
var GENERIC_FONTS = /* @__PURE__ */ new Set([
  "inherit",
  "initial",
  "unset",
  "system-ui",
  "-apple-system",
  "blinkmacsystemfont",
  "sans-serif",
  "serif",
  "monospace",
  "ui-sans-serif",
  "ui-serif",
  "ui-monospace",
  "cursive",
  "fantasy"
]);
function leaves(doc, prefix = "", out = []) {
  if (!doc || typeof doc !== "object") return out;
  const obj = doc;
  if ("$value" in obj) {
    const ext = obj.$extensions?.["dev.brandrail"];
    out.push({ path: prefix, type: obj.$type, value: obj.$value, dark: ext?.modes?.dark });
    return out;
  }
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith("$")) continue;
    leaves(v, prefix ? `${prefix}.${k}` : k, out);
  }
  return out;
}
var px = (v) => {
  if (typeof v === "number") return v;
  if (typeof v !== "string") return null;
  const m = v.trim().match(/^(-?\d*\.?\d+)(px|rem)?$/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  return m[2] === "rem" ? n * 16 : n;
};
function normalizeFontFamily(value) {
  const first = value.split(",")[0] ?? "";
  return first.trim().replace(/^['"]|['"]$/g, "").toLowerCase();
}
function isGenericFont(family) {
  return GENERIC_FONTS.has(family) || family.startsWith("var(");
}
var uniqSorted = (xs) => [...new Set(xs.map((x) => Math.round(x * 100) / 100))].sort((a, b) => a - b);
function resolveConfig(config) {
  const all = leaves(config.tokens);
  const colors = [];
  for (const l of all) {
    if (typeof l.value !== "string") continue;
    if (l.type && l.type !== "color") continue;
    if (!l.type && !l.path.startsWith("color")) continue;
    const rgb = parseColor(l.value);
    if (!rgb) continue;
    const cssVar = `--${l.path.replace(/\./g, "-")}`;
    colors.push({ path: l.path, cssVar, hex: toHex(rgb), lab: rgbToLab(rgb), alpha: rgb.a });
    const dark = typeof l.dark === "string" ? parseColor(l.dark) : null;
    if (dark) colors.push({ path: l.path, cssVar, hex: toHex(dark), lab: rgbToLab(dark), alpha: dark.a, mode: "dark" });
  }
  const spaceLeaves = all.filter((l) => /^(space|spacing)\./.test(l.path));
  const spacing = [0, 1, 2];
  const unit = px(spaceLeaves.find((l) => /\.unit$/.test(l.path))?.value);
  for (const l of spaceLeaves) {
    const v = px(l.value);
    if (v !== null && !/\.unit$/.test(l.path)) spacing.push(v);
  }
  if (unit) for (const m of [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 10, 12, 14, 16, 20, 24]) spacing.push(unit * m);
  if (spacing.length === 3) for (const v of [4, 8, 12, 16, 20, 24, 32, 40, 48, 64]) spacing.push(v);
  const radiusVals = all.filter((l) => /^(radius|radii|border-?radius)\./i.test(l.path)).map((l) => px(l.value)).filter((v) => v !== null);
  const radii = [0, 9999, ...radiusVals];
  if (radiusVals.length === 1) radii.push(Math.round(radiusVals[0] / 2), radiusVals[0] * 2);
  if (radiusVals.length === 0) radii.push(2, 4, 6, 8, 12, 16);
  const fontLeaves = all.filter((l) => (l.type === "fontFamily" || /^font\.family\./.test(l.path)) && typeof l.value === "string");
  const fonts = fontLeaves.map((l) => normalizeFontFamily(l.value));
  const fontVars = fontLeaves.map((l) => `--${l.path.replace(/\./g, "-")}`);
  const components = config.components ?? [];
  const replaces = /* @__PURE__ */ new Map();
  for (const c of components) {
    const tags = c.replaces ?? NAME_TO_TAGS[c.name.toLowerCase()] ?? [];
    for (const t of tags) {
      const key = t.toLowerCase().replace(/\s+/g, "").replace(/["']/g, "");
      if (!replaces.has(key)) replaces.set(key, c);
    }
  }
  return {
    tokenVersion: config.tokenVersion,
    colors,
    spacing: uniqSorted(spacing),
    radii: uniqSorted(radii),
    fonts: [...new Set(fonts)],
    fontVars: fontVars.length ? fontVars : ["--font-family-sans"],
    fontSizes: uniqSorted(all.filter((l) => /^font\.size\./.test(l.path)).map((l) => px(l.value)).filter((v) => v !== null)),
    components,
    replaces,
    rules: config.rules ?? {},
    ignore: [...DEFAULT_IGNORE, ...config.ignore ?? []],
    forbiddenImports: config.forbiddenImports ?? DEFAULT_FORBIDDEN_IMPORTS,
    colorTolerance: config.colorTolerance ?? 2.5
  };
}

// ../engine/src/rules.ts
var MARKUP = ["jsx", "vue", "svelte", "html"];
var ALL = ["jsx", "vue", "svelte", "html", "css"];
function* matches(re, text) {
  const g = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
  let m;
  while (m = g.exec(text)) {
    yield m;
    if (m[0].length === 0) g.lastIndex++;
  }
}
var lineBefore = (code, offset, max = 80) => {
  const start = Math.max(code.lastIndexOf("\n", offset - 1) + 1, offset - max);
  return code.slice(start, offset);
};
var lineOf = (code, offset) => {
  const start = code.lastIndexOf("\n", offset - 1) + 1;
  const end = code.indexOf("\n", offset);
  return code.slice(start, end === -1 ? void 0 : end);
};
var fmt = (n) => `${Math.round(n * 100) / 100}px`;
function neighbours(scale, v) {
  const lower = [...scale].reverse().find((x) => x <= v);
  const upper = scale.find((x) => x >= v);
  const opts = [...new Set([lower, upper].filter((x) => x !== void 0))];
  return opts.map(fmt).join(" or ");
}
function pxValues(value) {
  const out = [];
  for (const m of matches(/(-?\d*\.?\d+)(px|rem)\b/g, value)) {
    const n = Math.abs(parseFloat(m[1])) * (m[2] === "rem" ? 16 : 1);
    out.push({ n, index: m.index });
  }
  return out;
}
var noHardcodedColor = {
  id: "no-hardcoded-color",
  title: "Hard-coded colour",
  description: "Colours must come from Brand Kit tokens, not hex / rgb / hsl literals.",
  defaultSeverity: "error",
  kinds: ALL,
  check({ code, kind, config }) {
    if (config.colors.length === 0) return [];
    const out = [];
    const re = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![0-9a-zA-Z_-])|(?<![\w-])(?:rgba?|hsla?)\(\s*[^()]*\)/g;
    for (const m of matches(re, code)) {
      const raw = m[0];
      const before = lineBefore(code, m.index);
      const line = lineOf(code, m.index);
      if (raw.startsWith("#")) {
        const prev = code[m.index - 1] ?? "";
        if (/[A-Za-z0-9_&/]/.test(prev)) continue;
        if (/(?:href|to|id|xlink:href|for|aria-[a-z]+)\s*=\s*["'{`]?\s*$/i.test(before)) continue;
        if (/url\(\s*["']?$/.test(before)) continue;
      }
      if (/--[\w-]+\s*:\s*[^;{}]*$/.test(before)) continue;
      if (kind !== "css" && /^\s*(import|export)\s/.test(line) && !/style|color/i.test(line)) continue;
      const rgb = parseColor(raw);
      if (!rgb) continue;
      const lab = rgbToLab(rgb);
      let best = config.colors[0];
      let bestD = Infinity;
      for (const c of config.colors) {
        const d = deltaE(lab, c.lab) + Math.abs(rgb.a - (c.alpha ?? 1)) * 100;
        if (d < bestD) {
          bestD = d;
          best = c;
        }
      }
      if (bestD <= config.colorTolerance) {
        out.push({
          offset: m.index,
          severity: "warning",
          message: `Hard-coded ${raw} matches the token ${best.path}`,
          suggestion: `Use var(${best.cssVar}) so it follows Brand Kit updates`
        });
      } else {
        out.push({
          offset: m.index,
          message: `${raw} is not in the Brand Kit`,
          suggestion: `Closest token is ${best.path} (${best.hex}, \u0394E ${bestD.toFixed(1)}): use var(${best.cssVar})`
        });
      }
    }
    return out;
  }
};
var PALETTE = "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
var UTIL = "bg|text|border(?:-[trblxyse])?|ring(?:-offset)?|fill|stroke|from|via|to|outline|divide|placeholder|accent|caret|decoration|shadow";
var noRawPaletteClass = {
  id: "no-raw-palette-class",
  title: "Raw Tailwind palette class",
  description: "Use semantic token classes (bg-primary, text-muted) instead of Tailwind's default palette.",
  defaultSeverity: "warning",
  kinds: MARKUP,
  check({ code }) {
    const out = [];
    const re = new RegExp(`(?<![\\w-])((?:[a-z0-9-]+:)*)(${UTIL})-(${PALETTE})-(50|[1-9]00|950)(?:/\\d{1,3})?(?![\\w-])`, "g");
    for (const m of matches(re, code)) {
      out.push({
        offset: m.index + m[1].length,
        message: `Tailwind palette class ${m[0].slice(m[1].length)} bypasses the Brand Kit`,
        suggestion: `Use a semantic class mapped to a token, e.g. ${m[2]}-primary or ${m[2]}-muted`
      });
    }
    return out;
  }
};
var spacingScale = {
  id: "spacing-scale",
  title: "Off-scale spacing",
  description: "Padding, margin and gap must use the spacing scale.",
  defaultSeverity: "warning",
  kinds: ALL,
  check({ code, kind, config }) {
    const out = [];
    const scale = config.spacing;
    const ok = (n) => scale.some((s) => Math.abs(s - n) < 0.01);
    for (const m of matches(/(?<![\w-])(padding|margin|gap|row-gap|column-gap)(?:-(?:top|right|bottom|left|inline|block)(?:-(?:start|end))?)?\s*:\s*([^;{}\n]+)/g, code)) {
      const valueStart = m.index + m[0].length - m[2].length;
      for (const v of pxValues(m[2])) {
        if (!ok(v.n)) out.push({ offset: valueStart + v.index, message: `${m[1]} ${fmt(v.n)} is off the spacing scale`, suggestion: `Use ${neighbours(scale, v.n)}` });
      }
    }
    if (kind !== "css") {
      for (const m of matches(/(?<![\w-])(padding|margin|gap|rowGap|columnGap)(?:Top|Right|Bottom|Left|Inline|Block|X|Y)?\s*:\s*(['"`]?)(-?\d*\.?\d+)\2(?=\s*[,}\n])/g, code)) {
        const n = Math.abs(parseFloat(m[3]));
        if (!ok(n)) out.push({ offset: m.index, message: `${m[1]} ${fmt(n)} is off the spacing scale`, suggestion: `Use ${neighbours(scale, n)}` });
      }
      for (const m of matches(/(?<![\w-])-?(p[xytrbl]?|m[xytrbl]?|gap(?:-[xy])?|space-[xy])-\[(-?\d*\.?\d+)(px|rem)\]/g, code)) {
        const n = Math.abs(parseFloat(m[2])) * (m[3] === "rem" ? 16 : 1);
        if (!ok(n)) out.push({ offset: m.index, message: `${m[0]} is off the spacing scale`, suggestion: `Use ${neighbours(scale, n)}` });
      }
    }
    return out;
  }
};
var radiusScale = {
  id: "radius-scale",
  title: "Off-scale corner radius",
  description: "Border radius must use the radius tokens.",
  defaultSeverity: "info",
  kinds: ALL,
  check({ code, kind, config }) {
    const out = [];
    const ok = (n) => n >= 999 || config.radii.some((r) => Math.abs(r - n) < 0.01);
    for (const m of matches(/(?<![\w-])border(?:-(?:top|bottom|start|end)-(?:left|right|start|end))?-radius\s*:\s*([^;{}\n]+)/g, code)) {
      const valueStart = m.index + m[0].length - m[1].length;
      for (const v of pxValues(m[1])) {
        if (!ok(v.n)) out.push({ offset: valueStart + v.index, message: `border-radius ${fmt(v.n)} is not a radius token`, suggestion: `Use ${neighbours(config.radii.filter((r) => r < 999), v.n)}` });
      }
    }
    if (kind !== "css") {
      for (const m of matches(/(?<![\w-])borderRadius\s*:\s*(['"`]?)(\d*\.?\d+)\1(?=\s*[,}\n])/g, code)) {
        const n = parseFloat(m[2]);
        if (!ok(n)) out.push({ offset: m.index, message: `borderRadius ${fmt(n)} is not a radius token`, suggestion: `Use ${neighbours(config.radii.filter((r) => r < 999), n)}` });
      }
      for (const m of matches(/(?<![\w-])rounded(?:-[a-z]{1,2})?-\[(\d*\.?\d+)px\]/g, code)) {
        const n = parseFloat(m[1]);
        if (!ok(n)) out.push({ offset: m.index, message: `${m[0]} is not a radius token`, suggestion: `Use ${neighbours(config.radii.filter((r) => r < 999), n)}` });
      }
    }
    return out;
  }
};
var fontFamily = {
  id: "font-family",
  title: "Unapproved font",
  description: "Only the Brand Kit's font families may be used.",
  defaultSeverity: "warning",
  kinds: ALL,
  check({ code, kind, config }) {
    if (config.fonts.length === 0) return [];
    const out = [];
    const allowed = config.fonts;
    const test = (value, offset) => {
      const fam = normalizeFontFamily(value);
      if (!fam || isGenericFont(fam) || allowed.includes(fam)) return;
      out.push({
        offset,
        message: `Font "${fam}" is not in the Brand Kit`,
        suggestion: `Use var(--font-family-sans) (${allowed[0]})`
      });
    };
    for (const m of matches(/(?<![\w-])font-family\s*:\s*([^;{}\n]+)/g, code)) test(m[1], m.index);
    if (kind !== "css") {
      for (const m of matches(/(?<![\w-])fontFamily\s*:\s*(['"`])([^'"`]+)\1/g, code)) test(m[2], m.index);
      for (const m of matches(/(?<![\w-])font-\[([^\]]+)\]/g, code)) test(m[1].replace(/_/g, " "), m.index);
    }
    return out;
  }
};
var TEXT_INPUT_TYPES = /* @__PURE__ */ new Set(["", "text", "email", "password", "number", "search", "tel", "url"]);
var preferOfficialComponent = {
  id: "prefer-official-component",
  title: "Re-invented component",
  description: "Use the design system component instead of a raw HTML element.",
  defaultSeverity: "error",
  kinds: MARKUP,
  check({ code, config }) {
    if (config.replaces.size === 0) return [];
    const out = [];
    const baseTags = [...new Set([...config.replaces.keys()].map((k) => k.replace(/\[.*$/, "").replace(/[^a-z0-9-]/g, "")))].filter(Boolean);
    for (const m of matches(new RegExp(`<(${baseTags.join("|")})(?=[\\s>/])([^>]*)>`, "g"), code)) {
      const tag = m[1];
      const attrs = m[2];
      let comp = config.replaces.get(tag);
      if (tag === "input" || tag === "button") {
        const type = (attrs.match(/\btype\s*=\s*\{?\s*["'`]([\w-]+)["'`]/)?.[1] ?? "").toLowerCase();
        const specific = config.replaces.get(`${tag}[type=${type}]`);
        if (specific) comp = specific;
        else if (tag === "input" && !TEXT_INPUT_TYPES.has(type)) comp = type === "submit" || type === "button" ? config.replaces.get("button") : void 0;
      }
      if (!comp) continue;
      if (new RegExp(`(?:function|const|class)\\s+${comp.name}\\b`).test(code)) continue;
      out.push({
        offset: m.index,
        message: `Raw <${tag}${tag === "input" && /type=/.test(attrs) ? ` type="${attrs.match(/type\s*=\s*\{?\s*["'`]([\w-]+)/)?.[1]}"` : ""}> re-implements ${comp.name}`,
        suggestion: `import { ${comp.name} } from "${comp.importPath}"`
      });
    }
    return out;
  }
};
var forbiddenImport = {
  id: "forbidden-import",
  title: "Other UI library",
  description: "Only the design system's component library may be imported.",
  defaultSeverity: "error",
  kinds: ALL,
  check({ code, config }) {
    const out = [];
    const lib = config.components[0]?.importPath;
    const re = /(?:\bimport\s[^'";]*?from\s*|\bimport\s*\(\s*|\bimport\s+|\brequire\(\s*|@import\s+(?:url\(\s*)?)(['"])([^'"]+)\1/g;
    for (const m of matches(re, code)) {
      const spec = m[2];
      const bad = config.forbiddenImports.find((p) => spec === p || spec.startsWith(`${p}/`));
      if (!bad) continue;
      out.push({
        offset: m.index + m[0].indexOf(spec),
        message: `Imports ${bad}, which isn't part of the design system`,
        suggestion: lib ? `Use components from "${lib}"` : "Use the design system's components"
      });
    }
    return out;
  }
};
var imgAlt = {
  id: "img-alt",
  title: "Image without alt text",
  description: "Every <img> needs an alt attribute (empty for decorative images).",
  defaultSeverity: "warning",
  kinds: MARKUP,
  check({ code }) {
    const out = [];
    for (const m of matches(/<img(?=[\s/>])([^>]*)>/g, code)) {
      if (/(?<![\w-])alt\s*=/.test(m[1]) || /\{\s*\.\.\./.test(m[1])) continue;
      out.push({ offset: m.index, message: "<img> has no alt text", suggestion: 'Add alt="\u2026" describing the image, or alt="" if decorative' });
    }
    return out;
  }
};
var RULES = [
  noHardcodedColor,
  noRawPaletteClass,
  preferOfficialComponent,
  forbiddenImport,
  spacingScale,
  fontFamily,
  radiusScale,
  imgAlt
];
var RULE_IDS = RULES.map((r) => r.id);

// ../engine/src/source.ts
function fileKind(path) {
  const ext = path.toLowerCase().split(".").pop() ?? "";
  if (["tsx", "jsx", "ts", "js", "mjs", "cjs", "mdx"].includes(ext)) return "jsx";
  if (ext === "vue") return "vue";
  if (ext === "svelte") return "svelte";
  if (["html", "htm", "astro"].includes(ext)) return "html";
  if (["css", "scss", "sass", "less", "pcss"].includes(ext)) return "css";
  return "other";
}
var SCANNABLE = /* @__PURE__ */ new Set(["jsx", "vue", "svelte", "html", "css"]);
var blank = (s) => s.replace(/[^\n]/g, " ");
function stripComments(code, kind) {
  let out = code;
  if (kind === "html" || kind === "vue" || kind === "svelte") {
    out = out.replace(/<!--[\s\S]*?-->/g, blank);
  }
  if (kind === "css") {
    return out.replace(/\/\*[\s\S]*?\*\//g, blank).replace(/(^|[^:])\/\/[^\n]*/g, (m, p1) => p1 + blank(m.slice(p1.length)));
  }
  const chars = out.split("");
  let i = 0;
  let quote = null;
  while (i < chars.length) {
    const c = chars[i];
    const n = chars[i + 1];
    if (quote) {
      if (c === "\\") i += 2;
      else {
        if (c === quote) quote = null;
        i++;
      }
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      quote = c;
      i++;
      continue;
    }
    if (c === "/" && n === "*") {
      const end = out.indexOf("*/", i + 2);
      const stop = end === -1 ? chars.length : end + 2;
      for (let j = i; j < stop; j++) if (chars[j] !== "\n") chars[j] = " ";
      i = stop;
      continue;
    }
    if (c === "/" && n === "/" && chars[i - 1] !== ":" && kind === "jsx") {
      while (i < chars.length && chars[i] !== "\n") chars[i++] = " ";
      continue;
    }
    i++;
  }
  return chars.join("");
}
var LineIndex = class {
  starts = [0];
  text;
  constructor(text) {
    this.text = text;
    for (let i = 0; i < text.length; i++) if (text.charCodeAt(i) === 10) this.starts.push(i + 1);
  }
  position(offset) {
    let lo = 0;
    let hi = this.starts.length - 1;
    while (lo < hi) {
      const mid = lo + hi + 1 >> 1;
      if (this.starts[mid] <= offset) lo = mid;
      else hi = mid - 1;
    }
    return { line: lo + 1, column: offset - this.starts[lo] + 1 };
  }
  lineText(line) {
    const start = this.starts[line - 1] ?? 0;
    const end = this.starts[line] ?? this.text.length + 1;
    return this.text.slice(start, end - 1);
  }
  get lineCount() {
    return this.starts.length;
  }
};
function globToRegExp(glob) {
  let re = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*") {
      if (glob[i + 1] === "*") {
        const slash = glob[i + 2] === "/";
        re += slash ? "(?:.*/)?" : ".*";
        i += slash ? 2 : 1;
      } else re += "[^/]*";
    } else if (c === "?") re += "[^/]";
    else if (c === "{") {
      const end = glob.indexOf("}", i);
      re += `(?:${glob.slice(i + 1, end).split(",").map((s) => s.replace(/[.+^$()|[\]\\]/g, "\\$&")).join("|")})`;
      i = end;
    } else re += c.replace(/[.+^$()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${re}$`);
}
function makeIgnore(globs) {
  const res = globs.map(globToRegExp);
  return (path) => {
    const p = path.replace(/\\/g, "/").replace(/^\.\//, "");
    return res.some((r) => r.test(p) || r.test(`/${p}`));
  };
}

// ../engine/src/check.ts
var ENGINE_VERSION = "0.2.0";
var WEIGHT = { error: 4, warning: 1.5, info: 0.25 };
function computeScore(counts, lines) {
  const penalty = counts.error * WEIGHT.error + counts.warning * WEIGHT.warning + counts.info * WEIGHT.info;
  if (penalty === 0) return 100;
  const perK = penalty / Math.max(1, lines / 1e3);
  return Math.max(0, Math.min(99, Math.round(100 / (1 + perK / 25))));
}
function check(files, configInput, opts = {}) {
  const t0 = Date.now();
  const config = "replaces" in configInput ? configInput : resolveConfig(configInput);
  const ignored = makeIgnore(config.ignore);
  const violations = [];
  let filesScanned = 0;
  let linesScanned = 0;
  for (const file of files) {
    const path = file.path.replace(/\\/g, "/").replace(/^\.\//, "");
    const kind = fileKind(path);
    if (!SCANNABLE.has(kind) || ignored(path)) continue;
    const only = opts.onlyLines?.get(path);
    if (opts.onlyLines && (!only || only.size === 0)) continue;
    filesScanned++;
    const idx = new LineIndex(file.content);
    linesScanned += only ? only.size : file.content.split("\n").filter((l) => l.trim()).length;
    const code = stripComments(file.content, kind);
    const seen = /* @__PURE__ */ new Set();
    for (const rule of RULES) {
      const setting = config.rules[rule.id];
      if (setting === "off" || !rule.kinds.includes(kind)) continue;
      for (const f of rule.check({ path, kind, code, config })) {
        const { line, column } = idx.position(f.offset);
        if (only && !only.has(line)) continue;
        const key = `${rule.id}:${line}:${column}`;
        if (seen.has(key)) continue;
        seen.add(key);
        violations.push({
          ruleId: rule.id,
          severity: setting ?? f.severity ?? rule.defaultSeverity,
          file: path,
          line,
          column,
          message: f.message,
          suggestion: f.suggestion,
          snippet: opts.snippets === false ? void 0 : idx.lineText(line).trim().slice(0, 160)
        });
      }
    }
  }
  violations.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.column - b.column);
  const counts = { error: 0, warning: 0, info: 0 };
  const perRule = /* @__PURE__ */ new Map();
  for (const v of violations) {
    counts[v.severity]++;
    perRule.set(v.ruleId, (perRule.get(v.ruleId) ?? 0) + 1);
  }
  return {
    engineVersion: ENGINE_VERSION,
    tokenVersion: config.tokenVersion,
    score: computeScore(counts, linesScanned),
    counts,
    filesScanned,
    linesScanned,
    violations,
    byRule: [...perRule].map(([ruleId, count]) => ({ ruleId, count })).sort((a, b) => b.count - a.count),
    durationMs: Date.now() - t0
  };
}

// ../engine/src/report.ts
var RENDERED_ONLY = { "text-contrast": "Low text contrast", "font-size-scale": "Off-scale font size", "page-rendered": "Blank page" };
var title = (id) => RULES.find((r) => r.id === id)?.title ?? RENDERED_ONLY[id] ?? id;
var esc = (s) => s.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
var escProp = (s) => esc(s).replace(/:/g, "%3A").replace(/,/g, "%2C");
function formatGithubAnnotations(report, max = 50) {
  const level = { error: "error", warning: "warning", info: "notice" };
  return report.violations.slice(0, max).map(
    (v) => `::${level[v.severity]} file=${escProp(v.file)},line=${v.line},col=${v.column},title=${escProp(`Brandrail: ${title(v.ruleId)}`)}::${esc(
      v.suggestion ? `${v.message}. ${v.suggestion}` : v.message
    )}`
  ).join("\n");
}
var COMMENT_MARKER = "<!-- brandrail-report -->";
function formatMarkdown(report, opts = {}) {
  const { threshold, maxRows = 30 } = opts;
  const pass = threshold === void 0 || report.score >= threshold;
  const badge = report.violations.length === 0 ? "\u{1F7E2}" : pass ? "\u{1F7E1}" : "\u{1F534}";
  const out = [COMMENT_MARKER];
  out.push(`## ${badge} Brand score: **${report.score}**/100${threshold !== void 0 ? ` (threshold ${threshold})` : ""}`);
  out.push("");
  out.push(
    `**${report.counts.error}** errors \xB7 **${report.counts.warning}** warnings \xB7 **${report.counts.info}** info \u2014 ${report.filesScanned} files scanned${report.tokenVersion ? ` against Brand Kit v${report.tokenVersion}` : ""}`
  );
  if (report.violations.length === 0) {
    out.push("", "Everything uses approved tokens and components. \u2728");
  } else {
    if (report.byRule.length) {
      out.push("", "| Rule | Count |", "| --- | ---: |");
      for (const r of report.byRule) out.push(`| ${title(r.ruleId)} \`${r.ruleId}\` | ${r.count} |`);
    }
    out.push("", "<details><summary>Violations</summary>", "", "| | Location | Issue | Fix |", "| --- | --- | --- | --- |");
    const icon = { error: "\u{1F534}", warning: "\u{1F7E1}", info: "\u{1F535}" };
    for (const v of report.violations.slice(0, maxRows)) {
      const loc = v.line === 0 ? `${v.file} ${v.snippet ?? ""}`.trim() : `${v.file}:${v.line}`;
      const url = opts.fileUrl?.(v);
      const cell = (s) => s.replace(/\|/g, "\\|").replace(/\n/g, " ");
      out.push(`| ${icon[v.severity]} | ${url ? `[\`${loc}\`](${url})` : `\`${loc}\``} | ${cell(v.message)} | ${cell(v.suggestion ?? "")} |`);
    }
    if (report.violations.length > maxRows) out.push("", `\u2026and ${report.violations.length - maxRows} more.`);
    out.push("", "</details>");
  }
  out.push("", `<sub>Brandrail engine ${report.engineVersion}${opts.dashboardUrl ? ` \xB7 [Open in Brandrail](${opts.dashboardUrl})` : ""}</sub>`);
  return out.join("\n");
}

// ../cli/src/api.ts
var DEFAULT_API = "https://web-phi-nine-77.vercel.app";
function apiBase() {
  return (process.env.BRANDRAIL_API_URL ?? DEFAULT_API).replace(/\/$/, "");
}
async function call(path, init) {
  const res = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: { "content-type": "application/json", authorization: `Bearer ${init.key}`, ...init.headers ?? {} }
  });
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
  }
  if (!res.ok) {
    const msg = body?.error ?? `${res.status} ${res.statusText}`;
    throw new Error(`Brandrail API ${path}: ${msg}`);
  }
  return body;
}
function fetchBrandKit(key) {
  return call("/api/v1/brand-kit", { method: "GET", key });
}
function uploadReport(key, payload) {
  const report = payload.uploadSnippets ? payload.report : { ...payload.report, violations: payload.report.violations.map(({ snippet: _snippet, ...v }) => v) };
  return call("/api/v1/scans", { method: "POST", key, body: JSON.stringify({ ...payload, report }) });
}

// ../cli/src/files.ts
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
var MAX_FILE_BYTES = 512 * 1024;
function collectFiles(root, paths, ignoreGlobs) {
  const ignored = makeIgnore(ignoreGlobs);
  const out = [];
  const rel = (p) => relative(root, p).split(sep).join("/");
  const visit = (abs) => {
    const r = rel(abs);
    let st;
    try {
      st = statSync(abs);
    } catch {
      return;
    }
    if (st.isDirectory()) {
      const name = abs.split(sep).pop() ?? "";
      if (r && (ignored(`${r}/`) || ignored(`${r}/x`) || name.startsWith(".") && name !== "." && name !== ".github")) return;
      for (const entry of readdirSync(abs)) visit(join(abs, entry));
      return;
    }
    if (!st.isFile() || st.size > MAX_FILE_BYTES) return;
    if (fileKind(r) === "other" || ignored(r)) return;
    out.push({ path: r, content: readFileSync(abs, "utf8") });
  };
  for (const p of paths.length ? paths : ["."]) visit(resolve(root, p));
  return out;
}
function readConfig(path) {
  const parsed = JSON.parse(readFileSync(path, "utf8"));
  if (!parsed || typeof parsed !== "object" || !parsed.tokens) {
    throw new Error(`${path} has no "tokens". Run \`brandrail init\` to create one.`);
  }
  return parsed;
}

// ../cli/src/git.ts
function parseChangedLines(diff) {
  const out = /* @__PURE__ */ new Map();
  let file = null;
  for (const line of diff.split("\n")) {
    if (line.startsWith("+++ ")) {
      const p = line.slice(4).trim();
      file = p === "/dev/null" ? null : p.replace(/^b\//, "");
      if (file && !out.has(file)) out.set(file, /* @__PURE__ */ new Set());
      continue;
    }
    const h = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/);
    if (h && file) {
      const start = Number(h[1]);
      const count = h[2] === void 0 ? 1 : Number(h[2]);
      const set = out.get(file);
      for (let i = 0; i < count; i++) set.add(start + i);
    }
  }
  return out;
}

// src/index.ts
var env = (k) => (process.env[k] ?? "").trim();
var bool = (k, d) => env(k) ? env(k).toLowerCase() === "true" : d;
function git(args) {
  try {
    return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return null;
  }
}
function event() {
  const p = env("GITHUB_EVENT_PATH");
  try {
    return p && existsSync2(p) ? JSON.parse(readFileSync2(p, "utf8")) : {};
  } catch {
    return {};
  }
}
function prChangedLines(baseSha) {
  let diff = git(["diff", "-U0", "--no-color", "--diff-filter=AMR", "HEAD^1", "HEAD"]);
  if (diff === null) {
    git(["fetch", "--no-tags", "--depth=2", "origin", env("GITHUB_SHA") || "HEAD"]);
    diff = git(["diff", "-U0", "--no-color", "--diff-filter=AMR", "HEAD^1", "HEAD"]);
  }
  if (diff === null && baseSha) {
    git(["fetch", "--no-tags", "--depth=1", "origin", baseSha]);
    diff = git(["diff", "-U0", "--no-color", "--diff-filter=AMR", baseSha, "HEAD"]);
  }
  return diff === null ? null : parseChangedLines(diff);
}
async function upsertComment(body, prNumber) {
  const token = env("BR_GITHUB_TOKEN");
  const repo = env("GITHUB_REPOSITORY");
  const api = env("GITHUB_API_URL") || "https://api.github.com";
  if (!token || !repo) return;
  const headers = { authorization: `Bearer ${token}`, accept: "application/vnd.github+json", "content-type": "application/json" };
  const list = await fetch(`${api}/repos/${repo}/issues/${prNumber}/comments?per_page=100`, { headers });
  if (!list.ok) throw new Error(`list comments: ${list.status}`);
  const existing = (await list.json()).find((c) => c.body?.includes(COMMENT_MARKER));
  const res = existing ? await fetch(`${api}/repos/${repo}/issues/comments/${existing.id}`, { method: "PATCH", headers, body: JSON.stringify({ body }) }) : await fetch(`${api}/repos/${repo}/issues/${prNumber}/comments`, { method: "POST", headers, body: JSON.stringify({ body }) });
  if (!res.ok) throw new Error(`${existing ? "update" : "create"} comment: ${res.status} (does the job have pull-requests: write?)`);
}
function setOutput(name, value) {
  const f = env("GITHUB_OUTPUT");
  if (f) appendFileSync(f, `${name}=${value}
`);
}
async function run() {
  if (env("BR_API_URL")) process.env.BRANDRAIL_API_URL = env("BR_API_URL");
  const key = env("BR_API_KEY");
  const cwd = process.cwd();
  const configPath = resolve2(cwd, env("BR_CONFIG") || "brandrail.config.json");
  let config;
  if (existsSync2(configPath)) config = readConfig(configPath);
  else if (key) config = (await fetchBrandKit(key)).config;
  else throw new Error(`No ${env("BR_CONFIG") || "brandrail.config.json"} and no api-key. Run \`npx brandrail init\` and commit the file, or set api-key.`);
  const resolved = resolveConfig(config);
  const files = collectFiles(cwd, [], resolved.ignore);
  const ev = event();
  const pr = ev.pull_request;
  const onlyLines = pr && bool("BR_CHANGED_ONLY", true) ? prChangedLines(pr.base.sha) ?? void 0 : void 0;
  if (pr && bool("BR_CHANGED_ONLY", true) && !onlyLines) console.log("::warning::Brandrail couldn't read the PR diff; checking all files.");
  const report = check(files, resolved, { onlyLines });
  const threshold = env("BR_FAIL_BELOW") ? Number(env("BR_FAIL_BELOW")) : void 0;
  console.log(formatGithubAnnotations(report));
  console.log(`Brand score ${report.score}/100 \xB7 ${report.counts.error} errors \xB7 ${report.counts.warning} warnings \xB7 ${report.counts.info} info \xB7 ${report.filesScanned} files`);
  setOutput("score", report.score);
  setOutput("errors", report.counts.error);
  const repo = env("GITHUB_REPOSITORY");
  const server = env("GITHUB_SERVER_URL") || "https://github.com";
  const sha = pr?.head.sha ?? env("GITHUB_SHA");
  let dashboardUrl;
  if (key) {
    try {
      const res = await uploadReport(key, {
        source: "ci",
        target: { kind: "repo", name: repo.split("/").pop() || repo, location: repo },
        ref: pr ? `#${pr.number}` : env("GITHUB_REF_NAME") || sha?.slice(0, 7),
        title: pr?.title ?? `Push to ${env("GITHUB_REF_NAME") || "branch"}`,
        threshold,
        report,
        uploadSnippets: bool("BR_UPLOAD_SNIPPETS", false)
      });
      dashboardUrl = res.url;
    } catch (e) {
      console.log(`::warning::Brandrail upload failed: ${e.message}`);
    }
  }
  const md = formatMarkdown(report, {
    threshold,
    dashboardUrl,
    fileUrl: (v) => repo && sha ? `${server}/${repo}/blob/${sha}/${v.file}#L${v.line}` : void 0
  });
  const summary = env("GITHUB_STEP_SUMMARY");
  if (summary) appendFileSync(summary, `${md}
`);
  if (pr && bool("BR_COMMENT", true)) {
    try {
      await upsertComment(md, pr.number);
    } catch (e) {
      console.log(`::warning::Brandrail couldn't comment on the PR: ${e.message}`);
    }
  }
  if (threshold !== void 0 && report.score < threshold) {
    console.log(`::error::Brand score ${report.score} is below the threshold of ${threshold}.`);
    return 1;
  }
  return 0;
}
run().then(
  (code) => process.exit(code),
  (err) => {
    console.log(`::error::Brandrail: ${err.message}`);
    process.exit(2);
  }
);
