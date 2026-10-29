/**
 * Bridges a Brand Kit to the Midrocks UI kit (@brandrail/kit).
 *
 * The kit styles every component with its own CSS variables (--stateBrandActive, --spacing7,
 * --fontA-fontSizeBase, --defaultRadius-rad3 …). This maps the Brand Kit onto them, scoped to one
 * element, so the live library and the Brand Kit preview show the kit exactly as the Brand Kit says:
 * change the primary colour to red and every Button, Checkbox and ProgressBar turns red.
 */
import { pickRoles, type BrandKitState, type ScaleStep } from "./brand-kit";

const KIT_SPACING: Record<number, number> = {
  3: 4, 4: 6, 5: 8, 6: 10, 7: 12, 8: 16, 9: 20, 10: 24, 11: 28, 12: 32, 13: 36, 14: 40, 15: 44, 16: 48, 17: 56, 18: 64,
};
const KIT_RADIUS: Record<number, number> = { 1: 2, 2: 4, 3: 6, 4: 8, 5: 10, 6: 12, 7: 16, 8: 22, 9: 28 };
const KIT_TYPE: Array<[string, number, number]> = [
  // name, kit size, kit line height
  ["Xs", 12, 18],
  ["Sm", 14, 22],
  ["Base", 16, 24],
  ["Md", 16, 24],
  ["Lg", 18, 28],
  ["Xl", 20, 32],
  ["2xl", 24, 38],
  ["3xl", 30, 42],
  ["4xl", 36, 52],
];

const nearest = (values: number[], v: number) => values.reduce((best, x) => (Math.abs(x - v) < Math.abs(best - v) ? x : best), values[0]!);
const finite = (steps: ScaleStep[]) => steps.map((s) => s.value).filter((v) => v > 0 && v < 999);

/** Text colour (white or near-black) with the better contrast on a background. */
function onColor(hex: string): string {
  const n = hex.replace("#", "").slice(0, 6);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)) as [number, number, number];
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return (1.05 / (L + 0.05)) >= ((L + 0.05) / 0.05) ? "#ffffff" : "#111111";
}

function colorVars(kit: BrandKitState, dark: boolean): string[] {
  const r = pickRoles(kit.colors, dark);
  const find = (re: RegExp) => {
    const c = kit.colors.find((x) => re.test(x.path));
    return c ? (dark ? c.dark ?? c.value : c.value) : undefined;
  };
  const success = find(/success/);
  const warning = find(/warning|attention/);
  const mix = (a: string, b: string, pct: number) => `color-mix(in srgb, ${a} ${pct}%, ${b})`;
  const v: Record<string, string> = {
    baseSurface1: r.canvas.value,
    baseSurface2: r.subtle.value,
    baseSurface3: mix(r.subtle.value, r.border.value, 70),
    baseFill1: r.subtle.value,
    baseFill2: mix(r.subtle.value, r.border.value, 50),
    baseFill3: r.border.value,
    baseFill4: mix(r.muted.value, r.border.value, 60),
    baseFill5: r.muted.value,
    baseBorder: r.border.value,
    baseDisabled: mix(r.fg.value, "transparent", 28),
    textDarkPrimary: r.fg.value,
    textDarkSecondary: r.muted.value,
    textDarkTertiary: mix(r.muted.value, r.canvas.value, 75),
    textLightPrimary: onColor(r.primary.value),
    stateBrandActive: r.primary.value,
    stateBrandHover: mix(r.primary.value, "black", 88),
    stateBrandSelected: mix(r.primary.value, "black", 75),
    stateDangerActive: r.danger.value,
    stateDangerHover: mix(r.danger.value, "black", 85),
    stateDangerSelected: mix(r.danger.value, r.canvas.value, 14),
    stateHighlightActive: r.accent.value,
    stateHighlightHover: mix(r.accent.value, r.canvas.value, 85),
    stateHighlightSelected: mix(r.accent.value, r.canvas.value, 14),
  };
  if (success) Object.assign(v, { stateSuccessActive: success, stateSuccessHover: mix(success, "black", 88), stateSuccessSelected: mix(success, r.canvas.value, 14) });
  if (warning) Object.assign(v, { stateWarningActive: warning, stateWarningHover: mix(warning, "black", 88), stateWarningSelected: mix(warning, r.canvas.value, 14) });
  const font = kit.fonts[0]?.value;
  if (font) Object.assign(v, { "fontA-fontFamily": font, "fontB-fontFamily": font });
  return Object.entries(v).map(([k, val]) => `--${k}: ${val};`);
}

function scaleVars(kit: BrandKitState): string[] {
  const out: string[] = [];
  const space = finite(kit.spacing);
  if (space.length) for (const [n, px] of Object.entries(KIT_SPACING)) out.push(`--spacing${n}: ${nearest(space, px)}px;`);
  const radii = finite(kit.radii);
  if (radii.length) {
    // The kit's everyday radii are rad2/rad3/rad6 (4/6/12px): match the Brand Kit's sm/md/lg by name first.
    const byName: Record<string, string> = { 2: "sm", 3: "md", 6: "lg" };
    for (const [n, px] of Object.entries(KIT_RADIUS)) {
      const named = kit.radii.find((r) => r.name === byName[n] && r.value > 0 && r.value < 999);
      out.push(`--defaultRadius-rad${n}: ${named ? named.value : nearest(radii, px)}px;`);
    }
  }
  if (kit.typeScale.length) {
    const sizes = kit.typeScale.map((t) => t.size);
    for (const [name, size, lh] of KIT_TYPE) {
      // Same step name first (sm, base, lg …), else the nearest size in the scale.
      const step = kit.typeScale.find((t) => t.name.toLowerCase() === name.toLowerCase()) ?? kit.typeScale.find((t) => t.size === nearest(sizes, size))!;
      out.push(`--fontA-fontSize${name}: ${step.size}px;`, `--fontA-lineHeight${name}: ${step.lineHeight ?? Math.round((step.size * lh) / size)}px;`);
    }
    const base = kit.typeScale.find((t) => t.name === "base") ?? kit.typeScale.find((t) => t.size === nearest(sizes, 14))!;
    out.push(`--fontSizeBase: ${base.size}px;`);
  }
  return out;
}

/**
 * CSS that makes every kit component inside `#scope` follow the Brand Kit, in light and dark.
 * The colour block uses the id so it beats the kit's own theme files (`:root .brandrail.light`).
 */
export function kitBridgeCss(kit: BrandKitState, scopeId: string): string {
  const s = `#${scopeId}`;
  const block = (sel: string, lines: string[]) => `${sel} {\n  ${lines.join("\n  ")}\n}`;
  return [
    block(s, scaleVars(kit)),
    block(`${s}, ${s} .light, ${s} [data-color-mode="light"]`, colorVars(kit, false)),
    block(`${s} .dark, ${s} [data-color-mode="dark"], ${s}.dark`, colorVars(kit, true)),
  ].join("\n");
}
