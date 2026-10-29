import type { Metadata } from "next";
import { KitGallery } from "@/components/kit-gallery";
import { PageHeader } from "@/components/dashboard/page-header";
import { SampleDataBadge } from "@/components/dashboard/sample-data";
import { RegistryManager } from "@/components/registry/registry-manager";
import { defaultBrandKit, fromDtcg } from "@/lib/brand-kit";
import { getOrgEngineConfig, listComponents } from "@/lib/data";
import { canAdmin, requireOrg } from "@/lib/session";

export const metadata: Metadata = { title: "Components" };

export default async function ComponentsPage() {
  const { org } = await requireOrg();
  const [{ rows, sample }, { config, published }] = await Promise.all([listComponents(org), getOrgEngineConfig(org)]);
  // The live library is styled by the published Brand Kit, so publishing a new primary colour re-colours every component here.
  const brandKit = published ? fromDtcg(config.tokens) : defaultBrandKit;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Components"
        badge={sample ? <SampleDataBadge /> : undefined}
        description={
          <>
            The components AI tools must use. <code className="font-mono">find_component</code> searches this registry, and the Checker flags raw
            elements they replace. The live library uses your published Brand Kit{config.tokenVersion && published ? ` (v${config.tokenVersion})` : ""}.
          </>
        }
      />
      <RegistryManager rows={rows} canEdit={canAdmin(org)} />
      <KitGallery
        brandKit={brandKit}
        brandKitLabel={published ? `Brand Kit v${config.tokenVersion}` : "Starter Brand Kit (not published)"}
        components={sample ? [] : rows.map((r) => ({ name: r.name, importPath: r.importPath, status: r.status }))}
      />
    </div>
  );
}
