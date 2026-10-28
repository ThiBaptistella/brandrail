"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Copy as CopyIcon,
  Check as CheckIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Monitor as DeviceDesktopIcon,
  Smartphone as DeviceMobileIcon,
  Moon as MoonIcon,
  Sun as SunIcon,
} from "lucide-react";
import { Box, BoxHeader, Button, Flash, Label, Select, TextInput, cn } from "@brandrail/ui";
import { publishBrandKitAction, type PublishResult } from "@/app/actions/brand-kit";
import { PageHeader } from "@/components/dashboard/page-header";
import { nextVersion, type BrandKitState } from "@/lib/brand-kit";

const fonts = [
  { label: "System (GitHub style)", value: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif" },
  { label: "Inter", value: "Inter, system-ui, sans-serif" },
  { label: "Georgia (serif)", value: "Georgia, 'Times New Roman', serif" },
  { label: "Mono", value: "ui-monospace, SFMono-Regular, Menlo, monospace" },
];

const sections = ["Colours", "Typography", "Shape & spacing", "Export"] as const;
type Section = (typeof sections)[number];

function cssVar(path: string) {
  return `--${path.replace(/\./g, "-")}`;
}

/** WCAG relative luminance contrast ratio. */
function contrast(a: string, b: string) {
  const lum = (hex: string) => {
    const n = hex.replace("#", "");
    const rgb = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * (rgb[0] ?? 0) + 0.7152 * (rgb[1] ?? 0) + 0.0722 * (rgb[2] ?? 0);
  };
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x) as [number, number];
  return (l1 + 0.05) / (l2 + 0.05);
}

