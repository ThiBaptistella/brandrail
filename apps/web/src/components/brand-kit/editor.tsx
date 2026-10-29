"use client";

import { useMemo, useState, useTransition } from "react";
import {
  AlertTriangle,
  Check as CheckIcon,
  CircleX,
  Copy as CopyIcon,
  Download as DownloadIcon,
  Monitor as DeviceDesktopIcon,
  Moon as MoonIcon,
  Plus,
  RotateCcw,
  Search,
  Smartphone as DeviceMobileIcon,
  Sun as SunIcon,
  Trash2,
  Upload as UploadIcon,
} from "lucide-react";
import { auditBrandKit, contrastRatio, parseColor, type KitIssue } from "@brandrail/engine";
import { Box, BoxHeader, Button, Flash, Label, Select, TextInput, cn } from "@brandrail/ui";
import { publishBrandKitAction, type KitSource, type PublishResult } from "@/app/actions/brand-kit";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  cssVar,
  HEX,
  kitKey,
  nextVersion,
  pickRoles,
  spacingFromUnit,
  toDtcg,
  toFlat,
  uid,
  validateKit,
  type BrandKitState,
  type ColorToken,
  type ScaleStep,
} from "@/lib/brand-kit";
import { KitGallery, type GalleryComponent } from "@/components/kit-gallery";
import { ImportDialog, type AppliedImport } from "./import-dialog";

