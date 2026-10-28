import Link from "next/link";
import type { Metadata } from "next";
import { Box } from "@brandrail/ui";
import { SignupForm } from "@/components/auth/signup-form";
import { Divider, OAuthButtons } from "@/components/auth/oauth-buttons";

export const metadata: Metadata = { title: "Create your account" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email } = await searchParams;
  return (
    <>
      <h1 className="mb-1 text-center text-2xl font-light tracking-tight text-fg">Create your account</h1>
      <p className="mb-4 text-center text-sm text-fg-muted">Free for one repo. No credit card.</p>
      <Box className="bg-canvas-subtle p-4">
        <OAuthButtons next="/onboarding" />
        <Divider label="or sign up with email" />
        <SignupForm defaultEmail={email} />
      </Box>
      <Box className="mt-4 p-4 text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Sign in
        </Link>
      </Box>
    </>
  );
}
