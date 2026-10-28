import { DashboardHeader } from "@/components/dashboard/header";
import { MobileNav, Sidebar } from "@/components/dashboard/sidebar";
import { DemoBanner } from "@/components/demo-banner";
import { InvitationBanner } from "@/components/dashboard/invitations";
import { myInvitations } from "@/lib/data";
import { requireOrg } from "@/lib/session";
import { getThemePref } from "@/lib/theme";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [{ user, org, orgs }, theme, invites] = await Promise.all([requireOrg(), getThemePref(), myInvitations()]);
  return (
    <div className="min-h-dvh bg-canvas">
      <Sidebar />
      <div className="md:pl-14">
        <DemoBanner />
        <DashboardHeader user={user} org={org} orgs={orgs} theme={theme} />
        <MobileNav />
        <main className="mx-auto w-full max-w-[1600px] px-4 py-6 md:px-6 lg:px-8">
          {invites.length > 0 && <InvitationBanner invites={invites} />}
          {children}
        </main>
      </div>
    </div>
  );
}
