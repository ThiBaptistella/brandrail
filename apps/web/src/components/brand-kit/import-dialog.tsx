"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { ArrowRight, FileJson, Link2, Minus, Plus, X } from "lucide-react";
import { diffTokens, importTokens, mergeTokens, type FlatToken, type ImportResult } from "@brandrail/engine";
import { Button, Flash, FormControl, Label, TextInput, Textarea, cn } from "@brandrail/ui";
import { importFromFigmaAction } from "@/app/actions/brand-kit";
import { fromDtcg, toDtcg, type BrandKitState } from "@/lib/brand-kit";

type Source = { origin: "figma" | "file"; label: string; data: unknown; notes: string[] };
export type AppliedImport = { state: BrandKitState; source: "figma" | "import"; summary: string };

const FORMAT_LABEL: Record<ImportResult["format"], string> = {
  "figma-variables": "Figma variables",
  "figma-styles": "Figma styles",
  dtcg: "DTCG tokens",
  "tokens-studio": "Tokens Studio",
  "mode-object": "Variables export",
};

const URL_KEY = "brandrail.figmaUrl";
const read = (k: string) => {
  try {
    return localStorage.getItem(k) ?? "";
  } catch {
    return "";
  }
};

export function ImportDialog({
  current,
  defaultMode,
  onApply,
  onClose,
}: {
  current: BrandKitState;
  /** "replace" until a kit has been published, so starter tokens don't mix with yours. */
  defaultMode: "merge" | "replace";
  onApply: (r: AppliedImport) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"figma" | "file">("figma");
  const [token, setToken] = useState("");
  const [url, setUrl] = useState(() => read(URL_KEY));
  const [pasted, setPasted] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<Source | null>(null);
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const readFigma = () =>
    start(async () => {
      setError(null);
      const r = await importFromFigmaAction({ token, url });
      if (!r.ok) return setError(r.error);
      try {
        localStorage.setItem(URL_KEY, url);
      } catch {}
      setSource({ origin: "figma", label: r.fileName, data: r.data, notes: r.notes });
    });

  const readJson = (text: string, label: string) => {
    setError(null);
    try {
      const data = JSON.parse(text) as unknown;
      importTokens(data); // validates
      setSource({ origin: "file", label, data, notes: [] });
    } catch (e) {
      setError(e instanceof SyntaxError ? `That isn't valid JSON: ${e.message}` : (e as Error).message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Import tokens">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-2xl flex-col border-l border-line bg-surface shadow-[var(--br-shadow-lg)]">
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-line px-5">
          <h2 className="text-sm font-medium text-fg">{source ? `Review import · ${source.label}` : "Import tokens"}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-1 text-fg-muted hover:bg-btn-hover hover:text-fg">
            <X size={16} />
          </button>
        </div>

        {source ? (
          <Review source={source} current={current} defaultMode={defaultMode} onBack={() => setSource(null)} onApply={onApply} />
        ) : (
          <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-5">
            <div className="flex gap-1 self-start rounded-md bg-canvas-subtle p-1 ring-1 ring-line">
              {(
                [
                  ["figma", "Figma file", Link2],
                  ["file", "JSON file", FileJson],
                ] as const
              ).map(([id, label, Icon]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  aria-pressed={tab === id}
                  className={cn("flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium", tab === id ? "bg-surface text-fg shadow-[var(--br-shadow-sm)] ring-1 ring-line" : "text-fg-muted hover:text-fg")}
                >
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>
            {error && <Flash tone="danger">{error}</Flash>}

            {tab === "figma" ? (
              <form
                className="flex flex-col gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  readFigma();
                }}
              >
                <FormControl label="Figma file link" htmlFor="fg-url" caption="The file that holds your variables or colour and text styles.">
                  <TextInput id="fg-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.figma.com/design/AbC123…/Design-System" autoFocus />
                </FormControl>
                <FormControl
                  label="Personal access token"
                  htmlFor="fg-token"
                  caption="Figma → Settings → Security → Personal access tokens. Give it “File content: read” (and “Variables: read” on Enterprise). Used for this request only, never stored."
                >
                  <TextInput id="fg-token" type="password" autoComplete="off" value={token} onChange={(e) => setToken(e.target.value)} placeholder="figd_…" className="font-mono" />
                </FormControl>
                <div className="rounded-md border border-line bg-canvas-subtle p-3 text-xs leading-5 text-fg-muted">
                  Variables come with their modes: a mode named <strong className="text-fg">Dark</strong> becomes each colour&apos;s dark value, and aliases are resolved. Figma only
                  serves variables over the API on Enterprise plans; on other plans colour and text styles are read instead, or export your variables as JSON and use the JSON tab.
                </div>
                <div>
                  <Button type="submit" variant="primary" disabled={pending || !url || !token} aria-busy={pending}>
                    {pending ? "Reading file…" : "Read file"}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col gap-4">
                <div
                  className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-line-strong px-4 py-8 text-center"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={async (e) => {
                    e.preventDefault();
                    const f = e.dataTransfer.files[0];
                    if (f) readJson(await f.text(), f.name);
                  }}
                >
                  <FileJson size={22} className="text-fg-subtle" />
                  <p className="text-sm text-fg">Drop a tokens file here</p>
                  <p className="max-w-sm text-xs text-fg-muted">W3C DTCG, Tokens Studio, a Figma variables export, or Figma&apos;s REST response. Read in your browser; nothing is uploaded until you publish.</p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".json,application/json"
                    className="sr-only"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) readJson(await f.text(), f.name);
                      e.target.value = "";
                    }}
                  />
                  <Button size="sm" onClick={() => fileRef.current?.click()} className="mt-1">
                    Choose file
                  </Button>
                </div>
                <FormControl label="…or paste JSON" htmlFor="fg-paste">
                  <Textarea id="fg-paste" rows={8} value={pasted} onChange={(e) => setPasted(e.target.value)} className="font-mono text-xs" placeholder='{ "color": { "brand": { "$type": "color", "$value": "#1f883d" } } }' />
                </FormControl>
                <div>
                  <Button variant="primary" disabled={!pasted.trim()} onClick={() => readJson(pasted, "Pasted JSON")}>
                    Read tokens
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Review({
  source,
  current,
  defaultMode,
  onBack,
  onApply,
}: {
  source: Source;
  current: BrandKitState;
  defaultMode: "merge" | "replace";
  onBack: () => void;
  onApply: (r: AppliedImport) => void;
}) {
  const [mode, setMode] = useState<"merge" | "replace">(defaultMode);
  const [primitives, setPrimitives] = useState(false);
  const [show, setShow] = useState<"all" | "added" | "changed" | "removed">("all");

  const imported = useMemo(() => importTokens(source.data, { includePrimitives: primitives }), [source.data, primitives]);
  const before = useMemo(() => toDtcg(current), [current]);
  const after = useMemo(() => (mode === "merge" ? mergeTokens(before, imported.tokens) : imported.tokens), [mode, before, imported.tokens]);
  const diff = useMemo(() => diffTokens(before, after), [before, after]);
  const total = diff.added.length + diff.changed.length + diff.removed.length;
  const notes = [...source.notes, ...imported.notes];

  const rows: Array<{ kind: "added" | "changed" | "removed"; t: FlatToken; before?: FlatToken }> = [
    ...diff.changed.map((c) => ({ kind: "changed" as const, t: c.after, before: c.before })),
    ...diff.added.map((t) => ({ kind: "added" as const, t })),
    ...diff.removed.map((t) => ({ kind: "removed" as const, t })),
  ].filter((r) => show === "all" || r.kind === show);

  return (
    <>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Label tone="accent">{FORMAT_LABEL[imported.format]}</Label>
          <span className="text-fg-muted">
            {imported.count} token{imported.count === 1 ? "" : "s"} read
            {imported.primitives > 0 && !primitives && <> · {imported.primitives} palette primitives left out</>}
          </span>
        </div>
        {notes.length > 0 && (
          <ul className="flex flex-col gap-1 rounded-md border border-line bg-canvas-subtle p-3 text-xs text-fg-muted">
            {notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <fieldset className="flex flex-col gap-2 rounded-md border border-line p-3">
            <legend className="px-1 text-xs font-medium text-fg">How to apply</legend>
            {(
              [
                ["merge", "Merge", "Update matching tokens and add new ones. Nothing is removed."],
                ["replace", "Replace", "The Brand Kit becomes exactly what's in the file."],
              ] as const
            ).map(([id, label, desc]) => (
              <label key={id} className="flex cursor-pointer gap-2 text-xs">
                <input type="radio" name="mode" checked={mode === id} onChange={() => setMode(id)} className="mt-0.5 accent-[var(--br-brand)]" />
                <span>
                  <span className="font-medium text-fg">{label}</span>
                  <span className="block text-fg-muted">{desc}</span>
                </span>
              </label>
            ))}
          </fieldset>
          <fieldset className="flex flex-col gap-2 rounded-md border border-line p-3">
            <legend className="px-1 text-xs font-medium text-fg">Palette</legend>
            <label className={cn("flex gap-2 text-xs", imported.primitives === 0 && !primitives ? "opacity-50" : "cursor-pointer")}>
              <input type="checkbox" checked={primitives} disabled={imported.primitives === 0 && !primitives} onChange={(e) => setPrimitives(e.target.checked)} className="mt-0.5 accent-[var(--br-brand)]" />
              <span>
                <span className="font-medium text-fg">Include primitives</span>
                <span className="block text-fg-muted">Raw ramps like gray.100–900 that semantic tokens point at. Leave them out so AI tools reach for the semantic names.</span>
              </span>
            </label>
          </fieldset>
        </div>

        <div className="flex flex-wrap gap-1 text-xs">
          {(
            [
              ["all", `All changes ${total}`],
              ["changed", `Changed ${diff.changed.length}`],
              ["added", `Added ${diff.added.length}`],
              ["removed", `Removed ${diff.removed.length}`],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={show === id}
              onClick={() => setShow(id)}
              className={cn("rounded-full px-2.5 py-1 font-medium", show === id ? "bg-btn-hover text-fg ring-1 ring-line" : "text-fg-muted hover:text-fg")}
            >
              {label}
            </button>
          ))}
          <span className="ml-auto self-center text-fg-subtle">{diff.unchanged} unchanged</span>
        </div>

        <div className="overflow-hidden rounded-md border border-line">
          {rows.length === 0 ? (
            <p className="p-6 text-center text-sm text-fg-muted">{total === 0 ? "Everything already matches the Brand Kit." : "Nothing in this filter."}</p>
          ) : (
            <ul className="max-h-[52vh] divide-y divide-line overflow-y-auto">
              {rows.slice(0, 400).map(({ kind, t, before: b }) => (
                <li key={`${kind}-${t.path}`} className="flex items-center gap-3 px-3 py-2 text-xs">
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                      kind === "added" && "bg-success-subtle text-success",
                      kind === "removed" && "bg-danger-subtle text-danger",
                      kind === "changed" && "bg-attention-subtle text-attention",
                    )}
                    title={kind}
                  >
                    {kind === "added" ? <Plus size={11} /> : kind === "removed" ? <Minus size={11} /> : <ArrowRight size={11} />}
                  </span>
                  <span className={cn("min-w-0 flex-1 truncate font-mono text-fg", kind === "removed" && "text-fg-muted line-through")}>{t.path}</span>
                  {b && <Value t={b} muted />}
                  {b && <ArrowRight size={12} className="shrink-0 text-fg-subtle" />}
                  <Value t={t} />
                </li>
              ))}
              {rows.length > 400 && <li className="px-3 py-2 text-xs text-fg-muted">…and {rows.length - 400} more</li>}
            </ul>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-line px-5 py-3">
        <Button variant="invisible" onClick={onBack}>
          Back
        </Button>
        <Button
          variant="primary"
          disabled={total === 0}
          onClick={() =>
            onApply({
              state: fromDtcg(after),
              source: source.origin === "figma" ? "figma" : "import",
              summary: `${mode === "merge" ? "Merged" : "Replaced with"} ${source.label}: ${diff.changed.length} changed, ${diff.added.length} added${diff.removed.length ? `, ${diff.removed.length} removed` : ""}`,
            })
          }
        >
          Apply {total} change{total === 1 ? "" : "s"}
        </Button>
      </div>
    </>
  );
}

function Value({ t, muted }: { t: FlatToken; muted?: boolean }) {
  return (
    <span className={cn("flex shrink-0 items-center gap-1.5 font-mono", muted ? "text-fg-subtle" : "text-fg")}>
      {t.type === "color" && (
        <span className="flex overflow-hidden rounded border border-line">
          <span className="h-4 w-4" style={{ background: t.value }} />
          {t.dark && <span className="h-4 w-4" style={{ background: t.dark }} />}
        </span>
      )}
      <span className="max-w-[140px] truncate">{t.value}</span>
    </span>
  );
}