const FONT_PRESETS = [
  { label: "System UI", value: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif" },
  { label: "Inter", value: "Inter, system-ui, sans-serif" },
  { label: "Lato", value: "Lato, system-ui, sans-serif" },
  { label: "Georgia", value: "Georgia, 'Times New Roman', serif" },
  { label: "Monospace", value: "ui-monospace, SFMono-Regular, Menlo, monospace" },
];

const sections = ["Colours", "Typography", "Spacing & radius", "Other tokens", "Export"] as const;
type Section = (typeof sections)[number];

function contrast(a: string, b: string) {
  const x = parseColor(a);
  const y = parseColor(b);
  return x && y ? contrastRatio(x, y) : 0;
}

const pickerValue = (hex: string | undefined) => (hex && HEX.test(hex) ? hex.slice(0, 7) : "#888888");

export function BrandKitEditor({
  orgName,
  initial,
  version,
  publishedAt,
  canPublish,
  components = [],
}: {
  orgName: string;
  initial: BrandKitState;
  version: string | null;
  publishedAt: string | null;
  canPublish: boolean;
  components?: GalleryComponent[];
}) {
  const [previewTab, setPreviewTab] = useState<"app" | "components">("app");
  const [section, setSection] = useState<Section>("Colours");
  const [kit, setKit] = useState<BrandKitState>(initial);
  const [base, setBase] = useState<BrandKitState>(initial);
  const [source, setSource] = useState<{ kind: KitSource; summary: string } | null>(null);
  const [result, setResult] = useState<PublishResult | null>(null);
  const [pending, startTransition] = useTransition();
  const [dark, setDark] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [importing, setImporting] = useState(false);

  const dirty = kitKey(kit) !== kitKey(base);
  const invalid = validateKit(kit);
  const issues = useMemo(() => auditBrandKit(toDtcg(kit)), [kit]);
  const upcoming = nextVersion(result?.ok ? result.version : version);
  const update = <K extends keyof BrandKitState>(key: K, fn: (prev: BrandKitState[K]) => BrandKitState[K]) => setKit((k) => ({ ...k, [key]: fn(k[key]) }));

  const publish = (acceptIssues = false) =>
    startTransition(async () => {
      const r = await publishBrandKitAction(kit, { source: source?.kind ?? "manual", notes: source?.summary, acceptIssues });
      setResult(r);
      if (r.ok) {
        setBase(kit);
        setSource(null);
      }
    });

  const applyImport = (r: AppliedImport) => {
    setKit(r.state);
    setSource({ kind: r.source, summary: r.summary });
    setImporting(false);
    setResult(null);
    setSection("Colours");
  };

  const counts: Record<Section, number | undefined> = {
    Colours: kit.colors.length,
    Typography: kit.typeScale.length + kit.fonts.length,
    "Spacing & radius": kit.spacing.length + kit.radii.length,
    "Other tokens": kit.other.length || undefined,
    Export: undefined,
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Brand Kit"
        badge={
          <>
            {version || result?.ok ? <Label tone="success">v{result?.ok ? result.version : version} published</Label> : <Label>Not published yet</Label>}
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
            {dirty && (
              <Button variant="invisible" leadingIcon={<RotateCcw size={14} />} onClick={() => (setKit(base), setSource(null))}>
                Discard
              </Button>
            )}
            <Button leadingIcon={<UploadIcon size={14} />} onClick={() => setImporting(true)} disabled={!canPublish} title={canPublish ? undefined : "Only owners and admins can import"}>
              Import
            </Button>
            <Button variant="primary" disabled={!dirty || pending || !canPublish || !!invalid} onClick={() => publish()} aria-busy={pending} title={invalid ?? undefined}>
              {pending ? "Publishing…" : `Publish v${upcoming}`}
            </Button>
          </>
        }
      />

      {result?.ok && (
        <Flash tone="success">
          v{result.version} is live. The MCP server, rule files and the next CI run will use it.
          {result.demo && " (Demo mode: nothing was saved. Connect Supabase to keep versions.)"}
        </Flash>
      )}
      {result && !result.ok && (
        <Flash tone="danger" className="flex flex-wrap items-center justify-between gap-3">
          <span>{result.error}</span>
          {result.issues && (
            <Button size="sm" variant="danger" disabled={pending} onClick={() => publish(true)}>
              Publish anyway
            </Button>
          )}
        </Flash>
      )}
      {source && !result && <Flash tone="accent">{source.summary}. Review the tokens, then publish.</Flash>}
      {dirty && invalid && <Flash tone="attention">{invalid}</Flash>}
      {!canPublish && <Flash tone="attention">You can edit and preview, but only owners and admins can import or publish.</Flash>}
      <KitChecks issues={issues} onShow={() => setSection("Colours")} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-4 md:flex-row">
          <nav aria-label="Brand Kit sections" className="flex shrink-0 gap-1 overflow-x-auto md:w-44 md:flex-col">
            {sections.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSection(s)}
                aria-current={section === s ? "page" : undefined}
                className={cn(
                  "relative flex items-center justify-between gap-2 rounded-md px-3 py-1.5 text-left text-sm whitespace-nowrap text-fg hover:bg-btn-hover",
                  section === s && "bg-btn-hover font-medium",
                )}
              >
                {s}
                {counts[s] !== undefined && <span className="text-xs text-fg-subtle tabular-nums">{counts[s]}</span>}
              </button>
            ))}
          </nav>

          <div className="min-w-0 flex-1">
            {section === "Colours" && <ColorsSection colors={kit.colors} onChange={(fn) => update("colors", fn)} dark={dark} />}
            {section === "Typography" && <TypographySection kit={kit} update={update} />}
            {section === "Spacing & radius" && (
              <div className="flex flex-col gap-4">
                <ScaleEditor
                  title="Spacing scale"
                  hint="Padding, margin and gap must use these values."
                  steps={kit.spacing}
                  onChange={(fn) => update("spacing", fn)}
                  preview={(v) => <div className="h-3 rounded-sm bg-[var(--br-brand)]/60" style={{ width: Math.min(v, 160) }} />}
                  extra={
                    <div className="w-36">
                      <Select aria-label="Replace with a generated scale" value="" onChange={(e) => e.target.value && update("spacing", () => spacingFromUnit(Number(e.target.value)))} className="h-7 text-xs">
                        <option value="">Generate…</option>
                        <option value="4">4px grid · 4 → 48</option>
                        <option value="8">8px grid · 4 → 48</option>
                      </Select>
                    </div>
                  }
                />
                <ScaleEditor
                  title="Corner radius"
                  hint="border-radius must use one of these. 9999 means fully rounded."
                  steps={kit.radii}
                  onChange={(fn) => update("radii", fn)}
                  preview={(v) => <div className="h-6 w-10 border-2 border-accent-emphasis bg-accent-subtle" style={{ borderRadius: Math.min(v, 999) }} />}
                />
              </div>
            )}
            {section === "Other tokens" && <OtherSection kit={kit} update={update} />}
            {section === "Export" && <ExportSection kit={kit} />}
          </div>
        </div>

        <div className="min-w-0 xl:sticky xl:top-4 xl:self-start">
          <Box>
            <BoxHeader className="justify-between">
              <div className="flex gap-1" role="tablist" aria-label="Preview">
                {(
                  [
                    ["app", "Sample app"],
                    ["components", "Components"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={previewTab === id}
                    onClick={() => setPreviewTab(id)}
                    className={cn("rounded-md px-2.5 py-1 text-xs font-medium", previewTab === id ? "bg-btn-hover text-fg" : "text-fg-muted hover:text-fg")}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className={cn("flex gap-1", previewTab !== "app" && "hidden")}>
                <Button size="sm" variant="invisible" aria-label="Light" aria-pressed={!dark} onClick={() => setDark(false)} className={!dark ? "bg-btn-hover" : ""}><SunIcon size={14} /></Button>
                <Button size="sm" variant="invisible" aria-label="Dark" aria-pressed={dark} onClick={() => setDark(true)} className={dark ? "bg-btn-hover" : ""}><MoonIcon size={14} /></Button>
                <span className="mx-1 w-px bg-line" />
                <Button size="sm" variant="invisible" aria-label="Desktop" aria-pressed={!mobile} onClick={() => setMobile(false)} className={!mobile ? "bg-btn-hover" : ""}><DeviceDesktopIcon size={14} /></Button>
                <Button size="sm" variant="invisible" aria-label="Mobile" aria-pressed={mobile} onClick={() => setMobile(true)} className={mobile ? "bg-btn-hover" : ""}><DeviceMobileIcon size={14} /></Button>
              </div>
            </BoxHeader>
            {previewTab === "app" ? (
              <Preview kit={kit} dark={dark} mobile={mobile} />
            ) : (
              <KitGallery brandKit={kit} brandKitLabel={dirty ? "Brand Kit (draft)" : `Brand Kit${version ? ` v${version}` : ""}`} components={components} embedded />
            )}
          </Box>
        </div>
      </div>

      {importing && <ImportDialog current={kit} defaultMode={version || result?.ok ? "merge" : "replace"} onApply={applyImport} onClose={() => setImporting(false)} />}
    </div>
  );
}

/* ───────────────────────── Quality checks ───────────────────────── */

/** What's wrong with the Brand Kit for the people using apps built from it. Errors ask for confirmation at publish. */
function KitChecks({ issues, onShow }: { issues: KitIssue[]; onShow: () => void }) {
  const [open, setOpen] = useState(true);
  const errors = issues.filter((i) => i.severity === "error").length;
  const warnings = issues.length - errors;
  if (!issues.length) {
    return (
      <p className="flex items-center gap-2 text-xs text-fg-muted">
        <CheckIcon size={14} className="text-success" /> Brand Kit checks passed: readable text and buttons, and every status colour is set.
      </p>
    );
  }
  return (
    <Box>
      <BoxHeader className="justify-between">
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex items-center gap-2 text-left">
          <h2 className="text-[13px] font-medium text-fg">Brand Kit checks</h2>
          {errors > 0 && <Label tone="danger">{errors} {errors === 1 ? "error" : "errors"}</Label>}
          {warnings > 0 && <Label tone="attention">{warnings} {warnings === 1 ? "warning" : "warnings"}</Label>}
        </button>
        <span className="hidden text-xs text-fg-muted sm:inline">Every app built from this kit inherits these</span>
      </BoxHeader>
      {open && (
        <ul>
          {issues.map((i, n) => (
            <li key={n} className="flex items-start gap-2.5 border-b border-line px-4 py-2 text-sm last:border-0">
              {i.severity === "error" ? <CircleX size={15} className="mt-0.5 shrink-0 text-danger" /> : <AlertTriangle size={15} className="mt-0.5 shrink-0 text-attention" />}
              <span className="min-w-0 flex-1 text-fg">{i.message}</span>
              {i.paths.length > 0 && (
                <Button size="sm" variant="invisible" onClick={onShow} className="shrink-0 text-xs">
                  Show
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Box>
  );
}

/* ───────────────────────── Colours ───────────────────────── */

function ColorsSection({ colors, onChange, dark }: { colors: ColorToken[]; onChange: (fn: (c: ColorToken[]) => ColorToken[]) => void; dark: boolean }) {
  const [q, setQ] = useState("");
  const set = (id: string, patch: Partial<ColorToken>) => onChange((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const dupes = useMemo(() => {
    const seen = new Map<string, number>();
    for (const c of colors) seen.set(c.path, (seen.get(c.path) ?? 0) + 1);
    return seen;
  }, [colors]);
  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = needle ? colors.filter((c) => c.path.includes(needle) || c.note.toLowerCase().includes(needle) || c.value.includes(needle)) : colors;
    const m = new Map<string, ColorToken[]>();
    for (const c of list) {
      const g = c.path.split(".")[1] ?? "other";
      m.set(g, [...(m.get(g) ?? []), c]);
    }
    return [...m.entries()];
  }, [colors, q]);
  const roles = pickRoles(colors, dark);
  const checks = [
    { label: "Text", ratio: contrast(roles.fg.value, roles.canvas.value), min: 4.5 },
    { label: "Muted", ratio: contrast(roles.muted.value, roles.canvas.value), min: 4.5 },
    // Same choice as the kit mapping: whichever of the light background or text colour reads better on the fill.
    { label: "On primary", ratio: Math.max(contrast(pickRoles(colors).canvas.value, roles.primary.value), contrast(pickRoles(colors).fg.value, roles.primary.value)), min: 4.5 },
  ];
  const add = () => {
    const id = uid();
    let n = 1;
    while (colors.some((c) => c.path === `color.custom.new-${n}`)) n++;
    onChange((cs) => [...cs, { id, path: `color.custom.new-${n}`, value: "#888888", note: "" }]);
    setQ("");
    requestAnimationFrame(() => document.getElementById(`path-${id}`)?.focus());
  };

  return (
    <Box>
      <BoxHeader className="flex-wrap gap-2">
        <h2 className="text-[13px] font-medium text-fg">Semantic colours</h2>
        <span className="hidden text-xs text-fg-muted sm:inline">AI tools may only use these</span>
        <div className="ml-auto flex items-center gap-2">
          {colors.length > 8 && (
            <div className="relative">
              <Search size={13} className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-fg-subtle" />
              <TextInput aria-label="Filter colours" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter" className="h-7 w-36 pl-7 text-xs" />
            </div>
          )}
          <Button size="sm" leadingIcon={<Plus size={13} />} onClick={add}>Add</Button>
        </div>
      </BoxHeader>
      <div className="hidden grid-cols-[auto_minmax(0,1fr)_180px_28px] items-center gap-x-3 border-b border-line bg-canvas-subtle px-4 py-1.5 text-[11px] font-medium tracking-wide text-fg-subtle uppercase sm:grid">
        <span className="w-[52px]">Swatch</span>
        <span>Token</span>
        <span className="grid grid-cols-2 gap-1.5"><span>Light</span><span>Dark</span></span>
        <span />
      </div>
      {groups.length === 0 && <p className="px-4 py-6 text-center text-sm text-fg-muted">No colours match “{q}”.</p>}
      {groups.map(([group, list]) => (
        <div key={group}>
          {groups.length > 1 && <div className="border-b border-line px-4 pt-3 pb-1 font-mono text-[11px] text-fg-subtle">{group}</div>}
          {list.map((c) => (
            <div key={c.id} className="group grid grid-cols-[auto_minmax(0,1fr)_28px] items-center gap-x-3 border-b border-line px-4 py-1.5 last:border-0 sm:grid-cols-[auto_minmax(0,1fr)_180px_28px]">
              <div className="flex w-[52px] overflow-hidden rounded-md border border-line">
                <label className="relative h-8 w-1/2 cursor-pointer" style={{ background: c.value }} title={`Light ${c.value}`}>
                  <span className="sr-only">Pick light value for {c.path}</span>
                  <input type="color" value={pickerValue(c.value)} onChange={(e) => set(c.id, { value: e.target.value })} className="absolute inset-0 cursor-pointer opacity-0" />
                </label>
                <label
                  className={cn("relative h-8 w-1/2 cursor-pointer border-l border-line", !c.dark && "bg-[repeating-linear-gradient(45deg,transparent_0_4px,var(--br-line)_4px_5px)]")}
                  style={c.dark ? { background: c.dark } : undefined}
                  title={c.dark ? `Dark ${c.dark} (right-click to clear)` : "Add a dark value"}
                  onContextMenu={(e) => {
                    if (!c.dark) return;
                    e.preventDefault();
                    set(c.id, { dark: undefined });
                  }}
                >
                  <span className="sr-only">Pick dark value for {c.path}</span>
                  <input type="color" value={pickerValue(c.dark ?? c.value)} onChange={(e) => set(c.id, { dark: e.target.value })} className="absolute inset-0 cursor-pointer opacity-0" />
                </label>
              </div>
              <div className="flex min-w-0 flex-col gap-0.5">
                <input
                  id={`path-${c.id}`}
                  aria-label="Token name"
                  value={c.path}
                  onChange={(e) => set(c.id, { path: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                  className={cn(
                    "w-full truncate rounded border border-transparent bg-transparent px-1 py-0.5 font-mono text-[13px] text-fg hover:border-line focus:border-accent-emphasis focus:outline-none",
                    (dupes.get(c.path) ?? 0) > 1 && "border-danger text-danger",
                  )}
                />
                <input
                  aria-label={`${c.path} usage note`}
                  value={c.note}
                  placeholder="When to use it…"
                  onChange={(e) => set(c.id, { note: e.target.value })}
                  className="w-full truncate rounded border border-transparent bg-transparent px-1 py-0.5 text-xs text-fg-muted placeholder:text-fg-subtle hover:border-line focus:border-accent-emphasis focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-1.5 max-sm:order-last max-sm:col-span-2 max-sm:col-start-2 max-sm:mt-1">
                <TextInput aria-label={`${c.path} light value`} value={c.value} onChange={(e) => set(c.id, { value: e.target.value.trim() })} className={cn("h-7 px-2 font-mono text-xs", !HEX.test(c.value) && "border-danger")} />
                <TextInput
                  aria-label={`${c.path} dark value`}
                  value={c.dark ?? ""}
                  placeholder="same"
                  onChange={(e) => set(c.id, { dark: e.target.value.trim() || undefined })}
                  className={cn("h-7 px-2 font-mono text-xs placeholder:text-fg-subtle", c.dark && !HEX.test(c.dark) && "border-danger")}
                />
              </div>
              <button
                type="button"
                aria-label={`Remove ${c.path}`}
                onClick={() => onChange((cs) => cs.filter((x) => x.id !== c.id))}
                className="rounded-md p-1.5 text-fg-subtle opacity-60 group-hover:opacity-100 hover:bg-danger-subtle hover:text-danger focus:opacity-100"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-2 border-t border-line bg-canvas-subtle px-4 py-3 text-xs">
        {checks.map((c) => (
          <Label key={c.label} tone={c.ratio >= c.min ? "success" : "danger"}>
            {c.label} {c.ratio.toFixed(1)}:1
          </Label>
        ))}
        <span className="text-fg-muted">
          WCAG AA needs 4.5:1 · {dark ? "dark" : "light"} values · checked against {roles.canvas.path ?? "default"} background
        </span>
      </div>
    </Box>
  );
}

/* ───────────────────────── Typography ───────────────────────── */

function NumberCell({ value, onChange, label, placeholder }: { value: number | undefined; onChange: (v: number | undefined) => void; label: string; placeholder?: string }) {
  return (
    <TextInput
      aria-label={label}
      inputMode="decimal"
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(e) => {
        const v = e.target.value.trim();
        onChange(v === "" ? undefined : Number.isFinite(Number(v)) ? Number(v) : value);
      }}
      className="h-7 px-2 font-mono text-xs tabular-nums"
    />
  );
}

function TypographySection({ kit, update }: { kit: BrandKitState; update: <K extends keyof BrandKitState>(key: K, fn: (prev: BrandKitState[K]) => BrandKitState[K]) => void }) {
  const body = kit.fonts[0]?.value;
  return (
    <div className="flex flex-col gap-4">
      <Box>
        <BoxHeader>
          <h2 className="text-[13px] font-medium text-fg">Font families</h2>
          <Button size="sm" className="ml-auto" leadingIcon={<Plus size={13} />} onClick={() => update("fonts", (f) => [...f, { id: uid(), name: f.length ? `font-${f.length + 1}` : "sans", value: "" }])}>
            Add
          </Button>
        </BoxHeader>
        {kit.fonts.map((f, i) => (
          <div key={f.id} className="grid grid-cols-[110px_minmax(0,1fr)_28px] items-center gap-3 border-b border-line px-4 py-2 last:border-0">
            <TextInput aria-label="Font token name" value={f.name} onChange={(e) => update("fonts", (fs) => fs.map((x) => (x.id === f.id ? { ...x, name: e.target.value.toLowerCase() } : x)))} className="h-8 font-mono text-xs" />
            <div className="flex min-w-0 gap-2">
              <div className="min-w-0 flex-1">
                <TextInput aria-label={`font.family.${f.name} value`} value={f.value} onChange={(e) => update("fonts", (fs) => fs.map((x) => (x.id === f.id ? { ...x, value: e.target.value } : x)))} className="h-8 text-xs" style={{ fontFamily: f.value }} />
              </div>
              <div className="w-28 shrink-0">
                <Select aria-label="Font preset" value="" onChange={(e) => e.target.value && update("fonts", (fs) => fs.map((x) => (x.id === f.id ? { ...x, value: e.target.value } : x)))} className="h-8 text-xs">
                  <option value="">Presets</option>
                  {FONT_PRESETS.map((p) => (
                    <option key={p.label} value={p.value}>{p.label}</option>
                  ))}
                </Select>
              </div>
            </div>
            <button type="button" aria-label={`Remove font ${f.name}`} disabled={kit.fonts.length === 1} onClick={() => update("fonts", (fs) => fs.filter((x) => x.id !== f.id))} className="rounded-md p-1.5 text-fg-subtle hover:bg-danger-subtle hover:text-danger disabled:opacity-30">
              <Trash2 size={14} />
            </button>
            {i === 0 && <p className="col-span-3 -mt-1 text-[11px] text-fg-subtle">The first font is the body font in previews and exports.</p>}
          </div>
        ))}
      </Box>

      <Box>
        <BoxHeader>
          <h2 className="text-[13px] font-medium text-fg">Type scale</h2>
          <Button
            size="sm"
            className="ml-auto"
            leadingIcon={<Plus size={13} />}
            onClick={() =>
              update("typeScale", (t) => {
                const last = t[t.length - 1];
                const size = last ? Math.round(last.size * 1.25) : 14;
                return [...t, { id: uid(), name: `step-${t.length + 1}`, size, lineHeight: Math.round(size * 1.3) }];
              })
            }
          >
            Add step
          </Button>
        </BoxHeader>
        <div className="overflow-x-auto">
        <div className="min-w-[560px]">
        <div className="grid grid-cols-[80px_60px_60px_80px_minmax(0,1fr)_28px] gap-2 border-b border-line bg-canvas-subtle px-4 py-1.5 text-[11px] font-medium tracking-wide text-fg-subtle uppercase">
          <span>Name</span>
          <span>Size</span>
          <span>Line</span>
          <span>Weight</span>
          <span>Preview</span>
          <span />
        </div>
        {kit.typeScale.map((t) => {
          const set = (patch: Partial<typeof t>) => update("typeScale", (ts) => ts.map((x) => (x.id === t.id ? { ...x, ...patch } : x)));
          return (
            <div key={t.id} className="grid grid-cols-[80px_60px_60px_80px_minmax(0,1fr)_28px] items-center gap-2 border-b border-line px-4 py-2 last:border-0">
              <TextInput aria-label="Step name" value={t.name} onChange={(e) => set({ name: e.target.value.toLowerCase() })} className="h-7 px-2 font-mono text-xs" />
              <NumberCell label={`${t.name} size`} value={t.size} onChange={(v) => set({ size: v ?? 0 })} />
              <NumberCell label={`${t.name} line height`} value={t.lineHeight} onChange={(v) => set({ lineHeight: v })} placeholder="auto" />
              <Select aria-label={`${t.name} weight`} value={t.weight ?? ""} onChange={(e) => set({ weight: e.target.value ? Number(e.target.value) : undefined })} className="h-7 px-1.5 text-xs">
                <option value="">–</option>
                {[300, 400, 500, 600, 700, 800].map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </Select>
              <span className="truncate text-fg" style={{ fontFamily: body, fontSize: Math.min(t.size, 28), lineHeight: 1.25, fontWeight: t.weight }}
                title={t.size > 28 ? `${t.size}px (preview capped at 28px)` : undefined}>
                Haul truck schedule
              </span>
              <button type="button" aria-label={`Remove ${t.name}`} onClick={() => update("typeScale", (ts) => ts.filter((x) => x.id !== t.id))} className="rounded-md p-1.5 text-fg-subtle hover:bg-danger-subtle hover:text-danger">
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}
        </div>
        </div>
      </Box>
    </div>
  );
}

/* ───────────────────────── Spacing & radius ───────────────────────── */

function ScaleEditor({
  title,
  hint,
  steps,
  onChange,
  preview,
  extra,
}: {
  title: string;
  hint: string;
  steps: ScaleStep[];
  onChange: (fn: (s: ScaleStep[]) => ScaleStep[]) => void;
  preview: (v: number) => React.ReactNode;
  extra?: React.ReactNode;
}) {
  const set = (id: string, patch: Partial<ScaleStep>) => onChange((s) => s.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  return (
    <Box>
      <BoxHeader className="flex-wrap">
        <div>
          <h2 className="text-[13px] font-medium text-fg">{title}</h2>
          <p className="text-xs text-fg-muted">{hint}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {extra}
          <Button
            size="sm"
            leadingIcon={<Plus size={13} />}
            onClick={() =>
              onChange((s) => {
                const finite = s.filter((x) => x.value < 999);
                const last = finite[finite.length - 1]?.value ?? 4;
                return [...s, { id: uid(), name: String(s.length + 1), value: last * 2 }];
              })
            }
          >
            Add
          </Button>
        </div>
      </BoxHeader>
      <div className="grid gap-x-6 sm:grid-cols-2">
        {steps.map((s) => (
          <div key={s.id} className="grid grid-cols-[72px_72px_minmax(0,1fr)_28px] items-center gap-2 border-b border-line px-4 py-1.5">
            <TextInput aria-label={`${title} step name`} value={s.name} onChange={(e) => set(s.id, { name: e.target.value.toLowerCase() })} className="h-7 px-2 font-mono text-xs" />
            <div className="relative">
              <NumberCell label={`${s.name} px`} value={s.value} onChange={(v) => set(s.id, { value: v ?? 0 })} />
              <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-[10px] text-fg-subtle">px</span>
            </div>
            <div className="flex min-w-0 items-center">{preview(s.value)}</div>
            <button type="button" aria-label={`Remove ${s.name}`} onClick={() => onChange((xs) => xs.filter((x) => x.id !== s.id))} className="rounded-md p-1.5 text-fg-subtle hover:bg-danger-subtle hover:text-danger">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
      <div className="px-4 py-2 text-[11px] text-fg-subtle">
        CSS: {steps.slice(0, 3).map((s) => `var(--${title.startsWith("Spacing") ? "space" : "radius"}-${s.name})`).join(", ")}
        {steps.length > 3 && " …"}
      </div>
    </Box>
  );
}

/* ───────────────────────── Other ───────────────────────── */

function OtherSection({ kit, update }: { kit: BrandKitState; update: <K extends keyof BrandKitState>(key: K, fn: (prev: BrandKitState[K]) => BrandKitState[K]) => void }) {
  return (
    <Box>
      <BoxHeader>
        <div>
          <h2 className="text-[13px] font-medium text-fg">Other tokens</h2>
          <p className="text-xs text-fg-muted">Icon sizes, border widths, letter spacing and anything else imported. AI tools see them in get_design_tokens.</p>
        </div>
      </BoxHeader>
      {kit.other.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-fg-muted">Nothing here. Imports put tokens that aren&apos;t colours, fonts, sizes, spacing or radius here.</p>
      ) : (
        kit.other.map((o) => (
          <div key={o.id} className="grid grid-cols-[minmax(0,1fr)_120px_28px] items-center gap-3 border-b border-line px-4 py-1.5 last:border-0">
            <span className="truncate font-mono text-xs text-fg">{o.path}</span>
            <TextInput aria-label={`${o.path} value`} value={o.value} onChange={(e) => update("other", (xs) => xs.map((x) => (x.id === o.id ? { ...x, value: e.target.value } : x)))} className="h-7 px-2 font-mono text-xs" />
            <button type="button" aria-label={`Remove ${o.path}`} onClick={() => update("other", (xs) => xs.filter((x) => x.id !== o.id))} className="rounded-md p-1.5 text-fg-subtle hover:bg-danger-subtle hover:text-danger">
              <Trash2 size={14} />
            </button>
          </div>
        ))
      )}
    </Box>
  );
}

/* ───────────────────────── Export ───────────────────────── */

type ExportFormat = "css" | "tailwind" | "json";

export function exportKit(kit: BrandKitState, format: ExportFormat): string {
  const flat = toFlat(kit);
  if (format === "json") return JSON.stringify(toDtcg(kit), null, 2);
  if (format === "css") {
    const light = flat.map((t) => `  ${cssVar(t.path)}: ${t.value};`).join("\n");
    const darks = flat.filter((t) => t.dark).map((t) => `  ${cssVar(t.path)}: ${t.dark};`);
    return `:root {\n${light}\n}${darks.length ? `\n\n[data-theme="dark"] {\n${darks.join("\n")}\n}\n\n@media (prefers-color-scheme: dark) {\n  :root:not([data-theme="light"]) {\n${darks.map((l) => `  ${l}`).join("\n")}\n  }\n}` : ""}`;
  }
  // Tailwind v4: theme keys Tailwind turns into utilities (bg-*, p-*, rounded-*, text-*, font-*)
  const lines = [
    ...kit.colors.map((c) => `  --color-${c.path.replace(/^color\./, "").replace(/\./g, "-")}: var(${cssVar(c.path)});`),
    ...kit.fonts.map((f) => `  --font-${f.name}: var(--font-family-${f.name});`),
    ...kit.typeScale.flatMap((t) => [`  --text-${t.name}: ${t.size}px;`, ...(t.lineHeight ? [`  --text-${t.name}--line-height: ${t.lineHeight}px;`] : [])]),
    ...kit.radii.map((r) => `  --radius-${r.name}: ${r.value}px;`),
    ...kit.spacing.map((s) => `  --spacing-${s.name}: ${s.value}px;`),
  ];
  return `/* Paste after the CSS variables export, in your main stylesheet */\n@theme inline {\n  --color-*: initial;\n  --spacing-*: initial;\n  --radius-*: initial;\n  --text-*: initial;\n${lines.join("\n")}\n}`;
}

function ExportSection({ kit }: { kit: BrandKitState }) {
  const [format, setFormat] = useState<ExportFormat>("css");
  const [copied, setCopied] = useState(false);
  const text = useMemo(() => exportKit(kit, format), [kit, format]);
  const download = () => {
    const blob = new Blob([text], { type: format === "json" ? "application/json" : "text/css" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = format === "json" ? "tokens.json" : format === "tailwind" ? "brandrail-theme.css" : "brandrail-tokens.css";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  return (
    <Box>
      <BoxHeader className="justify-between">
        <div className="flex gap-1">
          {(["css", "tailwind", "json"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFormat(f)}
              className={cn("rounded-md px-2.5 py-1 text-xs font-medium", format === f ? "bg-canvas text-fg shadow-[var(--br-shadow-sm)] ring-1 ring-line" : "text-fg-muted hover:text-fg")}
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
              await navigator.clipboard.writeText(text);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? <CheckIcon size={16} className="text-success" /> : <CopyIcon size={16} />}
          </Button>
          <Button size="sm" variant="invisible" aria-label="Download" onClick={download}>
            <DownloadIcon size={16} />
          </Button>
        </div>
      </BoxHeader>
      <pre className="max-h-[520px] overflow-auto bg-canvas-subtle p-4 font-mono text-xs leading-5 text-fg">{text}</pre>
    </Box>
  );
}

/* ───────────────────────── Preview ───────────────────────── */

function Preview({ kit, dark, mobile }: { kit: BrandKitState; dark: boolean; mobile: boolean }) {
  const roles = pickRoles(kit.colors, dark);
  const near = (list: ScaleStep[], target: number, fallback: number) =>
    list.filter((x) => x.value > 0 && x.value < 999).reduce<number | null>((best, x) => (best === null || Math.abs(x.value - target) < Math.abs(best - target) ? x.value : best), null) ?? fallback;
  const radius = kit.radii.find((r) => r.name === "md")?.value ?? near(kit.radii, 6, 6);
  const unit = near(kit.spacing, 8, 8);
  const baseSize = (kit.typeScale.find((t) => t.name === "base") ?? kit.typeScale.find((t) => t.size >= 13 && t.size <= 16))?.size ?? 14;

  const vars = {
    "--p-canvas": roles.canvas.value,
    "--p-subtle": roles.subtle.value,
    "--p-fg": roles.fg.value,
    "--p-muted": roles.muted.value,
    "--p-border": roles.border.value,
    "--p-primary": roles.primary.value,
    "--p-accent": roles.accent.value,
    "--p-danger": roles.danger.value,
    "--p-radius": `${Math.min(radius, 24)}px`,
    "--p-unit": `${unit}px`,
  } as React.CSSProperties;
  const onPrimary = contrast("#ffffff", roles.primary.value) >= contrast("#111111", roles.primary.value) ? "#ffffff" : "#111111";

  return (
    <div className="flex flex-col">
      <div className="flex justify-center bg-canvas-inset p-4">
        <div style={{ ...vars, fontFamily: kit.fonts[0]?.value, fontSize: baseSize, background: "var(--p-canvas)", color: "var(--p-fg)" }} className={cn("w-full overflow-hidden border shadow-[var(--br-shadow-md)] transition-all", mobile && "max-w-[340px]")}>
          <PreviewApp mobile={mobile} onPrimary={onPrimary} />
        </div>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 border-t border-line px-4 py-2 text-[11px] text-fg-subtle">
        {(["primary", "canvas", "fg", "border"] as const).map((r) => (
          <span key={r}>
            {r}: <span className="font-mono text-fg-muted">{roles[r].path?.replace(/^color\./, "") ?? "default"}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function PreviewApp({ mobile, onPrimary }: { mobile: boolean; onPrimary: string }) {
  const r = "var(--p-radius)";
  const s = (n: number) => `calc(var(--p-unit) * ${n})`;
  const border = "1px solid var(--p-border)";
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: s(1), padding: `${s(1.5)} ${s(2)}`, background: "var(--p-subtle)", borderBottom: border }}>
        <span style={{ width: 20, height: 20, borderRadius: r, background: "var(--p-primary)" }} />
        <strong>Fleet</strong>
        <span style={{ marginLeft: "auto", color: "var(--p-muted)", fontSize: "0.86em" }}>Haul trucks</span>
      </div>
      <div style={{ padding: s(2), display: "flex", flexDirection: "column", gap: s(2) }}>
        <div>
          <div style={{ fontSize: "1.43em", fontWeight: 600 }}>Maintenance schedule</div>
          <div style={{ color: "var(--p-muted)" }}>12 trucks due this week</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: s(1.5) }}>
          {[
            { k: "Available", v: "38", c: "var(--p-primary)" },
            { k: "In workshop", v: "7", c: "var(--p-danger)" },
          ].map((m) => (
            <div key={m.k} style={{ border, borderRadius: r, padding: s(1.5) }}>
              <div style={{ color: "var(--p-muted)", fontSize: "0.86em" }}>{m.k}</div>
              <div style={{ fontSize: "1.71em", fontWeight: 600, color: m.c }}>{m.v}</div>
            </div>
          ))}
        </div>
        <div style={{ border, borderRadius: r, overflow: "hidden" }}>
          {["HT-204 · Brake inspection", "HT-117 · Tyre rotation", "HT-090 · Engine service"].map((row, i) => (
            <div key={row} style={{ display: "flex", alignItems: "center", gap: s(1), padding: `${s(1)} ${s(1.5)}`, borderTop: i ? border : undefined }}>
              <span style={{ flex: 1 }}>{row}</span>
              <span style={{ color: "var(--p-accent)", fontSize: "0.86em" }}>View</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: s(0.75) }}>
          <span style={{ fontWeight: 600, fontSize: "0.93em" }}>Notes for workshop</span>
          <div style={{ border, borderRadius: r, padding: `${s(0.75)} ${s(1.25)}`, color: "var(--p-muted)" }}>Add a note…</div>
        </div>
        <div style={{ display: "flex", gap: s(1), justifyContent: "flex-end", flexWrap: "wrap" }}>
          <span style={{ border, borderRadius: r, padding: `${s(0.75)} ${s(2)}`, background: "var(--p-subtle)", fontWeight: 500 }}>Cancel</span>
          <span style={{ border: "1px solid rgba(0,0,0,.1)", borderRadius: r, padding: `${s(0.75)} ${s(2)}`, background: "var(--p-primary)", color: onPrimary, fontWeight: 500 }}>Schedule service</span>
        </div>
      </div>
    </div>
  );
}
