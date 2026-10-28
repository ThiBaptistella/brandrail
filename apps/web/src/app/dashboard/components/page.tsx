import type { Metadata } from "next";
import { PackageIcon, SyncIcon, SearchIcon } from "@primer/octicons-react";
import { Box, BoxHeader, Button, Label, TextInput, type LabelTone } from "@brandrail/ui";
import { registryComponents } from "@/lib/mock";
import { KitGallery } from "@/components/kit-gallery";

export const metadata: Metadata = { title: "Components" };

const statusTone: Record<string, LabelTone> = { stable: "success", beta: "accent", draft: "default", deprecated: "danger" };

export default function ComponentsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
        <div>
          <h1 className="text-2xl font-semibold text-fg">Component registry</h1>
          <p className="mt-1 text-fg-muted">
            The components AI tools must use. <code className="font-mono text-sm">find_component</code> answers from this list.
          </p>
        </div>
        <div className="flex gap-2">
          <Button leadingIcon={<SyncIcon size={16} />}>Sync from Storybook</Button>
          <Button variant="primary">Add component</Button>
        </div>
      </div>

      <KitGallery />

      <Box>
        <BoxHeader className="flex-wrap justify-between gap-3">
          <div className="relative w-full max-w-xs">
            <span className="pointer-events-none absolute top-2 left-2.5 text-fg-muted">
              <SearchIcon size={16} />
            </span>
            <TextInput aria-label="Filter components" placeholder="Filter components" className="pl-8" />
          </div>
          <div className="flex gap-4 text-sm text-fg-muted">
            <span><strong className="text-fg">{registryComponents.filter((c) => c.status === "stable").length}</strong> stable</span>
            <span><strong className="text-fg">{registryComponents.filter((c) => c.status !== "stable").length}</strong> in progress</span>
          </div>
        </BoxHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-fg-muted">
                <th className="px-4 py-2 font-medium">Component</th>
                <th className="px-4 py-2 font-medium">Import</th>
                <th className="px-4 py-2 font-medium">Usage rules</th>
                <th className="px-4 py-2 text-right font-medium">Uses in code</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {registryComponents.map((c) => (
                <tr key={c.name} className="border-b border-line last:border-0 hover:bg-canvas-subtle">
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2 font-semibold text-accent">
                      <PackageIcon size={16} className="text-fg-muted" />
                      {c.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-fg-muted">{c.importPath}</td>
                  <td className="px-4 py-3 text-fg-muted">
                    {c.rules.length ? c.rules.join(" · ") : <span className="text-fg-subtle">None yet</span>}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-fg">{c.usage || "—"}</td>
                  <td className="px-4 py-3">
                    <Label tone={statusTone[c.status] ?? "default"}>{c.status}</Label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Box>
    </div>
  );
}
