import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LogoMark } from "@/components/logo";
import { DemoBanner } from "@/components/demo-banner";
import { OnboardingForm } from "@/components/onboarding-form";
import { getOrganizations, getUser } from "@/lib/session";

export const metadata: Metadata = { title: "Set up your organisation" };

export default async function OnboardingPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  const orgs = await getOrganizations();
  if (orgs.length > 0) redirect("/dashboard");

  return (
    <div className="min-h-dvh bg-canvas">
      <DemoBanner />
      <main className="mx-auto max-w-xl px-4 py-12">
        <div className="text-fg [--logo-ink:var(--br-canvas-default)]">
          <LogoMark size={40} />
        </div>
        <p className="mt-6 text-sm text-fg-muted">Step 1 of 2 · Welcome, {user.name.split(" ")[0]}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-fg">Set up your organisation</h1>
        <p className="mt-2 text-fg-muted">
          Your organisation holds your Brand Kit, the repos and apps you check, and your team. You can invite people
          later.
        </p>
        <div className="mt-8">
          <OnboardingForm />
        </div>
      </main>
    </div>
  );
}
