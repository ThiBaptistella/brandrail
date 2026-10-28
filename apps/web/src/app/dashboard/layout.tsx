import { DashboardHeader } from "@/components/dashboard/header";
import { DemoBanner } from "@/components/demo-banner";
import { requireOrg } from "@/lib/session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, org } = await requireOrg();
  return (
    <div className="min-h-dvh bg-canvas">
      <DemoBanner />
      <DashboardHeader user={user} org={org} />
      <main className="mx-auto w-full max-w-[1280px] px-4 py-6 md:px-6 md:py-8">{children}</main>
    </div>
  );
}
