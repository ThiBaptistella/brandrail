import type { Metadata } from "next";
import { BrandKitEditor } from "@/components/brand-kit/editor";
import { requireOrg } from "@/lib/session";

export const metadata: Metadata = { title: "Brand Kit" };

export default async function BrandKitPage() {
  const { org } = await requireOrg();
  return <BrandKitEditor orgName={org.name} />;
}
