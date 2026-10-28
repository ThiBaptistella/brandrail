import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthLayout from "@/app/(auth)/layout";
import { AuthCard } from "@/components/auth/auth-card";
import { OnboardingForm } from "@/components/onboarding-form";
import { getOrganizations, getUser } from "@/lib/session";

export const metadata: Metadata = { title: "Set up your organisation" };

export default async function OnboardingPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  const orgs = await getOrganizations();
  if (orgs.length > 0) redirect("/dashboard");

  return (
    <AuthLayout>
      <p className="mb-3 text-center text-xs tracking-wide text-fg-subtle uppercase">Step 1 of 2</p>
      <AuthCard
        title={`Welcome, ${user.name.split(" ")[0]}`}
        subtitle="Create an organisation for your Brand Kit, the repos and apps you check, and your team."
      >
        <OnboardingForm />
      </AuthCard>
    </AuthLayout>
  );
}
