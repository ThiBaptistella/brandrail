import { deltaE, parseColor, rgbToLab } from "./color.ts";
import { isGenericFont, nearest, normalizeFontFamily, type ResolvedConfig } from "./config.ts";
import type { FileKind } from "./source.ts";
import type { Severity } from "./types.ts";

export interface Finding {
  offset: number;
  message: string;
  suggestion?: string;
  severity?: Severity;
}

export interface RuleContext {
  path: string;
  kind: FileKind;
  /** Source with comments blanked out (same offsets as the original). */
  code: string;
  config: ResolvedConfig;
}

export interface Rule {
  id: string;
  title: string;
  description: string;
  defaultSeverity: Severity;
  kinds: FileKind[];
  check(ctx: RuleContext): Finding[];
}

const MARKUP: FileKind[] = ["jsx", "vue", "svelte", "html"];
const ALL: FileKind[] = ["jsx", "vue", "svelte", "html", "css"];

function* matches(re: RegExp, text: string) {
  const g = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
  let m: RegExpExecArray | null;
  while ((m = g.exec(text))) {
    yield m;
    if (m[0].length === 0) g.lastIndex++;
  }
}

const lineBefore = (code: string, offset: number, max = 80) => {
  const start = Math.max(code.lastIndexOf("\n", offset - 1) + 1, offset - max);
  return code.slice(start, offset);
};

const lineOf = (code: string, offset: number) => {
  const start = code.lastIndexOf("\n", offset - 1) + 1;
  const end = code.indexOf("\n", offset);
  return code.slice(start, end === -1 ? undefined : end);
};

const fmt = (n: number) => `${Math.round(n * 100) / 100}px`;

function neighbours(scale: number[], v: number): string {
  const lower = [...scale].reverse().find((x) => x <= v);
  const upper = scale.find((x) => x >= v);
  const opts = [...new Set([lower, upper].filter((x): x is number => x !== undefined))];
  return opts.map(fmt).join(" or ");
}

function pxValues(value: string): Array<{ n: number; index: number }> {
  const out: Array<{ n: number; index: number }> = [];
  for (const m of matches(/(-?\d*\.?\d+)(px|rem)\b/g, value)) {
    const n = Math.abs(parseFloat(m[1]!)) * (m[2] === "rem" ? 16 : 1);
    out.push({ n, index: m.index });
  }
  return out;
}

/* ------------------------------------------------------------------ */

