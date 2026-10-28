"use client";

import { useMemo, useState, useTransition } from "react";
import { Download, Package, Plus, Search, Trash2, X } from "lucide-react";
import { Blankslate, Box, BoxHeader, Button, Flash, FormControl, Label, Select, TextInput, Textarea, type LabelTone } from "@brandrail/ui";
import {
  deleteComponentAction,
  importKitAction,
  saveComponentAction,
  type ActionResult,
  type ComponentInput,
} from "@/app/actions/components";

export type RegistryRow = {
  id: string;
  name: string;
  importPath: string;
  description?: string;
  status?: "draft" | "beta" | "stable" | "deprecated";
  replaces?: string[];
  aliases?: string[];
  usageRules?: string[];
  example?: string;
};

const statusTone: Record<string, LabelTone> = { stable: "success", beta: "accent", draft: "default", deprecated: "danger" };
const list = (s: string) => s.split(/[,\n]/).map((x) => x.trim()).filter(Boolean);

function Editor({ row, onClose, onDone }: { row: RegistryRow | null; onClose: () => void; onDone: (r: ActionResult) => void }) {
  const [form, setForm] = useState({
    name: row?.name ?? "",
    importPath: row?.importPath ?? "",
    status: row?.status ?? "stable",
    description: row?.description ?? "",
    replaces: (row?.replaces ?? []).join(", "),
    aliases: (row?.aliases ?? []).join(", "),
    usageRules: (row?.usageRules ?? []).join("\n"),
    example: row?.example ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = () =>
    start(async () => {
      const input: ComponentInput = {
        id: row?.id.startsWith("demo-") ? undefined : row?.id,
        name: form.name,
        importPath: form.importPath,
        status: form.status as ComponentInput["status"],
        description: form.description,
        replaces: list(form.replaces),
        aliases: list(form.aliases),
        usageRules: form.usageRules.split("\n").map((x) => x.trim()).filter(Boolean),
        example: form.example,
      };
      const r = await saveComponentAction(input);
      if (r.ok) onDone(r);
      else setError(r.error);
    });

  const remove = () =>
    row &&
    window.confirm(`Remove ${row.name} from the registry? AI tools and checks will stop suggesting it.`) &&
    start(async () => {
      const r = await deleteComponentAction(row.id);
      if (r.ok) onDone({ ok: true, message: `${row.name} removed.` });
      else setError(r.error);
    });

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={row ? `Edit ${row.name}` : "Add component"}>
      <button type="button" aria-label="Close" className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-lg flex-col border-l border-line bg-surface shadow-[var(--br-shadow-lg)]">
        <div className="flex h-12 items-center justify-between border-b border-line px-5">
          <h2 className="text-sm font-medium text-fg">{row ? `Edit ${row.name}` : "Add component"}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-1 text-fg-muted hover:bg-btn-hover hover:text-fg">
            <X size={16} />
          </button>
        </div>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
          {error && <Flash tone="danger">{error}</Flash>}
          <div className="grid grid-cols-[1fr_140px] gap-3">
            <FormControl label="Name" htmlFor="c-name" caption="As imported, e.g. DatePicker">
              <TextInput id="c-name" value={form.name} onChange={set("name")} className="font-mono" autoFocus />
            </FormControl>
            <FormControl label="Status" htmlFor="c-status">
              <Select id="c-status" value={form.status} onChange={set("status")}>
                <option value="stable">stable</option>
                <option value="beta">beta</option>
                <option value="draft">draft</option>
                <option value="deprecated">deprecated</option>
              </Select>
            </FormControl>
          </div>
          <FormControl label="Import path" htmlFor="c-import" caption='e.g. @acme/ui or "@/components/ui/button"'>
            <TextInput id="c-import" value={form.importPath} onChange={set("importPath")} className="font-mono" />
          </FormControl>
          <FormControl label="Description" htmlFor="c-desc" caption="One sentence. find_component searches this.">
            <Textarea id="c-desc" value={form.description} onChange={set("description")} rows={2} />
          </FormControl>
          <FormControl label="Replaces HTML elements" htmlFor="c-replaces" caption="Comma-separated. The Checker flags these raw tags, e.g. button, select, input[type=checkbox]">
            <TextInput id="c-replaces" value={form.replaces} onChange={set("replaces")} className="font-mono" />
          </FormControl>
          <FormControl label="Also known as" htmlFor="c-aliases" caption="Comma-separated names AI tools might ask for, e.g. Modal, Popup">
            <TextInput id="c-aliases" value={form.aliases} onChange={set("aliases")} />
          </FormControl>
          <FormControl label="Usage rules" htmlFor="c-rules" caption="One per line. Shown to AI tools before they use it.">
            <Textarea id="c-rules" value={form.usageRules} onChange={set("usageRules")} rows={3} />
          </FormControl>
          <FormControl label="Example" htmlFor="c-example">
            <Textarea id="c-example" value={form.example} onChange={set("example")} rows={4} className="font-mono text-xs" />
          </FormControl>
        </div>
        <div className="flex items-center gap-2 border-t border-line px-5 py-3">
          {row && !row.id.startsWith("demo-") && (
            <Button variant="danger" leadingIcon={<Trash2 size={13} />} onClick={remove} disabled={pending}>
              Remove
            </Button>
          )}
          <div className="ml-auto flex gap-2">
            <Button onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={save} disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RegistryManager({ rows, canEdit }: { rows: RegistryRow[]; canEdit: boolean }) {
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<RegistryRow | null | "new">(null);
  const [importing, setImporting] = useState(false);
  const [importPath, setImportPath] = useState("@brandrail/kit");
  const [notice, setNotice] = useState<ActionResult | null>(null);
  const [pending, start] = useTransition();

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => [r.name, r.importPath, r.description ?? "", ...(r.aliases ?? []), ...(r.replaces ?? [])].join(" ").toLowerCase().includes(s));
  }, [rows, q]);

  const doImport = () =>
    start(async () => {
      setNotice(await importKitAction(importPath));
      setImporting(false);
    });

  return (
    <>
      {notice && <Flash tone={notice.ok ? "success" : "danger"}>{notice.ok ? notice.message ?? "Done." : notice.error}</Flash>}
      <Box>
        <BoxHeader className="flex-wrap justify-between gap-3">
          <div className="relative w-full max-w-xs">
            <Search size={14} className="pointer-events-none absolute top-2.5 left-2.5 text-fg-subtle" />
            <TextInput aria-label="Filter components" placeholder="Filter by name, alias or tag" className="pl-8" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-2 text-xs text-fg-subtle">
              {rows.filter((r) => r.status === "stable").length} stable · {rows.length} total
            </span>
            {canEdit && (
              <>
                <Button size="sm" leadingIcon={<Download size={13} />} onClick={() => setImporting((v) => !v)}>
                  Import from UI kit
                </Button>
                <Button size="sm" variant="primary" leadingIcon={<Plus size={13} />} onClick={() => setEditing("new")}>
                  Add component
                </Button>
              </>
            )}
          </div>
        </BoxHeader>

        {importing && (
          <div className="flex flex-wrap items-end gap-3 border-b border-line bg-canvas-subtle px-4 py-3">
            <FormControl label="Import path for the kit's components" htmlFor="kit-path" caption="Adds Button, InputText, Dropdown, DatePicker and 16 more. Existing entries are kept.">
              <TextInput id="kit-path" value={importPath} onChange={(e) => setImportPath(e.target.value)} className="w-72 font-mono" />
            </FormControl>
            <Button variant="primary" onClick={doImport} disabled={pending} className="mb-6">
              {pending ? "Importing…" : "Import 20 components"}
            </Button>
          </div>
        )}

        {rows.length === 0 ? (
          <Blankslate
            icon={<Package size={28} />}
            title="No components yet"
            description="Components listed here are what AI tools must use, and raw elements they replace are flagged by the Checker."
            action={canEdit && <Button variant="primary" onClick={() => setImporting(true)}>Import from UI kit</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-line text-left text-xs text-fg-subtle">
                  <th className="px-4 py-2.5 font-normal">Component</th>
                  <th className="px-4 py-2.5 font-normal">Import</th>
                  <th className="hidden px-4 py-2.5 font-normal lg:table-cell">Replaces</th>
                  <th className="hidden px-4 py-2.5 font-normal xl:table-cell">Description</th>
                  <th className="px-4 py-2.5 font-normal">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => canEdit && setEditing(c)}
                    className={`border-b border-line last:border-0 hover:bg-canvas-subtle ${canEdit ? "cursor-pointer" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2 font-medium text-fg">
                        <Package size={14} className="text-fg-subtle" />
                        {c.name}
                      </span>
                      {c.aliases?.length ? <span className="ml-6 text-xs text-fg-subtle">aka {c.aliases.join(", ")}</span> : null}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-fg-muted">{c.importPath}</td>
                    <td className="hidden px-4 py-3 lg:table-cell">
                      <span className="flex flex-wrap gap-1">
                        {(c.replaces ?? []).map((t) => (
                          <code key={t} className="rounded bg-fg-muted/10 px-1.5 py-px font-mono text-[11px] text-fg-muted">&lt;{t}&gt;</code>
                        ))}
                      </span>
                    </td>
                    <td className="hidden max-w-sm truncate px-4 py-3 text-fg-muted xl:table-cell">{c.description}</td>
                    <td className="px-4 py-3">
                      <Label tone={statusTone[c.status ?? "stable"] ?? "default"}>{c.status ?? "stable"}</Label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Box>

      {editing && (
        <Editor
          row={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onDone={(r) => {
            setNotice(r);
            setEditing(null);
          }}
        />
      )}
    </>
  );
}