export function BrandKitEditor({
  orgName,
  initial,
  version,
  publishedAt,
  canPublish,
}: {
  orgName: string;
  initial: BrandKitState;
  version: string | null;
  publishedAt: string | null;
  canPublish: boolean;
}) {
  const [section, setSection] = useState<Section>("Colours");
  const [colors, setColors] = useState(initial.colors);
  const [font, setFont] = useState(initial.font);
  const [baseSize, setBaseSize] = useState(initial.baseSize);
  const [radius, setRadius] = useState(initial.radius);
  const [spaceUnit, setSpaceUnit] = useState(initial.spaceUnit);
  const [result, setResult] = useState<PublishResult | null>(null);
  const [pending, startTransition] = useTransition();
  const [dark, setDark] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [exportFormat, setExportFormat] = useState<"css" | "tailwind" | "json">("css");
  const [copied, setCopied] = useState(false);

  const get = (p: string) => colors.find((c) => c.path === p)?.value ?? "#000000";
  const current: BrandKitState = { colors, font, baseSize, radius, spaceUnit };
  const dirty = JSON.stringify(current) !== JSON.stringify(initial);
  const upcoming = nextVersion(version);
  const fontOptions = fonts.some((f) => f.value === font) ? fonts : [{ label: "Custom", value: font }, ...fonts];
  const publish = () =>
    startTransition(async () => {
      setResult(await publishBrandKitAction(current));
    });

  const previewVars = useMemo(() => {
    const v: Record<string, string> = {};
    const palette = dark
      ? { ...Object.fromEntries(colors.map((c) => [c.path, c.value])), "color.canvas.default": "#0d1117", "color.canvas.subtle": "#151b23", "color.fg.default": "#f0f6fc", "color.fg.muted": "#9198a1", "color.border.default": "#3d444d" }
      : Object.fromEntries(colors.map((c) => [c.path, c.value]));
    for (const [p, val] of Object.entries(palette)) v[cssVar(p)] = val;
    v["--radius-md"] = `${radius}px`;
    v["--space-unit"] = `${spaceUnit}px`;
    v["--font-family-sans"] = font;
    v["--font-size-base"] = `${baseSize}px`;
    return v as React.CSSProperties;
  }, [colors, dark, radius, spaceUnit, font, baseSize]);

  const exportText = useMemo(() => {
    const flat: Record<string, string> = {
      ...Object.fromEntries(colors.map((c) => [c.path, c.value])),
      "radius.md": `${radius}px`,
      "space.unit": `${spaceUnit}px`,
      "font.family.sans": font,
      "font.size.base": `${baseSize}px`,
    };
    if (exportFormat === "css") {
      return `:root {\n${Object.entries(flat).map(([k, v]) => `  ${cssVar(k)}: ${v};`).join("\n")}\n}`;
    }
    if (exportFormat === "tailwind") {
      return `@theme {\n${colors.map((c) => `  --color-${c.path.replace(/^color\./, "").replace(/\./g, "-")}: ${c.value};`).join("\n")}\n  --radius-md: ${radius}px;\n  --spacing: ${spaceUnit / 2}px;\n  --font-sans: ${font};\n}`;
    }
    const tree: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(flat)) {
      const parts = k.split(".");
      let node = tree as Record<string, unknown>;
      parts.forEach((part, i) => {
        if (i === parts.length - 1) node[part] = { $value: v, $type: k.startsWith("color") ? "color" : k.includes("family") ? "fontFamily" : "dimension" };
        else node = (node[part] ??= {}) as Record<string, unknown>;
      });
    }
    return JSON.stringify(tree, null, 2);
  }, [colors, radius, spaceUnit, font, baseSize, exportFormat]);

  const fgOnCanvas = contrast(get("color.fg.default"), get("color.canvas.default"));
  const mutedOnCanvas = contrast(get("color.fg.muted"), get("color.canvas.default"));
  const whiteOnPrimary = contrast("#ffffff", get("color.action.primary"));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Brand Kit"
        badge={
          <>
            {version ? <Label tone="success">v{version} published</Label> : <Label>Not published yet</Label>}
            {dirty && <Label tone="attention">Unpublished changes</Label>}
          </>
        }
        description={
          <>
            The tokens every AI tool and every check in {orgName} follows.
            {publishedAt && <> Last published {new Date(publishedAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}.</>}
          </>
        }
        actions={
          <>
            <Button leadingIcon={<UploadIcon size={14} />} disabled title="Coming soon">Import from Figma</Button>
            <Button variant="primary" disabled={!dirty || pending || !canPublish} onClick={publish} aria-busy={pending}>
              {pending ? "Publishing…" : `Publish v${upcoming}`}
            </Button>
          </>
        }
      />

      {result?.ok && (
        <Flash tone="success">
          v{result.version} is live. The MCP server and the next CI run will use it.
          {result.demo && " (Demo mode: nothing was saved. Connect Supabase to keep versions.)"}
        </Flash>
      )}
      {result && !result.ok && <Flash tone="danger">{result.error}</Flash>}
      {!canPublish && <Flash tone="attention">You can edit and preview, but only owners and admins can publish.</Flash>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Editor */}
        <div className="flex min-w-0 flex-col gap-4 md:flex-row">
          <nav aria-label="Brand Kit sections" className="flex shrink-0 gap-1 overflow-x-auto md:w-44 md:flex-col">
            {sections.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSection(s)}
                aria-current={section === s ? "page" : undefined}
                className={cn(
                  "relative rounded-md px-3 py-1.5 text-left text-sm whitespace-nowrap text-fg hover:bg-btn-hover",
                  section === s && "bg-btn-hover font-semibold before:absolute before:top-1.5 before:bottom-1.5 before:-left-2 before:w-1 before:rounded-full before:bg-accent-emphasis max-md:before:hidden",
                )}
              >
                {s}
              </button>
            ))}
          </nav>

          <div className="min-w-0 flex-1">
            {section === "Colours" && (
              <Box>
                <BoxHeader>
                  <h2 className="text-sm font-semibold text-fg">Semantic colours</h2>
                  <span className="text-xs text-fg-muted">AI tools may only use these</span>
                </BoxHeader>
                {colors.map((c, i) => (
                  <div key={c.path} className="flex items-center gap-3 border-b border-line px-4 py-2.5 last:border-0">
                    <label className="relative h-8 w-8 shrink-0 cursor-pointer overflow-hidden rounded-md border border-line" style={{ background: c.value }}>
                      <span className="sr-only">Pick {c.path}</span>
                      <input
                        type="color"
                        value={c.value}
                        onChange={(e) => setColors((prev) => prev.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))}
                        className="absolute inset-0 cursor-pointer opacity-0"
                      />
                    </label>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-mono text-[13px] text-fg">{c.path}</div>
                      <div className="truncate text-xs text-fg-muted">{c.note}</div>
                    </div>
                    <div className="w-24 shrink-0">
                      <TextInput
                        aria-label={`${c.path} hex value`}
                        value={c.value}
                        onChange={(e) => {
                          const v = e.target.value;
                          setColors((prev) => prev.map((x, j) => (j === i ? { ...x, value: v } : x)));
                        }}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                ))}
                <div className="flex flex-wrap gap-2 border-t border-line bg-canvas-subtle px-4 py-3 text-xs">
                  <Label tone={fgOnCanvas >= 4.5 ? "success" : "danger"}>Text {fgOnCanvas.toFixed(1)}:1</Label>
                  <Label tone={mutedOnCanvas >= 4.5 ? "success" : "danger"}>Muted {mutedOnCanvas.toFixed(1)}:1</Label>
                  <Label tone={whiteOnPrimary >= 4.5 ? "success" : "attention"}>On primary {whiteOnPrimary.toFixed(1)}:1</Label>
                  <span className="self-center text-fg-muted">WCAG AA needs 4.5:1</span>
                </div>
              </Box>
            )}

            {section === "Typography" && (
              <Box className="flex flex-col gap-4 p-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="font" className="text-sm font-semibold text-fg">Font family</label>
                  <Select id="font" value={font} onChange={(e) => setFont(e.target.value)}>
                    {fontOptions.map((f) => (
                      <option key={f.label} value={f.value}>{f.label}</option>
                    ))}
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="size" className="text-sm font-semibold text-fg">Base size: {baseSize}px</label>
                  <input id="size" type="range" min={12} max={18} value={baseSize} onChange={(e) => setBaseSize(Number(e.target.value))} className="accent-[var(--br-accent-emphasis)]" />
                </div>
                <div className="rounded-md border border-line p-4" style={{ fontFamily: font }}>
                  {[2.29, 1.71, 1.43, 1.14, 1, 0.86].map((m, i) => (
                    <div key={m} className="flex items-baseline gap-4 py-1">
                      <span className="w-14 shrink-0 font-mono text-xs text-fg-muted">{Math.round(baseSize * m)}px</span>
                      <span className="truncate text-fg" style={{ fontSize: baseSize * m, fontWeight: i < 3 ? 600 : 400 }}>
                        {i < 3 ? "Fleet maintenance" : "Next service due in 12 days"}
                      </span>
                    </div>
                  ))}
                </div>
              </Box>
            )}

            {section === "Shape & spacing" && (
              <Box className="flex flex-col gap-5 p-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="radius" className="text-sm font-semibold text-fg">Corner radius: {radius}px</label>
                  <input id="radius" type="range" min={0} max={20} value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="accent-[var(--br-accent-emphasis)]" />
                  <div className="mt-2 flex gap-3">
                    {[0.5, 1, 2].map((m) => (
                      <div key={m} className="h-12 w-16 border-2 border-accent-emphasis bg-accent-subtle" style={{ borderRadius: radius * m }} />
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="space" className="text-sm font-semibold text-fg">Spacing unit: {spaceUnit}px</label>
                  <input id="space" type="range" min={4} max={12} step={2} value={spaceUnit} onChange={(e) => setSpaceUnit(Number(e.target.value))} className="accent-[var(--br-accent-emphasis)]" />
                  <div className="mt-2 flex items-end gap-2">
                    {[0.5, 1, 2, 3, 4, 5].map((m) => (
                      <div key={m} className="flex flex-col items-center gap-1">
                        <div className="bg-done/60" style={{ width: spaceUnit * m, height: spaceUnit * m }} />
                        <span className="font-mono text-[10px] text-fg-muted">{spaceUnit * m}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Box>
            )}

            {section === "Export" && (
              <Box>
                <BoxHeader className="justify-between">
                  <div className="flex gap-1">
                    {(["css", "tailwind", "json"] as const).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setExportFormat(f)}
                        className={cn("rounded-md px-2.5 py-1 text-xs font-medium", exportFormat === f ? "bg-canvas text-fg shadow-[var(--br-shadow-sm)] ring-1 ring-line" : "text-fg-muted hover:text-fg")}
                      >
                        {f === "css" ? "CSS variables" : f === "tailwind" ? "Tailwind v4" : "DTCG JSON"}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="invisible"
                      aria-label="Copy"
                      onClick={async () => {
                        await navigator.clipboard.writeText(exportText);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1500);
                      }}
                    >
                      {copied ? <CheckIcon size={16} className="text-success" /> : <CopyIcon size={16} />}
                    </Button>
                    <Button size="sm" variant="invisible" aria-label="Download"><DownloadIcon size={16} /></Button>
                  </div>
                </BoxHeader>
                <pre className="max-h-[460px] overflow-auto bg-canvas-subtle p-4 font-mono text-xs leading-5 text-fg">{exportText}</pre>
              </Box>
            )}
          </div>
        </div>

        {/* Live preview */}
        <div className="min-w-0 xl:sticky xl:top-4 xl:self-start">
          <Box>
            <BoxHeader className="justify-between">
              <h2 className="text-sm font-semibold text-fg">Live preview</h2>
              <div className="flex gap-1">
                <Button size="sm" variant="invisible" aria-label="Light" aria-pressed={!dark} onClick={() => setDark(false)} className={!dark ? "bg-btn-hover" : ""}><SunIcon size={14} /></Button>
                <Button size="sm" variant="invisible" aria-label="Dark" aria-pressed={dark} onClick={() => setDark(true)} className={dark ? "bg-btn-hover" : ""}><MoonIcon size={14} /></Button>
                <span className="mx-1 w-px bg-line" />
                <Button size="sm" variant="invisible" aria-label="Desktop" aria-pressed={!mobile} onClick={() => setMobile(false)} className={!mobile ? "bg-btn-hover" : ""}><DeviceDesktopIcon size={14} /></Button>
                <Button size="sm" variant="invisible" aria-label="Mobile" aria-pressed={mobile} onClick={() => setMobile(true)} className={mobile ? "bg-btn-hover" : ""}><DeviceMobileIcon size={14} /></Button>
              </div>
            </BoxHeader>
            <div className="flex justify-center bg-canvas-inset p-4">
              <div
                style={{ ...previewVars, fontFamily: "var(--font-family-sans)", fontSize: "var(--font-size-base)", background: "var(--color-canvas-default)", color: "var(--color-fg-default)" }}
                className={cn("w-full overflow-hidden border shadow-[var(--br-shadow-md)] transition-all", mobile ? "max-w-[340px]" : "")}
              >
                <PreviewApp mobile={mobile} />
              </div>
            </div>
          </Box>
        </div>
      </div>
    </div>
  );
}

/** A sample internal app rendered only with the Brand Kit's CSS variables. */
function PreviewApp({ mobile }: { mobile: boolean }) {
  const r = "var(--radius-md)";
  const s = (n: number) => `calc(var(--space-unit) * ${n})`;
  const border = "1px solid var(--color-border-default)";
  return (
    <div style={{ borderColor: "var(--color-border-default)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: s(1), padding: `${s(1.5)} ${s(2)}`, background: "var(--color-canvas-subtle)", borderBottom: border }}>
        <span style={{ width: 20, height: 20, borderRadius: r, background: "var(--color-action-primary)" }} />
        <strong>Fleet</strong>
        <span style={{ marginLeft: "auto", color: "var(--color-fg-muted)", fontSize: "0.86em" }}>Haul trucks</span>
      </div>
      <div style={{ padding: s(2), display: "flex", flexDirection: "column", gap: s(2) }}>
        <div>
          <div style={{ fontSize: "1.43em", fontWeight: 600 }}>Maintenance schedule</div>
          <div style={{ color: "var(--color-fg-muted)" }}>12 trucks due this week</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: s(1.5) }}>
          {[
            { k: "Available", v: "38", c: "var(--color-action-primary)" },
            { k: "In workshop", v: "7", c: "var(--color-danger-default)" },
          ].map((m) => (
            <div key={m.k} style={{ border, borderRadius: r, padding: s(1.5) }}>
              <div style={{ color: "var(--color-fg-muted)", fontSize: "0.86em" }}>{m.k}</div>
              <div style={{ fontSize: "1.71em", fontWeight: 600, color: m.c }}>{m.v}</div>
            </div>
          ))}
        </div>
        <div style={{ border, borderRadius: r, overflow: "hidden" }}>
          {["HT-204 · Brake inspection", "HT-117 · Tyre rotation", "HT-090 · Engine service"].map((row, i) => (
            <div key={row} style={{ display: "flex", alignItems: "center", gap: s(1), padding: `${s(1)} ${s(1.5)}`, borderTop: i ? border : undefined }}>
              <span style={{ flex: 1 }}>{row}</span>
              <span style={{ color: "var(--color-accent-default)", fontSize: "0.86em" }}>View</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: s(0.75) }}>
          <label style={{ fontWeight: 600, fontSize: "0.93em" }}>Notes for workshop</label>
          <div style={{ border, borderRadius: r, padding: `${s(0.75)} ${s(1.25)}`, color: "var(--color-fg-muted)" }}>Add a note…</div>
        </div>
        <div style={{ display: "flex", gap: s(1), justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button type="button" style={{ border, borderRadius: r, padding: `${s(0.75)} ${s(2)}`, background: "var(--color-canvas-subtle)", color: "var(--color-fg-default)", font: "inherit", fontWeight: 500 }}>
            Cancel
          </button>
          <button type="button" style={{ border: "1px solid rgba(0,0,0,.1)", borderRadius: r, padding: `${s(0.75)} ${s(2)}`, background: "var(--color-action-primary)", color: "#fff", font: "inherit", fontWeight: 500 }}>
            Schedule service
          </button>
        </div>
      </div>
    </div>
  );
}