export const noHardcodedColor: Rule = {
  id: "no-hardcoded-color",
  title: "Hard-coded colour",
  description: "Colours must come from Brand Kit tokens, not hex / rgb / hsl literals.",
  defaultSeverity: "error",
  kinds: ALL,
  check({ code, kind, config }) {
    if (config.colors.length === 0) return [];
    const out: Finding[] = [];
    const re = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![0-9a-zA-Z_-])|(?<![\w-])(?:rgba?|hsla?)\(\s*[^()]*\)/g;
    for (const m of matches(re, code)) {
      const raw = m[0];
      const before = lineBefore(code, m.index);
      const line = lineOf(code, m.index);
      if (raw.startsWith("#")) {
        const prev = code[m.index - 1] ?? "";
        if (/[A-Za-z0-9_&/]/.test(prev)) continue; // issue#123, &#123;, /path#anchor
        if (/(?:href|to|id|xlink:href|for|aria-[a-z]+)\s*=\s*["'{`]?\s*$/i.test(before)) continue;
        if (/url\(\s*["']?$/.test(before)) continue;
      }
      if (/--[\w-]+\s*:\s*[^;{}]*$/.test(before)) continue; // CSS custom property definitions are the tokens themselves
      if (kind !== "css" && /^\s*(import|export)\s/.test(line) && !/style|color/i.test(line)) continue;
      const rgb = parseColor(raw);
      if (!rgb) continue;
      const lab = rgbToLab(rgb);
      let best = config.colors[0]!;
      let bestD = Infinity;
      for (const c of config.colors) {
        // A translucent token is a different colour from the same hex at full opacity.
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
          suggestion: `Use var(${best.cssVar}) so it follows Brand Kit updates`,
        });
      } else {
        out.push({
          offset: m.index,
          message: `${raw} is not in the Brand Kit`,
          suggestion: `Closest token is ${best.path} (${best.hex}, ΔE ${bestD.toFixed(1)}): use var(${best.cssVar})`,
        });
      }
    }
    return out;
  },
};

const PALETTE =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const UTIL = "bg|text|border(?:-[trblxyse])?|ring(?:-offset)?|fill|stroke|from|via|to|outline|divide|placeholder|accent|caret|decoration|shadow";

export const noRawPaletteClass: Rule = {
  id: "no-raw-palette-class",
  title: "Raw Tailwind palette class",
  description: "Use semantic token classes (bg-primary, text-muted) instead of Tailwind's default palette.",
  defaultSeverity: "warning",
  kinds: MARKUP,
  check({ code }) {
    const out: Finding[] = [];
    const re = new RegExp(`(?<![\\w-])((?:[a-z0-9-]+:)*)(${UTIL})-(${PALETTE})-(50|[1-9]00|950)(?:/\\d{1,3})?(?![\\w-])`, "g");
    for (const m of matches(re, code)) {
      out.push({
        offset: m.index + m[1]!.length,
        message: `Tailwind palette class ${m[0].slice(m[1]!.length)} bypasses the Brand Kit`,
        suggestion: `Use a semantic class mapped to a token, e.g. ${m[2]}-primary or ${m[2]}-muted`,
      });
    }
    return out;
  },
};

export const spacingScale: Rule = {
  id: "spacing-scale",
  title: "Off-scale spacing",
  description: "Padding, margin and gap must use the spacing scale.",
  defaultSeverity: "warning",
  kinds: ALL,
  check({ code, kind, config }) {
    const out: Finding[] = [];
    const scale = config.spacing;
    const ok = (n: number) => scale.some((s) => Math.abs(s - n) < 0.01);
    // CSS declarations (also styled-components / <style> blocks)
    for (const m of matches(/(?<![\w-])(padding|margin|gap|row-gap|column-gap)(?:-(?:top|right|bottom|left|inline|block)(?:-(?:start|end))?)?\s*:\s*([^;{}\n]+)/g, code)) {
      const valueStart = m.index + m[0].length - m[2]!.length;
      for (const v of pxValues(m[2]!)) {
        if (!ok(v.n)) out.push({ offset: valueStart + v.index, message: `${m[1]} ${fmt(v.n)} is off the spacing scale`, suggestion: `Use ${neighbours(scale, v.n)}` });
      }
    }
    // JSX style objects with unitless numbers: { padding: 13 }
    if (kind !== "css") {
      for (const m of matches(/(?<![\w-])(padding|margin|gap|rowGap|columnGap)(?:Top|Right|Bottom|Left|Inline|Block|X|Y)?\s*:\s*(['"`]?)(-?\d*\.?\d+)\2(?=\s*[,}\n])/g, code)) {
        const n = Math.abs(parseFloat(m[3]!));
        if (!ok(n)) out.push({ offset: m.index, message: `${m[1]} ${fmt(n)} is off the spacing scale`, suggestion: `Use ${neighbours(scale, n)}` });
      }
      // Tailwind arbitrary values: p-[13px]
      for (const m of matches(/(?<![\w-])-?(p[xytrbl]?|m[xytrbl]?|gap(?:-[xy])?|space-[xy])-\[(-?\d*\.?\d+)(px|rem)\]/g, code)) {
        const n = Math.abs(parseFloat(m[2]!)) * (m[3] === "rem" ? 16 : 1);
        if (!ok(n)) out.push({ offset: m.index, message: `${m[0]} is off the spacing scale`, suggestion: `Use ${neighbours(scale, n)}` });
      }
    }
    return out;
  },
};

export const radiusScale: Rule = {
  id: "radius-scale",
  title: "Off-scale corner radius",
  description: "Border radius must use the radius tokens.",
  defaultSeverity: "info",
  kinds: ALL,
  check({ code, kind, config }) {
    const out: Finding[] = [];
    const ok = (n: number) => n >= 999 || config.radii.some((r) => Math.abs(r - n) < 0.01);
    for (const m of matches(/(?<![\w-])border(?:-(?:top|bottom|start|end)-(?:left|right|start|end))?-radius\s*:\s*([^;{}\n]+)/g, code)) {
      const valueStart = m.index + m[0].length - m[1]!.length;
      for (const v of pxValues(m[1]!)) {
        if (!ok(v.n)) out.push({ offset: valueStart + v.index, message: `border-radius ${fmt(v.n)} is not a radius token`, suggestion: `Use ${neighbours(config.radii.filter((r) => r < 999), v.n)}` });
      }
    }
    if (kind !== "css") {
      for (const m of matches(/(?<![\w-])borderRadius\s*:\s*(['"`]?)(\d*\.?\d+)\1(?=\s*[,}\n])/g, code)) {
        const n = parseFloat(m[2]!);
        if (!ok(n)) out.push({ offset: m.index, message: `borderRadius ${fmt(n)} is not a radius token`, suggestion: `Use ${neighbours(config.radii.filter((r) => r < 999), n)}` });
      }
      for (const m of matches(/(?<![\w-])rounded(?:-[a-z]{1,2})?-\[(\d*\.?\d+)px\]/g, code)) {
        const n = parseFloat(m[1]!);
        if (!ok(n)) out.push({ offset: m.index, message: `${m[0]} is not a radius token`, suggestion: `Use ${neighbours(config.radii.filter((r) => r < 999), n)}` });
      }
    }
    return out;
  },
};

export const fontFamily: Rule = {
  id: "font-family",
  title: "Unapproved font",
  description: "Only the Brand Kit's font families may be used.",
  defaultSeverity: "warning",
  kinds: ALL,
  check({ code, kind, config }) {
    if (config.fonts.length === 0) return [];
    const out: Finding[] = [];
    const allowed = config.fonts;
    const test = (value: string, offset: number) => {
      const fam = normalizeFontFamily(value);
      if (!fam || isGenericFont(fam) || allowed.includes(fam)) return;
      out.push({
        offset,
        message: `Font "${fam}" is not in the Brand Kit`,
        suggestion: `Use var(--font-family-sans) (${allowed[0]})`,
      });
    };
    for (const m of matches(/(?<![\w-])font-family\s*:\s*([^;{}\n]+)/g, code)) test(m[1]!, m.index);
    if (kind !== "css") {
      for (const m of matches(/(?<![\w-])fontFamily\s*:\s*(['"`])([^'"`]+)\1/g, code)) test(m[2]!, m.index);
      for (const m of matches(/(?<![\w-])font-\[([^\]]+)\]/g, code)) test(m[1]!.replace(/_/g, " "), m.index);
    }
    return out;
  },
};

/** Input types that are text-like, so a generic "input" replacement applies. */
const TEXT_INPUT_TYPES = new Set(["", "text", "email", "password", "number", "search", "tel", "url"]);

export const preferOfficialComponent: Rule = {
  id: "prefer-official-component",
  title: "Re-invented component",
  description: "Use the design system component instead of a raw HTML element.",
  defaultSeverity: "error",
  kinds: MARKUP,
  check({ code, config }) {
    if (config.replaces.size === 0) return [];
    const out: Finding[] = [];
    const baseTags = [...new Set([...config.replaces.keys()].map((k) => k.replace(/\[.*$/, "").replace(/[^a-z0-9-]/g, "")))].filter(Boolean);
    for (const m of matches(new RegExp(`<(${baseTags.join("|")})(?=[\\s>/])([^>]*)>`, "g"), code)) {
      const tag = m[1]!;
      const attrs = m[2]!;
      let comp = config.replaces.get(tag);
      if (tag === "input" || tag === "button") {
        const type = (attrs.match(/\btype\s*=\s*\{?\s*["'`]([\w-]+)["'`]/)?.[1] ?? "").toLowerCase();
        const specific = config.replaces.get(`${tag}[type=${type}]`);
        if (specific) comp = specific;
        else if (tag === "input" && !TEXT_INPUT_TYPES.has(type)) comp = type === "submit" || type === "button" ? config.replaces.get("button") : undefined;
      }
      if (!comp) continue;
      // Skip the component's own implementation file
      if (new RegExp(`(?:function|const|class)\\s+${comp.name}\\b`).test(code)) continue;
      out.push({
        offset: m.index,
        message: `Raw <${tag}${tag === "input" && /type=/.test(attrs) ? ` type="${attrs.match(/type\s*=\s*\{?\s*["'`]([\w-]+)/)?.[1]}"` : ""}> re-implements ${comp.name}`,
        suggestion: `import { ${comp.name} } from "${comp.importPath}"`,
      });
    }
    return out;
  },
};

export const forbiddenImport: Rule = {
  id: "forbidden-import",
  title: "Other UI library",
  description: "Only the design system's component library may be imported.",
  defaultSeverity: "error",
  kinds: ALL,
  check({ code, config }) {
    const out: Finding[] = [];
    const lib = config.components[0]?.importPath;
    const re = /(?:\bimport\s[^'";]*?from\s*|\bimport\s*\(\s*|\bimport\s+|\brequire\(\s*|@import\s+(?:url\(\s*)?)(['"])([^'"]+)\1/g;
    for (const m of matches(re, code)) {
      const spec = m[2]!;
      const bad = config.forbiddenImports.find((p) => spec === p || spec.startsWith(`${p}/`));
      if (!bad) continue;
      out.push({
        offset: m.index + m[0].indexOf(spec),
        message: `Imports ${bad}, which isn't part of the design system`,
        suggestion: lib ? `Use components from "${lib}"` : "Use the design system's components",
      });
    }
    return out;
  },
};

export const imgAlt: Rule = {
  id: "img-alt",
  title: "Image without alt text",
  description: "Every <img> needs an alt attribute (empty for decorative images).",
  defaultSeverity: "warning",
  kinds: MARKUP,
  check({ code }) {
    const out: Finding[] = [];
    for (const m of matches(/<img(?=[\s/>])([^>]*)>/g, code)) {
      if (/(?<![\w-])alt\s*=/.test(m[1]!) || /\{\s*\.\.\./.test(m[1]!)) continue;
      out.push({ offset: m.index, message: "<img> has no alt text", suggestion: 'Add alt="…" describing the image, or alt="" if decorative' });
    }
    return out;
  },
};

export const RULES: Rule[] = [
  noHardcodedColor,
  noRawPaletteClass,
  preferOfficialComponent,
  forbiddenImport,
  spacingScale,
  fontFamily,
  radiusScale,
  imgAlt,
];

export const RULE_IDS = RULES.map((r) => r.id);

