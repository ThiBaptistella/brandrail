import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthLayout from "@/app/(auth)/layout";
import { AuthCard } from "@/components/auth/auth-card";
import { InvitationBanner } from "@/components/dashboard/invitations";
import { OnboardingForm } from "@/components/onboarding-form";
import { myInvitations } from "@/lib/data";
import { getOrganizations, getUser } from "@/lib/session";

export const metadata: Metadata = { title: "Set up your organisation" };

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const user = await getUser();
  if (!user) redirect("/login");
  const [orgs, invites, { new: adding }] = await Promise.all([getOrganizations(), myInvitations(), searchParams]);
  if (orgs.length > 0 && !adding) redirect("/dashboard");

  return (
    <AuthLayout>
      {orgs.length === 0 && <p className="mb-3 text-center text-xs tracking-wide text-fg-subtle uppercase">Step 1 of 2</p>}
      {invites.length > 0 && <InvitationBanner invites={invites} className="mb-4" />}
      <AuthCard
        title={orgs.length ? "New organisation" : `Welcome, ${user.name.split(" ")[0]}`}
        subtitle={
          invites.length
            ? "Join your team above, or create a separate organisation for your own Brand Kit."
            : "Create an organisation for your Brand Kit, the repos and apps you check, and your team."
        }
        footer={
          orgs.length ? (
            <Link href="/dashboard" className="font-medium text-fg underline-offset-4 hover:underline">
              Back to the dashboard
            </Link>
          ) : undefined
        }
      >
        <OnboardingForm />
      </AuthCard>
    </AuthLayout>
  );
}
