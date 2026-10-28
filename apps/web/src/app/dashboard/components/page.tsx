import type { Metadata } from "next";
import { KitGallery } from "@/components/kit-gallery";
import { PageHeader } from "@/components/dashboard/page-header";
import { SampleDataBadge } from "@/components/dashboard/sample-data";
import { RegistryManager } from "@/components/registry/registry-manager";
import { listComponents } from "@/lib/data";
import { requireOrg } from "@/lib/session";

export const metadata: Metadata = { title: "Components" };

export default async function ComponentsPage() {
  const { org } = await requireOrg();
  const { rows, sample } = await listComponents(org);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Components"
        badge={sample ? <SampleDataBadge /> : undefined}
        description={
          <>
            The components AI tools must use. <code className="font-mono">find_component</code> searches this registry, and the Checker flags raw
            elements they replace.
          </>
        }
      />
      <RegistryManager rows={rows} canEdit={org.role === "owner" || org.role === "admin"} />
      <KitGallery />
    </div>
  );
}
