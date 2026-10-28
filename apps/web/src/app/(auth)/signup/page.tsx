import Link from "next/link";
import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { SignupForm } from "@/components/auth/signup-form";
import { Divider, OAuthButtons } from "@/components/auth/oauth-buttons";

export const metadata: Metadata = { title: "Create your account" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email } = await searchParams;
  return (
    <AuthCard
      title="Create your account"
      subtitle="Free for one repo. No credit card needed."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-fg underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <OAuthButtons next="/onboarding" />
      <Divider />
      <SignupForm defaultEmail={email} />
    </AuthCard>
  );
}
